import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPENING_SHAPES,
  getOpeningVertices,
  normalizeOpeningShape,
  triangulateOpening
} from '../src/openings/openingShapes.js';

const EXPECTED_EDGES = {
  square: 4,
  diamond: 4,
  circle: 24,
  semicircle: 17,
  'round-arch': 15,
  'pointed-arch': 5,
  'quarter-sector': 14,
  'right-triangle': 3
};

test('exposes all eight opening shapes', () => {
  assert.equal(OPENING_SHAPES.length, 8);
  assert.deepEqual(OPENING_SHAPES.map((shape) => shape.id), Object.keys(EXPECTED_EDGES));
  assert.equal(normalizeOpeningShape('unknown'), 'square');
});

for (const shape of OPENING_SHAPES) {
  test(`${shape.id} produces a closed triangulated profile`, () => {
    const opening = { shape: shape.id, width: 1.4, height: 2.1 };
    const vertices = getOpeningVertices(opening);
    const { triangles } = triangulateOpening(opening);
    assert.equal(vertices.length, EXPECTED_EDGES[shape.id]);
    assert.equal(triangles.length, vertices.length - 2);
    assert.ok(vertices.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
    assert.ok(vertices.every((point) => point.x >= -0.7 - 1e-8 && point.x <= 0.7 + 1e-8));
    assert.ok(vertices.every((point) => point.y >= -1e-8 && point.y <= 2.1 + 1e-8));
  });
}
