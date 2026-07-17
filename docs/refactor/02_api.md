当前架构对“作为 API 库导出”不太友好，但问题不是“文件多”，而是“边界不清 + 职责混合”。

判断

[src/presets/blueprintTestMap.js (line 640)](/D:/code/3d-babylon/blueprint3d-babylon/src/presets/blueprintTestMap.js:640) 这个类已经是典型的 god object。它同时做了数据归一化、楼层管理、墙/房间/洞口/楼梯/围栏 CRUD、材质处理、Babylon 场景构建、选中态、导出 JSON/DXF/3MF。这会让“库 API”天然绑定到一个具体实现类上。
[example/app.js (line 1)](/D:/code/3d-babylon/blueprint3d-babylon/example/app.js:1) 直接 import 了大量 src 内部模块和 preset 实现，而不是只消费公开入口。这说明 example 不是单纯 demo，而是在依赖库内部细节，后面一旦重构库，demo 会一起碎。
[src/index.js (line 1)](/D:/code/3d-babylon/blueprint3d-babylon/src/index.js:1) 现在是“混合导出桶”：基础能力、导出器、preset、运行时、几何工具都放在一起，但没有一个清晰稳定的顶层抽象。对外看得到很多东西，但不知道哪些是稳定 API，哪些只是内部拼装件。
[example/README.md (line 3)](/D:/code/3d-babylon/blueprint3d-babylon/example/README.md:3) 已经在说 app.js 正在渐进模块化，但实际 [example/app.js (line 1)](/D:/code/3d-babylon/blueprint3d-babylon/example/app.js:1) 仍然非常大，说明目前更多是在拆“编辑器代码”，不是在拆“库边界”。

重构方向

目标不是继续拆更多文件，而是先把依赖方向拉直，变成 4 层：
domain
只放户型数据模型和纯业务操作，不依赖 Babylon。
例如：FloorplanDocument、walls/rooms/openings 命令、校验、序列化。
runtime
只负责 Babylon 渲染。
输入是 document，输出是 scene node/tree，不直接负责编辑器状态。
editor
只负责交互、选中、拖拽、左侧面板、2D/3D handle。
这是可选层，不应进入核心库默认导出。
api
给外部一个稳定 facade。
外部应该拿到的是 createDocument、createRenderer、exportBuildingFile 这种 API，而不是直接 new Blueprint3DTestMap。

建议方案

先不要上来拆成多包，先在单包内重组，风险更小。

第一阶段：收口公开 API

新增 src/api/index.js
规定 example 以后只能从 src/api 和 src/editor 导入，禁止再直接引用 src/core/*、src/presets/*、src/rooms/* 这类内部文件
src/index.js 只 re-export 稳定 API，preset 改成 sample data，不再作为主入口抽象

第二阶段：拆 Blueprint3DTestMap

FloorplanDocument
管理 floorplan 状态、normalize、CRUD、楼层切换
BabylonSceneRenderer
管理 build/rebuild、mesh 生命周期、材质应用
SelectionController
管理选中、高亮、编辑句柄
ExportService
管理 building file / DXF / 3MF
MaterialResolver
管理 descriptor 归一化和预览色

prompt参考：
```
角色：软件架构师 / 领域驱动设计 (DDD) 专家

大背景：
我们正在重构 3D 户型编辑器。目前正在进行第二阶段：拆解 God Object `Blueprint3DTestMap`。在之前的步骤中，我们已经成功剥离了数据模型（`FloorplanDocument`）、3D 渲染器（`BabylonSceneRenderer`）和选中控制器（`SelectionController`）。目前它正一步步回归为一个纯粹的外部 Facade 门面。

当前小任务（第二阶段核心：剥离 ExportService 导出与加载服务）：
请帮我从 `BlueprintTestMap` 类中，将所有与【数据导出与文件加载】相关的业务方法剥离出来，封装进一个独立的类 `ExportService`（存放在 `src/services/ExportService.js`）。

具体剥离职责包括：
1. **导出服务封装**：
   - 新建 `src/services/ExportService.js` 并导出 `ExportService` 类。其构造函数接收 `FloorplanDocument` 实例。
   - 迁移所有的文件转换与序列化方法，例如：
     - `exportJSON()`
     - `exportBuildingFile(options)`
     - `stringifyBuildingFile(options)`
     - `stringifyDXF()`
     - `create3MFPackage(options)`
   - 迁移读取和反序列化的业务前置逻辑：
     - `loadBuildingFile(fileData)`
     - `loadJSON(floorplan)`
2. **上帝对象适配**：
   - 在 `Blueprint3DTestMap` 的构造函数中实例化该服务：`this.exportService = new ExportService(this.document);`。
   - 对原本暴露在 `Blueprint3DTestMap` 外部的上述导出与加载方法进行桥接代理（例如让 `exportJSON()` 委托调用 `this.exportService.exportJSON()`），确保向下兼容不被破坏。
3. **接口导出**：
   - 将 `ExportService` 在公开 API 门面 `src/api/index.js` 中导出，方便第三方消费者独立使用它进行文件 IO 操作。

限制与边界：
- 【铁律】`ExportService` 是纯数据转换与文件字节流处理服务，【绝不能】直接接触或导入任何 Babylon.js 的 API、Mesh 或 3D 材质组件。
- 它仅依赖传入的 `FloorplanDocument` 暴露的数据状态，以及底层的核心转换器（如 `buildingFile.js`, `exporters.js` 等）。
```

第三阶段：把 example 变成真正的消费者

example/app.js 只编排 UI，不再直接操作底层 geometry/material/room shape
example/js/* 全部通过 facade 调库
这样 demo 才能反过来验证“库 API 是否够用”

第一批：建立 Consumer API，迁移文件管理
第二批：迁移只读查询和 UI 渲染
第三批：迁移写操作和材质命令
第四批：迁移 Runtime 预览
第五批：收缩 app.js

- 当前仅保留既有的大 chunk 警告；该问题属于后续性能和打包策略，不影响第三阶段架构验收。
// TODO: 继续性能优化

第四阶段：再决定是否拆包

如果后面真要做 npm 库，建议再拆成：@blueprint3d/core
@blueprint3d/babylon-runtime
@blueprint3d/editor
但这是最后一步，不是第一步
可以直接收敛成这样的 API：

const doc = createDocument(initialData);
doc.updateWall(id, patch);
doc.addOpening(...);

const renderer = createBabylonRenderer(scene);
renderer.mount(doc);
renderer.setCurrentFloor('floor_2');

const file = exportBuildingFile(doc);

---

## 5. 重构后系统技术架构与分层设计

在第三阶段完成之后，系统彻底理顺了数据、渲染、交互以及 API 暴露的职责关系，确立了以下分层架构：

### 5.1 核心库分层设计 (`src`)

重构后的核心库分为以下五个核心层，各层边界清晰，职责明确：

*   **API 门面层 (`src/api`, `src/index.js`)**：
    *   整个库的**唯一稳定 API 门面**。
    *   统一拦截和暴露公共 API，防止内部类直接暴露。
*   **交互控制层 (`src/editor`)**：
    *   提供面向编辑器操作的控制器 `EditorFacade`，并封装选中与高亮管理服务 `SelectionController`。
*   **只读数据域模型 (`src/domain`)**：
    *   纯户型数据规则与模型处理核心（如 `FloorplanDocument`），管理 floors/walls/rooms/items 等实体的数据拓扑，**绝对不直接依赖任何 Babylon.js 渲染引擎的 API**。
*   **运行时渲染层 (`src/runtime`)**：
    *   专注 Babylon.js 的 3D 渲染表现（如 `BabylonSceneRenderer`），从 `FloorplanDocument` 消费数据并转换为 3D Mesh，动态处理 CSG 挖洞与反射渲染。
*   **文件与转换服务层 (`src/services`)**：
    *   纯数据转换与文件字节流处理服务（如 `ExportService`），负责 `b3dbuilding` 格式的序列化/反序列化，以及 CAD (DXF)、3MF 二进制大对象的生成。

```
src/
├── api/                   # 公开 API 门面出口，管理稳定公开 API
│   └── index.js           # 对外导出的核心聚合出口
├── domain/                # 户型数据域模型（业务规则计算，独立于 Babylon）
│   ├── FloorplanDocument.js  # 数据核心模型（Floorplan 状态、层级、CRUD、楼层）
│   └── MaterialResolver.js   # 材质信息归一化与解析服务
├── runtime/               # 渲染逻辑层（专注于 Babylon.js 渲染表现）
│   ├── BabylonSceneRenderer.js # 三维渲染生成器（Mesh生命周期、CSG开洞、动态反射）
│   └── PinkCastleGenerator.js  # 粉色城堡示例场景生成器
├── editor/                # 编辑器交互与控制器层
│   ├── EditorFacade.js    # 统一 Consumer Facade 门面（核心控制器）
│   ├── SelectionController.js # 选中态与高亮控制
│   ├── DragHandler.js     # 拖拽交互控制器
│   └── Topology.js        # 拓扑几何工具
├── services/              # 数据加载与导出器服务
│   └── ExportService.js   # 负责工程数据序列化、反序列化、3MF 导出及 DXF 导出
└── core/                  # 基础设施和底层转换器（内部私有包）
```

> **🔒 依赖隔离规则 (Dependency Isolation Rules)**:
> 外部集成组件（如 `example/app.js` 或第三方包）**禁止越权直接导入** `src/core/*`、`src/presets/*`、`src/rooms/*`、`src/furniture/*` 等内部私有目录下的文件。
> **所有外部依赖必须统一从 `src/index.js` 解构引入。**

### 5.2 演示示例架构 (`example`)

演示项目已被改造为**真正的 API 消费者**，其内部同样经历了模块化状态重构：

```
example/
├── type/                  # JSDoc 静态类型声明层 (AppState JSDoc Type)
├── store/                 # 运行时状态管理层 (ui, selection, editor 单例 Store)
│   ├── index.js           
│   └── proxyHelper.js     # [优化] 运行时动态反射状态分流桥接助手
├── js/                    # 业务逻辑处理器层 (DragHandler, MaterialManager, TargetHandler 等)
└── app.js                 # 引擎初始化、3D 主循环与业务调度器（纯 API Facade 消费者）
```

*   **状态与逻辑解耦**：所有的 UI 状态和选中状态保存在独立 Store 中，业务处理器（如 `DragHandler`）利用代理助手 `proxyHelper.js` 进行低耦合的状态分流读写，无硬编码。
*   **Facade 消费**：`app.js` 不再直接操作底层几何，完全通过 `createEditor` 返回的门面接口进行全部业务编排。
