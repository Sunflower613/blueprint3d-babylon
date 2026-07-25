import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { create3MFModelXml } from '../../src/core/threeMfExporter.js';
import { FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';
import { BabylonSceneRenderer } from '../../src/index.js';

test('单位重构：当 floorplan.unit 为 "in"（英寸）时，应当将家具尺寸和高程平滑转换为米制', () => {
  const mockFloorplan = {
    name: '英寸转米测试地图',
    unit: 'in',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面层', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: '客厅', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
      ]
    },
    walls: [],
    openings: [],
    items: [
      {
        id: 'chair_inch',
        type: 'chair',
        name: '英制椅子',
        floorId: 'ground',
        x: 2,
        z: 2,
        width: 39.37,    // 39.37 英寸 = 1 米
        depth: 39.37,    // 39.37 英寸 = 1 米
        height: 78.74,   // 78.74 英寸 = 2 米
        elevation: 19.685 // 19.685 英寸 = 0.5 米
      }
    ]
  };

  const doc = new FloorplanDocument(mockFloorplan);
  const normalized = doc.floorplan;

  // 1. 验证单位已经被统一重置为米制 ('m')
  assert.equal(normalized.unit, 'm', '导入英制文件后，单位应自动转换为 "m"');

  // 2. 验证家具项尺寸和高程是否精确转换为米
  const item = normalized.items.find(i => i.id === 'chair_inch');
  assert.ok(item, '应该找到对应的家具项');
  assert.equal(item.width, 1.0, '宽度应由 39.37 英寸转换为 1.0 米');
  assert.equal(item.depth, 1.0, '深度应由 39.37 英寸转换为 1.0 米');
  assert.equal(item.height, 2.0, '高度应由 78.74 英寸转换为 2.0 米');
  assert.equal(item.elevation, 0.5, '高程应由 19.685 英寸转换为 0.5 米');
});

test('单位重构：当 floorplan.unit 已经是 "m"（米）或未指定时，不应进行多余转换', () => {
  const mockFloorplan = {
    name: '米制测试地图',
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面层', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: '客厅', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
      ]
    },
    walls: [],
    openings: [],
    items: [
      {
        id: 'chair_meter',
        type: 'chair',
        name: '米制椅子',
        floorId: 'ground',
        x: 2,
        z: 2,
        width: 1.2,
        depth: 0.8,
        height: 1.5,
        elevation: 0.3
      }
    ]
  };

  const doc = new FloorplanDocument(mockFloorplan);
  const normalized = doc.floorplan;

  // 1. 验证单位依然是 'm'
  assert.equal(normalized.unit, 'm', '导入米制文件后，单位应保持为 "m"');

  // 2. 验证家具尺寸不应被缩放
  const item = normalized.items.find(i => i.id === 'chair_meter');
  assert.ok(item, '应该找到对应的家具项');
  assert.equal(item.width, 1.2, '宽度应保持 1.2 米不变');
  assert.equal(item.depth, 0.8, '深度应保持 0.8 米不变');
  assert.equal(item.height, 1.5, '高度应保持 1.5 米不变');
  assert.equal(item.elevation, 0.3, '高程应保持 0.3 米不变');
});

test('单位重构：若家具项未指定尺寸，则应自动使用默认英制尺寸并转换为米', () => {
  const mockFloorplan = {
    name: '缺省尺寸测试地图',
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面层', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: '客厅', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
      ]
    },
    walls: [],
    openings: [],
    items: [
      {
        id: 'chair_default',
        type: 'chair', // chair 拥有预设的默认大小（如 width: 24, depth: 24, height: 32）
        name: '默认尺寸椅子',
        floorId: 'ground',
        x: 2,
        z: 2
      }
    ]
  };

  const doc = new FloorplanDocument(mockFloorplan);
  const normalized = doc.floorplan;

  const item = normalized.items.find(i => i.id === 'chair_default');
  assert.ok(item, '应该存在该家具项');
  
  // 验证确实存在填充，且填充数值不为零
  assert.ok(item.width > 0, '宽度应当被自动填充');
  assert.ok(item.depth > 0, '深度应当被自动填充');
  assert.ok(item.height > 0, '高度应当被自动填充');

  // 例如椅子的 defaultSize.width 是 0.45 米 (unit: 'm')
  assert.equal(item.width, 0.45, '默认宽度应当直接使用公制 0.45 米');
});

test('3MF 导出：对于无真实网格的家具，其高程（elevation）不应被二次除以 INCHES_PER_UNIT', () => {
  const mockFloorplan = {
    name: '3MF 导出高程测试地图',
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面层', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: '客厅', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
      ]
    },
    walls: [],
    openings: [],
    items: [
      {
        id: 'non_mesh_item',
        type: 'some_unknown_type', // 未知类型，无真实网格
        name: '无网格家具',
        floorId: 'ground',
        x: 0,
        z: 0,
        width: 1.0,   // 宽 1 米
        depth: 1.0,   // 深 1 米
        height: 1.0,  // 高 1 米
        elevation: 1.5 // 高程 1.5 米
      }
    ]
  };

  const doc = new FloorplanDocument(mockFloorplan);
  const normalized = doc.floorplan;

  // 使用 3MF 导出生成 XML 描述
  const xml = create3MFModelXml(normalized);

  // 如果没有 Bug 且高程没有被二次换算：
  // size.height = 1.0, elevation = 1.5, floorY = 0, roomOffset = 0
  // centerY = floorY + roomOffset + elevation + size.height / 2 = 1.5 + 0.5 = 2.0
  // 顶点的 y 坐标值应该是 cy - height / 2 = 1.5, 以及 cy + height / 2 = 2.5
  // 我们应当在生成的 3MF XML 顶点属性中匹配到 y="2.50000" 或 y="1.50000"
  assert.match(xml, /y="2\.60000"/, '3MF 导出的顶点高度应为 2.60000 米');
  assert.match(xml, /y="1\.60000"/, '3MF 导出的顶点高度应为 1.60000 米');

  // 如果发生了 Bug，高程被二次除以 39.37：
  // centerY = 1.5 / 39.37 + 0.5 = 0.5381
  // 此时顶点的 y 坐标会是 0.03810 和 1.03810，这与 2.50000 / 1.50000 不符。
  assert.doesNotMatch(xml, /y="1\.03810"/, '不应由于 Bug 导致顶点的 Y 坐标在 1.03810 米附近');
});

test('单位重构：若家具定义声明 unit: "m"（米制），当家具项未指定尺寸时应直接使用定义尺寸，不除以 39.37', () => {
  // 1. 临时注册一个米制自定义家具定义
  FURNITURE_DEFINITIONS['custom_meter_chair'] = {
    type: 'custom_meter_chair',
    name: '米制自定义椅',
    unit: 'm',
    defaultSize: { width: 0.6, depth: 0.6, height: 1.1 },
    components: [
      { id: 'seat', label: '座垫', defaultColor: '#ff9dbb' }
    ]
  };

  const mockFloorplan = {
    name: '米制椅子加载测试',
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面层', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: '客厅', floorId: 'ground', x: 0, z: 0, width: 10, depth: 10 }
      ]
    },
    walls: [],
    openings: [],
    items: [
      {
        id: 'meter_chair_instance',
        type: 'custom_meter_chair',
        name: '米制椅子实例',
        floorId: 'ground',
        x: 2,
        z: 2
      }
    ]
  };

  const doc = new FloorplanDocument(mockFloorplan);
  const normalized = doc.floorplan;

  const item = normalized.items.find(i => i.id === 'meter_chair_instance');
  assert.ok(item, '应当存在该家具项');
  assert.equal(item.width, 0.6, '填充默认宽度应精确为 0.6 米');
  assert.equal(item.depth, 0.6, '填充默认深度应精确为 0.6 米');
  assert.equal(item.height, 1.1, '填充默认高度应精确为 1.1 米');
});

test('Babylon 渲染器：若家具定义声明 unit: "m"，其光源位置及范围应直接使用米制，不除以 39.37', () => {
  // 1. 注册米制带灯家具定义
  FURNITURE_DEFINITIONS['custom_meter_light'] = {
    type: 'custom_meter_light',
    name: '米制自定义灯',
    unit: 'm',
    defaultSize: { width: 0.5, depth: 0.5, height: 1.0 },
    lightSource: {
      type: 'point',
      offset: { x: 0.1, y: 0.8, z: 0.2 },
      range: 3.5
    },
    components: [
      { id: 'bulb', label: '灯泡', defaultColor: '#ffffff' }
    ],
    build(registry, item, node, size) {
      // 虚拟构建：不创建复杂 mesh 也可以创建光源
    }
  };

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  // 2. 构造 floorplan 数据
  const mockPlan = {
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
    ],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [
      {
        id: 'meter_light_instance',
        type: 'custom_meter_light',
        floorId: 'ground',
        x: 1.0,
        z: 2.0,
        elevation: 0.0,
        isOn: true
      }
    ]
  };

  // 3. 渲染
  const doc = new FloorplanDocument(mockPlan);
  const renderer = new BabylonSceneRenderer(scene, doc);
  renderer.build();

  // 4. 获取创建的光源并验证其数据
  const light = scene.lights.find(l => l.name === 'item_light_meter_light_instance');
  assert.ok(light, '应该在场景中自动创建对应光源');

  // 5. 校验位置和范围无除以 39.37 的动作
  assert.equal(light.position.x, 0.1, '光源 X 轴偏移应直接为 0.1 米');
  assert.equal(light.position.y, 0.8, '光源 Y 轴偏移应直接为 0.8 米');
  assert.equal(light.position.z, 0.2, '光源 Z 轴偏移应直接为 0.2 米');
  assert.equal(light.range, 3.5, '光源照亮半径应直接为 3.5 米');

  scene.dispose();
  engine.dispose();
});

test('显示所有楼层时可见楼层的灯具都创建真实光源', () => {
  FURNITURE_DEFINITIONS.custom_all_floor_light = {
    type: 'custom_all_floor_light',
    name: '跨层测试灯',
    unit: 'm',
    defaultSize: { width: 0.2, depth: 0.2, height: 0.6 },
    lightSource: { type: 'point', offset: { x: 0, y: 0.5, z: 0 }, range: 3 },
    components: [],
    build() {}
  };
  const plan = {
    unit: 'm', currentFloorId: 'floor_1', floor: { rooms: [] }, walls: [], openings: [], roofs: [], stairs: [], fences: [], fenceGates: [],
    floors: [
      { id: 'floor_1', name: '1F', level: 0, wallHeight: 3, floorHeight: 0.1 },
      { id: 'floor_2', name: '2F', level: 1, wallHeight: 3, floorHeight: 0.1 }
    ],
    items: [
      { id: 'light_1', type: 'custom_all_floor_light', floorId: 'floor_1', x: 0, z: 0, width: 0.2, depth: 0.2, height: 0.6 },
      { id: 'light_2', type: 'custom_all_floor_light', floorId: 'floor_2', x: 0, z: 0, width: 0.2, depth: 0.2, height: 0.6 }
    ]
  };
  const originalWindow = globalThis.window;
  globalThis.window = { showAllFloors: true };
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    const document = new FloorplanDocument(plan);
    const renderer = new BabylonSceneRenderer(scene, document);
    renderer.build();
    assert.ok(scene.getLightByName('item_light_light_1'));
    assert.ok(scene.getLightByName('item_light_light_2'));
    renderer.dispose();
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    delete FURNITURE_DEFINITIONS.custom_all_floor_light;
    scene.dispose();
    engine.dispose();
  }
});
