import * as BABYLON from '@babylonjs/core';
import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import {
  create3MFModelXml,
  create3MFPackage,
  createZipStore,
  stringifyDXF
} from '../src/core/exporters.js';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';

function getNorm(data) {
  return new FloorplanDocument(data).floorplan;
}

const floorplan = {
  name: 'Layered export test',
  unit: 'in',
  wallHeight: 3,
  wallThickness: 0.2,
  floorHeight: 0.1,
  currentFloorId: 'ground',
  floors: [
    { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 },
    { id: 'upper', name: 'Upper', level: 1, wallHeight: 2.8, floorHeight: 0.1 }
  ],
  floor: {
    rooms: [
      { id: 'r1', name: 'Living', floorId: 'ground', x: 2, z: 2, width: 4, depth: 4 },
      { id: 'r2', name: 'Bedroom', floorId: 'upper', x: 2, z: 2, width: 4, depth: 4 }
    ]
  },
  walls: [
    { id: 'w1', floorId: 'ground', from: [0, 0], to: [4, 0] },
    { id: 'w2', floorId: 'upper', from: [0, 0], to: [4, 0] }
  ],
  openings: [
    { id: 'd1', type: 'door', floorId: 'ground', wallId: 'w1', t: 0.25, width: 1, height: 2.1 },
    { id: 'win1', type: 'window', floorId: 'upper', wallId: 'w2', t: 0.5, width: 1.2, height: 1, sillHeight: 0.9 }
  ],
  items: [
    { id: 'chair1', type: 'chair', name: 'Chair', floorId: 'ground', x: 2, z: 2, width: 39.37, depth: 39.37, height: 39.37 },
    { id: 'desk1', type: 'desk', name: 'Desk', floorId: 'upper', x: 2, z: 2, width: 78.74, depth: 39.37, height: 39.37 },
    { id: 'light1', type: 'light', name: 'Ceiling Light', floorId: 'ground', x: 1, z: 2, width: 20, depth: 20, height: 10 },
    { id: 'light2', type: 'light', name: 'Floor Lamp', floorId: 'upper', x: 1, z: 2, width: 20, depth: 20, height: 10 }
  ],
  stairs: [
    { id: 'stair1', floorId: 'ground', x: 1, z: 1, width: 1.2, depth: 3.2, height: 3 }
  ],
  roofs: [],
  fences: [
    { id: 'fence1', floorId: 'ground', from: [0, 1], to: [2, 1], thickness: 0.1, height: 1.1 }
  ],
  fenceGates: [
    { id: 'gate1', floorId: 'ground', fenceId: 'fence1', t: 0.5, width: 1.0, thickness: 0.08 }
  ]
};

test('DXF separates floors into architectural layer sets', () => {
  const dxf = stringifyDXF(getNorm(floorplan));
  for (const layer of [
    'F01-A-WALL', 'F01-A-DOOR', 'F01-A-DIMS', 'F01-A-FURN',
    'F01-A-ROOM-ANNO', 'F01-A-FURN-ANNO', 'F01-A-FLOR-PLNT', 'F01-A-LITE',
    'F02-A-WALL', 'F02-A-WIND', 'F02-A-DIMS', 'F02-A-FURN',
    'F02-A-ROOM-ANNO', 'F02-A-FURN-ANNO', 'F02-A-FLOR-PLNT', 'F02-A-LITE'
  ]) {
    assert.match(dxf, new RegExp(`2\\n${layer}\\n`));
  }
  assert.match(dxf, /999\nF01 = Ground/);
  assert.match(dxf, /999\nF02 = Upper/);
});

test('DXF draws architectural wall faces, door swing, windows and dimensions', () => {
  const dxf = stringifyDXF(getNorm(floorplan));
  assert.match(dxf, /0\nARC\n8\nF01-A-DOOR\n/);
  assert.match(dxf, /8\nF02-A-WIND\n/);
  assert.match(dxf, /8\nF01-A-WALL\n10\n0\n20\n-0\.1\n/);
  assert.match(dxf, /1\n4000\n/);
  assert.match(dxf, /1\n16\.00 \\U\+33A1\n/);
  assert.match(dxf, /0\nCIRCLE\n8\nF01-A-LITE\n/);
});

test('DXF draws double door swing with two arcs and two leaves', () => {
  const doubleDoorFloorplan = {
    name: 'Double door export test',
    unit: 'm',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: []
    },
    walls: [
      { id: 'w1', floorId: 'ground', from: [0, 0], to: [4, 0] }
    ],
    openings: [
      { id: 'd2', type: 'door', floorId: 'ground', wallId: 'w1', t: 0.5, width: 2.0, height: 2.1, doubleDoor: true }
    ],
    items: [],
    stairs: [],
    roofs: [],
    fences: []
  };

  const dxf = stringifyDXF(getNorm(doubleDoorFloorplan));
  // 应当匹配到两个圆弧（由于是双开门，应该有两个 ARC 实体）
  const arcCount = (dxf.match(/0\nARC\n8\nF01-A-DOOR/g) || []).length;
  assert.equal(arcCount, 2);
  
  // 两个圆弧的半径应该是宽度的一半 (2.0 / 2 = 1.0)，在 DXF 中以 40 组码表示，即 40 后面紧跟 1
  assert.match(dxf, /40\n1\n/);
});

test('DXF filters out items snapped to bookshelves or clothing mannequins', () => {
  const customFloorplan = {
    name: 'Snapped items test',
    unit: 'in',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: 'Living', floorId: 'ground', x: 2, z: 2, width: 4, depth: 4 }
      ]
    },
    walls: [],
    openings: [],
    items: [
      // 1. 书架和在其上方的书籍 (应吸附)
      { id: 'bookshelf_1', type: 'test_bookshelf', name: 'Bookshelf', floorId: 'ground', x: 2, z: 2, width: 39.37, depth: 15.74, height: 78.74, elevation: 0, scale: 1 },
      { id: 'book_1', type: 'book', name: 'Book', floorId: 'ground', x: 2.0, z: 2.0, width: 30.0, depth: 30.0, height: 7.87, elevation: 30.0 }, // 处于高度区间内，X/Z 在范围中，且大于0.6m
      { id: 'book_outside', type: 'book', name: 'Book Outside', floorId: 'ground', x: 4.0, z: 4.0, width: 30.0, depth: 30.0, height: 7.87, elevation: 30.0 }, // 不在 X/Z 投影内，不应吸附，且大于0.6m
      
      // 2. 模特人台和在其上的衣服 (应吸附)
      { id: 'mannequin_1', type: 'clothing_mannequin', name: 'Mannequin', floorId: 'ground', x: 1, z: 1, width: 30.0, depth: 30.0, height: 70.86, elevation: 0, scale: 1 },
      { id: 'clothing_tshirt_1', type: 'clothing_tshirt', name: 'T-Shirt', floorId: 'ground', x: 1.01, z: 1.01, width: 30.0, depth: 30.0, height: 19.68, elevation: 40.0 }, // 距离近，高度合规，前缀是 clothing_，且大于0.6m
      { id: 'clothing_shoes_far', type: 'clothing_shoes', name: 'Shoes Far', floorId: 'ground', x: 3.0, z: 3.0, width: 30.0, depth: 30.0, height: 19.68, elevation: 40.0 } // 距离太远，不应吸附，且大于0.6m
    ],
    stairs: [],
    roofs: [],
    fences: []
  };
  
  const dxf = stringifyDXF(getNorm(customFloorplan));
  
  // 书架、不吸附的书籍、模特、不吸附的衣服应当在 DXF 中被导出（存在其名称标签或线段）
  assert.match(dxf, /1\nBookshelf\n/);
  assert.match(dxf, /1\nBook Out\n/);
  assert.match(dxf, /1\nMannequin\n/);
  assert.match(dxf, /1\nShoes Far\n/);
  
  // 被吸附的书籍 "Book" 和被吸附的衣服 "T-Shirt" 应当被跳过，不出现在 DXF 中
  assert.doesNotMatch(dxf, /1\nBook\n/);
  assert.doesNotMatch(dxf, /1\nT-Shirt\n/);
});


test('DXF retains text labels for mini furniture items if they are chairs or mannequins', () => {
  const floorplanWithMiniItems = {
    name: 'Mini items export test',
    unit: 'm',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: {
      rooms: []
    },
    walls: [],
    openings: [],
    items: [
      // 1. 普通微型家具（比如小摆件，尺寸小于 0.6m），应当被过滤掉，不显示文字
      { id: 'book_1', type: 'book', name: 'Mini Decoration', floorId: 'ground', x: 1, z: 1, width: 0.3, depth: 0.3, height: 0.2, elevation: 0, scale: 1 },
      // 2. 属于豁免类的微型椅子（尺寸小于 0.6m），应当保留文字显示
      { id: 'chair_1', type: 'test_chair', name: 'Mini Chair', floorId: 'ground', x: 2, z: 2, width: 0.45, depth: 0.45, height: 0.8, elevation: 0, scale: 1 },
      // 3. 属于豁免类的微型模特人台（尺寸小于 0.6m），应当保留文字显示
      { id: 'mannequin_1', type: 'clothing_mannequin', name: 'Mini Mannequin', floorId: 'ground', x: 3, z: 3, width: 0.4, depth: 0.4, height: 1.7, elevation: 0, scale: 1 }
    ],
    stairs: [],
    roofs: [],
    fences: []
  };

  const dxf = stringifyDXF(getNorm(floorplanWithMiniItems));

  // 普通微型家具应该被过滤，不显示名称 (Mini Decoration 长度为 15，截断后若显示应为 Mini Dec)
  assert.doesNotMatch(dxf, /1\nMini Dec\n/);
  assert.doesNotMatch(dxf, /1\nMini Decoration\n/);
  
  // 核心微型家具 Mini Chair 应当显示其名称 (Mini Chair 长度为 10，不大于 10，不截断)
  assert.match(dxf, /1\nMini Chair\n/);
  
  // 模特人台 Mini Mannequin 应当显示其名称 (Mini Mannequin 长度为 14，大于 10，截取前 8 位为 Mini Man)
  assert.match(dxf, /1\nMini Man\n/);
});


test('3MF keeps each floor building and each furniture item as named objects', () => {
  const xml = create3MFModelXml(getNorm(floorplan));
  assert.match(xml, /name="Building - Ground" partnumber="F01-BUILDING"/);
  assert.match(xml, /name="Building - Upper" partnumber="F02-BUILDING"/);
  assert.match(xml, /name="Furniture - 椅子" partnumber="FURNITURE-chair1"/);
  assert.match(xml, /name="Furniture - 书桌" partnumber="FURNITURE-desk1"/);
  assert.match(xml, /name="Furniture - Ceiling Light" partnumber="FURNITURE-light1"/);
  assert.match(xml, /name="Furniture - Floor Lamp" partnumber="FURNITURE-light2"/);
  assert.match(xml, /name="Furniture - Door - d1" partnumber="FURNITURE-DOOR-d1"/);
  assert.match(xml, /name="Furniture - Stair - stair1" partnumber="FURNITURE-STAIR-stair1"/);
  assert.match(xml, /name="Furniture - Fence - fence1" partnumber="FURNITURE-FENCE-fence1"/);
  assert.match(xml, /name="Furniture - FenceGate - gate1" partnumber="FURNITURE-FENCEGATE-gate1"/);
  assert.equal((xml.match(/<object /g) || []).length, 10);
  assert.equal((xml.match(/<item objectid=/g) || []).length, 10);
});

test('3MF respects category filter in options', () => {
  // 仅导出建筑
  const xmlBuilding = create3MFModelXml(getNorm(floorplan), { category: 'building' });
  assert.match(xmlBuilding, /name="Building - Ground"/);
  assert.match(xmlBuilding, /name="Building - Upper"/);
  assert.doesNotMatch(xmlBuilding, /name="Furniture - 椅子"/);
  assert.doesNotMatch(xmlBuilding, /name="Furniture - Door - d1"/);
  assert.equal((xmlBuilding.match(/<object /g) || []).length, 2);
  assert.equal((xmlBuilding.match(/<item objectid=/g) || []).length, 2);

  // 仅导出家具
  const xmlFurniture = create3MFModelXml(getNorm(floorplan), { category: 'furniture' });
  assert.doesNotMatch(xmlFurniture, /name="Building - Ground"/);
  assert.match(xmlFurniture, /name="Furniture - 椅子"/);
  assert.match(xmlFurniture, /name="Furniture - 书桌"/);
  assert.match(xmlFurniture, /name="Furniture - Ceiling Light"/);
  assert.match(xmlFurniture, /name="Furniture - Floor Lamp"/);
  assert.match(xmlFurniture, /name="Furniture - Door - d1"/);
  assert.match(xmlFurniture, /name="Furniture - Stair - stair1"/);
  assert.match(xmlFurniture, /name="Furniture - Fence - fence1"/);
  assert.match(xmlFurniture, /name="Furniture - FenceGate - gate1"/);
  assert.equal((xmlFurniture.match(/<object /g) || []).length, 8);
  assert.equal((xmlFurniture.match(/<item objectid=/g) || []).length, 8);
});

test('3MF exports pegs and sockets when enableTenon is true for doors and gates', () => {
  const xml = create3MFModelXml(getNorm(floorplan), { enableTenon: true });
  assert.match(xml, /name="Furniture - Door - d1"/);
  assert.match(xml, /name="Furniture - FenceGate - gate1"/);
});

test('3MF exports custom base materials for colored meshes', () => {
  const fakeScene = {
    getNodeByName: () => ({
      getChildMeshes: () => [
        {
          getVerticesData: () => [0, 0, 0, 1, 0, 0, 0, 1, 0],
          getIndices: () => [0, 1, 2],
          getWorldMatrix: () => BABYLON.Matrix.Identity(),
          material: { diffuseColor: { r: 1.0, g: 0.0, b: 0.0 }, alpha: 0.8 }
        }
      ]
    })
  };

  const coloredFloorplan = {
    ...floorplan,
    items: [
      { id: 'chair1', type: 'chair', name: 'Chair', floorId: 'ground', x: 2, z: 2, width: 39.37, depth: 39.37, height: 39.37 }
    ],
    // 留空以防生成过多的建筑结构干扰测试
    floors: [],
    floor: { rooms: [] },
    walls: [],
    openings: []
  };

  const xml = create3MFModelXml(getNorm(coloredFloorplan), {
    category: 'furniture',
    testMap: { scene: fakeScene }
  });

  // 验证生成的 3MF 确实带有基材且颜色正确（#FF0000CC -> 0.8 alpha 即为 CC）
  assert.match(xml, /<basematerials id="10001">/);
  assert.match(xml, /<base name="mat_0" displaycolor="#FF0000CC"\/>/);
  assert.match(xml, /<triangle v1="0" v2="1" v3="2" pid="10001" p1="0"\/>/);
});
test('3MF exports custom colors for doors in both fallback and real mesh scenarios', () => {
  // 1. 测试 fallback 情况下，能正确提取 door.panelMaterial 对象的 color，而不是返回默认棕色 #8D6E63
  const fallbackPlan = {
    name: 'Door Fallback Color Test',
    unit: 'm',
    wallHeight: 3.0,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
    ],
    floor: { rooms: [] },
    walls: [
      { id: 'w1', floorId: 'ground', from: [0, 0], to: [4, 0] }
    ],
    openings: [
      {
        id: 'd1',
        type: 'door',
        floorId: 'ground',
        wallId: 'w1',
        t: 0.5,
        width: 1.0,
        height: 2.1,
        // 自定义材质
        panelMaterial: { id: 'wood_cherry', kind: 'color', color: '#B22222' }
      }
    ],
    items: [],
    stairs: [],
    roofs: [],
    fences: []
  };

  const xmlFallback = create3MFModelXml(getNorm(fallbackPlan), { category: 'furniture' });
  // #B22222 对应的 8 位 hex 应该为 #B22222FF
  assert.match(xmlFallback, /<base name="mat_0" displaycolor="#B22222FF"\/>/);

  // 2. 测试 real mesh 情况下，对于带 metadata.blueprintMaterial 的材质，getColorHex 优先读取 blueprintMaterial.color
  const fakeScene = {
    getNodeByName: () => ({
      getChildMeshes: () => [
        {
          getVerticesData: () => [0, 0, 0, 1, 0, 0, 0, 1, 0],
          getIndices: () => [0, 1, 2],
          getWorldMatrix: () => BABYLON.Matrix.Identity(),
          material: {
            diffuseColor: { r: 0.2, g: 0.1, b: 0.1 }, // 被 scale 了的暗色
            alpha: 1.0,
            metadata: {
              blueprintMaterial: {
                color: '#FF4500' // 原色（亮橙色）
              }
            }
          }
        }
      ]
    })
  };

  const xmlReal = create3MFModelXml(getNorm(fallbackPlan), {
    category: 'furniture',
    testMap: { scene: fakeScene }
  });
  // 应当匹配原始颜色 #FF4500FF 而不是被缩放的漫反射颜色
  assert.match(xmlReal, /<base name="mat_0" displaycolor="#FF4500FF"\/>/);
});

test('3MF walls have physical thickness and door/window void geometry', () => {
  const xml = create3MFModelXml(getNorm(floorplan));
  const groundBuilding = xml.match(/<object id="1"[\s\S]*?<\/object>/)?.[0] || '';
  const upperBuilding = xml.match(/<object id="2"[\s\S]*?<\/object>/)?.[0] || '';
  assert.match(groundBuilding, /z="-0\.10000"/);
  assert.match(groundBuilding, /z="0\.10000"/);
  assert.match(groundBuilding, /x="0\.50000" y="2\.10000"/);
  assert.equal((groundBuilding.match(/<triangle /g) || []).length, 48);
  assert.equal((upperBuilding.match(/<triangle /g) || []).length, 60);
});

test('3MF walls void geometry respects room elevation offset', () => {
  const customFloorplan = {
    name: 'Void elevation offset test',
    unit: 'm',
    wallHeight: 3.0,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: 'Living', floorId: 'ground', x: 2, z: 2, width: 4, depth: 4, elevation: 0.2, wallIds: { north: 'w1' } }
      ]
    },
    walls: [
      { id: 'w1', floorId: 'ground', from: [0, 0], to: [4, 0] }
    ],
    openings: [
      // 房间 elevation 为 0.2m，门的高度 2.1m，所以挖洞实际应该是从 0.2m 开始，到 2.3m。
      // 因为 0.2m 之下会有 0.2m 的抬高门槛，所以墙段顶点会包含 y="0.20000"，顶部墙段会包含 y="2.30000"
      { id: 'd1', type: 'door', floorId: 'ground', wallId: 'w1', t: 0.25, width: 1.0, height: 2.1 }
    ],
    items: [],
    stairs: [],
    roofs: [],
    fences: []
  };

  const xml = create3MFModelXml(getNorm(customFloorplan));
  const buildingObj = xml.match(/<object id="1"[\s\S]*?<\/object>/)?.[0] || '';
  
  // 应当能匹配到门底部被抬高产生的 0.2m 门槛墙和 2.3m 的门头墙顶点
  assert.match(buildingObj, /y="0\.20000"/);
  assert.match(buildingObj, /y="2\.30000"/);
});

test('Wall render height dynamically adapts to floor height changes to eliminate floor gaps', () => {
  const multiFloorplan = {
    name: 'Wall render height test',
    unit: 'm',
    wallHeight: 3.0,
    wallThickness: 0.2,
    floorHeight: 0.06,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3.0, floorHeight: 0.1 },
      { id: 'upper', name: 'Upper', level: 1, wallHeight: 2.8, floorHeight: 0.15 },
      { id: 'top', name: 'Top', level: 2, wallHeight: 2.6, floorHeight: 0.2 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: 'Room1', floorId: 'ground', x: 2, z: 2, width: 4, depth: 4 },
        { id: 'r2', name: 'Room2', floorId: 'upper', x: 2, z: 2, width: 4, depth: 4 },
        { id: 'r3', name: 'Room3', floorId: 'top', x: 2, z: 2, width: 4, depth: 4 }
      ]
    },
    walls: [
      { id: 'w1', floorId: 'ground', from: [0, 0], to: [4, 0] },
      { id: 'w2', floorId: 'upper', from: [0, 0], to: [4, 0] },
      { id: 'w3', floorId: 'top', from: [0, 0], to: [4, 0] }
    ],
    openings: [],
    items: [],
    stairs: [],
    roofs: [],
    fences: []
  };

  const doc = new FloorplanDocument(multiFloorplan);
  
  // 1楼墙体拉伸高度：3.0 + 0.1 - 0.15 = 2.95
  assert.equal(doc.getFloorWallRenderHeight('ground').toFixed(4), '2.9500');
  
  // 2楼墙体拉伸高度：2.8 + 0.15 - 0.2 = 2.75
  assert.equal(doc.getFloorWallRenderHeight('upper').toFixed(4), '2.7500');
  
  // 3楼是顶层，墙体渲染高度为 2.6
  assert.equal(doc.getFloorWallRenderHeight('top').toFixed(4), '2.6000');

  const xml = create3MFModelXml(getNorm(multiFloorplan));
  // 验证在导出的3MF中，2楼的墙体顶点最高处应在 3.1 + 2.75 = 5.85 (其中地坪 3.10)
  // 3楼底板（Building - Top）下底面顶点也在 6.05 - 0.2 = 5.85。它们完美契合，顶点包含 5.85
  assert.match(xml, /y="5\.85000"/);
});


test('3MF exports tenon and mortise joints between floors', () => {
  const multiFloorplan = {
    name: 'Multi floor test',
    unit: 'in',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 },
      { id: 'upper', name: 'Upper', level: 1, wallHeight: 2.8, floorHeight: 0.1 }
    ],
    floor: {
      rooms: [
        { id: 'r1', name: 'Living', floorId: 'ground', x: 2, z: 2, width: 4, depth: 4 },
        { id: 'r2', name: 'Bedroom', floorId: 'upper', x: 2, z: 2, width: 4, depth: 4 }
      ]
    },
    walls: [
      { id: 'w1', floorId: 'ground', from: [0, 0], to: [4, 0] },
      { id: 'w2', floorId: 'upper', from: [0, 0], to: [4, 0] }
    ],
    openings: [],
    items: [],
    stairs: [],
    roofs: [],
    fences: []
  };

  const xml = create3MFModelXml(getNorm(multiFloorplan), { enableTenon: true });
  
  const groundBuilding = xml.match(/<object id="1"[\s\S]*?<\/object>/)?.[0] || '';
  const upperBuilding = xml.match(/<object id="2"[\s\S]*?<\/object>/)?.[0] || '';
  
  assert.match(groundBuilding, /y="3\.08000"/);
  assert.match(groundBuilding, /y="3\.00000"/);
  assert.match(upperBuilding, /y="3\.20000"/);
});

test('3MF exports detailed stairs and fences when testMap is provided', () => {
  const testMapPlan = {
    name: 'Stairs and Fences test',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    stairs: [
      { id: 's1', floorId: 'ground', x: 0, z: 0, width: 1.2, depth: 3.2, height: 3.0, steps: 10, rotation: 0 }
    ],
    fences: [
      { id: 'f1', floorId: 'ground', from: [0, 0], to: [2, 0], height: 1.1, thickness: 0.1 }
    ]
  };

  const fakeMatrix = BABYLON.Matrix.Identity();

  const fakeScene = {
    getNodeByName: (name) => {
      if (name === 'stairs_s1') {
        return {
          getChildMeshes: () => [
            {
              getVerticesData: () => [0, 0, 0, 1, 0, 0, 0, 1, 0],
              getIndices: () => [0, 1, 2],
              getWorldMatrix: () => fakeMatrix,
              material: { diffuseColor: { r: 0.8, g: 0.5, b: 0.2 }, alpha: 1.0 }
            }
          ]
        };
      }
      if (name === 'fence_f1') {
        return {
          getChildMeshes: () => [
            {
              getVerticesData: () => [0, 0, 0, 2, 0, 0, 0, 2, 0],
              getIndices: () => [0, 1, 2],
              getWorldMatrix: () => fakeMatrix,
              material: { diffuseColor: { r: 0.2, g: 0.8, b: 0.2 }, alpha: 1.0 }
            }
          ]
        };
      }
      return null;
    }
  };

  const xml = create3MFModelXml(getNorm(testMapPlan), {
    testMap: { scene: fakeScene }
  });

  assert.match(xml, /mat_0" displaycolor="#CC8033FF"/);
  assert.match(xml, /mat_0" displaycolor="#33CC33FF"/);
  assert.match(xml, /<triangle v1="0" v2="1" v3="2" pid="10001" p1="0"\/>/);
  assert.match(xml, /<triangle v1="0" v2="1" v3="2" pid="10002" p1="0"\/>/);
});

test('3MF package contains a valid model part', async () => {
  const bytes = create3MFPackage(getNorm(floorplan));
  assert.deepEqual(Array.from(bytes.slice(0, 2)), [0x50, 0x4b]);
  const zip = await JSZip.loadAsync(bytes);
  const model = await zip.file('3D/3dmodel.model').async('string');
  assert.match(model, /Building - Ground/);
  assert.ok(zip.file('[Content_Types].xml'));
  assert.ok(zip.file('_rels/.rels'));
});

test('ZIP writer handles model data larger than the browser argument limit', async () => {
  const payload = new Uint8Array(2_000_000);
  payload.fill(0x5a);
  const bytes = createZipStore([{ name: 'large-model.bin', data: payload }]);
  const zip = await JSZip.loadAsync(bytes);
  const restored = await zip.file('large-model.bin').async('uint8array');
  assert.equal(restored.length, payload.length);
  assert.equal(restored[0], 0x5a);
  assert.equal(restored.at(-1), 0x5a);
});

test('3MF 导出：验证能够正常导出屋顶（Roofs）与栅栏门（Fence Gates）', () => {
  const plan = {
    name: 'Roofs and Gates Test',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    stairs: [],
    roofs: [
      { id: 'roof_1', floorId: 'ground', x: 2, z: 2, width: 6, depth: 6, height: 1.5, type: 'gable', color: '#b75b54' }
    ],
    fences: [],
    fenceGates: [
      { id: 'gate_1', floorId: 'ground', from: [0, 0], to: [1, 0], width: 1.0, height: 1.1, thickness: 0.08, subtype: 'picket_wood' }
    ]
  };

  const xml = create3MFModelXml(getNorm(plan));
  assert.match(xml, /Building - Ground/);
  assert.match(xml, /<triangle /);
});

test('3MF 导出：验证屋顶与大门的榫卯结构生成（enableTenon: true）', () => {
  const plan = {
    name: 'Roofs and Gates Tenon Test',
    wallHeight: 3,
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: 'Ground', level: 0, wallHeight: 3, floorHeight: 0.1 }
    ],
    floor: { rooms: [] },
    walls: [
      { id: 'w1', floorId: 'ground', from: [1, 2], to: [3, 2], thickness: 0.2 }
    ],
    openings: [],
    items: [],
    stairs: [],
    roofs: [
      { id: 'roof_1', floorId: 'ground', x: 2, z: 2, width: 6, depth: 6, height: 1.5, type: 'gable', color: '#b75b54' }
    ],
    fences: [],
    fenceGates: [
      { id: 'gate_1', floorId: 'ground', from: [0, 0], to: [1, 0], width: 1.0, height: 1.1, thickness: 0.08, subtype: 'picket_wood' }
    ]
  };

  const xml = create3MFModelXml(getNorm(plan), { enableTenon: true });
  assert.match(xml, /Building - Ground/);
  assert.match(xml, /<triangle /);
});
