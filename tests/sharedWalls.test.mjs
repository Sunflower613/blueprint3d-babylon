import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument } from '../src/index.js';

test('编辑房间时自动识别边上的手画墙/共享墙，不背地自动生成新墙段，且保护手画墙坐标', () => {
  const mockPlan = {
    format: 'blueprint3d-babylon.building.v1',
    version: 1,
    currentFloorId: 'floor_1',
    floors: [{ id: 'floor_1', name: '1F', level: 0 }],
    floor: {
      rooms: [
        {
          id: 'room_A',
          name: '大厅',
          floorId: 'floor_1',
          shape: 'square',
          x: 0,
          z: 0,
          width: 8,
          depth: 10,
          wallIds: {
            north: 'wall_A_north',
            east: 'wall_A_east',
            south: 'wall_shared',
            west: 'wall_A_west'
          }
        },
        {
          id: 'room_B',
          name: '手画墙房间',
          floorId: 'floor_1',
          shape: 'square',
          x: 0,
          z: -6.5,
          width: 4,
          depth: 3,
          wallIds: {}
        }
      ]
    },
    walls: [
      { id: 'wall_A_north', from: [-4, 5], to: [4, 5], floorId: 'floor_1', roomId: 'room_A' },
      { id: 'wall_A_east', from: [4, 5], to: [4, -5], floorId: 'floor_1', roomId: 'room_A' },
      { id: 'wall_shared', from: [4, -5], to: [-4, -5], floorId: 'floor_1', roomId: 'room_A' },
      { id: 'wall_A_west', from: [-4, -5], to: [-4, 5], floorId: 'floor_1', roomId: 'room_A' },
      // 用户手动在 room_B 的北侧画了一面覆盖 [-3, -5] 到 [3, -5] 的大墙
      { id: 'wall_manual_north', from: [-3, -5], to: [3, -5], floorId: 'floor_1' }
    ],
    items: [],
    openings: []
  };

  const doc = new FloorplanDocument(mockPlan);

  const initialWallCount = doc.floorplan.walls.length;

  // 1. 同步 room_B 的墙（createMissing = false，不自动创建缺失墙）
  const roomB = doc.getRoom('room_B');
  doc.syncRoomWalls(roomB, false);

  // 2. 验证：room_B 位于 z = -5 的边缘成功自动识别到了手画墙 'wall_manual_north'
  assert.ok(Object.values(roomB.wallIds).includes('wall_manual_north'), '房间边缘应自动识别关联手画墙');

  // 3. 验证：手画墙的原始坐标 [-3, -5] 到 [3, -5] 被完美保护，没有被篡改
  const manualWall = doc.getWall('wall_manual_north');
  assert.deepEqual(manualWall.from, [-3, -5], '手画墙起点坐标不应被修改');
  assert.deepEqual(manualWall.to, [3, -5], '手画墙终点坐标不应被修改');

  // 4. 验证：场景中墙的总数量完全没有多出任何“背地里自动生成”的新墙段！
  assert.equal(doc.floorplan.walls.length, initialWallCount, '不应背地里自动创建多余的新墙段');
});
