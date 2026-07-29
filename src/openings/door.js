import { CSG, MeshBuilder, TransformNode } from '../core/babylon.js';
const BABYLON = { CSG, MeshBuilder, TransformNode };
import { createBox, createCylinder } from '../core/primitives.js';
import { createBlueprintMaterial } from '../core/materials.js';
import { buildOpeningBars, buildOpeningFrame, createOpeningPickProxy, createOpeningProfileMesh } from './geometry.js';
import { isSymmetricShape } from './openingShapes.js';

export function buildDoorOpening(registry, opening, parent, options = {}) {
  const width = options.width || opening.width || 0.9;
  const height = options.height || opening.height || 2.05;
  const frameT = options.frameT || 0.2;
  const frameW = options.frameW || 0.04;
  const materialOptions = { surfaceWidth: width, surfaceHeight: height };
  // 支持 per-opening 自定义材质（优先使用自定义，否则使用全局默认）
  const frameMat = opening.frameMaterial
    ? createBlueprintMaterial(registry.scene, `door_frame_${opening.id}`, opening.frameMaterial, materialOptions)
    : (registry.materials.trim || registry.materials.door);
  const panelMat = opening.panelMaterial
    ? createBlueprintMaterial(registry.scene, `door_panel_${opening.id}`, opening.panelMaterial, materialOptions)
    : registry.materials.door;
  const mullionMat = opening.mullionMaterial
    ? createBlueprintMaterial(registry.scene, `door_mullion_${opening.id}`, opening.mullionMaterial, materialOptions)
    : frameMat;

  buildOpeningFrame(registry, opening, parent, {
    width,
    height,
    frameT,
    frameW,
    material: frameMat,
    skipBottom: true
  });
  if (opening.panelHidden) {
    createOpeningPickProxy(registry, opening, parent, { width, height, depth: frameT * 0.8 });
  }

  const isFlippedLR = !!opening.isFlippedLR;
  const isFlippedIO = !!opening.isFlippedIO;
  const isDouble = !!opening.doubleDoor && isSymmetricShape(opening.shape);

  if (isDouble) {
    const leftHingeX = -width / 2 + frameW;
    const rightHingeX = width / 2 - frameW;

    const leftHinge = new BABYLON.TransformNode(`door_hinge_left_${opening.id}`, registry.scene);
    leftHinge.parent = parent;
    leftHinge.position.set(leftHingeX, 0, 0);
    leftHinge.rotation.y = opening.isOpen ? (isFlippedIO ? Math.PI / 2 : -Math.PI / 2) : 0;

    const rightHinge = new BABYLON.TransformNode(`door_hinge_right_${opening.id}`, registry.scene);
    rightHinge.parent = parent;
    rightHinge.position.set(rightHingeX, 0, 0);
    rightHinge.rotation.y = opening.isOpen ? (isFlippedIO ? -Math.PI / 2 : Math.PI / 2) : 0;

    if (opening.panelHidden) return;

    const panelD = 0.04;
    const scaleX = Math.max(0.1, (width - frameW * 2) / width);
    const scaleY = Math.max(0.1, (height - frameW * 2) / height);

    // 直接创建左、右门扇的网格，而完全不用 CSG 切割以避开布尔运算的数值精度与破面 Bug
    const leftPanelMesh = createOpeningProfileMesh(registry, `door_panel_left_${opening.id}`, opening, leftHinge, {
      width,
      height,
      depth: panelD,
      scaleX,
      scaleY,
      offsetX: 0,
      material: panelMat,
      shadowCaster: true
    });

    const leftPositions = leftPanelMesh.getVerticesData("position");
    if (leftPositions) {
      for (let i = 0; i < leftPositions.length; i += 3) {
        if (leftPositions[i] > 1e-5) {
          leftPositions[i] = 0;
        }
      }
      leftPanelMesh.setVerticesData("position", leftPositions);
    }

    const rightPanelMesh = createOpeningProfileMesh(registry, `door_panel_right_${opening.id}`, opening, rightHinge, {
      width,
      height,
      depth: panelD,
      scaleX,
      scaleY,
      offsetX: 0,
      material: panelMat,
      shadowCaster: true
    });

    const rightPositions = rightPanelMesh.getVerticesData("position");
    if (rightPositions) {
      for (let i = 0; i < rightPositions.length; i += 3) {
        if (rightPositions[i] < -1e-5) {
          rightPositions[i] = 0;
        }
      }
      rightPanelMesh.setVerticesData("position", rightPositions);
    }

    leftPanelMesh.metadata = { ...leftPanelMesh.metadata, blueprintOpeningComponentId: 'panel' };
    rightPanelMesh.metadata = { ...rightPanelMesh.metadata, blueprintOpeningComponentId: 'panel' };

    leftPanelMesh.position.set(-leftHingeX, 0, 0);
    rightPanelMesh.position.set(-rightHingeX, 0, 0);

    buildOpeningBars(registry, opening, leftHinge, {
      width,
      height,
      frameW,
      barDepth: panelD + 0.012,
      material: mullionMat,
      clipMinX: -width / 2 + frameW,
      clipMaxX: -1e-6,
      offsetX: -leftHingeX
    });
    buildOpeningBars(registry, opening, rightHinge, {
      width,
      height,
      frameW,
      barDepth: panelD + 0.012,
      material: mullionMat,
      clipMinX: 0,
      clipMaxX: width / 2 - frameW,
      offsetX: -rightHingeX
    });

    const handleD = 0.02;
    const handleH = 0.12;
    const leftHandleX = -leftHingeX - 0.06;
    const rightHandleX = -rightHingeX + 0.06;

    [-1, 1].forEach((side) => {
      createCylinder(registry, `door_handle_left_${side}_${opening.id}`, {
        diameterTop: handleD, diameterBottom: handleD, height: handleH, tessellation: 8
      }, {
        position: { x: leftHandleX, y: -0.05, z: side * (panelD / 2 + 0.02) }
      }, {
        material: registry.materials.trim, parent: leftHinge
      });

      createBox(registry, `door_handle_stem_left_${side}_${opening.id}`, {
        width: 0.015, height: 0.015, depth: 0.02
      }, {
        position: { x: leftHandleX, y: -0.05, z: side * (panelD / 2 + 0.01) }
      }, {
        material: registry.materials.trim, parent: leftHinge
      });
    });

    [-1, 1].forEach((side) => {
      createCylinder(registry, `door_handle_right_${side}_${opening.id}`, {
        diameterTop: handleD, diameterBottom: handleD, height: handleH, tessellation: 8
      }, {
        position: { x: rightHandleX, y: -0.05, z: side * (panelD / 2 + 0.02) }
      }, {
        material: registry.materials.trim, parent: rightHinge
      });

      createBox(registry, `door_handle_stem_right_${side}_${opening.id}`, {
        width: 0.015, height: 0.015, depth: 0.02
      }, {
        position: { x: rightHandleX, y: -0.05, z: side * (panelD / 2 + 0.01) }
      }, {
        material: registry.materials.trim, parent: rightHinge
      });
    });

  } else {
    const hingeX = isFlippedLR ? (width / 2 - frameW) : (-width / 2 + frameW);
    const hinge = new BABYLON.TransformNode(`door_hinge_${opening.id}`, registry.scene);
    hinge.parent = parent;
    hinge.position.set(hingeX, 0, 0);
    hinge.rotation.y = opening.isOpen ? (isFlippedLR === isFlippedIO ? -Math.PI / 2 : Math.PI / 2) : 0;

    if (opening.panelHidden) return;

    const panelD = 0.04;
    const scaleX = Math.max(0.1, (width - frameW * 2) / width);
    const scaleY = Math.max(0.1, (height - frameW * 2) / height);
    const panelMesh = createOpeningProfileMesh(registry, `door_panel_${opening.id}`, opening, hinge, {
      width,
      height,
      depth: panelD,
      scaleX,
      scaleY,
      offsetX: -hingeX,
      material: panelMat,
      shadowCaster: true
    });
    panelMesh.metadata = { ...panelMesh.metadata, blueprintOpeningComponentId: 'panel' };

    buildOpeningBars(registry, opening, hinge, {
      width,
      height,
      frameW,
      barDepth: panelD + 0.012,
      material: mullionMat,
      offsetX: -hingeX
    });

    const handleD = 0.02;
    const handleH = 0.12;
    const handleX = (isFlippedLR ? -1 : 1) * (width - frameW * 2 - 0.08);
    [-1, 1].forEach((side) => {
      createCylinder(registry, `door_handle_${side}_${opening.id}`, {
        diameterTop: handleD, diameterBottom: handleD, height: handleH, tessellation: 8
      }, {
        position: { x: handleX, y: -0.05, z: side * (panelD / 2 + 0.02) }
      }, {
        material: registry.materials.trim, parent: hinge
      });

      createBox(registry, `door_handle_stem_${side}_${opening.id}`, {
        width: 0.015, height: 0.015, depth: 0.02
      }, {
        position: { x: handleX, y: -0.05, z: side * (panelD / 2 + 0.01) }
      }, {
        material: registry.materials.trim, parent: hinge
      });
    });
  }
}
