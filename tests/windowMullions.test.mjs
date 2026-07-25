import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../src/domain/FloorplanDocument.js';
import { buildWindowMullions } from '../src/openings/geometry.js';

describe('窗户横条与竖条 (Mullions) 计算与绘制', () => {
  it('正确保存与更新窗户的 horizontalBars 和 verticalBars 属性', () => {
    const doc = new FloorplanDocument({
      walls: [
        { id: 'w1', from: [0, 0], to: [5, 0] }
      ],
      openings: [
        { id: 'win1', type: 'window', wallId: 'w1', t: 0.5, width: 1.2, height: 1.5, horizontalBars: 2, verticalBars: 3 }
      ]
    });

    const win1 = doc.getOpening('win1');
    assert.equal(win1.horizontalBars, 2);
    assert.equal(win1.verticalBars, 3);

    doc.updateOpening('win1', { horizontalBars: 4, verticalBars: 1 });
    assert.equal(win1.horizontalBars, 4);
    assert.equal(win1.verticalBars, 1);

    doc.updateOpeningMaterial('win1', 'mullion', '#ff0000');
    assert.equal(win1.mullionMaterial.color, '#ff0000');

    const copyData = JSON.parse(JSON.stringify(win1));
    delete copyData.id;
    delete copyData.wallId;
    const win2 = doc.addOpening('w1', 'window', 0.8);
    doc.updateOpening(win2.id, copyData);
    assert.equal(win2.horizontalBars, 4);
    assert.equal(win2.verticalBars, 1);
    assert.equal(win2.mullionMaterial.color, '#ff0000');
  });

  it('在 buildWindowMullions 中生成对应数量的横向与竖向 3D 节点', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const createdMeshes = [];
    const registry = {
      scene,
      materials: { trim: null },
      add(mesh) {
        createdMeshes.push(mesh);
        return mesh;
      }
    };

    const opening = {
      id: 'test_win',
      type: 'window',
      shape: 'square',
      width: 1.2,
      height: 1.0,
      horizontalBars: 2,
      verticalBars: 2
    };

    const parent = new BABYLON.TransformNode('parent', scene);
    buildWindowMullions(registry, opening, parent, { frameW: 0.04 });

    const hbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'hbar');
    const vbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'vbar');

    assert.equal(hbars.length, 2, '应当生成 2 条横向木条');
    assert.equal(vbars.length, 2, '应当生成 2 条竖向木条');

    engine.dispose();
  });

  it('完美支持拱形窗（round-arch）下的木条自适应对齐与切割', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const createdMeshes = [];
    const registry = {
      scene,
      materials: { trim: null },
      add(mesh) {
        createdMeshes.push(mesh);
        return mesh;
      }
    };

    const opening = {
      id: 'arch_win',
      type: 'window',
      shape: 'round-arch',
      width: 1.2,
      height: 1.5,
      horizontalBars: 1,
      verticalBars: 2
    };

    const parent = new BABYLON.TransformNode('parent', scene);
    buildWindowMullions(registry, opening, parent, { frameW: 0.04 });

    const hbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'hbar');
    const vbars = createdMeshes.filter((m) => m.metadata?.blueprintOpeningComponentId === 'vbar');

    assert.equal(hbars.length, 1);
    assert.equal(vbars.length, 2);

    engine.dispose();
  });
});
