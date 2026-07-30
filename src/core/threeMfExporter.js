import { Color3, Vector3, VertexBuffer } from './babylon.js';
const BABYLON = { Color3, Vector3, VertexBuffer };
import { triangulateRoom, pointInRoom } from '../rooms/index.js';
import { getRoofGeometryData } from '../geometry/roofGeometry.js';
import { createRoofCutContext, getCutRoofGeometry } from '../geometry/roofCutGeometry.js';
import {
  DEFAULT_WALL_THICKNESS,
  entityFloorId,
  escXml,
  floorEntities,
  floorPrefix,
  getFloor,
  getFloorElevation,
  getFloorWallRenderHeight,
  getItemRoomElevationOffset,
  itemSize,
  orderedFloors,
  pointAlongWall,
  rotatePoint,
  safeName,
  wallBasis,
  wallOpeningSpans
} from './exporterUtils.js';

function createMesh() {
  return { vertices: [], triangles: [], triangleColors: [] };
}

function boxMesh(cx, cy, cz, width, height, depth) {
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const y0 = cy - height / 2;
  const y1 = cy + height / 2;
  const z0 = cz - depth / 2;
  const z1 = cz + depth / 2;
  return {
    vertices: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    triangles: [[0, 1, 2], [0, 2, 3], [1, 5, 6], [1, 6, 2], [5, 4, 7], [5, 7, 6], [4, 0, 3], [4, 3, 7], [3, 2, 6], [3, 6, 7], [4, 5, 1], [4, 1, 0]],
    triangleColors: []
  };
}

function appendMesh(target, source, colorHex = null) {
  const offset = target.vertices.length;
  target.vertices.push(...source.vertices);
  
  target.triangles.push(...source.triangles.map((triangle) => triangle.map((index) => index + offset)));

  if (target.triangleColors) {
    if (source.triangleColors && source.triangleColors.length) {
      target.triangleColors.push(...source.triangleColors);
    } else {
      const count = source.triangles.length;
      for (let i = 0; i < count; i++) {
        target.triangleColors.push(colorHex);
      }
    }
  }
}

// 辅助计算普通门窗的高程差
function getOpeningElevationOffset(floorplan, opening) {
  const wallId = opening.wallId;
  if (!wallId) return 0;
  const rooms = floorplan.floor?.rooms || [];
  const openingFloorId = opening.floorId;
  let maxElev = 0;
  rooms.forEach((room) => {
    const rFloorId = entityFloorId(floorplan, room);
    if (rFloorId === (openingFloorId || rFloorId)) {
      const hasWall = Object.values(room.wallIds || {}).includes(wallId);
      if (hasWall && Number(room.elevation || 0) > maxElev) {
        maxElev = Number(room.elevation || 0);
      }
    }
  });
  return maxElev;
}

// 辅助提取 Babylon 真实 Mesh 并保留颜色
function appendRealMesh(targetMesh, sceneNode) {
  if (!sceneNode) return false;
  
  // 确保父级节点的世界矩阵已根据当前位置、旋转、缩放属性更新 (安全兼容 Mock 节点)
  if (typeof sceneNode.computeWorldMatrix === 'function') {
    sceneNode.computeWorldMatrix(true);
  }
  
  const childMeshes = sceneNode.getChildMeshes();
  if (!childMeshes || childMeshes.length === 0) return false;
  
  let hasAppended = false;
  for (const child of childMeshes) {
    if (child.isVisible === false || (child.visibility !== undefined && child.visibility < 0.1)) continue;
    if (child.name && (child.name.includes('pick_proxy') || child.name.includes('cutter'))) continue;
    
    // 确保子网格的世界矩阵同样是最新的 (安全兼容 Mock 节点)
    if (typeof child.computeWorldMatrix === 'function') {
      child.computeWorldMatrix(true);
    }
    
    const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = child.getIndices();
    if (positions && indices) {
      const subMesh = createMesh();
      const worldMatrix = child.getWorldMatrix();
      
      for (let i = 0; i < positions.length; i += 3) {
        const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
        subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
      }
      
      for (let i = 0; i < indices.length; i += 3) {
        subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
      }
      
      const colorHex = getColorHex(child.material);
      appendMesh(targetMesh, subMesh, colorHex);
      hasAppended = true;
    }
  }
  return hasAppended;
}

// 辅助颜色格式标准化
function normalizeColorHex(hex) {
  if (!hex) return '#E0E0E0FF';
  let clean = hex.trim().toUpperCase();
  if (!clean.startsWith('#')) {
    clean = '#' + clean;
  }
  if (clean.length === 7) {
    return clean + 'FF';
  }
  if (clean.length === 9) {
    return clean;
  }
  return '#E0E0E0FF';
}

// 辅助从可能为对象或字符串的材质描述符中提取 Hex 颜色
function extractColor(desc, fallback) {
  if (!desc) return fallback;
  if (typeof desc === 'string') return desc;
  if (desc.color) return desc.color;
  return fallback;
}

function addRotatedBox(target, cx, cy, cz, width, height, depth, rotation = 0, colorHex = null) {
  if (width <= 0.00001 || height <= 0.00001 || depth <= 0.00001) return;
  const mesh = boxMesh(0, cy, 0, width, height, depth);
  mesh.vertices = mesh.vertices.map(([x, y, z]) => {
    const rotated = rotatePoint(x, z, rotation);
    return [cx + rotated.x, y, cz + rotated.z];
  });
  appendMesh(target, mesh, colorHex);
}

function appendRoomSlab(mesh, floorplan, room) {
  const floorId = entityFloorId(floorplan, room);
  const floor = getFloor(floorplan, floorId);
  const floorHeight = Number(floor?.floorHeight ?? floorplan.floorHeight ?? 0.2);
  const topY = getFloorElevation(floorplan, floorId) + Number(room.elevation || 0);
  const bottomY = topY - floorHeight;
  const triangulated = triangulateRoom(room);
  const slab = createMesh();
  triangulated.vertices.forEach((point) => slab.vertices.push([Number(room.x || 0) + point.x, topY, Number(room.z || 0) + point.z]));
  triangulated.vertices.forEach((point) => slab.vertices.push([Number(room.x || 0) + point.x, bottomY, Number(room.z || 0) + point.z]));
  const bottomOffset = triangulated.vertices.length;
  triangulated.triangles.forEach(([a, b, c]) => slab.triangles.push([a, c, b], [bottomOffset + a, bottomOffset + b, bottomOffset + c]));
  triangulated.vertices.forEach((_, index) => {
    const next = (index + 1) % triangulated.vertices.length;
    slab.triangles.push([index, next, bottomOffset + next], [index, bottomOffset + next, bottomOffset + index]);
  });
  appendMesh(mesh, slab);
}

function appendWallWithOpenings(mesh, floorplan, wall, extraSpans = []) {
  const basis = wallBasis(wall);
  if (!basis) return;
  const floorId = entityFloorId(floorplan, wall);
  const floor = getFloor(floorplan, floorId);
  const wallHeight = getFloorWallRenderHeight(floorplan, floorId);
  const thickness = Math.max(0.02, Number(wall.thickness ?? floorplan.wallThickness ?? DEFAULT_WALL_THICKNESS));
  const floorY = getFloorElevation(floorplan, floorId);
  const rotation = Math.atan2(basis.uz, basis.ux);
  const spans = wallOpeningSpans(floorplan, wall, basis);

  if (extraSpans && extraSpans.length > 0) {
    extraSpans.forEach(span => {
      spans.push({
        start: span.start,
        end: span.end,
        opening: {
          type: 'door',
          sillHeight: 0,
          height: span.height
        }
      });
    });
    spans.sort((a, b) => a.start - b.start);
  }

  const addSegment = (start, end, bottom, top) => {
    if (end - start <= 0.00001 || top - bottom <= 0.00001) return;
    const center = pointAlongWall(basis, (start + end) / 2);
    addRotatedBox(
      mesh,
      center.x,
      floorY + (bottom + top) / 2,
      center.z,
      end - start,
      top - bottom,
      thickness,
      rotation,
      normalizeColorHex(wall.color || '#f9fbff')
    );
  };

  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) addSegment(cursor, span.start, 0, wallHeight);
    const opening = span.opening;
    const openingOffset = getOpeningElevationOffset(floorplan, opening);
    
    // 对没有 sillHeight 属性的落地大窗默认使用 0 高程
    let sillHeight = opening.sillHeight;
    if (opening.type === 'window' && Number(opening.height) === wallHeight) {
      sillHeight = 0;
    } else if (sillHeight === undefined || sillHeight === null) {
      sillHeight = opening.type === 'door' ? 0 : 1.05;
    }
    sillHeight = Number(sillHeight);

    const openingHeight = Math.max(0.1, Number(opening.height ?? (opening.type === 'door' ? 2.05 : 0.85)));
    const openingBottom = Math.max(0, sillHeight + openingOffset);
    const openingTop = Math.min(wallHeight, openingBottom + openingHeight);
    
    // 检查在落地大窗 sillHeight === 0 且 height === wallHeight 时的墙面片段生成，防止在此区间内输出多余的墙体
    const isFloorToCeiling = (sillHeight === 0 && openingHeight === wallHeight);
    if (!isFloorToCeiling) {
      if (openingBottom > 0.0001) addSegment(span.start, span.end, 0, openingBottom);
      if (openingTop < wallHeight - 0.0001) addSegment(span.start, span.end, openingTop, wallHeight);
    }
    
    cursor = Math.max(cursor, span.end);
  }
  if (cursor < basis.length) addSegment(cursor, basis.length, 0, wallHeight);
}

function appendSimpleStructures(mesh, floorplan, floorId, options = {}) {
  const floorY = getFloorElevation(floorplan, floorId);
  for (const stairs of floorEntities(floorplan, 'stairs', floorId)) {
    const width = Number(stairs.width || 1.2);
    const depth = Number(stairs.depth || 3.2);
    const height = Number(stairs.height || floorplan.storyHeight || 3.06);

    let hasRealMesh = false;
    if (options.testMap && options.testMap.scene) {
      const stairsNode = options.testMap.scene.getNodeByName(`stairs_${stairs.id}`);
      if (stairsNode) {
        const childMeshes = stairsNode.getChildMeshes();
        if (childMeshes && childMeshes.length > 0) {
          hasRealMesh = true;
          for (const child of childMeshes) {
            const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = child.getIndices();
            if (positions && indices) {
              const subMesh = createMesh();
              const worldMatrix = child.getWorldMatrix();
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
              }
              for (let i = 0; i < indices.length; i += 3) {
                subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
              }
              const colorHex = getColorHex(child.material);
              appendMesh(mesh, subMesh, colorHex);
            }
          }
        }
      }
    }

    if (!hasRealMesh) {
      const steps = Math.max(3, Number(stairs.steps || 9));
      const stairsColor = extractColor(stairs.material, stairs.color || '#d8c0a0');
      for (let step = 0; step < steps; step += 1) {
        const stepDepth = depth / steps;
        const stepHeight = height * (step + 1) / steps;
        const localZ = -depth / 2 + stepDepth * (step + 0.5);
        const position = rotatePoint(0, localZ, Number(stairs.rotation || 0));
        addRotatedBox(
          mesh,
          Number(stairs.x || 0) + position.x,
          floorY + stepHeight / 2,
          Number(stairs.z || 0) + position.z,
          width,
          stepHeight,
          stepDepth,
          Number(stairs.rotation || 0),
          normalizeColorHex(stairsColor)
        );
      }
    }
  }

  for (const fence of floorEntities(floorplan, 'fences', floorId)) {
    let hasRealMesh = false;
    if (options.testMap && options.testMap.scene) {
      const fenceNode = options.testMap.scene.getNodeByName(`fence_${fence.id}`);
      if (fenceNode) {
        const childMeshes = fenceNode.getChildMeshes();
        if (childMeshes && childMeshes.length > 0) {
          hasRealMesh = true;
          for (const child of childMeshes) {
            const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = child.getIndices();
            if (positions && indices) {
              const subMesh = createMesh();
              const worldMatrix = child.getWorldMatrix();
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
              }
              for (let i = 0; i < indices.length; i += 3) {
                subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
              }
              const colorHex = getColorHex(child.material);
              appendMesh(mesh, subMesh, colorHex);
            }
          }
        }
      }
    }

    if (!hasRealMesh) {
      const basis = wallBasis(fence);
      if (!basis) continue;
      const center = pointAlongWall(basis, basis.length / 2);
      const height = Number(fence.height || 1.1);
      const fenceColor = extractColor(fence.material, fence.color || '#8d6e63');
      addRotatedBox(
        mesh,
        center.x,
        floorY + Number(fence.yOffset || 0) + height / 2,
        center.z,
        basis.length,
        height,
        Math.max(0.04, Number(fence.thickness || 0.1)),
        Math.atan2(basis.uz, basis.ux),
        normalizeColorHex(fenceColor)
      );
    }
  }

  // 遍历大门 (fenceGates) 并拼装网格
  const gates = (floorplan.fenceGates || []).filter(gate => gate.floorId === floorId);
  for (const gate of gates) {
    let [x1, z1] = gate.from || [0, 0];
    let [x2, z2] = gate.to || [1, 0];

    if (gate.fenceId) {
      const fence = (floorplan.fences || []).find(f => f.id === gate.fenceId);
      if (fence) {
        const [fx1, fz1] = fence.from;
        const [fx2, fz2] = fence.to;
        const dx = fx2 - fx1;
        const dz = fz2 - fz1;
        const fenceLen = Math.sqrt(dx * dx + dz * dz) || 1;
        const halfT = (gate.width || 1.0) / fenceLen / 2;
        const t1 = Math.max(0, gate.t - halfT);
        const t2 = Math.min(1, gate.t + halfT);
        x1 = fx1 + dx * t1;
        z1 = fz1 + dz * t1;
        x2 = fx1 + dx * t2;
        z2 = fz1 + dz * t2;
      }
    }

    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length <= 0.01) continue;

    const angle = Math.atan2(dz, dx);
    const fenceTilt = gate.fenceId ? ((floorplan.fences || []).find(f => f.id === gate.fenceId)?.tilt || 0) : 0;
    const tilt = gate.tilt || fenceTilt;
    const height = Number(gate.height || 1.1);
    const thickness = Number(gate.thickness || 0.08);
    const gateOffset = Number(gate.yOffset || 0);
    const panelColor = extractColor(gate.panelMaterial, gate.panelColor || (gate.subtype === 'concrete' ? '#f9fbff' : '#8d6e63'));

    let hasRealMesh = false;
    if (options.testMap && options.testMap.scene) {
      const gateNode = options.testMap.scene.getNodeByName(`gate_${gate.id}`);
      if (gateNode) {
        const childMeshes = gateNode.getChildMeshes();
        if (childMeshes && childMeshes.length > 0) {
          hasRealMesh = true;
          for (const child of childMeshes) {
            if (child.name.includes('pick_proxy')) continue;
            
            const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = child.getIndices();
            if (positions && indices) {
              const subMesh = createMesh();
              const worldMatrix = child.getWorldMatrix();
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
              }
              for (let i = 0; i < indices.length; i += 3) {
                subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
              }
              const colorHex = getColorHex(child.material);
              appendMesh(mesh, subMesh, colorHex);
            }
          }
        }
      }
    }

    if (!hasRealMesh) {
      let renderLength = length;
      if (tilt) {
        renderLength = length / Math.cos(tilt);
      }

      addRotatedBox(
        mesh,
        (x1 + x2) / 2,
        floorY + gateOffset + height / 2,
        (z1 + z2) / 2,
        renderLength,
        height,
        thickness,
        angle,
        normalizeColorHex(panelColor)
      );
    }

    // 大门地插式榫卯生成
    if (options.enableTenon) {
      const pegHeight = 0.08;
      const socketHeight = 0.10;
      const tWidth = thickness * 0.8;
      const sWidth = thickness * 0.9;
      const startY = floorY + gateOffset;
      
      // 端点 1 榫卯
      addRotatedBox(mesh, x1, startY + pegHeight / 2, z1, tWidth, pegHeight, tWidth, angle, normalizeColorHex(panelColor));
      addRotatedInvertedBox(mesh, x1, startY + socketHeight / 2, z1, sWidth, socketHeight, sWidth, angle);

      // 端点 2 榫卯
      addRotatedBox(mesh, x2, startY + pegHeight / 2, z2, tWidth, pegHeight, tWidth, angle, normalizeColorHex(panelColor));
      addRotatedInvertedBox(mesh, x2, startY + socketHeight / 2, z2, sWidth, socketHeight, sWidth, angle);
    }
  }
}

// 辅助反向 Box Mesh 生成 (用于 3MF 中定义扣减插槽 Socket)
function invertedBoxMesh(cx, cy, cz, width, height, depth) {
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const y0 = cy - height / 2;
  const y1 = cy + height / 2;
  const z0 = cz - depth / 2;
  const z1 = cz + depth / 2;
  return {
    vertices: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    triangles: [[0, 2, 1], [0, 3, 2], [1, 6, 5], [1, 2, 6], [5, 7, 4], [5, 6, 7], [4, 3, 0], [4, 7, 3], [3, 6, 2], [3, 7, 6], [4, 1, 5], [4, 0, 1]],
    triangleColors: []
  };
}

function addRotatedInvertedBox(target, cx, cy, cz, width, height, depth, rotation = 0) {
  if (width <= 0.00001 || height <= 0.00001 || depth <= 0.00001) return;
  const mesh = invertedBoxMesh(0, cy, 0, width, height, depth);
  mesh.vertices = mesh.vertices.map(([x, y, z]) => {
    const rotated = rotatePoint(x, z, rotation);
    return [cx + rotated.x, y, cz + rotated.z];
  });
  appendMesh(target, mesh);
}

// 辅助拆分 indices 方法
function chunkIndices(indices) {
  const chunks = [];
  for (let i = 0; i < indices.length; i += 3) {
    chunks.push([indices[i], indices[i + 1], indices[i + 2]]);
  }
  return chunks;
}

// 拼接屋顶 (Roofs) 网格数据
function appendRoofs(mesh, floorplan, floorId, options = {}) {
  const floorY = getFloorElevation(floorplan, floorId);
  const floor = getFloor(floorplan, floorId);
  const defaultWallHeight = Number(floor?.wallHeight ?? floorplan.wallHeight ?? 2.8);
  const cutContext = options.roofCutContext || createRoofCutContext(floorplan);

  for (const roof of floorEntities(floorplan, 'roofs', floorId)) {
    const width = Math.max(1, Number(roof.width || 6));
    const depth = Math.max(1, Number(roof.depth || 6));
    const height = Math.max(0.2, Number(roof.height || 1.1));
    const curve = Number(roof.curve || 0);
    const subtype = roof.subtype || roof.type || 'gable';

    const roofWallHeight = floor ? (floor.wallHeight ?? floorplan.wallHeight ?? 2.8) : defaultWallHeight;
    const eaveY = floorY + (roof.elevation !== undefined ? Number(roof.elevation) : roofWallHeight);

    let geometry;
    try {
      geometry = getCutRoofGeometry(floorplan, roof, cutContext);
    } catch (_) {
      geometry = getRoofGeometryData(subtype, width, depth, height, curve, {
        topWidth: roof.topWidth,
        topDepth: roof.topDepth,
        eaveOverhang: roof.eaveOverhang
      });
    }
    const { positions, topIndices, sideIndices, bottomIndices, eaveIndices } = geometry;

    const vertices = [];
    const rotation = Number(roof.rotation || 0);
    const mirrored = !!roof.mirrored;
    const rx = Number(roof.x || 0);
    const rz = Number(roof.z || 0);

    for (let i = 0; i < positions.length; i += 3) {
      let px = positions[i];
      let py = positions[i + 1];
      let pz = positions[i + 2];

      if (mirrored) {
        px = -px;
      }

      const rotated = rotatePoint(px, pz, rotation);
      vertices.push([
        rotated.x + rx,
        py + eaveY,
        rotated.z + rz
      ]);
    }

    if (topIndices && topIndices.length > 0) {
      const topMesh = { vertices, triangles: chunkIndices(topIndices) };
      appendMesh(mesh, topMesh, roof.color || '#b75b54');
    }

    if (eaveIndices && eaveIndices.length > 0) {
      const eaveMesh = { vertices, triangles: chunkIndices(eaveIndices) };
      appendMesh(mesh, eaveMesh, roof.color || '#b75b54');
    }

    if (sideIndices && sideIndices.length > 0 && !roof.sideHidden) {
      const sideMesh = { vertices, triangles: chunkIndices(sideIndices) };
      appendMesh(mesh, sideMesh, roof.sideColor || '#f9fbff');
    }

    if (bottomIndices && bottomIndices.length > 0 && !roof.bottomHidden) {
      const bottomMesh = { vertices, triangles: chunkIndices(bottomIndices) };
      appendMesh(mesh, bottomMesh, roof.bottomColor || '#f9fbff');
    }

    // 屋顶榫卯检测与生成
    if (options.enableTenon) {
      const pegHeight = 0.08;
      const pegLength = 0.15;
      const socketHeight = 0.10;
      const socketLength = 0.17;

      for (const wall of floorEntities(floorplan, 'walls', floorId)) {
        const basis = wallBasis(wall);
        if (!basis) continue;
        const wx = (wall.from[0] + wall.to[0]) / 2;
        const wz = (wall.from[1] + wall.to[1]) / 2;

        // 计算 wx, wz 相对 roof 中心的本地坐标
        const dx = wx - rx;
        const dz = wz - rz;
        const rot = -rotation;
        const localX = dx * Math.cos(rot) - dz * Math.sin(rot);
        const localZ = dx * Math.sin(rot) + dz * Math.cos(rot);

        // 如果墙体中点在屋顶水平包容矩形内，则判断墙体被屋顶覆盖
        const inRoof = Math.abs(localX) <= width / 2 + 0.1 && Math.abs(localZ) <= depth / 2 + 0.1;
        if (inRoof) {
          const wallHeight = Number(floor?.wallHeight ?? floorplan.wallHeight ?? 2.8);
          const thickness = Math.max(0.02, Number(wall.thickness ?? floorplan.wallThickness ?? DEFAULT_WALL_THICKNESS));
          const wallRot = Math.atan2(basis.uz, basis.ux);
          
          const pWidth = pegLength;
          const pThickness = thickness * 0.6;
          const pY = floorY + wallHeight;

          // 1. 在墙顶生成插销 (Peg)
          addRotatedBox(mesh, wx, pY + pegHeight / 2, wz, pWidth, pegHeight, pThickness, wallRot);

          // 2. 在屋顶底面对应位置挖出凹槽插槽 (Socket)
          const sWidth = socketLength;
          const sThickness = thickness * 0.7;
          addRotatedInvertedBox(mesh, wx, pY + socketHeight / 2, wz, sWidth, socketHeight, sThickness, wallRot);
        }
      }
    }
  }
}

function getColorHex(material) {
  if (!material) return '#E0E0E0FF';

  // 兼容多重材质 MultiMaterial，对其进行迭代解包读取其子材质的真实颜色
  if (material.subMaterials || material.constructor?.name === 'MultiMaterial') {
    const subMats = material.subMaterials || [];
    for (const subMat of subMats) {
      if (subMat) {
        const hex = getColorHex(subMat);
        if (hex && hex !== '#E0E0E0FF') {
          return hex;
        }
      }
    }
    for (const subMat of subMats) {
      if (subMat) {
        return getColorHex(subMat);
      }
    }
  }

  // 优先获取真实的原始材质颜色，避免物理渲染通道的漫反射或高光缩放导致颜色丢失/变暗
  const bpMat = material.metadata?.blueprintMaterial;
  if (bpMat && bpMat.color) {
    let baseColor = bpMat.color;
    if (!baseColor.startsWith('#')) {
      baseColor = '#' + baseColor;
    }
    const alphaVal = material.alpha !== undefined ? material.alpha : (bpMat.alpha !== undefined ? bpMat.alpha : 1.0);
    const a = Math.round(alphaVal * 255).toString(16).padStart(2, '0');
    return (baseColor.substring(0, 7) + a).toUpperCase();
  }

  let color = material.diffuseColor || material.albedoColor;
  if (!color && material.color) {
    color = material.color;
  }
  if (!color) {
    color = new BABYLON.Color3(0.8, 0.8, 0.8);
  }
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  const alphaVal = material.alpha !== undefined ? material.alpha : 1.0;
  const a = Math.round(alphaVal * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}${a}`.toUpperCase();
}

function projectPointToLine(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.00001) return 0;
  const t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  return t * Math.sqrt(lenSq);
}

function distanceToLine(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.00001) return Math.sqrt((px - ax) ** 2 + (pz - az) ** 2);
  const cross = Math.abs((px - ax) * dz - (pz - az) * dx);
  return cross / len;
}

function getOverlappingSpan(wall, cand) {
  if (!wall.from || !wall.to || !cand.from || !cand.to) return null;
  const [ax, az] = wall.from;
  const [bx, bz] = wall.to;
  const [cx, cz] = cand.from;
  const [dx, dz] = cand.to;

  const dxAB = bx - ax;
  const dzAB = bz - az;
  const lenAB = Math.sqrt(dxAB * dxAB + dzAB * dzAB);

  const dxCD = dx - cx;
  const dzCD = dz - cz;
  const lenCD = Math.sqrt(dxCD * dxCD + dzCD * dzCD);

  if (lenAB < 0.1 || lenCD < 0.1) return null;

  const dot = (dxAB * dxCD + dzAB * dzCD) / (lenAB * lenCD);
  if (Math.abs(dot) < 0.98) return null;

  const distC = distanceToLine(cx, cz, ax, az, bx, bz);
  const distD = distanceToLine(dx, dz, ax, az, bx, bz);
  if (distC > 0.08 || distD > 0.08) return null;

  const tC = projectPointToLine(cx, cz, ax, az, bx, bz);
  const tD = projectPointToLine(dx, dz, ax, az, bx, bz);
  
  const minCD = Math.min(tC, tD);
  const maxCD = Math.max(tC, tD);

  const start = Math.max(0, minCD);
  const end = Math.min(lenAB, maxCD);

  if (end - start > 1.2) {
    return { start, end, center: (start + end) / 2 };
  }
  return null;
}

function createObjects(floorplan, options = {}) {
  const objects = [];
  const exportBuilding = options.category !== 'furniture';
  const exportFurniture = options.category !== 'building';
  const roofCutContext = exportBuilding ? createRoofCutContext(floorplan) : null;

  const floors = orderedFloors(floorplan);
  const pegHeight = 0.08;
  const pegLength = 0.15;
  const socketHeight = 0.10;
  const socketLength = 0.17;
  
  const pegsCache = {};
  const socketsCache = {};
  
  floors.forEach((floor) => {
    pegsCache[floor.id] = [];
    socketsCache[floor.id] = {};
  });

  if (options.enableTenon !== false && floors.length > 1) {
    for (let i = 0; i < floors.length - 1; i++) {
      const currentFloor = floors[i];
      const nextFloor = floors[i + 1];
      
      const currentWalls = floorEntities(floorplan, 'walls', currentFloor.id);
      const nextWalls = floorEntities(floorplan, 'walls', nextFloor.id);
      
      currentWalls.forEach(wallA => {
        const basisA = wallBasis(wallA);
        if (!basisA) return;
        const spansA = wallOpeningSpans(floorplan, wallA, basisA);
        if (spansA && spansA.length > 0) return;
        
        for (const wallB of nextWalls) {
          const basisB = wallBasis(wallB);
          if (!basisB) continue;
          const spansB = wallOpeningSpans(floorplan, wallB, basisB);
          if (spansB && spansB.length > 0) continue;
          
          const overlap = getOverlappingSpan(wallA, wallB);
          if (overlap) {
            const t_center = overlap.center;
            const centerPos = pointAlongWall(basisA, t_center);
            const floorY = getFloorElevation(floorplan, currentFloor.id);
            const wallHeight = Number(currentFloor.wallHeight ?? floorplan.wallHeight ?? 2.8);
            const thickness = Math.max(0.02, Number(wallA.thickness ?? floorplan.wallThickness ?? DEFAULT_WALL_THICKNESS));
            const rotation = Math.atan2(basisA.uz, basisA.ux);
            
            pegsCache[currentFloor.id].push({
              cx: centerPos.x,
              cz: centerPos.z,
              centerY: floorY + wallHeight + pegHeight / 2,
              pegLength,
              pegHeight,
              thickness: thickness * 0.6,
              rotation
            });
            
            const [cx_B, cz_B] = wallB.from;
            const [dx_B, dz_B] = wallB.to;
            const tB = projectPointToLine(centerPos.x, centerPos.z, cx_B, cz_B, dx_B, dz_B);
            
            if (!socketsCache[nextFloor.id][wallB.id]) {
              socketsCache[nextFloor.id][wallB.id] = [];
            }
            socketsCache[nextFloor.id][wallB.id].push({
              start: tB - socketLength / 2,
              end: tB + socketLength / 2,
              height: socketHeight
            });
            
            break;
          }
        }
      });
    }
  }

  if (exportBuilding) {
    floors.forEach((floor, index) => {
      const mesh = createMesh();
      for (const room of floorEntities(floorplan, 'rooms', floor.id)) appendRoomSlab(mesh, floorplan, room);
      
      for (const wall of floorEntities(floorplan, 'walls', floor.id)) {
        const extraSpans = socketsCache[floor.id]?.[wall.id] || [];
        appendWallWithOpenings(mesh, floorplan, wall, extraSpans);
      }
      
      appendRoofs(mesh, floorplan, floor.id, { ...options, roofCutContext });
      
      if (pegsCache[floor.id] && pegsCache[floor.id].length > 0) {
        pegsCache[floor.id].forEach(peg => {
          addRotatedBox(mesh, peg.cx, peg.centerY, peg.cz, peg.pegLength, peg.pegHeight, peg.thickness, peg.rotation);
        });
      }

      if (mesh.triangles.length) {
        objects.push({
          name: `Building - ${floor.name || floorPrefix(index)}`,
          partNumber: `${floorPrefix(index)}-BUILDING`,
          category: 'building',
          mesh
        });
      }
    });
  }

  if (exportFurniture) {
    // 1. 普通家具 items
    for (const item of floorplan.items || []) {
      const mesh = createMesh();
      
      let hasRealMesh = false;
      if (options.testMap && options.testMap.scene) {
        const itemNode = options.testMap.scene.getNodeByName(`item_${item.id}`);
        hasRealMesh = appendRealMesh(mesh, itemNode);
      }

      if (!hasRealMesh) {
        const size = itemSize(item);
        const floorY = getFloorElevation(floorplan, entityFloorId(floorplan, item));
        const roomOffset = getItemRoomElevationOffset(floorplan, item);
        const centerY = floorY + roomOffset + Number(item.elevation || 0) + size.height / 2;
        
        let itemColor = '#E0E0E0';
        if (item.colors && typeof item.colors === 'object') {
          const keys = Object.keys(item.colors);
          if (keys.length > 0) {
            itemColor = item.colors[keys[0]] || '#E0E0E0';
          }
        }
        
        addRotatedBox(
          mesh,
          Number(item.x || 0),
          centerY,
          Number(item.z || 0),
          size.width,
          size.height,
          size.depth,
          Number(item.rotation || 0),
          normalizeColorHex(itemColor)
        );
      }

      if (mesh.triangles.length) {
        objects.push({
          name: `Furniture - ${item.name || item.type || item.id}`,
          partNumber: `FURNITURE-${item.id || objects.length + 1}`,
          category: 'furniture',
          mesh
        });
      }
    }

    // 2. 楼梯 stairs
    floors.forEach((floor) => {
      for (const stairs of floorEntities(floorplan, 'stairs', floor.id)) {
        const mesh = createMesh();
        let hasRealMesh = false;
        if (options.testMap && options.testMap.scene) {
          const stairsNode = options.testMap.scene.getNodeByName(`stairs_${stairs.id}`);
          hasRealMesh = appendRealMesh(mesh, stairsNode);
        }
        if (!hasRealMesh) {
          const width = Number(stairs.width || 1.2);
          const depth = Number(stairs.depth || 3.2);
          const height = Number(stairs.height || floorplan.storyHeight || 3.06);
          const floorY = getFloorElevation(floorplan, floor.id);
          const steps = Math.max(3, Number(stairs.steps || 9));
          const stairsColor = extractColor(stairs.material, stairs.color || '#d8c0a0');
          for (let step = 0; step < steps; step += 1) {
            const stepDepth = depth / steps;
            const stepHeight = height * (step + 1) / steps;
            const localZ = -depth / 2 + stepDepth * (step + 0.5);
            const position = rotatePoint(0, localZ, Number(stairs.rotation || 0));
            addRotatedBox(
              mesh,
              Number(stairs.x || 0) + position.x,
              floorY + stepHeight / 2,
              Number(stairs.z || 0) + position.z,
              width,
              stepHeight,
              stepDepth,
              Number(stairs.rotation || 0),
              normalizeColorHex(stairsColor)
            );
          }
        }
        if (mesh.triangles.length) {
          objects.push({
            name: `Furniture - Stair - ${stairs.id}`,
            partNumber: `FURNITURE-STAIR-${stairs.id}`,
            category: 'furniture',
            mesh
          });
        }
      }
    });

    // 3. 栅栏 fences
    floors.forEach((floor) => {
      for (const fence of floorEntities(floorplan, 'fences', floor.id)) {
        const mesh = createMesh();
        let hasRealMesh = false;
        if (options.testMap && options.testMap.scene) {
          const fenceNode = options.testMap.scene.getNodeByName(`fence_${fence.id}`);
          hasRealMesh = appendRealMesh(mesh, fenceNode);
        }
        if (!hasRealMesh) {
          const basis = wallBasis(fence);
          if (basis) {
            const floorY = getFloorElevation(floorplan, floor.id);
            const center = pointAlongWall(basis, basis.length / 2);
            const height = Number(fence.height || 1.1);
            const fenceColor = extractColor(fence.material, fence.color || '#8d6e63');
            addRotatedBox(
              mesh,
              center.x,
              floorY + Number(fence.yOffset || 0) + height / 2,
              center.z,
              basis.length,
              height,
              Math.max(0.04, Number(fence.thickness || 0.1)),
              Math.atan2(basis.uz, basis.ux),
              normalizeColorHex(fenceColor)
            );
          }
        }
        if (mesh.triangles.length) {
          objects.push({
            name: `Furniture - Fence - ${fence.id}`,
            partNumber: `FURNITURE-FENCE-${fence.id}`,
            category: 'furniture',
            mesh
          });
        }
      }
    });

    // 4. 栅栏门 fenceGates
    floors.forEach((floor) => {
      const gates = (floorplan.fenceGates || []).filter(gate => gate.floorId === floor.id);
      for (const gate of gates) {
        const mesh = createMesh();
        let hasRealMesh = false;
        if (options.testMap && options.testMap.scene) {
          const gateNode = options.testMap.scene.getNodeByName(`gate_${gate.id}`);
          hasRealMesh = appendRealMesh(mesh, gateNode);
        }
        let [x1, z1] = gate.from || [0, 0];
        let [x2, z2] = gate.to || [1, 0];

        if (gate.fenceId) {
          const fence = (floorplan.fences || []).find(f => f.id === gate.fenceId);
          if (fence) {
            const [fx1, fz1] = fence.from;
            const [fx2, fz2] = fence.to;
            const dx = fx2 - fx1;
            const dz = fz2 - fz1;
            const fenceLen = Math.sqrt(dx * dx + dz * dz) || 1;
            const halfT = (gate.width || 1.0) / fenceLen / 2;
            const t1 = Math.max(0, gate.t - halfT);
            const t2 = Math.min(1, gate.t + halfT);
            x1 = fx1 + dx * t1;
            z1 = fz1 + dz * t1;
            x2 = fx1 + dx * t2;
            z2 = fz1 + dz * t2;
          }
        }
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        const thickness = Number(gate.thickness || 0.08);
        const panelColor = extractColor(gate.panelMaterial, gate.panelColor || (gate.subtype === 'concrete' ? '#f9fbff' : '#8d6e63'));
        const angle = length > 0.01 ? Math.atan2(dz, dx) : 0;

        if (!hasRealMesh && length > 0.01) {
          const fenceTilt = gate.fenceId ? ((floorplan.fences || []).find(f => f.id === gate.fenceId)?.tilt || 0) : 0;
          const tilt = gate.tilt || fenceTilt;
          const height = Number(gate.height || 1.1);
          const gateOffset = Number(gate.yOffset || 0);
          const floorY = getFloorElevation(floorplan, floor.id);

          let renderLength = length;
          if (tilt) {
            renderLength = length / Math.cos(tilt);
          }

          addRotatedBox(
            mesh,
            (x1 + x2) / 2,
            floorY + gateOffset + height / 2,
            (z1 + z2) / 2,
            renderLength,
            height,
            thickness,
            angle,
            normalizeColorHex(panelColor)
          );
        }
        
        if (options.enableTenon && length > 0.01) {
          const floorY = getFloorElevation(floorplan, floor.id);
          const gateOffset = Number(gate.yOffset || 0);
          const startY = floorY + gateOffset;
          const pegHeight = 0.08;
          const socketHeight = 0.10;
          const tWidth = thickness * 0.8;
          const sWidth = thickness * 0.9;
          
          // 端点 1 榫卯
          addRotatedBox(mesh, x1, startY + pegHeight / 2, z1, tWidth, pegHeight, tWidth, angle, normalizeColorHex(panelColor));
          addRotatedInvertedBox(mesh, x1, startY + socketHeight / 2, z1, sWidth, socketHeight, sWidth, angle);

          // 端点 2 榫卯
          addRotatedBox(mesh, x2, startY + pegHeight / 2, z2, tWidth, pegHeight, tWidth, angle, normalizeColorHex(panelColor));
          addRotatedInvertedBox(mesh, x2, startY + socketHeight / 2, z2, sWidth, socketHeight, sWidth, angle);
        }

        if (mesh.triangles.length) {
          objects.push({
            name: `Furniture - FenceGate - ${gate.id}`,
            partNumber: `FURNITURE-FENCEGATE-${gate.id}`,
            category: 'furniture',
            mesh
          });
        }
      }
    });

    // 5. 普通门 doors (类型为 door 的 openings)
    floors.forEach((floor) => {
      const openings = (floorplan.openings || []).filter(op => {
        if (op.floorId === floor.id) return true;
        const wall = (floorplan.walls || []).find(w => w.id === op.wallId);
        return wall && wall.floorId === floor.id;
      });
      const doors = openings.filter(op => op.type === 'door');

      for (const door of doors) {
        const mesh = createMesh();
        let hasRealMesh = false;
        if (options.testMap && options.testMap.scene) {
          const doorNode = options.testMap.scene.getNodeByName(`opening_group_${door.id}`);
          hasRealMesh = appendRealMesh(mesh, doorNode);
        }
        const wall = (floorplan.walls || []).find(w => w.id === door.wallId);
        
        let startY = 0;
        let angle = 0;
        let thickness = 0.08;
        let panelColor = extractColor(door.panelMaterial, door.panelColor || door.color || '#8d6e63');

        let x1 = 0, z1 = 0, x2 = 0, z2 = 0;
        let hasWall = false;

        if (wall) {
          const basis = wallBasis(wall);
          if (basis) {
            hasWall = true;
            const centerPos = pointAlongWall(basis, Number(door.t ?? 0.5) * basis.length);
            const floorY = getFloorElevation(floorplan, floor.id);
            const sillHeight = Number(door.sillHeight || 0);
            const openingOffset = getOpeningElevationOffset(floorplan, door);
            startY = floorY + sillHeight + openingOffset;
            
            const width = Number(door.width || 0.9);
            const height = Number(door.height || 2.05);
            thickness = Math.max(0.04, Number(wall.thickness || 0.18) + 0.02);
            angle = Math.atan2(basis.uz, basis.ux);

            if (!hasRealMesh && !door.panelHidden) {
              addRotatedBox(
                mesh,
                centerPos.x,
                startY + height / 2,
                centerPos.z,
                width,
                height,
                thickness,
                angle,
                normalizeColorHex(panelColor)
              );
            }

            // 计算两端点位置用于榫卯
            const center = Math.max(0, Math.min(basis.length, Number(door.t ?? 0.5) * basis.length));
            const half = Math.max(0.05, Number(door.width || 0.9)) / 2;
            const startT = Math.max(0, center - half);
            const endT = Math.min(basis.length, center + half);
            const p1 = pointAlongWall(basis, startT);
            const p2 = pointAlongWall(basis, endT);
            x1 = p1.x;
            z1 = p1.z;
            x2 = p2.x;
            z2 = p2.z;
          }
        }

        if (options.enableTenon && hasWall) {
          const pegHeight = 0.08;
          const socketHeight = 0.10;
          const tWidth = thickness * 0.8;
          const sWidth = thickness * 0.9;
          
          // 端点 1 榫卯
          addRotatedBox(mesh, x1, startY + pegHeight / 2, z1, tWidth, pegHeight, tWidth, angle, normalizeColorHex(panelColor));
          addRotatedInvertedBox(mesh, x1, startY + socketHeight / 2, z1, sWidth, socketHeight, sWidth, angle);

          // 端点 2 榫卯
          addRotatedBox(mesh, x2, startY + pegHeight / 2, z2, tWidth, pegHeight, tWidth, angle, normalizeColorHex(panelColor));
          addRotatedInvertedBox(mesh, x2, startY + socketHeight / 2, z2, sWidth, socketHeight, sWidth, angle);
        }

        if (mesh.triangles.length) {
          objects.push({
            name: `Furniture - Door - ${door.id}`,
            partNumber: `FURNITURE-DOOR-${door.id}`,
            category: 'furniture',
            mesh
          });
        }
      }
    });

  }
  return objects;
}

function objectXml(object, id, baseMaterialsList) {
  const vertices = object.mesh.vertices.map(([x, y, z]) => `<vertex x="${x.toFixed(5)}" y="${y.toFixed(5)}" z="${z.toFixed(5)}"/>`).join('');
  
  const colorsUsed = [];
  if (object.mesh.triangleColors && object.mesh.triangleColors.length) {
    object.mesh.triangleColors.forEach(color => {
      if (color && !colorsUsed.includes(color)) {
        colorsUsed.push(color);
      }
    });
  }
  
  let baseMatId = 0;
  if (colorsUsed.length > 0) {
    baseMatId = id + 10000;
    const baseItems = colorsUsed.map((color, idx) => `<base name="mat_${idx}" displaycolor="${color}"/>`).join('');
    baseMaterialsList.push(`<basematerials id="${baseMatId}">${baseItems}</basematerials>`);
  }

  const triangles = object.mesh.triangles.map((triangle, triIdx) => {
    const [v1, v2, v3] = triangle;
    const color = object.mesh.triangleColors?.[triIdx];
    if (color && baseMatId > 0) {
      const p1 = colorsUsed.indexOf(color);
      return `<triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${baseMatId}" p1="${p1}"/>`;
    }
    return `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
  }).join('');
  
  return `<object id="${id}" type="model" name="${escXml(object.name)}" partnumber="${escXml(object.partNumber)}"><mesh><vertices>${vertices}</vertices><triangles>${triangles}</triangles></mesh></object>`;
}

export function create3MFModelXml(floorplan, options = {}) {
  const objects = createObjects(floorplan, options);
  const baseMaterialsList = [];
  const resources = objects.map((object, index) => objectXml(object, index + 1, baseMaterialsList)).join('');
  const baseMaterialsXml = baseMaterialsList.join('');
  const build = objects.map((_, index) => `<item objectid="${index + 1}"/>`).join('');
  const buildingCount = objects.filter((object) => object.category === 'building').length;
  const furnitureCount = objects.filter((object) => object.category === 'furniture').length;
  return `<?xml version="1.0" encoding="UTF-8"?><model unit="meter" xml:lang="zh-CN" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${escXml(floorplan.name || 'blueprint-building')}</metadata><metadata name="Application">blueprint3d-babylon</metadata><metadata name="Description">Layered architectural export: ${buildingCount} building object(s), ${furnitureCount} furniture object(s). Walls include physical thickness and door/window voids.</metadata><resources>${baseMaterialsXml}${resources}</resources><build>${build}</build></model>`;
}

function crcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function textBytes(value) {
  return new TextEncoder().encode(value);
}

export function createZipStore(entries) {
  const prepared = entries.map((entry) => {
    const name = textBytes(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : textBytes(entry.data);
    return { name, data, crc: crc32(data), localOffset: 0 };
  });
  const localSize = prepared.reduce((sum, entry) => sum + 30 + entry.name.length + entry.data.length, 0);
  const centralSize = prepared.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
  const output = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(output.buffer);
  let offset = 0;
  const u16 = (value) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };
  const u32 = (value) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };
  const bytes = (value) => {
    output.set(value, offset);
    offset += value.length;
  };

  for (const entry of prepared) {
    entry.localOffset = offset;
    u32(0x04034b50); u16(20); u16(0); u16(0); u16(0); u16(0);
    u32(entry.crc); u32(entry.data.length); u32(entry.data.length); u16(entry.name.length); u16(0);
    bytes(entry.name); bytes(entry.data);
  }

  const centralOffset = offset;
  for (const entry of prepared) {
    u32(0x02014b50); u16(20); u16(20); u16(0); u16(0); u16(0); u16(0);
    u32(entry.crc); u32(entry.data.length); u32(entry.data.length); u16(entry.name.length);
    u16(0); u16(0); u16(0); u16(0); u32(0); u32(entry.localOffset);
    bytes(entry.name);
  }

  u32(0x06054b50); u16(0); u16(0); u16(prepared.length); u16(prepared.length);
  u32(centralSize); u32(centralOffset); u16(0);
  return output;
}

export function create3MFPackage(floorplan, options = {}) {
  return createZipStore([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
    { name: '3D/3dmodel.model', data: create3MFModelXml(floorplan, options) }
  ]);
}

export function create3MFFileName(name = 'blueprint-building') {
  return `${safeName(name)}-${new Date().toISOString().replace(/[:.]/g, '-')}.3mf`;
}
