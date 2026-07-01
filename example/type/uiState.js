/**
 * uiState.js — UI 交互与视图模式状态类型定义
 */

/**
 * @typedef {Object} UIState
 * @property {string} mode - 当前模式 (如 'select', 'draw-wall' 等)
 * @property {string} currentView - 当前视图 ('2d' | '3d')
 * @property {string} designMode - 当前涂刷模式
 * @property {boolean} floorPanelCollapsed - 楼层浮动面板是否折叠
 * @property {HTMLElement|null} contextMenuElement - 当前打开的右键上下文菜单 DOM 元素
 */
