import { createTextureMaterialDescriptor, BLUEPRINT3D_TEST_FLOORPLAN } from '../../src/index.js';
import { initUiEventListeners } from './EditorUi.js';
import { handleHotkeys } from './Hotkeys.js';
import { updateLocalProjectCount } from './FileManager.js';
import {
  copyTarget,
  get2DTargetFromElement,
  isAllowedTarget,
  isTargetLocked,
  rotateTarget,
  showObjectContextMenu,
  toggleTargetLock
} from './TargetHandler.js';

export function initAppEventBindings(Context) {
  const materialCategorySelect = document.getElementById('material-category');
  const materialUploadInput = document.getElementById('material-upload');
  const viewToggleButton = document.getElementById('btn-view-toggle');
  const undoButton = document.getElementById('btn-undo');
  const redoButton = document.getElementById('btn-redo');
  const stage = document.getElementById('stage');

  materialCategorySelect?.addEventListener('change', () => {
    Context.renderMaterialLibrary(!window.isProgrammaticMaterialCategoryChange);
  });
  materialUploadInput?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = await Context.readFileAsDataURL(file);
    const descriptor = createTextureMaterialDescriptor({
      id: `custom_${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, '') || 'custom_material',
      fileName: file.name,
      category: materialCategorySelect?.value || 'custom',
      src,
      scale: 1
    });
    Context.materialLibrary.unshift(descriptor);
    Context.saveCustomMaterialToLocalStorage(descriptor.id, src);
    Context.activeMaterialDescriptor = descriptor;
    Context.editor.activeMaterialDescriptor = descriptor;
    Context.editor.activeMaterialArray = null;
    materialUploadInput.value = '';
    Context.renderMaterialLibrary();
    Context.updateEditor();
  });

  viewToggleButton?.addEventListener('click', () => Context.setView(Context.currentView === '2d' ? '3d' : '2d'));
  undoButton?.addEventListener('click', Context.undo);
  redoButton?.addEventListener('click', Context.redo);

  document.addEventListener('keydown', (event) => {
    handleHotkeys(event, {
      currentView: Context.currentView,
      camera: Context.camera,
      BABYLON: Context.BABYLON,
      view: Context.view,
      hasUserZoomedOrPanned: Context.hasUserZoomedOrPanned,
      setHasUserZoomedOrPanned: (value) => { Context.hasUserZoomedOrPanned = value; },
      renderPlan: Context.renderPlan,
      selectedItemId: Context.selectedItemId,
      entityManager: Context.entityManager,
      selectedOpeningId: Context.selectedOpeningId,
      testMap: Context.testMap,
      updateEditor: Context.updateEditor,
      selectedWallId: Context.selectedWallId,
      selectedRoomId: Context.selectedRoomId,
      showCustomConfirm: Context.showCustomConfirm,
      clearSelection: Context.clearSelection,
      refreshShadows: Context.refreshShadows,
      selectedRoofId: Context.selectedRoofId,
      selectedStairsId: Context.selectedStairsId,
      selectedFenceId: Context.selectedFenceId,
      takePhoto: Context.takePhoto,
      undo: Context.undo,
      redo: Context.redo,
      getSelectedTarget: Context.getSelectedTarget,
      toggleTargetLock,
      copyTarget,
      rotateTarget,
      isAllowedTarget,
      isTargetLocked,
      pushHistory: Context.pushHistory,
      INCHES_PER_UNIT: Context.INCHES_PER_UNIT
    });
  });

  bindToolSelectors(Context);
  bindStageInteractions(Context, stage);
  bindFileAndPanelControls(Context);
  initUiEventListeners();
  initToolGroupToggles(Context);
}

function bindToolSelectors(Context) {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
      document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== button.dataset.tab));
      if (button.dataset.tab !== 'design') Context.setDesignMode('select');
    });
  });

  document.querySelectorAll('.design-mode').forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.designMode;
      if (nextMode === 'brush') {
        if (Context.designMode !== 'brush') Context.setDesignMode('brush', false);
        else if (!Context.designModeBrushLocked) Context.setDesignMode('brush', true);
        else Context.setDesignMode('select');
        return;
      }
      Context.setDesignMode(Context.designMode === nextMode && nextMode !== 'select' ? 'select' : nextMode, false);
    });
  });

  document.querySelectorAll('.mode').forEach((button) => {
    button.addEventListener('click', () => {
      const clickedMode = button.dataset.mode;
      if (Context.mode === clickedMode && clickedMode !== 'select') {
        Context.switchToSelectMode();
        return;
      }
      Context.mode = clickedMode;
      Context.drawStart = null;
      Context.clearDrawWallPreview();
      document.querySelectorAll('.mode').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
      Context.handleModeChange(Context.mode);
      Context.syncLocalToStore();
      Context.renderPlan();
    });
  });

  document.getElementById('floor-floating-group')?.addEventListener('click', (event) => {
    if (event.target.closest('.btn-floor-toggle-expanded')) {
      Context.floorPanelCollapsed = false;
      Context.syncFloorControls();
      return;
    }
    if (event.target.closest('.btn-floor-fold')) {
      Context.floorPanelCollapsed = true;
      Context.syncFloorControls();
      return;
    }
    const addButton = event.target.closest('#btn-add-floor');
    if (addButton) {
      Context.showCustomConfirm('复制户型', '是否复制当前户型？').then((copyCurrentFloor) => {
        const sourceFloorId = Context.testMap.getCurrentFloorId();
        Context.pushHistory();
        Context.testMap.executeCommand('addFloor', copyCurrentFloor ? { copyFromFloorId: sourceFloorId } : {});
        Context.clearSelection();
        Context.syncFloorControls();
        Context.refreshShadows();
        Context.renderPlan();
      });
      return;
    }
    const floorButton = event.target.closest('[data-floor-id]');
    if (!floorButton) return;
    Context.testMap.executeCommand('setCurrentFloor', { floorId: floorButton.dataset.floorId });
    Context.clearSelection();
    Context.updateSkyboxFromCurrentFloor();
    Context.syncFloorControls();
    Context.refreshShadows();
    Context.renderPlan();
  });
}

function bindStageInteractions(Context, stage) {
  stage?.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (Context.isDrawingMode()) {
      Context.drawStart = null;
      Context.clearDrawWallPreview();
      Context.switchToSelectMode();
      event.stopPropagation();
      return;
    }
    const target = Context.currentView === '2d' ? get2DTargetFromElement(event.target) : null;
    if (target) {
      event.stopPropagation();
      showObjectContextMenu(target, event.clientX, event.clientY);
    }
  });
  ['copy', 'cut', 'paste', 'selectstart', 'dragstart'].forEach((eventName) => {
    stage?.addEventListener(eventName, (event) => event.preventDefault());
  });
  document.addEventListener('pointerup', Context.cancelLongPress);
  document.addEventListener('pointercancel', Context.handlePointerCancel);
  document.addEventListener('pointerdown', (event) => {
    if (!Context.contextMenuElement || Context.contextMenuElement.contains(event.target)) return;
    Context.hideContextMenu();
  });
  window.addEventListener('resize', Context.hideContextMenu);
}

function bindFileAndPanelControls(Context) {
  document.getElementById('btn-reset-camera')?.addEventListener('click', () => {
    if (Context.currentView === '3d') Context.resetCamera();
    else {
      Context.hasUserZoomedOrPanned = false;
      Context.renderPlan();
    }
    if (Context.mode === 'view') Context.switchToSelectMode();
  });
  document.getElementById('btn-reset-material')?.addEventListener('click', Context.resetCurrentMaterial);
  document.getElementById('btn-new')?.addEventListener('click', () => {
    Context.pushHistory();
    Context.testMap.loadJSON(BLUEPRINT3D_TEST_FLOORPLAN);
    Context.store.clearLocal();
    Context.syncFloorControls();
    Context.hasUserZoomedOrPanned = false;
    Context.resetInteractionState();
    Context.refreshShadows();
    Context.updateEditor();
    Context.renderPlan();
    updateLocalProjectCount();
  });

  const fileButton = document.getElementById('btn-file-menu');
  const fileMenu = document.getElementById('file-menu-content');
  fileButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    fileMenu?.classList.toggle('hidden');
  });
  fileMenu?.addEventListener('click', (event) => {
    if (event.target.id !== 'btn-export-menu') fileMenu.classList.add('hidden');
  });

  bindPanelToggle(Context, 'btn-toggle-right', '#right-panel', '<', '>');
  bindPanelToggle(Context, 'btn-toggle-left', '.left-panel', '>', '<');
}

function bindPanelToggle(Context, buttonId, panelSelector, collapsedText, expandedText) {
  const button = document.getElementById(buttonId);
  const panel = document.querySelector(panelSelector);
  if (!button || !panel) return;
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    button.textContent = panel.classList.toggle('collapsed') ? collapsedText : expandedText;
    setTimeout(() => Context.engine?.resize(), 300);
  });
}

function initToolGroupToggles(Context) {
  const savedState = Context.store.readToolGroupState();
  document.querySelectorAll('.tool-group-toggle').forEach((toggle) => {
    const group = toggle.closest('.building-tool-group')?.dataset.toolGroup || toggle.getAttribute('aria-controls');
    const target = document.getElementById(toggle.getAttribute('aria-controls'));
    const update = (expanded) => {
      toggle.setAttribute('aria-expanded', String(expanded));
      target?.classList.toggle('hidden', !expanded);
    };
    update(savedState[group] !== false);
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'false';
      update(expanded);
      savedState[group] = expanded;
      Context.store.writeToolGroupState(savedState);
    });
  });
}
