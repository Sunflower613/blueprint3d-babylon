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

test('irregular and biscuit rugs are registered as metric textile furniture', () => {
  const irregular = getFurnitureDefinition('irregular_rug');
  const biscuit = getFurnitureDefinition('biscuit_rug');
  assert.ok(FURNITURE_LIST.includes(irregular));
  assert.ok(FURNITURE_LIST.includes(biscuit));
  assert.equal(irregular.category, 'textiles');
  assert.equal(biscuit.category, 'textiles');
  assert.equal(biscuit.unit, 'm');
  assert.deepEqual(biscuit.defaultSize, { width: 1, depth: 1, height: 0.01 });
});

test('irregular rug is one closed organic fabric mesh', () => {
  const built = build('irregular_rug');
  assert.equal(built.meshes.length, 1);
  const mesh = built.meshes[0];
  assert.equal(mesh.metadata?.blueprintFurnitureComponentId, 'fabric');
  assert.equal(mesh.metadata?.blueprintItemId, 'irregular_rug-item');

  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  assert.ok(positions.length >= 32 * 3 * 3);
  assert.equal(indices.length % 3, 0);
  assert.ok(indices.every((index) => Number.isInteger(index) && index >= 0 && index < positions.length / 3));

  const positionKey = (index) => [
    positions[index * 3],
    positions[index * 3 + 1],
    positions[index * 3 + 2]
  ].map((value) => value.toFixed(6)).join(':');
  const edgeCounts = new Map();
  for (let offset = 0; offset < indices.length; offset += 3) {
    const triangle = indices.slice(offset, offset + 3);
    const areaVectors = triangle.map((index) => [
      positions[index * 3],
      positions[index * 3 + 1],
      positions[index * 3 + 2]
    ]);
    const ab = areaVectors[1].map((value, axis) => value - areaVectors[0][axis]);
    const ac = areaVectors[2].map((value, axis) => value - areaVectors[0][axis]);
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0]
    ];
    assert.ok(Math.hypot(...cross) > 1e-8, 'mesh must not contain degenerate triangles');

    for (const [from, to] of [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[2], triangle[0]]]) {
      const edge = [positionKey(from), positionKey(to)].sort().join('|');
      edgeCounts.set(edge, (edgeCounts.get(edge) || 0) + 1);
    }
  }
  assert.ok([...edgeCounts.values()].every((count) => count === 2), 'every geometric edge must be closed');

  const bounds = mesh.getBoundingInfo().boundingBox;
  assert.ok(Math.abs((bounds.maximumWorld.x - bounds.minimumWorld.x) - 1.6) < 1e-6);
  assert.ok(Math.abs((bounds.maximumWorld.z - bounds.minimumWorld.z) - 1.2) < 1e-6);
  assert.ok(bounds.maximumWorld.y < 0.02);
  built.scene.dispose();
  built.engine.dispose();
});

test('biscuit rug is one closed puzzle-edged EVA tile mesh', () => {
  const built = build('biscuit_rug');
  assert.equal(built.meshes.length, 1);
  const mesh = built.meshes[0];
  assert.equal(mesh.metadata?.blueprintFurnitureComponentId, 'fabric');
  assert.equal(mesh.metadata?.blueprintItemId, 'biscuit_rug-item');

  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  assert.equal(indices.length % 3, 0);
  assert.ok(indices.every((index) => Number.isInteger(index) && index >= 0 && index < positions.length / 3));

  const positionKey = (index) => [
    positions[index * 3],
    positions[index * 3 + 1],
    positions[index * 3 + 2]
  ].map((value) => value.toFixed(6)).join(':');
  const edgeCounts = new Map();
  for (let offset = 0; offset < indices.length; offset += 3) {
    const triangle = indices.slice(offset, offset + 3);
    const points = triangle.map((index) => [
      positions[index * 3],
      positions[index * 3 + 1],
      positions[index * 3 + 2]
    ]);
    const ab = points[1].map((value, axis) => value - points[0][axis]);
    const ac = points[2].map((value, axis) => value - points[0][axis]);
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0]
    ];
    assert.ok(Math.hypot(...cross) > 1e-8, 'mesh must not contain degenerate triangles');

    for (const [from, to] of [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[2], triangle[0]]]) {
      const edge = [positionKey(from), positionKey(to)].sort().join('|');
      edgeCounts.set(edge, (edgeCounts.get(edge) || 0) + 1);
    }
  }
  assert.ok([...edgeCounts.values()].every((count) => count === 2), 'every geometric edge must be closed');

  const bounds = mesh.getBoundingInfo().boundingBox;
  assert.ok(Math.abs((bounds.maximumWorld.x - bounds.minimumWorld.x) - 1) < 1e-6);
  assert.ok(Math.abs((bounds.maximumWorld.z - bounds.minimumWorld.z) - 1) < 1e-6);
  assert.ok(bounds.maximumWorld.y < 0.02);

  const topY = bounds.maximumWorld.y;
  const topOutline = [];
  for (let index = 0; index < positions.length / 3; index += 1) {
    const x = positions[index * 3];
    const y = positions[index * 3 + 1];
    const z = positions[index * 3 + 2];
    if (Math.abs(y - topY) < 1e-6 && (Math.abs(x) > 1e-6 || Math.abs(z) > 1e-6)) {
      topOutline.push([x, z]);
    }
  }
  assert.ok(topOutline.some(([x, z]) => Math.abs(Math.abs(z) - 0.5) < 1e-6 && Math.abs(x) < 0.4), 'outline includes outward tabs');
  assert.ok(topOutline.some(([x, z]) => Math.abs(Math.abs(z) - 0.38) < 1e-6 && Math.abs(x) < 0.4), 'outline includes recessed sockets');

  built.scene.dispose();
  built.engine.dispose();
});
