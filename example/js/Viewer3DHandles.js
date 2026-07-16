// 这是一个向下兼容的 3D 编辑手柄转发门面
let activeInstance = null;

export function initViewer3DHandles(context) {
  activeInstance = context.viewer3DHandles;
}

export function clear3DEditHandles() { activeInstance?.clear3DEditHandles(); }
export function refresh3DEditHandles() { activeInstance?.refresh3DEditHandles(); }
export function begin3DEditHandleDrag(handle, event) { return activeInstance?.begin3DEditHandleDrag(handle, event) ?? false; }
export function move3DEditHandle(groundPoint) { activeInstance?.move3DEditHandle(groundPoint); }
export function pickNearest3DTarget(pointerX, pointerY) { return activeInstance?.pickNearest3DTarget(pointerX, pointerY) ?? null; }
export function getEditHandleNodes() { return activeInstance?.getEditHandleNodes() ?? []; }
export function getEditHandleDragState() { return activeInstance?.getEditHandleDragState() ?? null; }
export function setEditHandleDragState(val) { activeInstance?.setEditHandleDragState(val); }
export function get3DEditTargetBounds(type, id) { return activeInstance?.get3DEditTargetBounds(type, id) ?? null; }
export function get3DEditHandleY(type, bounds) { return activeInstance?.get3DEditHandleY(type, bounds) ?? 0; }
export function create3DEditHandle(type, id, action, side, position, color, rotationY) { return activeInstance?.create3DEditHandle(type, id, action, side, position, color, rotationY) ?? null; }
export function set3DEditTarget(type, id) { activeInstance?.set3DEditTarget(type, id); }
export function same3DEditTarget(type, id) { return activeInstance?.same3DEditTarget(type, id) ?? false; }
export function updateHandleHoverState(pointerX, pointerY) { activeInstance?.updateHandleHoverState(pointerX, pointerY); }
