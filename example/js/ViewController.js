import { DEFAULT_MATERIAL_PACKS, getRoomVertices, Topology } from '../../src/index.js';
import { iconSvg } from './Icons.js';
import * as DragHandler from './DragHandler.js';
import * as DesignController from './DesignController.js';
import * as FloorManager from './FloorManager.js';
import { showObjectContextMenu } from './TargetHandler.js';
import { clear3DEditHandles } from './Viewer3DHandles.js';
import { fitBoundsToViewport } from './ViewGeometry.js';

let Context = null;

export function initViewController(appState) {
  Context = appState;
}

export function updateHistoryButtons() {
  const undo = document.getElementById('btn-undo');
  const redo = document.getElementById('btn-redo');
  if (undo) undo.disabled = !Context.store.canUndo;
  if (redo) redo.disabled = !Context.store.canRedo;
}

export function getMeshFloorId(mesh) { return Context.viewer3d.getMeshFloorId(mesh); }

export function refreshShadows() {
  Context.viewer3d.refreshShadowCasters(() => Context.testMap.getShadowCasters(), Context.testMap.getCurrentFloorId());
  refresh3DGrid();
}

export function resetCamera() { return Context.viewer3d.resetCamera(); }
export function clear3DGrid() { return Context.viewer3d.clear3DGrid(); }

export function refresh3DGrid() {
  const floorId = Context.testMap.getCurrentFloorId();
  Context.viewer3d.refresh3DGrid({
    currentView: Context.currentView,
    snapEnabled: Context.snapEnabled,
    snapSize: Context.snapSize,
    walls: currentWalls(),
    rooms: currentRooms(),
    roofs: currentRoofs(),
    stairs: currentStairs(),
    items: currentItems(),
    currentFloorId: floorId,
    floorElevation: Context.testMap.getFloorElevation?.(floorId) || 0,
    inchesToWorld: Context.inchesToWorld,
    hasTestMap: true,
    isDeleteWallMode: Context.mode === 'delete-wall'
  });
}

export function resetCurrentMaterial() {
  const map = Context.testMap;
  if (Context.selectedItemId) return Context.entityManager.resetItemMaterial(Context.selectedItemId);
  if (Context.selectedWallId) {
    const wall = map.getWall(Context.selectedWallId);
    if (!wall || wall.locked) return;
    Context.pushHistory();
    map.executeCommand('updateWall', {
      wallId: wall.id,
      patch: {
        material: '#f9fbff', color: '#f9fbff', materialFront: null, colorFront: null,
        materialBack: null, colorBack: null, baseboardMaterialFront: null,
        baseboardColorFront: null, baseboardMaterialBack: null, baseboardColorBack: null,
        wainscotMaterialFront: null, wainscotColorFront: null,
        wainscotMaterialBack: null, wainscotColorBack: null
      }
    });
  } else if (Context.selectedRoomId) {
    Context.pushHistory();
    map.executeCommand('setRoomFloorMaterial', {
      roomId: Context.selectedRoomId,
      material: DEFAULT_MATERIAL_PACKS.find((material) => material.id === 'wood-light-fine')
    });
  } else if (Context.selectedFenceId) {
    Context.pushHistory();
    map.updateFence(Context.selectedFenceId, { material: '#8d6e63', color: '#8d6e63' });
  } else if (Context.selectedOpeningId) {
    Context.pushHistory();
    map.resetOpeningMaterial(Context.selectedOpeningId);
  } else {
    return;
  }
  refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function setView(nextView) {
  Context.currentView = nextView;
  document.body.classList.remove('cursor-hover-erasable');
  const stage = document.getElementById('stage');
  if (stage) stage.dataset.view = nextView;
  const toggle = document.getElementById('btn-view-toggle');
  if (toggle) {
    toggle.textContent = nextView === '2d' ? '3D' : '2D';
    toggle.setAttribute('aria-pressed', String(nextView === '3d'));
  }
  document.getElementById('btn-reset-camera')?.classList.remove('hidden');

  if (nextView === '3d') {
    Context.camera.attachControl(Context.canvas, true, false, 1);
    Context.viewer3d.prepareFor3D();
    Context.updateSkyboxFromCurrentFloor();
    Context.testMap.enableRendering();
    refresh3DGrid();
    requestAnimationFrame(() => {
      Context.engine.resize();
      refresh3DGrid();
      Context.scene.render();
    });
  } else {
    Context.camera.detachControl(Context.canvas);
    clear3DEditHandles();
    clear3DGrid();
    Context.clearDrawWallPreview();
    Context.renderPlan();
  }
  Context.syncLocalToStore();
}

export function snapValue(value) { return Topology.snapValue(value, Context.snapEnabled, Context.snapSize); }
export function snapWorldPoint(world) { return Topology.snapWorldPoint(world, Context.snapEnabled, Context.snapSize); }
export function snapToGridSegmentCenter(point) { return Topology.snapToGridSegmentCenter(point, Context.snapEnabled, Context.snapSize); }
export function snapNumber(value) { return Topology.snapNumber(value, Context.snapEnabled, Context.snapSize); }
export function currentRooms() { return Context.testMap.getCurrentFloorEntities('room'); }
export function currentWalls() { return Context.testMap.getCurrentFloorEntities('wall'); }
export function currentOpenings() { return Context.testMap.getCurrentFloorEntities('opening'); }
export function currentItems() { return Context.testMap.getCurrentFloorEntities('item'); }
export function currentRoofs() { return Context.testMap.getCurrentFloorEntities('roof'); }
export function currentStairs() { return Context.testMap.getCurrentFloorEntities('stairs'); }
export function referenceFloorWalls() { return FloorManager.referenceFloorWalls(); }
export function getFloorEntityCount(floorId) { return FloorManager.getFloorEntityCount(floorId); }
export function ensureVisibleCurrentFloor(options = {}) { return FloorManager.ensureVisibleCurrentFloor(options); }

export function makeButton(id, label, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  if (id) button.id = id;
  if (className) button.className = className;
  button.textContent = label;
  return button;
}

export function hideContextMenu() {
  Context.contextMenuElement?.remove();
  Context.contextMenuElement = null;
}

export function showIconMenu(clientX, clientY, actions) {
  hideContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-icon-menu';
  actions.filter(Boolean).forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `context-icon-button${action.icon === 'trash' ? ' context-icon-button-danger' : ''}`;
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
  menu.style.left = `${Math.min(window.innerWidth - rect.width - 8, Math.max(8, clientX - rect.width / 2))}px`;
  menu.style.top = `${Math.min(window.innerHeight - rect.height - 8, Math.max(8, clientY - rect.height - 15))}px`;
  Context.contextMenuElement = menu;
}

export function cancelLongPress() {
  if (Context.longPressState?.timer) clearTimeout(Context.longPressState.timer);
  Context.longPressState = null;
}

export function handlePointerCancel(event) {
  if (event?.pointerType !== 'touch') cancelLongPress();
}

export function attachContextMenuTrigger(element, getTarget, showMenu = showObjectContextMenu) {
  element.addEventListener('contextmenu', (event) => {
    if (Context.mode === 'view') return event.preventDefault();
    if (Context.isDrawingMode()) {
      event.preventDefault();
      event.stopPropagation();
      DesignController.switchToSelectMode();
      return;
    }
    const target = getTarget(event);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    showMenu(target, event.clientX, event.clientY);
  });
}

export function getSelectedTarget() { return Context.selectedTarget.id ? Context.selectedTarget : null; }

export function cancelObjectInteractions() {
  Context.entityManager.dragState = null;
  DragHandler.clearAllDragStates();
  Context.setEditHandleDragState(null);
  Context.drag3DState = null;
  document.body.classList.remove('is-dragging-3d');
  Context.camera.attachControl(Context.canvas, true, false, 1);
}

export function snapRoomPosition(room, x, z) {
  const left = snapNumber(x - room.width / 2);
  const top = snapNumber(z - room.depth / 2);
  return { x: Number((left + room.width / 2).toFixed(3)), z: Number((top + room.depth / 2).toFixed(3)) };
}

export function updateViewBounds() {
  if (Context.hasUserZoomedOrPanned) return;
  const corners = [];
  const push = (x, z) => {
    if (Number.isFinite(Number(x)) && Number.isFinite(Number(z))) corners.push({ x: Number(x), z: Number(z) });
  };
  [...referenceFloorWalls(), ...currentWalls()].forEach((wall) => {
    push(wall?.from?.[0], wall?.from?.[1]);
    push(wall?.to?.[0], wall?.to?.[1]);
  });
  currentRooms().forEach((room) => getRoomVertices(room).forEach((point) => push(point.x, point.z)));
  currentItems().forEach((item) => {
    const width = Context.inchesToWorld(item.width) * Number(item.scale || 1) / 2;
    const depth = Context.inchesToWorld(item.depth) * Number(item.scale || 1) / 2;
    push(item.x - width, item.z - depth);
    push(item.x + width, item.z + depth);
  });
  if (!corners.length) {
    return Object.assign(Context.view, fitBoundsToViewport(
      { minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 },
      Context.view
    ));
  }
  const xs = corners.map((point) => point.x);
  const zs = corners.map((point) => point.z);
  Object.assign(Context.view, fitBoundsToViewport({
    minX: Math.min(...xs) - 1.5, maxX: Math.max(...xs) + 1.5,
    minZ: Math.min(...zs) - 1.5, maxZ: Math.max(...zs) + 1.5
  }, Context.view));
}
