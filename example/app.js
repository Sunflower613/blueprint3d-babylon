import * as RailingPreview from './js/RailingPreview.js';
import * as PropertyManager from './js/PropertyManager.js';
import * as UiControls from './js/UiControls.js';
import * as FloorManager from './js/FloorManager.js';
import * as Drag3DContext from './js/Drag3DContext.js';
import * as SelectionManager from './js/SelectionManager.js';
import { ensure3DGridControls, ensureStructureEditor, updateEditor, initUiEventListeners, updateDesignCursor } from './js/EditorUi.js';
import { initEditorUiContext } from './js/EditorUiContext.js';
import { showCustomConfirm, showCustomAlert, showCustomPrompt, showProjectListModal, show3MFExportDialog, showFurnitureUploadHelp } from './js/Dialogs.js';
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
  applyMaterial
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
  Blueprint3DTestMap,
  BLUEPRINT3D_TEST_FLOORPLAN,
  DragHandler as LibDragHandler,
  Viewer3DHandles as LibViewer3DHandles,
  Topology,
  sampleData,
  FENCE_SUBTYPE_DEFAULTS,
  FURNITURE_DEFINITIONS,
  FURNITURE_LIST,
  FURNITURE_CATEGORIES,
  DEFAULT_MATERIAL_PACKS,
  createTextureMaterialDescriptor,
  getRoomVertices,
  pointInRoom,
  isSymmetricShape
} from '../src/index.js';

const BABYLON = { Color3, MeshBuilder, PointerEventTypes, StandardMaterial, TransformNode, Vector3, Tools };

const SVG_NS = 'http://www.w3.org/2000/svg';
const INCHES_PER_UNIT = 39.37;
const view = { width: 720, height: 520, pad: 42, minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 };
// groundPlane 宸茬Щ鑷?Viewer3D

const FURNITURE_IMAGE_PROXY_PREFIX = '/__furniture-images__/';
const fallbackFurnitureImagePath = '../src/furniture/image/custom_cube.png';
const transparentGIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
let furnitureImageLoadersPromise = null;

function getFurnitureImageProxyUrl(path) {
  const fileName = path.split('/').pop() || 'custom_cube.png';
  return `${FURNITURE_IMAGE_PROXY_PREFIX}${encodeURIComponent(fileName)}`;
}

async function getFurnitureImageLoaders() {
  if (import.meta.env.DEV) return null;
  furnitureImageLoadersPromise ||= import('./js/furnitureThumbnailLoaders.js').then((module) => module.furnitureImageLoaders);
  return furnitureImageLoadersPromise;
}

async function resolveFurnitureThumbnailUrl(path) {
  if (import.meta.env.DEV) {
    return getFurnitureImageProxyUrl(path);
  }

  const loaders = await getFurnitureImageLoaders();
  const loader = loaders?.[path] || loaders?.[fallbackFurnitureImagePath];
  return loader ? await loader() : null;
}

const furnitureThumbnailObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  entries.forEach(async (entry) => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    furnitureThumbnailObserver.unobserve(img);
        try {
      const thumbnailUrl = await resolveFurnitureThumbnailUrl(img.dataset.thumbnailPath || fallbackFurnitureImagePath);
      if (!thumbnailUrl) {
        img.dispatchEvent(new Event('error'));
        return;
      }
      img.src = thumbnailUrl;
    } catch (e) {
      img.dispatchEvent(new Event('error'));
    }
  });
}, { rootMargin: '160px' });

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

function handleModeChange(newMode) {
  if (newMode === 'delete-wall') {
    document.body.classList.add('mode-delete-wall');
    showToast('鍒犲妯″紡');
  } else {
    document.body.classList.remove('mode-delete-wall');
  }
  refresh3DGrid();
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
    handleModeChange(mode);
    syncLocalToStore();
    renderPlan();
  }
}

function setDesignMode(newMode, fromDblClick = false) {
  if (newMode !== 'brush') {
    designModeBrushLocked = false;
    selection.pickerCopiedItemType = null;
    selection.pickerCopiedItemMaterials = null;
    selection.pickerCopiedItemColors = null;
  } else if (fromDblClick) {
    designModeBrushLocked = true;
  }

  designMode = newMode;

  // 更新设计工具按钮状态
  document.querySelectorAll('.design-tools .design-mode').forEach((button) => {
    const btnMode = button.dataset.designMode;
    const isActive = btnMode === designMode;
    button.classList.toggle('active', isActive);
    
    if (btnMode === 'brush') {
      button.classList.toggle('locked', designModeBrushLocked);
      const shortcutText = button.querySelector('.mode-shortcut');
      if (shortcutText) {
        if (isActive) {
          if (designModeBrushLocked) {
            shortcutText.textContent = 'B / Locked';
          } else {
            shortcutText.textContent = 'B 路 鐐瑰嚮閿佸畾';
          }
        } else {
          shortcutText.textContent = 'B';
        }
      }
    }
  });

  // 绉婚櫎鎵€鏈夌殑 design-mode-* body classes
  document.body.classList.remove(
    'design-mode-select',
    'design-mode-picker',
    'design-mode-brush',
    'design-mode-brush-locked',
    'design-mode-bucket',
    'design-mode-eraser'
  );

  // 娣诲姞瀵瑰簲鐨?body class
  if (designMode === 'select') {
    document.body.classList.add('design-mode-select');
  } else if (designMode === 'picker') {
    document.body.classList.add('design-mode-picker');
  } else if (designMode === 'brush') {
    if (designModeBrushLocked) {
      document.body.classList.add('design-mode-brush-locked');
    } else {
      document.body.classList.add('design-mode-brush');
    }
  } else if (designMode === 'bucket') {
    document.body.classList.add('design-mode-bucket');
  } else if (designMode === 'eraser') {
    document.body.classList.add('design-mode-eraser');
  }

  // 鍔ㄦ€佹洿鏂拌璁℃ā寮忔寚閽堥鑹蹭负褰撳墠鏉愯川棰滆壊
  syncLocalToStore();
  updateDesignCursor();
}

function getPickedColorFromTarget(target) {
  if (!target) return null;
  let pickedMaterial = null;
  let pickedColor = null;

  if (target.type === 'room') {
    const room = testMap.getRoom(target.id);
    if (room) {
      pickedMaterial = room.material;
      pickedColor = room.color;
    }
  } else if (target.type === 'wall') {
    const wall = testMap.getWall(target.id);
    if (wall) {
      const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
      if (side === 'front') {
        pickedMaterial = wall.materialFront || wall.material;
        pickedColor = wall.colorFront || wall.color;
      } else if (side === 'back') {
        pickedMaterial = wall.materialBack || wall.material;
        pickedColor = wall.colorBack || wall.color;
      } else {
        pickedMaterial = wall.material;
        pickedColor = wall.color;
      }
    }
  } else if (target.type === 'item') {
    const item = testMap.getItem(target.id);
    if (item) {
      let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
      if (!componentId) {
        const definition = testMap.getFurnitureDefinition?.(item.type);
        componentId = definition?.components?.[0]?.id;
      }
      if (componentId) {
        pickedMaterial = item.materials?.[componentId];
        pickedColor = item.colors?.[componentId];
        if (!pickedMaterial && !pickedColor) {
          const definition = testMap.getFurnitureDefinition?.(item.type);
          const component = definition?.components?.find(c => c.id === componentId);
          pickedColor = component?.defaultColor || '#ffffff';
        }
      } else {
        if (item.materials && Object.keys(item.materials).length > 0) {
          pickedMaterial = Object.values(item.materials)[0];
        } else if (item.colors && Object.keys(item.colors).length > 0) {
          pickedColor = Object.values(item.colors)[0];
        }
      }
    }
  } else if (target.type === 'fence') {
    const fence = testMap.getFence(target.id);
    if (fence) {
      const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
      if (componentId === 'frame') {
        pickedMaterial = fence.frameMaterial || fence.material;
        pickedColor = fence.frameColor || fence.color;
      } else if (componentId === 'panel') {
        pickedMaterial = fence.panelMaterial || fence.material;
        pickedColor = fence.panelColor || fence.color;
      } else {
        pickedMaterial = fence.material;
        pickedColor = fence.color;
      }
    }
  } else if (target.type === 'fence_gate') {
    const gate = testMap.getFenceGate(target.id);
    if (gate) {
      const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
      if (componentId === 'frame') {
        pickedMaterial = gate.frameMaterial || gate.material;
        pickedColor = gate.frameColor || gate.color;
      } else if (componentId === 'panel') {
        pickedMaterial = gate.panelMaterial || gate.material;
        pickedColor = gate.panelColor || gate.color;
      } else {
        pickedMaterial = gate.material;
        pickedColor = gate.color;
      }
    }
  } else if (target.type === 'opening') {
    const opening = testMap.getOpening(target.id);
    if (opening) {
      const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
      if (componentId === 'frame') {
        pickedMaterial = opening.frameMaterial || opening.material;
      } else if (componentId === 'panel') {
        pickedMaterial = opening.panelMaterial || opening.material;
      } else if (componentId === 'glass') {
        pickedMaterial = opening.glassMaterial || opening.material;
      } else {
        pickedMaterial = opening.material;
      }
      pickedColor = opening.color;
    }
  } else if (target.type === 'roof') {
    const roof = testMap.getRoof ? testMap.getRoof(target.id) : null;
    if (roof) {
      const componentId = target.pick ? findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
      if (componentId === 'side') {
        pickedMaterial = roof.sideMaterial || roof.material;
        pickedColor = roof.sideColor || roof.color;
      } else if (componentId === 'bottom') {
        pickedMaterial = roof.bottomMaterial || roof.material;
        pickedColor = roof.bottomColor || roof.color;
      } else {
        pickedMaterial = roof.material;
        pickedColor = roof.color;
      }
    }
  } else if (target.type === 'stairs') {
    const stairs = testMap.getStairs(target.id);
    if (stairs) {
      const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
      if (componentId === 'side') {
        pickedMaterial = stairs.sideMaterial || stairs.material;
        pickedColor = stairs.sideColor || stairs.color;
      } else {
        pickedMaterial = stairs.material;
        pickedColor = stairs.color;
      }
    }
  }

  let descriptor = pickedMaterial || pickedColor;
  if (descriptor) {
    if (typeof descriptor === 'string') {
      return descriptor;
    } else if (descriptor.color) {
      return descriptor.color;
    }
  }
  return null;
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
  get currentView() { return ui.currentView; },
  get designMode() { return ui.designMode; },
  get snapEnabled() { return editor.snapEnabled; },
  get snapSize() { return editor.snapSize; },

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
  restoreFloorplanMaterials: (data) => restoreFloorplanMaterials(data),
  get floorPanelCollapsed() { return floorPanelCollapsed; },
  set floorPanelCollapsed(v) { floorPanelCollapsed = v; },
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
  clearDrawWallPreview: () => clearDrawWallPreview()
};

RailingPreview.initRailingPreview(appState);
PropertyManager.initPropertyManager(appState);
UiControls.initUiControls(appState);
FloorManager.initFloorManager(appState);
Drag3DContext.initDrag3DContext(appState);
SelectionManager.initSelectionManager(appState);

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
let testMap = new Blueprint3DTestMap(scene, {
  floorplan: initialLocalSave.buildingData || BLUEPRINT3D_TEST_FLOORPLAN,
  renderingEnabled: false
});
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
  view,
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
    selectedRoomId = selectedRoomId && testMap.getRoom(selectedRoomId) ? selectedRoomId : null;
    selectedWallId = selectedWallId && testMap.getWall(selectedWallId) ? selectedWallId : null;
    selectedItemId = selectedItemId && testMap.getItem(selectedItemId) ? selectedItemId : null;
    selectedOpeningId = selectedOpeningId && testMap.getOpening(selectedOpeningId) ? selectedOpeningId : null;
    selectedRoofId = selectedRoofId && testMap.getRoof?.(selectedRoofId) ? selectedRoofId : null;
    selectedStairsId = selectedStairsId && testMap.getStairs?.(selectedStairsId) ? selectedStairsId : null;
    selectedFenceId = selectedFenceId && testMap.getFence?.(selectedFenceId) ? selectedFenceId : null;
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

appState.store = store;

// 监听历史栈变化，同步撤销/重做按钮状态
store.on('historyChanged', updateHistoryButtons);

// 监听手动保存完成，重新渲染反射探针
store.on('saved', () => {
  if (window.testMap && typeof window.testMap.requestReflectionProbesUpdate === 'function') {
    window.testMap.requestReflectionProbesUpdate();
  } else if (typeof testMap !== 'undefined' && testMap && typeof testMap.requestReflectionProbesUpdate === 'function') {
    testMap.requestReflectionProbesUpdate();
  }
});

// 监听自动保存完成，显示 toast 提示并更新反射探针
store.on('autoSaved', () => {
  showToast('已自动保存');
  if (window.testMap && typeof window.testMap.requestReflectionProbesUpdate === 'function') {
    window.testMap.requestReflectionProbesUpdate();
  } else if (typeof testMap !== 'undefined' && testMap && typeof testMap.requestReflectionProbesUpdate === 'function') {
    testMap.requestReflectionProbesUpdate();
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
})();
syncLocalToStore();
renderMaterialLibrary();


// ==========================================
// 鍘嗗彶绠＄悊浠ｇ悊涓庡熀纭€3D浠ｇ悊鍑芥暟
// ==========================================

function updateHistoryButtons() {
  undoButton.disabled = !store.canUndo;
  redoButton.disabled = !store.canRedo;
}

function getMeshFloorId(mesh) { return viewer3d.getMeshFloorId(mesh); }

function refreshShadows() {
  viewer3d.refreshShadowCasters(
    () => testMap.getShadowCasters(),
    testMap.getCurrentFloorId()
  );
  refresh3DGrid();
}

function resetCamera() { return viewer3d.resetCamera(); }
function clear3DGrid() { return viewer3d.clear3DGrid(); }

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
    currentFloorId: testMap.getCurrentFloorId(),
    floorElevation: testMap.getFloorElevation ? testMap.getFloorElevation(testMap.getCurrentFloorId()) : 0,
    inchesToWorld,
    hasTestMap: !!testMap,
    isDeleteWallMode: mode === 'delete-wall'
  });
}

function resetCurrentMaterial() {
  if (selectedItemId) {
    if (isTargetLocked({ type: 'item', id: selectedItemId })) {
      showToast('璇ョ墿浣撳凡閿佸畾');
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
      testMap.executeCommand('updateWall', {
        wallId: selectedWallId,
        patch: {
          material: '#f9fbff',
          color: '#f9fbff',
          materialFront: null,
          colorFront: null,
          materialBack: null,
          colorBack: null,
          baseboardMaterialFront: null,
          baseboardColorFront: null,
          baseboardMaterialBack: null,
          baseboardColorBack: null,
          wainscotMaterialFront: null,
          wainscotColorFront: null,
          wainscotMaterialBack: null,
          wainscotColorBack: null
        }
      });
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
    testMap.executeCommand('setRoomFloorMaterial', { roomId: selectedRoomId, material: defaultFloorMaterial });
    refreshShadows();
    updateEditor();
    renderPlan();
  } else if (selectedFenceId) {
    if (isTargetLocked({ type: 'fence', id: selectedFenceId })) {
      showToast('璇ョ墿浣撳凡閿佸畾');
      return;
    }
    pushHistory();
    testMap.updateFence(selectedFenceId, { material: '#8d6e63', color: '#8d6e63' });
    refreshShadows();
    updateEditor();
    renderPlan();
  } else if (selectedOpeningId) {
    if (isTargetLocked({ type: 'opening', id: selectedOpeningId })) {
      showToast('璇ョ墿浣撳凡閿佸畾');
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
  document.body.classList.remove('cursor-hover-erasable');
  stage.dataset.view = nextView;
  viewToggleButton.textContent = nextView === '2d' ? '3D' : '2D';
  viewToggleButton.setAttribute('aria-pressed', String(nextView === '3d'));
  
  const resetCamBtn = document.getElementById('btn-reset-camera');
  if (resetCamBtn) {
    resetCamBtn.classList.remove('hidden');
  }

  if (nextView === '3d') {
    camera.attachControl(canvas, true, false, 1);
    viewer3d.prepareFor3D();
    updateSkyboxFromCurrentFloor();
    testMap.enableRendering();
    refresh3DGrid();
    requestAnimationFrame(() => {
      engine.resize();
      refresh3DGrid();
      scene.render();
    });
  } else {
    camera.detachControl(canvas);
    clear3DEditHandles();
    clear3DGrid();
    clearDrawWallPreview();
    renderPlan();
  }
  syncLocalToStore();
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
  return testMap.getCurrentFloorEntities('room');
}

function currentWalls() {
  return testMap.getCurrentFloorEntities('wall');
}

function referenceFloorWalls() {
  return FloorManager.referenceFloorWalls();
}

function currentOpenings() {
  return testMap.getCurrentFloorEntities('opening');
}

function currentItems() {
  return testMap.getCurrentFloorEntities('item');
}

function currentRoofs() {
  return testMap.getCurrentFloorEntities('roof');
}

function currentStairs() {
  return testMap.getCurrentFloorEntities('stairs');
}

function getFloorEntityCount(floorId) {
  return FloorManager.getFloorEntityCount(floorId);
}

function ensureVisibleCurrentFloor(options = {}) {
  return FloorManager.ensureVisibleCurrentFloor(options);
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
    if (action.icon === 'trash') {
      button.classList.add('context-icon-button-danger');
    }
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
  const x = Math.min(window.innerWidth - rect.width - 8, Math.max(8, clientX - rect.width / 2));
  const y = Math.min(window.innerHeight - rect.height - 8, Math.max(8, clientY - rect.height - 15));
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  contextMenuElement = menu;
}

function cancelLongPress() {
  if (longPressState?.timer) clearTimeout(longPressState.timer);
  longPressState = null;
}

function handlePointerCancel(event) {
  if (event && event.pointerType === 'touch') {
    return;
  }
  cancelLongPress();
}

function attachContextMenuTrigger(element, getTarget, showMenu = showObjectContextMenu) {
  element.addEventListener('contextmenu', (event) => {
    if (mode === 'view') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (mode === 'draw-wall' || mode === 'delete-wall' || isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || isAddOpeningMode() || mode.startsWith('draw-fence')) {
      event.preventDefault();
      event.stopPropagation();
      switchToSelectMode();
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
      pointerType: event.pointerType,
      startX,
      startY,
      timer: window.setTimeout(() => {
        longPressState = null;
        showMenu(target, startX, startY);
      }, 500)
    };
  });
}

function getSelectedTarget() {
  return selectedTarget.id ? selectedTarget : null;
}






function showFloorContextMenu(target, clientX, clientY) {
  FloorManager.showFloorContextMenu(target, clientX, clientY);
}

function moveFloorAction(floorId, direction) {
  FloorManager.moveFloorAction(floorId, direction);
}

function deleteFloorAction(floorId) {
  FloorManager.deleteFloorAction(floorId);
}

async function renameCurrentFloor(floorId) {
  return FloorManager.renameCurrentFloor(floorId);
}

function cancelObjectInteractions() {
  entityManager.dragState = null;
  DragHandler.clearAllDragStates();
  setEditHandleDragState(null);
  drag3DState = null;
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);

  let needBuild = false;
  testMap.getEntities('opening').forEach((op) => {
    if (op.isDragging) {
      testMap.executeCommand('updateOpening', { openingId: op.id, patch: { isDragging: false }, rebuild: false });
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
  return FloorManager.formatFloorDisplayName(name);
}

function syncFloorControls() {
  FloorManager.syncFloorControls();
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
  const pushCorner = (x, z) => {
    const nextX = Number(x);
    const nextZ = Number(z);
    if (!Number.isFinite(nextX) || !Number.isFinite(nextZ)) return;
    corners.push({ x: nextX, z: nextZ });
  };
  [...referenceFloorWalls(), ...currentWalls()].forEach((wall) => {
    pushCorner(wall?.from?.[0], wall?.from?.[1]);
    pushCorner(wall?.to?.[0], wall?.to?.[1]);
  });
  currentRooms().forEach((room) => {
    getRoomVertices(room).forEach((point) => pushCorner(point?.x, point?.z));
  });
  currentItems().forEach((item) => {
    const w = inchesToWorld(item.width) / 2;
    const d = inchesToWorld(item.depth) / 2;
    pushCorner(item.x - w, item.z - d);
    pushCorner(item.x + w, item.z + d);
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

// 2D 鎴峰瀷鍥惧钩闈㈡覆鏌撻€昏緫宸叉娊绂昏嚦 Render2D.js


function getStructure(type, id) {
  if (type === 'roof') return testMap.getRoof?.(id);
  if (type === 'stairs') return testMap.getStairs?.(id);
  if (type === 'fence') return testMap.getFence?.(id);
  return null;
}

function updateStructure(type, id, patch, rebuild = true) {
  return testMap.executeCommand('updateStructure', { type, id, patch, rebuild });
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



function beginRoofResize(event, roofId, side) {
  if (event.button === 2) return;
  if (mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  selectRoof(roofId);
  const roof = testMap.getRoof?.(roofId);
  if (!roof || roof.locked) return;
  const original = { x: roof.x || 0, z: roof.z || 0, width: roof.width || 6, depth: roof.depth || 6 };
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);

  let offsetX = 0;
  let offsetZ = 0;
  if (side === 'west') offsetX = left - world.x;
  if (side === 'east') offsetX = right - world.x;
  if (side === 'north') offsetZ = bottom - world.z;
  if (side === 'south') offsetZ = top - world.z;

  roofResizeState = {
    roofId,
    side,
    original,
    offsetX,
    offsetZ,
    historyPushed: false
  };
  svg.setPointerCapture(event.pointerId);
}

function moveRoofResize(event) {
  if (!roofResizeState) return;
  const roof = testMap.getRoof?.(roofResizeState.roofId);
  if (!roof || roof.locked) return;
  const point = svgPointFromEvent(event);
  const world = svgToWorld(point.x, point.y);
  const original = roofResizeState.original;
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  const side = roofResizeState.side;

  let nextWidth = original.width;
  let nextDepth = original.depth;
  let nextX = original.x;
  let nextZ = original.z;

  if (side === 'west') {
    const nextLeft = Math.min(snapNumber(world.x + roofResizeState.offsetX), right - 1);
    nextWidth = snapNumber(right - nextLeft);
    nextX = Number((right - nextWidth / 2).toFixed(3));
  } else if (side === 'east') {
    const nextRight = Math.max(snapNumber(world.x + roofResizeState.offsetX), left + 1);
    nextWidth = snapNumber(nextRight - left);
    nextX = Number((left + nextWidth / 2).toFixed(3));
  } else if (side === 'north') {
    const nextBottom = Math.max(snapNumber(world.z + roofResizeState.offsetZ), top + 1);
    nextDepth = snapNumber(nextBottom - top);
    nextZ = Number((top + nextDepth / 2).toFixed(3));
  } else if (side === 'south') {
    const nextTop = Math.min(snapNumber(world.z + roofResizeState.offsetZ), bottom - 1);
    nextDepth = snapNumber(bottom - nextTop);
    nextZ = Number((bottom - nextDepth / 2).toFixed(3));
  }

  const patch = {
    x: nextX,
    z: nextZ,
    width: nextWidth,
    depth: nextDepth
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

const canPlaceOnTable = Topology.canPlaceOnTable;
const findTableBelow = (item) => Topology.findTableBelow(item, testMap.getEntities('item'), testMap.getCurrentFloorId(), (type) => testMap.getFurnitureDefinition(type));
const findBookshelfNearby = (item) => Topology.findBookshelfNearby(item, testMap.getEntities('item'), testMap.getCurrentFloorId(), (type) => testMap.getFurnitureDefinition(type));
const snapToBookshelf = (item, bookshelf) => Topology.snapToBookshelf(item, bookshelf, (type) => testMap.getFurnitureDefinition(type));
function getShelfLayerHeights(bookshelf) {
  return Topology.getShelfLayerHeights(bookshelf, (type) => testMap.getFurnitureDefinition(type));
}

function getItemsCountOnBookshelf(bookshelf, items) {
  return Topology.getItemsCountOnBookshelf(bookshelf, items, (type) => testMap.getFurnitureDefinition(type));
}
const moveItemTo = (itemId, x, z) => entityManager.moveItemTo(itemId, x, z);
// SVG 浜嬩欢缁戝畾宸茶縼绉昏嚦 SvgEvents.js 涓鐞?
function findMetadataFromNode(node, key) {
  let current = node;
  while (current) {
    if (current.metadata?.[key]) return current.metadata[key];
    current = current.parent;
  }
  return null;
}

function findRoofComponentIdFromNode(node) {
  let current = node;
  while (current) {
    if (current.name) {
      if (current.name.includes('roof_side')) return 'side';
      if (current.name.includes('roof_bottom')) return 'bottom';
      if (current.name.includes('roof_top')) return 'top';
    }
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
      const floor = testMap.getFloor(roof.floorId);
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
  const floorY = testMap.getFloorElevation ? testMap.getFloorElevation(testMap.getCurrentFloorId()) : 0;
  return viewer3d.groundPointFromPointer(floorY);
}

function findWallSideFromNode(node) {
  let current = node;
  while (current) {
    if (current.metadata?.side) return current.metadata.side;
    current = current.parent;
  }
  return null;
}

function get2DWallSideFromPoint(wall, point) {
  if (!wall || !point) return null;
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length < 0.01) return null;

  const ux = dx / length;
  const uz = dz / length;
  const nx = -uz;
  const nz = ux;

  const px = point.x !== undefined ? point.x : point[0];
  const pz = point.z !== undefined ? point.z : point[1];

  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;

  const vx = px - mx;
  const vz = pz - mz;

  const dot = vx * nx + vz * nz;
  return dot >= 0 ? 'front' : 'back';
}

function executeDesignTool(target) {
  const isArrayMode = !!(editor.activeMaterialArray && editor.activeMaterialArray.length > 0);
  if (!editor.activeMaterialDescriptor && !isArrayMode && designMode === 'brush') {
    showToast('璇峰厛閫夋嫨涓€涓潗璐ㄦ垨鍚稿彇鏉愯川');
    return;
  }

  // 1. 鍚歌壊鍣?(picker)
  if (designMode === 'picker') {
    extractMaterial(target, true);
  }

  // 2. 绮夊埛 (brush)
  else if (designMode === 'brush') {
    applyMaterial(target, 'brush');
    if (!designModeBrushLocked) {
      setDesignMode('select');
    }
  }

  // 3. 娌规紗妗?(bucket)
  else if (designMode === 'bucket') {
    applyMaterial(target, 'bucket');
    setDesignMode('select');
  }

  // 4. 娓呴櫎鍣?(eraser)
  else if (designMode === 'eraser') {
    if (target.type === 'room') {
      if (isTargetLocked({ type: 'room', id: target.id })) {
        showToast('璇ョ墿浣撳凡閿佸畾');
        return;
      }
      pushHistory();
      const defaultFloorMaterial = DEFAULT_MATERIAL_PACKS.find(p => p.id === 'wood-light-fine');
      testMap.executeCommand('setRoomFloorMaterial', { roomId: target.id, material: defaultFloorMaterial });
      refreshShadows();
      updateEditor();
      renderPlan();
    } else if (target.type === 'wall') {
      const wall = testMap.getWall(target.id);
      if (wall && wall.locked) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
      if (side === 'front') {
        testMap.executeCommand('updateWall', { wallId: target.id, patch: { materialFront: null, colorFront: null } });
      } else if (side === 'back') {
        testMap.executeCommand('updateWall', { wallId: target.id, patch: { materialBack: null, colorBack: null } });
      } else {
        testMap.executeCommand('updateWall', { wallId: target.id, patch: { material: '#f9fbff', color: '#f9fbff', materialFront: null, colorFront: null, materialBack: null, colorBack: null } });
      }
      refreshShadows();
      updateEditor();
      renderPlan();
    } else if (target.type === 'item') {
      if (isTargetLocked({ type: 'item', id: target.id })) {
        showToast('该物体已锁定');
        return;
      }
      const item = testMap.getItem(target.id);
      let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
      if (!componentId && item) {
        const definition = testMap.getFurnitureDefinition?.(item.type);
        componentId = definition?.components?.[0]?.id;
      }
      if (componentId && item) {
        pushHistory();
        if (item.materials?.[componentId]) {
          delete item.materials[componentId];
        }
        if (item.colors?.[componentId]) {
          delete item.colors[componentId];
        }
        testMap.updateItem(target.id, { materials: item.materials, colors: item.colors });
        refreshShadows();
        updateEditor();
        renderPlan();
      }
    } else if (target.type === 'fence') {
      if (isTargetLocked({ type: 'fence', id: target.id })) {
        showToast('璇ョ墿浣撳凡閿佸畾');
        return;
      }
      pushHistory();
      testMap.updateFence(target.id, {
        material: '#8d6e63',
        color: '#8d6e63',
        frameMaterial: null,
        frameColor: null,
        panelMaterial: null,
        panelColor: null
      });
      refreshShadows();
      updateEditor();
      renderPlan();
    } else if (target.type === 'fence_gate') {
      if (isTargetLocked({ type: 'fence_gate', id: target.id })) {
        showToast('璇ョ墿浣撳凡閿佸畾');
        return;
      }
      pushHistory();
      testMap.updateFenceGate(target.id, {
        material: null,
        color: null,
        frameMaterial: null,
        frameColor: null,
        panelMaterial: null,
        panelColor: null
      });
      refreshShadows();
      updateEditor();
      renderPlan();
    } else if (target.type === 'opening') {
      if (isTargetLocked({ type: 'opening', id: target.id })) {
        showToast('璇ョ墿浣撳凡閿佸畾');
        return;
      }
      pushHistory();
      testMap.resetOpeningMaterial(target.id);
      refreshShadows();
      updateEditor();
      renderPlan();
    } else if (target.type === 'roof') {
      if (isTargetLocked({ type: 'roof', id: target.id })) {
        showToast('璇ョ墿浣撳凡閿佸畾');
        return;
      }
      pushHistory();
      testMap.updateRoof(target.id, { material: null, color: null });
      refreshShadows();
      updateEditor();
      renderPlan();
    } else if (target.type === 'stairs') {
      if (isTargetLocked({ type: 'stairs', id: target.id })) {
        showToast('璇ョ墿浣撳凡閿佸畾');
        return;
      }
      pushHistory();
      testMap.updateStairs(target.id, { material: null, color: null });
      refreshShadows();
      updateEditor();
      renderPlan();
    }

    setDesignMode('select');
  }
}

function begin3DDrag(pointerInfo) {
  const event = pointerInfo.event;
  if (currentView === '3d' && designMode !== 'select') {
    if (event.button === 0 || event.pointerType === 'touch') {
      const target = pickNearest3DTarget();
      if (target) {
        executeDesignTool(target);
        event.preventDefault();
        return;
      }
    }
  }
  if (mode === 'view') {
    // 查看模式下不处理 3D 物体选中或拖拽
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
    if (target && isTargetOnCurrentFloor(target)) {
      if (target.type === 'wall') {
        pushHistory();
        testMap.executeCommand('deleteWall', { wallId: target.id });
        clearSelection();
        refreshShadows();
        event.preventDefault();
        return;
      } else if (target.type === 'fence') {
        pushHistory();
        testMap.executeCommand('deleteFence', { fenceId: target.id });
        clearSelection();
        refreshShadows();
        event.preventDefault();
        return;
      } else if (target.type === 'fence_gate') {
        pushHistory();
        testMap.executeCommand('deleteFenceGate', { gateId: target.id });
        clearSelection();
        refreshShadows();
        event.preventDefault();
        return;
      }
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
        testMap.executeCommand('addWall', { from: drawStart, to: snappedPos });
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
          const dist = Topology.pointToSegmentDistance({ x: point.x, z: point.z }, [edge.p1.x, edge.p1.z], [edge.p2.x, edge.p2.z]);
          if (dist < minDist) {
            minDist = dist;
            bestEdge = edge;
          }
        });
        
        if (bestEdge && minDist < 0.4) {
          pushHistory();
          const subtype = mode.replace('draw-fence-', '') || 'picket_wood';
          const fence = testMap.executeCommand('addFence', {
            floorId: testMap.getCurrentFloorId(),
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
          const fence = testMap.executeCommand('addFence', {
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
          const room = testMap.executeCommand('addRoom', { x: snapped.x, z: snapped.z, shape: roomShapeFromMode(), name: `新房间 ${roomCounter++}` });
          refreshShadows();
          selectRoom(room.id);
        } else if (mode.startsWith('add-roof')) {
          const subtype = mode.replace('add-roof-', '') || 'gable';
          const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : testMap.getRoomAt(snapped.x, snapped.z);
          const wallThickness = testMap.getSnapshot().wallThickness || 0.15;
          const roofBounds = Topology.calculateAutoRoofBounds(room, { x: snapped.x, z: snapped.z }, wallThickness);
          const roof = testMap.executeCommand('addRoof', {
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
          const stairs = testMap.executeCommand('addStairs', {
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
        const gate = testMap.executeCommand('addFenceGate', {
          floorId: testMap.getCurrentFloorId(),
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
      const gate = testMap.executeCommand('addFenceGate', {
        floorId: testMap.getCurrentFloorId(),
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
        const opening = testMap.executeCommand('addOpening', {
          wallId,
          type: openingMode.type,
          t: getWallProjectionT(wall, pt),
          shape: openingMode.shape
        });
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

  Drag3DContext.onDrag3DDown(target, event);
}

function move3DDrag(pointerInfo) {
  Drag3DContext.move3DDrag(pointerInfo);
}

function end3DDrag(event) {
  Drag3DContext.end3DDrag(event);
}

function getCanvasPickFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return pickNearest3DTarget(event.clientX - rect.left, event.clientY - rect.top);
}


// 闃绘榧犳爣涓敭(1)鍦?canvas 涓婅Е鍙戞祻瑙堝櫒鐨勮嚜鍔ㄦ粴鍔ㄨ涓猴紝纭繚涓敭骞崇Щ娴佺晠
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
  if (mode === 'draw-wall' || mode === 'delete-wall' || isAddRoomMode() || mode.startsWith('add-roof') || mode.startsWith('add-stairs') || isAddOpeningMode() || mode.startsWith('draw-fence')) {
    event.preventDefault();
    switchToSelectMode();
    return;
  }
  const target = get3DTarget(event);
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  showObjectContextMenu(target, event.clientX, event.clientY);
});

canvas.addEventListener('pointerdown', (event) => {
  if (mode === 'view') return;
  if (event.pointerType === 'mouse' || event.button === 2) return;
  const target = get3DTarget(event);
  if (!target) return;
  const startX = event.clientX;
  const startY = event.clientY;
  cancelLongPress();
  longPressState = {
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    startX,
    startY,
    timer: window.setTimeout(() => {
      longPressState = null;
      cancelObjectInteractions();
      showObjectContextMenu(target, startX, startY);
    }, 500)
  };
});

canvas.addEventListener('pointermove', (event) => {
  if (!longPressState || longPressState.pointerId !== event.pointerId) return;
  const tolerance = (event.pointerType === 'touch' || longPressState.pointerType === 'touch') ? 20 : 8;
  if (Math.hypot(event.clientX - longPressState.startX, event.clientY - longPressState.startY) > tolerance) {
    cancelLongPress();
  }
});

canvas.addEventListener('pointerup', cancelLongPress);
canvas.addEventListener('pointercancel', handlePointerCancel);
canvas.addEventListener('pointerleave', () => {
  if (designMode === 'picker') {
    updateDesignCursor(null);
  }
});
scene.onPointerObservable.add((pointerInfo) => {
  if (currentView !== '3d') return;
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) begin3DDrag(pointerInfo);
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
    updateHandleHoverState();
    if (designMode === 'picker') {
      const target = pickNearest3DTarget();
      const hoverColor = getPickedColorFromTarget(target);
      updateDesignCursor(hoverColor);
    }
    if (mode === 'delete-wall') {
      const target = pickNearest3DTarget();
      const hoverErasable = target && isTargetOnCurrentFloor(target) && (target.type === 'wall' || target.type === 'fence' || target.type === 'fence_gate');
      document.body.classList.toggle('cursor-hover-erasable', !!hoverErasable);
    }
    if (mode.startsWith('draw-fence')) {
      const target = pickNearest3DTarget();
      if (target && target.type === 'stairs') {
        update3DStairsRailingPreview(target.id, mode.replace('draw-fence-', '') || 'picket_wood');
        clear3DFloorEdgeRailingPreview();
        // 只清理普通墙体或围栏预览圆柱，保留楼梯预览
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
            const dist = Topology.pointToSegmentDistance({ x: point.x, z: point.z }, [edge.p1.x, edge.p1.z], [edge.p2.x, edge.p2.z]);
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
// 娌℃湁澧欎綋鐨勫湴鏉胯竟缂樿嚜鍔ㄨ瘑鍒笌鎮诞棰勮 (NEW)
// ==========================================

function getFreeFloorEdges() {
  return RailingPreview.getFreeFloorEdges();
}

function clear2DFloorEdgeRailingPreview() {
  RailingPreview.clear2DFloorEdgeRailingPreview();
}

function clear3DFloorEdgeRailingPreview() {
  RailingPreview.clear3DFloorEdgeRailingPreview();
}

function update2DFloorEdgeRailingPreview(fromX, fromZ, toX, toZ, index) {
  RailingPreview.update2DFloorEdgeRailingPreview(fromX, fromZ, toX, toZ, index);
}

function update3DFloorEdgeRailingPreview(edgeIndex, edge, fenceSubtype) {
  RailingPreview.update3DFloorEdgeRailingPreview(edgeIndex, edge, fenceSubtype);
}

function clear2DStairsRailingPreview() {
  RailingPreview.clear2DStairsRailingPreview();
}

function clear3DStairsRailingPreview() {
  RailingPreview.clear3DStairsRailingPreview();
}

// ==========================================
// 楼梯自动扶手识别与添加 & 悬浮预览逻辑 (NEW)
// ==========================================

function update2DStairsRailingPreview(stairs, fenceSubtype) {
  RailingPreview.update2DStairsRailingPreview(stairs, fenceSubtype);
}

function update3DStairsRailingPreview(stairsId, fenceSubtype) {
  RailingPreview.update3DStairsRailingPreview(stairsId, fenceSubtype);
}

function addRailingToStairs(stairsId, fenceSubtype) {
  RailingPreview.addRailingToStairs(stairsId, fenceSubtype);
}

function clearDrawWallPreview() {
  RailingPreview.clearDrawWallPreview();
}
window.clearDrawWallPreview = clearDrawWallPreview;

function updateDrawWallPreview(snappedPoint) {
  RailingPreview.updateDrawWallPreview(snappedPoint);
}

function selectTarget(type, id, isUserInteraction = false) {
  SelectionManager.selectTarget(type, id, isUserInteraction);
}

function clearSelection() {
  SelectionManager.clearSelection();
}

function selectRoom(id) {
  SelectionManager.selectRoom(id);
}

function selectWall(id) {
  SelectionManager.selectWall(id);
}

function selectItem(id, isUserInteraction = false) {
  SelectionManager.selectItem(id, isUserInteraction);
}

function selectOpening(id) {
  SelectionManager.selectOpening(id);
}

function selectRoof(id) {
  SelectionManager.selectRoof(id);
}

function selectStairs(id) {
  SelectionManager.selectStairs(id);
}

function selectFence(id) {
  SelectionManager.selectFence(id);
}

function selectFenceGate(id) {
  SelectionManager.selectFenceGate(id);
}

function currentFences() {
  return testMap.getEntities('fence');
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
  if (selectedRoofId) return { type: 'roof', id: selectedRoofId, value: testMap.getRoof?.(selectedRoofId) };
  if (selectedStairsId) return { type: 'stairs', id: selectedStairsId, value: testMap.getStairs?.(selectedStairsId) };
  return null;
}

function normalizeRotationDegrees(degrees, useSnap = snapEnabled) {
  return PropertyManager.normalizeRotationDegrees(degrees, useSnap);
}

function syncRotationInputs(inputId, rangeId, degrees) {
  return PropertyManager.syncRotationInputs(inputId, rangeId, degrees);
}

function getStructureNode(type, id) {
  return PropertyManager.getStructureNode(type, id);
}

function previewSelectedStructureRotation(degrees) {
  PropertyManager.previewSelectedStructureRotation(degrees);
}

function commitSelectedStructureRotation(degrees) {
  PropertyManager.commitSelectedStructureRotation(degrees);
}

function getRotatedWallEndpoints(wall, degrees) {
  return PropertyManager.getRotatedWallEndpoints(wall, degrees);
}

function syncOpeningPreviewToWall(opening, wallLike) {
  PropertyManager.syncOpeningPreviewToWall(opening, wallLike);
}

function previewSelectedWallRotation(degrees) {
  PropertyManager.previewSelectedWallRotation(degrees);
}

function previewSelectedFenceRotation(degrees) {
  PropertyManager.previewSelectedFenceRotation(degrees);
}
function updateSelectedStructure() {
  PropertyManager.updateSelectedStructure();
}

function updateSelectedStructureRotation(degrees) {
  PropertyManager.updateSelectedStructureRotation(degrees);
}

function deleteSelectedStructure() {
  PropertyManager.deleteSelectedStructure();
}

function updateSelectedRoom() {
  PropertyManager.updateSelectedRoom();
}

function updateSelectedFloor() {
  PropertyManager.updateSelectedFloor();
}

function updateSkyboxFromCurrentFloor() {
  PropertyManager.updateSkyboxFromCurrentFloor();
}

function updateSelectedFenceSubtype() {
  PropertyManager.updateSelectedFenceSubtype();
}

function updateSelectedFenceLength() {
  PropertyManager.updateSelectedFenceLength();
}

function updateSelectedFenceRotation(deg) {
  PropertyManager.updateSelectedFenceRotation(deg);
}

function updateSelectedFenceHeight() {
  PropertyManager.updateSelectedFenceHeight();
}

function updateSelectedFenceYOffset() {
  PropertyManager.updateSelectedFenceYOffset();
}

function updateSelectedFenceColor() {
  PropertyManager.updateSelectedFenceColor();
}

function deleteSelectedFence() {
  PropertyManager.deleteSelectedFence();
}

function updateSelectedWallLength() {
  PropertyManager.updateSelectedWallLength();
}

function updateSelectedWallRotation(deg) {
  PropertyManager.updateSelectedWallRotation(deg);
}

function updateSelectedRotation() {
  PropertyManager.updateSelectedRotation();
}

function updateSelectedScale(value) {
  PropertyManager.updateSelectedScale(value);
}

function updateSelectedSize() {
  PropertyManager.updateSelectedSize();
}

function updateSelectedPose() {
  PropertyManager.updateSelectedPose();
}

function updateSelectedOpening(patch) {
  PropertyManager.updateSelectedOpening(patch);
}

function initMaterialControls() {
  UiControls.initMaterialControls();
}





function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}



function validateUploadedFurniture(definition) {
  return UiControls.validateUploadedFurniture(definition);
}

function registerCustomFurniture(source) {
  return UiControls.registerCustomFurniture(source);
}

function saveCustomFurnitureToLocalStorage(type, source) {
  UiControls.saveCustomFurnitureToLocalStorage(type, source);
}

function restoreCustomFurnitureFromLocalStorage() {
  return UiControls.restoreCustomFurnitureFromLocalStorage();
}

function loadUploadedFurniture(file) {
  return UiControls.loadUploadedFurniture(file);
}

function initFurnitureUpload() {
  UiControls.initFurnitureUpload();
}

function initFurnitureButtons() {
  const categorySelect = document.getElementById('furniture-category-select');
  const searchInput = document.getElementById('furniture-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-furniture-search');
  
  if (categorySelect && categorySelect.children.length === 0) {
    const groups = [
      {
        label: '',
        items: ['all', 'custom']
      },
      {
        label: '室内家具',
        items: ['tables', 'seating', 'storage', 'bedroom', 'kitchen', 'bathroom']
      },
      {
        label: '生活家电',
        items: ['appliances', 'lighting', 'decor', 'textiles', 'clothing', 'plants']
      },
      {
        label: '庭院户外',
        items: ['outdoor', 'landscape', 'flora']
      }
    ];

    groups.forEach((group) => {
      let parent = categorySelect;
      if (group.label) {
        parent = document.createElement('optgroup');
        parent.label = group.label;
        categorySelect.appendChild(parent);
      }
      group.items.forEach((catId) => {
        const cat = FURNITURE_CATEGORIES.find(c => c.id === catId);
        if (cat) {
          const opt = document.createElement('option');
          opt.value = cat.id;
          opt.textContent = cat.label;
          if (cat.icon) opt.setAttribute('data-icon', cat.icon);
          parent.appendChild(opt);
        }
      });
    });
    
    categorySelect.addEventListener('change', () => {
      renderFurnitureGrid();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', !searchInput.value);
      }
      renderFurnitureGrid();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.classList.add('hidden');
      renderFurnitureGrid();
    });
  }

  initFurnitureUpload();
  restoreCustomFurnitureFromLocalStorage();
  renderFurnitureGrid();
}
async function loadFurnitureThumbnail(img, path) {
  const thumbnailUrl = await resolveFurnitureThumbnailUrl(path);
  if (thumbnailUrl) img.src = thumbnailUrl;
}

function renderFurnitureGrid() {
  const itemGrid = document.getElementById('item-grid');
  if (!itemGrid) return;
  furnitureThumbnailObserver?.disconnect();
  itemGrid.innerHTML = '';

  const categorySelect = document.getElementById('furniture-category-select');
  const selectedCat = categorySelect ? categorySelect.value : 'all';

  const searchInput = document.getElementById('furniture-search-input');
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const uploadActions = document.getElementById('furniture-upload-actions');
  if (uploadActions) uploadActions.classList.toggle('hidden', selectedCat !== 'custom');

  const filtered = FURNITURE_LIST.filter((definition) => {
    if (selectedCat !== 'all' && definition.category !== selectedCat) return false;
    if (searchQuery && !definition.name.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  filtered.forEach((definition) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.addItem = definition.type;
    button.className = 'furniture-item-btn';

    const img = document.createElement('img');
    const imgPath = `../src/furniture/image/${definition.type}.png`;
    img.alt = definition.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = 'low';

    // 榛樿璁剧疆涓洪€忔槑鍍忕礌锛屽苟寮€鍚崰浣嶅浘涓庡姞杞戒腑鍔ㄧ敾
    img.src = transparentGIF;
    img.classList.add('placeholder-active', 'loading');

    // 图片加载成功后的处理（隐藏占位背景和 loading 呼吸效果）
    img.onload = () => {
      if (img.src !== transparentGIF) {
        img.classList.remove('placeholder-active', 'loading');
      }
    };

    // 真正的图片加载失败处理
    img.onerror = async () => {
      img.onerror = null;
      try {
        const fallbackUrl = await resolveFurnitureThumbnailUrl(fallbackFurnitureImagePath);
        if (fallbackUrl) {
          // 涓?fallback 璁剧疆鍐嶆澶辫触鏃剁殑 onerror
          img.onerror = () => {
            img.onerror = null;
            img.src = transparentGIF;
            img.classList.add('placeholder-active');
            img.classList.remove('loading');
          };
          img.src = fallbackUrl;
        } else {
          throw new Error('No fallback loader');
        }
      } catch (e) {
        img.src = transparentGIF;
        img.classList.add('placeholder-active');
        img.classList.remove('loading');
      }
    };

    if (definition.thumbnail) {
      img.src = definition.thumbnail;
    } else if (furnitureThumbnailObserver) {
      img.dataset.thumbnailPath = imgPath;
      furnitureThumbnailObserver.observe(img);
    } else {
      loadFurnitureThumbnail(img, imgPath).catch(() => {
        img.dispatchEvent(new Event('error'));
      });
    }

    const span = document.createElement('span');
    span.textContent = definition.name;

    button.append(img, span);
    itemGrid.appendChild(button);
  });
}



function cleanFloorplanMaterials(obj) {
  UiControls.cleanFloorplanMaterials(obj);
}

function cleanMaterialLibraryForStorage(lib) {
  return UiControls.cleanMaterialLibraryForStorage(lib);
}

function restoreFloorplanMaterials(obj) {
  UiControls.restoreFloorplanMaterials(obj);
}

materialCategorySelect.addEventListener('change', () => {
  const shouldReset = !window.isProgrammaticMaterialCategoryChange;
  renderMaterialLibrary(shouldReset);
});

materialUploadInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const src = await readFileAsDataURL(file);
  const descriptor = createTextureMaterialDescriptor({
    id: `custom_${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, '') || 'custom_material',
    fileName: file.name,
    category: materialCategorySelect.value || 'custom',
    src,
    scale: 1
  });
  descriptor.id = `custom_${Date.now()}`;
  materialLibrary.unshift(descriptor);
  saveCustomMaterialToLocalStorage(descriptor.id, src); // 鍚屾瀛樺叆鏈湴闆嗕腑瀛樺偍
  activeMaterialDescriptor = descriptor;
  editor.activeMaterialDescriptor = descriptor;
  editor.activeMaterialArray = null;
  materialUploadInput.value = '';
  renderMaterialLibrary();
  updateEditor();
});



viewToggleButton.addEventListener('click', () => setView(currentView === '2d' ? '3d' : '2d'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);



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
    copyTarget,
    rotateTarget,
    isAllowedTarget,
    isTargetLocked,
    pushHistory,
    INCHES_PER_UNIT
  });
});

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
    document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== button.dataset.tab));
    
    // 鍒囧嚭璁捐闈㈡澘鏃惰嚜鍔ㄦ仮澶嶅埌 select 妯″紡
    if (button.dataset.tab !== 'design') {
      setDesignMode('select');
    }
  });
});

// 初始化设计工具切换事件
let lastDesignPointerType = '';
let designPointerResetTimer = null;
function rememberDesignPointerType(pointerType) {
  lastDesignPointerType = pointerType;
  clearTimeout(designPointerResetTimer);
  designPointerResetTimer = setTimeout(() => {
    lastDesignPointerType = '';
  }, 1000);
}

document.querySelectorAll('.design-mode').forEach((button) => {
  button.addEventListener('pointerup', (event) => {
    rememberDesignPointerType(event.pointerType);
  });

  // Fallback for older mobile Safari versions without reliable PointerEvent data.
  button.addEventListener('touchend', () => rememberDesignPointerType('touch'), { passive: true });

  button.addEventListener('click', (event) => {
    const nextMode = button.dataset.designMode;
    lastDesignPointerType = '';
    clearTimeout(designPointerResetTimer);

    // 粉刷的特殊处理：单击在 3 个状态间循环切换
    if (nextMode === 'brush') {
      if (designMode !== 'brush') {
        // 状态 1：当前不是粉刷，切入粉刷（单次/未锁定）
        setDesignMode('brush', false);
      } else if (!designModeBrushLocked) {
        // 状态 2：当前是未锁定粉刷，再次点击进入锁定粉刷
        setDesignMode('brush', true);
      } else {
        // 状态 3：当前是锁定粉刷，再次点击取消粉刷（切换到选择模式）        setDesignMode('select');
      }
      return;
    }

    // 鍚歌壊銆佹补婕嗘《銆佹鐨摝绛夊叾瀹冭璁″伐鍏凤紝閫変腑鍚庡啀娆＄偣鍑诲彲浠ョ洿鎺ュ彇娑堬紝鍒囨崲鎴愰€夋嫨妯″紡
    if (designMode === nextMode && designMode !== 'select') {
      setDesignMode('select');
      return;
    }

    setDesignMode(nextMode, false);
  });

  button.addEventListener('pointercancel', () => {
    lastDesignPointerType = '';
    clearTimeout(designPointerResetTimer);
  });
});

document.querySelectorAll('.mode').forEach((button) => {
  button.addEventListener('click', () => {
    const clickedMode = button.dataset.mode;
    // 再次点击当前建筑工具时回到选择模式
    if (mode === clickedMode && mode !== 'select') {
      switchToSelectMode();
      return;
    }
    mode = clickedMode;
    drawStart = null;
    clearDrawWallPreview();
    document.querySelectorAll('.mode').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
    handleModeChange(mode);
    syncLocalToStore();
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
        const sourceFloorId = testMap.getCurrentFloorId();
        pushHistory();
        testMap.executeCommand('addFloor', copyCurrentFloor ? { copyFromFloorId: sourceFloorId } : {});
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
      testMap.executeCommand('setCurrentFloor', { floorId });
      clearSelection();
      updateSkyboxFromCurrentFloor();
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
  const target = currentView === '2d' ? get2DTargetFromElement(event.target) : null;
  if (target) {
    event.stopPropagation();
    showObjectContextMenu(target, event.clientX, event.clientY);
  }
});

stage.addEventListener('pointerdown', (event) => {
  if (currentView !== '2d' || event.pointerType === 'mouse' || event.button === 2) return;
  const target = get2DTargetFromElement(event.target);
  if (!target) return;
  const startX = event.clientX;
  const startY = event.clientY;
  cancelLongPress();
  longPressState = {
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    startX,
    startY,
    timer: window.setTimeout(() => {
      longPressState = null;
      cancelObjectInteractions();
      showObjectContextMenu(target, startX, startY);
    }, 500)
  };
}, true); // 鎹曡幏闃舵锛岄槻姝㈠瓙鍏冪礌 stopPropagation 闃绘柇

['copy', 'cut', 'paste', 'selectstart', 'dragstart'].forEach((eventName) => {
  stage.addEventListener(eventName, (event) => event.preventDefault());
});
document.addEventListener('pointermove', (event) => {
  if (!longPressState || longPressState.pointerId !== event.pointerId) return;
  const tolerance = (event.pointerType === 'touch' || longPressState.pointerType === 'touch') ? 20 : 8;
  if (Math.hypot(event.clientX - longPressState.startX, event.clientY - longPressState.startY) > tolerance) {
    cancelLongPress();
  }
});

document.addEventListener('pointerup', cancelLongPress);
document.addEventListener('pointercancel', handlePointerCancel);
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

  // 显式展开左右工具栏，避免查看模式下无法返回
  let panelChanged = false;
  const rightPanel = document.getElementById('right-panel');
  if (rightPanel && rightPanel.classList.contains('collapsed')) {
    rightPanel.classList.remove('collapsed');
    const btnToggleRight = document.getElementById('btn-toggle-right');
    if (btnToggleRight) btnToggleRight.textContent = '>';
    panelChanged = true;
  }
  const leftPanel = document.querySelector('.left-panel');
  if (leftPanel && leftPanel.classList.contains('collapsed')) {
    leftPanel.classList.remove('collapsed');
    const btnToggleLeft = document.getElementById('btn-toggle-left');
    if (btnToggleLeft) btnToggleLeft.textContent = '<';
    panelChanged = true;
  }
  if (panelChanged) {
    setTimeout(() => {
      if (engine) engine.resize();
    }, 300);
  }

  // 濡傛灉褰撳墠澶勪簬鏌ョ湅妯″紡锛岃嚜鍔ㄥ垏鍥為€夋嫨妯″紡锛屼互纭繚鐢ㄦ埛鑳藉缁х画浜や簰
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

// 鏂囦欢鐨勫鍏ュ鍑轰笌 LocalStorage 椤圭洰绠＄悊宸茶縼绉昏嚦 FileManager.js 涓鐞?
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
  // 濡傛灉鐐瑰嚮鐨勬槸瀛愯彍鍗曡Е鍙戞寜閽紝涓嶅叧闂富鑿滃崟
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
  // 鎮仠灞曞紑
  wrapper.addEventListener('mouseenter', () => {
    submenuContent.classList.remove('hidden');
  });
  wrapper.addEventListener('mouseleave', () => {
    submenuContent.classList.add('hidden');
  });
  // 鐐瑰嚮涔熷彲鍒囨崲
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
  btnToggleRight.textContent = isCollapsed ? '<' : '>';
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
    btnToggleLeft.textContent = isCollapsed ? '>' : '<';
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
// 鑷畾涔変笅鎷夐€夋嫨鍣ㄧ粍浠?// ==========================================

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
  designMode,
  selectedTarget,
  selectTarget,
  TARGET_TYPES,
  testMap,
  viewer3d,
  scene,
  camera,
  engine,
  FURNITURE_LIST,
  BABYLON,
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
  
  applyMaterialToItemComponent,
  updateComponentMaterial,
  
  isTargetLocked,
  showToast,
  pushHistory,
  refreshShadows,
  renderPlan,
  refresh3DGrid,
  findNearestSeat,
  isSymmetricShape,
  syncRotationInputs,
  setTargetLocked,
  clearSelection,
  revealRightPanelIfNeeded,
  
  showCustomConfirm,
  show3MFExportDialog,
  currentRooms,
  canPlaceOnTable,
  findTableBelow,
  findBookshelfNearby,
  snapToBookshelf,
  getShelfLayerHeights,
  getItemsCountOnBookshelf,
  getSelectedStructure
};






