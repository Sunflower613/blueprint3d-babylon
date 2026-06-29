import * as Topology from './Topology.js';
import * as DragHandler from './DragHandler.js';

let ctx = null;

export const viewPointers = new Map();
export let isPanning2D = false;
export let panStart2D = null;
export let prevTouchDist2D = 0;
export let prevTouchCenter2D = null;
export let hasUserZoomedOrPanned = false;

/**
 * 初始化 SVG 事件管理器并配置监听
 * @param {Object} appContext 包含外部依赖的上下文环境对象
 */
export function initSvgEvents(appContext) {
  ctx = appContext;

  const svg = ctx.svg;

  svg.addEventListener('mousedown', onMousedown);
  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onPointerdown);
  svg.addEventListener('pointermove', onPointermove);
  svg.addEventListener('pointerup', onPointerup);
  svg.addEventListener('pointercancel', onPointercancel);
  svg.addEventListener('dblclick', onDblclick);
  svg.addEventListener('click', onClick);
}

/**
 * 重置 Svg 的事件交互状态
 */
export function resetSvgInteractionState() {
  viewPointers.clear();
  isPanning2D = false;
  panStart2D = null;
  prevTouchDist2D = 0;
  prevTouchCenter2D = null;
  hasUserZoomedOrPanned = false;
}

export function getHasUserZoomedOrPanned() {
  return hasUserZoomedOrPanned;
}

export function setHasUserZoomedOrPanned(val) {
  hasUserZoomedOrPanned = val;
}

// --- 事件处理器 ---

function onMousedown(event) {
  if (event.button === 1) {
    event.preventDefault();
  }
}

function onWheel(event) {
  if (ctx.currentView !== '2d') return;
  event.preventDefault();

  const svg = ctx.svg;
  const view = ctx.view;
  const rect = svg.getBoundingClientRect();
  const svgX = ((event.clientX - rect.left) / rect.width) * view.width;
  const svgY = ((event.clientY - rect.top) / rect.height) * view.height;
  const worldCenter = ctx.svgToWorld(svgX, svgY);

  const zoomStep = 0.08;
  const factor = event.deltaY < 0 ? 1 - zoomStep : 1 + zoomStep;

  const currentSpanX = view.maxX - view.minX;
  const nextSpanX = currentSpanX * factor;
  if (nextSpanX < 0.05 || nextSpanX > 300) return;

  view.minX = worldCenter.x - factor * (worldCenter.x - view.minX);
  view.maxX = worldCenter.x + factor * (view.maxX - worldCenter.x);
  view.minZ = worldCenter.z - factor * (worldCenter.z - view.minZ);
  view.maxZ = worldCenter.z + factor * (view.maxZ - worldCenter.z);

  hasUserZoomedOrPanned = true;
  ctx.setHasUserZoomedOrPanned(true);
  ctx.renderPlan();
}

function onPointerdown(event) {
  if (ctx.currentView !== '2d') return;
  viewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  const isViewModePan = ctx.mode === 'view' && (
    (event.pointerType === 'mouse' && event.button === 0) ||
    (event.pointerType === 'touch' && viewPointers.size === 1)
  );

  if ((event.pointerType === 'mouse' && event.button === 1) || isViewModePan) {
    isPanning2D = true;
    panStart2D = { x: event.clientX, y: event.clientY };
    ctx.svg.setPointerCapture(event.pointerId);
    hasUserZoomedOrPanned = true;
    ctx.setHasUserZoomedOrPanned(true);
  }

  if (viewPointers.size === 2) {
    isPanning2D = false;
    panStart2D = null;

    ctx.entityManager.dragState = null;
    DragHandler.clearAllDragStates();
    ctx.setRoofResizeState(null);

    const pts = Array.from(viewPointers.values());
    prevTouchDist2D = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    prevTouchCenter2D = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    hasUserZoomedOrPanned = true;
    ctx.setHasUserZoomedOrPanned(true);
  }
}

function onPointermove(event) {
  if (viewPointers.has(event.pointerId)) {
    viewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  if (isPanning2D && panStart2D) {
    const dx = event.clientX - panStart2D.x;
    const dy = event.clientY - panStart2D.y;
    const svg = ctx.svg;
    const view = ctx.view;
    const rect = svg.getBoundingClientRect();
    const innerW = view.width - view.pad * 2;
    const innerH = view.height - view.pad * 2;
    const worldDx = (dx * (view.width / rect.width)) * (view.maxX - view.minX) / innerW;
    const worldDz = -(dy * (view.height / rect.height)) * (view.maxZ - view.minZ) / innerH;

    view.minX -= worldDx;
    view.maxX -= worldDx;
    view.minZ -= worldDz;
    view.maxZ -= worldDz;

    panStart2D = { x: event.clientX, y: event.clientY };
    ctx.renderPlan();
    return;
  }

  if (viewPointers.size === 2 && prevTouchCenter2D) {
    const pts = Array.from(viewPointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

    if (prevTouchDist2D > 0 && prevTouchCenter2D) {
      const factor = prevTouchDist2D / dist;
      const svg = ctx.svg;
      const view = ctx.view;
      const rect = svg.getBoundingClientRect();
      const centerPoint = {
        x: ((center.x - rect.left) / rect.width) * view.width,
        y: ((center.y - rect.top) / rect.height) * view.height
      };
      const worldCenter = ctx.svgToWorld(centerPoint.x, centerPoint.y);

      const currentSpanX = view.maxX - view.minX;
      const nextSpanX = currentSpanX * factor;
      if (nextSpanX >= 0.05 && nextSpanX <= 300) {
        view.minX = worldCenter.x - factor * (worldCenter.x - view.minX);
        view.maxX = worldCenter.x + factor * (worldCenter.x - view.minX);
        view.minZ = worldCenter.z - factor * (worldCenter.z - view.minZ);
        view.maxZ = worldCenter.z + factor * (view.maxZ - worldCenter.z);
      }

      const dx = center.x - prevTouchCenter2D.x;
      const dy = center.y - prevTouchCenter2D.y;
      const innerW = view.width - view.pad * 2;
      const innerH = view.height - view.pad * 2;
      const worldDx = (dx * (view.width / rect.width)) * (view.maxX - view.minX) / innerW;
      const worldDz = -(dy * (view.height / rect.height)) * (view.maxZ - view.minZ) / innerH;

      view.minX -= worldDx;
      view.maxX -= worldDx;
      view.minZ -= worldDz;
      view.maxZ -= worldDz;

      ctx.renderPlan();
    }

    prevTouchDist2D = dist;
    prevTouchCenter2D = center;
    event.preventDefault();
    return;
  }

  ctx.updatePointer(event);
  if (ctx.mode.startsWith('draw-fence')) {
    const stairsEl = event.target.closest?.('[data-stairs-id]');
    const edgeEl = event.target.closest?.('.floor-edge-hit-line');
    if (stairsEl) {
      ctx.clear2DFloorEdgeRailingPreview();
      const stairsId = stairsEl.dataset.stairsId;
      const stairs = ctx.testMap.getStairs(stairsId);
      if (stairs) {
        ctx.update2DStairsRailingPreview(stairs, ctx.mode.replace('draw-fence-', '') || 'picket_wood');
      }
    } else if (edgeEl) {
      ctx.clear2DStairsRailingPreview();
      const fromX = Number(edgeEl.dataset.edgeFromX);
      const fromZ = Number(edgeEl.dataset.edgeFromZ);
      const toX = Number(edgeEl.dataset.edgeToX);
      const toZ = Number(edgeEl.dataset.edgeToZ);
      const index = Number(edgeEl.dataset.edgeIndex);
      ctx.update2DFloorEdgeRailingPreview(fromX, fromZ, toX, toZ, index);
    } else {
      ctx.clear2DStairsRailingPreview();
      ctx.clear2DFloorEdgeRailingPreview();
    }
  } else {
    ctx.clear2DStairsRailingPreview();
    ctx.clear2DFloorEdgeRailingPreview();
  }
  if (ctx.entityManager.itemGestureState) {
    ctx.entityManager.moveItemGesture();
    return;
  }
  if (DragHandler.isRoomResizeActive()) {
    DragHandler.moveRoomResize(event);
    return;
  }
  if (ctx.getRoofResizeState()) {
    ctx.moveRoofResize(event);
    return;
  }
  if (DragHandler.isRoomDragActive()) {
    DragHandler.moveRoomDrag(event);
    return;
  }
  if (DragHandler.isStructureDragActive()) {
    DragHandler.moveStructureDrag(event);
    return;
  }
  if (ctx.entityManager.dragState) {
    ctx.entityManager.handleItemDrag(event);
  }
  if (DragHandler.isOpeningDragActive()) {
    DragHandler.moveOpeningDrag(event);
  }
  if (DragHandler.isFenceGateDragActive()) {
    DragHandler.moveFenceGateDrag(event);
  }
  if (DragHandler.isWallDragActive()) {
    DragHandler.moveWallDrag(event);
  }
  if (DragHandler.isFenceHandleDragActive()) {
    DragHandler.moveFenceHandleDrag(event);
  }
  if (DragHandler.isFenceDragActive()) {
    DragHandler.moveFenceDrag(event);
  }
}

function onPointerup(event) {
  viewPointers.delete(event.pointerId);
  if (event.pointerType === 'mouse' && event.button === 1 || isPanning2D) {
    isPanning2D = false;
    panStart2D = null;
    try { ctx.svg.releasePointerCapture(event.pointerId); } catch (e) {}
  }
  if (viewPointers.size < 2) {
    prevTouchDist2D = 0;
    prevTouchCenter2D = null;
  }

  ctx.forgetPointer(event);
  if (ctx.entityManager.itemGestureState && ctx.activePointers.size < 2) ctx.entityManager.itemGestureState = null;
  ctx.entityManager.dragState = null;
  ctx.finishRoofResize();
  DragHandler.finishDrag();
}

function onPointercancel(event) {
  viewPointers.delete(event.pointerId);
  if (event.pointerType === 'mouse' && event.button === 1 || isPanning2D) {
    isPanning2D = false;
    panStart2D = null;
    try { ctx.svg.releasePointerCapture(event.pointerId); } catch (e) {}
  }
  if (viewPointers.size < 2) {
    prevTouchDist2D = 0;
    prevTouchCenter2D = null;
  }

  ctx.forgetPointer(event);
  if (ctx.entityManager.itemGestureState && ctx.activePointers.size < 2) ctx.entityManager.itemGestureState = null;
  ctx.entityManager.dragState = null;
  ctx.finishRoofResize();
  DragHandler.finishDrag();
}

function onDblclick(event) {
  if (ctx.currentView !== '2d') return;
  const target = ctx.get2DContextTargetFromElement(event.target);
  if (!target) {
    hasUserZoomedOrPanned = false;
    ctx.setHasUserZoomedOrPanned(false);
    ctx.renderPlan();
  }
}

function onClick(event) {
  if (ctx.mode === 'select') {
    if (event.target.closest?.('.wall-line') || event.target.closest?.('[data-item-id]') || event.target.closest?.('[data-opening-id]') || event.target.closest?.('[data-roof-id]') || event.target.closest?.('[data-stairs-id]') || event.target.closest?.('[data-fence-id]') || event.target.closest?.('.fence-handle') || event.target.closest?.('[data-room-id]') || event.target.closest?.('[data-room-hit-id]') || event.target.closest?.('[data-room-handle]') || event.target.closest?.('[data-roof-handle]')) return;
  }
  const point = ctx.svgPointFromEvent(event);
  const world = ctx.svgToWorld(point.x, point.y);
  const snappedWorld = ctx.snapWorldPoint(world);
  const snapped = [snappedWorld.x, snappedWorld.z];

  if (ctx.mode === 'draw-wall') {
    const drawStart = ctx.getDrawStart();
    if (!drawStart) {
      ctx.setDrawStart(snapped);
    } else {
      ctx.pushHistory();
      ctx.testMap.addWall(drawStart, snapped);
      ctx.setDrawStart(null);
      ctx.refreshShadows();
    }
    ctx.renderPlan();
  } else if (ctx.isAddRoomMode()) {
    ctx.pushHistory();
    const count = ctx.getRoomCounter();
    const room = ctx.testMap.addRoom({ x: snapped[0], z: snapped[1], shape: ctx.roomShapeFromMode(), name: `新房间 ${count}` });
    ctx.incrementRoomCounter();
    ctx.refreshShadows();
    ctx.selectRoom(room.id);
    ctx.switchToSelectMode();
  } else if (ctx.mode.startsWith('add-roof')) {
    ctx.pushHistory();
    const subtype = ctx.mode.replace('add-roof-', '') || 'gable';
    const room = ctx.selectedRoomId ? ctx.testMap.getRoom(ctx.selectedRoomId) : ctx.testMap.getRoomAt(snapped[0], snapped[1]);
    const wallThickness = ctx.testMap.floorplan.wallThickness || 0.15;
    const roofBounds = Topology.calculateAutoRoofBounds(room, { x: snapped[0], z: snapped[1] }, wallThickness);
    const roof = ctx.testMap.addRoof({
      x: roofBounds.x,
      z: roofBounds.z,
      width: roofBounds.width,
      depth: roofBounds.depth,
      subtype: subtype
    });
    ctx.refreshShadows();
    ctx.selectRoof(roof.id);
    ctx.switchToSelectMode();
  } else if (ctx.mode.startsWith('add-stairs')) {
    ctx.pushHistory();
    const subtype = ctx.mode.replace('add-stairs-', '') || 'straight';
    const stairs = ctx.testMap.addStairs({
      x: snapped[0],
      z: snapped[1],
      subtype: subtype
    });
    ctx.refreshShadows();
    ctx.selectStairs(stairs.id);
    ctx.switchToSelectMode();
  } else if (ctx.mode.startsWith('draw-fence')) {
    const stairsEl = event.target.closest?.('[data-stairs-id]');
    const edgeEl = event.target.closest?.('.floor-edge-hit-line');
    if (stairsEl) {
      ctx.pushHistory();
      const stairsId = stairsEl.dataset.stairsId;
      ctx.addRailingToStairs(stairsId, ctx.mode.replace('draw-fence-', '') || 'picket_wood');
      ctx.clear2DStairsRailingPreview();
      ctx.clear3DStairsRailingPreview();
      ctx.clear2DFloorEdgeRailingPreview();
      ctx.clear3DFloorEdgeRailingPreview();
      ctx.switchToSelectMode();
      ctx.renderPlan();
      return;
    }

    if (edgeEl) {
      ctx.pushHistory();
      const fromX = Number(edgeEl.dataset.edgeFromX);
      const fromZ = Number(edgeEl.dataset.edgeFromZ);
      const toX = Number(edgeEl.dataset.edgeToX);
      const toZ = Number(edgeEl.dataset.edgeToZ);
      const subtype = ctx.mode.replace('draw-fence-', '') || 'picket_wood';
      
      const fence = ctx.testMap.addFence({
        floorId: ctx.testMap.floorplan.currentFloorId,
        from: [fromX, fromZ],
        to: [toX, toZ],
        subtype: subtype
      });
      
      ctx.clear2DStairsRailingPreview();
      ctx.clear3DStairsRailingPreview();
      ctx.clear2DFloorEdgeRailingPreview();
      ctx.clear3DFloorEdgeRailingPreview();
      ctx.selectFence(fence.id);
      ctx.switchToSelectMode();
      ctx.renderPlan();
      return;
    }

    const drawStart = ctx.getDrawStart();
    if (!drawStart) {
      ctx.setDrawStart(snapped);
    } else {
      ctx.pushHistory();
      const subtype = ctx.mode.replace('draw-fence-', '') || 'picket_wood';
      const fence = ctx.testMap.addFence({
        from: drawStart,
        to: snapped,
        subtype: subtype
      });
      ctx.setDrawStart(null);
      ctx.refreshShadows();
      ctx.selectFence(fence.id);
      ctx.switchToSelectMode();
    }
    ctx.renderPlan();
  } else if (ctx.mode.startsWith('add-fence-gate')) {
    ctx.pushHistory();
    const subtype = ctx.mode.replace('add-fence-gate-', '') || 'picket_wood';
    const gate = ctx.testMap.addFenceGate({
      floorId: ctx.testMap.floorplan.currentFloorId,
      from: [snapped[0] - 0.5, snapped[1]],
      to: [snapped[0] + 0.5, snapped[1]],
      width: 1.0,
      subtype: subtype
    });
    ctx.refreshShadows();
    ctx.selectFenceGate(gate.id);
    ctx.switchToSelectMode();
  } else {
    ctx.clearSelection();
  }
}
