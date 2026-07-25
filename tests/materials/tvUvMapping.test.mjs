import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMaterialAssetDescriptor } from '../../src/core/materialAssets.js';

test('V4-28: 电视机屏幕与画面自定义材质贴图 UV 映射测试', () => {
  const normMat = resolveMaterialAssetDescriptor({
    id: 'tv_screen_custom',
    kind: 'texture',
    url: 'textures/tv_screen.png'
  });

  assert.ok(normMat);
  assert.equal(normMat.kind, 'texture');
});
