import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument, getRoomVertices, getRoomWallKeys } from '../../src/index.js';

function createRoomDocument() {
  return new FloorplanDocument({
    currentFloorId: 'floor_1',
    floors: [{ id: 'floor_1', name: '1F', level: 0 }],
    floor: {
      rooms: [{
        id: 'room_1',
        floorId: 'floor_1',
        shape: 'square',
        x: 0,
        z: 0,
        width: 4,
        depth: 3,
        rotation: 0,
        wallIds: {
          north: 'wall_north',
          east: 'wall_east',
          south: 'wall_south',
          west: 'wall_west'
        }
      }]
    },
    walls: [
      { id: 'wall_north', roomId: 'room_1', floorId: 'floor_1', from: [-2, -1.5], to: [2, -1.5] },
      { id: 'wall_east', roomId: 'room_1', floorId: 'floor_1', from: [2, -1.5], to: [2, 1.5] },
      { id: 'wall_south', roomId: 'room_1', floorId: 'floor_1', from: [2, 1.5], to: [-2, 1.5] },
      { id: 'wall_west', roomId: 'room_1', floorId: 'floor_1', from: [-2, 1.5], to: [-2, -1.5] }
    ],
    openings: [],
    items: []
  });
}

function assertWallsMatchRoom(doc, roomId) {
  const room = doc.getRoom(roomId);
  const vertices = getRoomVertices(room);
  const keys = getRoomWallKeys(room);

  keys.forEach((key, index) => {
    const wall = doc.getWall(room.wallIds[key]);
    const from = vertices[index];
    const to = vertices[(index + 1) % vertices.length];
    assert.deepEqual(wall.from, [
      Number(from.x.toFixed(3)),
      Number(from.z.toFixed(3))
    ], `${key} wall start must follow the room`);
    assert.deepEqual(wall.to, [
      Number(to.x.toFixed(3)),
      Number(to.z.toFixed(3))
    ], `${key} wall end must follow the room`);
  });
}

test('owned walls follow every small room move on both axes', () => {
  const doc = createRoomDocument();

  doc.updateRoom('room_1', { x: 0.1 });
  assertWallsMatchRoom(doc, 'room_1');

  doc.updateRoom('room_1', { x: 0.2 });
  assertWallsMatchRoom(doc, 'room_1');

  doc.updateRoom('room_1', { z: 0.1 });
  assertWallsMatchRoom(doc, 'room_1');
});

test('owned walls follow room rotation and resize exactly', () => {
  const doc = createRoomDocument();

  doc.updateRoom('room_1', {
    x: 0.12,
    z: -0.08,
    width: 4.4,
    depth: 3.2,
    rotation: Math.PI / 8
  });

  assertWallsMatchRoom(doc, 'room_1');
});
