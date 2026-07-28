import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { createDocument } from '../../src/editor/EditorFacade.js';
import { createBlueprintMaterial } from '../../src/index.js';

test('被动恢复快照或撤销时，环境材质 descriptors 正确响应并刷新', () => {
  const document = createDocument();
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    // 1. 设置初始环境材质
    const initialSky = { kind: 'color', color: '#112233' };
    const initialGround = { kind: 'glass', color: '#88ccff', alpha: 0.35 };

    document.setEnvironmentMaterial('sky', initialSky);
    document.setEnvironmentMaterial('ground', initialGround);

    const snapshotA = document.createSnapshot();
    assert.equal(snapshotA.environment.skyMaterial.color, '#112233');
    assert.equal(snapshotA.environment.groundMaterial.alpha, 0.35);

    // 模拟 Viewer3D 基于快照 A 建立地面材质
    let groundMaterial = createBlueprintMaterial(
      scene,
      'grassLawnMat',
      snapshotA.environment.groundMaterial,
      { isFloor: true, isEnvironmentGround: true }
    );
    assert.equal(groundMaterial.alpha, 0.35);

    // 2. 修改环境材质为 B
    const updatedSky = { kind: 'color', color: '#ff9900' };
    const updatedGround = { kind: 'color', color: '#00ffaa', alpha: 0.8 };

    document.setEnvironmentMaterial('sky', updatedSky);
    document.setEnvironmentMaterial('ground', updatedGround);

    const snapshotB = document.createSnapshot();
    assert.equal(snapshotB.environment.skyMaterial.color, '#ff9900');
    assert.equal(snapshotB.environment.groundMaterial.alpha, 0.8);

    // 3. 模拟撤销 / 恢复快照 A (被动切换)
    document.restoreSnapshot(snapshotA);

    const restoredSnapshot = document.createSnapshot();
    assert.equal(restoredSnapshot.environment.skyMaterial.color, '#112233', '撤销后天空材质应被恢复为快照 A 的原颜色');
    assert.equal(restoredSnapshot.environment.groundMaterial.alpha, 0.35, '撤销后地面材质应被恢复为快照 A 的原 alpha 透明度');

    // 重新通过 createBlueprintMaterial 渲染地面材质
    if (groundMaterial) groundMaterial.dispose();
    groundMaterial = createBlueprintMaterial(
      scene,
      'grassLawnMat',
      restoredSnapshot.environment.groundMaterial,
      { isFloor: true, isEnvironmentGround: true }
    );
    assert.equal(groundMaterial.alpha, 0.35, '重新渲染后的地面材质 alpha 实例属性与快照 A 完美匹配');

  } finally {
    scene.dispose();
    engine.dispose();
  }
});
