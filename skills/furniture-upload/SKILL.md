---
name: furniture-upload-builder
description: 创建可以在 blueprint3d-babylon 的 "自定义 > 上传家具" 控制面板中加载的独立 JavaScript 家具定义文件。当用户请求创建或修改可上传的家具时使用此技能。
---

# Blueprint3D 自定义家具代码生成器

生成一个无第三方依赖的 `.js` 或 `.mjs` 模块文件。它必须默认导出（default export）以下工厂函数：

```js
export default function createFurniture({ boxComponent, cylinderComponent, sphereComponent, BABYLON }) {
  // 返回一个家具定义对象。
}
```

## 核心约定结构

- 返回的对象必须包含唯一的 `type`、非空 `name`、默认尺寸 `defaultSize`、可编辑组件列表 `components`、`build` 建模函数，以及可选的 `thumbnail`。
- `type`: 必须以小写字母开头，只能包含小写字母、数字和下划线。建议使用 `custom_` 前缀（例如：`custom_sofa`）。
- `thumbnail` (可选): 字符串类型。可以是一个网络图片 URL，或者一个 Base64 Data URL（例如 `data:image/png;base64,...`），作为家具的缩略图预览。
- `defaultSize`: 必须包含大于零的 `width` (宽度)、`depth` (深度)、`height` (高度)，其单位是**英寸 (inches)**。
- `components`: 必须包含至少一个元素。每个组件都需要有唯一的 `id` (字符串)、显示的 `label` 标签以及十六进制的默认颜色 `defaultColor`。
- `build(registry, item, node, size)`: 必须将构建出来的每一个三维 Mesh 的 `parent` 挂载到传入的 `node` 上。
- 优先使用注入的 `boxComponent`、`cylinderComponent` 和 `sphereComponent`；这能确保生成的家具完美支持编辑器中的组件单独选中、修改颜色和编辑材质功能。
- 禁止使用 `import`、发起网络请求、使用外部图片纹理或硬编码绝对本地路径。上传的模块必须是完全独立自闭环的。
- 禁止访问 DOM、localStorage、cookies 或其他无关的浏览器全局变量。

## 尺寸与坐标单位规范

> [!IMPORTANT]
> **单位换算陷阱**: 
> 注册字段 `defaultSize` 里的数值单位是 **英寸 (inches)**。
> 但是在运行期，传入 `build(registry, item, node, size)` 里的 `size` 对象数值单位会被系统自动转换为 **米 (meters)** （1 英寸 = 0.0254 米）。
> 因此，在 `build` 逻辑中所有硬编码的局部尺寸（如椅腿的厚度 `0.08`，脚架高 `0.16` 等）和位置坐标，其数值的单位都必须是 **米 (meters)**。

- **Babylon 坐标轴**: 采用 Y-up（Y 轴向上）坐标系。确保家具的底部在 `y = 0` 平面上。例如：一个高度为 `H` 的方块组件，其中心点 Y 坐标应该设置为 `H / 2`。
- **拉伸缩放**: 所有的主结构尺寸和坐标位置都应当根据传入的 `size` (米) 动态计算得出，以确保用户在编辑器中拉伸修改家具大小时，模型能正确等比缩放。

## 组件辅助函数定义

### 1. `boxComponent(registry, item, definition, componentId, dimensions, transform, options)`
- `dimensions`: `{ width, height, depth }` (单位：米)
- `transform`: `{ position: { x, y, z }, rotation: { x, y, z } }` (旋转 `rotation` 字段为可选)
- `options`: `{ parent: node }` (必传，用于挂载到父节点)

### 2. `cylinderComponent(registry, item, definition, componentId, dimensions, transform, options)`
- `dimensions`: `{ height, diameterTop, diameterBottom, tessellation }` (单位：米；若上下直径一致，可单用 `diameter` 字段)
- `transform`: `{ position: { x, y, z }, rotation: { x, y, z } }`
- `options`: `{ parent: node }`

### 3. `sphereComponent(registry, item, definition, componentId, dimensions, transform, options)`
- `dimensions`: `{ diameter }` 或者不等比的三轴直径 `{ diameterX, diameterY, diameterZ }` (单位：米)
- `transform`: `{ position: { x, y, z }, rotation: { x, y, z } }`
- `options`: `{ parent: node }`
---

## 高阶特殊功能家具配置说明

对于具有特殊交互、定位或物理渲染功能的家具（如灯具、镜子、玻璃、水槽和马桶），可以在定义中声明对应的元数据或逻辑：

### 1. 悬挂/吸附位置定义 (`placeType`)
- **`placeType: 'wall'`**: 表示该家具（如壁镜、壁灯、壁画）会吸附并放置于房间**墙壁**上。
- **`placeType: 'ceiling'`**: 表示该家具（如吊灯、吸顶灯、风扇）会吸附并挂载于房间**天花板**上。
- *(默认不设置表示放置在地面上 `'floor'`)*

### 2. 灯具与发光体配置 (Lighting)
- **`lightSource`**: 结构化光源定义。如果家具需要发光，可指定光源属性（引擎会自动在 3D 空间创建对应光源）：
  - `type`: `'point'` (点光源，如普通灯泡) 或 `'spot'` (聚光灯)
  - `offset`: `{ x, y, z }` (相对于家具中心点偏移，单位是**英寸**)
  - `color`: 灯光颜色 HEX 字符串（如 `"#fffbe6"`）
  - `intensity`: 光源强度（默认 0.8）
  - `range`: 光照范围半径（单位是**英寸**，默认 150）
  - *(若为 spot 聚光灯)*: 支持配置 `direction` (朝向，默认 `{ x: 0, y: -1, z: 0 }` 向下)、`angle` (张角弧度，默认 `Math.PI / 3`)、`exponent` (衰减指数，默认 2)。
- **`emissiveComponents`**: 发光组件 ID 列表（如 `['bulb', 'glow']`），指定开灯状态下哪些组件在 3D 渲染里呈自发光状态（不受暗处阴影遮蔽）。
- **`lightColorComponent`**: 关联发光体组件 ID（如 `'glow'`），当用户更改该组件颜色时，光源本身的颜色 `color` 会自动保持同步更改。

### 3. 镜面反射配置 (Mirror)
- 在家具定义中声明 **`isMirror: true`**。
- 在 `components` 中必须包含一个 `id` 为 `'mirror'` 的组件，并应用在三维镜面网格上。引擎会自动将该组件的材质转为高反光度的**银镜材质**，反射出周边环境。

### 4. 玻璃材质向下兼容规则 (Glass)
- 任何组件的 ID 如果小写拼写中包含了 `'glass'`（如 `'cabinet_glass'`, `'wineglass'` 等），引擎材质管理器会自动向下兼容，将该部分默认应用为**半透明玻璃材质**。

### 5. 可开关的水容器（如水槽、浴缸）
- 可以在 `build(registry, item, node, size)` 里面通过检查 **`item.waterEnabled !== false`** 动态控制是否生成水面网格，以支持用户在右键菜单中一键开关蓄水状态。

### 6. 可开关盖板的家具（如马桶）
- 可以在 `build(registry, item, node, size)` 里面通过检查 **`item.lidOpen === true`** 动态控制马桶盖板网格（Lid Mesh）的旋转 (`rotation.x`) 和位置偏移，从而在 3D 场景中渲染出开盖与合盖的姿态。

---

## 坐姿交互点配置 (可选)

可以通过在定义中返回 `interaction` 块来为家具配置坐姿锚点：
- `type`: 目前支持 `'sit'`
- `getInteractionPoints(size)`: 接收运行期 `size` 对象 (单位：米)，并返回一个交互点数组 `{ x, y, z, rot }`：

```js
interaction: {
  type: 'sit',
  getInteractionPoints(size) {
    const seatH = Math.max(0.12, size.height * 0.36);
    return [
      { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
      { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
    ];
  }
}
```

## 构建规则

1. 在工厂函数内部声明 `definition` 变量，以便 `build` 函数可以通过闭包访问它。
2. 调用辅助组件函数时，第三个参数务必传入上述声明的局部 `definition` 变量。
3. 相同的 `componentId` 会在编辑器中被视为同一个材质部件。对于共享同一种材质的网格使用相同的 `componentId`；对于独立修改材质/颜色的部分，使用独立的 ID。
4. 如果内置的三维辅助组件函数不满足需求，可以直接使用注入的 `BABYLON` 创建网格，但必须设置网格的父级和元数据：

```js
mesh.parent = node;
mesh.metadata = {
  ...(mesh.metadata || {}),
  blueprintItemId: item.id,
  blueprintFurnitureComponentId: '组件ID'
};
```

## 输出检查清单

- 文件能以 ES module 格式正确解析，且有且仅有一个默认导出的工厂函数。
- 导出的家具 `type` 不能与内置的或者现有的其他自定义类型冲突。
- `components` 数组里的每一个 `id`，都必须在 `build` 里的 Mesh 中被实际引用到。
- 模型没有沉入地下的部分（没有低于 Y=0 的几何结构），且模型在 X 轴和 Z 轴方向居中（X=0, Z=0）。
- 仅输出一个可供直接下载上传的独立的 `.js` 或 `.mjs` 代码文件。

建议参考说明弹窗中提供的云朵沙发 `custom-furniture-example.js` 代码，它是最佳的起步模板。

## 完整参考示例 (云朵沙发)

以下是一个标准的、可直接被系统上传加载的云朵沙发 JavaScript 定义文件。它体现了尺寸单位转换、多材质组件划分以及坐姿交互点的正确写法：

```js
export default function createFurniture({ boxComponent }) {
  const definition = {
    type: 'custom_sofa',
    name: '云朵沙发',
    thumbnail: '', // 自定义缩略图路径 (支持 Base64 Data URL 或线上 URL，可选)
    defaultSize: { width: 84, depth: 36, height: 32 }, // 默认尺寸，单位：英寸
    components: [
      { id: 'seat', label: '坐垫', defaultColor: '#ff9dbb' },
      { id: 'back', label: '靠背', defaultColor: '#f56f9f' },
      { id: 'arms', label: '扶手', defaultColor: '#f56f9f' },
      { id: 'legs', label: '脚架', defaultColor: '#b07a50' }
    ],
    interaction: {
      type: 'sit',
      getInteractionPoints(size) {
        // 这里的 size 单位是米 (Meters)
        const seatH = Math.max(0.12, size.height * 0.36);
        return [
          { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
          { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
        ];
      }
    },
    build(registry, item, node, size) {
      // 这里的 size 单位是米 (Meters)
      const seatH = Math.max(0.12, size.height * 0.36);
      
      // 1. 坐垫
      boxComponent(registry, item, definition, 'seat', {
        width: size.width, height: seatH, depth: size.depth
      }, { position: { x: 0, y: seatH / 2, z: 0 } }, { parent: node });

      // 2. 靠背
      boxComponent(registry, item, definition, 'back', {
        width: size.width, height: size.height * 0.58, depth: Math.max(0.12, size.depth * 0.18)
      }, { position: { x: 0, y: size.height * 0.58, z: -size.depth * 0.41 } }, { parent: node });

      // 3. 扶手
      [-1, 1].forEach((side) => {
        boxComponent(registry, item, definition, 'arms', {
          width: Math.max(0.12, size.width * 0.09), height: size.height * 0.52, depth: size.depth
        }, { position: { x: side * size.width * 0.455, y: size.height * 0.38, z: 0 } }, { parent: node });
      });

      // 4. 脚架 (硬编码的粗细和高度单位都是米)
      [-1, 1].forEach((xSide) => {
        [-1, 1].forEach((zSide) => {
          boxComponent(registry, item, definition, 'legs', {
            width: 0.08, height: 0.16, depth: 0.08
          }, { position: { x: xSide * size.width * 0.36, y: 0.08, z: zSide * size.depth * 0.32 } }, { parent: node });
        });
      });
    }
  };

  return definition;
}
```
