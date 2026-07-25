import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FURNITURE_LIST,
  APPLIANCE_POWER_EFFECTS
} from '../../src/furniture/index.js';

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

test('4. 厨房模块家具全部保留在厨房分类', () => {
  for (const type of ['fridge', 'microwave', 'stove', 'range_hood', 'dishwasher', 'sink_kitchen', 'sink_cabinet', 'kitchenware', 'knife_block']) {
    const definition = FURNITURE_LIST.find(item => item.type === type);
    assert.equal(definition.category, 'kitchen', `${type} 应该保留在 kitchen`);
  }
});

test('5. 燃气灶统一为一米宽并内置烤箱组件', () => {
  const stove = FURNITURE_LIST.find(item => item.type === 'stove');
  assert.equal(stove.defaultSize.width, 1);

  const componentIds = new Set(stove.components.map(component => component.id));
  assert.ok(componentIds.has('oven_frame'));
  assert.ok(componentIds.has('oven_glass'));
  assert.ok(componentIds.has('oven_handle'));
});

test('6. 厨房柜体和大家电默认宽度统一为标准公制尺寸', () => {
  for (const type of ['cabinet_kitchen', 'sink_kitchen', 'sink_cabinet', 'stove', 'dishwasher', 'fridge', 'range_hood']) {
    const definition = FURNITURE_LIST.find(item => item.type === type);
    const width = definition.defaultSize.width;
    assert.ok(width >= 0.9 && width <= 1.0, `${type} 默认宽度应为标准公制尺寸`);
  }
});

test('7. 洗碗机采用标准地柜高度', () => {
  const dishwasher = FURNITURE_LIST.find(item => item.type === 'dishwasher');
  assert.equal(dishwasher.defaultSize.height, 0.9);
  assert.equal(dishwasher.defaultSize.depth, 0.6);
});
