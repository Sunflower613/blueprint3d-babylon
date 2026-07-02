import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1. 多层绿植盆景 (Plant)
export const plantFurniture = {
  type: 'plant',
  name: '绿植盆景',
  defaultSize: { width: 28, depth: 28, height: 46 },
  components: [
    { id: 'leaf-upper', label: '顶部叶冠', defaultColor: '#76ca91' },
    { id: 'leaf-mid', label: '中部叶冠', defaultColor: '#5cb878' },
    { id: 'leaf-lower', label: '底部叶冠', defaultColor: '#48a868' },
    { id: 'trunk', label: '树干', defaultColor: '#704a2c' },
    { id: 'dirt', label: '盆泥', defaultColor: '#5c3d24' },
    { id: 'pot', label: '花盆', defaultColor: '#e28a5c' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.28;
    const dirtH = size.height * 0.04;
    const trunkH = size.height * 0.44;

    cylinderComponent(registry, item, plantFurniture, 'pot', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.72, height: potH, tessellation: 16
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, plantFurniture, 'dirt', {
      diameterTop: size.width * 0.84, diameterBottom: size.width * 0.84, height: dirtH, tessellation: 16
    }, { position: { x: 0, y: potH - dirtH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, plantFurniture, 'trunk', {
      diameterTop: Math.max(0.015, size.width * 0.08), diameterBottom: Math.max(0.018, size.width * 0.1), height: trunkH, tessellation: 12
    }, { position: { x: 0, y: potH + trunkH / 2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, plantFurniture, 'leaf-lower', {
      diameter: size.width * 0.88, segments: 16
    }, { position: { x: 0, y: potH + trunkH * 0.52, z: 0 } }, { parent: node });

    sphereComponent(registry, item, plantFurniture, 'leaf-mid', {
      diameter: size.width * 0.74, segments: 16
    }, { position: { x: 0, y: potH + trunkH * 0.90, z: 0 } }, { parent: node });

    sphereComponent(registry, item, plantFurniture, 'leaf-upper', {
      diameter: size.width * 0.58, segments: 16
    }, { position: { x: 0, y: potH + trunkH * 1.22, z: 0 } }, { parent: node });
  }
};

// 2. 简约落地灯 (Lamp)
export const lampFurniture = {
  type: 'lamp',
  name: '简约落地灯',
  defaultSize: { width: 14, depth: 14, height: 62 },
  components: [
    { id: 'shade', label: '灯罩', defaultColor: '#fffae6' },
    { id: 'pole', label: '灯杆', defaultColor: '#3d3d3d' },
    { id: 'base', label: '底座', defaultColor: '#5c5c5c' }
  ],
  build(registry, item, node, size) {
    const baseHeight = size.height * 0.04;
    const shadeHeight = size.height * 0.20;
    const poleHeight = size.height * 0.76;

    cylinderComponent(registry, item, lampFurniture, 'base', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.92, height: baseHeight, tessellation: 24
    }, { position: { x: 0, y: baseHeight / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lampFurniture, 'pole', {
      diameterTop: Math.max(0.015, size.width * 0.08), diameterBottom: Math.max(0.015, size.width * 0.08), height: poleHeight, tessellation: 12
    }, { position: { x: 0, y: baseHeight + poleHeight / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lampFurniture, 'shade', {
      diameterTop: size.width * 0.76, diameterBottom: size.width * 0.96, height: shadeHeight, tessellation: 24
    }, { position: { x: 0, y: size.height - shadeHeight / 2, z: 0 } }, { parent: node });
  }
};

// 3. 亲肤地毯 (Rug)
export const rugFurniture = {
  type: 'rug',
  name: '亲肤地毯',
  defaultSize: { width: 60, depth: 84, height: 0.4 },
  components: [
    { id: 'fabric', label: '地毯织面', defaultColor: '#8fa6cc' }
  ],
  build(registry, item, node, size) {
    const rugThickness = 0.008;
    boxComponent(registry, item, rugFurniture, 'fabric', {
      width: size.width, height: rugThickness, depth: size.depth
    }, { position: { x: 0, y: rugThickness / 2 + 0.002, z: 0 } }, { parent: node });
  }
};

// 4. 艺术挂画 (Painting)
export const paintingFurniture = {
  type: 'painting',
  name: '艺术挂画',
  defaultSize: { width: 32, depth: 1.5, height: 24 },
  placeType: 'wall',
  components: [
    { id: 'frame', label: '木质画框', defaultColor: '#59412e' },
    { id: 'canvas', label: '艺术画布', defaultColor: '#faedd9' }
  ],
  build(registry, item, node, size) {
    // 1. 外框 (Frame)
    boxComponent(registry, item, paintingFurniture, 'frame', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 画布 (Canvas)
    boxComponent(registry, item, paintingFurniture, 'canvas', {
      width: size.width - 0.06, height: size.height - 0.06, depth: size.depth + 0.006
    }, { position: { x: 0, y: size.height / 2, z: 0.003 } }, { parent: node });
  }
};

// 5. 插花花瓶 (Vase)
export const vaseFurniture = {
  type: 'vase',
  name: '插花花瓶',
  defaultSize: { width: 8, depth: 8, height: 18 },
  components: [
    { id: 'glass', label: '水汽玻璃瓶', defaultColor: '#bfe3d6' },
    { id: 'flower', label: '绣球干花', defaultColor: '#f09ab5' }
  ],
  build(registry, item, node, size) {
    const glassH = size.height * 0.62;
    cylinderComponent(registry, item, vaseFurniture, 'glass', {
      diameterTop: size.width * 0.44, diameterBottom: size.width * 0.72, height: glassH, tessellation: 16
    }, { position: { x: 0, y: glassH / 2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, vaseFurniture, 'flower', {
      diameter: size.width * 1.05, segments: 16
    }, { position: { x: 0, y: glassH + size.height * 0.2, z: 0 } }, { parent: node });
  }
};

// 6. 全身大立镜 (Mirror Wall)
export const mirrorWallFurniture = {
  type: 'mirror_wall',
  name: '全身大立镜',
  defaultSize: { width: 18, depth: 12, height: 64 },
  isMirror: true,
  isSwitchable: true,
  components: [
    { id: 'mirror', label: '银河镜面', defaultColor: '#edf7f6' },
    { id: 'border', label: '细边框', defaultColor: '#222222' },
    { id: 'frame', label: '实木后支架', defaultColor: '#aa845d' }
  ],
  build(registry, item, node, size) {
    const mirrorT = 0.03;
    const legD = size.depth * 0.88;
    const hasBorder = item.isOn !== false;

    // 1. 镜板 (Mirror Board)
    const board = boxComponent(registry, item, mirrorWallFurniture, 'mirror', {
      width: size.width, height: size.height * 0.94, depth: mirrorT
    }, { position: { x: 0, y: size.height * 0.48, z: -legD * 0.12 } }, { parent: node });
    board.rotation.x = -Math.PI * 0.04; // 稍微后仰

    // 1.1 细边框 (Fine Border) - 拼合成口字型，以 board 为 parent，随之倾斜
    if (hasBorder) {
      const boardH = size.height * 0.94;
      const borderW = 0.012; // 1.2 厘米细边框
      const borderD = mirrorT + 0.002; // 比镜面板稍厚一些，用于包覆边缘且避免 Z-fighting 闪烁

      // 左边框
      boxComponent(registry, item, mirrorWallFurniture, 'border', {
        width: borderW, height: boardH, depth: borderD
      }, { position: { x: -size.width / 2 + borderW / 2, y: 0, z: 0 } }, { parent: board });

      // 右边框
      boxComponent(registry, item, mirrorWallFurniture, 'border', {
        width: borderW, height: boardH, depth: borderD
      }, { position: { x: size.width / 2 - borderW / 2, y: 0, z: 0 } }, { parent: board });

      // 上边框
      boxComponent(registry, item, mirrorWallFurniture, 'border', {
        width: size.width - 2 * borderW, height: borderW, depth: borderD
      }, { position: { x: 0, y: boardH / 2 - borderW / 2, z: 0 } }, { parent: board });

      // 下边框
      boxComponent(registry, item, mirrorWallFurniture, 'border', {
        width: size.width - 2 * borderW, height: borderW, depth: borderD
      }, { position: { x: 0, y: -boardH / 2 + borderW / 2, z: 0 } }, { parent: board });
    }

    // 2. 支架 (Support Frame)
    const stand = boxComponent(registry, item, mirrorWallFurniture, 'frame', {
      width: size.width * 0.82, height: size.height * 0.52, depth: 0.03
    }, { position: { x: 0, y: size.height * 0.20, z: -legD * 0.68 } }, { parent: node });
    stand.rotation.x = Math.PI * 0.12; // 支撑脚往前倾斜撑住
  }
};

// 6.1 装饰墙镜 (Framed Wall Mirror)
export const mirrorFramedWallFurniture = {
  type: 'mirror_framed_wall',
  name: '装饰墙镜',
  defaultSize: { width: 24, depth: 1.2, height: 32 },
  placeType: 'wall',
  isMirror: true,
  isSwitchable: true,
  components: [
    { id: 'mirror', label: '银河镜面', defaultColor: '#edf7f6' },
    { id: 'border', label: '细边框', defaultColor: '#222222' }
  ],
  build(registry, item, node, size) {
    const hasBorder = item.isOn !== false;
    const mirrorT = size.depth;

    // 1. 镜板 (Mirror Board)
    const board = boxComponent(registry, item, mirrorFramedWallFurniture, 'mirror', {
      width: size.width, height: size.height, depth: mirrorT
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    if (hasBorder) {
      const borderW = 0.012; // 1.2 厘米细边框
      const borderD = mirrorT + 0.002; // 比镜面板稍厚一些，用于包覆边缘且避免 Z-fighting 闪烁

      // 左边框
      boxComponent(registry, item, mirrorFramedWallFurniture, 'border', {
        width: borderW, height: size.height, depth: borderD
      }, { position: { x: -size.width / 2 + borderW / 2, y: 0, z: 0 } }, { parent: board });

      // 右边框
      boxComponent(registry, item, mirrorFramedWallFurniture, 'border', {
        width: borderW, height: size.height, depth: borderD
      }, { position: { x: size.width / 2 - borderW / 2, y: 0, z: 0 } }, { parent: board });

      // 上边框
      boxComponent(registry, item, mirrorFramedWallFurniture, 'border', {
        width: size.width - 2 * borderW, height: borderW, depth: borderD
      }, { position: { x: 0, y: size.height / 2 - borderW / 2, z: 0 } }, { parent: board });

      // 下边框
      boxComponent(registry, item, mirrorFramedWallFurniture, 'border', {
        width: size.width - 2 * borderW, height: borderW, depth: borderD
      }, { position: { x: 0, y: -size.height / 2 + borderW / 2, z: 0 } }, { parent: board });
    }
  }
};

// 6.2 圆形装饰镜 (Round Wall Mirror)
export const mirrorRoundWallFurniture = {
  type: 'mirror_round_wall',
  name: '圆形装饰镜',
  defaultSize: { width: 24, depth: 1.2, height: 24 },
  placeType: 'wall',
  isMirror: true,
  isSwitchable: true,
  components: [
    { id: 'mirror', label: '银河镜面', defaultColor: '#edf7f6' },
    { id: 'border', label: '细边框', defaultColor: '#222222' }
  ],
  build(registry, item, node, size) {
    const hasBorder = item.isOn !== false;
    const mirrorT = size.depth;

    if (hasBorder) {
      const borderW = 0.012; // 1.2 厘米细边框
      const borderD = mirrorT + 0.002;

      // 1. 边框底座 (Border Base)
      cylinderComponent(registry, item, mirrorRoundWallFurniture, 'border', {
        diameterTop: size.width, diameterBottom: size.width, height: borderD, tessellation: 36
      }, { position: { x: 0, y: size.height / 2, z: -0.001 }, rotation: { x: Math.PI * 0.5, y: 0, z: 0 } }, { parent: node });

      // 2. 镜面板 (Mirror Board) - 嵌入在边框内部，比边框直径小 2 * borderW，位置稍微靠前一点点
      cylinderComponent(registry, item, mirrorRoundWallFurniture, 'mirror', {
        diameterTop: size.width - 2 * borderW, diameterBottom: size.width - 2 * borderW, height: mirrorT, tessellation: 36
      }, { position: { x: 0, y: size.height / 2, z: 0.001 }, rotation: { x: Math.PI * 0.5, y: 0, z: 0 } }, { parent: node });
    } else {
      // 无边框，全镜面
      cylinderComponent(registry, item, mirrorRoundWallFurniture, 'mirror', {
        diameterTop: size.width, diameterBottom: size.width, height: mirrorT, tessellation: 36
      }, { position: { x: 0, y: size.height / 2, z: 0 }, rotation: { x: Math.PI * 0.5, y: 0, z: 0 } }, { parent: node });
    }
  }
};

// 6.3 圆角装饰镜 (Rounded Wall Mirror)
export const mirrorRoundedWallFurniture = {
  type: 'mirror_rounded_wall',
  name: '圆角装饰镜',
  defaultSize: { width: 24, depth: 1.2, height: 32 },
  placeType: 'wall',
  isMirror: true,
  isSwitchable: true,
  components: [
    { id: 'mirror', label: '银河镜面', defaultColor: '#edf7f6' },
    { id: 'border', label: '细边框', defaultColor: '#222222' }
  ],
  build(registry, item, node, size) {
    const hasBorder = item.isOn !== false;
    const mirrorT = size.depth;

    if (hasBorder) {
      const borderW = 0.012; // 1.2 厘米细边框
      const borderD = mirrorT + 0.002;
      const R = Math.min(0.04, size.width * 0.2, size.height * 0.2); // 圆角半径 4cm

      // --- 镜面部分 ---
      // 中部镜面 Box
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
        width: size.width - 2 * R, height: size.height, depth: mirrorT
      }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

      // 左右补足镜面 Box
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
        width: R - borderW, height: size.height - 2 * R, depth: mirrorT
      }, { position: { x: -(size.width / 2 - R + (R - borderW) / 2), y: size.height / 2, z: 0 } }, { parent: node });

      boxComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
        width: R - borderW, height: size.height - 2 * R, depth: mirrorT
      }, { position: { x: size.width / 2 - R + (R - borderW) / 2, y: size.height / 2, z: 0 } }, { parent: node });

      // 4个角上内层圆角镜面 Cylinder
      const cornerR = R - borderW;
      const cornerAngles = [
        { x: -(size.width / 2 - R), y: size.height - R }, // 左上
        { x: size.width / 2 - R, y: size.height - R },    // 右上
        { x: -(size.width / 2 - R), y: R },               // 左下
        { x: size.width / 2 - R, y: R }                   // 右下
      ];
      cornerAngles.forEach(pos => {
        cylinderComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
          diameterTop: 2 * cornerR, diameterBottom: 2 * cornerR, height: mirrorT, tessellation: 24
        }, { position: { x: pos.x, y: pos.y, z: 0.0005 }, rotation: { x: Math.PI * 0.5, y: 0, z: 0 } }, { parent: node });
      });

      // --- 边框部分 ---
      // 4个角外侧圆角边框 Cylinder
      cornerAngles.forEach(pos => {
        cylinderComponent(registry, item, mirrorRoundedWallFurniture, 'border', {
          diameterTop: 2 * R, diameterBottom: 2 * R, height: borderD, tessellation: 24
        }, { position: { x: pos.x, y: pos.y, z: -0.0005 }, rotation: { x: Math.PI * 0.5, y: 0, z: 0 } }, { parent: node });
      });

      // 4条直边边框 Box
      // 左直边
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'border', {
        width: borderW, height: size.height - 2 * R, depth: borderD
      }, { position: { x: -size.width / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: node });

      // 右直边
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'border', {
        width: borderW, height: size.height - 2 * R, depth: borderD
      }, { position: { x: size.width / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: node });

      // 上直边
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'border', {
        width: size.width - 2 * R, height: borderW, depth: borderD
      }, { position: { x: 0, y: size.height - borderW / 2, z: 0 } }, { parent: node });

      // 下直边
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'border', {
        width: size.width - 2 * R, height: borderW, depth: borderD
      }, { position: { x: 0, y: borderW / 2, z: 0 } }, { parent: node });

    } else {
      // 隐藏边框：无边框圆角矩形镜面
      const R = Math.min(0.04, size.width * 0.2, size.height * 0.2);

      // 中部 Box
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
        width: size.width - 2 * R, height: size.height, depth: mirrorT
      }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

      // 左右补足 Box
      boxComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
        width: R, height: size.height - 2 * R, depth: mirrorT
      }, { position: { x: -(size.width / 2 - R / 2), y: size.height / 2, z: 0 } }, { parent: node });

      boxComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
        width: R, height: size.height - 2 * R, depth: mirrorT
      }, { position: { x: size.width / 2 - R / 2, y: size.height / 2, z: 0 } }, { parent: node });

      // 4个圆角 Cylinder
      const cornerAngles = [
        { x: -(size.width / 2 - R), y: size.height - R },
        { x: size.width / 2 - R, y: size.height - R },
        { x: -(size.width / 2 - R), y: R },
        { x: size.width / 2 - R, y: R }
      ];
      cornerAngles.forEach(pos => {
        cylinderComponent(registry, item, mirrorRoundedWallFurniture, 'mirror', {
          diameterTop: 2 * R, diameterBottom: 2 * R, height: mirrorT, tessellation: 24
        }, { position: { x: pos.x, y: pos.y, z: 0 }, rotation: { x: Math.PI * 0.5, y: 0, z: 0 } }, { parent: node });
      });
    }
  }
};

// 7. 垂地窗帘 (Curtain)
export const curtainFurniture = {
  type: 'curtain',
  name: '垂地窗帘',
  defaultSize: { width: 48, depth: 2, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'fabric', label: '窗帘垂帘', defaultColor: '#ded8cc' },
    { id: 'rod', label: '罗马金属杆', defaultColor: '#3b3a39' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.03;
    cylinderComponent(registry, item, curtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const fabricH = size.height - rodH;

    // 始终生成不可见但作为点击代理和包围盒计算支柱的最大遮光面积盒子
    const proxy = boxComponent(registry, item, curtainFurniture, 'fabric', {
      width: size.width * 0.94, height: fabricH, depth: 0.012
    }, { position: { x: 0, y: fabricH / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001; // 透明，作为碰撞和选中范围支架
      // 两侧窄帘布
      boxComponent(registry, item, curtainFurniture, 'fabric', {
        width: size.width * 0.18, height: fabricH, depth: size.depth * 0.6
      }, { position: { x: -size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });

      boxComponent(registry, item, curtainFurniture, 'fabric', {
        width: size.width * 0.18, height: fabricH, depth: size.depth * 0.6
      }, { position: { x: size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });
    } else {
      proxy.visibility = 1.0; // 满宽可见
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 8. 靠枕 (Cushion)
export const cushionFurniture = {
  type: 'cushion',
  name: '羽绒靠枕',
  defaultSize: { width: 16, depth: 16, height: 6 },
  components: [
    { id: 'fabric', label: '棉麻枕套', defaultColor: '#ffbe73' }
  ],
  build(registry, item, node, size) {
    // 羽绒软枕头
    boxComponent(registry, item, cushionFurniture, 'fabric', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 9. 墙面圆挂钟 (Clock)
export const clockFurniture = {
  type: 'clock',
  name: '挂壁圆钟',
  defaultSize: { width: 12, depth: 1, height: 12 },
  components: [
    { id: 'face', label: '钟白表盘', defaultColor: '#ffffff' },
    { id: 'frame', label: '金属表框', defaultColor: '#202124' }
  ],
  build(registry, item, node, size) {
    const frameD = size.width;
    cylinderComponent(registry, item, clockFurniture, 'frame', {
      diameterTop: frameD, diameterBottom: frameD, height: size.depth, tessellation: 24
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const faceD = size.width * 0.88;
    cylinderComponent(registry, item, clockFurniture, 'face', {
      diameterTop: faceD, diameterBottom: faceD, height: size.depth + 0.004, tessellation: 24
    }, { position: { x: 0, y: size.height / 2, z: 0.002 } }, { parent: node });

    // 指针装饰
    boxComponent(registry, item, clockFurniture, 'frame', {
      width: 0.015, height: size.height * 0.32, depth: 0.004
    }, { position: { x: 0, y: size.height / 2 + size.height * 0.1, z: size.depth + 0.005 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      m.rotation.x = Math.PI * 0.5;
    });
  }
};

// 10. 悬挂绿植盆栽 (Plant Pot)
export const plantPotFurniture = {
  type: 'plant_pot',
  name: '挂壁吊兰',
  defaultSize: { width: 16, depth: 16, height: 40 },
  placeType: 'ceiling',
  components: [
    { id: 'leaf', label: '吊兰绿叶', defaultColor: '#7fc995' },
    { id: 'pot', label: '白色吊盆', defaultColor: '#ffffff' },
    { id: 'rope', label: '吊索麻绳', defaultColor: '#7a6652' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.18;
    const ropeH = size.height * 0.72;

    // 1. 吊绳 (Rope)
    cylinderComponent(registry, item, plantPotFurniture, 'rope', {
      diameterTop: 0.008, diameterBottom: 0.008, height: ropeH, tessellation: 6
    }, { position: { x: 0, y: size.height - ropeH / 2, z: 0 } }, { parent: node });

    // 2. 吊盆 (Pot)
    cylinderComponent(registry, item, plantPotFurniture, 'pot', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.52, height: potH, tessellation: 12
    }, { position: { x: 0, y: size.height - ropeH - potH / 2, z: 0 } }, { parent: node });

    // 3. 绿植叶片
    sphereComponent(registry, item, plantPotFurniture, 'leaf', {
      diameter: size.width * 0.94, segments: 12
    }, { position: { x: 0, y: size.height - ropeH + 0.02, z: 0 } }, { parent: node });
  }
};


// 11. 北欧艺术吊灯 (Chandelier)
export const chandelierFurniture = {
  type: 'chandelier',
  name: '北欧吸顶吊灯',
  defaultSize: { width: 20, depth: 20, height: 36 },
  placeType: 'ceiling',
  components: [
    { id: 'shade', label: '设计灯罩', defaultColor: '#ffffff' },
    { id: 'light', label: '暖光灯泡', defaultColor: '#fff5d6' },
    { id: 'cord', label: '吊线吊挂', defaultColor: '#2b2b2b' }
  ],
  build(registry, item, node, size) {
    const cordH = size.height * 0.64;
    const shadeH = size.height * 0.28;
    const bulbH = size.height * 0.08;

    // 1. 吊线
    cylinderComponent(registry, item, chandelierFurniture, 'cord', {
      diameterTop: 0.008, diameterBottom: 0.008, height: cordH, tessellation: 6
    }, { position: { x: 0, y: size.height - cordH / 2, z: 0 } }, { parent: node });

    // 2. 灯罩
    cylinderComponent(registry, item, chandelierFurniture, 'shade', {
      diameterTop: size.width * 0.16, diameterBottom: size.width, height: shadeH, tessellation: 24
    }, { position: { x: 0, y: size.height - cordH - shadeH / 2, z: 0 } }, { parent: node });

    // 3. 灯泡/光源
    sphereComponent(registry, item, chandelierFurniture, 'light', {
      diameter: bulbH * 1.5, segments: 12
    }, { position: { x: 0, y: size.height - cordH - shadeH + bulbH / 2, z: 0 } }, { parent: node });
  }
};

import { Color3, MeshBuilder, StandardMaterial } from '../core/babylon.js';
const BABYLON = { Color3, MeshBuilder, StandardMaterial };

// 12. 艺术木偶人 (Mannequin)
export const mannequinFurniture = {
  type: 'mannequin',
  name: '艺术木偶',
  defaultSize: { width: 14, depth: 14, height: 68 }, // 约 1.70 米
  components: [
    { id: 'wood', label: '木质构件', defaultColor: '#f2f2f2' }
  ],
  build(registry, item, node, size) {
    const type = item.pose || 'stand';

    // 通体柔白木偶人材质
    const puppetMat = new BABYLON.StandardMaterial(`puppet_white_${item.id}`, registry.scene);
    puppetMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    puppetMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    puppetMat.emissiveColor = new BABYLON.Color3(0.08, 0.08, 0.08);
    puppetMat.maxSimultaneousLights = 16;

    // 清理旧节点，防止姿态切换时重叠
    node.getChildMeshes().forEach((m) => m.dispose());
    node.getChildTransformNodes().forEach((n) => n.dispose());

    const headD = 0.22;
    const bodyH = 0.60;
    const bodyD = 0.26;
    const legL = 0.42;
    const legD = 0.09;
    const armL = 0.42;
    const armD = 0.07;

    // 1. 头 (球体)与面部、头发
    const headY = type === 'sit' ? 0.71 : (type === 'lie' ? 0.10 : 1.55);
    const headZ = type === 'sit' ? 0 : (type === 'lie' ? 0.11 : 0);
    const head = BABYLON.MeshBuilder.CreateSphere(`puppet_head_${item.id}`, { diameter: headD, segments: 12 }, registry.scene);
    head.position.set(0, headY, headZ);
    head.material = puppetMat;
    head.parent = node;

    // 2. 身体 (圆柱)
    const bodyY = type === 'sit' ? 0.30 : (type === 'lie' ? 0.10 : 1.14);
    const bodyZ = type === 'sit' ? 0 : (type === 'lie' ? -0.30 : 0);
    const bodyRotX = type === 'sit' ? 0 : (type === 'lie' ? Math.PI / 2 : 0);
    const body = BABYLON.MeshBuilder.CreateCylinder(`puppet_body_${item.id}`, { diameterTop: bodyD, diameterBottom: bodyD, height: bodyH, tessellation: 12 }, registry.scene);
    body.position.set(0, bodyY, bodyZ);
    body.rotation.x = bodyRotX;
    body.material = puppetMat;
    body.parent = node;

    // 3. 肢体
    if (type === 'sit') {
      [-1, 1].forEach((side) => {
        // 大腿
        const thigh = BABYLON.MeshBuilder.CreateCylinder(`puppet_thigh_${side}_${item.id}`, { diameterTop: legD, diameterBottom: legD, height: legL, tessellation: 8 }, registry.scene);
        thigh.position.set(side * 0.08, 0.05, legL / 2);
        thigh.rotation.x = Math.PI / 2;
        thigh.material = puppetMat;
        thigh.parent = node;

        // 小腿
        const calf = BABYLON.MeshBuilder.CreateCylinder(`puppet_calf_${side}_${item.id}`, { diameterTop: legD, diameterBottom: legD, height: legL, tessellation: 8 }, registry.scene);
        calf.position.set(side * 0.08, -legL / 2, legL);
        calf.material = puppetMat;
        calf.parent = node;

        // 鞋子
        const shoe = BABYLON.MeshBuilder.CreateSphere(`puppet_shoe_${side}_${item.id}`, { diameter: legD * 1.3, segments: 8 }, registry.scene);
        shoe.position.set(side * 0.08, -legL, legL + 0.02);
        shoe.material = puppetMat;
        shoe.parent = node;

        // 手臂 (坐姿手臂)
        const arm = BABYLON.MeshBuilder.CreateCylinder(`puppet_arm_${side}_${item.id}`, { diameterTop: armD, diameterBottom: armD, height: armL, tessellation: 8 }, registry.scene);
        arm.position.set(side * 0.18, 0.40, armL / 2 * 0.3);
        arm.rotation.x = - Math.PI / 6;
        arm.material = puppetMat;
        arm.parent = node;

        // 手掌
        const hand = BABYLON.MeshBuilder.CreateSphere(`puppet_hand_${side}_${item.id}`, { diameter: armD * 1.2, segments: 8 }, registry.scene);
        hand.position.set(side * 0.18, 0.40 - (armL / 2) * Math.cos(Math.PI / 6), (armL / 2) * 0.3 + (armL / 2) * Math.sin(Math.PI / 6));
        hand.material = puppetMat;
        hand.parent = node;
      });
    } else if (type === 'lie') {
      [-1, 1].forEach((side) => {
        // 腿部 (长腿伸直)
        const leg = BABYLON.MeshBuilder.CreateCylinder(`puppet_leg_${side}_${item.id}`, { diameterTop: legD, diameterBottom: legD, height: legL * 2, tessellation: 8 }, registry.scene);
        leg.position.set(side * 0.08, 0.10, -0.10 - bodyH / 2 - legL);
        leg.rotation.x = Math.PI / 2;
        leg.material = puppetMat;
        leg.parent = node;

        // 鞋子
        const shoe = BABYLON.MeshBuilder.CreateSphere(`puppet_shoe_${side}_${item.id}`, { diameter: legD * 1.3, segments: 8 }, registry.scene);
        shoe.position.set(side * 0.08, 0.10, -0.10 - bodyH / 2 - legL * 2 - 0.02);
        shoe.material = puppetMat;
        shoe.parent = node;

        // 手臂 (躺着时平铺在两侧)
        const arm = BABYLON.MeshBuilder.CreateCylinder(`puppet_arm_${side}_${item.id}`, { diameterTop: armD, diameterBottom: armD, height: armL, tessellation: 8 }, registry.scene);
        arm.position.set(side * 0.18, 0.10, -0.10 - armL / 2);
        arm.rotation.x = Math.PI / 2;
        arm.material = puppetMat;
        arm.parent = node;

        // 手掌
        const hand = BABYLON.MeshBuilder.CreateSphere(`puppet_hand_${side}_${item.id}`, { diameter: armD * 1.2, segments: 8 }, registry.scene);
        hand.position.set(side * 0.18, 0.10, -0.10 - armL);
        hand.material = puppetMat;
        hand.parent = node;
      });
    } else {
      // stand 站姿
      [-1, 1].forEach((side) => {
        // 双腿伸直
        const leg = BABYLON.MeshBuilder.CreateCylinder(`puppet_leg_${side}_${item.id}`, { diameterTop: legD, diameterBottom: legD, height: legL * 2, tessellation: 8 }, registry.scene);
        leg.position.set(side * 0.08, legL, 0);
        leg.material = puppetMat;
        leg.parent = node;

        // 鞋子
        const shoe = BABYLON.MeshBuilder.CreateSphere(`puppet_shoe_${side}_${item.id}`, { diameter: legD * 1.3, segments: 8 }, registry.scene);
        shoe.position.set(side * 0.08, 0.02, 0.02);
        shoe.material = puppetMat;
        shoe.parent = node;

        // 手臂
        const arm = BABYLON.MeshBuilder.CreateCylinder(`puppet_arm_${side}_${item.id}`, { diameterTop: armD, diameterBottom: armD, height: armL, tessellation: 8 }, registry.scene);
        arm.position.set(side * 0.18, 1.13, 0);
        arm.material = puppetMat;
        arm.parent = node;

        // 手掌
        const hand = BABYLON.MeshBuilder.CreateSphere(`puppet_hand_${side}_${item.id}`, { diameter: armD * 1.2, segments: 8 }, registry.scene);
        hand.position.set(side * 0.18, 1.13 - armL / 2, 0);
        hand.material = puppetMat;
        hand.parent = node;
      });
    }
  }
};

// 13. 球形仙人掌 (Cactus)
export const cactusFurniture = {
  type: 'cactus',
  name: '球形仙人掌',
  defaultSize: { width: 14, depth: 14, height: 16 },
  components: [
    { id: 'cactus-body', label: '仙人掌球', defaultColor: '#4caf50' },
    { id: 'cactus-pot', label: '红陶小花盆', defaultColor: '#d7ccc8' },
    { id: 'cactus-flower', label: '顶部小红花', defaultColor: '#ff4081' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.38;
    const bodyD = size.width * 0.86;
    const flowerD = size.width * 0.22;

    cylinderComponent(registry, item, cactusFurniture, 'cactus-pot', {
      diameterTop: size.width * 0.86, diameterBottom: size.width * 0.72, height: potH, tessellation: 12
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    sphereComponent(registry, item, cactusFurniture, 'cactus-body', {
      diameter: bodyD, segments: 12
    }, { position: { x: 0, y: potH + bodyD / 2 - 0.01, z: 0 } }, { parent: node });

    sphereComponent(registry, item, cactusFurniture, 'cactus-flower', {
      diameter: flowerD, segments: 8
    }, { position: { x: 0, y: potH + bodyD - 0.02, z: 0 } }, { parent: node });
  }
};

// 14. 北欧龟背竹 (Monstera)
export const monsteraFurniture = {
  type: 'monstera',
  name: '北欧龟背竹',
  defaultSize: { width: 32, depth: 32, height: 48 },
  components: [
    { id: 'monstera-pot', label: '极简白瓷盆', defaultColor: '#eceff1' },
    { id: 'monstera-stem', label: '龟背竹叶茎', defaultColor: '#4caf50' },
    { id: 'monstera-leaf', label: '龟背竹叶片', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.25;
    const stemH = size.height * 0.75;

    cylinderComponent(registry, item, monsteraFurniture, 'monstera-pot', {
      diameterTop: size.width * 0.62, diameterBottom: size.width * 0.50, height: potH, tessellation: 16
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, monsteraFurniture, 'monstera-stem', {
      diameterTop: 0.012, diameterBottom: 0.016, height: stemH, tessellation: 8
    }, { position: { x: 0, y: potH + stemH / 2, z: 0 } }, { parent: node });

    const leafCount = 4;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / leafCount;
      const leafH = potH + stemH * (0.4 + i * 0.18);
      
      const subStem = cylinderComponent(registry, item, monsteraFurniture, 'monstera-stem', {
        diameterTop: 0.008, diameterBottom: 0.008, height: size.width * 0.38, tessellation: 6
      }, { position: { x: Math.cos(angle) * size.width * 0.12, y: leafH, z: Math.sin(angle) * size.width * 0.12 } }, { parent: node });
      subStem.rotation.z = Math.sin(angle) * 0.4;
      subStem.rotation.x = Math.cos(angle) * 0.4;

      const leaf = boxComponent(registry, item, monsteraFurniture, 'monstera-leaf', {
        width: size.width * 0.38, height: 0.008, depth: size.width * 0.44
      }, { position: { x: Math.cos(angle) * size.width * 0.3, y: leafH + 0.06, z: Math.sin(angle) * size.width * 0.3 } }, { parent: node });
      leaf.rotation.y = -angle;
      leaf.rotation.x = 0.25;
    }
  }
};

// 15. 多肉小盆栽 (Succulent)
export const succulentFurniture = {
  type: 'succulent',
  name: '多肉小盆栽',
  defaultSize: { width: 10, depth: 10, height: 10 },
  components: [
    { id: 'succulent-pot', label: '马卡龙矮盆', defaultColor: '#ffffff' },
    { id: 'succulent-leaves', label: '多肉饱满叶瓣', defaultColor: '#80cbc4' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.44;
    const leafSize = size.width * 0.24;

    cylinderComponent(registry, item, succulentFurniture, 'succulent-pot', {
      diameterTop: size.width * 0.94, diameterBottom: size.width * 0.84, height: potH, tessellation: 12
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const leafCount = 6;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / leafCount;
      const radius = size.width * 0.22;
      const leaf = sphereComponent(registry, item, succulentFurniture, 'succulent-leaves', {
        diameter: leafSize, segments: 8
      }, { position: { x: Math.cos(angle) * radius, y: potH + 0.01, z: Math.sin(angle) * radius } }, { parent: node });
      leaf.scaling.y = 0.6;
    }
    const centerLeaf = sphereComponent(registry, item, succulentFurniture, 'succulent-leaves', {
      diameter: leafSize * 0.8, segments: 8
    }, { position: { x: 0, y: potH + 0.02, z: 0 } }, { parent: node });
    centerLeaf.scaling.y = 0.8;
  }
};

// 16. 水培富贵竹 (Bamboo)
export const bambooFurniture = {
  type: 'bamboo',
  name: '水培富贵竹',
  defaultSize: { width: 16, depth: 16, height: 54 },
  components: [
    { id: 'bamboo-vase', label: '玻璃水培瓶', defaultColor: '#e0f7fa' },
    { id: 'bamboo-stem', label: '富贵竹青干', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    const vaseH = size.height * 0.35;
    const stemH = size.height * 0.94;

    cylinderComponent(registry, item, bambooFurniture, 'bamboo-vase', {
      diameterTop: size.width * 0.52, diameterBottom: size.width * 0.62, height: vaseH, tessellation: 16
    }, { position: { x: 0, y: vaseH / 2, z: 0 } }, { parent: node });

    const offsets = [
      { x: -0.015, z: -0.015, rx: 0.08, rz: -0.04, h: stemH },
      { x: 0.02, z: -0.01, rx: -0.06, rz: 0.06, h: stemH * 0.92 },
      { x: -0.005, z: 0.02, rx: 0.04, rz: -0.08, h: stemH * 0.86 }
    ];

    offsets.forEach((offset) => {
      const stem = cylinderComponent(registry, item, bambooFurniture, 'bamboo-stem', {
        diameterTop: 0.01, diameterBottom: 0.014, height: offset.h, tessellation: 8
      }, { position: { x: offset.x, y: offset.h / 2, z: offset.z } }, { parent: node });
      stem.rotation.x = offset.rx;
      stem.rotation.z = offset.rz;
    });
  }
};

// 17. 绿意垂耳蕨 (Fern)
export const fernFurniture = {
  type: 'fern',
  name: '绿意垂耳蕨',
  defaultSize: { width: 28, depth: 28, height: 26 },
  components: [
    { id: 'fern-pot', label: '红陶阔口盆', defaultColor: '#b0bec5' },
    { id: 'fern-leaves', label: '下垂羽状蕨叶', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.38;

    cylinderComponent(registry, item, fernFurniture, 'fern-pot', {
      diameterTop: size.width * 0.58, diameterBottom: size.width * 0.44, height: potH, tessellation: 12
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / leafCount;
      const leafL = size.width * 0.48;
      const leafW = size.width * 0.16;

      const leaf = boxComponent(registry, item, fernFurniture, 'fern-leaves', {
        width: leafW, height: 0.006, depth: leafL
      }, { position: { x: Math.cos(angle) * leafL * 0.38, y: potH + 0.02, z: Math.sin(angle) * leafL * 0.38 } }, { parent: node });
      
      leaf.rotation.y = -angle;
      leaf.rotation.x = 0.4;
    }
  }
};

// 18. 罗汉松古朴盆景 (Bonsai)
export const bonsaiFurniture = {
  type: 'bonsai',
  name: '古朴迎客松盆景',
  defaultSize: { width: 36, depth: 24, height: 32 },
  components: [
    { id: 'bonsai-pot', label: '紫砂长方浅盆', defaultColor: '#5d4037' },
    { id: 'bonsai-trunk', label: '苍劲曲折树干', defaultColor: '#3e2723' },
    { id: 'bonsai-leaves', label: '葱郁松针簇', defaultColor: '#004d40' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.18;

    boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
      width: size.width * 0.86, height: potH, depth: size.depth * 0.86
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const trunkH = size.height * 0.58;
    const trunk = cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: 0.016, diameterBottom: 0.026, height: trunkH, tessellation: 8
    }, { position: { x: -size.width * 0.1, y: potH + trunkH / 2 - 0.01, z: 0 } }, { parent: node });
    trunk.rotation.z = -0.38;

    const clusterPositions = [
      { x: size.width * 0.1, y: potH + trunkH - 0.01, z: 0, d: size.width * 0.38 },
      { x: size.width * 0.22, y: potH + trunkH * 0.86, z: size.depth * 0.15, d: size.width * 0.3 },
      { x: size.width * 0.18, y: potH + trunkH * 0.74, z: -size.depth * 0.15, d: size.width * 0.32 }
    ];

    clusterPositions.forEach((pos) => {
      sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
        diameter: pos.d, segments: 12
      }, { position: { x: pos.x, y: pos.y, z: pos.z } }, { parent: node });
    });
  }
};

// 19. 经典红玫瑰盆栽 (Rose Pot)
export const flowerRoseFurniture = {
  type: 'flower_rose',
  name: '红玫瑰陶瓷盆栽',
  defaultSize: { width: 18, depth: 18, height: 28 },
  components: [
    { id: 'rose-pot', label: '北欧浮雕白盆', defaultColor: '#f5f5f5' },
    { id: 'rose-stem', label: '带刺青绿枝条', defaultColor: '#2e7d32' },
    { id: 'rose-bloom', label: '娇艳红玫瑰花', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.28;
    const stemH = size.height * 0.58;

    cylinderComponent(registry, item, flowerRoseFurniture, 'rose-pot', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.58, height: potH, tessellation: 12
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, flowerRoseFurniture, 'rose-stem', {
      diameterTop: 0.008, diameterBottom: 0.012, height: stemH, tessellation: 6
    }, { position: { x: 0, y: potH + stemH / 2, z: 0 } }, { parent: node });

    const blooms = [
      { x: 0, y: potH + stemH, z: 0, d: size.width * 0.28 },
      { x: -size.width * 0.12, y: potH + stemH * 0.86, z: size.depth * 0.08, d: size.width * 0.24 },
      { x: size.width * 0.1, y: potH + stemH * 0.78, z: -size.depth * 0.1, d: size.width * 0.22 }
    ];

    blooms.forEach((bloom) => {
      if (bloom.x !== 0) {
        const subStem = cylinderComponent(registry, item, flowerRoseFurniture, 'rose-stem', {
          diameterTop: 0.006, diameterBottom: 0.006, height: size.width * 0.22, tessellation: 6
        }, { position: { x: bloom.x * 0.5, y: bloom.y - 0.02, z: bloom.z * 0.5 } }, { parent: node });
        subStem.rotation.z = bloom.x < 0 ? 0.6 : -0.6;
      }

      sphereComponent(registry, item, flowerRoseFurniture, 'rose-bloom', {
        diameter: bloom.d, segments: 10
      }, { position: { x: bloom.x, y: bloom.y, z: bloom.z } }, { parent: node });
    });
  }
};

// 20. 虎尾兰盆栽 (Snake Plant)
export const snakePlantFurniture = {
  type: 'snake_plant',
  name: '虎尾兰盆栽',
  defaultSize: { width: 16, depth: 16, height: 42 },
  components: [
    { id: 'snake-pot', label: '北欧水泥直筒盆', defaultColor: '#cfd8dc' },
    { id: 'snake-leaves', label: '挺拔虎纹剑叶', defaultColor: '#2d5a27' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.32;

    cylinderComponent(registry, item, snakePlantFurniture, 'snake-pot', {
      diameterTop: size.width * 0.84, diameterBottom: size.width * 0.84, height: potH, tessellation: 16
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const leaves = [
      { ry: 0, h: size.height * 0.64, w: size.width * 0.24, x: -size.width * 0.1, z: 0, rx: 0.1, rz: 0.05 },
      { ry: Math.PI * 0.4, h: size.height * 0.58, w: size.width * 0.22, x: size.width * 0.08, z: -size.width * 0.06, rx: -0.08, rz: -0.06 },
      { ry: Math.PI * 0.8, h: size.height * 0.68, w: size.width * 0.24, x: size.width * 0.05, z: size.width * 0.08, rx: 0.05, rz: -0.1 },
      { ry: Math.PI * 1.2, h: size.height * 0.52, w: size.width * 0.20, x: -size.width * 0.08, z: -size.width * 0.08, rx: -0.1, rz: 0.08 },
      { ry: Math.PI * 1.6, h: size.height * 0.48, w: size.width * 0.18, x: 0, z: -size.width * 0.1, rx: -0.05, rz: 0.05 }
    ];

    leaves.forEach((l) => {
      const leaf = boxComponent(registry, item, snakePlantFurniture, 'snake-leaves', {
        width: l.w, height: l.h, depth: size.width * 0.038
      }, { position: { x: l.x, y: potH + l.h / 2 - 0.02, z: l.z } }, { parent: node });
      
      leaf.rotation.y = l.ry;
      leaf.rotation.x = l.rx;
      leaf.rotation.z = l.rz;
    });
  }
};

// 21. 叠放书籍摆件 (Books Stack)
export const booksStackFurniture = {
  type: 'books_stack',
  name: '叠放书籍摆件',
  defaultSize: { width: 22, depth: 18, height: 10 },
  components: [
    { id: 'book-bottom', label: '底册经典红', defaultColor: '#c62828' },
    { id: 'book-mid', label: '中册学术蓝', defaultColor: '#1565c0' },
    { id: 'book-top', label: '顶册活力橙', defaultColor: '#ef6c00' }
  ],
  build(registry, item, node, size) {
    const bottomH = size.height * 0.35;
    const midH = size.height * 0.30;
    const topH = size.height * 0.25;

    boxComponent(registry, item, booksStackFurniture, 'book-bottom', {
      width: size.width * 0.94, height: bottomH, depth: size.depth * 0.94
    }, { position: { x: 0, y: bottomH / 2, z: 0 } }, { parent: node });

    const mid = boxComponent(registry, item, booksStackFurniture, 'book-mid', {
      width: size.width * 0.86, height: midH, depth: size.depth * 0.86
    }, { position: { x: size.width * 0.02, y: bottomH + midH / 2, z: -size.depth * 0.02 } }, { parent: node });
    mid.rotation.y = 0.26;

    const top = boxComponent(registry, item, booksStackFurniture, 'book-top', {
      width: size.width * 0.78, height: topH, depth: size.depth * 0.78
    }, { position: { x: -size.width * 0.02, y: bottomH + midH + topH / 2, z: size.depth * 0.01 } }, { parent: node });
    top.rotation.y = -0.35;
  }
};

// 22. 现代抽象雕塑摆件 (Sculpture)
export const sculptureFurniture = {
  type: 'sculpture',
  name: '现代抽象雕塑',
  defaultSize: { width: 16, depth: 16, height: 32 },
  components: [
    { id: 'sculpture-base', label: '爵士黑底座', defaultColor: '#212121' },
    { id: 'sculpture-body', label: '青铜抽象体', defaultColor: '#ffb300' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.22;
    const bodyH = size.height * 0.78;

    boxComponent(registry, item, sculptureFurniture, 'sculpture-base', {
      width: size.width * 0.78, height: baseH, depth: size.depth * 0.78
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyNode = cylinderComponent(registry, item, sculptureFurniture, 'sculpture-body', {
      diameterTop: size.width * 0.62, diameterBottom: size.width * 0.62, height: 0.03, tessellation: 24
    }, { position: { x: 0, y: baseH + bodyH * 0.46, z: 0 } }, { parent: node });
    bodyNode.rotation.x = Math.PI * 0.25;
    bodyNode.rotation.y = Math.PI * 0.12;

    sphereComponent(registry, item, sculptureFurniture, 'sculpture-body', {
      diameter: size.width * 0.32, segments: 12
    }, { position: { x: 0, y: baseH + bodyH * 0.46, z: 0 } }, { parent: node });
  }
};

// 23. 椭圆地毯 (Oval Rug)
export const ovalRugFurniture = {
  type: 'oval_rug',
  name: '椭圆地毯',
  defaultSize: { width: 60, depth: 84, height: 0.4 },
  components: [
    { id: 'fabric', label: '地毯织面', defaultColor: '#8fa6cc' }
  ],
  build(registry, item, node, size) {
    const rugThickness = 0.008;
    const mesh = cylinderComponent(registry, item, ovalRugFurniture, 'fabric', {
      diameterTop: 1, diameterBottom: 1, height: rugThickness, tessellation: 32
    }, { position: { x: 0, y: rugThickness / 2 + 0.002, z: 0 } }, { parent: node });
    mesh.scaling.x = size.width;
    mesh.scaling.z = size.depth;
  }
};

// 24. 圆角地毯 (Rounded Rug)
export const roundedRugFurniture = {
  type: 'rounded_rug',
  name: '圆角地毯',
  defaultSize: { width: 60, depth: 84, height: 0.4 },
  components: [
    { id: 'fabric', label: '地毯织面', defaultColor: '#cc8fa6' }
  ],
  build(registry, item, node, size) {
    const rugThickness = 0.008;
    const r = Math.min(size.width, size.depth) * 0.15;
    const w = size.width;
    const d = size.depth;
    const h = rugThickness;

    // 1. 横向主盒子
    boxComponent(registry, item, roundedRugFurniture, 'fabric', {
      width: w - 2 * r, height: h, depth: d
    }, { position: { x: 0, y: h / 2 + 0.002, z: 0 } }, { parent: node });

    // 2. 纵向横跨剩余的中间区域盒子
    boxComponent(registry, item, roundedRugFurniture, 'fabric', {
      width: w, height: h, depth: d - 2 * r
    }, { position: { x: 0, y: h / 2 + 0.002, z: 0 } }, { parent: node });

    // 3. 四个角的圆柱
    const corners = [
      { x: w / 2 - r, z: d / 2 - r },
      { x: -w / 2 + r, z: d / 2 - r },
      { x: w / 2 - r, z: -d / 2 + r },
      { x: -w / 2 + r, z: -d / 2 + r }
    ];
    corners.forEach(pos => {
      cylinderComponent(registry, item, roundedRugFurniture, 'fabric', {
        diameterTop: 2 * r, diameterBottom: 2 * r, height: h, tessellation: 16
      }, { position: { x: pos.x, y: h / 2 + 0.002, z: pos.z } }, { parent: node });
    });
  }
};

// 25. 超薄液晶电视 (Television)
export const tvFurniture = {
  type: 'tv',
  name: '超薄电视机',
  defaultSize: { width: 48, depth: 10, height: 30 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#1c1d1f' },
    { id: 'screen', label: '屏幕', defaultColor: '#2d3033' },
    { id: 'stand', label: '支架底座', defaultColor: '#cfd4d9' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, tvFurniture, 'stand', {
      width: size.width * 0.4, height: 0.015, depth: size.depth
    }, { position: { x: 0, y: 0.0075, z: 0 } }, { parent: node });

    boxComponent(registry, item, tvFurniture, 'stand', {
      width: size.width * 0.08, height: size.height * 0.15, depth: 0.03
    }, { position: { x: 0, y: size.height * 0.08, z: 0 } }, { parent: node });

    boxComponent(registry, item, tvFurniture, 'body', {
      width: size.width, height: size.height * 0.85, depth: 0.04
    }, { position: { x: 0, y: size.height * 0.575, z: 0 } }, { parent: node });

    boxComponent(registry, item, tvFurniture, 'screen', {
      width: size.width * 0.96, height: size.height * 0.8, depth: 0.01
    }, { position: { x: 0, y: size.height * 0.575, z: 0.021 } }, { parent: node });
  }
};

// 26. 一体工作电脑 (Computer)
export const computerFurniture = {
  type: 'computer',
  name: '一体电脑',
  defaultSize: { width: 24, depth: 8, height: 18 },
  components: [
    { id: 'body', label: '机身支架', defaultColor: '#e3e8eb' },
    { id: 'screen', label: '显示屏', defaultColor: '#1e2530' },
    { id: 'keyboard', label: '键盘', defaultColor: '#282c34' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, computerFurniture, 'body', {
      width: size.width * 0.3, height: 0.008, depth: size.depth * 0.5
    }, { position: { x: 0, y: 0.004, z: 0 } }, { parent: node });

    const pole = boxComponent(registry, item, computerFurniture, 'body', {
      width: size.width * 0.1, height: size.height * 0.45, depth: 0.02
    }, { position: { x: 0, y: size.height * 0.22, z: -size.depth * 0.08 } }, { parent: node });
    pole.rotation.x = -Math.PI * 0.08;

    boxComponent(registry, item, computerFurniture, 'body', {
      width: size.width, height: size.height * 0.65, depth: 0.03
    }, { position: { x: 0, y: size.height * 0.65, z: 0 } }, { parent: node });

    boxComponent(registry, item, computerFurniture, 'screen', {
      width: size.width * 0.95, height: size.height * 0.6, depth: 0.006
    }, { position: { x: 0, y: size.height * 0.65, z: 0.013 } }, { parent: node });

    boxComponent(registry, item, computerFurniture, 'keyboard', {
      width: size.width * 0.65, height: 0.01, depth: size.depth * 0.35
    }, { position: { x: 0, y: 0.005, z: size.depth * 0.3 } }, { parent: node });
  }
};

// 27. 现代三联挂画 (Triptych Painting)
export const triptychPaintingFurniture = {
  type: 'triptych_painting',
  name: '现代三联画',
  defaultSize: { width: 60, depth: 1.5, height: 30 },
  placeType: 'wall',
  components: [
    { id: 'frame', label: '画框', defaultColor: '#000000' },
    { id: 'canvas1', label: '画布1', defaultColor: '#ffcc00' },
    { id: 'canvas2', label: '画布2', defaultColor: '#0066cc' },
    { id: 'canvas3', label: '画布3', defaultColor: '#cc3333' }
  ],
  build(registry, item, node, size) {
    const singleW = (size.width - 0.1) / 3;
    const gap = 0.05;

    boxComponent(registry, item, triptychPaintingFurniture, 'frame', {
      width: singleW, height: size.height, depth: size.depth
    }, { position: { x: -singleW - gap, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, triptychPaintingFurniture, 'canvas1', {
      width: singleW - 0.04, height: size.height - 0.04, depth: size.depth + 0.005
    }, { position: { x: -singleW - gap, y: size.height / 2, z: 0.003 } }, { parent: node });

    boxComponent(registry, item, triptychPaintingFurniture, 'frame', {
      width: singleW, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, triptychPaintingFurniture, 'canvas2', {
      width: singleW - 0.04, height: size.height - 0.04, depth: size.depth + 0.005
    }, { position: { x: 0, y: size.height / 2, z: 0.003 } }, { parent: node });

    boxComponent(registry, item, triptychPaintingFurniture, 'frame', {
      width: singleW, height: size.height, depth: size.depth
    }, { position: { x: singleW + gap, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, triptychPaintingFurniture, 'canvas3', {
      width: singleW - 0.04, height: size.height - 0.04, depth: size.depth + 0.005
    }, { position: { x: singleW + gap, y: size.height / 2, z: 0.003 } }, { parent: node });
  }
};

// 28. 横版山水水墨画 (Landscape Painting)
export const landscapePaintingFurniture = {
  type: 'landscape_painting',
  name: '横版山水画',
  defaultSize: { width: 72, depth: 1.5, height: 24 },
  placeType: 'wall',
  components: [
    { id: 'frame', label: '红木画框', defaultColor: '#3d2314' },
    { id: 'canvas', label: '水墨画布', defaultColor: '#eaeaea' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, landscapePaintingFurniture, 'frame', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapePaintingFurniture, 'canvas', {
      width: size.width - 0.08, height: size.height - 0.08, depth: size.depth + 0.005
    }, { position: { x: 0, y: size.height / 2, z: 0.003 } }, { parent: node });
  }
};

// 29. 家用投影仪 (Projector)
export const projectorFurniture = {
  type: 'projector',
  name: '家用投影仪',
  defaultSize: { width: 10, depth: 10, height: 4 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#f5f5f5' },
    { id: 'lens', label: '镜头镜片', defaultColor: '#1e88e5' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, projectorFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, projectorFurniture, 'lens', {
      diameterTop: size.height * 0.5, diameterBottom: size.height * 0.5, height: 0.015
    }, { position: { x: size.width * 0.25, y: size.height / 2, z: size.depth / 2 + 0.005 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('lens')) {
        m.rotation.x = Math.PI * 0.5;
      }
    });
  }
};

// 30. 游戏主机与手柄 (Game Console)
export const gameConsoleFurniture = {
  type: 'game_console',
  name: '游戏主机',
  defaultSize: { width: 12, depth: 10, height: 8 },
  components: [
    { id: 'console', label: '主机', defaultColor: '#fafafa' },
    { id: 'accent', label: '装饰光条', defaultColor: '#2979ff' },
    { id: 'controller', label: '手柄', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, gameConsoleFurniture, 'console', {
      width: size.width * 0.24, height: size.height, depth: size.depth
    }, { position: { x: -size.width * 0.2, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, gameConsoleFurniture, 'accent', {
      width: size.width * 0.02, height: size.height * 0.9, depth: size.depth * 0.96
    }, { position: { x: -size.width * 0.2, y: size.height / 2, z: size.depth * 0.03 } }, { parent: node });

    boxComponent(registry, item, gameConsoleFurniture, 'controller', {
      width: size.width * 0.4, height: 0.015, depth: size.depth * 0.35
    }, { position: { x: size.width * 0.25, y: 0.0075, z: size.depth * 0.1 } }, { parent: node });
  }
};

// 31. 圆柱智能音箱 (Smart Speaker)
export const smartSpeakerFurniture = {
  type: 'smart_speaker',
  name: '智能音箱',
  defaultSize: { width: 5, depth: 5, height: 8 },
  components: [
    { id: 'body', label: '网布机身', defaultColor: '#37474f' },
    { id: 'top', label: '触控顶盖', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, smartSpeakerFurniture, 'body', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height * 0.92
    }, { position: { x: 0, y: size.height * 0.46, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, smartSpeakerFurniture, 'top', {
      diameterTop: size.width * 0.98, diameterBottom: size.width * 0.98, height: size.height * 0.08
    }, { position: { x: 0, y: size.height * 0.96, z: 0 } }, { parent: node });
  }
};

// 32. 落地复古电风扇 (Electric Fan)
export const electricFanFurniture = {
  type: 'electric_fan',
  name: '复古电风扇',
  defaultSize: { width: 16, depth: 16, height: 42 },
  components: [
    { id: 'base', label: '底座', defaultColor: '#004d40' },
    { id: 'pole', label: '中立柱', defaultColor: '#b2dfdb' },
    { id: 'blade', label: '扇叶护罩', defaultColor: '#00796b' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, electricFanFurniture, 'base', {
      diameterTop: size.width * 0.7, diameterBottom: size.width * 0.8, height: size.height * 0.05
    }, { position: { x: 0, y: size.height * 0.025, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, electricFanFurniture, 'pole', {
      diameterTop: 0.025, diameterBottom: 0.025, height: size.height * 0.65
    }, { position: { x: 0, y: size.height * 0.35, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, electricFanFurniture, 'blade', {
      diameterTop: size.width * 0.95, diameterBottom: size.width * 0.95, height: size.depth * 0.28
    }, { position: { x: 0, y: size.height * 0.76, z: 0 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('blade')) {
        m.rotation.x = Math.PI * 0.5;
      }
    });
  }
};

// 33. 超声波香薰机 (Aroma Diffuser)
export const aromaDiffuserFurniture = {
  type: 'aroma_diffuser',
  name: '香薰机',
  defaultSize: { width: 6, depth: 6, height: 8 },
  components: [
    { id: 'body', label: 'PP磨砂壳', defaultColor: '#fcfcfc' },
    { id: 'base', label: '原木底环', defaultColor: '#bcaaa4' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, aromaDiffuserFurniture, 'base', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height * 0.12
    }, { position: { x: 0, y: size.height * 0.06, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, aromaDiffuserFurniture, 'body', {
      diameterTop: size.width * 0.82, diameterBottom: size.width, height: size.height * 0.88
    }, { position: { x: 0, y: size.height * 0.56, z: 0 } }, { parent: node });
  }
};

// 34. 简约纸巾盒 (Tissue Box)
export const tissueBoxFurniture = {
  type: 'tissue_box',
  name: '纸巾盒',
  defaultSize: { width: 8, depth: 5, height: 4 },
  components: [
    { id: 'box', label: '盒身', defaultColor: '#ffffff' },
    { id: 'lid', label: '木盖板', defaultColor: '#d7ccc8' },
    { id: 'paper', label: '抽纸巾', defaultColor: '#fbfbfb' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, tissueBoxFurniture, 'box', {
      width: size.width, height: size.height * 0.88, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.44, z: 0 } }, { parent: node });

    boxComponent(registry, item, tissueBoxFurniture, 'lid', {
      width: size.width - 0.01, height: size.height * 0.12, depth: size.depth - 0.01
    }, { position: { x: 0, y: size.height * 0.94, z: 0 } }, { parent: node });

    boxComponent(registry, item, tissueBoxFurniture, 'paper', {
      width: size.width * 0.35, height: 0.02, depth: size.depth * 0.15
    }, { position: { x: 0, y: size.height * 1.01, z: 0 } }, { parent: node });
  }
};

// 35. 圆盘静音挂钟 (Wall Clock)
export const wallClockFurniture = {
  type: 'wall_clock',
  name: '静音挂钟',
  defaultSize: { width: 12, depth: 1.5, height: 12 },
  placeType: 'wall',
  components: [
    { id: 'frame', label: '外框环', defaultColor: '#212121' },
    { id: 'dial', label: '表盘指针', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, wallClockFurniture, 'frame', {
      diameterTop: size.width, diameterBottom: size.width, height: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, wallClockFurniture, 'dial', {
      diameterTop: size.width * 0.9, diameterBottom: size.width * 0.9, height: size.depth + 0.005
    }, { position: { x: 0, y: size.height / 2, z: 0.002 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      m.rotation.x = Math.PI * 0.5;
    });
  }
};

// 36. 向日葵陶土盆栽 (Sunflower Pot)
export const sunflowerPotFurniture = {
  type: 'sunflower_pot',
  name: '向日葵盆栽',
  defaultSize: { width: 16, depth: 16, height: 36 },
  components: [
    { id: 'pot', label: '陶土花盆', defaultColor: '#c37960' },
    { id: 'stem', label: '花茎绿叶', defaultColor: '#4c9f50' },
    { id: 'flower', label: '金黄花瓣', defaultColor: '#ffd700' },
    { id: 'center', label: '向日葵花盘', defaultColor: '#5c4033' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, sunflowerPotFurniture, 'pot', {
      diameterTop: size.width * 0.45, diameterBottom: size.width * 0.35, height: size.height * 0.28
    }, { position: { x: 0, y: size.height * 0.14, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, sunflowerPotFurniture, 'stem', {
      diameterTop: 0.02, diameterBottom: 0.02, height: size.height * 0.55
    }, { position: { x: 0, y: size.height * 0.55, z: 0 } }, { parent: node });

    const flowerD = size.width * 0.8;
    cylinderComponent(registry, item, sunflowerPotFurniture, 'flower', {
      diameterTop: flowerD, diameterBottom: flowerD, height: 0.02
    }, { position: { x: 0, y: size.height * 0.88, z: size.depth * 0.08 } }, { parent: node });

    const coreD = size.width * 0.35;
    cylinderComponent(registry, item, sunflowerPotFurniture, 'center', {
      diameterTop: coreD, diameterBottom: coreD, height: 0.025
    }, { position: { x: 0, y: size.height * 0.88, z: size.depth * 0.095 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.endsWith('_flower') || m.name.endsWith('_center')) {
        m.rotation.x = Math.PI * 0.42;
      }
    });
  }
};

// 37. 发财树招财盆景 (Pachira Tree)
export const pachiraTreeFurniture = {
  type: 'pachira_tree',
  name: '发财树盆景',
  defaultSize: { width: 24, depth: 24, height: 60 },
  components: [
    { id: 'pot', label: '艺术瓷盆', defaultColor: '#ffffff' },
    { id: 'trunk', label: '编织树干', defaultColor: '#8b4513' },
    { id: 'leaves', label: '招财绿叶', defaultColor: '#2e8b57' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, pachiraTreeFurniture, 'pot', {
      diameterTop: size.width * 0.55, diameterBottom: size.width * 0.4, height: size.height * 0.22
    }, { position: { x: 0, y: size.height * 0.11, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, pachiraTreeFurniture, 'trunk', {
      diameterTop: 0.05, diameterBottom: 0.07, height: size.height * 0.55
    }, { position: { x: 0, y: size.height * 0.42, z: 0 } }, { parent: node });

    const leafS = size.width * 0.45;
    sphereComponent(registry, item, pachiraTreeFurniture, 'leaves', {
      diameterX: leafS, diameterY: leafS * 0.85, diameterZ: leafS
    }, { position: { x: 0, y: size.height * 0.72, z: 0 } }, { parent: node });

    sphereComponent(registry, item, pachiraTreeFurniture, 'leaves', {
      diameterX: leafS * 0.85, diameterY: leafS * 0.75, diameterZ: leafS * 0.85
    }, { position: { x: -size.width * 0.18, y: size.height * 0.82, z: size.depth * 0.08 } }, { parent: node });

    sphereComponent(registry, item, pachiraTreeFurniture, 'leaves', {
      diameterX: leafS * 0.85, diameterY: leafS * 0.75, diameterZ: leafS * 0.85
    }, { position: { x: size.width * 0.18, y: size.height * 0.82, z: -size.depth * 0.08 } }, { parent: node });
  }
};

// 38. 浪漫薰衣草花盆 (Lavender Pot)
export const lavenderPotFurniture = {
  type: 'lavender_pot',
  name: '薰衣草花盆',
  defaultSize: { width: 12, depth: 12, height: 20 },
  components: [
    { id: 'pot', label: '素烧盆', defaultColor: '#e0dcd3' },
    { id: 'stem', label: '草底', defaultColor: '#43a047' },
    { id: 'flower', label: '薰衣草紫', defaultColor: '#ba68c8' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, lavenderPotFurniture, 'pot', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.35, height: size.height * 0.35
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, lavenderPotFurniture, 'stem', {
      diameterTop: size.width * 0.65, diameterBottom: size.width * 0.45, height: size.height * 0.28
    }, { position: { x: 0, y: size.height * 0.45, z: 0 } }, { parent: node });

    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      cylinderComponent(registry, item, lavenderPotFurniture, 'flower', {
        diameterTop: 0.015, diameterBottom: 0.015, height: size.height * 0.4
      }, { position: { x: i * 0.035, y: size.height * 0.75, z: (i % 2 === 0 ? 0.02 : -0.02) } }, { parent: node });
    }
  }
};

// 39. 高雅郁金香花瓶 (Tulip Vase)
export const tulipVaseFurniture = {
  type: 'tulip_vase',
  name: '郁金香花瓶',
  defaultSize: { width: 10, depth: 10, height: 24 },
  components: [
    { id: 'glass', label: '磨砂花瓶', defaultColor: '#ffffff' },
    { id: 'stem', label: '花梗', defaultColor: '#81c784' },
    { id: 'flower', label: '郁金香粉', defaultColor: '#f48fb1' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, tulipVaseFurniture, 'glass', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.45, height: size.height * 0.48
    }, { position: { x: 0, y: size.height * 0.24, z: 0 } }, { parent: node });

    const offsets = [
      { x: -0.04, y: 0.65, z: 0.02, rx: -0.15, ry: 0 },
      { x: 0.04, y: 0.68, z: -0.02, rx: 0.15, ry: 0.2 },
      { x: 0, y: 0.75, z: 0, rx: 0, ry: 0 }
    ];

    offsets.forEach(off => {
      const st = cylinderComponent(registry, item, tulipVaseFurniture, 'stem', {
        diameterTop: 0.012, diameterBottom: 0.012, height: size.height * 0.45
      }, { position: { x: off.x, y: size.height * 0.48, z: off.z } }, { parent: node });
      st.rotation.x = off.rx;

      const fl = sphereComponent(registry, item, tulipVaseFurniture, 'flower', {
        diameterX: 0.06, diameterY: 0.08, diameterZ: 0.06
      }, { position: { x: off.x * 1.5, y: size.height * 0.88, z: off.z * 1.5 } }, { parent: node });
      fl.rotation.x = off.rx;
    });
  }
};

// 40. 名贵蝴蝶兰盆栽 (Orchid Pot)
export const orchidPotFurniture = {
  type: 'orchid_pot',
  name: '蝴蝶兰盆栽',
  defaultSize: { width: 16, depth: 16, height: 28 },
  components: [
    { id: 'pot', label: '紫砂花盆', defaultColor: '#8d6e63' },
    { id: 'stem', label: '蝴蝶兰枝干', defaultColor: '#4caf50' },
    { id: 'flower', label: '玫红花瓣', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, orchidPotFurniture, 'pot', {
      diameterTop: size.width * 0.55, diameterBottom: size.width * 0.4, height: size.height * 0.3
    }, { position: { x: 0, y: size.height * 0.15, z: 0 } }, { parent: node });

    const branch = boxComponent(registry, item, orchidPotFurniture, 'stem', {
      width: 0.02, height: size.height * 0.55, depth: size.depth * 0.35
    }, { position: { x: -size.width * 0.05, y: size.height * 0.52, z: 0 } }, { parent: node });
    branch.rotation.z = Math.PI * 0.12;

    for (let i = 0; i < 4; i++) {
      sphereComponent(registry, item, orchidPotFurniture, 'flower', {
        diameterX: 0.07, diameterY: 0.06, diameterZ: 0.07
      }, { position: { x: i * 0.045 - size.width * 0.05, y: size.height * 0.48 + i * 0.06, z: (i % 2 === 0 ? 0.03 : -0.03) } }, { parent: node });
    }
  }
};

// 41. 矮生龟背竹 (Dwarf Monstera)
export const dwarfMonsteraFurniture = {
  type: 'dwarf_monstera',
  name: '矮生龟背竹',
  defaultSize: { width: 20, depth: 20, height: 24 },
  components: [
    { id: 'pot', label: '水泥花盆', defaultColor: '#cfd8dc' },
    { id: 'leaves', label: '龟背叶片', defaultColor: '#388e3c' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, dwarfMonsteraFurniture, 'pot', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.4, height: size.height * 0.35
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    angles.forEach((ang, idx) => {
      const leaf = boxComponent(registry, item, dwarfMonsteraFurniture, 'leaves', {
        width: size.width * 0.4, height: 0.01, depth: size.depth * 0.35
      }, { position: { x: Math.sin(ang) * 0.18, y: size.height * 0.58 + idx * 0.02, z: Math.cos(ang) * 0.18 } }, { parent: node });
      leaf.rotation.y = ang;
      leaf.rotation.x = Math.PI * 0.12;
    });
  }
};

// 42. 北欧仙人掌立柱 (Large Cactus)
export const largeCactusFurniture = {
  type: 'large_cactus',
  name: '立柱仙人掌',
  defaultSize: { width: 14, depth: 14, height: 48 },
  components: [
    { id: 'pot', label: '陶罐盆', defaultColor: '#bcaaa4' },
    { id: 'body', label: '多浆茎杆', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, largeCactusFurniture, 'pot', {
      diameterTop: size.width * 0.52, diameterBottom: size.width * 0.4, height: size.height * 0.22
    }, { position: { x: 0, y: size.height * 0.11, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.09, diameterBottom: 0.09, height: size.height * 0.72
    }, { position: { x: 0, y: size.height * 0.55, z: 0 } }, { parent: node });

    const side1 = cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.05, diameterBottom: 0.05, height: size.height * 0.25
    }, { position: { x: size.width * 0.18, y: size.height * 0.62, z: 0 } }, { parent: node });
    side1.rotation.z = Math.PI * 0.12;

    const side2 = cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.05, diameterBottom: 0.05, height: size.height * 0.2
    }, { position: { x: -size.width * 0.16, y: size.height * 0.5, z: size.depth * 0.05 } }, { parent: node });
    side2.rotation.z = -Math.PI * 0.12;
  }
};

// 43. 尤加利水培花瓶 (Eucalyptus Vase)
export const eucalyptusVaseFurniture = {
  type: 'eucalyptus_vase',
  name: '尤加利花瓶',
  defaultSize: { width: 12, depth: 12, height: 32 },
  components: [
    { id: 'glass', label: '水培瓶', defaultColor: '#80deea' },
    { id: 'leaves', label: '尤加利圆叶', defaultColor: '#546e7a' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, eucalyptusVaseFurniture, 'glass', {
      diameterTop: size.width * 0.3, diameterBottom: size.width * 0.45, height: size.height * 0.35
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    for (let c = -1; c <= 1; c += 2) {
      const stem = cylinderComponent(registry, item, eucalyptusVaseFurniture, 'leaves', {
        diameterTop: 0.01, diameterBottom: 0.015, height: size.height * 0.7
      }, { position: { x: c * 0.04, y: size.height * 0.5, z: 0 } }, { parent: node });
      stem.rotation.z = c * Math.PI * 0.08;

      for (let l = 0; l < 5; l++) {
        sphereComponent(registry, item, eucalyptusVaseFurniture, 'leaves', {
          diameterX: 0.07, diameterY: 0.01, diameterZ: 0.07
        }, { position: { x: c * (0.04 + l * 0.035), y: size.height * 0.45 + l * 0.08, z: (l % 2 === 0 ? 0.015 : -0.015) } }, { parent: node });
      }
    }
  }
};

// 44. 盛开樱花盆景 (Cherry Blossom Bonsai)
export const cherryBlossomBonsaiFurniture = {
  type: 'cherry_blossom_bonsai',
  name: '樱花盆景',
  defaultSize: { width: 18, depth: 18, height: 26 },
  components: [
    { id: 'pot', label: '釉面盆', defaultColor: '#e0f7fa' },
    { id: 'trunk', label: '苍劲树桩', defaultColor: '#5d4037' },
    { id: 'flower', label: '樱花丛', defaultColor: '#ff8a80' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, cherryBlossomBonsaiFurniture, 'pot', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.5, height: size.height * 0.2
    }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });

    const tr = cylinderComponent(registry, item, cherryBlossomBonsaiFurniture, 'trunk', {
      diameterTop: 0.035, diameterBottom: 0.055, height: size.height * 0.5
    }, { position: { x: -size.width * 0.08, y: size.height * 0.32, z: 0 } }, { parent: node });
    tr.rotation.z = Math.PI * 0.15;

    sphereComponent(registry, item, cherryBlossomBonsaiFurniture, 'flower', {
      diameterX: size.width * 0.42, diameterY: size.width * 0.35, diameterZ: size.width * 0.42
    }, { position: { x: size.width * 0.15, y: size.height * 0.62, z: 0.03 } }, { parent: node });

    sphereComponent(registry, item, cherryBlossomBonsaiFurniture, 'flower', {
      diameterX: size.width * 0.32, diameterY: size.width * 0.28, diameterZ: size.width * 0.32
    }, { position: { x: -size.width * 0.15, y: size.height * 0.52, z: -0.03 } }, { parent: node });
  }
};

// 45. 挂墙吊兰常春藤 (Hanging Ivy)
export const hangingIvyFurniture = {
  type: 'hanging_ivy',
  name: '挂墙吊兰',
  defaultSize: { width: 16, depth: 10, height: 24 },
  placeType: 'wall',
  components: [
    { id: 'pot', label: '壁挂篮', defaultColor: '#d7ccc8' },
    { id: 'leaves', label: '垂吊绿藤', defaultColor: '#4caf50' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, hangingIvyFurniture, 'pot', {
      width: size.width * 0.48, height: size.height * 0.2, depth: size.depth * 0.45
    }, { position: { x: 0, y: size.height * 0.7, z: size.depth * 0.2 } }, { parent: node });

    for (let c = -1; c <= 1; c++) {
      boxComponent(registry, item, hangingIvyFurniture, 'leaves', {
        width: size.width * 0.1, height: size.height * 0.55 - Math.abs(c) * 0.08, depth: 0.015
      }, { position: { x: c * size.width * 0.14, y: size.height * 0.35, z: size.depth * 0.3 } }, { parent: node });
    }
  }
};

// 46. 简约单开帘 (single_blackout_curtain)
export const singleBlackoutCurtainFurniture = {
  type: 'single_blackout_curtain',
  name: '简约单开帘',
  defaultSize: { width: 48, depth: 3, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '窗帘轨杆', defaultColor: '#424242' },
    { id: 'fabric', label: '侧拉单开帘', defaultColor: '#78909c' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.03;
    cylinderComponent(registry, item, singleBlackoutCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const fabricH = size.height - rodH;

    const proxy = boxComponent(registry, item, singleBlackoutCurtainFurniture, 'fabric', {
      width: size.width * 0.94, height: fabricH, depth: 0.012
    }, { position: { x: 0, y: fabricH / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, singleBlackoutCurtainFurniture, 'fabric', {
        width: size.width * 0.22, height: fabricH, depth: size.depth * 0.6
      }, { position: { x: -size.width * 0.35, y: fabricH / 2, z: size.depth * 0.2 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 47. 轻奢双开纱帘 (double_sheer_curtain)
export const doubleSheerCurtainFurniture = {
  type: 'double_sheer_curtain',
  name: '轻奢双开纱帘',
  defaultSize: { width: 48, depth: 2, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '金属吊轨', defaultColor: '#bcaaa4' },
    { id: 'sheer', label: '白色半透纱帘', defaultColor: '#f5f5f5' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.024;
    cylinderComponent(registry, item, doubleSheerCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const fabricH = size.height - rodH;

    const proxy = boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
      width: size.width * 0.92, height: fabricH, depth: 0.008
    }, { position: { x: 0, y: fabricH / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.15, height: fabricH, depth: 0.008
      }, { position: { x: -size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });

      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.15, height: fabricH, depth: 0.008
      }, { position: { x: size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });
    } else {
      proxy.visibility = 0.001; // 透明代理
      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.46, height: fabricH, depth: 0.008
      }, { position: { x: -size.width * 0.24, y: fabricH / 2, z: 0.012 } }, { parent: node });

      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.46, height: fabricH, depth: 0.008
      }, { position: { x: size.width * 0.24, y: fabricH / 2, z: 0.012 } }, { parent: node });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 48. 百叶折帘 (venetian_blind)
export const venetianBlindFurniture = {
  type: 'venetian_blind',
  name: '百叶折帘',
  defaultSize: { width: 36, depth: 2, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'box', label: '百叶卷盒', defaultColor: '#cfd8dc' },
    { id: 'slats', label: '铝合金叶片', defaultColor: '#eceff1' },
    { id: 'string', label: '控制拉绳', defaultColor: '#78909c' }
  ],
  build(registry, item, node, size) {
    const boxH = size.height * 0.08;
    boxComponent(registry, item, venetianBlindFurniture, 'box', {
      width: size.width, height: boxH, depth: size.depth
    }, { position: { x: 0, y: size.height - boxH / 2, z: 0 } }, { parent: node });

    const open = item.isOn !== false;
    const availH = size.height - boxH;

    // 始终生成一个不可见但起支撑作用的百叶窗帘满尺寸代理盒，锁定 BoundingBox 选中范围
    const proxy = boxComponent(registry, item, venetianBlindFurniture, 'slats', {
      width: size.width, height: availH, depth: size.depth
    }, { position: { x: 0, y: availH / 2, z: 0 } }, { parent: node });
    proxy.visibility = 0.001;

    if (open) {
      for (let i = 0; i < 2; i++) {
        boxComponent(registry, item, venetianBlindFurniture, 'slats', {
          width: size.width * 0.98, height: 0.012, depth: size.depth * 0.8
        }, { position: { x: 0, y: size.height - boxH - i * 0.02, z: 0.005 } }, { parent: node });
      }
    } else {
      for (let i = 0; i < 5; i++) {
        boxComponent(registry, item, venetianBlindFurniture, 'slats', {
          width: size.width * 0.98, height: 0.012, depth: size.depth * 0.8
        }, { position: { x: 0, y: availH - i * (availH / 4) + 0.01, z: 0.005 } }, { parent: node });
      }
    }

    cylinderComponent(registry, item, venetianBlindFurniture, 'string', {
      diameterTop: 0.006, diameterBottom: 0.006, height: size.height * (open ? 0.3 : 0.65)
    }, { position: { x: size.width * 0.44, y: size.height - boxH - (size.height * (open ? 0.3 : 0.65)) / 2, z: size.depth * 0.2 } }, { parent: node });

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 49. 防晒卷帘 (roller_blind)
export const rollerBlindFurniture = {
  type: 'roller_blind',
  name: '防晒卷帘',
  defaultSize: { width: 36, depth: 2, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '顶卷轴', defaultColor: '#37474f' },
    { id: 'shade', label: '卷缩遮阳布', defaultColor: '#b0bec5' }
  ],
  build(registry, item, node, size) {
    const rodD = 0.04;
    cylinderComponent(registry, item, rollerBlindFurniture, 'rod', {
      diameterTop: rodD, diameterBottom: rodD, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodD / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, rollerBlindFurniture, 'shade', {
      width: size.width * 0.96, height: size.height - rodD, depth: 0.006
    }, { position: { x: 0, y: (size.height - rodD) / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      const shadeH = size.height * 0.12;
      boxComponent(registry, item, rollerBlindFurniture, 'shade', {
        width: size.width * 0.96, height: shadeH, depth: 0.006
      }, { position: { x: 0, y: size.height - rodD - shadeH / 2, z: 0.012 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 50. 罗马折叠帘 (roman_shade)
export const romanShadeFurniture = {
  type: 'roman_shade',
  name: '罗马折叠帘',
  defaultSize: { width: 36, depth: 2, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'fabric', label: '亚麻折叠帘布', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, romanShadeFurniture, 'fabric', {
      width: size.width, height: size.height, depth: size.depth * 0.3
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, romanShadeFurniture, 'fabric', {
        width: size.width, height: size.height * 0.25, depth: size.depth * 0.5
      }, { position: { x: 0, y: size.height - (size.height * 0.25) / 2, z: 0.005 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 51. 垂直百叶帘 (vertical_blind)
export const verticalBlindFurniture = {
  type: 'vertical_blind',
  name: '垂直百叶帘',
  defaultSize: { width: 48, depth: 2, height: 60 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rail', label: '顶部挂轨', defaultColor: '#78909c' },
    { id: 'slats', label: '垂直挂叶', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const railH = size.height * 0.05;
    boxComponent(registry, item, verticalBlindFurniture, 'rail', {
      width: size.width, height: railH, depth: size.depth
    }, { position: { x: 0, y: size.height - railH / 2, z: 0 } }, { parent: node });

    const open = item.isOn !== false;
    const slatW = size.width * 0.14;
    const slatH = size.height - railH;
    const angle = open ? Math.PI * 0.5 : Math.PI * 0.08;

    for (let i = 0; i < 6; i++) {
      const xPos = -size.width * 0.42 + i * (size.width * 0.168);
      const slat = boxComponent(registry, item, verticalBlindFurniture, 'slats', {
        width: slatW, height: slatH, depth: 0.006
      }, { position: { x: xPos, y: slatH / 2, z: 0.01 } }, { parent: node });
      slat.rotation.y = angle;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 52. 中式竹挂帘 (chinese_bamboo_blind)
export const chineseBambooBlindFurniture = {
  type: 'chinese_bamboo_blind',
  name: '中式竹挂帘',
  defaultSize: { width: 36, depth: 1.5, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '竹挂架', defaultColor: '#5d4037' },
    { id: 'bamboo', label: '细竹帘身', defaultColor: '#a1887f' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.035;
    boxComponent(registry, item, chineseBambooBlindFurniture, 'rod', {
      width: size.width * 1.02, height: rodH, depth: size.depth
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });

    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, chineseBambooBlindFurniture, 'bamboo', {
      width: size.width, height: size.height - rodH, depth: size.depth
    }, { position: { x: 0, y: (size.height - rodH) / 2, z: 0 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      cylinderComponent(registry, item, chineseBambooBlindFurniture, 'bamboo', {
        diameterTop: size.depth * 1.2, diameterBottom: size.depth * 1.2, height: size.width
      }, { position: { x: 0, y: size.height - rodH - (size.depth * 1.2) / 2, z: 0.01 } }, { parent: node });
      const rollMesh = node.getChildren().find(child => child.name.includes('bamboo'));
      if (rollMesh) {
        rollMesh.rotation.z = Math.PI * 0.5;
      }
    } else {
      proxy.visibility = 1.0;
      [-1, 1].forEach(dx => {
        boxComponent(registry, item, chineseBambooBlindFurniture, 'rod', {
          width: 0.015, height: size.height - rodH, depth: 0.015
        }, { position: { x: dx * size.width * 0.28, y: (size.height - rodH) / 2, z: 0.008 } }, { parent: node });
      });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 53. 豪华帘头欧式窗帘 (luxury_valance_curtain)
export const luxuryValanceCurtainFurniture = {
  type: 'luxury_valance_curtain',
  name: '豪帘头欧式帘',
  defaultSize: { width: 54, depth: 4, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'valance', label: '奢华波浪帘头', defaultColor: '#f57f17' },
    { id: 'fabric', label: '绒面垂地帘', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    const topH = size.height * 0.14;
    boxComponent(registry, item, luxuryValanceCurtainFurniture, 'valance', {
      width: size.width * 1.04, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: size.depth * 0.3 } }, { parent: node });

    const open = item.isOn !== false;
    const curH = size.height - topH;

    // 始终生成一个不可见但起稳定高亮包围盒作用的满幅点击代理盒
    const proxy = boxComponent(registry, item, luxuryValanceCurtainFurniture, 'fabric', {
      width: size.width * 0.96, height: curH, depth: size.depth * 0.6
    }, { position: { x: 0, y: curH / 2, z: size.depth * 0.1 } }, { parent: node });
    proxy.visibility = 0.001;

    const curW = open ? size.width * 0.22 : size.width * 0.46;
    const offsetFactor = open ? 0.38 : 0.24;

    boxComponent(registry, item, luxuryValanceCurtainFurniture, 'fabric', {
      width: curW, height: curH, depth: size.depth * 0.6
    }, { position: { x: -size.width * offsetFactor, y: curH / 2, z: size.depth * 0.1 } }, { parent: node });

    boxComponent(registry, item, luxuryValanceCurtainFurniture, 'fabric', {
      width: curW, height: curH, depth: size.depth * 0.6
    }, { position: { x: size.width * offsetFactor, y: curH / 2, z: size.depth * 0.1 } }, { parent: node });

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 54. 半腰咖啡帘 (cafe_short_curtain)
export const cafeShortCurtainFurniture = {
  type: 'cafe_short_curtain',
  name: '半腰咖啡帘',
  defaultSize: { width: 36, depth: 1.5, height: 24 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '挂杆', defaultColor: '#ffd54f' },
    { id: 'fabric', label: '挂褶半帘布', defaultColor: '#e0f2f1' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.016;
    cylinderComponent(registry, item, cafeShortCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width * 1.02, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, cafeShortCurtainFurniture, 'fabric', {
      width: size.width, height: size.height - rodH, depth: 0.006
    }, { position: { x: 0, y: (size.height - rodH) / 2, z: 0.005 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, cafeShortCurtainFurniture, 'fabric', {
        width: size.width * 0.25, height: size.height - rodH, depth: 0.006
      }, { position: { x: -size.width * 0.35, y: (size.height - rodH) / 2, z: 0.008 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 55. 日式门暖帘 (japanese_noren_curtain)
export const japaneseNorenCurtainFurniture = {
  type: 'japanese_noren_curtain',
  name: '日式门暖帘',
  defaultSize: { width: 32, depth: 1.5, height: 40 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '木挂轴', defaultColor: '#8d6e63' },
    { id: 'fabric', label: '棉麻开叉帘布', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.024;
    cylinderComponent(registry, item, japaneseNorenCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width * 1.04, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const flapH = size.height - rodH;

    const proxy = boxComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
      width: size.width, height: flapH, depth: 0.008
    }, { position: { x: 0, y: flapH / 2, z: 0.004 } }, { parent: node });
    proxy.visibility = 0.001;

    if (open) {
      cylinderComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        diameterTop: 0.04, diameterBottom: 0.04, height: flapH
      }, { position: { x: -size.width * 0.38, y: flapH / 2, z: 0.015 } }, { parent: node });

      cylinderComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        diameterTop: 0.04, diameterBottom: 0.04, height: flapH
      }, { position: { x: size.width * 0.38, y: flapH / 2, z: 0.015 } }, { parent: node });
    } else {
      const flapW = size.width * 0.48;
      boxComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        width: flapW, height: flapH, depth: 0.005
      }, { position: { x: -size.width * 0.25, y: flapH / 2, z: 0.004 } }, { parent: node });

      boxComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        width: flapW, height: flapH, depth: 0.005
      }, { position: { x: size.width * 0.25, y: flapH / 2, z: 0.004 } }, { parent: node });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

// 26. 满层书籍摆件 (Books Full Row)
export const booksFullRowFurniture = {
  type: 'books_full_row',
  name: '满层书籍摆件',
  category: 'decor',
  defaultSize: { width: 30, depth: 10, height: 10 },
  components: [
    { id: 'book-straight-1', label: '红色经典', defaultColor: '#b71c1c' },
    { id: 'book-straight-2', label: '蓝色文献', defaultColor: '#0d47a1' },
    { id: 'book-straight-3', label: '绿色卷轴', defaultColor: '#1b5e20' },
    { id: 'book-straight-4', label: '黄色刊物', defaultColor: '#f57f17' },
    { id: 'book-lean-1', label: '斜靠读物A', defaultColor: '#4a148c' },
    { id: 'book-lean-2', label: '斜靠读物B', defaultColor: '#e65100' }
  ],
  build(registry, item, node, size) {
    const bookW = size.width / 8;
    const bookD = size.depth * 0.9;
    const bookH = size.height * 0.95;
    
    // 5 本直立的书
    for (let i = 0; i < 5; i++) {
      boxComponent(registry, item, booksFullRowFurniture, `book-straight-${(i % 4) + 1}`, {
        width: bookW * 0.9, height: bookH, depth: bookD
      }, { position: { x: -size.width / 2 + bookW * (i + 0.5), y: bookH / 2, z: 0 } }, { parent: node });
    }
    
    // 2 本斜靠着的书
    const startX = -size.width / 2 + bookW * 5.2;
    const b1 = boxComponent(registry, item, booksFullRowFurniture, 'book-lean-1', {
      width: bookW * 0.9, height: bookH, depth: bookD
    }, { position: { x: startX, y: bookH / 2 - 0.01, z: 0 } }, { parent: node });
    b1.rotation.z = -Math.PI * 0.12;
    
    const b2 = boxComponent(registry, item, booksFullRowFurniture, 'book-lean-2', {
      width: bookW * 0.9, height: bookH, depth: bookD
    }, { position: { x: startX + bookW * 0.8, y: bookH / 2 - 0.03, z: 0 } }, { parent: node });
    b2.rotation.z = -Math.PI * 0.18;
  }
};

// 27. 迷你仙人球盆栽 (Mini Cactus)
export const miniCactusFurniture = {
  type: 'mini_cactus',
  name: '迷你仙人球盆栽',
  category: 'decor',
  defaultSize: { width: 6, depth: 6, height: 8 },
  components: [
    { id: 'pot', label: '磨砂陶瓷盆', defaultColor: '#e0e0e0' },
    { id: 'cactus', label: '仙人球肉质', defaultColor: '#2e7d32' },
    { id: 'flower', label: '顶部红色花', defaultColor: '#ff4081' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.4;
    const potD = size.width * 0.9;
    cylinderComponent(registry, item, miniCactusFurniture, 'pot', {
      diameterTop: potD, diameterBottom: potD * 0.7, height: potH
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });
    
    const cacD = size.width * 0.8;
    sphereComponent(registry, item, miniCactusFurniture, 'cactus', {
      diameterX: cacD, diameterY: cacD * 1.1, diameterZ: cacD
    }, { position: { x: 0, y: potH + cacD / 2 - 0.01, z: 0 } }, { parent: node });
    
    sphereComponent(registry, item, miniCactusFurniture, 'flower', {
      diameter: size.width * 0.25
    }, { position: { x: 0, y: potH + cacD * 1.05, z: 0 } }, { parent: node });
  }
};

// 28. 木质艺术相框 (Photo Frame)
export const photoFrameFurniture = {
  type: 'photo_frame',
  name: '木质艺术相框',
  category: 'decor',
  defaultSize: { width: 8, depth: 3, height: 10 },
  components: [
    { id: 'frame', label: '胡桃木框体', defaultColor: '#8d6e63' },
    { id: 'photo', label: '框内相纸', defaultColor: '#eceff1' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, photoFrameFurniture, 'frame', {
      width: size.width, height: size.height, depth: 0.02
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    
    boxComponent(registry, item, photoFrameFurniture, 'photo', {
      width: size.width * 0.8, height: size.height * 0.8, depth: 0.005
    }, { position: { x: 0, y: size.height / 2, z: 0.01 } }, { parent: node });
    
    node.rotation.x = -Math.PI * 0.08;
  }
};

// 29. 复古沙漏摆件 (Hourglass)
export const hourglassFurniture = {
  type: 'hourglass',
  name: '复古沙漏摆件',
  category: 'decor',
  defaultSize: { width: 6, depth: 6, height: 10 },
  components: [
    { id: 'frame', label: '黄铜支架', defaultColor: '#b5a642' },
    { id: 'glass', label: '双锥型玻璃腔', defaultColor: '#d4efff' },
    { id: 'sand', label: '神秘细沙', defaultColor: '#ab47bc' }
  ],
  build(registry, item, node, size) {
    const topH = 0.015;
    const mainH = size.height - topH * 2;
    const width = size.width;
    
    boxComponent(registry, item, hourglassFurniture, 'frame', {
      width: width, height: topH, depth: width
    }, { position: { x: 0, y: topH / 2, z: 0 } }, { parent: node });
    
    boxComponent(registry, item, hourglassFurniture, 'frame', {
      width: width, height: topH, depth: width
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });
    
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const r = width * 0.4;
      cylinderComponent(registry, item, hourglassFurniture, 'frame', {
        diameterTop: 0.01, diameterBottom: 0.01, height: mainH
      }, { position: { x: Math.cos(angle) * r, y: size.height / 2, z: Math.sin(angle) * r } }, { parent: node });
    }
    
    cylinderComponent(registry, item, hourglassFurniture, 'glass', {
      diameterTop: width * 0.7, diameterBottom: 0.01, height: mainH * 0.48
    }, { position: { x: 0, y: topH + mainH * 0.76, z: 0 } }, { parent: node });
    
    cylinderComponent(registry, item, hourglassFurniture, 'glass', {
      diameterTop: 0.01, diameterBottom: width * 0.7, height: mainH * 0.48
    }, { position: { x: 0, y: topH + mainH * 0.24, z: 0 } }, { parent: node });
  }
};

// 30. 藤编收纳筐 (Storage Basket)
export const storageBasketFurniture = {
  type: 'storage_basket',
  name: '藤编收纳筐',
  category: 'decor',
  defaultSize: { width: 12, depth: 10, height: 8 },
  components: [
    { id: 'basket', label: '密织竹藤', defaultColor: '#c7a75c' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, storageBasketFurniture, 'basket', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

// 31. 香薰蜡烛摆件 (Scented Candle)
export const scentedCandleFurniture = {
  type: 'scented_candle',
  name: '香薰蜡烛摆件',
  category: 'decor',
  defaultSize: { width: 5, depth: 5, height: 6 },
  components: [
    { id: 'jar', label: '亚光玻璃罐', defaultColor: '#cfd8dc' },
    { id: 'wax', label: '天然大豆蜡', defaultColor: '#fff9c4' },
    { id: 'wick', label: '纯棉线烛芯', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    const jarH = size.height * 0.85;
    cylinderComponent(registry, item, scentedCandleFurniture, 'jar', {
      diameterTop: size.width, diameterBottom: size.width, height: jarH
    }, { position: { x: 0, y: jarH / 2, z: 0 } }, { parent: node });
    
    cylinderComponent(registry, item, scentedCandleFurniture, 'wax', {
      diameterTop: size.width * 0.9, diameterBottom: size.width * 0.9, height: jarH * 0.85
    }, { position: { x: 0, y: jarH * 0.85 / 2, z: 0 } }, { parent: node });
    
    cylinderComponent(registry, item, scentedCandleFurniture, 'wick', {
      diameterTop: 0.005, diameterBottom: 0.005, height: size.height * 0.25
    }, { position: { x: 0, y: jarH * 0.85 + size.height * 0.125, z: 0 } }, { parent: node });
  }
};

// 32. 水晶球音乐盒 (Crystal Ball)
export const crystalBallFurniture = {
  type: 'crystal_ball',
  name: '水晶球音乐盒',
  category: 'decor',
  defaultSize: { width: 6, depth: 6, height: 8 },
  components: [
    { id: 'base', label: '桃花芯木底座', defaultColor: '#4e342e' },
    { id: 'sphere', label: '无铅水晶球', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.3;
    cylinderComponent(registry, item, crystalBallFurniture, 'base', {
      diameterTop: size.width * 0.9, diameterBottom: size.width, height: baseH
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });
    
    const sphereR = size.width * 0.8;
    sphereComponent(registry, item, crystalBallFurniture, 'sphere', {
      diameter: sphereR
    }, { position: { x: 0, y: baseH + sphereR / 2 - 0.01, z: 0 } }, { parent: node });
  }
};

// 33. 金色奖杯摆件 (Gold Trophy)
export const goldTrophyFurniture = {
  type: 'gold_trophy',
  name: '金色奖杯摆件',
  category: 'decor',
  defaultSize: { width: 8, depth: 6, height: 12 },
  components: [
    { id: 'base', label: '黑大理石底座', defaultColor: '#212121' },
    { id: 'gold', label: '镀金奖杯', defaultColor: '#ffd700' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.25;
    boxComponent(registry, item, goldTrophyFurniture, 'base', {
      width: size.width * 0.7, height: baseH, depth: size.depth * 0.7
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });
    
    const stemH = size.height * 0.3;
    cylinderComponent(registry, item, goldTrophyFurniture, 'gold', {
      diameterTop: size.width * 0.15, diameterBottom: size.width * 0.3, height: stemH
    }, { position: { x: 0, y: baseH + stemH / 2, z: 0 } }, { parent: node });
    
    const cupH = size.height * 0.45;
    cylinderComponent(registry, item, goldTrophyFurniture, 'gold', {
      diameterTop: size.width * 0.8, diameterBottom: size.width * 0.2, height: cupH
    }, { position: { x: 0, y: baseH + stemH + cupH / 2, z: 0 } }, { parent: node });
  }
};

// 34. 复古地球仪摆件 (Globe)
export const globeFurniture = {
  type: 'globe',
  name: '复古地球仪摆件',
  category: 'decor',
  defaultSize: { width: 10, depth: 10, height: 14 },
  components: [
    { id: 'base', label: '实木雕花支架', defaultColor: '#5d4037' },
    { id: 'ring', label: '抛光刻度半环', defaultColor: '#b5a642' },
    { id: 'sphere', label: '航海羊皮纸球体', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.12;
    cylinderComponent(registry, item, globeFurniture, 'base', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.7, height: baseH
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });
    
    const stemH = size.height * 0.2;
    cylinderComponent(registry, item, globeFurniture, 'ring', {
      diameterTop: 0.015, diameterBottom: 0.015, height: stemH
    }, { position: { x: 0, y: baseH + stemH / 2, z: 0 } }, { parent: node });
    
    const sphereD = size.width * 0.75;
    sphereComponent(registry, item, globeFurniture, 'sphere', {
      diameter: sphereD
    }, { position: { x: 0, y: baseH + stemH + sphereD / 2, z: 0 } }, { parent: node });
    
    cylinderComponent(registry, item, globeFurniture, 'ring', {
      diameterTop: sphereD * 1.15, diameterBottom: sphereD * 1.15, height: 0.012
    }, { position: { x: 0, y: baseH + stemH + sphereD / 2, z: 0 } }, { parent: node });
  }
};

// 35. 艺术石膏人像 (Gypsum Bust)
export const gypsumBustFurniture = {
  type: 'gypsum_bust',
  name: '艺术石膏人像',
  category: 'decor',
  defaultSize: { width: 8, depth: 8, height: 12 },
  components: [
    { id: 'bust', label: '亚白磨砂石膏', defaultColor: '#f5f5f5' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.2;
    cylinderComponent(registry, item, gypsumBustFurniture, 'bust', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.7, height: baseH
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });
    
    const headH = size.height * 0.8;
    cylinderComponent(registry, item, gypsumBustFurniture, 'bust', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.7, height: headH
    }, { position: { x: 0, y: baseH + headH / 2, z: 0 } }, { parent: node });
  }
};

// 36. 卡通小猪存钱罐 (Piggy Bank)
export const piggyBankFurniture = {
  type: 'piggy_bank',
  name: '卡通小猪存钱罐',
  category: 'decor',
  defaultSize: { width: 8, depth: 8, height: 8 },
  components: [
    { id: 'body', label: '樱花粉陶瓷', defaultColor: '#ff80ab' },
    { id: 'ears', label: '玫瑰红耳饰', defaultColor: '#ff4081' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, piggyBankFurniture, 'body', {
      diameterX: size.width, diameterY: size.height * 0.9, diameterZ: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    
    sphereComponent(registry, item, piggyBankFurniture, 'ears', {
      diameter: size.width * 0.25
    }, { position: { x: -size.width * 0.3, y: size.height * 0.85, z: size.depth * 0.15 } }, { parent: node });
    
    sphereComponent(registry, item, piggyBankFurniture, 'ears', {
      diameter: size.width * 0.25
    }, { position: { x: size.width * 0.3, y: size.height * 0.85, z: size.depth * 0.15 } }, { parent: node });
  }
};





