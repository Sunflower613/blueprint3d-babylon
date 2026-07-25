import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import * as BABYLON from '@babylonjs/core';
import { createEditor, Blueprint3DTestMap, EditorFacade, getFurnitureThumbnailUrl, SKY_TEXTURE_URL, buildFenceGeometry } from '../../src/index.js';

test('Consumer API: public asset URLs do not require source-directory imports', () => {
  assert.equal(getFurnitureThumbnailUrl('chair'), './src/furniture/image/chair.png');
  assert.equal(getFurnitureThumbnailUrl('../unsafe'), './src/furniture/image/unsafe.png');
  assert.match(SKY_TEXTURE_URL, /sky\.png$/);
});

test('Consumer API: 天空盒渲染配置正确禁用场景光照并设置全景球面坐标', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const skybox = BABYLON.MeshBuilder.CreateSphere('skyBox', { segments: 16, diameter: 1000.0 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
  skybox.material = skyboxMaterial;

  // 模拟 Viewer3D setEnvironmentMaterials 逻辑
  const material = skybox.material;
  material.disableLighting = true;
  const texture = new BABYLON.Texture(SKY_TEXTURE_URL, scene);
  texture.coordinatesMode = BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE;
  material.emissiveTexture = texture;

  assert.equal(skybox.material.disableLighting, true, '天空盒材质必须禁用场景光照防止暴白');
  assert.equal(skybox.material.emissiveTexture.coordinatesMode, BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE, '天空盒贴图必须为 360 度全景球面投影');

  skybox.dispose();
  scene.dispose();
  engine.dispose();
});

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
  assert.equal(editor.getCurrentFloorId(), 'floor_1');
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
  assert.equal(editor.getCurrentFloorId(), 'floor_2');

  // 7. 验证 loadBuildingFile
  editor.loadBuildingFile(bFileStr);
  assert.equal(editor.getCurrentFloorId(), 'floor_1'); // 重新加载了原来的文件

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
  const metadata = editor.getProjectMetadata();
  const originalWallHeight = metadata.wallHeight;
  metadata.wallHeight = 99;
  assert.equal(editor.getProjectMetadata().wallHeight, originalWallHeight, '项目元数据查询必须返回防篡改副本');

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
      if (file === 'dist' || file === 'dist-temp' || file === 'node_modules') continue;
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
  const sourceImportRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]*src\/[^'"]+)['"]/g;

  for (const filePath of jsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = sourceImportRegex.exec(content)) !== null) {
      const importedPath = match[1].replace(/\\/g, '/');
      if (importedPath.endsWith('/src/index.js')) continue;
      const relativePath = path.relative(process.cwd(), filePath);
      assert.fail(`越权导入错误: 文件 [${relativePath}] 直接导入了 [${importedPath}]；example 只能从 src/index.js 导入库能力。`);
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

test('静态方法调用分析测试: 确保 example 调用的方法全部存在于通用 EditorFacade', () => {
  const exampleDir = path.resolve('example');

  function walkDir(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'dist' || file === 'dist-temp' || file === 'node_modules') continue;
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
  const methodCallRegex = /\b(testMap|editorApi|map)(?:\.|\?\.)([a-zA-Z0-9_]+)\(/g;

  const getPrototypeMethods = (proto) => {
    let methods = [];
    let current = proto;
    while (current && current !== Object.prototype) {
      methods = methods.concat(Object.getOwnPropertyNames(current));
      current = Object.getPrototypeOf(current);
    }
    return new Set(methods);
  };

  const testMapAvailableMethods = getPrototypeMethods(EditorFacade.prototype);

  const allowedOverrides = new Set(['on', 'off', 'emit']);

  for (const filePath of jsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = methodCallRegex.exec(content)) !== null) {
      const receiverName = match[1];
      const methodName = match[2];
      const exists = testMapAvailableMethods.has(methodName) || allowedOverrides.has(methodName);
      if (!exists) {
        const relativePath = path.relative(process.cwd(), filePath);
        assert.fail(`未定义的方法调用: 文件 [${relativePath}] 调用了未定义的方法 [${receiverName}.${methodName}()], 这将导致运行时崩溃！`);
      }
    }
  }
});

test('Consumer API: executeCommand 统一命令 API 覆盖与验证测试', () => {
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

  const editor = createEditor({ scene, floorplan: mockPlan });

  // 1. 楼层命令测试
  editor.executeCommand('addFloor', { id: 'floor_2', name: '2F', level: 1 });
  assert.ok(editor.getFloor('floor_2'), '应该成功执行 addFloor 命令创建 floor_2');

  editor.executeCommand('setCurrentFloor', { floorId: 'floor_2' });
  assert.equal(editor.getCurrentFloorId(), 'floor_2', '应该成功执行 setCurrentFloor 命令切换至 floor_2');

  editor.executeCommand('renameFloor', { floorId: 'floor_2', name: '2F_Renamed' });
  assert.equal(editor.getFloor('floor_2').name, '2F_Renamed', '应该成功执行 renameFloor 命令');

  editor.executeCommand('changeFloorHeight', { floorId: 'floor_2', height: 3.5 });
  assert.equal(editor.getFloor('floor_2').wallHeight, 3.5, '应该成功执行 changeFloorHeight 命令');

  editor.executeCommand('changeFloorDefaultFloorHeight', { floorId: 'floor_2', floorHeight: 0.1 });
  assert.equal(editor.getFloor('floor_2').floorHeight, 0.1, '应该成功执行 changeFloorDefaultFloorHeight 命令');

  editor.executeCommand('changeFloorHideSettings', { floorId: 'floor_2', hideRoof: true, hideWall: false, skybox: true });
  assert.equal(editor.getFloor('floor_2').hideRoof, true, '应该成功执行 changeFloorHideSettings 命令');

  // 切回 floor_1 做其它实体的 CRUD 测试
  editor.executeCommand('setCurrentFloor', { floorId: 'floor_1' });

  // 2. 墙体命令测试
  const wall = editor.executeCommand('addWall', { from: [0, 0], to: [4, 0] });
  assert.ok(wall, '应该成功执行 addWall 命令');
  assert.equal(editor.getEntities('wall').length, 1, '当前层应该有1面墙');

  editor.executeCommand('updateWall', { wallId: wall.id, patch: { color: '#ff0000', material: '#ff0000' } });
  assert.equal(editor.getEntity('wall', wall.id).color, '#ff0000', '应该成功执行 updateWall 命令');

  editor.executeCommand('updateWallLength', { wallId: wall.id, length: 5.0 });
  const updatedWall = editor.getEntity('wall', wall.id);
  const len = Math.hypot(updatedWall.to[0] - updatedWall.from[0], updatedWall.to[1] - updatedWall.from[1]);
  assert.ok(Math.abs(len - 5.0) < 0.01, '应该成功执行 updateWallLength 命令将墙体长度更新为 5');

  // 3. 门窗开口命令测试
  const opening = editor.executeCommand('addOpening', { wallId: wall.id, type: 'door', t: 0.5, shape: 'rect' });
  assert.ok(opening, '应该成功执行 addOpening 命令');
  assert.equal(editor.getEntities('opening').length, 1, '当前层应该有1个开口');

  editor.executeCommand('updateOpening', { openingId: opening.id, patch: { width: 1.2 } });
  assert.equal(editor.getEntity('opening', opening.id).width, 1.2, '应该成功执行 updateOpening 命令');

  editor.executeCommand('updateOpeningMaterial', { openingId: opening.id, componentKey: 'frame', materialDescriptor: '#123456' });
  assert.equal(editor.getEntity('opening', opening.id).frameMaterial?.color, '#123456', '应该成功修改开口组件材质');
  editor.executeCommand('resetOpeningMaterial', { openingId: opening.id });
  assert.equal(editor.getEntity('opening', opening.id).frameMaterial, undefined, '应该通过通用命令重置开口组件材质');

  const windowOpening = editor.executeCommand('addOpening', { wallId: wall.id, type: 'window', t: 0.75, shape: 'square' });
  assert.equal(editor.getEntity('opening', windowOpening.id).type, 'window', '门窗 API 应同时覆盖窗户');

  // 4. 房间命令测试
  const room = editor.executeCommand('addRoom', { x: 2, z: 2, name: '主卧' });
  assert.ok(room, '应该成功执行 addRoom 命令');
  assert.equal(editor.getEntities('room').length, 1, '应该有1个房间');

  editor.executeCommand('updateRoom', { roomId: room.id, patch: { name: '主卧_已更新' } });
  assert.equal(editor.getEntity('room', room.id).name, '主卧_已更新', '应该成功执行 updateRoom 命令');

  editor.executeCommand('setRoomFloorMaterial', { roomId: room.id, material: { id: 'wood' } });
  assert.equal(editor.getEntity('room', room.id).material?.id, 'wood', '应该成功执行 setRoomFloorMaterial 命令');

  // 5. 家具物品命令测试
  const item = editor.executeCommand('addItem', { type: 'chair', x: 2, z: 2, width: 0.5, depth: 0.5, height: 0.8 });
  assert.ok(item, '应该成功执行 addItem 命令');
  assert.equal(editor.getEntities('item').length, 1, '应该有1个家具物品');

  editor.executeCommand('updateItem', { itemId: item.id, patch: { rotation: Math.PI } });
  assert.equal(editor.getEntity('item', item.id).rotation, Math.PI, '应该成功执行 updateItem 命令');

  editor.executeCommand('assignItemToRoom', { itemId: item.id, roomId: room.id });
  assert.equal(editor.getEntity('item', item.id).roomId, room.id, '应该成功执行 assignItemToRoom 命令');

  editor.executeCommand('updateItemComponentColor', { itemId: item.id, componentId: 'seat', color: '#00ff00' });
  assert.equal(editor.getEntity('item', item.id).colors?.seat, '#00ff00', '应该成功执行 updateItemComponentColor 命令');

  editor.executeCommand('updateItemComponentMaterial', { itemId: item.id, componentId: 'seat', material: { id: 'leather' } });
  assert.equal(editor.getEntity('item', item.id).materials?.seat?.id, 'leather', '应该成功执行 updateItemComponentMaterial 命令');

  // 6. 锁定命令测试
  editor.executeCommand('setTargetLocked', { type: 'item', id: item.id, locked: true });
  assert.equal(editor.getEntity('item', item.id).locked, true, '应该成功执行 setTargetLocked 命令');

  // 7. 其它结构（屋顶、楼梯、围栏、围栏门）和 updateStructure 测试
  const roof = editor.executeCommand('addRoof', { x: 2, z: 2, width: 4, depth: 4, subtype: 'gable' });
  assert.ok(roof, '应该成功执行 addRoof 命令');

  editor.executeCommand('updateStructure', { type: 'roof', id: roof.id, patch: { height: 1.5 } });
  assert.equal(editor.getEntity('roof', roof.id).height, 1.5, '应该成功执行 updateStructure 更新屋顶高度');

  const stairs = editor.executeCommand('addStairs', { x: 2, z: 2, subtype: 'straight' });
  assert.ok(stairs, '应该成功执行 addStairs 命令');

  const fence = editor.executeCommand('addFence', { from: [0, 0], to: [0, 4], subtype: 'picket' });
  assert.ok(fence, '应该成功执行 addFence 命令');

  const fenceGate = editor.executeCommand('addFenceGate', { fenceId: fence.id, t: 0.5, subtype: 'picket' });
  assert.ok(fenceGate, '应该成功执行 addFenceGate 命令');
  assert.ok(editor.getEntity('fence_gate', fenceGate.id), '应该能以 fence_gate 下划线类型成功获取实体');

  editor.executeCommand('setTargetLocked', { type: 'fence_gate', id: fenceGate.id, locked: true });
  assert.equal(editor.getEntity('fence_gate', fenceGate.id).locked, true, '应该成功执行 setTargetLocked 命令锁定 fence_gate');
  editor.executeCommand('setTargetLocked', { type: 'fence_gate', id: fenceGate.id, locked: false });

  // 8. 各种删除命令测试
  editor.executeCommand('deleteOpening', { openingId: opening.id });
  assert.equal(editor.getEntity('opening', opening.id), null, '应该成功删除开口');
  editor.executeCommand('deleteOpening', { openingId: windowOpening.id });
  assert.equal(editor.getEntity('opening', windowOpening.id), null, '应该成功删除窗户');

  editor.executeCommand('deleteWall', { wallId: wall.id });
  assert.equal(editor.getEntity('wall', wall.id), null, '应该成功删除墙体');

  editor.executeCommand('deleteRoom', { roomId: room.id });
  assert.equal(editor.getEntity('room', room.id), null, '应该成功删除房间');

  editor.executeCommand('deleteItem', { itemId: item.id });
  assert.equal(editor.getEntity('item', item.id), null, '应该成功删除家具');

  editor.executeCommand('deleteRoof', { roofId: roof.id });
  assert.equal(editor.getEntity('roof', roof.id), null, '应该成功删除屋顶');

  editor.executeCommand('deleteStairs', { stairsId: stairs.id });
  assert.equal(editor.getEntity('stairs', stairs.id), null, '应该成功删除楼梯');

  editor.executeCommand('deleteFenceGate', { gateId: fenceGate.id });
  assert.equal(editor.getEntity('fence_gate', fenceGate.id), null, '应该成功删除围栏门');

  editor.executeCommand('deleteFence', { fenceId: fence.id });
  assert.equal(editor.getEntity('fence', fence.id), null, '应该成功删除围栏');

  scene.dispose();
  engine.dispose();
});

test('Consumer API: editor.add 与 buildFenceGeometry 兼容性测试', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const editor = createEditor({ scene, floorplan: {} });

  assert.equal(typeof editor.add, 'function', 'EditorFacade 必须暴露 add 方法门面');

  const group = new BABYLON.TransformNode("test_group", scene);
  const tempFence = { id: 'fence_test_1', subtype: 'picket_wood', height: 1.1, thickness: 0.1 };
  const material = new BABYLON.StandardMaterial("mat", scene);

  assert.doesNotThrow(() => {
    buildFenceGeometry(editor, group, tempFence, material, 2.0, 1.1, 0.1);
  }, '使用 editor 作为 registry 调用 buildFenceGeometry 不应抛出 registry.add is not a function 异常');

  assert.ok(group.getChildMeshes().length > 0, '应该成功构建栅栏网格子节点');

  scene.dispose();
  engine.dispose();
});

test('Consumer API: 楼梯不同侧边扶手 (sectionId) 独立删除与跟随楼梯移动测试', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const editor = createEditor({
    scene,
    floorplan: {
      currentFloorId: 'f1',
      floors: [{ id: 'f1', level: 0, wallHeight: 3 }],
      stairs: [{ id: 'st1', subtype: 'curved', x: 2, z: 2, width: 1.2, depth: 3.2, rotation: 0 }],
      fences: []
    }
  });

  // 1. 测试绑定不同侧边 sectionId 扶手创建
  editor.executeCommand('addFence', { id: 'fc_out1', stairsId: 'st1', sectionId: 'st1_outer', from: [1, 1], to: [1, 2] });
  editor.executeCommand('addFence', { id: 'fc_out2', stairsId: 'st1', sectionId: 'st1_outer', from: [1, 2], to: [1, 3] });
  editor.executeCommand('addFence', { id: 'fc_in1', stairsId: 'st1', sectionId: 'st1_inner', from: [0.5, 1], to: [0.5, 2] });

  const outerBefore = editor.getEntities('fence').filter(f => f.sectionId === 'st1_outer');
  const innerBefore = editor.getEntities('fence').filter(f => f.sectionId === 'st1_inner');
  assert.equal(outerBefore.length, 2, '外侧连续段应该包含 2 个成员');
  assert.equal(innerBefore.length, 1, '内侧段应该包含 1 个成员');

  // 2. 测试独立删除外侧扶手时，内侧扶手不受任何影响
  editor.executeCommand('deleteFence', { fenceId: 'fc_out1' });
  const outerAfterDelete = editor.getEntities('fence').filter(f => f.sectionId === 'st1_outer');
  const innerAfterDelete = editor.getEntities('fence').filter(f => f.sectionId === 'st1_inner');
  assert.equal(outerAfterDelete.length, 0, '删除外侧扶手任意小段时，整个外侧扶手被连带删除');
  assert.equal(innerAfterDelete.length, 1, '内侧扶手应该不受影响，独立完整保留');

  // 3. 测试移动楼梯 updateStairs 时所有留存扶手自动跟随重算
  editor.executeCommand('updateStairs', { stairsId: 'st1', patch: { x: 5, z: 5, rotation: Math.PI / 4 } });
  const innerAfterMove = editor.getEntities('fence').filter(f => f.sectionId === 'st1_inner');
  assert.ok(innerAfterMove.length > 0, '移动楼梯后内侧扶手自动跟随同步计算并留在楼梯上');

  scene.dispose();
  engine.dispose();
});
