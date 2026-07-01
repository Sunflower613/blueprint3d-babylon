/**
 * selectionStore.js — 画布选中实体状态 Class
 */

export class SelectionStore {
  constructor() {
    /** @type {import('../type/common.js').SelectedTarget} */
    this.selectedTarget = { type: null, id: null }; // 统一的选中实体信息
    this.selectedRoomId = null; // 选中的房间 ID
    this.selectedWallId = null; // 选中的墙体 ID
    this.selectedItemId = null; // 选中的家具物体 ID
    this.selectedOpeningId = null; // 选中的门窗洞口 ID
    this.selectedRoofId = null; // 选中的屋顶 ID
    this.selectedStairsId = null; // 选中的楼梯 ID
    this.selectedFenceId = null; // 选中的栅栏 ID
    this.selectedFenceGateId = null; // 选中的栅栏门 ID

    // 复制材质吸色时暂存家具的相关元数据
    this.pickerCopiedItemType = null;
    this.pickerCopiedItemMaterials = null;
    this.pickerCopiedItemColors = null;

    // 复制材质吸色时暂存建筑组件的相关元数据
    this.pickerCopiedBuildingType = null;
    this.pickerCopiedBuildingMaterials = null;
    this.pickerCopiedBuildingColors = null;
  }
}
