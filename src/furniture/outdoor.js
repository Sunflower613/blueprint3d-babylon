import { boxComponent, cylinderComponent } from './_helpers.js';

const lieInteraction = (yRatio = 0.42, zRatio = 0) => ({
  type: 'lie',
  getInteractionPoints(size) {
    return [{ x: 0, y: size.height * yRatio, z: size.depth * zRatio, rot: 0 }];
  }
});

export const outdoorUmbrellaFurniture = {
  type: 'outdoor_umbrella',
  name: '\u906e\u9633\u4f1e',
  defaultSize: { width: 42, depth: 42, height: 88 },
  components: [
    { id: 'canopy', label: '\u4f1e\u84ec', defaultColor: '#f3e4c8' },
    { id: 'pole', label: '\u4f1e\u6746', defaultColor: '#6d5b47' },
    { id: 'base', label: '\u5e95\u5ea7', defaultColor: '#8f8a83' }
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
  name: '\u8461\u8404\u67b6',
  defaultSize: { width: 96, depth: 60, height: 96 },
  components: [
    { id: 'posts', label: '\u7acb\u67f1', defaultColor: '#7f6146' },
    { id: 'beams', label: '\u6a2a\u6881', defaultColor: '#8f7053' },
    { id: 'vines', label: '\u722c\u85e4', defaultColor: '#7eb16b' }
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
  name: '\u82b1\u5708\u62f1\u95e8',
  defaultSize: { width: 72, depth: 20, height: 88 },
  components: [
    { id: 'frame', label: '\u62f1\u95e8\u67b6', defaultColor: '#e7e0d5' },
    { id: 'flowers', label: '\u82b1\u827a', defaultColor: '#f2a6bc' }
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
  name: '\u51c9\u4ead',
  defaultSize: { width: 108, depth: 108, height: 108 },
  components: [
    { id: 'posts', label: '\u7acb\u67f1', defaultColor: '#75614d' },
    { id: 'roof', label: '\u9876\u84ec', defaultColor: '#c38b63' },
    { id: 'rails', label: '\u62a4\u680f', defaultColor: '#8c7159' }
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
  name: '\u5ead\u9662\u79cb\u5343',
  defaultSize: { width: 78, depth: 52, height: 78 },
  components: [
    { id: 'frame', label: '\u652f\u67b6', defaultColor: '#5f554d' },
    { id: 'seat', label: '\u5ea7\u6905', defaultColor: '#d8b38a' },
    { id: 'canopy', label: '\u9876\u84ec', defaultColor: '#c6d9ef' }
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
  name: '\u540a\u5e8a\u67b6',
  defaultSize: { width: 102, depth: 34, height: 48 },
  components: [
    { id: 'frame', label: '\u652f\u67b6', defaultColor: '#7e6449' },
    { id: 'bed', label: '\u540a\u5e8a', defaultColor: '#f0d7af' }
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
  name: '\u5ead\u9662\u706b\u76c6',
  defaultSize: { width: 30, depth: 30, height: 16 },
  components: [
    { id: 'bowl', label: '\u706b\u76c6', defaultColor: '#5f5d61' },
    { id: 'base', label: '\u5e95\u67b6', defaultColor: '#353539' },
    { id: 'ring', label: '\u7089\u6cbf', defaultColor: '#9a6a4f' }
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
  name: '\u70e7\u70e4\u67b6',
  defaultSize: { width: 48, depth: 22, height: 42 },
  components: [
    { id: 'grill', label: '\u70e4\u7089', defaultColor: '#3e4146' },
    { id: 'legs', label: '\u652f\u817f', defaultColor: '#73777f' },
    { id: 'shelf', label: '\u7f6e\u7269\u677f', defaultColor: '#8f6749' }
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
  name: '\u5ead\u9662\u53d6\u6696\u5668',
  defaultSize: { width: 18, depth: 18, height: 84 },
  components: [
    { id: 'base', label: '\u5e95\u5ea7', defaultColor: '#7e8085' },
    { id: 'pole', label: '\u7acb\u6746', defaultColor: '#b8bec6' },
    { id: 'hood', label: '\u6563\u70ed\u76d8', defaultColor: '#ddd4c2' }
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
  name: '\u82b1\u56ed\u55b7\u6cc9',
  defaultSize: { width: 32, depth: 32, height: 52 },
  components: [
    { id: 'base', label: '\u5e95\u76c6', defaultColor: '#bcb7ae' },
    { id: 'column', label: '\u6cc9\u67f1', defaultColor: '#a59c8d' },
    { id: 'top', label: '\u9876\u76c6', defaultColor: '#d8e6f2' },
    { id: 'water', label: '\u6c34\u4f53', defaultColor: '#b2ebf2' }
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
  name: '\u9e1f\u6d74\u53f0',
  defaultSize: { width: 18, depth: 18, height: 34 },
  components: [
    { id: 'base', label: '\u53f0\u67f1', defaultColor: '#b8b0a5' },
    { id: 'basin', label: '\u6d74\u76c6', defaultColor: '#d5e6ef' },
    { id: 'water', label: '\u6c34\u4f53', defaultColor: '#b2ebf2' }
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
  name: '\u5ead\u9662\u82b1\u7bb1',
  defaultSize: { width: 30, depth: 14, height: 16 },
  components: [
    { id: 'box', label: '\u82b1\u69fd', defaultColor: '#a4734c' },
    { id: 'legs', label: '\u652f\u817f', defaultColor: '#6f5842' },
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
  name: '\u9ad8\u67b6\u79cd\u690d\u7bb1',
  defaultSize: { width: 54, depth: 26, height: 22 },
  components: [
    { id: 'box', label: '\u79cd\u690d\u69fd', defaultColor: '#9f764f' },
    { id: 'legs', label: '\u7ad9\u817f', defaultColor: '#705740' },
    { id: 'rail', label: '\u52a0\u56fa\u6761', defaultColor: '#8f6b49' }
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
  name: '\u722c\u85e4\u82b1\u67b6',
  defaultSize: { width: 40, depth: 6, height: 78 },
  components: [
    { id: 'frame', label: '\u5916\u6846', defaultColor: '#826448' },
    { id: 'slats', label: '\u683c\u6805', defaultColor: '#9c7a58' }
  ],
  build(registry, item, node, size) {
    boxComponent(registry, item, trellisScreenFurniture, 'frame', {
      width: size.width,
      height: size.height,
      depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    for (let index = -3; index <= 3; index += 1) {
      boxComponent(registry, item, trellisScreenFurniture, 'slats', {
        width: 0.03,
        height: size.height * 0.86,
        depth: size.depth * 0.7
      }, { position: { x: index * size.width * 0.12, y: size.height * 0.5, z: 0 } }, { parent: node });
    }

    for (let index = -2; index <= 2; index += 1) {
      boxComponent(registry, item, trellisScreenFurniture, 'slats', {
        width: size.width * 0.84,
        height: 0.03,
        depth: size.depth * 0.7
      }, { position: { x: 0, y: size.height * (0.22 + (index + 2) * 0.16), z: 0 } }, { parent: node });
    }
  }
};

export const outdoorStorageBoxFurniture = {
  type: 'outdoor_storage_box',
  name: '\u6237\u5916\u6536\u7eb3\u7bb1',
  defaultSize: { width: 42, depth: 22, height: 24 },
  components: [
    { id: 'box', label: '\u7bb1\u4f53', defaultColor: '#8d775f' },
    { id: 'lid', label: '\u7bb1\u76d6', defaultColor: '#b39877' }
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
  name: '\u5c0f\u56ed\u6865',
  defaultSize: { width: 66, depth: 20, height: 20 },
  components: [
    { id: 'deck', label: '\u6865\u9762', defaultColor: '#ab7b50' },
    { id: 'rails', label: '\u6263\u624b', defaultColor: '#6e523d' },
    { id: 'supports', label: '\u652f\u6491', defaultColor: '#7d6045' }
  ],
  build(registry, item, node, size) {
    const deck = boxComponent(registry, item, gardenBridgeFurniture, 'deck', {
      width: size.width,
      height: size.height * 0.12,
      depth: size.depth * 0.8
    }, { position: { x: 0, y: size.height * 0.42, z: 0 } }, { parent: node });
    deck.rotation.z = Math.PI * 0.06;

    [-1, 1].forEach((side) => {
      const rail = boxComponent(registry, item, gardenBridgeFurniture, 'rails', {
        width: size.width * 0.92,
        height: 0.03,
        depth: 0.03
      }, { position: { x: 0, y: size.height * 0.82, z: side * size.depth * 0.32 } }, { parent: node });
      rail.rotation.z = Math.PI * 0.06;

      const support1 = boxComponent(registry, item, gardenBridgeFurniture, 'supports', {
        width: 0.03,
        height: size.height * 0.48,
        depth: 0.03
      }, { position: { x: -size.width * 0.28, y: size.height * 0.58, z: side * size.depth * 0.32 } }, { parent: node });
      support1.rotation.z = Math.PI * 0.06;

      const support2 = boxComponent(registry, item, gardenBridgeFurniture, 'supports', {
        width: 0.03,
        height: size.height * 0.48,
        depth: 0.03
      }, { position: { x: size.width * 0.28, y: size.height * 0.58, z: side * size.depth * 0.32 } }, { parent: node });
      support2.rotation.z = Math.PI * 0.06;
    });
  }
};

export const canopyTentFurniture = {
  type: 'canopy_tent',
  name: '\u6298\u53e0\u5929\u5e55',
  defaultSize: { width: 96, depth: 96, height: 96 },
  components: [
    { id: 'canopy', label: '\u5929\u5e55', defaultColor: '#f6f1e8' },
    { id: 'posts', label: '\u7acb\u6746', defaultColor: '#9ca3ab' },
    { id: 'frame', label: '\u8fde\u63a5\u67b6', defaultColor: '#7e858e' }
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
  name: '\u6cf3\u6c60\u8eba\u5e8a',
  defaultSize: { width: 78, depth: 34, height: 34 },
  components: [
    { id: 'bed', label: '\u8eba\u9762', defaultColor: '#d9d2c7' },
    { id: 'frame', label: '\u5e95\u67b6', defaultColor: '#87684d' },
    { id: 'canopy', label: '\u906e\u9633\u5e18', defaultColor: '#f8f1df' }
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
  name: '\u56ed\u827a\u64cd\u4f5c\u53f0',
  defaultSize: { width: 48, depth: 20, height: 60 },
  components: [
    { id: 'counter', label: '\u64cd\u4f5c\u53f0', defaultColor: '#caa57d' },
    { id: 'shelf', label: '\u5c42\u677f', defaultColor: '#b48d63' },
    { id: 'frame', label: '\u652f\u67b6', defaultColor: '#7b6148' }
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
