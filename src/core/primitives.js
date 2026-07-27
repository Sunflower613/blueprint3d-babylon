import { MeshBuilder, TransformNode, Mesh, Vector3, VertexBuffer } from './babylon.js';
const BABYLON = { MeshBuilder, TransformNode, Mesh, Vector3, VertexBuffer };
import { setTransform } from './BlueprintRegistry.js';

export function orientBoxTextureCoordinates(mesh) {
  const positions = mesh.getVerticesData?.(BABYLON.VertexBuffer.PositionKind);
  const normals = mesh.getVerticesData?.(BABYLON.VertexBuffer.NormalKind);
  const uvs = mesh.getVerticesData?.(BABYLON.VertexBuffer.UVKind);
  if (!positions || !normals || !uvs || positions.length !== normals.length || positions.length / 3 !== uvs.length / 2) {
    return;
  }

  const xs = [];
  const ys = [];
  const zs = [];
  for (let i = 0; i < positions.length; i += 3) {
    xs.push(positions[i]);
    ys.push(positions[i + 1]);
    zs.push(positions[i + 2]);
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const range = (min, max) => Math.max(0.0001, max - min);

  for (let i = 0; i < positions.length; i += 3) {
    const uvIndex = (i / 3) * 2;
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];

    if (Math.abs(ny) > 0.5) {
      uvs[uvIndex] = (x - minX) / range(minX, maxX);
      uvs[uvIndex + 1] = (z - minZ) / range(minZ, maxZ);
    } else if (Math.abs(nx) > 0.5) {
      uvs[uvIndex] = (z - minZ) / range(minZ, maxZ);
      uvs[uvIndex + 1] = (y - minY) / range(minY, maxY);
    } else if (Math.abs(nz) > 0.5) {
      uvs[uvIndex] = (x - minX) / range(minX, maxX);
      uvs[uvIndex + 1] = (y - minY) / range(minY, maxY);
    }
  }

  mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, false);
}

function registerOrApplyOptions(registry, node, options = {}) {
  if (registry && typeof registry.add === 'function') {
    return registry.add(node, options);
  }
  if (node) {
    if (options.parent) node.parent = options.parent;
    if (options.material) node.material = options.material;
    if (options.receiveShadows) node.receiveShadows = true;
  }
  return node;
}

export function createBox(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateBox(name, size, registry?.scene || registry?.renderer?.scene);
  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, options);
}

export function createCylinder(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateCylinder(name, size, registry?.scene || registry?.renderer?.scene);
  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, options);
}

export function createSphere(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateSphere(name, size, registry?.scene || registry?.renderer?.scene);
  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, options);
}

export function createDisc(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateDisc(name, size, registry?.scene || registry?.renderer?.scene);
  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, options);
}

export function createLathe(registry, name, options = {}, transform = {}, registryOptions = {}) {
  const latheOptions = {
    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    ...options
  };

  if (Array.isArray(latheOptions.shape)) {
    latheOptions.shape = latheOptions.shape.map(pt => {
      if (pt instanceof BABYLON.Vector3) {
        return pt;
      }
      if (Array.isArray(pt)) {
        return new BABYLON.Vector3(pt[0], pt[1], 0);
      }
      return new BABYLON.Vector3(pt.x ?? 0, pt.y ?? 0, 0);
    });
  }

  const mesh = BABYLON.MeshBuilder.CreateLathe(name, latheOptions, registry?.scene || registry?.renderer?.scene);
  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, registryOptions);
}


export function createFenceLine(registry, points, options = {}) {
  const [start, end] = points;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const step = options.step || 2.2;
  const count = Math.max(1, Math.round(dist / step));
  const y = options.y || 0.6;
  const height = options.height || 0.8;
  const posts = [];

  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const x = start.x + dx * t;
    const z = start.z + dz * t;
    if (options.skip && options.skip(x, z)) continue;

    posts.push({ x, z });
    createCylinder(registry, options.postName || 'fencePost', {
      diameterTop: options.postDiameter || 0.32,
      diameterBottom: options.postDiameter || 0.32,
      height: height + 0.2,
      tessellation: options.tessellation || 8
    }, {
      position: { x, y: y + (height + 0.2) / 2, z }
    }, {
      material: options.postMaterial,
      parent: options.parent
    });
  }

  for (let i = 0; i < posts.length - 1; i += 1) {
    const a = posts[i];
    const b = posts[i + 1];
    const gap = Math.sqrt((b.x - a.x) ** 2 + (b.z - a.z) ** 2);
    if (gap > step * 1.5) continue;

    const angle = Math.atan2(b.z - a.z, b.x - a.x);
    const railGroup = new BABYLON.TransformNode(options.railGroupName || 'fenceRailGroup', registry.scene);
    railGroup.position.set((a.x + b.x) / 2, y + height / 2, (a.z + b.z) / 2);
    railGroup.rotation.y = -angle;
    registry.add(railGroup, { parent: options.parent, shadowCaster: false });

    [-0.16, 0.16].forEach((railY, index) => {
      createBox(registry, index === 0 ? 'fenceRailBottom' : 'fenceRailTop', {
        width: gap - 0.1,
        height: options.railThickness || 0.05,
        depth: options.railThickness || 0.05
      }, {
        position: { x: 0, y: railY, z: 0 }
      }, {
        parent: railGroup,
        material: options.railMaterial
      });
    });
  }

  return posts;
}
