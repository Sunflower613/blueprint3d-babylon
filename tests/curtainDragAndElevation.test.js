import { test } from 'node.test';
import assert from 'node:assert/strict';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { getFurnitureDefinition } from '../src/furniture/index.js';
import { snapToGridSegmentCenter } from '../src/editor/Topology.js';

test('窗帘离地高度及对齐网格逻辑测试', async (t) => {
  await t.test('所有窗帘家具定义离地属性及默认配置支持 0 离地', () => {
    const curtainDef = getFurnitureDefinition('curtain');
    const singleCurtainDef = getFurnitureDefinition('single_blackout_curtain');

    assert.equal(curtainDef.placeType, 'wall');
    assert.equal(singleCurtainDef.placeType, 'wall');

    const doc = new FloorplanDocument();
    doc.loadFloorplan({
      unit: 'm',
      floors: [{ id: 'floor_1', level: 0 }],
      currentFloorId: 'floor_1',
      rooms: [],
      items: []
    });

    const curtainItem = doc.addItem({
      type: 'curtain',
      x: 0,
      z: 0,
      elevation: 0
    });

    assert.equal(curtainItem.elevation, 0);
  });

  await t.test('snapToGridSegmentCenter 能正确将坐标计算为门窗同款半网格点', () => {
    const snapEnabled = true;
    const snapSize = 0.5;

    // 假设原始拖拽坐标在 (1.12, 2.38)
    const rawPoint = { x: 1.12, z: 2.38 };
    const snapped = snapToGridSegmentCenter(rawPoint, snapEnabled, snapSize);

    // snapToGridSegmentCenter 会将坐标吸附到最近的半网格步长
    assert.equal(snapped.x % 0.25 === 0 || snapped.x % 0.5 === 0, true);
    assert.equal(snapped.z % 0.25 === 0 || snapped.z % 0.5 === 0, true);
  });
});
