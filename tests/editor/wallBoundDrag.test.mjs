import assert from 'node:assert/strict';
import test from 'node:test';
import { DragHandler } from '../../src/editor/DragHandler.js';
import { end3DDrag, initDrag3DContext, onDrag3DDown } from '../../example/js/Drag3DContext.js';

test('3D opening drag honors the geometrically hit wall instead of a closer projected back wall', () => {
  const walls = [
    { id: 'front', from: [0, 0], to: [4, 0] },
    { id: 'back', from: [0, 3], to: [4, 3] }
  ];
  const opening = { id: 'door-1', wallId: 'front', t: 0.5 };
  let appliedPatch = null;
  const handler = new DragHandler({
    currentWalls: () => walls,
    snapEnabled: false,
    snapSize: 1,
    pushHistory() {},
    updateEditor() {},
    renderPlan() {},
    testMap: {
      getEntity(type, id) {
        if (type === 'opening' && id === opening.id) return opening;
        if (type === 'wall') return walls.find((wall) => wall.id === id);
        return null;
      },
      updateEntityPreview(_type, _id, patch) {
        appliedPatch = patch;
      }
    }
  });

  handler.moveOpeningToWorld(opening.id, { x: 2, z: 2.8, wallId: 'front' });

  assert.equal(appliedPatch.wallId, 'front');
  assert.equal(appliedPatch.t, 0.5);
});

test('clicking an opening selects it without committing a drag or changing its wall', () => {
  const previousDocument = globalThis.document;
  let cancelCount = 0;
  let commitCount = 0;
  const opening = { id: 'door-1', wallId: 'front', t: 0.5 };
  globalThis.document = { body: { classList: { add() {}, remove() {} } } };

  try {
    const context = {
      drag3DState: null,
      selectOpening() {},
      testMap: {
        getEntity: () => opening,
        beginEntityPreview() {},
        cancelEntityPreview() { cancelCount += 1; },
        commitEntityPreview() { commitCount += 1; return Promise.resolve(true); }
      },
      canvas: {
        setPointerCapture() {},
        releasePointerCapture() {}
      },
      camera: {
        detachControl() {},
        attachControl() {}
      },
      setEditHandleDragState() {}
    };
    initDrag3DContext(context);
    const event = { pointerId: 7, clientX: 120, clientY: 80, preventDefault() {} };

    onDrag3DDown({ type: 'opening', id: opening.id }, event);
    end3DDrag(event);

    assert.equal(cancelCount, 1);
    assert.equal(commitCount, 0);
  } finally {
    globalThis.document = previousDocument;
  }
});
