import { createBox, createCylinder } from '../core/primitives.js';
import { createBlueprintMaterial } from '../core/materials.js';
import { Mesh, MeshBuilder, VertexData } from '../core/babylon.js';

function mergeAndAddSideMeshes(registry, group, sideMaterial, sideMeshes, name) {
  if (!sideMeshes || sideMeshes.length === 0) return null;
  let finalMesh = null;
  if (sideMeshes.length === 1) {
    finalMesh = sideMeshes[0];
    finalMesh.name = name;
  } else {
    finalMesh = Mesh.MergeMeshes(
      sideMeshes,
      true,
      false,
      undefined,
      false,
      true
    );
    if (finalMesh) {
      finalMesh.name = name;
    }
  }

  if (finalMesh) {
    if (registry && typeof registry.add === 'function') {
      registry.add(finalMesh, {
        material: sideMaterial,
        parent: group,
        receiveShadows: false,
        shadowCaster: true
      });
    } else {
      finalMesh.parent = group;
      finalMesh.material = sideMaterial;
      finalMesh.receiveShadows = false;
      finalMesh.shadowCaster = true;
    }
  }
  return finalMesh;
}

function buildSolidStairsBaseMesh(registry, group, stairs, sideMaterial, width, depth, height, steps) {
  const scene = registry?.scene || registry?.renderer?.scene || group.getScene();
  const stepDepth = depth / steps;
  const stepHeight = height / steps;
  const treadThickness = Math.min(0.04, stepHeight * 0.5);

  const positions = [];
  const indices = [];
  const uvs = [];
  let vertexIndex = 0;

  function addQuad(p0, p1, p2, p3, uv0 = [0, 0], uv1 = [1, 0], uv2 = [1, 1], uv3 = [0, 1]) {
    positions.push(...p0, ...p1, ...p2, ...p3);
    uvs.push(...uv0, ...uv1, ...uv2, ...uv3);
    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    );
    vertexIndex += 4;
  }

  const halfW = width / 2;
  const halfD = depth / 2;

  // 1. 侧面：右侧面 (X = +halfW) 与 左侧面 (X = -halfW)
  for (let i = 0; i < steps; i++) {
    const z0 = -halfD + i * stepDepth;
    const z1 = -halfD + (i + 1) * stepDepth;
    const y0 = 0;
    const y1 = (i + 1) * stepHeight - treadThickness;
    if (y1 <= 0.0001) continue;

    // 右侧面 (X = +halfW, 法线 +X)
    addQuad(
      [halfW, y0, z0],
      [halfW, y0, z1],
      [halfW, y1, z1],
      [halfW, y1, z0],
      [z0, y0], [z1, y0], [z1, y1], [z0, y1]
    );

    // 左侧面 (X = -halfW, 法线 -X)
    addQuad(
      [-halfW, y0, z1],
      [-halfW, y0, z0],
      [-halfW, y1, z0],
      [-halfW, y1, z1],
      [z1, y0], [z0, y0], [z0, y1], [z1, y1]
    );
  }

  // 2. 底面 (Y = 0, 法线 -Y)
  addQuad(
    [-halfW, 0, -halfD],
    [halfW, 0, -halfD],
    [halfW, 0, halfD],
    [-halfW, 0, halfD],
    [0, 0], [width, 0], [width, depth], [0, depth]
  );

  // 3. 后侧面 (Z = +halfD, 法线 +Z)
  const maxH = height - treadThickness;
  if (maxH > 0.0001) {
    addQuad(
      [halfW, 0, halfD],
      [-halfW, 0, halfD],
      [-halfW, maxH, halfD],
      [halfW, maxH, halfD],
      [0, 0], [width, 0], [width, maxH], [0, maxH]
    );
  }

  // 4. 台阶前立面与顶面 (前立面法线 -Z, 顶面法线 +Y)
  for (let i = 0; i < steps; i++) {
    const z0 = -halfD + i * stepDepth;
    const z1 = -halfD + (i + 1) * stepDepth;
    const yPrev = i === 0 ? 0 : i * stepHeight - treadThickness;
    const yCurr = (i + 1) * stepHeight - treadThickness;

    // 前立面 (Z = z0)
    if (yCurr > yPrev + 0.0001) {
      addQuad(
        [-halfW, yPrev, z0],
        [halfW, yPrev, z0],
        [halfW, yCurr, z0],
        [-halfW, yCurr, z0],
        [0, yPrev], [width, yPrev], [width, yCurr], [0, yCurr]
      );
    }

    // 顶底座面 (Y = yCurr)
    if (yCurr > 0.0001) {
      addQuad(
        [-halfW, yCurr, z0],
        [halfW, yCurr, z0],
        [halfW, yCurr, z1],
        [-halfW, yCurr, z1],
        [0, z0], [width, z0], [width, z1], [0, z1]
      );
    }
  }

  const normals = [];
  VertexData.ComputeNormals(positions, indices, normals);

  const sideMesh = new Mesh(`stairs_side_base_${stairs.id}`, scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(sideMesh);

  if (registry && typeof registry.add === 'function') {
    registry.add(sideMesh, {
      material: sideMaterial,
      parent: group,
      receiveShadows: false,
      shadowCaster: true
    });
  } else {
    sideMesh.parent = group;
    sideMesh.material = sideMaterial;
    sideMesh.receiveShadows = false;
    sideMesh.shadowCaster = true;
  }

  return sideMesh;
}

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
  const scene = registry?.scene || registry?.renderer?.scene || group.getScene();

  // 创建侧面材质
  let sideMaterial = material;
  if (stairs.sideMaterial || stairs.sideColor) {
    sideMaterial = createBlueprintMaterial(registry.scene, `stairs_${stairs.id}_side_mat`, stairs.sideMaterial || stairs.sideColor || stairs.color || '#d8c0a0', {
      fallbackColor: stairs.sideColor || stairs.color || '#d8c0a0',
      flatShading: false
    });
  }
  if (material) material.twoSidedLighting = true;
  if (sideMaterial) sideMaterial.twoSidedLighting = true;

  if (subtype === 'straight') {
    const stepDepth = depth / steps;
    const stepHeight = height / steps;
    const treadThickness = Math.min(0.04, stepHeight * 0.5);

    for (let i = 0; i < steps; i += 1) {
      const curStepH = stepHeight * (i + 1);

      // 1. 顶部踏步板
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
        receiveShadows: false,
        shadowCaster: true
      });
    }

    // 2. 单体化整体侧面底座/墙体 Mesh
    if (!sideHidden) {
      buildSolidStairsBaseMesh(registry, group, stairs, sideMaterial, width, depth, height, steps);
    }
  } else if (subtype === 'lshape') {
    const sideMeshes = [];
    const n1 = Math.max(1, Math.min(steps - 2, stairs.cornerStep ?? Math.floor(steps / 2)));
    const n2 = steps - n1;
    const stepHeight = height / steps;
    const landHeight = stepHeight * n1;
    const treadThickness = Math.min(0.04, stepHeight * 0.5);
    const runBeforeCorner = Math.max(0.2, Number(stairs.runBeforeCorner ?? (depth - width)));
    const runAfterCorner = Math.max(0.2, Number(stairs.runAfterCorner ?? (depth - width)));
    const landingZ = runBeforeCorner / 2;

    // 平台顶板
    createBox(registry, `stairs_land_tread_${stairs.id}`, {
      width: width,
      height: treadThickness,
      depth: width
    }, {
      position: {
        x: 0,
        y: landHeight - treadThickness / 2,
        z: landingZ
      }
    }, {
      material,
      parent: group,
      receiveShadows: false,
      shadowCaster: true
    });

    // 平台底座
    if (!sideHidden) {
      const baseH = landHeight - treadThickness;
      if (baseH > 0.001) {
        const box = MeshBuilder.CreateBox(`stairs_land_base_temp_${stairs.id}`, {
          width: width,
          height: baseH,
          depth: width
        }, scene);
        box.position.set(0, baseH / 2, landingZ);
        sideMeshes.push(box);
      }
    }

    // 第一跑踏步 (L1)
    const stepDepth = runBeforeCorner / n1;
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
          z: -(runBeforeCorner + width) / 2 + stepDepth * i + stepDepth / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: false,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          const box = MeshBuilder.CreateBox(`stairs_step_l1_base_temp_${stairs.id}_${i}`, {
            width,
            height: baseH,
            depth: stepDepth
          }, scene);
          box.position.set(0, baseH / 2, -(runBeforeCorner + width) / 2 + stepDepth * i + stepDepth / 2);
          sideMeshes.push(box);
        }
      }
    }

    // 第二跑踏步 (L2)
    const stepX = runAfterCorner / n2;
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
          z: landingZ
        }
      }, {
        material,
        parent: group,
        receiveShadows: false,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          const box = MeshBuilder.CreateBox(`stairs_step_l2_base_temp_${stairs.id}_${i}`, {
            width: stepX,
            height: baseH,
            depth: width
          }, scene);
          box.position.set((width / 2 + stepX * i + stepX / 2) * flipX, baseH / 2, landingZ);
          sideMeshes.push(box);
        }
      }
    }

    if (!sideHidden && sideMeshes.length > 0) {
      mergeAndAddSideMeshes(registry, group, sideMaterial, sideMeshes, `stairs_side_base_${stairs.id}`);
    }
  } else if (subtype === 'ushape') {
    const sideMeshes = [];
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
      receiveShadows: false,
      shadowCaster: true
    });

    // 平台底座
    if (!sideHidden) {
      const baseH = landHeight - treadThickness;
      if (baseH > 0.001) {
        const box = MeshBuilder.CreateBox(`stairs_land_base_temp_${stairs.id}`, {
          width: width,
          height: baseH,
          depth: landDepth
        }, scene);
        box.position.set(0, baseH / 2, depth / 2 - landDepth / 2);
        sideMeshes.push(box);
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
        receiveShadows: false,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          const box = MeshBuilder.CreateBox(`stairs_step_u1_base_temp_${stairs.id}_${i}`, {
            width: wStep,
            height: baseH,
            depth: stepDepth
          }, scene);
          box.position.set(-(wStep / 2 + slotW / 2) * flipX, baseH / 2, -depth / 2 + stepDepth * i + stepDepth / 2);
          sideMeshes.push(box);
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
        receiveShadows: false,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          const box = MeshBuilder.CreateBox(`stairs_step_u2_base_temp_${stairs.id}_${i}`, {
            width: wStep,
            height: baseH,
            depth: stepDepth
          }, scene);
          box.position.set((wStep / 2 + slotW / 2) * flipX, baseH / 2, (depth / 2 - landDepth) - stepDepth * i - stepDepth / 2);
          sideMeshes.push(box);
        }
      }
    }

    if (!sideHidden && sideMeshes.length > 0) {
      mergeAndAddSideMeshes(registry, group, sideMaterial, sideMeshes, `stairs_side_base_${stairs.id}`);
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
        receiveShadows: false,
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
        receiveShadows: false,
        shadowCaster: true
      });
    }
  } else if (subtype === 'curved') {
    const sideMeshes = [];
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
        receiveShadows: false,
        shadowCaster: true
      });

      // 底座
      if (!sideHidden) {
        const baseH = curStepH - treadThickness;
        if (baseH > 0.001) {
          const box = MeshBuilder.CreateBox(`stairs_step_cv_base_temp_${stairs.id}_${i}`, {
            width: stepD,
            height: baseH,
            depth: stepW
          }, scene);
          box.position.set(
            (-width / 2 + centerR * Math.sin(angle)) * flipX,
            baseH / 2,
            -depth / 2 + centerR * Math.cos(angle)
          );
          box.rotation.y = angle * flipX;
          sideMeshes.push(box);
        }
      }
    }

    if (!sideHidden && sideMeshes.length > 0) {
      mergeAndAddSideMeshes(registry, group, sideMaterial, sideMeshes, `stairs_side_base_${stairs.id}`);
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
        receiveShadows: false,
        shadowCaster: true
      });
    }

    const beamCount = Math.max(0, Math.round(Number(stairs.beamCount ?? 1)));
    if (!sideHidden && beamCount > 0) {
      const beamLen = Math.sqrt(depth * depth + height * height);
      const beamAngle = Math.atan2(height, depth);
      const beamW = Math.min(0.15, width * 0.2);

      for (let b = 0; b < beamCount; b++) {
        let posX = 0;
        if (beamCount > 1) {
          const margin = Math.min(0.15, width * 0.2);
          const span = width - margin * 2;
          posX = -width / 2 + margin + (span / (beamCount - 1)) * b;
        }

        createBox(registry, `stairs_beam_${stairs.id}_${b}`, {
          width: beamW,
          height: 0.08,
          depth: beamLen
        }, {
          position: {
            x: posX,
            y: height / 2 - 0.05,
            z: 0
          },
          rotation: {
            x: -beamAngle
          }
        }, {
          material: sideMaterial,
          parent: group,
          receiveShadows: false,
          shadowCaster: true
        });
      }
    }
  } else if (subtype === 'ladder') {
    const railThick = Math.min(0.06, width * 0.1);
    const innerW = width - railThick * 2;

    // 两侧立柱 (归属于侧边材质)
    if (!sideHidden) {
      createBox(registry, `stairs_ladder_rail_left_${stairs.id}`, {
        width: railThick,
        height: height,
        depth: depth
      }, {
        position: {
          x: -width / 2 + railThick / 2,
          y: height / 2,
          z: 0
        }
      }, {
        material: sideMaterial,
        parent: group,
        receiveShadows: false,
        shadowCaster: true
      });

      createBox(registry, `stairs_ladder_rail_right_${stairs.id}`, {
        width: railThick,
        height: height,
        depth: depth
      }, {
        position: {
          x: width / 2 - railThick / 2,
          y: height / 2,
          z: 0
        }
      }, {
        material: sideMaterial,
        parent: group,
        receiveShadows: false,
        shadowCaster: true
      });
    }

    // 踏棍 (归属于顶面/主材质)
    const count = Math.max(2, steps);
    const stepGap = height / (count + 1);
    for (let i = 0; i < count; i++) {
      const curY = stepGap * (i + 1);
      createCylinder(registry, `stairs_rung_${stairs.id}_${i}`, {
        diameterTop: 0.04,
        diameterBottom: 0.04,
        height: Math.max(0.1, innerW)
      }, {
        position: {
          x: 0,
          y: curY,
          z: 0
        },
        rotation: {
          z: Math.PI / 2
        }
      }, {
        material,
        parent: group,
        receiveShadows: false,
        shadowCaster: true
      });
    }
  } else if (subtype === 'slide') {
    const chuteW = Math.max(0.2, width - 0.12);
    const chuteLen = Math.sqrt(depth * depth + height * height);
    const slideAngle = Math.atan2(height, depth);

    // 斜向滑道 (归属于主材质)
    createBox(registry, `stairs_slide_chute_${stairs.id}`, {
      width: chuteW,
      height: 0.04,
      depth: chuteLen
    }, {
      position: {
        x: 0,
        y: height / 2,
        z: 0
      },
      rotation: {
        x: -slideAngle
      }
    }, {
      material,
      parent: group,
      receiveShadows: false,
      shadowCaster: true
    });

    // 顶部入口平台 (归属于主材质)
    createBox(registry, `stairs_slide_top_land_${stairs.id}`, {
      width: chuteW,
      height: 0.04,
      depth: 0.3
    }, {
      position: {
        x: 0,
        y: height - 0.02,
        z: depth / 2 + 0.15
      }
    }, {
      material,
      parent: group,
      receiveShadows: false,
      shadowCaster: true
    });

    // 两侧保护加高护栏 (归属于侧边材质)
    if (!sideHidden) {
      const railH = 0.22;
      const railThick = 0.05;
      [-1, 1].forEach((dir) => {
        createBox(registry, `stairs_slide_rail_${dir > 0 ? 'r' : 'l'}_${stairs.id}`, {
          width: railThick,
          height: railH,
          depth: chuteLen
        }, {
          position: {
            x: dir * (width / 2 - railThick / 2),
            y: height / 2 + railH * 0.35,
            z: 0
          },
          rotation: {
            x: -slideAngle
          }
        }, {
          material: sideMaterial,
          parent: group,
          receiveShadows: false,
          shadowCaster: true
        });
      });
    }
  }

  // 创建与楼梯坡度/造型精准贴合的斜向碰撞代理 (Sloped Hitbox Proxy)
  if (['straight', 'floating', 'slide', 'ladder'].includes(subtype)) {
    const slopeAngle = Math.atan2(height, depth);
    const slopeLen = Math.hypot(height, depth);
    const boxThickness = Math.max(0.12, (height / steps) * 0.9);
    const hitbox = createBox(registry, `stairs_hitbox_${stairs.id}`, {
      width: width,
      height: boxThickness,
      depth: slopeLen
    }, {
      position: {
        x: 0,
        y: height / 2,
        z: 0
      },
      rotation: {
        x: -slopeAngle,
        y: 0,
        z: 0
      }
    }, {
      material,
      parent: group,
      receiveShadows: false,
      shadowCaster: false
    });
    hitbox.visibility = 0;
    hitbox.isPickable = true;
    hitbox.metadata = { ...hitbox.metadata, isHitbox: true };
  } else if (subtype === 'lshape') {
    const n1 = Math.max(1, Math.min(steps - 2, stairs.cornerStep ?? Math.floor(steps / 2)));
    const n2 = steps - n1;
    const stepHeight = height / steps;
    const landHeight = stepHeight * n1;
    const runBeforeCorner = Math.max(0.2, Number(stairs.runBeforeCorner ?? (depth - width)));
    const runAfterCorner = Math.max(0.2, Number(stairs.runAfterCorner ?? (depth - width)));
    const landingZ = runBeforeCorner / 2;
    const boxThickness = Math.max(0.12, stepHeight * 0.9);

    // 1. 下段斜坡
    const slopeAngle1 = Math.atan2(landHeight, runBeforeCorner);
    const slopeLen1 = Math.hypot(landHeight, runBeforeCorner);
    const h1 = createBox(registry, `stairs_hitbox1_${stairs.id}`, {
      width: width,
      height: boxThickness,
      depth: slopeLen1
    }, {
      position: {
        x: 0,
        y: landHeight / 2,
        z: landingZ - runBeforeCorner / 2
      },
      rotation: {
        x: -slopeAngle1,
        y: 0,
        z: 0
      }
    }, { material, parent: group, receiveShadows: false, shadowCaster: false });
    h1.visibility = 0; h1.isPickable = true; h1.metadata = { ...h1.metadata, isHitbox: true };

    // 2. 中间平台
    const hLand = createBox(registry, `stairs_hitbox_land_${stairs.id}`, {
      width: width,
      height: boxThickness,
      depth: width
    }, {
      position: { x: 0, y: landHeight, z: landingZ }
    }, { material, parent: group, receiveShadows: false, shadowCaster: false });
    hLand.visibility = 0; hLand.isPickable = true; hLand.metadata = { ...hLand.metadata, isHitbox: true };

    // 3. 上段斜坡
    const upperH = height - landHeight;
    const slopeAngle2 = Math.atan2(upperH, runAfterCorner);
    const slopeLen2 = Math.hypot(upperH, runAfterCorner);
    const h2 = createBox(registry, `stairs_hitbox2_${stairs.id}`, {
      width: width,
      height: boxThickness,
      depth: slopeLen2
    }, {
      position: {
        x: flipX * (runAfterCorner / 2),
        y: landHeight + upperH / 2,
        z: landingZ
      },
      rotation: {
        x: -slopeAngle2,
        y: (flipX * Math.PI) / 2,
        z: 0
      }
    }, { material, parent: group, receiveShadows: false, shadowCaster: false });
    h2.visibility = 0; h2.isPickable = true; h2.metadata = { ...h2.metadata, isHitbox: true };
  } else if (subtype === 'ushape') {
    const n1 = Math.max(1, Math.min(steps - 2, stairs.cornerStep ?? Math.floor(steps / 2)));
    const n2 = steps - n1;
    const stepHeight = height / steps;
    const landHeight = stepHeight * n1;
    const runBeforeCorner = Math.max(0.2, Number(stairs.runBeforeCorner ?? (depth - width)));
    const landingZ = runBeforeCorner / 2;
    const uVoidLength = Math.max(0.05, Number(stairs.uVoidLength ?? 0.2));
    const flightWidth = (width - uVoidLength) / 2;
    const boxThickness = Math.max(0.12, stepHeight * 0.9);

    // 下段
    const slopeAngle1 = Math.atan2(landHeight, runBeforeCorner);
    const slopeLen1 = Math.hypot(landHeight, runBeforeCorner);
    const h1 = createBox(registry, `stairs_hitbox1_${stairs.id}`, {
      width: flightWidth,
      height: boxThickness,
      depth: slopeLen1
    }, {
      position: { x: flipX * (-width / 2 + flightWidth / 2), y: landHeight / 2, z: landingZ - runBeforeCorner / 2 },
      rotation: { x: -slopeAngle1, y: 0, z: 0 }
    }, { material, parent: group, receiveShadows: false, shadowCaster: false });
    h1.visibility = 0; h1.isPickable = true; h1.metadata = { ...h1.metadata, isHitbox: true };

    // 平台
    const hLand = createBox(registry, `stairs_hitbox_land_${stairs.id}`, {
      width: width,
      height: boxThickness,
      depth: width
    }, {
      position: { x: 0, y: landHeight, z: landingZ }
    }, { material, parent: group, receiveShadows: false, shadowCaster: false });
    hLand.visibility = 0; hLand.isPickable = true; hLand.metadata = { ...hLand.metadata, isHitbox: true };

    // 上段
    const upperH = height - landHeight;
    const h2 = createBox(registry, `stairs_hitbox2_${stairs.id}`, {
      width: flightWidth,
      height: boxThickness,
      depth: slopeLen1
    }, {
      position: { x: flipX * (width / 2 - flightWidth / 2), y: landHeight + upperH / 2, z: landingZ - runBeforeCorner / 2 },
      rotation: { x: slopeAngle1, y: 0, z: 0 }
    }, { material, parent: group, receiveShadows: false, shadowCaster: false });
    h2.visibility = 0; h2.isPickable = true; h2.metadata = { ...h2.metadata, isHitbox: true };
  }

  // 遍历所有子网格，并为它们附加上组件元数据以便涂刷材质时区分踏面板和侧边基座
  group.getChildMeshes().forEach(mesh => {
    if (mesh.metadata?.isHitbox) {
      mesh.isPickable = true;
      mesh.metadata = { ...mesh.metadata, blueprintStairsComponentId: 'top' };
      return;
    }
    const name = mesh.name.toLowerCase();
    if (name.includes('tread') || name.includes('stairs_step_sp_') || name.includes('stairs_step_fl_') || name.includes('stairs_rung_') || name.includes('stairs_slide_chute_') || name.includes('stairs_slide_top_land_')) {
      mesh.metadata = { ...mesh.metadata, blueprintStairsComponentId: 'top' };
    } else {
      mesh.metadata = { ...mesh.metadata, blueprintStairsComponentId: 'side' };
    }
    mesh.isPickable = true;
  });
}
