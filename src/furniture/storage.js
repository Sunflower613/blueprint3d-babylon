import { boxComponent, cylinderComponent } from './_helpers.js';

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

// 11. 九宫格收纳柜 (Grid Cabinet)
export const gridCabinetFurniture = {
  type: 'grid_cabinet',
  name: '九宫格收纳柜',
  defaultSize: { width: 36, depth: 12, height: 36 },
  components: [
    { id: 'frame', label: '外框', defaultColor: '#f5f5f5' },
    { id: 'divider', label: '格挡板', defaultColor: '#d2b48c' },
    { id: 'basket', label: '收纳筐', defaultColor: '#f4a460' }
  ],
  build(registry, item, node, size) {
    const wallT = 0.03;
    boxComponent(registry, item, gridCabinetFurniture, 'frame', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const innerW = size.width - wallT * 2;
    const innerH = size.height - wallT * 2;
    const shelfH = 0.02;

    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: innerW, height: shelfH, depth: size.depth - 0.01
    }, { position: { x: 0, y: size.height * 0.33, z: 0.005 } }, { parent: node });
    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: innerW, height: shelfH, depth: size.depth - 0.01
    }, { position: { x: 0, y: size.height * 0.66, z: 0.005 } }, { parent: node });

    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: shelfH, height: innerH, depth: size.depth - 0.01
    }, { position: { x: -size.width * 0.16, y: size.height / 2, z: 0.005 } }, { parent: node });
    boxComponent(registry, item, gridCabinetFurniture, 'divider', {
      width: shelfH, height: innerH, depth: size.depth - 0.01
    }, { position: { x: size.width * 0.16, y: size.height / 2, z: 0.005 } }, { parent: node });

    boxComponent(registry, item, gridCabinetFurniture, 'basket', {
      width: size.width * 0.26, height: size.height * 0.26, depth: size.depth - 0.02
    }, { position: { x: -size.width * 0.3, y: size.height * 0.8, z: 0.01 } }, { parent: node });

    boxComponent(registry, item, gridCabinetFurniture, 'basket', {
      width: size.width * 0.26, height: size.height * 0.26, depth: size.depth - 0.02
    }, { position: { x: size.width * 0.3, y: size.height * 0.2, z: 0.01 } }, { parent: node });
  }
};

// 12. 智能快递柜 (Parcel Locker)
export const parcelLockerFurniture = {
  type: 'parcel_locker',
  name: '智能快递柜',
  defaultSize: { width: 48, depth: 18, height: 76 },
  components: [
    { id: 'body', label: '柜体', defaultColor: '#ff8800' },
    { id: 'doors', label: '格口门', defaultColor: '#d0d4d9' },
    { id: 'screen', label: '触摸屏', defaultColor: '#00aaff' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, parcelLockerFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const cols = 4;
    const rows = 5;
    const doorW = size.width / cols - 0.015;
    const doorH = size.height / rows - 0.015;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 2 && (c === 1 || c === 2)) continue;

        const posX = -size.width / 2 + doorW / 2 + c * (doorW + 0.01) + 0.007;
        const posY = doorH / 2 + r * (doorH + 0.01) + 0.007;
        boxComponent(registry, item, parcelLockerFurniture, 'doors', {
          width: doorW, height: doorH, depth: 0.008
        }, { position: { x: posX, y: posY, z: size.depth / 2 + 0.004 } }, { parent: node });
      }
    }

    boxComponent(registry, item, parcelLockerFurniture, 'screen', {
      width: doorW * 2, height: doorH, depth: 0.008
    }, { position: { x: 0, y: doorH / 2 + 2 * (doorH + 0.01), z: size.depth / 2 + 0.004 } }, { parent: node });
  }
};

// 13. 转角置物架 (Corner Shelf)
export const cornerShelfFurniture = {
  type: 'corner_shelf',
  name: '转角置物架',
  defaultSize: { width: 16, depth: 16, height: 60 },
  components: [
    { id: 'pole', label: '立柱支撑', defaultColor: '#4e342e' },
    { id: 'shelves', label: '扇形隔板', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const poleD = 0.03;
    boxComponent(registry, item, cornerShelfFurniture, 'pole', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, cornerShelfFurniture, 'pole', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: size.width / 2 - poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, cornerShelfFurniture, 'pole', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: size.depth / 2 - poleD / 2 } }, { parent: node });

    const shelfH = 0.02;
    [0.15, 0.4, 0.65, 0.9].forEach(ratio => {
      boxComponent(registry, item, cornerShelfFurniture, 'shelves', {
        width: size.width - 0.02, height: shelfH, depth: size.depth - 0.02
      }, { position: { x: -0.01, y: size.height * ratio, z: -0.01 } }, { parent: node });
    });
  }
};

// 14. 钢制文件柜 (File Cabinet)
export const fileCabinetFurniture = {
  type: 'file_cabinet',
  name: '钢制文件柜',
  defaultSize: { width: 18, depth: 24, height: 50 },
  components: [
    { id: 'cabinet', label: '柜体', defaultColor: '#78909c' },
    { id: 'handles', label: '拉手', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, fileCabinetFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const drawH = size.height / 4;
    for (let i = 0; i < 4; i++) {
      boxComponent(registry, item, fileCabinetFurniture, 'handles', {
        width: size.width * 0.9, height: 0.005, depth: 0.002
      }, { position: { x: 0, y: drawH * i + drawH - 0.005, z: size.depth / 2 + 0.001 } }, { parent: node });

      boxComponent(registry, item, fileCabinetFurniture, 'handles', {
        width: size.width * 0.4, height: 0.02, depth: 0.015
      }, { position: { x: 0, y: drawH * i + drawH * 0.5, z: size.depth / 2 + 0.008 } }, { parent: node });
    }
  }
};

// 15. 木质红酒架 (Wine Rack)
export const wineRackFurniture = {
  type: 'wine_rack',
  name: '木质红酒架',
  defaultSize: { width: 16, depth: 12, height: 16 },
  components: [
    { id: 'frame', label: '红酒外架', defaultColor: '#5c4033' },
    { id: 'bottles', label: '红酒瓶', defaultColor: '#2f4f4f' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, wineRackFurniture, 'frame', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    for (let r = 0; r < 2; r++) {
      for (let c = -1; c <= 1; c++) {
        cylinderComponent(registry, item, wineRackFurniture, 'bottles', {
          diameterTop: 0.06, diameterBottom: 0.06, height: size.depth * 0.8
        }, { position: { x: c * 0.12, y: size.height * 0.3 + r * 0.4 * size.height, z: 0 } }, { parent: node });
      }
    }

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('bottles')) {
        m.rotation.x = Math.PI * 0.5;
      }
    });
  }
};

// 16. 落地衣帽架 (Coat Rack)
export const coatRackFurniture = {
  type: 'coat_rack',
  name: '落地衣帽架',
  defaultSize: { width: 14, depth: 14, height: 68 },
  components: [
    { id: 'base', label: '底座', defaultColor: '#3e2723' },
    { id: 'pole', label: '中心立杆', defaultColor: '#4e342e' },
    { id: 'hooks', label: '挂钩支角', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, coatRackFurniture, 'base', {
      diameterTop: size.width * 0.8, diameterBottom: size.width, height: size.height * 0.05
    }, { position: { x: 0, y: size.height * 0.025, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, coatRackFurniture, 'pole', {
      diameterTop: 0.04, diameterBottom: 0.06, height: size.height * 0.95
    }, { position: { x: 0, y: size.height * 0.5, z: 0 } }, { parent: node });

    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    angles.forEach((ang, idx) => {
      const hook = boxComponent(registry, item, coatRackFurniture, 'hooks', {
        width: 0.02, height: 0.03, depth: size.width * 0.28
      }, { position: { x: Math.sin(ang) * 0.08, y: size.height * 0.8 - idx * 0.04, z: Math.cos(ang) * 0.08 } }, { parent: node });
      hook.rotation.y = ang;
      hook.rotation.x = -Math.PI * 0.15;
    });
  }
};

// 17. 玄关雨伞架 (Umbrella Stand)
export const umbrellaStandFurniture = {
  type: 'umbrella_stand',
  name: '玄关雨伞架',
  defaultSize: { width: 10, depth: 10, height: 22 },
  components: [
    { id: 'body', label: '架身', defaultColor: '#263238' },
    { id: 'umbrella', label: '雨伞', defaultColor: '#ffd54f' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, umbrellaStandFurniture, 'body', {
      diameterTop: size.width, diameterBottom: size.width * 0.9, height: size.height
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, umbrellaStandFurniture, 'umbrella', {
      diameterTop: 0.015, diameterBottom: 0.015, height: size.height * 0.6
    }, { position: { x: -size.width * 0.1, y: size.height * 1.1, z: size.depth * 0.1 } }, { parent: node });
  }
};

// 18. 多层抽屉柜 (Drawer Cabinet)
export const drawerCabinetFurniture = {
  type: 'drawer_cabinet',
  name: '多层抽屉柜',
  defaultSize: { width: 24, depth: 18, height: 32 },
  components: [
    { id: 'body', label: '柜身', defaultColor: '#efebe9' },
    { id: 'drawers', label: '抽屉面', defaultColor: '#d7ccc8' },
    { id: 'handles', label: '拉把', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, drawerCabinetFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const layerH = size.height / 3 - 0.015;
    for (let i = 0; i < 3; i++) {
      const posY = layerH / 2 + i * (layerH + 0.01) + 0.01;
      boxComponent(registry, item, drawerCabinetFurniture, 'drawers', {
        width: size.width * 0.94, height: layerH, depth: 0.01
      }, { position: { x: 0, y: posY, z: size.depth / 2 + 0.002 } }, { parent: node });

      boxComponent(registry, item, drawerCabinetFurniture, 'handles', {
        width: size.width * 0.28, height: 0.02, depth: 0.02
      }, { position: { x: 0, y: posY, z: size.depth / 2 + 0.012 } }, { parent: node });
    }
  }
};

