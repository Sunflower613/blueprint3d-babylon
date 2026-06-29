import * as BABYLON from '@babylonjs/core';

let ctx = null;

const editHandleNodes = [];
let editHandleDragState = null;

export function initViewer3DHandles(context) {
  ctx = context;
}

export function getEditHandleNodes() {
  return editHandleNodes;
}

export function getEditHandleDragState() {
  return editHandleDragState;
}

export function setEditHandleDragState(val) {
  editHandleDragState = val;
}

function findMetadataFromNode(node, key) {
  let current = node;
  while (current) {
    if (current.metadata?.[key]) return current.metadata[key];
    current = current.parent;
  }
  return null;
}

function normalizeRotationDegrees(degrees, useSnap = ctx.snapEnabled) {
  let value = Number(degrees) || 0;
  if (useSnap) value = Math.round(value / 90) * 90;
  return (value % 360 + 360) % 360;
}

function getStructure(type, id) {
  if (type === 'roof') return ctx.testMap.getRoof?.(id);
  if (type === 'stairs') return ctx.testMap.getStairs?.(id);
  if (type === 'fence') return ctx.testMap.getFence?.(id);
  return null;
}

function updateStructure(type, id, patch, rebuild = true) {
  if (type === 'roof') return ctx.testMap.updateRoof?.(id, patch, rebuild);
  if (type === 'stairs') return ctx.testMap.updateStairs?.(id, patch, rebuild);
  if (type === 'fence') return ctx.testMap.updateFence?.(id, patch, rebuild);
  return null;
}

export function clear3DEditHandles() {
  editHandleNodes.splice(0).forEach((node) => node.dispose(false, true));
  ctx.setActive3DEditTarget(null);
}

export function get3DEditTargetBounds(type, id) {
  if (type === 'wall') {
    const wall = ctx.testMap.getWall(id);
    if (!wall) return null;
    return {
      target: wall,
      x: (wall.from[0] + wall.to[0]) / 2,
      z: (wall.from[1] + wall.to[1]) / 2,
      fromX: wall.from[0],
      fromZ: wall.from[1],
      toX: wall.to[0],
      toZ: wall.to[1],
      width: 0.3,
      depth: 0.3,
      height: 0,
      floorId: wall.floorId || ctx.testMap.floorplan.currentFloorId
    };
  }
  if (type === 'fence') {
    const fence = ctx.testMap.getFence(id);
    if (!fence) return null;
    return {
      target: fence,
      x: (fence.from[0] + fence.to[0]) / 2,
      z: (fence.from[1] + fence.to[1]) / 2,
      fromX: fence.from[0],
      fromZ: fence.from[1],
      toX: fence.to[0],
      toZ: fence.to[1],
      width: 0.15,
      depth: 0.15,
      height: fence.height || 1.1,
      floorId: fence.floorId || ctx.testMap.floorplan.currentFloorId
    };
  }
  const target = type === 'room' ? ctx.testMap.getRoom(id) : getStructure(type, id);
  if (!target) return null;
  return {
    target,
    x: Number(target.x || 0),
    z: Number(target.z || 0),
    width: Number(target.width || (type === 'stairs' ? 1.2 : 4)),
    depth: Number(target.depth || (type === 'stairs' ? 3.2 : 4)),
    height: type === 'stairs' && ctx.testMap.getStairsAutoHeight ? ctx.testMap.getStairsAutoHeight(target) : Number(target.height || 0),
    floorId: target.floorId || ctx.testMap.floorplan.currentFloorId
  };
}

export function get3DEditHandleY(type, bounds) {
  const floorY = ctx.testMap.getFloorElevation ? ctx.testMap.getFloorElevation(bounds.floorId) : 0;
  if (type === 'wall') return floorY + 1.2;
  
  if (type === 'fence') {
    const fenceOffset = (ctx.testMap.getFenceElevationOffset ? ctx.testMap.getFenceElevationOffset(bounds.target) : 0) + (bounds.target.yOffset || 0);
    return floorY + fenceOffset + (bounds.height || 1.1) + 0.18;
  }
  
  if (type === 'roof') {
    const floor = ctx.testMap.floorplan.floors.find(f => f.id === bounds.floorId);
    const roofWallHeight = floor ? (floor.wallHeight ?? ctx.testMap.floorplan.wallHeight ?? 3.0) : (ctx.testMap.floorplan.wallHeight ?? 3.0);
    return floorY + roofWallHeight + bounds.height + 0.18;
  }
  
  if (type === 'stairs') {
    const stairsOffset = ctx.testMap.getStairsElevationOffset ? ctx.testMap.getStairsElevationOffset(bounds.target) : 0;
    return floorY + stairsOffset + Math.max(0.18, Math.min(bounds.height || 1, 1.4));
  }
  
  if (type === 'opening') {
    const openingOffset = ctx.testMap.getOpeningElevationOffset ? ctx.testMap.getOpeningElevationOffset(bounds.target) : 0;
    return floorY + openingOffset + 0.18;
  }
  
  if (type === 'item') {
    const item = bounds.target;
    const roomOffset = ctx.testMap.getItemRoomElevationOffset ? ctx.testMap.getItemRoomElevationOffset(item) : 0;
    return floorY + roomOffset + (item.elevation || 0) / ctx.INCHES_PER_UNIT + 0.18;
  }
  
  return floorY + 0.18;
}

export function create3DEditHandle(type, id, action, side, position, color, rotationY = 0) {
  let handle = null;
  const scene = ctx.viewer3d.scene;

  if (action === 'move') {
    const centerDisc = BABYLON.MeshBuilder.CreateCylinder("center_disc", {
      height: 0.06,
      diameter: 0.18
    }, scene);
    
    const meshesToMerge = [centerDisc];
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    angles.forEach((angle, idx) => {
      const shaft = BABYLON.MeshBuilder.CreateCylinder("shaft_" + idx, {
        height: 0.21,
        diameter: 0.06
      }, scene);
      shaft.rotation.x = Math.PI / 2;
      shaft.rotation.y = angle;
      shaft.position.x = 0.195 * Math.sin(angle);
      shaft.position.z = 0.195 * Math.cos(angle);
      
      const tip = BABYLON.MeshBuilder.CreateCylinder("tip_" + idx, {
        height: 0.15,
        diameterTop: 0,
        diameterBottom: 0.15
      }, scene);
      tip.rotation.x = Math.PI / 2;
      tip.rotation.y = angle;
      tip.position.x = 0.375 * Math.sin(angle);
      tip.position.z = 0.375 * Math.cos(angle);
      
      shaft.bakeCurrentTransformIntoVertices();
      tip.bakeCurrentTransformIntoVertices();
      meshesToMerge.push(shaft, tip);
    });
    
    handle = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
  } else if (action === 'rotate') {
    const radius = 0.24;
    const path = [];
    for (let i = 0; i <= 20; i++) {
      const theta = (i / 20) * (Math.PI / 2);
      path.push(new BABYLON.Vector3(Math.cos(theta) * radius, 0, -Math.sin(theta) * radius));
    }
    const arc = BABYLON.MeshBuilder.CreateTube("arc", { path, radius: 0.024, tessellation: 12 }, scene);
    
    const arrowHeight = 0.18;
    const arrowDiameter = 0.14;
    
    const cone1 = BABYLON.MeshBuilder.CreateCylinder("cone1", {
      height: arrowHeight,
      diameterTop: 0,
      diameterBottom: arrowDiameter,
      tessellation: 16
    }, scene);
    cone1.position.set(radius, 0, arrowHeight / 2);
    cone1.rotation.x = Math.PI / 2;
    cone1.bakeCurrentTransformIntoVertices();
    
    const cone2 = BABYLON.MeshBuilder.CreateCylinder("cone2", {
      height: arrowHeight,
      diameterTop: 0,
      diameterBottom: arrowDiameter,
      tessellation: 16
    }, scene);
    cone2.position.set(-arrowHeight / 2, 0, -radius);
    cone2.rotation.z = Math.PI / 2;
    cone2.bakeCurrentTransformIntoVertices();
    
    handle = BABYLON.Mesh.MergeMeshes([arc, cone1, cone2], true, true, undefined, false, true);
  } else if (action === 'curve') {
    handle = BABYLON.MeshBuilder.CreateSphere("curve_sphere", {
      diameter: 0.24
    }, scene);
  } else {
    const shaft = BABYLON.MeshBuilder.CreateCylinder("shaft", {
      height: 0.42,
      diameter: 0.075
    }, scene);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = 0.21;
    shaft.bakeCurrentTransformIntoVertices();
    
    const tip = BABYLON.MeshBuilder.CreateCylinder("tip", {
      height: 0.24,
      diameterTop: 0,
      diameterBottom: 0.21
    }, scene);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.54;
    tip.bakeCurrentTransformIntoVertices();
    
    handle = BABYLON.Mesh.MergeMeshes([shaft, tip], true, true, undefined, false, true);
  }

  if (!handle) return null;

  handle.name = 'edit_handle_' + type + '_' + id + '_' + action + '_' + (side || 'center');
  handle.position.set(position.x, position.y, position.z);
  
  if (action === 'resize' || action === 'rotate') {
    handle.rotation.y = rotationY;
  }
  
  handle.material = new BABYLON.StandardMaterial(handle.name + '_mat', scene);
  handle.material.diffuseColor = BABYLON.Color3.FromHexString(color);
  handle.material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.35);
  handle.material.specularColor = new BABYLON.Color3(0, 0, 0);
  handle.material.disableDepthWrite = true;
  handle.material.depthFunction = BABYLON.Engine.ALWAYS;
  handle.metadata = { blueprintEditHandle: { type, id, action, side } };
  handle.isPickable = true;
  handle.renderingGroupId = 3;
  handle.alwaysSelectAsActiveMesh = true;
  handle.renderOutline = true;
  handle.outlineWidth = 0.035;
  handle.outlineColor = BABYLON.Color3.FromHexString('#ffffff');
  
  editHandleNodes.push(handle);
  return handle;
}

export function refresh3DEditHandles() {
  const activeTarget = ctx.getActive3DEditTarget();
  if (!activeTarget || ctx.currentView !== '3d') return;
  const { type, id } = activeTarget;
  const bounds = get3DEditTargetBounds(type, id);
  editHandleNodes.splice(0).forEach((node) => node.dispose(false, true));
  if (!bounds || ctx.isTargetLocked({ type, id })) {
    ctx.setActive3DEditTarget(null);
    return;
  }
  const y = get3DEditHandleY(type, bounds);
  if (type === 'wall') {
    const wall = bounds.target;
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const angle = Math.atan2(dx, dz);
    
    create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
    create3DEditHandle(type, id, 'resize', 'from', { x: bounds.fromX, y, z: bounds.fromZ }, '#ff9f1c', angle + Math.PI);
    create3DEditHandle(type, id, 'resize', 'to', { x: bounds.toX, y, z: bounds.toZ }, '#ff9f1c', angle);
    return;
  }
  if (type === 'fence') {
    const fence = bounds.target;
    const dx = fence.to[0] - fence.from[0];
    const dz = fence.to[1] - fence.from[1];
    const angle = Math.atan2(dx, dz);
    
    create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
    create3DEditHandle(type, id, 'resize', 'from', { x: bounds.fromX, y, z: bounds.fromZ }, '#ff9f1c', angle + Math.PI);
    create3DEditHandle(type, id, 'resize', 'to', { x: bounds.toX, y, z: bounds.toZ }, '#ff9f1c', angle);
    return;
  }

  const halfW = bounds.width / 2;
  const halfD = bounds.depth / 2;
  create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
  create3DEditHandle(type, id, 'resize', 'north', { x: bounds.x, y, z: bounds.z - halfD }, '#ff9f1c', Math.PI);
  create3DEditHandle(type, id, 'resize', 'south', { x: bounds.x, y, z: bounds.z + halfD }, '#ff9f1c', 0);
  create3DEditHandle(type, id, 'resize', 'east', { x: bounds.x + halfW, y, z: bounds.z }, '#ff9f1c', Math.PI / 2);
  create3DEditHandle(type, id, 'resize', 'west', { x: bounds.x - halfW, y, z: bounds.z }, '#ff9f1c', -Math.PI / 2);
  if (type === 'roof' || type === 'stairs') {
    create3DEditHandle(type, id, 'rotate', 'rotation', { x: bounds.x + halfW + 0.4, y, z: bounds.z - halfD - 0.4 }, '#2ec456', 0);
  }
  if (type === 'roof') {
    create3DEditHandle(type, id, 'curve', 'curve', { x: bounds.x - halfW - 0.4, y, z: bounds.z + halfD + 0.4 }, '#9b5de5', 0);
  }
}

export function set3DEditTarget(type, id) {
  ctx.setActive3DEditTarget({ type, id });
  refresh3DEditHandles();
}

export function same3DEditTarget(type, id) {
  const activeTarget = ctx.getActive3DEditTarget();
  return activeTarget?.type === type && activeTarget?.id === id;
}

export function findEditHandleFromNode(node) {
  return findMetadataFromNode(node, 'blueprintEditHandle');
}

export function pickNearest3DTarget(pointerX = ctx.viewer3d.scene.pointerX, pointerY = ctx.viewer3d.scene.pointerY) {
  const scene = ctx.viewer3d.scene;
  const handlePick = scene.pick(pointerX, pointerY, (mesh) => !!findEditHandleFromNode(mesh));
  const pickedHandle = handlePick?.pickedMesh ? findEditHandleFromNode(handlePick.pickedMesh) : null;
  if (pickedHandle) return { type: 'edit-handle', id: pickedHandle.id, handle: pickedHandle, pick: handlePick };

  const pick = scene.pick(pointerX, pointerY, (mesh) => (
    !!ctx.findOpeningIdFromNode(mesh)
    || !!ctx.findItemIdFromNode(mesh)
    || !!ctx.findWallIdFromNode(mesh)
    || !!ctx.findRoomIdFromNode(mesh)
    || !!ctx.findRoofIdFromNode(mesh)
    || !!ctx.findStairsIdFromNode(mesh)
    || !!ctx.findFenceIdFromNode(mesh)
    || !!ctx.findFenceGateIdFromNode(mesh)
  ));
  const mesh = pick?.pickedMesh;
  if (!mesh) return null;
  const openingId = ctx.findOpeningIdFromNode(mesh);
  if (openingId) return { type: 'opening', id: openingId, pick };
  const wallId = ctx.findWallIdFromNode(mesh);
  if (wallId) return { type: 'wall', id: wallId, pick };
  const itemId = ctx.findItemIdFromNode(mesh);
  if (itemId) return { type: 'item', id: itemId, pick };
  const roofId = ctx.findRoofIdFromNode(mesh);
  if (roofId) return { type: 'roof', id: roofId, pick };
  const stairsId = ctx.findStairsIdFromNode(mesh);
  if (stairsId) return { type: 'stairs', id: stairsId, pick };
  const fenceId = ctx.findFenceIdFromNode(mesh);
  if (fenceId) return { type: 'fence', id: fenceId, pick };
  const fenceGateId = ctx.findFenceGateIdFromNode(mesh);
  if (fenceGateId) return { type: 'fence_gate', id: fenceGateId, pick };
  const roomId = ctx.findRoomIdFromNode(mesh);
  if (roomId) return { type: 'room', id: roomId, pick };
  return null;
}

export function begin3DEditHandleDrag(handle, event) {
  if (ctx.isTargetLocked({ type: handle.type, id: handle.id })) return false;
  const bounds = get3DEditTargetBounds(handle.type, handle.id);
  const groundPoint = ctx.groundPointFromPointer();
  if (!bounds || !groundPoint) return false;
  ctx.setActive3DEditTarget({ type: handle.type, id: handle.id });
  editHandleDragState = {
    type: handle.type,
    id: handle.id,
    action: handle.action,
    side: handle.side,
    pointerId: event.pointerId,
    original: (handle.type === 'wall' || handle.type === 'fence') ? {
      from: [bounds.fromX, bounds.fromZ],
      to: [bounds.toX, bounds.toZ],
      x: bounds.x,
      z: bounds.z
    } : { x: bounds.x, z: bounds.z, width: bounds.width, depth: bounds.depth },
    offsetX: bounds.x - groundPoint.x,
    offsetZ: bounds.z - groundPoint.z,
    historyPushed: false
  };

  if (handle.type === 'wall' || handle.type === 'fence') {
    const targetX = (handle.action === 'move' || handle.side === 'from') ? bounds.fromX : bounds.toX;
    const targetZ = (handle.action === 'move' || handle.side === 'from') ? bounds.fromZ : bounds.toZ;
    editHandleDragState.dragOffsetX = targetX - groundPoint.x;
    editHandleDragState.dragOffsetZ = targetZ - groundPoint.z;
  }

  if (handle.action === 'rotate') {
    const structure = getStructure(handle.type, handle.id);
    if (structure) {
      editHandleDragState.originalRotation = structure.rotation || 0;
      const dx = groundPoint.x - bounds.x;
      const dz = groundPoint.z - bounds.z;
      editHandleDragState.startAngle = Math.atan2(dz, dx);
    }
  }

  if (handle.action === 'curve') {
    editHandleDragState.startX = groundPoint.x;
    editHandleDragState.startZ = groundPoint.z;
    const structure = getStructure(handle.type, handle.id);
    editHandleDragState.originalCurve = structure ? (structure.curve || 0) : 0;
  }

  ctx.setDrag3DState({ type: 'edit-handle', pointerId: event.pointerId });
  document.body.classList.add('is-dragging-3d');
  ctx.canvas.setPointerCapture?.(event.pointerId);
  ctx.viewer3d.camera.detachControl(ctx.canvas);
  event.preventDefault();
  return true;
}

export function syncRoomMovePreview(roomId) {
  const room = ctx.testMap.getRoom(roomId);
  if (!room) return;
  const floorY = ctx.testMap.getFloorElevation ? ctx.testMap.getFloorElevation(room.floorId) : 0;
  const floor = ctx.testMap.floorNodes?.get(room.id);
  if (floor) floor.position.set(room.x, floorY - (ctx.testMap.floorplan.floorHeight || 0.08) / 2, room.z);

  const wallIds = new Set(Object.values(room.wallIds || {}));
  wallIds.forEach((wallId) => {
    const wall = ctx.testMap.getWall(wallId);
    const node = ctx.testMap.wallNodes?.get(wallId);
    if (!wall || !node) return;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    node.position.set(x1, 0, z1);
    const currentLength = Math.hypot(x2 - x1, z2 - z1);
    const originalLength = node.metadata?.originalLength || currentLength || 1;
    node.scaling.x = currentLength / originalLength;
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  });

  ctx.testMap.floorplan.openings.forEach((opening) => {
    if (!wallIds.has(opening.wallId)) return;
    const wall = ctx.testMap.getWall(opening.wallId);
    const node = ctx.testMap.openingNodes?.get(opening.id);
    if (!wall || !node) return;
    const point = ctx.wallPointAt(wall, opening.t ?? 0.5);
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const localY = sillHeight + height / 2;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const openingOffset = ctx.testMap.getOpeningElevationOffset ? ctx.testMap.getOpeningElevationOffset(opening) : 0;
    node.position.set(point.x, floorY + localY + openingOffset, point.z);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  });

  ctx.testMap.floorplan.items.forEach((item) => {
    if (item.roomId !== room.id) return;
    const node = ctx.testMap.itemNodes?.get(item.id);
    const roomOffset = ctx.testMap.getItemRoomElevationOffset ? ctx.testMap.getItemRoomElevationOffset(item) : 0;
    if (node) node.position.set(item.x, floorY + (item.elevation || 0) / ctx.INCHES_PER_UNIT + roomOffset, item.z);
  });
}

export function syncWallMovePreview(wallId) {
  const wall = ctx.testMap.getWall(wallId);
  const node = ctx.testMap.wallNodes?.get(wallId);
  if (!wall || !node) return;
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  node.position.set(x1, 0, z1);
  const currentLength = Math.hypot(x2 - x1, z2 - z1);
  const originalLength = node.metadata?.originalLength || currentLength || 1;
  node.scaling.x = currentLength / originalLength;
  node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);

  const floorY = ctx.testMap.getFloorElevation ? ctx.testMap.getFloorElevation(wall.floorId) : 0;
  ctx.testMap.floorplan.openings.forEach((opening) => {
    if (opening.wallId !== wallId) return;
    const opNode = ctx.testMap.openingNodes?.get(opening.id);
    if (!opNode) return;
    const point = ctx.wallPointAt(wall, opening.t ?? 0.5);
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const localY = sillHeight + height / 2;
    const [wx1, wz1] = wall.from;
    const [wx2, wz2] = wall.to;
    const openingOffset = ctx.testMap.getOpeningElevationOffset ? ctx.testMap.getOpeningElevationOffset(opening) : 0;
    opNode.position.set(point.x, floorY + localY + openingOffset, point.z);
    opNode.rotation.y = -Math.atan2(wz2 - wz1, wx2 - wx1);
  });
}

export function syncFenceMovePreview(fenceId) {
  const fence = ctx.testMap.getFence(fenceId);
  const node = ctx.testMap.fenceNodes?.get(fenceId);
  if (!fence || !node) return;
  const [x1, z1] = fence.from;
  const [x2, z2] = fence.to;
  const floorY = ctx.testMap.getFloorElevation ? ctx.testMap.getFloorElevation(fence.floorId) : 0;
  const fenceOffset = ctx.testMap.getFenceElevationOffset ? ctx.testMap.getFenceElevationOffset(fence) : 0;
  node.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
  
  const currentLength = Math.hypot(x2 - x1, z2 - z1);
  const originalLength = node.metadata?.originalLength || currentLength || 1;
  node.scaling.x = currentLength / originalLength;
  node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
}

export function update3DEditTarget(type, id, patch, options = {}) {
  if (type === 'wall') {
    const rebuild = options.rebuild !== false;
    if (rebuild) {
      ctx.testMap.build();
      ctx.refreshShadows();
    } else {
      syncWallMovePreview(id);
    }
  } else if (type === 'fence') {
    const rebuild = options.rebuild !== false;
    if (rebuild) {
      ctx.testMap.build();
      ctx.refreshShadows();
    } else {
      syncFenceMovePreview(id);
    }
  } else if (type === 'room') {
    const rebuild = options.rebuild !== false;
    const moveItems = options.moveItems !== false;
    ctx.testMap.updateRoom(id, patch, { moveItems, rebuild });
    if (rebuild) ctx.refreshShadows();
    else syncRoomMovePreview(id);
  } else {
    const rebuild = options.rebuild !== false;
    const updated = updateStructure(type, id, patch, rebuild);
    if (!rebuild && updated) {
      const node = type === 'roof' ? ctx.testMap.roofNodes?.get(id) : ctx.testMap.stairNodes?.get(id);
      if (node) {
        node.position.x = updated.x || 0;
        node.position.z = updated.z || 0;
        if (type === 'stairs') {
          const floorY = ctx.testMap.getFloorElevation ? ctx.testMap.getFloorElevation(updated.floorId) : 0;
          const stairsOffset = ctx.testMap.getStairsElevationOffset ? ctx.testMap.getStairsElevationOffset(updated) : 0;
          node.position.y = floorY + stairsOffset;
        }
      }
    } else {
      ctx.refreshShadows();
    }
  }
  ctx.updateEditor();
  refresh3DEditHandles();
}

export function move3DEditHandle(groundPoint) {
  if (!editHandleDragState) return;
  const state = editHandleDragState;
  const original = state.original;
  const snapped = ctx.snapWorldPoint({ x: groundPoint.x, z: groundPoint.z });
  let patch = null;
  let moveItems = false;
  let rebuild = true;

  if (state.action === 'curve') {
    const delta = (groundPoint.z - state.startZ) + (groundPoint.x - state.startX);
    let nextCurve = state.originalCurve + delta * 0.5;
    nextCurve = Number(Math.max(-5, Math.min(5, nextCurve)).toFixed(2));
    
    updateStructure(state.type, state.id, { curve: nextCurve }, true);
    
    if (!state.historyPushed && Math.abs(delta) > 0.02) {
      ctx.pushHistory();
      state.historyPushed = true;
    }
    return;
  }

  if (state.action === 'rotate') {
    const bounds = get3DEditTargetBounds(state.type, state.id);
    if (!bounds) return;
    const dx = groundPoint.x - bounds.x;
    const dz = groundPoint.z - bounds.z;
    const currentAngle = Math.atan2(dz, dx);
    const deltaAngle = currentAngle - state.startAngle;
    const nextRotation = state.originalRotation + deltaAngle;
    const degrees = (nextRotation * 180 / Math.PI + 360) % 360;
    const normalizedDegrees = normalizeRotationDegrees(degrees);
    const rotationRad = normalizedDegrees * Math.PI / 180;
    
    const node = state.type === 'roof' ? ctx.testMap.roofNodes?.get(state.id) : ctx.testMap.stairNodes?.get(state.id);
    if (node) {
      node.rotation.y = rotationRad;
    }
    
    updateStructure(state.type, state.id, { rotation: rotationRad }, false);
    
    if (!state.historyPushed && Math.abs(deltaAngle) > 0.02) {
      ctx.pushHistory();
      state.historyPushed = true;
    }
    return;
  }

  if (state.type === 'wall') {
    const wall = ctx.testMap.getWall(state.id);
    if (!wall) return;
    let nextFrom = [...original.from];
    let nextTo = [...original.to];
    
    if (state.action === 'move') {
      const targetFromX = groundPoint.x + state.dragOffsetX;
      const targetFromZ = groundPoint.z + state.dragOffsetZ;
      const snappedFrom = ctx.snapWorldPoint({ x: targetFromX, z: targetFromZ });
      const dx = snappedFrom.x - original.from[0];
      const dz = snappedFrom.z - original.from[1];
      
      if (!state.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
        ctx.pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedFrom.x, snappedFrom.z];
      nextTo = [Number((original.to[0] + dx).toFixed(3)), Number((original.to[1] + dz).toFixed(3))];
    } else if (state.side === 'from') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = ctx.snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.from[0], snappedTarget.z - original.from[1]) > 0.02) {
        ctx.pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedTarget.x, snappedTarget.z];
    } else if (state.side === 'to') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = ctx.snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.to[0], snappedTarget.z - original.to[1]) > 0.02) {
        ctx.pushHistory();
        state.historyPushed = true;
      }
      
      nextTo = [snappedTarget.x, snappedTarget.z];
    }
    
    wall.from = [Number(nextFrom[0].toFixed(3)), Number(nextFrom[1].toFixed(3))];
    wall.to = [Number(nextTo[0].toFixed(3)), Number(nextTo[1].toFixed(3))];
    
    update3DEditTarget('wall', state.id, null, { rebuild: false });
    return;
  }
  if (state.type === 'fence') {
    const fence = ctx.testMap.getFence(state.id);
    if (!fence) return;
    let nextFrom = [...original.from];
    let nextTo = [...original.to];
    
    if (state.action === 'move') {
      const targetFromX = groundPoint.x + state.dragOffsetX;
      const targetFromZ = groundPoint.z + state.dragOffsetZ;
      const snappedFrom = ctx.snapWorldPoint({ x: targetFromX, z: targetFromZ });
      const dx = snappedFrom.x - original.from[0];
      const dz = snappedFrom.z - original.from[1];
      
      if (!state.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
        ctx.pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedFrom.x, snappedFrom.z];
      nextTo = [Number((original.to[0] + dx).toFixed(3)), Number((original.to[1] + dz).toFixed(3))];
    } else if (state.side === 'from') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = ctx.snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.from[0], snappedTarget.z - original.from[1]) > 0.02) {
        ctx.pushHistory();
        state.historyPushed = true;
      }
      
      nextFrom = [snappedTarget.x, snappedTarget.z];
    } else if (state.side === 'to') {
      const targetX = groundPoint.x + state.dragOffsetX;
      const targetZ = groundPoint.z + state.dragOffsetZ;
      const snappedTarget = ctx.snapWorldPoint({ x: targetX, z: targetZ });
      
      if (!state.historyPushed && Math.hypot(snappedTarget.x - original.to[0], snappedTarget.z - original.to[1]) > 0.02) {
        ctx.pushHistory();
        state.historyPushed = true;
      }
      
      nextTo = [snappedTarget.x, snappedTarget.z];
    }
    
    fence.from = [Number(nextFrom[0].toFixed(3)), Number(nextFrom[1].toFixed(3))];
    fence.to = [Number(nextTo[0].toFixed(3)), Number(nextTo[1].toFixed(3))];
    
    update3DEditTarget('fence', state.id, null, { rebuild: false });
    return;
  }

  if (state.action === 'move') {
    const rawX = groundPoint.x + state.offsetX;
    const rawZ = groundPoint.z + state.offsetZ;
    const left = ctx.snapNumber(rawX - original.width / 2);
    const top = ctx.snapNumber(rawZ - original.depth / 2);
    patch = {
      x: Number((left + original.width / 2).toFixed(3)),
      z: Number((top + original.depth / 2).toFixed(3))
    };
    moveItems = true;
    rebuild = false;
  } else {
    const minWidth = state.type === 'stairs' ? 0.6 : (state.type === 'room' ? 1.2 : 1);
    const minDepth = state.type === 'stairs' ? 1.2 : (state.type === 'room' ? 1.2 : 1);
    const left = original.x - original.width / 2;
    const right = original.x + original.width / 2;
    const top = original.z - original.depth / 2;
    const bottom = original.z + original.depth / 2;

    let w = original.width;
    let d = original.depth;
    let x = original.x;
    let z = original.z;

    if (state.side === 'west' || state.side === 'east') {
      let rawW = original.width;
      if (state.side === 'west') {
        const snappedRight = ctx.snapNumber(right);
        rawW = snappedRight - snapped.x;
        w = ctx.snapValue(rawW);
        if (ctx.snapEnabled && ctx.snapSize) {
          if (w < minWidth) w = Math.ceil(minWidth / ctx.snapSize) * ctx.snapSize;
        } else {
          w = Math.max(minWidth, w);
        }
        x = snappedRight - w / 2;
      } else {
        const snappedLeft = ctx.snapNumber(left);
        rawW = snapped.x - snappedLeft;
        w = ctx.snapValue(rawW);
        if (ctx.snapEnabled && ctx.snapSize) {
          if (w < minWidth) w = Math.ceil(minWidth / ctx.snapSize) * ctx.snapSize;
        } else {
          w = Math.max(minWidth, w);
        }
        x = snappedLeft + w / 2;
      }
    }

    if (state.side === 'north' || state.side === 'south') {
      let rawD = original.depth;
      if (state.side === 'north') {
        const snappedBottom = ctx.snapNumber(bottom);
        rawD = snappedBottom - snapped.z;
        d = ctx.snapValue(rawD);
        if (ctx.snapEnabled && ctx.snapSize) {
          if (d < minDepth) d = Math.ceil(minDepth / ctx.snapSize) * ctx.snapSize;
        } else {
          d = Math.max(minDepth, d);
        }
        z = snappedBottom - d / 2;
      } else {
        const snappedTop = ctx.snapNumber(top);
        rawD = snapped.z - snappedTop;
        d = ctx.snapValue(rawD);
        if (ctx.snapEnabled && ctx.snapSize) {
          if (d < minDepth) d = Math.ceil(minDepth / ctx.snapSize) * ctx.snapSize;
        } else {
          d = Math.max(minDepth, d);
        }
        z = snappedTop + d / 2;
      }
    }

    patch = {
      x: ctx.snapNumber(x),
      z: ctx.snapNumber(z),
      width: ctx.snapNumber(w),
      depth: ctx.snapNumber(d)
    };
    moveItems = false;
    rebuild = false;
  }

  const moved = Math.hypot((patch.x ?? original.x) - original.x, (patch.z ?? original.z) - original.z);
  const resized = Math.abs((patch.width ?? original.width) - original.width) + Math.abs((patch.depth ?? original.depth) - original.depth);
  if (!state.historyPushed && (moved > 0.02 || resized > 0.02)) {
    ctx.pushHistory();
    state.historyPushed = true;
  }
  
  if (state.type === 'roof' || state.type === 'stairs') {
    const node = state.type === 'roof' ? ctx.testMap.roofNodes?.get(state.id) : ctx.testMap.stairNodes?.get(state.id);
    if (node && original.width && original.depth && patch.width && patch.depth) {
      node.scaling.x = patch.width / original.width;
      node.scaling.z = patch.depth / original.depth;
    }
  }

  update3DEditTarget(state.type, state.id, patch, { moveItems, rebuild });
}
