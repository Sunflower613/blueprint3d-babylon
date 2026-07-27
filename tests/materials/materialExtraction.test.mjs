import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveMaterialDisplayName, getActiveMaterialArrayDisplayName } from '../../example/js/MaterialManager.js';
import { DEFAULT_MATERIAL_PACKS } from '../../src/index.js';

test('材质名称展示：验证单材质与材质数组名称格式化', () => {
  const singleMat = { id: 'wood-1', name: '护墙板', category: 'wood' };
  assert.equal(getActiveMaterialDisplayName(singleMat), '护墙板');

  const pureWhite = { kind: 'paint', color: '#ffffff', name: '纯色：#ffffff' };
  assert.equal(getActiveMaterialDisplayName(pureWhite), '纯色：#ffffff');

  const matArray = [
    { componentId: 'top', material: { name: '护墙板' } },
    { componentId: 'side', material: { name: '浅木格栅' } },
    { componentId: 'bottom', material: { name: '护墙板' } }
  ];
  assert.equal(getActiveMaterialArrayDisplayName(matArray), '护墙板、浅木格栅');
});

test('材质匹配防错：验证纯白色 #ffffff 绝不匹配为天空盒/背景材质', () => {
  const skyMat = DEFAULT_MATERIAL_PACKS.find(m => m.category === 'sky');
  assert.ok(skyMat, '材质库中应包含天空材质');
  assert.equal(skyMat.color, '#ffffff');

  const colorVal = '#ffffff';
  
  const foundPaint = DEFAULT_MATERIAL_PACKS.find(m =>
    m.color === colorVal &&
    (m.category === 'paint' || m.kind === 'paint' || m.kind === 'color')
  );
  assert.ok(foundPaint, '应优先匹配到纯色 paint 材质');
  assert.equal(foundPaint.id, 'paint-pure-white');
  assert.notEqual(foundPaint.category, 'sky');
});
