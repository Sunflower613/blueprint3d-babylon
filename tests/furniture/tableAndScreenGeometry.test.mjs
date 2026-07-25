import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';

import { FURNITURE_LIST } from '../../src/furniture/index.js';

function buildFurniture(scene, type, size) {
  const definition = FURNITURE_LIST.find((item) => item.type === type);
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
  definition.build(registry, { id: `${type}-item`, colors: {}, materials: {} }, node, size);
  return node;
}

test('茶几和边几使用新版多层开放式结构', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  const coffee = buildFurniture(scene, 'coffee_table', { width: 0.71, depth: 0.71, height: 0.46 });
  assert.equal(coffee.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'top').length, 3);
  assert.equal(coffee.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'legs').length, 4);

  const side = buildFurniture(scene, 'side_table', { width: 0.46, depth: 0.46, height: 0.56 });
  assert.equal(side.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'top').length, 3);
  assert.equal(side.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'legs').length, 3);

  scene.dispose();
  engine.dispose();
});

test('木格栅保持疏朗且没有全高背板', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const screen = buildFurniture(scene, 'modern_slat_screen', { width: 1.22, depth: 0.08, height: 1.83 });
  const meshes = screen.getChildMeshes();
  const beams = meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'base');
  const slats = meshes.filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'slats');

  assert.equal(beams.length, 2);
  assert.ok(slats.length >= 8 && slats.length <= 10);
  assert.ok(beams.every((mesh) => mesh.getBoundingInfo().boundingBox.extendSizeWorld.y * 2 < 0.1));

  scene.dispose();
  engine.dispose();
});
