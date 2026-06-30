import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FURNITURE_CATEGORIES,
  FURNITURE_LIST,
  customCubeFurniture,
  customCylinderFurniture,
  customSphereFurniture
} from '../src/furniture/index.js';

test('exposes custom furniture category', () => {
  const customCategory = FURNITURE_CATEGORIES.find(cat => cat.id === 'custom');
  assert.ok(customCategory, 'Custom category should exist');
  assert.equal(customCategory.label, '自定义');
});

test('contains custom furniture in list', () => {
  const customItems = FURNITURE_LIST.filter(item => item.category === 'custom');
  assert.equal(customItems.length, 3, 'Should contain exactly 3 custom furniture items');

  const types = customItems.map(item => item.type);
  assert.ok(types.includes('custom_cube'));
  assert.ok(types.includes('custom_cylinder'));
  assert.ok(types.includes('custom_sphere'));
});

test('validates custom furniture structures', () => {
  const customItems = [customCubeFurniture, customCylinderFurniture, customSphereFurniture];
  for (const item of customItems) {
    assert.ok(item.type);
    assert.ok(item.name);
    assert.equal(item.category, 'custom');
    assert.ok(item.defaultSize);
    assert.ok(item.components);
    assert.ok(typeof item.build === 'function');
  }
});
