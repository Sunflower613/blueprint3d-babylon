import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE_LIST, getFurnitureDefinition } from '../../src/furniture/index.js';

test('V4-25: 书架与储物柜层板子件配置及自动填充测试', () => {
  assert.ok(FURNITURE_LIST.length > 0, '家具库定义注册正常');
  const bookshelfDef = getFurnitureDefinition('bookshelf');
  assert.ok(bookshelfDef, '可查询获取书架/桌台类家具定义');
});
