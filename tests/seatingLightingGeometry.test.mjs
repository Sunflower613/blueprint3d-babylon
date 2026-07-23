import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';

import { FURNITURE_LIST, getFurnitureDefinition } from '../src/furniture/index.js';

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
    assert.equal(built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'seat').length, 1);
    assert.equal(built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'back').length, 1);
    assert.equal(built.meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'arms').length, 2);
    built.scene.dispose();
    built.engine.dispose();
  }
});

test('straight and arc floor lamps are independently registered and switchable', () => {
  const straight = getFurnitureDefinition('floor_lamp_light');
  const arc = getFurnitureDefinition('arc_floor_lamp_light');
  assert.equal(straight.name, '落地灯');
  assert.equal(arc.name, '弧形落地灯');
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
