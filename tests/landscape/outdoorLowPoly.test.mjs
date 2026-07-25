import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import * as outdoorModule from '../../src/furniture/outdoor.js';

const outdoorDefinitions = Object.values(outdoorModule).filter((value) => value?.type && typeof value.build === 'function');

test('outdoor models share the soft low-poly palette without changing their public definitions', () => {
  assert.equal(outdoorDefinitions.length, 25);

  const paletteColors = new Set(Object.values(outdoorModule.SOFT_LOW_POLY_OUTDOOR_PALETTE));
  assert.ok(paletteColors.size >= 12, 'palette should cover wood, fabric, stone, metal, plants and water');

  for (const definition of outdoorDefinitions) {
    assert.ok(definition.defaultSize?.width > 0, `${definition.type} should retain a valid size`);
    assert.ok(definition.defaultSize?.depth > 0, `${definition.type} should retain a valid depth`);
    assert.ok(definition.defaultSize?.height > 0, `${definition.type} should retain a valid height`);
    assert.ok(definition.components.length > 0, `${definition.type} should retain editable components`);
    for (const component of definition.components) {
      assert.ok(paletteColors.has(component.defaultColor), `${definition.type}.${component.id} should use the shared palette`);
    }
  }
});
test('outdoor curved primitives stay faceted and water controls stay scoped', async () => {
  const source = await readFile(new URL('../../src/furniture/outdoor.js', import.meta.url), 'utf8');
  const tessellations = [...source.matchAll(/tessellation:\s*(\d+)/g)].map((match) => Number(match[1]));

  assert.ok(tessellations.length > 0);
  assert.ok(Math.max(...tessellations) <= 12, 'curved outdoor primitives should remain visibly low-poly');

  const waterTypes = outdoorDefinitions.filter((definition) => definition.waterControllable).map((definition) => definition.type).sort();
  assert.deepEqual(waterTypes, [
    'birdbath',
    'garden_fountain',
    'landscape_euro_pond_sculpture',
    'landscape_marble_fountain'
  ]);
});
