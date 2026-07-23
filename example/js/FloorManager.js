let Context = null;

export function initFloorManager(appState) {
  Context = appState;
}

export function referenceFloorWalls() {
  const testMap = Context.testMap;
  if (!testMap.getFloorLevel || !testMap.getFloors().length) return [];
  const currentLevel = testMap.getFloorLevel(testMap.getCurrentFloorId());
  const lowerFloors = testMap.getFloors()
    .filter((floor) => Number(floor.level || 0) < currentLevel)
    .sort((a, b) => Number(b.level || 0) - Number(a.level || 0));
  const referenceFloor = lowerFloors[0];
  if (!referenceFloor) return [];
  return testMap.getEntities('wall', { floorId: referenceFloor.id });
}

export function getFloorEntityCount(floorId) {
  if (!floorId) return 0;
  const types = ['room', 'wall', 'opening', 'item', 'roof', 'stairs', 'fence', 'fenceGate'];
  let count = 0;
  for (const type of types) {
    count += Context.testMap.getEntities(type, { floorId }).length;
  }
  return count;
}

export function ensureVisibleCurrentFloor(options = {}) {
  const { reason = 'unknown', silent = false } = options;
  const floors = Context.testMap.getFloors();
  if (!floors.length) return false;
  const currentFloorId = Context.testMap.getCurrentFloorId();
  if (getFloorEntityCount(currentFloorId) > 0) return false;

  const fallbackFloor = [...floors]
    .map((floor) => ({ floor, count: getFloorEntityCount(floor.id) }))
    .sort((a, b) => b.count - a.count || Number(a.floor.level || 0) - Number(b.floor.level || 0))
    .find((entry) => entry.count > 0);

  if (!fallbackFloor || fallbackFloor.floor.id === currentFloorId) return false;

  Context.testMap.setCurrentFloor(fallbackFloor.floor.id);
  console.warn(`[floor-recovery] Switched empty floor "${currentFloorId}" to populated floor "${fallbackFloor.floor.id}" during ${reason}.`);
  Context.updateSkyboxFromCurrentFloor();
  if (!silent) {
    Context.showToast(`当前楼层无内容，已自动切换到“${fallbackFloor.floor.name || fallbackFloor.floor.id}”`);
  }
  return true;
}

export function showFloorContextMenu(target, clientX, clientY) {
  if (!target?.id) return;
  const sorted = [...Context.testMap.getFloors()].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
  const index = sorted.findIndex((floor) => floor.id === target.id);
  if (index < 0) return;
  Context.showIconMenu(clientX, clientY, [
    { icon: 'edit', title: '命名', onClick: () => renameCurrentFloor(target.id) },
    { icon: 'up', title: '上移', disabled: index === sorted.length - 1, onClick: () => moveFloorAction(target.id, 'up') },
    { icon: 'down', title: '下移', disabled: index <= 0, onClick: () => moveFloorAction(target.id, 'down') },
    { icon: 'trash', title: '删除', disabled: Context.testMap.getFloors().length <= 1, onClick: () => deleteFloorAction(target.id) }
  ]);
}

export function moveFloorAction(floorId, direction) {
  Context.pushHistory();
  if (Context.testMap.moveFloor?.(floorId, direction)) {
    syncFloorControls();
    Context.refreshShadows();
    Context.renderPlan();
  }
}

export function deleteFloorAction(floorId) {
  if (Context.testMap.getFloors().length <= 1) return;
  Context.pushHistory();
  if (Context.testMap.deleteFloor?.(floorId)) {
    Context.clearSelection();
    syncFloorControls();
    Context.refreshShadows();
    Context.renderPlan();
  }
}

export async function renameCurrentFloor(floorId) {
  const floor = Context.testMap.getFloor(floorId);
  if (!floor) return;
  const currentName = floor.name || `${Number(floor.level || 0) + 1}F`;
  const newName = await Context.showCustomPrompt('楼层命名', '请输入新的楼层名称：', currentName);
  if (newName !== null) {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== currentName) {
      Context.pushHistory();
      if (Context.testMap.renameFloor?.(floorId, trimmed)) {
        syncFloorControls();
        Context.refreshShadows();
        Context.renderPlan();
      }
    }
  }
}

export function formatFloorDisplayName(name) {
  if (!name) return '';
  const hasChinese = /[\u4e00-\u9fa5]/.test(name);
  if (hasChinese) {
    const match = name.match(/[\u4e00-\u9fa5]/);
    return match ? match[0] : name.slice(0, 2);
  }
  return name.slice(0, 2);
}

export function syncFloorControls() {
  const container = document.getElementById('floor-floating-group');
  if (!container) return;

  container.innerHTML = '';

  if (Context.floorPanelCollapsed) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn-icon btn-floor-toggle-expanded';
    toggleBtn.title = '展开楼层面板';
    toggleBtn.setAttribute('aria-label', '展开楼层面板');
    toggleBtn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-10 4 10 4 10-4Z"/><path d="m2 12 10 4 10-4"/><path d="m2 17 10 4 10-4"/></svg>';
    
    toggleBtn.addEventListener('click', () => {
      Context.floorPanelCollapsed = false;
      syncFloorControls();
    });
    
    container.appendChild(toggleBtn);
    return;
  }

  const sortedFloors = [...Context.testMap.getFloors()].sort((a, b) => Number(b.level || 0) - Number(a.level || 0));

  sortedFloors.forEach((floor) => {
    const btn = document.createElement('button');
    const floorName = floor.name || `${Number(floor.level || 0) + 1}F`;
    btn.type = 'button';
    btn.className = 'btn-icon btn-floor-item';
    btn.dataset.floorId = floor.id;
    btn.textContent = formatFloorDisplayName(floorName);
    btn.title = `切换到 ${floorName}`;
    btn.setAttribute('aria-label', `切换到 ${floorName}`);

    if (floor.id === Context.testMap.getCurrentFloorId()) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      if (floor.id !== Context.testMap.getCurrentFloorId()) {
        Context.testMap.setCurrentFloor(floor.id);
        Context.syncFloorControls();
        Context.clearSelection();
        Context.updateSkyboxFromCurrentFloor();
        Context.refreshShadows();
        Context.updateEditor();
        Context.renderPlan();
      }
    });

    Context.attachContextMenuTrigger(btn, () => ({ type: 'floor', id: floor.id }), showFloorContextMenu);

    container.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.id = 'btn-add-floor';
  addBtn.type = 'button';
  addBtn.className = 'btn-icon btn-floor-add';
  addBtn.title = '新建楼层';
  addBtn.setAttribute('aria-label', '新建楼层');
  addBtn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>';
  
  container.appendChild(addBtn);

  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'btn-icon btn-floor-fold';
  foldBtn.title = '收起楼层面板';
  foldBtn.setAttribute('aria-label', '收起楼层面板');
  foldBtn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
  
  foldBtn.addEventListener('click', () => {
    Context.floorPanelCollapsed = true;
    syncFloorControls();
  });
  
  container.appendChild(foldBtn);
}
