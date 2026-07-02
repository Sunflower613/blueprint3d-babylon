import { Color3, Material, StandardMaterial, TransformNode } from '../core/babylon.js';
const BABYLON = { Color3, Material, StandardMaterial, TransformNode };
import { createBox, createCylinder, createSphere } from '../core/primitives.js';
import { createBlueprintMaterial } from '../core/materials.js';

/**
 * 根据栅栏 subtype 及其参数，调用 primitives 构建栅栏的 3D 实体组件
 * @param {object} registry 注册表上下文（通常为blueprint3dTestMap实例本身）
 * @param {BABYLON.TransformNode} group 栅栏挂载的父节点
 * @param {object} fence 栅栏数据对象
 * @param {BABYLON.Material} material 默认材质
 * @param {number} length 栅栏长度
 * @param {number} height 栅栏高度
 * @param {number} thickness 栅栏厚度
 */
export function buildFenceGeometry(registry, group, fence, material, length, height, thickness) {
  const subtype = fence.subtype || 'picket_wood';
  const scene = registry.scene;
  const skipStartPost = !!fence.skipStartPost;
  const skipEndPost = !!fence.skipEndPost;

  // 建立一个点击碰撞箱代理长方体 (pick_proxy)，防止射线穿过空隙 (NEW)
  const proxyThickness = Math.max(0.12, thickness * 1.2);
  const proxy = createBox(registry, `fence_pick_proxy_${fence.id}`, {
    width: length,
    height: height,
    depth: proxyThickness
  }, {
    position: { x: 0, y: height / 2, z: 0 }
  }, {
    parent: group
  });
  proxy.visibility = 0; // 完全透明但可被 pick
  proxy.isPickable = true;

  // 1. 创建几种辅助材质，使不同风格的栅栏拥有更高级的视觉效果 (WOW)
  const defaults = {
    picket_wood: { color: '#8d6e63', frame: '#8d6e63', panel: '#8d6e63' },
    iron_ornamental: { color: '#212121', frame: '#212121', panel: '#212121' },
    wire_mesh: { color: '#b0bec5', frame: '#b0bec5', panel: '#b0bec5' },
    stone_masonry: { color: '#cfd8dc', frame: '#cfd8dc', panel: '#212121' },
    bamboo: { color: '#558b2f', frame: '#558b2f', panel: '#558b2f' },
    glass_rail: { color: '#b0bec5', frame: '#b0bec5', panel: '#80deea' },
    concrete: { color: '#f9fbff', frame: '#f9fbff', panel: '#f9fbff' },
    rope: { color: '#8d6e63', frame: '#8d6e63', panel: '#3e2723' }
  };
  const subtypeDefaults = defaults[subtype] || defaults.picket_wood;

  const frameMatDesc = fence.frameMaterial || fence.frameColor || material || fence.color || subtypeDefaults.frame;
  const frameMaterial = createBlueprintMaterial(scene, `fence_${fence.id}_frame_mat`, frameMatDesc, {
    fallbackColor: fence.frameColor || fence.color || subtypeDefaults.frame,
    flatShading: false
  });

  const panelMatDesc = fence.panelMaterial || fence.panelColor || material || fence.color || subtypeDefaults.panel;
  const panelMaterial = createBlueprintMaterial(scene, `fence_${fence.id}_panel_mat`, panelMatDesc, {
    fallbackColor: fence.panelColor || fence.color || subtypeDefaults.panel,
    flatShading: false
  });

  if (subtype === 'glass_rail') {
    panelMaterial.alpha = 0.4;
    panelMaterial.backFaceCulling = false;
  }

  const goldMaterial = new BABYLON.StandardMaterial(`fence_gold_mat_${fence.id}`, scene);
  goldMaterial.diffuseColor = BABYLON.Color3.FromHexString('#ffd700');
  goldMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');
  goldMaterial.roughness = 0.2;

  const ropeMaterial = new BABYLON.StandardMaterial(`fence_rope_mat_${fence.id}`, scene);
  ropeMaterial.diffuseColor = BABYLON.Color3.FromHexString('#3e2723');

  if (subtype === 'picket_wood') {
    // ==========================================
    // 1. 竖板木栅栏 (picket_wood)
    // ==========================================
    const postWidth = thickness * 1.2;
    const postHeight = height * 1.05;
    
    // 两端粗木立柱
    if (!skipStartPost) {
      const postStart = createBox(registry, `post_start_${fence.id}`, {
        width: postWidth,
        height: postHeight,
        depth: postWidth
      }, {
        position: { x: -length / 2, y: postHeight / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postStart.metadata = { blueprintFenceComponentId: 'frame' };
    }

    if (!skipEndPost) {
      const postEnd = createBox(registry, `post_end_${fence.id}`, {
        width: postWidth,
        height: postHeight,
        depth: postWidth
      }, {
        position: { x: length / 2, y: postHeight / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postEnd.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 两根横向拉梁 (高 0.25 * height 和 0.75 * height)
    const railHeight = 0.05;
    const railThickness = thickness * 0.4;
    const activeStartPostWidth = skipStartPost ? 0 : postWidth;
    const activeEndPostWidth = skipEndPost ? 0 : postWidth;
    const totalRailOffset = (activeStartPostWidth + activeEndPostWidth) / 2;
    const railWidth = length - totalRailOffset;
    const railX = (activeStartPostWidth - activeEndPostWidth) / 4;

    const railBottom = createBox(registry, `rail_bottom_${fence.id}`, {
      width: railWidth,
      height: railHeight,
      depth: railThickness
    }, {
      position: { x: railX, y: height * 0.25, z: 0 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railBottom.metadata = { blueprintFenceComponentId: 'frame' };

    const railTop = createBox(registry, `rail_top_${fence.id}`, {
      width: railWidth,
      height: railHeight,
      depth: railThickness
    }, {
      position: { x: railX, y: height * 0.75, z: 0 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railTop.metadata = { blueprintFenceComponentId: 'frame' };

    // 垂直尖顶木板，每隔 0.25 米排一块
    const picketSpacing = 0.22;
    const totalPicketOffset = activeStartPostWidth + activeEndPostWidth;
    const activeLen = length - totalPicketOffset;
    const count = Math.max(1, Math.round(activeLen / picketSpacing));
    const picketXOffset = (activeStartPostWidth - activeEndPostWidth) / 4;
    const startX = picketXOffset - (count - 1) * picketSpacing / 2;
    
    for (let i = 0; i < count; i++) {
      const curX = startX + i * picketSpacing;
      // 木板主身
      const picket = createBox(registry, `picket_${fence.id}_${i}`, {
        width: 0.08,
        height: height * 0.9,
        depth: 0.02
      }, {
        position: { x: curX, y: (height * 0.9) / 2, z: railThickness / 2 + 0.01 }
      }, {
        material: panelMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      picket.metadata = { blueprintFenceComponentId: 'panel' };

      // 尖顶部分 (旋转 45 度的正方体拼接)
      const picketTop = createBox(registry, `picket_top_${fence.id}_${i}`, {
        width: 0.057,
        height: 0.057,
        depth: 0.02
      }, {
        position: { x: curX, y: height * 0.9 + 0.02, z: railThickness / 2 + 0.01 },
        rotation: { z: Math.PI / 4 }
      }, {
        material: panelMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      picketTop.metadata = { blueprintFenceComponentId: 'panel' };
    }

  } else if (subtype === 'iron_ornamental') {
    // ==========================================
    // 2. 铁艺栏杆 (iron_ornamental)
    // ==========================================
    const postWidth = 0.06;
    const postHeight = height * 1.1;
    
    // 黑色两端金属立柱
    if (!skipStartPost) {
      const postStart = createBox(registry, `post_start_${fence.id}`, {
        width: postWidth,
        height: postHeight,
        depth: postWidth
      }, {
        position: { x: -length / 2, y: postHeight / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postStart.metadata = { blueprintFenceComponentId: 'frame' };
    }

    if (!skipEndPost) {
      const postEnd = createBox(registry, `post_end_${fence.id}`, {
        width: postWidth,
        height: postHeight,
        depth: postWidth
      }, {
        position: { x: length / 2, y: postHeight / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postEnd.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 两根横向拉铁条
    const railBottom = createBox(registry, `rail_bottom_${fence.id}`, {
      width: length - postWidth,
      height: 0.02,
      depth: 0.02
    }, {
      position: { x: 0, y: height * 0.15, z: 0 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railBottom.metadata = { blueprintFenceComponentId: 'frame' };

    const railTop = createBox(registry, `rail_top_${fence.id}`, {
      width: length - postWidth,
      height: 0.02,
      depth: 0.02
    }, {
      position: { x: 0, y: height * 0.85, z: 0 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railTop.metadata = { blueprintFenceComponentId: 'frame' };

    // 细竖杆与金色枪尖，每隔 0.15 米排一根
    const spacing = 0.15;
    const count = Math.max(1, Math.floor((length - postWidth * 2) / spacing));
    const startX = -(count - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const curX = startX + i * spacing;
      // 竖细圆柱
      const bar = createCylinder(registry, `bar_${fence.id}_${i}`, {
        diameterTop: 0.016,
        diameterBottom: 0.016,
        height: height * 0.95
      }, {
        position: { x: curX, y: (height * 0.95) / 2, z: 0 }
      }, {
        material: panelMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      bar.metadata = { blueprintFenceComponentId: 'panel' };

      // 金色枪尖球
      const spearBall = createSphere(registry, `spear_ball_${fence.id}_${i}`, {
        diameter: 0.03,
        segments: 8
      }, {
        position: { x: curX, y: height * 0.95, z: 0 }
      }, {
        material: goldMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      spearBall.metadata = { blueprintFenceComponentId: 'panel' };

      // 金色尖锥
      const spearPoint = createCylinder(registry, `spear_point_${fence.id}_${i}`, {
        diameterTop: 0.001,
        diameterBottom: 0.016,
        height: 0.06,
        tessellation: 4
      }, {
        position: { x: curX, y: height * 0.95 + 0.03, z: 0 }
      }, {
        material: goldMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      spearPoint.metadata = { blueprintFenceComponentId: 'panel' };
    }

  } else if (subtype === 'wire_mesh') {
    // ==========================================
    // 3. 铁丝网 (wire_mesh)
    // ==========================================
    const postRadius = 0.03;
    
    // 两端不锈钢立柱
    if (!skipStartPost) {
      const postStart = createCylinder(registry, `post_start_${fence.id}`, {
        diameterTop: postRadius * 2,
        diameterBottom: postRadius * 2,
        height: height
      }, {
        position: { x: -length / 2, y: height / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postStart.metadata = { blueprintFenceComponentId: 'frame' };
    }

    if (!skipEndPost) {
      const postEnd = createCylinder(registry, `post_end_${fence.id}`, {
        diameterTop: postRadius * 2,
        diameterBottom: postRadius * 2,
        height: height
      }, {
        position: { x: length / 2, y: height / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postEnd.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 顶底两根钢管拉梁
    const railBottom = createCylinder(registry, `rail_bottom_${fence.id}`, {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: length - postRadius * 2
    }, {
      position: { x: 0, y: height * 0.08, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railBottom.metadata = { blueprintFenceComponentId: 'frame' };

    const railTop = createCylinder(registry, `rail_top_${fence.id}`, {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: length - postRadius * 2
    }, {
      position: { x: 0, y: height * 0.92, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railTop.metadata = { blueprintFenceComponentId: 'frame' };

    // 细网格斜拉线 (每隔 0.1414 米放置正反两条交叉斜圆柱，边长10cm的正方形网格，水平间距 = 0.1 * sqrt(2) = 0.1414)
    const gridSpacing = 0.141421356;
    const activeLen = length - postRadius * 4;
    const xMin = -length / 2 + postRadius * 2;
    const xMax = length / 2 - postRadius * 2;
    const gridHeight = height * 0.84;
    const gridCenterY = height / 2;
    
    const totalW = activeLen + gridHeight;
    const meshCount = Math.ceil(totalW / gridSpacing) + 1;
    const startX = -(meshCount - 1) * gridSpacing / 2;

    for (let i = 0; i < meshCount; i++) {
      const curX = startX + i * gridSpacing;

      // 1. 正斜线裁切 (斜率 +1, 旋转角 -45度)
      const xStartPos = Math.max(xMin, curX - gridHeight / 2);
      const xEndPos = Math.min(xMax, curX + gridHeight / 2);
      if (xStartPos < xEndPos - 0.001) {
        const p1y = xStartPos - curX + gridCenterY;
        const p2y = xEndPos - curX + gridCenterY;
        const segLen = (xEndPos - xStartPos) * 1.41421356;
        const rodPos = createCylinder(registry, `rod_pos_${fence.id}_${i}`, {
          diameterTop: 0.006,
          diameterBottom: 0.006,
          height: segLen
        }, {
          position: { x: (xStartPos + xEndPos) / 2, y: (p1y + p2y) / 2, z: 0.005 },
          rotation: { z: -Math.PI / 4 }
        }, {
          material: panelMaterial,
          parent: group,
          receiveShadows: false,
          shadowCaster: false
        });
        rodPos.metadata = { blueprintFenceComponentId: 'panel' };
      }

      // 2. 反斜线裁切 (斜率 -1, 旋转角 +45度)
      const xStartNeg = Math.max(xMin, curX - gridHeight / 2);
      const xEndNeg = Math.min(xMax, curX + gridHeight / 2);
      if (xStartNeg < xEndNeg - 0.001) {
        const p1y = -xStartNeg + curX + gridCenterY;
        const p2y = -xEndNeg + curX + gridCenterY;
        const segLen = (xEndNeg - xStartNeg) * 1.41421356;
        const rodNeg = createCylinder(registry, `rod_neg_${fence.id}_${i}`, {
          diameterTop: 0.006,
          diameterBottom: 0.006,
          height: segLen
        }, {
          position: { x: (xStartNeg + xEndNeg) / 2, y: (p1y + p2y) / 2, z: -0.005 },
          rotation: { z: Math.PI / 4 }
        }, {
          material: panelMaterial,
          parent: group,
          receiveShadows: false,
          shadowCaster: false
        });
        rodNeg.metadata = { blueprintFenceComponentId: 'panel' };
      }
    }

  } else if (subtype === 'stone_masonry') {
    // ==========================================
    // 4. 石砌矮墙 (stone_masonry)
    // ==========================================
    const wallH = height * 0.55;
    const wallW = thickness * 1.5;

    // 石砌矮基座
    const baseWall = createBox(registry, `base_wall_${fence.id}`, {
      width: length,
      height: wallH,
      depth: wallW
    }, {
      position: { x: 0, y: wallH / 2, z: 0 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    baseWall.metadata = { blueprintFenceComponentId: 'frame' };

    // 石头方柱与铁拉梁，每隔 0.8 米排一根石柱
    const pillarSpacing = 0.8;
    const count = Math.max(2, Math.round(length / pillarSpacing) + 1);
    const stepX = length / (count - 1);
    const pWidth = thickness * 1.8;
    const pHeight = height * 0.45;

    for (let i = 0; i < count; i++) {
      const curX = -length / 2 + i * stepX;
      // 方石柱
      const pillar = createBox(registry, `pillar_${fence.id}_${i}`, {
        width: pWidth,
        height: pHeight + 0.04,
        depth: pWidth
      }, {
        position: { x: curX, y: wallH + pHeight / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      pillar.metadata = { blueprintFenceComponentId: 'frame' };

      // 柱顶石球
      const pillarBall = createSphere(registry, `pillar_ball_${fence.id}_${i}`, {
        diameter: pWidth * 0.72
      }, {
        position: { x: curX, y: wallH + pHeight + 0.04 + (pWidth * 0.36), z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      pillarBall.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 在石柱中间拉黑铁梁
    for (let i = 0; i < count - 1; i++) {
      const curX = -length / 2 + i * stepX + stepX / 2;
      const spanW = stepX - pWidth;
      if (spanW > 0.05) {
        // 下拉条
        const ironRailB = createBox(registry, `iron_rail_b_${fence.id}_${i}`, {
          width: spanW,
          height: 0.02,
          depth: 0.02
        }, {
          position: { x: curX, y: wallH + pHeight * 0.25, z: 0 }
        }, {
          material: panelMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
        ironRailB.metadata = { blueprintFenceComponentId: 'panel' };

        // 上拉条
        const ironRailT = createBox(registry, `iron_rail_t_${fence.id}_${i}`, {
          width: spanW,
          height: 0.02,
          depth: 0.02
        }, {
          position: { x: curX, y: wallH + pHeight * 0.75, z: 0 }
        }, {
          material: panelMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
        ironRailT.metadata = { blueprintFenceComponentId: 'panel' };
        
        // 中间画一些简单的细金属线条装饰
        const innerCount = Math.max(1, Math.floor(spanW / 0.15));
        const innerStep = spanW / (innerCount + 1);
        for (let j = 1; j <= innerCount; j++) {
          const innerX = -length / 2 + i * stepX + pWidth / 2 + j * innerStep;
          const ironPicket = createBox(registry, `iron_picket_${fence.id}_${i}_${j}`, {
            width: 0.015,
            height: pHeight * 0.6,
            depth: 0.015
          }, {
            position: { x: innerX, y: wallH + pHeight * 0.5, z: 0 }
          }, {
            material: panelMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
          ironPicket.metadata = { blueprintFenceComponentId: 'panel' };
        }
      }
    }

  } else if (subtype === 'bamboo') {
    // ==========================================
    // 5. 竹制篱笆 (bamboo)
    // ==========================================
    const mainBambooRad = 0.016;

    // 两端较粗的支撑立竹
    if (!skipStartPost) {
      const postStart = createCylinder(registry, `post_start_${fence.id}`, {
        diameterTop: mainBambooRad * 2.2,
        diameterBottom: mainBambooRad * 2.2,
        height: height * 1.05
      }, {
        position: { x: -length / 2, y: (height * 1.05) / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postStart.metadata = { blueprintFenceComponentId: 'frame' };
    }

    if (!skipEndPost) {
      const postEnd = createCylinder(registry, `post_end_${fence.id}`, {
        diameterTop: mainBambooRad * 2.2,
        diameterBottom: mainBambooRad * 2.2,
        height: height * 1.05
      }, {
        position: { x: length / 2, y: (height * 1.05) / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postEnd.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 3根横向主干竹子
    const activeLen = length - mainBambooRad * 4;
    const railB = createCylinder(registry, `rail_b_${fence.id}`, {
      diameterTop: mainBambooRad * 1.8,
      diameterBottom: mainBambooRad * 1.8,
      height: activeLen
    }, {
      position: { x: 0, y: height * 0.2, z: 0.01 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railB.metadata = { blueprintFenceComponentId: 'frame' };

    const railM = createCylinder(registry, `rail_m_${fence.id}`, {
      diameterTop: mainBambooRad * 1.8,
      diameterBottom: mainBambooRad * 1.8,
      height: activeLen
    }, {
      position: { x: 0, y: height * 0.5, z: -0.01 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railM.metadata = { blueprintFenceComponentId: 'frame' };

    const railT = createCylinder(registry, `rail_t_${fence.id}`, {
      diameterTop: mainBambooRad * 1.8,
      diameterBottom: mainBambooRad * 1.8,
      height: activeLen
    }, {
      position: { x: 0, y: height * 0.8, z: 0.01 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    railT.metadata = { blueprintFenceComponentId: 'frame' };

    // 高密细竹竿 (间隔 0.07 米，高度微倾斜以实现手工艺感)
    const spacing = 0.075;
    const bambooCount = Math.max(1, Math.floor(activeLen / spacing));
    const startX = -(bambooCount - 1) * spacing / 2;

    for (let i = 0; i < bambooCount; i++) {
      const curX = startX + i * spacing;
      // 随机倾斜度数 (-2 到 2 度)
      const angle = ((i % 5) - 2) * 1.2 * Math.PI / 180;
      // 高度微调
      const randH = height * (0.94 + Math.abs((i % 7) - 3) * 0.02);

      const bambooVertical = createCylinder(registry, `bamboo_vertical_${fence.id}_${i}`, {
        diameterTop: 0.012,
        diameterBottom: 0.012,
        height: randH
      }, {
        position: { x: curX, y: randH / 2, z: 0 },
        rotation: { z: angle }
      }, {
        material: panelMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      bambooVertical.metadata = { blueprintFenceComponentId: 'panel' };

      // 交叉点绳子缠绕：在中部横梁交接处放置一个扁圆盘模拟绳缚
      if (i % 2 === 0) {
        const ropeKnot = createCylinder(registry, `rope_knot_${fence.id}_${i}`, {
          diameterTop: 0.022,
          diameterBottom: 0.022,
          height: 0.015
        }, {
          position: { x: curX, y: height * 0.5, z: 0 },
          rotation: { x: Math.PI / 2 }
        }, {
          material: ropeMaterial,
          parent: group
        });
        ropeKnot.metadata = { blueprintFenceComponentId: 'panel' };
      }
    }

  } else if (subtype === 'glass_rail') {
    // ==========================================
    // 6. 玻璃护栏 (glass_rail)
    // ==========================================
    const postSpacing = 1.1; // 约 1.1 米一根立柱
    const count = Math.max(2, Math.round(length / postSpacing) + 1);
    const stepX = length / (count - 1);
    const postRad = 0.022;

    // 1. 放置精致的不锈钢立柱
    for (let i = 0; i < count; i++) {
      const curX = -length / 2 + i * stepX;
      const steelPost = createCylinder(registry, `steel_post_${fence.id}_${i}`, {
        diameterTop: postRad * 2,
        diameterBottom: postRad * 2,
        height: height
      }, {
        position: { x: curX, y: height / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      steelPost.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 2. 放置顶部的握持钢管扶手
    const steelHandrail = createCylinder(registry, `steel_handrail_${fence.id}`, {
      diameterTop: 0.036,
      diameterBottom: 0.036,
      height: length
    }, {
      position: { x: 0, y: height + 0.018, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: frameMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    steelHandrail.metadata = { blueprintFenceComponentId: 'frame' };

    // 3. 放置夹持半透明蓝色钢化玻璃板和金属配件
    for (let i = 0; i < count - 1; i++) {
      const curX = -length / 2 + i * stepX + stepX / 2;
      const glassW = stepX - postRad * 4;
      const glassH = height * 0.8;
      
      if (glassW > 0.1) {
        // 半透明玻璃板
        const glassPanel = createBox(registry, `glass_panel_${fence.id}_${i}`, {
          width: glassW,
          height: glassH,
          depth: 0.012
        }, {
          position: { x: curX, y: height * 0.46, z: 0 }
        }, {
          material: panelMaterial,
          parent: group,
          receiveShadows: false,
          shadowCaster: false
        });
        glassPanel.metadata = { blueprintFenceComponentId: 'panel' };

        // 左右两端的夹扣 (小 box)
        const leftClipX = -length / 2 + i * stepX + postRad + 0.02;
        const rightClipX = -length / 2 + (i + 1) * stepX - postRad - 0.02;

        const clipY1 = height * 0.22;
        const clipY2 = height * 0.7;

        // 夹子 Box 定义
        [clipY1, clipY2].forEach((clipY, idx) => {
          [leftClipX, rightClipX].forEach((clipX, sideIdx) => {
            const glassClip = createBox(registry, `glass_clip_${fence.id}_${i}_${idx}_${sideIdx}`, {
              width: 0.035,
              height: 0.035,
              depth: 0.028
            }, {
              position: { x: clipX, y: clipY, z: 0 }
            }, {
              material: frameMaterial,
              parent: group
            });
            glassClip.metadata = { blueprintFenceComponentId: 'frame' };
          });
        });
      }
    }
  } else if (subtype === 'concrete') {
    // ==========================================
    // 7. 混凝土矮墙 (concrete)
    // ==========================================
    const concreteBody = createBox(registry, `concrete_body_${fence.id}`, {
      width: length,
      height: height,
      depth: thickness
    }, {
      position: { x: 0, y: height / 2, z: 0 }
    }, {
      material: panelMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    concreteBody.metadata = { blueprintFenceComponentId: 'panel' };
  } else if (subtype === 'rope') {
    // ==========================================
    // 8. 绳索栅栏 (rope)
    // ==========================================
    const postRad = 0.04;
    
    // 1. 左右两个木立柱与圆木帽
    if (!skipStartPost) {
      const postStart = createCylinder(registry, `post_start_${fence.id}`, {
        diameterTop: postRad * 2,
        diameterBottom: postRad * 2,
        height: height * 1.05
      }, {
        position: { x: -length / 2, y: (height * 1.05) / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postStart.metadata = { blueprintFenceComponentId: 'frame' };

      const postStartCap = createSphere(registry, `post_start_cap_${fence.id}`, {
        diameter: postRad * 2.2
      }, {
        position: { x: -length / 2, y: height * 1.05, z: 0 }
      }, {
        material: frameMaterial,
        parent: group
      });
      postStartCap.metadata = { blueprintFenceComponentId: 'frame' };
    }

    if (!skipEndPost) {
      const postEnd = createCylinder(registry, `post_end_${fence.id}`, {
        diameterTop: postRad * 2,
        diameterBottom: postRad * 2,
        height: height * 1.05
      }, {
        position: { x: length / 2, y: (height * 1.05) / 2, z: 0 }
      }, {
        material: frameMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      postEnd.metadata = { blueprintFenceComponentId: 'frame' };

      const postEndCap = createSphere(registry, `post_end_cap_${fence.id}`, {
        diameter: postRad * 2.2
      }, {
        position: { x: length / 2, y: height * 1.05, z: 0 }
      }, {
        material: frameMaterial,
        parent: group
      });
      postEndCap.metadata = { blueprintFenceComponentId: 'frame' };
    }

    // 2. 三根下垂绳索
    const ropeHeights = [height * 0.25, height * 0.55, height * 0.85];
    const segments = 8;
    const sag = 0.05; // 抛物线下垂深度

    ropeHeights.forEach((ropeH, hIdx) => {
      const points = [];
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const x = -length / 2 + t * length;
        const dy = -sag * 4 * t * (1 - t);
        points.push({ x, y: ropeH + dy });
      }

      for (let j = 0; j < segments; j++) {
        const p1 = points[j];
        const p2 = points[j + 1];
        const dx_seg = p2.x - p1.x;
        const dy_seg = p2.y - p1.y;
        const segLen = Math.sqrt(dx_seg * dx_seg + dy_seg * dy_seg);
        const segAngle = Math.atan2(dy_seg, dx_seg);
        
        const ropeSeg = createCylinder(registry, `rope_seg_${fence.id}_${hIdx}_${j}`, {
          diameterTop: 0.016,
          diameterBottom: 0.016,
          height: segLen
        }, {
          position: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: 0 },
          rotation: { z: segAngle - Math.PI / 2 }
        }, {
          material: panelMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
        ropeSeg.metadata = { blueprintFenceComponentId: 'panel' };
      }
    });
  }

  // 后处理：如果栅栏存在倾角(tilt)，将所有垂直构件的局部Z轴旋转抵消该倾角，使其保持直立状态 (NEW)
  const tilt = fence.tilt || 0;
  if (tilt !== 0) {
    group.getChildMeshes().forEach(mesh => {
      const name = mesh.name.toLowerCase();
      const isVertical = name.includes('post') ||
                         name.includes('picket') ||
                         name.includes('bar') ||
                         name.includes('spear') ||
                         name.includes('pillar') ||
                         name.includes('knot') ||
                         name.includes('clip');
      if (isVertical) {
        mesh.rotation.z = (mesh.rotation.z || 0) - tilt;
      }
    });
  }

  // 保证所有构件都是可点击的（供 3D 粉刷精确点中）
  group.getChildMeshes().forEach(mesh => {
    mesh.isPickable = true;
  });
}
