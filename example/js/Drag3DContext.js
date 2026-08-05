let Context = null;
const DRAG_START_THRESHOLD_PX = 4;

function hasPassedDragThreshold(dragState, event) {
  if (dragState.dragStarted) return true;
  if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) {
    dragState.dragStarted = true;
    return true;
  }
  const distance = Math.hypot(event.clientX - dragState.startClientX, event.clientY - dragState.startClientY);
  if (distance < DRAG_START_THRESHOLD_PX) return false;
  dragState.dragStarted = true;
  return true;
}

export function initDrag3DContext(appState) {
  Context = appState;
}

export function getDrag3DState() {
  return Context.drag3DState;
}

export function setDrag3DState(val) {
  Context.drag3DState = val;
}

export function onDrag3DDown(target, event) {
  const testMap = Context.testMap;
  const canvas = Context.canvas;
  const camera = Context.camera;

  if (target.type === 'opening') {
    Context.selectOpening(target.id);
    const opening = testMap.getEntity('opening', target.id);
    if (!opening || opening.locked) return;
    testMap.beginEntityPreview('opening', target.id);
    Context.drag3DState = {
      type: 'opening',
      openingId: target.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      dragStarted: false,
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
    if (Context.selectedWallId === target.id) {
      if (!Context.same3DEditTarget('wall', target.id)) Context.set3DEditTarget('wall', target.id);
    } else {
      Context.selectWall(target.id);
    }
    event.preventDefault();
    return;
  }

  if (target.type === 'room') {
    if (Context.selectedRoomId === target.id) {
      if (!Context.same3DEditTarget('room', target.id)) Context.set3DEditTarget('room', target.id);
    } else {
      Context.selectRoom(target.id);
    }
    event.preventDefault();
    return;
  }

  if (target.type === 'roof' || target.type === 'stairs') {
    const isSame = target.type === 'roof' ? Context.selectedRoofId === target.id : Context.selectedStairsId === target.id;
    if (isSame) {
      if (!Context.same3DEditTarget(target.type, target.id)) Context.set3DEditTarget(target.type, target.id);
    } else if (target.type === 'roof') {
      Context.selectRoof(target.id);
    } else {
      Context.selectStairs(target.id);
    }
    event.preventDefault();
    return;
  }
  if (target.type === 'fence') {
    if (Context.selectedFenceId === target.id) {
      if (!Context.same3DEditTarget('fence', target.id)) Context.set3DEditTarget('fence', target.id);
    } else {
      Context.selectFence(target.id);
    }
    event.preventDefault();
    return;
  }
  if (target.type === 'fence_gate') {
    Context.selectFenceGate(target.id);
    const gate = testMap.getEntity('fence_gate', target.id);
    const groundPoint = Context.groundPointFromPointer();
    if (!gate || gate.locked || !groundPoint) return;
    Context.drag3DState = {
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
    testMap.beginEntityPreview('fence_gate', target.id);
    document.body.classList.add('is-dragging-3d');
    canvas.setPointerCapture?.(event.pointerId);
    camera.detachControl(canvas);
    event.preventDefault();
    return;
  }

  const itemId = target.id;
  Context.selectItem(itemId, true);
  const item = testMap.getEntity('item', itemId);
  if (!item || item.locked) return;
  const definition = testMap.getFurnitureDefinition(item.type);
  const isWallItem = definition?.placeType === 'wall';
  const wallPoint = isWallItem ? Context.wallPointFromPointer?.() : null;
  const pointerPoint = wallPoint || Context.groundPointFromPointer();
  if (!pointerPoint) return;

  let wallAlongOffset = 0;
  if (wallPoint?.wall) {
    const [x1, z1] = wallPoint.wall.from;
    const [x2, z2] = wallPoint.wall.to;
    const length = Math.hypot(x2 - x1, z2 - z1) || 1;
    wallAlongOffset = ((item.x - wallPoint.x) * (x2 - x1) + (item.z - wallPoint.z) * (z2 - z1)) / length;
  }

  Context.drag3DState = {
    type: 'item',
    itemId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    dragStarted: false,
    wallMounted: isWallItem,
    wallAlongOffset,
    offsetX: item.x - pointerPoint.x,
    offsetZ: item.z - pointerPoint.z,
    originalX: item.x,
    originalZ: item.z,
    originalElevation: item.elevation || 0,
    historyPushed: false
  };
  document.body.classList.add('is-dragging-3d');
  canvas.setPointerCapture?.(event.pointerId);
  camera.detachControl(canvas);
  event.preventDefault();
}

export function move3DDrag(pointerInfo) {
  const dragState = Context.drag3DState;
  if (!dragState) return;
  if (!hasPassedDragThreshold(dragState, pointerInfo.event)) return;
  const wallPoint = (dragState.type === 'opening' || dragState.wallMounted)
    ? Context.wallPointFromPointer?.()
    : null;
  if ((dragState.type === 'opening' || dragState.wallMounted) && !wallPoint) return;
  const groundPoint = wallPoint || Context.groundPointFromPointer();
  if (!groundPoint) return;
  
  if (dragState.type === 'edit-handle') {
    Context.move3DEditHandle(groundPoint);
  } else if (dragState.type === 'item') {
    let nextX = groundPoint.x + dragState.offsetX;
    let nextZ = groundPoint.z + dragState.offsetZ;
    let placementHint = null;
    if (dragState.wallMounted && wallPoint?.wall) {
      const [x1, z1] = wallPoint.wall.from;
      const [x2, z2] = wallPoint.wall.to;
      const length = Math.hypot(x2 - x1, z2 - z1) || 1;
      nextX = wallPoint.x + (x2 - x1) / length * dragState.wallAlongOffset;
      nextZ = wallPoint.z + (z2 - z1) / length * dragState.wallAlongOffset;
      placementHint = { wallId: wallPoint.wallId, side: wallPoint.side };
    }
    if (!dragState.historyPushed && Math.hypot(nextX - dragState.originalX, nextZ - dragState.originalZ) > 0.02) {
      Context.pushHistory();
      dragState.historyPushed = true;
    }
    Context.moveItemTo(dragState.itemId, nextX, nextZ, placementHint);
  } else if (dragState.type === 'opening') {
    Context.DragHandler.moveOpeningToWorld(dragState.openingId, {
      x: groundPoint.x,
      z: groundPoint.z,
      wallId: wallPoint?.wallId
    }, dragState);
  } else if (dragState.type === 'roof' || dragState.type === 'stairs') {
    const nextX = groundPoint.x + dragState.offsetX;
    const nextZ = groundPoint.z + dragState.offsetZ;
    if (!dragState.historyPushed && Math.hypot(nextX - dragState.originalX, nextZ - dragState.originalZ) > 0.02) {
      Context.pushHistory();
      dragState.historyPushed = true;
    }
    Context.moveStructureTo(dragState.type, dragState.structureId, nextX, nextZ, { rebuild: false, refresh: false });
  } else if (dragState.type === 'fence_gate') {
    Context.DragHandler.moveFenceGateToWorld(dragState.gateId, { x: groundPoint.x, z: groundPoint.z }, dragState);
  }
  pointerInfo.event.preventDefault();
}

export function end3DDrag(event) {
  const dragState = Context.drag3DState;
  if (!dragState) return;
  if (event?.pointerId !== undefined && dragState.pointerId !== event.pointerId) return;

  const testMap = Context.testMap;
  const canvas = Context.canvas;
  const camera = Context.camera;

  if (dragState.type === 'item' && dragState.dragStarted) {
    const item = testMap.getEntity('item', dragState.itemId);
    if (item) {
      Context.entityManager.moveItemTo(dragState.itemId, item.x, item.z, true);
    }
  }

  canvas.releasePointerCapture?.(dragState.pointerId);
  const openingId = dragState.type === 'opening' ? dragState.openingId : null;
  const fenceGateId = dragState.type === 'fence_gate' ? dragState.gateId : null;
  const roofId = dragState.type === 'roof' ? dragState.structureId : null;
  const stairsId = dragState.type === 'stairs' ? dragState.structureId : null;
  const completedEditHandle = dragState.type === 'edit-handle' ? Context.getEditHandleDragState() : null;
  const editTarget = dragState.type === 'edit-handle' ? Context.active3DEditTarget : null;
  
  Context.drag3DState = null;
  Context.setEditHandleDragState(null);
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);
  
  if (openingId && !dragState.dragStarted) {
    testMap.cancelEntityPreview('opening', openingId);
  } else if (openingId) {
    testMap.commitEntityPreview('opening', openingId).then(() => {
      Context.refreshShadows();
      Context.selectOpening(openingId);
    });
  }
  if (fenceGateId) {
    testMap.commitEntityPreview('fencegate', fenceGateId).then(() => {
      Context.refreshShadows();
      Context.selectFenceGate(fenceGateId);
    });
  }
  if (roofId) Context.selectRoof(roofId);
  if (stairsId) Context.selectStairs(stairsId);
  if (completedEditHandle) {
    testMap.commitEntityPreview(completedEditHandle.type, completedEditHandle.id).then(() => {
      Context.refreshShadows();
    });
  } else if (roofId || stairsId) {
    testMap.commitEntityPreview(roofId ? 'roof' : 'stairs', roofId || stairsId).then(() => {
      Context.refreshShadows();
    });
  }
  if (editTarget) {
    Context.active3DEditTarget = editTarget;
    Context.refresh3DEditHandles();
  }
}

export function cancel3DDrag(event) {
  const dragState = Context.drag3DState;
  if (!dragState) return Promise.resolve(false);
  if (event?.pointerId !== undefined && dragState.pointerId !== event.pointerId) {
    return Promise.resolve(false);
  }

  const { testMap, canvas, camera } = Context;
  canvas.releasePointerCapture?.(dragState.pointerId);
  Context.drag3DState = null;
  Context.setEditHandleDragState(null);
  document.body.classList.remove('is-dragging-3d');
  camera.attachControl(canvas, true, false, 1);

  const preview = testMap.getEntityPreviewStatus?.();
  if (preview?.state !== 'active' || !preview.type || !preview.id) {
    return Promise.resolve(false);
  }

  return Promise.resolve(testMap.cancelEntityPreview(preview.type, preview.id)).then((cancelled) => {
    if (cancelled) Context.refreshShadows?.();
    return cancelled;
  });
}
