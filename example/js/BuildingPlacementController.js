import { Topology } from '../../src/index.js';

let Context = null;
let activePlacement = null;

export function initBuildingPlacementController(appState) {
  Context = appState;
}

export function isBuildingPlacementActive() {
  return !!activePlacement;
}

export function getBuildingPlacement() {
  return activePlacement;
}

/**
 * 判断指定模式是否属于支持 3D/2D 跟随预览的建筑组件模式（排除了 draw-fence）
 */
export function isBuildingPlacementMode(mode = Context?.mode) {
  if (!mode) return false;
  return (
    mode.startsWith('add-room-') ||
    mode === 'add-room' ||
    mode.startsWith('add-door-') ||
    mode === 'add-door' ||
    mode.startsWith('add-window-') ||
    mode === 'add-window' ||
    mode.startsWith('add-roof-') ||
    mode === 'add-roof' ||
    mode.startsWith('add-stairs-') ||
    mode === 'add-stairs' ||
    mode.startsWith('add-fence-gate-') ||
    mode === 'add-fence-gate'
  );
}

function applyPreviewStyle(type, id) {
  if (!Context?.testMap?.scene) return;
  const scene = Context.testMap.scene;
  const node = scene.getNodeByName(`${type}_${id}`)
    || scene.getNodeByName(`item_${id}`)
    || scene.getNodeByName(`room_${id}`)
    || scene.getNodeByName(`opening_${id}`)
    || scene.getNodeByName(`roof_${id}`)
    || scene.getNodeByName(`stairs_${id}`)
    || scene.getNodeByName(`fenceGate_${id}`)
    || scene.getNodeByName(`fence_gate_${id}`);

  if (!node || typeof node.getChildMeshes !== 'function') return;

  const childMeshes = node.getChildMeshes(false);
  childMeshes.forEach((mesh) => {
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    if (mesh.material && !mesh.material._isBuildingPreviewCloned) {
      const clonedMat = mesh.material.clone(`${mesh.material.name}_bldg_preview`);
      clonedMat.alpha = 0.6;
      clonedMat.backFaceCulling = false;
      clonedMat._isBuildingPreviewCloned = true;
      mesh.material = clonedMat;
    }
  });
}

function getInitialBuildingPos() {
  const initialPoint = Context.getPlacementInitialPoint
    ? Context.getPlacementInitialPoint()
    : { x: 0, z: 0 };
  const snapped = Context.snapWorldPoint
    ? Context.snapWorldPoint(initialPoint)
    : initialPoint;
  return { x: snapped.x, z: snapped.z };
}

export function startBuildingPlacement(mode) {
  if (!isBuildingPlacementMode(mode)) return false;
  cancelBuildingPlacement({ render: false });

  const map = Context.testMap;
  if (!map) return false;

  const pos = getInitialBuildingPos();
  let entityType = null;
  let entity = null;

  try {
    if (mode.startsWith('add-room') || mode === 'add-room') {
      entityType = 'room';
      const shape = mode === 'add-room' ? 'square' : mode.replace('add-room-', '') || 'square';
      const roomCounter = Context.roomCounter || 1;
      entity = map.executeCommand('addRoom', {
        x: pos.x,
        z: pos.z,
        shape: shape,
        name: `新房间 ${roomCounter}`
      });
    } else if (mode.startsWith('add-door') || mode.startsWith('add-window') || mode === 'add-door' || mode === 'add-window') {
      entityType = 'opening';
      const match = /^add-(door|window)(?:-(.+))?$/.exec(mode);
      const openingType = match ? match[1] : 'door';
      const shape = match ? (match[2] || 'square') : 'square';
      const walls = map.getCurrentFloorEntities('wall');
      if (!walls || walls.length === 0) {
        Context.showToast?.('场景中暂无墙体，无法放置门窗');
        return false;
      }
      const wall = walls[0];
      entity = map.executeCommand('addOpening', {
        wallId: wall.id,
        t: 0.5,
        type: openingType,
        shape: shape
      });
    } else if (mode.startsWith('add-roof') || mode === 'add-roof') {
      entityType = 'roof';
      const subtype = mode.replace('add-roof-', '') || 'gable';
      const room = map.getRoomAt(pos.x, pos.z) || (map.getCurrentFloorEntities('room') || [])[0];
      const wallThickness = map.getSnapshot()?.wallThickness || 0.15;
      const roofBounds = Topology.calculateAutoRoofBounds(room, { x: pos.x, z: pos.z }, wallThickness);
      entity = map.executeCommand('addRoof', {
        x: roofBounds.x,
        z: roofBounds.z,
        width: roofBounds.width,
        depth: roofBounds.depth,
        subtype: subtype
      });
    } else if (mode.startsWith('add-stairs') || mode === 'add-stairs') {
      entityType = 'stairs';
      const subtype = mode.replace('add-stairs-', '') || 'straight';
      entity = map.executeCommand('addStairs', {
        x: pos.x,
        z: pos.z,
        subtype: subtype
      });
    } else if (mode.startsWith('add-fence-gate') || mode === 'add-fence-gate') {
      entityType = 'fenceGate';
      const subtype = mode.replace('add-fence-gate-', '') || 'picket_wood';
      const fences = map.getCurrentFloorEntities('fence');
      if (fences && fences.length > 0) {
        entity = map.executeCommand('addFenceGate', {
          floorId: map.getCurrentFloorId(),
          fenceId: fences[0].id,
          t: 0.5,
          width: 1.0,
          subtype: subtype
        });
      } else {
        entity = map.executeCommand('addFenceGate', {
          floorId: map.getCurrentFloorId(),
          from: [pos.x - 0.5, pos.z],
          to: [pos.x + 0.5, pos.z],
          width: 1.0,
          subtype: subtype
        });
      }
    }

    if (!entity || !entityType) return false;

    // 开启底层事务预览快照，若节点尚未构建则调用 rebuild
    let previewStarted = map.beginEntityPreview(entityType, entity.id);
    if (!previewStarted) {
      map.rebuild?.();
      previewStarted = map.beginEntityPreview(entityType, entity.id);
    }
    if (!previewStarted) {
      return false;
    }

    activePlacement = {
      mode,
      type: entityType,
      id: entity.id
    };

    updateBuildingPlacement(pos);
    applyPreviewStyle(entityType, entity.id);
    document.body.classList.add('placing-building');
    Context.renderPlan?.();

    const isMobile = typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    );
    Context.showToast?.(isMobile ? '请点击场景放置建筑组件' : '点击左键放置建筑组件，右键取消');
    return true;
  } catch (error) {
    console.error('Failed to start building placement preview:', error);
    cancelBuildingPlacement({ render: false });
    return false;
  }
}

export function updateBuildingPlacement(point, pickTarget = null) {
  if (!activePlacement || !point) return;
  const { type, id, mode } = activePlacement;
  const map = Context.testMap;
  if (!map) return;

  try {
    if (type === 'opening') {
      let targetWall = null;
      if (pickTarget && pickTarget.type === 'wall') {
        targetWall = map.getEntity('wall', pickTarget.id);
      }
      if (!targetWall) {
        const walls = map.getCurrentFloorEntities('wall');
        if (!walls || walls.length === 0) return;
        let minDist = Infinity;
        walls.forEach((wall) => {
          const [x1, z1] = wall.from;
          const [x2, z2] = wall.to;
          const dist = Topology.pointToSegmentDistance({ x: point.x, z: point.z }, [x1, z1], [x2, z2]);
          if (dist < minDist) {
            minDist = dist;
            targetWall = wall;
          }
        });
      }

      if (targetWall) {
        const [x1, z1] = targetWall.from;
        const [x2, z2] = targetWall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len2 = dx * dx + dz * dz;
        let t = 0.5;
        if (len2 > 0) {
          t = ((point.x - x1) * dx + (point.z - z1) * dz) / len2;
          t = Math.max(0.05, Math.min(0.95, t));
        }
        map.updateEntityPreview('opening', id, { wallId: targetWall.id, t });
      }
    } else if (type === 'room') {
      const snapped = Context.snapWorldPoint ? Context.snapWorldPoint({ x: point.x, z: point.z }) : point;
      map.updateEntityPreview('room', id, { x: snapped.x, z: snapped.z, moveItems: false });
    } else if (type === 'roof') {
      const snapped = Context.snapWorldPoint ? Context.snapWorldPoint({ x: point.x, z: point.z }) : point;
      const room = map.getRoomAt(snapped.x, snapped.z) || (map.getCurrentFloorEntities('room') || [])[0];
      const wallThickness = map.getSnapshot()?.wallThickness || 0.15;
      const roofBounds = Topology.calculateAutoRoofBounds(room, { x: snapped.x, z: snapped.z }, wallThickness);
      map.updateEntityPreview('roof', id, {
        x: roofBounds.x,
        z: roofBounds.z,
        width: roofBounds.width,
        depth: roofBounds.depth
      });
    } else if (type === 'stairs') {
      const snapped = Context.snapWorldPoint ? Context.snapWorldPoint({ x: point.x, z: point.z }) : point;
      map.updateEntityPreview('stairs', id, { x: snapped.x, z: snapped.z });
    } else if (type === 'fenceGate') {
      let targetFence = null;
      let targetT = 0.5;
      if (pickTarget && pickTarget.type === 'fence') {
        targetFence = map.getEntity('fence', pickTarget.id);
        if (targetFence && pickTarget.pick?.pickedPoint) {
          const pt = pickTarget.pick.pickedPoint;
          const { t } = Topology.projectPointToFence(pt, targetFence, false, 0);
          targetT = t;
        }
      }

      if (!targetFence) {
        const fences = map.getCurrentFloorEntities('fence') || [];
        let minDist = Infinity;
        fences.forEach((fence) => {
          const dist = Topology.pointToSegmentDistance({ x: point.x, z: point.z }, fence.from, fence.to);
          if (dist < minDist) {
            minDist = dist;
            if (dist < 0.6) {
              targetFence = fence;
              const [x1, z1] = fence.from;
              const [x2, z2] = fence.to;
              const dx = x2 - x1;
              const dz = z2 - z1;
              const len2 = dx * dx + dz * dz;
              targetT = len2 > 0 ? Math.max(0.05, Math.min(0.95, ((point.x - x1) * dx + (point.z - z1) * dz) / len2)) : 0.5;
            }
          }
        });
      }

      if (targetFence) {
        map.updateEntityPreview('fenceGate', id, { fenceId: targetFence.id, t: targetT });
      } else {
        const snapped = Context.snapWorldPoint ? Context.snapWorldPoint({ x: point.x, z: point.z }) : point;
        map.updateEntityPreview('fenceGate', id, {
          fenceId: null,
          from: [snapped.x - 0.5, snapped.z],
          to: [snapped.x + 0.5, snapped.z]
        });
      }
    }

    applyPreviewStyle(type, id);
    Context.renderPlan?.();
  } catch (error) {
    console.error('Failed to update building placement preview:', error);
  }
}

export function commitBuildingPlacement(point, pickTarget = null) {
  if (!activePlacement) return false;
  updateBuildingPlacement(point, pickTarget);
  const { type, id } = activePlacement;
  const map = Context.testMap;
  if (!map) return false;

  try {
    if (type === 'room') Context.roomCounter = (Context.roomCounter || 1) + 1;
    map.commitEntityPreview(type, id);
    activePlacement = null;
    document.body.classList.remove('placing-building');
    Context.refreshShadows?.();
    Context.switchToSelectMode?.();
    Context.renderPlan?.();
    return true;
  } catch (error) {
    console.error('Failed to commit building placement:', error);
    cancelBuildingPlacement();
    return false;
  }
}

export function cancelBuildingPlacement({ render = true } = {}) {
  if (!activePlacement) return false;
  const { type, id } = activePlacement;
  const map = Context.testMap;
  activePlacement = null;
  document.body.classList.remove('placing-building');

  if (map && type && id) {
    try {
      map.cancelEntityPreview(type, id);
    } catch (error) {
      console.error('Failed to cancel entity preview:', error);
    }
  }

  if (render) Context?.renderPlan?.();
  return true;
}
