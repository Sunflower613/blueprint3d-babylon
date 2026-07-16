import { Color3 } from '../core/babylon.js';
const BABYLON = { Color3 };
import { BlueprintRegistry } from '../core/BlueprintRegistry.js';
import { getFurnitureDefinition, FURNITURE_DEFINITIONS, FURNITURE_LIST } from '../furniture/index.js';
import { FloorplanDocument, FENCE_SUBTYPE_DEFAULTS } from '../domain/FloorplanDocument.js';
import { ExportService } from '../services/ExportService.js';
import { BabylonSceneRenderer } from '../runtime/BabylonSceneRenderer.js';
import { SelectionController } from '../editor/SelectionController.js';
import { EditorFacade } from '../editor/EditorFacade.js';


export const BLUEPRINT3D_TEST_FLOORPLAN = {
  name: 'blueprint3dTestMap',
  unit: 'in',
  wallHeight: 2.8,
  wallThickness: 0.18,
  floorHeight: 0.2,
  floor: {
    color: '#f4efe6',
    rooms: [
      {
        id: 'living',
        name: '\u5ba2\u5385',
        x: 0,
        z: 0,
        width: 10,
        depth: 8,
        wallIds: {
          north: 'w_north_living',
          east: 'w_east_living',
          south: 'w_south_living',
          west: 'w_west_living'
        }
      },
      {
        id: 'bedroom',
        name: '\u5367\u5ba4',
        x: -2.5,
        z: -6.5,
        width: 5,
        depth: 5,
        wallIds: {
          east: 'w_mid',
          south: 'w_bed_south',
          west: 'w_bed_west'
        }
      },
      {
        id: 'studio',
        name: '\u5de5\u4f5c\u95f4',
        x: 3,
        z: -6.5,
        width: 6,
        depth: 5,
        wallIds: {
          north: 'w_studio_north',
          east: 'w_studio_east',
          south: 'w_studio_south',
          west: 'w_mid'
        }
      }
    ]
  },
  walls: [
    { id: 'w_north_living', from: [-5, -4], to: [0, -4], color: '#f9fbff' },
    { id: 'w_east_living', from: [5, -4], to: [5, 4], color: '#f9fbff' },
    { id: 'w_south_living', from: [5, 4], to: [-5, 4], color: '#f9fbff' },
    { id: 'w_west_living', from: [-5, 4], to: [-5, -4], color: '#f9fbff' },
    { id: 'w_bed_west', from: [-5, -9], to: [-5, -4], color: '#f9fbff' },
    { id: 'w_bed_south', from: [-5, -9], to: [0, -9], color: '#f9fbff' },
    { id: 'w_mid', from: [0, -9], to: [0, -4], color: '#f9fbff' },
    { id: 'w_studio_south', from: [0, -9], to: [6, -9], color: '#f9fbff' },
    { id: 'w_studio_east', from: [6, -9], to: [6, -4], color: '#f9fbff' },
    { id: 'w_studio_north', from: [0, -4], to: [6, -4], color: '#f9fbff' }
  ],
  openings: [
    { id: 'door_living_bedroom', type: 'door', wallId: 'w_north_living', t: 0.28, width: 0.9 },
    { id: 'window_living_south', type: 'window', wallId: 'w_south_living', t: 0.5, width: 1.25, height: 0.85 }
  ],
  items: [
    { id: 'sofa_1', type: 'sofa', name: '\u4e91\u6735\u6c99\u53d1', x: 2.1, z: -1.7, width: 84, depth: 36, height: 32, rotation: 0 },
    { id: 'table_1', type: 'table', name: '\u5706\u8336\u51e0', x: 0.7, z: 1.1, width: 42, depth: 42, height: 20, rotation: 0 },
    { id: 'bed_1', type: 'bed', name: '\u7c89\u8272\u516c\u4e3b\u5e8a', x: -2.4, z: -6.3, width: 76, depth: 88, height: 42, rotation: 0 },
    { id: 'desk_1', type: 'desk', name: '\u84dd\u56fe\u5de5\u4f5c\u684c', x: 3.2, z: -6.2, width: 64, depth: 30, height: 34, rotation: 0 }
  ]
};

export class Blueprint3DTestMap extends BlueprintRegistry {
  /**
   * 构造一个户型编辑器门面实例
   * @param {BABYLON.Scene} scene - Babylon.js 场景实例
   * @param {Object} [options={}] - 配置参数
   * @param {string} [options.name] - 注册组件名称，默认为 'blueprint3dTestMap'
   * @param {Object} [options.floorplan] - 初始户型数据
   * @param {boolean} [options.renderingEnabled=true] - 是否启用 3D 渲染
   * @param {Object} [options.palette] - 自定义材质调色板
   */
  constructor(scene, options = {}) {
    super(scene, { name: options.name || 'blueprint3dTestMap' });
    this.editorFacade = new EditorFacade({
      scene,
      floorplan: options.floorplan || BLUEPRINT3D_TEST_FLOORPLAN,
      options: {
        palette: options.palette || {},
        renderingEnabled: options.renderingEnabled !== false
      }
    });

    this.document = this.editorFacade._document;
    this.exportService = this.editorFacade._exportService;
    this.renderer = this.editorFacade._renderer;
    this.selectionController = this.editorFacade._selectionController;
    
    // 代理节点容器 map 指向渲染器内部 map，保证向下兼容性
    this.itemNodes = this.renderer.itemNodes;
    this.wallNodes = this.renderer.wallNodes;
    this.floorNodes = this.renderer.floorNodes;
    this.openingNodes = this.renderer.openingNodes;
    this.openingDragPreviews = this.renderer.openingDragPreviews;
    this.roofNodes = this.renderer.roofNodes;
    this.stairNodes = this.renderer.stairNodes;
    this.fenceNodes = this.renderer.fenceNodes;
    this.fenceGateNodes = this.renderer.fenceGateNodes;
    this.fenceGateDragPreviews = this.renderer.fenceGateDragPreviews;

    this.renderingDirty = true;
    if (this.renderingEnabled) this.build();
  }

  /**
   * 执行修改户型平面图数据的指令（代理到 editorFacade）
   * @param {string} name - 指令名称
   * @param {Object} [args={}] - 指令参数
   * @returns {Object|boolean|void} 指令执行结果
   */
  executeCommand(name, args = {}) {
    return this.editorFacade.executeCommand(name, args);
  }

  /** @returns {boolean} 是否启用 3D 渲染 */
  get renderingEnabled() { return this.editorFacade.renderingEnabled; }
  /** @param {boolean} val - 是否启用 3D 渲染 */
  set renderingEnabled(val) { this.editorFacade.renderingEnabled = val; }

  /** @returns {string|null} 当前选中的家具 ID */
  get selectedItemId() { return this.selectionController.selectedItemId; }
  /** @param {string|null} val - 要选中的家具 ID */
  set selectedItemId(val) { this.selectionController.selectedItemId = val; }

  /** @returns {string|null} 当前选中的墙体 ID */
  get selectedWallId() { return this.selectionController.selectedWallId; }
  /** @param {string|null} val - 要选中的墙体 ID */
  set selectedWallId(val) { this.selectionController.selectedWallId = val; }

  /** @returns {string|null} 当前选中的围栏 ID */
  get selectedFenceId() { return this.selectionController.selectedFenceId; }
  /** @param {string|null} val - 要选中的围栏 ID */
  set selectedFenceId(val) { this.selectionController.selectedFenceId = val; }

  /** @returns {string|null} 当前选中的大门 ID */
  get selectedFenceGateId() { return this.selectionController.selectedFenceGateId; }
  /** @param {string|null} val - 要选中的大门 ID */
  set selectedFenceGateId(val) { this.selectionController.selectedFenceGateId = val; }

  /** @returns {string|null} 当前选中的房间 ID */
  get selectedRoomId() { return this.selectionController.selectedRoomId; }
  /** @param {string|null} val - 要选中的房间 ID */
  set selectedRoomId(val) { this.selectionController.selectedRoomId = val; }

  /** @returns {BABYLON.Mesh|null} 房间选中轮廓网格 */
  get roomSelectionOutlineMesh() { return this.selectionController.roomSelectionOutlineMesh; }
  /** @param {BABYLON.Mesh|null} val - 房间选中轮廓网格 */
  set roomSelectionOutlineMesh(val) { this.selectionController.roomSelectionOutlineMesh = val; }

  /** @returns {string|null} 当前选中的屋顶 ID */
  get selectedRoofId() { return this.selectionController.selectedRoofId; }
  /** @param {string|null} val - 要选中的屋顶 ID */
  set selectedRoofId(val) { this.selectionController.selectedRoofId = val; }

  /** @returns {string|null} 当前选中的楼梯 ID */
  get selectedStairsId() { return this.selectionController.selectedStairsId; }
  /** @param {string|null} val - 要选中的楼梯 ID */
  set selectedStairsId(val) { this.selectionController.selectedStairsId = val; }

  /**
   * 代理基类的 shadowCasters 到渲染器实例中，保证 primitives 共享同一个引用
   * @returns {BABYLON.IShadowLight[]} 阴影产生光源数组
   */
  get shadowCasters() {
    return this.renderer ? this.renderer.shadowCasters : [];
  }
  /** @param {BABYLON.IShadowLight[]} val - 阴影产生光源数组 */
  set shadowCasters(val) {
    if (this.renderer) this.renderer.shadowCasters = val;
  }

  /**
   * 代理基类的 colliders 到渲染器实例中，保证 primitives 共享同一个引用
   * @returns {BABYLON.AbstractMesh[]} 碰撞网格数组
   */
  get colliders() {
    return this.renderer ? this.renderer.colliders : [];
  }
  /** @param {BABYLON.AbstractMesh[]} val - 碰撞网格数组 */
  set colliders(val) {
    if (this.renderer) this.renderer.colliders = val;
  }

  /** @returns {Object} 户型文档的数据对象 */
  get floorplan() {
    return this.document.floorplan;
  }

  /** @param {Object} val - 户型文档的数据对象 */
  set floorplan(val) {
    this.document.floorplan = val;
  }

  /** @returns {boolean} 是否启用了高级渲染模式（包含镜面反射、探针等） */
  get enableAdvancedRendering() {
    return this.renderer.enableAdvancedRendering;
  }

  /** @param {boolean} val - 是否启用高级渲染模式 */
  set enableAdvancedRendering(val) {
    this.renderer.enableAdvancedRendering = val;
  }

  /**
   * 设置高级渲染模式启用状态
   * @param {boolean} enabled - 是否启用高级渲染
   */
  setAdvancedRendering(enabled) {
    if (this.renderer) {
      this.renderer.setAdvancedRendering(enabled);
    }
  }

  /** @returns {Object} 渲染器的核心材质集合 */
  get materials() {
    return this.renderer.materials;
  }

  /** @param {Object} val - 渲染器的材质集合 */
  set materials(val) {
    this.renderer.materials = val;
  }

  // ----------------------------------------------------
  // 1. 委托给 BabylonSceneRenderer 的场景生成方法
  // ----------------------------------------------------
  /** 开启 3D 渲染并将脏数据重新构建 */
  enableRendering() {
    this.renderingEnabled = true;
    if (this.renderer) {
      this.renderer.renderingEnabled = true;
    }
    if (this.renderingDirty) {
      this.build();
    }
  }

  /** 关闭 3D 渲染功能 */
  disableRendering() {
    this.renderingEnabled = false;
    if (this.renderer) {
      this.renderer.renderingEnabled = false;
    }
  }

  /** 清除所有已构建的 3D 网格 */
  clearBuiltMeshes() {
    this.renderer.clearBuiltMeshes();
    this.roomSelectionOutlineMesh = null;
  }

  /** 构建或更新地板网格 */
  buildFloors() {
    this.renderer.buildFloors();
  }

  /**
   * 构建指定的墙体网格
   * @param {string[]} [wallIds=null] - 待构建的墙体 ID 数组，传入 null 则构建当前层全部墙体
   */
  buildWalls(wallIds = null) {
    this.renderer.buildWalls(wallIds);
  }

  /**
   * 构建指定的墙体洞口（门窗）网格
   * @param {string[]} [openingIds=null] - 待构建的洞口 ID 数组，传入 null 则构建当前层全部洞口
   */
  buildOpenings(openingIds = null) {
    this.renderer.buildOpenings(openingIds);
  }

  /** 构建或更新当前层的所有屋顶网格 */
  buildRoofs() {
    this.renderer.buildRoofs();
  }

  /** 构建或更新当前层的所有楼梯网格 */
  buildStairs() {
    this.renderer.buildStairs();
  }

  /**
   * 构建指定的围栏网格
   * @param {string[]} [fenceIds=null] - 待构建的围栏 ID 数组，传入 null 则构建当前层全部围栏
   */
  buildFences(fenceIds = null) {
    this.renderer.buildFences(fenceIds);
  }

  /**
   * 构建指定的围栏大门网格
   * @param {string[]} [gateIds=null] - 待构建的围栏大门 ID 数组，传入 null 则构建当前层全部大门
   */
  buildFenceGates(gateIds = null) {
    this.renderer.buildFenceGates(gateIds);
  }

  /**
   * 渲染并构建单件家具或组件
   * @param {Object} item - 家具数据对象
   * @returns {BABYLON.TransformNode} 构建好的 3D 节点
   */
  buildItem(item) {
    return this.renderer.buildItem(item);
  }

  /**
   * 将镜面或反射贴图应用到指定的网格上
   * @param {BABYLON.AbstractMesh} mesh - 目标网格
   * @param {string} itemId - 家具项 ID
   * @param {BABYLON.TransformNode} node - 家具节点容器
   */
  applyReflectionToMesh(mesh, itemId, node) {
    this.renderer.applyReflectionToMesh(mesh, itemId, node);
  }

  /**
   * 为指定的网格创建实时镜像纹理
   * @param {BABYLON.AbstractMesh} mirrorMesh - 用于渲染反射的网格
   * @param {string} itemId - 家具项 ID
   * @param {BABYLON.TransformNode} node - 家具节点容器
   */
  createMirrorTextureForMesh(mirrorMesh, itemId, node) {
    this.renderer.createMirrorTextureForMesh(mirrorMesh, itemId, node);
  }

  /**
   * 为指定网格创建实时反射探针
   * @param {BABYLON.AbstractMesh} mirrorMesh - 目标网格
   * @param {string} itemId - 家具项 ID
   * @param {BABYLON.TransformNode} node - 家具节点容器
   */
  createReflectionProbeForMesh(mirrorMesh, itemId, node) {
    this.renderer.createReflectionProbeForMesh(mirrorMesh, itemId, node);
  }

  /**
   * 恢复网格的静态反射纹理（停止实时反射计算）
   * @param {BABYLON.AbstractMesh} mirrorMesh - 目标网格
   * @param {BABYLON.TransformNode} node - 家具节点容器
   */
  restoreStaticReflectionTextureForMesh(mirrorMesh, node) {
    this.renderer.restoreStaticReflectionTextureForMesh(mirrorMesh, node);
  }

  /**
   * 获取指定网格所属的房间 ID
   * @param {BABYLON.AbstractMesh} mesh - 被测试的网格
   * @returns {string|null} 房间 ID，不在房间内则返回 null
   */
  getMeshRoomId(mesh) {
    return this.renderer.getMeshRoomId(mesh);
  }

  /** 构建或重建整个 3D 场景并同步当前的选中状态网格 */
  build() {
    if (!this.renderingEnabled) {
      this.renderingDirty = true;
      return;
    }
    this.renderingDirty = false;
    this.renderer.build();
    this.setSelectedItem(this.selectedItemId);
    this.setSelectedWall(this.selectedWallId);
    this.setSelectedFence(this.selectedFenceId);
    this.setSelectedFenceGate(this.selectedFenceGateId);
    this.setSelectedRoom(this.selectedRoomId);
    this.setSelectedRoof(this.selectedRoofId);
    this.setSelectedStairs(this.selectedStairsId);
  }

  // ----------------------------------------------------
  // 2. 委托给 FloorplanDocument 的数据状态方法
  // ----------------------------------------------------
  /**
   * 获取楼层的绝对海拔高度（米）
   * @param {string} floorId - 楼层 ID
   * @returns {number} 楼层海拔绝对高度值
   */
  getFloorElevation(floorId) {
    return this.document.getFloorElevation(floorId);
  }

  /**
   * 获取墙体的底部高程偏移量（米）
   * @param {string} wallId - 墙体 ID
   * @returns {number} 高程偏移
   */
  getWallElevationOffset(wallId) {
    return this.document.getWallElevationOffset(wallId);
  }

  /**
   * 获取洞口（门窗）的底部高程偏移量（米）
   * @param {Object} opening - 洞口数据对象
   * @returns {number} 高程偏移
   */
  getOpeningElevationOffset(opening) {
    return this.document.getOpeningElevationOffset(opening);
  }

  /**
   * 获取围栏的底部高程偏移量（米）
   * @param {Object} fence - 围栏数据对象
   * @returns {number} 高程偏移
   */
  getFenceElevationOffset(fence) {
    return this.document.getFenceElevationOffset(fence);
  }

  /**
   * 获取楼梯的底部高程偏移量（米）
   * @param {Object} stairs - 楼梯数据对象
   * @returns {number} 高程偏移
   */
  getStairsElevationOffset(stairs) {
    return this.document.getStairsElevationOffset(stairs);
  }

  /**
   * 自动计算并获取楼梯的目标高度
   * @param {Object} stairs - 楼梯数据对象
   * @returns {number} 楼梯整体高度值
   */
  getStairsAutoHeight(stairs) {
    return this.document.getStairsAutoHeight(stairs);
  }

  /**
   * 获取家具由于所在房间的局部高程抬升产生的偏移量
   * @param {Object} item - 家具数据对象
   * @returns {number} 高程偏移
   */
  getItemRoomElevationOffset(item) {
    return this.document.getItemRoomElevationOffset(item);
  }

  /**
   * 获取楼层数据定义
   * @param {string} floorId - 楼层 ID
   * @returns {Object|null} 楼层数据对象，若未找到返回 null
   */
  getFloor(floorId) {
    return this.document.getFloor(floorId);
  }

  /**
   * 获取楼层级别（用于上下层排序，数值越大海拔越高）
   * @param {string} floorId - 楼层 ID
   * @returns {number} 楼层级别
   */
  getFloorLevel(floorId) {
    return this.document.getFloorLevel(floorId);
  }

  /**
   * 检查楼层在 3D 渲染视图中是否可见
   * @param {string} floorId - 楼层 ID
   * @returns {boolean} 是否可见
   */
  isFloorVisible(floorId) {
    return this.document.isFloorVisible(floorId);
  }

  /**
   * 获取当前工作楼层的所有房间数据
   * @returns {Object[]} 房间数据数组
   */
  getCurrentFloorRooms() {
    return this.document.getCurrentFloorRooms();
  }

  /**
   * 获取当前工作楼层的所有墙体数据
   * @returns {Object[]} 墙体数据数组
   */
  getCurrentFloorWalls() {
    return this.document.getCurrentFloorWalls();
  }

  /**
   * 获取当前工作楼层的所有洞口数据
   * @returns {Object[]} 洞口数据数组
   */
  getCurrentFloorOpenings() {
    return this.document.getCurrentFloorOpenings();
  }

  /**
   * 获取当前工作楼层的所有家具数据
   * @returns {Object[]} 家具数据数组
   */
  getCurrentFloorItems() {
    return this.document.getCurrentFloorItems();
  }

  /**
   * 获取当前工作楼层的所有屋顶数据
   * @returns {Object[]} 屋顶数据数组
   */
  getCurrentFloorRoofs() {
    return this.document.getCurrentFloorRoofs();
  }

  /**
   * 获取当前工作楼层的所有楼梯数据
   * @returns {Object[]} 楼梯数据数组
   */
  getCurrentFloorStairs() {
    return this.document.getCurrentFloorStairs();
  }

  // ----------------------------------------------------
  // 3. 编辑器选中、交互与 Drag Previews 状态管理 (已剥离至 SelectionController)
  // ----------------------------------------------------
  /**
   * 选中指定的家具并高亮，同时取消前一个家具的选中
   * @param {string|null} itemId - 目标家具 ID，传入 null 清除家具选中
   */
  setSelectedItem(itemId) {
    this.selectionController.setSelectedItem(itemId);
  }

  /**
   * 选中指定的墙体
   * @param {string|null} wallId - 目标墙体 ID，传入 null 清除墙体选中
   */
  setSelectedWall(wallId) {
    this.selectionController.setSelectedWall(wallId);
  }

  /**
   * 选中指定的房间并更新其选择高亮框网格
   * @param {string|null} roomId - 目标房间 ID，传入 null 清除房间选中
   */
  setSelectedRoom(roomId) {
    this.selectionController.setSelectedRoom(roomId);
  }

  /**
   * 选中指定的围栏
   * @param {string|null} fenceId - 目标围栏 ID，传入 null 清除选中
   */
  setSelectedFence(fenceId) {
    this.selectionController.setSelectedFence(fenceId);
  }

  /**
   * 选中指定的围栏大门
   * @param {string|null} gateId - 目标大门 ID，传入 null 清除选中
   */
  setSelectedFenceGate(gateId) {
    this.selectionController.setSelectedFenceGate(gateId);
  }

  /**
   * 选中指定的屋顶
   * @param {string|null} roofId - 目标屋顶 ID，传入 null 清除选中
   */
  setSelectedRoof(roofId) {
    this.selectionController.setSelectedRoof(roofId);
  }

  /**
   * 选中指定的楼梯
   * @param {string|null} stairsId - 目标楼梯 ID，传入 null 清除选中
   */
  setSelectedStairs(stairsId) {
    this.selectionController.setSelectedStairs(stairsId);
  }

  /**
   * 开启洞口拖拽预览网格
   * @param {string} openingId - 洞口 ID
   * @returns {BABYLON.Mesh|null} 预览辅助网格
   */
  beginOpeningDragPreview(openingId) {
    return this.selectionController.beginOpeningDragPreview(openingId);
  }

  /**
   * 结束洞口拖拽预览，并销毁预览辅助网格
   * @param {string} openingId - 洞口 ID
   * @returns {boolean} 是否销毁成功
   */
  finishOpeningDragPreview(openingId) {
    return this.selectionController.finishOpeningDragPreview(openingId);
  }

  /**
   * 根据当前数据模型中的位置姿态，实时更新洞口渲染节点的位置与旋转
   * @param {string} openingId - 洞口 ID
   */
  updateOpeningNodePose(openingId) {
    this.selectionController.updateOpeningNodePose(openingId);
  }

  /**
   * 开启大门在围栏槽位中的拖拽预览网格
   * @param {string} gateId - 大门 ID
   * @returns {BABYLON.Mesh|null} 大门预览网格
   */
  beginFenceGateDragPreview(gateId) {
    return this.selectionController.beginFenceGateDragPreview(gateId);
  }

  /**
   * 同步大门的拖拽预览网格状态
   * @param {string} gateId - 大门 ID
   */
  syncFenceGateDragPreview(gateId) {
    this.selectionController.syncFenceGateDragPreview(gateId);
  }

  /**
   * 结束大门的拖拽预览，并销毁拖拽预览辅助网格
   * @param {string} gateId - 大门 ID
   * @returns {boolean} 是否销毁成功
   */
  finishFenceGateDragPreview(gateId) {
    return this.selectionController.finishFenceGateDragPreview(gateId);
  }

  /**
   * 更新大门的变换（旋转、位移）
   * @param {string} gateId - 大门 ID
   */
  updateFenceGateNodeTransform(gateId) {
    this.selectionController.updateFenceGateNodeTransform(gateId);
  }

  /** 强制请求重置刷新所有的反射探针与实时镜像贴图 */
  requestReflectionProbesUpdate() {
    this.scene.meshes.forEach((mesh) => {
      if (mesh.material && mesh.material.customReflectionProbe) {
        const probe = mesh.material.customReflectionProbe;
        if (probe && probe.cubeTexture && probe.cubeTexture.getRenderTargetTexture) {
          const rtt = probe.cubeTexture.getRenderTargetTexture();
          if (rtt) rtt.resetRefreshCounter();
        }
      }
    });
  }

  // ----------------------------------------------------
  // 4. 数据查询代理方法
  // ----------------------------------------------------
  /**
   * 根据房间 ID 查询房间数据
   * @param {string} roomId - 房间 ID
   * @returns {Object|null} 房间数据对象
   */
  getRoom(roomId) {
    return this.document.getRoom(roomId);
  }

  /**
   * 查询指定平面二维坐标 (x, z) 所在的房间
   * @param {number} x - 2D 平面中的 X 坐标值
   * @param {number} z - 2D 平面中的 Z 坐标值
   * @returns {Object|null} 匹配到的房间数据，未命中返回 null
   */
  getRoomAt(x, z) {
    return this.document.getRoomAt(x, z);
  }

  /**
   * 将家具项划分并绑定到指定的房间内（这会影响家具的局部高程等）
   * @param {string} itemId - 家具 ID
   * @param {string|null} roomId - 房间 ID
   * @returns {boolean} 是否成功绑定
   */
  assignItemToRoom(itemId, roomId) {
    return this.document.assignItemToRoom(itemId, roomId);
  }

  /** 强制重新遍历家具和房间的位置重合性，刷新整个户型家具与房间的逻辑映射链接 */
  refreshItemRoomLinks() {
    this.document.refreshItemRoomLinks();
  }

  /**
   * 获取指定墙体数据
   * @param {string} wallId - 墙体 ID
   * @returns {Object|null} 墙体数据
   */
  getWall(wallId) {
    return this.document.getWall(wallId);
  }

  /**
   * 获取指定洞口数据
   * @param {string} openingId - 洞口 ID
   * @returns {Object|null} 洞口数据
   */
  getOpening(openingId) {
    return this.document.getOpening(openingId);
  }

  /**
   * 获取指定家具数据
   * @param {string} itemId - 家具 ID
   * @returns {Object|null} 家具数据
   */
  getItem(itemId) {
    return this.document.getItem(itemId);
  }

  /**
   * 获取指定类别的家具 3D 组件结构定义
   * @param {string} type - 家具的类型/类别标识
   * @returns {Object|null} 家具定义结构配置
   */
  getFurnitureDefinition(type) {
    return getFurnitureDefinition(type);
  }

  /**
   * 获取所有注册的家具分类列表
   * @returns {Object[]} 家具列表定义数组
   */
  getFurnitureList() {
    return FURNITURE_LIST;
  }

  // ----------------------------------------------------
  // 5. CRUD 编辑与修改代理
  // ----------------------------------------------------
  /**
   * 切换当前编辑与渲染的工作楼层
   * @param {string} floorId - 目标楼层 ID
   * @returns {Object} 切换后的楼层数据对象
   */
  setCurrentFloor(floorId) {
    const floor = this.document.setCurrentFloor(floorId);
    this.build();
    return floor;
  }

  /**
   * 添加一个新楼层并触发场景重新渲染
   * @param {Object} [partialFloor={}] - 楼层初始数据 patch
   * @returns {Object} 创建成功的楼层数据对象
   */
  addFloor(partialFloor = {}) {
    const floor = this.document.addFloor(partialFloor);
    this.build();
    return floor;
  }

  /**
   * 删除指定的楼层
   * @param {string} floorId - 楼层 ID
   * @returns {boolean} 是否成功删除
   */
  deleteFloor(floorId) {
    const success = this.document.deleteFloor(floorId);
    if (success) this.build();
    return success;
  }

  /**
   * 在楼层列表中调整楼层的层级排序顺序（上移或下移）
   * @param {string} floorId - 楼层 ID
   * @param {'up'|'down'} direction - 移动方向
   * @returns {boolean} 是否调整成功
   */
  moveFloor(floorId, direction) {
    const success = this.document.moveFloor(floorId, direction);
    if (success) this.build();
    return success;
  }

  /**
   * 重命名指定的楼层
   * @param {string} floorId - 楼层 ID
   * @param {string} name - 楼层的新名称
   * @returns {Object|null} 楼层数据对象
   */
  renameFloor(floorId, name) {
    const floor = this.document.renameFloor(floorId, name);
    if (floor) this.build();
    return floor;
  }

  /**
   * 将源楼层的户型平面二维布局拷贝覆盖至目标楼层中
   * @param {string} sourceFloorId - 源楼层 ID
   * @param {string} targetFloorId - 目标楼层 ID
   */
  copyFloorPlanToFloor(sourceFloorId, targetFloorId) {
    this.document.copyFloorPlanToFloor(sourceFloorId, targetFloorId);
    this.build();
  }

  /**
   * 修改楼层的视图遮罩与隐藏设定
   * @param {string} floorId - 楼层 ID
   * @param {boolean} hideRoof - 是否在该楼层隐藏屋顶渲染
   * @param {boolean} hideWall - 是否在该楼层隐藏墙体渲染
   * @param {boolean} skyboxEnabled - 是否开启背景天空盒
   * @returns {boolean} 是否设置成功
   */
  changeFloorHideSettings(floorId, hideRoof, hideWall, skyboxEnabled) {
    const success = this.document.changeFloorHideSettings(floorId, hideRoof, hideWall, skyboxEnabled);
    if (success) this.build();
    return success;
  }

  /**
   * 变更指定的楼层层高高程差值（这会影响其上方所有楼层的绝对海拔高程）
   * @param {string} floorId - 楼层 ID
   * @param {number} height - 新的层高（米）
   * @returns {boolean} 是否变更成功
   */
  changeFloorHeight(floorId, height) {
    const success = this.document.changeFloorHeight(floorId, height);
    if (success) this.build();
    return success;
  }

  /**
   * 变更指定楼层的地板几何实体渲染厚度
   * @param {string} floorId - 楼层 ID
   * @param {number} floorHeight - 新的地板渲染厚度（米）
   * @returns {boolean} 是否变更成功
   */
  changeFloorDefaultFloorHeight(floorId, floorHeight) {
    const success = this.document.changeFloorDefaultFloorHeight(floorId, floorHeight);
    if (success) this.build();
    return success;
  }

  /**
   * 在当前楼层中加入一个新的家具项并单独构建渲染
   * @param {Object} partialItem - 家具初始属性与配置
   * @returns {Object} 添加成功的家具数据对象
   */
  addItem(partialItem) {
    const item = this.document.addItem(partialItem);
    this.buildItem(item);
    return item;
  }

  /**
   * 更新已存在家具的几何姿态或定制配色，并销毁重建其渲染网格
   * @param {string} itemId - 家具 ID
   * @param {Object} patch - 补丁更新属性
   * @returns {Object|null} 更新后的家具数据对象
   */
  updateItem(itemId, patch) {
    const item = this.document.updateItem(itemId, patch);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   * 修改家具下属指定子模块的配色，并引发重建
   * @param {string} itemId - 家具 ID
   * @param {string} componentId - 子组件标识
   * @param {string} color - 颜色的十六进制 Hex 码
   * @returns {Object|null} 更新后的家具数据对象
   */
  updateItemComponentColor(itemId, componentId, color) {
    const item = this.document.updateItemComponentColor(itemId, componentId, color);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   * 修改家具下属指定子模块的材质纹理贴图方案，并引发重建
   * @param {string} itemId - 家具 ID
   * @param {string} componentId - 子组件标识
   * @param {Object} materialDescriptor - 材质的属性包描述子
   * @returns {Object|null} 更新后的家具数据对象
   */
  updateItemComponentMaterial(itemId, componentId, materialDescriptor) {
    const item = this.document.updateItemComponentMaterial(itemId, componentId, materialDescriptor);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   * 旋转指定的家具项
   * @param {string} itemId - 家具 ID
   * @param {number} rotationRadians - 旋转的弧度增量或绝对角度（依赖底层内部实现）
   * @returns {Object|null} 家具数据对象
   */
  rotateItem(itemId, rotationRadians) {
    const item = this.document.rotateItem(itemId, rotationRadians);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  /**
   * 从当前楼层数据和 3D 渲染场景中彻底删除该家具项并销毁网格
   * @param {string} itemId - 家具 ID
   * @returns {boolean} 是否成功删除
   */
  deleteItem(itemId) {
    const oldNode = this.itemNodes.get(itemId);
    const success = this.document.deleteItem(itemId);
    if (success) {
      if (oldNode) oldNode.dispose(false, false);
      this.itemNodes.delete(itemId);
    }
    return success;
  }

  /**
   * 新增一段二维平面墙体，并执行全局场景重建
   * @param {number[]} from - 墙体起点的 2D 坐标值 `[x, z]`
   * @param {number[]} to - 墙体终点的 2D 坐标值 `[x, z]`
   * @returns {Object} 创建的墙体数据对象
   */
  addWall(from, to) {
    const wall = this.document.addWall(from, to);
    this.build();
    return wall;
  }

  /**
   * 获取指定墙体的物理长度（米/英制，根据户型文档单位）
   * @param {string} wallId - 墙体 ID
   * @returns {number} 墙体长度数值
   */
  getWallLength(wallId) {
    return this.document.getWallLength(wallId);
  }

  /**
   * 伸缩或更新墙体的物理长度（会联动影响相连墙体节点）
   * @param {string} wallId - 墙体 ID
   * @param {number} length - 目标物理长度值
   * @returns {Object|null} 更新后的墙体对象
   */
  updateWallLength(wallId, length) {
    const wall = this.document.updateWallLength(wallId, length);
    if (wall) this.build();
    return wall;
  }

  /**
   * 变更或覆盖墙体物理长度的兼容方法
   * @param {string} wallId - 墙体 ID
   * @param {number} length - 物理长度值
   * @returns {Object|null} 更新后的墙体对象
   */
  setWallLength(wallId, length) {
    return this.updateWallLength(wallId, length);
  }

  /**
   * 更新墙体的一般物理配置数据（如厚度、高程、配色等）
   * @param {string} wallId - 墙体 ID
   * @param {Object} patch - 补丁更新属性
   * @param {Object} [options={}] - 控制构建行为的选项
   * @param {boolean} [options.rebuild=true] - 是否立即触发 3D 重新构建
   * @returns {Object|null} 更新后的墙体数据对象
   */
  updateWall(wallId, patch, options = {}) {
    const wall = this.document.updateWall(wallId, patch);
    if (wall && options.rebuild !== false) {
      this.build();
    }
    return wall;
  }

  /**
   * 设置指定墙体的底色与覆盖材质
   * @param {string} wallId - 墙体 ID
   * @param {string} color - 颜色的 Hex 十六进制码
   * @returns {Object|null} 墙体数据对象
   */
  setWallColor(wallId, color) {
    return this.updateWall(wallId, { color, material: color });
  }

  /**
   * 从当前文档与场景渲染器中彻底移除该墙体（同时可能导致关联房间瓦解重建）
   * @param {string} wallId - 墙体 ID
   */
  deleteWall(wallId) {
    this.document.deleteWall(wallId);
    this.build();
  }

  /**
   * 重新检查和对齐某个闭合房间周围的所有组成墙体数据
   * @param {Object} room - 房间数据对象
   * @param {boolean} [createMissing=false] - 是否自动修补缺失的实体围墙
   * @returns {Object} 同步完成的结果结构
   */
  syncRoomWalls(room, createMissing = false) {
    const result = this.document.syncRoomWalls(room, createMissing);
    this.build();
    return result;
  }

  /**
   * 声明式新增一个封闭多边形房间，并重构 3D 板块
   * @param {Object} [partialRoom={}] - 房间数据初始补丁
   * @returns {Object} 创建出的房间数据对象
   */
  addRoom(partialRoom = {}) {
    const room = this.document.addRoom(partialRoom);
    this.build();
    return room;
  }

  /**
   * 在 2D 地图坐标中位移特定的房间以及其完全围成的家具和几何
   * @param {string} roomId - 房间 ID
   * @param {number} dx - 二维平面 X 轴方向位移偏移量
   * @param {number} dz - 二维平面 Z 轴方向位移偏移量
   * @returns {Object|null} 移动后的房间数据对象
   */
  moveRoom(roomId, dx, dz) {
    const room = this.document.moveRoom(roomId, dx, dz);
    if (room) this.build();
    return room;
  }

  /**
   * 更新房间的基本物理信息或地板材质
   * @param {string} roomId - 房间 ID
   * @param {Object} patch - 补丁更新属性
   * @param {Object} [options={}] - 构建选项
   * @param {boolean} [options.rebuild=true] - 是否触发 3D 重新构建
   * @returns {Object|null} 更新后的房间对象
   */
  updateRoom(roomId, patch, options = {}) {
    const room = this.document.updateRoom(roomId, patch, options);
    if (room && options.rebuild !== false) {
      this.build();
    }
    return room;
  }

  /**
   * 从文档与 3D 场景渲染器中删除该房间（但与其贴合的墙体本身不会被连带移除）
   * @param {string} roomId - 房间 ID
   * @returns {boolean} 是否成功删除
   */
  deleteRoom(roomId) {
    const success = this.document.deleteRoom(roomId);
    if (success) this.build();
    return success;
  }

  /**
   * 添加一个屋顶几何数据，并进行场景重建
   * @param {Object} [partialRoof={}] - 屋顶初始配置参数
   * @returns {Object} 添加完成的屋顶数据对象
   */
  addRoof(partialRoof = {}) {
    const roof = this.document.addRoof(partialRoof);
    this.build();
    return roof;
  }

  /**
   * 添加一个楼梯数据，并进行场景重建
   * @param {Object} [partialStairs={}] - 楼梯初始配置参数
   * @returns {Object} 添加完成的楼梯数据对象
   */
  addStairs(partialStairs = {}) {
    const stairs = this.document.addStairs(partialStairs);
    this.build();
    return stairs;
  }

  /**
   * 获取指定屋顶数据
   * @param {string} roofId - 屋顶 ID
   * @returns {Object|null} 屋顶数据对象
   */
  getRoof(roofId) {
    return this.document.getRoof(roofId);
  }

  /**
   * 更新屋顶的几何姿态或参数配置
   * @param {string} roofId - 屋顶 ID
   * @param {Object} patch - 更新属性
   * @param {boolean} [rebuild=true] - 是否立即触发 3D 重建
   * @returns {Object|null} 更新后的屋顶数据对象
   */
  updateRoof(roofId, patch, rebuild = true) {
    const roof = this.document.updateRoof(roofId, patch);
    if (roof && rebuild) this.build();
    return roof;
  }

  /**
   * 从户型文档和 3D 渲染视图中销毁指定的屋顶
   * @param {string} roofId - 屋顶 ID
   * @returns {boolean} 是否成功删除
   */
  deleteRoof(roofId) {
    const success = this.document.deleteRoof(roofId);
    if (success) this.build();
    return success;
  }

  /**
   * 获取指定楼梯数据
   * @param {string} stairsId - 楼梯 ID
   * @returns {Object|null} 楼梯数据对象
   */
  getStairs(stairsId) {
    return this.document.getStairs(stairsId);
  }

  /**
   * 更新楼梯的位置、高低、宽深或阶数等参数
   * @param {string} stairsId - 楼梯 ID
   * @param {Object} patch - 更新属性
   * @param {boolean} [rebuild=true] - 是否立即触发 3D 重建
   * @returns {Object|null} 更新后的楼梯数据对象
   */
  updateStairs(stairsId, patch, rebuild = true) {
    const stairs = this.document.updateStairs(stairsId, patch);
    if (stairs && rebuild) this.build();
    return stairs;
  }

  /**
   * 从户型文档和 3D 渲染视图中销毁指定的楼梯
   * @param {string} stairsId - 楼梯 ID
   * @returns {boolean} 是否成功删除
   */
  deleteStairs(stairsId) {
    const success = this.document.deleteStairs(stairsId);
    if (success) this.build();
    return success;
  }

  /**
   * 在二维平面图上新增一段围栏，并重建 3D 场景
   * @param {Object} [partialFence={}] - 围栏初始配置参数
   * @returns {Object} 围栏数据对象
   */
  addFence(partialFence = {}) {
    const fence = this.document.addFence(partialFence);
    this.build();
    return fence;
  }

  /**
   * 获取指定的围栏数据
   * @param {string} fenceId - 围栏 ID
   * @returns {Object|null} 围栏数据对象
   */
  getFence(fenceId) {
    return this.document.getFence(fenceId);
  }

  /**
   * 更新围栏的数据参数
   * @param {string} fenceId - 围栏 ID
   * @param {Object} patch - 更新属性
   * @param {boolean} [rebuild=true] - 是否立即触发 3D 重建
   * @returns {Object|null} 更新后的围栏数据对象
   */
  updateFence(fenceId, patch, rebuild = true) {
    const fence = this.document.updateFence(fenceId, patch);
    if (fence && rebuild) this.build();
    return fence;
  }

  /**
   * 从当前文档与渲染视图中完全移除该围栏
   * @param {string} fenceId - 围栏 ID
   * @returns {boolean} 是否成功删除
   */
  deleteFence(fenceId) {
    const success = this.document.deleteFence(fenceId);
    if (success) this.build();
    return success;
  }

  /**
   * 添加一个围栏门几何实体，并引发重建
   * @param {Object} [partialFenceGate={}] - 围栏大门初始配置
   * @returns {Object} 大门数据对象
   */
  addFenceGate(partialFenceGate = {}) {
    const gate = this.document.addFenceGate(partialFenceGate);
    this.build();
    return gate;
  }

  /**
   * 获取指定的围栏大门数据
   * @param {string} gateId - 大门 ID
   * @returns {Object|null} 大门数据对象
   */
  getFenceGate(gateId) {
    return this.document.getFenceGate(gateId);
  }

  /**
   * 更新围栏大门的属性参数（如果非全面重构则执行快速位移姿态同步）
   * @param {string} gateId - 大门 ID
   * @param {Object} patch - 更新属性
   * @param {boolean} [rebuild=true] - 是否重建整个场景，设为 false 会尝试只进行节点位置更新
   * @returns {Object|null} 更新后的围栏门数据对象
   */
  updateFenceGate(gateId, patch, rebuild = true) {
    const gate = this.document.updateFenceGate(gateId, patch);
    if (!gate) return null;
    if (rebuild) {
      this.build();
    } else {
      this.updateFenceGateNodeTransform(gateId);
    }
    return gate;
  }

  /**
   * 从当前文档与渲染视图中完全移除指定的围栏门
   * @param {string} gateId - 大门 ID
   * @returns {boolean} 是否成功删除
   */
  deleteFenceGate(gateId) {
    const success = this.document.deleteFenceGate(gateId);
    if (success) this.build();
    return success;
  }

  /**
   * 在指定的实体墙体上开辟一个洞口（例如大门、窗户或拱门等）并重建
   * @param {string} wallId - 承载洞口的墙体 ID
   * @param {'door'|'window'|string} [type='door'] - 洞口基本功能类别
   * @param {number} [t=0.5] - 洞口中心沿墙线起点到终点的比例系数 (0 ~ 1)
   * @param {string} [shape='square'] - 洞口的几何轮廓形状形状名
   * @returns {Object|null} 创建成功的洞口数据对象
   */
  addOpening(wallId, type = 'door', t = 0.5, shape = 'square') {
    const opening = this.document.addOpening(wallId, type, t, shape);
    if (opening) this.build();
    return opening;
  }

  /**
   * 更新墙体洞口的特定属性或物理位置
   * @param {string} openingId - 洞口 ID
   * @param {Object} patch - 属性补丁包
   * @param {boolean} [rebuild=true] - 是否触发完整 3D 重建。为 false 时将快速做局部变换
   * @returns {Object|null} 更新完成的洞口数据对象
   */
  updateOpening(openingId, patch, rebuild = true) {
    const opening = this.document.updateOpening(openingId, patch);
    if (opening) {
      if (rebuild) {
        this.build();
      } else {
        this.updateOpeningNodePose(openingId);
      }
    }
    return opening;
  }

  /**
   * 重置指定洞口的材质，使其恢复默认
   * @param {string} openingId - 洞口 ID
   */
  resetOpeningMaterial(openingId) {
    this.document.resetOpeningMaterial(openingId);
    this.build();
  }

  /**
   * 从宿主墙体上物理销毁移除该洞口并重建墙体几何
   * @param {string} openingId - 洞口 ID
   * @returns {boolean} 是否删除成功
   */
  deleteOpening(openingId) {
    const success = this.document.deleteOpening(openingId);
    if (success) this.build();
    return success;
  }

  /**
   * 变更当前楼层物理底板的主色调，并同时同步 Babylon 材质颜色
   * @param {string} color - Hex 十六进制颜色代码（如 '#f4efe6'）
   */
  setFloorColor(color) {
    this.document.setFloorColor(color);
    this.materials.floor.diffuseColor = BABYLON.Color3.FromHexString(color);
    this.build();
  }

  /**
   * 为指定的特定房间定制渲染地板材质样式方案
   * @param {string} roomId - 目标房间 ID
   * @param {Object} materialDescriptor - 地板材质纹理组合参数描述子
   * @returns {Object|null} 房间更新后的对象
   */
  setRoomFloorMaterial(roomId, materialDescriptor) {
    const room = this.document.setRoomFloorMaterial(roomId, materialDescriptor);
    if (room) this.build();
    return room;
  }

  /**
   * 为全局未指定材质的默认地板整体覆盖新的材质参数
   * @param {Object} materialDescriptor - 全局地板的材质描述包
   */
  setFloorMaterial(materialDescriptor) {
    this.document.setFloorMaterial(materialDescriptor);
    this.build();
  }

  // ----------------------------------------------------
  // 6. 数据加载与导出服务代理
  // ----------------------------------------------------
  /**
   * 将当前的户型布局数据直接序列化为纯内存 JSON 树对象形式
   * @returns {Object} 户型 JSON 结构树
   */
  exportJSON() {
    return this.exportService.exportJSON();
  }

  /**
   * 将当前户型工程导出打包为特定后缀格式的物理二进制工程文件
   * @param {Object} [options={}] - 文件构造参数选项
   * @returns {ArrayBuffer} 导出的二进制格式工程数据
   */
  exportBuildingFile(options = {}) {
    return this.exportService.exportBuildingFile(options);
  }

  /**
   * 将当前工程以可读字符流或纯文本格式进行文本序列化
   * @param {Object} [options={}] - 序列化属性控制
   * @returns {string} 字符流数据
   */
  stringifyBuildingFile(options = {}) {
    return this.exportService.stringifyBuildingFile(options);
  }

  /**
   * 将当前编辑器的 2D 二维图纸几何架构转化为 AutoCAD 的 DXF 格式文件字符串
   * @returns {string} 可直接落盘的 DXF 矢量数据
   */
  stringifyDXF() {
    return this.exportService.stringifyDXF();
  }

  /**
   * 打包当前的 3D 重建网格与几何数据，并在内存中流化生成 ZIP 容器形式的标准 3MF 重建数据文件包
   * @param {Object} [options={}] - 3MF 打包策略（包含榫卯结构、材质种类等配置）
   * @returns {Promise<Blob>} 异步返回的 3MF 物理文件 Blob 内容
   */
  create3MFPackage(options = {}) {
    return this.exportService.create3MFPackage(options);
  }

  /**
   * 整体反序列化加载并恢复整个 3D 工程文件的数据模型，并彻底重置当前选择态和进行 3D 渲染重建
   * @param {ArrayBuffer} fileData - 待读取的工程二进制数据
   */
  loadBuildingFile(fileData) {
    this.exportService.loadBuildingFile(fileData);
    this.selectedItemId = this.selectedItemId && this.getItem(this.selectedItemId) ? this.selectedItemId : null;
    this.selectedWallId = this.selectedWallId && this.getWall(this.selectedWallId) ? this.selectedWallId : null;
    this.build();
  }

  /**
   * 整体加载并恢复 JSON 树格式户型数据模型，并彻底重置当前选择态和进行 3D 渲染重建
   * @param {Object} floorplan - 包含全属性的 JSON 数据结构
   */
  loadJSON(floorplan) {
    this.exportService.loadJSON(floorplan);
    this.selectedItemId = this.selectedItemId && this.getItem(this.selectedItemId) ? this.selectedItemId : null;
    this.selectedWallId = this.selectedWallId && this.getWall(this.selectedWallId) ? this.selectedWallId : null;
    this.build();
  }

  // ----------------------------------------------------
  // 7. 只读查询 API 代理（转发给 editorFacade，确保防篡改）
  // ----------------------------------------------------
  getSnapshot() { return this.editorFacade.getSnapshot(); }
  getCurrentFloorId() { return this.editorFacade.getCurrentFloorId(); }
  getFloors() { return this.editorFacade.getFloors(); }
  getFloor(id) { return this.editorFacade.getFloor(id); }
  getEntities(type, options) { return this.editorFacade.getEntities(type, options); }
  getEntity(type, id) { return this.editorFacade.getEntity(type, id); }
  getCurrentFloorEntities(type) { return this.editorFacade.getCurrentFloorEntities(type); }
  getFurnitureDefinition(type) { return this.editorFacade.getFurnitureDefinition(type); }
  getFloorElevation(id) { return this.editorFacade.getFloorElevation(id); }
  getFloorLevel(floorId) { return this.editorFacade.getFloorLevel(floorId); }
  getStairsAutoHeight(stairs) { return this.editorFacade.getStairsAutoHeight(stairs); }
}

export { FURNITURE_DEFINITIONS, FURNITURE_LIST, FENCE_SUBTYPE_DEFAULTS };

export function buildBlueprint3DTestMap(scene, options = {}) {
  return new Blueprint3DTestMap(scene, options);
}
