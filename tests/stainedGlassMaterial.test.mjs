import * as BABYLON from '@babylonjs/core';
import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_MATERIAL_PACKS, createTextureMaterialDescriptor } from '../src/core/materialCatalog.js';
import { createBlueprintMaterial, normalizeMaterialDescriptor, resolvePatternTextureScale } from '../src/core/materials.js';

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

test('catalog exposes tintable stone textures and no flat stone color', () => {
  const stoneMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'stone');

  assert.equal(stoneMaterials.length, 16);
  assert.deepEqual(
    stoneMaterials.map((entry) => entry.id),
    [
      'stone-light',
      'stone-ivory-marble',
      'stone-mist-marble',
      'stone-sand-marble',
      'stone-marbletiles',
      'stone-marble-ivory',
      'stone-marble-ash',
      'stone-marble-sand',
      'stone-light-brick',
      'stone-cream-brick',
      'stone-rustic-brick',
      'stone-clay-brick',
      'stone-grey-gloss',
      'stone-cloud-gloss',
      'stone-mist-gloss',
      'stone-slate-gloss'
    ]
  );

  stoneMaterials.forEach((material) => {
    assert.equal(material.kind, 'texture');
    assert.ok(
      String(material.src).includes('marbletiles.jpg') ||
      String(material.src).includes('light_brick.jpg') ||
      String(material.src).includes('stone_marble_warm.jpg') ||
      String(material.src).includes('stone_marble_grey_gloss.jpg')
    );
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
  });

  assert.equal(stoneMaterials.filter((material) => String(material.src).includes('stone_marble_warm.jpg')).length, 4);
  assert.equal(stoneMaterials.filter((material) => String(material.src).includes('marbletiles.jpg')).length, 4);
  assert.equal(stoneMaterials.filter((material) => String(material.src).includes('light_brick.jpg')).length, 4);
  assert.equal(stoneMaterials.filter((material) => String(material.src).includes('stone_marble_grey_gloss.jpg')).length, 4);

  const reflectiveStoneMaterials = stoneMaterials.filter((material) => material.reflective);
  assert.equal(reflectiveStoneMaterials.length, 4);
  reflectiveStoneMaterials.forEach((material) => {
    assert.ok(String(material.src).includes('stone_marble_grey_gloss.jpg'));
    assert.ok(material.reflectionLevel > 0.5);
    assert.ok(material.specularStrength > 0.7);
    assert.ok(material.specularPower >= 96);
  });
});

test('catalog exposes five fabric textures', () => {
  const fabricMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'fabric');

  assert.equal(fabricMaterials.length, 5);
  assert.deepEqual(
    fabricMaterials.map((entry) => entry.id),
    [
      'fabric-rope-cable-beige',
      'fabric-knit-cable-grey',
      'fabric-knit-cable-white',
      'fabric-knit-chevron-cream',
      'fabric-weave-dark'
    ]
  );

  fabricMaterials.forEach((material) => {
    assert.equal(material.kind, 'texture');
    assert.ok(String(material.src).includes('fabric_'));
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
    assert.ok(material.scale >= 2 && material.scale <= 2.5);
  });
});

test('catalog exposes eleven wallpaper textures including the new Chinese-style patterns', () => {
  const wallpaperMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'wallpaper');
  const wallpaperTextures = wallpaperMaterials.filter((entry) => entry.kind === 'texture');

  assert.equal(wallpaperTextures.length, 11);
  assert.deepEqual(
    wallpaperTextures.map((entry) => entry.id),
    [
      'wallpaper-yellow-flower',
      'wallpaper-leaf-bluegrey',
      'wallpaper-paisley-orange',
      'wallpaper-fan-gold',
      'wallpaper-stripe-teal-pink',
      'wallpaper-damask-olive',
      'wallpaper-ink-bamboo-mist',
      'wallpaper-cloud-navy-gold',
      'wallpaper-ruyi-swirl-yellow',
      'wallpaper-floral-blue-white',
      'wallpaper-seigaiha-blush'
    ]
  );

  wallpaperTextures.forEach((material) => {
    assert.equal(material.category, 'wallpaper');
    assert.equal(material.kind, 'texture');
    assert.ok(
      String(material.src).includes('wallmap_yellow.png') ||
      String(material.src).includes('wallpaper_')
    );
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
  });
});

test('wallpaper textures repeat on long surfaces instead of stretching across the full span', () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    const material = createBlueprintMaterial(scene, 'wallpaper_long_surface', {
      kind: 'texture',
      category: 'wallpaper',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO7EAAAAASUVORK5CYII=',
      color: '#ffffff',
      scale: 1
    }, {
      surfaceWidth: 10,
      surfaceHeight: 2,
      fallbackColor: '#ffffff'
    });

    assert.ok(material.diffuseTexture);
    assert.ok(Math.abs(material.diffuseTexture.uScale - (10 / 2 / 1.8)) < 1e-6);
    assert.equal(material.diffuseTexture.vScale, 1);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});

test('stained glass patterns cap stretching on tall panes', () => {
  const scale = resolvePatternTextureScale({
    kind: 'stained-glass',
    patternScale: 1.1
  }, {
    surfaceWidth: 1,
    surfaceHeight: 4
  }, 1.1);

  assert.equal(scale.uScale, 1.1);
  assert.ok(Math.abs(scale.vScale - (1.1 * (4 / 1.8))) < 1e-6);
});

test('reflective texture descriptors keep reflection controls', () => {
  const normalized = normalizeMaterialDescriptor({
    id: 'stone-glossy-test',
    kind: 'texture',
    src: 'stone_marble_grey_gloss.jpg',
    color: '#cfd5dc',
    reflective: true,
    reflectionLevel: 0.58,
    specularStrength: 0.74,
    specularPower: 120
  });

  assert.equal(normalized.kind, 'texture');
  assert.equal(normalized.reflective, true);
  assert.equal(normalized.reflectionLevel, 0.58);
  assert.equal(normalized.specularStrength, 0.74);
  assert.equal(normalized.specularPower, 120);
  assert.ok(String(normalized.src).includes('stone_marble_grey_gloss.jpg'));
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
