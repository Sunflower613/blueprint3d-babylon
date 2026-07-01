/**
 * editorPreviewState.js — 交互预览与网格捕捉状态类型定义
 */

/**
 * @typedef {Object} EditorPreviewState
 * @property {Array<number>|null} drawStart - 绘制起点坐标 [x, z]
 * @property {Object|null} drag3DState - 3D 拖拽临时状态
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
 * @property {Object|null} longPressState - 长按手势检测状态
 * @property {boolean} snapEnabled - 是否启用网格对齐
 * @property {Object|null} active3DEditTarget - 当前激活的 3D 编辑轴目标
 * @property {number} snapSize - 对齐网格尺寸大小
 */
