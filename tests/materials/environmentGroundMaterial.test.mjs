import * as BABYLON from '@babylonjs/core';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlueprintMaterial } from '../../src/index.js';

test('天空盒地面使用 createBlueprintMaterial 创建玻璃材质并保持半透明效果', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    // 1. 玻璃材质描述符测试
    const glassDescriptor = {
      kind: 'glass',
      color: '#88ccff',
      alpha: 0.35
    };

    const glassMat = createBlueprintMaterial(scene, 'ground_glass_test', glassDescriptor, {
      isFloor: true,
      isEnvironmentGround: true,
      surfaceWidth: 120,
      surfaceHeight: 120
    });

    assert.ok(glassMat, '创建出的地面玻璃材质实例应该有效');
    assert.equal(glassMat.alpha, 0.35, '地面玻璃材质应当应用设置的 alpha 透明度 0.35');
    assert.equal(glassMat.backFaceCulling, false, '地面玻璃材质应当禁用背面剔除');
    assert.equal(glassMat.twoSidedLighting, true, '地面玻璃材质应当启用双面光照');

    // 2. 带 alpha 的纯色描述符测试
    const transparentColorDesc = {
      kind: 'color',
      color: '#00ff88',
      alpha: 0.5
    };

    const transparentColorMat = createBlueprintMaterial(scene, 'ground_transparent_color', transparentColorDesc, {
      isFloor: true,
      isEnvironmentGround: true,
      surfaceWidth: 120,
      surfaceHeight: 120
    });

    assert.equal(transparentColorMat.alpha, 0.5, '带 alpha 的纯色材质描述符应当透传 alpha 透明度 0.5');

    // 3. 检查公开门面导出的 createBlueprintMaterial
    assert.equal(typeof createBlueprintMaterial, 'function', '公开门面 API (src/index.js) 必须成功导出 createBlueprintMaterial');
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
