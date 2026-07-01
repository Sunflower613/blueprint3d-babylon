/**
 * proxyHelper.js — 运行时状态 Store 与各 Handler 注入上下文的桥接代理助手
 * 
 * 职责：
 *   1. 拦截 Handler 对 ctx 属性的读写，并将其彻底引流到独立的运行时状态子 Store 中。
 *   2. 对非状态的渲染方法、场景服务等操作进行动态透传。
 *   3. 零改动、零风险实现 Handler 层的全量状态解耦。
 */

import { ui, selection, editor } from './index.js';

/**
 * 创建一个用于桥接 Handler 和运行时子 Store 的代理对象
 * @param {() => Object} getRawCtx - 闭包，用于动态获取 Handler 原本传入的原始 ctx 对象
 * @returns {Proxy} 代理对象
 */
export function createStoreProxy(getRawCtx) {
  return new Proxy({}, {
    get(target, prop) {
      // 1. 拦截并分流状态读取
      if (prop === 'mode') return ui.mode;
      if (prop === 'currentView') return ui.currentView;
      if (prop === 'designMode') return ui.designMode;
      if (prop === 'floorPanelCollapsed') return ui.floorPanelCollapsed;
      if (prop === 'contextMenuElement') return ui.contextMenuElement;

      if (prop === 'selectedTarget') return selection.selectedTarget;
      if (prop === 'selectedRoomId') return selection.selectedRoomId;
      if (prop === 'selectedWallId') return selection.selectedWallId;
      if (prop === 'selectedItemId') return selection.selectedItemId;
      if (prop === 'selectedOpeningId') return selection.selectedOpeningId;
      if (prop === 'selectedRoofId') return selection.selectedRoofId;
      if (prop === 'selectedStairsId') return selection.selectedStairsId;
      if (prop === 'selectedFenceId') return selection.selectedFenceId;
      if (prop === 'selectedFenceGateId') return selection.selectedFenceGateId;
      if (prop === 'pickerCopiedItemType') return selection.pickerCopiedItemType;
      if (prop === 'pickerCopiedItemMaterials') return selection.pickerCopiedItemMaterials;
      if (prop === 'pickerCopiedItemColors') return selection.pickerCopiedItemColors;
      if (prop === 'pickerCopiedBuildingType') return selection.pickerCopiedBuildingType;
      if (prop === 'pickerCopiedBuildingMaterials') return selection.pickerCopiedBuildingMaterials;
      if (prop === 'pickerCopiedBuildingColors') return selection.pickerCopiedBuildingColors;

      if (prop === 'drawStart') return editor.drawStart;
      if (prop === 'drag3DState') return editor.drag3DState;
      if (prop === 'drawWallPreviewCylinder') return editor.drawWallPreviewCylinder;
      if (prop === 'drawWallPreviewStartCylinder') return editor.drawWallPreviewStartCylinder;
      if (prop === 'drawWallPreviewWall') return editor.drawWallPreviewWall;
      if (prop === 'roofResizeState') return editor.roofResizeState;
      if (prop === 'stairsRailingPreview2DGroup') return editor.stairsRailingPreview2DGroup;
      if (prop === 'stairsRailingPreview3DGroup') return editor.stairsRailingPreview3DGroup;
      if (prop === 'currentPreviewStairsId') return editor.currentPreviewStairsId;
      if (prop === 'floorEdgeRailingPreview2DGroup') return editor.floorEdgeRailingPreview2DGroup;
      if (prop === 'floorEdgeRailingPreview3DGroup') return editor.floorEdgeRailingPreview3DGroup;
      if (prop === 'currentPreviewFloorEdgeIndex') return editor.currentPreviewFloorEdgeIndex;
      if (prop === 'longPressState') return editor.longPressState;
      if (prop === 'snapEnabled') return editor.snapEnabled;
      if (prop === 'active3DEditTarget') return editor.active3DEditTarget;
      if (prop === 'snapSize') return editor.snapSize;
      if (prop === 'activeMaterialDescriptor') return editor.activeMaterialDescriptor;
      if (prop === 'materialLibrary') return editor.materialLibrary;

      // 2. 状态透传失败后，直接从原 appContext 中读取渲染函数或 3D 场景对象
      const raw = getRawCtx();
      return raw ? raw[prop] : undefined;
    },
    set(target, prop, value) {
      // 3. 拦截并分流状态写入
      if (prop === 'mode') { ui.mode = value; return true; }
      if (prop === 'currentView') { ui.currentView = value; return true; }
      if (prop === 'designMode') { ui.designMode = value; return true; }
      if (prop === 'floorPanelCollapsed') { ui.floorPanelCollapsed = value; return true; }
      if (prop === 'contextMenuElement') { ui.contextMenuElement = value; return true; }

      if (prop === 'selectedTarget') { selection.selectedTarget = value; return true; }
      if (prop === 'selectedRoomId') { selection.selectedRoomId = value; return true; }
      if (prop === 'selectedWallId') { selection.selectedWallId = value; return true; }
      if (prop === 'selectedItemId') { selection.selectedItemId = value; return true; }
      if (prop === 'selectedOpeningId') { selection.selectedOpeningId = value; return true; }
      if (prop === 'selectedRoofId') { selection.selectedRoofId = value; return true; }
      if (prop === 'selectedStairsId') { selection.selectedStairsId = value; return true; }
      if (prop === 'selectedFenceId') { selection.selectedFenceId = value; return true; }
      if (prop === 'selectedFenceGateId') { selection.selectedFenceGateId = value; return true; }
      if (prop === 'pickerCopiedItemType') { selection.pickerCopiedItemType = value; return true; }
      if (prop === 'pickerCopiedItemMaterials') { selection.pickerCopiedItemMaterials = value; return true; }
      if (prop === 'pickerCopiedItemColors') { selection.pickerCopiedItemColors = value; return true; }
      if (prop === 'pickerCopiedBuildingType') { selection.pickerCopiedBuildingType = value; return true; }
      if (prop === 'pickerCopiedBuildingMaterials') { selection.pickerCopiedBuildingMaterials = value; return true; }
      if (prop === 'pickerCopiedBuildingColors') { selection.pickerCopiedBuildingColors = value; return true; }

      if (prop === 'drawStart') { editor.drawStart = value; return true; }
      if (prop === 'drag3DState') { editor.drag3DState = value; return true; }
      if (prop === 'drawWallPreviewCylinder') { editor.drawWallPreviewCylinder = value; return true; }
      if (prop === 'drawWallPreviewStartCylinder') { editor.drawWallPreviewStartCylinder = value; return true; }
      if (prop === 'drawWallPreviewWall') { editor.drawWallPreviewWall = value; return true; }
      if (prop === 'roofResizeState') { editor.roofResizeState = value; return true; }
      if (prop === 'stairsRailingPreview2DGroup') { editor.stairsRailingPreview2DGroup = value; return true; }
      if (prop === 'stairsRailingPreview3DGroup') { editor.stairsRailingPreview3DGroup = value; return true; }
      if (prop === 'currentPreviewStairsId') { editor.currentPreviewStairsId = value; return true; }
      if (prop === 'floorEdgeRailingPreview2DGroup') { editor.floorEdgeRailingPreview2DGroup = value; return true; }
      if (prop === 'floorEdgeRailingPreview3DGroup') { editor.floorEdgeRailingPreview3DGroup = value; return true; }
      if (prop === 'currentPreviewFloorEdgeIndex') { editor.currentPreviewFloorEdgeIndex = value; return true; }
      if (prop === 'longPressState') { editor.longPressState = value; return true; }
      if (prop === 'snapEnabled') { editor.snapEnabled = value; return true; }
      if (prop === 'active3DEditTarget') { editor.active3DEditTarget = value; return true; }
      if (prop === 'snapSize') { editor.snapSize = value; return true; }
      if (prop === 'activeMaterialDescriptor') { editor.activeMaterialDescriptor = value; return true; }
      if (prop === 'materialLibrary') { editor.materialLibrary = value; return true; }

      const raw = getRawCtx();
      if (raw) {
        raw[prop] = value;
      }
      return true;
    }
  });
}
