import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

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
  waterControllable: true,
  name: '流水盆景',
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
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeRockeryFountain, 'water-surface', {
        width: size.width - wallT * 2, height: 0.02, depth: size.depth - wallT * 2
      }, { position: { x: 0, y: poolH - 0.02, z: 0 } }, { parent: node });
    }

    const rockY = poolH;
    sphereComponent(registry, item, landscapeRockeryFountain, 'rock-body', {
      diameter: size.width * 0.45, segments: 8
    }, { position: { x: -size.width * 0.2, y: rockY + size.height * 0.25, z: -size.depth * 0.1 } }, { parent: node });

    sphereComponent(registry, item, landscapeRockeryFountain, 'rock-body', {
      diameter: size.width * 0.35, segments: 8
    }, { position: { x: size.width * 0.15, y: rockY + size.height * 0.4, z: size.depth * 0.15 } }, { parent: node });

    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeRockeryFountain, 'water-cascade', {
        diameterTop: 0.02, diameterBottom: 0.06, height: size.height * 0.5, tessellation: 8
      }, { position: { x: 0, y: rockY + size.height * 0.25, z: 0 } }, { parent: node });
    }
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
  waterControllable: true,
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
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeKoiPond, 'pond-water', {
        width: size.width - wallT * 2, height: 0.02, depth: size.depth - wallT * 2
      }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });
    }

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

export const landscapeStoneTrough = {
  type: 'landscape_stone_trough',
  waterControllable: true,
  name: '石槽',
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

    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeStoneTrough, 'trough-water', {
        width: size.width - wallThick * 2, height: 0.02, depth: size.depth - wallThick * 2
      }, { position: { x: 0, y: size.height * 0.8, z: 0 } }, { parent: node });
    }
  }
};

export const landscapeScreenWall = {
  type: 'landscape_screen_wall',
  name: '照壁',
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
  name: '石敢当',
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
  waterControllable: true,
  name: '跌水石台',
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

    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeCascadingTerrace, 'water-curtain', {
        width: size.width * 0.65, height: h2, depth: size.width * 0.65
      }, { position: { x: 0, y: h1 + h2 / 2 + 0.01, z: 0 } }, { parent: node });
    }
  }
};

export const landscapeShishiOdoshi = {
  type: 'landscape_shishi_odoshi',
  waterControllable: true,
  name: '鹿打',
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
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeShishiOdoshi, 'basin-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: basinH - 0.02, z: 0 } }, { parent: node });
    }

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
  name: '玻璃水幕',
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
  waterControllable: true,
  name: '溪流假山',
  defaultSize: { width: 84, depth: 36, height: 18 },
  components: [
    { id: 'stream-water', label: '潺潺小溪', defaultColor: '#00b0ff' },
    { id: 'stream-pebbles', label: '护岸卵石', defaultColor: '#90a4ae' }
  ],
  build(registry, item, node, size) {
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeStreamRockery, 'stream-water', {
        width: size.width, height: size.height * 0.2, depth: size.depth * 0.65
      }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });
    }

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
  waterControllable: true,
  name: '荷花池',
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
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeLotusPond, 'lotus-water', {
        width: size.width - wallT * 2, height: 0.02, depth: size.depth - wallT * 2
      }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });
    }

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
  name: '汀步路',
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
  name: '雾森器',
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
  name: '溶洞拱门',
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
  name: '青石板路',
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
  waterControllable: true,
  name: '金属水幕',
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

    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeModernWaterWall, 'water-curtain', {
        width: size.width * 0.8, height: bodyH, depth: size.depth * 0.26
      }, { position: { x: 0, y: baseH + bodyH / 2, z: 0.01 } }, { parent: node });
    }
  }
};

export const landscapeWaterLilyPond = {
  type: 'landscape_water_lily_pond',
  waterControllable: true,
  name: '睡莲池',
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
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeWaterLilyPond, 'pond-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });
    }

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
  waterControllable: true,
  name: '风水池',
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
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, landscapeTaijiPond, 'taiji-black', {
        width: innerRadius, height: 0.02, depth: innerRadius / 2
      }, { position: { x: 0, y: size.height - 0.01, z: -innerRadius / 4 } }, { parent: node });

      boxComponent(registry, item, landscapeTaijiPond, 'taiji-white', {
        width: innerRadius, height: 0.02, depth: innerRadius / 2
      }, { position: { x: 0, y: size.height - 0.01, z: innerRadius / 4 } }, { parent: node });
    }
  }
};

export const landscapeWindingStream = {
  type: 'landscape_winding_stream',
  waterControllable: true,
  name: '溪流',
  defaultSize: { width: 90, depth: 36, height: 1.8 },
  components: [
    { id: 'stream-water', label: '溪水镜面', defaultColor: '#29b6f6' }
  ],
  build(registry, item, node, size) {
    if (item.waterEnabled === false) return;
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
  waterControllable: true,
  name: '泉眼',
  defaultSize: { width: 44, depth: 44, height: 18 },
  components: [
    { id: 'spring-water', label: '涌泉清水', defaultColor: '#e0f7fa' },
    { id: 'spring-rocks', label: '护泉驳石', defaultColor: '#78909c' }
  ],
  build(registry, item, node, size) {
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeNaturalSpring, 'spring-water', {
        diameterTop: size.width * 0.72, diameterBottom: size.width * 0.72, height: size.height * 0.75, tessellation: 16
      }, { position: { x: 0, y: size.height * 0.375, z: 0 } }, { parent: node });
    }

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
  waterControllable: true,
  name: '古井',
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
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeOldWell, 'well-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: wellH - 0.04, z: 0 } }, { parent: node });
    }

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
