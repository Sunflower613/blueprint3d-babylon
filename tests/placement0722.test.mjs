import assert from 'node:assert/strict';
import test from 'node:test';
import { FURNITURE_DEFINITIONS, Topology } from '../src/index.js';
import { EntityManager } from '../example/js/EntityManager.js';

function createManager({ definitions = FURNITURE_DEFINITIONS, items = [], walls = [], openings = [], wallHeight = 2.8 } = {}) {
  const entities = new Map(items.map((item) => [item.id, item]));
  const updates = [];
  const testMap = {
    getFurnitureDefinition: (type) => definitions[type],
    getEntity: (_kind, id) => entities.get(id),
    getEntities: (kind) => kind === 'opening' ? openings : (kind === 'item' ? [...entities.values()] : []),
    getProjectMetadata: () => ({ wallHeight, wallThickness: 0.15 }),
    getRoomAt: () => null,
    syncEntityPreview() {},
    executeCommand(command, payload) {
      if (command === 'addItem') {
        const item = { id: `item-${entities.size + 1}`, ...payload };
        entities.set(item.id, item);
        return item;
      }
      if (command === 'updateItem') {
        updates.push(payload);
        Object.assign(entities.get(payload.itemId), payload.patch);
        return entities.get(payload.itemId);
      }
      return null;
    },
    setSelectedItem() {}
  };

  const manager = new EntityManager({
    testMap,
    getSnapEnabled: () => false,
    getSnapSize: () => 1,
    inchesToWorld: (value) => value / 39.37,
    getWalls: () => walls,
    getRooms: () => [],
    getSelectedItemId: () => null,
    setSelectedItemId() {},
    pushHistory() {},
    refreshShadows() {},
    updateEditor() {},
    renderPlan() {},
    clear3DEditHandles() {},
    onSelectionChanged() {},
    canPlaceOnTable: Topology.canPlaceOnTable,
    findTableBelow: () => null
  });

  return { manager, entities, updates };
}

test('0722：地毯不会吸附到桌面，靠枕仍可放在桌面', () => {
  for (const type of ['rug', 'oval_rug', 'rounded_rug']) {
    assert.equal(Topology.canPlaceOnTable({}, FURNITURE_DEFINITIONS[type]), false, `${type} 不应上桌`);
  }
  assert.equal(Topology.canPlaceOnTable({}, FURNITURE_DEFINITIONS.cushion), true);
});

test('0722：厨房大家电重分类为 appliances 后仍保持贴墙', () => {
  const { manager } = createManager();
  for (const type of ['stove', 'fridge', 'dishwasher', 'range_hood']) {
    assert.equal(manager.shouldSnapToEdge(type), true, `${type} 应贴墙`);
  }
});

test('0722：贴边吸附直接使用米制实例尺寸', () => {
  const result = Topology.calculateSnappedPosition({
    item: { width: 1, depth: 0.6, scale: 1, rotation: 0 },
    definition: { defaultSize: { width: 39.37, depth: 24, height: 36 } },
    x: 0.49,
    z: 0.2,
    snapSize: 1,
    wallThickness: 0.15,
    walls: [],
    shouldSnapToEdge: true,
    inchesToWorld: (value) => value / 39.37
  });

  assert.equal(result.x, 0.5);
  assert.equal(result.z, 0.3);
});

test('0722：新增壁挂家具立即获得安全标高且不会穿过天花板', () => {
  const { manager } = createManager();
  const curtain = manager.addItem('curtain', 0, 0, {});
  const wallAc = manager.addItem('air_conditioner_wall', 0, 0, {});
  const wallShelf = manager.addItem('wall_shelf', 0, 0, {});

  assert.equal(FURNITURE_DEFINITIONS.air_conditioner_wall.placeType, 'wall');
  assert.equal(FURNITURE_DEFINITIONS.wall_shelf.placeType, 'wall');
  assert.ok(curtain.elevation >= 0);
  assert.ok(curtain.elevation + curtain.height <= 2.8 + 1e-9);
  assert.equal(wallAc.elevation, 0.85);
  assert.equal(wallShelf.elevation, 0.85);
});

test('0722：窗帘吸附窗户时按窗顶对齐', () => {
  const wall = { id: 'wall-1', from: [0, 0], to: [4, 0] };
  const opening = { id: 'window-1', type: 'window', wallId: wall.id, t: 0.5, sillHeight: 1.05, height: 0.85 };
  const curtain = {
    id: 'curtain-1', type: 'curtain', floorId: 'floor-1', x: 2, z: 0.1,
    width: 1.2, depth: 0.05, height: 1.5, elevation: 0, scale: 1, rotation: 0
  };
  const { manager, updates } = createManager({ items: [curtain], walls: [wall], openings: [opening] });

  manager.moveItemTo(curtain.id, 2, 0.1, true);

  const patch = updates.at(-1).patch;
  assert.equal(Number(patch.elevation.toFixed(2)), 0.4);
  assert.equal(Number((patch.elevation + curtain.height).toFixed(2)), 1.9);
});

test('0722：修改窗帘高度时保持顶部锚点', () => {
  const curtain = {
    id: 'curtain-1', type: 'curtain', width: 1.2, depth: 0.05,
    height: 1.5, elevation: 0.4, scale: 1, rotation: 0
  };
  const { manager, updates } = createManager({ items: [curtain] });

  manager.updateItemSize(curtain.id, 1.2, 0.05, 1.2, 0.4);

  const patch = updates.at(-1).patch;
  assert.equal(Number(patch.elevation.toFixed(2)), 0.7);
  assert.equal(Number((patch.elevation + patch.height).toFixed(2)), 1.9);
});
