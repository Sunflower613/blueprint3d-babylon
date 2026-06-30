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
  if (options.backFaceCulling !== undefined) {
    material.backFaceCulling = options.backFaceCulling;
    if (options.backFaceCulling === false) {
      material.twoSidedLighting = true;
    }
  }

  return material;
}

export function normalizeMaterialDescriptor(value, fallbackColor = '#ffffff') {
  if (!value) return { id: undefined, kind: 'color', color: fallbackColor };
  if (typeof value === 'string') return { id: undefined, kind: 'color', color: value };

  // 镜面材质
  if (value.kind === 'mirror') {
    return {
      id: value.id,
      kind: 'mirror',
      category: value.category || 'mirror',
      name: value.name || '镜面',
      color: value.color || fallbackColor
    };
  }

  // 金属材质
  if (value.kind === 'metal') {
    return {
      id: value.id,
      kind: 'metal',
      category: value.category || 'metal',
      name: value.name || '金属',
      color: value.color || fallbackColor,
      roughness: value.roughness !== undefined ? value.roughness : 0
    };
  }

  // 玻璃材质
  if (value.kind === 'glass') {
    return {
      id: value.id,
      kind: 'glass',
      category: value.category || 'glass',
      name: value.name || '玻璃',
      color: value.color || fallbackColor,
      alpha: value.alpha !== undefined ? value.alpha : 0.3
    };
  }

  // 发光材质
  if (value.kind === 'emissive') {
    return {
      id: value.id,
      kind: 'emissive',
      category: value.category || 'emissive',
      name: value.name || '发光',
      color: value.color || fallbackColor
    };
  }

  // 纹理材质
  if (value.kind === 'texture' || value.src) {
    return {
      id: value.id,
      kind: 'texture',
      category: value.category || 'custom',
      name: value.name || value.fileName || '自定义材质',
      fileName: value.fileName,
      src: value.src,
      scale: Number(value.scale || 1),
      color: value.color || fallbackColor
    };
  }

  // 默认：颜色材质
  return {
    id: value.id,
    kind: 'color',
    category: value.category || 'paint',
    name: value.name || '颜色',
    color: value.color || fallbackColor
  };
}

export function materialPreviewColor(value, fallbackColor = '#ffffff') {
  return normalizeMaterialDescriptor(value, fallbackColor).color || fallbackColor;
}

function createEnvironmentReflectionTexture(scene, name, level) {
  const source = scene.environmentTexture;
  if (!source || typeof source.clone !== 'function') return null;

  // Clones share the environment texture's GPU data while keeping per-material
  // intensity independent. This avoids allocating a 512px, six-face render
  // target (and six scene renders) for every reflective component.
  const reflection = source.clone();
  reflection.name = `${name}_environment_reflection`;
  reflection.level = level;
  return reflection;
}

export function createBlueprintMaterial(scene, name, descriptor, options = {}) {
  const normalized = normalizeMaterialDescriptor(descriptor, options.fallbackColor || '#ffffff');
  const baseColor = normalized.color || options.fallbackColor || '#ffffff';

  // --- 镜面材质 ---
  if (normalized.kind === 'mirror') {
    const material = new BABYLON.StandardMaterial(name, scene);
    const color = BABYLON.Color3.FromHexString(baseColor);
    // 适度的漫反射底色（调低底色以防发白）
    material.diffuseColor = color.scale(0.1);
    material.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    material.specularPower = 256;
    material.backFaceCulling = false; // 正反面都可见
    material.twoSidedLighting = true;
    material.flatShading = false;
    material.maxSimultaneousLights = 16;

    // Use the shared, prefiltered environment map. A per-material ReflectionProbe
    // is prohibitively expensive and leaks easily when editor items are rebuilt.
    material.reflectionTexture = createEnvironmentReflectionTexture(scene, name, 0.8);

    // 缩放反射采样的图案，使其在视觉上变小
    if (material.reflectionTexture) {
      material.reflectionTexture.uScale = 4.0;
      material.reflectionTexture.vScale = 4.0;
    }

    // 降低 emissive 补偿，防止强光下过亮
    material.emissiveColor = color.scale(0.08);

    material.metadata = { ...(material.metadata || {}), blueprintMaterial: normalized };
    return material;
  }

  // --- 金属材质 ---
  if (normalized.kind === 'metal') {
    const material = new BABYLON.StandardMaterial(name, scene);
    const color = BABYLON.Color3.FromHexString(baseColor);
    const isMatte = (normalized.roughness && normalized.roughness > 0.1) || normalized.name.includes('磨砂') || (normalized.id && normalized.id.includes('matte'));

    material.backFaceCulling = false;
    material.twoSidedLighting = true;
    material.flatShading = false;
    material.maxSimultaneousLights = 16;

    const reflectionLevel = isMatte ? 0.15 : 0.55;
    material.reflectionTexture = createEnvironmentReflectionTexture(scene, name, reflectionLevel);

    // 缩放反射采样的图案，使其在视觉上变小
    if (material.reflectionTexture) {
      material.reflectionTexture.uScale = 2.0;
      material.reflectionTexture.vScale = 2.0;
    }

    if (isMatte) {
      // 磨砂金属：漫反射多，高光散且暗，环境反射微弱
      material.diffuseColor = color.scale(0.5);
      material.specularColor = color.scale(0.4);
      material.specularPower = 12; // 低 specularPower 使高光发散
      material.emissiveColor = color.scale(0.1);
    } else {
      // 亮面金属：漫反射少，高光亮且硬，环境反射明显
      material.diffuseColor = color.scale(0.3);
      material.specularColor = color.scale(0.7);
      material.specularPower = 64; // 高 specularPower 使高光尖锐
      material.emissiveColor = color.scale(0.15);
    }

    material.metadata = { ...(material.metadata || {}), blueprintMaterial: normalized };
    return material;
  }

  // --- 玻璃材质 ---
  if (normalized.kind === 'glass') {
    const material = new BABYLON.StandardMaterial(name, scene);
    const color = BABYLON.Color3.FromHexString(baseColor);
    material.diffuseColor = color;
    material.alpha = normalized.alpha !== undefined ? normalized.alpha : 0.3;
    material.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    material.specularPower = 64;
    material.backFaceCulling = false;
    material.twoSidedLighting = true;
    material.flatShading = false;
    material.maxSimultaneousLights = 16;
    // 不使用 opacityFresnelParameters —— 它会覆盖 alpha 导致正面看几乎完全不透明
    material.metadata = { ...(material.metadata || {}), blueprintMaterial: normalized };
    return material;
  }

  // --- 发光材质 ---
  if (normalized.kind === 'emissive') {
    const material = new BABYLON.StandardMaterial(name, scene);
    const color = BABYLON.Color3.FromHexString(baseColor);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.emissiveColor = color;
    material.disableLighting = true;
    material.backFaceCulling = false;
    material.metadata = { ...(material.metadata || {}), blueprintMaterial: normalized };
    return material;
  }

  // --- 颜色/纹理材质（原有逻辑） ---
  let finalBaseColor = baseColor;
  if (options.isFloor && normalized.kind === 'texture') {
    // 地板材质在图片加载出来之前，底色强制使用淡棕色
    finalBaseColor = '#d2b48c';
  }

  const material = createFlatMaterial(scene, name, finalBaseColor, options);
  material.metadata = {
    ...(material.metadata || {}),
    blueprintMaterial: normalized
  };

  if (normalized.kind === 'texture' && normalized.src) {
    const texture = new BABYLON.Texture(
      normalized.src,
      scene,
      false,
      true,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        if (material.isDisposed) {
          texture.dispose();
          return;
        }
        material.diffuseTexture = texture;
      },
      (message, exception) => {
        console.warn(`Failed to load texture for ${name}: ${normalized.src}`, message, exception);
        if (material.isDisposed) {
          texture.dispose();
          return;
        }
        material.diffuseTexture = null;
        if (options.isFloor) {
          material.diffuseColor = BABYLON.Color3.FromHexString('#d2b48c');
        }
      }
    );
    texture.uScale = normalized.scale || 1;
    texture.vScale = normalized.scale || 1;

    if (options.isFloor) {
      // 地板材质在开始加载时，先不赋给 diffuseTexture，避免加载完成前的白色或红色格子闪烁，直接渲染底色淡棕色
      // 等 onLoad 触发成功后再赋值
    } else {
      material.diffuseTexture = texture;
    }

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
