import { CSG, Color3, MaterialPluginBase, Mesh, MeshBuilder, MirrorTexture, Plane, PointLight, ReflectionProbe, RenderTargetTexture, ShaderLanguage, SpotLight, Texture, TransformNode, Vector3, VertexBuffer, VertexData } from '../core/babylon.js';
const BABYLON = { CSG, Color3, MaterialPluginBase, Mesh, MeshBuilder, MirrorTexture, Plane, PointLight, ReflectionProbe, RenderTargetTexture, ShaderLanguage, SpotLight, Texture, TransformNode, Vector3, VertexBuffer, VertexData };
import { BlueprintRegistry } from '../core/BlueprintRegistry.js';
import { getFurnitureDefinition, FURNITURE_DEFINITIONS, FURNITURE_LIST } from '../furniture/index.js';
import { FloorplanDocument, FENCE_SUBTYPE_DEFAULTS } from '../domain/FloorplanDocument.js';
import { ExportService } from '../services/ExportService.js';
import { buildFenceGeometry } from '../geometry/fenceGeometry.js';
import { buildFenceGateGeometry } from '../geometry/fenceGateGeometry.js';
import { buildOpeningGeometry, createOpeningCutterMesh, normalizeOpeningShape } from '../openings/index.js';
import { createOpeningProfileMesh } from '../openings/geometry.js';
import { triangulateRoom, getRoomBounds, pointInRoom, getRoomVertices, getRoomWallKeys } from '../rooms/index.js';
import { BabylonSceneRenderer, OpeningHolePreviewPlugin, FenceGateGapPreviewPlugin } from '../runtime/BabylonSceneRenderer.js';
import { SelectionController } from '../editor/SelectionController.js';


export const BLUEPRINT3D_TEST_FLOORPLAN = {
  name: 'blueprint3dTestMap',
  unit: 'in',
  wallHeight: 3.0,
  wallThickness: 0.18,
  floorHeight: 0.06,
  floor: {
    color: '#f4efe6',
    rooms: [
      {
        id: 'living',
        name: '\u5ba2\u5385',
        x: 0,
        z: 0,
        width: 10,
        depth: 8,
        wallIds: {
          north: 'w_north_living',
          east: 'w_east_living',
          south: 'w_south_living',
          west: 'w_west_living'
        }
      },
      {
        id: 'bedroom',
        name: '\u5367\u5ba4',
        x: -2.5,
        z: -6.5,
        width: 5,
        depth: 5,
        wallIds: {
          east: 'w_mid',
          south: 'w_bed_south',
          west: 'w_bed_west'
        }
      },
      {
        id: 'studio',
        name: '\u5de5\u4f5c\u95f4',
        x: 3,
        z: -6.5,
        width: 6,
        depth: 5,
        wallIds: {
          north: 'w_studio_north',
          east: 'w_studio_east',
          south: 'w_studio_south',
          west: 'w_mid'
        }
      }
    ]
  },
  walls: [
    { id: 'w_north_living', from: [-5, -4], to: [0, -4], color: '#f9fbff' },
    { id: 'w_east_living', from: [5, -4], to: [5, 4], color: '#f9fbff' },
    { id: 'w_south_living', from: [5, 4], to: [-5, 4], color: '#f9fbff' },
    { id: 'w_west_living', from: [-5, 4], to: [-5, -4], color: '#f9fbff' },
    { id: 'w_bed_west', from: [-5, -9], to: [-5, -4], color: '#f9fbff' },
    { id: 'w_bed_south', from: [-5, -9], to: [0, -9], color: '#f9fbff' },
    { id: 'w_mid', from: [0, -9], to: [0, -4], color: '#f9fbff' },
    { id: 'w_studio_south', from: [0, -9], to: [6, -9], color: '#f9fbff' },
    { id: 'w_studio_east', from: [6, -9], to: [6, -4], color: '#f9fbff' },
    { id: 'w_studio_north', from: [0, -4], to: [6, -4], color: '#f9fbff' }
  ],
  openings: [
    { id: 'door_living_bedroom', type: 'door', wallId: 'w_north_living', t: 0.28, width: 0.9 },
    { id: 'window_living_south', type: 'window', wallId: 'w_south_living', t: 0.5, width: 1.25, height: 0.85 }
  ],
  items: [
    { id: 'sofa_1', type: 'sofa', name: '\u4e91\u6735\u6c99\u53d1', x: 2.1, z: -1.7, width: 84, depth: 36, height: 32, rotation: 0 },
    { id: 'table_1', type: 'table', name: '\u5706\u8336\u51e0', x: 0.7, z: 1.1, width: 42, depth: 42, height: 20, rotation: 0 },
    { id: 'bed_1', type: 'bed', name: '\u7c89\u8272\u516c\u4e3b\u5e8a', x: -2.4, z: -6.3, width: 76, depth: 88, height: 42, rotation: 0 },
    { id: 'desk_1', type: 'desk', name: '\u84dd\u56fe\u5de5\u4f5c\u684c', x: 3.2, z: -6.2, width: 64, depth: 30, height: 34, rotation: 0 }
  ]
};

const DEFAULT_WALL_COLOR = '#f9fbff';

function wallPoint(wall, t) {
  return {
    x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    z: wall.from[1] + (wall.to[1] - wall.from[1]) * t
  };
}

export class Blueprint3DTestMap extends BlueprintRegistry {
  constructor(scene, options = {}) {
    super(scene, { name: options.name || 'blueprint3dTestMap' });
    this.document = new FloorplanDocument(options.floorplan || BLUEPRINT3D_TEST_FLOORPLAN);
    this.exportService = new ExportService(this.document);
    
    // 初始化独立的 3D 渲染管线
    this.renderingEnabled = options.renderingEnabled !== false;
    this.renderer = new BabylonSceneRenderer(scene, this.document, {
      palette: options.palette || {},
      renderingEnabled: this.renderingEnabled
    });

    this.selectionController = new SelectionController(scene, this.document, this.renderer);
    
    // 代理节点容器 map 指向渲染器内部 map，保证向下兼容性
    this.itemNodes = this.renderer.itemNodes;
    this.wallNodes = this.renderer.wallNodes;
    this.floorNodes = this.renderer.floorNodes;
    this.openingNodes = this.renderer.openingNodes;
    this.openingDragPreviews = this.renderer.openingDragPreviews;
    this.roofNodes = this.renderer.roofNodes;
    this.stairNodes = this.renderer.stairNodes;
    this.fenceNodes = this.renderer.fenceNodes;
    this.fenceGateNodes = this.renderer.fenceGateNodes;
    this.fenceGateDragPreviews = this.renderer.fenceGateDragPreviews;

    this.renderingDirty = true;
    if (this.renderingEnabled) this.build();
  }

  get selectedItemId() { return this.selectionController.selectedItemId; }
  set selectedItemId(val) { this.selectionController.selectedItemId = val; }

  get selectedWallId() { return this.selectionController.selectedWallId; }
  set selectedWallId(val) { this.selectionController.selectedWallId = val; }

  get selectedFenceId() { return this.selectionController.selectedFenceId; }
  set selectedFenceId(val) { this.selectionController.selectedFenceId = val; }

  get selectedFenceGateId() { return this.selectionController.selectedFenceGateId; }
  set selectedFenceGateId(val) { this.selectionController.selectedFenceGateId = val; }

  get selectedRoomId() { return this.selectionController.selectedRoomId; }
  set selectedRoomId(val) { this.selectionController.selectedRoomId = val; }

  get roomSelectionOutlineMesh() { return this.selectionController.roomSelectionOutlineMesh; }
  set roomSelectionOutlineMesh(val) { this.selectionController.roomSelectionOutlineMesh = val; }

  get selectedRoofId() { return this.selectionController.selectedRoofId; }
  set selectedRoofId(val) { this.selectionController.selectedRoofId = val; }

  get selectedStairsId() { return this.selectionController.selectedStairsId; }
  set selectedStairsId(val) { this.selectionController.selectedStairsId = val; }

  // 代理基类的 shadowCasters 与 colliders 到渲染器实例中，保证 primitives 共享同一个引用
  get shadowCasters() {
    return this.renderer ? this.renderer.shadowCasters : [];
  }
  set shadowCasters(val) {
    if (this.renderer) this.renderer.shadowCasters = val;
  }

  get colliders() {
    return this.renderer ? this.renderer.colliders : [];
  }
  set colliders(val) {
    if (this.renderer) this.renderer.colliders = val;
  }

  get floorplan() {
    return this.document.floorplan;
  }

  set floorplan(val) {
    this.document.floorplan = val;
  }

  get enableAdvancedRendering() {
    return this.renderer.enableAdvancedRendering;
  }

  set enableAdvancedRendering(val) {
    this.renderer.enableAdvancedRendering = val;
  }

  setAdvancedRendering(enabled) {
    if (this.renderer) {
      this.renderer.setAdvancedRendering(enabled);
    }
  }

  get materials() {
    return this.renderer.materials;
  }

  set materials(val) {
    this.renderer.materials = val;
  }

  // ----------------------------------------------------
  // 1. 委托给 BabylonSceneRenderer 的场景生成方法
  // ----------------------------------------------------
  enableRendering() {
    this.renderingEnabled = true;
    if (this.renderer) {
      this.renderer.renderingEnabled = true;
    }
    if (this.renderingDirty) {
      this.build();
    }
  }

  disableRendering() {
    this.renderingEnabled = false;
    if (this.renderer) {
      this.renderer.renderingEnabled = false;
    }
  }

  clearBuiltMeshes() {
    this.renderer.clearBuiltMeshes();
    this.roomSelectionOutlineMesh = null;
  }

  buildFloors() {
    this.renderer.buildFloors();
  }

  buildWalls(wallIds = null) {
    this.renderer.buildWalls(wallIds);
  }

  buildOpenings(openingIds = null) {
    this.renderer.buildOpenings(openingIds);
  }

  buildRoofs() {
    this.renderer.buildRoofs();
  }

  buildStairs() {
    this.renderer.buildStairs();
  }

  buildFences(fenceIds = null) {
    this.renderer.buildFences(fenceIds);
  }

  buildFenceGates(gateIds = null) {
    this.renderer.buildFenceGates(gateIds);
  }

  buildItem(item) {
    return this.renderer.buildItem(item);
  }

  applyReflectionToMesh(mesh, itemId, node) {
    this.renderer.applyReflectionToMesh(mesh, itemId, node);
  }

  createMirrorTextureForMesh(mirrorMesh, itemId, node) {
    this.renderer.createMirrorTextureForMesh(mirrorMesh, itemId, node);
  }

  createReflectionProbeForMesh(mirrorMesh, itemId, node) {
    this.renderer.createReflectionProbeForMesh(mirrorMesh, itemId, node);
  }

  restoreStaticReflectionTextureForMesh(mirrorMesh, node) {
    this.renderer.restoreStaticReflectionTextureForMesh(mirrorMesh, node);
  }

  getMeshRoomId(mesh) {
    return this.renderer.getMeshRoomId(mesh);
  }

  build() {
    if (!this.renderingEnabled) {
      this.renderingDirty = true;
      return;
    }
    this.renderingDirty = false;
    this.renderer.build();
    this.setSelectedItem(this.selectedItemId);
    this.setSelectedWall(this.selectedWallId);
    this.setSelectedFence(this.selectedFenceId);
    this.setSelectedFenceGate(this.selectedFenceGateId);
    this.setSelectedRoom(this.selectedRoomId);
    this.setSelectedRoof(this.selectedRoofId);
    this.setSelectedStairs(this.selectedStairsId);
  }

  // ----------------------------------------------------
  // 2. 委托给 FloorplanDocument 的数据状态方法
  // ----------------------------------------------------
  getFloorElevation(floorId) {
    return this.document.getFloorElevation(floorId);
  }

  getWallElevationOffset(wallId) {
    return this.document.getWallElevationOffset(wallId);
  }

  getOpeningElevationOffset(opening) {
    return this.document.getOpeningElevationOffset(opening);
  }

  getFenceElevationOffset(fence) {
    return this.document.getFenceElevationOffset(fence);
  }

  getStairsElevationOffset(stairs) {
    return this.document.getStairsElevationOffset(stairs);
  }

  getStairsAutoHeight(stairs) {
    return this.document.getStairsAutoHeight(stairs);
  }

  getItemRoomElevationOffset(item) {
    return this.document.getItemRoomElevationOffset(item);
  }

  getFloor(floorId) {
    return this.document.getFloor(floorId);
  }

  getFloorLevel(floorId) {
    return this.document.getFloorLevel(floorId);
  }

  isFloorVisible(floorId) {
    return this.document.isFloorVisible(floorId);
  }

  getCurrentFloorRooms() {
    return this.document.getCurrentFloorRooms();
  }

  getCurrentFloorWalls() {
    return this.document.getCurrentFloorWalls();
  }

  getCurrentFloorOpenings() {
    return this.document.getCurrentFloorOpenings();
  }

  getCurrentFloorItems() {
    return this.document.getCurrentFloorItems();
  }

  getCurrentFloorRoofs() {
    return this.document.getCurrentFloorRoofs();
  }

  getCurrentFloorStairs() {
    return this.document.getCurrentFloorStairs();
  }

  // ----------------------------------------------------
  // 3. 编辑器选中、交互与 Drag Previews 状态管理 (已剥离至 SelectionController)
  // ----------------------------------------------------
  setSelectedItem(itemId) {
    this.selectionController.setSelectedItem(itemId);
  }

  setSelectedWall(wallId) {
    this.selectionController.setSelectedWall(wallId);
  }

  setSelectedRoom(roomId) {
    this.selectionController.setSelectedRoom(roomId);
  }

  setSelectedFence(fenceId) {
    this.selectionController.setSelectedFence(fenceId);
  }

  setSelectedFenceGate(gateId) {
    this.selectionController.setSelectedFenceGate(gateId);
  }

  setSelectedRoof(roofId) {
    this.selectionController.setSelectedRoof(roofId);
  }

  setSelectedStairs(stairsId) {
    this.selectionController.setSelectedStairs(stairsId);
  }

  beginOpeningDragPreview(openingId) {
    return this.selectionController.beginOpeningDragPreview(openingId);
  }

  finishOpeningDragPreview(openingId) {
    return this.selectionController.finishOpeningDragPreview(openingId);
  }

  updateOpeningNodePose(openingId) {
    this.selectionController.updateOpeningNodePose(openingId);
  }

  beginFenceGateDragPreview(gateId) {
    return this.selectionController.beginFenceGateDragPreview(gateId);
  }

  syncFenceGateDragPreview(gateId) {
    this.selectionController.syncFenceGateDragPreview(gateId);
  }

  finishFenceGateDragPreview(gateId) {
    return this.selectionController.finishFenceGateDragPreview(gateId);
  }

  updateFenceGateNodeTransform(gateId) {
    this.selectionController.updateFenceGateNodeTransform(gateId);
  }

  requestReflectionProbesUpdate() {
    this.scene.meshes.forEach((mesh) => {
      if (mesh.material && mesh.material.customReflectionProbe) {
        const probe = mesh.material.customReflectionProbe;
        if (probe && probe.cubeTexture && probe.cubeTexture.getRenderTargetTexture) {
          const rtt = probe.cubeTexture.getRenderTargetTexture();
          if (rtt) rtt.resetRefreshCounter();
        }
      }
    });
  }

  // ----------------------------------------------------
  // 4. 数据查询代理方法
  // ----------------------------------------------------
  getRoom(roomId) {
    return this.document.getRoom(roomId);
  }

  getRoomAt(x, z) {
    return this.document.getRoomAt(x, z);
  }

  assignItemToRoom(itemId, roomId) {
    return this.document.assignItemToRoom(itemId, roomId);
  }

  refreshItemRoomLinks() {
    this.document.refreshItemRoomLinks();
  }

  getWall(wallId) {
    return this.document.getWall(wallId);
  }

  getOpening(openingId) {
    return this.document.getOpening(openingId);
  }

  getItem(itemId) {
    return this.document.getItem(itemId);
  }

  getFurnitureDefinition(type) {
    return getFurnitureDefinition(type);
  }

  getFurnitureList() {
    return FURNITURE_LIST;
  }

  // ----------------------------------------------------
  // 5. CRUD 编辑与修改代理
  // ----------------------------------------------------
  setCurrentFloor(floorId) {
    const floor = this.document.setCurrentFloor(floorId);
    this.build();
    return floor;
  }

  addFloor(partialFloor = {}) {
    const floor = this.document.addFloor(partialFloor);
    this.build();
    return floor;
  }

  deleteFloor(floorId) {
    const success = this.document.deleteFloor(floorId);
    if (success) this.build();
    return success;
  }

  moveFloor(floorId, direction) {
    const success = this.document.moveFloor(floorId, direction);
    if (success) this.build();
    return success;
  }

  renameFloor(floorId, name) {
    const floor = this.document.renameFloor(floorId, name);
    if (floor) this.build();
    return floor;
  }

  copyFloorPlanToFloor(sourceFloorId, targetFloorId) {
    this.document.copyFloorPlanToFloor(sourceFloorId, targetFloorId);
    this.build();
  }

  changeFloorHideSettings(floorId, hideRoof, hideWall) {
    const success = this.document.changeFloorHideSettings(floorId, hideRoof, hideWall);
    if (success) this.build();
    return success;
  }

  changeFloorHeight(floorId, height) {
    const success = this.document.changeFloorHeight(floorId, height);
    if (success) this.build();
    return success;
  }

  changeFloorDefaultFloorHeight(floorId, floorHeight) {
    const success = this.document.changeFloorDefaultFloorHeight(floorId, floorHeight);
    if (success) this.build();
    return success;
  }

  addItem(partialItem) {
    const item = this.document.addItem(partialItem);
    this.buildItem(item);
    return item;
  }

  updateItem(itemId, patch) {
    const item = this.document.updateItem(itemId, patch);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  updateItemComponentColor(itemId, componentId, color) {
    const item = this.document.updateItemComponentColor(itemId, componentId, color);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  updateItemComponentMaterial(itemId, componentId, materialDescriptor) {
    const item = this.document.updateItemComponentMaterial(itemId, componentId, materialDescriptor);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  rotateItem(itemId, rotationRadians) {
    const item = this.document.rotateItem(itemId, rotationRadians);
    if (!item) return null;
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, false);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  deleteItem(itemId) {
    const oldNode = this.itemNodes.get(itemId);
    const success = this.document.deleteItem(itemId);
    if (success) {
      if (oldNode) oldNode.dispose(false, false);
      this.itemNodes.delete(itemId);
    }
    return success;
  }

  addWall(from, to) {
    const wall = this.document.addWall(from, to);
    this.build();
    return wall;
  }

  getWallLength(wallId) {
    return this.document.getWallLength(wallId);
  }

  updateWallLength(wallId, length) {
    const wall = this.document.updateWallLength(wallId, length);
    if (wall) this.build();
    return wall;
  }

  setWallLength(wallId, length) {
    return this.updateWallLength(wallId, length);
  }

  updateWall(wallId, patch, options = {}) {
    const wall = this.document.updateWall(wallId, patch);
    if (wall && options.rebuild !== false) {
      this.build();
    }
    return wall;
  }

  setWallColor(wallId, color) {
    return this.updateWall(wallId, { color, material: color });
  }

  deleteWall(wallId) {
    this.document.deleteWall(wallId);
    this.build();
  }

  syncRoomWalls(room, createMissing = false) {
    const result = this.document.syncRoomWalls(room, createMissing);
    this.build();
    return result;
  }

  addRoom(partialRoom = {}) {
    const room = this.document.addRoom(partialRoom);
    this.build();
    return room;
  }

  moveRoom(roomId, dx, dz) {
    const room = this.document.moveRoom(roomId, dx, dz);
    if (room) this.build();
    return room;
  }

  updateRoom(roomId, patch, options = {}) {
    const room = this.document.updateRoom(roomId, patch, options);
    if (room && options.rebuild !== false) {
      this.build();
    }
    return room;
  }

  deleteRoom(roomId) {
    const success = this.document.deleteRoom(roomId);
    if (success) this.build();
    return success;
  }

  addRoof(partialRoof = {}) {
    const roof = this.document.addRoof(partialRoof);
    this.build();
    return roof;
  }

  addStairs(partialStairs = {}) {
    const stairs = this.document.addStairs(partialStairs);
    this.build();
    return stairs;
  }

  getRoof(roofId) {
    return this.document.getRoof(roofId);
  }

  updateRoof(roofId, patch, rebuild = true) {
    const roof = this.document.updateRoof(roofId, patch);
    if (roof && rebuild) this.build();
    return roof;
  }

  deleteRoof(roofId) {
    const success = this.document.deleteRoof(roofId);
    if (success) this.build();
    return success;
  }

  getStairs(stairsId) {
    return this.document.getStairs(stairsId);
  }

  updateStairs(stairsId, patch, rebuild = true) {
    const stairs = this.document.updateStairs(stairsId, patch);
    if (stairs && rebuild) this.build();
    return stairs;
  }

  deleteStairs(stairsId) {
    const success = this.document.deleteStairs(stairsId);
    if (success) this.build();
    return success;
  }

  addFence(partialFence = {}) {
    const fence = this.document.addFence(partialFence);
    this.build();
    return fence;
  }

  getFence(fenceId) {
    return this.document.getFence(fenceId);
  }

  updateFence(fenceId, patch, rebuild = true) {
    const fence = this.document.updateFence(fenceId, patch);
    if (fence && rebuild) this.build();
    return fence;
  }

  deleteFence(fenceId) {
    const success = this.document.deleteFence(fenceId);
    if (success) this.build();
    return success;
  }

  addFenceGate(partialFenceGate = {}) {
    const gate = this.document.addFenceGate(partialFenceGate);
    this.build();
    return gate;
  }

  getFenceGate(gateId) {
    return this.document.getFenceGate(gateId);
  }

  updateFenceGate(gateId, patch, rebuild = true) {
    const gate = this.document.updateFenceGate(gateId, patch);
    if (!gate) return null;
    if (rebuild) {
      this.build();
    } else {
      this.updateFenceGateNodeTransform(gateId);
    }
    return gate;
  }

  deleteFenceGate(gateId) {
    const success = this.document.deleteFenceGate(gateId);
    if (success) this.build();
    return success;
  }

  addOpening(wallId, type = 'door', t = 0.5, shape = 'square') {
    const opening = this.document.addOpening(wallId, type, t, shape);
    if (opening) this.build();
    return opening;
  }

  updateOpening(openingId, patch, rebuild = true) {
    const opening = this.document.updateOpening(openingId, patch);
    if (opening) {
      if (rebuild) {
        this.build();
      } else {
        this.updateOpeningNodePose(openingId);
      }
    }
    return opening;
  }

  deleteOpening(openingId) {
    const success = this.document.deleteOpening(openingId);
    if (success) this.build();
    return success;
  }

  setFloorColor(color) {
    this.document.setFloorColor(color);
    this.materials.floor.diffuseColor = BABYLON.Color3.FromHexString(color);
    this.build();
  }

  setRoomFloorMaterial(roomId, materialDescriptor) {
    const room = this.document.setRoomFloorMaterial(roomId, materialDescriptor);
    if (room) this.build();
    return room;
  }

  setFloorMaterial(materialDescriptor) {
    this.document.setFloorMaterial(materialDescriptor);
    this.build();
  }

  exportJSON() {
    return this.exportService.exportJSON();
  }

  exportBuildingFile(options = {}) {
    return this.exportService.exportBuildingFile(options);
  }

  stringifyBuildingFile(options = {}) {
    return this.exportService.stringifyBuildingFile(options);
  }

  stringifyDXF() {
    return this.exportService.stringifyDXF();
  }

  create3MFPackage(options = {}) {
    return this.exportService.create3MFPackage(options);
  }

  loadBuildingFile(fileData) {
    this.exportService.loadBuildingFile(fileData);
    this.selectedItemId = this.selectedItemId && this.getItem(this.selectedItemId) ? this.selectedItemId : null;
    this.selectedWallId = this.selectedWallId && this.getWall(this.selectedWallId) ? this.selectedWallId : null;
    this.build();
  }

  loadJSON(floorplan) {
    this.exportService.loadJSON(floorplan);
    this.selectedItemId = this.selectedItemId && this.getItem(this.selectedItemId) ? this.selectedItemId : null;
    this.selectedWallId = this.selectedWallId && this.getWall(this.selectedWallId) ? this.selectedWallId : null;
    this.build();
  }
}

export { FURNITURE_DEFINITIONS, FURNITURE_LIST, FENCE_SUBTYPE_DEFAULTS };

export function buildBlueprint3DTestMap(scene, options = {}) {
  return new Blueprint3DTestMap(scene, options);
}
