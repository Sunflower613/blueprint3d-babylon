const lightFineWoodUrl = new URL('../textures/light_fine_wood.jpg', import.meta.url).href;
const marbletilesUrl = new URL('../textures/marbletiles.jpg', import.meta.url).href;
const lightBrickUrl = new URL('../textures/light_brick.jpg', import.meta.url).href;
const wallmapYellowUrl = new URL('../textures/wallmap_yellow.png', import.meta.url).href;
const stoneMarbleWarmUrl = new URL('../textures/stone_marble_warm.jpg', import.meta.url).href;
const stoneMarbleGreyGlossUrl = new URL('../textures/stone_marble_grey_gloss.jpg', import.meta.url).href;
const fabricRopeCableBeigeUrl = new URL('../textures/fabric_rope_cable_beige.jpg', import.meta.url).href;
const fabricKnitCableGreyUrl = new URL('../textures/fabric_knit_cable_grey.jpg', import.meta.url).href;
const fabricKnitCableWhiteUrl = new URL('../textures/fabric_knit_cable_white.jpg', import.meta.url).href;
const fabricKnitChevronCreamUrl = new URL('../textures/fabric_knit_chevron_cream.jpg', import.meta.url).href;
const fabricWeaveDarkUrl = new URL('../textures/fabric_weave_dark.jpg', import.meta.url).href;
const wallpaperLeafBluegreyUrl = new URL('../textures/wallpaper_leaf_bluegrey.jpg', import.meta.url).href;
const wallpaperPaisleyOrangeUrl = new URL('../textures/wallpaper_paisley_orange.jpg', import.meta.url).href;
const wallpaperFanGoldUrl = new URL('../textures/wallpaper_fan_gold.jpg', import.meta.url).href;
const wallpaperStripeTealPinkUrl = new URL('../textures/wallpaper_stripe_teal_pink.jpg', import.meta.url).href;
const wallpaperDamaskOliveUrl = new URL('../textures/wallpaper_damask_olive.jpg', import.meta.url).href;
const wallpaperInkBambooMistUrl = new URL('../textures/wallpaper_ink_bamboo_mist.jpg', import.meta.url).href;
const wallpaperCloudNavyGoldUrl = new URL('../textures/wallpaper_cloud_navy_gold.jpg', import.meta.url).href;
const wallpaperRuyiSwirlYellowUrl = new URL('../textures/wallpaper_ruyi_swirl_yellow.jpg', import.meta.url).href;
const wallpaperFloralBlueWhiteUrl = new URL('../textures/wallpaper_floral_blue_white.jpg', import.meta.url).href;
const wallpaperSeigaihaBlushUrl = new URL('../textures/wallpaper_seigaiha_blush.jpg', import.meta.url).href;

export const MATERIAL_CATEGORIES = [
  { id: 'custom', label: '自定义', icon: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' },
  { id: 'wood', label: '木纹', icon: '<path d="m10 10-1.5-1.5"/><path d="M16 14a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1Z"/><path d="M12 14v3"/><path d="M12 2v2"/><path d="m18 8-2 2"/><path d="M2 18h20"/><path d="M19 14v4"/>' },
  { id: 'stone', label: '石理', icon: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 9v6"/><path d="M16 15v6"/><path d="M16 3v6"/><path d="M3 15h18"/><path d="M3 9h18"/><path d="M8 15v6"/><path d="M8 3v6"/>' },
  { id: 'metal', label: '金属', icon: '<path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z"/>' },
  { id: 'mirror', label: '镜面', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 7 10 10"/><path d="M7 12h4"/><path d="M12 7v4"/>' },
  { id: 'glass', label: '玻璃', icon: '<path d="M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22Z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/>' },
  { id: 'wallpaper', label: '墙纸', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 3v5h5"/>' },
  { id: 'fabric', label: '织物', icon: '<path d="M20.38 3.46 16 7.5V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3.5L3.62 3.46c-.9-.85-2.38-.22-2.38 1v14c0 1.1.9 2 2 2h17.5c1.1 0 2-.9 2-2v-14c0-1.22-1.48-1.85-2.38-1Z"/>' },
  { id: 'paint', label: '涂料', icon: '<path d="M12 22c5.523 0 10-2.239 10-5 0-2.761-4.477-5-10-5S2 14.239 2 17c0 2.761 4.477 5 10 5Z"/><path d="M12 12V2"/><path d="M8 2h8"/>' },
  { id: 'emissive', label: '发光', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' }
];

const COMMON_WOOD_MATERIALS = [
  { id: 'wood-light-fine', name: '\u7cbe\u7ec6\u6d45\u6728', color: '#e5c4a3' },
  { id: 'wood-light-oak', name: '\u6d45\u6a61\u6728', color: '#dcc09a' },
  { id: 'wood-ash', name: '\u767d\u8721\u6728', color: '#d6c3a5' },
  { id: 'wood-maple', name: '\u67ab\u6728', color: '#d8ad84' },
  { id: 'wood-pine', name: '\u677e\u6728', color: '#d2b07a' },
  { id: 'wood-teak', name: '\u67da\u6728', color: '#b98658' },
  { id: 'wood-cherry', name: '\u6a31\u6843\u6728', color: '#b86f52' },
  { id: 'wood-walnut', name: '\u80e1\u6843\u6728', color: '#8a5c3b' }
].map((material) => ({
  ...material,
  category: 'wood',
  kind: 'texture',
  src: lightFineWoodUrl,
  scale: 3
}));

const COMMON_FABRIC_MATERIALS = [
  { id: 'fabric-rope-cable-beige', name: '绳纹针织', src: fabricRopeCableBeigeUrl, scale: 2.2, color: '#d9aa73' },
  { id: 'fabric-knit-cable-grey', name: '交织麻花针织', src: fabricKnitCableGreyUrl, scale: 2.2, color: '#6d7184' },
  { id: 'fabric-knit-cable-white', name: '竖纹麻花针织', src: fabricKnitCableWhiteUrl, scale: 2.2, color: '#f1ede4' },
  { id: 'fabric-knit-chevron-cream', name: '人字针织', src: fabricKnitChevronCreamUrl, scale: 2.2, color: '#efe4cf' },
  { id: 'fabric-weave-dark', name: '编织面料', src: fabricWeaveDarkUrl, scale: 2.4, color: '#3b3d42' }
].map((material) => ({
  ...material,
  category: 'fabric',
  kind: 'texture'
}));

const COMMON_WALLPAPER_MATERIALS = [
  { id: 'wallpaper-leaf-bluegrey', name: '叶影墙纸', src: wallpaperLeafBluegreyUrl, scale: 1, color: '#9aa0b1' },
  { id: 'wallpaper-paisley-orange', name: '佩斯利墙纸', src: wallpaperPaisleyOrangeUrl, scale: 1, color: '#f1c598' },
  { id: 'wallpaper-fan-gold', name: '扇纹几何墙纸', src: wallpaperFanGoldUrl, scale: 1, color: '#c6a47d' },
  { id: 'wallpaper-stripe-teal-pink', name: '条纹墙纸', src: wallpaperStripeTealPinkUrl, scale: 1, color: '#7ca8a7' },
  { id: 'wallpaper-damask-olive', name: '达玛斯墙纸', src: wallpaperDamaskOliveUrl, scale: 1, color: '#b8af71' },
  { id: 'wallpaper-ink-bamboo-mist', name: '水墨竹韵墙纸', src: wallpaperInkBambooMistUrl, scale: 1, color: '#d8dde1' },
  { id: 'wallpaper-cloud-navy-gold', name: '祥云墙纸', src: wallpaperCloudNavyGoldUrl, scale: 1, color: '#d7be8a' },
  { id: 'wallpaper-ruyi-swirl-yellow', name: '回纹墙纸', src: wallpaperRuyiSwirlYellowUrl, scale: 1, color: '#f0dc75' },
  { id: 'wallpaper-floral-blue-white', name: '青花团纹墙纸', src: wallpaperFloralBlueWhiteUrl, scale: 1, color: '#62789a' },
  { id: 'wallpaper-seigaiha-blush', name: '青海波墙纸', src: wallpaperSeigaihaBlushUrl, scale: 1, color: '#ecd5d8' }
].map((material) => ({
  ...material,
  category: 'wallpaper',
  kind: 'texture'
}));

const COMMON_STONE_MATERIALS = [
  { id: 'stone-light', name: '暖白大理石', src: stoneMarbleWarmUrl, scale: 2.2, color: '#f1ece5' },
  { id: 'stone-ivory-marble', name: '象牙纹大理石', src: stoneMarbleWarmUrl, scale: 2.2, color: '#e9dfd3' },
  { id: 'stone-mist-marble', name: '淡金纹大理石', src: stoneMarbleWarmUrl, scale: 2.2, color: '#e3d6ca' },
  { id: 'stone-sand-marble', name: '暖粉纹大理石', src: stoneMarbleWarmUrl, scale: 2.2, color: '#d9c8bb' },

  { id: 'stone-marbletiles', name: '经典大理石瓷砖', src: marbletilesUrl, scale: 3, color: '#e2dfd9' },
  { id: 'stone-marble-ivory', name: '象牙大理石瓷砖', src: marbletilesUrl, scale: 3, color: '#ebe5dc' },
  { id: 'stone-marble-ash', name: '灰米大理石瓷砖', src: marbletilesUrl, scale: 3, color: '#d4cdc4' },
  { id: 'stone-marble-sand', name: '砂金大理石瓷砖', src: marbletilesUrl, scale: 3, color: '#d8c7b0' },

  { id: 'stone-light-brick', name: '浅色红砖', src: lightBrickUrl, scale: 1, color: '#e9d7c3' },
  { id: 'stone-cream-brick', name: '奶油砖', src: lightBrickUrl, scale: 1, color: '#f1dfcc' },
  { id: 'stone-rustic-brick', name: '暖陶砖', src: lightBrickUrl, scale: 1, color: '#d4b198' },
  { id: 'stone-clay-brick', name: '浅棕砖', src: lightBrickUrl, scale: 1, color: '#c49c7d' },

  { id: 'stone-grey-gloss', name: '银灰亮面大理石', src: stoneMarbleGreyGlossUrl, scale: 2.4, color: '#d7dbe0', reflective: true, reflectionLevel: 0.55, specularStrength: 0.72, specularPower: 96 },
  { id: 'stone-cloud-gloss', name: '云灰亮面大理石', src: stoneMarbleGreyGlossUrl, scale: 2.4, color: '#cdd2d8', reflective: true, reflectionLevel: 0.55, specularStrength: 0.72, specularPower: 96 },
  { id: 'stone-mist-gloss', name: '冷雾亮面大理石', src: stoneMarbleGreyGlossUrl, scale: 2.4, color: '#bcc2c9', reflective: true, reflectionLevel: 0.55, specularStrength: 0.72, specularPower: 96 },
  { id: 'stone-slate-gloss', name: '深灰亮面大理石', src: stoneMarbleGreyGlossUrl, scale: 2.4, color: '#a7adb5', reflective: true, reflectionLevel: 0.55, specularStrength: 0.72, specularPower: 96 }
].map((material) => ({
  ...material,
  category: 'stone',
  kind: 'texture'
}));

export const DEFAULT_MATERIAL_PACKS = [
  { id: 'paint-soft-white', name: '柔白涂料', category: 'paint', color: '#f9fbff' },
  { id: 'paint-pink', name: '城堡粉', category: 'paint', color: '#ffd1e3' },
  { id: 'paint-minimalist-black', name: '极简黑', category: 'paint', color: '#2c2c2c' },
  { id: 'paint-pure-white', name: '纯净白', category: 'paint', color: '#ffffff' },
  { id: 'paint-dusty-pink', name: '烟粉色', category: 'paint', color: '#d5b2b2' },
  { id: 'paint-haze-blue', name: '雾霾蓝', category: 'paint', color: '#8ba3b5' },
  { id: 'paint-sage-green', name: '豆沙绿', category: 'paint', color: '#a1a89c' },
  { id: 'paint-oatmeal-yellow', name: '燕麦黄', category: 'paint', color: '#dfd2bc' },
  { id: 'paint-clay-purple', name: '灰泥紫', category: 'paint', color: '#b1a6b0' },
  { id: 'paint-camel', name: '驼色', category: 'paint', color: '#bfa38a' },
  { id: 'paint-warm-sand', name: '暖砂灰', category: 'paint', color: '#cbd0cc' },
  { id: 'paint-terracotta', name: '砖红', category: 'paint', color: '#b56b61' },
  { id: 'paint-classic-grey', name: '高级灰', category: 'paint', color: '#9aa3a6' },
  { id: 'paint-morandi-green', name: '莫兰迪绿', category: 'paint', color: '#b5c4b1' },
  { id: 'paint-morandi-blue', name: '莫兰迪蓝', category: 'paint', color: '#8e9fa9' },
  { id: 'paint-morandi-orange', name: '莫兰迪橘', category: 'paint', color: '#cda393' },
  { id: 'paint-morandi-purple', name: '莫兰迪紫', category: 'paint', color: '#ac9da6' },

  ...COMMON_WOOD_MATERIALS,
  ...COMMON_STONE_MATERIALS,
  ...COMMON_FABRIC_MATERIALS,

  { id: 'metal-gold', name: '金', category: 'metal', kind: 'metal', color: '#d4af37' },
  { id: 'metal-silver', name: '银', category: 'metal', kind: 'metal', color: '#e6e6e6' },
  { id: 'metal-copper', name: '铜', category: 'metal', kind: 'metal', color: '#b87333' },
  { id: 'metal-iron', name: '铁', category: 'metal', kind: 'metal', color: '#43464b' },
  { id: 'metal-aluminum', name: '铝', category: 'metal', kind: 'metal', color: '#d9d9d9' },
  { id: 'metal-gold-matte', name: '磨砂金', category: 'metal', kind: 'metal', color: '#d4af37', roughness: 0.6 },
  { id: 'metal-silver-matte', name: '磨砂银', category: 'metal', kind: 'metal', color: '#e6e6e6', roughness: 0.6 },
  { id: 'metal-copper-matte', name: '磨砂铜', category: 'metal', kind: 'metal', color: '#b87333', roughness: 0.6 },
  { id: 'metal-iron-matte', name: '磨砂铁', category: 'metal', kind: 'metal', color: '#43464b', roughness: 0.6 },
  { id: 'metal-aluminum-matte', name: '磨砂铝', category: 'metal', kind: 'metal', color: '#d9d9d9', roughness: 0.6 },

  { id: 'wallpaper-rose', name: '玫瑰墙纸', category: 'wallpaper', color: '#f7bfd2' },
  {
    id: 'wallpaper-yellow-flower',
    name: '花卉墙纸',
    category: 'wallpaper',
    kind: 'texture',
    src: wallmapYellowUrl,
    scale: 1,
    color: '#f6ecbe'
  },
  ...COMMON_WALLPAPER_MATERIALS,

  { id: 'mirror-silver', name: '银镜', category: 'mirror', kind: 'mirror', color: '#e8eef4' },
  { id: 'mirror-gold', name: '金镜', category: 'mirror', kind: 'mirror', color: '#f0e6c8' },
  { id: 'mirror-bronze', name: '青铜镜', category: 'mirror', kind: 'mirror', color: '#c5b8a0' },
  { id: 'mirror-dark', name: '墨镜', category: 'mirror', kind: 'mirror', color: '#3a3d42' },

  { id: 'glass-clear', name: '透明玻璃', category: 'glass', kind: 'glass', color: '#e8f4ff' },
  { id: 'glass-frosted', name: '磨砂玻璃', category: 'glass', kind: 'glass', color: '#f0f0f0', alpha: 0.55 },
  { id: 'glass-tea', name: '茶色玻璃', category: 'glass', kind: 'glass', color: '#c4a97d' },
  { id: 'glass-blue', name: '蓝色玻璃', category: 'glass', kind: 'glass', color: '#7fb8e0' },
  {
    id: 'glass-stained-cathedral',
    name: '教堂彩色玻璃',
    category: 'glass',
    kind: 'stained-glass',
    color: '#8e4cc9',
    alpha: 0.72,
    patternScale: 1.1,
    emissiveStrength: 0.18
  },

  { id: 'emissive-white', name: '自发光-白', category: 'emissive', kind: 'emissive', color: '#ffffff' },
  { id: 'emissive-warm-white', name: '自发光-暖白', category: 'emissive', kind: 'emissive', color: '#ffebd2' },
  { id: 'emissive-yellow', name: '自发光-黄', category: 'emissive', kind: 'emissive', color: '#ffeb3b' },
  { id: 'emissive-red', name: '自发光-红', category: 'emissive', kind: 'emissive', color: '#f44336' },
  { id: 'emissive-green', name: '自发光-绿', category: 'emissive', kind: 'emissive', color: '#4caf50' },
  { id: 'emissive-blue', name: '自发光-蓝', category: 'emissive', kind: 'emissive', color: '#2196f3' }
];

export function createColorMaterialDescriptor(color, category = 'paint', name = '颜色') {
  return {
    kind: 'color',
    category,
    name,
    color
  };
}

export function createTextureMaterialDescriptor({
  id,
  name,
  category = 'custom',
  src,
  fileName,
  scale = 1,
  color = '#ffffff',
  reflective = false,
  reflectionLevel,
  specularStrength,
  specularPower
}) {
  return {
    id,
    kind: 'texture',
    category,
    name,
    fileName,
    src,
    scale,
    color,
    reflective,
    reflectionLevel,
    specularStrength,
    specularPower
  };
}
