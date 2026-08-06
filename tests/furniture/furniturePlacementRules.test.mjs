import assert from 'node:assert/strict';
import test from 'node:test';
import { FURNITURE_DEFINITIONS, Topology, pointInRoom } from '../../src/index.js';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { EntityManager } from '../../example/js/EntityManager.js';

function createManager({ definitions = FURNITURE_DEFINITIONS, items = [], walls = [], openings = [], rooms = [], wallHeight = 2.8, snapEnabled = false, snapSize = 1 } = {}) {
  const entities = new Map(items.map((item) => [item.id, item]));
  const updates = [];
  const testMap = {
    getFurnitureDefinition: (type) => definitions[type],
    getEntity: (_kind, id) => entities.get(id),
    getEntities: (kind) => kind === 'opening' ? openings : (kind === 'item' ? [...entities.values()] : []),
    getProjectMetadata: () => ({ wallHeight, wallThickness: 0.15 }),
    getRoomAt: (x, z) => rooms.find((room) => pointInRoom(room, x, z)) || null,
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
    getSnapEnabled: () => snapEnabled,
    getSnapSize: () => snapSize,
    inchesToWorld: (value) => value / 39.37,
    getWalls: () => walls,
    getRooms: () => rooms,
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

test('地毯不会吸附到桌面，靠枕仍可放在桌面', () => {
  for (const type of ['rug', 'oval_rug', 'rounded_rug', 'irregular_rug', 'biscuit_rug']) {
    assert.equal(Topology.canPlaceOnTable({}, FURNITURE_DEFINITIONS[type]), false, `${type} 不应上桌`);
  }
  assert.equal(Topology.canPlaceOnTable({}, FURNITURE_DEFINITIONS.cushion), true);
});

test('厨房柜体和大家电保持贴墙', () => {
  const { manager } = createManager();
  for (const type of ['stove', 'fridge', 'dishwasher', 'range_hood', 'sink_cabinet']) {
    assert.equal(manager.shouldSnapToEdge(type), true, `${type} 应贴墙`);
  }
});

test('贴边吸附直接使用米制实例尺寸', () => {
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

test('新增壁挂家具立即获得安全标高且不会穿过天花板', () => {
  const { manager } = createManager();
  const curtain = manager.addItem('curtain', 0, 0, {});
  const wallAc = manager.addItem('air_conditioner_wall', 0, 0, {});
  const wallShelf = manager.addItem('wall_shelf', 0, 0, {});
  const bedsideDesk = manager.addItem('bedside_desk', 0, 0, {});

  assert.equal(FURNITURE_DEFINITIONS.air_conditioner_wall.placeType, 'wall');
  assert.equal(FURNITURE_DEFINITIONS.wall_shelf.placeType, 'wall');
  assert.equal(FURNITURE_DEFINITIONS.bedside_desk.placeType, 'wall');
  assert.ok(curtain.elevation >= 0);
  assert.ok(curtain.elevation + curtain.height <= 2.8 + 1e-9);
  assert.equal(wallAc.elevation, 0.85);
  assert.equal(wallShelf.elevation, 0.85);
  assert.ok(bedsideDesk.elevation > 0);
});

test('窗帘移动时离地默认保持 0 贴地', () => {
  const wall = { id: 'wall-1', from: [0, 0], to: [4, 0] };
  const opening = { id: 'window-1', type: 'window', wallId: wall.id, t: 0.5, sillHeight: 1.05, height: 0.85 };
  const curtain = {
    id: 'curtain-1', type: 'curtain', floorId: 'floor-1', x: 2, z: 0.1,
    width: 1.2, depth: 0.05, height: 1.5, elevation: 0, scale: 1, rotation: 0
  };
  const { manager, updates } = createManager({ items: [curtain], walls: [wall], openings: [opening] });

  manager.moveItemTo(curtain.id, 2, 0.1, true);

  const patch = updates.at(-1).patch;
  const currentElevation = patch.elevation ?? curtain.elevation;
  assert.equal(currentElevation, 0);
});

test('修改窗帘高度时保持顶部锚点', () => {
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

test('0723: curtains use half-cell wall movement and stay on the room-facing side', () => {
  const room = {
    id: 'room-1', floorId: 'floor-1', x: 2, z: 2,
    width: 4, depth: 4, rotation: 0, shape: 'square'
  };
  const wall = { id: 'wall-1', floorId: 'floor-1', from: [0, 0], to: [4, 0] };
  const curtain = {
    id: 'curtain-1', type: 'curtain', floorId: 'floor-1', roomId: 'room-1',
    x: 2, z: 0.1, width: 1.2, depth: 0.05, height: 1.5,
    elevation: 0.4, scale: 1, rotation: 0
  };
  const { manager, updates } = createManager({
    items: [curtain], walls: [wall], rooms: [room], snapEnabled: true, snapSize: 1
  });

  manager.moveItemTo(curtain.id, 1.1, -0.25, true);

  const patch = updates.at(-1).patch;
  assert.equal(patch.x, 1, 'curtain center should move in half-cell increments along the wall');
  assert.equal(Number(patch.z.toFixed(3)), 0.102, 'curtain should be offset fully inside the room');
  assert.equal(patch.roomId, room.id);
});

test('3D wall hint prevents wall furniture from snapping to a wall behind the pointer target', () => {
  const frontWall = { id: 'front-wall', from: [0, 0], to: [4, 0] };
  const backWall = { id: 'back-wall', from: [0, 3], to: [4, 3] };
  const shelf = {
    id: 'shelf-1', type: 'wall_shelf', x: 2, z: 0.2,
    width: 0.8, depth: 0.2, height: 0.25, elevation: 0.85, scale: 1
  };
  const { manager, updates } = createManager({ items: [shelf], walls: [frontWall, backWall] });

  manager.moveItemTo(shelf.id, 2, 10, false, { wallId: frontWall.id, side: -1 });

  const patch = updates.at(-1).patch;
  assert.equal(patch.wallId, frontWall.id);
  assert.ok(patch.z < 0, 'furniture should remain on the camera-facing side of the front wall');
});

test('0723: moving floor furniture outdoors clears room ownership and grounds it', () => {
  const room = {
    id: 'room-1', floorId: 'floor-1', x: 0, z: 0,
    width: 4, depth: 4, rotation: 0, shape: 'square'
  };
  const sofa = {
    id: 'sofa-1', type: 'sofa', floorId: 'floor-1', roomId: room.id,
    x: 0, z: 0, width: 2, depth: 0.9, height: 0.8,
    elevation: 0.7, scale: 1, rotation: 0
  };
  const { manager, updates } = createManager({ items: [sofa], rooms: [room] });

  manager.moveItemTo(sofa.id, 10, 10, true);

  const patch = updates.at(-1).patch;
  assert.equal(patch.roomId, null);
  assert.equal(patch.elevation, 0);
});

test('0723: legacy outdoor floor furniture is normalized to an unassigned grounded item', () => {
  const document = new FloorplanDocument({
    unit: 'm', currentFloorId: 'floor-1', wallHeight: 2.8, floorHeight: 0.2,
    floors: [{ id: 'floor-1', name: '1F', level: 0 }],
    floor: {
      rooms: [{
        id: 'room-1', floorId: 'floor-1', x: 0, z: 0,
        width: 4, depth: 4, rotation: 0, shape: 'square'
      }]
    },
    walls: [], openings: [], roofs: [], stairs: [], fences: [], fenceGates: [],
    items: [{
      id: 'chair-1', type: 'chair', floorId: 'floor-1', roomId: 'room-1',
      x: 8, z: 8, elevation: 0.75
    }]
  });

  const item = document.floorplan.items[0];
  assert.equal(item.roomId, null);
  assert.equal(item.elevation, 0);
});

test('悬浮搁板 (bedside_desk) 可被识别为下方支持台面并抬升小家具', () => {
  const bedsideDesk = {
    id: 'shelf-1', type: 'bedside_desk', floorId: 'floor-1',
    x: 1, z: 1, elevation: 1.2, width: 1, depth: 0.35, height: 0.05
  };
  const smallItem = {
    id: 'cup-1', type: 'cushion', floorId: 'floor-1',
    x: 1, z: 1, elevation: 0
  };

  const getDef = (type) => FURNITURE_DEFINITIONS[type];
  const tableBelow = Topology.findTableBelow(smallItem, [bedsideDesk, smallItem], 'floor-1', getDef);

  assert.ok(tableBelow);
  assert.equal(tableBelow.id, 'shelf-1');
});

test('相同 (X,Z) 坐标下多层悬浮搁板根据 Y 轴上下阈值智能匹配最贴近的搁板', () => {
  const shelfLower = {
    id: 'shelf-lower', type: 'bedside_desk', floorId: 'floor-1',
    x: 1, z: 1, elevation: 0.8, width: 1, depth: 0.35, height: 0.05
  };
  const shelfUpper = {
    id: 'shelf-upper', type: 'bedside_desk', floorId: 'floor-1',
    x: 1, z: 1, elevation: 1.6, width: 1, depth: 0.35, height: 0.05
  };
  const getDef = (type) => FURNITURE_DEFINITIONS[type];

  // 1. 小家具在 lower (0.8m) 附近 -> 应匹配 shelf-lower
  const itemNearLower = { id: 'cup-1', type: 'cushion', floorId: 'floor-1', x: 1, z: 1, elevation: 0.8 };
  const matchedLower = Topology.findTableBelow(itemNearLower, [shelfLower, shelfUpper, itemNearLower], 'floor-1', getDef);
  assert.equal(matchedLower.id, 'shelf-lower');

  // 2. 小家具在 upper (1.6m) 附近 -> 应匹配 shelf-upper
  const itemNearUpper = { id: 'cup-2', type: 'cushion', floorId: 'floor-1', x: 1, z: 1, elevation: 1.6 };
  const matchedUpper = Topology.findTableBelow(itemNearUpper, [shelfLower, shelfUpper, itemNearUpper], 'floor-1', getDef);
  assert.equal(matchedUpper.id, 'shelf-upper');
});
