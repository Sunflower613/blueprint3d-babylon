import { FloorplanDocument } from '../domain/FloorplanDocument.js';
import { BabylonSceneRenderer } from '../runtime/BabylonSceneRenderer.js';
import { SelectionController } from './SelectionController.js';
import { ExportService } from '../services/ExportService.js';
import { getFurnitureDefinition } from '../furniture/index.js';
import { triangulateRoom } from '../rooms/index.js';
import { VertexData } from '../core/babylon.js';

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
  }

  /** @returns {Object} 户型平面图数据结构 */
  get floorplan() {
    return this._document.floorplan;
  }

  /** @param {Object} val - 设置新的户型数据 */
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
  }

  /**
   * 整体反序列化加载并恢复整个 3D 工程文件的数据模型，重置选择态并重建 3D 场景
   * @param {ArrayBuffer|string} data - 待读取的工程序列化数据
   */
  loadBuildingFile(data) {
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
  }

  /**
   * 获取当前户型平面图数据的只读深拷贝快照
   * @returns {Object} 户型平面图快照
   */
  getSnapshot() {
    return JSON.parse(JSON.stringify(this._document.floorplan));
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
    return def ? JSON.parse(JSON.stringify(def)) : null;
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

  /**
   * 执行修改户型平面图数据的指令
   * @param {string} name - 指令名称
   * @param {Object} [args={}] - 指令参数
   * @returns {Object|boolean|void} 指令执行结果
   */
  executeCommand(name, args = {}) {
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
      case 'changeFloorHideSettings':
        result = this._document.changeFloorHideSettings(args.floorId, args.hideRoof, args.hideWall, args.skyboxEnabled);
        break;
      case 'changeFloorHeight':
        result = this._document.changeFloorHeight(args.floorId, args.height);
        break;
      case 'changeFloorDefaultFloorHeight':
        result = this._document.changeFloorDefaultFloorHeight(args.floorId, args.floorHeight);
        break;

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
          const node = this._renderer.itemNodes?.get(id);
          if (node) node.metadata = { ...(node.metadata || {}), locked: value };
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
      this._renderer.build();
    }

    // 深拷贝返回快照，确保不直接暴露可变的数据层引用，而如果是基础类型/void直接返回
    if (result && typeof result === 'object') {
      return JSON.parse(JSON.stringify(result));
    }
    return result;
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
    if (this._activePreview) {
      this.cancelEntityPreview(this._activePreview.type, this._activePreview.id);
    }
    if (this._renderer && typeof this._renderer.dispose === 'function') {
      this._renderer.dispose();
    }
    if (this._selectionController) {
      if (this._selectionController.roomSelectionOutlineMesh) {
        this._selectionController.roomSelectionOutlineMesh.dispose(false, true);
        this._selectionController.roomSelectionOutlineMesh = null;
      }
    }
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
  getEntityRenderNode(type, id) {
    const normType = this._normalizeEntityType(type);
    if (!normType) return null;
    if (normType === 'items') return this._renderer.itemNodes?.get(id) || null;
    if (normType === 'walls') return this._renderer.wallNodes?.get(id) || null;
    if (normType === 'rooms') return this._renderer.floorNodes?.get(id) || null;
    if (normType === 'openings') return this._renderer.openingNodes?.get(id) || null;
    if (normType === 'roofs') return this._renderer.roofNodes?.get(id) || null;
    if (normType === 'stairs') return this._renderer.stairNodes?.get(id) || null;
    if (normType === 'fences') return this._renderer.fenceNodes?.get(id) || null;
    if (normType === 'fenceGates') return this._renderer.fenceGateNodes?.get(id) || null;
    return null;
  }

  beginEntityPreview(type, id) {
    const normType = this._normalizeEntityType(type);
    if (!normType) return false;
    const originalData = this.getEntity(type, id);
    if (!originalData) return false;
    this._activePreview = {
      type: normType,
      id,
      originalData
    };
    if (normType === 'openings') {
      this._selectionController.beginOpeningDragPreview(id);
    } else if (normType === 'fenceGates') {
      this._selectionController.beginFenceGateDragPreview(id);
    }
    return true;
  }

  updateEntityPreview(type, id, transform) {
    if (!this._activePreview || this._activePreview.id !== id) return false;
    const normType = this._normalizeEntityType(type);
    if (normType !== this._activePreview.type) return false;

    if (normType === 'items') {
      this._document.updateItem(id, transform);
      this._syncItemPreview(id);
    } else if (normType === 'rooms') {
      const moveItems = transform.moveItems !== false;
      const patch = { ...transform };
      delete patch.moveItems;
      this._document.updateRoom(id, patch, { moveItems, rebuild: false });
      this._syncRoomPreview(id);
    } else if (normType === 'walls') {
      this._document.updateWall(id, transform);
      this._syncWallPreview(id);
    } else if (normType === 'fences') {
      this._document.updateFence(id, transform);
      this._syncFencePreview(id);
    } else if (normType === 'fenceGates') {
      this._document.updateFenceGate(id, transform);
      this._selectionController.updateFenceGateNodeTransform(id);
    } else if (normType === 'openings') {
      this._document.updateOpening(id, transform);
      this._selectionController.updateOpeningNodePose(id);
    } else if (normType === 'roofs') {
      this._document.updateRoof(id, transform);
      this._syncRoofPreview(id);
    } else if (normType === 'stairs') {
      this._document.updateStairs(id, transform);
      this._syncStairsPreview(id);
    }
    return true;
  }

  async commitEntityPreview(type, id) {
    if (!this._activePreview || this._activePreview.id !== id) return false;
    const normType = this._normalizeEntityType(type);
    if (normType === 'openings') {
      await this._selectionController.finishOpeningDragPreview(id);
    } else if (normType === 'fenceGates') {
      await this._selectionController.finishFenceGateDragPreview(id);
    } else {
      if (this._renderer && typeof this._renderer.build === 'function') {
        this._renderer.build();
      }
    }
    this._activePreview = null;
    this._syncSelectionAfterChange();
    return true;
  }

  cancelEntityPreview(type, id) {
    if (!this._activePreview || this._activePreview.id !== id) return false;
    const normType = this._normalizeEntityType(type);
    
    // 恢复内存数据
    if (normType === 'items') {
      const idx = this._document.floorplan.items.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.items[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'rooms') {
      const idx = this._document.floorplan.floor.rooms.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.floor.rooms[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'walls') {
      const idx = this._document.floorplan.walls.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.walls[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'fences') {
      const idx = this._document.floorplan.fences.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.fences[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'fenceGates') {
      const idx = this._document.floorplan.fenceGates.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.fenceGates[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'openings') {
      const idx = this._document.floorplan.openings.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.openings[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'roofs') {
      const idx = this._document.floorplan.roofs.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.roofs[idx] = { ...this._activePreview.originalData };
    } else if (normType === 'stairs') {
      const idx = this._document.floorplan.stairs.findIndex(e => e.id === id);
      if (idx !== -1) this._document.floorplan.stairs[idx] = { ...this._activePreview.originalData };
    }

    if (normType === 'openings') {
      this._selectionController.finishOpeningDragPreview(id);
    } else if (normType === 'fenceGates') {
      this._selectionController.finishFenceGateDragPreview(id);
    } else {
      if (this._renderer && typeof this._renderer.build === 'function') {
        this._renderer.build();
      }
    }
    this._activePreview = null;
    this._syncSelectionAfterChange();
    return true;
  }

  // ==========================================
  // 13. 预览节点位姿同步辅助函数
  // ==========================================
  _syncItemPreview(id) {
    const item = this._document.getItem(id);
    const node = this.getEntityRenderNode('item', id);
    if (!item || !node) return;
    const floorY = this._document.getFloorElevation(item.floorId || this.getCurrentFloorId());
    const roomOffset = this._renderer.getItemRoomElevationOffset ? this._renderer.getItemRoomElevationOffset(item) : 0;
    node.position.set(item.x, floorY + (item.elevation || 0) / 39.37 + roomOffset, item.z);
    if (item.rotation !== undefined) {
      node.rotation.y = item.rotation;
    }
  }

  _syncRoomPreview(id) {
    const room = this._document.getRoom(id);
    if (!room) return;
    const floorY = this._document.getFloorElevation(room.floorId || this.getCurrentFloorId());
    const floorNode = this.getEntityRenderNode('room', id);
    if (floorNode) {
      floorNode.position.set(room.x, floorY - (this.floorplan.floorHeight || 0.08) / 2, room.z);
      
      const { vertices, triangles } = triangulateRoom(room);
      if (vertices.length >= 3 && triangles.length) {
        const height = (this.floorplan.floorHeight || 0.08);
        const children = floorNode.getChildren ? floorNode.getChildren() : [];
        
        // 1. 地板 Shape Mesh 更新
        const shapeMesh = children.find(child => child.name && child.name.endsWith('_shape'));
        if (shapeMesh) {
          const positions = [];
          const indices = [];
          const uvs = [];
          const halfHeight = height / 2;
          const centerY = room.elevation || 0;
          
          vertices.forEach((point) => {
            positions.push(point.x, centerY + halfHeight, point.z);
            uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
          });
          vertices.forEach((point) => {
            positions.push(point.x, centerY - halfHeight, point.z);
            uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
          });
          const bottomOffset = vertices.length;
          triangles.forEach(([a, b, c]) => {
            indices.push(a, c, b);
            indices.push(bottomOffset + a, bottomOffset + b, bottomOffset + c);
          });
          vertices.forEach((point, index) => {
            const nextIndex = (index + 1) % vertices.length;
            const next = vertices[nextIndex];
            const sideOffset = positions.length / 3;
            positions.push(
              point.x, centerY + halfHeight, point.z,
              next.x, centerY + halfHeight, next.z,
              next.x, centerY - halfHeight, next.z,
              point.x, centerY - halfHeight, point.z
            );
            uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
            indices.push(sideOffset, sideOffset + 1, sideOffset + 2, sideOffset, sideOffset + 2, sideOffset + 3);
          });
          
          const normals = [];
          VertexData.ComputeNormals(positions, indices, normals);
          const vertexData = new VertexData();
          vertexData.positions = positions;
          vertexData.indices = indices;
          vertexData.normals = normals;
          vertexData.uvs = uvs;
          vertexData.applyToMesh(shapeMesh);
        }

        // 2. 天花板 Ceiling Mesh 更新
        const ceilingMesh = children.find(child => child.name && child.name.endsWith('_ceiling'));
        if (ceilingMesh) {
          const positions = [];
          const indices = [];
          const uvs = [];
          const ceilHeight = 0.002;
          const halfHeight = ceilHeight / 2;
          const centerY = -height / 2 - 0.001;
          
          vertices.forEach((point) => {
            positions.push(point.x, centerY + halfHeight, point.z);
            uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
          });
          vertices.forEach((point) => {
            positions.push(point.x, centerY - halfHeight, point.z);
            uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
          });
          const bottomOffset = vertices.length;
          triangles.forEach(([a, b, c]) => {
            indices.push(a, c, b);
            indices.push(bottomOffset + a, bottomOffset + b, bottomOffset + c);
          });
          vertices.forEach((point, index) => {
            const nextIndex = (index + 1) % vertices.length;
            const next = vertices[nextIndex];
            const sideOffset = positions.length / 3;
            positions.push(
              point.x, centerY + halfHeight, point.z,
              next.x, centerY + halfHeight, next.z,
              next.x, centerY - halfHeight, next.z,
              point.x, centerY - halfHeight, point.z
            );
            uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
            indices.push(sideOffset, sideOffset + 1, sideOffset + 2, sideOffset, sideOffset + 2, sideOffset + 3);
          });
          
          const normals = [];
          VertexData.ComputeNormals(positions, indices, normals);
          const vertexData = new VertexData();
          vertexData.positions = positions;
          vertexData.indices = indices;
          vertexData.normals = normals;
          vertexData.uvs = uvs;
          vertexData.applyToMesh(ceilingMesh);
        }
      }
      
      // 3. 重置整体缩放
      floorNode.scaling.set(1, 1, 1);
    }

    const wallIds = new Set(Object.values(room.wallIds || {}));
    wallIds.forEach((wallId) => {
      this._syncWallPreview(wallId);
    });

    this.floorplan.items.forEach((item) => {
      if (item.roomId === id) {
        this._syncItemPreview(item.id);
      }
    });
  }

  _syncWallPreview(wallId) {
    const wall = this._document.getWall(wallId);
    const node = this.getEntityRenderNode('wall', wallId);
    if (!wall || !node) return;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    node.position.set(x1, 0, z1);
    const currentLength = Math.hypot(x2 - x1, z2 - z1);
    const originalLength = node.metadata?.originalLength || currentLength || 1;
    node.scaling.x = currentLength / originalLength;
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);

    this.floorplan.openings.forEach((opening) => {
      if (opening.wallId === wallId) {
        this._syncOpeningPreview(opening.id);
      }
    });
  }

  _syncOpeningPreview(id) {
    const opening = this._document.getOpening(id);
    const node = this.getEntityRenderNode('opening', id);
    if (!opening || !node) return;
    const wall = this._document.getWall(opening.wallId);
    if (!wall) return;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const point = {
      x: x1 + (x2 - x1) * (opening.t ?? 0.5),
      z: z1 + (z2 - z1) * (opening.t ?? 0.5)
    };
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const localY = sillHeight + height / 2;
    const floorY = this._document.getFloorElevation(opening.floorId || wall.floorId);
    const openingOffset = this._document.getOpeningElevationOffset(opening);
    node.position.set(point.x, floorY + localY + openingOffset, point.z);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  }

  _syncFencePreview(id) {
    const fence = this._document.getFence(id);
    const node = this.getEntityRenderNode('fence', id);
    if (!fence || !node) return;
    const [x1, z1] = fence.from;
    const [x2, z2] = fence.to;
    const floorY = this._document.getFloorElevation(fence.floorId || this.getCurrentFloorId());
    const fenceOffset = this._renderer.getFenceElevationOffset ? this._renderer.getFenceElevationOffset(fence) : 0;
    node.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
    
    const currentLength = Math.hypot(x2 - x1, z2 - z1);
    const originalLength = node.metadata?.originalLength || currentLength || 1;
    node.scaling.x = currentLength / originalLength;
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  }

  _syncRoofPreview(id) {
    const roof = this._document.getRoof(id);
    const node = this.getEntityRenderNode('roof', id);
    if (roof && node) {
      node.position.x = roof.x || 0;
      node.position.z = roof.z || 0;
      if (roof.rotation !== undefined) {
        node.rotation.y = roof.rotation;
      }
    }
  }

  _syncStairsPreview(id) {
    const stairs = this._document.getStairs(id);
    const node = this.getEntityRenderNode('stairs', id);
    if (stairs && node) {
      node.position.x = stairs.x || 0;
      node.position.z = stairs.z || 0;
      const floorY = this._document.getFloorElevation(stairs.floorId || this.getCurrentFloorId());
      const stairsOffset = this._renderer.getStairsElevationOffset ? this._renderer.getStairsElevationOffset(stairs) : 0;
      node.position.y = floorY + stairsOffset;
      if (stairs.rotation !== undefined) {
        node.rotation.y = stairs.rotation;
      }
    }
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
