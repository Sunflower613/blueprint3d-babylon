import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1. 自定义方块 (Custom Cube)
export const customCubeFurniture = {
  type: 'custom_cube',
  name: '方块',
  defaultSize: { width: 36, depth: 36, height: 36 },
  components: [
    { id: 'cube', label: '方块主体', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, customCubeFurniture, 'cube', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 2. 自定义圆柱 (Custom Cylinder)
export const customCylinderFurniture = {
  type: 'custom_cylinder',
  name: '圆柱',
  defaultSize: { width: 36, depth: 36, height: 36 },
  components: [
    { id: 'cylinder', label: '圆柱主体', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, customCylinderFurniture, 'cylinder', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height, tessellation: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 3. 自定义球体 (Custom Sphere)
export const customSphereFurniture = {
  type: 'custom_sphere',
  name: '球体',
  defaultSize: { width: 36, depth: 36, height: 36 },
  components: [
    { id: 'sphere', label: '球体主体', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, customSphereFurniture, 'sphere', {
      diameterX: size.width, diameterY: size.height, diameterZ: size.depth, segments: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};
