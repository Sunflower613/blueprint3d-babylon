import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';

import { Blueprint3DTestMap } from '../../src/presets/blueprintTestMap.js';

test('wallpaper UVs remain continuous across the four wall pieces around an opening', async () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const plan = {
    unit: 'm',
    wallThickness: 0.2,
    floorHeight: 0.1,
    currentFloorId: 'floor_1',
    floors: [{ id: 'floor_1', name: '1F', level: 0, wallHeight: 3, floorHeight: 0.1 }],
    floor: { rooms: [] },
    walls: [{
      id: 'wall_1', floorId: 'floor_1', from: [0, 0], to: [4, 0],
      materialFront: { kind: 'texture', category: 'wallpaper', src: 'wallpaper_leaf_bluegrey.jpg', color: '#ffffff' }
    }],
    openings: [{
      id: 'window_1', type: 'window', shape: 'square', floorId: 'floor_1', wallId: 'wall_1',
      t: 0.5, width: 1.2, height: 1, sillHeight: 1
    }],
    items: [], roofs: [], stairs: [], fences: [], fenceGates: []
  };

  const map = new Blueprint3DTestMap(scene, { floorplan: plan });
  await scene.whenReadyAsync();

  try {
    const pieces = scene.meshes.filter((mesh) => (
      mesh.metadata?.blueprintWallId === 'wall_1' &&
      mesh.metadata?.side === 'front' &&
      mesh.metadata?.wallComponent === 'main'
    ));
    assert.equal(pieces.length, 4);

    const spans = pieces.map((mesh) => {
      const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
      mesh.computeWorldMatrix(true);
      const matrix = mesh.getWorldMatrix();
      let minU = Infinity;
      let maxU = -Infinity;

      for (let index = 0; index < positions.length; index += 3) {
        const world = BABYLON.Vector3.TransformCoordinates(
          new BABYLON.Vector3(positions[index], positions[index + 1], positions[index + 2]),
          matrix
        );
        const u = uvs[(index / 3) * 2];
        assert.ok(Math.abs(u - world.x / 4) < 1e-5, `expected u=${u} to match world x=${world.x}`);
        minU = Math.min(minU, u);
        maxU = Math.max(maxU, u);
      }
      return { minU, maxU };
    });

    assert.ok(spans.some(({ maxU }) => maxU < 0.36));
    assert.ok(spans.some(({ minU }) => minU > 0.64));
    assert.ok(spans.some(({ minU, maxU }) => minU < 0.36 && maxU > 0.64));
  } finally {
    map.dispose?.();
    scene.dispose();
    engine.dispose();
  }
});
