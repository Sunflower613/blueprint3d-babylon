import assert from 'node:assert/strict';
import test from 'node:test';
import { createBuildingFileName } from '../src/index.js';

test('存档文件名使用用户自定义名称和本地分钟时间戳', () => {
  const date = new Date(2026, 6, 22, 22, 35, 48);
  assert.equal(
    createBuildingFileName('我的 Loft 存档', date),
    '我的-Loft-存档-20260722-2235.b3dbuilding.json'
  );
});
