import lightFineWoodUrl from '../textures/light_fine_wood.jpg';
import marbletilesUrl from '../textures/marbletiles.jpg';
import wallmapYellowUrl from '../textures/wallmap_yellow.png';
import lightBrickUrl from '../textures/light_brick.jpg';

export const MATERIAL_CATEGORIES = [
  { id: 'custom', label: '自定义' },
  { id: 'wood', label: '木纹' },
  { id: 'stone', label: '石理' },
  { id: 'metal', label: '金属' },
  { id: 'wallpaper', label: '墙纸' },
  { id: 'fabric', label: '织物' },
  { id: 'paint', label: '涂料' }
];

export const DEFAULT_MATERIAL_PACKS = [
  { id: 'paint-soft-white', name: '柔白涂料', category: 'paint', color: '#f9fbff' },
  { id: 'paint-pink', name: '城堡粉', category: 'paint', color: '#ffd1e3' },
  { id: 'wood-honey', name: '蜂蜜木纹', category: 'wood', color: '#c58b4f' },
  { id: 'stone-light', name: '浅石纹', category: 'stone', color: '#d7d2c8' },
  { id: 'metal-brushed', name: '拉丝金属', category: 'metal', color: '#9aa4ad' },
  { id: 'wallpaper-rose', name: '玫瑰墙纸', category: 'wallpaper', color: '#f7bfd2' },
  {
    id: 'wood-light-fine',
    name: '精细浅木',
    category: 'wood',
    kind: 'texture',
    src: lightFineWoodUrl,
    scale: 3,
    color: '#e5c4a3'
  },
  {
    id: 'stone-marbletiles',
    name: '大理石瓷砖',
    category: 'stone',
    kind: 'texture',
    src: marbletilesUrl,
    scale: 3,
    color: '#e2dfd9'
  },
  {
    id: 'wallpaper-yellow-flower',
    name: '黄花墙纸',
    category: 'wallpaper',
    kind: 'texture',
    src: wallmapYellowUrl,
    scale: 1,
    color: '#f6ecbe'
  },
  {
    id: 'stone-light-brick',
    name: '浅色红砖',
    category: 'stone',
    kind: 'texture',
    src: lightBrickUrl,
    scale: 1,
    color: '#e9d7c3'
  }
];

export function createColorMaterialDescriptor(color, category = 'paint', name = '颜色') {
  return {
    kind: 'color',
    category,
    name,
    color
  };
}

export function createTextureMaterialDescriptor({ name, category = 'custom', src, fileName, scale = 1 }) {
  return {
    kind: 'texture',
    category,
    name,
    fileName,
    src,
    scale
  };
}
