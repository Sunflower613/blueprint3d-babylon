import * as BABYLON from '@babylonjs/core';
import { BlueprintRegistry } from '../core/BlueprintRegistry.js';
import { createFlatMaterial, createBlueprintMaterial, materialPreviewColor, normalizeMaterialDescriptor } from '../core/materials.js';
import { createBox, createCylinder, createSphere } from '../core/primitives.js';
import { createBuildingFile, parseBuildingFile, stringifyBuildingFile } from '../core/buildingFile.js';
import { stringifyDXF, create3MFPackage } from '../core/exporters.js';
import { FURNITURE_DEFINITIONS, FURNITURE_LIST, getFurnitureDefinition } from '../furniture/index.js';
import { DEFAULT_MATERIAL_PACKS } from '../core/materialCatalog.js';
import { buildOpeningGeometry } from '../openings/index.js';
import { getRoofGeometryData } from '../geometry/roofGeometry.js';
import { buildStairsGeometry } from '../geometry/stairsGeometry.js';
import { buildFenceGeometry } from '../geometry/fenceGeometry.js';


export const BLUEPRINT3D_TEST_FLOORPLAN = {
  name: 'blueprint3dTestMap',
  unit: 'in',
  wallHeight: 2.8,
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

const INCHES_PER_UNIT = 24;
const DEFAULT_WALL_COLOR = '#f9fbff';
const DEFAULT_FLOOR_COLOR = '#f4efe6';
const DEFAULT_FLOOR_ID = 'floor_1';

function cloneFloorplan(floorplan) {
  return JSON.parse(JSON.stringify(floorplan));
}

function inchesToUnits(value) {
  return Number(value || 0) / INCHES_PER_UNIT;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFloorplan(floorplan) {
  const normalized = cloneFloorplan(floorplan);
  const defaultFloorMaterial = DEFAULT_MATERIAL_PACKS.find(p => p.id === 'wood-light-fine') || {
    id: 'wood-light-fine',
    name: '精细浅木',
    category: 'wood',
    kind: 'texture',
    src: 'https://furnishup.github.io/blueprint3d/example/rooms/textures/light_fine_wood.jpg',
    scale: 3,
    color: '#e5c4a3'
  };
  normalized.floor ||= { rooms: [] };
  normalized.floor.color ||= DEFAULT_FLOOR_COLOR;
  if (!normalized.floor.material || normalized.floor.material === DEFAULT_FLOOR_COLOR) {
    normalized.floor.material = defaultFloorMaterial;
  }
  normalized.floors ||= [{ id: DEFAULT_FLOOR_ID, name: '1F', level: 0 }];
  normalized.floors.forEach((floor, index) => {
    floor.id ||= `floor_${index + 1}`;
    floor.name ||= `${index + 1}F`;
    floor.level = Number.isFinite(Number(floor.level)) ? Number(floor.level) : index;
  });
  if (!normalized.floors.length) normalized.floors.push({ id: DEFAULT_FLOOR_ID, name: '1F', level: 0 });
  normalized.currentFloorId ||= normalized.floors[0].id;
  if (!normalized.floors.some((floor) => floor.id === normalized.currentFloorId)) {
    normalized.currentFloorId = normalized.floors[0].id;
  }
  const alignedStoryHeight = (normalized.wallHeight || 2.8) + (normalized.floorHeight || 0.06);
  const legacyStoryHeight = (normalized.wallHeight || 2.8) + 0.35;
  const suppliedStoryHeight = Number(normalized.storyHeight);
  normalized.storyHeight = (!Number.isFinite(suppliedStoryHeight) || Math.abs(suppliedStoryHeight - legacyStoryHeight) < 0.001)
    ? alignedStoryHeight
    : Math.max(alignedStoryHeight, suppliedStoryHeight);

  normalized.floor.rooms ||= [];
  normalized.floor.rooms.forEach((room) => {
    room.floorId ||= DEFAULT_FLOOR_ID;
    room.color ||= normalized.floor.color || DEFAULT_FLOOR_COLOR;
    if (!room.material || room.material === room.color || room.material === DEFAULT_FLOOR_COLOR) {
      room.material = normalized.floor.material;
    }
    room.locked = !!room.locked;
  });
  normalized.walls ||= [];
  normalized.openings ||= [];
  normalized.items ||= [];
  normalized.roofs ||= [];
  normalized.stairs ||= [];
  normalized.fences ||= [];

  normalized.walls.forEach((wall) => {
    wall.floorId ||= DEFAULT_FLOOR_ID;
    wall.color ||= DEFAULT_WALL_COLOR;
    wall.material ||= wall.color;
  });

  normalized.openings.forEach((opening) => {
    const wall = normalized.walls.find((candidate) => candidate.id === opening.wallId);
    opening.floorId ||= wall?.floorId || DEFAULT_FLOOR_ID;
    opening.t = clamp(opening.t ?? 0.5, 0.08, 0.92);
    opening.width ||= opening.type === 'door' ? 0.9 : 1.25;
    opening.locked = !!opening.locked;
    if (opening.type === 'window') {
      opening.height ||= 0.85;
      opening.sillHeight = Math.max(0, Number(opening.sillHeight ?? 1.05));
    }
  });

  normalized.roofs.forEach((roof) => {
    roof.id ||= `roof_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    roof.floorId ||= normalized.currentFloorId || DEFAULT_FLOOR_ID;
    roof.x = Number(roof.x || 0);
    roof.z = Number(roof.z || 0);
    roof.width = Math.max(1, Number(roof.width || 6));
    roof.depth = Math.max(1, Number(roof.depth || 6));
    roof.height = Math.max(0.2, Number(roof.height || 1.1));
    roof.type ||= 'gable';
    roof.subtype ||= roof.type || 'gable';
    roof.color ||= '#b75b54';
    roof.material ||= roof.color;
    roof.color = materialPreviewColor(roof.material, roof.color || '#b75b54');
    roof.locked = !!roof.locked;
  });

  normalized.stairs.forEach((stairs) => {
    stairs.id ||= `stairs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    stairs.floorId ||= normalized.currentFloorId || DEFAULT_FLOOR_ID;
    stairs.x = Number(stairs.x || 0);
    stairs.z = Number(stairs.z || 0);
    stairs.width = Math.max(0.6, Number(stairs.width || 1.2));
    stairs.depth = Math.max(1.2, Number(stairs.depth || 3.2));
    stairs.height = Math.max(1, Number(stairs.height || normalized.storyHeight));
    stairs.subtype ||= 'straight';
    stairs.rotation = Number(stairs.rotation || 0);
    stairs.color ||= '#d8c0a0';
    stairs.material ||= stairs.color;
    stairs.color = materialPreviewColor(stairs.material, stairs.color || '#d8c0a0');
    stairs.locked = !!stairs.locked;
  });

  normalized.fences.forEach((fence) => {
    fence.id ||= `fence_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    fence.floorId ||= normalized.currentFloorId || DEFAULT_FLOOR_ID;
    fence.from ||= [0, 0];
    fence.to ||= [2, 0];
    fence.subtype ||= 'picket_wood';
    fence.height = Math.max(0.2, Number(fence.height || 1.1));
    fence.thickness = Math.max(0.04, Number(fence.thickness || 0.1));
    fence.color ||= '#8d6e63';
    fence.material ||= fence.color;
    fence.color = materialPreviewColor(fence.material, fence.color || '#8d6e63');
    fence.locked = !!fence.locked;
  });

  normalized.items.forEach((item) => {
    const room = normalized.floor.rooms.find((candidate) => candidate.id === item.roomId);
    item.floorId ||= room?.floorId || DEFAULT_FLOOR_ID;
    const definition = getFurnitureDefinition(item.type);
    item.name ||= definition.name;
    item.width ||= definition.defaultSize.width;
    item.depth ||= definition.defaultSize.depth;
    item.height ||= definition.defaultSize.height;
    item.elevation = Number(item.elevation || 0); // 确保离地高度为数字类型
    item.scale = Math.max(0.5, Math.min(4, Number(item.scale || 1)));
    delete item.localX;
    delete item.localZ;
    item.colors ||= {};
    item.materials ||= {};
    definition.components.forEach((component) => {
      item.colors[component.id] ||= component.defaultColor;
      item.materials[component.id] ||= item.colors[component.id];
    });
  });

  return normalized;
}

function wallPoint(wall, t) {
  return {
    x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    z: wall.from[1] + (wall.to[1] - wall.from[1]) * t
  };
}

function setWallEndpoints(wall, from, to) {
  if (!wall) return;
  wall.from = [Number(from[0].toFixed(3)), Number(from[1].toFixed(3))];
  wall.to = [Number(to[0].toFixed(3)), Number(to[1].toFixed(3))];
}

function pointInRoom(room, x, z) {
  return x >= room.x - room.width / 2 && x <= room.x + room.width / 2 && z >= room.z - room.depth / 2 && z <= room.z + room.depth / 2;
}

function roomEdges(room) {
  const left = room.x - room.width / 2;
  const right = room.x + room.width / 2;
  const top = room.z - room.depth / 2;
  const bottom = room.z + room.depth / 2;
  return { left, right, top, bottom };
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

export class Blueprint3DTestMap extends BlueprintRegistry {
  constructor(scene, options = {}) {
    super(scene, { name: options.name || 'blueprint3dTestMap' });
    this.floorplan = normalizeFloorplan(options.floorplan || BLUEPRINT3D_TEST_FLOORPLAN);
    this.materials = this.createMaterials(options.palette || {});
    this.itemNodes = new Map();
    this.wallNodes = new Map();
    this.floorNodes = new Map();
    this.openingNodes = new Map();
    this.roofNodes = new Map();
    this.stairNodes = new Map();
    this.fenceNodes = new Map();
    this.selectedItemId = null;
    this.selectedWallId = null;
    this.selectedFenceId = null;
    this.build();
  }

  createMaterials(palette) {
    return {
      floor: createFlatMaterial(this.scene, 'blueprintFloor', palette.floor || this.floorplan.floor.color),
      selected: createFlatMaterial(this.scene, 'blueprintSelected', palette.selected || '#36c2ff', { emissive: true }),
      door: createFlatMaterial(this.scene, 'blueprintDoor', palette.door || '#8c5a32'),
      window: createFlatMaterial(this.scene, 'blueprintWindow', palette.window || '#75d7ff', { alpha: 0.72, emissive: true, backFaceCulling: false }),
      trim: createFlatMaterial(this.scene, 'blueprintTrim', palette.trim || '#b8c4d4'),
      decor: createFlatMaterial(this.scene, 'blueprintDecor', palette.decor || '#ffffff'),
      roof: createFlatMaterial(this.scene, 'blueprintRoof', palette.roof || '#b75b54'),
      stair: createFlatMaterial(this.scene, 'blueprintStair', palette.stair || '#d8c0a0')
    };
  }

  build() {
    this.clearBuiltMeshes();
    this.buildFloors();
    this.buildWalls();
    this.buildOpenings();
    this.buildRoofs();
    this.buildStairs();
    this.buildFences();
    this.floorplan.items.filter((item) => this.isFloorVisible(item.floorId)).forEach((item) => this.buildItem(item));
    this.setSelectedItem(this.selectedItemId);
    this.setSelectedWall(this.selectedWallId);
    this.setSelectedFence(this.selectedFenceId);
  }

  getCurrentFloor() {
    return this.floorplan.floors.find((floor) => floor.id === this.floorplan.currentFloorId) || this.floorplan.floors[0];
  }

  getFloor(floorId) {
    return this.floorplan.floors.find((floor) => floor.id === floorId) || this.floorplan.floors[0];
  }

  getFloorLevel(floorId) {
    return Number(this.getFloor(floorId)?.level || 0);
  }

  getFloorElevation(floorId) {
    return this.getFloorLevel(floorId) * (this.floorplan.storyHeight || ((this.floorplan.wallHeight || 2.8) + (this.floorplan.floorHeight || 0.06)));
  }

  isFloorVisible(floorId) {
    return this.getFloorLevel(floorId) <= this.getFloorLevel(this.floorplan.currentFloorId);
  }

  isOnCurrentFloor(entity) {
    return (entity?.floorId || DEFAULT_FLOOR_ID) === this.floorplan.currentFloorId;
  }

  getCurrentFloorRooms() {
    return this.floorplan.floor.rooms.filter((room) => this.isOnCurrentFloor(room));
  }

  getCurrentFloorWalls() {
    return this.floorplan.walls.filter((wall) => this.isOnCurrentFloor(wall));
  }

  getCurrentFloorOpenings() {
    return this.floorplan.openings.filter((opening) => this.isOnCurrentFloor(opening));
  }

  getCurrentFloorItems() {
    return this.floorplan.items.filter((item) => this.isOnCurrentFloor(item));
  }

  getCurrentFloorRoofs() {
    return this.floorplan.roofs.filter((roof) => this.isOnCurrentFloor(roof));
  }

  getCurrentFloorStairs() {
    return this.floorplan.stairs.filter((stairs) => this.isOnCurrentFloor(stairs));
  }

  setCurrentFloor(floorId) {
    if (!this.floorplan.floors.some((floor) => floor.id === floorId)) return this.getCurrentFloor();
    this.floorplan.currentFloorId = floorId;
    this.build();
    return this.getCurrentFloor();
  }

  addFloor(partialFloor = {}) {
    const nextLevel = partialFloor.level ?? (Math.max(...this.floorplan.floors.map((floor) => Number(floor.level || 0))) + 1);
    const floor = {
      id: partialFloor.id || `floor_${Date.now()}`,
      name: partialFloor.name || `${nextLevel + 1}F`,
      level: nextLevel
    };
    this.floorplan.floors.push(floor);

    if (partialFloor.copyFromFloorId) {
      this.copyFloorPlanToFloor(partialFloor.copyFromFloorId, floor.id);
    }

    this.floorplan.currentFloorId = floor.id;
    this.build();
    return floor;
  }

  copyFloorPlanToFloor(sourceFloorId, targetFloorId) {
    const suffix = `${targetFloorId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const wallIdMap = new Map();
    const roomIdMap = new Map();

    this.floorplan.walls
      .filter((wall) => (wall.floorId || DEFAULT_FLOOR_ID) === sourceFloorId)
      .forEach((wall, index) => {
        const nextId = `wall_${suffix}_${index}`;
        wallIdMap.set(wall.id, nextId);
        this.floorplan.walls.push({
          ...cloneFloorplan(wall),
          id: nextId,
          from: [...wall.from],
          to: [...wall.to],
          floorId: targetFloorId
        });
      });

    this.floorplan.floor.rooms
      .filter((room) => (room.floorId || DEFAULT_FLOOR_ID) === sourceFloorId)
      .forEach((room, index) => {
        const nextId = `room_${suffix}_${index}`;
        roomIdMap.set(room.id, nextId);
        const wallIds = {};
        Object.entries(room.wallIds || {}).forEach(([side, wallId]) => {
          if (wallIdMap.has(wallId)) wallIds[side] = wallIdMap.get(wallId);
        });
        this.floorplan.floor.rooms.push({
          ...cloneFloorplan(room),
          id: nextId,
          name: room.name,
          floorId: targetFloorId,
          wallIds
        });
      });

    this.floorplan.openings
      .filter((opening) => wallIdMap.has(opening.wallId))
      .forEach((opening, index) => {
        this.floorplan.openings.push({
          ...cloneFloorplan(opening),
          id: `${opening.type || 'opening'}_${suffix}_${index}`,
          wallId: wallIdMap.get(opening.wallId),
          floorId: targetFloorId
        });
      });

    return { wallIdMap, roomIdMap };
  }

  moveFloor(floorId, direction) {
    const floors = [...this.floorplan.floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
    const index = floors.findIndex((floor) => floor.id === floorId);
    if (index < 0) return false;
    const swapIndex = direction === 'up' ? index + 1 : index - 1;
    if (swapIndex < 0 || swapIndex >= floors.length) return false;
    const currentLevel = floors[index].level;
    floors[index].level = floors[swapIndex].level;
    floors[swapIndex].level = currentLevel;
    this.build();
    return true;
  }

  deleteFloor(floorId) {
    if (this.floorplan.floors.length <= 1) return false;
    const floor = this.floorplan.floors.find((candidate) => candidate.id === floorId);
    if (!floor) return false;
    const removedWallIds = new Set(this.floorplan.walls.filter((wall) => (wall.floorId || DEFAULT_FLOOR_ID) === floorId).map((wall) => wall.id));
    this.floorplan.floors = this.floorplan.floors.filter((candidate) => candidate.id !== floorId);
    this.floorplan.floor.rooms = this.floorplan.floor.rooms.filter((room) => (room.floorId || DEFAULT_FLOOR_ID) !== floorId);
    this.floorplan.walls = this.floorplan.walls.filter((wall) => (wall.floorId || DEFAULT_FLOOR_ID) !== floorId);
    this.floorplan.openings = this.floorplan.openings.filter((opening) => (opening.floorId || DEFAULT_FLOOR_ID) !== floorId && !removedWallIds.has(opening.wallId));
    this.floorplan.items = this.floorplan.items.filter((item) => (item.floorId || DEFAULT_FLOOR_ID) !== floorId);
    this.floorplan.roofs = this.floorplan.roofs.filter((roof) => (roof.floorId || DEFAULT_FLOOR_ID) !== floorId);
    this.floorplan.stairs = this.floorplan.stairs.filter((stairs) => (stairs.floorId || DEFAULT_FLOOR_ID) !== floorId);
    if (this.floorplan.currentFloorId === floorId) {
      const nextFloor = [...this.floorplan.floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0))[0];
      this.floorplan.currentFloorId = nextFloor.id;
    }
    this.build();
    return true;
  }

  clearBuiltMeshes() {
    this.itemNodes.forEach((node) => node.dispose(false, true));
    this.wallNodes.forEach((node) => node.dispose(false, true));
    this.floorNodes.forEach((node) => node.dispose(false, true));
    this.openingNodes.forEach((node) => node.dispose(false, true));
    this.roofNodes.forEach((node) => node.dispose(false, true));
    this.stairNodes.forEach((node) => node.dispose(false, true));
    this.fenceNodes.forEach((node) => node.dispose(false, true));
    this.itemNodes.clear();
    this.wallNodes.clear();
    this.floorNodes.clear();
    this.openingNodes.clear();
    this.roofNodes.clear();
    this.stairNodes.clear();
    this.fenceNodes.clear();
    this.shadowCasters.length = 0;
    this.colliders.length = 0;
    this.root.getChildren().forEach((child) => child.dispose(false, true));
  }

  getStairFloorHoles(room) {
    const roomLevel = this.getFloorLevel(room.floorId);
    const left = room.x - room.width / 2;
    const right = room.x + room.width / 2;
    const top = room.z - room.depth / 2;
    const bottom = room.z + room.depth / 2;
    return this.floorplan.stairs
      .filter((stairs) => this.getFloorLevel(stairs.floorId) === roomLevel - 1)
      .map((stairs) => {
        const rotation = Number(stairs.rotation || 0);
        const halfWidth = Math.abs(Math.cos(rotation)) * Number(stairs.width || 1.2) / 2 + Math.abs(Math.sin(rotation)) * Number(stairs.depth || 3.2) / 2;
        const halfDepth = Math.abs(Math.sin(rotation)) * Number(stairs.width || 1.2) / 2 + Math.abs(Math.cos(rotation)) * Number(stairs.depth || 3.2) / 2;
        return {
          left: Math.max(left, Number(stairs.x || 0) - halfWidth),
          right: Math.min(right, Number(stairs.x || 0) + halfWidth),
          top: Math.max(top, Number(stairs.z || 0) - halfDepth),
          bottom: Math.min(bottom, Number(stairs.z || 0) + halfDepth)
        };
      })
      .filter((hole) => hole.right - hole.left > 0.05 && hole.bottom - hole.top > 0.05);
  }

  buildFloorPiece(group, room, material, ceilingMaterial, rect, index) {
    const width = rect.right - rect.left;
    const depth = rect.bottom - rect.top;
    if (width <= 0.01 || depth <= 0.01) return;
    const centerX = (rect.left + rect.right) / 2;
    const centerZ = (rect.top + rect.bottom) / 2;
    const piece = createBox(this, `floor_${room.id}_${index}`, {
      width,
      height: this.floorplan.floorHeight,
      depth
    }, {
      position: { x: centerX - room.x, y: 0, z: centerZ - room.z }
    }, {
      parent: group,
      material,
      receiveShadows: true,
      shadowCaster: false
    });
    piece.metadata = { blueprintRoomId: room.id, locked: !!room.locked };

    const ceilingThickness = 0.002;
    const ceilingPiece = createBox(this, `ceiling_${room.id}_${index}`, {
      width,
      height: ceilingThickness,
      depth
    }, {
      position: { x: centerX - room.x, y: -this.floorplan.floorHeight / 2 - ceilingThickness / 2, z: centerZ - room.z }
    }, {
      parent: group,
      material: ceilingMaterial,
      receiveShadows: true,
      shadowCaster: false
    });
    ceilingPiece.metadata = { blueprintRoomId: room.id, locked: !!room.locked };
  }

  buildFloors() {
    this.floorplan.floor.rooms.filter((room) => this.isFloorVisible(room.floorId)).forEach((room) => {
      const floorY = this.getFloorElevation(room.floorId);
      const floorMaterial = createBlueprintMaterial(this.scene, `floor_${room.id}`, room.material || this.floorplan.floor.material || room.color || this.floorplan.floor.color, {
        fallbackColor: room.color || this.floorplan.floor.color || DEFAULT_FLOOR_COLOR
      });
      const ceilingMaterial = createBlueprintMaterial(this.scene, `ceiling_${room.id}`, '#ffffff', {
        fallbackColor: '#ffffff'
      });
      const group = new BABYLON.TransformNode(`floor_${room.id}`, this.scene);
      group.position.set(room.x, floorY - this.floorplan.floorHeight / 2, room.z);
      group.metadata = { blueprintRoomId: room.id, locked: !!room.locked };
      this.add(group, { shadowCaster: false });

      const roomRect = {
        left: room.x - room.width / 2,
        right: room.x + room.width / 2,
        top: room.z - room.depth / 2,
        bottom: room.z + room.depth / 2
      };
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

      this.floorNodes.set(room.id, group);
      this.addCollider({
        type: 'floor',
        worldX: room.x,
        worldZ: room.z,
        worldY: floorY,
        radius: Math.max(room.width, room.depth) / 2
      });
    });
  }

  buildWalls() {
    const visibleWalls = this.floorplan.walls.filter((wall) => this.isFloorVisible(wall.floorId));
    // 1. 构建拓扑节点映射，以便识别墙角关系
    const vertexMap = new Map();
    visibleWalls.forEach((w) => {
      const [wx1, wz1] = w.from;
      const [wx2, wz2] = w.to;
      const p1 = `${wx1.toFixed(3)},${wz1.toFixed(3)}`;
      const p2 = `${wx2.toFixed(3)},${wz2.toFixed(3)}`;
      
      if (!vertexMap.has(p1)) vertexMap.set(p1, []);
      if (!vertexMap.has(p2)) vertexMap.set(p2, []);
      
      vertexMap.get(p1).push({ wall: w, isFrom: true });
      vertexMap.get(p2).push({ wall: w, isFrom: false });
    });

    visibleWalls.forEach((wall) => {
      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length <= 0.01) return;

      const descFront = wall.materialFront || wall.material || wall.color || DEFAULT_WALL_COLOR;
      const descBack = wall.materialBack || wall.material || wall.color || DEFAULT_WALL_COLOR;
      const wallMaterialOptions = { fallbackColor: wall.color || DEFAULT_WALL_COLOR, flatShading: false, backFaceCulling: false };
      const matFront = createBlueprintMaterial(this.scene, `wall_${wall.id}_front`, descFront, wallMaterialOptions);
      const matBack = createBlueprintMaterial(this.scene, `wall_${wall.id}_back`, descBack, wallMaterialOptions);

      // 2. 墙角 L 形拓扑判定与延伸长度计算
      const p1Key = `${x1.toFixed(3)},${z1.toFixed(3)}`;
      const p2Key = `${x2.toFixed(3)},${z2.toFixed(3)}`;
      
      const adj1 = (vertexMap.get(p1Key) || []).filter(adj => adj.wall.id !== wall.id);
      const adj2 = (vertexMap.get(p2Key) || []).filter(adj => adj.wall.id !== wall.id);
      
      const hasMiter1 = adj1.length === 1;
      const hasMiter2 = adj2.length === 1;

      const T = this.floorplan.wallThickness;
      const H = this.floorplan.wallHeight;
      const floorY = this.getFloorElevation(wall.floorId);
      const FH = this.floorplan.floorHeight || 0.06;

      // 归一化墙体方向向量 (从 p1 指向 p2)
      const ux = dx / length;
      const uz = dz / length;

      // 计算斜切端向外额外延伸的长度，使得斜切后外侧尖角保持完整
      const getExtLen = (P, otherP, adjWall) => {
        const [ax1, az1] = adjWall.from;
        const [ax2, az2] = adjWall.to;
        const ap1 = { x: ax1, z: az1 };
        const ap2 = { x: ax2, z: az2 };
        const AP_other = (Math.abs(ap1.x - P.x) < 0.01 && Math.abs(ap1.z - P.z) < 0.01) ? ap2 : ap1;
        
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

      // 3. 收集并排序门窗区间
      const wallOpenings = this.floorplan.openings.filter((op) => op.wallId === wall.id && this.isFloorVisible(op.floorId));
      const intervals = [];
      wallOpenings.forEach((opening) => {
        const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
        const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
        const sillHeight = opening.type === 'door' ? 0 : (opening.sillHeight ?? 1.05);
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

      // 按照 left 升序排序
      intervals.sort((a, b) => a.left - b.left);

      const subBoxes = [];
      let curX = X_min;

      intervals.forEach((inter) => {
        // 实心段
        if (inter.left > curX + 0.001) {
          subBoxes.push({
            xStart: curX,
            xEnd: inter.left,
            yStart: -FH,
            yEnd: H
          });
        }
        // 窗下墙
        if (inter.sillHeight > 0.01) {
          subBoxes.push({
            xStart: Math.max(X_min, inter.left),
            xEnd: Math.min(X_max, inter.right),
            yStart: -FH,
            yEnd: inter.sillHeight
          });
        }
        // 过梁墙
        if (inter.sillHeight + inter.height < H - 0.01) {
          subBoxes.push({
            xStart: Math.max(X_min, inter.left),
            xEnd: Math.min(X_max, inter.right),
            yStart: inter.sillHeight + inter.height,
            yEnd: H
          });
        }
        curX = inter.right;
      });

      // 最后一个实心段
      if (curX < X_max - 0.001) {
        subBoxes.push({
          xStart: curX,
          xEnd: X_max,
          yStart: -FH,
          yEnd: H
        });
      }

      // 创建 TransformNode 容器
      const wallGroup = new BABYLON.TransformNode(`wall_group_${wall.id}`, this.scene);
      wallGroup.position.set(x1, 0, z1);
      wallGroup.rotation.y = -Math.atan2(dz, dx);
      wallGroup.metadata = { blueprintWallId: wall.id, floorId: wall.floorId, originalLength: length };
      wallGroup.computeWorldMatrix(true);

      // 辅助：执行 CSG 剪切 cutter 的局部函数
      const applyMiterCutterToCSG = (currentCSG, P, otherP, adjWall) => {
        const [ax1, az1] = adjWall.from;
        const [ax2, az2] = adjWall.to;
        const ap1 = { x: ax1, z: az1 };
        const ap2 = { x: ax2, z: az2 };
        const AP_other = (Math.abs(ap1.x - P.x) < 0.01 && Math.abs(ap1.z - P.z) < 0.01) ? ap2 : ap1;
        
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
        
        cutter.position.set(cutterPos.x, floorY + H / 2, cutterPos.z);
        cutter.rotation.y = -Math.atan2(w.z, w.x);
        
        let cutterCSG = BABYLON.CSG.FromMesh(cutter);
        let newCSG = currentCSG.subtract(cutterCSG);
        cutter.dispose();
        return newCSG;
      };

      // 4. 生成正面/背面子 Box 网格
      subBoxes.forEach((box, idx) => {
        const width = box.xEnd - box.xStart;
        const height = box.yEnd - box.yStart;
        if (width <= 0.001 || height <= 0.001) return;

        const localX = (box.xStart + box.xEnd) / 2;
        const localY = (box.yStart + box.yEnd) / 2;
        const isFirst = (idx === 0);
        const isLast = (idx === subBoxes.length - 1);
        
        const angle = -Math.atan2(dz, dx);
        const nx = Math.sin(angle);
        const nz = Math.cos(angle);

        // 正面 Box
        let subMeshFront = BABYLON.MeshBuilder.CreateBox(`wall_sub_${wall.id}_${idx}_f`, {
          width: width,
          height: height,
          depth: T / 2
        }, this.scene);
        subMeshFront.position.set(x1 + localX * ux + (T / 4) * nx, floorY + localY, z1 + localX * uz + (T / 4) * nz);
        subMeshFront.rotation.y = angle;
        subMeshFront.material = matFront;

        let finalSubMeshFront = subMeshFront;
        if ((isFirst && hasMiter1) || (isLast && hasMiter2)) {
          let subCSG = BABYLON.CSG.FromMesh(subMeshFront);
          if (isFirst && hasMiter1) {
            subCSG = applyMiterCutterToCSG(subCSG, { x: x1, z: z1 }, { x: x2, z: z2 }, adj1[0].wall);
          }
          if (isLast && hasMiter2) {
            subCSG = applyMiterCutterToCSG(subCSG, { x: x2, z: z2 }, { x: x1, z: z1 }, adj2[0].wall);
          }
          finalSubMeshFront = subCSG.toMesh(`wall_sub_mitered_${wall.id}_${idx}_f`, matFront, this.scene);
          subMeshFront.dispose();
        }
        normalizeWallSegmentMesh(finalSubMeshFront);
        finalSubMeshFront.setParent(wallGroup);
        finalSubMeshFront.metadata = { blueprintWallId: wall.id, side: 'front' };
        this.shadowCasters.push(finalSubMeshFront);

        // 背面 Box
        let subMeshBack = BABYLON.MeshBuilder.CreateBox(`wall_sub_${wall.id}_${idx}_b`, {
          width: width,
          height: height,
          depth: T / 2
        }, this.scene);
        subMeshBack.position.set(x1 + localX * ux - (T / 4) * nx, floorY + localY, z1 + localX * uz - (T / 4) * nz);
        subMeshBack.rotation.y = angle;
        subMeshBack.material = matBack;

        let finalSubMeshBack = subMeshBack;
        if ((isFirst && hasMiter1) || (isLast && hasMiter2)) {
          let subCSG = BABYLON.CSG.FromMesh(subMeshBack);
          if (isFirst && hasMiter1) {
            subCSG = applyMiterCutterToCSG(subCSG, { x: x1, z: z1 }, { x: x2, z: z2 }, adj1[0].wall);
          }
          if (isLast && hasMiter2) {
            subCSG = applyMiterCutterToCSG(subCSG, { x: x2, z: z2 }, { x: x1, z: z1 }, adj2[0].wall);
          }
          finalSubMeshBack = subCSG.toMesh(`wall_sub_mitered_${wall.id}_${idx}_b`, matBack, this.scene);
          subMeshBack.dispose();
        }
        normalizeWallSegmentMesh(finalSubMeshBack);
        finalSubMeshBack.setParent(wallGroup);
        finalSubMeshBack.metadata = { blueprintWallId: wall.id, side: 'back' };
        this.shadowCasters.push(finalSubMeshBack);
      });

      // 设置高亮
      const isSelected = wall.id === this.selectedWallId;
      wallGroup.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = isSelected;
        mesh.outlineWidth = 0.04;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });

      this.wallNodes.set(wall.id, wallGroup);
    });
  }

  buildOpenings() {
    this.floorplan.openings.filter((opening) => this.isFloorVisible(opening.floorId)).forEach((opening) => {
      const wall = this.getWall(opening.wallId);
      if (!wall) return;
      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const angle = -Math.atan2(dz, dx);
      const pos = wallPoint(wall, opening.t ?? 0.5);
      const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
      const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
      const localY = opening.type === 'door' ? height / 2 : (opening.sillHeight ?? 1.05) + height / 2;
      const floorY = this.getFloorElevation(opening.floorId || wall.floorId);

      const openingGroup = new BABYLON.TransformNode(`opening_group_${opening.id}`, this.scene);
      openingGroup.position.set(pos.x, floorY + localY, pos.z);
      openingGroup.rotation.y = angle;
      openingGroup.metadata = { blueprintOpeningId: opening.id, type: opening.type, wallId: opening.wallId, floorId: opening.floorId, locked: !!opening.locked };

      const wallT = this.floorplan.wallThickness;
      const frameT = wallT + 0.02;
      const frameW = 0.04;
      buildOpeningGeometry(this, opening, openingGroup, { width, height, frameT, frameW });

      this.openingNodes.set(opening.id, openingGroup);
    });
  }

  buildRoofs() {
    this.floorplan.roofs.filter((roof) => this.isFloorVisible(roof.floorId)).forEach((roof) => {
      const floorY = this.getFloorElevation(roof.floorId);
      const width = Math.max(1, Number(roof.width || 6));
      const depth = Math.max(1, Number(roof.depth || 6));
      const height = Math.max(0.2, Number(roof.height || 1.1));
      const eaveY = floorY + (this.floorplan.wallHeight || 2.8);
      const material = createBlueprintMaterial(this.scene, `roof_${roof.id}_mat`, roof.material || roof.color || '#b75b54', {
        fallbackColor: roof.color || '#b75b54',
        flatShading: true,
        backFaceCulling: false
      });
      const mesh = new BABYLON.Mesh(`roof_${roof.id}`, this.scene);
      
      const subtype = roof.subtype || roof.type || 'gable';
      const { positions, indices } = getRoofGeometryData(subtype, width, depth, height);

      const normals = [];
      BABYLON.VertexData.ComputeNormals(positions, indices, normals);
      const vertexData = new BABYLON.VertexData();
      vertexData.positions = positions;
      vertexData.indices = indices;
      vertexData.normals = normals;
      vertexData.applyToMesh(mesh);
      mesh.convertToFlatShadedMesh();
      mesh.position.set(roof.x || 0, eaveY, roof.z || 0);
      mesh.rotation.y = roof.rotation || 0;
      mesh.material = material;
      mesh.metadata = { blueprintRoofId: roof.id, floorId: roof.floorId, locked: !!roof.locked };
      mesh.receiveShadows = true;
      mesh.parent = this.root;
      this.shadowCasters.push(mesh);
      this.roofNodes.set(roof.id, mesh);
    });
  }

  buildStairs() {
    this.floorplan.stairs.filter((stairs) => this.isFloorVisible(stairs.floorId)).forEach((stairs) => {
      const floorY = this.getFloorElevation(stairs.floorId);
      const group = new BABYLON.TransformNode(`stairs_${stairs.id}`, this.scene);
      group.position.set(stairs.x || 0, floorY, stairs.z || 0);
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
      const height = Math.max(1, Number(stairs.height || this.floorplan.storyHeight));
      
      buildStairsGeometry(this, group, stairs, material, width, depth, height, steps);

      this.stairNodes.set(stairs.id, group);
    });
  }

  buildFences() {
    this.floorplan.fences.filter((fence) => this.isFloorVisible(fence.floorId)).forEach((fence) => {
      const floorY = this.getFloorElevation(fence.floorId);
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
      group.position.set((x1 + x2) / 2, floorY, (z1 + z2) / 2);
      group.rotation.y = -angle;
      group.parent = this.root;
      group.metadata = { blueprintFenceId: fence.id, floorId: fence.floorId, originalLength: length, locked: !!fence.locked };
      
      const material = createBlueprintMaterial(this.scene, `fence_${fence.id}_mat`, fence.material || fence.color || '#8d6e63', {
        fallbackColor: fence.color || '#8d6e63',
        flatShading: false
      });
      
      buildFenceGeometry(this, group, fence, material, length, fence.height || 1.1, fence.thickness || 0.1);
      
      this.fenceNodes.set(fence.id, group);
    });
  }

  buildItem(item) {
    const definition = getFurnitureDefinition(item.type);
    item.colors ||= {};
    item.materials ||= {};
    definition.components.forEach((component) => {
      item.colors[component.id] ||= component.defaultColor;
      item.materials[component.id] ||= item.colors[component.id];
    });

    const node = new BABYLON.TransformNode(`item_${item.id}`, this.scene);
    const floorY = this.getFloorElevation(item.floorId);
    // Y坐标考虑离地高度，换算为米
    node.position.set(item.x, floorY + inchesToUnits(item.elevation || 0), item.z);
    node.rotation.y = item.rotation || 0;
    node.metadata = { blueprintItemId: item.id, locked: !!item.locked, floorId: item.floorId };
    this.add(node, { shadowCaster: false });

    const itemScale = Number(item.scale || 1);
    const size = {
      width: inchesToUnits(item.width) * itemScale,
      depth: inchesToUnits(item.depth) * itemScale,
      height: inchesToUnits(item.height) * itemScale
    };
    definition.build(this, item, node, size);

    // --- 开关灯自发光与光源联动效果 ---
    const isLightOn = item.lightOn !== false;
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
      const localPos = new BABYLON.Vector3(
        inchesToUnits(offset.x),
        inchesToUnits(offset.y),
        inchesToUnits(offset.z)
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
      light.range = inchesToUnits(lightSourceConfig.range ?? 150);

      node.onDisposeObservable.add(() => {
        light.dispose();
      });
    }

    // --- 镜面反射效果 ---
    if (definition.isMirror) {
      this.scene.executeWhenReady(() => {
        const mirrorMesh = node.getChildMeshes().find((m) => m.metadata?.blueprintFurnitureComponentId === 'mirror');
        if (mirrorMesh) {
          const mirrorTexture = new BABYLON.MirrorTexture(`mirror_txt_${item.id}`, 512, this.scene, true);
          // 在 3D 卫浴镜或全身大立镜中，镜面通常稍微直立或后仰
          // 局部法线方向是 Z 轴正向 (0, 0, 1)
          // 考虑家具旋转角 item.rotation，世界法线为：
          const normal = new BABYLON.Vector3(Math.sin(item.rotation || 0), 0, Math.cos(item.rotation || 0));
          const pos = mirrorMesh.getAbsolutePosition();
          mirrorTexture.mirrorPlane = BABYLON.Plane.FromPositionAndNormal(pos, normal);

          // 填充渲染列表（除了镜面自己和它的后背板）
          this.scene.meshes.forEach((m) => {
            if (m !== mirrorMesh && !m.name.includes(item.id)) {
              mirrorTexture.renderList.push(m);
            }
          });

          if (mirrorMesh.material) {
            mirrorMesh.material.reflectionTexture = mirrorTexture;
            // 降低本身的基础漫反射底色，让镜子更清澈
            mirrorMesh.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
            mirrorMesh.material.specularColor = new BABYLON.Color3(0, 0, 0);
          }
        }
      });
    }



    this.itemNodes.set(item.id, node);
    return node;
  }

  setSelectedItem(itemId) {
    this.selectedItemId = itemId;
    this.itemNodes.forEach((node, id) => {
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = (id === itemId);
        mesh.outlineWidth = 0.035;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  setSelectedWall(wallId) {
    this.selectedWallId = wallId;
    this.wallNodes.forEach((node, id) => {
      const isSelected = (id === wallId);
      if (node.getChildMeshes) {
        node.getChildMeshes().forEach((mesh) => {
          mesh.renderOutline = isSelected;
          mesh.outlineWidth = 0.04;
          mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
        });
      } else {
        node.renderOutline = isSelected;
        node.outlineWidth = 0.04;
        node.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      }
    });
  }

  getRoom(roomId) {
    return this.floorplan.floor.rooms.find((room) => room.id === roomId);
  }

  getRoomAt(x, z) {
    return this.getCurrentFloorRooms().find((room) => pointInRoom(room, x, z));
  }

  assignItemToRoom(itemId, roomId) {
    const item = this.getItem(itemId);
    const room = this.getRoom(roomId);
    if (!item || !room) return item;
    item.roomId = room.id;
    return item;
  }

  refreshItemRoomLinks() {
    this.floorplan.items.forEach((item) => {
      const room = this.floorplan.floor.rooms.find((candidate) => candidate.floorId === item.floorId && pointInRoom(candidate, item.x, item.z));
      if (room) {
        item.roomId = room.id;
      }
    });
  }

  getWall(wallId) {
    return this.floorplan.walls.find((wall) => wall.id === wallId);
  }

  getOpening(openingId) {
    return this.floorplan.openings.find((opening) => opening.id === openingId);
  }

  getItem(itemId) {
    return this.floorplan.items.find((item) => item.id === itemId);
  }

  getFurnitureDefinition(type) {
    return getFurnitureDefinition(type);
  }

  getFurnitureList() {
    return FURNITURE_LIST;
  }

  addItem(partialItem) {
    const definition = getFurnitureDefinition(partialItem.type || 'table');
    const item = {
      id: partialItem.id || `${definition.type}_${Date.now()}`,
      type: definition.type,
      name: partialItem.name || definition.name,
      x: partialItem.x ?? 0,
      z: partialItem.z ?? 0,
      elevation: partialItem.elevation ?? 0,
      width: partialItem.width || definition.defaultSize.width,
      depth: partialItem.depth || definition.defaultSize.depth,
      height: partialItem.height || definition.defaultSize.height,
      rotation: partialItem.rotation || 0,
      locked: false,
      scale: partialItem.scale || 1,
      roomId: partialItem.roomId,
      floorId: partialItem.floorId || this.floorplan.currentFloorId,
      colors: {},
      materials: {}
    };
    definition.components.forEach((component) => {
      item.colors[component.id] = partialItem.colors?.[component.id] || component.defaultColor;
      item.materials[component.id] = partialItem.materials?.[component.id] || item.colors[component.id];
    });
    this.floorplan.items.push(item);
    this.buildItem(item);
    return item;
  }

  updateItem(itemId, patch) {
    const item = this.getItem(itemId);
    if (!item || item.locked) return item;
    Object.assign(item, patch);
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, true);
    this.itemNodes.delete(itemId);
    this.buildItem(item);
    this.setSelectedItem(this.selectedItemId);
    return item;
  }

  updateItemComponentColor(itemId, componentId, color) {
    const item = this.getItem(itemId);
    if (!item || item.locked) return item;
    item.colors ||= {};
    item.colors[componentId] = color;
    item.materials ||= {};
    item.materials[componentId] = color;
    return this.updateItem(itemId, { colors: item.colors, materials: item.materials });
  }

  updateItemComponentMaterial(itemId, componentId, materialDescriptor) {
    const item = this.getItem(itemId);
    if (!item || item.locked) return item;
    item.materials ||= {};
    item.colors ||= {};
    const normalized = normalizeMaterialDescriptor(materialDescriptor, item.colors[componentId] || '#ffffff');
    item.materials[componentId] = normalized;
    item.colors[componentId] = materialPreviewColor(normalized, item.colors[componentId] || '#ffffff');
    return this.updateItem(itemId, { materials: item.materials, colors: item.colors });
  }

  rotateItem(itemId, rotationRadians) {
    return this.updateItem(itemId, { rotation: Number(rotationRadians) || 0 });
  }

  deleteItem(itemId) {
    const item = this.getItem(itemId);
    if (!item || item.locked) return false;
    this.floorplan.items = this.floorplan.items.filter((candidate) => candidate.id !== itemId);
    const oldNode = this.itemNodes.get(itemId);
    if (oldNode) oldNode.dispose(false, true);
    this.itemNodes.delete(itemId);
    return true;
  }

  addWall(from, to) {
    const wall = { id: `wall_${Date.now()}`, from, to, color: DEFAULT_WALL_COLOR, floorId: this.floorplan.currentFloorId };
    this.floorplan.walls.push(wall);
    this.build();
    return wall;
  }

  getWallLength(wallId) {
    const wall = this.getWall(wallId);
    if (!wall) return 0;
    return Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);
  }

  updateWallLength(wallId, length) {
    const wall = this.getWall(wallId);
    if (!wall) return null;
    const nextLength = Math.max(0.2, Number(length) || 0.2);
    const midX = (wall.from[0] + wall.to[0]) / 2;
    const midZ = (wall.from[1] + wall.to[1]) / 2;
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const currentLength = Math.hypot(dx, dz) || 1;
    const ux = dx / currentLength;
    const uz = dz / currentLength;
    setWallEndpoints(wall, [midX - ux * nextLength / 2, midZ - uz * nextLength / 2], [midX + ux * nextLength / 2, midZ + uz * nextLength / 2]);
    this.build();
    return wall;
  }

  updateWall(wallId, patch, options = {}) {
    const wall = this.getWall(wallId);
    if (!wall) return null;
    Object.assign(wall, patch);
    if (options.rebuild !== false) {
      this.build();
    }
    return wall;
  }

  setWallColor(wallId, color) {
    return this.updateWall(wallId, { color, material: color });
  }

  deleteWall(wallId) {
    this.floorplan.walls = this.floorplan.walls.filter((wall) => wall.id !== wallId);
    this.floorplan.openings = this.floorplan.openings.filter((opening) => opening.wallId !== wallId);
    this.floorplan.floor.rooms.forEach((room) => {
      if (!room.wallIds) return;
      Object.entries(room.wallIds).forEach(([side, id]) => {
        if (id === wallId) delete room.wallIds[side];
      });
    });
    this.build();
  }

  addRoom(partialRoom = {}) {
    const width = partialRoom.width || 4;
    const depth = partialRoom.depth || 4;
    const x = partialRoom.x ?? 0;
    const z = partialRoom.z ?? 0;
    const id = partialRoom.id || `room_${Date.now()}`;
    const room = {
      id,
      name: partialRoom.name || '新房间',
      x,
      z,
      width,
      depth,
      floorId: partialRoom.floorId || this.floorplan.currentFloorId,
      locked: !!partialRoom.locked,
      wallIds: {
        north: `${id}_north`,
        east: `${id}_east`,
        south: `${id}_south`,
        west: `${id}_west`
      }
    };
    const { left, right, top, bottom } = roomEdges(room);
    const walls = [
      { id: room.wallIds.north, from: [left, top], to: [right, top], color: DEFAULT_WALL_COLOR, floorId: room.floorId },
      { id: room.wallIds.east, from: [right, top], to: [right, bottom], color: DEFAULT_WALL_COLOR, floorId: room.floorId },
      { id: room.wallIds.south, from: [right, bottom], to: [left, bottom], color: DEFAULT_WALL_COLOR, floorId: room.floorId },
      { id: room.wallIds.west, from: [left, bottom], to: [left, top], color: DEFAULT_WALL_COLOR, floorId: room.floorId }
    ];
    this.floorplan.floor.rooms.push(room);
    this.floorplan.walls.push(...walls);
    this.build();
    return room;
  }

  moveRoom(roomId, dx, dz) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    return this.updateRoom(roomId, {
      x: Number((room.x + dx).toFixed(3)),
      z: Number((room.z + dz).toFixed(3))
    }, { moveItems: true });
  }

  updateRoom(roomId, patch, options = {}) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    if (room.locked && !('locked' in patch)) return room;
    const previous = { x: room.x, z: room.z, width: room.width, depth: room.depth };
    Object.assign(room, patch);
    room.width = Math.max(1.2, Number(room.width));
    room.depth = Math.max(1.2, Number(room.depth));

    const dx = room.x - previous.x;
    const dz = room.z - previous.z;
    const shouldMoveItems = options.moveItems ?? (!('width' in patch) && !('depth' in patch));
    if ((dx || dz) && shouldMoveItems) {
      this.floorplan.items.forEach((item) => {
        if (item.floorId !== room.floorId) return;
        const belongedToRoom = item.roomId === room.id || pointInRoom(previous, item.x, item.z);
        if (!belongedToRoom) return;
        item.x = Number((item.x + dx).toFixed(3));
        item.z = Number((item.z + dz).toFixed(3));
        item.roomId = room.id;
      });
    }

    const { left, right, top, bottom } = roomEdges(room);
    const ids = room.wallIds || {};
    setWallEndpoints(this.getWall(ids.north), [left, top], [right, top]);
    setWallEndpoints(this.getWall(ids.east), [right, top], [right, bottom]);
    setWallEndpoints(this.getWall(ids.south), [right, bottom], [left, bottom]);
    setWallEndpoints(this.getWall(ids.west), [left, bottom], [left, top]);
    if (options.rebuild !== false) this.build();
    return room;
  }

  deleteRoom(roomId) {
    const room = this.getRoom(roomId);
    if (!room || room.locked) return false;
    const wallIds = new Set(Object.values(room.wallIds || {}));
    this.floorplan.items = this.floorplan.items.filter((item) => item.floorId !== room.floorId || (item.roomId !== room.id && !pointInRoom(room, item.x, item.z)));
    this.floorplan.openings = this.floorplan.openings.filter((opening) => !wallIds.has(opening.wallId));
    this.floorplan.walls = this.floorplan.walls.filter((wall) => !wallIds.has(wall.id));
    this.floorplan.floor.rooms = this.floorplan.floor.rooms.filter((candidate) => candidate.id !== room.id);
    this.build();
    return true;
  }

  addRoof(partialRoof = {}) {
    const roof = {
      id: partialRoof.id || `roof_${Date.now()}`,
      floorId: partialRoof.floorId || this.floorplan.currentFloorId,
      x: partialRoof.x ?? 0,
      z: partialRoof.z ?? 0,
      width: partialRoof.width || 6,
      depth: partialRoof.depth || 6,
      height: partialRoof.height || 1.1,
      rotation: partialRoof.rotation || 0,
      type: partialRoof.type || partialRoof.subtype || 'gable',
      subtype: partialRoof.subtype || partialRoof.type || 'gable',
      color: partialRoof.color || '#b75b54',
      material: partialRoof.material || partialRoof.color || '#b75b54',
      locked: !!partialRoof.locked
    };
    this.floorplan.roofs.push(roof);
    this.build();
    return roof;
  }

  addStairs(partialStairs = {}) {
    const stairs = {
      id: partialStairs.id || `stairs_${Date.now()}`,
      floorId: partialStairs.floorId || this.floorplan.currentFloorId,
      x: partialStairs.x ?? 0,
      z: partialStairs.z ?? 0,
      width: partialStairs.width || 1.2,
      depth: partialStairs.depth || 3.2,
      height: partialStairs.height || this.floorplan.storyHeight,
      steps: partialStairs.steps || 9,
      subtype: partialStairs.subtype || 'straight',
      rotation: partialStairs.rotation || 0,
      color: partialStairs.color || '#d8c0a0',
      material: partialStairs.material || partialStairs.color || '#d8c0a0',
      locked: !!partialStairs.locked
    };
    this.floorplan.stairs.push(stairs);
    this.build();
    return stairs;
  }

  getRoof(roofId) {
    return this.floorplan.roofs.find((roof) => roof.id === roofId);
  }

  updateRoof(roofId, patch, rebuild = true) {
    const roof = this.getRoof(roofId);
    if (!roof) return null;
    if (roof.locked && !('locked' in patch)) return roof;
    Object.assign(roof, patch);
    roof.x = Number(roof.x || 0);
    roof.z = Number(roof.z || 0);
    roof.width = Math.max(1, Number(roof.width || 1));
    roof.depth = Math.max(1, Number(roof.depth || 1));
    roof.height = Math.max(0.2, Number(roof.height || 0.2));
    roof.rotation = Number(roof.rotation || 0);
    if (patch.color && !patch.material) roof.material = patch.color;
    roof.color ||= '#b75b54';
    roof.material ||= roof.color;
    roof.color = materialPreviewColor(roof.material, roof.color || '#b75b54');
    if (rebuild) this.build();
    return roof;
  }

  deleteRoof(roofId) {
    const roof = this.getRoof(roofId);
    if (!roof || roof.locked) return false;
    const before = this.floorplan.roofs.length;
    this.floorplan.roofs = this.floorplan.roofs.filter((roof) => roof.id !== roofId);
    if (before !== this.floorplan.roofs.length) this.build();
    return before !== this.floorplan.roofs.length;
  }

  getStairs(stairsId) {
    return this.floorplan.stairs.find((stairs) => stairs.id === stairsId);
  }

  updateStairs(stairsId, patch, rebuild = true) {
    const stairs = this.getStairs(stairsId);
    if (!stairs) return null;
    if (stairs.locked && !('locked' in patch)) return stairs;
    Object.assign(stairs, patch);
    stairs.x = Number(stairs.x || 0);
    stairs.z = Number(stairs.z || 0);
    stairs.width = Math.max(0.6, Number(stairs.width || 0.6));
    stairs.depth = Math.max(1.2, Number(stairs.depth || 1.2));
    stairs.height = Math.max(1, Number(stairs.height || 1));
    stairs.steps = Math.max(3, Math.round(Number(stairs.steps || 9)));
    stairs.rotation = Number(stairs.rotation || 0);
    if (patch.color && !patch.material) stairs.material = patch.color;
    stairs.color ||= '#d8c0a0';
    stairs.material ||= stairs.color;
    stairs.color = materialPreviewColor(stairs.material, stairs.color || '#d8c0a0');
    if (rebuild) this.build();
    return stairs;
  }

  deleteStairs(stairsId) {
    const stairs = this.getStairs(stairsId);
    if (!stairs || stairs.locked) return false;
    const before = this.floorplan.stairs.length;
    this.floorplan.stairs = this.floorplan.stairs.filter((stairs) => stairs.id !== stairsId);
    if (before !== this.floorplan.stairs.length) this.build();
    return before !== this.floorplan.stairs.length;
  }

  addFence(partialFence = {}) {
    const fence = {
      id: partialFence.id || `fence_${Date.now()}`,
      floorId: partialFence.floorId || this.floorplan.currentFloorId,
      from: partialFence.from ? [...partialFence.from] : [0, 0],
      to: partialFence.to ? [...partialFence.to] : [2, 0],
      subtype: partialFence.subtype || 'picket_wood',
      height: Math.max(0.2, Number(partialFence.height || 1.1)),
      thickness: Math.max(0.04, Number(partialFence.thickness || 0.1)),
      color: partialFence.color || '#8d6e63',
      material: partialFence.material || partialFence.color || '#8d6e63',
      locked: !!partialFence.locked
    };
    this.floorplan.fences.push(fence);
    this.build();
    return fence;
  }

  getFence(fenceId) {
    return this.floorplan.fences.find((fence) => fence.id === fenceId);
  }

  updateFence(fenceId, patch, rebuild = true) {
    const fence = this.getFence(fenceId);
    if (!fence) return null;
    if (fence.locked && !('locked' in patch)) return fence;
    Object.assign(fence, patch);
    if (patch.from) fence.from = [...patch.from];
    if (patch.to) fence.to = [...patch.to];
    fence.height = Math.max(0.2, Number(fence.height || 0.2));
    fence.thickness = Math.max(0.04, Number(fence.thickness || 0.04));
    if (patch.color && !patch.material) fence.material = patch.color;
    fence.color ||= '#8d6e63';
    fence.material ||= fence.color;
    fence.color = materialPreviewColor(fence.material, fence.color || '#8d6e63');
    if (rebuild) this.build();
    return fence;
  }

  deleteFence(fenceId) {
    const fence = this.getFence(fenceId);
    if (!fence || fence.locked) return false;
    const before = this.floorplan.fences.length;
    this.floorplan.fences = this.floorplan.fences.filter((fence) => fence.id !== fenceId);
    if (before !== this.floorplan.fences.length) this.build();
    return before !== this.floorplan.fences.length;
  }

  setSelectedFence(fenceId) {
    this.selectedFenceId = fenceId;
    this.fenceNodes.forEach((node, id) => {
      const isSelected = (id === fenceId);
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = isSelected;
        mesh.outlineWidth = 0.04;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  addOpening(wallId, type = 'door', t = 0.5) {
    const wall = this.getWall(wallId);
    if (!wall) return null;
    const opening = {
      id: `${type}_${Date.now()}`,
      type,
      wallId,
      t: clamp(t, 0.08, 0.92),
      width: type === 'door' ? 0.9 : 1.25,
      floorId: wall.floorId || this.floorplan.currentFloorId,
      locked: false
    };
    if (type === 'window') opening.height = 0.85;
    this.floorplan.openings.push(opening);
    this.build();
    return opening;
  }

  updateOpening(openingId, patch, rebuild = true) {
    const opening = this.getOpening(openingId);
    if (!opening) return null;
    if (opening.locked && !('locked' in patch)) return opening;
    Object.assign(opening, patch);
    opening.t = clamp(opening.t ?? 0.5, 0.08, 0.92);
    opening.width = Math.max(0.25, Number(opening.width || (opening.type === 'door' ? 0.9 : 1.25)));
    if (opening.type === 'window') {
      opening.height = Math.max(0.3, Number(opening.height || 0.85));
    }
    if (rebuild) {
      this.build();
    } else {
      this.updateOpeningNodePose(openingId);
    }
    return opening;
  }

  updateOpeningNodePose(openingId) {
    const opening = this.getOpening(openingId);
    const node = this.openingNodes.get(openingId);
    if (!opening || !node) return;
    const wall = this.getWall(opening.wallId);
    if (!wall) return;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const angle = -Math.atan2(dz, dx);
    const pos = wallPoint(wall, opening.t ?? 0.5);
    const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
    const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
    const localY = opening.type === 'door' ? height / 2 : (opening.sillHeight ?? 1.05) + height / 2;
    const floorY = this.getFloorElevation(opening.floorId || wall.floorId);

    node.position.set(pos.x, floorY + localY, pos.z);
    node.rotation.y = angle;
  }


  deleteOpening(openingId) {
    const opening = this.getOpening(openingId);
    if (!opening || opening.locked) return false;
    this.floorplan.openings = this.floorplan.openings.filter((opening) => opening.id !== openingId);
    this.build();
    return true;
  }

  setFloorColor(color) {
    this.floorplan.floor.color = color;
    this.floorplan.floor.material = color;
    this.floorplan.floor.rooms.forEach((room) => {
      room.color = color;
      room.material = color;
    });
    this.materials.floor.diffuseColor = BABYLON.Color3.FromHexString(color);
    this.build();
  }

  setRoomFloorMaterial(roomId, materialDescriptor) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const normalized = normalizeMaterialDescriptor(materialDescriptor, room.color || this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    room.material = normalized;
    room.color = materialPreviewColor(normalized, room.color || this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    this.build();
    return room;
  }

  setFloorMaterial(materialDescriptor) {
    const normalized = normalizeMaterialDescriptor(materialDescriptor, this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    this.floorplan.floor.material = normalized;
    this.floorplan.floor.color = materialPreviewColor(normalized, this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    this.build();
  }

  exportJSON() {
    return cloneFloorplan(this.floorplan);
  }

  exportBuildingFile(options = {}) {
    return createBuildingFile(this.floorplan, options);
  }

  stringifyBuildingFile(options = {}) {
    return stringifyBuildingFile(this.floorplan, options);
  }

  stringifyDXF() {
    return stringifyDXF(this.floorplan);
  }

  create3MFPackage() {
    return create3MFPackage(this.floorplan);
  }

  loadBuildingFile(fileData) {
    this.loadJSON(parseBuildingFile(fileData));
  }

  loadJSON(floorplan) {
    this.floorplan = normalizeFloorplan(floorplan);
    this.selectedItemId = this.selectedItemId && this.getItem(this.selectedItemId) ? this.selectedItemId : null;
    this.selectedWallId = this.selectedWallId && this.getWall(this.selectedWallId) ? this.selectedWallId : null;
    this.build();
  }


}

export { FURNITURE_DEFINITIONS, FURNITURE_LIST };

export function buildBlueprint3DTestMap(scene, options = {}) {
  return new Blueprint3DTestMap(scene, options);
}
