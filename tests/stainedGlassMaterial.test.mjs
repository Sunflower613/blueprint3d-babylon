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

test('catalog exposes nine uploaded wood textures without duplicate placeholders', () => {
  const woodMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'wood');

  assert.equal(woodMaterials.length, 9);
  assert.deepEqual(
    woodMaterials.map((entry) => entry.id),
    [
      'wood-panel-moulding-light',
      'wood-fluted-oak-light',
      'wood-herringbone-oak-light',
      'wood-plank-oak-light',
      'wood-oak-natural-light',
      'wood-butcher-block-light',
      'wood-basket-parquet-light',
      'wood-chevron-oak-light',
      'wood-diagonal-plank-light'
    ]
  );
  assert.equal(new Set(woodMaterials.map((material) => material.src)).size, 9);

  woodMaterials.forEach((material) => {
    assert.equal(material.kind, 'texture');
    assert.match(String(material.src), /wood_(panel|fluted|herringbone|plank|oak|butcher|basket|chevron|diagonal)/);
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
  });
});

test('catalog exposes tintable stone textures and no flat stone color', () => {
  const stoneMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'stone');

  assert.equal(stoneMaterials.length, 11);
  assert.deepEqual(
    stoneMaterials.map((entry) => entry.id),
    [
      'stone-grass',
      'stone-earth',
      'stone-sand',
      'stone-sand-stone',
      'stone-fine-sand',
      'stone-natural',
      'stone-joint',
      'stone-road',
      'stone-rock',
      'stone-terrazzo',
      'stone-white-sand'
    ]
  );

  stoneMaterials.forEach((material) => {
    assert.equal(material.kind, 'texture');
    assert.ok(
      String(material.src).includes('stone_earth') ||
      String(material.src).includes('stone_sand') ||
      String(material.src).includes('stone_sand_stone') ||
      String(material.src).includes('stone_fine_sand') ||
      String(material.src).includes('stone.jpg') ||
      String(material.src).includes('stone_joint') ||
      String(material.src).includes('stone_road') ||
      String(material.src).includes('stone_rock') ||
      String(material.src).includes('stone_terrazzo') ||
      String(material.src).includes('stone_white_sand') ||
      String(material.src).includes('stone_grass')
    );
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
  });
});

test('catalog exposes brick textures', () => {
  const brickMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'brick');

  assert.equal(brickMaterials.length, 12);
  assert.deepEqual(
    brickMaterials.map((entry) => entry.id),
    [
      'brick-marble-warm',
      'brick-grey-gloss-marble',
      'brick-marble-tiles',
      'brick-light',
      'brick-red',
      'brick-cube',
      'brick-diamond',
      'brick-square',
      'brick-stone',
      'brick-mosaic',
      'brick-black-white',
      'brick-small-black'
    ]
  );

  brickMaterials.forEach((material) => {
    assert.equal(material.kind, 'texture');
    assert.ok(String(material.src).includes('brick_'));
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
  });

  const reflectiveBrickMaterials = brickMaterials.filter((material) => material.reflective);
  assert.equal(reflectiveBrickMaterials.length, 1);
  reflectiveBrickMaterials.forEach((material) => {
    assert.ok(String(material.src).includes('brick_marble_grey_gloss.jpg'));
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

test('catalog exposes seventeen wallpaper textures including five built-in posters', () => {
  const wallpaperMaterials = DEFAULT_MATERIAL_PACKS.filter((entry) => entry.category === 'wallpaper');
  const wallpaperTextures = wallpaperMaterials.filter((entry) => entry.kind === 'texture');

  assert.equal(wallpaperTextures.length, 17);
  assert.deepEqual(
    wallpaperTextures.map((entry) => entry.id),
    [
      'wallpaper-rose',
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
      'wallpaper-seigaiha-blush',
      'poster-abstract-arches',
      'poster-botanical-sage',
      'poster-bauhaus-primary',
      'poster-mountain-sunrise',
      'poster-celestial-moons'
    ]
  );

  wallpaperTextures.forEach((material) => {
    assert.equal(material.category, 'wallpaper');
    assert.equal(material.kind, 'texture');
    assert.ok(
      String(material.src).includes('wallmap_yellow.png') ||
      String(material.src).includes('wallpaper_') ||
      String(material.src).includes('poster_')
    );
    assert.ok(/^#[0-9a-f]{6}$/i.test(material.color));
    assert.ok([...material.name].length <= 4, `${material.id} should use a short display name`);
  });
});

test('built-in texture materials use concise display names', () => {
  DEFAULT_MATERIAL_PACKS
    .filter((material) => material.kind === 'texture')
    .forEach((material) => {
      assert.ok([...material.name].length <= 4, `${material.id} should use a short display name`);
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
    src: 'brick_marble_grey_gloss.jpg',
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
  assert.ok(String(normalized.src).includes('brick_marble_grey_gloss.jpg'));
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
