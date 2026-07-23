import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

// 1. 简约吸顶灯 (Ceiling Light)
export const ceilingLight = {
  type: 'ceiling_light',
  name: '吸顶灯',
  placeType: 'ceiling',
  defaultSize: { width: 16, depth: 16, height: 4 },
  emissiveComponents: ['bulb', 'glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -2, z: 0 },
    color: '#fffbe6',
    intensity: 0.9,
    range: 200
  },
  components: [
    { id: 'base', label: '吸顶底盘', defaultColor: '#dcdcdc' },
    { id: 'glow', label: '亚克力灯罩', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.25;
    const glowH = size.height * 0.75;

    // 吸顶底盘
    cylinderComponent(registry, item, ceilingLight, 'base', {
      diameterTop: size.width * 0.95, diameterBottom: size.width, height: baseH, tessellation: 24
    }, { position: { x: 0, y: size.height - baseH / 2, z: 0 } }, { parent: node });

    // 亚克力发光罩
    cylinderComponent(registry, item, ceilingLight, 'glow', {
      diameterTop: size.width * 0.88, diameterBottom: size.width * 0.82, height: glowH, tessellation: 24
    }, { position: { x: 0, y: (size.height - baseH) - glowH / 2, z: 0 } }, { parent: node });
  }
};

// 2. 豪华吊灯 (Chandelier)
export const chandelierLight = {
  type: 'chandelier_light',
  name: '吊灯',
  placeType: 'ceiling',
  defaultSize: { width: 24, depth: 24, height: 32 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -16, z: 0 },
    color: '#fffae6',
    intensity: 1.0,
    range: 240
  },
  components: [
    { id: 'rod', label: '金属吊杆', defaultColor: '#434343' },
    { id: 'hub', label: '中心分线器', defaultColor: '#c5a059' },
    { id: 'arm', label: '弯曲灯臂', defaultColor: '#aa8040' },
    { id: 'bulb', label: '发光灯泡', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const rodH = size.height * 0.45;
    const hubH = size.height * 0.1;
    const armH = size.height * 0.3;
    const bulbD = size.width * 0.12;

    // 吊杆
    cylinderComponent(registry, item, chandelierLight, 'rod', {
      diameterTop: size.width * 0.03, diameterBottom: size.width * 0.03, height: rodH, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });

    // 中心接线盒
    cylinderComponent(registry, item, chandelierLight, 'hub', {
      diameterTop: size.width * 0.25, diameterBottom: size.width * 0.25, height: hubH, tessellation: 12
    }, { position: { x: 0, y: size.height - rodH - hubH / 2, z: 0 } }, { parent: node });

    // 灯臂与灯泡拼接（四角伸展）
    const offsetDist = size.width * 0.35;
    const directions = [
      { x: 1, z: 1 },
      { x: -1, z: 1 },
      { x: 1, z: -1 },
      { x: -1, z: -1 }
    ];

    directions.forEach((dir, index) => {
      // 斜灯臂
      const armX = dir.x * offsetDist * 0.5;
      const armZ = dir.z * offsetDist * 0.5;
      const armY = size.height - rodH - hubH - armH * 0.5;

      cylinderComponent(registry, item, chandelierLight, 'arm', {
        diameterTop: size.width * 0.02, diameterBottom: size.width * 0.03, height: armH, tessellation: 8
      }, { position: { x: armX, y: armY, z: armZ } }, { parent: node });

      // 灯头灯泡
      const bulbX = dir.x * offsetDist;
      const bulbZ = dir.z * offsetDist;
      const bulbY = size.height - rodH - hubH - armH + bulbD / 2;

      sphereComponent(registry, item, chandelierLight, 'bulb', {
        diameter: bulbD, segments: 12
      }, { position: { x: bulbX, y: bulbY, z: bulbZ } }, { parent: node });
    });
  }
};

// 3. 北欧壁挂灯 (Wall Sconce)
export const wallSconceLight = {
  type: 'wall_sconce_light',
  name: '壁灯',
  defaultSize: { width: 8, depth: 10, height: 12 },
  placeType: 'wall',
  emissiveComponents: ['bulb', 'glow'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'spot',
    offset: { x: 0, y: -2, z: 6 },
    direction: { x: 0, y: -1, z: 0.1 },
    angle: Math.PI / 3,
    exponent: 2.5,
    color: '#fffae6',
    intensity: 0.85,
    range: 120
  },
  components: [
    { id: 'mount', label: '上墙底座', defaultColor: '#2b2b2b' },
    { id: 'arm', label: '悬挂弯管', defaultColor: '#bf9c60' },
    { id: 'shade', label: '金属罩', defaultColor: '#424242' },
    { id: 'bulb', label: '发光泡', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const mountD = size.depth * 0.15;
    const shadeH = size.height * 0.4;
    const bulbD = size.width * 0.35;

    // 靠墙底盘
    boxComponent(registry, item, wallSconceLight, 'mount', {
      width: size.width * 0.6, height: size.height * 0.4, depth: mountD
    }, { position: { x: 0, y: size.height * 0.5, z: -size.depth / 2 + mountD / 2 } }, { parent: node });

    // 伸出的弯杆
    cylinderComponent(registry, item, wallSconceLight, 'arm', {
      diameterTop: size.width * 0.05, diameterBottom: size.width * 0.05, height: size.depth * 0.7, tessellation: 8
    }, { position: { x: 0, y: size.height * 0.62, z: -size.depth * 0.1 } }, { parent: node });
    const armMesh = node.getChildren().find(child => child.name.includes('arm'));
    if (armMesh) {
      armMesh.rotation.x = Math.PI * 0.5;
    }

    // 灯罩
    cylinderComponent(registry, item, wallSconceLight, 'shade', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.95, height: shadeH, tessellation: 16
    }, { position: { x: 0, y: size.height * 0.62 - shadeH / 2, z: size.depth / 2 - size.width * 0.4 } }, { parent: node });

    // 灯泡
    sphereComponent(registry, item, wallSconceLight, 'bulb', {
      diameter: bulbD, segments: 12
    }, { position: { x: 0, y: size.height * 0.62 - shadeH, z: size.depth / 2 - size.width * 0.4 } }, { parent: node });
  }
};

// 4. 现代落地灯 (Floor Lamp)
export const floorLampLight = {
  type: 'floor_lamp_light',
  name: '落地灯',
  defaultSize: { width: 14, depth: 14, height: 64 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 30, z: 0 },
    color: '#fffae6',
    intensity: 0.85,
    range: 160
  },
  components: [
    { id: 'base', label: '落地底座', defaultColor: '#303030' },
    { id: 'pole', label: '修长立杆', defaultColor: '#1d1d1d' },
    { id: 'shade', label: '布艺外罩', defaultColor: '#ece7db' },
    { id: 'glow', label: '发光内侧', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.03;
    const shadeH = size.height * 0.16;
    const poleH = size.height * 0.81;

    // 底座
    cylinderComponent(registry, item, floorLampLight, 'base', {
      diameterTop: size.width * 0.85, diameterBottom: size.width * 0.9, height: baseH, tessellation: 20
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 立杆
    cylinderComponent(registry, item, floorLampLight, 'pole', {
      diameterTop: size.width * 0.06, diameterBottom: size.width * 0.08, height: poleH, tessellation: 12
    }, { position: { x: 0, y: baseH + poleH / 2, z: 0 } }, { parent: node });

    // 灯罩
    cylinderComponent(registry, item, floorLampLight, 'shade', {
      diameterTop: size.width * 0.75, diameterBottom: size.width * 0.95, height: shadeH, tessellation: 20
    }, { position: { x: 0, y: size.height - shadeH / 2, z: 0 } }, { parent: node });

    // 内部发光芯
    cylinderComponent(registry, item, floorLampLight, 'glow', {
      diameterTop: size.width * 0.45, diameterBottom: size.width * 0.55, height: shadeH * 0.8, tessellation: 12
    }, { position: { x: 0, y: size.height - shadeH * 0.9, z: 0 } }, { parent: node });
  }
};

// 5. 弧形落地灯：独立 type 保留旧直杆灯存档兼容性。
export const arcFloorLampLight = {
  type: 'arc_floor_lamp_light',
  name: '弧形落地灯',
  defaultSize: { width: 36, depth: 16, height: 64 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 14, y: 48, z: 0 },
    color: '#fffae6',
    intensity: 0.85,
    range: 160
  },
  components: [
    { id: 'base', label: '落地底座', defaultColor: '#303030' },
    { id: 'pole', label: '弧形灯臂', defaultColor: '#1d1d1d' },
    { id: 'shade', label: '悬挂灯罩', defaultColor: '#ece7db' },
    { id: 'glow', label: '发光内侧', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.03;
    cylinderComponent(registry, item, arcFloorLampLight, 'base', {
      diameterTop: size.depth * 0.72, diameterBottom: size.depth * 0.8,
      height: baseH, tessellation: 24
    }, { position: { x: -size.width * 0.32, y: baseH / 2, z: 0 } }, { parent: node });

    const points = [];
    const segments = 10;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const angle = Math.PI * 0.5 * t;
      points.push({
        x: -size.width * 0.32 + size.width * 0.7 * (1 - Math.cos(angle)),
        y: baseH + size.height * 0.82 * Math.sin(angle),
        z: 0
      });
    }
    for (let index = 0; index < segments; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      const segment = cylinderComponent(registry, item, arcFloorLampLight, 'pole', {
        diameterTop: size.depth * 0.055, diameterBottom: size.depth * 0.055,
        height: length * 1.04, tessellation: 12
      }, { position: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, z: 0 } }, { parent: node });
      segment.rotation.z = -Math.atan2(dx, dy);
    }

    const shadeH = size.height * 0.15;
    const lampX = size.width * 0.38;
    const lampY = size.height * 0.82;
    cylinderComponent(registry, item, arcFloorLampLight, 'shade', {
      diameterTop: size.depth * 0.48, diameterBottom: size.depth * 0.86,
      height: shadeH, tessellation: 24
    }, { position: { x: lampX, y: lampY - shadeH / 2, z: 0 } }, { parent: node });
    cylinderComponent(registry, item, arcFloorLampLight, 'glow', {
      diameterTop: size.depth * 0.34, diameterBottom: size.depth * 0.5,
      height: shadeH * 0.7, tessellation: 16
    }, { position: { x: lampX, y: lampY - shadeH * 0.82, z: 0 } }, { parent: node });
  }
};

// 6. 折角护眼台灯 (Desk Lamp)
export const deskLampLight = {
  type: 'desk_lamp_light',
  name: '台灯',
  defaultSize: { width: 8, depth: 10, height: 16 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'spot',
    offset: { x: 0, y: 7, z: 3 },
    direction: { x: 0.2, y: -1, z: 0.2 },
    angle: Math.PI / 4,
    exponent: 2.0,
    color: '#fffbe6',
    intensity: 0.9,
    range: 100
  },
  components: [
    { id: 'base', label: '台面底座', defaultColor: '#607d8b' },
    { id: 'arm', label: '调节折杆', defaultColor: '#cfd8dc' },
    { id: 'shade', label: '深口灯罩', defaultColor: '#546e7a' },
    { id: 'bulb', label: '发光LED', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.08;
    const shadeH = size.height * 0.25;
    const armH = size.height * 0.67;

    // 底盘
    cylinderComponent(registry, item, deskLampLight, 'base', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.78, height: baseH, tessellation: 16
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 斜折弯杆
    cylinderComponent(registry, item, deskLampLight, 'arm', {
      diameterTop: size.width * 0.04, diameterBottom: size.width * 0.04, height: armH, tessellation: 8
    }, { position: { x: -size.width * 0.12, y: baseH + armH / 2, z: -size.depth * 0.05 } }, { parent: node });
    const armMesh = node.getChildren().find(child => child.name.includes('arm'));
    if (armMesh) {
      armMesh.rotation.x = Math.PI * 0.08;
      armMesh.rotation.z = -Math.PI * 0.05;
    }

    // 灯罩
    const shadeMesh = cylinderComponent(registry, item, deskLampLight, 'shade', {
      diameterTop: size.width * 0.44, diameterBottom: size.width * 0.75, height: shadeH, tessellation: 16
    }, { position: { x: 0, y: size.height - shadeH / 2, z: size.depth * 0.2 } }, { parent: node });
    if (shadeMesh) {
      shadeMesh.rotation.x = -Math.PI * 0.1;
      shadeMesh.rotation.z = Math.PI * 0.1; 
    }

    // 发光LED，将 parent 设置为 shadeMesh，使其在局部坐标系中始终跟灯罩轴线对齐
    sphereComponent(registry, item, deskLampLight, 'bulb', {
      diameter: size.width * 0.3, segments: 10
    }, { position: { x: 0, y: -shadeH * 0.22, z: 0 } }, { parent: shadeMesh });
  }
};

// 6. 温馨床头台灯 (Bedside Lamp)
export const bedsideLampLight = {
  type: 'bedside_lamp_light',
  name: '床头灯',
  defaultSize: { width: 10, depth: 10, height: 14 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 3, z: 0 },
    color: '#ffe6b3',
    intensity: 0.7,
    range: 120
  },
  components: [
    { id: 'ceramic', label: '陶瓷底座', defaultColor: '#e0dfdb' },
    { id: 'glow', label: '褶皱布灯罩', defaultColor: '#ffebd2' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.42;
    const shadeH = size.height * 0.58;

    // 陶瓷瓶底座
    cylinderComponent(registry, item, bedsideLampLight, 'ceramic', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.75, height: baseH, tessellation: 16
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 褶皱布灯罩
    cylinderComponent(registry, item, bedsideLampLight, 'glow', {
      diameterTop: size.width * 0.78, diameterBottom: size.width * 0.98, height: shadeH, tessellation: 20
    }, { position: { x: 0, y: baseH + shadeH / 2, z: 0 } }, { parent: node });
  }
};

// 7. 轨道射灯 (Track Spotlight)
export const trackLight = {
  type: 'track_light',
  name: '轨道灯',
  placeType: 'ceiling',
  defaultSize: { width: 36, depth: 4, height: 8 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -6, z: 0 },
    color: '#ffffff',
    intensity: 0.95,
    range: 180
  },
  components: [
    { id: 'rail', label: '挂载导轨', defaultColor: '#1a1a1a' },
    { id: 'body', label: '筒灯壳', defaultColor: '#2b2b2b' },
    { id: 'bulb', label: '强光镜片', defaultColor: '#fcfcfc' }
  ],
  build(registry, item, node, size) {
    const railH = size.height * 0.15;
    const bodyH = size.height * 0.45;
    const bulbD = size.depth * 0.6;

    // 轨道横梁
    boxComponent(registry, item, trackLight, 'rail', {
      width: size.width, height: railH, depth: size.depth * 0.4
    }, { position: { x: 0, y: size.height - railH / 2, z: 0 } }, { parent: node });

    // 3 个筒灯
    const spots = [-size.width * 0.32, 0, size.width * 0.32];
    const angles = [Math.PI * 0.08, -Math.PI * 0.04, Math.PI * 0.12];

    spots.forEach((posX, idx) => {
      const rotZ = angles[idx];

      // 筒座
      cylinderComponent(registry, item, trackLight, 'body', {
        diameterTop: size.depth * 0.8, diameterBottom: size.depth * 0.8, height: bodyH, tessellation: 12
      }, { position: { x: posX, y: size.height - railH - bodyH / 2, z: 0 } }, { parent: node });

      // 发光镜片
      sphereComponent(registry, item, trackLight, 'bulb', {
        diameter: bulbD, segments: 10
      }, { position: { x: posX - Math.sin(rotZ) * 0.1, y: size.height - railH - bodyH, z: 0 } }, { parent: node });
    });
  }
};

// 8. 霓虹氛围壁灯 (Neon Wall Lamp)
export const neonSignLight = {
  type: 'neon_sign_light',
  name: '霓虹灯',
  defaultSize: { width: 20, depth: 2, height: 20 },
  placeType: 'wall',
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 0, z: 2 },
    color: '#33ffcc',
    intensity: 0.7,
    range: 120
  },
  components: [
    { id: 'mount', label: '壁挂骨架', defaultColor: '#121212' },
    { id: 'glow', label: '霓虹灯管', defaultColor: '#33ffcc' }
  ],
  build(registry, item, node, size) {
    const mountT = 0.02;

    // 壁挂背架
    boxComponent(registry, item, neonSignLight, 'mount', {
      width: size.width * 0.85, height: size.height * 0.85, depth: mountT
    }, { position: { x: 0, y: size.height * 0.5, z: -size.depth / 2 + mountT / 2 } }, { parent: node });

    const neonRadius = size.width * 0.18;
    const neonThickness = size.width * 0.05;

    // 左心房
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2, tessellation: 8
    }, { position: { x: -neonRadius * 0.75, y: size.height * 0.58, z: 0.03 } }, { parent: node });

    // 右心房
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2, tessellation: 8
    }, { position: { x: neonRadius * 0.75, y: size.height * 0.58, z: 0.03 } }, { parent: node });

    // 心尖左
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2.8, tessellation: 8
    }, { position: { x: -neonRadius * 0.88, y: size.height * 0.32, z: 0.03 } }, { parent: node });
    const tipL = node.getChildren().filter(c => c.name.includes('glow'))[2];
    if (tipL) tipL.rotation.z = Math.PI * 0.18;

    // 心尖右
    cylinderComponent(registry, item, neonSignLight, 'glow', {
      diameterTop: neonThickness, diameterBottom: neonThickness, height: neonRadius * 2.8, tessellation: 8
    }, { position: { x: neonRadius * 0.88, y: size.height * 0.32, z: 0.03 } }, { parent: node });
    const tipR = node.getChildren().filter(c => c.name.includes('glow'))[3];
    if (tipR) tipR.rotation.z = -Math.PI * 0.18;
  }
};

// 9. 和风纸球吊灯 (Globe Pendant Lamp)
export const globePendantLight = {
  type: 'globe_pendant_light',
  name: '纸吊灯',
  placeType: 'ceiling',
  defaultSize: { width: 18, depth: 18, height: 36 },
  emissiveComponents: ['glow'],
  lightColorComponent: 'glow',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: -12, z: 0 },
    color: '#fffae6',
    intensity: 0.8,
    range: 180
  },
  components: [
    { id: 'cord', label: '黑色吊绳', defaultColor: '#1d1d1d' },
    { id: 'glow', label: '和风纸外罩', defaultColor: '#fbfbf8' }
  ],
  build(registry, item, node, size) {
    const cordH = size.height * 0.5;
    const sphereD = size.width;

    // 吊绳
    cylinderComponent(registry, item, globePendantLight, 'cord', {
      diameterTop: size.width * 0.02, diameterBottom: size.width * 0.02, height: cordH, tessellation: 6
    }, { position: { x: 0, y: size.height - cordH / 2, z: 0 } }, { parent: node });

    // 纸圆球灯罩
    sphereComponent(registry, item, globePendantLight, 'glow', {
      diameter: sphereD, segments: 16
    }, { position: { x: 0, y: size.height - cordH - sphereD / 2, z: 0 } }, { parent: node });
  }
};

// 10. 趣味熔岩灯 (Lava Lamp)
export const lavaLampLight = {
  type: 'lava_lamp_light',
  name: '熔岩灯',
  defaultSize: { width: 6, depth: 6, height: 18 },
  emissiveComponents: ['glow', 'lava'],
  lightColorComponent: 'lava',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 9, z: 0 },
    color: '#ff33aa',
    intensity: 0.8,
    range: 100
  },
  components: [
    { id: 'base', label: '金属底盘', defaultColor: '#a1a1a1' },
    { id: 'glass', label: '隔热玻璃', defaultColor: '#ffffff' },
    { id: 'glow', label: '熔岩彩灯', defaultColor: '#ff99ff' },
    { id: 'lava', label: '熔岩水母', defaultColor: '#ff33aa' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.22;
    const capH = size.height * 0.12;
    const bodyH = size.height * 0.66;

    // 金属底座
    cylinderComponent(registry, item, lavaLampLight, 'base', {
      diameterTop: size.width * 0.72, diameterBottom: size.width * 0.98, height: baseH, tessellation: 16
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 玻璃杯柱
    cylinderComponent(registry, item, lavaLampLight, 'glass', {
      diameterTop: size.width * 0.6, diameterBottom: size.width * 0.72, height: bodyH, tessellation: 16
    }, { position: { x: 0, y: baseH + bodyH / 2, z: 0 } }, { parent: node });

    // 金属顶帽
    cylinderComponent(registry, item, lavaLampLight, 'base', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.62, height: capH, tessellation: 16
    }, { position: { x: 0, y: size.height - capH / 2, z: 0 } }, { parent: node });

    // 发光底部光源片
    cylinderComponent(registry, item, lavaLampLight, 'glow', {
      diameterTop: size.width * 0.68, diameterBottom: size.width * 0.68, height: 0.04, tessellation: 12
    }, { position: { x: 0, y: baseH + 0.02, z: 0 } }, { parent: node });

    // 熔岩块 1
    sphereComponent(registry, item, lavaLampLight, 'lava', {
      diameter: size.width * 0.42, segments: 10
    }, { position: { x: 0, y: baseH + bodyH * 0.32, z: 0 } }, { parent: node });

    // 熔岩块 2
    sphereComponent(registry, item, lavaLampLight, 'lava', {
      diameter: size.width * 0.32, segments: 8
    }, { position: { x: size.width * 0.08, y: baseH + bodyH * 0.75, z: -size.width * 0.04 } }, { parent: node });
  }
};

// 11. 庭院灯柱 (Garden Lantern Post)
export const gardenLanternPostFurniture = {
  type: 'garden_lantern_post',
  name: '庭院灯柱',
  defaultSize: { width: 14, depth: 14, height: 84 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 74, z: 0 },
    color: '#fffae6',
    intensity: 0.85,
    range: 160
  },
  components: [
    { id: 'base', label: '底座', defaultColor: '#75777d' },
    { id: 'pole', label: '灯柱', defaultColor: '#555a62' },
    { id: 'glass', label: '玻璃罩', defaultColor: '#ffffff' },
    { id: 'cap', label: '顶盖', defaultColor: '#3a3a3a' },
    { id: 'bulb', label: '灯泡', defaultColor: '#f7e5a6' }
  ],
  build(registry, item, node, size) {
    // 底座
    boxComponent(registry, item, gardenLanternPostFurniture, 'base', {
      width: size.width * 0.6,
      height: size.height * 0.08,
      depth: size.depth * 0.6
    }, { position: { x: 0, y: size.height * 0.04, z: 0 } }, { parent: node });

    // 灯柱
    cylinderComponent(registry, item, gardenLanternPostFurniture, 'pole', {
      diameterTop: 0.04,
      diameterBottom: 0.05,
      height: size.height * 0.78,
      tessellation: 16
    }, { position: { x: 0, y: size.height * 0.47, z: 0 } }, { parent: node });

    const lampH = size.height * 0.14;
    const lampY = size.height * 0.88;
    const glassW = size.width * 0.8;
    const glassD = size.depth * 0.8;
    const t = 0.01; // 玻璃厚度

    // 前玻璃罩
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: glassW, height: lampH - t, depth: t
    }, { position: { x: 0, y: lampY - t / 2, z: -glassD / 2 + t / 2 } }, { parent: node });

    // 后玻璃罩
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: glassW, height: lampH - t, depth: t
    }, { position: { x: 0, y: lampY - t / 2, z: glassD / 2 - t / 2 } }, { parent: node });

    // 左玻璃罩
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: t, height: lampH - t, depth: glassD - t * 2
    }, { position: { x: -glassW / 2 + t / 2, y: lampY - t / 2, z: 0 } }, { parent: node });

    // 右玻璃罩
    boxComponent(registry, item, gardenLanternPostFurniture, 'glass', {
      width: t, height: lampH - t, depth: glassD - t * 2
    }, { position: { x: glassW / 2 - t / 2, y: lampY - t / 2, z: 0 } }, { parent: node });

    // 顶盖
    boxComponent(registry, item, gardenLanternPostFurniture, 'cap', {
      width: size.width,
      height: t * 2,
      depth: size.depth
    }, { position: { x: 0, y: lampY + lampH / 2 - t, z: 0 } }, { parent: node });

    // 灯泡 (发光体)
    sphereComponent(registry, item, gardenLanternPostFurniture, 'bulb', {
      diameter: size.width * 0.35, segments: 12
    }, { position: { x: 0, y: lampY, z: 0 } }, { parent: node });
  }
};

// 12. 庭院地灯 (Garden Bollard Light)
export const gardenBollardLightFurniture = {
  type: 'garden_bollard_light',
  name: '庭院地灯',
  defaultSize: { width: 8, depth: 8, height: 20 },
  emissiveComponents: ['bulb'],
  lightColorComponent: 'bulb',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 14, z: 0 },
    color: '#ffebb3',
    intensity: 0.7,
    range: 120
  },
  components: [
    { id: 'base', label: '底座', defaultColor: '#474747' },
    { id: 'pole', label: '立柱', defaultColor: '#5c5c5c' },
    { id: 'glass', label: '玻璃罩', defaultColor: '#ffffff' },
    { id: 'cap', label: '顶盖', defaultColor: '#3a3a3a' },
    { id: 'bulb', label: '灯泡', defaultColor: '#ffebb3' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.1;
    const poleH = size.height * 0.4;
    const glassH = size.height * 0.4;
    const capH = size.height * 0.1;

    // 底座
    boxComponent(registry, item, gardenBollardLightFurniture, 'base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 立柱
    cylinderComponent(registry, item, gardenBollardLightFurniture, 'pole', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.35, height: poleH, tessellation: 12
    }, { position: { x: 0, y: baseH + poleH / 2, z: 0 } }, { parent: node });

    const glassY = baseH + poleH + glassH / 2;
    const glassW = size.width * 0.78;
    const glassD = size.depth * 0.78;
    const t = 0.01;

    // 前玻璃罩
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: glassW, height: glassH - t, depth: t
    }, { position: { x: 0, y: glassY - t / 2, z: -glassD / 2 + t / 2 } }, { parent: node });

    // 后玻璃罩
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: glassW, height: glassH - t, depth: t
    }, { position: { x: 0, y: glassY - t / 2, z: glassD / 2 - t / 2 } }, { parent: node });

    // 左玻璃罩
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: t, height: glassH - t, depth: glassD - t * 2
    }, { position: { x: -glassW / 2 + t / 2, y: glassY - t / 2, z: 0 } }, { parent: node });

    // 右玻璃罩
    boxComponent(registry, item, gardenBollardLightFurniture, 'glass', {
      width: t, height: glassH - t, depth: glassD - t * 2
    }, { position: { x: glassW / 2 - t / 2, y: glassY - t / 2, z: 0 } }, { parent: node });

    // 顶盖
    boxComponent(registry, item, gardenBollardLightFurniture, 'cap', {
      width: size.width * 1.1, height: capH, depth: size.depth * 1.1
    }, { position: { x: 0, y: baseH + poleH + glassH + capH / 2, z: 0 } }, { parent: node });

    // 灯泡
    sphereComponent(registry, item, gardenBollardLightFurniture, 'bulb', {
      diameter: size.width * 0.3, segments: 12
    }, { position: { x: 0, y: baseH + poleH + glassH / 2, z: 0 } }, { parent: node });
  }
};

// 13. 庭院灯笼 (Garden Lantern)
export const gardenLanternFurniture = {
  type: 'garden_lantern',
  name: '庭院灯笼',
  defaultSize: { width: 12, depth: 12, height: 24 },
  emissiveComponents: ['paper'],
  lightColorComponent: 'paper',
  lightSource: {
    type: 'point',
    offset: { x: 0, y: 11, z: 0 },
    color: '#ffe6b3',
    intensity: 0.8,
    range: 140
  },
  components: [
    { id: 'base', label: '底座', defaultColor: '#807d79' },
    { id: 'body', label: '网格架', defaultColor: '#4a443a' },
    { id: 'paper', label: '透光罩', defaultColor: '#fffae6' },
    { id: 'roof', label: '灯顶盖', defaultColor: '#6e6659' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    const lanternH = size.height * 0.7;
    const roofH = size.height * 0.15;

    // 底座
    boxComponent(registry, item, gardenLanternFurniture, 'base', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyY = baseH + lanternH / 2;
    const postW = 0.02;
    // 四角立柱支架
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, gardenLanternFurniture, 'body', {
          width: postW, height: lanternH, depth: postW
        }, { position: { x: xSide * (size.width / 2 - postW / 2), y: bodyY, z: zSide * (size.depth / 2 - postW / 2) } }, { parent: node });
      });
    });

    // 透光发光罩
    boxComponent(registry, item, gardenLanternFurniture, 'paper', {
      width: size.width * 0.76, height: lanternH * 0.9, depth: size.depth * 0.76
    }, { position: { x: 0, y: bodyY, z: 0 } }, { parent: node });

    // 灯顶盖
    boxComponent(registry, item, gardenLanternFurniture, 'roof', {
      width: size.width * 1.15, height: roofH, depth: size.depth * 1.15
    }, { position: { x: 0, y: baseH + lanternH + roofH / 2, z: 0 } }, { parent: node });
  }
};

export const lampFurniture = {
  type: 'lamp',
  name: '落地灯',
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

export const chandelierFurniture = {
  type: 'chandelier',
  name: '吸顶吊灯',
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

export const landscapeStoneLantern = {
  type: 'landscape_stone_lantern',
  name: '石灯笼',
  defaultSize: { width: 16, depth: 16, height: 36 },
  components: [
    { id: 'lantern-stone', label: '花岗岩石材', defaultColor: '#b0bec5' },
    { id: 'lantern-light', label: '火舍灯光', defaultColor: '#ffe082' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.15;
    boxComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const pillarH = size.height * 0.35;
    cylinderComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      diameterTop: size.width * 0.4, diameterBottom: size.width * 0.5, height: pillarH, tessellation: 12
    }, { position: { x: 0, y: baseH + pillarH / 2, z: 0 } }, { parent: node });

    const midH = size.height * 0.1;
    boxComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      width: size.width * 0.9, height: midH, depth: size.depth * 0.9
    }, { position: { x: 0, y: baseH + pillarH + midH / 2, z: 0 } }, { parent: node });

    const lightH = size.height * 0.18;
    cylinderComponent(registry, item, landscapeStoneLantern, 'lantern-light', {
      diameterTop: size.width * 0.5, diameterBottom: size.width * 0.5, height: lightH, tessellation: 6
    }, { position: { x: 0, y: baseH + pillarH + midH + lightH / 2, z: 0 } }, { parent: node });

    const roofH = size.height * 0.15;
    cylinderComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      diameterTop: 0.01, diameterBottom: size.width * 1.1, height: roofH, tessellation: 6
    }, { position: { x: 0, y: baseH + pillarH + midH + lightH + roofH / 2, z: 0 } }, { parent: node });

    const jewelH = size.height * 0.07;
    sphereComponent(registry, item, landscapeStoneLantern, 'lantern-stone', {
      diameter: size.width * 0.25, segments: 8
    }, { position: { x: 0, y: size.height - jewelH, z: 0 } }, { parent: node });
  }
};
