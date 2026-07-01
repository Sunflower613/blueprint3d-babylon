/**
 * editorPreviewStore.js — 交互预览与网格捕捉状态 Class
 */

export class EditorPreviewStore {
  constructor() {
    this.drawStart = null; // 绘制起点坐标 [x, z]
    this.drag3DState = null; // 3D 拖拽临时状态
    this.drawWallPreviewCylinder = null; // 绘制墙体时的当前悬浮端点圆柱预览
    this.drawWallPreviewStartCylinder = null; // 绘制墙体时的起点圆柱预览
    this.drawWallPreviewWall = null; // 绘制墙体时的墙体 Box 预览
    this.roofResizeState = null; // 屋顶尺寸调整状态
    this.stairsRailingPreview2DGroup = null; // 2D 楼梯扶手悬浮预览 SVG 组
    this.stairsRailingPreview3DGroup = null; // 3D 楼梯扶手悬浮预览组
    this.currentPreviewStairsId = null; // 当前预览楼梯的 ID
    this.floorEdgeRailingPreview2DGroup = null; // 2D 地板边缘栏杆预览 SVG 组
    this.floorEdgeRailingPreview3DGroup = null; // 3D 地板边缘栏杆预览组
    this.currentPreviewFloorEdgeIndex = null; // 当前预览的地板边缘索引
    this.longPressState = null; // 长按手势检测状态
    this.snapEnabled = true; // 是否启用网格对齐
    this.active3DEditTarget = null; // 当前激活的 3D 编辑轴目标
    this.snapSize = 10; // 对齐网格尺寸大小
    this.activeMaterialDescriptor = null; // 当前选中的材质包描述符
    this.activeMaterialArray = null; // 当前吸取的材质数组
    this.materialLibrary = []; // 材质库列表
  }
}
