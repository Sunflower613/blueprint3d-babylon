/**
 * selectionState.js — 画布选中实体状态类型定义
 */

/**
 * @typedef {import('./common.js').SelectedTarget} SelectedTarget
 */

/**
 * @typedef {Object} SelectionState
 * @property {SelectedTarget} selectedTarget - 统一的选中实体信息
 * @property {string|null} selectedRoomId - 选中的房间 ID
 * @property {string|null} selectedWallId - 选中的墙体 ID
 * @property {string|null} selectedItemId - 选中的家具物体 ID
 * @property {string|null} selectedOpeningId - 选中的门窗洞口 ID
 * @property {string|null} selectedRoofId - 选中的屋顶 ID
 * @property {string|null} selectedStairsId - 选中的楼梯 ID
 * @property {string|null} selectedFenceId - 选中的栅栏 ID
 * @property {string|null} selectedFenceGateId - 选中的栅栏门 ID
 * @property {string|null} pickerCopiedItemType - 吸色拷贝的家具类型
 * @property {Object|null} pickerCopiedItemMaterials - 吸色拷贝的家具材质
 * @property {Object|null} pickerCopiedItemColors - 吸色拷贝的家具颜色
 * @property {string|null} pickerCopiedBuildingType - 吸色拷贝的建筑组件类型
 * @property {Array|null} pickerCopiedBuildingMaterials - 吸色拷贝的建筑组件材质列表
 * @property {Array|null} pickerCopiedBuildingColors - 吸色拷贝的建筑组件颜色列表
 */
