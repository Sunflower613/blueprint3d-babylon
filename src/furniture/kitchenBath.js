import { boxComponent, cylinderComponent } from './_helpers.js';

// 1. 双门冰箱 (Fridge)
export const fridgeFurniture = {
  type: 'fridge',
  name: '双门冰箱',
  defaultSize: { width: 32, depth: 30, height: 70 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#c7cfd6' },
    { id: 'display', label: '控制面板', defaultColor: '#1f2224' },
    { id: 'handles', label: '把手', defaultColor: '#5b6166' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, fridgeFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const gapHeight = 0.015;
    const gapY = size.height * 0.42;
    boxComponent(registry, item, fridgeFurniture, 'handles', {
      width: size.width + 0.004, height: gapHeight, depth: 0.01
    }, { position: { x: 0, y: gapY, z: size.depth / 2 + 0.005 } }, { parent: node });

    const dispW = size.width * 0.28;
    const dispH = size.height * 0.11;
    boxComponent(registry, item, fridgeFurniture, 'display', {
      width: dispW, height: dispH, depth: 0.008
    }, { position: { x: -size.width * 0.22, y: size.height * 0.70, z: size.depth / 2 + 0.004 } }, { parent: node });

    const handleThickness = 0.012;
    boxComponent(registry, item, fridgeFurniture, 'handles', {
      width: 0.016, height: size.height * 0.22, depth: handleThickness
    }, { position: { x: size.width * 0.38, y: size.height * 0.58, z: size.depth / 2 + 0.006 } }, { parent: node });

    boxComponent(registry, item, fridgeFurniture, 'handles', {
      width: size.width * 0.38, height: 0.016, depth: handleThickness
    }, { position: { x: size.width * 0.20, y: gapY - 0.03, z: size.depth / 2 + 0.006 } }, { parent: node });
  }
};

// 2. 卫浴马桶 (Toilet)
export const toiletFurniture = {
  type: 'toilet',
  name: '卫浴马桶',
  defaultSize: { width: 18, depth: 28, height: 30 },
  components: [
    { id: 'bowl', label: '马桶底座', defaultColor: '#f7f9fa' },
    { id: 'tank', label: '冲水箱', defaultColor: '#f0f2f5' },
    { id: 'lid', label: '盖板', defaultColor: '#ffffff' }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      const bowlHeight = size.height * 0.54;
      const lidHeight = 0.025;
      return [
        { x: 0, y: bowlHeight + lidHeight, z: size.depth * 0.12, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const bowlHeight = size.height * 0.54;
    const tankHeight = size.height * 0.46;
    const tankDepth = size.depth * 0.28;

    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88, height: bowlHeight, depth: size.depth * 0.72
    }, { position: { x: 0, y: bowlHeight / 2, z: size.depth * 0.12 } }, { parent: node });

    boxComponent(registry, item, toiletFurniture, 'tank', {
      width: size.width, height: tankHeight, depth: tankDepth
    }, { position: { x: 0, y: bowlHeight + tankHeight / 2, z: -size.depth / 2 + tankDepth / 2 } }, { parent: node });

    const lidHeight = 0.025;
    boxComponent(registry, item, toiletFurniture, 'lid', {
      width: size.width * 0.84, height: lidHeight, depth: size.depth * 0.68
    }, { position: { x: 0, y: bowlHeight + lidHeight / 2, z: size.depth * 0.12 } }, { parent: node });

    cylinderComponent(registry, item, toiletFurniture, 'lid', {
      diameterTop: 0.038, diameterBottom: 0.038, height: 0.008, tessellation: 12
    }, { position: { x: 0, y: size.height + 0.004, z: -size.depth / 2 + tankDepth / 2 } }, { parent: node });
  }
};

// 3. 独立长方浴缸 (Bathtub)
export const bathtubFurniture = {
  type: 'bathtub',
  name: '独立浴缸',
  defaultSize: { width: 32, depth: 64, height: 24 },
  components: [
    { id: 'body', label: '外壁', defaultColor: '#f0f7fa' },
    { id: 'water', label: '缸内蓄水', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    // 1. 浴缸外围大箱体 (Body)
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 缸内蓄水面 (Water Surface) - 浅蓝色稍微嵌入
    boxComponent(registry, item, bathtubFurniture, 'water', {
      width: size.width * 0.88, height: 0.02, depth: size.depth * 0.90
    }, { position: { x: 0, y: size.height * 0.78, z: 0 } }, { parent: node });
  }
};

// 4. 厨房双槽水槽 (Sink Kitchen)
export const sinkKitchenFurniture = {
  type: 'sink_kitchen',
  name: '厨房水槽',
  defaultSize: { width: 32, depth: 22, height: 36 },
  components: [
    { id: 'counter', label: '橱柜台面', defaultColor: '#ede8de' },
    { id: 'tub', label: '钢质水槽', defaultColor: '#b3bdc4' },
    { id: 'faucet', label: '龙头', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const counterTopH = 0.04;
    const bodyH = size.height - counterTopH;

    // 橱柜底座
    boxComponent(registry, item, sinkKitchenFurniture, 'counter', {
      width: size.width, height: bodyH, depth: size.depth
    }, { position: { x: 0, y: bodyH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, sinkKitchenFurniture, 'counter', {
      width: size.width + 0.01, height: counterTopH, depth: size.depth + 0.01
    }, { position: { x: 0, y: size.height - counterTopH / 2, z: 0 } }, { parent: node });

    // 两个钢水槽 (双槽效果)
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, sinkKitchenFurniture, 'tub', {
        width: size.width * 0.38, height: 0.012, depth: size.depth * 0.68
      }, { position: { x: side * size.width * 0.22, y: size.height + 0.002, z: 0 } }, { parent: node });
    });

    // 弯曲水龙头
    cylinderComponent(registry, item, sinkKitchenFurniture, 'faucet', {
      diameterTop: 0.015, diameterBottom: 0.015, height: 0.12, tessellation: 8
    }, { position: { x: 0, y: size.height + 0.06, z: -size.depth * 0.38 } }, { parent: node });
  }
};

// 5. 卫浴立柱洗手台 (Sink Bathroom)
export const sinkBathroomFurniture = {
  type: 'sink_bathroom',
  name: '立柱洗手台',
  defaultSize: { width: 20, depth: 18, height: 34 },
  components: [
    { id: 'basin', label: '洗手盆', defaultColor: '#f2f6f7' },
    { id: 'pillar', label: '洗手台柱', defaultColor: '#e1e6e8' },
    { id: 'faucet', label: '水龙头', defaultColor: '#b3bdc4' }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.24;
    const pillarH = size.height - basinH;

    // 立柱
    cylinderComponent(registry, item, sinkBathroomFurniture, 'pillar', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.44, height: pillarH, tessellation: 16
    }, { position: { x: 0, y: pillarH / 2, z: 0 } }, { parent: node });

    // 台盆
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width, height: basinH, depth: size.depth
    }, { position: { x: 0, y: pillarH + basinH / 2, z: 0 } }, { parent: node });

    // 金属水龙头
    boxComponent(registry, item, sinkBathroomFurniture, 'faucet', {
      width: 0.03, height: 0.06, depth: 0.08
    }, { position: { x: 0, y: size.height + 0.03, z: -size.depth / 2 + 0.04 } }, { parent: node });
  }
};

// 6. 滚筒洗衣机 (Washing Machine)
export const washingMachineFurniture = {
  type: 'washing_machine',
  name: '滚筒洗衣机',
  defaultSize: { width: 26, depth: 26, height: 34 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#e9ecf0' },
    { id: 'glass', label: '舱门视窗', defaultColor: '#434f5c' },
    { id: 'panel', label: '控制屏', defaultColor: '#1d2024' }
  ],
  build(registry, item, node, size) {
    // 1. 机身 (Body)
    boxComponent(registry, item, washingMachineFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 舱门玻璃视窗 (Glass Drum Window)
    cylinderComponent(registry, item, washingMachineFurniture, 'glass', {
      diameterTop: size.width * 0.62, diameterBottom: size.width * 0.62, height: 0.016, tessellation: 20
    }, {
      position: { x: 0, y: size.height * 0.46, z: size.depth / 2 + 0.008 }
    }, { parent: node });
    const glassMesh = node.getChildren().find(child => child.name.includes('glass'));
    if (glassMesh) {
      glassMesh.rotation.x = Math.PI * 0.5;
    }

    // 3. 上部横条液晶显示面板 (LED Panel)
    boxComponent(registry, item, washingMachineFurniture, 'panel', {
      width: size.width * 0.88, height: size.height * 0.12, depth: 0.01
    }, { position: { x: 0, y: size.height * 0.88, z: size.depth / 2 + 0.005 } }, { parent: node });
  }
};

// 7. 微波炉 (Microwave)
export const microwaveFurniture = {
  type: 'microwave',
  name: '微波炉',
  defaultSize: { width: 20, depth: 15, height: 12 },
  components: [
    { id: 'body', label: '机壳', defaultColor: '#3b3f45' },
    { id: 'window', label: '玻璃小窗', defaultColor: '#141517' },
    { id: 'button', label: '启动钮', defaultColor: '#ff9a6c' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, microwaveFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, microwaveFurniture, 'window', {
      width: size.width * 0.62, height: size.height * 0.68, depth: 0.01
    }, { position: { x: -size.width * 0.12, y: size.height * 0.46, z: size.depth / 2 + 0.005 } }, { parent: node });

    boxComponent(registry, item, microwaveFurniture, 'button', {
      width: size.width * 0.12, height: size.height * 0.18, depth: 0.01
    }, { position: { x: size.width * 0.36, y: size.height * 0.22, z: size.depth / 2 + 0.005 } }, { parent: node });
  }
};

// 8. 燃气灶台 (Stove)
export const stoveFurniture = {
  type: 'stove',
  name: '燃气灶橱柜',
  defaultSize: { width: 36, depth: 24, height: 36 },
  components: [
    { id: 'cabinet', label: '底柜', defaultColor: '#ebe7db' },
    { id: 'cooktop', label: '灶具面板', defaultColor: '#1a1a1a' },
    { id: 'burners', label: '灶圈灶眼', defaultColor: '#00a2ff' }
  ],
  build(registry, item, node, size) {
    const counterTopH = 0.03;
    const bodyH = size.height - counterTopH;

    // 柜子
    boxComponent(registry, item, stoveFurniture, 'cabinet', {
      width: size.width, height: bodyH, depth: size.depth
    }, { position: { x: 0, y: bodyH / 2, z: 0 } }, { parent: node });

    // 黑色灶面
    boxComponent(registry, item, stoveFurniture, 'cooktop', {
      width: size.width + 0.004, height: counterTopH, depth: size.depth + 0.004
    }, { position: { x: 0, y: size.height - counterTopH / 2, z: 0 } }, { parent: node });

    // 两个灶眼 (Burner Rings)
    const burnerD = size.width * 0.22;
    [-1, 1].forEach((side) => {
      cylinderComponent(registry, item, stoveFurniture, 'burners', {
        diameterTop: burnerD, diameterBottom: burnerD, height: 0.006, tessellation: 12
      }, { position: { x: side * size.width * 0.22, y: size.height + 0.003, z: 0 } }, { parent: node });
    });
  }
};

// 9. 玻璃淋浴房 (Shower Cabin)
export const showerCabinFurniture = {
  type: 'shower_cabin',
  name: '淋浴房',
  defaultSize: { width: 36, depth: 36, height: 80 },
  components: [
    { id: 'tray', label: '底盘基座', defaultColor: '#ffffff' },
    { id: 'glass', label: '钢化玻璃', defaultColor: '#d6efff' },
    { id: 'shower', label: '冷热花洒', defaultColor: '#cccccc' }
  ],
  build(registry, item, node, size) {
    const trayH = 0.08;
    // 1. 底盘
    boxComponent(registry, item, showerCabinFurniture, 'tray', {
      width: size.width, height: trayH, depth: size.depth
    }, { position: { x: 0, y: trayH / 2, z: 0 } }, { parent: node });

    // 2. 钢化玻璃屏 (两面贴墙，两面玻璃围合)
    const glassT = 0.01;
    const glassH = size.height - trayH;
    // 侧挡玻璃门
    boxComponent(registry, item, showerCabinFurniture, 'glass', {
      width: size.width, height: glassH, depth: glassT
    }, { position: { x: 0, y: trayH + glassH / 2, z: size.depth / 2 - glassT / 2 } }, { parent: node });

    boxComponent(registry, item, showerCabinFurniture, 'glass', {
      width: glassT, height: glassH, depth: size.depth
    }, { position: { x: size.width / 2 - glassT / 2, y: trayH + glassH / 2, z: 0 } }, { parent: node });

    // 3. 悬挂水管和喷头 (Shower Rod)
    cylinderComponent(registry, item, showerCabinFurniture, 'shower', {
      diameterTop: 0.016, diameterBottom: 0.016, height: size.height * 0.72, tessellation: 8
    }, { position: { x: -size.width / 2 + 0.06, y: trayH + (size.height * 0.72) / 2, z: -size.depth / 2 + 0.06 } }, { parent: node });
  }
};

// 10. 智能卫浴镜 (Mirror Bathroom)
export const mirrorBathroomFurniture = {
  type: 'mirror_bathroom',
  name: '智能卫浴镜',
  defaultSize: { width: 24, depth: 2, height: 24 },
  placeType: 'wall',
  isMirror: true,
  components: [
    { id: 'mirror', label: '镜面', defaultColor: '#edf3f7' },
    { id: 'frame', label: '防雾发光环', defaultColor: '#fffae6' }
  ],
  build(registry, item, node, size) {
    const frameD = size.width;
    cylinderComponent(registry, item, mirrorBathroomFurniture, 'frame', {
      diameterTop: frameD, diameterBottom: frameD, height: 0.016, tessellation: 32
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    const mirrorD = size.width * 0.90;
    cylinderComponent(registry, item, mirrorBathroomFurniture, 'mirror', {
      diameterTop: mirrorD, diameterBottom: mirrorD, height: 0.01, tessellation: 32
    }, { position: { x: 0, y: size.height / 2, z: 0.005 } }, { parent: node });

    // 将圆盘立起来挂在墙上
    const meshes = node.getChildren();
    meshes.forEach(m => {
      m.rotation.x = Math.PI * 0.5;
    });
  }
};
