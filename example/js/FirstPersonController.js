import { pointInRoom, Ray } from '../../src/index.js';

// 使用向下射线探测贴地高度以支持上下楼梯与抬高地板
function getGroundYByRaycast(Context, x, z, currentY, isGrounded = true) {
  const scene = Context.scene;
  const BABYLON = Context.BABYLON || window.BABYLON;
  
  // 处于空中下坠时探测深度拉长到 15.0 米，保证半空跨度中也能打中一楼地面/泳池
  const rayLength = isGrounded ? 2.5 : 15.0;
  const origin = new BABYLON.Vector3(x, currentY + 0.5, z);
  const direction = new BABYLON.Vector3(0, -1, 0);
  const ray = new Ray(origin, direction, rayLength);

  const hit = scene.pickWithRay(ray, (mesh) => {
    if (puppetItemId && (mesh.name.includes(puppetItemId) || mesh.id.includes(puppetItemId))) return false;
    if (mesh.name === 'skyBox' || mesh.name === 'grassLawn' || mesh.name.startsWith('floor_grid_3d')) return false;
    return mesh.isPickable;
  });

  if (hit && hit.hit && hit.pickedPoint) {
    return hit.pickedPoint.y;
  }
  
  // 降级回退
  return getPuppetFloorY(Context, x, z);
}

// 根据木偶的 Y 轴高度来推断其目前位于的楼层 ID
function getFloorIdByHeight(Context, y) {
  const floors = Context.testMap.getFloors();
  if (floors.length <= 1) return Context.testMap.getCurrentFloorId();

  // 按照 Elevation 从低到高排序
  const sorted = [...floors].sort((a, b) => {
    const elevA = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(a.id) : 0;
    const elevB = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(b.id) : 0;
    return elevA - elevB;
  });

  // 寻找绝对高度差最小的楼层，作为木偶当前所处的对应楼层
  let bestFloor = sorted[0];
  let minDiff = Infinity;
  for (const floor of sorted) {
    const elev = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(floor.id) : 0;
    const diff = Math.abs(y - elev);
    if (diff < minDiff) {
      minDiff = diff;
      bestFloor = floor;
    }
  }
  return bestFloor.id;
}


// 全局状态变量
let isInitialized = false;
let puppetItemId = null;
let puppetNode = null;
let keys = {};
let prevCameraState = null;
let prevGridState = true;
let prevLeftPanelState = false;
let prevRightPanelState = false;
let beforeRenderObserver = null;
let isTemporaryPuppet = true;

// 物理状态
let velocityY = 0;
const gravity = 15; // 抛物线下落重力
let isGrounded = true;
let spawnX = 0;
let spawnY = 0;
let spawnZ = 0;

// 视角控制变量
let isRotating = false;
let pointerId = null;
let lastPointerX = 0;
let lastPointerY = 0;

// 移动端摇杆状态
let joystickActive = false;
let joystickPointerId = null;
let joystickX = 0; // -1.0 到 1.0
let joystickY = 0; // -1.0 到 1.0
let joystickCenterX = 0;
let joystickCenterY = 0;

// 动态创建并插入 CSS 样式
function injectStyles() {
  if (document.getElementById('fp-controller-styles')) return;
  const style = document.createElement('style');
  style.id = 'fp-controller-styles';
  style.textContent = `
    /* 移动端控制容器 */
    .fp-touch-overlay {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 40px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .fp-joystick-zone {
      width: 160px;
      height: 160px;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: auto;
      touch-action: none;
    }

    .fp-joystick-base {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 2px 5px rgba(255,255,255,0.1);
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .fp-joystick-handle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      position: absolute;
      touch-action: none;
    }

    .fp-action-zone {
      display: flex;
      flex-direction: column;
      gap: 20px;
      pointer-events: auto;
    }

    .fp-action-btn {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
      gap: 4px;
    }

    .fp-action-btn:active {
      background: rgba(255, 255, 255, 0.35);
      transform: scale(0.92);
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.3);
    }

    .fp-action-btn svg {
      width: 24px;
      height: 24px;
      stroke: currentColor;
    }

    /* 浮空卡片交互提示 */
    .fp-hud-container {
      position: absolute;
      left: 50%;
      bottom: 12%;
      transform: translateX(-50%);
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .fp-toast-card {
      background: rgba(20, 24, 33, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
      border-radius: 12px;
      padding: 12px 24px;
      color: #00e5ff;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fp-toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      letter-spacing: 0.5px;
    }

    @keyframes fp-toast-in {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* 按钮激活状态 */
    #btn-first-person.active {
      background-color: rgba(23, 32, 51, 0.08);
      color: #172033;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
}

// 弹出浮空交互卡片
function showInteractToast(text) {
  let container = document.getElementById('fp-hud-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'fp-hud-container';
    container.className = 'fp-hud-container';
    document.body.appendChild(container);
  }

  // 清除旧气泡
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = 'fp-toast-card';
  // toast.innerHTML = `
  //   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;">
  //     <circle cx="12" cy="12" r="10"/><path d="m10 15 5-5-5-5"/>
  //   </svg>
  //   <span>${text}</span>
  // `;
    toast.innerHTML = `
    <span>${text}</span>
  `;
  container.appendChild(toast);

  // 3秒后淡出销毁
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s, transform 0.5s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px) scale(0.95)';
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

// 获取最后一个房间的地板中心点
function getSpawnPosition(Context) {
  const rooms = Context.testMap.getCurrentFloorEntities('room');
  let spawnX = 0;
  let spawnZ = 0;
  let floorY = 0;
  
  const currentFloorId = Context.testMap.getCurrentFloorId();
  const floorElevation = Context.testMap.getFloorElevation?.(currentFloorId) || 0;

  if (rooms && rooms.length > 0) {
    const lastRoom = rooms[rooms.length - 1];
    spawnX = lastRoom.x;
    spawnZ = lastRoom.z;
    floorY = floorElevation + (lastRoom.elevation || 0);
  } else {
    // 默认在原点
    spawnX = 0;
    spawnZ = 0;
    floorY = floorElevation;
  }
  return { x: spawnX, y: floorY, z: spawnZ };
}

// 获取木偶当前的地面高度（根据点是否在房间内）
function getPuppetFloorY(Context, x, z) {
  const floorId = Context.testMap.getCurrentFloorId();
  const rooms = Context.testMap.getCurrentFloorEntities('room');
  const floorElevation = Context.testMap.getFloorElevation?.(floorId) || 0;

  for (const room of rooms) {
    if (room.floorId === floorId && pointInRoom(room, x, z)) {
      return floorElevation + (room.elevation || 0);
    }
  }
  
  // 若不在当前层的任何房间内，说明身处阳台边缘或室外悬空
  // 若当前楼层非最底层，将落脚高度重置为最底层（一楼）的海拔以令其能够顺畅坠落至一楼地表/泳池
  const floors = Context.testMap.getFloors ? Context.testMap.getFloors() : [];
  if (floors.length > 1) {
    let minElev = floorElevation;
    for (const f of floors) {
      const fElev = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(f.id) : 0;
      if (fElev < minElev) {
        minElev = fElev;
      }
    }
    return minElev;
  }
  
  return floorElevation;
}

// 辅助方法：沿着祖先节点向上递归查找可交互实体（家具、门窗、栅栏门）并识别出其 ID 和类别
function findInteractionParent(mesh, puppetItemId) {
  let curr = mesh;
  while (curr) {
    // 排除自身木偶 Mesh
    if (puppetItemId && (curr.name.includes(puppetItemId) || curr.id?.includes(puppetItemId))) {
      return null;
    }
    if (curr.metadata?.blueprintItemId || curr.metadata?.itemId) {
      return { id: curr.metadata.blueprintItemId || curr.metadata.itemId, type: 'item', node: curr };
    }
    if (curr.metadata?.openingId) {
      return { id: curr.metadata.openingId, type: 'opening', node: curr };
    }
    if (curr.metadata?.gateId) {
      return { id: curr.metadata.gateId, type: 'fence_gate', node: curr };
    }
    if (curr.name) {
      if (curr.name.startsWith('item_')) {
        return { id: curr.name.replace('item_', ''), type: 'item', node: curr };
      }
      if (curr.name.startsWith('opening_')) {
        return { id: curr.name.replace('opening_', ''), type: 'opening', node: curr };
      }
      if (curr.name.startsWith('fence_gate_')) {
        return { id: curr.name.replace('fence_gate_', ''), type: 'fence_gate', node: curr };
      }
    }
    curr = curr.parent;
  }
  return null;
}

// 射线交互：可开关附近的门窗、家电与栅栏门 (限制实际物理交互距离在 2.5m 内)
function executeInteraction(Context) {
  // 如果当前已经处于坐着/躺下状态，点击交互直接站起来 (起立永远是第一优先级)
  const puppetItem = puppetItemId ? Context.testMap.getEntity('item', puppetItemId) : null;
  const currentPose = puppetItem?.pose || 'stand';
  if (currentPose !== 'stand') {
    checkStandUp(Context);
    return;
  }

  const scene = Context.scene;
  const canvas = Context.canvas;
  const BABYLON = Context.BABYLON || window.BABYLON;

  // 1. 利用 canvas 中点创建基础射线
  const ray = scene.createPickingRay(
    canvas.clientWidth / 2,
    canvas.clientHeight / 2,
    Context.BABYLON?.Matrix?.Identity() || window.BABYLON?.Matrix?.Identity(),
    Context.camera
  );

  // 2. 交互检测向前推 0.4 米：沿着相机视向平移起点，越过贴身障碍物或内部网格
  const forwardDir = Context.camera.getDirection(new BABYLON.Vector3(0, 0, 1));
  ray.origin.addInPlace(forwardDir.scale(0.4));

  // 3. 执行射线物理碰撞，筛选出可交互的门窗、家电与栅栏门 (通过向上追溯祖先判定)
  const hit = scene.pickWithRay(ray, (mesh) => {
    if (!mesh.isPickable) return false;
    const interInfo = findInteractionParent(mesh, puppetItemId);
    return !!interInfo;
  });

  if (hit && hit.pickedMesh) {
    const interInfo = findInteractionParent(hit.pickedMesh, puppetItemId);
    if (!interInfo) {
      showInteractToast("眼前没有可交互的家具或门窗");
      return;
    }

    // 限制物理交互距离，要求站在门窗家电的 2.5 米以内
    if (hit.distance > 2.5) {
      showInteractToast("距离太远了，走近一点再交互");
      return;
    }

    const { id, type, node: rootMesh } = interInfo;

    if (type === 'item' && id) {
      const item = Context.testMap.getEntity('item', id);
      if (item) {
        const def = Context.testMap.getFurnitureDefinition(item.type);
        const itemName = def ? def.name : item.type;

        // 判定是否是有点位的家具（如椅子、床等）
        const hasInteraction = def && def.interaction && typeof def.interaction.getInteractionPoints === 'function';

        // 如果家具被锁定了，且它不是可以交互坐下/躺下的椅子或床，则直接提示已锁定并亮红光警告，不执行任何操控
        if (item.locked && !hasInteraction) {
          showInteractToast(`${itemName}已锁定`);
          if (rootMesh) {
            const highlightMeshes = rootMesh.getChildMeshes ? rootMesh.getChildMeshes() : [rootMesh];
            highlightMeshes.forEach(m => {
              m.renderOutline = true;
              m.outlineColor = new (Context.BABYLON?.Color3 || window.BABYLON?.Color3)(1.0, 0.15, 0.15); // 警告红光
              m.outlineWidth = 0.035;
              setTimeout(() => {
                m.renderOutline = false;
              }, 1000);
            });
          }
          return;
        }
        
        // 区分家电和地毯等普通家具：是否是可开关设备 (灯具 category==='lighting'、家电 category==='appliances'、包含光源或带有 lightId)
        const isLighting = def && (def.category === 'lighting' || def.lightSource);
        const isAppliance = def && def.category === 'appliances';
        const isLightingEntity = !!item.lightId;
        const isSwitchable = !!(isLighting || isAppliance || isLightingEntity);

        // 区分水槽凹槽放水与马桶开合盖
        const isWaterContainer = def && (
          item.type.includes('sink') || 
          item.type.includes('bathtub') || 
          item.type.includes('washbasin') ||
          item.type.includes('faucet')
        );
        const isToilet = def && item.type.includes('toilet');

        if (isSwitchable) {
          if (Context.entityManager && typeof Context.entityManager.toggleItemPower === 'function') {
            Context.entityManager.toggleItemPower(id);
          }
          showInteractToast(`已开关：${itemName}`);
        } else if (isWaterContainer) {
          // 水槽、浴缸、洗脸台放水/排水开关
          if (Context.entityManager && typeof Context.entityManager.toggleItemWater === 'function') {
            Context.entityManager.toggleItemWater(id);
          }
          const isWaterOn = item.waterEnabled !== false;
          showInteractToast(isWaterOn ? `已关闭放水` : `已开启放水`);
        } else if (isToilet) {
          // 马桶开盖/合盖
          if (Context.entityManager && typeof Context.entityManager.toggleItemLid === 'function') {
            Context.entityManager.toggleItemLid(id);
          }
          const isLidOpen = item.lidOpen === true;
          showInteractToast(isLidOpen ? `已合上马桶盖` : `已打开马桶盖`);
        } else if (hasInteraction) {
          // 椅子、床等可坐下/躺下交互的家具：直接坐下/躺下
          interactSitOnSeat(Context, id);
        } else {
          // 普通地毯、桌子、绿植等：直接气泡显示物体名字，不触发无意义的开关
          showInteractToast(itemName);
        }
      }
    } else if (type === 'opening' && id) {
      const opening = Context.testMap.getEntity('opening', id);
      if (opening) {
        if (typeof Context.pushHistory === 'function') Context.pushHistory();
        Context.testMap.executeCommand('updateOpening', {
          openingId: id,
          patch: { isOpen: !opening.isOpen }
        });
        if (typeof Context.refreshShadows === 'function') Context.refreshShadows();
        if (typeof Context.renderPlan === 'function') Context.renderPlan();
        showInteractToast(opening.isOpen ? "已关闭门窗" : "已开启门窗");
      }
    } else if (type === 'fence_gate' && id) {
      const gate = Context.testMap.getEntity('fence_gate', id);
      if (gate) {
        if (typeof Context.pushHistory === 'function') Context.pushHistory();
        Context.testMap.executeCommand('updateFenceGate', {
          gateId: id,
          patch: { isOpen: !gate.isOpen }
        });
        if (typeof Context.refreshShadows === 'function') Context.refreshShadows();
        if (typeof Context.renderPlan === 'function') Context.renderPlan();
        showInteractToast(gate.isOpen ? "已关闭栅栏门" : "已开启栅栏门");
      }
    }

    // 交互发光/闪烁描边动画反馈
    if (rootMesh) {
      const highlightMeshes = rootMesh.getChildMeshes ? rootMesh.getChildMeshes() : [rootMesh];
      highlightMeshes.forEach(m => {
        m.renderOutline = true;
        m.outlineColor = new (Context.BABYLON?.Color3 || window.BABYLON?.Color3)(0.0, 0.9, 1.0);
        m.outlineWidth = 0.035;

        setTimeout(() => {
          m.renderOutline = false;
        }, 1000);
      });
    }
  } else {
    showInteractToast("眼前没有可交互的家具或门窗");
  }
}

// 进入第一人称
function enterFirstPerson(Context, targetPuppetId = null) {
  if (window.firstPersonActive) return;

  // 1. 强制切至 3D 视图
  if (Context.currentView !== '3d') {
    Context.setView('3d');
  }

  // 1.5. 取消任何家具的选中状态，避免高亮边框、小手柄和三维变换箭头冲突
  if (Context.selectItem) {
    Context.selectItem(null);
  }

  window.firstPersonActive = true;
  injectStyles();

  // 添加激活样式到按钮
  document.getElementById('btn-first-person')?.classList.add('active');

  const scene = Context.scene;
  const camera = Context.camera;

  // 2. 备份当前相机状态
  prevCameraState = {
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius,
    target: camera.target.clone()
  };

  // 3. 备份并修改侧栏与网格状态
  const leftPanel = document.querySelector('.left-panel');
  const rightPanel = document.getElementById('right-panel');
  const btnToggleLeft = document.getElementById('btn-toggle-left');
  const btnToggleRight = document.getElementById('btn-toggle-right');

  prevLeftPanelState = leftPanel ? leftPanel.classList.contains('collapsed') : false;
  prevRightPanelState = rightPanel ? rightPanel.classList.contains('collapsed') : false;
  prevGridState = Context.viewer3d.show3DGrid;

  // 折叠侧栏
  if (leftPanel && !leftPanel.classList.contains('collapsed')) {
    leftPanel.classList.add('collapsed');
    if (btnToggleLeft) btnToggleLeft.textContent = '>';
  }
  if (rightPanel && !rightPanel.classList.contains('collapsed')) {
    rightPanel.classList.add('collapsed');
    if (btnToggleRight) btnToggleRight.textContent = '<';
  }

  // 关闭网格
  Context.viewer3d.show3DGrid = false;
  Context.viewer3d.clear3DGrid();

  // 开启天空盒
  Context.viewer3d.setSkyboxEnabled(true);

  // 强制重调引擎大小以适应全屏
  setTimeout(() => Context.engine?.resize(), 300);

  // 4. 获取或创建木偶家具
  spawnX = 0;
  spawnZ = 0;

  if (targetPuppetId) {
    // 操控摆放在场景中的木偶家具，退出时不予删除
    puppetItemId = targetPuppetId;
    isTemporaryPuppet = false;

    const existingItem = Context.testMap.getEntity('item', targetPuppetId);
    if (existingItem) {
      // 若木偶处于坐姿或躺姿，操控时强制其重置为站立姿势并落地，以便行走移动
      if (existingItem.pose && existingItem.pose !== 'stand') {
        Context.testMap.executeCommand('updateItem', {
          itemId: targetPuppetId,
          patch: { pose: 'stand', elevation: 0 }
        });
      }
      
      const updatedItem = Context.testMap.getEntity('item', targetPuppetId);
      spawnX = updatedItem.x || 0;
      spawnZ = updatedItem.z || 0;
      spawnY = getPuppetFloorY(Context, spawnX, spawnZ);
    } else {
      spawnX = 0;
      spawnZ = 0;
      spawnY = 0;
    }
  } else {
    // 自动在最后一个房间中心创建临时木偶，退出时彻底删除
    isTemporaryPuppet = true;
    const spawn = getSpawnPosition(Context);
    spawnX = spawn.x;
    spawnZ = spawn.z;
    spawnY = spawn.y;

    const definition = Context.testMap.getFurnitureDefinition('mannequin');
    const INCHES_PER_UNIT = Context.INCHES_PER_UNIT || 39.3700787;
    
    // 通过 executeCommand 纯净添加，不触发 selectItem 高亮框
    const addedItem = Context.testMap.executeCommand('addItem', {
      type: 'mannequin',
      width: (definition?.defaultSize?.width || 14) / INCHES_PER_UNIT,
      depth: (definition?.defaultSize?.depth || 14) / INCHES_PER_UNIT,
      height: (definition?.defaultSize?.height || 68) / INCHES_PER_UNIT,
      x: spawnX,
      z: spawnZ,
      floorId: Context.testMap.getCurrentFloorId()
    });

    puppetItemId = addedItem.id;
  }

  // 挂载全局操控木偶 ID 与坐下、站起交互接口，方便右键菜单系统等跨组件安全调用
  window.firstPersonPuppetId = puppetItemId;
  window.firstPersonSitOnSeat = (seatItemId) => interactSitOnSeat(Context, seatItemId);
  window.firstPersonStandUp = () => checkStandUp(Context);

  puppetNode = null;

  // 轮询等待 3D 节点加载完成
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    puppetNode = scene.getTransformNodeByName(`item_${puppetItemId}`);
    if (puppetNode) {
      clearInterval(checkInterval);
      
      // 初始化木偶在三维中的实际位置
      puppetNode.position.set(spawnX, spawnY, spawnZ);
    }
    
    // 超时保护
    if (++checkCount > 100) {
      clearInterval(checkInterval);
      console.warn("未能在场景中找到木偶的3D节点");
    }
  }, 50);

  // 5. 设置相机为第一人称模式
  camera.detachControl(Context.canvas);
  camera.radius = 0.001; // 半径设为 0.001m（1毫米），使相机物理起点与 target 焦点完美重合，消除旋转时的左右横向平移偏移

  // 获得相机的初始水平朝向，并把眼睛（相机 target）放在面朝方向前置 0.18m 处避开头部穿模
  const camForward = camera.getDirection(new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(0, 0, 1));
  const initForward = new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(camForward.x, 0, camForward.z).normalize();
  camera.target.set(
    spawnX + initForward.x * 0.18, 
    spawnY + 1.6, 
    spawnZ + initForward.z * 0.18
  );

  // 6. 注册键盘输入监听
  keys = {};
  const onKeyDown = (e) => {
    // Esc 退出第一人称
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      exitFirstPerson(Context);
      return;
    }

    const key = e.key.toLowerCase();
    keys[key] = true;

    // 空格键跳跃
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      // 在起跳前如果坐着则自动起立站好
      checkStandUp(Context);
      if (isGrounded) {
        velocityY = 5.0; // 跳跃初速度
        isGrounded = false;
      }
    }

    // E键交互
    if (key === 'e') {
      e.preventDefault();
      executeInteraction(Context);
    }
  };
  const onKeyUp = (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window._fpKeyDown = onKeyDown;
  window._fpKeyUp = onKeyUp;

  // 7. 动态创建移动端触摸控制器 (适配触屏与PC模拟)
  createTouchControls(Context);

  // 8. 绑定画布拖拽改变视角监听
  const canvas = Context.canvas;
  const onPointerDown = (e) => {
    // 忽略左下角摇杆和动作按钮区域的拖拽
    const path = e.composedPath ? e.composedPath() : [];
    const isInteractiveEl = path.some(el => 
      el.id === 'fp-touch-overlay' || 
      (el.classList && (el.classList.contains('fp-joystick-zone') || el.classList.contains('fp-action-zone')))
    );
    if (isInteractiveEl) return;

    isRotating = true;
    pointerId = e.pointerId;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    
    try {
      canvas.setPointerCapture(pointerId);
    } catch (_err) {}
  };

  const onPointerMove = (e) => {
    if (!isRotating || e.pointerId !== pointerId) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    const sensitivity = 0.001;
    camera.alpha += dx * sensitivity;
    camera.beta += dy * sensitivity;
    // 限制俯仰角，防止倒立
    camera.beta = Math.max(0.1, Math.min(Math.PI - 0.1, camera.beta));
  };

  const onPointerUp = (e) => {
    if (e.pointerId === pointerId) {
      isRotating = false;
      try {
        canvas.releasePointerCapture(pointerId);
      } catch (_err) {}
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  window._fpPointerDown = onPointerDown;
  window._fpPointerMove = onPointerMove;
  window._fpPointerUp = onPointerUp;

  // 9. 挂载物理运动主渲染循环
  beforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    if (dt <= 0) return;

    // 如果木偶 3D 节点未捕获、或者已被场景销毁（因姿势/数据变更 updateItem 触发了重建），自动实时重新捕获它
    if (puppetItemId && (!puppetNode || puppetNode.isDisposed())) {
      puppetNode = scene.getTransformNodeByName(`item_${puppetItemId}`);
      if (puppetNode) {
        puppetNode.position.set(spawnX, spawnY, spawnZ);
      }
    }

    // 确保木偶节点可用后再平移
    let currentX = spawnX;
    let currentZ = spawnZ;
    let currentY = spawnY;

    if (puppetNode && !puppetNode.isDisposed()) {
      currentX = puppetNode.position.x;
      currentZ = puppetNode.position.z;
      currentY = puppetNode.position.y;
    }

    // 计算水平前方向量与右方向量
    const camForward = camera.getDirection(new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(0, 0, 1));
    const camRight = camera.getDirection(new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(1, 0, 0));

    const forward = new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(camForward.x, 0, camForward.z).normalize();
    const right = new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(camRight.x, 0, camRight.z).normalize();

    // 组合移动增量
    const moveDir = new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(0, 0, 0);
    if (keys['w'] || keys['arrowup']) moveDir.addInPlace(forward);
    if (keys['s'] || keys['arrowdown']) moveDir.subtractInPlace(forward);
    if (keys['d'] || keys['arrowright']) moveDir.addInPlace(right);
    if (keys['a'] || keys['arrowleft']) moveDir.subtractInPlace(right);

    // 叠加摇杆控制
    if (joystickActive && (joystickX !== 0 || joystickY !== 0)) {
      moveDir.addInPlace(right.scale(joystickX));
      moveDir.addInPlace(forward.scale(joystickY));
    }

     const speed = 2.5; // 水平行走速度 2.5m/s
    if (moveDir.length() > 0.001) {
      // 正在行走移动，若当前木偶处于坐姿或躺姿，自动起立站好
      checkStandUp(Context);

      moveDir.normalize();

      const nextX = currentX + moveDir.x * speed * dt;
      const nextZ = currentZ + moveDir.z * speed * dt;

      // 前向碰撞检测（防止穿墙和穿家具）
      const BABYLON = Context.BABYLON || window.BABYLON;
      // 从角色躯干中部（离地 0.8 米）朝移动方向发射探测射线
      const collOrigin = new BABYLON.Vector3(currentX, currentY + 0.8, currentZ);
      const collRay = new Ray(collOrigin, moveDir, 0.4); // 探测 0.4 米范围

      const collHit = scene.pickWithRay(collRay, (mesh) => {
        if (puppetItemId && (mesh.name.includes(puppetItemId) || mesh.id.includes(puppetItemId))) return false;
        if (mesh.name === 'skyBox' || mesh.name === 'grassLawn' || mesh.name.startsWith('floor_grid_3d')) return false;
        
        // 探测墙壁、家具、围栏和门窗
        return mesh.isPickable && (
          mesh.name.startsWith('wall_') || 
          mesh.name.startsWith('item_') ||
          mesh.name.startsWith('fence_') ||
          mesh.name.startsWith('opening_') ||
          mesh.parent?.name?.startsWith('wall_') ||
          mesh.parent?.name?.startsWith('item_') ||
          mesh.parent?.name?.startsWith('fence_') ||
          mesh.parent?.name?.startsWith('opening_')
        );
      });

      if (collHit && collHit.hit) {
        // 前方撞墙或家具，不更新水平位移，防止穿模
      } else {
        currentX = nextX;
        currentZ = nextZ;
      }

      // 旋转木偶躯干，使其面朝向走动方向
      if (puppetNode && !puppetNode.isDisposed()) {
        const targetPoint = puppetNode.position.add(forward);
        puppetNode.lookAt(targetPoint);
      }
    }

    // 采用高精度向下射线检测，获取当前位置实际的地板或楼梯面高度，将 isGrounded 传入以动态调整探针射线探测长度
    const targetFloorY = getGroundYByRaycast(Context, currentX, currentZ, currentY, isGrounded);

    // 处于地面，但如果当前实际高度比测得的地面高度高出 0.25 米以上，说明踩空了阳台/平台，开启重力下坠
    if (isGrounded && currentY - targetFloorY > 0.25) {
      isGrounded = false;
      velocityY = 0; // 踩空顺从重力加速度零初速下落
    }

    // 重力与跳跃高度模拟
    if (!isGrounded) {
      velocityY -= gravity * dt;
      currentY += velocityY * dt;

      if (currentY <= targetFloorY) {
        currentY = targetFloorY;
        velocityY = 0;
        isGrounded = true;
      }
    } else {
      // 处于地面，自动贴合实际地面高度 (平滑上下楼梯与地板过渡)
      currentY = currentY * 0.8 + targetFloorY * 0.2;
      if (Math.abs(currentY - targetFloorY) < 0.005) {
        currentY = targetFloorY;
      }
    }

    // 写入最新位置到 3D 渲染节点，并同步写回全局变量，防止开关家电触发全局重绘时木偶瞬移回起点
    if (puppetNode && !puppetNode.isDisposed()) {
      puppetNode.position.set(currentX, currentY, currentZ);
    }
    spawnX = currentX;
    spawnY = currentY;
    spawnZ = currentZ;

    // 动态获取木偶头部 Mesh 真实的物理 Y 轴绝对坐标作为相机眼高；若未渲染完则安全降级估算
    let absoluteEyeY = currentY + 1.6;
    if (puppetItemId) {
      const headMesh = scene.getMeshByName(`puppet_head_${puppetItemId}`);
      if (headMesh) {
        absoluteEyeY = headMesh.getAbsolutePosition().y;
      } else {
        const puppetItem = Context.testMap.getEntity('item', puppetItemId);
        const currentPose = puppetItem?.pose || 'stand';
        let eyeHeight = 1.6;
        if (currentPose === 'sit') {
          eyeHeight = 0.75;
        } else if (currentPose === 'lie') {
          eyeHeight = 0.15;
        }
        absoluteEyeY = currentY + eyeHeight;
      }
    }

    // 将相机眼睛同步绑定在木偶头部实际物理坐标并稍微前置，避开头部穿模
    // 允许 Y 轴随前向分量 forward.y 变化，以保持在抬头或低头时视线的正确解算投影
    camera.target.set(
      currentX + forward.x * 0.18, 
      absoluteEyeY + forward.y * 0.18, 
      currentZ + forward.z * 0.18
    );

    // 自动检测并切换楼层，点亮该楼层的所有灯光、音响、动画与反射渲染
    const detectedFloorId = getFloorIdByHeight(Context, currentY);
    if (detectedFloorId && detectedFloorId !== Context.testMap.getCurrentFloorId()) {
      Context.testMap.setCurrentFloor(detectedFloorId);
      
      // 执行系统统一的楼层更新与渲染链条
      if (typeof Context.syncFloorControls === 'function') Context.syncFloorControls();
      if (typeof Context.updateSkyboxFromCurrentFloor === 'function') Context.updateSkyboxFromCurrentFloor();
      if (typeof Context.refreshShadows === 'function') Context.refreshShadows();
      if (typeof Context.updateEditor === 'function') Context.updateEditor();
      if (typeof Context.renderPlan === 'function') Context.renderPlan();
      
      // 主动触发反射的重绘更新，确保反射源同步
      if (Context.testMap && typeof Context.testMap.requestReflectionUpdate === 'function') {
        Context.testMap.requestReflectionUpdate();
      }
    }
  });

  // 强制全量重绘三维场景，使全部高低楼层 Mesh 突破过滤完全显现
  if (Context.testMap && typeof Context.testMap.refreshRendering === 'function') {
    Context.testMap.refreshRendering();
  }

  showInteractToast("已进入第一人称模式 (F11退出)");
}

// 退出第一人称
function exitFirstPerson(Context) {
  if (!window.firstPersonActive) return;
  window.firstPersonActive = false;
  window.firstPersonPuppetId = null;
  window.firstPersonSitOnSeat = null;
  window.firstPersonStandUp = null;

  // 恢复按钮样式
  document.getElementById('btn-first-person')?.classList.remove('active');

  const scene = Context.scene;
  const camera = Context.camera;

  // 1. 还原物理渲染循环
  if (beforeRenderObserver) {
    scene.onBeforeRenderObservable.remove(beforeRenderObserver);
    beforeRenderObserver = null;
  }

  // 2. 解除事件绑定
  window.removeEventListener('keydown', window._fpKeyDown);
  window.removeEventListener('keyup', window._fpKeyUp);
  
  const canvas = Context.canvas;
  canvas.removeEventListener('pointerdown', window._fpPointerDown);
  canvas.removeEventListener('pointermove', window._fpPointerMove);
  canvas.removeEventListener('pointerup', window._fpPointerUp);
  canvas.removeEventListener('pointercancel', window._fpPointerUp);

  // 3. 销毁移动端 DOM
  document.getElementById('fp-touch-overlay')?.remove();
  document.getElementById('fp-hud-container')?.remove();

  // 4. 同步木偶最新 3D 位置回数据层，然后恢复显示并销毁
  if (puppetItemId) {
    let finalX = 0;
    let finalZ = 0;

    if (puppetNode) {
      finalX = puppetNode.position.x;
      finalZ = puppetNode.position.z;

      // 还原木偶可见度
      puppetNode.getChildMeshes().forEach(m => {
        if (m.metadata && m.metadata.prevVisibility !== undefined) {
          m.visibility = m.metadata.prevVisibility;
        } else {
          m.visibility = 1;
        }
      });
    }

    // 区分临时创建的木偶与摆放的木偶
    if (isTemporaryPuppet) {
      // 自动生成的临时木偶，在退出时彻底销毁删除
      Context.testMap.executeCommand('deleteItem', {
        itemId: puppetItemId
      });
    } else {
      // 场景中本来就有的木偶家具，同步其行走后的最终位置，不予删除
      Context.testMap.executeCommand('updateItem', {
        itemId: puppetItemId,
        patch: { x: finalX, z: finalZ }
      });
    }
    
    puppetItemId = null;
    puppetNode = null;
  }

  // 5. 还原原相机姿态
  if (prevCameraState) {
    camera.radius = prevCameraState.radius;
    camera.alpha = prevCameraState.alpha;
    camera.beta = prevCameraState.beta;
    camera.target.copyFrom(prevCameraState.target);
  }
  camera.attachControl(canvas, true, false, 1);

  // 6. 还原侧栏与 3D 辅助网格
  const leftPanel = document.querySelector('.left-panel');
  const rightPanel = document.getElementById('right-panel');
  const btnToggleLeft = document.getElementById('btn-toggle-left');
  const btnToggleRight = document.getElementById('btn-toggle-right');

  if (leftPanel && !prevLeftPanelState) {
    leftPanel.classList.remove('collapsed');
    if (btnToggleLeft) btnToggleLeft.textContent = '‹';
  }
  if (rightPanel && !prevRightPanelState) {
    rightPanel.classList.remove('collapsed');
    if (btnToggleRight) btnToggleRight.textContent = '›';
  }

  Context.viewer3d.show3DGrid = prevGridState;
  if (prevGridState) {
    Context.refresh3DGrid();
  }

  // 从当前层状态还原天空盒
  Context.updateSkyboxFromCurrentFloor();

  // 强制全量重绘三维场景，使超出当前楼层的 meshes 重新隐藏，恢复编辑器的分层隔离编辑模式
  if (Context.testMap && typeof Context.testMap.refreshRendering === 'function') {
    Context.testMap.refreshRendering();
  }

  // 重置视口
  setTimeout(() => Context.engine?.resize(), 300);

  showInteractToast("已退出第一人称模式");
}

// 开关第一人称
export function toggleFirstPerson(Context, targetPuppetId = null) {
  const ctx = Context || window.Context;
  if (window.firstPersonActive) {
    exitFirstPerson(ctx);
  } else {
    enterFirstPerson(ctx, targetPuppetId);
  }
}

// 创建移动端虚拟摇杆和动作按钮
function createTouchControls(Context) {
  // 如果已存在，先移除
  document.getElementById('fp-touch-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fp-touch-overlay';
  overlay.className = 'fp-touch-overlay';

  overlay.innerHTML = `
    <!-- 左下角摇杆 -->
    <div class="fp-joystick-zone" id="fp-joystick-zone">
      <div class="fp-joystick-base" id="fp-joystick-base">
        <div class="fp-joystick-handle" id="fp-joystick-handle"></div>
      </div>
    </div>
    <!-- 右下角动作键 -->
    <div class="fp-action-zone">
      <button class="fp-action-btn interact-btn" id="fp-btn-interact" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
        </svg>
        <span>交互</span>
      </button>
      <button class="fp-action-btn jump-btn" id="fp-btn-jump" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
        <span>跳跃</span>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // 绑定虚拟摇杆的手势 (Pointer Events 自动适配 PC/移动端)
  const baseEl = document.getElementById('fp-joystick-base');
  const handleEl = document.getElementById('fp-joystick-handle');
  const maxDistance = 40; // 摇杆最大偏移像素

  const onJoystickDown = (e) => {
    e.stopPropagation();
    joystickActive = true;
    joystickPointerId = e.pointerId;

    const rect = baseEl.getBoundingClientRect();
    joystickCenterX = rect.left + rect.width / 2;
    joystickCenterY = rect.top + rect.height / 2;

    try {
      baseEl.setPointerCapture(joystickPointerId);
    } catch (_err) {}
  };

  const onJoystickMove = (e) => {
    if (!joystickActive || e.pointerId !== joystickPointerId) return;
    e.stopPropagation();

    const dx = e.clientX - joystickCenterX;
    const dy = e.clientY - joystickCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let finalX = dx;
    let finalY = dy;

    if (distance > maxDistance) {
      finalX = (dx / distance) * maxDistance;
      finalY = (dy / distance) * maxDistance;
    }

    handleEl.style.transform = `translate(${finalX}px, ${finalY}px)`;

    // 映射到 -1.0 ~ 1.0 的移动矢量 (在水平面上，前是 -y，右是 x)
    joystickX = finalX / maxDistance;
    joystickY = -finalY / maxDistance;
  };

  const onJoystickUp = (e) => {
    if (e.pointerId === joystickPointerId) {
      joystickActive = false;
      joystickX = 0;
      joystickY = 0;
      handleEl.style.transform = 'translate(0px, 0px)';
      try {
        baseEl.releasePointerCapture(joystickPointerId);
      } catch (_err) {}
    }
  };

  baseEl.addEventListener('pointerdown', onJoystickDown);
  baseEl.addEventListener('pointermove', onJoystickMove);
  baseEl.addEventListener('pointerup', onJoystickUp);
  baseEl.addEventListener('pointercancel', onJoystickUp);

  // 绑定跳跃与交互按钮
  document.getElementById('fp-btn-jump').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    checkStandUp(Context);
    if (isGrounded) {
      velocityY = 5.0;
      isGrounded = false;
    }
  });

  document.getElementById('fp-btn-interact').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    executeInteraction(Context);
  });
}

// 辅助方法：计算物品在米制单位下的实际尺寸
const INCHES_PER_UNIT = 39.3700787;
function getItemSizeInMetres(item, definition) {
  if (!definition) return { width: 0, depth: 0, height: 0 };
  const scale = Number(item.scale || 1);
  const isMeter = definition.unit === 'm';
  const defW = isMeter ? definition.defaultSize.width : definition.defaultSize.width / INCHES_PER_UNIT;
  const defD = isMeter ? definition.defaultSize.depth : definition.defaultSize.depth / INCHES_PER_UNIT;
  const defH = isMeter ? definition.defaultSize.height : definition.defaultSize.height / INCHES_PER_UNIT;
  
  return {
    width: (item.width !== undefined ? item.width : defW) * scale,
    depth: (item.depth !== undefined ? item.depth : defD) * scale,
    height: (item.height !== undefined ? item.height : defH) * scale
  };
}

// 让木偶直接坐下或躺在指定的家具椅子/床上，并相应下调第一人称相机视点高度
function interactSitOnSeat(Context, seatItemId) {
  if (!window.firstPersonActive || !puppetItemId) return;

  const seatItem = Context.testMap.getEntity('item', seatItemId);
  if (!seatItem) return;

  const definition = Context.testMap.getFurnitureDefinition(seatItem.type);
  if (!definition || !definition.interaction) return;

  const interactionType = definition.interaction.type || 'sit';
  const otherSize = getItemSizeInMetres(seatItem, definition);
  const localPoints = typeof definition.interaction.getInteractionPoints === 'function'
    ? definition.interaction.getInteractionPoints(otherSize)
    : null;

  if (!localPoints || !localPoints.length) return;

  // 使用第一个可用交互点
  const p = localPoints[0];
  const cos = Math.cos(seatItem.rotation || 0);
  const sin = Math.sin(seatItem.rotation || 0);
  const wx = seatItem.x + p.x * cos + p.z * sin;
  const wz = seatItem.z - p.x * sin + p.z * cos;
  const wy = (seatItem.elevation || 0) + p.y;
  
  // 获取床/椅子所在楼层的海拔高度，计算木偶的绝对物理世界高度，防止高层躺下时掉落至一楼
  const floorElevation = Context.testMap.getFloorElevation?.(seatItem.floorId) || 0;
  const absoluteWy = wy + floorElevation;

  // 1. 取消任何选中以移除坐标轴与光圈
  if (typeof Context.selectItem === 'function') {
    Context.selectItem(null);
  }

  // 2. 将数据层的木偶属性更新为对应的姿势、位置与同步的楼层ID
  Context.testMap.executeCommand('updateItem', {
    itemId: puppetItemId,
    patch: {
      x: wx,
      z: wz,
      elevation: wy,
      rotation: seatItem.rotation + (p.rot || 0),
      pose: interactionType,
      floorId: seatItem.floorId
    }
  });

  // 3. 同步更新控制器内部的绝对世界位置状态
  spawnX = wx;
  spawnZ = wz;
  spawnY = absoluteWy;
  isGrounded = true;
  velocityY = 0;

  showInteractToast(interactionType === 'lie' ? "已躺下" : "已坐下");
}

// 检查并让木偶从座椅或床上站起来，还原高程与普通行走姿势
function checkStandUp(Context) {
  if (!window.firstPersonActive || !puppetItemId) return;

  const puppetItem = Context.testMap.getEntity('item', puppetItemId);
  if (puppetItem && puppetItem.pose && puppetItem.pose !== 'stand') {
    Context.testMap.executeCommand('updateItem', {
      itemId: puppetItemId,
      patch: { pose: 'stand', elevation: 0 }
    });

    spawnX = puppetItem.x || 0;
    spawnZ = puppetItem.z || 0;
    spawnY = getPuppetFloorY(Context, spawnX, spawnZ);
    isGrounded = true;
    velocityY = 0;

    showInteractToast("已站立");
  }
}
