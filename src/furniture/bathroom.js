import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const toiletFurniture = {
  type: 'toilet',
  name: '马桶',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.7, height: 0.75 },
  components: [
    { id: 'bowl', label: '马桶底座', defaultColor: '#f7f9fa' },
    { id: 'tank', label: '冲水箱', defaultColor: '#f0f2f5' },
    { id: 'lid', label: '盖板', defaultColor: '#ffffff' },
    { id: 'water', label: '马桶蓄水', defaultColor: '#aae3ff' }
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

    // 1. 马桶底座拆分为实心下半部和四圈壁，形成内部蓄水凹槽
    const solidH = bowlHeight * 0.7;
    const rimH = bowlHeight * 0.3;
    const t = size.width * 0.12; // 圈壁厚度

    // 实心底座下部
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88, height: solidH, depth: size.depth * 0.72
    }, { position: { x: 0, y: solidH / 2, z: size.depth * 0.12 } }, { parent: node });

    // 四周圈壁
    // 左圈壁
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: t, height: rimH, depth: size.depth * 0.72
    }, { position: { x: -size.width * 0.88 / 2 + t / 2, y: solidH + rimH / 2, z: size.depth * 0.12 } }, { parent: node });

    // 右圈壁
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: t, height: rimH, depth: size.depth * 0.72
    }, { position: { x: size.width * 0.88 / 2 - t / 2, y: solidH + rimH / 2, z: size.depth * 0.12 } }, { parent: node });

    // 前圈壁
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88 - 2 * t, height: rimH, depth: t
    }, { position: { x: 0, y: solidH + rimH / 2, z: size.depth * 0.12 + size.depth * 0.72 / 2 - t / 2 } }, { parent: node });

    // 后圈壁
    boxComponent(registry, item, toiletFurniture, 'bowl', {
      width: size.width * 0.88 - 2 * t, height: rimH, depth: t
    }, { position: { x: 0, y: solidH + rimH / 2, z: size.depth * 0.12 - size.depth * 0.72 / 2 + t / 2 } }, { parent: node });

    // 2. 马桶底部蓄水层
    boxComponent(registry, item, toiletFurniture, 'water', {
      width: size.width * 0.88 - 2 * t - 0.002, height: 0.001, depth: size.depth * 0.72 - 2 * t - 0.002
    }, { position: { x: 0, y: solidH + 0.001, z: size.depth * 0.12 } }, { parent: node });

    // 3. 冲水箱
    boxComponent(registry, item, toiletFurniture, 'tank', {
      width: size.width, height: tankHeight, depth: tankDepth
    }, { position: { x: 0, y: bowlHeight + tankHeight / 2, z: -size.depth / 2 + tankDepth / 2 } }, { parent: node });

    // 4. 盖板部分（依据 lidOpen 属性判断是立起还是盖上）
    const lidHeight = 0.025;
    const isLidOpen = item.lidOpen === true;

    if (isLidOpen) {
      // 竖起放置，贴靠在水箱前面
      const lidD = size.depth * 0.68;
      boxComponent(registry, item, toiletFurniture, 'lid', {
        width: size.width * 0.84, height: lidHeight, depth: lidD
      }, {
        position: {
          x: 0,
          y: bowlHeight + (lidD / 2) * 0.985,
          z: -size.depth / 2 + tankDepth + 0.01 + (lidD / 2) * 0.17
        },
        rotation: { x: -Math.PI * 0.45, y: 0, z: 0 }
      }, { parent: node });
    } else {
      // 平铺合上
      boxComponent(registry, item, toiletFurniture, 'lid', {
        width: size.width * 0.84, height: lidHeight, depth: size.depth * 0.68
      }, { position: { x: 0, y: bowlHeight + lidHeight / 2, z: size.depth * 0.12 } }, { parent: node });
    }

    // 5. 顶冲水键
    cylinderComponent(registry, item, toiletFurniture, 'lid', {
      diameterTop: 0.038, diameterBottom: 0.038, height: 0.008, tessellation: 12
    }, { position: { x: 0, y: size.height + 0.004, z: -size.depth / 2 + tankDepth / 2 } }, { parent: node });
  }
};

export const bathtubFurniture = {
  type: 'bathtub',
  waterControllable: true,
  name: '浴缸',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 1.65, height: 0.6 },
  components: [
    { id: 'body', label: '外壁', defaultColor: '#f0f7fa' },
    { id: 'water', label: '缸内蓄水', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    // 动态计算壁厚和底厚（以米为单位，例如宽度 32 英寸对应 1.33 米）
    const t = Math.max(0.04, Math.min(size.width * 0.08, 0.1)); // 浴缸壁厚约 0.08米 (8厘米)
    const bottomH = Math.max(0.06, size.height * 0.15);         // 底部厚度约 0.15米 (15厘米)
    const wallH = size.height - bottomH;

    // 1. 浴缸底座 (Body)
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width, height: bottomH, depth: size.depth
    }, { position: { x: 0, y: bottomH / 2, z: 0 } }, { parent: node });

    // 2. 浴缸四周墙壁 (Body)
    // 左侧壁
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: -size.width / 2 + t / 2, y: bottomH + wallH / 2, z: 0 } }, { parent: node });

    // 右侧壁
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: size.width / 2 - t / 2, y: bottomH + wallH / 2, z: 0 } }, { parent: node });

    // 前侧壁
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: bottomH + wallH / 2, z: size.depth / 2 - t / 2 } }, { parent: node });

    // 后侧壁
    boxComponent(registry, item, bathtubFurniture, 'body', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: bottomH + wallH / 2, z: -size.depth / 2 + t / 2 } }, { parent: node });

    // 3. 缸内蓄水面 (Water Surface) - 浅蓝色稍微嵌入到内凹槽中
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, bathtubFurniture, 'water', {
        width: size.width - 2 * t - 0.01, height: 0.002, depth: size.depth - 2 * t - 0.01
      }, { position: { x: 0, y: bottomH + wallH * 0.7, z: 0 } }, { parent: node });
    }
  }
};

export const sinkBathroomFurniture = {
  type: 'sink_bathroom',
  waterControllable: true,
  name: '洗手台',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.45, height: 0.85 },
  components: [
    { id: 'basin', label: '洗手盆', defaultColor: '#f2f6f7' },
    { id: 'pillar', label: '洗手台柱', defaultColor: '#e1e6e8' },
    { id: 'faucet', label: '水龙头', defaultColor: '#b3bdc4' },
    { id: 'water', label: '内蓄水', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.24;
    const pillarH = size.height - basinH;

    // 立柱
    cylinderComponent(registry, item, sinkBathroomFurniture, 'pillar', {
      diameterTop: size.width * 0.28, diameterBottom: size.width * 0.44, height: pillarH, tessellation: 16
    }, { position: { x: 0, y: pillarH / 2, z: 0 } }, { parent: node });

    // 台盆 (拆分为底板与四周侧壁，以创建凹槽)
    const bottomH = basinH * 0.35; // 底面厚度
    const wallH = basinH - bottomH; // 侧壁高度
    const t = Math.max(0.02, size.width * 0.08); // 壁厚

    // 1. 台盆底座 (basin)
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width, height: bottomH, depth: size.depth
    }, { position: { x: 0, y: pillarH + bottomH / 2, z: 0 } }, { parent: node });

    // 2. 台盆四周侧壁 (basin)
    // 左侧壁
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: -size.width / 2 + t / 2, y: pillarH + bottomH + wallH / 2, z: 0 } }, { parent: node });

    // 右侧壁
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: t, height: wallH, depth: size.depth
    }, { position: { x: size.width / 2 - t / 2, y: pillarH + bottomH + wallH / 2, z: 0 } }, { parent: node });

    // 前侧壁
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: pillarH + bottomH + wallH / 2, z: size.depth / 2 - t / 2 } }, { parent: node });

    // 后侧壁
    boxComponent(registry, item, sinkBathroomFurniture, 'basin', {
      width: size.width - 2 * t, height: wallH, depth: t
    }, { position: { x: 0, y: pillarH + bottomH + wallH / 2, z: -size.depth / 2 + t / 2 } }, { parent: node });

    // 3. 台盆排水阀 (faucet材质) - 直径为盆尺寸的15%，高0.002
    cylinderComponent(registry, item, sinkBathroomFurniture, 'faucet', {
      diameterTop: size.width * 0.15, diameterBottom: size.width * 0.15, height: 0.002, tessellation: 12
    }, { position: { x: 0, y: pillarH + bottomH + 0.001, z: 0 } }, { parent: node });

    // 4. 台盆内蓄水面 (Water Surface) - 浅蓝色稍微嵌入
    if (item.waterEnabled !== false) {
      boxComponent(registry, item, sinkBathroomFurniture, 'water', {
        width: size.width - 2 * t - 0.002, height: 0.001, depth: size.depth - 2 * t - 0.002
      }, { position: { x: 0, y: pillarH + bottomH + wallH * 0.7, z: 0 } }, { parent: node });
    }

    // 金属水龙头
    boxComponent(registry, item, sinkBathroomFurniture, 'faucet', {
      width: 0.03, height: 0.06, depth: 0.08
    }, { position: { x: 0, y: size.height + 0.03, z: -size.depth / 2 + 0.04 } }, { parent: node });
  }
};

export const showerCabinFurniture = {
  type: 'shower_cabin',
  name: '淋浴房',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.9, height: 2.05 },
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

export const mirrorBathroomFurniture = {
  type: 'mirror_bathroom',
  name: '卫浴镜',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.05, height: 0.6 },
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

export const towelRackFurniture = {
  type: 'towel_rack',
  name: '毛巾架',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.15, height: 0.1 },
  placeType: 'wall',
  components: [
    { id: 'holder', label: '支架', defaultColor: '#b0bec5' },
    { id: 'bar', label: '毛巾杆', defaultColor: '#eceff1' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, towelRackFurniture, 'holder', {
      width: 0.02, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + 0.01, y: size.height / 2, z: size.depth / 2 } }, { parent: node });

    boxComponent(registry, item, towelRackFurniture, 'holder', {
      width: 0.02, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - 0.01, y: size.height / 2, z: size.depth / 2 } }, { parent: node });

    cylinderComponent(registry, item, towelRackFurniture, 'bar', {
      diameterTop: 0.016, diameterBottom: 0.016, height: size.width - 0.04
    }, { position: { x: 0, y: size.height * 0.8, z: size.depth * 0.8 } }, { parent: node });

    cylinderComponent(registry, item, towelRackFurniture, 'bar', {
      diameterTop: 0.016, diameterBottom: 0.016, height: size.width - 0.04
    }, { position: { x: 0, y: size.height * 0.4, z: size.depth * 0.3 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('bar')) {
        m.rotation.z = Math.PI * 0.5;
      }
    });
  }
};

export const toiletriesFurniture = {
  type: 'toiletries',
  name: '洗浴用品',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.15, height: 0.25 },
  components: [
    { id: 'basket', label: '置物篮', defaultColor: '#90a4ae' },
    { id: 'bottles', label: '洗发水沐浴露', defaultColor: '#80cbc4' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, toiletriesFurniture, 'basket', {
      width: size.width, height: size.height * 0.25, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.125, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, toiletriesFurniture, 'bottles', {
      diameterTop: size.width * 0.35, diameterBottom: size.width * 0.35, height: size.height * 0.75
    }, { position: { x: -size.width * 0.22, y: size.height * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, toiletriesFurniture, 'bottles', {
      diameterTop: size.width * 0.3, diameterBottom: size.width * 0.3, height: size.height * 0.85
    }, { position: { x: size.width * 0.22, y: size.height * 0.55, z: 0 } }, { parent: node });
  }
};

export const soapDispenserFurniture = {
  type: 'soap_dispenser',
  name: '洗手液',
  unit: 'm',
  defaultSize: { width: 0.1, depth: 0.1, height: 0.2 },
  components: [
    { id: 'body', label: '瓶身', defaultColor: '#eceff1' },
    { id: 'nozzle', label: '出液嘴', defaultColor: '#455a64' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, soapDispenserFurniture, 'body', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height * 0.85
    }, { position: { x: 0, y: size.height * 0.425, z: 0 } }, { parent: node });

    boxComponent(registry, item, soapDispenserFurniture, 'nozzle', {
      width: size.width * 0.7, height: size.height * 0.1, depth: size.depth * 0.2
    }, { position: { x: size.width * 0.2, y: size.height * 0.9, z: 0 } }, { parent: node });
  }
};

export const bathroomShelfFurniture = {
  type: 'bathroom_shelf',
  name: '置物架',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.3, height: 1.65 },
  components: [
    { id: 'frame', label: '铁艺外框', defaultColor: '#212121' },
    { id: 'shelves', label: '置物板', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const poleD = 0.02;
    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: size.width / 2 - poleD / 2, y: size.height / 2, z: -size.depth / 2 + poleD / 2 } }, { parent: node });

    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: -size.width / 2 + poleD / 2, y: size.height / 2, z: size.depth / 2 - poleD / 2 } }, { parent: node });

    boxComponent(registry, item, bathroomShelfFurniture, 'frame', {
      width: poleD, height: size.height, depth: poleD
    }, { position: { x: size.width / 2 - poleD / 2, y: size.height / 2, z: size.depth / 2 - poleD / 2 } }, { parent: node });

    const shelfH = 0.02;
    [0.2, 0.45, 0.7, 0.95].forEach(ratio => {
      boxComponent(registry, item, bathroomShelfFurniture, 'shelves', {
        width: size.width - 0.01, height: shelfH, depth: size.depth - 0.01
      }, { position: { x: 0, y: size.height * ratio, z: 0 } }, { parent: node });
    });
  }
};

export const bathroomMirrorCabinetFurniture = {
  type: 'bathroom_mirror_cabinet',
  name: '浴室柜',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.15, height: 0.75 },
  placeType: 'wall',
  components: [
    { id: 'cabinet', label: '柜体', defaultColor: '#f5f5f5' },
    { id: 'mirror', label: '镜面柜门', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, bathroomMirrorCabinetFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, bathroomMirrorCabinetFurniture, 'mirror', {
      width: size.width * 0.98, height: size.height * 0.98, depth: 0.01
    }, { position: { x: 0, y: size.height / 2, z: size.depth / 2 + 0.005 } }, { parent: node });
  }
};
