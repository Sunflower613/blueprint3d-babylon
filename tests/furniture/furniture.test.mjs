import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FURNITURE_CATEGORIES,
  FURNITURE_LIST,
  customCubeFurniture,
  customCylinderFurniture,
  customSphereFurniture
} from '../../src/furniture/index.js';

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

test('contains outdoor furniture category and 25 outdoor items', () => {
  const outdoorCategory = FURNITURE_CATEGORIES.find((cat) => cat.id === 'outdoor');
  assert.ok(outdoorCategory, 'Outdoor category should exist');
  assert.equal(outdoorCategory.label, '户外');

  const outdoorItems = FURNITURE_LIST.filter((item) => item.category === 'outdoor');
  assert.equal(outdoorItems.length, 25, 'Should contain exactly 25 outdoor furniture items');

  const types = outdoorItems.map((item) => item.type);
  assert.ok(types.includes('outdoor_umbrella'));
  assert.ok(types.includes('pergola'));
  assert.ok(types.includes('flower_arch'));
  assert.ok(types.includes('shared_bicycle'));
  assert.ok(types.includes('outdoor_stone_chess_table'));
  assert.ok(types.includes('outdoor_stone_stool'));
});

test('separates landscape plants into flora category', () => {
  const floraCategory = FURNITURE_CATEGORIES.find((cat) => cat.id === 'flora');
  assert.ok(floraCategory, 'Flora category should exist');
  assert.equal(floraCategory.label, '草木');

  const floraItems = FURNITURE_LIST.filter((item) => item.category === 'flora');
  assert.equal(floraItems.length, 31, 'Should contain exactly 31 flora items');

  const floraTypes = new Set(floraItems.map((item) => item.type));
  assert.ok(floraTypes.has('landscape_bamboo_grove'));
  assert.ok(floraTypes.has('landscape_grass_lawn'));
  assert.ok(floraTypes.has('landscape_cherry_tree'));
  assert.ok(floraTypes.has('landscape_rose_bush'));
  assert.ok(floraTypes.has('landscape_ivy_wall'));
  assert.ok(floraTypes.has('landscape_climbing_rose_wall'));
  assert.ok(floraTypes.has('landscape_water_lily_pads'));
  assert.ok(floraTypes.has('landscape_water_reeds'));
  assert.ok(floraTypes.has('landscape_flower_hedge'));
  assert.ok(floraTypes.has('landscape_pergola_flower_vines'));
  assert.ok(floraTypes.has('apple_tree'));


  const landscapeItems = FURNITURE_LIST.filter((item) => item.category === 'landscape');
  assert.equal(landscapeItems.length, 24, 'Should keep exactly 24 non-plant landscape items');

  const landscapeTypes = new Set(landscapeItems.map((item) => item.type));
  assert.ok(!landscapeTypes.has('landscape_bamboo_grove'));
  assert.ok(!landscapeTypes.has('landscape_grass_lawn'));
  assert.ok(landscapeTypes.has('landscape_koi_pond'));
  assert.ok(landscapeTypes.has('landscape_taihu_stone'));
  assert.ok(landscapeTypes.has('landscape_winding_stream'));
});

test('apple tree exposes four seasonal variants', () => {
  const appleTree = FURNITURE_LIST.find((item) => item.type === 'apple_tree');
  assert.ok(appleTree, 'Apple tree should exist');
  assert.equal(appleTree.category, 'flora');
  assert.equal(appleTree.defaultSeason, 'spring');
  assert.deepEqual(
    appleTree.seasonOptions.map((option) => option.value),
    ['spring', 'summer', 'autumn', 'winter']
  );
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

test('contains 5 new screen furniture items in decor category', () => {
  const decorItems = FURNITURE_LIST.filter((item) => item.category === 'decor');
  const screenTypes = [
    'traditional_chinese_screen',
    'modern_slat_screen',
    'rattan_wave_screen',
    'luxury_metal_glass_screen',
    'japanese_shoji_screen'
  ];

  const decorTypes = new Set(decorItems.map((item) => item.type));
  for (const type of screenTypes) {
    assert.ok(decorTypes.has(type), `${type} should be registered in decor category`);
    const screenItem = FURNITURE_LIST.find((item) => item.type === type);
    assert.ok(screenItem, `${type} definition should exist`);
    assert.ok(screenItem.defaultSize, `${type} should have defaultSize`);
    assert.ok(screenItem.components, `${type} should have components`);
    assert.ok(typeof screenItem.build === 'function', `${type} should have build function`);
  }
});

