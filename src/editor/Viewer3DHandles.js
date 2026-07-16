import { Color3, Engine, Mesh, MeshBuilder, StandardMaterial, Vector3 } from '../core/babylon.js';
const BABYLON = { Color3, Engine, Mesh, MeshBuilder, StandardMaterial, Vector3 };
import * as Topology from './Topology.js';

function findMetadataFromNode(node, key) {
  let current = node;
  while (current) {
    if (current.metadata?.[key]) return current.metadata[key];
    current = current.parent;
  }
  return null;
}

function normalizeRotationDegrees(degrees, useSnap = false) {
  let value = Number(degrees) || 0;
  if (useSnap) value = Math.round(value / 90) * 90;
  return (value % 360 + 360) % 360;
}

export class Viewer3DHandles {
  constructor(context) {
    this.ctx = context;
    this.editHandleNodes = [];
    this.editHandleDragState = null;
    this.hoveredHandle = null;
    this.INCHES_PER_UNIT = 39.37;
  }

  getEditHandleNodes() {
    return this.editHandleNodes;
  }

  getEditHandleDragState() {
    return this.editHandleDragState;
  }

  setEditHandleDragState(val) {
    this.editHandleDragState = val;
  }

  getStructure(type, id) {
    if (type === 'roof') return this.ctx.testMap.getRoof?.(id);
    if (type === 'stairs') return this.ctx.testMap.getStairs?.(id);
    if (type === 'fence') return this.ctx.testMap.getFence?.(id);
    return null;
  }

  clear3DEditHandles() {
    this.editHandleNodes.splice(0).forEach((node) => {
      if (node.material && typeof node.material.dispose === 'function') {
        node.material.dispose(true, true);
      }
      const children = node.getChildren ? node.getChildren() : [];
      children.forEach((child) => {
        if (child.material && typeof child.material.dispose === 'function') {
          child.material.dispose(true, true);
        }
      });
      node.dispose(false, true);
    });
    this.ctx.setActive3DEditTarget(null);
    this.hoveredHandle = null;
  }

  dispose() {
    this.clear3DEditHandles();
  }

  get3DEditTargetBounds(type, id) {
    if (type === 'wall') {
      const wall = this.ctx.testMap.getWall(id);
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
        floorId: wall.floorId || this.ctx.testMap.getCurrentFloorId()
      };
    }
    if (type === 'fence') {
      const fence = this.ctx.testMap.getFence(id);
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
        floorId: fence.floorId || this.ctx.testMap.getCurrentFloorId()
      };
    }
    const target = type === 'room' ? this.ctx.testMap.getRoom(id) : this.getStructure(type, id);
    if (!target) return null;
    return {
      target,
      x: Number(target.x || 0),
      z: Number(target.z || 0),
      width: Number(target.width || (type === 'stairs' ? 1.2 : 4)),
      depth: Number(target.depth || (type === 'stairs' ? 3.2 : 4)),
      height: type === 'stairs' && this.ctx.testMap.getStairsAutoHeight ? this.ctx.testMap.getStairsAutoHeight(target) : Number(target.height || 0),
      floorId: target.floorId || this.ctx.testMap.getCurrentFloorId()
    };
  }

  get3DEditHandleY(type, bounds) {
    const floorY = this.ctx.testMap.getFloorElevation ? this.ctx.testMap.getFloorElevation(bounds.floorId) : 0;
    if (type === 'wall') return floorY + 1.2;
    
    if (type === 'fence') {
      const fenceOffset = (this.ctx.testMap.getFenceElevationOffset ? this.ctx.testMap.getFenceElevationOffset(bounds.target) : 0) + (bounds.target.yOffset || 0);
      return floorY + fenceOffset + (bounds.height || 1.1) + 0.18;
    }
    
    if (type === 'roof') {
      const floor = this.ctx.testMap.getFloor(bounds.floorId);
      const roofWallHeight = floor ? (floor.wallHeight ?? this.ctx.testMap.floorplan.wallHeight ?? 3.0) : (this.ctx.testMap.floorplan.wallHeight ?? 3.0);
      return floorY + roofWallHeight + bounds.height + 0.18;
    }
    
    if (type === 'stairs') {
      const stairsOffset = this.ctx.testMap.getStairsElevationOffset ? this.ctx.testMap.getStairsElevationOffset(bounds.target) : 0;
      return floorY + stairsOffset + Math.max(0.18, Math.min(bounds.height || 1, 1.4));
    }
    
    if (type === 'opening') {
      const openingOffset = this.ctx.testMap.getOpeningElevationOffset ? this.ctx.testMap.getOpeningElevationOffset(bounds.target) : 0;
      return floorY + openingOffset + 0.18;
    }
    
    if (type === 'item') {
      const item = bounds.target;
      const roomOffset = this.ctx.testMap.getItemRoomElevationOffset ? this.ctx.testMap.getItemRoomElevationOffset(item) : 0;
      return floorY + roomOffset + (item.elevation || 0) / this.INCHES_PER_UNIT + 0.18;
    }
    
    return floorY + 0.18;
  }

  create3DEditHandle(type, id, action, side, position, color, rotationY = 0) {
    let handle = null;
    const scene = this.ctx.viewer3d.scene;

    const dragState = this.getEditHandleDragState();
    const isDraggingThis = dragState &&
      dragState.type === type &&
      dragState.id === id &&
      dragState.action === action &&
      dragState.side === side;

    const mat = new BABYLON.StandardMaterial('edit_handle_mat_' + type + '_' + id + '_' + action + '_' + (side || 'center'), scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(color);
    mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(isDraggingThis ? 0.45 : 0.12);
    mat.alpha = isDraggingThis ? 1.0 : 0.45;
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
    mat.disableDepthWrite = true;
    mat.depthFunction = BABYLON.Engine.ALWAYS;

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
      
      const visualMesh = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
      visualMesh.name = 'edit_handle_visual_' + type + '_' + id + '_move_center';
      visualMesh.isPickable = false;
      visualMesh.material = mat;
      visualMesh.renderingGroupId = 3;
      visualMesh.alwaysSelectAsActiveMesh = true;
      visualMesh.renderOutline = isDraggingThis;
      visualMesh.outlineWidth = 0.05;
      visualMesh.outlineColor = BABYLON.Color3.FromHexString('#ffffff');

      const collisionBox = BABYLON.MeshBuilder.CreateBox("move_handle_collision", {
        width: 0.55,
        height: 0.02,
        depth: 0.55
      }, scene);
      
      const transparentMat = new BABYLON.StandardMaterial('move_handle_collision_mat_' + type + '_' + id, scene);
      transparentMat.alpha = 0;
      transparentMat.disableDepthWrite = true;
      transparentMat.depthFunction = BABYLON.Engine.ALWAYS;
      
      collisionBox.material = transparentMat;
      collisionBox.renderOutline = false;
      
      visualMesh.parent = collisionBox;
      handle = collisionBox;
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
    
    if (action !== 'move') {
      handle.material = mat;
      handle.renderOutline = isDraggingThis;
      handle.outlineWidth = 0.05;
      handle.outlineColor = BABYLON.Color3.FromHexString('#ffffff');
    }

    handle.metadata = { blueprintEditHandle: { type, id, action, side, color } };
    handle.isPickable = true;
    handle.renderingGroupId = 3;
    handle.alwaysSelectAsActiveMesh = true;

    if (isDraggingThis) {
      this.hoveredHandle = handle;
    }

    this.editHandleNodes.push(handle);
    return handle;
  }

  refresh3DEditHandles() {
    const activeTarget = this.ctx.getActive3DEditTarget();
    if (!activeTarget || this.ctx.currentView !== '3d') return;
    const { type, id } = activeTarget;
    const bounds = this.get3DEditTargetBounds(type, id);
    this.hoveredHandle = null;
    
    // 销毁手柄网格及其专有材质以防泄漏
    this.editHandleNodes.splice(0).forEach((node) => {
      if (node.material && typeof node.material.dispose === 'function') {
        node.material.dispose(true, true);
      }
      const children = node.getChildren ? node.getChildren() : [];
      children.forEach((child) => {
        if (child.material && typeof child.material.dispose === 'function') {
          child.material.dispose(true, true);
        }
      });
      node.dispose(false, true);
    });

    if (!bounds || this.ctx.isTargetLocked({ type, id })) {
      this.ctx.setActive3DEditTarget(null);
      return;
    }
    const y = this.get3DEditHandleY(type, bounds);
    if (type === 'wall') {
      const wall = bounds.target;
      const dx = wall.to[0] - wall.from[0];
      const dz = wall.to[1] - wall.from[1];
      const angle = Math.atan2(dx, dz);
      
      this.create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
      this.create3DEditHandle(type, id, 'resize', 'from', { x: bounds.fromX, y, z: bounds.fromZ }, '#ff9f1c', angle + Math.PI);
      this.create3DEditHandle(type, id, 'resize', 'to', { x: bounds.toX, y, z: bounds.toZ }, '#ff9f1c', angle);
      return;
    }
    if (type === 'fence') {
      const fence = bounds.target;
      const dx = fence.to[0] - fence.from[0];
      const dz = fence.to[1] - fence.from[1];
      const angle = Math.atan2(dx, dz);
      
      this.create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
      this.create3DEditHandle(type, id, 'resize', 'from', { x: bounds.fromX, y, z: bounds.fromZ }, '#ff9f1c', angle + Math.PI);
      this.create3DEditHandle(type, id, 'resize', 'to', { x: bounds.toX, y, z: bounds.toZ }, '#ff9f1c', angle);
      return;
    }

    const halfW = bounds.width / 2;
    const halfD = bounds.depth / 2;
    const rot = Number(bounds.target?.rotation) || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    const getPos = (lx, lz) => {
      const rx = lx * cos - lz * sin;
      const rz = lx * sin + lz * cos;
      return { x: bounds.x + rx, y, z: bounds.z + rz };
    };

    const isRoom = type === 'room';
    const isLShape = isRoom && bounds.target?.shape === 'l-shape';

    if (isLShape) {
      const room = bounds.target;
      const edgeWidth = room.edgeWidth !== undefined && room.edgeWidth !== null ? room.edgeWidth : bounds.width / 2;
      const edgeDepth = room.edgeDepth !== undefined && room.edgeDepth !== null ? room.edgeDepth : bounds.depth / 2;

      this.create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
      this.create3DEditHandle(type, id, 'resize', 'north', getPos(-edgeWidth / 2, -halfD), '#ff9f1c', Math.PI - rot);
      this.create3DEditHandle(type, id, 'resize', 'south', getPos(-edgeWidth / 2, halfD), '#ff9f1c', 0 - rot);
      this.create3DEditHandle(type, id, 'resize', 'east', getPos(halfW, -edgeDepth / 2), '#ff9f1c', Math.PI / 2 - rot);
      this.create3DEditHandle(type, id, 'resize', 'west', getPos(-halfW, 0), '#ff9f1c', -Math.PI / 2 - rot);
      this.create3DEditHandle(type, id, 'resize', 'edgeWidth', getPos(halfW - edgeWidth, halfD - edgeDepth / 2), '#ff9f1c', Math.PI / 2 - rot);
      this.create3DEditHandle(type, id, 'resize', 'edgeDepth', getPos(halfW - edgeWidth / 2, halfD - edgeDepth), '#ff9f1c', 0 - rot);
    } else {
      this.create3DEditHandle(type, id, 'move', 'center', { x: bounds.x, y, z: bounds.z }, '#1f8fff');
      this.create3DEditHandle(type, id, 'resize', 'north', getPos(0, -halfD), '#ff9f1c', Math.PI - rot);
      this.create3DEditHandle(type, id, 'resize', 'south', getPos(0, halfD), '#ff9f1c', 0 - rot);
      this.create3DEditHandle(type, id, 'resize', 'east', getPos(halfW, 0), '#ff9f1c', Math.PI / 2 - rot);
      this.create3DEditHandle(type, id, 'resize', 'west', getPos(-halfW, 0), '#ff9f1c', -Math.PI / 2 - rot);
    }

    if (type === 'roof' || type === 'stairs' || type === 'room') {
      this.create3DEditHandle(type, id, 'rotate', 'rotation', getPos(halfW + 0.4, -halfD - 0.4), '#2ec456', 0 - rot);
    }
    if (type === 'roof') {
      this.create3DEditHandle(type, id, 'curve', 'curve', getPos(-halfW - 0.4, halfD + 0.4), '#9b5de5', 0 - rot);
    }
  }

  set3DEditTarget(type, id) {
    this.ctx.setActive3DEditTarget({ type, id });
    this.refresh3DEditHandles();
  }

  same3DEditTarget(type, id) {
    const activeTarget = this.ctx.getActive3DEditTarget();
    return activeTarget?.type === type && activeTarget?.id === id;
  }

  findEditHandleFromNode(node) {
    return findMetadataFromNode(node, 'blueprintEditHandle');
  }

  findOpeningIdFromNode(node) { return findMetadataFromNode(node, 'blueprintOpeningId'); }
  findItemIdFromNode(node) { return findMetadataFromNode(node, 'blueprintItemId'); }
  findWallIdFromNode(node) { return findMetadataFromNode(node, 'blueprintWallId'); }
  findRoomIdFromNode(node) { return findMetadataFromNode(node, 'blueprintRoomId'); }
  findRoofIdFromNode(node) {
    const id = findMetadataFromNode(node, 'blueprintRoofId');
    if (id) {
      const roof = this.ctx.testMap.getRoof?.(id);
      if (roof) {
        const floor = this.ctx.testMap.getFloor(roof.floorId);
        if (floor && floor.hideRoof) {
          return null;
        }
      }
    }
    return id;
  }
  findStairsIdFromNode(node) { return findMetadataFromNode(node, 'blueprintStairsId'); }
  findFenceIdFromNode(node) { return findMetadataFromNode(node, 'blueprintFenceId'); }
  findFenceGateIdFromNode(node) { return findMetadataFromNode(node, 'blueprintFenceGateId'); }

  pickNearest3DTarget(pointerX = this.ctx.viewer3d.scene.pointerX, pointerY = this.ctx.viewer3d.scene.pointerY) {
    const scene = this.ctx.viewer3d.scene;
    const handlePick = scene.pick(pointerX, pointerY, (mesh) => !!this.findEditHandleFromNode(mesh));
    const pickedHandle = handlePick?.pickedMesh ? this.findEditHandleFromNode(handlePick.pickedMesh) : null;
    if (pickedHandle) return { type: 'edit-handle', id: pickedHandle.id, handle: pickedHandle, pick: handlePick };

    const isBrushMode = this.ctx && (this.ctx.designMode === 'brush' || this.ctx.designMode === 'bucket');
    const pick = scene.pick(pointerX, pointerY, (mesh) => {
      if (isBrushMode && mesh.name && mesh.name.includes('pick_proxy')) {
        return false;
      }
      return (
        !!this.findOpeningIdFromNode(mesh)
        || !!this.findItemIdFromNode(mesh)
        || !!this.findWallIdFromNode(mesh)
        || !!this.findRoomIdFromNode(mesh)
        || !!this.findRoofIdFromNode(mesh)
        || !!this.findStairsIdFromNode(mesh)
        || !!this.findFenceIdFromNode(mesh)
        || !!this.findFenceGateIdFromNode(mesh)
      );
    });
    const mesh = pick?.pickedMesh;
    if (!mesh) return null;
    const openingId = this.findOpeningIdFromNode(mesh);
    if (openingId) return { type: 'opening', id: openingId, pick };
    const wallId = this.findWallIdFromNode(mesh);
    if (wallId) return { type: 'wall', id: wallId, pick };
    const itemId = this.findItemIdFromNode(mesh);
    if (itemId) return { type: 'item', id: itemId, pick };
    const roofId = this.findRoofIdFromNode(mesh);
    if (roofId) return { type: 'roof', id: roofId, pick };
    const stairsId = this.findStairsIdFromNode(mesh);
    if (stairsId) return { type: 'stairs', id: stairsId, pick };
    const fenceId = this.findFenceIdFromNode(mesh);
    if (fenceId) return { type: 'fence', id: fenceId, pick };
    const fenceGateId = this.findFenceGateIdFromNode(mesh);
    if (fenceGateId) return { type: 'fence_gate', id: fenceGateId, pick };
    const roomId = this.findRoomIdFromNode(mesh);
    if (roomId) return { type: 'room', id: roomId, pick };
    return null;
  }

  begin3DEditHandleDrag(handle, event) {
    if (this.ctx.isTargetLocked({ type: handle.type, id: handle.id })) return false;
    this.setHandleHighlight(handle, true);
    const bounds = this.get3DEditTargetBounds(handle.type, handle.id);
    const groundPoint = this.ctx.groundPointFromPointer();
    if (!bounds || !groundPoint) return false;
    if (handle.type === 'room') {
      this.ctx.testMap.refreshItemRoomLinks();
    }
    this.ctx.setActive3DEditTarget({ type: handle.type, id: handle.id });
    this.editHandleDragState = {
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
      } : { 
        x: bounds.x, 
        z: bounds.z, 
        width: bounds.width, 
        depth: bounds.depth, 
        target: bounds.target,
        edgeWidth: bounds.target?.edgeWidth !== undefined && bounds.target.edgeWidth !== null ? bounds.target.edgeWidth : bounds.width / 2,
        edgeDepth: bounds.target?.edgeDepth !== undefined && bounds.target.edgeDepth !== null ? bounds.target.edgeDepth : bounds.depth / 2
      },
      offsetX: bounds.x - groundPoint.x,
      offsetZ: bounds.z - groundPoint.z,
      historyPushed: false
    };

    if (handle.type === 'wall' || handle.type === 'fence') {
      const targetX = (handle.action === 'move' || handle.side === 'from') ? bounds.fromX : bounds.toX;
      const targetZ = (handle.action === 'move' || handle.side === 'from') ? bounds.fromZ : bounds.toZ;
      this.editHandleDragState.dragOffsetX = targetX - groundPoint.x;
      this.editHandleDragState.dragOffsetZ = targetZ - groundPoint.z;
    }

    if (handle.action === 'rotate') {
      const targetObj = bounds.target;
      if (targetObj) {
        this.editHandleDragState.originalRotation = targetObj.rotation || 0;
        const dx = groundPoint.x - bounds.x;
        const dz = groundPoint.z - bounds.z;
        this.editHandleDragState.startAngle = Math.atan2(dz, dx);
      }
    }

    if (handle.action === 'curve') {
      this.editHandleDragState.startX = groundPoint.x;
      this.editHandleDragState.startZ = groundPoint.z;
      const structure = this.getStructure(handle.type, handle.id);
      this.editHandleDragState.originalCurve = structure ? (structure.curve || 0) : 0;
    }

    if (handle.action === 'resize') {
      const rot = Number(bounds.target?.rotation) || 0;
      const dx = groundPoint.x - bounds.x;
      const dz = groundPoint.z - bounds.z;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const lx = dx * cos + dz * sin;
      const lz = -dx * sin + dz * cos;

      this.editHandleDragState.startLx = lx;
      this.editHandleDragState.startLz = lz;
    }

    this.ctx.testMap.beginEntityPreview(handle.type, handle.id);
    this.ctx.setDrag3DState({ type: 'edit-handle', pointerId: event.pointerId });
    document.body.classList.add('is-dragging-3d');
    this.ctx.canvas.setPointerCapture?.(event.pointerId);
    this.ctx.viewer3d.camera.detachControl(this.ctx.canvas);
    event.preventDefault();
    return true;
  }

  update3DEditTarget(type, id, patch, options = {}) {
    const rebuild = options.rebuild !== false;
    if (rebuild) {
      this.ctx.testMap.commitEntityPreview(type, id).then(() => {
        this.ctx.refreshShadows?.();
      });
    } else {
      this.ctx.testMap.updateEntityPreview(type, id, patch);
    }
    this.ctx.updateEditor?.();
    this.refresh3DEditHandles();
  }

  move3DEditHandle(groundPoint) {
    if (!this.editHandleDragState) return;
    const state = this.editHandleDragState;
    const original = state.original;
    let patch = null;
    let moveItems = false;
    let rebuild = true;

    if (state.action === 'curve') {
      const delta = (groundPoint.z - state.startZ) + (groundPoint.x - state.startX);
      let nextCurve = state.originalCurve + delta * 0.5;
      nextCurve = Number(Math.max(-5, Math.min(5, nextCurve)).toFixed(2));
      
      this.update3DEditTarget(state.type, state.id, { curve: nextCurve }, { rebuild: false });
      
      if (!state.historyPushed && Math.abs(delta) > 0.02) {
        this.ctx.pushHistory();
        state.historyPushed = true;
      }
      return;
    }

    if (state.action === 'rotate') {
      const bounds = this.get3DEditTargetBounds(state.type, state.id);
      if (!bounds) return;
      const dx = groundPoint.x - bounds.x;
      const dz = groundPoint.z - bounds.z;
      const currentAngle = Math.atan2(dz, dx);
      const deltaAngle = currentAngle - state.startAngle;
      const nextRotation = state.originalRotation + deltaAngle;
      const degrees = (nextRotation * 180 / Math.PI + 360) % 360;
      const normalizedDegrees = normalizeRotationDegrees(degrees, this.ctx.snapEnabled);
      const rotationRad = normalizedDegrees * Math.PI / 180;
      
      this.update3DEditTarget(state.type, state.id, { rotation: rotationRad }, { rebuild: false });
      
      if (!state.historyPushed && Math.abs(deltaAngle) > 0.02) {
        this.ctx.pushHistory();
        state.historyPushed = true;
      }
      return;
    }

    if (state.type === 'wall') {
      const wall = this.ctx.testMap.getWall(state.id);
      if (!wall) return;
      let nextFrom = [...original.from];
      let nextTo = [...original.to];
      
      if (state.action === 'move') {
        const targetFromX = groundPoint.x + state.dragOffsetX;
        const targetFromZ = groundPoint.z + state.dragOffsetZ;
        const snappedFrom = this.ctx.snapWorldPoint({ x: targetFromX, z: targetFromZ });
        const dx = snappedFrom.x - original.from[0];
        const dz = snappedFrom.z - original.from[1];
        
        if (!state.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
          this.ctx.pushHistory();
          state.historyPushed = true;
        }
        
        nextFrom = [snappedFrom.x, snappedFrom.z];
        nextTo = [Number((original.to[0] + dx).toFixed(3)), Number((original.to[1] + dz).toFixed(3))];
      } else if (state.side === 'from') {
        const targetX = groundPoint.x + state.dragOffsetX;
        const targetZ = groundPoint.z + state.dragOffsetZ;
        const snappedTarget = this.ctx.snapWorldPoint({ x: targetX, z: targetZ });
        
        if (!state.historyPushed && Math.hypot(snappedTarget.x - original.from[0], snappedTarget.z - original.from[1]) > 0.02) {
          this.ctx.pushHistory();
          state.historyPushed = true;
        }
        
        nextFrom = [snappedTarget.x, snappedTarget.z];
      } else if (state.side === 'to') {
        const targetX = groundPoint.x + state.dragOffsetX;
        const targetZ = groundPoint.z + state.dragOffsetZ;
        const snappedTarget = this.ctx.snapWorldPoint({ x: targetX, z: targetZ });
        
        if (!state.historyPushed && Math.hypot(snappedTarget.x - original.to[0], snappedTarget.z - original.to[1]) > 0.02) {
          this.ctx.pushHistory();
          state.historyPushed = true;
        }
        
        nextTo = [snappedTarget.x, snappedTarget.z];
      }
      
      this.update3DEditTarget('wall', state.id, { from: nextFrom, to: nextTo }, { rebuild: false });
      return;
    }
    if (state.type === 'fence') {
      const fence = this.ctx.testMap.getFence(state.id);
      if (!fence) return;
      let nextFrom = [...original.from];
      let nextTo = [...original.to];
      
      if (state.action === 'move') {
        const targetFromX = groundPoint.x + state.dragOffsetX;
        const targetFromZ = groundPoint.z + state.dragOffsetZ;
        const snappedFrom = this.ctx.snapWorldPoint({ x: targetFromX, z: targetFromZ });
        const dx = snappedFrom.x - original.from[0];
        const dz = snappedFrom.z - original.from[1];
        
        if (!state.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
          this.ctx.pushHistory();
          state.historyPushed = true;
        }
        
        nextFrom = [snappedFrom.x, snappedFrom.z];
        nextTo = [Number((original.to[0] + dx).toFixed(3)), Number((original.to[1] + dz).toFixed(3))];
      } else if (state.side === 'from') {
        const targetX = groundPoint.x + state.dragOffsetX;
        const targetZ = groundPoint.z + state.dragOffsetZ;
        const snappedTarget = this.ctx.snapWorldPoint({ x: targetX, z: targetZ });
        
        if (!state.historyPushed && Math.hypot(snappedTarget.x - original.from[0], snappedTarget.z - original.from[1]) > 0.02) {
          this.ctx.pushHistory();
          state.historyPushed = true;
        }
        
        nextFrom = [snappedTarget.x, snappedTarget.z];
      } else if (state.side === 'to') {
        const targetX = groundPoint.x + state.dragOffsetX;
        const targetZ = groundPoint.z + state.dragOffsetZ;
        const snappedTarget = this.ctx.snapWorldPoint({ x: targetX, z: targetZ });
        
        if (!state.historyPushed && Math.hypot(snappedTarget.x - original.to[0], snappedTarget.z - original.to[1]) > 0.02) {
          this.ctx.pushHistory();
          state.historyPushed = true;
        }
        
        nextTo = [snappedTarget.x, snappedTarget.z];
      }
      
      this.update3DEditTarget('fence', state.id, { from: nextFrom, to: nextTo }, { rebuild: false });
      return;
    }

    if (state.action === 'move') {
      const rawX = groundPoint.x + state.offsetX;
      const rawZ = groundPoint.z + state.offsetZ;
      const left = this.ctx.snapNumber(rawX - original.width / 2);
      const top = this.ctx.snapNumber(rawZ - original.depth / 2);
      patch = {
        x: Number((left + original.width / 2).toFixed(3)),
        z: Number((top + original.depth / 2).toFixed(3))
      };
      moveItems = true;
      rebuild = false;
    } else {
      const minWidth = state.type === 'stairs' ? 0.6 : (state.type === 'room' ? 1.2 : 1);
      const minDepth = state.type === 'stairs' ? 1.2 : (state.type === 'room' ? 1.2 : 1);
      const left = -original.width / 2;
      const right = original.width / 2;
      const top = -original.depth / 2;
      const bottom = original.depth / 2;
      const side = state.side;
      const rot = Number(original.target?.rotation) || 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      const dx = groundPoint.x - original.x;
      const dz = groundPoint.z - original.z;
      const lx = dx * cos + dz * sin;
      const lz = -dx * sin + dz * cos;

      let w = original.width;
      let d = original.depth;
      let nextEdgeWidth = original.edgeWidth;
      let nextEdgeDepth = original.edgeDepth;
      let localCenterX = 0;
      let localCenterZ = 0;

      if (side === 'west' || side === 'east') {
        const delta = lx - state.startLx;
        const snappedDelta = this.ctx.snapNumber(delta);
        if (side === 'west') {
          w = Math.max(minWidth, original.width - snappedDelta);
          localCenterX = right - w / 2;
        } else {
          w = Math.max(minWidth, original.width + snappedDelta);
          localCenterX = left + w / 2;
        }
      }

      if (side === 'north' || side === 'south') {
        const delta = lz - state.startLz;
        const snappedDelta = this.ctx.snapNumber(delta);
        if (side === 'north') {
          d = Math.max(minDepth, original.depth - snappedDelta);
          localCenterZ = bottom - d / 2;
        } else {
          d = Math.max(minDepth, original.depth + snappedDelta);
          localCenterZ = top + d / 2;
        }
      }

      if (side === 'edgeWidth') {
        const delta = lx - state.startLx;
        const snappedDelta = this.ctx.snapNumber(delta);
        nextEdgeWidth = Math.max(0.2, Math.min(original.width - 0.2, original.edgeWidth - snappedDelta));
      }
      if (side === 'edgeDepth') {
        const delta = lz - state.startLz;
        const snappedDelta = this.ctx.snapNumber(delta);
        nextEdgeDepth = Math.max(0.2, Math.min(original.depth - 0.2, original.edgeDepth - snappedDelta));
      }

      const nextX = Number((original.x + localCenterX * cos - localCenterZ * sin).toFixed(3));
      const nextZ = Number((original.z + localCenterX * sin + localCenterZ * cos).toFixed(3));

      patch = {
        x: nextX,
        z: nextZ,
        width: this.ctx.snapNumber(w),
        depth: this.ctx.snapNumber(d),
        edgeWidth: nextEdgeWidth,
        edgeDepth: nextEdgeDepth
      };

      if (state.type === 'room' && original.target.shape === 'l-shape') {
        if (side === 'east') {
          const dw = patch.width - original.width;
          patch.edgeWidth = Math.max(0.2, Math.min(patch.width - 0.2, this.ctx.snapNumber(original.edgeWidth + dw)));
        } else if (side === 'south') {
          const dd = patch.depth - original.depth;
          patch.edgeDepth = Math.max(0.2, Math.min(patch.depth - 0.2, this.ctx.snapNumber(original.edgeDepth + dd)));
        }
      }

      moveItems = false;
      rebuild = false;
    }

    const moved = Math.hypot((patch.x ?? original.x) - original.x, (patch.z ?? original.z) - original.z);
    const resized = Math.abs((patch.width ?? original.width) - original.width) + Math.abs((patch.depth ?? original.depth) - original.depth);
    if (!state.historyPushed && (moved > 0.02 || resized > 0.02)) {
      this.ctx.pushHistory();
      state.historyPushed = true;
    }
    
    this.update3DEditTarget(state.type, state.id, { ...patch, moveItems }, { moveItems, rebuild });
  }

  setHandleHighlight(handle, highlight) {
    if (!handle) return;
    const isMove = handle.name && handle.name.includes('move');
    const targetMesh = isMove ? (handle.getChildren?.()?.[0] || handle) : handle;

    if (!targetMesh || !targetMesh.material) return;
    const info = handle.metadata?.blueprintEditHandle;
    const color = info?.color || '#ffffff';
    if (highlight) {
      targetMesh.material.alpha = 1.0;
      targetMesh.material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.45);
      targetMesh.renderOutline = true;
    } else {
      targetMesh.material.alpha = 0.45;
      targetMesh.material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.12);
      targetMesh.renderOutline = false;
    }
  }

  updateHandleHoverState(pointerX = this.ctx.viewer3d.scene.pointerX, pointerY = this.ctx.viewer3d.scene.pointerY) {
    const scene = this.ctx.viewer3d.scene;
    if (!scene || this.ctx.currentView !== '3d') return;

    const handlePick = scene.pick(pointerX, pointerY, (mesh) => !!this.findEditHandleFromNode(mesh));
    const pickedHandleMesh = handlePick?.pickedMesh;

    const dragState = this.getEditHandleDragState();

    if (pickedHandleMesh) {
      if (this.hoveredHandle !== pickedHandleMesh) {
        if (this.hoveredHandle) {
          const infoPrev = this.hoveredHandle.metadata?.blueprintEditHandle;
          const isDraggingPrev = dragState && infoPrev &&
            dragState.type === infoPrev.type &&
            dragState.id === infoPrev.id &&
            dragState.action === infoPrev.action &&
            dragState.side === infoPrev.side;

          if (!isDraggingPrev) {
            this.setHandleHighlight(this.hoveredHandle, false);
          }
        }
        this.setHandleHighlight(pickedHandleMesh, true);
        this.hoveredHandle = pickedHandleMesh;
      }
    } else {
      if (this.hoveredHandle) {
        const infoPrev = this.hoveredHandle.metadata?.blueprintEditHandle;
        const isDraggingPrev = dragState && infoPrev &&
          dragState.type === infoPrev.type &&
          dragState.id === infoPrev.id &&
          dragState.action === infoPrev.action &&
          dragState.side === infoPrev.side;

        if (!isDraggingPrev) {
          this.setHandleHighlight(this.hoveredHandle, false);
        }
        this.hoveredHandle = null;
      }
    }
  }
}
