import { Mesh, VertexData } from '../core/babylon.js';
const BABYLON = { Mesh, VertexData };
import { createBox } from '../core/primitives.js';
import { getOpeningVertices, triangulateOpening } from './openingShapes.js';

export function createOpeningProfileMesh(registry, name, opening, parent, options = {}) {
  const width = options.width ?? opening.width ?? 1;
  const height = options.height ?? opening.height ?? 1;
  const depth = options.depth ?? 0.04;
  const scaleX = options.scaleX ?? 1;
  const scaleY = options.scaleY ?? 1;
  const offsetX = options.offsetX ?? 0;
  const centerY = options.centerY ?? height / 2;
  const triangulated = triangulateOpening(opening, width, height);
  const vertices = triangulated.vertices.map((point) => ({
    x: point.x * scaleX + offsetX,
    y: (point.y - height / 2) * scaleY + centerY - height / 2
  }));
  const positions = [];
  const indices = [];
  const normals = [];
  const uvs = [];

  if (options.flat) {
    const isBack = options.faceDirection === 'back';
    vertices.forEach((point) => {
      positions.push(point.x, point.y, 0);
      uvs.push(point.x / Math.max(width, 0.001) + 0.5, point.y / Math.max(height, 0.001) + 0.5);
    });
    triangulated.triangles.forEach(([a, b, c]) => {
      if (isBack) {
        indices.push(a, c, b);
      } else {
        indices.push(a, b, c);
      }
    });
  } else {
    const halfDepth = depth / 2;
    vertices.forEach((point) => {
      positions.push(point.x, point.y, halfDepth);
      uvs.push(point.x / Math.max(width, 0.001) + 0.5, point.y / Math.max(height, 0.001) + 0.5);
    });
    vertices.forEach((point) => {
      positions.push(point.x, point.y, -halfDepth);
      uvs.push(point.x / Math.max(width, 0.001) + 0.5, point.y / Math.max(height, 0.001) + 0.5);
    });
    const backOffset = vertices.length;
    triangulated.triangles.forEach(([a, b, c]) => {
      indices.push(a, b, c, backOffset + a, backOffset + c, backOffset + b);
    });
    vertices.forEach((point, index) => {
      const nextIndex = (index + 1) % vertices.length;
      const next = vertices[nextIndex];
      const sideOffset = positions.length / 3;
      positions.push(
        point.x, point.y, halfDepth,
        next.x, next.y, halfDepth,
        next.x, next.y, -halfDepth,
        point.x, point.y, -halfDepth
      );
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      indices.push(sideOffset, sideOffset + 1, sideOffset + 2, sideOffset, sideOffset + 2, sideOffset + 3);
    });
  }

  const mesh = new BABYLON.Mesh(name, registry.scene);
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);
  const vertexData = new BABYLON.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(mesh);
  mesh.material = options.material || null;
  registry.add(mesh, { parent, shadowCaster: options.shadowCaster !== false });
  return mesh;
}

export function buildOpeningFrame(registry, opening, parent, options = {}) {
  const width = options.width ?? opening.width ?? 1;
  const height = options.height ?? opening.height ?? 1;
  const frameW = options.frameW ?? 0.04;
  const frameT = options.frameT ?? 0.2;
  const material = options.material || registry.materials.trim;
  const vertices = getOpeningVertices(opening, width, height);
  vertices.forEach((point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    if (options.skipBottom && Math.abs(point.y) < 1e-6 && Math.abs(next.y) < 1e-6) return;
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.005) return;
    const box = createBox(registry, `opening_frame_${opening.id}_${index}`, {
      width: length,
      height: frameW,
      depth: frameT
    }, {
      position: { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 - height / 2, z: 0 },
      rotation: { z: Math.atan2(dy, dx) }
    }, {
      material,
      parent,
      shadowCaster: false
    });
    box.metadata = { ...box.metadata, blueprintOpeningComponentId: 'frame' };
  });
}

export function createOpeningPickProxy(registry, opening, parent, options = {}) {
  const proxy = createOpeningProfileMesh(registry, `opening_pick_proxy_${opening.id}`, opening, parent, {
    ...options,
    depth: Math.max(0.025, options.depth || 0.025),
    shadowCaster: false
  });
  proxy.visibility = 0.001;
  proxy.isPickable = true;
  proxy.metadata = { blueprintOpeningId: opening.id, pickProxy: true };
  return proxy;
}

export function createOpeningCutterMesh(scene, opening, options = {}) {
  const registry = {
    scene,
    add(mesh) { return mesh; }
  };
  const mesh = createOpeningProfileMesh(registry, `opening_cutter_${opening.id}`, opening, null, {
    width: options.width,
    height: options.height,
    depth: options.depth,
    centerY: options.height / 2,
    shadowCaster: false
  });
  mesh.position.set(options.x, options.y, options.z);
  mesh.rotation.y = options.rotation || 0;
  mesh.computeWorldMatrix(true);
  return mesh;
}

export function buildOpeningBars(registry, opening, parent, options = {}) {
  const horizontalBars = Math.max(0, Math.floor(options.horizontalBars ?? opening.horizontalBars ?? 0));
  const verticalBars = Math.max(0, Math.floor(options.verticalBars ?? opening.verticalBars ?? 0));
  const concentricBars = Math.max(0, Math.floor(options.concentricBars ?? opening.concentricBars ?? 0));
  const radialBars = Math.max(0, Math.floor(options.radialBars ?? opening.radialBars ?? 0));
  if (horizontalBars <= 0 && verticalBars <= 0 && concentricBars <= 0 && radialBars <= 0) return;

  const width = options.width ?? opening.width ?? 1.25;
  const height = options.height ?? opening.height ?? 0.85;
  const frameW = options.frameW ?? 0.05;
  const barDepth = options.barDepth ?? 0.05;
  const barWidth = options.barWidth ?? 0.05;
  const material = options.material || registry.materials.trim;
  const offsetX = options.offsetX ?? 0;
  const clipMinX = options.clipMinX ?? -Infinity;
  const clipMaxX = options.clipMaxX ?? Infinity;

  const vertices = getOpeningVertices(opening, width, height);

  const createBar = (name, start, end, componentId) => {
    let x1 = start.x;
    let y1 = start.y;
    let x2 = end.x;
    let y2 = end.y;
    const dx = x2 - x1;
    if (Math.abs(dx) < 1e-8) {
      if (x1 < clipMinX || x1 > clipMaxX) return;
    } else {
      const tAtMin = (clipMinX - x1) / dx;
      const tAtMax = (clipMaxX - x1) / dx;
      const tStart = Math.max(0, Math.min(tAtMin, tAtMax));
      const tEnd = Math.min(1, Math.max(tAtMin, tAtMax));
      if (tStart > tEnd) return;
      const originalY2 = y2;
      x2 = x1 + dx * tEnd;
      y2 = y1 + (originalY2 - y1) * tEnd;
      x1 += dx * tStart;
      y1 += (originalY2 - y1) * tStart;
    }
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (length <= 0.01) return;
    const bar = createBox(registry, name, {
      width: length,
      height: barWidth,
      depth: barDepth
    }, {
      position: {
        x: (x1 + x2) / 2 + offsetX,
        y: (y1 + y2) / 2 - height / 2,
        z: 0
      },
      rotation: { z: Math.atan2(y2 - y1, x2 - x1) }
    }, {
      material,
      parent,
      shadowCaster: false
    });
    bar.metadata = { ...bar.metadata, blueprintOpeningComponentId: componentId };
  };

  // 1. 绘制横条 (Horizontal Bars)
  if (horizontalBars > 0) {
    const yMin = frameW;
    const yMax = height - frameW;
    const stepY = (yMax - yMin) / (horizontalBars + 1);
    for (let k = 1; k <= horizontalBars; k += 1) {
      const targetY = yMin + stepY * k;
      const xIntersections = [];
      vertices.forEach((p1, idx) => {
        const p2 = vertices[(idx + 1) % vertices.length];
        if ((p1.y <= targetY && p2.y >= targetY) || (p2.y <= targetY && p1.y >= targetY)) {
          if (Math.abs(p2.y - p1.y) > 1e-6) {
            const x = p1.x + (p2.x - p1.x) * ((targetY - p1.y) / (p2.y - p1.y));
            xIntersections.push(x);
          }
        }
      });
      xIntersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xIntersections.length; i += 2) {
        const xStart = xIntersections[i] + frameW * 0.5;
        const xEnd = xIntersections[i + 1] - frameW * 0.5;
        createBar(
          `opening_hbar_${opening.id}_${k}_${i}`,
          { x: xStart, y: targetY },
          { x: xEnd, y: targetY },
          'hbar'
        );
      }
    }
  }

  // 2. 绘制竖条 (Vertical Bars)
  if (verticalBars > 0) {
    const xMin = -width / 2 + frameW;
    const xMax = width / 2 - frameW;
    const stepX = (xMax - xMin) / (verticalBars + 1);
    for (let j = 1; j <= verticalBars; j += 1) {
      const targetX = xMin + stepX * j;
      const yIntersections = [];
      vertices.forEach((p1, idx) => {
        const p2 = vertices[(idx + 1) % vertices.length];
        if ((p1.x <= targetX && p2.x >= targetX) || (p2.x <= targetX && p1.x >= targetX)) {
          if (Math.abs(p2.x - p1.x) > 1e-6) {
            const y = p1.y + (p2.y - p1.y) * ((targetX - p1.x) / (p2.x - p1.x));
            yIntersections.push(y);
          }
        }
      });
      yIntersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < yIntersections.length; i += 2) {
        const yStart = yIntersections[i] + frameW * 0.5;
        const yEnd = yIntersections[i + 1] - frameW * 0.5;
        createBar(
          `opening_vbar_${opening.id}_${j}_${i}`,
          { x: targetX, y: yStart },
          { x: targetX, y: yEnd },
          'vbar'
        );
      }
    }
  }

  const minX = Math.min(...vertices.map((point) => point.x));
  const maxX = Math.max(...vertices.map((point) => point.x));
  const minY = Math.min(...vertices.map((point) => point.y));
  const maxY = Math.max(...vertices.map((point) => point.y));
  const shape = opening.shape || 'square';
  const radialCornerShape = ['semicircle', 'quarter-sector', 'right-triangle'].includes(shape);
  const center = radialCornerShape
    ? { x: shape === 'semicircle' ? (minX + maxX) / 2 : minX, y: minY }
    : { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const outerRatio = Math.max(0.1, 1 - frameW / Math.max(0.001, Math.min(width, height) / 2));
  const ringRatios = Array.from(
    { length: concentricBars },
    (_, index) => outerRatio * (index + 1) / (concentricBars + 1)
  );
  let concentricSegmentIndexes = vertices.map((_, index) => index);
  if (shape === 'semicircle') {
    concentricSegmentIndexes = concentricSegmentIndexes.slice(1);
  } else if (shape === 'quarter-sector') {
    concentricSegmentIndexes = concentricSegmentIndexes.slice(1, -1);
  } else if (shape === 'right-triangle') {
    concentricSegmentIndexes = [1];
  }

  // 半圆、扇形只保留同心弧，直角三角形只保留与斜边对应的收缩线。
  ringRatios.forEach((ratio, ringIndex) => {
    const ring = vertices.map((point) => ({
      x: center.x + (point.x - center.x) * ratio,
      y: center.y + (point.y - center.y) * ratio
    }));
    concentricSegmentIndexes.forEach((segmentIndex) => {
      createBar(
        `opening_cbar_${opening.id}_${ringIndex}_${segmentIndex}`,
        ring[segmentIndex],
        ring[(segmentIndex + 1) % ring.length],
        'cbar'
      );
    });
  });

  // 有同心条时从最内层同心条开始并保持内圈净空；没有同心条时直接汇聚到中心。
  if (radialBars > 0) {
    const innerRatio = ringRatios[0] ?? 0;
    let radialTargets;
    if (shape === 'semicircle') {
      radialTargets = Array.from({ length: radialBars }, (_, index) => {
        const angle = Math.PI * (index + 1) / (radialBars + 1);
        return {
          x: center.x + (maxX - minX) / 2 * Math.cos(angle),
          y: center.y + (maxY - minY) * Math.sin(angle)
        };
      });
    } else if (shape === 'quarter-sector') {
      radialTargets = Array.from({ length: radialBars }, (_, index) => {
        const angle = Math.PI / 2 * (index + 1) / (radialBars + 1);
        return {
          x: center.x + (maxX - minX) * Math.cos(angle),
          y: center.y + (maxY - minY) * Math.sin(angle)
        };
      });
    } else if (shape === 'right-triangle') {
      radialTargets = Array.from({ length: radialBars }, (_, index) => {
        const ratio = (index + 1) / (radialBars + 1);
        return {
          x: maxX + (minX - maxX) * ratio,
          y: minY + (maxY - minY) * ratio
        };
      });
    } else {
      const cross = (a, b) => a.x * b.y - a.y * b.x;
      radialTargets = Array.from({ length: radialBars }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / radialBars;
        const direction = { x: Math.cos(angle), y: Math.sin(angle) };
        let boundaryDistance = Infinity;
        vertices.forEach((point, vertexIndex) => {
          const next = vertices[(vertexIndex + 1) % vertices.length];
          const edge = { x: next.x - point.x, y: next.y - point.y };
          const fromCenter = { x: point.x - center.x, y: point.y - center.y };
          const denominator = cross(direction, edge);
          if (Math.abs(denominator) < 1e-8) return;
          const rayT = cross(fromCenter, edge) / denominator;
          const edgeT = cross(fromCenter, direction) / denominator;
          if (rayT >= 0 && edgeT >= -1e-8 && edgeT <= 1 + 1e-8) {
            boundaryDistance = Math.min(boundaryDistance, rayT);
          }
        });
        return {
          x: center.x + direction.x * boundaryDistance,
          y: center.y + direction.y * boundaryDistance
        };
      });
    }
    radialTargets.forEach((target, index) => {
      if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return;
      createBar(
        `opening_rbar_${opening.id}_${index}`,
        {
          x: center.x + (target.x - center.x) * innerRatio,
          y: center.y + (target.y - center.y) * innerRatio
        },
        {
          x: center.x + (target.x - center.x) * outerRatio,
          y: center.y + (target.y - center.y) * outerRatio
        },
        'rbar'
      );
    });
  }
}

// 兼容旧版公开方法名。
export const buildWindowMullions = buildOpeningBars;

