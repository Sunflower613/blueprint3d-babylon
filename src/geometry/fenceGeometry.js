import * as BABYLON from '@babylonjs/core';
import { createBox, createCylinder, createSphere } from '../core/primitives.js';

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

  // 1. 创建几种辅助材质，使不同风格的栅栏拥有更高级的视觉效果 (WOW)
  const ironMaterial = new BABYLON.StandardMaterial(`fence_iron_mat_${fence.id}`, scene);
  ironMaterial.diffuseColor = BABYLON.Color3.FromHexString('#212121');
  ironMaterial.specularColor = BABYLON.Color3.FromHexString('#333333');

  const goldMaterial = new BABYLON.StandardMaterial(`fence_gold_mat_${fence.id}`, scene);
  goldMaterial.diffuseColor = BABYLON.Color3.FromHexString('#ffd700');
  goldMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');
  goldMaterial.roughness = 0.2;

  const glassMaterial = new BABYLON.StandardMaterial(`fence_glass_mat_${fence.id}`, scene);
  glassMaterial.diffuseColor = BABYLON.Color3.FromHexString('#80deea');
  glassMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');
  glassMaterial.alpha = 0.4;
  glassMaterial.backFaceCulling = false;

  const steelMaterial = new BABYLON.StandardMaterial(`fence_steel_mat_${fence.id}`, scene);
  steelMaterial.diffuseColor = BABYLON.Color3.FromHexString('#b0bec5');
  steelMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');

  const stoneMaterial = new BABYLON.StandardMaterial(`fence_stone_mat_${fence.id}`, scene);
  stoneMaterial.diffuseColor = BABYLON.Color3.FromHexString('#cfd8dc');
  stoneMaterial.specularColor = BABYLON.Color3.FromHexString('#111111');

  const ropeMaterial = new BABYLON.StandardMaterial(`fence_rope_mat_${fence.id}`, scene);
  ropeMaterial.diffuseColor = BABYLON.Color3.FromHexString('#3e2723');

  if (subtype === 'picket_wood') {
    // ==========================================
    // 1. 竖板木栅栏 (picket_wood)
    // ==========================================
    const postWidth = thickness * 1.2;
    const postHeight = height * 1.05;
    
    // 两端粗木立柱
    createBox(registry, `post_start_${fence.id}`, {
      width: postWidth,
      height: postHeight,
      depth: postWidth
    }, {
      position: { x: -length / 2, y: postHeight / 2, z: 0 }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createBox(registry, `post_end_${fence.id}`, {
      width: postWidth,
      height: postHeight,
      depth: postWidth
    }, {
      position: { x: length / 2, y: postHeight / 2, z: 0 }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 两根横向拉梁 (高 0.25 * height 和 0.75 * height)
    const railHeight = 0.05;
    const railThickness = thickness * 0.4;
    createBox(registry, `rail_bottom_${fence.id}`, {
      width: length - postWidth,
      height: railHeight,
      depth: railThickness
    }, {
      position: { x: 0, y: height * 0.25, z: 0 }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createBox(registry, `rail_top_${fence.id}`, {
      width: length - postWidth,
      height: railHeight,
      depth: railThickness
    }, {
      position: { x: 0, y: height * 0.75, z: 0 }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 垂直尖顶木板，每隔 0.25 米排一块
    const picketSpacing = 0.22;
    const count = Math.max(1, Math.floor((length - postWidth * 2) / picketSpacing));
    const startX = -(count - 1) * picketSpacing / 2;
    
    for (let i = 0; i < count; i++) {
      const curX = startX + i * picketSpacing;
      // 木板主身
      createBox(registry, `picket_${fence.id}_${i}`, {
        width: 0.08,
        height: height * 0.9,
        depth: 0.02
      }, {
        position: { x: curX, y: (height * 0.9) / 2, z: railThickness / 2 + 0.01 }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
      // 尖顶部分 (旋转 45 度的正方体拼接)
      createBox(registry, `picket_top_${fence.id}_${i}`, {
        width: 0.057,
        height: 0.057,
        depth: 0.02
      }, {
        position: { x: curX, y: height * 0.9 + 0.02, z: railThickness / 2 + 0.01 },
        rotation: { z: Math.PI / 4 }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

  } else if (subtype === 'iron_ornamental') {
    // ==========================================
    // 2. 铁艺栏杆 (iron_ornamental)
    // ==========================================
    const postWidth = 0.06;
    const postHeight = height * 1.1;
    
    // 黑色两端金属立柱
    createBox(registry, `post_start_${fence.id}`, {
      width: postWidth,
      height: postHeight,
      depth: postWidth
    }, {
      position: { x: -length / 2, y: postHeight / 2, z: 0 }
    }, {
      material: ironMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createBox(registry, `post_end_${fence.id}`, {
      width: postWidth,
      height: postHeight,
      depth: postWidth
    }, {
      position: { x: length / 2, y: postHeight / 2, z: 0 }
    }, {
      material: ironMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 两根横向拉铁条
    createBox(registry, `rail_bottom_${fence.id}`, {
      width: length - postWidth,
      height: 0.02,
      depth: 0.02
    }, {
      position: { x: 0, y: height * 0.15, z: 0 }
    }, {
      material: ironMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createBox(registry, `rail_top_${fence.id}`, {
      width: length - postWidth,
      height: 0.02,
      depth: 0.02
    }, {
      position: { x: 0, y: height * 0.85, z: 0 }
    }, {
      material: ironMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 细竖杆与金色枪尖，每隔 0.15 米排一根
    const spacing = 0.15;
    const count = Math.max(1, Math.floor((length - postWidth * 2) / spacing));
    const startX = -(count - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const curX = startX + i * spacing;
      // 竖细圆柱
      createCylinder(registry, `bar_${fence.id}_${i}`, {
        diameterTop: 0.016,
        diameterBottom: 0.016,
        height: height * 0.95
      }, {
        position: { x: curX, y: (height * 0.95) / 2, z: 0 }
      }, {
        material: ironMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 金色枪尖球
      createSphere(registry, `spear_ball_${fence.id}_${i}`, {
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

      // 金色尖锥
      createCylinder(registry, `spear_point_${fence.id}_${i}`, {
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
    }

  } else if (subtype === 'wire_mesh') {
    // ==========================================
    // 3. 铁丝网 (wire_mesh)
    // ==========================================
    const postRadius = 0.03;
    
    // 两端不锈钢立柱
    createCylinder(registry, `post_start_${fence.id}`, {
      diameterTop: postRadius * 2,
      diameterBottom: postRadius * 2,
      height: height
    }, {
      position: { x: -length / 2, y: height / 2, z: 0 }
    }, {
      material: steelMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createCylinder(registry, `post_end_${fence.id}`, {
      diameterTop: postRadius * 2,
      diameterBottom: postRadius * 2,
      height: height
    }, {
      position: { x: length / 2, y: height / 2, z: 0 }
    }, {
      material: steelMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 顶底两根钢管拉梁
    createCylinder(registry, `rail_bottom_${fence.id}`, {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: length - postRadius * 2
    }, {
      position: { x: 0, y: height * 0.08, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: steelMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createCylinder(registry, `rail_top_${fence.id}`, {
      diameterTop: 0.02,
      diameterBottom: 0.02,
      height: length - postRadius * 2
    }, {
      position: { x: 0, y: height * 0.92, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: steelMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 细网格斜拉线 (每隔 0.2 米放置正反两条交叉斜圆柱)
    const gridSpacing = 0.22;
    const activeLen = length - postRadius * 4;
    const meshCount = Math.max(1, Math.floor(activeLen / gridSpacing));
    const startX = -(meshCount - 1) * gridSpacing / 2;
    const gridHeight = height * 0.84;
    const gridCenterY = height / 2;
    
    // 斜杆长度
    const rodLen = Math.sqrt(gridSpacing * gridSpacing + gridHeight * gridHeight);
    const rodAngle = Math.atan2(gridHeight, gridSpacing);

    for (let i = 0; i < meshCount; i++) {
      const curX = startX + i * gridSpacing;
      // 正斜
      createCylinder(registry, `rod_pos_${fence.id}_${i}`, {
        diameterTop: 0.006,
        diameterBottom: 0.006,
        height: rodLen
      }, {
        position: { x: curX, y: gridCenterY, z: 0.005 },
        rotation: { z: -rodAngle }
      }, {
        material: steelMaterial,
        parent: group,
        receiveShadows: false,
        shadowCaster: false
      });
      // 反斜
      createCylinder(registry, `rod_neg_${fence.id}_${i}`, {
        diameterTop: 0.006,
        diameterBottom: 0.006,
        height: rodLen
      }, {
        position: { x: curX, y: gridCenterY, z: -0.005 },
        rotation: { z: rodAngle }
      }, {
        material: steelMaterial,
        parent: group,
        receiveShadows: false,
        shadowCaster: false
      });
    }

  } else if (subtype === 'stone_masonry') {
    // ==========================================
    // 4. 石砌矮墙 (stone_masonry)
    // ==========================================
    const wallH = height * 0.55;
    const wallW = thickness * 1.5;

    // 石砌矮基座
    createBox(registry, `base_wall_${fence.id}`, {
      width: length,
      height: wallH,
      depth: wallW
    }, {
      position: { x: 0, y: wallH / 2, z: 0 }
    }, {
      material: stoneMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 石头方柱与铁拉梁，每隔 0.8 米排一根石柱
    const pillarSpacing = 0.8;
    const count = Math.max(2, Math.round(length / pillarSpacing) + 1);
    const stepX = length / (count - 1);
    const pWidth = thickness * 1.8;
    const pHeight = height * 0.45;

    for (let i = 0; i < count; i++) {
      const curX = -length / 2 + i * stepX;
      // 方石柱
      createBox(registry, `pillar_${fence.id}_${i}`, {
        width: pWidth,
        height: pHeight + 0.04,
        depth: pWidth
      }, {
        position: { x: curX, y: wallH + pHeight / 2, z: 0 }
      }, {
        material: stoneMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 柱顶石球
      createSphere(registry, `pillar_ball_${fence.id}_${i}`, {
        diameter: pWidth * 0.72
      }, {
        position: { x: curX, y: wallH + pHeight + 0.04 + (pWidth * 0.36), z: 0 }
      }, {
        material: stoneMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

    // 在石柱中间拉黑铁梁
    for (let i = 0; i < count - 1; i++) {
      const curX = -length / 2 + i * stepX + stepX / 2;
      const spanW = stepX - pWidth;
      if (spanW > 0.05) {
        // 下拉条
        createBox(registry, `iron_rail_b_${fence.id}_${i}`, {
          width: spanW,
          height: 0.02,
          depth: 0.02
        }, {
          position: { x: curX, y: wallH + pHeight * 0.25, z: 0 }
        }, {
          material: ironMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
        // 上拉条
        createBox(registry, `iron_rail_t_${fence.id}_${i}`, {
          width: spanW,
          height: 0.02,
          depth: 0.02
        }, {
          position: { x: curX, y: wallH + pHeight * 0.75, z: 0 }
        }, {
          material: ironMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
        
        // 中间画一些简单的细金属线条装饰
        const innerCount = Math.max(1, Math.floor(spanW / 0.15));
        const innerStep = spanW / (innerCount + 1);
        for (let j = 1; j <= innerCount; j++) {
          const innerX = -length / 2 + i * stepX + pWidth / 2 + j * innerStep;
          createBox(registry, `iron_picket_${fence.id}_${i}_${j}`, {
            width: 0.015,
            height: pHeight * 0.6,
            depth: 0.015
          }, {
            position: { x: innerX, y: wallH + pHeight * 0.5, z: 0 }
          }, {
            material: ironMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }

  } else if (subtype === 'bamboo') {
    // ==========================================
    // 5. 竹制篱笆 (bamboo)
    // ==========================================
    // 定义天然竹子绿色材质
    const bambooMaterial = new BABYLON.StandardMaterial(`fence_bamboo_mat_${fence.id}`, scene);
    bambooMaterial.diffuseColor = BABYLON.Color3.FromHexString('#558b2f');
    bambooMaterial.specularColor = BABYLON.Color3.FromHexString('#255d00');

    const mainBambooRad = 0.016;

    // 两端较粗的支撑立竹
    createCylinder(registry, `post_start_${fence.id}`, {
      diameterTop: mainBambooRad * 2.2,
      diameterBottom: mainBambooRad * 2.2,
      height: height * 1.05
    }, {
      position: { x: -length / 2, y: (height * 1.05) / 2, z: 0 }
    }, {
      material: bambooMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createCylinder(registry, `post_end_${fence.id}`, {
      diameterTop: mainBambooRad * 2.2,
      diameterBottom: mainBambooRad * 2.2,
      height: height * 1.05
    }, {
      position: { x: length / 2, y: (height * 1.05) / 2, z: 0 }
    }, {
      material: bambooMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 3根横向主干竹子
    const activeLen = length - mainBambooRad * 4;
    createCylinder(registry, `rail_b_${fence.id}`, {
      diameterTop: mainBambooRad * 1.8,
      diameterBottom: mainBambooRad * 1.8,
      height: activeLen
    }, {
      position: { x: 0, y: height * 0.2, z: 0.01 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: bambooMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createCylinder(registry, `rail_m_${fence.id}`, {
      diameterTop: mainBambooRad * 1.8,
      diameterBottom: mainBambooRad * 1.8,
      height: activeLen
    }, {
      position: { x: 0, y: height * 0.5, z: -0.01 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: bambooMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createCylinder(registry, `rail_t_${fence.id}`, {
      diameterTop: mainBambooRad * 1.8,
      diameterBottom: mainBambooRad * 1.8,
      height: activeLen
    }, {
      position: { x: 0, y: height * 0.8, z: 0.01 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: bambooMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

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

      createCylinder(registry, `bamboo_vertical_${fence.id}_${i}`, {
        diameterTop: 0.012,
        diameterBottom: 0.012,
        height: randH
      }, {
        position: { x: curX, y: randH / 2, z: 0 },
        rotation: { z: angle }
      }, {
        material: bambooMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 交叉点绳子缠绕：在中部横梁交接处放置一个扁圆盘模拟绳缚
      if (i % 2 === 0) {
        createCylinder(registry, `rope_knot_${fence.id}_${i}`, {
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
      createCylinder(registry, `steel_post_${fence.id}_${i}`, {
        diameterTop: postRad * 2,
        diameterBottom: postRad * 2,
        height: height
      }, {
        position: { x: curX, y: height / 2, z: 0 }
      }, {
        material: steelMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

    // 2. 放置顶部的握持钢管扶手
    createCylinder(registry, `steel_handrail_${fence.id}`, {
      diameterTop: 0.036,
      diameterBottom: 0.036,
      height: length
    }, {
      position: { x: 0, y: height + 0.018, z: 0 },
      rotation: { z: Math.PI / 2 }
    }, {
      material: steelMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 3. 放置夹持半透明蓝色钢化玻璃板和金属配件
    for (let i = 0; i < count - 1; i++) {
      const curX = -length / 2 + i * stepX + stepX / 2;
      const glassW = stepX - postRad * 4;
      const glassH = height * 0.8;
      
      if (glassW > 0.1) {
        // 半透明玻璃板
        createBox(registry, `glass_panel_${fence.id}_${i}`, {
          width: glassW,
          height: glassH,
          depth: 0.012
        }, {
          position: { x: curX, y: height * 0.46, z: 0 }
        }, {
          material: glassMaterial,
          parent: group,
          receiveShadows: false,
          shadowCaster: false
        });

        // 左右两端的夹扣 (小 box)
        const leftClipX = -length / 2 + i * stepX + postRad + 0.02;
        const rightClipX = -length / 2 + (i + 1) * stepX - postRad - 0.02;

        const clipY1 = height * 0.22;
        const clipY2 = height * 0.7;

        // 夹子 Box 定义
        [clipY1, clipY2].forEach((clipY, idx) => {
          [leftClipX, rightClipX].forEach((clipX, sideIdx) => {
            createBox(registry, `glass_clip_${fence.id}_${i}_${idx}_${sideIdx}`, {
              width: 0.035,
              height: 0.035,
              depth: 0.028
            }, {
              position: { x: clipX, y: clipY, z: 0 }
            }, {
              material: steelMaterial,
              parent: group
            });
          });
        });
      }
    }
  }
}
