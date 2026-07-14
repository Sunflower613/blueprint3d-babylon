import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { getFurnitureDefinition } from '../src/furniture/index.js';

test('家具名称自动同步升级：当加载存档时，应当根据 type 自动匹配并覆盖更新为最新的定义名称', () => {
  // 1. 获取一个已有的家具定义，比如 type 为 'chair' 的定义
  const chairDef = getFurnitureDefinition('chair');
  assert.ok(chairDef && chairDef.name, '定义中应存在 chair 类型家具且有其名称');

  // 2. 构造一个包含 'chair' 家具的老存档，但设置一个旧名字（与最新定义的名字不同）
  const mockOldFloorplan = {
    name: '老存档同步测试地图',
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面层', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: []
    },
    walls: [],
    openings: [],
    items: [
      {
        id: 'test_chair_1',
        type: 'chair',
        name: '老旧名-椅子', // 旧名字
        floorId: 'ground',
        x: 1,
        z: 1
      }
    ]
  };

  // 3. 实例化 FloorplanDocument
  const doc = new FloorplanDocument(mockOldFloorplan);
  const normalized = doc.floorplan;

  // 4. 验证 item 的名字已经被自动且强制更新为最新的定义名
  const item = normalized.items.find(i => i.id === 'test_chair_1');
  assert.ok(item, '应当存在对应的家具项');
  assert.equal(item.name, chairDef.name, `加载老存档后，家具名称应当自动强制更新为最新定义的名称 "${chairDef.name}"`);
});
