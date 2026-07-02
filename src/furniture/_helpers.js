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

  // 对于立面展示型组件（如屏幕、画布、照片、海报等），自定义贴图如果默认 invertY 会导致图片倒立，故设为 false
  const compIdLower = componentId.toLowerCase();
  if (
    compIdLower.includes('screen') ||
    compIdLower.includes('canvas') ||
    compIdLower.includes('picture') ||
    compIdLower.includes('painting') ||
    compIdLower.includes('poster') ||
    compIdLower.includes('photo')
  ) {
    options.invertY = false;
  }

  // 当组件 ID 包含 'glass' 且描述符还是普通颜色字符串时，自动升级为 kind: 'glass'
  // 这确保了向后兼容：现有家具定义无需修改即可获得玻璃效果
  if (componentId.toLowerCase().includes('glass') && (typeof descriptor === 'string' || descriptor?.kind === 'color')) {
    descriptor = { kind: 'glass', color: color, alpha: 0.25 };
  }

  // 当组件 ID 包含 'mirror' 且描述符还是普通颜色字符串时，自动升级为 kind: 'mirror'
  if (componentId.toLowerCase().includes('mirror') && (typeof descriptor === 'string' || descriptor?.kind === 'color')) {
    descriptor = { kind: 'mirror', color: color };
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
  mesh.metadata = { ...(mesh.metadata || {}), isCylinder: true };
  return markComponent(mesh, item, componentId);
}

export function sphereComponent(registry, item, definition, componentId, dimensions, transform, options = {}) {
  const mesh = createSphere(registry, `${item.id}_${componentId}`, dimensions, transform, {
    ...options,
    material: getComponentMaterial(registry, item, definition, componentId)
  });
  return markComponent(mesh, item, componentId);
}
