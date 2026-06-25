import './styles.css';
import * as BABYLON from '@babylonjs/core';
import {
  Blueprint3DTestMap,
  BLUEPRINT3D_TEST_FLOORPLAN,
  FURNITURE_LIST,
  FURNITURE_CATEGORIES,
  MATERIAL_CATEGORIES,
  DEFAULT_MATERIAL_PACKS,
  createTextureMaterialDescriptor,
  createBuildingFileName,
  stringifyDXF,
  create3MFPackage,
  createDXFFileName,
  create3MFFileName
} from '../src/index.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const view = { width: 720, height: 520, pad: 42, minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 };
const groundPlane = new BABYLON.Plane(0, 1, 0, 0);

let mode = 'select';
let currentView = '2d';
let selectedRoomId = null;
let selectedWallId = null;
let selectedItemId = null;
let selectedOpeningId = null;
let drawStart = null;
let dragState = null;
let openingDragState = null;
let wallDragState = null;
let roomDragState = null;
let roomResizeState = null;
let drag3DState = null;
let snapEnabled = true;
let snapSize = 1;
let activeMaterialDescriptor = null;
let materialLibrary = [...DEFAULT_MATERIAL_PACKS];
let itemGestureState = null;
const activePointers = new Map();
let roomCounter = 1;
let undoStack = [];
let redoStack = [];

const stage = document.getElementById('stage');
const viewToggleButton = document.getElementById('btn-view-toggle');
const buildingFileInput = document.getElementById('building-file-input');
const undoButton = document.getElementById('btn-undo');
const redoButton = document.getElementById('btn-redo');
const canvas = document.getElementById('render-canvas');
const svg = document.getElementById('floorplan');
const designSelectionPanel = document.getElementById('design-selection-panel');
const materialCategorySelect = document.getElementById('material-category');
const materialUploadInput = document.getElementById('material-upload');
const materialLibraryPanel = document.getElementById('material-library');

const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);
scene.clearColor = BABYLON.Color4.FromHexString('#eef4fbff');

const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 3, Math.PI / 3, 15, new BABYLON.Vector3(0, 0, -2.2), scene);
camera.attachControl(canvas, true);
// 彻底移除相机自带的键盘输入移动模块，防止其默认的键盘行为（包含旋转和方向键监听）干扰自定义操作
camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
camera.lowerRadiusLimit = 5;
camera.upperRadiusLimit = 28;
camera.wheelDeltaPercentage = 0.02;
camera.panningSensibility = 1200;

const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
hemi.intensity = 0.72;
const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.5), scene);
sun.position.set(8, 12, 8);
sun.intensity = 0.78;

const shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.blurKernel = 24;

let testMap = new Blueprint3DTestMap(scene);

initFurnitureButtons();
initMaterialControls();
refreshShadows();
selectItem(testMap.floorplan.items[0]?.id || null);
setView('2d');
updateHistoryButtons();

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function snapshot() {
  return cloneData(testMap.exportJSON());
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 80) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function restoreSnapshot(data) {
  testMap.loadJSON(data);
  selectedRoomId = selectedRoomId && testMap.getRoom(selectedRoomId) ? selectedRoomId : null;
  selectedWallId = selectedWallId && testMap.getWall(selectedWallId) ? selectedWallId : null;
  selectedItemId = selectedItemId && testMap.getItem(selectedItemId) ? selectedItemId : null;
  selectedOpeningId = selectedOpeningId && testMap.getOpening(selectedOpeningId) ? selectedOpeningId : null;
  testMap.setSelectedItem(selectedItemId);
  testMap.setSelectedWall(selectedWallId);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restoreSnapshot(undoStack.pop());
  updateHistoryButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restoreSnapshot(redoStack.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoButton.disabled = undoStack.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

function refreshShadows() {
  shadowGenerator.getShadowMap().renderList = [];
  testMap.getShadowCasters().forEach((mesh) => shadowGenerator.addShadowCaster(mesh));
}

function resetCamera() {
  camera.setTarget(new BABYLON.Vector3(0, 0, -2.2));
  camera.alpha = -Math.PI / 3;
  camera.beta = Math.PI / 3;
  camera.radius = 15;
}

function resetCurrentMaterial() {
  if (selectedItemId) {
    pushHistory();
    const item = testMap.getItem(selectedItemId);
    if (item) {
      const definition = testMap.getFurnitureDefinition(item.type);
      item.colors = {};
      item.materials = {};
      if (definition && definition.components) {
        definition.components.forEach((component) => {
          item.colors[component.id] = component.defaultColor;
          item.materials[component.id] = component.defaultColor;
        });
      }
      testMap.updateItem(selectedItemId, { colors: item.colors, materials: item.materials });
      refreshShadows();
      updateEditor();
      renderPlan();
    }
  } else if (selectedWallId) {
    pushHistory();
    const wall = testMap.getWall(selectedWallId);
    if (wall) {
      testMap.updateWall(selectedWallId, { material: '#f9fbff', color: '#f9fbff' });
      refreshShadows();
      updateEditor();
      renderPlan();
    }
  } else if (selectedRoomId) {
    pushHistory();
    const defaultFloorMaterial = DEFAULT_MATERIAL_PACKS.find(p => p.id === 'wood-light-fine');
    testMap.setRoomFloorMaterial(selectedRoomId, defaultFloorMaterial);
    refreshShadows();
    updateEditor();
    renderPlan();
  }
}

function setView(nextView) {
  currentView = nextView;
  stage.dataset.view = nextView;
  viewToggleButton.textContent = nextView === '2d' ? '3D' : '2D';
  viewToggleButton.setAttribute('aria-pressed', String(nextView === '3d'));
  
  const resetCamBtn = document.getElementById('btn-reset-camera');
  if (resetCamBtn) {
    resetCamBtn.classList.toggle('hidden', nextView !== '3d');
  }

  if (nextView === '3d') {
    requestAnimationFrame(() => {
      engine.resize();
      scene.render();
    });
  } else {
    renderPlan();
  }
}

function worldToSvg(x, z) {
  const innerW = view.width - view.pad * 2;
  const innerH = view.height - view.pad * 2;
  const zRatio = (z - view.minZ) / (view.maxZ - view.minZ);
  return {
    x: view.pad + ((x - view.minX) / (view.maxX - view.minX)) * innerW,
    y: view.height - view.pad - zRatio * innerH
  };
}

function svgToWorld(x, y) {
  const innerW = view.width - view.pad * 2;
  const innerH = view.height - view.pad * 2;
  return {
    x: view.minX + ((x - view.pad) / innerW) * (view.maxX - view.minX),
    z: view.minZ + ((view.height - view.pad - y) / innerH) * (view.maxZ - view.minZ)
  };
}

function inchesToWorld(value) {
  return Number(value || 0) / 24;
}

function createSvgElement(name, attrs = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function svgPointFromEvent(event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * view.width,
    y: ((event.clientY - rect.top) / rect.height) * view.height
  };
}

function snapValue(value) {
  if (!snapEnabled || !snapSize) return value;
  return Math.round(value / snapSize) * snapSize;
}

function snapWorldPoint(world) {
  return {
    x: Number(snapValue(world.x).toFixed(3)),
    z: Number(snapValue(world.z).toFixed(3))
  };
}

function snapNumber(value) {
  return Number(snapValue(value).toFixed(3));
}

function snapRoomPosition(room, x, z) {
  const left = snapNumber(x - room.width / 2);
  const top = snapNumber(z - room.depth / 2);
  return {
    x: Number((left + room.width / 2).toFixed(3)),
    z: Number((top + room.depth / 2).toFixed(3))
  };
}

function getWallProjectionT(wall, world) {
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

function wallPointAt(wall, t) {
  return {
    x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    z: wall.from[1] + (wall.to[1] - wall.from[1]) * t
  };
}

function updateViewBounds() {
  const corners = [];
  testMap.floorplan.walls.forEach((wall) => {
    corners.push({ x: wall.from[0], z: wall.from[1] });
    corners.push({ x: wall.to[0], z: wall.to[1] });
  });
  testMap.floorplan.floor.rooms.forEach((room) => {
    corners.push({ x: room.x - room.width / 2, z: room.z - room.depth / 2 });
    corners.push({ x: room.x + room.width / 2, z: room.z + room.depth / 2 });
  });
  testMap.floorplan.items.forEach((item) => {
    const w = inchesToWorld(item.width) / 2;
    const d = inchesToWorld(item.depth) / 2;
    corners.push({ x: item.x - w, z: item.z - d });
    corners.push({ x: item.x + w, z: item.z + d });
  });

  if (!corners.length) {
    Object.assign(view, { minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 });
    return;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  corners.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  });

  const margin = 1.5;
  if (maxX - minX < 4) {
    const diff = 4 - (maxX - minX);
    minX -= diff / 2;
    maxX += diff / 2;
  }
  if (maxZ - minZ < 4) {
    const diff = 4 - (maxZ - minZ);
    minZ -= diff / 2;
    maxZ += diff / 2;
  }

  view.minX = minX - margin;
  view.maxX = maxX + margin;
  view.minZ = minZ - margin;
  view.maxZ = maxZ + margin;

  const worldW = view.maxX - view.minX;
  const worldH = view.maxZ - view.minZ;
  const svgAspect = (view.width - view.pad * 2) / (view.height - view.pad * 2);
  const worldAspect = worldW / worldH;
  if (worldAspect > svgAspect) {
    const targetH = worldW / svgAspect;
    const diff = targetH - worldH;
    view.minZ -= diff / 2;
    view.maxZ += diff / 2;
  } else {
    const targetW = worldH * svgAspect;
    const diff = targetW - worldW;
    view.minX -= diff / 2;
    view.maxX += diff / 2;
  }
}

function renderPlan() {
  updateViewBounds();
  svg.innerHTML = '';

  const grid = createSvgElement('g', { class: 'grid-layer' });
  const gridStep = snapEnabled ? snapSize : 1;
  const startX = Math.ceil(view.minX / gridStep) * gridStep;
  const startZ = Math.ceil(view.minZ / gridStep) * gridStep;
  for (let x = startX; x <= view.maxX; x += gridStep) {
    const a = worldToSvg(x, view.minZ);
    const b = worldToSvg(x, view.maxZ);
    grid.appendChild(createSvgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: Math.abs(x) < 0.001 ? 'axis-line' : 'grid-line' }));
  }
  for (let z = startZ; z <= view.maxZ; z += gridStep) {
    const a = worldToSvg(view.minX, z);
    const b = worldToSvg(view.maxX, z);
    grid.appendChild(createSvgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: Math.abs(z) < 0.001 ? 'axis-line' : 'grid-line' }));
  }
  svg.appendChild(grid);

  testMap.floorplan.floor.rooms.forEach((room) => renderRoom(room));
  testMap.floorplan.walls.forEach((wall) => renderWall(wall));
  testMap.floorplan.floor.rooms.forEach((room) => renderRoomInteraction(room));
  testMap.floorplan.openings.forEach((opening) => renderOpening(opening));

  if (drawStart) {
    const a = worldToSvg(drawStart[0], drawStart[1]);
    svg.appendChild(createSvgElement('circle', { class: 'draw-anchor', cx: a.x, cy: a.y, r: 6 }));
  }

  testMap.floorplan.items.forEach((item) => renderPlanItem(item));
  const selectedRoom = selectedRoomId ? testMap.getRoom(selectedRoomId) : null;
  if (selectedRoom) renderSelectedRoomHandles(selectedRoom);
}

function renderRoom(room) {
  const a = worldToSvg(room.x - room.width / 2, room.z - room.depth / 2);
  const b = worldToSvg(room.x + room.width / 2, room.z + room.depth / 2);
  const rect = createSvgElement('rect', {
    class: `room-rect ${selectedRoomId === room.id ? 'selected' : ''}`,
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
    'data-room-id': room.id
  });
  rect.addEventListener('click', (event) => {
    if (mode !== 'select') return;
    event.stopPropagation();
    selectRoom(room.id);
  });
  svg.appendChild(rect);

}

function renderRoomHandles(room, a, b) {
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
      x: handle.x - 6,
      y: handle.y - 6,
      width: 12,
      height: 12,
      rx: 3,
      'data-room-handle': handle.side
    });
    node.addEventListener('pointerdown', (event) => beginRoomResize(event, room.id, handle.side));
    svg.appendChild(node);
  });
}
function renderRoomInteraction(room) {
  if (mode !== 'select') return;
  const a = worldToSvg(room.x - room.width / 2, room.z - room.depth / 2);
  const b = worldToSvg(room.x + room.width / 2, room.z + room.depth / 2);
  const rect = createSvgElement('rect', {
    class: 'room-hit-rect',
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
    'data-room-hit-id': room.id,
    fill: 'rgba(54, 194, 255, 0.001)'
  });
  rect.addEventListener('pointerdown', (event) => beginRoomDrag(event, room.id));
  rect.addEventListener('click', (event) => {
    event.stopPropagation();
    selectRoom(room.id);
  });
  svg.appendChild(rect);
}

function renderSelectedRoomHandles(room) {
  const a = worldToSvg(room.x - room.width / 2, room.z - room.depth / 2);
  const b = worldToSvg(room.x + room.width / 2, room.z + room.depth / 2);
  renderRoomHandles(room, a, b);
}

function renderWall(wall) {
  const a = worldToSvg(wall.from[0], wall.from[1]);
  const b = worldToSvg(wall.to[0], wall.to[1]);
  const line = createSvgElement('line', {
    class: `wall-line ${selectedWallId === wall.id ? 'selected' : ''}`,
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    stroke: wall.color || '#f9fbff',
    'data-wall-id': wall.id
  });
  line.addEventListener('pointerdown', (event) => {
    beginWallDrag(event, wall.id);
  });
  line.addEventListener('click', (event) => {
    event.stopPropagation();
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    if (mode === 'delete-wall') {
      pushHistory();
      testMap.deleteWall(wall.id);
      clearSelection();
      refreshShadows();
      renderPlan();
    } else if (mode === 'add-door' || mode === 'add-window') {
      pushHistory();
      const opening = testMap.addOpening(wall.id, mode === 'add-door' ? 'door' : 'window', getWallProjectionT(wall, world));
      refreshShadows();
      selectOpening(opening?.id || null);
    } else if (mode === 'select') {
      selectWall(wall.id);
    }
  });
  svg.appendChild(line);
}

function renderOpening(opening) {
  const wall = testMap.getWall(opening.wallId);
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
    class: `opening-line ${opening.type === 'door' ? 'door-line' : 'window-line'} ${selectedOpeningId === opening.id ? 'selected' : ''}`,
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    'data-opening-id': opening.id
  });
  line.addEventListener('pointerdown', (event) => beginOpeningDrag(event, opening.id));
  line.addEventListener('click', (event) => {
    event.stopPropagation();
    if (mode === 'delete-wall') {
      pushHistory();
      testMap.deleteOpening(opening.id);
      clearSelection();
      refreshShadows();
      renderPlan();
    }
  });
  svg.appendChild(line);
}

function renderPlanItem(item) {
  const center = worldToSvg(item.x, item.z);
  const itemScale = Number(item.scale || 1);
  const w = inchesToWorld(item.width) * itemScale;
  const d = inchesToWorld(item.depth) * itemScale;
  const a = worldToSvg(item.x - w / 2, item.z - d / 2);
  const b = worldToSvg(item.x + w / 2, item.z + d / 2);
  const definition = testMap.getFurnitureDefinition(item.type);
  const rotationDegrees = ((item.rotation || 0) * 180 / Math.PI) || 0;
  const group = createSvgElement('g', {
    'data-item-id': item.id,
    transform: `rotate(${rotationDegrees} ${center.x} ${center.y})`
  });
  const rect = createSvgElement('rect', {
    class: `item-rect ${selectedItemId === item.id ? 'selected' : ''}`,
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
  group.addEventListener('pointerdown', (event) => beginItemDrag(event, item.id));
  svg.appendChild(group);
}

function beginRoomDrag(event, roomId) {
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  selectRoom(roomId);
  const room = testMap.getRoom(roomId);
  if (!room) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  roomDragState = {
    roomId,
    offsetX: room.x - world.x,
    offsetZ: room.z - world.z,
    originalX: room.x,
    originalZ: room.z,
    width: room.width,
    depth: room.depth,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function beginRoomResize(event, roomId, side) {
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  selectRoom(roomId);
  const room = testMap.getRoom(roomId);
  if (!room) return;
  roomResizeState = {
    roomId,
    side,
    original: { x: room.x, z: room.z, width: room.width, depth: room.depth },
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function moveRoomDrag(event) {
  if (!roomDragState) return;
  const room = testMap.getRoom(roomDragState.roomId);
  if (!room) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  const snappedRoom = snapRoomPosition(room, world.x + roomDragState.offsetX, world.z + roomDragState.offsetZ);
  const nextX = snappedRoom.x;
  const nextZ = snappedRoom.z;
  if (!roomDragState.historyPushed && Math.hypot(nextX - roomDragState.originalX, nextZ - roomDragState.originalZ) > 0.02) {
    pushHistory();
    roomDragState.historyPushed = true;
  }
  testMap.updateRoom(room.id, { x: nextX, z: nextZ }, { moveItems: true });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function moveRoomResize(event) {
  if (!roomResizeState) return;
  const room = testMap.getRoom(roomResizeState.roomId);
  if (!room) return;
  const point = svgPointFromEvent(event);
  const world = snapWorldPoint(svgToWorld(point.x, point.y));
  const original = roomResizeState.original;
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  let nextLeft = left;
  let nextRight = right;
  let nextTop = top;
  let nextBottom = bottom;

  if (roomResizeState.side === 'west') nextLeft = Math.min(world.x, right - 1.2);
  if (roomResizeState.side === 'east') nextRight = Math.max(world.x, left + 1.2);
  if (roomResizeState.side === 'north') nextTop = Math.min(world.z, bottom - 1.2);
  if (roomResizeState.side === 'south') nextBottom = Math.max(world.z, top + 1.2);

  const patch = {
    x: snapNumber((nextLeft + nextRight) / 2),
    z: snapNumber((nextTop + nextBottom) / 2),
    width: snapNumber(nextRight - nextLeft),
    depth: snapNumber(nextBottom - nextTop)
  };
  if (!roomResizeState.historyPushed && (Math.abs(patch.width - original.width) > 0.02 || Math.abs(patch.depth - original.depth) > 0.02)) {
    pushHistory();
    roomResizeState.historyPushed = true;
  }
  testMap.updateRoom(room.id, patch, { moveItems: false });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function finishRoomEdit() {
  roomDragState = null;
  roomResizeState = null;
}

function beginItemDrag(event, itemId) {
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  rememberPointer(event);
  selectItem(itemId);
  const item = testMap.getItem(itemId);
  if (!item || item.locked) return;
  if (maybeBeginItemGesture(itemId)) {
    dragState = null;
    return;
  }
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  dragState = {
    itemId,
    offsetX: item.x - world.x,
    offsetZ: item.z - world.z,
    originalX: item.x,
    originalZ: item.z,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function rememberPointer(event) {
  activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
    targetItemId: event.target.closest?.('[data-item-id]')?.dataset.itemId || selectedItemId
  });
}

function updatePointer(event) {
  const pointer = activePointers.get(event.pointerId);
  if (!pointer) return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
}

function forgetPointer(event) {
  activePointers.delete(event.pointerId);
}

function getItemGesturePointers(itemId) {
  return [...activePointers.values()].filter((pointer) => pointer.targetItemId === itemId).slice(0, 2);
}

function pointerDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointerAngle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function maybeBeginItemGesture(itemId) {
  const item = testMap.getItem(itemId);
  const pointers = getItemGesturePointers(itemId);
  if (!item || pointers.length < 2) return false;
  itemGestureState = {
    itemId,
    startDistance: Math.max(1, pointerDistance(pointers[0], pointers[1])),
    startAngle: pointerAngle(pointers[0], pointers[1]),
    startRotation: item.rotation || 0,
    startScale: item.scale || 1,
    historyPushed: false
  };
  return true;
}

function moveItemGesture() {
  if (!itemGestureState) return;
  const item = testMap.getItem(itemGestureState.itemId);
  const pointers = getItemGesturePointers(itemGestureState.itemId);
  if (!item || item.locked || pointers.length < 2) return;
  const nextScale = Math.max(0.5, Math.min(4, itemGestureState.startScale * pointerDistance(pointers[0], pointers[1]) / itemGestureState.startDistance));
  const nextRotation = itemGestureState.startRotation + pointerAngle(pointers[0], pointers[1]) - itemGestureState.startAngle;
  if (!itemGestureState.historyPushed) {
    pushHistory();
    itemGestureState.historyPushed = true;
  }
  testMap.updateItem(item.id, { rotation: nextRotation, scale: Number(nextScale.toFixed(3)) });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function beginOpeningDrag(event, openingId) {
  event.preventDefault();
  event.stopPropagation();
  selectOpening(openingId);
  if (mode === 'delete-wall') {
    pushHistory();
    testMap.deleteOpening(openingId);
    clearSelection();
    refreshShadows();
    renderPlan();
    return;
  }
  if (mode !== 'select') return;
  const opening = testMap.getOpening(openingId);
  const wall = opening ? testMap.getWall(opening.wallId) : null;
  if (!opening || !wall) return;
  openingDragState = {
    openingId,
    originalT: opening.t ?? 0.5,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function moveItemTo(itemId, x, z) {
  const item = testMap.getItem(itemId);
  if (!item || item.locked) return;
  const snapped = snapWorldPoint({ x, z });

  const definition = testMap.getFurnitureDefinition(item.type);
  if (definition.placeType === 'wall') {
    let minDistance = Infinity;
    let bestProjX = snapped.x;
    let bestProjZ = snapped.z;
    let bestAngle = item.rotation || 0;
    let bestWall = null;

    testMap.floorplan.walls.forEach((wall) => {
      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len2 = dx * dx + dz * dz;
      if (len2 === 0) return;
      let t = ((snapped.x - x1) * dx + (snapped.z - z1) * dz) / len2;
      t = Math.max(0.08, Math.min(0.92, t)); // 限制在墙线段之内，稍微留点边距防止穿墙角
      const projX = x1 + t * dx;
      const projZ = z1 + t * dz;
      const dist = Math.hypot(snapped.x - projX, snapped.z - projZ);
      if (dist < minDistance) {
        minDistance = dist;
        bestProjX = projX;
        bestProjZ = projZ;
        bestAngle = -Math.atan2(dz, dx);
        bestWall = wall;
      }
    });

    if (bestWall) {
      const wallThickness = testMap.floorplan.wallThickness || 0.18;
      // 计算家具厚度 (米)
      const itemScale = Number(item.scale || 1);
      const itemDepth = (((item.depth || definition.defaultSize.depth) / 24) * itemScale);

      // 从投影点指向拖拽点的向量
      const vx = snapped.x - bestProjX;
      const vz = snapped.z - bestProjZ;
      const vLen = Math.hypot(vx, vz);

      let offsetX = 0;
      let offsetZ = 0;
      const offsetDist = wallThickness / 2 + itemDepth / 2 + 0.002; // 墙半宽 + 家具半深 + 2毫米余量

      if (vLen > 0.0001) {
        offsetX = (vx / vLen) * offsetDist;
        offsetZ = (vz / vLen) * offsetDist;
      } else {
        // 若完全重合，沿法线方向偏移
        const [x1, z1] = bestWall.from;
        const [x2, z2] = bestWall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz) || 1;
        offsetX = (-dz / len) * offsetDist;
        offsetZ = (dx / len) * offsetDist;
      }

      item.x = bestProjX + offsetX;
      item.z = bestProjZ + offsetZ;

      // 使用点积法智能判断朝向：选择与偏移方向 (offsetX, offsetZ) 同向的那个旋转角度
      const dot1 = Math.sin(bestAngle) * offsetX + Math.cos(bestAngle) * offsetZ;
      const dot2 = Math.sin(bestAngle + Math.PI) * offsetX + Math.cos(bestAngle + Math.PI) * offsetZ;
      item.rotation = dot1 >= dot2 ? bestAngle : bestAngle + Math.PI;
    } else {
      item.x = snapped.x;
      item.z = snapped.z;
    }

    if (item.elevation === undefined || item.elevation === 0) {
      item.elevation = 33.6; // 离地 1.4 米 (33.6 英寸)
    }
  } else if (definition.placeType === 'ceiling') {
    item.x = snapped.x;
    item.z = snapped.z;
    item.elevation = (testMap.floorplan.wallHeight || 2.8) * 24; // 贴齐天花板
  } else {
    item.x = snapped.x;
    item.z = snapped.z;
  }

  const room = testMap.getRoomAt(item.x, item.z);
  if (room) testMap.assignItemToRoom(item.id, room.id);
  const node = testMap.itemNodes.get(item.id);

  if (item.type === 'mannequin' && item.pose && item.pose !== 'stand') {
    const seat = findNearestSeat(item);
    if (!seat) {
      item.pose = 'stand';
      item.elevation = 0;
      definition.build(testMap, item, node, {
        width: (item.width / 24) * (item.scale || 1),
        depth: (item.depth / 24) * (item.scale || 1),
        height: (item.height / 24) * (item.scale || 1)
      });
    }
  }

  if (node) {
    node.position.set(item.x, (item.elevation || 0) / 24, item.z);
    node.rotation.y = item.rotation || 0;
  }
  renderPlan();
}

function moveOpeningToWorld(openingId, world, dragMeta) {
  const opening = testMap.getOpening(openingId);
  const wall = opening ? testMap.getWall(opening.wallId) : null;
  if (!opening || !wall) return;
  const nextT = getWallProjectionT(wall, world);
  if (dragMeta && !dragMeta.historyPushed && Math.abs(nextT - dragMeta.originalT) > 0.01) {
    pushHistory();
    dragMeta.historyPushed = true;
  }
  testMap.updateOpening(openingId, { t: nextT }, false);
  updateEditor();
  renderPlan();
}

function finishOpeningDrag() {
  if (!openingDragState) return;
  const openingId = openingDragState.openingId;
  openingDragState = null;
  testMap.build();
  refreshShadows();
  selectOpening(openingId);
}

function beginWallDrag(event, wallId) {
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  rememberPointer(event);
  selectWall(wallId);
  const wall = testMap.getWall(wallId);
  if (!wall) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  wallDragState = {
    wallId,
    originalFrom: [...wall.from],
    originalTo: [...wall.to],
    startWorldX: world.x,
    startWorldZ: world.z,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function finishWallDrag() {
  if (!wallDragState) return;
  const wallId = wallDragState.wallId;
  wallDragState = null;
  testMap.build();
  refreshShadows();
  selectWall(wallId);
}

function moveWallBy(wallId, dx, dz) {
  const wall = testMap.getWall(wallId);
  if (!wall) return;
  
  let nextFromX = wallDragState.originalFrom[0] + dx;
  let nextFromZ = wallDragState.originalFrom[1] + dz;
  let nextToX = wallDragState.originalTo[0] + dx;
  let nextToZ = wallDragState.originalTo[1] + dz;
  
  if (snapEnabled && snapSize) {
    const origDx = wallDragState.originalTo[0] - wallDragState.originalFrom[0];
    const origDz = wallDragState.originalTo[1] - wallDragState.originalFrom[1];
    const snappedFrom = snapWorldPoint({ x: nextFromX, z: nextFromZ });
    nextFromX = snappedFrom.x;
    nextFromZ = snappedFrom.z;
    nextToX = Number((nextFromX + origDx).toFixed(3));
    nextToZ = Number((nextFromZ + origDz).toFixed(3));
  } else {
    nextFromX = Number(nextFromX.toFixed(3));
    nextFromZ = Number(nextFromZ.toFixed(3));
    nextToX = Number(nextToX.toFixed(3));
    nextToZ = Number(nextToZ.toFixed(3));
  }
  
  testMap.updateWall(wallId, {
    from: [nextFromX, nextFromZ],
    to: [nextToX, nextToZ]
  });
  
  updateEditor();
  renderPlan();
}

svg.addEventListener('pointermove', (event) => {
  updatePointer(event);
  if (itemGestureState) {
    moveItemGesture();
    return;
  }
  if (roomResizeState) {
    moveRoomResize(event);
    return;
  }
  if (roomDragState) {
    moveRoomDrag(event);
    return;
  }
  if (dragState) {
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    const nextX = world.x + dragState.offsetX;
    const nextZ = world.z + dragState.offsetZ;
    if (!dragState.historyPushed && Math.hypot(nextX - dragState.originalX, nextZ - dragState.originalZ) > 0.02) {
      pushHistory();
      dragState.historyPushed = true;
    }
    moveItemTo(dragState.itemId, nextX, nextZ);
  }
  if (openingDragState) {
    const point = svgPointFromEvent(event);
    moveOpeningToWorld(openingDragState.openingId, svgToWorld(point.x, point.y), openingDragState);
  }
  if (wallDragState) {
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    const dx = world.x - wallDragState.startWorldX;
    const dz = world.z - wallDragState.startWorldZ;
    if (!wallDragState.historyPushed && Math.hypot(dx, dz) > 0.02) {
      pushHistory();
      wallDragState.historyPushed = true;
    }
    moveWallBy(wallDragState.wallId, dx, dz);
  }
});

svg.addEventListener('pointerup', (event) => {
  forgetPointer(event);
  if (itemGestureState && activePointers.size < 2) itemGestureState = null;
  dragState = null;
  finishRoomEdit();
  finishOpeningDrag();
  finishWallDrag();
});

svg.addEventListener('pointercancel', (event) => {
  forgetPointer(event);
  if (itemGestureState && activePointers.size < 2) itemGestureState = null;
  dragState = null;
  finishRoomEdit();
  finishOpeningDrag();
  finishWallDrag();
});

svg.addEventListener('click', (event) => {
  if (event.target.closest?.('.wall-line') || event.target.closest?.('[data-item-id]') || event.target.closest?.('[data-opening-id]') || event.target.closest?.('[data-room-id]') || event.target.closest?.('[data-room-hit-id]') || event.target.closest?.('[data-room-handle]')) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  const snappedWorld = snapWorldPoint(world);
  const snapped = [snappedWorld.x, snappedWorld.z];

  if (mode === 'draw-wall') {
    if (!drawStart) {
      drawStart = snapped;
    } else {
      pushHistory();
      testMap.addWall(drawStart, snapped);
      drawStart = null;
      refreshShadows();
    }
    renderPlan();
  } else if (mode === 'add-room') {
    pushHistory();
    const room = testMap.addRoom({ x: snapped[0], z: snapped[1], name: `新房间 ${roomCounter++}` });
    refreshShadows();
    selectRoom(room.id);
  } else {
    clearSelection();
  }
});

function findMetadataFromNode(node, key) {
  let current = node;
  while (current) {
    if (current.metadata?.[key]) return current.metadata[key];
    current = current.parent;
  }
  return null;
}

function findOpeningIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintOpeningId');
}

function findItemIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintItemId');
}

function findWallIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintWallId');
}

function findRoomIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintRoomId');
}

function groundPointFromPointer() {
  const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
  const distance = ray.intersectsPlane(groundPlane);
  if (distance === null || distance === undefined || distance < 0) return null;
  return ray.origin.add(ray.direction.scale(distance));
}

function pickNearest3DTarget() {
  const pick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => (
    !!findOpeningIdFromNode(mesh)
    || !!findItemIdFromNode(mesh)
    || !!findWallIdFromNode(mesh)
    || !!findRoomIdFromNode(mesh)
  ));
  const mesh = pick?.pickedMesh;
  if (!mesh) return null;
  const openingId = findOpeningIdFromNode(mesh);
  if (openingId) return { type: 'opening', id: openingId, pick };
  const wallId = findWallIdFromNode(mesh);
  if (wallId) return { type: 'wall', id: wallId, pick };
  const itemId = findItemIdFromNode(mesh);
  if (itemId) return { type: 'item', id: itemId, pick };
  const roomId = findRoomIdFromNode(mesh);
  if (roomId) return { type: 'room', id: roomId, pick };
  return null;
}

function begin3DDrag(pointerInfo) {
  const event = pointerInfo.event;
  if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

  if (mode === 'add-door' || mode === 'add-window') {
    const target = pickNearest3DTarget();
    if (target && target.type === 'wall') {
      const wallId = target.id;
      const wall = testMap.getWall(wallId);
      if (wall && target.pick.pickedPoint) {
        pushHistory();
        const pt = target.pick.pickedPoint;
        const opening = testMap.addOpening(wallId, mode === 'add-door' ? 'door' : 'window', getWallProjectionT(wall, pt));
        refreshShadows();
        selectOpening(opening?.id || null);
        event.preventDefault();
        return;
      }
    }
  }

  const target = pickNearest3DTarget();
  if (!target) {
    clearSelection();
    return;
  }

  if (target.type === 'opening') {
    selectOpening(target.id);
    const opening = testMap.getOpening(target.id);
    const groundPoint = groundPointFromPointer();
    if (!opening || !groundPoint) return;
    drag3DState = {
      type: 'opening',
      openingId: target.id,
      pointerId: event.pointerId,
      originalT: opening.t ?? 0.5,
      historyPushed: false
    };
    document.body.classList.add('is-dragging-3d');
    canvas.setPointerCapture?.(event.pointerId);
    camera.detachControl(canvas);
    event.preventDefault();
    return;
  }

  if (target.type === 'wall') {
    selectWall(target.id);
    return;
  }

  if (target.type === 'room') {
    selectRoom(target.id);
    return;
  }

  const itemId = target.id;
  selectItem(itemId);
  const item = testMap.getItem(itemId);
  if (!item || item.locked) return;
  const groundPoint = groundPointFromPointer();
  if (!groundPoint) return;

  drag3DState = {
    type: 'item',
    itemId,
    pointerId: event.pointerId,
    offsetX: item.x - groundPoint.x,
    offsetZ: item.z - groundPoint.z,
    originalX: item.x,
    originalZ: item.z,
    historyPushed: false
  };
  document.body.classList.add('is-dragging-3d');
  canvas.setPointerCapture?.(event.pointerId);
  camera.detachControl(canvas);
  event.preventDefault();
}

function move3DDrag(pointerInfo) {
  if (!drag3DState) return;
  const groundPoint = groundPointFromPointer();
  if (!groundPoint) return;
  if (drag3DState.type === 'item') {
    const nextX = groundPoint.x + drag3DState.offsetX;
    const nextZ = groundPoint.z + drag3DState.offsetZ;
    if (!drag3DState.historyPushed && Math.hypot(nextX - drag3DState.originalX, nextZ - drag3DState.originalZ) > 0.02) {
      pushHistory();
      drag3DState.historyPushed = true;
    }
    moveItemTo(drag3DState.itemId, nextX, nextZ);
  } else if (drag3DState.type === 'opening') {
    moveOpeningToWorld(drag3DState.openingId, { x: groundPoint.x, z: groundPoint.z }, drag3DState);
    testMap.build();
    refreshShadows();
  }
  pointerInfo.event.preventDefault();
}

function end3DDrag(event) {
  if (!drag3DState) return;
  if (event?.pointerId !== undefined && drag3DState.pointerId !== event.pointerId) return;
  canvas.releasePointerCapture?.(drag3DState.pointerId);
  const openingId = drag3DState.type === 'opening' ? drag3DState.openingId : null;
  drag3DState = null;
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true);
  if (openingId) selectOpening(openingId);
}

scene.onPointerObservable.add((pointerInfo) => {
  if (currentView !== '3d') return;
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) begin3DDrag(pointerInfo);
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) move3DDrag(pointerInfo);
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) end3DDrag(pointerInfo.event);
});

canvas.addEventListener('pointercancel', end3DDrag);
window.addEventListener('pointerup', end3DDrag);

function clearSelection() {
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  updateEditor();
  renderPlan();
}

function selectRoom(roomId) {
  selectedRoomId = roomId;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  updateEditor();
  renderPlan();
}

function selectWall(wallId) {
  selectedWallId = wallId;
  selectedRoomId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(wallId);
  updateEditor();
  renderPlan();
}

function selectItem(itemId) {
  selectedItemId = itemId;
  selectedRoomId = null;
  selectedWallId = null;
  selectedOpeningId = null;
  testMap.setSelectedWall(null);
  testMap.setSelectedItem(itemId);
  updateEditor();
  renderPlan();
}

function selectOpening(openingId) {
  selectedOpeningId = openingId;
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  updateEditor();
  renderPlan();
}

function findNearestSeat(mannequinItem) {
  let nearest = null;
  let minDistance = 1.2; // 1.2 米以内判定为附近
  
  testMap.floorplan.items.forEach((other) => {
    if (other.id === mannequinItem.id) return;
    const definition = testMap.getFurnitureDefinition(other.type);
    if (!definition || !definition.interaction) return;
    
    const otherScale = Number(other.scale || 1);
    const otherSize = {
      width: (other.width / 24) * otherScale,
      depth: (other.depth / 24) * otherScale,
      height: (other.height / 24) * otherScale
    };
    
    const localPoints = definition.interaction.getInteractionPoints(otherSize);
    localPoints.forEach((p, index) => {
      // XZ 平面投影
      const cos = Math.cos(other.rotation || 0);
      const sin = Math.sin(other.rotation || 0);
      const wx = other.x + p.x * cos + p.z * sin;
      const wz = other.z - p.x * sin + p.z * cos;
      const wy = (other.elevation || 0) / 24 + p.y;
      
      const dx = mannequinItem.x - wx;
      const dz = mannequinItem.z - wz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < minDistance) {
        minDistance = dist;
        nearest = {
          item: other,
          pointIndex: index,
          pointType: definition.interaction.type,
          worldPos: { x: wx, y: wy, z: wz }
        };
      }
    });
  });
  
  return nearest;
}

function updateEditor() {
  const roomEditor = document.getElementById('room-editor');
  const wallEditor = document.getElementById('wall-editor');
  const itemEditor = document.getElementById('item-editor');
  const openingEditor = document.getElementById('opening-editor');
  const emptyState = document.getElementById('empty-state');
  const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : null;
  const wall = selectedWallId ? testMap.getWall(selectedWallId) : null;
  const item = selectedItemId ? testMap.getItem(selectedItemId) : null;
  const opening = selectedOpeningId ? testMap.getOpening(selectedOpeningId) : null;

  roomEditor.classList.toggle('hidden', !room);
  wallEditor.classList.toggle('hidden', !wall);
  itemEditor.classList.toggle('hidden', !item);
  openingEditor.classList.toggle('hidden', !opening);
  emptyState.classList.toggle('hidden', !!room || !!wall || !!item || !!opening);

  document.getElementById('floor-color').value = room?.color || testMap.floorplan.floor.color || '#f4efe6';

  if (room) {
    document.getElementById('selected-room-name').textContent = room.name || '房间';
    document.getElementById('room-name').value = room.name || '';
    document.getElementById('room-width').value = Number(room.width.toFixed(2));
    document.getElementById('room-depth').value = Number(room.depth.toFixed(2));
  }
  if (wall) {
    document.getElementById('selected-wall-name').textContent = wall.id;
    document.getElementById('wall-length').value = Number(testMap.getWallLength(wall.id).toFixed(2));
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const angleRad = Math.atan2(dz, dx);
    const angleDeg = Math.round(((angleRad * 180 / Math.PI) + 360) % 360);
    document.getElementById('wall-rotation').value = angleDeg;
    document.getElementById('wall-rotation-range').value = angleDeg;
  }

  if (item) {
    document.getElementById('selected-name').textContent = item.name;
    document.getElementById('item-width').value = Number((item.width / 24).toFixed(2));
    document.getElementById('item-depth').value = Number((item.depth / 24).toFixed(2));
    document.getElementById('item-height').value = Number((item.height / 24).toFixed(2));
    document.getElementById('item-elevation').value = Number(((item.elevation || 0) / 24).toFixed(2));
    const rotationDegrees = Math.round(((item.rotation || 0) * 180 / Math.PI + 360) % 360);
    document.getElementById('item-rotation').value = rotationDegrees;
    document.getElementById('item-rotation-range').value = rotationDegrees;
    document.getElementById('item-scale').value = Number((item.scale || 1).toFixed(2));
    document.getElementById('item-scale-range').value = item.scale || 1;
    document.getElementById('item-locked').checked = !!item.locked;

    const poseField = document.getElementById('item-pose-field');
    if (item.type === 'mannequin') {
      const seat = findNearestSeat(item);
      if (seat) {
        poseField.classList.remove('hidden');
        document.getElementById('item-pose').value = item.pose || 'stand';
      } else {
        poseField.classList.add('hidden');
        if (item.pose && item.pose !== 'stand') {
          setTimeout(() => {
            const cur = testMap.getItem(item.id);
            if (cur && cur.pose !== 'stand') {
              testMap.updateItem(item.id, { pose: 'stand', elevation: 0 });
              refreshShadows();
              updateEditor();
              renderPlan();
            }
          }, 0);
        }
      }
    } else {
      poseField.classList.add('hidden');
    }

    const lightField = document.getElementById('item-light-field');
    if (lightField) {
      const def = testMap.getFurnitureDefinition(item.type);
      if (def.category === 'lighting' || def.lightSource) {
        lightField.classList.remove('hidden');
        document.getElementById('item-light-on').checked = item.lightOn !== false;
      } else {
        lightField.classList.add('hidden');
      }
    }
  }

  if (opening) {
    document.getElementById('selected-opening-name').textContent = opening.type === 'door' ? '门' : '窗';
    document.getElementById('opening-position').value = Math.round((opening.t ?? 0.5) * 100);
    document.getElementById('opening-width').value = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
    const heightField = document.getElementById('opening-height-field');
    heightField.classList.toggle('hidden', opening.type !== 'window');
    const sillField = document.getElementById('opening-sill-field');
    sillField.classList.toggle('hidden', opening.type !== 'window');
    document.getElementById('opening-height').value = opening.height || 0.85;
    document.getElementById('opening-sill-height').value = opening.sillHeight ?? 1.05;

    const openField = document.getElementById('opening-open-field');
    const flipLrField = document.getElementById('opening-flip-lr-field');
    const flipIoField = document.getElementById('opening-flip-io-field');
    const isDoor = opening.type === 'door';
    if (openField) {
      openField.classList.toggle('hidden', !isDoor);
      document.getElementById('opening-open').checked = !!opening.isOpen;
    }
    if (flipLrField) {
      flipLrField.classList.toggle('hidden', !isDoor);
      document.getElementById('opening-flip-lr').checked = !!opening.isFlippedLR;
    }
    if (flipIoField) {
      flipIoField.classList.toggle('hidden', !isDoor);
      document.getElementById('opening-flip-io').checked = !!opening.isFlippedIO;
    }
  }

  renderDesignPanel(room, wall, item);
  revealRightPanelIfNeeded(room || wall || item || opening);
}

function renderDesignPanel(room, wall, item) {
  designSelectionPanel.innerHTML = '';
  const btnResetMaterial = document.getElementById('btn-reset-material');
  if (btnResetMaterial) {
    btnResetMaterial.disabled = !(room || wall || item);
  }
  const floorColorField = document.getElementById('floor-color-field');
  if (floorColorField) floorColorField.classList.toggle('hidden', !room);
  if (room) {
    designSelectionPanel.appendChild(createApplyMaterialButton('应用当前材质到房间地板', () => applyMaterialToRoomFloor(activeMaterialDescriptor)));
    return;
  }

  if (wall) {
    designSelectionPanel.appendChild(createColorField('墙正面颜色', wall.colorFront || wall.color || '#f9fbff', (color) => {
      pushHistory();
      testMap.updateWall(wall.id, { colorFront: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }));
    designSelectionPanel.appendChild(createColorField('墙背面颜色', wall.colorBack || wall.color || '#f9fbff', (color) => {
      pushHistory();
      testMap.updateWall(wall.id, { colorBack: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }));
    designSelectionPanel.appendChild(createApplyMaterialButton('应用当前材质到墙的正面', () => applyMaterialToWallFront(activeMaterialDescriptor)));
    designSelectionPanel.appendChild(createApplyMaterialButton('应用当前材质到墙的背面', () => applyMaterialToWallBack(activeMaterialDescriptor)));
    return;
  }

  if (item) {
    const definition = testMap.getFurnitureDefinition(item.type);
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = `${item.name} 组件颜色 / 材质`;
    designSelectionPanel.appendChild(title);
    definition.components.forEach((component) => {
      const group = document.createElement('div');
      group.className = 'component-material-row';
      group.appendChild(createColorField(component.label, item.colors?.[component.id] || component.defaultColor, (color) => {
        pushHistory();
        testMap.updateItemComponentColor(item.id, component.id, color);
        refreshShadows();
        updateEditor();
        renderPlan();
      }));
      group.appendChild(createApplyMaterialButton(`应用当前材质到${component.label}`, () => applyMaterialToItemComponent(component.id, activeMaterialDescriptor)));
      designSelectionPanel.appendChild(group);
    });
    return;
  }

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = '选择墙面或家具后，这里会显示可调整的颜色和材质入口。材质库里的“应用到地板”可直接修改地面。';
  designSelectionPanel.appendChild(hint);
}

function createApplyMaterialButton(text, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'apply-material-button';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}
function createColorField(labelText, value, onChange) {
  const label = document.createElement('label');
  label.className = 'field';
  const span = document.createElement('span');
  span.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.addEventListener('change', () => onChange(input.value));
  label.append(span, input);
  return label;
}

function revealRightPanelIfNeeded(hasSelection) {
  if (!hasSelection) return;
  const rightPanel = document.getElementById('right-panel');
  if (rightPanel.classList.contains('collapsed')) {
    rightPanel.classList.remove('collapsed');
    document.getElementById('btn-toggle-right').textContent = '›';
  }
}

function updateSelectedRoom() {
  if (!selectedRoomId) return;
  pushHistory();
  testMap.updateRoom(selectedRoomId, {
    name: document.getElementById('room-name').value,
    width: Number(document.getElementById('room-width').value),
    depth: Number(document.getElementById('room-depth').value)
  });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedWallLength() {
  if (!selectedWallId) return;
  pushHistory();
  testMap.updateWallLength(selectedWallId, Number(document.getElementById('wall-length').value));
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedWallRotation(deg) {
  if (!selectedWallId) return;
  const wall = testMap.getWall(selectedWallId);
  if (!wall) return;

  pushHistory();

  const angleRad = (deg % 360) * Math.PI / 180;
  
  // 以墙的中心点旋转墙的两个端点
  const x1 = wall.from[0];
  const z1 = wall.from[1];
  const x2 = wall.to[0];
  const z2 = wall.to[1];

  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const length = Math.hypot(x2 - x1, z2 - z1) || 1;

  const ux = Math.cos(angleRad);
  const uz = Math.sin(angleRad);

  const nextFromX = Number((midX - ux * length / 2).toFixed(3));
  const nextFromZ = Number((midZ - uz * length / 2).toFixed(3));
  const nextToX = Number((midX + ux * length / 2).toFixed(3));
  const nextToZ = Number((midZ + uz * length / 2).toFixed(3));

  testMap.updateWall(selectedWallId, {
    from: [nextFromX, nextFromZ],
    to: [nextToX, nextToZ]
  });

  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedRotation() {
  if (!selectedItemId) return;
  pushHistory();
  const degrees = Number(document.getElementById('item-rotation').value) || 0;
  testMap.rotateItem(selectedItemId, degrees * Math.PI / 180);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedScale(value) {
  if (!selectedItemId) return;
  pushHistory();
  const scale = Math.max(0.5, Math.min(4, Number(value) || 1));
  testMap.updateItem(selectedItemId, { scale });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedSize() {
  if (!selectedItemId) return;
  pushHistory();
  testMap.updateItem(selectedItemId, {
    width: Number(document.getElementById('item-width').value) * 24,
    depth: Number(document.getElementById('item-depth').value) * 24,
    height: Number(document.getElementById('item-height').value) * 24,
    elevation: Number(document.getElementById('item-elevation').value || 0) * 24
  });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedPose() {
  if (!selectedItemId) return;
  const item = testMap.getItem(selectedItemId);
  if (!item || item.type !== 'mannequin') return;
  const newPose = document.getElementById('item-pose').value;
  pushHistory();
  
  let patch = { pose: newPose };
  if (newPose !== 'stand') {
    const seat = findNearestSeat(item);
    if (seat) {
      patch.x = seat.worldPos.x;
      patch.z = seat.worldPos.z;
      patch.elevation = seat.worldPos.y * 24;
      patch.rotation = seat.item.rotation || 0;
    }
  } else {
    patch.elevation = 0;
  }
  
  testMap.updateItem(selectedItemId, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedOpening(patch) {
  if (!selectedOpeningId) return;
  pushHistory();
  testMap.updateOpening(selectedOpeningId, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function initMaterialControls() {
  materialCategorySelect.innerHTML = '';
  MATERIAL_CATEGORIES.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.label;
    materialCategorySelect.appendChild(option);
  });
  materialCategorySelect.value = 'paint';
  activeMaterialDescriptor = materialLibrary[0] || null;
  renderMaterialLibrary();
}

function renderMaterialLibrary() {
  const category = materialCategorySelect.value;
  const materials = materialLibrary.filter((material) => material.category === category);
  materialLibraryPanel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'material-library-header';
  const activeName = activeMaterialDescriptor?.name || '未选择材质';
  header.innerHTML = `<strong>${activeName}</strong>`;
  const applyFloorButton = document.createElement('button');
  applyFloorButton.type = 'button';
  applyFloorButton.textContent = '应用到地板';
  applyFloorButton.addEventListener('click', () => applyMaterialToFloor(activeMaterialDescriptor));
  header.appendChild(applyFloorButton);
  materialLibraryPanel.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'material-grid';

  // 动态创建并插入第一个“+”号上传材质方格
  const uploadButton = document.createElement('button');
  uploadButton.type = 'button';
  uploadButton.className = 'material-swatch upload-swatch';
  uploadButton.title = '上传自定义材质';
  uploadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
  uploadButton.addEventListener('click', () => {
    document.getElementById('material-upload').click();
  });
  grid.appendChild(uploadButton);

  materials.forEach((material) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `material-swatch ${activeMaterialDescriptor?.id === material.id ? 'active' : ''}`;
    button.title = material.name;
    if (material.kind === 'texture' && material.src) {
      button.style.backgroundImage = `url(${material.src})`;
    } else {
      button.style.backgroundColor = material.color || '#ffffff';
    }
    button.addEventListener('click', () => {
      activeMaterialDescriptor = material;
      renderMaterialLibrary();
      updateEditor();
    });
    grid.appendChild(button);
  });
  materialLibraryPanel.appendChild(grid);
}

function applyMaterialToRoomFloor(material) {
  if (!selectedRoomId || !material) return;
  pushHistory();
  testMap.setRoomFloorMaterial(selectedRoomId, material);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToFloor(material) {
  if (!material) return;
  pushHistory();
  testMap.setFloorMaterial(material);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToWall(material) {
  if (!selectedWallId || !material) return;
  pushHistory();
  const color = material.color || '#f9fbff';
  testMap.updateWall(selectedWallId, { material, color });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToWallFront(material) {
  if (!selectedWallId || !material) return;
  pushHistory();
  const colorFront = material.color || '#f9fbff';
  testMap.updateWall(selectedWallId, { materialFront: material, colorFront });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToWallBack(material) {
  if (!selectedWallId || !material) return;
  pushHistory();
  const colorBack = material.color || '#f9fbff';
  testMap.updateWall(selectedWallId, { materialBack: material, colorBack });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToItemComponent(componentId, material) {
  if (!selectedItemId || !material) return;
  pushHistory();
  testMap.updateItemComponentMaterial(selectedItemId, componentId, material);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function initFurnitureButtons() {
  const categorySelect = document.getElementById('furniture-category-select');
  
  if (categorySelect && categorySelect.children.length === 0) {
    FURNITURE_CATEGORIES.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.label;
      categorySelect.appendChild(opt);
    });
    
    categorySelect.addEventListener('change', () => {
      renderFurnitureGrid();
    });
  }

  renderFurnitureGrid();
}

function renderFurnitureGrid() {
  const itemGrid = document.getElementById('item-grid');
  if (!itemGrid) return;
  itemGrid.innerHTML = '';

  const categorySelect = document.getElementById('furniture-category-select');
  const selectedCat = categorySelect ? categorySelect.value : 'all';

  const filtered = FURNITURE_LIST.filter((definition) => {
    if (selectedCat === 'all') return true;
    return definition.category === selectedCat;
  });

  filtered.forEach((definition) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.addItem = definition.type;
    button.textContent = definition.name;
    itemGrid.appendChild(button);
  });
}

materialCategorySelect.addEventListener('change', renderMaterialLibrary);

materialUploadInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const src = await readFileAsDataURL(file);
  const descriptor = createTextureMaterialDescriptor({
    id: `custom_${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, '') || '自定义材质',
    fileName: file.name,
    category: materialCategorySelect.value || 'custom',
    src,
    scale: 1
  });
  descriptor.id = `custom_${Date.now()}`;
  materialLibrary.unshift(descriptor);
  activeMaterialDescriptor = descriptor;
  materialUploadInput.value = '';
  renderMaterialLibrary();
  updateEditor();
});

viewToggleButton.addEventListener('click', () => setView(currentView === '2d' ? '3d' : '2d'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

document.addEventListener('keydown', (event) => {
  // 输入焦点拦截器，防止打字时触发快捷键
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return;
  }

  const key = event.key.toLowerCase();

  // 1. WASD 视角移动 (3D模式下)
  if (currentView === '3d' && ['w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    const forward = camera.target.subtract(camera.position);
    forward.y = 0;
    forward.normalize();
    const right = new BABYLON.Vector3(-forward.z, 0, forward.x);
    const speed = 0.25; // 0.25 米/次

    if (key === 'w') camera.target.addInPlace(forward.scale(speed));
    if (key === 's') camera.target.subtractInPlace(forward.scale(speed));
    if (key === 'a') camera.target.subtractInPlace(right.scale(speed));
    if (key === 'd') camera.target.addInPlace(right.scale(speed));
    return;
  }

  // 2. 选中的物品/门窗移动 (上下左右键)
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
    if (selectedItemId) {
      const item = testMap.getItem(selectedItemId);
      if (item && !item.locked) {
        let dx = 0;
        let dz = 0;
        const step = 0.1; // 0.1 米
        if (key === 'arrowup') dz = step;
        if (key === 'arrowdown') dz = -step;
        if (key === 'arrowleft') dx = -step;
        if (key === 'arrowright') dx = step;

        pushHistory();
        testMap.updateItem(selectedItemId, { x: item.x + dx, z: item.z + dz });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    } else if (selectedOpeningId && ['arrowleft', 'arrowright'].includes(key)) {
      const opening = testMap.getOpening(selectedOpeningId);
      const wall = opening ? testMap.getWall(opening.wallId) : null;
      if (opening && wall) {
        const wallLength = Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]) || 1;
        const step = 0.05; // 每次左右平移 5 厘米
        const deltaT = step / wallLength;
        let nextT = opening.t ?? 0.5;
        if (key === 'arrowleft') nextT -= deltaT;
        if (key === 'arrowright') nextT += deltaT;
        nextT = Math.max(0.01, Math.min(0.99, nextT));

        pushHistory();
        testMap.updateOpening(selectedOpeningId, { t: nextT });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    }
    return;
  }

  // 3. 选中的物品在Z轴/高度移动 (PageUp / PageDown)
  if (event.key === 'PageUp' || event.key === 'PageDown') {
    event.preventDefault();
    if (selectedItemId) {
      const item = testMap.getItem(selectedItemId);
      if (item && !item.locked) {
        pushHistory();
        const step = 2.4; // 2.4 英寸 (0.1 米)
        let newElev = item.elevation || 0;
        if (event.key === 'PageUp') newElev += step;
        if (event.key === 'PageDown') newElev = Math.max(0, newElev - step);

        testMap.updateItem(selectedItemId, { elevation: newElev });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    } else if (selectedOpeningId) {
      const opening = testMap.getOpening(selectedOpeningId);
      if (opening && opening.type === 'window') {
        pushHistory();
        const step = 0.05; // 0.05 米
        let newSill = opening.sillHeight ?? 1.05;
        if (event.key === 'PageUp') newSill += step;
        if (event.key === 'PageDown') newSill = Math.max(0.1, newSill - step);

        testMap.updateOpening(selectedOpeningId, { sillHeight: Number(newSill.toFixed(3)) });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    }
    return;
  }

  // 4. 选中的物品缩放 (+ / - / =)
  if (key === '+' || key === '=' || key === '-') {
    event.preventDefault();
    if (selectedItemId) {
      const item = testMap.getItem(selectedItemId);
      if (item && !item.locked) {
        pushHistory();
        const currentScale = item.scale || 1;
        let nextScale = currentScale;
        if (key === '+' || key === '=') {
          nextScale = Math.min(4.0, currentScale + 0.05);
        } else if (key === '-') {
          nextScale = Math.max(0.5, currentScale - 0.05);
        }

        testMap.updateItem(selectedItemId, { scale: nextScale });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    }
    return;
  }

  // 5. 选中的物品旋转 ([ / ])
  if (key === '[' || key === ']') {
    event.preventDefault();
    if (selectedItemId) {
      const item = testMap.getItem(selectedItemId);
      if (item && !item.locked) {
        pushHistory();
        const stepDeg = 15; // 每次旋转 15 度
        const radStep = stepDeg * Math.PI / 180;
        let rotation = item.rotation || 0;
        if (key === '[') rotation -= radStep;
        if (key === ']') rotation += radStep;
        rotation = (rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

        testMap.updateItem(selectedItemId, { rotation });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    }
    return;
  }

  // 选中元素按 Delete / Backspace 直接删除
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedItemId) {
      event.preventDefault();
      pushHistory();
      if (testMap.deleteItem(selectedItemId)) {
        clearSelection();
        refreshShadows();
      }
      return;
    }
    if (selectedOpeningId) {
      event.preventDefault();
      pushHistory();
      testMap.deleteOpening(selectedOpeningId);
      clearSelection();
      refreshShadows();
      return;
    }
    if (selectedWallId) {
      event.preventDefault();
      pushHistory();
      testMap.deleteWall(selectedWallId);
      clearSelection();
      refreshShadows();
      return;
    }
  }

  // Ctrl/Meta 撤销与重做
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      redo();
    }
    return;
  }

  // 5.5. 选中的灯具开关灯快捷键 (L 键)
  if (key === 'l' && selectedItemId) {
    const item = testMap.getItem(selectedItemId);
    const definition = item ? testMap.getFurnitureDefinition(item.type) : null;
    if (item && (definition?.category === 'lighting' || definition?.lightSource)) {
      event.preventDefault();
      pushHistory();
      testMap.updateItem(selectedItemId, { lightOn: item.lightOn === false });
      refreshShadows();
      updateEditor();
      renderPlan();
      return;
    }
  }

  // 行业常用单键建筑快捷键 (Space, Escape, L, E, R, D, W)
  let targetMode = null;

  if (event.key === ' ') {
    event.preventDefault(); // 拦截空格默认的页面向下滚动
    targetMode = 'select';
  } else if (event.key === 'Escape') {
    targetMode = 'select';
  } else {
    const keyMap = {
      'l': 'draw-wall',
      'e': 'delete-wall',
      'r': 'add-room',
      'd': 'add-door',
      'w': 'add-window'
    };
    targetMode = keyMap[key];
  }

  if (targetMode) {
    const button = document.querySelector(`.floor-tools .mode[data-mode="${targetMode}"]`);
    if (button) {
      button.click();
    }
  }
});

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
    document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== button.dataset.tab));
  });
});

document.querySelectorAll('.mode').forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    drawStart = null;
    document.querySelectorAll('.mode').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
    renderPlan();
  });
});

document.getElementById('item-grid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-item]');
  if (!button) return;
  const type = button.dataset.addItem;
  const definition = testMap.getFurnitureDefinition(type);
  const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : testMap.floorplan.floor.rooms[0];
  const x = room ? room.x : 0;
  const z = room ? room.z : 0;
  pushHistory();
  const item = testMap.addItem({ type, ...definition.defaultSize, x, z, roomId: room?.id });
  if (room) testMap.assignItemToRoom(item.id, room.id);
  refreshShadows();
  selectItem(item.id);
});

['room-width', 'room-depth', 'room-name'].forEach((id) => {
  document.getElementById(id).addEventListener('change', updateSelectedRoom);
});

['item-width', 'item-depth', 'item-height', 'item-elevation'].forEach((id) => {
  document.getElementById(id).addEventListener('change', updateSelectedSize);
});

document.getElementById('item-rotation').addEventListener('change', updateSelectedRotation);
document.getElementById('item-rotation-range').addEventListener('input', (event) => {
  document.getElementById('item-rotation').value = event.target.value;
  updateSelectedRotation();
});
document.getElementById('item-scale').addEventListener('change', (event) => updateSelectedScale(event.target.value));
document.getElementById('item-scale-range').addEventListener('input', (event) => {
  document.getElementById('item-scale').value = Number(event.target.value).toFixed(2);
  updateSelectedScale(event.target.value);
});
document.getElementById('item-pose').addEventListener('change', updateSelectedPose);

document.getElementById('wall-length').addEventListener('change', updateSelectedWallLength);

document.getElementById('wall-rotation').addEventListener('change', (event) => {
  let val = Number(event.target.value) || 0;
  if (snapEnabled) {
    val = Math.round(val / 90) * 90;
  }
  val = (val % 360 + 360) % 360;
  event.target.value = val;
  document.getElementById('wall-rotation-range').value = val;
  updateSelectedWallRotation(val);
});

document.getElementById('wall-rotation-range').addEventListener('input', (event) => {
  let val = Number(event.target.value) || 0;
  if (snapEnabled) {
    val = Math.round(val / 90) * 90;
  }
  val = (val % 360 + 360) % 360;
  document.getElementById('wall-rotation').value = val;
  updateSelectedWallRotation(val);
});

document.getElementById('btn-delete-wall').addEventListener('click', () => {
  if (!selectedWallId) return;
  pushHistory();
  testMap.deleteWall(selectedWallId);
  clearSelection();
  refreshShadows();
});

document.getElementById('item-locked').addEventListener('change', (event) => {
  const item = selectedItemId ? testMap.getItem(selectedItemId) : null;
  if (!item) return;
  pushHistory();
  item.locked = event.target.checked;
  const node = testMap.itemNodes.get(item.id);
  if (node) node.metadata.locked = item.locked;
  updateHistoryButtons();
});

document.getElementById('item-light-on').addEventListener('change', (event) => {
  const item = selectedItemId ? testMap.getItem(selectedItemId) : null;
  if (!item) return;
  pushHistory();
  testMap.updateItem(selectedItemId, { lightOn: event.target.checked });
  refreshShadows();
  updateEditor();
  renderPlan();
});

document.getElementById('opening-position').addEventListener('change', (event) => {
  updateSelectedOpening({ t: Number(event.target.value) / 100 });
});

document.getElementById('opening-width').addEventListener('change', (event) => {
  updateSelectedOpening({ width: Number(event.target.value) });
});

document.getElementById('opening-height').addEventListener('change', (event) => {
  updateSelectedOpening({ height: Number(event.target.value) });
});

document.getElementById('opening-sill-height').addEventListener('change', (event) => {
  updateSelectedOpening({ sillHeight: Number(event.target.value) });
});

document.getElementById('opening-open').addEventListener('change', (event) => {
  updateSelectedOpening({ isOpen: event.target.checked });
});

document.getElementById('opening-flip-lr').addEventListener('change', (event) => {
  updateSelectedOpening({ isFlippedLR: event.target.checked });
});

document.getElementById('opening-flip-io').addEventListener('change', (event) => {
  updateSelectedOpening({ isFlippedIO: event.target.checked });
});

document.getElementById('snap-enabled').addEventListener('change', (event) => {
  snapEnabled = event.target.checked;
  renderPlan();
});

document.getElementById('snap-size').addEventListener('change', (event) => {
  snapSize = 1;
  event.target.value = '1';
  renderPlan();
});

document.getElementById('btn-delete-item').addEventListener('click', () => {
  if (!selectedItemId) return;
  pushHistory();
  if (testMap.deleteItem(selectedItemId)) {
    clearSelection();
    refreshShadows();
  }
});

document.getElementById('btn-delete-opening').addEventListener('click', () => {
  if (!selectedOpeningId) return;
  pushHistory();
  testMap.deleteOpening(selectedOpeningId);
  clearSelection();
  refreshShadows();
});

document.getElementById('floor-color').addEventListener('change', (event) => {
  pushHistory();
  if (selectedRoomId) {
    testMap.setRoomFloorMaterial(selectedRoomId, event.target.value);
  } else {
    testMap.setFloorColor(event.target.value);
  }
  updateEditor();
  renderPlan();
});

document.getElementById('btn-reset-camera').addEventListener('click', resetCamera);
document.getElementById('btn-reset-material').addEventListener('click', resetCurrentMaterial);

function resetInteractionState() {
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  drawStart = null;
  dragState = null;
  openingDragState = null;
  roomDragState = null;
  roomResizeState = null;
  itemGestureState = null;
  activePointers.clear();
  end3DDrag();
}

function downloadBuildingFile() {
  const json = testMap.stringifyBuildingFile({ name: testMap.floorplan.name || 'blueprint-building' });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createBuildingFileName(testMap.floorplan.name || 'blueprint-building');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadDXFFile() {
  const json = testMap.exportJSON();
  const dxfText = stringifyDXF(json);
  const blob = new Blob([dxfText], { type: 'image/vnd.dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createDXFFileName(testMap.floorplan.name || 'blueprint-building');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function download3MFFile() {
  const json = testMap.exportJSON();
  const bytes = create3MFPackage(json);
  const blob = new Blob([bytes], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = create3MFFileName(testMap.floorplan.name || 'blueprint-building');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadBuildingFile(file) {
  if (!file) return;
  const text = await file.text();
  pushHistory();
  testMap.loadBuildingFile(text);
  resetInteractionState();
  refreshShadows();
  updateEditor();
  renderPlan();
  if (currentView === '3d') {
    requestAnimationFrame(() => {
      engine.resize();
      scene.render();
    });
  }
}

document.getElementById('btn-save').addEventListener('click', downloadBuildingFile);
document.getElementById('btn-export-dxf').addEventListener('click', downloadDXFFile);
document.getElementById('btn-export-3mf').addEventListener('click', download3MFFile);

document.getElementById('btn-load').addEventListener('click', () => {
  buildingFileInput.value = '';
  buildingFileInput.click();
});

buildingFileInput.addEventListener('change', async (event) => {
  try {
    await loadBuildingFile(event.target.files?.[0]);
  } catch (error) {
    console.error(error);
    alert('建筑文件加载失败，请确认它是 blueprint3d-babylon 建筑文件。');
  }
});

document.getElementById('btn-new').addEventListener('click', () => {
  pushHistory();
  testMap.loadJSON(BLUEPRINT3D_TEST_FLOORPLAN);
  resetInteractionState();
  refreshShadows();
  updateEditor();
  renderPlan();
});

const btnFileMenu = document.getElementById('btn-file-menu');
const fileMenuContent = document.getElementById('file-menu-content');

btnFileMenu.addEventListener('click', (event) => {
  event.stopPropagation();
  fileMenuContent.classList.toggle('hidden');
});

fileMenuContent.addEventListener('click', () => fileMenuContent.classList.add('hidden'));
document.addEventListener('click', () => fileMenuContent.classList.add('hidden'));

const btnToggleRight = document.getElementById('btn-toggle-right');
const rightPanel = document.getElementById('right-panel');

btnToggleRight.addEventListener('click', (event) => {
  event.stopPropagation();
  const isCollapsed = rightPanel.classList.toggle('collapsed');
  btnToggleRight.textContent = isCollapsed ? '‹' : '›';
});



























