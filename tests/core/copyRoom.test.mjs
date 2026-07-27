import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument, getRoomWallKeys, pointInRoom } from '../../src/index.js';

function calculateFastNonOverlappingPosition(sourceRoom, existingRooms = []) {
  const currentFloorId = sourceRoom.floorId;
  const roomsOnFloor = existingRooms.filter(r => r.floorId === currentFloorId && r.id !== sourceRoom.id);

  const w = sourceRoom.width || 4;
  const d = sourceRoom.depth || 4;
  const sourceW = sourceRoom.width || 4;
  const sourceD = sourceRoom.depth || 4;
  const gap = 0.5;
  const eps = 0.05;

  const stepX = (w + sourceW) / 2 + gap;
  const stepZ = (d + sourceD) / 2 + gap;

  const isPositionOverlapping = (cx, cz) => {
    const minX1 = cx - w / 2;
    const maxX1 = cx + w / 2;
    const minZ1 = cz - d / 2;
    const maxZ1 = cz + d / 2;

    for (const other of roomsOnFloor) {
      const otherW = other.width || 4;
      const otherD = other.depth || 4;
      const minX2 = other.x - otherW / 2;
      const maxX2 = other.x + otherW / 2;
      const minZ2 = other.z - otherD / 2;
      const maxZ2 = other.z + otherD / 2;

      const overlapX = (minX1 + eps < maxX2) && (maxX1 - eps > minX2);
      const overlapZ = (minZ1 + eps < maxZ2) && (maxZ1 - eps > minZ2);
      if (overlapX && overlapZ) {
        return { other, minX2, maxX2, minZ2, maxZ2 };
      }
    }
    return null;
  };

  const candidateNeighbors = [
    { x: sourceRoom.x + stepX, z: sourceRoom.z },         // 东 (+X)
    { x: sourceRoom.x - stepX, z: sourceRoom.z },         // 西 (-X)
    { x: sourceRoom.x,         z: sourceRoom.z + stepZ }, // 南 (+Z)
    { x: sourceRoom.x,         z: sourceRoom.z - stepZ }  // 北 (-Z)
  ];

  for (const pos of candidateNeighbors) {
    if (!isPositionOverlapping(pos.x, pos.z)) {
      return pos;
    }
  }

  const jumpDirections = [
    { dirX: 1, dirZ: 0 },
    { dirX: -1, dirZ: 0 },
    { dirX: 0, dirZ: 1 },
    { dirX: 0, dirZ: -1 }
  ];

  for (const dir of jumpDirections) {
    let currX = sourceRoom.x + dir.dirX * stepX;
    let currZ = sourceRoom.z + dir.dirZ * stepZ;

    for (let iter = 0; iter < roomsOnFloor.length + 2; iter++) {
      const block = isPositionOverlapping(currX, currZ);
      if (!block) {
        return { x: currX, z: currZ };
      }
      if (dir.dirX > 0) currX = block.maxX2 + w / 2 + gap;
      else if (dir.dirX < 0) currX = block.minX2 - w / 2 - gap;
      else if (dir.dirZ > 0) currZ = block.maxZ2 + d / 2 + gap;
      else if (dir.dirZ < 0) currZ = block.minZ2 - d / 2 - gap;
    }
  }

  const candidateAnchors = [];
  roomsOnFloor.forEach(r => {
    const rW = r.width || 4;
    const rD = r.depth || 4;
    const rMinX = r.x - rW / 2;
    const rMaxX = r.x + rW / 2;
    const rMinZ = r.z - rD / 2;
    const rMaxZ = r.z + rD / 2;

    candidateAnchors.push({ x: rMaxX + w / 2 + gap, z: rMaxZ + d / 2 + gap });
    candidateAnchors.push({ x: rMinX - w / 2 - gap, z: rMaxZ + d / 2 + gap });
    candidateAnchors.push({ x: rMaxX + w / 2 + gap, z: rMinZ - d / 2 - gap });
    candidateAnchors.push({ x: rMinX - w / 2 - gap, z: rMinZ - d / 2 - gap });
  });

  candidateAnchors.sort((a, b) => {
    const distA = Math.hypot(a.x - sourceRoom.x, a.z - sourceRoom.z);
    const distB = Math.hypot(b.x - sourceRoom.x, b.z - sourceRoom.z);
    return distA - distB;
  });

  for (const anchor of candidateAnchors) {
    if (!isPositionOverlapping(anchor.x, anchor.z)) {
      return anchor;
    }
  }

  return { x: sourceRoom.x + stepX, z: sourceRoom.z };
}

test('Block-Jump 极速摆放算法：优先+X/-X/+Z/-Z防重叠及超大房间亚毫秒级寻空', () => {
  const baseRoom = { id: 'r0', floorId: 'f1', x: 0, z: 0, width: 50, depth: 50 };
  let rooms = [baseRoom];

  const startTime = performance.now();
  let pos1 = calculateFastNonOverlappingPosition(baseRoom, rooms);
  const duration = performance.now() - startTime;

  assert.ok(duration < 5.0, `50m x 50m 超大房间寻空耗时应小于 5ms，实际 ${duration}ms`);
  assert.equal(pos1.x, 50.5);
  assert.equal(pos1.z, 0);
  rooms.push({ id: 'r1', floorId: 'f1', x: pos1.x, z: pos1.z, width: 50, depth: 50 });

  let pos2 = calculateFastNonOverlappingPosition(baseRoom, rooms);
  assert.equal(pos2.x, -50.5);
  assert.equal(pos2.z, 0);
});

test('无墙房间/露台复制：如果房间没有墙，复制出来的房间也保持无墙', () => {
  const doc = new FloorplanDocument();
  const terrace = doc.addRoom({
    name: '露台',
    x: 0,
    z: 0,
    width: 6,
    depth: 6
  });

  // 删除东侧与南侧墙体，模拟半无墙露台
  const keys = getRoomWallKeys(terrace);
  const eastWallId = terrace.wallIds[keys[1]];
  if (eastWallId) {
    doc.deleteWall(eastWallId);
  }

  // 模拟复制房间时的无墙清理逻辑
  const roomCopyData = JSON.parse(JSON.stringify(terrace));
  delete roomCopyData.id;
  delete roomCopyData.wallIds;

  const copiedTerrace = doc.addRoom({
    ...roomCopyData,
    x: 10,
    z: 0
  });

  const copiedKeys = getRoomWallKeys(copiedTerrace);
  copiedKeys.forEach(k => {
    const sWallId = terrace.wallIds?.[k];
    const tWallId = copiedTerrace.wallIds?.[k];
    if (!sWallId && tWallId) {
      doc.deleteWall(tWallId);
    } else if (sWallId && tWallId) {
      const sWall = doc.getWall(sWallId);
      if (!sWall) {
        doc.deleteWall(tWallId);
      } else {
        doc.updateWall(tWallId, { hidden: !!sWall.hidden });
      }
    }
  });

  // 验证 copiedTerrace 在东边没有墙
  assert.equal(copiedTerrace.wallIds[keys[1]], undefined, '克隆的露台在原无墙边上不应拥有墙体');
});

test('房间全量复制：包含房间材质、墙面饰面、门窗及家具参数', () => {
  const doc = new FloorplanDocument();

  const sourceRoom = doc.addRoom({
    name: '豪华主卧',
    x: 0,
    z: 0,
    width: 6,
    depth: 6,
    material: { textureUrl: 'wood_floor.jpg' },
    color: '#d4a373',
    ceilingMaterial: { textureUrl: 'plaster.jpg' },
    ceilingColor: '#ffffff',
    elevation: 0.2
  });

  const wallKeys = getRoomWallKeys(sourceRoom);
  const northWallId = sourceRoom.wallIds[wallKeys[0]];
  const northWall = doc.getWall(northWallId);
  if (northWall) {
    northWall.materialFront = { textureUrl: 'wallpaper_blue.jpg' };
    northWall.colorFront = '#1e3d59';
    northWall.baseboardEnabled = true;
    northWall.baseboardHeight = 0.12;
    northWall.baseboardMaterialFront = { textureUrl: 'wood_skirting.jpg' };
  }

  const opening = doc.addOpening({
    wallId: northWallId,
    type: 'window',
    shape: 'round-arch',
    width: 1.5,
    height: 2.0,
    t: 0.5,
    doubleDoor: true
  });

  const item = doc.addItem({
    name: '双人床',
    type: 'bed',
    x: 1.0,
    z: 1.0,
    roomId: sourceRoom.id,
    rotation: Math.PI / 2,
    elevation: 0.2,
    customMaterial: { color: '#ff5722' }
  });

  const existingRooms = doc.floorplan.floor.rooms;
  const targetPos = calculateFastNonOverlappingPosition(sourceRoom, existingRooms);
  const dx = targetPos.x - sourceRoom.x;
  const dz = targetPos.z - sourceRoom.z;

  const roomCopyData = JSON.parse(JSON.stringify(sourceRoom));
  delete roomCopyData.id;
  delete roomCopyData.wallIds;

  const copiedRoom = doc.addRoom({
    ...roomCopyData,
    x: targetPos.x,
    z: targetPos.z
  });

  const newWallKeys = getRoomWallKeys(copiedRoom);
  newWallKeys.forEach(key => {
    const sWallId = sourceRoom.wallIds?.[key];
    const tWallId = copiedRoom.wallIds?.[key];
    if (sWallId && tWallId) {
      const sWall = doc.getWall(sWallId);
      const tWall = doc.getWall(tWallId);
      if (sWall && tWall) {
        Object.assign(tWall, {
          colorFront: sWall.colorFront,
          materialFront: sWall.materialFront,
          baseboardEnabled: sWall.baseboardEnabled,
          baseboardHeight: sWall.baseboardHeight,
          baseboardMaterialFront: sWall.baseboardMaterialFront
        });

        const sourceOpenings = (doc.floorplan.openings || []).filter(o => o.wallId === sWallId);
        sourceOpenings.forEach(op => {
          const opCopy = JSON.parse(JSON.stringify(op));
          delete opCopy.id;
          delete opCopy.wallId;
          doc.addOpening({
            ...opCopy,
            wallId: tWallId
          });
        });
      }
    }
  });

  const roomItems = (doc.floorplan.items || []).filter(i => i.roomId === sourceRoom.id || pointInRoom(sourceRoom, i.x, i.z));
  roomItems.forEach(it => {
    const itCopy = JSON.parse(JSON.stringify(it));
    delete itCopy.id;
    doc.addItem({
      ...itCopy,
      x: it.x + dx,
      z: it.z + dz,
      roomId: copiedRoom.id
    });
  });

  assert.ok(copiedRoom, '应该成功创建复制房间');
  assert.equal(copiedRoom.name, '豪华主卧');
  assert.deepEqual(copiedRoom.material, { textureUrl: 'wood_floor.jpg' });
  assert.equal(copiedRoom.color, '#d4a373');
  assert.deepEqual(copiedRoom.ceilingMaterial, { textureUrl: 'plaster.jpg' });

  const copiedNorthWall = doc.getWall(copiedRoom.wallIds[newWallKeys[0]]);
  assert.ok(copiedNorthWall);
  assert.equal(copiedNorthWall.colorFront, '#1e3d59');
  assert.deepEqual(copiedNorthWall.materialFront, { textureUrl: 'wallpaper_blue.jpg' });
  assert.equal(copiedNorthWall.baseboardEnabled, true);
  assert.equal(copiedNorthWall.baseboardHeight, 0.12);

  const copiedOpenings = (doc.floorplan.openings || []).filter(o => o.wallId === copiedNorthWall.id);
  assert.equal(copiedOpenings.length, 1);
  assert.equal(copiedOpenings[0].type, 'window');
  assert.equal(copiedOpenings[0].shape, 'round-arch');
  assert.equal(copiedOpenings[0].width, 1.5);
  assert.equal(copiedOpenings[0].doubleDoor, true);

  const copiedItems = (doc.floorplan.items || []).filter(i => i.roomId === copiedRoom.id);
  assert.equal(copiedItems.length, 1);
  assert.equal(copiedItems[0].name, '双人床');
  assert.equal(copiedItems[0].x, 1.0 + dx);
  assert.equal(copiedItems[0].z, 1.0 + dz);
  assert.equal(copiedItems[0].rotation, Math.PI / 2);
  assert.deepEqual(copiedItems[0].customMaterial, { color: '#ff5722' });
});
