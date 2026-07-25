import assert from 'node:assert/strict';
import test from 'node:test';
import { fitBoundsToViewport } from '../../example/js/ViewGeometry.js';

const view = { width: 720, height: 520, pad: 42 };

test('2D view bounds keep equal scale on the X and Z axes', () => {
  const fitted = fitBoundsToViewport(
    { minX: -6.4, maxX: 6.8, minZ: -9.2, maxZ: 4.2 },
    view
  );
  const innerWidth = view.width - view.pad * 2;
  const innerHeight = view.height - view.pad * 2;
  const pixelsPerWorldX = innerWidth / (fitted.maxX - fitted.minX);
  const pixelsPerWorldZ = innerHeight / (fitted.maxZ - fitted.minZ);

  assert.ok(Math.abs(pixelsPerWorldX - pixelsPerWorldZ) < 1e-12);
});

test('fitting expands bounds without moving their center', () => {
  const bounds = { minX: 2, maxX: 12, minZ: -4, maxZ: 0 };
  const fitted = fitBoundsToViewport(bounds, view);

  assert.equal((fitted.minX + fitted.maxX) / 2, 7);
  assert.equal((fitted.minZ + fitted.maxZ) / 2, -2);
  assert.ok(fitted.minX <= bounds.minX && fitted.maxX >= bounds.maxX);
  assert.ok(fitted.minZ <= bounds.minZ && fitted.maxZ >= bounds.maxZ);
});
