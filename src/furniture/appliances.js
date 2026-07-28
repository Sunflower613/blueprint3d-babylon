import { TransformNode } from '@babylonjs/core';
import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const washingMachineFurniture = {
  type: 'washing_machine',
  name: '洗衣机',
  unit: 'm',
  defaultSize: { width: 0.65, depth: 0.65, height: 0.85 },
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

export const hairDryerFurniture = {
  type: 'hair_dryer',
  name: '吹风机',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.1, height: 0.25 },
  components: [
    { id: 'body', label: '风筒', defaultColor: '#d81b60' },
    { id: 'handle', label: '手柄', defaultColor: '#212121' },
    { id: 'nozzle', label: '风嘴', defaultColor: '#424242' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, hairDryerFurniture, 'handle', {
      diameterTop: size.depth * 0.8, diameterBottom: size.depth * 0.9, height: size.height * 0.55
    }, { position: { x: -size.width * 0.1, y: size.height * 0.275, z: 0 } }, { parent: node });

    const blowerD = size.depth;
    cylinderComponent(registry, item, hairDryerFurniture, 'body', {
      diameterTop: blowerD, diameterBottom: blowerD, height: size.width * 0.7
    }, { position: { x: 0, y: size.height * 0.7, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, hairDryerFurniture, 'nozzle', {
      diameterTop: size.depth * 0.7, diameterBottom: size.depth * 0.8, height: size.width * 0.2
    }, { position: { x: size.width * 0.4, y: size.height * 0.7, z: 0 } }, { parent: node });

    const meshes = node.getChildren();
    meshes.forEach(m => {
      if (m.name.includes('body') || m.name.includes('nozzle')) {
        m.rotation.z = Math.PI * 0.5;
      }
    });
  }
};

export const tvFurniture = {
  type: 'tv',
  name: '电视机',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.25, height: 0.75 },
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

export const computerFurniture = {
  type: 'computer',
  name: '电脑',
  unit: 'm',
  defaultSize: { width: 0.6, depth: 0.2, height: 0.45 },
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

export const projectorFurniture = {
  type: 'projector',
  name: '投影仪',
  unit: 'm',
  defaultSize: { width: 0.25, depth: 0.25, height: 0.1 },
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

export const gameConsoleFurniture = {
  type: 'game_console',
  name: '游戏主机',
  unit: 'm',
  defaultSize: { width: 0.3, depth: 0.25, height: 0.2 },
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

export const smartSpeakerFurniture = {
  type: 'smart_speaker',
  name: '智能音箱',
  unit: 'm',
  defaultSize: { width: 0.13, depth: 0.13, height: 0.2 },
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

export const electricFanFurniture = {
  type: 'electric_fan',
  name: '电风扇',
  unit: 'm',
  defaultSize: { width: 0.4, depth: 0.4, height: 1.05 },
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

export const aromaDiffuserFurniture = {
  type: 'aroma_diffuser',
  name: '香薰机',
  unit: 'm',
  defaultSize: { width: 0.15, depth: 0.15, height: 0.2 },
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

export const vintageRecordPlayerFurniture = {
  type: 'vintage_record_player',
  name: '唱片机',
  unit: 'm',
  defaultSize: { width: 0.5, depth: 0.4, height: 0.25 },
  components: [
    { id: 'cabinet', label: '胡桃木机箱', defaultColor: '#6d4328' },
    { id: 'platter', label: '唱盘', defaultColor: '#252525' },
    { id: 'record', label: '黑胶唱片', defaultColor: '#111111' },
    { id: 'label', label: '唱片标签', defaultColor: '#d88c62' },
    { id: 'tonearm', label: '唱臂', defaultColor: '#d8c6a1' },
    { id: 'accent', label: '电源指示灯', defaultColor: '#f7c873' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.42;
    boxComponent(registry, item, vintageRecordPlayerFurniture, 'cabinet', {
      width: size.width, height: baseH, depth: size.depth
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, vintageRecordPlayerFurniture, 'cabinet', {
      width: size.width * 0.96, height: size.height * 0.5, depth: 0.025
    }, { position: { x: 0, y: baseH + size.height * 0.25, z: -size.depth * 0.46 } }, { parent: node });
    cylinderComponent(registry, item, vintageRecordPlayerFurniture, 'platter', {
      diameterTop: size.depth * 0.72, diameterBottom: size.depth * 0.72, height: size.height * 0.035, tessellation: 32
    }, { position: { x: -size.width * 0.09, y: baseH + size.height * 0.025, z: 0 } }, { parent: node });

    const recordGroup = new TransformNode(`${item.id}_turntable`, registry.scene);
    recordGroup.parent = node;
    recordGroup.position.set(-size.width * 0.09, baseH + size.height * 0.05, 0);
    recordGroup.metadata = { powerMotionId: 'turntable' };
    cylinderComponent(registry, item, vintageRecordPlayerFurniture, 'record', {
      diameterTop: size.depth * 0.65, diameterBottom: size.depth * 0.65, height: size.height * 0.018, tessellation: 32
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: recordGroup });
    cylinderComponent(registry, item, vintageRecordPlayerFurniture, 'label', {
      diameterTop: size.depth * 0.19, diameterBottom: size.depth * 0.19, height: size.height * 0.022, tessellation: 24
    }, { position: { x: 0, y: size.height * 0.012, z: 0 } }, { parent: recordGroup });
    boxComponent(registry, item, vintageRecordPlayerFurniture, 'label', {
      width: size.depth * 0.035, height: size.height * 0.01, depth: size.depth * 0.035
    }, { position: { x: size.depth * 0.19, y: size.height * 0.024, z: 0 } }, { parent: recordGroup });

    const tonearm = cylinderComponent(registry, item, vintageRecordPlayerFurniture, 'tonearm', {
      diameterTop: 0.018, diameterBottom: 0.018, height: size.depth * 0.55, tessellation: 10
    }, { position: { x: size.width * 0.31, y: baseH + size.height * 0.1, z: 0 } }, { parent: node });
    tonearm.rotation.z = Math.PI * 0.38;
    sphereComponent(registry, item, vintageRecordPlayerFurniture, 'accent', {
      diameter: Math.max(0.018, size.width * 0.025), segments: 12
    }, { position: { x: size.width * 0.4, y: baseH * 0.55, z: size.depth * 0.505 } }, { parent: node });
  }
};

export const stereoSpeakerFurniture = {
  type: 'stereo_speaker',
  name: '音响',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.3, height: 0.7 },
  components: [
    { id: 'cabinet', label: '木质箱体', defaultColor: '#75482e' },
    { id: 'grille', label: '织物网罩', defaultColor: '#393735' },
    { id: 'woofer', label: '低音单元', defaultColor: '#202326' },
    { id: 'tweeter', label: '高音单元', defaultColor: '#d2b48c' },
    { id: 'accent', label: '电源指示灯', defaultColor: '#77ddaa' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, stereoSpeakerFurniture, 'cabinet', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, stereoSpeakerFurniture, 'grille', {
      width: size.width * 0.88, height: size.height * 0.88, depth: size.depth * 0.04
    }, { position: { x: 0, y: size.height * 0.5, z: size.depth * 0.52 } }, { parent: node });
    const woofer = cylinderComponent(registry, item, stereoSpeakerFurniture, 'woofer', {
      diameterTop: size.width * 0.62, diameterBottom: size.width * 0.62, height: size.depth * 0.055, tessellation: 32
    }, { position: { x: 0, y: size.height * 0.37, z: size.depth * 0.55 } }, { parent: node });
    woofer.rotation.x = Math.PI * 0.5;
    const tweeter = cylinderComponent(registry, item, stereoSpeakerFurniture, 'tweeter', {
      diameterTop: size.width * 0.25, diameterBottom: size.width * 0.25, height: size.depth * 0.055, tessellation: 24
    }, { position: { x: 0, y: size.height * 0.75, z: size.depth * 0.55 } }, { parent: node });
    tweeter.rotation.x = Math.PI * 0.5;
    sphereComponent(registry, item, stereoSpeakerFurniture, 'accent', {
      diameter: Math.max(0.018, size.width * 0.035), segments: 12
    }, { position: { x: size.width * 0.36, y: size.height * 0.12, z: size.depth * 0.57 } }, { parent: node });
  }
};

export const airConditionerWallFurniture = {
  type: 'air_conditioner_wall',
  name: '挂式空调',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.2, height: 0.25 },
  placeType: 'wall',
  components: [
    { id: 'body', label: '机身', defaultColor: '#f5f5f5' },
    { id: 'vent', label: '导风板', defaultColor: '#cfd8dc' },
    { id: 'display', label: '温度显示屏', defaultColor: '#81d4fa' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, airConditionerWallFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, airConditionerWallFurniture, 'vent', {
      width: size.width * 0.9, height: size.height * 0.12, depth: size.depth * 0.2
    }, { position: { x: 0, y: size.height * 0.1, z: size.depth / 2 - size.depth * 0.1 } }, { parent: node });

    boxComponent(registry, item, airConditionerWallFurniture, 'display', {
      width: size.width * 0.12, height: size.height * 0.18, depth: 0.01
    }, { position: { x: size.width * 0.3, y: size.height * 0.5, z: size.depth / 2 + 0.005 } }, { parent: node });
  }
};


export const airConditionerFloorFurniture = {
  type: 'air_conditioner_floor',
  name: '立式空调',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 1.75 },
  components: [
    { id: 'body', label: '机身', defaultColor: '#f8f9fa' },
    { id: 'vent', label: '出风栅格', defaultColor: '#37474f' },
    { id: 'display', label: '操作面板', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, airConditionerFloorFurniture, 'body', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, airConditionerFloorFurniture, 'vent', {
      width: size.width * 0.72, height: size.height * 0.42, depth: 0.02
    }, { position: { x: 0, y: size.height * 0.68, z: size.depth / 2 + 0.01 } }, { parent: node });

    boxComponent(registry, item, airConditionerFloorFurniture, 'display', {
      width: size.width * 0.38, height: size.height * 0.12, depth: 0.015
    }, { position: { x: 0, y: size.height * 0.42, z: size.depth / 2 + 0.008 } }, { parent: node });
  }
};

export const vendingMachineFurniture = {
  type: 'vending_machine',
  name: '自动贩卖机',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.75, height: 1.85 },
  isSwitchable: true,
  components: [
    { id: 'body', label: '红色机身', defaultColor: '#d32f2f' },
    { id: 'glassDisplay', label: '发光饮品橱窗', defaultColor: '#80deea' },
    { id: 'selectionButtons', label: '按键与投币口', defaultColor: '#ffeb3b' },
    { id: 'pickupSlot', label: '取物口', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const h = size.height;
    const d = size.depth;

    // 1. 机身外壳 (Main Red Metal Body)
    boxComponent(registry, item, vendingMachineFurniture, 'body', {
      width: w, height: h, depth: d
    }, { position: { x: 0, y: h / 2, z: 0 } }, { parent: node });

    // 2. 发光饮料橱窗 (Glass Window Display)
    const glassW = w * 0.65;
    const glassH = h * 0.52;
    boxComponent(registry, item, vendingMachineFurniture, 'glassDisplay', {
      width: glassW, height: glassH, depth: 0.04
    }, { position: { x: -w * 0.1, y: h * 0.62, z: d / 2 + 0.01 } }, { parent: node });

    // 3. 内部展示货架 (Internal Shelves)
    for (let i = 0; i < 3; i++) {
      const shelfY = h * 0.42 + i * (glassH / 3);
      boxComponent(registry, item, vendingMachineFurniture, 'selectionButtons', {
        width: glassW * 0.9, height: 0.015, depth: 0.02
      }, { position: { x: -w * 0.1, y: shelfY, z: d / 2 + 0.015 } }, { parent: node });
    }

    // 4. 选择按键 Panel & 投币口 (Selection Buttons & Coin Slot)
    boxComponent(registry, item, vendingMachineFurniture, 'selectionButtons', {
      width: w * 0.18, height: glassH * 0.8, depth: 0.03
    }, { position: { x: w * 0.35, y: h * 0.62, z: d / 2 + 0.01 } }, { parent: node });

    boxComponent(registry, item, vendingMachineFurniture, 'pickupSlot', {
      width: w * 0.12, height: 0.06, depth: 0.035
    }, { position: { x: w * 0.35, y: h * 0.38, z: d / 2 + 0.015 } }, { parent: node });

    // 5. 底部取物口 (Delivery / Pickup Slot)
    boxComponent(registry, item, vendingMachineFurniture, 'pickupSlot', {
      width: w * 0.75, height: h * 0.16, depth: 0.05
    }, { position: { x: 0, y: h * 0.15, z: d / 2 + 0.01 } }, { parent: node });
  }
};

