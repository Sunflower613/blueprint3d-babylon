import * as BABYLON from '@babylonjs/core';
import { createBox, createCylinder, createSphere } from '../core/primitives.js';

/**
 * 根据大门配置及其 subtype 参数，调用 primitives 构建栅栏大门的 3D 实体组件
 * @param {object} registry 注册表上下文
 * @param {BABYLON.TransformNode} group 挂载的父节点
 * @param {object} gate 栅栏门 data 树
 * @param {BABYLON.Material} material 默认材质
 * @param {number} length 大门开口宽度
 * @param {number} height 大门高度
 * @param {number} thickness 门框/柱厚度
 */
export function buildFenceGateGeometry(registry, group, gate, material, length, height, thickness) {
  const subtype = gate.subtype || 'picket_wood';
  const scene = registry.scene;

  // 建立一个点击碰撞箱代理长方体 (pick_proxy)，防止射线穿过空隙 (NEW)
  const proxyThickness = Math.max(0.15, thickness * 1.5);
  const proxy = createBox(registry, `gate_pick_proxy_${gate.id}`, {
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

  // 1. 创建辅助材质，保持与栅栏的 WOW 视觉效果一致
  const ironMaterial = new BABYLON.StandardMaterial(`gate_iron_mat_${gate.id}`, scene);
  ironMaterial.diffuseColor = BABYLON.Color3.FromHexString('#212121');
  ironMaterial.specularColor = BABYLON.Color3.FromHexString('#333333');

  const goldMaterial = new BABYLON.StandardMaterial(`gate_gold_mat_${gate.id}`, scene);
  goldMaterial.diffuseColor = BABYLON.Color3.FromHexString('#ffd700');
  goldMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');
  goldMaterial.roughness = 0.2;

  const glassMaterial = new BABYLON.StandardMaterial(`gate_glass_mat_${gate.id}`, scene);
  glassMaterial.diffuseColor = BABYLON.Color3.FromHexString('#80deea');
  glassMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');
  glassMaterial.alpha = 0.4;
  glassMaterial.backFaceCulling = false;

  const steelMaterial = new BABYLON.StandardMaterial(`gate_steel_mat_${gate.id}`, scene);
  steelMaterial.diffuseColor = BABYLON.Color3.FromHexString('#b0bec5');
  steelMaterial.specularColor = BABYLON.Color3.FromHexString('#ffffff');

  const stoneMaterial = new BABYLON.StandardMaterial(`gate_stone_mat_${gate.id}`, scene);
  stoneMaterial.diffuseColor = BABYLON.Color3.FromHexString('#cfd8dc');
  stoneMaterial.specularColor = BABYLON.Color3.FromHexString('#111111');

  const ropeMaterial = new BABYLON.StandardMaterial(`gate_rope_mat_${gate.id}`, scene);
  ropeMaterial.diffuseColor = BABYLON.Color3.FromHexString('#3e2723');

  // 双材质支持
  const frameMat = gate.frameMaterial
    ? (gate.frameMaterial.startsWith('#') || gate.frameMaterial.startsWith('rgb')
      ? new BABYLON.StandardMaterial(`gate_f_mat_${gate.id}`, scene)
      : material)
    : material;
  if (gate.frameMaterial && (gate.frameMaterial.startsWith('#') || gate.frameMaterial.startsWith('rgb')) && frameMat !== material) {
    frameMat.diffuseColor = BABYLON.Color3.FromHexString(gate.frameMaterial.startsWith('#') ? gate.frameMaterial : '#8d6e63');
  }

  const panelMat = gate.panelMaterial
    ? (gate.panelMaterial.startsWith('#') || gate.panelMaterial.startsWith('rgb')
      ? new BABYLON.StandardMaterial(`gate_p_mat_${gate.id}`, scene)
      : material)
    : material;
  if (gate.panelMaterial && (gate.panelMaterial.startsWith('#') || gate.panelMaterial.startsWith('rgb')) && panelMat !== material) {
    panelMat.diffuseColor = BABYLON.Color3.FromHexString(gate.panelMaterial.startsWith('#') ? gate.panelMaterial : '#8d6e63');
  }

  // 1. 两侧门柱 (仅对非石砌矮墙、非混凝土样式，其他的需要基本的立柱做门框支托)
  const isSpecialPillar = subtype === 'stone_masonry' || subtype === 'concrete';
  const postWidth = thickness * 1.1;
  const postHeight = height * 1.05;

  if (!isSpecialPillar) {
    // 门左边框柱
    createBox(registry, `gate_post_left_${gate.id}`, {
      width: postWidth,
      height: postHeight,
      depth: postWidth
    }, {
      position: { x: -length / 2, y: postHeight / 2, z: 0 }
    }, {
      material: frameMat,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    // 门右边框柱
    createBox(registry, `gate_post_right_${gate.id}`, {
      width: postWidth,
      height: postHeight,
      depth: postWidth
    }, {
      position: { x: length / 2, y: postHeight / 2, z: 0 }
    }, {
      material: frameMat,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
  } else if (subtype === 'stone_masonry') {
    // 石砌矮墙门两侧粗石柱
    const pillarW = thickness * 1.8;
    const pillarH = height * 1.1;
    createBox(registry, `gate_pillar_left_${gate.id}`, {
      width: pillarW,
      height: pillarH,
      depth: pillarW
    }, {
      position: { x: -length / 2, y: pillarH / 2, z: 0 }
    }, {
      material: stoneMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    createSphere(registry, `gate_pillar_ball_left_${gate.id}`, {
      diameter: pillarW * 0.72
    }, {
      position: { x: -length / 2, y: pillarH + (pillarW * 0.36), z: 0 }
    }, {
      material: stoneMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });

    createBox(registry, `gate_pillar_right_${gate.id}`, {
      width: pillarW,
      height: pillarH,
      depth: pillarW
    }, {
      position: { x: length / 2, y: pillarH / 2, z: 0 }
    }, {
      material: stoneMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    createSphere(registry, `gate_pillar_ball_right_${gate.id}`, {
      diameter: pillarW * 0.72
    }, {
      position: { x: length / 2, y: pillarH + (pillarW * 0.36), z: 0 }
    }, {
      material: stoneMaterial,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
  } else if (subtype === 'concrete') {
    // 混凝土大柱子
    const pillarW = thickness * 1.5;
    const pillarH = height * 1.05;
    createBox(registry, `gate_concrete_left_${gate.id}`, {
      width: pillarW,
      height: pillarH,
      depth: pillarW
    }, {
      position: { x: -length / 2, y: pillarH / 2, z: 0 }
    }, {
      material: frameMat,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
    createBox(registry, `gate_concrete_right_${gate.id}`, {
      width: pillarW,
      height: pillarH,
      depth: pillarW
    }, {
      position: { x: length / 2, y: pillarH / 2, z: 0 }
    }, {
      material: frameMat,
      parent: group,
      receiveShadows: true,
      shadowCaster: true
    });
  }

  // 如果门板隐藏，则只渲染边框
  if (gate.panelHidden) return;

  // 2. 创建门扇旋转控制节点 (Hinges)
  const isDouble = !!gate.doubleDoor;
  const isFlippedLR = !!gate.isFlippedLR;
  const isFlippedIO = !!gate.isFlippedIO;

  const openAngle = Math.PI / 2; // 开启旋转 90 度
  const hinges = [];

  const margin = 0.02; // 门扇与边框柱的缝隙
  const actualPostW = isSpecialPillar ? (thickness * 1.5) : postWidth;
  const hingeOffsetX = length / 2 - actualPostW / 2;

  if (isDouble) {
    // 双开：两扇门，向两侧外旋或内旋
    const leftHinge = new BABYLON.TransformNode(`gate_hinge_left_${gate.id}`, scene);
    leftHinge.parent = group;
    leftHinge.position.set(-hingeOffsetX, 0, 0);
    leftHinge.rotation.y = gate.isOpen ? (isFlippedIO ? openAngle : -openAngle) : 0;

    const rightHinge = new BABYLON.TransformNode(`gate_hinge_right_${gate.id}`, scene);
    rightHinge.parent = group;
    rightHinge.position.set(hingeOffsetX, 0, 0);
    rightHinge.rotation.y = gate.isOpen ? (isFlippedIO ? -openAngle : openAngle) : 0;

    hinges.push(
      { node: leftHinge, direction: 1, width: hingeOffsetX - margin },
      { node: rightHinge, direction: -1, width: hingeOffsetX - margin }
    );
  } else {
    // 单开：一扇门
    const hingeX = isFlippedLR ? hingeOffsetX : -hingeOffsetX;
    const singleHinge = new BABYLON.TransformNode(`gate_hinge_${gate.id}`, scene);
    singleHinge.parent = group;
    singleHinge.position.set(hingeX, 0, 0);
    singleHinge.rotation.y = gate.isOpen ? (isFlippedLR === isFlippedIO ? -openAngle : openAngle) : 0;

    hinges.push({
      node: singleHinge,
      direction: isFlippedLR ? -1 : 1,
      width: hingeOffsetX * 2 - margin
    });
  }

  // 3. 在对应的 Hinge 节点下，渲染门扇几何体
  hinges.forEach(({ node, direction, width: panelW }) => {
    const panelGroup = new BABYLON.TransformNode(`gate_panel_group_${gate.id}`, scene);
    panelGroup.parent = node;
    panelGroup.position.set(direction * panelW / 2, 0, 0);

    const gateThickness = thickness * 0.6;

    if (subtype === 'picket_wood') {
      const railH = 0.04;
      const railD = gateThickness * 0.8;
      createBox(registry, `panel_rail_t`, { width: panelW, height: railH, depth: railD }, { position: { x: 0, y: height * 0.75, z: 0 } }, { material: panelMat, parent: panelGroup, receiveShadows: true, shadowCaster: true });
      createBox(registry, `panel_rail_b`, { width: panelW, height: railH, depth: railD }, { position: { x: 0, y: height * 0.25, z: 0 } }, { material: panelMat, parent: panelGroup, receiveShadows: true, shadowCaster: true });

      const diagAngle = Math.atan2(height * 0.5, panelW);
      const diagLen = Math.sqrt(panelW * panelW + height * height * 0.25);
      createBox(registry, `panel_rail_diag`, { width: diagLen, height: railH * 0.8, depth: railD * 0.6 }, {
        position: { x: 0, y: height * 0.5, z: 0 },
        rotation: { z: direction * diagAngle }
      }, { material: panelMat, parent: panelGroup, receiveShadows: true, shadowCaster: true });

      const spacing = 0.16;
      const count = Math.max(1, Math.floor(panelW / spacing));
      const startX = -(count - 1) * spacing / 2;
      for (let i = 0; i < count; i++) {
        const curX = startX + i * spacing;
        createBox(registry, `wood_picket_${i}`, { width: 0.06, height: height * 0.85, depth: 0.015 }, { position: { x: curX, y: (height * 0.85) / 2, z: railD / 2 + 0.005 } }, { material: panelMat, parent: panelGroup, receiveShadows: true, shadowCaster: true });
        createBox(registry, `wood_picket_top_${i}`, { width: 0.042, height: 0.042, depth: 0.015 }, { position: { x: curX, y: height * 0.85 + 0.015, z: railD / 2 + 0.005 }, rotation: { z: Math.PI / 4 } }, { material: panelMat, parent: panelGroup, receiveShadows: true, shadowCaster: true });
      }

    } else if (subtype === 'iron_ornamental') {
      const frameD = 0.02;
      createBox(registry, `iron_frame_t`, { width: panelW, height: 0.02, depth: frameD }, { position: { x: 0, y: height * 0.85, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      createBox(registry, `iron_frame_b`, { width: panelW, height: 0.02, depth: frameD }, { position: { x: 0, y: height * 0.15, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      createBox(registry, `iron_frame_l`, { width: 0.02, height: height * 0.7, depth: frameD }, { position: { x: -panelW / 2 + 0.01, y: height * 0.5, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      createBox(registry, `iron_frame_r`, { width: 0.02, height: height * 0.7, depth: frameD }, { position: { x: panelW / 2 - 0.01, y: height * 0.5, z: 0 } }, { material: ironMaterial, parent: panelGroup });

      const spacing = 0.12;
      const count = Math.max(1, Math.floor((panelW - 0.04) / spacing));
      const startX = -(count - 1) * spacing / 2;
      for (let i = 0; i < count; i++) {
        const curX = startX + i * spacing;
        createCylinder(registry, `iron_bar_${i}`, { diameterTop: 0.012, diameterBottom: 0.012, height: height * 0.9 }, { position: { x: curX, y: (height * 0.9) / 2, z: 0 } }, { material: ironMaterial, parent: panelGroup, receiveShadows: true, shadowCaster: true });
        createSphere(registry, `iron_spear_ball_${i}`, { diameter: 0.024 }, { position: { x: curX, y: height * 0.9, z: 0 } }, { material: goldMaterial, parent: panelGroup });
        createCylinder(registry, `iron_spear_point_${i}`, { diameterTop: 0.001, diameterBottom: 0.012, height: 0.05, tessellation: 4 }, { position: { x: curX, y: height * 0.9 + 0.025, z: 0 } }, { material: goldMaterial, parent: panelGroup });
      }

    } else if (subtype === 'wire_mesh') {
      const pipeRad = 0.015;
      createCylinder(registry, `wire_frame_t`, { diameterTop: pipeRad * 2, diameterBottom: pipeRad * 2, height: panelW }, { position: { x: 0, y: height * 0.9, z: 0.01 }, rotation: { z: Math.PI / 2 } }, { material: steelMaterial, parent: panelGroup });
      createCylinder(registry, `wire_frame_b`, { diameterTop: pipeRad * 2, diameterBottom: pipeRad * 2, height: panelW }, { position: { x: 0, y: height * 0.1, z: 0.01 }, rotation: { z: Math.PI / 2 } }, { material: steelMaterial, parent: panelGroup });
      createCylinder(registry, `wire_frame_l`, { diameterTop: pipeRad * 2, diameterBottom: pipeRad * 2, height: height * 0.8 }, { position: { x: -panelW / 2 + pipeRad, y: height * 0.5, z: 0 } }, { material: steelMaterial, parent: panelGroup });
      createCylinder(registry, `wire_frame_r`, { diameterTop: pipeRad * 2, diameterBottom: pipeRad * 2, height: height * 0.8 }, { position: { x: panelW / 2 - pipeRad, y: height * 0.5, z: 0 } }, { material: steelMaterial, parent: panelGroup });

      const activeW = panelW - pipeRad * 4;
      const activeH = height * 0.8;
      
      const gridSpacing = 0.141421356; // 边长10cm的正方形网格，水平间距 = 0.1414
      const xMin = -panelW / 2 + pipeRad * 2;
      const xMax = panelW / 2 - pipeRad * 2;
      const gridCenterY = height * 0.5;

      const totalW = activeW + activeH;
      const count = Math.ceil(totalW / gridSpacing) + 1;
      const startX = -(count - 1) * gridSpacing / 2;

      for (let i = 0; i < count; i++) {
        const curX = startX + i * gridSpacing;

        // 1. 正斜线裁切 (斜率 +1, 旋转角 -45度)
        const xStartPos = Math.max(xMin, curX - activeH / 2);
        const xEndPos = Math.min(xMax, curX + activeH / 2);
        if (xStartPos < xEndPos - 0.001) {
          const p1y = xStartPos - curX + gridCenterY;
          const p2y = xEndPos - curX + gridCenterY;
          const segLen = (xEndPos - xStartPos) * 1.41421356;
          createCylinder(registry, `wire_mesh_p_${i}`, {
            diameterTop: 0.005,
            diameterBottom: 0.005,
            height: segLen
          }, {
            position: { x: (xStartPos + xEndPos) / 2, y: (p1y + p2y) / 2, z: 0.002 },
            rotation: { z: -Math.PI / 4 }
          }, {
            material: steelMaterial,
            parent: panelGroup
          });
        }

        // 2. 反斜线裁切 (斜率 -1, 旋转角 +45度)
        const xStartNeg = Math.max(xMin, curX - activeH / 2);
        const xEndNeg = Math.min(xMax, curX + activeH / 2);
        if (xStartNeg < xEndNeg - 0.001) {
          const p1y = -xStartNeg + curX + gridCenterY;
          const p2y = -xEndNeg + curX + gridCenterY;
          const segLen = (xEndNeg - xStartNeg) * 1.41421356;
          createCylinder(registry, `wire_mesh_n_${i}`, {
            diameterTop: 0.005,
            diameterBottom: 0.005,
            height: segLen
          }, {
            position: { x: (xStartNeg + xEndNeg) / 2, y: (p1y + p2y) / 2, z: -0.002 },
            rotation: { z: Math.PI / 4 }
          }, {
            material: steelMaterial,
            parent: panelGroup
          });
        }
      }

    } else if (subtype === 'stone_masonry') {
      createBox(registry, `stone_gate_t`, { width: panelW, height: 0.02, depth: 0.02 }, { position: { x: 0, y: height * 0.85, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      createBox(registry, `stone_gate_b`, { width: panelW, height: 0.02, depth: 0.02 }, { position: { x: 0, y: height * 0.15, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      createBox(registry, `stone_gate_l`, { width: 0.02, height: height * 0.7, depth: 0.02 }, { position: { x: -panelW / 2 + 0.01, y: height * 0.5, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      createBox(registry, `stone_gate_r`, { width: 0.02, height: height * 0.7, depth: 0.02 }, { position: { x: panelW / 2 - 0.01, y: height * 0.5, z: 0 } }, { material: ironMaterial, parent: panelGroup });

      const spacing = 0.1;
      const count = Math.max(1, Math.floor((panelW - 0.04) / spacing));
      const startX = -(count - 1) * spacing / 2;
      for (let i = 0; i < count; i++) {
        const curX = startX + i * spacing;
        createCylinder(registry, `stone_gate_bar_${i}`, { diameterTop: 0.01, diameterBottom: 0.01, height: height * 0.7 }, { position: { x: curX, y: height * 0.5, z: 0 } }, { material: ironMaterial, parent: panelGroup });
      }
      createCylinder(registry, `stone_gate_center_circle`, { diameterTop: 0.16, diameterBottom: 0.16, height: 0.01 }, { position: { x: 0, y: height * 0.5, z: 0 }, rotation: { x: Math.PI / 2 } }, { material: goldMaterial, parent: panelGroup });

    } else if (subtype === 'bamboo') {
      const bambooRad = 0.015;
      const mainBambooMaterial = new BABYLON.StandardMaterial(`gate_bamboo_mat`, scene);
      mainBambooMaterial.diffuseColor = BABYLON.Color3.FromHexString('#558b2f');
      mainBambooMaterial.specularColor = BABYLON.Color3.FromHexString('#255d00');

      createCylinder(registry, `bamboo_frame_t`, { diameterTop: bambooRad * 2, diameterBottom: bambooRad * 2, height: panelW }, { position: { x: 0, y: height * 0.85, z: 0.01 }, rotation: { z: Math.PI / 2 } }, { material: mainBambooMaterial, parent: panelGroup });
      createCylinder(registry, `bamboo_frame_b`, { diameterTop: bambooRad * 2, diameterBottom: bambooRad * 2, height: panelW }, { position: { x: 0, y: height * 0.15, z: 0.01 }, rotation: { z: Math.PI / 2 } }, { material: mainBambooMaterial, parent: panelGroup });
      createCylinder(registry, `bamboo_frame_l`, { diameterTop: bambooRad * 2, diameterBottom: bambooRad * 2, height: height * 0.7 }, { position: { x: -panelW / 2 + bambooRad, y: height * 0.5, z: 0 } }, { material: mainBambooMaterial, parent: panelGroup });
      createCylinder(registry, `bamboo_frame_r`, { diameterTop: bambooRad * 2, diameterBottom: bambooRad * 2, height: height * 0.7 }, { position: { x: panelW / 2 - bambooRad, y: height * 0.5, z: 0 } }, { material: mainBambooMaterial, parent: panelGroup });

      const diagAngle = Math.atan2(height * 0.7, panelW);
      const diagLen = Math.sqrt(panelW * panelW + height * height * 0.49);
      createCylinder(registry, `bamboo_diag`, { diameterTop: bambooRad * 1.5, diameterBottom: bambooRad * 1.5, height: diagLen }, {
        position: { x: 0, y: height * 0.5, z: -0.01 },
        rotation: { z: direction * diagAngle }
      }, { material: mainBambooMaterial, parent: panelGroup });

      const spacing = 0.07;
      const count = Math.max(1, Math.floor((panelW - 0.06) / spacing));
      const startX = -(count - 1) * spacing / 2;
      for (let i = 0; i < count; i++) {
        const curX = startX + i * spacing;
        createCylinder(registry, `bamboo_vertical_${i}`, { diameterTop: 0.01, diameterBottom: 0.01, height: height * 0.66 }, { position: { x: curX, y: height * 0.5, z: 0 } }, { material: mainBambooMaterial, parent: panelGroup });
        if (i % 2 === 0) {
          createCylinder(registry, `bamboo_knot_${i}`, { diameterTop: 0.018, diameterBottom: 0.018, height: 0.01 }, { position: { x: curX, y: height * 0.5, z: 0.005 }, rotation: { x: Math.PI / 2 } }, { material: ropeMaterial, parent: panelGroup });
        }
      }

    } else if (subtype === 'glass_rail') {
      const glassW = panelW - 0.04;
      const glassH = height * 0.8;
      createBox(registry, `glass_panel`, { width: glassW, height: glassH, depth: 0.01 }, { position: { x: 0, y: height * 0.45, z: 0 } }, { material: glassMaterial, parent: panelGroup });

      createBox(registry, `clip_t`, { width: 0.06, height: 0.03, depth: 0.02 }, { position: { x: -direction * (panelW / 2 - 0.06), y: height * 0.84, z: 0 } }, { material: steelMaterial, parent: panelGroup });
      createBox(registry, `clip_b`, { width: 0.06, height: 0.03, depth: 0.02 }, { position: { x: -direction * (panelW / 2 - 0.06), y: height * 0.06, z: 0 } }, { material: steelMaterial, parent: panelGroup });

      const handleSide = -direction;
      const hX = handleSide * (panelW / 2 - 0.06);
      createCylinder(registry, `handle_bar`, { diameterTop: 0.015, diameterBottom: 0.015, height: 0.4 }, { position: { x: hX, y: height * 0.5, z: 0.03 } }, { material: steelMaterial, parent: panelGroup });
      createBox(registry, `handle_stem_t`, { width: 0.01, height: 0.01, depth: 0.03 }, { position: { x: hX, y: height * 0.5 + 0.18, z: 0.015 } }, { material: steelMaterial, parent: panelGroup });
      createBox(registry, `handle_stem_b`, { width: 0.01, height: 0.01, depth: 0.03 }, { position: { x: hX, y: height * 0.5 - 0.18, z: 0.015 } }, { material: steelMaterial, parent: panelGroup });

    } else if (subtype === 'concrete') {
      createBox(registry, `concrete_panel`, { width: panelW, height: height * 0.95, depth: gateThickness }, { position: { x: 0, y: (height * 0.95) / 2, z: 0 } }, { material: panelMat, parent: panelGroup, receiveShadows: true, shadowCaster: true });
      createBox(registry, `concrete_panel_trim`, { width: panelW * 0.8, height: 0.05, depth: gateThickness + 0.005 }, { position: { x: 0, y: height * 0.5, z: 0 } }, { material: ironMaterial, parent: panelGroup });
    } else if (subtype === 'rope') {
      // ==========================================
      // 8. 绳索栅栏门 (rope)
      // ==========================================
      const frameRad = 0.015;
      
      // 创建木头矩形框架
      createCylinder(registry, `rope_frame_t`, { diameterTop: frameRad * 2, diameterBottom: frameRad * 2, height: panelW }, { position: { x: 0, y: height * 0.9, z: 0 }, rotation: { z: Math.PI / 2 } }, { material: material, parent: panelGroup });
      createCylinder(registry, `rope_frame_b`, { diameterTop: frameRad * 2, diameterBottom: frameRad * 2, height: panelW }, { position: { x: 0, y: height * 0.1, z: 0 }, rotation: { z: Math.PI / 2 } }, { material: material, parent: panelGroup });
      createCylinder(registry, `rope_frame_l`, { diameterTop: frameRad * 2, diameterBottom: frameRad * 2, height: height * 0.8 }, { position: { x: -panelW / 2 + frameRad, y: height * 0.5, z: 0 } }, { material: material, parent: panelGroup });
      createCylinder(registry, `rope_frame_r`, { diameterTop: frameRad * 2, diameterBottom: frameRad * 2, height: height * 0.8 }, { position: { x: panelW / 2 - frameRad, y: height * 0.5, z: 0 } }, { material: material, parent: panelGroup });

      // 木框内嵌三根下垂绳索
      const ropeHeights = [height * 0.3, height * 0.5, height * 0.7];
      const segments = 6;
      const sag = 0.03;
      const innerW = panelW - frameRad * 4;

      ropeHeights.forEach((ropeH, hIdx) => {
        const points = [];
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const x = -innerW / 2 + t * innerW;
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

          createCylinder(registry, `gate_rope_seg_${hIdx}_${j}`, {
            diameterTop: 0.012,
            diameterBottom: 0.012,
            height: segLen
          }, {
            position: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: 0 },
            rotation: { z: segAngle - Math.PI / 2 }
          }, {
            material: ropeMaterial,
            parent: panelGroup
          });
        }
      });
    }
  });

  const tilt = gate.tilt || 0;
  if (tilt !== 0) {
    group.getChildMeshes().forEach(mesh => {
      const name = mesh.name.toLowerCase();
      const isVertical = name.includes('post') ||
                         name.includes('pillar') ||
                         name.includes('concrete') ||
                         name.includes('bar') ||
                         name.includes('spear') ||
                         name.includes('picket') ||
                         name.includes('knot') ||
                         name.includes('clip') ||
                         name.includes('handle') ||
                         name.includes('glass') ||
                         name.includes('panel');
      if (isVertical) {
        mesh.rotation.z = (mesh.rotation.z || 0) - tilt;
      }
    });
  }

  // 限制大门点击只能点中长方体碰撞箱代理，防止点击穿透板条空隙
  group.getChildMeshes().forEach(mesh => {
    if (mesh !== proxy) {
      mesh.isPickable = false;
    }
  });
}
