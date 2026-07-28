import test from 'node:test';
import assert from 'node:assert/strict';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getFurnitureDefinition, FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';

test('开启自动贩卖机时在前方一格生成随机食物', () => {
  const doc = new FloorplanDocument();
  const vending = doc.addItem({
    type: 'vending_machine',
    x: 5,
    z: 10,
    rotation: 0,
    isOn: false
  });

  const initialCount = doc.floorplan.items.length;
  assert.equal(initialCount, 1);

  // 1. 开启自动贩卖机
  doc.updateItem(vending.id, { isOn: true });

  assert.equal(doc.floorplan.items.length, 2);
  const spawnedFood = doc.floorplan.items[1];

  const foodDef = getFurnitureDefinition(spawnedFood.type);
  assert.equal(foodDef.category, 'food', '生成的物品类别应为 food');

  // rotation = 0 时，正前方 1m 位置 (sin(0)=0, cos(0)=1) -> x: 5, z: 11
  assert.equal(spawnedFood.x, 5);
  assert.equal(spawnedFood.z, 11);

  // 2. 保持 isOn: true 再次更新非 isOn 字段，不应该重复生成食物
  doc.updateItem(vending.id, { name: '已开启贩卖机' });
  assert.equal(doc.floorplan.items.length, 2);

  // 3. 关闭自动贩卖机
  doc.updateItem(vending.id, { isOn: false });
  assert.equal(doc.floorplan.items.length, 2);

  // 4. 旋转 90 度 (Math.PI / 2) 后再次开启自动贩卖机
  doc.updateItem(vending.id, { rotation: Math.PI / 2 });
  doc.updateItem(vending.id, { isOn: true });

  assert.equal(doc.floorplan.items.length, 3);
  const secondFood = doc.floorplan.items[2];
  const secondFoodDef = getFurnitureDefinition(secondFood.type);
  assert.equal(secondFoodDef.category, 'food');

  // rotation = Math.PI / 2 时 (sin(PI/2)=1, cos(PI/2)=0) -> x: 6, z: 10
  assert.equal(secondFood.x, 6);
  assert.equal(secondFood.z, 10);
});

test('BabylonSceneRenderer 在开启自动贩卖机时实时构建食物 3D 节点', async () => {
  const { BabylonSceneRenderer } = await import('../../src/runtime/BabylonSceneRenderer.js');
  const BABYLON = await import('@babylonjs/core');

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  const doc = new FloorplanDocument();
  const vending = doc.addItem({
    type: 'vending_machine',
    x: 0,
    z: 0,
    rotation: 0,
    isOn: false
  });

  const renderer = new BabylonSceneRenderer(scene, doc);
  renderer.renderingEnabled = true;
  renderer.build({ rebuildType: 'all' });

  assert.equal(renderer.itemNodes.size, 1);

  // 执行 updateItem 开启贩卖机，并模拟触发渲染更新
  doc.updateItem(vending.id, { isOn: true });
  renderer.build({ rebuildType: 'item_update', targetItemId: vending.id });

  // 渲染器中 itemNodes 的数量应实时变动为 2 个（即包含了新生成的食物节点）
  assert.equal(renderer.itemNodes.size, 2);

  scene.dispose();
  engine.dispose();
});

