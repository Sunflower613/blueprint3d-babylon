import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { BabylonSceneRenderer } from '../src/index.js';
import { Blueprint3DTestMap } from '../src/presets/blueprintTestMap.js';

test('楼层属性修改代理：测试隐藏墙体和屋顶，修改楼层墙高和板厚', async () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  // 1. 构造 Floorplan 数据，包含一个墙体和屋顶
  const mockPlan = {
    unit: 'm',
    currentFloorId: 'first_floor',
    floors: [
      { id: 'first_floor', name: '一层', level: 0, wallHeight: 3.0, floorHeight: 0.1, hideRoof: false, hideWall: false }
    ],
    floor: { rooms: [] },
    walls: [
      { id: 'wall_1', floorId: 'first_floor', from: [0.0, 0.0], to: [4.0, 0.0], color: '#e0e0e0' }
    ],
    openings: [],
    items: [],
    roofs: [
      { id: 'roof_1', floorId: 'first_floor', x: 2.0, z: 0.0, width: 4, depth: 4, height: 1.5, type: 'gable' }
    ]
  };

  const map = new Blueprint3DTestMap(scene);
  map.loadBuildingFile(mockPlan);

  // 等待场景加载和就绪，以便异步 executeWhenReady 执行完毕
  await scene.whenReadyAsync();

  // 验证初始状态：墙体组节点存在，屋顶节点存在
  const wallGroup = scene.getTransformNodeByName('wall_group_wall_1');
  const roofGroup = scene.getTransformNodeByName('roof_roof_1');

  assert.ok(wallGroup, '初识渲染时墙体应存在');
  assert.ok(roofGroup, '初识渲染时屋顶应存在');

  // 验证墙体初始渲染高度，寻找 profiled 或普通的 wall mesh
  const wallMesh = scene.meshes.find(m => m.name.startsWith('wall_profiled_result_wall_1_') || m.name.startsWith('wall_sub_wall_1_'));
  assert.ok(wallMesh, '墙段实体 Mesh 应成功渲染');
  let wallHeightBefore = wallMesh.getBoundingInfo().maximum.y - wallMesh.getBoundingInfo().minimum.y;
  assert.ok(wallHeightBefore > 2.0, '初识渲染时墙体高度应大于 2.0 米');

  // 2. 测试隐藏墙体和隐藏屋顶
  map.changeFloorHideSettings('first_floor', true, true);
  await scene.whenReadyAsync();

  // 验证屋顶是否已被过滤不渲染
  const roofGroupAfter = scene.getTransformNodeByName('roof_roof_1');
  assert.equal(roofGroupAfter, null, '隐藏屋顶后，场景中不应存在该屋顶的 TransformNode');

  // 验证墙体高度是否降级为 0.2 米
  const wallMeshAfter = scene.meshes.find(m => m.name.startsWith('wall_profiled_result_wall_1_') || m.name.startsWith('wall_sub_wall_1_'));
  assert.ok(wallMeshAfter, '隐藏后墙段实体 Mesh 应仍存在');
  const wallHeightAfter = wallMeshAfter.getBoundingInfo().maximum.y - wallMeshAfter.getBoundingInfo().minimum.y;
  assert.ok(wallHeightAfter < 0.35, '隐藏墙体后，墙体高度应限制在极小高度（0.2米加板厚）内');

  // 3. 测试修改楼层高度为 4.5 米，并恢复隐藏墙体/屋顶
  map.changeFloorHideSettings('first_floor', false, false);
  map.changeFloorHeight('first_floor', 4.5);
  await scene.whenReadyAsync();

  // 屋顶重新生成
  const roofGroupRebuilt = scene.getTransformNodeByName('roof_roof_1');
  assert.ok(roofGroupRebuilt, '恢复隐藏后，屋顶应重新生成在场景中');

  // 墙高变为 4.5 米
  const wallMesh45 = scene.meshes.find(m => m.name.startsWith('wall_profiled_result_wall_1_') || m.name.startsWith('wall_sub_wall_1_'));
  assert.ok(wallMesh45, '修改高度后墙体 Mesh 应仍存在');
  const wallHeight45 = wallMesh45.getBoundingInfo().maximum.y - wallMesh45.getBoundingInfo().minimum.y;
  assert.ok(wallHeight45 > 4.0, '楼层墙高修改后应大于 4.0 米');

  // 4. 测试修改默认楼板厚度属性
  map.changeFloorDefaultFloorHeight('first_floor', 0.25);
  assert.equal(map.getFloor('first_floor').floorHeight, 0.25, '楼板厚度应成功写入属性');

  scene.dispose();
  engine.dispose();
});
