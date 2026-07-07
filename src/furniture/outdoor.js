import { boxComponent, cylinderComponent, sphereComponent } from './_helpers.js';

const lieInteraction = (yRatio = 0.42, zRatio = 0) => ({
  type: 'lie',
  getInteractionPoints(size) {
    return [{ x: 0, y: size.height * yRatio, z: size.depth * zRatio, rot: 0 }];
  }
});

export const outdoorUmbrellaFurniture = {
  type: 'outdoor_umbrella',
  name: '遮阳伞',
  defaultSize: { width: 42, depth: 42, height: 88 },
  components: [
    { id: 'canopy', label: '伞蓬', defaultColor: '#f3e4c8' },
    { id: 'pole', label: '伞杆', defaultColor: '#6d5b47' },
    { id: 'base', label: '底座', defaultColor: '#8f8a83' }
  ],
  build(registry, item, node, size) {
    const canopyH = Math.max(0.06, size.height * 0.1);
    const poleH = size.height - canopyH - 0.04;
    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'canopy', {
      diameterTop: size.width * 0.2,
      diameterBottom: size.width,
      height: canopyH,
      tessellation: 24
    }, { position: { x: 0, y: poleH + canopyH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'pole', {
      diameterTop: 0.05,
      diameterBottom: 0.06,
      height: poleH,
      tessellation: 16
    }, { position: { x: 0, y: poleH / 2, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, outdoorUmbrellaFurniture, 'base', {
      diameterTop: size.width * 0.22,
      diameterBottom: size.width * 0.26,
      height: 0.05,
      tessellation: 24
    }, { position: { x: 0, y: 0.025, z: 0 } }, { parent: node });
  }
};

export const pergolaFurniture = {
  type: 'pergola',
  name: '葡萄架',
  defaultSize: { width: 96, depth: 60, height: 96 },
  components: [
    { id: 'posts', label: '立柱', defaultColor: '#7f6146' },
    { id: 'beams', label: '横梁', defaultColor: '#8f7053' },
    { id: 'vines', label: '爬藤', defaultColor: '#7eb16b' }
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
  defaultSize: { width: 72, depth: 20, height: 88 },
  components: [
    { id: 'frame', label: '拱门架', defaultColor: '#e7e0d5' },
    { id: 'flowers', label: '花艺', defaultColor: '#f2a6bc' }
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
  defaultSize: { width: 108, depth: 108, height: 108 },
  components: [
    { id: 'posts', label: '立柱', defaultColor: '#75614d' },
    { id: 'roof', label: '顶蓬', defaultColor: '#c38b63' },
    { id: 'rails', label: '护栏', defaultColor: '#8c7159' }
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
  name: '庭院秋千',
  defaultSize: { width: 78, depth: 52, height: 78 },
  components: [
    { id: 'frame', label: '支架', defaultColor: '#5f554d' },
    { id: 'seat', label: '座椅', defaultColor: '#d8b38a' },
    { id: 'canopy', label: '顶蓬', defaultColor: '#c6d9ef' }
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
  defaultSize: { width: 102, depth: 34, height: 48 },
  components: [
    { id: 'frame', label: '支架', defaultColor: '#7e6449' },
    { id: 'bed', label: '吊床', defaultColor: '#f0d7af' }
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
  name: '庭院火盆',
  defaultSize: { width: 30, depth: 30, height: 16 },
  components: [
    { id: 'bowl', label: '火盆', defaultColor: '#5f5d61' },
    { id: 'base', label: '底架', defaultColor: '#353539' },
    { id: 'ring', label: '炉沿', defaultColor: '#9a6a4f' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, firePitFurniture, 'base', {
      diameterTop: size.width * 0.46,
      diameterBottom: size.width * 0.6,
      height: size.height * 0.32,
      tessellation: 24
    }, { position: { x: 0, y: size.height * 0.16, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, firePitFurniture, 'bowl', {
      diameterTop: size.width,
      diameterBottom: size.width * 0.74,
      height: size.height * 0.52,
      tessellation: 24
    }, { position: { x: 0, y: size.height * 0.5, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, firePitFurniture, 'ring', {
      diameterTop: size.width * 0.86,
      diameterBottom: size.width * 0.86,
      height: 0.03,
      tessellation: 24
    }, { position: { x: 0, y: size.height * 0.73, z: 0 } }, { parent: node });
  }
};

export const barbecueGrillFurniture = {
  type: 'barbecue_grill',
  name: '烧烤架',
  defaultSize: { width: 48, depth: 22, height: 42 },
  components: [
    { id: 'grill', label: '烤炉', defaultColor: '#3e4146' },
    { id: 'legs', label: '支腿', defaultColor: '#73777f' },
    { id: 'shelf', label: '置物板', defaultColor: '#8f6749' }
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
  name: '庭院取暖器',
  defaultSize: { width: 18, depth: 18, height: 84 },
  components: [
    { id: 'base', label: '底座', defaultColor: '#7e8085' },
    { id: 'pole', label: '立杆', defaultColor: '#b8bec6' },
    { id: 'hood', label: '散热盘', defaultColor: '#ddd4c2' }
  ],
  build(registry, item, node, size) {
    cylinderComponent(registry, item, patioHeaterFurniture, 'base', {
      diameterTop: size.width * 0.5,
      diameterBottom: size.width * 0.62,
      height: size.height * 0.08,
      tessellation: 20
    }, { position: { x: 0, y: size.height * 0.04, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, patioHeaterFurniture, 'pole', {
      diameterTop: 0.04,
      diameterBottom: 0.05,
      height: size.height * 0.76,
      tessellation: 16
    }, { position: { x: 0, y: size.height * 0.46, z: 0 } }, { parent: node });

    cylinderComponent(registry, item, patioHeaterFurniture, 'hood', {
      diameterTop: size.width * 0.2,
      diameterBottom: size.width,
      height: size.height * 0.12,
      tessellation: 24
    }, { position: { x: 0, y: size.height * 0.9, z: 0 } }, { parent: node });
  }
};

export const gardenFountainFurniture = {
  type: 'garden_fountain',
  name: '花园喷泉',
  defaultSize: { width: 32, depth: 32, height: 52 },
  components: [
    { id: 'base', label: '底盆', defaultColor: '#bcb7ae' },
    { id: 'column', label: '泉柱', defaultColor: '#a59c8d' },
    { id: 'top', label: '顶盆', defaultColor: '#d8e6f2' },
    { id: 'water', label: '水体', defaultColor: '#b2ebf2' }
  ],
  build(registry, item, node, size) {
    // 1. 中空八角底盆底板
    const baseBottomH = 0.03;
    const baseH = size.height * 0.22;
    cylinderComponent(registry, item, gardenFountainFurniture, 'base', {
      diameterTop: size.width - 0.04,
      diameterBottom: size.width - 0.04,
      height: baseBottomH,
      tessellation: 20
    }, { position: { x: 0, y: baseBottomH / 2, z: 0 } }, { parent: node });

    // 2. 八角底盆围板 (拼出中空凹槽)
    const baseWallT = 0.04;
    const baseWallR = size.width / 2 - baseWallT / 2;
    const baseBoardW = size.width * 0.414;
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * baseWallR;
      const z = Math.sin(angle) * baseWallR;

      const wall = boxComponent(registry, item, gardenFountainFurniture, 'base', {
        width: baseWallT,
        height: baseH,
        depth: baseBoardW
      }, {
        position: { x: x, y: baseH / 2, z: z }
      }, { parent: node });

      wall.rotation.y = -angle;
    }

    // 3. 喷泉中央泉柱
    cylinderComponent(registry, item, gardenFountainFurniture, 'column', {
      diameterTop: size.width * 0.16,
      diameterBottom: size.width * 0.22,
      height: size.height * 0.44,
      tessellation: 18
    }, { position: { x: 0, y: size.height * 0.44, z: 0 } }, { parent: node });

    // 4. 中空八角顶盆底板
    const topBottomH = 0.025;
    const topH = size.height * 0.16;
    const topY = size.height * 0.66;
    const topDiameter = size.width * 0.58;

    cylinderComponent(registry, item, gardenFountainFurniture, 'top', {
      diameterTop: topDiameter - 0.03,
      diameterBottom: topDiameter - 0.03,
      height: topBottomH,
      tessellation: 16
    }, { position: { x: 0, y: topY + topBottomH / 2, z: 0 } }, { parent: node });

    // 5. 八角顶盆围板 (拼出中空顶盆)
    const topWallT = 0.03;
    const topWallR = topDiameter / 2 - topWallT / 2;
    const topBoardW = topDiameter * 0.414;

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * topWallR;
      const z = Math.sin(angle) * topWallR;

      const wall = boxComponent(registry, item, gardenFountainFurniture, 'top', {
        width: topWallT,
        height: topH,
        depth: topBoardW
      }, {
        position: { x: x, y: topY + topH / 2, z: z }
      }, { parent: node });

      wall.rotation.y = -angle;
    }

    // 6. 喷泉双层凹槽蓄水面 (蓄在盆内部)
    if (item.waterEnabled !== false) {
      // 底盆水面 (比底盆边缘矮 0.03米)
      cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
        diameterTop: size.width - baseWallT * 2 - 0.01,
        diameterBottom: size.width - baseWallT * 2 - 0.01,
        height: 0.005,
        tessellation: 20
      }, { position: { x: 0, y: baseH - 0.03, z: 0 } }, { parent: node });

      // 顶盆水面 (比顶盆边缘矮 0.02米)
      cylinderComponent(registry, item, gardenFountainFurniture, 'water', {
        diameterTop: topDiameter - topWallT * 2 - 0.01,
        diameterBottom: topDiameter - topWallT * 2 - 0.01,
        height: 0.005,
        tessellation: 16
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
  name: '鸟浴台',
  defaultSize: { width: 18, depth: 18, height: 34 },
  components: [
    { id: 'base', label: '台柱', defaultColor: '#b8b0a5' },
    { id: 'basin', label: '浴盆', defaultColor: '#d5e6ef' },
    { id: 'water', label: '水体', defaultColor: '#b2ebf2' }
  ],
  build(registry, item, node, size) {
    // 1. 底座台柱
    cylinderComponent(registry, item, birdbathFurniture, 'base', {
      diameterTop: size.width * 0.18,
      diameterBottom: size.width * 0.26,
      height: size.height * 0.72,
      tessellation: 16
    }, { position: { x: 0, y: size.height * 0.36, z: 0 } }, { parent: node });

    // 2. 中空八角浴盆底板
    const basinBottomH = 0.03;
    const basinH = size.height * 0.16;
    const basinY = size.height * 0.72;
    
    cylinderComponent(registry, item, birdbathFurniture, 'basin', {
      diameterTop: size.width - 0.04,
      diameterBottom: size.width - 0.04,
      height: basinBottomH,
      tessellation: 16
    }, { position: { x: 0, y: basinY + basinBottomH / 2, z: 0 } }, { parent: node });

    // 3. 八角浴盆围板 (拼出中空凹槽)
    const wallThickness = 0.04;
    const wallRadius = size.width / 2 - wallThickness / 2;
    const boardWidth = size.width * 0.414;
    const segments = 8;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallRadius;
      const z = Math.sin(angle) * wallRadius;
      
      const wall = boxComponent(registry, item, birdbathFurniture, 'basin', {
        width: wallThickness,
        height: basinH,
        depth: boardWidth
      }, {
        position: { x: x, y: basinY + basinH / 2, z: z }
      }, { parent: node });
      
      wall.rotation.y = -angle;
    }

    // 4. 鸟浴台凹槽蓄水面 (蓄在凹槽内)
    if (item.waterEnabled !== false) {
      cylinderComponent(registry, item, birdbathFurniture, 'water', {
        diameterTop: size.width - wallThickness * 2 - 0.01,
        diameterBottom: size.width - wallThickness * 2 - 0.01,
        height: 0.005,
        tessellation: 20
      }, { position: { x: 0, y: basinY + basinH - 0.03, z: 0 } }, { parent: node });
    }
  }
};

export const planterBoxFurniture = {
  type: 'planter_box',
  name: '庭院花箱',
  defaultSize: { width: 30, depth: 14, height: 16 },
  components: [
    { id: 'box', label: '花槽', defaultColor: '#a4734c' },
    { id: 'legs', label: '支腿', defaultColor: '#6f5842' },
    { id: 'soil', label: '泥土', defaultColor: '#5c4033' }
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
  name: '高架种植箱',
  defaultSize: { width: 54, depth: 26, height: 22 },
  components: [
    { id: 'box', label: '种植槽', defaultColor: '#9f764f' },
    { id: 'legs', label: '站腿', defaultColor: '#705740' },
    { id: 'rail', label: '加固条', defaultColor: '#8f6b49' }
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
  name: '爬藤花架',
  defaultSize: { width: 40, depth: 6, height: 78 },
  components: [
    { id: 'frame', label: '外框', defaultColor: '#826448' },
    { id: 'slats', label: '格栅', defaultColor: '#9c7a58' }
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
  name: '户外收纳箱',
  defaultSize: { width: 42, depth: 22, height: 24 },
  components: [
    { id: 'box', label: '箱体', defaultColor: '#8d775f' },
    { id: 'lid', label: '箱盖', defaultColor: '#b39877' }
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
  defaultSize: { width: 66, depth: 20, height: 20 },
  components: [
    { id: 'deck', label: '桥面', defaultColor: '#ab7b50' },
    { id: 'rails', label: '扣手', defaultColor: '#6e523d' },
    { id: 'supports', label: '支撑', defaultColor: '#7d6045' }
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
  name: '折叠天幕',
  defaultSize: { width: 96, depth: 96, height: 96 },
  components: [
    { id: 'canopy', label: '天幕', defaultColor: '#f6f1e8' },
    { id: 'posts', label: '立杆', defaultColor: '#9ca3ab' },
    { id: 'frame', label: '连接架', defaultColor: '#7e858e' }
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
  name: '泳池躺床',
  defaultSize: { width: 78, depth: 34, height: 34 },
  components: [
    { id: 'bed', label: '躺面', defaultColor: '#d9d2c7' },
    { id: 'frame', label: '底架', defaultColor: '#87684d' },
    { id: 'canopy', label: '遮阳帘', defaultColor: '#f8f1df' }
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
  name: '园艺操作台',
  defaultSize: { width: 48, depth: 20, height: 60 },
  components: [
    { id: 'counter', label: '操作台', defaultColor: '#caa57d' },
    { id: 'shelf', label: '层板', defaultColor: '#b48d63' },
    { id: 'frame', label: '支架', defaultColor: '#7b6148' }
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

export const landscapeMarbleFountain = {
  type: 'landscape_marble_fountain',
  name: '石雕跌水喷泉',
  defaultSize: { width: 56, depth: 56, height: 60 },
  components: [
    { id: 'fountain-marble', label: '汉白玉雕座', defaultColor: '#fafafa' },
    { id: 'fountain-water', label: '涌动喷泉', defaultColor: '#e0f7fa' }
  ],
  build(registry, item, node, size) {
    const baseH = size.height * 0.18;
    const baseBottomH = 0.02;

    // 底盘底板
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      diameterTop: size.width - 0.04, diameterBottom: size.width - 0.04, height: baseBottomH, tessellation: 16
    }, { position: { x: 0, y: baseBottomH / 2, z: 0 } }, { parent: node });

    // 8段环状拼成底盘壁
    const wallT = 0.04;
    const wallR = size.width / 2 - wallT / 2;
    const boardW = size.width * 0.414;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallR;
      const z = Math.sin(angle) * wallR;
      const wall = boxComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
        width: wallT, height: baseH, depth: boardW
      }, { position: { x: x, y: baseH / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    // 底盆水面
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
      diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 12
    }, { position: { x: 0, y: baseH - 0.02, z: 0 } }, { parent: node });

    const pillarH = size.height * 0.55;
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      diameterTop: size.width * 0.18, diameterBottom: size.width * 0.28, height: pillarH, tessellation: 12
    }, { position: { x: 0, y: baseH + pillarH / 2, z: 0 } }, { parent: node });

    // 顶盆 (中空盆)
    const bowlH = size.height * 0.08;
    const bowlY = baseH + pillarH * 0.75;
    const bowlD = size.width * 0.65;
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
      diameterTop: bowlD - 0.03, diameterBottom: bowlD - 0.03, height: baseBottomH, tessellation: 16
    }, { position: { x: 0, y: bowlY + baseBottomH / 2, z: 0 } }, { parent: node });

    const bowlWallT = 0.03;
    const bowlWallR = bowlD / 2 - bowlWallT / 2;
    const bowlBoardW = bowlD * 0.414;
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * bowlWallR;
      const z = Math.sin(angle) * bowlWallR;
      const wall = boxComponent(registry, item, landscapeMarbleFountain, 'fountain-marble', {
        width: bowlWallT, height: bowlH, depth: bowlBoardW
      }, { position: { x: x, y: bowlY + bowlH / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    // 顶盆水面与涌出水球
    cylinderComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
      diameterTop: bowlD - bowlWallT * 2, diameterBottom: bowlD - bowlWallT * 2, height: 0.02, tessellation: 12
    }, { position: { x: 0, y: bowlY + bowlH - 0.015, z: 0 } }, { parent: node });

    sphereComponent(registry, item, landscapeMarbleFountain, 'fountain-water', {
      diameter: size.width * 0.32, segments: 10
    }, { position: { x: 0, y: size.height - size.height * 0.12, z: 0 } }, { parent: node });
  }
};

export const landscapeEuroPondSculpture = {
  type: 'landscape_euro_pond_sculpture',
  name: '古典水池雕塑',
  defaultSize: { width: 64, depth: 64, height: 72 },
  components: [
    { id: 'pond-basin', label: '雕花大石盆', defaultColor: '#d7ccc8' },
    { id: 'pond-water', label: '池中涟漪', defaultColor: '#80deea' },
    { id: 'pond-sculpture', label: '古典石雕像', defaultColor: '#efebe9' }
  ],
  build(registry, item, node, size) {
    const basinH = size.height * 0.2;
    const baseBottomH = 0.02;

    // 底板
    cylinderComponent(registry, item, landscapeEuroPondSculpture, 'pond-basin', {
      diameterTop: size.width - 0.04, diameterBottom: size.width - 0.04, height: baseBottomH, tessellation: 16
    }, { position: { x: 0, y: baseBottomH / 2, z: 0 } }, { parent: node });

    // 8段环状拼成底盆壁
    const wallT = 0.04;
    const wallR = size.width / 2 - wallT / 2;
    const boardW = size.width * 0.414;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = Math.cos(angle) * wallR;
      const z = Math.sin(angle) * wallR;
      const wall = boxComponent(registry, item, landscapeEuroPondSculpture, 'pond-basin', {
        width: wallT, height: basinH, depth: boardW
      }, { position: { x: x, y: basinH / 2, z: z } }, { parent: node });
      wall.rotation.y = -angle;
    }

    // 内嵌水面
    cylinderComponent(registry, item, landscapeEuroPondSculpture, 'pond-water', {
      diameterTop: size.width - wallT * 2, diameterBottom: size.width - wallT * 2, height: 0.02, tessellation: 16
    }, { position: { x: 0, y: basinH - 0.02, z: 0 } }, { parent: node });

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
  name: '石雕小拱桥',
  defaultSize: { width: 72, depth: 30, height: 28 },
  components: [
    { id: 'bridge-marble', label: '汉白玉石桥', defaultColor: '#eceff1' },
    { id: 'bridge-railing', label: '石桥栏杆', defaultColor: '#cfd8dc' }
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

