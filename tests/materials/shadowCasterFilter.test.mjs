import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { BabylonSceneRenderer, FloorplanDocument } from '../../src/index.js';
import { getShadowCasterContext, shouldIncludeShadowCaster } from '../../src/runtime/shadowCasterFilter.js';

function node(metadata = null, parent = null) {
  return { metadata, parent };
}

test('current-floor furniture remains in the shadow map', () => {
  const furnitureRoot = node({ blueprintItemId: 'chair-1', floorId: 'floor-2' });
  const mesh = node({ blueprintFurnitureComponentId: 'seat' }, furnitureRoot);

  assert.deepEqual(getShadowCasterContext(mesh), { floorId: 'floor-2', isFurniture: true, crossFloorOnly: false });
  assert.equal(shouldIncludeShadowCaster(mesh, 'floor-2'), true);
});

test('furniture on another floor is excluded from the shadow map', () => {
  const furnitureRoot = node({ blueprintItemId: 'chair-1', floorId: 'floor-2' });
  const mesh = node(null, furnitureRoot);

  assert.equal(shouldIncludeShadowCaster(mesh, 'floor-1'), false);
});

test('architectural casters on another floor remain in the shadow map', () => {
  const floorRoot = node({ blueprintRoomId: 'room-2', floorId: 'floor-2' });
  const ceilingMesh = node({ blueprintRoomId: 'room-2', crossFloorShadowOnly: true }, floorRoot);
  const wallRoot = node({ blueprintWallId: 'wall-2', floorId: 'floor-2' });
  const wallMesh = node({ blueprintWallId: 'wall-2' }, wallRoot);

  assert.equal(shouldIncludeShadowCaster(ceilingMesh, 'floor-1'), true);
  assert.equal(shouldIncludeShadowCaster(wallMesh, 'floor-1'), true);
});

test('ceiling skins do not shadow their own floor', () => {
  const floorRoot = node({ blueprintRoomId: 'room-2', floorId: 'floor-2' });
  const ceilingMesh = node({ blueprintRoomId: 'room-2', crossFloorShadowOnly: true }, floorRoot);

  assert.equal(shouldIncludeShadowCaster(ceilingMesh, 'floor-2'), false);
  assert.equal(shouldIncludeShadowCaster(ceilingMesh, 'floor-1'), true);
});

test('floor surfaces only receive shadows while ceiling skins cast them', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const document = new FloorplanDocument({
    unit: 'm',
    currentFloorId: 'floor-1',
    floors: [{ id: 'floor-1', level: 0, floorHeight: 0.1, wallHeight: 2.8 }],
    floor: {
      rooms: [
        { id: 'square-room', floorId: 'floor-1', shape: 'square', x: 0, z: 0, width: 4, depth: 4 },
        { id: 'polygon-room', floorId: 'floor-1', shape: 'l-shape', x: 6, z: 0, width: 4, depth: 4 }
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
  assert.equal(casterNames.has('ceiling_square-room_0'), true);
  assert.equal(casterNames.has('floor_polygon-room_ceiling'), true);
  assert.equal([...casterNames].some((name) => name.startsWith('floor_square-room_')), false);
  assert.equal(casterNames.has('floor_polygon-room_shape'), false);
  assert.equal(scene.getMeshByName('floor_square-room_0').receiveShadows, true);
  assert.equal(scene.getMeshByName('ceiling_square-room_0').metadata.crossFloorShadowOnly, true);
  assert.equal(scene.getTransformNodeByName('floor_square-room').metadata.floorId, 'floor-1');

  renderer.dispose();
  scene.dispose();
  engine.dispose();
});

test('roof fascia and fences cast shadows without receiving them, matching wall faces', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const document = new FloorplanDocument({
    unit: 'm',
    currentFloorId: 'floor-1',
    floors: [{ id: 'floor-1', level: 0, floorHeight: 0.1, wallHeight: 2.8 }],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    roofs: [{
      id: 'roof-1',
      floorId: 'floor-1',
      x: 0,
      z: 0,
      width: 4,
      depth: 4,
      height: 1,
      subtype: 'gable',
      hideFrame: true
    }],
    stairs: [],
    fences: [{
      id: 'fence-1',
      floorId: 'floor-1',
      from: [-2, -3],
      to: [2, -3],
      height: 1,
      thickness: 0.12,
      subtype: 'concrete'
    }],
    fenceGates: []
  });
  const renderer = new BabylonSceneRenderer(scene, document);

  renderer.build();

  assert.equal(scene.getMeshByName('roof_top_roof-1').receiveShadows, true);
  assert.equal(scene.getMeshByName('roof_side_roof-1').receiveShadows, false);

  const fenceMeshes = renderer.fenceNodes.get('fence-1').getChildMeshes(false);
  assert.ok(fenceMeshes.length > 0);
  assert.equal(fenceMeshes.every((mesh) => mesh.receiveShadows === false), true);
  assert.equal(
    fenceMeshes.every((mesh) => renderer.shadowCasters.includes(mesh) || mesh.visibility === 0),
    true
  );

  renderer.dispose();
  scene.dispose();
  engine.dispose();
});
