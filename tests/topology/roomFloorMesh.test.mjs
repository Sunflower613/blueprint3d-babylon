import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { BabylonSceneRenderer } from '../../src/runtime/BabylonSceneRenderer.js';
import { pointInRoom, triangulateRoom } from '../../src/rooms/index.js';

const POLYGON_ROOM_SHAPES = [
  'l-shape',
  'circle',
  'octagon',
  'diamond',
  'sector',
  'semicircle',
  'right-triangle'
];

function assertRoomSideNormalsPointOutside(room, mesh) {
  const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
  const { vertices } = triangulateRoom(room);
  const sideVertexOffset = vertices.length * 2;

  vertices.forEach((point, edgeIndex) => {
    const next = vertices[(edgeIndex + 1) % vertices.length];
    const normalOffset = (sideVertexOffset + edgeIndex * 4) * 3;
    const normalX = normals[normalOffset];
    const normalZ = normals[normalOffset + 2];
    const midpointX = (point.x + next.x) / 2;
    const midpointZ = (point.z + next.z) / 2;

    assert.ok(
      !pointInRoom(room, midpointX + normalX * 0.01, midpointZ + normalZ * 0.01),
      `${room.shape} edge ${edgeIndex} normal should point outside the room`
    );
  });
}

test('non-square room floor meshes expose their top face to the camera', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = new BabylonSceneRenderer(scene, { floorplan: { floor: { color: '#d2b48c' } } });
  const group = new BABYLON.TransformNode('room-floor-test-group', scene);

  try {
    POLYGON_ROOM_SHAPES.forEach((shape) => {
      const room = { id: shape, shape, x: 0, z: 0, width: 4, depth: 4 };
      const mesh = renderer.buildRoomPolygonMesh(group, room, renderer.materials.floor, 0.2, 0, 'shape');
      const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
      const topVertexCount = triangulateRoom(room).vertices.length;

      for (let index = 0; index < topVertexCount; index += 1) {
        assert.ok(normals[index * 3 + 1] > 0.99, `${shape} top normal should point upward`);
      }
    });
  } finally {
    renderer.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('non-square room floor meshes expose every side face to exterior views', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = new BabylonSceneRenderer(scene, { floorplan: { floor: { color: '#d2b48c' } } });
  const group = new BABYLON.TransformNode('room-floor-side-test-group', scene);

  try {
    POLYGON_ROOM_SHAPES.forEach((shape) => {
      const room = { id: shape, shape, x: 0, z: 0, width: 4, depth: 4 };
      const mesh = renderer.buildRoomPolygonMesh(group, room, renderer.materials.floor, 0.2, 0, 'shape');
      assertRoomSideNormalsPointOutside(room, mesh);
    });
  } finally {
    renderer.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('room preview geometry keeps non-square side faces exposed after resizing', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = new BabylonSceneRenderer(scene, { floorplan: { floor: { color: '#d2b48c' } } });
  const group = new BABYLON.TransformNode('room-floor-preview-test-group', scene);

  try {
    POLYGON_ROOM_SHAPES.forEach((shape) => {
      const initialRoom = { id: shape, shape, x: 0, z: 0, width: 4, depth: 4 };
      const mesh = renderer.buildRoomPolygonMesh(group, initialRoom, renderer.materials.floor, 0.2, 0, 'shape');
      const resizedRoom = {
        ...initialRoom,
        width: 5,
        depth: 3,
        rotation: 0.2,
        ...(shape === 'l-shape' ? { edgeWidth: 1.5, edgeDepth: 1 } : {})
      };

      renderer._applyRoomPolygonGeometry(mesh, resizedRoom, 0.2, 0);
      assertRoomSideNormalsPointOutside(resizedRoom, mesh);
    });
  } finally {
    renderer.dispose();
    scene.dispose();
    engine.dispose();
  }
});
