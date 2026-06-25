import * as BABYLON from '@babylonjs/core';

export function createFlatMaterial(scene, name, colorHex, options = {}) {
  const material = new BABYLON.StandardMaterial(name, scene);
  const color = BABYLON.Color3.FromHexString(colorHex || '#ffffff');

  material.diffuseColor = color;
  material.specularColor = options.specularColor || new BABYLON.Color3(0, 0, 0);
  material.flatShading = options.flatShading !== false;
  material.maxSimultaneousLights = 16;

  if (options.alpha !== undefined) material.alpha = options.alpha;
  if (options.emissive || options.disableLighting) {
    material.emissiveColor = options.emissiveColor
      ? BABYLON.Color3.FromHexString(options.emissiveColor)
      : color;
    material.disableLighting = options.disableLighting !== false;
  }
  if (options.backFaceCulling !== undefined) material.backFaceCulling = options.backFaceCulling;

  return material;
}

export function normalizeMaterialDescriptor(value, fallbackColor = '#ffffff') {
  if (!value) return { kind: 'color', color: fallbackColor };
  if (typeof value === 'string') return { kind: 'color', color: value };
  if (value.kind === 'texture' || value.src) {
    return {
      kind: 'texture',
      category: value.category || 'custom',
      name: value.name || value.fileName || '自定义材质',
      fileName: value.fileName,
      src: value.src,
      scale: Number(value.scale || 1),
      color: value.color || fallbackColor
    };
  }
  return {
    kind: 'color',
    category: value.category || 'paint',
    name: value.name || '颜色',
    color: value.color || fallbackColor
  };
}

export function materialPreviewColor(value, fallbackColor = '#ffffff') {
  return normalizeMaterialDescriptor(value, fallbackColor).color || fallbackColor;
}

export function createBlueprintMaterial(scene, name, descriptor, options = {}) {
  const normalized = normalizeMaterialDescriptor(descriptor, options.fallbackColor || '#ffffff');
  const material = createFlatMaterial(scene, name, normalized.color || options.fallbackColor || '#ffffff', options);
  material.metadata = {
    ...(material.metadata || {}),
    blueprintMaterial: normalized
  };

  if (normalized.kind === 'texture' && normalized.src) {
    const texture = new BABYLON.Texture(normalized.src, scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    texture.uScale = normalized.scale || 1;
    texture.vScale = normalized.scale || 1;
    material.diffuseTexture = texture;
    material.specularColor = options.specularColor || new BABYLON.Color3(0.08, 0.08, 0.08);
  }

  return material;
}

export function createMaterialPalette(scene, palette, namespace = 'blueprint') {
  const materials = {};

  Object.entries(palette).forEach(([key, value]) => {
    const config = typeof value === 'string' ? { color: value } : value;
    materials[key] = createBlueprintMaterial(scene, `${namespace}_${key}`, config, config);
  });

  return materials;
}
