import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';

import { FURNITURE_LIST, getFurnitureDefinition } from '../../src/furniture/index.js';

function build(type) {
  const definition = getFurnitureDefinition(type);
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const node = new BABYLON.TransformNode(`${type}-test`, scene);
  const registry = {
    scene,
    materialCache: new Map(),
    add(mesh, options = {}) {
      mesh.parent = options.parent || node;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };
  definition.build(registry, { id: `${type}-item`, colors: {}, materials: {} }, node, definition.defaultSize);
  return { definition, engine, scene, node, meshes: node.getChildMeshes() };
}

test('sofa definitions preserve component IDs and use continuous upholstered bodies', () => {
  for (const type of ['sofa', 'armchair']) {
    const built = build(type);
    const ids = new Set(built.meshes.map((mesh) => mesh.metadata?.blueprintFurnitureComponentId));
    assert.deepEqual(ids, new Set(['seat', 'back', 'arms', 'legs']));
    assert.ok(built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'seat').length >= 1);
    assert.ok(built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'back').length >= 1);
    assert.ok(built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'arms').length >= 2);
    built.scene.dispose();
    built.engine.dispose();
  }
});

test('straight and arc floor lamps are independently registered and switchable', () => {
  const straight = getFurnitureDefinition('floor_lamp_light');
  const arc = getFurnitureDefinition('arc_floor_lamp_light');
  assert.equal(straight.type, 'floor_lamp_light');
  assert.equal(arc.type, 'arc_floor_lamp_light');
  assert.ok(FURNITURE_LIST.includes(arc));
  assert.deepEqual(arc.emissiveComponents, ['glow']);
  assert.equal(arc.lightColorComponent, 'glow');
  assert.equal(arc.category, 'lighting');

  const built = build('arc_floor_lamp_light');
  const poles = built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'pole');
  const shade = built.meshes.find((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'shade');
  assert.ok(poles.length >= 8);
  assert.ok(new Set(poles.map((mesh) => mesh.rotation.z.toFixed(3))).size >= 4);
  assert.ok(shade.position.x > 0, 'shade should hang to the side of the base');
  built.scene.dispose();
  built.engine.dispose();
});

test('wall lantern light and deluxe crystal chandelier are properly registered and built', () => {
  const wallLantern = getFurnitureDefinition('wall_lantern_light');
  const crystalChandelier = getFurnitureDefinition('deluxe_crystal_chandelier');

  assert.equal(wallLantern.type, 'wall_lantern_light');
  assert.equal(wallLantern.placeType, 'wall');
  assert.equal(wallLantern.category, 'lighting');
  assert.equal(wallLantern.components[0].id, 'lantern_shade', 'Representative main component must be first');
  assert.ok(FURNITURE_LIST.includes(wallLantern));

  assert.equal(crystalChandelier.type, 'deluxe_crystal_chandelier');
  assert.equal(crystalChandelier.placeType, 'ceiling');
  assert.equal(crystalChandelier.category, 'lighting');
  assert.equal(crystalChandelier.components[0].id, 'crystals', 'Representative main component must be first');
  assert.ok(FURNITURE_LIST.includes(crystalChandelier));

  const builtLantern = build('wall_lantern_light');
  const lanternShades = builtLantern.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'lantern_shade');
  assert.ok(lanternShades.length >= 2, 'Wall lantern should have multi-layered鼓形 body');
  builtLantern.scene.dispose();
  builtLantern.engine.dispose();

  const builtChandelier = build('deluxe_crystal_chandelier');
  const crystals = builtChandelier.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'crystals');
  const bulbs = builtChandelier.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'bulbs');
  assert.ok(crystals.length >= 7, 'Crystal chandelier should have multiple crystal drop components');
  assert.ok(bulbs.length >= 12, 'Crystal chandelier should have candle lights & flame bulbs');
  builtChandelier.scene.dispose();
  builtChandelier.engine.dispose();
});

test('chinese red lantern is properly registered and built with main component first', () => {
  const redLantern = getFurnitureDefinition('chinese_red_lantern');

  assert.equal(redLantern.type, 'chinese_red_lantern');
  assert.equal(redLantern.placeType, 'ceiling');
  assert.equal(redLantern.category, 'lighting');
  assert.equal(redLantern.components[0].id, 'lantern_body', 'Representative main component must be first');
  assert.ok(FURNITURE_LIST.includes(redLantern));

  const builtLantern = build('chinese_red_lantern');
  const bodies = builtLantern.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'lantern_body');
  const goldTrims = builtLantern.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'gold_trim');
  assert.ok(bodies.length >= 3, 'Red lantern should have 3-layer expanded body');
  assert.ok(goldTrims.length >= 3, 'Red lantern should have gold cloud trim accents');
  builtLantern.scene.dispose();
  builtLantern.engine.dispose();
});



