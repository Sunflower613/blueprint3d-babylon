import assert from 'node:assert/strict';
import test from 'node:test';
import { FURNITURE_DEFINITIONS, Topology } from '../../src/index.js';
import { EntityManager } from '../../example/js/EntityManager.js';

function createTestManager(initialItems = [], options = {}) {
  const entities = new Map(initialItems.map((item) => [item.id, item]));
  const updates = [];
  const testMap = {
    getFurnitureDefinition: (type) => FURNITURE_DEFINITIONS[type],
    getEntity: (_kind, id) => entities.get(id),
    getEntities: (kind) => (kind === 'item' ? [...entities.values()] : []),
    getProjectMetadata: () => ({ wallHeight: 2.8, wallThickness: 0.15 }),
    getRoomAt: options.getRoomAt || (() => null),
    syncEntityPreview() {},
    executeCommand(command, payload) {
      if (command === 'updateItem') {
        updates.push(payload);
        const item = entities.get(payload.itemId);
        if (item) {
          Object.assign(item, payload.patch);
        }
        return item;
      }
      if (command === 'rotateItem') {
        updates.push(payload);
        const item = entities.get(payload.itemId);
        if (item) {
          item.rotation = payload.rotationRadians;
        }
        return item;
      }
      return null;
    }
  };

  const manager = new EntityManager({
    testMap,
    getSnapEnabled: () => false,
    getSnapSize: () => 1,
    inchesToWorld: (value) => value / 39.37,
    getWalls: () => [],
    getRooms: () => [],
    pushHistory() {},
    refreshShadows() {},
    updateEditor() {},
    renderPlan() {},
    clear3DEditHandles() {},
    onSelectionChanged() {},
    canPlaceOnTable: Topology.canPlaceOnTable,
    findTableBelow: (item) => Topology.findTableBelow(
      item,
      [...entities.values()],
      item.floorId || 'floor-1',
      (type) => FURNITURE_DEFINITIONS[type]
    )
  });

  return { manager, entities, updates };
}

test('书架最底层搁板（< 10cm）小物件移动连带测试', () => {
  const shelf = {
    id: 'shelf-1',
    type: 'bookshelf',
    x: 0,
    z: 0,
    elevation: 0,
    rotation: 0,
    scale: 1
  };
  const bottomItem = {
    id: 'apple-bottom',
    type: 'apple',
    x: 0,
    z: 0,
    elevation: 0.05, // 处于 bottomElevation ~ bottomElevation + 0.1m 最底层搁板
    rotation: 0,
    scale: 1
  };

  const { manager, entities } = createTestManager([shelf, bottomItem]);

  // 移动书架位置
  manager.moveItemTo('shelf-1', 5, 5);

  assert.equal(shelf.x, 5);
  assert.equal(shelf.z, 5);
  // 最底层苹果应连带更新到 (5, 5)
  assert.equal(bottomItem.x, 5);
  assert.equal(bottomItem.z, 5);
});

test('桌台移动时桌面以上 0-10cm 的小物件跟随移动测试', () => {
  const deskDef = FURNITURE_DEFINITIONS.table;
  const deskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

  const desk = {
    id: 'desk-1',
    type: deskDef.type,
    x: 10,
    z: 10,
    elevation: 0,
    rotation: 0,
    scale: 1
  };

  // 桌面上的小物件：高度在桌面以上 5cm
  const itemOnDesk = {
    id: 'cup-1',
    type: 'apple',
    x: 10,
    z: 10,
    elevation: deskHeight + 0.05,
    rotation: 0,
    scale: 1
  };

  // 地板上的物品：高度为 0
  const itemOnFloor = {
    id: 'floor-item',
    type: 'apple',
    x: 10,
    z: 10,
    elevation: 0,
    rotation: 0,
    scale: 1
  };

  const { manager } = createTestManager([desk, itemOnDesk, itemOnFloor]);

  // 拖动桌台至 (12, 14)
  manager.moveItemTo('desk-1', 12, 14);

  // 验证桌面上的小物件跟随移动
  assert.equal(itemOnDesk.x, 12);
  assert.equal(itemOnDesk.z, 14);

  // 验证地板上的物品不受影响
  assert.equal(itemOnFloor.x, 10);
  assert.equal(itemOnFloor.z, 10);
});

test('桌台旋转时桌面以上 0-10cm 的小物件跟随旋转测试', () => {
  const deskDef = FURNITURE_DEFINITIONS.table;
  const deskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

  const desk = {
    id: 'desk-2',
    type: deskDef.type,
    x: 0,
    z: 0,
    elevation: 0,
    rotation: 0,
    scale: 1
  };

  const itemOnDesk = {
    id: 'cup-2',
    type: 'apple',
    x: 0.15, // 初始在桌面上
    z: 0,
    elevation: deskHeight + 0.02,
    rotation: 0,
    scale: 1
  };

  const { manager } = createTestManager([desk, itemOnDesk]);

  // 旋转桌台 90 度 (Math.PI / 2)
  manager.updateItemRotation('desk-2', 90);

  // 验证旋转后的相对位置：(0.15, 0) 旋转 90 度后变到 (0, -0.15) 附近
  assert.ok(Math.abs(itemOnDesk.x - 0) < 0.02);
  assert.ok(Math.abs(itemOnDesk.z - (-0.15)) < 0.02);
  assert.ok(Math.abs(itemOnDesk.rotation - (Math.PI / 2)) < 0.001);
});

test('手动调整桌子高度后桌面小物件高度同步上升且保持随动', () => {
  const deskDef = FURNITURE_DEFINITIONS.table;
  const origDeskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

  const desk = {
    id: 'desk-3',
    type: deskDef.type,
    x: 0,
    z: 0,
    elevation: 0,
    rotation: 0,
    scale: 1
  };

  const itemOnDesk = {
    id: 'cup-3',
    type: 'apple',
    x: 0,
    z: 0,
    elevation: origDeskHeight + 0.02,
    rotation: 0,
    scale: 1
  };

  const { manager } = createTestManager([desk, itemOnDesk]);

  // 手动调高桌子高度 0.3 米
  const newHeightMeters = origDeskHeight + 0.3;

  manager.updateItemSize(
    'desk-3',
    deskDef.defaultSize.width,
    deskDef.defaultSize.depth,
    newHeightMeters,
    0
  );

  // 1. 验证桌面上小物件高程同步上升 0.3 米
  assert.ok(Math.abs(itemOnDesk.elevation - (origDeskHeight + 0.32)) < 0.01);

  // 2. 验证调整高度后，再移动桌子时，桌面小物件依然精准随动
  manager.moveItemTo('desk-3', 4, 4);
  assert.equal(itemOnDesk.x, 4);
  assert.equal(itemOnDesk.z, 4);
});

test('手动调整桌子宽度扩大后大桌面上的小物件依然精准随动', () => {
  const deskDef = FURNITURE_DEFINITIONS.table;
  const deskHeight = Topology.getItemSizeInMetres({ type: deskDef.type, scale: 1 }, deskDef).height;

  const desk = {
    id: 'desk-4',
    type: deskDef.type,
    x: 0,
    z: 0,
    elevation: 0,
    rotation: 0,
    scale: 1
  };

  const itemOnDesk = {
    id: 'cup-4',
    type: 'apple',
    x: 0.8, // 放在 0.8m 处
    z: 0,
    elevation: deskHeight + 0.02,
    rotation: 0,
    scale: 1
  };

  const { manager } = createTestManager([desk, itemOnDesk]);

  // 通过 updateItemSize 手动调整桌宽至 2.0m（米）
  manager.updateItemSize(
    'desk-4',
    2.0,
    deskDef.defaultSize.depth,
    deskDef.defaultSize.height,
    0
  );

  // 拖动扩大后的桌子到 (3, 3)
  manager.moveItemTo('desk-4', 3, 3);

  // 验证处于大桌面 0.8m 处的小物件依然随动平移
  assert.equal(itemOnDesk.x, 3.8);
  assert.equal(itemOnDesk.z, 3);
});

test('户外麻将桌提供桌面吸附能力并带动桌面麻将堆移动', () => {
  const tableDef = FURNITURE_DEFINITIONS.outdoor_mahjong_table;
  const pileDef = FURNITURE_DEFINITIONS.outdoor_mahjong_pile;
  const tableHeight = Topology.getItemSizeInMetres({ type: tableDef.type, scale: 1 }, tableDef).height;
  const table = {
    id: 'mahjong-table-1', type: tableDef.type, floorId: 'floor-1',
    x: 1, z: 2, elevation: 0, rotation: 0, scale: 1
  };
  const pile = {
    id: 'mahjong-pile-1', type: pileDef.type, floorId: 'floor-1',
    x: 0, z: 0, elevation: 0, rotation: 0, scale: 1
  };
  const definitions = (type) => FURNITURE_DEFINITIONS[type];

  assert.equal(Topology.isTabletopSurfaceDefinition(tableDef), true);
  assert.equal(Topology.canPlaceOnTable(pile, pileDef), true);
  const pileOnTable = { ...pile, x: 1.1, z: 2, elevation: tableHeight };
  assert.equal(Topology.findTableBelow(pileOnTable, [table, pileOnTable], 'floor-1', definitions)?.id, table.id);
  assert.deepEqual(Topology.getItemsOnTable(table, [table, pileOnTable], definitions).map(({ id }) => id), [pile.id]);

  const { manager } = createTestManager([table, pile], { getRoomAt: () => ({ id: 'room-1' }) });

  manager.moveItemTo(pile.id, 1.1, 2, true);
  assert.equal(pile.elevation, tableHeight, '麻将堆放到桌面后应自动抬升');

  manager.moveItemTo(table.id, 3, 4);
  assert.equal(pile.x, 3.1);
  assert.equal(pile.z, 4);
  assert.equal(pile.elevation, tableHeight);

  manager.updateItemRotation(table.id, 90);
  assert.ok(Math.abs(pile.x - 3) < 0.001);
  assert.ok(Math.abs(pile.z - 3.9) < 0.001);
  assert.ok(Math.abs(pile.rotation - Math.PI / 2) < 0.001);

  manager.updateItemSize(table.id, tableDef.defaultSize.width, tableDef.defaultSize.depth, tableHeight + 0.1, 0);
  assert.ok(Math.abs(pile.elevation - (tableHeight + 0.1)) < 0.001);
});
