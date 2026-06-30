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

const floorplan = {
  name: 'Layered export test',
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
    { id: 'desk1', type: 'desk', name: 'Desk', floorId: 'upper', x: 2, z: 2, width: 78.74, depth: 39.37, height: 39.37 }
  ],
  stairs: [],
  roofs: [],
  fences: []
};

test('DXF separates floors into architectural layer sets', () => {
  const dxf = stringifyDXF(floorplan);
  for (const layer of [
    'F01-A-WALL', 'F01-A-DOOR', 'F01-A-DIMS', 'F01-A-FURN',
    'F01-A-ROOM-ANNO', 'F01-A-FURN-ANNO', 'F01-A-FLOR-PLNT',
    'F02-A-WALL', 'F02-A-WIND', 'F02-A-DIMS', 'F02-A-FURN',
    'F02-A-ROOM-ANNO', 'F02-A-FURN-ANNO', 'F02-A-FLOR-PLNT'
  ]) {
    assert.match(dxf, new RegExp(`2\\n${layer}\\n`));
  }
  assert.match(dxf, /999\nF01 = Ground/);
  assert.match(dxf, /999\nF02 = Upper/);
});

test('DXF draws architectural wall faces, door swing, windows and dimensions', () => {
  const dxf = stringifyDXF(floorplan);
  assert.match(dxf, /0\nARC\n8\nF01-A-DOOR\n/);
  assert.match(dxf, /8\nF02-A-WIND\n/);
  assert.match(dxf, /8\nF01-A-WALL\n10\n0\n20\n-0\.1\n/);
  assert.match(dxf, /1\n4000\n/);
  assert.match(dxf, /1\n16\.00 \\U\+33A1\n/);
});

test('3MF keeps each floor building and each furniture item as named objects', () => {
  const xml = create3MFModelXml(floorplan);
  assert.match(xml, /name="Building - Ground" partnumber="F01-BUILDING"/);
  assert.match(xml, /name="Building - Upper" partnumber="F02-BUILDING"/);
  assert.match(xml, /name="Furniture - Chair" partnumber="FURNITURE-chair1"/);
  assert.match(xml, /name="Furniture - Desk" partnumber="FURNITURE-desk1"/);
  assert.equal((xml.match(/<object /g) || []).length, 4);
  assert.equal((xml.match(/<item objectid=/g) || []).length, 4);
});

test('3MF respects category filter in options', () => {
  // 仅导出建筑
  const xmlBuilding = create3MFModelXml(floorplan, { category: 'building' });
  assert.match(xmlBuilding, /name="Building - Ground"/);
  assert.match(xmlBuilding, /name="Building - Upper"/);
  assert.doesNotMatch(xmlBuilding, /name="Furniture - Chair"/);
  assert.equal((xmlBuilding.match(/<object /g) || []).length, 2);
  assert.equal((xmlBuilding.match(/<item objectid=/g) || []).length, 2);

  // 仅导出家具
  const xmlFurniture = create3MFModelXml(floorplan, { category: 'furniture' });
  assert.doesNotMatch(xmlFurniture, /name="Building - Ground"/);
  assert.match(xmlFurniture, /name="Furniture - Chair"/);
  assert.match(xmlFurniture, /name="Furniture - Desk"/);
  assert.equal((xmlFurniture.match(/<object /g) || []).length, 2);
  assert.equal((xmlFurniture.match(/<item objectid=/g) || []).length, 2);
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

  const xml = create3MFModelXml(coloredFloorplan, {
    category: 'furniture',
    testMap: { scene: fakeScene }
  });

  // 验证生成的 3MF 确实带有基材且颜色正确（#FF0000CC -> 0.8 alpha 即为 CC）
  assert.match(xml, /<basematerials id="10001">/);
  assert.match(xml, /<base name="mat_0" displaycolor="#FF0000CC"\/>/);
  assert.match(xml, /<triangle v1="0" v2="1" v3="2" pid="10001" p1="0"\/>/);
});

test('3MF walls have physical thickness and door/window void geometry', () => {
  const xml = create3MFModelXml(floorplan);
  const groundBuilding = xml.match(/<object id="1"[\s\S]*?<\/object>/)?.[0] || '';
  const upperBuilding = xml.match(/<object id="2"[\s\S]*?<\/object>/)?.[0] || '';
  assert.match(groundBuilding, /z="-0\.10000"/);
  assert.match(groundBuilding, /z="0\.10000"/);
  assert.match(groundBuilding, /x="0\.50000" y="2\.10000"/);
  assert.equal((groundBuilding.match(/<triangle /g) || []).length, 48);
  assert.equal((upperBuilding.match(/<triangle /g) || []).length, 60);
});

test('3MF exports tenon and mortise joints between floors', () => {
  const multiFloorplan = {
    name: 'Multi floor test',
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

  const xml = create3MFModelXml(multiFloorplan, { enableTenon: true });
  
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

  const xml = create3MFModelXml(testMapPlan, {
    category: 'building',
    testMap: { scene: fakeScene }
  });

  assert.match(xml, /mat_0" displaycolor="#CC8033FF"/);
  assert.match(xml, /mat_1" displaycolor="#33CC33FF"/);
  assert.match(xml, /<triangle v1="0" v2="1" v3="2" pid="10001" p1="0"\/>/);
  assert.match(xml, /<triangle v1="3" v2="4" v3="5" pid="10001" p1="1"\/>/);
});

test('3MF package contains a valid model part', async () => {
  const bytes = create3MFPackage(floorplan);
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
