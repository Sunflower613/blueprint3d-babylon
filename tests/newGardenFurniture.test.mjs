import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';

import { getFurnitureDefinition } from '../src/furniture/index.js';
import { landscapeGardenRock, landscapeGiantTreeStump } from '../src/furniture/landscape.js';
import { outdoorStoneChessTable, outdoorStoneStool } from '../src/furniture/outdoor.js';

function buildMesh(definition) {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const node = new BABYLON.TransformNode(`${definition.type}-test`, scene);
  const registry = {
    scene,
    materialCache: new Map(),
    add(mesh, options = {}) {
      mesh.parent = options.parent || node;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };

  definition.build(registry, { id: `${definition.type}-item`, colors: {}, materials: {} }, node, definition.defaultSize);
  return { scene, engine, meshes: node.getChildMeshes() };
}

test('new landscape furniture (rock and giant tree stump) are registered correctly', () => {
  assert.equal(landscapeGardenRock.type, 'landscape_garden_rock');
  assert.equal(landscapeGardenRock.name, '石头');
  assert.equal(landscapeGiantTreeStump.type, 'landscape_giant_tree_stump');
  assert.equal(landscapeGiantTreeStump.name, '巨树木墩');

  const rockDef = getFurnitureDefinition('landscape_garden_rock');
  const stumpDef = getFurnitureDefinition('landscape_giant_tree_stump');

  assert.equal(rockDef.category, 'landscape');
  assert.equal(stumpDef.category, 'landscape');

  const builtRock = buildMesh(rockDef);
  assert.ok(builtRock.meshes.length >= 3, 'rock should build multiple boulder meshes');

  const builtStump = buildMesh(stumpDef);
  assert.ok(builtStump.meshes.length >= 4, 'tree stump should build bark, wood, and roots');
});

test('new outdoor furniture (stone chess table and stone stool) are registered correctly', () => {
  assert.equal(outdoorStoneChessTable.type, 'outdoor_stone_chess_table');
  assert.equal(outdoorStoneChessTable.name, '石头象棋桌');
  assert.equal(outdoorStoneStool.type, 'outdoor_stone_stool');
  assert.equal(outdoorStoneStool.name, '石墩子');

  const tableDef = getFurnitureDefinition('outdoor_stone_chess_table');
  const stoolDef = getFurnitureDefinition('outdoor_stone_stool');

  assert.equal(tableDef.category, 'outdoor');
  assert.equal(stoolDef.category, 'outdoor');

  assert.equal(stoolDef.interaction?.type, 'sit');
  assert.ok(stoolDef.interaction.getInteractionPoints(stoolDef.defaultSize).length >= 1);

  const builtTable = buildMesh(tableDef);
  assert.ok(builtTable.meshes.length >= 4, 'chess table should build base, top and chessboard');

  const builtStool = buildMesh(stoolDef);
  assert.ok(builtStool.meshes.length >= 4, 'stone stool should build body, seat and ornament');
});
