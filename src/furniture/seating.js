import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1. 云朵沙发 (Sofa)
export const sofaFurniture = {
  type: 'sofa',
  name: '云朵沙发',
  unit: 'm',
  defaultSize: { width: 2.15, depth: 0.9, height: 0.8 },
  components: [
    { id: 'seat', label: '坐垫', defaultColor: '#f7f4ed' },
    { id: 'back', label: '靠背', defaultColor: '#ede6d8' },
    { id: 'arms', label: '扶手', defaultColor: '#ede6d8' },
    { id: 'legs', label: '实木外撇腿', defaultColor: '#997b66' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const seatH = Math.max(0.12, size.height * 0.4);
      return [
        { x: -size.width * 0.22, y: seatH, z: 0, rot: 0 },
        { x: size.width * 0.22, y: seatH, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const legH = size.height * 0.18;
    const legTopD = size.width * 0.035;
    const legBottomD = size.width * 0.022;

    const xInset = size.width * 0.38;
    const zInset = size.depth * 0.32;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        const leg = cylinderComponent(registry, item, sofaFurniture, 'legs', {
          diameterTop: legTopD,
          diameterBottom: legBottomD,
          height: legH,
          tessellation: 12
        }, {
          position: {
            x: xSide * xInset,
            y: legH / 2,
            z: zSide * zInset
          }
        }, { parent: node });
        leg.rotation.z = -xSide * 0.15;
        leg.rotation.x = zSide * 0.15;
      });
    });

    const baseH = size.height * 0.06;
    boxComponent(registry, item, sofaFurniture, 'seat', {
      width: size.width * 0.92,
      height: baseH,
      depth: size.depth * 0.88
    }, { position: { x: 0, y: legH + baseH / 2, z: 0 } }, { parent: node });

    const seatH = size.height * 0.24;
    const seatY = legH + baseH + seatH / 2;
    const seatW = size.width * 0.43;
    const seatD = size.depth * 0.84;
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, sofaFurniture, 'seat', {
        width: seatW,
        height: seatH,
        depth: seatD
      }, {
        position: {
          x: side * (seatW / 2 + size.width * 0.01),
          y: seatY,
          z: size.depth * 0.02
        }
      }, { parent: node });
    });

    const backH = size.height * 0.58;
    const backT = Math.max(0.12, size.depth * 0.22);
    const backY = legH + baseH + backH / 2;
    const backZ = -size.depth * 0.38;

    const backMesh = boxComponent(registry, item, sofaFurniture, 'back', {
      width: size.width * 0.96,
      height: backH,
      depth: backT
    }, {
      position: { x: 0, y: backY, z: backZ }
    }, { parent: node });
    backMesh.rotation.x = -0.06;

    cylinderComponent(registry, item, sofaFurniture, 'back', {
      diameterTop: backT * 1.1,
      diameterBottom: backT * 1.1,
      height: size.width * 0.94,
      tessellation: 12
    }, {
      position: { x: 0, y: legH + baseH + backH, z: backZ - 0.02 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    const armW = size.width * 0.12;
    const armH = size.height * 0.44;
    const armD = size.depth * 0.92;
    const armY = legH + baseH + armH / 2;

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, sofaFurniture, 'arms', {
        width: armW,
        height: armH,
        depth: armD
      }, {
        position: {
          x: side * (size.width / 2 - armW / 2),
          y: armY,
          z: 0
        }
      }, { parent: node });

      cylinderComponent(registry, item, sofaFurniture, 'arms', {
        diameterTop: armW * 1.1,
        diameterBottom: armW * 1.1,
        height: armD,
        tessellation: 12
      }, {
        position: {
          x: side * (size.width / 2 - armW / 2),
          y: armY + armH / 2,
          z: 0
        },
        rotation: { x: Math.PI / 2 }
      }, { parent: node });
    });
  }
};

// 2. 简约木椅 (Chair)
export const chairFurniture = {
  type: 'chair',
  name: '椅子',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.8 },
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
  name: '沙发',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.8, height: 0.75 },
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
  name: '木凳',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.45 },
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
  name: '吧台凳',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 0.75 },
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
  unit: 'm',
  defaultSize: { width: 1.5, depth: 0.45, height: 0.8 },
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
  unit: 'm',
  defaultSize: { width: 1.55, depth: 0.85, height: 0.8 },
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
  name: '办公椅',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.6, height: 1 },
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
  unit: 'm',
  defaultSize: { width: 0.7, depth: 0.7, height: 0.5 },
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
  name: '躺椅',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 1, height: 0.7 },
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
    const backFrame = boxComponent(registry, item, deckchairFurniture, 'frame', {
      width: size.width, height: size.height * 0.88, depth: 0.04
    }, { position: { x: 0, y: size.height * 0.44, z: -size.depth * 0.28 } }, { parent: node });
    backFrame.rotation.x = -Math.PI * 0.16;

    // 3. 倾斜帆布铺面 (Slanted Fabric)
    const cloth = boxComponent(registry, item, deckchairFurniture, 'fabric', {
      width: size.width * 0.88, height: 0.016, depth: size.depth * 1.08
    }, { position: { x: 0, y: size.height * 0.42, z: -size.depth * 0.02 } }, { parent: node });
    cloth.rotation.x = -Math.PI * 0.16; // 稍微向后躺的倾角
  }
};

// 11. 庭院休闲椅 (Adirondack Chair)
export const adirondackChairFurniture = {
  type: 'adirondack_chair',
  name: '休闲椅',
  unit: 'm',
  defaultSize: { width: 0.7, depth: 0.85, height: 0.9 },
  components: [
    { id: 'seat', label: '座面', defaultColor: '#c99662' },
    { id: 'back', label: '靠背', defaultColor: '#d6ac78' },
    { id: 'arms', label: '扶手', defaultColor: '#bd895a' },
    { id: 'legs', label: '椅脚', defaultColor: '#7a5a40' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.42, z: size.depth * 0.02, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    const seat = boxComponent(registry, item, adirondackChairFurniture, 'seat', {
      width: size.width * 0.82, height: 0.04, depth: size.depth * 0.52
    }, { position: { x: 0, y: size.height * 0.36, z: size.depth * 0.04 } }, { parent: node });
    seat.rotation.x = -Math.PI * 0.06;

    const back = boxComponent(registry, item, adirondackChairFurniture, 'back', {
      width: size.width * 0.82, height: size.height * 0.52, depth: 0.04
    }, { position: { x: 0, y: size.height * 0.62, z: -size.depth * 0.3 } }, { parent: node });
    back.rotation.x = -Math.PI * 0.16;

    [-1, 1].forEach((side) => {
      const arm = boxComponent(registry, item, adirondackChairFurniture, 'arms', {
        width: size.width * 0.12, height: 0.04, depth: size.depth * 0.54
      }, { position: { x: side * size.width * 0.38, y: size.height * 0.48, z: size.depth * 0.04 } }, { parent: node });
      arm.rotation.x = -Math.PI * 0.06;
    });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, adirondackChairFurniture, 'legs', {
          width: 0.04, height: size.height * 0.36, depth: 0.04
        }, { position: { x: xSide * size.width * 0.28, y: size.height * 0.18, z: zSide * size.depth * 0.18 } }, { parent: node });
      });
    });
  }
};

// 12. 折叠露营椅 (Folding Camping Chair)
export const foldingCampingChairFurniture = {
  type: 'folding_camping_chair',
  name: '露营椅',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.6, height: 0.8 },
  components: [
    { id: 'fabric', label: '布面', defaultColor: '#6ea4c8' },
    { id: 'frame', label: '折叠架', defaultColor: '#70757d' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.42, z: 0, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    const legH = size.height * 0.54;
    const legY = legH / 2;
    const legThickness = 0.03;

    // 左右两对交叉折叠腿 (X 结构)
    [-1, 1].forEach((xSide) => {
      // 倾斜向后的腿
      const leg1 = boxComponent(registry, item, foldingCampingChairFurniture, 'frame', {
        width: legThickness, height: legH, depth: legThickness
      }, { position: { x: xSide * size.width * 0.32, y: legH, z: 0 } }, { parent: node });
      leg1.rotation.x = Math.PI * 0.25;

      // 倾斜向前的腿
      const leg2 = boxComponent(registry, item, foldingCampingChairFurniture, 'frame', {
        width: legThickness, height: legH, depth: legThickness
      }, { position: { x: xSide * size.width * 0.32, y: legH, z: 0 } }, { parent: node });
      leg2.rotation.x = -Math.PI * 0.25;
    });

    const seat = boxComponent(registry, item, foldingCampingChairFurniture, 'fabric', {
      width: size.width * 0.78, height: 0.02, depth: size.depth * 0.7
    }, { position: { x: 0, y: size.height * 0.42, z: size.depth * 0.04 } }, { parent: node });
    seat.rotation.x = -Math.PI * 0.08;

    const back = boxComponent(registry, item, foldingCampingChairFurniture, 'fabric', {
      width: size.width * 0.78, height: size.height * 0.46, depth: 0.02
    }, { position: { x: 0, y: size.height * 0.68, z: -size.depth * 0.22 } }, { parent: node });
    back.rotation.x = -Math.PI * 0.12;
  }
};

// 13. 藤编休闲椅 (Rattan Lounge Chair)
export const rattanLoungeChairFurniture = {
  type: 'rattan_lounge_chair',
  name: '藤椅',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.75, height: 0.8 },
  components: [
    { id: 'seat', label: '坐垫', defaultColor: '#efe2cf' },
    { id: 'shell', label: '藤框', defaultColor: '#a6784d' },
    { id: 'legs', label: '底座', defaultColor: '#6e5542' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.44, z: size.depth * 0.02, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    const shellW = size.width;
    const shellH = size.height * 0.64;
    const shellD = size.depth * 0.92;
    const shellY = size.height * 0.44;
    const t = 0.03;

    // 底板
    boxComponent(registry, item, rattanLoungeChairFurniture, 'shell', {
      width: shellW, height: t, depth: shellD
    }, { position: { x: 0, y: shellY - shellH / 2 + t / 2, z: 0 } }, { parent: node });

    // 后靠背
    boxComponent(registry, item, rattanLoungeChairFurniture, 'shell', {
      width: shellW, height: shellH - t, depth: t
    }, { position: { x: 0, y: shellY + t / 2, z: -shellD / 2 + t / 2 } }, { parent: node });

    // 左扶手
    boxComponent(registry, item, rattanLoungeChairFurniture, 'shell', {
      width: t, height: shellH - t, depth: shellD - t
    }, { position: { x: -shellW / 2 + t / 2, y: shellY + t / 2, z: t / 2 } }, { parent: node });

    // 右扶手
    boxComponent(registry, item, rattanLoungeChairFurniture, 'shell', {
      width: t, height: shellH - t, depth: shellD - t
    }, { position: { x: shellW / 2 - t / 2, y: shellY + t / 2, z: t / 2 } }, { parent: node });

    const seat = boxComponent(registry, item, rattanLoungeChairFurniture, 'seat', {
      width: size.width * 0.78, height: 0.05, depth: size.depth * 0.68
    }, { position: { x: 0, y: size.height * 0.36, z: size.depth * 0.04 } }, { parent: node });
    seat.rotation.x = -Math.PI * 0.08;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        cylinderComponent(registry, item, rattanLoungeChairFurniture, 'legs', {
          diameterTop: 0.04, diameterBottom: 0.03, height: size.height * 0.22, tessellation: 12
        }, { position: { x: xSide * size.width * 0.28, y: size.height * 0.11, z: zSide * size.depth * 0.24 } }, { parent: node });
      });
    });
  }
};

// 14. 吊篮椅 (Hanging Egg Chair)
export const hangingEggChairFurniture = {
  type: 'hanging_egg_chair',
  name: '吊篮椅',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.85, height: 1.8 },
  components: [
    { id: 'frame', label: '吊架', defaultColor: '#55585d' },
    { id: 'shell', label: '椅蓝', defaultColor: '#9b6f46' },
    { id: 'cushion', label: '坐垫', defaultColor: '#f3e4c8' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.42, z: 0, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    cylinderComponent(registry, item, hangingEggChairFurniture, 'frame', {
      diameterTop: size.width * 0.72,
      diameterBottom: size.width * 0.72,
      height: 0.03,
      tessellation: 24
    }, { position: { x: 0, y: 0.015, z: 0 } }, { parent: node });

    const pole = boxComponent(registry, item, hangingEggChairFurniture, 'frame', {
      width: 0.04, height: size.height * 0.92, depth: 0.04
    }, { position: { x: 0, y: size.height * 0.46, z: -size.depth * 0.2 } }, { parent: node });
    pole.rotation.x = -Math.PI * 0.08;

    boxComponent(registry, item, hangingEggChairFurniture, 'frame', {
      width: 0.02, height: size.height * 0.26, depth: 0.02
    }, { position: { x: 0, y: size.height * 0.56, z: 0 } }, { parent: node });

    const shellW = size.width * 0.78;
    const shellH = size.height * 0.48;
    const shellD = size.depth * 0.78;
    const shellY = size.height * 0.4;
    const shellZ = size.depth * 0.04;
    const t = 0.03;

    // 底板
    boxComponent(registry, item, hangingEggChairFurniture, 'shell', {
      width: shellW, height: t, depth: shellD
    }, { position: { x: 0, y: shellY - shellH / 2 + t / 2, z: shellZ } }, { parent: node });

    // 顶板
    boxComponent(registry, item, hangingEggChairFurniture, 'shell', {
      width: shellW, height: t, depth: shellD
    }, { position: { x: 0, y: shellY + shellH / 2 - t / 2, z: shellZ } }, { parent: node });

    // 后板
    boxComponent(registry, item, hangingEggChairFurniture, 'shell', {
      width: shellW, height: shellH - t * 2, depth: t
    }, { position: { x: 0, y: shellY, z: shellZ - shellD / 2 + t / 2 } }, { parent: node });

    // 左侧板
    boxComponent(registry, item, hangingEggChairFurniture, 'shell', {
      width: t, height: shellH - t * 2, depth: shellD - t
    }, { position: { x: -shellW / 2 + t / 2, y: shellY, z: shellZ + t / 2 } }, { parent: node });

    // 右侧板
    boxComponent(registry, item, hangingEggChairFurniture, 'shell', {
      width: t, height: shellH - t * 2, depth: shellD - t
    }, { position: { x: shellW / 2 - t / 2, y: shellY, z: shellZ + t / 2 } }, { parent: node });

    const cushion = boxComponent(registry, item, hangingEggChairFurniture, 'cushion', {
      width: size.width * 0.58, height: size.height * 0.08, depth: size.depth * 0.46
    }, { position: { x: 0, y: size.height * 0.32, z: size.depth * 0.08 } }, { parent: node });
    cushion.rotation.x = Math.PI * 0.08;
  }
};
