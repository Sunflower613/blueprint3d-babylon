import {
  testMap,
  viewer3d,
  entityManager,
  activeMaterialDescriptor,
  selectedRoomId,
  selectedWallId,
  selectedFenceId,
  selectedItemId,
  selectedOpeningId,
  selectedRoofId,
  selectedStairsId,
  selectedFenceGateId,
  
  INCHES_PER_UNIT,
  
  updateSelectedRoom,
  updateSelectedFloor,
  updateSelectedStructure,
  updateSelectedRotation,
  updateSelectedScale,
  updateSelectedPose,
  updateSelectedWallLength,
  updateSelectedWallRotation,
  previewSelectedWallRotation,
  commitSelectedStructureRotation,
  previewSelectedStructureRotation,
  deleteSelectedStructure,
  
  updateSelectedSize,
  updateSelectedOpening,
  updateSelectedFenceGate,
  deleteSelectedFenceGate,
  updateSelectedFenceSubtype,
  updateSelectedFenceLength,
  updateSelectedFenceHeight,
  updateSelectedFenceColor,
  updateSelectedFenceYOffset,
  
  applyMaterialToRoomFloor,
  applyMaterialToWallFront,
  applyMaterialToWallBack,
  applyMaterialToStructure,
  applyMaterialToItemComponent,
  applyMaterialToFence,
  applyMaterialToFenceGateFrame,
  applyMaterialToFenceGatePanel,
  
  isTargetLocked,
  showToast,
  pushHistory,
  refreshShadows,
  renderPlan,
  refresh3DGrid,
  findNearestSeat,
  isSymmetricShape,
  syncRotationInputs,
  setContextTargetLocked,
  clearSelection,
  revealRightPanelIfNeeded,
  
  getSnapEnabled,
  setSnapEnabled,
  getSnapSize,
  setSnapSize,
  
  showCustomConfirm,
  currentRooms,
  canPlaceOnTable,
  findTableBelow,
  findBookshelfNearby,
  snapToBookshelf,
  getShelfLayerHeights,
  getItemsCountOnBookshelf,
  getSelectedStructure
} from '../app.js';



export function ensure3DGridControls() {
  if (document.getElementById('show-3d-grid')) return;
  const snapSizeField = document.getElementById('snap-size')?.closest('.field');
  const snapEnabledField = document.getElementById('snap-enabled')?.closest('.check-field');
  const anchor = snapSizeField || snapEnabledField;
  if (!anchor?.parentElement) return;
  const label = document.createElement('label');
  label.className = 'check-field';
  const input = document.createElement('input');
  input.id = 'show-3d-grid';
  input.type = 'checkbox';
  input.checked = viewer3d.show3DGrid;
  const span = document.createElement('span');
  span.textContent = '显示3D网格';
  label.append(input, span);
  anchor.insertAdjacentElement('afterend', label);
  input.addEventListener('change', (event) => {
    viewer3d.show3DGrid = event.target.checked;
    refresh3DGrid();
  });
}

export function createStructureField(labelText, inputId, attrs = {}) {
  const label = document.createElement('label');
  label.className = 'field';
  const span = document.createElement('span');
  span.textContent = labelText;
  const input = document.createElement('input');
  input.id = inputId;
  Object.entries(attrs).forEach(([key, value]) => input.setAttribute(key, value));
  label.append(span, input);
  return label;
}

export function ensureStructureEditor() {
  if (document.getElementById('structure-editor')) return;
  const content = document.querySelector('#right-panel .right-panel-content');
  if (!content) return;
  const editor = document.createElement('div');
  editor.id = 'structure-editor';
  editor.className = 'editor hidden';
  const header = document.createElement('div');
  header.className = 'editor-header';

  const title = document.createElement('strong');
  title.id = 'selected-structure-name';
  title.textContent = '建筑组件';

  const lockLabel = document.createElement('label');
  lockLabel.className = 'switch';
  lockLabel.innerHTML = `
    <input id="structure-locked" type="checkbox" />
    <span class="slider">
      <span class="slider-button">
        <svg class="slider-icon unlock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
        <svg class="slider-icon lock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </span>
    </span>
  `;

  header.appendChild(title);
  header.appendChild(lockLabel);
  editor.appendChild(header);
  
  const subtypeLabel = document.createElement('label');
  subtypeLabel.className = 'field';
  const subtypeSpan = document.createElement('span');
  subtypeSpan.textContent = '类型';
  const subtypeSelect = document.createElement('select');
  subtypeSelect.id = 'structure-subtype';
  subtypeLabel.append(subtypeSpan, subtypeSelect);
  editor.appendChild(subtypeLabel);

  editor.appendChild(createStructureField('X (m)', 'structure-x', { type: 'number', step: '0.1' }));
  editor.appendChild(createStructureField('Z (m)', 'structure-z', { type: 'number', step: '0.1' }));
  const dimRow = document.createElement('div');
  dimRow.className = 'fields-row';
  dimRow.appendChild(createStructureField('宽度 (m)', 'structure-width', { type: 'number', min: '0.6', step: '0.1' }));
  dimRow.appendChild(createStructureField('深度 (m)', 'structure-depth', { type: 'number', min: '0.6', step: '0.1' }));
  dimRow.appendChild(createStructureField('高度 (m)', 'structure-height', { type: 'number', min: '0.2', step: '0.1' }));
  editor.appendChild(dimRow);
  const elevationField = createStructureField('离地高度 (m)', 'structure-elevation', { type: 'number', step: '0.1' });
  elevationField.id = 'structure-elevation-field';
  editor.appendChild(elevationField);
  const rotationLabel = createStructureField('旋转 (度)', 'structure-rotation', { type: 'number', min: '0', max: '359', step: '15' });
  const rotationRange = document.createElement('input');
  rotationRange.id = 'structure-rotation-range';
  rotationRange.type = 'range';
  rotationRange.min = '0';
  rotationRange.max = '360';
  rotationRange.step = '1';
  rotationLabel.appendChild(rotationRange);
  editor.appendChild(rotationLabel);
  editor.appendChild(createStructureField('踏步数', 'structure-steps', { type: 'number', min: '3', max: '32', step: '1' }));

  const sideHiddenLabel = document.createElement('label');
  sideHiddenLabel.className = 'check-field';
  sideHiddenLabel.id = 'structure-side-hidden-field';
  const sideHiddenInput = document.createElement('input');
  sideHiddenInput.id = 'structure-side-hidden';
  sideHiddenInput.type = 'checkbox';
  const sideHiddenSpan = document.createElement('span');
  sideHiddenSpan.textContent = '隐藏侧面';
  sideHiddenLabel.append(sideHiddenInput, sideHiddenSpan);
  editor.appendChild(sideHiddenLabel);

  const bottomHiddenLabel = document.createElement('label');
  bottomHiddenLabel.className = 'check-field';
  bottomHiddenLabel.id = 'structure-bottom-hidden-field';
  const bottomHiddenInput = document.createElement('input');
  bottomHiddenInput.id = 'structure-bottom-hidden';
  bottomHiddenInput.type = 'checkbox';
  const bottomHiddenSpan = document.createElement('span');
  bottomHiddenSpan.textContent = '隐藏天花板';
  bottomHiddenLabel.append(bottomHiddenInput, bottomHiddenSpan);
  editor.appendChild(bottomHiddenLabel);

  const mirroredLabel = document.createElement('label');
  mirroredLabel.className = 'check-field';
  mirroredLabel.id = 'structure-mirrored-field';
  const mirroredInput = document.createElement('input');
  mirroredInput.id = 'structure-mirrored';
  mirroredInput.type = 'checkbox';
  const mirroredSpan = document.createElement('span');
  mirroredSpan.textContent = '镜像翻转';
  mirroredLabel.append(mirroredInput, mirroredSpan);
  editor.appendChild(mirroredLabel);

  editor.appendChild(createStructureField('旋转度数 (度)', 'structure-spiral-degrees', { type: 'number', min: '45', max: '720', step: '15' }));
  editor.appendChild(createStructureField('拐角台阶位置', 'structure-corner-step', { type: 'number', min: '1', step: '1' }));
  editor.appendChild(createStructureField('间层宽度 (m)', 'structure-u-slot-width', { type: 'number', min: '0', max: '1.0', step: '0.05' }));
  editor.appendChild(createStructureField('中空长度 (m)', 'structure-u-void-length', { type: 'number', min: '0', max: '3.0', step: '0.1' }));

  // 弧度曲线调整把手 / 输入框
  const curveLabel = document.createElement('label');
  curveLabel.className = 'field';
  curveLabel.id = 'structure-curve-field';
  const curveSpan = document.createElement('span');
  curveSpan.textContent = '弧度 (m)';
  
  const curveContainer = document.createElement('div');
  curveContainer.style.display = 'flex';
  curveContainer.style.alignItems = 'center';
  curveContainer.style.gap = '5px';
  curveContainer.style.width = '100%';

  const btnDec = document.createElement('button');
  btnDec.type = 'button';
  btnDec.id = 'structure-curve-dec';
  btnDec.textContent = '-';
  btnDec.style.padding = '4px 8px';
  btnDec.style.cursor = 'pointer';

  const curveInput = document.createElement('input');
  curveInput.id = 'structure-curve';
  curveInput.type = 'number';
  curveInput.step = '0.05';
  curveInput.value = '0';
  curveInput.style.flex = '1';
  curveInput.style.minWidth = '0';

  const btnInc = document.createElement('button');
  btnInc.type = 'button';
  btnInc.id = 'structure-curve-inc';
  btnInc.textContent = '+';
  btnInc.style.padding = '4px 8px';
  btnInc.style.cursor = 'pointer';

  curveContainer.append(btnDec, curveInput, btnInc);
  curveLabel.append(curveSpan, curveContainer);
  editor.appendChild(curveLabel);

  const deleteButton = document.createElement('button');
  deleteButton.id = 'btn-delete-structure';
  deleteButton.type = 'button';
  deleteButton.className = 'danger';
  deleteButton.textContent = '删除组件';
  editor.appendChild(deleteButton);
  const openingEditor = document.getElementById('opening-editor');
  if (openingEditor) {
    openingEditor.insertAdjacentElement('afterend', editor);
  } else {
    content.appendChild(editor);
  }
}

export function updateEditor() {
  const floorEditor = document.getElementById('floor-editor');
  const roomEditor = document.getElementById('room-editor');
  const wallEditor = document.getElementById('wall-editor');
  const fenceEditor = document.getElementById('fence-editor');
  const itemEditor = document.getElementById('item-editor');
  const openingEditor = document.getElementById('opening-editor');
  const structureEditor = document.getElementById('structure-editor');
  const emptyState = document.getElementById('empty-state');
  const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : null;
  const wall = selectedWallId ? testMap.getWall(selectedWallId) : null;
  const fence = selectedFenceId ? testMap.getFence(selectedFenceId) : null;
  const fenceGate = selectedFenceGateId ? testMap.getFenceGate(selectedFenceGateId) : null;
  const item = selectedItemId ? testMap.getItem(selectedItemId) : null;
  const opening = selectedOpeningId ? testMap.getOpening(selectedOpeningId) : null;
  const roof = selectedRoofId ? testMap.getRoof?.(selectedRoofId) : null;
  const stairs = selectedStairsId ? testMap.getStairs?.(selectedStairsId) : null;
  const structure = roof || stairs;
  const structureType = roof ? 'roof' : (stairs ? 'stairs' : null);

  const hasSelection = !!room || !!wall || !!fence || !!fenceGate || !!item || !!opening || !!structure;
  floorEditor?.classList.toggle('hidden', hasSelection);
  roomEditor.classList.toggle('hidden', !room);
  wallEditor.classList.toggle('hidden', !wall);
  if (fenceEditor) fenceEditor.classList.toggle('hidden', !fence);
  const fenceGateEditor = document.getElementById('fence-gate-editor');
  if (fenceGateEditor) fenceGateEditor.classList.toggle('hidden', !fenceGate);
  itemEditor.classList.toggle('hidden', !item);
  openingEditor.classList.toggle('hidden', !opening);
  structureEditor?.classList.toggle('hidden', !structure);
  emptyState.classList.add('hidden');

  if (!hasSelection) {
    const currentFloorId = testMap.floorplan.currentFloorId;
    const currentFloor = testMap.floorplan.floors.find((f) => f.id === currentFloorId);
    if (currentFloor) {
      document.getElementById('selected-floor-name').textContent = currentFloor.name || '楼层属性';
      document.getElementById('floor-name').value = currentFloor.name || '';
      document.getElementById('floor-wall-height').value = Number((currentFloor.wallHeight ?? testMap.floorplan.wallHeight ?? 3.0).toFixed(2));
      document.getElementById('floor-height').value = Number((currentFloor.floorHeight ?? testMap.floorplan.floorHeight ?? 0.06).toFixed(2));
      document.getElementById('floor-hide-roof').checked = !!currentFloor.hideRoof;
      document.getElementById('floor-hide-wall').checked = !!currentFloor.hideWall;
    }
  }

  document.getElementById('floor-color').value = room?.color || testMap.floorplan.floor.color || '#f4efe6';

  if (room) {
    document.getElementById('selected-room-name').textContent = room.name || '房间';
    document.getElementById('room-name').value = room.name || '';
    document.getElementById('room-width').value = Number(room.width.toFixed(2));
    document.getElementById('room-depth').value = Number(room.depth.toFixed(2));

    const roomFloor = testMap.floorplan.floors.find((f) => f.id === room.floorId);
    const wallHeight = roomFloor ? (roomFloor.wallHeight ?? testMap.floorplan.wallHeight ?? 3.0) : (testMap.floorplan.wallHeight ?? 3.0);
    const roomElevationInput = document.getElementById('room-elevation');
    if (roomElevationInput) {
      roomElevationInput.max = wallHeight;
      roomElevationInput.value = Number((room.elevation || 0).toFixed(2));
    }

    document.getElementById('room-locked').checked = !!room.locked;
    document.getElementById('btn-delete-room').disabled = !!room.locked;
  }
  if (wall) {
    document.getElementById('selected-wall-name').textContent = '墙';
    document.getElementById('wall-length').value = Number(testMap.getWallLength(wall.id).toFixed(2));
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const angleRad = Math.atan2(dz, dx);
    const angleDeg = Math.round(((angleRad * 180 / Math.PI) + 360) % 360);
    document.getElementById('wall-rotation').value = angleDeg;
    document.getElementById('wall-rotation-range').value = angleDeg;
  }
  if (fence) {
    document.getElementById('selected-fence-name').textContent = '栅栏';
    document.getElementById('fence-subtype').value = fence.subtype || 'picket_wood';
    const dx = fence.to[0] - fence.from[0];
    const dz = fence.to[1] - fence.from[1];
    const length = Math.hypot(dx, dz);
    document.getElementById('fence-length').value = Number(length.toFixed(2));
    const angleRad = Math.atan2(dz, dx);
    const angleDeg = Math.round(((angleRad * 180 / Math.PI) + 360) % 360);
    document.getElementById('fence-rotation').value = angleDeg;
    document.getElementById('fence-rotation-range').value = angleDeg;
    document.getElementById('fence-height').value = fence.height || 1.1;
    document.getElementById('fence-yoffset').value = fence.yOffset !== undefined ? Number(fence.yOffset.toFixed(2)) : 0;
    const fenceColorEl = document.getElementById('fence-color');
    if (fenceColorEl) {
      fenceColorEl.value = fence.color || '#8d6e63';
    }
    document.getElementById('fence-locked').checked = !!fence.locked;
    document.getElementById('btn-delete-fence').disabled = !!fence.locked;
  }

  if (item) {
    document.getElementById('selected-name').textContent = item.name;
    document.getElementById('item-width').value = Number((item.width / INCHES_PER_UNIT).toFixed(2));
    document.getElementById('item-depth').value = Number((item.depth / INCHES_PER_UNIT).toFixed(2));
    document.getElementById('item-height').value = Number((item.height / INCHES_PER_UNIT).toFixed(2));
    const elevationVal = Number(((item.elevation || 0) / INCHES_PER_UNIT).toFixed(2));
    document.getElementById('item-elevation').value = elevationVal;
    const itemFloor = testMap.floorplan.floors.find((f) => f.id === item.floorId);
    const floorWallHeight = itemFloor ? (itemFloor.wallHeight ?? testMap.floorplan.wallHeight ?? 3.0) : (testMap.floorplan.wallHeight ?? 3.0);
    const elevationRange = document.getElementById('item-elevation-range');
    if (elevationRange) {
      elevationRange.max = floorWallHeight;
      elevationRange.value = elevationVal;
    }
    const rotationDegrees = Math.round(((item.rotation || 0) * 180 / Math.PI + 360) % 360);
    document.getElementById('item-rotation').value = rotationDegrees;
    document.getElementById('item-rotation-range').value = rotationDegrees;
    document.getElementById('item-scale').value = Number((item.scale || 1).toFixed(2));
    document.getElementById('item-scale-range').value = item.scale || 1;
    document.getElementById('item-locked').checked = !!item.locked;

    const poseField = document.getElementById('item-pose-field');
    if (item.type === 'mannequin') {
      const seat = findNearestSeat(item);
      if (seat) {
        poseField.classList.remove('hidden');
        document.getElementById('item-pose').value = item.pose || 'stand';
      } else {
        poseField.classList.add('hidden');
        if (item.pose && item.pose !== 'stand') {
          setTimeout(() => entityManager.resetItemPose(item.id), 0);
        }
      }
    } else {
      poseField.classList.add('hidden');
    }

    const lightField = document.getElementById('item-light-field');
    if (lightField) {
      const def = testMap.getFurnitureDefinition(item.type);
      if (def.category === 'lighting' || def.lightSource) {
        lightField.classList.remove('hidden');
        document.getElementById('item-light-on').checked = item.lightOn !== false;
      } else {
        lightField.classList.add('hidden');
      }
    }
  }

  if (structure) {
    document.getElementById('selected-structure-name').textContent = structureType === 'roof' ? '屋顶' : '楼梯';
    
    const xLabel = document.getElementById('structure-x')?.closest('label');
    const zLabel = document.getElementById('structure-z')?.closest('label');
    if (xLabel) xLabel.classList.add('hidden');
    if (zLabel) zLabel.classList.add('hidden');

    document.getElementById('structure-x').value = Number((structure.x || 0).toFixed(2));
    document.getElementById('structure-z').value = Number((structure.z || 0).toFixed(2));
    document.getElementById('structure-width').value = Number((structure.width || 1).toFixed(2));
    document.getElementById('structure-depth').value = Number((structure.depth || 1).toFixed(2));
    document.getElementById('structure-height').value = Number((structure.height || 1).toFixed(2));
    const rotationDegrees = Math.round(((structure.rotation || 0) * 180 / Math.PI + 360) % 360);
    document.getElementById('structure-rotation').value = rotationDegrees;
    document.getElementById('structure-rotation-range').value = rotationDegrees;
    const stepsField = document.getElementById('structure-steps').closest('label');
    stepsField.classList.toggle('hidden', structureType !== 'stairs');
    document.getElementById('structure-steps').value = structure.steps || 9;
    document.getElementById('structure-side-hidden').checked = !!structure.sideHidden;
    const bottomHiddenField = document.getElementById('structure-bottom-hidden-field');
    if (bottomHiddenField) {
      bottomHiddenField.classList.toggle('hidden', structureType !== 'roof');
    }
    document.getElementById('structure-bottom-hidden').checked = !!structure.bottomHidden;

    const curveField = document.getElementById('structure-curve-field');
    if (curveField) {
      curveField.classList.toggle('hidden', structureType !== 'roof');
    }
    const curveInput = document.getElementById('structure-curve');
    if (curveInput) {
      curveInput.value = Number((structure.curve || 0).toFixed(2));
    }

    const elevationField = document.getElementById('structure-elevation-field');
    if (elevationField) {
      elevationField.classList.toggle('hidden', structureType !== 'roof');
    }
    const elevationInput = document.getElementById('structure-elevation');
    if (elevationInput) {
      const roofFloor = testMap.getFloor?.(structure.floorId);
      const roofWallHeight = roofFloor ? (roofFloor.wallHeight ?? testMap.floorplan.wallHeight ?? 3.0) : (testMap.floorplan.wallHeight ?? 3.0);
      elevationInput.value = Number((structure.elevation ?? roofWallHeight).toFixed(2));
    }

    document.getElementById('structure-locked').checked = !!structure.locked;
    document.getElementById('btn-delete-structure').disabled = !!structure.locked;

    const mirroredField = document.getElementById('structure-mirrored-field');
    if (mirroredField) {
      mirroredField.classList.toggle('hidden', structureType !== 'stairs');
    }
    document.getElementById('structure-mirrored').checked = !!structure.mirrored;

    const subtype = structure.subtype || 'straight';
    
    const spiralDegreesInput = document.getElementById('structure-spiral-degrees');
    if (spiralDegreesInput) {
      const parentLabel = spiralDegreesInput.closest('label');
      if (parentLabel) {
        parentLabel.classList.toggle('hidden', structureType !== 'stairs' || (subtype !== 'spiral' && subtype !== 'curved'));
      }
      spiralDegreesInput.value = structure.spiralDegrees ?? (subtype === 'curved' ? 90 : 360);
    }

    const cornerStepInput = document.getElementById('structure-corner-step');
    if (cornerStepInput) {
      const parentLabel = cornerStepInput.closest('label');
      if (parentLabel) {
        parentLabel.classList.toggle('hidden', structureType !== 'stairs' || subtype !== 'lshape');
      }
      cornerStepInput.max = (structure.steps || 9) - 2;
      cornerStepInput.value = structure.cornerStep ?? Math.floor((structure.steps || 9) / 2);
    }

    const uSlotWidthInput = document.getElementById('structure-u-slot-width');
    if (uSlotWidthInput) {
      const parentLabel = uSlotWidthInput.closest('label');
      if (parentLabel) {
        parentLabel.classList.toggle('hidden', structureType !== 'stairs' || subtype !== 'ushape');
      }
      uSlotWidthInput.value = structure.uSlotWidth ?? 0.1;
    }

    const uVoidLengthInput = document.getElementById('structure-u-void-length');
    if (uVoidLengthInput) {
      const parentLabel = uVoidLengthInput.closest('label');
      if (parentLabel) {
        parentLabel.classList.toggle('hidden', structureType !== 'stairs' || subtype !== 'ushape');
      }
      uVoidLengthInput.value = structure.uVoidLength ?? (structure.depth - 1);
    }
 
    const subtypeSelect = document.getElementById('structure-subtype');
    if (subtypeSelect) {
      subtypeSelect.innerHTML = '';
      if (structureType === 'roof') {
        const options = [
          { value: 'gable', label: '双斜坡屋顶' },
          { value: 'shed', label: '单斜坡屋顶' },
          { value: 'arch', label: '拱形屋顶' },
          { value: 'dome', label: '穹型屋顶' },
          { value: 'trapezoid', label: '梯形屋顶' },
          { value: 'hip', label: '四角屋顶' },
          { value: 'flat', label: '平屋顶' }
        ];
        options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          subtypeSelect.appendChild(o);
        });
        subtypeSelect.value = structure.subtype || structure.type || 'gable';
      } else {
        const options = [
          { value: 'straight', label: '直跑楼梯' },
          { value: 'lshape', label: 'L形楼梯' },
          { value: 'ushape', label: 'U形楼梯' },
          { value: 'spiral', label: '旋转楼梯' },
          { value: 'curved', label: '弧形楼梯' },
          { value: 'floating', label: '悬浮楼梯' }
        ];
        options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          subtypeSelect.appendChild(o);
        });
        subtypeSelect.value = structure.subtype || 'straight';
      }
    }
  }

  if (opening) {
    document.getElementById('selected-opening-name').textContent = opening.type === 'door' ? '门' : '窗';
    document.getElementById('opening-position').value = Math.round((opening.t ?? 0.5) * 100);
    document.getElementById('opening-width').value = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
    document.getElementById('opening-shape').value = opening.shape || 'square';
    const heightField = document.getElementById('opening-height-field');
    heightField.classList.remove('hidden');
    const sillField = document.getElementById('opening-sill-field');
    sillField.classList.remove('hidden');
    document.getElementById('opening-height').value = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    document.getElementById('opening-sill-height').value = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);

    const openField = document.getElementById('opening-open-field');
    const flipLrField = document.getElementById('opening-flip-lr-field');
    const flipIoField = document.getElementById('opening-flip-io-field');
    const isDoor = opening.type === 'door';
    document.getElementById('opening-content-hidden').checked = isDoor ? !!opening.panelHidden : !!opening.glassHidden;
    document.getElementById('opening-content-hidden-label').textContent = isDoor ? '隐藏门板' : '隐藏玻璃';
    if (openField) {
      openField.classList.toggle('hidden', !isDoor);
      document.getElementById('opening-open').checked = !!opening.isOpen;
    }
    const doubleDoorField = document.getElementById('opening-double-door-field');
    const isSymmetricDoor = isDoor && isSymmetricShape(opening.shape);
    if (doubleDoorField) {
      doubleDoorField.classList.toggle('hidden', !isSymmetricDoor);
      document.getElementById('opening-double-door').checked = !!opening.doubleDoor;
    }
    if (flipLrField) {
      flipLrField.classList.toggle('hidden', !isDoor);
      document.getElementById('opening-flip-lr').checked = !!opening.isFlippedLR;
    }
    if (flipIoField) {
      flipIoField.classList.toggle('hidden', !isDoor);
      document.getElementById('opening-flip-io').checked = !!opening.isFlippedIO;
    }
    document.getElementById('opening-locked').checked = !!opening.locked;
    document.getElementById('btn-delete-opening').disabled = !!opening.locked;
  }

  if (fenceGate) {
    document.getElementById('fence-gate-locked').checked = !!fenceGate.locked;
    document.getElementById('fence-gate-subtype').value = fenceGate.subtype || 'picket_wood';
    document.getElementById('fence-gate-width').value = fenceGate.width || 1.0;
    document.getElementById('fence-gate-height').value = fenceGate.height || 1.1;
    document.getElementById('fence-gate-thickness').value = fenceGate.thickness || 0.08;
    document.getElementById('fence-gate-yoffset').value = fenceGate.yOffset || 0.0;
    document.getElementById('fence-gate-open').checked = !!fenceGate.isOpen;
    document.getElementById('fence-gate-double-door').checked = !!fenceGate.doubleDoor;
    document.getElementById('fence-gate-flip-lr').checked = !!fenceGate.isFlippedLR;
    document.getElementById('fence-gate-flip-io').checked = !!fenceGate.isFlippedIO;
    document.getElementById('fence-gate-content-hidden').checked = !!fenceGate.panelHidden;
    document.getElementById('btn-delete-fence-gate').disabled = !!fenceGate.locked;

    const posField = document.getElementById('fence-gate-position-field');
    if (posField) {
      if (fenceGate.fenceId) {
        posField.classList.remove('hidden');
        document.getElementById('fence-gate-position').value = Math.round(fenceGate.t * 100);
      } else {
        posField.classList.add('hidden');
      }
    }
  }

  renderDesignPanel(room, wall, item, structure, structureType, fence, opening, fenceGate);
  revealRightPanelIfNeeded(room || wall || item || opening || structure || fence || fenceGate);
}

export function renderDesignPanel(room, wall, item, structure = null, structureType = null, fence = null, opening = null, fenceGate = null) {
  const designSelectionPanel = document.getElementById('design-selection-panel');
  if (!designSelectionPanel) return;
  designSelectionPanel.innerHTML = '';
  const btnResetMaterial = document.getElementById('btn-reset-material');
  if (btnResetMaterial) {
    btnResetMaterial.disabled = !(room || wall || item || structure || fence || opening || fenceGate);
  }
  const floorColorField = document.getElementById('floor-color-field');
  if (floorColorField) floorColorField.classList.toggle('hidden', !room);
  if (room) {
    const group = document.createElement('div');
    group.className = 'component-material-row';
    group.appendChild(createApplyMaterialButton('应用当前材质到房间地板', () => applyMaterialToRoomFloor(activeMaterialDescriptor)));
    designSelectionPanel.appendChild(group);
    return;
  }

  if (wall) {
    const groupFront = document.createElement('div');
    groupFront.className = 'component-material-row';
    groupFront.appendChild(createColorField('墙正面材质', wall.colorFront || wall.color || '#f9fbff', (color) => {
      const wallObj = testMap.getWall(wall.id);
      if (wallObj && wallObj.locked) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateWall(wall.id, { colorFront: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(wall.materialFront)));
    groupFront.appendChild(createApplyMaterialButton('应用当前材质到墙的正面', () => applyMaterialToWallFront(activeMaterialDescriptor)));
    designSelectionPanel.appendChild(groupFront);

    const groupBack = document.createElement('div');
    groupBack.className = 'component-material-row';
    groupBack.appendChild(createColorField('墙背面材质', wall.colorBack || wall.color || '#f9fbff', (color) => {
      const wallObj = testMap.getWall(wall.id);
      if (wallObj && wallObj.locked) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateWall(wall.id, { colorBack: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(wall.materialBack)));
    groupBack.appendChild(createApplyMaterialButton('应用当前材质到墙的背面', () => applyMaterialToWallBack(activeMaterialDescriptor)));
    designSelectionPanel.appendChild(groupBack);
    return;
  }

  if (structure) {
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = structureType === 'roof' ? '屋顶材质' : '楼梯材质';
    designSelectionPanel.appendChild(title);

    // 1. 瓦片 (屋顶) / 踏步材质 (楼梯)
    const groupTop = document.createElement('div');
    groupTop.className = 'component-material-row';
    const labelTop = structureType === 'roof' ? '瓦片' : '踏步材质';
    const btnTextTop = structureType === 'roof' ? '应用瓦片材质' : '应用顶部材质';
    groupTop.appendChild(createColorField(labelTop, structure.color || (structureType === 'roof' ? '#b75b54' : '#d8c0a0'), (color) => {
      if (structure.locked) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      updateStructure(structureType, structure.id, { color, material: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(structure.material)));
    groupTop.appendChild(createApplyMaterialButton(btnTextTop, () => applyMaterialToStructure(activeMaterialDescriptor, 'top')));
    designSelectionPanel.appendChild(groupTop);

    // 2. 墙面 (屋顶) / 侧面材质 (楼梯)
    const groupSide = document.createElement('div');
    groupSide.className = 'component-material-row';
    const labelSide = structureType === 'roof' ? '墙面' : '侧面材质';
    const btnTextSide = structureType === 'roof' ? '应用墙面材质' : '应用侧面材质';
    groupSide.appendChild(createColorField(labelSide, structure.sideColor || (structure.color || (structureType === 'roof' ? '#b75b54' : '#d8c0a0')), (color) => {
      if (structure.locked) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      updateStructure(structureType, structure.id, { sideColor: color, sideMaterial: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(structure.sideMaterial || structure.material)));
    groupSide.appendChild(createApplyMaterialButton(btnTextSide, () => applyMaterialToStructure(activeMaterialDescriptor, 'side')));
    designSelectionPanel.appendChild(groupSide);

    // 3. 天花板 (仅当是屋顶时)
    if (structureType === 'roof') {
      const groupBottom = document.createElement('div');
      groupBottom.className = 'component-material-row';
      groupBottom.appendChild(createColorField('天花板', structure.bottomColor || '#ffffff', (color) => {
        if (structure.locked) {
          showToast('该物体已锁定');
          return;
        }
        pushHistory();
        updateStructure(structureType, structure.id, { bottomColor: color, bottomMaterial: color });
        refreshShadows();
        updateEditor();
        renderPlan();
      }, getMaterialFriendlyName(structure.bottomMaterial || structure.bottomColor || '#ffffff')));
      groupBottom.appendChild(createApplyMaterialButton('应用天花板材质', () => applyMaterialToStructure(activeMaterialDescriptor, 'bottom')));
      designSelectionPanel.appendChild(groupBottom);
    }
    return;
  }

  if (item) {
    const definition = testMap.getFurnitureDefinition(item.type);
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = `${item.name} 组件材质`;
    designSelectionPanel.appendChild(title);
    definition.components.forEach((component) => {
      const group = document.createElement('div');
      group.className = 'component-material-row';
      group.appendChild(createColorField(component.label, item.colors?.[component.id] || component.defaultColor, (color) => {
        if (isTargetLocked({ type: 'item', id: item.id })) {
          showToast('该物体已锁定');
          return;
        }
        entityManager.updateItemComponentColor(item.id, component.id, color);
      }, getMaterialFriendlyName(item.materials?.[component.id])));
      group.appendChild(createApplyMaterialButton(`应用当前材质到${component.label}`, () => applyMaterialToItemComponent(component.id, activeMaterialDescriptor)));
      designSelectionPanel.appendChild(group);
    });
    return;
  }

  if (fence) {
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = '栅栏材质';
    designSelectionPanel.appendChild(title);

    const group = document.createElement('div');
    group.className = 'component-material-row';
    group.appendChild(createColorField('材质', fence.color || '#8d6e63', (color) => {
      if (isTargetLocked({ type: 'fence', id: fence.id })) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateFence(fence.id, { color: color, material: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(fence.sideMaterial || fence.material)));
    group.appendChild(createApplyMaterialButton('应用当前材质', () => applyMaterialToFence(activeMaterialDescriptor)));
    designSelectionPanel.appendChild(group);
    return;
  }

  if (opening) {
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = opening.type === 'door' ? '门扇与门框材质' : '窗框与玻璃材质';
    designSelectionPanel.appendChild(title);

    const isDoor = opening.type === 'door';

    const groupFrame = document.createElement('div');
    groupFrame.className = 'component-material-row';
    groupFrame.appendChild(createColorField(isDoor ? '门框材质' : '窗框材质', opening.frameMaterial || '#ffffff', (color) => {
      if (isTargetLocked({ type: 'opening', id: opening.id })) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateOpening(opening.id, { frameMaterial: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(opening.frameMaterial)));
    groupFrame.appendChild(createApplyMaterialButton('应用当前材质', () => {
      if (isTargetLocked({ type: 'opening', id: opening.id })) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateOpening(opening.id, { frameMaterial: activeMaterialDescriptor.url || activeMaterialDescriptor.src || activeMaterialDescriptor.color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }));
    designSelectionPanel.appendChild(groupFrame);

    const groupContent = document.createElement('div');
    groupContent.className = 'component-material-row';
    groupContent.appendChild(createColorField(isDoor ? '门板材质' : '玻璃材质', isDoor ? (opening.panelMaterial || '#ffffff') : (opening.glassMaterial || '#e0f7fa'), (color) => {
      if (isTargetLocked({ type: 'opening', id: opening.id })) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateOpening(opening.id, isDoor ? { panelMaterial: color } : { glassMaterial: color });
      refreshShadows();
      updateEditor();
      renderPlan();
    }, getMaterialFriendlyName(isDoor ? opening.panelMaterial : opening.glassMaterial)));
    groupContent.appendChild(createApplyMaterialButton('应用当前材质', () => {
      if (isTargetLocked({ type: 'opening', id: opening.id })) {
        showToast('该物体已锁定');
        return;
      }
      pushHistory();
      testMap.updateOpening(opening.id, isDoor
        ? { panelMaterial: activeMaterialDescriptor.url || activeMaterialDescriptor.src || activeMaterialDescriptor.color }
        : { glassMaterial: activeMaterialDescriptor.url || activeMaterialDescriptor.src || activeMaterialDescriptor.color }
      );
      refreshShadows();
      updateEditor();
      renderPlan();
    }));
    designSelectionPanel.appendChild(groupContent);
  }

  if (fenceGate) {
    const title = document.createElement('p');
    title.className = 'selection-title';
    title.textContent = '栏杆门框与门扇材质';
    designSelectionPanel.appendChild(title);

    const groupFrame = document.createElement('div');
    groupFrame.className = 'component-material-row';
    groupFrame.appendChild(createColorField('门框材质', fenceGate.frameMaterial || '#ffffff', (color) => {
      if (isTargetLocked({ type: 'fence_gate', id: fenceGate.id })) {
        showToast('该物体已锁定');
        return;
      }
      applyMaterialToFenceGateFrame(color);
    }, getMaterialFriendlyName(fenceGate.frameMaterial)));
    groupFrame.appendChild(createApplyMaterialButton('应用当前材质', () => {
      if (isTargetLocked({ type: 'fence_gate', id: fenceGate.id })) {
        showToast('该物体已锁定');
        return;
      }
      applyMaterialToFenceGateFrame(activeMaterialDescriptor);
    }));
    designSelectionPanel.appendChild(groupFrame);

    const groupContent = document.createElement('div');
    groupContent.className = 'component-material-row';
    groupContent.appendChild(createColorField('门板材质', fenceGate.panelMaterial || '#ffffff', (color) => {
      if (isTargetLocked({ type: 'fence_gate', id: fenceGate.id })) {
        showToast('该物体已锁定');
        return;
      }
      applyMaterialToFenceGatePanel(color);
    }, getMaterialFriendlyName(fenceGate.panelMaterial)));
    groupContent.appendChild(createApplyMaterialButton('应用当前材质', () => {
      if (isTargetLocked({ type: 'fence_gate', id: fenceGate.id })) {
        showToast('该物体已锁定');
        return;
      }
      applyMaterialToFenceGatePanel(activeMaterialDescriptor);
    }));
    designSelectionPanel.appendChild(groupContent);
  }
}

export function getMaterialFriendlyName(material) {
  if (!material) return '默认';
  if (typeof material === 'string') {
    if (material.startsWith('#')) return `纯色 ${material}`;
    if (material.includes('/')) {
      const parts = material.split('/');
      const filename = parts[parts.length - 1];
      return filename.replace(/\.[^.]+$/, '');
    }
    return material;
  }
  if (material.name) return material.name;
  if (material.kind === 'color') return `纯色 ${material.color || '#ffffff'}`;
  if (material.kind) {
    const kindMap = {
      mirror: '镜面',
      metal: '金属',
      glass: '玻璃',
      texture: '纹理',
      emissive: '发光'
    };
    return kindMap[material.kind] || material.kind;
  }
  return '自定义材质';
}

export function createColorField(label, value, onChange, currentMaterialName = '') {
  const container = document.createElement('label');
  container.className = 'field';
  
  const span = document.createElement('span');
  span.style.display = 'flex';
  span.style.justifyContent = 'space-between';
  span.style.alignItems = 'center';
  span.style.width = '100%';

  const nameSpan = document.createElement('span');
  nameSpan.textContent = label;
  span.appendChild(nameSpan);

  if (currentMaterialName) {
    const matSpan = document.createElement('span');
    matSpan.textContent = currentMaterialName;
    matSpan.className = 'component-current-material';
    matSpan.style.cssText = 'font-size: 12px; color: #56657d; font-weight: normal; margin-left: auto;';
    span.appendChild(matSpan);
  }

  const input = document.createElement('input');
  input.type = 'color';
  
  let hexColor = '#ffffff';
  if (typeof value === 'string') {
    hexColor = value.startsWith('#') ? value : '#ffffff';
  } else if (value && typeof value === 'object' && typeof value.color === 'string') {
    hexColor = value.color.startsWith('#') ? value.color : '#ffffff';
  }
  
  input.value = hexColor;
  input.addEventListener('change', (e) => onChange(e.target.value));
  
  container.append(span, input);
  return container;
}

export function createApplyMaterialButton(text, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'apply-material-button';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

export function initUiEventListeners() {
  document.getElementById('item-grid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-item]');
    if (!button) return;
    const type = button.dataset.addItem;
    const definition = testMap.getFurnitureDefinition(type);
    const room = selectedRoomId ? testMap.getRoom(selectedRoomId) : currentRooms()[0];
    let x = room ? room.x : 0;
    let z = room ? room.z : 0;
    let elevation = undefined;
    let rotation = undefined;
    if (definition.placeType === 'ceiling') {
      elevation = (testMap.floorplan.wallHeight || 2.8) * INCHES_PER_UNIT - (definition.defaultSize.height || 0);
    } else if (canPlaceOnTable({ x, z, floorId: testMap.floorplan.currentFloorId, width: definition.defaultSize.width, depth: definition.defaultSize.depth }, definition)) {
      // 检查当前选中的物品是否是多层架子柜
      const selectedItem = selectedItemId ? testMap.getItem(selectedItemId) : null;
      const selectedDef = selectedItem ? testMap.getFurnitureDefinition(selectedItem.type) : null;
      const supportedTypes = ['bookshelf', 'shoerack', 'corner_shelf', 'display_cabinet', 'grid_cabinet'];
      
      const isShelfSelected = selectedItem && selectedDef && supportedTypes.includes(selectedDef.type);
      
      if (isShelfSelected) {
        x = selectedItem.x;
        z = selectedItem.z;
        rotation = selectedItem.rotation || 0;
        
        // 统计当前架子上的小摆件数量，以此轮流计算生成在第几个层板上
        const count = getItemsCountOnBookshelf(selectedItem, testMap.floorplan.items);
        const worldShelvesY = getShelfLayerHeights(selectedItem);
        if (worldShelvesY && worldShelvesY.length > 0) {
          const layerIndex = count % worldShelvesY.length;
          const worldY = worldShelvesY[layerIndex];
          elevation = Number((worldY * INCHES_PER_UNIT).toFixed(2));
        } else {
          elevation = selectedItem.elevation || 0;
        }
      } else {
        const bookshelfBelow = findBookshelfNearby({ x, z, floorId: testMap.floorplan.currentFloorId, id: null });
        if (bookshelfBelow) {
          const snappedState = snapToBookshelf({ x, z, elevation: 0, floorId: testMap.floorplan.currentFloorId, id: null }, bookshelfBelow);
          if (snappedState) {
            elevation = snappedState.elevation;
          }
        } else {
          const tableBelow = findTableBelow({ x, z, floorId: testMap.floorplan.currentFloorId, id: null });
          if (tableBelow) {
            const tableDef = testMap.getFurnitureDefinition(tableBelow.type);
            elevation = (tableBelow.elevation || 0) + (tableBelow.height || tableDef.defaultSize.height) * (tableBelow.scale || 1);
          } else {
            elevation = 0;
          }
        }
      }
    }
    const item = entityManager.addItem(type, x, z, {
      elevation,
      rotation,
      roomId: room?.id,
      floorId: testMap.floorplan.currentFloorId
    });
    if (item && room) testMap.assignItemToRoom(item.id, room.id);
  });

  ['room-width', 'room-depth', 'room-name', 'room-elevation'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateSelectedRoom);
  });

  ['floor-name', 'floor-wall-height', 'floor-height', 'floor-hide-roof', 'floor-hide-wall'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateSelectedFloor);
  });

  ['structure-x', 'structure-z', 'structure-width', 'structure-depth', 'structure-height', 'structure-steps', 'structure-side-hidden', 'structure-bottom-hidden', 'structure-subtype', 'structure-mirrored', 'structure-spiral-degrees', 'structure-corner-step', 'structure-u-slot-width', 'structure-u-void-length', 'structure-curve', 'structure-elevation'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', updateSelectedStructure);
  });

  document.getElementById('structure-curve-dec')?.addEventListener('click', () => {
    const input = document.getElementById('structure-curve');
    if (input) {
      const val = Math.max(-5, Number(input.value) - 0.05);
      input.value = Number(val.toFixed(2));
      updateSelectedStructure();
    }
  });

  document.getElementById('structure-curve-inc')?.addEventListener('click', () => {
    const input = document.getElementById('structure-curve');
    if (input) {
      const val = Math.min(5, Number(input.value) + 0.05);
      input.value = Number(val.toFixed(2));
      updateSelectedStructure();
    }
  });
  
  document.getElementById('structure-rotation')?.addEventListener('change', (event) => {
    commitSelectedStructureRotation(event.target.value);
  });
  document.getElementById('structure-rotation-range')?.addEventListener('input', (event) => {
    previewSelectedStructureRotation(event.target.value);
  });
  document.getElementById('structure-rotation-range')?.addEventListener('change', (event) => {
    commitSelectedStructureRotation(event.target.value);
  });
  document.getElementById('structure-locked')?.addEventListener('change', (event) => {
    const selected = getSelectedStructure();
    if (!selected?.value) return;
    pushHistory();
    setContextTargetLocked({ type: selected.type, id: selected.id }, event.target.checked);
    refreshShadows();
    updateEditor();
    renderPlan();
  });
  document.getElementById('btn-delete-structure')?.addEventListener('click', deleteSelectedStructure);

  ['item-width', 'item-depth', 'item-height', 'item-elevation'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateSelectedSize);
  });
  document.getElementById('item-elevation').addEventListener('change', (event) => {
    const rangeEl = document.getElementById('item-elevation-range');
    if (rangeEl) {
      rangeEl.value = event.target.value;
    }
  });
  document.getElementById('item-elevation-range').addEventListener('input', (event) => {
    document.getElementById('item-elevation').value = Number(event.target.value).toFixed(2);
    updateSelectedSize();
  });

  document.getElementById('item-rotation').addEventListener('change', updateSelectedRotation);
  document.getElementById('item-rotation-range').addEventListener('input', (event) => {
    document.getElementById('item-rotation').value = event.target.value;
    updateSelectedRotation();
  });
  document.getElementById('item-scale').addEventListener('change', (event) => updateSelectedScale(event.target.value));
  document.getElementById('item-scale-range').addEventListener('input', (event) => {
    document.getElementById('item-scale').value = Number(event.target.value).toFixed(2);
    updateSelectedScale(event.target.value);
  });
  document.getElementById('item-pose').addEventListener('change', (event) => {
    if (selectedItemId) entityManager.updateItemPose(selectedItemId, event.target.value);
  });

  document.getElementById('wall-length').addEventListener('change', (event) => {
    if (selectedWallId) {
      pushHistory();
      testMap.setWallLength(selectedWallId, Number(event.target.value));
      refreshShadows();
      updateEditor();
      renderPlan();
    }
  });

  document.getElementById('wall-rotation').addEventListener('change', (event) => {
    updateSelectedWallRotation(event.target.value);
  });

  document.getElementById('wall-rotation-range').addEventListener('input', (event) => {
    previewSelectedWallRotation(event.target.value);
  });

  document.getElementById('wall-rotation-range').addEventListener('change', (event) => {
    updateSelectedWallRotation(event.target.value);
  });

  document.getElementById('btn-delete-wall').addEventListener('click', () => {
    if (!selectedWallId) return;
    pushHistory();
    testMap.deleteWall(selectedWallId);
    clearSelection();
    refreshShadows();
  });

  document.getElementById('item-locked').addEventListener('change', (event) => {
    if (!selectedItemId) return;
    entityManager.setItemLocked(selectedItemId, event.target.checked);
  });

  document.getElementById('room-locked').addEventListener('change', (event) => {
    if (!selectedRoomId) return;
    pushHistory();
    setContextTargetLocked({ type: 'room', id: selectedRoomId }, event.target.checked);
    refreshShadows();
    updateEditor();
    renderPlan();
  });

  document.getElementById('item-light-on').addEventListener('change', (event) => {
    if (!selectedItemId) return;
    entityManager.updateItemLight(selectedItemId, event.target.checked);
  });

  document.getElementById('opening-position').addEventListener('change', (event) => {
    updateSelectedOpening({ t: Number(event.target.value) / 100 });
  });

  document.getElementById('opening-width').addEventListener('change', (event) => {
    updateSelectedOpening({ width: Number(event.target.value) });
  });

  document.getElementById('opening-shape').addEventListener('change', (event) => {
    updateSelectedOpening({ shape: event.target.value });
  });

  document.getElementById('opening-height').addEventListener('change', (event) => {
    updateSelectedOpening({ height: Number(event.target.value) });
  });

  document.getElementById('opening-sill-height').addEventListener('change', (event) => {
    updateSelectedOpening({ sillHeight: Number(event.target.value) });
  });

  document.getElementById('opening-open').addEventListener('change', (event) => {
    updateSelectedOpening({ isOpen: event.target.checked });
  });

  document.getElementById('opening-double-door').addEventListener('change', (event) => {
    updateSelectedOpening({ doubleDoor: event.target.checked });
  });

  document.getElementById('opening-flip-lr').addEventListener('change', (event) => {
    updateSelectedOpening({ isFlippedLR: event.target.checked });
  });

  document.getElementById('opening-flip-io').addEventListener('change', (event) => {
    updateSelectedOpening({ isFlippedIO: event.target.checked });
  });

  document.getElementById('opening-content-hidden').addEventListener('change', (event) => {
    const opening = selectedOpeningId ? testMap.getOpening(selectedOpeningId) : null;
    if (!opening) return;
    updateSelectedOpening(opening.type === 'door'
      ? { panelHidden: event.target.checked }
      : { glassHidden: event.target.checked });
  });

  document.getElementById('opening-locked').addEventListener('change', (event) => {
    if (!selectedOpeningId) return;
    pushHistory();
    setContextTargetLocked({ type: 'opening', id: selectedOpeningId }, event.target.checked);
    refreshShadows();
    updateEditor();
    renderPlan();
  });

  document.getElementById('fence-gate-locked').addEventListener('change', (event) => {
    if (!selectedFenceGateId) return;
    pushHistory();
    setContextTargetLocked({ type: 'fence_gate', id: selectedFenceGateId }, event.target.checked);
    refreshShadows();
    updateEditor();
    renderPlan();
  });

  document.getElementById('fence-gate-position').addEventListener('input', (event) => {
    updateSelectedFenceGatePreview({ t: Number(event.target.value) / 100 });
  });

  document.getElementById('fence-gate-position').addEventListener('change', (event) => {
    updateSelectedFenceGate({ t: Number(event.target.value) / 100 });
  });

  document.getElementById('fence-gate-subtype').addEventListener('change', (event) => {
    updateSelectedFenceGate({ subtype: event.target.value });
  });

  document.getElementById('fence-gate-width').addEventListener('change', (event) => {
    updateSelectedFenceGate({ width: Number(event.target.value) });
  });

  document.getElementById('fence-gate-height').addEventListener('change', (event) => {
    updateSelectedFenceGate({ height: Number(event.target.value) });
  });

  document.getElementById('fence-gate-thickness').addEventListener('change', (event) => {
    updateSelectedFenceGate({ thickness: Number(event.target.value) });
  });

  document.getElementById('fence-gate-yoffset').addEventListener('change', (event) => {
    updateSelectedFenceGate({ yOffset: Number(event.target.value) });
  });

  document.getElementById('fence-gate-open').addEventListener('change', (event) => {
    updateSelectedFenceGate({ isOpen: event.target.checked });
  });

  document.getElementById('fence-gate-double-door').addEventListener('change', (event) => {
    updateSelectedFenceGate({ doubleDoor: event.target.checked });
  });

  document.getElementById('fence-gate-flip-lr').addEventListener('change', (event) => {
    updateSelectedFenceGate({ isFlippedLR: event.target.checked });
  });

  document.getElementById('fence-gate-flip-io').addEventListener('change', (event) => {
    updateSelectedFenceGate({ isFlippedIO: event.target.checked });
  });

  document.getElementById('fence-gate-content-hidden').addEventListener('change', (event) => {
    updateSelectedFenceGate({ panelHidden: event.target.checked });
  });

  document.getElementById('btn-delete-fence-gate').addEventListener('click', () => {
    deleteSelectedFenceGate();
  });

  document.getElementById('snap-enabled').addEventListener('change', (event) => {
    setSnapEnabled(event.target.checked);
    const btn = document.getElementById('btn-snap-toggle');
    if (btn) {
      btn.classList.toggle('deactivated', !getSnapEnabled());
    }
    renderPlan();
    refresh3DGrid();
  });

  document.getElementById('btn-snap-toggle')?.addEventListener('click', () => {
    setSnapEnabled(!getSnapEnabled());
    const btn = document.getElementById('btn-snap-toggle');
    if (btn) {
      btn.classList.toggle('deactivated', !getSnapEnabled());
    }
    const snapCheck = document.getElementById('snap-enabled');
    if (snapCheck) {
      snapCheck.checked = getSnapEnabled();
    }
    renderPlan();
    refresh3DGrid();
  });

  document.getElementById('snap-size').addEventListener('change', (event) => {
    setSnapSize(1);
    event.target.value = '1';
    renderPlan();
    refresh3DGrid();
  });

  document.getElementById('fence-subtype').addEventListener('change', updateSelectedFenceSubtype);
  document.getElementById('fence-length').addEventListener('change', updateSelectedFenceLength);

  document.getElementById('fence-rotation').addEventListener('change', (event) => {
    updateSelectedFenceRotation(event.target.value);
  });

  document.getElementById('fence-rotation-range').addEventListener('input', (event) => {
    if (selectedFenceId) {
      const fence = testMap.getFence(selectedFenceId);
      if (fence && !fence.locked) {
        const normalized = syncRotationInputs('fence-rotation', 'fence-rotation-range', event.target.value);
        const preview = getRotatedWallEndpoints(fence, normalized);
        const node = testMap.fenceNodes?.get(selectedFenceId);
        if (node) {
          node.position.set((preview.from[0] + preview.to[0]) / 2, node.position.y, (preview.from[1] + preview.to[1]) / 2);
          node.rotation.y = -preview.angleRad;
        }
      }
    }
  });

  document.getElementById('fence-rotation-range').addEventListener('change', (event) => {
    updateSelectedFenceRotation(event.target.value);
  });

  document.getElementById('fence-height').addEventListener('change', updateSelectedFenceHeight);
  document.getElementById('fence-yoffset').addEventListener('change', updateSelectedFenceYOffset);
  const fenceColorEl = document.getElementById('fence-color');
  if (fenceColorEl) {
    fenceColorEl.addEventListener('change', updateSelectedFenceColor);
  }
  document.getElementById('fence-locked').addEventListener('change', (event) => {
    if (!selectedFenceId) return;
    pushHistory();
    setContextTargetLocked({ type: 'fence', id: selectedFenceId }, event.target.checked);
    refreshShadows();
    updateEditor();
    renderPlan();
  });
  document.getElementById('btn-delete-fence').addEventListener('click', deleteSelectedFence);

  document.getElementById('btn-delete-item').addEventListener('click', () => {
    if (!selectedItemId) return;
    entityManager.deleteItem(selectedItemId);
  });

  document.getElementById('btn-delete-opening').addEventListener('click', () => {
    if (!selectedOpeningId) return;
    if (testMap.getOpening(selectedOpeningId)?.locked) return;
    pushHistory();
    testMap.deleteOpening(selectedOpeningId);
    clearSelection();
    refreshShadows();
  });

  document.getElementById('btn-delete-room').addEventListener('click', () => {
    if (!selectedRoomId) return;
    if (testMap.getRoom(selectedRoomId)?.locked) return;
    showCustomConfirm('提示', '确定要删除整个房间吗？房间内的家具都会移除').then((confirmed) => {
      if (confirmed) {
        pushHistory();
        testMap.deleteRoom(selectedRoomId);
        clearSelection();
        refreshShadows();
      }
    });
  });

  document.getElementById('floor-color').addEventListener('change', (event) => {
    pushHistory();
    if (selectedRoomId) {
      testMap.setRoomFloorMaterial(selectedRoomId, event.target.value);
    } else {
      testMap.setFloorColor(event.target.value);
    }
    updateEditor();
    renderPlan();
  });
}

function updateSelectedFenceRotation(degrees) {
  if (!selectedFenceId) return;
  const fence = testMap.getFence(selectedFenceId);
  if (!fence || fence.locked) return;
  pushHistory();
  const normalized = syncRotationInputs('fence-rotation', 'fence-rotation-range', degrees);
  const preview = getRotatedWallEndpoints(fence, normalized);
  testMap.updateFence(selectedFenceId, { from: preview.from, to: preview.to });
  refreshShadows();
  updateEditor();
  renderPlan();
}

function deleteSelectedFence() {
  if (!selectedFenceId) return;
  pushHistory();
  testMap.deleteFence(selectedFenceId);
  clearSelection();
  refreshShadows();
}

function getRotatedWallEndpoints(wall, angleDeg) {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dz);
  const cx = (wall.from[0] + wall.to[0]) / 2;
  const cz = (wall.from[1] + wall.to[1]) / 2;
  const angleRad = angleDeg * Math.PI / 180;
  const newDx = Math.cos(angleRad) * length;
  const newDz = Math.sin(angleRad) * length;
  return {
    from: [cx - newDx / 2, cz - newDz / 2],
    to: [cx + newDx / 2, cz + newDz / 2],
    angleRad
  };
}

