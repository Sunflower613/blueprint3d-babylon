# 示例应用抽象组件说明 (js/)

本目录存放了示例应用（Example App）中各功能模块的抽象组件与工具库，采用首字母大写的命名规范。以下是各个文件的职责说明：

## 文件列表及职责

### 1. [Dialogs.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Dialogs.js)
- **职责**: 自定义弹窗系统组件。
- **提供接口**:
  - `showCustomConfirm(title, message)`: 异步确认弹窗（确认/取消）。
  - `showCustomAlert(title, message)`: 异步警告提示弹窗（仅确定）。
  - `showCustomPrompt(title, message, defaultValue)`: 异步单行输入弹窗。
  - `showProjectListModal(projects)`: 本地已保存项目列表的管理与选择弹窗（支持打开和删除）。

### 2. [DragHandler.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/DragHandler.js)
- **职责**: 2D 拖动交互与拉伸状态管理器。
- **提供接口**:
  - `initDragHandler(context)`: 初始化交互上下文环境。
  - `beginRoomDrag()`, `moveRoomDrag()`, `finishRoomEdit()`: 房间的位移拖拽与坐标吸附。
  - `beginWallDrag()`, `moveWallDrag()`, `finishWallDrag()`: 墙体的移动、对齐与自动合并。
  - `beginOpeningDrag()`, `moveOpeningDrag()`, `finishOpeningDrag()`: 墙面开洞（门/窗）的滑动拖动与坐标投影。
  - `beginFenceDrag()`, `moveFenceDrag()`, `finishFenceDrag()`, `moveFenceHandleDrag()`, `moveFenceGateDrag()`: 围栏与大门在轨道上的缩放与滑动拖拽。
  - `beginStructureDrag()`, `moveStructureDrag()`: 楼梯、屋顶等非贴墙结构的移动与吸附。

### 3. [Dropdown.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Dropdown.js)
- **职责**: 自定义下拉选择器组件。
- **提供接口**:
  - `createCustomDropdown(selectId)`: 初始化自定义下拉选择框。隐藏原生的 `select` 元素，生成精美的自定义下拉框 UI 并利用 `MutationObserver` 监听原生 `select` 子节点的变化，提供状态双向绑定与自动销毁功能。

### 4. [EditorUi.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/EditorUi.js)
- **职责**: 编辑器 UI 面板控制与属性映射组件。
- **工作内容**:
  - 维护 2D/3D 网格吸附等控制逻辑。
  - 处理各类建筑结构（房间、墙体、家具、围栏等）的选中状态及属性面板数据的双向绑定。
  - 管理材质应用事件监听、历史纪录推送等与 HTML 界面强相关的操作。

### 5. [EntityManager.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/EntityManager.js)
- **职责**: 3D 实体/部件生命周期管理器。
- **工作内容**:
  - 负责加载、更新和删除 3D 空间内的所有实体（包括墙体、房间、开洞、家具及栅栏门等）。
  - 处理部件间的附着、坐标对齐及拾取（Picking）事件。

### 6. [FileManager.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/FileManager.js)
- **职责**: 建筑存档导入导出及本地项目库管理器。
- **提供接口**:
  - `initFileManager(context)`: 初始化并自动绑定页面保存、加载、导入导出等相关按钮（如 `btn-save`、`btn-open-local` 等）的点击与改变事件。
  - `downloadBuildingFile()`: 导出并下载建筑 JSON 格式存档。
  - `downloadDXFFile()`: 导出并下载 CAD DXF 平面轮廓图。
  - `download3MFFile()`: 导出并下载 3D 打印 3MF 三维模型数据包。
  - `loadBuildingFile(file)`: 异步读取并加载用户选择的本地存档文件。
  - `saveToLocalStorage()`: 保存设计项目至浏览器本地的 LocalStorage 数据库。
  - `openLocalStorageList()`: 弹出本地项目列表以供选择打开或删除。
  - `updateLocalProjectCount()`: 统计已保存的本地项目数并更新页面顶部的指示角标。

### 7. [Hotkeys.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Hotkeys.js)
- **职责**: 键盘快捷键处理组件。
- **提供接口**:
  - `handleHotkeys(event, ctx)`: 按键分发函数。接管所有的键盘事件（WASD 移动、箭头微调、PageUp/PageDown 高度控制、Delete 删除、Ctrl+Z/Y 撤销重做等），并通过 Context 触发 `app.js` 的各项逻辑，实现了快捷键系统与主应用的逻辑解耦。

### 8. [Render2D.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Render2D.js)
- **职责**: 2D 平面户型图绘图与坐标转换引擎。
- **工作内容**:
  - 提供 `worldToSvg` / `svgToWorld` 等 2D-3D 空间转换数学工具。
  - 负责利用 SVG Element 动态渲染平面房间、墙体、开洞（门窗）、栅栏及楼梯等建筑实体的 2D 轮廓。
  - 在 2D 画布上绘制拉伸、缩放、旋转等控制手柄，并提供相应的事件绑定 and 回调派发。

### 9. [Store.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Store.js)
- **职责**: 本地持久化与公共工具库。
- **提供接口**:
  - `Store`: 封装了基于 localStorage 的项目保存、加载、编辑器偏好设置读写逻辑。
  - `showToast(message, duration)`: 全局悬浮轻提示。
  - `formatTimestamp(timestamp)`: 时间戳人性化格式化函数。

### 10. [SvgEvents.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/SvgEvents.js)
- **职责**: 2D 视口画布事件绑定监听与平移缩放管理器。
- **提供接口**:
  - `initSvgEvents(context)`: 初始化并为 2D 户型图画布 `svg` 注册 8 个基础事件处理器（`mousedown`、`wheel`、`pointerdown`、`pointermove`、`pointerup`、`pointercancel`、`dblclick`、`click`）。
  - `resetSvgInteractionState()`: 重置用于平移缩放、双指手势跟踪的临时状态变量。
  - 接管了 2D 视图下的手势平移、鼠标滚轮缩放、多指触摸缩放平移以及双击恢复等逻辑。
  - 托管了在 `draw-wall` 绘制墙体、`draw-fence` 绘制围栏、`add-roof`/`add-stairs` 等新增物体时的点击创建和移动预览逻辑。

### 11. [Topology.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Topology.js)
- **职责**: 拓扑几何分析与物理交互计算工具。
- **工作内容**:
  - 计算墙体交叉、房间围合区域以及几何形状的对称性判定。
  - 提供了家具/假人的物理交互与吸附摆放算法，包括：`canPlaceOnTable`（桌上物品判定）、`findTableBelow`（寻找地坪上的下托桌面物体）、`findNearestSeat`（为假人寻找就近的空闲椅凳座位）等。
  - 提供了地板边缘与楼梯扶手空间几何分析算法，包括：`getFreeFloorEdges`（提取暴露且未靠墙的自由地板边缘线段）和 `getStairsRailingSegments`（统一计算 6 种楼梯子类别的扶手立柱分段世界坐标轨迹、倾角及高度偏置值）。
  - 提供纯几何维度的图论与计算几何算法支持。

### 12. [Viewer3D.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Viewer3D.js)
- **职责**: Babylon.js 3D 渲染核心层封装。
- **工作内容**:
  - 初始化 Babylon.js 渲染引擎、场景、相机及灯光系统。
  - 处理阴影渲染（Shadow Generator）、视角切换（2D/3D 投影）、截图导出等 3D 引擎底层的逻辑。

### 13. [Viewer3DHandles.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Viewer3DHandles.js)
- **职责**: 3D 视角编辑手柄（3D Handles）交互管理器。
- **工作内容**:
  - 负责在 3D 场景中动态构建、渲染及按相机距离自动缩放各个实体的拉伸、旋转控制网格手柄（Edit Handles）。
  - 实现 3D 场景下鼠标/触控拖拽手柄拉伸墙体、移动结构位置、调节倾角曲线等复杂的实时物理联动计算与模型预览更新。

### 14. [Icons.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/Icons.js)
- **职责**: 快捷菜单与界面微型 SVG 操作图标管理器。
- **工作内容**:
  - 静态收录了所有 2D 平面图以及 3D 实体的编辑/复制/删除/置顶/锁定等快捷交互所用到的全部图标的 SVG 属性与图元数据。
  - 导出了唯一的生成工具方法 `iconSvg(name)`，极大地简化了上下文悬浮菜单按钮图标渲染工作。

### 15. [TargetHandler.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/TargetHandler.js)
- **职责**: 2D/3D 交互目标（Target）管理器。
- **提供接口**:
  - `initTargetHandler(context)`: 初始化并注入交互上下文环境。
  - `isAllowedTarget(target)`、`getTargetObject(target)`: 交互目标的类型过滤与实体对象检索。
  - `isTargetLocked(target)`、`setTargetLocked(target, locked)`、`toggleTargetLock(target)`: 交互目标的锁定与解锁管理。
  - `showObjectContextMenu(target, clientX, clientY)`: 渲染物体的右键悬浮上下文菜单。
  - `copyTarget(target)`、`rotateTarget(target)`、`mirrorTarget(target)`、`deleteTarget(target)`: 交互目标的复制、旋转、镜像与删除等快捷操作。
  - `selectTarget(target)`: 关联楼层检查并选中指定的交互目标。
  - `get3DTarget(event)`: 3D 视口内鼠标点击拾取交互目标的过滤与解析。

### 16. [MaterialManager.js](file:///d:/code/3d-babylon/blueprint3d-babylon/example/js/MaterialManager.js)
- **职责**: 材质库界面管理与材质涂刷处理器。
- **提供接口**:
  - `initMaterialManager(context)`: 初始化并注入交互上下文环境。
  - `updateComponentMaterial(type, id, part, material, rebuild)`: 更新指定组件类型和部件的材质/颜色并重新渲染（支持墙面、楼梯、屋顶、篱笆、门窗、房间等）。
  - `applyMaterialToItemComponent(componentId, material)`: 涂刷家具特定三维部件（Component）的材质。
  - `renderMaterialLibrary()`: 根据当前分类动态渲染材质库（Material Library）的 swatch 缩略图列表、自定义发光取色器及自定义材质命名编辑与删除面板。
  - `saveCustomMaterialToLocalStorage(id, src)`: 保存自定义上传的图片材质 Base64 源至 LocalStorage。
  - `removeCustomMaterialFromLocalStorage(id)`: 从 LocalStorage 移除自定义材质缓存。

---

## 引用机制说明

为了降低各组件间的交叉依赖，大部分全局状态和顶层逻辑接口都统一放在主入口 `example/app.js` 中管理。
- **初始化上下文绑定**: 复杂交互与控制组件（如 `DragHandler`、`SvgEvents`、`FileManager`、`TargetHandler`、`MaterialManager`）采用 `initX(context)` 动态注入机制。主应用通过代理对象将所需的全局变量、回调方法与引擎实例传入，实现了交互动作与主体架构的高解耦。
- **UI 及状态同步**: `app.js` 通过将回调绑定至各个子组件，实现了从几何网络到 3D 视图与 HTML 面板的自动化渲染和同步更新。
