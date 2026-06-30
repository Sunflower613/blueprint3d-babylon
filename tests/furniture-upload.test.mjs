import assert from 'node:assert/strict';
import test from 'node:test';
import createFurniture from '../example/downloads/custom-furniture-example.js';

test('downloadable furniture example satisfies the upload contract', () => {
  const calls = [];
  const boxComponent = (...args) => calls.push(args);
  const definition = createFurniture({ boxComponent });

  assert.equal(definition.type, 'custom_sofa');
  assert.equal(definition.name, '\u4e91\u6735\u6c99\u53d1');
  assert.deepEqual(definition.defaultSize, { width: 84, depth: 36, height: 32 });
  assert.deepEqual(definition.components.map(component => component.id), ['seat', 'back', 'arms', 'legs']);
  assert.equal(typeof definition.build, 'function');

  const registry = {};
  const item = { id: 'uploaded_item' };
  const node = {};
  definition.build(registry, item, node, definition.defaultSize);

  assert.equal(calls.length, 8);
  calls.forEach((args) => {
    assert.equal(args[0], registry);
    assert.equal(args[1], item);
    assert.equal(args[2], definition);
    assert.equal(args[6].parent, node);
  });
});
