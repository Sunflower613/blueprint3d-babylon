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
  'sky.png': new URL('../textures/sky.png', import.meta.url).href,
  'sky_starry.png': new URL('../textures/sky_starry.png', import.meta.url).href,
  'sky_sunset.png': new URL('../textures/sky_sunset.png', import.meta.url).href,
  'sky_aurora.png': new URL('../textures/sky_aurora.png', import.meta.url).href,
  'sky_underwater.jpg': new URL('../textures/sky_underwater.jpg', import.meta.url).href,
  'sky_desert.jpg': new URL('../textures/sky_desert.jpg', import.meta.url).href,
  'sky_karst.jpg': new URL('../textures/sky_karst.jpg', import.meta.url).href,
  'sky_forest.jpg': new URL('../textures/sky_forest.jpg', import.meta.url).href,
  'sky_candy.jpg': new URL('../textures/sky_candy.jpg', import.meta.url).href,
  'sky_fantasy.jpg': new URL('../textures/sky_fantasy.jpg', import.meta.url).href,
  'sky_ice.jpg': new URL('../textures/sky_ice.jpg', import.meta.url).href,
  'sky_blossom.jpg': new URL('../textures/sky_blossom.jpg', import.meta.url).href,
  'sky_volcano.jpg': new URL('../textures/sky_volcano.jpg', import.meta.url).href,
  'sky_ink-mountains.jpg': new URL('../textures/sky_ink-mountains.jpg', import.meta.url).href,
  'sky.jpg': new URL('../textures/sky.jpg', import.meta.url).href,
  'sky_starry.jpg': new URL('../textures/sky_starry.jpg', import.meta.url).href,
  'sky_sunset.jpg': new URL('../textures/sky_sunset.jpg', import.meta.url).href,
  'sky_aurora.jpg': new URL('../textures/sky_aurora.jpg', import.meta.url).href,
  'emissive_hacker_stream.jpg': new URL('../textures/emissive_hacker_stream.jpg', import.meta.url).href,
  'emissive_dance_floor.jpg': new URL('../textures/emissive_dance_floor.jpg', import.meta.url).href,
  'emissive_fireplace_flame.jpg': new URL('../textures/emissive_fireplace_flame.jpg', import.meta.url).href,
  'emissive_fire.jpg': new URL('../textures/emissive_fire.jpg', import.meta.url).href,
  'emissive_neon_sign.jpg': new URL('../textures/emissive_neon_sign.jpg', import.meta.url).href,
  'emissive_cyber_no_entry.png': new URL('../textures/emissive_cyber_no_entry.png', import.meta.url).href,
  'emissive_robot.jpg': new URL('../textures/emissive_robot.jpg', import.meta.url).href,
  'emissive_robot.gif': new URL('../textures/emissive_robot.gif', import.meta.url).href,
  'grass.png': new URL('../textures/grass.png', import.meta.url).href,
  'fabric_rope_cable_beige.jpg': new URL('../textures/fabric_rope_cable_beige.jpg', import.meta.url).href,
  'fabric_knit_cable_grey.jpg': new URL('../textures/fabric_knit_cable_grey.jpg', import.meta.url).href,
  'fabric_knit_cable_white.jpg': new URL('../textures/fabric_knit_cable_white.jpg', import.meta.url).href,
  'fabric_knit_chevron_cream.jpg': new URL('../textures/fabric_knit_chevron_cream.jpg', import.meta.url).href,
  'fabric_weave_dark.jpg': new URL('../textures/fabric_weave_dark.jpg', import.meta.url).href,
  'fabric_organza_white.jpg': new URL('../textures/fabric_organza_white.jpg', import.meta.url).href,
  'fabric_organza_white.png': new URL('../textures/fabric_organza_white.jpg', import.meta.url).href,
  'fabric_square.jpg': new URL('../textures/fabric_square.jpg', import.meta.url).href,
  'fabric_square.png': new URL('../textures/fabric_square.jpg', import.meta.url).href,
  'fabric_circle.jpg': new URL('../textures/fabric_circle.jpg', import.meta.url).href,
  'fabric_circle.png': new URL('../textures/fabric_circle.jpg', import.meta.url).href,
  'wallmap_yellow.jpg': new URL('../textures/wallmap_yellow.jpg', import.meta.url).href,
  'wallmap_yellow.png': new URL('../textures/wallmap_yellow.jpg', import.meta.url).href,
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
  'wallpaper_rose.jpg': new URL('../textures/wallpaper_rose.jpg', import.meta.url).href,
  'wallpaper_rose.png': new URL('../textures/wallpaper_rose.jpg', import.meta.url).href,
  'poster_abstract_arches.jpg': new URL('../textures/poster_abstract_arches.jpg', import.meta.url).href,
  'poster_abstract_arches.png': new URL('../textures/poster_abstract_arches.jpg', import.meta.url).href,
  'poster_botanical_sage.jpg': new URL('../textures/poster_botanical_sage.jpg', import.meta.url).href,
  'poster_botanical_sage.png': new URL('../textures/poster_botanical_sage.jpg', import.meta.url).href,
  'poster_bauhaus_primary.jpg': new URL('../textures/poster_bauhaus_primary.jpg', import.meta.url).href,
  'poster_bauhaus_primary.png': new URL('../textures/poster_bauhaus_primary.jpg', import.meta.url).href,
  'poster_mountain_sunrise.jpg': new URL('../textures/poster_mountain_sunrise.jpg', import.meta.url).href,
  'poster_mountain_sunrise.png': new URL('../textures/poster_mountain_sunrise.jpg', import.meta.url).href,
  'poster_celestial_moons.jpg': new URL('../textures/poster_celestial_moons.jpg', import.meta.url).href,
  'poster_celestial_moons.png': new URL('../textures/poster_celestial_moons.jpg', import.meta.url).href
};

export function toSameOriginUrl(url) {
  if (typeof url !== 'string' || !url) return url;
  if (typeof window === 'undefined' || !window.location) return url;

  try {
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (e) {
    // 忽略无法解析的路径
  }
  return url;
}

export function resolveMaterialAssetDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== 'object') return descriptor;
  if (descriptor.kind !== 'texture' && !descriptor.src && !descriptor.url) return descriptor;

  let src = descriptor.src || descriptor.url;
  const presetIds = [descriptor.derivedFrom, descriptor.id];
  if (typeof descriptor.id === 'string') {
    let baseId = descriptor.id;
    while (baseId.startsWith('derived_texture_')) {
      baseId = baseId.slice('derived_texture_'.length);
    }
    presetIds.push(baseId);
  }
  for (const presetId of presetIds) {
    if (!presetId) continue;
    const presetSrc = DEFAULT_MATERIAL_PACKS.find((pack) => pack.id === presetId)?.src;
    if (presetSrc) {
      src = presetSrc;
      break;
    }
  }
  if (typeof src === 'string') {
    const fileName = src.split('/').pop()?.split('?')[0];
    src = TEXTURE_MAP[fileName] || src;
  }

  src = toSameOriginUrl(src);

  return src === descriptor.src ? descriptor : { ...descriptor, src };
}
