import { test } from 'node:test';
import assert from 'node:assert/strict';

test('V4-04: 工具模式与鼠标光标 Cursor 对应关系测试', () => {
  const getToolCursor = (toolMode) => {
    switch (toolMode) {
      case 'wall': return 'crosshair';
      case 'furniture': return 'move';
      case 'brush': return 'pointer';
      default: return 'default';
    }
  };

  assert.equal(getToolCursor('wall'), 'crosshair');
  assert.equal(getToolCursor('furniture'), 'move');
  assert.equal(getToolCursor('brush'), 'pointer');
});
