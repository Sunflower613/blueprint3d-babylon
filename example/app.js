import * as RailingPreview from './js/RailingPreview.js';
import * as PropertyManager from './js/PropertyManager.js';
import * as UiControls from './js/UiControls.js';
import * as FloorManager from './js/FloorManager.js';
import * as Drag3DContext from './js/Drag3DContext.js';
import * as SelectionManager from './js/SelectionManager.js';
import { initAppEventBindings } from './js/AppEventBindings.js';
import * as DesignController from './js/DesignController.js';
import { initCanvas3DController, begin3DDrag, move3DDrag, end3DDrag, getCanvasPickFromEvent } from './js/Canvas3DController.js';
import * as ViewController from './js/ViewController.js';
import * as InteractionHelpers from './js/InteractionHelpers.js';

const {
  getFreeFloorEdges, clear2DFloorEdgeRailingPreview, clear3DFloorEdgeRailingPreview,
  update2DFloorEdgeRailingPreview, update3DFloorEdgeRailingPreview,
  clear2DStairsRailingPreview, clear3DStairsRailingPreview,
  update2DStairsRailingPreview, update3DStairsRailingPreview,
  addRailingToStairs, clearDrawWallPreview, updateDrawWallPreview
} = RailingPreview;
const {
  selectTarget, clearSelection, selectRoom, selectWall, selectItem,
  selectOpening, selectRoof, selectStairs, selectFence, selectFenceGate
} = SelectionManager;
const {
  syncRotationInputs, previewSelectedStructureRotation,
  commitSelectedStructureRotation, getRotatedWallEndpoints,
  previewSelectedWallRotation, previewSelectedFenceRotation, updateSelectedStructure,
  updateSelectedStructureRotation, deleteSelectedStructure, updateSelectedRoom,
  updateSelectedFloor, updateSkyboxFromCurrentFloor, updateSelectedFenceSubtype,
  updateSelectedFenceLength, updateSelectedFenceRotation, updateSelectedFenceHeight,
  updateSelectedFenceYOffset, updateSelectedFenceColor, deleteSelectedFence,
  updateSelectedWallLength, updateSelectedWallRotation, updateSelectedRotation,
  updateSelectedScale, updateSelectedSize, updateSelectedPose, updateSelectedOpening
} = PropertyManager;
const normalizeRotationDegrees = (degrees, useSnap = snapEnabled) => PropertyManager.normalizeRotationDegrees(degrees, useSnap);
const { isAddRoomMode, roomShapeFromMode, getOpeningModeInfo, isAddOpeningMode, handleModeChange, switchToSelectMode, setDesignMode, getPickedColorFromTarget, executeDesignTool } = DesignController;
const {
  updateHistoryButtons, getMeshFloorId, refreshShadows, resetCamera, clear3DGrid,
  refresh3DGrid, resetCurrentMaterial, setView, snapValue, snapWorldPoint,
  snapToGridSegmentCenter, snapNumber, currentRooms, currentWalls, referenceFloorWalls,
  currentOpenings, currentItems, currentRoofs, currentStairs, getFloorEntityCount,
  ensureVisibleCurrentFloor, makeButton, hideContextMenu, showIconMenu, cancelLongPress,
  handlePointerCancel, attachContextMenuTrigger, getSelectedTarget,
  cancelObjectInteractions, snapRoomPosition, updateViewBounds
} = ViewController;
const { showFloorContextMenu, moveFloorAction, deleteFloorAction, renameCurrentFloor, formatFloorDisplayName, syncFloorControls } = FloorManager;
const {
  getStructure, updateStructure, moveStructureTo, renderPlanItem, beginRoofResize,
  moveRoofResize, finishRoofResize, rememberPointer, updatePointer, forgetPointer,
  pointerDistance, pointerAngle, canPlaceOnTable, findTableBelow, findBookshelfNearby,
  snapToBookshelf, getShelfLayerHeights, getItemsCountOnBookshelf, moveItemTo,
  findMetadataFromNode, findRoofComponentIdFromNode, findOpeningIdFromNode,
  findItemIdFromNode, findWallIdFromNode, findRoomIdFromNode, findRoofIdFromNode,
  findStairsIdFromNode, findFenceIdFromNode, findFenceGateIdFromNode,
  groundPointFromPointer, findWallSideFromNode, get2DWallSideFromPoint
} = InteractionHelpers;
const {
  validateUploadedFurniture, registerCustomFurniture, saveCustomFurnitureToLocalStorage,
  restoreCustomFurnitureFromLocalStorage, loadUploadedFurniture, initFurnitureUpload,
  renderFurnitureGrid, cleanFloorplanMaterials, cleanMaterialLibraryForStorage, restoreFloorplanMaterials
} = UiControls;
import { ensure3DGridControls, ensureStructureEditor, updateEditor, initUiEventListeners, updateDesignCursor } from './js/EditorUi.js';
import { initEditorUiContext } from './js/EditorUiContext.js';
import { showCustomConfirm, showCustomAlert, showCustomPrompt, showProjectListModal, show3MFExportDialog, showFurnitureUploadHelp, showAiBuildingHelp } from './js/Dialogs.js';
import { createCustomDropdown } from './js/Dropdown.js';
import { handleHotkeys } from './js/Hotkeys.js';
import { Store, showToast, formatTimestamp, readLocalSave } from './js/Store.js';
import { EntityManager } from './js/EntityManager.js';
import { Viewer3D } from './js/Viewer3D.js';
import * as DragHandler from './js/DragHandler.js';
import * as SvgEvents from './js/SvgEvents.js';
import * as FileManager from './js/FileManager.js';
import { takePhoto, updateLocalProjectCount } from './js/FileManager.js';
import { iconSvg } from './js/Icons.js';
import { TARGET_TYPES } from './js/types.js';
import {
  initTargetHandler,
  isAllowedTarget,
  getTargetObject,
  isTargetLocked,
  setTargetLocked,
  getTargetFloorId,
  isTargetOnCurrentFloor,
  get2DTargetFromElement,
  isSwitchableTarget,
  isLightingTarget,
  pickColorFromContextMenu,
  showObjectContextMenu,
  toggleTargetLock,
  toggleTarget,
  rotateTarget,
  mirrorTarget,
  copyTarget,
  deleteTarget,
  selectTargetDescriptor,
  get3DTarget,
} from './js/TargetHandler.js';
import {
  initMaterialManager,
  updateComponentMaterial,
  applyMaterialToItemComponent,
  renderMaterialLibrary,
  saveCustomMaterialToLocalStorage,
  removeCustomMaterialFromLocalStorage,
  extractMaterial,
  applyMaterial,
  loadCustomColorMaterials,
  setCustomColorMaterials,
  isCustomColorMaterial
} from './js/MaterialManager.js';
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
  updateHandleHoverState
} from './js/Viewer3DHandles.js';
import {
  playWindChimeSound,
  Color3,
  MeshBuilder,
  PointerEventTypes,
  StandardMaterial,
  TransformNode,
  Vector3,
  Tools,
  createEditor,
  BLUEPRINT3D_TEST_FLOORPLAN,
  DragHandler as LibDragHandler,
  Viewer3DHandles as LibViewer3DHandles,
  Topology,
  sampleData,
  FENCE_SUBTYPE_DEFAULTS,
  FURNITURE_DEFINITIONS,
  FURNITURE_LIST,
  DEFAULT_MATERIAL_PACKS,
  createTextureMaterialDescriptor,
  getRoomVertices,
  pointInRoom,
  isSymmetricShape
} from '../src/index.js';

const BABYLON = { Color3, MeshBuilder, PointerEventTypes, StandardMaterial, TransformNode, Vector3, Tools };
window.FURNITURE_LIST = FURNITURE_LIST;


const SVG_NS = 'http://www.w3.org/2000/svg';
const INCHES_PER_UNIT = 39.37;
const view = { width: 720, height: 520, pad: 42, minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 };
// groundPlane 宸茬Щ鑷?Viewer3D

let mode = 'select';

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
// show3DGrid / grid3DNodes 已经移至 viewer3d 实例
let active3DEditTarget = null;
let snapSize = 1;
let activeMaterialDescriptor = null;
let designMode = 'select'; // 'select' | 'picker' | 'brush' | 'bucket' | 'eraser'
let designModeBrushLocked = false;
let materialLibrary = [...DEFAULT_MATERIAL_PACKS];
const activePointers = new Map();
let hasUserZoomedOrPanned = false;
let roomCounter = 1;
// 鎾ら攢/閲嶅仛鏍堝凡杩佺Щ鍒?Store.js 绠＄悊
let floorPanelCollapsed = false;

let selectedTarget = { type: null, id: null };

import { ui, selection, editor } from './store/index.js';

// 定义声明式同步关系配置表，解耦硬编码赋值
const stateSyncMap = [
  [() => mode, v => mode = v, ui, 'mode'],
  [() => currentView, v => currentView = v, ui, 'currentView'],
  [() => designMode, v => designMode = v, ui, 'designMode'],
  [() => floorPanelCollapsed, v => floorPanelCollapsed = v, ui, 'floorPanelCollapsed'],
  [() => contextMenuElement, v => contextMenuElement = v, ui, 'contextMenuElement'],

  [() => selectedTarget, v => selectedTarget = v, selection, 'selectedTarget'],
  [() => selectedRoomId, v => selectedRoomId = v, selection, 'selectedRoomId'],
  [() => selectedWallId, v => selectedWallId = v, selection, 'selectedWallId'],
  [() => selectedItemId, v => selectedItemId = v, selection, 'selectedItemId'],
  [() => selectedOpeningId, v => selectedOpeningId = v, selection, 'selectedOpeningId'],
  [() => selectedRoofId, v => selectedRoofId = v, selection, 'selectedRoofId'],
  [() => selectedStairsId, v => selectedStairsId = v, selection, 'selectedStairsId'],
  [() => selectedFenceId, v => selectedFenceId = v, selection, 'selectedFenceId'],
  [() => selectedFenceGateId, v => selectedFenceGateId = v, selection, 'selectedFenceGateId'],

  [() => drawStart, v => drawStart = v, editor, 'drawStart'],
  [() => drag3DState, v => drag3DState = v, editor, 'drag3DState'],
  [() => drawWallPreviewCylinder, v => drawWallPreviewCylinder = v, editor, 'drawWallPreviewCylinder'],
  [() => drawWallPreviewStartCylinder, v => drawWallPreviewStartCylinder = v, editor, 'drawWallPreviewStartCylinder'],
  [() => drawWallPreviewWall, v => drawWallPreviewWall = v, editor, 'drawWallPreviewWall'],
  [() => roofResizeState, v => roofResizeState = v, editor, 'roofResizeState'],
  [() => stairsRailingPreview2DGroup, v => stairsRailingPreview2DGroup = v, editor, 'stairsRailingPreview2DGroup'],
  [() => stairsRailingPreview3DGroup, v => stairsRailingPreview3DGroup = v, editor, 'stairsRailingPreview3DGroup'],
  [() => currentPreviewStairsId, v => currentPreviewStairsId = v, editor, 'currentPreviewStairsId'],
  [() => floorEdgeRailingPreview2DGroup, v => floorEdgeRailingPreview2DGroup = v, editor, 'floorEdgeRailingPreview2DGroup'],
  [() => floorEdgeRailingPreview3DGroup, v => floorEdgeRailingPreview3DGroup = v, editor, 'floorEdgeRailingPreview3DGroup'],
  [() => currentPreviewFloorEdgeIndex, v => currentPreviewFloorEdgeIndex = v, editor, 'currentPreviewFloorEdgeIndex'],
  [() => longPressState, v => longPressState = v, editor, 'longPressState'],
  [() => snapEnabled, v => snapEnabled = v, editor, 'snapEnabled'],
  [() => active3DEditTarget, v => active3DEditTarget = v, editor, 'active3DEditTarget'],
  [() => snapSize, v => snapSize = v, editor, 'snapSize']
];

function syncLocalToStore() {
  // 1. 将 app.js 的最新局部变量值同步到对应 Store 字段
  for (const [getLocal, setLocal, store, key] of stateSyncMap) {
    store[key] = getLocal();
  }

  // 2. 同步当前激活材质描述
  if (editor.activeMaterialDescriptor) {
    activeMaterialDescriptor = editor.activeMaterialDescriptor;
  } else if (activeMaterialDescriptor) {
    editor.activeMaterialDescriptor = activeMaterialDescriptor;
  }

  // 3. 同步材质库快照
  if (editor.materialLibrary && editor.materialLibrary.length > 0) {
    materialLibrary = editor.materialLibrary;
  } else {
    editor.materialLibrary = materialLibrary;
  }
}


/** @type {AppState} */
const appState = {
  ui,
  selection,
  editor,

  get testMap() { return testMap; },
  get entityManager() { return entityManager; },
  get dragHandler() { return dragHandler; },
  get viewer3DHandles() { return viewer3DHandles; },

  get mode() { return mode; },
  set mode(v) { mode = v; },
  get currentView() { return currentView; },
  set currentView(v) { currentView = v; },
  get designMode() { return designMode; },
  set designMode(v) { designMode = v; },
  get designModeBrushLocked() { return designModeBrushLocked; },
  set designModeBrushLocked(v) { designModeBrushLocked = v; },
  get snapEnabled() { return snapEnabled; },
  get snapSize() { return snapSize; },

  executeDesignTool: (target) => executeDesignTool(target),
  setDesignMode: (newMode, fromDblClick = false) => setDesignMode(newMode, fromDblClick),
  getPickedColorFromTarget: (target) => getPickedColorFromTarget(target),
  updateDesignCursor: (customColor) => updateDesignCursor(customColor),
  get viewer3d() { return viewer3d; },
  get scene() { return scene; },
  get camera() { return camera; },
  get engine() { return engine; },
  get refresh3DGrid() { return refresh3DGrid; },
  showToast: (msg) => showToast(msg),
  takePhoto: () => takePhoto(),
  dispose: () => {
    dragHandler?.dispose?.();
    viewer3DHandles?.dispose?.();
    testMap?.dispose?.();
    viewer3d?.dispose?.();
  },
  get drag3DState() { return drag3DState; },
  set drag3DState(v) { drag3DState = v; },

  get svg() { return svg; },
  get drawStart() { return drawStart; },
  set drawStart(v) { drawStart = v; },
  get drawWallPreviewCylinder() { return drawWallPreviewCylinder; },
  set drawWallPreviewCylinder(v) { drawWallPreviewCylinder = v; },
  get drawWallPreviewStartCylinder() { return drawWallPreviewStartCylinder; },
  set drawWallPreviewStartCylinder(v) { drawWallPreviewStartCylinder = v; },
  get drawWallPreviewWall() { return drawWallPreviewWall; },
  set drawWallPreviewWall(v) { drawWallPreviewWall = v; },
  get stairsRailingPreview2DGroup() { return stairsRailingPreview2DGroup; },
  set stairsRailingPreview2DGroup(v) { stairsRailingPreview2DGroup = v; },
  get stairsRailingPreview3DGroup() { return stairsRailingPreview3DGroup; },
  set stairsRailingPreview3DGroup(v) { stairsRailingPreview3DGroup = v; },
  get currentPreviewStairsId() { return currentPreviewStairsId; },
  set currentPreviewStairsId(v) { currentPreviewStairsId = v; },
  get floorEdgeRailingPreview2DGroup() { return floorEdgeRailingPreview2DGroup; },
  set floorEdgeRailingPreview2DGroup(v) { floorEdgeRailingPreview2DGroup = v; },
  get floorEdgeRailingPreview3DGroup() { return floorEdgeRailingPreview3DGroup; },
  set floorEdgeRailingPreview3DGroup(v) { floorEdgeRailingPreview3DGroup = v; },
  get currentPreviewFloorEdgeIndex() { return currentPreviewFloorEdgeIndex; },
  set currentPreviewFloorEdgeIndex(v) { currentPreviewFloorEdgeIndex = v; },
  currentRooms: () => currentRooms(),
  currentWalls: () => currentWalls(),

  get selectedRoomId() { return selectedRoomId; },
  set selectedRoomId(v) { selectedRoomId = v; },
  get selectedWallId() { return selectedWallId; },
  set selectedWallId(v) { selectedWallId = v; },
  get selectedItemId() { return selectedItemId; },
  set selectedItemId(v) { selectedItemId = v; },
  get selectedOpeningId() { return selectedOpeningId; },
  set selectedOpeningId(v) { selectedOpeningId = v; },
  get selectedRoofId() { return selectedRoofId; },
  set selectedRoofId(v) { selectedRoofId = v; },
  get selectedStairsId() { return selectedStairsId; },
  set selectedStairsId(v) { selectedStairsId = v; },
  get selectedFenceId() { return selectedFenceId; },
  set selectedFenceId(v) { selectedFenceId = v; },
  get selectedFenceGateId() { return selectedFenceGateId; },
  set selectedFenceGateId(v) { selectedFenceGateId = v; },

  pushHistory: () => pushHistory(),
  refreshShadows: () => refreshShadows(),
  updateEditor: () => updateEditor(),
  renderPlan: () => renderPlan(),
  clearSelection: () => clearSelection(),
  updateStructure: (type, id, patch, rebuild) => updateStructure(type, id, patch, rebuild),
  getStructure: (type, id) => getStructure(type, id),
  wallPointAt: (wallLike, t) => wallPointAt(wallLike, t),
  syncFloorControls: () => syncFloorControls(),
  getSelectedStructure: () => getSelectedStructure(),

  BABYLON,
  get activeMaterialDescriptor() { return activeMaterialDescriptor; },
  set activeMaterialDescriptor(v) { activeMaterialDescriptor = v; },
  get materialLibrary() { return materialLibrary; },
  set materialLibrary(v) { materialLibrary = v; },
  renderMaterialLibrary: (shouldReset) => renderMaterialLibrary(shouldReset),
  showFurnitureUploadHelp: () => showFurnitureUploadHelp(),
  showAiBuildingHelp: () => showAiBuildingHelp(),
  restoreFloorplanMaterials: (data) => restoreFloorplanMaterials(data),
  get floorPanelCollapsed() { return floorPanelCollapsed; },
  set floorPanelCollapsed(v) { floorPanelCollapsed = v; },
  get contextMenuElement() { return contextMenuElement; },
  set contextMenuElement(v) { contextMenuElement = v; },
  get longPressState() { return longPressState; },
  set longPressState(v) { longPressState = v; },
  get hasUserZoomedOrPanned() { return hasUserZoomedOrPanned; },
  set hasUserZoomedOrPanned(v) { hasUserZoomedOrPanned = v; },
  get roomCounter() { return roomCounter; },
  set roomCounter(v) { roomCounter = v; },
  get roofResizeState() { return roofResizeState; },
  set roofResizeState(v) { roofResizeState = v; },
  get view() { return view; },
  get store() { return store; },
  inchesToWorld: (value) => inchesToWorld(value),
  showIconMenu: (x, y, actions) => showIconMenu(x, y, actions),
  showCustomPrompt: (title, text, val) => showCustomPrompt(title, text, val),
  attachContextMenuTrigger: (element, getTarget, showMenu) => attachContextMenuTrigger(element, getTarget, showMenu),
  get canvas() { return canvas; },
  get DragHandler() { return DragHandler; },
  groundPointFromPointer: () => groundPointFromPointer(),
  selectOpening: (id) => selectOpening(id),
  selectRoom: (id) => selectRoom(id),
  selectWall: (id) => selectWall(id),
  selectRoof: (id) => selectRoof(id),
  selectStairs: (id) => selectStairs(id),
  selectFence: (id) => selectFence(id),
  selectFenceGate: (id) => selectFenceGate(id),
  selectItem: (id, focus) => selectItem(id, focus),
  same3DEditTarget: (type, id) => same3DEditTarget(type, id),
  set3DEditTarget: (type, id) => set3DEditTarget(type, id),
  get active3DEditTarget() { return active3DEditTarget; },
  set active3DEditTarget(v) { active3DEditTarget = v; },
  refresh3DEditHandles: () => refresh3DEditHandles(),
  getEditHandleDragState: () => getEditHandleDragState(),
  setEditHandleDragState: (v) => setEditHandleDragState(v),
  move3DEditHandle: (gp) => move3DEditHandle(gp),
  moveItemTo: (id, x, z) => moveItemTo(id, x, z),
  moveStructureTo: (type, id, x, z, opts) => moveStructureTo(type, id, x, z, opts),
  get selectedTarget() { return selectedTarget; },
  set selectedTarget(v) { selectedTarget = v; },
  clear3DEditHandles: () => clear3DEditHandles(),
  playWindChimeSound: () => playWindChimeSound(),
  syncLocalToStore: () => syncLocalToStore(),
  clearDrawWallPreview: () => clearDrawWallPreview(),
  setView: (value) => setView(value),
  setDesignMode: (value, locked) => setDesignMode(value, locked),
  switchToSelectMode: () => switchToSelectMode(),
  handleModeChange: (value) => handleModeChange(value),
  isDrawingMode: () => mode === 'draw-wall' || mode === 'delete-wall' || isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || isAddOpeningMode() || mode.startsWith('draw-fence'),
  readFileAsDataURL: (file) => readFileAsDataURL(file),
  saveCustomMaterialToLocalStorage: (id, src) => saveCustomMaterialToLocalStorage(id, src),
  undo: () => undo(),
  redo: () => redo(),
  getSelectedTarget: () => getSelectedTarget(),
  findWallSideFromNode: (node) => findWallSideFromNode(node),
  get2DWallSideFromPoint: (wall, point) => get2DWallSideFromPoint(wall, point),
  findRoofComponentIdFromNode: (node) => findRoofComponentIdFromNode(node),
  cancelLongPress: () => cancelLongPress(),
  handlePointerCancel: (event) => handlePointerCancel(event),
  hideContextMenu: () => hideContextMenu(),
  resetCamera: () => resetCamera(),
  resetCurrentMaterial: () => resetCurrentMaterial(),
  resetInteractionState: () => resetInteractionState(),
  cancelObjectInteractions: () => cancelObjectInteractions(),
  updateSkyboxFromCurrentFloor: () => updateSkyboxFromCurrentFloor(),
  extractMaterial: (target, select) => extractMaterial(target, select),
  applyMaterial: (target, modeName) => applyMaterial(target, modeName),
  isTargetLocked: (target) => isTargetLocked(target),
  DEFAULT_MATERIAL_PACKS,
  INCHES_PER_UNIT
};

RailingPreview.initRailingPreview(appState);
PropertyManager.initPropertyManager(appState);
UiControls.initUiControls(appState);
FloorManager.initFloorManager(appState);
Drag3DContext.initDrag3DContext(appState);
SelectionManager.initSelectionManager(appState);
DesignController.initDesignController(appState);
ViewController.initViewController(appState);
InteractionHelpers.initInteractionHelpers(appState);

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

// ========== 3D 娓叉煋寮曟搸锛圴iewer3D 灏佽锛?==========
const viewer3d = new Viewer3D(canvas);
const { engine, scene, camera, shadowGenerator } = viewer3d;

// 3D 杞?鎵嬫焺鍦ㄧ浉鏈虹Щ鍔ㄦ椂鍔ㄦ€佽皟鑺?scaling锛屼繚鎸佸湪灞忓箷涓婄殑鐗╃悊澶у皬鍥哄畾锛屼娇缂╂斁澶皬鏃朵篃鑳借交鏉鹃€変腑
scene.onBeforeRenderObservable.add(() => {
  const handles = getEditHandleNodes();
  if (currentView !== '3d' || handles.length === 0) return;
  const cameraPosition = camera.position;
  handles.forEach((node) => {
    if (node && !node.isDisposed()) {
      const distance = BABYLON.Vector3.Distance(cameraPosition, node.position);
      // 增大把手的缩放因子（由 0.08 提高至 0.13，最小限制由 0.1 提高至 0.16），使把手更加醒目和易于选中
      const factor = Math.max(0.16, distance * 0.13);
      node.scaling.set(factor, factor, factor);
    }
  });
});

let dragHandler = null;
let viewer3DHandles = null;

const initialLocalSave = readLocalSave();
if (initialLocalSave.buildingData) restoreFloorplanMaterials(initialLocalSave.buildingData);
let testMap = createEditor({
  scene,
  floorplan: initialLocalSave.buildingData || BLUEPRINT3D_TEST_FLOORPLAN,
  options: { renderingEnabled: false }
});
window.testMap = testMap;
testMap.editorFacade = testMap;
window.appState = appState;
dragHandler = new LibDragHandler(appState);
viewer3DHandles = new LibViewer3DHandles(appState);

const recoveredInitialFloor = ensureVisibleCurrentFloor({ reason: 'startup', silent: !initialLocalSave.buildingData });

// 鍒濆鍖栫墿浣撶鐞嗗櫒 EntityManager
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
      if (selectedTarget?.type !== 'item' || selectedTarget?.id !== id) {
        selectTarget(TARGET_TYPES.ITEM, id, true);
      }
    }
  },
  svgPointFromEvent: (event) => svgPointFromEvent(event),
  svgToWorld: (x, y) => svgToWorld(x, y),
  rememberPointer: (event) => rememberPointer(event),
  setPointerCapture: (pointerId) => svg.setPointerCapture(pointerId),
  activePointers: activePointers,
  pointerDistance: (a, b) => pointerDistance(a, b),
  pointerAngle: (a, b) => pointerAngle(a, b),
  canPlaceOnTable: (item, def) => Topology.canPlaceOnTable(item, def),
  findTableBelow: (item) => Topology.findTableBelow(item, testMap.getEntities('item'), testMap.getCurrentFloorId(), (type) => testMap.getFurnitureDefinition(type)),
  findNearestSeat: (item) => Topology.findNearestSeat(item, testMap.getEntities('item'), (type) => testMap.getFurnitureDefinition(type)),
  findBookshelfNearby: (item) => Topology.findBookshelfNearby(item, testMap.getEntities('item'), testMap.getCurrentFloorId(), (type) => testMap.getFurnitureDefinition(type)),
  snapToBookshelf: (item, bookshelf) => Topology.snapToBookshelf(item, bookshelf, (type) => testMap.getFurnitureDefinition(type)),
  getDrag3DState: () => drag3DState
});

const pushHistory = () => store.pushHistory();
const undo = () => store.undo();
const redo = () => store.redo();

Object.assign(appState, {
  shadowGenerator,
  SVG_NS,
  INCHES_PER_UNIT,
  activePointers,

  svgPointFromEvent,
  svgToWorld,
  snapRoomPosition,
  snapWorldPoint,
  snapNumber,
  updateViewBounds,
  pushHistory,
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
  updateStructure,
  moveStructureTo,
  rememberPointer,
  snapToGridSegmentCenter,
  getWallProjectionT,
  forgetPointer,
  updatePointer,
  finishRoofResize,
  switchToSelectMode,
  isAddRoomMode,
  roomShapeFromMode,
  addRailingToStairs,
  clear3DStairsRailingPreview,
  clear3DFloorEdgeRailingPreview,
  moveRoofResize,
  pointInRoom,
  currentRooms,
  referenceFloorWalls,
  currentWalls,
  currentOpenings,
  currentRoofs,
  currentStairs,
  currentFences,
  currentItems,
  getFreeFloorEdges,
  isAddOpeningMode,
  getOpeningModeInfo,
  showCustomConfirm,
  show3MFExportDialog,
  Topology,
  snapValue,
  findMetadataFromNode,
  isTargetLocked,
  findOpeningIdFromNode,
  findItemIdFromNode,
  findWallIdFromNode,
  findRoomIdFromNode,
  findRoofIdFromNode,
  findStairsIdFromNode,
  findFenceIdFromNode,
  findFenceGateIdFromNode,
  groundPointFromPointer,
  getMaterialLibrary: () => materialLibrary,
  DEFAULT_MATERIAL_PACKS,
  syncFloorControls,
  ensureVisibleCurrentFloor,
  resetInteractionState,
  showCustomPrompt,
  showCustomAlert,
  showProjectListModal,
  showToast,
  registerCustomFurniture,
  saveCustomFurnitureToLocalStorage,
  renderFurnitureGrid,
  renderMaterialLibrary,
  getFurnitureDefinitions: () => FURNITURE_DEFINITIONS,
  
  // 鎷栨嫿鐩稿叧鏂规硶鐩存帴鎸傝浇
  beginRoomResize: DragHandler.beginRoomResize,
  beginRoomDrag: DragHandler.beginRoomDrag,
  beginWallDrag: DragHandler.beginWallDrag,
  beginOpeningDrag: DragHandler.beginOpeningDrag,
  beginStructureDrag: DragHandler.beginStructureDrag,
  beginFenceDrag: DragHandler.beginFenceDrag,
  beginFenceGateDrag: DragHandler.beginFenceGateDrag,
  beginFenceResize: DragHandler.beginFenceHandleDrag,
  moveRoomDrag: DragHandler.moveRoomDrag,
  moveRoomResize: DragHandler.moveRoomResize,
  finishRoomEdit: DragHandler.finishRoomEdit,
  finishOpeningDrag: DragHandler.finishOpeningDrag,
  finishWallDrag: DragHandler.finishWallDrag,
  moveWallBy: DragHandler.moveWallBy,
  moveFenceBy: DragHandler.moveFenceBy,
  finishFenceDrag: DragHandler.finishFenceDrag,
  finishFenceGateDrag: DragHandler.finishFenceGateDrag,
  
  // Topology 浠ｇ悊鏂规硶
  canPlaceOnTable: Topology.canPlaceOnTable,
  findTableBelow: (item) => Topology.findTableBelow(item, testMap.getEntities('item'), testMap.getCurrentFloorId(), (type) => testMap.getFurnitureDefinition(type)),
  findNearestSeat: (mannequinItem) => Topology.findNearestSeat(mannequinItem, testMap.getEntities('item'), (type) => testMap.getFurnitureDefinition(type)),
  findBookshelfNearby: (item) => Topology.findBookshelfNearby(item, testMap.getEntities('item'), testMap.getCurrentFloorId(), (type) => testMap.getFurnitureDefinition(type)),
  snapToBookshelf: (item, bookshelf) => Topology.snapToBookshelf(item, bookshelf, (type) => testMap.getFurnitureDefinition(type)),

  // 手柄特定存取器
  getActive3DEditTarget: () => active3DEditTarget,
  setActive3DEditTarget: (val) => { active3DEditTarget = val; },
  setDrag3DState: (val) => { drag3DState = val; },
  wallPointAt,
  snapWorldPoint,
  snapNumber,
  isTargetLocked,

  // 鍘嗗彶涓庢搷浣滅鐞?  undo,
  redo,
  setHasUserZoomedOrPanned: (val) => { hasUserZoomedOrPanned = val; },

  // 鐢诲浘鐘舵€佷笌璁℃暟
  getDrawStart: () => drawStart,
  setDrawStart: (val) => { drawStart = val; },
  getRoofResizeState: () => roofResizeState,
  setRoofResizeState: (val) => { roofResizeState = val; },
  getRoomCounter: () => roomCounter,
  incrementRoomCounter: () => { roomCounter += 1; return roomCounter; },

  // 涓婁笅鏂囪彍鍗曚笌閫夋嫨绠＄悊
  attachContextMenuTrigger,
  getSelectedTarget,
  isAllowedTarget,
  toggleTargetLock,
  copyTarget,
  rotateTarget,
  takePhoto,
  selectItem,
  showIconMenu,
  getSelectedStructure,
  getCanvasPickFromEvent,

  // 鏍忔潌鐩稿叧
  clear2DFloorEdgeRailingPreview,
  update2DFloorEdgeRailingPreview,
  clear2DStairsRailingPreview,
  update2DStairsRailingPreview,

  // 杈呭姪
  beginRoofResize,
  get2DTargetFromElement,
  BABYLON,

  // EditorUi dependencies are injected here to avoid importing app.js back.
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
  updateSelectedFenceGate,
  deleteSelectedFenceGate,
  updateSelectedFenceSubtype,
  updateSelectedFenceLength,
  updateSelectedFenceHeight,
  updateSelectedFenceColor,
  updateSelectedFenceYOffset,
  applyMaterialToItemComponent,
  updateComponentMaterial,
  isSymmetricShape,
  syncRotationInputs,
  setTargetLocked,
  revealRightPanelIfNeeded,
  getSnapEnabled,
  setSnapEnabled,
  getSnapSize,
  setSnapSize,
  getShelfLayerHeights,
  getItemsCountOnBookshelf
});

DragHandler.initDragHandler(appState);
initEditorUiContext(appState);
initTargetHandler(appState);
initMaterialManager(appState);
SvgEvents.initSvgEvents(appState);
initRender2D(appState);
initViewer3DHandles(appState);

// ==========================================
// 鍒濆鍖栨暟鎹腑蹇?Store
// ==========================================
const store = new Store({
  getSnapshot: () => {
    const data = testMap.exportJSON();
    UiControls.cleanFloorplanMaterials(data);
    return data;
  },
  applySnapshot: (data) => {
    restoreFloorplanMaterials(data);
    testMap.loadJSON(data);
    FloorManager.ensureVisibleCurrentFloor({ reason: 'snapshot-restore', silent: true });
    FloorManager.syncFloorControls();
    selectedRoomId = selectedRoomId && testMap.getEntity('room', selectedRoomId) ? selectedRoomId : null;
    selectedWallId = selectedWallId && testMap.getEntity('wall', selectedWallId) ? selectedWallId : null;
    selectedItemId = selectedItemId && testMap.getEntity('item', selectedItemId) ? selectedItemId : null;
    selectedOpeningId = selectedOpeningId && testMap.getEntity('opening', selectedOpeningId) ? selectedOpeningId : null;
    selectedRoofId = selectedRoofId && testMap.getEntity('roof', selectedRoofId) ? selectedRoofId : null;
    selectedStairsId = selectedStairsId && testMap.getEntity('stairs', selectedStairsId) ? selectedStairsId : null;
    selectedFenceId = selectedFenceId && testMap.getEntity('fence', selectedFenceId) ? selectedFenceId : null;
    testMap.setSelectedItem(selectedItemId);
    testMap.setSelectedWall(selectedWallId);
    testMap.setSelectedFence?.(selectedFenceId);
    testMap.setSelectedFenceGate?.(selectedFenceGateId);
    testMap.setSelectedRoom?.(selectedRoomId);
    testMap.setSelectedRoof?.(selectedRoofId);
    testMap.setSelectedStairs?.(selectedStairsId);
    refreshShadows();
    updateEditor();
    renderPlan();
    syncLocalToStore();
  },
});

// 监听历史栈变化，同步撤销/重做按钮状态
store.on('historyChanged', updateHistoryButtons);

// 监听手动保存完成，重新渲染反射探针
store.on('saved', () => {
  if (window.testMap && typeof window.testMap.requestReflectionUpdate === 'function') {
    window.testMap.requestReflectionUpdate();
  } else if (typeof testMap !== 'undefined' && testMap && typeof testMap.requestReflectionUpdate === 'function') {
    testMap.requestReflectionUpdate();
  }
});

// 监听自动保存完成，显示 toast 提示并更新反射探针
store.on('autoSaved', () => {
  showToast('已自动保存');
  if (window.testMap && typeof window.testMap.requestReflectionUpdate === 'function') {
    window.testMap.requestReflectionUpdate();
  } else if (typeof testMap !== 'undefined' && testMap && typeof testMap.requestReflectionUpdate === 'function') {
    testMap.requestReflectionUpdate();
  }
});

// 鐩戝惉淇濆瓨澶辫触
store.on('saveError', () => {
  showToast('鈿?鑷姩淇濆瓨澶辫触锛宭ocalStorage 绌洪棿鍙兘涓嶈冻');
});

// 鍚姩 10 鍒嗛挓鑷姩淇濆瓨
store.startAutoSave(() => ({
  materialLibrary: cleanMaterialLibraryForStorage(materialLibrary.filter((m) => !DEFAULT_MATERIAL_PACKS.some((d) => d.id === m.id))),
  uiState: {
    currentFloorId: testMap.getCurrentFloorId(),
    currentView,
  },
}));

FileManager.initFileManager(appState);

ensure3DGridControls();
ensureStructureEditor();
syncFloorControls();
UiControls.initFurnitureButtons();
UiControls.initMaterialControls();
createCustomDropdown('furniture-category-select');
createCustomDropdown('material-category');
createCustomDropdown('fence-subtype');
createCustomDropdown('fence-gate-subtype');
createCustomDropdown('opening-shape');
refreshShadows();
selectItem(testMap.getEntities('item')[0]?.id || null);
setView('2d');
if (recoveredInitialFloor) {
  syncFloorControls();
}
updateSkyboxFromCurrentFloor();
updateHistoryButtons();
const snapToggleBtn = document.getElementById('btn-snap-toggle');
if (snapToggleBtn) {
  snapToggleBtn.classList.toggle('deactivated', !snapEnabled);
}

// 启动时检查是否有本地保存的数据，直接恢复（不再弹出确认框）
(function autoRestoreLocalSave() {
  if (initialLocalSave.buildingData || initialLocalSave.materialLibrary?.length) {
    const saved = initialLocalSave;
    if (saved.buildingData) {
      // The saved floorplan was supplied to the constructor, so no second rebuild is needed.
      showToast('已自动恢复本地数据');
    }
    if (saved.materialLibrary && saved.materialLibrary.length) {
      const storedStr = localStorage.getItem('custom_material_sources');
      const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
      saved.materialLibrary.forEach((m) => {
        if (m.id && String(m.id).startsWith('custom_')) {
          m.src = sourcesMap[m.id] || m.src; // 浠庢湰鍦伴泦涓瓨鍌ㄦ嫾鍥炲ぇ鏂囦欢 Base64
        }
        if (!materialLibrary.some((existing) => existing.id === m.id)) {
          materialLibrary.push(m);
        }
      });
    }
  }

  // --- 恢复自定义颜色材质并清理未使用的异色派生材质 ---
  // 1. 加载缓存的自定义颜色材质到材质库
  const cachedColorMaterials = loadCustomColorMaterials();
  cachedColorMaterials.forEach((m) => {
    if (!materialLibrary.some((existing) => existing.id === m.id)) {
      materialLibrary.push(m);
    }
  });

  // 2. 收集地图中所有引用的材质 ID
  const usedMaterialIds = new Set();
  let buildingData = {};
  try {
    const raw = testMap.stringifyBuildingFile();
    buildingData = raw ? JSON.parse(raw) : {};
  } catch (e) {}

  (function collectMaterialIds(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(collectMaterialIds); return; }
    if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('derived_texture_')) {
      usedMaterialIds.add(obj.id);
    }
    if (obj.derivedFrom && typeof obj.derivedFrom === 'string') {
      usedMaterialIds.add(obj.id);
    }
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val && typeof val === 'object') {
        collectMaterialIds(val);
      } else if (typeof val === 'string' && val.startsWith('derived_texture_')) {
        usedMaterialIds.add(val);
      }
    }
  })(buildingData);

  // 3. 清理材质库中未被地图引用的 derived_texture_ 异色派生材质
  const beforeCount = materialLibrary.length;
  materialLibrary = materialLibrary.filter((m) => {
    if (m.id && String(m.id).startsWith('derived_texture_')) {
      return usedMaterialIds.has(m.id);
    }
    return true;
  });
  
  // 核心：强制同步回 editor 对象的全局材质库
  editor.materialLibrary = materialLibrary;

  const removedCount = beforeCount - materialLibrary.length;
  if (removedCount > 0) {
    console.log(`[材质清理] 已成功移除 ${removedCount} 个未使用的异色派生材质`);
  }
})();
syncLocalToStore();
renderMaterialLibrary();





// ==========================================
// 鍘嗗彶绠＄悊浠ｇ悊涓庡熀纭€3D浠ｇ悊鍑芥暟
// ==========================================

initCanvas3DController(appState);

function currentFences() {
  return testMap.getEntities('fence');
}



function updateSelectedFenceGatePreview(patch) {
  if (!selectedFenceGateId) return;
  if (testMap.getEntity('fence_gate', selectedFenceGateId)?.locked && !('locked' in patch)) return;
  testMap.updateFenceGate(selectedFenceGateId, patch, false);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function updateSelectedFenceGate(patch) {
  if (!selectedFenceGateId) return;
  if (testMap.getEntity('fence_gate', selectedFenceGateId)?.locked && !('locked' in patch)) return;
  pushHistory();
  testMap.updateFenceGate(selectedFenceGateId, patch);
  refreshShadows();
  updateEditor();
  renderPlan();
}

function deleteSelectedFenceGate() {
  if (!selectedFenceGateId) return;
  if (testMap.getEntity('fence_gate', selectedFenceGateId)?.locked) return;
  pushHistory();
  testMap.deleteFenceGate(selectedFenceGateId);
  clearSelection();
  refreshShadows();
  renderPlan();
}


const findNearestSeat = (mannequinItem) => Topology.findNearestSeat(mannequinItem, testMap.getEntities('item'), (type) => testMap.getFurnitureDefinition(type));



function revealRightPanelIfNeeded(hasSelection) {
  if (!hasSelection) return;
  let changed = false;
  const rightPanel = document.getElementById('right-panel');
  if (rightPanel && rightPanel.classList.contains('collapsed')) {
    rightPanel.classList.remove('collapsed');
    const btnToggleRight = document.getElementById('btn-toggle-right');
    if (btnToggleRight) btnToggleRight.textContent = '>';
    changed = true;
  }
  const leftPanel = document.querySelector('.left-panel');
  if (leftPanel && leftPanel.classList.contains('collapsed')) {
    leftPanel.classList.remove('collapsed');
    const btnToggleLeft = document.getElementById('btn-toggle-left');
    if (btnToggleLeft) btnToggleLeft.textContent = '<';
    changed = true;
  }
  if (changed) {
    setTimeout(() => {
      if (engine) engine.resize();
    }, 300);
  }
}

function getSelectedStructure() {
  if (selectedRoofId) return { type: 'roof', id: selectedRoofId, value: testMap.getEntity('roof', selectedRoofId) };
  if (selectedStairsId) return { type: 'stairs', id: selectedStairsId, value: testMap.getEntity('stairs', selectedStairsId) };
  return null;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}



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

window.Context = appState;
initAppEventBindings(appState);

function getSnapEnabled() {
  return snapEnabled;
}
function setSnapEnabled(val) {
  snapEnabled = val;
}
function getSnapSize() {
  return snapSize;
}
function setSnapSize(val) {
  snapSize = val;
}

// 家具缩略图捕获脚本需要复用编辑器已经初始化好的运行时，避免再创建第二套场景。
export { FURNITURE_LIST, testMap, viewer3d, scene, camera, engine, refresh3DGrid, entityManager, BABYLON };
