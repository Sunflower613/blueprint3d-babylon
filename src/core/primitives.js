import { MeshBuilder, TransformNode, Mesh, Vector3, VertexBuffer, Matrix, VertexData } from './babylon.js';
const BABYLON = { MeshBuilder, TransformNode, Mesh, Vector3, VertexBuffer, Matrix, VertexData };
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

export function createRightTriangle(registry, name, size, transform = {}, options = {}) {
  const width = size.width || 1;
  const height = size.height || 1;
  const depth = size.depth || 1;

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const positions = [
    // 1. 底部 (Y = -halfH)
    -halfW, -halfH, -halfD,
    +halfW, -halfH, -halfD,
    -halfW, -halfH, +halfD,

    // 2. 顶部 (Y = +halfH)
    -halfW, +halfH, -halfD,
    +halfW, +halfH, -halfD,
    -halfW, +halfH, +halfD,

    // 3. 背面 (Z = -halfD)
    -halfW, -halfH, -halfD,
    +halfW, -halfH, -halfD,
    +halfW, +halfH, -halfD,
    -halfW, +halfH, -halfD,

    // 4. 左侧面 (X = -halfW)
    -halfW, -halfH, +halfD,
    -halfW, -halfH, -halfD,
    -halfW, +halfH, -halfD,
    -halfW, +halfH, +halfD,

    // 5. 斜面 ((+halfW, -halfD) -> (-halfW, +halfD))
    +halfW, -halfH, -halfD,
    -halfW, -halfH, +halfD,
    -halfW, +halfH, +halfD,
    +halfW, +halfH, -halfD
  ];

  const uvs = [
    // 底部
    0, 0,  1, 0,  0, 1,
    // 顶部
    0, 0,  1, 0,  0, 1,
    // 背面
    0, 0,  1, 0,  1, 1,  0, 1,
    // 左侧面
    0, 0,  1, 0,  1, 1,  0, 1,
    // 斜面
    0, 0,  1, 0,  1, 1,  0, 1
  ];

  const indices = [
    // 底部
    0, 2, 1,
    // 顶部
    3, 4, 5,
    // 背面
    6, 7, 8,
    6, 8, 9,
    // 左侧面
    10, 11, 12,
    10, 12, 13,
    // 斜面
    14, 15, 16,
    14, 16, 17
  ];

  const normals = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);

  const vertexData = new BABYLON.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;

  const scene = registry?.scene || registry?.renderer?.scene;
  const mesh = new BABYLON.Mesh(name, scene);
  vertexData.applyToMesh(mesh);

  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, options);
}

export function createHalfCylinder(registry, name, size, transform = {}, options = {}) {
  const width = size.width || 1;
  const height = size.height || 1;
  const depth = size.depth || width;
  const tessellation = options.tessellation || 24;
  const scene = registry?.scene || registry?.renderer?.scene;

  const cylinder = BABYLON.MeshBuilder.CreateCylinder(`${name}_arc`, {
    diameterTop: width,
    diameterBottom: width,
    height: height,
    tessellation: tessellation,
    arc: 0.5,
    cap: BABYLON.Mesh.CAP_ALL,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE
  }, scene);

  const plane = BABYLON.MeshBuilder.CreatePlane(`${name}_cap`, {
    width: width,
    height: height,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE
  }, scene);

  const mesh = BABYLON.Mesh.MergeMeshes([cylinder, plane], true, true, undefined, false, true);
  if (mesh) {
    mesh.name = name;
  }
  const targetMesh = mesh || cylinder;

  const scaleZ = depth / (width / 2);
  const matrix = BABYLON.Matrix.Scaling(1, 1, scaleZ).multiply(
    BABYLON.Matrix.Translation(0, 0, -width / 4)
  );
  targetMesh.bakeTransformIntoVertices(matrix);

  setTransform(targetMesh, transform);
  return registerOrApplyOptions(registry, targetMesh, options);
}

export function createCone(registry, name, size, transform = {}, options = {}) {
  const width = size.width || 1;
  const height = size.height || 1;
  const tessellation = options.tessellation || 24;

  const mesh = BABYLON.MeshBuilder.CreateCylinder(name, {
    diameterTop: 0,
    diameterBottom: width,
    height: height,
    tessellation: tessellation
  }, registry?.scene || registry?.renderer?.scene);

  setTransform(mesh, transform);
  return registerOrApplyOptions(registry, mesh, options);
}
