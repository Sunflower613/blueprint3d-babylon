import { getRoomVertices } from '../../src/index.js';

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

  let t = Math.max(0.01, Math.min(0.99, ((point.x - ax) * fdx + (point.z - az) * fdz) / lenSq));

  if (snapEnabled && snapSize) {
    const rawCenterX = ax + fdx * t;
    const rawCenterZ = az + fdz * t;
    const snapped = snapToGridSegmentCenter({ x: rawCenterX, z: rawCenterZ }, snapEnabled, snapSize);
    t = Math.max(0.01, Math.min(0.99, ((snapped.x - ax) * fdx + (snapped.z - az) * fdz) / lenSq));
  }

  const projX = ax + fdx * t;
  const projZ = az + fdz * t;
  const distance = Math.hypot(point.x - projX, point.z - projZ);

  return { t, distance };
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
  const category = definition.category;
  if (category === 'seating' || category === 'bedroom' || category === 'kitchen-bath') {
    if (definition.type !== 'cushion') {
      return false;
    }
  }
  if (category === 'tables' || category === 'storage') {
    return false;
  }
  if (category === 'lighting') {
    if (definition.type.includes('floor')) {
      return false;
    }
    if (!definition.type.includes('lamp') && !definition.type.includes('light')) {
      return false;
    }
  }
  
  // 限制尺寸：底面积较小，长宽均在24英寸(60厘米)以下
  const w = item.width || definition.defaultSize.width;
  const d = item.depth || definition.defaultSize.depth;
  if (w > 24 || d > 24) {
    return false;
  }
  return true;
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
    
    const halfW = ((other.width || otherDef.defaultSize.width) * (other.scale || 1)) / (INCHES_PER_UNIT * 2);
    const halfD = ((other.depth || otherDef.defaultSize.depth) * (other.scale || 1)) / (INCHES_PER_UNIT * 2);
    
    if (Math.abs(localX) <= halfW && Math.abs(localZ) <= halfD) {
      const surface = (other.elevation || 0) + (other.height || otherDef.defaultSize.height) * (other.scale || 1);
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
    if (other.id === mannequinItem.id) return;
    const definition = getFurnitureDefinition(other.type);
    if (!definition || !definition.interaction) return;
    
    const otherScale = Number(other.scale || 1);
    const otherSize = {
      width: (other.width / INCHES_PER_UNIT) * otherScale,
      depth: (other.depth / INCHES_PER_UNIT) * otherScale,
      height: (other.height / INCHES_PER_UNIT) * otherScale
    };
    
    const localPoints = definition.interaction.getInteractionPoints(otherSize);
    localPoints.forEach((p, index) => {
      // XZ 平面投影
      const cos = Math.cos(other.rotation || 0);
      const sin = Math.sin(other.rotation || 0);
      const wx = other.x + p.x * cos + p.z * sin;
      const wz = other.z - p.x * sin + p.z * cos;
      const wy = (other.elevation || 0) / INCHES_PER_UNIT + p.y;
      
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

    // 第一跑
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

    // 第二跑
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

    // 第一跑
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

    // 第二跑
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

