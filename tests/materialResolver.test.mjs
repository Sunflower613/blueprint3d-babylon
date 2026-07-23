import assert from 'node:assert/strict';
import test from 'node:test';
import { MaterialResolver } from '../src/domain/MaterialResolver.js';
import { resolveMaterialAssetDescriptor } from '../src/core/materialAssets.js';

test('MaterialResolver maps all wall shader surfaces consistently', () => {
  const expected = {
    'front:main': ['materialFront', 'colorFront'],
    'front:baseboard': ['baseboardMaterialFront', 'baseboardColorFront'],
    'front:wainscot': ['wainscotMaterialFront', 'wainscotColorFront'],
    'back:main': ['materialBack', 'colorBack'],
    'back:baseboard': ['baseboardMaterialBack', 'baseboardColorBack'],
    'back:wainscot': ['wainscotMaterialBack', 'wainscotColorBack']
  };

  for (const [key, [materialField, colorField]] of Object.entries(expected)) {
    const [side, component] = key.split(':');
    assert.deepEqual(MaterialResolver.getWallSurfaceFields(side, component), { materialField, colorField });
    assert.deepEqual(
      MaterialResolver.buildWallSurfacePatch(side, component, `${key}-material`, `${key}-color`),
      { [materialField]: `${key}-material`, [colorField]: `${key}-color` }
    );
  }
});

test('MaterialResolver applies wall decoration defaults and preserves selected materials', () => {
  const wall = MaterialResolver.normalizeWallDecorSettings({
    baseboardColorFront: '#112233',
    wainscotMaterialBack: { kind: 'color', color: '#445566' }
  });

  assert.equal(wall.baseboardEnabled, false);
  assert.equal(wall.baseboardHeight, 0.1);
  assert.equal(wall.wainscotEnabled, false);
  assert.equal(wall.wainscotHeight, 1);
  assert.equal(wall.baseboardMaterialFront, '#112233');
  assert.equal(wall.baseboardColorFront, '#112233');
  assert.equal(wall.wainscotColorBack, '#445566');
});

test('domain material normalization does not rewrite texture asset URLs', () => {
  const source = 'legacy/materials/light_fine_wood.jpg';
  const normalized = MaterialResolver.normalizeMaterialDescriptor({
    id: 'wood-light-fine',
    kind: 'texture',
    src: source,
    color: '#ffffff'
  });

  assert.equal(normalized.src, source);
  const runtimeDescriptor = resolveMaterialAssetDescriptor(normalized);
  assert.notEqual(runtimeDescriptor.src, source);
  assert.match(runtimeDescriptor.src, /light_fine_wood/);
});

test('pattern scaling remains deterministic after resolver extraction', () => {
  assert.deepEqual(
    MaterialResolver.resolvePatternTextureScale(
      { kind: 'texture', category: 'wallpaper' },
      { surfaceWidth: 9, surfaceHeight: 1 },
      2
    ),
    { uScale: 10, vScale: 2 }
  );
});

test('resolveMaterialAssetDescriptor correctly updates legacy hardcoded port URLs to current runtime asset path', () => {
  const legacyPortUrl = 'http://localhost:3000/blueprint3d-babylon/src/textures/brick_diamond.jpg';
  const resolved = resolveMaterialAssetDescriptor({
    kind: 'texture',
    src: legacyPortUrl
  });

  assert.notEqual(resolved.src, legacyPortUrl);
  assert.match(resolved.src, /brick_diamond\.jpg/);
});

test('resolveMaterialAssetDescriptor strips cross-origin origins to prevent CORS errors', () => {
  const crossOriginUrl = 'https://3000thvvtest.frp.pengyg.top/blueprint3d-babylon/example/assets/wood_plank_oak_light-BxwmhA5Q.jpg';
  
  // 模拟浏览器 window.location.origin
  globalThis.window = {
    location: {
      origin: 'http://localhost:3001',
      href: 'http://localhost:3001/'
    }
  };

  try {
    const resolved = resolveMaterialAssetDescriptor({
      kind: 'texture',
      src: crossOriginUrl
    });
    assert.doesNotMatch(resolved.src, /^https:\/\/3000thvvtest\.frp\.pengyg\.top/);
    assert.match(resolved.src, /wood_plank_oak_light/);
  } finally {
    delete globalThis.window;
  }
});

