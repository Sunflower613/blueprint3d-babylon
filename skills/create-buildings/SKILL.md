---
name: create-buildings
description: Blueprint3D Babylon 通用 3D 建筑 JSON (`.b3dbuilding.json`) 权威生成、错层预防与坐标防镜像校验技能。包含严格的防错层防镜像七大三维几何定理、等轴测视角与 X-Z 坐标系方向对照法则、楼层相对高程隔离法则 (Floor-Local Elevation Rule)、挑空虚空区遮罩公式 (Loft Void Rule)、多部件 colors/materials 映射、湿区墙裙与复合切角平台算法、跨层楼梯与通高屏风公式、防错自查反例字典及 GitHub 开源参考查询索引。
---

# Blueprint3D 通用 3D 建筑 JSON 权威生成与防错层防镜像指南

本技能为通用的 3D 建筑档案生成与转换权威指南。旨在指导智能体（无论是否位于本项目上下文中）**将任意户型图片或设计图（平层、Loft跃层、错层复式、多层别墅、不规则空间等）**精确转换为符合 `blueprint3d-babylon.building.v1` 规范的标准 `.b3dbuilding.json` 档案，并**100% 杜绝错层、悬空、镜像翻转与楼梯接驳错位异常**。

---

## 1. 组件与材质权威查询索引 (External Catalog References)

- 🏠 **官方 Loft 跃层示范 JSON 档案**：查阅本地范例文件 [loft-building-example.b3dbuilding.json](../../example/downloads/loft-building-example.b3dbuilding.json)或[GitHub链接](https://github.com/Sunflower613/blueprint3d-babylon)（位于 `example/downloads/loft-building-example.b3dbuilding.json`）。该档案为标准 Loft 跃层建筑示范 JSON，展示了 1F/2F 跃层房间拓扑、跨层楼梯接驳、挑空护栏及完整软装与材质映射。
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

### 定理七：防错层防镜像自查反例字典 (Anti-Pattern Self-Check Dictionary)

| 场景描述 | ❌ 错误配置 (导致错层/镜像/脱节) | ✅ 正确配置 (零错层零镜像) |
| :--- | :--- | :--- |
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

1. **楼层天空盒开关**: `floors` 数组中的所有楼层（如 `floor_1`, `floor_2`）其 `"skyboxEnabled"` 必须显式设为 `true`。
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

完成任意 JSON 后，运行仓库校验命令：

```powershell
node skills/create-buildings/scripts/validate-building.mjs <文件路径>
```

---

## 6. 建筑生成关键注意事项 (Generation Guidelines & Checklist)

在根据设计图或参考图片生成 3D 建筑 JSON 时，请严格遵循以下核心生成注意事项与自查清单：

### 6.1 生成核心规范
1. **尺度与高程算准**：记录每层 `level`、`wallHeight`、`floorHeight` 及平台完成面标高。
2. **先切楼板、后建房间**：高层（如二层）必须采用 `square`/`sector`/`l-shape` 精准拼出实体楼板；挑空空洞区绝对禁止建二层房间实体。
3. **湿区封闭与器具完整**：卫生间与厨房必须闭合 4 面墙体并绑定 `wallIds`，配置门、卫浴/厨电器具，并为墙裙设置瓷砖材质 (`wainscotEnabled: true`)。
4. **按立面开洞**：每个门窗 (`opening`) 必须精准绑定对应的 `wallId`，确保宽、高、窗台高不超出墙体范围。
5. **部件材质成对提供**：家具组件需成对提供部件级 `colors` 与 `materials`；挂墙件 `elevation` 代表本层局部挂墙高度；台面摆件 `elevation` 必须等于承载面高度。

### 6.2 自查与完成判定标准
完成任意建筑 JSON 生成后，最终成功判定标准为：
**基础 Validator 校验通过 + 墙/门窗/房间引用闭合 + 挑空与楼梯几何无接驳冲突 + 空间功能件齐全 + 部件材质语义完整**。
