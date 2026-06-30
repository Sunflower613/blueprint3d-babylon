import { getRoomVertices } from '../rooms/index.js';
import {
  floorEntities,
  floorPrefix,
  itemCorners,
  itemSize,
  orderedFloors,
  pointAlongWall,
  safeName,
  wallBasis,
  wallOpeningSpans,
  DEFAULT_WALL_THICKNESS
} from './exporterUtils.js';

const PRECISION = 5;

function pair(code, value) {
  return `${code}\n${value}\n`;
}

function number(value) {
  const rounded = Number(Number(value || 0).toFixed(PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function textValue(value) {
  return String(value || '').replace(/[\u0080-\uFFFF]/g, (char) => `\\U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
}

function line(x1, z1, x2, z2, layer) {
  return pair(0, 'LINE') + pair(8, layer)
    + pair(10, number(x1)) + pair(20, number(z1)) + pair(30, 0)
    + pair(11, number(x2)) + pair(21, number(z2)) + pair(31, 0);
}

function circle(x, z, radius, layer) {
  return pair(0, 'CIRCLE') + pair(8, layer)
    + pair(10, number(x)) + pair(20, number(z)) + pair(30, 0) + pair(40, number(radius));
}

function arc(x, z, radius, startAngle, endAngle, layer) {
  return pair(0, 'ARC') + pair(8, layer)
    + pair(10, number(x)) + pair(20, number(z)) + pair(30, 0)
    + pair(40, number(radius)) + pair(50, number(startAngle)) + pair(51, number(endAngle));
}

function text(x, z, value, layer, options = {}) {
  return pair(0, 'TEXT') + pair(8, layer)
    + pair(10, number(x)) + pair(20, number(z)) + pair(30, 0)
    + pair(40, number(options.height ?? 0.2)) + pair(1, textValue(value))
    + pair(50, number(options.rotation || 0)) + pair(7, 'STANDARD');
}

function polygonArea(vertices) {
  return Math.abs(vertices.reduce((sum, point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return sum + point.x * next.z - next.x * point.z;
  }, 0)) / 2;
}

function shortArcAngles(fromAngle, toAngle) {
  const normalize = (angle) => ((angle % 360) + 360) % 360;
  const from = normalize(fromAngle);
  const to = normalize(toAngle);
  return (from - to + 360) % 360 <= 180 ? [to, from] : [from, to];
}

function layerSet(index) {
  const prefix = floorPrefix(index);
  return {
    wall: `${prefix}-A-WALL`,
    wallCenter: `${prefix}-A-WALL-CNTR`,
    door: `${prefix}-A-DOOR`,
    window: `${prefix}-A-WIND`,
    room: `${prefix}-A-ROOM`,
    furniture: `${prefix}-A-FURN`,
    plant: `${prefix}-A-FLOR-PLNT`,
    text: `${prefix}-A-ANNO`,
    roomText: `${prefix}-A-ROOM-ANNO`,
    furnitureText: `${prefix}-A-FURN-ANNO`,
    dimension: `${prefix}-A-DIMS`,
    stair: `${prefix}-A-STAIR`,
    roof: `${prefix}-A-ROOF`,
    fence: `${prefix}-A-FENCE`
  };
}

function layerDefinitions(floors) {
  const definitions = [];
  floors.forEach((_, index) => {
    const layers = layerSet(index);
    definitions.push(
      { name: layers.wall, color: 7 },
      { name: layers.wallCenter, color: 8, lineType: 'DASHED' },
      { name: layers.door, color: 30 },
      { name: layers.window, color: 4 },
      { name: layers.room, color: 3 },
      { name: layers.furniture, color: 9 },
      { name: layers.plant, color: 3 },
      { name: layers.text, color: 7 },
      { name: layers.roomText, color: 7 },
      { name: layers.furnitureText, color: 8 },
      { name: layers.dimension, color: 6 },
      { name: layers.stair, color: 30 },
      { name: layers.roof, color: 8, lineType: 'DASHED' },
      { name: layers.fence, color: 32 }
    );
  });
  return definitions;
}

function drawDoor(span, basis, thickness, layers) {
  const hingeAtEnd = !!span.opening.isFlippedLR;
  const hingeDistance = hingeAtEnd ? span.end : span.start;
  const hinge = pointAlongWall(basis, hingeDistance);
  const swingSign = span.opening.isFlippedIO ? -1 : 1;
  const width = span.end - span.start;
  const leafEnd = {
    x: hinge.x + basis.nx * width * swingSign,
    z: hinge.z + basis.nz * width * swingSign
  };
  const closedDirection = hingeAtEnd ? { x: -basis.ux, z: -basis.uz } : { x: basis.ux, z: basis.uz };
  const closedAngle = Math.atan2(closedDirection.z, closedDirection.x) * 180 / Math.PI;
  const openAngle = Math.atan2(basis.nz * swingSign, basis.nx * swingSign) * 180 / Math.PI;
  const [arcStart, arcEnd] = shortArcAngles(closedAngle, openAngle);
  return line(hinge.x, hinge.z, leafEnd.x, leafEnd.z, layers.door)
    + circle(hinge.x, hinge.z, Math.min(0.035, thickness / 5), layers.door)
    + arc(hinge.x, hinge.z, width, arcStart, arcEnd, layers.door);
}

function drawWindow(span, basis, thickness, layers) {
  let result = '';
  for (const offset of [-thickness / 4, 0, thickness / 4]) {
    const a = pointAlongWall(basis, span.start, offset);
    const b = pointAlongWall(basis, span.end, offset);
    result += line(a.x, a.z, b.x, b.z, layers.window);
  }
  const middle = (span.start + span.end) / 2;
  const a = pointAlongWall(basis, middle, -thickness / 2);
  const b = pointAlongWall(basis, middle, thickness / 2);
  return result + line(a.x, a.z, b.x, b.z, layers.window);
}

function drawDimension(basis, thickness, layer, centerX = 0, centerZ = 0, offsetDistance = 1.0, startDist = 0, endDist = null, fontSize = 0.12) {
  const len = endDist === null ? basis.length : endDist;
  const segmentLength = len - startDist;
  
  // 墙中点
  const wallMidX = basis.x1 + basis.ux * (basis.length / 2);
  const wallMidZ = basis.z1 + basis.uz * (basis.length / 2);
  
  // 正法向点到重心的距离
  const p1_x = wallMidX + basis.nx * offsetDistance;
  const p1_z = wallMidZ + basis.nz * offsetDistance;
  const d1_sq = (p1_x - centerX) ** 2 + (p1_z - centerZ) ** 2;
  
  // 负法向点到重心的距离
  const p2_x = wallMidX - basis.nx * offsetDistance;
  const p2_z = wallMidZ - basis.nz * offsetDistance;
  const d2_sq = (p2_x - centerX) ** 2 + (p2_z - centerZ) ** 2;
  
  // 选择远离重心的一侧（即室外方向）
  const dirSign = d1_sq >= d2_sq ? 1 : -1;
  const offset = offsetDistance * dirSign;
  
  const wallStart = pointAlongWall(basis, startDist, (thickness / 2) * dirSign);
  const wallEnd = pointAlongWall(basis, len, (thickness / 2) * dirSign);
  const a = pointAlongWall(basis, startDist, offset);
  const b = pointAlongWall(basis, len, offset);
  const tick = 0.08;
  const tickLine = (point) => line(
    point.x - basis.ux * tick + basis.nx * tick * dirSign,
    point.z - basis.uz * tick + basis.nz * tick * dirSign,
    point.x + basis.ux * tick - basis.nx * tick * dirSign,
    point.z + basis.uz * tick - basis.nz * tick * dirSign,
    layer
  );
  let angle = Math.atan2(basis.uz, basis.ux) * 180 / Math.PI;
  if (angle > 90 || angle < -90) angle += 180;
  
  const mmVal = Math.round(segmentLength * 1000);
  const mmStr = String(mmVal);
  const textWidthEst = mmStr.length * fontSize * 0.55;
  
  const middle = pointAlongWall(basis, startDist + segmentLength / 2, offset + 0.07 * dirSign);
  const rad = angle * Math.PI / 180;
  const textX = middle.x - Math.cos(rad) * (textWidthEst / 2) - Math.sin(rad) * (fontSize / 2);
  const textZ = middle.z - Math.sin(rad) * (textWidthEst / 2) + Math.cos(rad) * (fontSize / 2);

  let result = line(wallStart.x, wallStart.z, a.x, a.z, layer)
    + line(wallEnd.x, wallEnd.z, b.x, b.z, layer)
    + line(a.x, a.z, b.x, b.z, layer)
    + tickLine(a) + tickLine(b);
    
  if (segmentLength >= 0.25) {
    result += text(textX, textZ, mmStr, layer, { height: fontSize, rotation: angle });
  }
  return result;
}

function makeOpeningCode(opening) {
  const prefix = opening.type === 'door' ? 'M' : 'C';
  const w = Number(opening.width || 0);
  const h = Number(opening.height || 0);
  const wVal = Math.round(w * 10);
  const hVal = Math.round(h * 10);
  const wStr = wVal.toString().padStart(2, '0');
  const hStr = hVal.toString().padStart(2, '0');
  return `${prefix}${wStr}${hStr}`;
}

function drawWall(floorplan, wall, layers, centerX = 0, centerZ = 0) {
  const basis = wallBasis(wall);
  if (!basis) return '';
  const thickness = Math.max(0.02, Number(wall.thickness ?? floorplan.wallThickness ?? DEFAULT_WALL_THICKNESS));
  const half = thickness / 2;
  const spans = wallOpeningSpans(floorplan, wall, basis);
  let result = '';

  for (const offset of [-half, half]) {
    let cursor = 0;
    for (const span of spans) {
      if (span.start > cursor) {
        const a = pointAlongWall(basis, cursor, offset);
        const b = pointAlongWall(basis, span.start, offset);
        result += line(a.x, a.z, b.x, b.z, layers.wall);
      }
      cursor = Math.max(cursor, span.end);
    }
    if (cursor < basis.length) {
      const a = pointAlongWall(basis, cursor, offset);
      const b = pointAlongWall(basis, basis.length, offset);
      result += line(a.x, a.z, b.x, b.z, layers.wall);
    }
  }

  const startA = pointAlongWall(basis, 0, -half);
  const startB = pointAlongWall(basis, 0, half);
  const endA = pointAlongWall(basis, basis.length, -half);
  const endB = pointAlongWall(basis, basis.length, half);
  result += line(startA.x, startA.z, startB.x, startB.z, layers.wall);
  result += line(endA.x, endA.z, endB.x, endB.z, layers.wall);
  result += line(basis.x1, basis.z1, basis.x2, basis.z2, layers.wallCenter);

  // 计算重心极性 (dirSign) 用于门窗文字偏置朝向室外
  const wallMidX = basis.x1 + basis.ux * (basis.length / 2);
  const wallMidZ = basis.z1 + basis.uz * (basis.length / 2);
  const testDist = thickness / 2 + 1.0;
  const p1_x = wallMidX + basis.nx * testDist;
  const p1_z = wallMidZ + basis.nz * testDist;
  const d1_sq = (p1_x - centerX) ** 2 + (p1_z - centerZ) ** 2;
  const p2_x = wallMidX - basis.nx * testDist;
  const p2_z = wallMidZ - basis.nz * testDist;
  const d2_sq = (p2_x - centerX) ** 2 + (p2_z - centerZ) ** 2;
  const dirSign = d1_sq >= d2_sq ? 1 : -1;

  for (const span of spans) {
    const jamb1A = pointAlongWall(basis, span.start, -half);
    const jamb1B = pointAlongWall(basis, span.start, half);
    const jamb2A = pointAlongWall(basis, span.end, -half);
    const jamb2B = pointAlongWall(basis, span.end, half);
    const symbolLayer = span.opening.type === 'door' ? layers.door : layers.window;
    result += line(jamb1A.x, jamb1A.z, jamb1B.x, jamb1B.z, symbolLayer);
    result += line(jamb2A.x, jamb2A.z, jamb2B.x, jamb2B.z, symbolLayer);
    result += span.opening.type === 'door'
      ? drawDoor(span, basis, thickness, layers)
      : drawWindow(span, basis, thickness, layers);

    // 绘制门窗代号 (M0921, C2427)
    const code = makeOpeningCode(span.opening);
    let angle = Math.atan2(basis.uz, basis.ux) * 180 / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;
    
    const textHeight = 0.10;
    const textWidthEst = code.length * textHeight * 0.55;
    
    // 往室外侧偏移，且避开窗体轮廓线 (offset = thickness/2 + 0.12)
    const offsetText = (thickness / 2 + 0.12) * dirSign;
    const textCenter = pointAlongWall(basis, (span.start + span.end) / 2, offsetText);
    
    const rad = angle * Math.PI / 180;
    const textX = textCenter.x - Math.cos(rad) * (textWidthEst / 2) - Math.sin(rad) * (textHeight / 2);
    const textZ = textCenter.z - Math.sin(rad) * (textWidthEst / 2) + Math.cos(rad) * (textHeight / 2);
    
    result += text(textX, textZ, code, layers.text, { height: textHeight, rotation: angle });
  }

  // 计算多层标注偏置距离
  const innerOffset = thickness / 2 + 0.6; // 细部标注
  const outerOffset = thickness / 2 + 1.1; // 总尺寸标注

  if (spans.length > 0) {
    const sortedSpans = [...spans].sort((a, b) => a.start - b.start);
    let cursor = 0;
    
    // 1. 绘制第一道：门窗及墙体细分标注线
    for (const span of sortedSpans) {
      if (span.start > cursor) {
        result += drawDimension(basis, thickness, layers.dimension, centerX, centerZ, innerOffset, cursor, span.start, 0.11);
      }
      result += drawDimension(basis, thickness, layers.dimension, centerX, centerZ, innerOffset, span.start, span.end, 0.11);
      cursor = Math.max(cursor, span.end);
    }
    if (cursor < basis.length) {
      result += drawDimension(basis, thickness, layers.dimension, centerX, centerZ, innerOffset, cursor, basis.length, 0.11);
    }
    
    // 2. 绘制第二道：总长标注线
    result += drawDimension(basis, thickness, layers.dimension, centerX, centerZ, outerOffset, 0, basis.length, 0.14);
  } else {
    // 若无开孔，仅绘制一道总长标注线
    result += drawDimension(basis, thickness, layers.dimension, centerX, centerZ, outerOffset, 0, basis.length, 0.14);
  }
  return result;
}

function drawStairs(stairs, layer) {
  const width = Number(stairs.width || 1.2);
  const depth = Number(stairs.depth || 3.2);
  const rotation = Number(stairs.rotation || 0);
  const x = Number(stairs.x || 0);
  const z = Number(stairs.z || 0);
  
  const nameLower = (stairs.name || stairs.id || '').toLowerCase();
  const isSpiral = nameLower.includes('旋转') || nameLower.includes('spiral') || nameLower.includes('round') || nameLower.includes('圆') || nameLower.includes('旋');

  if (isSpiral) {
    let result = '';
    const r = Math.min(width, depth) / 2;
    // 楼梯外圆
    result += circle(x, z, r, layer);
    // 中心立柱圆
    result += circle(x, z, r * 0.15, layer);
    
    // 绘制 12 步辐射台阶
    const stepsCount = 12;
    for (let i = 0; i < stepsCount; i++) {
      const angle = rotation + (i / stepsCount) * 2 * Math.PI;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const xStart = x + cos * (r * 0.15);
      const zStart = z + sin * (r * 0.15);
      const xEnd = x + cos * r;
      const zEnd = z + sin * r;
      
      result += line(xStart, zStart, xEnd, zEnd, layer);
    }
    
    return result + text(x, z, 'UP', layer, { height: 0.16, rotation: rotation * 180 / Math.PI });
  }

  const transform = (xOffset, zOffset) => {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return { x: x + xOffset * c - zOffset * s, z: z + xOffset * s + zOffset * c };
  };
  let result = '';
  const corners = [transform(-width / 2, -depth / 2), transform(width / 2, -depth / 2), transform(width / 2, depth / 2), transform(-width / 2, depth / 2)];
  corners.forEach((point, index) => {
    const next = corners[(index + 1) % corners.length];
    result += line(point.x, point.z, next.x, next.z, layer);
  });
  const steps = Math.max(3, Number(stairs.steps || 9));
  for (let i = 1; i < steps; i += 1) {
    const zVal = -depth / 2 + depth * i / steps;
    const a = transform(-width / 2, zVal);
    const b = transform(width / 2, zVal);
    result += line(a.x, a.z, b.x, b.z, layer);
  }
  const arrowA = transform(0, -depth * 0.32);
  const arrowB = transform(0, depth * 0.32);
  return result + line(arrowA.x, arrowA.z, arrowB.x, arrowB.z, layer)
    + text(x, z, 'UP', layer, { height: 0.16, rotation: rotation * 180 / Math.PI });
}

function drawSimpleStructures(floorplan, floorId, layers) {
  let result = '';
  for (const stairs of floorEntities(floorplan, 'stairs', floorId)) result += drawStairs(stairs, layers.stair);
  for (const roof of floorEntities(floorplan, 'roofs', floorId)) {
    const halfW = Number(roof.width || 6) / 2;
    const halfD = Number(roof.depth || 6) / 2;
    const x = Number(roof.x || 0);
    const z = Number(roof.z || 0);
    result += line(x - halfW, z - halfD, x + halfW, z - halfD, layers.roof)
      + line(x + halfW, z - halfD, x + halfW, z + halfD, layers.roof)
      + line(x + halfW, z + halfD, x - halfW, z + halfD, layers.roof)
      + line(x - halfW, z + halfD, x - halfW, z - halfD, layers.roof)
      + line(x - halfW, z, x + halfW, z, layers.roof);
  }
  for (const fence of floorEntities(floorplan, 'fences', floorId)) {
    const basis = wallBasis(fence);
    if (!basis) continue;
    const half = Math.max(0.02, Number(fence.thickness || 0.1)) / 2;
    for (const offset of [-half, half]) {
      const a = pointAlongWall(basis, 0, offset);
      const b = pointAlongWall(basis, basis.length, offset);
      result += line(a.x, a.z, b.x, b.z, layers.fence);
    }
  }
  return result;
}

function tablesSection(definitions) {
  let result = pair(0, 'SECTION') + pair(2, 'TABLES');
  result += pair(0, 'TABLE') + pair(2, 'LTYPE') + pair(70, 2);
  result += pair(0, 'LTYPE') + pair(2, 'CONTINUOUS') + pair(70, 0) + pair(3, 'Solid line') + pair(72, 65) + pair(73, 0) + pair(40, 0);
  result += pair(0, 'LTYPE') + pair(2, 'DASHED') + pair(70, 0) + pair(3, 'Dashed line') + pair(72, 65) + pair(73, 2) + pair(40, 0.3) + pair(49, 0.2) + pair(49, -0.1);
  result += pair(0, 'ENDTAB');
  result += pair(0, 'TABLE') + pair(2, 'LAYER') + pair(70, definitions.length);
  for (const layer of definitions) {
    result += pair(0, 'LAYER') + pair(2, layer.name) + pair(70, 0) + pair(62, layer.color) + pair(6, layer.lineType || 'CONTINUOUS');
  }
  result += pair(0, 'ENDTAB');
  result += pair(0, 'TABLE') + pair(2, 'STYLE') + pair(70, 1);
  result += pair(0, 'STYLE') + pair(2, 'STANDARD') + pair(70, 0) + pair(40, 0) + pair(41, 1) + pair(50, 0) + pair(71, 0) + pair(42, 0.2) + pair(3, 'Microsoft YaHei') + pair(4, '');
  return result + pair(0, 'ENDTAB') + pair(0, 'ENDSEC');
}

export function stringifyDXF(floorplan) {
  const floors = orderedFloors(floorplan);
  
  // 计算户型端点的几何重心 (centerX, centerZ) 用来判别尺寸线向外偏移的方向
  let sumX = 0;
  let sumZ = 0;
  let count = 0;
  floors.forEach((floor) => {
    for (const wall of floorEntities(floorplan, 'walls', floor.id)) {
      if (wall.from && wall.to) {
        sumX += wall.from[0] + wall.to[0];
        sumZ += wall.from[1] + wall.to[1];
        count += 2;
      }
    }
  });
  const centerX = count > 0 ? sumX / count : 0;
  const centerZ = count > 0 ? sumZ / count : 0;

  let entities = '';
  floors.forEach((floor, index) => {
    const layers = layerSet(index);
    entities += pair(999, `${floorPrefix(index)} = ${floor.name || floor.id} (level ${Number(floor.level || 0)})`);
    for (const room of floorEntities(floorplan, 'rooms', floor.id)) {
      const vertices = getRoomVertices(room);
      vertices.forEach((point, vertexIndex) => {
        const next = vertices[(vertexIndex + 1) % vertices.length];
        entities += line(point.x, point.z, next.x, next.z, layers.room);
      });
      
      const nameLabel = room.name || room.id || '';
      const nameH = 0.20;
      const nameLen = nameLabel.length;
      const hasChineseName = /[\u4e00-\u9fa5]/.test(nameLabel);
      const nameW = nameLen * nameH * (hasChineseName ? 0.95 : 0.6);
      
      const areaLabel = `${polygonArea(vertices).toFixed(2)} ㎡`;
      const areaH = 0.14;
      const areaLen = areaLabel.length;
      const areaW = areaLen * areaH * 0.55;
      
      entities += text(Number(room.x || 0) - nameW / 2, Number(room.z || 0) + 0.05, nameLabel, layers.roomText, { height: nameH });
      entities += text(Number(room.x || 0) - areaW / 2, Number(room.z || 0) - 0.23, areaLabel, layers.roomText, { height: areaH });
    }
    for (const wall of floorEntities(floorplan, 'walls', floor.id)) entities += drawWall(floorplan, wall, layers, centerX, centerZ);
    for (const item of floorEntities(floorplan, 'items', floor.id)) {
      const size = itemSize(item);
      const corners = itemCorners(item);
      const nameLower = (item.name || item.type || '').toLowerCase();
      
      const isPlant = nameLower.includes('植') || nameLower.includes('花') || nameLower.includes('盆') || nameLower.includes('竹') || nameLower.includes('plant') || nameLower.includes('flower') || nameLower.includes('vegetation') || nameLower.includes('bonsai');
      const isRug = nameLower.includes('地毯') || nameLower.includes('垫') || nameLower.includes('rug') || nameLower.includes('carpet') || nameLower.includes('mat');
      const isCabinet = nameLower.includes('柜') || nameLower.includes('柜子') || nameLower.includes('衣柜') || nameLower.includes('cabinet') || nameLower.includes('wardrobe') || nameLower.includes('tv') || nameLower.includes('sideboard');
      const isTable = nameLower.includes('桌') || nameLower.includes('几') || nameLower.includes('台') || nameLower.includes('table') || nameLower.includes('desk');
      const isSofa = nameLower.includes('沙发') || nameLower.includes('椅') || nameLower.includes('凳') || nameLower.includes('sofa') || nameLower.includes('chair') || nameLower.includes('bench') || nameLower.includes('couch');
      const isBed = nameLower.includes('床') || nameLower.includes('bed');

      const toWorld = (lx, lz) => {
        const c = Math.cos(item.rotation || 0);
        const s = Math.sin(item.rotation || 0);
        return {
          x: Number(item.x || 0) + lx * c - lz * s,
          z: Number(item.z || 0) + lx * s + lz * c
        };
      };

      if (isPlant) {
        const r = Math.min(size.width, size.depth) / 2;
        entities += circle(Number(item.x || 0), Number(item.z || 0), r, layers.plant);
        entities += circle(Number(item.x || 0), Number(item.z || 0), r * 0.6, layers.plant);
      } else if (isRug) {
        if (nameLower.includes('圆') || nameLower.includes('circle') || nameLower.includes('round')) {
          const r = Math.min(size.width, size.depth) / 2;
          entities += circle(Number(item.x || 0), Number(item.z || 0), r, layers.furniture);
        } else {
          corners.forEach((point, cornerIndex) => {
            const next = corners[(cornerIndex + 1) % corners.length];
            entities += line(point.x, point.z, next.x, next.z, layers.furniture);
          });
        }
      } else {
        corners.forEach((point, cornerIndex) => {
          const next = corners[(cornerIndex + 1) % corners.length];
          entities += line(point.x, point.z, next.x, next.z, layers.furniture);
        });

        if (isCabinet || isTable) {
          const p1 = toWorld(-size.width / 2, 0);
          const p2 = toWorld(size.width / 2, 0);
          entities += line(p1.x, p1.z, p2.x, p2.z, layers.furniture);
        } else if (isBed) {
          const p1 = toWorld(-size.width / 2, size.depth / 2 - 0.15);
          const p2 = toWorld(size.width / 2, size.depth / 2 - 0.15);
          entities += line(p1.x, p1.z, p2.x, p2.z, layers.furniture);
        } else if (isSofa) {
          const p1 = toWorld(-size.width / 2 + 0.05, size.depth / 2 - 0.12);
          const p2 = toWorld(size.width / 2 - 0.05, size.depth / 2 - 0.12);
          entities += line(p1.x, p1.z, p2.x, p2.z, layers.furniture);
        }
      }

      const labelRaw = item.name || item.type || '';
      const isMini = size.width < 0.6 && size.depth < 0.6;
      
      // 只有非微型家具才绘制文字标签，精炼图面
      if (labelRaw && !isMini) {
        // 简化标签：过滤修饰词与过长文本
        const simplifyLabel = (str) => {
          if (!str) return '';
          let s = String(str)
            .replace(/^(实用|简约|现代|超长|百宝|普通|多用|北欧|绿色|云朵|圆形|椭圆|实木|全身|八人|双门)/g, '');
          s = s.replace(/大/g, ''); // 移除“大”字
          const hasChinese = /[\u4e00-\u9fa5]/.test(s);
          if (hasChinese && s.length > 4) {
            return s.slice(0, 4); // 限制在4个中文字符以内
          } else if (!hasChinese && s.length > 10) {
            return s.slice(0, 8);
          }
          return s;
        };

        const label = simplifyLabel(labelRaw);
        const labelLen = label.length;
        const textHeight = 0.12;
        const hasChinese = /[\u4e00-\u9fa5]/.test(label);
        const charWidthFactor = hasChinese ? 0.9 : 0.55;
        const textWidthEst = labelLen * textHeight * charWidthFactor;
        
        // 检查家具中心是否距离房间中心极近，进行避让
        let isNearRoomCenter = false;
        for (const room of floorEntities(floorplan, 'rooms', floor.id)) {
          const dx = (item.x || 0) - (room.x || 0);
          const dz = (item.z || 0) - (room.z || 0);
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 0.6) {
            isNearRoomCenter = true;
            break;
          }
        }
        
        // 如果离房间名重合，将家具文字沿本地坐标系 Y 轴向下偏置 0.45 米，防止遮挡
        const localY = isNearRoomCenter ? -0.45 : -textHeight / 2;
        const textPos = toWorld(-textWidthEst / 2, localY);
        
        const rotationDeg = Number(item.rotation || 0) * 180 / Math.PI;
        entities += text(
          textPos.x,
          textPos.z,
          label,
          layers.furnitureText,
          { height: textHeight, rotation: rotationDeg }
        );
      }
    }
    entities += drawSimpleStructures(floorplan, floor.id, layers);
  });

  const header = pair(0, 'SECTION') + pair(2, 'HEADER')
    + pair(9, '$ACADVER') + pair(1, 'AC1009')
    + pair(9, '$INSUNITS') + pair(70, 6)
    + pair(9, '$MEASUREMENT') + pair(70, 1)
    + pair(9, '$LUNITS') + pair(70, 2)
    + pair(9, '$LUPREC') + pair(70, 3)
    + pair(0, 'ENDSEC');
  const blocks = pair(0, 'SECTION') + pair(2, 'BLOCKS') + pair(0, 'ENDSEC');
  const entitiesSection = pair(0, 'SECTION') + pair(2, 'ENTITIES') + entities + pair(0, 'ENDSEC');
  return header + tablesSection(layerDefinitions(floors)) + blocks + entitiesSection + pair(0, 'EOF');
}

export function createDXFFileName(name = 'blueprint-building') {
  return `${safeName(name)}-${new Date().toISOString().replace(/[:.]/g, '-')}.dxf`;
}
