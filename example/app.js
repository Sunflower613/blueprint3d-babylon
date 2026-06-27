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

function switchToSelectMode() {
  const selectButton = document.querySelector('.mode[data-mode="select"]');
  if (selectButton) {
    selectButton.click();
  } else {
    mode = 'select';
    drawStart = null;
    document.querySelectorAll('.mode').forEach((candidate) => candidate.classList.toggle('active', candidate.dataset.mode === 'select'));
    renderPlan();
  }
}

let currentView = '2d';
let selectedRoomId = null;
let selectedWallId = null;
let selectedItemId = null;
let selectedOpeningId = null;
let selectedRoofId = null;
let selectedStairsId = null;
let selectedFenceId = null;
let drawStart = null;
let dragState = null;
let openingDragState = null;
let wallDragState = null;
let roomDragState = null;
let roomResizeState = null;
let drag3DState = null;
let structureDragState = null;
let drawWallPreviewCylinder = null;
let drawWallPreviewStartCylinder = null;
let drawWallPreviewWall = null;
let roofResizeState = null;
let fenceDragState = null;
let fenceHandleDragState = null;
let contextMenuElement = null;
let longPressState = null;
let snapEnabled = true;
let show3DGrid = true;
const grid3DNodes = [];
let active3DEditTarget = null;
const editHandleNodes = [];
let editHandleDragState = null;
let snapSize = 1;
let activeMaterialDescriptor = null;
let materialLibrary = [...DEFAULT_MATERIAL_PACKS];
let itemGestureState = null;
const activePointers = new Map();
let hasUserZoomedOrPanned = false;
const viewPointers = new Map();
let isPanning2D = false;
let panStart2D = null;
let prevTouchDist2D = 0;
let prevTouchCenter2D = null;
let roomCounter = 1;
let undoStack = [];
let redoStack = [];
let floorPanelCollapsed = false;

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
camera.attachControl(canvas, true, false, 1);
// 彻底移除相机自带的键盘输入移动模块，防止其默认的键盘行为（包含旋转和方向键监听）干扰自定义操作
camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
camera.lowerRadiusLimit = 5;
camera.upperRadiusLimit = 28;
camera.wheelDeltaPercentage = 0.02;
camera.panningSensibility = 1200;
camera.panningMouseButton = 1; // 设置鼠标中键为平移控制键
if (camera.inputs.attached.pointers) {
  camera.inputs.attached.pointers.buttons = [0, 1]; // 只允许鼠标左键(0)和中键(1)控制相机，避免右键(2)导致相机在右键呼出复制菜单时晃动
}

const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
hemi.intensity = 0.72;
const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.5), scene);
sun.position.set(8, 12, 8);
sun.intensity = 0.78;

const shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.blurKernel = 24;

let testMap = new Blueprint3DTestMap(scene);

ensureBuildingToolControls();
ensure3DGridControls();
ensureStructureEditor();
syncFloorControls();
initFurnitureButtons();
initMaterialControls();
createCustomDropdown('furniture-category-select');
createCustomDropdown('material-category');
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
  syncFloorControls();
  selectedRoomId = selectedRoomId && testMap.getRoom(selectedRoomId) ? selectedRoomId : null;
  selectedWallId = selectedWallId && testMap.getWall(selectedWallId) ? selectedWallId : null;
  selectedItemId = selectedItemId && testMap.getItem(selectedItemId) ? selectedItemId : null;
  selectedOpeningId = selectedOpeningId && testMap.getOpening(selectedOpeningId) ? selectedOpeningId : null;
  selectedRoofId = selectedRoofId && testMap.getRoof?.(selectedRoofId) ? selectedRoofId : null;
  selectedStairsId = selectedStairsId && testMap.getStairs?.(selectedStairsId) ? selectedStairsId : null;
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

function getMeshFloorId(mesh) {
  let current = mesh;
  while (current) {
    if (current.metadata && current.metadata.floorId) {
      return current.metadata.floorId;
    }
    current = current.parent;
  }
  return null;
}

function refreshShadows() {
  shadowGenerator.getShadowMap().renderList = [];
  const currentFloorId = testMap.floorplan.currentFloorId;
  testMap.getShadowCasters().forEach((mesh) => {
    const floorId = getMeshFloorId(mesh);
    if (!floorId || floorId === currentFloorId) {
      shadowGenerator.addShadowCaster(mesh);
    }
  });
  refresh3DGrid();
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
  } else if (selectedFenceId) {
    pushHistory();
    testMap.updateFence(selectedFenceId, { material: '#8d6e63', color: '#8d6e63' });
    refreshShadows();
    updateEditor();
    renderPlan();
  }
}

function clear3DGrid() {
  grid3DNodes.splice(0).forEach((node) => node.dispose(false, true));
}

function get3DGridBounds() {
  const points = [];
  currentWalls().forEach((wall) => {
    points.push({ x: wall.from[0], z: wall.from[1] }, { x: wall.to[0], z: wall.to[1] });
  });
  currentRooms().forEach((room) => {
    points.push(
      { x: room.x - room.width / 2, z: room.z - room.depth / 2 },
      { x: room.x + room.width / 2, z: room.z + room.depth / 2 }
    );
  });
  currentRoofs().forEach((roof) => {
    points.push(
      { x: (roof.x || 0) - (roof.width || 6) / 2, z: (roof.z || 0) - (roof.depth || 6) / 2 },
      { x: (roof.x || 0) + (roof.width || 6) / 2, z: (roof.z || 0) + (roof.depth || 6) / 2 }
    );
  });
  currentStairs().forEach((stairs) => {
    points.push(
      { x: (stairs.x || 0) - (stairs.width || 1.2) / 2, z: (stairs.z || 0) - (stairs.depth || 3.2) / 2 },
      { x: (stairs.x || 0) + (stairs.width || 1.2) / 2, z: (stairs.z || 0) + (stairs.depth || 3.2) / 2 }
    );
  });
  currentItems().forEach((item) => {
    const scale = Number(item.scale || 1);
    const width = inchesToWorld(item.width || 24) * scale;
    const depth = inchesToWorld(item.depth || 24) * scale;
    points.push(
      { x: item.x - width / 2, z: item.z - depth / 2 },
      { x: item.x + width / 2, z: item.z + depth / 2 }
    );
  });
  if (!points.length) return { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const step = Math.max(0.25, snapEnabled && snapSize ? snapSize : 1);
  const pad = Math.max(4, step * 3);
  return {
    minX: Math.floor((Math.min(...xs) - pad) / step) * step,
    maxX: Math.ceil((Math.max(...xs) + pad) / step) * step,
    minZ: Math.floor((Math.min(...zs) - pad) / step) * step,
    maxZ: Math.ceil((Math.max(...zs) + pad) / step) * step
  };
}

function createDashedLineSegments(p1, p2, dashSize = 0.08, gapSize = 0.08) {
  const segments = [];
  const dir = p2.subtract(p1);
  const totalLength = dir.length();
  if (totalLength <= 0.001) return segments;

  const stepVec = dir.normalize();
  let currentLength = 0;

  while (currentLength < totalLength) {
    const start = p1.add(stepVec.scale(currentLength));
    currentLength = Math.min(totalLength, currentLength + dashSize);
    const end = p1.add(stepVec.scale(currentLength));
    segments.push([start, end]);
    currentLength += gapSize;
  }
  return segments;
}

function refresh3DGrid() {
  clear3DGrid();
  if (!show3DGrid || currentView !== '3d' || !scene || !testMap) return;
  const step = Math.max(0.25, snapEnabled && snapSize ? snapSize : 1);
  const bounds = get3DGridBounds();
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0;
  const y = floorY + 0.012;
  const lines = [];
  const axisLines = [];
  for (let x = bounds.minX; x <= bounds.maxX + 0.001; x += step) {
    if (Math.abs(x) < 0.001) {
      axisLines.push([new BABYLON.Vector3(x, y, bounds.minZ), new BABYLON.Vector3(x, y, bounds.maxZ)]);
    } else {
      const p1 = new BABYLON.Vector3(x, y, bounds.minZ);
      const p2 = new BABYLON.Vector3(x, y, bounds.maxZ);
      lines.push(...createDashedLineSegments(p1, p2, 0.08, 0.08));
    }
  }
  for (let z = bounds.minZ; z <= bounds.maxZ + 0.001; z += step) {
    if (Math.abs(z) < 0.001) {
      axisLines.push([new BABYLON.Vector3(bounds.minX, y, z), new BABYLON.Vector3(bounds.maxX, y, z)]);
    } else {
      const p1 = new BABYLON.Vector3(bounds.minX, y, z);
      const p2 = new BABYLON.Vector3(bounds.maxX, y, z);
      lines.push(...createDashedLineSegments(p1, p2, 0.08, 0.08));
    }
  }
  if (lines.length) {
    const grid = BABYLON.MeshBuilder.CreateLineSystem('floor_grid_3d', { lines }, scene);
    grid.color = BABYLON.Color3.FromHexString('#c2cbd6');
    grid.alpha = 0.08;
    grid.isPickable = false;
    grid.renderingGroupId = 0;
    grid3DNodes.push(grid);
  }
  if (axisLines.length) {
    const axes = BABYLON.MeshBuilder.CreateLineSystem('floor_grid_3d_axes', { lines: axisLines }, scene);
    axes.color = BABYLON.Color3.FromHexString('#8fb8e8');
    axes.alpha = 0.28;
    axes.isPickable = false;
    axes.renderingGroupId = 0;
    grid3DNodes.push(axes);
  }
}
function setView(nextView) {
  currentView = nextView;
  stage.dataset.view = nextView;
  viewToggleButton.textContent = nextView === '2d' ? '3D' : '2D';
  viewToggleButton.setAttribute('aria-pressed', String(nextView === '3d'));
  
  const resetCamBtn = document.getElementById('btn-reset-camera');
  if (resetCamBtn) {
    resetCamBtn.classList.remove('hidden');
  }

  if (nextView === '3d') {
    refresh3DGrid();
    requestAnimationFrame(() => {
      engine.resize();
      refresh3DGrid();
      scene.render();
    });
  } else {
    clear3DEditHandles();
    clear3DGrid();
    clearDrawWallPreview();
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

function currentRooms() {
  return testMap.getCurrentFloorRooms ? testMap.getCurrentFloorRooms() : testMap.floorplan.floor.rooms;
}

function currentWalls() {
  return testMap.getCurrentFloorWalls ? testMap.getCurrentFloorWalls() : testMap.floorplan.walls;
}

function referenceFloorWalls() {
  if (!testMap.getFloorLevel || !testMap.floorplan.floors?.length) return [];
  const currentLevel = testMap.getFloorLevel(testMap.floorplan.currentFloorId);
  const lowerFloors = testMap.floorplan.floors
    .filter((floor) => Number(floor.level || 0) < currentLevel)
    .sort((a, b) => Number(b.level || 0) - Number(a.level || 0));
  const referenceFloor = lowerFloors[0];
  if (!referenceFloor) return [];
  return testMap.floorplan.walls.filter((wall) => (wall.floorId || 'floor_1') === referenceFloor.id);
}

function currentOpenings() {
  return testMap.getCurrentFloorOpenings ? testMap.getCurrentFloorOpenings() : testMap.floorplan.openings;
}

function currentItems() {
  return testMap.getCurrentFloorItems ? testMap.getCurrentFloorItems() : testMap.floorplan.items;
}

function currentRoofs() {
  return testMap.getCurrentFloorRoofs ? testMap.getCurrentFloorRoofs() : [];
}

function currentStairs() {
  return testMap.getCurrentFloorStairs ? testMap.getCurrentFloorStairs() : [];
}

function makeButton(id, label, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  if (id) button.id = id;
  if (className) button.className = className;
  button.textContent = label;
  return button;
}

function iconSvg(name) {
  const attrs = 'class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    copy: `<svg ${attrs}><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    rotate: `<svg ${attrs}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>`,
    trash: `<svg ${attrs}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
    up: `<svg ${attrs}><path d="m18 15-6-6-6 6"/></svg>`,
    down: `<svg ${attrs}><path d="m6 9 6 6 6-6"/></svg>`,
    lock: `<svg ${attrs}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
    unlock: `<svg ${attrs}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M16 11V7a4 4 0 0 0-7.6-1.8"/></svg>`,
    power: `<svg ${attrs}><path d="M12 2v10"/><path d="M18.36 6.36a9 9 0 1 1-12.73 0"/></svg>`,
    door: `<svg ${attrs}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M15 6 L10.5 4.5 A2 2 0 0 0 9 6.5 L9 17.5 A2 2 0 0 0 10.5 19.5 L15 18 Z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>`
  };
  return icons[name] || '';
}

function hideContextMenu() {
  contextMenuElement?.remove();
  contextMenuElement = null;
}

function showIconMenu(clientX, clientY, actions) {
  hideContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-icon-menu';
  actions.filter(Boolean).forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'context-icon-button';
    button.title = action.title || '';
    button.setAttribute('aria-label', action.title || 'action');
    button.disabled = !!action.disabled;
    button.innerHTML = iconSvg(action.icon);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideContextMenu();
      if (!action.disabled) action.onClick?.();
    });
    menu.appendChild(button);
  });
  if (!menu.children.length) return;
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  const x = Math.min(window.innerWidth - rect.width - 8, Math.max(8, clientX));
  const y = Math.min(window.innerHeight - rect.height - 8, Math.max(8, clientY));
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  contextMenuElement = menu;
}

function cancelLongPress() {
  if (longPressState?.timer) clearTimeout(longPressState.timer);
  longPressState = null;
}

function attachContextMenuTrigger(element, getTarget, showMenu = showObjectContextMenu) {
  element.addEventListener('contextmenu', (event) => {
    const target = getTarget(event);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    showMenu(target, event.clientX, event.clientY);
  });
  element.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.button === 2) return;
    const target = getTarget(event);
    if (!target) return;
    const startX = event.clientX;
    const startY = event.clientY;
    cancelLongPress();
    longPressState = {
      pointerId: event.pointerId,
      startX,
      startY,
      timer: window.setTimeout(() => {
        longPressState = null;
        showMenu(target, startX, startY);
      }, 560)
    };
  });
}

function isAllowedContextTarget(target) {
  return ['item', 'opening', 'roof', 'stairs', 'room', 'fence'].includes(target?.type);
}

function getContextTargetObject(target) {
  if (!target) return null;
  if (target.type === 'item') return testMap.getItem(target.id);
  if (target.type === 'opening') return testMap.getOpening(target.id);
  if (target.type === 'roof') return testMap.getRoof?.(target.id);
  if (target.type === 'stairs') return testMap.getStairs?.(target.id);
  if (target.type === 'room') return testMap.getRoom(target.id);
  if (target.type === 'fence') return testMap.getFence?.(target.id);
  return null;
}

function isTargetLocked(target) {
  return !!getContextTargetObject(target)?.locked;
}

function setContextTargetLocked(target, locked) {
  if (!isAllowedContextTarget(target)) return;
  const value = !!locked;
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (!item) return;
    item.locked = value;
    const node = testMap.itemNodes.get(item.id);
    if (node) node.metadata = { ...(node.metadata || {}), locked: value };
  } else if (target.type === 'opening') {
    testMap.updateOpening(target.id, { locked: value });
  } else if (target.type === 'roof') {
    testMap.updateRoof?.(target.id, { locked: value });
  } else if (target.type === 'stairs') {
    testMap.updateStairs?.(target.id, { locked: value });
  } else if (target.type === 'room') {
    testMap.updateRoom(target.id, { locked: value });
  } else if (target.type === 'fence') {
    testMap.updateFence?.(target.id, { locked: value });
  }
}

function getTargetFloorId(target) {
  if (!target) return null;
  if (target.type === 'room') return testMap.getRoom(target.id)?.floorId || 'floor_1';
  if (target.type === 'wall') return testMap.getWall(target.id)?.floorId || 'floor_1';
  if (target.type === 'opening') return testMap.getOpening(target.id)?.floorId || testMap.getWall(testMap.getOpening(target.id)?.wallId)?.floorId || 'floor_1';
  if (target.type === 'item') return testMap.getItem(target.id)?.floorId || 'floor_1';
  if (target.type === 'roof') return testMap.getRoof?.(target.id)?.floorId || 'floor_1';
  if (target.type === 'stairs') return testMap.getStairs?.(target.id)?.floorId || 'floor_1';
  if (target.type === 'fence') return testMap.getFence?.(target.id)?.floorId || 'floor_1';
  return testMap.floorplan.currentFloorId;
}

function isTargetOnCurrentFloor(target) {
  return getTargetFloorId(target) === testMap.floorplan.currentFloorId;
}

function get2DContextTargetFromElement(element) {
  const item = element.closest?.('[data-item-id]');
  if (item?.dataset.itemId) return { type: 'item', id: item.dataset.itemId };
  const opening = element.closest?.('[data-opening-id]');
  if (opening?.dataset.openingId) return { type: 'opening', id: opening.dataset.openingId };
  const roof = element.closest?.('[data-roof-id]');
  if (roof?.dataset.roofId) return { type: 'roof', id: roof.dataset.roofId };
  const stairs = element.closest?.('[data-stairs-id]');
  if (stairs?.dataset.stairsId) return { type: 'stairs', id: stairs.dataset.stairsId };
  const fence = element.closest?.('[data-fence-id]');
  if (fence?.dataset.fenceId) return { type: 'fence', id: fence.dataset.fenceId };
  const roomHit = element.closest?.('[data-room-hit-id]');
  if (roomHit?.dataset.roomHitId) return { type: 'room', id: roomHit.dataset.roomHitId };
  const room = element.closest?.('[data-room-id]');
  if (room?.dataset.roomId) return { type: 'room', id: room.dataset.roomId };
  return null;
}
function isSwitchableTarget(target) {
  if (!target) return false;
  if (target.type === 'opening') return true;
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (!item) return false;
    const def = testMap.getFurnitureDefinition(item.type);
    return !!(def && (def.category === 'lighting' || def.lightSource || def.isSwitchable || item.isOn !== undefined || item.lightOn !== undefined));
  }
  return false;
}

function isLightingTarget(target) {
  if (!target || target.type !== 'item') return false;
  const item = testMap.getItem(target.id);
  if (!item) return false;
  const def = testMap.getFurnitureDefinition(item.type);
  return !!(def && (def.category === 'lighting' || def.lightSource));
}

function showObjectContextMenu(target, clientX, clientY) {
  if (!isAllowedContextTarget(target)) return;
  const isRotatable = ['item', 'roof', 'stairs', 'opening'].includes(target.type);
  const isSwitchable = isSwitchableTarget(target);
  const isLighting = isLightingTarget(target);
  const isLocked = isTargetLocked(target);
  
  showIconMenu(clientX, clientY, [
    { icon: 'copy', title: '\u590d\u5236', onClick: () => copyContextTarget(target) },
    isRotatable && { icon: 'rotate', title: '\u65cb\u8f6c', disabled: isLocked, onClick: () => rotateContextTarget(target) },
    isSwitchable && { 
      icon: isLighting ? 'power' : (target.type === 'opening' ? 'door' : 'power'), 
      title: '\u5f00\u5173', 
      disabled: isLocked,
      onClick: () => toggleContextTarget(target) 
    },
    { icon: isLocked ? 'unlock' : 'lock', title: isLocked ? '\u89e3\u9501' : '\u9501\u5b9a', onClick: () => toggleTargetLock(target) },
    { icon: 'trash', title: '\u5220\u9664', disabled: isLocked, onClick: () => deleteContextTarget(target) }
  ]);
}

function toggleTargetLock(target) {
  if (!isAllowedContextTarget(target)) return;
  const object = getContextTargetObject(target);
  if (!object) return;
  pushHistory();
  setContextTargetLocked(target, !object.locked);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function toggleContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  if (isTargetLocked(target)) return;
  pushHistory();
  if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    if (!opening) return;
    testMap.updateOpening(target.id, { isOpen: !opening.isOpen });
    if (selectedOpeningId === target.id) {
      updateEditor();
    }
  } else if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (!item) return;
    const def = testMap.getFurnitureDefinition(item.type);
    if (def && (def.category === 'lighting' || def.lightSource)) {
      testMap.updateItem(target.id, { lightOn: item.lightOn === false });
    } else {
      testMap.updateItem(target.id, { isOn: item.isOn === false });
    }
    if (selectedItemId === target.id) {
      updateEditor();
    }
  }
  refreshShadows();
  renderPlan();
}

function rotateContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  if (isTargetLocked(target)) return;
  pushHistory();
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (!item) return;
    const currentDegrees = Math.round(((item.rotation || 0) * 180 / Math.PI + 360) % 360);
    const nextDegrees = (currentDegrees + 90) % 360;
    testMap.rotateItem(target.id, nextDegrees * Math.PI / 180);
    if (selectedItemId === target.id) {
      updateEditor();
    }
  } else if (target.type === 'roof' || target.type === 'stairs') {
    const structure = getStructure(target.type, target.id);
    if (!structure) return;
    const currentDegrees = Math.round(((structure.rotation || 0) * 180 / Math.PI + 360) % 360);
    const nextDegrees = (currentDegrees + 90) % 360;
    updateStructure(target.type, target.id, { rotation: nextDegrees * Math.PI / 180 });
    const selected = getSelectedStructure();
    if (selected && selected.type === target.type && selected.id === target.id) {
      updateEditor();
    }
  } else if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    if (!opening) return;
    const lr = !!opening.isFlippedLR;
    const io = !!opening.isFlippedIO;
    let state = 0;
    if (lr && !io) state = 1;
    else if (lr && io) state = 2;
    else if (!lr && io) state = 3;
    
    const nextState = (state + 1) % 4;
    const nextLr = (nextState === 1 || nextState === 2);
    const nextIo = (nextState === 2 || nextState === 3);
    
    testMap.updateOpening(target.id, {
      isFlippedLR: nextLr,
      isFlippedIO: nextIo
    });
    if (selectedOpeningId === target.id) {
      updateEditor();
    }
  }
  refreshShadows();
  renderPlan();
}

function findMatchingCurrentFloorWall(sourceWall, sourcePoint) {
  if (!sourceWall) return null;
  const [sx1, sz1] = sourceWall.from;
  const [sx2, sz2] = sourceWall.to;
  const sourceAngle = Math.atan2(sz2 - sz1, sx2 - sx1);
  let bestWall = null;
  let bestScore = Infinity;
  currentWalls().forEach((wall) => {
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const angle = Math.atan2(z2 - z1, x2 - x1);
    const angleDelta = Math.abs(Math.atan2(Math.sin(angle - sourceAngle), Math.cos(angle - sourceAngle)));
    const parallelDelta = Math.min(angleDelta, Math.abs(Math.PI - angleDelta));
    if (parallelDelta > Math.PI / 6) return;
    const projectedT = getWallProjectionT(wall, sourcePoint);
    const projected = wallPointAt(wall, projectedT);
    const distance = Math.hypot(projected.x - sourcePoint.x, projected.z - sourcePoint.z);
    const score = distance + parallelDelta * 2;
    if (score < bestScore) {
      bestScore = score;
      bestWall = wall;
    }
  });
  return bestWall;
}
function copyContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  pushHistory();
  let nextSelection = null;
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (!item) return;
    const copyX = (item.x || 0) + 0.4;
    const copyZ = (item.z || 0) + 0.4;
    const targetRoom = currentRooms().find((room) => (
      copyX >= room.x - room.width / 2
      && copyX <= room.x + room.width / 2
      && copyZ >= room.z - room.depth / 2
      && copyZ <= room.z + room.depth / 2
    ));
    const copy = testMap.addItem({
      ...JSON.parse(JSON.stringify(item)),
      id: undefined,
      name: item.name,
      x: copyX,
      z: copyZ,
      roomId: targetRoom?.id,
      floorId: testMap.floorplan.currentFloorId
    });
    nextSelection = { type: 'item', id: copy.id };
  } else if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    const sourceWall = opening ? testMap.getWall(opening.wallId) : null;
    if (!opening || !sourceWall) return;
    const sourcePoint = wallPointAt(sourceWall, opening.t ?? 0.5);
    const targetWall = findMatchingCurrentFloorWall(sourceWall, sourcePoint);
    if (!targetWall) return;
    const nextT = Math.min(0.92, getWallProjectionT(targetWall, sourcePoint) + 0.08);
    const next = testMap.addOpening(targetWall.id, opening.type, nextT);
    if (next) {
      testMap.updateOpening(next.id, {
        width: opening.width,
        height: opening.height,
        sillHeight: opening.sillHeight,
        isOpen: opening.isOpen,
        isFlippedLR: opening.isFlippedLR,
        isFlippedIO: opening.isFlippedIO,
        floorId: testMap.floorplan.currentFloorId
      });
      nextSelection = { type: 'opening', id: next.id };
    }
  } else if (target.type === 'roof') {
    const roof = testMap.getRoof?.(target.id);
    if (!roof) return;
    const copy = testMap.addRoof({
      ...JSON.parse(JSON.stringify(roof)),
      id: undefined,
      x: (roof.x || 0) + 0.5,
      z: (roof.z || 0) + 0.5,
      floorId: testMap.floorplan.currentFloorId,
      locked: false
    });
    nextSelection = { type: 'roof', id: copy.id };
  } else if (target.type === 'stairs') {
    const stairs = testMap.getStairs?.(target.id);
    if (!stairs) return;
    const copy = testMap.addStairs({
      ...JSON.parse(JSON.stringify(stairs)),
      id: undefined,
      x: (stairs.x || 0) + 0.5,
      z: (stairs.z || 0) + 0.5,
      floorId: testMap.floorplan.currentFloorId,
      locked: false
    });
    nextSelection = { type: 'stairs', id: copy.id };
  } else if (target.type === 'fence') {
    const fence = testMap.getFence?.(target.id);
    if (!fence) return;
    const copy = testMap.addFence({
      ...JSON.parse(JSON.stringify(fence)),
      id: undefined,
      from: [(fence.from?.[0] || 0) + 0.5, (fence.from?.[1] || 0) + 0.5],
      to: [(fence.to?.[0] || 0) + 0.5, (fence.to?.[1] || 0) + 0.5],
      floorId: testMap.floorplan.currentFloorId,
      locked: false
    });
    nextSelection = { type: 'fence', id: copy.id };
  } else if (target.type === 'room') {
    const room = testMap.getRoom(target.id);
    if (!room) return;
    const copy = testMap.addRoom({ ...JSON.parse(JSON.stringify(room)), id: undefined, name: room.name, x: room.x + 0.5, z: room.z + 0.5, floorId: room.floorId, locked: false });
    nextSelection = { type: 'room', id: copy.id };
  }
  refreshShadows();
  selectContextTarget(nextSelection || target);
}

function deleteContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  if (isTargetLocked(target)) return;
  if (target.type === 'room') {
    showCustomConfirm('提示', '确定要删除整个房间吗？房间内的家具都会移除').then((confirmed) => {
      if (confirmed) {
        pushHistory();
        testMap.deleteRoom(target.id);
        clearSelection();
        refreshShadows();
        renderPlan();
      }
    });
    return;
  }
  pushHistory();
  if (target.type === 'item') testMap.deleteItem(target.id);
  if (target.type === 'opening') testMap.deleteOpening(target.id);
  if (target.type === 'roof') testMap.deleteRoof?.(target.id);
  if (target.type === 'stairs') testMap.deleteStairs?.(target.id);
  if (target.type === 'fence') testMap.deleteFence?.(target.id);
  clearSelection();
  refreshShadows();
  renderPlan();
}

function selectContextTarget(target) {
  if (!target || !isTargetOnCurrentFloor(target)) return;
  if (target.type === 'item') selectItem(target.id);
  if (target.type === 'opening') selectOpening(target.id);
  if (target.type === 'roof') selectRoof(target.id);
  if (target.type === 'stairs') selectStairs(target.id);
  if (target.type === 'fence') selectFence(target.id);
  if (target.type === 'room') selectRoom(target.id);
}

function showFloorContextMenu(target, clientX, clientY) {
  if (!target?.id || target.id !== testMap.floorplan.currentFloorId) return;
  const sorted = [...testMap.floorplan.floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
  const index = sorted.findIndex((floor) => floor.id === target.id);
  showIconMenu(clientX, clientY, [
    { icon: 'up', title: '\u4e0a\u79fb', disabled: index === sorted.length - 1, onClick: () => moveCurrentFloor('up') },
    { icon: 'down', title: '\u4e0b\u79fb', disabled: index <= 0, onClick: () => moveCurrentFloor('down') },
    { icon: 'trash', title: '\u5220\u9664', disabled: testMap.floorplan.floors.length <= 1, onClick: deleteCurrentFloor }
  ]);
}

function moveCurrentFloor(direction) {
  pushHistory();
  if (testMap.moveFloor?.(testMap.floorplan.currentFloorId, direction)) {
    syncFloorControls();
    refreshShadows();
    renderPlan();
  }
}

function deleteCurrentFloor() {
  if (testMap.floorplan.floors.length <= 1) return;
  pushHistory();
  if (testMap.deleteFloor?.(testMap.floorplan.currentFloorId)) {
    clearSelection();
    syncFloorControls();
    refreshShadows();
    renderPlan();
  }
}

function cancelObjectInteractions() {
  dragState = null;
  openingDragState = null;
  wallDragState = null;
  roomDragState = null;
  roomResizeState = null;
  structureDragState = null;
  roofResizeState = null;
  editHandleDragState = null;
  drag3DState = null;
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);
}
function ensureBuildingToolControls() {
  // 静态 HTML 已经包含了按钮，此方法已废弃
}

function ensure3DGridControls() {
  if (document.getElementById('show-3d-grid')) return;
  const snapSizeField = document.getElementById('snap-size')?.closest('.field');
  const snapEnabledField = document.getElementById('snap-enabled')?.closest('.check-field');
  const anchor = snapSizeField || snapEnabledField;
  if (!anchor?.parentElement) return;
  const label = document.createElement('label');
  label.className = 'check-field';
  const input = document.createElement('input');
  input.id = 'show-3d-grid';
  input.type = 'checkbox';
  input.checked = show3DGrid;
  const span = document.createElement('span');
  span.textContent = '\u663e\u793a3D\u7f51\u683c';
  label.append(input, span);
  anchor.insertAdjacentElement('afterend', label);
  input.addEventListener('change', (event) => {
    show3DGrid = event.target.checked;
    refresh3DGrid();
  });
}

function createStructureField(labelText, inputId, attrs = {}) {
  const label = document.createElement('label');
  label.className = 'field';
  const span = document.createElement('span');
  span.textContent = labelText;
  const input = document.createElement('input');
  input.id = inputId;
  Object.entries(attrs).forEach(([key, value]) => input.setAttribute(key, value));
  label.append(span, input);
  return label;
}

function ensureStructureEditor() {
  if (document.getElementById('structure-editor')) return;
  const content = document.querySelector('#right-panel .right-panel-content');
  if (!content) return;
  const editor = document.createElement('div');
  editor.id = 'structure-editor';
  editor.className = 'editor hidden';
  const title = document.createElement('strong');
  title.id = 'selected-structure-name';
  title.textContent = '\u5efa\u7b51\u7ec4\u4ef6';
  editor.appendChild(title);
  
  // 插入“类型”下拉框
  const subtypeLabel = document.createElement('label');
  subtypeLabel.className = 'field';
  const subtypeSpan = document.createElement('span');
  subtypeSpan.textContent = '\u7c7b\u578b'; // 类型
  const subtypeSelect = document.createElement('select');
  subtypeSelect.id = 'structure-subtype';
  subtypeLabel.append(subtypeSpan, subtypeSelect);
  editor.appendChild(subtypeLabel);

  editor.appendChild(createStructureField('X (m)', 'structure-x', { type: 'number', step: '0.1' }));
  editor.appendChild(createStructureField('Z (m)', 'structure-z', { type: 'number', step: '0.1' }));
  editor.appendChild(createStructureField('\u5bbd\u5ea6 (m)', 'structure-width', { type: 'number', min: '0.6', step: '0.1' }));
  editor.appendChild(createStructureField('\u6df1\u5ea6 (m)', 'structure-depth', { type: 'number', min: '0.6', step: '0.1' }));
  editor.appendChild(createStructureField('\u9ad8\u5ea6 (m)', 'structure-height', { type: 'number', min: '0.2', step: '0.1' }));
  const rotationLabel = createStructureField('\u65cb\u8f6c (\u5ea6)', 'structure-rotation', { type: 'number', min: '0', max: '359', step: '15' });
  const rotationRange = document.createElement('input');
  rotationRange.id = 'structure-rotation-range';
  rotationRange.type = 'range';
  rotationRange.min = '0';
  rotationRange.max = '360';
  rotationRange.step = '1';
  rotationLabel.appendChild(rotationRange);
  editor.appendChild(rotationLabel);
  editor.appendChild(createStructureField('\u8e0f\u6b65\u6570', 'structure-steps', { type: 'number', min: '3', max: '32', step: '1' }));
  editor.appendChild(createStructureField('\u989c\u8272', 'structure-color', { type: 'color' }));
  const lockedLabel = document.createElement('label');
  lockedLabel.className = 'check-field';
  const lockedInput = document.createElement('input');
  lockedInput.id = 'structure-locked';
  lockedInput.type = 'checkbox';
  const lockedSpan = document.createElement('span');
  lockedSpan.textContent = '\u9501\u5b9a\u4f4d\u7f6e';
  lockedLabel.append(lockedInput, lockedSpan);
  editor.appendChild(lockedLabel);
  const deleteButton = document.createElement('button');
  deleteButton.id = 'btn-delete-structure';
  deleteButton.type = 'button';
  deleteButton.className = 'danger';
  deleteButton.textContent = '\u5220\u9664\u7ec4\u4ef6';
  editor.appendChild(deleteButton);
  const openingEditor = document.getElementById('opening-editor');
  if (openingEditor) {
    openingEditor.insertAdjacentElement('afterend', editor);
  } else {
    content.appendChild(editor);
  }
}

function syncFloorControls() {
  const container = document.getElementById('floor-floating-group');
  if (!container) return;

  container.innerHTML = '';

  if (floorPanelCollapsed) {
    // 折叠状态下，只渲染一个用来展开的图层图标按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn-icon btn-floor-toggle-expanded';
    toggleBtn.title = '展开楼层面板';
    toggleBtn.setAttribute('aria-label', '展开楼层面板');
    toggleBtn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-10 4 10 4 10-4Z"/><path d="m2 12 10 4 10-4"/><path d="m2 17 10 4 10-4"/></svg>';
    container.appendChild(toggleBtn);
    return;
  }

  // 展开状态下正常渲染楼层列表
  const sortedFloors = [...testMap.floorplan.floors].sort((a, b) => Number(b.level || 0) - Number(a.level || 0));

  sortedFloors.forEach((floor) => {
    const btn = document.createElement('button');
    const floorName = floor.name || `${Number(floor.level || 0) + 1}F`;
    btn.type = 'button';
    btn.className = 'btn-icon btn-floor-item';
    btn.dataset.floorId = floor.id;
    btn.textContent = floorName;
    btn.title = `切换到 ${floorName}`;
    btn.setAttribute('aria-label', `切换到 ${floorName}`);

    if (floor.id === testMap.floorplan.currentFloorId) {
      btn.classList.add('active');
      attachContextMenuTrigger(btn, () => ({ type: 'floor', id: floor.id }), showFloorContextMenu);
    }

    container.appendChild(btn);
  });

  // 添加新建楼层按钮
  const addBtn = document.createElement('button');
  addBtn.id = 'btn-add-floor';
  addBtn.type = 'button';
  addBtn.className = 'btn-icon btn-floor-add';
  addBtn.title = '新建楼层';
  addBtn.setAttribute('aria-label', '新建楼层');
  addBtn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>';
  container.appendChild(addBtn);

  // 添加收起整个楼层面板的按钮 (向上折叠箭头)
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'btn-icon btn-floor-fold';
  foldBtn.title = '收起楼层面板';
  foldBtn.setAttribute('aria-label', '收起楼层面板');
  foldBtn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
  container.appendChild(foldBtn);
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
  if (hasUserZoomedOrPanned) return;
  const corners = [];
  [...referenceFloorWalls(), ...currentWalls()].forEach((wall) => {
    corners.push({ x: wall.from[0], z: wall.from[1] });
    corners.push({ x: wall.to[0], z: wall.to[1] });
  });
  currentRooms().forEach((room) => {
    corners.push({ x: room.x - room.width / 2, z: room.z - room.depth / 2 });
    corners.push({ x: room.x + room.width / 2, z: room.z + room.depth / 2 });
  });
  currentItems().forEach((item) => {
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

  currentRooms().forEach((room) => renderRoom(room));
  referenceFloorWalls().forEach((wall) => renderReferenceWall(wall));
  currentWalls().forEach((wall) => renderWall(wall));
  currentRooms().forEach((room) => renderRoomInteraction(room));
  currentOpenings().forEach((opening) => renderOpening(opening));

  currentRoofs().forEach((roof) => renderRoof(roof));
  currentStairs().forEach((stairs) => renderStairs(stairs));
  currentFences().forEach((fence) => renderFence(fence));

  if (drawStart) {
    const a = worldToSvg(drawStart[0], drawStart[1]);
    svg.appendChild(createSvgElement('circle', { class: 'draw-anchor', cx: a.x, cy: a.y, r: 6 }));
  }

  currentItems().forEach((item) => renderPlanItem(item));
  const selectedRoom = selectedRoomId ? testMap.getRoom(selectedRoomId) : null;
  if (selectedRoom) renderSelectedRoomHandles(selectedRoom);
  const selectedRoof = selectedRoofId ? testMap.getRoof?.(selectedRoofId) : null;
  if (selectedRoof) renderSelectedRoofHandles(selectedRoof);
  const selectedFence = selectedFenceId ? testMap.getFence(selectedFenceId) : null;
  if (selectedFence) renderSelectedFenceHandles(selectedFence);
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
  attachContextMenuTrigger(rect, () => ({ type: 'room', id: room.id }));
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
  attachContextMenuTrigger(rect, () => ({ type: 'room', id: room.id }));
  rect.addEventListener('pointerdown', (event) => beginRoomDrag(event, room.id));
  rect.addEventListener('click', (event) => {
    event.stopPropagation();
    selectRoom(room.id);
  });
  svg.appendChild(rect);
}

function renderSelectedRoomHandles(room) {
  if (room.locked) return;
  const a = worldToSvg(room.x - room.width / 2, room.z - room.depth / 2);
  const b = worldToSvg(room.x + room.width / 2, room.z + room.depth / 2);
  renderRoomHandles(room, a, b);
}

function renderReferenceWall(wall) {
  const a = worldToSvg(wall.from[0], wall.from[1]);
  const b = worldToSvg(wall.to[0], wall.to[1]);
  svg.appendChild(createSvgElement('line', {
    class: 'reference-wall-line',
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y
  }));
}

function renderRoofHandles(roof, a, b) {
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
      x: handle.x - 6,
      y: handle.y - 6,
      width: 12,
      height: 12,
      rx: 3,
      'data-roof-handle': handle.side
    });
    node.addEventListener('pointerdown', (event) => beginRoofResize(event, roof.id, handle.side));
    svg.appendChild(node);
  });
}

function renderSelectedRoofHandles(roof) {
  if (roof.locked) return;
  const a = worldToSvg((roof.x || 0) - (roof.width || 6) / 2, (roof.z || 0) - (roof.depth || 6) / 2);
  const b = worldToSvg((roof.x || 0) + (roof.width || 6) / 2, (roof.z || 0) + (roof.depth || 6) / 2);
  renderRoofHandles(roof, a, b);
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
    if (mode === 'delete-wall' || mode === 'add-door' || mode === 'add-window' || mode === 'select') {
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
        switchToSelectMode();
      } else if (mode === 'select') {
        selectWall(wall.id);
      }
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
  attachContextMenuTrigger(line, () => ({ type: 'opening', id: opening.id }));
  line.addEventListener('pointerdown', (event) => beginOpeningDrag(event, opening.id));
  line.addEventListener('click', (event) => {
    if (mode === 'delete-wall') {
      event.stopPropagation();
      pushHistory();
      testMap.deleteOpening(opening.id);
      clearSelection();
      refreshShadows();
      renderPlan();
    }
  });
  svg.appendChild(line);
}

function renderRoof(roof) {
  const a = worldToSvg((roof.x || 0) - (roof.width || 6) / 2, (roof.z || 0) - (roof.depth || 6) / 2);
  const b = worldToSvg((roof.x || 0) + (roof.width || 6) / 2, (roof.z || 0) + (roof.depth || 6) / 2);
  
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  const centerX = minX + w / 2;
  const centerY = minY + h / 2;
  
  const group = createSvgElement('g', {
    class: `roof-group ${selectedRoofId === roof.id ? 'selected' : ''}`,
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
  
  rect.addEventListener('pointerdown', (event) => beginStructureDrag(event, 'roof', roof.id));
  rect.addEventListener('click', (event) => {
    if (mode === 'select') {
      event.stopPropagation();
      selectRoof(roof.id);
    }
  });
  attachContextMenuTrigger(rect, () => ({ type: 'roof', id: roof.id }));
  svg.appendChild(group);
}
 
function renderStairs(stairs) {
  const a = worldToSvg((stairs.x || 0) - (stairs.width || 1.2) / 2, (stairs.z || 0) - (stairs.depth || 3.2) / 2);
  const b = worldToSvg((stairs.x || 0) + (stairs.width || 1.2) / 2, (stairs.z || 0) + (stairs.depth || 3.2) / 2);
  
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  const centerX = minX + w / 2;
  const centerY = minY + h / 2;
  
  const group = createSvgElement('g', {
    class: `stairs-symbol ${selectedStairsId === stairs.id ? 'selected' : ''}`,
    transform: `rotate(${((stairs.rotation || 0) * 180 / Math.PI) || 0} ${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`,
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
 
  const subtype = stairs.subtype || 'straight';
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
 
  attachContextMenuTrigger(group, () => ({ type: 'stairs', id: stairs.id }));
  group.addEventListener('pointerdown', (event) => beginStructureDrag(event, 'stairs', stairs.id));
  group.addEventListener('click', (event) => {
    if (mode === 'select') {
      event.stopPropagation();
      selectStairs(stairs.id);
    }
  });
  svg.appendChild(group);
}

function getStructure(type, id) {
  if (type === 'roof') return testMap.getRoof?.(id);
  if (type === 'stairs') return testMap.getStairs?.(id);
  if (type === 'fence') return testMap.getFence?.(id);
  return null;
}

function updateStructure(type, id, patch, rebuild = true) {
  if (type === 'roof') return testMap.updateRoof?.(id, patch, rebuild);
  if (type === 'stairs') return testMap.updateStairs?.(id, patch, rebuild);
  if (type === 'fence') return testMap.updateFence?.(id, patch, rebuild);
  return null;
}

function beginStructureDrag(event, type, id) {
  if (event.button === 2) return;
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  if (type === 'roof') selectRoof(id);
  if (type === 'stairs') selectStairs(id);
  const structure = getStructure(type, id);
  if (!structure || structure.locked) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  structureDragState = {
    type,
    id,
    offsetX: (structure.x || 0) - world.x,
    offsetZ: (structure.z || 0) - world.z,
    originalX: structure.x || 0,
    originalZ: structure.z || 0,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function moveStructureTo(type, id, x, z, options = {}) {
  const structure = getStructure(type, id);
  if (structure?.locked) return;
  let snappedX = x;
  let snappedZ = z;
  if (structure) {
    const width = structure.width || (type === 'stairs' ? 1.2 : 4);
    const depth = structure.depth || (type === 'stairs' ? 3.2 : 4);
    const left = snapNumber(x - width / 2);
    const top = snapNumber(z - depth / 2);
    snappedX = Number((left + width / 2).toFixed(3));
    snappedZ = Number((top + depth / 2).toFixed(3));
  } else {
    const snapped = snapWorldPoint({ x, z });
    snappedX = snapped.x;
    snappedZ = snapped.z;
  }

  const rebuild = options.rebuild !== false;
  const updated = updateStructure(type, id, { x: snappedX, z: snappedZ }, rebuild);
  if (!rebuild && updated) {
    const node = type === 'roof' ? testMap.roofNodes?.get(id) : testMap.stairNodes?.get(id);
    if (node) {
      node.position.x = updated.x || 0;
      node.position.z = updated.z || 0;
    }
  }
  if (rebuild || options.refresh !== false) refreshShadows();
  updateEditor();
  if (currentView !== '3d') renderPlan();
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
  attachContextMenuTrigger(group, () => ({ type: 'item', id: item.id }));
  group.addEventListener('pointerdown', (event) => beginItemDrag(event, item.id));
  svg.appendChild(group);
}

function beginRoomDrag(event, roomId) {
  if (event.button === 2) return;
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  selectRoom(roomId);
  const room = testMap.getRoom(roomId);
  if (!room || room.locked) return;
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
  if (event.button === 2) return;
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  selectRoom(roomId);
  const room = testMap.getRoom(roomId);
  if (!room || room.locked) return;
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
  if (!room || room.locked) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  const snappedRoom = snapRoomPosition(room, world.x + roomDragState.offsetX, world.z + roomDragState.offsetZ);
  const nextX = snappedRoom.x;
  const nextZ = snappedRoom.z;
  if (!roomDragState.historyPushed && Math.hypot(nextX - roomDragState.originalX, nextZ - roomDragState.originalZ) > 0.02) {
    pushHistory();
    roomDragState.historyPushed = true;
  }
  testMap.updateRoom(room.id, { x: nextX, z: nextZ }, { moveItems: true, rebuild: false });
  syncRoomMovePreview(room.id);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function moveRoomResize(event) {
  if (!roomResizeState) return;
  const room = testMap.getRoom(roomResizeState.roomId);
  if (!room || room.locked) return;
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
  testMap.updateRoom(room.id, patch, { moveItems: false, rebuild: false });
  syncRoomMovePreview(room.id);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function finishRoomEdit() {
  const needRebuild = !!(roomDragState || roomResizeState);
  roomDragState = null;
  roomResizeState = null;
  if (needRebuild) {
    testMap.build();
    refreshShadows();
  }
}

function beginRoofResize(event, roofId, side) {
  if (event.button === 2) return;
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  selectRoof(roofId);
  const roof = testMap.getRoof?.(roofId);
  if (!roof || roof.locked) return;
  roofResizeState = {
    roofId,
    side,
    original: { x: roof.x || 0, z: roof.z || 0, width: roof.width || 6, depth: roof.depth || 6 },
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function moveRoofResize(event) {
  if (!roofResizeState) return;
  const roof = testMap.getRoof?.(roofResizeState.roofId);
  if (!roof || roof.locked) return;
  const point = svgPointFromEvent(event);
  const world = snapWorldPoint(svgToWorld(point.x, point.y));
  const original = roofResizeState.original;
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  let nextLeft = left;
  let nextRight = right;
  let nextTop = top;
  let nextBottom = bottom;

  if (roofResizeState.side === 'west') nextLeft = Math.min(world.x, right - 1);
  if (roofResizeState.side === 'east') nextRight = Math.max(world.x, left + 1);
  if (roofResizeState.side === 'north') nextTop = Math.min(world.z, bottom - 1);
  if (roofResizeState.side === 'south') nextBottom = Math.max(world.z, top + 1);

  const patch = {
    x: snapNumber((nextLeft + nextRight) / 2),
    z: snapNumber((nextTop + nextBottom) / 2),
    width: snapNumber(nextRight - nextLeft),
    depth: snapNumber(nextBottom - nextTop)
  };
  if (!roofResizeState.historyPushed && (Math.abs(patch.width - original.width) > 0.02 || Math.abs(patch.depth - original.depth) > 0.02)) {
    pushHistory();
    roofResizeState.historyPushed = true;
  }
  testMap.updateRoof?.(roof.id, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function finishRoofResize() {
  roofResizeState = null;
}

function beginItemDrag(event, itemId) {
  if (event.button === 2) return;
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
  if (event.button === 2) return;
  event.preventDefault();
  event.stopPropagation();
  selectOpening(openingId);
  const opening = testMap.getOpening(openingId);
  if (mode === 'delete-wall') {
    if (opening?.locked) return;
    pushHistory();
    testMap.deleteOpening(openingId);
    clearSelection();
    refreshShadows();
    renderPlan();
    return;
  }
  if (mode !== 'select') return;
  const wall = opening ? testMap.getWall(opening.wallId) : null;
  if (!opening || opening.locked || !wall) return;
  openingDragState = {
    openingId,
    originalT: opening.t ?? 0.5,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function canPlaceOnTable(item, definition) {
  if (!definition) return false;
  if (definition.placeType === 'wall' || definition.placeType === 'ceiling') {
    return false;
  }
  const category = definition.category;
  if (category === 'seating' || category === 'bedroom' || category === 'kitchen-bath') {
    if (definition.type !== 'cushion') {
      return false;
    }
  }
  if (category === 'tables' || category === 'storage') {
    return false;
  }
  if (category === 'lighting') {
    if (definition.type.includes('floor')) {
      return false;
    }
    if (!definition.type.includes('lamp') && !definition.type.includes('light')) {
      return false;
    }
  }
  
  // 限制尺寸：底面积较小，长宽均在24英寸(60厘米)以下
  const w = item.width || definition.defaultSize.width;
  const d = item.depth || definition.defaultSize.depth;
  if (w > 24 || d > 24) {
    return false;
  }
  return true;
}

function findTableBelow(item) {
  let highestTable = null;
  let highestSurface = -Infinity;
  
  const items = testMap.floorplan.items || [];
  const itemFloorId = item.floorId || testMap.floorplan.currentFloorId;
  for (const other of items) {
    if (other.id === item.id) continue;
    if (other.floorId !== itemFloorId) continue;
    
    const otherDef = testMap.getFurnitureDefinition(other.type);
    if (!otherDef) continue;
    
    if (otherDef.category !== 'tables' && otherDef.category !== 'storage') {
      continue;
    }
    if (otherDef.placeType === 'wall' || otherDef.placeType === 'ceiling') {
      continue;
    }
    
    const cx = other.x;
    const cz = other.z;
    const angle = other.rotation || 0;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    const halfW = ((other.width || otherDef.defaultSize.width) * (other.scale || 1)) / 48;
    const halfD = ((other.depth || otherDef.defaultSize.depth) * (other.scale || 1)) / 48;
    
    if (Math.abs(localX) <= halfW && Math.abs(localZ) <= halfD) {
      const surface = (other.elevation || 0) + (other.height || otherDef.defaultSize.height) * (other.scale || 1);
      if (surface > highestSurface) {
        highestSurface = surface;
        highestTable = other;
      }
    }
  }
  
  return highestTable;
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

    currentWalls().forEach((wall) => {
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
    item.elevation = (testMap.floorplan.wallHeight || 2.8) * 24 - (item.height || definition.defaultSize.height) * (item.scale || 1); // 贴齐天花板下方
  } else {
    item.x = snapped.x;
    item.z = snapped.z;
    if (canPlaceOnTable(item, definition)) {
      const tableBelow = findTableBelow(item);
      if (tableBelow) {
        const tableDef = testMap.getFurnitureDefinition(tableBelow.type);
        item.elevation = (tableBelow.elevation || 0) + (tableBelow.height || tableDef.defaultSize.height) * (tableBelow.scale || 1);
      } else {
        item.elevation = 0;
      }
    }
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
    const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(item.floorId) : 0;
    node.position.set(item.x, floorY + (item.elevation || 0) / 24, item.z);
    node.rotation.y = item.rotation || 0;
  }
  renderPlan();
}

function moveOpeningToWorld(openingId, world, dragMeta) {
  const opening = testMap.getOpening(openingId);
  const wall = opening ? testMap.getWall(opening.wallId) : null;
  if (!opening || opening.locked || !wall) return;
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
  if (event.button === 2) return;
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
  }, { rebuild: false });
  syncWallMovePreview(wallId);
  
  updateEditor();
  renderPlan();
}

// 阻止鼠标中键触发浏览器默认的自动滚动行为，确保平移顺畅
svg.addEventListener('mousedown', (event) => {
  if (event.button === 1) {
    event.preventDefault();
  }
});

// 2D 视图滚轮缩放（以鼠标为缩放中心）
svg.addEventListener('wheel', (event) => {
  if (currentView !== '2d') return;
  event.preventDefault();

  const rect = svg.getBoundingClientRect();
  const svgX = ((event.clientX - rect.left) / rect.width) * view.width;
  const svgY = ((event.clientY - rect.top) / rect.height) * view.height;
  const worldCenter = svgToWorld(svgX, svgY);

  const zoomStep = 0.08;
  const factor = event.deltaY < 0 ? 1 - zoomStep : 1 + zoomStep;

  const currentSpanX = view.maxX - view.minX;
  const nextSpanX = currentSpanX * factor;
  // 限制视口世界坐标跨度在 0.5m 到 100m 之间
  if (nextSpanX < 0.5 || nextSpanX > 100) return;

  view.minX = worldCenter.x - factor * (worldCenter.x - view.minX);
  view.maxX = worldCenter.x + factor * (view.maxX - worldCenter.x);
  view.minZ = worldCenter.z - factor * (worldCenter.z - view.minZ);
  view.maxZ = worldCenter.z + factor * (view.maxZ - worldCenter.z);

  hasUserZoomedOrPanned = true;
  renderPlan();
}, { passive: false });

svg.addEventListener('pointerdown', (event) => {
  if (currentView !== '2d') return;
  // 记录到视图触点列表中
  viewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  // 鼠标中键平移
  if (event.pointerType === 'mouse' && event.button === 1) {
    isPanning2D = true;
    panStart2D = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
    hasUserZoomedOrPanned = true;
  }

  // 双指手势
  if (viewPointers.size === 2) {
    // 取消其他物体的拖动和编辑状态，避免冲突
    dragState = null;
    roomDragState = null;
    roomResizeState = null;
    openingDragState = null;
    wallDragState = null;
    structureDragState = null;
    roofResizeState = null;

    const pts = Array.from(viewPointers.values());
    prevTouchDist2D = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    prevTouchCenter2D = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    hasUserZoomedOrPanned = true;
  }
});

svg.addEventListener('pointermove', (event) => {
  // 更新我们的 viewPointers
  if (viewPointers.has(event.pointerId)) {
    viewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  // 处理中键平移
  if (isPanning2D && panStart2D) {
    const dx = event.clientX - panStart2D.x;
    const dy = event.clientY - panStart2D.y;
    const rect = svg.getBoundingClientRect();
    const innerW = view.width - view.pad * 2;
    const innerH = view.height - view.pad * 2;
    const worldDx = (dx * (view.width / rect.width)) * (view.maxX - view.minX) / innerW;
    const worldDz = -(dy * (view.height / rect.height)) * (view.maxZ - view.minZ) / innerH;

    view.minX -= worldDx;
    view.maxX -= worldDx;
    view.minZ -= worldDz;
    view.maxZ -= worldDz;

    panStart2D = { x: event.clientX, y: event.clientY };
    renderPlan();
    return;
  }

  // 处理双指缩放和平移
  if (viewPointers.size === 2 && prevTouchCenter2D) {
    const pts = Array.from(viewPointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

    if (prevTouchDist2D > 0 && prevTouchCenter2D) {
      const factor = prevTouchDist2D / dist;
      const rect = svg.getBoundingClientRect();
      const centerPoint = {
        x: ((center.x - rect.left) / rect.width) * view.width,
        y: ((center.y - rect.top) / rect.height) * view.height
      };
      const worldCenter = svgToWorld(centerPoint.x, centerPoint.y);

      const currentSpanX = view.maxX - view.minX;
      const nextSpanX = currentSpanX * factor;
      if (nextSpanX >= 0.5 && nextSpanX <= 100) {
        view.minX = worldCenter.x - factor * (worldCenter.x - view.minX);
        view.maxX = worldCenter.x + factor * (view.maxX - worldCenter.x);
        view.minZ = worldCenter.z - factor * (worldCenter.z - view.minZ);
        view.maxZ = worldCenter.z + factor * (view.maxZ - worldCenter.z);
      }

      // 平移
      const dx = center.x - prevTouchCenter2D.x;
      const dy = center.y - prevTouchCenter2D.y;
      const innerW = view.width - view.pad * 2;
      const innerH = view.height - view.pad * 2;
      const worldDx = (dx * (view.width / rect.width)) * (view.maxX - view.minX) / innerW;
      const worldDz = -(dy * (view.height / rect.height)) * (view.maxZ - view.minZ) / innerH;

      view.minX -= worldDx;
      view.maxX -= worldDx;
      view.minZ -= worldDz;
      view.maxZ -= worldDz;

      renderPlan();
    }

    prevTouchDist2D = dist;
    prevTouchCenter2D = center;
    event.preventDefault();
    return;
  }

  updatePointer(event);
  if (itemGestureState) {
    moveItemGesture();
    return;
  }
  if (roomResizeState) {
    moveRoomResize(event);
    return;
  }
  if (roofResizeState) {
    moveRoofResize(event);
    return;
  }
  if (roomDragState) {
    moveRoomDrag(event);
    return;
  }
  if (structureDragState) {
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    const nextX = world.x + structureDragState.offsetX;
    const nextZ = world.z + structureDragState.offsetZ;
    if (!structureDragState.historyPushed && Math.hypot(nextX - structureDragState.originalX, nextZ - structureDragState.originalZ) > 0.02) {
      pushHistory();
      structureDragState.historyPushed = true;
    }
    moveStructureTo(structureDragState.type, structureDragState.id, nextX, nextZ);
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
  if (fenceHandleDragState) {
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    const snapped = snapWorldPoint(world);
    if (!fenceHandleDragState.historyPushed && Math.hypot(world.x - fenceHandleDragState.startWorldX, world.z - fenceHandleDragState.startWorldZ) > 0.02) {
      pushHistory();
      fenceHandleDragState.historyPushed = true;
    }
    if (fenceHandleDragState.handle === 'from') {
      testMap.updateFence(fenceHandleDragState.fenceId, { from: [snapped.x, snapped.z] }, false);
    } else {
      testMap.updateFence(fenceHandleDragState.fenceId, { to: [snapped.x, snapped.z] }, false);
    }
    syncFenceMovePreview(fenceHandleDragState.fenceId);
    updateEditor();
    renderPlan();
  }
  if (fenceDragState) {
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    const dx = world.x - fenceDragState.startWorldX;
    const dz = world.z - fenceDragState.startWorldZ;
    if (!fenceDragState.historyPushed && Math.hypot(dx, dz) > 0.02) {
      pushHistory();
      fenceDragState.historyPushed = true;
    }
    moveFenceBy(fenceDragState.fenceId, dx, dz);
  }
});

svg.addEventListener('pointerup', (event) => {
  viewPointers.delete(event.pointerId);
  if (event.pointerType === 'mouse' && event.button === 1 || isPanning2D) {
    isPanning2D = false;
    panStart2D = null;
    try { svg.releasePointerCapture(event.pointerId); } catch (e) {}
  }
  if (viewPointers.size < 2) {
    prevTouchDist2D = 0;
    prevTouchCenter2D = null;
  }

  forgetPointer(event);
  if (itemGestureState && activePointers.size < 2) itemGestureState = null;
  dragState = null;
  structureDragState = null;
  finishRoofResize();
  finishRoomEdit();
  finishOpeningDrag();
  finishWallDrag();
  finishFenceDrag();
});

svg.addEventListener('pointercancel', (event) => {
  viewPointers.delete(event.pointerId);
  if (event.pointerType === 'mouse' && event.button === 1 || isPanning2D) {
    isPanning2D = false;
    panStart2D = null;
    try { svg.releasePointerCapture(event.pointerId); } catch (e) {}
  }
  if (viewPointers.size < 2) {
    prevTouchDist2D = 0;
    prevTouchCenter2D = null;
  }

  forgetPointer(event);
  if (itemGestureState && activePointers.size < 2) itemGestureState = null;
  dragState = null;
  structureDragState = null;
  finishRoofResize();
  finishRoomEdit();
  finishOpeningDrag();
  finishWallDrag();
  finishFenceDrag();
});

svg.addEventListener('dblclick', (event) => {
  if (currentView !== '2d') return;
  const target = get2DContextTargetFromElement(event.target);
  if (!target) {
    hasUserZoomedOrPanned = false;
    renderPlan();
  }
});

svg.addEventListener('click', (event) => {
  if (mode === 'select') {
    if (event.target.closest?.('.wall-line') || event.target.closest?.('[data-item-id]') || event.target.closest?.('[data-opening-id]') || event.target.closest?.('[data-roof-id]') || event.target.closest?.('[data-stairs-id]') || event.target.closest?.('[data-fence-id]') || event.target.closest?.('.fence-handle') || event.target.closest?.('[data-room-id]') || event.target.closest?.('[data-room-hit-id]') || event.target.closest?.('[data-room-handle]') || event.target.closest?.('[data-roof-handle]')) return;
  }
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
    const room = testMap.addRoom({ x: snapped[0], z: snapped[1], name: `\u65b0\u623f\u95f4 ${roomCounter++}` });
    refreshShadows();
    selectRoom(room.id);
    switchToSelectMode();
  } else if (mode.startsWith('add-roof')) {
    pushHistory();
    const subtype = mode.replace('add-roof-', '') || 'gable';
    const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : testMap.getRoomAt(snapped[0], snapped[1]);
    const roof = testMap.addRoof({
      x: room?.x ?? snapped[0],
      z: room?.z ?? snapped[1],
      width: room?.width ?? 6,
      depth: room?.depth ?? 6,
      subtype: subtype
    });
    refreshShadows();
    selectRoof(roof.id);
    switchToSelectMode();
  } else if (mode.startsWith('add-stairs')) {
    pushHistory();
    const subtype = mode.replace('add-stairs-', '') || 'straight';
    const stairs = testMap.addStairs({
      x: snapped[0],
      z: snapped[1],
      subtype: subtype
    });
    refreshShadows();
    selectStairs(stairs.id);
    switchToSelectMode();
  } else if (mode.startsWith('draw-fence')) {
    if (!drawStart) {
      drawStart = snapped;
    } else {
      pushHistory();
      const subtype = mode.replace('draw-fence-', '') || 'picket_wood';
      const fence = testMap.addFence({
        from: drawStart,
        to: snapped,
        subtype: subtype
      });
      drawStart = null;
      refreshShadows();
      selectFence(fence.id);
      switchToSelectMode();
    }
    renderPlan();
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

function findRoofIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintRoofId');
}

function findStairsIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintStairsId');
}

function findFenceIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintFenceId');
}

function groundPointFromPointer() {
  const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0;
  const distance = ray.intersectsPlane(new BABYLON.Plane(0, 1, 0, -floorY));
  if (distance === null || distance === undefined || distance < 0) return null;
  return ray.origin.add(ray.direction.scale(distance));
}

function clear3DEditHandles() {
  editHandleNodes.splice(0).forEach((node) => node.dispose(false, true));
  active3DEditTarget = null;
}

function get3DEditTargetBounds(type, id) {
  if (type === 'wall') {
    const wall = testMap.getWall(id);
    if (!wall) return null;
    return {
      target: wall,
      x: (wall.from[0] + wall.to[0]) / 2,
      z: (wall.from[1] + wall.to[1]) / 2,
      fromX: wall.from[0],
      fromZ: wall.from[1],
      toX: wall.to[0],
      toZ: wall.to[1],
      width: 0.3,
      depth: 0.3,
      height: 0,
      floorId: wall.floorId || testMap.floorplan.currentFloorId
    };
  }
  if (type === 'fence') {
    const fence = testMap.getFence(id);
    if (!fence) return null;
    return {
      target: fence,
      x: (fence.from[0] + fence.to[0]) / 2,
      z: (fence.from[1] + fence.to[1]) / 2,
      fromX: fence.from[0],
      fromZ: fence.from[1],
      toX: fence.to[0],
      toZ: fence.to[1],
      width: 0.15,
      depth: 0.15,
      height: fence.height || 1.1,
      floorId: fence.floorId || testMap.floorplan.currentFloorId
    };
  }
  const target = type === 'room' ? testMap.getRoom(id) : getStructure(type, id);
  if (!target) return null;
  return {
    target,
    x: Number(target.x || 0),
    z: Number(target.z || 0),
    width: Number(target.width || (type === 'stairs' ? 1.2 : 4)),
    depth: Number(target.depth || (type === 'stairs' ? 3.2 : 4)),
    height: Number(target.height || 0),
    floorId: target.floorId || testMap.floorplan.currentFloorId
  };
}

function get3DEditHandleY(type, bounds) {
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(bounds.floorId) : 0;
  if (type === 'wall') return floorY + 1.2;
  if (type === 'fence') return floorY + (bounds.height || 1.1) + 0.18;
  if (type === 'roof') return floorY + (testMap.floorplan.wallHeight || 2.8) + bounds.height + 0.18;
  if (type === 'stairs') return floorY + Math.max(0.18, Math.min(bounds.height || 1, 1.4));
  return floorY + 0.18;
}

function create3DEditHandle(type, id, action, side, position, color, rotationY = 0) {
  let handle = null;

  if (action === 'move') {
     // 1. 创建中心圆盘
    const centerDisc = BABYLON.MeshBuilder.CreateCylinder("center_disc", {
      height: 0.06,
      diameter: 0.18
    }, scene);
    
    const meshesToMerge = [centerDisc];
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
     // 2. 循环创建4个箭头（上下左右）
    angles.forEach((angle, idx) => {
       // 创建箭杆
      const shaft = BABYLON.MeshBuilder.CreateCylinder("shaft_" + idx, {
        height: 0.21,
        diameter: 0.06
      }, scene);
      shaft.rotation.x = Math.PI / 2;
      shaft.rotation.y = angle;
      shaft.position.x = 0.195 * Math.sin(angle);
      shaft.position.z = 0.195 * Math.cos(angle);
      // 创建箭头尖
      const tip = BABYLON.MeshBuilder.CreateCylinder("tip_" + idx, {
        height: 0.15,
        diameterTop: 0,
        diameterBottom: 0.15
      }, scene);
      tip.rotation.x = Math.PI / 2;
      tip.rotation.y = angle;
      tip.position.x = 0.375 * Math.sin(angle);
      tip.position.z = 0.375 * Math.cos(angle);
      
      shaft.bakeCurrentTransformIntoVertices();
      tip.bakeCurrentTransformIntoVertices();
      meshesToMerge.push(shaft, tip);
    });
    
    handle = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
  } else if (action === 'rotate') {
    const radius = 0.24;
    const path = [];
    for (let i = 0; i <= 20; i++) {
      const theta = (i / 20) * (Math.PI / 2);
      path.push(new BABYLON.Vector3(Math.cos(theta) * radius, 0, -Math.sin(theta) * radius));
    }
    const arc = BABYLON.MeshBuilder.CreateTube("arc", { path, radius: 0.024, tessellation: 12 }, scene);
    
    const arrowHeight = 0.18;
    const arrowDiameter = 0.14;
    
    const cone1 = BABYLON.MeshBuilder.CreateCylinder("cone1", {
      height: arrowHeight,
      diameterTop: 0,
      diameterBottom: arrowDiameter,
      tessellation: 16
    }, scene);
    cone1.position.set(radius, 0, arrowHeight / 2);
    cone1.rotation.x = Math.PI / 2;
    cone1.bakeCurrentTransformIntoVertices();
    
    const cone2 = BABYLON.MeshBuilder.CreateCylinder("cone2", {
      height: arrowHeight,
      diameterTop: 0,
      diameterBottom: arrowDiameter,
      tessellation: 16
    }, scene);
    cone2.position.set(-arrowHeight / 2, 0, -radius);
    cone2.rotation.z = Math.PI / 2;
    cone2.bakeCurrentTransformIntoVertices();
    
    handle = BABYLON.Mesh.MergeMeshes([arc, cone1, cone2], true, true, undefined, false, true);
  } else {
    const shaft = BABYLON.MeshBuilder.CreateCylinder("shaft", {
      height: 0.42,
      diameter: 0.075
    }, scene);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = 0.21;
    shaft.bakeCurrentTransformIntoVertices();
    
    const tip = BABYLON.MeshBuilder.CreateCylinder("tip", {
      height: 0.24,
      diameterTop: 0,
      diameterBottom: 0.21
    }, scene);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.54;
    tip.bakeCurrentTransformIntoVertices();
    
    handle = BABYLON.Mesh.MergeMeshes([shaft, tip], true, true, undefined, false, true);
  }

  if (!handle) return null;

  handle.name = 'edit_handle_' + type + '_' + id + '_' + action + '_' + (side || 'center');
  handle.position.set(position.x, position.y, position.z);
  
  if (action === 'resize' || action === 'rotate') {
    handle.rotation.y = rotationY;
  }
  
  handle.material = new BABYLON.StandardMaterial(handle.name + '_mat', scene);
  handle.material.diffuseColor = BABYLON.Color3.FromHexString(color);
  handle.material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.35);
  handle.material.specularColor = new BABYLON.Color3(0, 0, 0);
  handle.material.disableDepthWrite = true;
  handle.material.depthFunction = BABYLON.Engine.ALWAYS;
  handle.metadata = { blueprintEditHandle: { type, id, action, side } };
  handle.isPickable = true;
  handle.renderingGroupId = 3;
  handle.alwaysSelectAsActiveMesh = true;
  handle.renderOutline = true;
  handle.outlineWidth = 0.035;
  handle.outlineColor = BABYLON.Color3.FromHexString('#ffffff');
  
  editHandleNodes.push(handle);
  return handle;
}

function refresh3DEditHandles() {
  if (!active3DEditTarget || currentView !== '3d') return;
  const { type, id } = active3DEditTarget;
  const bounds = get3DEditTargetBounds(type, id);
  editHandleNodes.splice(0).forEach((node) => node.dispose(false, true));
  if (!bounds || isTargetLocked({ type, id })) {
    active3DEditTarget = null;
    return;
  }
  const y = get3DEditHandleY(type, bounds);
  if (type === 'wall') {
    const wall = bounds.target;
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const angle = Math.atan2(dx, dz);
    
    create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
    create3DEditHandle(type, id, 'resize', 'from', { x: bounds.fromX, y, z: bounds.fromZ }, '#ff9f1c', angle + Math.PI);
    create3DEditHandle(type, id, 'resize', 'to', { x: bounds.toX, y, z: bounds.toZ }, '#ff9f1c', angle);
    return;
  }
  if (type === 'fence') {
    const fence = bounds.target;
    const dx = fence.to[0] - fence.from[0];
    const dz = fence.to[1] - fence.from[1];
    const angle = Math.atan2(dx, dz);
    
    create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
    create3DEditHandle(type, id, 'resize', 'from', { x: bounds.fromX, y, z: bounds.fromZ }, '#ff9f1c', angle + Math.PI);
    create3DEditHandle(type, id, 'resize', 'to', { x: bounds.toX, y, z: bounds.toZ }, '#ff9f1c', angle);
    return;
  }

  const halfW = bounds.width / 2;
  const halfD = bounds.depth / 2;
  create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
  create3DEditHandle(type, id, 'resize', 'north', { x: bounds.x, y, z: bounds.z - halfD }, '#ff9f1c', Math.PI);
  create3DEditHandle(type, id, 'resize', 'south', { x: bounds.x, y, z: bounds.z + halfD }, '#ff9f1c', 0);
  create3DEditHandle(type, id, 'resize', 'east', { x: bounds.x + halfW, y, z: bounds.z }, '#ff9f1c', Math.PI / 2);
  create3DEditHandle(type, id, 'resize', 'west', { x: bounds.x - halfW, y, z: bounds.z }, '#ff9f1c', -Math.PI / 2);
  if (type === 'roof' || type === 'stairs') {
    create3DEditHandle(type, id, 'rotate', 'rotation', { x: bounds.x + halfW + 0.4, y, z: bounds.z - halfD - 0.4 }, '#2ec456', 0);
  }
}

function set3DEditTarget(type, id) {
  active3DEditTarget = { type, id };
  refresh3DEditHandles();
}

function same3DEditTarget(type, id) {
  return active3DEditTarget?.type === type && active3DEditTarget?.id === id;
}

function findEditHandleFromNode(node) {
  return findMetadataFromNode(node, 'blueprintEditHandle');
}

function pickNearest3DTarget(pointerX = scene.pointerX, pointerY = scene.pointerY) {
  const handlePick = scene.pick(pointerX, pointerY, (mesh) => !!findEditHandleFromNode(mesh));
  const pickedHandle = handlePick?.pickedMesh ? findEditHandleFromNode(handlePick.pickedMesh) : null;
  if (pickedHandle) return { type: 'edit-handle', id: pickedHandle.id, handle: pickedHandle, pick: handlePick };

  const pick = scene.pick(pointerX, pointerY, (mesh) => (
    !!findOpeningIdFromNode(mesh)
    || !!findItemIdFromNode(mesh)
    || !!findWallIdFromNode(mesh)
    || !!findRoomIdFromNode(mesh)
    || !!findRoofIdFromNode(mesh)
    || !!findStairsIdFromNode(mesh)
    || !!findFenceIdFromNode(mesh)
  ));
  const mesh = pick?.pickedMesh;
  if (!mesh) return null;
  const openingId = findOpeningIdFromNode(mesh);
  if (openingId) return { type: 'opening', id: openingId, pick };
  const wallId = findWallIdFromNode(mesh);
  if (wallId) return { type: 'wall', id: wallId, pick };
  const itemId = findItemIdFromNode(mesh);
  if (itemId) return { type: 'item', id: itemId, pick };
  const roofId = findRoofIdFromNode(mesh);
  if (roofId) return { type: 'roof', id: roofId, pick };
  const stairsId = findStairsIdFromNode(mesh);
  if (stairsId) return { type: 'stairs', id: stairsId, pick };
  const fenceId = findFenceIdFromNode(mesh);
  if (fenceId) return { type: 'fence', id: fenceId, pick };
  const roomId = findRoomIdFromNode(mesh);
  if (roomId) return { type: 'room', id: roomId, pick };
  return null;
}


function begin3DEditHandleDrag(handle, event) {
  if (isTargetLocked({ type: handle.type, id: handle.id })) return false;
  const bounds = get3DEditTargetBounds(handle.type, handle.id);
  const groundPoint = groundPointFromPointer();
  if (!bounds || !groundPoint) return false;
  active3DEditTarget = { type: handle.type, id: handle.id };
  editHandleDragState = {
    type: handle.type,
    id: handle.id,
    action: handle.action,
    side: handle.side,
    pointerId: event.pointerId,
    original: (handle.type === 'wall' || handle.type === 'fence') ? {
      from: [bounds.fromX, bounds.fromZ],
      to: [bounds.toX, bounds.toZ],
      x: bounds.x,
      z: bounds.z
    } : { x: bounds.x, z: bounds.z, width: bounds.width, depth: bounds.depth },
    offsetX: bounds.x - groundPoint.x,
    offsetZ: bounds.z - groundPoint.z,
    historyPushed: false
  };

  if (handle.type === 'wall' || handle.type === 'fence') {
    const targetX = (handle.action === 'move' || handle.side === 'from') ? bounds.fromX : bounds.toX;
    const targetZ = (handle.action === 'move' || handle.side === 'from') ? bounds.fromZ : bounds.toZ;
    editHandleDragState.dragOffsetX = targetX - groundPoint.x;
    editHandleDragState.dragOffsetZ = targetZ - groundPoint.z;
  }

  if (handle.action === 'rotate') {
    const structure = getStructure(handle.type, handle.id);
    if (structure) {
      editHandleDragState.originalRotation = structure.rotation || 0;
      const dx = groundPoint.x - bounds.x;
      const dz = groundPoint.z - bounds.z;
      editHandleDragState.startAngle = Math.atan2(dz, dx);
    }
  }

  drag3DState = { type: 'edit-handle', pointerId: event.pointerId };
  document.body.classList.add('is-dragging-3d');
  canvas.setPointerCapture?.(event.pointerId);
  camera.detachControl(canvas);
  event.preventDefault();
  return true;
}

function syncRoomMovePreview(roomId) {
  const room = testMap.getRoom(roomId);
  if (!room) return;
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(room.floorId) : 0;
  const floor = testMap.floorNodes?.get(room.id);
  if (floor) floor.position.set(room.x, floorY - (testMap.floorplan.floorHeight || 0.08) / 2, room.z);

  const wallIds = new Set(Object.values(room.wallIds || {}));
  wallIds.forEach((wallId) => {
    const wall = testMap.getWall(wallId);
    const node = testMap.wallNodes?.get(wallId);
    if (!wall || !node) return;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    node.position.set(x1, 0, z1);
    const currentLength = Math.hypot(x2 - x1, z2 - z1);
    const originalLength = node.metadata?.originalLength || currentLength || 1;
    node.scaling.x = currentLength / originalLength;
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  });

  testMap.floorplan.openings.forEach((opening) => {
    if (!wallIds.has(opening.wallId)) return;
    const wall = testMap.getWall(opening.wallId);
    const node = testMap.openingNodes?.get(opening.id);
    if (!wall || !node) return;
    const point = wallPointAt(wall, opening.t ?? 0.5);
    const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
    const localY = opening.type === 'door' ? height / 2 : (opening.sillHeight ?? 1.05) + height / 2;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    node.position.set(point.x, floorY + localY, point.z);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  });

  testMap.floorplan.items.forEach((item) => {
    if (item.roomId !== room.id) return;
    const node = testMap.itemNodes?.get(item.id);
    if (node) node.position.set(item.x, floorY + (item.elevation || 0) / 24, item.z);
  });
}

function syncWallMovePreview(wallId) {
  const wall = testMap.getWall(wallId);
  const node = testMap.wallNodes?.get(wallId);
  if (!wall || !node) return;
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  node.position.set(x1, 0, z1);
  const currentLength = Math.hypot(x2 - x1, z2 - z1);
  const originalLength = node.metadata?.originalLength || currentLength || 1;
  node.scaling.x = currentLength / originalLength;
  node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);

  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(wall.floorId) : 0;
  testMap.floorplan.openings.forEach((opening) => {
    if (opening.wallId !== wallId) return;
    const opNode = testMap.openingNodes?.get(opening.id);
    if (!opNode) return;
    const point = wallPointAt(wall, opening.t ?? 0.5);
    const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
    const localY = opening.type === 'door' ? height / 2 : (opening.sillHeight ?? 1.05) + height / 2;
    const [wx1, wz1] = wall.from;
    const [wx2, wz2] = wall.to;
    opNode.position.set(point.x, floorY + localY, point.z);
    opNode.rotation.y = -Math.atan2(wz2 - wz1, wx2 - wx1);
  });
}

function syncFenceMovePreview(fenceId) {
  const fence = testMap.getFence(fenceId);
  const node = testMap.fenceNodes?.get(fenceId);
  if (!fence || !node) return;
  const [x1, z1] = fence.from;
  const [x2, z2] = fence.to;
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(fence.floorId) : 0;
  
  node.position.set((x1 + x2) / 2, floorY, (z1 + z2) / 2);
  
  const currentLength = Math.hypot(x2 - x1, z2 - z1);
  const originalLength = node.metadata?.originalLength || currentLength || 1;
  node.scaling.x = currentLength / originalLength;
  node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
}

function update3DEditTarget(type, id, patch, options = {}) {
  if (type === 'wall') {
    const rebuild = options.rebuild !== false;
    if (rebuild) {
      testMap.build();
      refreshShadows();
    } else {
      syncWallMovePreview(id);
    }
  } else if (type === 'fence') {
    const rebuild = options.rebuild !== false;
    if (rebuild) {
      testMap.build();
      refreshShadows();
    } else {
      syncFenceMovePreview(id);
    }
  } else if (type === 'room') {
    const rebuild = options.rebuild !== false;
    const moveItems = options.moveItems !== false;
    testMap.updateRoom(id, patch, { moveItems, rebuild });
    if (rebuild) refreshShadows();
    else syncRoomMovePreview(id);
  } else {
    const rebuild = options.rebuild !== false;
    const updated = updateStructure(type, id, patch, rebuild);
    if (!rebuild && updated) {
      const node = type === 'roof' ? testMap.roofNodes?.get(id) : testMap.stairNodes?.get(id);
      if (node) {
        node.position.x = updated.x || 0;
        node.position.z = updated.z || 0;
      }
    } else {
      refreshShadows();
    }
  }
  updateEditor();
  refresh3DEditHandles();
}

function move3DEditHandle(groundPoint) {
  if (!editHandleDragState) return;
  const state = editHandleDragState;
  const original = state.original;
  const snapped = snapWorldPoint({ x: groundPoint.x, z: groundPoint.z });
  let patch = null;
  let moveItems = false;
  let rebuild = true;

  if (state.action === 'rotate') {
    const bounds = get3DEditTargetBounds(state.type, state.id);
    if (!bounds) return;
    const dx = groundPoint.x - bounds.x;
    const dz = groundPoint.z - bounds.z;
    const currentAngle = Math.atan2(dz, dx);
    const deltaAngle = currentAngle - state.startAngle;
    const nextRotation = state.originalRotation + deltaAngle;
    const degrees = (nextRotation * 180 / Math.PI + 360) % 360;
    const normalizedDegrees = normalizeRotationDegrees(degrees);
    const rotationRad = normalizedDegrees * Math.PI / 180;
    
    const node = state.type === 'roof' ? testMap.roofNodes?.get(state.id) : testMap.stairNodes?.get(state.id);
    if (node) {
      node.rotation.y = rotationRad;
    }
    
    updateStructure(state.type, state.id, { rotation: rotationRad }, false);
    
    if (!state.historyPushed && Math.abs(deltaAngle) > 0.02) {
      pushHistory();
      state.historyPushed = true;
    }
    return;
  }

  if (state.type === 'wall') {
    const wall = testMap.getWall(state.id);
    if (!wall) return;
    let nextFrom = [...original.from];
    let nextTo = [...original.to];
    
    if (state.action === 'move') {
      const targetFromX = groundPoint.x + state.dragOffsetX;
      const targetFromZ = groundPoint.z + state.dragOffsetZ;
      const snappedFrom = snapWorldPoint({ x: targetFromX, z: targetFromZ });
      const dx = snappedFrom.x - original.from[0];
      const dz = snappedFrom.z - original.from[1];
      
      if (!state.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
        pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedFrom.x, snappedFrom.z];
      nextTo = [Number((original.to[0] + dx).toFixed(3)), Number((original.to[1] + dz).toFixed(3))];
    } else if (state.side === 'from') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.from[0], snappedTarget.z - original.from[1]) > 0.02) {
        pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedTarget.x, snappedTarget.z];
    } else if (state.side === 'to') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.to[0], snappedTarget.z - original.to[1]) > 0.02) {
        pushHistory();
        state.historyPushed = true;
      }
      
      nextTo = [snappedTarget.x, snappedTarget.z];
    }
    
    wall.from = [Number(nextFrom[0].toFixed(3)), Number(nextFrom[1].toFixed(3))];
    wall.to = [Number(nextTo[0].toFixed(3)), Number(nextTo[1].toFixed(3))];
    
    update3DEditTarget('wall', state.id, null, { rebuild: false });
    return;
  }
  if (state.type === 'fence') {
    const fence = testMap.getFence(state.id);
    if (!fence) return;
    let nextFrom = [...original.from];
    let nextTo = [...original.to];
    
    if (state.action === 'move') {
      const targetFromX = groundPoint.x + state.dragOffsetX;
      const targetFromZ = groundPoint.z + state.dragOffsetZ;
      const snappedFrom = snapWorldPoint({ x: targetFromX, z: targetFromZ });
      const dx = snappedFrom.x - original.from[0];
      const dz = snappedFrom.z - original.from[1];
      
      if (!state.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
        pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedFrom.x, snappedFrom.z];
      nextTo = [Number((original.to[0] + dx).toFixed(3)), Number((original.to[1] + dz).toFixed(3))];
    } else if (state.side === 'from') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.from[0], snappedTarget.z - original.from[1]) > 0.02) {
        pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedTarget.x, snappedTarget.z];
    } else if (state.side === 'to') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.to[0], snappedTarget.z - original.to[1]) > 0.02) {
        pushHistory();
        state.historyPushed = true;
      }
      
      nextTo = [snappedTarget.x, snappedTarget.z];
    }
    
    fence.from = [Number(nextFrom[0].toFixed(3)), Number(nextFrom[1].toFixed(3))];
    fence.to = [Number(nextTo[0].toFixed(3)), Number(nextTo[1].toFixed(3))];
    
    update3DEditTarget('fence', state.id, null, { rebuild: false });
    return;
  }

  if (state.action === 'move') {
    const rawX = groundPoint.x + state.offsetX;
    const rawZ = groundPoint.z + state.offsetZ;
    const left = snapNumber(rawX - original.width / 2);
    const top = snapNumber(rawZ - original.depth / 2);
    patch = {
      x: Number((left + original.width / 2).toFixed(3)),
      z: Number((top + original.depth / 2).toFixed(3))
    };
    moveItems = true;
    rebuild = false;
  } else {
    const minWidth = state.type === 'stairs' ? 0.6 : (state.type === 'room' ? 1.2 : 1);
    const minDepth = state.type === 'stairs' ? 1.2 : (state.type === 'room' ? 1.2 : 1);
    const left = original.x - original.width / 2;
    const right = original.x + original.width / 2;
    const top = original.z - original.depth / 2;
    const bottom = original.z + original.depth / 2;

    let w = original.width;
    let d = original.depth;
    let x = original.x;
    let z = original.z;

    if (state.side === 'west' || state.side === 'east') {
      let rawW = original.width;
      if (state.side === 'west') {
        const snappedRight = snapNumber(right);
        rawW = snappedRight - snapped.x;
        w = snapValue(rawW);
        if (snapEnabled && snapSize) {
          if (w < minWidth) w = Math.ceil(minWidth / snapSize) * snapSize;
        } else {
          w = Math.max(minWidth, w);
        }
        x = snappedRight - w / 2;
      } else {
        const snappedLeft = snapNumber(left);
        rawW = snapped.x - snappedLeft;
        w = snapValue(rawW);
        if (snapEnabled && snapSize) {
          if (w < minWidth) w = Math.ceil(minWidth / snapSize) * snapSize;
        } else {
          w = Math.max(minWidth, w);
        }
        x = snappedLeft + w / 2;
      }
    }

    if (state.side === 'north' || state.side === 'south') {
      let rawD = original.depth;
      if (state.side === 'north') {
        const snappedBottom = snapNumber(bottom);
        rawD = snappedBottom - snapped.z;
        d = snapValue(rawD);
        if (snapEnabled && snapSize) {
          if (d < minDepth) d = Math.ceil(minDepth / snapSize) * snapSize;
        } else {
          d = Math.max(minDepth, d);
        }
        z = snappedBottom - d / 2;
      } else {
        const snappedTop = snapNumber(top);
        rawD = snapped.z - snappedTop;
        d = snapValue(rawD);
        if (snapEnabled && snapSize) {
          if (d < minDepth) d = Math.ceil(minDepth / snapSize) * snapSize;
        } else {
          d = Math.max(minDepth, d);
        }
        z = snappedTop + d / 2;
      }
    }

    patch = {
      x: snapNumber(x),
      z: snapNumber(z),
      width: snapNumber(w),
      depth: snapNumber(d)
    };
    moveItems = false;
    rebuild = false;
  }

  const moved = Math.hypot((patch.x ?? original.x) - original.x, (patch.z ?? original.z) - original.z);
  const resized = Math.abs((patch.width ?? original.width) - original.width) + Math.abs((patch.depth ?? original.depth) - original.depth);
  if (!state.historyPushed && (moved > 0.02 || resized > 0.02)) {
    pushHistory();
    state.historyPushed = true;
  }
  
  if (state.type === 'roof' || state.type === 'stairs') {
    const node = state.type === 'roof' ? testMap.roofNodes?.get(state.id) : testMap.stairNodes?.get(state.id);
    if (node && original.width && original.depth && patch.width && patch.depth) {
      node.scaling.x = patch.width / original.width;
      node.scaling.z = patch.depth / original.depth;
    }
  }

  update3DEditTarget(state.type, state.id, patch, { moveItems, rebuild });
}

function begin3DDrag(pointerInfo) {
  const event = pointerInfo.event;
  if (event.button === 2) {
    if (mode === 'draw-wall' || mode === 'delete-wall' || mode === 'add-room' || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || mode === 'add-door' || mode === 'add-window') {
      drawStart = null;
      clearDrawWallPreview();
      switchToSelectMode();
      event.preventDefault();
      return;
    }
  }
  if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

  if (mode === 'delete-wall') {
    const target = pickNearest3DTarget();
    if (target && target.type === 'wall' && isTargetOnCurrentFloor(target)) {
      pushHistory();
      testMap.deleteWall(target.id);
      clearSelection();
      refreshShadows();
      event.preventDefault();
      return;
    }
  }

  if (mode === 'draw-wall') {
    const point = groundPointFromPointer();
    if (point) {
      const snapped = snapWorldPoint({ x: point.x, z: point.z });
      const snappedPos = [snapped.x, snapped.z];
      if (!drawStart) {
        drawStart = snappedPos;
      } else {
        pushHistory();
        testMap.addWall(drawStart, snappedPos);
        drawStart = null;
        clearDrawWallPreview();
        refreshShadows();
      }
      event.preventDefault();
      return;
    }
  }

  if (mode === 'add-room' || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || mode.startsWith('draw-fence')) {
    const point = groundPointFromPointer();
    if (point) {
      const snapped = snapWorldPoint({ x: point.x, z: point.z });
      if (mode.startsWith('draw-fence')) {
        const subtype = mode.replace('draw-fence-', '') || 'picket_wood';
        if (!drawStart) {
          drawStart = [snapped.x, snapped.z];
        } else {
          pushHistory();
          const fence = testMap.addFence({
            from: drawStart,
            to: [snapped.x, snapped.z],
            subtype: subtype
          });
          drawStart = null;
          clearDrawWallPreview();
          refreshShadows();
          selectFence(fence.id);
          switchToSelectMode();
        }
      } else {
        pushHistory();
        if (mode === 'add-room') {
          const room = testMap.addRoom({ x: snapped.x, z: snapped.z, name: `\u65b0\u623f\u95f4 ${roomCounter++}` });
          refreshShadows();
          selectRoom(room.id);
        } else if (mode.startsWith('add-roof')) {
          const subtype = mode.replace('add-roof-', '') || 'gable';
          const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : testMap.getRoomAt(snapped.x, snapped.z);
          const roof = testMap.addRoof({
            x: room?.x ?? snapped.x,
            z: room?.z ?? snapped.z,
            width: room?.width ?? 6,
            depth: room?.depth ?? 6,
            subtype: subtype
          });
          refreshShadows();
          selectRoof(roof.id);
        } else {
          const subtype = mode.replace('add-stairs-', '') || 'straight';
          const stairs = testMap.addStairs({
            x: snapped.x,
            z: snapped.z,
            subtype: subtype
          });
          refreshShadows();
          selectStairs(stairs.id);
        }
        switchToSelectMode();
      }
      event.preventDefault();
      return;
    }
  }

  if (mode === 'add-door' || mode === 'add-window') {
    const target = pickNearest3DTarget();
    if (target && target.type === 'wall' && isTargetOnCurrentFloor(target)) {
      const wallId = target.id;
      const wall = testMap.getWall(wallId);
      if (wall && target.pick.pickedPoint) {
        pushHistory();
        const pt = target.pick.pickedPoint;
        const opening = testMap.addOpening(wallId, mode === 'add-door' ? 'door' : 'window', getWallProjectionT(wall, pt));
        refreshShadows();
        selectOpening(opening?.id || null);
        switchToSelectMode();
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

  if (target.type === 'edit-handle') {
    begin3DEditHandleDrag(target.handle, event);
    return;
  }

  if (!isTargetOnCurrentFloor(target)) {
    event.preventDefault();
    return;
  }

  if (target.type === 'opening') {
    selectOpening(target.id);
    const opening = testMap.getOpening(target.id);
    const groundPoint = groundPointFromPointer();
    if (!opening || opening.locked || !groundPoint) return;
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
    if (selectedWallId === target.id) {
      if (!same3DEditTarget('wall', target.id)) set3DEditTarget('wall', target.id);
    } else {
      selectWall(target.id);
    }
    event.preventDefault();
    return;
  }

  if (target.type === 'room') {
    if (selectedRoomId === target.id) {
      if (!same3DEditTarget('room', target.id)) set3DEditTarget('room', target.id);
    } else {
      selectRoom(target.id);
    }
    event.preventDefault();
    return;
  }

  if (target.type === 'roof' || target.type === 'stairs') {
    const isSame = target.type === 'roof' ? selectedRoofId === target.id : selectedStairsId === target.id;
    if (isSame) {
      if (!same3DEditTarget(target.type, target.id)) set3DEditTarget(target.type, target.id);
    } else if (target.type === 'roof') {
      selectRoof(target.id);
    } else {
      selectStairs(target.id);
    }
    event.preventDefault();
    return;
  }
  if (target.type === 'fence') {
    if (selectedFenceId === target.id) {
      if (!same3DEditTarget('fence', target.id)) set3DEditTarget('fence', target.id);
    } else {
      selectFence(target.id);
    }
    event.preventDefault();
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
  if (drag3DState.type === 'edit-handle') {
    move3DEditHandle(groundPoint);
  } else if (drag3DState.type === 'item') {
    const nextX = groundPoint.x + drag3DState.offsetX;
    const nextZ = groundPoint.z + drag3DState.offsetZ;
    if (!drag3DState.historyPushed && Math.hypot(nextX - drag3DState.originalX, nextZ - drag3DState.originalZ) > 0.02) {
      pushHistory();
      drag3DState.historyPushed = true;
    }
    moveItemTo(drag3DState.itemId, nextX, nextZ);
  } else if (drag3DState.type === 'opening') {
    moveOpeningToWorld(drag3DState.openingId, { x: groundPoint.x, z: groundPoint.z }, drag3DState);
  } else if (drag3DState.type === 'roof' || drag3DState.type === 'stairs') {
    const nextX = groundPoint.x + drag3DState.offsetX;
    const nextZ = groundPoint.z + drag3DState.offsetZ;
    if (!drag3DState.historyPushed && Math.hypot(nextX - drag3DState.originalX, nextZ - drag3DState.originalZ) > 0.02) {
      pushHistory();
      drag3DState.historyPushed = true;
    }
    moveStructureTo(drag3DState.type, drag3DState.structureId, nextX, nextZ, { rebuild: false, refresh: false });
  }
  pointerInfo.event.preventDefault();
}

function end3DDrag(event) {
  if (!drag3DState) return;
  if (event?.pointerId !== undefined && drag3DState.pointerId !== event.pointerId) return;
  canvas.releasePointerCapture?.(drag3DState.pointerId);
  const openingId = drag3DState.type === 'opening' ? drag3DState.openingId : null;
  const roofId = drag3DState.type === 'roof' ? drag3DState.structureId : null;
  const stairsId = drag3DState.type === 'stairs' ? drag3DState.structureId : null;
  const completedEditHandle = drag3DState.type === 'edit-handle' ? editHandleDragState : null;
  const editTarget = drag3DState.type === 'edit-handle' ? active3DEditTarget : null;
  drag3DState = null;
  editHandleDragState = null;
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);
  if (openingId) {
    testMap.build();
    refreshShadows();
    selectOpening(openingId);
  }
  if (roofId) selectRoof(roofId);
  if (stairsId) selectStairs(stairsId);
  if (completedEditHandle?.type === 'room' || completedEditHandle?.type === 'wall' ||
      completedEditHandle?.type === 'fence' ||
      completedEditHandle?.type === 'roof' || completedEditHandle?.type === 'stairs' ||
      roofId || stairsId) {
    testMap.build();
    refreshShadows();
  }
  if (editTarget) {
    active3DEditTarget = editTarget;
    refresh3DEditHandles();
  }
}

function getCanvasPickFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return pickNearest3DTarget(event.clientX - rect.left, event.clientY - rect.top);
}

function get3DContextTarget(event) {
  const target = getCanvasPickFromEvent(event);
  if (!target || target.type === 'edit-handle') return null;
  return isAllowedContextTarget(target) ? { type: target.type, id: target.id } : null;
}

// 阻止鼠标中键(1)在 canvas 上触发浏览器的自动滚动行为，确保中键平移流畅
canvas.addEventListener('mousedown', (event) => {
  if (event.button === 1) {
    event.preventDefault();
  }
});

canvas.addEventListener('contextmenu', (event) => {
  const target = get3DContextTarget(event);
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  showObjectContextMenu(target, event.clientX, event.clientY);
});

canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' || event.button === 2) return;
  const target = get3DContextTarget(event);
  if (!target) return;
  const startX = event.clientX;
  const startY = event.clientY;
  cancelLongPress();
  longPressState = {
    pointerId: event.pointerId,
    startX,
    startY,
    timer: window.setTimeout(() => {
      longPressState = null;
      cancelObjectInteractions();
      showObjectContextMenu(target, startX, startY);
    }, 620)
  };
});

canvas.addEventListener('pointermove', (event) => {
  if (!longPressState || longPressState.pointerId !== event.pointerId) return;
  if (Math.hypot(event.clientX - longPressState.startX, event.clientY - longPressState.startY) > 8) cancelLongPress();
});

canvas.addEventListener('pointerup', cancelLongPress);
canvas.addEventListener('pointercancel', cancelLongPress);
scene.onPointerObservable.add((pointerInfo) => {
  if (currentView !== '3d') return;
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) begin3DDrag(pointerInfo);
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
    if (mode === 'draw-wall' || mode.startsWith('draw-fence')) {
      const point = groundPointFromPointer();
      if (point) {
        const snapped = snapWorldPoint({ x: point.x, z: point.z });
        updateDrawWallPreview(snapped);
      } else {
        clearDrawWallPreview();
      }
    } else {
      clearDrawWallPreview();
    }
    move3DDrag(pointerInfo);
  }
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) end3DDrag(pointerInfo.event);
});

canvas.addEventListener('pointercancel', end3DDrag);
window.addEventListener('pointerup', end3DDrag);

function clearDrawWallPreview() {
  if (drawWallPreviewCylinder) {
    drawWallPreviewCylinder.dispose();
    drawWallPreviewCylinder = null;
  }
  if (drawWallPreviewStartCylinder) {
    drawWallPreviewStartCylinder.dispose();
    drawWallPreviewStartCylinder = null;
  }
  if (drawWallPreviewWall) {
    drawWallPreviewWall.dispose();
    drawWallPreviewWall = null;
  }
}
window.clearDrawWallPreview = clearDrawWallPreview;

function updateDrawWallPreview(snappedPoint) {
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0;
  const isFence = mode.startsWith('draw-fence');
  const H = isFence ? 1.1 : (testMap.floorplan.wallHeight || 2.8);
  const T = isFence ? 0.1 : (testMap.floorplan.wallThickness || 0.18);

  // 如果预览类型（墙体还是栅栏）改变了，先销毁以便重建
  if (drawWallPreviewCylinder && drawWallPreviewCylinder.metadata?.isFence !== isFence) {
    clearDrawWallPreview();
  }

  // 1. 更新当前悬浮处的立柱
  if (!drawWallPreviewCylinder) {
    drawWallPreviewCylinder = BABYLON.MeshBuilder.CreateCylinder("draw_wall_preview_cyl", {
      height: H,
      diameter: T
    }, scene);
    drawWallPreviewCylinder.metadata = { isFence };
    const mat = new BABYLON.StandardMaterial("draw_wall_cyl_mat", scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString("#ff4081");
    mat.emissiveColor = BABYLON.Color3.FromHexString("#ff4081").scale(0.35);
    mat.alpha = 0.55;
    mat.disableDepthWrite = true;
    drawWallPreviewCylinder.material = mat;
    drawWallPreviewCylinder.isPickable = false;
  }
  drawWallPreviewCylinder.position.set(snappedPoint.x, floorY + H / 2, snappedPoint.z);

  // 2. 如果存在 drawStart，更新起点立柱和预览墙体
  if (drawStart) {
    // 起点立柱
    if (!drawWallPreviewStartCylinder) {
      drawWallPreviewStartCylinder = BABYLON.MeshBuilder.CreateCylinder("draw_wall_preview_start_cyl", {
        height: H,
        diameter: T
      }, scene);
      drawWallPreviewStartCylinder.metadata = { isFence };
      const mat = new BABYLON.StandardMaterial("draw_wall_start_cyl_mat", scene);
      mat.diffuseColor = BABYLON.Color3.FromHexString("#4caf50");
      mat.emissiveColor = BABYLON.Color3.FromHexString("#4caf50").scale(0.35);
      mat.alpha = 0.55;
      mat.disableDepthWrite = true;
      drawWallPreviewStartCylinder.material = mat;
      drawWallPreviewStartCylinder.isPickable = false;
    }
    drawWallPreviewStartCylinder.position.set(drawStart[0], floorY + H / 2, drawStart[1]);

    // 预览墙面 Box
    const dx = snappedPoint.x - drawStart[0];
    const dz = snappedPoint.z - drawStart[1];
    const distance = Math.hypot(dx, dz);

    if (distance > 0.01) {
      if (!drawWallPreviewWall) {
        drawWallPreviewWall = BABYLON.MeshBuilder.CreateBox("draw_wall_preview_wall", {
          width: 1,
          height: H,
          depth: T
        }, scene);
        drawWallPreviewWall.metadata = { isFence };
        const mat = new BABYLON.StandardMaterial("draw_wall_preview_wall_mat", scene);
        mat.diffuseColor = BABYLON.Color3.FromHexString("#1f8fff");
        mat.emissiveColor = BABYLON.Color3.FromHexString("#1f8fff").scale(0.35);
        mat.alpha = 0.35;
        mat.disableDepthWrite = true;
        drawWallPreviewWall.material = mat;
        drawWallPreviewWall.isPickable = false;
      }
      drawWallPreviewWall.visibility = 1.0;
      drawWallPreviewWall.scaling.x = distance;
      drawWallPreviewWall.position.set(
        drawStart[0] + dx / 2,
        floorY + H / 2,
        drawStart[1] + dz / 2
      );
      drawWallPreviewWall.rotation.y = -Math.atan2(dz, dx);
    } else {
      if (drawWallPreviewWall) {
        drawWallPreviewWall.visibility = 0;
      }
    }
  } else {
    if (drawWallPreviewStartCylinder) {
      drawWallPreviewStartCylinder.dispose();
      drawWallPreviewStartCylinder = null;
    }
    if (drawWallPreviewWall) {
      drawWallPreviewWall.dispose();
      drawWallPreviewWall = null;
    }
  }
}

function clearSelection() {
  clear3DEditHandles();
  clearDrawWallPreview();
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedFenceId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectRoom(roomId) {
  clear3DEditHandles();
  selectedRoomId = roomId;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedFenceId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectWall(wallId) {
  clear3DEditHandles();
  selectedWallId = wallId;
  selectedRoomId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedFenceId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(wallId);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectItem(itemId) {
  clear3DEditHandles();
  selectedItemId = itemId;
  selectedRoomId = null;
  selectedWallId = null;
  selectedOpeningId = null;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedFenceId = null;
  testMap.setSelectedWall(null);
  testMap.setSelectedItem(itemId);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectOpening(openingId) {
  clear3DEditHandles();
  selectedOpeningId = openingId;
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedFenceId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectRoof(roofId) {
  clear3DEditHandles();
  selectedRoofId = roofId;
  selectedStairsId = null;
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  selectedFenceId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectStairs(stairsId) {
  clear3DEditHandles();
  selectedStairsId = stairsId;
  selectedRoofId = null;
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  selectedFenceId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  updateEditor();
  renderPlan();
}

function selectFence(fenceId) {
  clear3DEditHandles();
  selectedFenceId = fenceId;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(fenceId);
  if (fenceId) set3DEditTarget('fence', fenceId);
  updateEditor();
  renderPlan();
}

function currentFences() {
  return testMap.floorplan.fences || [];
}

function renderFence(fence) {
  const a = worldToSvg(fence.from[0], fence.from[1]);
  const b = worldToSvg(fence.to[0], fence.to[1]);
  
  const group = createSvgElement('g', {
    class: `fence-group ${selectedFenceId === fence.id ? 'selected' : ''}`,
    'data-fence-id': fence.id
  });
  attachContextMenuTrigger(group, () => ({ type: 'fence', id: fence.id }));
  
  const line = createSvgElement('line', {
    class: `fence-line ${selectedFenceId === fence.id ? 'selected' : ''}`,
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    stroke: selectedFenceId === fence.id ? '#36c2ff' : (fence.color || '#8d6e63'),
    'stroke-width': 6,
    'stroke-linecap': 'round',
    opacity: 0.8
  });
  
  line.addEventListener('pointerdown', (event) => {
    if (mode === 'select') {
      beginFenceDrag(event, fence.id);
    }
  });
  
  line.addEventListener('click', (event) => {
    if (mode === 'delete-wall' || mode === 'select') {
      event.stopPropagation();
      if (mode === 'delete-wall') {
        pushHistory();
        testMap.deleteFence(fence.id);
        clearSelection();
        refreshShadows();
        renderPlan();
      } else if (mode === 'select') {
        selectFence(fence.id);
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
          stroke: selectedFenceId === fence.id ? '#36c2ff' : '#5d4037',
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
          stroke: selectedFenceId === fence.id ? '#36c2ff' : '#212121',
          'stroke-width': 1.5
        }));
        group.appendChild(createSvgElement('circle', {
          cx, cy, r: 2,
          fill: selectedFenceId === fence.id ? '#36c2ff' : '#212121'
        }));
      }
    } else if (fence.subtype === 'wire_mesh') {
      line.setAttribute('stroke-dasharray', '5,5');
      line.setAttribute('stroke-width', 3);
      line.setAttribute('stroke', selectedFenceId === fence.id ? '#36c2ff' : '#78909c');
    } else if (fence.subtype === 'stone_masonry') {
      line.setAttribute('stroke-width', 8);
      line.setAttribute('stroke', selectedFenceId === fence.id ? '#36c2ff' : '#90a4ae');
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
          stroke: selectedFenceId === fence.id ? '#36c2ff' : '#4caf50',
          'stroke-width': 1.5
        }));
        group.appendChild(createSvgElement('line', {
          x1: cx - ux * 5 + nx * 4,
          y1: cy - uy * 5 - ny * 4,
          x2: cx + ux * 5 - nx * 4,
          y2: cy + uy * 5 + ny * 4,
          stroke: selectedFenceId === fence.id ? '#36c2ff' : '#4caf50',
          'stroke-width': 1.5
        }));
      }
    } else if (fence.subtype === 'glass_rail') {
      line.setAttribute('stroke-width', 6);
      line.setAttribute('stroke', selectedFenceId === fence.id ? '#36c2ff' : 'rgba(129, 212, 250, 0.6)');
      const step = 40;
      for (let d = 0; d <= len; d += step) {
        const cx = a.x + ux * d;
        const cy = a.y + uy * d;
        group.appendChild(createSvgElement('circle', {
          cx, cy, r: 3,
          fill: selectedFenceId === fence.id ? '#36c2ff' : '#b0bec5'
        }));
      }
      if (len % step > 10) {
        group.appendChild(createSvgElement('circle', {
          cx: b.x, cy: b.y, r: 3,
          fill: selectedFenceId === fence.id ? '#36c2ff' : '#b0bec5'
        }));
      }
    }
  }
  
  svg.appendChild(group);
}

function renderSelectedFenceHandles(fence) {
  if (fence.locked) return;
  const a = worldToSvg(fence.from[0], fence.from[1]);
  const b = worldToSvg(fence.to[0], fence.to[1]);
  
  const handleFrom = createSvgElement('circle', {
    class: 'fence-handle',
    cx: a.x,
    cy: a.y,
    r: 6,
    fill: '#ff9f1c',
    stroke: '#ffffff',
    'stroke-width': 1.5,
    cursor: 'pointer'
  });
  
  const handleTo = createSvgElement('circle', {
    class: 'fence-handle',
    cx: b.x,
    cy: b.y,
    r: 6,
    fill: '#ff9f1c',
    stroke: '#ffffff',
    'stroke-width': 1.5,
    cursor: 'pointer'
  });
  
  handleFrom.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    rememberPointer(event);
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    fenceHandleDragState = {
      fenceId: fence.id,
      handle: 'from',
      startWorldX: world.x,
      startWorldZ: world.z,
      historyPushed: false
    };
    svg.setPointerCapture(event.pointerId);
  });
  
  handleTo.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    rememberPointer(event);
    const point = svgPointFromEvent(event);
    const world = svgToWorld(point.x, point.y);
    fenceHandleDragState = {
      fenceId: fence.id,
      handle: 'to',
      startWorldX: world.x,
      startWorldZ: world.z,
      historyPushed: false
    };
    svg.setPointerCapture(event.pointerId);
  });
  
  svg.appendChild(handleFrom);
  svg.appendChild(handleTo);
}

function beginFenceDrag(event, fenceId) {
  if (event.button === 2) return;
  event.stopPropagation();
  rememberPointer(event);
  selectFence(fenceId);
  const fence = testMap.getFence(fenceId);
  if (!fence || fence.locked) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  fenceDragState = {
    fenceId,
    originalFrom: [...fence.from],
    originalTo: [...fence.to],
    startWorldX: world.x,
    startWorldZ: world.z,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function moveFenceBy(fenceId, dx, dz) {
  const fence = testMap.getFence(fenceId);
  if (!fence || fence.locked) return;
  
  let nextFromX = fenceDragState.originalFrom[0] + dx;
  let nextFromZ = fenceDragState.originalFrom[1] + dz;
  let nextToX = fenceDragState.originalTo[0] + dx;
  let nextToZ = fenceDragState.originalTo[1] + dz;
  
  if (snapEnabled && snapSize) {
    const origDx = fenceDragState.originalTo[0] - fenceDragState.originalFrom[0];
    const origDz = fenceDragState.originalTo[1] - fenceDragState.originalFrom[1];
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
  
  testMap.updateFence(fenceId, {
    from: [nextFromX, nextFromZ],
    to: [nextToX, nextToZ]
  }, false);
  syncFenceMovePreview(fenceId);
  
  updateEditor();
  renderPlan();
}

function finishFenceDrag() {
  if (!fenceDragState && !fenceHandleDragState) return;
  const fenceId = fenceDragState ? fenceDragState.fenceId : fenceHandleDragState.fenceId;
  fenceDragState = null;
  fenceHandleDragState = null;
  testMap.build();
  refreshShadows();
  selectFence(fenceId);
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
  const fenceEditor = document.getElementById('fence-editor');
  const itemEditor = document.getElementById('item-editor');
  const openingEditor = document.getElementById('opening-editor');
  const structureEditor = document.getElementById('structure-editor');
  const emptyState = document.getElementById('empty-state');
  const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : null;
  const wall = selectedWallId ? testMap.getWall(selectedWallId) : null;
  const fence = selectedFenceId ? testMap.getFence(selectedFenceId) : null;
  const item = selectedItemId ? testMap.getItem(selectedItemId) : null;
  const opening = selectedOpeningId ? testMap.getOpening(selectedOpeningId) : null;
  const roof = selectedRoofId ? testMap.getRoof?.(selectedRoofId) : null;
  const stairs = selectedStairsId ? testMap.getStairs?.(selectedStairsId) : null;
  const structure = roof || stairs;
  const structureType = roof ? 'roof' : (stairs ? 'stairs' : null);

  roomEditor.classList.toggle('hidden', !room);
  wallEditor.classList.toggle('hidden', !wall);
  if (fenceEditor) fenceEditor.classList.toggle('hidden', !fence);
  itemEditor.classList.toggle('hidden', !item);
  openingEditor.classList.toggle('hidden', !opening);
  structureEditor?.classList.toggle('hidden', !structure);
  emptyState.classList.toggle('hidden', !!room || !!wall || !!fence || !!item || !!opening || !!structure);

  document.getElementById('floor-color').value = room?.color || testMap.floorplan.floor.color || '#f4efe6';

  if (room) {
    document.getElementById('selected-room-name').textContent = room.name || '房间';
    document.getElementById('room-name').value = room.name || '';
    document.getElementById('room-width').value = Number(room.width.toFixed(2));
    document.getElementById('room-depth').value = Number(room.depth.toFixed(2));
    document.getElementById('room-locked').checked = !!room.locked;
    document.getElementById('btn-delete-room').disabled = !!room.locked;
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
  if (fence) {
    document.getElementById('selected-fence-name').textContent = fence.id;
    document.getElementById('fence-subtype').value = fence.subtype || 'picket_wood';
    const dx = fence.to[0] - fence.from[0];
    const dz = fence.to[1] - fence.from[1];
    const length = Math.hypot(dx, dz);
    document.getElementById('fence-length').value = Number(length.toFixed(2));
    const angleRad = Math.atan2(dz, dx);
    const angleDeg = Math.round(((angleRad * 180 / Math.PI) + 360) % 360);
    document.getElementById('fence-rotation').value = angleDeg;
    document.getElementById('fence-rotation-range').value = angleDeg;
    document.getElementById('fence-height').value = fence.height || 1.1;
    document.getElementById('fence-color').value = fence.color || '#8d6e63';
    document.getElementById('fence-locked').checked = !!fence.locked;
    document.getElementById('btn-delete-fence').disabled = !!fence.locked;
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

  if (structure) {
    document.getElementById('selected-structure-name').textContent = structureType === 'roof' ? '\u5c4b\u9876' : '\u697c\u68af';
    document.getElementById('structure-x').value = Number((structure.x || 0).toFixed(2));
    document.getElementById('structure-z').value = Number((structure.z || 0).toFixed(2));
    document.getElementById('structure-width').value = Number((structure.width || 1).toFixed(2));
    document.getElementById('structure-depth').value = Number((structure.depth || 1).toFixed(2));
    document.getElementById('structure-height').value = Number((structure.height || 1).toFixed(2));
    const rotationDegrees = Math.round(((structure.rotation || 0) * 180 / Math.PI + 360) % 360);
    document.getElementById('structure-rotation').value = rotationDegrees;
    document.getElementById('structure-rotation-range').value = rotationDegrees;
    const stepsField = document.getElementById('structure-steps').closest('label');
    stepsField.classList.toggle('hidden', structureType !== 'stairs');
    document.getElementById('structure-steps').value = structure.steps || 9;
    document.getElementById('structure-color').value = structure.color || (structureType === 'roof' ? '#b75b54' : '#d8c0a0');
    document.getElementById('structure-locked').checked = !!structure.locked;
    document.getElementById('btn-delete-structure').disabled = !!structure.locked;
 
    const subtypeSelect = document.getElementById('structure-subtype');
    if (subtypeSelect) {
      subtypeSelect.innerHTML = '';
      if (structureType === 'roof') {
        const options = [
          { value: 'gable', label: '双斜坡屋顶' },
          { value: 'shed', label: '单斜坡屋顶' },
          { value: 'arch', label: '拱形屋顶' },
          { value: 'dome', label: '穹型屋顶' },
          { value: 'trapezoid', label: '梯形屋顶' },
          { value: 'hip', label: '四角屋顶' },
          { value: 'flat', label: '平屋顶' }
        ];
        options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          subtypeSelect.appendChild(o);
        });
        subtypeSelect.value = structure.subtype || structure.type || 'gable';
      } else {
        const options = [
          { value: 'straight', label: '直跑楼梯' },
          { value: 'lshape', label: 'L形折返楼梯' },
          { value: 'ushape', label: 'U形折返楼梯' },
          { value: 'spiral', label: '旋转楼梯' },
          { value: 'curved', label: '弧形楼梯' },
          { value: 'floating', label: '悬浮楼梯' }
        ];
        options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          subtypeSelect.appendChild(o);
        });
        subtypeSelect.value = structure.subtype || 'straight';
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
    document.getElementById('opening-locked').checked = !!opening.locked;
    document.getElementById('btn-delete-opening').disabled = !!opening.locked;
  }

  renderDesignPanel(room, wall, item, structure, structureType, fence);
  revealRightPanelIfNeeded(room || wall || item || opening || structure || fence);
}

function renderDesignPanel(room, wall, item, structure = null, structureType = null, fence = null) {
  designSelectionPanel.innerHTML = '';
  const btnResetMaterial = document.getElementById('btn-reset-material');
  if (btnResetMaterial) {
    btnResetMaterial.disabled = !(room || wall || item || structure || fence);
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

  if (structure) {
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = structureType === 'roof' ? '\u5c4b\u9876\u989c\u8272 / \u6750\u8d28' : '\u697c\u68af\u989c\u8272 / \u6750\u8d28';
    designSelectionPanel.appendChild(title);
    designSelectionPanel.appendChild(createColorField('\u989c\u8272', structure.color || (structureType === 'roof' ? '#b75b54' : '#d8c0a0'), (color) => {
      pushHistory();
      updateStructure(structureType, structure.id, { color, material: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }));
    designSelectionPanel.appendChild(createApplyMaterialButton('\u5e94\u7528\u5f53\u524d\u6750\u8d28', () => applyMaterialToStructure(activeMaterialDescriptor)));
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

  if (fence) {
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = '栅栏颜色 / 材质';
    designSelectionPanel.appendChild(title);
    designSelectionPanel.appendChild(createColorField('颜色', fence.color || '#8d6e63', (color) => {
      pushHistory();
      testMap.updateFence(fence.id, { color: color, material: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }));
    designSelectionPanel.appendChild(createApplyMaterialButton('应用当前材质', () => applyMaterialToFence(activeMaterialDescriptor)));
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
  let changed = false;
  const rightPanel = document.getElementById('right-panel');
  if (rightPanel && rightPanel.classList.contains('collapsed')) {
    rightPanel.classList.remove('collapsed');
    const btnToggleRight = document.getElementById('btn-toggle-right');
    if (btnToggleRight) btnToggleRight.textContent = '›';
    changed = true;
  }
  const leftPanel = document.querySelector('.left-panel');
  if (leftPanel && leftPanel.classList.contains('collapsed')) {
    leftPanel.classList.remove('collapsed');
    const btnToggleLeft = document.getElementById('btn-toggle-left');
    if (btnToggleLeft) btnToggleLeft.textContent = '‹';
    changed = true;
  }
  if (changed) {
    setTimeout(() => {
      if (engine) engine.resize();
    }, 300);
  }
}

function getSelectedStructure() {
  if (selectedRoofId) return { type: 'roof', id: selectedRoofId, value: testMap.getRoof?.(selectedRoofId) };
  if (selectedStairsId) return { type: 'stairs', id: selectedStairsId, value: testMap.getStairs?.(selectedStairsId) };
  return null;
}

function normalizeRotationDegrees(degrees, useSnap = snapEnabled) {
  let value = Number(degrees) || 0;
  if (useSnap) value = Math.round(value / 90) * 90;
  return (value % 360 + 360) % 360;
}

function syncRotationInputs(inputId, rangeId, degrees) {
  const normalized = normalizeRotationDegrees(degrees);
  const input = document.getElementById(inputId);
  const range = document.getElementById(rangeId);
  if (input) input.value = normalized;
  if (range) range.value = normalized;
  return normalized;
}

function getStructureNode(type, id) {
  return type === 'roof' ? testMap.roofNodes?.get(id) : testMap.stairNodes?.get(id);
}

let structureRotationPreview = null;

function previewSelectedStructureRotation(degrees) {
  const selected = getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  const normalized = syncRotationInputs('structure-rotation', 'structure-rotation-range', degrees);
  const node = getStructureNode(selected.type, selected.id);
  const rotationRad = normalized * Math.PI / 180;
  if (!structureRotationPreview || structureRotationPreview.type !== selected.type || structureRotationPreview.id !== selected.id) {
    structureRotationPreview = { type: selected.type, id: selected.id, rotation: selected.value.rotation || 0 };
  }
  selected.value.rotation = rotationRad;
  if (node) node.rotation.y = rotationRad;
  if (currentView !== '3d') renderPlan();
}

function commitSelectedStructureRotation(degrees) {
  const selected = getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  const normalized = syncRotationInputs('structure-rotation', 'structure-rotation-range', degrees);
  if (structureRotationPreview && structureRotationPreview.type === selected.type && structureRotationPreview.id === selected.id) {
    selected.value.rotation = structureRotationPreview.rotation;
  }
  structureRotationPreview = null;
  pushHistory();
  updateStructure(selected.type, selected.id, { rotation: normalized * Math.PI / 180 });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function getRotatedWallEndpoints(wall, degrees) {
  const angleRad = normalizeRotationDegrees(degrees) * Math.PI / 180;
  const x1 = wall.from[0];
  const z1 = wall.from[1];
  const x2 = wall.to[0];
  const z2 = wall.to[1];
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const length = Math.hypot(x2 - x1, z2 - z1) || 1;
  const ux = Math.cos(angleRad);
  const uz = Math.sin(angleRad);
  return {
    from: [Number((midX - ux * length / 2).toFixed(3)), Number((midZ - uz * length / 2).toFixed(3))],
    to: [Number((midX + ux * length / 2).toFixed(3)), Number((midZ + uz * length / 2).toFixed(3))],
    angleRad
  };
}

function syncOpeningPreviewToWall(opening, wallLike) {
  const node = testMap.openingNodes?.get(opening.id);
  if (!node) return;
  const point = wallPointAt(wallLike, opening.t ?? 0.5);
  const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
  const localY = opening.type === 'door' ? height / 2 : (opening.sillHeight ?? 1.05) + height / 2;
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(opening.floorId || wallLike.floorId) : 0;
  const [x1, z1] = wallLike.from;
  const [x2, z2] = wallLike.to;
  node.position.set(point.x, floorY + localY, point.z);
  node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
}

function previewSelectedWallRotation(degrees) {
  if (!selectedWallId) return;
  const wall = testMap.getWall(selectedWallId);
  if (!wall) return;
  const normalized = syncRotationInputs('wall-rotation', 'wall-rotation-range', degrees);
  const preview = getRotatedWallEndpoints(wall, normalized);
  const node = testMap.wallNodes?.get(selectedWallId);
  if (node) {
    node.position.set(preview.from[0], 0, preview.from[1]);
    node.rotation.y = -preview.angleRad;
  }
  const wallLike = { ...wall, from: preview.from, to: preview.to };
  testMap.floorplan.openings.filter((opening) => opening.wallId === wall.id).forEach((opening) => syncOpeningPreviewToWall(opening, wallLike));
}

function previewSelectedFenceRotation(degrees) {
  if (!selectedFenceId) return;
  const fence = testMap.getFence(selectedFenceId);
  if (!fence || fence.locked) return;
  const normalized = syncRotationInputs('fence-rotation', 'fence-rotation-range', degrees);
  const preview = getRotatedWallEndpoints(fence, normalized);
  const node = testMap.fenceNodes?.get(selectedFenceId);
  if (node) {
    node.position.set((preview.from[0] + preview.to[0]) / 2, node.position.y, (preview.from[1] + preview.to[1]) / 2);
    node.rotation.y = -preview.angleRad;
  }
}
function updateSelectedStructure() {
  const selected = getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  pushHistory();
  const patch = {
    x: Number(document.getElementById('structure-x').value),
    z: Number(document.getElementById('structure-z').value),
    width: Number(document.getElementById('structure-width').value),
    depth: Number(document.getElementById('structure-depth').value),
    height: Number(document.getElementById('structure-height').value),
    rotation: normalizeRotationDegrees(document.getElementById('structure-rotation').value) * Math.PI / 180,
    color: document.getElementById('structure-color').value,
    material: document.getElementById('structure-color').value,
    subtype: document.getElementById('structure-subtype')?.value || (selected.type === 'roof' ? 'gable' : 'straight')
  };
  if (selected.type === 'roof') {
    patch.type = patch.subtype;
  }
  if (selected.type === 'stairs') patch.steps = Number(document.getElementById('structure-steps').value);
  updateStructure(selected.type, selected.id, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedStructureRotation(degrees) {
  const selected = getSelectedStructure();
  if (selected?.value?.locked) return;
  commitSelectedStructureRotation(degrees);
}

function deleteSelectedStructure() {
  const selected = getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  pushHistory();
  if (selected.type === 'roof') testMap.deleteRoof?.(selected.id);
  if (selected.type === 'stairs') testMap.deleteStairs?.(selected.id);
  clearSelection();
  refreshShadows();
}

function updateSelectedRoom() {
  if (!selectedRoomId) return;
  const room = testMap.getRoom(selectedRoomId);
  if (room?.locked) return;
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

function updateSelectedFenceSubtype() {
  if (!selectedFenceId) return;
  if (testMap.getFence(selectedFenceId)?.locked) return;
  pushHistory();
  testMap.updateFence(selectedFenceId, { subtype: document.getElementById('fence-subtype').value });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFenceLength() {
  if (!selectedFenceId) return;
  if (testMap.getFence(selectedFenceId)?.locked) return;
  const len = Number(document.getElementById('fence-length').value);
  if (len <= 0.05) return;
  pushHistory();
  
  const fence = testMap.getFence(selectedFenceId);
  if (fence) {
    const [x1, z1] = fence.from;
    const [x2, z2] = fence.to;
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const curLen = Math.hypot(dx, dz) || 1;
    const ux = dx / curLen;
    const uz = dz / curLen;
    
    const nextFromX = Number((midX - ux * len / 2).toFixed(3));
    const nextFromZ = Number((midZ - uz * len / 2).toFixed(3));
    const nextToX = Number((midX + ux * len / 2).toFixed(3));
    const nextToZ = Number((midZ + uz * len / 2).toFixed(3));
    
    testMap.updateFence(selectedFenceId, {
      from: [nextFromX, nextFromZ],
      to: [nextToX, nextToZ]
    });
  }
  
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFenceRotation(deg) {
  if (!selectedFenceId) return;
  const fence = testMap.getFence(selectedFenceId);
  if (!fence || fence.locked) return;
  const normalized = syncRotationInputs('fence-rotation', 'fence-rotation-range', deg);
  const preview = getRotatedWallEndpoints(fence, normalized);
  pushHistory();
  testMap.updateFence(selectedFenceId, {
    from: preview.from,
    to: preview.to
  });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFenceHeight() {
  if (!selectedFenceId) return;
  if (testMap.getFence(selectedFenceId)?.locked) return;
  pushHistory();
  testMap.updateFence(selectedFenceId, { height: Number(document.getElementById('fence-height').value) });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFenceColor() {
  if (!selectedFenceId) return;
  if (testMap.getFence(selectedFenceId)?.locked) return;
  pushHistory();
  const col = document.getElementById('fence-color').value;
  testMap.updateFence(selectedFenceId, { color: col, material: col });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function deleteSelectedFence() {
  if (!selectedFenceId) return;
  if (testMap.getFence(selectedFenceId)?.locked) return;
  pushHistory();
  testMap.deleteFence(selectedFenceId);
  clearSelection();
  refreshShadows();
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
  const normalized = syncRotationInputs('wall-rotation', 'wall-rotation-range', deg);
  const preview = getRotatedWallEndpoints(wall, normalized);
  pushHistory();
  testMap.updateWall(selectedWallId, {
    from: preview.from,
    to: preview.to
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
  const item = testMap.getItem(selectedItemId);
  if (!item) return;
  const definition = testMap.getFurnitureDefinition(item.type);
  pushHistory();
  const scale = Math.max(0.5, Math.min(4, Number(value) || 1));
  
  let patch = { scale };
  if (definition.placeType === 'ceiling') {
    patch.elevation = (testMap.floorplan.wallHeight || 2.8) * 24 - item.height * scale;
  }
  
  testMap.updateItem(selectedItemId, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedSize() {
  if (!selectedItemId) return;
  const item = testMap.getItem(selectedItemId);
  if (!item) return;
  const definition = testMap.getFurnitureDefinition(item.type);
  pushHistory();
  
  let elevation = Number(document.getElementById('item-elevation').value || 0) * 24;
  const nextHeight = Number(document.getElementById('item-height').value) * 24;
  const nextScale = Number(document.getElementById('item-scale').value || 1);
  
  if (definition.placeType === 'ceiling') {
    const curElev = Number(((item.elevation || 0) / 24).toFixed(2));
    const inputElev = Number(document.getElementById('item-elevation').value || 0);
    if (curElev === inputElev) {
      elevation = (testMap.floorplan.wallHeight || 2.8) * 24 - nextHeight * nextScale;
    }
  }

  testMap.updateItem(selectedItemId, {
    width: Number(document.getElementById('item-width').value) * 24,
    depth: Number(document.getElementById('item-depth').value) * 24,
    height: nextHeight,
    elevation: elevation
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
  if (testMap.getOpening(selectedOpeningId)?.locked && !('locked' in patch)) return;
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
    if (category.icon) option.setAttribute('data-icon', category.icon);
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
  // const applyFloorButton = document.createElement('button');
  // applyFloorButton.type = 'button';
  // applyFloorButton.textContent = '应用到地板';
  // applyFloorButton.addEventListener('click', () => applyMaterialToFloor(activeMaterialDescriptor));
  // header.appendChild(applyFloorButton);
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

function applyMaterialToStructure(material) {
  const selected = getSelectedStructure();
  if (!selected?.value || !material) return;
  pushHistory();
  updateStructure(selected.type, selected.id, { material, color: material.color || selected.value.color });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToFence(material) {
  if (!selectedFenceId || !material) return;
  pushHistory();
  const color = material.color || '#8d6e63';
  testMap.updateFence(selectedFenceId, { material: material.url || color, color: color });
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
      if (cat.icon) opt.setAttribute('data-icon', cat.icon);
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
      if (opening && !opening.locked && wall) {
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
      if (opening && !opening.locked && opening.type === 'window') {
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
      if (testMap.getOpening(selectedOpeningId)?.locked) return;
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
    if (selectedRoomId) {
      event.preventDefault();
      if (testMap.getRoom(selectedRoomId)?.locked) return;
      showCustomConfirm('提示', '确定要删除整个房间吗？房间内的家具都会移除').then((confirmed) => {
        if (confirmed) {
          pushHistory();
          testMap.deleteRoom(selectedRoomId);
          clearSelection();
          refreshShadows();
        }
      });
      return;
    }
    if (selectedRoofId) {
      event.preventDefault();
      if (testMap.getRoof?.(selectedRoofId)?.locked) return;
      pushHistory();
      testMap.deleteRoof(selectedRoofId);
      clearSelection();
      refreshShadows();
      return;
    }
    if (selectedStairsId) {
      event.preventDefault();
      if (testMap.getStairs?.(selectedStairsId)?.locked) return;
      pushHistory();
      testMap.deleteStairs(selectedStairsId);
      clearSelection();
      refreshShadows();
      return;
    }
    if (selectedFenceId) {
      event.preventDefault();
      if (testMap.getFence(selectedFenceId)?.locked) return;
      pushHistory();
      testMap.deleteFence(selectedFenceId);
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
    const button = document.querySelector(`.mode[data-mode="${targetMode}"]`);
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
    clearDrawWallPreview();
    document.querySelectorAll('.mode').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
    renderPlan();
  });
});

const floorFloatingGroup = document.getElementById('floor-floating-group');
if (floorFloatingGroup) {
  floorFloatingGroup.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest('.btn-floor-toggle-expanded');
    if (toggleBtn) {
      floorPanelCollapsed = false;
      syncFloorControls();
      return;
    }

    const foldBtn = event.target.closest('.btn-floor-fold');
    if (foldBtn) {
      floorPanelCollapsed = true;
      syncFloorControls();
      return;
    }

    const addBtn = event.target.closest('#btn-add-floor');
    if (addBtn) {
      showCustomConfirm('复制户型', '是否复制当前户型？').then((copyCurrentFloor) => {
        const sourceFloorId = testMap.floorplan.currentFloorId;
        pushHistory();
        testMap.addFloor(copyCurrentFloor ? { copyFromFloorId: sourceFloorId } : {});
        clearSelection();
        syncFloorControls();
        refreshShadows();
        renderPlan();
      });
      return;
    }

    const floorBtn = event.target.closest('[data-floor-id]');
    if (floorBtn) {
      const floorId = floorBtn.dataset.floorId;
      testMap.setCurrentFloor(floorId);
      clearSelection();
      syncFloorControls();
      refreshShadows();
      renderPlan();
    }
  });
}

stage.addEventListener('contextmenu', (event) => {
  const alreadyHandled = event.defaultPrevented;
  event.preventDefault();
  if (alreadyHandled) return;
  const target = currentView === '2d' ? get2DContextTargetFromElement(event.target) : null;
  if (target) {
    event.stopPropagation();
    showObjectContextMenu(target, event.clientX, event.clientY);
  }
});

stage.addEventListener('pointerdown', (event) => {
  if (currentView !== '2d' || event.pointerType === 'mouse' || event.button === 2) return;
  const target = get2DContextTargetFromElement(event.target);
  if (!target) return;
  const startX = event.clientX;
  const startY = event.clientY;
  cancelLongPress();
  longPressState = {
    pointerId: event.pointerId,
    startX,
    startY,
    timer: window.setTimeout(() => {
      longPressState = null;
      cancelObjectInteractions();
      showObjectContextMenu(target, startX, startY);
    }, 620)
  };
});

['copy', 'cut', 'paste', 'selectstart', 'dragstart'].forEach((eventName) => {
  stage.addEventListener(eventName, (event) => event.preventDefault());
});
document.addEventListener('pointermove', (event) => {
  if (!longPressState || longPressState.pointerId !== event.pointerId) return;
  if (Math.hypot(event.clientX - longPressState.startX, event.clientY - longPressState.startY) > 8) cancelLongPress();
});

document.addEventListener('pointerup', cancelLongPress);
document.addEventListener('pointercancel', cancelLongPress);
document.addEventListener('pointerdown', (event) => {
  if (!contextMenuElement || contextMenuElement.contains(event.target)) return;
  hideContextMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideContextMenu();
});
window.addEventListener('resize', hideContextMenu);
document.getElementById('item-grid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-item]');
  if (!button) return;
  const type = button.dataset.addItem;
  const definition = testMap.getFurnitureDefinition(type);
  const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : currentRooms()[0];
  const x = room ? room.x : 0;
  const z = room ? room.z : 0;
  pushHistory();
  let elevation = undefined;
  if (definition.placeType === 'ceiling') {
    elevation = (testMap.floorplan.wallHeight || 2.8) * 24 - (definition.defaultSize.height || 0);
  } else if (canPlaceOnTable({ x, z, floorId: testMap.floorplan.currentFloorId, width: definition.defaultSize.width, depth: definition.defaultSize.depth }, definition)) {
    const tableBelow = findTableBelow({ x, z, floorId: testMap.floorplan.currentFloorId, id: null });
    if (tableBelow) {
      const tableDef = testMap.getFurnitureDefinition(tableBelow.type);
      elevation = (tableBelow.elevation || 0) + (tableBelow.height || tableDef.defaultSize.height) * (tableBelow.scale || 1);
    } else {
      elevation = 0;
    }
  }
  const item = testMap.addItem({ 
    type, 
    ...definition.defaultSize, 
    x, 
    z, 
    elevation,
    roomId: room?.id, 
    floorId: testMap.floorplan.currentFloorId 
  });
  if (room) testMap.assignItemToRoom(item.id, room.id);
  refreshShadows();
  selectItem(item.id);
});

['room-width', 'room-depth', 'room-name'].forEach((id) => {
  document.getElementById(id).addEventListener('change', updateSelectedRoom);
});

['structure-x', 'structure-z', 'structure-width', 'structure-depth', 'structure-height', 'structure-steps', 'structure-color', 'structure-subtype'].forEach((id) => {
  document.getElementById(id)?.addEventListener('change', updateSelectedStructure);
});
document.getElementById('structure-rotation')?.addEventListener('change', (event) => {
  commitSelectedStructureRotation(event.target.value);
});
document.getElementById('structure-rotation-range')?.addEventListener('input', (event) => {
  previewSelectedStructureRotation(event.target.value);
});
document.getElementById('structure-rotation-range')?.addEventListener('change', (event) => {
  commitSelectedStructureRotation(event.target.value);
});
document.getElementById('structure-locked')?.addEventListener('change', (event) => {
  const selected = getSelectedStructure();
  if (!selected?.value) return;
  pushHistory();
  setContextTargetLocked({ type: selected.type, id: selected.id }, event.target.checked);
  refreshShadows();
  updateEditor();
  renderPlan();
});
document.getElementById('btn-delete-structure')?.addEventListener('click', deleteSelectedStructure);

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
  updateSelectedWallRotation(event.target.value);
});

document.getElementById('wall-rotation-range').addEventListener('input', (event) => {
  previewSelectedWallRotation(event.target.value);
});

document.getElementById('wall-rotation-range').addEventListener('change', (event) => {
  updateSelectedWallRotation(event.target.value);
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

document.getElementById('room-locked').addEventListener('change', (event) => {
  if (!selectedRoomId) return;
  pushHistory();
  setContextTargetLocked({ type: 'room', id: selectedRoomId }, event.target.checked);
  refreshShadows();
  updateEditor();
  renderPlan();
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

document.getElementById('opening-locked').addEventListener('change', (event) => {
  if (!selectedOpeningId) return;
  pushHistory();
  setContextTargetLocked({ type: 'opening', id: selectedOpeningId }, event.target.checked);
  refreshShadows();
  updateEditor();
  renderPlan();
});

document.getElementById('snap-enabled').addEventListener('change', (event) => {
  snapEnabled = event.target.checked;
  renderPlan();
  refresh3DGrid();
});

document.getElementById('snap-size').addEventListener('change', (event) => {
  snapSize = 1;
  event.target.value = '1';
  renderPlan();
  refresh3DGrid();
});

document.getElementById('fence-subtype').addEventListener('change', updateSelectedFenceSubtype);
document.getElementById('fence-length').addEventListener('change', updateSelectedFenceLength);

document.getElementById('fence-rotation').addEventListener('change', (event) => {
  updateSelectedFenceRotation(event.target.value);
});

document.getElementById('fence-rotation-range').addEventListener('input', (event) => {
  previewSelectedFenceRotation(event.target.value);
});

document.getElementById('fence-rotation-range').addEventListener('change', (event) => {
  updateSelectedFenceRotation(event.target.value);
});

document.getElementById('fence-height').addEventListener('change', updateSelectedFenceHeight);
document.getElementById('fence-color').addEventListener('change', updateSelectedFenceColor);
document.getElementById('fence-locked').addEventListener('change', (event) => {
  if (!selectedFenceId) return;
  pushHistory();
  setContextTargetLocked({ type: 'fence', id: selectedFenceId }, event.target.checked);
  refreshShadows();
  updateEditor();
  renderPlan();
});
document.getElementById('btn-delete-fence').addEventListener('click', deleteSelectedFence);

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
  if (testMap.getOpening(selectedOpeningId)?.locked) return;
  pushHistory();
  testMap.deleteOpening(selectedOpeningId);
  clearSelection();
  refreshShadows();
});

document.getElementById('btn-delete-room').addEventListener('click', () => {
  if (!selectedRoomId) return;
  if (testMap.getRoom(selectedRoomId)?.locked) return;
  showCustomConfirm('提示', '确定要删除整个房间吗？房间内的家具都会移除').then((confirmed) => {
    if (confirmed) {
      pushHistory();
      testMap.deleteRoom(selectedRoomId);
      clearSelection();
      refreshShadows();
    }
  });
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

document.getElementById('btn-reset-camera').addEventListener('click', () => {
  if (currentView === '3d') {
    resetCamera();
  } else {
    hasUserZoomedOrPanned = false;
    renderPlan();
  }
});
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
  viewPointers.clear();
  isPanning2D = false;
  panStart2D = null;
  prevTouchDist2D = 0;
  prevTouchCenter2D = null;
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
  syncFloorControls();
  hasUserZoomedOrPanned = false;
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
    await showCustomAlert('加载失败', '建筑文件加载失败，请确认它是 blueprint3d-babylon 建筑文件。');
  }
});

document.getElementById('btn-new').addEventListener('click', () => {
  pushHistory();
  testMap.loadJSON(BLUEPRINT3D_TEST_FLOORPLAN);
  syncFloorControls();
  hasUserZoomedOrPanned = false;
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
  setTimeout(() => {
    if (engine) engine.resize();
  }, 300);
});

const btnToggleLeft = document.getElementById('btn-toggle-left');
const leftPanel = document.querySelector('.left-panel');

if (btnToggleLeft && leftPanel) {
  btnToggleLeft.addEventListener('click', (event) => {
    event.stopPropagation();
    const isCollapsed = leftPanel.classList.toggle('collapsed');
    btnToggleLeft.textContent = isCollapsed ? '›' : '‹';
    setTimeout(() => {
      if (engine) engine.resize();
    }, 300);
  });
}


const TOOL_GROUP_STATE_KEY = 'blueprint3d-tool-groups';

function readToolGroupState() {
  try {
    return JSON.parse(localStorage.getItem(TOOL_GROUP_STATE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function writeToolGroupState(state) {
  try {
    localStorage.setItem(TOOL_GROUP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore storage errors; the UI still works for the current session.
  }
}

function setToolGroupExpanded(toggle, expanded) {
  const targetId = toggle.getAttribute('aria-controls');
  const target = targetId ? document.getElementById(targetId) : null;
  toggle.setAttribute('aria-expanded', String(expanded));
  target?.classList.toggle('hidden', !expanded);
}

function initToolGroupToggles() {
  const savedState = readToolGroupState();
  document.querySelectorAll('.tool-group-toggle').forEach((toggle) => {
    const group = toggle.closest('.building-tool-group')?.dataset.toolGroup || toggle.getAttribute('aria-controls');
    const expanded = savedState[group] !== false;
    setToolGroupExpanded(toggle, expanded);
    toggle.addEventListener('click', () => {
      const nextExpanded = toggle.getAttribute('aria-expanded') === 'false';
      setToolGroupExpanded(toggle, nextExpanded);
      savedState[group] = nextExpanded;
      writeToolGroupState(savedState);
    });
  });
}

initToolGroupToggles();

// ==========================================
// 自定义弹窗系统 (已去除磨砂玻璃)
// ==========================================

function showCustomConfirm(title, message = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = '提示';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">${finalMessage}</div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel">取消</button>
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-confirm">确认</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      resolve(value);
    };

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#custom-modal-confirm').addEventListener('click', () => cleanup(true));
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(false);
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        cleanup(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

function showCustomAlert(title, message = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    
    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = '提示';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">${finalMessage}</div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-ok">确定</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');
    
    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        backdrop.remove();
      }, 200);
      resolve();
    };

    backdrop.querySelector('#custom-modal-ok').addEventListener('click', cleanup);
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup();
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        cleanup();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

// ==========================================
// 自定义下拉选择器组件
// ==========================================

function createCustomDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return null;

  // 隐藏原生的 select 标签
  select.style.display = 'none';

  // 创建自定义下拉框的外层容器
  const container = document.createElement('div');
  container.className = 'custom-dropdown';
  container.id = `${selectId}-custom-container`;
  
  // 创建触发按钮 Trigger
  const trigger = document.createElement('div');
  trigger.className = 'custom-dropdown-trigger';
  
  trigger.innerHTML = `
    <span class="custom-dropdown-text"></span>
    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  `;
  
  // 创建选项浮层 Menu
  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';
  
  container.appendChild(trigger);
  container.appendChild(menu);
  
  // 插入到 DOM 中，紧随在原生 select 后面
  select.parentNode.insertBefore(container, select.nextSibling);

  // 更新触发器文本和图标
  function updateTriggerDisplay(selectedOption) {
    if (!selectedOption) return;
    const iconContent = selectedOption.getAttribute('data-icon') || '';
    trigger.querySelector('.custom-dropdown-text').innerHTML = `
      ${iconContent ? `<svg class="custom-dropdown-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>` : ''}
      <span>${selectedOption.textContent}</span>
    `;
  }

  // 渲染菜单选项列表
  function syncOptions() {
    menu.innerHTML = '';
    const options = Array.from(select.options);
    
    if (options.length === 0) {
      trigger.querySelector('.custom-dropdown-text').textContent = '无选项';
      return;
    }

    // 选中值
    const selectedOption = select.options[select.selectedIndex] || options[0];
    updateTriggerDisplay(selectedOption);

    options.forEach((opt) => {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (opt.value === select.value) {
        item.classList.add('selected');
      }
      
      const iconContent = opt.getAttribute('data-icon') || '';
      item.innerHTML = `
        ${iconContent ? `<svg class="custom-dropdown-item-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconContent}</svg>` : ''}
        <span class="custom-dropdown-item-text">${opt.textContent}</span>
      `;
      item.dataset.value = opt.value;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 设值并触发 change 事件
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
        
        // 更新 UI
        updateTriggerDisplay(opt);
        Array.from(menu.children).forEach(child => child.classList.remove('selected'));
        item.classList.add('selected');
        
        closeMenu();
      });
      
      menu.appendChild(item);
    });
  }

  function openMenu() {
    container.classList.add('active');
    document.addEventListener('click', handleOutsideClick);
  }

  function closeMenu() {
    container.classList.remove('active');
    document.removeEventListener('click', handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (!container.contains(e.target)) {
      closeMenu();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (container.classList.contains('active')) {
      closeMenu();
    } else {
      // 关闭页面上其他已激活的下拉框
      document.querySelectorAll('.custom-dropdown.active').forEach(dropdown => {
        if (dropdown !== container) {
          dropdown.classList.remove('active');
        }
      });
      openMenu();
    }
  });

  // 1. 监听原生 select 选项的动态变化 (通过 MutationObserver 自动更新)
  const observer = new MutationObserver(() => {
    syncOptions();
  });
  observer.observe(select, { childList: true, subtree: true });

  // 2. 监听原生 select 值的变更 (防范代码层面的修改，确保数据回流更新)
  select.addEventListener('change', () => {
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt) {
      updateTriggerDisplay(selectedOpt);
      Array.from(menu.children).forEach(child => {
        if (child.dataset.value === select.value) {
          child.classList.add('selected');
        } else {
          child.classList.remove('selected');
        }
      });
    }
  });

  // 初始化首次同步
  syncOptions();

  return {
    destroy() {
      observer.disconnect();
      container.remove();
      select.style.display = '';
    }
  };
}




