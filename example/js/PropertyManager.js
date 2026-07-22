import { Topology, DEFAULT_MATERIAL_PACKS } from '../../src/index.js';
import { showToast } from './Store.js';
import { showCustomPrompt } from './Dialogs.js';

let Context = null;
let structureRotationPreview = null;

const PREVIEW_TYPES = {
  item: 'items',
  room: 'rooms',
  wall: 'walls',
  opening: 'openings',
  fence: 'fences',
  fenceGate: 'fenceGates',
  fencegate: 'fenceGates',
  roof: 'roofs',
  stairs: 'stairs'
};

function commitAfterPreview(type, id, commit, label) {
  const status = Context.testMap.getEntityPreviewStatus();
  if (status.state === 'idle') {
    commit();
    return Promise.resolve(true);
  }
  if (status.state !== 'active' || status.type !== PREVIEW_TYPES[type] || status.id !== id) {
    return Promise.resolve(false);
  }
  return Promise.resolve(Context.testMap.cancelEntityPreview(type, id))
    .then((cancelled) => {
      if (!cancelled) return false;
      commit();
      return true;
    })
    .catch((error) => {
      console.error(`Failed to commit ${label} preview:`, error);
      return false;
    });
}

export function initPropertyManager(appState) {
  Context = appState;
}

export function normalizeRotationDegrees(degrees, useSnap) {
  const isSnap = useSnap !== undefined ? useSnap : Context.snapEnabled;
  let value = Number(degrees) || 0;
  if (isSnap) value = Math.round(value / 90) * 90;
  return (value % 360 + 360) % 360;
}

export function syncRotationInputs(inputId, rangeId, degrees) {
  const normalized = normalizeRotationDegrees(degrees);
  const input = document.getElementById(inputId);
  const range = document.getElementById(rangeId);
  if (input) input.value = normalized;
  if (range) range.value = normalized;
  return normalized;
}

export function previewSelectedStructureRotation(degrees) {
  const selected = Context.getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  const normalized = syncRotationInputs('structure-rotation', 'structure-rotation-range', degrees);
  const rotationRad = normalized * Math.PI / 180;
  if (!structureRotationPreview || structureRotationPreview.type !== selected.type || structureRotationPreview.id !== selected.id) {
    if (!Context.testMap.beginEntityPreview(selected.type, selected.id)) return false;
    structureRotationPreview = { type: selected.type, id: selected.id };
  }
  const updated = Context.testMap.updateEntityPreview(selected.type, selected.id, { rotation: rotationRad });
  if (Context.currentView !== '3d') Context.renderPlan();
  return updated;
}

export function commitSelectedStructureRotation(degrees) {
  const selected = Context.getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  const normalized = syncRotationInputs('structure-rotation', 'structure-rotation-range', degrees);
  const preview = structureRotationPreview;
  structureRotationPreview = null;
  const commit = () => {
    Context.pushHistory();
    Context.updateStructure(selected.type, selected.id, { rotation: normalized * Math.PI / 180 });
    Context.refreshShadows();
    Context.updateEditor();
    Context.renderPlan();
  };
  if (!preview) {
    commit();
    return Promise.resolve(true);
  }
  if (preview.type !== selected.type || preview.id !== selected.id) return Promise.resolve(false);
  return commitAfterPreview(selected.type, selected.id, commit, 'structure rotation');
}

export function getRotatedWallEndpoints(wall, degrees) {
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

export function previewSelectedWallRotation(degrees) {
  if (!Context.selectedWallId) return;
  const wall = Context.testMap.getEntity('wall', Context.selectedWallId);
  if (!wall) return;
  const normalized = syncRotationInputs('wall-rotation', 'wall-rotation-range', degrees);
  const preview = getRotatedWallEndpoints(wall, normalized);
  Context.testMap.beginEntityPreview('wall', wall.id);
  Context.testMap.updateEntityPreview('wall', wall.id, { from: preview.from, to: preview.to });
}

export function previewSelectedFenceRotation(degrees) {
  if (!Context.selectedFenceId) return;
  const fence = Context.testMap.getEntity('fence', Context.selectedFenceId);
  if (!fence || fence.locked) return;
  const normalized = syncRotationInputs('fence-rotation', 'fence-rotation-range', degrees);
  const preview = getRotatedWallEndpoints(fence, normalized);
  Context.testMap.beginEntityPreview('fence', fence.id);
  Context.testMap.updateEntityPreview('fence', fence.id, { from: preview.from, to: preview.to });
}

export function updateSelectedStructure() {
  const selected = Context.getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  Context.pushHistory();
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
    patch.runBeforeCorner = Number(document.getElementById('structure-run-before-corner').value);
    patch.runAfterCorner = Number(document.getElementById('structure-run-after-corner').value);
    patch.uSlotWidth = Number(document.getElementById('structure-u-slot-width').value);
    patch.uVoidLength = Number(document.getElementById('structure-u-void-length').value);
  }
  Context.updateStructure(selected.type, selected.id, patch);
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedStructureRotation(degrees) {
  const selected = Context.getSelectedStructure();
  if (selected?.value?.locked) return;
  commitSelectedStructureRotation(degrees);
}

export function deleteSelectedStructure() {
  const selected = Context.getSelectedStructure();
  if (!selected?.value || selected.value.locked) return;
  Context.pushHistory();
  if (selected.type === 'roof') Context.testMap.deleteRoof?.(selected.id);
  if (selected.type === 'stairs') Context.testMap.deleteStairs?.(selected.id);
  Context.clearSelection();
  Context.refreshShadows();
}

export function updateSelectedRoom() {
  if (!Context.selectedRoomId) return;
  const room = Context.testMap.getEntity('room', Context.selectedRoomId);
  if (room?.locked) return;

  const roomFloor = Context.testMap.getFloor(room.floorId);
  const wallHeight = roomFloor ? (roomFloor.wallHeight ?? Context.testMap.getSnapshot().wallHeight ?? 3.0) : (Context.testMap.getSnapshot().wallHeight ?? 3.0);
  let elevation = Number(document.getElementById('room-elevation').value || 0);
  if (elevation < 0) elevation = 0;
  if (elevation > wallHeight) elevation = wallHeight;

  const rotationDegrees = Number(document.getElementById('room-rotation').value || 0);
  const rotation = - (rotationDegrees * Math.PI / 180);

  Context.pushHistory();
  Context.testMap.executeCommand('updateRoom', {
    roomId: Context.selectedRoomId,
    patch: {
      name: document.getElementById('room-name').value,
      width: Number(document.getElementById('room-width').value),
      depth: Number(document.getElementById('room-depth').value),
      elevation: elevation,
      rotation: rotation
    }
  });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedFloor() {
  const currentFloorId = Context.testMap.getCurrentFloorId();
  const currentFloor = Context.testMap.getFloor(currentFloorId);
  if (!currentFloor) return;
  Context.pushHistory();

  const nameInput = document.getElementById('floor-name').value.trim();
  if (nameInput && nameInput !== currentFloor.name) {
    Context.testMap.executeCommand('renameFloor', { floorId: currentFloorId, name: nameInput });
  }

  const heightInput = parseFloat(document.getElementById('floor-wall-height').value);
  if (Number.isFinite(heightInput) && heightInput > 0) {
    Context.testMap.executeCommand('changeFloorHeight', { floorId: currentFloorId, height: heightInput });
  }

  const floorHInput = parseFloat(document.getElementById('floor-height').value);
  if (Number.isFinite(floorHInput) && floorHInput > 0) {
    Context.testMap.executeCommand('changeFloorDefaultFloorHeight', { floorId: currentFloorId, height: floorHInput });
  }

  const hideRoofInput = document.getElementById('floor-hide-roof').checked;
  const hideWallInput = document.getElementById('floor-hide-wall').checked;
  const skyboxInput = document.getElementById('floor-skybox-enabled').checked;
  Context.testMap.executeCommand('changeFloorHideSettings', { floorId: currentFloorId, hideRoof: hideRoofInput, hideWall: hideWallInput, skybox: skyboxInput });

  if (hideRoofInput && Context.selectedRoofId) {
    const roof = Context.testMap.getEntity('roof', Context.selectedRoofId);
    if (roof && roof.floorId === currentFloorId) {
      Context.clearSelection();
    }
  }

  updateSkyboxFromCurrentFloor();

  Context.syncFloorControls();
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSkyboxFromCurrentFloor() {
  const currentFloorId = Context.testMap.getCurrentFloorId();
  const currentFloor = Context.testMap.getFloor(currentFloorId);
  if (currentFloor) {
    const skyboxEnabled = currentFloor.skyboxEnabled === true;
    Context.viewer3d.setSkyboxEnabled(skyboxEnabled);
    const environment = Context.testMap.getSnapshot().environment || {};
    Context.viewer3d.setEnvironmentMaterials(environment.skyMaterial, environment.groundMaterial);
  }
}

export function updateSelectedFenceSubtype() {
  if (!Context.selectedFenceId) return;
  if (Context.testMap.getEntity('fence', Context.selectedFenceId)?.locked) return;
  Context.pushHistory();
  Context.testMap.executeCommand('updateFence', { fenceId: Context.selectedFenceId, patch: { subtype: document.getElementById('fence-subtype').value } });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedFenceLength() {
  if (!Context.selectedFenceId) return;
  if (Context.testMap.getEntity('fence', Context.selectedFenceId)?.locked) return;
  const len = Number(document.getElementById('fence-length').value);
  if (len <= 0.05) return;
  Context.pushHistory();
  
  const fence = Context.testMap.getEntity('fence', Context.selectedFenceId);
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
    
    Context.testMap.executeCommand('updateFence', {
      fenceId: Context.selectedFenceId,
      patch: {
        from: [nextFromX, nextFromZ],
        to: [nextToX, nextToZ]
      }
    });
  }
  
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedFenceRotation(deg) {
  if (!Context.selectedFenceId) return;
  const fenceId = Context.selectedFenceId;
  const fence = Context.testMap.getEntity('fence', fenceId);
  if (!fence || fence.locked) return;
  const normalized = syncRotationInputs('fence-rotation', 'fence-rotation-range', deg);
  const preview = getRotatedWallEndpoints(fence, normalized);
  const commit = () => {
    Context.pushHistory();
    Context.testMap.executeCommand('updateFence', {
      fenceId,
      patch: { from: preview.from, to: preview.to }
    });
    Context.refreshShadows();
    Context.updateEditor();
    Context.renderPlan();
  };
  return commitAfterPreview('fence', fenceId, commit, 'fence rotation');
}

export function updateSelectedFenceHeight() {
  if (!Context.selectedFenceId) return;
  if (Context.testMap.getEntity('fence', Context.selectedFenceId)?.locked) return;
  Context.pushHistory();
  Context.testMap.executeCommand('updateFence', { fenceId: Context.selectedFenceId, patch: { height: Number(document.getElementById('fence-height').value) } });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedFenceYOffset() {
  if (!Context.selectedFenceId) return;
  if (Context.testMap.getEntity('fence', Context.selectedFenceId)?.locked) return;
  Context.pushHistory();
  Context.testMap.executeCommand('updateFence', { fenceId: Context.selectedFenceId, patch: { yOffset: Number(document.getElementById('fence-yoffset').value) } });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedFenceColor() {
  if (!Context.selectedFenceId) return;
  if (Context.testMap.getEntity('fence', Context.selectedFenceId)?.locked) return;
  Context.pushHistory();
  const col = document.getElementById('fence-color').value;
  Context.testMap.executeCommand('updateFence', { fenceId: Context.selectedFenceId, patch: { color: col, material: col } });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function deleteSelectedFence() {
  if (!Context.selectedFenceId) return;
  if (Context.testMap.getEntity('fence', Context.selectedFenceId)?.locked) return;
  Context.pushHistory();
  Context.testMap.executeCommand('deleteFence', { fenceId: Context.selectedFenceId });
  Context.clearSelection();
  Context.refreshShadows();
  Context.renderPlan();
}

export function updateSelectedWallLength() {
  if (!Context.selectedWallId) return;
  Context.pushHistory();
  Context.testMap.executeCommand('updateWallLength', { wallId: Context.selectedWallId, length: Number(document.getElementById('wall-length').value) });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}

export function updateSelectedWallRotation(deg) {
  if (!Context.selectedWallId) return;
  const wallId = Context.selectedWallId;
  const wall = Context.testMap.getEntity('wall', wallId);
  if (!wall) return;
  const normalized = syncRotationInputs('wall-rotation', 'wall-rotation-range', deg);
  const preview = getRotatedWallEndpoints(wall, normalized);
  const commit = () => {
    Context.pushHistory();
    Context.testMap.executeCommand('updateWall', {
      wallId,
      patch: { from: preview.from, to: preview.to }
    });
    Context.refreshShadows();
    Context.updateEditor();
    Context.renderPlan();
  };
  return commitAfterPreview('wall', wallId, commit, 'wall rotation');
}

export function updateSelectedRotation() {
  if (!Context.selectedItemId) return;
  const degrees = Number(document.getElementById('item-rotation').value) || 0;
  Context.entityManager.updateItemRotation(Context.selectedItemId, degrees);
}

export function updateSelectedScale(value) {
  if (!Context.selectedItemId) return;
  Context.entityManager.updateItemScale(Context.selectedItemId, value);
}

export function updateSelectedSize() {
  if (!Context.selectedItemId) return;
  const widthVal = Number(document.getElementById('item-width').value);
  const depthVal = Number(document.getElementById('item-depth').value);
  const heightVal = Number(document.getElementById('item-height').value);
  const elevationVal = Number(document.getElementById('item-elevation').value || 0);
  Context.entityManager.updateItemSize(Context.selectedItemId, widthVal, depthVal, heightVal, elevationVal);
}

export function updateSelectedPose() {
  if (!Context.selectedItemId) return;
  const newPose = document.getElementById('item-pose').value;
  Context.entityManager.updateItemPose(Context.selectedItemId, newPose);
}

export function updateSelectedOpening(patch) {
  if (!Context.selectedOpeningId) return;
  if (Context.testMap.getEntity('opening', Context.selectedOpeningId)?.locked && !('locked' in patch)) return;
  Context.pushHistory();
  Context.testMap.executeCommand('updateOpening', { openingId: Context.selectedOpeningId, patch });
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
}
