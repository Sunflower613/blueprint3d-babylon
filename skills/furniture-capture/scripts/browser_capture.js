/**
 * 3D 建筑设计编辑器 - 全自动家具微距截图控制台注入脚本
 * 
 * 职责：
 * 1. 使用内置的最佳 3D 视角相机位置（alpha、beta、target）进行截图。
 * 2. 隐藏 3D 网格和编辑手柄以确保图片纯净无污染。
 * 3. 调低近裁剪面（minZ）和相机的 lowerRadiusLimit 避免小化妆品及桌摆绿植等极小家具在特写时被近平面裁剪过滤。
 * 4. 逐个从原点加载家具，利用 150ms 延时强制推进大家具的世界矩阵重绘与模型渲染稳定，最后执行拍照。
 * 5. 将 Base64 截图提交给 3001 端口 of 接收后台保存落盘，并在全部完成后完美还原用户原本场景。
 */
(async () => {
  // 过滤截图的分类（数组形式）
  // 匹配规则：若包含 'all' 则为全部；若匹配到 category（如 'seating'）则拍摄该目录；若匹配到 type 或 name 则拍摄该具体家具
  const CAPTURE_CATEGORIES = ['all'];

  // 内置的默认最佳 3D 视角数据（旋转 180 度以纠正视角至对面正面）
  const DEFAULT_CAMERA = {
    alpha: -1.0471975511965976 + Math.PI,
    beta: 1.0471975511965976,
    target: [0, 0, -2.2]
  };

  console.log("使用脚本内置的默认 3D 视角进行截图...");

  const { FURNITURE_LIST, testMap, viewer3d, scene, camera, engine, refresh3DGrid, editHandleNodes, entityManager, BABYLON } = await import('./app.js');

  // 强行挂载全局变量以防止任何可能隐藏在模型 build 里的隐式 scene 引用报错
  window.scene = scene;

  console.log("开始重新高清晰微距截图（含 150ms 延迟防白屏）...");

  // 1. 备份当前的场景数据
  const backupData = testMap.exportJSON();

  // 2. 强行隐藏 3D 网格（避免重绘导致重新画出）
  const originalGridState = viewer3d.show3DGrid;
  viewer3d.show3DGrid = false; // 强行关闭自动重绘网格
  viewer3d.clear3DGrid();

  // 3. 隐藏所有的编辑手柄 meshes 并保存状态
  const hiddenNodes = [];
  scene.meshes.forEach((mesh) => {
    if (mesh && (mesh.metadata?.blueprintEditHandle || mesh.name.includes("Handle")) && mesh.isEnabled()) {
      mesh.setEnabled(false);
      hiddenNodes.push(mesh);
    }
  });

  // 4. 设置相机防裁剪面限制
  const originalCameraTarget = camera.target.clone();
  const originalCameraRadius = camera.radius;
  const originalCameraAlpha = camera.alpha;
  const originalCameraBeta = camera.beta;
  const originalCameraLowerRadiusLimit = camera.lowerRadiusLimit;
  const originalCameraMinZ = camera.minZ;

  // 核心优化：调低限制以支持极近视距的渲染，根绝小物体由于焦距过近而被近裁剪面裁去的问题
  camera.lowerRadiusLimit = 0.01;
  camera.minZ = 0.005; 

  // 5. 通过备份数据结构动态清空实体来构建完全兼容 of 空场景
  const emptyScene = JSON.parse(JSON.stringify(backupData));
  
  // 5.1 清空单层稳态结构的顶层实体
  emptyScene.walls = [];
  emptyScene.rooms = [];
  emptyScene.items = [];
  emptyScene.openings = [];
  emptyScene.roofs = [];
  emptyScene.stairs = [];
  emptyScene.fences = [];
  emptyScene.gates = [];
  
  // 5.2 彻底清空单层结构下的 floor 实体 (解决地板和墙体残留的关键)
  if (emptyScene.floor) {
    emptyScene.floor.walls = [];
    emptyScene.floor.rooms = [];
    emptyScene.floor.items = [];
    emptyScene.floor.openings = [];
    emptyScene.floor.roofs = [];
    emptyScene.floor.stairs = [];
    emptyScene.floor.fences = [];
    emptyScene.floor.gates = [];
  }
  
  // 5.3 清空多层结构的各层实体
  if (emptyScene.floors) {
    const clearFloor = (floor) => {
      floor.walls = [];
      floor.rooms = [];
      floor.items = [];
      floor.openings = [];
      floor.roofs = [];
      floor.stairs = [];
      floor.fences = [];
      floor.gates = [];
    };
    if (Array.isArray(emptyScene.floors)) {
      emptyScene.floors.forEach(clearFloor);
    } else {
      for (const floorId in emptyScene.floors) {
        clearFloor(emptyScene.floors[floorId]);
      }
    }
  }

  // 6. 根据新的数组匹配规则筛选需要拍照的家具列表
  const itemsToCapture = CAPTURE_CATEGORIES.includes('all')
    ? FURNITURE_LIST
    : FURNITURE_LIST.filter(def => 
        CAPTURE_CATEGORIES.includes(def.category) || 
        CAPTURE_CATEGORIES.includes(def.type) || 
        CAPTURE_CATEGORIES.includes(def.name)
      );

  console.log(`符合筛选条件的待拍照家具数量: ${itemsToCapture.length}`);

  for (const def of itemsToCapture) {
    console.log(`正在截图: ${def.name} (${def.type})`);
    
    // 加载空场景并强行清网格
    testMap.loadJSON(emptyScene);
    viewer3d.clear3DGrid();
    
    // 自动检测是否被切回了 2D 视图，如果是则点击切回 3D 并等待稳定
    const stage = document.getElementById('stage');
    const viewToggleBtn = document.getElementById('btn-view-toggle');
    if (stage && stage.dataset.view !== '3d' && viewToggleBtn) {
      viewToggleBtn.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 直接使用 testMap.addItem，避开 selectItem 高亮选中机制
    const item = testMap.addItem({
      type: def.type,
      x: 0,
      z: 0,
      y: 0,
      rotation: 0,
      scale: 1
    });
    
    if (!item) continue;

    const node = testMap.itemNodes.get(item.id);
    if (!node) continue;

    node.computeWorldMatrix(true);
    const bounds = node.getHierarchyBoundingVectors(true);
    const min = bounds.min;
    const max = bounds.max;
    const size = max.subtract(min);
    const center = min.add(max).scale(0.5);
    let maxDim = Math.max(size.x, size.y, size.z);
    if (isNaN(maxDim) || maxDim <= 0) {
      maxDim = 0.1;
    }

    // 强力保险：找出属于当前放置家具的所有子 meshes，然后临时隐藏 scene 中所有其他的 meshes
    const furnitureMeshes = new Set();
    node.getChildMeshes(false).forEach(m => furnitureMeshes.add(m));
    furnitureMeshes.add(node);

    const tempHiddenNodes = [];
    scene.meshes.forEach((mesh) => {
      if (mesh && mesh.isEnabled() && !furnitureMeshes.has(mesh)) {
        mesh.setEnabled(false);
        tempHiddenNodes.push(mesh);
      }
    });

    // 对准中心并依据尺寸缩近焦距，同时保持最佳的 alpha/beta 偏角
    camera.target = center;
    camera.alpha = DEFAULT_CAMERA.alpha;
    camera.beta = DEFAULT_CAMERA.beta;
    camera.radius = Math.max(0.18, maxDim * 2.3);

    // 强迫更新相机的视图矩阵，确保在渲染及截图前属性修改立即生效
    camera.getViewMatrix(true);

    // 强迫更新渲染
    scene.render();

    // 等待 150 毫秒，保证复杂大家具完全加载重绘和渲染稳定
    await new Promise(resolve => setTimeout(resolve, 150));

    scene.render();

    // 截图并上传
    try {
      const dataUrl = await BABYLON.Tools.CreateScreenshotAsync(engine, camera, { precision: 1 });
      const response = await fetch('http://localhost:3001/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: def.type, image: dataUrl })
      });
      await response.json();
    } catch (err) {
      console.error(`Error capturing ${def.name}:`, err);
    } finally {
      // 拍照完毕后，立即恢复临时隐藏的所有其他 meshes，以便下一步 loadJSON 清理
      tempHiddenNodes.forEach((mesh) => {
        if (mesh && !mesh.isDisposed()) {
          mesh.setEnabled(true);
        }
      });
    }
  }

  // 7. 还原现场
  console.log("截图全部结束，开始恢复场景与相机...");
  testMap.loadJSON(backupData);

  camera.target = originalCameraTarget;
  camera.radius = originalCameraRadius;
  camera.alpha = DEFAULT_CAMERA.alpha;
  camera.beta = DEFAULT_CAMERA.beta;
  camera.lowerRadiusLimit = originalCameraLowerRadiusLimit;
  camera.minZ = originalCameraMinZ;

  hiddenNodes.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      mesh.setEnabled(true);
    }
  });

  viewer3d.show3DGrid = originalGridState;
  if (originalGridState) {
    refresh3DGrid();
  }

  scene.render();
  console.log("✓ 用户场景已成功复位！");
})();
