// 这是一个向下兼容的平面图拖拽处理器转发门面
import * as Topology from '../../src/editor/Topology.js';

let activeInstance = null;

export function initDragHandler(appContext) {
  activeInstance = appContext.dragHandler;
}

export const states = new Proxy({}, {
  get(target, prop) {
    return activeInstance ? activeInstance.states[prop] : null;
  },
  set(target, prop, value) {
    if (activeInstance) {
      activeInstance.states[prop] = value;
      return true;
    }
    return false;
  }
});

export function clearAllDragStates() { activeInstance?.clearAllDragStates(); }
export function isRoomDragActive() { return activeInstance ? activeInstance.isRoomDragActive() : false; }
export function isRoomResizeActive() { return activeInstance ? activeInstance.isRoomResizeActive() : false; }
export function isStructureDragActive() { return activeInstance ? activeInstance.isStructureDragActive() : false; }
export function isOpeningDragActive() { return activeInstance ? activeInstance.isOpeningDragActive() : false; }
export function isFenceGateDragActive() { return activeInstance ? activeInstance.isFenceGateDragActive() : false; }
export function isWallDragActive() { return activeInstance ? activeInstance.isWallDragActive() : false; }
export function isFenceHandleDragActive() { return activeInstance ? activeInstance.isFenceHandleDragActive() : false; }
export function isFenceDragActive() { return activeInstance ? activeInstance.isFenceDragActive() : false; }

export function beginRoomDrag(event, roomId) { activeInstance?.beginRoomDrag(event, roomId); }
export function beginRoomResize(event, roomId, side) { activeInstance?.beginRoomResize(event, roomId, side); }
export function moveRoomDrag(event) { activeInstance?.moveRoomDrag(event); }
export function moveRoomResize(event) { activeInstance?.moveRoomResize(event); }
export function finishRoomEdit() { activeInstance?.finishRoomEdit(); }

export function beginWallDrag(event, wallId) { activeInstance?.beginWallDrag(event, wallId); }
export function moveWallDrag(event) { activeInstance?.moveWallDrag(event); }
export function moveWallBy(wallId, dx, dz) { activeInstance?.moveWallBy(wallId, dx, dz); }
export function finishWallDrag() { activeInstance?.finishWallDrag(); }

export function beginOpeningDrag(event, openingId) { activeInstance?.beginOpeningDrag(event, openingId); }
export function moveOpeningDrag(event) { activeInstance?.moveOpeningDrag(event); }
export function moveOpeningToWorld(openingId, world, dragMeta) { activeInstance?.moveOpeningToWorld(openingId, world, dragMeta); }
export function finishOpeningDrag() { activeInstance?.finishOpeningDrag(); }

export function beginFenceDrag(event, fenceId) { activeInstance?.beginFenceDrag(event, fenceId); }
export function moveFenceDrag(event) { activeInstance?.moveFenceDrag(event); }
export function moveFenceBy(fenceId, dx, dz) { activeInstance?.moveFenceBy(fenceId, dx, dz); }
export function finishFenceDrag() { activeInstance?.finishFenceDrag(); }

export function beginFenceGateDrag(event, gateId) { activeInstance?.beginFenceGateDrag(event, gateId); }
export function moveFenceGateDrag(event) { activeInstance?.moveFenceGateDrag(event); }
export function moveFenceGateToWorld(gateId, world, dragMeta) { activeInstance?.moveFenceGateToWorld(gateId, world, dragMeta); }
export function finishFenceGateDrag() { activeInstance?.finishFenceGateDrag(); }

export function beginFenceHandleDrag(event, fenceId, handle) { activeInstance?.beginFenceHandleDrag(event, fenceId, handle); }
export function moveFenceHandleDrag(event) { activeInstance?.moveFenceHandleDrag(event); }

export function beginStructureDrag(event, type, id) { activeInstance?.beginStructureDrag(event, type, id); }
export function moveStructureDrag(event) { activeInstance?.moveStructureDrag(event); }

export function finishDrag() { activeInstance?.finishDrag(); }
