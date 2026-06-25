import { boxComponent, cylinderComponent } from './_helpers.js';

// 1. 简约餐桌 (Table)
export const tableFurniture = {
  type: 'table',
  name: '简约餐桌',
  defaultSize: { width: 48, depth: 30, height: 30 },
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
  name: '原木书桌',
  defaultSize: { width: 55, depth: 24, height: 30 },
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
  name: '实木茶几',
  defaultSize: { width: 42, depth: 22, height: 18 },
  components: [
    { id: 'top', label: '桌面', defaultColor: '#8f7058' },
    { id: 'legs', label: '桌腿', defaultColor: '#594231' }
  ],
  build(registry, item, node, size) {
    const topH = 0.038;
    boxComponent(registry, item, coffeeTableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    const legW = Math.max(0.04, size.width * 0.08);
    const xOffset = size.width / 2 - legW / 2;
    const zOffset = size.depth / 2 - legW / 2;

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
  name: '小边几',
  defaultSize: { width: 16, depth: 16, height: 22 },
  components: [
    { id: 'top', label: '几面', defaultColor: '#cfa170' },
    { id: 'legs', label: '脚架', defaultColor: '#3b3835' }
  ],
  build(registry, item, node, size) {
    const topH = 0.024;
    boxComponent(registry, item, sideTableFurniture, 'top', {
      width: size.width, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    const legW = 0.02;
    const xOffset = size.width / 2 - legW / 2;
    const zOffset = size.depth / 2 - legW / 2;

    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, sideTableFurniture, 'legs', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * xOffset, y: legH / 2, z: z * zOffset } }, { parent: node });
      });
    });
  }
};

// 5. 大圆餐桌 (Round Table)
export const roundTableFurniture = {
  type: 'round_table',
  name: '大圆餐桌',
  defaultSize: { width: 54, depth: 54, height: 30 },
  components: [
    { id: 'top', label: '圆桌面', defaultColor: '#f3eedf' },
    { id: 'base', label: '圆柱底座', defaultColor: '#7b6754' }
  ],
  build(registry, item, node, size) {
    const topH = 0.04;
    cylinderComponent(registry, item, roundTableFurniture, 'top', {
      diameterTop: size.width, diameterBottom: size.width, height: topH, tessellation: 32
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const legH = size.height - topH;
    cylinderComponent(registry, item, roundTableFurniture, 'base', {
      diameterTop: size.width * 0.18, diameterBottom: size.width * 0.28, height: legH, tessellation: 24
    }, { position: { x: 0, y: legH / 2, z: 0 } }, { parent: node });
  }
};

// 6. 多人家长餐桌 (Dining Table Long)
export const diningTableLongFurniture = {
  type: 'dining_table_long',
  name: '八人长餐桌',
  defaultSize: { width: 72, depth: 36, height: 30 },
  components: [
    { id: 'top', label: '长桌面', defaultColor: '#b07443' },
    { id: 'legs', label: '粗桌腿', defaultColor: '#784924' }
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
  }
};

// 7. 玄关长条几 (Console Table)
export const consoleTableFurniture = {
  type: 'console_table',
  name: '玄关长条几',
  defaultSize: { width: 48, depth: 12, height: 32 },
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
  }
};

// 8. 电竞电脑桌 (Computer Desk)
export const computerDeskFurniture = {
  type: 'computer_desk',
  name: '电竞电脑桌',
  defaultSize: { width: 55, depth: 26, height: 30 },
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

// 9. 悬浮床头搁板 (Bedside Desk)
export const bedsideDeskFurniture = {
  type: 'bedside_desk',
  name: '悬浮搁板',
  defaultSize: { width: 18, depth: 14, height: 4 },
  components: [
    { id: 'top', label: '搁板桌身', defaultColor: '#ebd8c8' }
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
  name: '连体野餐桌',
  defaultSize: { width: 60, depth: 60, height: 29 },
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
        width: 0.04, height: size.height, depth: size.depth
      }, { position: { x: xSide * size.width * 0.38, y: size.height / 2, z: 0 } }, { parent: node });
    });
  }
};
