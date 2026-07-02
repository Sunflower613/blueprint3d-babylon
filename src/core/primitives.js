import { MeshBuilder, TransformNode } from './babylon.js';
const BABYLON = { MeshBuilder, TransformNode };
import { setTransform } from './BlueprintRegistry.js';

export function createBox(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateBox(name, size, registry.scene);
  setTransform(mesh, transform);
  return registry.add(mesh, options);
}

export function createCylinder(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateCylinder(name, size, registry.scene);
  setTransform(mesh, transform);
  return registry.add(mesh, options);
}

export function createSphere(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateSphere(name, size, registry.scene);
  setTransform(mesh, transform);
  return registry.add(mesh, options);
}

export function createDisc(registry, name, size, transform = {}, options = {}) {
  const mesh = BABYLON.MeshBuilder.CreateDisc(name, size, registry.scene);
  setTransform(mesh, transform);
  return registry.add(mesh, options);
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
