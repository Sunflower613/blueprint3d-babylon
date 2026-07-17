let Context = null;

export function initDesignController(appState) {
  Context = appState;
}

export function isAddRoomMode(value = Context.mode) {
  return value === 'add-room' || value.startsWith('add-room-');
}

export function roomShapeFromMode(value = Context.mode) {
  return value === 'add-room' ? 'square' : value.replace('add-room-', '') || 'square';
}

export function getOpeningModeInfo(value = Context.mode) {
  const match = /^add-(door|window)(?:-(.+))?$/.exec(value);
  return match ? { type: match[1], shape: match[2] || 'square' } : null;
}

export function isAddOpeningMode(value = Context.mode) {
  return !!getOpeningModeInfo(value);
}

export function handleModeChange(newMode) {
  document.body.classList.toggle('mode-delete-wall', newMode === 'delete-wall');
  if (newMode === 'delete-wall') Context.showToast('删除墙体模式');
  Context.refresh3DGrid();
}

export function switchToSelectMode() {
  Context.clear2DStairsRailingPreview();
  Context.clear3DStairsRailingPreview();
  const selectButton = document.querySelector('.mode[data-mode="select"]');
  if (selectButton) {
    selectButton.click();
    return;
  }
  Context.mode = 'select';
  Context.drawStart = null;
  document.querySelectorAll('.mode').forEach((candidate) => candidate.classList.toggle('active', candidate.dataset.mode === 'select'));
  handleModeChange(Context.mode);
  Context.syncLocalToStore();
  Context.renderPlan();
}

export function setDesignMode(newMode, lockBrush = false) {
  if (newMode !== 'brush') {
    Context.designModeBrushLocked = false;
    Context.selection.pickerCopiedItemType = null;
    Context.selection.pickerCopiedItemMaterials = null;
    Context.selection.pickerCopiedItemColors = null;
  } else if (lockBrush) {
    Context.designModeBrushLocked = true;
  }
  Context.designMode = newMode;

  document.querySelectorAll('.design-tools .design-mode').forEach((button) => {
    const isActive = button.dataset.designMode === Context.designMode;
    button.classList.toggle('active', isActive);
    if (button.dataset.designMode !== 'brush') return;
    button.classList.toggle('locked', Context.designModeBrushLocked);
    const shortcut = button.querySelector('.mode-shortcut');
    if (shortcut) shortcut.textContent = isActive ? (Context.designModeBrushLocked ? 'B / Locked' : 'B / Click again to lock') : 'B';
  });

  document.body.classList.remove(
    'design-mode-select', 'design-mode-picker', 'design-mode-brush',
    'design-mode-brush-locked', 'design-mode-bucket', 'design-mode-eraser'
  );
  const className = Context.designMode === 'brush' && Context.designModeBrushLocked
    ? 'design-mode-brush-locked'
    : `design-mode-${Context.designMode}`;
  document.body.classList.add(className);
  Context.syncLocalToStore();
  Context.updateDesignCursor();
}

function readComponentMaterial(entity, componentId, prefix = '') {
  const materialKey = prefix ? `${prefix}Material` : 'material';
  const colorKey = prefix ? `${prefix}Color` : 'color';
  return entity?.[materialKey] || entity?.[colorKey] || entity?.material || entity?.color || null;
}

export function getPickedColorFromTarget(target) {
  if (!target) return null;
  const map = Context.testMap;
  let descriptor = null;

  if (target.type === 'room') {
    const room = map.getEntity('room', target.id);
    descriptor = room?.material || room?.color;
  } else if (target.type === 'wall') {
    const wall = map.getEntity('wall', target.id);
    const side = target.pick
      ? Context.findWallSideFromNode(target.pick.pickedMesh)
      : (target.point ? Context.get2DWallSideFromPoint(wall, target.point) : null);
    const suffix = side ? `${side[0].toUpperCase()}${side.slice(1)}` : '';
    descriptor = wall?.[`material${suffix}`] || wall?.[`color${suffix}`] || wall?.material || wall?.color;
  } else if (target.type === 'item') {
    const item = map.getEntity('item', target.id);
    let componentId = target.pick ? Context.findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
    const definition = item ? map.getFurnitureDefinition?.(item.type) : null;
    componentId ||= definition?.components?.[0]?.id;
    descriptor = item?.materials?.[componentId] || item?.colors?.[componentId];
    if (!descriptor) descriptor = definition?.components?.find((component) => component.id === componentId)?.defaultColor;
  } else if (target.type === 'fence' || target.type === 'fence_gate') {
    const entity = map.getEntity(target.type, target.id);
    const componentId = target.pick ? Context.findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
    descriptor = readComponentMaterial(entity, componentId, componentId === 'frame' || componentId === 'panel' ? componentId : '');
  } else if (target.type === 'opening') {
    const opening = map.getEntity('opening', target.id);
    const componentId = target.pick ? Context.findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
    descriptor = componentId ? opening?.[`${componentId}Material`] : opening?.material;
    descriptor ||= opening?.color;
  } else if (target.type === 'roof') {
    const roof = map.getEntity('roof', target.id);
    const componentId = target.pick ? Context.findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
    descriptor = readComponentMaterial(roof, componentId, componentId === 'side' || componentId === 'bottom' ? componentId : '');
  } else if (target.type === 'stairs') {
    const stairs = map.getEntity('stairs', target.id);
    const componentId = target.pick ? Context.findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
    descriptor = readComponentMaterial(stairs, componentId, componentId === 'side' ? 'side' : '');
  }

  if (typeof descriptor === 'string') return descriptor;
  return descriptor?.color || null;
}

export function executeDesignTool(target) {
  const hasMaterial = Context.editor.activeMaterialDescriptor
    || (Context.editor.activeMaterialArray?.length > 0);
  if (Context.designMode === 'brush' && !hasMaterial) {
    Context.showToast('请先选择材质');
    return;
  }
  if (Context.designMode === 'picker') {
    Context.extractMaterial(target, true);
    return;
  }
  if (Context.designMode === 'brush' || Context.designMode === 'bucket') {
    Context.applyMaterial(target, Context.designMode);
    if (Context.designMode === 'bucket' || !Context.designModeBrushLocked) setDesignMode('select');
    return;
  }
  if (Context.designMode !== 'eraser' || Context.isTargetLocked(target)) return;

  Context.pushHistory();
  const map = Context.testMap;
  if (target.type === 'room') {
    map.executeCommand('setRoomFloorMaterial', {
      roomId: target.id,
      material: Context.DEFAULT_MATERIAL_PACKS.find((material) => material.id === 'wood-light-fine')
    });
  } else if (target.type === 'wall') {
    const wall = map.getEntity('wall', target.id);
    const side = target.pick
      ? Context.findWallSideFromNode(target.pick.pickedMesh)
      : (target.point ? Context.get2DWallSideFromPoint(wall, target.point) : null);
    const patch = side === 'front'
      ? { materialFront: null, colorFront: null }
      : side === 'back'
        ? { materialBack: null, colorBack: null }
        : { material: '#f9fbff', color: '#f9fbff', materialFront: null, colorFront: null, materialBack: null, colorBack: null };
    map.executeCommand('updateWall', { wallId: target.id, patch });
  } else if (target.type === 'item') {
    const item = map.getEntity('item', target.id);
    const componentId = target.pick
      ? Context.findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId')
      : map.getFurnitureDefinition?.(item?.type)?.components?.[0]?.id;
    if (item && componentId) {
      const materials = { ...(item.materials || {}) };
      const colors = { ...(item.colors || {}) };
      delete materials[componentId];
      delete colors[componentId];
      map.updateItem(target.id, { materials, colors });
    }
  } else if (target.type === 'fence') {
    map.updateFence(target.id, { material: '#8d6e63', color: '#8d6e63', frameMaterial: null, frameColor: null, panelMaterial: null, panelColor: null });
  } else if (target.type === 'fence_gate') {
    map.updateFenceGate(target.id, { material: null, color: null, frameMaterial: null, frameColor: null, panelMaterial: null, panelColor: null });
  } else if (target.type === 'opening') {
    map.executeCommand('resetOpeningMaterial', { openingId: target.id });
  } else if (target.type === 'roof') {
    map.updateRoof(target.id, { material: null, color: null });
  } else if (target.type === 'stairs') {
    map.updateStairs(target.id, { material: null, color: null });
  }
  Context.refreshShadows();
  Context.updateEditor();
  Context.renderPlan();
  setDesignMode('select');
}
