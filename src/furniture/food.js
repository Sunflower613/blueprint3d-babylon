import { boxComponent, cylinderComponent, sphereComponent, latheComponent } from './_helpers.js';

// ==========================================
// 1. 经典美食与料理 (Delicacies)
// ==========================================

// 汉堡
export const hamburgerFurniture = {
  type: 'hamburger',
  name: '汉堡',
  unit: 'm',
  defaultSize: { width: 0.14, depth: 0.14, height: 0.12 },
  components: [
    { id: 'bunTop', label: '芝麻面包顶', defaultColor: '#d88c51' },
    { id: 'lettuce', label: '脆绿生菜', defaultColor: '#43a047' },
    { id: 'cheese', label: '车达芝士片', defaultColor: '#fbc02d' },
    { id: 'patty', label: '煎牛排肉饼', defaultColor: '#4e342e' },
    { id: 'bunBottom', label: '底层面包', defaultColor: '#e09f67' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, hamburgerFurniture, 'bunBottom', {
      diameterTop: w * 0.95, diameterBottom: w * 0.9, height: h * 0.2, tessellation: 20
    }, { position: { x: 0, y: h * 0.1, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, hamburgerFurniture, 'patty', {
      diameterTop: w, diameterBottom: w, height: h * 0.22, tessellation: 20
    }, { position: { x: 0, y: h * 0.31, z: 0 } }, { parent: node });

    boxComponent(registry, item, hamburgerFurniture, 'cheese', {
      width: w * 0.9, height: 0.005, depth: w * 0.9
    }, { position: { x: 0, y: h * 0.43, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, hamburgerFurniture, 'lettuce', {
      diameterTop: w * 1.05, diameterBottom: w * 0.98, height: h * 0.08, tessellation: 12
    }, { position: { x: 0, y: h * 0.48, z: 0 } }, { parent: node });

    sphereComponent(registry, item, hamburgerFurniture, 'bunTop', {
      diameterX: w * 0.96, diameterY: h * 0.7, diameterZ: w * 0.96, segments: 14
    }, { position: { x: 0, y: h * 0.65, z: 0 } }, { parent: node });
  }
};

// 薯条
export const frenchFriesFurniture = {
  type: 'french_fries',
  name: '薯条',
  unit: 'm',
  defaultSize: { width: 0.12, depth: 0.1, height: 0.16 },
  components: [
    { id: 'box', label: '红色薯条盒', defaultColor: '#e53935' },
    { id: 'fries', label: '金黄香酥薯条', defaultColor: '#fbc02d' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    boxComponent(registry, item, frenchFriesFurniture, 'box', {
      width: w, height: h * 0.65, depth: d
    }, { position: { x: 0, y: h * 0.325, z: 0 } }, { parent: node });

    const friesPos = [
      { x: -w * 0.3, z: -d * 0.2, h: h * 0.8 },
      { x: -w * 0.1, z: -d * 0.1, h: h * 0.95 },
      { x: w * 0.1, z: -d * 0.2, h: h * 0.85 },
      { x: w * 0.3, z: -d * 0.15, h: h * 0.78 },
      { x: -w * 0.2, z: d * 0.1, h: h * 0.9 },
      { x: 0, z: d * 0.15, h: h * 1.0 },
      { x: w * 0.2, z: d * 0.1, h: h * 0.82 }
    ];

    friesPos.forEach(fp => {
      boxComponent(registry, item, frenchFriesFurniture, 'fries', {
        width: 0.012, height: fp.h, depth: 0.012
      }, { position: { x: fp.x, y: fp.h / 2, z: fp.z } }, { parent: node });
    });
  }
};

// 包子
export const steamedBunFurniture = {
  type: 'steamed_bun',
  name: '包子蒸笼',
  unit: 'm',
  defaultSize: { width: 0.24, depth: 0.24, height: 0.14 },
  components: [
    { id: 'steamer', label: '竹质蒸笼', defaultColor: '#d7ccc8' },
    { id: 'bun', label: '鲜肉大包子', defaultColor: '#fffde7' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, steamedBunFurniture, 'steamer', {
      diameterTop: w, diameterBottom: w, height: h * 0.45, tessellation: 24
    }, { position: { x: 0, y: h * 0.225, z: 0 } }, { parent: node });

    const buns = [
      { x: -w * 0.2, z: -w * 0.1 },
      { x: w * 0.2, z: -w * 0.1 },
      { x: 0, z: w * 0.18 }
    ];

    buns.forEach(b => {
      sphereComponent(registry, item, steamedBunFurniture, 'bun', {
        diameterX: w * 0.38, diameterY: h * 0.5, diameterZ: w * 0.38, segments: 12
      }, { position: { x: b.x, y: h * 0.55, z: b.z } }, { parent: node });

      sphereComponent(registry, item, steamedBunFurniture, 'bun', {
        diameter: w * 0.1, segments: 8
      }, { position: { x: b.x, y: h * 0.8, z: b.z } }, { parent: node });
    });
  }
};

// 烧烤串
export const bbqSkewersFurniture = {
  type: 'bbq_skewers',
  name: '烧烤串',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.15, height: 0.08 },
  components: [
    { id: 'plate', label: '烧烤铁盘', defaultColor: '#37474f' },
    { id: 'stick', label: '竹签', defaultColor: '#d7ccc8' },
    { id: 'meat', label: '孜然羊肉块', defaultColor: '#6d4c41' },
    { id: 'pepper', label: '烤青椒', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    boxComponent(registry, item, bbqSkewersFurniture, 'plate', {
      width: w, height: h * 0.2, depth: d
    }, { position: { x: 0, y: h * 0.1, z: 0 } }, { parent: node });

    [-d * 0.25, d * 0.25].forEach(z => {
      boxComponent(registry, item, bbqSkewersFurniture, 'stick', {
        width: w * 0.9, height: 0.006, depth: 0.006
      }, { position: { x: 0, y: h * 0.3, z } }, { parent: node });

      [-w * 0.22, -w * 0.08, w * 0.06, w * 0.2].forEach((x, idx) => {
        const isMeat = idx % 2 === 0;
        boxComponent(registry, item, bbqSkewersFurniture, isMeat ? 'meat' : 'pepper', {
          width: 0.035, height: 0.03, depth: 0.035
        }, { position: { x, y: h * 0.42, z } }, { parent: node });
      });
    });
  }
};

// 寿司
export const sushiFurniture = {
  type: 'sushi',
  name: '日式寿司盘',
  unit: 'm',
  defaultSize: { width: 0.28, depth: 0.16, height: 0.06 },
  components: [
    { id: 'board', label: '刺身木托板', defaultColor: '#8d6e63' },
    { id: 'rice', label: '寿司醋饭', defaultColor: '#ffffff' },
    { id: 'salmon', label: '三文鱼刺身', defaultColor: '#ff7043' },
    { id: 'nori', label: '海苔卷', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    boxComponent(registry, item, sushiFurniture, 'board', {
      width: w, height: h * 0.3, depth: size.depth
    }, { position: { x: 0, y: h * 0.15, z: 0 } }, { parent: node });

    [-w * 0.25, 0].forEach(x => {
      boxComponent(registry, item, sushiFurniture, 'rice', {
        width: 0.06, height: h * 0.3, depth: 0.035
      }, { position: { x, y: h * 0.4, z: 0 } }, { parent: node });

      boxComponent(registry, item, sushiFurniture, 'salmon', {
        width: 0.065, height: h * 0.15, depth: 0.04
      }, { position: { x, y: h * 0.58, z: 0 } }, { parent: node });
    });

    cylinderComponent(registry, item, sushiFurniture, 'nori', {
      diameterTop: 0.045, diameterBottom: 0.045, height: h * 0.35, tessellation: 16
    }, { position: { x: w * 0.25, y: h * 0.45, z: 0 } }, { parent: node });
  }
};

// 冰淇淋
export const iceCreamFurniture = {
  type: 'ice_cream',
  name: '冰淇淋',
  unit: 'm',
  defaultSize: { width: 0.1, depth: 0.1, height: 0.24 },
  components: [
    { id: 'cone', label: '脆皮蛋筒', defaultColor: '#d7ccc8' },
    { id: 'scoop1', label: '草莓冰淇淋球', defaultColor: '#ff80ab' },
    { id: 'scoop2', label: '香草冰淇淋球', defaultColor: '#fffde7' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, iceCreamFurniture, 'cone', {
      diameterTop: w * 0.85, diameterBottom: 0.01, height: h * 0.55, tessellation: 16
    }, { position: { x: 0, y: h * 0.275, z: 0 } }, { parent: node });

    sphereComponent(registry, item, iceCreamFurniture, 'scoop1', {
      diameter: w * 0.9, segments: 14
    }, { position: { x: 0, y: h * 0.62, z: 0 } }, { parent: node });

    sphereComponent(registry, item, iceCreamFurniture, 'scoop2', {
      diameter: w * 0.75, segments: 12
    }, { position: { x: 0, y: h * 0.82, z: 0 } }, { parent: node });
  }
};

// 火锅
// 紫铜火锅 (高精度老北京/四川鸳鸯炭火锅)
// 紫铜火锅 (高精度老北京/四川鸳鸯炭火锅)
// 紫铜火锅 (高精度老北京/四川鸳鸯炭火锅)
// 紫铜火锅 (高精度老北京/四川鸳鸯炭火锅，剖面切削空心锅身)
export const hotpotFurniture = {
  type: 'hotpot',
  name: '紫铜火锅',
  unit: 'm',
  defaultSize: { width: 0.38, depth: 0.38, height: 0.32 },
  components: [
    { id: 'base', label: '紫铜底托座', defaultColor: '#5d4037' },
    { id: 'pot', label: '紫铜锅身', defaultColor: '#8d6e63' },
    { id: 'handles', label: '金属手柄环', defaultColor: '#3e2723' },
    { id: 'soupRed', label: '麻辣红汤底', defaultColor: '#c62828' },
    { id: 'soupWhite', label: '鲜香白汤底', defaultColor: '#fffde7' },
    { id: 'divider', label: '鸳鸯S型隔板', defaultColor: '#d7ccc8' },
    { id: 'chimney', label: '中央烟囱', defaultColor: '#6d4c41' },
    { id: 'beef', label: '麻辣肥牛卷', defaultColor: '#b71c1c' },
    { id: 'tofu', label: '冻豆腐块', defaultColor: '#fff59d' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const R_top = w * 0.48;
    const R_bot = w * 0.325;
    const wallT = 0.01;

    // 1. 三脚底托座
    cylinderComponent(registry, item, hotpotFurniture, 'base', {
      diameterTop: w * 0.65, diameterBottom: w * 0.7, height: h * 0.12, tessellation: 24
    }, { position: { x: 0, y: h * 0.06, z: 0 } }, { parent: node });

    // 2. 剖面切削真实空心紫铜锅身
    latheComponent(registry, item, hotpotFurniture, 'pot', {
      shape: [
        { x: 0, y: h * 0.12 },
        { x: R_top - wallT, y: h * 0.52 },
        { x: R_top, y: h * 0.52 },
        { x: R_bot, y: h * 0.12 },
        { x: 0, y: h * 0.12 }
      ],
      tessellation: 32
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 两侧贴身手柄环
    [-w * 0.48, w * 0.48].forEach(x => {
      boxComponent(registry, item, hotpotFurniture, 'handles', {
        width: 0.04, height: 0.015, depth: 0.03
      }, { position: { x, y: h * 0.45, z: 0 } }, { parent: node });
    });

    // 3. 麻辣红汤半圆 (内嵌在空心锅肚内 y = h * 0.44，内径 R = w * 0.42)
    const soupD = w * 0.84;
    const soupRed = cylinderComponent(registry, item, hotpotFurniture, 'soupRed', {
      diameterTop: soupD, diameterBottom: soupD, height: 0.005, tessellation: 24, arc: 0.5
    }, { position: { x: 0, y: h * 0.44, z: 0 } }, { parent: node });
    soupRed.rotation.y = Math.PI * 0.5;

    // 4. 鲜香白汤半圆 (右半边，y = h * 0.441)
    const soupWhite = cylinderComponent(registry, item, hotpotFurniture, 'soupWhite', {
      diameterTop: soupD, diameterBottom: soupD, height: 0.005, tessellation: 24, arc: 0.5
    }, { position: { x: 0, y: h * 0.441, z: 0 } }, { parent: node });
    soupWhite.rotation.y = -Math.PI * 0.5;

    // 5. 鸳鸯分隔板
    boxComponent(registry, item, hotpotFurniture, 'divider', {
      width: 0.008, height: h * 0.14, depth: soupD
    }, { position: { x: 0, y: h * 0.44, z: 0 } }, { parent: node });

    // 6. 中央修长烟囱 (从底到顶贯穿)
    cylinderComponent(registry, item, hotpotFurniture, 'chimney', {
      diameterTop: w * 0.2, diameterBottom: w * 0.28, height: h * 0.72, tessellation: 16
    }, { position: { x: 0, y: h * 0.6, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, hotpotFurniture, 'chimney', {
      diameterTop: w * 0.25, diameterBottom: w * 0.22, height: h * 0.08, tessellation: 16
    }, { position: { x: 0, y: h * 0.96, z: 0 } }, { parent: node });

    // 7. 浮在汤面上的配菜 (y = h * 0.46)
    [-w * 0.18, -w * 0.12].forEach((x, i) => {
      boxComponent(registry, item, hotpotFurniture, 'beef', {
        width: 0.04, height: 0.012, depth: 0.028
      }, { position: { x, y: h * 0.46, z: (i === 0 ? 1 : -1) * w * 0.12 } }, { parent: node });
    });

    [w * 0.12, w * 0.18].forEach((x, i) => {
      boxComponent(registry, item, hotpotFurniture, 'tofu', {
        width: 0.03, height: 0.018, depth: 0.03
      }, { position: { x, y: h * 0.46, z: (i === 0 ? -1 : 1) * w * 0.12 } }, { parent: node });
    });
  }
};

// 日式拉面
// 日式拉面 (带有剖面切削空心青花瓷碗、叉烧、溏心蛋、海苔与双木筷)
export const ramenBowlFurniture = {
  type: 'ramen_bowl',
  name: '日式拉面',
  unit: 'm',
  defaultSize: { width: 0.28, depth: 0.28, height: 0.16 },
  components: [
    { id: 'bowl', label: '青花瓷汤碗', defaultColor: '#1565c0' },
    { id: 'soup', label: '浓郁豚骨汤面', defaultColor: '#ffe0b2' },
    { id: 'eggWhite', label: '蛋白', defaultColor: '#ffffff' },
    { id: 'eggYolk', label: '溏心蛋黄', defaultColor: '#ff9800' },
    { id: 'chashu', label: '叉烧肉片', defaultColor: '#8d6e63' },
    { id: 'nori', label: '烤海苔片', defaultColor: '#1b5e20' },
    { id: 'chopsticks', label: '双木筷', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const R_top = w / 2;
    const R_bot = w * 0.225;
    const wallT = 0.008;

    // 1. 剖面切削真实空心青花瓷碗
    latheComponent(registry, item, ramenBowlFurniture, 'bowl', {
      shape: [
        { x: 0, y: h * 0.2 },
        { x: R_top - wallT, y: h * 0.8 },
        { x: R_top, y: h * 0.8 },
        { x: R_bot, y: h * 0.2 },
        { x: R_bot, y: 0 },
        { x: R_bot - wallT, y: 0 },
        { x: R_bot - wallT, y: h * 0.15 },
        { x: 0, y: h * 0.15 }
      ],
      tessellation: 32
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2. 内嵌在空心碗膛内的汤面 (y = h * 0.6)
    cylinderComponent(registry, item, ramenBowlFurniture, 'soup', {
      diameterTop: w * 0.76, diameterBottom: w * 0.76, height: 0.005, tessellation: 24
    }, { position: { x: 0, y: h * 0.6, z: 0 } }, { parent: node });

    // 3. 溏心蛋 (蛋白 + 蛋黄，浮在汤面 y = h * 0.62)
    sphereComponent(registry, item, ramenBowlFurniture, 'eggWhite', {
      diameterX: w * 0.26, diameterY: h * 0.1, diameterZ: w * 0.2, segments: 12
    }, { position: { x: -w * 0.18, y: h * 0.63, z: -w * 0.08 } }, { parent: node });

    sphereComponent(registry, item, ramenBowlFurniture, 'eggYolk', {
      diameter: w * 0.12, segments: 10
    }, { position: { x: -w * 0.18, y: h * 0.66, z: -w * 0.08 } }, { parent: node });

    // 4. 叉烧肉片
    cylinderComponent(registry, item, ramenBowlFurniture, 'chashu', {
      diameterTop: w * 0.32, diameterBottom: w * 0.32, height: 0.008, tessellation: 16
    }, { position: { x: w * 0.14, y: h * 0.63, z: -w * 0.1 } }, { parent: node });

    // 5. 烤海苔片 (斜靠在碗壁上)
    boxComponent(registry, item, ramenBowlFurniture, 'nori', {
      width: 0.005, height: h * 0.38, depth: w * 0.28
    }, { position: { x: w * 0.28, y: h * 0.72, z: 0 } }, { parent: node });

    // 6. 搁在碗沿上的双木筷
    [-0.01, 0.01].forEach(offsetZ => {
      boxComponent(registry, item, ramenBowlFurniture, 'chopsticks', {
        width: w * 0.95, height: 0.008, depth: 0.008
      }, { position: { x: 0, y: h * 0.81, z: w * 0.2 + offsetZ } }, { parent: node });
    });
  }
};


// ==========================================
// 2. 新鲜水果 (Fresh Fruits)
// ==========================================

// 苹果
export const appleFurniture = {
  type: 'apple',
  name: '苹果',
  unit: 'm',
  defaultSize: { width: 0.11, depth: 0.11, height: 0.1 },
  components: [
    { id: 'apple', label: '红苹果', defaultColor: '#e53935' },
    { id: 'stem', label: '棕果蒂柄', defaultColor: '#4e342e' },
    { id: 'leaf', label: '苹果绿叶', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, appleFurniture, 'apple', {
      diameterX: w, diameterY: h, diameterZ: w, segments: 16
    }, { position: { x: 0, y: h * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, appleFurniture, 'stem', {
      diameterTop: 0.005, diameterBottom: 0.005, height: h * 0.3, tessellation: 8
    }, { position: { x: 0, y: h * 0.9, z: 0 } }, { parent: node });

    const leaf = boxComponent(registry, item, appleFurniture, 'leaf', {
      width: 0.035, height: 0.003, depth: 0.018
    }, { position: { x: 0.018, y: h * 0.95, z: 0.008 } }, { parent: node });
    leaf.rotation.y = Math.PI * 0.3;
  }
};

// 香蕉
export const bananaFurniture = {
  type: 'banana',
  name: '香蕉串',
  unit: 'm',
  defaultSize: { width: 0.24, depth: 0.15, height: 0.12 },
  components: [
    { id: 'peel', label: '亮黄香蕉皮', defaultColor: '#fbc02d' },
    { id: 'stem', label: '香蕉果蒂柄', defaultColor: '#33691e' },
    { id: 'tip', label: '黑香蕉尖', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, bananaFurniture, 'stem', {
      diameterTop: 0.025, diameterBottom: 0.03, height: 0.04, tessellation: 10
    }, { position: { x: -w * 0.42, y: h * 0.6, z: 0 } }, { parent: node });

    [-0.04, 0, 0.04].forEach(z => {
      const b = cylinderComponent(registry, item, bananaFurniture, 'peel', {
        diameterTop: 0.045, diameterBottom: 0.025, height: w * 0.85, tessellation: 12
      }, { position: { x: 0, y: h * 0.4, z } }, { parent: node });
      b.rotation.z = Math.PI * 0.45;

      boxComponent(registry, item, bananaFurniture, 'tip', {
        width: 0.01, height: 0.01, depth: 0.01
      }, { position: { x: w * 0.4, y: h * 0.2, z } }, { parent: node });
    });
  }
};

// 菠萝 (带黄金鳞片纹理果身 + 三层放射状锯齿剑叶皇冠)
export const pineappleFurniture = {
  type: 'pineapple',
  name: '菠萝',
  unit: 'm',
  defaultSize: { width: 0.16, depth: 0.16, height: 0.32 },
  components: [
    { id: 'body', label: '黄金菠萝身', defaultColor: '#f57f17' },
    { id: 'eyes', label: '菠萝鳞片眼', defaultColor: '#e65100' },
    { id: 'leaves', label: '顶缨绿叶皇冠', defaultColor: '#2e7d32' },
    { id: 'innerLeaves', label: '核心嫩绿叶', defaultColor: '#558b2f' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    // 1. 底部小基座
    cylinderComponent(registry, item, pineappleFurniture, 'eyes', {
      diameterTop: w * 0.5, diameterBottom: w * 0.4, height: h * 0.05, tessellation: 12
    }, { position: { x: 0, y: h * 0.025, z: 0 } }, { parent: node });

    // 2. 黄金菠萝果实主躯干
    sphereComponent(registry, item, pineappleFurniture, 'body', {
      diameterX: w, diameterY: h * 0.55, diameterZ: w, segments: 16
    }, { position: { x: 0, y: h * 0.32, z: 0 } }, { parent: node });

    // 3. 围绕果身分布的 12 颗菠萝鳞眼突起
    const eyeR = w * 0.46;
    const eyeRings = [
      { y: h * 0.2, count: 4, offset: 0 },
      { y: h * 0.32, count: 4, offset: Math.PI * 0.25 },
      { y: h * 0.44, count: 4, offset: 0 }
    ];

    eyeRings.forEach(ring => {
      for (let i = 0; i < ring.count; i++) {
        const rot = (i * 2 * Math.PI) / ring.count + ring.offset;
        boxComponent(registry, item, pineappleFurniture, 'eyes', {
          width: 0.035, height: 0.03, depth: 0.02
        }, {
          position: { x: eyeR * Math.cos(rot), y: ring.y, z: eyeR * Math.sin(rot) },
          rotation: { x: 0, y: -rot, z: 0 }
        }, { parent: node });
      }
    });

    // 4. 顶部皇冠剑叶 (三层放射状呈弧形展翅开散)
    const leafLayers = [
      { count: 8, r: w * 0.22, y: h * 0.58, length: h * 0.35, angleZ: -Math.PI * 0.22 },
      { count: 6, r: w * 0.32, y: h * 0.54, length: h * 0.28, angleZ: -Math.PI * 0.38 }
    ];

    leafLayers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        const rot = (i * 2 * Math.PI) / layer.count;
        const leaf = boxComponent(registry, item, pineappleFurniture, 'leaves', {
          width: 0.022, height: layer.length, depth: 0.005
        }, {
          position: { x: layer.r * Math.cos(rot), y: layer.y + layer.length / 2, z: layer.r * Math.sin(rot) }
        }, { parent: node });

        leaf.rotation.y = -rot;
        leaf.rotation.z = layer.angleZ;
      }
    });

    // 5. 正中央 4 片直立高挺的嫩绿芯叶
    for (let i = 0; i < 4; i++) {
      const rot = (i * Math.PI) / 2;
      const innerLeaf = boxComponent(registry, item, pineappleFurniture, 'innerLeaves', {
        width: 0.02, height: h * 0.42, depth: 0.005
      }, {
        position: { x: 0.015 * Math.cos(rot), y: h * 0.58 + (h * 0.42) / 2, z: 0.015 * Math.sin(rot) }
      }, { parent: node });

      innerLeaf.rotation.y = -rot;
      innerLeaf.rotation.z = -Math.PI * 0.08;
    }
  }
};


// 西瓜 (半圆形切片西瓜，带有密闭平整顶部切面、绿皮、白边、鲜红瓜肉与黑瓜籽)
// 西瓜 (半圆形切片西瓜，带有密闭平整顶部切面、绿皮、白边、鲜红瓜肉与双侧黑瓜籽)
export const watermelonFurniture = {
  type: 'watermelon',
  name: '西瓜片',
  unit: 'm',
  defaultSize: { width: 0.24, depth: 0.05, height: 0.14 },
  components: [
    { id: 'rind', label: '翠绿西瓜皮', defaultColor: '#1b5e20' },
    { id: 'whiteRind', label: '白瓜皮边', defaultColor: '#f1f8e9' },
    { id: 'flesh', label: '鲜红瓜肉', defaultColor: '#e53935' },
    { id: 'seeds', label: '黑西瓜籽', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    // 1. 下弧形翠绿瓜皮外壳 (y = h * 0.7)
    const rind = cylinderComponent(registry, item, watermelonFurniture, 'rind', {
      diameterTop: w, diameterBottom: w, height: d, tessellation: 24, arc: 0.5
    }, { position: { x: 0, y: h * 0.7, z: 0 } }, { parent: node });
    rind.rotation.x = -Math.PI * 0.5;
    rind.rotation.z = Math.PI;

    // 2. 浅白过渡瓜皮弧边
    const whiteRind = cylinderComponent(registry, item, watermelonFurniture, 'whiteRind', {
      diameterTop: w * 0.94, diameterBottom: w * 0.94, height: d + 0.001, tessellation: 24, arc: 0.5
    }, { position: { x: 0, y: h * 0.7, z: 0 } }, { parent: node });
    whiteRind.rotation.x = -Math.PI * 0.5;
    whiteRind.rotation.z = Math.PI;

    // 3. 鲜红半圆形瓜肉弧身
    const flesh = cylinderComponent(registry, item, watermelonFurniture, 'flesh', {
      diameterTop: w * 0.88, diameterBottom: w * 0.88, height: d + 0.002, tessellation: 24, arc: 0.5
    }, { position: { x: 0, y: h * 0.7, z: 0 } }, { parent: node });
    flesh.rotation.x = -Math.PI * 0.5;
    flesh.rotation.z = Math.PI;

    // 4. 顶部密闭平整的鲜红切面盖板 (横盖封死透空凹槽)
    boxComponent(registry, item, watermelonFurniture, 'flesh', {
      width: w * 0.88, height: 0.006, depth: d + 0.002
    }, { position: { x: 0, y: h * 0.7, z: 0 } }, { parent: node });

    [-w * 0.45, w * 0.45].forEach(x => {
      boxComponent(registry, item, watermelonFurniture, 'whiteRind', {
        width: w * 0.03, height: 0.006, depth: d + 0.001
      }, { position: { x, y: h * 0.7, z: 0 } }, { parent: node });
    });

    [-w * 0.485, w * 0.485].forEach(x => {
      boxComponent(registry, item, watermelonFurniture, 'rind', {
        width: w * 0.03, height: 0.006, depth: d
      }, { position: { x, y: h * 0.7, z: 0 } }, { parent: node });
    });

    // 5. 镶嵌在前后两侧大扇形红肉侧面上的 10 粒黑色西瓜籽 (前侧与后侧)
    const seedPos = [
      { x: -w * 0.25, y: h * 0.45 },
      { x: w * 0.25, y: h * 0.45 },
      { x: -w * 0.14, y: h * 0.28 },
      { x: w * 0.14, y: h * 0.28 },
      { x: 0, y: h * 0.16 }
    ];

    seedPos.forEach(sp => {
      [-d * 0.52, d * 0.52].forEach(zOffset => {
        sphereComponent(registry, item, watermelonFurniture, 'seeds', {
          diameterX: 0.012, diameterY: 0.018, diameterZ: 0.006, segments: 8
        }, { position: { x: sp.x, y: sp.y, z: zOffset } }, { parent: node });
      });
    });
  }
};

// 火龙果
export const dragonFruitFurniture = {
  type: 'dragon_fruit',
  name: '火龙果',
  unit: 'm',
  defaultSize: { width: 0.14, depth: 0.14, height: 0.22 },
  components: [
    { id: 'skin', label: '玫红果皮', defaultColor: '#c2185b' },
    { id: 'scales', label: '外翘绿鳞片', defaultColor: '#76ff03' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, dragonFruitFurniture, 'skin', {
      diameterX: w, diameterY: h * 0.82, diameterZ: w, segments: 16
    }, { position: { x: 0, y: h * 0.45, z: 0 } }, { parent: node });

    const scalePositions = [
      { y: h * 0.3, rot: 0 },
      { y: h * 0.3, rot: Math.PI * 0.5 },
      { y: h * 0.3, rot: Math.PI },
      { y: h * 0.3, rot: Math.PI * 1.5 },
      { y: h * 0.55, rot: Math.PI * 0.25 },
      { y: h * 0.55, rot: Math.PI * 0.75 },
      { y: h * 0.55, rot: Math.PI * 1.25 },
      { y: h * 0.55, rot: Math.PI * 1.75 },
      { y: h * 0.75, rot: 0 },
      { y: h * 0.75, rot: Math.PI * 0.66 },
      { y: h * 0.75, rot: Math.PI * 1.33 }
    ];

    scalePositions.forEach(p => {
      const scale = boxComponent(registry, item, dragonFruitFurniture, 'scales', {
        width: 0.02, height: 0.045, depth: 0.004
      }, { position: { x: w * 0.42 * Math.cos(p.rot), y: p.y, z: w * 0.42 * Math.sin(p.rot) } }, { parent: node });
      scale.rotation.y = -p.rot;
      scale.rotation.z = -Math.PI * 0.15;
    });

    cylinderComponent(registry, item, dragonFruitFurniture, 'scales', {
      diameterTop: 0.005, diameterBottom: w * 0.3, height: h * 0.18, tessellation: 8
    }, { position: { x: 0, y: h * 0.9, z: 0 } }, { parent: node });
  }
};

// 橘子
export const orangeFruitFurniture = {
  type: 'orange_fruit',
  name: '橘子',
  unit: 'm',
  defaultSize: { width: 0.11, depth: 0.11, height: 0.09 },
  components: [
    { id: 'skin', label: '橙黄色果皮', defaultColor: '#ff9800' },
    { id: 'leaf', label: '翠绿叶片', defaultColor: '#388e3c' },
    { id: 'stem', label: '黑蒂柄', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, orangeFruitFurniture, 'skin', {
      diameterX: w, diameterY: h * 0.9, diameterZ: w, segments: 16
    }, { position: { x: 0, y: h * 0.45, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, orangeFruitFurniture, 'stem', {
      diameterTop: 0.005, diameterBottom: 0.005, height: 0.015, tessellation: 8
    }, { position: { x: 0, y: h * 0.9, z: 0 } }, { parent: node });

    const leaf = boxComponent(registry, item, orangeFruitFurniture, 'leaf', {
      width: 0.04, height: 0.003, depth: 0.02
    }, { position: { x: 0.02, y: h * 0.92, z: 0.01 } }, { parent: node });
    leaf.rotation.y = Math.PI * 0.25;
  }
};

// 水蜜桃
export const peachFurniture = {
  type: 'peach',
  name: '水蜜桃',
  unit: 'm',
  defaultSize: { width: 0.12, depth: 0.12, height: 0.11 },
  components: [
    { id: 'flesh', label: '粉黄桃子', defaultColor: '#ffe0b2' },
    { id: 'blush', label: '桃尖粉晕', defaultColor: '#f48fb1' },
    { id: 'leaf', label: '桃树叶片', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, peachFurniture, 'flesh', {
      diameterX: w, diameterY: h, diameterZ: w * 0.95, segments: 16
    }, { position: { x: 0, y: h * 0.5, z: 0 } }, { parent: node });

    sphereComponent(registry, item, peachFurniture, 'blush', {
      diameterX: w * 0.5, diameterY: h * 0.45, diameterZ: w * 0.5, segments: 12
    }, { position: { x: 0, y: h * 0.8, z: 0 } }, { parent: node });

    const leaf = boxComponent(registry, item, peachFurniture, 'leaf', {
      width: 0.045, height: 0.003, depth: 0.022
    }, { position: { x: -w * 0.25, y: h * 0.75, z: 0 } }, { parent: node });
    leaf.rotation.z = -Math.PI * 0.25;
  }
};

// 葡萄串
export const grapeBunchFurniture = {
  type: 'grape_bunch',
  name: '葡萄串',
  unit: 'm',
  defaultSize: { width: 0.15, depth: 0.15, height: 0.22 },
  components: [
    { id: 'grapes', label: '紫葡萄粒', defaultColor: '#6a1b9a' },
    { id: 'stem', label: '葡萄藤柄', defaultColor: '#5d4037' },
    { id: 'leaf', label: '葡萄叶', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, grapeBunchFurniture, 'stem', {
      diameterTop: 0.008, diameterBottom: 0.008, height: h * 0.45, tessellation: 8
    }, { position: { x: 0, y: h * 0.78, z: 0 } }, { parent: node });

    const leaf = boxComponent(registry, item, grapeBunchFurniture, 'leaf', {
      width: 0.06, height: 0.004, depth: 0.04
    }, { position: { x: w * 0.25, y: h * 0.88, z: 0 } }, { parent: node });
    leaf.rotation.z = Math.PI * 0.2;

    const grapes = [
      { x: 0, y: h * 0.65, z: 0, r: 0.042 },
      { x: w * 0.24, y: h * 0.62, z: 0, r: 0.038 },
      { x: -w * 0.24, y: h * 0.62, z: 0, r: 0.038 },
      { x: 0, y: h * 0.62, z: w * 0.24, r: 0.038 },
      { x: 0, y: h * 0.62, z: -w * 0.24, r: 0.038 },
      { x: w * 0.16, y: h * 0.48, z: w * 0.16, r: 0.038 },
      { x: -w * 0.16, y: h * 0.48, z: w * 0.16, r: 0.038 },
      { x: w * 0.16, y: h * 0.48, z: -w * 0.16, r: 0.038 },
      { x: -w * 0.16, y: h * 0.48, z: -w * 0.16, r: 0.038 },
      { x: 0, y: h * 0.45, z: 0, r: 0.04 },
      { x: 0, y: h * 0.32, z: w * 0.1, r: 0.035 },
      { x: 0, y: h * 0.32, z: -w * 0.1, r: 0.035 },
      { x: w * 0.12, y: h * 0.3, z: 0, r: 0.035 },
      { x: 0, y: h * 0.18, z: 0, r: 0.032 },
      { x: 0, y: h * 0.08, z: 0, r: 0.026 }
    ];

    grapes.forEach(g => {
      sphereComponent(registry, item, grapeBunchFurniture, 'grapes', {
        diameter: g.r * 2, segments: 12
      }, { position: { x: g.x, y: g.y, z: g.z } }, { parent: node });
    });
  }
};


// ==========================================
// 3. 新鲜蔬菜 (Fresh Vegetables)
// ==========================================

// 卷心菜
// 包裹层叠卷心菜
// 包裹层叠卷心菜
export const cabbageFurniture = {
  type: 'cabbage',
  name: '卷心菜',
  unit: 'm',
  defaultSize: { width: 0.22, depth: 0.22, height: 0.18 },
  components: [
    { id: 'core', label: '浅绿包菜芯', defaultColor: '#c8e6c9' },
    { id: 'leaves', label: '深绿外层包菜叶', defaultColor: '#43a047' },
    { id: 'stemBase', label: '根蒂部', defaultColor: '#f1f8e9' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    // 1. 根蒂部
    cylinderComponent(registry, item, cabbageFurniture, 'stemBase', {
      diameterTop: w * 0.35, diameterBottom: w * 0.2, height: h * 0.15, tessellation: 12
    }, { position: { x: 0, y: h * 0.075, z: 0 } }, { parent: node });

    // 2. 浅绿包菜芯球
    sphereComponent(registry, item, cabbageFurniture, 'core', {
      diameter: w * 0.75, segments: 16
    }, { position: { x: 0, y: h * 0.45, z: 0 } }, { parent: node });

    // 3. 6 片围绕菜心底部呈水平/倾斜舒展包裹的深绿叶片
    const leafAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];

    leafAngles.forEach((angle, idx) => {
      const r = w * 0.25;
      const leaf = sphereComponent(registry, item, cabbageFurniture, 'leaves', {
        diameterX: w * 0.55, diameterY: 0.03, diameterZ: w * 0.45, segments: 12
      }, { position: { x: r * Math.cos(angle), y: h * 0.32 + (idx % 2) * 0.02, z: r * Math.sin(angle) } }, { parent: node });

      leaf.rotation.y = -angle;
      leaf.rotation.z = Math.PI * 0.1;
    });
  }
};

// 青菜
export const bokChoyFurniture = {
  type: 'bok_choy',
  name: '青菜',
  unit: 'm',
  defaultSize: { width: 0.16, depth: 0.12, height: 0.22 },
  components: [
    { id: 'stem', label: '白菜帮', defaultColor: '#e8f5e9' },
    { id: 'leaves', label: '深绿菜叶', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, bokChoyFurniture, 'stem', {
      diameterTop: w * 0.6, diameterBottom: w * 0.4, height: h * 0.4, tessellation: 12
    }, { position: { x: 0, y: h * 0.2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, bokChoyFurniture, 'leaves', {
      diameterX: w, diameterY: h * 0.65, diameterZ: size.depth, segments: 12
    }, { position: { x: 0, y: h * 0.65, z: 0 } }, { parent: node });
  }
};

// 花菜
export const cauliflowerFurniture = {
  type: 'cauliflower',
  name: '花菜',
  unit: 'm',
  defaultSize: { width: 0.24, depth: 0.24, height: 0.2 },
  components: [
    { id: 'head', label: '洁白花球', defaultColor: '#f5f5f5' },
    { id: 'leaves', label: '基部护叶', defaultColor: '#43a047' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, cauliflowerFurniture, 'head', {
      diameter: w * 0.85, segments: 14
    }, { position: { x: 0, y: h * 0.55, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, cauliflowerFurniture, 'leaves', {
      diameterTop: w, diameterBottom: w * 0.4, height: h * 0.35, tessellation: 12
    }, { position: { x: 0, y: h * 0.18, z: 0 } }, { parent: node });
  }
};

// 黄瓜
export const cucumberFurniture = {
  type: 'cucumber',
  name: '黄瓜',
  unit: 'm',
  defaultSize: { width: 0.28, depth: 0.06, height: 0.06 },
  components: [
    { id: 'skin', label: '深绿黄瓜条', defaultColor: '#1b5e20' },
    { id: 'flower', label: '嫩黄花朵', defaultColor: '#ffeb3b' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    const body = cylinderComponent(registry, item, cucumberFurniture, 'skin', {
      diameterTop: h, diameterBottom: h * 0.75, height: w, tessellation: 14
    }, { position: { x: 0, y: h / 2, z: 0 } }, { parent: node });
    body.rotation.z = Math.PI * 0.48;

    cylinderComponent(registry, item, cucumberFurniture, 'flower', {
      diameterTop: 0.025, diameterBottom: 0.005, height: 0.015, tessellation: 10
    }, { position: { x: w * 0.48, y: h / 2, z: 0 } }, { parent: node }).rotation.z = Math.PI * 0.5;
  }
};

// 豆角
export const greenBeansFurniture = {
  type: 'green_beans',
  name: '豆角',
  unit: 'm',
  defaultSize: { width: 0.28, depth: 0.08, height: 0.04 },
  components: [
    { id: 'pod', label: '翠绿长豆角', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    [-h * 0.4, 0, h * 0.4].forEach(z => {
      cylinderComponent(registry, item, greenBeansFurniture, 'pod', {
        diameterTop: 0.012, diameterBottom: 0.01, height: w, tessellation: 8
      }, { position: { x: 0, y: h / 2, z } }, { parent: node }).rotation.z = Math.PI * 0.47;
    });
  }
};

// 茄子
export const eggplantFurniture = {
  type: 'eggplant',
  name: '茄子',
  unit: 'm',
  defaultSize: { width: 0.26, depth: 0.09, height: 0.09 },
  components: [
    { id: 'skin', label: '亮紫茄子身', defaultColor: '#4a148c' },
    { id: 'cap', label: '绿茄蒂帽', defaultColor: '#2e7d32' },
    { id: 'stem', label: '果柄', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, eggplantFurniture, 'skin', {
      diameterX: w * 0.85, diameterY: h, diameterZ: size.depth, segments: 16
    }, { position: { x: 0, y: h / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, eggplantFurniture, 'cap', {
      diameterTop: size.depth * 0.85, diameterBottom: size.depth * 0.4, height: w * 0.18, tessellation: 12
    }, { position: { x: -w * 0.35, y: h / 2, z: 0 } }, { parent: node }).rotation.z = Math.PI * 0.5;

    cylinderComponent(registry, item, eggplantFurniture, 'stem', {
      diameterTop: 0.012, diameterBottom: 0.016, height: w * 0.16, tessellation: 8
    }, { position: { x: -w * 0.46, y: h * 0.6, z: 0 } }, { parent: node }).rotation.z = Math.PI * 0.3;
  }
};

// 辣椒
export const chiliPepperFurniture = {
  type: 'chili_pepper',
  name: '辣椒',
  unit: 'm',
  defaultSize: { width: 0.18, depth: 0.04, height: 0.04 },
  components: [
    { id: 'skin', label: '鲜红红辣椒', defaultColor: '#d32f2f' },
    { id: 'stem', label: '绿辣椒蒂', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;

    cylinderComponent(registry, item, chiliPepperFurniture, 'skin', {
      diameterTop: 0.025, diameterBottom: 0.005, height: w * 0.85, tessellation: 10
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node }).rotation.z = Math.PI * 0.45;

    cylinderComponent(registry, item, chiliPepperFurniture, 'stem', {
      diameterTop: 0.006, diameterBottom: 0.012, height: w * 0.15, tessellation: 8
    }, { position: { x: -w * 0.4, y: size.height / 2, z: 0 } }, { parent: node }).rotation.z = Math.PI * 0.45;
  }
};

// 莲藕
export const lotusRootFurniture = {
  type: 'lotus_root',
  name: '莲藕',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.1, height: 0.1 },
  components: [
    { id: 'skin', label: '米白藕身', defaultColor: '#d7ccc8' },
    { id: 'holes', label: '藕孔沉影', defaultColor: '#795548' }
  ],
  build(registry, item, node, size) {
    const w = size.width;

    [-w * 0.22, w * 0.22].forEach(x => {
      cylinderComponent(registry, item, lotusRootFurniture, 'skin', {
        diameterTop: size.height, diameterBottom: size.height, height: w * 0.4, tessellation: 16
      }, { position: { x, y: size.height / 2, z: 0 } }, { parent: node }).rotation.z = Math.PI * 0.5;
    });

    boxComponent(registry, item, lotusRootFurniture, 'holes', {
      width: 0.005, height: size.height * 0.6, depth: size.depth * 0.6
    }, { position: { x: w * 0.42, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 冬瓜
export const waxGourdFurniture = {
  type: 'wax_gourd',
  name: '冬瓜',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.22, height: 0.22 },
  components: [
    { id: 'skin', label: '青皮白霜冬瓜', defaultColor: '#558b2f' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, waxGourdFurniture, 'skin', {
      diameterX: size.width, diameterY: size.height, diameterZ: size.depth, segments: 16
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 西红柿
export const tomatoFurniture = {
  type: 'tomato',
  name: '西红柿',
  unit: 'm',
  defaultSize: { width: 0.11, depth: 0.11, height: 0.09 },
  components: [
    { id: 'flesh', label: '鲜红番茄身', defaultColor: '#e53935' },
    { id: 'calyx', label: '五角星果蒂', defaultColor: '#2e7d32' },
    { id: 'stem', label: '小果柄', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    sphereComponent(registry, item, tomatoFurniture, 'flesh', {
      diameterX: w, diameterY: h * 0.9, diameterZ: w, segments: 16
    }, { position: { x: 0, y: h * 0.45, z: 0 } }, { parent: node });

    boxComponent(registry, item, tomatoFurniture, 'calyx', {
      width: 0.035, height: 0.004, depth: 0.035
    }, { position: { x: 0, y: h * 0.88, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, tomatoFurniture, 'stem', {
      diameterTop: 0.004, diameterBottom: 0.004, height: 0.015, tessellation: 8
    }, { position: { x: 0, y: h * 0.96, z: 0 } }, { parent: node });
  }
};


// ==========================================
// 4. 饮品与茶具 (Beverages & Teaware)
// ==========================================

export const cakeFurniture = {
  type: 'cake',
  name: '生日蛋糕',
  unit: 'm',
  defaultSize: { width: 0.28, depth: 0.28, height: 0.18 },
  components: [
    { id: 'plate', label: '底盘', defaultColor: '#ffffff' },
    { id: 'cake', label: '蛋糕体', defaultColor: '#fff8e7' },
    { id: 'frosting', label: '草莓奶油顶层', defaultColor: '#ff80ab' },
    { id: 'cherry', label: '车厘子夹心', defaultColor: '#d50000' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, cakeFurniture, 'plate', {
      diameterTop: size.width, diameterBottom: size.width, height: 0.01
    }, { position: { x: 0, y: 0.005, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, cakeFurniture, 'cake', {
      diameterTop: size.width * 0.85, diameterBottom: size.width * 0.85, height: size.height * 0.65
    }, { position: { x: 0, y: size.height * 0.33, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, cakeFurniture, 'frosting', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.88, height: size.height * 0.12
    }, { position: { x: 0, y: size.height * 0.7, z: 0 } }, { parent: node });

    sphereComponent(registry, item, cakeFurniture, 'cherry', {
      diameter: Math.max(0.02, size.width * 0.08), segments: 12
    }, { position: { x: 0, y: size.height * 0.82, z: 0 } }, { parent: node });
  }
};

export const milkTeaFurniture = {
  type: 'milk_tea',
  name: '珍珠奶茶',
  unit: 'm',
  defaultSize: { width: 0.09, depth: 0.09, height: 0.18 },
  components: [
    { id: 'cup', label: '奶茶杯身', defaultColor: '#ffe0b2' },
    { id: 'lid', label: '封口盖', defaultColor: '#ffb74d' },
    { id: 'boba', label: '黑糖珍珠', defaultColor: '#3e2723' },
    { id: 'straw', label: '吸管', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, milkTeaFurniture, 'cup', {
      diameterTop: size.width, diameterBottom: size.width * 0.75, height: size.height * 0.82
    }, { position: { x: 0, y: size.height * 0.41, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, milkTeaFurniture, 'lid', {
      diameterTop: size.width * 1.04, diameterBottom: size.width * 1.04, height: size.height * 0.05
    }, { position: { x: 0, y: size.height * 0.84, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, milkTeaFurniture, 'boba', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.72, height: size.height * 0.2
    }, { position: { x: 0, y: size.height * 0.12, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, milkTeaFurniture, 'straw', {
      diameterTop: 0.008, diameterBottom: 0.008, height: size.height * 1.15
    }, { position: { x: size.width * 0.1, y: size.height * 0.58, z: 0 } }, { parent: node });
  }
};

export const canSodaFurniture = {
  type: 'can_soda',
  name: '罐装汽水',
  unit: 'm',
  defaultSize: { width: 0.07, depth: 0.07, height: 0.12 },
  components: [
    { id: 'canBody', label: '可乐红瓶身', defaultColor: '#e53935' },
    { id: 'canTop', label: '铝合金顶盖与拉环', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, canSodaFurniture, 'canBody', {
      diameterTop: size.width, diameterBottom: size.width * 0.9, height: size.height * 0.92, tessellation: 24
    }, { position: { x: 0, y: size.height * 0.46, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, canSodaFurniture, 'canTop', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.88, height: size.height * 0.08, tessellation: 24
    }, { position: { x: 0, y: size.height * 0.96, z: 0 } }, { parent: node });

    boxComponent(registry, item, canSodaFurniture, 'canTop', {
      width: size.width * 0.3, height: 0.004, depth: size.width * 0.2
    }, { position: { x: 0, y: size.height + 0.002, z: 0 } }, { parent: node });
  }
};

export const bottledDrinkFurniture = {
  type: 'bottled_drink',
  name: '瓶装饮料',
  unit: 'm',
  defaultSize: { width: 0.08, depth: 0.08, height: 0.24 },
  components: [
    { id: 'cap', label: '绿茶瓶盖', defaultColor: '#43a047' },
    { id: 'label', label: '饮料瓶贴标签', defaultColor: '#c8e6c9' },
    { id: 'bottle', label: '通透饮品瓶身', defaultColor: '#a5d6a7' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, bottledDrinkFurniture, 'bottle', {
      diameterTop: w, diameterBottom: w * 0.9, height: h * 0.5, tessellation: 24
    }, { position: { x: 0, y: h * 0.25, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, bottledDrinkFurniture, 'label', {
      diameterTop: w * 1.02, diameterBottom: w * 1.02, height: h * 0.28, tessellation: 24
    }, { position: { x: 0, y: h * 0.32, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, bottledDrinkFurniture, 'bottle', {
      diameterTop: w * 0.45, diameterBottom: w, height: h * 0.3, tessellation: 24
    }, { position: { x: 0, y: h * 0.65, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, bottledDrinkFurniture, 'bottle', {
      diameterTop: w * 0.45, diameterBottom: w * 0.45, height: h * 0.12, tessellation: 24
    }, { position: { x: 0, y: h * 0.86, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, bottledDrinkFurniture, 'cap', {
      diameterTop: w * 0.48, diameterBottom: w * 0.48, height: h * 0.08, tessellation: 24
    }, { position: { x: 0, y: h * 0.96, z: 0 } }, { parent: node });
  }
};

export const wineBottleFurniture = {
  type: 'wine_bottle',
  name: '红酒瓶',
  unit: 'm',
  defaultSize: { width: 0.1, depth: 0.1, height: 0.32 },
  components: [
    { id: 'bottle', label: '暗绿玻璃瓶身', defaultColor: '#1b3a24' },
    { id: 'label', label: '红酒酒标', defaultColor: '#fff8e7' },
    { id: 'cap', label: '酒瓶封皮帽', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, wineBottleFurniture, 'bottle', {
      diameterTop: w, diameterBottom: w * 0.9, height: h * 0.55, tessellation: 24
    }, { position: { x: 0, y: h * 0.275, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, wineBottleFurniture, 'label', {
      diameterTop: w * 1.02, diameterBottom: w * 1.02, height: h * 0.35, tessellation: 24
    }, { position: { x: 0, y: h * 0.32, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, wineBottleFurniture, 'bottle', {
      diameterTop: w * 0.38, diameterBottom: w, height: h * 0.25, tessellation: 24
    }, { position: { x: 0, y: h * 0.675, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, wineBottleFurniture, 'bottle', {
      diameterTop: w * 0.38, diameterBottom: w * 0.38, height: h * 0.18, tessellation: 24
    }, { position: { x: 0, y: h * 0.89, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, wineBottleFurniture, 'cap', {
      diameterTop: w * 0.4, diameterBottom: w * 0.4, height: h * 0.08, tessellation: 24
    }, { position: { x: 0, y: h * 0.96, z: 0 } }, { parent: node });
  }
};

export const roastChickenFurniture = {
  type: 'roast_chicken',
  name: '烤鸡',
  unit: 'm',
  defaultSize: { width: 0.32, depth: 0.25, height: 0.16 },
  components: [
    { id: 'plate', label: '瓷餐盘', defaultColor: '#ffffff' },
    { id: 'chicken', label: '香酥烤鸡', defaultColor: '#d87d2a' },
    { id: 'garnish', label: '迷迭香配菜', defaultColor: '#43a047' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, roastChickenFurniture, 'plate', {
      diameterTop: w, diameterBottom: w * 0.85, height: h * 0.15, tessellation: 24
    }, { position: { x: 0, y: h * 0.075, z: 0 } }, { parent: node });

    sphereComponent(registry, item, roastChickenFurniture, 'chicken', {
      diameterX: w * 0.55, diameterY: h * 0.6, diameterZ: size.depth * 0.6, segments: 12
    }, { position: { x: 0, y: h * 0.45, z: 0 } }, { parent: node });

    [-1, 1].forEach(side => {
      sphereComponent(registry, item, roastChickenFurniture, 'chicken', {
        diameterX: w * 0.25, diameterY: h * 0.35, diameterZ: size.depth * 0.25, segments: 10
      }, { position: { x: side * w * 0.22, y: h * 0.32, z: -size.depth * 0.12 } }, { parent: node });
    });

    sphereComponent(registry, item, roastChickenFurniture, 'garnish', {
      diameterX: w * 0.12, diameterY: h * 0.12, diameterZ: size.depth * 0.12, segments: 8
    }, { position: { x: w * 0.26, y: h * 0.2, z: size.depth * 0.18 } }, { parent: node });
  }
};

export const stirFriedVeggiesFurniture = {
  type: 'stir_fried_veggies',
  name: '炒时蔬',
  unit: 'm',
  defaultSize: { width: 0.26, depth: 0.26, height: 0.1 },
  components: [
    { id: 'plate', label: '深色菜盘', defaultColor: '#263238' },
    { id: 'greens', label: '鲜嫩绿叶菜', defaultColor: '#2e7d32' },
    { id: 'carrots', label: '胡萝卜切片', defaultColor: '#ff6d00' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, stirFriedVeggiesFurniture, 'plate', {
      diameterTop: w, diameterBottom: w * 0.85, height: h * 0.2, tessellation: 24
    }, { position: { x: 0, y: h * 0.1, z: 0 } }, { parent: node });

    const greenPos = [
      { x: 0, z: 0, s: 0.45 },
      { x: w * 0.12, z: w * 0.1, s: 0.35 },
      { x: -w * 0.12, z: w * 0.08, s: 0.38 },
      { x: w * 0.08, z: -w * 0.12, s: 0.36 },
      { x: -w * 0.1, z: -w * 0.1, s: 0.34 }
    ];

    greenPos.forEach(p => {
      sphereComponent(registry, item, stirFriedVeggiesFurniture, 'greens', {
        diameterX: w * p.s, diameterY: h * 0.45, diameterZ: w * p.s, segments: 8
      }, { position: { x: p.x, y: h * 0.35, z: p.z } }, { parent: node });
    });

    [-w * 0.08, w * 0.1].forEach((cx, idx) => {
      boxComponent(registry, item, stirFriedVeggiesFurniture, 'carrots', {
        width: w * 0.12, height: 0.008, depth: w * 0.12
      }, { position: { x: cx, y: h * 0.62, z: (idx === 0 ? 1 : -1) * w * 0.06 } }, { parent: node });
    });
  }
};

export const steakPlateFurniture = {
  type: 'steak_plate',
  name: '牛排',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.22, height: 0.12 },
  components: [
    { id: 'plate', label: '黑铸铁盘托', defaultColor: '#212121' },
    { id: 'steak', label: '黑椒牛排', defaultColor: '#4e342e' },
    { id: 'egg', label: '煎太阳蛋', defaultColor: '#fff59d' },
    { id: 'veggie', label: '配菜西兰花', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    boxComponent(registry, item, steakPlateFurniture, 'plate', {
      width: w, height: h * 0.15, depth: d
    }, { position: { x: 0, y: h * 0.075, z: 0 } }, { parent: node });

    boxComponent(registry, item, steakPlateFurniture, 'steak', {
      width: w * 0.5, height: h * 0.22, depth: d * 0.55
    }, { position: { x: -w * 0.15, y: h * 0.26, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, steakPlateFurniture, 'egg', {
      diameterTop: w * 0.26, diameterBottom: w * 0.26, height: h * 0.1, tessellation: 16
    }, { position: { x: w * 0.22, y: h * 0.2, z: -d * 0.18 } }, { parent: node });

    sphereComponent(registry, item, steakPlateFurniture, 'veggie', {
      diameterX: w * 0.18, diameterY: h * 0.25, diameterZ: d * 0.25, segments: 8
    }, { position: { x: w * 0.22, y: h * 0.27, z: d * 0.2 } }, { parent: node });
  }
};

export const spaghettiPlateFurniture = {
  type: 'spaghetti_plate',
  name: '意大利面',
  unit: 'm',
  defaultSize: { width: 0.28, depth: 0.28, height: 0.12 },
  components: [
    { id: 'plate', label: '白瓷意面盘', defaultColor: '#f5f5f5' },
    { id: 'pasta', label: '金黄意面卷', defaultColor: '#fbc02d' },
    { id: 'sauce', label: '番茄肉酱', defaultColor: '#c62828' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, spaghettiPlateFurniture, 'plate', {
      diameterTop: w, diameterBottom: w * 0.8, height: h * 0.25, tessellation: 24
    }, { position: { x: 0, y: h * 0.125, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, spaghettiPlateFurniture, 'pasta', {
      diameterTop: w * 0.52, diameterBottom: w * 0.58, height: h * 0.45, tessellation: 20
    }, { position: { x: 0, y: h * 0.38, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, spaghettiPlateFurniture, 'sauce', {
      diameterTop: w * 0.36, diameterBottom: w * 0.42, height: h * 0.15, tessellation: 16
    }, { position: { x: 0, y: h * 0.62, z: 0 } }, { parent: node });
  }
};

export const pizzaFurniture = {
  type: 'pizza',
  name: '披萨',
  unit: 'm',
  defaultSize: { width: 0.32, depth: 0.32, height: 0.08 },
  components: [
    { id: 'pan', label: '披萨木托盘', defaultColor: '#d7ccc8' },
    { id: 'crust', label: '香烤饼边', defaultColor: '#d84315' },
    { id: 'cheese', label: '浓郁芝士', defaultColor: '#ffee58' },
    { id: 'pepperoni', label: '腊肠切片', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, pizzaFurniture, 'pan', {
      diameterTop: w, diameterBottom: w, height: h * 0.2, tessellation: 24
    }, { position: { x: 0, y: h * 0.1, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, pizzaFurniture, 'crust', {
      diameterTop: w * 0.9, diameterBottom: w * 0.9, height: h * 0.35, tessellation: 24
    }, { position: { x: 0, y: h * 0.28, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, pizzaFurniture, 'cheese', {
      diameterTop: w * 0.8, diameterBottom: w * 0.8, height: h * 0.4, tessellation: 24
    }, { position: { x: 0, y: h * 0.3, z: 0 } }, { parent: node });

    const pepPos = [
      { x: w * 0.2, z: w * 0.1 },
      { x: -w * 0.2, z: w * 0.12 },
      { x: 0, z: -w * 0.22 },
      { x: w * 0.14, z: -w * 0.15 },
      { x: -w * 0.15, z: -w * 0.14 }
    ];

    pepPos.forEach(p => {
      cylinderComponent(registry, item, pizzaFurniture, 'pepperoni', {
        diameterTop: w * 0.12, diameterBottom: w * 0.12, height: 0.005, tessellation: 12
      }, { position: { x: p.x, y: h * 0.52, z: p.z } }, { parent: node });
    });
  }
};

export const fruitPlatterFurniture = {
  type: 'fruit_platter',
  name: '果盘',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.15 },
  components: [
    { id: 'plate', label: '玻璃托盘', defaultColor: '#e0f7fa' },
    { id: 'apple', label: '红苹果', defaultColor: '#e53935' },
    { id: 'orange', label: '黄橙子', defaultColor: '#fb8c00' },
    { id: 'grape', label: '紫葡萄', defaultColor: '#8e24aa' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, fruitPlatterFurniture, 'plate', {
      diameterTop: w, diameterBottom: w * 0.7, height: h * 0.25, tessellation: 24
    }, { position: { x: 0, y: h * 0.125, z: 0 } }, { parent: node });

    sphereComponent(registry, item, fruitPlatterFurniture, 'apple', {
      diameter: w * 0.28, segments: 12
    }, { position: { x: -w * 0.16, y: h * 0.45, z: -w * 0.12 } }, { parent: node });

    sphereComponent(registry, item, fruitPlatterFurniture, 'orange', {
      diameter: w * 0.26, segments: 12
    }, { position: { x: w * 0.16, y: h * 0.42, z: -w * 0.1 } }, { parent: node });

    const grapes = [
      { x: 0, y: h * 0.4, z: w * 0.15 },
      { x: w * 0.08, y: h * 0.42, z: w * 0.22 },
      { x: -w * 0.08, y: h * 0.42, z: w * 0.22 },
      { x: 0, y: h * 0.52, z: w * 0.18 }
    ];

    grapes.forEach(g => {
      sphereComponent(registry, item, fruitPlatterFurniture, 'grape', {
        diameter: w * 0.14, segments: 10
      }, { position: { x: g.x, y: g.y, z: g.z } }, { parent: node });
    });
  }
};

export const teapotTeaCupsFurniture = {
  type: 'teapot_tea_cups',
  name: '功夫茶具',
  unit: 'm',
  defaultSize: { width: 0.42, depth: 0.3, height: 0.15 },
  components: [
    { id: 'tray', label: '紫砂/木茶盘', defaultColor: '#4e2e1e' },
    { id: 'teapot', label: '茶壶', defaultColor: '#6d4c41' },
    { id: 'cup', label: '品茗杯', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    boxComponent(registry, item, teapotTeaCupsFurniture, 'tray', {
      width: w, height: h * 0.2, depth: d
    }, { position: { x: 0, y: h * 0.1, z: 0 } }, { parent: node });

    const potR = w * 0.18;
    sphereComponent(registry, item, teapotTeaCupsFurniture, 'teapot', {
      diameter: potR * 2, segments: 14
    }, { position: { x: -w * 0.18, y: h * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, teapotTeaCupsFurniture, 'teapot', {
      diameterTop: potR * 0.8, diameterBottom: potR * 0.8, height: h * 0.1, tessellation: 12
    }, { position: { x: -w * 0.18, y: h * 0.75, z: 0 } }, { parent: node });

    const cupPos = [
      { x: w * 0.18, z: -d * 0.22 },
      { x: w * 0.32, z: -d * 0.22 },
      { x: w * 0.18, z: d * 0.22 },
      { x: w * 0.32, z: d * 0.22 }
    ];

    cupPos.forEach(cp => {
      cylinderComponent(registry, item, teapotTeaCupsFurniture, 'cup', {
        diameterTop: w * 0.1, diameterBottom: w * 0.07, height: h * 0.3, tessellation: 12
      }, { position: { x: cp.x, y: h * 0.35, z: cp.z } }, { parent: node });
    });
  }
};

export const coffeeCupSetFurniture = {
  type: 'coffee_cup_set',
  name: '咖啡杯碟',
  unit: 'm',
  defaultSize: { width: 0.18, depth: 0.18, height: 0.12 },
  components: [
    { id: 'saucer', label: '杯碟', defaultColor: '#ffffff' },
    { id: 'cup', label: '咖啡杯', defaultColor: '#fafafa' },
    { id: 'coffee', label: '黑咖啡', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    cylinderComponent(registry, item, coffeeCupSetFurniture, 'saucer', {
      diameterTop: w, diameterBottom: w * 0.8, height: h * 0.15, tessellation: 20
    }, { position: { x: 0, y: h * 0.075, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, coffeeCupSetFurniture, 'cup', {
      diameterTop: w * 0.58, diameterBottom: w * 0.42, height: h * 0.65, tessellation: 20
    }, { position: { x: 0, y: h * 0.45, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, coffeeCupSetFurniture, 'coffee', {
      diameterTop: w * 0.54, diameterBottom: w * 0.54, height: h * 0.05, tessellation: 16
    }, { position: { x: 0, y: h * 0.72, z: 0 } }, { parent: node });
  }
};

export const wineGlassesFurniture = {
  type: 'wine_glasses',
  name: '红酒高脚杯',
  unit: 'm',
  defaultSize: { width: 0.22, depth: 0.12, height: 0.22 },
  components: [
    { id: 'glass', label: '水晶杯身', defaultColor: '#e0f7fa' },
    { id: 'wine', label: '红酒液体', defaultColor: '#880e4f' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    [-w * 0.22, w * 0.22].forEach(x => {
      cylinderComponent(registry, item, wineGlassesFurniture, 'glass', {
        diameterTop: w * 0.32, diameterBottom: w * 0.32, height: h * 0.04, tessellation: 16
      }, { position: { x, y: h * 0.02, z: 0 } }, { parent: node });

      cylinderComponent(registry, item, wineGlassesFurniture, 'glass', {
        diameterTop: 0.008, diameterBottom: 0.008, height: h * 0.48, tessellation: 10
      }, { position: { x, y: h * 0.26, z: 0 } }, { parent: node });

      sphereComponent(registry, item, wineGlassesFurniture, 'glass', {
        diameter: w * 0.38, segments: 12
      }, { position: { x, y: h * 0.68, z: 0 } }, { parent: node });

      cylinderComponent(registry, item, wineGlassesFurniture, 'wine', {
        diameterTop: w * 0.34, diameterBottom: w * 0.2, height: h * 0.18, tessellation: 12
      }, { position: { x, y: h * 0.6, z: 0 } }, { parent: node });
    });
  }
};

export const pairMugsFurniture = {
  type: 'pair_mugs',
  name: '情侣马克杯',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.15, height: 0.15 },
  components: [
    { id: 'mugRed', label: '情侣红杯', defaultColor: '#e53935' },
    { id: 'mugBlue', label: '情侣蓝杯', defaultColor: '#1e88e5' },
    { id: 'handle', label: '把手', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, pairMugsFurniture, 'mugRed', {
      diameterTop: size.width * 0.38, diameterBottom: size.width * 0.38, height: size.height
    }, { position: { x: -size.width * 0.22, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, pairMugsFurniture, 'handle', {
      width: size.width * 0.08, height: size.height * 0.6, depth: 0.02
    }, { position: { x: -size.width * 0.44, y: size.height / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, pairMugsFurniture, 'mugBlue', {
      diameterTop: size.width * 0.38, diameterBottom: size.width * 0.38, height: size.height
    }, { position: { x: size.width * 0.22, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, pairMugsFurniture, 'handle', {
      width: size.width * 0.08, height: size.height * 0.6, depth: 0.02
    }, { position: { x: size.width * 0.44, y: size.height / 2, z: 0 } }, { parent: node });
  }
};



// 冰糖葫芦
export const sugarHawSkewerFurniture = {
  type: 'sugar_haw_skewer',
  name: '冰糖葫芦',
  unit: 'm',
  defaultSize: { width: 0.08, depth: 0.08, height: 0.28 },
  components: [
    { id: 'stick', label: '竹签', defaultColor: '#d7ccc8' },
    { id: 'haws', label: '山楂果', defaultColor: '#d50000' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    // 贯穿竹签
    cylinderComponent(registry, item, sugarHawSkewerFurniture, 'stick', {
      diameterTop: 0.006, diameterBottom: 0.006, height: h, tessellation: 8
    }, { position: { x: 0, y: h / 2, z: 0 } }, { parent: node });

    // 5 颗串在一起的山楂 
    const hawYs = [h * 0.3, h * 0.44, h * 0.58, h * 0.72, h * 0.86];

    hawYs.forEach(y => {
      // 山楂果实
      sphereComponent(registry, item, sugarHawSkewerFurniture, 'haws', {
        diameter: 0.038, segments: 12
      }, { position: { x: 0, y, z: 0 } }, { parent: node });
    });
  }
};

export const FOOD_FURNITURE_LIST = [
  sugarHawSkewerFurniture,
  hamburgerFurniture,
  frenchFriesFurniture,
  steamedBunFurniture,
  bbqSkewersFurniture,
  sushiFurniture,
  iceCreamFurniture,
  hotpotFurniture,
  ramenBowlFurniture,
  appleFurniture,
  bananaFurniture,
  pineappleFurniture,
  watermelonFurniture,
  dragonFruitFurniture,
  orangeFruitFurniture,
  peachFurniture,
  grapeBunchFurniture,
  cabbageFurniture,
  bokChoyFurniture,
  cauliflowerFurniture,
  cucumberFurniture,
  greenBeansFurniture,
  eggplantFurniture,
  chiliPepperFurniture,
  lotusRootFurniture,
  waxGourdFurniture,
  tomatoFurniture,
  cakeFurniture,
  milkTeaFurniture,
  canSodaFurniture,
  bottledDrinkFurniture,
  wineBottleFurniture,
  roastChickenFurniture,
  stirFriedVeggiesFurniture,
  steakPlateFurniture,
  spaghettiPlateFurniture,
  pizzaFurniture,
  fruitPlatterFurniture,
  teapotTeaCupsFurniture,
  coffeeCupSetFurniture,
  wineGlassesFurniture,
  pairMugsFurniture
];
