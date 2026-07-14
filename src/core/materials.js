import { Color3, DynamicTexture, StandardMaterial, Texture } from './babylon.js';
import { DEFAULT_MATERIAL_PACKS } from './materialCatalog.js';

const TEXTURE_MAP = {
  // 木纹
  'light_fine_wood.jpg': new URL('../textures/light_fine_wood.jpg', import.meta.url).href,

  // 砖块 & 大理石
  'brick_marble_tiles.jpg': new URL('../textures/brick_marble_tiles.jpg', import.meta.url).href,
  'marbletiles.jpg': new URL('../textures/brick_marble_tiles.jpg', import.meta.url).href, // 兼容老版本
  'brick_light.jpg': new URL('../textures/brick_light.jpg', import.meta.url).href,
  'brick_marble_warm.jpg': new URL('../textures/brick_marble_warm.jpg', import.meta.url).href,
  'stone_marble_warm.jpg': new URL('../textures/brick_marble_warm.jpg', import.meta.url).href, // 兼容老版本
  'brick_marble_grey_gloss.jpg': new URL('../textures/brick_marble_grey_gloss.jpg', import.meta.url).href,
  'stone_marble_grey_gloss.jpg': new URL('../textures/brick_marble_grey_gloss.jpg', import.meta.url).href, // 兼容老版本
  'brick_black_white.jpg': new URL('../textures/brick_black_white.jpg', import.meta.url).href,
  'brick_small_black.png': new URL('../textures/brick_small_black.png', import.meta.url).href,
  'brick_mosaic.jpg': new URL('../textures/brick_mosaic.jpg', import.meta.url).href,
  'brick_red.jpg': new URL('../textures/brick_red.jpg', import.meta.url).href,
  'light_brick.jpg': new URL('../textures/brick_red.jpg', import.meta.url).href, // 兼容老版本
  'brick_cube.jpg': new URL('../textures/brick_cube.jpg', import.meta.url).href,
  'brick_diamond.jpg': new URL('../textures/brick_diamond.jpg', import.meta.url).href,
  'brick_square.jpg': new URL('../textures/brick_square.jpg', import.meta.url).href,
  'brick_stone.jpg': new URL('../textures/brick_stone.jpg', import.meta.url).href,

  // 沙石
  'stone_earth.jpg': new URL('../textures/stone_earth.jpg', import.meta.url).href,
  'stone_sand.jpg': new URL('../textures/stone_sand.jpg', import.meta.url).href,
  'stone_sand_stone.jpg': new URL('../textures/stone_sand_stone.jpg', import.meta.url).href,
  'stone_fine_sand.jpg': new URL('../textures/stone_fine_sand.jpg', import.meta.url).href,
  'stone.jpg': new URL('../textures/stone.jpg', import.meta.url).href,
  'stone_joint.jpg': new URL('../textures/stone_joint.jpg', import.meta.url).href,
  'stone_road.jpg': new URL('../textures/stone_road.jpg', import.meta.url).href,
  'stone_rock.jpg': new URL('../textures/stone_rock.jpg', import.meta.url).href,
  'stone_terrazzo.jpg': new URL('../textures/stone_terrazzo.jpg', import.meta.url).href,
  'stone_white_sand.jpg': new URL('../textures/stone_white_sand.jpg', import.meta.url).href,

  // 织物
  'fabric_rope_cable_beige.jpg': new URL('../textures/fabric_rope_cable_beige.jpg', import.meta.url).href,
  'fabric_knit_cable_grey.jpg': new URL('../textures/fabric_knit_cable_grey.jpg', import.meta.url).href,
  'fabric_knit_cable_white.jpg': new URL('../textures/fabric_knit_cable_white.jpg', import.meta.url).href,
  'fabric_knit_chevron_cream.jpg': new URL('../textures/fabric_knit_chevron_cream.jpg', import.meta.url).href,
  'fabric_weave_dark.jpg': new URL('../textures/fabric_weave_dark.jpg', import.meta.url).href,

  // 墙纸
  'wallmap_yellow.png': new URL('../textures/wallmap_yellow.png', import.meta.url).href,
  'wallpaper_leaf_bluegrey.jpg': new URL('../textures/wallpaper_leaf_bluegrey.jpg', import.meta.url).href,
  'wallpaper_paisley_orange.jpg': new URL('../textures/wallpaper_paisley_orange.jpg', import.meta.url).href,
  'wallpaper_fan_gold.jpg': new URL('../textures/wallpaper_fan_gold.jpg', import.meta.url).href,
  'wallpaper_stripe_teal_pink.jpg': new URL('../textures/wallpaper_stripe_teal_pink.jpg', import.meta.url).href,
  'wallpaper_damask_olive.jpg': new URL('../textures/wallpaper_damask_olive.jpg', import.meta.url).href,
  'wallpaper_ink_bamboo_mist.jpg': new URL('../textures/wallpaper_ink_bamboo_mist.jpg', import.meta.url).href,
  'wallpaper_cloud_navy_gold.jpg': new URL('../textures/wallpaper_cloud_navy_gold.jpg', import.meta.url).href,
  'wallpaper_ruyi_swirl_yellow.jpg': new URL('../textures/wallpaper_ruyi_swirl_yellow.jpg', import.meta.url).href,
  'wallpaper_floral_blue_white.jpg': new URL('../textures/wallpaper_floral_blue_white.jpg', import.meta.url).href,
  'wallpaper_seigaiha_blush.jpg': new URL('../textures/wallpaper_seigaiha_blush.jpg', import.meta.url).href
};

const BABYLON = { Color3, DynamicTexture, StandardMaterial, Texture };
const DEFAULT_PATTERN_MAX_ASPECT_RATIO = 1.8;

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

function shouldLimitPatternStretch(normalized, options = {}) {
  if (options.limitPatternStretch === false) return false;
  if (options.limitPatternStretch === true) return true;
  return normalized.kind === 'stained-glass' || normalized.category === 'wallpaper';
}

export function resolvePatternTextureScale(normalized, options = {}, baseScale = 1) {
  const scale = Number(baseScale || 1);
  let uScale = scale;
  let vScale = scale;

  if (!shouldLimitPatternStretch(normalized, options)) {
    return { uScale, vScale };
  }

  const surfaceWidth = Number(options.surfaceWidth || options.width || 0);
  const surfaceHeight = Number(options.surfaceHeight || options.height || 0);
  if (!(surfaceWidth > 0) || !(surfaceHeight > 0)) {
    return { uScale, vScale };
  }

  const minSide = Math.max(0.001, Math.min(surfaceWidth, surfaceHeight));
  const maxSide = Math.max(surfaceWidth, surfaceHeight);
  if (maxSide <= minSide) {
    return { uScale, vScale };
  }

  const maxAspectRatio = Number(
    options.maxPatternStretchRatio || normalized.maxPatternStretchRatio || DEFAULT_PATTERN_MAX_ASPECT_RATIO
  );
  if (!Number.isFinite(maxAspectRatio) || maxAspectRatio <= 1) {
    return { uScale, vScale };
  }

  const surfaceAspectRatio = maxSide / minSide;
  if (surfaceAspectRatio <= maxAspectRatio) {
    return { uScale, vScale };
  }

  const axisRepeatBoost = surfaceAspectRatio / maxAspectRatio;
  if (surfaceWidth >= surfaceHeight) {
    uScale *= axisRepeatBoost;
  } else {
    vScale *= axisRepeatBoost;
  }

  return { uScale, vScale };
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

  if (value.kind === 'stained-glass') {
    return {
      id: value.id,
      kind: 'stained-glass',
      category: value.category || 'glass',
      name: value.name || '教堂彩色玻璃',
      color: value.color || '#8e4cc9',
      alpha: value.alpha !== undefined ? value.alpha : 0.72,
      patternScale: Number(value.patternScale || 1.1),
      emissiveStrength: value.emissiveStrength !== undefined ? value.emissiveStrength : 0.18
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
    let src = value.src;
    if (src && typeof src === 'string') {
      // 1. 如果有材质 id，优先从默认内置包中获取已经通过 Vite 打包处理的 src
      if (value.id) {
        const defaultPack = DEFAULT_MATERIAL_PACKS.find(p => p.id === value.id);
        if (defaultPack && defaultPack.src) {
          src = defaultPack.src;
        }
      }

      // 2. 如果没能纠正，或者属于自定义没有 id 只有原始 src 的场景，提取文件名并从资产映射表 TEXTURE_MAP 中纠正
      if (typeof src === 'string') {
        const fileName = src.split('/').pop().split('?')[0];
        if (TEXTURE_MAP[fileName]) {
          src = TEXTURE_MAP[fileName];
        }
      }
    }

    return {
      id: value.id,
      kind: 'texture',
      category: value.category || 'custom',
      name: value.name || value.fileName || '自定义材质',
      fileName: value.fileName,
      src: src,
      scale: Number(value.scale || 1),
      color: value.color || fallbackColor,
      reflective: !!value.reflective,
      reflectionLevel: value.reflectionLevel !== undefined ? Number(value.reflectionLevel) : undefined,
      specularStrength: value.specularStrength !== undefined ? Number(value.specularStrength) : undefined,
      specularPower: value.specularPower !== undefined ? Number(value.specularPower) : undefined
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
    const texture = new BABYLON.Texture(
      normalized.src,
      scene,
      false,
      invertY,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        if (material.isDisposed) {
          texture.dispose();
          return;
        }
        material.diffuseColor = resolvedFloorColor;
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
    const textureScale = resolvePatternTextureScale(normalized, options, normalized.scale || 1);
    texture.uScale = textureScale.uScale;
    texture.vScale = textureScale.vScale;
    texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;

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
