export const ROOM_SHAPES = Object.freeze([
  { id: 'square', label: '方形', defaultWidth: 4, defaultDepth: 4 },
  { id: 'l-shape', label: 'L形', defaultWidth: 5, defaultDepth: 5 },
  { id: 'circle', label: '圆形', defaultWidth: 4, defaultDepth: 4 },
  { id: 'octagon', label: '八角', defaultWidth: 4, defaultDepth: 4 },
  { id: 'diamond', label: '四角', defaultWidth: 4, defaultDepth: 4 },
  { id: 'sector', label: '扇形', defaultWidth: 5, defaultDepth: 5 },
  { id: 'semicircle', label: '半圆', defaultWidth: 5, defaultDepth: 3 },
  { id: 'right-triangle', label: '三角形', defaultWidth: 5, defaultDepth: 4 }
]);

const SHAPE_IDS = new Set(ROOM_SHAPES.map((shape) => shape.id));

export function normalizeRoomShape(shape) {
  return SHAPE_IDS.has(shape) ? shape : 'square';
}

export function getRoomShapeDefinition(shape) {
  return ROOM_SHAPES.find((candidate) => candidate.id === normalizeRoomShape(shape));
}

function ellipseArc(start, end, segments, radiusX = 0.5, radiusZ = 0.5) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = start + (end - start) * index / segments;
    return { x: Math.cos(angle) * radiusX, z: Math.sin(angle) * radiusZ };
  });
}

export function getRoomLocalVertices(shape) {
  switch (normalizeRoomShape(shape)) {
    case 'l-shape':
      return [
        { x: -0.5, z: -0.5 }, { x: 0.5, z: -0.5 },
        { x: 0.5, z: 0 }, { x: 0, z: 0 },
        { x: 0, z: 0.5 }, { x: -0.5, z: 0.5 }
      ];
    case 'circle':
      return ellipseArc(-Math.PI / 2, Math.PI * 1.5, 24).slice(0, -1);
    case 'octagon':
      return ellipseArc(-Math.PI / 2, Math.PI * 1.5, 8).slice(0, -1);
    case 'diamond':
      return [
        { x: 0, z: -0.5 }, { x: 0.5, z: 0 },
        { x: 0, z: 0.5 }, { x: -0.5, z: 0 }
      ];
    case 'sector': {
      const arc = ellipseArc(-Math.PI / 2, 0, 10);
      return [{ x: -0.5, z: 0.5 }, ...arc];
    }
    case 'semicircle':
      return ellipseArc(Math.PI, Math.PI * 2, 16);
    case 'right-triangle':
      return [{ x: -0.5, z: -0.5 }, { x: 0.5, z: 0.5 }, { x: -0.5, z: 0.5 }];
    case 'square':
    default:
      return [
        { x: -0.5, z: -0.5 }, { x: 0.5, z: -0.5 },
        { x: 0.5, z: 0.5 }, { x: -0.5, z: 0.5 }
      ];
  }
}

export function getRoomVertices(room, local = false) {
  const width = Math.max(1.2, Number(room.width) || 4);
  const depth = Math.max(1.2, Number(room.depth) || 4);
  const originX = local ? 0 : Number(room.x) || 0;
  const originZ = local ? 0 : Number(room.z) || 0;
  return getRoomLocalVertices(room.shape).map((point) => ({
    x: originX + point.x * width,
    z: originZ + point.z * depth
  }));
}

export function getRoomBounds(room) {
  const vertices = getRoomVertices(room);
  return {
    left: Math.min(...vertices.map((point) => point.x)),
    right: Math.max(...vertices.map((point) => point.x)),
    top: Math.min(...vertices.map((point) => point.z)),
    bottom: Math.max(...vertices.map((point) => point.z))
  };
}

export function pointInRoom(room, x, z) {
  const vertices = getRoomVertices(room);
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const a = vertices[i];
    const b = vertices[j];
    const crosses = ((a.z > z) !== (b.z > z))
      && x < (b.x - a.x) * (z - a.z) / ((b.z - a.z) || Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function getRoomWallKeys(room) {
  if (normalizeRoomShape(room.shape) === 'square') return ['north', 'east', 'south', 'west'];
  return getRoomLocalVertices(room.shape).map((_, index) => `edge_${index}`);
}

function signedArea(vertices) {
  return vertices.reduce((sum, point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return sum + point.x * next.z - next.x * point.z;
  }, 0) / 2;
}

function pointInTriangle(point, a, b, c) {
  const sign = (p1, p2, p3) => (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
  const d1 = sign(point, a, b);
  const d2 = sign(point, b, c);
  const d3 = sign(point, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

export function triangulateRoom(room) {
  const vertices = getRoomVertices(room, true);
  const remaining = vertices.map((_, index) => index);
  if (signedArea(vertices) < 0) remaining.reverse();
  const triangles = [];
  let guard = remaining.length * remaining.length;
  while (remaining.length > 3 && guard > 0) {
    guard -= 1;
    let clipped = false;
    for (let i = 0; i < remaining.length; i += 1) {
      const prev = remaining[(i - 1 + remaining.length) % remaining.length];
      const current = remaining[i];
      const next = remaining[(i + 1) % remaining.length];
      const a = vertices[prev];
      const b = vertices[current];
      const c = vertices[next];
      const cross = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
      if (cross <= 1e-8) continue;
      if (remaining.some((index) => index !== prev && index !== current && index !== next && pointInTriangle(vertices[index], a, b, c))) continue;
      triangles.push([prev, current, next]);
      remaining.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (remaining.length === 3) triangles.push([...remaining]);
  return { vertices, triangles };
}
