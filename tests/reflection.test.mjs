import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { FURNITURE_DEFINITIONS } from '../src/furniture/index.js';
import { BabylonSceneRenderer } from '../src/index.js';

test('反射方案分级：测试主镜面、次要镜面、金属材质在高级/普通模式下的反射贴图及尺寸', async () => {
  // 1. 注册测试用镜面和金属家具定义
  FURNITURE_DEFINITIONS['custom_test_mirror'] = {
    type: 'custom_test_mirror',
    name: '测试主镜面',
    isMirror: true,
    defaultSize: { width: 0.8, depth: 0.1, height: 1.5 },
    components: [
      { id: 'mirror_mesh_id', label: '主镜子', defaultColor: '#ffffff' }
    ],
    build(registry, item, node, size) {
      const mesh = BABYLON.MeshBuilder.CreateBox('mirror_mesh_id', { width: 0.8, height: 1.5, depth: 0.05 }, node.getScene());
      mesh.parent = node;
      mesh.metadata = { blueprintFurnitureComponentId: 'mirror_mesh_id' };
      const mat = new BABYLON.StandardMaterial('mirror_mat', node.getScene());
      mat.metadata = {
        blueprintMaterial: {
          kind: 'mirror'
        }
      };
      mesh.material = mat;
    }
  };

  FURNITURE_DEFINITIONS['custom_test_sub_mirror'] = {
    type: 'custom_test_sub_mirror',
    name: '测试次要镜面',
    isMirror: false,
    defaultSize: { width: 0.8, depth: 0.1, height: 1.5 },
    components: [
      { id: 'sub_glass_id', label: '次镜子', defaultColor: '#ffffff' }
    ],
    build(registry, item, node, size) {
      const mesh = BABYLON.MeshBuilder.CreateBox('sub_glass_id', { width: 0.8, height: 1.5, depth: 0.05 }, node.getScene());
      mesh.parent = node;
      mesh.metadata = { blueprintFurnitureComponentId: 'sub_glass_id' };
      const mat = new BABYLON.StandardMaterial('sub_glass_mat', node.getScene());
      mat.metadata = {
        blueprintMaterial: {
          kind: 'mirror'
        }
      };
      mesh.material = mat;
    }
  };

  FURNITURE_DEFINITIONS['custom_test_metal'] = {
    type: 'custom_test_metal',
    name: '测试金属材质',
    defaultSize: { width: 0.5, depth: 0.5, height: 0.5 },
    components: [
      { id: 'metal_mesh_id', label: '金属部分', defaultColor: '#888888' }
    ],
    build(registry, item, node, size) {
      const mesh = BABYLON.MeshBuilder.CreateBox('metal_mesh_id', { width: 0.5, height: 0.5, depth: 0.5 }, node.getScene());
      mesh.parent = node;
      mesh.metadata = { blueprintFurnitureComponentId: 'metal_mesh_id' };
      const mat = new BABYLON.StandardMaterial('metal_mat', node.getScene());
      mat.metadata = {
        blueprintMaterial: {
          kind: 'metal'
        }
      };
      mesh.material = mat;
    }
  };

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  // 2. 构造 Floorplan
  const mockPlan = {
    unit: 'm',
    currentFloorId: 'ground',
    floors: [
      { id: 'ground', name: '地面', level: 0, wallHeight: 3.0, floorHeight: 0.1 }
    ],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [
      {
        id: 'main_mirror_instance',
        type: 'custom_test_mirror',
        floorId: 'ground',
        x: 1.0,
        z: 1.0,
        elevation: 0.0
      },
      {
        id: 'sub_mirror_instance',
        type: 'custom_test_sub_mirror',
        floorId: 'ground',
        x: 2.0,
        z: 2.0,
        elevation: 0.0
      },
      {
        id: 'metal_instance',
        type: 'custom_test_metal',
        floorId: 'ground',
        x: 3.0,
        z: 3.0,
        elevation: 0.0
      }
    ]
  };

  const doc = new FloorplanDocument(mockPlan);
  const renderer = new BabylonSceneRenderer(scene, doc);
  renderer.build();

  // 等待场景加载和就绪，以便异步 executeWhenReady 执行完毕
  await scene.whenReadyAsync();

  // 默认模式下 (enableAdvancedRendering = false)
  // 获取三者 mesh
  const mainMirrorMesh = scene.getMeshByName('mirror_mesh_id');
  const subMirrorMesh = scene.getMeshByName('sub_glass_id');
  const metalMesh = scene.getMeshByName('metal_mesh_id');

  assert.ok(mainMirrorMesh, '应成功渲染主镜面');
  assert.ok(subMirrorMesh, '应成功渲染次要镜面');
  assert.ok(metalMesh, '应成功渲染金属材质');

  const mainMat = mainMirrorMesh.material;
  const subMat = subMirrorMesh.material;
  const metalMat = metalMesh.material;

  // 验证在普通模式下（enableAdvancedRendering = false）
  // 1. 主镜面：降级为 256 像素的平面反射 MirrorTexture
  assert.ok(mainMat.reflectionTexture instanceof BABYLON.MirrorTexture, '普通模式下，主镜面应使用平面反射 MirrorTexture');
  assert.equal(mainMat.reflectionTexture.getRenderWidth(), 256, '普通模式下，主镜面反射贴图大小应为 256');

  // 2. 次要镜面：降级为 ReflectionProbe (区域反射探针)
  assert.ok(subMat.customReflectionProbe instanceof BABYLON.ReflectionProbe, '普通模式下，次要镜面应使用区域反射探针');
  assert.ok(!(subMat.reflectionTexture instanceof BABYLON.MirrorTexture), '普通模式下，次要镜面不应使用平面反射');

  // 3. 金属：还原为静态 CubeMap（当前无 saved，所以 customReflectionProbe 为空/销毁，恢复为静态）
  assert.ok(!metalMat.customReflectionProbe, '普通模式下，金属材质应没有反射探针');

  // 切换为高级渲染模式
  renderer.setAdvancedRendering(true);

  // 验证在高级模式下（enableAdvancedRendering = true）
  // 1. 主镜面：升级为 2048 像素的平面反射 MirrorTexture
  assert.ok(mainMat.reflectionTexture instanceof BABYLON.MirrorTexture, '高级模式下，主镜面应使用平面反射 MirrorTexture');
  assert.equal(mainMat.reflectionTexture.getRenderWidth(), 2048, '高级模式下，主镜面反射贴图大小应为 2048');

  // 2. 次要镜面：升级为 1024 像素的平面反射 MirrorTexture
  assert.ok(subMat.reflectionTexture instanceof BABYLON.MirrorTexture, '高级模式下，次要镜面应升级使用平面反射 MirrorTexture');
  assert.equal(subMat.reflectionTexture.getRenderWidth(), 1024, '高级模式下，次要镜面反射贴图大小应为 1024');
  assert.ok(!subMat.customReflectionProbe, '高级模式下，次要镜面反射探针应当被销毁');

  // 3. 金属：升级为 ReflectionProbe
  assert.ok(metalMat.customReflectionProbe instanceof BABYLON.ReflectionProbe, '高级模式下，金属应使用反射探针');

  // 再次切换回普通模式验证销毁与重建
  renderer.setAdvancedRendering(false);

  // 验证是否正确还原
  assert.ok(mainMat.reflectionTexture instanceof BABYLON.MirrorTexture, '重新切回普通模式后，主镜面应仍为平面反射');
  assert.equal(mainMat.reflectionTexture.getRenderWidth(), 256, '重新切回普通模式后，主镜面反射贴图大小应还原为 256');
  assert.ok(subMat.customReflectionProbe instanceof BABYLON.ReflectionProbe, '重新切回普通模式后，次要镜面应还原为反射探针');
  assert.ok(!metalMat.customReflectionProbe, '重新切回普通模式后，金属材质应还原');

  // 保存或场景内容变化后，主镜面与次要镜面的反射目标都必须能被强制刷新。
  let mirrorRefreshCount = 0;
  let probeRefreshCount = 0;
  mainMat.reflectionTexture.resetRefreshCounter = () => { mirrorRefreshCount += 1; };
  const subProbeRenderTarget = subMat.customReflectionProbe.cubeTexture;
  subProbeRenderTarget.resetRefreshCounter = () => { probeRefreshCount += 1; };

  renderer.requestReflectionTexturesUpdate();

  assert.equal(mirrorRefreshCount, 1, '强制刷新时应重置主镜面的 MirrorTexture');
  assert.equal(probeRefreshCount, 1, '强制刷新时应重置次要镜面的 ReflectionProbe');

  scene.dispose();
  engine.dispose();
});
