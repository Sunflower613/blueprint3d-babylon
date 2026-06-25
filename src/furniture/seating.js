import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1. 云朵沙发 (Sofa)
export const sofaFurniture = {
  type: 'sofa',
  name: '云朵沙发',
  defaultSize: { width: 84, depth: 36, height: 32 },
  components: [
    { id: 'seat', label: '坐垫', defaultColor: '#ff9dbb' },
    { id: 'back', label: '靠背', defaultColor: '#f56f9f' },
    { id: 'arms', label: '扶手', defaultColor: '#f56f9f' },
    { id: 'legs', label: '脚架', defaultColor: '#b07a50' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const seatH = Math.max(0.12, size.height * 0.36);
      return [
        { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
        { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatH = Math.max(0.12, size.height * 0.36);
    boxComponent(registry, item, sofaFurniture, 'seat', {
      width: size.width, height: seatH, depth: size.depth
    }, { position: { x: 0, y: seatH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, sofaFurniture, 'back', {
      width: size.width, height: size.height * 0.58, depth: Math.max(0.12, size.depth * 0.18)
    }, { position: { x: 0, y: size.height * 0.58, z: -size.depth * 0.41 } }, { parent: node });

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, sofaFurniture, 'arms', {
        width: Math.max(0.12, size.width * 0.09), height: size.height * 0.52, depth: size.depth
      }, { position: { x: side * size.width * 0.455, y: size.height * 0.38, z: 0 } }, { parent: node });
    });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, sofaFurniture, 'legs', {
          width: 0.08, height: 0.16, depth: 0.08
        }, { position: { x: xSide * size.width * 0.36, y: 0.08, z: zSide * size.depth * 0.32 } }, { parent: node });
      });
    });
  }
};

// 2. 简约木椅 (Chair)
export const chairFurniture = {
  type: 'chair',
  name: '简约木椅',
  defaultSize: { width: 18, depth: 18, height: 32 },
  components: [
    { id: 'seat', label: '座垫', defaultColor: '#d6c5b3' },
    { id: 'legs', label: '椅腿', defaultColor: '#967b61' },
    { id: 'back', label: '靠背', defaultColor: '#b5a18d' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const seatY = size.height * 0.45;
      const seatHeight = size.height * 0.08;
      return [
        { x: 0, y: seatY + seatHeight / 2, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatHeight = size.height * 0.08;
    const seatY = size.height * 0.45;
    boxComponent(registry, item, chairFurniture, 'seat', {
      width: size.width, height: seatHeight, depth: size.depth
    }, { position: { x: 0, y: seatY, z: 0 } }, { parent: node });

    const backHeight = size.height * 0.47;
    const backThickness = Math.max(0.04, size.depth * 0.08);
    boxComponent(registry, item, chairFurniture, 'back', {
      width: size.width, height: backHeight, depth: backThickness
    }, { position: { x: 0, y: seatY + seatHeight / 2 + backHeight / 2, z: -size.depth / 2 + backThickness / 2 } }, { parent: node });

    const legHeight = seatY - seatHeight / 2;
    const legWidth = Math.max(0.02, size.width * 0.08);
    const legDepth = Math.max(0.02, size.depth * 0.08);
    const xOffset = size.width / 2 - legWidth / 2;
    const zOffset = size.depth / 2 - legDepth / 2;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, chairFurniture, 'legs', {
          width: legWidth, height: legHeight, depth: legDepth
        }, { position: { x: xSide * xOffset, y: legHeight / 2, z: zSide * zOffset } }, { parent: node });
      });
    });
  }
};

// 3. 单人休闲沙发 (Armchair)
export const armchairFurniture = {
  type: 'armchair',
  name: '休闲单人沙发',
  defaultSize: { width: 36, depth: 32, height: 30 },
  components: [
    { id: 'seat', label: '座垫', defaultColor: '#ebd9c8' },
    { id: 'back', label: '靠背', defaultColor: '#d4c2b0' },
    { id: 'arms', label: '扶手', defaultColor: '#d4c2b0' },
    { id: 'legs', label: '短腿', defaultColor: '#7c6351' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const seatH = size.height * 0.38;
      const legH = size.height * 0.12;
      return [
        { x: 0, y: legH + seatH, z: size.depth * 0.04, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatH = size.height * 0.38;
    const legH = size.height * 0.12;

    boxComponent(registry, item, armchairFurniture, 'seat', {
      width: size.width * 0.78, height: seatH, depth: size.depth * 0.92
    }, { position: { x: 0, y: legH + seatH / 2, z: size.depth * 0.04 } }, { parent: node });

    boxComponent(registry, item, armchairFurniture, 'back', {
      width: size.width, height: size.height * 0.88, depth: size.depth * 0.20
    }, { position: { x: 0, y: size.height * 0.44, z: -size.depth * 0.40 } }, { parent: node });

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, armchairFurniture, 'arms', {
        width: size.width * 0.11, height: size.height * 0.58, depth: size.depth * 0.96
      }, { position: { x: side * size.width * 0.445, y: size.height * 0.29, z: size.depth * 0.02 } }, { parent: node });
    });

    const legD = Math.max(0.03, size.width * 0.08);
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        cylinderComponent(registry, item, armchairFurniture, 'legs', {
          diameterTop: legD, diameterBottom: legD * 0.8, height: legH, tessellation: 12
        }, { position: { x: x * size.width * 0.38, y: legH / 2, z: z * size.depth * 0.38 } }, { parent: node });
      });
    });
  }
};

// 4. 圆形木凳 (Stool)
export const stoolFurniture = {
  type: 'stool',
  name: '圆形木凳',
  defaultSize: { width: 14, depth: 14, height: 18 },
  components: [
    { id: 'seat', label: '凳面', defaultColor: '#d9ab7e' },
    { id: 'legs', label: '凳腿', defaultColor: '#aa8056' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatH = size.height * 0.15;
    cylinderComponent(registry, item, stoolFurniture, 'seat', {
      diameterTop: size.width, diameterBottom: size.width, height: seatH, tessellation: 24
    }, { position: { x: 0, y: size.height - seatH / 2, z: 0 } }, { parent: node });

    const legH = size.height - seatH;
    const legD = Math.max(0.02, size.width * 0.09);
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        cylinderComponent(registry, item, stoolFurniture, 'legs', {
          diameterTop: legD, diameterBottom: legD * 0.8, height: legH, tessellation: 12
        }, { position: { x: xSide * size.width * 0.30, y: legH / 2, z: zSide * size.depth * 0.30 } }, { parent: node });
      });
    });
  }
};

// 5. 高脚吧台凳 (Barstool)
export const barstoolFurniture = {
  type: 'barstool',
  name: '高脚吧台凳',
  defaultSize: { width: 15, depth: 15, height: 30 },
  components: [
    { id: 'seat', label: '凳面', defaultColor: '#474747' },
    { id: 'legs', label: '凳腿', defaultColor: '#2b2b2b' },
    { id: 'ring', label: '踏足环', defaultColor: '#d9d9d9' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatH = size.height * 0.12;
    cylinderComponent(registry, item, barstoolFurniture, 'seat', {
      diameterTop: size.width, diameterBottom: size.width * 0.95, height: seatH, tessellation: 24
    }, { position: { x: 0, y: size.height - seatH / 2, z: 0 } }, { parent: node });

    const legH = size.height - seatH;
    const legD = Math.max(0.015, size.width * 0.06);
    [-1, 1].forEach((x) => {
      [-1, 1].forEach((z) => {
        cylinderComponent(registry, item, barstoolFurniture, 'legs', {
          diameterTop: legD, diameterBottom: legD * 0.8, height: legH, tessellation: 8
        }, { position: { x: x * size.width * 0.32, y: legH / 2, z: z * size.depth * 0.32 } }, { parent: node });
      });
    });

    const ringH = 0.02;
    boxComponent(registry, item, barstoolFurniture, 'ring', {
      width: size.width * 0.72, height: ringH, depth: size.depth * 0.72
    }, { position: { x: 0, y: legH * 0.38, z: 0 } }, { parent: node });
  }
};

// 6. 户外木条长椅 (Bench)
export const benchFurniture = {
  type: 'bench',
  name: '户外长椅',
  defaultSize: { width: 60, depth: 18, height: 32 },
  components: [
    { id: 'seat', label: '椅面', defaultColor: '#b57a4c' },
    { id: 'back', label: '靠背', defaultColor: '#b57a4c' },
    { id: 'frame', label: '底架', defaultColor: '#3b3835' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const seatY = size.height * 0.45;
      const seatH = 0.03;
      return [
        { x: -size.width * 0.24, y: seatY + seatH, z: size.depth * 0.04, rot: 0 },
        { x: size.width * 0.24, y: seatY + seatH, z: size.depth * 0.04, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatH = 0.03;
    const seatY = size.height * 0.45;
    boxComponent(registry, item, benchFurniture, 'seat', {
      width: size.width * 0.94, height: seatH, depth: size.depth * 0.88
    }, { position: { x: 0, y: seatY, z: size.depth * 0.04 } }, { parent: node });

    const backH = size.height * 0.38;
    boxComponent(registry, item, benchFurniture, 'back', {
      width: size.width * 0.94, height: backH, depth: 0.03
    }, { position: { x: 0, y: seatY + backH / 2 + 0.05, z: -size.depth * 0.42 } }, { parent: node });

    const legH = seatY;
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, benchFurniture, 'frame', {
        width: 0.04, height: legH, depth: size.depth
      }, { position: { x: side * size.width * 0.46, y: legH / 2, z: 0 } }, { parent: node });

      boxComponent(registry, item, benchFurniture, 'frame', {
        width: 0.04, height: size.height - legH, depth: 0.04
      }, { position: { x: side * size.width * 0.46, y: legH + (size.height - legH) / 2, z: -size.depth * 0.42 } }, { parent: node });
    });
  }
};

// 7. 双人沙发 (Loveseat)
export const loveseatFurniture = {
  type: 'loveseat',
  name: '双人沙发',
  defaultSize: { width: 62, depth: 34, height: 32 },
  components: [
    { id: 'seat', label: '坐垫', defaultColor: '#ffbfcd' },
    { id: 'back', label: '靠背', defaultColor: '#f09ab0' },
    { id: 'arms', label: '扶手', defaultColor: '#f09ab0' },
    { id: 'legs', label: '脚架', defaultColor: '#96633e' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const seatH = Math.max(0.12, size.height * 0.36);
      return [
        { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
        { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const seatH = Math.max(0.12, size.height * 0.36);
    boxComponent(registry, item, loveseatFurniture, 'seat', {
      width: size.width, height: seatH, depth: size.depth
    }, { position: { x: 0, y: seatH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, loveseatFurniture, 'back', {
      width: size.width, height: size.height * 0.58, depth: Math.max(0.12, size.depth * 0.18)
    }, { position: { x: 0, y: size.height * 0.58, z: -size.depth * 0.41 } }, { parent: node });

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, loveseatFurniture, 'arms', {
        width: Math.max(0.12, size.width * 0.11), height: size.height * 0.52, depth: size.depth
      }, { position: { x: side * size.width * 0.445, y: size.height * 0.38, z: 0 } }, { parent: node });
    });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, loveseatFurniture, 'legs', {
          width: 0.08, height: 0.16, depth: 0.08
        }, { position: { x: xSide * size.width * 0.34, y: 0.08, z: zSide * size.depth * 0.32 } }, { parent: node });
      });
    });
  }
};

// 8. 办公升降椅 (Officechair)
export const officechairFurniture = {
  type: 'officechair',
  name: '办公升降椅',
  defaultSize: { width: 24, depth: 24, height: 40 },
  components: [
    { id: 'seat', label: '座面', defaultColor: '#33373d' },
    { id: 'back', label: '靠背', defaultColor: '#202326' },
    { id: 'base', label: '底座支柱', defaultColor: '#c2c7d0' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const baseH = size.height * 0.42;
      const seatH = size.height * 0.08;
      return [
        { x: 0, y: baseH + seatH, z: -size.depth * 0.02, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const baseH = size.height * 0.42;
    cylinderComponent(registry, item, officechairFurniture, 'base', {
      diameterTop: 0.04, diameterBottom: 0.06, height: baseH, tessellation: 12
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, officechairFurniture, 'base', {
      width: size.width * 0.72, height: 0.03, depth: size.depth * 0.72
    }, { position: { x: 0, y: 0.015, z: 0 } }, { parent: node });

    const seatH = size.height * 0.08;
    boxComponent(registry, item, officechairFurniture, 'seat', {
      width: size.width * 0.82, height: seatH, depth: size.depth * 0.82
    }, { position: { x: 0, y: baseH + seatH / 2, z: -size.depth * 0.02 } }, { parent: node });

    const backH = size.height * 0.48;
    boxComponent(registry, item, officechairFurniture, 'back', {
      width: size.width * 0.74, height: backH, depth: 0.06
    }, { position: { x: 0, y: baseH + seatH + backH / 2, z: -size.depth * 0.38 } }, { parent: node });
  }
};

// 9. 懒人豆袋 (Beanbag)
export const beanbagFurniture = {
  type: 'beanbag',
  name: '懒人豆袋',
  defaultSize: { width: 28, depth: 28, height: 20 },
  components: [
    { id: 'body', label: '布袋主体', defaultColor: '#9db5ff' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.72, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    // 稍微压扁的球体来模仿豆袋沙发
    const mesh = sphereComponent(registry, item, beanbagFurniture, 'body', {
      diameter: Math.max(size.width, size.depth), segments: 16
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    mesh.scaling.y = size.height / Math.max(size.width, size.depth);
  }
};

// 10. 折叠躺椅 (Deckchair)
export const deckchairFurniture = {
  type: 'deckchair',
  name: '折叠躺椅',
  defaultSize: { width: 24, depth: 40, height: 28 },
  components: [
    { id: 'fabric', label: '帆布面', defaultColor: '#ff9a6c' },
    { id: 'frame', label: '折叠架', defaultColor: '#ebd5bd' }
  ],
  interaction: {
    type: 'lie',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.36, z: -size.depth * 0.02, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    // 1. 竹木支架 (Frame)
    boxComponent(registry, item, deckchairFurniture, 'frame', {
      width: size.width, height: 0.04, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.18, z: 0 } }, { parent: node });

    // 2. 躺椅斜支架 (Back Frame)
    boxComponent(registry, item, deckchairFurniture, 'frame', {
      width: size.width, height: size.height * 0.88, depth: 0.04
    }, { position: { x: 0, y: size.height * 0.44, z: -size.depth * 0.28 } }, { parent: node });

    // 3. 倾斜帆布铺面 (Slanted Fabric)
    const cloth = boxComponent(registry, item, deckchairFurniture, 'fabric', {
      width: size.width * 0.88, height: 0.016, depth: size.depth * 1.08
    }, { position: { x: 0, y: size.height * 0.42, z: -size.depth * 0.02 } }, { parent: node });
    cloth.rotation.x = Math.PI * 0.16; // 稍微向后躺的倾角
  }
};
