import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument, createBabylonRenderer } from '../../src/index.js';

test('玻璃材质地板自动跳过生成不透明底层天花板遮挡 Mesh', () => {
  const document = new FloorplanDocument({
    currentFloorId: 'floor-1',
    floors: [{ id: 'floor-1', level: 0, floorHeight: 0.2, wallHeight: 2.8 }],
    floor: {
      rooms: [
        { id: 'test-room-1', name: '客厅', floorId: 'floor-1', shape: 'square', x: 0, z: 0, width: 5, depth: 5 }
      ]
    }
  });
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    const room = document.floorplan.floor.rooms[0];
    assert.ok(room, '应该包含默认测试房间');

    // 1. 设置普通不透明地板材质
    room.material = { kind: 'color', color: '#ffffff' };
    const rendererNormal = createBabylonRenderer(scene, document);
    rendererNormal.build();

    const normalFloorNode = rendererNormal.floorNodes.get(room.id);
    assert.ok(normalFloorNode, '普通房间应当成功生成楼层 TransformNode');
    const hasNormalCeilingChild = normalFloorNode.getChildren().some((child) => child.name && child.name.includes('ceiling_'));
    assert.equal(hasNormalCeilingChild, true, '普通不透明地板房间应当保留底层天花板内衬');

    rendererNormal.dispose();

    // 2. 将房间地板修改为玻璃材质
    room.material = { kind: 'glass', color: '#88ccff', alpha: 0.3 };
    const rendererGlass = createBabylonRenderer(scene, document);
    rendererGlass.build();

    const glassFloorNode = rendererGlass.floorNodes.get(room.id);
    assert.ok(glassFloorNode, '玻璃地板房间应当成功生成楼层 TransformNode');
    const hasGlassCeilingChild = glassFloorNode.getChildren().some((child) => child.name && child.name.includes('ceiling_'));
    assert.equal(hasGlassCeilingChild, false, '玻璃地板房间应当自动跳过生成不透明底层天花板 Mesh，实现透视');

    rendererGlass.dispose();
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
