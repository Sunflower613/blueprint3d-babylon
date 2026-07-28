import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { BlueprintRegistry } from '../../src/core/BlueprintRegistry.js';
import { FURNITURE_DEFINITIONS } from '../../src/furniture/index.js';

test('新增的 8 种欧式精致盆栽与草木预设完整性测试', async (t) => {
  const newTypes = [
    'balcony_flower_box',
    'terracotta_flower_urn',
    'potted_pink_rose',
    'landscape_climbing_rose_wall',
    'landscape_water_lily_pads',
    'landscape_water_reeds',
    'landscape_flower_hedge',
    'landscape_pergola_flower_vines'
  ];

  await t.test('所有新增预设已注册到 FURNITURE_DEFINITIONS 且属性合法', () => {
    newTypes.forEach((type) => {
      const def = FURNITURE_DEFINITIONS[type];
      assert.ok(def, `预设 ${type} 应当被正常导出和注册`);
      assert.ok(def.name, `预设 ${type} 必须具有中文名称`);
      assert.ok(def.defaultSize, `预设 ${type} 必须包含默认尺寸 defaultSize`);
      assert.ok(def.defaultSize.width > 0, `预设 ${type} width 需为正数`);
      assert.ok(def.defaultSize.height > 0, `预设 ${type} height 需为正数`);
      assert.ok(def.defaultSize.depth > 0, `预设 ${type} depth 需为正数`);
      assert.ok(Array.isArray(def.components) && def.components.length > 0, `预设 ${type} 必须声明 components 材质数组`);
      assert.equal(typeof def.build, 'function', `预设 ${type} 必须包含 build 3D构建函数`);
    });
  });

  await t.test('所有新增 8 种植物预设能在 Babylon Scene 中无报错生成 3D 网格节点', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const registry = new BlueprintRegistry(scene);

    newTypes.forEach((type, index) => {
      const def = FURNITURE_DEFINITIONS[type];
      const item = { id: `item_test_${type}_${index}`, type: type };
      const parentNode = new BABYLON.TransformNode(`node_${item.id}`, scene);

      def.build(registry, item, parentNode, def.defaultSize);

      const children = parentNode.getChildren();
      assert.ok(children.length > 0, `预设 ${type} build 后必须为其父节点生成 3D Mesh 子节点 (当前生成的节点数: ${children.length})`);
    });

    scene.dispose();
    engine.dispose();
  });

  await t.test('所有新增 8 种植物预设在尺寸放大和缩小（如 2.5倍/0.3倍）时均能正常构建', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const registry = new BlueprintRegistry(scene);

    newTypes.forEach((type, index) => {
      const def = FURNITURE_DEFINITIONS[type];
      const scaledUpSize = {
        width: def.defaultSize.width * 2.5,
        height: def.defaultSize.height * 2.5,
        depth: def.defaultSize.depth * 2.5
      };

      const itemScaled = { id: `item_scale_${type}_${index}`, type: type };
      const parentNode = new BABYLON.TransformNode(`node_${itemScaled.id}`, scene);

      def.build(registry, itemScaled, parentNode, scaledUpSize);

      const children = parentNode.getChildren();
      assert.ok(children.length > 0, `预设 ${type} 放大缩放后必须正常构建子节点`);
    });

    scene.dispose();
    engine.dispose();
  });

  await t.test('草木在设计面板中修改组件颜色（如改为红色#ff0000）时，渲染必须优先使用用户自定义颜色', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const registry = new BlueprintRegistry(scene);

    const wisteriaDef = FURNITURE_DEFINITIONS['landscape_pergola_flower_vines'];
    assert.ok(wisteriaDef, '必须包含紫藤萝预设');

    // 用户在设计面板里把花朵颜色主动改为红色 #ff0000
    const customItem = {
      id: 'item_custom_wisteria',
      type: 'landscape_pergola_flower_vines',
      colors: {
        'hanging-flowers': '#ff0000'
      }
    };

    const parentNode = new BABYLON.TransformNode(`node_${customItem.id}`, scene);
    wisteriaDef.build(registry, customItem, parentNode, wisteriaDef.defaultSize);

    const children = parentNode.getChildren();
    assert.ok(children.length > 0, '紫藤萝构建成功');

    // 查验注册生成的材质列表中，hanging-flowers 组件对应的材质颜色是否为用户自定义的 #ff0000 红色
    const flowerMesh = children.find(child => child.metadata && child.metadata.blueprintFurnitureComponentId === 'hanging-flowers');
    assert.ok(flowerMesh, '找到hanging-flowers组件节点');
    assert.ok(flowerMesh.material, 'hanging-flowers节点拥有3D材质');

    const diffuseColorHex = flowerMesh.material.diffuseColor ? flowerMesh.material.diffuseColor.toHexString().toLowerCase() : '';
    assert.equal(diffuseColorHex, '#ff0000', `挂载材质颜色必须为用户自定义的红色 #ff0000，实际为 ${diffuseColorHex}`);

    scene.dispose();
    engine.dispose();
  });

});

