import { Color3, DynamicTexture, StandardMaterial, Texture } from './babylon.js';
import { DEFAULT_MATERIAL_PACKS } from './materialCatalog.js';
import { MaterialResolver } from '../domain/MaterialResolver.js';
import { resolveMaterialAssetDescriptor } from './materialAssets.js';

const BABYLON = { Color3, DynamicTexture, StandardMaterial, Texture };

const STAINED_GLASS_WARM_COLORS = [
  '#f27462', '#e88972', '#ef5b5b', '#f28a48', '#e36f35', '#ef9f58',
  '#e34b76', '#cf4b91', '#b95492', '#f2c95c', '#f5dc78', '#eee6b3', '#c9a58c'
];
const STAINED_GLASS_ACCENT_COLORS = ['#4238de', '#6251e6', '#7557c9', '#8c4db8', '#4e63bd'];

function clipPolygonToHalfPlane(polygon, nx, ny, limit) {
  const clipped = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentDistance = current.x * nx + current.y * ny - limit;
    const nextDistance = next.x * nx + next.y * ny - limit;
    const currentInside = currentDistance <= 0;
    const nextInside = nextDistance <= 0;

    if (currentInside) clipped.push(current);
    if (currentInside !== nextInside) {
      const ratio = currentDistance / (currentDistance - nextDistance);
      clipped.push({
        x: current.x + (next.x - current.x) * ratio,
        y: current.y + (next.y - current.y) * ratio
      });
    }
  }
  return clipped;
}

function createStainedGlassCells() {
  let randomState = 0x51a1ed;
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  const omitted = new Set(['1:1', '3:0', '0:3', '4:4']);
  const seeds = [];

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      if (omitted.has(`${column}:${row}`)) continue;
      seeds.push({
        id: seeds.length,
        x: (column + 0.18 + random() * 0.64) / 5,
        y: (row + 0.18 + random() * 0.64) / 5
      });
    }
  }

  // A few close seed pairs create the small fragments seen between the larger panes.
  [[0.17, 0.34], [0.33, 0.12], [0.46, 0.61], [0.68, 0.31], [0.78, 0.76], [0.93, 0.49]].forEach(([x, y]) => {
    seeds.push({ id: seeds.length, x, y });
  });

  const candidates = [];
  seeds.forEach((seed) => {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        candidates.push({ ...seed, x: seed.x + offsetX, y: seed.y + offsetY });
      }
    }
  });

  return candidates.flatMap((seed) => {
    let polygon = [{ x: -1, y: -1 }, { x: 2, y: -1 }, { x: 2, y: 2 }, { x: -1, y: 2 }];
    for (const neighbor of candidates) {
      if (neighbor === seed) continue;
      const nx = neighbor.x - seed.x;
      const ny = neighbor.y - seed.y;
      const limit = (neighbor.x ** 2 + neighbor.y ** 2 - seed.x ** 2 - seed.y ** 2) / 2;
      polygon = clipPolygonToHalfPlane(polygon, nx, ny, limit);
      if (polygon.length === 0) break;
    }

    if (polygon.length < 3) return [];
    const bounds = polygon.reduce((result, point) => ({
      minX: Math.min(result.minX, point.x),
      maxX: Math.max(result.maxX, point.x),
      minY: Math.min(result.minY, point.y),
      maxY: Math.max(result.maxY, point.y)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    if (bounds.maxX < 0 || bounds.minX > 1 || bounds.maxY < 0 || bounds.minY > 1) return [];
    return [{ id: seed.id, polygon, bounds }];
  });
}

const STAINED_GLASS_CELLS = createStainedGlassCells();

function drawStainedGlassPattern(context, size) {
  context.fillStyle = '#2a2024';
  context.fillRect(0, 0, size, size);
  context.lineJoin = 'round';

  STAINED_GLASS_CELLS.forEach(({ id, polygon, bounds }) => {
    const palette = id % 5 === 1 ? STAINED_GLASS_ACCENT_COLORS : STAINED_GLASS_WARM_COLORS;
    const color = palette[(id * 7 + 3) % palette.length];
    const gradient = context.createLinearGradient(
      bounds.minX * size, bounds.minY * size,
      bounds.maxX * size, bounds.maxY * size
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.78, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0.72)');

    context.beginPath();
    polygon.forEach((point, index) => {
      const x = point.x * size;
      const y = point.y * size;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    context.lineWidth = Math.max(2.5, size * 0.012);
    context.strokeStyle = '#2b2023';
    context.stroke();
  });
}

function createStainedGlassTexture(scene, name, patternScale) {
  const texture = new BABYLON.DynamicTexture(`${name}_pattern`, { width: 256, height: 256 }, scene, true);
  drawStainedGlassPattern(texture.getContext(), 256);
  texture.update(false);
  texture.uScale = patternScale;
  texture.vScale = patternScale;
  texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  return texture;
}

export function resolvePatternTextureScale(normalized, options = {}, baseScale = 1) {
  return MaterialResolver.resolvePatternTextureScale(normalized, options, baseScale);
}

export function createFlatMaterial(scene, name, colorHex, options = {}) {
  const material = new BABYLON.StandardMaterial(name, scene);
  const color = BABYLON.Color3.FromHexString(colorHex || '#ffffff');

  if (options.isFloor) {
    // 限制地板最大漫反射强度，防止大面积白底/浅色地板在强直射光下过曝，保留明暗细节
    material.diffuseColor = color.scale(0.85);
  } else {
    material.diffuseColor = color;
  }
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
  return MaterialResolver.normalizeMaterialDescriptor(value, fallbackColor);
}

export function materialPreviewColor(value, fallbackColor = '#ffffff') {
  return MaterialResolver.materialPreviewColor(value, fallbackColor);
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
  let normalized = normalizeMaterialDescriptor(descriptor, options.fallbackColor || '#ffffff');
  normalized = resolveMaterialAssetDescriptor(normalized);
  const baseColor = normalized.color || options.fallbackColor || '#ffffff';
  const resolvedColor = BABYLON.Color3.FromHexString(baseColor);
  const resolvedFloorColor = options.isFloor ? resolvedColor.scale(0.85) : resolvedColor;

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
    material.reflectionTexture = createEnvironmentReflectionTexture(scene, name, 0.5);

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

  // --- 教堂彩色玻璃：程序化菱形/六边形铅条分格 ---
  if (normalized.kind === 'stained-glass') {
    const material = new BABYLON.StandardMaterial(name, scene);
    const pattern = createStainedGlassTexture(scene, name, normalized.patternScale);
    const patternScale = resolvePatternTextureScale(normalized, options, normalized.patternScale);
    pattern.uScale = patternScale.uScale;
    pattern.vScale = patternScale.vScale;
    material.diffuseColor = BABYLON.Color3.White();
    material.diffuseTexture = pattern;
    material.emissiveTexture = pattern;
    material.emissiveColor = BABYLON.Color3.White().scale(normalized.emissiveStrength);
    material.alpha = normalized.alpha;
    material.specularColor = new BABYLON.Color3(0.75, 0.75, 0.8);
    material.specularPower = 96;
    material.backFaceCulling = false;
    material.twoSidedLighting = true;
    material.flatShading = false;
    material.maxSimultaneousLights = 16;
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
    if (normalized.alpha !== undefined) {
      material.alpha = Math.max(0, Math.min(1, normalized.alpha));
      material.backFaceCulling = false;
      material.twoSidedLighting = true;
    }

    if (normalized.reflective) {
      const reflectionLevel = normalized.reflectionLevel !== undefined ? normalized.reflectionLevel : 0.55;
      const specularStrength = normalized.specularStrength !== undefined ? normalized.specularStrength : 0.72;
      material.reflectionTexture = createEnvironmentReflectionTexture(scene, name, reflectionLevel);
      if (material.reflectionTexture) {
        material.reflectionTexture.uScale = 2.0;
        material.reflectionTexture.vScale = 2.0;
      }
      material.specularColor = new BABYLON.Color3(specularStrength, specularStrength, specularStrength);
      material.specularPower = normalized.specularPower !== undefined ? normalized.specularPower : 96;
      material.flatShading = false;
      material.backFaceCulling = false;
      material.twoSidedLighting = true;
    }

    const invertY = normalized.invertY !== undefined ? normalized.invertY : (options.invertY !== undefined ? options.invertY : true);
    const textureKey = `${normalized.src}_invY_${invertY}`;
    let baseTexture = scene._blueprintTextureCache?.get(textureKey);

    if (!baseTexture || baseTexture.isDisposed) {
      if (!scene._blueprintTextureCache) scene._blueprintTextureCache = new Map();
      baseTexture = new BABYLON.Texture(
        normalized.src,
        scene,
        false,
        invertY,
        BABYLON.Texture.TRILINEAR_SAMPLINGMODE
      );
      scene._blueprintTextureCache.set(textureKey, baseTexture);
    }

    const texture = baseTexture.clone();
    const textureScale = resolvePatternTextureScale(normalized, options, normalized.scale || 1);
    texture.uScale = textureScale.uScale;
    texture.vScale = textureScale.vScale;
    texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;

    const applyTextureToMaterial = () => {
      if (!material.isDisposed) {
        material.diffuseColor = resolvedFloorColor;
        material.diffuseTexture = texture;
      }
    };

    if (baseTexture.isReady()) {
      applyTextureToMaterial();
    } else {
      baseTexture.onLoadObservable.addOnce(() => {
        applyTextureToMaterial();
      });
    }

    if (options.isFloor) {
      // 地板材质在开始加载时，先不赋给 diffuseTexture，避免加载完成前的白色或红色格子闪烁，直接渲染底色淡棕色
      // 等 onLoad 触发成功后再赋值
    } else {
      material.diffuseTexture = texture;
    }

    if (!normalized.reflective) {
      material.specularColor = options.specularColor || new BABYLON.Color3(0.08, 0.08, 0.08);
    }
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
