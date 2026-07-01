import { createBlueprintMaterial } from '../core/materials.js';
import { buildOpeningFrame, createOpeningPickProxy, createOpeningProfileMesh } from './geometry.js';

export function buildWindowOpening(registry, opening, parent, options = {}) {
  const width = options.width || opening.width || 1.25;
  const height = options.height || opening.height || 0.85;
  const frameT = options.frameT || 0.2;
  const frameW = options.frameW || 0.04;
  // 支持 per-opening 自定义材质
  const frameMat = opening.frameMaterial
    ? createBlueprintMaterial(registry.scene, `win_frame_${opening.id}`, opening.frameMaterial)
    : registry.materials.trim;
  const glassMat = opening.glassMaterial
    ? createBlueprintMaterial(registry.scene, `win_glass_mat_${opening.id}`, opening.glassMaterial)
    : registry.materials.window;

  buildOpeningFrame(registry, opening, parent, {
    width,
    height,
    frameT,
    frameW,
    material: frameMat
  });
  createOpeningPickProxy(registry, opening, parent, { width, height, depth: frameT * 0.8 });

  if (opening.glassHidden) return;

  const glassMesh = createOpeningProfileMesh(registry, `win_glass_${opening.id}`, opening, parent, {
    width,
    height,
    depth: 0.012,
    scaleX: Math.max(0.1, (width - frameW * 2) / width),
    scaleY: Math.max(0.1, (height - frameW * 2) / height),
    material: glassMat,
    shadowCaster: false
  });
  glassMesh.metadata = { ...glassMesh.metadata, blueprintOpeningComponentId: 'glass' };
}
