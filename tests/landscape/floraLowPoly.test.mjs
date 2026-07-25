import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { FURNITURE_LIST } from '../../src/furniture/index.js';
import {
  arecaPalmPlant,
  dwarfMonsteraFurniture,
  monsteraFurniture,
  plantFurniture
} from '../../src/furniture/plants.js';
import {
  landscapeCoconutTree,
  landscapePalmTree,
  landscapeTulipField
} from '../../src/furniture/flora.js';

test('key indoor and landscape plants keep their public component contracts', () => {
  const expectedComponents = new Map([
    [plantFurniture, ['leaf-upper', 'leaf-mid', 'leaf-lower', 'trunk', 'dirt', 'pot']],
    [monsteraFurniture, ['monstera-pot', 'monstera-stem', 'monstera-leaf']],
    [dwarfMonsteraFurniture, ['pot', 'leaves']],
    [arecaPalmPlant, ['areca-pot', 'areca-stems', 'areca-leaves']],
    [landscapeCoconutTree, ['coconut-trunk', 'coconut-leaves']],
    [landscapePalmTree, ['palm-trunk', 'palm-leaves']],
    [landscapeTulipField, ['tulip-leaves', 'tulip-flowers']]
  ]);

  for (const [definition, componentIds] of expectedComponents) {
    assert.equal(typeof definition.build, 'function');
    assert.deepEqual(definition.components.map((component) => component.id), componentIds);
  }
});

test('flora procedural layouts are deterministic and use low-poly geometry', async () => {
  const floraSource = await readFile(new URL('../../src/furniture/flora.js', import.meta.url), 'utf8');
  const plantsSource = await readFile(new URL('../../src/furniture/plants.js', import.meta.url), 'utf8');

  assert.doesNotMatch(floraSource, /Math\.random\s*\(/, 'flora rebuilds must not move plants randomly');
  assert.match(floraSource, /function seededUnit\(/, 'flora should retain deterministic natural variation');
  assert.doesNotMatch(
    `${floraSource}\n${plantsSource}`,
    /(?:segments|tessellation):\s*(?:1[0-9]|[2-9][0-9])\b/,
    'plant primitives should stay at eight radial segments or fewer'
  );
});

test('every plant and flora definition can be instantiated', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const registry = {
    scene,
    add(mesh, options = {}) {
      if (options.parent) mesh.parent = options.parent;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };

  for (const definition of FURNITURE_LIST.filter(({ category }) => category === 'plants' || category === 'flora')) {
    const node = new BABYLON.TransformNode(`test-${definition.type}`, scene);
    assert.doesNotThrow(() => definition.build(registry, {
      id: `test-${definition.type}`,
      colors: {},
      materials: {}
    }, node, definition.defaultSize), definition.type);
    node.dispose(false, true);
  }

  scene.dispose();
  engine.dispose();
});
