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
