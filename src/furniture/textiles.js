import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

export const rugFurniture = {
  type: 'rug',
  name: '方形地毯',
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

export const ovalRugFurniture = {
  type: 'oval_rug',
  name: '圆形地毯',
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

export const curtainFurniture = {
  type: 'curtain',
  name: '窗帘',
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

export const cushionFurniture = {
  type: 'cushion',
  name: '靠枕',
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

export const singleBlackoutCurtainFurniture = {
  type: 'single_blackout_curtain',
  name: '单开帘',
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

export const doubleSheerCurtainFurniture = {
  type: 'double_sheer_curtain',
  name: '双开帘',
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

export const venetianBlindFurniture = {
  type: 'venetian_blind',
  name: '百叶帘',
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

export const rollerBlindFurniture = {
  type: 'roller_blind',
  name: '卷帘',
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

export const romanShadeFurniture = {
  type: 'roman_shade',
  name: '罗马帘',
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

export const verticalBlindFurniture = {
  type: 'vertical_blind',
  name: '竖百叶帘',
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

export const chineseBambooBlindFurniture = {
  type: 'chinese_bamboo_blind',
  name: '竹帘',
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

export const luxuryValanceCurtainFurniture = {
  type: 'luxury_valance_curtain',
  name: '欧式帘',
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

export const cafeShortCurtainFurniture = {
  type: 'cafe_short_curtain',
  name: '咖啡帘',
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

export const japaneseNorenCurtainFurniture = {
  type: 'japanese_noren_curtain',
  name: '日式暖帘',
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
