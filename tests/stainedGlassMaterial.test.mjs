import * as BABYLON from '@babylonjs/core';
import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_MATERIAL_PACKS, createTextureMaterialDescriptor } from '../src/core/materialCatalog.js';
import { createBlueprintMaterial, normalizeMaterialDescriptor } from '../src/core/materials.js';

test('catalog exposes the cathedral stained-glass material', () => {
  const material = DEFAULT_MATERIAL_PACKS.find((entry) => entry.id === 'glass-stained-cathedral');

  assert.ok(material);
  assert.equal(material.category, 'glass');
  assert.equal(material.kind, 'stained-glass');
  assert.ok(material.patternScale >= 1 && material.patternScale < 1.5);
  assert.ok(material.emissiveStrength > 0 && material.emissiveStrength < 0.3);
});

test('stained-glass descriptor keeps its transparency and pattern controls', () => {
  const normalized = normalizeMaterialDescriptor({
    id: 'custom-stained-glass',
    kind: 'stained-glass',
    alpha: 0.64,
    patternScale: 3.1,
    emissiveStrength: 0.12
  });

  assert.equal(normalized.kind, 'stained-glass');
  assert.equal(normalized.category, 'glass');
  assert.equal(normalized.alpha, 0.64);
  assert.equal(normalized.patternScale, 3.1);
  assert.equal(normalized.emissiveStrength, 0.12);
});

test('catalog exposes eight common wood textures and no flat wood color', () => {
  const woodMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'wood');

  assert.equal(woodMaterials.length, 8);
  assert.deepEqual(
    woodMaterials.map((entry) => entry.id),
    [
      'wood-light-fine',
      'wood-light-oak',
      'wood-ash',
      'wood-maple',
      'wood-pine',
      'wood-teak',
      'wood-cherry',
      'wood-walnut'
    ]
  );

  woodMaterials.forEach((material) => {
    assert.equal(material.kind, 'texture');
    assert.ok(String(material.src).includes('light_fine_wood.jpg'));
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
  });
});

test('texture material descriptors preserve id and tint color', () => {
  const descriptor = createTextureMaterialDescriptor({
    id: 'custom-wood',
    name: 'Custom Wood',
    category: 'wood',
    src: 'data:image/png;base64,abc',
    scale: 2,
    color: '#cfa17a'
  });

  assert.equal(descriptor.id, 'custom-wood');
  assert.equal(descriptor.kind, 'texture');
  assert.equal(descriptor.category, 'wood');
  assert.equal(descriptor.color, '#cfa17a');
  assert.equal(descriptor.scale, 2);
});

test('floor texture materials keep their selected tint after texture load', async () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const color = '#8a5c3b';
  const textureDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO7EAAAAASUVORK5CYII=';

  try {
    const material = createBlueprintMaterial(scene, 'floor_tinted_texture', {
      kind: 'texture',
      src: textureDataUrl,
      color,
      scale: 1
    }, {
      isFloor: true,
      fallbackColor: color
    });

    for (let attempt = 0; attempt < 50 && !material.diffuseTexture; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.ok(material.diffuseTexture, 'texture should load for floor materials');
    const expected = BABYLON.Color3.FromHexString(color).scale(0.85);
    assert.ok(Math.abs(material.diffuseColor.r - expected.r) < 1e-6);
    assert.ok(Math.abs(material.diffuseColor.g - expected.g) < 1e-6);
    assert.ok(Math.abs(material.diffuseColor.b - expected.b) < 1e-6);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
