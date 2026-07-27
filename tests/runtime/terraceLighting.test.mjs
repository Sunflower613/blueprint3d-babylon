import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { BabylonSceneRenderer, FloorplanDocument, isNoCeilingRoom } from '../../src/index.js';

test('isNoCeilingRoom correctly identifies terrace/balcony/outdoor rooms', () => {
  assert.equal(isNoCeilingRoom({ name: '城堡二层大露台 Terrace 2F' }), true);
  assert.equal(isNoCeilingRoom({ name: '阳光观景阳台 Balcony' }), true);
  assert.equal(isNoCeilingRoom({ roomType: 'terrace' }), true);
  assert.equal(isNoCeilingRoom({ noCeiling: true }), true);
  assert.equal(isNoCeilingRoom({ isOutdoor: true }), true);
  assert.equal(isNoCeilingRoom({ name: '主卧 Bedroom' }), false);
  assert.equal(isNoCeilingRoom(null), false);
});

test('3D floor meshes generate bottom ceiling skin and natural shadows without hardcoded 2D bounds', () => {
  globalThis.showAllFloors = true;
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const document = new FloorplanDocument({
    unit: 'm',
    currentFloorId: 'floor-1',
    floors: [
      { id: 'floor-1', level: 0, floorHeight: 0.2, wallHeight: 2.8 },
      { id: 'floor-2', level: 1, floorHeight: 0.2, wallHeight: 2.8 }
    ],
    floor: {
      rooms: [
        { id: 'room-1f-living', name: '大客厅', floorId: 'floor-1', shape: 'square', x: 0, z: 0, width: 8, depth: 8 },
        { id: 'room-2f-small-loft', name: '阁楼小包间', floorId: 'floor-2', shape: 'square', x: 0, z: 0, width: 2, depth: 2 },
        { id: 'room-2f-terrace', name: '二层大露台 Terrace 2F', floorId: 'floor-2', shape: 'square', x: 4, z: 0, width: 4, depth: 4 }
      ]
    },
    walls: [],
    openings: [],
    items: [],
    roofs: [],
    stairs: [],
    fences: [],
    fenceGates: []
  });
  const renderer = new BabylonSceneRenderer(scene, document);

  renderer.build();

  const casterNames = new Set(renderer.shadowCasters.map((mesh) => mesh.name));
  
  // 2F 小包间地板仅在其自身的 2x2m 几何下方生成属于它的 bottom ceiling skin
  assert.equal(casterNames.has('ceiling_room-2f-small-loft_0'), true);
  assert.equal(scene.getMeshByName('ceiling_room-2f-small-loft_0') !== null, true);

  // 2F 露台只生成地坪 Mesh，不生成底面衬板 ceiling
  assert.equal(casterNames.has('ceiling_room-2f-terrace_0'), false);
  assert.equal(scene.getMeshByName('ceiling_room-2f-terrace_0'), null);

  renderer.dispose();
  scene.dispose();
  engine.dispose();
  delete globalThis.showAllFloors;
});
