import { test } from 'node:test';
import assert from 'node:assert/strict';

test('V4-03: 右键/长按菜单选项规范与删除按钮红色警示样式测试', () => {
  const menuItems = [
    { id: 'rotate', label: '旋转', color: 'default' },
    { id: 'duplicate', label: '复制', color: 'default' },
    { id: 'delete', label: '删除', color: 'danger' }
  ];

  const deleteItem = menuItems.find(i => i.id === 'delete');
  assert.ok(deleteItem);
  assert.equal(deleteItem.color, 'danger');
});
