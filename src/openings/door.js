import { CSG, MeshBuilder, TransformNode } from '../core/babylon.js';
const BABYLON = { CSG, MeshBuilder, TransformNode };
import { createBox, createCylinder } from '../core/primitives.js';
import { createBlueprintMaterial } from '../core/materials.js';
import { buildOpeningFrame, createOpeningPickProxy, createOpeningProfileMesh } from './geometry.js';
import { isSymmetricShape } from './openingShapes.js';

export function buildDoorOpening(registry, opening, parent, options = {}) {
  const width = options.width || opening.width || 0.9;
  const height = options.height || opening.height || 2.05;
  const frameT = options.frameT || 0.2;
  const frameW = options.frameW || 0.04;
  // 支持 per-opening 自定义材质（优先使用自定义，否则使用全局默认）
  const frameMat = opening.frameMaterial
    ? createBlueprintMaterial(registry.scene, `door_frame_${opening.id}`, opening.frameMaterial)
    : (registry.materials.trim || registry.materials.door);
  const panelMat = opening.panelMaterial
    ? createBlueprintMaterial(registry.scene, `door_panel_${opening.id}`, opening.panelMaterial)
    : registry.materials.door;

  buildOpeningFrame(registry, opening, parent, {
    width,
    height,
    frameT,
    frameW,
    material: frameMat,
    skipBottom: true
  });
  createOpeningPickProxy(registry, opening, parent, { width, height, depth: frameT * 0.8 });

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

    const dummyRegistry = {
      scene: registry.scene,
      add(mesh) { return mesh; }
    };
    const fullPanelMesh = createOpeningProfileMesh(dummyRegistry, `temp_full_panel_${opening.id}`, opening, null, {
      width,
      height,
      depth: panelD,
      scaleX,
      scaleY,
      offsetX: 0,
      material: null,
      shadowCaster: false
    });
    fullPanelMesh.visibility = 0;

    const fullCSG = BABYLON.CSG.FromMesh(fullPanelMesh);

    const cutWidth = width * 1.5;
    const cutHeight = height * 1.5;
    const cutDepth = panelD * 2;

    const leftCutter = BABYLON.MeshBuilder.CreateBox("left_cutter", { width: cutWidth, height: cutHeight, depth: cutDepth }, registry.scene);
    leftCutter.position.set(cutWidth / 2, 0, 0);
    leftCutter.computeWorldMatrix(true);
    const leftCutterCSG = BABYLON.CSG.FromMesh(leftCutter);

    const rightCutter = BABYLON.MeshBuilder.CreateBox("right_cutter", { width: cutWidth, height: cutHeight, depth: cutDepth }, registry.scene);
    rightCutter.position.set(-cutWidth / 2, 0, 0);
    rightCutter.computeWorldMatrix(true);
    const rightCutterCSG = BABYLON.CSG.FromMesh(rightCutter);

    const leftPanelCSG = fullCSG.subtract(leftCutterCSG);
    const rightPanelCSG = fullCSG.subtract(rightCutterCSG);

    const leftPanelMesh = leftPanelCSG.toMesh(`door_panel_left_${opening.id}`, panelMat, registry.scene);
    const rightPanelMesh = rightPanelCSG.toMesh(`door_panel_right_${opening.id}`, panelMat, registry.scene);

    registry.add(leftPanelMesh, { parent: leftHinge, shadowCaster: true });
    registry.add(rightPanelMesh, { parent: rightHinge, shadowCaster: true });

    leftPanelMesh.metadata = { ...leftPanelMesh.metadata, blueprintOpeningComponentId: 'panel' };
    rightPanelMesh.metadata = { ...rightPanelMesh.metadata, blueprintOpeningComponentId: 'panel' };

    leftPanelMesh.position.set(-leftHingeX, 0, 0);
    rightPanelMesh.position.set(-rightHingeX, 0, 0);

    fullPanelMesh.dispose();
    leftCutter.dispose();
    rightCutter.dispose();

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
