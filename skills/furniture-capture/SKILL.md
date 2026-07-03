---
name: furniture-capture
description: 3D 建筑编辑器家具 3D 渲染图批量全自动截图落盘及图像卡片化 UI 重构流程
---

# 建筑编辑器家具 3D 缩略图批量全自动截图落盘流程

该技能为向 3D 建筑沙盘编辑器批量生成、落盘各类型家具的高清微距预览图，并进行左侧选择栏的卡片化 UI 升级提供标准的执行流程和技术指南。

## 核心设计理念与技术难点

1. **无感备份与复位**：
   在自动化截图执行前必须使用 `testMap.exportJSON()` 备份用户的当前场景，截图全部结束后使用 `testMap.loadJSON(backupJSON)` 完美还原。
2. **纯粹模型渲染（防止蓝色描边）**：
   生成家具不使用带有高亮和焦点选中状态的 `entityManager.addItem`，而是直接调用最底层的 `testMap.addItem`，从而在截图时完全避开 `selectItem` 逻辑，产生无高亮蓝框的纯净素材图。
3. **相机近平面防裁剪（防止空白白屏图）**：
   极小型家具（如口红、小摆件）在进行特写微距截图时，相机会拉得很近。默认的相机近裁剪面（`minZ`，通常为 `1.0` 左右）会导致极近处的物体被裁剪成空白。因此，截图前必须临时把 `camera.minZ` 调整为极低的 `0.005`（5 毫米），截图后再完全复位。
4. **渲染稳定延时（防止生成过快导致空白）**：
   大家具由于子 Mesh 复杂，生成世界矩阵与重绘需要一定的帧重绘时间。在每次生成家具后，显式加入 `150ms` 的 `setTimeout` 延迟重绘，待画面彻底稳定后才触发拍照。
5. **免刷新一键默认最佳 3D 视角**：
   内置硬编码了经过纠偏、旋转 180 度后的默认最佳正面俯瞰视角数据（`alpha: -1.0471975511965976 + Math.PI` 等）。默认通过 `USE_DEFAULT_CAMERA = true` 直接在一页内跑完所有截图。如需重新调配，可将其设为 `false` 以恢复 `sessionStorage` 暂存与刷新页面的双阶段自定义拍摄逻辑。
6. **兼容性空场景彻底清空（扁平单层与多层结构）**：
   为避免静态写死的 `emptyScene` 格式与当前或未来的扁平 `testMap` 地图数据结构冲突，在脚本中使用 `JSON.parse(JSON.stringify(backupData))` 拷贝最新地图结构。除了清除多层 `emptyScene.floors` 内的实体外，必须同步清空单层扁平结构顶层的 `walls`、`rooms`、`items`、`openings` 等所有实体数组。
7. **2D/3D 视图防崩溃自动切回**：
   调用 `loadJSON` 加载空场景可能导致编辑器自动退回 2D 视图。在 2D 状态强制进行 3D 渲染和截图会导致 WebGL 严重异常（INVALID_OPERATION）进而导致浏览器强刷。脚本应动态监测模式状态并模拟点击 `#btn-view-toggle` 自动恢复 3D 并设置等待延时。
8. **微距视角下的尺寸计算安全防护**：
   对微小或结构极其紧凑的摆件，计算出的包围盒尺寸 `maxDim` 可能会接近 0 甚至出现 NaN。需在脚本中引入最小值安全限定（例如 `maxDim = Math.max(0.1, ...)`）防止相机 Radius 崩溃导致视图黑白屏。
9. **每次加载场景强行隐藏 3D 网格**：
   由于 `testMap.loadJSON()` 内部实现会重新触发网格辅助线的重绘，仅在截图最初隐藏一次无效。必须在每次循环的 `testMap.loadJSON(emptyScene)` 加载操作后，立即显式调用 `viewer3d.clear3DGrid()` 隐藏白色网格线。
10. **相机位置修改在渲染前强制刷新**：
    在修改 `camera.target`、`camera.alpha`、`camera.beta` 等核心位置偏角属性后，在 `scene.render()` 之前必须立即执行 `camera.getViewMatrix(true)` 强行应用并刷新相机的视图矩阵，否则在截图帧的渲染中可能产生由于视图延迟而拍到背面/错位角的问题。
11. **打包与运行时截图副作用依赖**：
    由于 Vite 依赖优化及 pre-bundling，若不手动在依赖打包清单 `src/core/babylon.production.js` 末尾引入 `@babylonjs/core/Misc/screenshotTools.js` 副作用加载器，则运行时调用 `CreateScreenshotAsync` 会因副作用缺失报错阻断运行。

---

## 详细步骤指南

### 步骤一：启动图片落盘接收后台
在终端的工作区根目录下执行以下命令，启动用于接收并自动写入 `src/furniture/image/` 目录的临时 Node 服务（运行在 3001 端口）：
```bash
node skills/furniture-capture/scripts/image_saver.js
```

### 步骤二：调整 3D 编辑器视角（可选）
1. 若想为所有图片自定义一套全新的展示偏角：访问编辑器页面（如 `http://localhost:3000/`）。
2. 在 3D 模式下，使用鼠标与键盘拖拽、旋转相机，调出一个最满意的倾角。
3. 确保 [browser_capture.js](file:///d:/code/3d-babylon/blueprint3d-babylon/skills/furniture-capture/scripts/browser_capture.js) 顶部的 `USE_DEFAULT_CAMERA` 设为 `false`。

### 步骤三：注入自动化截图脚本
1. 在浏览器中打开开发人员工具（F12），切至 **Console（控制台）**。
2. 复制并执行 [browser_capture.js](file:///d:/code/3d-babylon/blueprint3d-babylon/skills/furniture-capture/scripts/browser_capture.js) 中的所有代码。
3. **根据模式执行**：
   - **内置最佳视角（默认，一键免重载）**：脚本将直接就地在当前页面开始为 161 种家具批量拍照上传，Console 会实时打印进度。
   - **自定义视角（`USE_DEFAULT_CAMERA = false`）**：页面会**自动刷新重载**一次以记录视角。在重载完成后，**必须再次在 Console 中粘贴执行一遍该脚本**。
4. 截图流程结束后，场景数据、编辑视角和相机参数均会自动复原。

### 步骤四：关闭后台服务与重新编译打包
1. 截图任务全部结束后，按 `Ctrl + C` 关闭跑在 3001 端口的 `image_saver.js` 后台服务。
2. 在终端执行项目打包命令，以更新静态资源并分发最新落盘的家具图片：
   ```bash
   npm run build
   ```
