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
