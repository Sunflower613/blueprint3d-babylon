import { boxComponent, cylinderComponent, sphereComponent, latheComponent } from './_helpers.js';

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
  terracotta: '#b87555'
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
  defaultSize: { width: 1.85, depth: 0.5, height: 2.25 },
  components: [
    { id: 'frame', label: '拱门架', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.cream },
    { id: 'flowers', label: '花艺', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.flower }
  ],
  build(registry, item, node, size) {
    const postW = Math.max(0.05, size.width * 0.025);
    const sideHeight = size.height * 0.78;
    const xOffset = size.width / 2 - postW / 2;

    [-1, 1].forEach((side) => {
      boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: postW,
        height: sideHeight,
        depth: postW
      }, { position: { x: side * xOffset, y: sideHeight / 2, z: 0 } }, { parent: node });
    });

    boxComponent(registry, item, flowerArchFurniture, 'frame', {
      width: size.width * 0.68,
      height: postW,
      depth: postW
    }, { position: { x: 0, y: size.height - postW / 2, z: 0 } }, { parent: node });

    [-1, 1].forEach((side) => {
      const arch = boxComponent(registry, item, flowerArchFurniture, 'frame', {
        width: size.width * 0.22,
        height: postW,
        depth: postW
      }, { position: { x: side * size.width * 0.2, y: size.height * 0.9, z: 0 } }, { parent: node });
      arch.rotation.z = side * Math.PI * 0.2;
    });

    [-0.25, -0.08, 0.08, 0.25].forEach((offset) => {
      boxComponent(registry, item, flowerArchFurniture, 'flowers', {
        width: size.width * 0.12,
        height: postW * 1.6,
        depth: postW * 1.8
      }, { position: { x: size.width * offset, y: size.height * 0.9, z: 0 } }, { parent: node });
    });
  }
};

export const gazeboFurniture = {
  type: 'gazebo',
  name: '凉亭',
  unit: 'm',
  defaultSize: { width: 2.75, depth: 2.75, height: 2.75 },
  components: [
    { id: 'posts', label: '立柱', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.darkWood },
    { id: 'roof', label: '顶蓬', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.terracotta },
    { id: 'rails', label: '护栏', defaultColor: SOFT_LOW_POLY_OUTDOOR_PALETTE.warmWood }
  ],
  build(registry, item, node, size) {
    const postW = Math.max(0.08, size.width * 0.028);
    const railH = Math.max(0.05, size.height * 0.05);
    const xOffset = size.width / 2 - postW / 2;
    const zOffset = size.depth / 2 - postW / 2;

    [-1, 1].forEach((xSide) => {
      [-1, 1].forEach((zSide) => {
        boxComponent(registry, item, gazeboFurniture, 'posts', {
          width: postW,
          height: size.height * 0.86,
          depth: postW
        }, { position: { x: xSide * xOffset, y: size.height * 0.43, z: zSide * zOffset } }, { parent: node });
      });
    });

    boxComponent(registry, item, gazeboFurniture, 'roof', {
      width: size.width,
      height: size.height * 0.1,
      depth: size.depth
    }, { position: { x: 0, y: size.height * 0.92, z: 0 } }, { parent: node });

    boxComponent(registry, item, gazeboFurniture, 'roof', {
      width: size.width * 0.78,
      height: size.height * 0.08,
      depth: size.depth * 0.78
    }, { position: { x: 0, y: size.height, z: 0 } }, { parent: node });

    // [-1, 1].forEach((side) => {
    //   boxComponent(registry, item, gazeboFurniture, 'rails', {
    //     width: size.width * 0.72,
    //     height: railH,
    //     depth: postW
    //   }, { position: { x: 0, y: size.height * 0.28, z: side * zOffset } }, { parent: node });
    //   boxComponent(registry, item, gazeboFurniture, 'rails', {
    //     width: postW,
    //     height: railH,
    //     depth: size.depth * 0.72
    //   }, { position: { x: side * xOffset, y: size.height * 0.28, z: 0 } }, { parent: node });
    // });
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

