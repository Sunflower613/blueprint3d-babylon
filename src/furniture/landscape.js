import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';
import { Vector3, TransformNode } from '../core/babylon.js';

const BABYLON = { Vector3, TransformNode };

export const landscapeTaihuStone = {
  type: 'landscape_taihu_stone',
  name: '太湖奇石',
  defaultSize: { width: 36, depth: 24, height: 48 },
  components: [
    { id: 'stone-base', label: '大理石底座', defaultColor: '#e0e0e0' },
    { id: 'stone-body', label: '太湖石体', defaultColor: '#757575' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.12;
    boxComponent(registry, item, landscapeTaihuStone, 'stone-base', {
      width: size.width * 0.9, height: baseH, depth: size.depth * 0.9
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const stoneY = baseH;
    sphereComponent(registry, item, landscapeTaihuStone, 'stone-body', {
      diameter: size.width * 0.7, segments: 8
    }, { position: { x: 0, y: stoneY + size.height * 0.25, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeTaihuStone, 'stone-body', {
      diameter: size.width * 0.5, segments: 8
    }, { position: { x: -size.width * 0.15, y: stoneY + size.height * 0.55, z: size.depth * 0.1 } }, { parent: node });

    sphereComponent(registry, item, landscapeTaihuStone, 'stone-body', {
      diameter: size.width * 0.4, segments: 8
    }, { position: { x: size.width * 0.12, y: stoneY + size.height * 0.65, z: -size.depth * 0.1 } }, { parent: node });
  }
};

export const landscapeRockeryFountain = {
  type: 'landscape_rockery_fountain',
  name: '假山流水盆景',
  defaultSize: { width: 48, depth: 36, height: 40 },
  components: [
    { id: 'pool-wall', label: '石雕水池', defaultColor: '#5d4037' },
    { id: 'water-surface', label: '明净水面', defaultColor: '#4fc3f7' },
    { id: 'rock-body', label: '青石假山', defaultColor: '#616161' },
    { id: 'water-cascade', label: '飞瀑流水', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    const poolH = size.height * 0.25;
    const wallT = 0.04;

    // 5板拼接中空凹槽水池
    boxComponent(registry, item, landscapeRockeryFountain, 'pool-wall', {
      width: size.width, height: 0.02, depth: size.depth
    }, { position: { x: 0, y: 0.01, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeRockeryFountain, 'pool-wall', {
      width: size.width, height: poolH, depth: wallT
    }, { position: { x: 0, y: poolH / 2, z: size.depth / 2 - wallT / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeRockeryFountain, 'pool-wall', {
      width: size.width, height: poolH, depth: wallT
    }, { position: { x: 0, y: poolH / 2, z: -size.depth / 2 + wallT / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeRockeryFountain, 'pool-wall', {
      width: wallT, height: poolH, depth: size.depth - wallT * 2
    }, { position: { x: size.width / 2 - wallT / 2, y: poolH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeRockeryFountain, 'pool-wall', {
      width: wallT, height: poolH, depth: size.depth - wallT * 2
    }, { position: { x: -size.width / 2 + wallT / 2, y: poolH / 2, z: 0 } }, { parent: node });

    // 内嵌水面
    boxComponent(registry, item, landscapeRockeryFountain, 'water-surface', {
      width: size.width - wallT * 2, height: 0.02, depth: size.depth - wallT * 2
    }, { position: { x: 0, y: poolH - 0.02, z: 0 } }, { parent: node });

    const rockY = poolH;
    sphereComponent(registry, item, landscapeRockeryFountain, 'rock-body', {
      diameter: size.width * 0.45, segments: 8
    }, { position: { x: -size.width * 0.2, y: rockY + size.height * 0.25, z: -size.depth * 0.1 } }, { parent: node });

    sphereComponent(registry, item, landscapeRockeryFountain, 'rock-body', {
      diameter: size.width * 0.35, segments: 8
    }, { position: { x: size.width * 0.15, y: rockY + size.height * 0.4, z: size.depth * 0.15 } }, { parent: node });

    cylinderComponent(registry, item, landscapeRockeryFountain, 'water-cascade', {
      diameterTop: 0.02, diameterBottom: 0.06, height: size.height * 0.5, tessellation: 8
    }, { position: { x: 0, y: rockY + size.height * 0.25, z: 0 } }, { parent: node });
  }
};

export const landscapeZenGravel = {
  type: 'landscape_zen_gravel',
  name: '枯山水砂石',
  defaultSize: { width: 72, depth: 48, height: 16 },
  components: [
    { id: 'zen-sand', label: '白砂波纹', defaultColor: '#eeeeee' },
    { id: 'zen-stone', label: '坐禅置石', defaultColor: '#424242' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, landscapeZenGravel, 'zen-sand', {
      width: size.width, height: size.height * 0.2, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });

    const sandY = size.height * 0.2;
    sphereComponent(registry, item, landscapeZenGravel, 'zen-stone', {
      diameter: size.width * 0.18, segments: 8
    }, { position: { x: -size.width * 0.2, y: sandY + size.height * 0.25, z: -size.depth * 0.15 } }, { parent: node });

    sphereComponent(registry, item, landscapeZenGravel, 'zen-stone', {
      diameter: size.width * 0.12, segments: 8
    }, { position: { x: size.width * 0.18, y: sandY + size.height * 0.18, z: size.depth * 0.12 } }, { parent: node });

    sphereComponent(registry, item, landscapeZenGravel, 'zen-stone', {
      diameter: size.width * 0.08, segments: 8
    }, { position: { x: size.width * 0.25, y: sandY + size.height * 0.1, z: size.depth * 0.05 } }, { parent: node });
  }
};

export const landscapeKoiPond = {
  type: 'landscape_koi_pond',
  name: '锦鲤鱼池',
  defaultSize: { width: 80, depth: 60, height: 18 },
  components: [
    { id: 'pond-wall', label: '青砖池壁', defaultColor: '#455a64' },
    { id: 'pond-water', label: '池塘清波', defaultColor: '#00acc1' },
    { id: 'pond-koi', label: '红白锦鲤', defaultColor: '#ff5722' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.04;

    // 5板拼接中空凹槽水池
    boxComponent(registry, item, landscapeKoiPond, 'pond-wall', {
      width: size.width, height: 0.02, depth: size.depth
    }, { position: { x: 0, y: 0.01, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeKoiPond, 'pond-wall', {
      width: size.width, height: size.height, depth: wallT
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 - wallT / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeKoiPond, 'pond-wall', {
      width: size.width, height: size.height, depth: wallT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + wallT / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeKoiPond, 'pond-wall', {
      width: wallT, height: size.height, depth: size.depth - wallT * 2
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeKoiPond, 'pond-wall', {
      width: wallT, height: size.height, depth: size.depth - wallT * 2
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 内嵌水面
    boxComponent(registry, item, landscapeKoiPond, 'pond-water', {
      width: size.width - wallT * 2, height: 0.02, depth: size.depth - wallT * 2
    }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });

    const fishData = [
      { x: -size.width * 0.2, z: -size.depth * 0.15, r: 0.5 },
      { x: size.width * 0.15, z: size.depth * 0.2, r: -0.8 },
      { x: size.width * 0.02, z: -size.depth * 0.05, r: 1.2 }
    ];
    fishData.forEach((fd) => {
      const fish = sphereComponent(registry, item, landscapeKoiPond, 'pond-koi', {
        diameter: size.width * 0.08, segments: 6
      }, { position: { x: fd.x, y: size.height - 0.01, z: fd.z } }, { parent: node });
      fish.scaling.z = 2.2;
      fish.rotation.y = fd.r;
    });
  }
};

export const landscapeBambooGrove = {
  type: 'landscape_bamboo_grove',
  name: '翠竹丛',
  defaultSize: { width: 40, depth: 24, height: 96 },
  components: [
    { id: 'bamboo-culm', label: '翠绿竹竿', defaultColor: '#2e7d32' },
    { id: 'bamboo-foliage', label: '青葱竹叶', defaultColor: '#4caf50' }
  ],
  build(registry, item, node, size) {
    const bambooStems = [
      { x: -size.width * 0.28, z: -size.depth * 0.2, h: size.height * 0.95, rotX: 0.04, rotZ: -0.05 },
      { x: -size.width * 0.1, z: size.depth * 0.22, h: size.height * 0.98, rotX: -0.05, rotZ: 0.02 },
      { x: size.width * 0.12, z: -size.depth * 0.18, h: size.height * 0.92, rotX: 0.03, rotZ: 0.06 },
      { x: size.width * 0.3, z: size.depth * 0.15, h: size.height * 0.96, rotX: -0.02, rotZ: -0.04 }
    ];

    bambooStems.forEach((bs) => {
      const stem = cylinderComponent(registry, item, landscapeBambooGrove, 'bamboo-culm', {
        diameterTop: 0.025, diameterBottom: 0.035, height: bs.h, tessellation: 8
      }, { position: { x: bs.x, y: bs.h / 2, z: bs.z } }, { parent: node });
      stem.rotation.x = bs.rotX;
      stem.rotation.z = bs.rotZ;

      const leafCount = 3;
      for (let j = 0; j < leafCount; j++) {
        const leafY = bs.h * (0.4 + j * 0.2);
        sphereComponent(registry, item, landscapeBambooGrove, 'bamboo-foliage', {
          diameter: size.width * 0.25, segments: 6
        }, { position: { x: bs.x + Math.sin(j) * 0.06, y: leafY, z: bs.z + Math.cos(j) * 0.06 } }, { parent: node });
      }
    });
  }
};

export const landscapeStoneTrough = {
  type: 'landscape_stone_trough',
  name: '听雨仿古石槽',
  defaultSize: { width: 36, depth: 18, height: 16 },
  components: [
    { id: 'trough-stone', label: '青石槽体', defaultColor: '#4f5b66' },
    { id: 'trough-water', label: '槽中蓄水', defaultColor: '#80deea' }
  ],
  build(registry, item, node, size) {
    const wallThick = size.width * 0.08;
    boxComponent(registry, item, landscapeStoneTrough, 'trough-stone', {
      width: size.width, height: size.height * 0.15, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.075, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeStoneTrough, 'trough-stone', {
      width: size.width, height: size.height * 0.85, depth: wallThick
    }, { position: { x: 0, y: size.height * 0.575, z: size.depth / 2 - wallThick / 2 } }, { parent: node });
    boxComponent(registry, item, landscapeStoneTrough, 'trough-stone', {
      width: size.width, height: size.height * 0.85, depth: wallThick
    }, { position: { x: 0, y: size.height * 0.575, z: -size.depth / 2 + wallThick / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeStoneTrough, 'trough-stone', {
      width: wallThick, height: size.height * 0.85, depth: size.depth - wallThick * 2
    }, { position: { x: size.width / 2 - wallThick / 2, y: size.height * 0.575, z: 0 } }, { parent: node });
    boxComponent(registry, item, landscapeStoneTrough, 'trough-stone', {
      width: wallThick, height: size.height * 0.85, depth: size.depth - wallThick * 2
    }, { position: { x: -size.width / 2 + wallThick / 2, y: size.height * 0.575, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeStoneTrough, 'trough-water', {
      width: size.width - wallThick * 2, height: 0.02, depth: size.depth - wallThick * 2
    }, { position: { x: 0, y: size.height * 0.8, z: 0 } }, { parent: node });
  }
};

export const landscapeScreenWall = {
  type: 'landscape_screen_wall',
  name: '砖雕照壁',
  defaultSize: { width: 84, depth: 16, height: 64 },
  components: [
    { id: 'wall-base', label: '须弥座底座', defaultColor: '#37474f' },
    { id: 'wall-body', label: '砖雕壁身', defaultColor: '#90a4ae' },
    { id: 'wall-roof', label: '灰瓦屋檐', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.16;
    boxComponent(registry, item, landscapeScreenWall, 'wall-base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyH = size.height * 0.72;
    boxComponent(registry, item, landscapeScreenWall, 'wall-body', {
      width: size.width * 0.9, height: bodyH, depth: size.depth * 0.65
    }, { position: { x: 0, y: baseH + bodyH / 2, z: 0 } }, { parent: node });

    const roofH = size.height * 0.12;
    cylinderComponent(registry, item, landscapeScreenWall, 'wall-roof', {
      diameterTop: size.depth * 0.1, diameterBottom: size.depth * 0.9, height: size.width * 1.02, tessellation: 4
    }, { position: { x: 0, y: size.height - roofH / 2, z: 0 } }, { parent: node }).rotation.z = Math.PI / 2;
  }
};

export const landscapeTaishanStone = {
  type: 'landscape_taishan_stone',
  name: '泰山石敢当',
  defaultSize: { width: 18, depth: 12, height: 32 },
  components: [
    { id: 'tablet-base', label: '粗凿石座', defaultColor: '#78909c' },
    { id: 'tablet-body', label: '石敢当碑身', defaultColor: '#455a64' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    boxComponent(registry, item, landscapeTaishanStone, 'tablet-base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyH = size.height * 0.85;
    cylinderComponent(registry, item, landscapeTaishanStone, 'tablet-body', {
      diameterTop: size.width * 0.7, diameterBottom: size.width * 0.85, height: bodyH, tessellation: 6
    }, { position: { x: 0, y: baseH + bodyH / 2, z: 0 } }, { parent: node });
  }
};

export const landscapeCascadingTerrace = {
  type: 'landscape_cascading_terrace',
  name: '叠水层级石台',
  defaultSize: { width: 52, depth: 52, height: 36 },
  components: [
    { id: 'stone-levels', label: '叠水石台', defaultColor: '#607d8b' },
    { id: 'water-curtain', label: '溢流跌水', defaultColor: '#b2ebf2' }
  ],
  build(registry, item, node, size) {
    const h1 = size.height * 0.35;
    boxComponent(registry, item, landscapeCascadingTerrace, 'stone-levels', {
      width: size.width, height: h1, depth: size.depth
    }, { position: { x: 0, y: h1 / 2, z: 0 } }, { parent: node });

    const h2 = size.height * 0.32;
    boxComponent(registry, item, landscapeCascadingTerrace, 'stone-levels', {
      width: size.width * 0.72, height: h2, depth: size.depth * 0.72
    }, { position: { x: 0, y: h1 + h2 / 2, z: 0 } }, { parent: node });

    const h3 = size.height * 0.28;
    boxComponent(registry, item, landscapeCascadingTerrace, 'stone-levels', {
      width: size.width * 0.45, height: h3, depth: size.depth * 0.45
    }, { position: { x: 0, y: h1 + h2 + h3 / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeCascadingTerrace, 'water-curtain', {
      width: size.width * 0.65, height: h2, depth: size.width * 0.65
    }, { position: { x: 0, y: h1 + h2 / 2 + 0.01, z: 0 } }, { parent: node });
  }
};

export const landscapeShishiOdoshi = {
  type: 'landscape_shishi_odoshi',
  name: '竹排流水（鹿打）',
  defaultSize: { width: 24, depth: 24, height: 28 },
  components: [
    { id: 'stone-basin', label: '手工石钵', defaultColor: '#78909c' },
    { id: 'basin-water', label: '钵中清泉', defaultColor: '#00e5ff' },
    { id: 'bamboo-pipes', label: '流水竹架', defaultColor: '#81c784' }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.36;
    const baseBottomH = 0.02;

    // 底板
    cylinderComponent(registry, item, landscapeShishiOdoshi, 'stone-basin', {
      diameterTop: size.width - 0.03, diameterBottom: size.width - 0.03, height: baseBottomH, tessellation: 16
    }, { position: { x: 0, y: baseBottomH / 2, z: 0 } }, { parent: node });

    // 8段环状拼成凹槽池壁
    const wallT = 0.03;
    const wallR = size.width / 2 - wallT / 2;
    const boardW = size.width * 0.414;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallR;
      const z = Math.sin(angle) * wallR;
      const wall = boxComponent(registry, item, landscapeShishiOdoshi, 'stone-basin', {
        width: wallT, height: basinH, depth: boardW
      }, { position: { x: x, y: basinH / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    // 内嵌水面
    cylinderComponent(registry, item, landscapeShishiOdoshi, 'basin-water', {
      diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
    }, { position: { x: 0, y: basinH - 0.02, z: 0 } }, { parent: node });

    const poleH = size.height * 0.72;
    cylinderComponent(registry, item, landscapeShishiOdoshi, 'bamboo-pipes', {
      diameterTop: 0.022, diameterBottom: 0.022, height: poleH, tessellation: 8
    }, { position: { x: -size.width * 0.15, y: poleH / 2, z: -size.depth * 0.15 } }, { parent: node });

    const pipe = cylinderComponent(registry, item, landscapeShishiOdoshi, 'bamboo-pipes', {
      diameterTop: 0.016, diameterBottom: 0.022, height: size.width * 0.7, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.65, z: 0 } }, { parent: node });
    pipe.rotation.x = Math.PI / 2;
    pipe.rotation.y = 0.28;
  }
};

export const landscapeGlassWaterfall = {
  type: 'landscape_glass_waterfall',
  name: '极简玻璃水幕墙',
  defaultSize: { width: 56, depth: 18, height: 72 },
  components: [
    { id: 'waterfall-base', label: '不锈钢水槽', defaultColor: '#37474f' },
    { id: 'waterfall-glass', label: '幕墙玻璃', defaultColor: '#e0f7fa' },
    { id: 'waterfall-frame', label: '边框框架', defaultColor: '#455a64' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    boxComponent(registry, item, landscapeGlassWaterfall, 'waterfall-base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const glassH = size.height * 0.85;
    boxComponent(registry, item, landscapeGlassWaterfall, 'waterfall-glass', {
      width: size.width * 0.86, height: glassH, depth: 0.04
    }, { position: { x: 0, y: baseH + glassH / 2, z: 0 } }, { parent: node });

    const poleW = size.width * 0.07;
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, landscapeGlassWaterfall, 'waterfall-frame', {
        width: poleW, height: glassH, depth: size.depth * 0.8
      }, { position: { x: side * (size.width / 2 - poleW / 2), y: baseH + glassH / 2, z: 0 } }, { parent: node });
    });

    boxComponent(registry, item, landscapeGlassWaterfall, 'waterfall-frame', {
      width: size.width, height: 0.05, depth: size.depth * 0.8
    }, { position: { x: 0, y: size.height - 0.025, z: 0 } }, { parent: node });
  }
};

export const landscapeStreamRockery = {
  type: 'landscape_stream_rockery',
  name: '碎石溪流假山',
  defaultSize: { width: 84, depth: 36, height: 18 },
  components: [
    { id: 'stream-water', label: '潺潺小溪', defaultColor: '#00b0ff' },
    { id: 'stream-pebbles', label: '护岸卵石', defaultColor: '#90a4ae' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, landscapeStreamRockery, 'stream-water', {
      width: size.width, height: size.height * 0.2, depth: size.depth * 0.65
    }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });

    const stoneCoords = [
      { x: -size.width * 0.42, z: -size.depth * 0.38 },
      { x: -size.width * 0.25, z: -size.depth * 0.4 },
      { x: -size.width * 0.05, z: -size.depth * 0.36 },
      { x: size.width * 0.18, z: -size.depth * 0.42 },
      { x: size.width * 0.38, z: -size.depth * 0.39 },
      { x: -size.width * 0.38, z: size.depth * 0.38 },
      { x: -size.width * 0.18, z: size.depth * 0.4 },
      { x: size.width * 0.02, z: size.depth * 0.36 },
      { x: size.width * 0.22, z: size.depth * 0.41 },
      { x: size.width * 0.42, z: size.depth * 0.37 }
    ];

    stoneCoords.forEach((coord, i) => {
      const stoneD = size.width * 0.12 + Math.sin(i) * 0.03;
      sphereComponent(registry, item, landscapeStreamRockery, 'stream-pebbles', {
        diameter: stoneD, segments: 6
      }, { position: { x: coord.x, y: size.height * 0.15, z: coord.z } }, { parent: node });
    });
  }
};

export const landscapeLotusPond = {
  type: 'landscape_lotus_pond',
  name: '荷塘月色荷花池',
  defaultSize: { width: 64, depth: 48, height: 16 },
  components: [
    { id: 'lotus-water', label: '池塘碧水与围壁', defaultColor: '#00838f' },
    { id: 'lotus-leaf', label: '翠绿荷叶', defaultColor: '#2e7d32' },
    { id: 'lotus-flower', label: '出水芙蓉', defaultColor: '#f48fb1' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.04;

    // 5板拼接中空凹槽水池
    boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
      width: size.width, height: 0.02, depth: size.depth
    }, { position: { x: 0, y: 0.01, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
      width: size.width, height: size.height, depth: wallT
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 - wallT / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
      width: size.width, height: size.height, depth: wallT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + wallT / 2 } }, { parent: node });

    boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
      width: wallT, height: size.height, depth: size.depth - wallT * 2
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
      width: wallT, height: size.height, depth: size.depth - wallT * 2
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 内嵌水面
    boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
      width: size.width - wallT * 2, height: 0.02, depth: size.depth - wallT * 2
    }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });

    const leaves = [
      { x: -size.width * 0.22, z: -size.depth * 0.15, d: size.width * 0.25 },
      { x: -size.width * 0.08, z: size.depth * 0.22, d: size.width * 0.28 },
      { x: size.width * 0.18, z: -size.depth * 0.1, d: size.width * 0.22 },
      { x: size.width * 0.08, z: -size.depth * 0.3, d: size.width * 0.18 }
    ];

    leaves.forEach((lv) => {
      cylinderComponent(registry, item, landscapeLotusPond, 'lotus-leaf', {
        diameterTop: lv.d, diameterBottom: lv.d, height: 0.015, tessellation: 8
      }, { position: { x: lv.x, y: size.height * 0.41, z: lv.z } }, { parent: node });
    });

    const flowers = [
      { x: -size.width * 0.05, z: size.depth * 0.12, d: size.width * 0.12 },
      { x: size.width * 0.15, z: -size.depth * 0.18, d: size.width * 0.1 }
    ];
    flowers.forEach((fl) => {
      sphereComponent(registry, item, landscapeLotusPond, 'lotus-flower', {
        diameter: fl.d, segments: 8
      }, { position: { x: fl.x, y: size.height * 0.46, z: fl.z } }, { parent: node });
    });
  }
};

export const landscapeSteppingStones = {
  type: 'landscape_stepping_stones',
  name: '园林汀步石路',
  defaultSize: { width: 72, depth: 24, height: 4 },
  components: [
    { id: 'stepping-stone', label: '青石汀步', defaultColor: '#546e7a' }
  ],
  build(registry, item, node, size) {
    const steps = [
      { x: -size.width * 0.36, z: -size.depth * 0.15, w: size.width * 0.18, d: size.depth * 0.65 },
      { x: -size.width * 0.18, z: size.depth * 0.18, w: size.width * 0.2, d: size.depth * 0.7 },
      { x: 0, z: -size.depth * 0.1, w: size.width * 0.18, d: size.depth * 0.6 },
      { x: size.width * 0.18, z: size.depth * 0.15, w: size.width * 0.22, d: size.depth * 0.65 },
      { x: size.width * 0.36, z: -size.depth * 0.12, w: size.width * 0.18, d: size.depth * 0.6 }
    ];

    steps.forEach((st) => {
      boxComponent(registry, item, landscapeSteppingStones, 'stepping-stone', {
        width: st.w, height: size.height, depth: st.d
      }, { position: { x: st.x, y: size.height / 2, z: st.z } }, { parent: node });
    });
  }
};

export const landscapeMistGenerator = {
  type: 'landscape_mist_generator',
  name: '庭院雾森制造器',
  defaultSize: { width: 28, depth: 28, height: 32 },
  components: [
    { id: 'mist-base', label: '金属雾化器', defaultColor: '#37474f' },
    { id: 'mist-fog', label: '飘逸雾霭', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.35;
    cylinderComponent(registry, item, landscapeMistGenerator, 'mist-base', {
      diameterTop: size.width, diameterBottom: size.width, height: baseH, tessellation: 12
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const fogY = baseH;
    sphereComponent(registry, item, landscapeMistGenerator, 'mist-fog', {
      diameter: size.width * 1.1, segments: 6
    }, { position: { x: 0, y: fogY + size.height * 0.2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeMistGenerator, 'mist-fog', {
      diameter: size.width * 0.95, segments: 6
    }, { position: { x: -size.width * 0.15, y: fogY + size.height * 0.45, z: size.depth * 0.1 } }, { parent: node });
  }
};

export const landscapeRockeryCave = {
  type: 'landscape_rockery_cave',
  name: '假山溶洞拱门',
  defaultSize: { width: 72, depth: 36, height: 60 },
  components: [
    { id: 'cave-rocks', label: '堆叠溶岩石', defaultColor: '#455a64' }
  ],
  build(registry, item, node, size) {
    const postW = size.width * 0.28;
    const postH = size.height * 0.72;
    boxComponent(registry, item, landscapeRockeryCave, 'cave-rocks', {
      width: postW, height: postH, depth: size.depth
    }, { position: { x: -size.width / 2 + postW / 2, y: postH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeRockeryCave, 'cave-rocks', {
      width: postW, height: postH, depth: size.depth
    }, { position: { x: size.width / 2 - postW / 2, y: postH / 2, z: 0 } }, { parent: node });

    const archW = size.width - postW * 2 + 0.08;
    const archH = size.height - postH;
    boxComponent(registry, item, landscapeRockeryCave, 'cave-rocks', {
      width: archW, height: archH, depth: size.depth
    }, { position: { x: 0, y: postH + archH / 2, z: 0 } }, { parent: node });

    const details = [
      { x: -size.width * 0.25, y: postH * 0.8, d: size.width * 0.25 },
      { x: size.width * 0.25, y: postH * 0.8, d: size.width * 0.25 },
      { x: 0, y: size.height, d: size.width * 0.3 }
    ];
    details.forEach((det) => {
      sphereComponent(registry, item, landscapeRockeryCave, 'cave-rocks', {
        diameter: det.d, segments: 6
      }, { position: { x: det.x, y: det.y, z: 0 } }, { parent: node });
    });
  }
};

export const landscapeSlatePath = {
  type: 'landscape_slate_path',
  name: '青石板铺设小路',
  defaultSize: { width: 80, depth: 32, height: 2 },
  components: [
    { id: 'slate-body', label: '青石板面', defaultColor: '#4f5d65' }
  ],
  build(registry, item, node, size) {
    const slates = [
      { x: -size.width * 0.37, z: 0, w: size.width * 0.22 },
      { x: -size.width * 0.12, z: 0.02, w: size.width * 0.24 },
      { x: size.width * 0.13, z: -0.01, w: size.width * 0.22 },
      { x: size.width * 0.38, z: 0.01, w: size.width * 0.23 }
    ];

    slates.forEach((sl) => {
      boxComponent(registry, item, landscapeSlatePath, 'slate-body', {
        width: sl.w, height: size.height, depth: size.depth * 0.92
      }, { position: { x: sl.x, y: size.height / 2, z: sl.z } }, { parent: node });
    });
  }
};

export const landscapeModernWaterWall = {
  type: 'landscape_modern_water_wall',
  name: '不锈钢金属水幕墙',
  defaultSize: { width: 48, depth: 16, height: 72 },
  components: [
    { id: 'metal-body', label: '拉丝不锈钢底座与框', defaultColor: '#b0bec5' },
    { id: 'metal-sheet', label: '不锈钢出水壁板', defaultColor: '#90a4ae' },
    { id: 'water-curtain', label: '溢流波纹', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    boxComponent(registry, item, landscapeModernWaterWall, 'metal-body', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyH = size.height * 0.85;
    boxComponent(registry, item, landscapeModernWaterWall, 'metal-sheet', {
      width: size.width * 0.82, height: bodyH, depth: size.depth * 0.22
    }, { position: { x: 0, y: baseH + bodyH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeModernWaterWall, 'water-curtain', {
      width: size.width * 0.8, height: bodyH, depth: size.depth * 0.26
    }, { position: { x: 0, y: baseH + bodyH / 2, z: 0.01 } }, { parent: node });
  }
};

export const landscapeBananaTree = {
  type: 'landscape_banana_tree',
  name: '芭蕉丛',
  defaultSize: { width: 48, depth: 40, height: 80 },
  components: [
    { id: 'banana-stem', label: '粗壮蕉茎', defaultColor: '#689f38' },
    { id: 'banana-leaves', label: '阔叶蕉叶', defaultColor: '#4caf50' }
  ],
  build(registry, item, node, size) {
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
      
      const baseSph = sphereComponent(registry, item, landscapeBananaTree, 'banana-stem', {
        diameter: size.width * 0.14, segments: 8
      }, { position: { x: sc.rx, y: size.width * 0.04, z: sc.rz } }, { parent: node });
      baseSph.scaling.y = 0.45;
      
      if (idx !== 2) {
        const budDir = idx === 0 ? 1 : -1;
        const bud = cylinderComponent(registry, item, landscapeBananaTree, 'banana-stem', {
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
        
        const stemSeg = cylinderComponent(registry, item, landscapeBananaTree, 'banana-stem', {
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
            
            const halfLeaf = boxComponent(registry, item, landscapeBananaTree, 'banana-leaves', {
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
        cylinderComponent(registry, item, landscapeBananaTree, 'banana-stem', {
          diameterTop: size.width * 0.016, diameterBottom: size.width * 0.012, height: pedicelH, tessellation: 6
        }, { position: { x: curStemPos.x, y: curStemPos.y - pedicelH / 2, z: curStemPos.z } }, { parent: node });
        
        const budSize = size.width * 0.065;
        const bud = sphereComponent(registry, item, landscapeBananaTree, 'banana-leaves', {
          diameter: budSize * 1.8, segments: 10
        }, { position: { x: curStemPos.x, y: curStemPos.y - pedicelH, z: curStemPos.z } }, { parent: node });
        bud.scaling.y = 1.7;
      }
    });
  }
};

export const landscapeWaterLilyPond = {
  type: 'landscape_water_lily_pond',
  name: '庭院睡莲水池',
  defaultSize: { width: 56, depth: 56, height: 16 },
  components: [
    { id: 'pond-basin', label: '水池石围', defaultColor: '#78909c' },
    { id: 'pond-water', label: '池中净水', defaultColor: '#00acc1' },
    { id: 'lily-pad', label: '浮水睡莲叶', defaultColor: '#33691e' },
    { id: 'lily-flower', label: '含苞睡莲花', defaultColor: '#e040fb' }
  ],
  build(registry, item, node, size) {
    const baseBottomH = 0.02;

    // 底板
    cylinderComponent(registry, item, landscapeWaterLilyPond, 'pond-basin', {
      diameterTop: size.width - 0.04, diameterBottom: size.width - 0.04, height: baseBottomH, tessellation: 16
    }, { position: { x: 0, y: baseBottomH / 2, z: 0 } }, { parent: node });

    // 8段环状拼接成凹槽圆池壁
    const wallT = 0.04;
    const wallR = size.width / 2 - wallT / 2;
    const boardW = size.width * 0.414;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallR;
      const z = Math.sin(angle) * wallR;
      const wall = boxComponent(registry, item, landscapeWaterLilyPond, 'pond-basin', {
        width: wallT, height: size.height, depth: boardW
      }, { position: { x: x, y: size.height / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    // 水面
    cylinderComponent(registry, item, landscapeWaterLilyPond, 'pond-water', {
      diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
    }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });

    const pads = [
      { x: -size.width * 0.22, z: -size.depth * 0.12, d: size.width * 0.22 },
      { x: size.width * 0.12, z: size.depth * 0.18, d: size.width * 0.25 },
      { x: -size.width * 0.05, z: size.depth * 0.24, d: size.width * 0.18 }
    ];
    pads.forEach((pd) => {
      cylinderComponent(registry, item, landscapeWaterLilyPond, 'lily-pad', {
        diameterTop: pd.d, diameterBottom: pd.d, height: 0.01, tessellation: 8
      }, { position: { x: pd.x, y: size.height - 0.01, z: pd.z } }, { parent: node });
    });

    sphereComponent(registry, item, landscapeWaterLilyPond, 'lily-flower', {
      diameter: size.width * 0.08, segments: 6
    }, { position: { x: size.width * 0.12, y: size.height, z: size.depth * 0.18 } }, { parent: node });
  }
};

export const landscapeTaijiPond = {
  type: 'landscape_taiji_pond',
  name: '太极八卦风水池',
  defaultSize: { width: 60, depth: 60, height: 12 },
  components: [
    { id: 'taiji-base', label: '黑白理石围合', defaultColor: '#e0e0e0' },
    { id: 'taiji-black', label: '阴仪玄水', defaultColor: '#212121' },
    { id: 'taiji-white', label: '阳仪碧波', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, landscapeTaijiPond, 'taiji-base', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height, tessellation: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const innerRadius = size.width * 0.92;
    boxComponent(registry, item, landscapeTaijiPond, 'taiji-black', {
      width: innerRadius, height: 0.02, depth: innerRadius / 2
    }, { position: { x: 0, y: size.height - 0.01, z: -innerRadius / 4 } }, { parent: node });

    boxComponent(registry, item, landscapeTaijiPond, 'taiji-white', {
      width: innerRadius, height: 0.02, depth: innerRadius / 2
    }, { position: { x: 0, y: size.height - 0.01, z: innerRadius / 4 } }, { parent: node });
  }
};

export const landscapeCourtyardRedMaple = {
  type: 'landscape_courtyard_red_maple',
  name: '大红枫树',
  defaultSize: { width: 48, depth: 48, height: 96 },
  components: [
    { id: 'maple-trunk', label: '嶙峋树干', defaultColor: '#3e2723' },
    { id: 'maple-leaves', label: '朱红枫叶簇', defaultColor: '#c62828' }
  ],
  build(registry, item, node, size) {
    const baseTrunkH = size.height * 0.28;
    
    const trunk1 = cylinderComponent(registry, item, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.09, height: baseTrunkH, tessellation: 8
    }, { position: { x: 0, y: baseTrunkH / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = 0.05;

    const midTrunkH = size.height * 0.24;
    const trunk2 = cylinderComponent(registry, item, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.055, diameterBottom: size.width * 0.06, height: midTrunkH, tessellation: 8
    }, { position: { x: -size.width * 0.03, y: baseTrunkH + midTrunkH / 2, z: -size.depth * 0.02 } }, { parent: node });
    trunk2.rotation.z = -0.15;
    trunk2.rotation.x = -0.08;

    const leftTrunkH = size.height * 0.22;
    const lTrunk = cylinderComponent(registry, item, landscapeCourtyardRedMaple, 'maple-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: leftTrunkH, tessellation: 6
    }, { position: { x: -size.width * 0.12, y: baseTrunkH + midTrunkH + leftTrunkH / 2 - size.height * 0.05, z: size.depth * 0.03 } }, { parent: node });
    lTrunk.rotation.z = 0.45;
    lTrunk.rotation.x = 0.15;

    const rightTrunkH = size.height * 0.25;
    const rTrunk = cylinderComponent(registry, item, landscapeCourtyardRedMaple, 'maple-trunk', {
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

      const leafMesh = sphereComponent(registry, item, landscapeCourtyardRedMaple, 'maple-leaves', {
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
  name: '迎客松树',
  defaultSize: { width: 64, depth: 40, height: 88 },
  components: [
    { id: 'pine-trunk', label: '曲折松干', defaultColor: '#4e342e' },
    { id: 'pine-foliage', label: '叠翠松针', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    // 1. 大树盘地暴露的爪根
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.08, height: size.height * 0.12, tessellation: 8
    }, { position: { x: -size.width * 0.15, y: size.height * 0.04, z: size.depth * 0.05 }, rotation: { x: 0.2, y: 0, z: 0.5 } }, { parent: node });

    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.07, height: size.height * 0.1, tessellation: 8
    }, { position: { x: -size.width * 0.02, y: size.height * 0.03, z: -size.depth * 0.08 }, rotation: { x: -0.3, y: 0.2, z: -0.4 } }, { parent: node });

    // 2. 沧桑曲折的大树干 (4段曲折，苍劲有力)
    const trunkH1 = size.height * 0.22;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.09, diameterBottom: size.width * 0.12, height: trunkH1, tessellation: 10
    }, { position: { x: -size.width * 0.08, y: trunkH1 / 2, z: 0 }, rotation: { x: 0.05, y: 0, z: -0.15 } }, { parent: node });

    const trunkH2 = size.height * 0.20;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.07, diameterBottom: size.width * 0.09, height: trunkH2, tessellation: 8
    }, { position: { x: -size.width * 0.01, y: trunkH1 + trunkH2 / 2 - 0.05, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0.1, z: -0.35 } }, { parent: node });

    const trunkH3 = size.height * 0.18;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.07, height: trunkH3, tessellation: 8
    }, { position: { x: size.width * 0.08, y: trunkH1 + trunkH2 + trunkH3 / 2 - 0.1, z: size.depth * 0.03 }, rotation: { x: 0.05, y: -0.1, z: 0.25 } }, { parent: node });

    const trunkH4 = size.height * 0.15;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.05, height: trunkH4, tessellation: 8
    }, { position: { x: size.width * 0.04, y: trunkH1 + trunkH2 + trunkH3 + trunkH4 / 2 - 0.15, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0, z: 0.1 } }, { parent: node });

    // 3. 向两侧和前后伸展的粗大主枝
    // 向左下角长伸的标志性迎客松巨臂 1
    const branchL1 = size.width * 0.32;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.065, height: branchL1, tessellation: 8
    }, { position: { x: -size.width * 0.18, y: trunkH1 + 0.15, z: size.depth * 0.04 }, rotation: { x: 0.1, y: 0, z: 1.15 } }, { parent: node });

    // 迎客松巨臂 2
    const branchL2 = size.width * 0.28;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: branchL2, tessellation: 6
    }, { position: { x: -size.width * 0.4, y: trunkH1 - 0.3, z: size.depth * 0.06 }, rotation: { x: -0.1, y: -0.1, z: 1.38 } }, { parent: node });

    // 右平衡枝 1
    const rightL1 = size.width * 0.26;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: rightL1, tessellation: 6
    }, { position: { x: size.width * 0.2, y: trunkH1 + trunkH2 + 0.1, z: -size.depth * 0.03 }, rotation: { x: -0.1, y: 0, z: -0.8 } }, { parent: node });

    // 后背景大枝 1
    const backL1 = size.height * 0.22;
    cylinderComponent(registry, item, landscapeCourtyardPineTree, 'pine-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.04, height: backL1, tessellation: 6
    }, { position: { x: size.width * 0.01, y: trunkH1 + trunkH2 + trunkH3 - 0.1, z: -size.depth * 0.2 }, rotation: { x: -0.85, y: 0, z: -0.15 } }, { parent: node });

    // 4. 叠翠层叠云状松冠 (共 8 组大云片)
    // 云片 1 - 迎客大臂末端
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.48, segments: 10
    }, { position: { x: -size.width * 0.54, y: trunkH1 - 0.45, z: size.depth * 0.06 }, scaling: { x: 1.42, y: 0.16, z: 1.0 } }, { parent: node });

    // 云片 2 - 迎客大臂中段上层
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: -size.width * 0.36, y: trunkH1 - 0.2, z: size.depth * 0.14 }, scaling: { x: 1.3, y: 0.15, z: 0.95 } }, { parent: node });

    // 云片 3 - 顶冠主伞 (大)
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.52, segments: 10
    }, { position: { x: size.width * 0.02, y: trunkH1 + trunkH2 + trunkH3 + trunkH4, z: size.depth * 0.05 }, scaling: { x: 1.38, y: 0.16, z: 1.05 } }, { parent: node });

    // 云片 4 - 顶部前偏低云片
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: -size.width * 0.12, y: trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.15, z: size.depth * 0.15 }, scaling: { x: 1.25, y: 0.15, z: 0.9 } }, { parent: node });

    // 云片 5 - 顶部后偏低云片
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: size.width * 0.16, y: trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.1, z: -size.depth * 0.08 }, scaling: { x: 1.28, y: 0.14, z: 0.95 } }, { parent: node });

    // 云片 6 - 右侧主平衡云片
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.44, segments: 8
    }, { position: { x: size.width * 0.36, y: trunkH1 + trunkH2 + 0.3, z: -size.depth * 0.02 }, scaling: { x: 1.35, y: 0.15, z: 1.0 } }, { parent: node });

    // 云片 7 - 右后副云片
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: size.width * 0.28, y: trunkH1 + trunkH2 + 0.15, z: -size.depth * 0.15 }, scaling: { x: 1.2, y: 0.14, z: 0.9 } }, { parent: node });

    // 云片 8 - 后侧大背景云片
    sphereComponent(registry, item, landscapeCourtyardPineTree, 'pine-foliage', {
      diameter: size.width * 0.45, segments: 8
    }, { position: { x: size.width * 0.01, y: trunkH1 + trunkH2 + trunkH3 - 0.05, z: -size.depth * 0.3 }, scaling: { x: 1.25, y: 0.16, z: 0.95 } }, { parent: node });
  }

};

export const landscapeGinkgoTree = {
  type: 'landscape_ginkgo_tree',
  name: '金黄银杏树',
  defaultSize: { width: 44, depth: 44, height: 96 },
  components: [
    { id: 'ginkgo-trunk', label: '直立树干', defaultColor: '#5d4037' },
    { id: 'ginkgo-leaves', label: '金黄银杏叶', defaultColor: '#fdd835' }
  ],
  build(registry, item, node, size) {
    // 3段曲折渐细的主侧枝
    const trunkH1 = size.height * 0.22;
    const trunk1 = cylinderComponent(registry, item, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.08, height: trunkH1, tessellation: 8
    }, { position: { x: -size.width * 0.02, y: trunkH1 / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = -0.06;

    const trunkH2 = size.height * 0.18;
    const trunk2 = cylinderComponent(registry, item, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.06, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.01, y: trunkH1 + trunkH2 / 2 - 0.02, z: size.depth * 0.02 } }, { parent: node });
    trunk2.rotation.z = 0.08;
    trunk2.rotation.x = 0.05;

    const trunkH3 = size.height * 0.16;
    const trunk3 = cylinderComponent(registry, item, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: trunkH3, tessellation: 8
    }, { position: { x: -size.width * 0.01, y: trunkH1 + trunkH2 + trunkH3 / 2 - 0.04, z: -size.depth * 0.01 } }, { parent: node });
    trunk3.rotation.z = -0.05;

    // 侧枝分杈 1 (从第二段分出)
    const branch1 = cylinderComponent(registry, item, landscapeGinkgoTree, 'ginkgo-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.04, height: size.height * 0.2, tessellation: 6
    }, { position: { x: size.width * 0.08, y: trunkH1 + trunkH2 * 0.5, z: size.depth * 0.08 } }, { parent: node });
    branch1.rotation.x = 0.5;
    branch1.rotation.z = 0.4;

    // 侧枝分杈 2 (从第三段分出)
    const branch2 = cylinderComponent(registry, item, landscapeGinkgoTree, 'ginkgo-trunk', {
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
      const leafGroup = sphereComponent(registry, item, landscapeGinkgoTree, 'ginkgo-leaves', {
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
      const fallen = sphereComponent(registry, item, landscapeGinkgoTree, 'ginkgo-leaves', {
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
  name: '修剪灌木球',
  defaultSize: { width: 24, depth: 24, height: 24 },
  components: [
    { id: 'shrub-foliage', label: '修剪碧绿树冠', defaultColor: '#33691e' }
  ],
  build(registry, item, node, size) {
    const fenceH = size.height * 0.15;
    const wallT = size.width * 0.06;
    const wallR = size.width * 0.48 - wallT / 2;
    const boardW = size.width * 0.38;
    const segments = 8;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallR;
      const z = Math.sin(angle) * wallR;
      const wall = boxComponent(registry, item, landscapeShrubBall, 'shrub-foliage', {
        width: wallT, height: fenceH, depth: boardW
      }, { position: { x: x, y: fenceH / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    cylinderComponent(registry, item, landscapeShrubBall, 'shrub-foliage', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.88, height: fenceH * 0.8, tessellation: 8
    }, { position: { x: 0, y: fenceH * 0.4, z: 0 } }, { parent: node });

    const startY = fenceH;
    
    sphereComponent(registry, item, landscapeShrubBall, 'shrub-foliage', {
      diameter: size.width * 0.72, segments: 12
    }, { position: { x: 0, y: startY + (size.height - startY) * 0.38, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeShrubBall, 'shrub-foliage', {
      diameter: size.width * 0.58, segments: 10
    }, { position: { x: size.width * 0.15, y: startY + (size.height - startY) * 0.58, z: -size.depth * 0.12 } }, { parent: node });

    sphereComponent(registry, item, landscapeShrubBall, 'shrub-foliage', {
      diameter: size.width * 0.46, segments: 8
    }, { position: { x: -size.width * 0.14, y: startY + (size.height - startY) * 0.72, z: size.depth * 0.14 } }, { parent: node });
  }
};

export const landscapeCherryTree = {
  type: 'landscape_cherry_tree',
  name: '粉红樱花树',
  defaultSize: { width: 52, depth: 52, height: 90 },
  components: [
    { id: 'cherry-trunk', label: '屈曲老干', defaultColor: '#4e342e' },
    { id: 'cherry-blossoms', label: '粉粉樱花', defaultColor: '#f48fb1' }
  ],
  build(registry, item, node, size) {
    // 1. 黑褐色老樱木曲折多杈树干
    const trunkH1 = size.height * 0.20;
    const trunk1 = cylinderComponent(registry, item, landscapeCherryTree, 'cherry-trunk', {
      diameterTop: size.width * 0.08, diameterBottom: size.width * 0.11, height: trunkH1, tessellation: 8
    }, { position: { x: -size.width * 0.03, y: trunkH1 / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = -0.1;

    const trunkH2 = size.height * 0.18;
    const trunk2 = cylinderComponent(registry, item, landscapeCherryTree, 'cherry-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.08, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.02, y: trunkH1 + trunkH2 / 2 - 0.02, z: size.depth * 0.03 } }, { parent: node });
    trunk2.rotation.z = 0.15;
    trunk2.rotation.x = 0.08;

    const trunkH3 = size.height * 0.15;
    const trunk3 = cylinderComponent(registry, item, landscapeCherryTree, 'cherry-trunk', {
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

      const branch = cylinderComponent(registry, item, landscapeCherryTree, 'cherry-trunk', {
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
      const cluster = sphereComponent(registry, item, landscapeCherryTree, 'cherry-blossoms', {
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

      const petal = sphereComponent(registry, item, landscapeCherryTree, 'cherry-blossoms', {
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
  components: [
    { id: 'birch-trunk', label: '银白白桦干', defaultColor: '#eceff1' },
    { id: 'birch-foliage', label: '婆娑绿叶', defaultColor: '#43a047' }
  ],
  build(registry, item, node, size) {
    const trunkH = size.height * 0.62;
    // 白色主干
    cylinderComponent(registry, item, landscapeBirchTree, 'birch-trunk', {
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

      const branch = cylinderComponent(registry, item, landscapeBirchTree, 'birch-trunk', {
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

      const scar = boxComponent(registry, item, landscapeBirchTree, 'birch-trunk', {
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
      cylinderComponent(registry, item, landscapeBirchTree, 'birch-foliage', {
        diameterTop: 0.01, diameterBottom: ly.d, height: ly.h, tessellation: 10
      }, { position: { x: 0, y: ly.y, z: 0 } }, { parent: node });
    });
  }
};

export const landscapeWillowTree = {
  type: 'landscape_willow_tree',
  name: '垂柳树',
  defaultSize: { width: 56, depth: 56, height: 96 },
  components: [
    { id: 'willow-trunk', label: '弯柳曲干', defaultColor: '#5d4037' },
    { id: 'willow-leaves', label: '拂水柔条', defaultColor: '#81c784' }
  ],
  build(registry, item, node, size) {
    // 1. 主干曲折微倾
    const trunkH1 = size.height * 0.28;
    const trunk1 = cylinderComponent(registry, item, landscapeWillowTree, 'willow-trunk', {
      diameterTop: size.width * 0.075, diameterBottom: size.width * 0.09, height: trunkH1, tessellation: 8
    }, { position: { x: size.width * 0.01, y: trunkH1 / 2, z: 0 } }, { parent: node });
    trunk1.rotation.z = 0.08;

    const trunkH2 = size.height * 0.24;
    const trunk2 = cylinderComponent(registry, item, landscapeWillowTree, 'willow-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.075, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.04, y: trunkH1 + trunkH2 / 2 - 0.02, z: -size.depth * 0.02 } }, { parent: node });
    trunk2.rotation.z = -0.05;
    trunk2.rotation.x = 0.06;

    // 发散枝头
    const branchEnds = [
      { x: -size.width * 0.26, y: size.height * 0.60, z: size.depth * 0.24 },
      { x: size.width * 0.28, y: size.height * 0.63, z: size.depth * 0.20 },
      { x: -size.width * 0.20, y: size.height * 0.58, z: -size.depth * 0.26 },
      { x: size.width * 0.24, y: size.height * 0.64, z: -size.depth * 0.22 }
    ];

    branchEnds.forEach((end) => {
      const bx = (size.width * 0.04 + end.x) / 2;
      const bz = (-size.depth * 0.02 + end.z) / 2;
      const by = (trunkH1 + trunkH2 + end.y) / 2;
      const dx = end.x - size.width * 0.04;
      const dy = end.y - (trunkH1 + trunkH2);
      const dz = end.z - (-size.depth * 0.02);
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

      const branch = cylinderComponent(registry, item, landscapeWillowTree, 'willow-trunk', {
        diameterTop: size.width * 0.025, diameterBottom: size.width * 0.045, height: distance, tessellation: 6
      }, { position: { x: bx, y: by, z: bz } }, { parent: node });
      
      branch.rotation.y = -Math.atan2(dz, dx);
      branch.rotation.z = Math.acos(dy / distance) - Math.PI / 2;
    });

    // 2. 垂丝柳条
    branchEnds.forEach((end, bIdx) => {
      const willowCount = 6;
      for (let w = 0; w < willowCount; w++) {
        const angle = (w * 2 * Math.PI) / willowCount;
        const startX = end.x + Math.cos(angle) * size.width * 0.06;
        const startZ = end.z + Math.sin(angle) * size.depth * 0.06;
        let currentX = startX;
        let currentY = end.y - 0.02;
        let currentZ = startZ;

        const segmentCount = 3;
        const segH = size.height * 0.13;

        let rotX = 0.12 * Math.sin(angle + bIdx) + 0.08;
        let rotZ = 0.12 * Math.cos(angle - bIdx) + 0.06;

        for (let s = 0; s < segmentCount; s++) {
          const halfH = segH / 2;
          const dx = Math.sin(rotZ) * halfH;
          const dz = -Math.sin(rotX) * halfH;
          const dy = -Math.cos(rotZ) * Math.cos(rotX) * halfH;

          const seg = cylinderComponent(registry, item, landscapeWillowTree, 'willow-leaves', {
            diameterTop: size.width * 0.007,
            diameterBottom: size.width * 0.007,
            height: segH,
            tessellation: 4
          }, {
            position: {
              x: currentX + dx,
              y: currentY + dy,
              z: currentZ + dz
            }
          }, { parent: node });

          seg.rotation.x = rotX;
          seg.rotation.z = rotZ;

          currentX += dx * 2;
          currentZ += dz * 2;
          currentY += dy * 2;

          rotX += 0.07 * Math.sin(s + w);
          rotZ += 0.07 * Math.cos(s - w);
        }
      }
    });
  }
};

export const landscapeCoconutTree = {
  type: 'landscape_coconut_tree',
  name: '弯曲椰子树',
  defaultSize: { width: 48, depth: 48, height: 100 },
  components: [
    { id: 'coconut-trunk', label: '环纹椰林干', defaultColor: '#8d6e63' },
    { id: 'coconut-leaves', label: '羽状巨大椰叶', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
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
      
      const seg = cylinderComponent(registry, item, landscapeCoconutTree, 'coconut-trunk', {
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
      
      sphereComponent(registry, item, landscapeCoconutTree, 'coconut-trunk', {
        diameter: cocoRadius * 2, segments: 12
      }, { position: { x: cocoX, y: cocoY, z: cocoZ } }, { parent: node });
    }

    for (let p = 0; p < 6; p++) {
      const yaw = p * (Math.PI / 3);
      let stemPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
      let pitch = -0.15;
      const numSubSegs = 5;
      const subSegL = (size.width * 0.46) / numSubSegs;
      
      for (let k = 0; k < numSubSegs; k++) {
        pitch += 0.24;
        
        const dx = Math.cos(yaw) * Math.cos(pitch);
        const dy = -Math.sin(pitch);
        const dz = Math.sin(yaw) * Math.cos(pitch);
        
        const cX = stemPos.x + dx * (subSegL / 2);
        const cY = stemPos.y + dy * (subSegL / 2);
        const cZ = stemPos.z + dz * (subSegL / 2);
        
        const stemSeg = cylinderComponent(registry, item, landscapeCoconutTree, 'coconut-leaves', {
          diameterTop: size.width * 0.005, diameterBottom: size.width * 0.008, height: subSegL, tessellation: 4
        }, { position: { x: cX, y: cY, z: cZ } }, { parent: node });
        
        stemSeg.rotation.x = Math.sin(yaw) * pitch;
        stemSeg.rotation.y = -yaw;
        stemSeg.rotation.z = -Math.cos(yaw) * pitch;
        
        const sideX = -Math.sin(yaw);
        const sideZ = Math.cos(yaw);
        
        [-1, 1].forEach((sideSign) => {
          const pinnaW = size.width * 0.15;
          const pinnaH = 0.002;
          const pinnaD = size.width * 0.016;
          
          const pX = cX + sideX * sideSign * (pinnaW / 2);
          const pY = cY - 0.01;
          const pZ = cZ + sideZ * sideSign * (pinnaW / 2);
          
          const pinna = boxComponent(registry, item, landscapeCoconutTree, 'coconut-leaves', {
            width: pinnaW, height: pinnaH, depth: pinnaD
          }, { position: { x: pX, y: pY, z: pZ } }, { parent: node });
          
          pinna.rotation.y = -yaw + sideSign * 0.38;
          pinna.rotation.z = -Math.cos(yaw) * (pitch + 0.18) + sideSign * Math.sin(yaw) * 0.15;
          pinna.rotation.x = Math.sin(yaw) * (pitch + 0.18) + sideSign * Math.cos(yaw) * 0.15;
        });
        
        stemPos.x += dx * subSegL;
        stemPos.y += dy * subSegL;
        stemPos.z += dz * subSegL;
      }
    }
  }
};

export const landscapePalmTree = {
  type: 'landscape_palm_tree',
  name: '针状棕榈树',
  defaultSize: { width: 44, depth: 44, height: 84 },
  components: [
    { id: 'palm-trunk', label: '鳞片棕树干', defaultColor: '#7e57c2' },
    { id: 'palm-leaves', label: '扇形棕榈叶', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const numTrunkSegs = 10;
    const trunkH = size.height * 0.68;
    const segH = (trunkH / numTrunkSegs) * 1.25;

    for (let j = 0; j < numTrunkSegs; j++) {
      const progress = j / numTrunkSegs;
      const baseD = size.width * 0.15 * (1.0 - progress * 0.35);
      
      const dBot = baseD * 0.88;
      const dTop = baseD * 1.28;
      
      const yPos = (j * (trunkH / numTrunkSegs)) + (segH / 2);
      
      cylinderComponent(registry, item, landscapePalmTree, 'palm-trunk', {
        diameterTop: dTop, diameterBottom: dBot, height: segH, tessellation: 8
      }, { position: { x: 0, y: yPos, z: 0 } }, { parent: node });
    }

    const numLeaves = 12;
    const leafParts = 5;
    const leafPartL = (size.width * 0.55) / leafParts;

    for (let p = 0; p < numLeaves; p++) {
      const yaw = p * (2 * Math.PI / numLeaves);
      let curPos = { x: 0, y: trunkH, z: 0 };
      let pitch = -0.22;
      
      for (let k = 0; k < leafParts; k++) {
        pitch += 0.25;
        
        const dx = Math.cos(yaw) * Math.cos(pitch);
        const dy = -Math.sin(pitch);
        const dz = Math.sin(yaw) * Math.cos(pitch);
        
        const cX = curPos.x + dx * (leafPartL / 2);
        const cY = curPos.y + dy * (leafPartL / 2);
        const cZ = curPos.z + dz * (leafPartL / 2);
        
        const dBot = size.width * 0.022 * (1.0 - (k / leafParts) * 0.85);
        const dTop = size.width * 0.022 * (1.0 - ((k + 1) / leafParts) * 0.85);
        
        const leafSeg = cylinderComponent(registry, item, landscapePalmTree, 'palm-leaves', {
          diameterTop: dTop, diameterBottom: dBot, height: leafPartL, tessellation: 5
        }, { position: { x: cX, y: cY, z: cZ } }, { parent: node });
        
        leafSeg.rotation.x = Math.sin(yaw) * pitch;
        leafSeg.rotation.y = -yaw;
        leafSeg.rotation.z = -Math.cos(yaw) * pitch;
        
        curPos.x += dx * leafPartL;
        curPos.y += dy * leafPartL;
        curPos.z += dz * leafPartL;
      }
    }
  }
};

export const landscapeGroundCactus = {
  type: 'landscape_ground_cactus',
  name: '地面仙人掌丛',
  defaultSize: { width: 32, depth: 24, height: 36 },
  components: [
    { id: 'cactus-stem', label: '仙人掌肉质茎', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.15;
    cylinderComponent(registry, item, landscapeGroundCactus, 'cactus-stem', {
      diameterTop: size.width * 0.95, diameterBottom: size.width * 0.85, height: potH, tessellation: 12
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, landscapeGroundCactus, 'cactus-stem', {
      diameterTop: size.width * 0.9, diameterBottom: size.width * 0.9, height: potH * 0.8, tessellation: 8
    }, { position: { x: 0, y: potH * 0.45, z: 0 } }, { parent: node });

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
      const py = pad.pos.y * size.height;
      const pz = pad.pos.z * size.depth;

      const sMesh = sphereComponent(registry, item, landscapeGroundCactus, 'cactus-stem', {
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

        const needle = cylinderComponent(registry, item, landscapeGroundCactus, 'cactus-stem', {
          diameterTop: 0, diameterBottom: size.width * 0.006, height: needleL, tessellation: 3
        }, {
          position: { x: px + rx, y: py + ry, z: pz + rz }
        }, { parent: node });
        
        needle.rotation.x = phi + pad.rot.x;
        needle.rotation.y = theta + pad.rot.y;
      }

      if (pad.name.includes('_1') || pad.name === 'A3' || pad.name === 'C3') {
        const flowerY = py + pad.scale.y * size.width * 0.45;
        sphereComponent(registry, item, landscapeGroundCactus, 'cactus-stem', {
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
  name: '月季花丛',
  defaultSize: { width: 36, depth: 28, height: 24 },
  components: [
    { id: 'bush-leaves', label: '月季绿叶丛', defaultColor: '#33691e' },
    { id: 'bush-flowers', label: '盛开月季红花', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
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

      const stem = cylinderComponent(registry, item, landscapeRoseBush, 'bush-leaves', {
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
        const thorn = cylinderComponent(registry, item, landscapeRoseBush, 'bush-leaves', {
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

      const leaf = sphereComponent(registry, item, landscapeRoseBush, 'bush-leaves', {
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

      sphereComponent(registry, item, landscapeRoseBush, 'bush-leaves', {
        diameter: size.width * 0.075 * rose.scale, segments: 6
      }, {
        position: { x: rx, y: ry - size.height * 0.02, z: rz },
        scaling: { x: 1.2, y: 0.2, z: 1.2 }
      }, { parent: node });

      const outerFl = sphereComponent(registry, item, landscapeRoseBush, 'bush-flowers', {
        diameter: size.width * 0.09 * rose.scale, segments: 8
      }, {
        position: { x: rx, y: ry, z: rz },
        scaling: { x: 1.3, y: 0.4, z: 1.3 }
      }, { parent: node });
      outerFl.rotation.y = 0.5;

      sphereComponent(registry, item, landscapeRoseBush, 'bush-flowers', {
        diameter: size.width * 0.065 * rose.scale, segments: 6
      }, {
        position: { x: rx, y: ry + size.height * 0.015, z: rz },
        scaling: { x: 0.9, y: 0.75, z: 0.9 }
      }, { parent: node });
    });
  }
};

export const landscapeLavenderField = {
  type: 'landscape_lavender_field',
  name: '薰衣草花田',
  defaultSize: { width: 48, depth: 36, height: 22 },
  components: [
    { id: 'lavender-base', label: '草甸基泥', defaultColor: '#6d4c41' },
    { id: 'lavender-stems', label: '薰衣草花茎', defaultColor: '#43a047' },
    { id: 'lavender-spike', label: '紫色穗状花序', defaultColor: '#ba68c8' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, landscapeLavenderField, 'lavender-base', {
      width: size.width, height: size.height * 0.1, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.05, z: 0 } }, { parent: node });

    const hill = sphereComponent(registry, item, landscapeLavenderField, 'lavender-base', {
      diameter: size.width * 0.95, segments: 16
    }, { position: { x: 0, y: -size.width * 0.35 + size.height * 0.2, z: 0 } }, { parent: node });
    hill.scaling = new BABYLON.Vector3(1, 0.8, size.depth / size.width);

    const count = 14;
    const scene = node.getScene();
    
    for (let i = 0; i < count; i++) {
      const theta = i * 2.39996;
      const r = Math.sqrt(i / (count - 1)) * 0.35;
      const px = Math.cos(theta) * r * size.width;
      const pz = Math.sin(theta) * r * size.depth;
      
      const distSq = (px * px) / (size.width * size.width) + (pz * pz) / (size.depth * size.depth);
      const py = size.height * 0.15 + (1 - distSq) * size.height * 0.1;

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

        const stem = cylinderComponent(registry, item, landscapeLavenderField, 'lavender-stems', {
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
          
          const spikeSeg = cylinderComponent(registry, item, landscapeLavenderField, 'lavender-spike', {
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
  name: '向日葵花丛',
  defaultSize: { width: 40, depth: 28, height: 48 },
  components: [
    { id: 'sunflower-stem', label: '向日葵花茎', defaultColor: '#4caf50' },
    { id: 'sunflower-head', label: '金黄向阳花盘', defaultColor: '#ffeb3b' },
    { id: 'sunflower-core', label: '黑褐花蕊芯', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
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
        
        const stem = cylinderComponent(registry, item, landscapeSunflowerPatch, 'sunflower-stem', {
          diameterTop: size.width * 0.02, diameterBottom: size.width * 0.035, height: stemH, tessellation: 8
        }, { position: { x: px, y: stemH / 2, z: pz } }, { parent: node });
        stem.rotation.x = (Math.random() - 0.5) * 0.08;
        stem.rotation.z = (Math.random() - 0.5) * 0.08;
        
        for (let l = 0; l < 2; l++) {
          const leafY = stemH * (0.35 + l * 0.25);
          const leafRot = l * Math.PI * 0.7 + Math.random() * 0.2;
          const leafL = size.width * 0.15;
          
          const leaf = sphereComponent(registry, item, landscapeSunflowerPatch, 'sunflower-stem', {
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
        const headBase = cylinderComponent(registry, item, landscapeSunflowerPatch, 'sunflower-head', {
          diameterTop: headRadius * 2, diameterBottom: headRadius * 2, height: size.width * 0.02, tessellation: 12
        }, { position: { x: 0, y: 0, z: 0 } }, { parent: headNode });
        headBase.rotation.x = Math.PI / 2;

        const coreRadius = headRadius * 0.55;
        const core = cylinderComponent(registry, item, landscapeSunflowerPatch, 'sunflower-core', {
          diameterTop: coreRadius * 2, diameterBottom: coreRadius * 2, height: size.width * 0.022, tessellation: 12
        }, { position: { x: 0, y: 0, z: size.width * 0.005 } }, { parent: headNode });
        core.rotation.x = Math.PI / 2;

        // const petalCount = 12;
        // const petalL = headRadius * 0.7;
        // const petalW = headRadius * 0.25;
        
        // for (let p = 0; p < petalCount; p++) {
        //   const angle = (p * Math.PI * 2) / petalCount;
        //   const petal = sphereComponent(registry, item, landscapeSunflowerPatch, 'sunflower-head', {
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
  name: '岸边芦苇荡',
  defaultSize: { width: 44, depth: 24, height: 72 },
  components: [
    { id: 'reed-culm', label: '纤细芦苇杆', defaultColor: '#d7ccc8' },
    { id: 'reed-plume', label: '绒毛花穗', defaultColor: '#efebe9' }
  ],
  build(registry, item, node, size) {
    const scene = node.getScene();

    boxComponent(registry, item, landscapeReedMarsh, 'reed-culm', {
      width: size.width, height: size.height * 0.02, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.01, z: 0 } }, { parent: node });

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
      reedNode.position = new BABYLON.Vector3(px, size.height * 0.02, pz);
      reedNode.rotation.x = (Math.random() - 0.5) * 0.18;
      reedNode.rotation.z = (Math.random() - 0.5) * 0.18;
      reedNode.rotation.y = Math.random() * Math.PI * 2;

      cylinderComponent(registry, item, landscapeReedMarsh, 'reed-culm', {
        diameterTop: stemD * 0.6, diameterBottom: stemD, height: stemH, tessellation: 6
      }, { position: { x: 0, y: stemH / 2, z: 0 } }, { parent: reedNode });

      for (let l = 0; l < 2; l++) {
        const leafH = stemH * (0.35 + l * 0.15);
        const leaf = sphereComponent(registry, item, landscapeReedMarsh, 'reed-culm', {
          diameter: leafH, segments: 6
        }, { position: { x: 0, y: stemH * (0.3 + l * 0.2), z: 0 } }, { parent: reedNode });
        
        leaf.scaling = new BABYLON.Vector3(0.06, 1, 0.15);
        leaf.rotation.z = 0.4 + Math.random() * 0.2;
        leaf.rotation.y = l * Math.PI * 0.8 + Math.random() * 0.5;
      }

      const plumeCenterY = stemH + plumeH / 2;
      const plumeRadius = stemD * 2.5;

      for (let p = 0; p < 3; p++) {
        const segPlume = sphereComponent(registry, item, landscapeReedMarsh, 'reed-plume', {
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
  name: '单株大芭蕉',
  defaultSize: { width: 36, depth: 36, height: 64 },
  components: [
    { id: 'leaf-stem', label: '芭蕉柄茎', defaultColor: '#7cb342' },
    { id: 'leaf-blade', label: '油亮大芭蕉叶', defaultColor: '#558b2f' }
  ],
  build(registry, item, node, size) {
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
      
      const pulse = cylinderComponent(registry, item, landscapeBananaLeafSingle, 'leaf-stem', {
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
          
          const bladePart = boxComponent(registry, item, landscapeBananaLeafSingle, 'leaf-blade', {
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
  name: '绿茵草坪',
  defaultSize: { width: 96, depth: 96, height: 1.5 },
  components: [
    { id: 'lawn-grass', label: '剪绒青草', defaultColor: '#558b2f' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, landscapeGrassLawn, 'lawn-grass', {
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

        const blade = sphereComponent(registry, item, landscapeGrassLawn, 'lawn-grass', {
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
  name: '苔藓石板小径',
  defaultSize: { width: 72, depth: 24, height: 2 },
  components: [
    { id: 'moss-base', label: '翠绿苔藓地', defaultColor: '#689f38' },
    { id: 'moss-slates', label: '错落石板', defaultColor: '#4f5d65' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, landscapeMossPath, 'moss-base', {
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

      boxComponent(registry, item, landscapeMossPath, 'moss-slates', {
        width: sl.w, height: size.height * 0.7, depth: sl.d
      }, { position: { x: 0, y: size.height * 0.35, z: 0 } }, { parent: slateNode });

      const sideSlate = boxComponent(registry, item, landscapeMossPath, 'moss-slates', {
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
      const mossSpot = sphereComponent(registry, item, landscapeMossPath, 'moss-base', {
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
  name: '蒲公英地',
  defaultSize: { width: 36, depth: 24, height: 18 },
  components: [
    { id: 'dandelion-leaves', label: '蓬乱杂草地', defaultColor: '#689f38' },
    { id: 'dandelion-puff', label: '绒毛白色果球', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const scene = node.getScene();

    boxComponent(registry, item, landscapeDandelionPatch, 'dandelion-leaves', {
      width: size.width, height: size.height * 0.15, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.075, z: 0 } }, { parent: node });

    const mound = sphereComponent(registry, item, landscapeDandelionPatch, 'dandelion-leaves', {
      diameter: size.width * 0.85, segments: 10
    }, { position: { x: 0, y: -size.width * 0.35 + size.height * 0.22, z: 0 } }, { parent: node });
    mound.scaling = new BABYLON.Vector3(1, 0.7, size.depth / size.width);

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
        
        const leaf = boxComponent(registry, item, landscapeDandelionPatch, 'dandelion-leaves', {
          width: leafL, height: size.height * 0.02, depth: leafW
        }, { position: { x: lc.x + Math.cos(angle) * leafL * 0.4, y: size.height * 0.16, z: lc.z + Math.sin(angle) * leafL * 0.4 } }, { parent: node });
        
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
      const stem = cylinderComponent(registry, item, landscapeDandelionPatch, 'dandelion-leaves', {
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
      sphereComponent(registry, item, landscapeDandelionPatch, 'dandelion-puff', {
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

        const spoke = cylinderComponent(registry, item, landscapeDandelionPatch, 'dandelion-puff', {
          diameterTop: size.width * 0.003, diameterBottom: size.width * 0.003, height: spokeL, tessellation: 4
        }, { position: { x: dx * spokeL * 0.5, y: dy * spokeL * 0.5, z: dz * spokeL * 0.5 } }, { parent: puffNode });
        spoke.lookAt(new BABYLON.Vector3(dx * 10, dy * 10, dz * 10));
        spoke.rotation.x += Math.PI / 2;

        sphereComponent(registry, item, landscapeDandelionPatch, 'dandelion-puff', {
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
      const stem = cylinderComponent(registry, item, landscapeDandelionPatch, 'dandelion-leaves', {
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
        const flDisk = cylinderComponent(registry, item, landscapeDandelionPatch, 'dandelion-puff', {
          diameterTop: layD, diameterBottom: layD, height: size.height * 0.02, tessellation: 8
        }, { position: { x: 0, y: y * size.height * 0.015, z: 0 } }, { parent: flNode });
        flDisk.rotation.y = y * 0.6;
      }
    });
  }
};

export const landscapeMorningGloryFence = {
  type: 'landscape_morning_glory_fence',
  name: '牵牛花竹篱',
  defaultSize: { width: 72, depth: 8, height: 36 },
  components: [
    { id: 'fence-bamboo', label: '编织竹篱架', defaultColor: '#d7ccc8' },
    { id: 'fence-vines', label: '绿油蔓藤', defaultColor: '#4caf50' },
    { id: 'fence-blooms', label: '朝开喇叭花', defaultColor: '#7c4dff' }
  ],
  build(registry, item, node, size) {
    const postW = size.width * 0.04;
    [-0.45, -0.15, 0.15, 0.45].forEach((ratio) => {
      boxComponent(registry, item, landscapeMorningGloryFence, 'fence-bamboo', {
        width: postW, height: size.height, depth: size.depth * 0.6
      }, { position: { x: ratio * size.width, y: size.height / 2, z: 0 } }, { parent: node });
    });

    [-0.32, 0, 0.32].forEach((ratio) => {
      boxComponent(registry, item, landscapeMorningGloryFence, 'fence-bamboo', {
        width: size.width, height: postW, depth: size.depth * 0.5
      }, { position: { x: 0, y: size.height * 0.5 + ratio * size.height * 0.8, z: 0 } }, { parent: node });
    });

    boxComponent(registry, item, landscapeMorningGloryFence, 'fence-vines', {
      width: size.width * 0.88, height: size.height * 0.65, depth: size.depth * 0.8
    }, { position: { x: 0, y: size.height * 0.52, z: 0.01 } }, { parent: node });

    const bloomPos = [
      { x: -size.width * 0.22, y: size.height * 0.62 },
      { x: size.width * 0.15, y: size.height * 0.72 },
      { x: -size.width * 0.02, y: size.height * 0.36 }
    ];
    bloomPos.forEach((bp) => {
      sphereComponent(registry, item, landscapeMorningGloryFence, 'fence-blooms', {
        diameter: size.width * 0.07, segments: 6
      }, { position: { x: bp.x, y: bp.y, z: 0.03 } }, { parent: node });
    });
  }
};

export const landscapeHydrangeaBush = {
  type: 'landscape_hydrangea_bush',
  name: '绣球花丛',
  defaultSize: { width: 32, depth: 32, height: 26 },
  components: [
    { id: 'hydrangea-foliage', label: '油亮大叶丛', defaultColor: '#43a047' },
    { id: 'hydrangea-blooms', label: '团团团花簇', defaultColor: '#4fc3f7' }
  ],
  build(registry, item, node, size) {
    const leafCount = 9;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * 2 * Math.PI) / leafCount;
      const lx = Math.cos(angle) * size.width * 0.25;
      const lz = Math.sin(angle) * size.depth * 0.25;
      const ly = size.height * 0.15 + Math.sin(i * 3) * 0.02;

      const leaf = sphereComponent(registry, item, landscapeHydrangeaBush, 'hydrangea-foliage', {
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

      const stem = cylinderComponent(registry, item, landscapeHydrangeaBush, 'hydrangea-foliage', {
        diameterTop: size.width * 0.016, diameterBottom: size.width * 0.024, height: len, tessellation: 6
      }, {
        position: { x: (startX + fx) / 2, y: (startY + (fy - size.height * 0.08)) / 2, z: (startZ + fz) / 2 }
      }, { parent: node });
      stem.rotation.x = pitch;
      stem.rotation.y = yaw;

      const centerD = size.width * 0.16 * hc.sizeMult;
      const subD = size.width * 0.11 * hc.sizeMult;

      sphereComponent(registry, item, landscapeHydrangeaBush, 'hydrangea-blooms', {
        diameter: centerD, segments: 8
      }, { position: { x: fx, y: fy, z: fz } }, { parent: node });

      const offsets = [
        { dx: 0.05, dy: 0.01, dz: 0 },
        { dx: -0.05, dy: 0.01, dz: 0 },
        { dx: 0, dy: -0.02, dz: 0.05 },
        { dx: 0, dy: 0.02, dz: -0.05 }
      ];
      offsets.forEach((off) => {
        sphereComponent(registry, item, landscapeHydrangeaBush, 'hydrangea-blooms', {
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
  name: '郁金香花田',
  defaultSize: { width: 44, depth: 32, height: 20 },
  components: [
    { id: 'tulip-leaves', label: '丛生绿叶草甸', defaultColor: '#4ea8de' },
    { id: 'tulip-flowers', label: '郁金香彩朵', defaultColor: '#ff1744' }
  ],
  build(registry, item, node, size) {
    const scene = node.getScene();

    boxComponent(registry, item, landscapeTulipField, 'tulip-leaves', {
      width: size.width, height: size.height * 0.15, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.075, z: 0 } }, { parent: node });

    const hill = sphereComponent(registry, item, landscapeTulipField, 'tulip-leaves', {
      diameter: size.width * 0.92, segments: 12
    }, { position: { x: 0, y: -size.width * 0.35 + size.height * 0.22, z: 0 } }, { parent: node });
    hill.scaling = new BABYLON.Vector3(1, 0.7, size.depth / size.width);

    const count = 16;
    for (let i = 0; i < count; i++) {
      const theta = i * 2.39996;
      const r = Math.sqrt(i / (count - 1)) * 0.4;
      const px = Math.cos(theta) * r * size.width;
      const pz = Math.sin(theta) * r * size.depth;

      const distSq = (px * px) / (size.width * size.width) + (pz * pz) / (size.depth * size.depth);
      const py = size.height * 0.15 + (1 - distSq) * size.height * 0.08;

      const tulipNode = new BABYLON.TransformNode(`tulip_plant_${i}`, scene);
      tulipNode.parent = node;
      tulipNode.position = new BABYLON.Vector3(px, py, pz);
      tulipNode.rotation.y = Math.random() * Math.PI * 2;
      tulipNode.rotation.x = (Math.random() - 0.5) * 0.15;
      tulipNode.rotation.z = (Math.random() - 0.5) * 0.15;

      const stalkH = size.height * (0.45 + Math.random() * 0.2);
      const stalkD = size.width * 0.015;

      cylinderComponent(registry, item, landscapeTulipField, 'tulip-leaves', {
        diameterTop: stalkD, diameterBottom: stalkD, height: stalkH, tessellation: 6
      }, { position: { x: 0, y: stalkH / 2, z: 0 } }, { parent: tulipNode });

      for (let l = 0; l < 2; l++) {
        const leafAngle = l * Math.PI + (Math.random() - 0.5) * 0.4;
        const leafH = stalkH * (0.6 + Math.random() * 0.35);
        
        const leaf = sphereComponent(registry, item, landscapeTulipField, 'tulip-leaves', {
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

      const petal1 = sphereComponent(registry, item, landscapeTulipField, 'tulip-flowers', {
        diameter: flowerH, segments: 8
      }, { position: { x: 0, y: flowerY + flowerH * 0.35, z: -flowerW * 0.1 } }, { parent: tulipNode });
      petal1.scaling = new BABYLON.Vector3(flowerW / flowerH, 1, (flowerW * 0.9) / flowerH);
      petal1.rotation.x = 0.08;

      const petal2 = sphereComponent(registry, item, landscapeTulipField, 'tulip-flowers', {
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
  name: '塔形落叶松',
  defaultSize: { width: 36, depth: 36, height: 96 },
  components: [
    { id: 'larch-trunk', label: '红棕松树干', defaultColor: '#5d4037' },
    { id: 'larch-foliage', label: '松针塔叶', defaultColor: '#004d40' }
  ],
  build(registry, item, node, size) {
    // 1. 笔直挺拔的主干
    cylinderComponent(registry, item, landscapeLarchTree, 'larch-trunk', {
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

        const branch = cylinderComponent(registry, item, landscapeLarchTree, 'larch-trunk', {
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

          const leaf = sphereComponent(registry, item, landscapeLarchTree, 'larch-foliage', {
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

export const landscapeWindingStream = {
  type: 'landscape_winding_stream',
  name: '弯曲流溪',
  defaultSize: { width: 90, depth: 36, height: 1.8 },
  components: [
    { id: 'stream-water', label: '溪水镜面', defaultColor: '#29b6f6' }
  ],
  build(registry, item, node, size) {
    const segments = 3;
    const segW = size.width / segments;
    for (let idx = 0; idx < segments; idx++) {
      const zOffset = idx % 2 === 0 ? size.depth * 0.12 : -size.depth * 0.12;
      boxComponent(registry, item, landscapeWindingStream, 'stream-water', {
        width: segW * 1.05, height: size.height, depth: size.depth * 0.6
      }, { position: { x: -size.width / 2 + segW * 0.5 + idx * segW, y: size.height / 2, z: zOffset } }, { parent: node });
    }
  }
};

export const landscapeNaturalSpring = {
  type: 'landscape_natural_spring',
  name: '乱石泉眼',
  defaultSize: { width: 44, depth: 44, height: 18 },
  components: [
    { id: 'spring-water', label: '涌泉清水', defaultColor: '#e0f7fa' },
    { id: 'spring-rocks', label: '护泉驳石', defaultColor: '#78909c' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, landscapeNaturalSpring, 'spring-water', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.72, height: size.height * 0.75, tessellation: 16
    }, { position: { x: 0, y: size.height * 0.375, z: 0 } }, { parent: node });

    const pebbleCoords = [
      { x: -size.width * 0.4, z: -size.width * 0.15 },
      { x: -size.width * 0.32, z: size.width * 0.3 },
      { x: 0, z: size.width * 0.45 },
      { x: size.width * 0.35, z: size.width * 0.28 },
      { x: size.width * 0.4, z: -size.width * 0.1 },
      { x: size.width * 0.25, z: -size.width * 0.36 },
      { x: -size.width * 0.22, z: -size.width * 0.38 }
    ];

    pebbleCoords.forEach((coord, i) => {
      const rockD = size.width * 0.2 + Math.cos(i) * 0.05;
      sphereComponent(registry, item, landscapeNaturalSpring, 'spring-rocks', {
        diameter: rockD, segments: 6
      }, { position: { x: coord.x, y: size.height * 0.45, z: coord.z } }, { parent: node });
    });
  }
};

export const landscapeOldWell = {
  type: 'landscape_old_well',
  name: '古朴古井',
  defaultSize: { width: 28, depth: 28, height: 42 },
  components: [
    { id: 'well-stone', label: '青砖井台', defaultColor: '#90a4ae' },
    { id: 'well-water', label: '深井水影', defaultColor: '#006064' },
    { id: 'well-wood', label: '辘轳与支架', defaultColor: '#5d4037' },
    { id: 'well-roof', label: '覆瓦井顶', defaultColor: '#37474f' }
  ],
  build(registry, item, node, size) {
    const wellH = size.height * 0.35;
    const baseBottomH = 0.02;

    // 底板
    cylinderComponent(registry, item, landscapeOldWell, 'well-stone', {
      diameterTop: size.width - 0.03, diameterBottom: size.width - 0.03, height: baseBottomH, tessellation: 16
    }, { position: { x: 0, y: baseBottomH / 2, z: 0 } }, { parent: node });

    // 8段拼接成圆型中空井圈
    const wallT = 0.035;
    const wallR = size.width / 2 - wallT / 2;
    const boardW = size.width * 0.414;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallR;
      const z = Math.sin(angle) * wallR;
      const wall = boxComponent(registry, item, landscapeOldWell, 'well-stone', {
        width: wallT, height: wellH, depth: boardW
      }, { position: { x: x, y: wellH / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    // 内嵌井水面
    cylinderComponent(registry, item, landscapeOldWell, 'well-water', {
      diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
    }, { position: { x: 0, y: wellH - 0.04, z: 0 } }, { parent: node });

    // 两根立柱
    const postH = size.height * 0.85;
    const postD = size.width * 0.06;
    [-1, 1].forEach((side) => {
      cylinderComponent(registry, item, landscapeOldWell, 'well-wood', {
        diameterTop: postD, diameterBottom: postD, height: postH, tessellation: 8
      }, { position: { x: side * (size.width / 2 - 0.04), y: postH / 2, z: 0 } }, { parent: node });
    });

    // 辘轳轴
    const axisW = size.width * 0.8;
    const axis = cylinderComponent(registry, item, landscapeOldWell, 'well-wood', {
      diameterTop: 0.02, diameterBottom: 0.03, height: axisW, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.62, z: 0 } }, { parent: node });
    axis.rotation.z = Math.PI / 2;

    // 井顶盖
    const roofY = size.height * 0.9;
    const roofH = size.height * 0.12;
    boxComponent(registry, item, landscapeOldWell, 'well-roof', {
      width: size.width * 1.1, height: roofH, depth: size.depth * 1.1
    }, { position: { x: 0, y: roofY, z: 0 } }, { parent: node });
  }
};

export const landscapeIvyWall = {
  type: 'landscape_ivy_wall',
  name: '爬山虎绿墙',
  defaultSize: { width: 72, depth: 10, height: 48 },
  components: [
    { id: 'wall-brick', label: '青砖矮墙', defaultColor: '#90a4ae' },
    { id: 'wall-leaves', label: '爬山虎绿藤', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    // 矮墙
    boxComponent(registry, item, landscapeIvyWall, 'wall-brick', {
      width: size.width, height: size.height, depth: size.depth * 0.6
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 爬山虎攀附球体
    const leavesCoords = [
      { x: -size.width * 0.38, y: size.height * 0.5, z: size.depth * 0.22, d: size.depth * 0.9 },
      { x: -size.width * 0.2, y: size.height * 0.72, z: size.depth * 0.25, d: size.depth * 1.1 },
      { x: 0, y: size.height * 0.42, z: -size.depth * 0.24, d: size.depth * 0.8 },
      { x: size.width * 0.22, y: size.height * 0.8, z: size.depth * 0.22, d: size.depth * 1.05 },
      { x: size.width * 0.38, y: size.height * 0.6, z: -size.depth * 0.25, d: size.depth * 0.95 },
      { x: -size.width * 0.1, y: size.height * 0.3, z: size.depth * 0.2, d: size.depth * 0.75 },
      { x: size.width * 0.08, y: size.height * 0.95, z: 0, d: size.depth * 1.2 }
    ];

    leavesCoords.forEach((coord) => {
      sphereComponent(registry, item, landscapeIvyWall, 'wall-leaves', {
        diameter: coord.d, segments: 6
      }, { position: { x: coord.x, y: coord.y, z: coord.z } }, { parent: node });
    });
  }
};
