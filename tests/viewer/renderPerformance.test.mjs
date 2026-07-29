import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { Viewer3D, getRenderPerformanceProfile } from '../../example/js/Viewer3D.js';

test('mobile and constrained-memory devices use a cooler render profile', () => {
  const mobile = getRenderPerformanceProfile({
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 15; Mobile)', deviceMemory: 8 },
    matchMedia: () => ({ matches: true })
  });

  assert.equal(mobile.targetFps, 30);
  assert.equal(mobile.hardwareScalingLevel, 1.35);
  assert.equal(mobile.shadowMapSize, 512);
  assert.equal(mobile.shadowBlurKernel, 12);

  const constrainedDesktop = getRenderPerformanceProfile({
    navigator: { userAgent: 'Desktop', deviceMemory: 4 },
    matchMedia: () => ({ matches: false })
  });
  assert.equal(constrainedDesktop.targetFps, 30);
  assert.equal(constrainedDesktop.shadowMapSize, 512);
});

test('desktop devices retain a higher quality profile without rendering at an uncapped 60 fps', () => {
  const desktop = getRenderPerformanceProfile({
    navigator: { userAgent: 'Desktop', deviceMemory: 16 },
    matchMedia: () => ({ matches: false })
  });

  assert.equal(desktop.targetFps, 45);
  assert.equal(desktop.hardwareScalingLevel, 1);
  assert.equal(desktop.shadowMapSize, 1024);
  assert.equal(desktop.shadowBlurKernel, 24);
});

test('reapplying environment materials releases the old sky texture and skips identical refreshes', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const skybox = new BABYLON.PhotoDome(
    'performance_test_sky',
    './src/textures/sky.png',
    { resolution: 8, size: 10 },
    scene
  );
  const viewerLike = {
    scene,
    skybox,
    grassLawn: null,
    hemi: new BABYLON.HemisphericLight('performance_test_hemi', new BABYLON.Vector3(0, 1, 0), scene)
  };

  try {
    const initialTexture = skybox.photoTexture;
    Viewer3D.prototype.setEnvironmentMaterials.call(
      viewerLike,
      { kind: 'color', color: '#112233' },
      null
    );
    const replacementTexture = skybox.photoTexture;

    assert.notEqual(replacementTexture, initialTexture);
    assert.equal(scene.textures.includes(initialTexture), false);
    assert.equal(scene.textures.length, 1);

    Viewer3D.prototype.setEnvironmentMaterials.call(
      viewerLike,
      { kind: 'color', color: '#112233' },
      null
    );
    assert.equal(skybox.photoTexture, replacementTexture);
    assert.equal(scene.textures.length, 1);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
