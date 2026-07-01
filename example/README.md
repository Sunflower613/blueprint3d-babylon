# 户型编辑器演示项目架构说明 (example)

本演示项目是一个基于 Babylon.js 的 2D/3D 户型编辑器前端应用。为了打破原有单一巨型文件 `app.js`（上帝对象）带来的开发高耦合，本应用进行了一场**渐进式的模块化状态重构**。

---

## 1. 文件与目录结构

重构后的目录架构分为以下三个核心分层，职责极度单一且清晰：

```
example/
├── type/                  # 静态类型声明层 (JSDoc Type Definitions)
│   ├── common.js          # 公共基础类型 (SelectedTarget, TargetType 等)
│   ├── uiState.js         # UI 交互状态类型说明
│   ├── selectionState.js  # 选中实体状态类型说明
│   ├── editorPreviewState.js # 编辑预览及对齐捕捉状态类型说明
│   └── appState.js        # 聚合的主 AppState 类型说明
│
├── store/                 # 运行时状态管理层 (Runtime State Stores)
│   ├── index.js           # 全局唯一实例出口 (导出 ui, selection, editor 单例)
│   ├── uiStore.js         # 托管 UI 模式、菜单等状态的 Store 类
│   ├── selectionStore.js  # 托管选中的家具、门窗、房间等 ID 的 Store 类
│   ├── editorPreviewStore.js # 托管绘制预览、网格对齐等状态的 Store 类
│   └── proxyHelper.js     # 核心黑魔法：代理状态引流桥接助手
│
├── js/                    # 业务逻辑处理器层 (Handler Processors)
│   ├── DragHandler.js     # 2D 拖拽、缩放房间/墙体等交互
│   ├── MaterialManager.js # 材质库渲染、涂刷、取色与锁状态逻辑
│   ├── TargetHandler.js        # 右键上下文菜单动作（复制、删除、旋转）
│   ├── SvgEvents.js       # 2D SVG 视图下的指针、滚轮与绘制控制
│   ├── Viewer3DHandles.js # 3D 视口下的编辑轴与拖拽交互
│   └── EditorUi.js        # 侧边面板 input 控件的值绑定与同步
│
└── app.js                 # 底层引擎初始化、3D 渲染主循环与业务调度器
```

---

## 2. 状态管理核心机制

### 2.1 状态引流与解耦
所有的运行时状态都被规整进了 `store/` 子域的 Store 单例中，在任意业务逻辑 Handler 里，您都可以直接采用 **ES Module** 方式引入最新的状态：

```javascript
import { ui, selection, editor } from '../store/index.js';

// 读取状态
if (ui.mode === 'select') {
  console.log('当前处于选择模式');
}

// 写入状态
selection.selectedItemId = 'item_1';
```

### 2.2 代理桥接助手 (Proxy Helper)
为了在重构大交互 Handler 时实现**“零代码改动风险”**与**“彻底剥离 appState 扁平属性”**，我们使用了 [proxyHelper.js](store/proxyHelper.js) 的代理沙箱技术：
* **拦截分流**：Handler 内部保留对 `ctx.selectedItemId` 或 `ctx.mode` 的读取，但 Proxy 自动将其在底层重定向到了对应的 `selection.selectedItemId` 和 `ui.mode` 上。
* **方法透传**：对于非状态的方法调用（如 `ctx.pushHistory()`, `ctx.testMap` 等），代理会自动透传回 `app.js` 注入的原始上下文中，实现了状态与方法的完美分级。

### 2.3 双向状态同步 (Sync Loop)
在 `app.js` 内部，主控制逻辑使用了一个 `syncLocalToStore()` 局部更新函数。在所有实体选择（`selectTarget`）、设计模式变更（`setDesignMode`）、快照恢复等核心流程的尾部，会自动触发此同步，从而保证：
1. `app.js` 内部扁平的局部变量在运算时高效响应。
2. 全局独立 Store 的属性数据始终为最新，可被所有 Handler 直接可靠读取。

---

## 3. 日常开发指南

1. **新增状态属性**：
   * 请不要在 `app.js` 头部新增全局 `let` 变量或在 `appState` 对象上直接挂载字段。
   * 优先将其添加到 `store/` 下对应的子域 Store 类（如 `uiStore.js`）的构造函数中。
   * 在 `type/` 下对应的类型声明中加上 JSDoc 注释，以便享受 IDE 强大的补全支持。

2. **调用引擎底层接口**：
   * 各处理器 Handler 在初始化（如 `initTargetHandler(ctx)`）时，会被注入 `ctx` 上下文。
   * 凡是涉及底层 3D 资源（如 `ctx.viewer3d`, `ctx.scene` 等）或历史管理、全局弹窗的操作，依旧请通过 `ctx.xxx()` 进行调用。
