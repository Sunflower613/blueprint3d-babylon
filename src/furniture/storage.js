import { boxComponent } from './_helpers.js';

// 1. 实用书架 (Bookshelf)
export const bookshelfFurniture = {
  type: 'bookshelf',
  name: '实用书架',
  defaultSize: { width: 32, depth: 12, height: 72 },
  components: [
    { id: 'frame', label: '外框', defaultColor: '#8a6b51' },
    { id: 'shelves', label: '隔板', defaultColor: '#a68065' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.04;
    const backT = 0.01;

    // 左
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 右
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: wallT, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - wallT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 顶
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: size.width - wallT * 2, height: wallT, depth: size.depth
    }, { position: { x: 0, y: size.height - wallT / 2, z: 0 } }, { parent: node });

    // 底
    const baseH = 0.06;
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: size.width - wallT * 2, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 背
    boxComponent(registry, item, bookshelfFurniture, 'frame', {
      width: size.width, height: size.height, depth: backT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + backT / 2 } }, { parent: node });

    // 隔板
    const innerW = size.width - wallT * 2;
    const shelfH = 0.03;
    const shelfD = size.depth - 0.02;
    [0.25, 0.50, 0.75].forEach((ratio) => {
      boxComponent(registry, item, bookshelfFurniture, 'shelves', {
        width: innerW, height: shelfH, depth: shelfD
      }, { position: { x: 0, y: size.height * ratio, z: backT / 2 } }, { parent: node });
    });
  }
};

// 2. 北欧电视柜 (Console)
export const consoleFurniture = {
  type: 'console',
  name: '北欧电视柜',
  defaultSize: { width: 60, depth: 16, height: 20 },
  components: [
    { id: 'cabinet', label: '柜身', defaultColor: '#e9e6e0' },
    { id: 'legs', label: '柜腿', defaultColor: '#80776b' }
  ],
  build(registry, item, node, size) {
    const legH = size.height * 0.24;
    const cabH = size.height * 0.76;

    boxComponent(registry, item, consoleFurniture, 'cabinet', {
      width: size.width, height: cabH, depth: size.depth
    }, { position: { x: 0, y: legH + cabH / 2, z: 0 } }, { parent: node });

    // 柜门线条
    boxComponent(registry, item, consoleFurniture, 'legs', {
      width: 0.015, height: cabH * 0.88, depth: 0.01
    }, { position: { x: 0, y: legH + cabH / 2, z: size.depth / 2 + 0.005 } }, { parent: node });

    const legW = Math.max(0.03, size.width * 0.05);
    const legD = Math.max(0.03, size.depth * 0.12);
    const xOffset = size.width * 0.42;
    const zOffset = size.depth * 0.36;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, consoleFurniture, 'legs', {
          width: legW, height: legH, depth: legD
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });
  }
};

// 3. 卧室大衣柜 (Wardrobe)
export const wardrobeFurniture = {
  type: 'wardrobe',
  name: '卧室大衣柜',
  defaultSize: { width: 42, depth: 24, height: 80 },
  components: [
    { id: 'cabinet', label: '柜身', defaultColor: '#e9e3d5' },
    { id: 'doors', label: '柜门', defaultColor: '#d1c9b7' },
    { id: 'handles', label: '拉手', defaultColor: '#5c5547' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, wardrobeFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const doorT = 0.02;
    const doorW = (size.width - 0.06) / 2;
    const doorH = size.height * 0.94;
    const doorY = size.height * 0.49;
    const doorZ = size.depth / 2 + doorT / 2;

    boxComponent(registry, item, wardrobeFurniture, 'doors', {
      width: doorW, height: doorH, depth: doorT
    }, { position: { x: -doorW / 2 - 0.01, y: doorY, z: doorZ } }, { parent: node });

    boxComponent(registry, item, wardrobeFurniture, 'doors', {
      width: doorW, height: doorH, depth: doorT
    }, { position: { x: doorW / 2 + 0.01, y: doorY, z: doorZ } }, { parent: node });

    const handleW = 0.015;
    const handleH = size.height * 0.18;
    const handleD = 0.015;
    const handleZ = doorZ + doorT / 2 + handleD / 2;

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, wardrobeFurniture, 'handles', {
        width: handleW, height: handleH, depth: handleD
      }, { position: { x: side * 0.025, y: size.height * 0.5, z: handleZ } }, { parent: node });
    });
  }
};

// 4. 现代床头柜 (Nightstand)
export const nightstandFurniture = {
  type: 'nightstand',
  name: '现代床头柜',
  defaultSize: { width: 20, depth: 18, height: 24 },
  components: [
    { id: 'cabinet', label: '柜体', defaultColor: '#e3dfd8' },
    { id: 'drawer', label: '抽屉', defaultColor: '#bcaea0' },
    { id: 'legs', label: '柜腿', defaultColor: '#6f6458' }
  ],
  build(registry, item, node, size) {
    const legH = size.height * 0.15;
    const cabH = size.height * 0.85;

    boxComponent(registry, item, nightstandFurniture, 'cabinet', {
      width: size.width, height: cabH, depth: size.depth
    }, { position: { x: 0, y: legH + cabH / 2, z: 0 } }, { parent: node });

    const dThick = 0.02;
    const dW = size.width * 0.88;
    const dH = cabH * 0.36;
    const dZ = size.depth / 2 + dThick / 2;

    boxComponent(registry, item, nightstandFurniture, 'drawer', {
      width: dW, height: dH, depth: dThick
    }, { position: { x: 0, y: legH + cabH * 0.26, z: dZ } }, { parent: node });

    boxComponent(registry, item, nightstandFurniture, 'drawer', {
      width: dW, height: dH, depth: dThick
    }, { position: { x: 0, y: legH + cabH * 0.70, z: dZ } }, { parent: node });

    const legW = Math.max(0.02, size.width * 0.1);
    const legD = Math.max(0.02, size.depth * 0.1);
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, nightstandFurniture, 'legs', {
          width: legW, height: legH, depth: legD
        }, { position: { x: x * (size.width / 2 - legW / 2), y: legH / 2, z: z * (size.depth / 2 - legD / 2) } }, { parent: node });
      });
    });
  }
};

// 5. 厨房地柜 (Cabinet Kitchen)
export const cabinetKitchenFurniture = {
  type: 'cabinet_kitchen',
  name: '厨房橱柜',
  defaultSize: { width: 36, depth: 24, height: 36 },
  components: [
    { id: 'counter', label: '石英台面', defaultColor: '#fcfcfa' },
    { id: 'doors', label: '柜门', defaultColor: '#89a5ad' },
    { id: 'handles', label: '拉手', defaultColor: '#cccccc' }
  ],
  build(registry, item, node, size) {
    const counterH = 0.04;
    const bodyH = size.height - counterH;

    boxComponent(registry, item, cabinetKitchenFurniture, 'doors', {
      width: size.width, height: bodyH, depth: size.depth
    }, { position: { x: 0, y: bodyH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, cabinetKitchenFurniture, 'counter', {
      width: size.width + 0.01, height: counterH, depth: size.depth + 0.01
    }, { position: { x: 0, y: size.height - counterH / 2, z: 0 } }, { parent: node });

    // 柜门拉手
    boxComponent(registry, item, cabinetKitchenFurniture, 'handles', {
      width: size.width * 0.82, height: 0.02, depth: 0.015
    }, { position: { x: 0, y: bodyH * 0.88, z: size.depth / 2 + 0.01 } }, { parent: node });
  }
};

// 6. 矮鞋架 (Shoerack)
export const shoerackFurniture = {
  type: 'shoerack',
  name: '鞋架',
  defaultSize: { width: 32, depth: 12, height: 18 },
  components: [
    { id: 'frame', label: '架身', defaultColor: '#80634e' },
    { id: 'slats', label: '格栅层板', defaultColor: '#a1846f' }
  ],
  build(registry, item, node, size) {
    // 侧板左右
    const sideW = 0.03;
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, shoerackFurniture, 'frame', {
        width: sideW, height: size.height, depth: size.depth
      }, { position: { x: side * (size.width / 2 - sideW / 2), y: size.height / 2, z: 0 } }, { parent: node });
    });

    // 2层鞋架板
    const shelfW = size.width - sideW * 2;
    [0.32, 0.72].forEach((ratio) => {
      boxComponent(registry, item, shoerackFurniture, 'slats', {
        width: shelfW, height: 0.02, depth: size.depth * 0.88
      }, { position: { x: 0, y: size.height * ratio, z: 0 } }, { parent: node });
    });
  }
};

// 7. 五斗柜 (Chest Drawers)
export const chestDrawersFurniture = {
  type: 'chest_drawers',
  name: '五斗柜',
  defaultSize: { width: 32, depth: 18, height: 48 },
  components: [
    { id: 'cabinet', label: '柜体', defaultColor: '#e6d6c3' },
    { id: 'drawers', label: '抽屉面', defaultColor: '#d1bfad' },
    { id: 'knobs', label: '圆形拉手', defaultColor: '#594c3d' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, chestDrawersFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const dH = size.height * 0.17;
    const dW = size.width * 0.92;
    const dZ = size.depth / 2 + 0.01;

    [0.10, 0.28, 0.46, 0.64, 0.82].forEach((ratio) => {
      boxComponent(registry, item, chestDrawersFurniture, 'drawers', {
        width: dW, height: dH, depth: 0.02
      }, { position: { x: 0, y: size.height * ratio + dH / 2, z: dZ } }, { parent: node });

      // 拉手钮
      boxComponent(registry, item, chestDrawersFurniture, 'knobs', {
        width: 0.025, height: 0.025, depth: 0.02
      }, { position: { x: 0, y: size.height * ratio + dH / 2, z: dZ + 0.015 } }, { parent: node });
    });
  }
};

// 8. 矮餐边柜 (Sideboard)
export const sideboardFurniture = {
  type: 'sideboard',
  name: '餐边柜',
  defaultSize: { width: 54, depth: 16, height: 32 },
  components: [
    { id: 'cabinet', label: '柜身', defaultColor: '#ebd9c1' },
    { id: 'doors', label: '两侧柜门', defaultColor: '#d1bfad' },
    { id: 'drawers', label: '中间抽屉', defaultColor: '#d1bfad' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, sideboardFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 中间三层抽屉
    const midW = size.width * 0.36;
    const dH = size.height * 0.28;
    const dZ = size.depth / 2 + 0.01;
    [0.12, 0.44, 0.76].forEach((ratio) => {
      boxComponent(registry, item, sideboardFurniture, 'drawers', {
        width: midW, height: dH, depth: 0.02
      }, { position: { x: 0, y: size.height * ratio, z: dZ } }, { parent: node });
    });

    // 两侧大开柜门
    const doorW = (size.width - midW - 0.06) / 2;
    const doorH = size.height * 0.90;
    const doorY = size.height * 0.48;
    boxComponent(registry, item, sideboardFurniture, 'doors', {
      width: doorW, height: doorH, depth: 0.02
    }, { position: { x: -size.width / 2 + doorW / 2 + 0.015, y: doorY, z: dZ } }, { parent: node });

    boxComponent(registry, item, sideboardFurniture, 'doors', {
      width: doorW, height: doorH, depth: 0.02
    }, { position: { x: size.width / 2 - doorW / 2 - 0.015, y: doorY, z: dZ } }, { parent: node });
  }
};

// 9. 玻璃展示柜 (Display Cabinet)
export const displayCabinetFurniture = {
  type: 'display_cabinet',
  name: '玻璃展示柜',
  defaultSize: { width: 28, depth: 14, height: 68 },
  components: [
    { id: 'cabinet', label: '柜体框架', defaultColor: '#403c39' },
    { id: 'glass', label: '防尘玻璃', defaultColor: '#d4efff' },
    { id: 'shelves', label: '层板', defaultColor: '#c9bdad' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.04;
    // 1. 柜体大壳
    boxComponent(registry, item, displayCabinetFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 玻璃门板 (Glass Panel) - 半透明浅蓝色
    boxComponent(registry, item, displayCabinetFurniture, 'glass', {
      width: size.width - wallT * 1.5, height: size.height * 0.88, depth: 0.01
    }, { position: { x: 0, y: size.height * 0.48, z: size.depth / 2 + 0.005 } }, { parent: node });

    // 3. 层板
    const innerW = size.width - wallT * 2;
    [0.28, 0.52, 0.76].forEach((ratio) => {
      boxComponent(registry, item, displayCabinetFurniture, 'shelves', {
        width: innerW, height: 0.02, depth: size.depth - 0.04
      }, { position: { x: 0, y: size.height * ratio, z: 0 } }, { parent: node });
    });
  }
};

// 10. 墙壁置物架 (Wall Shelf)
export const wallShelfFurniture = {
  type: 'wall_shelf',
  name: '墙壁搁板',
  defaultSize: { width: 30, depth: 8, height: 2 },
  components: [
    { id: 'board', label: '置物搁板', defaultColor: '#aa845d' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, wallShelfFurniture, 'board', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};
