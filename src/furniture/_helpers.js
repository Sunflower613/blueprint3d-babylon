import * as BABYLON from '@babylonjs/core';
import { createBlueprintMaterial, materialPreviewColor } from '../core/materials.js';
import { createBox, createCylinder, createSphere } from '../core/primitives.js';

export function getComponentColor(item, definition, componentId) {
  const component = definition.components.find((candidate) => candidate.id === componentId);
  const descriptor = item.materials?.[componentId] || item.colors?.[componentId] || component?.defaultColor || '#ffffff';
  return materialPreviewColor(descriptor, component?.defaultColor || '#ffffff');
}

export function getComponentMaterialDescriptor(item, definition, componentId) {
  const component = definition.components.find((candidate) => candidate.id === componentId);
  return item.materials?.[componentId] || item.colors?.[componentId] || component?.defaultColor || '#ffffff';
}

export function getComponentMaterial(registry, item, definition, componentId) {
  let descriptor = getComponentMaterialDescriptor(item, definition, componentId);
  const color = getComponentColor(item, definition, componentId);
  const options = { fallbackColor: color };

  // 当组件 ID 包含 'glass' 且描述符还是普通颜色字符串时，自动升级为 kind: 'glass'
  // 这确保了向后兼容：现有家具定义无需修改即可获得玻璃效果
  if (componentId.toLowerCase().includes('glass') && (typeof descriptor === 'string' || descriptor?.kind === 'color')) {
    descriptor = { kind: 'glass', color: color, alpha: 0.25 };
  }

  return createBlueprintMaterial(registry.scene, `item_${item.id}_${componentId}_${Date.now()}`, descriptor, options);
}

export function markComponent(mesh, item, componentId) {
  mesh.metadata = {
    ...(mesh.metadata || {}),
    blueprintItemId: item.id,
    blueprintFurnitureComponentId: componentId
  };
  return mesh;
}

export function boxComponent(registry, item, definition, componentId, dimensions, transform, options = {}) {
  const mesh = createBox(registry, `${item.id}_${componentId}`, dimensions, transform, {
    ...options,
    material: getComponentMaterial(registry, item, definition, componentId)
  });
  return markComponent(mesh, item, componentId);
}

export function cylinderComponent(registry, item, definition, componentId, dimensions, transform, options = {}) {
  const mesh = createCylinder(registry, `${item.id}_${componentId}`, dimensions, transform, {
    ...options,
    material: getComponentMaterial(registry, item, definition, componentId)
  });
  return markComponent(mesh, item, componentId);
}

export function sphereComponent(registry, item, definition, componentId, dimensions, transform, options = {}) {
  const mesh = createSphere(registry, `${item.id}_${componentId}`, dimensions, transform, {
    ...options,
    material: getComponentMaterial(registry, item, definition, componentId)
  });
  return markComponent(mesh, item, componentId);
}
