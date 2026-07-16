import * as Topology from './Topology.js';

export class DragHandler {
  constructor(context) {
    this.ctx = context;
    this.states = {
      roomDrag: null,
      roomResize: null,
      wallDrag: null,
      openingDrag: null,
      structureDrag: null,
      fenceDrag: null,
      fenceHandleDrag: null,
      fenceGateDrag: null
    };
  }

  clearAllDragStates() {
    const preview = this.ctx.testMap.getEntityPreviewStatus?.();
    if (preview?.state === 'active' && preview.type && preview.id) {
      void Promise.resolve(this.ctx.testMap.cancelEntityPreview(preview.type, preview.id)).catch((error) => {
        console.error('Failed to cancel active drag preview:', error);
      });
    }
    this.states.roomDrag = null;
    this.states.roomResize = null;
    this.states.structureDrag = null;
    this.states.openingDrag = null;
    this.states.fenceDrag = null;
    this.states.fenceHandleDrag = null;
    this.states.fenceGateDrag = null;
    this.states.wallDrag = null;
  }

  isRoomDragActive() { return !!this.states.roomDrag; }
  isRoomResizeActive() { return !!this.states.roomResize; }
  isStructureDragActive() { return !!this.states.structureDrag; }
  isOpeningDragActive() { return !!this.states.openingDrag; }
  isFenceGateDragActive() { return !!this.states.fenceGateDrag; }
  isWallDragActive() { return !!this.states.wallDrag; }
  isFenceHandleDragActive() { return !!this.states.fenceHandleDrag; }
  isFenceDragActive() { return !!this.states.fenceDrag; }

  // --- 房间拖拽与缩放 ---

  beginRoomDrag(event, roomId) {
    if (event.button === 2) return;
    if (this.ctx.mode !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    if (this.ctx.selectedRoomId !== roomId) {
      this.ctx.selectRoom(roomId);
    }
    this.ctx.testMap.refreshItemRoomLinks();
    const room = this.ctx.testMap.getRoom(roomId);
    if (!room || room.locked) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    this.states.roomDrag = {
      roomId,
      offsetX: room.x - world.x,
      offsetZ: room.z - world.z,
      originalX: room.x,
      originalZ: room.z,
      width: room.width,
      depth: room.depth,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview('room', roomId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  beginRoomResize(event, roomId, side) {
    if (event.button === 2) return;
    if (this.ctx.mode !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    if (this.ctx.selectedRoomId !== roomId) {
      this.ctx.selectRoom(roomId);
    }
    const room = this.ctx.testMap.getRoom(roomId);
    if (!room || room.locked) return;

    const original = {
      x: room.x,
      z: room.z,
      width: room.width,
      depth: room.depth,
      rotation: room.rotation || 0,
      edgeWidth: room.edgeWidth !== undefined && room.edgeWidth !== null ? room.edgeWidth : room.width / 2,
      edgeDepth: room.edgeDepth !== undefined && room.edgeDepth !== null ? room.edgeDepth : room.depth / 2
    };
    const left = -original.width / 2;
    const right = original.width / 2;
    const top = -original.depth / 2;
    const bottom = original.depth / 2;

    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);

    // 将世界坐标投射到房间的局部坐标系
    const dx = world.x - original.x;
    const dz = world.z - original.z;
    const cos = Math.cos(original.rotation);
    const sin = Math.sin(original.rotation);
    const lx = dx * cos + dz * sin;
    const lz = -dx * sin + dz * cos;

    let offsetX = 0;
    let offsetZ = 0;
    if (side === 'west') offsetX = left - lx;
    if (side === 'east') offsetX = right - lx;
    if (side === 'north') offsetZ = top - lz;
    if (side === 'south') offsetZ = bottom - lz;
    if (side === 'edgeWidth') offsetX = (right - original.edgeWidth) - lx;
    if (side === 'edgeDepth') offsetZ = (bottom - original.edgeDepth) - lz;

    this.states.roomResize = {
      roomId,
      side,
      original,
      offsetX,
      offsetZ,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview('room', roomId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveRoomDrag(event) {
    if (!this.states.roomDrag) return;
    const room = this.ctx.testMap.getRoom(this.states.roomDrag.roomId);
    if (!room || room.locked) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    const snappedRoom = this.ctx.snapRoomPosition(room, world.x + this.states.roomDrag.offsetX, world.z + this.states.roomDrag.offsetZ);
    const nextX = snappedRoom.x;
    const nextZ = snappedRoom.z;
    if (!this.states.roomDrag.historyPushed && Math.hypot(nextX - this.states.roomDrag.originalX, nextZ - this.states.roomDrag.originalZ) > 0.02) {
      this.ctx.pushHistory();
      this.states.roomDrag.historyPushed = true;
    }
    
    this.ctx.testMap.updateEntityPreview('room', room.id, { x: nextX, z: nextZ });
    this.ctx.refreshShadows?.();
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  moveRoomResize(event) {
    if (!this.states.roomResize) return;
    const room = this.ctx.testMap.getRoom(this.states.roomResize.roomId);
    if (!room || room.locked) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    
    const original = this.states.roomResize.original;
    const left = -original.width / 2;
    const right = original.width / 2;
    const top = -original.depth / 2;
    const bottom = original.depth / 2;
    const side = this.states.roomResize.side;
    const rotation = original.rotation;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // 将世界坐标投射到房间的局部坐标系
    const dx = world.x - original.x;
    const dz = world.z - original.z;
    const lx = dx * cos + dz * sin;
    const lz = -dx * sin + dz * cos;

    let nextWidth = original.width;
    let nextDepth = original.depth;
    let nextEdgeWidth = original.edgeWidth;
    let nextEdgeDepth = original.edgeDepth;
    let localCenterX = 0;
    let localCenterZ = 0;

    if (side === 'west') {
      const nextLeft = Math.min(this.ctx.snapNumber(lx + this.states.roomResize.offsetX), right - 1.0);
      nextWidth = this.ctx.snapNumber(right - nextLeft);
      localCenterX = right - nextWidth / 2;
    } else if (side === 'east') {
      const nextRight = Math.max(this.ctx.snapNumber(lx + this.states.roomResize.offsetX), left + 1.0);
      nextWidth = this.ctx.snapNumber(nextRight - left);
      localCenterX = left + nextWidth / 2;
    } else if (side === 'north') {
      const nextTop = Math.min(this.ctx.snapNumber(lz + this.states.roomResize.offsetZ), bottom - 1.0);
      nextDepth = this.ctx.snapNumber(bottom - nextTop);
      localCenterZ = bottom - nextDepth / 2;
    } else if (side === 'south') {
      const nextBottom = Math.max(this.ctx.snapNumber(lz + this.states.roomResize.offsetZ), top + 1.0);
      nextDepth = this.ctx.snapNumber(nextBottom - top);
      localCenterZ = top + nextDepth / 2;
    } else if (side === 'edgeWidth') {
      const targetLx = lx + this.states.roomResize.offsetX;
      nextEdgeWidth = Math.max(0.2, Math.min(original.width - 0.2, this.ctx.snapNumber(right - targetLx)));
    } else if (side === 'edgeDepth') {
      const targetLz = lz + this.states.roomResize.offsetZ;
      nextEdgeDepth = Math.max(0.2, Math.min(original.depth - 0.2, this.ctx.snapNumber(bottom - targetLz)));
    }

    if (room.shape === 'l-shape') {
      if (side === 'east') {
        const dw = nextWidth - original.width;
        nextEdgeWidth = Math.max(0.2, Math.min(nextWidth - 0.2, this.ctx.snapNumber(original.edgeWidth + dw)));
      } else if (side === 'south') {
        const dd = nextDepth - original.depth;
        nextEdgeDepth = Math.max(0.2, Math.min(nextDepth - 0.2, this.ctx.snapNumber(original.edgeDepth + dd)));
      }
    }

    // 局部中心转换回世界坐标
    const nextX = Number((original.x + localCenterX * cos - localCenterZ * sin).toFixed(3));
    const nextZ = Number((original.z + localCenterX * sin + localCenterZ * cos).toFixed(3));

    const patch = {
      x: nextX,
      z: nextZ,
      width: nextWidth,
      depth: nextDepth,
      edgeWidth: nextEdgeWidth,
      edgeDepth: nextEdgeDepth
    };
    const isChanged = Math.abs(patch.width - original.width) > 0.02 ||
                      Math.abs(patch.depth - original.depth) > 0.02 ||
                      Math.abs((patch.edgeWidth || 0) - (original.edgeWidth || 0)) > 0.02 ||
                      Math.abs((patch.edgeDepth || 0) - (original.edgeDepth || 0)) > 0.02;

    if (!this.states.roomResize.historyPushed && isChanged) {
      this.ctx.pushHistory();
      this.states.roomResize.historyPushed = true;
    }
    
    this.ctx.testMap.updateEntityPreview('room', room.id, { ...patch, moveItems: false });
    this.ctx.refreshShadows?.();
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  finishRoomEdit() {
    const needCommitRoomId = this.states.roomDrag ? this.states.roomDrag.roomId : (this.states.roomResize ? this.states.roomResize.roomId : null);
    this.states.roomDrag = null;
    this.states.roomResize = null;
    if (needCommitRoomId) {
      this.ctx.testMap.commitEntityPreview('room', needCommitRoomId).then(() => {
        this.ctx.refreshShadows?.();
      });
    }
  }

  // --- 墙体拖拽 ---

  beginWallDrag(event, wallId) {
    if (event.button === 2) return;
    if (this.ctx.mode !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    this.ctx.rememberPointer(event);
    if (this.ctx.selectedWallId !== wallId) {
      this.ctx.selectWall(wallId);
    }
    const wall = this.ctx.testMap.getWall(wallId);
    if (!wall) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    this.states.wallDrag = {
      wallId,
      originalFrom: [...wall.from],
      originalTo: [...wall.to],
      startWorldX: world.x,
      startWorldZ: world.z,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview('wall', wallId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveWallDrag(event) {
    if (!this.states.wallDrag) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    const dx = world.x - this.states.wallDrag.startWorldX;
    const dz = world.z - this.states.wallDrag.startWorldZ;
    if (!this.states.wallDrag.historyPushed && Math.hypot(dx, dz) > 0.02) {
      this.ctx.pushHistory();
      this.states.wallDrag.historyPushed = true;
    }
    this.moveWallBy(this.states.wallDrag.wallId, dx, dz);
  }

  moveWallBy(wallId, dx, dz) {
    const wall = this.ctx.testMap.getWall(wallId);
    if (!wall) return;
    
    let nextFromX = this.states.wallDrag.originalFrom[0] + dx;
    let nextFromZ = this.states.wallDrag.originalFrom[1] + dz;
    let nextToX = this.states.wallDrag.originalTo[0] + dx;
    let nextToZ = this.states.wallDrag.originalTo[1] + dz;
    
    if (this.ctx.snapEnabled && this.ctx.snapSize) {
      const origDx = this.states.wallDrag.originalTo[0] - this.states.wallDrag.originalFrom[0];
      const origDz = this.states.wallDrag.originalTo[1] - this.states.wallDrag.originalFrom[1];
      const snappedFrom = this.ctx.snapWorldPoint({ x: nextFromX, z: nextFromZ });
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
    
    this.ctx.testMap.updateEntityPreview('wall', wallId, {
      from: [nextFromX, nextFromZ],
      to: [nextToX, nextToZ]
    });
    
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  finishWallDrag() {
    if (!this.states.wallDrag) return;
    const wallId = this.states.wallDrag.wallId;
    this.states.wallDrag = null;
    this.ctx.testMap.commitEntityPreview('wall', wallId).then(() => {
      this.ctx.refreshShadows?.();
      this.ctx.selectWall(wallId);
    });
  }

  // --- 洞口拖拽 ---

  beginOpeningDrag(event, openingId) {
    if (event.button === 2) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.ctx.selectedOpeningId !== openingId) {
      this.ctx.selectOpening(openingId);
    }
    const opening = this.ctx.testMap.getOpening(openingId);
    if (this.ctx.mode === 'delete-wall') {
      if (opening?.locked) return;
      this.ctx.pushHistory();
      this.ctx.testMap.executeCommand('deleteOpening', { openingId });
      this.ctx.clearSelection();
      this.ctx.refreshShadows?.();
      this.ctx.renderPlan?.();
      return;
    }
    if (this.ctx.mode !== 'select') return;
    const wall = opening ? this.ctx.testMap.getWall(opening.wallId) : null;
    if (!opening || opening.locked || !wall) return;
    this.states.openingDrag = {
      openingId,
      originalT: opening.t ?? 0.5,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview('opening', openingId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveOpeningDrag(event) {
    if (!this.states.openingDrag) return;
    const point = this.ctx.svgPointFromEvent(event);
    this.moveOpeningToWorld(this.states.openingDrag.openingId, this.ctx.svgToWorld(point.x, point.y), this.states.openingDrag);
  }

  moveOpeningToWorld(openingId, world, dragMeta) {
    const opening = this.ctx.testMap.getOpening(openingId);
    if (!opening || opening.locked) return;
    
    const walls = this.ctx.currentWalls();
    let closestWall = null;
    let closestT = 0.5;
    let minDistance = Infinity;

    for (const w of walls) {
      const ax = w.from[0];
      const az = w.from[1];
      const bx = w.to[0];
      const bz = w.to[1];
      const dx = bx - ax;
      const dz = bz - az;
      const lengthSq = dx * dx + dz * dz;
      if (lengthSq < 0.001) continue;

      let t = ((world.x - ax) * dx + (world.z - az) * dz) / lengthSq;
      t = Math.max(0.08, Math.min(0.92, t));

      const projX = ax + dx * t;
      const projZ = az + dz * t;

      const dist = Math.hypot(world.x - projX, world.z - projZ);
      if (dist < minDistance) {
        minDistance = dist;
        closestWall = w;
        closestT = t;
      }
    }

    if (!closestWall) return;

    if (this.ctx.snapEnabled && this.ctx.snapSize) {
      const ax = closestWall.from[0];
      const az = closestWall.from[1];
      const bx = closestWall.to[0];
      const bz = closestWall.to[1];
      const dx = bx - ax;
      const dz = bz - az;
      const lengthSq = dx * dx + dz * dz;
      if (lengthSq > 0.001) {
        const rawCenterX = ax + dx * closestT;
        const rawCenterZ = az + dz * closestT;
        const snapped = Topology.snapToGridSegmentCenter(
          { x: rawCenterX, z: rawCenterZ },
          this.ctx.snapEnabled,
          this.ctx.snapSize
        );
        closestT = Math.max(0.08, Math.min(0.92, ((snapped.x - ax) * dx + (snapped.z - az) * dz) / lengthSq));
      }
    }

    const wallChanged = closestWall.id !== opening.wallId;
    const tChanged = Math.abs(closestT - (dragMeta ? dragMeta.originalT : opening.t)) > 0.01;
    if (dragMeta && !dragMeta.historyPushed && (wallChanged || tChanged)) {
      this.ctx.pushHistory();
      dragMeta.historyPushed = true;
    }

    this.ctx.testMap.updateEntityPreview('opening', openingId, { t: closestT, wallId: closestWall.id });
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  finishOpeningDrag() {
    if (!this.states.openingDrag) return;
    const openingId = this.states.openingDrag.openingId;
    this.states.openingDrag = null;
    this.ctx.testMap.commitEntityPreview('opening', openingId).then(() => {
      this.ctx.refreshShadows?.();
      this.ctx.selectOpening(openingId);
    });
  }

  // --- 围栏与围栏大门拖拽 ---

  beginFenceDrag(event, fenceId) {
    if (event.button === 2) return;
    event.stopPropagation();
    this.ctx.rememberPointer(event);
    if (this.ctx.selectedFenceId !== fenceId) {
      this.ctx.selectFence(fenceId);
    }
    const fence = this.ctx.testMap.getFence(fenceId);
    if (!fence || fence.locked) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    this.states.fenceDrag = {
      fenceId,
      originalFrom: [...fence.from],
      originalTo: [...fence.to],
      startWorldX: world.x,
      startWorldZ: world.z,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview('fence', fenceId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveFenceDrag(event) {
    if (!this.states.fenceDrag) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    const dx = world.x - this.states.fenceDrag.startWorldX;
    const dz = world.z - this.states.fenceDrag.startWorldZ;
    if (!this.states.fenceDrag.historyPushed && Math.hypot(dx, dz) > 0.02) {
      this.ctx.pushHistory();
      this.states.fenceDrag.historyPushed = true;
    }
    this.moveFenceBy(this.states.fenceDrag.fenceId, dx, dz);
  }

  moveFenceBy(fenceId, dx, dz) {
    const fence = this.ctx.testMap.getFence(fenceId);
    if (!fence || fence.locked) return;
    
    let nextFromX = this.states.fenceDrag.originalFrom[0] + dx;
    let nextFromZ = this.states.fenceDrag.originalFrom[1] + dz;
    let nextToX = this.states.fenceDrag.originalTo[0] + dx;
    let nextToZ = this.states.fenceDrag.originalTo[1] + dz;
    
    if (this.ctx.snapEnabled && this.ctx.snapSize) {
      const origDx = this.states.fenceDrag.originalTo[0] - this.states.fenceDrag.originalFrom[0];
      const origDz = this.states.fenceDrag.originalTo[1] - this.states.fenceDrag.originalFrom[1];
      const rawCenterX = nextFromX + origDx / 2;
      const rawCenterZ = nextFromZ + origDz / 2;
      const snappedCenter = this.ctx.snapToGridSegmentCenter({ x: rawCenterX, z: rawCenterZ });
      
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
    
    this.ctx.testMap.updateEntityPreview('fence', fenceId, {
      from: [nextFromX, nextFromZ],
      to: [nextToX, nextToZ]
    });
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  finishFenceDrag() {
    if (!this.states.fenceDrag && !this.states.fenceHandleDrag) return;
    const fenceId = this.states.fenceDrag ? this.states.fenceDrag.fenceId : this.states.fenceHandleDrag.fenceId;
    this.states.fenceDrag = null;
    this.states.fenceHandleDrag = null;
    this.ctx.testMap.commitEntityPreview('fence', fenceId).then(() => {
      this.ctx.refreshShadows?.();
      this.ctx.selectFence(fenceId);
    });
  }

  beginFenceGateDrag(event, gateId) {
    if (event.button === 2) return;
    event.stopPropagation();
    this.ctx.rememberPointer(event);
    if (this.ctx.selectedFenceGateId !== gateId) {
      this.ctx.selectFenceGate(gateId);
    }
    const gate = this.ctx.testMap.getFenceGate(gateId);
    if (!gate || gate.locked) return;

    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);

    this.states.fenceGateDrag = {
      gateId,
      originalFrom: [...gate.from],
      originalTo: [...gate.to],
      originalFenceId: gate.fenceId,
      originalT: gate.t,
      startX: world.x,
      startZ: world.z,
      historyPushed: false
    };

    this.ctx.testMap.beginEntityPreview('fencegate', gateId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveFenceGateDrag(event) {
    if (!this.states.fenceGateDrag) return;
    const point = this.ctx.svgPointFromEvent(event);
    this.moveFenceGateToWorld(this.states.fenceGateDrag.gateId, this.ctx.svgToWorld(point.x, point.y), this.states.fenceGateDrag);
  }

  moveFenceGateToWorld(gateId, world, dragMeta) {
    const gate = this.ctx.testMap.getFenceGate(gateId);
    if (!gate || gate.locked) return;

    const dx = world.x - dragMeta.startX;
    const dz = world.z - dragMeta.startZ;

    if (dragMeta && !dragMeta.historyPushed && (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02)) {
      this.ctx.pushHistory();
      dragMeta.historyPushed = true;
    }

    const wasAttached = dragMeta.originalFenceId !== null;
    let nearestFence = null;
    let nearestDist = Infinity;
    let projectionT = 0.5;

    if (wasAttached) {
      const originalFence = this.ctx.testMap.getFence(dragMeta.originalFenceId);
      if (originalFence) {
        const { t, distance } = Topology.projectPointToFence(world, originalFence, this.ctx.snapEnabled, this.ctx.snapSize);
        if (distance < 0.6) {
          nearestFence = originalFence;
          nearestDist = distance;
          projectionT = t;
        }
      }
    }

    if (!nearestFence) {
      const fences = this.ctx.testMap.floorplan.fences.filter(f => f.floorId === gate.floorId);
      const nearest = Topology.findNearestFenceTrack(world, fences, this.ctx.snapEnabled, this.ctx.snapSize);
      if (nearest.fence) {
        nearestFence = nearest.fence;
        nearestDist = nearest.distance;
        projectionT = nearest.t;
      }
    }

    const attachThreshold = (nearestFence && nearestFence.id === dragMeta.originalFenceId) ? 0.6 : 0.25;

    if (nearestFence && nearestDist < attachThreshold) {
      this.ctx.testMap.updateEntityPreview('fencegate', gateId, {
        fenceId: nearestFence.id,
        t: projectionT
      });
    } else {
      const origCenterX = (dragMeta.originalFrom[0] + dragMeta.originalTo[0]) / 2;
      const origCenterZ = (dragMeta.originalFrom[1] + dragMeta.originalTo[1]) / 2;
      let newCenterX = origCenterX + dx;
      let newCenterZ = origCenterZ + dz;

      if (this.ctx.snapEnabled && this.ctx.snapSize) {
        const snapped = this.ctx.snapToGridSegmentCenter({ x: newCenterX, z: newCenterZ });
        newCenterX = snapped.x;
        newCenterZ = snapped.z;
      }

      const odx = dragMeta.originalTo[0] - dragMeta.originalFrom[0];
      const odz = dragMeta.originalTo[1] - dragMeta.originalFrom[1];
      const angle = Math.atan2(odz, odx);

      const halfW = (gate.width || 1.0) / 2;
      const nextFrom = [newCenterX - Math.cos(angle) * halfW, newCenterZ - Math.sin(angle) * halfW];
      const nextTo = [newCenterX + Math.cos(angle) * halfW, newCenterZ + Math.sin(angle) * halfW];

      this.ctx.testMap.updateEntityPreview('fencegate', gateId, {
        fenceId: null,
        from: nextFrom,
        to: nextTo
      });
    }

    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  finishFenceGateDrag() {
    if (!this.states.fenceGateDrag) return;
    const gateId = this.states.fenceGateDrag.gateId;
    this.states.fenceGateDrag = null;
    this.ctx.testMap.commitEntityPreview('fencegate', gateId).then(() => {
      this.ctx.refreshShadows?.();
      this.ctx.selectFenceGate(gateId);
    });
  }

  beginFenceHandleDrag(event, fenceId, handle) {
    if (event.button === 2) return;
    event.stopPropagation();
    this.ctx.rememberPointer(event);
    if (this.ctx.selectedFenceId !== fenceId) {
      this.ctx.selectFence(fenceId);
    }
    const fence = this.ctx.testMap.getFence(fenceId);
    if (!fence || fence.locked) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    this.states.fenceHandleDrag = {
      fenceId: fenceId,
      handle: handle,
      startWorldX: world.x,
      startWorldZ: world.z,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview('fence', fenceId);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveFenceHandleDrag(event) {
    if (!this.states.fenceHandleDrag) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    const snapped = this.ctx.snapWorldPoint(world);
    if (!this.states.fenceHandleDrag.historyPushed && Math.hypot(world.x - this.states.fenceHandleDrag.startWorldX, world.z - this.states.fenceHandleDrag.startWorldZ) > 0.02) {
      this.ctx.pushHistory();
      this.states.fenceHandleDrag.historyPushed = true;
    }
    if (this.states.fenceHandleDrag.handle === 'from') {
      this.ctx.testMap.updateEntityPreview('fence', this.states.fenceHandleDrag.fenceId, { from: [snapped.x, snapped.z] });
    } else {
      this.ctx.testMap.updateEntityPreview('fence', this.states.fenceHandleDrag.fenceId, { to: [snapped.x, snapped.z] });
    }
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  // --- 结构（楼梯与屋顶）拖拽 ---

  beginStructureDrag(event, type, id) {
    if (event.button === 2) return;
    if (this.ctx.mode !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    if (type === 'roof') this.ctx.selectRoof(id);
    if (type === 'stairs') this.ctx.selectStairs(id);
    const structure = this.ctx.getStructure(type, id);
    if (!structure || structure.locked) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    this.states.structureDrag = {
      type,
      id,
      offsetX: (structure.x || 0) - world.x,
      offsetZ: (structure.z || 0) - world.z,
      originalX: structure.x || 0,
      originalZ: structure.z || 0,
      historyPushed: false
    };
    this.ctx.testMap.beginEntityPreview(type, id);
    this.ctx.svg.setPointerCapture(event.pointerId);
  }

  moveStructureDrag(event) {
    if (!this.states.structureDrag) return;
    const point = this.ctx.svgPointFromEvent(event);
    const world = this.ctx.svgToWorld(point.x, point.y);
    const nextX = world.x + this.states.structureDrag.offsetX;
    const nextZ = world.z + this.states.structureDrag.offsetZ;
    if (!this.states.structureDrag.historyPushed && Math.hypot(nextX - this.states.structureDrag.originalX, nextZ - this.states.structureDrag.originalZ) > 0.02) {
      this.ctx.pushHistory();
      this.states.structureDrag.historyPushed = true;
    }
    this.ctx.testMap.updateEntityPreview(this.states.structureDrag.type, this.states.structureDrag.id, { x: nextX, z: nextZ });
    this.ctx.updateEditor?.();
    this.ctx.renderPlan?.();
  }

  finishDrag() {
    const isRoom = !!(this.states.roomDrag || this.states.roomResize);
    const isWall = !!this.states.wallDrag;
    const isOpening = !!this.states.openingDrag;
    const isFence = !!(this.states.fenceDrag || this.states.fenceHandleDrag);
    const isFenceGate = !!this.states.fenceGateDrag;
    const isStructure = !!this.states.structureDrag;

    if (isRoom) {
      this.finishRoomEdit();
    } else if (isWall) {
      this.finishWallDrag();
    } else if (isOpening) {
      this.finishOpeningDrag();
    } else if (isFence) {
      this.finishFenceDrag();
    } else if (isFenceGate) {
      this.finishFenceGateDrag();
    } else if (isStructure) {
      const type = this.states.structureDrag.type;
      const id = this.states.structureDrag.id;
      this.states.structureDrag = null;
      this.ctx.testMap.commitEntityPreview(type, id).then(() => {
        this.ctx.refreshShadows?.();
      });
    }
  }
}
