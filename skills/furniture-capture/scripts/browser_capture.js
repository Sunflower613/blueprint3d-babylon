/**
 * 3D 建筑设计编辑器 - 全自动家具微距截图控制台注入脚本
 * 
 * 职责：
 * 1. 自动暂存并读取用户手动在浏览器调整的最佳 3D 视角相机位置（alpha、beta、target）。
 * 2. 隐藏 3D 网格和编辑手柄以确保图片纯净无污染。
 * 3. 调低近裁剪面（minZ）和相机的 lowerRadiusLimit 避免小化妆品及桌摆绿植等极小家具在特写时被近平面裁剪过滤。
 * 4. 逐个从原点加载 161 种家具，利用 150ms 延时强制推进大家具的世界矩阵重绘与模型渲染稳定，最后执行拍照。
 * 5. 将 Base64 截图提交给 3001 端口的接收后台保存落盘，并在全部完成后完美还原用户原本场景。
 */
(async () => {
  // 如果这是刷新后启动：
  const savedCamStr = sessionStorage.getItem('temp_capture_camera');
  if (!savedCamStr) {
    // 刷新前：记录用户最新调整的视角并刷新
    const { camera } = await import('./app.js');
    sessionStorage.setItem('temp_capture_camera', JSON.stringify({
      alpha: camera.alpha,
      beta: camera.beta,
      target: [camera.target.x, camera.target.y, camera.target.z]
    }));
    console.log("已备份用户调好的最新视角，正在刷新页面加载新代码并断开 HMR...");
    
    location.reload();
    return;
  }

  // 刷新后执行：
  const savedCam = JSON.parse(savedCamStr);
  sessionStorage.removeItem('temp_capture_camera'); // 用完即删

  const { FURNITURE_LIST, testMap, viewer3d, scene, camera, engine, refresh3DGrid, editHandleNodes, entityManager, BABYLON } = await import('./app.js');

  console.log("已恢复用户最新调好的视角，开始重新高清晰微距截图（含 150ms 延迟防白屏）...");

  // 1. 备份当前的场景数据
  const backupData = testMap.exportJSON();

  // 2. 隐藏 3D 网格和编辑手柄
  const originalGridState = viewer3d.show3DGrid;
  if (originalGridState) {
    viewer3d.clear3DGrid();
  }

  // 隐藏所有的手柄 meshes
  const hiddenNodes = [];
  scene.meshes.forEach((mesh) => {
    if (mesh && (mesh.metadata?.blueprintEditHandle || mesh.name.includes("Handle")) && mesh.isEnabled()) {
      mesh.setEnabled(false);
      hiddenNodes.push(mesh);
    }
  });

  // 3. 设置相机防裁剪
  const originalCameraTarget = camera.target.clone();
  const originalCameraRadius = camera.radius;
  const originalCameraAlpha = camera.alpha;
  const originalCameraBeta = camera.beta;
  const originalCameraLowerRadiusLimit = camera.lowerRadiusLimit;
  const originalCameraMinZ = camera.minZ;

  // 核心优化：调低限制以支持极近视距的渲染，根绝小物体由于焦距过近而被近裁剪面裁去的问题
  camera.lowerRadiusLimit = 0.01;
  camera.minZ = 0.005; 

  // 4. 通过备份数据结构动态清空实体来构建完全兼容的空场景
  const emptyScene = JSON.parse(JSON.stringify(backupData));
  if (emptyScene.floors) {
    const clearFloor = (floor) => {
      floor.walls = [];
      floor.rooms = [];
      floor.items = [];
      floor.openings = [];
      floor.roofs = [];
      floor.stairs = [];
      floor.fences = [];
    };
    if (Array.isArray(emptyScene.floors)) {
      emptyScene.floors.forEach(clearFloor);
    } else {
      for (const floorId in emptyScene.floors) {
        clearFloor(emptyScene.floors[floorId]);
      }
    }
  }

  // 5. 遍历并拍照
  for (const def of FURNITURE_LIST) {
    console.log(`正在截图: ${def.name} (${def.type})`);
    
    testMap.loadJSON(emptyScene);
    
    // 自动检测是否被切回了 2D 视图，如果是在 2D 状态，则点击切回 3D 并等待稳定
    const stage = document.getElementById('stage');
    const viewToggleBtn = document.getElementById('btn-view-toggle');
    if (stage && stage.dataset.view !== '3d' && viewToggleBtn) {
      viewToggleBtn.click();
      await new Promise(resolve => setTimeout(resolve, 300)); // 等待 3D 引擎与 UI 切换就绪
    }
    
    // 直接使用 testMap.addItem，避开 entityManager 的 selectItem 高亮选中机制（防蓝色描边）
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
      maxDim = 0.1; // 安全尺寸防护，避免极小家具或异常计算导致 NaN 崩溃
    }

    // 对准中心并依据尺寸缩近焦距，同时保持用户调整好的 alpha/beta 偏角
    camera.target = center;
    camera.alpha = savedCam.alpha;
    camera.beta = savedCam.beta;
    camera.radius = Math.max(0.18, maxDim * 2.3);

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
    }
  }

  // 6. 还原现场
  console.log("截图全部结束，开始恢复场景与相机...");
  testMap.loadJSON(backupData);

  camera.target = originalCameraTarget;
  camera.radius = originalCameraRadius;
  camera.alpha = savedCam.alpha;
  camera.beta = savedCam.beta;
  camera.lowerRadiusLimit = originalCameraLowerRadiusLimit;
  camera.minZ = originalCameraMinZ;

  hiddenNodes.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      mesh.setEnabled(true);
    }
  });
  if (originalGridState) {
    refresh3DGrid();
  }

  scene.render();
  console.log("✓ 用户场景已成功复位！");
})();
