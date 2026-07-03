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

test('contains clothing furniture in list', () => {
  const clothingItems = FURNITURE_LIST.filter(item => item.category === 'clothing');
  assert.equal(clothingItems.length, 53, 'Should contain exactly 53 clothing items');

  const clothingCategory = FURNITURE_CATEGORIES.find(cat => cat.id === 'clothing');
  assert.ok(clothingCategory, 'Clothing category should exist');
  assert.equal(clothingCategory.label, '服饰');

  const types = clothingItems.map(item => item.type);
  assert.ok(types.includes('clothing_mannequin_male'));
  assert.ok(types.includes('clothing_mannequin_female'));
  assert.ok(types.includes('clothing_mannequin_child'));

  for (const item of clothingItems) {
    assert.ok(item.type);
    assert.ok(item.name);
    assert.ok(item.defaultSize);
    assert.ok(item.components);
    assert.ok(typeof item.build === 'function');
  }
});

