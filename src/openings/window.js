import { createBox } from '../core/primitives.js';

export function buildWindowOpening(registry, opening, parent, options = {}) {
  const width = options.width || opening.width || 1.25;
  const height = options.height || opening.height || 0.85;
  const frameT = options.frameT || 0.2;
  const frameW = options.frameW || 0.04;
  const frameMat = registry.materials.trim;
  const windowMat = registry.materials.window;

  createBox(registry, `win_frame_l_${opening.id}`, {
    width: frameW, height, depth: frameT
  }, {
    position: { x: -width / 2 + frameW / 2, y: 0, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  createBox(registry, `win_frame_r_${opening.id}`, {
    width: frameW, height, depth: frameT
  }, {
    position: { x: width / 2 - frameW / 2, y: 0, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  createBox(registry, `win_frame_t_${opening.id}`, {
    width: width - frameW * 2, height: frameW, depth: frameT
  }, {
    position: { x: 0, y: height / 2 - frameW / 2, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  createBox(registry, `win_frame_b_${opening.id}`, {
    width: width - frameW * 2, height: frameW, depth: frameT
  }, {
    position: { x: 0, y: -height / 2 + frameW / 2, z: 0 }
  }, {
    material: frameMat, parent, shadowCaster: false
  });

  createBox(registry, `win_glass_${opening.id}`, {
    width: width - frameW * 2, height: height - frameW * 2, depth: 0.012
  }, {
    position: { x: 0, y: 0, z: 0 }
  }, {
    material: windowMat, parent, shadowCaster: false
  });
}
