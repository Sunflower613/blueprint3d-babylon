import { boxComponent, cylinderComponent } from './_helpers.js';

// 1. 简约餐桌 (Table)
export const tableFurniture = {
  type: 'table',
  name: '餐桌',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.75, height: 0.75 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#ffffff' },
    { id: 'legs', label: '桌腿', defaultColor: '#c7c1b7' }
  ],
  build(registry, item, node, size) {
    const topH = 0.04;
    boxComponent(registry, item, tableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    const legW = 0.05;
    const xOffset = size.width / 2 - legW / 2 - 0.02;
    const zOffset = size.depth / 2 - legW / 2 - 0.02;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, tableFurniture, 'legs', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });
  }
};

// 2. 原木书桌 (Desk)
export const deskFurniture = {
  type: 'desk',
  name: '书桌',
  unit: 'm',
  defaultSize: { width: 1.4, depth: 0.6, height: 0.75 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#d6ab7b' },
    { id: 'legs', label: '桌脚', defaultColor: '#8c7151' },
    { id: 'drawer', label: '抽屉', defaultColor: '#bca487' }
  ],
  build(registry, item, node, size) {
    const topH = 0.04;
    boxComponent(registry, item, deskFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    const sideW = 0.04;
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, deskFurniture, 'legs', {
        width: sideW, height: legH, depth: size.depth * 0.94
      }, { position: { x: side * (size.width / 2 - sideW / 2 - 0.01), y: legH / 2, z: 0 } }, { parent: node });
    });

    const drawerH = size.height * 0.16;
    const drawerW = size.width * 0.28;
    boxComponent(registry, item, deskFurniture, 'drawer', {
      width: drawerW, height: drawerH, depth: size.depth * 0.88
    }, { position: { x: -size.width * 0.22, y: size.height - topH - drawerH / 2, z: 0 } }, { parent: node });
  }
};

// 3. 实木茶几 (Coffee Table)
export const coffeeTableFurniture = {
  type: 'coffee_table',
  name: '茶几',
  unit: 'm',
  defaultSize: { width: 0.7, depth: 0.7, height: 0.45 },
  components: [
    { id: 'top', label: '实木面板与搁板', defaultColor: '#c9a882' },
    { id: 'legs', label: '实木桌腿边框', defaultColor: '#967b61' }
  ],
  build(registry, item, node, size) {
    const topH = Math.min(0.045, size.height * 0.12);
    const topY = size.height - topH / 2;

    // 1. 上层实木桌面面板
    boxComponent(registry, item, coffeeTableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: topY, z: 0 } }, { parent: node });

    // 2. 桌面凹槽托盘沿
    boxComponent(registry, item, coffeeTableFurniture, 'top', {
      width: size.width * 0.94, height: topH * 0.4, depth: size.depth * 0.94
    }, { position: { x: 0, y: size.height - topH - topH * 0.2, z: 0 } }, { parent: node });

    // 3. 下层横向置物搁板
    const shelfH = topH * 0.8;
    const shelfY = size.height * 0.32;
    boxComponent(registry, item, coffeeTableFurniture, 'top', {
      width: size.width * 0.88, height: shelfH, depth: size.depth * 0.88
    }, { position: { x: 0, y: shelfY, z: 0 } }, { parent: node });

    // 4. 四角贯穿支撑立柱腿
    const legH = size.height - topH * 1.4;
    const legW = Math.min(0.045, Math.min(size.width, size.depth) * 0.1);
    const inset = Math.min(0.045, Math.min(size.width, size.depth) * 0.08);
    const xOffset = size.width / 2 - inset - legW / 2;
    const zOffset = size.depth / 2 - inset - legW / 2;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, coffeeTableFurniture, 'legs', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });

  }
};

// 4. 小边几 (Side Table)
export const sideTableFurniture = {
  type: 'side_table',
  name: '边几',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.55 },
  components: [
    { id: 'top', label: '奶油白防落托盘', defaultColor: '#f7f4ed' },
    { id: 'legs', label: '原木色斜撑腿', defaultColor: '#b08e68' },
    { id: 'accent', label: '铜质饰件', defaultColor: '#d4af37' }
  ],
  build(registry, item, node, size) {
    const topH = Math.min(0.04, size.height * 0.09);
    const topY = size.height - topH;

    cylinderComponent(registry, item, sideTableFurniture, 'top', {
      diameterTop: size.width,
      diameterBottom: size.width * 0.98,
      height: topH,
      tessellation: 24
    }, { position: { x: 0, y: topY, z: 0 } }, { parent: node });

    const rimH = size.height * 0.05;
    cylinderComponent(registry, item, sideTableFurniture, 'top', {
      diameterTop: size.width,
      diameterBottom: size.width,
      height: rimH,
      tessellation: 24
    }, { position: { x: 0, y: topY + topH / 2 + rimH / 2, z: 0 } }, { parent: node });

    const midY = size.height * 0.38;
    cylinderComponent(registry, item, sideTableFurniture, 'top', {
      diameterTop: size.width * 0.78,
      diameterBottom: size.width * 0.78,
      height: topH * 0.8,
      tessellation: 20
    }, { position: { x: 0, y: midY, z: 0 } }, { parent: node });

    const legH = size.height - topH * 1.2;
    const legD = Math.min(0.035, size.width * 0.08);
    const legR = size.width * 0.36;

    for (let index = 0; index < 3; index += 1) {
      const angle = (index * 2 * Math.PI) / 3;
      const legX = Math.cos(angle) * legR;
      const legZ = Math.sin(angle) * legR;

      const leg = cylinderComponent(registry, item, sideTableFurniture, 'legs', {
        diameterTop: legD,
        diameterBottom: legD * 0.7,
        height: legH,
        tessellation: 10
      }, { position: { x: legX, y: legH / 2, z: legZ } }, { parent: node });

      leg.rotation.z = -Math.cos(angle) * 0.12;
      leg.rotation.x = Math.sin(angle) * 0.12;
    }

    cylinderComponent(registry, item, sideTableFurniture, 'accent', {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: 0.012,
      tessellation: 12
    }, { position: { x: 0, y: topY + rimH + 0.006, z: 0 } }, { parent: node });
  }
};

// 5. 大圆餐桌 (Round Table)
export const roundTableFurniture = {
  type: 'round_table',
  name: '圆桌',
  unit: 'm',
  defaultSize: { width: 1.35, depth: 1.35, height: 0.75 },
  components: [
    { id: 'top', label: '圆桌面', defaultColor: '#f3eedf' },
    { id: 'base', label: '圆柱底座', defaultColor: '#7b6754' }
  ],
  build(registry, item, node, size) {
    const topH = 0.04;
    cylinderComponent(registry, item, roundTableFurniture, 'top', {
      diameterTop: 1, diameterBottom: 1, height: topH, tessellation: 32
    }, {
      position: { x: 0, y: size.height - topH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });

    const legH = size.height - topH;
    cylinderComponent(registry, item, roundTableFurniture, 'base', {
      diameterTop: 0.18, diameterBottom: 0.28, height: legH, tessellation: 24
    }, {
      position: { x: 0, y: legH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });
  }
};

// 6. 多人家长餐桌 (Dining Table Long)
export const diningTableLongFurniture = {
  type: 'dining_table_long',
  name: '长餐桌',
  unit: 'm',
  defaultSize: { width: 1.85, depth: 0.9, height: 0.75 },
  components: [
    { id: 'top', label: '长桌面', defaultColor: '#b07443' },
    { id: 'legs', label: '粗桌腿', defaultColor: '#784924' },
    { id: 'cloth', label: '长条桌布', defaultColor: '#4c6a58' }
  ],
  build(registry, item, node, size) {
    const topH = 0.05;
    boxComponent(registry, item, diningTableLongFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    const legW = Math.max(0.06, size.width * 0.08);
    const xOffset = size.width / 2 - legW / 2 - 0.02;
    const zOffset = size.depth / 2 - legW / 2 - 0.02;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, diningTableLongFurniture, 'legs', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });

    // 绿色长条桌布，带有两端垂悬效果
    const clothZ = size.depth * 0.38;
    const clothThick = 0.002;
    const hangH = 0.22;

    // 桌面平铺部分
    boxComponent(registry, item, diningTableLongFurniture, 'cloth', {
      width: size.width, height: clothThick, depth: clothZ
    }, { position: { x: 0, y: size.height + clothThick / 2, z: 0 } }, { parent: node });

    // 左侧悬挂部分
    boxComponent(registry, item, diningTableLongFurniture, 'cloth', {
      width: clothThick, height: hangH, depth: clothZ
    }, { position: { x: -size.width / 2 - clothThick / 2, y: size.height - hangH / 2, z: 0 } }, { parent: node });

    // 右侧悬挂部分
    boxComponent(registry, item, diningTableLongFurniture, 'cloth', {
      width: clothThick, height: hangH, depth: clothZ
    }, { position: { x: size.width / 2 + clothThick / 2, y: size.height - hangH / 2, z: 0 } }, { parent: node });
  }
};

// 7. 玄关长条几 (Console Table)
export const consoleTableFurniture = {
  type: 'console_table',
  name: '长条几',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.3, height: 0.8 },
  components: [
    { id: 'top', label: '台面', defaultColor: '#ffffff' },
    { id: 'frame', label: '铁底架', defaultColor: '#3d3b38' }
  ],
  build(registry, item, node, size) {
    const topH = 0.03;
    boxComponent(registry, item, consoleTableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    const legW = 0.025;
    const xOffset = size.width / 2 - legW / 2;
    const zOffset = size.depth / 2 - legW / 2;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, consoleTableFurniture, 'frame', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });

    // 底部横向加固条
    boxComponent(registry, item, consoleTableFurniture, 'frame', {
      width: size.width - legW * 2, height: 0.02, depth: 0.02
    }, { position: { x: 0, y: legH * 0.2, z: 0 } }, { parent: node });
    // 底部纵向加固条
    [-1, 1].forEach((x) => {
      boxComponent(registry, item, consoleTableFurniture, 'frame', {
        width: 0.02, height: 0.02, depth: size.depth - legW * 2
      }, { position: { x: x * (size.width / 2 - 0.01), y: legH * 0.2, z: 0 } }, { parent: node });
    });
  }
};

// 8. 电竞电脑桌 (Computer Desk)
export const computerDeskFurniture = {
  type: 'computer_desk',
  name: '电脑桌',
  unit: 'm',
  defaultSize: { width: 1.4, depth: 0.65, height: 0.75 },
  components: [
    { id: 'top', label: '台面', defaultColor: '#2b2d30' },
    { id: 'legs', label: '电竞腿', defaultColor: '#ff4d4d' },
    { id: 'shelf', label: '主机架', defaultColor: '#202124' }
  ],
  build(registry, item, node, size) {
    const topH = 0.04;
    boxComponent(registry, item, computerDeskFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    // Z形或粗脚架
    [-1, 1].forEach((x) => {
      boxComponent(registry, item, computerDeskFurniture, 'legs', {
        width: 0.06, height: legH, depth: size.depth * 0.82
      }, { position: { x: x * (size.width / 2 - 0.04), y: legH / 2, z: 0 } }, { parent: node });
    });

    // 主机悬空挡板架 (Shelf)
    boxComponent(registry, item, computerDeskFurniture, 'shelf', {
      width: size.width * 0.22, height: 0.025, depth: size.depth * 0.68
    }, { position: { x: size.width * 0.32, y: legH * 0.28, z: 0 } }, { parent: node });
  }
};

// 9. 悬浮搁板 (Bedside Desk)
export const bedsideDeskFurniture = {
  type: 'bedside_desk',
  name: '悬浮搁板',
  placeType: 'wall',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.35, height: 0.05 },
  components: [
    { id: 'top', label: '木板', defaultColor: '#ebd8c8' }
  ],
  build(registry, item, node, size) {
    // 挂墙无脚抽屉盒子
    boxComponent(registry, item, bedsideDeskFurniture, 'top', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 10. 连体野餐桌椅 (Picnic Table)
export const picnicTableFurniture = {
  type: 'picnic_table',
  name: '野餐桌',
  unit: 'm',
  defaultSize: { width: 1.5, depth: 1.5, height: 0.75 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#cc966c' },
    { id: 'seats', label: '长凳面', defaultColor: '#cc966c' },
    { id: 'frame', label: '支撑架', defaultColor: '#6b4e38' }
  ],
  build(registry, item, node, size) {
    const tableTopH = 0.045;
    // 1. 中间桌面
    boxComponent(registry, item, picnicTableFurniture, 'top', {
      width: size.width, height: tableTopH, depth: size.depth * 0.44
    }, { position: { x: 0, y: size.height - tableTopH / 2, z: 0 } }, { parent: node });

    // 2. 两侧相连的长条凳
    const seatH = 0.035;
    const seatHeight = size.height * 0.62;
    const seatD = size.depth * 0.16;

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, picnicTableFurniture, 'seats', {
        width: size.width, height: seatH, depth: seatD
      }, { position: { x: 0, y: seatHeight - seatH / 2, z: side * size.depth * 0.38 } }, { parent: node });
    });

    // 3. A字形交叉连体支架 (Frame)
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, picnicTableFurniture, 'frame', {
        width: 0.04, height: size.height * 0.98, depth: size.depth
      }, { position: { x: xSide * size.width * 0.38, y: size.height / 2, z: 0 } }, { parent: node });
    });
  }
};

// 11. 露台餐桌 (Patio Dining Table)
export const patioDiningTableFurniture = {
  type: 'patio_dining_table',
  name: '工作台',
  unit: 'm',
  defaultSize: { width: 1.7, depth: 0.9, height: 0.75 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#d4b08a' },
    { id: 'legs', label: '桌腿', defaultColor: '#6b6f75' },
    { id: 'frame', label: '连接架', defaultColor: '#52565d' }
  ],
  build(registry, item, node, size) {
    const topH = 0.05;
    boxComponent(registry, item, patioDiningTableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, patioDiningTableFurniture, 'legs', {
          width: 0.05, height: legH, depth: 0.05
        }, { position: { x: xSide * size.width * 0.42, y: legH / 2, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });

    // 添加两根 Z 方向 of the cross-framing to hold the center bar
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, patioDiningTableFurniture, 'frame', {
        width: 0.03, height: 0.03, depth: size.depth * 0.76
      }, { position: { x: xSide * size.width * 0.42, y: legH * 0.36, z: 0 } }, { parent: node });
    });

    // 中间纵向拉杆
    boxComponent(registry, item, patioDiningTableFurniture, 'frame', {
      width: size.width * 0.82, height: 0.03, depth: 0.03
    }, { position: { x: 0, y: legH * 0.36, z: 0 } }, { parent: node });
  }
};

// 12. 玻璃边几
export const bistroTableFurniture = {
  type: 'bistro_table',
  name: '玻璃边几',
  unit: 'm',
  defaultSize: { width: 0.65, depth: 0.65, height: 0.7 },
  components: [
    { id: 'glass', label: '玻璃台面', defaultColor: '#e0f2f1' },
    { id: 'frame', label: '金属框架', defaultColor: '#37474f' }
  ],
  build(registry, item, node, size) {
    // 1. 四角金属桌腿
    const legRadius = 0.02;
    const legH = size.height*0.95;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        cylinderComponent(registry, item, bistroTableFurniture, 'frame', {
          diameterTop: legRadius * 2,
          diameterBottom: legRadius * 2,
          height: legH,
          tessellation: 16
        }, {
          position: {
            x: xSide * size.width * 0.30,
            y: legH / 2,
            z: zSide * size.depth * 0.30
          }
        }, { parent: node });
      });
    });

    // 2. 顶层玻璃台面
    const topGlassH = 0.03;
    cylinderComponent(registry, item, bistroTableFurniture, 'glass', {
      diameterTop: 1,
      diameterBottom: 1,
      height: topGlassH,
      tessellation: 24
    }, {
      position: { x: 0, y: size.height - topGlassH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });

    // 3. 顶层金属支撑环（托盘）
    const topSupportH = 0.02;
    cylinderComponent(registry, item, bistroTableFurniture, 'frame', {
      diameterTop: 0.94,
      diameterBottom: 0.94,
      height: topSupportH,
      tessellation: 24
    }, {
      position: { x: 0, y: size.height - topGlassH - topSupportH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });

    // 4. 底层玻璃层板
    const shelfGlassH = 0.025;
    const shelfY = size.height * 0.45;
    cylinderComponent(registry, item, bistroTableFurniture, 'glass', {
      diameterTop: 0.8,
      diameterBottom: 0.8,
      height: shelfGlassH,
      tessellation: 24
    }, {
      position: { x: 0, y: shelfY, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });

    // 5. 底层金属支撑环
    const shelfSupportH = 0.02;
    cylinderComponent(registry, item, bistroTableFurniture, 'frame', {
      diameterTop: 0.74,
      diameterBottom: 0.74,
      height: shelfSupportH,
      tessellation: 24
    }, {
      position: { x: 0, y: shelfY - shelfGlassH / 2 - shelfSupportH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });
  }
};

// 13. 藤编户外茶几 (Rattan Coffee Table)
export const rattanCoffeeTableFurniture = {
  type: 'rattan_coffee_table',
  name: '藤编茶几',
  unit: 'm',
  defaultSize: { width: 1.05, depth: 0.6, height: 0.45 },
  components: [
    { id: 'top', label: '台面', defaultColor: '#cfb390' },
    { id: 'body', label: '藤编框', defaultColor: '#9d744b' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, rattanCoffeeTableFurniture, 'body', {
      width: size.width, height: size.height * 0.82, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.41, z: 0 } }, { parent: node });

    boxComponent(registry, item, rattanCoffeeTableFurniture, 'top', {
      width: size.width * 0.94, height: 0.03, depth: size.depth * 0.94
    }, { position: { x: 0, y: size.height * 0.84, z: 0 } }, { parent: node });
  }
};

// 14. 花园边几 (Garden Side Table)
export const gardenSideTableFurniture = {
  type: 'garden_side_table',
  name: '花园边几',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.55 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#f5f1eb' },
    { id: 'legs', label: '桌腿', defaultColor: '#d6cbbe' }
  ],
  build(registry, item, node, size) {
    const topH = Math.min(0.04, size.height * 0.1);
    const topY = size.height - topH / 2;

    // 1. 方形桌面
    boxComponent(registry, item, gardenSideTableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: topY, z: 0 } }, { parent: node });

    // 2. 桌面底部中心结合 Hub
    const hubH = size.height * 0.06;
    const hubY = size.height - topH - hubH / 2;
    cylinderComponent(registry, item, gardenSideTableFurniture, 'legs', {
      diameterTop: Math.min(0.08, size.width * 0.22),
      diameterBottom: Math.min(0.06, size.width * 0.18),
      height: hubH,
      tessellation: 16
    }, { position: { x: 0, y: hubY, z: 0 } }, { parent: node });

    // 3. 从中心向 4 个方向放射延伸的三角形斜切木板腿
    const legH = size.height - topH - hubH * 0.5;
    const plateThickness = Math.min(0.04, size.width * 0.08);
    const plateWidth = size.width * 0.38;

    for (let index = 0; index < 4; index += 1) {
      const angle = (index * Math.PI) / 2 + Math.PI / 4;
      const midRadius = plateWidth * 0.38;
      const posX = Math.cos(angle) * midRadius;
      const posZ = Math.sin(angle) * midRadius;

      const legPlate = boxComponent(registry, item, gardenSideTableFurniture, 'legs', {
        width: plateThickness,
        height: legH,
        depth: plateWidth
      }, {
        position: {
          x: posX,
          y: legH / 2,
          z: posZ
        }
      }, { parent: node });

      legPlate.rotation.y = angle;
    }
  }
};

export const ovalTableFurniture = {
  type: 'oval_table',
  name: '椭圆桌',
  unit: 'm',
  defaultSize: { width: 1.25, depth: 0.8, height: 0.75 },
  components: [
    { id: 'top', label: '椭圆桌面', defaultColor: '#ffffff' },
    { id: 'legs', label: '桌腿', defaultColor: '#c7c1b7' }
  ],
  build(registry, item, node, size) {
    const topH = 0.04;
    cylinderComponent(registry, item, ovalTableFurniture, 'top', {
      diameterTop: 1, diameterBottom: 1, height: topH, tessellation: 32
    }, {
      position: { x: 0, y: size.height - topH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });

    const legH = size.height - topH;
    const legW = 0.04;
    const xOffset = size.width * 0.3;
    const zOffset = size.depth * 0.3;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, ovalTableFurniture, 'legs', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });
  }
};


export const triangularRoundCoffeeTableFurniture = {
  type: 'triangular_round_coffee_table',
  name: '三角圆茶几',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.7, height: 0.4 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#e5e0d8' },
    { id: 'legs', label: '桌脚', defaultColor: '#5c544a' }
  ],
  build(registry, item, node, size) {
    const topH = 0.03;
    cylinderComponent(registry, item, triangularRoundCoffeeTableFurniture, 'top', {
      diameterTop: 1, diameterBottom: 1, height: topH, tessellation: 32
    }, {
      position: { x: 0, y: size.height - topH / 2, z: 0 },
      scaling: { x: size.width, y: 1, z: size.depth }
    }, { parent: node });

    const legH = size.height - topH;
    const legD = 0.024;
    const rx = (size.width / 2) * 0.6;
    const rz = (size.depth / 2) * 0.6;
    
    const angles = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6];
    angles.forEach((angle) => {
      const x = rx * Math.cos(angle);
      const z = rz * Math.sin(angle);
      cylinderComponent(registry, item, triangularRoundCoffeeTableFurniture, 'legs', {
        diameterTop: legD, diameterBottom: legD, height: legH, tessellation: 12
      }, { position: { x, y: legH / 2, z } }, { parent: node });
    });
  }
};

// 16. C型极简边几 (C-Shape Side Table)
export const cShapeSideTableFurniture = {
  type: 'c_shape_side_table',
  name: 'C型边几',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.42, height: 0.46 },
  components: [
    { id: 'top', label: '边几框体', defaultColor: '#ffffff' },
    { id: 'towel', label: '托盘', defaultColor: '#f7f7f8' }
  ],
  build(registry, item, node, size) {
    const tableT = 0.018;

    // 1. 顶板 (Top Surface)
    boxComponent(registry, item, cShapeSideTableFurniture, 'top', {
      width: size.width, height: tableT, depth: size.depth
    }, {
      position: { x: 0, y: size.height - tableT / 2, z: 0 }
    }, { parent: node });

    // 2. 侧立板 (Side Panel)
    boxComponent(registry, item, cShapeSideTableFurniture, 'top', {
      width: tableT, height: size.height - tableT * 2, depth: size.depth
    }, {
      position: { x: size.width / 2 - tableT / 2, y: size.height / 2, z: 0 }
    }, { parent: node });

    // 3. 底板 (Base Surface)
    boxComponent(registry, item, cShapeSideTableFurniture, 'top', {
      width: size.width, height: tableT, depth: size.depth
    }, {
      position: { x: 0, y: tableT / 2, z: 0 }
    }, { parent: node });

    // 4. 搁置于几面上的高档洁白沙滩浴巾 (Folded Beach Towel)
    boxComponent(registry, item, cShapeSideTableFurniture, 'towel', {
      width: size.width * 0.65, height: 0.02, depth: size.depth * 0.65
    }, {
      position: { x: -0.02, y: size.height + 0.01, z: 0 }
    }, { parent: node });
  }
};


