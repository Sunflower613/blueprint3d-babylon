import { FloorplanDocument } from '../domain/FloorplanDocument.js';
import { BabylonSceneRenderer } from '../runtime/BabylonSceneRenderer.js';
import { SelectionController } from './SelectionController.js';
import { ExportService } from '../services/ExportService.js';
import { getFurnitureDefinition } from '../furniture/index.js';
import { shouldIncludeShadowCaster } from '../runtime/shadowCasterFilter.js';

export class EditorFacade {
  /**
   * 构造通用 Consumer API 门面实例
   * @param {Object} params
   * @param {BABYLON.Scene} params.scene - Babylon.js 场景对象
   * @param {Object} params.floorplan - 初始户型数据
   * @param {Object} [params.options={}] - 配置选项
   */
  constructor({ scene, floorplan, options = {} }) {
    this.scene = scene;
    this._document = new FloorplanDocument(floorplan);
    this._renderer = new BabylonSceneRenderer(scene, this._document, options);
    this._selectionController = new SelectionController(scene, this._document, this._renderer);
    this._exportService = new ExportService(this._document);
    this._activePreview = null;
    this._previewState = 'idle';
    this._disposePromise = null;
  }

  /** @returns {Object} 户型平面图数据结构 */
  /** @deprecated Use getSnapshot/getProjectMetadata/getEntities instead. */
  get floorplan() {
    return this._document.floorplan;
  }

  /** @param {Object} val - 设置新的户型数据 */
  /** @deprecated Use loadJSON instead. */
  set floorplan(val) {
    this._document.floorplan = val;
  }

  /** @returns {boolean} 是否启用 3D 渲染 */
  get renderingEnabled() {
    return this._renderer.renderingEnabled;
  }

  /** @param {boolean} val - 设置是否启用 3D 渲染 */
  set renderingEnabled(val) {
    this._renderer.renderingEnabled = val;
  }

  /** 开启 3D 渲染并将脏数据重新构建 */
  enableRendering() {
    this._renderer.renderingEnabled = true;
    if (typeof this._renderer.build === 'function') {
      this._renderer.build();
    }
  }

  /** 关闭 3D 渲染功能 */
  disableRendering() {
    this._renderer.renderingEnabled = false;
  }

  /** 清除所有已构建的 3D 网格 */
  clearBuiltMeshes() {
    if (typeof this._renderer.clearBuiltMeshes === 'function') {
      this._renderer.clearBuiltMeshes();
    }
  }

  /**
   * 导出并返回干净克隆的 JSON 树格式户型数据模型
   * @returns {Object} 户型数据
   */
  exportJSON() {
    return this._exportService.exportJSON();
  }

  /**
   * 导出为工程文件格式的序列化对象
   * @param {Object} [options={}]
   * @returns {Object} 工程文件对象
   */
  exportBuildingFile(options = {}) {
    return this._exportService.exportBuildingFile(options);
  }

  /**
   * 将工程文件对象序列化为 JSON 字符串
   * @param {Object} [options={}]
   * @returns {string} 字符串化的工程文件
   */
  stringifyBuildingFile(options = {}) {
    return this._exportService.stringifyBuildingFile(options);
  }

  /**
   * 导出为 2D 矢量 DXF 格式字符串
   * @returns {string} DXF 格式字符串
   */
  stringifyDXF() {
    return this._exportService.stringifyDXF();
  }

  /**
   * 创建 3MF 格式三维制造模型安装包
   * @param {Object} [options={}]
   * @returns {Uint8Array|Blob|Object} 导出的 3MF 二进制数据包
   */
  create3MFPackage(options = {}) {
    const mergedOptions = {
      testMap: this,
      ...options
    };
    return this._exportService.create3MFPackage(mergedOptions);
  }

  /**
   * 整体加载并恢复 JSON 树格式户型数据模型，重置选择态并重建 3D 场景
   * @param {Object} data - 包含全属性 of JSON 数据结构
   */
  loadJSON(data) {
    if (this._previewState !== 'idle') return false;
    this._exportService.loadJSON(data);
    this._selectionController.selectedItemId =
      this._selectionController.selectedItemId && this._document.getItem(this._selectionController.selectedItemId)
        ? this._selectionController.selectedItemId
        : null;
    this._selectionController.selectedWallId =
      this._selectionController.selectedWallId && this._document.getWall(this._selectionController.selectedWallId)
        ? this._selectionController.selectedWallId
        : null;
    if (typeof this._renderer.build === 'function') {
      this._renderer.build();
    }
    return true;
  }

  /**
   * 整体反序列化加载并恢复整个 3D 工程文件的数据模型，重置选择态并重建 3D 场景
   * @param {ArrayBuffer|string} data - 待读取的工程序列化数据
   */
  loadBuildingFile(data) {
    if (this._previewState !== 'idle') return false;
    this._exportService.loadBuildingFile(data);
    this._selectionController.selectedItemId =
      this._selectionController.selectedItemId && this._document.getItem(this._selectionController.selectedItemId)
        ? this._selectionController.selectedItemId
        : null;
    this._selectionController.selectedWallId =
      this._selectionController.selectedWallId && this._document.getWall(this._selectionController.selectedWallId)
        ? this._selectionController.selectedWallId
        : null;
    if (typeof this._renderer.build === 'function') {
      this._renderer.build();
    }
    return true;
  }

  /**
   * 获取当前户型平面图数据的只读深拷贝快照
   * @returns {Object} 户型平面图快照
   */
  getSnapshot() {
    return JSON.parse(JSON.stringify(this._document.floorplan));
  }

  /**
   * Return lightweight document-level settings without exposing the mutable document.
   */
  getProjectMetadata() {
    const floorplan = this._document.floorplan;
    return JSON.parse(JSON.stringify({
      name: floorplan.name || '',
      unit: floorplan.unit || 'm',
      wallHeight: floorplan.wallHeight ?? 2.8,
      wallThickness: floorplan.wallThickness ?? 0.18,
      floorHeight: floorplan.floorHeight ?? 0.2,
      currentFloorId: floorplan.currentFloorId || 'floor_1'
    }));
  }

  /**
   * 获取当前楼层的 ID
   * @returns {string} 楼层 ID
   */
  getCurrentFloorId() {
    return this._document.floorplan.currentFloorId;
  }

  /**
   * 获取所有楼层配置的只读深拷贝列表
   * @returns {Array<Object>} 楼层列表
   */
  getFloors() {
    return JSON.parse(JSON.stringify(this._document.floorplan.floors || []));
  }

  /**
   * 根据 ID 获取单个楼层配置的只读深拷贝
   * @param {string} id - 楼层 ID
   * @returns {Object|null} 楼层配置
   */
  getFloor(id) {
    const floor = this._document.getFloor(id);
    return floor ? JSON.parse(JSON.stringify(floor)) : null;
  }

  /**
   * 根据类型和选项获取实体列表的只读深拷贝
   * @param {string} type - 实体类型
   * @param {Object} [options={}] - 过滤选项
   * @param {string} [options.floorId] - 限制楼层 ID
   * @returns {Array<Object>} 实体只读拷贝列表
   */
  getEntities(type, options = {}) {
    const normType = this._normalizeEntityType(type);
    if (!normType) return [];
    let list = [];
    if (normType === 'rooms') {
      list = this._document.floorplan.floor?.rooms || [];
    } else {
      list = this._document.floorplan[normType] || [];
    }
    if (options.floorId) {
      list = list.filter(entity => (entity.floorId || 'floor_1') === options.floorId);
    }
    return JSON.parse(JSON.stringify(list));
  }

  /**
   * 根据类型和 ID 获取单个实体的只读深拷贝
   * @param {string} type - 实体类型
   * @param {string} id - 实体 ID
   * @returns {Object|null} 实体只读拷贝
   */
  getEntity(type, id) {
    const normType = this._normalizeEntityType(type);
    if (!normType) return null;
    let entity;
    if (normType === 'rooms') {
      entity = this._document.floorplan.floor?.rooms?.find(e => e.id === id);
    } else {
      entity = (this._document.floorplan[normType] || []).find(e => e.id === id);
    }
    return entity ? JSON.parse(JSON.stringify(entity)) : null;
  }

  /** Return the room containing a world-space X/Z coordinate. */
  getRoomAt(x, z, options = {}) {
    const room = this._document.getRoomAt(x, z, options.floorId || this.getCurrentFloorId());
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  getWallLength(wallId) {
    return this._document.getWallLength(wallId);
  }

  /**
   * 获取当前楼层下特定类型的实体只读深拷贝列表
   * @param {string} type - 实体类型
   * @returns {Array<Object>} 实体只读拷贝列表
   */
  getCurrentFloorEntities(type) {
    return this.getEntities(type, { floorId: this.getCurrentFloorId() });
  }

  /**
   * 获取特定类型家具定义的只读拷贝
   * @param {string} type - 家具类型
   * @returns {Object|null} 家具只读定义
   */
  getFurnitureDefinition(type) {
    const def = getFurnitureDefinition(type);
    if (!def) return null;
    const copy = { ...def };
    if (def.interaction) {
      copy.interaction = { ...def.interaction };
    }
    return copy;
  }

  /**
   * 获取特定楼层的高度（绝对海拔）
   * @param {string} id - 楼层 ID
   * @returns {number} 楼层绝对海拔
   */
  getFloorElevation(id) {
    return this._document.getFloorElevation(id);
  }

  /**
   * 获取特定楼层在其层级（level）对应的高度数值
   * @param {string} floorId - 楼层 ID
   * @returns {number} 楼层层级
   */
  getFloorLevel(floorId) {
    return this._document.getFloorLevel(floorId);
  }

  /**
   * 计算楼梯的自动生成高度
   * @param {Object} stairs - 楼梯实体数据
   * @returns {number} 自动计算高度
   */
  getStairsAutoHeight(stairs) {
    return this._document.getStairsAutoHeight(stairs);
  }

  getEntityElevationOffset(type, entityOrId) {
    const entity = typeof entityOrId === 'string'
      ? this.getEntity(type, entityOrId)
      : entityOrId;
    if (!entity) return 0;
    const normType = this._normalizeEntityType(type);
    if (normType === 'openings') return this._document.getOpeningElevationOffset(entity);
    if (normType === 'fences') return this._document.getFenceElevationOffset(entity);
    if (normType === 'stairs') return this._document.getStairsElevationOffset(entity);
    if (normType === 'items') return this._document.getItemRoomElevationOffset(entity);
    return 0;
  }

  /**
   * 执行修改户型平面图数据的指令
   * @param {string} name - 指令名称
   * @param {Object} [args={}] - 指令参数
   * @returns {Object|boolean|void} 指令执行结果
   */
  executeCommand(name, args = {}) {
    if (this._previewState !== 'idle') return false;
    let result = null;

    switch (name) {
      // 1. 楼层命令
      case 'addFloor':
        result = this._document.addFloor(args);
        break;
      case 'deleteFloor':
        result = this._document.deleteFloor(args.floorId);
        break;
      case 'moveFloor':
        result = this._document.moveFloor(args.floorId, args.direction);
        break;
      case 'renameFloor':
        result = this._document.renameFloor(args.floorId, args.name);
        break;
      case 'setCurrentFloor':
        result = this._document.setCurrentFloor(args.floorId);
        break;
      case 'changeFloorHideSettings': {
        const skyboxEnabled = args.skybox !== undefined ? args.skybox : args.skyboxEnabled;
        result = this._document.changeFloorHideSettings(args.floorId, args.hideRoof, args.hideWall, skyboxEnabled);
        break;
      }
      case 'changeFloorHeight':
        result = this._document.changeFloorHeight(args.floorId, args.height);
        break;
      case 'changeFloorDefaultFloorHeight': {
        const floorHeight = args.floorHeight !== undefined ? args.floorHeight : args.height;
        result = this._document.changeFloorDefaultFloorHeight(args.floorId, floorHeight);
        break;
      }

      // 2. 房间命令
      case 'addRoom':
        result = this._document.addRoom(args);
        break;
      case 'updateRoom':
        result = this._document.updateRoom(args.roomId, args.patch, args.options);
        break;
      case 'deleteRoom':
        result = this._document.deleteRoom(args.roomId);
        break;
      case 'setRoomFloorMaterial':
        result = this._document.setRoomFloorMaterial(args.roomId, args.material);
        break;

      // 3. 墙体命令
      case 'addWall':
        result = this._document.addWall(args.from, args.to);
        break;
      case 'updateWall':
        result = this._document.updateWall(args.wallId, args.patch);
        break;
      case 'deleteWall':
        result = this._document.deleteWall(args.wallId);
        break;
      case 'updateWallLength':
        result = this._document.updateWallLength(args.wallId, args.length);
        break;

      // 4. 门窗命令
      case 'addOpening':
        result = this._document.addOpening(args.wallId, args.type, args.t, args.shape);
        break;
      case 'updateOpening':
        result = this._document.updateOpening(args.openingId, args.patch);
        break;
      case 'deleteOpening':
        result = this._document.deleteOpening(args.openingId);
        break;
      case 'updateOpeningMaterial':
        result = this._document.updateOpeningMaterial(args.openingId, args.componentKey, args.materialDescriptor);
        break;
      case 'resetOpeningMaterial':
        result = this._document.resetOpeningMaterial(args.openingId);
        break;

      // 5. 家具命令
      case 'addItem':
        result = this._document.addItem(args);
        break;
      case 'updateItem':
        result = this._document.updateItem(args.itemId, args.patch);
        break;
      case 'deleteItem':
        result = this._document.deleteItem(args.itemId);
        break;
      case 'updateItemComponentColor':
        result = this._document.updateItemComponentColor(args.itemId, args.componentId, args.color);
        break;
      case 'updateItemComponentMaterial':
        result = this._document.updateItemComponentMaterial(args.itemId, args.componentId, args.material);
        break;
      case 'rotateItem':
        result = this._document.rotateItem(args.itemId, args.rotationRadians);
        break;
      case 'assignItemToRoom':
        result = this._document.assignItemToRoom(args.itemId, args.roomId);
        break;
      case 'refreshItemRoomLinks':
        result = this._document.refreshItemRoomLinks();
        break;

      // 6. 屋顶命令
      case 'addRoof':
        result = this._document.addRoof(args);
        break;
      case 'updateRoof':
        result = this._document.updateRoof(args.roofId, args.patch);
        break;
      case 'deleteRoof':
        result = this._document.deleteRoof(args.roofId);
        break;

      // 7. 楼梯命令
      case 'addStairs':
        result = this._document.addStairs(args);
        break;
      case 'updateStairs':
        result = this._document.updateStairs(args.stairsId, args.patch);
        break;
      case 'deleteStairs':
        result = this._document.deleteStairs(args.stairsId);
        break;

      // 8. 围栏命令
      case 'addFence':
        result = this._document.addFence(args);
        break;
      case 'updateFence':
        result = this._document.updateFence(args.fenceId, args.patch);
        break;
      case 'deleteFence':
        result = this._document.deleteFence(args.fenceId);
        break;

      // 9. 围栏门命令
      case 'addFenceGate':
        result = this._document.addFenceGate(args);
        break;
      case 'updateFenceGate':
        result = this._document.updateFenceGate(args.gateId, args.patch);
        break;
      case 'deleteFenceGate':
        result = this._document.deleteFenceGate(args.gateId);
        break;

      // 10. 其它/通用/材质/锁定命令
      case 'setTargetLocked': {
        const { type, id, locked } = args;
        const value = !!locked;
        if (type === 'item') {
          const item = this._document.getItem(id);
          if (!item) return false;
          item.locked = value;
          this._renderer.setEntityLocked('items', id, value);
          result = true;
        } else {
          const updateCmds = {
            opening: 'updateOpening',
            roof: 'updateRoof',
            stairs: 'updateStairs',
            room: 'updateRoom',
            wall: 'updateWall',
            fence: 'updateFence',
            fencegate: 'updateFenceGate',
            fenceGate: 'updateFenceGate'
          };
          const cmd = updateCmds[type];
          if (cmd) {
            const patchKey = type === 'opening' ? 'openingId' : 
                             (type === 'room' ? 'roomId' : 
                             (type === 'wall' ? 'wallId' : 
                             (type === 'fence' ? 'fenceId' : 
                             (type === 'fence_gate' || type === 'fenceGate' ? 'gateId' : 
                             (type === 'roof' ? 'roofId' : 'stairsId')))));
            result = this.executeCommand(cmd, { [patchKey]: id, patch: { locked: value }, rebuild: false });
          }
        }
        break;
      }
      case 'updateStructure': {
        const { type, id, patch } = args;
        if (type === 'roof') {
          result = this._document.updateRoof(id, patch);
        } else if (type === 'stairs') {
          result = this._document.updateStairs(id, patch);
        } else if (type === 'fence') {
          result = this._document.updateFence(id, patch);
        }
        break;
      }
      case 'setFloorColor':
        result = this._document.setFloorColor(args.color);
        break;
      case 'setFloorMaterial':
        result = this._document.setFloorMaterial(args.material);
        break;

      default:
        console.warn(`Unknown command: ${name}`);
        return null;
    }

    // 后置处理：同步选中状态
    this._syncSelectionAfterChange();

    // 默认触发 3D 渲染更新
    if (args.rebuild !== false && this._renderer && typeof this._renderer.build === 'function') {
      const isItemCommand = ['addItem', 'updateItem', 'deleteItem'].includes(name);
      this._renderer.build({ rebuildType: isItemCommand ? 'items' : 'all' });
    }

    // 深拷贝返回快照，确保不直接暴露可变的数据层引用，而如果是基础类型/void直接返回
    if (result && typeof result === 'object') {
      return JSON.parse(JSON.stringify(result));
    }
    return result;
  }

  // Command conveniences. These keep consumers on the facade while preserving
  // readable call sites; all mutations still pass through executeCommand().
  addFloor(partialFloor = {}) { return this.executeCommand('addFloor', partialFloor); }
  deleteFloor(floorId) { return this.executeCommand('deleteFloor', { floorId }); }
  moveFloor(floorId, direction) { return this.executeCommand('moveFloor', { floorId, direction }); }
  renameFloor(floorId, name) { return this.executeCommand('renameFloor', { floorId, name }); }
  setCurrentFloor(floorId) { return this.executeCommand('setCurrentFloor', { floorId }); }
  addRoom(partialRoom = {}) { return this.executeCommand('addRoom', partialRoom); }
  updateRoom(roomId, patch, options = {}) { return this.executeCommand('updateRoom', { roomId, patch, options, rebuild: options.rebuild }); }
  deleteRoom(roomId) { return this.executeCommand('deleteRoom', { roomId }); }
  setRoomFloorMaterial(roomId, material) { return this.executeCommand('setRoomFloorMaterial', { roomId, material }); }
  addWall(from, to) { return this.executeCommand('addWall', { from, to }); }
  updateWall(wallId, patch, rebuild = true) { return this.executeCommand('updateWall', { wallId, patch, rebuild }); }
  deleteWall(wallId) { return this.executeCommand('deleteWall', { wallId }); }
  setWallLength(wallId, length) { return this.executeCommand('updateWallLength', { wallId, length }); }
  addOpening(wallId, type = 'door', t = 0.5, shape = 'square') { return this.executeCommand('addOpening', { wallId, type, t, shape }); }
  updateOpening(openingId, patch, rebuild = true) { return this.executeCommand('updateOpening', { openingId, patch, rebuild }); }
  deleteOpening(openingId) { return this.executeCommand('deleteOpening', { openingId }); }
  addItem(partialItem = {}) { return this.executeCommand('addItem', partialItem); }
  updateItem(itemId, patch, rebuild = true) { return this.executeCommand('updateItem', { itemId, patch, rebuild }); }
  deleteItem(itemId) { return this.executeCommand('deleteItem', { itemId }); }
  assignItemToRoom(itemId, roomId) { return this.executeCommand('assignItemToRoom', { itemId, roomId }); }
  refreshItemRoomLinks() { return this.executeCommand('refreshItemRoomLinks', { rebuild: false }); }
  addRoof(partialRoof = {}) { return this.executeCommand('addRoof', partialRoof); }
  updateRoof(roofId, patch, rebuild = true) { return this.executeCommand('updateRoof', { roofId, patch, rebuild }); }
  deleteRoof(roofId) { return this.executeCommand('deleteRoof', { roofId }); }
  addStairs(partialStairs = {}) { return this.executeCommand('addStairs', partialStairs); }
  updateStairs(stairsId, patch, rebuild = true) { return this.executeCommand('updateStairs', { stairsId, patch, rebuild }); }
  deleteStairs(stairsId) { return this.executeCommand('deleteStairs', { stairsId }); }
  addFence(partialFence = {}) { return this.executeCommand('addFence', partialFence); }
  updateFence(fenceId, patch, rebuild = true) { return this.executeCommand('updateFence', { fenceId, patch, rebuild }); }
  deleteFence(fenceId) { return this.executeCommand('deleteFence', { fenceId }); }
  addFenceGate(partialFenceGate = {}) { return this.executeCommand('addFenceGate', partialFenceGate); }
  updateFenceGate(gateId, patch, rebuild = true) { return this.executeCommand('updateFenceGate', { gateId, patch, rebuild }); }
  deleteFenceGate(gateId) { return this.executeCommand('deleteFenceGate', { gateId }); }
  setFloorColor(color) { return this.executeCommand('setFloorColor', { color }); }

  get advancedRenderingEnabled() {
    return !!this._renderer.enableAdvancedRendering;
  }

  setAdvancedRendering(enabled) {
    this._renderer.setAdvancedRendering(enabled);
  }

  refreshRendering() {
    if (this._previewState !== 'idle') return false;
    this._renderer.build();
    return true;
  }

  requestReflectionUpdate() {
    this._renderer.requestReflectionTexturesUpdate();
  }

  attachRuntimeOverlay(node) {
    if (!node || this._previewState === 'disposed') return false;
    node.parent = this._renderer.root;
    return true;
  }

  populateShadowGenerator(shadowGenerator, floorId = this.getCurrentFloorId()) {
    const shadowMap = shadowGenerator?.getShadowMap?.();
    if (!shadowMap) return false;
    shadowMap.renderList = [];
    for (const mesh of this._renderer.shadowCasters || []) {
      if (shouldIncludeShadowCaster(mesh, floorId)) shadowGenerator.addShadowCaster(mesh);
    }
    return true;
  }

  /** @private */
  _syncSelectionAfterChange() {
    if (!this._selectionController) return;
    if (this._selectionController.selectedItemId && !this._document.getItem(this._selectionController.selectedItemId)) {
      this._selectionController.selectedItemId = null;
    }
    if (this._selectionController.selectedWallId && !this._document.getWall(this._selectionController.selectedWallId)) {
      this._selectionController.selectedWallId = null;
    }
    if (this._selectionController.selectedRoomId && !this._document.getRoom(this._selectionController.selectedRoomId)) {
      this._selectionController.selectedRoomId = null;
    }
    if (this._selectionController.selectedRoofId && !this._document.getRoof(this._selectionController.selectedRoofId)) {
      this._selectionController.selectedRoofId = null;
    }
    if (this._selectionController.selectedStairsId && !this._document.getStairs(this._selectionController.selectedStairsId)) {
      this._selectionController.selectedStairsId = null;
    }
    if (this._selectionController.selectedFenceId && !this._document.getFence(this._selectionController.selectedFenceId)) {
      this._selectionController.selectedFenceId = null;
    }
    if (this._selectionController.selectedFenceGateId && !this._document.getFenceGate(this._selectionController.selectedFenceGateId)) {
      this._selectionController.selectedFenceGateId = null;
    }
  }

  /** @private */
  _normalizeEntityType(type) {
    if (typeof type !== 'string') return null;
    const typeMap = {
      room: 'rooms',
      rooms: 'rooms',
      wall: 'walls',
      walls: 'walls',
      opening: 'openings',
      openings: 'openings',
      item: 'items',
      items: 'items',
      roof: 'roofs',
      roofs: 'roofs',
      stair: 'stairs',
      stairs: 'stairs',
      fence: 'fences',
      fences: 'fences',
      fencegate: 'fenceGates',
      fencegates: 'fenceGates',
      fenceGate: 'fenceGates',
      fenceGates: 'fenceGates'
    };
    return typeMap[type.toLowerCase()] || typeMap[type] || null;
  }

  // ==========================================
  // 10. 资源释放方法
  // ==========================================
  dispose() {
    if (this._disposePromise) return this._disposePromise;
    this._disposePromise = this._disposeSafely();
    return this._disposePromise;
  }

  async _disposeSafely() {
    let completed = true;
    try {
      const preview = this._activePreview;
      let operation = null;
      if (preview && this._previewState === 'active') {
        operation = this.cancelEntityPreview(preview.type, preview.id);
      } else if (preview?.operation) {
        operation = preview.operation;
      }
      this._renderer?.cancelReadyWork?.();
      if (operation) await operation;
    } catch (error) {
      completed = false;
      console.error('Failed to finish active preview during dispose:', error);
    } finally {
      this._previewState = 'disposed';
      this._activePreview = null;
      if (this._selectionController?.roomSelectionOutlineMesh) {
        this._selectionController.roomSelectionOutlineMesh.dispose(false, true);
        this._selectionController.roomSelectionOutlineMesh = null;
      }
      if (this._renderer && typeof this._renderer.dispose === 'function') {
        await this._renderer.dispose();
      }
    }
    return completed;
  }

  // ==========================================
  // 11. 选中态属性与方法代理
  // ==========================================
  get selectedItemId() { return this._selectionController.selectedItemId; }
  set selectedItemId(val) { this._selectionController.selectedItemId = val; }
  get selectedWallId() { return this._selectionController.selectedWallId; }
  set selectedWallId(val) { this._selectionController.selectedWallId = val; }
  get selectedFenceId() { return this._selectionController.selectedFenceId; }
  set selectedFenceId(val) { this._selectionController.selectedFenceId = val; }
  get selectedFenceGateId() { return this._selectionController.selectedFenceGateId; }
  set selectedFenceGateId(val) { this._selectionController.selectedFenceGateId = val; }
  get selectedRoomId() { return this._selectionController.selectedRoomId; }
  set selectedRoomId(val) { this._selectionController.selectedRoomId = val; }
  get selectedRoofId() { return this._selectionController.selectedRoofId; }
  set selectedRoofId(val) { this._selectionController.selectedRoofId = val; }
  get selectedStairsId() { return this._selectionController.selectedStairsId; }
  set selectedStairsId(val) { this._selectionController.selectedStairsId = val; }
  get roomSelectionOutlineMesh() { return this._selectionController.roomSelectionOutlineMesh; }
  set roomSelectionOutlineMesh(val) { this._selectionController.roomSelectionOutlineMesh = val; }

  setSelectedItem(id) { this._selectionController.setSelectedItem(id); }
  setSelectedWall(id) { this._selectionController.setSelectedWall(id); }
  setSelectedFence(id) { this._selectionController.setSelectedFence(id); }
  setSelectedFenceGate(id) { this._selectionController.setSelectedFenceGate(id); }
  setSelectedRoom(id) { this._selectionController.setSelectedRoom(id); }
  setSelectedRoof(id) { this._selectionController.setSelectedRoof(id); }
  setSelectedStairs(id) { this._selectionController.setSelectedStairs(id); }

  // ==========================================
  // 12. 语义化拖拽预览接口
  // ==========================================
  /** @deprecated Runtime nodes are not part of the stable Consumer API. */
  getEntityRenderNode(type, id) {
    const normType = this._normalizeEntityType(type);
    return normType ? this._renderer.getEntityNode(normType, id) : null;
  }

  getEntityWorldTransform(type, id) {
    const normType = this._normalizeEntityType(type);
    return normType ? this._renderer.getEntityWorldTransform(normType, id) : null;
  }

  syncEntityPreview(type, id) {
    const normType = this._normalizeEntityType(type);
    return normType ? this._renderer.syncEntityPreview(normType, id) : false;
  }

  getEntityPreviewStatus() {
    return {
      state: this._previewState,
      type: this._activePreview?.type || null,
      id: this._activePreview?.id || null,
      resourceCount: this._renderer.getPreviewResourceCount()
    };
  }

  getRuntimePreviewResourceCount() {
    return this._renderer.getPreviewResourceCount();
  }

  beginEntityPreview(type, id) {
    const normType = this._normalizeEntityType(type);
    if (!normType || this._previewState !== 'idle' || this._activePreview) return false;
    if (!this.getEntity(normType, id)) return false;
    const preview = {
      type: normType,
      id,
      snapshot: this._document.createSnapshot(),
      operation: null
    };
    try {
      if (normType === 'openings') {
        this._selectionController.beginOpeningDragPreview(id);
      } else if (normType === 'fenceGates') {
        this._selectionController.beginFenceGateDragPreview(id);
      }
      this._activePreview = preview;
      this._previewState = 'active';
      return true;
    } catch (error) {
      this._activePreview = null;
      this._previewState = 'idle';
      throw error;
    }
  }

  updateEntityPreview(type, id, transform) {
    const normType = this._normalizeEntityType(type);
    if (this._previewState !== 'active' || !this._activePreview
      || normType !== this._activePreview.type || id !== this._activePreview.id) return false;

    const preview = this._activePreview;
    try {
      if (normType === 'items') {
        this._document.updateItem(id, transform);
      } else if (normType === 'rooms') {
        const moveItems = transform.moveItems !== false;
        const patch = { ...transform };
        delete patch.moveItems;
        this._document.updateRoom(id, patch, { moveItems, rebuild: false });
      } else if (normType === 'walls') {
        this._document.updateWall(id, transform);
      } else if (normType === 'fences') {
        this._document.updateFence(id, transform);
      } else if (normType === 'fenceGates') {
        this._document.updateFenceGate(id, transform);
      } else if (normType === 'openings') {
        this._document.updateOpening(id, transform);
      } else if (normType === 'roofs') {
        this._document.updateRoof(id, transform);
      } else if (normType === 'stairs') {
        this._document.updateStairs(id, transform);
      }
      this._renderer.syncEntityPreview(normType, id);
      return true;
    } catch (error) {
      try {
        this._document.restoreSnapshot(preview.snapshot);
        this._renderer.build();
      } catch (cleanupError) {
        console.error('Failed to clean up entity preview after update error:', cleanupError);
      } finally {
        if (this._activePreview === preview) this._activePreview = null;
        this._previewState = 'idle';
        this._syncSelectionAfterChange();
      }
      throw error;
    }
  }

  commitEntityPreview(type, id) {
    const normType = this._normalizeEntityType(type);
    const preview = this._activePreview;
    if (this._previewState !== 'active' || !preview
      || normType !== preview.type || id !== preview.id) return Promise.resolve(false);

    this._previewState = 'committing';
    preview.operation = (async () => {
      try {
        if (normType === 'openings') {
          const finished = await this._selectionController.finishOpeningDragPreview(id);
          if (!finished) this._renderer.build();
        } else if (normType === 'fenceGates') {
          const finished = await this._selectionController.finishFenceGateDragPreview(id);
          if (!finished) this._renderer.build();
        } else if (this._renderer && typeof this._renderer.build === 'function') {
          const rebuildType = normType === 'items' ? 'items' : 'all';
          this._renderer.build({ rebuildType });
        }
        return true;
      } finally {
        if (this._activePreview === preview) this._activePreview = null;
        if (this._previewState !== 'disposed') this._previewState = 'idle';
        this._syncSelectionAfterChange();
      }
    })();
    return preview.operation;
  }

  cancelEntityPreview(type, id) {
    const normType = this._normalizeEntityType(type);
    const preview = this._activePreview;
    if (this._previewState !== 'active' || !preview
      || normType !== preview.type || id !== preview.id) return Promise.resolve(false);

    this._previewState = 'cancelling';
    preview.operation = (async () => {
      try {
        this._document.restoreSnapshot(preview.snapshot);
        if (normType === 'openings') {
          const finished = await this._selectionController.finishOpeningDragPreview(id);
          if (!finished) this._renderer.build();
        } else if (normType === 'fenceGates') {
          const finished = await this._selectionController.finishFenceGateDragPreview(id);
          if (!finished) this._renderer.build();
        } else if (this._renderer && typeof this._renderer.build === 'function') {
          const rebuildType = normType === 'items' ? 'items' : 'all';
          this._renderer.build({ rebuildType });
        }
        return true;
      } finally {
        if (this._activePreview === preview) this._activePreview = null;
        if (this._previewState !== 'disposed') this._previewState = 'idle';
        this._syncSelectionAfterChange();
      }
    })();
    return preview.operation;
  }

}

/**
 * 实例化并返回 FloorplanDocument 实例
 * @param {Object} initialData - 初始户型数据
 * @returns {FloorplanDocument} Document 实例
 */
export function createDocument(initialData) {
  return new FloorplanDocument(initialData);
}

/**
 * 实例化并返回 3D 场景渲染器
 * @param {BABYLON.Scene} scene - 场景对象
 * @param {FloorplanDocument} document - 数据文档
 * @param {Object} [options={}] - 配置选项
 * @returns {BabylonSceneRenderer} 场景渲染器
 */
export function createBabylonRenderer(scene, document, options) {
  return new BabylonSceneRenderer(scene, document, options);
}

/**
 * 实例化通用编辑器门面类
 * @param {Object} params
 * @param {BABYLON.Scene} params.scene - 场景对象
 * @param {Object} params.floorplan - 初始户型数据
 * @param {Object} [params.options={}] - 配置选项
 * @returns {EditorFacade} Editor 门面实例
 */
export function createEditor({ scene, floorplan, options = {} } = {}) {
  return new EditorFacade({ scene, floorplan, options });
}
