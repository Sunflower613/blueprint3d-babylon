/**
 * uiStore.js — UI 交互与视图模式状态 Class
 */

export class UIStore {
  constructor() {
    this.mode = 'select'; // 当前模式 (如 'select', 'draw-wall' 等)
    this.currentView = '2d'; // 当前视图 ('2d' | '3d')
    this.designMode = 'select'; // 当前涂刷模式
    this.floorPanelCollapsed = false; // 楼层浮动面板是否折叠
    this.contextMenuElement = null; // 当前打开的右键上下文菜单 DOM 元素
  }
}
