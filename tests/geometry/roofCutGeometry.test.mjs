import test from 'node:test';
import assert from 'node:assert/strict';
import * as BABYLON from '@babylonjs/core';
import { FloorplanDocument } from '../../src/domain/FloorplanDocument.js';
import { getRoofGeometryData } from '../../src/geometry/roofGeometry.js';
import {
  createRoofCutContext,
  getCutRoofGeometry,
  getRoofCutNeighborIds
} from '../../src/geometry/roofCutGeometry.js';
import { BabylonSceneRenderer } from '../../src/runtime/BabylonSceneRenderer.js';
import { create3MFModelXml } from '../../src/core/threeMfExporter.js';

function createFloorplan(roofs) {
  return {
    currentFloorId: 'floor_1',
    wallHeight: 0,
    floorHeight: 0,
    floor: { color: '#ffffff', rooms: [] },
    floors: [{
      id: 'floor_1',
      level: 0,
      wallHeight: 0,
      floorHeight: 0,
      hideRoof: false
    }],
    walls: [],
    openings: [],
    items: [],
    stairs: [],
    fences: [],
    fenceGates: [],
    roofs
  };
}

function createFlatRoof(id, x) {
  return {
    id,
    floorId: 'floor_1',
    x,
    z: 0,
    width: 4,
    depth: 4,
    height: 1,
    elevation: 0,
    subtype: 'flat',
    hideFrame: true
  };
}

function signedGeometryVolume(geometry) {
  const indices = [
    ...geometry.topIndices,
    ...geometry.sideIndices,
    ...geometry.bottomIndices
  ];
  let signedVolume = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const p = geometry.positions;
    signedVolume += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
      + p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2])
      + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  return signedVolume / 6;
}

function surfacePositionSignature(geometry, indices) {
  const points = new Set();
  for (const index of indices) {
    const i = index * 3;
    points.add([
      geometry.positions[i],
      geometry.positions[i + 1],
      geometry.positions[i + 2]
    ].map((value) => Math.round(value * 1e4) / 1e4).join(','));
  }
  return [...points].sort();
}

function surfaceTriangleSignature(geometry, indices) {
  const triangles = [];
  for (let i = 0; i < indices.length; i += 3) {
    triangles.push(indices.slice(i, i + 3).map((index) => {
      const offset = index * 3;
      return geometry.positions.slice(offset, offset + 3)
        .map((value) => Math.round(value * 1e4) / 1e4)
        .join(',');
    }).sort().join('|'));
  }
  return triangles.sort();
}

function surfaceArea(geometry, indices) {
  let area = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const normal = triangleNormal(geometry.positions, ...indices.slice(i, i + 3));
    area += Math.hypot(normal.x, normal.y, normal.z) / 2;
  }
  return area;
}

function triangleNormal(positions, a, b, c) {
  const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
  const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
  const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  return {
    x: aby * acz - abz * acy,
    y: abz * acx - abx * acz,
    z: abx * acy - aby * acx
  };
}

function assertBaseRoofNormalsPointOutward(geometry, subtype) {
  for (let i = 0; i < geometry.topIndices.length; i += 3) {
    const normal = triangleNormal(geometry.positions, ...geometry.topIndices.slice(i, i + 3));
    assert.ok(normal.y >= -1e-7, `${subtype} top normal should point upward`);
  }
  for (let i = 0; i < geometry.bottomIndices.length; i += 3) {
    const normal = triangleNormal(geometry.positions, ...geometry.bottomIndices.slice(i, i + 3));
    assert.ok(normal.y <= 1e-7, `${subtype} bottom normal should point downward`);
  }
  for (let i = 0; i < geometry.sideIndices.length; i += 3) {
    const triangle = geometry.sideIndices.slice(i, i + 3);
    const normal = triangleNormal(geometry.positions, ...triangle);
    const centerX = triangle.reduce((sum, index) => sum + geometry.positions[index * 3], 0) / 3;
    const centerZ = triangle.reduce((sum, index) => sum + geometry.positions[index * 3 + 2], 0) / 3;
    const horizontalDirection = normal.x * centerX + normal.z * centerZ;
    assert.ok(
      horizontalDirection >= -1e-7 || (
        Math.abs(horizontalDirection) < 1e-7 && normal.y >= -1e-7
      ),
      `${subtype} side normal should point away from the roof interior`
    );
  }
}

function hasVerticalSidePlaneAtLocalX(geometry, x) {
  for (let i = 0; i < geometry.sideIndices.length; i += 3) {
    const triangle = geometry.sideIndices.slice(i, i + 3);
    if (triangle.every((index) => Math.abs(geometry.positions[index * 3] - x) < 1e-4)) {
      return true;
    }
  }
  return false;
}

test('overlapping roofs trim the exposed shell without adding closure or cutting ceiling', () => {
  const floorplan = createFloorplan([
    createFlatRoof('roof_a', -1),
    createFlatRoof('roof_b', 1)
  ]);
  const context = createRoofCutContext(floorplan);
  const base = getRoofGeometryData('flat', 4, 4, 1);
  const cutA = getCutRoofGeometry(floorplan, 'roof_a', context);
  const cutB = getCutRoofGeometry(floorplan, 'roof_b', context);

  assert.deepEqual([...getRoofCutNeighborIds(context, 'roof_a')], ['roof_b']);
  assert.deepEqual([...getRoofCutNeighborIds(context, 'roof_b')], ['roof_a']);
  assert.ok(Math.abs(surfaceArea(base, base.topIndices) - 16) < 1e-4);
  assert.ok(Math.abs(surfaceArea(cutA, cutA.topIndices) - 8) < 1e-4);
  assert.ok(Math.abs(surfaceArea(cutB, cutB.topIndices) - 8) < 1e-4);
  for (const cut of [cutA, cutB]) {
    assert.ok(
      surfaceArea(cut, cut.sideIndices) < surfaceArea(base, base.sideIndices),
      'fascia embedded inside the neighboring roof must be trimmed'
    );
    assert.equal(
      hasVerticalSidePlaneAtLocalX(cut, 0),
      false,
      'CSG-generated closure must not be rendered as fascia'
    );
    assert.deepEqual(
      surfaceTriangleSignature(cut, cut.bottomIndices),
      surfaceTriangleSignature(base, base.bottomIndices),
      'the original ceiling must stay intact'
    );
  }
});

test('base and surface-cut roof meshes expose outward-facing render normals', () => {
  for (const subtype of ['gable', 'shed', 'arch', 'dome', 'trapezoid', 'hip', 'flat']) {
    const geometry = getRoofGeometryData(subtype, 6, 5, 2);
    assertBaseRoofNormalsPointOutward(geometry, subtype);
    assert.ok(signedGeometryVolume(geometry) > 0, `${subtype} should have outward closed winding`);
  }

  const floorplan = createFloorplan([
    createFlatRoof('roof_a', -1),
    createFlatRoof('roof_b', 1)
  ]);
  const context = createRoofCutContext(floorplan);
  for (const roofId of ['roof_a', 'roof_b']) {
    const geometry = getCutRoofGeometry(floorplan, roofId, context);
    assertBaseRoofNormalsPointOutward(geometry, roofId);
  }
});

test('non-overlapping roofs keep their original geometry', () => {
  const floorplan = createFloorplan([
    createFlatRoof('roof_a', -5),
    createFlatRoof('roof_b', 5)
  ]);
  const context = createRoofCutContext(floorplan);
  const geometry = getCutRoofGeometry(floorplan, 'roof_a', context);
  const base = getRoofGeometryData('flat', 4, 4, 1);

  assert.equal(getRoofCutNeighborIds(context, 'roof_a').size, 0);
  assert.equal(geometry.hasCuts, false);
  assert.deepEqual(geometry.positions, base.positions);
  assert.deepEqual(geometry.topIndices, base.topIndices);
});

test('3MF export uses the same hollow cut roof shells as the renderer', () => {
  const overlapping = create3MFModelXml(createFloorplan([
    createFlatRoof('roof_a', -1),
    createFlatRoof('roof_b', 1)
  ]), { enableTenon: false });
  const separated = create3MFModelXml(createFloorplan([
    createFlatRoof('roof_a', -5),
    createFlatRoof('roof_b', 5)
  ]), { enableTenon: false });
  const overlappingTriangles = (overlapping.match(/<triangle /g) || []).length;
  const separatedTriangles = (separated.match(/<triangle /g) || []).length;

  assert.ok(overlappingTriangles > 0);
  assert.ok(overlappingTriangles < separatedTriangles);
});

test('3MF roof shells respect fascia, ceiling and eave visibility independently', () => {
  const roof = { ...createFlatRoof('roof', 0), eaveOverhang: 0.4 };
  const triangleCount = (overrides = {}) => {
    const xml = create3MFModelXml(
      createFloorplan([{ ...roof, ...overrides }]),
      { enableTenon: false }
    );
    return (xml.match(/<triangle /g) || []).length;
  };
  const base = getRoofGeometryData('flat', roof.width, roof.depth, roof.height, 0, {
    eaveOverhang: roof.eaveOverhang
  });
  const allSurfaces = triangleCount();
  const withoutFascia = triangleCount({ sideHidden: true });
  const withoutCeiling = triangleCount({ bottomHidden: true });
  const withoutEave = triangleCount({ eaveOverhang: 0 });
  const roofAndEaveOnly = triangleCount({ sideHidden: true, bottomHidden: true });
  const roofOnly = triangleCount({ sideHidden: true, bottomHidden: true, eaveOverhang: 0 });

  assert.equal(allSurfaces - withoutFascia, base.sideIndices.length / 3);
  assert.equal(allSurfaces - withoutCeiling, base.bottomIndices.length / 3);
  assert.equal(allSurfaces - withoutEave, base.eaveIndices.length / 3);
  assert.equal(roofAndEaveOnly, (base.topIndices.length + base.eaveIndices.length) / 3);
  assert.equal(roofOnly, base.topIndices.length / 3);
});

test('arch and dome roofs default to no eave while other roof types keep a 0.2m default', () => {
  const document = new FloorplanDocument(createFloorplan([]));
  const roof = document.addRoof({ id: 'default-eave' });
  assert.equal(roof.eaveOverhang, 0.2);

  assert.equal(document.addRoof({ id: 'arch-default-eave', subtype: 'arch' }).eaveOverhang, 0);
  assert.equal(document.addRoof({ id: 'dome-default-eave', subtype: 'dome' }).eaveOverhang, 0);
  assert.equal(document.addRoof({
    id: 'arch-explicit-eave',
    subtype: 'arch',
    eaveOverhang: 0.35
  }).eaveOverhang, 0.35);

  document.updateRoof(roof.id, { eaveOverhang: 0 });
  assert.equal(roof.eaveOverhang, 0);

  const legacyDocument = new FloorplanDocument(createFloorplan([
    createFlatRoof('legacy-flat', 0),
    { ...createFlatRoof('legacy-arch', 0), subtype: 'arch', type: 'arch' },
    { ...createFlatRoof('legacy-dome', 0), subtype: 'dome', type: 'dome' }
  ]));
  assert.equal(legacyDocument.getRoof('legacy-flat').eaveOverhang, 0.2);
  assert.equal(legacyDocument.getRoof('legacy-arch').eaveOverhang, 0);
  assert.equal(legacyDocument.getRoof('legacy-dome').eaveOverhang, 0);
});

test('eaves are cut with their roofs while retaining roof-part classification', () => {
  const roofs = [
    { ...createFlatRoof('roof_a', -1), eaveOverhang: 0.4 },
    { ...createFlatRoof('roof_b', 1), eaveOverhang: 0.4 }
  ];
  const floorplan = createFloorplan(roofs);
  const context = createRoofCutContext(floorplan);
  const base = getRoofGeometryData('flat', 4, 4, 1, 0, { eaveOverhang: 0.4 });
  const baseArea = surfaceArea(base, base.eaveIndices);

  for (const roof of roofs) {
    const cut = getCutRoofGeometry(floorplan, roof, context);
    assert.ok(cut.eaveIndices.length > 0);
    assert.ok(surfaceArea(cut, cut.eaveIndices) < baseArea);
  }
});

test('zero-length eaves neither render nor create overlap-cut neighbors', () => {
  const visibleRoofs = [
    { ...createFlatRoof('roof_a', -2.5), eaveOverhang: 0.6 },
    { ...createFlatRoof('roof_b', 2.5), eaveOverhang: 0.6 }
  ];
  const visibleContext = createRoofCutContext(createFloorplan(visibleRoofs));
  assert.deepEqual([...getRoofCutNeighborIds(visibleContext, 'roof_a')], ['roof_b']);

  const hiddenRoofs = visibleRoofs.map((roof) => ({ ...roof, eaveOverhang: 0 }));
  const hiddenContext = createRoofCutContext(createFloorplan(hiddenRoofs));
  assert.deepEqual([...getRoofCutNeighborIds(hiddenContext, 'roof_a')], []);
  assert.deepEqual([...getRoofCutNeighborIds(hiddenContext, 'roof_b')], []);
});

test('eaves use the roof material and ignore fascia or ceiling visibility', () => {
  const roof = {
    ...createFlatRoof('roof', 0),
    eaveOverhang: 0.4,
    sideHidden: true,
    bottomHidden: true
  };
  const document = new FloorplanDocument(createFloorplan([roof]));
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = new BabylonSceneRenderer(scene, document);

  renderer.buildRoofs();
  const topMesh = scene.getMeshByName('roof_top_roof');
  const eaveMesh = scene.getMeshByName('roof_eave_roof');
  assert.ok(topMesh);
  assert.ok(eaveMesh);
  assert.equal(eaveMesh.material, topMesh.material);
  assert.equal(scene.getMeshByName('roof_side_roof'), null);
  assert.equal(scene.getMeshByName('roof_bottom_roof'), null);

  document.updateRoof('roof', { eaveOverhang: 0 });
  renderer.buildRoofs('roof');
  assert.equal(scene.getMeshByName('roof_eave_roof'), null);

  renderer.dispose();
  engine.dispose();
});

test('all seven roof subtypes support overlap cutting', () => {
  for (const subtype of ['gable', 'shed', 'arch', 'dome', 'trapezoid', 'hip', 'flat']) {
    const subject = {
      ...createFlatRoof('subject', 0),
      width: 6,
      depth: 6,
      height: 2,
      subtype
    };
    const cutter = {
      ...createFlatRoof('cutter', 2),
      height: 2
    };
    const floorplan = createFloorplan([subject, cutter]);
    const context = createRoofCutContext(floorplan);
    const geometry = getCutRoofGeometry(floorplan, subject, context);

    assert.equal(geometry.hasCuts, true, `${subtype} should be cut`);
    assert.ok(geometry.positions.length > 0, `${subtype} should keep non-overlapping geometry`);
    assert.ok(
      geometry.topIndices.length + geometry.sideIndices.length + geometry.bottomIndices.length > 0,
      `${subtype} should keep renderable triangles`
    );
  }
});

test('arch and dome subtraction results stay assigned to the correct roofs', () => {
  const arch = {
    ...createFlatRoof('arch', 1),
    width: 7,
    depth: 7,
    height: 3,
    subtype: 'arch'
  };
  const dome = {
    ...createFlatRoof('dome', -1),
    width: 6,
    depth: 6,
    height: 3,
    subtype: 'dome'
  };
  const floorplan = createFloorplan([arch, dome]);
  const context = createRoofCutContext(floorplan);
  const cutArch = getCutRoofGeometry(floorplan, arch, context);
  const cutDome = getCutRoofGeometry(floorplan, dome, context);
  const baseArch = getRoofGeometryData('arch', arch.width, arch.depth, arch.height);
  const baseDome = getRoofGeometryData('dome', dome.width, dome.depth, dome.height);
  assert.ok(
    surfaceArea(cutArch, cutArch.topIndices) < surfaceArea(baseArch, baseArch.topIndices),
    'arch should trim the top surface hidden by the dome'
  );
  assert.ok(
    surfaceArea(cutDome, cutDome.topIndices) < surfaceArea(baseDome, baseDome.topIndices),
    'dome should trim the top surface hidden by the arch'
  );
  assert.deepEqual(
    surfaceTriangleSignature(cutArch, cutArch.bottomIndices),
    surfaceTriangleSignature(baseArch, baseArch.bottomIndices)
  );
  assert.deepEqual(
    surfaceTriangleSignature(cutDome, cutDome.bottomIndices),
    surfaceTriangleSignature(baseDome, baseDome.bottomIndices)
  );
});

test('rotated arch cuts use Babylon Y-axis rotation instead of the mirrored direction', () => {
  const arch = {
    ...createFlatRoof('arch', 0),
    z: 0,
    width: 8,
    depth: 5,
    height: 3,
    subtype: 'arch'
  };
  const dome = {
    ...createFlatRoof('dome', 1),
    z: 1.2,
    width: 4,
    depth: 4,
    height: 3,
    subtype: 'dome'
  };
  const basePlan = createFloorplan([arch, dome]);
  const baseCut = getCutRoofGeometry(
    basePlan,
    arch,
    createRoofCutContext(basePlan)
  );

  const rotation = Math.PI * 0.31;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotatedArch = { ...arch, rotation };
  const rotatedDome = {
    ...dome,
    x: dome.x * cos + dome.z * sin,
    z: -dome.x * sin + dome.z * cos,
    rotation
  };
  const rotatedPlan = createFloorplan([rotatedArch, rotatedDome]);
  const rotatedCut = getCutRoofGeometry(
    rotatedPlan,
    rotatedArch,
    createRoofCutContext(rotatedPlan)
  );

  assert.equal(baseCut.hasCuts, true);
  assert.equal(rotatedCut.hasCuts, true);
  assert.deepEqual(
    surfacePositionSignature(rotatedCut, rotatedCut.topIndices),
    surfacePositionSignature(baseCut, baseCut.topIndices),
    'rotating both roofs in Babylon space must not mirror the arch cut in local space'
  );
  assert.ok(
    Math.abs(
      surfaceArea(rotatedCut, rotatedCut.topIndices)
      - surfaceArea(baseCut, baseCut.topIndices)
    ) < 1e-4
  );
});

test('moving a roof rebuilds both its old overlap neighbor and itself', () => {
  const document = new FloorplanDocument(createFloorplan([
    createFlatRoof('roof_a', -1),
    createFlatRoof('roof_b', 1)
  ]));
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const renderer = new BabylonSceneRenderer(scene, document);

  renderer.buildRoofs();
  const oldRoofANode = renderer.roofNodes.get('roof_a');
  assert.deepEqual([...renderer.roofCutNeighbors.get('roof_a')], ['roof_b']);

  document.updateRoof('roof_b', { x: 10 });
  renderer.buildRoofs('roof_b');

  assert.notEqual(renderer.roofNodes.get('roof_a'), oldRoofANode);
  assert.equal(renderer.roofCutNeighbors.get('roof_a').size, 0);
  assert.equal(renderer.roofCutNeighbors.get('roof_b').size, 0);
  assert.ok(renderer.roofNodes.has('roof_a'));
  assert.ok(renderer.roofNodes.has('roof_b'));

  renderer.dispose();
  engine.dispose();
});
