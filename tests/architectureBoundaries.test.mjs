import assert from 'node:assert';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { MaterialResolver } from '../src/domain/MaterialResolver.js';

function resolveImportPath(currentFile, importPath) {
  if (!importPath.startsWith('.')) return null;
  let resolved = path.resolve(path.dirname(currentFile), importPath);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    resolved = path.join(resolved, 'index.js');
  }
  return resolved;
}

function getImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  const regex = /import\s+[\s\S]*?from\s+['"](.*?)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

test('架构边界守卫：Domain 层依赖树中绝对不含有 Babylon 的任何直接或间接引入', () => {
  const visited = new Set();
  const queue = [path.resolve('src/domain/FloorplanDocument.js')];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const relativeToProject = path.relative('.', current);
    assert.ok(
      !relativeToProject.toLowerCase().includes('babylon'),
      `数据层依赖树泄漏：文件 ${relativeToProject} 包含了 babylon 关键字！`
    );

    const imports = getImports(current);
    for (const imp of imports) {
      assert.ok(
        !imp.toLowerCase().includes('babylon'),
        `在数据层文件 ${relativeToProject} 中发现直接引入了带有 babylon 名字的模块: ${imp}`
      );
      const resolved = resolveImportPath(current, imp);
      if (resolved && fs.existsSync(resolved)) {
        queue.push(resolved);
      }
    }
  }
});

test('MaterialResolver 边界测试：核心字段映射与属性边界验证', () => {
  // 1. 验证默认高度边界值
  assert.strictEqual(MaterialResolver.DEFAULT_WALL_BASEBOARD_HEIGHT, 0.1);
  assert.strictEqual(MaterialResolver.DEFAULT_WALL_WAINSCOT_HEIGHT, 1.0);
  assert.strictEqual(MaterialResolver.DEFAULT_WALL_COLOR, '#f9fbff');
  assert.strictEqual(MaterialResolver.DEFAULT_FLOOR_COLOR, '#d2b48c');

  // 2. 验证墙体六组表面字段映射的完备性与正确性
  const map = MaterialResolver.WALL_SURFACE_FIELD_MAP;
  assert.ok(map, 'WALL_SURFACE_FIELD_MAP 应该存在');

  // 正面
  assert.strictEqual(map.front.main.materialField, 'materialFront');
  assert.strictEqual(map.front.main.colorField, 'colorFront');
  assert.strictEqual(map.front.baseboard.materialField, 'baseboardMaterialFront');
  assert.strictEqual(map.front.baseboard.colorField, 'baseboardColorFront');
  assert.strictEqual(map.front.wainscot.materialField, 'wainscotMaterialFront');
  assert.strictEqual(map.front.wainscot.colorField, 'wainscotColorFront');

  // 反面
  assert.strictEqual(map.back.main.materialField, 'materialBack');
  assert.strictEqual(map.back.main.colorField, 'colorBack');
  assert.strictEqual(map.back.baseboard.materialField, 'baseboardMaterialBack');
  assert.strictEqual(map.back.baseboard.colorField, 'baseboardColorBack');
  assert.strictEqual(map.back.wainscot.materialField, 'wainscotMaterialBack');
  assert.strictEqual(map.back.wainscot.colorField, 'wainscotColorBack');
});

test('MaterialResolver 边界测试：墙面装饰与材质规范化行为', () => {
  // 1. 验证 normalizeWallDecorSettings 的默认值修补
  const wall = {};
  MaterialResolver.normalizeWallDecorSettings(wall);
  
  assert.strictEqual(wall.floorId, 'floor_1');
  assert.strictEqual(wall.color, '#f9fbff');
  assert.strictEqual(wall.material, '#f9fbff');
  assert.strictEqual(wall.baseboardEnabled, false);
  assert.strictEqual(wall.baseboardHeight, 0.1);
  assert.strictEqual(wall.wainscotEnabled, false);
  assert.strictEqual(wall.wainscotHeight, 1.0);

  // 2. 验证 getWallSurfaceFields 字段获取
  const frontMain = MaterialResolver.getWallSurfaceFields('front', 'main');
  assert.strictEqual(frontMain.materialField, 'materialFront');
  assert.strictEqual(frontMain.colorField, 'colorFront');

  const backBaseboard = MaterialResolver.getWallSurfaceFields('back', 'baseboard');
  assert.strictEqual(backBaseboard.materialField, 'baseboardMaterialBack');
  assert.strictEqual(backBaseboard.colorField, 'baseboardColorBack');

  // 3. 验证 resolveWallSurfaceDescriptor
  const mockWall = {
    material: '#ff0000',
    color: '#00ff00',
    materialFront: '#0000ff',
    colorFront: '#ff00ff'
  };
  const resolved = MaterialResolver.resolveWallSurfaceDescriptor(mockWall, 'front', 'main');
  assert.strictEqual(resolved.descriptor, '#0000ff');
  assert.strictEqual(resolved.color, '#ff00ff');
});
