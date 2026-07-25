import test from 'node:test';
import assert from 'node:assert/strict';
import { ceilingLight, chandelierLight, floorLampLight, deskLampLight } from '../../src/furniture/lighting.js';

test('灯具预设光照参数验证: 米制下的射程与偏移量符合合理室内尺度', () => {
  const lights = [ceilingLight, chandelierLight, floorLampLight, deskLampLight];
  
  lights.forEach(lightDef => {
    assert.equal(lightDef.unit, 'm', `${lightDef.name} 的 unit 必须为 'm'`);
    assert.ok(lightDef.lightSource, `${lightDef.name} 必须包含 lightSource`);
    
    // 室内单灯射程 range 应该在 1m 到 10m 之间（避免遗留 100~240 英寸导致超强大暴白）
    assert.ok(
      lightDef.lightSource.range >= 1.0 && lightDef.lightSource.range <= 10.0,
      `${lightDef.name} 的 lightSource.range (${lightDef.lightSource.range}) 应在 1m~10m 之间`
    );

    // 光源 y 坐标偏移量在米制下不应超过 5 米
    const offsetY = lightDef.lightSource.offset?.y ?? 0;
    assert.ok(
      Math.abs(offsetY) <= 5.0,
      `${lightDef.name} 的 lightSource.offset.y (${offsetY}) 应在 -5m~5m 之间`
    );
  });
});
