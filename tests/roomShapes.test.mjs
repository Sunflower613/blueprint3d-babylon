import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ROOM_SHAPES,
  getRoomVertices,
  getRoomWallKeys,
  pointInRoom,
  triangulateRoom
} from '../src/rooms/index.js';

const EXPECTED_EDGES = {
  square: 4,
  'l-shape': 6,
  circle: 24,
  octagon: 8,
  diamond: 4,
  sector: 12,
  semicircle: 17,
  'right-triangle': 3
};

test('exposes all eight room shapes', () => {
  assert.equal(ROOM_SHAPES.length, 8);
  assert.deepEqual(ROOM_SHAPES.map((shape) => shape.id), Object.keys(EXPECTED_EDGES));
});

for (const shape of ROOM_SHAPES) {
  test(`${shape.id} generates a closed, triangulated room contour`, () => {
    const room = {
      x: 2,
      z: -1,
      width: shape.defaultWidth,
      depth: shape.defaultDepth,
      shape: shape.id
    };
    const vertices = getRoomVertices(room);
    const triangulated = triangulateRoom(room);
    const wallKeys = getRoomWallKeys(room);

    assert.equal(vertices.length, EXPECTED_EDGES[shape.id]);
    assert.equal(wallKeys.length, vertices.length);
    assert.equal(new Set(wallKeys).size, wallKeys.length);
    assert.equal(triangulated.triangles.length, vertices.length - 2);

    const [a, b, c] = triangulated.triangles[0].map((index) => vertices[index]);
    const interiorPoint = {
      x: (a.x + b.x + c.x) / 3,
      z: (a.z + b.z + c.z) / 3
    };
    assert.equal(pointInRoom(room, interiorPoint.x, interiorPoint.z), true);
    assert.equal(pointInRoom(room, room.x + room.width, room.z + room.depth), false);
  });
}
