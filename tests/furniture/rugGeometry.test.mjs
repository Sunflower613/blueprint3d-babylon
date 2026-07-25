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

test('square and oval rugs have correct default materials', () => {
  const square = getFurnitureDefinition('rug');
  const oval = getFurnitureDefinition('oval_rug');
  assert.equal(square.components[0].defaultMaterial?.id, 'fabric-square');
  assert.equal(oval.components[0].defaultMaterial?.id, 'fabric-circle');
});

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
  const topTriangles = [];
  for (let index = 0; index < positions.length / 3; index += 1) {
    assert.ok(Number.isFinite(positions[index * 3]));
  }
  for (let offset = 0; offset < indices.length; offset += 3) {
    const triangle = indices.slice(offset, offset + 3);
    if (triangle.every((index) => Math.abs(positions[index * 3 + 1] - topY) < 1e-6)) {
      topTriangles.push(triangle);
    }
  }
  assert.ok(topTriangles.length > 40, 'concave top is triangulated without a center fan');

  const topEdgeCounts = new Map();
  const topEdgeVertices = new Map();
  for (const triangle of topTriangles) {
    const points = triangle.map((index) => [
      positions[index * 3],
      positions[index * 3 + 1],
      positions[index * 3 + 2]
    ]);
    const ab = points[1].map((value, axis) => value - points[0][axis]);
    const ac = points[2].map((value, axis) => value - points[0][axis]);
    const normalY = ab[2] * ac[0] - ab[0] * ac[2];
    assert.ok(normalY > 1e-10, 'every top triangle must face upward');
    for (const [from, to] of [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[2], triangle[0]]]) {
      const edge = [from, to].sort((a, b) => a - b).join(':');
      topEdgeCounts.set(edge, (topEdgeCounts.get(edge) || 0) + 1);
      topEdgeVertices.set(edge, [from, to]);
    }
  }

  const boundaryEdges = [...topEdgeCounts]
    .filter(([, count]) => count === 1)
    .map(([edge]) => topEdgeVertices.get(edge));
  const adjacency = new Map();
  for (const [a, b] of boundaryEdges) {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  }
  assert.ok([...adjacency.values()].every((neighbors) => neighbors.length === 2));
  const outlineIndices = [];
  let previous = null;
  let current = boundaryEdges[0][0];
  do {
    outlineIndices.push(current);
    const candidates = adjacency.get(current);
    const next = candidates[0] === previous ? candidates[1] : candidates[0];
    previous = current;
    current = next;
  } while (current !== outlineIndices[0] && outlineIndices.length <= boundaryEdges.length);
  assert.equal(outlineIndices.length, boundaryEdges.length);

  const topOutline = outlineIndices.map((index) => [
    positions[index * 3],
    positions[index * 3 + 2]
  ]);
  const pointInPolygon = ([x, z]) => {
    let inside = false;
    for (let index = 0, previousIndex = topOutline.length - 1; index < topOutline.length; previousIndex = index, index += 1) {
      const [xi, zi] = topOutline[index];
      const [xj, zj] = topOutline[previousIndex];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  };
  for (const triangle of topTriangles) {
    const centroid = [0, 2].map((axis) => (
      triangle.reduce((sum, index) => sum + positions[index * 3 + axis], 0) / 3
    ));
    assert.ok(pointInPolygon(centroid), 'top triangle must not bridge across a concave tab shoulder');
  }

  assert.ok(topOutline.some(([x, z]) => Math.abs(Math.abs(z) - 0.5) < 1e-6 && Math.abs(x) < 0.4), 'outline includes outward tabs');
  assert.ok(topOutline.some(([x, z]) => Math.abs(Math.abs(z) - 0.46) < 1e-6 && Math.abs(x) < 0.4), 'outline returns to its square edge');
  const tabDepth = 0.5 - Math.min(...topOutline.filter(([x]) => Math.abs(x) < 0.4).map(([, z]) => Math.abs(z)));
  assert.ok(tabDepth <= 0.05, 'interlocking teeth stay shallow relative to the one metre tile');

  built.scene.dispose();
  built.engine.dispose();
});
