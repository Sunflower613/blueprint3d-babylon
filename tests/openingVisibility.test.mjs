import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { buildDoorOpening } from '../src/openings/door.js';
import { buildWindowOpening } from '../src/openings/window.js';

function createRegistry(scene) {
  const trim = new BABYLON.StandardMaterial('trim', scene);
  const door = new BABYLON.StandardMaterial('door', scene);
  const window = new BABYLON.StandardMaterial('window', scene);
  return {
    scene,
    materials: { trim, door, window },
    add(node, options = {}) {
      if (options.parent) node.parent = options.parent;
      return node;
    }
  };
}

test('hidden door panel keeps a pickable opening proxy', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const registry = createRegistry(scene);
  const parent = new BABYLON.TransformNode('door-parent', scene);
  buildDoorOpening(registry, {
    id: 'hidden-door', type: 'door', shape: 'pointed-arch', width: 1, height: 2, panelHidden: true
  }, parent);

  assert.equal(scene.meshes.some((mesh) => mesh.name === 'door_panel_hidden-door'), false);
  const proxy = scene.meshes.find((mesh) => mesh.name === 'opening_pick_proxy_hidden-door');
  assert.ok(proxy);
  assert.equal(proxy.isPickable, true);
  assert.equal(proxy.metadata.blueprintOpeningId, 'hidden-door');
  assert.ok(parent.getChildMeshes().some((mesh) => mesh.name.startsWith('opening_frame_hidden-door_')));

  scene.dispose();
  engine.dispose();
});

test('hidden window glass keeps a pickable opening proxy', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const registry = createRegistry(scene);
  const parent = new BABYLON.TransformNode('window-parent', scene);
  buildWindowOpening(registry, {
    id: 'hidden-window', type: 'window', shape: 'circle', width: 1.2, height: 1.2, glassHidden: true
  }, parent);

  assert.equal(scene.meshes.some((mesh) => mesh.name === 'win_glass_hidden-window'), false);
  const proxy = scene.meshes.find((mesh) => mesh.name === 'opening_pick_proxy_hidden-window');
  assert.ok(proxy);
  assert.equal(proxy.isPickable, true);
  assert.equal(proxy.metadata.blueprintOpeningId, 'hidden-window');
  assert.ok(parent.getChildMeshes().some((mesh) => mesh.name.startsWith('opening_frame_hidden-window_')));

  scene.dispose();
  engine.dispose();
});
