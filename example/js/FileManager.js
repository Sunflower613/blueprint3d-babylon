import {
  createBuildingFileName,
  createDXFFileName,
  create3MFFileName,
  stringifyDXF,
  create3MFPackage
} from '../../src/index.js';

let ctx = null;

/**
 * 初始化并配置 FileManager。绑定相关下载/加载按钮的点击事件。
 * @param {Object} appContext 依赖的上下文环境对象
 */
export function initFileManager(appContext) {
  ctx = appContext;

  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    btnSave.addEventListener('click', downloadBuildingFile);
  }

  const btnSaveLocal = document.getElementById('btn-save-local');
  if (btnSaveLocal) {
    btnSaveLocal.addEventListener('click', saveToLocalStorage);
  }

  const btnExportDXF = document.getElementById('btn-export-dxf');
  if (btnExportDXF) {
    btnExportDXF.addEventListener('click', downloadDXFFile);
  }

  const btnExport3MF = document.getElementById('btn-export-3mf');
  if (btnExport3MF) {
    btnExport3MF.addEventListener('click', download3MFFile);
  }

  const btnLoad = document.getElementById('btn-load');
  const buildingFileInput = document.getElementById('building-file-input');
  if (btnLoad && buildingFileInput) {
    btnLoad.addEventListener('click', () => {
      buildingFileInput.value = '';
      buildingFileInput.click();
    });
  }

  if (buildingFileInput) {
    buildingFileInput.addEventListener('change', onFileInputChange);
  }

  const btnOpenLocal = document.getElementById('btn-open-local');
  if (btnOpenLocal) {
    btnOpenLocal.addEventListener('click', openLocalStorageList);
  }

  updateLocalProjectCount();
}

/**
 * 导出并下载 .json 格式建筑存档
 */
export function downloadBuildingFile() {
  const json = ctx.testMap.stringifyBuildingFile({ name: ctx.testMap.floorplan.name || 'blueprint-building' });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createBuildingFileName(ctx.testMap.floorplan.name || 'blueprint-building');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 导出并下载 DXF 格式文件
 */
export function downloadDXFFile() {
  const json = ctx.testMap.exportJSON();
  const dxfText = stringifyDXF(json);
  const blob = new Blob([dxfText], { type: 'image/vnd.dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createDXFFileName(ctx.testMap.floorplan.name || 'blueprint-building');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 导出并下载 3MF 格式三维制造模型文件
 */
export function download3MFFile() {
  const json = ctx.testMap.exportJSON();
  const bytes = create3MFPackage(json);
  const blob = new Blob([bytes], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = create3MFFileName(ctx.testMap.floorplan.name || 'blueprint-building');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 异步读取并加载用户选择的本地建筑 .json 存档
 * @param {File} file 选中的本地建筑文件对象
 */
export async function loadBuildingFile(file) {
  if (!file) return;
  const text = await file.text();
  ctx.pushHistory();
  ctx.testMap.loadBuildingFile(text);
  ctx.syncFloorControls();
  ctx.setHasUserZoomedOrPanned(false);
  ctx.resetInteractionState();
  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
  if (ctx.currentView === '3d') {
    requestAnimationFrame(() => {
      ctx.engine.resize();
      ctx.scene.render();
    });
  }
}

async function onFileInputChange(event) {
  try {
    await loadBuildingFile(event.target.files?.[0]);
  } catch (error) {
    console.error(error);
    await ctx.showCustomAlert('加载失败', '建筑文件加载失败，请确认它是 blueprint3d-babylon 建筑文件。');
  }
}

/**
 * 保存当前项目到浏览器本地 LocalStorage 存储库中
 */
export async function saveToLocalStorage() {
  const defaultName = ctx.store.getCurrentProjectName() || ctx.testMap.floorplan.name || '';
  const name = await ctx.showCustomPrompt('保存到本地', '请为项目命名：', defaultName || '我的蓝图');
  if (!name) return;

  const ok = ctx.store.saveProject(name, {
    materialLibrary: ctx.getMaterialLibrary().filter((m) => !ctx.DEFAULT_MATERIAL_PACKS.some((d) => d.id === m.id)),
    uiState: { currentFloorId: ctx.testMap.floorplan.currentFloorId, currentView: ctx.currentView },
  });
  if (ok) {
    updateLocalProjectCount();
  }
  ctx.showToast(ok ? `✓ 已保存「${name}」` : '⚠ 保存失败');
}

/**
 * 弹出并管理 LocalStorage 项目库列表（打开、删除项目）
 */
export async function openLocalStorageList() {
  const projects = ctx.store.listProjects();
  if (!projects.length) {
    await ctx.showCustomAlert('暂无本地项目', '还没有保存过项目到本地，请先使用「保存到本地」。');
    return;
  }
  const result = await ctx.showProjectListModal(projects);
  if (!result) return;
  if (result.action === 'open') {
    const data = ctx.store.loadProject(result.name);
    if (data && data.buildingData) {
      ctx.pushHistory();
      ctx.testMap.loadJSON(data.buildingData);
      ctx.syncFloorControls();
      ctx.setHasUserZoomedOrPanned(false);
      ctx.resetInteractionState();
      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
      if (data.materialLibrary && data.materialLibrary.length) {
        const materialLibrary = ctx.getMaterialLibrary();
        data.materialLibrary.forEach((m) => {
          if (!materialLibrary.some((existing) => existing.id === m.id)) {
            materialLibrary.push(m);
          }
        });
      }
      ctx.showToast(`✓ 已打开「${result.name}」`);
    } else {
      await ctx.showCustomAlert('打开失败', '无法读取该项目的数据。');
    }
  } else if (result.action === 'delete') {
    const confirmed = await ctx.showCustomConfirm('删除项目', `确定要删除「${result.name}」吗？此操作不可撤销。`);
    if (confirmed) {
      ctx.store.deleteProject(result.name);
      updateLocalProjectCount();
      ctx.showToast(`已删除「${result.name}」`);
    }
  }
}

/**
 * 获取 LocalStorage 中的保存项目总数并更新指示角标
 */
export function updateLocalProjectCount() {
  const badge = document.getElementById('open-project-badge');
  if (badge) {
    const count = ctx.store.listProjects().length;
    badge.textContent = count;
    if (count === 0) {
      badge.classList.add('zero');
    } else {
      badge.classList.remove('zero');
    }
  }
}
