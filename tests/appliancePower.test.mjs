import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import {
  APPLIANCE_POWER_EFFECTS,
  getFurnitureDefinition,
  isPowerControllable,
  isAppliancePowerOn
} from '../src/furniture/index.js';

const applianceTypes = [
  'air_conditioner_wall',
  'air_conditioner_floor',
  'washing_machine',
  'tv',
  'computer',
  'projector',
  'game_console',
  'smart_speaker',
  'vintage_record_player',
  'stereo_speaker',
  'electric_fan',
  'aroma_diffuser',
  'hair_dryer',
  'fridge',
  'microwave',
  'stove',
  'range_hood',
  'coffee_maker',
  'toaster',
  'electric_kettle',
  'dishwasher',
  'water_dispenser',
  'rice_cooker',
  'air_fryer',
  'blender'
];

test('all appliance and kitchen appliance definitions expose power controls', () => {
  assert.deepEqual(Object.keys(APPLIANCE_POWER_EFFECTS).sort(), [...applianceTypes].sort());

  applianceTypes.forEach((type) => {
    const definition = getFurnitureDefinition(type);
    assert.equal(definition.isSwitchable, true, `${type} should be switchable`);
    assert.equal(isPowerControllable(definition), true, `${type} should expose a power control`);
    assert.equal(definition.powerEffect, APPLIANCE_POWER_EFFECTS[type]);
    assert.ok(definition.powerEffect.label, `${type} should have a power label`);
    assert.ok(definition.powerEffect.glowComponents.length > 0, `${type} should have a visible power effect`);

    const componentIds = new Set(definition.components.map((component) => component.id));
    definition.powerEffect.glowComponents.forEach((componentId) => {
      assert.ok(componentIds.has(componentId), `${type} references missing component ${componentId}`);
    });
  });
});

test('every appliance effect targets at least one mesh that is actually built', () => {
  applianceTypes.forEach((type) => {
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
    const item = { id: `test-${type}`, colors: {}, materials: {} };

    definition.build(registry, item, node, { width: 1, depth: 1, height: 1 });

    const builtComponentIds = new Set(node.getChildMeshes().map((mesh) => mesh.metadata?.blueprintFurnitureComponentId));
    assert.ok(
      definition.powerEffect.glowComponents.some((componentId) => builtComponentIds.has(componentId)),
      `${type} power effect does not target a built mesh`
    );

    scene.dispose();
    engine.dispose();
  });
});

test('music furniture uses the healing melody and remains off by default', () => {
  ['smart_speaker', 'vintage_record_player', 'stereo_speaker'].forEach((type) => {
    const definition = getFurnitureDefinition(type);
    assert.equal(definition.powerEffect.audio, 'healing');
  });
  assert.equal(isAppliancePowerOn({}), false);
  assert.equal(isAppliancePowerOn({ isOn: false }), false);
  assert.equal(isAppliancePowerOn({ isOn: true }), true);
  assert.deepEqual(APPLIANCE_POWER_EFFECTS.vintage_record_player.spinNodes, ['turntable']);
  assert.deepEqual(APPLIANCE_POWER_EFFECTS.stereo_speaker.pulseScaleComponents, ['woofer']);
});
