import './styles.css';
import { buildFenceGeometry } from '../src/geometry/fenceGeometry.js';
import { ensure3DGridControls, ensureStructureEditor, updateEditor, initUiEventListeners } from './js/EditorUi.js';
import { showCustomConfirm, showCustomAlert, showCustomPrompt, showProjectListModal } from './js/Dialogs.js';
import { createCustomDropdown } from './js/Dropdown.js';
import { handleHotkeys } from './js/Hotkeys.js';
import { Store, showToast, formatTimestamp } from './js/Store.js';
import { EntityManager } from './js/EntityManager.js';
import { Viewer3D } from './js/Viewer3D.js';
import * as Topology from './js/Topology.js';
import * as DragHandler from './js/DragHandler.js';
import * as SvgEvents from './js/SvgEvents.js';
import * as FileManager from './js/FileManager.js';
import { iconSvg } from './js/Icons.js';
import {
  initRender2D,
  renderPlan,
  worldToSvg,
  svgToWorld,
  inchesToWorld,
  createSvgElement,
  svgPointFromEvent,
  wallPointAt,
  getWallProjectionT
} from './js/Render2D.js';
import {
  initViewer3DHandles,
  clear3DEditHandles,
  refresh3DEditHandles,
  begin3DEditHandleDrag,
  move3DEditHandle,
  pickNearest3DTarget,
  getEditHandleNodes,
  getEditHandleDragState,
  setEditHandleDragState,
  get3DEditTargetBounds,
  get3DEditHandleY,
  create3DEditHandle,
  set3DEditTarget,
  same3DEditTarget,
  syncRoomMovePreview,
  syncWallMovePreview,
  syncFenceMovePreview
} from './js/Viewer3DHandles.js';
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
  clear2DStairsRailingPreview();
  clear3DStairsRailingPreview();
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
let selectedFenceGateId = null;
let drawStart = null;
let drag3DState = null;
let drawWallPreviewCylinder = null;
let drawWallPreviewStartCylinder = null;
let drawWallPreviewWall = null;
let roofResizeState = null;
let stairsRailingPreview2DGroup = null;
let stairsRailingPreview3DGroup = null;
let currentPreviewStairsId = null;
let floorEdgeRailingPreview2DGroup = null;
let floorEdgeRailingPreview3DGroup = null;
let currentPreviewFloorEdgeIndex = null;
let contextMenuElement = null;
let longPressState = null;
let snapEnabled = true;
// show3DGrid / grid3DNodes 已移至 viewer3d 实例
let active3DEditTarget = null;
function getActive3DEditTarget() { return active3DEditTarget; }
function setActive3DEditTarget(val) { active3DEditTarget = val; }
let snapSize = 1;
let activeMaterialDescriptor = null;
let materialLibrary = [...DEFAULT_MATERIAL_PACKS];
const activePointers = new Map();
let hasUserZoomedOrPanned = false;
let roomCounter = 1;
// 撤销/重做栈已迁移到 Store.js 管理
let floorPanelCollapsed = false;

const stage = document.getElementById('stage');
const viewToggleButton = document.getElementById('btn-view-toggle');
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
  const handles = getEditHandleNodes();
  if (currentView !== '3d' || handles.length === 0) return;
  const cameraPosition = camera.position;
  handles.forEach((node) => {
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

DragHandler.initDragHandler({
  testMap,
  svg,
  get mode() { return mode; },
  svgPointFromEvent,
  svgToWorld,
  snapRoomPosition,
  snapWorldPoint,
  snapNumber,
  pushHistory,
  syncRoomMovePreview,
  refreshShadows,
  updateEditor,
  renderPlan,
  selectRoom,
  selectWall,
  selectOpening,
  clearSelection,
  selectRoof,
  selectStairs,
  selectFence,
  selectFenceGate,
  getStructure,
  moveStructureTo,
  get snapEnabled() { return snapEnabled; },
  get snapSize() { return snapSize; },
  rememberPointer,
  syncWallMovePreview,
  syncFenceMovePreview,
  snapToGridSegmentCenter,
  getWallProjectionT
});

SvgEvents.initSvgEvents({
  svg,
  view,
  get currentView() { return currentView; },
  get mode() { return mode; },
  get snapEnabled() { return snapEnabled; },
  get snapSize() { return snapSize; },
  get activePointers() { return activePointers; },
  testMap,
  entityManager,
  svgToWorld,
  svgPointFromEvent,
  snapWorldPoint,
  snapNumber,
  renderPlan,
  get2DContextTargetFromElement,
  clear2DStairsRailingPreview,
  clear2DFloorEdgeRailingPreview,
  update2DStairsRailingPreview,
  update2DFloorEdgeRailingPreview,
  forgetPointer,
  updatePointer,
  finishRoofResize,
  selectRoom,
  selectRoof,
  selectStairs,
  selectFence,
  selectFenceGate,
  switchToSelectMode,
  pushHistory,
  refreshShadows,
  clearSelection,
  isAddRoomMode,
  roomShapeFromMode,
  addRailingToStairs,
  clear3DStairsRailingPreview,
  clear3DFloorEdgeRailingPreview,
  rememberPointer,
  moveRoofResize,
  getRoofResizeState() { return roofResizeState; },
  setRoofResizeState(val) { roofResizeState = val; },
  getDrawStart() { return drawStart; },
  setDrawStart(val) { drawStart = val; },
  getRoomCounter() { return roomCounter; },
  incrementRoomCounter() { roomCounter++; },
  getHasUserZoomedOrPanned() { return hasUserZoomedOrPanned; },
  setHasUserZoomedOrPanned(val) { hasUserZoomedOrPanned = val; },
  pointInRoom
});



initRender2D({
  svg,
  get snapEnabled() { return snapEnabled; },
  get snapSize() { return snapSize; },
  view,
  currentRooms,
  referenceFloorWalls,
  currentWalls,
  currentOpenings,
  currentRoofs,
  currentStairs,
  currentFences,
  currentItems,
  getFreeFloorEdges,
  get drawStart() { return drawStart; },
  get selectedRoomId() { return selectedRoomId; },
  get selectedWallId() { return selectedWallId; },
  get selectedItemId() { return selectedItemId; },
  get selectedOpeningId() { return selectedOpeningId; },
  get selectedRoofId() { return selectedRoofId; },
  get selectedStairsId() { return selectedStairsId; },
  get selectedFenceId() { return selectedFenceId; },
  get selectedFenceGateId() { return selectedFenceGateId; },
  testMap,
  entityManager,
  get mode() { return mode; },
  get currentView() { return currentView; },
  SVG_NS,
  INCHES_PER_UNIT,
  updateViewBounds,
  attachContextMenuTrigger,
  selectRoom,
  selectWall,
  selectOpening,
  selectRoof,
  selectStairs,
  selectFence,
  selectFenceGate,
  beginRoomResize,
  beginRoomDrag,
  beginWallDrag,
  beginOpeningDrag,
  beginStructureDrag,
  beginFenceDrag,
  beginFenceGateDrag,
  beginFenceResize,
  isAddOpeningMode,
  getOpeningModeInfo,
  pushHistory,
  clearSelection,
  refreshShadows,
  switchToSelectMode,
  showCustomConfirm,
  Topology
});

initViewer3DHandles({
  get selectedItemId() { return selectedItemId; },
  get selectedWallId() { return selectedWallId; },
  get selectedFenceId() { return selectedFenceId; },
  get selectedRoofId() { return selectedRoofId; },
  get selectedStairsId() { return selectedStairsId; },
  get selectedFenceGateId() { return selectedFenceGateId; },
  testMap,
  entityManager,
  viewer3d,
  canvas,
  get currentView() { return currentView; },
  pushHistory,
  refreshShadows,
  updateEditor,
  renderPlan,
  get snapEnabled() { return snapEnabled; },
  get snapSize() { return snapSize; },
  snapNumber,
  snapValue,
  snapWorldPoint,
  findMetadataFromNode,
  getActive3DEditTarget() { return active3DEditTarget; },
  setActive3DEditTarget(val) { active3DEditTarget = val; },
  isTargetLocked,
  INCHES_PER_UNIT,
  wallPointAt,
  findOpeningIdFromNode,
  findItemIdFromNode,
  findWallIdFromNode,
  findRoomIdFromNode,
  findRoofIdFromNode,
  findStairsIdFromNode,
  findFenceIdFromNode,
  findFenceGateIdFromNode,
  groundPointFromPointer,
  setDrag3DState(state) { drag3DState = state; }
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

FileManager.initFileManager({
  testMap,
  store,
  getMaterialLibrary() { return materialLibrary; },
  DEFAULT_MATERIAL_PACKS,
  get currentView() { return currentView; },
  engine,
  scene,
  pushHistory,
  syncFloorControls,
  setHasUserZoomedOrPanned(val) { hasUserZoomedOrPanned = val; },
  resetInteractionState,
  refreshShadows,
  updateEditor,
  renderPlan,
  showCustomPrompt,
  showCustomAlert,
  showCustomConfirm,
  showProjectListModal,
  showToast
});

ensureBuildingToolControls();
ensure3DGridControls();
ensureStructureEditor();
syncFloorControls();
initFurnitureButtons();
initMaterialControls();
createCustomDropdown('furniture-category-select');
createCustomDropdown('material-category');
createCustomDropdown('fence-subtype');
createCustomDropdown('fence-gate-subtype');
createCustomDropdown('opening-shape');
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

function snapValue(value) {
  return Topology.snapValue(value, snapEnabled, snapSize);
}

function snapWorldPoint(world) {
  return Topology.snapWorldPoint(world, snapEnabled, snapSize);
}

function snapToGridSegmentCenter(point) {
  return Topology.snapToGridSegmentCenter(point, snapEnabled, snapSize);
}

function snapNumber(value) {
  return Topology.snapNumber(value, snapEnabled, snapSize);
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
  if (selectedFenceGateId) return { type: 'fence_gate', id: selectedFenceGateId };
  return null;
}

function isAllowedContextTarget(target) {
  return ['item', 'opening', 'roof', 'stairs', 'room', 'fence', 'fence_gate'].includes(target?.type);
}

function getContextTargetObject(target) {
  if (!target) return null;
  if (target.type === 'item') return testMap.getItem(target.id);
  if (target.type === 'opening') return testMap.getOpening(target.id);
  if (target.type === 'roof') return testMap.getRoof?.(target.id);
  if (target.type === 'stairs') return testMap.getStairs?.(target.id);
  if (target.type === 'room') return testMap.getRoom(target.id);
  if (target.type === 'fence') return testMap.getFence?.(target.id);
  if (target.type === 'fence_gate') return testMap.getFenceGate?.(target.id);
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
  } else if (target.type === 'fence_gate') {
    testMap.updateFenceGate?.(target.id, { locked: value });
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
  if (target.type === 'fence_gate') return testMap.getFenceGate?.(target.id)?.floorId || 'floor_1';
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
  const fenceGate = element.closest?.('[data-fence-gate-id]');
  if (fenceGate?.dataset.fenceGateId) return { type: 'fence_gate', id: fenceGate.dataset.fenceGateId };
  const roomHit = element.closest?.('[data-room-hit-id]');
  if (roomHit?.dataset.roomHitId) return { type: 'room', id: roomHit.dataset.roomHitId };
  const room = element.closest?.('[data-room-id]');
  if (room?.dataset.roomId) return { type: 'room', id: room.dataset.roomId };
  return null;
}
function isSwitchableTarget(target) {
  if (!target) return false;
  if (target.type === 'opening' || target.type === 'fence_gate') return true;
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
  const isRotatable = ['item', 'roof', 'stairs', 'opening', 'fence_gate'].includes(target.type);
  const isMirrorable = ['item', 'roof', 'stairs', 'opening', 'fence_gate'].includes(target.type);
  const isSwitchable = isSwitchableTarget(target);
  const isLighting = isLightingTarget(target);
  const isLocked = isTargetLocked(target);

  const isDoorLike = (target.type === 'fence_gate') || (target.type === 'opening' && testMap.getOpening(target.id)?.type === 'door');
  const isDouble = target.type === 'opening'
    ? !!testMap.getOpening(target.id)?.doubleDoor
    : (target.type === 'fence_gate' ? !!testMap.getFenceGate(target.id)?.doubleDoor : false);
  
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
    { icon: 'copy', title: '复制', onClick: () => copyContextTarget(target) },
    isRotatable && {
      icon: 'rotate',
      title: '旋转',
      disabled: isLocked || (target.type === 'fence_gate' && !!testMap.getFenceGate(target.id)?.fenceId),
      onClick: () => rotateContextTarget(target)
    },
    isMirrorable && { icon: 'flip', title: '镜像', disabled: isLocked, onClick: () => mirrorContextTarget(target) },
    isDoorLike && {
      icon: 'double_door',
      title: isDouble ? '单开' : '双开',
      disabled: isLocked,
      onClick: () => {
        pushHistory();
        if (target.type === 'opening') {
          testMap.updateOpening(target.id, { doubleDoor: !isDouble });
        } else if (target.type === 'fence_gate') {
          testMap.updateFenceGate(target.id, { doubleDoor: !isDouble });
        }
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    },
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
      icon: isLighting ? 'power' : (['opening', 'fence_gate'].includes(target.type) ? 'door' : 'power'), 
      title: '开关', 
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
  } else if (target.type === 'fence_gate') {
    const gate = testMap.getFenceGate(target.id);
    if (!gate) return;
    testMap.updateFenceGate(target.id, { isOpen: !gate.isOpen });
    if (selectedFenceGateId === target.id) {
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
  } else if (target.type === 'fence_gate') {
    const gate = testMap.getFenceGate(target.id);
    if (!gate) return;
    const cx = (gate.from[0] + gate.to[0]) / 2;
    const cz = (gate.from[1] + gate.to[1]) / 2;
    const dx = gate.to[0] - gate.from[0];
    const dz = gate.to[1] - gate.from[1];
    // 顺时针旋转 90 度：(x, z) -> (-z, x)
    const nextFrom = [cx + dz / 2, cz - dx / 2];
    const nextTo = [cx - dz / 2, cz + dx / 2];
    testMap.updateFenceGate(target.id, {
      from: nextFrom,
      to: nextTo
    });
    if (selectedFenceGateId === target.id) {
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
  } else if (target.type === 'fence_gate') {
    const gate = testMap.getFenceGate(target.id);
    if (gate) {
      testMap.updateFenceGate(target.id, { isFlippedLR: !gate.isFlippedLR });
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
  } else if (target.type === 'fence_gate') {
    const gate = testMap.getFenceGate(target.id);
    if (!gate) return;
    const copy = testMap.addFenceGate({
      ...JSON.parse(JSON.stringify(gate)),
      id: undefined,
      fenceId: null,
      from: [(gate.from?.[0] || 0) + 0.5, (gate.from?.[1] || 0) + 0.5],
      to: [(gate.to?.[0] || 0) + 0.5, (gate.to?.[1] || 0) + 0.5],
      floorId: testMap.floorplan.currentFloorId,
      locked: false
    });
    nextSelection = { type: 'fence_gate', id: copy.id };
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
  if (target.type === 'fence_gate') testMap.deleteFenceGate(target.id);
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
  if (target.type === 'fence_gate') selectFenceGate(target.id);
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
  setEditHandleDragState(null);
  drag3DState = null;
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);

  let needBuild = false;
  testMap.floorplan.openings.forEach((op) => {
    if (op.isDragging) {
      op.isDragging = false;
      needBuild = true;
    }
  });
  if (needBuild) {
    testMap.build();
  }
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

// 2D 户型图平面渲染逻辑已抽离至 Render2D.js


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
  DragHandler.beginStructureDrag(event, type, id);
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
  DragHandler.beginRoomDrag(event, roomId);
}

function beginRoomResize(event, roomId, side) {
  DragHandler.beginRoomResize(event, roomId, side);
}

function moveRoomDrag(event) {
  DragHandler.moveRoomDrag(event);
}

function moveRoomResize(event) {
  DragHandler.moveRoomResize(event);
}

function finishRoomEdit() {
  DragHandler.finishRoomEdit();
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
  DragHandler.beginOpeningDrag(event, openingId);
}

function finishOpeningDrag() {
  DragHandler.finishOpeningDrag();
}

function canPlaceOnTable(item, definition) {
  return Topology.canPlaceOnTable(item, definition);
}

function findTableBelow(item) {
  return Topology.findTableBelow(
    item,
    testMap.floorplan.items,
    testMap.floorplan.currentFloorId,
    (type) => testMap.getFurnitureDefinition(type)
  );
}

function moveItemTo(itemId, x, z) {
  entityManager.moveItemTo(itemId, x, z);
}

function beginWallDrag(event, wallId) {
  DragHandler.beginWallDrag(event, wallId);
}

function finishWallDrag() {
  DragHandler.finishWallDrag();
}

function moveWallBy(wallId, dx, dz) {
  DragHandler.moveWallBy(wallId, dx, dz);
}
// SVG 事件绑定已迁移至 SvgEvents.js 中管理

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

function findFenceGateIdFromNode(node) {
  return findMetadataFromNode(node, 'blueprintFenceGateId');
}

function groundPointFromPointer() {
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0;
  return viewer3d.groundPointFromPointer(floorY);
}

// 3D 交互手柄逻辑已抽离至 Viewer3DHandles.js

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
    if (mode === 'draw-wall' || mode === 'delete-wall' || isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || isAddOpeningMode() || mode.startsWith('draw-fence')) {
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
    if (mode.startsWith('draw-fence')) {
      const target = pickNearest3DTarget();
      if (target && target.type === 'stairs') {
        pushHistory();
        addRailingToStairs(target.id, mode.replace('draw-fence-', '') || 'picket_wood');
        clear2DStairsRailingPreview();
        clear3DStairsRailingPreview();
        clear2DFloorEdgeRailingPreview();
        clear3DFloorEdgeRailingPreview();
        switchToSelectMode();
        event.preventDefault();
        return;
      }
      
      const point = groundPointFromPointer();
      if (point) {
        const edges = getFreeFloorEdges();
        let bestEdge = null;
        let minDist = Infinity;
        edges.forEach((edge) => {
          const dist = pointToSegmentDistance({ x: point.x, z: point.z }, [edge.p1.x, edge.p1.z], [edge.p2.x, edge.p2.z]);
          if (dist < minDist) {
            minDist = dist;
            bestEdge = edge;
          }
        });
        
        if (bestEdge && minDist < 0.4) {
          pushHistory();
          const subtype = mode.replace('draw-fence-', '') || 'picket_wood';
          const fence = testMap.addFence({
            floorId: testMap.floorplan.currentFloorId,
            from: [bestEdge.p1.x, bestEdge.p1.z],
            to: [bestEdge.p2.x, bestEdge.p2.z],
            subtype: subtype
          });
          clear2DStairsRailingPreview();
          clear3DStairsRailingPreview();
          clear2DFloorEdgeRailingPreview();
          clear3DFloorEdgeRailingPreview();
          selectFence(fence.id);
          switchToSelectMode();
          event.preventDefault();
          return;
        }
      }
    }
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
          const roofBounds = Topology.calculateAutoRoofBounds(room, { x: snapped.x, z: snapped.z }, wallThickness);
          const roof = testMap.addRoof({
            x: roofBounds.x,
            z: roofBounds.z,
            width: roofBounds.width,
            depth: roofBounds.depth,
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
  
  if (mode.startsWith('add-fence-gate')) {
    const target = pickNearest3DTarget();
    if (target && target.type === 'fence') {
      const fence = testMap.getFence(target.id);
      const pt = target.pick.pickedPoint;
      if (fence && pt) {
        pushHistory();
        const { t } = Topology.projectPointToFence(pt, fence, false, 0);
        const subtype = mode.replace('add-fence-gate-', '') || 'picket_wood';
        const gate = testMap.addFenceGate({
          floorId: testMap.floorplan.currentFloorId,
          fenceId: fence.id,
          t: t,
          width: 1.0,
          subtype: subtype
        });
        refreshShadows();
        selectFenceGate(gate.id);
        switchToSelectMode();
        event.preventDefault();
        return;
      }
    }

    const point = groundPointFromPointer();
    if (point) {
      pushHistory();
      const snapped = snapToGridSegmentCenter({ x: point.x, z: point.z });
      const subtype = mode.replace('add-fence-gate-', '') || 'picket_wood';
      const gate = testMap.addFenceGate({
        floorId: testMap.floorplan.currentFloorId,
        from: [snapped.x - 0.5, snapped.z],
        to: [snapped.x + 0.5, snapped.z],
        width: 1.0,
        subtype: subtype
      });
      refreshShadows();
      selectFenceGate(gate.id);
      switchToSelectMode();
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
    opening.isDragging = true;
    testMap.build();
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
  if (target.type === 'fence_gate') {
    selectFenceGate(target.id);
    const gate = testMap.getFenceGate(target.id);
    const groundPoint = groundPointFromPointer();
    if (!gate || gate.locked || !groundPoint) return;
    drag3DState = {
      type: 'fence_gate',
      gateId: target.id,
      pointerId: event.pointerId,
      originalFrom: [...gate.from],
      originalTo: [...gate.to],
      originalFenceId: gate.fenceId,
      originalT: gate.t,
      startX: groundPoint.x,
      startZ: groundPoint.z,
      historyPushed: false
    };
    document.body.classList.add('is-dragging-3d');
    canvas.setPointerCapture?.(event.pointerId);
    camera.detachControl(canvas);
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
    DragHandler.moveOpeningToWorld(drag3DState.openingId, { x: groundPoint.x, z: groundPoint.z }, drag3DState);
  } else if (drag3DState.type === 'roof' || drag3DState.type === 'stairs') {
    const nextX = groundPoint.x + drag3DState.offsetX;
    const nextZ = groundPoint.z + drag3DState.offsetZ;
    if (!drag3DState.historyPushed && Math.hypot(nextX - drag3DState.originalX, nextZ - drag3DState.originalZ) > 0.02) {
      pushHistory();
      drag3DState.historyPushed = true;
    }
    moveStructureTo(drag3DState.type, drag3DState.structureId, nextX, nextZ, { rebuild: false, refresh: false });
  } else if (drag3DState.type === 'fence_gate') {
    DragHandler.moveFenceGateToWorld(drag3DState.gateId, { x: groundPoint.x, z: groundPoint.z }, drag3DState);
  }
  pointerInfo.event.preventDefault();
}

function end3DDrag(event) {
  if (!drag3DState) return;
  if (event?.pointerId !== undefined && drag3DState.pointerId !== event.pointerId) return;
  canvas.releasePointerCapture?.(drag3DState.pointerId);
  const openingId = drag3DState.type === 'opening' ? drag3DState.openingId : null;
  if (openingId) {
    const opening = testMap.getOpening(openingId);
    if (opening) {
      opening.isDragging = false;
    }
  }
  const fenceGateId = drag3DState.type === 'fence_gate' ? drag3DState.gateId : null;
  const roofId = drag3DState.type === 'roof' ? drag3DState.structureId : null;
  const stairsId = drag3DState.type === 'stairs' ? drag3DState.structureId : null;
  const completedEditHandle = drag3DState.type === 'edit-handle' ? getEditHandleDragState() : null;
  const editTarget = drag3DState.type === 'edit-handle' ? active3DEditTarget : null;
  drag3DState = null;
  setEditHandleDragState(null);
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);
  if (openingId || fenceGateId) {
    testMap.build();
    refreshShadows();
    if (openingId) selectOpening(openingId);
    if (fenceGateId) selectFenceGate(fenceGateId);
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
    if (mode.startsWith('draw-fence')) {
      const target = pickNearest3DTarget();
      if (target && target.type === 'stairs') {
        update3DStairsRailingPreview(target.id, mode.replace('draw-fence-', '') || 'picket_wood');
        clear3DFloorEdgeRailingPreview();
        // 只清空普通画墙体/栅栏指示圆柱，保留楼梯预览
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
      } else {
        clear3DStairsRailingPreview();
        const point = groundPointFromPointer();
        if (point) {
          const edges = getFreeFloorEdges();
          let bestEdge = null;
          let minDist = Infinity;
          let bestIndex = -1;
          edges.forEach((edge, i) => {
            const dist = pointToSegmentDistance({ x: point.x, z: point.z }, [edge.p1.x, edge.p1.z], [edge.p2.x, edge.p2.z]);
            if (dist < minDist) {
              minDist = dist;
              bestEdge = edge;
              bestIndex = i;
            }
          });

          if (bestEdge && minDist < 0.4) {
            update3DFloorEdgeRailingPreview(bestIndex, bestEdge, mode.replace('draw-fence-', '') || 'picket_wood');
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
          } else {
            clear3DFloorEdgeRailingPreview();
            const snapped = snapWorldPoint({ x: point.x, z: point.z });
            updateDrawWallPreview(snapped);
          }
        } else {
          clear3DFloorEdgeRailingPreview();
          clearDrawWallPreview();
        }
      }
    } else if (mode === 'draw-wall') {
      clear3DStairsRailingPreview();
      clear3DFloorEdgeRailingPreview();
      const point = groundPointFromPointer();
      if (point) {
        const snapped = snapWorldPoint({ x: point.x, z: point.z });
        updateDrawWallPreview(snapped);
      } else {
        clearDrawWallPreview();
      }
    } else {
      clear3DStairsRailingPreview();
      clear3DFloorEdgeRailingPreview();
      clearDrawWallPreview();
    }
    move3DDrag(pointerInfo);
  }
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) end3DDrag(pointerInfo.event);
});

canvas.addEventListener('pointercancel', end3DDrag);
window.addEventListener('pointerup', end3DDrag);

// ==========================================
// 没有墙体的地板边缘自动识别与悬浮预览 (NEW)
// ==========================================

function getFreeFloorEdges() {
  return Topology.getFreeFloorEdges(currentRooms(), currentWalls());
}

function clear2DFloorEdgeRailingPreview() {
  if (floorEdgeRailingPreview2DGroup) {
    floorEdgeRailingPreview2DGroup.innerHTML = '';
    floorEdgeRailingPreview2DGroup.remove();
    floorEdgeRailingPreview2DGroup = null;
  }
}

function clear3DFloorEdgeRailingPreview() {
  if (floorEdgeRailingPreview3DGroup) {
    floorEdgeRailingPreview3DGroup.dispose(false, true);
    floorEdgeRailingPreview3DGroup = null;
  }
  currentPreviewFloorEdgeIndex = null;
}

function update2DFloorEdgeRailingPreview(fromX, fromZ, toX, toZ, index) {
  clear2DFloorEdgeRailingPreview();
  floorEdgeRailingPreview2DGroup = createSvgElement('g', { id: 'floor-edge-railing-preview-group' });
  
  const a = worldToSvg(fromX, fromZ);
  const b = worldToSvg(toX, toZ);
  const line = createSvgElement('line', {
    x1: a.x, y1: a.y,
    x2: b.x, y2: b.y,
    stroke: 'rgba(141, 110, 99, 0.65)',
    'stroke-width': 3,
    'stroke-dasharray': '5,5'
  });
  floorEdgeRailingPreview2DGroup.appendChild(line);
  svg.appendChild(floorEdgeRailingPreview2DGroup);
}

function update3DFloorEdgeRailingPreview(edgeIndex, edge, fenceSubtype) {
  if (currentPreviewFloorEdgeIndex === edgeIndex && floorEdgeRailingPreview3DGroup) {
    return;
  }
  clear3DFloorEdgeRailingPreview();
  currentPreviewFloorEdgeIndex = edgeIndex;
  floorEdgeRailingPreview3DGroup = new BABYLON.TransformNode("floor_edge_railing_preview_group", scene);

  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.floorplan.currentFloorId) : 0;
  const p1 = edge.p1;
  const p2 = edge.p2;
  
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len <= 0.01) return;

  const angle = Math.atan2(dz, dx);
  const fenceNode = new BABYLON.TransformNode("floor_edge_rail_preview", scene);
  fenceNode.parent = floorEdgeRailingPreview3DGroup;
  
  // 设置位置在中点
  fenceNode.position.set((p1.x + p2.x) / 2, floorY, (p1.z + p2.z) / 2);
  fenceNode.rotation.y = -angle;

  const previewMaterial = new BABYLON.StandardMaterial("floor_edge_preview_mat", scene);
  previewMaterial.diffuseColor = BABYLON.Color3.FromHexString('#8d6e63');
  previewMaterial.alpha = 0.55;
  previewMaterial.backFaceCulling = false;

  buildFenceGeometry(
    testMap,
    fenceNode,
    {
      id: `preview_floor_edge_fence_${edgeIndex}`,
      subtype: fenceSubtype,
      tilt: 0
    },
    previewMaterial,
    len,
    1.1,
    0.1
  );
}

// ==========================================
// 楼梯自动扶手识别与添加 & 悬浮预览逻辑 (NEW)
// ==========================================

function clear2DStairsRailingPreview() {
  if (stairsRailingPreview2DGroup) {
    stairsRailingPreview2DGroup.innerHTML = '';
    stairsRailingPreview2DGroup.remove();
    stairsRailingPreview2DGroup = null;
  }
}

function clear3DStairsRailingPreview() {
  if (stairsRailingPreview3DGroup) {
    stairsRailingPreview3DGroup.dispose(false, true);
    stairsRailingPreview3DGroup = null;
  }
  currentPreviewStairsId = null;
}

function update2DStairsRailingPreview(stairs, fenceSubtype) {
  if (!stairsRailingPreview2DGroup) {
    stairsRailingPreview2DGroup = createSvgElement('g', { id: 'stairs-railing-preview' });
    svg.appendChild(stairsRailingPreview2DGroup);
  } else {
    stairsRailingPreview2DGroup.innerHTML = '';
  }

  const segments = Topology.getStairsRailingSegments(stairs, testMap);

  segments.forEach(seg => {
    const a = worldToSvg(seg.from[0], seg.from[1]);
    const b = worldToSvg(seg.to[0], seg.to[1]);
    const line = createSvgElement('line', {
      x1: a.x, y1: a.y,
      x2: b.x, y2: b.y,
      stroke: 'rgba(141, 110, 99, 0.65)',
      'stroke-width': 3,
      'stroke-dasharray': '5,5'
    });
    stairsRailingPreview2DGroup.appendChild(line);
  });
}

function update3DStairsRailingPreview(stairsId, fenceSubtype) {
  if (currentPreviewStairsId === stairsId && stairsRailingPreview3DGroup) {
    return;
  }
  clear3DStairsRailingPreview();

  const stairs = testMap.getStairs(stairsId);
  if (!stairs) return;

  currentPreviewStairsId = stairsId;
  stairsRailingPreview3DGroup = new BABYLON.TransformNode("stairs_railing_preview_group", scene);

  const floorId = stairs.floorId;
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(floorId) : 0;
  const stairsOffset = testMap.getStairsElevationOffset ? testMap.getStairsElevationOffset(stairs) : 0;

  const railsData = Topology.getStairsRailingSegments(stairs, testMap);

  const previewMaterial = new BABYLON.StandardMaterial("stairs_railing_preview_mat", scene);
  previewMaterial.diffuseColor = BABYLON.Color3.FromHexString('#8d6e63');
  previewMaterial.alpha = 0.55;
  previewMaterial.backFaceCulling = false;

  railsData.forEach((data, index) => {
    const [x1, z1] = data.from;
    const [x2, z2] = data.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len <= 0.01) return;

    const angle = Math.atan2(dz, dx);
    const fenceNode = new BABYLON.TransformNode(`stairs_rail_preview_${index}`, scene);
    
    let renderLength = len;
    if (data.tilt) {
      renderLength = len / Math.cos(data.tilt);
    }

    const tempFence = {
      id: `preview_temp_${index}`,
      subtype: fenceSubtype,
      height: 1.1,
      thickness: 0.1
    };

    if (typeof buildFenceGeometry === 'function') {
      buildFenceGeometry(testMap, fenceNode, tempFence, previewMaterial, renderLength, 1.1, 0.1);
    }

    const fenceOffset = stairsOffset + (data.yOffset || 0);
    fenceNode.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
    fenceNode.rotation.y = -angle;
    if (data.tilt) {
      fenceNode.rotation.z = data.tilt;
    }

    fenceNode.parent = stairsRailingPreview3DGroup;
    fenceNode.getChildMeshes().forEach(mesh => {
      mesh.isPickable = false;
      mesh.material = previewMaterial;
    });
  });

  stairsRailingPreview3DGroup.parent = testMap.root;
}

function addRailingToStairs(stairsId, fenceSubtype) {
  const stairs = testMap.getStairs(stairsId);
  if (!stairs) return;

  const segments = Topology.getStairsRailingSegments(stairs, testMap);
  segments.forEach(seg => {
    testMap.addFence({
      floorId: stairs.floorId,
      from: seg.from,
      to: seg.to,
      subtype: fenceSubtype,
      tilt: seg.tilt,
      yOffset: seg.yOffset
    });
  });
}

function clearDrawWallPreview() {
  clear2DStairsRailingPreview();
  clear3DStairsRailingPreview();
  clear2DFloorEdgeRailingPreview();
  clear3DFloorEdgeRailingPreview();
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(null);
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(null);
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(wallId);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(null);
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(null);
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(null);
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(null);
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
  selectedFenceGateId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(fenceId);
  testMap.setSelectedFenceGate(null);
  if (fenceId) set3DEditTarget('fence', fenceId);
  updateEditor();
  renderPlan();
}

function selectFenceGate(gateId) {
  clear3DEditHandles();
  selectedFenceGateId = gateId;
  selectedFenceId = null;
  selectedRoofId = null;
  selectedStairsId = null;
  selectedRoomId = null;
  selectedWallId = null;
  selectedItemId = null;
  selectedOpeningId = null;
  testMap.setSelectedItem(null);
  testMap.setSelectedWall(null);
  testMap.setSelectedFence(null);
  testMap.setSelectedFenceGate(gateId);
  updateEditor();
  renderPlan();
}

function currentFences() {
  return testMap.floorplan.fences || [];
}

function beginFenceResize(event, fenceId, handle) {
  DragHandler.beginFenceHandleDrag(event, fenceId, handle);
}

function beginFenceDrag(event, fenceId) {
  DragHandler.beginFenceDrag(event, fenceId);
}

function moveFenceBy(fenceId, dx, dz) {
  DragHandler.moveFenceBy(fenceId, dx, dz);
}

function finishFenceDrag() {
  DragHandler.finishFenceDrag();
}

function beginFenceGateDrag(event, gateId) {
  DragHandler.beginFenceGateDrag(event, gateId);
}

function finishFenceGateDrag() {
  DragHandler.finishFenceGateDrag();
}

function updateSelectedFenceGatePreview(patch) {
  if (!selectedFenceGateId) return;
  if (testMap.getFenceGate(selectedFenceGateId)?.locked && !('locked' in patch)) return;
  testMap.updateFenceGate(selectedFenceGateId, patch, false);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFenceGate(patch) {
  if (!selectedFenceGateId) return;
  if (testMap.getFenceGate(selectedFenceGateId)?.locked && !('locked' in patch)) return;
  pushHistory();
  testMap.updateFenceGate(selectedFenceGateId, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function deleteSelectedFenceGate() {
  if (!selectedFenceGateId) return;
  if (testMap.getFenceGate(selectedFenceGateId)?.locked) return;
  pushHistory();
  testMap.deleteFenceGate(selectedFenceGateId);
  clearSelection();
  refreshShadows();
  renderPlan();
}

function applyMaterialToFenceGateFrame(material) {
  if (!selectedFenceGateId || !material) return;
  if (isTargetLocked({ type: 'fence_gate', id: selectedFenceGateId })) {
    showToast('该物体已锁定');
    return;
  }
  pushHistory();
  const color = typeof material === 'string' ? material : (material.color || '#ffffff');
  const matVal = typeof material === 'string' ? material : (material.url || color);
  testMap.updateFenceGate(selectedFenceGateId, { frameMaterial: matVal });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function applyMaterialToFenceGatePanel(material) {
  if (!selectedFenceGateId || !material) return;
  if (isTargetLocked({ type: 'fence_gate', id: selectedFenceGateId })) {
    showToast('该物体已锁定');
    return;
  }
  pushHistory();
  const color = typeof material === 'string' ? material : (material.color || '#ffffff');
  const matVal = typeof material === 'string' ? material : (material.url || color);
  testMap.updateFenceGate(selectedFenceGateId, { panelMaterial: matVal });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function findNearestSeat(mannequinItem) {
  return Topology.findNearestSeat(
    mannequinItem,
    testMap.floorplan.items,
    (type) => testMap.getFurnitureDefinition(type)
  );
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
    patch.curve = Number(document.getElementById('structure-curve')?.value || 0);
    const eleInput = document.getElementById('structure-elevation');
    if (eleInput) {
      patch.elevation = Number(eleInput.value);
    }
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

function updateSelectedFenceYOffset() {
  if (!selectedFenceId) return;
  if (testMap.getFence(selectedFenceId)?.locked) return;
  pushHistory();
  testMap.updateFence(selectedFenceId, { yOffset: Number(document.getElementById('fence-yoffset').value) });
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
  const fence = testMap.getFence(selectedFenceId);
  const defaultColor = (fence && fence.subtype === 'concrete') ? '#f9fbff' : '#8d6e63';
  const color = material.color || defaultColor;
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
  handleHotkeys(event, {
    currentView,
    camera,
    BABYLON,
    view,
    hasUserZoomedOrPanned,
    setHasUserZoomedOrPanned: (val) => { hasUserZoomedOrPanned = val; },
    renderPlan,
    selectedItemId,
    entityManager,
    selectedOpeningId,
    testMap,
    updateEditor,
    selectedWallId,
    selectedRoomId,
    showCustomConfirm,
    clearSelection,
    refreshShadows,
    selectedRoofId,
    selectedStairsId,
    selectedFenceId,
    takePhoto,
    undo,
    redo,
    getSelectedTarget,
    toggleTargetLock,
    copyContextTarget,
    rotateContextTarget,
    isAllowedContextTarget,
    isTargetLocked,
    pushHistory,
    INCHES_PER_UNIT
  });
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
  event.preventDefault();
  if (mode === 'draw-wall' || mode === 'delete-wall' || isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || isAddOpeningMode() || mode.startsWith('draw-fence')) {
    drawStart = null;
    clearDrawWallPreview();
    switchToSelectMode();
    event.stopPropagation();
    return;
  }
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
  DragHandler.clearAllDragStates();
  entityManager.itemGestureState = null;
  activePointers.clear();
  SvgEvents.resetSvgInteractionState();
  end3DDrag();
}

// 文件的导入导出与 LocalStorage 项目管理已迁移至 FileManager.js 中管理

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
// 自定义下拉选择器组件
// ==========================================

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
  selectedFenceGateId,
  
  updateSelectedSize,
  updateSelectedOpening,
  updateSelectedFenceGate,
  updateSelectedFenceGatePreview,
  deleteSelectedFenceGate,
  updateSelectedFenceSubtype,
  updateSelectedFenceLength,
  updateSelectedFenceHeight,
  updateSelectedFenceColor,
  updateSelectedFenceYOffset,
  
  applyMaterialToRoomFloor,
  applyMaterialToWallFront,
  applyMaterialToWallBack,
  applyMaterialToStructure,
  applyMaterialToItemComponent,
  applyMaterialToFence,
  applyMaterialToFenceGateFrame,
  applyMaterialToFenceGatePanel,
  
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
