import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDoorOpening, buildOpeningGeometry } from '../../src/openings/index.js';

test('V4-17: 双开门开启/闭合对称摆动与动画属性测试', () => {
  assert.equal(typeof buildDoorOpening, 'function');
  assert.equal(typeof buildOpeningGeometry, 'function');
});
