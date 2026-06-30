export const OPENING_SHAPES = Object.freeze([
  { id: 'square', label: '方形' },
  { id: 'diamond', label: '四角' },
  { id: 'circle', label: '圆形' },
  { id: 'semicircle', label: '半圆形' },
  { id: 'round-arch', label: '圆顶方形' },
  { id: 'pointed-arch', label: '尖顶方形' },
  { id: 'quarter-sector', label: '扇形' },
  { id: 'right-triangle', label: '三角形' }
]);

const SHAPE_IDS = new Set(OPENING_SHAPES.map((shape) => shape.id));

export function normalizeOpeningShape(shape) {
  return SHAPE_IDS.has(shape) ? shape : 'square';
}

function arc(start, end, segments, centerX = 0, centerY = 0, radiusX = 0.5, radiusY = 1) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = start + (end - start) * index / segments;
    return {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY
    };
  });
}

export function getOpeningUnitVertices(shape) {
  switch (normalizeOpeningShape(shape)) {
    case 'diamond':
      return [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0, y: 1 }, { x: -0.5, y: 0.5 }];
    case 'circle':
      return arc(-Math.PI / 2, Math.PI * 1.5, 24, 0, 0.5, 0.5, 0.5).slice(0, -1);
    case 'semicircle':
      return [
        { x: -0.5, y: 0 },
        ...arc(0, Math.PI, 16, 0, 0, 0.5, 1).slice(0, -1)
      ];
    case 'round-arch':
      return [
        { x: -0.5, y: 0 }, { x: 0.5, y: 0 }, { x: 0.5, y: 0.68 },
        ...arc(0, Math.PI, 12, 0, 0.68, 0.5, 0.32).slice(1)
      ];
    case 'pointed-arch':
      return [
        { x: -0.5, y: 0 }, { x: 0.5, y: 0 },
        { x: 0.5, y: 0.7 }, { x: 0, y: 1 }, { x: -0.5, y: 0.7 }
      ];
    case 'quarter-sector':
      return [
        { x: -0.5, y: 0 },
        ...arc(0, Math.PI / 2, 12, -0.5, 0, 1, 1).slice(0)
      ];
    case 'right-triangle':
      return [{ x: -0.5, y: 0 }, { x: 0.5, y: 0 }, { x: -0.5, y: 1 }];
    case 'square':
    default:
      return [{ x: -0.5, y: 0 }, { x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: -0.5, y: 1 }];
  }
}

export function getOpeningVertices(openingOrShape, width, height) {
  const shape = typeof openingOrShape === 'string' ? openingOrShape : openingOrShape?.shape;
  const resolvedWidth = Math.max(0.25, Number(width ?? openingOrShape?.width) || 1);
  const resolvedHeight = Math.max(0.3, Number(height ?? openingOrShape?.height) || 1);
  return getOpeningUnitVertices(shape).map((point) => ({
    x: point.x * resolvedWidth,
    y: point.y * resolvedHeight
  }));
}

function signedArea(vertices) {
  return vertices.reduce((sum, point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function pointInTriangle(point, a, b, c) {
  const sign = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(point, a, b);
  const d2 = sign(point, b, c);
  const d3 = sign(point, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

export function triangulateOpening(openingOrShape, width, height) {
  const vertices = getOpeningVertices(openingOrShape, width, height);
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
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
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

export function isSymmetricShape(shape) {
  const resolved = normalizeOpeningShape(shape);
  return ['square', 'diamond', 'circle', 'semicircle', 'round-arch', 'pointed-arch'].includes(resolved);
}
