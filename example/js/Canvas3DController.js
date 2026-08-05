import { PointerEventTypes, Topology } from '../../src/index.js';
import * as Drag3DContext from './Drag3DContext.js';
import * as DesignController from './DesignController.js';
import * as RailingPreview from './RailingPreview.js';
import { get3DTarget, isTargetOnCurrentFloor, showObjectContextMenu } from './TargetHandler.js';
import { begin3DEditHandleDrag, pickNearest3DTarget, updateHandleHoverState } from './Viewer3DHandles.js';
import {
  cancelFurniturePlacement,
  commitFurniturePlacement,
  hideFurniturePlacementPreview,
  isFurniturePlacementActive,
  updateFurniturePlacement
} from './FurniturePlacementController.js';

let API = null;

export function initCanvas3DController(Context) {
  const {
    canvas, scene, testMap, executeDesignTool, clearSelection, pushHistory, refreshShadows,
    groundPointFromPointer, snapWorldPoint, snapToGridSegmentCenter, getWallProjectionT,
    cancelLongPress, handlePointerCancel, cancelObjectInteractions, updateDesignCursor
  } = Context;
  const BABYLON = { PointerEventTypes };
  const {
    isAddRoomMode, roomShapeFromMode, getOpeningModeInfo, isAddOpeningMode,
    switchToSelectMode, getPickedColorFromTarget
  } = DesignController;
  const {
    getFreeFloorEdges, addRailingToStairs, clear2DFloorEdgeRailingPreview,
    clear3DFloorEdgeRailingPreview, clear2DStairsRailingPreview, clear3DStairsRailingPreview,
    update3DFloorEdgeRailingPreview, update3DStairsRailingPreview,
    clearDrawWallPreview, updateDrawWallPreview
  } = RailingPreview;
  const { selectFence, selectFenceGate, selectOpening, selectRoof, selectRoom, selectStairs } = Context;

function begin3DDrag(pointerInfo) {
  if (window.firstPersonActive) return;
  const event = pointerInfo.event;
  if (isFurniturePlacementActive()) {
    if (event.button === 2) {
      cancelFurniturePlacement();
      event.preventDefault();
      return;
    }
    const isPrimaryMouseDown = event.pointerType === 'mouse' && event.button === 0 && event.buttons === 1;
    if (isPrimaryMouseDown || event.pointerType === 'touch' || event.pointerType === 'pen') {
      const point = groundPointFromPointer();
      if (point) commitFurniturePlacement(point);
      event.preventDefault();
      return;
    }
  }
  if (Context.currentView === '3d' && Context.designMode !== 'select') {
    if (event.button === 0 || event.pointerType === 'touch') {
      const target = pickNearest3DTarget();
      if (target) {
        executeDesignTool(target);
        event.preventDefault();
        return;
      }
    }
  }
  if (Context.mode === 'view') {
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
    if (Context.mode === 'draw-wall' || Context.mode === 'delete-wall' || isAddRoomMode() || Context.mode.startsWith('add-roof') || Context.mode.startsWith('add-stairs') || isAddOpeningMode() || Context.mode.startsWith('draw-fence')) {
      Context.drawStart = null;
      clearDrawWallPreview();
      switchToSelectMode();
      event.preventDefault();
      return;
    }
  }
  if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

  if (Context.mode === 'delete-wall') {
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

  if (Context.mode === 'draw-wall') {
    const point = groundPointFromPointer();
    if (point) {
      const snapped = snapWorldPoint({ x: point.x, z: point.z });
      const snappedPos = [snapped.x, snapped.z];
      if (!Context.drawStart) {
        Context.drawStart = snappedPos;
      } else {
        pushHistory();
        testMap.executeCommand('addWall', { from: Context.drawStart, to: snappedPos });
        Context.drawStart = null;
        clearDrawWallPreview();
        refreshShadows();
      }
      event.preventDefault();
      return;
    }
  }

  if (isAddRoomMode() || Context.mode.startsWith('add-roof') || Context.mode.startsWith('add-stairs') || Context.mode.startsWith('draw-fence')) {
    if (Context.mode.startsWith('draw-fence')) {
      const target = pickNearest3DTarget();
      if (target && target.type === 'stairs') {
        pushHistory();
        addRailingToStairs(target.id, Context.mode.replace('draw-fence-', '') || 'picket_wood');
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
          const subtype = Context.mode.replace('draw-fence-', '') || 'picket_wood';
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
      if (Context.mode.startsWith('draw-fence')) {
        const subtype = Context.mode.replace('draw-fence-', '') || 'picket_wood';
        if (!Context.drawStart) {
          Context.drawStart = [snapped.x, snapped.z];
        } else {
          pushHistory();
          const fence = testMap.executeCommand('addFence', {
            from: Context.drawStart,
            to: [snapped.x, snapped.z],
            subtype: subtype
          });
          Context.drawStart = null;
          clearDrawWallPreview();
          refreshShadows();
          selectFence(fence.id);
          switchToSelectMode();
        }
      } else {
        pushHistory();
        if (isAddRoomMode()) {
          const room = testMap.executeCommand('addRoom', { x: snapped.x, z: snapped.z, shape: roomShapeFromMode(), name: `新房间 ${Context.roomCounter++}` });
          refreshShadows();
          selectRoom(room.id);
        } else if (Context.mode.startsWith('add-roof')) {
          const subtype = Context.mode.replace('add-roof-', '') || 'gable';
          const room = Context.selectedRoomId ? testMap.getEntity('room', Context.selectedRoomId) : testMap.getRoomAt(snapped.x, snapped.z);
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
          const subtype = Context.mode.replace('add-stairs-', '') || 'straight';
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
  
  if (Context.mode.startsWith('add-fence-gate')) {
    const target = pickNearest3DTarget();
    if (target && target.type === 'fence') {
      const fence = testMap.getEntity('fence', target.id);
      const pt = target.pick.pickedPoint;
      if (fence && pt) {
        pushHistory();
        const { t } = Topology.projectPointToFence(pt, fence, false, 0);
        const subtype = Context.mode.replace('add-fence-gate-', '') || 'picket_wood';
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
      const subtype = Context.mode.replace('add-fence-gate-', '') || 'picket_wood';
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
      const wall = testMap.getEntity('wall', wallId);
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

function cancel3DDrag(event) {
  return Drag3DContext.cancel3DDrag(event);
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
  if (Context.mode === 'view') {
    event.preventDefault();
    return;
  }
  if (Context.mode === 'draw-wall' || Context.mode === 'delete-wall' || isAddRoomMode() || Context.mode.startsWith('add-roof') || Context.mode.startsWith('add-stairs') || isAddOpeningMode() || Context.mode.startsWith('draw-fence')) {
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
  if (Context.mode === 'view') return;
  if (event.pointerType === 'mouse' || event.button === 2) return;
  const target = get3DTarget(event);
  if (!target) return;
  const startX = event.clientX;
  const startY = event.clientY;
  cancelLongPress();
  Context.longPressState = {
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    startX,
    startY,
    timer: window.setTimeout(() => {
      Context.longPressState = null;
      cancelObjectInteractions();
      showObjectContextMenu(target, startX, startY);
    }, 500)
  };
});

canvas.addEventListener('pointermove', (event) => {
  if (!Context.longPressState || Context.longPressState.pointerId !== event.pointerId) return;
  const tolerance = (event.pointerType === 'touch' || Context.longPressState.pointerType === 'touch') ? 20 : 8;
  if (Math.hypot(event.clientX - Context.longPressState.startX, event.clientY - Context.longPressState.startY) > tolerance) {
    cancelLongPress();
  }
});

canvas.addEventListener('pointerup', cancelLongPress);
canvas.addEventListener('pointercancel', handlePointerCancel);
canvas.addEventListener('pointerleave', () => {
  if (isFurniturePlacementActive()) {
    hideFurniturePlacementPreview();
  }
  if (Context.designMode === 'picker') {
    updateDesignCursor(null);
  }
});
scene.onPointerObservable.add((pointerInfo) => {
  if (Context.currentView !== '3d') return;
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) begin3DDrag(pointerInfo);
  if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
    if (isFurniturePlacementActive()) {
      const point = groundPointFromPointer();
      if (point) updateFurniturePlacement(point);
      return;
    }
    updateHandleHoverState();
    if (Context.designMode === 'picker') {
      const target = pickNearest3DTarget();
      const hoverColor = getPickedColorFromTarget(target);
      updateDesignCursor(hoverColor);
    }
    if (Context.mode === 'delete-wall') {
      const target = pickNearest3DTarget();
      const hoverErasable = target && isTargetOnCurrentFloor(target) && (target.type === 'wall' || target.type === 'fence' || target.type === 'fence_gate');
      document.body.classList.toggle('cursor-hover-erasable', !!hoverErasable);
    }
    if (Context.mode.startsWith('draw-fence')) {
      const target = pickNearest3DTarget();
      if (target && target.type === 'stairs') {
        update3DStairsRailingPreview(target.id, Context.mode.replace('draw-fence-', '') || 'picket_wood');
        clear3DFloorEdgeRailingPreview();
        // 只清理普通墙体或围栏预览圆柱，保留楼梯预览
        if (Context.drawWallPreviewCylinder) {
          Context.drawWallPreviewCylinder.dispose();
          Context.drawWallPreviewCylinder = null;
        }
        if (Context.drawWallPreviewStartCylinder) {
          Context.drawWallPreviewStartCylinder.dispose();
          Context.drawWallPreviewStartCylinder = null;
        }
        if (Context.drawWallPreviewWall) {
          Context.drawWallPreviewWall.dispose();
          Context.drawWallPreviewWall = null;
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
            update3DFloorEdgeRailingPreview(bestIndex, bestEdge, Context.mode.replace('draw-fence-', '') || 'picket_wood');
            if (Context.drawWallPreviewCylinder) {
              Context.drawWallPreviewCylinder.dispose();
              Context.drawWallPreviewCylinder = null;
            }
            if (Context.drawWallPreviewStartCylinder) {
              Context.drawWallPreviewStartCylinder.dispose();
              Context.drawWallPreviewStartCylinder = null;
            }
            if (Context.drawWallPreviewWall) {
              Context.drawWallPreviewWall.dispose();
              Context.drawWallPreviewWall = null;
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
    } else if (Context.mode === 'draw-wall') {
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

canvas.addEventListener('pointercancel', (event) => {
  void cancel3DDrag(event).catch((error) => {
    console.error('Failed to cancel 3D drag preview:', error);
  });
});
window.addEventListener('pointerup', end3DDrag);

// ==========================================
// 娌℃湁澧欎綋鐨勫湴鏉胯竟缂樿嚜鍔ㄨ瘑鍒笌鎮诞棰勮 (NEW)
// ==========================================



  API = { begin3DDrag, move3DDrag, end3DDrag, cancel3DDrag, getCanvasPickFromEvent };
  return API;
}

export function begin3DDrag(pointerInfo) { return API?.begin3DDrag(pointerInfo); }
export function move3DDrag(pointerInfo) { return API?.move3DDrag(pointerInfo); }
export function end3DDrag(event) { return API?.end3DDrag(event); }
export function cancel3DDrag(event) { return API?.cancel3DDrag(event); }
export function getCanvasPickFromEvent(event) { return API?.getCanvasPickFromEvent(event); }
