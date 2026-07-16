import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import * as BABYLON from '@babylonjs/core';
import { createEditor, Blueprint3DTestMap, EditorFacade } from '../src/index.js';

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

  // 验证代理的只读 Query API 工作正常
  assert.equal(map.getCurrentFloorId(), 'floor_1');
  assert.equal(map.getFloors().length, 1);
  assert.equal(map.getFloor('floor_1').name, '1F');
  assert.ok(Array.isArray(map.getEntities('room')));

  const buildingFile = map.stringifyBuildingFile({ name: 'my-map' });
  assert.equal(typeof buildingFile, 'string');

  scene.dispose();
  engine.dispose();
});

test('Consumer API: 只读 Query API 及数据防篡改特性验证', () => {
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
    walls: [
      { id: 'w1', floorId: 'floor_1', from: [0, 0], to: [4, 0] }
    ],
    openings: [],
    items: [
      { id: 'item1', type: 'table', floorId: 'floor_1', x: 1, z: 1 }
    ],
    roofs: [],
    stairs: [],
    fences: []
  };

  const editor = createEditor({ scene, floorplan: mockPlan });

  // 1. getCurrentFloorId
  assert.equal(editor.getCurrentFloorId(), 'floor_1');

  // 2. getFloors & getFloor
  const floors = editor.getFloors();
  assert.equal(floors.length, 1);
  assert.equal(floors[0].name, '1F');
  
  const floor1 = editor.getFloor('floor_1');
  assert.ok(floor1);
  assert.equal(floor1.name, '1F');

  // 3. getEntities & getEntity
  const rooms = editor.getEntities('room');
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].name, '客厅');

  const livingRoom = editor.getEntity('room', 'living');
  assert.ok(livingRoom);
  assert.equal(livingRoom.name, '客厅');

  const items = editor.getEntities('item');
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'item1');

  // 4. getCurrentFloorEntities
  const floorRooms = editor.getCurrentFloorEntities('room');
  assert.equal(floorRooms.length, 1);
  assert.equal(floorRooms[0].id, 'living');

  // 5. getFloorElevation
  const elevation = editor.getFloorElevation('floor_1');
  assert.equal(typeof elevation, 'number');

  // 6. getFurnitureDefinition
  const tableDef = editor.getFurnitureDefinition('table');
  assert.ok(tableDef);
  assert.equal(tableDef.type, 'table');

  // 7. 验证防篡改性 (深拷贝)
  const snap = editor.getSnapshot();
  snap.unit = 'mm';
  snap.floor.rooms[0].name = '被篡改房间';
  
  const snapAgain = editor.getSnapshot();
  assert.equal(snapAgain.unit, 'm');
  assert.equal(snapAgain.floor.rooms[0].name, '客厅');

  livingRoom.name = '卧室';
  const livingRoomAgain = editor.getEntity('room', 'living');
  assert.equal(livingRoomAgain.name, '客厅');

  rooms[0].name = '厨房';
  const roomsAgain = editor.getEntities('room');
  assert.equal(roomsAgain[0].name, '客厅');

  scene.dispose();
  engine.dispose();
});

test('架构防腐守卫: 验证 example 下的所有 js 文件没有越权直接导入私有目录', () => {
  const exampleDir = path.resolve('example');
  
  function walkDir(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath, files);
      } else if (file.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const jsFiles = walkDir(exampleDir);
  const illegalImportRegex = /import\s+[\s\S]*?\s+from\s+['"](?:\.\.\/)*src\/(core|presets|rooms|furniture|geometry|domain|openings|runtime|services|audio|textures)\/.*?['"]/g;

  for (const filePath of jsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = illegalImportRegex.exec(content)) !== null) {
      const illegalPath = match[0];
      const relativePath = path.relative(process.cwd(), filePath);
      assert.fail(`越权导入错误: 文件 [${relativePath}] 直接导入了私有目录 [${illegalPath}]。所有外部依赖必须统一从 'src/index.js' 引入。`);
    }
  }
});

test('接口一致性自动反射测试: 确保 Blueprint3DTestMap 实现了 EditorFacade 的所有公开方法', () => {
  const facadeMethods = Object.getOwnPropertyNames(EditorFacade.prototype)
    .filter(method => method !== 'constructor' && !method.startsWith('_'));
  const testMapMethods = Object.getOwnPropertyNames(Blueprint3DTestMap.prototype);

  for (const method of facadeMethods) {
    const hasMethod = testMapMethods.includes(method) || typeof Blueprint3DTestMap.prototype[method] === 'function';
    assert.ok(
      hasMethod,
      `接口代理缺失: Blueprint3DTestMap 缺少对 EditorFacade 公开方法 [${method}] 的代理转发实现！`
    );
  }
});

test('静态方法调用分析测试: 确保 example 调用的所有 testMap 方法在原型链上都是存在的', () => {
  const exampleDir = path.resolve('example');

  function walkDir(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath, files);
      } else if (file.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const jsFiles = walkDir(exampleDir);
  const methodCallRegex = /(?:ctx\.)?testMap\.([a-zA-Z0-9_]+)\(/g;

  const getPrototypeMethods = (proto) => {
    let methods = [];
    let current = proto;
    while (current && current !== Object.prototype) {
      methods = methods.concat(Object.getOwnPropertyNames(current));
      current = Object.getPrototypeOf(current);
    }
    return new Set(methods);
  };

  const testMapAvailableMethods = getPrototypeMethods(Blueprint3DTestMap.prototype);

  const allowedOverrides = new Set([
    'on', 'off', 'emit',
    'build', 'clearBuiltMeshes',
    'renderingDirty',
    'getFurnitureDefinition',
    'getFloorElevation',
    'getFloorLevel',
    'getStairsAutoHeight'
  ]);

  for (const filePath of jsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = methodCallRegex.exec(content)) !== null) {
      const methodName = match[1];
      const exists = testMapAvailableMethods.has(methodName) || allowedOverrides.has(methodName);
      if (!exists) {
        const relativePath = path.relative(process.cwd(), filePath);
        assert.fail(`未定义的方法调用: 文件 [${relativePath}] 调用了未定义的方法 [testMap.${methodName}()], 这将导致运行时崩溃！`);
      }
    }
  }
});
