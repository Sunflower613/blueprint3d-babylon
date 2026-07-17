import { FENCE_SUBTYPE_DEFAULTS, MaterialResolver } from '../../src/index.js';
import { TARGET_TYPES } from './types.js';
import { isTargetLocked } from './TargetHandler.js';
import { selection, editor } from '../store/index.js';

let ctx = null;

export function initMaterialManager(context) {
  ctx = context;
}

export function saveCustomMaterialToLocalStorage(id, src) {
  try {
    const storedStr = localStorage.getItem('custom_material_sources');
    const sourcesMap = storedStr ? JSON.parse(storedStr) : {};
    sourcesMap[id] = src;
    localStorage.setItem('custom_material_sources', JSON.stringify(sourcesMap));
  } catch (e) {
    console.error('Failed to save custom material source to localStorage:', e);
  }
}

export function removeCustomMaterialFromLocalStorage(id) {
  try {
    const storedStr = localStorage.getItem('custom_material_sources');
    if (!storedStr) return;
    const sourcesMap = JSON.parse(storedStr);
    delete sourcesMap[id];
    localStorage.setItem('custom_material_sources', JSON.stringify(sourcesMap));
  } catch (e) {
    console.error('Failed to remove custom material source from localStorage:', e);
  }
}

export function getActiveMaterialDisplayName(mat) {
  if (!mat) return '未选择材质';
  if (typeof mat === 'string') {
    if (mat.startsWith('#')) return `纯色：${mat}`;
    return mat;
  }
  
  const isPureColor = (
    (mat.kind === 'color' || mat.kind === 'paint') ||
    (!mat.kind && mat.color && !mat.src)
  );
  
  if (isPureColor) {
    const colorVal = mat.color || '#ffffff';
    if (!mat.name || mat.name === '颜色' || mat.name === '自定义材质' || mat.name.startsWith('吸取颜色')) {
      return `纯色：${colorVal}`;
    }
  }
  return mat.name || '自定义材质';
}

function isTextureMaterial(material) {
  if (!material || typeof material === 'string') return false;
  return material.kind === 'texture' && !!(material.src || material.url);
}

function applySwatchStyle(button, material) {
  button.style.background = '';
  button.style.backgroundImage = '';
  button.style.backgroundColor = '';
  button.style.backgroundBlendMode = '';
  button.style.backgroundPosition = '';
  button.style.backgroundSize = '';
  button.style.boxShadow = '';
  button.style.border = '';

  if (!material) {
    button.style.backgroundColor = '#ffffff';
    return;
  }

  if (typeof material === 'string') {
    button.style.backgroundColor = material;
    return;
  }

  const color = material.color || '#ffffff';
  if (isTextureMaterial(material)) {
    const src = material.src || material.url;
    button.style.backgroundImage = `linear-gradient(${color}cc, ${color}cc), url(${src})`;
    button.style.backgroundBlendMode = 'multiply';
    button.style.backgroundPosition = 'center';
    button.style.backgroundSize = 'cover';
    button.style.backgroundColor = color;
    return;
  }

  if (material.kind === 'mirror') {
    button.style.background = `linear-gradient(135deg, ${color} 0%, #ffffff 45%, ${color} 55%, #ffffff 100%)`;
    return;
  }

  if (material.kind === 'stained-glass') {
    button.style.background = 'conic-gradient(from 18deg at 42% 55%, #f27462 0 14%, #2b2023 14% 15%, #f2c95c 15% 29%, #2b2023 29% 30%, #4238de 30% 42%, #2b2023 42% 43%, #cf4b91 43% 62%, #2b2023 62% 63%, #ef9f58 63% 82%, #2b2023 82% 83%, #7557c9 83%)';
    button.style.backgroundSize = '38px 38px';
    button.style.boxShadow = 'inset 0 0 8px rgba(255,255,255,0.35), 0 0 7px rgba(142,76,201,0.3)';
    return;
  }

  if (material.kind === 'glass') {
    button.style.background = `linear-gradient(${color}99, ${color}99), repeating-conic-gradient(#d0d0d0 0% 25%, #f5f5f5 0% 50%) 0 0 / 8px 8px`;
    return;
  }

  if (material.kind === 'emissive') {
    button.style.backgroundColor = color;
    button.style.boxShadow = `inset 0 0 4px rgba(255,255,255,0.8), 0 0 10px ${color}88`;
    button.style.border = '1px solid rgba(255,255,255,0.4)';
    return;
  }

  if (material.kind === 'metal') {
    const isMatte = material.roughness !== undefined && material.roughness > 0.4;
    if (isMatte) {
      button.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%), linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.15) 100%), ${color}`;
      button.style.boxShadow = 'inset 0 0 8px rgba(0,0,0,0.25)';
    } else {
      button.style.background = `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.8) 45%, rgba(0,0,0,0.3) 60%, rgba(255,255,255,0.3) 80%, rgba(0,0,0,0.1) 100%), ${color}`;
      button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.2)';
    }
    return;
  }

  button.style.backgroundColor = color;
}

function upsertMaterialDescriptor(descriptor) {
  const existingIndex = editor.materialLibrary.findIndex((material) => material.id === descriptor.id);
  if (existingIndex >= 0) {
    const nextLibrary = [...editor.materialLibrary];
    nextLibrary[existingIndex] = descriptor;
    editor.materialLibrary = nextLibrary;
    return;
  }

  editor.materialLibrary = [descriptor, ...editor.materialLibrary];
}

function createTintedTextureDescriptor(material, color) {
  const sourceId = String(material.id || 'texture');
  const isCustomSource = sourceId.startsWith('custom_');
  const derivedId = isCustomSource
    ? sourceId
    : `derived_texture_${sourceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return {
    ...material,
    id: derivedId,
    kind: 'texture',
    category: material.category || 'custom',
    src: material.src || material.url,
    color,
    derivedFrom: material.derivedFrom || material.id || null,
    name: isCustomSource ? (material.name || 'Custom Texture') : `${material.name || 'Texture'} (Tintable)`
  };
}

export function renderMaterialLibrary(isSwitchingCategory = false) {
  ctx.updateDesignCursor();
  const materialCategorySelect = document.getElementById('material-category');
  const materialLibraryPanel = document.getElementById('material-library');
  if (!materialCategorySelect || !materialLibraryPanel) return;

  const category = materialCategorySelect.value;
  const materials = editor.materialLibrary.filter((material) => material.category === category);
  if (isSwitchingCategory && !editor.activeMaterialArray?.length) {
    const activeExistsInCategory = editor.activeMaterialDescriptor
      ? materials.some((material) => material.id === editor.activeMaterialDescriptor.id)
      : false;
    if (!activeExistsInCategory) {
      editor.activeMaterialDescriptor = materials[0] || null;
    }
  }
  materialLibraryPanel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'material-library-header';
  let activeName = '未选择材质';
  if (editor.activeMaterialArray && editor.activeMaterialArray.length > 0) {
    activeName = `已吸取材质数组 (${editor.activeMaterialArray.length}个材质)`;
  } else if (editor.activeMaterialDescriptor) {
    activeName = getActiveMaterialDisplayName(editor.activeMaterialDescriptor);
  }
  header.innerHTML = `<strong>${activeName}</strong>`;
  materialLibraryPanel.appendChild(header);

  // 如果是发光材质分类，添加自定义取色器卡片
  if (category === 'emissive') {
    const customEmissiveContainer = document.createElement('div');
    customEmissiveContainer.className = 'custom-emissive-container';
    customEmissiveContainer.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 8px 0; padding: 10px; background: rgba(42, 65, 92, 0.04); border-radius: 6px; border: 1px solid rgba(42, 65, 92, 0.12);';

    const textWrapper = document.createElement('div');
    textWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

    const label = document.createElement('span');
    label.textContent = '自定义发光颜色';
    label.style.cssText = 'font-size: 13px; font-weight: 500; color: #172033;';

    textWrapper.appendChild(label);

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.id = 'emissive-color-picker';

    const customEmissive = editor.materialLibrary.find(m => m.id && m.id.startsWith('emissive-custom'));
    picker.value = customEmissive ? customEmissive.color : '#ffffff';
    picker.style.cssText = 'border: 1px solid rgba(42, 65, 92, 0.16); background: none; width: 44px; height: 28px; cursor: pointer; padding: 0; border-radius: 4px; overflow: hidden;';

    const handleColorChange = (color) => {
      const customDesc = {
        id: `emissive-custom-${color.replace('#', '')}`,
        name: `自定义发光 (${color})`,
        category: 'emissive',
        kind: 'emissive',
        color: color
      };

      const existingIdx = editor.materialLibrary.findIndex(m => m.id && m.id.startsWith('emissive-custom'));
      if (existingIdx >= 0) {
        const newLib = [...editor.materialLibrary];
        newLib[existingIdx] = customDesc;
        editor.materialLibrary = newLib;
      } else {
        editor.materialLibrary = [...editor.materialLibrary, customDesc];
      }

      editor.activeMaterialDescriptor = customDesc;
      editor.activeMaterialArray = null; // 清除全量数组
      renderMaterialLibrary();
      ctx.updateEditor();
    };

    picker.addEventListener('change', (e) => {
      handleColorChange(e.target.value);
    });

    customEmissiveContainer.appendChild(textWrapper);
    customEmissiveContainer.appendChild(picker);
    materialLibraryPanel.appendChild(customEmissiveContainer);
  }

  const grid = document.createElement('div');
  grid.className = 'material-grid';

  // 仅在非发光分类下，动态创建并插入第一个“+”号上传材质方格
  if (category !== 'emissive') {
    const uploadButton = document.createElement('button');
    uploadButton.type = 'button';
    uploadButton.className = 'material-swatch upload-swatch';
    uploadButton.title = '上传自定义材质';
    uploadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
    uploadButton.addEventListener('click', () => {
      document.getElementById('material-upload').click();
    });
    grid.appendChild(uploadButton);
  }

  materials.forEach((material) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `material-swatch ${editor.activeMaterialDescriptor?.id === material.id ? 'active' : ''}`;
    button.title = material.name;
    applySwatchStyle(button, material);
    button.addEventListener('click', () => {
      editor.activeMaterialDescriptor = material;
      editor.activeMaterialArray = null; // 清除全量数组
      renderMaterialLibrary();
      ctx.updateEditor();
    });
    grid.appendChild(button);
  });
  materialLibraryPanel.appendChild(grid);

  const activeTextureMaterial = editor.activeMaterialArray?.length
    ? null
    : (isTextureMaterial(editor.activeMaterialDescriptor) ? editor.activeMaterialDescriptor : null);

  if (activeTextureMaterial && activeTextureMaterial.category === category) {
    const tintPanel = document.createElement('div');
    tintPanel.className = 'custom-emissive-container';
    tintPanel.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 12px 0 0; padding: 4px 10px; background: rgba(42, 65, 92, 0.04); border-radius: 6px; border: 1px solid rgba(42, 65, 92, 0.12);';

    const textWrapper = document.createElement('div');
    textWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

    const label = document.createElement('span');
    label.textContent = '纹理颜色';
    label.style.cssText = 'font-size: 13px; font-weight: 500; color: #172033;';

    const hint = document.createElement('span');
    // hint.textContent = '保留纹理细节，颜色可自由调整';
    // hint.style.cssText = 'font-size: 11px; color: #66758f;';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = activeTextureMaterial.color || '#ffffff';
    picker.style.cssText = 'border: none;background: none; width: 44px; height: 28px; cursor: pointer; padding: 0; overflow: hidden;';
    // picker.style.cssText = 'border: 1px solid rgba(42, 65, 92, 0.16); background: none; width: 44px; height: 28px; cursor: pointer; padding: 0; border-radius: 4px; overflow: hidden;';

    picker.addEventListener('change', (event) => {
      const tintedDescriptor = createTintedTextureDescriptor(activeTextureMaterial, event.target.value);
      upsertMaterialDescriptor(tintedDescriptor);
      editor.activeMaterialDescriptor = tintedDescriptor;
      editor.activeMaterialArray = null;
      renderMaterialLibrary();
      ctx.updateEditor();
    });

    textWrapper.append(label, hint);
    tintPanel.append(textWrapper, picker);
    materialLibraryPanel.appendChild(tintPanel);
  }

  // 当选中了自定义材质时，在列表下方渲染编辑与删除面板
  const isCustomMaterial = editor.activeMaterialDescriptor && editor.activeMaterialDescriptor.id && String(editor.activeMaterialDescriptor.id).startsWith('custom_');
  if (isCustomMaterial && category === 'custom') {
    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'field';
    fieldLabel.style.marginTop = '12px';

    const span = document.createElement('span');
    span.textContent = '材质名称';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = editor.activeMaterialDescriptor.name || '';

    const handleSaveName = () => {
      const newName = input.value.trim();
      if (!newName) return;
      
      // 更新当前选中的材质名
      editor.activeMaterialDescriptor.name = newName;
      
      // 更新库中对应项 of name
      const foundInLib = editor.materialLibrary.find(m => m.id === editor.activeMaterialDescriptor.id);
      if (foundInLib) {
        foundInLib.name = newName;
      }
      
      ctx.pushHistory();
      renderMaterialLibrary();
      ctx.updateEditor();
    };

    input.addEventListener('change', handleSaveName);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });

    fieldLabel.appendChild(span);
    fieldLabel.appendChild(input);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'danger';
    deleteBtn.textContent = '删除材质';
    deleteBtn.style.width = '100%';
    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = await ctx.showCustomConfirm('删除材质', `确定要删除自定义材质「${editor.activeMaterialDescriptor.name}」吗？`);
      if (confirmDelete) {
        removeCustomMaterialFromLocalStorage(editor.activeMaterialDescriptor.id);
        editor.materialLibrary = editor.materialLibrary.filter(m => m.id !== editor.activeMaterialDescriptor.id);
        
        const remainingCustom = editor.materialLibrary.filter(m => m.category === 'custom');
        editor.activeMaterialDescriptor = remainingCustom[0] || null;
        
        ctx.pushHistory();
        renderMaterialLibrary();
        ctx.updateEditor();
      }
    });

    materialLibraryPanel.appendChild(fieldLabel);
    materialLibraryPanel.appendChild(deleteBtn);
  }
}

export function updateComponentMaterial(type, id, part, material, rebuild = true) {
  if (!id || !material) return;
  if (isTargetLocked({ type, id })) {
    ctx.showToast('该物体已锁定');
    return;
  }
  ctx.pushHistory();

  let defaultColor = '#ffffff';
  if (type === 'wall') {
    defaultColor = '#f9fbff';
  } else if (type === 'stairs') {
    defaultColor = '#d8c0a0';
  } else if (type === 'roof') {
    defaultColor = '#b75b54';
  } else if (type === 'fence' || type === 'fence_gate') {
    const item = type === 'fence' ? ctx.testMap.getEntity('fence', id) : ctx.testMap.getEntity('fence_gate', id);
    const subtype = item ? item.subtype : 'picket_wood';
    const defaults = FENCE_SUBTYPE_DEFAULTS[subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
    if (part === 'frame') {
      defaultColor = defaults.frameColor || defaults.color;
    } else if (part === 'panel') {
      defaultColor = defaults.panelColor || defaults.color;
    } else {
      defaultColor = defaults.color;
    }
  }

  const color = typeof material === 'string' ? material : (material.color || defaultColor);
  const matVal = typeof material === 'string' ? material : {
    ...material,
    src: material.src || material.url,
    color: color
  };

  let patch = {};
  if (type === 'wall') {
    if (part === 'front') {
      patch = buildWallSurfacePatch('front', 'main', matVal, color);
    } else if (part === 'back') {
      patch = buildWallSurfacePatch('back', 'main', matVal, color);
    } else if (part === 'front-baseboard') {
      patch = buildWallSurfacePatch('front', 'baseboard', matVal, color);
    } else if (part === 'back-baseboard') {
      patch = buildWallSurfacePatch('back', 'baseboard', matVal, color);
    } else if (part === 'front-wainscot') {
      patch = buildWallSurfacePatch('front', 'wainscot', matVal, color);
    } else if (part === 'back-wainscot') {
      patch = buildWallSurfacePatch('back', 'wainscot', matVal, color);
    } else {
      patch = { material: matVal, color: color };
    }
    ctx.testMap.executeCommand('updateWall', { wallId: id, patch, rebuild });
  } else if (type === 'stairs') {
    if (part === 'top') {
      patch = { material: matVal, color: color };
    } else if (part === 'side') {
      patch = { sideMaterial: matVal, sideColor: color };
    }
    ctx.testMap.executeCommand('updateStairs', { stairsId: id, patch, rebuild });
  } else if (type === 'roof') {
    if (part === 'top') {
      patch = { material: matVal, color: color };
    } else if (part === 'side') {
      patch = { sideMaterial: matVal, sideColor: color };
    } else if (part === 'bottom') {
      patch = { bottomMaterial: matVal, bottomColor: color };
    }
    ctx.testMap.executeCommand('updateRoof', { roofId: id, patch, rebuild });
  } else if (type === 'fence') {
    if (part === 'frame') {
      patch = { frameMaterial: matVal, frameColor: color };
    } else if (part === 'panel') {
      patch = { panelMaterial: matVal, panelColor: color };
    } else {
      patch = {
        material: matVal,
        color: color,
        frameMaterial: matVal,
        frameColor: color,
        panelMaterial: matVal,
        panelColor: color
      };
    }
    ctx.testMap.executeCommand('updateFence', { fenceId: id, patch, rebuild });
  } else if (type === 'fence_gate') {
    if (part === 'frame') {
      patch = { frameMaterial: matVal, frameColor: color };
    } else if (part === 'panel') {
      patch = { panelMaterial: matVal, panelColor: color };
    } else {
      patch = {
        frameMaterial: matVal,
        frameColor: color,
        panelMaterial: matVal,
        panelColor: color
      };
    }
    ctx.testMap.executeCommand('updateFenceGate', { gateId: id, patch, rebuild });
  } else if (type === 'opening') {
    if (part === 'frame') {
      patch = { frameMaterial: matVal };
    } else if (part === 'panel') {
      patch = { panelMaterial: matVal };
    } else if (part === 'glass') {
      patch = { glassMaterial: matVal };
    } else {
      patch = {
        material: matVal,
        color: color,
        frameMaterial: matVal,
        panelMaterial: matVal
      };
    }
    ctx.testMap.executeCommand('updateOpening', { openingId: id, patch, rebuild });
  } else if (type === 'room') {
    ctx.testMap.executeCommand('setRoomFloorMaterial', { roomId: id, material });
  }

  ctx.refreshShadows();
  ctx.updateEditor();
  ctx.renderPlan();
}

export function applyMaterialToItemComponent(componentId, material) {
  if (!selection.selectedItemId || !material) return;
  if (isTargetLocked({ type: 'item', id: selection.selectedItemId })) {
    ctx.showToast('该物体已锁定');
    return;
  }
  ctx.entityManager.updateItemComponentMaterial(selection.selectedItemId, componentId, material);
}

// ==========================================
// 统一的取色（吸取）和粉刷逻辑（重构）
// ==========================================

function findMetadataFromNode(node, key) {
  let current = node;
  while (current) {
    if (current.metadata?.[key]) return current.metadata[key];
    current = current.parent;
  }
  return null;
}

function findWallSideFromNode(node) {
  let current = node;
  while (current) {
    if (current.metadata?.side) return current.metadata.side;
    current = current.parent;
  }
  return null;
}

function findWallComponentFromNode(node) {
  let current = node;
  while (current) {
    if (current.metadata?.wallComponent) return current.metadata.wallComponent;
    current = current.parent;
  }
  return 'main';
}

function getWallSurfaceFields(side, component = 'main') {
  return MaterialResolver.getWallSurfaceFields(side, component);
}

function getWallSurfaceValue(wall, side, component = 'main') {
  return MaterialResolver.getWallSurfaceValue(wall, side, component);
}

function buildWallSurfacePatch(side, component, material, color) {
  return MaterialResolver.buildWallSurfacePatch(side, component, material, color);
}

function get2DWallSideFromPoint(wall, point) {
  if (!wall || !point) return null;
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length < 0.01) return null;

  const ux = dx / length;
  const uz = dz / length;
  const nx = -uz;
  const nz = ux;

  const px = point.x !== undefined ? point.x : point[0];
  const pz = point.z !== undefined ? point.z : point[1];

  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;

  const vx = px - mx;
  const vz = pz - mz;

  const dot = vx * nx + vz * nz;
  return dot >= 0 ? 'front' : 'back';
}

function findRoofComponentIdFromNode(node) {
  let current = node;
  while (current) {
    if (current.name) {
      if (current.name.includes('roof_side')) return 'side';
      if (current.name.includes('roof_bottom')) return 'bottom';
      if (current.name.includes('roof_top')) return 'top';
    }
    current = current.parent;
  }
  return null;
}

function getFenceDefaultColor(subtype, componentId) {
  const defaults = FENCE_SUBTYPE_DEFAULTS[subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
  if (componentId === 'frame') return defaults.frameColor;
  if (componentId === 'panel') return defaults.panelColor;
  return defaults.color;
}

function getOpeningDefaultColor(openingType, componentId) {
  if (openingType === 'door') {
    if (componentId === 'frame') return '#b8c4d4'; // trim
    if (componentId === 'panel') return '#8c5a32'; // door
    return '#8c5a32';
  } else {
    // window
    if (componentId === 'frame') return '#b8c4d4'; // trim
    if (componentId === 'glass') return '#75d7ff'; // window
    return '#75d7ff';
  }
}

function tryUpdateToFullMaterial(matOrColor) {
  if (!matOrColor) return null;
  let colorVal = typeof matOrColor === 'string' ? matOrColor : matOrColor.color;
  if (!colorVal) return matOrColor;

  // 1. 如果是对象，且包含明确的高级材质属性 (如 kind 为 metal, mirror, glass, emissive, texture 等)
  if (typeof matOrColor === 'object' && matOrColor.kind && matOrColor.kind !== 'color' && matOrColor.kind !== 'paint') {
    return matOrColor;
  }

  // 2. 尝试从材质库中根据颜色值匹配具有特殊属性的材质定义 (如金属、镜面、发光、玻璃等)
  const foundRich = editor.materialLibrary.find(m => m.color === colorVal && m.kind && m.kind !== 'color' && m.kind !== 'paint');
  if (foundRich) return foundRich;

  // 3. 如果没找到特殊属性材质，则在整个材质库里查找任何匹配项
  const foundAny = editor.materialLibrary.find(m => m.color === colorVal);
  if (foundAny) return foundAny;

  // 4. 仍然找不到 (属于自定义的颜色)，如果是字符串则构建一个默认涂料描述符，是对象则直接返回该对象
  if (typeof matOrColor === 'string') {
    return {
      id: 'paint-' + matOrColor.replace('#', ''),
      name: `吸取颜色 (${matOrColor})`,
      category: 'paint',
      kind: 'paint',
      color: matOrColor
    };
  }
  return matOrColor;
}

export function extractMaterial(target, precise = true) {
  if (!target) return;
  
  if (precise) {
    // 1. 精准吸取
    let pickedMaterial = null;
    let pickedColor = null;

    if (target.type === 'room') {
      const room = ctx.testMap.getEntity('room', target.id);
      if (room) {
        pickedMaterial = room.material;
        pickedColor = room.color;
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getEntity('wall', target.id);
      if (wall) {
        const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
        const component = target.pick ? findWallComponentFromNode(target.pick.pickedMesh) : 'main';
        if (side === 'front' || side === 'back') {
          const surface = getWallSurfaceValue(wall, side, component);
          pickedMaterial = surface.material;
          pickedColor = surface.color;
        } else {
          pickedMaterial = wall.material;
          pickedColor = wall.color;
        }
      }
    } else if (target.type === 'item') {
      const item = ctx.testMap.getEntity('item', target.id);
      if (item) {
        let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
        if (!componentId) {
          const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
          componentId = definition?.components?.[0]?.id;
        }
        if (componentId) {
          pickedMaterial = item.materials?.[componentId];
          pickedColor = item.colors?.[componentId];
          if (!pickedMaterial && !pickedColor) {
            const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
            const component = definition?.components?.find(c => c.id === componentId);
            pickedColor = component?.defaultColor || '#ffffff';
          }
        } else {
          if (item.materials && Object.keys(item.materials).length > 0) {
            pickedMaterial = Object.values(item.materials)[0];
          } else if (item.colors && Object.keys(item.colors).length > 0) {
            pickedColor = Object.values(item.colors)[0];
          }
        }
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getEntity('fence', target.id);
      if (fence) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = fence.frameMaterial || fence.material;
          pickedColor = fence.frameColor || fence.color || getFenceDefaultColor(fence.subtype, 'frame');
        } else if (componentId === 'panel') {
          pickedMaterial = fence.panelMaterial || fence.material;
          pickedColor = fence.panelColor || fence.color || getFenceDefaultColor(fence.subtype, 'panel');
        } else {
          pickedMaterial = fence.material;
          pickedColor = fence.color || getFenceDefaultColor(fence.subtype, 'color');
        }
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getEntity('fence_gate', target.id);
      if (gate) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = gate.frameMaterial || gate.material;
          pickedColor = gate.frameColor || gate.color || getFenceDefaultColor(gate.subtype, 'frame');
        } else if (componentId === 'panel') {
          pickedMaterial = gate.panelMaterial || gate.material;
          pickedColor = gate.panelColor || gate.color || getFenceDefaultColor(gate.subtype, 'panel');
        } else {
          pickedMaterial = gate.material;
          pickedColor = gate.color || getFenceDefaultColor(gate.subtype, 'color');
        }
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getEntity('opening', target.id);
      if (opening) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = opening.frameMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'frame');
        } else if (componentId === 'panel') {
          pickedMaterial = opening.panelMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'panel');
        } else if (componentId === 'glass') {
          pickedMaterial = opening.glassMaterial || opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'glass');
        } else {
          pickedMaterial = opening.material;
          pickedColor = opening.color || getOpeningDefaultColor(opening.type, 'color');
        }
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getEntity('roof', target.id);
      if (roof) {
        const componentId = target.pick ? findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
        if (componentId === 'side') {
          pickedMaterial = roof.sideMaterial || roof.material;
          pickedColor = roof.sideColor || roof.color || '#b75b54';
        } else if (componentId === 'bottom') {
          pickedMaterial = roof.bottomMaterial || roof.material;
          pickedColor = roof.bottomColor || roof.color || '#b75b54';
        } else {
          pickedMaterial = roof.material;
          pickedColor = roof.color || '#b75b54';
        }
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getEntity('stairs', target.id);
      if (stairs) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
        if (componentId === 'side') {
          pickedMaterial = stairs.sideMaterial || stairs.material;
          pickedColor = stairs.sideColor || stairs.color || '#d8c0a0';
        } else {
          pickedMaterial = stairs.material;
          pickedColor = stairs.color || '#d8c0a0';
        }
      }
    }

    if (pickedMaterial || pickedColor) {
      editor.activeMaterialDescriptor = tryUpdateToFullMaterial(pickedMaterial || pickedColor);
      editor.activeMaterialArray = null; // 清除全量数组
      const displayName = getActiveMaterialDisplayName(editor.activeMaterialDescriptor);
      ctx.showToast(`已吸取材质: ${displayName}`);

      // 自动同步材质分类下拉框的值并避免被重置为默认值
      const catSelect = document.getElementById('material-category');
      if (catSelect && editor.activeMaterialDescriptor.category && catSelect.value !== editor.activeMaterialDescriptor.category) {
        window.isProgrammaticMaterialCategoryChange = true;
        catSelect.value = editor.activeMaterialDescriptor.category;
        catSelect.dispatchEvent(new Event('change'));
        window.isProgrammaticMaterialCategoryChange = false;
      } else {
        renderMaterialLibrary();
      }

      ctx.updateEditor();
      ctx.setDesignMode('brush', false);
    } else {
      ctx.showToast('未找到该物体的材质');
      ctx.setDesignMode('select');
    }
  } else {
    // 2. 全量吸取（右键/长按菜单吸取）
    let materialsArray = [];
    materialsArray.sourceType = target.type;

    if (target.type === 'room') {
      const room = ctx.testMap.getEntity('room', target.id);
      if (room) {
        const rawMat = room.material || null;
        const rawCol = room.color || '#ffffff';
        materialsArray.push({
          componentId: 'floor',
          material: tryUpdateToFullMaterial(rawMat || rawCol),
          color: rawCol
        });
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getEntity('wall', target.id);
      if (wall) {
        const frontMain = getWallSurfaceValue(wall, 'front', 'main');
        const backMain = getWallSurfaceValue(wall, 'back', 'main');
        materialsArray.push({
          componentId: 'front',
          material: tryUpdateToFullMaterial(frontMain.material || frontMain.color),
          color: frontMain.color
        });
        materialsArray.push({
          componentId: 'back',
          material: tryUpdateToFullMaterial(backMain.material || backMain.color),
          color: backMain.color
        });
        if (wall.baseboardEnabled) {
          const frontBaseboard = getWallSurfaceValue(wall, 'front', 'baseboard');
          const backBaseboard = getWallSurfaceValue(wall, 'back', 'baseboard');
          materialsArray.push({
            componentId: 'front-baseboard',
            material: tryUpdateToFullMaterial(frontBaseboard.material || frontBaseboard.color),
            color: frontBaseboard.color
          });
          materialsArray.push({
            componentId: 'back-baseboard',
            material: tryUpdateToFullMaterial(backBaseboard.material || backBaseboard.color),
            color: backBaseboard.color
          });
        }
        if (wall.wainscotEnabled) {
          const frontWainscot = getWallSurfaceValue(wall, 'front', 'wainscot');
          const backWainscot = getWallSurfaceValue(wall, 'back', 'wainscot');
          materialsArray.push({
            componentId: 'front-wainscot',
            material: tryUpdateToFullMaterial(frontWainscot.material || frontWainscot.color),
            color: frontWainscot.color
          });
          materialsArray.push({
            componentId: 'back-wainscot',
            material: tryUpdateToFullMaterial(backWainscot.material || backWainscot.color),
            color: backWainscot.color
          });
        }
      }
    } else if (target.type === 'item') {
      const item = ctx.testMap.getEntity('item', target.id);
      if (item) {
        materialsArray.sourceItemType = item.type;
        const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
        if (definition && definition.components) {
          definition.components.forEach(comp => {
            const rawMat = item.materials?.[comp.id] || null;
            const rawCol = item.colors?.[comp.id] || comp.defaultColor || '#ffffff';
            materialsArray.push({
              componentId: comp.id,
              material: tryUpdateToFullMaterial(rawMat || rawCol),
              color: rawCol
            });
          });
        } else {
          const matKeys = Object.keys(item.materials || {});
          const colKeys = Object.keys(item.colors || {});
          const allKeys = Array.from(new Set([...matKeys, ...colKeys]));
          allKeys.forEach(k => {
            const rawMat = item.materials?.[k] || null;
            const rawCol = item.colors?.[k] || '#ffffff';
            materialsArray.push({
              componentId: k,
              material: tryUpdateToFullMaterial(rawMat || rawCol),
              color: rawCol
            });
          });
        }
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getEntity('fence', target.id);
      if (fence) {
        const rawMatFrame = fence.frameMaterial || fence.material || null;
        const rawColFrame = fence.frameColor || fence.color || getFenceDefaultColor(fence.subtype, 'frame');
        const rawMatPanel = fence.panelMaterial || fence.material || null;
        const rawColPanel = fence.panelColor || fence.color || getFenceDefaultColor(fence.subtype, 'panel');
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
        materialsArray.push({
          componentId: 'panel',
          material: tryUpdateToFullMaterial(rawMatPanel || rawColPanel),
          color: rawColPanel
        });
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getEntity('fence_gate', target.id);
      if (gate) {
        const rawMatFrame = gate.frameMaterial || gate.material || null;
        const rawColFrame = gate.frameColor || gate.color || getFenceDefaultColor(gate.subtype, 'frame');
        const rawMatPanel = gate.panelMaterial || gate.material || null;
        const rawColPanel = gate.panelColor || gate.color || getFenceDefaultColor(gate.subtype, 'panel');
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
        materialsArray.push({
          componentId: 'panel',
          material: tryUpdateToFullMaterial(rawMatPanel || rawColPanel),
          color: rawColPanel
        });
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getEntity('opening', target.id);
      if (opening) {
        const rawMatFrame = opening.frameMaterial || opening.material || null;
        const rawColFrame = opening.color || getOpeningDefaultColor(opening.type, 'frame');
        const rawMatPanel = opening.panelMaterial || opening.material || null;
        const rawColPanel = opening.color || getOpeningDefaultColor(opening.type, 'panel');
        const rawMatGlass = opening.glassMaterial || opening.material || null;
        const rawColGlass = opening.color || getOpeningDefaultColor(opening.type, 'glass');
        materialsArray.push({
          componentId: 'frame',
          material: tryUpdateToFullMaterial(rawMatFrame || rawColFrame),
          color: rawColFrame
        });
        materialsArray.push({
          componentId: 'panel',
          material: tryUpdateToFullMaterial(rawMatPanel || rawColPanel),
          color: rawColPanel
        });
        materialsArray.push({
          componentId: 'glass',
          material: tryUpdateToFullMaterial(rawMatGlass || rawColGlass),
          color: rawColGlass
        });
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getEntity('roof', target.id);
      if (roof) {
        const rawMatTop = roof.material || null;
        const rawColTop = roof.color || '#b75b54';
        const rawMatSide = roof.sideMaterial || null;
        const rawColSide = roof.sideColor || '#b75b54';
        const rawMatBottom = roof.bottomMaterial || null;
        const rawColBottom = roof.bottomColor || '#b75b54';
        materialsArray.push({
          componentId: 'top',
          material: tryUpdateToFullMaterial(rawMatTop || rawColTop),
          color: rawColTop
        });
        materialsArray.push({
          componentId: 'side',
          material: tryUpdateToFullMaterial(rawMatSide || rawColSide),
          color: rawColSide
        });
        materialsArray.push({
          componentId: 'bottom',
          material: tryUpdateToFullMaterial(rawMatBottom || rawColBottom),
          color: rawColBottom
        });
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getEntity('stairs', target.id);
      if (stairs) {
        const rawMatTop = stairs.material || null;
        const rawColTop = stairs.color || '#d8c0a0';
        const rawMatSide = stairs.sideMaterial || null;
        const rawColSide = stairs.sideColor || '#d8c0a0';
        materialsArray.push({
          componentId: 'top',
          material: tryUpdateToFullMaterial(rawMatTop || rawColTop),
          color: rawColTop
        });
        materialsArray.push({
          componentId: 'side',
          material: tryUpdateToFullMaterial(rawMatSide || rawColSide),
          color: rawColSide
        });
      }
    }

    if (materialsArray.length > 0) {
      editor.activeMaterialArray = materialsArray;
      editor.activeMaterialDescriptor = null; // 清除单材质描述符
      ctx.showToast('已提取物体材质数组，进入涂刷模式');
      renderMaterialLibrary();
      ctx.updateEditor();
      ctx.setDesignMode('brush', false);
    } else {
      ctx.showToast('该物体没有可用的材质');
    }
  }
}

export function applyMaterial(target, designMode) {
  if (!target) return;
  if (isTargetLocked(target)) {
    ctx.showToast('该物体已锁定');
    return;
  }

  const isArrayMode = !!(editor.activeMaterialArray && editor.activeMaterialArray.length > 0);
  const activeMaterialDescriptor = editor.activeMaterialDescriptor;
  const activeMaterialArray = editor.activeMaterialArray;

  if (!isArrayMode && !activeMaterialDescriptor) {
    ctx.showToast('请先选择一个材质或吸取材质');
    return;
  }

  // 1. 刷子模式 (brush)
  if (designMode === 'brush') {
    if (isArrayMode) {
      // 1.1 材质数组 -> 按家具/建筑组件粉刷（全量粉刷）
      ctx.pushHistory();

      if (target.type === 'item') {
        const targetItem = ctx.testMap.getEntity('item', target.id);
        if (targetItem) {
          const definition = ctx.testMap.getFurnitureDefinition?.(targetItem.type);
          const targetComponents = definition?.components || [];
          targetItem.materials ||= {};
          targetItem.colors ||= {};

          // 判断是否同类或组件ID匹配
          const targetCompIds = new Set(targetComponents.map(c => c.id));
          const hasAnyMatchingId = activeMaterialArray.some(entry => targetCompIds.has(entry.componentId));

          if (hasAnyMatchingId && targetItem.type === activeMaterialArray.sourceItemType) {
            // 同类精准按 componentId 匹配更新
            activeMaterialArray.forEach(entry => {
              if (targetCompIds.has(entry.componentId)) {
                if (entry.material) {
                  targetItem.materials[entry.componentId] = entry.material;
                } else {
                  delete targetItem.materials[entry.componentId];
                }
                if (entry.color) {
                  targetItem.colors[entry.componentId] = entry.color;
                }
              }
            });
          } else {
            // 不同类或无法精准映射组件，按组件顺序循环应用
            targetComponents.forEach((comp, index) => {
              const srcEntry = activeMaterialArray[index % activeMaterialArray.length];
              if (srcEntry.material) {
                targetItem.materials[comp.id] = srcEntry.material;
              } else {
                delete targetItem.materials[comp.id];
              }
              if (srcEntry.color) {
                targetItem.colors[comp.id] = srcEntry.color;
              }
            });
          }

          ctx.testMap.updateItem(target.id, { materials: targetItem.materials, colors: targetItem.colors });
        }
      } else if (target.type === 'room') {
        ctx.testMap.setRoomFloorMaterial(target.id, activeMaterialArray[0].material);
      } else if (target.type === 'wall') {
        // 墙全量粉刷
        const frontEntry = activeMaterialArray.find(e => e.componentId === 'front') || activeMaterialArray[0];
        const wall = ctx.testMap.getEntity('wall', target.id);
        if (wall) {
          const backEntry = activeMaterialArray.find(e => e.componentId === 'back') || activeMaterialArray[1] || frontEntry;
          const patch = {
            ...buildWallSurfacePatch('front', 'main', frontEntry.material, frontEntry.color),
            ...buildWallSurfacePatch('back', 'main', backEntry.material, backEntry.color)
          };

          const hasBaseboardEntry = activeMaterialArray.some(e => e.componentId === 'front-baseboard' || e.componentId === 'back-baseboard');
          if (wall.baseboardEnabled || hasBaseboardEntry) {
            if (hasBaseboardEntry) {
              patch.baseboardEnabled = true;
            }
            const frontBaseboard = activeMaterialArray.find(e => e.componentId === 'front-baseboard') || frontEntry;
            const backBaseboard = activeMaterialArray.find(e => e.componentId === 'back-baseboard') || backEntry;
            Object.assign(
              patch,
              buildWallSurfacePatch('front', 'baseboard', frontBaseboard.material, frontBaseboard.color),
              buildWallSurfacePatch('back', 'baseboard', backBaseboard.material, backBaseboard.color)
            );
          }

          const hasWainscotEntry = activeMaterialArray.some(e => e.componentId === 'front-wainscot' || e.componentId === 'back-wainscot');
          if (wall.wainscotEnabled || hasWainscotEntry) {
            if (hasWainscotEntry) {
              patch.wainscotEnabled = true;
            }
            const frontWainscot = activeMaterialArray.find(e => e.componentId === 'front-wainscot') || frontEntry;
            const backWainscot = activeMaterialArray.find(e => e.componentId === 'back-wainscot') || backEntry;
            Object.assign(
              patch,
              buildWallSurfacePatch('front', 'wainscot', frontWainscot.material, frontWainscot.color),
              buildWallSurfacePatch('back', 'wainscot', backWainscot.material, backWainscot.color)
            );
          }

          ctx.testMap.updateWall(target.id, patch);
        }
      } else if (target.type === 'fence') {
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame') || activeMaterialArray[0];
        const panelEntry = activeMaterialArray.find(e => e.componentId === 'panel') || activeMaterialArray[1] || frameEntry;
        
        ctx.testMap.updateFence(target.id, {
          frameMaterial: frameEntry.material,
          frameColor: frameEntry.color,
          panelMaterial: panelEntry.material,
          panelColor: panelEntry.color,
          material: frameEntry.material || panelEntry.material || null,
          color: frameEntry.color || panelEntry.color || '#ffffff'
        });
      } else if (target.type === 'fence_gate') {
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame') || activeMaterialArray[0];
        const panelEntry = activeMaterialArray.find(e => e.componentId === 'panel') || activeMaterialArray[1] || frameEntry;
        
        ctx.testMap.updateFenceGate(target.id, {
          frameMaterial: frameEntry.material,
          frameColor: frameEntry.color,
          panelMaterial: panelEntry.material,
          panelColor: panelEntry.color
        });
      } else if (target.type === 'opening') {
        const frameEntry = activeMaterialArray.find(e => e.componentId === 'frame') || activeMaterialArray[0];
        const panelEntry = activeMaterialArray.find(e => e.componentId === 'panel') || activeMaterialArray[1] || frameEntry;
        const glassEntry = activeMaterialArray.find(e => e.componentId === 'glass') || activeMaterialArray[2] || panelEntry;
        
        ctx.testMap.updateOpening(target.id, {
          frameMaterial: frameEntry.material,
          panelMaterial: panelEntry.material,
          glassMaterial: glassEntry.material,
          material: frameEntry.material || panelEntry.material || null,
          color: frameEntry.color || panelEntry.color || '#ffffff'
        });
      } else if (target.type === 'roof') {
        const topEntry = activeMaterialArray.find(e => e.componentId === 'top') || activeMaterialArray[0];
        const sideEntry = activeMaterialArray.find(e => e.componentId === 'side') || activeMaterialArray[1] || topEntry;
        const bottomEntry = activeMaterialArray.find(e => e.componentId === 'bottom') || activeMaterialArray[2] || sideEntry;
        
        ctx.testMap.updateRoof(target.id, {
          material: topEntry.material,
          color: topEntry.color,
          sideMaterial: sideEntry.material,
          sideColor: sideEntry.color,
          bottomMaterial: bottomEntry.material,
          bottomColor: bottomEntry.color
        });
      } else if (target.type === 'stairs') {
        const topEntry = activeMaterialArray.find(e => e.componentId === 'top') || activeMaterialArray[0];
        const sideEntry = activeMaterialArray.find(e => e.componentId === 'side') || activeMaterialArray[1] || topEntry;
        
        ctx.testMap.updateStairs(target.id, {
          material: topEntry.material,
          color: topEntry.color,
          sideMaterial: sideEntry.material,
          sideColor: sideEntry.color
        });
      }

      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
    } else {
      // 1.2 单一材质 -> 精准粉刷（只应用到点击的子组件）
      if (target.type === 'room') {
        ctx.pushHistory();
        ctx.testMap.setRoomFloorMaterial(target.id, activeMaterialDescriptor);
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      } else if (target.type === 'wall') {
        const wall = ctx.testMap.getEntity('wall', target.id);
        if (wall) {
          const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
          const component = target.pick ? findWallComponentFromNode(target.pick.pickedMesh) : 'main';
          if (side === 'front') {
            updateComponentMaterial('wall', target.id, component === 'main' ? 'front' : `front-${component}`, activeMaterialDescriptor);
          } else if (side === 'back') {
            updateComponentMaterial('wall', target.id, component === 'main' ? 'back' : `back-${component}`, activeMaterialDescriptor);
          } else {
            updateComponentMaterial('wall', target.id, 'all', activeMaterialDescriptor);
          }
        }
      } else if (target.type === 'item') {
        const item = ctx.testMap.getEntity('item', target.id);
        let componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFurnitureComponentId') : null;
        if (!componentId && item) {
          const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
          componentId = definition?.components?.[0]?.id;
        }
        if (componentId) {
          ctx.pushHistory();
          const oldId = selection.selectedItemId;
          selection.selectedItemId = target.id;
          ctx.syncLocalToStore?.();
          applyMaterialToItemComponent(componentId, activeMaterialDescriptor);
          selection.selectedItemId = oldId;
          ctx.syncLocalToStore?.();
          ctx.refreshShadows();
          ctx.updateEditor();
          ctx.renderPlan();
        } else {
          ctx.showToast('无法确定点击的家具组件');
        }
      } else if (target.type === 'fence') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          updateComponentMaterial('fence', target.id, 'frame', activeMaterialDescriptor);
        } else if (componentId === 'panel') {
          updateComponentMaterial('fence', target.id, 'panel', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('fence', target.id, 'all', activeMaterialDescriptor);
        }
      } else if (target.type === 'fence_gate') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          updateComponentMaterial('fence_gate', target.id, 'frame', activeMaterialDescriptor);
        } else if (componentId === 'panel') {
          updateComponentMaterial('fence_gate', target.id, 'panel', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('fence_gate', target.id, 'all', activeMaterialDescriptor);
        }
      } else if (target.type === 'opening') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
        if (componentId === 'frame') {
          updateComponentMaterial('opening', target.id, 'frame', activeMaterialDescriptor);
        } else if (componentId === 'panel') {
          updateComponentMaterial('opening', target.id, 'panel', activeMaterialDescriptor);
        } else if (componentId === 'glass') {
          updateComponentMaterial('opening', target.id, 'glass', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('opening', target.id, 'all', activeMaterialDescriptor);
        }
      } else if (target.type === 'roof') {
        const componentId = target.pick ? findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
        if (componentId === 'side') {
          updateComponentMaterial('roof', target.id, 'side', activeMaterialDescriptor);
        } else if (componentId === 'bottom') {
          updateComponentMaterial('roof', target.id, 'bottom', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('roof', target.id, 'top', activeMaterialDescriptor);
        }
      } else if (target.type === 'stairs') {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
        if (componentId === 'side') {
          updateComponentMaterial('stairs', target.id, 'side', activeMaterialDescriptor);
        } else {
          updateComponentMaterial('stairs', target.id, 'top', activeMaterialDescriptor);
        }
      }
    }
  }
  else if (designMode === 'bucket') {
    if (target.type === 'room') {
      if (activeMaterialDescriptor || isArrayMode) {
        ctx.pushHistory();
        const material = isArrayMode ? activeMaterialArray[0].material : activeMaterialDescriptor;
        ctx.testMap.setRoomFloorMaterial(target.id, material);
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      } else {
        ctx.showToast('请在面板中选择新材质以修改地板材质');
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getEntity('wall', target.id);
      if (!wall) return;
      const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
      if (!side) return;
      const component = target.pick ? findWallComponentFromNode(target.pick.pickedMesh) : 'main';

      // 提取当前墙面这一侧的现有材质和颜色
      const srcMaterial = side === 'front' 
        ? (wall.materialFront !== undefined && wall.materialFront !== null ? wall.materialFront : wall.material) 
        : (wall.materialBack !== undefined && wall.materialBack !== null ? wall.materialBack : wall.material);
      const srcColor = side === 'front'
        ? (wall.colorFront !== undefined && wall.colorFront !== null ? wall.colorFront : wall.color)
        : (wall.colorBack !== undefined && wall.colorBack !== null ? wall.colorBack : wall.color);
      const wallSurface = getWallSurfaceValue(wall, side, component);
      const srcWallMaterial = wallSurface.material;
      const srcWallColor = wallSurface.color;

      // 定位当前点击所朝向的房间
      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length < 0.01) return;

      const ux = dx / length;
      const uz = dz / length;
      const nx = -uz;
      const nz = ux;

      const offsetMultiplier = side === 'front' ? 0.15 : -0.15;
      const checkX = (x1 + x2) / 2 + offsetMultiplier * nx;
      const checkZ = (z1 + z2) / 2 + offsetMultiplier * nz;

      const room = ctx.testMap.getRoomAt(checkX, checkZ);
      if (!room) {
        // 如果点击的朝向没有房间（属于室外侧），仅涂当前这堵墙的这一侧
        ctx.pushHistory();
        ctx.testMap.updateWall(wall.id, buildWallSurfacePatch(side, component, srcWallMaterial, srcWallColor));
        ctx.showToast('已更新当前墙面（室外侧不进行批量同步）');
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
        return;
      }

      ctx.pushHistory();
      const roomWallIds = Object.values(room.wallIds || {});
      let count = 0;
      roomWallIds.forEach(wallId => {
        const w = ctx.testMap.getEntity('wall', wallId);
        if (!w || w.locked) return;

        const [wx1, wz1] = w.from;
        const [wx2, wz2] = w.to;
        const wdx = wx2 - wx1;
        const wdz = wz2 - wz1;
        const wlen = Math.sqrt(wdx * wdx + wdx * wdx); // 仅做防错，重新算
        const realLen = Math.sqrt(wdx * wdx + wdz * wdz);
        if (realLen < 0.01) return;

        const wux = wdx / realLen;
        const wuz = wdz / realLen;
        const wnx = -wuz;
        const wnz = wux;

        const fX = (wx1 + wx2) / 2 + 0.1 * wnx;
        const fZ = (wz1 + wz2) / 2 + 0.1 * wnz;
        const bX = (wx1 + wx2) / 2 - 0.1 * wnx;
        const bZ = (wz1 + wz2) / 2 - 0.1 * wnz;

        const roomF = ctx.testMap.getRoomAt(fX, fZ);
        const roomB = ctx.testMap.getRoomAt(bX, bZ);

        const isF = roomF && roomF.id === room.id;
        const isB = roomB && roomB.id === room.id;

        if (isF) {
          ctx.testMap.updateWall(w.id, buildWallSurfacePatch('front', component, srcWallMaterial, srcWallColor));
          count++;
        } else if (isB) {
          ctx.testMap.updateWall(w.id, buildWallSurfacePatch('back', component, srcWallMaterial, srcWallColor));
          count++;
        } else if (component === 'main') {
          ctx.testMap.updateWall(w.id, { material: srcMaterial, color: srcColor });
          count++;
        }
      });

      ctx.showToast(`已将该墙面的材质应用到房间内其他 ${count} 面墙上`);
      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
    } else if (target.type === 'item') {
      const updatedItem = ctx.testMap.getEntity('item', target.id);
      if (updatedItem) {
        ctx.pushHistory();
        if (ctx.testMap.refreshItemRoomLinks) {
          ctx.testMap.refreshItemRoomLinks();
        }
        const currentRoomId = updatedItem.roomId;

        const items = ctx.testMap.getEntities('item');
        let count = 0;
        items.forEach(it => {
          const isSameRoom = (currentRoomId && it.roomId === currentRoomId) || (!currentRoomId && !it.roomId);
          if (it.type === updatedItem.type && isSameRoom && it.id !== updatedItem.id && !isTargetLocked({ type: 'item', id: it.id })) {
            it.materials = JSON.parse(JSON.stringify(updatedItem.materials || {}));
            it.colors = JSON.parse(JSON.stringify(updatedItem.colors || {}));
            ctx.testMap.updateItem(it.id, { materials: it.materials, colors: it.colors });
            count++;
          }
        });

        if (currentRoomId) {
          ctx.showToast(`已将该家具的材质应用到房间内其他 ${count} 个相同家具上`);
        } else {
          ctx.showToast(`已将该室外家具的材质应用到同层室外其他 ${count} 个相同家具上`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getEntity('fence', target.id);
      if (fence) {
        ctx.pushHistory();

        // 实时计算被点击 fence 的空间房间归属
        let fenceRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) fenceRoomId = room.id;
        } else {
          const mx = (fence.from[0] + fence.to[0]) / 2;
          const mz = (fence.from[1] + fence.to[1]) / 2;
          const room = ctx.testMap.getRoomAt(mx, mz);
          if (room) fenceRoomId = room.id;
        }

        const fences = ctx.testMap.getEntities('fence');
        let count = 0;
        fences.forEach(f => {
          if (f.floorId === fence.floorId && f.subtype === fence.subtype && f.id !== fence.id && !isTargetLocked({ type: 'fence', id: f.id })) {
            const fmx = (f.from[0] + f.to[0]) / 2;
            const fmz = (f.from[1] + f.to[1]) / 2;
            const fRoom = ctx.testMap.getRoomAt(fmx, fmz);
            const fRoomId = fRoom ? fRoom.id : null;

            const isSameRoom = (fenceRoomId && fRoomId === fenceRoomId) || (!fenceRoomId && !fRoomId);
            if (isSameRoom) {
              ctx.testMap.updateFence(f.id, {
                material: fence.material,
                color: fence.color,
                frameMaterial: fence.frameMaterial,
                frameColor: fence.frameColor,
                panelMaterial: fence.panelMaterial,
                panelColor: fence.panelColor
              });
              count++;
            }
          }
        });

        if (fenceRoomId) {
          ctx.showToast(`已将该栏杆的材质应用到房间内其他 ${count} 个相同栏杆上`);
        } else {
          ctx.showToast(`已将该栏杆的材质应用到同层室外其他 ${count} 个相同栏杆上`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getEntity('fence_gate', target.id);
      if (gate) {
        ctx.pushHistory();

        // 实时计算被点击 gate 的空间房间归属
        let gateRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) gateRoomId = room.id;
        } else {
          const gmx = (gate.from[0] + gate.to[0]) / 2;
          const gmz = (gate.from[1] + gate.to[1]) / 2;
          const room = ctx.testMap.getRoomAt(gmx, gmz);
          if (room) gateRoomId = room.id;
        }

        const gates = ctx.testMap.getEntities('fence_gate');
        let count = 0;
        gates.forEach(g => {
          if (g.floorId === gate.floorId && g.subtype === gate.subtype && g.id !== gate.id && !isTargetLocked({ type: 'fence_gate', id: g.id })) {
            const gmx = (g.from[0] + g.to[0]) / 2;
            const gmz = (g.from[1] + g.to[1]) / 2;
            const gRoom = ctx.testMap.getRoomAt(gmx, gmz);
            const gRoomId = gRoom ? gRoom.id : null;

            const isSameRoom = (gateRoomId && gRoomId === gateRoomId) || (!gateRoomId && !gRoomId);
            if (isSameRoom) {
              ctx.testMap.updateFenceGate(g.id, {
                frameMaterial: gate.frameMaterial,
                frameColor: gate.frameColor,
                panelMaterial: gate.panelMaterial,
                panelColor: gate.panelColor
              });
              count++;
            }
          }
        });

        if (gateRoomId) {
          ctx.showToast(`已将该栏杆门的材质应用到房间内其他 ${count} 个相同栏杆门上`);
        } else {
          ctx.showToast(`已将该栏杆门的材质应用到同层室外其他 ${count} 个相同栏杆门上`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getEntity('opening', target.id);
      if (opening) {
        ctx.pushHistory();

        // 实时计算被点击 opening 的空间房间归属
        let opRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) opRoomId = room.id;
        }
        if (!opRoomId) {
          const wall = opening ? ctx.testMap.getEntity('wall', opening.wallId) : null;
          if (wall) {
            const mx = (wall.from[0] + wall.to[0]) / 2;
            const mz = (wall.from[1] + wall.to[1]) / 2;
            const room = ctx.testMap.getRoomAt(mx, mz);
            if (room) opRoomId = room.id;
          }
        }

        const openings = ctx.testMap.getEntities('opening');
        let count = 0;

        let roomWallSet = new Set();
        if (opRoomId) {
          const roomObj = ctx.testMap.getEntity('room', opRoomId);
          const roomWallIds = roomObj ? Object.values(roomObj.wallIds || {}) : [];
          roomWallSet = new Set(roomWallIds);
        }

        openings.forEach(op => {
          if (op.floorId === opening.floorId && op.type === opening.type && op.id !== opening.id && !isTargetLocked({ type: 'opening', id: op.id })) {
            if (opRoomId) {
              if (roomWallSet.has(op.wallId)) {
                ctx.testMap.updateOpening(op.id, {
                  material: opening.material,
                  color: opening.color,
                  frameMaterial: opening.frameMaterial,
                  panelMaterial: opening.panelMaterial,
                  glassMaterial: opening.glassMaterial
                });
                count++;
              }
            } else {
              const opWall = ctx.testMap.getEntity('wall', op.wallId);
              let opWallRoomId = null;
              if (opWall) {
                const opmx = (opWall.from[0] + opWall.to[0]) / 2;
                const opmz = (opWall.from[1] + opWall.to[1]) / 2;
                const opRoom = ctx.testMap.getRoomAt(opmx, opmz);
                if (opRoom) opWallRoomId = opRoom.id;
              }
              if (!opWallRoomId) {
                ctx.testMap.updateOpening(op.id, {
                  material: opening.material,
                  color: opening.color,
                  frameMaterial: opening.frameMaterial,
                  panelMaterial: opening.panelMaterial,
                  glassMaterial: opening.glassMaterial
                });
                count++;
              }
            }
          }
        });

        if (opRoomId) {
          ctx.showToast(`已将该门窗的材质应用到房间内其他 ${count} 个相同门窗上`);
        } else {
          ctx.showToast(`已将该室外门窗的材质应用到同层室外其他 ${count} 个相同门窗上`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getEntity('roof', target.id);
      if (roof) {
        ctx.pushHistory();

        // 实时计算被点击 roof 的空间房间归属
        let roofRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) roofRoomId = room.id;
        }

        const roofs = ctx.testMap.getEntities('roof');
        let count = 0;
        roofs.forEach(r => {
          if (r.floorId === roof.floorId && r.id !== roof.id && !isTargetLocked({ type: 'roof', id: r.id })) {
            const rRoom = ctx.testMap.getRoomAt(r.x || 0, r.z || 0);
            const rRoomId = rRoom ? rRoom.id : null;

            const isSameRoom = (roofRoomId && rRoomId === roofRoomId) || (!roofRoomId && !rRoomId);
            if (isSameRoom) {
              ctx.testMap.updateRoof(r.id, {
                material: roof.material,
                color: roof.color,
                sideMaterial: roof.sideMaterial,
                sideColor: roof.sideColor,
                bottomMaterial: roof.bottomMaterial,
                bottomColor: roof.bottomColor
              });
              count++;
            }
          }
        });

        if (roofRoomId) {
          ctx.showToast(`已将该屋顶的材质应用到房间内其他 ${count} 个屋顶上`);
        } else {
          ctx.showToast(`已将该屋顶的材质应用到同层室外其他 ${count} 个屋顶上`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getEntity('stairs', target.id);
      if (stairs) {
        ctx.pushHistory();

        // 实时计算被点击 stairs 的空间房间归属
        let stairsRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) stairsRoomId = room.id;
        }

        const stairsList = ctx.testMap.getEntities('stairs');
        let count = 0;
        stairsList.forEach(st => {
          if (st.floorId === stairs.floorId && st.id !== stairs.id && !isTargetLocked({ type: 'stairs', id: st.id })) {
            const stRoom = ctx.testMap.getRoomAt(st.x || 0, st.z || 0);
            const stRoomId = stRoom ? stRoom.id : null;

            const isSameRoom = (stairsRoomId && stRoomId === stairsRoomId) || (!stairsRoomId && !stRoomId);
            if (isSameRoom) {
              ctx.testMap.updateStairs(st.id, {
                material: stairs.material,
                color: stairs.color,
                sideMaterial: stairs.sideMaterial,
                sideColor: stairs.sideColor
              });
              count++;
            }
          }
        });

        if (stairsRoomId) {
          ctx.showToast(`已将该楼梯的材质应用到房间内其他 ${count} 个楼梯上`);
        } else {
          ctx.showToast(`已将该楼梯的材质应用到同层室外其他 ${count} 个楼梯上`);
        }
        ctx.refreshShadows();
        ctx.updateEditor();
        ctx.renderPlan();
      }
    }
  }
}
