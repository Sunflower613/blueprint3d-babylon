import { boxComponent, cylinderComponent, sphereComponent, getComponentMaterial, markComponent } from './_helpers.js';
import { MeshBuilder, TransformNode } from '../core/babylon.js';

const BABYLON = { MeshBuilder, TransformNode };

function applyPosterCrop(mesh, column, row) {
  const sourceMaterial = mesh?.material;
  if (!sourceMaterial?.diffuseTexture) return;
  const material = sourceMaterial.clone(`${mesh.name}_crop_material`);
  const texture = sourceMaterial.diffuseTexture.clone();
  texture.uScale = 0.5;
  texture.vScale = 0.5;
  texture.uOffset = column * 0.5;
  texture.vOffset = row * 0.5;
  material.diffuseTexture = texture;
  mesh.material = material;
}

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

export const posterFurniture = {
  type: 'poster',
  name: '单张海报',
  defaultSize: { width: 18, depth: 0.8, height: 24 },
  placeType: 'wall',
  components: [
    { id: 'backing', label: '海报背板', defaultColor: '#f3efe6' },
    { id: 'poster', label: '海报贴图', defaultColor: '#d9a889' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, posterFurniture, 'backing', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, posterFurniture, 'poster', {
      width: Math.max(0.02, size.width - 0.018),
      height: Math.max(0.02, size.height - 0.018),
      depth: 0.006
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 + 0.003 } }, { parent: node });
  }
};

export const quadPosterFurniture = {
  type: 'quad_poster',
  name: '四联拼图海报',
  defaultSize: { width: 40, depth: 1.2, height: 40 },
  placeType: 'wall',
  components: [
    { id: 'frame', label: '四联画框', defaultColor: '#2f2b28' },
    { id: 'poster', label: '拼图海报贴图', defaultColor: '#d8b486' }
  ],
  build(registry, item, node, size) {
    const gap = Math.min(0.045, Math.min(size.width, size.height) * 0.035);
    const panelWidth = (size.width - gap) / 2;
    const panelHeight = (size.height - gap) / 2;
    const frameBorder = Math.min(0.035, Math.min(panelWidth, panelHeight) * 0.08);
    const xOffset = panelWidth / 2 + gap / 2;
    const yOffsets = [panelHeight / 2, panelHeight + gap + panelHeight / 2];

    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        const x = column === 0 ? -xOffset : xOffset;
        const y = yOffsets[1 - row];
        boxComponent(registry, item, quadPosterFurniture, 'frame', {
          width: panelWidth, height: panelHeight, depth: size.depth
        }, { position: { x, y, z: 0 } }, { parent: node });
        const poster = boxComponent(registry, item, quadPosterFurniture, 'poster', {
          width: Math.max(0.02, panelWidth - frameBorder * 2),
          height: Math.max(0.02, panelHeight - frameBorder * 2),
          depth: 0.006
        }, { position: { x, y, z: size.depth / 2 + 0.003 } }, { parent: node });
        applyPosterCrop(poster, column, row);
      }
    }
  }
};

export const circularPaintingFurniture = {
  type: 'circular_painting',
  name: '圆形挂画',
  placeType: 'wall',
  defaultSize: { width: 24, depth: 1.2, height: 24 },
  components: [
    { id: 'frame', label: '画框', defaultColor: '#3e2723' },
    { id: 'canvas', label: '画布', defaultColor: '#f7f4eb' }
  ],
  build(registry, item, node, size) {
    // 1. 画框（圆环）
    const frame = cylinderComponent(registry, item, circularPaintingFurniture, 'frame', {
      diameterTop: size.width,
      diameterBottom: size.width,
      height: size.depth,
      tessellation: 32
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    if (frame) {
      frame.rotation.x = Math.PI / 2;
    }

    // 2. 画芯（圆形画布，稍微往前偏移 0.005）
    const canvas = cylinderComponent(registry, item, circularPaintingFurniture, 'canvas', {
      diameterTop: size.width * 0.92,
      diameterBottom: size.width * 0.92,
      height: size.depth * 0.95,
      tessellation: 32
    }, { position: { x: 0, y: size.height / 2, z: 0.005 } }, { parent: node });
    if (canvas) {
      canvas.rotation.x = Math.PI / 2;
    }
  }
};

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

export const mirrorFramedWallFurniture = {
  type: 'mirror_framed_wall',
  name: '墙镜',
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

export const mirrorRoundWallFurniture = {
  type: 'mirror_round_wall',
  name: '圆形墙镜',
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

export const mirrorRoundedWallFurniture = {
  type: 'mirror_rounded_wall',
  name: '圆角墙镜',
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

export const clockFurniture = {
  type: 'clock',
  name: '壁钟',
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

export const mannequinFurniture = {
  type: 'mannequin',
  name: '木偶',
  defaultSize: { width: 14, depth: 14, height: 68 }, // 约 1.70 米
  components: [
    { id: 'wood', label: '木质构件', defaultColor: '#f2f2f2' }
  ],
  build(registry, item, node, size) {
    const type = item.pose || 'stand';

    // 动态获取木质构件的材质或颜色
    const puppetMat = getComponentMaterial(registry, item, mannequinFurniture, 'wood');

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

    // 统一为生成的子网格赋予动态材质并标记组件，支持涂色与材质修改
    node.getChildMeshes().forEach((mesh) => {
      mesh.material = puppetMat;
      markComponent(mesh, item, 'wood');
    });
  }
};

export const booksStackFurniture = {
  type: 'books_stack',
  name: '书堆',
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

export const sculptureFurniture = {
  type: 'sculpture',
  name: '抽象雕塑',
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

export const triptychPaintingFurniture = {
  type: 'triptych_painting',
  name: '三联画',
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

export const landscapePaintingFurniture = {
  type: 'landscape_painting',
  name: '山水画',
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

export const wallClockFurniture = {
  type: 'wall_clock',
  name: '挂钟',
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

export const booksFullRowFurniture = {
  type: 'books_full_row',
  name: '图书',
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

export const miniCactusFurniture = {
  type: 'mini_cactus',
  name: '小仙人球',
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

export const photoFrameFurniture = {
  type: 'photo_frame',
  name: '相框',
  category: 'decor',
  defaultSize: { width: 8, depth: 3, height: 10 },
  components: [
    { id: 'frame', label: '外框', defaultColor: '#8d6e63' },
    { id: 'photo', label: '相纸', defaultColor: '#eceff1' }
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

export const hourglassFurniture = {
  type: 'hourglass',
  name: '沙漏',
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

export const storageBasketFurniture = {
  type: 'storage_basket',
  name: '收纳筐',
  category: 'decor',
  defaultSize: { width: 12, depth: 10, height: 8 },
  components: [
    { id: 'basket', label: '密织竹藤', defaultColor: '#c7a75c' }
  ],
  build(registry, item, node, size) {
    // 侧壁和底板的厚度，基于整体尺寸的 5%，最大不超过 0.5
    const thickness = Math.min(0.5, size.width * 0.05, size.depth * 0.05, size.height * 0.05);

    // 1. 底板
    boxComponent(registry, item, storageBasketFurniture, 'basket', {
      width: size.width, height: thickness, depth: size.depth
    }, { position: { x: 0, y: thickness / 2, z: 0 } }, { parent: node });

    // 侧板高度为总高度减去底板厚度
    const sideH = size.height - thickness;
    // 侧板的Y轴中心位置
    const sideY = thickness + sideH / 2;

    // 2. 前侧板
    boxComponent(registry, item, storageBasketFurniture, 'basket', {
      width: size.width, height: sideH, depth: thickness
    }, { position: { x: 0, y: sideY, z: -size.depth / 2 + thickness / 2 } }, { parent: node });

    // 3. 后侧板
    boxComponent(registry, item, storageBasketFurniture, 'basket', {
      width: size.width, height: sideH, depth: thickness
    }, { position: { x: 0, y: sideY, z: size.depth / 2 - thickness / 2 } }, { parent: node });

    // 4. 左侧板 (在深度方向上缩水以防止与前后侧板重叠)
    boxComponent(registry, item, storageBasketFurniture, 'basket', {
      width: thickness, height: sideH, depth: size.depth - 2 * thickness
    }, { position: { x: -size.width / 2 + thickness / 2, y: sideY, z: 0 } }, { parent: node });

    // 5. 右侧板 (在深度方向上缩水以防止与前后侧板重叠)
    boxComponent(registry, item, storageBasketFurniture, 'basket', {
      width: thickness, height: sideH, depth: size.depth - 2 * thickness
    }, { position: { x: size.width / 2 - thickness / 2, y: sideY, z: 0 } }, { parent: node });
  }
};

export const scentedCandleFurniture = {
  type: 'scented_candle',
  name: '香薰蜡烛',
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

export const crystalBallFurniture = {
  type: 'crystal_ball',
  name: '音乐盒',
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

export const goldTrophyFurniture = {
  type: 'gold_trophy',
  name: '奖杯',
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

export const globeFurniture = {
  type: 'globe',
  name: '地球仪',
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

export const gypsumBustFurniture = {
  type: 'gypsum_bust',
  name: '石膏像',
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

export const piggyBankFurniture = {
  type: 'piggy_bank',
  name: '存钱罐',
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

export const windChimeFurniture = {
  type: 'wind_chime',
  name: '风铃',
  category: 'decor',
  defaultSize: { width: 8, depth: 8, height: 30 },
  placeType: 'ceiling',
  components: [
    { id: 'cap', label: '木质顶盖', defaultColor: '#8d6e63' },
    { id: 'tubes', label: '金属音管', defaultColor: '#cfd8dc' },
    { id: 'pendant', label: '木质吊坠', defaultColor: '#8d6e63' },
    { id: 'string', label: '悬挂挂线', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    // 挂线高度
    const stringH = size.height * 0.28;
    cylinderComponent(registry, item, windChimeFurniture, 'string', {
      diameterTop: 0.005, diameterBottom: 0.005, height: stringH, tessellation: 6
    }, { position: { x: 0, y: size.height - stringH / 2, z: 0 } }, { parent: node });

    // 顶盖高度
    const capH = 0.015;
    cylinderComponent(registry, item, windChimeFurniture, 'cap', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.72, height: capH, tessellation: 12
    }, { position: { x: 0, y: size.height - stringH - capH / 2, z: 0 } }, { parent: node });

    // 4根金属音管 (长短不等，围绕中心圆周分布)
    const tubesTopY = size.height - stringH - capH;
    const r = size.width * 0.22;
    const pipeHeights = [size.height * 0.38, size.height * 0.44, size.height * 0.50, size.height * 0.56];
    pipeHeights.forEach((h, index) => {
      const angle = (index * Math.PI * 2) / 4;
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      const ty = tubesTopY - h / 2;
      cylinderComponent(registry, item, windChimeFurniture, 'tubes', {
        diameterTop: size.width * 0.08, diameterBottom: size.width * 0.08, height: h, tessellation: 8
      }, { position: { x: tx, y: ty, z: tz } }, { parent: node });
    });

    // 中间垂下来的吊坠线
  }
};
export const landscapeRockeryAquarium = {
  type: 'landscape_rockery_aquarium',
  name: '水族箱',
  defaultSize: { width: 40, depth: 24, height: 48 },
  components: [
    { id: 'aquarium-stand', label: '实木底柜', defaultColor: '#2d1d16' },
    { id: 'aquarium-glass', label: '超白玻璃缸', defaultColor: '#e0f2f1' },
    { id: 'aquarium-rock', label: '生态假山石', defaultColor: '#455a64' },
    { id: 'aquarium-water', label: '透亮水体', defaultColor: { kind: 'glass', color: '#00b0ff', alpha: 0.45 } },
    { id: 'aquarium-plant', label: '生态水草', defaultColor: '#2e7d32' },
    { id: 'aquarium-fish', label: '观赏金鱼', defaultColor: '#ff5722' }
  ],
  build(registry, item, node, size) {
    const standH = size.height * 0.42;
    // 1. 实木底柜
    boxComponent(registry, item, landscapeRockeryAquarium, 'aquarium-stand', {
      width: size.width, height: standH, depth: size.depth
    }, { position: { x: 0, y: standH / 2, z: 0 } }, { parent: node });

    const glassH = size.height * 0.58;
    // 2. 超白玻璃缸
    boxComponent(registry, item, landscapeRockeryAquarium, 'aquarium-glass', {
      width: size.width, height: glassH, depth: size.depth
    }, { position: { x: 0, y: standH + glassH / 2, z: 0 } }, { parent: node });

    // 3. 蔚蓝透亮水体
    boxComponent(registry, item, landscapeRockeryAquarium, 'aquarium-water', {
      width: size.width * 0.94, height: glassH * 0.9, depth: size.depth * 0.94
    }, { position: { x: 0, y: standH + glassH * 0.45, z: 0 } }, { parent: node });

    // 4. 3个椭圆假山 (主山、配山、护山)，一半埋在底柜里
    // 主山
    sphereComponent(registry, item, landscapeRockeryAquarium, 'aquarium-rock', {
      diameterX: size.width * 0.35,
      diameterY: size.height * 0.4,
      diameterZ: size.depth * 0.45,
      segments: 8
    }, { position: { x: -size.width * 0.12, y: standH + size.height * 0.08, z: -size.depth * 0.05 } }, { parent: node });

    // 配山
    sphereComponent(registry, item, landscapeRockeryAquarium, 'aquarium-rock', {
      diameterX: size.width * 0.28,
      diameterY: size.height * 0.3,
      diameterZ: size.depth * 0.35,
      segments: 8
    }, { position: { x: size.width * 0.16, y: standH + size.height * 0.05, z: size.depth * 0.1 } }, { parent: node });

    // 护山
    sphereComponent(registry, item, landscapeRockeryAquarium, 'aquarium-rock', {
      diameterX: size.width * 0.2,
      diameterY: size.height * 0.2,
      diameterZ: size.depth * 0.25,
      segments: 8
    }, { position: { x: -size.width * 0.02, y: standH + size.height * 0.03, z: size.depth * 0.2 } }, { parent: node });

    // 5. 生态水草
    // 水草 1
    cylinderComponent(registry, item, landscapeRockeryAquarium, 'aquarium-plant', {
      diameterTop: 0.1, diameterBottom: size.width * 0.03, height: glassH * 0.55, tessellation: 6
    }, { position: { x: -size.width * 0.22, y: standH + (glassH * 0.55) / 2, z: -size.depth * 0.18 } }, { parent: node });

    // 水草 2
    cylinderComponent(registry, item, landscapeRockeryAquarium, 'aquarium-plant', {
      diameterTop: 0.1, diameterBottom: size.width * 0.025, height: glassH * 0.45, tessellation: 6
    }, { position: { x: size.width * 0.22, y: standH + (glassH * 0.45) / 2, z: -size.depth * 0.08 } }, { parent: node });

    // 水草 3
    cylinderComponent(registry, item, landscapeRockeryAquarium, 'aquarium-plant', {
      diameterTop: 0.1, diameterBottom: size.width * 0.02, height: glassH * 0.3, tessellation: 6
    }, { position: { x: size.width * 0.05, y: standH + (glassH * 0.3) / 2, z: size.depth * 0.15 } }, { parent: node });

    // 6. 观赏金鱼
    // 鱼 1
    const fish1 = sphereComponent(registry, item, landscapeRockeryAquarium, 'aquarium-fish', {
      diameterX: size.width * 0.12, diameterY: size.height * 0.06, diameterZ: size.depth * 0.06, segments: 8
    }, { position: { x: -size.width * 0.15, y: standH + glassH * 0.6, z: size.depth * 0.08 } }, { parent: node });
    if (fish1) fish1.rotation.y = 0.5;

    // 鱼 2
    const fish2 = sphereComponent(registry, item, landscapeRockeryAquarium, 'aquarium-fish', {
      diameterX: size.width * 0.1, diameterY: size.height * 0.05, diameterZ: size.depth * 0.05, segments: 8
    }, { position: { x: size.width * 0.15, y: standH + glassH * 0.4, z: -size.depth * 0.1 } }, { parent: node });
    if (fish2) fish2.rotation.y = -1.2;

    // 鱼 3
    const fish3 = sphereComponent(registry, item, landscapeRockeryAquarium, 'aquarium-fish', {
      diameterX: size.width * 0.08, diameterY: size.height * 0.04, diameterZ: size.depth * 0.04, segments: 8
    }, { position: { x: size.width * 0.02, y: standH + glassH * 0.25, z: size.depth * 0.05 } }, { parent: node });
    if (fish3) fish3.rotation.y = 2.0;
  }
};

export const traditionalChineseScreenFurniture = {
  type: 'traditional_chinese_screen',
  name: '中式雕花折屏',
  defaultSize: { width: 72, depth: 8, height: 68 },
  components: [
    { id: 'frame', label: '红木框架', defaultColor: '#3e2723' },
    { id: 'panel', label: '宣纸屏芯', defaultColor: '#fcf8f2' }
  ],
  build(registry, item, node, size) {
    const wMid = size.width * 0.44;
    const wSide = size.width * 0.28;
    const theta = Math.PI / 12; // 15度
    const borderW = 0.045; // 4.5 厘米
    const frameD = 0.03;   // 3 厘米
    const panelD = 0.01;   // 1 厘米

    // 1. 中屏 (居中)
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: -wMid / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: wMid / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: wMid - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: 0, y: size.height - borderW / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: wMid - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: 0, y: borderW / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'panel', {
      width: wMid - 2 * borderW, height: size.height - 2 * borderW, depth: panelD
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 左屏
    const leftParent = new BABYLON.TransformNode(`left_panel_${item.id}`, registry.scene);
    leftParent.parent = node;
    leftParent.position.set(-wMid / 2, 0, 0);
    leftParent.rotation.y = theta;

    const lx = -wSide / 2;
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: lx - wSide / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: lx + wSide / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: wSide - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: lx, y: size.height - borderW / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: wSide - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: lx, y: borderW / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'panel', {
      width: wSide - 2 * borderW, height: size.height - 2 * borderW, depth: panelD
    }, { position: { x: lx, y: size.height / 2, z: 0 } }, { parent: leftParent });

    // 3. 右屏
    const rightParent = new BABYLON.TransformNode(`right_panel_${item.id}`, registry.scene);
    rightParent.parent = node;
    rightParent.position.set(wMid / 2, 0, 0);
    rightParent.rotation.y = -theta;

    const rx = wSide / 2;
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: rx - wSide / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: rx + wSide / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: wSide - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: rx, y: size.height - borderW / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'frame', {
      width: wSide - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: rx, y: borderW / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, traditionalChineseScreenFurniture, 'panel', {
      width: wSide - 2 * borderW, height: size.height - 2 * borderW, depth: panelD
    }, { position: { x: rx, y: size.height / 2, z: 0 } }, { parent: rightParent });
  }
};

export const modernSlatScreenFurniture = {
  type: 'modern_slat_screen',
  name: '木格栅墙',
  defaultSize: { width: 48, depth: 3, height: 72 },
  components: [
    { id: 'base', label: '上下横梁', defaultColor: '#b58a5f' },
    { id: 'slats', label: '浅橡木格栅条', defaultColor: '#d8b486' }
  ],
  build(registry, item, node, size) {
    const beamH = Math.min(0.045, size.height * 0.04);
    const slatH = Math.max(0.02, size.height - beamH * 2);
    const N = Math.max(4, Math.round(size.width / 0.14));
    const slatW = Math.min(0.055, size.width / N * 0.52);
    const slatD = Math.max(0.025, size.depth * 0.72);

    // 仅保留上下横梁，不生成连续背板，让格栅保持通透。
    [beamH / 2, size.height - beamH / 2].forEach((y) => {
      boxComponent(registry, item, modernSlatScreenFurniture, 'base', {
        width: size.width, height: beamH, depth: slatD
      }, { position: { x: 0, y, z: 0 } }, { parent: node });
    });

    // 使用更疏的竖向木条。
    const startX = -size.width / 2 + slatW / 2;
    const endX = size.width / 2 - slatW / 2;
    const stepX = (endX - startX) / (N - 1);

    for (let i = 0; i < N; i++) {
      const sx = startX + i * stepX;
      boxComponent(registry, item, modernSlatScreenFurniture, 'slats', {
        width: slatW, height: slatH, depth: slatD
      }, { position: { x: sx, y: beamH + slatH / 2, z: 0 } }, { parent: node });
    }
  }
};

export const rattanWaveScreenFurniture = {
  type: 'rattan_wave_screen',
  name: '藤编屏风',
  defaultSize: { width: 54, depth: 10, height: 60 },
  components: [
    { id: 'frame', label: '白蜡木框', defaultColor: '#d7ccc8' },
    { id: 'weave', label: '八角藤编网', defaultColor: '#e0c097' }
  ],
  build(registry, item, node, size) {
    const wPart = size.width / 3;
    const theta = Math.PI / 9; // 20度
    const borderW = 0.035; // 3.5 厘米
    const frameD = 0.025; // 2.5 厘米
    const weaveD = 0.008; // 0.8 厘米

    // 1. 中屏 (居中)
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: -wPart / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: wPart / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: wPart - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: 0, y: size.height - borderW / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: wPart - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: 0, y: borderW / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'weave', {
      width: wPart - 2 * borderW, height: size.height - 2 * borderW, depth: weaveD
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 左屏
    const leftParent = new BABYLON.TransformNode(`rattan_left_${item.id}`, registry.scene);
    leftParent.parent = node;
    leftParent.position.set(-wPart / 2, 0, 0);
    leftParent.rotation.y = theta;

    const lx = -wPart / 2;
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: lx - wPart / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: lx + wPart / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: wPart - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: lx, y: size.height - borderW / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: wPart - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: lx, y: borderW / 2, z: 0 } }, { parent: leftParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'weave', {
      width: wPart - 2 * borderW, height: size.height - 2 * borderW, depth: weaveD
    }, { position: { x: lx, y: size.height / 2, z: 0 } }, { parent: leftParent });

    // 3. 右屏
    const rightParent = new BABYLON.TransformNode(`rattan_right_${item.id}`, registry.scene);
    rightParent.parent = node;
    rightParent.position.set(wPart / 2, 0, 0);
    rightParent.rotation.y = -theta;

    const rx = wPart / 2;
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: rx - wPart / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: borderW, height: size.height, depth: frameD
    }, { position: { x: rx + wPart / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: wPart - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: rx, y: size.height - borderW / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'frame', {
      width: wPart - 2 * borderW, height: borderW, depth: frameD
    }, { position: { x: rx, y: borderW / 2, z: 0 } }, { parent: rightParent });
    boxComponent(registry, item, rattanWaveScreenFurniture, 'weave', {
      width: wPart - 2 * borderW, height: size.height - 2 * borderW, depth: weaveD
    }, { position: { x: rx, y: size.height / 2, z: 0 } }, { parent: rightParent });
  }
};

export const luxuryMetalGlassScreenFurniture = {
  type: 'luxury_metal_glass_screen',
  name: '玻璃屏风',
  defaultSize: { width: 44, depth: 8, height: 70 },
  components: [
    { id: 'frame', label: '拉丝黄铜框', defaultColor: '#cfb53b' },
    { id: 'glass', label: '磨砂长虹玻璃', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.06;
    const frameD = 0.02; // 2 厘米
    const glassD = 0.008; // 8 毫米

    // 1. 底座
    boxComponent(registry, item, luxuryMetalGlassScreenFurniture, 'frame', {
      width: size.width * 0.9, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 2. 两个立柱
    boxComponent(registry, item, luxuryMetalGlassScreenFurniture, 'frame', {
      width: 0.02, height: size.height - baseH, depth: frameD
    }, { position: { x: -size.width * 0.45, y: baseH + (size.height - baseH) / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, luxuryMetalGlassScreenFurniture, 'frame', {
      width: 0.02, height: size.height - baseH, depth: frameD
    }, { position: { x: size.width * 0.45, y: baseH + (size.height - baseH) / 2, z: 0 } }, { parent: node });

    // 3. 顶部横梁
    boxComponent(registry, item, luxuryMetalGlassScreenFurniture, 'frame', {
      width: size.width * 0.9, height: 0.02, depth: frameD
    }, { position: { x: 0, y: size.height - 0.01, z: 0 } }, { parent: node });

    // 4. 三块磨砂玻璃及垂直分隔条
    const availW = size.width * 0.9 - 0.04;
    const sepW = 0.01; // 分隔条宽 1 厘米
    const glassW = (availW - 2 * sepW) / 3;
    const glassH = size.height - baseH - 0.02;
    const glassY = baseH + glassH / 2;

    const startX = -availW / 2 + glassW / 2;
    const stepX = glassW + sepW;

    for (let i = 0; i < 3; i++) {
      const gx = startX + i * stepX;
      boxComponent(registry, item, luxuryMetalGlassScreenFurniture, 'glass', {
        width: glassW, height: glassH, depth: glassD
      }, { position: { x: gx, y: glassY, z: 0 } }, { parent: node });

      if (i < 2) {
        boxComponent(registry, item, luxuryMetalGlassScreenFurniture, 'frame', {
          width: sepW, height: glassH, depth: frameD + 0.005
        }, { position: { x: gx + stepX / 2, y: glassY, z: 0 } }, { parent: node });
      }
    }
  }
};

export const japaneseShojiScreenFurniture = {
  type: 'japanese_shoji_screen',
  name: '障纸屏风',
  defaultSize: { width: 64, depth: 6, height: 64 },
  components: [
    { id: 'frame', label: '黑胡桃木框', defaultColor: '#2b221a' },
    { id: 'paper', label: '障子透光纸', defaultColor: '#f7f6f2' },
    { id: 'grille', label: '细木格栅', defaultColor: '#2b221a' }
  ],
  build(registry, item, node, size) {
    const wPart = size.width / 4;
    const theta = Math.PI * 12 / 180; // 12度
    const borderW = 0.03; // 3 厘米
    const frameD = 0.02; // 2 厘米
    const paperD = 0.005; // 5 毫米
    const grilleD = 0.003; // 3 毫米
    const grilleW = 0.008; // 8 毫米

    const wProj = wPart * Math.cos(theta);
    const zProj = wPart * Math.sin(theta);

    const folds = [
      { cx: -1.5 * wProj, cz: 0.5 * zProj, rot: theta },
      { cx: -0.5 * wProj, cz: -0.5 * zProj, rot: -theta },
      { cx: 0.5 * wProj, cz: 0.5 * zProj, rot: theta },
      { cx: 1.5 * wProj, cz: -0.5 * zProj, rot: -theta }
    ];

    folds.forEach((fold, index) => {
      const foldNode = new BABYLON.TransformNode(`shoji_fold_${index}_${item.id}`, registry.scene);
      foldNode.parent = node;
      foldNode.position.set(fold.cx, 0, fold.cz);
      foldNode.rotation.y = fold.rot;

      // 1. 外框架 (Frame)
      // 左
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'frame', {
        width: borderW, height: size.height, depth: frameD
      }, { position: { x: -wPart / 2 + borderW / 2, y: size.height / 2, z: 0 } }, { parent: foldNode });
      // 右
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'frame', {
        width: borderW, height: size.height, depth: frameD
      }, { position: { x: wPart / 2 - borderW / 2, y: size.height / 2, z: 0 } }, { parent: foldNode });
      // 上
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'frame', {
        width: wPart - 2 * borderW, height: borderW, depth: frameD
      }, { position: { x: 0, y: size.height - borderW / 2, z: 0 } }, { parent: foldNode });
      // 下
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'frame', {
        width: wPart - 2 * borderW, height: borderW, depth: frameD
      }, { position: { x: 0, y: borderW / 2, z: 0 } }, { parent: foldNode });

      // 2. 障子纸 (Paper)
      const pW = wPart - 2 * borderW;
      const pH = size.height - 2 * borderW;
      const pY = size.height / 2;
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'paper', {
        width: pW, height: pH, depth: paperD
      }, { position: { x: 0, y: pY, z: 0 } }, { parent: foldNode });

      // 3. 障子格栅 (Grille)
      const gZ = paperD / 2 + grilleD / 2;

      // 2根纵向
      const gX1 = -pW / 6;
      const gX2 = pW / 6;
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'grille', {
        width: grilleW, height: pH, depth: grilleD
      }, { position: { x: gX1, y: pY, z: gZ } }, { parent: foldNode });
      boxComponent(registry, item, japaneseShojiScreenFurniture, 'grille', {
        width: grilleW, height: pH, depth: grilleD
      }, { position: { x: gX2, y: pY, z: gZ } }, { parent: foldNode });

      // 4根横向
      for (let i = 1; i <= 4; i++) {
        const gy = borderW + (pH / 5) * i;
        boxComponent(registry, item, japaneseShojiScreenFurniture, 'grille', {
          width: pW, height: grilleW, depth: grilleD
        }, { position: { x: 0, y: gy, z: gZ } }, { parent: foldNode });
      }
    });
  }
};
