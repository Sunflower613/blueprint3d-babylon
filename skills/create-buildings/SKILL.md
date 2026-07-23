---
name: create-buildings
description: 生成、检查和解释 Blueprint3D Babylon 建筑 JSON (`.b3dbuilding.json`)，覆盖楼层局部高程、房间/墙体/开洞/家具引用、Loft 挑空、楼梯接驳、材质目录和家具朝向。Use when an external model must directly generate a compatible building file, or when converting a floor-plan image/design, repairing a building file, or validating its structure and geometry.
---

# Blueprint3D 通用 3D 建筑 JSON 权威生成与防错层防镜像指南

本技能指导智能体将平层、Loft 跃层或多层户型转换为符合 `blueprint3d-babylon.building.v1` 的 `.b3dbuilding.json`。它同时提供可由脚本检查的结构约束，以及需要结合图纸和渲染结果判断的几何经验。不要把经验规则当作形式化证明；当图片无法确定尺寸或接驳关系时，应标记假设并请求确认。

## 使用边界与执行顺序

1. 先读取本文件中的核心规则，再按需要读取 `references/` 下的建筑、家具或材质目录。目录是当前代码的索引，不是独立 Schema。
2. 优先使用仓库的 `createBuildingFile`/`stringifyBuildingFile` 生成标准外壳；不要手写与运行时代码不一致的字段。
3. 先建立楼层、楼板房间和墙体，再添加开洞、楼梯、护栏和家具。所有实体必须引用存在的 `floorId`；开洞必须引用存在的 `wallId`。
4. 运行基础校验；交付文件再运行严格校验：`node skills/create-buildings/scripts/validate-building.mjs <file> --strict`。
5. 对图片推断出的尺寸、镜像方向、挑空边界和楼梯终点做人工或渲染复核。Validator 通过不等于几何布局已经正确。

---

## 1. 组件与材质权威查询索引 (External Catalog References)

- 🏠 **Loft 跃层示范 JSON 档案**：查阅本地范例文件 [loft-building-example.b3dbuilding.json](../../example/downloads/loft-building-example.b3dbuilding.json)。它是一个特定户型的参考，不应将其中的坐标、房间 ID 或尺寸直接复制到其他户型。
- 🌐 **外部模型参考入口**：需要让不在本仓库上下文中的模型直接生成文件时，可将 [GitHub 仓库](https://github.com/Sunflower613/blueprint3d-babylon) 作为实现参考；优先以仓库中的 `src/core/buildingFile.js`、本 skill 的目录和 [minimal-building.b3dbuilding.json](references/minimal-building.b3dbuilding.json) 为准，并在输出后运行本地 Validator。GitHub 链接是参考入口，不是稳定的版本化 Schema；如果外部模型无法访问仓库，应直接使用本 skill 中的外壳和最小示例。
- 🏛️ **全量建筑组件离线词典**：查阅 [building-catalog.md](references/building-catalog.md) 直接获取 100% 全量房间形状 (Shape)、开洞 Shapes、门窗类型、楼梯 Subtype 专属参数、护栏栅栏、屋顶与天空盒配置。
- 🪑 **全量家具与软装词典**：查阅 [furniture-catalog.md](references/furniture-catalog.md) 直接检索 100% 全量合法的家具 `type` 标识、中文名称及推荐尺寸（包含坐具、桌几、柜体、卧房套件、集成厨房、卫浴设施、屏风窗帘地毯、绿植景观、灯具、服饰模特等全分类）。
- 🎨 **全量材质与海报词典**：查阅 [material-catalog.md](references/material-catalog.md) 直接获取 100% 全量面漆涂料、高清木纹、大理石瓷砖、墙纸壁纸、海报艺术、玻璃镜面、自发光材质 `id` 与配置。
- 💻 **一键自动更新全量词典**：当代码库新增家具组件或材质面漆时，在根路径运行以下命令即可一键重新构建并同步更新上述 3 个离线字典文档：
  ```bash
  npm run update-catalogs
  # 或 node skills/create-buildings/scripts/update-catalogs.mjs
  ```

### 1.1 标准 3D 建筑 JSON 档案包装结构 (JSON Archive Schema)

导出的 `.b3dbuilding.json` 档案统一采用标准 `blueprint3d-babylon.building.v1` 外壳封装：

```json
{
  "format": "blueprint3d-babylon.building.v1",
  "version": 1,
  "name": "CozyLoftApartment",
  "createdAt": "2026-07-23T12:00:00.000Z",
  "updatedAt": "2026-07-23T12:00:00.000Z",
  "generator": "blueprint3d-babylon",
  "babylon": {
    "engine": "Babylon.js",
    "renderer": "Blueprint3DTestMap",
    "coordinateSystem": "Y_UP_XZ_FLOOR",
    "units": "m",
    "entry": "Blueprint3DTestMap.loadBuildingFile"
  },
  "floorplan": {
    "name": "CozyLoftApartment",
    "unit": "m",
    "wallHeight": 4.5,
    "wallThickness": 0.18,
    "floorHeight": 0.06,
    "storyHeight": 4.5,
    "currentFloorId": "floor_1",
    "floors": [],
    "floor": { "rooms": [] },
    "walls": [],
    "openings": [],
    "items": [],
    "roofs": [],
    "stairs": [],
    "fences": [],
    "fenceGates": [],
    "environment": { "skyMaterial": null, "groundMaterial": null }
  }
}
```
- `floorplan`: 核心户型数据容器，包含楼层 `floors`、房间 `floor.rooms`、墙体 `walls`、门窗开洞 `openings`、软装家具 `items`、屋顶 `roofs`、楼梯 `stairs`、护栏 `fences` 与栅栏门 `fenceGates` 全量集合。各组件详细字段请直接查阅上文对应的全量词典。

可运行的精简 Loft 系统参考见 [minimal-building.b3dbuilding.json](references/minimal-building.b3dbuilding.json)。它直接基于仓库现有 Loft 地图，保留完整的楼层、挑空房间组合、墙体、门窗、楼梯、环境和功能家具，只删除海报、植物、地毯、灯具及桌面摆件等装饰项；不要把它误解成只有字段骨架的 toy 示例。可用以下命令验证：

```powershell
node skills/create-buildings/scripts/validate-building.mjs skills/create-buildings/references/minimal-building.b3dbuilding.json --strict
```

| 关键规则 | 最小示例对应字段 | 说明 |
| :--- | :--- | :--- |
| 标准文件外壳 | `format`, `version`, `floorplan` | 可直接交给 `parseBuildingFile` 加载 |
| 楼层局部高程 | `floorplan.floors`, `floor.rooms[].elevation`, `items[].elevation` | 二层落地实体使用本层局部 `0` |
| Loft 挑空提示 | `floors[1].hideRoof`, 仅有局部二层房间 | 挑空区不创建二层房间；具体边界仍需按户型计算 |
| 墙体与开洞引用 | `walls[].id`, `openings[].wallId` | 开洞绑定真实墙体 |
| 家具材质映射 | `items[0].colors`, `items[0].materials` | 部件映射是示例约束，不代表所有家具部件名都相同 |
| 楼梯跨层 | `stairs[0].floorId`, `height`, `elevation` | 楼梯归属起始层；终点接驳仍需几何复核 |
| 通高件与二层护栏分层 | `items[type=modern_slat_screen].floorId`, `floors[].level` | 原始 Loft 地图的 `fences` 集合为空；示例保留通高木格栅屏风和楼层分层字段，不伪造不存在的护栏 |
| 湿区墙裙 | `walls[0].wainscotEnabled`, `wainscotHeight`, `wainscotMaterialFront` | 示例只展示字段结构；真实湿区仍需闭合房间和完整墙体绑定 |
| 环境材质 | `environment.skyMaterial`, `groundMaterial` | 严格模式要求非空 |
| 坐标与朝向 | `babylon.coordinateSystem`, `items[0].rotation` | 旋转约定见定理六 |

定理一至七的字段入口分别对应：楼层/实体 `floorId` 与 `elevation`、二层 `hideRoof` 与局部房间、`stairs` 的起始层和高度、墙体/护栏的分层字段、`babylon.coordinateSystem` 与 X-Z 坐标、家具 `rotation`，以及上述字段组合形成的反例自查。示例用于确认字段落点；固定的象限坐标、L 型楼梯镜像角度等仍属于特定户型经验，不能从最小示例推导为通用常量。

---

## 2. 核心防错层与防镜像七大三维几何定理 (Seven Anti-Misalignment & Anti-Mirroring Theorems)

智能体在生成 JSON 时，必须**严格遵守以下七大几何定理**，违背任意一条均会导致致命的错层、悬空或镜像翻转问题：

### 定理一：高层高程局部绝对隔离定理 (Floor-Local Elevation Isolation Theorem)
- **数学变换原理**: 引擎世界坐标为 $Y_{\text{world}} = Y_{\text{floor\_base}}(\text{floorId}) + \text{elevation}_{\text{entity}}$。
- **强制死律**: 归属于高层 (如 `"floorId": "floor_2"`, `"floor_3"`) 的所有 Entity（房间 `rooms`、地板铺装、`items` 家具摆件、`walls` 墙体、`openings` 门窗），其 `elevation` 必须代表**距离本层面板上表面**的局部高度！
  - 落地在二层地板上的床/柜子/沙发：$\text{elevation} \equiv 0$（**严禁**手动叠加下层层高 $2.30\text{m}$）。
  - 放置于二层高度为 $H_{\text{carrier}}$ 柜面上的微观摆件：$\text{elevation} \equiv H_{\text{carrier}}$。
  - 悬挂于二层墙面、下沿离本层地面 $H_{\text{hang}}$ 的壁画/窗户：$\text{elevation} \equiv H_{\text{hang}}$。

### 定理二：Loft 挑空遮罩与房间覆盖定理 (Loft Void & Overlap Theorem)
- **挑空原理**: Loft 跃层本质是二层保留挑空区 (Double-Height Void)，二层面板只覆盖部分区域。
- **强制死律**:
  - 二层房间 (`"floorId": "floor_2"`) **仅能在有实体地板的区域**创建 (`loft_bedroom`, `sector` 弧切角平台等)。
  - **绝对禁止**在二层的挑空空洞区创建 `room` 实体，否则二层会被引擎自动铺上实体网格地板，造成一层被堵死和严重错层遮挡。
  - `"floor_2"` 在 `floors` 数组中必须显式设置 `"hideRoof": true`。

### 定理三：跨层楼梯垂直高差与平台接驳定理 (Stair Delta & Platform Connection Theorem)
- **锚定与接驳原理**: 楼梯是连接低层与高层平台的垂直交通通道，终点踏步必须精准接驳二层延伸平台。
- **强制死律**:
  - 楼梯的 `"floorId"` **必须归属于起点楼层** (通常为 `"floor_1"`)。
  - 楼梯的 `"elevation"` **必须设为 `0`**（以一层地面为起点）。
  - 楼梯的高度 $H_{\text{stair}}$ 必须精准等于**一层完成面到二层平台完成面的实际垂直高差** $\Delta E$；不能机械套用 `wallHeight + floorHeight`。墙高是立面参数，不一定等于楼板间净高；应先读取/推导两层平台的完成面标高，再令 `stairs.height ≈ ΔE`（参考示例为 `2.2`）。
  - **L 型楼梯镜像与转向规则**: 当 L 型楼梯位于 $-X$ 侧并向上爬升接驳二层平台的 `sector` 伸出角时，必须配置 `"rotation": 4.7124` ($\frac{3\pi}{2}$) 并显式开启 `"mirrored": true`！
  - **楼梯参数基线**: 参考示例使用 `depth: 3.0`、`cornerStep: 8`、`runBeforeCorner: 2`、`runAfterCorner: 1`；这些是该户型的基线，不是所有楼梯的死值。其他户型必须按平台位置、步高、步宽和可用通道重新计算，并检查最后一级是否落在二层实体平台上。

### 定理四：通高背景墙与二层护栏隔离开离定理 (Multi-Story Wall Separation Theorem)
- **隔离原理**: 贯穿一二层的通高背景屏风与二层平台沿边的防跌落护栏具有完全不同的属层与高度逻辑。
- **强制死律**:
  - **通高后墙立面木格栅屏风**: `"floorId": "floor_1"`, `"elevation": 0`, **必须贴靠于后墙立面** ($-Z$ 轴区域 $Z \approx -3.89$)，方向设置 `"rotation": 0`！（严禁误放于 $-X$ 左侧边墙导致与卫生间/大窗冲撞遮挡）。
    - 参考示例将后墙屏风拆为约 `width: 1.0` 的半高段和 `width: 2.0` 的通高段；宽度、数量和高度应按窗、门、楼梯及平台边界调整，不能把示例尺寸复制成通用死值。
  - **二层平台防跌落矮墙/护栏**: `"floorId": "floor_2"`, `"elevation": 0`, 高度设为护栏标准高度（如 `"height": 0.9`）。

### 定理五：等轴测视角与 X-Z 轴坐标方向映射定理 (Isometric Projection & Anti-Mirroring Rule)
- **坐标与视角映射矩阵 (黄金四大象限法则)**:
  - **$-X, -Z$ 象限 (左后内角区)**: Loft 主卧区域 (`loft_bedroom`)，包含二层双人床、1F 卫生间包厢（`room_1784650876560`）及厨房灶台水槽。
  - **$-X, +Z$ 象限 (左前与伸出平台区)**: 包含 2F `sector` 圆弧延伸平台（`rotation: -4.7124`）与 1F L 型楼梯起步区 (`x: -2.5, z: 0.5`, `depth: 3.0`)。
  - **$+X, -Z$ 象限 (右后/右中客厅区)**: 一层客厅区！云朵沙发靠右墙放置 (`x: 1.425, z: -2.9`, `rotation: 4.7124`)，电视柜面向右侧沙发 (`x: -0.76, z: -2.911`, `rotation: 1.5708`)，后墙固定木格栅屏风 ($Z \approx -3.89$)。
  - **$+X, +Z$ 象限 (右前开放餐饮区)**: 放置圆桌 (`round_table`) 与圆形地毯。
- **防镜像规则**: 绝对遵循上述象限矩阵，严禁混淆客厅与 Loft 卧室的左右侧位置！

### 定理六：家具旋转角 (Rotation) 轴向与朝向定理 (Furniture Rotation Convention)
- **朝向定义**:
  - `rotation: 0`：正面面向 $+Z$ 轴（前方）。
  - `rotation: 1.5708` ($\frac{\pi}{2}$)：正面面向 $-X$ 轴（左侧）。
  - `rotation: 3.1416` ($\pi$)：正面面向 $-Z$ 轴（后方）。
  - `rotation: 4.7124` ($\frac{3\pi}{2}$)：正面面向 $+X$ 轴（右侧）。

### 定理八：屋顶、围栏、栅栏门与喷泉 3D 渲染引擎 Subtype 权威对齐定理 (Engine Alignment Theorem)
- **底层引擎对齐机制**: Babylon Scene Renderer 严格基于特定 `subtype` 关键字构建几何顶点；若使用非官方支持的扩展名称（如 `hipped`, `pyramid`, `slat`, `glass`），将直接导致渲染器无法识别几何网格而消失或回退。
- **强制死律**:
  1. **屋顶 (`roofs`) 权威标识**:
     - 四坡坡屋顶: `"subtype": "hip"`（**严禁**写成 `"hipped"`）。
     - 圆穹顶/城堡塔楼顶: `"subtype": "dome"`（**严禁**写成 `"pyramid"`）。
     - 双坡人字屋顶: `"subtype": "gable"`（**严禁**写成 `"gabled"`）。
     - 单坡斜屋顶: `"subtype": "shed"`（**严禁**写成 `"monosloped"`）。
     - **檐口标高死律**: 必须配置 `"elevation"` (推荐为本层墙高如 `4.5`)，确保屋檐在墙顶精准悬挂，避免贴地或失踪。
  2. **围栏 (`fences`) 权威标识**:
     - 欧式雕花铁艺围墙: `"subtype": "iron_ornamental"`（豪宅/城堡庭院围墙首选）。
     - 现代玻璃护栏: `"subtype": "glass_rail"`（**严禁**遗漏 `_rail` 后缀写成 `"glass"`）。
     - 立柱木栅栏: `"subtype": "picket_wood"`；石砌矮墙: `"subtype": "stone_masonry"`。
  3. **栅栏门 (`fenceGates`) 位置死律**:
     - **必须**提供绑定的 `"fenceId"` 与线上偏移 `"t"` (0~1 之间)，或者直接提供端点坐标数组 `"from": [x1, z1]` 与 `"to": [x2, z2]`；**严禁**仅传单个 `x, z` 坐标导致引擎抛弃端点向量。
  4. **庭院中央喷泉 (`items`) 权威类型**:
     - 必须使用 `"type": "landscape_marble_fountain"` (汉白玉喷泉) 或 `"garden_fountain"`；**绝对禁止**误设为 `"landscape_rockery_aquarium"` (室内水族箱)。

### 定理九：防错层防镜像与渲染失败自查字典 (Anti-Pattern Self-Check Dictionary)

| 场景描述 | ❌ 错误配置 (导致消失/错层/镜像/脱节) | ✅ 正确配置 (零错层零消失) |
| :--- | :--- | :--- |
| **四坡斜屋顶 Subtype** | `"subtype": "hipped"` (引擎无法识别导致丢失) | `"subtype": "hip"`, `"elevation": 4.5` (准确渲染四坡瓦片屋顶) |
| **圆穹顶塔楼盖顶** | `"subtype": "pyramid"` (引擎不匹配) | `"subtype": "dome"`, `"elevation": 4.5` (生成漂亮半球穹顶) |
| **玻璃护栏 Subtype** | `"subtype": "glass"` (缺少后缀回退为木栏) | `"subtype": "glass_rail"` (生成半透明通透玻璃栏杆) |
| **庭院铁艺围墙** | `"subtype": "slat"` (非引擎标准关键字) | `"subtype": "iron_ornamental"` (生成黑色欧式雕花铁艺栅栏) |
| **栅栏门位置传参** | 只传 `"x": 0, "z": -28` (缺少端点丢失渲染) | `"fenceId": "fence_front_north"`, `"t": 0.43` 或 `"from"`/`"to"` 数组 |
| **庭院中央喷泉** | `"type": "landscape_rockery_aquarium"` (错设为水族箱) | `"type": "landscape_marble_fountain"` (生成汉白玉雕塑喷泉) |
| **二层双人床高程** | `"floorId": "floor_2"`, `"elevation": 2.3` (手动叠加二层高度) | `"floorId": "floor_2"`, `"elevation": 0` (直接落于二层面板上) |
| **Loft 楼梯参数与深高比** | `depth: 2.2`, 未设 `runBeforeCorner` | 设于 $-X$ 区域 (`x: -2.5, z: 0.5`)，配置 `depth: 3`, `height: 2.2`, `cornerStep: 8`, `runBeforeCorner: 2`, `runAfterCorner: 1` |
| **木格栅屏风位置** | 置于 $-X$ 左侧边墙，`rotation: 1.5708` | 置于 $-Z$ 后墙区域 (`z: -3.89`, `rotation: 0`)，通高段设 `height: 5.0, width: 2.0` |
| **2F Sector 延伸台旋转角** | `rotation: 0` (圆弧面向内部) | `rotation: -4.7124` (圆弧面向右上接驳楼梯出口) |
| **右侧靠墙沙发位置** | 将沙发置于 $-X$ 区域导致与电视柜挤在一起 | 置于 $+X$ 区域 (`x: 1.425, z: -2.9`, `rotation: 4.7124`)，背靠右侧立面墙 |
| **跨层直梯归属层** | `"floorId": "floor_2"`, `"elevation": 2.3` | `"floorId": "floor_1"`, `"elevation": 0`, `"height": 2.2` |

---

## 3. 户型解析六步工作流 (Visual Image-to-JSON Pipeline)

```
[视觉图片分析]
     │
     ├── 1. 户型形态与视角判定 ──> 判定为 Loft 跃层等轴测图，确立 -X(左) / +X(右) / -Z(后) / +Z(前) 矩阵
     ├── 2. 空间区域划分 ──> 使用 square / sector 拼合 2F 卧室与延伸平台 (挑空区不设 2F Room)
     ├── 3. 墙体与开孔矢量 ──> 标记起点终点, 绑定湿区卫生间 wallIds, 配置双面材质与墙裙腰线
     ├── 4. 垂直交通与接驳 ──> 楼梯设于 1F (elevation: 0), L型弯折精准接驳 2F 弧切角平台 (-2.5, 0.5)
     ├── 5. 通高件与隔断 ──> 通高木格栅墙设于 1F, 高度 height: 5.0m
     └── 6. 软装分层与旋转朝向 ──> 高层高程归零 (2F 落地件 elevation: 0), 按朝向定理设定 rotation 与 colors
```

---

## 4. 湿区墙裙与墙体双面材质 (Walls, Wainscot & Bathroom Enclosure)

### 4.1 湿区/卫生间围合规范
1. 建立独立房间，如 `"id": "room_bathroom"`，在 `wallIds` 中绑定围合墙体 (`north`, `east`, `south`, `west`)。
2. 围合墙体开启墙裙瓷砖：
   - `"wainscotEnabled": true`
   - `"wainscotHeight": 2`
   - `"wainscotMaterialFront"`: 瓷砖材质结构体 (如 `brick-mosaic` / `brick-square` 广场方砖)

---

## 5. 部件级色彩映射与结构化材质规范 (Part-Level Colors & Materials Schema)

每个家具/饰品组件均应配备细分部件的色彩与材质映射：

```json
{
  "id": "sofa_living",
  "type": "sofa",
  "name": "云朵沙发",
  "floorId": "floor_1",
  "roomId": "room_living_kitchen",
  "x": 1.425,
  "z": -2.9,
  "rotation": 4.7124,
  "colors": {
    "seat": "#ffffff",
    "back": "#ffffff",
    "arms": "#ffffff",
    "legs": "#8c6c50"
  },
  "materials": {
    "seat": "#ffffff",
    "back": "#ffffff",
    "arms": "#ffffff",
    "legs": "#8c6c50"
  }
}
```

---

## 5.1 天空盒与环境材质死律规范 (Skybox & Environment Material Rules)

1. **楼层天空盒开关**: 如果场景需要天空盒，应在每个相关楼层显式设置 `"skyboxEnabled": true`。运行时默认值是 `false`，不要把“未设置”描述成“自动开启”。
2. **环境天空盒与地面材质**: `environment` 必须配置非空的 `skyMaterial` 和 `groundMaterial`（严禁设为 `null`）。推荐采用与场景主色调一致的浅色/温暖涂料材质：
   ```json
   "environment": {
     "skyMaterial": {
       "id": "paint-oatmeal-yellow",
       "kind": "color",
       "category": "paint",
       "name": "燕麦黄",
       "color": "#dfd2bc"
     },
     "groundMaterial": {
       "id": "paint-oatmeal-yellow",
       "kind": "color",
       "category": "paint",
       "name": "燕麦黄",
       "color": "#dfd2bc"
     }
   }
   ```

完成建筑 JSON 后，先运行基础校验；对交付文件运行严格校验：

```powershell
node skills/create-buildings/scripts/validate-building.mjs <文件路径>
node skills/create-buildings/scripts/validate-building.mjs <文件路径> --strict
```

---

## 6. 建筑生成关键注意事项 (Generation Guidelines & Checklist)

在根据设计图或参考图片生成 3D 建筑 JSON 时，请遵循以下核心生成注意事项与自查清单：

### 6.1 生成核心规范
1. **尺度与高程算准**：记录每层 `level`、`wallHeight`、`floorHeight` 及平台完成面标高。
2. **先切楼板、后建房间**：高层（如二层）必须采用 `square`/`sector`/`l-shape` 精准拼出实体楼板；挑空空洞区绝对禁止建二层房间实体。
3. **湿区封闭与器具完整**：卫生间与厨房必须闭合 4 面墙体并绑定 `wallIds`，配置门、卫浴/厨电器具，并为墙裙设置瓷砖材质 (`wainscotEnabled: true`)。
4. **按立面开洞**：每个门窗 (`opening`) 必须精准绑定对应的 `wallId`，确保宽、高、窗台高不超出墙体范围。
5. **部件材质成对提供**：家具组件需成对提供部件级 `colors` 与 `materials`；挂墙件 `elevation` 代表本层局部挂墙高度；台面摆件 `elevation` 必须等于承载面高度。

### 6.2 校验能力边界

基础校验会检查 JSON 可解析性、标准外壳、集合 ID 唯一性、楼层引用、家具房间引用和开洞墙体引用。严格校验还会检查实体坐标/尺寸是否为有限数值、正尺寸、开洞参数是否合理，以及楼层高程相关的明显错误。

Validator 不会自动证明房间闭合、开洞未越过墙体、房间不重叠、挑空未被覆盖或楼梯最后一级准确落在平台上；这些项目必须通过几何计算、渲染截图或人工复核完成。

### 6.4 引擎几何与材质死律定理 (Engine Architectural Theorems)

#### 定理十：墙体绘制向量与室内外双面材质映射定理 (Wall Normal & Dual-Surface Material Theorem)
在 3D 渲染引擎中，一段墙体按起点 `from: [x1, z1]` 至终点 `to: [x2, z2]` 的绘制向量决定 `materialFront`（正面法线）与 `materialBack`（背面法线）的面向。

1. **法线几何方向**:
   - `dx = x2 - x1, dz = z2 - z1`
   - `materialFront`（正面）法线方向为：沿着矢量 $(dx, dz)$ 旋转 $+90^\circ$（左侧）；
   - `materialBack`（背面）法线方向为：沿着矢量 $(dx, dz)$ 旋转 $-90^\circ$（右侧）。

2. **室内外材质映射规约**:
   - **向右矢量 ($dx > 0, dz = 0$，如南外墙)**: `materialFront` 朝向**室内**（应设为室内墙漆/壁纸，如 `#f9fbff`），`materialBack` 朝向**室外**（应设为室外建筑粉墙 `#ff85a2`）。若写反，室外将露出一片尴尬的白墙！
   - **向左矢量 ($dx < 0, dz = 0$，如北外墙)**: `materialFront` 朝向**室外**（应设为室外建筑粉墙 `#ff85a2`），`materialBack` 朝向**室内**（应设为室内墙漆 `#f9fbff`）。
   - **向上矢量 ($dx = 0, dz > 0$，如西外墙)**: `materialFront` 朝向**室外**，`materialBack` 朝向**室内**。
   - **向下矢量 ($dx = 0, dz < 0$，如东外墙)**: `materialFront` 朝向**室内**，`materialBack` 朝向**室外**。

**禁止图方便全量设为相同颜色，必须按矢量法线规则精准指定 `materialFront`（室内）与 `materialBack`（室外），以保证室内乳白温馨、室外靓丽粉嫩的双面真实建筑效果！**

### 6.5 自查与完成判定标准
完成任意建筑 JSON 生成后，最终成功判定标准为：
**严格 Validator 校验通过 + 墙/门窗/房间引用闭合 + 挑空与楼梯几何无接驳冲突 + 空间功能件齐全 + 部件材质语义完整 + 对关键视角完成渲染复核**。若未完成几何或渲染复核，只能报告为“结构校验通过”。
