import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { createEditor, Blueprint3DTestMap } from '../src/index.js';

test('Consumer API: 独立创建、保存、加载与导出流程验证', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  const mockPlan = {
    unit: 'm',
    currentFloorId: 'floor_1',
    floors: [
      { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
    ],
    floor: {
      rooms: [
        { id: 'living', name: '客厅', x: 0, z: 0, width: 4, depth: 4 }
      ]
    },
    walls: [],
    openings: [],
    items: [],
    roofs: [],
    stairs: [],
    fences: []
  };

  // 1. 验证通过 createEditor 创建
  const editor = createEditor({ scene, floorplan: mockPlan });
  assert.ok(editor, '应成功创建 editor 实例');
  assert.equal(editor.floorplan.currentFloorId, 'floor_1');
  assert.equal(editor.renderingEnabled, true);

  // 2. 验证 exportJSON
  const json = editor.exportJSON();
  assert.equal(json.currentFloorId, 'floor_1');
  assert.notEqual(json, mockPlan, '导出的 json 应该是深克隆的拷贝');

  // 3. 验证 exportBuildingFile 与 stringifyBuildingFile
  const bFileObj = editor.exportBuildingFile({ name: 'test-proj' });
  assert.equal(bFileObj.format, 'blueprint3d-babylon.building.v1');
  const bFileStr = editor.stringifyBuildingFile({ name: 'test-proj' });
  assert.equal(typeof bFileStr, 'string');

  // 4. 验证 stringifyDXF
  const dxfText = editor.stringifyDXF();
  assert.equal(typeof dxfText, 'string');

  // 5. 验证 create3MFPackage
  const bytes = editor.create3MFPackage({ category: 'building' });
  assert.ok(bytes instanceof Uint8Array || bytes instanceof Blob || typeof bytes === 'object');

  // 6. 验证 loadJSON 并更新状态
  const newPlan = {
    ...mockPlan,
    currentFloorId: 'floor_2',
    floors: [{ id: 'floor_2', name: '2F', level: 1 }]
  };
  editor.loadJSON(newPlan);
  assert.equal(editor.floorplan.currentFloorId, 'floor_2');

  // 7. 验证 loadBuildingFile
  editor.loadBuildingFile(bFileStr);
  assert.equal(editor.floorplan.currentFloorId, 'floor_1'); // 重新加载了原来的文件

  scene.dispose();
  engine.dispose();
});

test('Blueprint3DTestMap 旧接口兼容性验证', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  const mockPlan = {
    unit: 'm',
    currentFloorId: 'floor_1',
    floors: [
      { id: 'floor_1', name: '1F', level: 0, wallHeight: 3.0, floorHeight: 0.06 }
    ],
    floor: { rooms: [] },
    walls: [],
    openings: [],
    items: [],
    roofs: [],
    stairs: [],
    fences: []
  };

  const map = new Blueprint3DTestMap(scene, { floorplan: mockPlan });

  // 验证原有对外暴露的属性和接口工作正常
  assert.equal(map.floorplan.currentFloorId, 'floor_1');
  assert.equal(map.renderingEnabled, true);

  // 验证代理的文件接口
  const exported = map.exportJSON();
  assert.equal(exported.currentFloorId, 'floor_1');

  const buildingFile = map.stringifyBuildingFile({ name: 'my-map' });
  assert.equal(typeof buildingFile, 'string');

  scene.dispose();
  engine.dispose();
});
