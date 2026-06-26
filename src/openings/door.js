import * as BABYLON from '@babylonjs/core';
import { createBox, createCylinder } from '../core/primitives.js';

export function buildDoorOpening(registry, opening, parent, options = {}) {
  const width = options.width || opening.width || 0.9;
  const height = options.height || 2.05;
  const frameT = options.frameT || 0.2;
  const frameW = options.frameW || 0.04;
  const frameMat = registry.materials.trim || registry.materials.door;
  const doorMat = registry.materials.door;

  createBox(registry, `door_frame_l_${opening.id}`, {
    width: frameW, height, depth: frameT
  }, {
    position: { x: -width / 2 + frameW / 2, y: 0, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  createBox(registry, `door_frame_r_${opening.id}`, {
    width: frameW, height, depth: frameT
  }, {
    position: { x: width / 2 - frameW / 2, y: 0, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  createBox(registry, `door_frame_t_${opening.id}`, {
    width: width - frameW * 2, height: frameW, depth: frameT
  }, {
    position: { x: 0, y: height / 2 - frameW / 2, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  const isFlippedLR = !!opening.isFlippedLR;
  const isFlippedIO = !!opening.isFlippedIO;
  const hinge = new BABYLON.TransformNode(`door_hinge_${opening.id}`, registry.scene);
  hinge.parent = parent;
  hinge.position.set(isFlippedLR ? (width / 2 - frameW) : (-width / 2 + frameW), 0, 0);
  hinge.rotation.y = opening.isOpen ? (isFlippedLR === isFlippedIO ? -Math.PI / 2 : Math.PI / 2) : 0;

  const panelW = width - frameW * 2;
  const panelH = height - frameW;
  const panelD = 0.04;
  const panelX = isFlippedLR ? -panelW / 2 : panelW / 2;
  createBox(registry, `door_panel_${opening.id}`, {
    width: panelW, height: panelH, depth: panelD
  }, {
    position: { x: panelX, y: -frameW / 2, z: 0 }
  }, {
    material: doorMat, parent: hinge, shadowCaster: true
  });

  const handleD = 0.02;
  const handleH = 0.12;
  const handleX = isFlippedLR ? (-panelW + 0.08) : (panelW - 0.08);
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
