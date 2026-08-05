import { boxComponent, cylinderComponent, sphereComponent, latheComponent, coneComponent } from './_helpers.js';

// Photo 5 inspired miniature palette: warm, matte and deliberately low saturation.
export const SOFT_LOW_POLY_OUTDOOR_PALETTE = Object.freeze({
  warmWood: '#a77b55',
  darkWood: '#6f5846',
  cream: '#eadfcd',
  fabric: '#d9ccb8',
  sage: '#8fa184',
  metal: '#777a75',
  lightMetal: '#b9b8af',
  stone: '#b8afa2',
  paleStone: '#d8d0c3',
  darkStone: '#5e5c58',
  soil: '#675142',
  water: '#91c7c9',
  flower: '#d69aa5',
  charcoal: '#454743',
  terracotta: '#b87555',
  classicRed: '#bd3a3a'
});

const lieInteraction = (yRatio = 0.42, zRatio = 0) => ({
  type: 'lie',
  getInteractionPoints(size) {
    return [{ x: 0, y: size.height * yRatio, z: size.depth * zRatio, rot: 0 }];
  }
});

const addBikeTube = (registry, item, definition, componentId, start, end, thickness, parent, depth = thickness) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const startZ = start.z ?? 0;
  const endZ = end.z ?? 0;
  const length = Math.max(thickness, Math.hypot(dx, dy));

  return boxComponent(registry, item, definition, componentId, {
    width: length,
    height: thickness,
    depth
  }, {
    position: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
      z: (startZ + endZ) / 2
    },
    rotation: {
      z: Math.atan2(dy, dx)
    }
  }, { parent });
};

const addBikeWheelSpokes = (registry, item, definition, componentId, center, radius, depth, parent) => {
  const spokeLength = radius * 1.72;
  const spokeThickness = Math.max(0.006, radius * 0.04);

  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 6) + (index * Math.PI / 3);
    boxComponent(registry, item, definition, componentId, {
      width: spokeLength,
      height: spokeThickness,
      depth
    }, {
      position: center,
      rotation: { z: angle }
    }, { parent });
  }
};

const addBikeWheel = (registry, item, definition, center, wheelRadius, wheelThickness, parent) => {
  const tireOuterR = wheelRadius;
  const tireInnerR = wheelRadius * 0.86;
  const tireHalfH = wheelThickness / 2;

  latheComponent(registry, item, definition, 'tires', {
    shape: [
      { x: tireInnerR, y: -tireHalfH },
      { x: tireOuterR, y: -tireHalfH },
      { x: tireOuterR, y: tireHalfH },
      { x: tireInnerR, y: tireHalfH },
      { x: tireInnerR, y: -tireHalfH }
    ],
    tessellation: 10
  }, {
    position: center,
    rotation: { x: Math.PI / 2 }
  }, { parent });

  const rimOuterR = tireInnerR;
  const rimInnerR = wheelRadius * 0.82;
  const rimHalfH = (wheelThickness * 0.68) / 2;

  latheComponent(registry, item, definition, 'frame', {
    shape: [
      { x: rimInnerR, y: -rimHalfH },
      { x: rimOuterR, y: -rimHalfH },
      { x: rimOuterR, y: rimHalfH },
      { x: rimInnerR, y: rimHalfH },
      { x: rimInnerR, y: -rimHalfH }
    ],
    tessellation: 10
  }, {
    position: center,
    rotation: { x: Math.PI / 2 }
  }, { parent });

  addBikeWheelSpokes(registry, item, definition, 'metal', center, rimInnerR, wheelThickness * 0.34, parent);

  cylinderComponent(registry, item, definition, 'metal', {
    diameterTop: wheelRadius * 0.12,
    diameterBottom: wheelRadius * 0.12,
    height: wheelThickness * 1.15,
    tessellation: 8
  }, {
    position: center,
    rotation: { x: Math.PI / 2 }
  }, { parent });
};

export const outdoorUmbrellaFurniture = {
  type: 'outdoor_umbrella',
  name: '遮阳伞',
  unit: 'm',
  defaultSize: { width: 1.05, depth: 1.05, height: 2.25 },
  components: [
    { id: 'canopy', label: '伞蓬', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'pole', label: '伞杆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'base', label: '底座', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone }
  ],
  build(registry, item, node, size) {
    const canopyH = Math.max(0.06, size.height * 0.1);
    const poleH = size.height - canopyH - 0.04;
    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'canopy', {
      diameterTop: size.width * 0.2,
      diameterBottom: size.width,
      height: canopyH,
      tessellation: 10
    }, { position: { x: 0, y: poleH + canopyH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'pole', {
      diameterTop: 0.05,
      diameterBottom: 0.06,
      height: poleH,
      tessellation: 8
    }, { position: { x: 0, y: poleH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'base', {
      diameterTop: size.width * 0.22,
      diameterBottom: size.width * 0.26,
      height: 0.05,
      tessellation: 10
    }, { position: { x: 0, y: 0.025, z: 0 } }, { parent: node });
  }
};

export const pergolaFurniture = {
  type: 'pergola',
  name: '葡萄架',
  unit: 'm',
  defaultSize: { width: 2.45, depth: 1.5, height: 2.45 },
  components: [
    { id: 'posts', label: '立柱', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'beams', label: '横梁', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'vines', label: '爬藤', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.sage }
  ],
  build(registry, item, node, size) {
    const postW = Math.max(0.08, size.width * 0.03);
    const beamH = Math.max(0.08, size.height * 0.04);
    const xOffset = size.width / 2 - postW / 2;
    const zOffset = size.depth / 2 - postW / 2;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, pergolaFurniture, 'posts', {
          width: postW,
          height: size.height,
          depth: postW
        }, { position: { x: xSide * xOffset, y: size.height / 2, z: zSide * zOffset } }, { parent: node });
      });
    });

    boxComponent(registry, item, pergolaFurniture, 'beams', {
      width: size.width,
      height: beamH,
      depth: postW
    }, { position: { x: 0, y: size.height - beamH / 2, z: zOffset } }, { parent: node });
    boxComponent(registry, item, pergolaFurniture, 'beams', {
      width: size.width,
      height: beamH,
      depth: postW
    }, { position: { x: 0, y: size.height - beamH / 2, z: -zOffset } }, { parent: node });

    for (let index = -2; index <= 2; index += 1) {
      boxComponent(registry, item, pergolaFurniture, 'vines', {
        width: postW,
        height: beamH * 0.8,
        depth: size.depth * 0.9
      }, {
        position: {
          x: index * size.width * 0.18,
          y: size.height - beamH * 0.7,
          z: 0
        }
      }, { parent: node });
    }
  }
};

export const flowerArchFurniture = {
  type: 'flower_arch',
  name: '花圈拱门',
  unit: 'm',
  defaultSize: { width: 1.85, depth: 0.5, height: 2.35 },
  components: [
    { id: 'frame', label: '白色铁艺拱架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'vines', label: '攀援绿藤叶', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.sage },
    { id: 'flowers', label: '玫瑰花艺', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.flower }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const postW = Math.max(0.04, w * 0.02);
    const gridBarW = 0.018;
    const straightH = h * 0.65;
    const archRadius = (w - postW) / 2;

    // 1. 左右两侧铁艺梯网格 (Trellis Side Towers)
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - postW / 2);

      // 前后双立柱
      [-1, 1].forEach((zSide) => {
        const zPos = zSide * (d / 2 - postW / 2);
        boxComponent(registry, item, flowerArchFurniture, 'frame', {
          width: postW,
          height: straightH,
          depth: postW
        }, { position: { x: xPos, y: straightH / 2, z: zPos } }, { parent: node });
      });

      // 侧面横向支撑格子条
      for (let i = 1; i <= 4; i += 1) {
        const yPos = (straightH / 5) * i;
        boxComponent(registry, item, flowerArchFurniture, 'frame', {
          width: postW,
          height: gridBarW,
          depth: d - postW
        }, { position: { x: xPos, y: yPos, z: 0 } }, { parent: node });
      }

      // 侧面中央竖向加固条
      boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: postW * 0.8,
        height: straightH,
        depth: gridBarW
      }, { position: { x: xPos, y: straightH / 2, z: 0 } }, { parent: node });
    });

    // 2. 顶部弧形拱门框架 (Smooth Arch Ring)
    const archSegments = 10;
    [-1, 1].forEach((zSide) => {
      const zPos = zSide * (d / 2 - postW / 2);
      for (let i = 0; i < archSegments; i += 1) {
        const angle1 = (Math.PI / archSegments) * i;
        const angle2 = (Math.PI / archSegments) * (i + 1);

        const x1 = Math.cos(angle1) * archRadius;
        const y1 = straightH + Math.sin(angle1) * archRadius;
        const x2 = Math.cos(angle2) * archRadius;
        const y2 = straightH + Math.sin(angle2) * archRadius;

        const segLen = Math.hypot(x2 - x1, y2 - y1) * 1.05;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const rotZ = Math.atan2(y2 - y1, x2 - x1);

        boxComponent(registry, item, flowerArchFurniture, 'frame', {
          width: segLen,
          height: postW,
          depth: postW
        }, {
          position: { x: midX, y: midY, z: zPos },
          rotation: { z: rotZ }
        }, { parent: node });
      }
    });

    // 前后拱圈之间的跨接横梁
    for (let i = 1; i < archSegments; i += 1) {
      const angle = (Math.PI / archSegments) * i;
      const x = Math.cos(angle) * archRadius;
      const y = straightH + Math.sin(angle) * archRadius;
      boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: postW,
        height: postW,
        depth: d - postW
      }, { position: { x, y, z: 0 } }, { parent: node });
    }

    // 3. 缠绕爬藤与丰满绿叶簇 (Climbing Vines & Leaf Clusters)
    const vinePoints = [];

    // 两侧垂直爬藤
    for (let side of [-1, 1]) {
      for (let step = 0; step <= 5; step += 1) {
        const vY = (straightH / 5) * step + 0.05;
        vinePoints.push({
          x: side * (w / 2 - postW / 2) + (step % 2 === 0 ? 0.03 : -0.03) * side,
          y: vY,
          z: (step % 2 === 0 ? 0.06 : -0.06),
          size: 0.16 + (step % 3) * 0.04
        });
      }
    }

    // 拱门沿线爬藤
    for (let i = 0; i <= archSegments; i += 1) {
      const angle = (Math.PI / archSegments) * i;
      const vx = Math.cos(angle) * (archRadius + 0.02);
      const vy = straightH + Math.sin(angle) * (archRadius + 0.02);
      vinePoints.push({
        x: vx,
        y: vy,
        z: (i % 2 === 0 ? 0.05 : -0.05),
        size: 0.18 + (i % 3) * 0.05
      });
    }

    vinePoints.forEach((vp) => {
      // 绿叶块
      sphereComponent(registry, item, flowerArchFurniture, 'vines', {
        diameterX: vp.size,
        diameterY: vp.size * 0.85,
        diameterZ: vp.size,
        segments: 6
      }, { position: { x: vp.x, y: vp.y, z: vp.z } }, { parent: node });
    });

    // 4. 点缀交错的玫瑰花朵 (Rose Bloom Heads)
    vinePoints.forEach((vp, idx) => {
      if (idx % 2 === 0) {
        const roseS = vp.size * 0.48;
        sphereComponent(registry, item, flowerArchFurniture, 'flowers', {
          diameterX: roseS,
          diameterY: roseS,
          diameterZ: roseS,
          segments: 6
        }, {
          position: {
            x: vp.x + (idx % 3 === 0 ? 0.04 : -0.04),
            y: vp.y + (idx % 2 === 0 ? 0.02 : -0.02),
            z: vp.z + 0.05
          }
        }, { parent: node });
      }
    });

    // 5. 类似楼梯整体碰撞箱的隐形包围盒 (Hitbox / Proxy Collision Box)
    const sideHitW = postW * 3.5;
    const sideHitD = d * 1.2;

    [-1, 1].forEach((side) => {
      const hb = boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: sideHitW,
        height: straightH,
        depth: sideHitD
      }, { position: { x: side * (w / 2 - postW / 2), y: straightH / 2, z: 0 } }, { parent: node });
      hb.visibility = 0;
      hb.isPickable = true;
      hb.metadata = { ...(hb.metadata || {}), blueprintItemId: item.id, blueprintFurnitureComponentId: 'frame', isHitbox: true };
    });

    const topHb = boxComponent(registry, item, flowerArchFurniture, 'frame', {
      width: w,
      height: archRadius + 0.1,
      depth: sideHitD
    }, { position: { x: 0, y: straightH + (archRadius + 0.1) / 2, z: 0 } }, { parent: node });
    topHb.visibility = 0;
    topHb.isPickable = true;
    topHb.metadata = { ...(topHb.metadata || {}), blueprintItemId: item.id, blueprintFurnitureComponentId: 'frame', isHitbox: true };
  }
};

export const gazeboFurniture = {
  type: 'gazebo',
  name: '凉亭',
  unit: 'm',
  defaultSize: { width: 3.2, depth: 3.2, height: 3.6 },
  components: [
    { id: 'posts', label: '立柱与木框', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'roof', label: '飞檐屋顶与宝顶', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'rails', label: '石基座与栏杆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone }
  ],
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const baseH = 0.28;
    const baseR = Math.min(w, d) * 0.44;
    const pillarR = 0.075;
    const pillarH = h * 0.54;
    const roofH = h * 0.35;
    const pillarRadiusPos = baseR * 0.85;

    // 1. 六边形自然暖石基座 (Hexagonal Stone Base Platform)
    for (let i = 0; i < 6; i += 1) {
      const a1 = (Math.PI / 3) * i;
      const a2 = (Math.PI / 3) * (i + 1);

      const p1 = { x: Math.cos(a1) * baseR, z: Math.sin(a1) * baseR };
      const p2 = { x: Math.cos(a2) * baseR, z: Math.sin(a2) * baseR };

      const edgeLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z) + Math.PI / 2;

      // 侧边压条
      boxComponent(registry, item, gazeboFurniture, 'rails', {
        width: edgeLen * 1.02,
        height: baseH,
        depth: baseR * 0.3
      }, {
        position: { x: midX * 0.85, y: baseH / 2, z: midZ * 0.85 },
        rotation: { y: rotY }
      }, { parent: node });
    }

    // 中心台面
    cylinderComponent(registry, item, gazeboFurniture, 'rails', {
      diameterTop: baseR * 1.9,
      diameterBottom: baseR * 1.95,
      height: baseH * 0.9,
      tessellation: 6
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    // 2. 六根古木立柱与柱础 (6 Pillars & Stone Bases)
    const pillarPositions = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const px = Math.cos(angle) * pillarRadiusPos;
      const pz = Math.sin(angle) * pillarRadiusPos;
      pillarPositions.push({ x: px, z: pz, angle });

      // 石柱础 (Base)
      cylinderComponent(registry, item, gazeboFurniture, 'rails', {
        diameterTop: pillarR * 2.8,
        diameterBottom: pillarR * 3.2,
        height: 0.08,
        tessellation: 8
      }, { position: { x: px, y: baseH + 0.04, z: pz } }, { parent: node });

      // 木柱 (Pillar)
      cylinderComponent(registry, item, gazeboFurniture, 'posts', {
        diameterTop: pillarR * 1.9,
        diameterBottom: pillarR * 2.1,
        height: pillarH,
        tessellation: 8
      }, { position: { x: px, y: baseH + 0.08 + pillarH / 2, z: pz } }, { parent: node });
    }

    // 定义 1 和 3 号门洞开口侧边索引（Side 0 与 间隔一侧的 Side 2）
    const doorSidesSet = new Set([0, 2]);

    // 3. 在两个门口外侧各生成一套平铺递进的石阶梯与矮护沿 (Flat Stepped Entrances on Both Openings)
    doorSidesSet.forEach((sideIdx) => {
      const p1 = pillarPositions[sideIdx];
      const p2 = pillarPositions[(sideIdx + 1) % 6];

      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const spanLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);

      // 向外的法线向量与角度
      const normLen = Math.hypot(midX, midZ);
      const normX = midX / normLen;
      const normZ = midZ / normLen;
      const rotNormY = Math.atan2(normX, normZ);

      // 平行于侧边的切线向量
      const tanX = (p2.x - p1.x) / spanLen;
      const tanZ = (p2.z - p1.z) / spanLen;

      const stepW = spanLen * 0.72; // 沿切向的踩踏宽度
      const stepRun = 0.22; // 沿法向踩踏踏板深度
      const stepCount = 3;
      const riserH = baseH / stepCount;

      // 3 级石阶由外向内阶梯递增
      for (let s = 1; s <= stepCount; s += 1) {
        const curH = riserH * (stepCount - s + 1);
        const distOut = stepRun * s;

        boxComponent(registry, item, gazeboFurniture, 'rails', {
          width: stepW,
          height: curH,
          depth: stepRun * 1.05
        }, {
          position: { x: midX + normX * distOut, y: curH / 2, z: midZ + normZ * distOut },
          rotation: { y: rotNormY }
        }, { parent: node });
      }

      // 两侧斜向石挡板/手扶压条 (沿着法线向外封闭)
      [-1, 1].forEach((handSide) => {
        const hx = midX + tanX * (stepW * 0.48 * handSide) + normX * (stepRun * 1.8);
        const hz = midZ + tanZ * (stepW * 0.48 * handSide) + normZ * (stepRun * 1.8);

        boxComponent(registry, item, gazeboFurniture, 'rails', {
          width: 0.06,
          height: baseH * 0.75,
          depth: stepRun * 3.2
        }, {
          position: { x: hx, y: baseH * 0.4, z: hz },
          rotation: { y: rotNormY }
        }, { parent: node });
      });
    });

    // 4. 额枋与上部花格挂落 (Upper Carved Wood Lattice - 6 面全部保留)
    const upperY = baseH + 0.08 + pillarH - 0.12;
    for (let i = 0; i < 6; i += 1) {
      const p1 = pillarPositions[i];
      const p2 = pillarPositions[(i + 1) % 6];

      const spanLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      // 上横梁额枋
      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.12,
        height: 0.14,
        depth: spanLen * 1.05
      }, {
        position: { x: midX, y: upperY + 0.07, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });

      // 下挂花窗格框架
      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.03,
        height: 0.18,
        depth: spanLen * 0.88
      }, {
        position: { x: midX, y: upperY - 0.08, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });
    }

    // 5. 下部围栏/美人靠 (仅在非门洞的 4 个侧面上安装)
    const lowerY = baseH + 0.08 + 0.35;
    for (let i = 0; i < 6; i += 1) {
      if (doorSidesSet.has(i)) {
        continue; // 1 与 3 号门口出入通道留空
      }

      const p1 = pillarPositions[i];
      const p2 = pillarPositions[(i + 1) % 6];
      const spanLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      // 护栏扶手与底座
      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.06,
        height: 0.04,
        depth: spanLen * 0.92
      }, {
        position: { x: midX, y: lowerY, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });

      boxComponent(registry, item, gazeboFurniture, 'posts', {
        width: 0.05,
        height: 0.04,
        depth: spanLen * 0.92
      }, {
        position: { x: midX, y: baseH + 0.12, z: midZ },
        rotation: { y: rotY }
      }, { parent: node });

      // 栏杆竖向花格条
      const railBarCount = 7;
      for (let b = 1; b <= railBarCount; b += 1) {
        const frac = b / (railBarCount + 1);
        const bx = p1.x + (p2.x - p1.x) * frac;
        const bz = p1.z + (p2.z - p1.z) * frac;

        boxComponent(registry, item, gazeboFurniture, 'posts', {
          width: 0.025,
          height: lowerY - (baseH + 0.12),
          depth: 0.025
        }, {
          position: { x: bx, y: (lowerY + baseH + 0.12) / 2, z: bz }
        }, { parent: node });
      }
    }

    // 6. 六角飞檐翘角屋顶 (屋脊与飞檐翘角精准落在 6 条交界棱线上)
    const roofStartY = baseH + 0.08 + pillarH;
    const eaveR = baseR * 1.35;
    const coneRadiusBottom = eaveR * 1.02;

    // 主屋顶锥形盖 (Hexagonal Main Roof Cone)
    cylinderComponent(registry, item, gazeboFurniture, 'roof', {
      diameterTop: 0.2,
      diameterBottom: coneRadiusBottom * 2,
      height: roofH,
      tessellation: 6
    }, { position: { x: 0, y: roofStartY + roofH / 2, z: 0 } }, { parent: node });

    // 6 条屋脊梁与贴合在 6 条交界棱线顶角上的飞檐翘角
    for (let i = 0; i < 6; i += 1) {
      // 关键修正：交界棱线角度 (0, 60°, 120°, 180°, 240°, 300°)
      const ridgeAngle = (Math.PI / 3) * i;
      const ex = Math.cos(ridgeAngle) * coneRadiusBottom;
      const ez = Math.sin(ridgeAngle) * coneRadiusBottom;

      // 脊梁线条
      const ridgeLen = Math.hypot(coneRadiusBottom, roofH);
      const ridgeMidX = ex * 0.5;
      const ridgeMidZ = ez * 0.5;
      const ridgeMidY = roofStartY + roofH / 2;

      boxComponent(registry, item, gazeboFurniture, 'roof', {
        width: 0.06,
        height: 0.06,
        depth: ridgeLen
      }, {
        position: { x: ridgeMidX, y: ridgeMidY, z: ridgeMidZ },
        rotation: {
          y: -ridgeAngle + Math.PI / 2,
          x: Math.atan2(roofH, coneRadiusBottom)
        }
      }, { parent: node });

      // 贴合在交界棱线顶角处的飞檐翘角 (Upcurved Tip exactly on Ridge Corners)
      boxComponent(registry, item, gazeboFurniture, 'roof', {
        width: 0.1,
        height: 0.06,
        depth: 0.28
      }, {
        position: { x: ex * 1.02, y: roofStartY + 0.05, z: ez * 1.02 },
        rotation: {
          y: -ridgeAngle + Math.PI / 2,
          x: -Math.PI * 0.08
        }
      }, { parent: node });
    }

    // 7. 顶端中式葫芦宝顶/塔刹 (Stupa Finial Ornament)
    const topY = roofStartY + roofH;

    // 宝顶底座
    cylinderComponent(registry, item, gazeboFurniture, 'roof', {
      diameterTop: 0.22,
      diameterBottom: 0.32,
      height: 0.12,
      tessellation: 8
    }, { position: { x: 0, y: topY + 0.06, z: 0 } }, { parent: node });

    // 葫芦腹部大球
    sphereComponent(registry, item, gazeboFurniture, 'roof', {
      diameterX: 0.28,
      diameterY: 0.28,
      diameterZ: 0.28,
      segments: 8
    }, { position: { x: 0, y: topY + 0.24, z: 0 } }, { parent: node });

    // 葫芦腰颈部
    cylinderComponent(registry, item, gazeboFurniture, 'roof', {
      diameterTop: 0.12,
      diameterBottom: 0.16,
      height: 0.08,
      tessellation: 8
    }, { position: { x: 0, y: topY + 0.38, z: 0 } }, { parent: node });

    // 宝顶最上方小圆球
    sphereComponent(registry, item, gazeboFurniture, 'roof', {
      diameterX: 0.18,
      diameterY: 0.2,
      diameterZ: 0.18,
      segments: 8
    }, { position: { x: 0, y: topY + 0.48, z: 0 } }, { parent: node });
  }
};

export const patioSwingFurniture = {
  type: 'patio_swing',
  name: '秋千',
  unit: 'm',
  defaultSize: { width: 2, depth: 1.3, height: 2 },
  components: [
    { id: 'frame', label: '支架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'seat', label: '座椅', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.fabric },
    { id: 'canopy', label: '顶蓬', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: -size.width * 0.18, y: size.height * 0.38, z: 0, rot: 0 },
        { x: size.width * 0.18, y: size.height * 0.38, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const postW = Math.max(0.05, size.width * 0.025);
    const xOffset = size.width * 0.42;
    const zOffset = size.depth * 0.20;
    [-1, 1].forEach((side) => {
      const frontPost = boxComponent(registry, item, patioSwingFurniture, 'frame', {
        width: postW,
        height: size.height * 0.94,
        depth: postW
      }, { position: { x: side * xOffset, y: size.height * 0.47, z: zOffset } }, { parent: node });
      frontPost.rotation.x = -Math.PI * 0.08;
      // frontPost.rotation.z = -side * Math.PI * 0.08;

      const rearPost = boxComponent(registry, item, patioSwingFurniture, 'frame', {
        width: postW,
        height: size.height * 0.94,
        depth: postW
      }, { position: { x: side * xOffset, y: size.height * 0.47, z: -zOffset } }, { parent: node });
      rearPost.rotation.x = Math.PI * 0.08;
      // rearPost.rotation.z = side * Math.PI * 0.08;
    });

    boxComponent(registry, item, patioSwingFurniture, 'frame', {
      width: size.width * 0.92,
      height: postW,
      depth: postW
    }, { position: { x: 0, y: size.height * 0.92, z: 0 } }, { parent: node });

    boxComponent(registry, item, patioSwingFurniture, 'seat', {
      width: size.width * 0.58,
      height: 0.05,
      depth: size.depth * 0.34
    }, { position: { x: 0, y: size.height * 0.34, z: 0 } }, { parent: node });

    boxComponent(registry, item, patioSwingFurniture, 'seat', {
      width: size.width * 0.58,
      height: size.height * 0.16,
      depth: 0.05
    }, { position: { x: 0, y: size.height * 0.46, z: -size.depth * 0.13 } }, { parent: node });

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, patioSwingFurniture, 'frame', {
        width: 0.02,
        height: size.height * 0.42,
        depth: 0.02
      }, { position: { x: side * size.width * 0.22, y: size.height * 0.56, z: -size.depth * 0.06 } }, { parent: node });
    });

    boxComponent(registry, item, patioSwingFurniture, 'canopy', {
      width: size.width * 0.72,
      height: 0.04,
      depth: size.depth * 0.44
    }, { position: { x: 0, y: size.height * 0.82, z: 0 } }, { parent: node });
  }
};

export const hammockStandFurniture = {
  type: 'hammock_stand',
  name: '吊床架',
  unit: 'm',
  defaultSize: { width: 2.6, depth: 0.85, height: 1.2 },
  components: [
    { id: 'frame', label: '支架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'bed', label: '吊床', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: lieInteraction(0.45),
  build(registry, item, node, size) {
    const frameW = Math.max(0.04, size.width * 0.02);
    const beam = boxComponent(registry, item, hammockStandFurniture, 'frame', {
      width: size.width * 0.88,
      height: frameW,
      depth: frameW
    }, { position: { x: 0, y: size.height * 0.88, z: 0 } }, { parent: node });
    beam.rotation.z = Math.PI * 0.02;

    [-1, 1].forEach((side) => {
      const leg = boxComponent(registry, item, hammockStandFurniture, 'frame', {
        width: frameW,
        height: size.height,
        depth: frameW
      }, { position: { x: side * size.width * 0.42, y: size.height / 2, z: 0 } }, { parent: node });
      leg.rotation.z = -side * Math.PI * 0.18;
    });

    const bed = boxComponent(registry, item, hammockStandFurniture, 'bed', {
      width: size.width * 0.62,
      height: 0.03,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.38, z: 0 } }, { parent: node });
    bed.rotation.z = Math.PI * 0.05;
  }
};

export const firePitFurniture = {
  type: 'fire_pit',
  name: '火盆',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.75, height: 0.4 },
  components: [
    { id: 'bowl', label: '火盆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone },
    { id: 'base', label: '底架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'ring', label: '炉沿', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, firePitFurniture, 'base', {
      diameterTop: size.width * 0.46,
      diameterBottom: size.width * 0.6,
      height: size.height * 0.32,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.16, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, firePitFurniture, 'bowl', {
      diameterTop: size.width,
      diameterBottom: size.width * 0.74,
      height: size.height * 0.52,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, firePitFurniture, 'ring', {
      diameterTop: size.width * 0.86,
      diameterBottom: size.width * 0.86,
      height: 0.03,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.73, z: 0 } }, { parent: node });
  }
};

export const barbecueGrillFurniture = {
  type: 'barbecue_grill',
  name: '烧烤架',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.55, height: 1.05 },
  components: [
    { id: 'grill', label: '烤炉', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'legs', label: '支腿', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.metal },
    { id: 'shelf', label: '置物板', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    const bodyH = size.height * 0.38;
    boxComponent(registry, item, barbecueGrillFurniture, 'grill', {
      width: size.width * 0.8,
      height: bodyH,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.62, z: 0 } }, { parent: node });

    const lid = boxComponent(registry, item, barbecueGrillFurniture, 'grill', {
      width: size.width * 0.8,
      height: bodyH * 0.58,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height * 0.84, z: 0 } }, { parent: node });
    lid.rotation.x = Math.PI * 0.08;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, barbecueGrillFurniture, 'legs', {
          width: 0.04,
          height: size.height * 0.5,
          depth: 0.04
        }, { position: { x: xSide * size.width * 0.26, y: size.height * 0.25, z: zSide * size.depth * 0.22 } }, { parent: node });
      });
    });

    boxComponent(registry, item, barbecueGrillFurniture, 'shelf', {
      width: size.width * 0.72,
      height: 0.03,
      depth: size.depth * 0.48
    }, { position: { x: 0, y: size.height * 0.18, z: 0 } }, { parent: node });
  }
};

export const patioHeaterFurniture = {
  type: 'patio_heater',
  name: '取暖器',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 2.15 },
  components: [
    { id: 'base', label: '底座', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.metal },
    { id: 'pole', label: '立杆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.lightMetal },
    { id: 'hood', label: '散热盘', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, patioHeaterFurniture, 'base', {
      diameterTop: size.width * 0.5,
      diameterBottom: size.width * 0.62,
      height: size.height * 0.08,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.04, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, patioHeaterFurniture, 'pole', {
      diameterTop: 0.04,
      diameterBottom: 0.05,
      height: size.height * 0.76,
      tessellation: 8
    }, { position: { x: 0, y: size.height * 0.46, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, patioHeaterFurniture, 'hood', {
      diameterTop: size.width * 0.2,
      diameterBottom: size.width,
      height: size.height * 0.12,
      tessellation: 10
    }, { position: { x: 0, y: size.height * 0.9, z: 0 } }, { parent: node });
  }
};

export const gardenFountainFurniture = {
  type: 'garden_fountain',
  waterControllable: true,
  name: '喷泉',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.8, height: 1.3 },
  components: [
    { id: 'base', label: '底盆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'column', label: '泉柱', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone },
    { id: 'top', label: '顶盆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'water', label: '水体', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water }
  ],
  build(registry, item, node, size) {
    // 1. 中空圆形底盆车削结构 (优化替代底板和拼接围板)
    const baseBottomH = 0.03;
    const baseH = size.height * 0.22;
    const baseWallT = 0.04;
    latheComponent(registry, item, gardenFountainFurniture, 'base', {
      shape: [
        { x: 0, y: 0 },
        { x: size.width / 2, y: 0 },
        { x: size.width / 2, y: baseH },
        { x: size.width / 2 - baseWallT, y: baseH },
        { x: size.width / 2 - baseWallT, y: baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2. 喷泉中央泉柱
    cylinderComponent(registry, item, gardenFountainFurniture, 'column', {
      diameterTop: size.width * 0.16,
      diameterBottom: size.width * 0.22,
      height: size.height * 0.44,
      tessellation: 8
    }, { position: { x: 0, y: size.height * 0.44, z: 0 } }, { parent: node });

    // 3. 中空圆形顶盆车削结构 (优化替代底板和拼接围板)
    const topBottomH = 0.025;
    const topH = size.height * 0.16;
    const topY = size.height * 0.66;
    const topDiameter = size.width * 0.58;
    const topWallT = 0.03;
    latheComponent(registry, item, gardenFountainFurniture, 'top', {
      shape: [
        { x: 0, y: 0 },
        { x: topDiameter / 2, y: 0 },
        { x: topDiameter / 2, y: topH },
        { x: topDiameter / 2 - topWallT, y: topH },
        { x: topDiameter / 2 - topWallT, topBottomH },
        { x: 0, y: topBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: topY, z: 0 } }, { parent: node });

    // 4. 喷泉双层凹槽蓄水面 (蓄在盆内部)
    if (item.waterEnabled !== false) {
      // 底盆水面 (比底盆边缘矮 0.03米)
      cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
        diameterTop: size.width - baseWallT * 2 - 0.01,
        diameterBottom: size.width - baseWallT * 2 - 0.01,
        height: 0.005,
        tessellation: 10
      }, { position: { x: 0, y: baseH - 0.03, z: 0 } }, { parent: node });

      // 顶盆水面 (比顶盆边缘矮 0.02米)
      cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
        diameterTop: topDiameter - topWallT * 2 - 0.01,
        diameterBottom: topDiameter - topWallT * 2 - 0.01,
        height: 0.005,
        tessellation: 8
      }, { position: { x: 0, y: topY + topH - 0.02, z: 0 } }, { parent: node });

      // 7. 8条垂直落水柱 (从顶盆流下到底盆)
      const streamR = topDiameter / 2 - 0.01;
      const streamH = (topY - baseH) + 0.04;
      const streamY = baseH + (topY - baseH) / 2;
      const streamD = 0.015; // 水柱粗细

      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8;
        const x = Math.cos(angle) * streamR;
        const z = Math.sin(angle) * streamR;

        cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
          diameterTop: streamD,
          diameterBottom: streamD,
          height: streamH,
          tessellation: 6
        }, {
          position: { x: x, y: streamY, z: z }
        }, { parent: node });
      }
    }
  }
};

export const birdbathFurniture = {
  type: 'birdbath',
  waterControllable: true,
  name: '鸟浴台',
  unit: 'm',
  defaultSize: { width: 0.45, depth: 0.45, height: 0.85 },
  components: [
    { id: 'base', label: '台柱', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'basin', label: '浴盆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'water', label: '水体', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water }
  ],
  build(registry, item, node, size) {
    // 1. 底座台柱
    cylinderComponent(registry, item, birdbathFurniture, 'base', {
      diameterTop: size.width * 0.18,
      diameterBottom: size.width * 0.26,
      height: size.height * 0.72,
      tessellation: 8
    }, { position: { x: 0, y: size.height * 0.36, z: 0 } }, { parent: node });

    // 2. 中空圆形平底锅状浴盆车削结构
    const basinBottomH = 0.03;
    const basinH = size.height * 0.16;
    const basinY = size.height * 0.72;
    const wallThickness = 0.04;
    const rBottom = size.width * 0.18; // 台柱顶部对接盆底的半径
    const rInnerBottom = size.width * 0.22; // 内部平底锅凹槽内底的半径 (不再收缩为尖角)

    latheComponent(registry, item, birdbathFurniture, 'basin', {
      shape: [
        { x: 0, y: 0 },
        { x: rBottom, y: 0 },
        { x: size.width / 2, y: basinH },
        { x: size.width / 2 - wallThickness, y: basinH },
        { x: rInnerBottom, y: basinBottomH },
        { x: 0, y: basinBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: basinY, z: 0 } }, { parent: node });

    // 3. 鸟浴台蓄水面 (精确计算水面在斜面上的半径，确保完美贴合平底锅斜内壁)
    if (item.waterEnabled !== false) {
      const waterLocalY = basinH - 0.03;
      const slopeRatio = (waterLocalY - basinBottomH) / (basinH - basinBottomH);
      const waterR = rInnerBottom + slopeRatio * (size.width / 2 - wallThickness - rInnerBottom);

      cylinderComponent(registry, item, birdbathFurniture, 'water', {
        diameterTop: waterR * 2,
        diameterBottom: waterR * 2,
        height: 0.005,
        tessellation: 10
      }, { position: { x: 0, y: basinY + waterLocalY, z: 0 } }, { parent: node });
    }
  }
};

export const planterBoxFurniture = {
  type: 'planter_box',
  name: '花箱',
  unit: 'm',
  defaultSize: { width: 0.75, depth: 0.35, height: 0.4 },
  components: [
    { id: 'box', label: '花槽', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta },
    { id: 'legs', label: '支腿', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'soil', label: '泥土', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.soil }
  ],
  build(registry, item, node, size) {
    const boxW = size.width;
    const boxH = size.height * 0.68;
    const boxD = size.depth;
    const boxY = size.height * 0.56;
    const t = 0.03; // 围板厚度

    // 1. 前围板
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: boxW, height: boxH, depth: t
    }, { position: { x: 0, y: boxY, z: -boxD / 2 + t / 2 } }, { parent: node });

    // 2. 后围板
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: boxW, height: boxH, depth: t
    }, { position: { x: 0, y: boxY, z: boxD / 2 - t / 2 } }, { parent: node });

    // 3. 左围板
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: t, height: boxH, depth: boxD - t * 2
    }, { position: { x: -boxW / 2 + t / 2, y: boxY, z: 0 } }, { parent: node });

    // 4. 右围板
    boxComponent(registry, item, planterBoxFurniture, 'box', {
      width: t, height: boxH, depth: boxD - t * 2
    }, { position: { x: boxW / 2 - t / 2, y: boxY, z: 0 } }, { parent: node });

    // 5. 泥土
    const soilH = 0.04;
    boxComponent(registry, item, planterBoxFurniture, 'soil', {
      width: boxW - t * 2, height: soilH, depth: boxD - t * 2
    }, { position: { x: 0, y: boxY + boxH / 2 - 0.02 - soilH / 2, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, planterBoxFurniture, 'legs', {
          width: 0.03,
          height: size.height * 0.34,
          depth: 0.03
        }, { position: { x: xSide * size.width * 0.42, y: size.height * 0.17, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });
  }
};

export const raisedGardenBedFurniture = {
  type: 'raised_garden_bed',
  name: '种植箱',
  unit: 'm',
  defaultSize: { width: 1.35, depth: 0.65, height: 0.55 },
  components: [
    { id: 'box', label: '种植槽', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'legs', label: '站腿', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'rail', label: '加固条', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, raisedGardenBedFurniture, 'box', {
      width: size.width,
      height: size.height * 0.52,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.62, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, raisedGardenBedFurniture, 'legs', {
          width: 0.04,
          height: size.height * 0.48,
          depth: 0.04
        }, { position: { x: xSide * size.width * 0.43, y: size.height * 0.24, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });

    boxComponent(registry, item, raisedGardenBedFurniture, 'rail', {
      width: size.width * 0.84,
      height: 0.03,
      depth: 0.03
    }, { position: { x: 0, y: size.height * 0.24, z: 0 } }, { parent: node });
  }
};

export const trellisScreenFurniture = {
  type: 'trellis_screen',
  name: '花架',
  unit: 'm',
  defaultSize: { width: 1, depth: 0.15, height: 2 },
  components: [
    { id: 'frame', label: '外框', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'slats', label: '格栅', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    const fWidth = 0.04; // 框架木条的宽度
    const fDepth = size.depth; // 框架木条的深度

    // 1. 左立柱
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: fWidth,
      height: size.height,
      depth: fDepth
    }, { position: { x: -size.width / 2 + fWidth / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 2. 右立柱
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: fWidth,
      height: size.height,
      depth: fDepth
    }, { position: { x: size.width / 2 - fWidth / 2, y: size.height / 2, z: 0 } }, { parent: node });

    // 3. 顶横梁
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: size.width - fWidth * 2,
      height: fWidth,
      depth: fDepth
    }, { position: { x: 0, y: size.height - fWidth / 2, z: 0 } }, { parent: node });

    // 4. 底横梁
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: size.width - fWidth * 2,
      height: fWidth,
      depth: fDepth
    }, { position: { x: 0, y: fWidth / 2, z: 0 } }, { parent: node });

    const innerWidth = size.width - fWidth * 2;
    const innerHeight = size.height - fWidth * 2;

    // 竖向格栅
    for (let index = -3; index <= 3; index += 1) {
      boxComponent(registry, item, trellisScreenFurniture, 'slats', {
        width: 0.03,
        height: innerHeight,
        depth: size.depth * 0.7
      }, { position: { x: index * innerWidth * 0.12, y: size.height * 0.5, z: 0 } }, { parent: node });
    }

    // 横向格栅
    for (let index = -2; index <= 2; index += 1) {
      boxComponent(registry, item, trellisScreenFurniture, 'slats', {
        width: innerWidth,
        height: 0.03,
        depth: size.depth * 0.7
      }, { position: { x: 0, y: fWidth + innerHeight * (0.15 + (index + 2) * 0.175), z: 0 } }, { parent: node });
    }
  }
};

export const outdoorStorageBoxFurniture = {
  type: 'outdoor_storage_box',
  name: '收纳箱',
  unit: 'm',
  defaultSize: { width: 1.05, depth: 0.55, height: 0.6 },
  components: [
    { id: 'box', label: '箱体', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'lid', label: '箱盖', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, outdoorStorageBoxFurniture, 'box', {
      width: size.width,
      height: size.height * 0.78,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.39, z: 0 } }, { parent: node });

    boxComponent(registry, item, outdoorStorageBoxFurniture, 'lid', {
      width: size.width * 1.02,
      height: size.height * 0.14,
      depth: size.depth * 1.02
    }, { position: { x: 0, y: size.height * 0.85, z: 0 } }, { parent: node });
  }
};

export const gardenBridgeFurniture = {
  type: 'garden_bridge',
  name: '小园桥',
  unit: 'm',
  defaultSize: { width: 1.7, depth: 0.5, height: 0.5 },
  components: [
    { id: 'deck', label: '桥面', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'rails', label: '扣手', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'supports', label: '支撑', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood }
  ],
  build(registry, item, node, size) {
    const w_mid = size.width * 0.4;
    const w_slope = size.width * 0.3;
    const y_low = size.height * 0.15;
    const y_high = size.height * 0.55;
    const h_diff = y_high - y_low;
    const L_slope = Math.sqrt(w_slope * w_slope + h_diff * h_diff);
    const theta = Math.atan2(h_diff, w_slope);

    const deckHeight = size.height * 0.12;
    const deckDepth = size.depth * 0.8;
    const railH = size.height * 0.35;

    // 1. 生成三段式桥面
    // 中段水平桥面
    boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: w_mid,
      height: deckHeight,
      depth: deckDepth
    }, { position: { x: 0, y: y_high, z: 0 } }, { parent: node });

    // 左段倾斜桥面
    const deckLeft = boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: L_slope,
      height: deckHeight,
      depth: deckDepth
    }, { position: { x: -size.width * 0.35, y: (y_low + y_high) / 2, z: 0 } }, { parent: node });
    deckLeft.rotation.z = theta;

    // 右段倾斜桥面
    const deckRight = boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: L_slope,
      height: deckHeight,
      depth: deckDepth
    }, { position: { x: size.width * 0.35, y: (y_low + y_high) / 2, z: 0 } }, { parent: node });
    deckRight.rotation.z = -theta;

    // 辅助函数：根据 X 坐标计算桥面的 y 坐标
    const getDeckY = (x) => {
      const absX = Math.abs(x);
      if (absX <= size.width * 0.2) {
        return y_high;
      } else if (absX <= size.width * 0.5) {
        const ratio = (size.width * 0.5 - absX) / w_slope;
        return y_low + ratio * h_diff;
      }
      return y_low;
    };

    // 2. 生成两侧的栏杆和立柱
    [-1, 1].forEach((side) => {
      const zPos = side * size.depth * 0.36;

      // 中段扶手
      boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: w_mid,
        height: 0.03,
        depth: 0.03
      }, { position: { x: 0, y: y_high + railH, z: zPos } }, { parent: node });

      // 左段扶手
      const railLeft = boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: L_slope,
        height: 0.03,
        depth: 0.03
      }, { position: { x: -size.width * 0.35, y: (y_low + y_high) / 2 + railH, z: zPos } }, { parent: node });
      railLeft.rotation.z = theta;

      // 右段扶手
      const railRight = boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: L_slope,
        height: 0.03,
        depth: 0.03
      }, { position: { x: size.width * 0.35, y: (y_low + y_high) / 2 + railH, z: zPos } }, { parent: node });
      railRight.rotation.z = -theta;

      // 4个垂直立柱
      const supportW = 0.04;
      const supportsX = [-size.width * 0.46, -size.width * 0.2, size.width * 0.2, size.width * 0.46];

      supportsX.forEach((xPos) => {
        const yTop = getDeckY(xPos) + railH;
        boxComponent(registry, item, gardenBridgeFurniture, 'supports', {
          width: supportW,
          height: yTop,
          depth: supportW
        }, { position: { x: xPos, y: yTop / 2, z: zPos } }, { parent: node });
      });
    });
  }
};

export const canopyTentFurniture = {
  type: 'canopy_tent',
  name: '天幕',
  unit: 'm',
  defaultSize: { width: 2.45, depth: 2.45, height: 2.45 },
  components: [
    { id: 'canopy', label: '天幕', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'posts', label: '立杆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.lightMetal },
    { id: 'frame', label: '连接架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.metal }
  ],
  build(registry, item, node, size) {
    const postW = Math.max(0.04, size.width * 0.02);
    const xOffset = size.width / 2 - postW / 2;
    const zOffset = size.depth / 2 - postW / 2;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, canopyTentFurniture, 'posts', {
          width: postW,
          height: size.height * 0.9,
          depth: postW
        }, { position: { x: xSide * xOffset, y: size.height * 0.45, z: zSide * zOffset } }, { parent: node });
      });
    });

    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: size.width,
      height: 0.04,
      depth: postW
    }, { position: { x: 0, y: size.height * 0.86, z: zOffset } }, { parent: node });
    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: size.width,
      height: 0.04,
      depth: postW
    }, { position: { x: 0, y: size.height * 0.86, z: -zOffset } }, { parent: node });
    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: postW,
      height: 0.04,
      depth: size.depth
    }, { position: { x: xOffset, y: size.height * 0.86, z: 0 } }, { parent: node });
    boxComponent(registry, item, canopyTentFurniture, 'frame', {
      width: postW,
      height: 0.04,
      depth: size.depth
    }, { position: { x: -xOffset, y: size.height * 0.86, z: 0 } }, { parent: node });

    boxComponent(registry, item, canopyTentFurniture, 'canopy', {
      width: size.width * 1.02,
      height: size.height * 0.1,
      depth: size.depth * 1.02
    }, { position: { x: 0, y: size.height * 0.94, z: 0 } }, { parent: node });
  }
};

export const poolsideDaybedFurniture = {
  type: 'poolside_daybed',
  name: '躺床',
  unit: 'm',
  defaultSize: { width: 2, depth: 0.85, height: 0.85 },
  components: [
    { id: 'bed', label: '躺面', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.fabric },
    { id: 'frame', label: '底架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'canopy', label: '遮阳帘', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: lieInteraction(0.48),
  build(registry, item, node, size) {
    boxComponent(registry, item, poolsideDaybedFurniture, 'bed', {
      width: size.width * 0.92,
      height: size.height * 0.14,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.52, z: 0 } }, { parent: node });

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, poolsideDaybedFurniture, 'frame', {
          width: 0.05,
          height: size.height * 0.46,
          depth: 0.05
        }, { position: { x: xSide * size.width * 0.38, y: size.height * 0.23, z: zSide * size.depth * 0.42 } }, { parent: node });
      });
    });

    boxComponent(registry, item, poolsideDaybedFurniture, 'frame', {
      width: size.width * 0.9,
      height: 0.04,
      depth: 0.04
    }, { position: { x: 0, y: size.height * 0.88, z: -size.depth * 0.42 } }, { parent: node });

    boxComponent(registry, item, poolsideDaybedFurniture, 'canopy', {
      width: size.width * 0.9,
      height: 0.04,
      depth: size.depth * 0.22
    }, { position: { x: 0, y: size.height * 0.88, z: -size.depth * 0.34 } }, { parent: node });
  }
};



export const pottingBenchFurniture = {
  type: 'potting_bench',
  name: '操作台',
  unit: 'm',
  defaultSize: { width: 1.2, depth: 0.5, height: 1.5 },
  components: [
    { id: 'counter', label: '操作台', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'shelf', label: '层板', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta },
    { id: 'frame', label: '支架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood }
  ],
  build(registry, item, node, size) {
    const legH = size.height * 0.72;
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, pottingBenchFurniture, 'frame', {
          width: 0.04,
          height: legH,
          depth: 0.04
        }, { position: { x: xSide * size.width * 0.42, y: legH / 2, z: zSide * size.depth * 0.38 } }, { parent: node });
      });
    });

    boxComponent(registry, item, pottingBenchFurniture, 'counter', {
      width: size.width,
      height: 0.04,
      depth: size.depth
    }, { position: { x: 0, y: legH, z: 0 } }, { parent: node });

    boxComponent(registry, item, pottingBenchFurniture, 'shelf', {
      width: size.width * 0.82,
      height: 0.03,
      depth: size.depth * 0.72
    }, { position: { x: 0, y: legH * 0.46, z: 0 } }, { parent: node });

    boxComponent(registry, item, pottingBenchFurniture, 'frame', {
      width: size.width * 0.86,
      height: 0.04,
      depth: 0.04
    }, { position: { x: 0, y: size.height * 0.92, z: -size.depth * 0.42 } }, { parent: node });
  }
};

export const sharedBicycleFurniture = {
  type: 'shared_bicycle',
  name: '共享单车',
  unit: 'm',
  defaultSize: { width: 1.75, depth: 0.45, height: 1.1 },
  components: [
    { id: 'frame', label: '车架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.sage },
    { id: 'tires', label: '轮胎', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'metal', label: '金属件', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.lightMetal }
  ],
  build(registry, item, node, size) {
    // === 1. 自行车基础几何尺寸与关键控制点计算 ===
    const wheelRadius = Math.min(size.height * 0.34, size.width * 0.19); // 车轮半径
    const wheelThickness = Math.max(0.015, size.depth * 0.08); // 轮胎厚度 (经优化后纤细美观)
    const rearWheelCenter = { x: -size.width * 0.32, y: wheelRadius, z: 0 }; // 后轮轮轴中心坐标
    const frontWheelCenter = { x: size.width * 0.32, y: wheelRadius, z: 0 }; // 前轮轮轴中心坐标
    const bottomBracket = { x: -size.width * 0.04, y: wheelRadius * 0.74, z: 0 }; // 中轴 (底托五通管) 坐标
    const seatCluster = { x: -size.width * 0.17, y: size.height * 0.58, z: 0 }; // 座椅立管与后斜梁交汇点
    const headBottom = { x: size.width * 0.21, y: size.height * 0.46, z: 0 }; // 车头管底部坐标
    const headTop = { x: size.width * 0.25, y: size.height * 0.73, z: 0 }; // 车头管顶部坐标
    const seatTop = { x: -size.width * 0.16, y: size.height * 0.72, z: 0 }; // 座椅支架顶端坐标
    const tubeThickness = Math.max(0.04, size.width * 0.026); // 车架主管管径
    const metalThickness = Math.max(0.018, size.width * 0.012); // 金属辅件管径

    // === 2. 绘制前轮和后轮 ===
    // 绘制后轮 (包含中空外胎、中空轮圈、轮辐、金属轴承轴)
    addBikeWheel(registry, item, sharedBicycleFurniture, rearWheelCenter, wheelRadius, wheelThickness, node);
    // 绘制前轮 (包含中空外胎、中空轮圈、轮辐、金属轴承轴)
    addBikeWheel(registry, item, sharedBicycleFurniture, frontWheelCenter, wheelRadius, wheelThickness, node);

    // === 3. 绘制车架主要钢管连杆 (均使用 'frame' 材质) ===
    // 后上叉斜梁 (后轮轴 -> 座椅交汇点)
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', rearWheelCenter, seatCluster, tubeThickness * 0.72, node);
    // 后下叉斜梁 (后轮轴 -> 中轴)
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', rearWheelCenter, bottomBracket, tubeThickness * 0.68, node);
    // 立管 (中轴 -> 座椅顶端)
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', bottomBracket, seatTop, tubeThickness * 0.72, node);
    // 主梁/斜撑梁 (座椅交汇点 -> 车头管底部)
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', seatCluster, headBottom, tubeThickness * 0.92, node, tubeThickness * 1.24);
    // 车头前管 (车头管底部 -> 车头管顶部)
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', headBottom, headTop, tubeThickness * 0.78, node);
    // 前叉上部主杆 (前轮轴 -> 车头管底部)
    addBikeTube(registry, item, sharedBicycleFurniture, 'frame', frontWheelCenter, headBottom, tubeThickness * 0.62, node);

    // === 4. 绘制座椅及其金属座杆 ===
    // 座椅升降管 (金属件材质 'metal')
    cylinderComponent(registry, item, sharedBicycleFurniture, 'metal', {
      diameterTop: metalThickness,
      diameterBottom: metalThickness,
      height: size.height * 0.16,
      tessellation: 8
    }, {
      position: { x: seatTop.x, y: seatTop.y - size.height * 0.03, z: 0 }
    }, { parent: node });

    // 座鞍/座包 (防雨皮质共享单车座，合并入轮胎材质 'tires')
    boxComponent(registry, item, sharedBicycleFurniture, 'tires', {
      width: size.width * 0.18,
      height: size.height * 0.045,
      depth: size.depth * 0.42
    }, {
      position: { x: seatTop.x - size.width * 0.015, y: seatTop.y + size.height * 0.05, z: 0 }
    }, { parent: node });

    // === 5. 绘制把手及其金属立管 ===
    // 车把连接立柱管 (金属件材质 'metal')
    cylinderComponent(registry, item, sharedBicycleFurniture, 'metal', {
      diameterTop: metalThickness,
      diameterBottom: metalThickness,
      height: size.height * 0.16,
      tessellation: 8
    }, {
      position: { x: headTop.x, y: headTop.y + size.height * 0.02, z: 0 },
      rotation: { z: Math.PI * 0.08 }
    }, { parent: node });

    // 左右横向车把手 (横杆及抓握手柄套，合并入轮胎材质 'tires')
    boxComponent(registry, item, sharedBicycleFurniture, 'tires', {
      width: metalThickness * 1.5,
      height: metalThickness * 0.95,
      depth: size.depth * 0.85
    }, {
      position: { x: headTop.x - size.width * 0.015, y: headTop.y + size.height * 0.11, z: 0 },
      rotation: { z: Math.PI * 0.06 }
    }, { parent: node });

    // === 6. 绘制链条罩与中轴脚踏传动系统 ===
    // 传动链条防尘罩 (车身中下部蓝色饰件，合并入车架材质 'frame')
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: size.width * 0.30,
      height: size.height * 0.11,
      depth: size.depth * 0.26
    }, {
      position: { x: -size.width * 0.2, y: wheelRadius * 0.85, z: 0 }
    }, { parent: node });

    // 五通中轴管承 (金属件材质 'metal')
    cylinderComponent(registry, item, sharedBicycleFurniture, 'metal', {
      diameterTop: wheelRadius * 0.13,
      diameterBottom: wheelRadius * 0.13,
      height: size.depth * 0.46,
      tessellation: 8
    }, {
      position: bottomBracket,
      rotation: { x: Math.PI / 2 }
    }, { parent: node });

    // 踏板金属曲柄连接块 (金属件材质 'metal')
    boxComponent(registry, item, sharedBicycleFurniture, 'metal', {
      width: size.width * 0.1,
      height: metalThickness * 0.65,
      depth: metalThickness * 0.65
    }, {
      position: { x: bottomBracket.x, y: bottomBracket.y, z: 0 },
      rotation: { z: Math.PI * 0.2 }
    }, { parent: node });

    // 左右脚踏板 (合并入轮胎材质 'tires')
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, sharedBicycleFurniture, 'tires', {
        width: size.width * 0.04,
        height: metalThickness * 0.72,
        depth: size.depth * 0.2
      }, {
        position: {
          x: bottomBracket.x + side * size.width * 0.052,
          y: bottomBracket.y - wheelRadius * 0.03,
          z: side * size.depth * 0.28
        }
      }, { parent: node });
    });

    // === 7. 绘制前车篮 (合并入车架材质 'frame') ===
    const basketBaseY = headBottom.y + size.height * 0.12; // 车篮底部起点 Y (已上移避免与前叉穿模)
    const basketWidth = size.width * 0.2; // 车篮前后方向宽度
    const basketDepth = size.depth * 0.8; // 车篮左右方向深度
    const basketHeight = size.height * 0.16; // 车篮高度
    const basketCenterX = frontWheelCenter.x + size.width * 0.05; // 车篮中心 X (已前移避免与把手立柱穿模)
    const basketCenterY = basketBaseY + basketHeight * 0.5; // 车篮高度中心坐标
    const basketWall = Math.max(0.016, size.width * 0.012); // 车篮壁板厚度

    // 车篮底板
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWidth,
      height: basketWall,
      depth: basketDepth
    }, {
      position: { x: basketCenterX, y: basketBaseY, z: 0 }
    }, { parent: node });

    // 车篮前壁板
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWidth,
      height: basketHeight,
      depth: basketWall
    }, {
      position: { x: basketCenterX, y: basketCenterY, z: basketDepth / 2 - basketWall / 2 }
    }, { parent: node });

    // 车篮后壁板
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWidth * 0.92,
      height: basketHeight,
      depth: basketWall
    }, {
      position: { x: basketCenterX, y: basketCenterY, z: -basketDepth / 2 + basketWall / 2 }
    }, { parent: node });

    // 车篮左侧壁板
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWall,
      height: basketHeight,
      depth: basketDepth
    }, {
      position: { x: basketCenterX - basketWidth / 2 + basketWall / 2, y: basketCenterY, z: 0 }
    }, { parent: node });

    // 车篮右侧壁板
    boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
      width: basketWall,
      height: basketHeight * 0.92,
      depth: basketDepth * 0.92
    }, {
      position: { x: basketCenterX + basketWidth / 2 - basketWall / 2, y: basketCenterY, z: 0 }
    }, { parent: node });

    // 车篮底部金属斜支撑架 (车身前管 -> 车篮底部，金属材质 'metal')
    addBikeTube(
      registry,
      item,
      sharedBicycleFurniture,
      'metal',
      { x: headBottom.x - size.width * 0.03, y: headBottom.y + size.height * 0.03, z: 0 },
      { x: basketCenterX - basketWidth * 0.18, y: basketBaseY + basketWall * 0.5, z: 0 },
      metalThickness * 0.7,
      node,
      metalThickness * 0.7
    );

    // === 8. 绘制双侧前叉与后叉叉杆 (合并入车架材质 'frame') ===
    [-1, 1].forEach((side) => {
      // 后叉叉管 (后轮轴 -> 座椅立管顶部，左右分布，形成稳固三角形，能刚好夹住后轮胎)
      boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
        width: wheelRadius * 0.88,
        height: metalThickness * 0.8,
        depth: metalThickness * 1.2
      }, {
        position: {
          x: rearWheelCenter.x,
          y: rearWheelCenter.y + wheelRadius * 0.88,
          z: side * size.depth * 0.06
        },
        rotation: { z: Math.PI * 0.07 }
      }, { parent: node });

      // 前叉叉管 (前轮轴 -> 车头管底部，左右分布，能刚好夹住前轮胎)
      boxComponent(registry, item, sharedBicycleFurniture, 'frame', {
        width: wheelRadius * 0.78,
        height: metalThickness * 0.76,
        depth: metalThickness
      }, {
        position: {
          x: frontWheelCenter.x,
          y: frontWheelCenter.y + wheelRadius * 0.86,
          z: side * size.depth * 0.04
        },
        rotation: { z: Math.PI * 0.11 }
      }, { parent: node });
    });
  }
};

export const landscapeMarbleFountain = {
  type: 'landscape_marble_fountain',
  waterControllable: true,
  name: '跌水喷泉',
  unit: 'm',
  defaultSize: { width: 1.4, depth: 1.4, height: 1.5 },
  components: [
    { id: 'fountain-marble', label: '汉白玉雕座', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'fountain-water', label: '涌动喷泉', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.18;
    const baseBottomH = 0.02;
    const wallT = 0.04;

    // 1. 底盆车削结构 (优化替代底板和拼接围板)
    latheComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      shape: [
        { x: 0, y: 0 },
        { x: size.width / 2, y: 0 },
        { x: size.width / 2, y: baseH },
        { x: size.width / 2 - wallT, y: baseH },
        { x: size.width / 2 - wallT, baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2. 底盆水面
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: baseH - 0.02, z: 0 } }, { parent: node });
    }

    // 3. 中央立柱
    const pillarH = size.height * 0.55;
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      diameterTop: size.width * 0.18, diameterBottom: size.width * 0.28, height: pillarH, tessellation: 12
    }, { position: { x: 0, y: baseH + pillarH / 2, z: 0 } }, { parent: node });

    // 4. 顶盆车削结构 (优化替代底板和拼接围板)
    const bowlH = size.height * 0.08;
    const bowlY = baseH + pillarH * 0.75;
    const bowlD = size.width * 0.65;
    const bowlWallT = 0.03;
    latheComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      shape: [
        { x: 0, y: 0 },
        { x: bowlD / 2, y: 0 },
        { x: bowlD / 2, y: bowlH },
        { x: bowlD / 2 - bowlWallT, y: bowlH },
        { x: bowlD / 2 - bowlWallT, baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: bowlY, z: 0 } }, { parent: node });

    // 5. 顶盆水面与涌出水球
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
        diameterTop: bowlD - bowlWallT * 2, diameterBottom: bowlD - bowlWallT * 2, height: 0.02, tessellation: 12
      }, { position: { x: 0, y: bowlY + bowlH - 0.015, z: 0 } }, { parent: node });

      sphereComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
        diameter: size.width * 0.32, segments: 10
      }, { position: { x: 0, y: size.height - size.height * 0.12, z: 0 } }, { parent: node });
    }
  }
};

export const landscapeEuroPondSculpture = {
  type: 'landscape_euro_pond_sculpture',
  waterControllable: true,
  name: '水池雕塑',
  unit: 'm',
  defaultSize: { width: 1.65, depth: 1.65, height: 1.85 },
  components: [
    { id: 'pond-basin', label: '雕花大石盆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'pond-water', label: '池中涟漪', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water },
    { id: 'pond-sculpture', label: '古典石雕像', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.2;
    const baseBottomH = 0.02;
    const wallT = 0.04;

    // 1. 大石盆车削结构 (优化替代底板和拼接围板)
    latheComponent(registry, item, landscapeEuroPondSculpture, 'pond-basin', {
      shape: [
        { x: 0, y: 0 },
        { x: size.width / 2, y: 0 },
        { x: size.width / 2, y: basinH },
        { x: size.width / 2 - wallT, y: basinH },
        { x: size.width / 2 - wallT, baseBottomH },
        { x: 0, y: baseBottomH }
      ],
      tessellation: 10
    }, { position: { x: 0, y: 0, z: 0 } }, { parent: node });

    // 2. 内嵌水面
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, landscapeEuroPondSculpture, 'pond-water', {
        diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 10
      }, { position: { x: 0, y: basinH - 0.02, z: 0 } }, { parent: node });
    }

    const pedH = size.height * 0.22;
    boxComponent(registry, item, landscapeEuroPondSculpture, 'pond-sculpture', {
      width: size.width * 0.25, height: pedH, depth: size.width * 0.25
    }, { position: { x: 0, y: basinH + pedH / 2, z: 0 } }, { parent: node });

    const headD = size.width * 0.22;
    sphereComponent(registry, item, landscapeEuroPondSculpture, 'pond-sculpture', {
      diameter: headD, segments: 10
    }, { position: { x: 0, y: basinH + pedH + size.height * 0.22, z: 0 } }, { parent: node });

    const torsoH = size.height * 0.32;
    cylinderComponent(registry, item, landscapeEuroPondSculpture, 'pond-sculpture', {
      diameterTop: size.width * 0.16, diameterBottom: size.width * 0.2, height: torsoH, tessellation: 12
    }, { position: { x: 0, y: basinH + pedH + torsoH / 2, z: 0 } }, { parent: node });
  }
};

export const landscapeMarbleBridge = {
  type: 'landscape_marble_bridge',
  name: '石拱桥',
  unit: 'm',
  defaultSize: { width: 1.85, depth: 0.75, height: 0.7 },
  components: [
    { id: 'bridge-marble', label: '汉白玉石桥', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'bridge-railing', label: '石桥栏杆', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone }
  ],
  build(registry, item, node, size) {
    const deckH = size.height * 0.15;
    const baseArch = boxComponent(registry, item, landscapeMarbleBridge, 'bridge-marble', {
      width: size.width, height: deckH, depth: size.depth
    }, { position: { x: 0, y: size.height * 0.4, z: 0 } }, { parent: node });
    baseArch.rotation.z = 0;

    [-1, 1].forEach((side) => {
      const ramp = boxComponent(registry, item, landscapeMarbleBridge, 'bridge-marble', {
        width: size.width * 0.45, height: deckH * 0.9, depth: size.depth
      }, { position: { x: side * size.width * 0.28, y: size.height * 0.22, z: 0 } }, { parent: node });
      ramp.rotation.z = -side * 0.3;
    });

    [-1, 1].forEach((zSide) => {
      const zPos = zSide * (size.depth / 2 - 0.02);
      [-0.4, -0.2, 0, 0.2, 0.4].forEach((xRatio) => {
        const xPos = xRatio * size.width;
        const yPos = xRatio === 0 ? size.height * 0.48 : (Math.abs(xRatio) === 0.2 ? size.height * 0.42 : size.height * 0.28);
        boxComponent(registry, item, landscapeMarbleBridge, 'bridge-railing', {
          width: size.width * 0.04, height: size.height * 0.4, depth: size.width * 0.04
        }, { position: { x: xPos, y: yPos + size.height * 0.2, z: zPos } }, { parent: node });
      });

      const handrail = boxComponent(registry, item, landscapeMarbleBridge, 'bridge-railing', {
        width: size.width, height: size.height * 0.05, depth: size.width * 0.04
      }, { position: { x: 0, y: size.height * 0.72, z: zPos } }, { parent: node });
    });
  }
};

export const outdoorStoneChessTable = {
  type: 'outdoor_stone_chess_table',
  name: '石头象棋桌',
  unit: 'm',
  defaultSize: { width: 0.8, depth: 0.8, height: 0.7 },
  components: [
    { id: 'table-base', label: '雕花石底座', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'table-top', label: '石质台面', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'chess-board', label: '楚河汉界棋盘', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.08;
    const pillarH = size.height * 0.78;
    const topH = size.height * 0.14;

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-base', {
      diameterTop: size.width * 0.55,
      diameterBottom: size.width * 0.65,
      height: baseH,
      tessellation: 8
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-base', {
      diameterTop: size.width * 0.35,
      diameterBottom: size.width * 0.45,
      height: pillarH * 0.5,
      tessellation: 8
    }, { position: { x: 0, y: baseH + pillarH * 0.25, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-base', {
      diameterTop: size.width * 0.42,
      diameterBottom: size.width * 0.35,
      height: pillarH * 0.5,
      tessellation: 8
    }, { position: { x: 0, y: baseH + pillarH * 0.75, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneChessTable, 'table-top', {
      diameterTop: size.width,
      diameterBottom: size.width * 0.95,
      height: topH,
      tessellation: 12
    }, { position: { x: 0, y: size.height - topH / 2, z: 0 } }, { parent: node });

    const boardSize = size.width * 0.58;
    boxComponent(registry, item, outdoorStoneChessTable, 'chess-board', {
      width: boardSize,
      height: 0.006,
      depth: boardSize
    }, { position: { x: 0, y: size.height + 0.003, z: 0 } }, { parent: node });
  }
};

export const outdoorStoneStool = {
  type: 'outdoor_stone_stool',
  name: '石墩子',
  unit: 'm',
  defaultSize: { width: 0.35, depth: 0.35, height: 0.4 },
  components: [
    { id: 'stone-body', label: '石墩鼓身', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'stone-seat', label: '光滑坐面', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'stone-ornament', label: '鼓钉饰纹', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.9, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const d = Math.min(size.width, size.depth);
    const h = size.height;

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-body', {
      diameterTop: d * 0.8,
      diameterBottom: d * 0.85,
      height: h * 0.12,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.06, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-body', {
      diameterTop: d * 0.98,
      diameterBottom: d * 0.8,
      height: h * 0.38,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.31, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-body', {
      diameterTop: d * 0.82,
      diameterBottom: d * 0.98,
      height: h * 0.38,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.69, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-ornament', {
      diameterTop: d * 0.9,
      diameterBottom: d * 0.9,
      height: h * 0.06,
      tessellation: 10
    }, { position: { x: 0, y: h * 0.85, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorStoneStool, 'stone-seat', {
      diameterTop: d * 0.85,
      diameterBottom: d * 0.85,
      height: h * 0.08,
      tessellation: 12
    }, { position: { x: 0, y: h * 0.92, z: 0 } }, { parent: node });
  }
};

export const outdoorDragonBubbleStoneStool = {
  type: 'outdoor_dragon_bubble_stone_stool',
  name: '龙泡泡石墩子',
  unit: 'm',
  defaultSize: { width: 0.56, depth: 0.52, height: 0.58 },
  components: [
    { id: 'dragon-body', label: '龙泡泡墩身', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'dragon-features', label: '龙角耳朵和表情', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.stone },
    { id: 'dragon-base', label: '圆形石座', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [{ x: 0, y: size.height * 0.94, z: 0, rot: 0 }];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const baseH = h * 0.16;
    const bodyH = h * 0.72;
    const bodyCenterY = baseH + bodyH * 0.48;
    const frontZ = d * 0.39;

    // 1. 石座底盘 (dragon-base)
    cylinderComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-base', {
      diameterTop: w * 0.94,
      diameterBottom: w * 0.98,
      height: baseH * 0.6,
      tessellation: 12
    }, { position: { x: 0, y: baseH * 0.3, z: 0 } }, { parent: node });

    // cylinderComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-base', {
    //   diameterTop: w * 0.86,
    //   diameterBottom: w * 0.92,
    //   height: baseH * 0.1,
    //   tessellation: 12
    // }, { position: { x: 0, y: baseH * 0.6, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-base', {
      diameterTop: w * 0.76,
      diameterBottom: w * 0.84,
      height: baseH * 0.1,
      tessellation: 12
    }, { position: { x: 0, y: baseH * 0.7, z: 0 } }, { parent: node });

    // 2. 支撑身体的 4 个胖胖小短脚 (dragon-body)
    [-1, 1].forEach((sideX) => {
      [-1, 1].forEach((sideZ) => {
        sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-body', {
          diameterX: w * 0.22,
          diameterY: h * 0.22,
          diameterZ: d * 0.22,
          segments: 10
        }, { position: { x: sideX * w * 0.1, y: baseH + h * 0.045, z: sideZ * d * 0.1 } }, { parent: node });
      });
    });

    // 3. 饱满球形主体/头部 (dragon-body)
    sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-body', {
      diameterX: w * 0.86,
      diameterY: bodyH,
      diameterZ: d * 0.84,
      segments: 20
    }, { position: { x: 0, y: bodyCenterY, z: 0 } }, { parent: node });

    // 4. 头顶两侧萌系弯曲龙角与内凹耳朵 (dragon-features)
    [-1, 1].forEach((side) => {
      // 龙角主角体 (向上、向前倾斜，且向内微弯包拢)
      coneComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.2,
        height: h * 0.2
      }, {
        position: { x: side * w * 0.3, y: baseH + bodyH * 0.92, z: frontZ * 0.3 },
        rotation: {
          x: Math.PI * 0.05,
          z: -side * Math.PI * 0.1
        }
      }, { parent: node, tessellation: 12 });

      // 龙角内侧耳窝内凹层 (使角正面呈现杯状/内凹层次)
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.2,
        diameterY: h * 0.2,
        diameterZ: d * 0.2,
        segments: 8
      }, {
        position: { x: side * w * 0.3, y: baseH + bodyH * 0.80, z: frontZ *  0.3 },
        rotation: {
          x: -Math.PI * 0.1,
          y: side * Math.PI * 0.12,
          z: -side * Math.PI * 0.2
        }
      }, { parent: node });

      // 5. 眉毛
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.065,
        diameterY: w * 0.065,
        diameterZ: d * 0.03,
        segments: 8
      }, { position: { x: side * w * 0.13, y: baseH + bodyH * 0.65, z: frontZ * 0.98 } }, { parent: node });

      // 6. 眼睫毛
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.17,
        height: h * 0.038,
        depth: d * 0.035
      }, {
        position: { x: side * w * 0.18, y: baseH + bodyH * 0.52, z: frontZ * 0.97 },
        rotation: {
          x: Math.PI * 0.06,
          y: side * Math.PI * 0.16,
          z: side * Math.PI * 0.04
        }
      }, { parent: node });

      // 7. 眼睛
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.13,
        diameterY: h * 0.12,
        diameterZ: d * 0.025,
        segments: 8
      }, { position: { x: side * w * 0.18, y: baseH + bodyH * 0.44, z: frontZ * 0.96 }, rotation: {
          x: 0,
          y: side * Math.PI * 0.16,
          z: 0
        } }, { parent: node });
    });

    // 8. 龙脊鳍
    [0.08, -0.04, -0.16].forEach((zPos, idx) => {
      const finHeight = h * (idx === 0 ? 0.13 : idx === 1 ? 0.11 : 0.08);
      const finWidth = w * (idx === 0 ? 0.05 : idx === 1 ? 0.045 : 0.04);
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
            width: finWidth, height: finHeight, depth: finHeight
          }, { position: { x: 0, y: baseH + bodyH * 0.95 , z: d * zPos },rotation: { x: Math.PI * 0.2 } }, { parent: node });
    });

    // 9. 萌系猫咪/龙 `ω` 笑嘴 
    [-1, 1].forEach((side) => {
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.065,
        height: h * 0.016,
        depth: d * 0.025
      }, {
        position: { x: side * w * 0.028, y: baseH + bodyH * 0.33, z: frontZ },
        rotation: {
          x: Math.PI * 0.05,
          y: side * Math.PI * 0.1,
          z: -side * Math.PI * 0.18
        }
      }, { parent: node });
      boxComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.065,
        height: h * 0.016,
        depth: d * 0.025
      }, {
        position: { x: side * w * 0.05, y: baseH + bodyH * 0.35, z: frontZ },
        rotation: {
          x: Math.PI * 0.05,
          y: side * Math.PI * 0.1,
          z: side * Math.PI * 0.4
        }
      }, { parent: node });
    });

      // 10. 尾巴
      // 龙尾巴尖
      coneComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        width: w * 0.2,
        height: h * 0.2
      }, {
        position: { x: 0, y: baseH + bodyH * 0.6, z: -d * 0.5 },
        rotation: { x: -Math.PI * 0.3
        }
      }, { parent: node, tessellation: 12 });

      // 龙尾巴根
      sphereComponent(registry, item, outdoorDragonBubbleStoneStool, 'dragon-features', {
        diameterX: w * 0.3,
        diameterY: h * 0.4,
        diameterZ: d * 0.4,
        segments: 8
      }, {
        position: { x: 0, y: baseH + bodyH * 0.5, z: -d * 0.28 },
      }, { parent: node });

  }
};

export const outdoorPhoneBoothFurniture = {
  type: 'outdoor_phone_booth',
  name: '电话亭',
  unit: 'm',
  defaultSize: { width: 0.9, depth: 0.9, height: 2.35 },
  components: [
    { id: 'booth-body', label: '电话亭主体', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.classicRed },
    { id: 'booth-roof', label: '穹顶顶棚', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.classicRed },
    { id: 'booth-glass', label: '透光玻璃', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.water },
    { id: 'booth-base', label: '防潮台座', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkStone },
    { id: 'booth-interior', label: '内部电话', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'booth-sign', label: '顶部标识', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: {
    type: 'stand',
    getInteractionPoints(size) {
      return [
        { x: 0, y: 0, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const baseH = 0.08;
    const signH = 0.16;
    const roofH = h * 0.15;
    const bodyH = h - baseH - signH - roofH;
    const postW = 0.05;
    const barW = 0.02;

    // 1. 基座 base
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-base', {
      width: w,
      height: baseH,
      depth: d
    }, { position: { x: 0, y: baseH / 2, z: 0 } }, { parent: node });

    const bodyCenterY = baseH + bodyH / 2;

    // 2. 4根角立柱 frame / body
    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: postW,
          height: bodyH,
          depth: postW
        }, {
          position: {
            x: xSide * (w / 2 - postW / 2),
            y: bodyCenterY,
            z: zSide * (d / 2 - postW / 2)
          }
        }, { parent: node });
      });
    });

    // 3. 四周周圈顶梁与底梁 (Perimeter Beams)
    [-1, 1].forEach((xSide) => {
      [baseH + barW / 2, baseH + bodyH - barW / 2].forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW,
          height: barW,
          depth: d - postW * 2
        }, { position: { x: xSide * (w / 2 - postW / 2), y: yPos, z: 0 } }, { parent: node });
      });
    });
    [-1, 1].forEach((zSide) => {
      [baseH + barW / 2, baseH + bodyH - barW / 2].forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: w - postW * 2,
          height: barW,
          depth: barW
        }, { position: { x: 0, y: yPos, z: zSide * (d / 2 - postW / 2) } }, { parent: node });
      });
    });

    // 4. 四面透光玻璃 (前、后、左、右)
    const glassThick = 0.01;
    // 后玻璃
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-glass', {
      width: w - postW * 2,
      height: bodyH - barW * 2,
      depth: glassThick
    }, { position: { x: 0, y: bodyCenterY, z: -(d / 2 - postW / 2) } }, { parent: node });
    // 前门玻璃
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-glass', {
      width: w - postW * 2,
      height: bodyH - barW * 2,
      depth: glassThick
    }, { position: { x: 0, y: bodyCenterY, z: d / 2 - postW / 2 } }, { parent: node });
    // 左右侧玻璃
    [-1, 1].forEach((xSide) => {
      boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-glass', {
        width: glassThick,
        height: bodyH - barW * 2,
        depth: d - postW * 2
      }, { position: { x: xSide * (w / 2 - postW / 2), y: bodyCenterY, z: 0 } }, { parent: node });
    });

    // 5. 经典复古多宫格窗格条 (Multi-pane Grid / Mullions - 4列 x 6行小方格)
    const horizYPositions = [
      baseH + bodyH * 0.20,
      baseH + bodyH * 0.36,
      baseH + bodyH * 0.52,
      baseH + bodyH * 0.68,
      baseH + bodyH * 0.84
    ];
    const vertOffsets = [-(w - postW * 2) / 3.2, 0, (w - postW * 2) / 3.2];

    // 后墙与前墙格栅 (Front & Back Grids)
    [-1, 1].forEach((zSide) => {
      const zPos = zSide * (d / 2 - postW / 2);
      // 3 根纵向竖条
      vertOffsets.forEach((xOff) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW,
          height: bodyH - barW * 2,
          depth: barW * 1.2
        }, { position: { x: xOff, y: bodyCenterY, z: zPos } }, { parent: node });
      });

      // 5 根横向窗条
      horizYPositions.forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: w - postW * 2,
          height: barW,
          depth: barW * 1.2
        }, { position: { x: 0, y: yPos, z: zPos } }, { parent: node });
      });
    });

    // 左右墙格栅 (Left & Right Grids)
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - postW / 2);
      // 2 根纵向竖条
      vertOffsets.forEach((zOff) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW * 1.2,
          height: bodyH - barW * 2,
          depth: barW
        }, { position: { x: xPos, y: bodyCenterY, z: zOff } }, { parent: node });
      });

      // 5 根横向窗条
      horizYPositions.forEach((yPos) => {
        boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
          width: barW * 1.2,
          height: barW,
          depth: d - postW * 2
        }, { position: { x: xPos, y: yPos, z: 0 } }, { parent: node });
      });
    });

    // 6. 内部挂壁电话与精小搁板 (Interior & Shelf)
    const phoneW = w * 0.28;
    const phoneH = bodyH * 0.22;
    const phoneD = d * 0.15;
    const phoneZ = -(d / 2 - postW - phoneD / 2 - 0.02);

    // 挂壁主机
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-interior', {
      width: phoneW,
      height: phoneH,
      depth: phoneD
    }, { position: { x: 0, y: baseH + bodyH * 0.58, z: phoneZ } }, { parent: node });

    // 紧贴后墙的精致小写字/搁置小台面
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-interior', {
      width: w * 0.45,
      height: 0.025,
      depth: d * 0.25
    }, { position: { x: 0, y: baseH + bodyH * 0.4, z: -(d / 2 - postW - d * 0.125) } }, { parent: node });

    // 听筒
    cylinderComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-interior', {
      diameterTop: 0.035,
      diameterBottom: 0.035,
      height: 0.15,
      tessellation: 8
    }, {
      position: { x: -phoneW * 0.55, y: baseH + bodyH * 0.58, z: phoneZ + 0.03 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    // 7. 顶部 "TELEPHONE" 标识灯箱 (Sign)
    const signY = baseH + bodyH + signH / 2;
    // 外框架
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-body', {
      width: w * 0.94,
      height: signH * 0.4,
      depth: d * 0.94
    }, { position: { x: 0, y: signY - 0.1, z: 0 } }, { parent: node });

    // 奶油白内嵌灯箱
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-sign', {
      width: w * 0.88,
      height: signH,
      depth: d * 0.88
    }, { position: { x: 0, y: signY, z: 0 } }, { parent: node });

    // 8. 经典复古阶梯穹顶 Roof
    const roofStartY = baseH + bodyH + signH;
    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-roof', {
      width: w * 0.96,
      height: roofH * 0.35,
      depth: d * 0.96
    }, { position: { x: 0, y: roofStartY + (roofH * 0.35) / 2, z: 0 } }, { parent: node });

    boxComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-roof', {
      width: w * 0.78,
      height: roofH * 0.45,
      depth: d * 0.78
    }, { position: { x: 0, y: roofStartY + roofH * 0.35 + (roofH * 0.45) / 2, z: 0 } }, { parent: node });

    // 顶饰凸帽 dome tip
    cylinderComponent(registry, item, outdoorPhoneBoothFurniture, 'booth-roof', {
      diameterTop: 0.05,
      diameterBottom: 0.12,
      height: roofH * 0.2,
      tessellation: 10
    }, { position: { x: 0, y: roofStartY + roofH * 0.8 + (roofH * 0.2) / 2, z: 0 } }, { parent: node });
  }
};

export const electricScooterFurniture = {
  type: 'electric_scooter',
  name: '电动车',
  unit: 'm',
  defaultSize: { width: 1.5, depth: 0.6, height: 1.05 },
  components: [
    { id: 'body', label: '外壳车框', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'seat', label: '皮质座垫/踏板', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'wheels', label: '轮胎车把', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal },
    { id: 'light', label: '前大灯', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.paleStone },
    { id: 'trunk', label: '后备储物箱', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream }
  ],
  interaction: {
    type: 'sit',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.55, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const wheelR = Math.min(h * 0.22, w * 0.14);
    const wheelThick = d * 0.18;
    const frontWheelCenter = { x: w * 0.36, y: wheelR, z: 0 };
    const rearWheelCenter = { x: -w * 0.32, y: wheelR, z: 0 };

    // 1. 前轮与后轮 (Wheels & Tires)
    [frontWheelCenter, rearWheelCenter].forEach((center) => {
      cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
        diameterTop: wheelR * 2,
        diameterBottom: wheelR * 2,
        height: wheelThick,
        tessellation: 12
      }, {
        position: center,
        rotation: { x: Math.PI / 2 }
      }, { parent: node });

      // 轮毂银/炭色轴心
      cylinderComponent(registry, item, electricScooterFurniture, 'light', {
        diameterTop: wheelR * 0.8,
        diameterBottom: wheelR * 0.8,
        height: wheelThick * 1.05,
        tessellation: 10
      }, {
        position: center,
        rotation: { x: Math.PI / 2 }
      }, { parent: node });
    });

    // 2. 前轮弧形挡泥板 (Front Mudguard)
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: wheelR * 2.5,
      height: 0.04,
      depth: wheelThick * 1.5
    }, {
      position: { x: frontWheelCenter.x, y: frontWheelCenter.y + wheelR * 0.9, z: 0 }
    }, { parent: node });

    // 3. 车身踏板底盘 (Footrest Floor Deck & Chassis)
    const deckH = 0.12;
    const deckY = wheelR * 0.8;
    boxComponent(registry, item, electricScooterFurniture, 'seat', {
      width: w * 0.55,
      height: deckH,
      depth: d * 0.72
    }, {
      position: { x: 0, y: deckY, z: 0 }
    }, { parent: node });

    // 侧面小支腿/脚撑 (Kickstand)
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: deckY * 1.2,
      tessellation: 6
    }, {
      position: { x: -w * 0.05, y: deckY * 0.5, z: -d * 0.32 },
      rotation: { z: -Math.PI / 6 }
    }, { parent: node });

    // 4. 前斜面板包围 (Front Shield / Fairing)
    const shieldW = w * 0.22;
    const shieldH = h * 0.55;
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: shieldW,
      height: shieldH,
      depth: d * 0.65
    }, {
      position: { x: w * 0.26, y: deckY + shieldH / 2, z: 0 },
      rotation: { z: -Math.PI / 16 }
    }, { parent: node });

    // 5. 经典复古大圆灯 (Front Headlight)
    cylinderComponent(registry, item, electricScooterFurniture, 'light', {
      diameterTop: d * 0.3,
      diameterBottom: d * 0.3,
      height: 0.06,
      tessellation: 12
    }, {
      position: { x: w * 0.38, y: deckY + shieldH * 0.75, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    // 6. 车把手与小挡风板/后视镜 (Handlebars & Mirrors)
    const handlebarY = deckY + shieldH + 0.08;
    // 转向轴
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.04,
      diameterBottom: 0.04,
      height: 0.16,
      tessellation: 8
    }, {
      position: { x: w * 0.22, y: handlebarY - 0.08, z: 0 }
    }, { parent: node });

    // 横把手
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.03,
      diameterBottom: 0.03,
      height: d * 0.95,
      tessellation: 8
    }, {
      position: { x: w * 0.22, y: handlebarY, z: 0 },
      rotation: { x: Math.PI / 2 }
    }, { parent: node });

    // 小透明/米色仪表挡风遮阳板 (Small Windshield / Dashboard Cover)
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: 0.02,
      height: 0.14,
      depth: d * 0.4
    }, {
      position: { x: w * 0.25, y: handlebarY + 0.07, z: 0 }
    }, { parent: node });

    // 左右圆形后视镜 (Rearview Mirrors)
    [-1, 1].forEach((zSide) => {
      // 杆
      cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
        diameterTop: 0.012,
        diameterBottom: 0.012,
        height: 0.18,
        tessellation: 6
      }, {
        position: { x: w * 0.22, y: handlebarY + 0.09, z: zSide * d * 0.38 },
        rotation: { z: Math.PI / 8 }
      }, { parent: node });

      // 圆镜子
      cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
        diameterTop: d * 0.16,
        diameterBottom: d * 0.16,
        height: 0.02,
        tessellation: 10
      }, {
        position: { x: w * 0.19, y: handlebarY + 0.18, z: zSide * d * 0.42 },
        rotation: { z: Math.PI / 2 }
      }, { parent: node });
    });

    // 7. 圆润后车身包围与卡其皮鞍座 (Rear Body Fairing & Seat Cushion)
    const rearBodyH = h * 0.38;
    const rearBodyY = deckY + rearBodyH / 2;
    // 后壳圆润罩
    boxComponent(registry, item, electricScooterFurniture, 'body', {
      width: w * 0.52,
      height: rearBodyH,
      depth: d * 0.76
    }, {
      position: { x: -w * 0.14, y: rearBodyY, z: 0 }
    }, { parent: node });

    // 侧面圆润贴牌
    [-1, 1].forEach((zSide) => {
      cylinderComponent(registry, item, electricScooterFurniture, 'light', {
        diameterTop: d * 0.28,
        diameterBottom: d * 0.28,
        height: 0.015,
        tessellation: 10
      }, {
        position: { x: -w * 0.14, y: rearBodyY, z: zSide * (d * 0.38 + 0.008) },
        rotation: { x: Math.PI / 2 }
      }, { parent: node });
    });

    // 皮质软鞍座 (Leather Seat Cushion)
    boxComponent(registry, item, electricScooterFurniture, 'seat', {
      width: w * 0.5,
      height: 0.1,
      depth: d * 0.72
    }, {
      position: { x: -w * 0.12, y: deckY + rearBodyH + 0.05, z: 0 }
    }, { parent: node });

    // 8. 尾部行李架与圆润储物后备箱 (Rear Trunk / Helmet Box)
    const trunkX = -w * 0.4;
    const trunkY = deckY + rearBodyH + 0.18;
    // 后支架杆
    cylinderComponent(registry, item, electricScooterFurniture, 'wheels', {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: w * 0.2,
      tessellation: 6
    }, {
      position: { x: -w * 0.32, y: deckY + rearBodyH + 0.06, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, { parent: node });

    // 椭圆/半球形后备箱
    cylinderComponent(registry, item, electricScooterFurniture, 'trunk', {
      diameterTop: d * 0.65,
      diameterBottom: d * 0.58,
      height: d * 0.5,
      tessellation: 12
    }, {
      position: { x: trunkX - d * 0.2, y: trunkY, z: 0 },
      rotation: { z: Math.PI }
    }, { parent: node });

    // 后备箱黑色软垫靠背 (Trunk Backrest)
    boxComponent(registry, item, electricScooterFurniture, 'wheels', {
      width: 0.04,
      height: d * 0.25,
      depth: d * 0.32
    }, {
      position: { x: trunkX + d * 0.26, y: trunkY, z: 0 }
    }, { parent: node });
  }
};

export const stepladderFurniture = {
  type: 'stepladder',
  name: '人字梯',
  unit: 'm',
  defaultSize: { width: 0.55, depth: 0.75, height: 1.15 },
  components: [
    { id: 'steps', label: '木质梯步', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood },
    { id: 'frame', label: '梯身主架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'hinge', label: '金属铰链', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.charcoal }
  ],
  interaction: {
    type: 'stand',
    getInteractionPoints(size) {
      return [
        { x: 0, y: size.height * 0.9, z: 0, rot: 0 }
      ];
    }
  },
  build(registry, item, node, size) {
    const w = size.width;
    const d = size.depth;
    const h = size.height;

    const topDepth = d * 0.32;
    const botDepth = d * 0.88;
    const strutWidth = 0.035;
    const strutDepth = 0.055;

    const effectiveH = h - 0.035;
    const dz = (botDepth - topDepth) / 2;
    const inclinationAngle = Math.atan2(dz, effectiveH);
    const strutLen = Math.hypot(effectiveH, dz);

    // 1. 顶层大置物/站立平台 (Top Platform)
    const topH = 0.035;
    boxComponent(registry, item, stepladderFurniture, 'steps', {
      width: w * 0.92,
      height: topH,
      depth: topDepth * 1.1
    }, { position: { x: 0, y: h - topH / 2, z: 0 } }, { parent: node });

    // 2. 前倾斜梯梁与后倾斜支撑腿 (正向 A 字收拢架构，底部宽顶部窄)
    const strutZMid = (topDepth / 2 + botDepth / 2) / 2 - dz * 0.1;

    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - strutWidth / 2);

      // 前梯梁 (Front Strut) - 位于 +Z 侧，从底端向上向内 (-Z) 倾斜
      boxComponent(registry, item, stepladderFurniture, 'frame', {
        width: strutWidth,
        height: strutLen,
        depth: strutDepth
      }, {
        position: { x: xPos, y: effectiveH / 2, z: strutZMid },
        rotation: { x: -inclinationAngle }
      }, { parent: node });

      // 后支撑腿 (Rear Strut) - 位于 -Z 侧，从底端向上向内 (+Z) 倾斜
      boxComponent(registry, item, stepladderFurniture, 'frame', {
        width: strutWidth * 0.9,
        height: strutLen,
        depth: strutDepth * 0.85
      }, {
        position: { x: xPos, y: effectiveH / 2, z: -strutZMid },
        rotation: { x: inclinationAngle }
      }, { parent: node });
    });

    // 3. 多层宽木踏板 (3 Tread Steps)
    const stepCount = 3;
    for (let i = 1; i <= stepCount; i += 1) {
      const progress = i / (stepCount + 1);
      const stepY = effectiveH * progress;
      const stepZ = (botDepth / 2) - dz * progress;

      boxComponent(registry, item, stepladderFurniture, 'steps', {
        width: w * 0.84,
        height: 0.026,
        depth: 0.13
      }, { position: { x: 0, y: stepY, z: stepZ } }, { parent: node });
    }

    // 4. 后支撑脚腿间水平横向横档 (Rear Strut Cross Braces)
    [0.3, 0.65].forEach((prog) => {
      const braceY = effectiveH * prog;
      const braceZ = -((botDepth / 2) - dz * prog);
      boxComponent(registry, item, stepladderFurniture, 'frame', {
        width: w * 0.86,
        height: 0.028,
        depth: 0.025
      }, { position: { x: 0, y: braceY, z: braceZ } }, { parent: node });
    });

    // 5. 侧面金属折叠防折铰链拉杆 (Metal Hinge Brackets)
    const hingeY = effectiveH * 0.5;
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - strutWidth / 2);
      const hingeZMid = 0;
      const hingeLen = strutZMid * 1.6;

      boxComponent(registry, item, stepladderFurniture, 'hinge', {
        width: 0.015,
        height: 0.016,
        depth: hingeLen
      }, { position: { x: xPos, y: hingeY, z: hingeZMid } }, { parent: node });

      // 铰链中间转轴节点
      cylinderComponent(registry, item, stepladderFurniture, 'hinge', {
        diameterTop: 0.028,
        diameterBottom: 0.028,
        height: 0.022,
        tessellation: 8
      }, {
        position: { x: xPos, y: hingeY, z: hingeZMid },
        rotation: { z: Math.PI / 2 }
      }, { parent: node });
    });

    // 6. 底端防滑脚衬垫 (Anti-slip Feet Pads)
    [-1, 1].forEach((xSide) => {
      const xPos = xSide * (w / 2 - strutWidth / 2);
      const footZ = botDepth / 2;
      [-footZ, footZ].forEach((zPos) => {
        boxComponent(registry, item, stepladderFurniture, 'hinge', {
          width: strutWidth * 1.15,
          height: 0.022,
          depth: strutDepth * 1.15
        }, { position: { x: xPos, y: 0.011, z: zPos } }, { parent: node });
      });
    });
  }
};




