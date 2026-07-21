import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { BabylonSceneRenderer } from '../src/runtime/BabylonSceneRenderer.js';

function createRenderer(scene) {
  return new BabylonSceneRenderer(scene, {
    floorplan: {
      floor: { color: '#ffffff', rooms: [] },
      walls: [],
      openings: [],
      roofs: [],
      stairs: [],
      fences: [],
      fenceGates: [],
      items: []
    }
  });
}

test('clearBuiltMeshes releases renderer-owned materials and texture clones', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = createRenderer(scene);

  const node = new BABYLON.TransformNode('item_test', scene);
  node.parent = renderer.root;
  const mesh = BABYLON.MeshBuilder.CreateBox('item_test_mesh', {}, scene);
  mesh.parent = node;
  const texture = BABYLON.RawTexture.CreateRGBTexture(
    new Uint8Array(4 * 4 * 3),
    4,
    4,
    scene,
    false,
    false,
    BABYLON.Texture.NEAREST_SAMPLINGMODE
  );
  const material = new BABYLON.StandardMaterial('item_test_material', scene);
  material.diffuseTexture = texture;
  mesh.material = material;
  renderer.itemNodes.set('test', node);
  renderer.materialCache.set('test', material);

  // Wall groups are tracked by the renderer map even when they are not rooted
  // beneath renderer.root, so their face materials must be collected explicitly.
  const wallNode = new BABYLON.TransformNode('wall_group_test', scene);
  const wallMesh = BABYLON.MeshBuilder.CreateBox('wall_test_mesh', {}, scene);
  wallMesh.parent = wallNode;
  const wallMaterial = new BABYLON.StandardMaterial('wall_test_material', scene);
  wallMesh.material = wallMaterial;
  renderer.wallNodes.set('wall-test', wallNode);

  renderer.clearBuiltMeshes();

  assert.equal(scene.materials.includes(material), false);
  assert.equal(scene.materials.includes(wallMaterial), false);
  assert.equal(scene.textures.includes(texture), false);
  assert.equal(renderer.materialCache.size, 0);
  assert.equal(scene.materials.some((candidate) => candidate.name === 'item_test_material'), false);
  assert.equal(scene.meshes.length, 0);

  renderer.dispose();
  engine.dispose();
});

test('deleteSingleItemNode disposes unique materials but preserves cached shared materials', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = createRenderer(scene);

  const uniqueNode = new BABYLON.TransformNode('item_unique', scene);
  uniqueNode.parent = renderer.root;
  const uniqueMesh = BABYLON.MeshBuilder.CreateBox('item_unique_mesh', {}, scene);
  uniqueMesh.parent = uniqueNode;
  const uniqueMaterial = new BABYLON.StandardMaterial('unique_material', scene);
  uniqueMesh.material = uniqueMaterial;
  renderer.itemNodes.set('unique', uniqueNode);

  const sharedNode = new BABYLON.TransformNode('item_shared', scene);
  sharedNode.parent = renderer.root;
  const sharedMesh = BABYLON.MeshBuilder.CreateBox('item_shared_mesh', {}, scene);
  sharedMesh.parent = sharedNode;
  const sharedMaterial = new BABYLON.StandardMaterial('shared_material', scene);
  sharedMesh.material = sharedMaterial;
  renderer.itemNodes.set('shared', sharedNode);
  renderer.materialCache.set('shared', sharedMaterial);

  renderer.deleteSingleItemNode('unique');
  renderer.deleteSingleItemNode('shared');

  assert.equal(scene.materials.includes(uniqueMaterial), false);
  assert.equal(scene.materials.includes(sharedMaterial), true);

  renderer.dispose();
  engine.dispose();
});
