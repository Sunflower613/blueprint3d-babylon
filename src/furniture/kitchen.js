import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const fridgeFurniture = {
  type: 'fridge',
  name: '冰箱',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.75, height: 1.8 },
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

export const cabinetKitchenFurniture = {
  type: 'cabinet_kitchen',
  name: '橱柜',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.6, height: 0.9 },
  components: [
    { id: 'counter', label: '石英台面', defaultColor: '#fcfcfa' },
    { id: 'doors', label: '柜门', defaultColor: '#89a5ad' },
    { id: 'handles', label: '拉手', defaultColor: '#cccccc' }
  ],
  build(registry, item, node, size) {
    const counterH = 0.04;
    const bodyH = size.height - counterH;

    boxComponent(registry, item, cabinetKitchenFurniture, 'doors', {
      width: size.width, height: bodyH, depth: size.depth
    }, { position: { x: 0, y: bodyH / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, cabinetKitchenFurniture, 'counter', {
      width: size.width + 0.01, height: counterH, depth: size.depth + 0.01
    }, { position: { x: 0, y: size.height - counterH / 2, z: 0 } }, { parent: node });

    // 柜门拉手
    boxComponent(registry, item, cabinetKitchenFurniture, 'handles', {
      width: size.width * 0.82, height: 0.02, depth: 0.015
    }, { position: { x: 0, y: bodyH * 0.88, z: size.depth / 2 + 0.01 } }, { parent: node });
  }
};

export const sinkKitchenFurniture = {
  type: 'sink_kitchen',
  waterControllable: true,
  name: '厨房水槽',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.55, height: 0.9 },
  components: [
    { id: 'counter', label: '橱柜台面', defaultColor: '#ede8de' },
    { id: 'tub', label: '钢质水槽', defaultColor: '#b3bdc4' },
    { id: 'faucet', label: '龙头', defaultColor: '#ffffff' },
    { id: 'water', label: '内蓄水', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    const counterTopH = 0.04;
    const bodyH = size.height - counterTopH;

    // 橱柜底座
    boxComponent(registry, item, sinkKitchenFurniture, 'counter', {
      width: size.width, height: bodyH, depth: size.depth
    }, { position: { x: 0, y: bodyH / 2, z: 0 } }, { parent: node });

    // 橱柜台面
    boxComponent(registry, item, sinkKitchenFurniture, 'counter', {
      width: size.width + 0.01, height: counterTopH, depth: size.depth + 0.01
    }, { position: { x: 0, y: size.height - counterTopH / 2, z: 0 } }, { parent: node });

    // 两个钢水槽 (双槽效果，做成边缘凸起、内部凹陷的台上盆)
    const tubW = size.width * 0.38; // 单个水槽宽度
    const tubD = size.depth * 0.68; // 单个水槽深度
    const rimH = 0.04;              // 水槽边缘高出台面的高度
    const t = 0.015;                // 水槽壁厚度
    const bottomT = 0.005;          // 水槽底面厚度

    [-1, 1].forEach((side) => {
      const centerX = side * size.width * 0.22;
      const centerY = size.height;

      // 1. 水槽底面 (放在台面上方一点，提供下陷感)
      boxComponent(registry, item, sinkKitchenFurniture, 'tub', {
        width: tubW - 2 * t, height: bottomT, depth: tubD - 2 * t
      }, { position: { x: centerX, y: centerY + bottomT / 2, z: 0 } }, { parent: node });

      // 2. 水槽四壁
      // 左侧壁
      boxComponent(registry, item, sinkKitchenFurniture, 'tub', {
        width: t, height: rimH, depth: tubD
      }, { position: { x: centerX - tubW / 2 + t / 2, y: centerY + rimH / 2, z: 0 } }, { parent: node });

      // 右侧壁
      boxComponent(registry, item, sinkKitchenFurniture, 'tub', {
        width: t, height: rimH, depth: tubD
      }, { position: { x: centerX + tubW / 2 - t / 2, y: centerY + rimH / 2, z: 0 } }, { parent: node });

      // 前侧壁
      boxComponent(registry, item, sinkKitchenFurniture, 'tub', {
        width: tubW - 2 * t, height: rimH, depth: t
      }, { position: { x: centerX, y: centerY + rimH / 2, z: tubD / 2 - t / 2 } }, { parent: node });

      // 后侧壁
      boxComponent(registry, item, sinkKitchenFurniture, 'tub', {
        width: tubW - 2 * t, height: rimH, depth: t
      }, { position: { x: centerX, y: centerY + rimH / 2, z: -tubD / 2 + t / 2 } }, { parent: node });

      // 3. 排水阀 (金属网) - 位于水槽底面正中心，直径0.04米，高0.002米
      cylinderComponent(registry, item, sinkKitchenFurniture, 'faucet', {
        diameterTop: 0.04, diameterBottom: 0.04, height: 0.002, tessellation: 12
      }, { position: { x: centerX, y: centerY + bottomT + 0.001, z: 0 } }, { parent: node });

      // 4. 水槽内蓄水面 (Water Surface) - 浅蓝色稍微嵌入
      if (item.waterEnabled !== false) {
        boxComponent(registry, item, sinkKitchenFurniture, 'water', {
          width: tubW - 2 * t - 0.002, height: 0.001, depth: tubD - 2 * t - 0.002
        }, { position: { x: centerX, y: centerY + rimH * 0.7, z: 0 } }, { parent: node });
      }
    });

    // 弯曲水龙头 (高度0.15米)
    cylinderComponent(registry, item, sinkKitchenFurniture, 'faucet', {
      diameterTop: 0.012, diameterBottom: 0.012, height: 0.15, tessellation: 8
    }, { position: { x: 0, y: size.height + 0.075, z: -size.depth * 0.38 } }, { parent: node });
  }
};

export const microwaveFurniture = {
  type: 'microwave',
  name: '微波炉',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.4, height: 0.3 },
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

export const stoveFurniture = {
  type: 'stove',
  name: '燃气灶',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.6, height: 0.9 },
  components: [
    { id: 'cabinet', label: '底柜', defaultColor: '#ebe7db' },
    { id: 'cooktop', label: '灶具面板', defaultColor: '#1a1a1a' },
    { id: 'burners', label: '灶圈灶眼', defaultColor: '#00a2ff' },
    { id: 'oven_frame', label: '烤箱门框', defaultColor: '#30343a' },
    { id: 'oven_glass', label: '烤箱玻璃', defaultColor: '#141a20' },
    { id: 'oven_handle', label: '烤箱把手', defaultColor: '#b7bcc0' }
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

    // 底柜正面的嵌入式烤箱
    const ovenWidth = size.width * 0.76;
    const ovenHeight = bodyH * 0.58;
    const ovenCenterY = bodyH * 0.43;
    const frontZ = size.depth / 2 + 0.006;
    boxComponent(registry, item, stoveFurniture, 'oven_frame', {
      width: ovenWidth, height: ovenHeight, depth: 0.018
    }, { position: { x: 0, y: ovenCenterY, z: frontZ } }, { parent: node });
    boxComponent(registry, item, stoveFurniture, 'oven_glass', {
      width: ovenWidth * 0.86, height: ovenHeight * 0.7, depth: 0.01
    }, { position: { x: 0, y: ovenCenterY - ovenHeight * 0.04, z: frontZ + 0.014 } }, { parent: node });
    boxComponent(registry, item, stoveFurniture, 'oven_handle', {
      width: ovenWidth * 0.72, height: 0.025, depth: 0.035
    }, { position: { x: 0, y: ovenCenterY + ovenHeight * 0.34, z: frontZ + 0.035 } }, { parent: node });
  }
};

export const rangeHoodFurniture = {
  type: 'range_hood',
  name: '抽油烟机',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.5, height: 0.45 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#b0b5b8' },
    { id: 'glass', label: '钢化玻璃', defaultColor: '#3b3e40' },
    { id: 'filter', label: '滤网', defaultColor: '#4a4d50' }
  ],
  build(registry, item, node, size) {
    // 烟道 (Chimney)
    boxComponent(registry, item, rangeHoodFurniture, 'body', {
      width: size.width * 0.4, height: size.height * 0.65, depth: size.depth * 0.5
    }, { position: { x: 0, y: size.height * 0.675, z: -size.depth * 0.2 } }, { parent: node });

    // 吸风罩 (Hood Body)
    boxComponent(registry, item, rangeHoodFurniture, 'body', {
      width: size.width, height: size.height * 0.35, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    // 玻璃挡板 (Glass shield)
    boxComponent(registry, item, rangeHoodFurniture, 'glass', {
      width: size.width * 0.95, height: 0.01, depth: size.depth * 0.4
    }, { position: { x: 0, y: size.height * 0.08, z: size.depth * 0.25 } }, { parent: node });
  }
};

export const coffeeMakerFurniture = {
  type: 'coffee_maker',
  name: '咖啡机',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.4 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#3a2d28' },
    { id: 'pot', label: '咖啡壶', defaultColor: '#eef2f5' },
    { id: 'accent', label: '金属点缀', defaultColor: '#cca352' }
  ],
  build(registry, item, node, size) {
    // 底座
    boxComponent(registry, item, coffeeMakerFurniture, 'body', {
      width: size.width, height: size.height * 0.1, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.05, z: 0 } }, { parent: node });

    // 靠背机身
    boxComponent(registry, item, coffeeMakerFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth * 0.3
    }, { position: { x: 0, y: size.height * 0.5, z: -size.depth * 0.35 } }, { parent: node });

    // 顶盖
    boxComponent(registry, item, coffeeMakerFurniture, 'body', {
      width: size.width, height: size.height * 0.15, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.925, z: 0 } }, { parent: node });

    // 咖啡壶 (Cylinder)
    const potR = size.width * 0.28;
    cylinderComponent(registry, item, coffeeMakerFurniture, 'pot', {
      diameterTop: potR * 2, diameterBottom: potR * 2, height: size.height * 0.55
    }, { position: { x: 0, y: size.height * 0.375, z: size.depth * 0.1 } }, { parent: node });
  }
};

export const toasterFurniture = {
  type: 'toaster',
  name: '烤面包机',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.2, height: 0.2 },
  components: [
    { id: 'body', label: '外壳', defaultColor: '#e8ecef' },
    { id: 'slots', label: '面包槽', defaultColor: '#3a3a3a' },
    { id: 'bread', label: '吐司片', defaultColor: '#d6a060' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, toasterFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    // 顶部的槽 (Slots)
    boxComponent(registry, item, toasterFurniture, 'slots', {
      width: size.width * 0.8, height: 0.002, depth: size.depth * 0.2
    }, { position: { x: 0, y: size.height + 0.001, z: 0 } }, { parent: node });

    // 面包片
    boxComponent(registry, item, toasterFurniture, 'bread', {
      width: size.width * 0.6, height: size.height * 0.5, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.8, z: 0 } }, { parent: node });
  }
};

export const electricKettleFurniture = {
  type: 'electric_kettle',
  name: '电热水壶',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.2, height: 0.25 },
  components: [
    { id: 'body', label: '壶身', defaultColor: '#cfd8dc' },
    { id: 'handle', label: '手柄', defaultColor: '#37474f' },
    { id: 'base', label: '底座', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    // 底座
    cylinderComponent(registry, item, electricKettleFurniture, 'base', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height * 0.1
    }, { position: { x: 0, y: size.height * 0.05, z: 0 } }, { parent: node });

    // 壶身
    cylinderComponent(registry, item, electricKettleFurniture, 'body', {
      diameterTop: size.width * 0.8, diameterBottom: size.width * 0.95, height: size.height * 0.85
    }, { position: { x: 0, y: size.height * 0.525, z: 0 } }, { parent: node });

    // 把手
    boxComponent(registry, item, electricKettleFurniture, 'handle', {
      width: size.width * 0.15, height: size.height * 0.6, depth: size.depth * 0.3
    }, { position: { x: -size.width * 0.45, y: size.height * 0.5, z: 0 } }, { parent: node });
  }
};

export const dishwasherFurniture = {
  type: 'dishwasher',
  name: '洗碗机',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.6, height: 0.9 },
  snapToEdge: true,
  components: [
    { id: 'body', label: '机身', defaultColor: '#eceff1' },
    { id: 'door', label: '前面板', defaultColor: '#cfd8dc' },
    { id: 'handle', label: '拉手', defaultColor: '#546e7a' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, dishwasherFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, dishwasherFurniture, 'door', {
      width: size.width * 0.95, height: size.height * 0.85, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.45, z: size.depth / 2 + 0.005 } }, { parent: node });

    boxComponent(registry, item, dishwasherFurniture, 'handle', {
      width: size.width * 0.6, height: size.height * 0.08, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.8, z: size.depth / 2 + 0.015 } }, { parent: node });
  }
};

export const waterDispenserFurniture = {
  type: 'water_dispenser',
  name: '饮水机',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 1.05 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#ffffff' },
    { id: 'bottle', label: '水桶', defaultColor: '#80deea' },
    { id: 'outlet', label: '出水口', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    // 柜体
    boxComponent(registry, item, waterDispenserFurniture, 'body', {
      width: size.width, height: size.height * 0.7, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.35, z: 0 } }, { parent: node });

    // 水桶
    const bottleD = size.width * 0.8;
    cylinderComponent(registry, item, waterDispenserFurniture, 'bottle', {
      diameterTop: bottleD, diameterBottom: bottleD, height: size.height * 0.28
    }, { position: { x: 0, y: size.height * 0.84, z: 0 } }, { parent: node });

    // 出水口
    boxComponent(registry, item, waterDispenserFurniture, 'outlet', {
      width: size.width * 0.5, height: size.height * 0.1, depth: size.depth * 0.3
    }, { position: { x: 0, y: size.height * 0.55, z: size.depth / 2 + 0.005 } }, { parent: node });
  }
};

export const riceCookerFurniture = {
  type: 'rice_cooker',
  name: '电饭煲',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.35, height: 0.25 },
  components: [
    { id: 'body', label: '外壳', defaultColor: '#f5f5f5' },
    { id: 'panel', label: '控制屏', defaultColor: '#37474f' },
    { id: 'lid', label: '上盖', defaultColor: '#cfd8dc' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, riceCookerFurniture, 'body', {
      diameterTop: size.width, diameterBottom: size.width, height: size.height * 0.85
    }, { position: { x: 0, y: size.height * 0.425, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, riceCookerFurniture, 'lid', {
      diameterTop: size.width * 0.95, diameterBottom: size.width * 0.95, height: size.height * 0.15
    }, { position: { x: 0, y: size.height * 0.925, z: 0 } }, { parent: node });

    boxComponent(registry, item, riceCookerFurniture, 'panel', {
      width: size.width * 0.4, height: size.height * 0.25, depth: 0.01
    }, { position: { x: 0, y: size.height * 0.35, z: size.depth * 0.45 } }, { parent: node });
  }
};

export const airFryerFurniture = {
  type: 'air_fryer',
  name: '空气炸锅',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.3, height: 0.35 },
  components: [
    { id: 'body', label: '锅身', defaultColor: '#212121' },
    { id: 'handle', label: '把手', defaultColor: '#ffd54f' },
    { id: 'display', label: '显示屏', defaultColor: '#1e88e5' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, airFryerFurniture, 'body', {
      diameterTop: size.width * 0.85, diameterBottom: size.width * 0.95, height: size.height
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, airFryerFurniture, 'display', {
      width: size.width * 0.35, height: size.height * 0.15, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.82, z: size.depth * 0.42 } }, { parent: node });

    boxComponent(registry, item, airFryerFurniture, 'handle', {
      width: size.width * 0.1, height: size.height * 0.25, depth: size.depth * 0.25
    }, { position: { x: 0, y: size.height * 0.35, z: size.depth * 0.48 } }, { parent: node });
  }
};

export const blenderFurniture = {
  type: 'blender',
  name: '搅拌机',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.2, height: 0.4 },
  components: [
    { id: 'base', label: '底座', defaultColor: '#263238' },
    { id: 'cup', label: '搅拌杯', defaultColor: '#b2dfdb' },
    { id: 'lid', label: '杯盖', defaultColor: '#37474f' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, blenderFurniture, 'base', {
      diameterTop: size.width * 0.8, diameterBottom: size.width, height: size.height * 0.35
    }, { position: { x: 0, y: size.height * 0.175, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, blenderFurniture, 'cup', {
      diameterTop: size.width * 0.75, diameterBottom: size.width * 0.6, height: size.height * 0.55
    }, { position: { x: 0, y: size.height * 0.625, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, blenderFurniture, 'lid', {
      diameterTop: size.width * 0.8, diameterBottom: size.width * 0.8, height: size.height * 0.1
    }, { position: { x: 0, y: size.height * 0.95, z: 0 } }, { parent: node });
  }
};

export const kitchenwareFurniture = {
  type: 'kitchenware',
  name: '餐具架',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.25, height: 0.2 },
  components: [
    { id: 'rack', label: '沥水架', defaultColor: '#78909c' },
    { id: 'dishes', label: '餐盘组合', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, kitchenwareFurniture, 'rack', {
      width: size.width, height: size.height * 0.15, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.075, z: 0 } }, { parent: node });

    const plateD = size.height * 0.8;
    for (let i = -3; i <= 1; i++) {
      cylinderComponent(registry, item, kitchenwareFurniture, 'dishes', {
        diameterTop: plateD, diameterBottom: plateD, height: 0.008
      }, { position: { x: i * 0.035 - size.width * 0.1, y: size.height * 0.5, z: 0 } }, { parent: node });
    }

    cylinderComponent(registry, item, kitchenwareFurniture, 'rack', {
      diameterTop: size.width * 0.24, diameterBottom: size.width * 0.24, height: size.height * 0.7
    }, { position: { x: size.width * 0.32, y: size.height * 0.45, z: size.depth * 0.2 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('dishes')) {
        m.rotation.z = Math.PI * 0.5;
      }
    });
  }
};

export const knifeBlockFurniture = {
  type: 'knife_block',
  name: '刀架',
  unit: 'm',
  defaultSize: { width: 0.15, depth: 0.2, height: 0.25 },
  components: [
    { id: 'block', label: '刀架木座', defaultColor: '#a1887f' },
    { id: 'handle', label: '刀柄', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    const base = boxComponent(registry, item, knifeBlockFurniture, 'block', {
      width: size.width, height: size.height * 0.8, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.4, z: 0 } }, { parent: node });
    base.rotation.x = -Math.PI * 0.12;

    const h1 = boxComponent(registry, item, knifeBlockFurniture, 'handle', {
      width: size.width * 0.15, height: size.height * 0.4, depth: size.depth * 0.15
    }, { position: { x: -size.width * 0.2, y: size.height * 0.85, z: size.depth * 0.1 } }, { parent: node });
    h1.rotation.x = -Math.PI * 0.12;

    const h2 = boxComponent(registry, item, knifeBlockFurniture, 'handle', {
      width: size.width * 0.15, height: size.height * 0.4, depth: size.depth * 0.15
    }, { position: { x: size.width * 0.2, y: size.height * 0.85, z: size.depth * 0.1 } }, { parent: node });
    h2.rotation.x = -Math.PI * 0.12;
  }
};

export const spiceRackFurniture = {
  type: 'spice_rack',
  name: '调料架',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.15, height: 0.3 },
  components: [
    { id: 'frame', label: '架体', defaultColor: '#607d8b' },
    { id: 'jar', label: '调料罐', defaultColor: '#ffe0b2' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, spiceRackFurniture, 'frame', {
      width: 0.015, height: size.height, depth: size.depth
    }, { position: { x: -size.width / 2 + 0.007, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, spiceRackFurniture, 'frame', {
      width: 0.015, height: size.height, depth: size.depth
    }, { position: { x: size.width / 2 - 0.007, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, spiceRackFurniture, 'frame', {
      width: size.width - 0.03, height: 0.015, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.1, z: 0 } }, { parent: node });
    boxComponent(registry, item, spiceRackFurniture, 'frame', {
      width: size.width - 0.03, height: 0.015, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.6, z: 0 } }, { parent: node });

    for (let i = -1; i <= 1; i++) {
      cylinderComponent(registry, item, spiceRackFurniture, 'jar', {
        diameterTop: size.depth * 0.6, diameterBottom: size.depth * 0.6, height: size.height * 0.35
      }, { position: { x: i * 0.07, y: size.height * 0.3, z: 0 } }, { parent: node });
    }
  }
};

export const kitchenHooksFurniture = {
  type: 'kitchen_hooks',
  name: '挂钩架',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.05, height: 0.1 },
  placeType: 'wall',
  components: [
    { id: 'bar', label: '挂条', defaultColor: '#37474f' },
    { id: 'hook', label: '小挂钩', defaultColor: '#b0bec5' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, kitchenHooksFurniture, 'bar', {
      width: size.width, height: size.height * 0.25, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      boxComponent(registry, item, kitchenHooksFurniture, 'hook', {
        width: 0.01, height: size.height * 0.6, depth: 0.02
      }, { position: { x: i * (size.width * 0.22), y: size.height * 0.15, z: size.depth * 0.3 } }, { parent: node });
    }
  }
};


export const sinkCabinetFurniture = {
  type: 'sink_cabinet',
  waterControllable: true,
  name: '带柜水槽',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.55, height: 0.9 },
  snapToEdge: true,
  components: [
    { id: 'cabinet', label: '柜体', defaultColor: '#ebe7db' },
    { id: 'door', label: '柜门', defaultColor: '#d7cec1' },
    { id: 'handle', label: '拉手', defaultColor: '#546e7a' },
    { id: 'counter', label: '台面', defaultColor: '#ffffff' },
    { id: 'tub', label: '水槽', defaultColor: '#b3bdc4' },
    { id: 'faucet', label: '龙头', defaultColor: '#ffffff' },
    { id: 'water', label: '内蓄水', defaultColor: '#aae3ff' }
  ],
  build(registry, item, node, size) {
    const counterTopH = 0.04;
    const bodyH = size.height - counterTopH;

    boxComponent(registry, item, sinkCabinetFurniture, 'cabinet', {
      width: size.width, height: bodyH, depth: size.depth
    }, { position: { x: 0, y: bodyH / 2, z: 0 } }, { parent: node });

    const doorW = size.width * 0.46;
    const doorH = bodyH * 0.85;
    const doorThick = 0.015;
    const doorY = bodyH * 0.48;
    
    boxComponent(registry, item, sinkCabinetFurniture, 'door', {
      width: doorW, height: doorH, depth: doorThick
    }, { position: { x: -doorW / 2 - 0.002, y: doorY, z: size.depth / 2 + doorThick / 2 } }, { parent: node });

    boxComponent(registry, item, sinkCabinetFurniture, 'door', {
      width: doorW, height: doorH, depth: doorThick
    }, { position: { x: doorW / 2 + 0.002, y: doorY, z: size.depth / 2 + doorThick / 2 } }, { parent: node });

    const handleW = 0.015;
    const handleH = 0.06;
    const handleD = 0.015;
    
    boxComponent(registry, item, sinkCabinetFurniture, 'handle', {
      width: handleW, height: handleH, depth: handleD
    }, { position: { x: -0.02, y: doorY, z: size.depth / 2 + doorThick + handleD / 2 } }, { parent: node });

    boxComponent(registry, item, sinkCabinetFurniture, 'handle', {
      width: handleW, height: handleH, depth: handleD
    }, { position: { x: 0.02, y: doorY, z: size.depth / 2 + doorThick + handleD / 2 } }, { parent: node });

    boxComponent(registry, item, sinkCabinetFurniture, 'counter', {
      width: size.width + 0.01, height: counterTopH, depth: size.depth + 0.01
    }, { position: { x: 0, y: size.height - counterTopH / 2, z: 0 } }, { parent: node });

    const tubW = size.width * 0.72;
    const tubD = size.depth * 0.68;
    const rimH = 0.03;
    const t = 0.015;
    const bottomT = 0.005;
    const centerY = size.height;

    boxComponent(registry, item, sinkCabinetFurniture, 'tub', {
      width: tubW - 2 * t, height: bottomT, depth: tubD - 2 * t
    }, { position: { x: 0, y: centerY + bottomT / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, sinkCabinetFurniture, 'tub', {
      width: t, height: rimH, depth: tubD
    }, { position: { x: -tubW / 2 + t / 2, y: centerY + rimH / 2, z: 0 } }, { parent: node });
    
    boxComponent(registry, item, sinkCabinetFurniture, 'tub', {
      width: t, height: rimH, depth: tubD
    }, { position: { x: tubW / 2 - t / 2, y: centerY + rimH / 2, z: 0 } }, { parent: node });
    
    boxComponent(registry, item, sinkCabinetFurniture, 'tub', {
      width: tubW - 2 * t, height: rimH, depth: t
    }, { position: { x: 0, y: centerY + rimH / 2, z: tubD / 2 - t / 2 } }, { parent: node });
    
    boxComponent(registry, item, sinkCabinetFurniture, 'tub', {
      width: tubW - 2 * t, height: rimH, depth: t
    }, { position: { x: 0, y: centerY + rimH / 2, z: -tubD / 2 + t / 2 } }, { parent: node });

    if (item.waterEnabled !== false) {
      boxComponent(registry, item, sinkCabinetFurniture, 'water', {
        width: tubW - 2 * t - 0.002, height: 0.001, depth: tubD - 2 * t - 0.002
      }, { position: { x: 0, y: centerY + rimH * 0.7, z: 0 } }, { parent: node });
    }

    cylinderComponent(registry, item, sinkCabinetFurniture, 'faucet', {
      diameterTop: 0.012, diameterBottom: 0.012, height: 0.15, tessellation: 8
    }, { position: { x: 0, y: size.height + 0.075, z: -size.depth * 0.38 } }, { parent: node });
  }
};

export const dinnerPlateFurniture = {
  type: 'dinner_plate',
  name: '餐盘',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.03 },
  components: [
    { id: 'plate', label: '瓷餐盘', defaultColor: '#ffffff' },
    { id: 'rim', label: '描金盘边', defaultColor: '#ffd700' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, dinnerPlateFurniture, 'plate', {
      diameterTop: size.width, diameterBottom: size.width * 0.75, height: size.height * 0.8, tessellation: 24
    }, { position: { x: 0, y: size.height * 0.4, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, dinnerPlateFurniture, 'rim', {
      diameterTop: size.width * 1.02, diameterBottom: size.width * 1.02, height: size.height * 0.2, tessellation: 24
    }, { position: { x: 0, y: size.height * 0.9, z: 0 } }, { parent: node });
  }
};

export const cutlerySetFurniture = {
  type: 'cutlery_set',
  name: '刀叉餐具',
  unit: 'm',
  defaultSize: { width: 0.12, depth: 0.22, height: 0.02 },
  components: [
    { id: 'metal', label: '不锈钢刀叉', defaultColor: '#cfd8dc' },
    { id: 'napkin', label: '餐巾衬垫', defaultColor: '#eceff1' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    boxComponent(registry, item, cutlerySetFurniture, 'napkin', {
      width: w, height: h * 0.3, depth: d
    }, { position: { x: 0, y: h * 0.15, z: 0 } }, { parent: node });

    // 主餐刀
    boxComponent(registry, item, cutlerySetFurniture, 'metal', {
      width: 0.015, height: h * 0.4, depth: d * 0.85
    }, { position: { x: -w * 0.25, y: h * 0.5, z: 0 } }, { parent: node });

    // 主餐叉
    boxComponent(registry, item, cutlerySetFurniture, 'metal', {
      width: 0.015, height: h * 0.4, depth: d * 0.85
    }, { position: { x: w * 0.25, y: h * 0.5, z: 0 } }, { parent: node });
  }
};

export const chopsticksBowlSetFurniture = {
  type: 'chopsticks_bowl_set',
  name: '碗筷餐具',
  unit: 'm',
  defaultSize: { width: 0.2, depth: 0.2, height: 0.08 },
  components: [
    { id: 'bowl', label: '青花瓷饭碗', defaultColor: '#e0f2f1' },
    { id: 'chopsticks', label: '木筷', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;

    // 饭碗
    cylinderComponent(registry, item, chopsticksBowlSetFurniture, 'bowl', {
      diameterTop: w * 0.7, diameterBottom: w * 0.35, height: h * 0.7, tessellation: 20
    }, { position: { x: -w * 0.1, y: h * 0.35, z: 0 } }, { parent: node });

    // 筷子
    [-0.012, 0.012].forEach(offsetZ => {
      boxComponent(registry, item, chopsticksBowlSetFurniture, 'chopsticks', {
        width: w * 0.85, height: 0.008, depth: 0.008
      }, { position: { x: 0, y: h * 0.75, z: offsetZ } }, { parent: node });
    });
  }
};


