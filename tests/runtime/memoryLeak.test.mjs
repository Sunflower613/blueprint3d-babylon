import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { BabylonSceneRenderer, FloorplanDocument } from '../../src/index.js';
import { createBlueprintMaterial } from '../../src/core/materials.js';

test('createBlueprintMaterial binds onDisposeObservable to release texture clones without leaks', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  const initialMaterialCount = scene.materials.length;

  const descriptor = {
    kind: 'texture',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    scale: 1
  };

  // 创建 50 个带有纹理的材质
  const createdMaterials = [];
  for (let i = 0; i < 50; i += 1) {
    const mat = createBlueprintMaterial(scene, `test_mat_${i}`, descriptor);
    createdMaterials.push(mat);
  }

  assert.equal(scene.materials.length, initialMaterialCount + 50);

  // 释放所有材质
  createdMaterials.forEach((mat) => mat.dispose(false, true));

  // 验证材质与关联的 Texture 克隆在 dispose 后全部释放干净
  const activeClones = scene.textures.filter((t) => t.name !== 'baseTexture' && t.isDisposed !== true);
  assert.ok(activeClones.length <= 1);

  scene.dispose();
  engine.dispose();
});

test('clearBuiltMeshes cleans up materials, textures, and ReflectionProbes completely during rebuild cycles', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const document = new FloorplanDocument({
    unit: 'm',
    currentFloorId: 'floor-1',
    floors: [{ id: 'floor-1', level: 0, floorHeight: 0.1, wallHeight: 2.8 }],
    floor: {
      rooms: [
        {
          id: 'room-1',
          name: '主卧',
          floorId: 'floor-1',
          shape: 'square',
          x: 0,
          z: 0,
          width: 5,
          depth: 5,
          material: {
            kind: 'texture',
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
          }
        }
      ]
    },
    walls: [],
    openings: [],
    items: [],
    roofs: [],
    stairs: [],
    fences: [],
    fenceGates: []
  });
  const renderer = new BabylonSceneRenderer(scene, document);

  const initialMatCount = scene.materials.filter((m) => !m.isDisposed).length;
  const initialProbeCount = scene.reflectionProbes ? scene.reflectionProbes.length : 0;

  // 模拟 10 次重建循环与反射探针创建
  for (let cycle = 0; cycle < 10; cycle += 1) {
    renderer.build();
    const mesh = BABYLON.MeshBuilder.CreateBox(`item_mirror_${cycle}`, { size: 1 }, scene);
    mesh.material = createBlueprintMaterial(scene, `item_mirror_mat_${cycle}`, { kind: 'mirror', color: '#ffffff' });
    mesh.parent = renderer.root;
    renderer.createReflectionProbeForMesh(mesh, `item_${cycle}`, mesh);
    renderer.clearBuiltMeshes();
  }

  const activeMaterials = scene.materials.filter((m) => !m.isDisposed);
  const finalProbeCount = scene.reflectionProbes ? scene.reflectionProbes.length : 0;

  // 验证 10 次重建与探针循环后，零残存 ReflectionProbe，材质无发散发膨胀
  assert.ok(activeMaterials.length <= initialMatCount + 1);
  assert.equal(finalProbeCount, initialProbeCount);

  renderer.dispose();
  scene.dispose();
  engine.dispose();
});
