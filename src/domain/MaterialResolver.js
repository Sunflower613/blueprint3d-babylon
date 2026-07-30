const DEFAULT_PATTERN_MAX_ASPECT_RATIO = 1.8;

const WALL_SURFACE_FIELD_MAP = {
  front: {
    main: { materialField: 'materialFront', colorField: 'colorFront' },
    baseboard: { materialField: 'baseboardMaterialFront', colorField: 'baseboardColorFront' },
    wainscot: { materialField: 'wainscotMaterialFront', colorField: 'wainscotColorFront' }
  },
  back: {
    main: { materialField: 'materialBack', colorField: 'colorBack' },
    baseboard: { materialField: 'baseboardMaterialBack', colorField: 'baseboardColorBack' },
    wainscot: { materialField: 'wainscotMaterialBack', colorField: 'wainscotColorBack' }
  }
};

const DEFAULT_WALL_COLOR = '#f9fbff';
const DEFAULT_FLOOR_COLOR = '#d2b48c';
const DEFAULT_FLOOR_ID = 'floor_1';
const DEFAULT_WALL_BASEBOARD_HEIGHT = 0.1;
const DEFAULT_WALL_WAINSCOT_HEIGHT = 1.0;

export function isSingleTileTexture(descriptor) {
  if (!descriptor || typeof descriptor !== 'object') return false;
  if (descriptor.stretch === true || descriptor.fit === true) return true;
  const id = descriptor.id || '';
  const src = descriptor.src || descriptor.url || descriptor.fileName || '';
  const targetIds = ['fabric-triangle', 'fabric-circle', 'fabric-flower', 'fabric-square'];
  const targetFiles = ['fabric_triangle', 'fabric_circle', 'fabric_flower', 'fabric_square'];

  return targetIds.includes(id) || targetFiles.some((file) => String(src).includes(file));
}

export class MaterialResolver {
  static get WALL_SURFACE_FIELD_MAP() {
    return WALL_SURFACE_FIELD_MAP;
  }

  static get DEFAULT_WALL_COLOR() {
    return DEFAULT_WALL_COLOR;
  }

  static get DEFAULT_FLOOR_COLOR() {
    return DEFAULT_FLOOR_COLOR;
  }

  static get DEFAULT_FLOOR_ID() {
    return DEFAULT_FLOOR_ID;
  }

  static get DEFAULT_WALL_BASEBOARD_HEIGHT() {
    return DEFAULT_WALL_BASEBOARD_HEIGHT;
  }

  static get DEFAULT_WALL_WAINSCOT_HEIGHT() {
    return DEFAULT_WALL_WAINSCOT_HEIGHT;
  }

  static getRepresentativeColor(descriptor, fallbackColor = '#ffffff') {
    if (!descriptor) return fallbackColor;
    let colorVal = typeof descriptor === 'string' ? descriptor : descriptor.color;
    if (!colorVal || colorVal === '#ffffff') {
      const id = descriptor.id || '';
      const category = descriptor.category || '';
      const name = descriptor.name || '';
      
      const idMap = {
        'stone-grass': '#4e7c2c',
        'stone-earth': '#8b5a2b',
        'stone-sand': '#d2b48c',
        'stone-sand-stone': '#bcaaa4',
        'stone-fine-sand': '#e5c185',
        'stone-natural': '#795548',
        'stone-joint': '#90a4ae',
        'stone-road': '#78909c',
        'stone-rock': '#546e7a',
        'stone-terrazzo': '#b0bec5',
        'stone-white-sand': '#cfd8dc',
        
        'brick-marble-warm': '#efebe9',
        'brick-grey-gloss-marble': '#cfd8dc',
        'brick-marble-tiles': '#eceff1',
        'brick-light': '#cfd8dc',
        'brick-red': '#b71c1c',
        'brick-cube': '#efebe9',
        'brick-diamond': '#cfd8dc',
        'brick-square': '#b0bec5',
        'brick-stone': '#78909c',
        'brick-mosaic': '#b0bec5',
        'brick-black-white': '#37474f',
        'brick-small-black': '#263238',

        'fabric-rope-cable-beige': '#f5f5dc',
        'fabric-knit-cable-grey': '#e0e0e0',
        'fabric-knit-cable-white': '#fafafa',
        'fabric-knit-chevron-cream': '#fdf5e6',
        'fabric-weave-dark': '#424242'
      };

      if (id && idMap[id]) return idMap[id];
      
      if (id.includes('grass') || name.includes('草')) return '#4e7c2c';
      if (id.includes('earth') || id.includes('mud') || name.includes('泥土') || name.includes('土')) return '#8b5a2b';
      if (id.includes('sand') || name.includes('砂') || name.includes('沙')) return '#e5c185';
      if (id.includes('wood') || name.includes('木')) return '#dcc09a';
      if (id.includes('brick') || name.includes('砖')) return '#b71c1c';
      if (id.includes('stone') || name.includes('石')) return '#78909c';
      if (category === 'fabric' || name.includes('布') || name.includes('织')) return '#e0e0e0';
      if (category === 'wallpaper' || name.includes('墙纸') || name.includes('纸')) return '#dfd2bc';
    }
    return colorVal || fallbackColor;
  }

  static normalizeMaterialDescriptor(value, fallbackColor = '#ffffff') {
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
        color: value.color || fallbackColor,
        src: value.src || value.url,
        scale: value.scale !== undefined ? Number(value.scale) : undefined,
        alpha: value.alpha !== undefined ? Number(value.alpha) : undefined,
        skyLightColor: value.skyLightColor || undefined,
        stretch: value.stretch !== undefined ? !!value.stretch : undefined,
        invertY: value.invertY !== undefined ? !!value.invertY : undefined,
        repeatX: value.repeatX !== undefined ? !!value.repeatX : undefined,
        stretchY: value.stretchY !== undefined ? !!value.stretchY : undefined,
        spriteColumns: value.spriteColumns !== undefined ? Math.max(1, Number(value.spriteColumns)) : undefined,
        spriteRows: value.spriteRows !== undefined ? Math.max(1, Number(value.spriteRows)) : undefined,
        frameDuration: value.frameDuration !== undefined ? Math.max(16, Number(value.frameDuration)) : undefined,
        uvMode: value.uvMode || undefined
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
        src: value.src || value.url,
        derivedFrom: value.derivedFrom,
        scale: Number(value.scale || 1),
        color: value.color || fallbackColor,
        alpha: value.alpha !== undefined ? Number(value.alpha) : undefined,
        physicalTileSize: value.physicalTileSize !== undefined ? Number(value.physicalTileSize) : undefined,
        stretch: value.stretch !== undefined ? !!value.stretch : undefined,
        reflective: !!value.reflective,
        reflectionLevel: value.reflectionLevel !== undefined ? Number(value.reflectionLevel) : undefined,
        specularStrength: value.specularStrength !== undefined ? Number(value.specularStrength) : undefined,
        specularPower: value.specularPower !== undefined ? Number(value.specularPower) : undefined
      };
    }

    // 默认：颜色材质
    const colorStr = (typeof value === 'string' ? value : value?.color) || fallbackColor;
    return {
      id: value?.id,
      kind: 'color',
      category: value?.category || 'custom',
      name: value?.name || '纯色材质',
      color: typeof colorStr === 'string' ? colorStr : fallbackColor,
      alpha: value?.alpha !== undefined ? Number(value.alpha) : undefined
    };
  }

  static materialPreviewColor(value, fallbackColor = '#ffffff') {
    return MaterialResolver.normalizeMaterialDescriptor(value, fallbackColor).color || fallbackColor;
  }

  static shouldLimitPatternStretch(normalized, options = {}) {
    if (options.limitPatternStretch === false) return false;
    if (options.limitPatternStretch === true) return true;
    return normalized.kind === 'stained-glass' ||
      normalized.category === 'wallpaper' ||
      normalized.id === 'brick-diamond' ||
      normalized.id === 'brick-small-black';
  }

  static resolvePatternTextureScale(normalized, options = {}, baseScale = 1) {
    if (isSingleTileTexture(normalized)) {
      return { uScale: 1, vScale: 1 };
    }

    const scale = Number(baseScale || 1);
    let uScale = scale;
    let vScale = scale;

    if (!MaterialResolver.shouldLimitPatternStretch(normalized, options)) {
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

  static getWallSurfaceFields(side, component = 'main') {
    return WALL_SURFACE_FIELD_MAP[side]?.[component] || WALL_SURFACE_FIELD_MAP[side]?.main || WALL_SURFACE_FIELD_MAP.front.main;
  }

  static resolveWallSurfaceDescriptor(wall, side, component = 'main') {
    const { materialField, colorField } = MaterialResolver.getWallSurfaceFields(side, component);
    const sideMaterial = side === 'front' ? wall.materialFront : wall.materialBack;
    const sideColor = side === 'front' ? wall.colorFront : wall.colorBack;
    const descriptor = wall[materialField] ?? sideMaterial ?? wall.material ?? sideColor ?? wall.color ?? DEFAULT_WALL_COLOR;
    const color = wall[colorField] ?? sideColor ?? wall.color ?? DEFAULT_WALL_COLOR;
    return { descriptor, color };
  }

  static getWallSurfaceValue(wall, side, component = 'main') {
    const { materialField, colorField } = MaterialResolver.getWallSurfaceFields(side, component);
    const sideMaterial = side === 'front' ? wall.materialFront : wall.materialBack;
    const sideColor = side === 'front' ? wall.colorFront : wall.colorBack;
    return {
      material: wall[materialField] ?? sideMaterial ?? wall.material ?? null,
      color: wall[colorField] ?? sideColor ?? wall.color ?? DEFAULT_WALL_COLOR
    };
  }

  static buildWallSurfacePatch(side, component, material, color) {
    const { materialField, colorField } = MaterialResolver.getWallSurfaceFields(side, component);
    return {
      [materialField]: material,
      [colorField]: color
    };
  }

  static normalizeWallDecorSettings(wall) {
    wall.floorId ||= DEFAULT_FLOOR_ID;
    wall.color ||= DEFAULT_WALL_COLOR;
    wall.material ||= wall.color;
    wall.color = MaterialResolver.materialPreviewColor(wall.material, wall.color || DEFAULT_WALL_COLOR);
    wall.baseboardEnabled = !!wall.baseboardEnabled;
    wall.baseboardHeight = Math.max(0, Number(wall.baseboardHeight ?? DEFAULT_WALL_BASEBOARD_HEIGHT));
    wall.wainscotEnabled = !!wall.wainscotEnabled;
    wall.wainscotHeight = Math.max(0, Number(wall.wainscotHeight ?? DEFAULT_WALL_WAINSCOT_HEIGHT));

    Object.values(WALL_SURFACE_FIELD_MAP).forEach((sideMap) => {
      Object.values(sideMap).forEach(({ materialField, colorField }) => {
        if (wall[materialField] !== undefined && wall[materialField] !== null) {
          wall[colorField] = MaterialResolver.materialPreviewColor(wall[materialField], wall[colorField] || wall.color || DEFAULT_WALL_COLOR);
        } else if (wall[colorField] !== undefined && wall[colorField] !== null) {
          wall[materialField] = wall[colorField];
          wall[colorField] = MaterialResolver.materialPreviewColor(wall[materialField], wall[colorField] || wall.color || DEFAULT_WALL_COLOR);
        }
      });
    });
    return wall;
  }
}
