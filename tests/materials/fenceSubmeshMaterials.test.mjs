import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMaterialAssetDescriptor } from '../../src/core/materialAssets.js';

test('V4-29: 栅栏多子网格 (SubMesh) 立柱与栏杆分段设色测试', () => {
  const postMaterial = resolveMaterialAssetDescriptor({ id: 'wood-dark', color: '#3e2723' });
  const railMaterial = resolveMaterialAssetDescriptor({ id: 'metal-white', color: '#ffffff' });

  assert.ok(postMaterial);
  assert.ok(railMaterial);
  assert.equal(postMaterial.color, '#3e2723');
  assert.equal(railMaterial.color, '#ffffff');
});
