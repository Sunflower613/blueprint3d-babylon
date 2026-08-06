import { Color3, TransformNode } from '../../src/index.js';
import { createSvgElement, worldToSvg } from './Render2D.js';

let Context = null;
let placement = null;
let preview3D = null;

function dimensionsFor(definition) {
  const divisor = definition.unit === 'm' ? 1 : 39.37;
  return {
    width: Number(definition.defaultSize?.width || 0) / divisor,
    depth: Number(definition.defaultSize?.depth || 0) / divisor,
    height: Number(definition.defaultSize?.height || 0) / divisor
  };
}

function dispose3DPreview() {
  if (!preview3D) return;
  preview3D.dispose(false, true);
  preview3D = null;
}

function setFurnitureButtonState(type) {
  document.querySelectorAll('[data-add-item]').forEach((button) => {
    const active = button.dataset.addItem === type;
    button.classList.toggle('placement-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

export function initFurniturePlacementController(appState) {
  Context = appState;
}

export function isFurniturePlacementActive() {
  return !!placement;
}

export function getFurniturePlacement() {
  return placement;
}

export function startFurniturePlacement(type) {
  if (!Context?.testMap.getFurnitureDefinition(type)) return false;
  dispose3DPreview();

  const initialPoint = Context.getPlacementInitialPoint
    ? Context.getPlacementInitialPoint()
    : { x: 0, z: 0 };

  const snapped = Context.snapWorldPointForFurniture
    ? Context.snapWorldPointForFurniture(type, initialPoint.x, initialPoint.z)
    : (Context.snapWorldPoint ? Context.snapWorldPoint(initialPoint) : initialPoint);

  placement = {
    type,
    point: {
      x: snapped.x,
      z: snapped.z,
      wallId: initialPoint.wallId || null,
      side: initialPoint.side || null
    }
  };

  Context.switchToSelectMode?.();
  Context.setDesignMode?.('select');
  setFurnitureButtonState(type);
  document.body.classList.add('placing-furniture');

  if (Context.currentView === '2d') {
    Context.renderPlan?.();
  } else {
    update3DPreview();
  }

  const isMobile = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
  );
  Context.showToast?.(isMobile ? '请点击场景放置家具' : '点击左键放置家具，右键取消');
  return true;
}

export function updateFurniturePlacement(point) {
  if (!placement || !point) return;
  const snapped = Context.snapWorldPointForFurniture
    ? Context.snapWorldPointForFurniture(placement.type, point.x, point.z)
    : (Context.snapWorldPoint ? Context.snapWorldPoint({ x: point.x, z: point.z }) : point);

  placement.point = {
    x: snapped.x,
    z: snapped.z,
    wallId: point.wallId,
    side: point.side
  };
  if (Context.currentView === '2d') {
    Context.renderPlan?.();
  } else {
    update3DPreview();
  }
}

export function hideFurniturePlacementPreview() {
  if (!placement?.point) return;
  placement.point = null;
  dispose3DPreview();
  if (Context?.currentView === '2d') Context.renderPlan?.();
}

export function commitFurniturePlacement(point) {
  if (!placement) return false;
  updateFurniturePlacement(point);
  const { type, point: target } = placement;
  if (!target) return false;
  const item = Context.placeFurnitureAt?.(type, target.x, target.z, {
    wallId: target.wallId,
    side: target.side
  });
  cancelFurniturePlacement({ render: false });
  Context.renderPlan?.();
  return !!item;
}

export function cancelFurniturePlacement({ render = true } = {}) {
  if (!placement) return false;
  placement = null;
  dispose3DPreview();
  setFurnitureButtonState(null);
  document.body.classList.remove('placing-furniture');
  if (render) Context?.renderPlan?.();
  return true;
}

export function render2DFurniturePlacementPreview() {
  if (!placement?.point || Context?.currentView !== '2d') return;
  const definition = Context.testMap.getFurnitureDefinition(placement.type);
  if (!definition) return;
  const size = dimensionsFor(definition);
  const center = worldToSvg(placement.point.x, placement.point.z);
  const a = worldToSvg(placement.point.x - size.width / 2, placement.point.z - size.depth / 2);
  const b = worldToSvg(placement.point.x + size.width / 2, placement.point.z + size.depth / 2);
  const color = definition.components?.[0]?.defaultColor || '#60a5fa';
  const group = createSvgElement('g', {
    class: 'furniture-placement-preview',
    style: 'pointer-events: none;'
  });
  group.append(
    createSvgElement('rect', {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(b.x - a.x),
      height: Math.abs(b.y - a.y),
      rx: 6,
      fill: color,
      opacity: 0.48,
      stroke: '#2563eb',
      'stroke-width': 2,
      'stroke-dasharray': '6 4'
    })
  );
  const label = createSvgElement('text', {
    x: center.x,
    y: center.y + 4,
    class: 'item-label',
    opacity: 0.72
  });
  label.textContent = definition.name;
  group.append(label);
  Context.svg.appendChild(group);
}

function update3DPreview() {
  if (!placement?.point || Context?.currentView !== '3d') {
    dispose3DPreview();
    return;
  }
  const definition = Context.testMap.getFurnitureDefinition(placement.type);
  if (!definition) return;
  const size = dimensionsFor(definition);

  const floorId = Context.testMap.getCurrentFloorId();
  const floorY = Context.testMap.getFloorElevation?.(floorId) || 0;
  const room = Context.testMap.getRoomAt(placement.point.x, placement.point.z);
  const roomY = Number(room?.elevation || 0);
  const wallHeight = Number(Context.testMap.getProjectMetadata().wallHeight || 2.8);
  let elevation = 0;
  if (definition.placeType === 'ceiling') elevation = Math.max(0, wallHeight - size.height);

  const targetY = floorY + roomY + elevation;

  // 复用已构建好的 3D Mesh 节点，只移动位置，提升性能
  if (preview3D && preview3D._type === placement.type) {
    preview3D.position.set(placement.point.x, targetY, placement.point.z);
    return;
  }

  // 释放旧模型，构建新实际建模
  dispose3DPreview();

  const previewNode = new TransformNode('furniture_placement_preview', Context.scene);
  previewNode._type = placement.type;

  const previewItem = {
    id: 'furniture_placement_preview_item',
    type: placement.type,
    width: size.width,
    depth: size.depth,
    height: size.height,
    elevation: 0,
    rotation: 0,
    colors: {},
    materials: {}
  };

  if (Array.isArray(definition.components)) {
    definition.components.forEach((component) => {
      previewItem.colors[component.id] = component.defaultColor || '#ffffff';
      previewItem.materials[component.id] = component.defaultMaterial || previewItem.colors[component.id];
    });
  }

  const registry = Context.testMap;
  definition.build(registry, previewItem, previewNode, size);

  const childMeshes = previewNode.getChildMeshes ? previewNode.getChildMeshes(false) : [];
  childMeshes.forEach((mesh) => {
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    if (mesh.material) {
      mesh.material = mesh.material.clone(`${mesh.material.name}_preview`);
      mesh.material.alpha = 0.6;
      mesh.material.backFaceCulling = false;
    }
  });

  previewNode.position.set(placement.point.x, targetY, placement.point.z);
  preview3D = previewNode;
}
