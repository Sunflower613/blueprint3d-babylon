import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from '@babylonjs/core';
import { createSmoothCameraKeyboardController } from '../../example/js/Hotkeys.js';

function createFrameScheduler() {
  let nextId = 1;
  const callbacks = new Map();
  return {
    requestAnimationFrame(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      callbacks.delete(id);
    },
    step(timestamp) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(timestamp));
    },
    get pendingCount() {
      return callbacks.size;
    }
  };
}

function createController() {
  const scheduler = createFrameScheduler();
  const camera = {
    position: new Vector3(0, 5, -10),
    target: new Vector3(0, 0, 0)
  };
  let panned = false;
  const controller = createSmoothCameraKeyboardController({
    camera,
    BABYLON: { Vector3 },
    getCurrentView: () => '3d',
    setHasUserZoomedOrPanned: (value) => { panned = value; }
  }, {
    ...scheduler,
    window: {},
    pageDocument: {}
  });
  return { scheduler, camera, controller, get panned() { return panned; } };
}

function keyboardEvent(key) {
  return {
    key,
    target: null,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
}

test('ordinary 3D WASD movement uses small frame-based eased steps', () => {
  const fixture = createController();
  const event = keyboardEvent('w');

  assert.equal(fixture.controller.handleKeyDown(event), true);
  assert.equal(event.defaultPrevented, true);
  for (let frame = 0; frame < 8; frame += 1) {
    fixture.scheduler.step(frame * (1000 / 60));
  }

  assert.ok(fixture.camera.target.z > 0, 'holding W should move the camera forward');
  assert.ok(fixture.camera.target.z < 0.2, 'short holds should no longer jump by the old 0.25m step');
  assert.equal(fixture.panned, true);
});

test('holding WASD accelerates from precise movement to fast traversal', () => {
  const fixture = createController();
  fixture.controller.handleKeyDown(keyboardEvent('w'));

  for (let frame = 0; frame < 10; frame += 1) {
    fixture.scheduler.step(frame * (1000 / 60));
  }
  const earlyDistance = fixture.camera.target.z;

  for (let frame = 10; frame < 60; frame += 1) {
    fixture.scheduler.step(frame * (1000 / 60));
  }
  const beforeFastWindow = fixture.camera.target.z;
  for (let frame = 60; frame < 70; frame += 1) {
    fixture.scheduler.step(frame * (1000 / 60));
  }
  const fastDistance = fixture.camera.target.z - beforeFastWindow;

  assert.ok(fastDistance > earlyDistance * 4, 'later frames should cover substantially more distance');
  assert.ok(fastDistance < 1, 'the accelerated speed should remain bounded');
});

test('ordinary 3D WASD movement eases to a stop after keyup', () => {
  const fixture = createController();
  fixture.controller.handleKeyDown(keyboardEvent('d'));
  for (let frame = 0; frame < 12; frame += 1) {
    fixture.scheduler.step(frame * (1000 / 60));
  }

  fixture.controller.handleKeyUp(keyboardEvent('d'));
  const positionAtRelease = fixture.camera.target.x;
  let timestamp = 12 * (1000 / 60);
  for (let frame = 0; frame < 60 && fixture.scheduler.pendingCount > 0; frame += 1) {
    fixture.scheduler.step(timestamp);
    timestamp += 1000 / 60;
  }

  assert.notEqual(fixture.camera.target.x, positionAtRelease, 'deceleration should continue briefly after release');
  assert.equal(fixture.scheduler.pendingCount, 0, 'the animation should stop after velocity settles');
});
