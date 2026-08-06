import assert from 'node:assert/strict';
import test from 'node:test';
import * as BABYLON from '@babylonjs/core';
import { Blueprint3DTestMap, createEditor } from '../../src/index.js';
import { cancel3DDrag, initDrag3DContext } from '../../example/js/Drag3DContext.js';

function createFloorplan() {
  return {
    unit: 'm',
    currentFloorId: 'floor_1',
    wallHeight: 3,
    floorHeight: 0.06,
    wallThickness: 0.16,
    floors: [
      { id: 'floor_1', name: '1F', level: 0, wallHeight: 3, floorHeight: 0.06 }
    ],
    floor: {
      rooms: [
        {
          id: 'living',
          name: 'Living room',
          floorId: 'floor_1',
          x: 0,
          z: 0,
          width: 4,
          depth: 4,
          wallIds: { north: 'w_n', east: 'w_e', south: 'w_s', west: 'w_w' }
        }
      ]
    },
    walls: [
      { id: 'w_n', roomId: 'living', floorId: 'floor_1', from: [-2, -2], to: [2, -2] },
      { id: 'w_e', roomId: 'living', floorId: 'floor_1', from: [2, -2], to: [2, 2] },
      { id: 'w_s', roomId: 'living', floorId: 'floor_1', from: [2, 2], to: [-2, 2] },
      { id: 'w_w', roomId: 'living', floorId: 'floor_1', from: [-2, 2], to: [-2, -2] }
    ],
    openings: [
      {
        id: 'door1',
        type: 'door',
        floorId: 'floor_1',
        wallId: 'w_n',
        t: 0.35,
        width: 0.9,
        height: 2.05
      }
    ],
    items: [
      {
        id: 'chair1',
        name: 'Chair',
        type: 'chair',
        floorId: 'floor_1',
        roomId: 'living',
        x: 1,
        z: 1,
        elevation: 1
      },
      {
        id: 'living',
        name: 'ID collision item',
        type: 'chair',
        floorId: 'floor_1',
        roomId: 'living',
        x: -1,
        z: 1
      }
    ],
    roofs: [],
    stairs: [],
    fences: [
      {
        id: 'fence1',
        floorId: 'floor_1',
        from: [-2, 3],
        to: [2, 3],
        height: 1.1,
        thickness: 0.1,
        subtype: 'picket_wood'
      }
    ],
    fenceGates: [
      {
        id: 'gate1',
        floorId: 'floor_1',
        fenceId: 'fence1',
        t: 0.5,
        width: 1,
        height: 1.1,
        thickness: 0.08,
        subtype: 'picket_wood'
      }
    ]
  };
}

function createHarness(configureScene) {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  configureScene?.(scene);
  const editor = createEditor({ scene, floorplan: createFloorplan() });
  editor.enableRendering();
  return { engine, scene, editor };
}

async function destroyHarness({ editor, engine }) {
  await editor.dispose();
  engine.dispose();
}

function entity(snapshot, collection, id) {
  const list = collection === 'rooms' ? snapshot.floor.rooms : snapshot[collection];
  return list.find((candidate) => candidate.id === id);
}

function assertIdle(editor) {
  const status = editor.getEntityPreviewStatus();
  assert.equal(status.state, 'idle');
  assert.equal(status.type, null);
  assert.equal(status.id, null);
  assert.equal(status.resourceCount, 0);
  assert.equal(editor.getRuntimePreviewResourceCount(), 0);
}

test('room cancel atomically restores room, associated items, walls and render transforms after multiple updates', async () => {
  const harness = createHarness();
  const { editor } = harness;
  const before = structuredClone(editor.getSnapshot());
  const beforeRoomTransform = editor.getEntityWorldTransform('room', 'living');
  const beforeItemTransform = editor.getEntityWorldTransform('item', 'chair1');
  const beforeWallTransform = editor.getEntityWorldTransform('wall', 'w_n');

  assert.equal(editor.beginEntityPreview('room', 'living'), true);
  assert.equal(editor.updateEntityPreview('room', 'living', { x: 1, z: 0.5 }), true);
  assert.equal(editor.updateEntityPreview('room', 'living', { x: 2, z: 1, width: 5, depth: 4.5 }), true);

  assert.notDeepEqual(entity(editor.getSnapshot(), 'rooms', 'living'), entity(before, 'rooms', 'living'));
  assert.notDeepEqual(entity(editor.getSnapshot(), 'items', 'chair1'), entity(before, 'items', 'chair1'));
  assert.notDeepEqual(entity(editor.getSnapshot(), 'walls', 'w_n'), entity(before, 'walls', 'w_n'));

  assert.equal(await editor.cancelEntityPreview('room', 'living'), true);
  assert.deepEqual(editor.getSnapshot(), before);
  assert.deepEqual(editor.getEntityWorldTransform('room', 'living'), beforeRoomTransform);
  assert.deepEqual(editor.getEntityWorldTransform('item', 'chair1'), beforeItemTransform);
  assert.deepEqual(editor.getEntityWorldTransform('wall', 'w_n'), beforeWallTransform);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('room commit retains the final preview state and clears the transaction', async () => {
  const harness = createHarness();
  const { editor } = harness;

  assert.equal(editor.beginEntityPreview('room', 'living'), true);
  assert.equal(editor.updateEntityPreview('room', 'living', { x: 1, z: 1 }), true);
  assert.equal(editor.updateEntityPreview('room', 'living', { x: 3, z: 2, width: 6, depth: 5 }), true);
  const finalPreview = structuredClone(editor.getSnapshot());

  assert.equal(await editor.commitEntityPreview('room', 'living'), true);
  assert.equal(await editor.commitEntityPreview('room', 'living'), false);
  assert.deepEqual(editor.getSnapshot(), finalPreview);
  assert.equal(entity(finalPreview, 'rooms', 'living').x, 3);
  assert.equal(entity(finalPreview, 'items', 'chair1').x, 4);
  assert.deepEqual(entity(finalPreview, 'walls', 'w_n').from, [0, -0.5]);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('item preview keeps non-zero elevation in metres in both domain and Babylon world position', async () => {
  const harness = createHarness();
  const { editor } = harness;
  const before = structuredClone(editor.getSnapshot());
  const initialTransform = editor.getEntityWorldTransform('item', 'chair1');

  assert.equal(entity(before, 'items', 'chair1').elevation, 1);
  assert.ok(Math.abs(initialTransform.position.y - 1.06) < 1e-6);
  assert.equal(editor.beginEntityPreview('item', 'chair1'), true);
  assert.equal(editor.updateEntityPreview('item', 'chair1', { x: 1.5, z: 0.5, elevation: 1 }), true);

  const previewItem = editor.getEntity('item', 'chair1');
  const previewTransform = editor.getEntityWorldTransform('item', 'chair1');
  assert.equal(previewItem.elevation, 1);
  assert.ok(Math.abs(previewTransform.position.y - 1.06) < 1e-6);

  assert.equal(await editor.commitEntityPreview('item', 'chair1'), true);
  assert.equal(editor.getEntity('item', 'chair1').elevation, 1);
  assert.ok(Math.abs(editor.getEntityWorldTransform('item', 'chair1').position.y - 1.06) < 1e-6);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('opening cancel restores domain and node pose and releases temporary resources', async () => {
  const harness = createHarness();
  const { editor } = harness;
  const before = structuredClone(editor.getEntity('opening', 'door1'));
  const beforeTransform = editor.getEntityWorldTransform('opening', 'door1');

  assert.equal(editor.beginEntityPreview('opening', 'door1'), true);
  assert.ok(editor.getRuntimePreviewResourceCount() > 0);
  assert.equal(editor.updateEntityPreview('opening', 'door1', { t: 0.7 }), true);
  assert.equal(await editor.cancelEntityPreview('opening', 'door1'), true);

  assert.deepEqual(editor.getEntity('opening', 'door1'), before);
  assert.deepEqual(editor.getEntityWorldTransform('opening', 'door1'), beforeTransform);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('opening preview remains transactional before 3D rendering is enabled', async () => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const editor = createEditor({
    scene,
    floorplan: createFloorplan(),
    options: { renderingEnabled: false }
  });
  const before = structuredClone(editor.getSnapshot());

  assert.equal(editor.beginEntityPreview('opening', 'door1'), true);
  assert.equal(editor.updateEntityPreview('opening', 'door1', { t: 0.7 }), true);
  assert.equal(await editor.cancelEntityPreview('opening', 'door1'), true);
  assert.deepEqual(editor.getSnapshot(), before);
  assertIdle(editor);

  await editor.dispose();
  engine.dispose();
});

test('fence gate cancel restores domain and node pose and releases temporary resources', async () => {
  const harness = createHarness();
  const { editor } = harness;
  const before = structuredClone(editor.getEntity('fenceGate', 'gate1'));
  const beforeTransform = editor.getEntityWorldTransform('fenceGate', 'gate1');

  assert.equal(editor.beginEntityPreview('fenceGate', 'gate1'), true);
  assert.ok(editor.getRuntimePreviewResourceCount() > 0);
  assert.equal(editor.updateEntityPreview('fenceGate', 'gate1', { t: 0.75 }), true);
  assert.equal(await editor.cancelEntityPreview('fenceGate', 'gate1'), true);

  assert.deepEqual(editor.getEntity('fenceGate', 'gate1'), before);
  assert.deepEqual(editor.getEntityWorldTransform('fenceGate', 'gate1'), beforeTransform);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('preview lifecycle rejects replacement and requires both type and id to match', async () => {
  const harness = createHarness();
  const { editor } = harness;

  assert.equal(editor.beginEntityPreview('room', 'living'), true);
  assert.equal(editor.beginEntityPreview('item', 'chair1'), false, 'a second active preview must be rejected');
  assert.equal(await editor.commitEntityPreview('room', 'missing'), false, 'same type with another id must not commit');
  assert.equal(await editor.cancelEntityPreview('item', 'living'), false, 'same id with another type must not cancel');
  assert.deepEqual(
    editor.getEntityPreviewStatus(),
    { state: 'active', type: 'rooms', id: 'living', resourceCount: 0 }
  );

  assert.equal(await editor.cancelEntityPreview('room', 'living'), true);
  assert.equal(await editor.cancelEntityPreview('room', 'living'), false);
  assert.equal(await editor.commitEntityPreview('room', 'living'), false);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('full document loads are rejected while a preview is active through both public APIs', async () => {
  const harness = createHarness();
  const { editor } = harness;
  const replacement = createFloorplan();
  entity(replacement, 'items', 'chair1').x = 99;
  const buildingFile = editor.stringifyBuildingFile();

  assert.equal(editor.beginEntityPreview('item', 'chair1'), true);
  assert.equal(editor.updateEntityPreview('item', 'chair1', { x: 2 }), true);
  assert.equal(editor.loadJSON(replacement), false);
  assert.equal(editor.loadBuildingFile(buildingFile), false);
  assert.equal(editor.getEntity('item', 'chair1').x, 2);
  assert.equal(await editor.cancelEntityPreview('item', 'chair1'), true);
  assert.equal(editor.getEntity('item', 'chair1').x, 1);

  assert.equal(editor.loadJSON(replacement), true);
  assert.equal(editor.getEntity('item', 'chair1').x, 99);
  await destroyHarness(harness);

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const map = new Blueprint3DTestMap(scene, { floorplan: createFloorplan(), renderingEnabled: false });
  assert.equal(map.beginEntityPreview('item', 'chair1'), true);
  assert.equal(map.updateEntityPreview('item', 'chair1', { x: 3 }), true);
  assert.equal(map.loadJSON(replacement), false);
  assert.equal(map.getItem('chair1').x, 3);
  assert.equal(await map.cancelEntityPreview('item', 'chair1'), true);
  assert.equal(map.getItem('chair1').x, 1);
  await map.dispose();
  engine.dispose();
});

test('3D pointer cancellation rolls back the active preview instead of committing it', async () => {
  const previousDocument = globalThis.document;
  let cancelled = null;
  let commitCount = 0;
  let releasedPointer = null;
  let cameraAttached = false;
  let editHandleState = 'active';
  let refreshCount = 0;

  globalThis.document = {
    body: { classList: { remove() {} } }
  };
  try {
    const context = {
      drag3DState: { type: 'opening', openingId: 'door1', pointerId: 7 },
      testMap: {
        getEntityPreviewStatus: () => ({ state: 'active', type: 'openings', id: 'door1' }),
        cancelEntityPreview: async (type, id) => {
          cancelled = { type, id };
          return true;
        },
        commitEntityPreview: async () => {
          commitCount += 1;
          return true;
        }
      },
      canvas: {
        releasePointerCapture(pointerId) {
          releasedPointer = pointerId;
        }
      },
      camera: {
        attachControl() {
          cameraAttached = true;
        }
      },
      setEditHandleDragState(value) {
        editHandleState = value;
      },
      refreshShadows() {
        refreshCount += 1;
      }
    };
    initDrag3DContext(context);

    assert.equal(await cancel3DDrag({ pointerId: 8 }), false);
    assert.notEqual(context.drag3DState, null);
    assert.equal(await cancel3DDrag({ pointerId: 7 }), true);
    assert.deepEqual(cancelled, { type: 'openings', id: 'door1' });
    assert.equal(commitCount, 0);
    assert.equal(context.drag3DState, null);
    assert.equal(editHandleState, null);
    assert.equal(releasedPointer, 7);
    assert.equal(cameraAttached, true);
    assert.equal(refreshCount, 1);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('an update exception aborts the transaction without leaving active state or temporary resources', async () => {
  const harness = createHarness();
  const { editor } = harness;
  const before = structuredClone(editor.getSnapshot());
  const badTransform = Object.defineProperty({}, 't', {
    enumerable: true,
    get() {
      throw new Error('synthetic preview update failure');
    }
  });

  assert.equal(editor.beginEntityPreview('opening', 'door1'), true);
  assert.ok(editor.getRuntimePreviewResourceCount() > 0);
  assert.throws(
    () => editor.updateEntityPreview('opening', 'door1', badTransform),
    /synthetic preview update failure/
  );
  assert.deepEqual(editor.getSnapshot(), before);
  assertIdle(editor);

  await destroyHarness(harness);
});

test('dispose during an active preview waits for cleanup and is idempotent', async () => {
  const harness = createHarness();
  const { editor, engine } = harness;
  const before = structuredClone(editor.getSnapshot());

  assert.equal(editor.beginEntityPreview('room', 'living'), true);
  assert.equal(editor.updateEntityPreview('room', 'living', { x: 2, z: 1 }), true);
  const firstDispose = editor.dispose();
  const secondDispose = editor.dispose();
  assert.equal(firstDispose, secondDispose);
  assert.equal(await firstDispose, true);
  assert.deepEqual(editor.getSnapshot(), before);
  assert.deepEqual(editor.getEntityPreviewStatus(), {
    state: 'disposed', type: null, id: null, resourceCount: 0
  });
  assert.equal(editor.getRuntimePreviewResourceCount(), 0);

  engine.dispose();
});

test('a scene-ready callback queued after dispose starts cannot touch disposed preview resources', async () => {
  const readyCallbacks = [];
  const harness = createHarness((scene) => {
    scene.executeWhenReady = (callback) => {
      readyCallbacks.push(callback);
    };
  });
  const { editor, engine } = harness;

  while (readyCallbacks.length) readyCallbacks.shift()();
  assert.equal(editor.beginEntityPreview('opening', 'door1'), true);
  assert.equal(editor.updateEntityPreview('opening', 'door1', { t: 0.65 }), true);

  const disposePromise = editor.dispose();
  await Promise.resolve();
  assert.ok(readyCallbacks.length > 0, 'preview cleanup should be waiting for scene readiness');
  while (readyCallbacks.length) readyCallbacks.shift()();

  assert.equal(await disposePromise, true);
  assert.equal(editor.getRuntimePreviewResourceCount(), 0);
  assert.deepEqual(editor.getEntityPreviewStatus(), {
    state: 'disposed', type: null, id: null, resourceCount: 0
  });

  engine.dispose();
});

test('roof preview update updates width and depth in both domain model and rendered node', async () => {
  const harness = createHarness();
  const { editor } = harness;

  const roof = editor.executeCommand('addRoof', { x: 0, z: 0, width: 4, depth: 4, subtype: 'gable' });
  assert.ok(roof, '应该成功添加屋顶');

  assert.equal(editor.beginEntityPreview('roof', roof.id), true);
  assert.equal(editor.updateEntityPreview('roof', roof.id, { x: 2, z: 3, width: 8, depth: 10 }), true);

  const updatedRoof = editor.getEntity('roof', roof.id);
  assert.equal(updatedRoof.width, 8);
  assert.equal(updatedRoof.depth, 10);
  assert.equal(updatedRoof.x, 2);
  assert.equal(updatedRoof.z, 3);

  assert.equal(await editor.commitEntityPreview('roof', roof.id), true);
  await destroyHarness(harness);
});
