import { CSG, Color3, MaterialPluginBase, Mesh, MeshBuilder, MirrorTexture, Plane, PointLight, ReflectionProbe, RenderTargetTexture, ShaderLanguage, SpotLight, Texture, TransformNode, Vector3, VertexBuffer, VertexData } from '../core/babylon.js';
const BABYLON = { CSG, Color3, MaterialPluginBase, Mesh, MeshBuilder, MirrorTexture, Plane, PointLight, ReflectionProbe, RenderTargetTexture, ShaderLanguage, SpotLight, Texture, TransformNode, Vector3, VertexBuffer, VertexData };
import { createFlatMaterial, createBlueprintMaterial, materialPreviewColor, normalizeMaterialDescriptor } from '../core/materials.js';
import { MaterialResolver } from '../domain/MaterialResolver.js';
import { createBox, createCylinder, createSphere } from '../core/primitives.js';
import { FURNITURE_DEFINITIONS, FURNITURE_LIST, getFurnitureDefinition, isAppliancePowerOn } from '../furniture/index.js';
import { healingMusic } from '../audio/healingMusic.js';
import { DEFAULT_MATERIAL_PACKS } from '../core/materialCatalog.js';
import { buildOpeningGeometry, createOpeningCutterMesh, normalizeOpeningShape } from '../openings/index.js';
import { getRoofGeometryData } from '../geometry/roofGeometry.js';
import { buildStairsGeometry } from '../geometry/stairsGeometry.js';
import { buildFenceGeometry } from '../geometry/fenceGeometry.js';
import { buildFenceGateGeometry } from '../geometry/fenceGateGeometry.js';
import { shouldIncludeShadowCaster } from './shadowCasterFilter.js';
import {
  normalizeRoomShape,
  getRoomVertices,
  getRoomBounds,
  getRoomWallKeys,
  pointInRoom,
  triangulateRoom
} from '../rooms/index.js';

const INCHES_PER_UNIT = 39.37;
const DEFAULT_WALL_COLOR = '#f9fbff';
const DEFAULT_FLOOR_COLOR = '#d2b48c';
const DEFAULT_FLOOR_ID = 'floor_1';
const DEFAULT_WALL_BASEBOARD_HEIGHT = 0.1;
const DEFAULT_WALL_WAINSCOT_HEIGHT = 1.0;

const WALL_SURFACE_FIELD_MAP = MaterialResolver.WALL_SURFACE_FIELD_MAP;

function normalizeWallDecorSettings(wall) {
  return MaterialResolver.normalizeWallDecorSettings(wall);
}

function getWallSurfaceFields(side, component = 'main') {
  return MaterialResolver.getWallSurfaceFields(side, component);
}

function resolveWallSurfaceDescriptor(wall, side, component = 'main') {
  return MaterialResolver.resolveWallSurfaceDescriptor(wall, side, component);
}

function getWallFaceBands(wall, wallHeight, floorHeight = 0) {
  const bands = [];
  let cursor = -floorHeight;

  if (wall.baseboardEnabled) {
    const baseboardEnd = Math.min(wallHeight, Math.max(0, Number(wall.baseboardHeight) || 0));
    if (baseboardEnd > cursor + 0.001) {
      bands.push({ component: 'baseboard', yStart: cursor, yEnd: baseboardEnd });
      cursor = baseboardEnd;
    }
  }

  if (wall.wainscotEnabled) {
    const minWainscotStart = wall.baseboardEnabled ? Math.max(0, Number(wall.baseboardHeight) || 0) : 0;
    const wainscotEnd = Math.min(wallHeight, Math.max(minWainscotStart, Number(wall.wainscotHeight) || 0));
    if (wainscotEnd > cursor + 0.001) {
      bands.push({ component: 'wainscot', yStart: cursor, yEnd: wainscotEnd });
      cursor = wainscotEnd;
    }
  }

  if (wallHeight > cursor + 0.001) {
    bands.push({ component: 'main', yStart: cursor, yEnd: wallHeight });
  }

  return bands;
}

function inchesToUnits(value) {
  return Number(value || 0) / INCHES_PER_UNIT;
}

function wallPoint(wall, t) {
  return {
    x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    z: wall.from[1] + (wall.to[1] - wall.from[1]) * t
  };
}

function normalizeWallSegmentMesh(mesh) {
  if (!mesh) return mesh;
  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  if (positions && indices) {
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
  }
  mesh.receiveShadows = false;
  mesh.doNotSyncBoundingInfo = false;
  mesh.refreshBoundingInfo();
  return mesh;
}

function mapWallSegmentUV(mesh, { originX, originZ, axisX, axisZ, xMin, xMax, yMin, yMax }) {
  if (!mesh) return mesh;
  const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  if (!positions) return mesh;
  const width = Math.max(0.001, xMax - xMin);
  const height = Math.max(0.001, yMax - yMin);
  mesh.computeWorldMatrix(true);
  const worldMatrix = mesh.getWorldMatrix();
  const uvs = new Array((positions.length / 3) * 2);

  for (let index = 0; index < positions.length; index += 3) {
    const world = BABYLON.Vector3.TransformCoordinates(
      new BABYLON.Vector3(positions[index], positions[index + 1], positions[index + 2]),
      worldMatrix
    );
    const wallX = (world.x - originX) * axisX + (world.z - originZ) * axisZ;
    const uvIndex = (index / 3) * 2;
    uvs[uvIndex] = (wallX - xMin) / width;
    uvs[uvIndex + 1] = (world.y - yMin) / height;
  }

  mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
  return mesh;
}

const OPENING_PREVIEW_SHAPE_INDEX = Object.freeze({
  square: 0,
  diamond: 1,
  circle: 2,
  semicircle: 3,
  'round-arch': 4,
  'pointed-arch': 5,
  'quarter-sector': 6,
  'right-triangle': 7
});

export class OpeningHolePreviewPlugin extends BABYLON.MaterialPluginBase {
  constructor(material, renderer, openingId) {
    super(material, `OpeningHolePreview_${openingId}`, 210, {}, true, true);
    this.renderer = renderer;
    this.openingId = openingId;
  }

  isCompatible(shaderLanguage) {
    return shaderLanguage === BABYLON.ShaderLanguage.GLSL;
  }

  getUniforms() {
    return {
      ubo: [
        { name: 'openingPreviewTransform', size: 4, type: 'vec4' },
        { name: 'openingPreviewMetrics', size: 4, type: 'vec4' }
      ],
      fragment: `
        uniform vec4 openingPreviewTransform;
        uniform vec4 openingPreviewMetrics;
      `
    };
  }

  bindForSubMesh(uniformBuffer) {
    const opening = this.renderer.document.getOpening(this.openingId);
    const wall = opening ? this.renderer.document.getWall(opening.wallId) : null;
    if (!opening || !wall) {
      uniformBuffer.updateFloat4('openingPreviewMetrics', -100000, 1, 1, 0);
      return;
    }

    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz) || 1;
    const t = opening.t ?? 0.5;
    const centerX = x1 + dx * t;
    const centerZ = z1 + dz * t;
    const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const bottomY = this.renderer.document.getFloorElevation(opening.floorId || wall.floorId)
      + this.renderer.document.getOpeningElevationOffset(opening)
      + sillHeight;
    const shapeIndex = OPENING_PREVIEW_SHAPE_INDEX[normalizeOpeningShape(opening.shape)] ?? 0;

    uniformBuffer.updateFloat4('openingPreviewTransform', centerX, centerZ, dx / length, dz / length);
    uniformBuffer.updateFloat4('openingPreviewMetrics', bottomY, width, height, shapeIndex);
  }

  getCustomCode(shaderType) {
    if (shaderType !== 'fragment') return null;
    return {
      CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
        vec2 openingPreviewDelta = vPositionW.xz - openingPreviewTransform.xy;
        float openingPreviewX = dot(openingPreviewDelta, openingPreviewTransform.zw) / openingPreviewMetrics.y;
        float openingPreviewY = (vPositionW.y - openingPreviewMetrics.x) / openingPreviewMetrics.z;
        float openingPreviewShape = openingPreviewMetrics.w;
        bool openingPreviewInside = false;
        if (openingPreviewY >= 0.0 && openingPreviewY <= 1.0) {
          if (openingPreviewShape < 0.5) {
            openingPreviewInside = abs(openingPreviewX) <= 0.5;
          } else if (openingPreviewShape < 1.5) {
            openingPreviewInside = abs(openingPreviewX) + abs(openingPreviewY - 0.5) <= 0.5;
          } else if (openingPreviewShape < 2.5) {
            vec2 circlePoint = vec2(openingPreviewX, openingPreviewY - 0.5);
            openingPreviewInside = dot(circlePoint, circlePoint) <= 0.25;
          } else if (openingPreviewShape < 3.5) {
            openingPreviewInside = 4.0 * openingPreviewX * openingPreviewX + openingPreviewY * openingPreviewY <= 1.0;
          } else if (openingPreviewShape < 4.5) {
            openingPreviewInside = abs(openingPreviewX) <= 0.5 && (
              openingPreviewY <= 0.68 ||
              4.0 * openingPreviewX * openingPreviewX +
                pow((openingPreviewY - 0.68) / 0.32, 2.0) <= 1.0
            );
          } else if (openingPreviewShape < 5.5) {
            float pointedHalfWidth = openingPreviewY <= 0.7
              ? 0.5
              : (1.0 - openingPreviewY) * (0.5 / 0.3);
            openingPreviewInside = abs(openingPreviewX) <= pointedHalfWidth;
          } else if (openingPreviewShape < 6.5) {
            vec2 sectorPoint = vec2(openingPreviewX + 0.5, openingPreviewY);
            openingPreviewInside = sectorPoint.x >= 0.0 && dot(sectorPoint, sectorPoint) <= 1.0;
          } else {
            openingPreviewInside = openingPreviewX >= -0.5 && openingPreviewX <= 0.5 - openingPreviewY;
          }
        }
        if (openingPreviewInside) discard;
      `
    };
  }
}

export class FenceGateGapPreviewPlugin extends BABYLON.MaterialPluginBase {
  constructor(material, renderer, gateId, fenceId) {
    super(material, `FenceGateGapPreview_${gateId}_${fenceId}`, 211, {}, true, true);
    this.renderer = renderer;
    this.gateId = gateId;
    this.fenceId = fenceId;
  }

  isCompatible(shaderLanguage) {
    return shaderLanguage === BABYLON.ShaderLanguage.GLSL;
  }

  getUniforms() {
    return {
      ubo: [
        { name: 'fenceGatePreviewTransform', size: 4, type: 'vec4' },
        { name: 'fenceGatePreviewMetrics', size: 2, type: 'vec2' }
      ],
      fragment: `
        uniform vec4 fenceGatePreviewTransform;
        uniform vec2 fenceGatePreviewMetrics;
      `
    };
  }

  bindForSubMesh(uniformBuffer) {
    const gate = this.renderer.document.getFenceGate(this.gateId);
    const fence = this.renderer.document.getFence(this.fenceId);
    if (!gate || !fence || gate.fenceId !== fence.id) {
      uniformBuffer.updateFloat2('fenceGatePreviewMetrics', -1, 0);
      return;
    }

    const [x1, z1] = fence.from;
    const [x2, z2] = fence.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz) || 1;
    const centerX = (gate.from[0] + gate.to[0]) / 2;
    const centerZ = (gate.from[1] + gate.to[1]) / 2;
    uniformBuffer.updateFloat4('fenceGatePreviewTransform', centerX, centerZ, dx / length, dz / length);
    uniformBuffer.updateFloat2('fenceGatePreviewMetrics', (gate.width || 1) / 2, 1);
  }

  getCustomCode(shaderType) {
    if (shaderType !== 'fragment') return null;
    return {
      CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
        if (fenceGatePreviewMetrics.y > 0.5) {
          vec2 fenceGatePreviewDelta = vPositionW.xz - fenceGatePreviewTransform.xy;
          float fenceGatePreviewX = dot(fenceGatePreviewDelta, fenceGatePreviewTransform.zw);
          if (abs(fenceGatePreviewX) <= fenceGatePreviewMetrics.x) discard;
        }
      `
    };
  }
}

export class BabylonSceneRenderer {
  constructor(scene, document, options = {}) {
    this.scene = scene;
    this.document = document;
    this.name = options.name || 'babylonSceneRenderer';
    this.root = options.root || new BABYLON.TransformNode(`${this.name}Root`, scene);

    this.itemNodes = new Map();
    this.wallNodes = new Map();
    this.floorNodes = new Map();
    this.openingNodes = new Map();
    this.openingDragPreviews = new Map();
    this.roofNodes = new Map();
    this.stairNodes = new Map();
    this.fenceNodes = new Map();
    this.fenceGateNodes = new Map();
    this.fenceGateDragPreviews = new Map();

    this.shadowCasters = [];
    this.colliders = [];
    this.materialCache = new Map();
    this.enableAdvancedRendering = false;
    this.renderingEnabled = options.renderingEnabled !== false;
    this._disposed = false;
    this._readyTasks = new Set();

    this.materials = this.createMaterials(options.palette || {});
  }

  get isDisposed() {
    return this._disposed;
  }

  executeWhenReady(work, { onCancel = null, previewResource = false } = {}) {
    if (this._disposed) {
      if (onCancel) onCancel();
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const task = { resolve, onCancel, previewResource, settled: false };
      this._readyTasks.add(task);
      const finish = (result) => {
        if (task.settled) return;
        task.settled = true;
        this._readyTasks.delete(task);
        resolve(result);
      };
      task.cancel = () => {
        if (task.settled) return;
        try {
          task.onCancel?.();
        } finally {
          finish(false);
        }
      };

      try {
        this.scene.executeWhenReady(() => {
          if (task.settled) return;
          if (this._disposed || this.scene?.isDisposed === true || this.scene?._isDisposed === true) {
            task.cancel();
            return;
          }
          try {
            work();
            finish(true);
          } catch (error) {
            console.error('Deferred renderer work failed:', error);
            finish(false);
          }
        });
      } catch (error) {
        console.error('Unable to schedule renderer work:', error);
        task.cancel();
      }
    });
  }

  cancelReadyWork() {
    [...this._readyTasks].forEach((task) => task.cancel());
  }

  getEntityNode(type, id) {
    const normalized = String(type || '').toLowerCase();
    const maps = {
      item: this.itemNodes,
      items: this.itemNodes,
      wall: this.wallNodes,
      walls: this.wallNodes,
      room: this.floorNodes,
      rooms: this.floorNodes,
      opening: this.openingNodes,
      openings: this.openingNodes,
      roof: this.roofNodes,
      roofs: this.roofNodes,
      stair: this.stairNodes,
      stairs: this.stairNodes,
      fence: this.fenceNodes,
      fences: this.fenceNodes,
      fencegate: this.fenceGateNodes,
      fencegates: this.fenceGateNodes,
      fencegate: this.fenceGateNodes,
      fencegates: this.fenceGateNodes,
      fence_gate: this.fenceGateNodes,
      fence_gates: this.fenceGateNodes,
    };
    return maps[normalized]?.get(id) || null;
  }

  getEntityWorldTransform(type, id) {
    const node = this.getEntityNode(type, id);
    if (!node) return null;
    const position = node.getAbsolutePosition ? node.getAbsolutePosition() : node.position;
    return {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: node.rotation?.x || 0, y: node.rotation?.y || 0, z: node.rotation?.z || 0 },
      scaling: { x: node.scaling?.x ?? 1, y: node.scaling?.y ?? 1, z: node.scaling?.z ?? 1 }
    };
  }

  setEntityLocked(type, id, locked) {
    const node = this.getEntityNode(type, id);
    if (!node) return false;
    node.metadata = { ...(node.metadata || {}), locked: !!locked };
    return true;
  }

  getPreviewResourceCount() {
    const pendingResources = [...this._readyTasks].filter((task) => task.previewResource).length;
    return this.openingDragPreviews.size + this.fenceGateDragPreviews.size + pendingResources;
  }

  syncEntityPreview(type, id) {
    if (this._disposed) return false;
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'item' || normalized === 'items') return this._syncItemPreview(id);
    if (normalized === 'room' || normalized === 'rooms') return this._syncRoomPreview(id);
    if (normalized === 'wall' || normalized === 'walls') return this._syncWallPreview(id);
    if (normalized === 'opening' || normalized === 'openings') return this._syncOpeningPreview(id);
    if (normalized === 'fence' || normalized === 'fences') return this._syncFencePreview(id);
    if (normalized === 'fencegate' || normalized === 'fencegates' || normalized === 'fence_gate' || normalized === 'fence_gates') return this._syncFenceGatePreview(id);
    if (normalized === 'roof' || normalized === 'roofs') return this._syncRoofPreview(id);
    if (normalized === 'stair' || normalized === 'stairs') return this._syncStairsPreview(id);
    return false;
  }

  _syncItemPreview(id) {
    const item = this.document.getItem(id);
    const node = this.getEntityNode('item', id);
    if (!item || !node) return false;
    const floorY = this.document.getFloorElevation(item.floorId || this.floorplan.currentFloorId);
    const roomOffset = this.document.getItemRoomElevationOffset(item);
    node.position.set(item.x, floorY + (item.elevation || 0) + roomOffset, item.z);
    if (item.rotation !== undefined) node.rotation.y = item.rotation;
    return true;
  }

  _applyRoomPolygonGeometry(mesh, room, height, centerY) {
    if (!mesh) return;
    const { vertices, triangles } = triangulateRoom(room);
    if (vertices.length < 3 || !triangles.length) return;
    const positions = [];
    const indices = [];
    const uvs = [];
    const halfHeight = height / 2;
    vertices.forEach((point) => {
      positions.push(point.x, centerY + halfHeight, point.z);
      uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
    });
    vertices.forEach((point) => {
      positions.push(point.x, centerY - halfHeight, point.z);
      uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
    });
    const bottomOffset = vertices.length;
    triangles.forEach(([a, b, c]) => {
      indices.push(a, b, c, bottomOffset + a, bottomOffset + c, bottomOffset + b);
    });
    vertices.forEach((point, index) => {
      const next = vertices[(index + 1) % vertices.length];
      const sideOffset = positions.length / 3;
      positions.push(
        point.x, centerY + halfHeight, point.z,
        next.x, centerY + halfHeight, next.z,
        next.x, centerY - halfHeight, next.z,
        point.x, centerY - halfHeight, point.z
      );
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      // Room vertices wind around the footprint with the interior on the
      // left-hand side of each edge. Reverse the side triangles so their
      // front faces and normals point away from the room. With back-face
      // culling enabled, inward-facing sides disappear from exterior views.
      indices.push(sideOffset, sideOffset + 2, sideOffset + 1, sideOffset, sideOffset + 3, sideOffset + 2);
    });
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.applyToMesh(mesh);
  }

  _syncRoomPreview(id) {
    const room = this.document.getRoom(id);
    const node = this.getEntityNode('room', id);
    if (!room || !node) return false;
    const floorY = this.document.getFloorElevation(room.floorId || this.floorplan.currentFloorId);
    const height = this.document.getFloorHeight(room.floorId);
    node.position.set(room.x, floorY - height / 2, room.z);
    const children = node.getChildren ? node.getChildren() : [];
    this._applyRoomPolygonGeometry(children.find((child) => child.name?.endsWith('_shape')), room, height, room.elevation || 0);
    this._applyRoomPolygonGeometry(children.find((child) => child.name?.endsWith('_ceiling')), room, 0.002, -height / 2 - 0.001);
    node.scaling.set(1, 1, 1);

    new Set(Object.values(room.wallIds || {})).forEach((wallId) => this._syncWallPreview(wallId));
    this.floorplan.items.forEach((item) => {
      if (item.roomId === id) this._syncItemPreview(item.id);
    });
    return true;
  }

  _syncWallPreview(id) {
    const wall = this.document.getWall(id);
    const node = this.getEntityNode('wall', id);
    if (!wall || !node) return false;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    node.position.set(x1, 0, z1);
    const length = Math.hypot(x2 - x1, z2 - z1);
    node.scaling.x = length / (node.metadata?.originalLength || length || 1);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    this.floorplan.openings.forEach((opening) => {
      if (opening.wallId === id) this._syncOpeningPreview(opening.id);
    });
    return true;
  }

  _syncOpeningPreview(id) {
    const opening = this.document.getOpening(id);
    const node = this.getEntityNode('opening', id);
    const wall = opening ? this.document.getWall(opening.wallId) : null;
    if (!opening || !node || !wall) return false;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const t = opening.t ?? 0.5;
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const floorY = this.document.getFloorElevation(opening.floorId || wall.floorId);
    node.position.set(
      x1 + (x2 - x1) * t,
      floorY + sillHeight + height / 2 + this.document.getOpeningElevationOffset(opening),
      z1 + (z2 - z1) * t
    );
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    return true;
  }

  _syncFencePreview(id) {
    const fence = this.document.getFence(id);
    const node = this.getEntityNode('fence', id);
    if (!fence || !node) return false;
    const [x1, z1] = fence.from;
    const [x2, z2] = fence.to;
    const floorY = this.document.getFloorElevation(fence.floorId || this.floorplan.currentFloorId);
    node.position.set((x1 + x2) / 2, floorY + this.document.getFenceElevationOffset(fence) + (fence.yOffset || 0), (z1 + z2) / 2);
    const length = Math.hypot(x2 - x1, z2 - z1);
    node.scaling.x = length / (node.metadata?.originalLength || length || 1);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    node.rotation.z = fence.tilt || 0;
    return true;
  }

  _syncFenceGatePreview(id) {
    const gate = this.document.getFenceGate(id);
    const node = this.getEntityNode('fenceGate', id);
    if (!gate || !node) return false;
    let [x1, z1] = gate.from || [0, 0];
    let [x2, z2] = gate.to || [1, 0];
    const fence = gate.fenceId ? this.document.getFence(gate.fenceId) : null;
    if (fence) {
      const [fx1, fz1] = fence.from;
      const [fx2, fz2] = fence.to;
      const dx = fx2 - fx1;
      const dz = fz2 - fz1;
      const halfT = gate.width / (Math.hypot(dx, dz) || 1) / 2;
      const t1 = Math.max(0, gate.t - halfT);
      const t2 = Math.min(1, gate.t + halfT);
      x1 = fx1 + dx * t1;
      z1 = fz1 + dz * t1;
      x2 = fx1 + dx * t2;
      z2 = fz1 + dz * t2;
    }
    const floorY = this.document.getFloorElevation(gate.floorId);
    node.position.set((x1 + x2) / 2, floorY + (fence ? this.document.getFenceElevationOffset(fence) : 0) + (gate.yOffset || 0), (z1 + z2) / 2);
    node.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    node.rotation.z = gate.tilt || fence?.tilt || 0;
    this.syncFenceGateDragPreview(id);
    return true;
  }

  syncFenceGateDragPreview(gateId) {
    const preview = this.fenceGateDragPreviews.get(gateId);
    const gate = this.document.getFenceGate(gateId);
    if (!preview || !gate || !gate.fenceId || preview.affectedFenceIds.has(gate.fenceId)) return false;
    const fenceNode = this.fenceNodes.get(gate.fenceId);
    if (!fenceNode) return false;

    preview.affectedFenceIds.add(gate.fenceId);
    preview.fenceNodes.set(gate.fenceId, fenceNode);
    const materials = [
      ...fenceNode.getChildMeshes().map((mesh) => mesh.material),
      ...(gate.fenceId === preview.sourceFenceId ? preview.root.getChildMeshes().map((mesh) => mesh.material) : [])
    ].filter(Boolean);
    [...new Set(materials)].forEach((material) => {
      if (preview.pluginMaterials.has(material)) return;
      preview.pluginMaterials.add(material);
      preview.plugins.push(new FenceGateGapPreviewPlugin(material, this, gateId, gate.fenceId));
    });
    return true;
  }

  _syncRoofPreview(id) {
    const roof = this.document.getRoof(id);
    const node = this.getEntityNode('roof', id);
    if (!roof || !node) return false;
    node.position.x = roof.x || 0;
    node.position.z = roof.z || 0;
    if (roof.rotation !== undefined) node.rotation.y = roof.rotation;
    return true;
  }

  _syncStairsPreview(id) {
    const stairs = this.document.getStairs(id);
    const node = this.getEntityNode('stairs', id);
    if (!stairs || !node) return false;
    const floorY = this.document.getFloorElevation(stairs.floorId || this.floorplan.currentFloorId);
    node.position.set(stairs.x || 0, floorY + this.document.getStairsElevationOffset(stairs), stairs.z || 0);
    if (stairs.rotation !== undefined) node.rotation.y = stairs.rotation;
    return true;
  }

  get floorplan() {
    return this.document.floorplan;
  }

  createMaterials(palette) {
    return {
      floor: createFlatMaterial(this.scene, 'blueprintFloor', palette.floor || this.floorplan.floor.color),
      selected: createFlatMaterial(this.scene, 'blueprintSelected', palette.selected || '#36c2ff', { emissive: true }),
      door: createFlatMaterial(this.scene, 'blueprintDoor', palette.door || '#8c5a32'),
      window: createFlatMaterial(this.scene, 'blueprintWindow', palette.window || '#75d7ff', { alpha: 0.38, emissive: true, backFaceCulling: false }),
      trim: createFlatMaterial(this.scene, 'blueprintTrim', palette.trim || '#b8c4d4'),
      decor: createFlatMaterial(this.scene, 'blueprintDecor', palette.decor || '#ffffff'),
      roof: createFlatMaterial(this.scene, 'blueprintRoof', palette.roof || '#b75b54'),
      stair: createFlatMaterial(this.scene, 'blueprintStair', palette.stair || '#d8c0a0')
    };
  }

  deferRenderWork() {
    return !this.renderingEnabled;
  }

  setAdvancedRendering(enabled) {
    this.enableAdvancedRendering = !!enabled;
    this.scene.meshes.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat) return;
      const bpMaterial = mat.metadata?.blueprintMaterial;
      if (bpMaterial?.kind === 'mirror' || bpMaterial?.kind === 'metal') {
        const itemId = mesh.metadata?.itemId || null;
        const node = itemId ? this.itemNodes.get(itemId) : null;
        this.applyReflectionToMesh(mesh, itemId, node);
      }
    });
  }

  requestReflectionTexturesUpdate() {
    const refreshedTextures = new Set();
    const refreshedProbes = new Set();

    this.scene.meshes.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat) return;

      const reflectionTexture = mat.reflectionTexture;
      if (reflectionTexture instanceof BABYLON.MirrorTexture && !refreshedTextures.has(reflectionTexture)) {
        reflectionTexture.resetRefreshCounter();
        refreshedTextures.add(reflectionTexture);
      }

      const probe = mat.customReflectionProbe;
      if (!probe || refreshedProbes.has(probe)) return;

      const renderTarget = probe.cubeTexture;
      if (renderTarget?.resetRefreshCounter) {
        renderTarget.resetRefreshCounter();
      }
      refreshedProbes.add(probe);
    });
  }


  add(node, options = {}) {
    if (!node) return node;
    node.parent = options.parent || this.root;

    if (options.material) node.material = options.material;
    if (options.receiveShadows) node.receiveShadows = true;
    if (options.shadowCaster !== false && node.getClassName && node.getClassName() !== 'TransformNode') {
      this.shadowCasters.push(node);
    }
    if (options.collider) this.colliders.push(options.collider);

    return node;
  }

  addCollider(collider) {
    this.colliders.push(collider);
    return collider;
  }

  collectNodeMaterials(node) {
    const materials = new Set();
    if (!node || node.isDisposed?.()) return materials;
    const meshes = node.getChildMeshes ? node.getChildMeshes(false) : [];
    if (node.material) meshes.unshift(node);
    meshes.forEach((mesh) => {
      if (mesh?.material) materials.add(mesh.material);
    });
    return materials;
  }

  disposeMaterials(materials, { preserveCached = false, usedByOtherMeshes = null } = {}) {
    const persistentMaterials = new Set(Object.values(this.materials || {}));
    const cachedMaterials = preserveCached ? new Set(this.materialCache?.values?.() || []) : new Set();
    materials.forEach((material) => {
      if (!material || material.isDisposed || persistentMaterials.has(material) || cachedMaterials.has(material)) return;
      if (usedByOtherMeshes?.has(material)) return;
      // Material textures are per-material clones. Disposing the wrappers releases
      // their GPU references while the scene-level base texture cache stays alive.
      material.dispose(false, true);
    });
  }

  disposeNodeMaterials(node, { preserveCached = true } = {}) {
    const nodeMeshes = new Set(node?.getChildMeshes ? node.getChildMeshes(false) : []);
    const materials = this.collectNodeMaterials(node);
    const usedByOtherMeshes = new Set();
    this.root?.getChildMeshes?.(false).forEach((mesh) => {
      if (!nodeMeshes.has(mesh) && mesh.material) usedByOtherMeshes.add(mesh.material);
    });
    this.disposeMaterials(materials, { preserveCached, usedByOtherMeshes });
  }

  collectBuiltMaterials() {
    const materials = this.collectNodeMaterials(this.root);
    const nodeMaps = [
      this.itemNodes,
      this.wallNodes,
      this.floorNodes,
      this.openingNodes,
      this.roofNodes,
      this.stairNodes,
      this.fenceNodes,
      this.fenceGateNodes
    ];
    nodeMaps.forEach((nodeMap) => {
      nodeMap?.forEach((node) => {
        this.collectNodeMaterials(node).forEach((material) => materials.add(material));
      });
    });
    this.openingDragPreviews.forEach((preview) => {
      this.collectNodeMaterials(preview.root).forEach((material) => materials.add(material));
    });
    this.fenceGateDragPreviews.forEach((preview) => {
      this.collectNodeMaterials(preview.root).forEach((material) => materials.add(material));
    });
    return materials;
  }

  clearBuiltMeshes() {
    const builtMaterials = this.collectBuiltMaterials();
    if (this.materialCache) {
      this.materialCache.forEach((mat) => {
        if (mat) builtMaterials.add(mat);
      });
      this.materialCache.clear();
    }
    this.disposeMaterials(builtMaterials);
    this.openingDragPreviews.forEach((preview) => preview.root?.dispose(false, false));
    this.fenceGateDragPreviews.forEach((preview) => preview.root?.dispose(false, false));
    this.itemNodes.forEach((node) => node.dispose(false, false));
    this.wallNodes.forEach((node) => node.dispose(false, false));
    this.floorNodes.forEach((node) => node.dispose(false, false));
    this.openingNodes.forEach((node) => node.dispose(false, false));
    this.roofNodes.forEach((node) => node.dispose(false, false));
    this.stairNodes.forEach((node) => node.dispose(false, false));
    this.fenceNodes.forEach((node) => node.dispose(false, false));
    this.fenceGateNodes.forEach((node) => node.dispose(false, false));
    this.itemNodes.clear();
    this.wallNodes.clear();
    this.floorNodes.clear();
    this.openingNodes.clear();
    this.openingDragPreviews.clear();
    this.roofNodes.clear();
    this.stairNodes.clear();
    this.fenceNodes.clear();
    this.fenceGateNodes.clear();
    this.fenceGateDragPreviews.clear();
    this.shadowCasters.length = 0;
    this.colliders.length = 0;
    this.root.getChildren().forEach((child) => child.dispose(false, false));
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.cancelReadyWork();
    this.clearBuiltMeshes();
    if (this.root) {
      this.root.dispose(false, false);
    }
    if (this.materials) {
      Object.values(this.materials).forEach((mat) => {
        if (mat && !mat.isDisposed) {
          mat.dispose(false, false);
        }
      });
    }
  }

  deleteSingleItemNode(itemId) {
    const node = this.itemNodes.get(itemId);
    if (node) {
      this.disposeNodeMaterials(node);
      node.dispose(false, false);
      this.itemNodes.delete(itemId);
    }
    this.shadowCasters = this.shadowCasters.filter((mesh) => {
      let curr = mesh;
      while (curr) {
        if (curr.metadata?.blueprintItemId === itemId) return false;
        curr = curr.parent;
      }
      return true;
    });
    this.colliders = this.colliders.filter((mesh) => {
      let curr = mesh;
      while (curr) {
        if (curr.metadata?.blueprintItemId === itemId) return false;
        curr = curr.parent;
      }
      return true;
    });
  }

  updateWallSurfaceMaterial(wallId, patch) {
    const wallNode = this.wallNodes.get(wallId);
    const wall = this.floorplan.walls.find((w) => w.id === wallId);
    if (!wallNode || !wall) return;

    if (patch) {
      Object.assign(wall, patch);
    }

    const wallMaterialOptions = { fallbackColor: wall.color || DEFAULT_WALL_COLOR, flatShading: false, backFaceCulling: false };
    const wallSurfaceWidth = Number(wallNode.metadata?.surfaceWidth)
      || Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
    const wallFloor = this.document.getFloor(wall.floorId);
    const wallSurfaceHeight = Number(wallNode.metadata?.surfaceHeight)
      || this.document.getFloorWallRenderHeight(wall.floorId)
        + Number(wallFloor?.floorHeight ?? this.floorplan.floorHeight ?? 0.2);
    const materialCache = new Map();
    const getWallFaceMaterial = (side, component) => {
      const cacheKey = `${side}:${component}`;
      if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);
      const { descriptor, color } = resolveWallSurfaceDescriptor(wall, side, component);
      const material = createBlueprintMaterial(this.scene, `wall_${wall.id}_${side}_${component}_${Date.now()}`, descriptor, {
        ...wallMaterialOptions,
        fallbackColor: color || wall.color || DEFAULT_WALL_COLOR,
        surfaceWidth: wallSurfaceWidth,
        surfaceHeight: wallSurfaceHeight
      });
      materialCache.set(cacheKey, material);
      return material;
    };

    const oldMaterials = new Set();
    const newMaterials = new Set();
    const meshes = wallNode.getChildMeshes ? wallNode.getChildMeshes() : [];
    meshes.forEach((mesh) => {
      if (mesh.metadata && mesh.metadata.blueprintWallId === wallId) {
        const side = mesh.metadata.side || 'front';
        const component = mesh.metadata.wallComponent || 'wall';
        const newMat = getWallFaceMaterial(side, component);
        const oldMat = mesh.material;
        mesh.material = newMat;
        if (oldMat && oldMat !== newMat) oldMaterials.add(oldMat);
        newMaterials.add(newMat);
      }
    });
    newMaterials.forEach((material) => oldMaterials.delete(material));
    this.disposeMaterials(oldMaterials);
  }

  syncActiveShadowGenerator() {
    if (!this.activeShadowGenerator) return;
    const shadowMap = this.activeShadowGenerator.getShadowMap?.();
    if (!shadowMap) return;
    shadowMap.renderList = [];
    const floorId = this.activeShadowFloorId || this.floorplan.currentFloorId;
    for (const mesh of this.shadowCasters || []) {
      if (mesh && !mesh.isDisposed() && shouldIncludeShadowCaster(mesh, floorId)) {
        this.activeShadowGenerator.addShadowCaster(mesh);
      }
    }
  }

  addSingleItemShadowCaster(itemId) {
    if (!this.activeShadowGenerator) return;
    const node = this.itemNodes.get(itemId);
    if (!node || node.isDisposed()) return;
    const floorId = this.activeShadowFloorId || this.floorplan.currentFloorId;
    const meshes = node.getChildMeshes ? node.getChildMeshes() : [node];
    meshes.forEach((mesh) => {
      if (mesh && !mesh.isDisposed() && shouldIncludeShadowCaster(mesh, floorId)) {
        this.activeShadowGenerator.addShadowCaster(mesh);
      }
    });
  }

  removeSingleItemShadowCaster(itemId) {
    if (!this.activeShadowGenerator) return;
    const shadowMap = this.activeShadowGenerator.getShadowMap?.();
    if (!shadowMap || !shadowMap.renderList) return;
    if (typeof this.activeShadowGenerator.removeShadowCaster === 'function') {
      const targetMeshes = shadowMap.renderList.filter((mesh) => {
        let curr = mesh;
        while (curr) {
          if (curr.metadata?.blueprintItemId === itemId) return true;
          curr = curr.parent;
        }
        return false;
      });
      targetMeshes.forEach((m) => this.activeShadowGenerator.removeShadowCaster(m));
    } else {
      shadowMap.renderList = shadowMap.renderList.filter((mesh) => {
        let curr = mesh;
        while (curr) {
          if (curr.metadata?.blueprintItemId === itemId) return false;
          curr = curr.parent;
        }
        return true;
      });
    }
  }

  build(options = {}) {
    if (!this.renderingEnabled || this._disposed) {
      return;
    }
    const rebuildType = options.rebuildType || 'all';
    const targetItemId = options.itemId || options.targetItemId;

    if (rebuildType === 'item_add' && targetItemId) {
      const item = this.floorplan.items.find((i) => i.id === targetItemId);
      if (item && this.document.isFloorVisible(item.floorId)) {
        this.deleteSingleItemNode(targetItemId);
        this.buildItem(item);
        this.addSingleItemShadowCaster(targetItemId);
      }
      return;
    }

    if (rebuildType === 'item_delete' && targetItemId) {
      this.removeSingleItemShadowCaster(targetItemId);
      this.deleteSingleItemNode(targetItemId);
      return;
    }

    if (rebuildType === 'item_update' && targetItemId) {
      const item = this.floorplan.items.find((i) => i.id === targetItemId);
      if (item && this.document.isFloorVisible(item.floorId)) {
        this.removeSingleItemShadowCaster(targetItemId);
        this.deleteSingleItemNode(targetItemId);
        this.buildItem(item);
        this.addSingleItemShadowCaster(targetItemId);
      }
      return;
    }

    if (rebuildType === 'wall_material' && options.wallId) {
      this.updateWallSurfaceMaterial(options.wallId, options.patch);
      return;
    }

    if (rebuildType === 'all') {
      this.clearBuiltMeshes();
      this.buildFloors();
      this.buildWalls();
      this.buildOpenings();
      this.buildRoofs();
      this.buildStairs();
      this.buildFences();
      this.buildFenceGates();
    } else if (rebuildType === 'items') {
      this.itemNodes.forEach((node) => {
        this.disposeNodeMaterials(node);
        node.dispose(false, false);
      });
      this.itemNodes.clear();

      this.shadowCasters = this.shadowCasters.filter((mesh) => {
        let curr = mesh;
        while (curr) {
          if (curr.metadata?.blueprintItemId) return false;
          curr = curr.parent;
        }
        return true;
      });

      this.colliders = this.colliders.filter((mesh) => {
        let curr = mesh;
        while (curr) {
          if (curr.metadata?.blueprintItemId) return false;
          curr = curr.parent;
        }
        return true;
      });
    }

    this.floorplan.items.filter((item) => this.document.isFloorVisible(item.floorId)).forEach((item) => this.buildItem(item));

    void this.executeWhenReady(() => {
      this.scene.meshes.forEach((mesh) => {
        const mat = mesh.material;
        if (mat) {
          const bpMaterial = mat.metadata?.blueprintMaterial;
          if (bpMaterial?.kind === 'mirror' || bpMaterial?.kind === 'metal') {
            const itemId = mesh.metadata?.itemId || null;
            const node = itemId ? this.itemNodes.get(itemId) : null;
            this.applyReflectionToMesh(mesh, itemId, node);
          }
        }
      });
      this.syncActiveShadowGenerator();
    });
  }

  getStairFloorHoles(room) {
    const roomLevel = this.document.getFloorLevel(room.floorId);
    const left = room.x - room.width / 2;
    const right = room.x + room.width / 2;
    const top = room.z - room.depth / 2;
    const bottom = room.z + room.depth / 2;

    const rotateEnvelope = (rect, rot) => {
      const pts = [
        { x: rect.left, z: rect.top },
        { x: rect.right, z: rect.top },
        { x: rect.left, z: rect.bottom },
        { x: rect.right, z: rect.bottom }
      ];
      const rx = pts.map(p => p.x * Math.cos(rot) - p.z * Math.sin(rot));
      const rz = pts.map(p => p.x * Math.sin(rot) + p.z * Math.cos(rot));
      return {
        left: Math.min(...rx),
        right: Math.max(...rx),
        top: Math.min(...rz),
        bottom: Math.max(...rz)
      };
    };

    return this.floorplan.stairs
      .filter((stairs) => this.document.getFloorLevel(stairs.floorId) === roomLevel - 1)
      .flatMap((stairs) => {
        const rotation = Number(stairs.rotation || 0);
        if (stairs.subtype === 'spiral' || stairs.subtype === 'curved') {
          const isCurved = stairs.subtype === 'curved';
          const maxDim = Math.max(Number(stairs.width || 1.2), Number(stairs.depth || 3.2));
          const r = isCurved ? Number(stairs.depth || 3.2) : maxDim / 2;
          const cx = Number(stairs.x || 0);
          const cz = Number(stairs.z || 0);
          const w = Number(stairs.width || 1.2);
          const d = Number(stairs.depth || 3.2);

          const totalRad = (stairs.spiralDegrees ?? (isCurved ? 90 : 360)) * Math.PI / 180;
          const flipX = stairs.mirrored ? -1 : 1;

          let lx, lz;
          if (isCurved) {
            const centerR = (d + d - w) / 2;
            const midAngle = totalRad / 2;
            lx = -w / 2 * flipX + centerR * Math.sin(midAngle) * flipX;
            lz = -d / 2 + centerR * Math.cos(midAngle);
          } else {
            lx = r * 0.5 * Math.sin(totalRad) * flipX;
            lz = -r * 0.5 * Math.cos(totalRad);
          }

          const ox = isCurved ? -w / 2 * flipX : 0;
          const oz = isCurved ? -d / 2 : 0;

          let targetQuadrant = 1;
          const dx = lx - ox;
          const dz = lz - oz;
          if (dx >= 0 && dz < 0) targetQuadrant = 1;
          else if (dx < 0 && dz < 0) targetQuadrant = 2;
          else if (dx < 0 && dz >= 0) targetQuadrant = 3;
          else targetQuadrant = 4;

          const q1 = { left: ox, right: ox + r, top: oz - r, bottom: oz };
          const q2 = { left: ox - r, right: ox, top: oz - r, bottom: oz };
          const q3 = { left: ox - r, right: ox, top: oz, bottom: oz + r };
          const q4 = { left: ox, right: ox + r, top: oz, bottom: oz + r };

          const localHoleRects = [];
          if (isCurved) {
            if (targetQuadrant === 1) localHoleRects.push(q1);
            if (targetQuadrant === 2) localHoleRects.push(q2);
            if (targetQuadrant === 3) localHoleRects.push(q3);
            if (targetQuadrant === 4) localHoleRects.push(q4);
          } else {
            let keepQuadrant;
            if (flipX === 1) {
              keepQuadrant = targetQuadrant === 1 ? 4 : targetQuadrant - 1;
            } else {
              keepQuadrant = targetQuadrant === 4 ? 1 : targetQuadrant + 1;
            }
            if (keepQuadrant !== 1) localHoleRects.push(q1);
            if (keepQuadrant !== 2) localHoleRects.push(q2);
            if (keepQuadrant !== 3) localHoleRects.push(q3);
            if (keepQuadrant !== 4) localHoleRects.push(q4);
          }

          return localHoleRects.map(q => {
            const aabb = rotateEnvelope(q, rotation);
            return {
              left: Math.max(left, cx + aabb.left),
              right: Math.min(right, cx + aabb.right),
              top: Math.max(top, cz + aabb.top),
              bottom: Math.min(bottom, cz + aabb.bottom)
            };
          });
        } else if (stairs.subtype === 'lshape') {
          const w = Number(stairs.width || 1.2);
          const d = Number(stairs.depth || 3.2);
          const cx = Number(stairs.x || 0);
          const cz = Number(stairs.z || 0);
          const runBeforeCorner = Math.max(0.2, Number(stairs.runBeforeCorner ?? (d - w)));
          const runAfterCorner = Math.max(0.2, Number(stairs.runAfterCorner ?? (d - w)));
          const flipX = stairs.mirrored ? -1 : 1;
          const landingZ = runBeforeCorner / 2;

          const r1 = {
            left: -w / 2,
            right: w / 2,
            top: -(runBeforeCorner + w) / 2,
            bottom: landingZ + w / 2
          };

          const r2 = {
            left: flipX === 1 ? w / 2 : -w / 2 - runAfterCorner,
            right: flipX === 1 ? w / 2 + runAfterCorner : -w / 2,
            top: landingZ - w / 2,
            bottom: landingZ + w / 2
          };

          return [r1, r2].map((q) => {
            const aabb = rotateEnvelope(q, rotation);
            return {
              left: Math.max(left, cx + aabb.left),
              right: Math.min(right, cx + aabb.right),
              top: Math.max(top, cz + aabb.top),
              bottom: Math.min(bottom, cz + aabb.bottom)
            };
          });
        } else {
          const halfWidth = Math.abs(Math.cos(rotation)) * Number(stairs.width || 1.2) / 2 + Math.abs(Math.sin(rotation)) * Number(stairs.depth || 3.2) / 2;
          const halfDepth = Math.abs(Math.sin(rotation)) * Number(stairs.width || 1.2) / 2 + Math.abs(Math.cos(rotation)) * Number(stairs.depth || 3.2) / 2;
          return [{
            left: Math.max(left, Number(stairs.x || 0) - halfWidth),
            right: Math.min(right, Number(stairs.x || 0) + halfWidth),
            top: Math.max(top, Number(stairs.z || 0) - halfDepth),
            bottom: Math.min(bottom, Number(stairs.z || 0) + halfDepth)
          }];
        }
      })
      .filter((hole) => hole.right - hole.left > 0.05 && hole.bottom - hole.top > 0.05);
  }

  buildFloorPiece(group, room, material, ceilingMaterial, rect, index) {
    const width = rect.right - rect.left;
    const depth = rect.bottom - rect.top;
    if (width <= 0.01 || depth <= 0.01) return;
    const centerX = (rect.left + rect.right) / 2;
    const centerZ = (rect.top + rect.bottom) / 2;

    const currentFloorHeight = this.document.getFloorHeight(room.floorId);

    const piece = createBox(this, `floor_${room.id}_${index}`, {
      width,
      height: currentFloorHeight,
      depth
    }, {
      position: { x: centerX - room.x, y: room.elevation || 0, z: centerZ - room.z }
    }, {
      parent: group,
      material,
      receiveShadows: true,
      shadowCaster: false
    });
    piece.metadata = { blueprintRoomId: room.id, locked: !!room.locked };
    const positions = piece.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (positions) {
      const roomBounds = getRoomBounds(room);
      const roomWidth = Math.max(0.001, roomBounds.right - roomBounds.left);
      const roomDepth = Math.max(0.001, roomBounds.bottom - roomBounds.top);
      const uvs = new Array((positions.length / 3) * 2);
      for (let vertex = 0; vertex < positions.length; vertex += 3) {
        const worldX = positions[vertex] + centerX;
        const worldZ = positions[vertex + 2] + centerZ;
        const uvIndex = (vertex / 3) * 2;
        uvs[uvIndex] = (worldX - roomBounds.left) / roomWidth;
        uvs[uvIndex + 1] = (worldZ - roomBounds.top) / roomDepth;
      }
      piece.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
    }

    const ceilingThickness = 0.002;
    const ceilingPiece = createBox(this, `ceiling_${room.id}_${index}`, {
      width,
      height: ceilingThickness,
      depth
    }, {
      position: { x: centerX - room.x, y: -currentFloorHeight / 2 - ceilingThickness / 2, z: centerZ - room.z }
    }, {
      parent: group,
      material: ceilingMaterial,
      receiveShadows: true,
      shadowCaster: true
    });
    ceilingPiece.metadata = { blueprintRoomId: room.id, crossFloorShadowOnly: true, locked: !!room.locked };
  }

  buildRoomPolygonMesh(group, room, material, height, centerY, suffix) {
    const { vertices, triangles } = triangulateRoom(room);
    if (vertices.length < 3 || !triangles.length) return null;
    const positions = [];
    const indices = [];
    const uvs = [];
    const halfHeight = height / 2;

    vertices.forEach((point) => {
      positions.push(point.x, centerY + halfHeight, point.z);
      uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
    });
    vertices.forEach((point) => {
      positions.push(point.x, centerY - halfHeight, point.z);
      uvs.push(point.x / Math.max(room.width, 0.001) + 0.5, point.z / Math.max(room.depth, 0.001) + 0.5);
    });
    const bottomOffset = vertices.length;
    triangles.forEach(([a, b, c]) => {
      indices.push(a, b, c);
      indices.push(bottomOffset + a, bottomOffset + c, bottomOffset + b);
    });
    vertices.forEach((point, index) => {
      const nextIndex = (index + 1) % vertices.length;
      const next = vertices[nextIndex];
      const sideOffset = positions.length / 3;
      positions.push(
        point.x, centerY + halfHeight, point.z,
        next.x, centerY + halfHeight, next.z,
        next.x, centerY - halfHeight, next.z,
        point.x, centerY - halfHeight, point.z
      );
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      // Match the preview-update path above: the side's rendered face must
      // point out of the footprint so exterior cameras survive back-face
      // culling.
      indices.push(sideOffset, sideOffset + 2, sideOffset + 1, sideOffset, sideOffset + 3, sideOffset + 2);
    });

    const mesh = new BABYLON.Mesh(`floor_${room.id}_${suffix}`, this.scene);
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.applyToMesh(mesh);
    mesh.parent = group;
    mesh.material = material;
    mesh.receiveShadows = true;
    mesh.metadata = { blueprintRoomId: room.id, locked: !!room.locked };
    return mesh;
  }

  buildFloors() {
    if (this.deferRenderWork()) return;
    this.floorplan.floor.rooms.filter((room) => this.document.isFloorVisible(room.floorId)).forEach((room) => {
      const floorY = this.document.getFloorElevation(room.floorId);
      const floorMaterial = createBlueprintMaterial(this.scene, `floor_${room.id}`, room.material || this.floorplan.floor.material || room.color || this.floorplan.floor.color, {
        fallbackColor: room.color || this.floorplan.floor.color || DEFAULT_FLOOR_COLOR,
        isFloor: true,
        surfaceWidth: room.width,
        surfaceDepth: room.depth
      });
      const ceilingMaterial = createBlueprintMaterial(this.scene, `ceiling_${room.id}`, '#ffffff', {
        fallbackColor: '#ffffff'
      });
      const currentFloorHeight = this.document.getFloorHeight(room.floorId);

      const group = new BABYLON.TransformNode(`floor_${room.id}`, this.scene);
      group.position.set(room.x, floorY - currentFloorHeight / 2, room.z);
      group.metadata = { blueprintRoomId: room.id, floorId: room.floorId, locked: !!room.locked, originalWidth: room.width, originalDepth: room.depth };
      this.add(group, { shadowCaster: false });

      if (normalizeRoomShape(room.shape) === 'square') {
        const roomRect = getRoomBounds(room);
        const holes = this.getStairFloorHoles(room);
        const xCuts = [roomRect.left, roomRect.right];
        const zCuts = [roomRect.top, roomRect.bottom];
        holes.forEach((hole) => {
          xCuts.push(hole.left, hole.right);
          zCuts.push(hole.top, hole.bottom);
        });
        const xs = [...new Set(xCuts.map((value) => Number(value.toFixed(3))))].sort((a, b) => a - b);
        const zs = [...new Set(zCuts.map((value) => Number(value.toFixed(3))))].sort((a, b) => a - b);
        let pieceIndex = 0;
        for (let xi = 0; xi < xs.length - 1; xi += 1) {
          for (let zi = 0; zi < zs.length - 1; zi += 1) {
            const rect = { left: xs[xi], right: xs[xi + 1], top: zs[zi], bottom: zs[zi + 1] };
            const centerX = (rect.left + rect.right) / 2;
            const centerZ = (rect.top + rect.bottom) / 2;
            const insideHole = holes.some((hole) => centerX > hole.left && centerX < hole.right && centerZ > hole.top && centerZ < hole.bottom);
            if (!insideHole) {
              this.buildFloorPiece(group, room, floorMaterial, ceilingMaterial, rect, pieceIndex);
              pieceIndex += 1;
            }
          }
        }
      } else {
        this.buildRoomPolygonMesh(group, room, floorMaterial, currentFloorHeight, room.elevation || 0, 'shape');
        const ceilingMesh = this.buildRoomPolygonMesh(group, room, ceilingMaterial, 0.002, -currentFloorHeight / 2 - 0.001, 'ceiling');
        if (ceilingMesh) {
          ceilingMesh.metadata.crossFloorShadowOnly = true;
          this.shadowCasters.push(ceilingMesh);
        }
      }

      this.floorNodes.set(room.id, group);
      this.addCollider({
        type: 'floor',
        worldX: room.x,
        worldZ: room.z,
        worldY: floorY + (room.elevation || 0),
        radius: Math.max(room.width, room.depth) / 2
      });
    });
  }

  buildWalls(wallIds = null) {
    if (this.deferRenderWork()) return;
    const visibleWalls = this.floorplan.walls.filter((wall) => this.document.isFloorVisible(wall.floorId));
    const getAdjacentWalls = (P, currentWallId) => {
      const threshold = 0.05;
      const adjs = [];
      visibleWalls.forEach((w) => {
        if (w.id === currentWallId) return;
        const [ax1, az1] = w.from;
        const [ax2, az2] = w.to;

        const dist1 = Math.sqrt((ax1 - P.x) * (ax1 - P.x) + (az1 - P.z) * (az1 - P.z));
        if (dist1 < threshold) {
          adjs.push({ wall: w, isFrom: true });
          return;
        }

        const dist2 = Math.sqrt((ax2 - P.x) * (ax2 - P.x) + (az2 - P.z) * (az2 - P.z));
        if (dist2 < threshold) {
          adjs.push({ wall: w, isFrom: false });
        }
      });
      return adjs;
    };

    const wallsToBuild = wallIds ? visibleWalls.filter((wall) => wallIds.has(wall.id)) : visibleWalls;
    wallsToBuild.forEach((wall) => {
      // 销毁并移除已经存在的旧墙体节点，防止网格局部重建时重叠共存
      const oldGroup = this.wallNodes.get(wall.id);
      if (oldGroup) {
        oldGroup.dispose(false, true);
        this.wallNodes.delete(wall.id);
      }

      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length <= 0.01) return;

      const adj1 = getAdjacentWalls({ x: x1, z: z1 }, wall.id);
      const adj2 = getAdjacentWalls({ x: x2, z: z2 }, wall.id);

      const hasMiter1 = adj1.length === 1;
      const hasMiter2 = adj2.length === 1;

      const T = this.floorplan.wallThickness;
      const wallFloor = this.document.getFloor(wall.floorId);
      let H = this.document.getFloorWallRenderHeight(wall.floorId);
      if (wallFloor && wallFloor.hideWall) {
        H = 0.2;
      }
      const floorY = this.document.getFloorElevation(wall.floorId);
      const wallBaseY = floorY + this.document.getWallElevationOffset(wall.id);
      const FH = Number(wallFloor ? (wallFloor.floorHeight ?? this.floorplan.floorHeight ?? 0.2) : (this.floorplan.floorHeight ?? 0.2));
      const wallFaceBands = getWallFaceBands(wall, H, Math.max(0, FH - 0.01));
      const wallMaterialOptions = { fallbackColor: wall.color || DEFAULT_WALL_COLOR, flatShading: false, backFaceCulling: false };
      const materialCache = new Map();
      const getWallFaceMaterial = (side, component) => {
        const cacheKey = `${side}:${component}`;
        if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);
        const { descriptor, color } = resolveWallSurfaceDescriptor(wall, side, component);
        const material = createBlueprintMaterial(this.scene, `wall_${wall.id}_${side}_${component}`, descriptor, {
          ...wallMaterialOptions,
          fallbackColor: color || wall.color || DEFAULT_WALL_COLOR,
          surfaceWidth: X_max - X_min,
          surfaceHeight: H + FH
        });
        materialCache.set(cacheKey, material);
        return material;
      };

      const ux = dx / length;
      const uz = dz / length;

      const getExtLen = (P, otherP, adjWall) => {
        const [ax1, az1] = adjWall.from;
        const [ax2, az2] = adjWall.to;
        const ap1 = { x: ax1, z: az1 };
        const ap2 = { x: ax2, z: az2 };
        const dist1 = (ap1.x - P.x) * (ap1.x - P.x) + (ap1.z - P.z) * (ap1.z - P.z);
        const dist2 = (ap2.x - P.x) * (ap2.x - P.x) + (ap2.z - P.z) * (ap2.z - P.z);
        const AP_other = dist1 < dist2 ? ap2 : ap1;

        const dxA = otherP.x - P.x;
        const dzA = otherP.z - P.z;
        const lenA = Math.sqrt(dxA * dxA + dzA * dzA);
        const uA = { x: dxA / lenA, z: dzA / lenA };

        const dxB = AP_other.x - P.x;
        const dzB = AP_other.z - P.z;
        const lenB = Math.sqrt(dxB * dxB + dzB * dzB);
        const uB = { x: dxB / lenB, z: dzB / lenB };

        const dot_uv = uA.x * uB.x + uA.z * uB.z;
        const alpha = Math.acos(Math.max(-1.0, Math.min(1.0, dot_uv)));
        const halfAlpha = alpha / 2;
        if (Math.abs(Math.sin(halfAlpha)) < 0.01) return 0;

        return (T / 2) / Math.tan(halfAlpha);
      };

      const extLen_start = hasMiter1 ? getExtLen({ x: x1, z: z1 }, { x: x2, z: z2 }, adj1[0].wall) : 0;
      const extLen_end = hasMiter2 ? getExtLen({ x: x2, z: z2 }, { x: x1, z: z1 }, adj2[0].wall) : 0;

      const X_min = -extLen_start;
      const X_max = length + extLen_end;
      const wallUvOptions = {
        originX: x1,
        originZ: z1,
        axisX: ux,
        axisZ: uz,
        xMin: X_min,
        xMax: X_max,
        yMin: wallBaseY - FH,
        yMax: wallBaseY + H
      };

      const wallOpenings = this.floorplan.openings.filter((op) => op.wallId === wall.id && this.document.isFloorVisible(op.floorId));
      const hasProfiledOpenings = wallOpenings.some((opening) => normalizeOpeningShape(opening.shape) !== 'square');
      const intervals = [];
      wallOpenings.forEach((opening) => {
        const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
        const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
        const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
        const t = opening.t ?? 0.5;
        const xCenter = length * t;
        const xLeft = xCenter - width / 2;
        const xRight = xCenter + width / 2;
        intervals.push({
          left: xLeft,
          right: xRight,
          sillHeight,
          height,
          opening
        });
      });

      intervals.sort((a, b) => a.left - b.left);

      // 合并重叠或包含的开洞区间，避免拼图算法生成重叠或错位的墙体块
      const mergedIntervals = [];
      intervals.forEach((inter) => {
        if (mergedIntervals.length === 0) {
          mergedIntervals.push({ ...inter });
        } else {
          const last = mergedIntervals[mergedIntervals.length - 1];
          if (inter.left < last.right - 0.001) {
            const newLeft = Number(Math.min(last.left, inter.left).toFixed(3));
            const newRight = Number(Math.max(last.right, inter.right).toFixed(3));
            const minSill = Number(Math.min(last.sillHeight, inter.sillHeight).toFixed(3));
            const maxTop = Math.max(last.sillHeight + last.height, inter.sillHeight + inter.height);
            last.left = newLeft;
            last.right = newRight;
            last.sillHeight = minSill;
            last.height = Number((maxTop - minSill).toFixed(3));
          } else {
            mergedIntervals.push({ ...inter });
          }
        }
      });
      intervals.length = 0;
      intervals.push(...mergedIntervals);

      const subBoxes = [];
      let curX = X_min;

      intervals.forEach((inter) => {
        if (inter.left > curX + 0.001) {
          if (H > 0.001) {
            subBoxes.push({
              xStart: curX,
              xEnd: inter.left,
              yStart: -FH,
              yEnd: H
            });
          }
        }
        if (inter.sillHeight > 0.01) {
          const yEnd = Math.min(inter.sillHeight, H);
          if (yEnd > 0.001) {
            subBoxes.push({
              xStart: Math.max(X_min, inter.left),
              xEnd: Math.min(X_max, inter.right),
              yStart: -FH,
              yEnd: yEnd
            });
          }
        }
        // 落地门窗（sillHeight ≈ 0）：地板 slab 侧面需要墙体遮挡
        if (inter.sillHeight <= 0.01 && FH > 0.001) {
          subBoxes.push({
            xStart: Math.max(X_min, inter.left),
            xEnd: Math.min(X_max, inter.right),
            yStart: -FH,
            yEnd: 0
          });
        }
        if (inter.sillHeight + inter.height < H - 0.01) {
          const yStart = inter.sillHeight + inter.height;
          const yEnd = H;
          if (yEnd - yStart > 0.001) {
            subBoxes.push({
              xStart: Math.max(X_min, inter.left),
              xEnd: Math.min(X_max, inter.right),
              yStart: yStart,
              yEnd: yEnd
            });
          }
        }
        curX = inter.right;
      });

      if (curX < X_max - 0.001) {
        if (H > 0.001) {
          subBoxes.push({
            xStart: curX,
            xEnd: X_max,
            yStart: -FH,
            yEnd: H
          });
        }
      }

      const wallGroup = new BABYLON.TransformNode(`wall_group_${wall.id}`, this.scene);
      wallGroup.position.set(x1, 0, z1);
      wallGroup.rotation.y = -Math.atan2(dz, dx);
      wallGroup.metadata = {
        blueprintWallId: wall.id,
        floorId: wall.floorId,
        originalLength: length,
        surfaceWidth: X_max - X_min,
        surfaceHeight: H + FH
      };
      wallGroup.computeWorldMatrix(true);

      const applyMiterCutterToCSG = (currentCSG, P, otherP, adjWall) => {
        const [ax1, az1] = adjWall.from;
        const [ax2, az2] = adjWall.to;
        const ap1 = { x: ax1, z: az1 };
        const ap2 = { x: ax2, z: az2 };
        const dist1 = (ap1.x - P.x) * (ap1.x - P.x) + (ap1.z - P.z) * (ap1.z - P.z);
        const dist2 = (ap2.x - P.x) * (ap2.x - P.x) + (ap2.z - P.z) * (ap2.z - P.z);
        const AP_other = dist1 < dist2 ? ap2 : ap1;

        const dxA = otherP.x - P.x;
        const dzA = otherP.z - P.z;
        const lenA = Math.sqrt(dxA * dxA + dzA * dzA);
        const uA = { x: dxA / lenA, z: dzA / lenA };

        const dxB = AP_other.x - P.x;
        const dzB = AP_other.z - P.z;
        const lenB = Math.sqrt(dxB * dxB + dzB * dzB);
        const uB = { x: dxB / lenB, z: dzB / lenB };

        const bisectX = uA.x + uB.x;
        const bisectZ = uA.z + uB.z;
        const lenBisect = Math.sqrt(bisectX * bisectX + bisectZ * bisectZ);
        if (lenBisect < 0.01) return currentCSG;

        const w = { x: bisectX / lenBisect, z: bisectZ / lenBisect };
        const n = { x: -w.z, z: w.x };

        const dot = uA.x * n.x + uA.z * n.z;
        const sign = dot > 0 ? -1 : 1;

        const cutterDepth = T * 4.0;
        const cutterWidth = T * 4.0;
        const offsetDist = cutterDepth / 2;

        const cutterPos = {
          x: P.x + sign * offsetDist * n.x,
          z: P.z + sign * offsetDist * n.z
        };

        const cutter = BABYLON.MeshBuilder.CreateBox(`miter_cutter_${wall.id}`, {
          width: cutterWidth,
          height: H * 1.5,
          depth: cutterDepth
        }, this.scene);

        cutter.position.set(cutterPos.x, wallBaseY + H / 2, cutterPos.z);
        cutter.rotation.y = -Math.atan2(w.z, w.x);
        cutter.computeWorldMatrix(true);

        let cutterCSG = BABYLON.CSG.FromMesh(cutter);
        let newCSG = currentCSG.subtract(cutterCSG);
        cutter.dispose();
        return newCSG;
      };

      const buildProfiledWallBand = (side, band, normalSign) => {
        const angle = -Math.atan2(dz, dx);
        const nx = Math.sin(angle);
        const nz = Math.cos(angle);
        const fullWidth = X_max - X_min;
        const fullHeight = band.yEnd - band.yStart;
        const localX = (X_min + X_max) / 2;
        const localY = (band.yStart + band.yEnd) / 2;
        const material = getWallFaceMaterial(side, band.component);
        const baseMesh = BABYLON.MeshBuilder.CreateBox(`wall_profiled_${wall.id}_${side}_${band.component}`, {
          width: fullWidth,
          height: fullHeight,
          depth: T / 2
        }, this.scene);
        baseMesh.position.set(
          x1 + localX * ux + normalSign * (T / 4) * nx,
          wallBaseY + localY,
          z1 + localX * uz + normalSign * (T / 4) * nz
        );
        baseMesh.rotation.y = angle;
        baseMesh.material = material;
        baseMesh.computeWorldMatrix(true);
        let wallCSG = BABYLON.CSG.FromMesh(baseMesh);

        wallOpenings.forEach((opening) => {
          const openingWidth = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
          const openingHeight = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
          const openingSill = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
          const openingPosition = wallPoint(wall, opening.t ?? 0.5);
          const cutter = createOpeningCutterMesh(this.scene, opening, {
            width: openingWidth,
            height: openingHeight,
            depth: T * 4,
            x: openingPosition.x,
            y: wallBaseY + openingSill + openingHeight / 2,
            z: openingPosition.z,
            rotation: angle
          });
          wallCSG = wallCSG.subtract(BABYLON.CSG.FromMesh(cutter));
          cutter.dispose();
        });

        if (hasMiter1) wallCSG = applyMiterCutterToCSG(wallCSG, { x: x1, z: z1 }, { x: x2, z: z2 }, adj1[0].wall);
        if (hasMiter2) wallCSG = applyMiterCutterToCSG(wallCSG, { x: x2, z: z2 }, { x: x1, z: z1 }, adj2[0].wall);
        const result = wallCSG.toMesh(`wall_profiled_result_${wall.id}_${side}_${band.component}`, material, this.scene);
        baseMesh.dispose();
        normalizeWallSegmentMesh(result);
        mapWallSegmentUV(result, wallUvOptions);
        result.setParent(wallGroup);
        result.metadata = { blueprintWallId: wall.id, side, wallComponent: band.component };
        this.shadowCasters.push(result);
      };

      if (hasProfiledOpenings) {
        wallFaceBands.forEach((band) => buildProfiledWallBand('front', band, 1));
        wallFaceBands.forEach((band) => buildProfiledWallBand('back', band, -1));
      } else subBoxes.forEach((box, idx) => {
        const angle = -Math.atan2(dz, dx);
        const nx = Math.sin(angle);
        const nz = Math.cos(angle);
        const touchesStart = Math.abs(box.xStart - X_min) < 0.001;
        const touchesEnd = Math.abs(box.xEnd - X_max) < 0.001;

        wallFaceBands.forEach((band) => {
          const yStart = Math.max(box.yStart, band.yStart);
          const yEnd = Math.min(box.yEnd, band.yEnd);
          const width = box.xEnd - box.xStart;
          const height = yEnd - yStart;
          if (width <= 0.001 || height <= 0.001) return;

          const localX = (box.xStart + box.xEnd) / 2;
          const localY = (yStart + yEnd) / 2;
          const matFront = getWallFaceMaterial('front', band.component);
          const matBack = getWallFaceMaterial('back', band.component);

          let subMeshFront = BABYLON.MeshBuilder.CreateBox(`wall_sub_${wall.id}_${idx}_${band.component}_f`, {
            width: width,
            height: height,
            depth: T / 2
          }, this.scene);
          subMeshFront.position.set(x1 + localX * ux + (T / 4) * nx, wallBaseY + localY, z1 + localX * uz + (T / 4) * nz);
          subMeshFront.rotation.y = angle;
          subMeshFront.material = matFront;

          let finalSubMeshFront = subMeshFront;
          if ((touchesStart && hasMiter1) || (touchesEnd && hasMiter2)) {
            subMeshFront.computeWorldMatrix(true);
            let subCSG = BABYLON.CSG.FromMesh(subMeshFront);
            if (touchesStart && hasMiter1) {
              subCSG = applyMiterCutterToCSG(subCSG, { x: x1, z: z1 }, { x: x2, z: z2 }, adj1[0].wall);
            }
            if (touchesEnd && hasMiter2) {
              subCSG = applyMiterCutterToCSG(subCSG, { x: x2, z: z2 }, { x: x1, z: z1 }, adj2[0].wall);
            }
            finalSubMeshFront = subCSG.toMesh(`wall_sub_mitered_${wall.id}_${idx}_${band.component}_f`, matFront, this.scene);
            subMeshFront.dispose();
          }
          normalizeWallSegmentMesh(finalSubMeshFront);
          mapWallSegmentUV(finalSubMeshFront, wallUvOptions);
          finalSubMeshFront.setParent(wallGroup);
          finalSubMeshFront.metadata = { blueprintWallId: wall.id, side: 'front', wallComponent: band.component };
          this.shadowCasters.push(finalSubMeshFront);

          let subMeshBack = BABYLON.MeshBuilder.CreateBox(`wall_sub_${wall.id}_${idx}_${band.component}_b`, {
            width: width,
            height: height,
            depth: T / 2
          }, this.scene);
          subMeshBack.position.set(x1 + localX * ux - (T / 4) * nx, wallBaseY + localY, z1 + localX * uz - (T / 4) * nz);
          subMeshBack.rotation.y = angle;
          subMeshBack.material = matBack;

          let finalSubMeshBack = subMeshBack;
          if ((touchesStart && hasMiter1) || (touchesEnd && hasMiter2)) {
            subMeshBack.computeWorldMatrix(true);
            let subCSG = BABYLON.CSG.FromMesh(subMeshBack);
            if (touchesStart && hasMiter1) {
              subCSG = applyMiterCutterToCSG(subCSG, { x: x1, z: z1 }, { x: x2, z: z2 }, adj1[0].wall);
            }
            if (touchesEnd && hasMiter2) {
              subCSG = applyMiterCutterToCSG(subCSG, { x: x2, z: z2 }, { x: x1, z: z1 }, adj2[0].wall);
            }
            finalSubMeshBack = subCSG.toMesh(`wall_sub_mitered_${wall.id}_${idx}_${band.component}_b`, matBack, this.scene);
            subMeshBack.dispose();
          }
          normalizeWallSegmentMesh(finalSubMeshBack);
          mapWallSegmentUV(finalSubMeshBack, wallUvOptions);
          finalSubMeshBack.setParent(wallGroup);
          finalSubMeshBack.metadata = { blueprintWallId: wall.id, side: 'back', wallComponent: band.component };
          this.shadowCasters.push(finalSubMeshBack);
        });
      });

      this.wallNodes.set(wall.id, wallGroup);
    });
  }

  buildOpenings(openingIds = null) {
    if (this.deferRenderWork()) return;
    this.floorplan.openings
      .filter((opening) => this.document.isFloorVisible(opening.floorId) && (!openingIds || openingIds.has(opening.id)))
      .forEach((opening) => {
        const wall = this.document.getWall(opening.wallId);
        if (!wall) return;
        const [x1, z1] = wall.from;
        const [x2, z2] = wall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const angle = -Math.atan2(dz, dx);
        const pos = wallPoint(wall, opening.t ?? 0.5);
        const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
        const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
        const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
        const localY = sillHeight + height / 2;
        const floorY = this.document.getFloorElevation(opening.floorId || wall.floorId);
        const openingOffset = this.document.getOpeningElevationOffset(opening);

        const oldNode = this.openingNodes.get(opening.id);
        if (oldNode && !oldNode.isDisposed()) {
          oldNode.dispose(false, false);
        }

        const openingGroup = new BABYLON.TransformNode(`opening_group_${opening.id}`, this.scene);
        openingGroup.parent = this.root;
        openingGroup.position.set(pos.x, floorY + localY + openingOffset, pos.z);
        openingGroup.rotation.y = angle;
        openingGroup.metadata = { blueprintOpeningId: opening.id, type: opening.type, shape: opening.shape, wallId: opening.wallId, floorId: opening.floorId, locked: !!opening.locked };

        const wallT = this.floorplan.wallThickness;
        const frameT = wallT + 0.02;
        const frameW = 0.04;
        buildOpeningGeometry(this, opening, openingGroup, { width, height, frameT, frameW });

        this.openingNodes.set(opening.id, openingGroup);
      });
  }

  buildRoofs() {
    if (this.deferRenderWork()) return;
    this.floorplan.roofs.filter((roof) => {
      const roofFloor = this.document.getFloor(roof.floorId);
      if (roofFloor && roofFloor.hideRoof) return false;
      return this.document.isFloorVisible(roof.floorId);
    }).forEach((roof) => {
      const floorY = this.document.getFloorElevation(roof.floorId);
      const width = Math.max(1, Number(roof.width || 6));
      const depth = Math.max(1, Number(roof.depth || 6));
      const height = Math.max(0.2, Number(roof.height || 1.1));
      const roofFloor = this.document.getFloor(roof.floorId);
      const roofWallHeight = roofFloor ? (roofFloor.wallHeight ?? this.floorplan.wallHeight ?? 2.8) : (this.floorplan.wallHeight ?? 2.8);
      const eaveY = floorY + (roof.elevation !== undefined ? roof.elevation : roofWallHeight);
      const material = createBlueprintMaterial(this.scene, `roof_${roof.id}_mat`, roof.material || roof.color || '#b75b54', {
        fallbackColor: roof.color || '#b75b54',
        flatShading: true,
        backFaceCulling: false
      });

      const group = new BABYLON.TransformNode(`roof_${roof.id}`, this.scene);
      group.position.set(roof.x || 0, eaveY, roof.z || 0);
      group.rotation.y = roof.rotation || 0;
      group.scaling.x = roof.mirrored ? -1 : 1;
      group.parent = this.root;
      group.metadata = { blueprintRoofId: roof.id, floorId: roof.floorId, locked: !!roof.locked };

      const subtype = roof.subtype || roof.type || 'gable';
      const curve = Number(roof.curve || 0);
      const { positions, topIndices, sideIndices, bottomIndices } = getRoofGeometryData(subtype, width, depth, height, curve);

      if (topIndices && topIndices.length > 0) {
        const topMesh = new BABYLON.Mesh(`roof_top_${roof.id}`, this.scene);
        topMesh.parent = group;
        const topNormals = [];
        BABYLON.VertexData.ComputeNormals(positions, topIndices, topNormals);
        const topVD = new BABYLON.VertexData();
        topVD.positions = positions;
        topVD.indices = topIndices;
        topVD.normals = topNormals;
        topVD.applyToMesh(topMesh);
        topMesh.convertToFlatShadedMesh();
        topMesh.material = material;
        topMesh.receiveShadows = true;
        this.shadowCasters.push(topMesh);
      }

      if (sideIndices && sideIndices.length > 0 && !roof.sideHidden) {
        const sideMesh = new BABYLON.Mesh(`roof_side_${roof.id}`, this.scene);
        sideMesh.parent = group;
        const sideNormals = [];
        BABYLON.VertexData.ComputeNormals(positions, sideIndices, sideNormals);
        const sideVD = new BABYLON.VertexData();
        sideVD.positions = positions;
        sideVD.indices = sideIndices;
        sideVD.normals = sideNormals;
        sideVD.applyToMesh(sideMesh);
        sideMesh.convertToFlatShadedMesh();

        const sideMat = createBlueprintMaterial(this.scene, `roof_side_${roof.id}_mat`, roof.sideMaterial || roof.sideColor || '#f9fbff', {
          fallbackColor: roof.sideColor || '#f9fbff',
          flatShading: true,
          backFaceCulling: false
        });
        sideMesh.material = sideMat;
        sideMesh.receiveShadows = true;
        this.shadowCasters.push(sideMesh);
      }

      if (bottomIndices && bottomIndices.length > 0 && !roof.bottomHidden) {
        const bottomMesh = new BABYLON.Mesh(`roof_bottom_${roof.id}`, this.scene);
        bottomMesh.parent = group;
        const bottomNormals = [];
        BABYLON.VertexData.ComputeNormals(positions, bottomIndices, bottomNormals);
        const bottomVD = new BABYLON.VertexData();
        bottomVD.positions = positions;
        bottomVD.indices = bottomIndices;
        bottomVD.normals = bottomNormals;
        bottomVD.applyToMesh(bottomMesh);
        bottomMesh.convertToFlatShadedMesh();

        const bottomMat = createBlueprintMaterial(this.scene, `roof_bottom_${roof.id}_mat`, roof.bottomMaterial || roof.bottomColor || '#f9fbff', {
          fallbackColor: roof.bottomColor || '#f9fbff',
          flatShading: true,
          backFaceCulling: false
        });
        bottomMesh.material = bottomMat;
        bottomMesh.receiveShadows = true;
        this.shadowCasters.push(bottomMesh);
      }

      this.roofNodes.set(roof.id, group);
    });
  }

  buildStairs() {
    if (this.deferRenderWork()) return;
    this.floorplan.stairs.filter((stairs) => this.document.isFloorVisible(stairs.floorId)).forEach((stairs) => {
      const floorY = this.document.getFloorElevation(stairs.floorId);
      const stairsOffset = this.document.getStairsElevationOffset(stairs);
      const group = new BABYLON.TransformNode(`stairs_${stairs.id}`, this.scene);
      group.position.set(stairs.x || 0, floorY + stairsOffset, stairs.z || 0);
      group.rotation.y = stairs.rotation || 0;
      group.parent = this.root;
      group.metadata = { blueprintStairsId: stairs.id, floorId: stairs.floorId, locked: !!stairs.locked };
      const material = createBlueprintMaterial(this.scene, `stairs_${stairs.id}_mat`, stairs.material || stairs.color || '#d8c0a0', {
        fallbackColor: stairs.color || '#d8c0a0',
        flatShading: false
      });
      const steps = Math.max(4, Math.round(Number(stairs.steps || 9)));
      const width = Math.max(0.6, Number(stairs.width || 1.2));
      const depth = Math.max(1.2, Number(stairs.depth || 3.2));
      const height = this.document.getStairsAutoHeight(stairs);

      buildStairsGeometry(this, group, stairs, material, width, depth, height, steps);

      this.stairNodes.set(stairs.id, group);
    });
  }

  buildFences(fenceIds = null) {
    if (this.deferRenderWork()) return;
    this.floorplan.fences
      .filter((fence) => this.document.isFloorVisible(fence.floorId) && (!fenceIds || fenceIds.has(fence.id)))
      .forEach((fence) => {
        const floorY = this.document.getFloorElevation(fence.floorId);
        const group = new BABYLON.TransformNode(`fence_${fence.id}`, this.scene);

        const [x1, z1] = fence.from || [0, 0];
        const [x2, z2] = fence.to || [2, 0];
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length <= 0.01) {
          group.dispose();
          return;
        }

        const angle = Math.atan2(dz, dx);
        const fenceOffset = this.document.getFenceElevationOffset(fence) + (fence.yOffset || 0);
        group.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
        group.rotation.y = -angle;
        if (fence.tilt) {
          group.rotation.z = fence.tilt;
        }
        group.parent = this.root;
        group.metadata = { blueprintFenceId: fence.id, floorId: fence.floorId, originalLength: length, locked: !!fence.locked };

        const fenceDefaultColor = fence.subtype === 'concrete' ? DEFAULT_WALL_COLOR : '#8d6e63';
        const material = createBlueprintMaterial(this.scene, `fence_${fence.id}_mat`, fence.material || fence.color || fenceDefaultColor, {
          fallbackColor: fence.color || fenceDefaultColor,
          flatShading: false
        });

        const occupiedIntervals = [];
        (this.floorplan.fenceGates || []).forEach(gate => {
          if (gate.fenceId !== fence.id) return;
          const gFrom = gate.from || [0, 0];
          const gTo = gate.to || [1, 0];
          const gcx = (gFrom[0] + gTo[0]) / 2;
          const gcz = (gFrom[1] + gTo[1]) / 2;

          const fenceDX = x2 - x1;
          const fenceDZ = z2 - z1;
          const fenceLenSq = fenceDX * fenceDX + fenceDZ * fenceDZ;
          if (fenceLenSq <= 0.001) return;

          let t_proj = ((gcx - x1) * fenceDX + (gcz - z1) * fenceDZ) / fenceLenSq;
          const projX = x1 + fenceDX * t_proj;
          const projZ = z1 + fenceDZ * t_proj;
          const dist = Math.hypot(gcx - projX, gcz - projZ);

          if (dist < 0.25 && t_proj >= -0.05 && t_proj <= 1.05) {
            const halfT = (gate.width || 1.0) / length / 2;
            const startT = Math.max(0, t_proj - halfT);
            const endT = Math.min(1, t_proj + halfT);
            occupiedIntervals.push([startT, endT]);
          }
        });

        occupiedIntervals.sort((a, b) => a[0] - b[0]);
        const mergedIntervals = [];
        for (const interval of occupiedIntervals) {
          if (mergedIntervals.length === 0) {
            mergedIntervals.push(interval);
          } else {
            const last = mergedIntervals[mergedIntervals.length - 1];
            if (interval[0] <= last[1]) {
              last[1] = Math.max(last[1], interval[1]);
            } else {
              mergedIntervals.push(interval);
            }
          }
        }

        const freeIntervals = [];
        let currentT = 0;
        for (const [startT, endT] of mergedIntervals) {
          if (startT > currentT + 0.001) {
            freeIntervals.push([currentT, startT]);
          }
          currentT = Math.max(currentT, endT);
        }
        if (currentT < 0.999) {
          freeIntervals.push([currentT, 1.0]);
        }

        freeIntervals.forEach(([s, e], idx) => {
          const t_mid = (s + e) / 2;
          const subLen = (e - s) * length;
          if (subLen <= 0.01) return;

          const subGroup = new BABYLON.TransformNode(`fence_sub_${fence.id}_${idx}`, this.scene);
          subGroup.parent = group;
          subGroup.position.set((t_mid - 0.5) * length, 0, 0);

          let renderLength = subLen;
          if (fence.tilt) {
            renderLength = subLen / Math.cos(fence.tilt);
          }
          const skipStartPost = s > 0.001;
          const skipEndPost = e < 0.999;
          buildFenceGeometry(
            this,
            subGroup,
            {
              ...fence,
              skipStartPost,
              skipEndPost
            },
            material,
            renderLength,
            fence.height || 1.1,
            fence.thickness || 0.1
          );
        });

        group.getChildMeshes().forEach(m => {
          m.metadata ||= {};
          m.metadata.blueprintFenceId = fence.id;
          m.metadata.floorId = fence.floorId;
          m.metadata.locked = !!fence.locked;
        });

        this.fenceNodes.set(fence.id, group);
      });
  }

  buildFenceGates(gateIds = null) {
    if (this.deferRenderWork()) return;
    this.floorplan.fenceGates ||= [];
    this.floorplan.fenceGates
      .filter((gate) => this.document.isFloorVisible(gate.floorId) && (!gateIds || gateIds.has(gate.id)))
      .forEach((gate) => {
        const oldNode = this.fenceGateNodes.get(gate.id);
        if (oldNode && !oldNode.isDisposed()) {
          oldNode.dispose(false, false);
        }

        const floorY = this.document.getFloorElevation(gate.floorId);
        const group = new BABYLON.TransformNode(`gate_${gate.id}`, this.scene);
        group.parent = this.root;

        let [x1, z1] = gate.from || [0, 0];
        let [x2, z2] = gate.to || [1, 0];

        if (gate.fenceId) {
          const fence = this.document.getFence(gate.fenceId);
          if (fence) {
            const [fx1, fz1] = fence.from;
            const [fx2, fz2] = fence.to;
            const dx = fx2 - fx1;
            const dz = fz2 - fz1;
            const fenceLen = Math.sqrt(dx * dx + dz * dz) || 1;
            const halfT = (gate.width) / fenceLen / 2;
            const t1 = Math.max(0, gate.t - halfT);
            const t2 = Math.min(1, gate.t + halfT);
            x1 = fx1 + dx * t1;
            z1 = fz1 + dz * t1;
            x2 = fx1 + dx * t2;
            z2 = fz1 + dz * t2;
            gate.from = [x1, z1];
            gate.to = [x2, z2];
          }
        }

        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length <= 0.01) {
          group.dispose();
          return;
        }

        const angle = Math.atan2(dz, dx);
        const gateOffset = (gate.fenceId ? this.document.getFenceElevationOffset(this.document.getFence(gate.fenceId)) : 0) + (gate.yOffset || 0);
        group.position.set((x1 + x2) / 2, floorY + gateOffset, (z1 + z2) / 2);
        group.rotation.y = -angle;

        const fenceTilt = gate.fenceId ? (this.document.getFence(gate.fenceId)?.tilt || 0) : 0;
        const tilt = gate.tilt || fenceTilt;
        if (tilt) {
          group.rotation.z = tilt;
        }

        group.parent = this.root;
        group.metadata = { blueprintFenceGateId: gate.id, floorId: gate.floorId, originalLength: length, locked: !!gate.locked };

        const gateDefaultColor = gate.subtype === 'concrete' ? DEFAULT_WALL_COLOR : '#8d6e63';
        const material = createBlueprintMaterial(this.scene, `gate_${gate.id}_mat`, gate.panelMaterial || gate.frameMaterial || gateDefaultColor, {
          fallbackColor: gateDefaultColor,
          flatShading: false
        });

        let renderLength = length;
        if (tilt) {
          renderLength = length / Math.cos(tilt);
        }

        buildFenceGateGeometry(this, group, gate, material, renderLength, gate.height || 1.1, gate.thickness || 0.08);

        group.getChildMeshes().forEach(m => {
          m.metadata ||= {};
          m.metadata.blueprintFenceGateId = gate.id;
          m.metadata.floorId = gate.floorId;
          m.metadata.locked = !!gate.locked;
        });

        this.fenceGateNodes.set(gate.id, group);
      });
  }

  buildItem(item) {
    if (this.deferRenderWork()) return;
    const definition = getFurnitureDefinition(item.type);
    item.colors ||= {};
    item.materials ||= {};
    definition.components.forEach((component) => {
      item.colors[component.id] ||= component.defaultColor;
      item.materials[component.id] ||= component.defaultMaterial || item.colors[component.id];
    });

    const node = new BABYLON.TransformNode(`item_${item.id}`, this.scene);
    const floorY = this.document.getFloorElevation(item.floorId);
    const roomOffset = this.document.getItemRoomElevationOffset(item);
    node.position.set(item.x, floorY + (item.elevation || 0) + roomOffset, item.z);
    node.rotation.y = item.rotation || 0;
    node.scaling.x = item.mirrored ? -1 : 1;
    node.metadata = { blueprintItemId: item.id, locked: !!item.locked, floorId: item.floorId, blueprintRoomId: item.roomId };
    this.add(node, { shadowCaster: false });

    const itemScale = Number(item.scale || 1);
    const size = {
      width: item.width * itemScale,
      depth: item.depth * itemScale,
      height: item.height * itemScale
    };
    definition.build(this, item, node, size);
    this.applyPowerEffect(definition, item, node);

    const showAllFloors = typeof window !== 'undefined' && window.showAllFloors === true;
    const isLightOn = item.lightOn !== false && (
      item.floorId === this.floorplan.currentFloorId ||
      (showAllFloors && this.document.isFloorVisible(item.floorId))
    );
    const emissiveComponents = definition.emissiveComponents || ['bulb', 'glow', 'light', 'flame', 'lava', 'shade'];

    node.getChildMeshes().forEach((mesh) => {
      const componentId = mesh.metadata?.blueprintFurnitureComponentId;
      if (componentId && (emissiveComponents.includes(componentId) || emissiveComponents.some(c => componentId.toLowerCase().includes(c)))) {
        if (mesh.material) {
          if (isLightOn) {
            const baseColor = mesh.material.diffuseColor || new BABYLON.Color3(1, 1, 1);
            mesh.material.emissiveColor = new BABYLON.Color3(
              Math.min(1.0, baseColor.r * 1.5),
              Math.min(1.0, baseColor.g * 1.5),
              Math.min(1.0, baseColor.b * 1.5)
            );
            if (mesh.material.emissiveColor.r < 0.2 && mesh.material.emissiveColor.g < 0.2 && mesh.material.emissiveColor.b < 0.2) {
              mesh.material.emissiveColor = new BABYLON.Color3(1, 0.98, 0.85);
            }
            mesh.material.disableLighting = false;
          } else {
            mesh.material.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
          }
        }
      }
    });

    if (definition.lightSource && isLightOn) {
      const lightSourceConfig = definition.lightSource;
      const lightName = `item_light_${item.id}`;
      const offset = lightSourceConfig.offset || { x: 0, y: 0, z: 0 };
      const isMeter = definition.unit === 'm';
      const localPos = new BABYLON.Vector3(
        isMeter ? (offset.x ?? 0) : inchesToUnits(offset.x),
        isMeter ? (offset.y ?? 0) : inchesToUnits(offset.y),
        isMeter ? (offset.z ?? 0) : inchesToUnits(offset.z)
      );

      let light;
      const intensity = lightSourceConfig.intensity ?? 0.8;
      let colorHex = lightSourceConfig.color || '#fffae6';
      if (definition.lightColorComponent) {
        const compId = definition.lightColorComponent;
        const customColor = item.colors?.[compId] || definition.components.find(c => c.id === compId)?.defaultColor;
        if (customColor) {
          colorHex = customColor;
        }
      }
      const color = BABYLON.Color3.FromHexString(colorHex);

      if (lightSourceConfig.type === 'spot') {
        const dir = lightSourceConfig.direction || { x: 0, y: -1, z: 0 };
        const direction = new BABYLON.Vector3(dir.x, dir.y, dir.z);
        light = new BABYLON.SpotLight(
          lightName,
          localPos,
          direction,
          lightSourceConfig.angle ?? (Math.PI / 3),
          lightSourceConfig.exponent ?? 2,
          this.scene
        );
      } else {
        light = new BABYLON.PointLight(lightName, localPos, this.scene);
      }

      light.parent = node;
      light.diffuse = color;
      light.specular = color;
      light.intensity = intensity;
      light.range = isMeter ? (lightSourceConfig.range ?? 3.8) : inchesToUnits(lightSourceConfig.range ?? 150);

      node.onDisposeObservable.add(() => {
        light.dispose();
      });
    }

    void this.executeWhenReady(() => {
      node.getChildMeshes().forEach((mirrorMesh) => {
        const mat = mirrorMesh.material;
        const bpMaterial = mat?.metadata?.blueprintMaterial;
        if (bpMaterial?.kind === 'mirror' || bpMaterial?.kind === 'metal') {
          mirrorMesh.metadata = mirrorMesh.metadata || {};
          mirrorMesh.metadata.itemId = item.id;
          const componentId = mirrorMesh.metadata?.blueprintFurnitureComponentId;
          const isMainMirror = definition.isMirror && componentId && componentId.toLowerCase().includes('mirror');
          mirrorMesh.metadata.isMainMirror = !!isMainMirror;
          this.applyReflectionToMesh(mirrorMesh, item.id, node);
        }
      });
    });

    this.itemNodes.set(item.id, node);
    return node;
  }

  applyPowerEffect(definition, item, node) {
    const effect = definition.powerEffect;
    if (!effect) return;

    const isOn = isAppliancePowerOn(item) && (item.floorId === this.floorplan.currentFloorId);
    const glowComponents = Array.isArray(effect.glowComponents) ? effect.glowComponents : [];
    const glowColor = BABYLON.Color3.FromHexString(effect.color || '#66ccff');
    const glowMeshes = node.getChildMeshes().filter((mesh) => {
      const componentId = mesh.metadata?.blueprintFurnitureComponentId;
      return componentId && glowComponents.includes(componentId) && mesh.material;
    });
    const spinNodeIds = Array.isArray(effect.spinNodes) ? effect.spinNodes : [];
    const spinNodes = node.getChildTransformNodes(false).filter((child) => {
      return spinNodeIds.includes(child.metadata?.powerMotionId);
    });
    const pulseScaleIds = Array.isArray(effect.pulseScaleComponents) ? effect.pulseScaleComponents : [];
    const pulseScaleMeshes = node.getChildMeshes().filter((mesh) => {
      return pulseScaleIds.includes(mesh.metadata?.blueprintFurnitureComponentId);
    });
    const initialScalings = new Map(pulseScaleMeshes.map((mesh) => [mesh, mesh.scaling.clone()]));

    glowMeshes.forEach((mesh) => {
      if (isOn && !mesh.material.name.endsWith('_cloned')) {
        mesh.material = mesh.material.clone(`${mesh.material.name}_cloned`);
      }
      mesh.material.emissiveColor = isOn ? glowColor.clone() : new BABYLON.Color3(0, 0, 0);
    });

    let elapsed = 0;
    let renderObserver = null;
    const initialRotationY = node.rotation.y;
    const initialPositionX = node.position.x;
    const hasMotion = effect.motion === 'oscillate' || effect.motion === 'vibrate';
    const hasComponentAnimation = spinNodes.length > 0 || pulseScaleMeshes.length > 0;
    if (isOn && (effect.pulse || hasMotion || hasComponentAnimation)) {
      renderObserver = this.scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;
        elapsed += deltaSeconds;

        if (effect.pulse) {
          const pulseSpeed = effect.pulseSpeed ?? 2.5;
          const pulseMin = effect.pulseMin ?? 0.35;
          const pulseMax = effect.pulseMax ?? 1;
          const amount = pulseMin + (pulseMax - pulseMin) * (0.5 + 0.5 * Math.sin(elapsed * pulseSpeed));
          glowMeshes.forEach((mesh) => {
            if (mesh.material) mesh.material.emissiveColor = glowColor.scale(amount);
          });
        }

        spinNodes.forEach((spinNode) => {
          spinNode.rotation.y += deltaSeconds * (effect.spinSpeed ?? 2);
        });

        if (pulseScaleMeshes.length > 0) {
          const scaleAmount = 1 + Math.sin(elapsed * (effect.pulseScaleSpeed ?? 7)) * (effect.pulseScaleAmount ?? 0.035);
          pulseScaleMeshes.forEach((mesh) => {
            const initial = initialScalings.get(mesh);
            if (initial) {
              mesh.scaling.set(initial.x * scaleAmount, initial.y * scaleAmount, initial.z * scaleAmount);
            }
          });
        }

        if (effect.motion === 'oscillate') {
          const speed = effect.motionSpeed ?? 1.5;
          const amplitude = effect.motionAmplitude ?? 0.12;
          node.rotation.y = initialRotationY + Math.sin(elapsed * speed) * amplitude;
        } else if (effect.motion === 'vibrate') {
          const speed = effect.motionSpeed ?? 30;
          const amplitude = effect.motionAmplitude ?? 0.003;
          node.position.x = initialPositionX + Math.sin(elapsed * speed) * amplitude;
        }
      });
    }

    let light = null;
    if (isOn && effect.lightSource) {
      const config = effect.lightSource;
      const offset = config.offset || { x: 0, y: 0, z: 0 };
      const isMeter = definition.unit === 'm';
      const position = new BABYLON.Vector3(
        isMeter ? (offset.x ?? 0) : inchesToUnits(offset.x ?? 0),
        isMeter ? (offset.y ?? 0) : inchesToUnits(offset.y ?? 0),
        isMeter ? (offset.z ?? 0) : inchesToUnits(offset.z ?? 0)
      );
      const color = BABYLON.Color3.FromHexString(config.color || effect.color || '#ffffff');

      if (config.type === 'spot') {
        const direction = config.direction || { x: 0, y: 0, z: 1 };
        light = new BABYLON.SpotLight(
          `item_power_light_${item.id}`,
          position,
          new BABYLON.Vector3(direction.x || 0, direction.y || 0, direction.z || 0),
          config.angle ?? (Math.PI / 4),
          config.exponent ?? 2,
          this.scene
        );
      } else {
        light = new BABYLON.PointLight(`item_power_light_${item.id}`, position, this.scene);
      }
      light.parent = node;
      light.diffuse = color;
      light.specular = color;
      light.intensity = config.intensity ?? 0.8;
      light.range = isMeter ? (config.range ?? 3.0) : inchesToUnits(config.range ?? 120);
    }

    let ownsHealingMusic = false;
    if (isOn && effect.audio === 'healing') {
      healingMusic.acquire(item.id);
      ownsHealingMusic = true;
    }

    node.onDisposeObservable.add(() => {
      if (renderObserver) this.scene.onBeforeRenderObservable.remove(renderObserver);
      if (light) light.dispose();
      if (ownsHealingMusic) healingMusic.release(item.id);
    });
  }

  createMirrorTextureForMesh(mirrorMesh, itemId, node) {
    const mat = mirrorMesh.material;
    if (!mat) return;

    const isMainMirror = !!mirrorMesh.metadata?.isMainMirror;
    const textureSize = this.enableAdvancedRendering
      ? (isMainMirror ? 2048 : 1024)
      : 256;
    const cleanTarget = node || mirrorMesh;

    if (mat.reflectionTexture && !(mat.reflectionTexture instanceof BABYLON.MirrorTexture) && !mat.customReflectionProbe) {
      try {
        mat.reflectionTexture.dispose();
      } catch (_) {}
      mat.reflectionTexture = null;
    }

    if (mat.reflectionTexture && mat.reflectionTexture instanceof BABYLON.MirrorTexture) {
      const currentSize = mat.reflectionTexture.getSize();
      if (currentSize && currentSize.width === textureSize) {
        return;
      }

      if (mat.reflectionTextureObserver && cleanTarget) {
        cleanTarget.onDisposeObservable.remove(mat.reflectionTextureObserver);
        mat.reflectionTextureObserver = null;
      }
      try {
        mat.reflectionTexture.dispose();
      } catch (_) {}
      mat.reflectionTexture = null;
    }

    if (mat.customReflectionProbe) {
      if (mat.reflectionTextureObserver && cleanTarget) {
        cleanTarget.onDisposeObservable.remove(mat.reflectionTextureObserver);
        mat.reflectionTextureObserver = null;
      }
      mat.customReflectionProbe.dispose();
      mat.customReflectionProbe = null;
    }

    if (!mat._savedColors) {
      mat._savedColors = {
        diffuseColor: mat.diffuseColor ? mat.diffuseColor.clone() : new BABYLON.Color3(1, 1, 1),
        specularColor: mat.specularColor ? mat.specularColor.clone() : new BABYLON.Color3(1, 1, 1)
      };
    }

    const mirrorTexture = new BABYLON.MirrorTexture(`mirror_txt_${itemId || 'common'}_${mirrorMesh.uniqueId}`, textureSize, this.scene, false);
    mirrorTexture.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    mirrorTexture.level = 0.6;

    const camera = this.scene.activeCamera;
    let lastRefreshTime = 0;
    const cameraObserver = camera?.onViewMatrixChangedObservable.add(() => {
      const now = Date.now();
      if (now - lastRefreshTime < 100) return;
      lastRefreshTime = now;
      mirrorTexture.resetRefreshCounter();
    });

    mirrorTexture.onDisposeObservable.add(() => {
      if (camera && cameraObserver) {
        camera.onViewMatrixChangedObservable.remove(cameraObserver);
      }
    });

    const isCylinder = mirrorMesh.metadata?.isCylinder;
    const side = mirrorMesh.metadata?.side;
    let localNormal;
    if (isCylinder) {
      localNormal = new BABYLON.Vector3(0, -1, 0);
    } else if (side === 'back') {
      localNormal = new BABYLON.Vector3(0, 0, 1);
    } else {
      localNormal = new BABYLON.Vector3(0, 0, -1);
    }
    mirrorMesh.computeWorldMatrix(true);
    const worldMatrix = mirrorMesh.getWorldMatrix();
    const normal = BABYLON.Vector3.TransformNormal(localNormal, worldMatrix).normalize();
    const pos = mirrorMesh.getAbsolutePosition();
    mirrorTexture.mirrorPlane = BABYLON.Plane.FromPositionAndNormal(pos, normal);

    let excludeId = itemId || null;
    if (!excludeId && mat.name) {
      const match = mat.name.match(/^(item|wall|floor|ceiling)_([\w\-]+)/);
      if (match) {
        excludeId = match[2];
      }
    }

    this.scene.meshes.forEach((m) => {
      if (m !== mirrorMesh) {
        if (m.name && (
          m.name.includes('grid_3d') ||
          m.name.includes('floor_grid_3d') ||
          m.name.includes('edit_handle') ||
          m.name.includes('move_handle_collision')
        )) {
          return;
        }
        if (m.metadata?.blueprintEditHandle) {
          return;
        }
        if (excludeId && (m.name.includes(excludeId) || (m.material && m.material.name.includes(excludeId)))) {
          return;
        }
        mirrorTexture.renderList.push(m);
      }
    });

    mat.reflectionTexture = mirrorTexture;
    mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    mat.specularColor = new BABYLON.Color3(0, 0, 0);

    if (cleanTarget) {
      const observer = cleanTarget.onDisposeObservable.add(() => {
        try {
          mirrorTexture.dispose();
        } catch (_) {}
      });
      mat.reflectionTextureObserver = observer;
    }
  }

  createReflectionProbeForMesh(mirrorMesh, itemId, node) {
    const mat = mirrorMesh.material;
    if (!mat) return;
    const bpMaterial = mat.metadata?.blueprintMaterial;
    const isMirrorKind = bpMaterial?.kind === 'mirror';

    if (mat.customReflectionProbe) {
      return;
    }

    if (!isMirrorKind && !mat._savedStaticReflectionTexture) {
      mat._savedStaticReflectionTexture = mat.reflectionTexture;
    }

    if (mat.reflectionTexture && mat.reflectionTexture instanceof BABYLON.MirrorTexture) {
      const cleanTarget = node || mirrorMesh;
      if (mat.reflectionTextureObserver && cleanTarget) {
        cleanTarget.onDisposeObservable.remove(mat.reflectionTextureObserver);
        mat.reflectionTextureObserver = null;
      }
      try {
        mat.reflectionTexture.dispose();
      } catch (_) {}
      mat.reflectionTexture = null;
    }

    const probe = new BABYLON.ReflectionProbe(`probe_${itemId || 'common'}_${mirrorMesh.uniqueId}`, 256, this.scene, false);
    probe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    probe.position = mirrorMesh.getAbsolutePosition();

    if (isMirrorKind) {
      probe.cubeTexture.level = 0.6;
      probe.cubeTexture.coordinatesMode = BABYLON.Texture.INVCUBIC_MODE;

      const currentRoomId = this.getMeshRoomId(mirrorMesh);
      const room = currentRoomId ? this.document.getRoom(currentRoomId) : null;
      let sizeX = 5.0;
      let sizeZ = 5.0;
      let sizeY = 3.0;

      if (room) {
        const bounds = getRoomBounds(room);
        if (bounds) {
          sizeX = Math.max(3.0, bounds.right - bounds.left);
          sizeZ = Math.max(3.0, bounds.bottom - bounds.top);
          sizeY = room.wallHeight ?? this.floorplan.wallHeight ?? 2.8;
        }
      }

      probe.cubeTexture.boundingBoxPosition = mirrorMesh.getAbsolutePosition();
      probe.cubeTexture.boundingBoxSize = new BABYLON.Vector3(sizeX, sizeY, sizeZ);
    } else {
      const originalLevel = mat._savedStaticReflectionTexture ? mat._savedStaticReflectionTexture.level : 0.55;
      probe.cubeTexture.level = originalLevel;
    }

    mat.customReflectionProbe = probe;
    mat.reflectionTexture = probe.cubeTexture;

    if (isMirrorKind) {
      if (!mat._savedColors) {
        mat._savedColors = {
          diffuseColor: mat.diffuseColor ? mat.diffuseColor.clone() : new BABYLON.Color3(1, 1, 1),
          specularColor: mat.specularColor ? mat.specularColor.clone() : new BABYLON.Color3(1, 1, 1)
        };
      }
      mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
      mat.specularColor = new BABYLON.Color3(0, 0, 0);
    }

    probe.renderList = [];
    const currentRoomId = this.getMeshRoomId(mirrorMesh);

    let excludeId = itemId || null;
    if (!excludeId && mat.name) {
      const match = mat.name.match(/^(item|wall|floor|ceiling)_([\w\-]+)/);
      if (match) {
        excludeId = match[2];
      }
    }

    this.scene.meshes.forEach((otherMesh) => {
      if (otherMesh === mirrorMesh) return;
      if (otherMesh.name && (
        otherMesh.name.includes('grid_3d') ||
        otherMesh.name.includes('floor_grid_3d') ||
        otherMesh.name.includes('edit_handle') ||
        otherMesh.name.includes('move_handle_collision')
      )) {
        return;
      }
      if (otherMesh.metadata?.blueprintEditHandle) {
        return;
      }
      if (excludeId && (otherMesh.name.includes(excludeId) || (otherMesh.material && otherMesh.material.name.includes(excludeId)))) {
        return;
      }
      const otherRoomId = this.getMeshRoomId(otherMesh);
      if (currentRoomId && otherRoomId && otherRoomId !== currentRoomId) {
        return;
      }
      probe.renderList.push(otherMesh);
    });

    const cleanTarget = node || mirrorMesh;
    if (cleanTarget) {
      const observer = cleanTarget.onDisposeObservable.add(() => {
        try {
          probe.dispose();
        } catch (_) {}
        mat.customReflectionProbe = null;
      });
      mat.reflectionTextureObserver = observer;
    }
  }

  restoreStaticReflectionTextureForMesh(mirrorMesh, node) {
    const mat = mirrorMesh.material;
    if (!mat) return;

    if (mat.customReflectionProbe) {
      const cleanTarget = node || mirrorMesh;
      if (mat.reflectionTextureObserver && cleanTarget) {
        cleanTarget.onDisposeObservable.remove(mat.reflectionTextureObserver);
        mat.reflectionTextureObserver = null;
      }
      try {
        mat.customReflectionProbe.dispose();
      } catch (_) {}
      mat.customReflectionProbe = null;
    }

    if (mat._savedStaticReflectionTexture) {
      mat.reflectionTexture = mat._savedStaticReflectionTexture;
    }

    if (mat._savedColors) {
      mat.diffuseColor = mat._savedColors.diffuseColor.clone();
      mat.specularColor = mat._savedColors.specularColor.clone();
    }
  }

  applyReflectionToMesh(mesh, itemId, node) {
    const mat = mesh.material;
    if (!mat) return;
    const bpMaterial = mat.metadata?.blueprintMaterial;
    if (!bpMaterial) return;

    const currentFloorId = this.floorplan.currentFloorId;
    const meshFloorId = node?.metadata?.floorId || mesh.metadata?.floorId;
    if (meshFloorId && currentFloorId && meshFloorId !== currentFloorId) {
      this.restoreStaticReflectionTextureForMesh(mesh, node);
      return;
    }

    if (bpMaterial.kind === 'mirror') {
      const isMainMirror = !!mesh.metadata?.isMainMirror;
      if (this.enableAdvancedRendering) {
        this.createMirrorTextureForMesh(mesh, itemId, node);
      } else {
        if (isMainMirror) {
          this.createMirrorTextureForMesh(mesh, itemId, node);
        } else {
          this.createReflectionProbeForMesh(mesh, itemId, node);
        }
      }
    } else if (bpMaterial.kind === 'metal') {
      if (this.enableAdvancedRendering) {
        this.createReflectionProbeForMesh(mesh, itemId, node);
      } else {
        this.restoreStaticReflectionTextureForMesh(mesh, node);
      }
    }
  }

  getMeshRoomId(mesh) {
    if (!mesh) return null;

    if (mesh.metadata && mesh.metadata.blueprintRoomId) {
      return mesh.metadata.blueprintRoomId;
    }

    let current = mesh;
    let wallIdFromOpening = null;
    while (current) {
      if (current.metadata && current.metadata.blueprintRoomId) {
        return current.metadata.blueprintRoomId;
      }
      if (current.metadata && current.metadata.blueprintOpeningId) {
        wallIdFromOpening = current.metadata.wallId;
      }
      current = current.parent;
    }

    if (wallIdFromOpening) {
      const wall = this.document.getWall(wallIdFromOpening);
      if (wall) {
        const [x1, z1] = wall.from;
        const [x2, z2] = wall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const angle = -Math.atan2(dz, dx);
        const nx = Math.sin(angle);
        const nz = Math.cos(angle);
        const T = this.floorplan.wallThickness || 0.15;
        const pos = mesh.getAbsolutePosition();

        const rx = pos.x - x1;
        const rz = pos.z - z1;
        const dot = rx * nx + rz * nz;
        const preferredSide = dot >= 0 ? 1 : -1;
        const sides = [preferredSide, -preferredSide];
        for (const sideSign of sides) {
          const checkX = pos.x + sideSign * T * nx;
          const checkZ = pos.z + sideSign * T * nz;
          const room = this.floorplan.floor.rooms.find((r) => r.floorId === wall.floorId && pointInRoom(r, checkX, checkZ));
          if (room) {
            return room.id;
          }
        }
      }
    }

    if (mesh.metadata && mesh.metadata.blueprintWallId && mesh.metadata.side) {
      const wall = this.document.getWall(mesh.metadata.blueprintWallId);
      if (wall) {
        const [x1, z1] = wall.from;
        const [x2, z2] = wall.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const angle = -Math.atan2(dz, dx);
        const nx = Math.sin(angle);
        const nz = Math.cos(angle);
        const sideSign = mesh.metadata.side === 'front' ? 1 : -1;
        const T = this.floorplan.wallThickness || 0.15;
        const meshPos = mesh.getAbsolutePosition();

        const checkX = meshPos.x + sideSign * T * nx;
        const checkZ = meshPos.z + sideSign * T * nz;

        const room = this.floorplan.floor.rooms.find((r) => r.floorId === wall.floorId && pointInRoom(r, checkX, checkZ));
        if (room) {
          return room.id;
        }
      }
    }

    const pos = mesh.getAbsolutePosition();
    let floorId = null;
    let floorCur = mesh;
    while (floorCur) {
      if (floorCur.metadata && floorCur.metadata.floorId) {
        floorId = floorCur.metadata.floorId;
        break;
      }
      floorCur = floorCur.parent;
    }
    const matchedRoom = this.floorplan.floor.rooms.find((r) => {
      if (floorId && r.floorId !== floorId) return false;
      return pointInRoom(r, pos.x, pos.z);
    });
    if (matchedRoom) {
      return matchedRoom.id;
    }

    return null;
  }
}
