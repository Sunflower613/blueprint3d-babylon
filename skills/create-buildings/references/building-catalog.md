# Blueprint3D 官方建筑组件权威索引库 (Building Architectural Catalog)

本文档由 `node skills/create-buildings/scripts/update-catalogs.mjs` 自动构建生成。为 `blueprint3d-babylon` 官方全量**建筑工程组件**（包含房间 Shape 形状、墙体材质/墙裙/踢脚线、门窗开洞 Shape、楼梯类型 Subtype 与特定控制参数、护栏/栅栏类型、栅栏门、屋顶/吊顶类型、环境与天空盒）的静态权威字典。

---

## 1. 房间组件 (`rooms`)

### 1.1 核心字段 Schema 规范
```json
{
  "id": "room_living",
  "name": "客厅",
  "floorId": "floor_1",
  "shape": "square",
  "x": 0,
  "z": 0,
  "width": 5.0,
  "depth": 4.0,
  "rotation": 0,
  "elevation": 0,
  "material": {
    "id": "derived_texture_wood-plank-oak-light",
    "kind": "texture",
    "category": "wood",
    "name": "浅色橡木地板",
    "color": "#f9e9d2"
  },
  "wallIds": {
    "north": "wall_1",
    "east": "wall_2",
    "south": "wall_3",
    "west": "wall_4"
  }
}
```

### 1.2 全量 8 种房间 Shape 标识与参数规范
系统支持的 8 种房间拓扑形状：

| `shape` 标识 | 中文名称 | 默认尺寸 ($W \times D$) | 专属控制参数与几何逻辑说明 |
| :--- | :--- | :--- | :--- |
| `square` | 方形 | $4\text{m} \times 4\text{m}$ | 标准 方形 房间。 |
| `l-shape` | L形 | $5\text{m} \times 5\text{m}$ | **必选专属参数**：`edgeWidth` (缺角切边宽度), `edgeDepth` (缺角切边深度) |
| `circle` | 圆形 | $4\text{m} \times 4\text{m}$ | 标准 圆形 房间。 |
| `octagon` | 八角 | $4\text{m} \times 4\text{m}$ | 标准 八角 房间。 |
| `diamond` | 四角 | $4\text{m} \times 4\text{m}$ | 标准 四角 房间。 |
| `sector` | 扇形 | $5\text{m} \times 5\text{m}$ | Loft 跃层伸出角平台、圆弧阳台首选 |
| `semicircle` | 半圆 | $5\text{m} \times 3\text{m}$ | 用于凸窗、退台阳台 |
| `right-triangle` | 三角形 | $5\text{m} \times 4\text{m}$ | 标准 三角形 房间。 |

---

## 2. 墙体组件与面材/墙裙/踢脚线 (`walls`)

### 2.1 核心字段 Schema 规范
```json
{
  "id": "wall_1f_bathroom_west",
  "floorId": "floor_1",
  "from": [-2.0, -3.0],
  "to": [-2.0, -1.0],
  "thickness": 0.18,
  "height": 4.5,
  "materialFront": "#ffffff",
  "materialBack": "#e8dfd1",
  "baseboardEnabled": true,
  "baseboardHeight": 0.1,
  "baseboardMaterial": "#8c6c50",
  "wainscotEnabled": true,
  "wainscotHeight": 2.0,
  "wainscotMaterialFront": {
    "id": "derived_texture_brick-mosaic",
    "kind": "texture",
    "category": "brick",
    "name": "马赛克瓷砖",
    "color": "#ffffff"
  },
  "wainscotMaterialBack": "#e8dfd1"
}
```

---

## 3. 门窗与开洞组件 (`openings`)

### 3.1 核心字段 Schema 规范
```json
{
  "id": "opening_window_living",
  "type": "window",
  "shape": "square",
  "floorId": "floor_1",
  "wallId": "wall_1f_east",
  "t": 0.5,
  "width": 1.8,
  "height": 1.5,
  "sillHeight": 0.9,
  "frameMaterial": "#333333",
  "glassMaterial": "#aaccff",
  "panelMaterial": "#ffffff",
  "isOpen": false,
  "panelHidden": false,
  "glassHidden": false
}
```

### 3.2 全量 8 种开洞 Shape 标识与适用场景

| `shape` 标识 | 中文名称 | 适用场景与外观说明 |
| :--- | :--- | :--- |
| `square` | 方形 | 标准矩形平开门、推拉窗、入户门、落地窗。 |
| `diamond` | 四角 | 标准四角开洞。 |
| `circle` | 圆形 | 舷窗、中式圆洞门、采光天井窗。 |
| `semicircle` | 半圆形 | 标准半圆形开洞。 |
| `round-arch` | 圆顶方形 | 罗马拱门、法式复古拱形落地窗。 |
| `pointed-arch` | 尖顶方形 | 哥特式尖顶门窗、景观开洞。 |
| `quarter-sector` | 扇形 | 标准扇形开洞。 |
| `right-triangle` | 三角形 | 标准三角形开洞。 |

---

## 4. 垂直交通楼梯组件 (`stairs`)

### 4.1 核心字段 Schema 规范
```json
{
  "id": "stair_1f_to_2f",
  "floorId": "floor_1",
  "subtype": "lshape",
  "x": -2.5,
  "z": 0.5,
  "width": 1.0,
  "depth": 3.0,
  "height": 2.2,
  "steps": 14,
  "rotation": 4.7124,
  "mirrored": true,
  "cornerStep": 8,
  "runBeforeCorner": 2,
  "runAfterCorner": 1,
  "treadMaterial": "#8c6c50",
  "riserMaterial": "#ffffff",
  "stringerMaterial": "#333333",
  "handrailMaterial": "#333333"
}
```

### 4.2 全量 6 种楼梯 Subtype 标识与专属几何控制参数

| `subtype` 标识 | 英文与中文 | 专属控制参数与几何逻辑说明 |
| :--- | :--- | :--- |
| `straight` | 直跑楼梯 | 标准直向楼梯。终点直线到达高层完成面。 |
| `lshape` | L 型转角楼梯 | **Loft 跃层最推荐**。<br>• `"cornerStep"`: 转角平台踏步序号<br>• `"runBeforeCorner"`: 拐角前直跑段步数<br>• `"runAfterCorner"`: 拐角后段步数<br>• `"mirrored"`: `true`/`false` 开启反向/镜像弯折 |
| `ushape` | U 型双跑转角梯 | 双跑并排楼梯。<br>• `"uSlotWidth"`: 两跑之间的开口缝隙宽度<br>• `"uVoidLength"`: 中间转角休息平台深度 |
| `spiral` | 螺旋旋转楼梯 | 中轴圆柱螺旋梯。<br>• `"spiralDegrees"`: 旋转总角度 (如 360) |
| `curved` | 弧形楼梯 | 优雅大弧线楼梯。<br>• `"spiralDegrees"`: 偏转弧度角 |
| `floating` | 悬空踏步现代梯 | 无侧梁/悬臂式踏步楼梯。 |

---

## 5. 护栏与栅栏门组件 (`fences` & `fenceGates`)

### 5.1 护栏组件 (`fences`) Schema
```json
{
  "id": "fence_2f_loft_guard",
  "floorId": "floor_2",
  "subtype": "glass",
  "from": [-2.0, 0.0],
  "to": [2.0, 0.0],
  "height": 0.9,
  "thickness": 0.05,
  "frameMaterial": "#333333",
  "panelMaterial": "#aaccff"
}
```

#### 护栏 4 种 Subtype 标识
- `"glass"`: 现代全透明/半透明玻璃护栏（**Loft 2F 挑空防跌落护栏首选**）
- `"slat"` / `"picket"`: 立柱木/金属护栏
- `"solid"`: 矮墙护栏/实体防跌落栏杆
- `"wire"`: 铁艺/网状护栏

---

## 6. 屋顶与吊顶组件 (`roofs`)

### 6.1 全量 5 种屋顶 Subtype 标识
- `"flat"`: 平屋顶 / 吊顶封顶面板
- `"gabled"`: 双坡人字屋顶
- `"hipped"`: 四坡屋顶
- `"monosloped"`: 单坡斜屋顶
- `"pyramid"`: 金字塔顶 / 尖顶

---

## 7. 环境与天空盒组件 (`environment` & `skyboxEnabled`)

配置样例：
```json
{
  "floors": [{ "id": "floor_1", "skyboxEnabled": true }],
  "environment": {
    "skyMaterial": { "id": "paint-oatmeal-yellow", "kind": "color", "category": "paint", "name": "燕麦黄", "color": "#dfd2bc" },
    "groundMaterial": { "id": "paint-oatmeal-yellow", "kind": "color", "category": "paint", "name": "燕麦黄", "color": "#dfd2bc" }
  }
}
```
