import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';
import { Vector3, TransformNode } from '../core/babylon.js';

const BABYLON = { Vector3, TransformNode };
const APPLE_TREE_SEASONS = Object.freeze({
  spring: { label: '春', foliage: '#b2e08c', blossom: '#ffe5ee', fruit: '#b2e08c', trunk: '#6d4c41' },
  summer: { label: '夏', foliage: '#2b7a3e', blossom: '#2b7a3e', fruit: '#a2db58', trunk: '#6d4c41' },
  autumn: { label: '秋', foliage: '#fabc2a', blossom: '#fabc2a', fruit: '#e53935', trunk: '#6d4c41' },
  winter: { label: '冬', foliage: '#ffffff', blossom: '#ffffff', fruit: '#ffffff', trunk: '#7d756e' }
});

const BAMBOO_GROVE_SEASONS = Object.freeze({
  spring: { culm: '#2e7d32', foliage: '#4caf50' },
  summer: { culm: '#1b5e20', foliage: '#2e7d32' },
  autumn: { culm: '#8d6e63', foliage: '#b5b35c' },
  winter: { culm: '#7d756e', foliage: '#ffffff' }
});

const BANANA_TREE_SEASONS = Object.freeze({
  spring: { stem: '#8bc34a', leaves: '#9ccc65' },
  summer: { stem: '#689f38', leaves: '#4caf50' },
  autumn: { stem: '#8d6e63', leaves: '#d4c26a' },
  winter: { stem: '#5d4037', leaves: '#ffffff' }
});

const COURTYARD_RED_MAPLE_SEASONS = Object.freeze({
  spring: { trunk: '#3e2723', leaves: '#f8bbd0' },
  summer: { trunk: '#3e2723', leaves: '#2e7d32' },
  autumn: { trunk: '#3e2723', leaves: '#c62828' },
  winter: { trunk: '#4e342e', leaves: '#ffffff' }
});

const COURTYARD_PINE_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#4e342e', foliage: '#2e7d32' },
  summer: { trunk: '#4e342e', foliage: '#1b5e20' },
  autumn: { trunk: '#4e342e', foliage: '#004d40' },
  winter: { trunk: '#3e2723', foliage: '#ffffff' }
});

const GINKGO_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#5d4037', leaves: '#8bc34a' },
  summer: { trunk: '#4e342e', leaves: '#2e7d32' },
  autumn: { trunk: '#5d4037', leaves: '#fdd835' },
  winter: { trunk: '#7d756e', leaves: '#ffffff' }
});

const SHRUB_BALL_SEASONS = Object.freeze({
  spring: { foliage: '#33691e' },
  summer: { foliage: '#1b5e20' },
  autumn: { foliage: '#afb42b' },
  winter: { foliage: '#ffffff' }
});

const CHERRY_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#4e342e', blossoms: '#f48fb1' },
  summer: { trunk: '#4e342e', blossoms: '#4caf50' },
  autumn: { trunk: '#4e342e', blossoms: '#ffb74d' },
  winter: { trunk: '#5d4037', blossoms: '#ffffff' }
});

const BIRCH_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#eceff1', foliage: '#8bc34a' },
  summer: { trunk: '#eceff1', foliage: '#43a047' },
  autumn: { trunk: '#e0e0e0', foliage: '#ffeb3b' },
  winter: { trunk: '#ffffff', foliage: '#ffffff' }
});

const WILLOW_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#5d4037', leaves: '#81c784' },
  summer: { trunk: '#4e342e', leaves: '#2e7d32' },
  autumn: { trunk: '#5d4037', leaves: '#afb42b' },
  winter: { trunk: '#7d756e', leaves: '#ffffff' }
});

const COCONUT_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#8d6e63', leaves: '#4caf50' },
  summer: { trunk: '#8d6e63', leaves: '#2e7d32' },
  autumn: { trunk: '#8d6e63', leaves: '#afb42b' },
  winter: { trunk: '#7d756e', leaves: '#78909c' }
});

const PALM_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#7e57c2', leaves: '#4caf50' },
  summer: { trunk: '#7e57c2', leaves: '#1b5e20' },
  autumn: { trunk: '#8d6e63', leaves: '#558b2f' },
  winter: { trunk: '#5d4037', leaves: '#ffffff' }
});

const GROUND_CACTUS_SEASONS = Object.freeze({
  spring: { stem: '#8bc34a' },
  summer: { stem: '#2e7d32' },
  autumn: { stem: '#1b5e20' },
  winter: { stem: '#ffffff' }
});

const ROSE_BUSH_SEASONS = Object.freeze({
  spring: { leaves: '#33691e', flowers: '#e91e63' },
  summer: { leaves: '#2e7d32', flowers: '#ff4081' },
  autumn: { leaves: '#8d6e63', flowers: '#ffe082' },
  winter: { leaves: '#5d4037', flowers: '#ffffff' }
});

const LAVENDER_FIELD_SEASONS = Object.freeze({
  spring: { base: '#6d4c41', stems: '#8bc34a', spike: '#c8e6c9' },
  summer: { base: '#6d4c41', stems: '#43a047', spike: '#ba68c8' },
  autumn: { base: '#5d4037', stems: '#8d6e63', spike: '#b39ddb' },
  winter: { base: '#4e342e', stems: '#ffffff', spike: '#ffffff' }
});

const SUNFLOWER_PATCH_SEASONS = Object.freeze({
  spring: { stem: '#8bc34a', head: '#8bc34a', core: '#8bc34a' },
  summer: { stem: '#4caf50', head: '#ffeb3b', core: '#3e2723' },
  autumn: { stem: '#8d6e63', head: '#fbc02d', core: '#5d4037' },
  winter: { stem: '#ffffff', head: '#ffffff', core: '#ffffff' }
});

const REED_MARSH_SEASONS = Object.freeze({
  spring: { culm: '#8bc34a', plume: '#c8e6c9' },
  summer: { culm: '#4caf50', plume: '#a5d6a7' },
  autumn: { culm: '#d7ccc8', plume: '#efebe9' },
  winter: { culm: '#8d6e63', plume: '#ffffff' }
});

const BANANA_LEAF_SINGLE_SEASONS = Object.freeze({
  spring: { stem: '#9ccc65', blade: '#8bc34a' },
  summer: { stem: '#7cb342', blade: '#558b2f' },
  autumn: { stem: '#8d6e63', blade: '#d4c26a' },
  winter: { stem: '#5d4037', blade: '#ffffff' }
});

const GRASS_LAWN_SEASONS = Object.freeze({
  spring: { grass: '#8bc34a' },
  summer: { grass: '#4caf50' },
  autumn: { grass: '#d4c26a' },
  winter: { grass: '#ffffff' }
});

const MOSS_PATH_SEASONS = Object.freeze({
  spring: { base: '#8bc34a', slates: '#4f5d65' },
  summer: { base: '#4caf50', slates: '#37474f' },
  autumn: { base: '#d4c26a', slates: '#4f5d65' },
  winter: { base: '#ffffff', slates: '#cfd8dc' }
});

const DANDELION_PATCH_SEASONS = Object.freeze({
  spring: { leaves: '#689f38', puff: '#ffffff' },
  summer: { leaves: '#4caf50', puff: '#e0e0e0' },
  autumn: { leaves: '#afb42b', puff: '#bcaaa4' },
  winter: { leaves: '#ffffff', puff: '#ffffff' }
});

const MORNING_GLORY_FENCE_SEASONS = Object.freeze({
  spring: { bamboo: '#d7ccc8', vines: '#8bc34a', blooms: '#ff80ab' },
  summer: { bamboo: '#d7ccc8', vines: '#4caf50', blooms: '#7c4dff' },
  autumn: { bamboo: '#bcaaa4', vines: '#8d6e63', blooms: '#bcaaa4' },
  winter: { bamboo: '#8d6e63', vines: '#ffffff', blooms: '#ffffff' }
});

const HYDRANGEA_BUSH_SEASONS = Object.freeze({
  spring: { foliage: '#8bc34a', blooms: '#bbdefb' },
  summer: { foliage: '#43a047', blooms: '#4fc3f7' },
  autumn: { foliage: '#8d6e63', blooms: '#ffe082' },
  winter: { foliage: '#5d4037', blooms: '#ffffff' }
});

const TULIP_FIELD_SEASONS = Object.freeze({
  spring: { leaves: '#4ea8de', flowers: '#ff1744' },
  summer: { leaves: '#2e7d32', flowers: '#e0f2f1' },
  autumn: { leaves: '#afb42b', flowers: '#bcaaa4' },
  winter: { leaves: '#ffffff', flowers: '#ffffff' }
});

const LARCH_TREE_SEASONS = Object.freeze({
  spring: { trunk: '#5d4037', foliage: '#a5d6a7' },
  summer: { trunk: '#4e342e', foliage: '#004d40' },
  autumn: { trunk: '#5d4037', foliage: '#ffeb3b' },
  winter: { trunk: '#7d756e', foliage: '#ffffff' }
});

const IVY_WALL_SEASONS = Object.freeze({
  spring: { vine: '#6d4c41', leaves: '#8bc34a' },
  summer: { vine: '#6d4c41', leaves: '#2e7d32' },
  autumn: { vine: '#5d4037', leaves: '#d84315' },
  winter: { vine: '#7d756e', leaves: '#ffffff' }
});

function getSeasonalItem(definition, item, overrides) {
  const nextColors = { ...(item.colors || {}) };
  const nextMaterials = { ...(item.materials || {}) };
  Object.entries(overrides).forEach(([componentId, color]) => {
    nextColors[componentId] = color;
    nextMaterials[componentId] = color;
  });
  return {
    ...item,
    colors: nextColors,
    materials: nextMaterials
  };
}

export const landscapeBambooGrove = {
  type: 'landscape_bamboo_grove',
  name: '翠竹',
  defaultSize: { width: 40, depth: 24, height: 96 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'bamboo-culm', label: '翠绿竹竿', defaultColor: BAMBOO_GROVE_SEASONS.summer.culm },
    { id: 'bamboo-foliage', label: '青葱竹叶', defaultColor: BAMBOO_GROVE_SEASONS.summer.foliage }
  ],
  build(registry, item, node, size) {
    const seasonKey = BAMBOO_GROVE_SEASONS[item.season] ? item.season : 'summer';
    const season = BAMBOO_GROVE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeBambooGrove, item, {
      'bamboo-culm': season.culm,
      'bamboo-foliage': season.foliage
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeBambooGrove, 'bamboo-foliage', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const bambooStems = [
      { x: -size.width * 0.28, z: -size.depth * 0.2, h: size.height * 0.95, rotX: 0.04, rotZ: -0.05 },
      { x: -size.width * 0.1, z: size.depth * 0.22, h: size.height * 0.98, rotX: -0.05, rotZ: 0.02 },
      { x: size.width * 0.12, z: -size.depth * 0.18, h: size.height * 0.92, rotX: 0.03, rotZ: 0.06 },
      { x: size.width * 0.3, z: size.depth * 0.15, h: size.height * 0.96, rotX: -0.02, rotZ: -0.04 }
    ];

    bambooStems.forEach((bs) => {
      const stem = cylinderComponent(registry, seasonalItem, landscapeBambooGrove, 'bamboo-culm', {
        diameterTop: 0.025, diameterBottom: 0.035, height: bs.h, tessellation: 8
      }, { position: { x: bs.x, y: bs.h / 2, z: bs.z } }, { parent: node });
      stem.rotation.x = bs.rotX;
      stem.rotation.z = bs.rotZ;

      const leafCount = 4;
      for (let j = 0; j < leafCount; j++) {
        const leafY = bs.h * (0.38 + j * 0.14);
        const angles = [j * 2.1, j * 2.1 + 2.8];

        angles.forEach((angle) => {
          const leaf = sphereComponent(registry, seasonalItem, landscapeBambooGrove, 'bamboo-foliage', {
            diameter: size.width * 0.20, segments: 6
          }, {
            position: {
              x: bs.x + Math.sin(angle) * size.width * 0.08,
              y: leafY,
              z: bs.z + Math.cos(angle) * size.width * 0.08
            }
          }, { parent: node });

          leaf.scaling.x = 0.09;
          leaf.scaling.y = 0.28;
          leaf.scaling.z = 1.4;

          leaf.rotation.y = angle;
          leaf.rotation.x = 0.42;
          leaf.rotation.z = bs.rotZ;
        });
      }
    });
  }
};

export const landscapeBananaTree = {
  type: 'landscape_banana_tree',
  name: '芭蕉丛',
  defaultSize: { width: 48, depth: 40, height: 80 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'banana-stem', label: '粗壮蕉茎', defaultColor: BANANA_TREE_SEASONS.summer.stem },
    { id: 'banana-leaves', label: '阔叶蕉叶', defaultColor: BANANA_TREE_SEASONS.summer.leaves }
  ],
  build(registry, item, node, size) {
    const seasonKey = BANANA_TREE_SEASONS[item.season] ? item.season : 'summer';
    const season = BANANA_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeBananaTree, item, {
      'banana-stem': season.stem,
      'banana-leaves': season.leaves
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeBananaTree, 'banana-leaves', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;
    const stemConfigs = [
      { rx: -size.width * 0.15, rz: -size.depth * 0.1, h: size.height * 0.84, bendX: 0.06, bendZ: -0.14 },
      { rx: size.width * 0.12, rz: size.depth * 0.12, h: size.height * 0.94, bendX: -0.08, bendZ: 0.15 },
      { rx: -size.width * 0.02, rz: -size.depth * 0.05, h: size.height * 0.76, bendX: 0.14, bendZ: 0.05 }
    ];

    stemConfigs.forEach((sc, idx) => {
      let curStemPos = { x: sc.rx, y: 0, z: sc.rz };
      const segCount = 4;
      const segL = sc.h / segCount;
      let angX = 0;
      let angZ = 0;
      
      const baseSph = sphereComponent(registry, seasonalItem, landscapeBananaTree, 'banana-stem', {
        diameter: size.width * 0.14, segments: 8
      }, { position: { x: sc.rx, y: size.width * 0.04, z: sc.rz } }, { parent: node });
      baseSph.scaling.y = 0.45;
      
      if (idx !== 2) {
        const budDir = idx === 0 ? 1 : -1;
        const bud = cylinderComponent(registry, seasonalItem, landscapeBananaTree, 'banana-stem', {
          diameterTop: 0.005, diameterBottom: size.width * 0.045, height: size.height * 0.12, tessellation: 6
        }, { position: { x: sc.rx + budDir * size.width * 0.07, y: size.height * 0.05, z: sc.rz + 0.03 * size.depth } }, { parent: node });
        bud.rotation.z = budDir * 0.45;
      }
      
      for (let k = 0; k < segCount; k++) {
        angX += sc.bendX / segCount;
        angZ += sc.bendZ / segCount;
        
        const dx = Math.sin(angZ) * (segL / 2);
        const dz = -Math.sin(angX) * (segL / 2);
        const dy = Math.cos(angZ) * Math.cos(angX) * (segL / 2);
        
        const cX = curStemPos.x + dx;
        const cY = curStemPos.y + dy;
        const cZ = curStemPos.z + dz;
        
        const dBot = size.width * (0.072 - k * 0.011);
        const dTop = size.width * (0.072 - (k + 1) * 0.011);
        
        const stemSeg = cylinderComponent(registry, seasonalItem, landscapeBananaTree, 'banana-stem', {
          diameterTop: dTop, diameterBottom: dBot, height: segL, tessellation: 8
        }, { position: { x: cX, y: cY, z: cZ } }, { parent: node });
        
        stemSeg.rotation.x = -angX;
        stemSeg.rotation.z = angZ;
        
        curStemPos.x += dx * 2;
        curStemPos.y += dy * 2;
        curStemPos.z += dz * 2;
      }

      const numLeaves = 6;
      for (let l = 0; l < numLeaves; l++) {
        const leafYaw = l * (Math.PI / 3);
        let leafPos = { x: curStemPos.x, y: curStemPos.y, z: curStemPos.z };
        let leafPitch = -0.32;
        
        const leafSegs = 4;
        const leafSegL = (size.width * 0.38) / leafSegs;
        
        for (let s = 0; s < leafSegs; s++) {
          leafPitch += 0.28;
          
          const lDx = Math.cos(leafYaw) * Math.cos(leafPitch);
          const lDy = -Math.sin(leafPitch);
          const lDz = Math.sin(leafYaw) * Math.cos(leafPitch);
          
          const lcX = leafPos.x + lDx * (leafSegL / 2);
          const lcY = leafPos.y + lDy * (leafSegL / 2);
          const lcZ = leafPos.z + lDz * (leafSegL / 2);
          
          const progress = s / leafSegs;
          const leafW = size.width * 0.165 * Math.sin(progress * Math.PI);
          const leafH = 0.0025;
          
          const waveRoll = 0.12 * Math.sin(s * 1.8);
          const cupAngle = 0.15 + (1.0 - Math.sin(progress * Math.PI)) * 0.22;
          
          [-1, 1].forEach((sideSign) => {
            const halfW = leafW / 2;
            const sideX = -Math.sin(leafYaw);
            const sideZ = Math.cos(leafYaw);
            
            const px = lcX + sideX * sideSign * (halfW / 2);
            const py = lcY + 0.006;
            const pz = lcZ + sideZ * sideSign * (halfW / 2);
            
            const halfLeaf = boxComponent(registry, seasonalItem, landscapeBananaTree, 'banana-leaves', {
              width: halfW, height: leafH, depth: leafSegL
            }, { position: { x: px, y: py, z: pz } }, { parent: node });
            
            halfLeaf.rotation.x = Math.sin(leafYaw) * leafPitch + sideSign * Math.cos(leafYaw) * cupAngle + Math.cos(leafYaw) * waveRoll;
            halfLeaf.rotation.y = -leafYaw;
            halfLeaf.rotation.z = -Math.cos(leafYaw) * leafPitch + sideSign * Math.sin(leafYaw) * cupAngle + Math.sin(leafYaw) * waveRoll;
          });
          
          leafPos.x += lDx * leafSegL;
          leafPos.y += lDy * leafSegL;
          leafPos.z += lDz * leafSegL;
        }
      }

      if (idx === 1) {
        const pedicelH = size.height * 0.08;
        cylinderComponent(registry, seasonalItem, landscapeBananaTree, 'banana-stem', {
          diameterTop: size.width * 0.016, diameterBottom: size.width * 0.012, height: pedicelH, tessellation: 6
        }, { position: { x: curStemPos.x, y: curStemPos.y - pedicelH / 2, z: curStemPos.z } }, { parent: node });
        
        const budSize = size.width * 0.065;
        const bud = sphereComponent(registry, seasonalItem, landscapeBananaTree, 'banana-leaves', {
          diameter: budSize * 1.8, segments: 10
        }, { position: { x: curStemPos.x, y: curStemPos.y - pedicelH, z: curStemPos.z } }, { parent: node });
        bud.scaling.y = 1.7;
      }
    });
  }
};

export const landscapeCourtyardRedMaple = {
  type: 'landscape_courtyard_red_maple',
  name: '枫树',
  defaultSize: { width: 48, depth: 48, height: 96 },
  defaultSeason: 'autumn',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'maple-trunk', label: '嶙峋树干', defaultColor: COURTYARD_RED_MAPLE_SEASONS.autumn.trunk },
    { id: 'maple-leaves', label: '朱红枫叶簇', defaultColor: COURTYARD_RED_MAPLE_SEASONS.autumn.leaves }
  ],
  build(registry, item, node, size) {
    const seasonKey = COURTYARD_RED_MAPLE_SEASONS[item.season] ? item.season : 'autumn';
    const season = COURTYARD_RED_MAPLE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeCourtyardRedMaple, item, {
      'maple-trunk': season.trunk,
      'maple-leaves': season.leaves
    });
    const baseTrunkH = size.height * 0.28;
    
    const trunk1 = cylinderComponent(registry, seasonalItem, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.09, height: baseTrunkH, tessellation: 8
    }, { position: { x: 0, y: baseTrunkH / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = 0.05;

    const midTrunkH = size.height * 0.24;
    const trunk2 = cylinderComponent(registry, seasonalItem, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.055, diameterBottom: size.width * 0.06, height: midTrunkH, tessellation: 8
    }, { position: { x: -size.width * 0.03, y: baseTrunkH + midTrunkH / 2, z: -size.depth * 0.02 } }, { parent: node });
    trunk2.rotation.z = -0.15;
    trunk2.rotation.x = -0.08;

    const leftTrunkH = size.height * 0.22;
    const lTrunk = cylinderComponent(registry, seasonalItem, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: leftTrunkH, tessellation: 6
    }, { position: { x: -size.width * 0.12, y: baseTrunkH + midTrunkH + leftTrunkH / 2 - size.height * 0.05, z: size.depth * 0.03 } }, { parent: node });
    lTrunk.rotation.z = 0.45;
    lTrunk.rotation.x = 0.15;

    const rightTrunkH = size.height * 0.25;
    const rTrunk = cylinderComponent(registry, seasonalItem, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: rightTrunkH, tessellation: 6
    }, { position: { x: size.width * 0.08, y: baseTrunkH + midTrunkH + rightTrunkH / 2 - size.height * 0.04, z: -size.depth * 0.05 } }, { parent: node });
    rTrunk.rotation.z = -0.38;
    rTrunk.rotation.x = -0.12;

    const crownLeaves = [
      { x: -0.28, y: 0.68, z: 0.1, sizeMult: 0.76, rot: { x: 0.2, y: 0.5, z: 0.4 } },
      { x: 0.28, y: 0.72, z: -0.12, sizeMult: 0.74, rot: { x: -0.18, y: -0.4, z: -0.35 } },
      { x: -0.16, y: 0.84, z: -0.18, sizeMult: 0.85, rot: { x: 0.25, y: -0.2, z: 0.15 } },
      { x: 0.15, y: 0.86, z: 0.16, sizeMult: 0.82, rot: { x: -0.15, y: 0.3, z: -0.2 } },
      { x: -0.02, y: 0.93, z: 0.02, sizeMult: 0.78, rot: { x: 0.1, y: 0.1, z: 0.05 } },
      { x: -0.34, y: 0.55, z: -0.05, sizeMult: 0.62, rot: { x: -0.1, y: 0.8, z: 0.65 } },
      { x: 0.32, y: 0.58, z: 0.12, sizeMult: 0.64, rot: { x: 0.12, y: -0.7, z: -0.58 } }
    ];

    crownLeaves.forEach((cl) => {
      const lx = cl.x * size.width;
      const ly = cl.y * size.height;
      const lz = cl.z * size.depth;

      const leafMesh = sphereComponent(registry, seasonalItem, landscapeCourtyardRedMaple, 'maple-leaves', {
        diameter: size.width * cl.sizeMult, segments: 10
      }, {
        position: { x: lx, y: ly, z: lz },
        scaling: { x: 1.35, y: 0.32, z: 0.95 }
      }, { parent: node });
      
      leafMesh.rotation.x = cl.rot.x;
      leafMesh.rotation.y = cl.rot.y;
      leafMesh.rotation.z = cl.rot.z;
    });
  }
};

export const landscapeCourtyardPineTree = {
  type: 'landscape_courtyard_pine_tree',
  name: '迎客松',
  defaultSize: { width: 64, depth: 40, height: 88 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'pine-trunk', label: '曲折松干', defaultColor: COURTYARD_PINE_TREE_SEASONS.summer.trunk },
    { id: 'pine-foliage', label: '叠翠松针', defaultColor: COURTYARD_PINE_TREE_SEASONS.summer.foliage }
  ],
  build(registry, item, node, size) {
    const seasonKey = COURTYARD_PINE_TREE_SEASONS[item.season] ? item.season : 'summer';
    const season = COURTYARD_PINE_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeCourtyardPineTree, item, {
      'pine-trunk': season.trunk,
      'pine-foliage': season.foliage
    });
    // 1. 大树盘地暴露的爪根
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.08, height: size.height * 0.12, tessellation: 8
    }, { position: { x: -size.width * 0.15, y: size.height * 0.04, z: size.depth * 0.05 }, rotation: { x: 0.2, y: 0, z: 0.5 } }, { parent: node });

    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.07, height: size.height * 0.1, tessellation: 8
    }, { position: { x: -size.width * 0.02, y: size.height * 0.03, z: -size.depth * 0.08 }, rotation: { x: -0.3, y: 0.2, z: -0.4 } }, { parent: node });

    // 2. 沧桑曲折的大树干 (4段曲折，苍劲有力)
    const trunkH1 = size.height * 0.22;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.09, diameterBottom: size.width * 0.12, height: trunkH1, tessellation: 10
    }, { position: { x: -size.width * 0.08, y: trunkH1 / 2, z: 0 }, rotation: { x: 0.05, y: 0, z: -0.15 } }, { parent: node });

    const trunkH2 = size.height * 0.20;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.07, diameterBottom: size.width * 0.09, height: trunkH2, tessellation: 8
    }, { position: { x: -size.width * 0.01, y: trunkH1 + trunkH2 / 2 - 0.05, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0.1, z: -0.35 } }, { parent: node });

    const trunkH3 = size.height * 0.18;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.07, height: trunkH3, tessellation: 8
    }, { position: { x: size.width * 0.08, y: trunkH1 + trunkH2 + trunkH3 / 2 - 0.1, z: size.depth * 0.03 }, rotation: { x: 0.05, y: -0.1, z: 0.25 } }, { parent: node });

    const trunkH4 = size.height * 0.15;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.05, height: trunkH4, tessellation: 8
    }, { position: { x: size.width * 0.04, y: trunkH1 + trunkH2 + trunkH3 + trunkH4 / 2 - 0.15, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0, z: 0.1 } }, { parent: node });

    // 3. 向两侧和前后伸展的粗大主枝
    // 向左下角长伸的标志性迎客松巨臂 1
    const branchL1 = size.width * 0.32;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.065, height: branchL1, tessellation: 8
    }, { position: { x: -size.width * 0.18, y: trunkH1 + 0.15, z: size.depth * 0.04 }, rotation: { x: 0.1, y: 0, z: 1.15 } }, { parent: node });

    // 迎客松巨臂 2
    const branchL2 = size.width * 0.28;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: branchL2, tessellation: 6
    }, { position: { x: -size.width * 0.4, y: trunkH1 - 0.3, z: size.depth * 0.06 }, rotation: { x: -0.1, y: -0.1, z: 1.38 } }, { parent: node });

    // 右平衡枝 1
    const rightL1 = size.width * 0.26;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: rightL1, tessellation: 6
    }, { position: { x: size.width * 0.2, y: trunkH1 + trunkH2 + 0.1, z: -size.depth * 0.03 }, rotation: { x: -0.1, y: 0, z: -0.8 } }, { parent: node });

    // 后背景大枝 1
    const backL1 = size.height * 0.22;
    cylinderComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.04, height: backL1, tessellation: 6
    }, { position: { x: size.width * 0.01, y: trunkH1 + trunkH2 + trunkH3 - 0.1, z: -size.depth * 0.2 }, rotation: { x: -0.85, y: 0, z: -0.15 } }, { parent: node });

    // 4. 叠翠层叠云状松冠 (共 8 组大云片)
    // 云片 1 - 迎客大臂末端
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.48, segments: 10
    }, { position: { x: -size.width * 0.54, y: trunkH1 - 0.45, z: size.depth * 0.06 }, scaling: { x: 1.42, y: 0.16, z: 1.0 } }, { parent: node });

    // 云片 2 - 迎客大臂中段上层
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: -size.width * 0.36, y: trunkH1 - 0.2, z: size.depth * 0.14 }, scaling: { x: 1.3, y: 0.15, z: 0.95 } }, { parent: node });

    // 云片 3 - 顶冠主伞 (大)
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.52, segments: 10
    }, { position: { x: size.width * 0.02, y: trunkH1 + trunkH2 + trunkH3 + trunkH4, z: size.depth * 0.05 }, scaling: { x: 1.38, y: 0.16, z: 1.05 } }, { parent: node });

    // 云片 4 - 顶部前偏低云片
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: -size.width * 0.12, y: trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.15, z: size.depth * 0.15 }, scaling: { x: 1.25, y: 0.15, z: 0.9 } }, { parent: node });

    // 云片 5 - 顶部后偏低云片
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: size.width * 0.16, y: trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.1, z: -size.depth * 0.08 }, scaling: { x: 1.28, y: 0.14, z: 0.95 } }, { parent: node });

    // 云片 6 - 右侧主平衡云片
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.44, segments: 8
    }, { position: { x: size.width * 0.36, y: trunkH1 + trunkH2 + 0.3, z: -size.depth * 0.02 }, scaling: { x: 1.35, y: 0.15, z: 1.0 } }, { parent: node });

    // 云片 7 - 右后副云片
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: size.width * 0.28, y: trunkH1 + trunkH2 + 0.15, z: -size.depth * 0.15 }, scaling: { x: 1.2, y: 0.14, z: 0.9 } }, { parent: node });

    // 云片 8 - 后侧大背景云片
    sphereComponent(registry, seasonalItem, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.45, segments: 8
    }, { position: { x: size.width * 0.01, y: trunkH1 + trunkH2 + trunkH3 - 0.05, z: -size.depth * 0.3 }, scaling: { x: 1.25, y: 0.16, z: 0.95 } }, { parent: node });
  }

};

export const landscapeGinkgoTree = {
  type: 'landscape_ginkgo_tree',
  name: '银杏树',
  defaultSize: { width: 44, depth: 44, height: 96 },
  defaultSeason: 'autumn',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'ginkgo-trunk', label: '直立树干', defaultColor: GINKGO_TREE_SEASONS.autumn.trunk },
    { id: 'ginkgo-leaves', label: '金黄银杏叶', defaultColor: GINKGO_TREE_SEASONS.autumn.leaves }
  ],
  build(registry, item, node, size) {
    const seasonKey = GINKGO_TREE_SEASONS[item.season] ? item.season : 'autumn';
    const season = GINKGO_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeGinkgoTree, item, {
      'ginkgo-trunk': season.trunk,
      'ginkgo-leaves': season.leaves
    });
    // 3段曲折渐细的主侧枝
    const trunkH1 = size.height * 0.22;
    const trunk1 = cylinderComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.08, height: trunkH1, tessellation: 8
    }, { position: { x: -size.width * 0.02, y: trunkH1 / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = -0.06;

    const trunkH2 = size.height * 0.18;
    const trunk2 = cylinderComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.06, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.01, y: trunkH1 + trunkH2 / 2 - 0.02, z: size.depth * 0.02 } }, { parent: node });
    trunk2.rotation.z = 0.08;
    trunk2.rotation.x = 0.05;

    const trunkH3 = size.height * 0.16;
    const trunk3 = cylinderComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: trunkH3, tessellation: 8
    }, { position: { x: -size.width * 0.01, y: trunkH1 + trunkH2 + trunkH3 / 2 - 0.04, z: -size.depth * 0.01 } }, { parent: node });
    trunk3.rotation.z = -0.05;

    // 侧枝分杈 1 (从第二段分出)
    const branch1 = cylinderComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.04, height: size.height * 0.2, tessellation: 6
    }, { position: { x: size.width * 0.08, y: trunkH1 + trunkH2 * 0.5, z: size.depth * 0.08 } }, { parent: node });
    branch1.rotation.x = 0.5;
    branch1.rotation.z = 0.4;

    // 侧枝分杈 2 (从第三段分出)
    const branch2 = cylinderComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.02, diameterBottom: size.width * 0.03, height: size.height * 0.18, tessellation: 6
    }, { position: { x: -size.width * 0.08, y: trunkH1 + trunkH2 + trunkH3 * 0.4, z: -size.depth * 0.08 } }, { parent: node });
    branch2.rotation.x = -0.4;
    branch2.rotation.z = -0.5;

    // 树冠：8-10 组高压扁的金黄色扇形云状叶片以 V 字形层叠
    const crownY = trunkH1 + trunkH2 + trunkH3 - size.height * 0.05;
    const leafConfigs = [
      { x: 0, y: crownY + size.height * 0.08, z: 0, d: size.width * 0.65, rx: 0, rz: 0 },
      { x: -size.width * 0.24, y: crownY + size.height * 0.15, z: -size.depth * 0.06, d: size.width * 0.52, rx: 0.1, rz: -0.28 },
      { x: -size.width * 0.38, y: crownY + size.height * 0.26, z: -size.depth * 0.1, d: size.width * 0.48, rx: 0.15, rz: -0.35 },
      { x: size.width * 0.24, y: crownY + size.height * 0.16, z: size.depth * 0.06, d: size.width * 0.52, rx: -0.1, rz: 0.28 },
      { x: size.width * 0.38, y: crownY + size.height * 0.28, z: size.depth * 0.1, d: size.width * 0.48, rx: -0.15, rz: 0.35 },
      { x: -size.width * 0.08, y: crownY + size.height * 0.12, z: size.depth * 0.24, d: size.width * 0.46, rx: -0.25, rz: -0.05 },
      { x: size.width * 0.08, y: crownY + size.height * 0.2, z: -size.depth * 0.24, d: size.width * 0.46, rx: 0.25, rz: 0.05 },
      { x: -size.width * 0.06, y: crownY + size.height * 0.32, z: size.depth * 0.02, d: size.width * 0.42, rx: 0.05, rz: -0.1 },
      { x: size.width * 0.06, y: crownY + size.height * 0.35, z: -size.depth * 0.02, d: size.width * 0.38, rx: -0.05, rz: 0.1 }
    ];

    leafConfigs.forEach((lc) => {
      const leafGroup = sphereComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-leaves', {
        diameter: lc.d, segments: 8
      }, { position: { x: lc.x, y: lc.y, z: lc.z } }, { parent: node });
      leafGroup.scaling.x = 1.3;
      leafGroup.scaling.y = 0.18;
      leafGroup.scaling.z = 0.85;
      leafGroup.rotation.x = lc.rx;
      leafGroup.rotation.z = lc.rz;
    });

    // 地面落叶 5片
    const leafPositions = [
      { x: -size.width * 0.28, z: size.depth * 0.22, ry: 0.6 },
      { x: size.width * 0.32, z: -size.depth * 0.25, ry: -1.2 },
      { x: -size.width * 0.15, z: -size.depth * 0.32, ry: 2.1 },
      { x: size.width * 0.22, z: size.depth * 0.3, ry: -0.5 },
      { x: -size.width * 0.05, z: size.depth * 0.4, ry: 1.8 }
    ];

    leafPositions.forEach((pos) => {
      const fallen = sphereComponent(registry, seasonalItem, landscapeGinkgoTree, 'ginkgo-leaves', {
        diameter: size.width * 0.07, segments: 4
      }, { position: { x: pos.x, y: 0.01, z: pos.z } }, { parent: node });
      fallen.scaling.x = 1.0;
      fallen.scaling.y = 0.02;
      fallen.scaling.z = 0.6;
      fallen.rotation.y = pos.ry;
    });
  }
};

export const landscapeShrubBall = {
  type: 'landscape_shrub_ball',
  name: '灌木',
  defaultSize: { width: 24, depth: 24, height: 24 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'shrub-foliage', label: '修剪碧绿树冠', defaultColor: SHRUB_BALL_SEASONS.spring.foliage }
  ],
  build(registry, item, node, size) {
    const seasonKey = SHRUB_BALL_SEASONS[item.season] ? item.season : 'spring';
    const season = SHRUB_BALL_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeShrubBall, item, {
      'shrub-foliage': season.foliage
    });
    const startY = 0;
    
    sphereComponent(registry, seasonalItem, landscapeShrubBall, 'shrub-foliage', {
      diameter: size.width * 0.72, segments: 12
    }, { position: { x: 0, y: startY + (size.height - startY) * 0.38, z: 0 } }, { parent: node });

    sphereComponent(registry, seasonalItem, landscapeShrubBall, 'shrub-foliage', {
      diameter: size.width * 0.58, segments: 10
    }, { position: { x: size.width * 0.15, y: startY + (size.height - startY) * 0.58, z: -size.depth * 0.12 } }, { parent: node });

    sphereComponent(registry, seasonalItem, landscapeShrubBall, 'shrub-foliage', {
      diameter: size.width * 0.46, segments: 8
    }, { position: { x: -size.width * 0.14, y: startY + (size.height - startY) * 0.72, z: size.depth * 0.14 } }, { parent: node });
  }
};

export const landscapeCherryTree = {
  type: 'landscape_cherry_tree',
  name: '樱花树',
  defaultSize: { width: 52, depth: 52, height: 90 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'cherry-blossoms', label: '粉粉樱花', defaultColor: CHERRY_TREE_SEASONS.spring.blossoms },
    { id: 'cherry-trunk', label: '屈曲老干', defaultColor: CHERRY_TREE_SEASONS.spring.trunk }
  ],
  build(registry, item, node, size) {
    const seasonKey = CHERRY_TREE_SEASONS[item.season] ? item.season : 'spring';
    const season = CHERRY_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeCherryTree, item, {
      'cherry-trunk': season.trunk,
      'cherry-blossoms': season.blossoms
    });
    // 1. 黑褐色老樱木曲折多杈树干
    const trunkH1 = size.height * 0.20;
    const trunk1 = cylinderComponent(registry, seasonalItem, landscapeCherryTree, 'cherry-trunk', {
      diameterTop: size.width * 0.08, diameterBottom: size.width * 0.11, height: trunkH1, tessellation: 8
    }, { position: { x: -size.width * 0.03, y: trunkH1 / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = -0.1;

    const trunkH2 = size.height * 0.18;
    const trunk2 = cylinderComponent(registry, seasonalItem, landscapeCherryTree, 'cherry-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.08, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.02, y: trunkH1 + trunkH2 / 2 - 0.02, z: size.depth * 0.03 } }, { parent: node });
    trunk2.rotation.z = 0.15;
    trunk2.rotation.x = 0.08;

    const trunkH3 = size.height * 0.15;
    const trunk3 = cylinderComponent(registry, seasonalItem, landscapeCherryTree, 'cherry-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.06, height: trunkH3, tessellation: 8
    }, { position: { x: -size.width * 0.02, y: trunkH1 + trunkH2 + trunkH3 / 2 - 0.04, z: -size.depth * 0.02 } }, { parent: node });
    trunk3.rotation.z = -0.08;

    // 侧枝分杈 3个
    const branches = [
      { y: trunkH1 + trunkH2 * 0.3, len: size.height * 0.26, rx: 0.6, rz: -0.5 },
      { y: trunkH1 + trunkH2 * 0.8, len: size.height * 0.24, rx: -0.4, rz: 0.6 },
      { y: trunkH1 + trunkH2 + trunkH3 * 0.5, len: size.height * 0.20, rx: 0.5, rz: 0.4 }
    ];

    branches.forEach((br) => {
      const bx = Math.sin(br.rz) * (br.len * 0.4);
      const bz = Math.sin(br.rx) * (br.len * 0.4);
      const by = br.y + Math.cos(br.rz) * (br.len * 0.4);

      const branch = cylinderComponent(registry, seasonalItem, landscapeCherryTree, 'cherry-trunk', {
        diameterTop: size.width * 0.025, diameterBottom: size.width * 0.045, height: br.len, tessellation: 6
      }, { position: { x: bx, y: by, z: bz } }, { parent: node });
      branch.rotation.x = br.rx;
      branch.rotation.z = br.rz;
    });

    // 2. 树冠：8-10组粉色与桃红色拼接扁球体
    const crownY = trunkH1 + trunkH2 + trunkH3 - size.height * 0.05;
    const leafClusters = [
      { x: 0, y: crownY + size.height * 0.08, z: 0, d: size.width * 0.72, sx: 1.1, sy: 0.52, sz: 1.0 },
      { x: -size.width * 0.24, y: crownY + size.height * 0.05, z: size.depth * 0.12, d: size.width * 0.56, sx: 1.2, sy: 0.45, sz: 0.95 },
      { x: size.width * 0.26, y: crownY + size.height * 0.06, z: -size.depth * 0.15, d: size.width * 0.58, sx: 1.0, sy: 0.48, sz: 1.15 },
      { x: -size.width * 0.05, y: crownY + size.height * 0.02, z: size.depth * 0.25, d: size.width * 0.46, sx: 1.1, sy: 0.42, sz: 0.8 },
      { x: size.width * 0.08, y: crownY + size.height * 0.15, z: -size.depth * 0.26, d: size.width * 0.50, sx: 0.9, sy: 0.46, sz: 1.2 },
      { x: -size.width * 0.05, y: crownY + size.height * 0.28, z: size.depth * 0.05, d: size.width * 0.52, sx: 1.05, sy: 0.50, sz: 1.05 },
      { x: -size.width * 0.22, y: crownY + size.height * 0.32, z: -size.depth * 0.1, d: size.width * 0.42, sx: 1.0, sy: 0.42, sz: 1.0 },
      { x: size.width * 0.20, y: crownY + size.height * 0.34, z: size.depth * 0.12, d: size.width * 0.38, sx: 1.0, sy: 0.40, sz: 1.0 },
      { x: -size.width * 0.28, y: crownY - size.height * 0.05, z: size.depth * 0.2, d: size.width * 0.34, sx: 1.1, sy: 0.42, sz: 0.9 },
      { x: size.width * 0.30, y: crownY - size.height * 0.08, z: -size.depth * 0.2, d: size.width * 0.32, sx: 1.0, sy: 0.40, sz: 1.0 }
    ];

    leafClusters.forEach((lc) => {
      const cluster = sphereComponent(registry, seasonalItem, landscapeCherryTree, 'cherry-blossoms', {
        diameter: lc.d, segments: 8
      }, { position: { x: lc.x, y: lc.y, z: lc.z } }, { parent: node });
      cluster.scaling.x = lc.sx;
      cluster.scaling.y = lc.sy;
      cluster.scaling.z = lc.sz;
    });

    // 3. 地上散落樱花瓣
    const petalCount = 8;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * 2 * Math.PI) / petalCount + 0.4;
      const radius = size.width * (0.22 + 0.12 * Math.sin(i * 1.6));
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      const petal = sphereComponent(registry, seasonalItem, landscapeCherryTree, 'cherry-blossoms', {
        diameter: size.width * 0.06, segments: 4
      }, { position: { x: px, y: 0.01, z: pz } }, { parent: node });
      petal.scaling.x = 1.0;
      petal.scaling.y = 0.015;
      petal.scaling.z = 0.55;
      petal.rotation.y = angle + 0.6;
    }
  }
};

export const landscapeBirchTree = {
  type: 'landscape_birch_tree',
  name: '白桦树',
  defaultSize: { width: 36, depth: 36, height: 108 },
  defaultSeason: 'autumn',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'birch-trunk', label: '银白白桦干', defaultColor: BIRCH_TREE_SEASONS.autumn.trunk },
    { id: 'birch-foliage', label: '婆娑绿叶', defaultColor: BIRCH_TREE_SEASONS.autumn.foliage }
  ],
  build(registry, item, node, size) {
    const seasonKey = BIRCH_TREE_SEASONS[item.season] ? item.season : 'autumn';
    const season = BIRCH_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeBirchTree, item, {
      'birch-trunk': season.trunk,
      'birch-foliage': season.foliage
    });
    const trunkH = size.height * 0.62;
    // 白色主干
    cylinderComponent(registry, seasonalItem, landscapeBirchTree, 'birch-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.07, height: trunkH, tessellation: 12
    }, { position: { x: 0, y: trunkH / 2, z: 0 } }, { parent: node });

    // 细直分杈枝
    const branches = [
      { y: trunkH * 0.45, len: size.height * 0.22, rZ: 0.35, rY: 0.2 },
      { y: trunkH * 0.65, len: size.height * 0.20, rZ: -0.32, rY: 1.5 },
      { y: trunkH * 0.82, len: size.height * 0.18, rZ: 0.28, rY: -1.2 }
    ];

    branches.forEach((br) => {
      const bx = Math.sin(br.rZ) * (br.len * 0.4);
      const bz = Math.sin(br.rY) * Math.sin(br.rZ) * (br.len * 0.4);
      const by = br.y + Math.cos(br.rZ) * (br.len * 0.4);

      const branch = cylinderComponent(registry, seasonalItem, landscapeBirchTree, 'birch-trunk', {
        diameterTop: size.width * 0.015, diameterBottom: size.width * 0.028, height: br.len, tessellation: 6
      }, { position: { x: bx, y: by, z: bz } }, { parent: node });
      branch.rotation.z = br.rZ;
      branch.rotation.y = br.rY;
    });

    // 模拟白桦树黑疤节纹理
    const scars = [
      { y: trunkH * 0.15, angle: 0.2, w: size.width * 0.02, d: size.width * 0.08 },
      { y: trunkH * 0.28, angle: 2.2, w: size.width * 0.018, d: size.width * 0.075 },
      { y: trunkH * 0.48, angle: -1.1, w: size.width * 0.016, d: size.width * 0.07 },
      { y: trunkH * 0.62, angle: 0.8, w: size.width * 0.015, d: size.width * 0.065 },
      { y: trunkH * 0.78, angle: -2.5, w: size.width * 0.012, d: size.width * 0.055 }
    ];

    scars.forEach((sc) => {
      const r = (size.width * 0.06 * (trunkH - sc.y) / trunkH + size.width * 0.04) * 0.5 + 0.02;
      const sx = Math.cos(sc.angle) * r;
      const sz = Math.sin(sc.angle) * r;

      const scar = boxComponent(registry, seasonalItem, landscapeBirchTree, 'birch-trunk', {
        width: sc.w, height: size.height * 0.02, depth: sc.d
      }, { position: { x: sx, y: sc.y, z: sz } }, { parent: node });
      scar.rotation.y = -sc.angle;
      scar.rotation.x = 0.1;
    });

    // 树顶配置高塔形分层的绿色尖叶冠
    const foilStart = trunkH * 0.8;
    const foilH = size.height - foilStart;
    const layers = [
      { y: foilStart + foilH * 0.22, d: size.width * 0.85, h: foilH * 0.45 },
      { y: foilStart + foilH * 0.48, d: size.width * 0.68, h: foilH * 0.40 },
      { y: foilStart + foilH * 0.72, d: size.width * 0.50, h: foilH * 0.35 },
      { y: foilStart + foilH * 0.90, d: size.width * 0.32, h: foilH * 0.30 }
    ];

    layers.forEach((ly) => {
      cylinderComponent(registry, seasonalItem, landscapeBirchTree, 'birch-foliage', {
        diameterTop: 0.01, diameterBottom: ly.d, height: ly.h, tessellation: 10
      }, { position: { x: 0, y: ly.y, z: 0 } }, { parent: node });
    });
  }
};

export const landscapeWillowTree = {
  type: 'landscape_willow_tree',
  name: '垂柳',
  defaultSize: { width: 52, depth: 52, height: 90 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'willow-trunk', label: '弯柳曲干', defaultColor: WILLOW_TREE_SEASONS.spring.trunk },
    { id: 'willow-leaves', label: '拂水柔条', defaultColor: '#81c784' }
  ],
  build(registry, item, node, size) {
    const seasonKey = WILLOW_TREE_SEASONS[item.season] ? item.season : 'spring';
    const season = WILLOW_TREE_SEASONS[seasonKey];
    // 修复四季颜色绑定的键名 Bug，由 'willow-foliage' 更正为 'willow-leaves'
    const seasonalItem = getSeasonalItem(landscapeWillowTree, item, {
      'willow-trunk': season.trunk,
      'willow-leaves': season.leaves
    });

    // 1. 生成树干的弯曲点（4段，共5个点），实现 Low-Poly 几何弯曲
    const trunkPoints = [];
    const N = 4;
    const H = size.height * 0.52;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = t * H;
      // 树干向侧前方稍微弯曲，形成优美的倾斜树势
      const x = Math.sin(t * Math.PI) * size.width * 0.07 + t * size.width * 0.03;
      const z = (1 - Math.cos(t * Math.PI * 0.5)) * -size.depth * 0.05;
      trunkPoints.push(new BABYLON.Vector3(x, y, z));
    }

    // 2. 绘制树干，利用 3D 向量朝向对齐，消除缝隙和错位
    for (let i = 0; i < N; i++) {
      const pA = trunkPoints[i];
      const pB = trunkPoints[i + 1];
      const dir = pB.subtract(pA);
      const h = dir.length();
      const v = dir.normalize();
      
      // 计算用于圆柱体对齐的 3D 旋转角度
      const rx = Math.acos(v.y);
      const ry = Math.atan2(v.x, v.z);
      const pos = pA.add(pB).scale(0.5);

      // 从下往上逐渐变细
      const dBottom = size.width * (0.09 - i * 0.015);
      const dTop = size.width * (0.09 - (i + 1) * 0.015);

      cylinderComponent(registry, seasonalItem, landscapeWillowTree, 'willow-trunk', {
        diameterTop: dTop, diameterBottom: dBottom, height: h, tessellation: 6
      }, {
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotation: { x: rx, y: ry, z: 0 }
      }, { parent: node });
    }

    // 3. 生成 4 根发散的主树枝，每根树枝分为 2 段折线，实现完美无缝对接
    const numBranches = 4;
    const branchEnds = []; // 存放柳条的生长起点

    for (let b = 0; b < numBranches; b++) {
      const angle = (b * 2 * Math.PI) / numBranches + 0.2; // 稍微错开方向

      const pStart = trunkPoints[N];
      // 第一段树枝：向上向外伸展
      const pMid = new BABYLON.Vector3(
        pStart.x + Math.cos(angle) * size.width * 0.16,
        pStart.y + size.height * 0.12,
        pStart.z + Math.sin(angle) * size.depth * 0.16
      );

      // 第二段树枝：继续向外发散，并开始往下微屈，利于柳条垂挂
      const pEnd = new BABYLON.Vector3(
        pMid.x + Math.cos(angle) * size.width * 0.12,
        pMid.y - size.height * 0.04,
        pMid.z + Math.sin(angle) * size.depth * 0.12
      );

      branchEnds.push({ pos: pEnd, angle: angle });

      // 绘制树枝第一段
      {
        const dir = pMid.subtract(pStart);
        const h = dir.length();
        const v = dir.normalize();
        const rx = Math.acos(v.y);
        const ry = Math.atan2(v.x, v.z);
        const pos = pStart.add(pMid).scale(0.5);
        const dBottom = size.width * 0.035;
        const dTop = size.width * 0.026;

        cylinderComponent(registry, seasonalItem, landscapeWillowTree, 'willow-trunk', {
          diameterTop: dTop, diameterBottom: dBottom, height: h, tessellation: 5
        }, {
          position: { x: pos.x, y: pos.y, z: pos.z },
          rotation: { x: rx, y: ry, z: 0 }
        }, { parent: node });
      }

      // 绘制树枝第二段
      {
        const dir = pEnd.subtract(pMid);
        const h = dir.length();
        const v = dir.normalize();
        const rx = Math.acos(v.y);
        const ry = Math.atan2(v.x, v.z);
        const pos = pMid.add(pEnd).scale(0.5);
        const dBottom = size.width * 0.026;
        const dTop = size.width * 0.016;

        cylinderComponent(registry, seasonalItem, landscapeWillowTree, 'willow-trunk', {
          diameterTop: dTop, diameterBottom: dBottom, height: h, tessellation: 5
        }, {
          position: { x: pos.x, y: pos.y, z: pos.z },
          rotation: { x: rx, y: ry, z: 0 }
        }, { parent: node });
      }
    }

    // 4. 从 4 个大树枝末端各垂挂 6 根柳条，全树共 24 根，柳条加粗以突显 Low-Poly 质感
    branchEnds.forEach((bEnd) => {
      const willowCount = 6;
      for (let w = 0; w < willowCount; w++) {
        // 柳条环状发散角度
        const localAngle = (w * 2 * Math.PI) / willowCount;
        const globalAngle = bEnd.angle + localAngle;

        // 柳条起点稍微偏移树枝端点，避免交错重叠
        const startX = bEnd.pos.x + Math.cos(globalAngle) * size.width * 0.04;
        const startZ = bEnd.pos.z + Math.sin(globalAngle) * size.depth * 0.04;
        const startY = bEnd.pos.y - 0.01;

        let currentPos = new BABYLON.Vector3(startX, startY, startZ);

        // 柳条初始方向：向侧下方倾斜发散
        let velocity = new BABYLON.Vector3(
          Math.cos(globalAngle) * 0.45,
          -0.5,
          Math.sin(globalAngle) * 0.45
        ).normalize();

        const segmentCount = 3; // 3段硬折线，符合 Low-Poly 风格
        const segH = size.height * 0.12;

        for (let s = 0; s < segmentCount; s++) {
          const nextPos = currentPos.add(velocity.scale(segH));

          const dir = nextPos.subtract(currentPos);
          const h = dir.length();
          const v = dir.normalize();
          const rx = Math.acos(v.y);
          const ry = Math.atan2(v.x, v.z);
          const midPos = currentPos.add(nextPos).scale(0.5);

          // 绘制加粗后的低多边形柳条（由 0.007 加粗至 0.012，更显茂密）
          cylinderComponent(registry, seasonalItem, landscapeWillowTree, 'willow-leaves', {
            diameterTop: size.width * 0.012,
            diameterBottom: size.width * 0.012,
            height: h,
            tessellation: 4
          }, {
            position: { x: midPos.x, y: midPos.y, z: midPos.z },
            rotation: { x: rx, y: ry, z: 0 }
          }, { parent: node });

          // 柳条两侧挂上对生的 Low-Poly 细长扁平柳叶
          [-1, 1].forEach((sideSign) => {
            const leafYaw = globalAngle + sideSign * 0.65;
            const radius = size.width * 0.026;
            const lx = midPos.x + Math.cos(leafYaw) * radius;
            const lz = midPos.z + Math.sin(leafYaw) * radius;
            const ly = midPos.y + (Math.random() - 0.5) * segH * 0.2;

            const leaf = sphereComponent(registry, seasonalItem, landscapeWillowTree, 'willow-leaves', {
              diameter: size.width * 0.078, segments: 4
            }, {
              position: { x: lx, y: ly, z: lz }
            }, { parent: node });

            // 压扁拉长，呈现尖锐硬朗的几何叶片质感
            leaf.scaling.x = 0.11;
            leaf.scaling.y = 0.52;
            leaf.scaling.z = 0.24;

            leaf.rotation.y = leafYaw;
            leaf.rotation.x = rx + 0.32 * sideSign;
            leaf.rotation.z = sideSign * 0.18;
          });

          currentPos = nextPos;

          // 物理重力模拟迭代：受重力向下拉拽，水平速度向内收缩，使下端段更趋于垂直挂坠
          velocity.y -= 0.24;
          velocity.x *= 0.82;
          velocity.z *= 0.82;
          velocity = velocity.normalize();
        }
      }
    });

    // 树冠隐形碰撞箱（仅覆盖高空树冠核心区域，不影响底部的编辑）
    const crownBox = boxComponent(registry, seasonalItem, landscapeWillowTree, 'willow-leaves', {
      width: size.width * 0.8, height: size.height * 0.35, depth: size.depth * 0.8
    }, {
      position: { x: 0, y: size.height * 0.72, z: 0 }
    }, { parent: node });
    crownBox.visibility = 0;
    crownBox.isPickable = true;
  }
};

export const landscapeCoconutTree = {
  type: 'landscape_coconut_tree',
  name: '椰子树',
  defaultSize: { width: 40, depth: 40, height: 96 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'coconut-trunk', label: '弯曲椰树干', defaultColor: COCONUT_TREE_SEASONS.summer.trunk },
    { id: 'coconut-leaves', label: '阔叶椰子叶', defaultColor: COCONUT_TREE_SEASONS.summer.leaves }
  ],
  build(registry, item, node, size) {
    const seasonKey = COCONUT_TREE_SEASONS[item.season] ? item.season : 'summer';
    const season = COCONUT_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeCoconutTree, item, {
      'coconut-trunk': season.trunk,
      'coconut-leaves': season.leaves
    });
    let currentPos = { x: 0, y: 0, z: 0 };
    let currentAngleZ = 0;
    const trunkHeight = size.height * 0.82;
    const numSegs = 6;
    const segL = trunkHeight / numSegs;

    for (let i = 0; i < numSegs; i++) {
      const dBot = size.width * (0.075 - i * 0.007);
      const dTop = size.width * (0.075 - (i + 1) * 0.007);
      
      currentAngleZ -= 0.075;
      
      const cX = currentPos.x + Math.sin(-currentAngleZ) * (segL / 2);
      const cY = currentPos.y + Math.cos(-currentAngleZ) * (segL / 2);
      const cZ = currentPos.z;
      
      const seg = cylinderComponent(registry, seasonalItem, landscapeCoconutTree, 'coconut-trunk', {
        diameterTop: dTop, diameterBottom: dBot, height: segL, tessellation: 10
      }, { position: { x: cX, y: cY, z: cZ } }, { parent: node });
      
      seg.rotation.z = currentAngleZ;
      
      currentPos.x += Math.sin(-currentAngleZ) * segL;
      currentPos.y += Math.cos(-currentAngleZ) * segL;
    }

    const cocoRadius = size.width * 0.048;
    const numCocos = 3;
    for (let c = 0; c < numCocos; c++) {
      const angle = (c * 2 * Math.PI) / numCocos;
      const offsetDist = cocoRadius * 0.85;
      const cocoX = currentPos.x + Math.sin(-currentAngleZ) * (-segL * 0.25) + Math.cos(angle) * offsetDist;
      const cocoY = currentPos.y + Math.cos(-currentAngleZ) * (-segL * 0.25) + Math.sin(angle) * 0.2 * offsetDist;
      const cocoZ = currentPos.z + Math.sin(angle) * offsetDist;
      
      sphereComponent(registry, seasonalItem, landscapeCoconutTree, 'coconut-trunk', {
        diameter: cocoRadius * 2, segments: 12
      }, { position: { x: cocoX, y: cocoY, z: cocoZ } }, { parent: node });
    }

    // 采用整片椭圆大叶面拼接设计（Low-Poly 优雅风），共 8 大主枝，每枝呈自然拱形悬垂
    const numLeaves = 8;
    for (let p = 0; p < numLeaves; p++) {
      const yaw = p * (2 * Math.PI / numLeaves);
      let stemPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
      let pitch = -0.12;
      const numSubSegs = 5;
      const subSegL = (size.width * 0.48) / numSubSegs;
      
      for (let k = 0; k < numSubSegs; k++) {
        pitch += 0.22;
        
        const dx = Math.cos(yaw) * Math.cos(pitch);
        const dy = -Math.sin(pitch);
        const dz = Math.sin(yaw) * Math.cos(pitch);
        
        const cX = stemPos.x + dx * (subSegL / 2);
        const cY = stemPos.y + dy * (subSegL / 2);
        const cZ = stemPos.z + dz * (subSegL / 2);
        
        // 渐变叶宽（形成宽阔的梭形大椰叶）
        const leafW = size.width * (0.24 * (1.0 - (k / numSubSegs) * 0.65));
        
        const leafSeg = sphereComponent(registry, seasonalItem, landscapeCoconutTree, 'coconut-leaves', {
          diameter: subSegL * 1.6, segments: 6
        }, {
          position: { x: cX, y: cY, z: cZ }
        }, { parent: node });
        
        // 压扁成漂亮的梭状大椰叶片
        leafSeg.scaling.x = leafW / (subSegL * 1.6);
        leafSeg.scaling.y = 0.03;
        leafSeg.scaling.z = 1.15;
        
        leafSeg.rotation.x = Math.sin(yaw) * pitch;
        leafSeg.rotation.y = -yaw;
        leafSeg.rotation.z = -Math.cos(yaw) * pitch;
        
        stemPos.x += dx * subSegL;
        stemPos.y += dy * subSegL;
        stemPos.z += dz * subSegL;
      }
    }

    // 树冠高空碰撞箱
    const crownBox = boxComponent(registry, seasonalItem, landscapeCoconutTree, 'coconut-leaves', {
      width: size.width * 0.9, height: size.height * 0.35, depth: size.depth * 0.9
    }, {
      position: {
        x: currentPos.x * 0.5,
        y: size.height * 0.85,
        z: 0
      }
    }, { parent: node });
    crownBox.visibility = 0;
    crownBox.isPickable = true;
  }
};

export const landscapePalmTree = {
  type: 'landscape_palm_tree',
  name: '棕榈树',
  defaultSize: { width: 44, depth: 44, height: 84 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'palm-trunk', label: '鳞片棕树干', defaultColor: PALM_TREE_SEASONS.summer.trunk },
    { id: 'palm-leaves', label: '扇形棕榈叶', defaultColor: PALM_TREE_SEASONS.summer.leaves }
  ],
  build(registry, item, node, size) {
    const seasonKey = PALM_TREE_SEASONS[item.season] ? item.season : 'summer';
    const season = PALM_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapePalmTree, item, {
      'palm-trunk': season.trunk,
      'palm-leaves': season.leaves
    });
    const numTrunkSegs = 10;
    const trunkH = size.height * 0.68;
    const segH = (trunkH / numTrunkSegs) * 1.25;

    for (let j = 0; j < numTrunkSegs; j++) {
      const progress = j / numTrunkSegs;
      const baseD = size.width * 0.15 * (1.0 - progress * 0.35);
      
      const dBot = baseD * 0.88;
      const dTop = baseD * 1.28;
      
      const yPos = (j * (trunkH / numTrunkSegs)) + (segH / 2);
      
      cylinderComponent(registry, seasonalItem, landscapePalmTree, 'palm-trunk', {
        diameterTop: dTop, diameterBottom: dBot, height: segH, tessellation: 8
      }, { position: { x: 0, y: yPos, z: 0 } }, { parent: node });
    }

    // 采用双层错落的整片大椭圆扇形叶片设计，共 16 枝，营造高厚度的体量深度
    const numLeaves = 16;
    const leafParts = 5;
    const leafPartL = (size.width * 0.55) / leafParts;

    for (let p = 0; p < numLeaves; p++) {
      const yaw = p * (2 * Math.PI / numLeaves);
      // 上下双层交错起伏生长
      const isUpper = p % 2 === 0;
      const startY = isUpper ? trunkH * 1.02 : trunkH * 0.96;
      let curPos = { x: 0, y: startY, z: 0 };
      
      // 上下层拥有不同的起伏倾向，使树冠更加饱满且层叠
      let pitch = isUpper ? -0.26 : -0.15;
      
      for (let k = 0; k < leafParts; k++) {
        pitch += isUpper ? 0.22 : 0.26;
        
        const dx = Math.cos(yaw) * Math.cos(pitch);
        const dy = -Math.sin(pitch);
        const dz = Math.sin(yaw) * Math.cos(pitch);
        
        const cX = curPos.x + dx * (leafPartL / 2);
        const cY = curPos.y + dy * (leafPartL / 2);
        const cZ = curPos.z + dz * (leafPartL / 2);
        
        // 宽度阔叶扇片
        const leafW = size.width * (0.23 * (1.0 - (k / leafParts) * 0.65));
        
        const leafSeg = sphereComponent(registry, seasonalItem, landscapePalmTree, 'palm-leaves', {
          diameter: leafPartL * 1.6, segments: 6
        }, {
          position: { x: cX, y: cY, z: cZ }
        }, { parent: node });
        
        // 压扁并向两侧平展成椭圆绿叶扇面
        leafSeg.scaling.x = leafW / (leafPartL * 1.6);
        leafSeg.scaling.y = 0.03;
        leafSeg.scaling.z = 1.15;
        
        leafSeg.rotation.x = Math.sin(yaw) * pitch;
        leafSeg.rotation.y = -yaw;
        leafSeg.rotation.z = -Math.cos(yaw) * pitch;
        
        curPos.x += dx * leafPartL;
        curPos.y += dy * leafPartL;
        curPos.z += dz * leafPartL;
      }
    }

    // 树冠高空碰撞箱
    const crownBox = boxComponent(registry, seasonalItem, landscapePalmTree, 'palm-leaves', {
      width: size.width * 0.85, height: size.height * 0.3, depth: size.depth * 0.85
    }, {
      position: { x: 0, y: size.height * 0.82, z: 0 }
    }, { parent: node });
    crownBox.visibility = 0;
    crownBox.isPickable = true;
  }
};

export const landscapeGroundCactus = {
  type: 'landscape_ground_cactus',
  name: '仙人掌丛',
  defaultSize: { width: 32, depth: 24, height: 36 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'cactus-stem', label: '仙人掌肉质茎', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const seasonKey = GROUND_CACTUS_SEASONS[item.season] ? item.season : 'summer';
    const season = GROUND_CACTUS_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeGroundCactus, item, {
      'cactus-body': season.stem
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeGroundCactus, 'cactus-stem', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const potH = size.height * 0.15;
    const pads = [
      { name: 'A1', parentName: null, pos: { x: -0.16, y: 0.28, z: 0 }, scale: { x: 0.24, y: 0.26, z: 0.05 }, rot: { x: 0.1, y: 0.2, z: 0.4 } },
      { name: 'A2', parentName: 'A1', pos: { x: -0.28, y: 0.46, z: -0.06 }, scale: { x: 0.2, y: 0.22, z: 0.045 }, rot: { x: 0.15, y: -0.3, z: 0.6 } },
      { name: 'A3', parentName: 'A1', pos: { x: -0.1, y: 0.48, z: 0.08 }, scale: { x: 0.16, y: 0.18, z: 0.04 }, rot: { x: -0.1, y: 0.4, z: 0.25 } },
      { name: 'A2_1', parentName: 'A2', pos: { x: -0.38, y: 0.62, z: -0.1 }, scale: { x: 0.14, y: 0.16, z: 0.035 }, rot: { x: 0.2, y: -0.1, z: 0.85 } },
 
      { name: 'B1', parentName: null, pos: { x: 0, y: 0.32, z: -0.04 }, scale: { x: 0.26, y: 0.28, z: 0.05 }, rot: { x: -0.1, y: 0, z: 0.05 } },
      { name: 'B2', parentName: 'B1', pos: { x: 0.08, y: 0.54, z: -0.08 }, scale: { x: 0.2, y: 0.22, z: 0.045 }, rot: { x: -0.15, y: 0.25, z: -0.2 } },
      { name: 'B3', parentName: 'B1', pos: { x: -0.08, y: 0.54, z: 0.03 }, scale: { x: 0.18, y: 0.2, z: 0.04 }, rot: { x: 0.1, y: -0.3, z: 0.2 } },
      { name: 'B2_1', parentName: 'B2', pos: { x: 0.12, y: 0.72, z: -0.12 }, scale: { x: 0.14, y: 0.15, z: 0.035 }, rot: { x: -0.2, y: 0.1, z: -0.35 } },
 
      { name: 'C1', parentName: null, pos: { x: 0.16, y: 0.28, z: 0.04 }, scale: { x: 0.24, y: 0.26, z: 0.05 }, rot: { x: -0.1, y: -0.2, z: -0.4 } },
      { name: 'C2', parentName: 'C1', pos: { x: 0.28, y: 0.46, z: 0.1 }, scale: { x: 0.19, y: 0.22, z: 0.045 }, rot: { x: -0.15, y: 0.3, z: -0.65 } },
      { name: 'C3', parentName: 'C1', pos: { x: 0.08, y: 0.48, z: -0.06 }, scale: { x: 0.16, y: 0.18, z: 0.04 }, rot: { x: 0.1, y: -0.4, z: -0.22 } },
      { name: 'C2_1', parentName: 'C2', pos: { x: 0.38, y: 0.62, z: 0.14 }, scale: { x: 0.13, y: 0.15, z: 0.035 }, rot: { x: -0.2, y: 0.1, z: -0.85 } }
    ];
 
    pads.forEach((pad) => {
      const px = pad.pos.x * size.width;
      const py = pad.pos.y * size.height - potH;
      const pz = pad.pos.z * size.depth;

      const sMesh = sphereComponent(registry, seasonalItem, landscapeGroundCactus, 'cactus-stem', {
        diameter: size.width, segments: 8
      }, {
        position: { x: px, y: py, z: pz },
        scaling: { x: pad.scale.x, y: pad.scale.y, z: pad.scale.z }
      }, { parent: node });
      
      sMesh.rotation.x = pad.rot.x;
      sMesh.rotation.y = pad.rot.y;
      sMesh.rotation.z = pad.rot.z;

      const needleCount = 5;
      for (let n = 0; n < needleCount; n++) {
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * 2 * Math.PI;
        const needleL = size.width * 0.06;
        
        const rx = Math.sin(phi) * Math.cos(theta) * pad.scale.x * size.width * 0.48;
        const ry = Math.cos(phi) * pad.scale.y * size.width * 0.48;
        const rz = Math.sin(phi) * Math.sin(theta) * pad.scale.z * size.width * 0.48;

        const needle = cylinderComponent(registry, seasonalItem, landscapeGroundCactus, 'cactus-stem', {
          diameterTop: 0, diameterBottom: size.width * 0.006, height: needleL, tessellation: 3
        }, {
          position: { x: px + rx, y: py + ry, z: pz + rz }
        }, { parent: node });
        
        needle.rotation.x = phi + pad.rot.x;
        needle.rotation.y = theta + pad.rot.y;
      }

      if (pad.name.includes('_1') || pad.name === 'A3' || pad.name === 'C3') {
        const flowerY = py + pad.scale.y * size.width * 0.45;
        sphereComponent(registry, seasonalItem, landscapeGroundCactus, 'cactus-stem', {
          diameter: size.width * 0.06, segments: 6
        }, {
          position: { x: px, y: flowerY, z: pz },
          scaling: { x: 1, y: 0.4, z: 1 }
        }, { parent: node });
      }
    });
  }
};

export const landscapeRoseBush = {
  type: 'landscape_rose_bush',
  name: '月季',
  defaultSize: { width: 36, depth: 28, height: 24 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'bush-leaves', label: '月季绿叶丛', defaultColor: '#33691e' },
    { id: 'bush-flowers', label: '盛开月季红花', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    const seasonKey = ROSE_BUSH_SEASONS[item.season] ? item.season : 'spring';
    const season = ROSE_BUSH_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeRoseBush, item, {
      'rose-foliage': season.leaves,
      'rose-flower': season.flowers
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeRoseBush, 'bush-leaves', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const stemPoints = [
      { start: { x: -0.15, y: 0.1, z: -0.1 }, end: { x: -0.22, y: 0.75, z: -0.18 } },
      { start: { x: 0.12, y: 0.1, z: 0.12 }, end: { x: 0.25, y: 0.78, z: 0.15 } },
      { start: { x: -0.05, y: 0.1, z: 0.15 }, end: { x: -0.1, y: 0.85, z: 0.08 } },
      { start: { x: 0.08, y: 0.1, z: -0.12 }, end: { x: 0.18, y: 0.82, z: -0.12 } },
      { start: { x: -0.18, y: 0.4, z: 0.05 }, end: { x: 0.22, y: 0.52, z: -0.08 } }
    ];

    stemPoints.forEach((sp, idx) => {
      const startX = sp.start.x * size.width;
      const startY = sp.start.y * size.height;
      const startZ = sp.start.z * size.depth;
      const endX = sp.end.x * size.width;
      const endY = sp.end.y * size.height;
      const endZ = sp.end.z * size.depth;

      const dx = endX - startX;
      const dy = endY - startY;
      const dz = endZ - startZ;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) + Math.PI / 2;
      const yaw = Math.atan2(dx, dz);

      const stem = cylinderComponent(registry, seasonalItem, landscapeRoseBush, 'bush-leaves', {
        diameterTop: size.width * 0.015, diameterBottom: size.width * 0.022, height: len, tessellation: 6
      }, {
        position: { x: (startX + endX) / 2, y: (startY + endY) / 2, z: (startZ + endZ) / 2 }
      }, { parent: node });
      stem.rotation.x = pitch;
      stem.rotation.y = yaw;

      const thornsCount = 3;
      for (let t = 0; t < thornsCount; t++) {
        const ratio = 0.25 + t * 0.25;
        const tx = startX + dx * ratio;
        const ty = startY + dy * ratio;
        const tz = startZ + dz * ratio;
        const thorn = cylinderComponent(registry, seasonalItem, landscapeRoseBush, 'bush-leaves', {
          diameterTop: 0, diameterBottom: size.width * 0.01, height: size.width * 0.025, tessellation: 4
        }, {
          position: { x: tx + Math.sin(t) * 0.01, y: ty, z: tz + Math.cos(t) * 0.01 }
        }, { parent: node });
        thorn.rotation.z = Math.sin(idx + t) * 1.5;
        thorn.rotation.x = Math.cos(idx + t) * 1.5;
      }
    });

    const leafCount = 18;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 2 * Math.PI) / leafCount;
      const rX = Math.cos(angle) * (0.2 + Math.random() * 0.15);
      const rZ = Math.sin(angle) * (0.2 + Math.random() * 0.15);
      const rY = 0.3 + Math.random() * 0.5;

      const leaf = sphereComponent(registry, seasonalItem, landscapeRoseBush, 'bush-leaves', {
        diameter: size.width * 0.08, segments: 6
      }, {
        position: { x: rX * size.width, y: rY * size.height, z: rZ * size.depth },
        scaling: { x: 1.3, y: 0.12, z: 0.6 }
      }, { parent: node });
      leaf.rotation.y = angle + 0.5;
      leaf.rotation.z = 0.4;
      leaf.rotation.x = 0.2;
    }

    const roses = [
      { x: -0.22, y: 0.72, z: -0.16, scale: 0.95 },
      { x: 0.24, y: 0.74, z: 0.14, scale: 1.0 },
      { x: -0.06, y: 0.82, z: 0.08, scale: 1.1 },
      { x: 0.18, y: 0.79, z: -0.12, scale: 0.9 },
      { x: -0.18, y: 0.55, z: 0.18, scale: 0.85 },
      { x: 0.22, y: 0.48, z: -0.16, scale: 0.8 },
      { x: -0.25, y: 0.42, z: -0.08, scale: 0.9 },
      { x: 0.05, y: 0.62, z: 0.22, scale: 1.05 },
      { x: 0.0, y: 0.88, z: -0.05, scale: 1.15 },
      { x: -0.12, y: 0.64, z: -0.22, scale: 0.85 },
      { x: 0.12, y: 0.58, z: 0.08, scale: 0.95 },
      { x: 0.28, y: 0.62, z: 0.22, scale: 0.75 }
    ];

    roses.forEach((rose) => {
      const rx = rose.x * size.width;
      const ry = rose.y * size.height;
      const rz = rose.z * size.depth;

      sphereComponent(registry, seasonalItem, landscapeRoseBush, 'bush-leaves', {
        diameter: size.width * 0.075 * rose.scale, segments: 6
      }, {
        position: { x: rx, y: ry, z: rz },
        scaling: { x: 1.2, y: 0.2, z: 1.2 }
      }, { parent: node });

      const outerFl = sphereComponent(registry, seasonalItem, landscapeRoseBush, 'bush-flowers', {
        diameter: size.width * 0.09 * rose.scale, segments: 8
      }, {
        position: { x: rx, y: ry + size.height * 0.01, z: rz },
        scaling: { x: 1.3, y: 0.4, z: 1.3 }
      }, { parent: node });
      outerFl.rotation.y = 0.5;

      sphereComponent(registry, seasonalItem, landscapeRoseBush, 'bush-flowers', {
        diameter: size.width * 0.065 * rose.scale, segments: 6
      }, {
        position: { x: rx, y: ry + size.height * 0.025, z: rz },
        scaling: { x: 0.9, y: 0.75, z: 0.9 }
      }, { parent: node });
    });
  }
};

export const landscapeLavenderField = {
  type: 'landscape_lavender_field',
  name: '薰衣草丛',
  defaultSize: { width: 48, depth: 36, height: 22 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'lavender-stems', label: '薰衣草花茎', defaultColor: '#43a047' },
    { id: 'lavender-spike', label: '紫色穗状花序', defaultColor: '#ba68c8' }
  ],
  build(registry, item, node, size) {
    const seasonKey = LAVENDER_FIELD_SEASONS[item.season] ? item.season : 'summer';
    const season = LAVENDER_FIELD_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeLavenderField, item, {
      'lavender-foliage': season.stems,
      'lavender-blossom': season.spike
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeLavenderField, 'lavender-spike', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const count = 14;
    const scene = node.getScene();
    
    for (let i = 0; i < count; i++) {
      const theta = i * 2.39996;
      const r = Math.sqrt(i / (count - 1)) * 0.35;
      const px = Math.cos(theta) * r * size.width;
      const pz = Math.sin(theta) * r * size.depth;
      
      const distSq = (px * px) / (size.width * size.width) + (pz * pz) / (size.depth * size.depth);
      const py = (1 - distSq) * size.height * 0.05;

      const clusterNode = new BABYLON.TransformNode(`lavender_cluster_${i}`, scene);
      clusterNode.parent = node;
      clusterNode.position = new BABYLON.Vector3(px, py, pz);

      const tiltAngle = r * 0.4;
      const angleY = Math.atan2(px, pz);
      clusterNode.rotation.y = angleY;
      clusterNode.rotation.x = tiltAngle;

      const stemsCount = 3;
      for (let j = 0; j < stemsCount; j++) {
        const localX = (Math.random() - 0.5) * size.width * 0.03;
        const localZ = (Math.random() - 0.5) * size.depth * 0.03;
        const stalkH = size.height * (0.45 + Math.random() * 0.15);
        const stalkD = 0.015 * size.width;

        const stem = cylinderComponent(registry, seasonalItem, landscapeLavenderField, 'lavender-stems', {
          diameterTop: stalkD * 0.7, diameterBottom: stalkD, height: stalkH, tessellation: 6
        }, { position: { x: localX, y: stalkH / 2, z: localZ } }, { parent: clusterNode });
        stem.rotation.z = (Math.random() - 0.5) * 0.15;
        stem.rotation.x = (Math.random() - 0.5) * 0.15;

        const spikeStart = stalkH;
        const segmentCount = 3;
        const segmentH = size.height * 0.09;
        const maxSpikeD = stalkD * 2.2;
        
        for (let k = 0; k < segmentCount; k++) {
          const segY = spikeStart + k * segmentH * 0.85;
          const scaleFactor = 1 - k * 0.25;
          const segD = maxSpikeD * scaleFactor;
          
          const spikeSeg = cylinderComponent(registry, seasonalItem, landscapeLavenderField, 'lavender-spike', {
            diameterTop: segD * 0.6, diameterBottom: segD, height: segmentH, tessellation: 6
          }, { position: { x: localX, y: segY + segmentH / 2, z: localZ } }, { parent: clusterNode });
          spikeSeg.rotation.y = k * 1.2;
        }
      }
    }
  }
};

export const landscapeSunflowerPatch = {
  type: 'landscape_sunflower_patch',
  name: '向日葵丛',
  defaultSize: { width: 40, depth: 28, height: 48 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'sunflower-stem', label: '向日葵花茎', defaultColor: SUNFLOWER_PATCH_SEASONS.summer.stem },
    { id: 'sunflower-head', label: '金黄向阳花盘', defaultColor: '#ffeb3b' },
    { id: 'sunflower-core', label: '黑褐花蕊芯', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    const seasonKey = SUNFLOWER_PATCH_SEASONS[item.season] ? item.season : 'summer';
    const season = SUNFLOWER_PATCH_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeSunflowerPatch, item, {
      'sunflower-stem': season.stem,
      'sunflower-petal': season.head,
      'sunflower-center': season.core
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeSunflowerPatch, 'sunflower-head', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const scene = node.getScene();
    const cols = 3;
    const rows = 3;
    let sunflowerIdx = 0;
    
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const pctX = (c - (cols - 1) / 2) / (cols - 1 || 1);
        const pctZ = (r - (rows - 1) / 2) / (rows - 1 || 1);
        
        const jitterX = (Math.random() - 0.5) * 0.25;
        const jitterZ = (Math.random() - 0.5) * 0.25;
        const px = (pctX + jitterX) * size.width * 0.38;
        const pz = (pctZ + jitterZ) * size.depth * 0.38;
        const stemH = size.height * (0.75 + Math.random() * 0.2);
        
        const stem = cylinderComponent(registry, seasonalItem, landscapeSunflowerPatch, 'sunflower-stem', {
          diameterTop: size.width * 0.02, diameterBottom: size.width * 0.035, height: stemH, tessellation: 8
        }, { position: { x: px, y: stemH / 2, z: pz } }, { parent: node });
        stem.rotation.x = (Math.random() - 0.5) * 0.08;
        stem.rotation.z = (Math.random() - 0.5) * 0.08;
        
        for (let l = 0; l < 2; l++) {
          const leafY = stemH * (0.35 + l * 0.25);
          const leafRot = l * Math.PI * 0.7 + Math.random() * 0.2;
          const leafL = size.width * 0.15;
          
          const leaf = sphereComponent(registry, seasonalItem, landscapeSunflowerPatch, 'sunflower-stem', {
            diameter: leafL, segments: 6
          }, { position: { x: px, y: leafY, z: pz } }, { parent: node });
          leaf.scaling = new BABYLON.Vector3(1, 0.1, 0.4);
          leaf.rotation.y = leafRot;
          leaf.rotation.z = 0.35 * (l === 0 ? 1 : -1);
          leaf.rotation.x = 0.2;
        }

        const headNode = new BABYLON.TransformNode(`sunflower_head_${sunflowerIdx++}`, scene);
        headNode.parent = node;
        headNode.position = new BABYLON.Vector3(px, stemH, pz);
        
        // 统一朝向前侧，并且加入极细微的自然扰动，实现宏观朝向完全一致
        const yaw = 0.25 + (Math.random() - 0.5) * 0.12;
        const pitch = Math.PI * 0.22 + (Math.random() - 0.5) * 0.06;
        headNode.rotation.y = yaw;
        headNode.rotation.x = -pitch;

        const headRadius = size.width * 0.11;
        const headBase = cylinderComponent(registry, seasonalItem, landscapeSunflowerPatch, 'sunflower-head', {
          diameterTop: headRadius * 2, diameterBottom: headRadius * 2, height: size.width * 0.02, tessellation: 12
        }, { position: { x: 0, y: 0, z: 0 } }, { parent: headNode });
        headBase.rotation.x = Math.PI / 2;

        const coreRadius = headRadius * 0.55;
        const core = cylinderComponent(registry, seasonalItem, landscapeSunflowerPatch, 'sunflower-core', {
          diameterTop: coreRadius * 2, diameterBottom: coreRadius * 2, height: size.width * 0.022, tessellation: 12
        }, { position: { x: 0, y: 0, z: size.width * 0.005 } }, { parent: headNode });
        core.rotation.x = Math.PI / 2;

        // const petalCount = 12;
        // const petalL = headRadius * 0.7;
        // const petalW = headRadius * 0.25;
        
        // for (let p = 0; p < petalCount; p++) {
        //   const angle = (p * Math.PI * 2) / petalCount;
        //   const petal = sphereComponent(registry, seasonalItem, landscapeSunflowerPatch, 'sunflower-head', {
        //     diameter: petalL, segments: 6
        //   }, { position: { 
        //     x: Math.cos(angle) * headRadius * 0.95, 
        //     y: Math.sin(angle) * headRadius * 0.95, 
        //     z: -size.width * 0.002 
        //   } }, { parent: headNode });
          
        //   petal.scaling = new BABYLON.Vector3(1, 0.15, petalW / petalL);
        //   petal.rotation.z = angle;
        //   petal.rotation.y = 0.25;
        // }
      }
    }
  }
};

export const landscapeReedMarsh = {
  type: 'landscape_reed_marsh',
  name: '芦苇',
  defaultSize: { width: 44, depth: 24, height: 72 },
  defaultSeason: 'autumn',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'reed-culm', label: '纤细芦苇杆', defaultColor: '#d7ccc8' },
    { id: 'reed-plume', label: '绒毛花穗', defaultColor: REED_MARSH_SEASONS.autumn.plume }
  ],
  build(registry, item, node, size) {
    const seasonKey = REED_MARSH_SEASONS[item.season] ? item.season : 'autumn';
    const season = REED_MARSH_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeReedMarsh, item, {
      'reed-stem': season.culm,
      'reed-plume': season.plume
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeReedMarsh, 'reed-plume', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const scene = node.getScene();

    const count = 15;
    for (let i = 0; i < count; i++) {
      const px = (Math.random() - 0.5) * size.width * 0.85;
      const pz = (Math.random() - 0.5) * size.depth * 0.85;
      
      const plantH = size.height * (0.72 + Math.random() * 0.28);
      const stemH = plantH * 0.78;
      const plumeH = plantH * 0.22;
      const stemD = size.width * 0.012;

      const reedNode = new BABYLON.TransformNode(`reed_${i}`, scene);
      reedNode.parent = node;
      reedNode.position = new BABYLON.Vector3(px, 0, pz);
      reedNode.rotation.x = (Math.random() - 0.5) * 0.18;
      reedNode.rotation.z = (Math.random() - 0.5) * 0.18;
      reedNode.rotation.y = Math.random() * Math.PI * 2;

      cylinderComponent(registry, seasonalItem, landscapeReedMarsh, 'reed-culm', {
        diameterTop: stemD * 0.6, diameterBottom: stemD, height: stemH, tessellation: 6
      }, { position: { x: 0, y: stemH / 2, z: 0 } }, { parent: reedNode });

      for (let l = 0; l < 2; l++) {
        const leafH = stemH * (0.35 + l * 0.15);
        const leaf = sphereComponent(registry, seasonalItem, landscapeReedMarsh, 'reed-culm', {
          diameter: leafH, segments: 6
        }, { position: { x: 0, y: stemH * (0.3 + l * 0.2), z: 0 } }, { parent: reedNode });
        
        leaf.scaling = new BABYLON.Vector3(0.06, 1, 0.15);
        leaf.rotation.z = 0.4 + Math.random() * 0.2;
        leaf.rotation.y = l * Math.PI * 0.8 + Math.random() * 0.5;
      }

      const plumeCenterY = stemH + plumeH / 2;
      const plumeRadius = stemD * 2.5;

      for (let p = 0; p < 3; p++) {
        const segPlume = sphereComponent(registry, seasonalItem, landscapeReedMarsh, 'reed-plume', {
          diameter: plumeH, segments: 8
        }, { position: { x: 0, y: plumeCenterY, z: 0 } }, { parent: reedNode });
        
        segPlume.scaling = new BABYLON.Vector3(plumeRadius / plumeH, 1, (plumeRadius * 0.85) / plumeH);
        segPlume.rotation.y = p * 1.1;
        segPlume.rotation.x = (Math.random() - 0.5) * 0.12;
        segPlume.rotation.z = (Math.random() - 0.5) * 0.12;
      }
    }
  }
};

export const landscapeBananaLeafSingle = {
  type: 'landscape_banana_leaf_single',
  name: '芭蕉',
  defaultSize: { width: 36, depth: 36, height: 64 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'leaf-stem', label: '芭蕉柄茎', defaultColor: '#7cb342' },
    { id: 'leaf-blade', label: '油亮大芭蕉叶', defaultColor: '#558b2f' }
  ],
  build(registry, item, node, size) {
    const seasonKey = BANANA_LEAF_SINGLE_SEASONS[item.season] ? item.season : 'summer';
    const season = BANANA_LEAF_SINGLE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeBananaLeafSingle, item, {
      'banana-leaf': season.blade
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeBananaLeafSingle, 'leaf-blade', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const stemParts = 8;
    const partH = size.height / stemParts;
    let curPos = { x: 0, y: 0, z: 0 };
    let angleZ = -0.06;

    for (let i = 0; i < stemParts; i++) {
      angleZ += 0.048;
      
      const dx = Math.sin(-angleZ) * (partH / 2);
      const dy = Math.cos(-angleZ) * (partH / 2);
      
      const cX = curPos.x + dx;
      const cY = curPos.y + dy;
      const cZ = curPos.z;
      
      const dBot = size.width * (0.038 - i * 0.0035);
      const dTop = size.width * (0.038 - (i + 1) * 0.0035);
      
      const pulse = cylinderComponent(registry, seasonalItem, landscapeBananaLeafSingle, 'leaf-stem', {
        diameterTop: dTop, diameterBottom: dBot, height: partH, tessellation: 8
      }, { position: { x: cX, y: cY, z: cZ } }, { parent: node });
      
      pulse.rotation.z = angleZ;
      
      if (i >= 1) {
        const progress = (i - 1) / (stemParts - 2);
        const leafW = size.width * 0.52 * Math.sin(progress * Math.PI);
        const leafT = 0.0025;
        const leafL = partH * 0.94;
        
        const cupAngle = 0.18 + (1.0 - Math.sin(progress * Math.PI)) * 0.24;
        const waveRotate = 0.08 * Math.sin(i * 1.6);
        
        [-1, 1].forEach((sideSign) => {
          const halfW = leafW / 2;
          
          const sX = Math.cos(-angleZ) * sideSign * (halfW / 2);
          const sY = -Math.sin(-angleZ) * sideSign * (halfW / 2);
          
          const px = cX + sX;
          const py = cY + sY + (halfW * 0.11);
          const pz = cZ + sideSign * 0.03 * leafW;
          
          const bladePart = boxComponent(registry, seasonalItem, landscapeBananaLeafSingle, 'leaf-blade', {
            width: halfW, height: leafT, depth: leafL
          }, { position: { x: px, y: py, z: pz } }, { parent: node });
          
          bladePart.rotation.z = angleZ + sideSign * cupAngle + waveRotate;
          bladePart.rotation.y = sideSign * 0.06 + waveRotate;
          bladePart.rotation.x = waveRotate;
        });
      }
      
      curPos.x += dx * 2;
      curPos.y += dy * 2;
    }
  }
};

export const landscapeGrassLawn = {
  type: 'landscape_grass_lawn',
  name: '草坪',
  defaultSize: { width: 96, depth: 96, height: 1.5 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'lawn-grass', label: '剪绒青草', defaultColor: '#558b2f' }
  ],
  build(registry, item, node, size) {
    const scene = node.getScene();
    const seasonKey = GRASS_LAWN_SEASONS[item.season] ? item.season : 'spring';
    const season = GRASS_LAWN_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeGrassLawn, item, {
      'grass-blades': season.grass
    });
    boxComponent(registry, seasonalItem, landscapeGrassLawn, 'lawn-grass', {
      width: size.width, height: size.height * 0.5, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.25, z: 0 } }, { parent: node });

    const grassCount = 16;
    for (let g = 0; g < grassCount; g++) {
      const px = (Math.random() - 0.5) * size.width * 0.9;
      const pz = (Math.random() - 0.5) * size.depth * 0.9;
      const py = size.height * 0.5;

      const grassNode = new BABYLON.TransformNode(`grass_tuft_${g}`, scene);
      grassNode.parent = node;
      grassNode.position = new BABYLON.Vector3(px, py, pz);
      grassNode.rotation.y = Math.random() * Math.PI * 2;

      const bladesCount = 3 + Math.floor(Math.random() * 2);
      const tuftHeight = size.height * (2.5 + Math.random() * 2.5);

      for (let b = 0; b < bladesCount; b++) {
        const angle = (b * Math.PI * 2) / bladesCount + (Math.random() - 0.5) * 0.3;
        
        const bladeW = size.width * 0.015;
        const bladeH = tuftHeight * (0.8 + Math.random() * 0.3);
        const bladeD = bladeW * 0.2;

        const blade = sphereComponent(registry, seasonalItem, landscapeGrassLawn, 'lawn-grass', {
          diameter: bladeH, segments: 6
        }, { position: { 
          x: Math.cos(angle) * bladeW * 0.3, 
          y: bladeH * 0.45, 
          z: Math.sin(angle) * bladeW * 0.3 
        } }, { parent: grassNode });

        blade.scaling = new BABYLON.Vector3(bladeW / bladeH, 1, bladeD / bladeH);
        blade.rotation.y = -angle;
        blade.rotation.z = 0.25 + Math.random() * 0.25;
        blade.rotation.x = (Math.random() - 0.5) * 0.1;
      }
    }
  }
};

export const landscapeMossPath = {
  type: 'landscape_moss_path',
  name: '石板路',
  defaultSize: { width: 72, depth: 24, height: 2 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'moss-base', label: '翠绿苔藓地', defaultColor: MOSS_PATH_SEASONS.spring.base },
    { id: 'moss-slates', label: '错落石板', defaultColor: '#4f5d65' }
  ],
  build(registry, item, node, size) {
    const scene = node.getScene();
    const seasonKey = MOSS_PATH_SEASONS[item.season] ? item.season : 'spring';
    const season = MOSS_PATH_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeMossPath, item, {
      'moss-base': season.base,
      'moss-patch': season.slates
    });
    boxComponent(registry, seasonalItem, landscapeMossPath, 'moss-base', {
      width: size.width, height: size.height * 0.3, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.15, z: 0 } }, { parent: node });

    const slates = [
      { x: -size.width * 0.35, z: -size.depth * 0.12, w: size.width * 0.22, d: size.depth * 0.75, rot: -0.1 },
      { x: -size.width * 0.12, z: size.depth * 0.1,  w: size.width * 0.24, d: size.depth * 0.78, rot: 0.15 },
      { x: size.width * 0.12,  z: -size.depth * 0.08, w: size.width * 0.23, d: size.depth * 0.76, rot: -0.08 },
      { x: size.width * 0.36,  z: size.depth * 0.12,  w: size.width * 0.22, d: size.depth * 0.74, rot: 0.08 }
    ];

    slates.forEach((sl, idx) => {
      const slateNode = new BABYLON.TransformNode(`slate_assembly_${idx}`, scene);
      slateNode.parent = node;
      slateNode.position = new BABYLON.Vector3(sl.x, size.height * 0.35, sl.z);
      slateNode.rotation.y = sl.rot;

      boxComponent(registry, seasonalItem, landscapeMossPath, 'moss-slates', {
        width: sl.w, height: size.height * 0.7, depth: sl.d
      }, { position: { x: 0, y: size.height * 0.35, z: 0 } }, { parent: slateNode });

      const sideSlate = boxComponent(registry, seasonalItem, landscapeMossPath, 'moss-slates', {
        width: sl.w * 0.85, height: size.height * 0.69, depth: sl.d * 0.95
      }, { position: { x: sl.w * 0.05, y: size.height * 0.34, z: sl.d * 0.02 } }, { parent: slateNode });
      sideSlate.rotation.y = 0.2;
    });

    const mossSpots = [
      { x: -size.width * 0.24, z: size.depth * 0.05, rx: size.width * 0.08, rz: size.depth * 0.22 },
      { x: -size.width * 0.23, z: -size.depth * 0.3,  rx: size.width * 0.07, rz: size.depth * 0.18 },
      { x: 0,                  z: -size.depth * 0.15, rx: size.width * 0.1,  rz: size.depth * 0.24 },
      { x: -size.width * 0.02, z: size.depth * 0.28,  rx: size.width * 0.07, rz: size.depth * 0.2 },
      { x: size.width * 0.24,  z: size.depth * 0.05,  rx: size.width * 0.08, rz: size.depth * 0.2 },
      { x: size.width * 0.25,  z: -size.depth * 0.32, rx: size.width * 0.06, rz: size.depth * 0.15 },
      { x: -size.width * 0.45, z: size.depth * 0.2,   rx: size.width * 0.08, rz: size.depth * 0.25 },
      { x: size.width * 0.46,  z: -size.depth * 0.2,  rx: size.width * 0.09, rz: size.depth * 0.23 },
      { x: -size.width * 0.05, z: -size.depth * 0.4,  rx: size.width * 0.09, rz: size.depth * 0.18 },
      { x: size.width * 0.08,  z: size.depth * 0.42,  rx: size.width * 0.08, rz: size.depth * 0.2 },
      { x: -size.width * 0.25, z: size.depth * 0.08, rx: size.width * 0.05, rz: size.depth * 0.15 },
      { x: size.width * 0.23,  z: -size.depth * 0.02, rx: size.width * 0.05, rz: size.depth * 0.15 }
    ];

    mossSpots.forEach((ms, idx) => {
      const mossSpot = sphereComponent(registry, seasonalItem, landscapeMossPath, 'moss-base', {
        diameter: ms.rx * 2, segments: 8
      }, { position: { x: ms.x, y: size.height * 0.4, z: ms.z } }, { parent: node });

      const scaleY = 0.03 + (idx % 3) * 0.015;
      mossSpot.scaling = new BABYLON.Vector3(1, scaleY, ms.rz / ms.rx);
      mossSpot.rotation.y = idx * 1.7;
    });
  }
};

export const landscapeDandelionPatch = {
  type: 'landscape_dandelion_patch',
  name: '蒲公英',
  defaultSize: { width: 36, depth: 24, height: 18 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'dandelion-leaves', label: '蓬乱杂草地', defaultColor: '#689f38' },
    { id: 'dandelion-puff', label: '绒毛白色果球', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const seasonKey = DANDELION_PATCH_SEASONS[item.season] ? item.season : 'spring';
    const season = DANDELION_PATCH_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeDandelionPatch, item, {
      'dandelion-foliage': season.leaves,
      'dandelion-flower': season.puff
    });
    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-leaves', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const scene = node.getScene();

    const leafClusters = [
      { x: -size.width * 0.2, z: -size.depth * 0.1 },
      { x: size.width * 0.18, z: size.depth * 0.12 }
    ];

    leafClusters.forEach((lc, idx) => {
      const leafCount = 6;
      for (let l = 0; l < leafCount; l++) {
        const angle = (l * Math.PI * 2) / leafCount + idx * 0.5;
        const leafL = size.width * 0.28;
        const leafW = size.width * 0.08;
        
        const leaf = boxComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-leaves', {
          width: leafL, height: size.height * 0.02, depth: leafW
        }, { position: { x: lc.x + Math.cos(angle) * leafL * 0.4, y: size.height * 0.01, z: lc.z + Math.sin(angle) * leafL * 0.4 } }, { parent: node });
        
        leaf.rotation.y = -angle;
        leaf.rotation.x = 0.08;
      }
    });

    const puffs = [
      { x: -size.width * 0.2, z: -size.depth * 0.1, h: size.height * 0.8 },
      { x: size.width * 0.18, z: size.depth * 0.12, h: size.height * 0.95 },
      { x: size.width * 0.02, z: -size.depth * 0.22, h: size.height * 0.7 }
    ];

    puffs.forEach((pf, idx) => {
      const stem = cylinderComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-leaves', {
        diameterTop: size.width * 0.01, diameterBottom: size.width * 0.015, height: pf.h, tessellation: 6
      }, { position: { x: pf.x, y: pf.h / 2, z: pf.z } }, { parent: node });
      stem.rotation.z = (Math.random() - 0.5) * 0.15;
      stem.rotation.x = (Math.random() - 0.5) * 0.15;

      const hx = pf.x + Math.sin(stem.rotation.z) * pf.h * 0.5;
      const hz = pf.z - Math.sin(stem.rotation.x) * pf.h * 0.5;
      const hy = pf.h;

      const puffNode = new BABYLON.TransformNode(`puff_${idx}`, scene);
      puffNode.parent = node;
      puffNode.position = new BABYLON.Vector3(hx, hy, hz);

      const coreR = size.width * 0.035;
      sphereComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-puff', {
        diameter: coreR, segments: 6
      }, { position: { x: 0, y: 0, z: 0 } }, { parent: puffNode });

      const spokeCount = 16;
      const spokeL = size.width * 0.07;
      
      for (let s = 0; s < spokeCount; s++) {
        const phi = Math.acos(-1 + (2 * s) / spokeCount);
        const theta = Math.sqrt(spokeCount * Math.PI) * phi;

        const dx = Math.sin(phi) * Math.cos(theta);
        const dy = Math.sin(phi) * Math.sin(theta);
        const dz = Math.cos(phi);

        const spoke = cylinderComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-puff', {
          diameterTop: size.width * 0.003, diameterBottom: size.width * 0.003, height: spokeL, tessellation: 4
        }, { position: { x: dx * spokeL * 0.5, y: dy * spokeL * 0.5, z: dz * spokeL * 0.5 } }, { parent: puffNode });
        spoke.lookAt(new BABYLON.Vector3(dx * 10, dy * 10, dz * 10));
        spoke.rotation.x += Math.PI / 2;

        sphereComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-puff', {
          diameter: size.width * 0.012, segments: 4
        }, { position: { x: dx * spokeL, y: dy * spokeL, z: dz * spokeL } }, { parent: puffNode });
      }
    });

    const flowers = [
      { x: -size.width * 0.1, z: size.depth * 0.22, h: size.height * 0.6 },
      { x: size.width * 0.25, z: -size.depth * 0.15, h: size.height * 0.65 },
      { x: -size.width * 0.32, z: -size.depth * 0.25, h: size.height * 0.52 },
      { x: 0.1, z: -size.depth * 0.05, h: size.height * 0.72 }
    ];

    flowers.forEach((fl, idx) => {
      const stem = cylinderComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-leaves', {
        diameterTop: size.width * 0.01, diameterBottom: size.width * 0.015, height: fl.h, tessellation: 6
      }, { position: { x: fl.x, y: fl.h / 2, z: fl.z } }, { parent: node });
      stem.rotation.z = (Math.random() - 0.5) * 0.18;
      stem.rotation.x = (Math.random() - 0.5) * 0.18;

      const hx = fl.x + Math.sin(stem.rotation.z) * fl.h * 0.5;
      const hz = fl.z - Math.sin(stem.rotation.x) * fl.h * 0.5;
      const hy = fl.h;

      const flNode = new BABYLON.TransformNode(`flower_${idx}`, scene);
      flNode.parent = node;
      flNode.position = new BABYLON.Vector3(hx, hy, hz);
      flNode.rotation.x = 0.2;
      flNode.rotation.y = Math.random() * Math.PI;

      const layers = 3;
      const flD = size.width * 0.09;
      
      for (let y = 0; y < layers; y++) {
        const layD = flD * (1 - y * 0.12);
        const flDisk = cylinderComponent(registry, seasonalItem, landscapeDandelionPatch, 'dandelion-puff', {
          diameterTop: layD, diameterBottom: layD, height: size.height * 0.02, tessellation: 8
        }, { position: { x: 0, y: y * size.height * 0.015, z: 0 } }, { parent: flNode });
        flDisk.rotation.y = y * 0.6;
      }
    });
  }
};

export const landscapeMorningGloryFence = {
  type: 'landscape_morning_glory_fence',
  name: '竹篱',
  defaultSize: { width: 72, depth: 8, height: 36 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'fence-bamboo', label: '编织竹篱架', defaultColor: '#d7ccc8' },
    { id: 'fence-vines', label: '绿油蔓藤', defaultColor: '#4caf50' },
    { id: 'fence-blooms', label: '朝开喇叭花', defaultColor: '#7c4dff' }
  ],
  build(registry, item, node, size) {
    const seasonKey = MORNING_GLORY_FENCE_SEASONS[item.season] ? item.season : 'summer';
    const season = MORNING_GLORY_FENCE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeMorningGloryFence, item, {
      'morning-glory-leaves': season.vines,
      'morning-glory-flowers': season.blooms
    });
    const postW = size.width * 0.04;
    [-0.45, -0.15, 0.15, 0.45].forEach((ratio) => {
      boxComponent(registry, seasonalItem, landscapeMorningGloryFence, 'fence-bamboo', {
        width: postW, height: size.height, depth: size.depth * 0.6
      }, { position: { x: ratio * size.width, y: size.height / 2, z: 0 } }, { parent: node });
    });

    [-0.32, 0, 0.32].forEach((ratio) => {
      boxComponent(registry, seasonalItem, landscapeMorningGloryFence, 'fence-bamboo', {
        width: size.width, height: postW, depth: size.depth * 0.5
      }, { position: { x: 0, y: size.height * 0.5 + ratio * size.height * 0.8, z: 0 } }, { parent: node });
    });

    boxComponent(registry, seasonalItem, landscapeMorningGloryFence, 'fence-vines', {
      width: size.width * 0.88, height: size.height * 0.65, depth: size.depth * 0.8
    }, { position: { x: 0, y: size.height * 0.52, z: 0.01 } }, { parent: node });

    const bloomPos = [
      { x: -size.width * 0.22, y: size.height * 0.62 },
      { x: size.width * 0.15, y: size.height * 0.72 },
      { x: -size.width * 0.02, y: size.height * 0.36 }
    ];
    bloomPos.forEach((bp) => {
      sphereComponent(registry, seasonalItem, landscapeMorningGloryFence, 'fence-blooms', {
        diameter: size.width * 0.07, segments: 6
      }, { position: { x: bp.x, y: bp.y, z: 0.03 } }, { parent: node });
    });
  }
};

export const landscapeHydrangeaBush = {
  type: 'landscape_hydrangea_bush',
  name: '绣球花',
  defaultSize: { width: 32, depth: 32, height: 26 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'hydrangea-foliage', label: '油亮大叶丛', defaultColor: HYDRANGEA_BUSH_SEASONS.summer.foliage },
    { id: 'hydrangea-blooms', label: '团团团花簇', defaultColor: HYDRANGEA_BUSH_SEASONS.summer.blooms }
  ],
  build(registry, item, node, size) {
    const seasonKey = HYDRANGEA_BUSH_SEASONS[item.season] ? item.season : 'summer';
    const season = HYDRANGEA_BUSH_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeHydrangeaBush, item, {
      'hydrangea-foliage': season.foliage,
      'hydrangea-blooms': season.blooms
    });
    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeHydrangeaBush, 'hydrangea-foliage', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const leafCount = 9;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 2 * Math.PI) / leafCount;
      const lx = Math.cos(angle) * size.width * 0.25;
      const lz = Math.sin(angle) * size.depth * 0.25;
      const ly = size.height * 0.15 + Math.sin(i * 3) * 0.02;

      const leaf = sphereComponent(registry, seasonalItem, landscapeHydrangeaBush, 'hydrangea-foliage', {
        diameter: size.width * 0.38, segments: 8
      }, {
        position: { x: lx, y: ly, z: lz },
        scaling: { x: 0.45, y: 0.08, z: 1.3 }
      }, { parent: node });
      leaf.rotation.y = -angle;
      leaf.rotation.x = 0.3;
    }

    const hydrangeaClusters = [
      { x: -0.22, y: 0.7, z: -0.15, sizeMult: 1.05 },
      { x: 0.2, y: 0.65, z: -0.18, sizeMult: 0.95 },
      { x: -0.18, y: 0.75, z: 0.18, sizeMult: 1.0 },
      { x: 0.16, y: 0.72, z: 0.2, sizeMult: 0.9 },
      { x: 0, y: 0.85, z: -0.02, sizeMult: 1.1 },
      { x: -0.02, y: 0.58, z: -0.26, sizeMult: 0.85 },
      { x: 0.05, y: 0.78, z: 0.12, sizeMult: 1.0 }
    ];

    hydrangeaClusters.forEach((hc) => {
      const fx = hc.x * size.width;
      const fy = hc.y * size.height;
      const fz = hc.z * size.depth;

      const startX = 0;
      const startY = size.height * 0.15;
      const startZ = 0;
      const dx = fx - startX;
      const dy = (fy - size.height * 0.08) - startY;
      const dz = fz - startZ;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      const pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) + Math.PI / 2;
      const yaw = Math.atan2(dx, dz);

      const stem = cylinderComponent(registry, seasonalItem, landscapeHydrangeaBush, 'hydrangea-foliage', {
        diameterTop: size.width * 0.016, diameterBottom: size.width * 0.024, height: len, tessellation: 6
      }, {
        position: { x: (startX + fx) / 2, y: (startY + (fy - size.height * 0.08)) / 2, z: (startZ + fz) / 2 }
      }, { parent: node });
      stem.rotation.x = pitch;
      stem.rotation.y = yaw;

      const centerD = size.width * 0.16 * hc.sizeMult;
      const subD = size.width * 0.11 * hc.sizeMult;

      sphereComponent(registry, seasonalItem, landscapeHydrangeaBush, 'hydrangea-blooms', {
        diameter: centerD, segments: 8
      }, { position: { x: fx, y: fy, z: fz } }, { parent: node });

      const offsets = [
        { dx: 0.05, dy: 0.01, dz: 0 },
        { dx: -0.05, dy: 0.01, dz: 0 },
        { dx: 0, dy: -0.02, dz: 0.05 },
        { dx: 0, dy: 0.02, dz: -0.05 }
      ];
      offsets.forEach((off) => {
        sphereComponent(registry, seasonalItem, landscapeHydrangeaBush, 'hydrangea-blooms', {
          diameter: subD, segments: 6
        }, {
          position: {
            x: fx + off.dx * size.width * hc.sizeMult,
            y: fy + off.dy * size.height * hc.sizeMult,
            z: fz + off.dz * size.depth * hc.sizeMult
          }
        }, { parent: node });
      });
    });
  }
};

export const landscapeTulipField = {
  type: 'landscape_tulip_field',
  name: '郁金香丛',
  defaultSize: { width: 44, depth: 32, height: 20 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'tulip-leaves', label: '丛生绿叶草甸', defaultColor: TULIP_FIELD_SEASONS.spring.leaves },
    { id: 'tulip-flowers', label: '郁金香彩朵', defaultColor: '#eb6d86' }
  ],
  build(registry, item, node, size) {
    const seasonKey = TULIP_FIELD_SEASONS[item.season] ? item.season : 'spring';
    const season = TULIP_FIELD_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeTulipField, item, {
      'tulip-leaves': season.leaves,
      'tulip-blooms': season.flowers
    });

    // 隐形碰撞箱
    const hitbox = boxComponent(registry, seasonalItem, landscapeTulipField, 'tulip-flowers', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    const scene = node.getScene();

    const count = 16;
    for (let i = 0; i < count; i++) {
      const theta = i * 2.39996;
      const r = Math.sqrt(i / (count - 1)) * 0.4;
      const px = Math.cos(theta) * r * size.width;
      const pz = Math.sin(theta) * r * size.depth;

      const distSq = (px * px) / (size.width * size.width) + (pz * pz) / (size.depth * size.depth);
      const py = (1 - distSq) * size.height * 0.04;

      const tulipNode = new BABYLON.TransformNode(`tulip_plant_${i}`, scene);
      tulipNode.parent = node;
      tulipNode.position = new BABYLON.Vector3(px, py, pz);
      tulipNode.rotation.y = Math.random() * Math.PI * 2;
      tulipNode.rotation.x = (Math.random() - 0.5) * 0.15;
      tulipNode.rotation.z = (Math.random() - 0.5) * 0.15;

      const stalkH = size.height * (0.45 + Math.random() * 0.2);
      const stalkD = size.width * 0.015;

      cylinderComponent(registry, seasonalItem, landscapeTulipField, 'tulip-leaves', {
        diameterTop: stalkD, diameterBottom: stalkD, height: stalkH, tessellation: 6
      }, { position: { x: 0, y: stalkH / 2, z: 0 } }, { parent: tulipNode });

      for (let l = 0; l < 2; l++) {
        const leafAngle = l * Math.PI + (Math.random() - 0.5) * 0.4;
        const leafH = stalkH * (0.6 + Math.random() * 0.35);
        
        const leaf = sphereComponent(registry, seasonalItem, landscapeTulipField, 'tulip-leaves', {
          diameter: leafH, segments: 6
        }, { position: { 
          x: Math.cos(leafAngle) * stalkD * 0.8, 
          y: leafH * 0.4, 
          z: Math.sin(leafAngle) * stalkD * 0.8 
        } }, { parent: tulipNode });

        leaf.scaling = new BABYLON.Vector3(0.12, 1, 0.3);
        leaf.rotation.y = -leafAngle;
        leaf.rotation.z = 0.3 + Math.random() * 0.2;
      }

      const flowerY = stalkH;
      const flowerH = size.height * 0.22;
      const flowerW = size.width * 0.075;

      const petal1 = sphereComponent(registry, seasonalItem, landscapeTulipField, 'tulip-flowers', {
        diameter: flowerH, segments: 8
      }, { position: { x: 0, y: flowerY + flowerH * 0.35, z: -flowerW * 0.1 } }, { parent: tulipNode });
      petal1.scaling = new BABYLON.Vector3(flowerW / flowerH, 1, (flowerW * 0.9) / flowerH);
      petal1.rotation.x = 0.08;

      const petal2 = sphereComponent(registry, seasonalItem, landscapeTulipField, 'tulip-flowers', {
        diameter: flowerH * 0.98, segments: 8
      }, { position: { x: 0, y: flowerY + flowerH * 0.35, z: flowerW * 0.1 } }, { parent: tulipNode });
      petal2.scaling = new BABYLON.Vector3(flowerW / flowerH, 0.96, (flowerW * 0.9) / flowerH);
      petal2.rotation.y = Math.PI * 0.5;
      petal2.rotation.x = 0.08;
    }
  }
};

export const landscapeLarchTree = {
  type: 'landscape_larch_tree',
  name: '落叶松',
  defaultSize: { width: 36, depth: 36, height: 96 },
  defaultSeason: 'autumn',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'larch-trunk', label: '红棕松树干', defaultColor: LARCH_TREE_SEASONS.autumn.trunk },
    { id: 'larch-foliage', label: '松针塔叶', defaultColor: LARCH_TREE_SEASONS.autumn.foliage }
  ],
  build(registry, item, node, size) {
    const seasonKey = LARCH_TREE_SEASONS[item.season] ? item.season : 'autumn';
    const season = LARCH_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeLarchTree, item, {
      'larch-trunk': season.trunk,
      'larch-foliage': season.foliage
    });
    // 1. 笔直挺拔的主干
    cylinderComponent(registry, seasonalItem, landscapeLarchTree, 'larch-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.08, height: size.height, tessellation: 10
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 层层轮生斜向上微翘的放射状松枝
    const layers = 6;
    for (let i = 0; i < layers; i++) {
      const ratio = i / (layers - 1);
      const layerY = size.height * (0.26 + ratio * 0.62);
      const branchLen = size.width * (0.46 - ratio * 0.38);
      const branchCount = 6;

      for (let j = 0; j < branchCount; j++) {
        const angle = (j * 2 * Math.PI) / branchCount + ratio * 0.5;
        const tilt = 0.24;

        const bx = Math.cos(angle) * (branchLen * 0.42);
        const bz = Math.sin(angle) * (branchLen * 0.42);
        const by = layerY + (branchLen * 0.42) * Math.sin(tilt);

        const branch = cylinderComponent(registry, seasonalItem, landscapeLarchTree, 'larch-trunk', {
          diameterTop: size.width * 0.012,
          diameterBottom: size.width * 0.025,
          height: branchLen * 0.88,
          tessellation: 6
        }, { position: { x: bx, y: by, z: bz } }, { parent: node });

        branch.rotation.y = -angle;
        branch.rotation.z = tilt;

        [0.45, 0.90].forEach((distRatio) => {
          const lx = Math.cos(angle) * (branchLen * distRatio);
          const lz = Math.sin(angle) * (branchLen * distRatio);
          const ly = layerY + (branchLen * distRatio) * Math.sin(tilt) + 0.03;
          const leafD = size.width * (0.24 - ratio * 0.16);

          const leaf = sphereComponent(registry, seasonalItem, landscapeLarchTree, 'larch-foliage', {
            diameter: leafD,
            segments: 6
          }, { position: { x: lx, y: ly, z: lz } }, { parent: node });

          leaf.scaling.x = 1.35;
          leaf.scaling.y = 0.18;
          leaf.scaling.z = 0.75;
          leaf.rotation.y = -angle;
          leaf.rotation.z = tilt;
        });
      }
    }
  }
};

export const landscapeIvyWall = {
  type: 'landscape_ivy_wall',
  name: '爬山虎',
  placeType: 'wall',
  defaultSize: { width: 72, depth: 3, height: 64 },
  defaultSeason: 'summer',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'wall-vine', label: '攀爬藤蔓', defaultColor: IVY_WALL_SEASONS.summer.vine },
    { id: 'wall-leaves', label: '爬山虎绿叶', defaultColor: IVY_WALL_SEASONS.summer.leaves }
  ],
  build(registry, item, node, size) {
    const seasonKey = IVY_WALL_SEASONS[item.season] ? item.season : 'summer';
    const season = IVY_WALL_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(landscapeIvyWall, item, {
      'wall-vine': season.vine,
      'wall-leaves': season.leaves
    });

    // 绘制一个透明的碰撞长方体（Hitbox）覆盖整个包围盒，确保用户在墙面上可以非常轻松地点击选中它
    const hitbox = boxComponent(registry, seasonalItem, landscapeIvyWall, 'wall-leaves', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    // 绘制 3 条藤蔓路径
    const vines = [
      [ {x:-0.15, y:0}, {x:-0.28, y:0.25}, {x:-0.22, y:0.5}, {x:-0.38, y:0.75}, {x:-0.3, y:1.0} ],
      [ {x:0, y:0}, {x:0.08, y:0.2}, {x:-0.05, y:0.45}, {x:0.12, y:0.7}, {x:-0.02, y:1.0} ],
      [ {x:0.15, y:0}, {x:0.24, y:0.22}, {x:0.35, y:0.52}, {x:0.2, y:0.78}, {x:0.34, y:1.0} ]
    ];

    vines.forEach((points) => {
      for (let i = 0; i < points.length - 1; i++) {
        const pt1 = points[i];
        const pt2 = points[i + 1];
        const dx = pt2.x - pt1.x;
        const dy = pt2.y - pt1.y;
        const h = Math.sqrt(dx * dx * size.width * size.width + dy * dy * size.height * size.height);
        const px = (pt1.x + pt2.x) / 2 * size.width;
        const py = (pt1.y + pt2.y) / 2 * size.height;
        const pz = -size.depth * 0.05;

        const vineSegment = cylinderComponent(registry, seasonalItem, landscapeIvyWall, 'wall-vine', {
          diameterTop: size.depth * 0.12,
          diameterBottom: size.depth * 0.18,
          height: h,
          tessellation: 6
        }, {
          position: { x: px, y: py, z: pz }
        }, { parent: node });

        vineSegment.rotation.z = -Math.atan2(dx * size.width, dy * size.height);
      }
    });

    // 在所有节点上绘制对生且互相重叠的纸片状扁平小叶片
    const allNodes = [
      ...vines[0],
      ...vines[1],
      ...vines[2]
    ];

    allNodes.forEach((nd, idx) => {
      if (nd.y === 0) return;

      const leafCount = 3;
      for (let k = 0; k < leafCount; k++) {
        const angle = k * 2.0 + idx * 1.5;
        const radius = size.width * 0.04;
        const lx = nd.x * size.width + Math.sin(angle) * radius;
        const ly = nd.y * size.height + Math.cos(angle) * radius;
        const lz = (k - 1) * size.depth * 0.12;

        const leaf = sphereComponent(registry, seasonalItem, landscapeIvyWall, 'wall-leaves', {
          diameter: size.width * 0.12,
          segments: 6
        }, {
          position: { x: lx, y: ly, z: lz }
        }, { parent: node });

        // 扁平纸片叶子
        leaf.scaling.x = 0.65;
        leaf.scaling.y = 0.5;
        leaf.scaling.z = 0.06;

        leaf.rotation.z = angle;
        leaf.rotation.y = Math.sin(idx + k) * 0.3;
        leaf.rotation.x = Math.cos(idx + k) * 0.3;
      }
    });
  }
};

export const appleTreeFurniture = {
  type: 'apple_tree',
  name: '苹果树',
  defaultSize: { width: 56, depth: 56, height: 96 },
  defaultSeason: 'spring',
  seasonOptions: [
    { value: 'spring', label: '春' },
    { value: 'summer', label: '夏' },
    { value: 'autumn', label: '秋' },
    { value: 'winter', label: '冬' }
  ],
  components: [
    { id: 'apple-trunk', label: '树干枝干', defaultColor: APPLE_TREE_SEASONS.spring.trunk },
    { id: 'apple-foliage', label: '树冠叶团', defaultColor: APPLE_TREE_SEASONS.spring.foliage },
    { id: 'apple-blossom', label: '花簇雪团', defaultColor: APPLE_TREE_SEASONS.spring.blossom },
    { id: 'apple-fruit', label: '果实霜球', defaultColor: APPLE_TREE_SEASONS.spring.fruit }
  ],
  build(registry, item, node, size) {
    const seasonKey = APPLE_TREE_SEASONS[item.season] ? item.season : 'spring';
    const season = APPLE_TREE_SEASONS[seasonKey];
    const seasonalItem = getSeasonalItem(appleTreeFurniture, item, {
      'apple-trunk': season.trunk,
      'apple-foliage': season.foliage,
      'apple-blossom': season.blossom,
      'apple-fruit': season.fruit
    });

    const trunkH = size.height * 0.34;
    cylinderComponent(registry, seasonalItem, appleTreeFurniture, 'apple-trunk', {
      diameterTop: size.width * 0.07,
      diameterBottom: size.width * 0.12,
      height: trunkH,
      tessellation: 10
    }, { position: { x: 0, y: trunkH / 2, z: 0 } }, { parent: node });

    const branchData = [
      { x: -0.14, y: 0.46, z: -0.06, len: 0.34, rx: -0.22, rz: 0.52 },
      { x: 0.11, y: 0.45, z: 0.04, len: 0.3, rx: 0.16, rz: -0.44 },
      { x: -0.04, y: 0.45, z: 0.06, len: 0.28, rx: 0.24, rz: 0.18 },
      { x: 0.04, y: 0.44, z: -0.04, len: 0.24, rx: -0.2, rz: -0.18 }
    ];
    branchData.forEach((branch, index) => {
      const branchLen = size.height * branch.len;
      const branchMesh = cylinderComponent(registry, seasonalItem, appleTreeFurniture, 'apple-trunk', {
        diameterTop: size.width * 0.026,
        diameterBottom: size.width * 0.05,
        height: branchLen,
        tessellation: 8
      }, {
        position: {
          x: branch.x * size.width,
          y: branch.y * size.height,
          z: branch.z * size.depth
        }
      }, { parent: node });
      branchMesh.rotation.x = branch.rx;
      branchMesh.rotation.z = branch.rz;

      if (index < 2) {
        sphereComponent(registry, seasonalItem, appleTreeFurniture, 'apple-trunk', {
          diameter: size.width * 0.06,
          segments: 8
        }, {
          position: {
            x: branch.x * size.width * 1.08,
            y: branch.y * size.height - size.height * 0.02,
            z: branch.z * size.depth * 1.08
          },
          scaling: { x: 1, y: 0.65, z: 1 }
        }, { parent: node });
      }
    });

    const canopyData = [
      { x: -0.24, y: 0.66, z: -0.05, d: 0.4, sy: 0.75 },
      { x: 0.22, y: 0.68, z: 0.08, d: 0.42, sy: 0.78 },
      { x: -0.04, y: 0.82, z: 0.14, d: 0.46, sy: 0.74 },
      { x: 0.08, y: 0.87, z: -0.12, d: 0.38, sy: 0.7 },
      { x: 0, y: 0.73, z: 0, d: 0.52, sy: 0.78 }
    ];
    canopyData.forEach((cluster) => {
      sphereComponent(registry, seasonalItem, appleTreeFurniture, 'apple-foliage', {
        diameter: size.width * cluster.d,
        segments: 10
      }, {
        position: {
          x: cluster.x * size.width,
          y: cluster.y * size.height,
          z: cluster.z * size.depth
        },
        scaling: { x: 1, y: cluster.sy, z: 1 }
      }, { parent: node });
    });

    const blossomCount = seasonKey === 'spring' ? 15 : (seasonKey === 'winter' ? 8 : 4);
    for (let i = 0; i < blossomCount; i += 1) {
      const angle = i * 2.39996;
      const radius = size.width * (seasonKey === 'winter' ? 0.16 : 0.22);
      sphereComponent(registry, seasonalItem, appleTreeFurniture, 'apple-blossom', {
        diameter: size.width * (seasonKey === 'winter' ? 0.07 : 0.06),
        segments: 8
      }, {
        position: {
          x: Math.cos(angle) * radius * (0.55 + (i % 3) * 0.16),
          y: size.height * (0.62 + (i % 5) * 0.05),
          z: Math.sin(angle) * radius * (0.6 + (i % 4) * 0.12)
        }
      }, { parent: node });
    }

    const fruitPositions = [
      { x: -0.32, y: 0.58, z: -0.16 }, // 左前下沿
      { x: 0.32, y: 0.6, z: 0.12 },    // 右前下沿
      { x: -0.02, y: 0.59, z: 0.28 },  // 前侧下沿
      { x: 0.04, y: 0.58, z: -0.28 },  // 后侧下沿
      { x: -0.22, y: 0.68, z: 0.22 },  // 左后中层
      { x: 0.24, y: 0.69, z: -0.18 },  // 右后中层
      { x: -0.26, y: 0.76, z: 0.08 },  // 左侧较高
      { x: 0.16, y: 0.75, z: 0.24 },   // 右侧较高
      { x: 0.14, y: 0.82, z: -0.24 }   // 前侧较高
    ];
    const fruitCount = seasonKey === 'summer' ? 9 : (seasonKey === 'autumn' ? 7 : (seasonKey === 'winter' ? 5 : 3));
    for (let i = 0; i < Math.min(fruitCount, fruitPositions.length); i += 1) {
      const pos = fruitPositions[i];
      sphereComponent(registry, seasonalItem, appleTreeFurniture, 'apple-fruit', {
        diameter: size.width * (seasonKey === 'winter' ? 0.06 : 0.055),
        segments: 8
      }, {
        position: {
          x: pos.x * size.width,
          y: pos.y * size.height,
          z: pos.z * size.depth
        }
      }, { parent: node });
    }
  }
};
