import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';
// ==================== 7. 模特 (3个) ====================

export const clothing_mannequin_male = {
  type: 'clothing_mannequin_male',
  name: '男模',
  defaultSize: { width: 16, depth: 8, height: 72 },
  components: [
    { id: 'body', label: '模特本体', defaultColor: '#e0d0c0' },
    { id: 'base', label: '支架底盘', defaultColor: '#8c6c50' }
  ],
  build(registry, item, node, size) {
    buildMannequin(registry, item, clothing_mannequin_male, node, size, 'male');
  }
};

export const clothing_mannequin_female = {
  type: 'clothing_mannequin_female',
  name: '女模',
  defaultSize: { width: 14, depth: 7, height: 66 },
  components: [
    { id: 'body', label: '模特本体', defaultColor: '#e0d0c0' },
    { id: 'base', label: '支架底盘', defaultColor: '#8c6c50' }
  ],
  build(registry, item, node, size) {
    buildMannequin(registry, item, clothing_mannequin_female, node, size, 'female');
  }
};

export const clothing_mannequin_child = {
  type: 'clothing_mannequin_child',
  name: '童模',
  defaultSize: { width: 12, depth: 6, height: 44 },
  components: [
    { id: 'body', label: '模特本体', defaultColor: '#e0d0c0' },
    { id: 'base', label: '支架底盘', defaultColor: '#8c6c50' }
  ],
  build(registry, item, node, size) {
    buildMannequin(registry, item, clothing_mannequin_child, node, size, 'child');
  }
};

/**
 * 1. 构建衣服/连衣裙 (无衣架，占满高度)
 */
export function buildCloth(registry, item, definition, node, size, options = {}) {
  const sleeveType = options.sleeveType || 'short'; // 'none', 'short', 'long', 'strap'
  const hasCollar = options.hasCollar !== false;
  const hasHood = !!options.hasHood;
  const skirtType = options.skirtType || 'none'; // 'none', 'straight', 'flare'
  const isLolita = !!options.isLolita;

  node.getChildMeshes().forEach(m => m.dispose());

  // 衣服大身 (Body)
  const isShortCloth = skirtType === 'none';
  const bottomY = isShortCloth ? size.height * 0.08 : size.height * 0.02;
  const topY = size.height * 0.98;
  const bodyH = topY - bottomY;

  const topBodyH = isShortCloth ? bodyH : bodyH * 0.45;
  const topBodyY = topY - topBodyH / 2;

  boxComponent(registry, item, definition, 'fabric', {
    width: size.width * 0.8,
    height: topBodyH,
    depth: size.depth * 0.85
  }, {
    position: { x: 0, y: topBodyY, z: 0 }
  }, { parent: node });

  // 裙摆 (如果是裙子)
  if (skirtType === 'straight') {
    const skirtH = bodyH * 0.55;
    boxComponent(registry, item, definition, 'fabric', {
      width: size.width * 0.84,
      height: skirtH,
      depth: size.depth * 0.88
    }, {
      position: { x: 0, y: bottomY + skirtH / 2, z: 0 }
    }, { parent: node });
  } else if (skirtType === 'flare') {
    const skirtH = bodyH * 0.55;
    cylinderComponent(registry, item, definition, 'fabric', {
      height: skirtH,
      diameterTop: size.width * 0.8,
      diameterBottom: isLolita ? size.width * 1.4 : size.width * 1.05,
      tessellation: 16
    }, {
      position: { x: 0, y: bottomY + skirtH / 2, z: 0 }
    }, { parent: node });
  }

  // 袖子 (Sleeves)
  if (sleeveType === 'short') {
    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.18,
        height: size.height * 0.2,
        depth: size.depth * 0.85
      }, {
        position: { x: side * size.width * 0.45, y: size.height * 0.84, z: 0 },
        rotation: { x: 0, y: 0, z: -side * 0.4 }
      }, { parent: node });
    });
  } else if (sleeveType === 'long') {
    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.14,
        height: size.height * 0.5,
        depth: size.depth * 0.8
      }, {
        position: { x: side * size.width * 0.42, y: size.height * 0.65, z: 0 },
        rotation: { x: 0, y: 0, z: -side * 0.18 }
      }, { parent: node });
    });
  } else if (sleeveType === 'strap') {
    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'collar', {
        width: size.width * 0.04,
        height: size.height * 0.1,
        depth: size.depth * 0.12
      }, {
        position: { x: side * size.width * 0.25, y: size.height * 0.93, z: 0 }
      }, { parent: node });
    });
  }

  // 领口 (Collar)
  if (hasCollar) {
    boxComponent(registry, item, definition, 'collar', {
      width: size.width * 0.36,
      height: size.height * 0.05,
      depth: size.depth * 0.9
    }, {
      position: { x: 0, y: size.height * 0.96, z: 0 }
    }, { parent: node });
  }

  // 连帽 (Hood)
  if (hasHood) {
    sphereComponent(registry, item, definition, 'collar', {
      diameter: size.width * 0.3
    }, {
      position: { x: 0, y: size.height * 0.95, z: -size.depth * 0.15 }
    }, { parent: node });
  }
}

/**
 * 2. 构建裤子/短裙 (无衣架，占满高度)
 */
export function buildPantsOrSkirt(registry, item, definition, node, size, options = {}) {
  const isSkirt = !!options.isSkirt;
  const pantsLength = options.pantsLength || 'long';
  const skirtType = options.skirtType || 'straight';

  node.getChildMeshes().forEach(m => m.dispose());

  const topY = size.height * 0.98;
  const bottomY = size.height * 0.02;
  const garmentH = topY - bottomY;

  if (isSkirt) {
    if (skirtType === 'pleated') {
      cylinderComponent(registry, item, definition, 'fabric', {
        height: garmentH,
        diameterTop: size.width * 0.7,
        diameterBottom: size.width * 1.05,
        tessellation: 20
      }, {
        position: { x: 0, y: bottomY + garmentH / 2, z: 0 }
      }, { parent: node });
    } else if (skirtType === 'a_line') {
      cylinderComponent(registry, item, definition, 'fabric', {
        height: garmentH,
        diameterTop: size.width * 0.68,
        diameterBottom: size.width * 0.98,
        tessellation: 12
      }, {
        position: { x: 0, y: bottomY + garmentH / 2, z: 0 }
      }, { parent: node });
    } else {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.72,
        height: garmentH,
        depth: size.depth * 0.85
      }, {
        position: { x: 0, y: bottomY + garmentH / 2, z: 0 }
      }, { parent: node });
    }
  } else {
    const waistH = size.height * 0.1;
    boxComponent(registry, item, definition, 'detail', {
      width: size.width * 0.8,
      height: waistH,
      depth: size.depth * 0.8
    }, {
      position: { x: 0, y: topY - waistH / 2, z: 0 }
    }, { parent: node });

    let legBottomY = bottomY;
    if (pantsLength === 'short') {
      legBottomY = size.height * 0.5;
    } else if (pantsLength === 'medium') {
      legBottomY = size.height * 0.3;
    }
    const legH = (topY - waistH) - legBottomY;

    [-1, 1].forEach(side => {
      boxComponent(registry, item, definition, 'fabric', {
        width: size.width * 0.35,
        height: legH,
        depth: size.depth * 0.78
      }, {
        position: { x: side * size.width * 0.2, y: legBottomY + legH / 2, z: 0 }
      }, { parent: node });
    });

    if (options.hasCargoPockets) {
      [-1, 1].forEach(side => {
        boxComponent(registry, item, definition, 'detail', {
          width: size.width * 0.07,
          height: legH * 0.3,
          depth: size.depth * 0.84
        }, {
          position: { x: side * (size.width * 0.35 + size.width * 0.04), y: legBottomY + legH * 0.5, z: 0 }
        }, { parent: node });
      });
    }
  }
}

/**
 * 3. 构建帽子 (平放)
 */
export function buildHat(registry, item, definition, node, size, options = {}) {
  const brimType = options.brimType || 'round'; // 'round', 'front', 'none', 'downward', 'cowboy'
  const crownType = options.crownType || 'sphere'; // 'sphere', 'cylinder', 'flat'

  node.getChildMeshes().forEach(m => m.dispose());

  const brimH = size.height * 0.08;
  if (brimType === 'round') {
    cylinderComponent(registry, item, definition, 'brim', {
      height: brimH,
      diameterTop: size.width,
      diameterBottom: size.width,
      tessellation: 24
    }, {
      position: { x: 0, y: brimH / 2, z: 0 }
    }, { parent: node });
  } else if (brimType === 'front') {
    boxComponent(registry, item, definition, 'brim', {
      width: size.width * 0.75,
      height: brimH,
      depth: size.depth * 0.45
    }, {
      position: { x: 0, y: brimH / 2, z: size.depth * 0.25 },
      rotation: { x: 0.1, y: 0, z: 0 }
    }, { parent: node });
  } else if (brimType === 'downward') {
    cylinderComponent(registry, item, definition, 'brim', {
      height: size.height * 0.22,
      diameterTop: size.width * 0.65,
      diameterBottom: size.width,
      tessellation: 20
    }, {
      position: { x: 0, y: size.height * 0.11, z: 0 }
    }, { parent: node });
  } else if (brimType === 'cowboy') {
    cylinderComponent(registry, item, definition, 'brim', {
      height: brimH,
      diameterTop: size.width,
      diameterBottom: size.width,
      tessellation: 20
    }, {
      position: { x: 0, y: size.height * 0.12, z: 0 },
      rotation: { x: 0.08, y: 0, z: 0.12 }
    }, { parent: node });
  }

  const crownYStart = brimType === 'downward' ? size.height * 0.22 : (brimType === 'cowboy' ? size.height * 0.15 : brimH);
  const crownH = size.height - crownYStart;

  if (crownType === 'sphere') {
    sphereComponent(registry, item, definition, 'fabric', {
      diameter: size.width * 0.68
    }, {
      position: { x: 0, y: crownYStart + crownH * 0.4, z: brimType === 'front' ? -size.depth * 0.05 : 0 }
    }, { parent: node });
  } else if (crownType === 'cylinder') {
    cylinderComponent(registry, item, definition, 'fabric', {
      height: crownH,
      diameterTop: size.width * 0.6,
      diameterBottom: size.width * 0.62,
      tessellation: 20
    }, {
      position: { x: 0, y: crownYStart + crownH / 2, z: 0 }
    }, { parent: node });
  } else if (crownType === 'flat') {
    cylinderComponent(registry, item, definition, 'fabric', {
      height: crownH,
      diameterTop: size.width * 0.68,
      diameterBottom: size.width * 0.72,
      tessellation: 20
    }, {
      position: { x: 0, y: crownYStart + crownH / 2, z: 0 }
    }, { parent: node });
  }

  if (options.hasBand) {
    const bandH = crownH * 0.25;
    cylinderComponent(registry, item, definition, 'detail', {
      height: bandH,
      diameterTop: size.width * 0.63,
      diameterBottom: size.width * 0.64,
      tessellation: 20
    }, {
      position: { x: 0, y: crownYStart + bandH / 2, z: 0 }
    }, { parent: node });
  }
}

/**
 * 4. 构建鞋子 (一双)
 */
export function buildShoes(registry, item, definition, node, size, options = {}) {
  const heelType = options.heelType || 'flat';
  const shaftType = options.shaftType || 'low';
  const isOpen = !!options.isOpen;

  node.getChildMeshes().forEach(m => m.dispose());

  const shoeWidth = size.width * 0.38;
  const shoeDepth = size.depth * 0.95;

  [-1, 1].forEach(side => {
    const xOffset = side * size.width * 0.26;

    const soleH = size.height * 0.12;
    const heelH = heelType === 'heel' ? size.height * 0.48 : 0;

    // 1. 鞋底与鞋跟渲染
    if (heelType === 'heel') {
      // 抬高的后部鞋底
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth,
        height: soleH,
        depth: shoeDepth * 0.5
      }, {
        position: { x: xOffset, y: heelH + soleH / 2, z: -shoeDepth * 0.25 }
      }, { parent: node });

      // 平贴的前部鞋底
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth,
        height: soleH,
        depth: shoeDepth * 0.5
      }, {
        position: { x: xOffset, y: soleH / 2, z: shoeDepth * 0.25 }
      }, { parent: node });

      // 倾斜的中部鞋底连板
      const middleD = shoeDepth * 0.22;
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth * 0.98,
        height: soleH * 0.9,
        depth: middleD
      }, {
        position: { x: xOffset, y: heelH / 2 + soleH / 2, z: 0 },
        rotation: { x: -Math.atan2(heelH, shoeDepth * 0.5), y: 0, z: 0 }
      }, { parent: node });

      // 鞋跟向下支撑
      cylinderComponent(registry, item, definition, 'sole', {
        height: heelH,
        diameterTop: size.width * 0.04,
        diameterBottom: size.width * 0.04
      }, {
        position: { x: xOffset, y: heelH / 2, z: -shoeDepth * 0.38 }
      }, { parent: node });
    } else {
      // 平底鞋底
      boxComponent(registry, item, definition, 'sole', {
        width: shoeWidth,
        height: soleH,
        depth: shoeDepth
      }, {
        position: { x: xOffset, y: soleH / 2, z: 0 }
      }, { parent: node });
    }

    // 2. 前鞋面
    const frontH = size.height * 0.25;
    const frontD = shoeDepth * 0.55;
    boxComponent(registry, item, definition, 'fabric', {
      width: shoeWidth * 0.95,
      height: frontH,
      depth: frontD
    }, {
      position: { x: xOffset, y: soleH + frontH / 2, z: shoeDepth * 0.20 }
    }, { parent: node });

    // 3. 后鞋帮
    if (!isOpen) {
      let shaftH = size.height * 0.3;
      if (shaftType === 'high') {
        shaftH = size.height * 0.78;
      } else if (shaftType === 'mid') {
        shaftH = size.height * 0.52;
      }
      boxComponent(registry, item, definition, 'fabric', {
        width: shoeWidth * 0.95,
        height: shaftH,
        depth: shoeDepth * 0.45
      }, {
        position: { x: xOffset, y: heelH + soleH + shaftH / 2, z: -shoeDepth * 0.22 }
      }, { parent: node });
    }

    // 4. 鞋带
    if (options.hasLaces && !isOpen) {
      boxComponent(registry, item, definition, 'detail', {
        width: shoeWidth * 0.5,
        height: size.height * 0.05,
        depth: shoeDepth * 0.25
      }, {
        position: { x: xOffset, y: soleH + frontH + size.height * 0.03, z: shoeDepth * 0.05 }
      }, { parent: node });
    }
  });
}

/**
 * 5. 构建陈列模特 (男、女、小孩)
 */
export function buildMannequin(registry, item, definition, node, size, gender) {
  node.getChildMeshes().forEach(m => m.dispose());

  // 统一提取所有部件的高度、尺寸和Y轴坐标计算，防止局部引用死区
  const plateH = size.height * 0.03;
  const rodH = size.height * 0.48;
  const hipsY = plateH + rodH;
  const hipsH = size.height * 0.12;
  const chestY = hipsY + hipsH;
  const chestH = size.height * 0.24;
  const neckY = chestY + chestH;
  const neckH = size.height * 0.05;
  const headY = neckY + neckH;
  const headD = gender === 'child' ? size.width * 0.5 : size.width * 0.4;

  // 1. 底座圆盘
  cylinderComponent(registry, item, definition, 'base', {
    height: plateH,
    diameterTop: size.width,
    diameterBottom: size.width,
    tessellation: 20
  }, {
    position: { x: 0, y: plateH / 2, z: 0 }
  }, { parent: node });

  // 2. 底座撑杆
  cylinderComponent(registry, item, definition, 'base', {
    height: rodH,
    diameterTop: size.width * 0.05,
    diameterBottom: size.width * 0.05,
    tessellation: 8
  }, {
    position: { x: 0, y: plateH + rodH / 2, z: 0 }
  }, { parent: node });

  // 3. 臀部
  boxComponent(registry, item, definition, 'body', {
    width: size.width * 0.8,
    height: hipsH,
    depth: size.depth * 0.7
  }, {
    position: { x: 0, y: hipsY + hipsH / 2, z: 0 }
  }, { parent: node });

  // 4. 胸腹腔
  if (gender === 'female') {
    // 下腹部
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.64,
      height: chestH * 0.5,
      depth: size.depth * 0.48
    }, {
      position: { x: 0, y: chestY + chestH * 0.25, z: 0 }
    }, { parent: node });

    // 上胸部
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.74,
      height: chestH * 0.5,
      depth: size.depth * 0.52
    }, {
      position: { x: 0, y: chestY + chestH * 0.75, z: 0 }
    }, { parent: node });

    // 胸部曲线点缀
    [-1, 1].forEach(side => {
      sphereComponent(registry, item, definition, 'body', {
        diameter: size.width * 0.16
      }, {
        position: { x: side * size.width * 0.15, y: chestY + chestH * 0.68, z: size.depth * 0.22 }
      }, { parent: node });
    });
  } else if (gender === 'male') {
    // 下腹部
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.72,
      height: chestH * 0.5,
      depth: size.depth * 0.54
    }, {
      position: { x: 0, y: chestY + chestH * 0.25, z: 0 }
    }, { parent: node });

    // 上胸部
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.82,
      height: chestH * 0.5,
      depth: size.depth * 0.58
    }, {
      position: { x: 0, y: chestY + chestH * 0.75, z: 0 }
    }, { parent: node });
  } else {
    // 小孩
    boxComponent(registry, item, definition, 'body', {
      width: size.width * 0.68,
      height: chestH,
      depth: size.depth * 0.52
    }, {
      position: { x: 0, y: chestY + chestH / 2, z: 0 }
    }, { parent: node });
  }

  // 5. 脖颈
  cylinderComponent(registry, item, definition, 'body', {
    height: neckH,
    diameterTop: size.width * 0.2,
    diameterBottom: size.width * 0.2,
    tessellation: 12
  }, {
    position: { x: 0, y: neckY + neckH / 2, z: 0 }
  }, { parent: node });

  // 6. 头部
  sphereComponent(registry, item, definition, 'body', {
    diameter: headD
  }, {
    position: { x: 0, y: headY + headD / 2, z: 0 }
  }, { parent: node });
}

// ==================== 1. 衣服 (10件) ====================

export const clothing_t_shirt = {
  type: 'clothing_t_shirt',
  name: 'T恤',
  defaultSize: { width: 20, depth: 8, height: 24 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#4fc3f7' },
    { id: 'collar', label: '领口配饰', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_t_shirt, node, size, { sleeveType: 'short', hasCollar: true });
  }
};

export const clothing_shirt = {
  type: 'clothing_shirt',
  name: '衬衫',
  defaultSize: { width: 20, depth: 8, height: 24 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#e0f7fa' },
    { id: 'collar', label: '领口细节', defaultColor: '#b2ebf2' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_shirt, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_sweater = {
  type: 'clothing_sweater',
  name: '毛衣',
  defaultSize: { width: 20, depth: 8, height: 24 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#ffe082' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_sweater, node, size, { sleeveType: 'long', hasCollar: false });
  }
};

export const clothing_coat = {
  type: 'clothing_coat',
  name: '大衣',
  defaultSize: { width: 22, depth: 9, height: 38 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#8d6e63' },
    { id: 'collar', label: '衣领细节', defaultColor: '#5d4037' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_coat, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_jacket = {
  type: 'clothing_jacket',
  name: '夹克',
  defaultSize: { width: 21, depth: 9, height: 26 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#37474f' },
    { id: 'collar', label: '领口饰边', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_jacket, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_hoodie = {
  type: 'clothing_hoodie',
  name: '卫衣',
  defaultSize: { width: 22, depth: 9, height: 26 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#a1887f' },
    { id: 'collar', label: '帽兜衬里', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_hoodie, node, size, { sleeveType: 'long', hasHood: true, hasCollar: false });
  }
};

export const clothing_vest = {
  type: 'clothing_vest',
  name: '无袖背心',
  defaultSize: { width: 18, depth: 7, height: 22 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#e0e0e0' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_vest, node, size, { sleeveType: 'none', hasCollar: false });
  }
};

export const clothing_polo_shirt = {
  type: 'clothing_polo_shirt',
  name: 'Polo衫',
  defaultSize: { width: 20, depth: 8, height: 24 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#1a237e' },
    { id: 'collar', label: '翻领细节', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_polo_shirt, node, size, { sleeveType: 'short', hasCollar: true });
  }
};

export const clothing_cardigan = {
  type: 'clothing_cardigan',
  name: '开衫',
  defaultSize: { width: 21, depth: 8, height: 26 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#d1c4e9' },
    { id: 'collar', label: '门襟细节', defaultColor: '#b39ddb' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_cardigan, node, size, { sleeveType: 'long', hasCollar: true });
  }
};

export const clothing_tank_top = {
  type: 'clothing_tank_top',
  name: '吊带背心',
  defaultSize: { width: 18, depth: 7, height: 20 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#ff8a80' },
    { id: 'collar', label: '细吊带色', defaultColor: '#ff5252' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_tank_top, node, size, { sleeveType: 'strap', hasCollar: false });
  }
};

// ==================== 2. 裤子 (5条) ====================

export const clothing_jeans = {
  type: 'clothing_jeans',
  name: '牛仔裤',
  defaultSize: { width: 14, depth: 6, height: 32 },
  components: [
    { id: 'fabric', label: '牛仔布面料', defaultColor: '#1565c0' },
    { id: 'detail', label: '皮牌腰头', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_jeans, node, size, { isSkirt: false, pantsLength: 'long' });
  }
};

export const clothing_trousers = {
  type: 'clothing_trousers',
  name: '西裤',
  defaultSize: { width: 14, depth: 6, height: 32 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#212121' },
    { id: 'detail', label: '腰头饰边', defaultColor: '#424242' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_trousers, node, size, { isSkirt: false, pantsLength: 'long' });
  }
};

export const clothing_sweatpants = {
  type: 'clothing_sweatpants',
  name: '运动裤',
  defaultSize: { width: 15, depth: 7, height: 32 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#757575' },
    { id: 'detail', label: '抽绳细节', defaultColor: '#eeeeee' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_sweatpants, node, size, { isSkirt: false, pantsLength: 'long' });
  }
};

export const clothing_shorts = {
  type: 'clothing_shorts',
  name: '短裤',
  defaultSize: { width: 14, depth: 6, height: 18 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#81c784' },
    { id: 'detail', label: '腰部纽扣', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_shorts, node, size, { isSkirt: false, pantsLength: 'short' });
  }
};

export const clothing_cargo_pants = {
  type: 'clothing_cargo_pants',
  name: '工装裤',
  defaultSize: { width: 15, depth: 7, height: 32 },
  components: [
    { id: 'fabric', label: '面料主色', defaultColor: '#5d4037' },
    { id: 'detail', label: '大侧袋色', defaultColor: '#4e342e' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_cargo_pants, node, size, { isSkirt: false, pantsLength: 'long', hasCargoPockets: true });
  }
};

// ==================== 3. 短裙 (5条) ====================

export const clothing_pleated_skirt = {
  type: 'clothing_pleated_skirt',
  name: '百褶裙',
  defaultSize: { width: 14, depth: 12, height: 16 },
  components: [
    { id: 'fabric', label: '褶皱面料', defaultColor: '#e91e63' },
    { id: 'detail', label: '裙勾配饰', defaultColor: '#c2185b' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_pleated_skirt, node, size, { isSkirt: true, skirtType: 'pleated' });
  }
};

export const clothing_denim_skirt = {
  type: 'clothing_denim_skirt',
  name: '牛仔短裙',
  defaultSize: { width: 14, depth: 10, height: 16 },
  components: [
    { id: 'fabric', label: '牛仔面料', defaultColor: '#1e88e5' },
    { id: 'detail', label: '前置铜扣', defaultColor: '#ffb300' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_denim_skirt, node, size, { isSkirt: true, skirtType: 'straight' });
  }
};

export const clothing_leather_skirt = {
  type: 'clothing_leather_skirt',
  name: '皮裙',
  defaultSize: { width: 14, depth: 10, height: 16 },
  components: [
    { id: 'fabric', label: '皮革面料', defaultColor: '#111111' },
    { id: 'detail', label: '金属拉链', defaultColor: '#eeeeee' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_leather_skirt, node, size, { isSkirt: true, skirtType: 'straight' });
  }
};

export const clothing_a_line_skirt = {
  type: 'clothing_a_line_skirt',
  name: 'A字裙',
  defaultSize: { width: 14, depth: 11, height: 17 },
  components: [
    { id: 'fabric', label: '裙身面料', defaultColor: '#795548' },
    { id: 'detail', label: '腰带配饰', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_a_line_skirt, node, size, { isSkirt: true, skirtType: 'a_line' });
  }
};

export const clothing_pencil_skirt = {
  type: 'clothing_pencil_skirt',
  name: '一步裙',
  defaultSize: { width: 13, depth: 9, height: 18 },
  components: [
    { id: 'fabric', label: '裙身面料', defaultColor: '#37474f' },
    { id: 'detail', label: '装饰口袋', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    buildPantsOrSkirt(registry, item, clothing_pencil_skirt, node, size, { isSkirt: true, skirtType: 'straight' });
  }
};

// ==================== 4. 连衣裙/长裙 (10件) ====================

export const clothing_dress = {
  type: 'clothing_dress',
  name: '连衣裙',
  defaultSize: { width: 20, depth: 10, height: 40 },
  components: [
    { id: 'fabric', label: '裙面布料', defaultColor: '#f48fb1' },
    { id: 'collar', label: '领口束腰', defaultColor: '#f50057' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_dress, node, size, { sleeveType: 'short', skirtType: 'flare' });
  }
};

export const clothing_evening_gown = {
  type: 'clothing_evening_gown',
  name: '晚礼服',
  defaultSize: { width: 22, depth: 12, height: 46 },
  components: [
    { id: 'fabric', label: '丝绒礼服面料', defaultColor: '#311b92' },
    { id: 'collar', label: '肩带镶边', defaultColor: '#ea80fc' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_evening_gown, node, size, { sleeveType: 'none', skirtType: 'flare' });
  }
};

export const clothing_summer_dress = {
  type: 'clothing_summer_dress',
  name: '碎花裙',
  defaultSize: { width: 19, depth: 9, height: 36 },
  components: [
    { id: 'fabric', label: '夏日碎花布', defaultColor: '#fff59d' },
    { id: 'collar', label: '细吊带边', defaultColor: '#ff8f00' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_summer_dress, node, size, { sleeveType: 'strap', skirtType: 'flare' });
  }
};

export const clothing_slip_dress = {
  type: 'clothing_slip_dress',
  name: '丝绸裙',
  defaultSize: { width: 18, depth: 8, height: 38 },
  components: [
    { id: 'fabric', label: '真丝缎面', defaultColor: '#b2dfdb' },
    { id: 'collar', label: '蕾丝领边', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_slip_dress, node, size, { sleeveType: 'strap', skirtType: 'straight' });
  }
};

export const clothing_cheongsam = {
  type: 'clothing_cheongsam',
  name: '旗袍',
  defaultSize: { width: 18, depth: 7, height: 42 },
  components: [
    { id: 'fabric', label: '织锦缎面', defaultColor: '#b71c1c' },
    { id: 'collar', label: '盘扣立领', defaultColor: '#ffd700' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_cheongsam, node, size, { sleeveType: 'short', skirtType: 'straight', hasCollar: true });
  }
};

export const clothing_lolita_dress = {
  type: 'clothing_lolita_dress',
  name: '蓬蓬裙',
  defaultSize: { width: 22, depth: 14, height: 38 },
  components: [
    { id: 'fabric', label: '花边蓬蓬裙面', defaultColor: '#f8bbd0' },
    { id: 'collar', label: '荷叶蕾丝边', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_lolita_dress, node, size, { sleeveType: 'short', skirtType: 'flare', isLolita: true });
  }
};

export const clothing_lace_dress = {
  type: 'clothing_lace_dress',
  name: '蕾丝裙',
  defaultSize: { width: 20, depth: 10, height: 40 },
  components: [
    { id: 'fabric', label: '蕾丝外层', defaultColor: '#ffffff' },
    { id: 'collar', label: '内衬配饰', defaultColor: '#fce4ec' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_lace_dress, node, size, { sleeveType: 'short', skirtType: 'flare' });
  }
};

export const clothing_floral_dress = {
  type: 'clothing_floral_dress',
  name: '花卉长裙',
  defaultSize: { width: 20, depth: 10, height: 42 },
  components: [
    { id: 'fabric', label: '印花布料', defaultColor: '#c5e1a5' },
    { id: 'collar', label: '腰带蝴蝶结', defaultColor: '#7cb342' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_floral_dress, node, size, { sleeveType: 'long', skirtType: 'flare' });
  }
};

export const clothing_maxi_dress = {
  type: 'clothing_maxi_dress',
  name: '沙滩长裙',
  defaultSize: { width: 21, depth: 11, height: 44 },
  components: [
    { id: 'fabric', label: '雪纺面料', defaultColor: '#ffb74d' },
    { id: 'collar', label: '领口流苏', defaultColor: '#f57c00' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_maxi_dress, node, size, { sleeveType: 'none', skirtType: 'flare' });
  }
};

export const clothing_knit_dress = {
  type: 'clothing_knit_dress',
  name: '紧身裙',
  defaultSize: { width: 18, depth: 8, height: 38 },
  components: [
    { id: 'fabric', label: '针织布料', defaultColor: '#4e342e' },
    { id: 'collar', label: '罗纹袖口', defaultColor: '#3e2723' }
  ],
  build(registry, item, node, size) {
    buildCloth(registry, item, clothing_knit_dress, node, size, { sleeveType: 'long', skirtType: 'straight', hasCollar: true });
  }
};

// ==================== 5. 帽子 (10个) ====================

export const clothing_baseball_cap = {
  type: 'clothing_baseball_cap',
  name: '棒球帽',
  defaultSize: { width: 11, depth: 12, height: 6 },
  components: [
    { id: 'fabric', label: '帽顶面料', defaultColor: '#e53935' },
    { id: 'brim', label: '遮阳前檐', defaultColor: '#1e88e5' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_baseball_cap, node, size, { brimType: 'front', crownType: 'sphere' });
  }
};

export const clothing_beanie = {
  type: 'clothing_beanie',
  name: '毛线帽',
  defaultSize: { width: 10, depth: 10, height: 7 },
  components: [
    { id: 'fabric', label: '针织毛线', defaultColor: '#00bcd4' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_beanie, node, size, { brimType: 'none', crownType: 'sphere' });
  }
};

export const clothing_fedora = {
  type: 'clothing_fedora',
  name: '礼帽',
  defaultSize: { width: 12, depth: 13, height: 6 },
  components: [
    { id: 'fabric', label: '毛呢帽身', defaultColor: '#3e2723' },
    { id: 'brim', label: '平置帽檐', defaultColor: '#3e2723' },
    { id: 'detail', label: '真丝带扣', defaultColor: '#212121' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_fedora, node, size, { brimType: 'round', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_straw_hat = {
  type: 'clothing_straw_hat',
  name: '草帽',
  defaultSize: { width: 14, depth: 14, height: 5 },
  components: [
    { id: 'fabric', label: '编织麦秆', defaultColor: '#ffe0b2' },
    { id: 'brim', label: '大圆草檐', defaultColor: '#ffe0b2' },
    { id: 'detail', label: '环绕系带', defaultColor: '#e91e63' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_straw_hat, node, size, { brimType: 'round', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_bucket_hat = {
  type: 'clothing_bucket_hat',
  name: '渔夫帽',
  defaultSize: { width: 11, depth: 11, height: 6 },
  components: [
    { id: 'fabric', label: '纯棉帽顶', defaultColor: '#9e9d24' },
    { id: 'brim', label: '微斜帽檐', defaultColor: '#9e9d24' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_bucket_hat, node, size, { brimType: 'downward', crownType: 'flat' });
  }
};

export const clothing_beret = {
  type: 'clothing_beret',
  name: '贝雷帽',
  defaultSize: { width: 11, depth: 11, height: 4 },
  components: [
    { id: 'fabric', label: '毛呢绒面', defaultColor: '#880e4f' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_beret, node, size, { brimType: 'none', crownType: 'flat' });
  }
};

export const clothing_sun_hat = {
  type: 'clothing_sun_hat',
  name: '防晒帽',
  defaultSize: { width: 15, depth: 15, height: 5 },
  components: [
    { id: 'fabric', label: '防晒帽顶', defaultColor: '#fff8e1' },
    { id: 'brim', label: '超大帽檐', defaultColor: '#fff8e1' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_sun_hat, node, size, { brimType: 'round', crownType: 'flat' });
  }
};

export const clothing_cowboy_hat = {
  type: 'clothing_cowboy_hat',
  name: '牛仔帽',
  defaultSize: { width: 13, depth: 14, height: 7 },
  components: [
    { id: 'fabric', label: '磨砂绒皮', defaultColor: '#a1887f' },
    { id: 'brim', label: '卷边帽檐', defaultColor: '#a1887f' },
    { id: 'detail', label: '编织皮带', defaultColor: '#4e342e' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_cowboy_hat, node, size, { brimType: 'cowboy', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_top_hat = {
  type: 'clothing_top_hat',
  name: '高帽',
  defaultSize: { width: 12, depth: 12, height: 9 },
  components: [
    { id: 'fabric', label: '丝绸高帽顶', defaultColor: '#212121' },
    { id: 'brim', label: '弧形帽檐', defaultColor: '#212121' },
    { id: 'detail', label: '红色饰带', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_top_hat, node, size, { brimType: 'round', crownType: 'cylinder', hasBand: true });
  }
};

export const clothing_flat_cap = {
  type: 'clothing_flat_cap',
  name: '鸭舌帽',
  defaultSize: { width: 11, depth: 12, height: 5 },
  components: [
    { id: 'fabric', label: '格子呢帽身', defaultColor: '#455a64' },
    { id: 'brim', label: '短小帽舌', defaultColor: '#37474f' }
  ],
  build(registry, item, node, size) {
    buildHat(registry, item, clothing_flat_cap, node, size, { brimType: 'front', crownType: 'flat' });
  }
};

// ==================== 6. 鞋子 (10双) ====================

export const clothing_sneakers = {
  type: 'clothing_sneakers',
  name: '运动鞋',
  defaultSize: { width: 10, depth: 12, height: 4 },
  components: [
    { id: 'fabric', label: '网面鞋面', defaultColor: '#ffffff' },
    { id: 'sole', label: '橡胶防滑底', defaultColor: '#f5f5f5' },
    { id: 'detail', label: '彩色鞋带', defaultColor: '#2196f3' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_sneakers, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_leather_shoes = {
  type: 'clothing_leather_shoes',
  name: '皮鞋',
  defaultSize: { width: 10, depth: 12, height: 4 },
  components: [
    { id: 'fabric', label: '牛皮鞋面', defaultColor: '#4e342e' },
    { id: 'sole', label: '硬木叠底', defaultColor: '#2b1b17' },
    { id: 'detail', label: '打蜡鞋带', defaultColor: '#1a100c' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_leather_shoes, node, size, { heelType: 'mid', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_boots = {
  type: 'clothing_boots',
  name: '马丁靴',
  defaultSize: { width: 11, depth: 13, height: 8 },
  components: [
    { id: 'fabric', label: '硬质皮革', defaultColor: '#212121' },
    { id: 'sole', label: '生胶厚底', defaultColor: '#3e2723' },
    { id: 'detail', label: '长金属鞋孔', defaultColor: '#eeeeee' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_boots, node, size, { heelType: 'mid', shaftType: 'mid', hasLaces: true });
  }
};

export const clothing_high_heels = {
  type: 'clothing_high_heels',
  name: '高跟鞋',
  defaultSize: { width: 9, depth: 11, height: 6 },
  components: [
    { id: 'fabric', label: '亮漆皮鞋面', defaultColor: '#d81b60' },
    { id: 'sole', label: '防滑高跟', defaultColor: '#111111' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_high_heels, node, size, { heelType: 'heel', shaftType: 'low', isOpen: true });
  }
};

export const clothing_sandals = {
  type: 'clothing_sandals',
  name: '凉鞋',
  defaultSize: { width: 10, depth: 12, height: 3 },
  components: [
    { id: 'fabric', label: '系带布条', defaultColor: '#ffb300' },
    { id: 'sole', label: '软木凉鞋底', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_sandals, node, size, { heelType: 'flat', shaftType: 'low', isOpen: true });
  }
};

export const clothing_slippers = {
  type: 'clothing_slippers',
  name: '拖鞋',
  defaultSize: { width: 10, depth: 12, height: 3 },
  components: [
    { id: 'fabric', label: '棉绒鞋面', defaultColor: '#e8f5e9' },
    { id: 'sole', label: 'EVA鞋底', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_slippers, node, size, { heelType: 'flat', shaftType: 'low', isOpen: true });
  }
};

export const clothing_running_shoes = {
  type: 'clothing_running_shoes',
  name: '跑鞋',
  defaultSize: { width: 10, depth: 12, height: 4 },
  components: [
    { id: 'fabric', label: '网织透气面', defaultColor: '#00e676' },
    { id: 'sole', label: '缓震中底', defaultColor: '#ffffff' },
    { id: 'detail', label: '炫彩反光条', defaultColor: '#ffeb3b' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_running_shoes, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_loafers = {
  type: 'clothing_loafers',
  name: '乐福鞋',
  defaultSize: { width: 10, depth: 12, height: 3.5 },
  components: [
    { id: 'fabric', label: '反绒麂皮', defaultColor: '#37474f' },
    { id: 'sole', label: '牛筋鞋底', defaultColor: '#8d6e63' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_loafers, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: false });
  }
};

export const clothing_canvas_shoes = {
  type: 'clothing_canvas_shoes',
  name: '帆布鞋',
  defaultSize: { width: 10, depth: 12, height: 4.5 },
  components: [
    { id: 'fabric', label: '帆布面料', defaultColor: '#e53935' },
    { id: 'sole', label: '硫化橡胶底', defaultColor: '#ffffff' },
    { id: 'detail', label: '经典白鞋带', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_canvas_shoes, node, size, { heelType: 'flat', shaftType: 'low', hasLaces: true });
  }
};

export const clothing_rain_boots = {
  type: 'clothing_rain_boots',
  name: '雨靴',
  defaultSize: { width: 11, depth: 12, height: 10 },
  components: [
    { id: 'fabric', label: '防水橡胶身', defaultColor: '#ffeb3b' },
    { id: 'sole', label: '防滑厚胶底', defaultColor: '#f57f17' }
  ],
  build(registry, item, node, size) {
    buildShoes(registry, item, clothing_rain_boots, node, size, { heelType: 'flat', shaftType: 'high', hasLaces: false });
  }
};

