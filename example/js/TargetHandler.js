import { TARGET_TYPES } from './types.js';
import { selection } from '../store/index.js';
import { createStoreProxy } from '../store/proxyHelper.js';
import { extractMaterial } from './MaterialManager.js';
import { toggleFirstPerson } from './FirstPersonController.js';

let rawCtx = null;
const ctx = createStoreProxy(() => rawCtx);

export function initTargetHandler(context) {
  rawCtx = context;
}

export function isAllowedTarget(target) {
  return Object.values(TARGET_TYPES).includes(target?.type);
}

export function getTargetObject(target) {
  if (!target) return null;
  if (target.type === TARGET_TYPES.ITEM) return ctx.testMap.getEntity('item', target.id);
  if (target.type === TARGET_TYPES.WALL) return ctx.testMap.getEntity('wall', target.id);
  if (target.type === TARGET_TYPES.OPENING) return ctx.testMap.getEntity('opening', target.id);
  if (target.type === TARGET_TYPES.ROOF) return ctx.testMap.getEntity('roof', target.id);
  if (target.type === TARGET_TYPES.STAIRS) return ctx.testMap.getEntity('stairs', target.id);
  if (target.type === TARGET_TYPES.ROOM) return ctx.testMap.getEntity('room', target.id);
  if (target.type === TARGET_TYPES.FENCE) return ctx.testMap.getEntity('fence', target.id);
  if (target.type === TARGET_TYPES.FENCE_GATE) return ctx.testMap.getEntity('fence_gate', target.id);
  return null;
}

export function isTargetLocked(target) {
  return !!getTargetObject(target)?.locked;
}

export function setTargetLocked(target, locked) {
  if (!isAllowedTarget(target)) return;
  ctx.testMap.executeCommand('setTargetLocked', { type: target.type, id: target.id, locked });
}

export function getTargetFloorId(target) {
  if (!target) return null;
  if (target.type === TARGET_TYPES.ROOM) return ctx.testMap.getEntity('room', target.id)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.WALL) return ctx.testMap.getEntity('wall', target.id)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.OPENING) return ctx.testMap.getEntity('opening', target.id)?.floorId || ctx.testMap.getEntity('wall', ctx.testMap.getEntity('opening', target.id)?.wallId)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.ITEM) return ctx.testMap.getEntity('item', target.id)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.ROOF) return ctx.testMap.getEntity('roof', target.id)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.STAIRS) return ctx.testMap.getEntity('stairs', target.id)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.FENCE) return ctx.testMap.getEntity('fence', target.id)?.floorId || 'floor_1';
  if (target.type === TARGET_TYPES.FENCE_GATE) return ctx.testMap.getEntity('fence_gate', target.id)?.floorId || 'floor_1';
  return ctx.testMap.getCurrentFloorId();
}

export function isTargetOnCurrentFloor(target) {
  return getTargetFloorId(target) === ctx.testMap.getCurrentFloorId();
}

export function get2DTargetFromElement(element) {
  const wall = element.closest?.('[data-wall-id]');
  if (wall?.dataset.wallId) return { type: 'wall', id: wall.dataset.wallId };
  const item = element.closest?.('[data-item-id]');
  if (item?.dataset.itemId) return { type: 'item', id: item.dataset.itemId };
  const opening = element.closest?.('[data-opening-id]');
  if (opening?.dataset.openingId) return { type: 'opening', id: opening.dataset.openingId };
  const roof = element.closest?.('[data-roof-id]');
  if (roof?.dataset.roofId) return { type: 'roof', id: roof.dataset.roofId };
  const stairs = element.closest?.('[data-stairs-id]');
  if (stairs?.dataset.stairsId) return { type: 'stairs', id: stairs.dataset.stairsId };
  const fence = element.closest?.('[data-fence-id]');
  if (fence?.dataset.fenceId) return { type: 'fence', id: fence.dataset.fenceId };
  const fenceGate = element.closest?.('[data-fence-gate-id]');
  if (fenceGate?.dataset.fenceGateId) return { type: 'fence_gate', id: fenceGate.dataset.fenceGateId };
  const roomHit = element.closest?.('[data-room-hit-id]');
  if (roomHit?.dataset.roomHitId) return { type: 'room', id: roomHit.dataset.roomHitId };
  const room = element.closest?.('[data-room-id]');
  if (room?.dataset.roomId) return { type: 'room', id: room.dataset.roomId };
  return null;
}

export function isSwitchableTarget(target) {
  if (!target) return false;
  if (target.type === 'opening' || target.type === 'fence_gate') return true;
  if (target.type === 'item') {
    const item = ctx.testMap.getEntity('item', target.id);
    if (!item) return false;
    const def = ctx.testMap.getFurnitureDefinition(item.type);
    return !!(def && (def.category === 'lighting' || def.lightSource || def.powerEffect || def.isSwitchable || item.isOn !== undefined || item.lightOn !== undefined));
  }
  return false;
}

export function isLightingTarget(target) {
  if (!target || target.type !== 'item') return false;
  const item = ctx.testMap.getEntity('item', target.id);
  if (!item) return false;
  const def = ctx.testMap.getFurnitureDefinition(item.type);
  return !!(def && (def.category === 'lighting' || def.lightSource));
}

function getSeasonalItemMeta(target) {
  if (!target || target.type !== 'item') return null;
  const item = ctx.testMap.getEntity('item', target.id);
  if (!item) return null;
  const def = ctx.testMap.getFurnitureDefinition(item.type);
  const seasonOptions = def?.seasonOptions || [];
  if (!seasonOptions.length) return null;

  const fallbackSeason = def.defaultSeason || seasonOptions[0].value;
  const currentSeason = seasonOptions.find((option) => option.value === item.season)?.value || fallbackSeason;
  const currentLabel = seasonOptions.find((option) => option.value === currentSeason)?.label || currentSeason;
  return { currentSeason, currentLabel };
}

export function pickColorFromContextMenu(target) {
  extractMaterial(target, false);
}

export function showObjectContextMenu(target, clientX, clientY) {
  if (!isAllowedTarget(target)) return;
  const isRotatable = ['item', 'roof', 'stairs', 'opening', 'fence_gate', 'fence', 'wall', 'room'].includes(target.type);
  const isMirrorable = ['item', 'roof', 'stairs', 'opening', 'fence_gate', 'fence'].includes(target.type);
  const isSwitchable = isSwitchableTarget(target);
  const isLighting = isLightingTarget(target);
  const seasonalMeta = getSeasonalItemMeta(target);
  const isLocked = isTargetLocked(target);

  const isDoorLike = (target.type === 'fence_gate') || (target.type === 'opening' && ctx.testMap.getEntity('opening', target.id)?.type === 'door');
  const isDouble = target.type === 'opening'
    ? !!ctx.testMap.getEntity('opening', target.id)?.doubleDoor
    : (target.type === 'fence_gate' ? !!ctx.testMap.getEntity('fence_gate', target.id)?.doubleDoor : false);
  
  let isWaterContainer = false;
  let isWaterOn = true;
  if (target.type === 'item') {
    const item = ctx.testMap.getEntity('item', target.id);
    if (item && ['bathtub', 'sink_kitchen', 'sink_bathroom', 'birdbath', 'garden_fountain'].includes(item.type)) {
      isWaterContainer = true;
      isWaterOn = item.waterEnabled !== false;
    }
  }

  let isToilet = false;
  let isLidOpen = false;
  if (target.type === 'item') {
    const item = ctx.testMap.getEntity('item', target.id);
    if (item && item.type === 'toilet') {
      isToilet = true;
      isLidOpen = item.lidOpen === true;
    }
  }

  const isOpening = target.type === 'opening';
  let isDoor = false;
  let isWindow = false;
  let isPanelHidden = false;
  let isGlassHidden = false;
  let isMannequin = false;

  if (target.type === 'item') {
    const item = ctx.testMap.getEntity('item', target.id);
    isMannequin = item && item.type === 'mannequin';
  }

  if (isOpening) {
    const opening = ctx.testMap.getEntity('opening', target.id);
    if (opening) {
      isDoor = opening.type === 'door';
      isWindow = opening.type === 'window';
      isPanelHidden = !!opening.panelHidden;
      isGlassHidden = !!opening.glassHidden;
    }
  }
  
  // 判定物体是否是具有交互点位（如椅子、床）的家具，获取其交互姿态类型
  const definition = target.type ? ctx.testMap.getFurnitureDefinition(target.type) : null;
  const hasInteraction = definition && definition.interaction && typeof definition.interaction.getInteractionPoints === 'function';
  const interactionType = hasInteraction ? (definition.interaction.type || 'sit') : 'sit';

  ctx.showIconMenu(clientX, clientY, [
    { icon: 'copy', title: '复制', onClick: () => copyTarget(target) },
    { icon: 'pipette', title: '取色', onClick: () => pickColorFromContextMenu(target) },
    isRotatable && {
      icon: 'rotate',
      title: '旋转',
      disabled: isLocked || (target.type === 'fence_gate' && !!ctx.testMap.getEntity('fence_gate', target.id)?.fenceId),
      onClick: () => rotateTarget(target)
    },
    isMirrorable && { icon: 'flip', title: '镜像', disabled: isLocked, onClick: () => mirrorTarget(target) },
    isDoorLike && {
      icon: 'double_door',
      title: isDouble ? '单开' : '双开',
      disabled: isLocked,
      onClick: () => {
        ctx.pushHistory();
        if (target.type === 'opening') {
          ctx.testMap.executeCommand('updateOpening', { openingId: target.id, patch: { doubleDoor: !isDouble } });
          if (selection.selectedOpeningId === target.id) ctx.updateEditor();
        } else if (target.type === 'fence_gate') {
          ctx.testMap.executeCommand('updateFenceGate', { gateId: target.id, patch: { doubleDoor: !isDouble } });
          if (selection.selectedFenceGateId === target.id) ctx.updateEditor();
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    },
    isWaterContainer && {
      icon: 'droplet',
      title: isWaterOn ? '排水' : '放水',
      disabled: isLocked,
      onClick: () => ctx.entityManager.toggleItemWater(target.id)
    },
    isToilet && {
      icon: 'door',
      title: isLidOpen ? '合盖' : '开盖',
      disabled: isLocked,
      onClick: () => ctx.entityManager.toggleItemLid(target.id)
    },
    isSwitchable && { 
      icon: isLighting ? 'power' : (['opening', 'fence_gate'].includes(target.type) ? 'door' : 'power'), 
      title: '开关', 
      disabled: isLocked,
      onClick: () => toggleTarget(target) 
    },
    window.firstPersonActive && hasInteraction && {
      icon: 'power',
      title: interactionType === 'lie' ? '躺下' : '坐下',
      onClick: () => {
        document.querySelector('.icon-menu')?.remove();
        if (typeof window.firstPersonSitOnSeat === 'function') {
          window.firstPersonSitOnSeat(target.id);
        }
      }
    },
    isMannequin && {
      icon: 'power',
      title: '进入操控',
      onClick: () => {
        document.querySelector('.icon-menu')?.remove();
        toggleFirstPerson(rawCtx, target.id);
      }
    },
    seasonalMeta && {
      icon: { name: 'season', active: seasonalMeta.currentSeason },
      title: `季节：${seasonalMeta.currentLabel}`,
      disabled: isLocked,
      onClick: () => ctx.entityManager.cycleItemSeason(target.id)
    },
    isDoor && {
      icon: isPanelHidden ? 'eye' : 'eye_off',
      title: isPanelHidden ? '显示门板' : '隐藏门板',
      disabled: isLocked,
      onClick: () => {
        ctx.pushHistory();
        ctx.testMap.executeCommand('updateOpening', { openingId: target.id, patch: { panelHidden: !isPanelHidden } });
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    },
    isWindow && {
      icon: isGlassHidden ? 'eye' : 'eye_off',
      title: isGlassHidden ? '显示玻璃' : '隐藏玻璃',
      disabled: isLocked,
      onClick: () => {
        ctx.pushHistory();
        ctx.testMap.executeCommand('updateOpening', { openingId: target.id, patch: { glassHidden: !isGlassHidden } });
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    },
    { icon: isLocked ? 'unlock' : 'lock', title: isLocked ? '解锁' : '锁定', onClick: () => toggleTargetLock(target) },
    { icon: 'trash', title: '删除', disabled: isLocked, onClick: () => deleteTarget(target) }
  ]);
}

export function toggleTargetLock(target) {
  if (!isAllowedTarget(target)) return;
  if (target.type === 'item') {
    ctx.entityManager.toggleItemLock(target.id);
    return;
  }
  const object = getTargetObject(target);
  if (!object) return;
  ctx.pushHistory();
  setTargetLocked(target, !object.locked);
  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function toggleTarget(target) {
  if (!isAllowedTarget(target)) return;
  if (isTargetLocked(target)) return;
  if (target.type === 'item') {
    ctx.entityManager.toggleItemPower(target.id);
    return;
  }
  ctx.pushHistory();
  if (target.type === 'opening') {
    const opening = ctx.testMap.getEntity('opening', target.id);
    if (!opening) return;
    ctx.testMap.executeCommand('updateOpening', { openingId: target.id, patch: { isOpen: !opening.isOpen } });
  } else if (target.type === 'fence_gate') {
    const gate = ctx.testMap.getEntity('fence_gate', target.id);
    if (!gate) return;
    ctx.testMap.executeCommand('updateFenceGate', { gateId: target.id, patch: { isOpen: !gate.isOpen } });
    if (selection.selectedFenceGateId === target.id) ctx.updateEditor();
  }
  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function rotateTarget(target) {
  if (!isAllowedTarget(target)) return;
  if (isTargetLocked(target)) return;
  if (target.type === 'item') {
    ctx.entityManager.rotateItem(target.id);
    return;
  }
  ctx.pushHistory();
  if (target.type === 'wall') {
    const wall = ctx.testMap.getEntity('wall', target.id);
    if (wall) {
      const cx = (wall.from[0] + wall.to[0]) / 2;
      const cz = (wall.from[1] + wall.to[1]) / 2;
      const dx = wall.to[0] - wall.from[0];
      const dz = wall.to[1] - wall.from[1];
      const nextFrom = [Number((cx + dz / 2).toFixed(3)), Number((cz - dx / 2).toFixed(3))];
      const nextTo = [Number((cx - dz / 2).toFixed(3)), Number((cz + dx / 2).toFixed(3))];
      ctx.testMap.executeCommand('updateWall', { wallId: target.id, patch: { from: nextFrom, to: nextTo } });
      if (selection.selectedWallId === target.id) {
        ctx.updateEditor();
      }
    }
  } else if (target.type === 'roof' || target.type === 'stairs') {
    const structure = getTargetObject(target);
    if (!structure) return;
    const currentDegrees = Math.round(((structure.rotation || 0) * 180 / Math.PI + 360) % 360);
    const nextDegrees = (currentDegrees + 90) % 360;
    ctx.testMap.executeCommand('updateStructure', { type: target.type, id: target.id, patch: { rotation: nextDegrees * Math.PI / 180 } });
    const selected = ctx.getSelectedStructure();
    if (selected && selected.type === target.type && selected.id === target.id) {
      ctx.updateEditor();
    }
  } else if (target.type === 'room') {
    const room = ctx.testMap.getEntity('room', target.id);
    if (!room) return;
    const currentDegrees = Math.round(((-room.rotation || 0) * 180 / Math.PI + 360) % 360);
    const nextDegrees = (currentDegrees + 90) % 360;
    ctx.testMap.executeCommand('updateRoom', { roomId: target.id, patch: { rotation: - (nextDegrees * Math.PI / 180) } });
    if (selection.selectedRoomId === target.id) {
      ctx.updateEditor();
    }
  } else if (target.type === 'opening') {
    const opening = ctx.testMap.getEntity('opening', target.id);
    if (!opening) return;
    const lr = !!opening.isFlippedLR;
    const io = !!opening.isFlippedIO;
    let state = 0;
    if (lr && !io) state = 1;
    else if (lr && io) state = 2;
    else if (!lr && io) state = 3;
    
    const nextState = (state + 1) % 4;
    const nextLr = (nextState === 1 || nextState === 2);
    const nextIo = (nextState === 2 || nextState === 3);
    
    ctx.testMap.executeCommand('updateOpening', {
      openingId: target.id,
      patch: {
        isFlippedLR: nextLr,
        isFlippedIO: nextIo
      }
    });
    if (selection.selectedOpeningId === target.id) {
      ctx.updateEditor();
    }
  } else if (target.type === 'fence_gate') {
    const gate = ctx.testMap.getEntity('fence_gate', target.id);
    if (!gate) return;
    const cx = (gate.from[0] + gate.to[0]) / 2;
    const cz = (gate.from[1] + gate.to[1]) / 2;
    const dx = gate.to[0] - gate.from[0];
    const dz = gate.to[1] - gate.from[1];
    const nextFrom = [cx + dz / 2, cz - dx / 2];
    const nextTo = [cx - dz / 2, cz + dx / 2];
    ctx.testMap.executeCommand('updateFenceGate', {
      gateId: target.id,
      patch: {
        from: nextFrom,
        to: nextTo
      }
    });
    if (selection.selectedFenceGateId === target.id) {
      ctx.updateEditor();
    }
  } else if (target.type === 'fence') {
    const fence = ctx.testMap.getEntity('fence', target.id);
    if (!fence) return;
    const cx = (fence.from[0] + fence.to[0]) / 2;
    const cz = (fence.from[1] + fence.to[1]) / 2;
    const dx = fence.to[0] - fence.from[0];
    const dz = fence.to[1] - fence.from[1];
    const nextFrom = [cx + dz / 2, cz - dx / 2];
    const nextTo = [cx - dz / 2, cz + dx / 2];
    ctx.testMap.executeCommand('updateFence', {
      fenceId: target.id,
      patch: {
        from: nextFrom,
        to: nextTo
      }
    });
    if (selection.selectedFenceId === target.id) {
      ctx.updateEditor();
    }
  }
  ctx.refreshShadows();
  ctx.renderPlan();
}

function findMatchingCurrentFloorWall(sourceWall, sourcePoint) {
  if (!sourceWall) return null;
  const [sx1, sz1] = sourceWall.from;
  const [sx2, sz2] = sourceWall.to;
  const sourceAngle = Math.atan2(sz2 - sz1, sx2 - sx1);
  let bestWall = null;
  let bestScore = Infinity;
  ctx.currentWalls().forEach((wall) => {
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const angle = Math.atan2(z2 - z1, x2 - x1);
    const angleDelta = Math.abs(Math.atan2(Math.sin(angle - sourceAngle), Math.cos(angle - sourceAngle)));
    const parallelDelta = Math.min(angleDelta, Math.abs(Math.PI - angleDelta));
    if (parallelDelta > Math.PI / 6) return;
    const projectedT = ctx.getWallProjectionT(wall, sourcePoint);
    const projected = ctx.wallPointAt(wall, projectedT);
    const distance = Math.hypot(projected.x - sourcePoint.x, projected.z - sourcePoint.z);
    const score = distance + parallelDelta * 2;
    if (score < bestScore) {
      bestScore = score;
      bestWall = wall;
    }
  });
  return bestWall;
}

export function mirrorTarget(target) {
  if (!isAllowedTarget(target)) return;
  if (isTargetLocked(target)) return;
  ctx.pushHistory();
  if (target.type === 'item') {
    const item = ctx.testMap.getEntity('item', target.id);
    if (item) {
      ctx.testMap.executeCommand('updateItem', { itemId: target.id, patch: { mirrored: !item.mirrored } });
    }
  } else if (target.type === 'opening') {
    const opening = ctx.testMap.getEntity('opening', target.id);
    if (opening) {
      ctx.testMap.executeCommand('updateOpening', { openingId: target.id, patch: { isFlippedLR: !opening.isFlippedLR } });
    }
  } else if (target.type === 'fence_gate') {
    const gate = ctx.testMap.getEntity('fence_gate', target.id);
    if (gate) {
      ctx.testMap.executeCommand('updateFenceGate', { gateId: target.id, patch: { isFlippedLR: !gate.isFlippedLR } });
      if (selection.selectedFenceGateId === target.id) ctx.updateEditor();
    }
  } else if (target.type === 'roof') {
    const roof = ctx.testMap.getEntity('roof', target.id);
    if (roof) {
      ctx.testMap.executeCommand('updateRoof', { roofId: target.id, patch: { mirrored: !roof.mirrored } });
    }
  } else if (target.type === 'stairs') {
    const stairs = ctx.testMap.getEntity('stairs', target.id);
    if (stairs) {
      ctx.testMap.executeCommand('updateStairs', { stairsId: target.id, patch: { mirrored: !stairs.mirrored } });
    }
  } else if (target.type === 'fence') {
    const fence = ctx.testMap.getEntity('fence', target.id);
    if (fence) {
      ctx.testMap.executeCommand('updateFence', {
        fenceId: target.id,
        patch: {
          from: [...fence.to],
          to: [...fence.from]
        }
      });
    }
  }
  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function copyTarget(target) {
  if (!isAllowedTarget(target)) return;
  if (target.type === 'item') {
    ctx.entityManager.copyItem(target.id);
    return;
  }
  ctx.pushHistory();
  let nextSelection = null;
  if (target.type === 'wall') {
    const wall = ctx.testMap.getEntity('wall', target.id);
    if (wall) {
      const copy = ctx.testMap.executeCommand('addWall', {
        from: [wall.from[0] + 1.0, wall.from[1] + 1.0],
        to: [wall.to[0] + 1.0, wall.to[1] + 1.0]
      });
      if (copy) {
        ctx.testMap.executeCommand('updateWall', {
          wallId: copy.id,
          patch: {
            color: wall.color,
            material: wall.material,
            materialFront: wall.materialFront,
            colorFront: wall.colorFront,
            materialBack: wall.materialBack,
            colorBack: wall.colorBack,
            baseboardEnabled: wall.baseboardEnabled,
            baseboardHeight: wall.baseboardHeight,
            baseboardMaterialFront: wall.baseboardMaterialFront,
            baseboardColorFront: wall.baseboardColorFront,
            baseboardMaterialBack: wall.baseboardMaterialBack,
            baseboardColorBack: wall.baseboardColorBack,
            wainscotEnabled: wall.wainscotEnabled,
            wainscotHeight: wall.wainscotHeight,
            wainscotMaterialFront: wall.wainscotMaterialFront,
            wainscotColorFront: wall.wainscotColorFront,
            wainscotMaterialBack: wall.wainscotMaterialBack,
            wainscotColorBack: wall.wainscotColorBack,
            floorId: ctx.testMap.getCurrentFloorId(),
            locked: false
          }
        });
        nextSelection = { type: 'wall', id: copy.id };
      }
    }
  } else if (target.type === 'opening') {
    const opening = ctx.testMap.getEntity('opening', target.id);
    const sourceWall = opening ? ctx.testMap.getEntity('wall', opening.wallId) : null;
    if (!opening || !sourceWall) return;
    const sourcePoint = ctx.wallPointAt(sourceWall, opening.t ?? 0.5);
    const targetWall = findMatchingCurrentFloorWall(sourceWall, sourcePoint);
    if (!targetWall) return;
    const nextT = Math.min(0.92, ctx.getWallProjectionT(targetWall, sourcePoint) + 0.08);
    const next = ctx.testMap.executeCommand('addOpening', {
      wallId: targetWall.id,
      type: opening.type,
      t: nextT,
      shape: opening.shape
    });
    if (next) {
      ctx.testMap.executeCommand('updateOpening', {
        openingId: next.id,
        patch: {
          width: opening.width,
          height: opening.height,
          sillHeight: opening.sillHeight,
          isOpen: opening.isOpen,
          isFlippedLR: opening.isFlippedLR,
          isFlippedIO: opening.isFlippedIO,
          panelHidden: opening.panelHidden,
          glassHidden: opening.glassHidden,
          floorId: ctx.testMap.getCurrentFloorId()
        }
      });
      nextSelection = { type: 'opening', id: next.id };
    }
  } else if (target.type === 'roof') {
    const roof = ctx.testMap.getEntity('roof', target.id);
    if (!roof) return;
    const copy = ctx.testMap.executeCommand('addRoof', {
      ...JSON.parse(JSON.stringify(roof)),
      id: undefined,
      x: (roof.x || 0) + 0.5,
      z: (roof.z || 0) + 0.5,
      floorId: ctx.testMap.getCurrentFloorId(),
      locked: false
    });
    nextSelection = { type: 'roof', id: copy.id };
  } else if (target.type === 'stairs') {
    const stairs = ctx.testMap.getEntity('stairs', target.id);
    if (!stairs) return;
    const copy = ctx.testMap.executeCommand('addStairs', {
      ...JSON.parse(JSON.stringify(stairs)),
      id: undefined,
      x: (stairs.x || 0) + 0.5,
      z: (stairs.z || 0) + 0.5,
      floorId: ctx.testMap.getCurrentFloorId(),
      locked: false
    });
    nextSelection = { type: 'stairs', id: copy.id };
  } else if (target.type === 'fence') {
    const fence = ctx.testMap.getEntity('fence', target.id);
    if (!fence) return;
    const copy = ctx.testMap.executeCommand('addFence', {
      ...JSON.parse(JSON.stringify(fence)),
      id: undefined,
      from: [(fence.from?.[0] || 0) + 0.5, (fence.from?.[1] || 0) + 0.5],
      to: [(fence.to?.[0] || 0) + 0.5, (fence.to?.[1] || 0) + 0.5],
      floorId: ctx.testMap.getCurrentFloorId(),
      locked: false
    });
    nextSelection = { type: 'fence', id: copy.id };
  } else if (target.type === 'room') {
    const room = ctx.testMap.getEntity('room', target.id);
    if (!room) return;
    const copy = ctx.testMap.executeCommand('addRoom', {
      ...JSON.parse(JSON.stringify(room)),
      id: undefined,
      name: room.name,
      x: room.x + 0.5,
      z: room.z + 0.5,
      floorId: ctx.testMap.getCurrentFloorId(),
      locked: false
    });
    nextSelection = { type: 'room', id: copy.id };
  } else if (target.type === 'fence_gate') {
    const gate = ctx.testMap.getEntity('fence_gate', target.id);
    if (!gate) return;
    const copy = ctx.testMap.executeCommand('addFenceGate', {
      ...JSON.parse(JSON.stringify(gate)),
      id: undefined,
      fenceId: null,
      from: [(gate.from?.[0] || 0) + 0.5, (gate.from?.[1] || 0) + 0.5],
      to: [(gate.to?.[0] || 0) + 0.5, (gate.to?.[1] || 0) + 0.5],
      floorId: ctx.testMap.getCurrentFloorId(),
      locked: false
    });
    nextSelection = { type: 'fence_gate', id: copy.id };
  }
  ctx.refreshShadows();
  selectTargetDescriptor(nextSelection || target);
}

export function deleteTarget(target) {
  if (!isAllowedTarget(target)) return;
  if (isTargetLocked(target)) return;
  if (target.type === 'item') {
    ctx.entityManager.deleteItem(target.id);
    return;
  }
  if (target.type === 'wall') {
    ctx.pushHistory();
    ctx.testMap.executeCommand('deleteWall', { wallId: target.id });
    ctx.clearSelection();
    ctx.refreshShadows();
    return;
  }
  if (target.type === 'room') {
    ctx.showCustomConfirm('提示', '确定要删除整个房间吗？房间内的家具都会移除').then((confirmed) => {
      if (confirmed) {
        ctx.pushHistory();
        ctx.testMap.executeCommand('deleteRoom', { roomId: target.id });
        ctx.clearSelection();
        ctx.refreshShadows();
      }
    });
    return;
  }
  ctx.pushHistory();
  if (target.type === 'opening') ctx.testMap.executeCommand('deleteOpening', { openingId: target.id });
  if (target.type === 'roof') ctx.testMap.executeCommand('deleteRoof', { roofId: target.id });
  if (target.type === 'stairs') ctx.testMap.executeCommand('deleteStairs', { stairsId: target.id });
  if (target.type === 'fence') ctx.testMap.executeCommand('deleteFence', { fenceId: target.id });
  if (target.type === 'fence_gate') ctx.testMap.executeCommand('deleteFenceGate', { gateId: target.id });
  ctx.clearSelection();
  ctx.refreshShadows();
  ctx.renderPlan();
}

export function selectTargetDescriptor(target) {
  if (!target || !isTargetOnCurrentFloor(target)) return;
  if (target.type === 'item') ctx.selectItem(target.id, true);
  if (target.type === 'wall') ctx.selectWall(target.id);
  if (target.type === 'opening') ctx.selectOpening(target.id);
  if (target.type === 'roof') ctx.selectRoof(target.id);
  if (target.type === 'stairs') ctx.selectStairs(target.id);
  if (target.type === 'fence') ctx.selectFence(target.id);
  if (target.type === 'room') ctx.selectRoom(target.id);
  if (target.type === 'fence_gate') ctx.selectFenceGate(target.id);
}

export function get3DTarget(event) {
  const target = ctx.getCanvasPickFromEvent(event);
  if (!target || target.type === 'edit-handle') return null;
  return isAllowedTarget(target) ? { type: target.type, id: target.id } : null;
}
