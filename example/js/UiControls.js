import {
  boxComponent,
  cylinderComponent,
  sphereComponent,
  FURNITURE_DEFINITIONS,
  FURNITURE_LIST,
  FURNITURE_CATEGORIES,
  MATERIAL_CATEGORIES,
  getFurnitureThumbnailUrl
} from '../../src/index.js';

let Context = null;
const FURNITURE_IMAGE_PROXY_PREFIX = '/__furniture-images__/';
const fallbackFurnitureType = 'custom_cube';
const transparentGIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function getFurnitureImageProxyUrl(path) {
  const fileName = path.split('/').pop() || 'custom_cube.png';
  return `${FURNITURE_IMAGE_PROXY_PREFIX}${encodeURIComponent(fileName)}`;
}

async function resolveFurnitureThumbnailUrl(type) {
  if (import.meta.env.DEV) return getFurnitureImageProxyUrl(`${type}.png`);
  return getFurnitureThumbnailUrl(type);
}

const furnitureThumbnailObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  entries.forEach(async (entry) => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    furnitureThumbnailObserver.unobserve(img);
    try {
      const thumbnailUrl = await resolveFurnitureThumbnailUrl(img.dataset.thumbnailType || fallbackFurnitureType);
      if (!thumbnailUrl) {
        img.dispatchEvent(new Event('error'));
        return;
      }
      img.src = thumbnailUrl;
    } catch {
      img.dispatchEvent(new Event('error'));
    }
  });
}, { rootMargin: '160px' });

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

export function initFurnitureButtons() {
  const categorySelect = document.getElementById('furniture-category-select');
  const searchInput = document.getElementById('furniture-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-furniture-search');
  const groups = [
    { label: '', items: ['all', 'custom'] },
    { label: '室内家具', items: ['tables', 'seating', 'storage', 'bedroom', 'kitchen', 'bathroom'] },
    { label: '生活家电', items: ['appliances', 'lighting', 'decor', 'food', 'textiles', 'clothing', 'plants'] },
    { label: '庭院户外', items: ['outdoor', 'landscape', 'flora'] }
  ];

  if (categorySelect && categorySelect.children.length === 0) {
    groups.forEach((group) => {
      let parent = categorySelect;
      if (group.label) {
        parent = document.createElement('optgroup');
        parent.label = group.label;
        categorySelect.appendChild(parent);
      }
      group.items.forEach((categoryId) => {
        const category = FURNITURE_CATEGORIES.find((candidate) => candidate.id === categoryId);
        if (!category) return;
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.label;
        if (category.icon) option.setAttribute('data-icon', category.icon);
        parent.appendChild(option);
      });
    });
    categorySelect.addEventListener('change', renderFurnitureGrid);
  }

  searchInput?.addEventListener('input', () => {
    clearSearchBtn?.classList.toggle('hidden', !searchInput.value);
    renderFurnitureGrid();
  });
  clearSearchBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    clearSearchBtn.classList.add('hidden');
    renderFurnitureGrid();
  });

  initFurnitureUpload();
  restoreCustomFurnitureFromLocalStorage();
  renderFurnitureGrid();
}

async function loadFurnitureThumbnail(img, path) {
  const thumbnailUrl = await resolveFurnitureThumbnailUrl(path);
  if (thumbnailUrl) img.src = thumbnailUrl;
}

let gridScrollListener = null;

export function renderFurnitureGrid() {
  const itemGrid = document.getElementById('item-grid');
  if (!itemGrid) return;
  furnitureThumbnailObserver?.disconnect();
  itemGrid.innerHTML = '';
  if (gridScrollListener) {
    itemGrid.removeEventListener('scroll', gridScrollListener);
    gridScrollListener = null;
  }

  const categorySelect = document.getElementById('furniture-category-select');
  const selectedCategory = categorySelect?.value || 'all';
  const searchInput = document.getElementById('furniture-search-input');
  const searchQuery = searchInput?.value.trim().toLowerCase() || '';
  document.getElementById('furniture-upload-actions')?.classList.toggle('hidden', selectedCategory !== 'custom');

  const filtered = FURNITURE_LIST.filter((definition) =>
    (selectedCategory === 'all' || definition.category === selectedCategory) &&
    (!searchQuery || definition.name.toLowerCase().includes(searchQuery))
  );

  const ITEMS_PER_ROW = 3;
  const ROW_HEIGHT = 88;
  const totalRows = Math.ceil(filtered.length / ITEMS_PER_ROW);
  const totalHeight = totalRows * ROW_HEIGHT;

  itemGrid.style.position = 'relative';

  const virtualSpacer = document.createElement('div');
  virtualSpacer.style.height = `${totalHeight}px`;
  virtualSpacer.style.width = '100%';
  virtualSpacer.style.position = 'absolute';
  virtualSpacer.style.top = '0';
  virtualSpacer.style.left = '0';
  virtualSpacer.style.pointerEvents = 'none';

  const viewportContainer = document.createElement('div');
  viewportContainer.style.position = 'absolute';
  viewportContainer.style.top = '0';
  viewportContainer.style.left = '0';
  viewportContainer.style.right = '0';
  viewportContainer.style.display = 'grid';
  viewportContainer.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  viewportContainer.style.gap = '6px';

  itemGrid.append(virtualSpacer, viewportContainer);

  let lastRenderedStart = -1;
  let lastRenderedEnd = -1;

  const updateVirtualList = () => {
    const scrollTop = itemGrid.scrollTop;
    const clientHeight = itemGrid.clientHeight || 400;

    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 1);
    const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) + 1);

    const startIndex = startRow * ITEMS_PER_ROW;
    const endIndex = Math.min(filtered.length, (endRow + 1) * ITEMS_PER_ROW);

    if (startIndex === lastRenderedStart && endIndex === lastRenderedEnd) return;
    lastRenderedStart = startIndex;
    lastRenderedEnd = endIndex;

    furnitureThumbnailObserver?.disconnect();
    viewportContainer.innerHTML = '';
    viewportContainer.style.transform = `translateY(${startRow * ROW_HEIGHT}px)`;

    const slice = filtered.slice(startIndex, endIndex);
    slice.forEach((definition) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.addItem = definition.type;
      button.className = 'furniture-item-btn';

      const img = document.createElement('img');
      const imageType = definition.type;
      img.alt = definition.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.fetchPriority = 'low';
      img.src = transparentGIF;
      img.classList.add('placeholder-active', 'loading');
      img.onload = () => {
        if (img.src !== transparentGIF) img.classList.remove('placeholder-active', 'loading');
      };
      img.onerror = async () => {
        img.onerror = null;
        try {
          const fallbackUrl = await resolveFurnitureThumbnailUrl(fallbackFurnitureType);
          if (!fallbackUrl) throw new Error('No fallback loader');
          img.onerror = () => {
            img.onerror = null;
            img.src = transparentGIF;
            img.classList.add('placeholder-active');
            img.classList.remove('loading');
          };
          img.src = fallbackUrl;
        } catch {
          img.src = transparentGIF;
          img.classList.add('placeholder-active');
          img.classList.remove('loading');
        }
      };

      if (definition.thumbnail) {
        img.src = definition.thumbnail;
      } else if (furnitureThumbnailObserver) {
        img.dataset.thumbnailType = imageType;
        furnitureThumbnailObserver.observe(img);
      } else {
        loadFurnitureThumbnail(img, imageType).catch(() => img.dispatchEvent(new Event('error')));
      }

      const label = document.createElement('span');
      label.textContent = definition.name;
      button.append(img, label);
      viewportContainer.appendChild(button);
    });
  };

  updateVirtualList();

  let ticking = false;
  gridScrollListener = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateVirtualList();
        ticking = false;
      });
      ticking = true;
    }
  };

  itemGrid.addEventListener('scroll', gridScrollListener);
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
