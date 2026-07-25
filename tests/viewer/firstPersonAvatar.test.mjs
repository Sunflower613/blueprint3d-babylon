import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import {
  createTemporaryFirstPersonAvatar,
  disposeTemporaryFirstPersonAvatar
} from '../../example/js/FirstPersonController.js';

test('temporary first-person avatar is visible, headless and completely disposable', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const initialMeshes = scene.meshes.length;
  const initialMaterials = scene.materials.length;

  const root = createTemporaryFirstPersonAvatar({ scene, BABYLON }, 'test-avatar', {
    x: 1,
    y: 2,
    z: 3
  });

  assert.deepEqual(root.position.asArray(), [1, 2, 3]);
  assert.equal(root.metadata.isTemporaryFirstPersonAvatar, true);
  assert.equal(scene.materials.length, initialMaterials + 1, 'avatar should share one untextured material');

  const meshes = root.getChildMeshes(false);
  const collider = meshes.find((mesh) => mesh.metadata?.isFirstPersonCollider);
  const visibleParts = meshes.filter((mesh) => mesh.metadata?.isFirstPersonAvatarPart);

  assert.ok(collider, 'independent invisible collider should be retained');
  assert.equal(collider.isVisible, false);
  assert.equal(collider.isPickable, false);
  assert.equal(visibleParts.length, 11, 'low-poly body should use a bounded number of parts');
  assert.ok(visibleParts.every((mesh) => mesh.isVisible && !mesh.isPickable));
  assert.ok(visibleParts.every((mesh) => mesh.material === root.metadata.avatarMaterial));
  assert.ok(meshes.every((mesh) => !mesh.name.includes('head')), 'camera-safe avatar should not create a head mesh');

  disposeTemporaryFirstPersonAvatar(root);

  assert.equal(root.isDisposed(), true);
  assert.equal(scene.meshes.length, initialMeshes, 'all avatar meshes should be released on exit');
  assert.equal(scene.materials.length, initialMaterials, 'avatar material should be released on exit');
  engine.dispose();
});
