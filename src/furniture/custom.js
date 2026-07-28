import { boxComponent, cylinderComponent, sphereComponent, rightTriangleComponent, halfCylinderComponent, coneComponent } from './_helpers.js';

// 1. 自定义方块 (Custom Cube)
export const customCubeFurniture = {
  type: 'custom_cube',
  name: '方块',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'cube', label: '方块', defaultColor: '#e0e0e0' }
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
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'cylinder', label: '圆柱', defaultColor: '#e0e0e0' }
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
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'sphere', label: '球体', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, customSphereFurniture, 'sphere', {
      diameterX: size.width, diameterY: size.height, diameterZ: size.depth, segments: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 4. 自定义直角三角形 (Custom Right Triangle)
export const customRightTriangleFurniture = {
  type: 'custom_right_triangle',
  name: '三角形',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'rightTriangle', label: '三角形', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    rightTriangleComponent(registry, item, customRightTriangleFurniture, 'rightTriangle', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 5. 自定义半圆柱 (Custom Half Cylinder)
export const customHalfCylinderFurniture = {
  type: 'custom_half_cylinder',
  name: '半圆柱',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.5, height: 1 },
  components: [
    { id: 'halfCylinder', label: '半圆柱', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    halfCylinderComponent(registry, item, customHalfCylinderFurniture, 'halfCylinder', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 6. 自定义圆锥 (Custom Cone)
export const customConeFurniture = {
  type: 'custom_cone',
  name: '圆锥',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 1 },
  components: [
    { id: 'cone', label: '圆锥', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    coneComponent(registry, item, customConeFurniture, 'cone', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};
