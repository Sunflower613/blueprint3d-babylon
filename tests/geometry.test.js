import assert from 'node:assert';
import { test } from 'node:test';
import { getRoofGeometryData, getRoofFramePaths } from '../src/geometry/roofGeometry.js';
import { getRoofFramePaths as getRoofFramePathsFromApi } from '../src/api/index.js';

test('getRoofFramePaths 支持由公开门面导入并正确导出', () => {
  assert.strictEqual(typeof getRoofFramePathsFromApi, 'function');
  assert.strictEqual(getRoofFramePathsFromApi, getRoofFramePaths);
});

test('getRoofFramePaths - 拱形顶 (arch) 按 1m 步长生成骨架线段路径', () => {
  const width = 4;
  const depth = 3;
  const height = 2;
  const paths = getRoofFramePaths('arch', width, depth, height, 0, 1.0);

  assert.ok(Array.isArray(paths));
  assert.ok(paths.length > 0);

  paths.forEach((path) => {
    assert.ok(Array.isArray(path));
    assert.ok(path.length >= 2);
    path.forEach((pt) => {
      assert.strictEqual(typeof pt.x, 'number');
      assert.strictEqual(typeof pt.y, 'number');
      assert.strictEqual(typeof pt.z, 'number');
      assert.strictEqual(Number.isNaN(pt.x), false);
      assert.strictEqual(Number.isNaN(pt.y), false);
      assert.strictEqual(Number.isNaN(pt.z), false);
    });
  });
});

test('getRoofFramePaths - 穹顶 (dome) 按 1m 步长生成经纬度环梁与弧梁路径', () => {
  const width = 4;
  const depth = 4;
  const height = 2;
  const paths = getRoofFramePaths('dome', width, depth, height, 0, 1.0);

  assert.ok(Array.isArray(paths));
  assert.ok(paths.length > 0);

  paths.forEach((path) => {
    assert.ok(Array.isArray(path));
    assert.ok(path.length >= 2);
    path.forEach((pt) => {
      assert.strictEqual(Number.isNaN(pt.x), false);
      assert.strictEqual(Number.isNaN(pt.y), false);
      assert.strictEqual(Number.isNaN(pt.z), false);
    });
  });
});

test('getRoofFramePaths - 支持所有 7 种屋顶 subtype (gable, shed, arch, dome, trapezoid, hip, flat)', () => {
  const subtypes = ['gable', 'shed', 'arch', 'dome', 'trapezoid', 'hip', 'flat'];
  subtypes.forEach((subtype) => {
    const paths = getRoofFramePaths(subtype, 5, 4, 2.5, 0, 1.0);
    assert.ok(Array.isArray(paths), `屋顶类型 ${subtype} 路径结果应为数组`);
    assert.ok(paths.length > 0, `屋顶类型 ${subtype} 应生成骨架路径`);
  });
});

test('getRoofFramePaths - includeSide 控制侧面山墙骨架路径显隐与增加', () => {
  const withSide = getRoofFramePaths('arch', 4, 4, 2, 0, 1.0, true);
  const withoutSide = getRoofFramePaths('arch', 4, 4, 2, 0, 1.0, false);
  assert.ok(withSide.length > withoutSide.length, '开启 includeSide 应包含山墙底梁与立柱路径');
});

test('getRoofFramePaths - 四角顶 (hip) 和梯形顶 (trapezoid) 具有三维倾斜坡度而非悬空平面', () => {
  const hipPaths = getRoofFramePaths('hip', 6, 6, 3, 0, 1.0);
  const trapezoidPaths = getRoofFramePaths('trapezoid', 6, 6, 3, 0, 1.0);

  const hipYValues = hipPaths.flat().map((pt) => pt.y);
  const trapezoidYValues = trapezoidPaths.flat().map((pt) => pt.y);

  assert.ok(hipYValues.some((y) => y === 0), '四角顶骨架应包含底部 y=0 的梁');
  assert.ok(hipYValues.some((y) => y > 0 && y < 3), '四角顶骨架应包含中间斜坡 y 值的梁');

  assert.ok(trapezoidYValues.some((y) => y === 0), '梯形顶骨架应包含底部 y=0 的梁');
  assert.ok(trapezoidYValues.some((y) => y > 0 && y < 3), '梯形顶骨架应包含中间斜坡 y 值的梁');
});

test('getRoofFramePaths - 穹顶 (dome) 最下面一圈具备 y=0 底边封口圈梁', () => {
  const domePaths = getRoofFramePaths('dome', 4, 4, 2, 0, 1.0);
  const bottomRing = domePaths.find((path) => path.every((pt) => Math.abs(pt.y) < 1e-4));
  assert.ok(bottomRing, '穹顶应包含 y=0 处的底边封口圈梁');
});

test('getRoofFramePaths - 单斜顶 (shed) 侧面包含高侧方形墙面立柱与框梁', () => {
  const shedSidePaths = getRoofFramePaths('shed', 6, 4, 2, 0, 1.0, true);
  const highSidePillar = shedSidePaths.find((path) =>
    path.length === 2 &&
    Math.abs(path[0].x - 3) < 1e-4 &&
    Math.abs(path[1].x - 3) < 1e-4 &&
    Math.abs(path[0].y - 0) < 1e-4 &&
    Math.abs(path[1].y - 2) < 1e-4
  );
  assert.ok(highSidePillar, '单斜顶应包含高侧方形墙面立柱');
});

test('getRoofFramePaths - 梯形顶 (trapezoid) 与四角顶 (hip) 生成斜面 1m 交叉网格骨架', () => {
  const hipPaths = getRoofFramePaths('hip', 6, 6, 3, 0, 1.0);
  const trapezoidPaths = getRoofFramePaths('trapezoid', 6, 6, 3, 0, 1.0);

  assert.ok(hipPaths.length > 10, '四角顶骨架应包含斜面纵向椽梁和同心梁组成的密集网格');
  assert.ok(trapezoidPaths.length > 10, '梯形顶骨架应包含斜面纵向椽梁和同心梁组成的密集网格');
});

test('getRoofFramePaths & getRoofGeometryData - 梯形顶支持自定义 topWidth 与 topDepth', () => {
  const customOptions = { topWidth: 4.0, topDepth: 3.0 };
  const geoData = getRoofGeometryData('trapezoid', 8, 6, 3, 0, customOptions);
  const framePaths = getRoofFramePaths('trapezoid', 8, 6, 3, 0, 1.0, true, customOptions);

  assert.ok(geoData.positions.length > 0, '应该成功依据自定义顶面尺寸生成 positions');
  assert.ok(framePaths.length > 0, '应该成功依据自定义顶面尺寸生成框架路径');
  const topYPaths = framePaths.flat().filter((pt) => Math.abs(pt.y - 3.0) < 1e-4);
  const maxTopX = Math.max(...topYPaths.map((pt) => Math.abs(pt.x)));
  assert.ok(Math.abs(maxTopX - 2.0) < 0.1, '顶部框架 x 坐标范围应符合 topWidth = 4.0');
});


