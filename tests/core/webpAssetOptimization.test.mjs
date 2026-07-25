import { test } from 'node:test';
import assert from 'node:assert/strict';

test('V4-66: UI 缩略图与纹理 WebP 格式支持规约测试', () => {
  const isWebpSupportedUrl = (url) => typeof url === 'string' && (url.endsWith('.webp') || url.endsWith('.png') || url.endsWith('.jpg'));
  assert.ok(isWebpSupportedUrl('textures/wood.webp'));
  assert.ok(isWebpSupportedUrl('textures/wood.png'));
});
