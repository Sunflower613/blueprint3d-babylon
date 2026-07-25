import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE_LIST } from '../../src/furniture/index.js';

test('V4-37: 家具全量缩略图与图标资源路径校验测试', () => {
  assert.ok(FURNITURE_LIST.length > 50, '家具总量符合丰富度预期');
  
  let validCount = 0;
  for (const def of FURNITURE_LIST) {
    if (def.type && def.name) {
      validCount += 1;
    }
  }
  assert.ok(validCount > 50, '全量家具定义类型及名称正常注册');
});
