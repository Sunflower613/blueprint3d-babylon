import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { ExportService } from '../src/services/ExportService.js';
import { Blueprint3DTestMap } from '../src/presets/blueprintTestMap.js';

test('ExportService：独立导出与加载服务功能测试', () => {
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

  const doc = new FloorplanDocument(mockPlan);
  const service = new ExportService(doc);

  // 1. 测试 exportJSON
  const exported = service.exportJSON();
  assert.equal(exported.currentFloorId, 'floor_1');
  assert.equal(exported.floor.rooms[0].id, 'living');
  // 确保是克隆的
  assert.notEqual(exported, doc.floorplan);

  // 2. 测试 exportBuildingFile 与 stringifyBuildingFile
  const buildingFileData = service.exportBuildingFile();
  assert.equal(typeof buildingFileData, 'object');
  assert.equal(buildingFileData.format, 'blueprint3d-babylon.building.v1');
  const buildingFileStr = service.stringifyBuildingFile();
  assert.equal(typeof buildingFileStr, 'string');

  // 3. 测试 stringifyDXF
  const dxfStr = service.stringifyDXF();
  assert.equal(typeof dxfStr, 'string');

  // 4. 测试 create3MFPackage
  const package3mf = service.create3MFPackage();
  assert.ok(package3mf instanceof Uint8Array || package3mf instanceof Blob || typeof package3mf === 'object');

  // 5. 测试 loadJSON 与 loadBuildingFile
  const newPlan = {
    ...mockPlan,
    currentFloorId: 'floor_2',
    floors: [{ id: 'floor_2', name: '2F', level: 1 }]
  };
  service.loadJSON(newPlan);
  assert.equal(doc.floorplan.currentFloorId, 'floor_2');

  const fileData = service.exportBuildingFile();
  service.loadBuildingFile(fileData);
  assert.equal(doc.floorplan.currentFloorId, 'floor_2');
});

test('Blueprint3DTestMap：代理向下兼容测试', async () => {
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

  // 1. 验证 exportService 的挂载
  assert.ok(map.exportService instanceof ExportService, 'exportService 应被成功实例化并挂载到 map 上');

  // 2. 验证 exportJSON 代理
  const exported = map.exportJSON();
  assert.equal(exported.currentFloorId, 'floor_1');

  // 3. 验证 loadJSON 并能够正常 build 和清理选中状态
  map.selectedItemId = 'some_item';
  const newPlan = {
    ...mockPlan,
    currentFloorId: 'floor_2',
    floors: [{ id: 'floor_2', name: '2F', level: 1 }]
  };
  map.loadJSON(newPlan);

  assert.equal(map.floorplan.currentFloorId, 'floor_2');
  assert.equal(map.selectedItemId, null, '加载新文件后，选中状态应重置');

  scene.dispose();
  engine.dispose();
});
