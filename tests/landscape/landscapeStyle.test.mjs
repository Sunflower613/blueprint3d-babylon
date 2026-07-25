import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { FURNITURE_LIST, getFurnitureDefinition, isWaterControllable } from '../../src/furniture/index.js';

function buildLandscape(type) {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const definition = getFurnitureDefinition(type);
  const node = new BABYLON.TransformNode(`test-${type}`, scene);
  const registry = {
    scene,
    add(mesh, options = {}) {
      if (options.parent) mesh.parent = options.parent;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };

  definition.build(registry, { id: `test-${type}`, waterEnabled: true, colors: {}, materials: {} }, node, definition.defaultSize);
  return { engine, scene, definition, meshes: node.getChildMeshes() };
}

test('landscape defaults use the softer low-poly palette', () => {
  const landscape = FURNITURE_LIST.filter((item) => item.category === 'landscape');
  assert.equal(landscape.length, 24);

  const legacyHighSaturationColors = new Set([
    '#00acc1', '#00b0ff', '#00e5ff', '#29b6f6', '#e040fb', '#ff5722'
  ]);
  for (const definition of landscape) {
    for (const component of definition.components) {
      assert.ok(!legacyHighSaturationColors.has(component.defaultColor), `${definition.type}/${component.id} should use the soft palette`);
    }
  }
});

test('featured stones use faceted, non-uniform silhouettes', () => {
  for (const type of ['landscape_taihu_stone', 'landscape_rockery_fountain', 'landscape_natural_spring']) {
    const built = buildLandscape(type);
    const stoneMeshes = built.meshes.filter((mesh) => /stone|rock/.test(mesh.metadata?.blueprintFurnitureComponentId || ''));
    assert.ok(stoneMeshes.length >= 2, `${type} should expose layered stone forms`);
    assert.ok(
      stoneMeshes.some((mesh) => mesh.scaling.x !== mesh.scaling.y || mesh.scaling.y !== mesh.scaling.z),
      `${type} should avoid perfectly round boulders`
    );
    built.scene.dispose();
    built.engine.dispose();
  }
});

test('stepping stones and boundary stream keep compatible component ids with softer geometry', () => {
  const stepping = buildLandscape('landscape_stepping_stones');
  assert.equal(stepping.meshes.length, 5);
  assert.ok(stepping.meshes.every((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'stepping-stone'));
  assert.ok(stepping.meshes.every((mesh) => mesh.scaling.y < mesh.scaling.x));
  stepping.scene.dispose();
  stepping.engine.dispose();

  const stream = buildLandscape('landscape_winding_stream');
  assert.equal(stream.meshes.length, 5);
  assert.ok(stream.meshes.every((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'stream-water'));
  assert.equal(isWaterControllable(stream.definition), false, 'boundary stream must not expose the drain/fill menu');
  stream.scene.dispose();
  stream.engine.dispose();
});
