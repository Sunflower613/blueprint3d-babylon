import { createBox, createCylinder } from '../core/primitives.js';

/**
 * 根据楼梯类型及参数，调用primitives构建楼梯的三维实体组件
 * @param {object} registry 注册表上下文（通常为blueprintTestMap实例本身）
 * @param {BABYLON.TransformNode} group 楼梯模型挂载的TransformNode父节点
 * @param {object} stairs 楼梯的数据对象
 * @param {BABYLON.Material} material 楼梯材质
 * @param {number} width 宽度
 * @param {number} depth 深度
 * @param {number} height 高度
 * @param {number} steps 踏步数
 */
export function buildStairsGeometry(registry, group, stairs, material, width, depth, height, steps) {
  const subtype = stairs.subtype || 'straight';

  if (subtype === 'straight') {
    for (let i = 0; i < steps; i += 1) {
      const stepDepth = depth / steps;
      const stepHeight = height / steps;
      createBox(registry, `stairs_step_${stairs.id}_${i}`, {
        width,
        height: stepHeight * (i + 1),
        depth: stepDepth
      }, {
        position: {
          x: 0,
          y: (stepHeight * (i + 1)) / 2,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }
  } else if (subtype === 'lshape') {
    const halfSteps = Math.floor(steps / 2);
    
    createBox(registry, `stairs_land_${stairs.id}`, {
      width: width,
      height: height / 2,
      depth: width
    }, {
      position: {
        x: 0,
        y: height / 4,
        z: depth / 2 - width / 2
      }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    const stepDepth = (depth - width) / halfSteps;
    const stepHeight = (height / 2) / halfSteps;
    for (let i = 0; i < halfSteps; i++) {
      createBox(registry, `stairs_step_l1_${stairs.id}_${i}`, {
        width,
        height: stepHeight * (i + 1),
        depth: stepDepth
      }, {
        position: {
          x: 0,
          y: (stepHeight * (i + 1)) / 2,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

    const stepX = (depth - width) / halfSteps;
    const topStepHeight = (height / 2) / halfSteps;
    for (let i = 0; i < halfSteps; i++) {
      const curH = height / 2 + topStepHeight * (i + 1);
      createBox(registry, `stairs_step_l2_${stairs.id}_${i}`, {
        width: stepX,
        height: curH,
        depth: width
      }, {
        position: {
          x: width / 2 + stepX * i + stepX / 2,
          y: curH / 2,
          z: depth / 2 - width / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }
  } else if (subtype === 'ushape') {
    const halfSteps = Math.floor(steps / 2);
    const wStep = width / 2;
    
    createBox(registry, `stairs_land_${stairs.id}`, {
      width: width,
      height: height / 2,
      depth: width
    }, {
      position: {
        x: 0,
        y: height / 4,
        z: depth / 2 - width / 2
      }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    const stepDepth = (depth - width) / halfSteps;
    const stepHeight = (height / 2) / halfSteps;
    for (let i = 0; i < halfSteps; i++) {
      createBox(registry, `stairs_step_u1_${stairs.id}_${i}`, {
        width: wStep,
        height: stepHeight * (i + 1),
        depth: stepDepth
      }, {
        position: {
          x: -width / 4,
          y: (stepHeight * (i + 1)) / 2,
          z: -depth / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }

    for (let i = 0; i < halfSteps; i++) {
      const curH = height / 2 + stepHeight * (i + 1);
      createBox(registry, `stairs_step_u2_${stairs.id}_${i}`, {
        width: wStep,
        height: curH,
        depth: stepDepth
      }, {
        position: {
          x: width / 4,
          y: curH / 2,
          z: (depth / 2 - width) - stepDepth * i - stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
    }
  } else if (subtype === 'spiral') {
    const radius = Math.max(width, depth) / 2;
    
    createCylinder(registry, `stairs_post_${stairs.id}`, {
      diameterTop: 0.15,
      diameterBottom: 0.15,
      height: height
    }, {
      position: { x: 0, y: height / 2, z: 0 }
    }, {
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    const stepAngle = (2 * Math.PI) / steps;
    for (let i = 0; i < steps; i++) {
      const curY = (height / steps) * i + (height / steps) / 2;
      const angle = i * stepAngle;
      
      createBox(registry, `stairs_step_sp_${stairs.id}_${i}`, {
        width: radius,
        height: 0.05,
        depth: radius * 0.4
      }, {
        position: {
          x: (radius / 2) * Math.sin(angle),
          y: curY,
          z: -(radius / 2) * Math.cos(angle)
        },
        rotation: {
          y: -angle
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
    const stepAngle = (Math.PI / 2) / steps;
    
    for (let i = 0; i < steps; i++) {
      const angle = i * stepAngle + stepAngle / 2;
      const curH = (height / steps) * (i + 1);
      const stepW = width;
      const stepD = (outerR * Math.PI / 2) / steps;
      
      createBox(registry, `stairs_step_cv_${stairs.id}_${i}`, {
        width: stepW,
        height: curH,
        depth: stepD
      }, {
        position: {
          x: -width / 2 + centerR * Math.sin(angle),
          y: curH / 2,
          z: -depth / 2 + centerR * Math.cos(angle)
        },
        rotation: {
          y: -angle
        }
      }, {
        material,
        parent: group,
        receiveShadows: true,
        shadowCaster: true
      });
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
      material,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
  }
}
