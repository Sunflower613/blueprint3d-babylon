import assert from 'node:assert/strict';
import test from 'node:test';
import { Viewer3D } from '../../example/js/Viewer3D.js';

test('Viewer3D: 渲染、画质预设与反射质量 API 校验', () => {
  const dummyEngine = {
    setHardwareScalingLevel(level) {
      this.scalingLevel = level;
    },
    runRenderLoop() {},
    stopRenderLoop() {},
    dispose() {},
  };
  const dummyScene = {
    activeCamera: null,
    onBeforeRenderObservable: { add() {}, remove() {} },
    onPointerObservable: { add() {}, remove() {} },
    dispose() {},
    getEngine() { return dummyEngine; }
  };

  const viewer = Object.create(Viewer3D.prototype);
  viewer.engine = dummyEngine;
  viewer.scene = dummyScene;

  // 1. 画质预设测试
  viewer.setGraphicsPreset('ultra');
  assert.equal(viewer.graphicsPreset, 'ultra');
  assert.ok(dummyEngine.scalingLevel > 0);

  viewer.setGraphicsPreset('low');
  assert.equal(viewer.graphicsPreset, 'low');
  assert.equal(dummyEngine.scalingLevel, 1 / 0.75);

  // 2. 反射质量档位校验
  viewer.setReflectionQuality('medium');
  assert.equal(viewer.reflectionQuality, 'medium');

  viewer.setReflectionQuality('ultra');
  assert.equal(viewer.reflectionQuality, 'ultra');

  viewer.setReflectionQuality('low');
  assert.equal(viewer.reflectionQuality, 'low');

  // 3. 阴影质量档位校验
  viewer.setShadowQuality('off');
  assert.equal(viewer.shadowQuality, 'off');

  viewer.setShadowQuality('high');
  assert.equal(viewer.shadowQuality, 'high');
});
