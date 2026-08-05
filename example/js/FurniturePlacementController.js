import { Color3, MeshBuilder, StandardMaterial } from '../../src/index.js';
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
  placement = { type, point: null };
  Context.switchToSelectMode?.();
  Context.setDesignMode?.('select');
  setFurnitureButtonState(type);
  document.body.classList.add('placing-furniture');
  Context.renderPlan?.();
  Context.showToast?.('移动鼠标预览家具，点击画布完成放置，Esc 取消');
  return true;
}

export function updateFurniturePlacement(point) {
  if (!placement || !point) return;
  const snapped = Context.snapWorldPoint
    ? Context.snapWorldPoint({ x: point.x, z: point.z })
    : point;
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
  dispose3DPreview();
  if (!placement?.point || Context?.currentView !== '3d') return;
  const definition = Context.testMap.getFurnitureDefinition(placement.type);
  if (!definition) return;
  const size = dimensionsFor(definition);
  const previewHeight = Math.max(size.height, 0.04);
  preview3D = MeshBuilder.CreateBox('furniture_placement_preview', {
    width: Math.max(size.width, 0.04),
    depth: Math.max(size.depth, 0.04),
    height: previewHeight
  }, Context.scene);
  const material = new StandardMaterial('furniture_placement_preview_material', Context.scene);
  const color = definition.components?.[0]?.defaultColor || '#60a5fa';
  try {
    material.diffuseColor = Color3.FromHexString(color);
  } catch {
    material.diffuseColor = Color3.FromHexString('#60a5fa');
  }
  material.alpha = 0.42;
  material.backFaceCulling = false;
  preview3D.material = material;
  preview3D.isPickable = false;

  const floorId = Context.testMap.getCurrentFloorId();
  const floorY = Context.testMap.getFloorElevation?.(floorId) || 0;
  const room = Context.testMap.getRoomAt(placement.point.x, placement.point.z);
  const roomY = Number(room?.elevation || 0);
  const wallHeight = Number(Context.testMap.getProjectMetadata().wallHeight || 2.8);
  let elevation = 0;
  if (definition.placeType === 'ceiling') elevation = Math.max(0, wallHeight - previewHeight);
  preview3D.position.set(
    placement.point.x,
    floorY + roomY + elevation + previewHeight / 2,
    placement.point.z
  );
}
