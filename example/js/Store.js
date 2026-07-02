/**
 * Store.js — blueprint3d-babylon 数据中心
 *
 * 职责：
 *   1. 撤销/重做历史栈管理
 *   2. localStorage 持久化存储
 *   3. 10 分钟自动保存定时器
 *   4. 工具面板折叠状态管理
 *   5. 事件通知
 */

// =============================================
// localStorage 存储键
// =============================================
const STORAGE_KEY_BUILDING = 'blueprint3d-building-data';
const STORAGE_KEY_MATERIAL = 'blueprint3d-material-library';
const STORAGE_KEY_UI_STATE = 'blueprint3d-ui-state';
const STORAGE_KEY_TOOL_GROUPS = 'blueprint3d-tool-groups';
const STORAGE_KEY_SAVE_TS = 'blueprint3d-save-timestamp';
const STORAGE_KEY_PROJECTS_INDEX = 'blueprint3d-projects-index';
const STORAGE_KEY_PROJECT_PREFIX = 'blueprint3d-project-';
const STORAGE_KEY_CURRENT_PROJECT = 'blueprint3d-current-project';

export function readLocalSave() {
  try {
    const rawBuilding = localStorage.getItem(STORAGE_KEY_BUILDING);
    const rawMaterial = localStorage.getItem(STORAGE_KEY_MATERIAL);
    const rawUI = localStorage.getItem(STORAGE_KEY_UI_STATE);
    return {
      buildingData: rawBuilding ? JSON.parse(rawBuilding) : null,
      materialLibrary: rawMaterial ? JSON.parse(rawMaterial) : null,
      uiState: rawUI ? JSON.parse(rawUI) : null,
    };
  } catch (error) {
    console.error('Failed to read local save:', error);
    return { buildingData: null, materialLibrary: null, uiState: null };
  }
}

// =============================================
// 简易 EventEmitter
// =============================================
class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * 注册事件监听
   * @param {string} event
   * @param {Function} fn
   * @returns {() => void} 取消注册函数
   */
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }

  /**
   * 触发事件
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    const fns = this._listeners.get(event);
    if (fns) fns.forEach((fn) => fn(...args));
  }
}

// =============================================
// Store 类
// =============================================
export class Store extends EventEmitter {
  /**
   * @param {object} opts
   * @param {() => object} opts.getSnapshot - 获取当前建筑快照（返回纯 JSON 可克隆对象）
   * @param {(data: object) => void} opts.applySnapshot - 将快照数据恢复到场景
   * @param {number} [opts.maxHistory=80] - 历史栈最大深度
   * @param {number} [opts.autoSaveInterval=600000] - 自动保存间隔毫秒数（默认 10 分钟）
   */
  constructor({ getSnapshot, applySnapshot, maxHistory = 80, autoSaveInterval = 600000 }) {
    super();
    this._getSnapshot = getSnapshot;
    this._applySnapshot = applySnapshot;
    this._maxHistory = maxHistory;
    this._autoSaveInterval = autoSaveInterval;

    /** @type {object[]} 撤销栈 */
    this.undoStack = [];
    /** @type {object[]} 重做栈 */
    this.redoStack = [];

    /** 自动保存脏标记 */
    this._dirty = false;
    /** 自动保存定时器 ID */
    this._autoSaveTimer = null;

    /** 当前活动项目名（用于自动保存） */
    this.currentProjectName = null;
  }

  // =============================================
  // 通用工具
  // =============================================

  /** 深拷贝一份数据 */
  cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /** 获取当前场景的快照（深拷贝） */
  snapshot() {
    return this.cloneData(this._getSnapshot());
  }

  // =============================================
  // 撤销/重做
  // =============================================

  /** 推入一个新的历史记录 */
  pushHistory() {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > this._maxHistory) this.undoStack.shift();
    this.redoStack = [];
    this._dirty = true;
    this.emit('historyChanged');
  }

  /** 恢复一份快照数据到场景 */
  restoreSnapshot(data) {
    this._applySnapshot(data);
  }

  /** 撤销 */
  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.snapshot());
    this.restoreSnapshot(this.undoStack.pop());
    this._dirty = true;
    this.emit('historyChanged');
  }

  /** 重做 */
  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.snapshot());
    this.restoreSnapshot(this.redoStack.pop());
    this._dirty = true;
    this.emit('historyChanged');
  }

  /** 查询撤销/重做是否可用 */
  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  // =============================================
  // localStorage 持久化
  // =============================================

  /**
   * 将当前建筑数据保存到 localStorage
   * @param {object} [extra] - 额外需要保存的数据 (如 materialLibrary)
   * @returns {boolean} 是否保存成功
   */
  saveToLocal(extra = {}) {
    try {
      const buildingData = this._getSnapshot();
      localStorage.setItem(STORAGE_KEY_BUILDING, JSON.stringify(buildingData));

      if (extra.materialLibrary) {
        localStorage.setItem(STORAGE_KEY_MATERIAL, JSON.stringify(extra.materialLibrary));
      }

      if (extra.uiState) {
        localStorage.setItem(STORAGE_KEY_UI_STATE, JSON.stringify(extra.uiState));
      }

      localStorage.setItem(STORAGE_KEY_SAVE_TS, String(Date.now()));
      this._dirty = false;
      this.emit('saved');
      return true;
    } catch (error) {
      console.error('保存到 localStorage 失败:', error);
      this.emit('saveError', error);
      return false;
    }
  }

  /**
   * 从 localStorage 加载建筑数据
   * @returns {{ buildingData: object|null, materialLibrary: any[]|null, uiState: object|null }}
   */
  loadFromLocal() {
    try {
      const rawBuilding = localStorage.getItem(STORAGE_KEY_BUILDING);
      const rawMaterial = localStorage.getItem(STORAGE_KEY_MATERIAL);
      const rawUI = localStorage.getItem(STORAGE_KEY_UI_STATE);

      return {
        buildingData: rawBuilding ? JSON.parse(rawBuilding) : null,
        materialLibrary: rawMaterial ? JSON.parse(rawMaterial) : null,
        uiState: rawUI ? JSON.parse(rawUI) : null,
      };
    } catch (error) {
      console.error('从 localStorage 读取失败:', error);
      return { buildingData: null, materialLibrary: null, uiState: null };
    }
  }

  /** 检查 localStorage 中是否有已保存的建筑数据 */
  hasLocalSave() {
    return localStorage.getItem(STORAGE_KEY_BUILDING) !== null;
  }

  /** 获取上次保存的时间戳 */
  getLastSaveTime() {
    const ts = localStorage.getItem(STORAGE_KEY_SAVE_TS);
    return ts ? Number(ts) : null;
  }

  /** 清除 localStorage 中所有保存的数据 */
  clearLocal() {
    try {
      localStorage.removeItem(STORAGE_KEY_BUILDING);
      localStorage.removeItem(STORAGE_KEY_MATERIAL);
      localStorage.removeItem(STORAGE_KEY_UI_STATE);
      localStorage.removeItem(STORAGE_KEY_SAVE_TS);
    } catch (error) {
      console.error('清除 localStorage 失败:', error);
    }
  }

  // =============================================
  // 工具面板折叠状态（独立存储）
  // =============================================

  /** 读取工具面板折叠状态 */
  readToolGroupState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_TOOL_GROUPS) || '{}');
    } catch (error) {
      return {};
    }
  }

  /** 写入工具面板折叠状态 */
  writeToolGroupState(state) {
    try {
      localStorage.setItem(STORAGE_KEY_TOOL_GROUPS, JSON.stringify(state));
    } catch (error) {
      // 忽略存储异常；当前会话仍可正常工作
    }
  }

  // =============================================
  // 自动保存
  // =============================================

  /**
   * 启动定时自动保存
   * @param {() => object} getExtra - 获取需要一并保存的附加数据（materialLibrary 等）
   */
  startAutoSave(getExtra = () => ({})) {
    this.stopAutoSave();
    this._getAutoSaveExtra = getExtra;
    this._autoSaveTimer = setInterval(() => {
      this._performAutoSave();
    }, this._autoSaveInterval);

    // 页面关闭/隐藏时也自动保存
    this._visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this._performAutoSave();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    // 页面即将卸载时保存
    this._beforeUnloadHandler = () => {
      this._performAutoSave();
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  /** 停止定时自动保存 */
  stopAutoSave() {
    if (this._autoSaveTimer !== null) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
  }

  /** 执行一次自动保存（仅在脏标记时写入） */
  _performAutoSave() {
    if (!this._dirty) return;
    const extra = this._getAutoSaveExtra ? this._getAutoSaveExtra() : {};
    const ok = this.saveToLocal(extra);
    if (ok) {
      this.emit('autoSaved');
    }
  }

  /** 手动标记数据已变更（用于非 pushHistory 的修改） */
  markDirty() {
    this._dirty = true;
  }

  // =============================================
  // 多项目管理
  // =============================================

  /**
   * 读取项目索引列表
   * @returns {{ id: string, name: string, savedAt: number }[]}
   */
  listProjects() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS_INDEX) || '[]');
    } catch (error) {
      return [];
    }
  }

  /** 写入项目索引 */
  _saveProjectIndex(index) {
    localStorage.setItem(STORAGE_KEY_PROJECTS_INDEX, JSON.stringify(index));
  }

  /**
   * 保存当前场景为命名项目
   * @param {string} name - 项目名称
   * @param {object} [extra] - 附加数据
   * @returns {boolean}
   */
  saveProject(name, extra = {}) {
    try {
      const id = this._nameToId(name);
      const buildingData = this._getSnapshot();
      const projectPayload = {
        name,
        buildingData,
        materialLibrary: extra.materialLibrary || null,
        uiState: extra.uiState || null,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY_PROJECT_PREFIX + id, JSON.stringify(projectPayload));

      // 更新索引
      const index = this.listProjects();
      const existing = index.findIndex((p) => p.id === id);
      const meta = { id, name, savedAt: projectPayload.savedAt };
      if (existing >= 0) {
        index[existing] = meta;
      } else {
        index.unshift(meta);
      }
      this._saveProjectIndex(index);

      // 同时更新当前活动项目
      this.currentProjectName = name;
      localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, name);

      // 也同步到旧的单一存储（兼容自动保存和启动恢复）
      this.saveToLocal(extra);

      this._dirty = false;
      this.emit('saved');
      return true;
    } catch (error) {
      console.error('保存项目失败:', error);
      this.emit('saveError', error);
      return false;
    }
  }

  /**
   * 加载指定名称的项目
   * @param {string} name
   * @returns {{ buildingData: object|null, materialLibrary: any[]|null, uiState: object|null, name: string }|null}
   */
  loadProject(name) {
    try {
      const id = this._nameToId(name);
      const raw = localStorage.getItem(STORAGE_KEY_PROJECT_PREFIX + id);
      if (!raw) return null;
      const data = JSON.parse(raw);
      this.currentProjectName = data.name || name;
      localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, this.currentProjectName);
      return data;
    } catch (error) {
      console.error('加载项目失败:', error);
      return null;
    }
  }

  /**
   * 删除指定名称的项目
   * @param {string} name
   */
  deleteProject(name) {
    try {
      const id = this._nameToId(name);
      localStorage.removeItem(STORAGE_KEY_PROJECT_PREFIX + id);
      const index = this.listProjects().filter((p) => p.id !== id);
      this._saveProjectIndex(index);
    } catch (error) {
      console.error('删除项目失败:', error);
    }
  }

  /** 获取当前活动项目名 */
  getCurrentProjectName() {
    if (this.currentProjectName) return this.currentProjectName;
    try {
      return localStorage.getItem(STORAGE_KEY_CURRENT_PROJECT) || null;
    } catch (error) {
      return null;
    }
  }

  /** 将项目名转为安全的存储 ID */
  _nameToId(name) {
    return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, '-'));
  }
}

// =============================================
// Toast 提示辅助
// =============================================

/**
 * 在页面上显示一个短暂的 toast 提示
 * @param {string} message - 提示文字
 * @param {number} [duration=2500] - 显示持续时间（毫秒）
 */
export function showToast(message, duration = 2500) {
  // 复用已有容器或创建一个
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'store-toast';
  toast.textContent = message;
  toast.style.cssText = `
    padding: 8px 20px;
    background: rgba(30, 30, 30, 0.88);
    color: #fff;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: auto;
    white-space: nowrap;
  `;

  container.appendChild(toast);

  // 触发入场动画
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // 定时移除
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 格式化时间戳为可读字符串
 * @param {number} ts - 毫秒时间戳
 * @returns {string}
 */
export function formatTimestamp(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
