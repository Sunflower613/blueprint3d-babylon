# blueprint3d-babylon

[![Engine](https://img.shields.io/badge/Engine-Babylon.js%20%3E%3D%207.11.0-orange?style=flat-square)](https://github.com/BabylonJS/Babylon.js)
[![Vite](https://img.shields.io/badge/Build-Vite%20%3E%3D%205.0.0-blue?style=flat-square)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)
[![Format](https://img.shields.io/badge/Format-ESM%20(Module)-brightgreen?style=flat-square)](#)
[![Platform](https://img.shields.io/badge/Platform-Desktop%20%26%20Mobile-blueviolet?style=flat-square)](#)

`blueprint3d-babylon` 是一个基于 **Babylon.js** 渲染引擎构建的、面向现代网页的轻量级 2D/3D 蓝图式建筑与室内设计编辑核心库。本项目不仅具备高效的 2D 户型排版设计与 3D 场景同步渲染能力，还针对复杂的墙体打洞 CSG 布尔运算、双向状态管理及三维工程数据导出进行了深度的工业级优化，是搭建三维建筑设计软件、家园沙盘系统或元宇宙室内装潢底座的理想开源框架。

![项目主界面截图](docs/images/gameplay.png)

> **网络搜索关键词 (SEO Keywords)**:
> `Babylon.js 3D Editor`, `3D Floorplan Editor`, `网页 3D 户型编辑器`, `2D/3D 建筑设计开源库`, `三维室内设计框架`, `CSG 墙体打洞布尔运算`, `CAD DXF 导出`, `3MF 3D打印模型导出`, `前端三维家装沙盘`, `Web 3D 材质涂刷吸管`.

---

## 🔗 在线预览与本地运行

### 🚀 在线演示 (Live Demo)
*   **在线体验地址**: [https://Sunflower613.github.io/blueprint3d-babylon/](https://Sunflower613.github.io/blueprint3d-babylon/)
*   *提供完善的 2D 拖拽、3D 漫游、家电开关控制、材质吸取与分部涂刷、CAD/3MF 图纸导出等全量功能演示。*

### 💻 本地快速启动
如果您希望在本地运行和调试示例项目，请在项目根目录下执行：

```bash
# 1. 安装依赖项目
npm install

# 2. 启动本地开发服务 (基于 Vite)
npm run dev
```
启动成功后，在浏览器中访问以下本地服务地址即可进行调试开发：
[http://127.0.0.1:3000/blueprint3d-babylon/example/index.html](http://127.0.0.1:3000/blueprint3d-babylon/example/index.html)

---

## 🌟 核心能力 (Core Features)

*   🔄 **2D / 3D 双向实时同步与切换**：支持 2D SVG 户型图编辑与 3D 真实 Babylon 渲染场景的高效同步，支持多指/双指触控（旋转、平移、缩放），适配手机和平板端。
*   🧱 **智能墙体与空间编辑 (Smart Wall & Room Topology)**：
    *   提供**方形、L形、圆形、八角、四角、扇形、半圆、直角三角形** 8 种预置房间形状，拖入画布自动沿外轮廓逐边渲染物理墙体。
    *   **拖拽临时锁机制**：拖动房间位移时，网格吸附与拓扑包含算法会自动启用临时锁，只联动该房间内部的关联家具，防止坐标临时重叠时将房间外的零散家具错误“吸入”网格。
    *   完善的网格对齐与吸附（Grid Snapping）系统。
*   ✂️ **无缝开洞与碰撞代理 (CSG Cutters & Pick Proxy)**：
    *   **动态 CSG 开洞与缝合**：在墙体上拖拽门窗时，动态生成厚度 4 倍的 Cutter 实体进行 CSG 布尔相减，并在相交边界自动缝合生成封口网格与整体法线，彻底避免了光影破面与 Z-Fighting 穿模。
    *   **隐藏态 pick 代理**：当右键菜单隐藏门板或窗户玻璃时，自动在原位置保留一个极低可见度（`visibility = 0.001`）但 `isPickable = true` 的包围碰撞代理，防止用户在 3D 视图下隐藏实体后因无法点选而不能复原。
    *   **无闪白丝滑拖动（延迟开洞计算）**：在移动拖拽、旋转期间，为保证画面顺滑且无闪白卡顿，**不对墙体进行实时的重新分割构建**。期间仅动态更新墙体节点 (`TransformNode`) 及其子门窗节点的 `position` 与 `rotation`，直至用户**松手后（拖拽/旋转结束）**再触发全局 `build` 重新计算并开洞。
*   🚪 **高级双开门对称动画**：
    *   针对 `doubleDoor` 配置，自动在左右两侧建立相反角度的旋转铰链（Hinges），实现扇形对称同步开启。
    *   底层顶点数据在 X 轴向左右两侧截半裁剪，**不经过布尔运算产生垃圾网格，渲染性能卓越**。
*   🖌️ **智能材质刷与取色吸管 (Pipette & Paint System)**：
    *   **吸管取色**：支持精准吸取（吸取目标子 SubMesh 的单材质）和全量吸取（吸取家具的所有材质包暂存为数组）。
    *   **材质刷与油漆桶**：支持单组件涂刷，及基于 `roomId` 进行整间房间同类墙面/家具/门窗批量涂刷的“油漆桶”模式。光标指针会根据选定的单材质或渐变材质数组，在 CSS 样式层和 SVG 矢量层渲染高度同步的渐变/实色画笔指针。
*   🔌 **家电开关状态与 3D 特效联动 (Appliance Control)**：
    *   所有家电支持在 2D/3D 中进行逻辑开关，开启时动态触发材质自发光（Emissive glows）、呼吸灯（pulse 动效）、摆头旋转（oscillate 动效，如电风扇）或高频微震（vibrate 动效，如破壁机），并可在偏置处自动挂载/回收 Spotlight 光源。
*   📐 **多楼层及工程级数据导出 (CAD & 3D Print IO)**：
    *   支持**多楼层（Multi-floor）**数据树，支持一键保存为轻量级自定义 `*.b3dbuilding.json`。
    *   **CAD (DXF) 导出**：自动将各楼层分离为标准的建筑图层集（`F01-A-WALL`, `F01-A-DOOR` 等），画出墙体双线面、门开启弧线、尺寸标注与面积注释。
    *   **3MF 模型导出**：完美导出 3MF 格式三维制造文件，各楼层与家具组件作为独立命名实体导出，并支持导出家具带有基材的高清 RGB 颜色数据，可直接供 3D 打印软件进行切片打印。
    
    | CAD 导出图纸预览 | 3MF 3D打印导出预览 |
    | :---: | :---: |
    | ![CAD DXF 导出效果图](docs/images/cad_export.png) | ![3MF 导出模型效果图](docs/images/3mf_export.png) |
*   🪞 **多级镜面与反射方案 (Multi-Level Reflection Strategy & Resolution Grading)**：
    *   **开启高级渲染控制**：在 UI 侧集成了“开启高级渲染”控制开关，支持场景反射贴图与反射机制的**低延迟动态热切换**，在不重启地图渲染的前提下进行反射渲染类型的动态切换，并且自动管理底层贴图与观察者的生命周期，防止内存泄漏。
    *   **平面反射材质 (`kind === 'mirror'`) 分级尺寸**：
        *   **开启高级渲染**：
            *   **主镜面**（如浴室镜等，`isMainMirror`）：升级为 **2048 像素** 高清实时平面反射，呈现细腻的无卡顿高保真镜像（取消低像素模式）。
            *   **次要镜面**（其他镜子）：升级为 **1024 像素** 的高清晰平面反射，在提供清晰画质的同时保障帧率平稳。
        *   **关闭高级渲染（普通模式）**：
            *   **主镜面**：降级使用 **256 像素** 的低像素平面反射 `MirrorTexture`，确保低端设备流畅度。
            *   **次要镜面**：降级为 **`ReflectionProbe` (区域反射探针)**，获取近似的环境倒影。
    *   **金属反射材质 (`kind === 'metal'`) 分级**：
        *   **开启高级渲染**：升级为 **`ReflectionProbe` (反射探针)**，提供具有物理倒影感的动态高光反射。
        *   **关闭高级渲染（普通模式）**：自动还原并安全恢复金属最初的**静态 CubeMap**（从 `materials.js` 克隆源备份中还原），保留原有漫反射及高光色。
    *   **氛围感与画质深度优化**：
        *   **视差纠正探针**：为反射探针启用 `INVCUBIC_MODE` 视差纠正，并基于当前房间的 `RoomBounds` 动态计算其包围盒大小 (`boundingBoxSize`) 与位置，在探针渲染时使环境倒影精确对齐房间墙壁边界，解决无限远倒影漂移缺陷。
        *   **反光纯净化（辅助线排除）**：在平面反射与反射探针的 `renderList` 渲染列表中，**自动排除并过滤 3D 辅助网格线（`grid_3d` / `floor_grid_3d`）、编辑手柄（`edit_handle`）、碰撞块（`move_handle_collision`）以及标有编辑手柄元数据的对象**，保证镜子中不会反射出虚线与坐标轴等编辑辅助信息。
        *   **正则自反射排除**：支持使用基于 `/^(item|wall|floor|ceiling)_([\w\-]+)/` 的匹配机制提取自反射排除标识，对墙面等反光构件精准排除其自身以防多重采样闪烁，并完美兼容含有下划线的 ID。

---

## 🛠️ 项目重构状态与技术架构

为了解决单一巨型 `app.js` 带来的代码高耦合与状态修改风险，本项目进行了一次现代化的**渐进式状态管理重构**：

```
example/
├── type/                  # JSDoc 静态类型声明层 (AppState JSDoc Type)
├── store/                 # 运行时状态管理层 (Runtime Stores)
│   ├── index.js           # 导出 ui, selection, editor 单例 Store
│   └── proxyHelper.js     # [优化] 运行时动态反射状态分流桥接助手 (消除全部硬编码)
├── js/                    # 业务逻辑处理器层 (Handler Processors)
│   ├── DragHandler.js     # 2D 拖拽、房间旋转联动与吸附锁
│   ├── MaterialManager.js # 取色、材质涂刷与锁定控制
│   ├── TargetHandler.js   # 右键上下文菜单动作控制 (删除按钮高亮红)
│   └── EditorUi.js        # 侧边控制面板 input 值对齐
└── app.js                 # 引擎初始化、3D 主循环与声明式双向同步 (stateSyncMap 迭代同步)
```

### 1. 运行时反射代理 (`proxyHelper.js`)
各业务 Handler（如 `DragHandler` 等）在读写上下文的 `ctx.mode` 或 `ctx.selectedItemId` 时，不再对属性名进行任何 `if-else` 的硬编码。代理助手使用运行时的 `Object.prototype.hasOwnProperty.call(store, prop)` 动态检索属性的子 Store 归属，并通过 O(1) 路由字典缓存 `storePropCache` 将属性存取精准分流至 `uiStore`、`selectionStore` 或 `editorStore`，实现了零维护成本的解耦。

### 2. 声明式配置表双向同步 (`app.js`)
在 `app.js` 与子 Store 之间建立了 `stateSyncMap` 配置映射表，利用闭包对齐局部顶级变量和 Store 属性。在 `syncLocalToStore` 内部，使用 `for...of` 循环动态遍历映射同步，彻底消除了冗长且易在开发中遗漏的赋值逻辑。

---

## 📝 核心 API 示例

以下为调用 `blueprint3d-babylon` 的快速入门范例：

```javascript
import {
  Blueprint3DTestMap,
  DEFAULT_MATERIAL_PACKS,
  createTextureMaterialDescriptor
} from './blueprint3d-babylon/src/index.js';

// 1. 初始化 3D 地图实例
const map = new Blueprint3DTestMap(scene);

// 2. 动态调节和更新房间尺寸
map.updateRoom('living_room_1', { x: 2.0, z: -1.5, width: 8.5, depth: 6.0 });

// 3. 动态控制门窗的尺寸与高度 (panelHidden 可隐藏门板)
map.updateOpening('door_main', { width: 1.2, height: 2.2, panelHidden: true });

// 4. 精确调整墙段长度与着色
map.updateWallLength('wall_east', 6.2);
map.setWallColor('wall_east', '#f3eff2');

// 5. 改变家具状态并涂刷自定义材质
map.updateItemComponentColor('sofa_main', 'back_cushion', '#ff8fa3');
map.updateItemComponentMaterial('sofa_main', 'base_frame', createTextureMaterialDescriptor({
  name: '北欧木纹',
  category: 'wood',
  fileName: 'fine_wood.jpg',
  src: 'data:image/jpeg;base64,...'
}));

// 6. 导出为工程描述文件
const buildingJsonString = map.stringifyBuildingFile({ name: 'Castle-Pink' });
```

---

## 🧪 自动化测试验证

项目配置了完整的自动化回归测试用例。您可以随时在本地执行验证，确保在进行二次开发或架构调整时核心计算逻辑没有退化：

```bash
# 运行全部 36 项自动化单元测试
npm run test
```

测试覆盖了 `exporters.test.mjs`（CAD/3MF 导出器格式验证）、`openingVisibility.test.mjs`（门窗隐藏及代理）、`roomShapes.test.mjs`（多边形拓扑网格）和 `appliancePower.test.mjs`（家电开关动效）等重要模块，为您项目的生产交付保驾护航。

---

## 🤝 开源与开发贡献

我们欢迎各位开发者参与到 `blueprint3d-babylon` 的开源生态共建中。在提交 Pull Request 之前，请确保您的代码能够全部通过单元测试（`npm run test`），并注意遵守 JSDoc 的类型声明标准。

### 后续迭代与演进路线
1. **智能飘窗结构 (REQ-14)**：支持在标准墙面上放置飘窗，实现墙体精确扣除窗体面积，飘窗凸出部分多网格动态合并与正常渲染。
2. **可互动家具动画 (REQ-18)**：为秋千等特定家具提供点击交互支持，触发对应的物理摆动或动画状态机控制。
3. **模特/人台穿衣换装 (REQ-23)**：支持场景模特模型的骨骼绑定与外载衣服资产的层级挂载，实现防穿模的换装表现。
4. **3D第一人称漫游体验 (REQ-27)**：提供第一人称视角控制器切换，支持 WASD 键与鼠标视角游走，支持物理重力感应与防止穿透外墙的碰撞检测。

*版权所有 (c) MIT License.*
