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

---

## 4. 核心 API 示例

重构后的核心库使用统一封装的 `EditorFacade`，并提供便捷的工厂函数 `createEditor` 来快速搭建应用。

```javascript
import {
  createEditor,
  sampleData,
  createTextureMaterialDescriptor
} from './blueprint3d-babylon/src/index.js';

// 1. 初始化 3D 地图编辑器统一 Facade 实例
const testMap = createEditor({
  scene: babylonScene,
  floorplan: sampleData.blueprintTestMap.blueprint, // 传入初始户型数据
  options: { renderingEnabled: true }
});

// 2. 执行编辑指令 (通过数据驱动的命令机制更新)
testMap.executeCommand('updateRoom', {
  roomId: 'living_room_1',
  patch: { x: 2.0, z: -1.5, width: 8.5, depth: 6.0 }
});

// 3. 动态控制门窗尺寸与隐藏属性
testMap.executeCommand('updateOpening', {
  openingId: 'door_main',
  patch: { width: 1.2, height: 2.2, panelHidden: true }
});

// 4. 调用对特定实体的便捷调用方法封装（内部代理至 command 机制）
testMap.updateWall('wall_east', { locked: false });
testMap.setWallLength('wall_east', 6.2);

// 5. 进行状态与属性只读快照获取 (保障底层数据不被外部隐式修改)
const snapshot = testMap.getSnapshot(); 
const metadata = testMap.getProjectMetadata();

// 6. 调用解耦的加载与导出功能
const buildingJsonString = testMap.stringifyBuildingFile({ name: 'Castle-Pink' });
testMap.loadBuildingFile(buildingJsonString); // 还原与重新构建场景
```

> **💡 向下兼容性提示**: 
> 本项目依旧保留了对上帝对象 `Blueprint3DTestMap` 的导出，其内部通过桥接委托机制与最新的 `FloorplanDocument` 及 `ExportService` 对齐，以确保旧版外部代码可无缝迁移。
