import { AbstractMesh, ArcRotateCamera, Color3, Color4, CubeTexture, DirectionalLight, Engine, HemisphericLight, Matrix, MeshBuilder, Node, Plane, Scene, ShadowGenerator, Vector3 } from '../../src/core/babylon.js';
const BABYLON = { AbstractMesh, ArcRotateCamera, Color3, Color4, CubeTexture, DirectionalLight, Engine, HemisphericLight, Matrix, MeshBuilder, Node, Plane, Scene, ShadowGenerator, Vector3 };

/**
 * Viewer3D — 3D 渲染引擎封装
 *
 * 职责：管理 BabylonJS 引擎、场景、相机、光照、阴影、3D 辅助网格。
 * 从 app.js 中提取的纯 3D 渲染基础设施，通过参数化接口与业务逻辑解耦。
 */
export class Viewer3D {
  /**
   * 创建 3D 渲染器实例
   * @param {HTMLCanvasElement} canvas - 渲染目标画布
   * @param {Object} [options] - 可选配置
   * @param {string} [options.clearColor='#eef4fbff'] - 场景背景色
   */
  constructor(canvas, options = {}) {
    const clearColor = options.clearColor || '#eef4fbff';

    // ========== 引擎与场景 ==========
    /** @type {BABYLON.Engine} BabylonJS 渲染引擎 */
    this.engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true });
    /** @type {BABYLON.Scene} BabylonJS 场景 */
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = BABYLON.Color4.FromHexString(clearColor);

    // ========== 相机 ==========
    /** @type {BABYLON.ArcRotateCamera} 弧形旋转相机 */
    this.camera = new BABYLON.ArcRotateCamera(
      'camera', -Math.PI / 3, Math.PI / 3, 15,
      new BABYLON.Vector3(0, 0, -2.2), this.scene
    );
    this.camera.attachControl(canvas, true, false, 1);
    // 彻底移除相机自带的键盘输入移动模块，防止其默认的键盘行为（包含旋转和方向键监听）干扰自定义操作
    this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    this.camera.lowerRadiusLimit = 0.5;
    this.camera.upperRadiusLimit = 100;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.panningSensibility = 1200;
    this.camera.panningMouseButton = 1; // 设置鼠标中键为平移控制键
    if (this.camera.inputs.attached.pointers) {
      // 只允许鼠标左键(0)和中键(1)控制相机，避免右键(2)导致相机在右键呼出复制菜单时晃动
      this.camera.inputs.attached.pointers.buttons = [0, 1];
    }

    // ========== 光照 ==========
    /** @type {BABYLON.HemisphericLight} 半球光 */
    this.hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
    this.hemi.intensity = 0.72;
    this.hemi.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5); // 设定下半球环境光颜色为淡灰色，使所有背光的物体底面（如天花板底面）受光照亮
    /** @type {BABYLON.DirectionalLight} 方向光（太阳光） */
    this.sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.5), this.scene);
    this.sun.position.set(8, 12, 8);
    this.sun.intensity = 0.78;

    // ========== 阴影 ==========
    /** @type {BABYLON.ShadowGenerator} 阴影生成器 */
    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, this.sun);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 24;
    // ========== 环境纹理（用于镜面反射） ==========
    // 创建程序化环境纹理，使 kind:'mirror' 材质有可见的反射效果
    this._environmentInitialized = false;
    this._renderLoopStarted = false;

    // ========== 地面平面（用于射线拾取） ==========
    /** @type {BABYLON.Plane} 地面平面 */
    this.groundPlane = new BABYLON.Plane(0, 1, 0, 0);

    // ========== 3D 辅助网格状态 ==========
    /** @type {boolean} 是否显示 3D 辅助网格 */
    this.show3DGrid = true;
    /** @type {BABYLON.Node[]} 3D 辅助网格节点列表 */
    this.grid3DNodes = [];

    // 保存 canvas 引用以便后续 resize 事件绑定
    this._canvas = canvas;
    this._resizeHandler = () => this.engine.resize();
  }

  /**
   * 启动渲染循环并监听窗口 resize
   */
  startRenderLoop() {
    if (this._renderLoopStarted) return;
    this._renderLoopStarted = true;
    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener('resize', this._resizeHandler);
  }

  prepareFor3D() {
    if (!this._environmentInitialized) {
      this._environmentInitialized = true;
      this._initEnvironmentTexture();
    }
    this.startRenderLoop();
  }

  /**
   * 初始化环境纹理（仅作为镜面材质 reflectionTexture 的 clone 源）
   * 注意：不使用 createDefaultEnvironment，因为它会改变 environmentIntensity 等参数，
   * 导致已有的 MirrorTexture 浴室镜变灰。
   * @private
   */
  _initEnvironmentTexture() {
    try {
      this.scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        'https://assets.babylonjs.com/environments/environmentSpecular.env',
        this.scene
      );
      // 保持 environmentIntensity 为 0，避免影响非镜面材质的外观
      // 镜面材质通过 clone + 设置 level 来独立控制反射强度
      this.scene.environmentIntensity = 0;
    } catch (_ignored) {
      // 离线环境下不创建环境纹理，镜面材质回退为纯高光模式
    }
  }

  /**
   * 手动触发引擎 resize
   */
  resize() {
    this.engine.resize();
  }

  /**
   * 重置相机到默认视角
   */
  resetCamera() {
    this.camera.setTarget(new BABYLON.Vector3(0, 0, -2.2));
    this.camera.alpha = -Math.PI / 3;
    this.camera.beta = Math.PI / 3;
    this.camera.radius = 15;
  }

  /**
   * 沿 mesh 的父节点链向上查找 floorId 元数据
   * @param {BABYLON.AbstractMesh} mesh - 要查找的网格
   * @returns {string|null} 找到的楼层 ID 或 null
   */
  getMeshFloorId(mesh) {
    let current = mesh;
    while (current) {
      if (current.metadata && current.metadata.floorId) {
        return current.metadata.floorId;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * 刷新阴影投射列表（仅保留当前楼层的投射体）
   * @param {Function} getShadowCasters - 返回所有阴影投射 mesh 数组的回调
   * @param {string} currentFloorId - 当前楼层 ID
   */
  refreshShadowCasters(getShadowCasters, currentFloorId) {
    this.shadowGenerator.getShadowMap().renderList = [];
    getShadowCasters().forEach((mesh) => {
      const floorId = this.getMeshFloorId(mesh);
      if (!floorId || floorId === currentFloorId) {
        this.shadowGenerator.addShadowCaster(mesh);
      }
    });
  }

  /**
   * 从当前鼠标/触摸指针位置计算地面交点
   * @param {number} [floorY=0] - 当前楼层的地面高度
   * @returns {BABYLON.Vector3|null} 交点坐标或 null
   */
  groundPointFromPointer(floorY = 0) {
    const ray = this.scene.createPickingRay(
      this.scene.pointerX, this.scene.pointerY,
      BABYLON.Matrix.Identity(), this.camera
    );
    const distance = ray.intersectsPlane(new BABYLON.Plane(0, 1, 0, -floorY));
    if (distance === null || distance === undefined || distance < 0) return null;
    return ray.origin.add(ray.direction.scale(distance));
  }

  // ==========================================
  // 3D 辅助网格
  // ==========================================

  /**
   * 清除所有 3D 辅助网格节点
   */
  clear3DGrid() {
    this.grid3DNodes.splice(0).forEach((node) => node.dispose(false, true));
  }

  /**
   * 根据传入的建筑数据计算 3D 辅助网格边界
   * @param {Object} data - 建筑数据
   * @param {Array} data.walls - 墙体列表
   * @param {Array} data.rooms - 房间列表
   * @param {Array} data.roofs - 屋顶列表
   * @param {Array} data.stairs - 楼梯列表
   * @param {Array} data.items - 家具列表
   * @param {boolean} data.snapEnabled - 是否启用吸附
   * @param {number} data.snapSize - 吸附大小
   * @param {Function} data.inchesToWorld - 英寸转世界坐标的函数
   * @returns {{minX: number, maxX: number, minZ: number, maxZ: number}} 边界
   */
  _get3DGridBounds(data) {
    const { walls, rooms, roofs, stairs, items, snapEnabled, snapSize, inchesToWorld } = data;
    const points = [];

    walls.forEach((wall) => {
      points.push({ x: wall.from[0], z: wall.from[1] }, { x: wall.to[0], z: wall.to[1] });
    });
    rooms.forEach((room) => {
      points.push(
        { x: room.x - room.width / 2, z: room.z - room.depth / 2 },
        { x: room.x + room.width / 2, z: room.z + room.depth / 2 }
      );
    });
    roofs.forEach((roof) => {
      points.push(
        { x: (roof.x || 0) - (roof.width || 6) / 2, z: (roof.z || 0) - (roof.depth || 6) / 2 },
        { x: (roof.x || 0) + (roof.width || 6) / 2, z: (roof.z || 0) + (roof.depth || 6) / 2 }
      );
    });
    stairs.forEach((s) => {
      const subtype = s.subtype || 'straight';
      let wVal = s.width || 1.2;
      let dVal = s.depth || 3.2;
      if (subtype === 'spiral') {
        const size = Math.max(wVal, dVal);
        wVal = size;
        dVal = size;
      }
      points.push(
        { x: (s.x || 0) - wVal / 2, z: (s.z || 0) - dVal / 2 },
        { x: (s.x || 0) + wVal / 2, z: (s.z || 0) + dVal / 2 }
      );
    });
    items.forEach((item) => {
      const scale = Number(item.scale || 1);
      const width = inchesToWorld(item.width || 24) * scale;
      const depth = inchesToWorld(item.depth || 24) * scale;
      points.push(
        { x: item.x - width / 2, z: item.z - depth / 2 },
        { x: item.x + width / 2, z: item.z + depth / 2 }
      );
    });

    if (!points.length) return { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    const xs = points.map((point) => point.x);
    const zs = points.map((point) => point.z);
    const step = Math.max(0.25, snapEnabled && snapSize ? snapSize : 1);
    const pad = Math.max(4, step * 3);
    return {
      minX: Math.floor((Math.min(...xs) - pad) / step) * step,
      maxX: Math.ceil((Math.max(...xs) + pad) / step) * step,
      minZ: Math.floor((Math.min(...zs) - pad) / step) * step,
      maxZ: Math.ceil((Math.max(...zs) + pad) / step) * step
    };
  }

  /**
   * 创建虚线段的顶点对列表
   * @param {BABYLON.Vector3} p1 - 起点
   * @param {BABYLON.Vector3} p2 - 终点
   * @param {number} [dashSize=0.08] - 虚线段长度
   * @param {number} [gapSize=0.08] - 间隔长度
   * @returns {Array<[BABYLON.Vector3, BABYLON.Vector3]>} 虚线段数组
   */
  _createDashedLineSegments(p1, p2, dashSize = 0.08, gapSize = 0.08) {
    const segments = [];
    const dir = p2.subtract(p1);
    const totalLength = dir.length();
    if (totalLength <= 0.001) return segments;

    const stepVec = dir.normalize();
    let currentLength = 0;

    while (currentLength < totalLength) {
      const start = p1.add(stepVec.scale(currentLength));
      currentLength = Math.min(totalLength, currentLength + dashSize);
      const end = p1.add(stepVec.scale(currentLength));
      segments.push([start, end]);
      currentLength += gapSize;
    }
    return segments;
  }

  /**
   * 刷新 3D 辅助网格
   * @param {Object} options - 刷新选项
   * @param {string} options.currentView - 当前视图模式 ('2d'|'3d')
   * @param {boolean} options.snapEnabled - 是否启用吸附
   * @param {number} options.snapSize - 吸附大小
   * @param {Array} options.walls - 当前楼层墙体
   * @param {Array} options.rooms - 当前楼层房间
   * @param {Array} options.roofs - 当前楼层屋顶
   * @param {Array} options.stairs - 当前楼层楼梯
   * @param {Array} options.items - 当前楼层家具
   * @param {string} options.currentFloorId - 当前楼层 ID
   * @param {number} options.floorElevation - 当前楼层地面高度
   * @param {Function} options.inchesToWorld - 英寸转世界坐标函数
   * @param {boolean} [options.hasTestMap=true] - 是否有有效的 testMap
   */
  refresh3DGrid(options) {
    this.clear3DGrid();
    const {
      currentView, snapEnabled, snapSize, walls, rooms, roofs, stairs, items,
      currentFloorId, floorElevation, inchesToWorld, hasTestMap = true,
      isDeleteWallMode = false
    } = options;

    if (!this.show3DGrid || currentView !== '3d' || !this.scene || !hasTestMap) return;

    const step = Math.max(0.25, snapEnabled && snapSize ? snapSize : 1);
    const bounds = this._get3DGridBounds({ walls, rooms, roofs, stairs, items, snapEnabled, snapSize, inchesToWorld });
    const y = floorElevation + 0.012;
    const lines = [];
    const axisLines = [];

    for (let x = bounds.minX; x <= bounds.maxX + 0.001; x += step) {
      if (Math.abs(x) < 0.001) {
        axisLines.push([new BABYLON.Vector3(x, y, bounds.minZ), new BABYLON.Vector3(x, y, bounds.maxZ)]);
      } else {
        const p1 = new BABYLON.Vector3(x, y, bounds.minZ);
        const p2 = new BABYLON.Vector3(x, y, bounds.maxZ);
        lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
      }
    }
    for (let z = bounds.minZ; z <= bounds.maxZ + 0.001; z += step) {
      if (Math.abs(z) < 0.001) {
        axisLines.push([new BABYLON.Vector3(bounds.minX, y, z), new BABYLON.Vector3(bounds.maxX, y, z)]);
      } else {
        const p1 = new BABYLON.Vector3(bounds.minX, y, z);
        const p2 = new BABYLON.Vector3(bounds.maxX, y, z);
        lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
      }
    }

    // 为地板抬高的房间额外绘制 3D 辅助网格
    rooms.forEach((room) => {
      if (room.floorId !== currentFloorId) return;
      const elev = room.elevation || 0;
      if (elev <= 0.001) return;

      const yRoom = floorElevation + elev + 0.012;
      const rLeft = room.x - room.width / 2;
      const rRight = room.x + room.width / 2;
      const rTop = room.z - room.depth / 2;
      const rBottom = room.z + room.depth / 2;

      const startX = Math.ceil(rLeft / step) * step;
      const endX = Math.floor(rRight / step) * step;
      const startZ = Math.ceil(rTop / step) * step;
      const endZ = Math.floor(rBottom / step) * step;

      for (let x = startX; x <= endX + 0.001; x += step) {
        if (Math.abs(x) < 0.001) {
          axisLines.push([new BABYLON.Vector3(x, yRoom, rTop), new BABYLON.Vector3(x, yRoom, rBottom)]);
        } else {
          const p1 = new BABYLON.Vector3(x, yRoom, rTop);
          const p2 = new BABYLON.Vector3(x, yRoom, rBottom);
          lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
        }
      }
      for (let z = startZ; z <= endZ + 0.001; z += step) {
        if (Math.abs(z) < 0.001) {
          axisLines.push([new BABYLON.Vector3(rLeft, yRoom, z), new BABYLON.Vector3(rRight, yRoom, z)]);
        } else {
          const p1 = new BABYLON.Vector3(rLeft, yRoom, z);
          const p2 = new BABYLON.Vector3(rRight, yRoom, z);
          lines.push(...this._createDashedLineSegments(p1, p2, 0.08, 0.08));
        }
      }
    });

    const isDeleteWall = !!isDeleteWallMode;
    if (lines.length) {
      const grid = BABYLON.MeshBuilder.CreateLineSystem('floor_grid_3d', { lines }, this.scene);
      grid.color = isDeleteWall ? BABYLON.Color3.FromHexString('#ff9999') : BABYLON.Color3.FromHexString('#c2cbd6');
      grid.alpha = isDeleteWall ? 0.12 : 0.08;
      grid.isPickable = false;
      grid.renderingGroupId = 0;
      this.grid3DNodes.push(grid);
    }
    if (axisLines.length) {
      const axes = BABYLON.MeshBuilder.CreateLineSystem('floor_grid_3d_axes', { lines: axisLines }, this.scene);
      axes.color = isDeleteWall ? BABYLON.Color3.FromHexString('#ff4d4f') : BABYLON.Color3.FromHexString('#8fb8e8');
      axes.alpha = isDeleteWall ? 0.38 : 0.28;
      axes.isPickable = false;
      axes.renderingGroupId = 0;
      this.grid3DNodes.push(axes);
    }
  }

  /**
   * 销毁渲染器，释放所有资源
   */
  dispose() {
    this.clear3DGrid();
    window.removeEventListener('resize', this._resizeHandler);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
