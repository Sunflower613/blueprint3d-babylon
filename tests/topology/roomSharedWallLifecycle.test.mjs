import assert from 'node:assert/strict';
import test from 'node:test';
import { FloorplanDocument } from '../../src/index.js';

function createAdjacentRooms() {
  const doc = new FloorplanDocument();
  const roomA = doc.addRoom({
    id: 'room_A',
    x: 0,
    z: 0,
    width: 4,
    depth: 4
  });
  const roomB = doc.addRoom({
    id: 'room_B',
    x: 4,
    z: 0,
    width: 4,
    depth: 4
  });
  const sharedWallId = Object.values(roomA.wallIds).find((wallId) => (
    Object.values(roomB.wallIds).includes(wallId)
  ));

  assert.ok(sharedWallId, 'adjacent rooms should share their common wall');
  return { doc, roomA, roomB, sharedWallId };
}

test('moving a room away detaches it from the old shared wall before deletion', () => {
  const { doc, roomA, roomB, sharedWallId } = createAdjacentRooms();
  const sharedWallBeforeMove = structuredClone(doc.getWall(sharedWallId));

  doc.updateRoom(roomB.id, { x: 12 });

  assert.deepEqual(
    doc.getWall(sharedWallId),
    sharedWallBeforeMove,
    'moving the second room must not move the shared wall'
  );
  assert.ok(
    Object.values(roomA.wallIds).includes(sharedWallId),
    'the room left behind should keep the shared wall'
  );
  assert.ok(
    !Object.values(roomB.wallIds).includes(sharedWallId),
    'the moved room must drop its stale shared-wall reference'
  );
  assert.equal(
    Object.keys(roomB.wallIds).length,
    3,
    'moving away from a shared wall must leave the detached edge open'
  );

  doc.deleteRoom(roomB.id);

  assert.deepEqual(
    doc.getWall(sharedWallId),
    sharedWallBeforeMove,
    'deleting the moved room must not delete the original shared wall'
  );
});

test('deleting a room preserves shared walls and their openings for remaining rooms', () => {
  const { doc, roomA, roomB, sharedWallId } = createAdjacentRooms();
  doc.floorplan.openings.push({
    id: 'shared_door',
    wallId: sharedWallId,
    floorId: roomA.floorId,
    type: 'door'
  });

  assert.equal(doc.getWall(sharedWallId).roomId, roomA.id);
  doc.deleteRoom(roomA.id);

  assert.ok(doc.getWall(sharedWallId), 'a wall referenced by another room must survive deletion');
  assert.equal(
    doc.getWall(sharedWallId).roomId,
    roomB.id,
    'ownership of a preserved shared wall should transfer to a remaining room'
  );
  assert.ok(
    Object.values(roomB.wallIds).includes(sharedWallId),
    'the remaining room should keep its shared-wall reference'
  );
  assert.ok(
    doc.floorplan.openings.some((opening) => opening.id === 'shared_door'),
    'openings on a preserved shared wall must also survive'
  );
});
