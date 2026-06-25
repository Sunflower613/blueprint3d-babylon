# blueprint3d-babylon

`blueprint3d-babylon` 是一个面向 Babylon.js 的蓝图式 2D/3D 建筑编辑库。它从当前项目中单独封装出来，目标是服务粉色城堡与家园沙盘，并逐步向《模拟人生 4》式建筑系统靠近：房间、墙体、门窗、家具、材质都以对象方式编辑，并能保存为 Babylon 可直接重新渲染的建筑文件。

## 当前能力

- 2D / 3D 单视图切换，右上角按钮切换，适配桌面和手机操作。
- 2D 户型编辑：新建房间、绘制墙、删除墙、在墙上添加门窗。
- 2D 点击房间地面后，可在右侧调整房间长度和宽度。
- 选中房间后可拖拽整体移动，并显示四边手柄，可拖动边界调整长宽。
- 支持对齐格子，默认 1 米一格，可关闭或调整格子尺寸。
- 选择墙体后可设置墙体长度，也可直接删除墙体。
- 2D / 3D 家具拖拽移动，2D 平面图和 3D Babylon 场景同步。
- 家具支持旋转角度、0.5～4 倍缩放滑条，以及 2D 双指旋转/缩放。
- 2D / 3D 门窗选择与沿墙拖动，门窗可删除。
- 窗户支持宽度、高度和离地高度调整，数据会写入建筑文件。
- “设计”面板支持地板颜色、墙面颜色、家具组件颜色，以及自定义图片材质。
- 材质按分类组织：自定义、木纹、石理、金属、墙纸、织物、涂料。
- 家具已拆成独立模块：一个文件一个家具，不同组件可分别调色或应用材质。
- 撤销 / 重做覆盖房间、墙体、门窗、家具、颜色和材质等编辑。
- 保存 / 加载 `*.b3dbuilding.json` 建筑文件，可通过 `Blueprint3DTestMap.loadBuildingFile()` 恢复渲染。

## 目录结构

```text
blueprint3d-babylon/
  src/
    core/
      BlueprintRegistry.js
      buildingFile.js
      materialCatalog.js
      materials.js
      primitives.js
    furniture/
      _helpers.js
      sofa.js
      bed.js
      table.js
      desk.js
      plant.js
      index.js
    presets/
      pinkCastle.js
      blueprintTestMap.js
    runtime/
      PinkCastleGenerator.js
    index.js
  example/
    index.html
    app.js
    main.js
    styles.css
```

## 运行测试地图

在当前主项目根目录运行：

```bash
npm.cmd run dev
```

然后访问：

```text
http://127.0.0.1:3000/blueprint3d-babylon/example/index.html
```

测试地图参考了 [furnishup/blueprint3d 示例](https://furnishup.github.io/blueprint3d/example/) 的编辑模式：户型、设计、添加家具，并用 Babylon.js 重建了一套适合当前项目继续扩展的实现。

## 建筑文件格式

示例页的“保存建筑文件”会下载 `*.b3dbuilding.json`，格式标识为：

```text
blueprint3d-babylon.building.v1
```

文件主要包含：

- `babylon`: 渲染元信息，包括坐标系 `Y_UP_XZ_FLOOR` 和加载入口。
- `floorplan.floor.rooms`: 房间位置、长宽和关联墙体。
- `floorplan.floor.material`: 地板材质描述，可为纯色或图片纹理。
- `floorplan.walls`: 墙体端点、墙面颜色和材质描述。
- `floorplan.openings`: 门窗所属墙、沿墙位置、宽度、窗户高度、窗户离地高度。
- `floorplan.items`: 家具位置、尺寸、旋转、锁定状态、组件颜色和组件材质。

自定义图片材质会以 data URL 存入建筑文件，后续接入默认材质包时可改为资源 ID 引用。

## API 示例

```js
import {
  Blueprint3DTestMap,
  DEFAULT_MATERIAL_PACKS,
  createTextureMaterialDescriptor
} from './blueprint3d-babylon/src/index.js';

const map = new Blueprint3DTestMap(scene);

map.updateRoom('living', { x: 1, z: 1, width: 10.2, depth: 8.1 });
map.updateWallLength('w_east_living', 5.5);
map.setWallColor('w_east_living', '#f7d8ea');
map.rotateItem('sofa_1', Math.PI / 2);
map.updateOpening('window_living_south', { width: 1.8, height: 1.1, sillHeight: 0.8 });
map.updateItemComponentColor('sofa_1', 'back', '#ff7aa8');
map.setFloorMaterial(DEFAULT_MATERIAL_PACKS[2]);

map.updateItemComponentMaterial('sofa_1', 'seat', createTextureMaterialDescriptor({
  name: '自定义布料',
  category: 'custom',
  fileName: 'fabric.png',
  src: 'data:image/png;base64,...'
}));

const buildingFile = map.stringifyBuildingFile({ name: 'my-house' });
map.loadBuildingFile(buildingFile);
```

## 粉色城堡用法

保持当前项目 `CastleGenerator` 形状的兼容用法：

```js
import { PinkCastleGenerator as CastleGenerator } from './blueprint3d-babylon/src/index.js';

const castle = new CastleGenerator(scene, themeConfig);
const player = new Player(scene, camera, castle.colliders, themeConfig);

castle.update(delta, time, player);
```

更底层的蓝图用法：

```js
import { buildPinkCastle } from './blueprint3d-babylon/src/index.js';

const castle = buildPinkCastle(scene, {
  palette: {
    wall: '#ff8fb3',
    roof: '#b71c1c'
  }
});
```

## 后续计划

1. 墙体拖拽、墙段拆分、角点吸附。
2. 家具复制、批量删除、更多旋转手柄和更强的网格吸附。
3. 房间合并/拆分，以及更完整的门窗洞口裁切。
4. 接入默认材质包，材质文件可用资源 ID 保存，避免建筑文件过大。
5. 粉色城堡现有模块逐步迁入 `pinkCastle.js`。
6. 稳定后将 `blueprint3d-babylon/` 作为独立仓库上传 GitHub。
