/**
 * @typedef {('room'|'wall'|'item'|'opening'|'roof'|'stairs'|'fence'|'fence_gate')} TargetType
 */

/**
 * @typedef {Object} SelectedTarget
 * @property {TargetType|null} type - 选中的实体类型
 * @property {string|null} id - 选中的实体 ID
 */

/**
 * @typedef {Object} AppState
 * @property {string} mode - 当前模式 (如 'select', 'draw-wall' 等)
 * @property {string} currentView - 当前视图 ('2d' | '3d')
 * @property {SelectedTarget} selectedTarget - 统一的选中实体信息
 * @property {string|null} selectedRoomId - 选中的房间 ID
 * @property {string|null} selectedWallId - 选中的墙体 ID
 * @property {string|null} selectedItemId - 选中的家具物体 ID
 * @property {string|null} selectedOpeningId - 选中的门窗洞口 ID
 * @property {string|null} selectedRoofId - 选中的屋顶 ID
 * @property {string|null} selectedStairsId - 选中的楼梯 ID
 * @property {string|null} selectedFenceId - 选中的栅栏 ID
 * @property {string|null} selectedFenceGateId - 选中的栅栏门 ID
 * @property {Array<number>|null} drawStart - 绘制起点坐标 [x, z]
 * @property {Object|null} drag3DState - 3D拖拽临时状态
 * @property {Object|null} drawWallPreviewCylinder - 绘制墙体时的当前悬浮端点圆柱预览
 * @property {Object|null} drawWallPreviewStartCylinder - 绘制墙体时的起点圆柱预览
 * @property {Object|null} drawWallPreviewWall - 绘制墙体时的墙体 Box 预览
 * @property {Object|null} roofResizeState - 屋顶尺寸调整状态
 * @property {Object|null} stairsRailingPreview2DGroup - 2D 楼梯扶手悬浮预览 SVG 组
 * @property {Object|null} stairsRailingPreview3DGroup - 3D 楼梯扶手悬浮预览组
 * @property {string|null} currentPreviewStairsId - 当前预览楼梯的 ID
 * @property {Object|null} floorEdgeRailingPreview2DGroup - 2D 地板边缘栏杆预览 SVG 组
 * @property {Object|null} floorEdgeRailingPreview3DGroup - 3D 地板边缘栏杆预览组
 * @property {number|null} currentPreviewFloorEdgeIndex - 当前预览的地板边缘索引
 * @property {HTMLElement|null} contextMenuElement - 当前打开的右键上下文菜单 DOM 元素
 * @property {Object|null} longPressState - 长按手势检测状态
 * @property {boolean} snapEnabled - 是否启用网格对齐
 * @property {Object|null} active3DEditTarget - 当前激活的3D编辑轴目标
 * @property {number} snapSize - 对齐网格尺寸大小
 * @property {Object|null} activeMaterialDescriptor - 当前选中的材质包描述符
 * @property {Array} materialLibrary - 材质库列表
 * @property {Map<number, Object>} activePointers - 当前激活的指针坐标映射
 * @property {boolean} hasUserZoomedOrPanned - 用户是否已经缩放或平移过视口
 * @property {number} roomCounter - 房间序号计数器，用于默认命名
 * @property {boolean} floorPanelCollapsed - 楼层浮动面板是否折叠
 */

export const TARGET_TYPES = {
  ROOM: 'room',
  WALL: 'wall',
  ITEM: 'item',
  OPENING: 'opening',
  ROOF: 'roof',
  STAIRS: 'stairs',
  FENCE: 'fence',
  FENCE_GATE: 'fence_gate'
};
