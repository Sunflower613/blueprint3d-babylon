import JSZip from 'jszip';
import { Tools } from '../../src/core/babylon.js';
const BABYLON = { Tools };
import { getEditHandleNodes } from './Viewer3DHandles.js';
import { createBuildingFileName } from '../../src/core/buildingFile.js';
import { createDXFFileName, stringifyDXF } from '../../src/core/dxfExporter.js';
import { create3MFFileName, create3MFPackage } from '../../src/core/threeMfExporter.js';
import { createStoreProxy } from '../store/proxyHelper.js';

let rawCtx = null;
const ctx = createStoreProxy(() => rawCtx);

/**
 * 初始化并配置 FileManager。绑定相关下载/加载按钮的点击事件。
 * @param {Object} appContext 依赖的上下文环境对象
 */
export function initFileManager(appContext) {
  rawCtx = appContext;

  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    btnSave.addEventListener('click', downloadBuildingFile);
  }

  const btnExportZip = document.getElementById('btn-export-zip');
  if (btnExportZip) {
    btnExportZip.addEventListener('click', downloadBuildingZIP);
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

  const btnTakePhoto = document.getElementById('btn-take-photo');
  if (btnTakePhoto) {
    btnTakePhoto.addEventListener('click', takePhoto);
  }
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
export async function download3MFFile() {
  const result = await ctx.show3MFExportDialog();
  if (!result) return;
  const { category, enableTenon } = result;

  const json = ctx.testMap.exportJSON();
  const bytes = create3MFPackage(json, { category, enableTenon, testMap: ctx.testMap });
  const blob = new Blob([bytes], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const baseName = ctx.testMap.floorplan.name || 'blueprint-building';
  let exportName = baseName;
  if (category === 'building') {
    exportName = `${baseName}-building`;
  } else if (category === 'furniture') {
    exportName = `${baseName}-furniture`;
  }
  
  link.download = create3MFFileName(exportName);
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
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.name.endsWith('.zip')) {
      await loadBuildingZIP(file);
    } else {
      await loadBuildingFile(file);
    }
  } catch (error) {
    console.error(error);
    await ctx.showCustomAlert('加载失败', '加载失败，请确认它是有效的 blueprint3d-babylon 文件或 ZIP 归档包。');
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
    materialLibrary: ctx.getMaterialLibrary()
      .filter((m) => !ctx.DEFAULT_MATERIAL_PACKS.some((d) => d.id === m.id))
      .map((m) => {
        if (m.id && String(m.id).startsWith('custom_')) {
          const copy = { ...m };
          delete copy.src;
          return copy;
        }
        return m;
      }),
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
      
      // 还原自定义材质的 src
      const restoreFloorplanMaterials = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.id && String(obj.id).startsWith('custom_') && (!obj.src || obj.src.startsWith('materials/'))) {
          const storedStr = localStorage.getItem('custom_material_sources');
          const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
          const base64 = sourcesMap[obj.id];
          if (base64) obj.src = base64;
        }
        for (const key of Object.keys(obj)) {
          if (obj[key] && typeof obj[key] === 'object') {
            restoreFloorplanMaterials(obj[key]);
          }
        }
      };
      restoreFloorplanMaterials(data.buildingData);

      ctx.testMap.loadJSON(data.buildingData);
      ctx.syncFloorControls();
      ctx.setHasUserZoomedOrPanned(false);
      ctx.resetInteractionState();
      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
      if (data.materialLibrary && data.materialLibrary.length) {
        const materialLibrary = ctx.getMaterialLibrary();
        const storedStr = localStorage.getItem('custom_material_sources');
        const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
        data.materialLibrary.forEach((m) => {
          if (m.id && String(m.id).startsWith('custom_')) {
            m.src = sourcesMap[m.id] || m.src;
          }
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

/**
 * 递归寻找并提取自定义材质描述符
 */
function processCustomMaterials(obj, onMaterialFound) {
  if (!obj || typeof obj !== 'object') return;

  // 如果含有 ID 且为自定义材质 ID 形式
  if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('custom_')) {
    // 从本地集中存储取回 Base64 并临时塞回以做进一步处理
    const storedStr = localStorage.getItem('custom_material_sources');
    const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
    const base64 = sourcesMap[obj.id];
    if (base64) {
      obj.src = base64;
      onMaterialFound(obj);
    }
  }

  // 递归处理子属性
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      processCustomMaterials(obj[key], onMaterialFound);
    }
  }
}

/**
 * 将 Base64 Data URL 转换为 Uint8Array
 */
function dataURLtoUint8Array(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { data: u8arr, mime };
}

/**
 * 根据 MIME 类型获取文件后缀名
 */
function mimeToExt(mime) {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'png';
}

/**
 * ArrayBuffer 转为 Base64 字符串（防溢出安全版）
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 导出并下载 ZIP 压缩存档，包含场景JSON、自定义材质图片及自定义家具JS文件
 */
export async function downloadBuildingZIP() {
  try {
    ctx.showToast('正在准备导出 ZIP 压缩包...');
    const zip = new JSZip();

    // 1. 获取主建筑数据结构
    const buildingFileObj = ctx.testMap.exportBuildingFile({ name: ctx.testMap.floorplan.name || 'blueprint-building' });
    
    const usedCustomMaterials = [];
    const zipMaterialsFolder = zip.folder('materials');

    // 2. 提取场景中用到的自定义材质并替换 src 为相对路径
    processCustomMaterials(buildingFileObj.floorplan, (matDesc) => {
      try {
        const { data, mime } = dataURLtoUint8Array(matDesc.src);
        const ext = mimeToExt(mime);
        const fileName = `${matDesc.id}.${ext}`;
        
        if (!usedCustomMaterials.some(m => m.id === matDesc.id)) {
          zipMaterialsFolder.file(fileName, data);
          
          const matCopy = { ...matDesc };
          matCopy.src = `materials/${fileName}`;
          usedCustomMaterials.push(matCopy);
        }
        
        matDesc.src = `materials/${fileName}`;
      } catch (err) {
        console.error('Failed to extract custom material:', matDesc, err);
      }
    });

    // 保存材质库元数据到 materials.json
    if (usedCustomMaterials.length > 0) {
      zip.file('materials.json', JSON.stringify(usedCustomMaterials, null, 2));
    }

    // 3. 提取场景中用到的自定义家具并收集其源代码
    const usedCustomFurnitureTypes = new Set();
    if (buildingFileObj.floorplan.items && Array.isArray(buildingFileObj.floorplan.items)) {
      const furnitureDefinitions = ctx.getFurnitureDefinitions();
      for (const item of buildingFileObj.floorplan.items) {
        const type = item.type;
        if (type && furnitureDefinitions[type]) {
          const def = furnitureDefinitions[type];
          if (def.category === 'custom') {
            usedCustomFurnitureTypes.add(type);
          }
        }
      }
    }

    if (usedCustomFurnitureTypes.size > 0) {
      const zipFurnitureFolder = zip.folder('furniture');
      const customFurnitureSourcesStr = localStorage.getItem('custom_furniture_sources');
      const sourcesMap = customFurnitureSourcesStr ? JSON.parse(customFurnitureSourcesStr) : {};
      
      for (const type of usedCustomFurnitureTypes) {
        const source = sourcesMap[type];
        if (source) {
          zipFurnitureFolder.file(`${type}.js`, source);
        } else {
          console.warn(`Custom furniture source code not found for type: ${type}`);
        }
      }
    }

    // 4. 将主场景数据写入 b3dbuilding.json
    const safeName = String(ctx.testMap.floorplan.name || 'blueprint-building')
      .trim()
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'blueprint-building';
    
    zip.file(`${safeName}.b3dbuilding.json`, JSON.stringify(buildingFileObj, null, 2));

    // 5. 生成并启动浏览器下载
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    
    ctx.showToast('✓ ZIP 导出成功');
  } catch (error) {
    console.error('Failed to export ZIP:', error);
    ctx.showCustomAlert('导出失败', '导出 ZIP 压缩包时发生错误：' + (error.message || error));
  }
}

/**
 * 导入并解压 ZIP 压缩包，加载材质与家具，然后恢复渲染场景
 */
export async function loadBuildingZIP(file) {
  if (!file) return;
  
  ctx.showToast('正在读取 ZIP 文件...');
  
  try {
    const zip = await JSZip.loadAsync(file);
    
    // 1. 寻找根目录下的 *.b3dbuilding.json 场景文件
    let mainJsonFile = null;
    let mainJsonFileName = '';
    zip.forEach((relativePath, fileEntry) => {
      if (relativePath.endsWith('.b3dbuilding.json') && !relativePath.includes('/')) {
        mainJsonFile = fileEntry;
        mainJsonFileName = relativePath;
      }
    });
    
    if (!mainJsonFile) {
      throw new Error('未在 ZIP 压缩包根目录下找到 *.b3dbuilding.json 主场景文件。');
    }
    
    const mainJsonText = await mainJsonFile.async('text');
    const buildingFileObj = JSON.parse(mainJsonText);
    
    // 2. 解压并注册自定义家具
    const furnitureFiles = [];
    zip.forEach((relativePath, fileEntry) => {
      if (relativePath.startsWith('furniture/') && relativePath.endsWith('.js')) {
        const type = relativePath.replace('furniture/', '').replace('.js', '');
        furnitureFiles.push({ type, entry: fileEntry });
      }
    });
    
    if (furnitureFiles.length > 0) {
      ctx.showToast(`发现 ${furnitureFiles.length} 个自定义家具，正在加载...`);
      for (const fFile of furnitureFiles) {
        try {
          const source = await fFile.entry.async('text');
          await ctx.registerCustomFurniture(source);
          ctx.saveCustomFurnitureToLocalStorage(fFile.type, source);
        } catch (err) {
          console.error(`Failed to register custom furniture from ZIP: ${fFile.type}`, err);
        }
      }
      ctx.renderFurnitureGrid();
    }
    
    // 3. 解压并读取自定义材质
    let materialsMeta = [];
    const materialsMetaFile = zip.file('materials.json');
    if (materialsMetaFile) {
      const metaText = await materialsMetaFile.async('text');
      materialsMeta = JSON.parse(metaText);
    }
    
    const pathToBase64Map = {};
    const materialsFiles = [];
    zip.forEach((relativePath, fileEntry) => {
      if (relativePath.startsWith('materials/') && !relativePath.endsWith('.json')) {
        materialsFiles.push({ path: relativePath, entry: fileEntry });
      }
    });
    
    if (materialsFiles.length > 0) {
      ctx.showToast(`发现 ${materialsFiles.length} 个自定义材质，正在加载...`);
      for (const mFile of materialsFiles) {
        try {
          const buffer = await mFile.entry.async('arraybuffer');
          const ext = mFile.path.split('.').pop().toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
          
          const base64Src = `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
          pathToBase64Map[mFile.path] = base64Src;
          
          const meta = materialsMeta.find(m => m.src === mFile.path);
          if (meta) {
            const descriptor = {
              ...meta,
              src: base64Src
            };
            
            const materialLibrary = ctx.materialLibrary;
            if (!materialLibrary.some(existing => existing.id === descriptor.id)) {
              materialLibrary.unshift(descriptor);
            }
            
            // 同步写入本地持久化集中存储
            try {
              const storedStr = localStorage.getItem('custom_material_sources');
              const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
              sourcesMap[descriptor.id] = base64Src;
              localStorage.setItem('custom_material_sources', JSON.stringify(sourcesMap));
            } catch (err) {
              console.error('Failed to sync custom material from ZIP to localStorage:', err);
            }
          }
        } catch (err) {
          console.error(`Failed to load custom material from ZIP: ${mFile.path}`, err);
        }
      }
      ctx.renderMaterialLibrary();
    }
    
    // 4. 递归恢复场景 JSON 数据中的材质 src 为 Base64 URL 形式
    function restoreCustomMaterials(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.src && typeof obj.src === 'string' && obj.src.startsWith('materials/')) {
        const base64Src = pathToBase64Map[obj.src];
        if (base64Src) {
          obj.src = base64Src;
        } else {
          console.warn(`Base64 data not found for: ${obj.src}`);
        }
      }
      
      for (const key of Object.keys(obj)) {
        if (obj[key] && typeof obj[key] === 'object') {
          restoreCustomMaterials(obj[key]);
        }
      }
    }
    
    restoreCustomMaterials(buildingFileObj.floorplan);
    
    // 5. 导入场景数据并触发重绘
    const restoredJSONString = JSON.stringify(buildingFileObj, null, 2);
    ctx.pushHistory();
    ctx.testMap.loadBuildingFile(restoredJSONString);
    
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
    
    ctx.showToast(`✓ 成功导入 ZIP 存档并恢复「${buildingFileObj.name || '未命名'}」`);
  } catch (error) {
    console.error('Failed to import ZIP:', error);
    ctx.showCustomAlert('加载失败', 'ZIP 文件解压或解析失败，请确认它是有效的 blueprint3d-babylon 场景归档包：' + (error.message || error));
  }
}

export function takePhoto() {
  if (ctx.currentView === '3d') {
    ctx.showToast('正在生成 3D 截图...');
    
    // 1. 临时隐藏 3D 辅助网格和编辑手柄
    const originalGridState = ctx.viewer3d.show3DGrid;
    if (originalGridState) {
      ctx.viewer3d.clear3DGrid();
    }
    const hiddenNodes = [];
    getEditHandleNodes().forEach((node) => {
      if (node && !node.isDisposed() && node.isEnabled()) {
        node.setEnabled(false);
        hiddenNodes.push(node);
      }
    });

    // 2. 保证在此帧渲染隐藏后的效果
    ctx.scene.render();

    // 3. 调用 Babylon 截图
    BABYLON.Tools.CreateScreenshotAsync(ctx.engine, ctx.camera, { precision: 1 })
      .then((dataUrl) => {
        const filename = `screenshot_3d_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ctx.showToast('✓ 3D 截图已下载');
      })
      .catch((err) => {
        console.error('3D 截图失败:', err);
        ctx.showToast('⚠ 3D 截图生成失败');
      })
      .finally(() => {
        // 4. 恢复 3D 网格和编辑手柄
        if (originalGridState) {
          ctx.refresh3DGrid();
        }
        hiddenNodes.forEach((node) => {
          if (node && !node.isDisposed()) {
            node.setEnabled(true);
          }
        });
      });
  } else {
    ctx.showToast('正在生成 2D 截图...');
    get2DPlanScreenshot()
      .then((dataUrl) => {
        const filename = `screenshot_2d_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ctx.showToast('✓ 2D 截图已下载');
      })
      .catch((err) => {
        console.error('2D 截图失败:', err);
        ctx.showToast('⚠ 2D 截图生成失败');
      });
  }
}

function get2DPlanScreenshot() {
  return new Promise((resolve, reject) => {
    const svgEl = document.getElementById('floorplan');
    if (!svgEl) {
      reject(new Error('未找到 floorplan SVG 元素'));
      return;
    }
    
    const svgClone = svgEl.cloneNode(true);
    
    // 提取所有样式表中的样式规则并放入 style 标签中
    let styleString = '';
    for (const styleSheet of document.styleSheets) {
      try {
        const rules = styleSheet.cssRules || styleSheet.rules;
        if (rules) {
          for (const rule of rules) {
            styleString += rule.cssText;
          }
        }
      } catch (e) {
        // 忽略跨域的样式表
      }
    }
    
    const styleEl = document.createElement('style');
    styleEl.textContent = styleString;
    svgClone.insertBefore(styleEl, svgClone.firstChild);
    
    // 获取实际物理尺寸，避免渲染时Image拉伸异常
    const rect = svgEl.getBoundingClientRect();
    const width = rect.width || 720;
    const height = rect.height || 520;
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2倍高分辨率
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        try {
          const pngUrl = canvas.toDataURL('image/png');
          resolve(pngUrl);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('无法创建 2D canvas context'));
      }
      URL.revokeObjectURL(blobURL);
    };
    
    image.onerror = (err) => {
      URL.revokeObjectURL(blobURL);
      reject(err);
    };
    
    image.src = blobURL;
  });
}
