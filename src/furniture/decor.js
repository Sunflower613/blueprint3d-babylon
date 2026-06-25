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
  components: [
    { id: 'mirror', label: '银河镜面', defaultColor: '#edf7f6' },
    { id: 'frame', label: '实木后支架', defaultColor: '#aa845d' }
  ],
  build(registry, item, node, size) {
    const mirrorT = 0.03;
    const legD = size.depth * 0.88;

    // 1. 镜板 (Mirror Board)
    const board = boxComponent(registry, item, mirrorWallFurniture, 'mirror', {
      width: size.width, height: size.height * 0.94, depth: mirrorT
    }, { position: { x: 0, y: size.height * 0.48, z: -legD * 0.12 } }, { parent: node });
    board.rotation.x = -Math.PI * 0.04; // 稍微后仰

    // 2. 支架 (Support Frame)
    const stand = boxComponent(registry, item, mirrorWallFurniture, 'frame', {
      width: size.width * 0.82, height: size.height * 0.52, depth: 0.03
    }, { position: { x: 0, y: size.height * 0.20, z: -legD * 0.68 } }, { parent: node });
    stand.rotation.x = Math.PI * 0.12; // 支撑脚往前倾斜撑住
  }
};

// 7. 垂地窗帘 (Curtain)
export const curtainFurniture = {
  type: 'curtain',
  name: '垂地窗帘',
  defaultSize: { width: 48, depth: 2, height: 80 },
  placeType: 'wall',
  components: [
    { id: 'fabric', label: '窗帘垂帘', defaultColor: '#ded8cc' },
    { id: 'rod', label: '罗马金属杆', defaultColor: '#3b3a39' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.03;
    // 窗帘杆
    cylinderComponent(registry, item, curtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5; // 水平放置
    }

    // 帘布
    boxComponent(registry, item, curtainFurniture, 'fabric', {
      width: size.width * 0.94, height: size.height - rodH, depth: 0.012
    }, { position: { x: 0, y: (size.height - rodH) / 2, z: 0.01 } }, { parent: node });
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

import * as BABYLON from '@babylonjs/core';

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

