import assert from 'node:assert/strict';
import test from 'node:test';
import { MaterialResolver } from '../../src/domain/MaterialResolver.js';
import { isCustomColorMaterial } from '../../example/js/MaterialManager.js';

test('isCustomColorMaterial 正确识别玻璃、金属、镜面、涂料和发光的自定义颜色材质', () => {
  const customIds = [
    'custom-glass-ff0000',
    'custom-metal-d4af37',
    'custom-mirror-e8eef4',
    'custom-paint-f9fbff',
    'custom-emissive-ffeb3b'
  ];

  for (const id of customIds) {
    assert.equal(isCustomColorMaterial(id), true, `期望 ${id} 被识别为自定义颜色材质`);
  }

  const standardIds = [
    'glass-clear',
    'metal-gold',
    'mirror-silver',
    'paint-soft-white',
    'wood-oak-natural-light',
    'custom_uploaded_texture_123'
  ];

  for (const id of standardIds) {
    assert.equal(isCustomColorMaterial(id), false, `期望 ${id} 不被误识别为自定义颜色材质`);
  }
});

test('MaterialResolver 规范化玻璃纯色材质并保留透明度效果', () => {
  const descriptor = {
    id: 'custom-glass-ff0000',
    name: '自定义玻璃 (#ff0000)',
    category: 'glass',
    kind: 'glass',
    color: '#ff0000'
  };

  const normalized = MaterialResolver.normalizeMaterialDescriptor(descriptor);
  assert.equal(normalized.kind, 'glass');
  assert.equal(normalized.category, 'glass');
  assert.equal(normalized.color, '#ff0000');
  assert.equal(normalized.alpha, 0.3, '默认保留玻璃半透明 alpha 为 0.3');
});

test('MaterialResolver 规范化金属纯色材质并保留粗糙度与分类属性', () => {
  const descriptor = {
    id: 'custom-metal-d4af37',
    name: '自定义金属 (#d4af37)',
    category: 'metal',
    kind: 'metal',
    color: '#d4af37'
  };

  const normalized = MaterialResolver.normalizeMaterialDescriptor(descriptor);
  assert.equal(normalized.kind, 'metal');
  assert.equal(normalized.category, 'metal');
  assert.equal(normalized.color, '#d4af37');
  assert.equal(normalized.roughness, 0, '默认保留金属 roughness 为 0');
});

test('MaterialResolver 规范化镜面纯色材质并保留镜面分类属性', () => {
  const descriptor = {
    id: 'custom-mirror-e8eef4',
    name: '自定义镜面 (#e8eef4)',
    category: 'mirror',
    kind: 'mirror',
    color: '#e8eef4'
  };

  const normalized = MaterialResolver.normalizeMaterialDescriptor(descriptor);
  assert.equal(normalized.kind, 'mirror');
  assert.equal(normalized.category, 'mirror');
  assert.equal(normalized.color, '#e8eef4');
});
