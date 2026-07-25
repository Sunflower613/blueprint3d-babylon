import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getItemRoomElevationOffset } from '../../src/core/exporterUtils.js';

test('房间外家具高度贴地修正测试', async (t) => {
  await t.test('getItemRoomElevationOffset 正确计算房间内与房间外的偏移量', () => {
    const doc = new FloorplanDocument({
      unit: 'm',
      floorHeight: 0.2,
      wallHeight: 2.8,
      floors: [
        { id: 'floor_1', name: '1F', level: 0, floorHeight: 0.2 }
      ],
      currentFloorId: 'floor_1',
      rooms: [
        {
          id: 'room_1',
          floorId: 'floor_1',
          elevation: 0.5,
          x: 0,
          z: 0,
          width: 5,
          depth: 5
        }
      ],
      items: [
        {
          id: 'item_indoor',
          type: 'chair',
          floorId: 'floor_1',
          roomId: 'room_1',
          x: 1,
          z: 1,
          elevation: 0
        },
        {
          id: 'item_outdoor',
          type: 'chair',
          floorId: 'floor_1',
          roomId: null,
          x: 10,
          z: 10,
          elevation: 0
        }
      ]
    });

    const indoorItem = doc.getItem('item_indoor');
    const outdoorItem = doc.getItem('item_outdoor');

    // 房间内家具：偏移量应为房间抬高 (0.5m)
    assert.equal(doc.getItemRoomElevationOffset(indoorItem), 0.5);

    // 房间外家具：偏移量应为 -floorHeight (-0.2m)
    assert.equal(doc.getItemRoomElevationOffset(outdoorItem), -0.2);

    // 检查 exporterUtils 中的纯函数 getItemRoomElevationOffset
    const exporterIndoorOffset = getItemRoomElevationOffset(doc.floorplan, indoorItem);
    const exporterOutdoorOffset = getItemRoomElevationOffset(doc.floorplan, outdoorItem);

    assert.equal(exporterIndoorOffset, 0.5);
    assert.equal(exporterOutdoorOffset, -0.2);
  });

  await t.test('1楼房间外家具在 3D 渲染中的绝对高程应贴地为 0.0m', () => {
    const doc = new FloorplanDocument({
      unit: 'm',
      floorHeight: 0.2,
      wallHeight: 2.8,
      floors: [
        { id: 'floor_1', name: '1F', level: 0, floorHeight: 0.2 }
      ],
      currentFloorId: 'floor_1',
      rooms: [
        {
          id: 'room_1',
          floorId: 'floor_1',
          elevation: 0,
          x: 0,
          z: 0,
          width: 4,
          depth: 4
        }
      ],
      items: [
        {
          id: 'outdoor_bench',
          type: 'chair',
          floorId: 'floor_1',
          x: 8,
          z: 8,
          elevation: 0
        }
      ]
    });

    const bench = doc.getItem('outdoor_bench');
    const floorY = doc.getFloorElevation(bench.floorId); // 0.2m
    const roomOffset = doc.getItemRoomElevationOffset(bench); // -0.2m
    const finalY = floorY + roomOffset + (bench.elevation || 0);

    // 房间外家具算出的最终渲染高度必须是 0.0m (完美贴地)
    assert.equal(floorY, 0.2);
    assert.equal(roomOffset, -0.2);
    assert.equal(finalY, 0.0);
  });
});
