import { FloorplanDocument } from '../domain/FloorplanDocument.js';
import { BabylonSceneRenderer } from '../runtime/BabylonSceneRenderer.js';
import { SelectionController } from './SelectionController.js';
import { ExportService } from '../services/ExportService.js';

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
