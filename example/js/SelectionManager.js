let Context = null;

const TARGET_TYPES = {
  ROOM: 'room',
  WALL: 'wall',
  ITEM: 'item',
  OPENING: 'opening',
  ROOF: 'roof',
  STAIRS: 'stairs',
  FENCE: 'fence',
  FENCE_GATE: 'fence_gate'
};

export function initSelectionManager(appState) {
  Context = appState;
}

export function selectTarget(type, id, isUserInteraction = false) {
  Context.clear3DEditHandles();
  if (isUserInteraction && type === TARGET_TYPES.ITEM && id) {
    const item = Context.testMap.getEntity('item', id);
    if (item && item.type === 'wind_chime') {
      Context.playWindChimeSound();
    }
  }
  if (type === TARGET_TYPES.ITEM) {
    Context.entityManager.selectedItemId = id;
  } else {
    Context.entityManager.selectedItemId = null;
  }

  Context.selectedTarget = id ? { type, id } : { type: null, id: null };

  // 同步更新共享在 appState 上的选择状态
  Context.selectedRoomId = type === TARGET_TYPES.ROOM ? id : null;
  Context.selectedRoomId = type === TARGET_TYPES.ROOM ? id : null;
  Context.selectedWallId = type === TARGET_TYPES.WALL ? id : null;
  Context.selectedItemId = type === TARGET_TYPES.ITEM ? id : null;
  Context.selectedOpeningId = type === TARGET_TYPES.OPENING ? id : null;
  Context.selectedRoofId = type === TARGET_TYPES.ROOF ? id : null;
  Context.selectedStairsId = type === TARGET_TYPES.STAIRS ? id : null;
  Context.selectedFenceId = type === TARGET_TYPES.FENCE ? id : null;
  Context.selectedFenceGateId = type === TARGET_TYPES.FENCE_GATE ? id : null;

  Context.testMap.setSelectedItem(type === TARGET_TYPES.ITEM ? id : null);
  Context.testMap.setSelectedWall(type === TARGET_TYPES.WALL ? id : null);
  Context.testMap.setSelectedFence(type === TARGET_TYPES.FENCE ? id : null);
  Context.testMap.setSelectedFenceGate(type === TARGET_TYPES.FENCE_GATE ? id : null);
  Context.testMap.setSelectedRoom(type === TARGET_TYPES.ROOM ? id : null);
  Context.testMap.setSelectedRoof?.(type === TARGET_TYPES.ROOF ? id : null);
  Context.testMap.setSelectedStairs?.(type === TARGET_TYPES.STAIRS ? id : null);

  if (type === TARGET_TYPES.FENCE && id) {
    Context.set3DEditTarget('fence', id);
  }

  Context.syncLocalToStore();
  Context.updateEditor();
  Context.renderPlan();
}

export function clearSelection() {
  Context.clearDrawWallPreview();
  selectTarget(null, null);
}

export function selectRoom(id) {
  return selectTarget(TARGET_TYPES.ROOM, id);
}

export function selectWall(id) {
  return selectTarget(TARGET_TYPES.WALL, id);
}

export function selectItem(id, isUserInteraction = false) {
  return selectTarget(TARGET_TYPES.ITEM, id, isUserInteraction);
}

export function selectOpening(id) {
  return selectTarget(TARGET_TYPES.OPENING, id);
}

export function selectRoof(id) {
  return selectTarget(TARGET_TYPES.ROOF, id);
}

export function selectStairs(id) {
  return selectTarget(TARGET_TYPES.STAIRS, id);
}

export function selectFence(id) {
  return selectTarget(TARGET_TYPES.FENCE, id);
}

export function selectFenceGate(id) {
  return selectTarget(TARGET_TYPES.FENCE_GATE, id);
}
