import { getRoomVertices } from '../../src/index.js';

import { createStoreProxy } from '../store/proxyHelper.js';

let rawCtx = null;
const ctx = createStoreProxy(() => rawCtx);

export function initRender2D(context) {
  rawCtx = context;
}

export function worldToSvg(x, z) {
  const innerW = ctx.view.width - ctx.view.pad * 2;
  const innerH = ctx.view.height - ctx.view.pad * 2;
  const zRatio = (z - ctx.view.minZ) / (ctx.view.maxZ - ctx.view.minZ);
  return {
    x: ctx.view.pad + ((x - ctx.view.minX) / (ctx.view.maxX - ctx.view.minX)) * innerW,
    y: ctx.view.height - ctx.view.pad - zRatio * innerH
  };
}

export function svgToWorld(x, y) {
  const innerW = ctx.view.width - ctx.view.pad * 2;
  const innerH = ctx.view.height - ctx.view.pad * 2;
  return {
    x: ctx.view.minX + ((x - ctx.view.pad) / innerW) * (ctx.view.maxX - ctx.view.minX),
    z: ctx.view.minZ + ((ctx.view.height - ctx.view.pad - y) / innerH) * (ctx.view.maxZ - ctx.view.minZ)
  };
}

export function inchesToWorld(value) {
  return Number(value || 0) / ctx.INCHES_PER_UNIT;
}

export function createSvgElement(name, attrs = {}) {
  const element = document.createElementNS(ctx.SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export function svgPointFromEvent(event) {
  const rect = ctx.svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * ctx.view.width,
    y: ((event.clientY - rect.top) / rect.height) * ctx.view.height
  };
}

export function wallPointAt(wall, t) {
  return {
    x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    z: wall.from[1] + (wall.to[1] - wall.from[1]) * t
  };
}

export function getWallProjectionT(wall, world) {
  const ax = wall.from[0];
  const az = wall.from[1];
  const bx = wall.to[0];
  const bz = wall.to[1];
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;
  if (!lengthSq) return 0.5;
  return Math.max(0.08, Math.min(0.92, ((world.x - ax) * dx + (world.z - az) * dz) / lengthSq));
}

export function renderPlan() {
  ctx.updateViewBounds();
  ctx.svg.innerHTML = '';

  const grid = createSvgElement('g', { class: 'grid-layer' });
  const gridStep = ctx.snapEnabled ? ctx.snapSize : 1;
  const startX = Math.ceil(ctx.view.minX / gridStep) * gridStep;
  const startZ = Math.ceil(ctx.view.minZ / gridStep) * gridStep;
  for (let x = startX; x <= ctx.view.maxX; x += gridStep) {
    const a = worldToSvg(x, ctx.view.minZ);
    const b = worldToSvg(x, ctx.view.maxZ);
    grid.appendChild(createSvgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: Math.abs(x) < 0.001 ? 'axis-line' : 'grid-line' }));
  }
  for (let z = startZ; z <= ctx.view.maxZ; z += gridStep) {
    const a = worldToSvg(ctx.view.minX, z);
    const b = worldToSvg(ctx.view.maxX, z);
    grid.appendChild(createSvgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: Math.abs(z) < 0.001 ? 'axis-line' : 'grid-line' }));
  }
  ctx.svg.appendChild(grid);

  ctx.currentRooms().forEach((room) => renderRoom(room));
  ctx.referenceFloorWalls().forEach((wall) => renderReferenceWall(wall));
  ctx.currentWalls().forEach((wall) => renderWall(wall));
  ctx.currentRooms().forEach((room) => renderRoomInteraction(room));
  ctx.currentOpenings().forEach((opening) => renderOpening(opening));

  ctx.currentRoofs().forEach((roof) => renderRoof(roof));
  ctx.currentStairs().forEach((stairs) => renderStairs(stairs));
  ctx.currentFences().forEach((fence) => renderFence(fence));
  (ctx.testMap.floorplan.fenceGates || []).filter(gate => gate.floorId === ctx.testMap.floorplan.currentFloorId).forEach(gate => renderFenceGate(gate));

  // 绘制没有墙体的地板边缘热区线段，用来实现画栅栏悬浮预览和点击自动吸附
  ctx.getFreeFloorEdges().forEach((edge, index) => {
    const a = worldToSvg(edge.p1.x, edge.p1.z);
    const b = worldToSvg(edge.p2.x, edge.p2.z);
    const edgeLine = createSvgElement('line', {
      class: 'floor-edge-hit-line',
      x1: a.x, y1: a.y,
      x2: b.x, y2: b.y,
      stroke: 'transparent',
      'stroke-width': 16,
      style: 'cursor: pointer;',
      'data-edge-from-x': edge.p1.x,
      'data-edge-from-z': edge.p1.z,
      'data-edge-to-x': edge.p2.x,
      'data-edge-to-z': edge.p2.z,
      'data-edge-index': index
    });
    ctx.svg.appendChild(edgeLine);
  });

  if (ctx.drawStart) {
    const a = worldToSvg(ctx.drawStart[0], ctx.drawStart[1]);
    ctx.svg.appendChild(createSvgElement('circle', { class: 'draw-anchor', cx: a.x, cy: a.y, r: 6 }));
  }

  ctx.currentItems().forEach((item) => renderPlanItem(item));
  const selectedRoom = ctx.selectedRoomId ? ctx.testMap.getRoom(ctx.selectedRoomId) : null;
  if (selectedRoom) renderSelectedRoomHandles(selectedRoom);
  const selectedRoof = ctx.selectedRoofId ? ctx.testMap.getRoof?.(ctx.selectedRoofId) : null;
  if (selectedRoof) renderSelectedRoofHandles(selectedRoof);
  const selectedFence = ctx.selectedFenceId ? ctx.testMap.getFence(ctx.selectedFenceId) : null;
  if (selectedFence) renderSelectedFenceHandles(selectedFence);
}

export function renderRoom(room) {
  const points = getRoomVertices(room).map((point) => worldToSvg(point.x, point.z));
  const polygon = createSvgElement('polygon', {
    class: `room-rect ${ctx.selectedRoomId === room.id ? 'selected' : ''}`,
    points: points.map((point) => `${point.x},${point.y}`).join(' '),
    'data-room-id': room.id
  });
  ctx.attachContextMenuTrigger(polygon, () => ({ type: 'room', id: room.id }));
  polygon.addEventListener('click', (event) => {
    if (ctx.mode !== 'select') return;
    event.stopPropagation();
    ctx.selectRoom(room.id);
  });
  ctx.svg.appendChild(polygon);
}

export function renderRoomHandles(room, a, b) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const handles = [
    { side: 'north', x: (minX + maxX) / 2, y: minY },
    { side: 'east', x: maxX, y: (minY + maxY) / 2 },
    { side: 'south', x: (minX + maxX) / 2, y: maxY },
    { side: 'west', x: minX, y: (minY + maxY) / 2 }
  ];
  handles.forEach((handle) => {
    const node = createSvgElement('rect', {
      class: `room-resize-handle handle-${handle.side}`,
      x: handle.x - 8,
      y: handle.y - 8,
      width: 16,
      height: 16,
      rx: 4,
      'data-room-handle': handle.side
    });
    node.addEventListener('pointerdown', (event) => ctx.beginRoomResize(event, room.id, handle.side));
    ctx.svg.appendChild(node);
  });
}

export function renderRoomInteraction(room) {
  if (ctx.mode !== 'select') return;
  const points = getRoomVertices(room).map((point) => worldToSvg(point.x, point.z));
  const polygon = createSvgElement('polygon', {
    class: 'room-hit-rect',
    points: points.map((point) => `${point.x},${point.y}`).join(' '),
    'data-room-hit-id': room.id,
    fill: 'rgba(54, 194, 255, 0.001)'
  });
  ctx.attachContextMenuTrigger(polygon, () => ({ type: 'room', id: room.id }));
  polygon.addEventListener('pointerdown', (event) => ctx.beginRoomDrag(event, room.id));
  polygon.addEventListener('click', (event) => {
    if (ctx.mode !== 'select') return;
    event.stopPropagation();
    ctx.selectRoom(room.id);
  });
  ctx.svg.appendChild(polygon);
}

export function renderSelectedRoomHandles(room) {
  if (room.locked) return;
  const a = worldToSvg(room.x - room.width / 2, room.z - room.depth / 2);
  const b = worldToSvg(room.x + room.width / 2, room.z + room.depth / 2);
  renderRoomHandles(room, a, b);
}

export function renderReferenceWall(wall) {
  const a = worldToSvg(wall.from[0], wall.from[1]);
  const b = worldToSvg(wall.to[0], wall.to[1]);
  ctx.svg.appendChild(createSvgElement('line', {
    class: 'reference-wall-line',
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y
  }));
}

export function renderRoofHandles(roof, a, b) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const handles = [
    { side: 'north', x: (minX + maxX) / 2, y: minY },
    { side: 'east', x: maxX, y: (minY + maxY) / 2 },
    { side: 'south', x: (minX + maxX) / 2, y: maxY },
    { side: 'west', x: minX, y: (minY + maxY) / 2 }
  ];
  handles.forEach((handle) => {
    const node = createSvgElement('rect', {
      class: `roof-resize-handle handle-${handle.side}`,
      x: handle.x - 8,
      y: handle.y - 8,
      width: 16,
      height: 16,
      rx: 4,
      'data-roof-handle': handle.side
    });
    node.addEventListener('pointerdown', (event) => ctx.beginRoofResize(event, roof.id, handle.side));
    ctx.svg.appendChild(node);
  });
}

export function renderSelectedRoofHandles(roof) {
  if (roof.locked) return;
  const a = worldToSvg((roof.x || 0) - (roof.width || 6) / 2, (roof.z || 0) - (roof.depth || 6) / 2);
  const b = worldToSvg((roof.x || 0) + (roof.width || 6) / 2, (roof.z || 0) + (roof.depth || 6) / 2);
  renderRoofHandles(roof, a, b);
}

export function renderWall(wall) {
  const a = worldToSvg(wall.from[0], wall.from[1]);
  const b = worldToSvg(wall.to[0], wall.to[1]);
  const line = createSvgElement('line', {
    class: `wall-line ${ctx.selectedWallId === wall.id ? 'selected' : ''}`,
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    stroke: wall.color || '#f9fbff',
    'data-wall-id': wall.id
  });
  line.addEventListener('pointerdown', (event) => {
    ctx.beginWallDrag(event, wall.id);
  });
  line.addEventListener('click', (event) => {
    if (ctx.mode === 'delete-wall' || ctx.isAddOpeningMode() || ctx.mode === 'select') {
      event.stopPropagation();
      const point = svgPointFromEvent(event);
      const world = svgToWorld(point.x, point.y);
      if (ctx.mode === 'delete-wall') {
        ctx.pushHistory();
        ctx.testMap.deleteWall(wall.id);
        ctx.clearSelection();
        ctx.refreshShadows();
        renderPlan();
      } else if (ctx.isAddOpeningMode()) {
        ctx.pushHistory();
        const openingMode = ctx.getOpeningModeInfo();
        const opening = ctx.testMap.addOpening(wall.id, openingMode.type, getWallProjectionT(wall, world), openingMode.shape);
        ctx.refreshShadows();
        ctx.selectOpening(opening?.id || null);
        ctx.switchToSelectMode();
      } else if (ctx.mode === 'select') {
        ctx.selectWall(wall.id);
      }
    }
  });
  ctx.svg.appendChild(line);
}

export function renderOpening(opening) {
  const wall = ctx.testMap.getWall(opening.wallId);
  if (!wall) return;
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz) || 1;
  const halfT = (opening.width || 1) / length / 2;
  const start = wallPointAt(wall, Math.max(0, (opening.t ?? 0.5) - halfT));
  const end = wallPointAt(wall, Math.min(1, (opening.t ?? 0.5) + halfT));
  const a = worldToSvg(start.x, start.z);
  const b = worldToSvg(end.x, end.z);
  const line = createSvgElement('line', {
    class: `opening-line ${opening.type === 'door' ? 'door-line' : 'window-line'} ${ctx.selectedOpeningId === opening.id ? 'selected' : ''}`,
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    'data-opening-id': opening.id
  });
  ctx.attachContextMenuTrigger(line, () => ({ type: 'opening', id: opening.id }));
  line.addEventListener('pointerdown', (event) => ctx.beginOpeningDrag(event, opening.id));
  line.addEventListener('click', (event) => {
    if (ctx.mode === 'delete-wall') {
      event.stopPropagation();
      ctx.pushHistory();
      ctx.testMap.deleteOpening(opening.id);
      ctx.clearSelection();
      ctx.refreshShadows();
      renderPlan();
    }
  });
  ctx.svg.appendChild(line);
}

export function renderRoof(roof) {
  const a = worldToSvg((roof.x || 0) - (roof.width || 6) / 2, (roof.z || 0) - (roof.depth || 6) / 2);
  const b = worldToSvg((roof.x || 0) + (roof.width || 6) / 2, (roof.z || 0) + (roof.depth || 6) / 2);
  
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  const centerX = minX + w / 2;
  const centerY = minY + h / 2;
  
  const group = createSvgElement('g', {
    class: `roof-group ${ctx.selectedRoofId === roof.id ? 'selected' : ''}`,
    'data-roof-id': roof.id
  });
  
  const rect = createSvgElement('rect', {
    class: 'roof-rect',
    x: minX,
    y: minY,
    width: w,
    height: h,
    rx: 4,
    fill: roof.color || '#b75b54'
  });
  group.appendChild(rect);
  
  const subtype = roof.subtype || roof.type || 'gable';
  const strokeColor = 'rgba(255,255,255,0.6)';
  const strokeWidth = 1.5;
  
  if (subtype === 'gable') {
    const line = createSvgElement('line', {
      x1: centerX, y1: minY,
      x2: centerX, y2: minY + h,
      stroke: strokeColor,
      'stroke-width': strokeWidth
    });
    group.appendChild(line);
  } else if (subtype === 'shed') {
    const arrow = createSvgElement('path', {
      d: `M ${minX + w * 0.8} ${centerY} L ${minX + w * 0.2} ${centerY} M ${minX + w * 0.3} ${centerY - 6} L ${minX + w * 0.2} ${centerY} M ${minX + w * 0.3} ${centerY + 6} L ${minX + w * 0.2} ${centerY}`,
      stroke: strokeColor,
      fill: 'none',
      'stroke-width': strokeWidth
    });
    group.appendChild(arrow);
  } else if (subtype === 'arch') {
    const step = w / 6;
    for (let i = 1; i < 6; i++) {
      const line = createSvgElement('line', {
        x1: minX + step * i, y1: minY,
        x2: minX + step * i, y2: minY + h,
        stroke: strokeColor,
        'stroke-width': 1,
        'stroke-dasharray': '2,2'
      });
      group.appendChild(line);
    }
  } else if (subtype === 'dome') {
    const circle = createSvgElement('circle', {
      cx: centerX, cy: centerY,
      r: Math.min(w, h) * 0.3,
      stroke: strokeColor,
      fill: 'none',
      'stroke-width': strokeWidth,
      'stroke-dasharray': '2,2'
    });
    const lineH = createSvgElement('line', {
      x1: minX, y1: centerY, x2: minX + w, y2: centerY,
      stroke: strokeColor, 'stroke-width': 1, 'stroke-dasharray': '4,4'
    });
    const lineV = createSvgElement('line', {
      x1: centerX, y1: minY, x2: centerX, y2: minY + h,
      stroke: strokeColor, 'stroke-width': 1, 'stroke-dasharray': '4,4'
    });
    group.appendChild(circle);
    group.appendChild(lineH);
    group.appendChild(lineV);
  } else if (subtype === 'trapezoid') {
    const innerW = w * 0.5;
    const innerH = h * 0.5;
    const innerRect = createSvgElement('rect', {
      x: centerX - innerW / 2,
      y: centerY - innerH / 2,
      width: innerW,
      height: innerH,
      stroke: strokeColor,
      fill: 'none',
      'stroke-width': strokeWidth
    });
    group.appendChild(innerRect);
    const lines = [
      { x1: minX, y1: minY, x2: centerX - innerW / 2, y2: centerY - innerH / 2 },
      { x1: minX + w, y1: minY, x2: centerX + innerW / 2, y2: centerY - innerH / 2 },
      { x1: minX + w, y1: minY + h, x2: centerX + innerW / 2, y2: centerY + innerH / 2 },
      { x1: minX, y1: minY + h, x2: centerX - innerW / 2, y2: centerY + innerH / 2 }
    ];
    lines.forEach(l => {
      const line = createSvgElement('line', {
        x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2,
        stroke: strokeColor, 'stroke-width': strokeWidth
      });
      group.appendChild(line);
    });
  } else if (subtype === 'hip') {
    if (w > h) {
      const rw = (w - h) / 2;
      const lx = centerX - rw;
      const rx = centerX + rw;
      const ridge = createSvgElement('line', {
        x1: lx, y1: centerY, x2: rx, y2: centerY,
        stroke: strokeColor, 'stroke-width': strokeWidth
      });
      group.appendChild(ridge);
      group.appendChild(createSvgElement('line', { x1: minX, y1: minY, x2: lx, y2: centerY, stroke: strokeColor, 'stroke-width': strokeWidth }));
      group.appendChild(createSvgElement('line', { x1: minX, y1: minY + h, x2: lx, y2: centerY, stroke: strokeColor, 'stroke-width': strokeWidth }));
      group.appendChild(createSvgElement('line', { x1: minX + w, y1: minY, x2: rx, y2: centerY, stroke: strokeColor, 'stroke-width': strokeWidth }));
      group.appendChild(createSvgElement('line', { x1: minX + w, y1: minY + h, x2: rx, y2: centerY, stroke: strokeColor, 'stroke-width': strokeWidth }));
    } else {
      const rh = (h - w) / 2;
      const ty = centerY - rh;
      const by = centerY + rh;
      const ridge = createSvgElement('line', {
        x1: centerX, y1: ty, x2: centerX, y2: by,
        stroke: strokeColor, 'stroke-width': strokeWidth
      });
      group.appendChild(ridge);
      group.appendChild(createSvgElement('line', { x1: minX, y1: minY, x2: centerX, y2: ty, stroke: strokeColor, 'stroke-width': strokeWidth }));
      group.appendChild(createSvgElement('line', { x1: minX + w, y1: minY, x2: centerX, y2: ty, stroke: strokeColor, 'stroke-width': strokeWidth }));
      group.appendChild(createSvgElement('line', { x1: minX, y1: minY + h, x2: centerX, y2: by, stroke: strokeColor, 'stroke-width': strokeWidth }));
      group.appendChild(createSvgElement('line', { x1: minX + w, y1: minY + h, x2: centerX, y2: by, stroke: strokeColor, 'stroke-width': strokeWidth }));
    }
  } else if (subtype === 'flat') {
    const border = createSvgElement('rect', {
      x: minX + 4, y: minY + 4,
      width: w - 8, height: h - 8,
      stroke: strokeColor, fill: 'none',
      'stroke-width': 1, 'stroke-dasharray': '2,2'
    });
    group.appendChild(border);
  }
  
  rect.addEventListener('pointerdown', (event) => ctx.beginStructureDrag(event, 'roof', roof.id));
  rect.addEventListener('click', (event) => {
    if (ctx.mode === 'select') {
      event.stopPropagation();
      ctx.selectRoof(roof.id);
    }
  });
  ctx.attachContextMenuTrigger(rect, () => ({ type: 'roof', id: roof.id }));
  ctx.svg.appendChild(group);
}

export function renderStairs(stairs) {
  const subtype = stairs.subtype || 'straight';
  let wVal = stairs.width || 1.2;
  let dVal = stairs.depth || 3.2;
  if (subtype === 'spiral') {
    const size = Math.max(wVal, dVal);
    wVal = size;
    dVal = size;
  }
  const a = worldToSvg((stairs.x || 0) - wVal / 2, (stairs.z || 0) - dVal / 2);
  const b = worldToSvg((stairs.x || 0) + wVal / 2, (stairs.z || 0) + dVal / 2);
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  const centerX = minX + w / 2;
  const centerY = minY + h / 2;
  
  const flipX = stairs.mirrored ? -1 : 1;
  const rotateStr = `rotate(${((stairs.rotation || 0) * 180 / Math.PI) || 0} ${centerX} ${centerY})`;
  const scaleStr = flipX === -1 ? ` translate(${centerX} ${centerY}) scale(-1, 1) translate(${-centerX} ${-centerY})` : '';

  const group = createSvgElement('g', {
    class: `stairs-symbol ${ctx.selectedStairsId === stairs.id ? 'selected' : ''}`,
    transform: `${rotateStr}${scaleStr}`,
    'data-stairs-id': stairs.id
  });
  
  const rect = createSvgElement('rect', {
    x: minX,
    y: minY,
    width: w,
    height: h,
    rx: 4,
    fill: stairs.color || '#d8c0a0'
  });
  group.appendChild(rect);
 
  const steps = 6;
 
  if (subtype === 'straight') {
    for (let i = 1; i < steps; i += 1) {
      const y = minY + (h / steps) * i;
      group.appendChild(createSvgElement('line', {
        x1: minX, y1: y,
        x2: minX + w, y2: y,
        class: 'stairs-step-line'
      }));
    }
    group.appendChild(createSvgElement('path', {
      d: `M ${centerX} ${minY + h * 0.8} L ${centerX} ${minY + h * 0.2} M ${centerX - 5} ${minY + h * 0.3} L ${centerX} ${minY + h * 0.2} M ${centerX + 5} ${minY + h * 0.3} L ${centerX} ${minY + h * 0.2}`,
      stroke: 'rgba(0,0,0,0.4)',
      fill: 'none',
      'stroke-width': 1.5
    }));
  } else if (subtype === 'lshape') {
    const landSize = w;
    const subSteps = 3;
    for (let i = 1; i <= subSteps; i++) {
      const y = minY + landSize + ((h - landSize) / (subSteps + 1)) * i;
      group.appendChild(createSvgElement('line', {
        x1: minX, y1: y,
        x2: minX + w, y2: y,
        class: 'stairs-step-line'
      }));
    }
    for (let i = 1; i <= subSteps; i++) {
      const x = minX + w + ((h - w) / (subSteps + 1)) * i;
      group.appendChild(createSvgElement('line', {
        x1: x, y1: minY,
        x2: x, y2: minY + w,
        class: 'stairs-step-line'
      }));
    }
    group.appendChild(createSvgElement('path', {
      d: `M ${centerX} ${minY + h * 0.8} L ${centerX} ${minY + w / 2} L ${minX + h * 0.8} ${minY + w / 2} M ${minX + h * 0.7} ${minY + w / 2 - 4} L ${minX + h * 0.8} ${minY + w / 2} M ${minX + h * 0.7} ${minY + w / 2 + 4} L ${minX + h * 0.8} ${minY + w / 2}`,
      stroke: 'rgba(0,0,0,0.4)',
      fill: 'none',
      'stroke-width': 1.5
    }));
  } else if (subtype === 'ushape') {
    const landSize = w;
    const subSteps = 4;
    group.appendChild(createSvgElement('line', {
      x1: centerX, y1: minY + landSize,
      x2: centerX, y2: minY + h,
      stroke: 'rgba(0,0,0,0.2)',
      'stroke-width': 1
    }));
    for (let i = 1; i <= subSteps; i++) {
      const y = minY + landSize + ((h - landSize) / (subSteps + 1)) * i;
      group.appendChild(createSvgElement('line', {
        x1: minX, y1: y,
        x2: centerX, y2: y,
        class: 'stairs-step-line'
      }));
    }
    for (let i = 1; i <= subSteps; i++) {
      const y = minY + landSize + ((h - landSize) / (subSteps + 1)) * i;
      group.appendChild(createSvgElement('line', {
        x1: centerX, y1: y,
        x2: minX + w, y2: y,
        class: 'stairs-step-line'
      }));
    }
    group.appendChild(createSvgElement('path', {
      d: `M ${minX + w * 0.25} ${minY + h * 0.8} L ${minX + w * 0.25} ${minY + landSize / 2} C ${minX + w * 0.25} ${minY + 6}, ${minX + w * 0.75} ${minY + 6}, ${minX + w * 0.75} ${minY + landSize / 2} L ${minX + w * 0.75} ${minY + h * 0.8} M ${minX + w * 0.7} ${minY + h * 0.75} L ${minX + w * 0.75} ${minY + h * 0.8} M ${minX + w * 0.8} ${minY + h * 0.75} L ${minX + w * 0.75} ${minY + h * 0.8}`,
      stroke: 'rgba(0,0,0,0.4)',
      fill: 'none',
      'stroke-width': 1.5
    }));
  } else if (subtype === 'spiral') {
    const r = Math.min(w, h) / 2;
    group.appendChild(createSvgElement('circle', {
      cx: centerX, cy: centerY,
      r: r - 2,
      stroke: 'rgba(0,0,0,0.2)',
      fill: 'none',
      'stroke-width': 1
    }));
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      group.appendChild(createSvgElement('line', {
        x1: centerX, y1: centerY,
        x2: centerX + (r - 2) * Math.sin(angle), y2: centerY - (r - 2) * Math.cos(angle),
        class: 'stairs-step-line'
      }));
    }
    group.appendChild(createSvgElement('circle', {
      cx: centerX, cy: centerY,
      r: r * 0.15,
      fill: 'rgba(0,0,0,0.3)',
      stroke: 'none'
    }));
    group.appendChild(createSvgElement('path', {
      d: `M ${centerX + r * 0.5} ${centerY} A ${r * 0.5} ${r * 0.5} 0 1 0 ${centerX} ${centerY - r * 0.5} M ${centerX - 4} ${centerY - r * 0.5 + 4} L ${centerX} ${centerY - r * 0.5} M ${centerX - 4} ${centerY - r * 0.5 - 4} L ${centerX} ${centerY - r * 0.5}`,
      stroke: 'rgba(0,0,0,0.4)',
      fill: 'none',
      'stroke-width': 1.2
    }));
  } else if (subtype === 'curved') {
    const R = Math.max(w, h);
    const r = R - w;
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * (Math.PI / 2);
      group.appendChild(createSvgElement('line', {
        x1: minX + r * Math.sin(angle), y1: minY + h - r * Math.cos(angle),
        x2: minX + R * Math.sin(angle), y2: minY + h - R * Math.cos(angle),
        class: 'stairs-step-line'
      }));
    }
    const arrowR = (R + r) / 2;
    const arrowSegments = 20;
    let pathD = '';
    for (let i = 0; i <= arrowSegments; i++) {
      const t = i / arrowSegments;
      const angle = 0.2 * Math.PI / 2 + t * 0.6 * Math.PI / 2;
      const ax = minX + arrowR * Math.sin(angle);
      const ay = minY + h - arrowR * Math.cos(angle);
      if (i === 0) pathD += `M ${ax} ${ay}`;
      else pathD += ` L ${ax} ${ay}`;
    }
    group.appendChild(createSvgElement('path', {
      d: pathD,
      stroke: 'rgba(0,0,0,0.4)',
      fill: 'none',
      'stroke-width': 1.5
    }));
  } else if (subtype === 'floating') {
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', 'rgba(0,0,0,0.15)');
    rect.setAttribute('stroke-dasharray', '2,2');
    for (let i = 0; i < steps; i++) {
      const sy = minY + (h / steps) * i + 2;
      const sh = (h / steps) - 4;
      group.appendChild(createSvgElement('rect', {
        x: minX + 2,
        y: sy,
        width: w - 4,
        height: sh,
        rx: 1,
        fill: '#f0d8b8',
        stroke: 'rgba(0,0,0,0.2)',
        'stroke-width': 0.8
      }));
    }
    group.appendChild(createSvgElement('line', {
      x1: centerX, y1: minY,
      x2: centerX, y2: minY + h,
      stroke: 'rgba(0,0,0,0.3)',
      'stroke-width': 3
    }));
  }
 
  ctx.attachContextMenuTrigger(group, () => ({ type: 'stairs', id: stairs.id }));
  group.addEventListener('pointerdown', (event) => ctx.beginStructureDrag(event, 'stairs', stairs.id));
  group.addEventListener('click', (event) => {
    if (ctx.mode === 'select') {
      event.stopPropagation();
      ctx.selectStairs(stairs.id);
    }
  });
  ctx.svg.appendChild(group);
}

export function renderPlanItem(item) {
  const center = worldToSvg(item.x, item.z);
  const itemScale = Number(item.scale || 1);
  const w = inchesToWorld(item.width) * itemScale;
  const d = inchesToWorld(item.depth) * itemScale;
  const a = worldToSvg(item.x - w / 2, item.z - d / 2);
  const b = worldToSvg(item.x + w / 2, item.z + d / 2);
  const definition = ctx.testMap.getFurnitureDefinition(item.type);
  const rotationDegrees = ((item.rotation || 0) * 180 / Math.PI) || 0;
  const group = createSvgElement('g', {
    'data-item-id': item.id,
    transform: `rotate(${rotationDegrees} ${center.x} ${center.y})`
  });
  const rect = createSvgElement('rect', {
    class: `item-rect ${ctx.selectedItemId === item.id ? 'selected' : ''}`,
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
    rx: 6,
    fill: item.colors?.[definition.components[0]?.id] || definition.components[0]?.defaultColor || '#ff9dbb'
  });
  const label = createSvgElement('text', { class: 'item-label', x: center.x, y: center.y + 4 });
  label.textContent = item.name;
  group.appendChild(rect);
  group.appendChild(label);
  ctx.attachContextMenuTrigger(group, () => ({ type: 'item', id: item.id }));
  group.addEventListener('pointerdown', (event) => ctx.entityManager.beginItemDrag(event, item.id));
  ctx.svg.appendChild(group);
}

export function renderFence(fence) {
  const [fx1, fz1] = fence.from;
  const [fx2, fz2] = fence.to;
  const dx_total = fx2 - fx1;
  const dz_total = fz2 - fz1;
  const totalLength = Math.hypot(dx_total, dz_total);
  if (totalLength <= 0.01) return;

  const group = createSvgElement('g', {
    class: `fence-group ${ctx.selectedFenceId === fence.id ? 'selected' : ''}`,
    'data-fence-id': fence.id
  });
  ctx.attachContextMenuTrigger(group, () => ({ type: 'fence', id: fence.id }));

  const occupiedIntervals = [];
  (ctx.testMap.floorplan.fenceGates || []).forEach(gate => {
    const gFrom = gate.from || [0, 0];
    const gTo = gate.to || [1, 0];
    const gcx = (gFrom[0] + gTo[0]) / 2;
    const gcz = (gFrom[1] + gTo[1]) / 2;

    const lenSq = dx_total * dx_total + dz_total * dz_total;
    if (lenSq <= 0.001) return;

    let t_proj = ((gcx - fx1) * dx_total + (gcz - fz1) * dz_total) / lenSq;
    const projX = fx1 + dx_total * t_proj;
    const projZ = fz1 + dz_total * t_proj;
    const dist = Math.hypot(gcx - projX, gcz - projZ);

    if (dist < 0.25 && t_proj >= -0.05 && t_proj <= 1.05) {
      const halfT = (gate.width || 1.0) / totalLength / 2;
      const startT = Math.max(0, t_proj - halfT);
      const endT = Math.min(1, t_proj + halfT);
      occupiedIntervals.push([startT, endT]);
    }
  });

  occupiedIntervals.sort((a, b) => a[0] - b[0]);
  const mergedIntervals = [];
  for (const interval of occupiedIntervals) {
    if (mergedIntervals.length === 0) {
      mergedIntervals.push(interval);
    } else {
      const last = mergedIntervals[mergedIntervals.length - 1];
      if (interval[0] <= last[1]) {
        last[1] = Math.max(last[1], interval[1]);
      } else {
        mergedIntervals.push(interval);
      }
    }
  }

  const freeIntervals = [];
  let currentT = 0;
  for (const [startT, endT] of mergedIntervals) {
    if (startT > currentT + 0.001) {
      freeIntervals.push([currentT, startT]);
    }
    currentT = Math.max(currentT, endT);
  }
  if (currentT < 0.999) {
    freeIntervals.push([currentT, 1.0]);
  }

  freeIntervals.forEach(([s, e]) => {
    const sx1 = fx1 + dx_total * s;
    const sz1 = fz1 + dz_total * s;
    const sx2 = fx1 + dx_total * e;
    const sz2 = fz1 + dz_total * e;

    const a = worldToSvg(sx1, sz1);
    const b = worldToSvg(sx2, sz2);

    const line = createSvgElement('line', {
      class: `fence-line ${ctx.selectedFenceId === fence.id ? 'selected' : ''}`,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      stroke: ctx.selectedFenceId === fence.id ? '#36c2ff' : (fence.color || '#8d6e63'),
      'stroke-width': 6,
      'stroke-linecap': 'round',
      opacity: 0.8
    });

    line.addEventListener('pointerdown', (event) => {
      if (ctx.mode === 'select') {
        ctx.beginFenceDrag(event, fence.id);
      }
    });

    line.addEventListener('click', (event) => {
      if (ctx.mode === 'delete-wall' || ctx.mode === 'select' || ctx.mode.startsWith('add-fence-gate')) {
        event.stopPropagation();
        if (ctx.mode === 'delete-wall') {
          ctx.pushHistory();
          ctx.testMap.deleteFence(fence.id);
          ctx.clearSelection();
          ctx.refreshShadows();
          renderPlan();
        } else if (ctx.mode === 'select') {
          ctx.selectFence(fence.id);
        } else if (ctx.mode.startsWith('add-fence-gate')) {
          ctx.pushHistory();
          const point = svgPointFromEvent(event);
          const world = svgToWorld(point.x, point.y);
          const { t } = ctx.Topology.projectPointToFence(world, fence, false, 0);
          const subtype = ctx.mode.replace('add-fence-gate-', '') || fence.subtype || 'picket_wood';
          const gate = ctx.testMap.addFenceGate({
            floorId: ctx.testMap.floorplan.currentFloorId,
            fenceId: fence.id,
            t: t,
            width: 1.0,
            subtype: subtype
          });
          ctx.refreshShadows();
          ctx.selectFenceGate(gate.id);
          ctx.switchToSelectMode();
          renderPlan();
        }
      }
    });

    group.appendChild(line);

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);

    if (len > 10) {
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      if (fence.subtype === 'picket_wood') {
        const step = 15;
        for (let d = 5; d < len - 5; d += step) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          group.appendChild(createSvgElement('line', {
            x1: cx - nx * 4,
            y1: cy - ny * 4,
            x2: cx + nx * 4,
            y2: cy + ny * 4,
            stroke: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#5d4037',
            'stroke-width': 2
          }));
        }
      } else if (fence.subtype === 'iron_ornamental') {
        const step = 20;
        for (let d = 10; d < len - 10; d += step) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          group.appendChild(createSvgElement('line', {
            x1: cx - nx * 3,
            y1: cy - ny * 3,
            x2: cx + nx * 3,
            y2: cy + ny * 3,
            stroke: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#212121',
            'stroke-width': 1.5
          }));
          group.appendChild(createSvgElement('circle', {
            cx, cy, r: 2,
            fill: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#212121'
          }));
        }
      } else if (fence.subtype === 'wire_mesh') {
        line.setAttribute('stroke-dasharray', '5,5');
        line.setAttribute('stroke-width', 3);
        line.setAttribute('stroke', ctx.selectedFenceId === fence.id ? '#36c2ff' : '#78909c');
      } else if (fence.subtype === 'stone_masonry') {
        line.setAttribute('stroke-width', 8);
        line.setAttribute('stroke', ctx.selectedFenceId === fence.id ? '#36c2ff' : '#90a4ae');
        const step = 30;
        for (let d = step; d < len - 5; d += step) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          group.appendChild(createSvgElement('line', {
            x1: cx - nx * 4,
            y1: cy - ny * 4,
            x2: cx + nx * 4,
            y2: cy + ny * 4,
            stroke: '#ffffff',
            'stroke-width': 1.5
          }));
        }
      } else if (fence.subtype === 'bamboo') {
        const step = 20;
        for (let d = 5; d < len - 5; d += step) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          group.appendChild(createSvgElement('line', {
            x1: cx - ux * 5 - nx * 4,
            y1: cy - uy * 5 - ny * 4,
            x2: cx + ux * 5 + nx * 4,
            y2: cy + uy * 5 + ny * 4,
            stroke: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#4caf50',
            'stroke-width': 1.5
          }));
          group.appendChild(createSvgElement('line', {
            x1: cx - ux * 5 + nx * 4,
            y1: cy - uy * 5 - ny * 4,
            x2: cx + ux * 5 - nx * 4,
            y2: cy + uy * 5 + ny * 4,
            stroke: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#4caf50',
            'stroke-width': 1.5
          }));
        }
      } else if (fence.subtype === 'glass_rail') {
        line.setAttribute('stroke-width', 6);
        line.setAttribute('stroke', ctx.selectedFenceId === fence.id ? '#36c2ff' : 'rgba(129, 212, 250, 0.6)');
        const step = 40;
        for (let d = 0; d <= len; d += step) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          group.appendChild(createSvgElement('circle', {
            cx, cy, r: 3,
            fill: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#b0bec5'
          }));
        }
        if (len % step > 10) {
          group.appendChild(createSvgElement('circle', {
            cx: b.x, cy: b.y, r: 3,
            fill: ctx.selectedFenceId === fence.id ? '#36c2ff' : '#b0bec5'
          }));
        }
      }
    }
  });

  ctx.svg.appendChild(group);
}

export function renderFenceGate(gate) {
  const [x1, z1] = gate.from;
  const [x2, z2] = gate.to;
  const a = worldToSvg(x1, z1);
  const b = worldToSvg(x2, z2);

  const group = createSvgElement('g', {
    class: `fence-gate-group ${ctx.selectedFenceGateId === gate.id ? 'selected' : ''}`,
    'data-fence-gate-id': gate.id
  });
  ctx.attachContextMenuTrigger(group, () => ({ type: 'fence_gate', id: gate.id }));

  const line = createSvgElement('line', {
    class: `fence-gate-line ${ctx.selectedFenceGateId === gate.id ? 'selected' : ''}`,
    x1: a.x, y1: a.y,
    x2: b.x, y2: b.y,
    stroke: ctx.selectedFenceGateId === gate.id ? '#36c2ff' : (gate.color || '#e0a96d'),
    'stroke-width': 8,
    'stroke-linecap': 'round',
    opacity: 0.95
  });

  line.addEventListener('pointerdown', (event) => {
    if (ctx.mode === 'select') {
      ctx.beginFenceGateDrag(event, gate.id);
    }
  });

  line.addEventListener('click', (event) => {
    if (ctx.mode === 'select' || ctx.mode === 'delete-wall') {
      event.stopPropagation();
      if (ctx.mode === 'select') {
        ctx.selectFenceGate(gate.id);
      } else if (ctx.mode === 'delete-wall') {
        ctx.pushHistory();
        ctx.testMap.deleteFenceGate(gate.id);
        ctx.clearSelection();
        ctx.refreshShadows();
        renderPlan();
      }
    }
  });

  group.appendChild(line);

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / (len || 1);
  const uy = dy / (len || 1);
  const nx = -uy;
  const ny = ux;

  const barCount = 4;
  for (let i = 0; i < barCount; i++) {
    const t = i / (barCount - 1);
    const cx = a.x + dx * t;
    const cy = a.y + dy * t;
    group.appendChild(createSvgElement('line', {
      x1: cx - nx * 4,
      y1: cy - ny * 4,
      x2: cx + nx * 4,
      y2: cy + ny * 4,
      stroke: ctx.selectedFenceGateId === gate.id ? '#36c2ff' : '#8d6e63',
      'stroke-width': 1.5
    }));
  }

  ctx.svg.appendChild(group);
}

export function renderSelectedFenceHandles(fence) {
  if (fence.locked) return;
  const a = worldToSvg(fence.from[0], fence.from[1]);
  const b = worldToSvg(fence.to[0], fence.to[1]);

  const handles = [
    { type: 'from', x: a.x, y: a.y },
    { type: 'to', x: b.x, y: b.y }
  ];

  handles.forEach(h => {
    const circle = createSvgElement('circle', {
      class: 'fence-resize-handle',
      cx: h.x,
      cy: h.y,
      r: 8,
      fill: '#ff9f1c',
      stroke: '#ffffff',
      'stroke-width': 1.5,
      style: 'cursor: pointer;'
    });

    circle.addEventListener('pointerdown', (event) => {
      ctx.beginFenceResize(event, fence.id, h.type);
    });

    ctx.svg.appendChild(circle);
  });
}
