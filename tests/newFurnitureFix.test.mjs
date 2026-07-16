import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FURNITURE_LIST,
  APPLIANCE_POWER_EFFECTS
} from '../src/furniture/index.js';

test('1. 新增空调与立式空调，分别实现几何 build 并注册开关特效', () => {
  const wallAc = FURNITURE_LIST.find(item => item.type === 'air_conditioner_wall');
  assert.ok(wallAc, '挂式空调应该注册成功');
  assert.equal(wallAc.name, '挂式空调');
  assert.equal(wallAc.category, 'appliances');
  assert.ok(typeof wallAc.build === 'function');
  assert.ok(APPLIANCE_POWER_EFFECTS.air_conditioner_wall, '挂式空调应该有开关特效');

  const floorAc = FURNITURE_LIST.find(item => item.type === 'air_conditioner_floor');
  assert.ok(floorAc, '立式空调应该注册成功');
  assert.equal(floorAc.name, '立式空调');
  assert.equal(floorAc.category, 'appliances');
  assert.ok(typeof floorAc.build === 'function');
  assert.ok(APPLIANCE_POWER_EFFECTS.air_conditioner_floor, '立式空调应该有开关特效');
});

test('2. 新增椭圆桌与三角圆茶几', () => {
  const ovalTable = FURNITURE_LIST.find(item => item.type === 'oval_table');
  assert.ok(ovalTable, '椭圆桌应该注册成功');
  assert.equal(ovalTable.name, '椭圆桌');
  assert.equal(ovalTable.category, 'tables');
  assert.ok(typeof ovalTable.build === 'function');

  const triCoffeeTable = FURNITURE_LIST.find(item => item.type === 'triangular_round_coffee_table');
  assert.ok(triCoffeeTable, '三角圆茶几应该注册成功');
  assert.equal(triCoffeeTable.name, '三角圆茶几');
  assert.equal(triCoffeeTable.category, 'tables');
  assert.ok(typeof triCoffeeTable.build === 'function');
});

test('3. 新增带柜水槽', () => {
  const sinkCabinet = FURNITURE_LIST.find(item => item.type === 'sink_cabinet');
  assert.ok(sinkCabinet, '带柜水槽应该注册成功');
  assert.equal(sinkCabinet.name, '带柜水槽');
  assert.equal(sinkCabinet.category, 'kitchen');
  assert.ok(typeof sinkCabinet.build === 'function');
});

test('4. 厨房相关家电分类规范，理顺分类边界', () => {
  const fridge = FURNITURE_LIST.find(item => item.type === 'fridge');
  assert.equal(fridge.category, 'appliances', '冰箱 category 应该被归到 appliances');

  const microwave = FURNITURE_LIST.find(item => item.type === 'microwave');
  assert.equal(microwave.category, 'appliances', '微波炉 category 应该被归到 appliances');

  const stove = FURNITURE_LIST.find(item => item.type === 'stove');
  assert.equal(stove.category, 'appliances', '燃气灶 category 应该被归到 appliances');

  const rangeHood = FURNITURE_LIST.find(item => item.type === 'range_hood');
  assert.equal(rangeHood.category, 'appliances', '抽油烟机 category 应该被归到 appliances');

  const dishwasher = FURNITURE_LIST.find(item => item.type === 'dishwasher');
  assert.equal(dishwasher.category, 'appliances', '洗碗机 category 应该被归到 appliances');

  const sinkKitchen = FURNITURE_LIST.find(item => item.type === 'sink_kitchen');
  assert.equal(sinkKitchen.category, 'kitchen', '普通厨房水槽 category 应该保留在 kitchen');

  const kitchenware = FURNITURE_LIST.find(item => item.type === 'kitchenware');
  assert.equal(kitchenware.category, 'kitchen', '餐具架 category 应该保留在 kitchen');

  const knifeBlock = FURNITURE_LIST.find(item => item.type === 'knife_block');
  assert.equal(knifeBlock.category, 'kitchen', '刀架 category 应该保留在 kitchen');
});
