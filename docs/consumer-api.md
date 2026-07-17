# Consumer API 与兼容接口

外部编辑器应只从 `src/index.js` 导入，并以 `createEditor({ scene, floorplan, options })` 创建实例。

稳定的第三阶段接口分为：

- 查询：`getProjectMetadata`、`getSnapshot`、`getCurrentFloorId`、`getFloors`、`getFloor`、`getEntities`、`getEntity`、`getRoomAt`、`getFloorElevation`、`getEntityElevationOffset`。
- 命令：`executeCommand` 以及由它实现的实体 CRUD 便捷方法。
- 预览事务：`beginEntityPreview`、`updateEntityPreview`、`commitEntityPreview`、`cancelEntityPreview`。
- 文件：`exportJSON`、`loadJSON`、Building File、DXF 和 3MF 接口。
- Runtime 协作：`enableRendering`、`disableRendering`、`refreshRendering`、`populateShadowGenerator`、`attachRuntimeOverlay`。

## 暂时保留的兼容接口

以下接口只为已有消费者保留，example 不再使用它们：

- `Blueprint3DTestMap`、`buildBlueprint3DTestMap`。
- `Blueprint3DTestMap.document`、`renderer`、`selectionController`、`exportService`。
- `itemNodes`、`wallNodes`、`floorNodes`、`openingNodes`、`roofNodes`、`stairNodes`、`fenceNodes`、`fenceGateNodes` 及拖拽预览 Map。
- `EditorFacade.floorplan` 的可变 getter/setter。
- `EditorFacade.getEntityRenderNode` 和 `roomSelectionOutlineMesh`。
- `createDocument`、`createBabylonRenderer` 以及直接导出的 `FloorplanDocument`、`BabylonSceneRenderer`、`SelectionController`。
- 旧的分步 `buildFloors/buildWalls/buildOpenings/...` 与反射纹理低层方法。

## 下一阶段废弃顺序

1. 首先移除节点 Map、内部控制器字段、`getEntityRenderNode` 和 `roomSelectionOutlineMesh`。
2. 移除可变 `floorplan`，强制查询快照与命令写入。
3. 将 `Blueprint3DTestMap` 和 `buildBlueprint3DTestMap` 标记为正式 deprecated，并迁出默认入口。
4. 收缩默认导出中的 Domain/Runtime 实现类；需要低层组装的消费者改用明确子路径。
