import * as BABYLON from '@babylonjs/core';
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
    createBox(registry, `opening_frame_${opening.id}_${index}`, {
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
