import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const plantFurniture = {
  type: 'plant',
  name: '绿植',
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

export const plantPotFurniture = {
  type: 'plant_pot',
  name: '吊兰',
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

export const cactusFurniture = {
  type: 'cactus',
  name: '仙人球',
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

export const monsteraFurniture = {
  type: 'monstera',
  name: '龟背竹',
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

export const succulentFurniture = {
  type: 'succulent',
  name: '多肉',
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

export const bambooFurniture = {
  type: 'bamboo',
  name: '富贵竹',
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

export const fernFurniture = {
  type: 'fern',
  name: '垂耳蕨',
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

export const bonsaiFurniture = {
  type: 'bonsai',
  name: '松树盆景',
  defaultSize: { width: 36, depth: 24, height: 32 },
  components: [
    { id: 'bonsai-pot', label: '紫砂长方浅盆', defaultColor: '#5d4037' },
    { id: 'bonsai-trunk', label: '苍劲曲折树干', defaultColor: '#3e2723' },
    { id: 'bonsai-leaves', label: '葱郁松针簇', defaultColor: '#004d40' }
  ],
  build(registry, item, node, size) {
    const potFeetH = size.height * 0.03;
    const potH = size.height * 0.15;
    const potTotalH = potFeetH + potH;

    // 1. 花盆脚 (4个小盆脚)
    const footX = size.width * 0.38;
    const footZ = size.depth * 0.38;
    const feetPos = [
      { x: -footX, z: footZ },
      { x: footX, z: footZ },
      { x: -footX, z: -footZ },
      { x: footX, z: -footZ }
    ];
    feetPos.forEach((pos) => {
      boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
        width: size.width * 0.08, height: potFeetH, depth: size.depth * 0.08
      }, { position: { x: pos.x, y: potFeetH / 2, z: pos.z } }, { parent: node });
    });

    // 2. 长方紫砂浅盆主体
    boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
      width: size.width * 0.86, height: potH * 0.8, depth: size.depth * 0.86
    }, { position: { x: 0, y: potFeetH + potH * 0.4, z: 0 } }, { parent: node });

    // 3. 花盆口沿
    boxComponent(registry, item, bonsaiFurniture, 'bonsai-pot', {
      width: size.width * 0.90, height: potH * 0.2, depth: size.depth * 0.90
    }, { position: { x: 0, y: potFeetH + potH - (potH * 0.1), z: 0 } }, { parent: node });

    // 4. 绿意苔藓丘
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.3, segments: 8
    }, { position: { x: -size.width * 0.05, y: potTotalH - 0.01, z: size.depth * 0.05 }, scaling: { x: 1.2, y: 0.18, z: 1.0 } }, { parent: node });

    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.35, segments: 8
    }, { position: { x: size.width * 0.08, y: potTotalH - 0.02, z: -size.depth * 0.05 }, scaling: { x: 1.1, y: 0.14, z: 1.1 } }, { parent: node });

    // 5. 盘根扎土
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.06, height: size.height * 0.07, tessellation: 6
    }, { position: { x: -size.width * 0.12, y: potTotalH + size.height * 0.02, z: size.depth * 0.02 }, rotation: { x: 0.2, y: 0, z: 0.45 } }, { parent: node });

    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.05, height: size.height * 0.06, tessellation: 6
    }, { position: { x: -size.width * 0.03, y: potTotalH + size.height * 0.015, z: -size.depth * 0.04 }, rotation: { x: -0.3, y: 0.1, z: -0.35 } }, { parent: node });

    // 6. 嶙峋树干 (3段式斜干式拼接)
    const trunkH1 = size.height * 0.18;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.075, diameterBottom: size.width * 0.09, height: trunkH1, tessellation: 8
    }, { position: { x: -size.width * 0.05, y: potTotalH + trunkH1 / 2, z: 0 }, rotation: { x: 0.05, y: 0, z: -0.2 } }, { parent: node });

    const trunkH2 = size.height * 0.16;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.075, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.02, y: potTotalH + trunkH1 + trunkH2 / 2 - 0.05, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0.1, z: 0.3 } }, { parent: node });

    const trunkH3 = size.height * 0.14;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.06, height: trunkH3, tessellation: 8
    }, { position: { x: -size.width * 0.01, y: potTotalH + trunkH1 + trunkH2 + trunkH3 / 2 - 0.1, z: size.depth * 0.01 }, rotation: { x: 0.05, y: -0.1, z: -0.15 } }, { parent: node });

    // 7. 迎客枝条
    const branchL = size.width * 0.25;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: branchL, tessellation: 6
    }, { position: { x: -size.width * 0.12, y: potTotalH + trunkH1 + 0.08, z: size.depth * 0.03 }, rotation: { x: 0.1, y: 0, z: 1.1 } }, { parent: node });

    const rightL = size.width * 0.18;
    cylinderComponent(registry, item, bonsaiFurniture, 'bonsai-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.038, height: rightL, tessellation: 6
    }, { position: { x: size.width * 0.12, y: potTotalH + trunkH1 + trunkH2 * 0.8, z: -size.depth * 0.02 }, rotation: { x: -0.1, y: 0, z: -0.85 } }, { parent: node });

    // 8. 扁平层叠松针 (6组)
    // 左低位云片
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: -size.width * 0.32, y: potTotalH + trunkH1 - 0.12, z: size.depth * 0.04 }, scaling: { x: 1.35, y: 0.16, z: 0.95 } }, { parent: node });

    // 左中位云片
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.28, segments: 8
    }, { position: { x: -size.width * 0.2, y: potTotalH + trunkH1 + trunkH2 * 0.3, z: size.depth * 0.08 }, scaling: { x: 1.25, y: 0.15, z: 0.9 } }, { parent: node });

    // 顶端主树冠
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.42, segments: 8
    }, { position: { x: -size.width * 0.02, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.05, z: size.depth * 0.04 }, scaling: { x: 1.3, y: 0.15, z: 1.0 } }, { parent: node });

    // 顶右副树冠
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: size.width * 0.1, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.12, z: -size.depth * 0.05 }, scaling: { x: 1.2, y: 0.14, z: 0.95 } }, { parent: node });

    // 右平衡枝叶
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.34, segments: 8
    }, { position: { x: size.width * 0.24, y: potTotalH + trunkH1 + trunkH2 * 0.7, z: -size.depth * 0.02 }, scaling: { x: 1.3, y: 0.15, z: 0.95 } }, { parent: node });

    // 后背景叶
    sphereComponent(registry, item, bonsaiFurniture, 'bonsai-leaves', {
      diameter: size.width * 0.30, segments: 8
    }, { position: { x: size.width * 0.0, y: potTotalH + trunkH1 + trunkH2 * 0.8, z: -size.depth * 0.2 }, scaling: { x: 1.2, y: 0.16, z: 0.9 } }, { parent: node });
  }

};

export const flowerRoseFurniture = {
  type: 'flower_rose',
  name: '玫瑰盆栽',
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

export const snakePlantFurniture = {
  type: 'snake_plant',
  name: '虎尾兰',
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

export const sunflowerPotFurniture = {
  type: 'sunflower_pot',
  name: '向日葵',
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

export const pachiraTreeFurniture = {
  type: 'pachira_tree',
  name: '发财树',
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

export const lavenderPotFurniture = {
  type: 'lavender_pot',
  name: '薰衣草',
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

export const tulipVaseFurniture = {
  type: 'tulip_vase',
  name: '郁金香',
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

export const orchidPotFurniture = {
  type: 'orchid_pot',
  name: '蝴蝶兰',
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

export const largeCactusFurniture = {
  type: 'large_cactus',
  name: '仙人掌',
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
    side1.rotation.z = -Math.PI * 0.12;

    const side2 = cylinderComponent(registry, item, largeCactusFurniture, 'body', {
      diameterTop: 0.05, diameterBottom: 0.05, height: size.height * 0.2
    }, { position: { x: -size.width * 0.16, y: size.height * 0.5, z: size.depth * 0.05 } }, { parent: node });
    side2.rotation.z = Math.PI * 0.12;
  }
};

export const eucalyptusVaseFurniture = {
  type: 'eucalyptus_vase',
  name: '尤加利',
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
      stem.rotation.z = -c * Math.PI * 0.08;

      for (let l = 0; l < 5; l++) {
        sphereComponent(registry, item, eucalyptusVaseFurniture, 'leaves', {
          diameterX: 0.07, diameterY: 0.01, diameterZ: 0.07
        }, { position: { x: c * (0.04 + l * 0.035), y: size.height * 0.45 + l * 0.08, z: (l % 2 === 0 ? 0.015 : -0.015) } }, { parent: node });
      }
    }
  }
};

export const cherryBlossomBonsaiFurniture = {
  type: 'cherry_blossom_bonsai',
  name: '樱花',
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

export const hangingIvyFurniture = {
  type: 'hanging_ivy',
  name: '常春藤',
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

export const landscapeWelcomeBonsai = {
  type: 'landscape_welcome_bonsai',
  name: '奇石盆景',
  defaultSize: { width: 30, depth: 20, height: 36 },
  components: [
    { id: 'bonsai-pot', label: '紫砂浅盆', defaultColor: '#4e342e' },
    { id: 'bonsai-stone', label: '漏透嶙峋石', defaultColor: '#37474f' },
    { id: 'bonsai-tree', label: '横斜松柏', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const potFeetH = size.height * 0.03;
    const potH = size.height * 0.15;
    const potTotalH = potFeetH + potH;

    const footX = size.width * 0.38;
    const footZ = size.depth * 0.38;
    const feetPos = [
      { x: -footX, z: footZ },
      { x: footX, z: footZ },
      { x: -footX, z: -footZ },
      { x: footX, z: -footZ }
    ];
    feetPos.forEach((pos) => {
      boxComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-pot', {
        width: size.width * 0.08, height: potFeetH, depth: size.depth * 0.08
      }, { position: { x: pos.x, y: potFeetH / 2, z: pos.z } }, { parent: node });
    });

    boxComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-pot', {
      width: size.width * 0.86, height: potH * 0.8, depth: size.depth * 0.86
    }, { position: { x: 0, y: potFeetH + potH * 0.4, z: 0 } }, { parent: node });

    boxComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-pot', {
      width: size.width * 0.90, height: potH * 0.2, depth: size.depth * 0.90
    }, { position: { x: 0, y: potFeetH + potH - (potH * 0.1), z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameter: size.width * 0.8, segments: 8
    }, { position: { x: 0, y: potTotalH, z: 0 }, scaling: { x: 1.05, y: 0.12, z: 1.05 } }, { parent: node });

    const stoneD1 = size.width * 0.34;
    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-stone', {
      diameter: stoneD1, segments: 6
    }, { 
      position: { x: -size.width * 0.15, y: potTotalH + stoneD1 * 0.6, z: size.depth * 0.02 }, 
      scaling: { x: 0.65, y: 1.6, z: 0.8 }, 
      rotation: { x: 0.12, y: 0.25, z: 0.08 } 
    }, { parent: node });

    const stoneD2 = size.width * 0.26;
    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-stone', {
      diameter: stoneD2, segments: 6
    }, { 
      position: { x: -size.width * 0.16, y: potTotalH + stoneD1 * 1.0, z: -size.depth * 0.04 }, 
      scaling: { x: 1.25, y: 0.85, z: 0.65 }, 
      rotation: { x: -0.22, y: -0.3, z: -0.38 } 
    }, { parent: node });

    const stoneD3 = size.width * 0.22;
    sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-stone', {
      diameter: stoneD3, segments: 5
    }, { 
      position: { x: -size.width * 0.06, y: potTotalH + stoneD3 * 0.5, z: size.depth * 0.08 }, 
      scaling: { x: 1.4, y: 0.58, z: 1.15 }, 
      rotation: { x: 0.38, y: 0.75, z: -0.18 } 
    }, { parent: node });

    const trunkH1 = size.height * 0.2;
    const trunkH2 = size.height * 0.18;
    const trunkH3 = size.height * 0.16;

    cylinderComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameterTop: size.width * 0.045, diameterBottom: size.width * 0.065, height: trunkH1, tessellation: 8
    }, { position: { x: size.width * 0.05, y: potTotalH + trunkH1 / 2, z: size.depth * 0.02 }, rotation: { x: -0.12, y: 0.05, z: -0.55 } }, { parent: node });

    cylinderComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameterTop: size.width * 0.035, diameterBottom: size.width * 0.045, height: trunkH2, tessellation: 8
    }, { position: { x: size.width * 0.15, y: potTotalH + trunkH1 + trunkH2 / 2 - size.height * 0.06, z: -size.depth * 0.02 }, rotation: { x: 0.08, y: -0.15, z: -0.82 } }, { parent: node });

    cylinderComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
      diameterTop: size.width * 0.022, diameterBottom: size.width * 0.035, height: trunkH3, tessellation: 6
    }, { position: { x: size.width * 0.24, y: potTotalH + trunkH1 + trunkH2 - size.height * 0.11, z: size.depth * 0.02 }, rotation: { x: -0.18, y: 0.2, z: -0.32 } }, { parent: node });

    const cloudNeedles = [
      { x: 0.24, y: 0.46, z: 0.06, sizeMult: 0.36, scale: { x: 1.35, y: 0.16, z: 0.9 } },
      { x: 0.36, y: 0.32, z: -0.06, sizeMult: 0.3, scale: { x: 1.3, y: 0.15, z: 0.85 } },
      { x: 0.17, y: 0.36, z: 0.08, sizeMult: 0.32, scale: { x: 1.25, y: 0.15, z: 0.95 } },
      { x: -0.02, y: 0.34, z: 0.12, sizeMult: 0.24, scale: { x: 1.2, y: 0.13, z: 0.85 } },
      { x: 0.1, y: 0.42, z: -0.16, sizeMult: 0.28, scale: { x: 1.25, y: 0.15, z: 0.9 } }
    ];

    cloudNeedles.forEach((cloud) => {
      sphereComponent(registry, item, landscapeWelcomeBonsai, 'bonsai-tree', {
        diameter: size.width * cloud.sizeMult, segments: 8
      }, {
        position: { x: cloud.x * size.width, y: potTotalH + cloud.y * size.height, z: cloud.z * size.depth },
        scaling: { x: cloud.scale.x, y: cloud.scale.y, z: cloud.scale.z }
      }, { parent: node });
    });
  }

};

export const landscapePineBonsai = {
  type: 'landscape_pine_bonsai',
  name: '松景',
  defaultSize: { width: 44, depth: 32, height: 56 },
  components: [
    { id: 'pine-pot', label: '宜兴紫砂泥盆', defaultColor: '#5d4037' },
    { id: 'pine-trunk', label: '苍老扭曲主干', defaultColor: '#4e342e' },
    { id: 'pine-leaves', label: '苍翠松针簇', defaultColor: '#1b5e20' }
  ],
  build(registry, item, node, size) {
    const potFeetH = size.height * 0.025;
    const potH = size.height * 0.12;
    const potTotalH = potFeetH + potH;

    // 1. 花盆脚 (4个小底足)
    const footX = size.width * 0.28;
    const footZ = size.depth * 0.20;
    const feetPositions = [
      { x: -footX, z: footZ },
      { x: footX, z: footZ },
      { x: -footX, z: -footZ },
      { x: footX, z: -footZ }
    ];
    feetPositions.forEach((pos) => {
      boxComponent(registry, item, landscapePineBonsai, 'pine-pot', {
        width: size.width * 0.08, height: potFeetH, depth: size.depth * 0.08
      }, { position: { x: pos.x, y: potFeetH / 2, z: pos.z } }, { parent: node });
    });

    // 2. 花盆主体 (椭圆扁盆)
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-pot', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.72, height: potH * 0.8, tessellation: 24
    }, { position: { x: 0, y: potFeetH + potH * 0.4, z: 0 }, scaling: { x: 1.0, y: 1.0, z: 0.7 } }, { parent: node });

    // 3. 花盆口沿 (突出的唇边)
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-pot', {
      diameterTop: size.width * 0.81, diameterBottom: size.width * 0.81, height: potH * 0.2, tessellation: 24
    }, { position: { x: 0, y: potFeetH + potH - (potH * 0.1), z: 0 }, scaling: { x: 1.0, y: 1.0, z: 0.7 } }, { parent: node });

    // 4. 盆内土丘与苔藓地形 (采用松叶的绿色材质)
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.35, segments: 8
    }, { position: { x: -size.width * 0.08, y: potTotalH - 0.01, z: size.depth * 0.04 }, scaling: { x: 1.2, y: 0.2, z: 1.0 } }, { parent: node });

    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.40, segments: 8
    }, { position: { x: size.width * 0.08, y: potTotalH - 0.02, z: -size.depth * 0.02 }, scaling: { x: 1.1, y: 0.15, z: 1.1 } }, { parent: node });

    // 5. 盘根错节的粗根 (3条斜根扎入盆中)
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.06, height: size.height * 0.08, tessellation: 6
    }, { position: { x: -size.width * 0.13, y: potTotalH + size.height * 0.02, z: size.depth * 0.02 }, rotation: { x: 0.2, y: 0, z: 0.5 } }, { parent: node });

    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.05, height: size.height * 0.08, tessellation: 6
    }, { position: { x: -size.width * 0.03, y: potTotalH + size.height * 0.015, z: -size.depth * 0.04 }, rotation: { x: -0.3, y: 0.2, z: -0.4 } }, { parent: node });

    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: size.height * 0.07, tessellation: 6
    }, { position: { x: -size.width * 0.07, y: potTotalH + size.height * 0.015, z: size.depth * 0.06 }, rotation: { x: 0.6, y: -0.3, z: 0.1 } }, { parent: node });

    // 6. 曲折向上的苍劲树干 (分段曲折拼接)
    const trunkH1 = size.height * 0.15;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.09, diameterBottom: size.width * 0.11, height: trunkH1, tessellation: 10
    }, { position: { x: -size.width * 0.05, y: potTotalH + trunkH1 / 2, z: 0 }, rotation: { x: 0.05, y: 0, z: -0.15 } }, { parent: node });

    const trunkH2 = size.height * 0.14;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.075, diameterBottom: size.width * 0.09, height: trunkH2, tessellation: 8
    }, { position: { x: 0, y: potTotalH + trunkH1 + trunkH2 / 2 - 0.05, z: size.depth * 0.01 }, rotation: { x: -0.05, y: 0.1, z: -0.38 } }, { parent: node });

    const trunkH3 = size.height * 0.13;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.07, height: trunkH3, tessellation: 8
    }, { position: { x: size.width * 0.07, y: potTotalH + trunkH1 + trunkH2 + trunkH3 / 2 - 0.08, z: size.depth * 0.02 }, rotation: { x: 0.05, y: -0.1, z: 0.22 } }, { parent: node });

    const trunkH4 = size.height * 0.12;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.05, height: trunkH4, tessellation: 8
    }, { position: { x: size.width * 0.04, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4 / 2 - 0.10, z: size.depth * 0.02 }, rotation: { x: -0.05, y: 0, z: 0.1 } }, { parent: node });

    // 7. 向外伸展的侧枝
    // 左大迎客枝段 1
    const branchL1 = size.width * 0.26;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.055, height: branchL1, tessellation: 6
    }, { position: { x: -size.width * 0.14, y: potTotalH + trunkH1 + 0.10, z: size.depth * 0.03 }, rotation: { x: 0.1, y: 0, z: 1.15 } }, { parent: node });

    // 左大迎客枝段 2 (平展伸出)
    const branchL2 = size.width * 0.24;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.025, diameterBottom: size.width * 0.04, height: branchL2, tessellation: 6
    }, { position: { x: -size.width * 0.32, y: potTotalH + trunkH1 - 0.22, z: size.depth * 0.05 }, rotation: { x: -0.1, y: -0.1, z: 1.4 } }, { parent: node });

    // 左侧小细分枝
    const branchL3 = size.width * 0.15;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: 0.015, diameterBottom: 0.022, height: branchL3, tessellation: 4
    }, { position: { x: -size.width * 0.24, y: potTotalH + trunkH1 - 0.05, z: -size.depth * 0.08 }, rotation: { x: -0.7, y: -0.2, z: 1.25 } }, { parent: node });

    // 右侧平衡枝 1
    const rightL1 = size.width * 0.22;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.045, height: rightL1, tessellation: 6
    }, { position: { x: size.width * 0.14, y: potTotalH + trunkH1 + trunkH2 + 0.12, z: -size.depth * 0.02 }, rotation: { x: -0.1, y: 0, z: -0.8 } }, { parent: node });

    // 右侧侧枝 2
    const rightL2 = size.width * 0.14;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: 0.015, diameterBottom: 0.022, height: rightL2, tessellation: 4
    }, { position: { x: size.width * 0.23, y: potTotalH + trunkH1 + trunkH2 + 0.30, z: size.depth * 0.06 }, rotation: { x: 0.6, y: 0.2, z: -1.0 } }, { parent: node });

    // 后侧背景枝
    const backL1 = size.height * 0.16;
    cylinderComponent(registry, item, landscapePineBonsai, 'pine-trunk', {
      diameterTop: 0.02, diameterBottom: 0.03, height: backL1, tessellation: 6
    }, { position: { x: size.width * 0.01, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.10, z: -size.depth * 0.14 }, rotation: { x: -0.8, y: 0, z: -0.1 } }, { parent: node });

    // 8. 压扁云片状松针簇 (10个层叠云片)
    // 云片 1 - 左大迎客枝末端下层 (最标志性松针)
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.45, segments: 10
    }, { position: { x: -size.width * 0.44, y: potTotalH + trunkH1 - 0.32, z: size.depth * 0.05 }, scaling: { x: 1.4, y: 0.16, z: 1.0 } }, { parent: node });

    // 云片 2 - 左大迎客枝中段上层
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.36, segments: 8
    }, { position: { x: -size.width * 0.32, y: potTotalH + trunkH1 - 0.15, z: size.depth * 0.12 }, scaling: { x: 1.25, y: 0.15, z: 0.9 } }, { parent: node });

    // 云片 3 - 左大枝后侧副叶团
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: -size.width * 0.24, y: potTotalH + trunkH1 - 0.02, z: -size.depth * 0.12 }, scaling: { x: 1.2, y: 0.14, z: 0.95 } }, { parent: node });

    // 云片 4 - 右侧主叶团
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: size.width * 0.28, y: potTotalH + trunkH1 + trunkH2 + 0.25, z: size.depth * 0.02 }, scaling: { x: 1.3, y: 0.16, z: 1.0 } }, { parent: node });

    // 云片 5 - 右后侧副叶团
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.30, segments: 8
    }, { position: { x: size.width * 0.22, y: potTotalH + trunkH1 + trunkH2 + 0.12, z: -size.depth * 0.14 }, scaling: { x: 1.15, y: 0.14, z: 0.9 } }, { parent: node });

    // 云片 6 - 顶部主树冠 (大)
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.48, segments: 10
    }, { position: { x: size.width * 0.02, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4, z: size.depth * 0.05 }, scaling: { x: 1.35, y: 0.16, z: 1.05 } }, { parent: node });

    // 云片 7 - 顶部前树冠
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.36, segments: 8
    }, { position: { x: -size.width * 0.10, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.12, z: size.depth * 0.12 }, scaling: { x: 1.2, y: 0.15, z: 0.9 } }, { parent: node });

    // 云片 8 - 顶部后树冠
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.36, segments: 8
    }, { position: { x: size.width * 0.14, y: potTotalH + trunkH1 + trunkH2 + trunkH3 + trunkH4 - 0.08, z: -size.depth * 0.08 }, scaling: { x: 1.25, y: 0.15, z: 0.95 } }, { parent: node });

    // 云片 9 - 后侧背景叶团
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.38, segments: 8
    }, { position: { x: size.width * 0.0, y: potTotalH + trunkH1 + trunkH2 + trunkH3 - 0.05, z: -size.depth * 0.25 }, scaling: { x: 1.2, y: 0.16, z: 0.95 } }, { parent: node });

    // 云片 10 - 中偏左小副叶团
    sphereComponent(registry, item, landscapePineBonsai, 'pine-leaves', {
      diameter: size.width * 0.26, segments: 8
    }, { position: { x: -size.width * 0.08, y: potTotalH + trunkH1 + trunkH2 * 0.8, z: -size.depth * 0.04 }, scaling: { x: 1.1, y: 0.14, z: 0.9 } }, { parent: node });
  }
};

export const landscapeMapleBonsai = {
  type: 'landscape_maple_bonsai',
  name: '红枫',
  defaultSize: { width: 32, depth: 22, height: 44 },
  components: [
    { id: 'maple-pot', label: '紫砂方盆', defaultColor: '#5d4037' },
    { id: 'maple-trunk', label: '嶙峋树干', defaultColor: '#3e2723' },
    { id: 'maple-leaves', label: '朱红枫叶簇', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.16;
    boxComponent(registry, item, landscapeMapleBonsai, 'maple-pot', {
      width: size.width * 0.9, height: potH, depth: size.depth * 0.9
    }, { position: { x: 0, y: potH / 2, z: 0 } }, { parent: node });

    const trunkH = size.height * 0.52;
    cylinderComponent(registry, item, landscapeMapleBonsai, 'maple-trunk', {
      diameterTop: 0.016, diameterBottom: 0.026, height: trunkH, tessellation: 8
    }, { position: { x: -size.width * 0.08, y: potH + trunkH / 2, z: 0 } }, { parent: node });

    const clusterY = potH + trunkH;
    sphereComponent(registry, item, landscapeMapleBonsai, 'maple-leaves', {
      diameter: size.width * 0.42, segments: 8
    }, { position: { x: -size.width * 0.02, y: clusterY, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeMapleBonsai, 'maple-leaves', {
      diameter: size.width * 0.15, y: clusterY + size.height * 0.12, z: size.depth * 0.12 }
    );
  }
};

export const landscapeMossMicro = {
  type: 'landscape_moss_micro',
  name: '微景观',
  defaultSize: { width: 14, depth: 14, height: 18 },
  components: [
    { id: 'moss-glass', label: '高硼硅玻璃罩', defaultColor: '#e0f2f1' },
    { id: 'moss-green', label: '鲜活苔藓层', defaultColor: '#558b2f' },
    { id: 'moss-decor', label: '红伞小草莓/蘑菇', defaultColor: '#d84315' }
  ],
  build(registry, item, node, size) {
    sphereComponent(registry, item, landscapeMossMicro, 'moss-glass', {
      diameter: size.width, segments: 12
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const mossD = size.width * 0.88;
    sphereComponent(registry, item, landscapeMossMicro, 'moss-green', {
      diameter: mossD, segments: 8
    }, { position: { x: 0, y: size.height * 0.35, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeMossMicro, 'moss-decor', {
      diameter: size.width * 0.2, segments: 6
    }, { position: { x: -size.width * 0.15, y: size.height * 0.48, z: size.depth * 0.08 } }, { parent: node });
  }
};

export const arecaPalmPlant = {
  type: 'areca_palm_plant',
  name: '散尾葵',
  defaultSize: { width: 30, depth: 30, height: 56 },
  components: [
    { id: 'areca-pot', label: '高烤漆方花盆', defaultColor: '#fafafa' },
    { id: 'areca-stems', label: '丛生棕茎', defaultColor: '#7cb342' },
    { id: 'areca-leaves', label: '翠绿羽状叶', defaultColor: '#2e7d32' }
  ],
  build(registry, item, node, size) {
    const potH = size.height * 0.35;
    
    // 1. 组合构建上宽下窄的方形渐变盆 (4段式堆叠)
    const potW = size.width * 0.32;
    const potD = size.depth * 0.32;
    const steps = 4;
    const stepH = potH / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = 0.72 + (i / (steps - 1)) * 0.28; // 宽度从底部的 72% 渐变到顶部的 100%
      boxComponent(registry, item, arecaPalmPlant, 'areca-pot', {
        width: potW * ratio,
        height: stepH,
        depth: potD * ratio
      }, {
        position: { x: 0, y: stepH * (i + 0.5), z: 0 }
      }, { parent: node });
    }

    // 2. 丛生茎干与其羽状叶片
    const stemCount = 8;
    for (let i = 0; i < stemCount; i++) {
      // 围绕中心交错分布的偏航角
      const angleY = (i * Math.PI * 2) / stemCount + (i % 2 === 0 ? 0.15 : -0.1);
      // 茎的外翻倾斜度 (弧度，约 12 到 24 度)
      const tilt = 0.22 + (i % 3) * 0.06;
      // 茎的高度随机微调，形成错落感
      const stemH = size.height * (0.45 + (i % 3) * 0.08);

      const dirX = Math.sin(angleY);
      const dirZ = Math.cos(angleY);

      // 茎的底部丛生在一起，但在土表带有一点点交错偏移
      const rootOffset = size.width * 0.03;
      const rootX = dirX * rootOffset;
      const rootZ = dirZ * rootOffset;

      // 茎的顶部终点
      const endX = rootX + dirX * stemH * Math.sin(tilt);
      const endZ = rootZ + dirZ * stemH * Math.sin(tilt);
      const endY = potH + stemH * Math.cos(tilt);

      // 计算茎的中心点
      const centerX = (rootX + endX) / 2;
      const centerZ = (rootZ + endZ) / 2;
      const centerY = (potH + endY) / 2;

      // 绘制长茎
      cylinderComponent(registry, item, arecaPalmPlant, 'areca-stems', {
        diameterTop: size.width * 0.008,
        diameterBottom: size.width * 0.018,
        height: stemH,
        tessellation: 6
      }, {
        position: { x: centerX, y: centerY, z: centerZ },
        // Z轴旋转控制左右倾斜，X轴旋转控制前后倾斜
        rotation: { x: dirZ * tilt, y: 0, z: -dirX * tilt }
      }, { parent: node });

      // 3. 在每根茎的上半段，程序化拼装两侧向外展的羽状叶
      // 在茎 35% ~ 100% 长度的区间上，排布 6 对（12片）小叶片
      const leafPairs = 6;
      const startPct = 0.35;
      for (let j = 0; j < leafPairs; j++) {
        const pct = startPct + ((1 - startPct) * j) / (leafPairs - 1);
        const currentH = stemH * pct;
        
        // 沿茎中心线的叶片起始位置
        const lpX = rootX + dirX * currentH * Math.sin(tilt);
        const lpZ = rootZ + dirZ * currentH * Math.sin(tilt);
        const lpY = potH + currentH * Math.cos(tilt);

        // 叶片长度随着位置越往茎梢而越短，形成自然的梭形/羽毛形叶冠
        const leafLen = size.width * 0.22 * (1.1 - pct * 0.5);
        const leafWidth = size.width * 0.045 * (1.0 - pct * 0.3);

        // 与茎走向垂直的横向向量
        const sideX = -dirZ;
        const sideZ = dirX;

        // 左右两片叶子的中点位置
        const offset = leafLen * 0.45; // 偏离主干一点
        const leftX = lpX + sideX * offset;
        const leftZ = lpZ + sideZ * offset;
        const rightX = lpX - sideX * offset;
        const rightZ = lpZ - sideZ * offset;

        // 叶片下垂角度：随着高度增加，叶片因为重力更加向下倾斜
        const droop = 0.15 + pct * 0.25;

        // 左侧叶片
        boxComponent(registry, item, arecaPalmPlant, 'areca-leaves', {
          width: leafWidth,
          height: size.height * 0.003,
          depth: leafLen
        }, {
          position: { x: leftX, y: lpY - Math.sin(droop) * offset, z: leftZ },
          rotation: {
            x: -sideZ * droop + dirZ * 0.1,
            y: angleY + Math.PI / 2 + 0.2, // 微微朝向侧外方
            z: sideX * droop - dirX * 0.1
          }
        }, { parent: node });

        // 右侧叶片
        boxComponent(registry, item, arecaPalmPlant, 'areca-leaves', {
          width: leafWidth,
          height: size.height * 0.003,
          depth: leafLen
        }, {
          position: { x: rightX, y: lpY - Math.sin(droop) * offset, z: rightZ },
          rotation: {
            x: sideZ * droop + dirZ * 0.1,
            y: angleY - Math.PI / 2 - 0.2, // 微微朝向侧外方
            z: -sideX * droop - dirX * 0.1
          }
        }, { parent: node });
      }
    }
  }
};
