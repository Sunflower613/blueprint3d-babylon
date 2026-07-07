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
  const customCategory = FURNITURE_CATEGORIES.find((cat) => cat.id === 'custom');
  assert.ok(customCategory, 'Custom category should exist');
  assert.equal(customCategory.label, '自定义');
});

test('contains custom furniture in list', () => {
  const customItems = FURNITURE_LIST.filter((item) => item.category === 'custom');
  assert.equal(customItems.length, 3, 'Should contain exactly 3 custom furniture items');

  const types = customItems.map((item) => item.type);
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
  const clothingItems = FURNITURE_LIST.filter((item) => item.category === 'clothing');
  assert.equal(clothingItems.length, 53, 'Should contain exactly 53 clothing items');

  const clothingCategory = FURNITURE_CATEGORIES.find((cat) => cat.id === 'clothing');
  assert.ok(clothingCategory, 'Clothing category should exist');
  assert.equal(clothingCategory.label, '服饰');

  const types = clothingItems.map((item) => item.type);
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

test('contains outdoor furniture category and 22 outdoor items', () => {
  const outdoorCategory = FURNITURE_CATEGORIES.find((cat) => cat.id === 'outdoor');
  assert.ok(outdoorCategory, 'Outdoor category should exist');
  assert.equal(outdoorCategory.label, '室外');

  const outdoorItems = FURNITURE_LIST.filter((item) => item.category === 'outdoor');
  assert.equal(outdoorItems.length, 22, 'Should contain exactly 22 outdoor furniture items');

  const types = outdoorItems.map((item) => item.type);
  assert.ok(types.includes('outdoor_umbrella'));
  assert.ok(types.includes('pergola'));
  assert.ok(types.includes('flower_arch'));
});

test('adds outdoor-friendly seating and tables into existing categories', () => {
  const seatingTypes = new Set(FURNITURE_LIST.filter((item) => item.category === 'seating').map((item) => item.type));
  assert.ok(seatingTypes.has('adirondack_chair'));
  assert.ok(seatingTypes.has('folding_camping_chair'));
  assert.ok(seatingTypes.has('rattan_lounge_chair'));
  assert.ok(seatingTypes.has('hanging_egg_chair'));

  const tableTypes = new Set(FURNITURE_LIST.filter((item) => item.category === 'tables').map((item) => item.type));
  assert.ok(tableTypes.has('patio_dining_table'));
  assert.ok(tableTypes.has('bistro_table'));
  assert.ok(tableTypes.has('rattan_coffee_table'));
  assert.ok(tableTypes.has('garden_side_table'));
});
