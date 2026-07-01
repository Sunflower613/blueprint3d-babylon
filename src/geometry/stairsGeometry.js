import { createBox, createCylinder } from '../core/primitives.js';
import { createBlueprintMaterial } from '../core/materials.js';

/**
 * 根据楼梯类型及参数，调用primitives构建楼梯的三维实体组件
 * @param {object} registry 注册表上下文（通常为blueprintTestMap实例本身）
 * @param {BABYLON.TransformNode} group 楼梯模型挂载的TransformNode父节点
 * @param {object} stairs 楼梯的数据对象
 * @param {BABYLON.Material} material 楼梯主材质（顶面/踏面材质）
 * @param {number} width 宽度
 * @param {number} depth 深度
 * @param {number} height 高度
 * @param {number} steps 踏步数
 */
export function buildStairsGeometry(registry, group, stairs, material, width, depth, height, steps) {
  const subtype = stairs.subtype || 'straight';
  const flipX = stairs.mirrored ? -1 : 1;
  const sideHidden = !!stairs.sideHidden;

  // 创建侧面材质
  let sideMaterial = material;
  if (stairs.sideMaterial || stairs.sideColor) {
    sideMaterial = createBlueprintMaterial(registry.scene, `stairs_${stairs.id}_side_mat`, stairs.sideMaterial || stairs.sideColor || stairs.color || '#d8c0a0', {
      fallbackColor: stairs.sideColor || stairs.color || '#d8c0a0',
      flatShading: false
    });
  }

  if (subtype === 'straight') {
    for (let i = 0; i < steps; i += 1) {
      const stepDepth = depth / steps;
      const stepHeight = height / steps;
      const curStepH = stepHeight * (i + 1);

      // 1. 顶部踏步板
      const treadThickness = Math.min(0.04, stepHeight * 0.5);
      createBox(registry, `stairs_step_tread_${stairs.id}_${i}`, {
        width,
        height: treadThickness,
        depth: stepDepth
      }, {
        position: {
          x: 0,
          y: curStepH - treadThickness / 2,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 2. 侧面底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          createBox(registry, `stairs_step_base_${stairs.id}_${i}`, {
            width,
            height: baseH,
            depth: stepDepth
          }, {
            position: {
              x: 0,
              y: baseH / 2,
              z: -depth / 2 + stepDepth * i + stepDepth / 2
            }
          }, {
            material: sideMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }
  } else if (subtype === 'lshape') {
    const n1 = Math.max(1, Math.min(steps - 2, stairs.cornerStep ?? Math.floor(steps / 2)));
    const n2 = steps - n1;
    const stepHeight = height / steps;
    const landHeight = stepHeight * n1;
    const treadThickness = Math.min(0.04, stepHeight * 0.5);

    // 平台顶板
    createBox(registry, `stairs_land_tread_${stairs.id}`, {
      width: width,
      height: treadThickness,
      depth: width
    }, {
      position: {
        x: 0,
        y: landHeight - treadThickness / 2,
        z: depth / 2 - width / 2
      }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 平台底座
    if (!sideHidden) {
      const baseH = landHeight - treadThickness;
      if (baseH > 0.001) {
        createBox(registry, `stairs_land_base_${stairs.id}`, {
          width: width,
          height: baseH,
          depth: width
        }, {
          position: {
            x: 0,
            y: baseH / 2,
            z: depth / 2 - width / 2
          }
        }, {
          material: sideMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
      }
    }

    // 第一跑踏步 (L1)
    const stepDepth = (depth - width) / n1;
    for (let i = 0; i < n1; i++) {
      const curStepH = stepHeight * (i + 1);
      // 踏面板
      createBox(registry, `stairs_step_l1_tread_${stairs.id}_${i}`, {
        width,
        height: treadThickness,
        depth: stepDepth
      }, {
        position: {
          x: 0,
          y: curStepH - treadThickness / 2,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          createBox(registry, `stairs_step_l1_base_${stairs.id}_${i}`, {
            width,
            height: baseH,
            depth: stepDepth
          }, {
            position: {
              x: 0,
              y: baseH / 2,
              z: -depth / 2 + stepDepth * i + stepDepth / 2
            }
          }, {
            material: sideMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }

    // 第二跑踏步 (L2)
    const stepX = (depth - width) / n2;
    for (let i = 0; i < n2; i++) {
      const curStepH = landHeight + stepHeight * (i + 1);
      // 踏面板
      createBox(registry, `stairs_step_l2_tread_${stairs.id}_${i}`, {
        width: stepX,
        height: treadThickness,
        depth: width
      }, {
        position: {
          x: (width / 2 + stepX * i + stepX / 2) * flipX,
          y: curStepH - treadThickness / 2,
          z: depth / 2 - width / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          createBox(registry, `stairs_step_l2_base_${stairs.id}_${i}`, {
            width: stepX,
            height: baseH,
            depth: width
          }, {
            position: {
              x: (width / 2 + stepX * i + stepX / 2) * flipX,
              y: baseH / 2,
              z: depth / 2 - width / 2
            }
          }, {
            material: sideMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }
  } else if (subtype === 'ushape') {
    const halfSteps = Math.floor(steps / 2);
    const slotW = stairs.uSlotWidth ?? 0.1;
    const voidL = stairs.uVoidLength ?? (depth - 1);
    const wStep = (width - slotW) / 2;
    const landDepth = Math.max(0.4, Math.min(depth - 0.2, depth - voidL));
    const stepHeight = (height / 2) / halfSteps;
    const landHeight = height / 2;
    const treadThickness = Math.min(0.04, stepHeight * 0.5);

    // 平台顶板
    createBox(registry, `stairs_land_tread_${stairs.id}`, {
      width: width,
      height: treadThickness,
      depth: landDepth
    }, {
      position: {
        x: 0,
        y: landHeight - treadThickness / 2,
        z: depth / 2 - landDepth / 2
      }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 平台底座
    if (!sideHidden) {
      const baseH = landHeight - treadThickness;
      if (baseH > 0.001) {
        createBox(registry, `stairs_land_base_${stairs.id}`, {
          width: width,
          height: baseH,
          depth: landDepth
        }, {
          position: {
            x: 0,
            y: baseH / 2,
            z: depth / 2 - landDepth / 2
          }
        }, {
          material: sideMaterial,
          parent: group,
          receiveShadows: true,
          shadowCaster: true
        });
      }
    }

    // 第一跑踏步 (U1)
    const stepDepth = (depth - landDepth) / halfSteps;
    for (let i = 0; i < halfSteps; i++) {
      const curStepH = stepHeight * (i + 1);
      // 踏面板
      createBox(registry, `stairs_step_u1_tread_${stairs.id}_${i}`, {
        width: wStep,
        height: treadThickness,
        depth: stepDepth
      }, {
        position: {
          x: -(wStep / 2 + slotW / 2) * flipX,
          y: curStepH - treadThickness / 2,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          createBox(registry, `stairs_step_u1_base_${stairs.id}_${i}`, {
            width: wStep,
            height: baseH,
            depth: stepDepth
          }, {
            position: {
              x: -(wStep / 2 + slotW / 2) * flipX,
              y: baseH / 2,
              z: -depth / 2 + stepDepth * i + stepDepth / 2
            }
          }, {
            material: sideMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }

    // 第二跑踏步 (U2)
    for (let i = 0; i < halfSteps; i++) {
      const curStepH = landHeight + stepHeight * (i + 1);
      // 踏面板
      createBox(registry, `stairs_step_u2_tread_${stairs.id}_${i}`, {
        width: wStep,
        height: treadThickness,
        depth: stepDepth
      }, {
        position: {
          x: (wStep / 2 + slotW / 2) * flipX,
          y: curStepH - treadThickness / 2,
          z: (depth / 2 - landDepth) - stepDepth * i - stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          createBox(registry, `stairs_step_u2_base_${stairs.id}_${i}`, {
            width: wStep,
            height: baseH,
            depth: stepDepth
          }, {
            position: {
              x: (wStep / 2 + slotW / 2) * flipX,
              y: baseH / 2,
              z: (depth / 2 - landDepth) - stepDepth * i - stepDepth / 2
            }
          }, {
            material: sideMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }
  } else if (subtype === 'spiral') {
    const radius = Math.max(width, depth) / 2;
    
    // 中心柱 (属于侧面)
    if (!sideHidden) {
      createCylinder(registry, `stairs_post_${stairs.id}`, {
        diameterTop: 0.15,
        diameterBottom: 0.15,
        height: height
      }, {
        position: { x: 0, y: height / 2, z: 0 }
      }, {
        material: sideMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

    // 旋转踏板 (属于顶部)
    const totalRad = ((stairs.spiralDegrees ?? 360) * Math.PI) / 180;
    const stepAngle = totalRad / steps;
    for (let i = 0; i < steps; i++) {
      const curY = (height / steps) * i + (height / steps) / 2;
      const angle = i * stepAngle;
      
      createBox(registry, `stairs_step_sp_${stairs.id}_${i}`, {
        width: radius * 0.4,
        height: 0.05,
        depth: radius
      }, {
        position: {
          x: (radius / 2) * Math.sin(angle) * flipX,
          y: curY,
          z: -(radius / 2) * Math.cos(angle)
        },
        rotation: {
          y: -angle * flipX
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }
  } else if (subtype === 'curved') {
    const outerR = depth;
    const innerR = depth - width;
    const centerR = (outerR + innerR) / 2;
    const totalRad = ((stairs.spiralDegrees ?? 90) * Math.PI) / 180;
    const stepAngle = totalRad / steps;
    const stepHeight = height / steps;
    const treadThickness = Math.min(0.04, stepHeight * 0.5);
    
    for (let i = 0; i < steps; i++) {
      const angle = i * stepAngle + stepAngle / 2;
      const curStepH = stepHeight * (i + 1);
      const stepW = width;
      const stepD = (outerR * totalRad) / steps;
      
      // 踏面板
      createBox(registry, `stairs_step_cv_tread_${stairs.id}_${i}`, {
        width: stepD,
        height: treadThickness,
        depth: stepW
      }, {
        position: {
          x: (-width / 2 + centerR * Math.sin(angle)) * flipX,
          y: curStepH - treadThickness / 2,
          z: -depth / 2 + centerR * Math.cos(angle)
        },
        rotation: {
          y: angle * flipX
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          createBox(registry, `stairs_step_cv_base_${stairs.id}_${i}`, {
            width: stepD,
            height: baseH,
            depth: stepW
          }, {
            position: {
              x: (-width / 2 + centerR * Math.sin(angle)) * flipX,
              y: baseH / 2,
              z: -depth / 2 + centerR * Math.cos(angle)
            },
            rotation: {
              y: angle * flipX
            }
          }, {
            material: sideMaterial,
            parent: group,
            receiveShadows: true,
            shadowCaster: true
          });
        }
      }
    }
  } else if (subtype === 'floating') {
    const stepDepth = depth / steps;
    const stepHeight = height / steps;
    
    for (let i = 0; i < steps; i++) {
      const curY = stepHeight * i + stepHeight - 0.02;
      createBox(registry, `stairs_step_fl_${stairs.id}_${i}`, {
        width: width,
        height: 0.04,
        depth: stepDepth * 0.9
      }, {
        position: {
          x: 0,
          y: curY,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

    if (!sideHidden) {
      const beamLen = Math.sqrt(depth * depth + height * height);
      const beamAngle = Math.atan2(height, depth);
      
      createBox(registry, `stairs_beam_${stairs.id}`, {
        width: 0.15,
        height: 0.08,
        depth: beamLen
      }, {
        position: {
          x: 0,
          y: height / 2 - 0.05,
          z: 0
        },
        rotation: {
          x: -beamAngle
        }
      }, {
        material: sideMaterial,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }
  }

  // 遍历所有子网格，并为它们附加上组件元数据以便涂刷材质时区分踏面板和侧边基座
  group.getChildMeshes().forEach(mesh => {
    const name = mesh.name.toLowerCase();
    if (name.includes('tread') || name.includes('stairs_step_sp_') || name.includes('stairs_step_fl_')) {
      mesh.metadata = { ...mesh.metadata, blueprintStairsComponentId: 'top' };
    } else {
      mesh.metadata = { ...mesh.metadata, blueprintStairsComponentId: 'side' };
    }
    mesh.isPickable = true;
  });
}
