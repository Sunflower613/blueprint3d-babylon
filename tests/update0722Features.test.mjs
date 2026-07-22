import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';

import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { FURNITURE_LIST } from '../src/furniture/index.js';
import { buildStairsGeometry } from '../src/geometry/stairsGeometry.js';

function minimalPlan(overrides = {}) {
  return {
    unit: 'm',
    currentFloorId: 'floor_1',
    floors: [{ id: 'floor_1', name: '1F', level: 0 }],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    roofs: [],
    stairs: [],
    fences: [],
    fenceGates: [],
    ...overrides
  };
}

test('天空和地面材质作为建筑环境配置保存并可分别重置', () => {
  const document = new FloorplanDocument(minimalPlan());
  const sky = { kind: 'texture', src: 'data:image/png;base64,sky', scale: 1, color: '#ffffff' };

  document.setEnvironmentMaterial('sky', sky);
  document.setEnvironmentMaterial('ground', '#446633');

  const snapshot = document.createSnapshot();
  assert.equal(snapshot.environment.skyMaterial.src, sky.src);
  assert.equal(snapshot.environment.groundMaterial.color, '#446633');
  assert.equal(document.setEnvironmentMaterial('unsupported', '#000000'), null);

  document.setEnvironmentMaterial('sky', null);
  assert.equal(document.floorplan.environment.skyMaterial, null);
  assert.equal(document.floorplan.environment.groundMaterial.color, '#446633');
});

test('L 楼梯分别保存转角前后长度并用于两段几何', () => {
  const document = new FloorplanDocument(minimalPlan({
    stairs: [{
      id: 'stairs_l', floorId: 'floor_1', subtype: 'lshape', width: 1,
      depth: 3, height: 3, steps: 10, cornerStep: 4,
      runBeforeCorner: 2.4, runAfterCorner: 1.6
    }]
  }));
  const stairs = document.floorplan.stairs[0];
  assert.equal(stairs.runBeforeCorner, 2.4);
  assert.equal(stairs.runAfterCorner, 1.6);

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const group = new BABYLON.TransformNode('stairs-test', scene);
  const material = new BABYLON.StandardMaterial('stairs-material', scene);
  const registry = {
    scene,
    materialCache: new Map(),
    add(mesh, options = {}) {
      mesh.parent = options.parent || group;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };

  buildStairsGeometry(registry, group, stairs, material, stairs.width, stairs.depth, stairs.height, stairs.steps);
  const firstRun = group.getChildMeshes().filter((mesh) => mesh.name.includes('_l1_tread_'));
  const secondRun = group.getChildMeshes().filter((mesh) => mesh.name.includes('_l2_tread_'));
  assert.equal(firstRun.length, 4);
  assert.equal(secondRun.length, 6);
  assert.ok(Math.abs(firstRun[0].getBoundingInfo().boundingBox.extendSizeWorld.z * 2 - 0.6) < 0.001);
  assert.ok(Math.abs(secondRun[0].getBoundingInfo().boundingBox.extendSizeWorld.x * 2 - (1.6 / 6)) < 0.001);

  scene.dispose();
  engine.dispose();
});

test('0722 家具包含薄海报、四联拼图以及参考图的桌台和木格栅', () => {
  const byType = (type) => FURNITURE_LIST.find((definition) => definition.type === type);
  const poster = byType('poster');
  const triptychPoster = byType('triptych_poster');
  const quadPoster = byType('quad_poster');
  const coffeeTable = byType('coffee_table');
  const sideTable = byType('side_table');
  const screen = byType('modern_slat_screen');

  assert.equal(poster.placeType, 'wall');
  assert.equal(poster.defaultSize.depth, 0.08);
  assert.deepEqual(poster.components.map((component) => component.id), ['poster']);
  assert.deepEqual(triptychPoster.components.map((component) => component.id), ['frame', 'poster']);
  assert.deepEqual(quadPoster.components.map((component) => component.id), ['frame', 'poster']);
  assert.equal(poster.components[0].defaultMaterial.id, 'poster-celestial-moons');
  assert.equal(triptychPoster.components[1].defaultMaterial.id, 'poster-botanical-sage');
  assert.equal(quadPoster.components[1].defaultMaterial.id, 'poster-abstract-arches');
  assert.deepEqual(coffeeTable.defaultSize, { width: 28, depth: 28, height: 18 });
  assert.deepEqual(sideTable.defaultSize, { width: 18, depth: 18, height: 22 });
  assert.equal(screen.components[0].id, 'base');
  assert.equal(screen.components[1].id, 'slats');
});

test('海报和挂画在新建时获得指定的默认贴图', () => {
  const document = new FloorplanDocument(minimalPlan());
  assert.equal(document.addItem({ type: 'poster' }).materials.poster.id, 'poster-celestial-moons');
  assert.equal(document.addItem({ type: 'triptych_poster' }).materials.poster.id, 'poster-botanical-sage');
  assert.equal(document.addItem({ type: 'quad_poster' }).materials.poster.id, 'poster-abstract-arches');
  assert.equal(document.addItem({ type: 'landscape_painting' }).materials.canvas.id, 'wallpaper-ink-bamboo-mist');
  assert.equal(document.addItem({ type: 'painting' }).materials.canvas.id, 'poster-bauhaus-primary');
});

test('单张海报只有一层薄贴图，不再生成背板', () => {
  const definition = FURNITURE_LIST.find((item) => item.type === 'poster');
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const node = new BABYLON.TransformNode('poster-test', scene);
  const registry = {
    scene,
    materialCache: new Map(),
    add(mesh, options = {}) {
      mesh.parent = options.parent || node;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };
  definition.build(registry, { id: 'poster', colors: {}, materials: {} }, node, { width: 0.46, depth: 0.002, height: 0.61 });
  const meshes = node.getChildMeshes();
  assert.equal(meshes.length, 1);
  assert.equal(meshes[0].metadata.blueprintFurnitureComponentId, 'poster');
  assert.ok(meshes[0].getBoundingInfo().boundingBox.extendSizeWorld.z * 2 <= 0.003);
  scene.dispose();
  engine.dispose();
});

test('三联海报把一张贴图横向裁成三块', () => {
  const definition = FURNITURE_LIST.find((item) => item.type === 'triptych_poster');
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const node = new BABYLON.TransformNode('triptych-poster-test', scene);
  const registry = {
    scene,
    materialCache: new Map(),
    add(mesh, options = {}) {
      mesh.parent = options.parent || node;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };
  const texture = {
    kind: 'texture',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO7EAAAAASUVORK5CYII=',
    color: '#ffffff'
  };
  definition.build(registry, {
    id: 'triptych-poster',
    colors: {},
    materials: { poster: texture }
  }, node, { width: 1.2, depth: 0.03, height: 0.7 });

  const panels = node.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'poster');
  assert.equal(panels.length, 3);
  assert.deepEqual(panels.map((mesh) => mesh.material.diffuseTexture.uOffset), [0, 1 / 3, 2 / 3]);
  panels.forEach((mesh) => {
    assert.equal(mesh.material.diffuseTexture.uScale, 1 / 3);
    assert.equal(mesh.material.diffuseTexture.vScale, 1);
  });
  scene.dispose();
  engine.dispose();
});

test('四联拼图把一张自定义海报贴图裁成四个象限', () => {
  const definition = FURNITURE_LIST.find((item) => item.type === 'quad_poster');
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const node = new BABYLON.TransformNode('quad-poster-test', scene);
  const registry = {
    scene,
    materialCache: new Map(),
    add(mesh, options = {}) {
      mesh.parent = options.parent || node;
      if (options.material) mesh.material = options.material;
      return mesh;
    }
  };
  const texture = {
    kind: 'texture',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO7EAAAAASUVORK5CYII=',
    color: '#ffffff'
  };

  definition.build(registry, {
    id: 'quad-poster',
    colors: {},
    materials: { poster: texture }
  }, node, { width: 1, depth: 0.03, height: 1 });

  const panels = node.getChildMeshes().filter((mesh) => mesh.metadata?.blueprintFurnitureComponentId === 'poster');
  assert.equal(panels.length, 4);
  assert.deepEqual(
    panels.map((mesh) => [mesh.material.diffuseTexture.uOffset, mesh.material.diffuseTexture.vOffset]),
    [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]]
  );
  panels.forEach((mesh) => {
    assert.equal(mesh.material.diffuseTexture.uScale, 0.5);
    assert.equal(mesh.material.diffuseTexture.vScale, 0.5);
  });

  scene.dispose();
  engine.dispose();
});
