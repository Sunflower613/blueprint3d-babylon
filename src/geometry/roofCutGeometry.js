import { CSG } from '../core/babylon.js';
import { getRoofGeometryData } from './roofGeometry.js';

const EPSILON = 1e-5;
const SURFACE_COLORS = Object.freeze({
  top: [1, 0, 0, 1],
  side: [0, 1, 0, 1],
  bottom: [0, 0, 1, 1],
  eave: [1, 0, 1, 1],
  cut: [1, 1, 0, 1]
});

function orderedFloors(floorplan) {
  const floors = floorplan.floors?.length
    ? floorplan.floors
    : [{ id: floorplan.currentFloorId || 'floor_1', level: 0 }];
  return [...floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
}

function getFloor(floorplan, floorId) {
  const floors = orderedFloors(floorplan);
  return floors.find((floor) => floor.id === floorId) || floors[0];
}

function getFloorElevation(floorplan, floorId) {
  const targetFloor = getFloor(floorplan, floorId);
  if (!targetFloor) return 0;
  const targetLevel = Number(targetFloor.level || 0);
  let elevation = 0;
  for (const floor of orderedFloors(floorplan)) {
    if (Number(floor.level || 0) >= targetLevel) continue;
    elevation += Number(floor.wallHeight ?? floorplan.wallHeight ?? 2.8)
      + Number(floor.floorHeight ?? floorplan.floorHeight ?? 0.2);
  }
  return elevation + Number(targetFloor.floorHeight ?? floorplan.floorHeight ?? 0.2);
}

function roofMetrics(floorplan, roof) {
  const floor = getFloor(floorplan, roof.floorId);
  const floorY = getFloorElevation(floorplan, roof.floorId);
  const wallHeight = Number(floor?.wallHeight ?? floorplan.wallHeight ?? 2.8);
  return {
    width: Math.max(1, Number(roof.width || 6)),
    depth: Math.max(1, Number(roof.depth || 6)),
    height: Math.max(0.2, Number(roof.height || 1.1)),
    curve: Number(roof.curve || 0),
    subtype: roof.subtype || roof.type || 'gable',
    eaveY: floorY + (roof.elevation !== undefined ? Number(roof.elevation) : wallHeight),
    x: Number(roof.x || 0),
    z: Number(roof.z || 0),
    rotation: Number(roof.rotation || 0),
    mirrored: !!roof.mirrored,
    eaveOverhang: Math.max(0, Number(roof.eaveOverhang || 0))
  };
}

function transformLocalPointToWorld(point, metrics) {
  const localX = metrics.mirrored ? -point.x : point.x;
  const cos = Math.cos(metrics.rotation);
  const sin = Math.sin(metrics.rotation);
  // Match Babylon's left-handed Matrix.RotationY / TransformNode.rotation.y.
  return {
    x: localX * cos + point.z * sin + metrics.x,
    y: point.y + metrics.eaveY,
    z: -localX * sin + point.z * cos + metrics.z
  };
}

function transformWorldPointToLocal(point, metrics) {
  const dx = point.x - metrics.x;
  const dz = point.z - metrics.z;
  const cos = Math.cos(metrics.rotation);
  const sin = Math.sin(metrics.rotation);
  // Exact inverse of the Babylon-space transform above.
  let x = dx * cos - dz * sin;
  if (metrics.mirrored) x = -x;
  return {
    x,
    y: point.y - metrics.eaveY,
    z: dx * sin + dz * cos
  };
}

function transformGeometryPositions(positions, transform) {
  const result = new Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const point = transform({
      x: positions[i],
      y: positions[i + 1],
      z: positions[i + 2]
    });
    result[i] = point.x;
    result[i + 1] = point.y;
    result[i + 2] = point.z;
  }
  return result;
}

function calculateBounds(positions) {
  const bounds = {
    minX: Infinity, minY: Infinity, minZ: Infinity,
    maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity
  };
  for (let i = 0; i < positions.length; i += 3) {
    bounds.minX = Math.min(bounds.minX, positions[i]);
    bounds.maxX = Math.max(bounds.maxX, positions[i]);
    bounds.minY = Math.min(bounds.minY, positions[i + 1]);
    bounds.maxY = Math.max(bounds.maxY, positions[i + 1]);
    bounds.minZ = Math.min(bounds.minZ, positions[i + 2]);
    bounds.maxZ = Math.max(bounds.maxZ, positions[i + 2]);
  }
  return bounds;
}

function boundsOverlap(a, b) {
  return a.minX < b.maxX - EPSILON && a.maxX > b.minX + EPSILON
    && a.minY < b.maxY - EPSILON && a.maxY > b.minY + EPSILON
    && a.minZ < b.maxZ - EPSILON && a.maxZ > b.minZ + EPSILON;
}

function triangleNeedsFlip(surface, positions, a, b, c, metrics) {
  const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
  const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
  const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  // Babylon's legacy CSG constructs its BSP plane with Cross(c - a, b - a),
  // the reverse of the conventional triangle normal used by ComputeNormals.
  // Therefore CSG-facing triangles must use the project's existing inward
  // conventional winding. Normalize the few inconsistent faces (notably the
  // dome bottom) and mirrored roofs to that convention before subtraction.
  if (surface === 'top') return ny > EPSILON;
  if (surface === 'bottom') return ny < -EPSILON;

  const centerX = (ax + bx + cx) / 3 - metrics.x;
  const centerZ = (az + bz + cz) / 3 - metrics.z;
  const horizontalDirection = nx * centerX + nz * centerZ;
  if (Math.abs(horizontalDirection) > EPSILON) return horizontalDirection > 0;
  return ny > EPSILON;
}

function appendExpandedTriangles(target, record, indices, surface, colorSurface = surface) {
  const positions = record.worldPositions;
  const color = SURFACE_COLORS[colorSurface];
  for (let i = 0; i < indices.length; i += 3) {
    const outputBase = target.positions.length / 3;
    const a = indices[i];
    let b = indices[i + 1];
    let c = indices[i + 2];
    if (
      (surface === 'eave' && !record.metrics.mirrored)
      || (surface !== 'eave' && triangleNeedsFlip(surface, positions, a, b, c, record.metrics))
    ) {
      [b, c] = [c, b];
    }
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const length = Math.hypot(nx, ny, nz) || 1;
    nx /= length;
    ny /= length;
    nz /= length;
    target.positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    target.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    target.colors.push(...color, ...color, ...color);
    target.indices.push(outputBase, outputBase + 1, outputBase + 2);
  }
}

function createCsgVertexData(record, cutter = false) {
  const data = { positions: [], indices: [], normals: [], colors: [] };
  appendExpandedTriangles(data, record, record.geometry.topIndices, 'top', cutter ? 'cut' : 'top');
  appendExpandedTriangles(data, record, record.geometry.sideIndices, 'side', cutter ? 'cut' : 'side');
  appendExpandedTriangles(data, record, record.geometry.bottomIndices, 'bottom', cutter ? 'cut' : 'bottom');
  appendExpandedTriangles(data, record, record.geometry.eaveIndices || [], 'eave', cutter ? 'cut' : 'eave');
  return data;
}

function classifyTriangleSurface(vertexData, indexOffset) {
  const vertexIndex = vertexData.indices[indexOffset];
  const colorOffset = vertexIndex * 4;
  const r = vertexData.colors?.[colorOffset] ?? 0;
  const g = vertexData.colors?.[colorOffset + 1] ?? 1;
  const b = vertexData.colors?.[colorOffset + 2] ?? 0;
  if (r > 0.5 && g < 0.5 && b < 0.5) return 'top';
  if (r < 0.5 && g < 0.5 && b > 0.5) return 'bottom';
  if (r > 0.5 && g < 0.5 && b > 0.5) return 'eave';
  if (r > 0.5 && g > 0.5 && b < 0.5) return 'cut';
  return 'side';
}

function toLocalSurfaceCutGeometry(vertexData, record) {
  const cutPositions = transformGeometryPositions(
    Array.from(vertexData.positions || []),
    (point) => transformWorldPointToLocal(point, record.metrics)
  );
  const positions = [];
  const topIndices = [];
  const sideIndices = [];
  const eaveIndices = [];
  const indices = Array.from(vertexData.indices || []);
  for (let i = 0; i < indices.length; i += 3) {
    const surface = classifyTriangleSurface(vertexData, i);
    if (surface !== 'top' && surface !== 'side' && surface !== 'eave') continue;
    // Legacy CSG emits inward conventional winding. Reverse it for rendering;
    // mirrored local conversion already contributes the required reflection.
    const triangle = record.metrics.mirrored
      ? [indices[i], indices[i + 1], indices[i + 2]]
      : [indices[i], indices[i + 2], indices[i + 1]];
    const outputBase = positions.length / 3;
    for (const vertexIndex of triangle) {
      const offset = vertexIndex * 3;
      positions.push(
        cutPositions[offset],
        cutPositions[offset + 1],
        cutPositions[offset + 2]
      );
    }
    const output = surface === 'top'
      ? topIndices
      : (surface === 'eave' ? eaveIndices : sideIndices);
    output.push(outputBase, outputBase + 1, outputBase + 2);
  }

  // Keep only the surviving portions of the original top/fascia surfaces.
  // Discard CSG-generated closure faces, while retaining the intact ceiling.
  const baseOffset = positions.length / 3;
  positions.push(...record.geometry.positions);
  return {
    positions,
    topIndices,
    sideIndices,
    eaveIndices,
    bottomIndices: record.geometry.bottomIndices.map((index) => index + baseOffset),
    hasCuts: true
  };
}

export function createRoofCutContext(floorplan) {
  const records = new Map();
  const neighbors = new Map();
  for (const roof of floorplan.roofs || []) {
    const metrics = roofMetrics(floorplan, roof);
    const geometry = getRoofGeometryData(
      metrics.subtype,
      metrics.width,
      metrics.depth,
      metrics.height,
      metrics.curve,
      {
        topWidth: roof.topWidth,
        topDepth: roof.topDepth,
        eaveOverhang: metrics.eaveOverhang
      }
    );
    const worldPositions = transformGeometryPositions(
      geometry.positions,
      (point) => transformLocalPointToWorld(point, metrics)
    );
    records.set(roof.id, {
      roof,
      metrics,
      geometry,
      worldPositions,
      bounds: calculateBounds(worldPositions)
    });
    neighbors.set(roof.id, new Set());
  }

  const candidates = [...records.values()].filter((record) => record.roof.autoCut !== false);
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      if (!boundsOverlap(a.bounds, b.bounds)) continue;
      neighbors.get(a.roof.id).add(b.roof.id);
      neighbors.get(b.roof.id).add(a.roof.id);
    }
  }
  return { records, neighbors };
}

export function getRoofCutNeighborIds(context, roofId) {
  return new Set(context?.neighbors?.get(roofId) || []);
}

export function getCutRoofGeometry(
  floorplan,
  roofOrId,
  context = createRoofCutContext(floorplan)
) {
  const roofId = typeof roofOrId === 'string' ? roofOrId : roofOrId?.id;
  const record = context.records.get(roofId);
  if (!record) return null;
  const neighborIds = context.neighbors.get(roofId);
  if (!neighborIds?.size) {
    return { ...record.geometry, hasCuts: false };
  }

  let result = CSG.FromVertexData(createCsgVertexData(record));
  for (const neighborId of neighborIds) {
    const cutter = context.records.get(neighborId);
    if (!cutter) continue;
    result = result.subtract(CSG.FromVertexData(createCsgVertexData(cutter, true)));
  }
  return toLocalSurfaceCutGeometry(result.toVertexData(), record);
}

function rayTriangleDistance(origin, direction, a, b, c) {
  const edge1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const edge2 = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const p = {
    x: direction.y * edge2.z - direction.z * edge2.y,
    y: direction.z * edge2.x - direction.x * edge2.z,
    z: direction.x * edge2.y - direction.y * edge2.x
  };
  const det = edge1.x * p.x + edge1.y * p.y + edge1.z * p.z;
  if (Math.abs(det) < EPSILON) return null;
  const invDet = 1 / det;
  const tvec = { x: origin.x - a.x, y: origin.y - a.y, z: origin.z - a.z };
  const u = (tvec.x * p.x + tvec.y * p.y + tvec.z * p.z) * invDet;
  if (u < -EPSILON || u > 1 + EPSILON) return null;
  const q = {
    x: tvec.y * edge1.z - tvec.z * edge1.y,
    y: tvec.z * edge1.x - tvec.x * edge1.z,
    z: tvec.x * edge1.y - tvec.y * edge1.x
  };
  const v = (direction.x * q.x + direction.y * q.y + direction.z * q.z) * invDet;
  if (v < -EPSILON || u + v > 1 + EPSILON) return null;
  const distance = (edge2.x * q.x + edge2.y * q.y + edge2.z * q.z) * invDet;
  return distance > EPSILON ? distance : null;
}

function recordTriangles(record) {
  const triangles = [];
  const indices = [
    ...record.geometry.topIndices,
    ...record.geometry.sideIndices,
    ...record.geometry.bottomIndices,
    ...(record.geometry.eaveIndices || [])
  ];
  for (let i = 0; i < indices.length; i += 3) {
    const points = [];
    for (let j = 0; j < 3; j++) {
      const offset = indices[i + j] * 3;
      points.push({
        x: record.worldPositions[offset],
        y: record.worldPositions[offset + 1],
        z: record.worldPositions[offset + 2]
      });
    }
    triangles.push(points);
  }
  return triangles;
}

function pointInsideRecord(point, record) {
  if (point.x < record.bounds.minX - EPSILON || point.x > record.bounds.maxX + EPSILON
    || point.y < record.bounds.minY - EPSILON || point.y > record.bounds.maxY + EPSILON
    || point.z < record.bounds.minZ - EPSILON || point.z > record.bounds.maxZ + EPSILON) {
    return false;
  }
  const direction = { x: 0.912870929, y: 0.365148372, z: 0.182574186 };
  const hits = [];
  for (const [a, b, c] of record.triangles) {
    const distance = rayTriangleDistance(point, direction, a, b, c);
    if (distance !== null && !hits.some((hit) => Math.abs(hit - distance) < 1e-5)) hits.push(distance);
  }
  return hits.length % 2 === 1;
}

function segmentTriangleParameter(start, end, a, b, c) {
  const direction = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
  const distance = rayTriangleDistance(start, direction, a, b, c);
  if (distance === null || distance >= 1 - EPSILON) return null;
  return distance;
}

function interpolatePoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
}

function pointsEqual(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-5;
}

export function clipRoofFramePaths(paths, roofOrId, context) {
  const roofId = typeof roofOrId === 'string' ? roofOrId : roofOrId?.id;
  const record = context.records.get(roofId);
  const cutters = [...(context.neighbors.get(roofId) || [])]
    .map((id) => context.records.get(id))
    .filter(Boolean)
    .map((candidate) => ({
      ...candidate,
      triangles: candidate.triangles || recordTriangles(candidate)
    }));
  if (!record || !cutters.length) return paths;

  const output = [];
  for (const path of paths) {
    let current = [];
    for (let i = 0; i < path.length - 1; i++) {
      const localStart = path[i];
      const localEnd = path[i + 1];
      const worldStart = transformLocalPointToWorld(localStart, record.metrics);
      const worldEnd = transformLocalPointToWorld(localEnd, record.metrics);
      const parameters = [0, 1];
      for (const cutter of cutters) {
        for (const triangle of cutter.triangles) {
          const t = segmentTriangleParameter(worldStart, worldEnd, ...triangle);
          if (t !== null && !parameters.some((value) => Math.abs(value - t) < 1e-5)) parameters.push(t);
        }
      }
      parameters.sort((a, b) => a - b);
      for (let j = 0; j < parameters.length - 1; j++) {
        const t0 = parameters[j];
        const t1 = parameters[j + 1];
        if (t1 - t0 < EPSILON) continue;
        const midpoint = interpolatePoint(worldStart, worldEnd, (t0 + t1) / 2);
        const hidden = cutters.some((cutter) => pointInsideRecord(midpoint, cutter));
        if (hidden) {
          if (current.length >= 2) output.push(current);
          current = [];
          continue;
        }
        const start = interpolatePoint(localStart, localEnd, t0);
        const end = interpolatePoint(localStart, localEnd, t1);
        if (!current.length) current.push(start);
        else if (!pointsEqual(current[current.length - 1], start)) {
          if (current.length >= 2) output.push(current);
          current = [start];
        }
        current.push(end);
      }
    }
    if (current.length >= 2) output.push(current);
  }
  return output;
}
