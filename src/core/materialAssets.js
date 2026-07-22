import { DEFAULT_MATERIAL_PACKS } from './materialCatalog.js';

const TEXTURE_MAP = {
  'light_fine_wood.jpg': new URL('../textures/light_fine_wood.jpg', import.meta.url).href,
  'wood_panel_moulding_light.jpg': new URL('../textures/wood_panel_moulding_light.jpg', import.meta.url).href,
  'wood_fluted_oak_light.jpg': new URL('../textures/wood_fluted_oak_light.jpg', import.meta.url).href,
  'wood_herringbone_oak_light.jpg': new URL('../textures/wood_herringbone_oak_light.jpg', import.meta.url).href,
  'wood_plank_oak_light.jpg': new URL('../textures/wood_plank_oak_light.jpg', import.meta.url).href,
  'wood_oak_natural_light.jpg': new URL('../textures/wood_oak_natural_light.jpg', import.meta.url).href,
  'wood_butcher_block_light.jpg': new URL('../textures/wood_butcher_block_light.jpg', import.meta.url).href,
  'wood_basket_parquet_light.jpg': new URL('../textures/wood_basket_parquet_light.jpg', import.meta.url).href,
  'wood_chevron_oak_light.jpg': new URL('../textures/wood_chevron_oak_light.jpg', import.meta.url).href,
  'wood_diagonal_plank_light.jpg': new URL('../textures/wood_diagonal_plank_light.jpg', import.meta.url).href,
  'brick_marble_tiles.jpg': new URL('../textures/brick_marble_tiles.jpg', import.meta.url).href,
  'marbletiles.jpg': new URL('../textures/brick_marble_tiles.jpg', import.meta.url).href,
  'brick_light.jpg': new URL('../textures/brick_light.jpg', import.meta.url).href,
  'brick_marble_warm.jpg': new URL('../textures/brick_marble_warm.jpg', import.meta.url).href,
  'stone_marble_warm.jpg': new URL('../textures/brick_marble_warm.jpg', import.meta.url).href,
  'brick_marble_grey_gloss.jpg': new URL('../textures/brick_marble_grey_gloss.jpg', import.meta.url).href,
  'stone_marble_grey_gloss.jpg': new URL('../textures/brick_marble_grey_gloss.jpg', import.meta.url).href,
  'brick_black_white.jpg': new URL('../textures/brick_black_white.jpg', import.meta.url).href,
  'brick_small_black.png': new URL('../textures/brick_small_black.png', import.meta.url).href,
  'brick_mosaic.jpg': new URL('../textures/brick_mosaic.jpg', import.meta.url).href,
  'brick_red.jpg': new URL('../textures/brick_red.jpg', import.meta.url).href,
  'light_brick.jpg': new URL('../textures/brick_red.jpg', import.meta.url).href,
  'brick_cube.jpg': new URL('../textures/brick_cube.jpg', import.meta.url).href,
  'brick_diamond.jpg': new URL('../textures/brick_diamond.jpg', import.meta.url).href,
  'brick_square.jpg': new URL('../textures/brick_square.jpg', import.meta.url).href,
  'brick_stone.jpg': new URL('../textures/brick_stone.jpg', import.meta.url).href,
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
  'stone_grass.jpg': new URL('../textures/stone_grass.jpg', import.meta.url).href,
  'fabric_rope_cable_beige.jpg': new URL('../textures/fabric_rope_cable_beige.jpg', import.meta.url).href,
  'fabric_knit_cable_grey.jpg': new URL('../textures/fabric_knit_cable_grey.jpg', import.meta.url).href,
  'fabric_knit_cable_white.jpg': new URL('../textures/fabric_knit_cable_white.jpg', import.meta.url).href,
  'fabric_knit_chevron_cream.jpg': new URL('../textures/fabric_knit_chevron_cream.jpg', import.meta.url).href,
  'fabric_weave_dark.jpg': new URL('../textures/fabric_weave_dark.jpg', import.meta.url).href,
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
  'wallpaper_seigaiha_blush.jpg': new URL('../textures/wallpaper_seigaiha_blush.jpg', import.meta.url).href,
  'poster_abstract_arches.png': new URL('../textures/poster_abstract_arches.png', import.meta.url).href,
  'poster_botanical_sage.png': new URL('../textures/poster_botanical_sage.png', import.meta.url).href,
  'poster_bauhaus_primary.png': new URL('../textures/poster_bauhaus_primary.png', import.meta.url).href,
  'poster_mountain_sunrise.png': new URL('../textures/poster_mountain_sunrise.png', import.meta.url).href,
  'poster_celestial_moons.png': new URL('../textures/poster_celestial_moons.png', import.meta.url).href
};

export function resolveMaterialAssetDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== 'object') return descriptor;
  if (descriptor.kind !== 'texture' && !descriptor.src && !descriptor.url) return descriptor;

  let src = descriptor.src || descriptor.url;
  if (descriptor.id) {
    src = DEFAULT_MATERIAL_PACKS.find((pack) => pack.id === descriptor.id)?.src || src;
  }
  if (typeof src === 'string') {
    const fileName = src.split('/').pop()?.split('?')[0];
    src = TEXTURE_MAP[fileName] || src;
  }

  return src === descriptor.src ? descriptor : { ...descriptor, src };
}
