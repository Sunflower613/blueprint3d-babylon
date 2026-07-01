import * as Topology from './Topology.js';
import { createStoreProxy } from '../store/proxyHelper.js';

let rawCtx = null;
const ctx = createStoreProxy(() => rawCtx);

export const states = {
  roomDrag: null,
  roomResize: null,
  wallDrag: null,
  openingDrag: null,
  structureDrag: null,
  fenceDrag: null,
  fenceHandleDrag: null,
  fenceGateDrag: null
};

/**
 * 初始化拖拽处理器并绑定上下文环境
 * @param {Object} appContext 包含全局实例和工具函数的上下文对象
 */
export function initDragHandler(appContext) {
  rawCtx = appContext;
}

/**
 * 清除所有拖拽相关的临时状态
 */
export function clearAllDragStates() {
  states.roomDrag = null;
  states.roomResize = null;
  states.structureDrag = null;
  states.openingDrag = null;
  states.fenceDrag = null;
  states.fenceHandleDrag = null;
  states.fenceGateDrag = null;
  states.wallDrag = null;
}

export function isRoomDragActive() { return !!states.roomDrag; }
export function isRoomResizeActive() { return !!states.roomResize; }
export function isStructureDragActive() { return !!states.structureDrag; }
export function isOpeningDragActive() { return !!states.openingDrag; }
export function isFenceGateDragActive() { return !!states.fenceGateDrag; }
export function isWallDragActive() { return !!states.wallDrag; }
export function isFenceHandleDragActive() { return !!states.fenceHandleDrag; }
export function isFenceDragActive() { return !!states.fenceDrag; }

// --- 房间拖拽与缩放 ---

export function beginRoomDrag(event, roomId) {
  if (event.button === 2) return;
  if (ctx.mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  ctx.selectRoom(roomId);
  const room = ctx.testMap.getRoom(roomId);
  if (!room || room.locked) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  states.roomDrag = {
    roomId,
    offsetX: room.x - world.x,
    offsetZ: room.z - world.z,
    originalX: room.x,
    originalZ: room.z,
    width: room.width,
    depth: room.depth,
    historyPushed: false
  };
  ctx.svg.setPointerCapture(event.pointerId);
}

export function beginRoomResize(event, roomId, side) {
  if (event.button === 2) return;
  if (ctx.mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  ctx.selectRoom(roomId);
  const room = ctx.testMap.getRoom(roomId);
  if (!room || room.locked) return;
  const original = { x: room.x, z: room.z, width: room.width, depth: room.depth };
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);

  let offsetX = 0;
  let offsetZ = 0;
  if (side === 'west') offsetX = left - world.x;
  if (side === 'east') offsetX = right - world.x;
  if (side === 'north') offsetZ = bottom - world.z;
  if (side === 'south') offsetZ = top - world.z;

  states.roomResize = {
    roomId,
    side,
    original,
    offsetX,
    offsetZ,
    historyPushed: false
  };
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveRoomDrag(event) {
  if (!states.roomDrag) return;
  const room = ctx.testMap.getRoom(states.roomDrag.roomId);
  if (!room || room.locked) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const snappedRoom = ctx.snapRoomPosition(room, world.x + states.roomDrag.offsetX, world.z + states.roomDrag.offsetZ);
  const nextX = snappedRoom.x;
  const nextZ = snappedRoom.z;
  if (!states.roomDrag.historyPushed && Math.hypot(nextX - states.roomDrag.originalX, nextZ - states.roomDrag.originalZ) > 0.02) {
    ctx.pushHistory();
    states.roomDrag.historyPushed = true;
  }
  ctx.testMap.updateRoom(room.id, { x: nextX, z: nextZ }, { moveItems: true, rebuild: false });
  ctx.syncRoomMovePreview(room.id);
  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function moveRoomResize(event) {
  if (!states.roomResize) return;
  const room = ctx.testMap.getRoom(states.roomResize.roomId);
  if (!room || room.locked) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const original = states.roomResize.original;
  const left = original.x - original.width / 2;
  const right = original.x + original.width / 2;
  const top = original.z - original.depth / 2;
  const bottom = original.z + original.depth / 2;
  const side = states.roomResize.side;

  let nextWidth = original.width;
  let nextDepth = original.depth;
  let nextX = original.x;
  let nextZ = original.z;

  if (side === 'west') {
    const nextLeft = Math.min(ctx.snapNumber(world.x + states.roomResize.offsetX), right - 1.2);
    nextWidth = ctx.snapNumber(right - nextLeft);
    nextX = Number((right - nextWidth / 2).toFixed(3));
  } else if (side === 'east') {
    const nextRight = Math.max(ctx.snapNumber(world.x + states.roomResize.offsetX), left + 1.2);
    nextWidth = ctx.snapNumber(nextRight - left);
    nextX = Number((left + nextWidth / 2).toFixed(3));
  } else if (side === 'north') {
    const nextBottom = Math.max(ctx.snapNumber(world.z + states.roomResize.offsetZ), top + 1.2);
    nextDepth = ctx.snapNumber(nextBottom - top);
    nextZ = Number((top + nextDepth / 2).toFixed(3));
  } else if (side === 'south') {
    const nextTop = Math.min(ctx.snapNumber(world.z + states.roomResize.offsetZ), bottom - 1.2);
    nextDepth = ctx.snapNumber(bottom - nextTop);
    nextZ = Number((bottom - nextDepth / 2).toFixed(3));
  }

  const patch = {
    x: nextX,
    z: nextZ,
    width: nextWidth,
    depth: nextDepth
  };
  if (!states.roomResize.historyPushed && (Math.abs(patch.width - original.width) > 0.02 || Math.abs(patch.depth - original.depth) > 0.02)) {
    ctx.pushHistory();
    states.roomResize.historyPushed = true;
  }
  ctx.testMap.updateRoom(room.id, patch, { moveItems: false, rebuild: false });
  ctx.syncRoomMovePreview(room.id);
  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function finishRoomEdit() {
  const needRebuild = !!(states.roomDrag || states.roomResize);
  states.roomDrag = null;
  states.roomResize = null;
  if (needRebuild) {
    ctx.testMap.build();
    ctx.refreshShadows();
  }
}

// --- 墙体拖拽 ---

export function beginWallDrag(event, wallId) {
  if (event.button === 2) return;
  if (ctx.mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  ctx.rememberPointer(event);
  ctx.selectWall(wallId);
  const wall = ctx.testMap.getWall(wallId);
  if (!wall) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  states.wallDrag = {
    wallId,
    originalFrom: [...wall.from],
    originalTo: [...wall.to],
    startWorldX: world.x,
    startWorldZ: world.z,
    historyPushed: false
  };
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveWallDrag(event) {
  if (!states.wallDrag) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const dx = world.x - states.wallDrag.startWorldX;
  const dz = world.z - states.wallDrag.startWorldZ;
  if (!states.wallDrag.historyPushed && Math.hypot(dx, dz) > 0.02) {
    ctx.pushHistory();
    states.wallDrag.historyPushed = true;
  }
  moveWallBy(states.wallDrag.wallId, dx, dz);
}

export function moveWallBy(wallId, dx, dz) {
  const wall = ctx.testMap.getWall(wallId);
  if (!wall) return;
  
  let nextFromX = states.wallDrag.originalFrom[0] + dx;
  let nextFromZ = states.wallDrag.originalFrom[1] + dz;
  let nextToX = states.wallDrag.originalTo[0] + dx;
  let nextToZ = states.wallDrag.originalTo[1] + dz;
  
  if (ctx.snapEnabled && ctx.snapSize) {
    const origDx = states.wallDrag.originalTo[0] - states.wallDrag.originalFrom[0];
    const origDz = states.wallDrag.originalTo[1] - states.wallDrag.originalFrom[1];
    const snappedFrom = ctx.snapWorldPoint({ x: nextFromX, z: nextFromZ });
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
  
  ctx.testMap.updateWall(wallId, {
    from: [nextFromX, nextFromZ],
    to: [nextToX, nextToZ]
  }, { rebuild: false });
  ctx.syncWallMovePreview(wallId);
  
  ctx.updateEditor();
  ctx.renderPlan();
}

export function finishWallDrag() {
  if (!states.wallDrag) return;
  const wallId = states.wallDrag.wallId;
  states.wallDrag = null;
  ctx.testMap.build();
  ctx.refreshShadows();
  ctx.selectWall(wallId);
}

// --- 洞口拖拽 ---

export function beginOpeningDrag(event, openingId) {
  if (event.button === 2) return;
  event.preventDefault();
  event.stopPropagation();
  ctx.selectOpening(openingId);
  const opening = ctx.testMap.getOpening(openingId);
  if (ctx.mode === 'delete-wall') {
    if (opening?.locked) return;
    ctx.pushHistory();
    ctx.testMap.deleteOpening(openingId);
    ctx.clearSelection();
    ctx.refreshShadows();
    ctx.renderPlan();
    return;
  }
  if (ctx.mode !== 'select') return;
  const wall = opening ? ctx.testMap.getWall(opening.wallId) : null;
  if (!opening || opening.locked || !wall) return;
  states.openingDrag = {
    openingId,
    originalT: opening.t ?? 0.5,
    historyPushed: false
  };
  ctx.testMap.beginOpeningDragPreview(openingId);
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveOpeningDrag(event) {
  if (!states.openingDrag) return;
  const point = ctx.svgPointFromEvent(event);
  moveOpeningToWorld(states.openingDrag.openingId, ctx.svgToWorld(point.x, point.y), states.openingDrag);
}

export function moveOpeningToWorld(openingId, world, dragMeta) {
  const opening = ctx.testMap.getOpening(openingId);
  const wall = opening ? ctx.testMap.getWall(opening.wallId) : null;
  if (!opening || opening.locked || !wall) return;
  
  let nextT = ctx.getWallProjectionT(wall, world);
  
  if (ctx.snapEnabled && ctx.snapSize) {
    const ax = wall.from[0];
    const az = wall.from[1];
    const bx = wall.to[0];
    const bz = wall.to[1];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz;
    if (lengthSq > 0.001) {
      const rawCenterX = ax + dx * nextT;
      const rawCenterZ = az + dz * nextT;
      const snapped = ctx.snapToGridSegmentCenter({ x: rawCenterX, z: rawCenterZ });
      nextT = Math.max(0.08, Math.min(0.92, ((snapped.x - ax) * dx + (snapped.z - az) * dz) / lengthSq));
    }
  }
  
  if (dragMeta && !dragMeta.historyPushed && Math.abs(nextT - dragMeta.originalT) > 0.01) {
    ctx.pushHistory();
    dragMeta.historyPushed = true;
  }
  
  ctx.testMap.updateOpening(openingId, { t: nextT }, false);
  ctx.updateEditor();
  ctx.renderPlan();
}

export function finishOpeningDrag() {
  if (!states.openingDrag) return;
  const openingId = states.openingDrag.openingId;
  states.openingDrag = null;
  ctx.testMap.finishOpeningDragPreview(openingId).then(() => {
    ctx.refreshShadows();
    ctx.selectOpening(openingId);
  });
}

// --- 围栏与围栏大门拖拽 ---

export function beginFenceDrag(event, fenceId) {
  if (event.button === 2) return;
  event.stopPropagation();
  ctx.rememberPointer(event);
  ctx.selectFence(fenceId);
  const fence = ctx.testMap.getFence(fenceId);
  if (!fence || fence.locked) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  states.fenceDrag = {
    fenceId,
    originalFrom: [...fence.from],
    originalTo: [...fence.to],
    startWorldX: world.x,
    startWorldZ: world.z,
    historyPushed: false
  };
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveFenceDrag(event) {
  if (!states.fenceDrag) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const dx = world.x - states.fenceDrag.startWorldX;
  const dz = world.z - states.fenceDrag.startWorldZ;
  if (!states.fenceDrag.historyPushed && Math.hypot(dx, dz) > 0.02) {
    ctx.pushHistory();
    states.fenceDrag.historyPushed = true;
  }
  moveFenceBy(states.fenceDrag.fenceId, dx, dz);
}

export function moveFenceBy(fenceId, dx, dz) {
  const fence = ctx.testMap.getFence(fenceId);
  if (!fence || fence.locked) return;
  
  let nextFromX = states.fenceDrag.originalFrom[0] + dx;
  let nextFromZ = states.fenceDrag.originalFrom[1] + dz;
  let nextToX = states.fenceDrag.originalTo[0] + dx;
  let nextToZ = states.fenceDrag.originalTo[1] + dz;
  
  if (ctx.snapEnabled && ctx.snapSize) {
    const origDx = states.fenceDrag.originalTo[0] - states.fenceDrag.originalFrom[0];
    const origDz = states.fenceDrag.originalTo[1] - states.fenceDrag.originalFrom[1];
    const rawCenterX = nextFromX + origDx / 2;
    const rawCenterZ = nextFromZ + origDz / 2;
    const snappedCenter = ctx.snapToGridSegmentCenter({ x: rawCenterX, z: rawCenterZ });
    
    nextFromX = Number((snappedCenter.x - origDx / 2).toFixed(3));
    nextFromZ = Number((snappedCenter.z - origDz / 2).toFixed(3));
    nextToX = Number((snappedCenter.x + origDx / 2).toFixed(3));
    nextToZ = Number((snappedCenter.z + origDz / 2).toFixed(3));
  } else {
    nextFromX = Number(nextFromX.toFixed(3));
    nextFromZ = Number(nextFromZ.toFixed(3));
    nextToX = Number(nextToX.toFixed(3));
    nextToZ = Number(nextToZ.toFixed(3));
  }
  
  ctx.testMap.updateFence(fenceId, {
    from: [nextFromX, nextFromZ],
    to: [nextToX, nextToZ]
  }, false);
  ctx.syncFenceMovePreview(fenceId);
  ctx.updateEditor();
  ctx.renderPlan();
}

export function finishFenceDrag() {
  if (!states.fenceDrag && !states.fenceHandleDrag) return;
  const fenceId = states.fenceDrag ? states.fenceDrag.fenceId : states.fenceHandleDrag.fenceId;
  states.fenceDrag = null;
  states.fenceHandleDrag = null;
  ctx.testMap.build();
  ctx.refreshShadows();
  ctx.selectFence(fenceId);
}

export function beginFenceGateDrag(event, gateId) {
  if (event.button === 2) return;
  event.stopPropagation();
  ctx.rememberPointer(event);
  ctx.selectFenceGate(gateId);
  const gate = ctx.testMap.getFenceGate(gateId);
  if (!gate || gate.locked) return;

  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);

  states.fenceGateDrag = {
    gateId,
    originalFrom: [...gate.from],
    originalTo: [...gate.to],
    originalFenceId: gate.fenceId,
    originalT: gate.t,
    startX: world.x,
    startZ: world.z,
    historyPushed: false
  };

  ctx.testMap.beginFenceGateDragPreview(gateId);
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveFenceGateDrag(event) {
  if (!states.fenceGateDrag) return;
  const point = ctx.svgPointFromEvent(event);
  moveFenceGateToWorld(states.fenceGateDrag.gateId, ctx.svgToWorld(point.x, point.y), states.fenceGateDrag);
}

export function moveFenceGateToWorld(gateId, world, dragMeta) {
  const gate = ctx.testMap.getFenceGate(gateId);
  if (!gate || gate.locked) return;

  const dx = world.x - dragMeta.startX;
  const dz = world.z - dragMeta.startZ;

  if (dragMeta && !dragMeta.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
    ctx.pushHistory();
    dragMeta.historyPushed = true;
  }

  const wasAttached = dragMeta.originalFenceId !== null;
  let nearestFence = null;
  let nearestDist = Infinity;
  let projectionT = 0.5;

  if (wasAttached) {
    const originalFence = ctx.testMap.getFence(dragMeta.originalFenceId);
    if (originalFence) {
      const { t, distance } = Topology.projectPointToFence(world, originalFence, ctx.snapEnabled, ctx.snapSize);
      if (distance < 0.6) {
        nearestFence = originalFence;
        nearestDist = distance;
        projectionT = t;
      }
    }
  }

  if (!nearestFence) {
    const fences = ctx.testMap.floorplan.fences.filter(f => f.floorId === gate.floorId);
    const nearest = Topology.findNearestFenceTrack(world, fences, ctx.snapEnabled, ctx.snapSize);
    if (nearest.fence) {
      nearestFence = nearest.fence;
      nearestDist = nearest.distance;
      projectionT = nearest.t;
    }
  }

  const attachThreshold = (nearestFence && nearestFence.id === dragMeta.originalFenceId) ? 0.6 : 0.25;

  if (nearestFence && nearestDist < attachThreshold) {
    ctx.testMap.updateFenceGate(gateId, {
      fenceId: nearestFence.id,
      t: projectionT
    }, false);
  } else {
    const origCenterX = (dragMeta.originalFrom[0] + dragMeta.originalTo[0]) / 2;
    const origCenterZ = (dragMeta.originalFrom[1] + dragMeta.originalTo[1]) / 2;
    let newCenterX = origCenterX + dx;
    let newCenterZ = origCenterZ + dz;

    if (ctx.snapEnabled && ctx.snapSize) {
      const snapped = ctx.snapToGridSegmentCenter({ x: newCenterX, z: newCenterZ });
      newCenterX = snapped.x;
      newCenterZ = snapped.z;
    }

    const odx = dragMeta.originalTo[0] - dragMeta.originalFrom[0];
    const odz = dragMeta.originalTo[1] - dragMeta.originalFrom[1];
    const angle = Math.atan2(odz, odx);

    const halfW = (gate.width || 1.0) / 2;
    const nextFrom = [newCenterX - Math.cos(angle) * halfW, newCenterZ - Math.sin(angle) * halfW];
    const nextTo = [newCenterX + Math.cos(angle) * halfW, newCenterZ + Math.sin(angle) * halfW];

    ctx.testMap.updateFenceGate(gateId, {
      fenceId: null,
      from: nextFrom,
      to: nextTo
    }, false);
  }

  ctx.testMap.updateFenceGateNodeTransform(gateId);
  ctx.testMap.syncFenceGateDragPreview(gateId);
  ctx.updateEditor();
  ctx.renderPlan();
}

export function finishFenceGateDrag() {
  if (!states.fenceGateDrag) return;
  const gateId = states.fenceGateDrag.gateId;
  states.fenceGateDrag = null;
  ctx.testMap.finishFenceGateDragPreview(gateId).then(() => {
    ctx.refreshShadows();
    ctx.selectFenceGate(gateId);
  });
}

export function beginFenceHandleDrag(event, fenceId, handle) {
  if (event.button === 2) return;
  event.stopPropagation();
  ctx.rememberPointer(event);
  ctx.selectFence(fenceId);
  const fence = ctx.testMap.getFence(fenceId);
  if (!fence || fence.locked) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  states.fenceHandleDrag = {
    fenceId: fenceId,
    handle: handle,
    startWorldX: world.x,
    startWorldZ: world.z,
    historyPushed: false
  };
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveFenceHandleDrag(event) {
  if (!states.fenceHandleDrag) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const snapped = ctx.snapWorldPoint(world);
  if (!states.fenceHandleDrag.historyPushed && Math.hypot(world.x - states.fenceHandleDrag.startWorldX, world.z - states.fenceHandleDrag.startWorldZ) > 0.02) {
    ctx.pushHistory();
    states.fenceHandleDrag.historyPushed = true;
  }
  if (states.fenceHandleDrag.handle === 'from') {
    ctx.testMap.updateFence(states.fenceHandleDrag.fenceId, { from: [snapped.x, snapped.z] }, false);
  } else {
    ctx.testMap.updateFence(states.fenceHandleDrag.fenceId, { to: [snapped.x, snapped.z] }, false);
  }
  ctx.syncFenceMovePreview(states.fenceHandleDrag.fenceId);
  ctx.updateEditor();
  ctx.renderPlan();
}

// --- 结构（楼梯与屋顶）拖拽 ---

export function beginStructureDrag(event, type, id) {
  if (event.button === 2) return;
  if (ctx.mode !== 'select') return;
  event.preventDefault();
  event.stopPropagation();
  if (type === 'roof') ctx.selectRoof(id);
  if (type === 'stairs') ctx.selectStairs(id);
  const structure = ctx.getStructure(type, id);
  if (!structure || structure.locked) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  states.structureDrag = {
    type,
    id,
    offsetX: (structure.x || 0) - world.x,
    offsetZ: (structure.z || 0) - world.z,
    originalX: structure.x || 0,
    originalZ: structure.z || 0,
    historyPushed: false
  };
  ctx.svg.setPointerCapture(event.pointerId);
}

export function moveStructureDrag(event) {
  if (!states.structureDrag) return;
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const nextX = world.x + states.structureDrag.offsetX;
  const nextZ = world.z + states.structureDrag.offsetZ;
  if (!states.structureDrag.historyPushed && Math.hypot(nextX - states.structureDrag.originalX, nextZ - states.structureDrag.originalZ) > 0.02) {
    ctx.pushHistory();
    states.structureDrag.historyPushed = true;
  }
  ctx.moveStructureTo(states.structureDrag.type, states.structureDrag.id, nextX, nextZ);
}

/**
 * 集中结束并清理所有类别的 2D 拖动编辑状态
 */
export function finishDrag() {
  finishRoomEdit();
  finishOpeningDrag();
  finishWallDrag();
  finishFenceDrag();
  finishFenceGateDrag();
  states.structureDrag = null;
}
