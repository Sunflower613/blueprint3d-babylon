import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { createEditor } from '../src/index.js';

test('Preview Lifecycle API: 拖拽实时预览与提交/撤销全流程闭环验证', async () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  const mockPlan = {
    unit: 'm',
    currentFloorId: 'floor_1',
    floors: [
      { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
    ],
    floor: {
      rooms: [
        { id: 'living', name: '客厅', x: 0, z: 0, width: 4, depth: 4 }
      ]
    },
    walls: [
      { id: 'w1', from: [0, 0], to: [4, 0], floorId: 'floor_1' }
    ],
    openings: [],
    items: [
      { id: 'chair1', name: '椅子', x: 1, z: 1, type: 'chair', floorId: 'floor_1' }
    ],
    roofs: [],
    stairs: [],
    fences: []
  };

  const editor = createEditor({ scene, floorplan: mockPlan });

  // 1. 验证 beginEntityPreview 触发
  let ok = editor.beginEntityPreview('room', 'living');
  assert.equal(ok, true, '应该成功启动 Room 的拖拽预览');

  // 2. 验证 updateEntityPreview 实时更新数据
  ok = editor.updateEntityPreview('room', 'living', { x: 2, z: 2, width: 5, depth: 5 });
  assert.equal(ok, true, '应该成功更新 Room 的拖拽预览参数');

  const liveRoom = editor.floorplan.floor.rooms.find(r => r.id === 'living');
  assert.equal(liveRoom.x, 2, 'Room x 应该已被修改为预览值');
  assert.equal(liveRoom.width, 5, 'Room width 应该已被修改为预览值');

  // 3. 验证 cancelEntityPreview 成功撤回并复原数据到 0, 4
  ok = editor.cancelEntityPreview('room', 'living');
  assert.equal(ok, true, '应该成功取消 Room 的拖拽预览并还原数据');

  const restoredRoom = editor.floorplan.floor.rooms.find(r => r.id === 'living');
  assert.equal(restoredRoom.x, 0, 'Room x 应该恢复到初始值');
  assert.equal(restoredRoom.width, 4, 'Room width 应该恢复到初始值');

  // 4. 验证重新拖拽并 commitEntityPreview 确认改动落地
  editor.beginEntityPreview('room', 'living');
  editor.updateEntityPreview('room', 'living', { x: 3, z: 3, width: 6, depth: 6 });
  
  await editor.commitEntityPreview('room', 'living');
  const committedRoom = editor.floorplan.floor.rooms.find(r => r.id === 'living');
  assert.equal(committedRoom.x, 3, 'Room x 应该确认落地为 3');
  assert.equal(committedRoom.width, 6, 'Room width 应该确认落地为 6');

  // 5. 验证 Item 预览生命周期
  ok = editor.beginEntityPreview('item', 'chair1');
  assert.equal(ok, true);
  
  editor.updateEntityPreview('item', 'chair1', { x: 2.5, z: 2.5 });
  const liveItem = editor.floorplan.items.find(i => i.id === 'chair1');
  assert.equal(liveItem.x, 2.5);

  editor.cancelEntityPreview('item', 'chair1');
  const restoredItem = editor.floorplan.items.find(i => i.id === 'chair1');
  assert.equal(restoredItem.x, 6);

  // 6. 验证 dispose 接口的健壮性
  editor.dispose();
  assert.ok(true, 'editor.dispose 应该无报错通过');

  engine.dispose();
});
