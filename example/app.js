import './styles.css';
import { ensure3DGridControls, ensureStructureEditor, updateEditor, initUiEventListeners } from './js/editorUi.js';
import { Store, showToast, formatTimestamp } from './js/Store.js';
import { EntityManager } from './js/EntityManager.js';
import { Viewer3D } from './js/Viewer3D.js';
import * as BABYLON from '@babylonjs/core';
const furnitureImages = import.meta.glob('../src/furniture/image/*.png', { eager: true });
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
  create3MFFileName,
  getRoomVertices,
  pointInRoom,
  isSymmetricShape
} from '../src/index.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INCHES_PER_UNIT = 39.37;
const view = { width: 720, height: 520, pad: 42, minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 };
// groundPlane 已移至 Viewer3D

let mode = 'select';

function isAddRoomMode(value = mode) {
  return value === 'add-room' || value.startsWith('add-room-');
}

function roomShapeFromMode(value = mode) {
  return value === 'add-room' ? 'square' : value.replace('add-room-', '') || 'square';
}

function getOpeningModeInfo(value = mode) {
  const match = /^add-(door|window)(?:-(.+))?$/.exec(value);
  return match ? { type: match[1], shape: match[2] || 'square' } : null;
}

function isAddOpeningMode(value = mode) {
  return !!getOpeningModeInfo(value);
}

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
// show3DGrid / grid3DNodes 已移至 viewer3d 实例
let active3DEditTarget = null;
const editHandleNodes = [];
let editHandleDragState = null;
let snapSize = 1;
let activeMaterialDescriptor = null;
let materialLibrary = [...DEFAULT_MATERIAL_PACKS];
const activePointers = new Map();
let hasUserZoomedOrPanned = false;
const viewPointers = new Map();
let isPanning2D = false;
let panStart2D = null;
let prevTouchDist2D = 0;
let prevTouchCenter2D = null;
let roomCounter = 1;
// 撤销/重做栈已迁移到 Store.js 管理
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

// ========== 3D 渲染引擎（Viewer3D 封装） ==========
const viewer3d = new Viewer3D(canvas);
const { engine, scene, camera, shadowGenerator } = viewer3d;

// 3D 轴/手柄在相机移动时动态调节 scaling，保持在屏幕上的物理大小固定，使缩放太小时也能轻松选中
scene.onBeforeRenderObservable.add(() => {
  if (currentView !== '3d' || editHandleNodes.length === 0) return;
  const cameraPosition = camera.position;
  editHandleNodes.forEach((node) => {
    if (node && !node.isDisposed()) {
      const distance = BABYLON.Vector3.Distance(cameraPosition, node.position);
      // 距离乘以常数因子，并且设置最小值防止极端情况穿模，默认绝对大小为 1
      const factor = Math.max(0.1, distance * 0.08);
      node.scaling.set(factor, factor, factor);
    }
  });
});

let testMap = new Blueprint3DTestMap(scene);

// 初始化物体管理器 EntityManager
let entityManager = new EntityManager({
  testMap,
  getSnapEnabled: () => snapEnabled,
  getSnapSize: () => snapSize,
  inchesToWorld: (val) => inchesToWorld(val),
  getMode: () => mode,
  getWalls: () => currentWalls(),
  getRooms: () => currentRooms(),
  pushHistory: () => pushHistory(),
  refreshShadows: () => refreshShadows(),
  updateEditor: () => updateEditor(),
  renderPlan: () => renderPlan(),
  clear3DEditHandles: () => clear3DEditHandles(),
  getSelectedItemId: () => selectedItemId,
  setSelectedItemId: (val) => { selectedItemId = val; },
  onSelectionChanged: (type, id) => {
    if (type === 'item') {
      selectedRoomId = null;
      selectedWallId = null;
      selectedOpeningId = null;
      selectedRoofId = null;
      selectedStairsId = null;
      selectedFenceId = null;
      testMap.setSelectedWall(null);
      testMap.setSelectedFence(null);
    }
  },
  svgPointFromEvent: (event) => svgPointFromEvent(event),
  svgToWorld: (x, y) => svgToWorld(x, y),
  rememberPointer: (event) => rememberPointer(event),
  setPointerCapture: (pointerId) => svg.setPointerCapture(pointerId),
  activePointers: activePointers,
  pointerDistance: (a, b) => pointerDistance(a, b),
  pointerAngle: (a, b) => pointerAngle(a, b),
  canPlaceOnTable: (item, def) => canPlaceOnTable(item, def),
  findTableBelow: (item) => findTableBelow(item),
  findNearestSeat: (item) => findNearestSeat(item)
});

// ==========================================
// 初始化数据中心 Store
// ==========================================
const store = new Store({
  getSnapshot: () => testMap.exportJSON(),
  applySnapshot: (data) => {
    testMap.loadJSON(data);
    syncFloorControls();
    selectedRoomId = selectedRoomId && testMap.getRoom(selectedRoomId) ? selectedRoomId : null;
    selectedWallId = selectedWallId && testMap.getWall(selectedWallId) ? selectedWallId : null;
    selectedItemId = selectedItemId && testMap.getItem(selectedItemId) ? selectedItemId : null;
    selectedOpeningId = selectedOpeningId && testMap.getOpening(selectedOpeningId) ? selectedOpeningId : null;
    selectedRoofId = selectedRoofId && testMap.getRoof?.(selectedRoofId) ? selectedRoofId : null;
    selectedStairsId = selectedStairsId && testMap.getStairs?.(selectedStairsId) ? selectedStairsId : null;
    selectedFenceId = selectedFenceId && testMap.getFence?.(selectedFenceId) ? selectedFenceId : null;
    testMap.setSelectedItem(selectedItemId);
    testMap.setSelectedWall(selectedWallId);
    refreshShadows();
    updateEditor();
    renderPlan();
  },
});

// 监听历史栈变化，同步撤销/重做按钮状态
store.on('historyChanged', updateHistoryButtons);

// 监听自动保存完成，显示 toast 提示
store.on('autoSaved', () => {
  showToast('✓ 已自动保存');
});

// 监听保存失败
store.on('saveError', () => {
  showToast('⚠ 自动保存失败，localStorage 空间可能不足');
});

// 启动 10 分钟自动保存
store.startAutoSave(() => ({
  materialLibrary: materialLibrary.filter((m) => !DEFAULT_MATERIAL_PACKS.some((d) => d.id === m.id)),
  uiState: {
    currentFloorId: testMap.floorplan.currentFloorId,
    currentView,
  },
}));

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
const snapToggleBtn = document.getElementById('btn-snap-toggle');
if (snapToggleBtn) {
  snapToggleBtn.classList.toggle('deactivated', !snapEnabled);
}

// 启动时检查是否有本地保存的数据，直接恢复（不再弹出确认框）
(function autoRestoreLocalSave() {
  if (store.hasLocalSave()) {
    const saved = store.loadFromLocal();
    if (saved.buildingData) {
      testMap.loadJSON(saved.buildingData);
      syncFloorControls();
      hasUserZoomedOrPanned = false;
      refreshShadows();
      updateEditor();
      renderPlan();
      showToast('已自动恢复本地数据');
    }
    if (saved.materialLibrary && saved.materialLibrary.length) {
      saved.materialLibrary.forEach((m) => {
        if (!materialLibrary.some((existing) => existing.id === m.id)) {
          materialLibrary.push(m);
        }
      });
    }
  }
})();

viewer3d.startRenderLoop();

// ==========================================
// 历史管理代理函数（委托给 Store）
// ==========================================

function pushHistory() {
  store.pushHistory();
}

function undo() {
  store.undo();
}

function redo() {
  store.redo();
}

function updateHistoryButtons() {
  undoButton.disabled = !store.canUndo;
  redoButton.disabled = !store.canRedo;
}

// getMeshFloorId 已移至 Viewer3D，此处保留代理函数供局部引用
function getMeshFloorId(mesh) {
  return viewer3d.getMeshFloorId(mesh);
}

function refreshShadows() {
  viewer3d.refreshShadowCasters(
    () => testMap.getShadowCasters(),
    testMap.floorplan.currentFloorId
  );
  refresh3DGrid();
}

function resetCamera() {
  viewer3d.resetCamera();
}

function clear3DGrid() {
  viewer3d.clear3DGrid();
}

function refresh3DGrid() {
  viewer3d.refresh3DGrid({
    currentView,
    snapEnabled,
    snapSize,
    walls: currentWalls(),
    rooms: currentRooms(),
    roofs: currentRoofs(),
    stairs: currentStairs(),
    items: currentItems(),
    currentFloorId: testMap.floorplan.currentFloorId,
    floorElevation: testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0,
    inchesToWorld,
    hasTestMap: !!testMap
  });
}

function resetCurrentMaterial() {
  if (selectedItemId) {
    if (isTargetLocked({ type: 'item', id: selectedItemId })) {
      showToast('该物体已锁定');
      return;
    }
    entityManager.resetItemMaterial(selectedItemId);
  } else if (selectedWallId) {
    const wall = testMap.getWall(selectedWallId);
    if (wall && wall.locked) {
      showToast('该物体已锁定');
      return;
    }
    pushHistory();
    if (wall) {
      testMap.updateWall(selectedWallId, { material: '#f9fbff', color: '#f9fbff' });
      refreshShadows();
      updateEditor();
      renderPlan();
    }
  } else if (selectedRoomId) {
    if (isTargetLocked({ type: 'room', id: selectedRoomId })) {
      showToast('该物体已锁定');
      return;
    }
    pushHistory();
    const defaultFloorMaterial = DEFAULT_MATERIAL_PACKS.find(p => p.id === 'wood-light-fine');
    testMap.setRoomFloorMaterial(selectedRoomId, defaultFloorMaterial);
    refreshShadows();
    updateEditor();
    renderPlan();
  } else if (selectedFenceId) {
    if (isTargetLocked({ type: 'fence', id: selectedFenceId })) {
      showToast('该物体已锁定');
      return;
    }
    pushHistory();
    testMap.updateFence(selectedFenceId, { material: '#8d6e63', color: '#8d6e63' });
    refreshShadows();
    updateEditor();
    renderPlan();
  } else if (selectedOpeningId) {
    if (isTargetLocked({ type: 'opening', id: selectedOpeningId })) {
      showToast('该物体已锁定');
      return;
    }
    pushHistory();
    testMap.resetOpeningMaterial(selectedOpeningId);
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
  return Number(value || 0) / INCHES_PER_UNIT;
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
    door: `<svg ${attrs}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M15 6 L10.5 4.5 A2 2 0 0 0 9 6.5 L9 17.5 A2 2 0 0 0 10.5 19.5 L15 18 Z"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>`,
    edit: `<svg ${attrs}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    droplet: `<svg ${attrs}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`,
    flip: `<svg ${attrs}><path d="M12 2v20 M9 7v10H3z M15 7v10H21z"/></svg>`
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
    if (mode === 'view') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const target = getTarget(event);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    showMenu(target, event.clientX, event.clientY);
  });
  element.addEventListener('pointerdown', (event) => {
    if (mode === 'view') return;
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

function getSelectedTarget() {
  if (selectedItemId) return { type: 'item', id: selectedItemId };
  if (selectedOpeningId) return { type: 'opening', id: selectedOpeningId };
  if (selectedRoofId) return { type: 'roof', id: selectedRoofId };
  if (selectedStairsId) return { type: 'stairs', id: selectedStairsId };
  if (selectedRoomId) return { type: 'room', id: selectedRoomId };
  if (selectedFenceId) return { type: 'fence', id: selectedFenceId };
  return null;
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
  const isMirrorable = ['item', 'roof', 'stairs', 'opening'].includes(target.type);
  const isSwitchable = isSwitchableTarget(target);
  const isLighting = isLightingTarget(target);
  const isLocked = isTargetLocked(target);
  
  // 检查是否是具有水体的容器家具 (浴缸、厨房水槽、洗手台) 及其放水状态
  let isWaterContainer = false;
  let isWaterOn = true;
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (item && ['bathtub', 'sink_kitchen', 'sink_bathroom'].includes(item.type)) {
      isWaterContainer = true;
      isWaterOn = item.waterEnabled !== false;
    }
  }

  // 检查是否是马桶 (toilet) 及其开盖状态
  let isToilet = false;
  let isLidOpen = false;
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (item && item.type === 'toilet') {
      isToilet = true;
      isLidOpen = item.lidOpen === true;
    }
  }
  
  showIconMenu(clientX, clientY, [
    { icon: 'copy', title: '\u590d\u5236', onClick: () => copyContextTarget(target) },
    isRotatable && { icon: 'rotate', title: '\u65cb\u8f6c', disabled: isLocked, onClick: () => rotateContextTarget(target) },
    isMirrorable && { icon: 'flip', title: '镜像', disabled: isLocked, onClick: () => mirrorContextTarget(target) },
    isWaterContainer && {
      icon: 'droplet',
      title: isWaterOn ? '排水' : '放水',
      disabled: isLocked,
      onClick: () => entityManager.toggleItemWater(target.id)
    },
    isToilet && {
      icon: 'door',
      title: isLidOpen ? '合盖' : '开盖',
      disabled: isLocked,
      onClick: () => entityManager.toggleItemLid(target.id)
    },
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
  if (target.type === 'item') {
    entityManager.toggleItemLock(target.id);
    return;
  }
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
  if (target.type === 'item') {
    entityManager.toggleItemPower(target.id);
    return;
  }
  pushHistory();
  if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    if (!opening) return;
    testMap.updateOpening(target.id, { isOpen: !opening.isOpen });
    if (selectedOpeningId === target.id) {
      updateEditor();
    }
  }
  refreshShadows();
  renderPlan();
}

function rotateContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  if (isTargetLocked(target)) return;
  if (target.type === 'item') {
    entityManager.rotateItem(target.id);
    return;
  }
  pushHistory();
  if (target.type === 'roof' || target.type === 'stairs') {
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

function mirrorContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  if (isTargetLocked(target)) return;
  pushHistory();
  if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (item) {
      testMap.updateItem(target.id, { mirrored: !item.mirrored });
    }
  } else if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    if (opening) {
      testMap.updateOpening(target.id, { isFlippedLR: !opening.isFlippedLR });
    }
  } else if (target.type === 'roof') {
    const roof = testMap.getRoof?.(target.id);
    if (roof) {
      testMap.updateRoof?.(target.id, { mirrored: !roof.mirrored });
    }
  } else if (target.type === 'stairs') {
    const stairs = testMap.getStairs?.(target.id);
    if (stairs) {
      testMap.updateStairs?.(target.id, { mirrored: !stairs.mirrored });
    }
  }
  refreshShadows();
  updateEditor();
  renderPlan();
}

function copyContextTarget(target) {
  if (!isAllowedContextTarget(target)) return;
  if (target.type === 'item') {
    entityManager.copyItem(target.id);
    return;
  }
  pushHistory();
  let nextSelection = null;
  if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    const sourceWall = opening ? testMap.getWall(opening.wallId) : null;
    if (!opening || !sourceWall) return;
    const sourcePoint = wallPointAt(sourceWall, opening.t ?? 0.5);
    const targetWall = findMatchingCurrentFloorWall(sourceWall, sourcePoint);
    if (!targetWall) return;
    const nextT = Math.min(0.92, getWallProjectionT(targetWall, sourcePoint) + 0.08);
    const next = testMap.addOpening(targetWall.id, opening.type, nextT, opening.shape);
    if (next) {
      testMap.updateOpening(next.id, {
        width: opening.width,
        height: opening.height,
        sillHeight: opening.sillHeight,
        isOpen: opening.isOpen,
        isFlippedLR: opening.isFlippedLR,
        isFlippedIO: opening.isFlippedIO,
        panelHidden: opening.panelHidden,
        glassHidden: opening.glassHidden,
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
  if (target.type === 'item') {
    entityManager.deleteItem(target.id);
    return;
  }
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
  if (!target?.id) return;
  const sorted = [...testMap.floorplan.floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
  const index = sorted.findIndex((floor) => floor.id === target.id);
  if (index < 0) return;
  showIconMenu(clientX, clientY, [
    { icon: 'edit', title: '\u547d\u540d', onClick: () => renameCurrentFloor(target.id) },
    { icon: 'up', title: '\u4e0a\u79fb', disabled: index === sorted.length - 1, onClick: () => moveFloorAction(target.id, 'up') },
    { icon: 'down', title: '\u4e0b\u79fb', disabled: index <= 0, onClick: () => moveFloorAction(target.id, 'down') },
    { icon: 'trash', title: '\u5220\u9664', disabled: testMap.floorplan.floors.length <= 1, onClick: () => deleteFloorAction(target.id) }
  ]);
}

function moveFloorAction(floorId, direction) {
  pushHistory();
  if (testMap.moveFloor?.(floorId, direction)) {
    syncFloorControls();
    refreshShadows();
    renderPlan();
  }
}

function deleteFloorAction(floorId) {
  if (testMap.floorplan.floors.length <= 1) return;
  pushHistory();
  if (testMap.deleteFloor?.(floorId)) {
    clearSelection();
    syncFloorControls();
    refreshShadows();
    renderPlan();
  }
}

async function renameCurrentFloor(floorId) {
  const floor = testMap.floorplan.floors.find((f) => f.id === floorId);
  if (!floor) return;
  const currentName = floor.name || `${Number(floor.level || 0) + 1}F`;
  const newName = await showCustomPrompt('楼层命名', '请输入新的楼层名称：', currentName);
  if (newName !== null) {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== currentName) {
      pushHistory();
      if (testMap.renameFloor?.(floorId, trimmed)) {
        syncFloorControls();
        refreshShadows();
        renderPlan();
      }
    }
  }
}

function cancelObjectInteractions() {
  entityManager.dragState = null;
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



function formatFloorDisplayName(name) {
  if (!name) return '';
  const hasChinese = /[\u4e00-\u9fa5]/.test(name);
  if (hasChinese) {
    const match = name.match(/[\u4e00-\u9fa5]/);
    return match ? match[0] : name.slice(0, 2);
  }
  return name.slice(0, 2);
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
    btn.textContent = formatFloorDisplayName(floorName);
    btn.title = `切换到 ${floorName}`;
    btn.setAttribute('aria-label', `切换到 ${floorName}`);

    if (floor.id === testMap.floorplan.currentFloorId) {
      btn.classList.add('active');
    }
    attachContextMenuTrigger(btn, () => ({ type: 'floor', id: floor.id }), showFloorContextMenu);

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
    corners.push(...getRoomVertices(room));
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
  const points = getRoomVertices(room).map((point) => worldToSvg(point.x, point.z));
  const polygon = createSvgElement('polygon', {
    class: `room-rect ${selectedRoomId === room.id ? 'selected' : ''}`,
    points: points.map((point) => `${point.x},${point.y}`).join(' '),
    'data-room-id': room.id
  });
  attachContextMenuTrigger(polygon, () => ({ type: 'room', id: room.id }));
  polygon.addEventListener('click', (event) => {
    if (mode !== 'select') return;
    event.stopPropagation();
    selectRoom(room.id);
  });
  svg.appendChild(polygon);

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
      x: handle.x - 8,
      y: handle.y - 8,
      width: 16,
      height: 16,
      rx: 4,
      'data-room-handle': handle.side
    });
    node.addEventListener('pointerdown', (event) => beginRoomResize(event, room.id, handle.side));
    svg.appendChild(node);
  });
}
function renderRoomInteraction(room) {
  if (mode !== 'select') return;
  const points = getRoomVertices(room).map((point) => worldToSvg(point.x, point.z));
  const polygon = createSvgElement('polygon', {
    class: 'room-hit-rect',
    points: points.map((point) => `${point.x},${point.y}`).join(' '),
    'data-room-hit-id': room.id,
    fill: 'rgba(54, 194, 255, 0.001)'
  });
  attachContextMenuTrigger(polygon, () => ({ type: 'room', id: room.id }));
  polygon.addEventListener('pointerdown', (event) => beginRoomDrag(event, room.id));
  polygon.addEventListener('click', (event) => {
    if (mode !== 'select') return;
    event.stopPropagation();
    selectRoom(room.id);
  });
  svg.appendChild(polygon);
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
      x: handle.x - 8,
      y: handle.y - 8,
      width: 16,
      height: 16,
      rx: 4,
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
    if (mode === 'delete-wall' || isAddOpeningMode() || mode === 'select') {
      event.stopPropagation();
      const point = svgPointFromEvent(event);
      const world = svgToWorld(point.x, point.y);
      if (mode === 'delete-wall') {
        pushHistory();
        testMap.deleteWall(wall.id);
        clearSelection();
        refreshShadows();
        renderPlan();
      } else if (isAddOpeningMode()) {
        pushHistory();
        const openingMode = getOpeningModeInfo();
        const opening = testMap.addOpening(wall.id, openingMode.type, getWallProjectionT(wall, world), openingMode.shape);
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
    class: `stairs-symbol ${selectedStairsId === stairs.id ? 'selected' : ''}`,
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
  group.addEventListener('pointerdown', (event) => entityManager.beginItemDrag(event, item.id));
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

function pointerDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointerAngle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
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
    
    const halfW = ((other.width || otherDef.defaultSize.width) * (other.scale || 1)) / (INCHES_PER_UNIT * 2);
    const halfD = ((other.depth || otherDef.defaultSize.depth) * (other.scale || 1)) / (INCHES_PER_UNIT * 2);
    
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
  entityManager.moveItemTo(itemId, x, z);
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
  // 限制视口世界坐标跨度在 0.05m 到 300m 之间
  if (nextSpanX < 0.05 || nextSpanX > 300) return;

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

  // 鼠标中键平移，或在查看模式下鼠标左键平移，或在查看模式下触摸屏单指滑动平移
  const isViewModePan = mode === 'view' && (
    (event.pointerType === 'mouse' && event.button === 0) ||
    (event.pointerType === 'touch' && viewPointers.size === 1)
  );

  if ((event.pointerType === 'mouse' && event.button === 1) || isViewModePan) {
    isPanning2D = true;
    panStart2D = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
    hasUserZoomedOrPanned = true;
  }

  // 双指手势
  if (viewPointers.size === 2) {
    // 如果有单指平移状态，取消之，转入双指手势
    isPanning2D = false;
    panStart2D = null;

    // 取消其他物体的拖动和编辑状态，避免冲突
    entityManager.dragState = null;
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
      if (nextSpanX >= 0.05 && nextSpanX <= 300) {
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
  if (entityManager.itemGestureState) {
    entityManager.moveItemGesture();
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
  if (entityManager.dragState) {
    entityManager.handleItemDrag(event);
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
  if (entityManager.itemGestureState && activePointers.size < 2) entityManager.itemGestureState = null;
  entityManager.dragState = null;
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
  if (entityManager.itemGestureState && activePointers.size < 2) entityManager.itemGestureState = null;
  entityManager.dragState = null;
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
  } else if (isAddRoomMode()) {
    pushHistory();
    const room = testMap.addRoom({ x: snapped[0], z: snapped[1], shape: roomShapeFromMode(), name: `\u65b0\u623f\u95f4 ${roomCounter++}` });
    refreshShadows();
    selectRoom(room.id);
    switchToSelectMode();
  } else if (mode.startsWith('add-roof')) {
    pushHistory();
    const subtype = mode.replace('add-roof-', '') || 'gable';
    const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : testMap.getRoomAt(snapped[0], snapped[1]);
    const wallThickness = testMap.floorplan.wallThickness || 0.15;
    const roof = testMap.addRoof({
      x: room?.x ?? snapped[0],
      z: room?.z ?? snapped[1],
      width: room ? (room.width + wallThickness) : 6,
      depth: room ? (room.depth + wallThickness) : 6,
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
  const id = findMetadataFromNode(node, 'blueprintRoofId');
  if (id) {
    const roof = testMap.getRoof?.(id);
    if (roof) {
      const floor = testMap.floorplan.floors.find(f => f.id === roof.floorId);
      if (floor && floor.hideRoof) {
        return null;
      }
    }
  }
  return id;
}

function findStairsIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintStairsId');
}

function findFenceIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintFenceId');
}

function groundPointFromPointer() {
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0;
  return viewer3d.groundPointFromPointer(floorY);
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
    height: type === 'stairs' && testMap.getStairsAutoHeight ? testMap.getStairsAutoHeight(target) : Number(target.height || 0),
    floorId: target.floorId || testMap.floorplan.currentFloorId
  };
}

function get3DEditHandleY(type, bounds) {
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(bounds.floorId) : 0;
  if (type === 'wall') return floorY + 1.2;
  
  if (type === 'fence') {
    const fenceOffset = testMap.getFenceElevationOffset ? testMap.getFenceElevationOffset(bounds.target) : 0;
    return floorY + fenceOffset + (bounds.height || 1.1) + 0.18;
  }
  
  if (type === 'roof') {
    const floor = testMap.floorplan.floors.find(f => f.id === bounds.floorId);
    const roofWallHeight = floor ? (floor.wallHeight ?? testMap.floorplan.wallHeight ?? 3.0) : (testMap.floorplan.wallHeight ?? 3.0);
    return floorY + roofWallHeight + bounds.height + 0.18;
  }
  
  if (type === 'stairs') {
    const stairsOffset = testMap.getStairsElevationOffset ? testMap.getStairsElevationOffset(bounds.target) : 0;
    return floorY + stairsOffset + Math.max(0.18, Math.min(bounds.height || 1, 1.4));
  }
  
  if (type === 'opening') {
    const openingOffset = testMap.getOpeningElevationOffset ? testMap.getOpeningElevationOffset(bounds.target) : 0;
    return floorY + openingOffset + 0.18;
  }
  
  if (type === 'item') {
    const item = bounds.target;
    const roomOffset = testMap.getItemRoomElevationOffset ? testMap.getItemRoomElevationOffset(item) : 0;
    return floorY + roomOffset + (item.elevation || 0) / INCHES_PER_UNIT + 0.18;
  }
  
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
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const localY = sillHeight + height / 2;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const openingOffset = testMap.getOpeningElevationOffset ? testMap.getOpeningElevationOffset(opening) : 0;
    node.position.set(point.x, floorY + localY + openingOffset, point.z);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  });

  testMap.floorplan.items.forEach((item) => {
    if (item.roomId !== room.id) return;
    const node = testMap.itemNodes?.get(item.id);
    const roomOffset = testMap.getItemRoomElevationOffset ? testMap.getItemRoomElevationOffset(item) : 0;
    if (node) node.position.set(item.x, floorY + (item.elevation || 0) / INCHES_PER_UNIT + roomOffset, item.z);
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
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const localY = sillHeight + height / 2;
    const [wx1, wz1] = wall.from;
    const [wx2, wz2] = wall.to;
    const openingOffset = testMap.getOpeningElevationOffset ? testMap.getOpeningElevationOffset(opening) : 0;
    opNode.position.set(point.x, floorY + localY + openingOffset, point.z);
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
  const fenceOffset = testMap.getFenceElevationOffset ? testMap.getFenceElevationOffset(fence) : 0;
  node.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
  
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
        if (type === 'stairs') {
          const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(updated.floorId) : 0;
          const stairsOffset = testMap.getStairsElevationOffset ? testMap.getStairsElevationOffset(updated) : 0;
          node.position.y = floorY + stairsOffset;
        }
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
  if (mode === 'view') {
    // 查看模式下不进行任何3D物体的选中或拖拽
    if (event.button === 0) {
      const target = pickNearest3DTarget();
      if (!target) {
        clearSelection();
      }
    }
    return;
  }
  if (event.button === 2) {
    if (mode === 'draw-wall' || mode === 'delete-wall' || isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || isAddOpeningMode()) {
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

  if (isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || mode.startsWith('draw-fence')) {
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
        if (isAddRoomMode()) {
          const room = testMap.addRoom({ x: snapped.x, z: snapped.z, shape: roomShapeFromMode(), name: `\u65b0\u623f\u95f4 ${roomCounter++}` });
          refreshShadows();
          selectRoom(room.id);
        } else if (mode.startsWith('add-roof')) {
          const subtype = mode.replace('add-roof-', '') || 'gable';
          const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : testMap.getRoomAt(snapped.x, snapped.z);
          const wallThickness = testMap.floorplan.wallThickness || 0.15;
          const roof = testMap.addRoof({
            x: room?.x ?? snapped.x,
            z: room?.z ?? snapped.z,
            width: room ? (room.width + wallThickness) : 6,
            depth: room ? (room.depth + wallThickness) : 6,
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

  if (isAddOpeningMode()) {
    const target = pickNearest3DTarget();
    if (target && target.type === 'wall' && isTargetOnCurrentFloor(target)) {
      const wallId = target.id;
      const wall = testMap.getWall(wallId);
      if (wall && target.pick.pickedPoint) {
        pushHistory();
        const pt = target.pick.pickedPoint;
        const openingMode = getOpeningModeInfo();
        const opening = testMap.addOpening(wallId, openingMode.type, getWallProjectionT(wall, pt), openingMode.shape);
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
  if (mode === 'view') {
    event.preventDefault();
    return;
  }
  const target = get3DContextTarget(event);
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  showObjectContextMenu(target, event.clientX, event.clientY);
});

canvas.addEventListener('pointerdown', (event) => {
  if (mode === 'view') return;
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
  entityManager.selectedItemId = null;
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
  entityManager.selectItem(itemId);
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
    r: 8,
    fill: '#ff9f1c',
    stroke: '#ffffff',
    'stroke-width': 2,
    cursor: 'pointer'
  });
  
  const handleTo = createSvgElement('circle', {
    class: 'fence-handle',
    cx: b.x,
    cy: b.y,
    r: 8,
    fill: '#ff9f1c',
    stroke: '#ffffff',
    'stroke-width': 2,
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
      width: (other.width / INCHES_PER_UNIT) * otherScale,
      depth: (other.depth / INCHES_PER_UNIT) * otherScale,
      height: (other.height / INCHES_PER_UNIT) * otherScale
    };
    
    const localPoints = definition.interaction.getInteractionPoints(otherSize);
    localPoints.forEach((p, index) => {
      // XZ 平面投影
      const cos = Math.cos(other.rotation || 0);
      const sin = Math.sin(other.rotation || 0);
      const wx = other.x + p.x * cos + p.z * sin;
      const wz = other.z - p.x * sin + p.z * cos;
      const wy = (other.elevation || 0) / INCHES_PER_UNIT + p.y;
      
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
  const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
  const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
  const localY = sillHeight + height / 2;
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(opening.floorId || wallLike.floorId) : 0;
  const [x1, z1] = wallLike.from;
  const [x2, z2] = wallLike.to;
  const openingOffset = testMap.getOpeningElevationOffset ? testMap.getOpeningElevationOffset(opening) : 0;
  node.position.set(point.x, floorY + localY + openingOffset, point.z);
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
    sideHidden: document.getElementById('structure-side-hidden').checked,
    subtype: document.getElementById('structure-subtype')?.value || (selected.type === 'roof' ? 'gable' : 'straight')
  };
  if (selected.type === 'roof') {
    patch.type = patch.subtype;
    patch.bottomHidden = document.getElementById('structure-bottom-hidden').checked;
  }
  if (selected.type === 'stairs') {
    patch.steps = Number(document.getElementById('structure-steps').value);
    patch.mirrored = document.getElementById('structure-mirrored').checked;
    patch.spiralDegrees = Number(document.getElementById('structure-spiral-degrees').value);
    patch.cornerStep = Number(document.getElementById('structure-corner-step').value);
    patch.uSlotWidth = Number(document.getElementById('structure-u-slot-width').value);
    patch.uVoidLength = Number(document.getElementById('structure-u-void-length').value);
  }
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

  const roomFloor = testMap.floorplan.floors.find(f => f.id === room.floorId);
  const wallHeight = roomFloor ? (roomFloor.wallHeight ?? testMap.floorplan.wallHeight ?? 3.0) : (testMap.floorplan.wallHeight ?? 3.0);
  let elevation = Number(document.getElementById('room-elevation').value || 0);
  if (elevation < 0) elevation = 0;
  if (elevation > wallHeight) elevation = wallHeight;

  pushHistory();
  testMap.updateRoom(selectedRoomId, {
    name: document.getElementById('room-name').value,
    width: Number(document.getElementById('room-width').value),
    depth: Number(document.getElementById('room-depth').value),
    elevation: elevation
  });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFloor() {
  const currentFloorId = testMap.floorplan.currentFloorId;
  const currentFloor = testMap.floorplan.floors.find((f) => f.id === currentFloorId);
  if (!currentFloor) return;
  pushHistory();

  const nameInput = document.getElementById('floor-name').value.trim();
  if (nameInput && nameInput !== currentFloor.name) {
    testMap.renameFloor?.(currentFloorId, nameInput);
  }

  const heightInput = parseFloat(document.getElementById('floor-wall-height').value);
  if (Number.isFinite(heightInput) && heightInput > 0) {
    testMap.changeFloorHeight?.(currentFloorId, heightInput);
  }

  const floorHInput = parseFloat(document.getElementById('floor-height').value);
  if (Number.isFinite(floorHInput) && floorHInput > 0) {
    testMap.changeFloorDefaultFloorHeight?.(currentFloorId, floorHInput);
  }

  const hideRoofInput = document.getElementById('floor-hide-roof').checked;
  const hideWallInput = document.getElementById('floor-hide-wall').checked;
  testMap.changeFloorHideSettings?.(currentFloorId, hideRoofInput, hideWallInput);

  if (hideRoofInput && selectedRoofId) {
    const roof = testMap.getRoof?.(selectedRoofId);
    if (roof && roof.floorId === currentFloorId) {
      clearSelection();
    }
  }

  syncFloorControls();
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
  const degrees = Number(document.getElementById('item-rotation').value) || 0;
  entityManager.updateItemRotation(selectedItemId, degrees);
}

function updateSelectedScale(value) {
  if (!selectedItemId) return;
  entityManager.updateItemScale(selectedItemId, value);
}

function updateSelectedSize() {
  if (!selectedItemId) return;
  const widthVal = Number(document.getElementById('item-width').value) * INCHES_PER_UNIT;
  const depthVal = Number(document.getElementById('item-depth').value) * INCHES_PER_UNIT;
  const heightVal = Number(document.getElementById('item-height').value) * INCHES_PER_UNIT;
  const elevationVal = Number(document.getElementById('item-elevation').value || 0) * INCHES_PER_UNIT;
  entityManager.updateItemSize(selectedItemId, widthVal, depthVal, heightVal, elevationVal);
}

function updateSelectedPose() {
  if (!selectedItemId) return;
  const newPose = document.getElementById('item-pose').value;
  entityManager.updateItemPose(selectedItemId, newPose);
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

  // 如果是发光材质分类，添加自定义取色器卡片
  if (category === 'emissive') {
    const customEmissiveContainer = document.createElement('div');
    customEmissiveContainer.className = 'custom-emissive-container';
    customEmissiveContainer.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 8px 0; padding: 10px; background: rgba(42, 65, 92, 0.04); border-radius: 6px; border: 1px solid rgba(42, 65, 92, 0.12);';

    const textWrapper = document.createElement('div');
    textWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

    const label = document.createElement('span');
    label.textContent = '自定义发光颜色';
    label.style.cssText = 'font-size: 13px; font-weight: 500; color: #172033;';

    textWrapper.appendChild(label);

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.id = 'emissive-color-picker';

    const customEmissive = materialLibrary.find(m => m.id && m.id.startsWith('emissive-custom'));
    picker.value = customEmissive ? customEmissive.color : '#ffffff';
    picker.style.cssText = 'border: 1px solid rgba(42, 65, 92, 0.16); background: none; width: 44px; height: 28px; cursor: pointer; padding: 0; border-radius: 4px; overflow: hidden;';

    const handleColorChange = (color) => {
      const customDesc = {
        id: `emissive-custom-${color.replace('#', '')}`,
        name: `自定义发光 (${color})`,
        category: 'emissive',
        kind: 'emissive',
        color: color
      };

      const existingIdx = materialLibrary.findIndex(m => m.id && m.id.startsWith('emissive-custom'));
      if (existingIdx >= 0) {
        materialLibrary[existingIdx] = customDesc;
      } else {
        materialLibrary.push(customDesc);
      }

      activeMaterialDescriptor = customDesc;
      renderMaterialLibrary();
      updateEditor();
    };

    picker.addEventListener('change', (e) => {
      handleColorChange(e.target.value);
    });

    customEmissiveContainer.appendChild(textWrapper);
    customEmissiveContainer.appendChild(picker);
    materialLibraryPanel.appendChild(customEmissiveContainer);
  }

  const grid = document.createElement('div');
  grid.className = 'material-grid';

  // 仅在非发光分类下，动态创建并插入第一个“+”号上传材质方格
  if (category !== 'emissive') {
    const uploadButton = document.createElement('button');
    uploadButton.type = 'button';
    uploadButton.className = 'material-swatch upload-swatch';
    uploadButton.title = '上传自定义材质';
    uploadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
    uploadButton.addEventListener('click', () => {
      document.getElementById('material-upload').click();
    });
    grid.appendChild(uploadButton);
  }

  materials.forEach((material) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `material-swatch ${activeMaterialDescriptor?.id === material.id ? 'active' : ''}`;
    button.title = material.name;
    if (material.kind === 'texture' && material.src) {
      button.style.backgroundImage = `url(${material.src})`;
    } else if (material.kind === 'mirror') {
      // 镜面：底色 + 对角线光泽渐变
      const c = material.color || '#e8eef4';
      button.style.background = `linear-gradient(135deg, ${c} 0%, #ffffff 45%, ${c} 55%, #ffffff 100%)`;
    } else if (material.kind === 'glass') {
      // 玻璃：棋盘格透明底 + 半透明颜色覆盖
      const c = material.color || '#e8f4ff';
      button.style.background = `linear-gradient(${c}99, ${c}99), repeating-conic-gradient(#d0d0d0 0% 25%, #f5f5f5 0% 50%) 0 0 / 8px 8px`;
    } else if (material.kind === 'emissive') {
      // 发光：颜色本身 + 发光外阴影
      const c = material.color || '#ffffff';
      button.style.backgroundColor = c;
      button.style.boxShadow = `inset 0 0 4px rgba(255,255,255,0.8), 0 0 10px ${c}88`;
      button.style.border = '1px solid rgba(255,255,255,0.4)';
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
  if (isTargetLocked({ type: 'room', id: selectedRoomId })) {
    showToast('该物体已锁定');
    return;
  }
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
  const wall = testMap.getWall(selectedWallId);
  if (wall && wall.locked) {
    showToast('该物体已锁定');
    return;
  }
  pushHistory();
  const color = material.color || '#f9fbff';
  testMap.updateWall(selectedWallId, { material, color });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToWallFront(material) {
  if (!selectedWallId || !material) return;
  const wall = testMap.getWall(selectedWallId);
  if (wall && wall.locked) {
    showToast('该物体已锁定');
    return;
  }
  pushHistory();
  const colorFront = material.color || '#f9fbff';
  testMap.updateWall(selectedWallId, { materialFront: material, colorFront });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToWallBack(material) {
  if (!selectedWallId || !material) return;
  const wall = testMap.getWall(selectedWallId);
  if (wall && wall.locked) {
    showToast('该物体已锁定');
    return;
  }
  pushHistory();
  const colorBack = material.color || '#f9fbff';
  testMap.updateWall(selectedWallId, { materialBack: material, colorBack });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToItemComponent(componentId, material) {
  if (!selectedItemId || !material) return;
  if (isTargetLocked({ type: 'item', id: selectedItemId })) {
    showToast('该物体已锁定');
    return;
  }
  entityManager.updateItemComponentMaterial(selectedItemId, componentId, material);
}

function applyMaterialToStructure(material, part = 'top') {
  const selected = getSelectedStructure();
  if (!selected?.value || !material) return;
  if (selected.value.locked) {
    showToast('该物体已锁定');
    return;
  }
  pushHistory();
  if (part === 'top') {
    updateStructure(selected.type, selected.id, { material, color: material.color || selected.value.color });
  } else if (part === 'side') {
    updateStructure(selected.type, selected.id, { sideMaterial: material, sideColor: material.color || selected.value.sideColor });
  } else if (part === 'bottom') {
    updateStructure(selected.type, selected.id, { bottomMaterial: material, bottomColor: material.color || selected.value.bottomColor });
  }
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToFence(material) {
  if (!selectedFenceId || !material) return;
  if (isTargetLocked({ type: 'fence', id: selectedFenceId })) {
    showToast('该物体已锁定');
    return;
  }
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
    button.className = 'furniture-item-btn';

    const img = document.createElement('img');
    const imgPath = `../src/furniture/image/${definition.type}.png`;
    const resolvedUrl = furnitureImages[imgPath]?.default || furnitureImages['../src/furniture/image/placeholder.png']?.default || '';
    img.src = resolvedUrl;
    img.alt = definition.name;

    img.onerror = () => {
      img.style.display = 'none';
    };

    const span = document.createElement('span');
    span.textContent = definition.name;

    button.append(img, span);
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

function get2DPlanScreenshot() {
  return new Promise((resolve, reject) => {
    const svgEl = document.getElementById('floorplan');
    if (!svgEl) {
      reject(new Error('未找到 floorplan SVG 元素'));
      return;
    }
    
    const svgClone = svgEl.cloneNode(true);
    
    // 提取所有样式表中的样式规则并放入 style 标签中
    let styleString = '';
    for (const styleSheet of document.styleSheets) {
      try {
        const rules = styleSheet.cssRules || styleSheet.rules;
        if (rules) {
          for (const rule of rules) {
            styleString += rule.cssText;
          }
        }
      } catch (e) {
        // 忽略跨域的样式表
      }
    }
    
    const styleEl = document.createElement('style');
    styleEl.textContent = styleString;
    svgClone.insertBefore(styleEl, svgClone.firstChild);
    
    // 获取实际物理尺寸，避免渲染时Image拉伸异常
    const rect = svgEl.getBoundingClientRect();
    const width = rect.width || 720;
    const height = rect.height || 520;
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2倍高分辨率
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        try {
          const pngUrl = canvas.toDataURL('image/png');
          resolve(pngUrl);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('无法创建 2D canvas context'));
      }
      URL.revokeObjectURL(blobURL);
    };
    
    image.onerror = (err) => {
      URL.revokeObjectURL(blobURL);
      reject(err);
    };
    
    image.src = blobURL;
  });
}

function takePhoto() {
  if (currentView === '3d') {
    showToast('正在生成 3D 截图...');
    
    // 1. 临时隐藏 3D 辅助网格和编辑手柄
    const originalGridState = viewer3d.show3DGrid;
    if (originalGridState) {
      viewer3d.clear3DGrid();
    }
    const hiddenNodes = [];
    editHandleNodes.forEach((node) => {
      if (node && !node.isDisposed() && node.isEnabled()) {
        node.setEnabled(false);
        hiddenNodes.push(node);
      }
    });

    // 2. 保证在此帧渲染隐藏后的效果
    scene.render();

    // 3. 调用 Babylon 截图
    BABYLON.Tools.CreateScreenshotAsync(engine, camera, { precision: 1 })
      .then((dataUrl) => {
        const filename = `screenshot_3d_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✓ 3D 截图已下载');
      })
      .catch((err) => {
        console.error('3D 截图失败:', err);
        showToast('⚠ 3D 截图生成失败');
      })
      .finally(() => {
        // 4. 恢复 3D 网格和编辑手柄
        if (originalGridState) {
          refresh3DGrid();
        }
        hiddenNodes.forEach((node) => {
          if (node && !node.isDisposed()) {
            node.setEnabled(true);
          }
        });
      });
  } else {
    showToast('正在生成 2D 截图...');
    get2DPlanScreenshot()
      .then((dataUrl) => {
        const filename = `screenshot_2d_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✓ 2D 截图已下载');
      })
      .catch((err) => {
        console.error('2D 截图失败:', err);
        showToast('⚠ 2D 截图生成失败');
      });
  }
}

viewToggleButton.addEventListener('click', () => setView(currentView === '2d' ? '3d' : '2d'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

const takePhotoButton = document.getElementById('btn-take-photo');
if (takePhotoButton) {
  takePhotoButton.addEventListener('click', takePhoto);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'F12') {
    event.preventDefault();
    takePhoto();
    return;
  }

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
    // 修正3D下左右相反的问题：A 键原本是 subtract 导致相反，现修改为 add；D 键相应改动
    if (key === 'a') camera.target.addInPlace(right.scale(speed));
    if (key === 'd') camera.target.subtractInPlace(right.scale(speed));
    return;
  }

  // 1.1 WASD 视角平移 (2D模式下)
  if (currentView === '2d' && ['w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    // 采用自适应跨度作为平移步长，使缩放比例不同时平移体验高度一致
    const stepX = (view.maxX - view.minX) * 0.05;
    const stepZ = (view.maxZ - view.minZ) * 0.05;

    if (key === 'w') {
      view.minZ += stepZ;
      view.maxZ += stepZ;
    }
    if (key === 's') {
      view.minZ -= stepZ;
      view.maxZ -= stepZ;
    }
    if (key === 'a') {
      view.minX -= stepX;
      view.maxX -= stepX;
    }
    if (key === 'd') {
      view.minX += stepX;
      view.maxX += stepX;
    }
    hasUserZoomedOrPanned = true;
    renderPlan();
    return;
  }

  // 2. 选中的物品/门窗移动 (上下左右键)
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
    if (selectedItemId) {
      const step = 0.1; // 0.1 米
      let dx = 0, dz = 0;
      if (key === 'arrowup') dz = step;
      if (key === 'arrowdown') dz = -step;
      if (key === 'arrowleft') dx = -step;
      if (key === 'arrowright') dx = step;
      entityManager.nudgeItem(selectedItemId, dx, dz);
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
      const step = 2.4; // 2.4 英寸 (0.1 米)
      const delta = event.key === 'PageUp' ? step : -step;
      entityManager.adjustItemElevation(selectedItemId, delta);
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
      const delta = (key === '+' || key === '=') ? 0.05 : -0.05;
      entityManager.adjustItemScale(selectedItemId, delta);
    }
    return;
  }

  // 5. 选中的物品旋转 ([ / ])
  if (key === '[' || key === ']') {
    event.preventDefault();
    if (selectedItemId) {
      const deltaDeg = key === ']' ? 15 : -15;
      entityManager.adjustItemRotation(selectedItemId, deltaDeg);
    }
    return;
  }

  // 选中元素按 Delete / Backspace 直接删除
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedItemId) {
      event.preventDefault();
      entityManager.deleteItem(selectedItemId);
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

  // Ctrl/Meta 快捷组合键
  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      redo();
      return;
    } else if (key === 's') {
      event.preventDefault();
      document.getElementById('btn-save-local')?.click();
      return;
    } else if (key === 'o') {
      event.preventDefault();
      document.getElementById('btn-open-local')?.click();
      return;
    } else if (key === 'e') {
      event.preventDefault();
      document.getElementById('btn-save')?.click();
      return;
    } else if (key === 'i') {
      event.preventDefault();
      document.getElementById('btn-load')?.click();
      return;
    } else if (key === 'n') {
      event.preventDefault();
      document.getElementById('btn-new')?.click();
      return;
    } else if (key === 'l') {
      event.preventDefault();
      const target = getSelectedTarget();
      if (target) {
        toggleTargetLock(target);
      }
      return;
    } else if (key === 'c' || key === 'd') {
      event.preventDefault();
      const target = getSelectedTarget();
      if (target) {
        copyContextTarget(target);
      }
      return;
    }
  }

  // 备用快捷键 Ctrl+Alt+N (应对某些浏览器无法阻止默认 Ctrl+N)
  if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    document.getElementById('btn-new')?.click();
    return;
  }

  // 5.5. 选中的灯具开关灯快捷键 (L 键)
  if (key === 'l' && selectedItemId) {
    const item = testMap.getItem(selectedItemId);
    const definition = item ? testMap.getFurnitureDefinition(item.type) : null;
    if (item && (definition?.category === 'lighting' || definition?.lightSource)) {
      event.preventDefault();
      entityManager.toggleItemPower(selectedItemId);
      return;
    }
  }

  // 选中的物体旋转快捷键 (R 键)
  if (key === 'r') {
    const target = getSelectedTarget();
    if (target) {
      if (isAllowedContextTarget(target) && !isTargetLocked(target)) {
        event.preventDefault();
        rotateContextTarget(target);
        return;
      }
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
      'r': 'add-room-square',
      'd': 'add-door-square',
      'w': 'add-window-square',
      'v': 'view'
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
initUiEventListeners();

document.getElementById('btn-reset-camera').addEventListener('click', () => {
  if (currentView === '3d') {
    resetCamera();
  } else {
    hasUserZoomedOrPanned = false;
    renderPlan();
  }

  // 显式调出左右工具栏，防止查看模式下侧边栏收起后无法返回
  let panelChanged = false;
  const rightPanel = document.getElementById('right-panel');
  if (rightPanel && rightPanel.classList.contains('collapsed')) {
    rightPanel.classList.remove('collapsed');
    const btnToggleRight = document.getElementById('btn-toggle-right');
    if (btnToggleRight) btnToggleRight.textContent = '›';
    panelChanged = true;
  }
  const leftPanel = document.querySelector('.left-panel');
  if (leftPanel && leftPanel.classList.contains('collapsed')) {
    leftPanel.classList.remove('collapsed');
    const btnToggleLeft = document.getElementById('btn-toggle-left');
    if (btnToggleLeft) btnToggleLeft.textContent = '‹';
    panelChanged = true;
  }
  if (panelChanged) {
    setTimeout(() => {
      if (engine) engine.resize();
    }, 300);
  }

  // 如果当前处于查看模式，自动切回选择模式，以确保用户能够继续交互
  if (mode === 'view') {
    switchToSelectMode();
  }
});
document.getElementById('btn-reset-material').addEventListener('click', resetCurrentMaterial);

function resetInteractionState() {
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  drawStart = null;
  entityManager.dragState = null;
  openingDragState = null;
  roomDragState = null;
  roomResizeState = null;
  entityManager.itemGestureState = null;
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
document.getElementById('btn-save-local').addEventListener('click', async () => {
  const defaultName = store.getCurrentProjectName() || testMap.floorplan.name || '';
  const name = await showCustomPrompt('保存到本地', '请为项目命名：', defaultName || '我的蓝图');
  if (!name) return;
  const ok = store.saveProject(name, {
    materialLibrary: materialLibrary.filter((m) => !DEFAULT_MATERIAL_PACKS.some((d) => d.id === m.id)),
    uiState: { currentFloorId: testMap.floorplan.currentFloorId, currentView },
  });
  if (ok) {
    updateLocalProjectCount();
  }
  showToast(ok ? `✓ 已保存「${name}」` : '⚠ 保存失败');
});
document.getElementById('btn-export-dxf').addEventListener('click', downloadDXFFile);
document.getElementById('btn-export-3mf').addEventListener('click', download3MFFile);

document.getElementById('btn-load').addEventListener('click', () => {
  buildingFileInput.value = '';
  buildingFileInput.click();
});

document.getElementById('btn-open-local').addEventListener('click', async () => {
  const projects = store.listProjects();
  if (!projects.length) {
    await showCustomAlert('暂无本地项目', '还没有保存过项目到本地，请先使用「保存到本地」。');
    return;
  }
  const result = await showProjectListModal(projects);
  if (!result) return;
  if (result.action === 'open') {
    const data = store.loadProject(result.name);
    if (data && data.buildingData) {
      pushHistory();
      testMap.loadJSON(data.buildingData);
      syncFloorControls();
      hasUserZoomedOrPanned = false;
      resetInteractionState();
      refreshShadows();
      updateEditor();
      renderPlan();
      if (data.materialLibrary && data.materialLibrary.length) {
        data.materialLibrary.forEach((m) => {
          if (!materialLibrary.some((existing) => existing.id === m.id)) {
            materialLibrary.push(m);
          }
        });
      }
      showToast(`✓ 已打开「${result.name}」`);
    } else {
      await showCustomAlert('打开失败', '无法读取该项目的数据。');
    }
  } else if (result.action === 'delete') {
    const confirmed = await showCustomConfirm('删除项目', `确定要删除「${result.name}」吗？此操作不可撤销。`);
    if (confirmed) {
      store.deleteProject(result.name);
      updateLocalProjectCount();
      showToast(`已删除「${result.name}」`);
    }
  }
});

buildingFileInput.addEventListener('change', async (event) => {
  try {
    await loadBuildingFile(event.target.files?.[0]);
  } catch (error) {
    console.error(error);
    await showCustomAlert('加载失败', '建筑文件加载失败，请确认它是 blueprint3d-babylon 建筑文件。');
  }
});

function updateLocalProjectCount() {
  const badge = document.getElementById('open-project-badge');
  if (badge) {
    const count = store.listProjects().length;
    badge.textContent = count;
    if (count === 0) {
      badge.classList.add('zero');
    } else {
      badge.classList.remove('zero');
    }
  }
}

// 页面初始化时刷新一次本地项目数量
updateLocalProjectCount();

document.getElementById('btn-new').addEventListener('click', () => {
  pushHistory();
  testMap.loadJSON(BLUEPRINT3D_TEST_FLOORPLAN);
  store.clearLocal();
  syncFloorControls();
  hasUserZoomedOrPanned = false;
  resetInteractionState();
  refreshShadows();
  updateEditor();
  renderPlan();
  updateLocalProjectCount();
});

const btnFileMenu = document.getElementById('btn-file-menu');
const fileMenuContent = document.getElementById('file-menu-content');

btnFileMenu.addEventListener('click', (event) => {
  event.stopPropagation();
  fileMenuContent.classList.toggle('hidden');
});

fileMenuContent.addEventListener('click', (e) => {
  // 如果点击的是子菜单触发按钮，不关闭主菜单
  if (e.target.id === 'btn-export-menu') return;
  fileMenuContent.classList.add('hidden');
  // 同时关闭子菜单
  const submenu = document.querySelector('.submenu-content');
  if (submenu) submenu.classList.add('hidden');
});
document.addEventListener('click', () => {
  fileMenuContent.classList.add('hidden');
  const submenu = document.querySelector('.submenu-content');
  if (submenu) submenu.classList.add('hidden');
});

// 导出子菜单交互
const btnExportMenu = document.getElementById('btn-export-menu');
const submenuContent = btnExportMenu?.nextElementSibling;
if (btnExportMenu && submenuContent) {
  const wrapper = btnExportMenu.closest('.submenu-wrapper');
  // 悬停展开
  wrapper.addEventListener('mouseenter', () => {
    submenuContent.classList.remove('hidden');
  });
  wrapper.addEventListener('mouseleave', () => {
    submenuContent.classList.add('hidden');
  });
  // 点击也可切换
  btnExportMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    submenuContent.classList.toggle('hidden');
  });
  // 子菜单按钮点击后关闭所有菜单
  submenuContent.addEventListener('click', () => {
    submenuContent.classList.add('hidden');
    fileMenuContent.classList.add('hidden');
  });
}

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


function setToolGroupExpanded(toggle, expanded) {
  const targetId = toggle.getAttribute('aria-controls');
  const target = targetId ? document.getElementById(targetId) : null;
  toggle.setAttribute('aria-expanded', String(expanded));
  target?.classList.toggle('hidden', !expanded);
}

function initToolGroupToggles() {
  const savedState = store.readToolGroupState();
  document.querySelectorAll('.tool-group-toggle').forEach((toggle) => {
    const group = toggle.closest('.building-tool-group')?.dataset.toolGroup || toggle.getAttribute('aria-controls');
    const expanded = savedState[group] !== false;
    setToolGroupExpanded(toggle, expanded);
    toggle.addEventListener('click', () => {
      const nextExpanded = toggle.getAttribute('aria-expanded') === 'false';
      setToolGroupExpanded(toggle, nextExpanded);
      savedState[group] = nextExpanded;
      store.writeToolGroupState(savedState);
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

/**
 * 显示带输入框的弹窗
 * @param {string} title - 弹窗标题
 * @param {string} message - 提示消息
 * @param {string} [defaultValue=''] - 输入框默认值
 * @returns {Promise<string|null>} 用户输入的值，取消返回 null
 */
function showCustomPrompt(title, message = '', defaultValue = '') {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';

    let finalTitle = title;
    let finalMessage = message;
    if (!message) {
      finalTitle = '输入';
      finalMessage = title;
    }

    backdrop.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <h3 class="custom-modal-title">${finalTitle}</h3>
        </div>
        <div class="custom-modal-body">
          <p style="margin:0 0 12px 0">${finalMessage}</p>
          <input type="text" id="custom-modal-input" class="custom-modal-input" value="${defaultValue.replace(/"/g, '&quot;')}" autocomplete="off" />
        </div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel">取消</button>
          <button type="button" class="custom-modal-btn btn-primary" id="custom-modal-confirm">确定</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    backdrop.getBoundingClientRect();
    backdrop.classList.add('active');

    const inputEl = backdrop.querySelector('#custom-modal-input');
    requestAnimationFrame(() => {
      inputEl.focus();
      inputEl.select();
    });

    let isCleaned = false;
    const cleanup = (value) => {
      if (isCleaned) return;
      isCleaned = true;
      backdrop.classList.remove('active');
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => backdrop.remove(), 200);
      resolve(value);
    };

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(null));
    backdrop.querySelector('#custom-modal-confirm').addEventListener('click', () => {
      const val = inputEl.value.trim();
      cleanup(val || null);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(null);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const val = inputEl.value.trim();
        cleanup(val || null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  });
}

/**
 * 显示本地项目列表弹窗，支持打开和删除
 * @param {{ id: string, name: string, savedAt: number }[]} projects
 * @returns {Promise<{ action: 'open'|'delete', name: string }|null>}
 */
function showProjectListModal(projects) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';

    const listHtml = projects.map((p) => {
      const timeStr = formatTimestamp(p.savedAt);
      return `
        <div class="project-list-item" data-name="${p.name.replace(/"/g, '&quot;')}">
          <div class="project-list-item-info">
            <span class="project-list-item-name">${p.name}</span>
            <span class="project-list-item-time">${timeStr}</span>
          </div>
          <div class="project-list-item-actions">
            <button type="button" class="custom-modal-btn btn-primary btn-sm project-open-btn" title="打开">打开</button>
            <button type="button" class="custom-modal-btn btn-danger btn-sm project-delete-btn" title="删除">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="custom-modal-container" style="max-width:480px">
        <div class="custom-modal-header">
          <div class="custom-modal-icon-wrapper confirm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="custom-modal-title">打开本地项目</h3>
        </div>
        <div class="custom-modal-body" style="margin-bottom:16px">
          <div class="project-list">${listHtml}</div>
        </div>
        <div class="custom-modal-footer">
          <button type="button" class="custom-modal-btn btn-secondary" id="custom-modal-cancel">关闭</button>
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
      setTimeout(() => backdrop.remove(), 200);
      resolve(value);
    };

    // 打开按钮
    backdrop.querySelectorAll('.project-open-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.project-list-item');
        cleanup({ action: 'open', name: item.dataset.name });
      });
    });

    // 删除按钮
    backdrop.querySelectorAll('.project-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.project-list-item');
        cleanup({ action: 'delete', name: item.dataset.name });
      });
    });

    backdrop.querySelector('#custom-modal-cancel').addEventListener('click', () => cleanup(null));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(null);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
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

export function getSnapEnabled() {
  return snapEnabled;
}
export function setSnapEnabled(val) {
  snapEnabled = val;
}
export function getSnapSize() {
  return snapSize;
}
export function setSnapSize(val) {
  snapSize = val;
}

export {
  testMap,
  viewer3d,
  entityManager,
  activeMaterialDescriptor,
  selectedRoomId,
  selectedWallId,
  selectedFenceId,
  selectedItemId,
  selectedOpeningId,
  selectedRoofId,
  selectedStairsId,
  
  INCHES_PER_UNIT,
  
  updateSelectedRoom,
  updateSelectedFloor,
  updateSelectedStructure,
  updateSelectedRotation,
  updateSelectedScale,
  updateSelectedPose,
  updateSelectedWallLength,
  updateSelectedWallRotation,
  previewSelectedWallRotation,
  commitSelectedStructureRotation,
  previewSelectedStructureRotation,
  deleteSelectedStructure,
  
  updateSelectedSize,
  updateSelectedOpening,
  updateSelectedFenceSubtype,
  updateSelectedFenceLength,
  updateSelectedFenceHeight,
  updateSelectedFenceColor,
  
  applyMaterialToRoomFloor,
  applyMaterialToWallFront,
  applyMaterialToWallBack,
  applyMaterialToStructure,
  applyMaterialToItemComponent,
  applyMaterialToFence,
  
  isTargetLocked,
  showToast,
  pushHistory,
  refreshShadows,
  renderPlan,
  refresh3DGrid,
  findNearestSeat,
  isSymmetricShape,
  syncRotationInputs,
  setContextTargetLocked,
  clearSelection,
  revealRightPanelIfNeeded,
  
  showCustomConfirm,
  currentRooms,
  canPlaceOnTable,
  findTableBelow,
  getSelectedStructure
};
