import { FENCE_SUBTYPE_DEFAULTS } from '../../src/presets/blueprintTestMap.js';
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

export function renderMaterialLibrary() {
  ctx.updateDesignCursor();
  const materialCategorySelect = document.getElementById('material-category');
  const materialLibraryPanel = document.getElementById('material-library');
  if (!materialCategorySelect || !materialLibraryPanel) return;

  const category = materialCategorySelect.value;
  const materials = editor.materialLibrary.filter((material) => material.category === category);
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
    if (material.kind === 'texture' && material.src) {
      button.style.backgroundImage = `url(${material.src})`;
    } else if (material.kind === 'mirror') {
      const c = material.color || '#e8eef4';
      button.style.background = `linear-gradient(135deg, ${c} 0%, #ffffff 45%, ${c} 55%, #ffffff 100%)`;
    } else if (material.kind === 'glass') {
      const c = material.color || '#e8f4ff';
      button.style.background = `linear-gradient(${c}99, ${c}99), repeating-conic-gradient(#d0d0d0 0% 25%, #f5f5f5 0% 50%) 0 0 / 8px 8px`;
    } else if (material.kind === 'emissive') {
      const c = material.color || '#ffffff';
      button.style.backgroundColor = c;
      button.style.boxShadow = `inset 0 0 4px rgba(255,255,255,0.8), 0 0 10px ${c}88`;
      button.style.border = '1px solid rgba(255,255,255,0.4)';
    } else {
      button.style.backgroundColor = material.color || '#ffffff';
    }
    button.addEventListener('click', () => {
      editor.activeMaterialDescriptor = material;
      editor.activeMaterialArray = null; // 清除全量数组
      renderMaterialLibrary();
      ctx.updateEditor();
    });
    grid.appendChild(button);
  });
  materialLibraryPanel.appendChild(grid);

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
    const item = type === 'fence' ? ctx.testMap.getFence(id) : ctx.testMap.getFenceGate(id);
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
      patch = { materialFront: matVal, colorFront: color };
    } else if (part === 'back') {
      patch = { materialBack: matVal, colorBack: color };
    } else {
      patch = { material: matVal, color: color };
    }
    ctx.testMap.updateWall(id, patch, { rebuild });
  } else if (type === 'stairs') {
    if (part === 'top') {
      patch = { material: matVal, color: color };
    } else if (part === 'side') {
      patch = { sideMaterial: matVal, sideColor: color };
    }
    ctx.testMap.updateStairs(id, patch, rebuild);
  } else if (type === 'roof') {
    if (part === 'top') {
      patch = { material: matVal, color: color };
    } else if (part === 'side') {
      patch = { sideMaterial: matVal, sideColor: color };
    } else if (part === 'bottom') {
      patch = { bottomMaterial: matVal, bottomColor: color };
    }
    ctx.testMap.updateRoof(id, patch, rebuild);
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
    ctx.testMap.updateFence(id, patch, rebuild);
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
    ctx.testMap.updateFenceGate(id, patch, rebuild);
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
    ctx.testMap.updateOpening(id, patch, rebuild);
  } else if (type === 'room') {
    ctx.testMap.setRoomFloorMaterial(id, material);
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

export function extractMaterial(target, precise = true) {
  if (!target) return;
  
  if (precise) {
    // 1. 精准吸取
    let pickedMaterial = null;
    let pickedColor = null;

    if (target.type === 'room') {
      const room = ctx.testMap.getRoom(target.id);
      if (room) {
        pickedMaterial = room.material;
        pickedColor = room.color;
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getWall(target.id);
      if (wall) {
        const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
        if (side === 'front') {
          pickedMaterial = wall.materialFront || wall.material;
          pickedColor = wall.colorFront || wall.color;
        } else if (side === 'back') {
          pickedMaterial = wall.materialBack || wall.material;
          pickedColor = wall.colorBack || wall.color;
        } else {
          pickedMaterial = wall.material;
          pickedColor = wall.color;
        }
      }
    } else if (target.type === 'item') {
      const item = ctx.testMap.getItem(target.id);
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
      const fence = ctx.testMap.getFence(target.id);
      if (fence) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = fence.frameMaterial || fence.material;
          pickedColor = fence.frameColor || fence.color;
        } else if (componentId === 'panel') {
          pickedMaterial = fence.panelMaterial || fence.material;
          pickedColor = fence.panelColor || fence.color;
        } else {
          pickedMaterial = fence.material;
          pickedColor = fence.color;
        }
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getFenceGate(target.id);
      if (gate) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintFenceComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = gate.frameMaterial || gate.material;
          pickedColor = gate.frameColor || gate.color;
        } else if (componentId === 'panel') {
          pickedMaterial = gate.panelMaterial || gate.material;
          pickedColor = gate.panelColor || gate.color;
        } else {
          pickedMaterial = gate.material;
          pickedColor = gate.color;
        }
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getOpening(target.id);
      if (opening) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintOpeningComponentId') : null;
        if (componentId === 'frame') {
          pickedMaterial = opening.frameMaterial || opening.material;
        } else if (componentId === 'panel') {
          pickedMaterial = opening.panelMaterial || opening.material;
        } else if (componentId === 'glass') {
          pickedMaterial = opening.glassMaterial || opening.material;
        } else {
          pickedMaterial = opening.material;
        }
        pickedColor = opening.color;
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getRoof(target.id);
      if (roof) {
        const componentId = target.pick ? findRoofComponentIdFromNode(target.pick.pickedMesh) : null;
        if (componentId === 'side') {
          pickedMaterial = roof.sideMaterial || roof.material;
          pickedColor = roof.sideColor || roof.color;
        } else if (componentId === 'bottom') {
          pickedMaterial = roof.bottomMaterial || roof.material;
          pickedColor = roof.bottomColor || roof.color;
        } else {
          pickedMaterial = roof.material;
          pickedColor = roof.color;
        }
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getStairs(target.id);
      if (stairs) {
        const componentId = target.pick ? findMetadataFromNode(target.pick.pickedMesh, 'blueprintStairsComponentId') : null;
        if (componentId === 'side') {
          pickedMaterial = stairs.sideMaterial || stairs.material;
          pickedColor = stairs.sideColor || stairs.color;
        } else {
          pickedMaterial = stairs.material;
          pickedColor = stairs.color;
        }
      }
    }

    if (pickedMaterial || pickedColor) {
      let descriptor = pickedMaterial || pickedColor;
      if (typeof descriptor === 'string') {
        const found = editor.materialLibrary.find(m => m.color === descriptor);
        if (found) {
          editor.activeMaterialDescriptor = found;
        } else {
          editor.activeMaterialDescriptor = {
            id: 'paint-' + descriptor.replace('#', ''),
            name: `吸取颜色 (${descriptor})`,
            category: 'paint',
            kind: 'paint',
            color: descriptor
          };
        }
      } else {
        editor.activeMaterialDescriptor = descriptor;
      }
      editor.activeMaterialArray = null; // 清除全量数组
      const displayName = getActiveMaterialDisplayName(editor.activeMaterialDescriptor);
      ctx.showToast(`已吸取材质: ${displayName}`);
      renderMaterialLibrary();
      ctx.updateEditor();
      ctx.setDesignMode('brush', false);
    } else {
      ctx.showToast('未找到该物体的材质');
      ctx.setDesignMode('select');
    }
  } else {
    // 2. 全量吸取（右键菜单吸取）
    let materialsArray = [];
    materialsArray.sourceType = target.type;

    if (target.type === 'room') {
      const room = ctx.testMap.getRoom(target.id);
      if (room) {
        materialsArray.push({
          componentId: 'floor',
          material: room.material || null,
          color: room.color || '#ffffff'
        });
      }
    } else if (target.type === 'wall') {
      const wall = ctx.testMap.getWall(target.id);
      if (wall) {
        materialsArray.push({
          componentId: 'front',
          material: wall.materialFront || wall.material || null,
          color: wall.colorFront || wall.color || '#ffffff'
        });
        materialsArray.push({
          componentId: 'back',
          material: wall.materialBack || wall.material || null,
          color: wall.colorBack || wall.color || '#ffffff'
        });
      }
    } else if (target.type === 'item') {
      const item = ctx.testMap.getItem(target.id);
      if (item) {
        materialsArray.sourceItemType = item.type;
        const definition = ctx.testMap.getFurnitureDefinition?.(item.type);
        if (definition && definition.components) {
          definition.components.forEach(comp => {
            materialsArray.push({
              componentId: comp.id,
              material: item.materials?.[comp.id] || null,
              color: item.colors?.[comp.id] || comp.defaultColor || '#ffffff'
            });
          });
        } else {
          const matKeys = Object.keys(item.materials || {});
          const colKeys = Object.keys(item.colors || {});
          const allKeys = Array.from(new Set([...matKeys, ...colKeys]));
          allKeys.forEach(k => {
            materialsArray.push({
              componentId: k,
              material: item.materials?.[k] || null,
              color: item.colors?.[k] || '#ffffff'
            });
          });
        }
      }
    } else if (target.type === 'fence') {
      const fence = ctx.testMap.getFence(target.id);
      if (fence) {
        materialsArray.push({
          componentId: 'frame',
          material: fence.frameMaterial || fence.material || null,
          color: fence.frameColor || fence.color || '#ffffff'
        });
        materialsArray.push({
          componentId: 'panel',
          material: fence.panelMaterial || fence.material || null,
          color: fence.panelColor || fence.color || '#ffffff'
        });
      }
    } else if (target.type === 'fence_gate') {
      const gate = ctx.testMap.getFenceGate(target.id);
      if (gate) {
        materialsArray.push({
          componentId: 'frame',
          material: gate.frameMaterial || gate.material || null,
          color: gate.frameColor || gate.color || '#ffffff'
        });
        materialsArray.push({
          componentId: 'panel',
          material: gate.panelMaterial || gate.material || null,
          color: gate.panelColor || gate.color || '#ffffff'
        });
      }
    } else if (target.type === 'opening') {
      const opening = ctx.testMap.getOpening(target.id);
      if (opening) {
        materialsArray.push({
          componentId: 'frame',
          material: opening.frameMaterial || opening.material || null,
          color: opening.color || '#ffffff'
        });
        materialsArray.push({
          componentId: 'panel',
          material: opening.panelMaterial || opening.material || null,
          color: opening.color || '#ffffff'
        });
        materialsArray.push({
          componentId: 'glass',
          material: opening.glassMaterial || opening.material || null,
          color: opening.color || '#ffffff'
        });
      }
    } else if (target.type === 'roof') {
      const roof = ctx.testMap.getRoof(target.id);
      if (roof) {
        materialsArray.push({
          componentId: 'top',
          material: roof.material || null,
          color: roof.color || '#b75b54'
        });
        materialsArray.push({
          componentId: 'side',
          material: roof.sideMaterial || null,
          color: roof.sideColor || '#b75b54'
        });
        materialsArray.push({
          componentId: 'bottom',
          material: roof.bottomMaterial || null,
          color: roof.bottomColor || '#b75b54'
        });
      }
    } else if (target.type === 'stairs') {
      const stairs = ctx.testMap.getStairs(target.id);
      if (stairs) {
        materialsArray.push({
          componentId: 'top',
          material: stairs.material || null,
          color: stairs.color || '#d8c0a0'
        });
        materialsArray.push({
          componentId: 'side',
          material: stairs.sideMaterial || null,
          color: stairs.sideColor || '#d8c0a0'
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
        const targetItem = ctx.testMap.getItem(target.id);
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
        const backEntry = activeMaterialArray.find(e => e.componentId === 'back') || activeMaterialArray[1] || frontEntry;
        
        ctx.testMap.updateWall(target.id, {
          materialFront: frontEntry.material,
          colorFront: frontEntry.color,
          materialBack: backEntry.material,
          colorBack: backEntry.color
        });
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
        const wall = ctx.testMap.getWall(target.id);
        if (wall) {
          const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
          if (side === 'front') {
            updateComponentMaterial('wall', target.id, 'front', activeMaterialDescriptor);
          } else if (side === 'back') {
            updateComponentMaterial('wall', target.id, 'back', activeMaterialDescriptor);
          } else {
            updateComponentMaterial('wall', target.id, 'all', activeMaterialDescriptor);
          }
        }
      } else if (target.type === 'item') {
        const item = ctx.testMap.getItem(target.id);
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
      const wall = ctx.testMap.getWall(target.id);
      if (!wall) return;
      const side = target.pick ? findWallSideFromNode(target.pick.pickedMesh) : (target.point ? get2DWallSideFromPoint(wall, target.point) : null);
      if (!side) return;

      // 提取当前墙面这一侧的现有材质和颜色
      const srcMaterial = side === 'front' 
        ? (wall.materialFront !== undefined && wall.materialFront !== null ? wall.materialFront : wall.material) 
        : (wall.materialBack !== undefined && wall.materialBack !== null ? wall.materialBack : wall.material);
      const srcColor = side === 'front'
        ? (wall.colorFront !== undefined && wall.colorFront !== null ? wall.colorFront : wall.color)
        : (wall.colorBack !== undefined && wall.colorBack !== null ? wall.colorBack : wall.color);

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
        if (side === 'front') {
          ctx.testMap.updateWall(wall.id, { materialFront: srcMaterial, colorFront: srcColor });
        } else {
          ctx.testMap.updateWall(wall.id, { materialBack: srcMaterial, colorBack: srcColor });
        }
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
        const w = ctx.testMap.getWall(wallId);
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
          ctx.testMap.updateWall(w.id, { materialFront: srcMaterial, colorFront: srcColor });
          count++;
        } else if (isB) {
          ctx.testMap.updateWall(w.id, { materialBack: srcMaterial, colorBack: srcColor });
          count++;
        } else {
          ctx.testMap.updateWall(w.id, { material: srcMaterial, color: srcColor });
          count++;
        }
      });

      ctx.showToast(`已将该墙面的材质应用到房间内其他 ${count} 面墙上`);
      ctx.refreshShadows();
      ctx.updateEditor();
      ctx.renderPlan();
    } else if (target.type === 'item') {
      const updatedItem = ctx.testMap.getItem(target.id);
      if (updatedItem) {
        ctx.pushHistory();
        if (ctx.testMap.refreshItemRoomLinks) {
          ctx.testMap.refreshItemRoomLinks();
        }
        const currentRoomId = updatedItem.roomId;

        const items = ctx.testMap.floorplan?.items || ctx.testMap.items || [];
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
      const fence = ctx.testMap.getFence(target.id);
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

        const fences = ctx.testMap.floorplan.fences || [];
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
      const gate = ctx.testMap.getFenceGate(target.id);
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

        const gates = ctx.testMap.floorplan.fenceGates || [];
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
      const opening = ctx.testMap.getOpening(target.id);
      if (opening) {
        ctx.pushHistory();

        // 实时计算被点击 opening 的空间房间归属
        let opRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) opRoomId = room.id;
        }
        if (!opRoomId) {
          const wall = opening ? ctx.testMap.getWall(opening.wallId) : null;
          if (wall) {
            const mx = (wall.from[0] + wall.to[0]) / 2;
            const mz = (wall.from[1] + wall.to[1]) / 2;
            const room = ctx.testMap.getRoomAt(mx, mz);
            if (room) opRoomId = room.id;
          }
        }

        const openings = ctx.testMap.floorplan.openings || [];
        let count = 0;

        let roomWallSet = new Set();
        if (opRoomId) {
          const roomObj = ctx.testMap.getRoom(opRoomId);
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
              const opWall = ctx.testMap.getWall(op.wallId);
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
      const roof = ctx.testMap.getRoof(target.id);
      if (roof) {
        ctx.pushHistory();

        // 实时计算被点击 roof 的空间房间归属
        let roofRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) roofRoomId = room.id;
        }

        const roofs = ctx.testMap.floorplan.roofs || [];
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
      const stairs = ctx.testMap.getStairs(target.id);
      if (stairs) {
        ctx.pushHistory();

        // 实时计算被点击 stairs 的空间房间归属
        let stairsRoomId = null;
        if (target.pick && target.pick.pickedPoint) {
          const room = ctx.testMap.getRoomAt(target.pick.pickedPoint.x, target.pick.pickedPoint.z);
          if (room) stairsRoomId = room.id;
        }

        const stairsList = ctx.testMap.floorplan.stairs || [];
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
