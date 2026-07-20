import { getRoomVertices } from '../rooms/index.js';

/**
 * 空间拓扑与网格对齐相关算法
 */

/**
 * 基本网格值对齐计算
 * @param {number} value 原始坐标值
 * @param {boolean} snapEnabled 是否开启对齐网格
 * @param {number} snapSize 网格尺寸
 * @returns {number} 对齐后的值
 */
export function snapValue(value, snapEnabled, snapSize) {
  if (!snapEnabled || !snapSize) return value;
  return Math.round(value / snapSize) * snapSize;
}

/**
 * 将坐标点对齐到最近的网格交点上（Vertex Alignment）
 * @param {{x: number, z: number}} world 原始世界坐标
 * @param {boolean} snapEnabled 是否开启对齐网格
 * @param {number} snapSize 网格尺寸
 * @returns {{x: number, z: number}} 对齐后的坐标点
 */
export function snapWorldPoint(world, snapEnabled, snapSize) {
  return {
    x: Number(snapValue(world.x, snapEnabled, snapSize).toFixed(3)),
    z: Number(snapValue(world.z, snapEnabled, snapSize).toFixed(3))
  };
}

/**
 * 将坐标点对齐到网格格线的中点（Edge Segment Center Alignment）
 * @param {{x: number, z: number}} point 原始坐标点
 * @param {boolean} snapEnabled 是否开启对齐网格
 * @param {number} snapSize 网格尺寸
 * @returns {{x: number, z: number}} 对齐后的坐标点
 */
export function snapToGridSegmentCenter(point, snapEnabled, snapSize) {
  if (!snapEnabled || !snapSize) return point;
  const S = snapSize;
  const x = point.x;
  const z = point.z;

  // 候选 1：对齐到横向线段中点 (x 落在 (k+0.5)*S，z 落在 j*S)
  const x1 = (Math.round(x / S - 0.5) + 0.5) * S;
  const z1 = Math.round(z / S) * S;
  const d1 = (x - x1) * (x - x1) + (z - z1) * (z - z1);

  // 候选 2：对齐到纵向线段中点 (x 落在 k*S，z 落在 (j+0.5)*S)
  const x2 = Math.round(x / S) * S;
  const z2 = (Math.round(z / S - 0.5) + 0.5) * S;
  const d2 = (x - x2) * (x - x2) + (z - z2) * (z - z2);

  if (d1 < d2) {
    return {
      x: Number(x1.toFixed(3)),
      z: Number(z1.toFixed(3))
    };
  } else {
    return {
      x: Number(x2.toFixed(3)),
      z: Number(z2.toFixed(3))
    };
  }
}

/**
 * 将数值进行网格吸附并格式化为最多保留三位小数
 * @param {number} value 原始数值
 * @param {boolean} snapEnabled 是否开启对齐网格
 * @param {number} snapSize 网格尺寸
 * @returns {number} 吸附格式化后的数值
 */
export function snapNumber(value, snapEnabled, snapSize) {
  return Number(snapValue(value, snapEnabled, snapSize).toFixed(3));
}

/**
 * 计算自动屋顶的位置和大小
 * @param {Object} room 房间对象（可选）
 * @param {{x: number, z: number}} defaultPos 默认位置（当没有房间时）
 * @param {number} wallThickness 墙体厚度
 * @returns {{x: number, z: number, width: number, depth: number}} 屋顶的位置和尺寸
 */
export function calculateAutoRoofBounds(room, defaultPos, wallThickness = 0.15) {
  if (room) {
    return {
      x: room.x,
      z: room.z,
      width: room.width + wallThickness,
      depth: room.depth + wallThickness
    };
  }
  return {
    x: defaultPos.x,
    z: defaultPos.z,
    width: 6,
    depth: 6
  };
}

/**
 * 计算点到单个围栏上的投影 T 值及距离，支持网格吸附
 * @param {{x: number, z: number}} point 世界坐标点
 * @param {Object} fence 围栏对象
 * @param {boolean} snapEnabled 是否开启对齐网格
 * @param {number} snapSize 网格尺寸
 * @returns {{t: number, distance: number}} 投影 T 值和距离
 */
export function projectPointToFence(point, fence, snapEnabled, snapSize) {
  const [ax, az] = fence.from;
  const [bx, bz] = fence.to;
  const fdx = bx - ax;
  const fdz = bz - az;
  const lenSq = fdx * fdx + fdz * fdz;
  if (lenSq <= 0.001) return { t: 0.5, distance: Infinity };

  const rawT = Math.max(0.01, Math.min(0.99, ((point.x - ax) * fdx + (point.z - az) * fdz) / lenSq));
  const rawProjX = ax + fdx * rawT;
  const rawProjZ = az + fdz * rawT;
  const rawDistance = Math.hypot(point.x - rawProjX, point.z - rawProjZ);

  let t = rawT;
  if (snapEnabled && snapSize) {
    const rawCenterX = ax + fdx * t;
    const rawCenterZ = az + fdz * t;
    const snapped = snapToGridSegmentCenter({ x: rawCenterX, z: rawCenterZ }, snapEnabled, snapSize);
    t = Math.max(0.01, Math.min(0.99, ((snapped.x - ax) * fdx + (snapped.z - az) * fdz) / lenSq));
  }

  return { t, distance: rawDistance };
}

/**
 * 从围栏列表中寻找距离指定位置最近的围栏轨道
 * @param {{x: number, z: number}} point 鼠标/光标世界坐标
 * @param {Array<Object>} fences 候选围栏列表
 * @param {boolean} snapEnabled 是否开启对齐网格
 * @param {number} snapSize 网格尺寸
 * @returns {{fence: Object|null, t: number, distance: number}} 最近的围栏、投影 T 值和距离
 */
export function findNearestFenceTrack(point, fences, snapEnabled, snapSize) {
  let nearestFence = null;
  let nearestDist = Infinity;
  let projectionT = 0.5;

  for (const fence of fences) {
    const { t, distance } = projectPointToFence(point, fence, snapEnabled, snapSize);
    if (distance < nearestDist) {
      nearestDist = distance;
      nearestFence = fence;
      projectionT = t;
    }
  }

  return { fence: nearestFence, t: projectionT, distance: nearestDist };
}

const INCHES_PER_UNIT = 39.37;

/**
 * 判断是否为卧室大家具
 * @param {string} type
 * @returns {boolean}
 */
export function isBigBedroomItem(type) {
  return type.includes('bed') || type.includes('crib') || type === 'mattress' || type === 'vanity' || type === 'hammock';
}

/**
 * 判断是否为厨卫大家电或大盆水槽
 * @param {string} type
 * @returns {boolean}
 */
export function isBigKitchenBathItem(type) {
  return type === 'fridge' || type === 'toilet' || type === 'bathtub' || 
         type === 'washing_machine' || type === 'stove' || type === 'shower_cabin' || 
         type === 'dishwasher' || type === 'water_dispenser' || type === 'range_hood' ||
         type === 'sink_kitchen' || type === 'sink_bathroom';
}

/**
 * 判断某个家具物品是否可以放置在桌子上方
 * @param {Object} item 待放置的物品
 * @param {Object} definition 该物品的家具定义
 * @returns {boolean} 是否可以放置在桌子上
 */
export function canPlaceOnTable(item, definition) {
  if (!definition) return false;
  if (definition.placeType === 'wall' || definition.placeType === 'ceiling') {
    return false;
  }
  
  const type = definition.type || '';
  const category = definition.category || '';
  
  // 1. 桌子、柜架大类本身不能摆放在别的桌上
  if (category === 'tables' || category === 'storage') {
    return false;
  }
  
  // 2. 椅子、坐具类（seating）除 cushion（靠枕）外通常都不能摆在桌上
  if (category === 'seating') {
    if (type !== 'cushion') {
      return false;
    }
  }
  
  // 3. 卧室大类过滤：大件床铺及梳妆台/吊网不能摆放，其余精细摆件（如化妆品、香水、眼影盒、文具等）允许吸附
  if (category === 'bedroom') {
    if (isBigBedroomItem(type)) {
      return false;
    }
  }
  
  // 4. 厨卫大类过滤：大件电器与大盆（如冰箱、马桶、浴缸、洗衣机、淋浴房等）不能摆放，其余小厨电与洗漱用品（如咖啡机、面包机、洗手液、茶杯组、水果盘等）允许吸附
  if (category === 'kitchen-bath' || category === 'kitchen' || category === 'bathroom') {
    if (isBigKitchenBathItem(type)) {
      return false;
    }
  }
  
  // 5. 灯具大类过滤：落地灯不能摆放，台灯/壁灯小灯具允许吸附
  if (category === 'lighting') {
    if (type.includes('floor')) {
      return false;
    }
    if (!type.includes('lamp') && !type.includes('light')) {
      return false;
    }
  }
  
  // 6. 统一尺寸限制：宽度限制放宽到32英寸以容纳30英寸的满层书籍摆件，深度限制保持24英寸
  const w = item.width || definition.defaultSize.width;
  const d = item.depth || definition.defaultSize.depth;
  if (w > 32 || d > 24) {
    return false;
  }
  return true;
}

/**
 * 检测垂直网格线 x_grid 上是否有一面垂直墙体阻挡当前家具
 * @param {number} x_grid - 要检测的垂直网格线坐标
 * @param {number} targetZ - 家具当前目标位置 Z 坐标
 * @param {number} halfD - 家具在当前旋转状态下的半深尺寸（Z轴跨度）
 * @param {Array<Object>} walls - 墙体对象列表
 * @returns {boolean}
 */
export function hasVerticalWallAt(x_grid, targetZ, halfD, walls) {
  const tolerance = 0.05; // 允许的误差范围
  for (const wall of walls) {
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    // 垂直墙体
    if (Math.abs(x1 - x2) < 0.01) {
      const wallX = (x1 + x2) / 2;
      if (Math.abs(x_grid - wallX) < tolerance) {
        // 检查 Z 方向是否有重叠
        const minZ = Math.min(z1, z2);
        const maxZ = Math.max(z1, z2);
        if (targetZ + halfD >= minZ - tolerance && targetZ - halfD <= maxZ + tolerance) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 检测水平网格线 z_grid 上是否有一面水平墙体阻挡当前家具
 * @param {number} z_grid - 要检测的水平网格线坐标
 * @param {number} targetX - 家具当前目标位置 X 坐标
 * @param {number} halfW - 家具在当前旋转状态下的半宽尺寸（X轴跨度）
 * @param {Array<Object>} walls - 墙体对象列表
 * @returns {boolean}
 */
export function hasHorizontalWallAt(z_grid, targetX, halfW, walls) {
  const tolerance = 0.05; // 允许的误差范围
  for (const wall of walls) {
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    // 水平墙体
    if (Math.abs(z1 - z2) < 0.01) {
      const wallZ = (z1 + z2) / 2;
      if (Math.abs(z_grid - wallZ) < tolerance) {
        // 检查 X 方向是否有重叠
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        if (targetX + halfW >= minX - tolerance && targetX - halfW <= maxX + tolerance) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 统一处理拖拽位置的网格吸附与特殊挂墙/贴壁吸附计算
 * @returns {{x: number, z: number}}
 */
export function calculateSnappedPosition({
  item,
  definition,
  x,
  z,
  snapSize,
  wallThickness,
  walls,
  shouldSnapToEdge,
  inchesToWorld
}) {
  let finalX = x;
  let finalZ = z;

  if (shouldSnapToEdge) {
    // 贴墙家具：边缘对齐网格线，并对有墙体的地方向内侧偏移 wallThickness / 2 避免嵌进墙里
    const w_world = inchesToWorld(item.width || definition.defaultSize.width) * (item.scale || 1);
    const d_world = inchesToWorld(item.depth || definition.defaultSize.depth) * (item.scale || 1);
    const rotation = item.rotation || 0;

    // 根据当前旋转弧度，计算家具包围盒投影到世界坐标 X、Z 轴的实际半宽与半深尺寸
    const cosVal = Math.abs(Math.cos(rotation));
    const sinVal = Math.abs(Math.sin(rotation));
    const halfW = (w_world / 2) * cosVal + (d_world / 2) * sinVal;
    const halfD = (w_world / 2) * sinVal + (d_world / 2) * cosVal;

    // X轴：分别计算左边缘与右边缘吸附的目标网格线
    const x_grid_left = Math.round((x - halfW) / snapSize) * snapSize;
    const x_grid_right = Math.round((x + halfW) / snapSize) * snapSize;

    // 检查对应的目标网格线处是否有墙体
    const hasWallLeft = hasVerticalWallAt(x_grid_left, z, halfD, walls);
    const hasWallRight = hasVerticalWallAt(x_grid_right, z, halfD, walls);

    // 如果网格线处有墙，吸附坐标需要向内侧收缩 wallThickness / 2
    const offsetLeft = hasWallLeft ? wallThickness / 2 : 0;
    const offsetRight = hasWallRight ? wallThickness / 2 : 0;

    const snapLeft = x_grid_left + offsetLeft + halfW;
    const snapRight = x_grid_right - offsetRight - halfW;
    finalX = Math.abs(snapLeft - x) < Math.abs(snapRight - x) ? snapLeft : snapRight;

    // Z轴：分别计算下边缘与上边缘吸附的目标网格线
    const z_grid_bottom = Math.round((z - halfD) / snapSize) * snapSize;
    const z_grid_top = Math.round((z + halfD) / snapSize) * snapSize;

    // 检查对应的目标网格线处是否有墙体
    const hasWallBottom = hasHorizontalWallAt(z_grid_bottom, x, halfW, walls);
    const hasWallTop = hasHorizontalWallAt(z_grid_top, x, halfW, walls);

    // 如果网格线处有墙，吸附坐标需要向内侧收缩 wallThickness / 2
    const offsetBottom = hasWallBottom ? wallThickness / 2 : 0;
    const offsetTop = hasWallTop ? wallThickness / 2 : 0;

    const snapBottom = z_grid_bottom + offsetBottom + halfD;
    const snapTop = z_grid_top - offsetTop - halfD;
    finalZ = Math.abs(snapBottom - z) < Math.abs(snapTop - z) ? snapBottom : snapTop;
  } else {
    // 常规家具：中心点对齐格子中心
    finalX = Math.round((x - snapSize / 2) / snapSize) * snapSize + snapSize / 2;
    finalZ = Math.round((z - snapSize / 2) / snapSize) * snapSize + snapSize / 2;
  }

  return { x: finalX, z: finalZ };
}

/**
 * 统一获取家具物品的物理大小（米），已包含 scale 缩放
 * @param {Object} item - 家具物品对象
 * @param {Object} definition - 家具物品的规格定义
 * @returns {{width: number, depth: number, height: number}} 物理大小
 */
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

/**
 * 寻找指定物品下方的桌子或储物柜
 * @param {Object} item 目标物品
 * @param {Array<Object>} items 全局物品列表
 * @param {string} currentFloorId 当前楼层ID
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {Object|null} 下方最高的桌子或储物柜对象
 */
export function findTableBelow(item, items, currentFloorId, getFurnitureDefinition) {
  let highestTable = null;
  let highestSurface = -Infinity;
  
  const allItems = items || [];
  const itemFloorId = item.floorId || currentFloorId;
  for (const other of allItems) {
    if (other.id === item.id) continue;
    if (other.floorId !== itemFloorId) continue;
    
    const otherDef = getFurnitureDefinition(other.type);
    if (!otherDef) continue;
    
    if (otherDef.category !== 'tables' && otherDef.category !== 'storage') {
      continue;
    }
    if (otherDef.placeType === 'wall' || otherDef.placeType === 'ceiling') {
      continue;
    }
    
    const cx = other.x;
    const cz = other.z;
    const angle = other.rotation || 0;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    const size = getItemSizeInMetres(other, otherDef);
    const halfW = size.width / 2;
    const halfD = size.depth / 2;
    
    if (Math.abs(localX) <= halfW && Math.abs(localZ) <= halfD) {
      const surface = (other.elevation || 0) + size.height;
      if (surface > highestSurface) {
        highestSurface = surface;
        highestTable = other;
      }
    }
  }
  
  return highestTable;
}

/**
 * 寻找离指定假人最近的座椅交互点
 * @param {Object} mannequinItem 假人（或其它）物体
 * @param {Array<Object>} items 全局物体列表
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {Object|null} 最近的座椅信息
 */
export function findNearestSeat(mannequinItem, items, getFurnitureDefinition) {
  let nearest = null;
  let minDistance = 1.2; // 1.2 米以内判定为附近
  
  const allItems = items || [];
  allItems.forEach((other) => {
    const definition = getFurnitureDefinition(other.type);
    if (!definition || !definition.interaction) return;
    
    const otherSize = getItemSizeInMetres(other, definition);
    
    const localPoints = definition.interaction.getInteractionPoints(otherSize);
    localPoints.forEach((p, index) => {
      // XZ 平面投影
      const cos = Math.cos(other.rotation || 0);
      const sin = Math.sin(other.rotation || 0);
      const wx = other.x + p.x * cos + p.z * sin;
      const wz = other.z - p.x * sin + p.z * cos;
      const wy = (other.elevation || 0) + p.y;
      
      const dx = mannequinItem.x - wx;
      const dz = mannequinItem.z - wz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < minDistance) {
        minDistance = dist;
        nearest = {
          item: other,
          pointIndex: index,
          pointType: definition.interaction.type,
          worldPos: { x: wx, y: wy, z: wz }
        };
      }
    });
  });
  
  return nearest;
}

/**
 * 计算点到线段在 XZ 平面上的几何距离
 */
export function pointToSegmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  if (l2 === 0) return Math.hypot(p.x - a[0], p.z - a[1]);
  let t = ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a[0] + t * dx;
  const projZ = a[1] + t * dz;
  return Math.hypot(p.x - projX, p.z - projZ);
}

/**
 * 检查边缘中点是否靠近任何墙体
 */
export function isEdgeWallFree(p1, p2, walls) {
  const mid = { x: (p1.x + p2.x) / 2, z: (p1.z + p2.z) / 2 };
  for (const wall of walls) {
    const dist = pointToSegmentDistance(mid, wall.from, wall.to);
    if (dist < 0.15) {
      return false;
    }
  }
  return true;
}

/**
 * 遍历并计算所有暴露（没有挨着墙）的自由地板边缘
 */
export function getFreeFloorEdges(rooms, walls) {
  const edges = [];
  rooms.forEach(room => {
    const vertices = getRoomVertices(room);
    if (!vertices || vertices.length < 3) return;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % n];
      if (isEdgeWallFree(p1, p2, walls)) {
        const isDuplicate = edges.some(e => 
          (Math.hypot(e.p1.x - p1.x, e.p1.z - p1.z) < 0.05 && Math.hypot(e.p2.x - p2.x, e.p2.z - p2.z) < 0.05) ||
          (Math.hypot(e.p1.x - p2.x, e.p1.z - p2.z) < 0.05 && Math.hypot(e.p2.x - p1.x, e.p2.z - p1.z) < 0.05)
        );
        if (!isDuplicate) {
          edges.push({ p1: { x: p1.x, z: p1.z }, p2: { x: p2.x, z: p2.z } });
        }
      }
    }
  });
  return edges;
}

/**
 * 楼梯扶手多段分段与高度、角度轨迹走向计算几何算法
 */
export function getStairsRailingSegments(stairs, testMap) {
  const segments = [];
  if (!stairs) return segments;

  const width = Math.max(0.6, Number(stairs.width || 1.2));
  const depth = Math.max(1.2, Number(stairs.depth || 3.2));
  const height = testMap.getStairsAutoHeight(stairs);

  function getWordPos(lx, lz) {
    const rot = stairs.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const wx = (stairs.x || 0) + lx * cos - lz * sin;
    const wz = (stairs.z || 0) + lx * sin + lz * cos;
    return [wx, wz];
  }

  const subtype = stairs.subtype || 'straight';
  const flipX = stairs.mirrored ? -1 : 1;

  if (subtype === 'straight' || subtype === 'floating') {
    const tilt = Math.atan2(height, depth);
    const yOffset = height / 2;

    segments.push({
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2),
      tilt,
      yOffset
    });

    segments.push({
      from: getWordPos(width / 2, -depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt,
      yOffset
    });
  } else if (subtype === 'lshape') {
    const n1 = Math.max(1, Math.min(stairs.steps || 9, stairs.cornerStep ?? Math.floor((stairs.steps || 9) / 2)));
    const stepHeight = height / (stairs.steps || 9);
    const landHeight = stepHeight * n1;

    const l1Depth = depth - width;
    const tilt1 = Math.atan2(landHeight, l1Depth);
    const yOffset1 = landHeight / 2;

    // 第一段楼梯
    segments.push({
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2 - width),
      tilt: tilt1,
      yOffset: yOffset1
    });

    segments.push({
      from: getWordPos(width / 2, -depth / 2),
      to: getWordPos(width / 2, depth / 2 - width),
      tilt: tilt1,
      yOffset: yOffset1
    });

    // 第二段楼梯
    const l2Length = depth - width;
    const tilt2 = Math.atan2(height - landHeight, l2Length);
    const yOffset2 = landHeight + (height - landHeight) / 2;
    const lxStart = (width / 2) * flipX;
    const lxEnd = (depth / 2) * flipX;

    segments.push({
      from: getWordPos(lxStart, depth / 2),
      to: getWordPos(lxEnd, depth / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });

    segments.push({
      from: getWordPos(lxStart, depth / 2 - width),
      to: getWordPos(lxEnd, depth / 2 - width),
      tilt: tilt2,
      yOffset: yOffset2
    });
  } else if (subtype === 'ushape') {
    const halfSteps = Math.floor((stairs.steps || 9) / 2);
    const slotW = stairs.uSlotWidth ?? 0.1;
    const voidL = stairs.uVoidLength ?? (depth - 1);
    const landDepth = Math.max(0.4, Math.min(depth - 0.2, depth - voidL));
    const stepHeight = (height / 2) / halfSteps;
    const landHeight = height / 2;

    const u1Depth = depth - landDepth;
    const tilt1 = Math.atan2(landHeight, u1Depth);
    const yOffset1 = landHeight / 2;

    // 第一段楼梯
    segments.push({
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2 - landDepth),
      tilt: tilt1,
      yOffset: yOffset1
    });

    segments.push({
      from: getWordPos(-slotW / 2, -depth / 2),
      to: getWordPos(-slotW / 2, depth / 2 - landDepth),
      tilt: tilt1,
      yOffset: yOffset1
    });

    // 第二段楼梯
    const tilt2 = Math.atan2(height - landHeight, u1Depth);
    const yOffset2 = landHeight + (height - landHeight) / 2;

    segments.push({
      from: getWordPos(slotW / 2, depth / 2 - landDepth),
      to: getWordPos(slotW / 2, -depth / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });

    segments.push({
      from: getWordPos(width / 2, depth / 2 - landDepth),
      to: getWordPos(width / 2, -depth / 2),
      tilt: tilt2,
      yOffset: yOffset2
    });

    // 平台
    segments.push({
      from: getWordPos(-width / 2, depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt: 0,
      yOffset: landHeight
    });
  } else if (subtype === 'spiral') {
    const radius = Math.max(width, depth) / 2;
    const totalRad = ((stairs.spiralDegrees ?? 360) * Math.PI) / 180;
    const N = Math.max(6, Math.round((totalRad / Math.PI) * 12));

    for (let i = 0; i < N; i++) {
      const angStart = (i / N) * totalRad;
      const angEnd = ((i + 1) / N) * totalRad;

      const lx1 = radius * Math.sin(angStart) * flipX;
      const lz1 = -radius * Math.cos(angStart);
      const y1 = (i / N) * height;

      const lx2 = radius * Math.sin(angEnd) * flipX;
      const lz2 = -radius * Math.cos(angEnd);
      const y2 = ((i + 1) / N) * height;

      const fromPos = getWordPos(lx1, lz1);
      const toPos = getWordPos(lx2, lz2);
      const len = Math.hypot(lx2 - lx1, lz2 - lz1);
      const tilt = Math.atan2(y2 - y1, len);
      const yOffset = (y1 + y2) / 2;

      segments.push({
        from: fromPos,
        to: toPos,
        tilt: tilt,
        yOffset: yOffset
      });
    }
  } else if (subtype === 'curved') {
    const outerR = depth;
    const innerR = Math.max(0.2, depth - width);
    const totalRad = ((stairs.spiralDegrees ?? 90) * Math.PI) / 180;
    const N = Math.max(6, Math.round((totalRad / Math.PI) * 12));

    for (let i = 0; i < N; i++) {
      const angStart = (i / N) * totalRad;
      const angEnd = ((i + 1) / N) * totalRad;
      const y1 = (i / N) * height;
      const y2 = ((i + 1) / N) * height;

      // 外侧
      const olx1 = (-width / 2 + outerR * Math.sin(angStart)) * flipX;
      const olz1 = -depth / 2 + outerR * Math.cos(angStart);
      const olx2 = (-width / 2 + outerR * Math.sin(angEnd)) * flipX;
      const olz2 = -depth / 2 + outerR * Math.cos(angEnd);

      const ofrom = getWordPos(olx1, olz1);
      const oto = getWordPos(olx2, olz2);
      const olen = Math.hypot(olx2 - olx1, olz2 - olz1);
      const otilt = Math.atan2(y2 - y1, olen);
      const oyOffset = (y1 + y2) / 2;

      segments.push({
        from: ofrom,
        to: oto,
        tilt: otilt,
        yOffset: oyOffset
      });

      // 内侧
      const ilx1 = (-width / 2 + innerR * Math.sin(angStart)) * flipX;
      const ilz1 = -depth / 2 + innerR * Math.cos(angStart);
      const ilx2 = (-width / 2 + innerR * Math.sin(angEnd)) * flipX;
      const ilz2 = -depth / 2 + innerR * Math.cos(angEnd);

      const ifrom = getWordPos(ilx1, ilz1);
      const ito = getWordPos(ilx2, ilz2);
      const ilen = Math.hypot(ilx2 - ilx1, ilz2 - ilz1);
      const itilt = Math.atan2(y2 - y1, ilen);
      const iyOffset = (y1 + y2) / 2;

      segments.push({
        from: ifrom,
        to: ito,
        tilt: itilt,
        yOffset: iyOffset
      });
    }
  } else {
    const tilt = Math.atan2(height, depth);
    const yOffset = height / 2;

    segments.push({
      from: getWordPos(-width / 2, -depth / 2),
      to: getWordPos(-width / 2, depth / 2),
      tilt,
      yOffset
    });

    segments.push({
      from: getWordPos(width / 2, -depth / 2),
      to: getWordPos(width / 2, depth / 2),
      tilt,
      yOffset
    });
  }

  return segments;
}

/**
 * 寻找与目标物体在水平投影（XZ 平面）上重合或靠近的储物架（如实用书架、鞋架、展示柜、格子柜、转角架）
 * @param {Object} item 目标物品
 * @param {Array<Object>} items 全局物品列表
 * @param {string} currentFloorId 当前楼层ID
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {Object|null} 靠近的储物架对象
 */
export function findBookshelfNearby(item, items, currentFloorId, getFurnitureDefinition) {
  let nearestBookshelf = null;
  let minDistance = Infinity;
  
  const allItems = items || [];
  const itemFloorId = item.floorId || currentFloorId;
  const snapMargin = 0.30; // 30 厘米吸附判定宽容度，显著降低拖拽偏差导致吸附失败的概率

  const supportedTypes = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'];

  for (const other of allItems) {
    if (other.id === item.id) continue;
    if (other.floorId !== itemFloorId) continue;
    
    const otherDef = getFurnitureDefinition(other.type);
    if (!otherDef || !supportedTypes.includes(otherDef.type)) continue;
    
    const cx = other.x;
    const cz = other.z;
    const angle = other.rotation || 0;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    // 转换至储物架的局部坐标系
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    const size = getItemSizeInMetres(other, otherDef);
    const halfW = size.width / 2;
    const halfD = size.depth / 2;
    
    // 如果小物体在储物架投影范围内（加上宽容裕量）
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      const dist = Math.hypot(localX, localZ);
      if (dist < minDistance) {
        minDistance = dist;
        nearestBookshelf = other;
      }
    }
  }
  return nearestBookshelf;
}

/**
 * 计算物品吸附到储物架时的世界坐标和旋转
 * @param {Object} item 待吸附物品
 * @param {Object} bookshelf 目标储物架
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {Object|null} 吸附后的坐标姿态 { x, z, elevation, rotation }
 */
export function snapToBookshelf(item, bookshelf, getFurnitureDefinition) {
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return null;
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const bWidth = bSize.width;
  
  // 换算为世界 y 高度（米）列表
  const worldShelvesY = getShelfLayerHeights(bookshelf, getFurnitureDefinition);
  if (worldShelvesY.length === 0) return null;
  
  // 小物体当前的世界 Y 坐标（米）
  const itemYWorld = item.elevation || 0;
  
  // 寻找最接近的搁板表面高度
  let closestShelfY = worldShelvesY[0];
  let minDiff = Infinity;
  worldShelvesY.forEach(y => {
    const diff = Math.abs(itemYWorld - y);
    if (diff < minDiff) {
      minDiff = diff;
      closestShelfY = y;
    }
  });
  
  // 限制 X, Z 局部坐标
  const cx = bookshelf.x;
  const cz = bookshelf.z;
  const angle = bookshelf.rotation || 0;
  
  const dx = item.x - cx;
  const dz = item.z - cz;
  
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const localX = dx * cos - dz * sin;
  
  // 根据不同类型限制宽度 and 深度
  let clampedLocalX = localX;
  let clampedLocalZ = 0.0; // 默认锁定在搁板深度正中线（局部Z = 0）
  
  const scale = bookshelf.scale || 1;
  if (bookshelfDef.type === 'corner_shelf') {
    const maxLocalX = bWidth / 2 - 0.02 * scale;
    clampedLocalX = Math.max(-maxLocalX, Math.min(maxLocalX, localX));
    clampedLocalZ = 0.0;
  } else {
    // 排除两边侧外框板的厚度（防止溢出），锁定在搁板中线上
    const sideWallT = (bookshelfDef.type === 'shoerack' ? 0.03 : 0.04) * scale;
    const maxLocalX = bWidth / 2 - sideWallT;
    clampedLocalX = Math.max(-maxLocalX, Math.min(maxLocalX, localX));
    clampedLocalZ = 0.0;
  }
  
  // 变换回世界坐标
  const cosRot = Math.cos(angle);
  const sinRot = Math.sin(angle);
  const worldX = cx + clampedLocalX * cosRot + clampedLocalZ * sinRot;
  const worldZ = cz - clampedLocalX * sinRot + clampedLocalZ * cosRot;
  const worldY = closestShelfY;
  
  return {
    x: Number(worldX.toFixed(3)),
    z: Number(worldZ.toFixed(3)),
    elevation: Number(worldY.toFixed(3)),
    rotation: angle
  };
}

/**
 * 获取储物架（书架、展示架等）上所有可放置的物理层高列表（米，已包含书架本身的 elevation）
 * @param {Object} bookshelf 目标储物架
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {Array<number>} 层高列表
 */
export function getShelfLayerHeights(bookshelf, getFurnitureDefinition) {
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return [];
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const bHeight = bSize.height;
  
  let localShelvesY = [];
  const scale = bookshelf.scale || 1;
  if (bookshelfDef.type === 'bookshelf') {
    // 实用书架：底座0.06m，隔板厚度0.03m（表面在其上方0.015m），比例 0.25, 0.50, 0.75，顶面1.0
    localShelvesY = [
      0.06 * scale,
      bHeight * 0.25 + 0.015 * scale,
      bHeight * 0.50 + 0.015 * scale,
      bHeight * 0.75 + 0.015 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'shoerack') {
    // 矮鞋架：比例 0.32, 0.72，搁板厚度0.02m（表面在其上方0.01m），顶面1.0
    localShelvesY = [
      0.0,
      bHeight * 0.32 + 0.01 * scale,
      bHeight * 0.72 + 0.01 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'display_cabinet') {
    // 玻璃展示柜：比例 0.28, 0.52, 0.76，层板厚度0.02m，顶面1.0
    localShelvesY = [
      0.04 * scale, // 底部外框底面高约 0.04m
      bHeight * 0.28 + 0.01 * scale,
      bHeight * 0.52 + 0.01 * scale,
      bHeight * 0.76 + 0.01 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'grid_cabinet') {
    // 九宫格柜：比例 0.33, 0.66，隔板厚度0.02m，顶面1.0
    localShelvesY = [
      0.03 * scale, // 底部外框厚度约 0.03m
      bHeight * 0.33 + 0.01 * scale,
      bHeight * 0.66 + 0.01 * scale,
      bHeight
    ];
  } else if (bookshelfDef.type === 'corner_shelf') {
    // 转角置物架：比例 0.15, 0.40, 0.65, 0.90，层板厚度0.02m
    localShelvesY = [
      bHeight * 0.15 + 0.01 * scale,
      bHeight * 0.40 + 0.01 * scale,
      bHeight * 0.65 + 0.01 * scale,
      bHeight * 0.90 + 0.01 * scale
    ];
  } else {
    // 默认 fallback
    localShelvesY = [0, bHeight];
  }
  
  const bElevationWorld = bookshelf.elevation || 0; // 米
  return localShelvesY.map(y => bElevationWorld + y);
}

/**
 * 统计目前已摆放在指定储物柜投影范围内的物品数量
 * @param {Object} bookshelf 目标储物架
 * @param {Array<Object>} items 全局物品列表
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {number} 摆放物体的数量
 */
export function getItemsCountOnBookshelf(bookshelf, items, getFurnitureDefinition) {
  let count = 0;
  const allItems = items || [];
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return 0;
  
  const cx = bookshelf.x;
  const cz = bookshelf.z;
  const angle = bookshelf.rotation || 0;
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const halfW = bSize.width / 2;
  const halfD = bSize.depth / 2;
  const snapMargin = 0.0; // 仅统计书架轮廓内部的物件，防止对隔壁贴拢的书架产生干扰
  
  for (const item of allItems) {
    if (item.id === bookshelf.id) continue;
    const itemDef = getFurnitureDefinition(item.type);
    if (!itemDef) continue;
    if (!canPlaceOnTable(item, itemDef)) continue;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      count++;
    }
  }
  return count;
}

/**
 * 找出目前摆放在指定储物柜投影范围内的所有物品对象
 * @param {Object} bookshelf 目标储物架
 * @param {Array<Object>} items 全局物品列表
 * @param {Function} getFurnitureDefinition 获取家具定义的函数
 * @returns {Array<Object>} 摆放物体的列表
 */
export function getItemsOnBookshelf(bookshelf, items, getFurnitureDefinition) {
  const result = [];
  const allItems = items || [];
  const bookshelfDef = getFurnitureDefinition(bookshelf.type);
  if (!bookshelfDef) return [];
  
  const cx = bookshelf.x;
  const cz = bookshelf.z;
  const angle = bookshelf.rotation || 0;
  
  const bSize = getItemSizeInMetres(bookshelf, bookshelfDef);
  const halfW = bSize.width / 2;
  const halfD = bSize.depth / 2;
  const snapMargin = 0.0; // 仅联动属于本柜架轮廓内部的物件，决不连带隔壁柜架上的邻近物件
  
  const topElevation = (bookshelf.elevation || 0) + bSize.height;
  const bottomElevation = bookshelf.elevation || 0;

  for (const item of allItems) {
    if (item.id === bookshelf.id) continue;
    const itemDef = getFurnitureDefinition(item.type);
    if (!itemDef) continue;
    if (!canPlaceOnTable(item, itemDef)) continue;
    
    // 增加高程范围判定，防止把非本柜架上的邻近、地面重叠或高处物件误吸附随动
    const itemElev = item.elevation || 0;
    if (itemElev < bottomElevation + 0.1 || itemElev > topElevation + 5.0) continue;
    
    const dx = item.x - cx;
    const dz = item.z - cz;
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    
    if (Math.abs(localX) <= halfW + snapMargin && Math.abs(localZ) <= halfD + snapMargin) {
      result.push(item);
    }
  }
  return result;
}
