import { pointInRoom, Ray } from '../../src/index.js';

let cachedGroundY = 0;
let fpRayOrigin = null;
let fpRayDirection = null;

// 使用向下射线探测贴地高度以支持上下楼梯与抬高地板
function getGroundYByRaycast(Context, x, z, currentY, isGrounded = true, isMoving = true) {
  // 当处于地面且未位移时，无需每帧进行昂贵的全场景 Raycast
  if (isGrounded && !isMoving) {
    return cachedGroundY;
  }

  const scene = Context.scene;
  const BABYLON = Context.BABYLON || window.BABYLON;

  if (!fpRayOrigin) {
    fpRayOrigin = new BABYLON.Vector3(0, 0, 0);
    fpRayDirection = new BABYLON.Vector3(0, -1, 0);
  }
  
  // 处于空中下坠时探测深度拉长到 15.0 米，保证半空跨度中也能打中一楼地面/泳池
  const rayLength = isGrounded ? 2.5 : 15.0;
  fpRayOrigin.set(x, currentY + 0.5, z);
  const ray = new Ray(fpRayOrigin, fpRayDirection, rayLength);

  const hit = scene.pickWithRay(ray, (mesh) => {
    if (puppetItemId && (mesh.name.includes(puppetItemId) || mesh.id.includes(puppetItemId))) return false;
    if (mesh.name === 'skyBox' || mesh.name === 'grassLawn' || mesh.name.startsWith('floor_grid_3d')) return false;
    return mesh.isPickable;
  });

  if (hit && hit.hit && hit.pickedPoint) {
    cachedGroundY = hit.pickedPoint.y;
    return cachedGroundY;
  }
  
  // 降级回退
  cachedGroundY = getPuppetFloorY(Context, x, z);
  return cachedGroundY;
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
let interactionProbeElapsed = 0;

let fpConfig = {
  moveSpeedScale: 1.0,
  lookSensitivityScale: 1.0,
  fovDeg: 75,
};

/**
 * 更新第一人称漫游控制参数
 * @param {Object} config
 * @param {number} [config.moveSpeedScale]
 * @param {number} [config.lookSensitivityScale]
 * @param {number} [config.fovDeg]
 */
export function updateFirstPersonConfig(config = {}) {
  if (typeof config.moveSpeedScale === 'number') fpConfig.moveSpeedScale = config.moveSpeedScale;
  if (typeof config.lookSensitivityScale === 'number') fpConfig.lookSensitivityScale = config.lookSensitivityScale;
  if (typeof config.fovDeg === 'number') fpConfig.fovDeg = config.fovDeg;
}

/**
 * 创建仅存在于 Babylon 场景中的轻量第一人称角色。
 * 角色不包含头部，避免相机进入模型；不可见碰撞体与可见模型保持分离。
 */
export function createTemporaryFirstPersonAvatar(Context, id, position = { x: 0, y: 0, z: 0 }) {
  const BABYLON = Context.BABYLON || window.BABYLON;
  const scene = Context.scene;
  const root = new BABYLON.TransformNode(`item_${id}`, scene);
  root.position.set(position.x, position.y, position.z);
  root.metadata = { ...(root.metadata || {}), isTemporaryFirstPersonAvatar: true };

  const material = new BABYLON.StandardMaterial(`fp_avatar_material_${id}`, scene);
  material.diffuseColor = BABYLON.Color3.FromHexString('#c99563');
  material.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
  root.metadata.avatarMaterial = material;

  const attachVisiblePart = (mesh) => {
    mesh.parent = root;
    mesh.material = material;
    mesh.isPickable = false;
    mesh.receiveShadows = false;
    mesh.metadata = { ...(mesh.metadata || {}), isFirstPersonAvatarPart: true };
    return mesh;
  };

  // 该盒体只表达角色占用空间；实际防穿墙仍由移动控制器的射线完成。
  const collider = BABYLON.MeshBuilder.CreateBox(`fp_avatar_collider_${id}`, {
    width: 0.35,
    height: 1.7,
    depth: 0.35
  }, scene);
  collider.position.y = 0.85;
  collider.parent = root;
  collider.isVisible = false;
  collider.isPickable = false;
  collider.checkCollisions = false;
  collider.metadata = { ...(collider.metadata || {}), isFirstPersonCollider: true };

  const torso = attachVisiblePart(BABYLON.MeshBuilder.CreateCylinder(`fp_avatar_torso_${id}`, {
    diameterTop: 0.28,
    diameterBottom: 0.32,
    height: 0.62,
    tessellation: 8
  }, scene));
  torso.position.y = 1.12;

  const shoulders = attachVisiblePart(BABYLON.MeshBuilder.CreateBox(`fp_avatar_shoulders_${id}`, {
    width: 0.48,
    height: 0.12,
    depth: 0.2
  }, scene));
  shoulders.position.y = 1.39;

  const hips = attachVisiblePart(BABYLON.MeshBuilder.CreateBox(`fp_avatar_hips_${id}`, {
    width: 0.29,
    height: 0.16,
    depth: 0.2
  }, scene));
  hips.position.y = 0.76;

  for (const side of [-1, 1]) {
    const leg = attachVisiblePart(BABYLON.MeshBuilder.CreateCylinder(`fp_avatar_leg_${side}_${id}`, {
      diameter: 0.1,
      height: 0.7,
      tessellation: 6
    }, scene));
    leg.position.set(side * 0.09, 0.37, 0);

    const shoe = attachVisiblePart(BABYLON.MeshBuilder.CreateBox(`fp_avatar_shoe_${side}_${id}`, {
      width: 0.12,
      height: 0.08,
      depth: 0.24
    }, scene));
    shoe.position.set(side * 0.09, 0.05, 0.06);

    const arm = attachVisiblePart(BABYLON.MeshBuilder.CreateCylinder(`fp_avatar_arm_${side}_${id}`, {
      diameter: 0.075,
      height: 0.58,
      tessellation: 6
    }, scene));
    arm.position.set(side * 0.23, 1.09, 0);

    const hand = attachVisiblePart(BABYLON.MeshBuilder.CreateSphere(`fp_avatar_hand_${side}_${id}`, {
      diameter: 0.09,
      segments: 6
    }, scene));
    hand.position.set(side * 0.23, 0.78, 0);
  }

  return root;
}

export function disposeTemporaryFirstPersonAvatar(root) {
  if (!root || root.isDisposed()) return;
  const material = root.metadata?.avatarMaterial || null;
  root.getChildMeshes(false).forEach((mesh) => mesh.dispose(false, false));
  root.dispose(false);
  material?.dispose(false, false);
}

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

    .fp-action-btn.detected {
      background: rgba(0, 229, 255, 0.3);
      border-color: rgba(0, 229, 255, 0.7);
      box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
      color: #ffffff;
    }

    .fp-action-btn.locked {
      background: rgba(255, 59, 48, 0.35) !important;
      border-color: rgba(255, 59, 48, 0.85) !important;
      box-shadow: 0 0 16px rgba(255, 59, 48, 0.5) !important;
      color: #ffffff !important;
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

// 辅助方法：获取门窗更精细的中文名称（如：方形门、圆拱窗、圆形窗等）
function getOpeningDisplayName(opening) {
  if (!opening) return '门窗';
  if (opening.name && opening.name !== '门' && opening.name !== '窗' && opening.name !== '门窗') {
    return opening.name;
  }
  const isDoor = opening.type === 'door';
  const typeName = isDoor ? '门' : '窗户';
  const shapeMap = {
    'square': '方形',
    'round-arch': '圆拱',
    'pointed-arch': '尖拱',
    'circle': '圆形',
    'semicircle': '半圆',
    'diamond': '菱形',
    'quarter-sector': '扇形',
    'right-triangle': '三角'
  };
  const shapeName = shapeMap[opening.shape] || '方形';
  return `${shapeName}${typeName}`;
}

// 辅助方法：获取栅栏精细的中文名称（如：木栅栏、铁艺栅栏、玻璃护栏等）
function getFenceDisplayName(fence) {
  if (!fence) return '栅栏';
  if (fence.name && fence.name !== '栅栏') return fence.name;
  const subtypeMap = {
    'picket_wood': '木栅栏',
    'iron_ornamental': '铁艺栅栏',
    'wire_mesh': '金属网栅栏',
    'stone_masonry': '石砌矮墙',
    'bamboo': '竹篱笆',
    'glass_rail': '玻璃护栏',
    'concrete': '混凝土矮墙',
    'rope': '麻绳护栏'
  };
  return subtypeMap[fence.subtype] || '栅栏';
}

// 辅助方法：获取栅栏门精细的中文名称（如：木栅栏门、铁艺栅栏门等）
function getFenceGateDisplayName(gate) {
  if (!gate) return '栅栏门';
  if (gate.name && gate.name !== '栅栏门') return gate.name;
  const subtypeMap = {
    'picket_wood': '木栅栏门',
    'iron_ornamental': '铁艺栅栏门',
    'wire_mesh': '金属网栅栏门',
    'stone_masonry': '石砌栅栏门',
    'bamboo': '竹栅栏门',
    'glass_rail': '玻璃栅栏门',
    'concrete': '混凝土栅栏门',
    'rope': '麻绳栅栏门'
  };
  return subtypeMap[gate.subtype] || '栅栏门';
}

// 辅助方法：沿着祖先节点向上递归查找可交互实体（家具、门窗、栅栏门、栅栏）并识别出其 ID 和类别
function findInteractionParent(mesh, puppetItemId) {
  let curr = mesh;
  while (curr) {
    // 排除自身木偶 Mesh
    if (puppetItemId && (curr.name.includes(puppetItemId) || curr.id?.includes(puppetItemId))) {
      return null;
    }

    // 1. 优先从 metadata 提取
    if (curr.metadata?.blueprintItemId || curr.metadata?.itemId) {
      return { id: curr.metadata.blueprintItemId || curr.metadata.itemId, type: 'item', node: curr };
    }
    if (curr.metadata?.blueprintOpeningId || curr.metadata?.openingId) {
      return { id: curr.metadata.blueprintOpeningId || curr.metadata.openingId, type: 'opening', node: curr };
    }
    if (curr.metadata?.blueprintFenceGateId || curr.metadata?.blueprintGateId || curr.metadata?.gateId) {
      return { id: curr.metadata.blueprintFenceGateId || curr.metadata.blueprintGateId || curr.metadata.gateId, type: 'fence_gate', node: curr };
    }
    if (curr.metadata?.blueprintFenceId || curr.metadata?.fenceId) {
      return { id: curr.metadata.blueprintFenceId || curr.metadata.fenceId, type: 'fence', node: curr };
    }

    // 2. 从 Name 中以正则表达式精准匹配实体 ID
    if (curr.name) {
      if (curr.name.startsWith('item_')) {
        return { id: curr.name.replace('item_', ''), type: 'item', node: curr };
      }
      if (curr.name.startsWith('opening_group_')) {
        return { id: curr.name.replace('opening_group_', ''), type: 'opening', node: curr };
      }
      if (curr.name.startsWith('opening_')) {
        return { id: curr.name.replace('opening_', ''), type: 'opening', node: curr };
      }

      // 栅栏门（Fence Gate）: 优先判定。提取以 gate- 或 gate_ 开头的真正 UUID
      if (curr.name.includes('gate')) {
        const match = curr.name.match(/(gate[-_][a-zA-Z0-9]+)/);
        if (match) {
          return { id: match[1], type: 'fence_gate', node: curr };
        }
      }

      // 栅栏（Fence）: 提取以 fence- 或 fence_ 开头的 UUID
      if (curr.name.includes('fence')) {
        const match = curr.name.match(/(fence[-_][a-zA-Z0-9]+)/);
        if (match) {
          return { id: match[1], type: 'fence', node: curr };
        }
      }
    }
    curr = curr.parent;
  }
  return null;
}

// 判断家具是否具备实际物理/功能交互（坐/躺点位、家电/灯具开关、水槽放水、马桶开盖、窗帘拉合等）
function isItemInteractive(item, def) {
  if (!item || !def) return false;
  const hasInteraction = def.interaction && typeof def.interaction.getInteractionPoints === 'function';
  const isLighting = def.category === 'lighting' || def.lightSource;
  const isAppliance = def.category === 'appliances';
  const isLightingEntity = !!item.lightId;
  const isSwitchable = !!(isLighting || isAppliance || isLightingEntity || def.powerEffect || def.isSwitchable);
  const isWaterContainer = def.waterControllable === true;
  const isToilet = item.type.includes('toilet');
  const isCurtain = item.type.toLowerCase().includes('curtain') || item.type.toLowerCase().includes('blind') || item.type.toLowerCase().includes('noren') || item.type.toLowerCase().includes('valance');

  return hasInteraction || isSwitchable || isWaterContainer || isToilet || isCurtain;
}

// 实时检测射线视向 2.5m 内的可交互目标，将交互按钮文案修改为物体名称（如椅子、电视机、水槽、门窗等）
function updateInteractionTargetButton(Context) {
  const btnInteract = document.getElementById('fp-btn-interact');
  if (!btnInteract) return;
  const btnSpan = btnInteract.querySelector('span');
  if (!btnSpan) return;

  if (currentPose !== 'stand') {
    btnSpan.textContent = '起立';
    btnInteract.classList.remove('locked');
    btnInteract.classList.add('detected');
    return;
  }

  const scene = Context.scene;
  const canvas = Context.canvas;
  const BABYLON = Context.BABYLON || window.BABYLON;
  if (!scene || !canvas || !BABYLON) return;

  const ray = scene.createPickingRay(
    canvas.clientWidth / 2,
    canvas.clientHeight / 2,
    BABYLON.Matrix?.Identity ? BABYLON.Matrix.Identity() : window.BABYLON?.Matrix?.Identity(),
    Context.camera
  );

  const forwardDir = Context.camera.getDirection(new BABYLON.Vector3(0, 0, 1));
  ray.origin.addInPlace(forwardDir.scale(0.4));

  const hit = scene.pickWithRay(ray, (mesh) => {
    if (!mesh.isPickable) return false;
    const interInfo = findInteractionParent(mesh, puppetItemId);
    return !!interInfo;
  });

  if (hit && hit.hit && hit.pickedMesh && hit.distance <= 2.5) {
    const interInfo = findInteractionParent(hit.pickedMesh, puppetItemId);
    if (interInfo) {
      let objectName = null;
      let isInteractive = false;
      let isLocked = false;

      if (interInfo.type === 'item') {
        const item = Context.testMap.getEntity('item', interInfo.id);
        if (item) {
          const def = Context.testMap.getFurnitureDefinition(item.type);
          objectName = def ? def.name : item.type;
          isInteractive = isItemInteractive(item, def);
          const hasInteraction = def && def.interaction && typeof def.interaction.getInteractionPoints === 'function';
          // 椅/床等坐姿交互类家具不吃锁定限制
          isLocked = hasInteraction ? false : !!item.locked;
        }
      } else if (interInfo.type === 'opening') {
        const opening = Context.testMap.getEntity('opening', interInfo.id);
        if (opening) {
          objectName = getOpeningDisplayName(opening);
          isInteractive = true;
          isLocked = !!opening.locked;
        }
      } else if (interInfo.type === 'fence_gate') {
        const gate = Context.testMap.getEntity('fence_gate', interInfo.id);
        if (gate) {
          objectName = getFenceGateDisplayName(gate);
          isInteractive = true;
          isLocked = !!gate.locked;
        }
      } else if (interInfo.type === 'fence') {
        const fence = Context.testMap.getEntity('fence', interInfo.id);
        if (fence) {
          objectName = getFenceDisplayName(fence);
          isInteractive = false;
          isLocked = !!fence.locked;
        }
      }

      if (objectName) {
        btnSpan.textContent = objectName;
        if (!isInteractive) {
          // 普通非功能物体：白色呈现（移除蓝光与红光）
          btnInteract.classList.remove('detected');
          btnInteract.classList.remove('locked');
        } else if (isLocked) {
          // 可操控但被锁定：红色警示
          btnInteract.classList.remove('detected');
          btnInteract.classList.add('locked');
        } else {
          // 可操控且未锁定：蓝色高亮
          btnInteract.classList.remove('locked');
          btnInteract.classList.add('detected');
        }
        return;
      }
    }
  }

  btnSpan.textContent = '交互';
  btnInteract.classList.remove('detected');
  btnInteract.classList.remove('locked');
}

// 射线交互：可开关附近的门窗、家电与栅栏门 (限制实际物理交互距离在 2.5m 内)
function executeInteraction(Context) {
  // 如果当前已经处于坐着/躺下状态，点击交互直接站起来 (起立永远是第一优先级)
  const puppetItem = puppetItemId ? Context.testMap.getEntity('item', puppetItemId) : null;
  const activePose = puppetItem?.pose || currentPose;
  if (activePose !== 'stand') {
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
    let itemName = '';

    const showLockedWarning = (name) => {
      showInteractToast(`${name}已锁定`);
      if (rootMesh) {
        const highlightMeshes = rootMesh.getChildMeshes ? rootMesh.getChildMeshes() : [rootMesh];
        highlightMeshes.forEach(m => {
          m.renderOutline = true;
          m.outlineColor = new (Context.BABYLON?.Color3 || window.BABYLON?.Color3)(1.0, 0.15, 0.15);
          m.outlineWidth = 0.035;
          setTimeout(() => { m.renderOutline = false; }, 1000);
        });
      }
    };

    if (type === 'item' && id) {
      const item = Context.testMap.getEntity('item', id);
      if (item) {
        const def = Context.testMap.getFurnitureDefinition(item.type);
        itemName = def ? def.name : item.type;

        // 判定是否是有点位的家具（如椅子、床等）
        const hasInteraction = def && def.interaction && typeof def.interaction.getInteractionPoints === 'function';

        // 锁定检查（坐具类豁免）
        if (item.locked && !hasInteraction) {
          showLockedWarning(itemName);
          return;
        }
        
        // 区分家电、窗帘和地毯等普通家具：是否是可开关/拉合设备
        const isLighting = def && (def.category === 'lighting' || def.lightSource);
        const isAppliance = def && def.category === 'appliances';
        const isLightingEntity = !!item.lightId;
        const isCurtain = def && (
          item.type.toLowerCase().includes('curtain') ||
          item.type.toLowerCase().includes('blind') ||
          item.type.toLowerCase().includes('noren') ||
          item.type.toLowerCase().includes('valance')
        );
        const isSwitchable = !!(isLighting || isAppliance || isLightingEntity || isCurtain || def?.powerEffect || def?.isSwitchable);

        // 区分水槽凹槽放水与马桶开合盖
        const isWaterContainer = def?.waterControllable === true;
        const isToilet = def && item.type.includes('toilet');

        if (isSwitchable || isToilet) {
          const prevOn = isToilet ? (item.lidOpen === true) : (item.isOn !== false);
          const targetState = !prevOn;
          if (isToilet) {
            if (Context.entityManager && typeof Context.entityManager.toggleItemLid === 'function') {
              Context.entityManager.toggleItemLid(id);
            }
          } else {
            if (Context.entityManager && typeof Context.entityManager.toggleItemPower === 'function') {
              Context.entityManager.toggleItemPower(id);
            } else {
              Context.testMap.executeCommand('updateItem', { itemId: id, patch: { isOn: targetState } });
            }
          }
          showInteractToast(targetState ? `已开启：${itemName}` : `已关闭：${itemName}`);
        } else if (hasInteraction) {
          // 椅子、床等可坐下/躺下交互的家具：直接坐下/躺下
          interactSitOnSeat(Context, id);
        } else if (isWaterContainer) {
          // 水槽、浴缸等水容器：开启/关闭放水
          if (Context.entityManager && typeof Context.entityManager.toggleItemWater === 'function') {
            Context.entityManager.toggleItemWater(id);
          }
          const waterOn = item.waterEnabled !== false;
          showInteractToast(!waterOn ? `已开启放水：${itemName}` : `已停止放水：${itemName}`);
        } else {
          // 普通地毯、桌子、绿植等：直接气泡显示物体名字，不触发无意义的开关
          showInteractToast(itemName);
        }
      }
    } else if (type === 'opening' && id) {
      const opening = Context.testMap.getEntity('opening', id);
      if (opening) {
        itemName = getOpeningDisplayName(opening);
        if (opening.locked) {
          showLockedWarning(itemName);
          return;
        }
        const targetState = !opening.isOpen;
        if (typeof Context.pushHistory === 'function') Context.pushHistory();
        Context.testMap.executeCommand('updateOpening', {
          openingId: id,
          patch: { isOpen: targetState }
        });
        if (typeof Context.refreshShadows === 'function') Context.refreshShadows();
        if (typeof Context.renderPlan === 'function') Context.renderPlan();
        showInteractToast(targetState ? `已开启：${itemName}` : `已关闭：${itemName}`);
      }
    } else if (type === 'fence_gate' && id) {
      const gate = Context.testMap.getEntity('fence_gate', id);
      if (gate) {
        itemName = getFenceGateDisplayName(gate);
        if (gate.locked) {
          showLockedWarning(itemName);
          return;
        }
        const targetState = !gate.isOpen;
        if (typeof Context.pushHistory === 'function') Context.pushHistory();
        Context.testMap.executeCommand('updateFenceGate', {
          gateId: id,
          patch: { isOpen: targetState }
        });
        if (typeof Context.refreshShadows === 'function') Context.refreshShadows();
        if (typeof Context.renderPlan === 'function') Context.renderPlan();
        showInteractToast(targetState ? `已开启：${itemName}` : `已关闭：${itemName}`);
      }
    } else if (type === 'fence' && id) {
      const fence = Context.testMap.getEntity('fence', id);
      if (fence) {
        itemName = getFenceDisplayName(fence);
        if (fence.locked) {
          showLockedWarning(itemName);
          return;
        }
        showInteractToast(itemName);
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

    const BABYLON = Context.BABYLON || window.BABYLON;
    puppetItemId = `fp_temp_puppet_${Date.now()}`;
    puppetNode = createTemporaryFirstPersonAvatar(Context, puppetItemId, {
      x: spawnX,
      y: spawnY,
      z: spawnZ
    });
  }

  // 挂载全局操控木偶 ID 与坐下、站起交互接口，方便右键菜单系统等跨组件安全调用
  window.firstPersonPuppetId = puppetItemId;
  window.firstPersonSitOnSeat = (seatItemId) => interactSitOnSeat(Context, seatItemId);
  window.firstPersonStandUp = () => checkStandUp(Context);
  window.exitFirstPerson = (options) => exitFirstPerson(Context, options);

  if (!isTemporaryPuppet) {
    puppetNode = null;
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      puppetNode = scene.getTransformNodeByName(`item_${puppetItemId}`);
      if (puppetNode) {
        clearInterval(checkInterval);
        puppetNode.position.set(spawnX, spawnY, spawnZ);
      }
      if (++checkCount > 100) {
        clearInterval(checkInterval);
        console.warn("未能在场景中找到木偶的3D节点");
      }
    }, 50);
  }

  // 5. 设置相机为第一人称模式
  camera.detachControl(Context.canvas);
  camera.radius = 0.001; // 半径设为 0.001m（1毫米），使相机物理起点与 target 焦点完美重合，消除旋转时的左右横向平移偏移
  camera.fov = (fpConfig.fovDeg * Math.PI) / 180;

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

    const sensitivity = 0.001 * fpConfig.lookSensitivityScale;
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
  interactionProbeElapsed = 0;
  beforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    if (dt <= 0) return;

    // 交互提示无需跟随 60 FPS 刷新；10 Hz 足以保持响应，同时显著减少全场景拾取。
    interactionProbeElapsed += dt;
    if (interactionProbeElapsed >= 0.1) {
      interactionProbeElapsed %= 0.1;
      updateInteractionTargetButton(Context);
    }

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

// 多探针与多高度碰撞检测（防穿墙、防穿家具、防墙角穿透）
function checkRayCollision(scene, posX, posY, posZ, dirX, dirZ, stepDist, puppetItemId) {
  const BABYLON = scene.getEngine ? (scene.getEngine()._babylon || window.BABYLON) : window.BABYLON;
  if (!BABYLON || !BABYLON.Ray || !BABYLON.Vector3) return false;
  const Ray = BABYLON.Ray;
  const Vector3 = BABYLON.Vector3;

  const dirVector = new Vector3(dirX, 0, dirZ).normalize();
  const radius = 0.38; // 角色身体物理碰撞安全半径 (38 厘米)
  const probeDist = stepDist + radius;

  // 在腰部 (0.4m) 与胸眼部 (1.2m) 两个核心高度探针探测
  const heights = [posY + 0.4, posY + 1.2];
  // 前向及左右偏转扇形探针 (0°, -25°, +25°)，全面防护墙角与侧门框穿透
  const angles = [0, -0.44, 0.44];

  for (const h of heights) {
    const origin = new Vector3(posX, h, posZ);
    for (const angle of angles) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rayDir = new Vector3(
        dirVector.x * cos - dirVector.z * sin,
        0,
        dirVector.x * sin + dirVector.z * cos
      ).normalize();

      const ray = new Ray(origin, rayDir, probeDist);
      const hit = scene.pickWithRay(ray, (mesh) => {
        if (!mesh || !mesh.isPickable || !mesh.isVisible) return false;

        const name = mesh.name || '';
        const parentName = mesh.parent?.name || '';

        // 排除木偶角色本身 Mesh
        if (puppetItemId && (name.includes(puppetItemId) || mesh.id?.includes(puppetItemId))) return false;
        // 排除天空盒、草地、网格线、地板面
        if (name === 'skyBox' || name === 'grassLawn' || name.startsWith('floor_grid_3d') || name.startsWith('room_floor')) return false;
        if (parentName === 'skyBox' || parentName === 'grassLawn') return false;

        return true;
      });

      if (hit && hit.hit && hit.distance < probeDist) {
        return true; // 触发物理阻挡
      }
    }
  }

  return false;
}

    const speed = 2.5 * fpConfig.moveSpeedScale; // 水平行走速度 (基础 2.5m/s * 速率倍率)
    const isMoving = moveDir.length() > 0.001;
    if (isMoving) {
      // 正在行走移动，若当前木偶处于坐姿或躺姿，自动起立站好
      checkStandUp(Context);

      moveDir.normalize();

      const dx = moveDir.x * speed * dt;
      const dz = moveDir.z * speed * dt;

      let nextX = currentX;
      let nextZ = currentZ;

      // X 轴独立移动物理碰撞检测（防止穿墙并支持沿墙滑动）
      if (Math.abs(dx) > 0.00001) {
        const hitX = checkRayCollision(scene, currentX, currentY, currentZ, Math.sign(dx), 0, Math.abs(dx), puppetItemId);
        if (!hitX) {
          nextX = currentX + dx;
        }
      }

      // Z 轴独立移动物理碰撞检测
      if (Math.abs(dz) > 0.00001) {
        const hitZ = checkRayCollision(scene, nextX, currentY, currentZ, 0, Math.sign(dz), Math.abs(dz), puppetItemId);
        if (!hitZ) {
          nextZ = currentZ + dz;
        }
      }

      currentX = nextX;
      currentZ = nextZ;

      // 旋转木偶躯干，使其面朝向走动方向
      if (puppetNode && !puppetNode.isDisposed()) {
        const targetPoint = puppetNode.position.add(forward);
        puppetNode.lookAt(targetPoint);
      }
    }

    // 采用高精度向下射线检测，获取当前位置实际的地板或楼梯面高度
    const targetFloorY = getGroundYByRaycast(
      Context,
      currentX,
      currentZ,
      currentY,
      isGrounded,
      moveDir.length() > 0.001
    );

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
      // 只有处于站立姿态时才平滑贴合地面 (平滑上下楼梯与地板过渡)
      const puppetItem = puppetItemId ? Context.testMap.getEntity('item', puppetItemId) : null;
      const activePose = puppetItem?.pose || currentPose;
      if (activePose === 'stand') {
        currentY = currentY * 0.8 + targetFloorY * 0.2;
        if (Math.abs(currentY - targetFloorY) < 0.005) {
          currentY = targetFloorY;
        }
      }
    }

    // 写入最新位置到 3D 渲染节点，并同步写回全局变量
    if (puppetNode && !puppetNode.isDisposed()) {
      puppetNode.position.set(currentX, currentY, currentZ);
    }
    spawnX = currentX;
    spawnY = currentY;
    spawnZ = currentZ;

    // 严谨计算相机绝对眼高 (站立眼高为 1.6m；坐姿眼高为椅面+0.75m；躺姿眼高为床面+0.25m)
    const puppetItem = puppetItemId ? Context.testMap.getEntity('item', puppetItemId) : null;
    const activePose = puppetItem?.pose || currentPose;

    let eyeHeight = 1.6; // 站立模式标准眼高 1.6m
    if (activePose === 'sit') {
      eyeHeight = 0.75;  // 坐姿模式椅面以上 0.75m
    } else if (activePose === 'lie') {
      eyeHeight = 0.25;  // 躺姿模式床面以上 0.25m
    }
    const absoluteEyeY = currentY + eyeHeight;

    // 将相机眼睛同步绑定在视线高程并稍微前置，避开头部穿模
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

  showInteractToast("已进入第一人称模式 (F11退出)");
}

// 退出第一人称
export function exitFirstPerson(Context, { expandPanels = false } = {}) {
  if (!window.firstPersonActive) return;
  currentPose = 'stand';
  window.firstPersonActive = false;
  window.firstPersonPuppetId = null;
  window.firstPersonSitOnSeat = null;
  window.firstPersonStandUp = null;
  window.exitFirstPerson = null;

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
      // 自动生成的临时木偶，纯 3D 节点直接销毁，不写户型文档
      disposeTemporaryFirstPersonAvatar(puppetNode);
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

  // 6. 还原/呼出侧栏与 3D 辅助网格
  const leftPanel = document.querySelector('.left-panel');
  const rightPanel = document.getElementById('right-panel');
  const btnToggleLeft = document.getElementById('btn-toggle-left');
  const btnToggleRight = document.getElementById('btn-toggle-right');

  if (expandPanels) {
    if (leftPanel) {
      leftPanel.classList.remove('collapsed');
      if (btnToggleLeft) btnToggleLeft.textContent = '‹';
    }
    if (rightPanel) {
      rightPanel.classList.remove('collapsed');
      if (btnToggleRight) btnToggleRight.textContent = '›';
    }
  } else {
    if (leftPanel && !prevLeftPanelState) {
      leftPanel.classList.remove('collapsed');
      if (btnToggleLeft) btnToggleLeft.textContent = '‹';
    }
    if (rightPanel && !prevRightPanelState) {
      rightPanel.classList.remove('collapsed');
      if (btnToggleRight) btnToggleRight.textContent = '›';
    }
  }

  Context.viewer3d.show3DGrid = prevGridState;
  if (prevGridState) {
    Context.refresh3DGrid();
  }

  // 从当前层状态还原天空盒
  Context.updateSkyboxFromCurrentFloor();

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

let currentPose = 'stand';

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
  
  const floorElevation = Context.testMap.getFloorElevation?.(seatItem.floorId) || 0;
  const absoluteWy = wy + floorElevation;

  // 1. 取消任何选中以移除坐标轴与光圈
  if (typeof Context.selectItem === 'function') {
    Context.selectItem(null);
  }

  currentPose = interactionType;

  // 2. 真实更新 3D 节点的位置与旋转
  if (puppetNode && !puppetNode.isDisposed()) {
    puppetNode.position.set(wx, absoluteWy, wz);
    puppetNode.rotation.y = (seatItem.rotation || 0) + (p.rot || 0);
  }

  // 3. 将第一人称相机焦点对准座椅位置，并按姿态下调视点眼睛高度
  const camera = Context.camera;
  if (camera) {
    const eyeOffset = interactionType === 'lie' ? 0.35 : 0.85;
    const camForward = camera.getDirection(new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(0, 0, 1));
    const fNorm = new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(camForward.x, 0, camForward.z).normalize();
    camera.target.set(wx + fNorm.x * 0.18, absoluteWy + eyeOffset, wz + fNorm.z * 0.18);
  }

  // 4. 如果是非临时木偶，同步更新数据层快照
  if (!isTemporaryPuppet) {
    Context.testMap.executeCommand('updateItem', {
      itemId: puppetItemId,
      patch: {
        x: wx,
        z: wz,
        elevation: wy,
        rotation: (seatItem.rotation || 0) + (p.rot || 0),
        pose: interactionType,
        floorId: seatItem.floorId
      }
    });
  }

  // 5. 同步更新控制器内部的绝对世界位置状态
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

  if (currentPose !== 'stand') {
    currentPose = 'stand';

    if (!isTemporaryPuppet) {
      Context.testMap.executeCommand('updateItem', {
        itemId: puppetItemId,
        patch: { pose: 'stand', elevation: 0 }
      });
    }

    const camera = Context.camera;
    if (camera && puppetNode && !puppetNode.isDisposed()) {
      const camForward = camera.getDirection(new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(0, 0, 1));
      const fNorm = new (Context.BABYLON?.Vector3 || window.BABYLON?.Vector3)(camForward.x, 0, camForward.z).normalize();
      camera.target.set(puppetNode.position.x + fNorm.x * 0.18, puppetNode.position.y + 1.6, puppetNode.position.z + fNorm.z * 0.18);
    }

    isGrounded = true;
    velocityY = 0;

    showInteractToast("已站立");
  }
}
