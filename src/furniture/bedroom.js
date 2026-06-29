import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1. 粉色公主床 (Bed)
export const bedFurniture = {
  type: 'bed',
  name: '公主床',
  defaultSize: { width: 76, depth: 88, height: 42 },
  components: [
    { id: 'frame', label: '床架', defaultColor: '#f3aac5' },
    { id: 'blanket', label: '被面', defaultColor: '#ffcad8' },
    { id: 'pillow', label: '枕头', defaultColor: '#ffffff' },
    { id: 'headboard', label: '床头', defaultColor: '#e985b2' }
  ],
  interaction: {
    type: 'lie',
    getInteractionPoints(size) {
      return [
        { x: -size.width * 0.2, y: size.height * 0.44, z: 0, rot: 0 },
        { x: size.width * 0.2, y: size.height * 0.44, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    boxComponent(registry, item, bedFurniture, 'frame', {
      width: size.width, height: size.height * 0.28, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.14, z: 0 } }, { parent: node });

    boxComponent(registry, item, bedFurniture, 'blanket', {
      width: size.width * 0.9, height: size.height * 0.16, depth: size.depth * 0.72
    }, { position: { x: 0, y: size.height * 0.4, z: size.depth * 0.08 } }, { parent: node });

    boxComponent(registry, item, bedFurniture, 'pillow', {
      width: size.width * 0.72, height: size.height * 0.13, depth: size.depth * 0.16
    }, { position: { x: 0, y: size.height * 0.48, z: -size.depth * 0.34 } }, { parent: node });

    boxComponent(registry, item, bedFurniture, 'headboard', {
      width: size.width, height: size.height * 0.7, depth: Math.max(0.12, size.depth * 0.08)
    }, { position: { x: 0, y: size.height * 0.46, z: -size.depth * 0.48 } }, { parent: node });
  }
};

// 2. 现代双人床 (Bed Double)
export const bedDoubleFurniture = {
  type: 'bed_double',
  name: '现代双人床',
  defaultSize: { width: 80, depth: 88, height: 46 },
  components: [
    { id: 'frame', label: '床底框', defaultColor: '#6e5948' },
    { id: 'mattress', label: '厚床垫', defaultColor: '#fcfbfa' },
    { id: 'blanket', label: '深灰被单', defaultColor: '#86919e' },
    { id: 'pillow', label: '双枕头', defaultColor: '#ffffff' },
    { id: 'headboard', label: '靠背板', defaultColor: '#544437' }
  ],
  interaction: {
    type: 'lie',
    getInteractionPoints(size) {
      const bottomH = size.height * 0.18;
      const matH = size.height * 0.28;
      return [
        { x: -size.width * 0.22, y: bottomH + matH, z: 0, rot: 0 },
        { x: size.width * 0.22, y: bottomH + matH, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const bottomH = size.height * 0.18;
    const matH = size.height * 0.28;

    boxComponent(registry, item, bedDoubleFurniture, 'frame', {
      width: size.width, height: bottomH, depth: size.depth
    }, { position: { x: 0, y: bottomH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, bedDoubleFurniture, 'mattress', {
      width: size.width * 0.96, height: matH, depth: size.depth * 0.94
    }, { position: { x: 0, y: bottomH + matH / 2, z: size.depth * 0.02 } }, { parent: node });

    boxComponent(registry, item, bedDoubleFurniture, 'blanket', {
      width: size.width * 0.96, height: matH * 0.38, depth: size.depth * 0.72
    }, { position: { x: 0, y: bottomH + matH * 0.88, z: size.depth * 0.12 } }, { parent: node });

    boxComponent(registry, item, bedDoubleFurniture, 'headboard', {
      width: size.width * 1.02, height: size.height * 0.88, depth: size.depth * 0.06
    }, { position: { x: 0, y: size.height * 0.44, z: -size.depth / 2 + size.depth * 0.03 } }, { parent: node });

    // 左右并排双枕头
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, bedDoubleFurniture, 'pillow', {
        width: size.width * 0.38, height: 0.08, depth: size.depth * 0.16
      }, { position: { x: side * size.width * 0.22, y: bottomH + matH + 0.04, z: -size.depth * 0.30 } }, { parent: node });
    });
  }
};

// 3. 简约单人床 (Bed Single)
export const bedSingleFurniture = {
  type: 'bed_single',
  name: '简约单人床',
  defaultSize: { width: 44, depth: 80, height: 36 },
  components: [
    { id: 'frame', label: '床架', defaultColor: '#cccccc' },
    { id: 'mattress', label: '床垫', defaultColor: '#ffffff' },
    { id: 'blanket', label: '条纹蓝被', defaultColor: '#8cb0ff' },
    { id: 'pillow', label: '枕头', defaultColor: '#ffffff' }
  ],
  interaction: {
    type: 'lie',
    getInteractionPoints(size) {
      const bottomH = size.height * 0.22;
      const matH = size.height * 0.28;
      return [
        { x: 0, y: bottomH + matH, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const bottomH = size.height * 0.22;
    const matH = size.height * 0.28;

    boxComponent(registry, item, bedSingleFurniture, 'frame', {
      width: size.width, height: bottomH, depth: size.depth
    }, { position: { x: 0, y: bottomH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, bedSingleFurniture, 'mattress', {
      width: size.width * 0.96, height: matH, depth: size.depth * 0.94
    }, { position: { x: 0, y: bottomH + matH / 2, z: size.depth * 0.02 } }, { parent: node });

    boxComponent(registry, item, bedSingleFurniture, 'blanket', {
      width: size.width * 0.96, height: matH * 0.24, depth: size.depth * 0.72
    }, { position: { x: 0, y: bottomH + matH * 0.92, z: size.depth * 0.12 } }, { parent: node });

    boxComponent(registry, item, bedSingleFurniture, 'pillow', {
      width: size.width * 0.68, height: 0.06, depth: size.depth * 0.16
    }, { position: { x: 0, y: bottomH + matH + 0.03, z: -size.depth * 0.32 } }, { parent: node });
  }
};

// 4. 婴儿护栏床 (Crib)
export const cribFurniture = {
  type: 'crib',
  name: '婴儿护栏床',
  defaultSize: { width: 30, depth: 48, height: 36 },
  components: [
    { id: 'frame', label: '护栏外框', defaultColor: '#ebdcc5' },
    { id: 'mattress', label: '小软垫', defaultColor: '#ffffff' }
  ],
  interaction: {
    type: 'lie',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.28 + size.height * 0.18, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    // 抬高的软垫
    boxComponent(registry, item, cribFurniture, 'mattress', {
      width: size.width * 0.92, height: size.height * 0.18, depth: size.depth * 0.92
    }, { position: { x: 0, y: size.height * 0.28, z: 0 } }, { parent: node });

    // 婴儿护栏四个侧面
    const railT = 0.02;
    boxComponent(registry, item, cribFurniture, 'frame', {
      width: size.width, height: size.height, depth: railT
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + railT / 2 } }, { parent: node });

    boxComponent(registry, item, cribFurniture, 'frame', {
      width: size.width, height: size.height, depth: railT
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 - railT / 2 } }, { parent: node });

    boxComponent(registry, item, cribFurniture, 'frame', {
      width: railT, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + railT / 2, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, cribFurniture, 'frame', {
      width: railT, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - railT / 2, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 5. 上下铺双层床 (Bunk Bed)
export const bunkBedFurniture = {
  type: 'bunk_bed',
  name: '上下铺双层床',
  defaultSize: { width: 42, depth: 80, height: 68 },
  components: [
    { id: 'frame', label: '木质梯架', defaultColor: '#aa7f55' },
    { id: 'blankets', label: '上下被单', defaultColor: '#89a5ad' },
    { id: 'pillows', label: '双层枕头', defaultColor: '#ffffff' }
  ],
  interaction: {
    type: 'lie',
    getInteractionPoints(size) {
      const bedT = 0.06;
      const sheetH = 0.04;
      return [
        { x: 0, y: size.height * 0.12 + bedT + sheetH, z: 0, rot: 0 }, // 下铺
        { x: 0, y: size.height * 0.68 + bedT + sheetH, z: 0, rot: 0 }  // 上铺
      ];
    }
  },
  build(registry, item, node, size) {
    const postW = 0.06;
    const postH = size.height;

    // 四角高木柱 (Posts)
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, bunkBedFurniture, 'frame', {
          width: postW, height: postH, depth: postW
        }, { position: { x: x * (size.width / 2 - postW / 2), y: postH / 2, z: z * (size.depth / 2 - postW / 2) } }, { parent: node });
      });
    });

    const bedT = 0.06;
    const sheetH = 0.04;
    // 2. 下铺 (Lower Berth) - y = 8英寸（约0.2米）
    boxComponent(registry, item, bunkBedFurniture, 'frame', {
      width: size.width - postW * 2, height: bedT, depth: size.depth - postW * 2
    }, { position: { x: 0, y: size.height * 0.12, z: 0 } }, { parent: node });

    boxComponent(registry, item, bunkBedFurniture, 'blankets', {
      width: size.width - postW * 2, height: sheetH, depth: size.depth * 0.76
    }, { position: { x: 0, y: size.height * 0.12 + bedT / 2 + sheetH / 2, z: size.depth * 0.08 } }, { parent: node });

    boxComponent(registry, item, bunkBedFurniture, 'pillows', {
      width: size.width * 0.62, height: 0.05, depth: 0.15
    }, { position: { x: 0, y: size.height * 0.12 + bedT + 0.025, z: -size.depth * 0.32 } }, { parent: node });

    // 3. 上铺 (Upper Berth) - y = 44英寸（约1.1米）
    boxComponent(registry, item, bunkBedFurniture, 'frame', {
      width: size.width - postW * 2, height: bedT, depth: size.depth - postW * 2
    }, { position: { x: 0, y: size.height * 0.68, z: 0 } }, { parent: node });

    boxComponent(registry, item, bunkBedFurniture, 'blankets', {
      width: size.width - postW * 2, height: sheetH, depth: size.depth * 0.76
    }, { position: { x: 0, y: size.height * 0.68 + bedT / 2 + sheetH / 2, z: size.depth * 0.08 } }, { parent: node });

    boxComponent(registry, item, bunkBedFurniture, 'pillows', {
      width: size.width * 0.62, height: 0.05, depth: 0.15
    }, { position: { x: 0, y: size.height * 0.68 + bedT + 0.025, z: -size.depth * 0.32 } }, { parent: node });

    // 4. 简易梯子 (Ladder)
    boxComponent(registry, item, bunkBedFurniture, 'frame', {
      width: 0.04, height: size.height * 0.68, depth: 0.02
    }, { position: { x: size.width / 2 + 0.01, y: size.height * 0.34, z: size.depth * 0.12 } }, { parent: node });
  }
};

// 6. 榻榻米床垫 (Mattress)
export const mattressFurniture = {
  type: 'mattress',
  name: '榻榻米床垫',
  defaultSize: { width: 60, depth: 80, height: 6 },
  components: [
    { id: 'body', label: '床垫布面', defaultColor: '#f0e8dc' },
    { id: 'pillow', label: '枕头', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    // 贴地的矮床垫
    boxComponent(registry, item, mattressFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, mattressFurniture, 'pillow', {
      width: size.width * 0.62, height: size.height * 0.5, depth: size.depth * 0.14
    }, { position: { x: 0, y: size.height + 0.02, z: -size.depth * 0.36 } }, { parent: node });
  }
};

// 7. 四柱幔帐床 (Canopy Bed)
export const canopyBedFurniture = {
  type: 'canopy_bed',
  name: '四柱幔帐床',
  defaultSize: { width: 80, depth: 88, height: 84 },
  components: [
    { id: 'frame', label: '四柱高架', defaultColor: '#2e2b29' },
    { id: 'mattress', label: '大床身', defaultColor: '#ffffff' },
    { id: 'blanket', label: '盖被', defaultColor: '#b3a79d' }
  ],
  build(registry, item, node, size) {
    const bottomH = size.height * 0.16;
    const matH = size.height * 0.18;

    // 四柱大框架 (Canopy Posts)
    const postD = 0.04;
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, canopyBedFurniture, 'frame', {
          width: postD, height: size.height, depth: postD
        }, { position: { x: x * (size.width / 2 - postD / 2), y: size.height / 2, z: z * (size.depth / 2 - postD / 2) } }, { parent: node });
      });
    });

    // 顶端框架横条 (Canopy Top)
    boxComponent(registry, item, canopyBedFurniture, 'frame', {
      width: size.width, height: 0.03, depth: postD
    }, { position: { x: 0, y: size.height - 0.015, z: -size.depth / 2 + postD / 2 } }, { parent: node });
    boxComponent(registry, item, canopyBedFurniture, 'frame', {
      width: size.width, height: 0.03, depth: postD
    }, { position: { x: 0, y: size.height - 0.015, z: size.depth / 2 - postD / 2 } }, { parent: node });

    // 床身
    boxComponent(registry, item, canopyBedFurniture, 'mattress', {
      width: size.width - postD * 2, height: bottomH + matH, depth: size.depth - postD * 2
    }, { position: { x: 0, y: (bottomH + matH) / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, canopyBedFurniture, 'blanket', {
      width: size.width - postD * 2, height: 0.02, depth: size.depth * 0.62
    }, { position: { x: 0, y: bottomH + matH + 0.01, z: size.depth * 0.12 } }, { parent: node });
  }
};

// 8. 梳妆台 (Vanity)
export const vanityFurniture = {
  type: 'vanity',
  name: '多功能梳妆台',
  defaultSize: { width: 36, depth: 18, height: 52 },
  isMirror: true,
  components: [
    { id: 'desk', label: '化妆桌身', defaultColor: '#ebccd7' },
    { id: 'mirror', label: '发光大圆镜', defaultColor: '#e6efff' },
    { id: 'drawer', label: '镜下小柜', defaultColor: '#cca6b4' }
  ],
  build(registry, item, node, size) {
    const deskH = size.height * 0.58;

    // 1. 化妆台桌体 (Desk)
    boxComponent(registry, item, vanityFurniture, 'desk', {
      width: size.width, height: deskH, depth: size.depth
    }, { position: { x: 0, y: deskH / 2, z: 0 } }, { parent: node });

    // 2. 双排矮抽屉 (Drawer)
    boxComponent(registry, item, vanityFurniture, 'drawer', {
      width: size.width * 0.90, height: deskH * 0.16, depth: size.depth * 0.02
    }, { position: { x: 0, y: deskH * 0.72, z: size.depth / 2 } }, { parent: node });

    // 3. 桌面圆形化妆镜 (Mirror)
    const mirrorR = size.width * 0.78;
    cylinderComponent(registry, item, vanityFurniture, 'mirror', {
      diameterTop: mirrorR, diameterBottom: mirrorR, height: 0.02, tessellation: 24
    }, {
      position: { x: 0, y: deskH + mirrorR / 2, z: -size.depth / 2 + 0.03 }
    }, { parent: node });
    // 旋转圆盘立起当圆镜子
    const mirrorMesh = node.getChildren().find(child => child.name.includes('mirror'));
    if (mirrorMesh) {
      mirrorMesh.rotation.x = Math.PI * 0.5;
    }
  }
};

// 9. 卧室吊椅 (Hammock)
export const hammockFurniture = {
  type: 'hammock',
  name: '室内吊椅',
  defaultSize: { width: 24, depth: 60, height: 32 },
  components: [
    { id: 'stand', label: '悬挂支脚', defaultColor: '#404040' },
    { id: 'cradle', label: '编织网兜', defaultColor: '#ebdcb3' }
  ],
  build(registry, item, node, size) {
    // 1. 挂钩吊臂 (Hammock Support)
    boxComponent(registry, item, hammockFurniture, 'stand', {
      width: 0.04, height: size.height, depth: 0.04
    }, { position: { x: 0, y: size.height / 2, z: -size.depth / 2 + 0.02 } }, { parent: node });

    boxComponent(registry, item, hammockFurniture, 'stand', {
      width: 0.04, height: 0.04, depth: size.depth * 0.96
    }, { position: { x: 0, y: size.height - 0.02, z: 0 } }, { parent: node });

    // 2. 倾斜躺兜 (Sling Cradle)
    const sling = boxComponent(registry, item, hammockFurniture, 'cradle', {
      width: size.width * 0.88, height: 0.02, depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.42, z: size.depth * 0.08 } }, { parent: node });
    sling.rotation.x = Math.PI * 0.06;
  }
};

// 10. 床尾长凳 (Bed Bench)
export const bedBenchFurniture = {
  type: 'bed_bench',
  name: '床尾收纳凳',
  defaultSize: { width: 54, depth: 16, height: 18 },
  components: [
    { id: 'seat', label: '皮革软包', defaultColor: '#e2decb' },
    { id: 'legs', label: '实木凳脚', defaultColor: '#7b705f' }
  ],
  build(registry, item, node, size) {
    const seatH = size.height * 0.36;
    boxComponent(registry, item, bedBenchFurniture, 'seat', {
      width: size.width, height: seatH, depth: size.depth
    }, { position: { x: 0, y: size.height - seatH / 2, z: 0 } }, { parent: node });

    const legH = size.height - seatH;
    const legW = 0.04;
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        boxComponent(registry, item, bedBenchFurniture, 'legs', {
          width: legW, height: legH, depth: legW
        }, { position: { x: x * (size.width / 2 - legW / 2 - 0.02), y: legH / 2, z: z * (size.depth / 2 - legW / 2 - 0.02) } }, { parent: node });
      });
    });
  }
};

// 11. 梳妆化妆品组 (Cosmetics)
export const cosmeticsFurniture = {
  type: 'cosmetics',
  name: '化妆品组合',
  defaultSize: { width: 10, depth: 8, height: 8 },
  components: [
    { id: 'tray', label: '收纳托盘', defaultColor: '#d4af37' },
    { id: 'perfume', label: '香水乳液', defaultColor: '#fff3cd' },
    { id: 'lipstick', label: '口红', defaultColor: '#dc3545' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, cosmeticsFurniture, 'tray', {
      width: size.width, height: size.height * 0.15, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.075, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, cosmeticsFurniture, 'perfume', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.28, height: size.height * 0.72
    }, { position: { x: -size.width * 0.22, y: size.height * 0.5, z: -size.depth * 0.1 } }, { parent: node });

    sphereComponent(registry, item, cosmeticsFurniture, 'perfume', {
      diameterX: size.width * 0.32, diameterY: size.height * 0.42, diameterZ: size.width * 0.32
    }, { position: { x: size.width * 0.18, y: size.height * 0.36, z: -size.depth * 0.15 } }, { parent: node });

    cylinderComponent(registry, item, cosmeticsFurniture, 'lipstick', {
      diameterTop: size.width * 0.12, diameterBottom: size.width * 0.12, height: size.height * 0.48
    }, { position: { x: size.width * 0.22, y: size.height * 0.38, z: size.depth * 0.22 } }, { parent: node });
  }
};

// 12. 桌面文具盒 (Stationery)
export const stationeryFurniture = {
  type: 'stationery',
  name: '桌面文具盒',
  defaultSize: { width: 12, depth: 10, height: 6 },
  components: [
    { id: 'book', label: '笔记本笔记本电脑', defaultColor: '#fd7e14' },
    { id: 'holder', label: '金属笔筒', defaultColor: '#2b2b2b' },
    { id: 'pens', label: '签字笔', defaultColor: '#0056b3' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, stationeryFurniture, 'book', {
      width: size.width * 0.55, height: 0.024, depth: size.depth * 0.8
    }, { position: { x: -size.width * 0.18, y: 0.012, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, stationeryFurniture, 'holder', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.28, height: size.height * 0.8
    }, { position: { x: size.width * 0.28, y: size.height * 0.4, z: -size.depth * 0.1 } }, { parent: node });

    const p1 = cylinderComponent(registry, item, stationeryFurniture, 'pens', {
      diameterTop: 0.012, diameterBottom: 0.012, height: size.height * 1.1
    }, { position: { x: size.width * 0.26, y: size.height * 0.72, z: -size.depth * 0.1 } }, { parent: node });
    p1.rotation.z = Math.PI * 0.12;

    const p2 = cylinderComponent(registry, item, stationeryFurniture, 'pens', {
      diameterTop: 0.012, diameterBottom: 0.012, height: size.height * 1.1
    }, { position: { x: size.width * 0.3, y: size.height * 0.72, z: -size.depth * 0.06 } }, { parent: node });
    p2.rotation.z = -Math.PI * 0.08;
    p2.rotation.x = Math.PI * 0.08;
  }
};

// 13. 眼影盘与散粉 (eyeshadowCompact)
export const eyeshadowCompactFurniture = {
  type: 'eyeshadow_compact',
  name: '眼影盘与散粉',
  defaultSize: { width: 6, depth: 6, height: 3 },
  components: [
    { id: 'eyeshadow', label: '眼影盘', defaultColor: '#3e2723' },
    { id: 'compact', label: '散粉盒', defaultColor: '#ffe0b2' },
    { id: 'mirror', label: '粉扑镜', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, eyeshadowCompactFurniture, 'eyeshadow', {
      width: size.width * 0.48, height: size.height * 0.25, depth: size.depth * 0.9
    }, { position: { x: -size.width * 0.22, y: size.height * 0.125, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, eyeshadowCompactFurniture, 'compact', {
      diameterTop: size.width * 0.4, diameterBottom: size.width * 0.4, height: size.height * 0.35
    }, { position: { x: size.width * 0.25, y: size.height * 0.175, z: -size.depth * 0.1 } }, { parent: node });

    cylinderComponent(registry, item, eyeshadowCompactFurniture, 'mirror', {
      diameterTop: size.width * 0.25, diameterBottom: size.width * 0.25, height: 0.005
    }, { position: { x: size.width * 0.22, y: 0.003, z: size.depth * 0.3 } }, { parent: node });
  }
};

// 14. 高端香水瓶 (luxuryPerfumes)
export const luxuryPerfumesFurniture = {
  type: 'luxury_perfumes',
  name: '高端香水瓶',
  defaultSize: { width: 8, depth: 6, height: 6 },
  components: [
    { id: 'bottleA', label: '玫瑰粉香水', defaultColor: '#f48fb1' },
    { id: 'bottleB', label: '琥珀金香水', defaultColor: '#ffe082' },
    { id: 'cap', label: '瓶盖喷头', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, luxuryPerfumesFurniture, 'bottleA', {
      width: size.width * 0.35, height: size.height * 0.72, depth: size.depth * 0.45
    }, { position: { x: -size.width * 0.2, y: size.height * 0.36, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, luxuryPerfumesFurniture, 'cap', {
      diameterTop: 0.015, diameterBottom: 0.015, height: size.height * 0.18
    }, { position: { x: -size.width * 0.2, y: size.height * 0.81, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, luxuryPerfumesFurniture, 'bottleB', {
      diameterTop: size.width * 0.3, diameterBottom: size.width * 0.3, height: size.height * 0.65
    }, { position: { x: size.width * 0.22, y: size.height * 0.325, z: 0.02 } }, { parent: node });

    sphereComponent(registry, item, luxuryPerfumesFurniture, 'cap', {
      diameterX: 0.025, diameterY: 0.025, diameterZ: 0.025
    }, { position: { x: size.width * 0.22, y: size.height * 0.72, z: 0.02 } }, { parent: node });
  }
};

// 15. 保湿护肤套装 (skincareSet)
export const skincareSetFurniture = {
  type: 'skincare_set',
  name: '保湿护肤套装',
  defaultSize: { width: 8, depth: 8, height: 8 },
  components: [
    { id: 'holder', label: '收纳架', defaultColor: '#cfd8dc' },
    { id: 'lotion', label: '面霜罐', defaultColor: '#e0f2f1' },
    { id: 'toner', label: '精华水瓶', defaultColor: '#b2dfdb' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, skincareSetFurniture, 'holder', {
      width: size.width, height: size.height * 0.12, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.06, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, skincareSetFurniture, 'lotion', {
      diameterTop: size.width * 0.38, diameterBottom: size.width * 0.38, height: size.height * 0.42
    }, { position: { x: -size.width * 0.22, y: size.height * 0.33, z: -size.depth * 0.12 } }, { parent: node });

    cylinderComponent(registry, item, skincareSetFurniture, 'toner', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.28, height: size.height * 0.82
    }, { position: { x: size.width * 0.22, y: size.height * 0.53, z: 0.05 } }, { parent: node });
  }
};

// 16. 化妆刷筒 (makeupBrushes)
export const makeupBrushesFurniture = {
  type: 'makeup_brushes',
  name: '化妆刷筒',
  defaultSize: { width: 6, depth: 6, height: 8 },
  components: [
    { id: 'holder', label: '刷筒', defaultColor: '#efebe9' },
    { id: 'brush', label: '化妆刷杆', defaultColor: '#3e2723' },
    { id: 'bristle', label: '刷头', defaultColor: '#ffe0b2' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, makeupBrushesFurniture, 'holder', {
      diameterTop: size.width, diameterBottom: size.width * 0.9, height: size.height * 0.65
    }, { position: { x: 0, y: size.height * 0.325, z: 0 } }, { parent: node });

    const offsets = [
      { x: -0.02, y: 0.82, z: 0.015, rx: -0.12, rz: 0.08 },
      { x: 0.02, y: 0.85, z: -0.015, rx: 0.12, rz: -0.08 },
      { x: 0, y: 0.92, z: 0.01, rx: 0.05, rz: 0.05 }
    ];

    offsets.forEach(off => {
      const handle = cylinderComponent(registry, item, makeupBrushesFurniture, 'brush', {
        diameterTop: 0.008, diameterBottom: 0.008, height: size.height * 0.65
      }, { position: { x: off.x, y: size.height * 0.45, z: off.z } }, { parent: node });
      handle.rotation.x = off.rx;
      handle.rotation.z = off.rz;

      const br = sphereComponent(registry, item, makeupBrushesFurniture, 'bristle', {
        diameterX: 0.024, diameterY: 0.035, diameterZ: 0.024
      }, { position: { x: off.x * 1.6, y: size.height * 0.78, z: off.z * 1.6 } }, { parent: node });
      br.rotation.x = off.rx;
      br.rotation.z = off.rz;
    });
  }
};

// 17. 口红与指甲油 (lipstickNailPolish)
export const lipstickNailPolishFurniture = {
  type: 'lipstick_nail_polish',
  name: '口红与指甲油',
  defaultSize: { width: 6, depth: 4, height: 6 },
  components: [
    { id: 'lipstick', label: '口红', defaultColor: '#d81b60' },
    { id: 'polish', label: '指甲油瓶', defaultColor: '#8e24aa' },
    { id: 'cap', label: '黑色盖子', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, lipstickNailPolishFurniture, 'cap', {
      width: size.width * 0.22, height: size.height * 0.4, depth: size.depth * 0.35
    }, { position: { x: -size.width * 0.2, y: size.height * 0.2, z: 0 } }, { parent: node });

    boxComponent(registry, item, lipstickNailPolishFurniture, 'lipstick', {
      width: size.width * 0.16, height: size.height * 0.42, depth: size.depth * 0.28
    }, { position: { x: -size.width * 0.2, y: size.height * 0.61, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lipstickNailPolishFurniture, 'polish', {
      diameterTop: size.width * 0.26, diameterBottom: size.width * 0.26, height: size.height * 0.45
    }, { position: { x: size.width * 0.2, y: size.height * 0.225, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lipstickNailPolishFurniture, 'cap', {
      diameterTop: size.width * 0.1, diameterBottom: size.width * 0.1, height: size.height * 0.38
    }, { position: { x: size.width * 0.2, y: size.height * 0.64, z: 0 } }, { parent: node });
  }
};

// 18. 桌面台历 (deskCalendar)
export const deskCalendarFurniture = {
  type: 'desk_calendar',
  name: '桌面台历',
  defaultSize: { width: 8, depth: 4, height: 6 },
  components: [
    { id: 'stand', label: '折叠支架', defaultColor: '#795548' },
    { id: 'paper', label: '月历页', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const side1 = boxComponent(registry, item, deskCalendarFurniture, 'stand', {
      width: size.width, height: size.height * 0.95, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.48, z: -size.depth * 0.12 } }, { parent: node });
    side1.rotation.x = Math.PI * 0.08;

    const side2 = boxComponent(registry, item, deskCalendarFurniture, 'stand', {
      width: size.width, height: size.height * 0.95, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.48, z: size.depth * 0.12 } }, { parent: node });
    side2.rotation.x = -Math.PI * 0.08;

    const pap = boxComponent(registry, item, deskCalendarFurniture, 'paper', {
      width: size.width * 0.9, height: size.height * 0.8, depth: 0.005
    }, { position: { x: 0, y: size.height * 0.48, z: size.depth * 0.13 + 0.004 } }, { parent: node });
    pap.rotation.x = -Math.PI * 0.08;
  }
};

// 19. 多层木纹笔架 (woodenPenStand)
export const woodenPenStandFurniture = {
  type: 'wooden_pen_stand',
  name: '木纹笔架',
  defaultSize: { width: 8, depth: 6, height: 8 },
  components: [
    { id: 'body', label: '木架身', defaultColor: '#a1887f' },
    { id: 'compartment', label: '抽屉分隔', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, woodenPenStandFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, woodenPenStandFurniture, 'compartment', {
      width: size.width * 0.9, height: size.height * 0.03, depth: size.depth * 0.9
    }, { position: { x: 0, y: size.height * 0.6, z: 0.01 } }, { parent: node });

    boxComponent(registry, item, woodenPenStandFurniture, 'compartment', {
      width: size.width * 0.9, height: size.height * 0.03, depth: size.depth * 0.9
    }, { position: { x: 0, y: size.height * 0.35, z: 0.01 } }, { parent: node });
  }
};

// 20. 科学计算器 (calculator)
export const calculatorFurniture = {
  type: 'calculator',
  name: '科学计算器',
  defaultSize: { width: 6, depth: 8, height: 2 },
  components: [
    { id: 'body', label: '计算器身', defaultColor: '#455a64' },
    { id: 'screen', label: '绿背光屏幕', defaultColor: '#9ccc65' },
    { id: 'buttons', label: '按键', defaultColor: '#eceff1' }
  ],
  build(registry, item, node, size) {
    const base = boxComponent(registry, item, calculatorFurniture, 'body', {
      width: size.width, height: size.height * 0.7, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.35, z: 0 } }, { parent: node });
    base.rotation.x = Math.PI * 0.03;

    const sc = boxComponent(registry, item, calculatorFurniture, 'screen', {
      width: size.width * 0.8, height: 0.005, depth: size.depth * 0.22
    }, { position: { x: 0, y: size.height * 0.66 + 0.005, z: -size.depth * 0.25 } }, { parent: node });
    sc.rotation.x = Math.PI * 0.03;

    const key = boxComponent(registry, item, calculatorFurniture, 'buttons', {
      width: size.width * 0.8, height: 0.008, depth: size.depth * 0.5
    }, { position: { x: 0, y: size.height * 0.62, z: size.depth * 0.16 } }, { parent: node });
    key.rotation.x = Math.PI * 0.03;
  }
};

// 21. 订书机与便签盒 (staplerNotes)
export const staplerNotesFurniture = {
  type: 'stapler_notes',
  name: '订书机与便签',
  defaultSize: { width: 8, depth: 6, height: 4 },
  components: [
    { id: 'notes', label: '五彩便签纸', defaultColor: '#fff59d' },
    { id: 'stapler', label: '订书机', defaultColor: '#00e676' },
    { id: 'holder', label: '便签盒', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, staplerNotesFurniture, 'holder', {
      width: size.width * 0.5, height: size.height * 0.7, depth: size.depth * 0.68
    }, { position: { x: -size.width * 0.18, y: size.height * 0.35, z: 0 } }, { parent: node });

    boxComponent(registry, item, staplerNotesFurniture, 'notes', {
      width: size.width * 0.44, height: size.height * 0.6, depth: size.depth * 0.6
    }, { position: { x: -size.width * 0.18, y: size.height * 0.35 + 0.015, z: 0 } }, { parent: node });

    const st = boxComponent(registry, item, staplerNotesFurniture, 'stapler', {
      width: size.width * 0.16, height: size.height * 0.65, depth: size.depth * 0.6
    }, { position: { x: size.width * 0.28, y: size.height * 0.325, z: -0.01 } }, { parent: node });
    st.rotation.y = -Math.PI * 0.08;
  }
};

// 22. 签字笔底座 (premiumDeskPen)
export const premiumDeskPenFurniture = {
  type: 'premium_desk_pen',
  name: '签字笔底座',
  defaultSize: { width: 6, depth: 6, height: 10 },
  components: [
    { id: 'base', label: '底座', defaultColor: '#37474f' },
    { id: 'pen', label: '金圈签字笔', defaultColor: '#212121' },
    { id: 'accent', label: '黄铜转轴', defaultColor: '#ffd740' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, premiumDeskPenFurniture, 'base', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.8, height: size.height * 0.2
    }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });

    sphereComponent(registry, item, premiumDeskPenFurniture, 'accent', {
      diameterX: size.width * 0.2, diameterY: size.width * 0.2, diameterZ: size.width * 0.2
    }, { position: { x: 0, y: size.height * 0.23, z: 0 } }, { parent: node });

    const pen = cylinderComponent(registry, item, premiumDeskPenFurniture, 'pen', {
      diameterTop: 0.012, diameterBottom: 0.016, height: size.height * 0.82
    }, { position: { x: size.width * 0.12, y: size.height * 0.58, z: 0 } }, { parent: node });
    pen.rotation.z = -Math.PI * 0.15;
  }
};

