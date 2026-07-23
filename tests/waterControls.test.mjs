import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { getFurnitureDefinition, isWaterControllable } from '../src/furniture/index.js';

const waterComponents = new Map([
  ['sink_kitchen', ['water']],
  ['sink_bathroom', ['water']],
  ['bathtub', ['water']],
  ['birdbath', ['water']],
  ['garden_fountain', ['water']],
  ['sink_cabinet', ['water']],
  ['landscape_rockery_aquarium', ['aquarium-water']],
  ['landscape_rockery_fountain', ['water-surface', 'water-cascade']],
  ['landscape_koi_pond', ['pond-water']],
  ['landscape_stone_trough', ['trough-water']],
  ['landscape_cascading_terrace', ['water-curtain']],
  ['landscape_shishi_odoshi', ['basin-water']],
  ['landscape_stream_rockery', ['stream-water']],
  ['landscape_lotus_pond', ['lotus-water']],
  ['landscape_modern_water_wall', ['water-curtain']],
  ['landscape_water_lily_pond', ['pond-water']],
  ['landscape_taiji_pond', ['taiji-black', 'taiji-white']],
  ['landscape_winding_stream', ['stream-water']],
  ['landscape_natural_spring', ['spring-water']],
  ['landscape_old_well', ['well-water']],
  ['landscape_marble_fountain', ['fountain-water']],
  ['landscape_euro_pond_sculpture', ['pond-water']]
]);

function buildComponents(type, waterEnabled) {
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

  definition.build(registry, {
    id: `test-${type}`,
    waterEnabled,
    colors: {},
    materials: {}
  }, node, definition.defaultSize);

  const components = node.getChildMeshes().map((mesh) => mesh.metadata?.blueprintFurnitureComponentId);
  scene.dispose();
  engine.dispose();
  return components;
}

test('the exact water furniture inventory exposes the unified capability', () => {
  assert.equal(waterComponents.size, 22);
  for (const type of waterComponents.keys()) {
    assert.equal(isWaterControllable(getFurnitureDefinition(type)), true, `${type} should expose water controls`);
  }

  for (const type of ['toilet', 'landscape_mist_generator', 'landscape_glass_waterfall', 'water_dispenser']) {
    assert.equal(isWaterControllable(getFurnitureDefinition(type)), false, `${type} must stay outside water controls`);
  }
});

test('waterEnabled=false removes real water meshes from every controllable definition', () => {
  for (const [type, ids] of waterComponents) {
    const enabled = buildComponents(type, true);
    const disabled = buildComponents(type, false);
    const count = (components) => components.filter((id) => ids.includes(id)).length;

    assert.ok(count(enabled) > count(disabled), `${type} should remove at least one water mesh`);
    if (type !== 'landscape_lotus_pond') {
      assert.equal(count(disabled), 0, `${type} should not build water while drained`);
    }
  }
});

test('draining the lotus pond preserves its pool, leaves, and flowers', () => {
  const enabled = buildComponents('landscape_lotus_pond', true);
  const disabled = buildComponents('landscape_lotus_pond', false);
  assert.equal(enabled.filter((id) => id === 'lotus-water').length, 6);
  assert.equal(disabled.filter((id) => id === 'lotus-water').length, 5);
  assert.equal(disabled.filter((id) => id === 'lotus-leaf').length, 4);
  assert.equal(disabled.filter((id) => id === 'lotus-flower').length, 2);
});
