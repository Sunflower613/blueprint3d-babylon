# blueprint3d-babylon

`blueprint3d-babylon` 是一个面向 Babylon.js 的蓝图式 2D/3D 建筑编辑核心库。房间、墙体、门窗、家具、材质均以对象方式进行编辑与管理，并可保存为通用的 JSON 描述文件，供 Babylon 场景直接反序列化重新渲染。

本库已完成底层核心能力的重构，提供了功能丰富的 2D 户型设计和 3D 同步渲染能力，可作为独立三维建筑编辑器或大型家园沙盘系统底座使用。

---

## 核心能力

* **2D / 3D 双向同步与切换**：支持 2D 户型图与 3D Babylon 场景的实时同步，一键切换视图，适配桌面鼠标操作及手机触控（包含双指平移、旋转、缩放）。
* **2D 户型与房间编辑**：
  * 提供方形、L 形、圆形、八角、四角、扇形、半圆和三角形 8 种预置房间轮廓，拖入画布即可自动沿外轮廓逐边生成墙体。
  * 选中房间后可拖拽整体移动，并支持边缘手柄拖拽以直观调整长宽。
  * 提供了完善的对齐网格（Grid Snapping）系统，可关闭或自定义格子大小。
* **智能墙体编辑**：
  * 支持墙段在画布上的直接拖拽移动，具备角点吸附和对齐机制。
  * 支持墙体的拆分与合并。
  * 选中墙体后可精确设置其长度或将其删除。
* **门窗与洞口裁剪**：
  * 支持门窗在 2D/3D 场景中的沿墙拖拽移动与删除。
  * 提供方形、四角、圆形、半圆形、圆顶方形、尖顶方形、1/4 扇形和三角形轮廓。
  * 支持修改窗户的宽度、高度以及离地高度（窗台高），并能自动且精确地在 3D 墙体上进行洞口几何裁剪（CSG/预计算网格裁剪）。
* **高级建筑构件生成**：
  * **屋顶几何体**（Roof Geometry）：支持一键生成并动态调整坡度、样式。
  * **楼梯几何体**（Stairs Geometry）：支持生成直梯、L型转折梯等，可动态计算踏步和踏深。
  * **围栏与栅栏门**（Fence & Gate Geometry）：支持沿指定路径或边界动态生成围栏与门。
* **精细化家具组件管理**：
  * 内置卧室、厨卫、装饰、灯具、桌椅、收纳等多种分类家具库，支持缩略图预览。
  * 支持家具的平移、旋转（含旋转滑条与双指旋转）、缩放（0.5 ～ 4 倍），支持**复制**与**批量删除**。
  * 支持家具部件的独立着色与纹理材质应用（每个家具由多个子 Mesh 组成，可分别调色）。
* **设计与材质面板**：
  * 支持地板、墙面、家具组件应用颜色或纹理。
  * 分类管理材质库：木纹、石理、金属、墙纸、织物、涂料等，内置多套预置高质量纹理贴图。
  * 支持用户上传自定义图片作为材质，材质信息以资源 ID 或 base64 Data URL 形式保存。
* **导入与导出**：
  * **建筑文件保存/加载**：保存为自定义 `*.b3dbuilding.json` 格式，支持一键加载复原。
  * **2D 户型图导出**：支持导出为通用 **DXF** 格式，方便与 CAD 软件交互。
  * **3D 模型导出**：支持将 3D 建筑场景整体导出为 **3MF** 三维制造格式，可直接用于 3D 打印或导入其他建模软件。
* **撤销 / 重做系统**：完整的操作历史栈，覆盖房间新增/删除/变形、墙体调整、门窗布置、家具摆放及材质颜色变更等。

---

## 目录结构

库的目录结构经过重构与模块化细分，结构如下：

```text
blueprint3d-babylon/
  src/
    core/
      BlueprintRegistry.js   # 蓝图注册管理器，处理核心对象生命周期
      babylon.js             # Babylon.js 渲染上下文与基础集成
      babylon.production.js  # 生产环境渲染优化与着色器配置
      buildingFile.js        # 建筑文件保存与加载序列化逻辑
      dxfExporter.js         # DXF 格式 2D 户型图导出器
      exporterUtils.js       # 导出通用辅助工具函数
      exporters.js           # 统一导出接口
      materialCatalog.js     # 材质分类与目录定义
      materials.js           # 材质加载、管理与着色器逻辑
      primitives.js          # 基础三维几何体（墙体、房间地面等网格生成）
      threeMfExporter.js     # 3MF 格式 3D 模型导出器
    furniture/
      _helpers.js            # 家具创建辅助工具函数
      bedroom.js             # 卧室家具数据与网格生成
      custom.js              # 自定义网格与基础几何家具
      decor.js               # 装饰物与软装家具
      index.js               # 家具模块导出统一入口
      kitchenBath.js         # 厨卫家具数据与网格生成
      lighting.js            # 灯具与照明相关网格
      seating.js             # 座椅与沙发类网格
      storage.js             # 柜体、架子与收纳家具
      tables.js              # 桌台、茶几类网格
      image/                 # 家具缩略图/图标资源目录（170+ PNG）
    geometry/
      fenceGateGeometry.js   # 栅栏门几何体计算与生成
      fenceGeometry.js       # 围栏/栅栏几何体计算与生成
      roofGeometry.js        # 屋顶网格几何计算与生成
      stairsGeometry.js      # 楼梯网格几何计算与生成
    openings/
      door.js                # 门网格生成与开合逻辑
      geometry.js            # 门窗在墙体上开洞的 CSG/布尔几何计算
      index.js               # 门窗模块统一入口
      openingShapes.js       # 门窗轮廓多边形数据定义
      window.js              # 窗网格生成与离地高度逻辑
    presets/
      blueprintTestMap.js    # 测试地图预置场景数据
      pinkCastle.js          # 粉色城堡配置项预置
    rooms/
      index.js               # 房间模块统一入口
      roomShapes.js          # 房间形状多边形计算与地面生成
    runtime/
      PinkCastleGenerator.js # 粉色城堡生成器运行时兼容接口
    textures/                # 库预置的高清纹理贴图资源
      light_brick.jpg        # 砖墙纹理
      light_fine_wood.jpg    # 木纹纹理
      marbletiles.jpg        # 大理石纹理
      wallmap_yellow.png     # 黄色涂料墙面纹理
    index.js                 # 库打包与导出入口
  example/
    index.html               # 测试网页结构
    app.js                   # 测试网页交互逻辑（2D绘制、UI绑定、API调用等详见子目录readme）
    main.js                  # 示例入口脚本
    styles.css               # 示例样式表
```

---

## 运行测试地图

要在本地运行并体验测试地图，请在项目根目录下执行：

```bash
npm run dev
```

启动开发服务器后，在浏览器中访问：

```text
http://127.0.0.1:3000/blueprint3d-babylon/example/index.html
```

测试地图提供了一个直观的交互界面，参考了户型编辑、设计、添加家具等流程，展示了 `blueprint3d-babylon` 的完整功能。

---

## 建筑文件格式

导出的建筑描述文件为 `*.b3dbuilding.json`，其核心格式标识为：

```json
"format": "blueprint3d-babylon.building.v1"
```

文件主要由以下几部分组成：
* `babylon`: 包含渲染元信息，坐标系定义（默认 `Y_UP_XZ_FLOOR`）及场景初始化参数。
* `floorplan.floor.rooms`: 记录各个房间的中心点、形状参数（宽、深等）以及它们所关联的墙体。
* `floorplan.floor.material`: 地板的颜色、材质或贴图描述。
* `floorplan.walls`: 记录墙体的两个端点坐标、墙体厚度、高度，以及两侧墙面的材质与颜色。
* `floorplan.openings`: 记录门窗所属墙体、沿墙体的水平位移、宽度、高度和离地高度。
* `floorplan.items`: 家具的位置、旋转、缩放、锁定状态、以及各个组件（如靠背、坐垫）的独立材质与颜色。

---

## API 示例

```javascript
import {
  Blueprint3DTestMap,
  DEFAULT_MATERIAL_PACKS,
  createTextureMaterialDescriptor
} from './blueprint3d-babylon/src/index.js';

// 初始化地图实例
const map = new Blueprint3DTestMap(scene);

// 更新房间参数
map.updateRoom('living', { x: 1, z: 1, width: 10.2, depth: 8.1 });

// 精确调整墙段长度
map.updateWallLength('w_east_living', 5.5);
map.setWallColor('w_east_living', '#f7d8ea');

// 旋转家具
map.rotateItem('sofa_1', Math.PI / 2);

// 修改窗户尺寸与高度
map.updateOpening('window_living_south', { width: 1.8, height: 1.1, sillHeight: 0.8 });

// 对家具组件单独着色
map.updateItemComponentColor('sofa_1', 'back', '#ff7aa8');

// 应用预设材质
map.setFloorMaterial(DEFAULT_MATERIAL_PACKS[2]);

// 自定义图片材质
map.updateItemComponentMaterial('sofa_1', 'seat', createTextureMaterialDescriptor({
  name: '自定义布料',
  category: 'custom',
  fileName: 'fabric.png',
  src: 'data:image/png;base64,...'
}));

// 导出与导入建筑文件
const buildingFile = map.stringifyBuildingFile({ name: 'my-house' });
map.loadBuildingFile(buildingFile);
```

---

## 后续开发计划

1. **多层建筑支持**：引入楼层概念，支持多层建筑的堆叠、楼梯连通与 3D 楼层剖切。
2. **楼梯洞口自动裁剪**：实现当楼梯穿过地板时，自动在天花板/地板上裁剪出洞口。
3. **网格合并与材质复用优化**：为了应对超大家园沙盘的渲染性能，优化 Babylon.js 的网格合并（Mesh Merging）机制，提高大批家具同材质渲染效率。
