import {
  boxComponent,
  cylinderComponent,
  sphereComponent,
  FURNITURE_DEFINITIONS,
  FURNITURE_LIST,
  MATERIAL_CATEGORIES
} from '../../src/index.js';

let Context = null;

export function initUiControls(appState) {
  Context = appState;
}

export function initMaterialControls() {
  const materialCategorySelect = document.getElementById('material-category');
  if (!materialCategorySelect) return;

  materialCategorySelect.innerHTML = '';
  MATERIAL_CATEGORIES.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.label;
    if (category.icon) option.setAttribute('data-icon', category.icon);
    materialCategorySelect.appendChild(option);
  });
  materialCategorySelect.value = 'paint';
  Context.activeMaterialDescriptor = Context.materialLibrary[0] || null;
  Context.editor.activeMaterialDescriptor = Context.materialLibrary[0] || null;
  Context.editor.activeMaterialArray = null;
  Context.renderMaterialLibrary();
}

export function validateUploadedFurniture(definition) {
  if (!definition || typeof definition !== 'object') return 'The factory did not return a furniture definition object.';
  if (!/^[a-z][a-z0-9_]*$/.test(definition.type || '')) return 'type must start with a lowercase letter and contain only lowercase letters, digits, and underscores.';
  if (!definition.name || typeof definition.name !== 'string') return 'A valid furniture name is required.';
  if (definition.thumbnail !== undefined && typeof definition.thumbnail !== 'string') {
    return 'thumbnail must be a string path or Base64 Data URL.';
  }
  if (!definition.defaultSize || ['width', 'depth', 'height'].some((key) => !Number.isFinite(Number(definition.defaultSize[key])) || Number(definition.defaultSize[key]) <= 0)) {
    return 'defaultSize.width, depth, and height must all be numbers greater than zero.';
  }
  if (!Array.isArray(definition.components) || definition.components.length === 0) return 'components must contain at least one editable component.';
  const componentIds = new Set();
  for (const component of definition.components) {
    if (!component?.id || typeof component.id !== 'string') return 'Every component must have a valid id.';
    if (componentIds.has(component.id)) return `Duplicate component id: ${component.id}`;
    componentIds.add(component.id);
  }
  if (typeof definition.build !== 'function') return 'A build function is required.';
  const existing = FURNITURE_DEFINITIONS[definition.type];
  if (existing && existing.category !== 'custom') {
    return `Furniture type "${definition.type}" already exists. Choose another type.`;
  }
  return '';
}

export async function registerCustomFurniture(source) {
  const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    const uploadedModule = await import(/* @vite-ignore */ moduleUrl);
    if (typeof uploadedModule.default !== 'function') {
      throw new Error('The file must default-export a createFurniture factory function.');
    }
    const BABYLON = Context.BABYLON;
    const definition = await uploadedModule.default({
      boxComponent,
      cylinderComponent,
      sphereComponent,
      BABYLON
    });
    const validationError = validateUploadedFurniture(definition);
    if (validationError) throw new Error(validationError);

    definition.category = 'custom';
    definition.defaultSize = {
      width: Number(definition.defaultSize.width),
      depth: Number(definition.defaultSize.depth),
      height: Number(definition.defaultSize.height)
    };
    FURNITURE_DEFINITIONS[definition.type] = definition;
    
    const existingIndex = FURNITURE_LIST.findIndex((f) => f.type === definition.type);
    if (existingIndex >= 0) {
      FURNITURE_LIST[existingIndex] = definition;
    } else {
      FURNITURE_LIST.push(definition);
    }
    return definition;
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }
}

export function saveCustomFurnitureToLocalStorage(type, source) {
  try {
    const storedStr = localStorage.getItem('custom_furniture_sources');
    const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
    sourcesMap[type] = source;
    localStorage.setItem('custom_furniture_sources', JSON.stringify(sourcesMap));
  } catch (e) {
    console.error('Failed to save custom furniture source to localStorage:', e);
  }
}

export async function restoreCustomFurnitureFromLocalStorage() {
  try {
    const storedStr = localStorage.getItem('custom_furniture_sources');
    if (!storedStr) return;
    const sourcesMap = JSON.parse(storedStr);
    let restoredCount = 0;
    for (const type of Object.keys(sourcesMap)) {
      try {
        const source = sourcesMap[type];
        await registerCustomFurniture(source);
        restoredCount++;
      } catch (err) {
        console.error(`Failed to restore custom furniture "${type}":`, err);
      }
    }
    if (restoredCount > 0) {
      Context.renderFurnitureGrid();
    }
  } catch (e) {
    console.error('Failed to parse stored custom furniture sources:', e);
  }
}

export async function loadUploadedFurniture(file) {
  const source = await file.text();
  const definition = await registerCustomFurniture(source);
  Context.renderFurnitureGrid();
  Context.showToast(`\u2713 \u5df2\u4e0a\u4f20\u5bb6\u5177\u201c${definition.name}\u201d`);
  saveCustomFurnitureToLocalStorage(definition.type, source);
}

export function initFurnitureUpload() {
  const uploadButton = document.getElementById('btn-upload-furniture');
  const helpButton = document.getElementById('btn-furniture-upload-help');
  const input = document.getElementById('furniture-upload-input');
  if (!uploadButton || !helpButton || !input) return;

  uploadButton.addEventListener('click', () => {
    input.value = '';
    input.click();
  });
  helpButton.addEventListener('click', Context.showFurnitureUploadHelp);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      await loadUploadedFurniture(file);
    } catch (error) {
      console.error('Furniture upload failed:', error);
      await Context.showCustomAlert('\u4e0a\u4f20\u5bb6\u5177\u5931\u8d25', error?.message || '\u65e0\u6cd5\u8bfb\u53d6\u6b64\u5bb6\u5177\u6587\u4ef6\u3002');
    } finally {
      input.value = '';
    }
  });
}

export function cleanFloorplanMaterials(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.src && obj.src.startsWith('data:image/')) {
    obj.src = `materials/${obj.id || 'custom'}`;
  }
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      cleanFloorplanMaterials(obj[key]);
    }
  }
}

export function cleanMaterialLibraryForStorage(lib) {
  if (!Array.isArray(lib)) return [];
  return lib.map((m) => {
    if (m.src && m.src.startsWith('data:image/')) {
      const copy = { ...m };
      copy.src = `materials/${m.id}`;
      return copy;
    }
    return m;
  });
}

export function restoreFloorplanMaterials(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.id && String(obj.id).startsWith('custom_') && (!obj.src || obj.src.startsWith('materials/'))) {
    const storedStr = localStorage.getItem('custom_material_sources');
    const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
    const base64 = sourcesMap[obj.id];
    if (base64) {
      obj.src = base64;
    } else {
      const foundInLib = Context.materialLibrary.find(m => m.id === obj.id);
      if (foundInLib && foundInLib.src) {
        obj.src = foundInLib.src;
      }
    }
  }
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      restoreFloorplanMaterials(obj[key]);
    }
  }
}
