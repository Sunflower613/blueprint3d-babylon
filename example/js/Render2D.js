import { getRoomVertices, isItemSnappedToBookshelfOrMannequin } from '../../src/index.js';

import { createStoreProxy } from '../store/proxyHelper.js';
import { render2DFurniturePlacementPreview } from './FurniturePlacementController.js';

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
  return Number(value || 0);
}

export function createSvgElement(name, attrs = {}) {
  const element = document.createElementNS(ctx.SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => {
    let val = value;
    if (name === 'rect' && (key === 'width' || key === 'height')) {
      const num = Number(val);
      if (!isNaN(num) && num < 0) {
        val = 0;
      }
    }
    element.setAttribute(key, val);
  });
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

  // 2D 模式下不渲染屋顶，避免遮挡编辑房间内的其他物品
  // ctx.currentRoofs().forEach((roof) => renderRoof(roof));
  ctx.currentStairs().forEach((stairs) => renderStairs(stairs));
  ctx.currentFences().forEach((fence) => renderFence(fence));
  ctx.testMap.getCurrentFloorEntities('fenceGate').forEach(gate => renderFenceGate(gate));

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

  const sortedItems = [...ctx.currentItems()].sort((a, b) => {
    const aName = (a.name || a.type || '').toLowerCase();
    const bName = (b.name || b.type || '').toLowerCase();
    const aIsRug = aName.includes('地毯') || aName.includes('垫') || aName.includes('rug') || aName.includes('carpet') || aName.includes('mat');
    const bIsRug = bName.includes('地毯') || bName.includes('垫') || bName.includes('rug') || bName.includes('carpet') || bName.includes('mat');
    
    if (aIsRug && !bIsRug) return -1;
    if (!aIsRug && bIsRug) return 1;
    return 0;
  });
  sortedItems.forEach((item) => renderPlanItem(item));
  render2DFurniturePlacementPreview();
  const selectedRoom = ctx.selectedRoomId ? ctx.testMap.getEntity('room', ctx.selectedRoomId) : null;
  if (selectedRoom) renderSelectedRoomHandles(selectedRoom);
  const selectedRoof = ctx.selectedRoofId ? ctx.testMap.getEntity('roof', ctx.selectedRoofId) : null;
  if (selectedRoof) renderSelectedRoofHandles(selectedRoof);
  const selectedFence = ctx.selectedFenceId ? ctx.testMap.getEntity('fence', ctx.selectedFenceId) : null;
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

  // 计算房间几何中心点
  let sumX = 0;
  let sumZ = 0;
  const vertices = getRoomVertices(room);
  vertices.forEach((v) => {
    sumX += v.x;
    sumZ += v.z;
  });
  const centerX = sumX / vertices.length;
  const centerZ = sumZ / vertices.length;
  const svgCenter = worldToSvg(centerX, centerZ);

  // 动态计算多边形房间的实际面积
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const next = vertices[(i + 1) % vertices.length];
    area += vertices[i].x * next.z - next.x * vertices[i].z;
  }
  area = Math.abs(area / 2);
  const formattedArea = Number(area.toFixed(2));
  const labelGroup = createSvgElement('g', {
    class: 'room-area-label',
    style: 'pointer-events: none;'
  });

  // 第一行：房间名称（超级加粗 800，极淡的 slate 灰水印质感）
  const nameNode = createSvgElement('text', {
    x: svgCenter.x,
    y: svgCenter.y - 5,
    fill: 'rgba(15, 23, 42, 0.18)',
    'font-size': '12px',
    'font-family': 'Inter, system-ui, -apple-system, sans-serif',
    'font-weight': '800',
    'text-anchor': 'middle',
    'dominant-baseline': 'middle'
  });
  nameNode.textContent = room.name || '房间';

  // 第二行：面积数值（超级加粗 800，极淡水印，隐藏无效小数零）
  const areaNode = createSvgElement('text', {
    x: svgCenter.x,
    y: svgCenter.y + 8,
    fill: 'rgba(15, 23, 42, 0.14)',
    'font-size': '10px',
    'font-family': 'Inter, system-ui, -apple-system, sans-serif',
    'font-weight': '800',
    'text-anchor': 'middle',
    'dominant-baseline': 'middle'
  });
  areaNode.textContent = `${formattedArea} ㎡`;

  labelGroup.appendChild(nameNode);
  labelGroup.appendChild(areaNode);
  ctx.svg.appendChild(labelGroup);
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
  // 始终渲染顶层蓝色外围线框（即使房间被锁定也显示）
  const points = getRoomVertices(room).map((point) => worldToSvg(point.x, point.z));
  const outline = createSvgElement('polygon', {
    points: points.map((p) => `${p.x},${p.y}`).join(' '),
    class: 'room-selected-outline',
    style: 'pointer-events: none;'
  });
  ctx.svg.appendChild(outline);

  if (room.locked) return;

  const width = room.width;
  const depth = room.depth;
  const rotation = Number(room.rotation) || 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const localOffsets = {
    north: { lx: 0, lz: -depth / 2 },
    east: { lx: width / 2, lz: 0 },
    south: { lx: 0, lz: depth / 2 },
    west: { lx: -width / 2, lz: 0 }
  };

  if (room.shape === 'l-shape') {
    const edgeWidth = room.edgeWidth !== undefined && room.edgeWidth !== null ? room.edgeWidth : width / 2;
    const edgeDepth = room.edgeDepth !== undefined && room.edgeDepth !== null ? room.edgeDepth : depth / 2;
    localOffsets.north = { lx: -edgeWidth / 2, lz: -depth / 2 };
    localOffsets.east = { lx: width / 2, lz: -edgeDepth / 2 };
    localOffsets.south = { lx: -edgeWidth / 2, lz: depth / 2 };
    localOffsets.edgeWidth = { lx: width / 2 - edgeWidth, lz: depth / 2 - edgeDepth / 2 };
    localOffsets.edgeDepth = { lx: width / 2 - edgeWidth / 2, lz: depth / 2 - edgeDepth };
  }

  const handles = Object.entries(localOffsets).map(([side, { lx, lz }]) => {
    const rx = lx * cos - lz * sin;
    const rz = lx * sin + lz * cos;
    const svgPoint = worldToSvg(room.x + rx, room.z + rz);
    return { side, x: svgPoint.x, y: svgPoint.y };
  });

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
  const wall = ctx.testMap.getEntity('wall', opening.wallId);
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

  const eaveOverhang = Math.max(0, Number(roof.eaveOverhang || 0));
  if (eaveOverhang > 0) {
    const eaveA = worldToSvg(
      (roof.x || 0) - (roof.width || 6) / 2 - eaveOverhang,
      (roof.z || 0) - (roof.depth || 6) / 2 - eaveOverhang
    );
    const eaveB = worldToSvg(
      (roof.x || 0) + (roof.width || 6) / 2 + eaveOverhang,
      (roof.z || 0) + (roof.depth || 6) / 2 + eaveOverhang
    );
    group.appendChild(createSvgElement('rect', {
      class: 'roof-eave-rect',
      x: Math.min(eaveA.x, eaveB.x),
      y: Math.min(eaveA.y, eaveB.y),
      width: Math.abs(eaveB.x - eaveA.x),
      height: Math.abs(eaveB.y - eaveA.y),
      rx: 4,
      fill: roof.color || '#b75b54',
      'fill-opacity': 0.38,
      stroke: roof.color || '#b75b54',
      'stroke-width': 1,
      'pointer-events': 'none'
    }));
  }
  
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
      width: Math.max(0, w - 8), height: Math.max(0, h - 8),
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
  let wVal = stairs.width || 1;
  let dVal = stairs.depth || 3;

  if (subtype === 'spiral') {
    const size = Math.max(wVal, dVal);
    wVal = size;
    dVal = size;
  } else if (subtype === 'lshape') {
    const d2 = stairs.runAfterCorner ?? Math.max(0.2, dVal - wVal);
    const d1 = stairs.runBeforeCorner ?? Math.max(0.2, dVal - wVal);
    wVal = wVal + d2;
    dVal = d1 + (stairs.width || 1);
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
  
  const fillColor = stairs.color || '#f5b984';

  if (subtype === 'curved') {
    // 弧形楼梯：绘制 90 度环形扇面背景
    const R = Math.max(w, h);
    const r = Math.max(0, R - Math.min(w, h));
    const pathD = `M ${minX} ${minY + h - R} A ${R} ${R} 0 0 1 ${minX + R} ${minY + h} L ${minX + r} ${minY + h} A ${r} ${r} 0 0 0 ${minX} ${minY + h - r} Z`;
    group.appendChild(createSvgElement('path', {
      d: pathD,
      fill: fillColor,
      stroke: 'rgba(0,0,0,0.3)',
      'stroke-width': 1
    }));

    const stepsCount = stairs.steps || 12;
    for (let i = 0; i <= stepsCount; i++) {
      const angle = (i / stepsCount) * (Math.PI / 2);
      group.appendChild(createSvgElement('line', {
        x1: minX + r * Math.sin(angle), y1: minY + h - r * Math.cos(angle),
        x2: minX + R * Math.sin(angle), y2: minY + h - R * Math.cos(angle),
        class: 'stairs-step-line'
      }));
    }

    // 导向弧形箭头
    const arrowR = (R + r) / 2;
    const arrowSegs = 16;
    let arrowD = '';
    const startAng = 0.15 * (Math.PI / 2);
    const endAng = 0.85 * (Math.PI / 2);
    for (let i = 0; i <= arrowSegs; i++) {
      const ang = startAng + (i / arrowSegs) * (endAng - startAng);
      const ax = minX + arrowR * Math.sin(ang);
      const ay = minY + h - arrowR * Math.cos(ang);
      if (i === 0) arrowD += `M ${ax} ${ay}`;
      else arrowD += ` L ${ax} ${ay}`;
    }
    // 箭头末端尖端 (倒钩)
    const endX = minX + arrowR * Math.sin(endAng);
    const endY = minY + h - arrowR * Math.cos(endAng);
    const dirX = Math.cos(endAng); // 切线方向 X
    const dirY = Math.sin(endAng); // 切线方向 Y
    const normalX = -dirY;
    const normalY = dirX;
    const headLen = 6;
    const headW = 4;
    const p1x = endX - headLen * dirX + headW * normalX;
    const p1y = endY - headLen * dirY + headW * normalY;
    const p2x = endX - headLen * dirX - headW * normalX;
    const p2y = endY - headLen * dirY - headW * normalY;
    arrowD += ` M ${p1x} ${p1y} L ${endX} ${endY} L ${p2x} ${p2y}`;

    group.appendChild(createSvgElement('path', {
      d: arrowD,
      stroke: 'rgba(0,0,0,0.45)',
      fill: 'none',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));

  } else if (subtype === 'lshape') {
    // L 型楼梯：绘制 L 形多边形背景 Path
    const d2 = stairs.runAfterCorner ?? Math.max(0.2, (stairs.depth || 3) - (stairs.width || 1));
    const d1 = stairs.runBeforeCorner ?? Math.max(0.2, (stairs.depth || 3) - (stairs.width || 1));
    const totalW = (stairs.width || 1) + d2;
    const totalD = d1 + (stairs.width || 1);

    const w1 = w * ((stairs.width || 1) / totalW); // 第一跑 SVG 宽度
    const h1 = h * ((stairs.width || 1) / totalD); // 平台/第二跑 SVG 高度

    const lPath = `M ${minX} ${minY + h} L ${minX} ${minY} L ${minX + w} ${minY} L ${minX + w} ${minY + h1} L ${minX + w1} ${minY + h1} L ${minX + w1} ${minY + h} Z`;
    group.appendChild(createSvgElement('path', {
      d: lPath,
      fill: fillColor,
      stroke: 'rgba(0,0,0,0.3)',
      'stroke-width': 1
    }));

    const totalSteps = stairs.steps || 12;
    const n1 = Math.max(1, Math.min(totalSteps - 2, stairs.cornerStep ?? Math.floor(totalSteps / 2)));
    const n2 = totalSteps - n1;

    // 第一跑踏步线（纵向上升，平分第一跑长度）
    for (let i = 1; i <= n1; i++) {
      const y = minY + h - ((h - h1) / n1) * i;
      group.appendChild(createSvgElement('line', {
        x1: minX, y1: y,
        x2: minX + w1, y2: y,
        class: 'stairs-step-line'
      }));
    }

    // 第二跑踏步线（横向延伸，平分第二跑长度）
    for (let i = 1; i < n2; i++) {
      const x = minX + w1 + ((w - w1) / n2) * i;
      group.appendChild(createSvgElement('line', {
        x1: x, y1: minY,
        x2: x, y2: minY + h1,
        class: 'stairs-step-line'
      }));
    }

    // 导向折线箭头
    const arrowStartX = minX + w1 / 2;
    const arrowStartY = minY + h - 10;
    const arrowCornerX = minX + w1 / 2;
    const arrowCornerY = minY + h1 / 2;
    const arrowEndX = minX + w - 10;
    const arrowEndY = minY + h1 / 2;

    const arrowD = `M ${arrowStartX} ${arrowStartY} L ${arrowCornerX} ${arrowCornerY} L ${arrowEndX} ${arrowEndY} M ${arrowEndX - 6} ${arrowEndY - 4} L ${arrowEndX} ${arrowEndY} M ${arrowEndX - 6} ${arrowEndY + 4} L ${arrowEndX} ${arrowEndY}`;
    group.appendChild(createSvgElement('path', {
      d: arrowD,
      stroke: 'rgba(0,0,0,0.45)',
      fill: 'none',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));

  } else {
    // 基础矩形背景 (straight, ushape, spiral, floating)
    const rect = createSvgElement('rect', {
      x: minX,
      y: minY,
      width: w,
      height: h,
      rx: 4,
      fill: fillColor
    });
    group.appendChild(rect);

    if (subtype === 'straight') {
      const stepsCount = stairs.steps || 12;
      for (let i = 1; i < stepsCount; i++) {
        const y = minY + (h / stepsCount) * i;
        group.appendChild(createSvgElement('line', {
          x1: minX, y1: y,
          x2: minX + w, y2: y,
          class: 'stairs-step-line'
        }));
      }
      group.appendChild(createSvgElement('path', {
        d: `M ${centerX} ${minY + h * 0.85} L ${centerX} ${minY + h * 0.15} M ${centerX - 5} ${minY + h * 0.25} L ${centerX} ${minY + h * 0.15} M ${centerX + 5} ${minY + h * 0.25} L ${centerX} ${minY + h * 0.15}`,
        stroke: 'rgba(0,0,0,0.45)',
        fill: 'none',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

    } else if (subtype === 'ushape') {
      const totalSteps = stairs.steps || 12;
      const halfSteps = Math.floor(totalSteps / 2);
      const slotW = stairs.uSlotWidth ?? 0;
      const slotSvgW = w * (slotW / (stairs.width || 2));
      const landDepth = Math.max(0.4, (stairs.depth || 3) - (stairs.uVoidLength ?? 2));
      const landSvgH = h * (landDepth / (stairs.depth || 3));

      const wStep = (w - slotSvgW) / 2;

      // 绘制中央隔缝
      if (slotSvgW > 0.5) {
        group.appendChild(createSvgElement('rect', {
          x: minX + wStep, y: minY + landSvgH,
          width: Math.max(0, slotSvgW), height: Math.max(0, h - landSvgH),
          fill: 'rgba(0,0,0,0.06)'
        }));
      } else {
        group.appendChild(createSvgElement('line', {
          x1: centerX, y1: minY + landSvgH,
          x2: centerX, y2: minY + h,
          stroke: 'rgba(0,0,0,0.25)',
          'stroke-width': 1
        }));
      }

      // 第一跑（左侧梯段，向下到达底部）
      for (let i = 1; i <= halfSteps; i++) {
        const y = minY + landSvgH + ((h - landSvgH) / halfSteps) * i;
        group.appendChild(createSvgElement('line', {
          x1: minX, y1: y,
          x2: minX + wStep, y2: y,
          class: 'stairs-step-line'
        }));
      }

      // 第二跑（右侧梯段，平分）
      for (let i = 1; i <= halfSteps; i++) {
        const y = minY + landSvgH + ((h - landSvgH) / halfSteps) * i;
        group.appendChild(createSvgElement('line', {
          x1: minX + wStep + slotSvgW, y1: y,
          x2: minX + w, y2: y,
          class: 'stairs-step-line'
        }));
      }
      // U 型折返引导指示箭头
      const leftArrowX = minX + wStep / 2;
      const rightArrowX = minX + w - wStep / 2;
      const arrowTopY = minY + landSvgH / 2;
      const arrowBottomY = minY + h - 10;

      const arrowD = `M ${leftArrowX} ${arrowBottomY} L ${leftArrowX} ${arrowTopY} C ${leftArrowX} ${minY + 4}, ${rightArrowX} ${minY + 4}, ${rightArrowX} ${arrowTopY} L ${rightArrowX} ${arrowBottomY} M ${rightArrowX - 5} ${arrowBottomY - 6} L ${rightArrowX} ${arrowBottomY} M ${rightArrowX + 5} ${arrowBottomY - 6} L ${rightArrowX} ${arrowBottomY}`;

      group.appendChild(createSvgElement('path', {
        d: arrowD,
        stroke: 'rgba(0,0,0,0.45)',
        fill: 'none',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

    } else if (subtype === 'spiral') {
      const r = Math.min(w, h) / 2;
      // 外包圆界
      group.appendChild(createSvgElement('circle', {
        cx: centerX, cy: centerY,
        r: r - 2,
        stroke: 'rgba(0,0,0,0.2)',
        fill: 'none',
        'stroke-width': 1
      }));

      const stepsCount = stairs.steps || 12;
      const spiralDeg = stairs.spiralDegrees ?? 360;
      const totalRad = (spiralDeg * Math.PI) / 180;
      const startAngle = Math.PI / 2; // 起始于 6 点钟方向 (正下方)

      // 踏步分割线（从 6 点钟方向开始，逆时针根据 spiralDeg 划分）
      for (let i = 0; i <= stepsCount; i++) {
        const ang = startAngle - (i / stepsCount) * totalRad;
        const innerR = r * 0.15;
        const outerR = r - 2;
        group.appendChild(createSvgElement('line', {
          x1: centerX + innerR * Math.cos(ang),
          y1: centerY + innerR * Math.sin(ang),
          x2: centerX + outerR * Math.cos(ang),
          y2: centerY + outerR * Math.sin(ang),
          class: 'stairs-step-line'
        }));
      }

      // 中心柱
      group.appendChild(createSvgElement('circle', {
        cx: centerX, cy: centerY,
        r: r * 0.15,
        fill: 'rgba(0,0,0,0.3)',
        stroke: 'none'
      }));
      // 参数化动态螺旋指示箭头 (从 6 点钟方向起点逆时针环绕延伸至终点)
      const rArrow = r * 0.55;
      const sampleCount = 32;
      let arrowD = '';

      for (let k = 0; k <= sampleCount; k++) {
        const t = k / sampleCount;
        const ang = startAngle - t * totalRad;
        const ax = centerX + rArrow * Math.cos(ang);
        const ay = centerY + rArrow * Math.sin(ang);
        if (k === 0) arrowD += `M ${ax} ${ay}`;
        else arrowD += ` L ${ax} ${ay}`;
      }

      // 计算终点切线与法线向量以生成完美箭头尖端
      const endAng = startAngle - totalRad;
      const endX = centerX + rArrow * Math.cos(endAng);
      const endY = centerY + rArrow * Math.sin(endAng);

      const tanX = Math.sin(endAng); // 逆时针切线向量 X
      const tanY = -Math.cos(endAng); // 逆时针切线向量 Y
      const normX = -tanY;
      const normY = tanX;

      const headLen = 7;
      const headW = 4.5;
      const p1x = endX - headLen * tanX + headW * normX;
      const p1y = endY - headLen * tanY + headW * normY;
      const p2x = endX - headLen * tanX - headW * normX;
      const p2y = endY - headLen * tanY - headW * normY;

      arrowD += ` M ${p1x} ${p1y} L ${endX} ${endY} L ${p2x} ${p2y}`;

      group.appendChild(createSvgElement('path', {
        d: arrowD,
        stroke: 'rgba(0,0,0,0.45)',
        fill: 'none',
        'stroke-width': 1.4,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

    } else if (subtype === 'floating') {
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', 'rgba(0,0,0,0.2)');
      rect.setAttribute('stroke-dasharray', '3,3');

      const stepsCount = stairs.steps || 12;
      const stepH = h / stepsCount;
      const marginY = Math.min(2, stepH * 0.2);
      const marginX = Math.min(2, w * 0.1);
      const sh = Math.max(0, stepH - marginY * 2);
      const sw = Math.max(0, w - marginX * 2);
      for (let i = 0; i < stepsCount; i++) {
        const sy = minY + stepH * i + marginY;
        group.appendChild(createSvgElement('rect', {
          x: minX + marginX,
          y: sy,
          width: sw,
          height: sh,
          rx: Math.min(1, sh / 2),
          fill: fillColor,
          stroke: 'rgba(0,0,0,0.25)',
          'stroke-width': 0.8
        }));
      }
      const beamCount = Math.max(0, Math.round(Number(stairs.beamCount ?? 1)));
      if (beamCount === 1) {
        group.appendChild(createSvgElement('line', {
          x1: centerX, y1: minY,
          x2: centerX, y2: minY + h,
          stroke: 'rgba(0,0,0,0.35)',
          'stroke-width': 3
        }));
      } else if (beamCount > 1) {
        const marginX = Math.min(12, w * 0.2);
        const spanX = w - marginX * 2;
        for (let b = 0; b < beamCount; b++) {
          const bx = minX + marginX + (spanX / (beamCount - 1)) * b;
          group.appendChild(createSvgElement('line', {
            x1: bx, y1: minY,
            x2: bx, y2: minY + h,
            stroke: 'rgba(0,0,0,0.35)',
            'stroke-width': 2.5
          }));
        }
      }

      // 悬浮向上指示箭头
      group.appendChild(createSvgElement('path', {
        d: `M ${centerX} ${minY + h * 0.85} L ${centerX} ${minY + h * 0.15} M ${centerX - 5} ${minY + h * 0.25} L ${centerX} ${minY + h * 0.15} M ${centerX + 5} ${minY + h * 0.25} L ${centerX} ${minY + h * 0.15}`,
        stroke: 'rgba(0,0,0,0.45)',
        fill: 'none',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
    } else if (subtype === 'ladder') {
      rect.setAttribute('fill', 'rgba(144, 164, 174, 0.15)');
      rect.setAttribute('stroke', '#78909c');
      rect.setAttribute('stroke-width', '1.5');

      const stepsCount = Math.max(2, stairs.steps || 10);
      const stepGap = h / (stepsCount + 1);
      const railW = Math.min(6, w * 0.15);

      // 左/右边柱
      group.appendChild(createSvgElement('line', {
        x1: minX + railW, y1: minY,
        x2: minX + railW, y2: minY + h,
        stroke: '#546e7a',
        'stroke-width': 2.5
      }));
      group.appendChild(createSvgElement('line', {
        x1: minX + w - railW, y1: minY,
        x2: minX + w - railW, y2: minY + h,
        stroke: '#546e7a',
        'stroke-width': 2.5
      }));

      // 横向踏棍
      for (let i = 1; i <= stepsCount; i++) {
        const ry = minY + stepGap * i;
        group.appendChild(createSvgElement('line', {
          x1: minX + railW, y1: ry,
          x2: minX + w - railW, y2: ry,
          stroke: '#37474f',
          'stroke-width': 2
        }));
      }

      // 向上攀爬指示箭头
      group.appendChild(createSvgElement('path', {
        d: `M ${centerX} ${minY + h * 0.8} L ${centerX} ${minY + h * 0.2} M ${centerX - 4} ${minY + h * 0.3} L ${centerX} ${minY + h * 0.2} M ${centerX + 4} ${minY + h * 0.3} L ${centerX} ${minY + h * 0.2}`,
        stroke: '#263238',
        fill: 'none',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

    } else if (subtype === 'slide') {
      rect.setAttribute('fill', 'rgba(255, 183, 77, 0.25)');
      rect.setAttribute('stroke', '#f57c00');
      rect.setAttribute('stroke-width', '1.5');
      rect.setAttribute('rx', '6');

      const sideRailW = Math.min(8, w * 0.12);

      // 侧护栏防护线条
      group.appendChild(createSvgElement('line', {
        x1: minX + sideRailW, y1: minY,
        x2: minX + sideRailW, y2: minY + h,
        stroke: '#e65100',
        'stroke-width': 1.5,
        'stroke-dasharray': '4,2'
      }));
      group.appendChild(createSvgElement('line', {
        x1: minX + w - sideRailW, y1: minY,
        x2: minX + w - sideRailW, y2: minY + h,
        stroke: '#e65100',
        'stroke-width': 1.5,
        'stroke-dasharray': '4,2'
      }));

      // 顶部入口平台线
      const topLandH = Math.min(16, h * 0.15);
      group.appendChild(createSvgElement('rect', {
        x: minX + sideRailW, y: minY,
        width: Math.max(0, w - sideRailW * 2), height: topLandH,
        fill: 'rgba(255, 152, 0, 0.4)',
        stroke: '#ef6c00',
        'stroke-width': 1
      }));

      // 向下滑行圆滑弧线箭头 (由顶至底)
      group.appendChild(createSvgElement('path', {
        d: `M ${centerX} ${minY + topLandH + 4} L ${centerX} ${minY + h - 12} M ${centerX - 5} ${minY + h - 18} L ${centerX} ${minY + h - 12} M ${centerX + 5} ${minY + h - 18} L ${centerX} ${minY + h - 12}`,
        stroke: '#d84315',
        fill: 'none',
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
    }
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
  if (isItemSnappedToBookshelfOrMannequin(item, ctx.testMap.getEntities('item'), (type) => ctx.testMap.getFurnitureDefinition(type))) {
    return;
  }
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
  ctx.testMap.getEntities('fenceGate').forEach(gate => {
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
            floorId: ctx.testMap.getCurrentFloorId(),
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
