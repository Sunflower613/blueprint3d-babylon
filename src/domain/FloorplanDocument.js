import { getFurnitureDefinition, FURNITURE_LIST } from '../furniture/index.js';
import { createBuildingFile, parseBuildingFile, stringifyBuildingFile } from '../core/buildingFile.js';
import { stringifyDXF, create3MFPackage } from '../core/exporters.js';
import { normalizeRoomShape, pointInRoom, getRoomVertices, getRoomWallKeys } from '../rooms/index.js';
import { normalizeOpeningShape } from '../openings/index.js';
import { DEFAULT_MATERIAL_PACKS } from '../core/materialCatalog.js';
import { materialPreviewColor, normalizeMaterialDescriptor } from '../core/materials.js';

const INCHES_PER_UNIT = 39.37;
const DEFAULT_WALL_COLOR = '#f9fbff';
const DEFAULT_FLOOR_COLOR = '#d2b48c';
const DEFAULT_FLOOR_ID = 'floor_1';
const DEFAULT_WALL_BASEBOARD_HEIGHT = 0.1;
const DEFAULT_WALL_WAINSCOT_HEIGHT = 1.0;

const WALL_SURFACE_FIELD_MAP = {
  front: {
    main: { materialField: 'materialFront', colorField: 'colorFront' },
    baseboard: { materialField: 'baseboardMaterialFront', colorField: 'baseboardColorFront' },
    wainscot: { materialField: 'wainscotMaterialFront', colorField: 'wainscotColorFront' }
  },
  back: {
    main: { materialField: 'materialBack', colorField: 'colorBack' },
    baseboard: { materialField: 'baseboardMaterialBack', colorField: 'baseboardColorBack' },
    wainscot: { materialField: 'wainscotMaterialBack', colorField: 'wainscotColorBack' }
  }
};

export const FENCE_SUBTYPE_DEFAULTS = {
  picket_wood: {
    color: '#8d6e63',
    frameColor: '#8d6e63',
    panelColor: '#8d6e63'
  },
  iron_ornamental: {
    color: '#212121',
    frameColor: '#212121',
    panelColor: '#212121'
  },
  wire_mesh: {
    color: '#b0bec5',
    frameColor: '#b0bec5',
    panelColor: '#b0bec5'
  },
  stone_masonry: {
    color: '#cfd8dc',
    frameColor: '#cfd8dc',
    panelColor: '#212121'
  },
  bamboo: {
    color: '#558b2f',
    frameColor: '#558b2f',
    panelColor: '#558b2f'
  },
  glass_rail: {
    color: '#b0bec5',
    frameColor: '#b0bec5',
    panelColor: '#80deea'
  },
  concrete: {
    color: '#f9fbff',
    frameColor: '#f9fbff',
    panelColor: '#f9fbff'
  },
  rope: {
    color: '#8d6e63',
    frameColor: '#8d6e63',
    panelColor: '#3e2723'
  }
};

function cloneFloorplan(floorplan) {
  return JSON.parse(JSON.stringify(floorplan));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function inchesToUnits(value) {
  return Number((Number(value || 0) / INCHES_PER_UNIT).toFixed(4));
}

function normalizeWallDecorSettings(wall) {
  wall.floorId ||= DEFAULT_FLOOR_ID;
  wall.color ||= DEFAULT_WALL_COLOR;
  wall.material ||= wall.color;
  wall.color = materialPreviewColor(wall.material, wall.color || DEFAULT_WALL_COLOR);
  wall.baseboardEnabled = !!wall.baseboardEnabled;
  wall.baseboardHeight = Math.max(0, Number(wall.baseboardHeight ?? DEFAULT_WALL_BASEBOARD_HEIGHT));
  wall.wainscotEnabled = !!wall.wainscotEnabled;
  wall.wainscotHeight = Math.max(0, Number(wall.wainscotHeight ?? DEFAULT_WALL_WAINSCOT_HEIGHT));

  Object.values(WALL_SURFACE_FIELD_MAP).forEach((sideMap) => {
    Object.values(sideMap).forEach(({ materialField, colorField }) => {
      if (wall[materialField] !== undefined && wall[materialField] !== null) {
        wall[colorField] = materialPreviewColor(wall[materialField], wall[colorField] || wall.color || DEFAULT_WALL_COLOR);
      } else if (wall[colorField] !== undefined && wall[colorField] !== null) {
        wall[materialField] = wall[colorField];
        wall[colorField] = materialPreviewColor(wall[materialField], wall[colorField] || wall.color || DEFAULT_WALL_COLOR);
      }
    });
  });
  return wall;
}

function setWallEndpoints(wall, from, to) {
  if (!wall) return;
  wall.from = [Number(from[0].toFixed(3)), Number(from[1].toFixed(3))];
  wall.to = [Number(to[0].toFixed(3)), Number(to[1].toFixed(3))];
}

export class FloorplanDocument {
  constructor(floorplanData) {
    this.floorplan = this.normalizeFloorplan(floorplanData);
  }

  get floorplan() {
    return this._floorplan;
  }

  set floorplan(val) {
    this._floorplan = val;
  }

  normalizeFloorplan(floorplan) {
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
      floor.wallHeight = Number.isFinite(Number(floor.wallHeight)) ? Number(floor.wallHeight) : (normalized.wallHeight || 3.0);
      floor.floorHeight = Number.isFinite(Number(floor.floorHeight)) ? Number(floor.floorHeight) : (normalized.floorHeight || 0.06);
    });

    if (!normalized.floors.length) {
      normalized.floors.push({
        id: DEFAULT_FLOOR_ID,
        name: '1F',
        level: 0,
        wallHeight: normalized.wallHeight || 3.0,
        floorHeight: normalized.floorHeight || 0.06
      });
    }

    normalized.currentFloorId ||= normalized.floors[0].id;
    if (!normalized.floors.some((floor) => floor.id === normalized.currentFloorId)) {
      normalized.currentFloorId = normalized.floors[0].id;
    }

    const alignedStoryHeight = (normalized.wallHeight || 3.0) + (normalized.floorHeight || 0.06);
    const legacyStoryHeight = (normalized.wallHeight || 3.0) + 0.35;
    const suppliedStoryHeight = Number(normalized.storyHeight);
    normalized.storyHeight = (!Number.isFinite(suppliedStoryHeight) || Math.abs(suppliedStoryHeight - legacyStoryHeight) < 0.001)
      ? alignedStoryHeight
      : Math.max(alignedStoryHeight, suppliedStoryHeight);

    normalized.floor.rooms ||= [];
    normalized.floor.rooms.forEach((room) => {
      room.floorId ||= DEFAULT_FLOOR_ID;
      room.shape = normalizeRoomShape(room.shape);
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
    normalized.fenceGates ||= [];

    normalized.walls.forEach((wall) => {
      normalizeWallDecorSettings(wall);
    });

    normalized.openings.forEach((opening) => {
      const wall = normalized.walls.find((candidate) => candidate.id === opening.wallId);
      opening.floorId ||= wall?.floorId || DEFAULT_FLOOR_ID;
      opening.t = clamp(opening.t ?? 0.5, 0.08, 0.92);
      opening.width ||= opening.type === 'door' ? 0.9 : 1.25;
      opening.shape = normalizeOpeningShape(opening.shape);
      opening.panelHidden = !!opening.panelHidden;
      opening.glassHidden = !!opening.glassHidden;
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
      roof.sideColor ||= '#f9fbff';
      roof.sideMaterial ||= roof.sideColor;
      roof.bottomColor ||= '#f9fbff';
      roof.bottomMaterial ||= roof.bottomColor;
      roof.sideHidden = !!roof.sideHidden;
      roof.bottomHidden = !!roof.bottomHidden;
      roof.locked = !!roof.locked;
      roof.curve = Number(roof.curve || 0);
      roof.elevation = roof.elevation !== undefined ? Number(roof.elevation) : undefined;
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
      stairs.sideColor ||= stairs.color || '#d8c0a0';
      stairs.sideMaterial ||= stairs.sideColor;
      stairs.sideHidden = !!stairs.sideHidden;
      stairs.locked = !!stairs.locked;
      stairs.steps = Math.max(3, Math.min(32, Number(stairs.steps || 9)));
      stairs.mirrored = !!stairs.mirrored;
      stairs.spiralDegrees = Number(stairs.spiralDegrees ?? (stairs.subtype === 'curved' ? 90 : 360));
      stairs.cornerStep = Math.max(1, Math.min(stairs.steps - 2, Number(stairs.cornerStep ?? Math.floor(stairs.steps / 2))));
      stairs.uSlotWidth = Number(stairs.uSlotWidth ?? 0.1);
      stairs.uVoidLength = Number(stairs.uVoidLength ?? (stairs.depth - 1));
    });

    normalized.fences.forEach((fence) => {
      fence.id ||= `fence_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      fence.floorId ||= normalized.currentFloorId || DEFAULT_FLOOR_ID;
      fence.from ||= [0, 0];
      fence.to ||= [2, 0];
      fence.subtype ||= 'picket_wood';
      fence.height = Math.max(0.2, Number(fence.height || 1.1));
      fence.thickness = Math.max(0.04, Number(fence.thickness || 0.1));

      const defaults = FENCE_SUBTYPE_DEFAULTS[fence.subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
      fence.color ||= defaults.color;
      fence.material ||= fence.color;
      fence.color = materialPreviewColor(fence.material, fence.color || defaults.color);
      
      fence.frameColor ||= defaults.frameColor;
      fence.frameMaterial ||= fence.frameColor;
      fence.frameColor = materialPreviewColor(fence.frameMaterial, fence.frameColor || defaults.frameColor);

      fence.panelColor ||= defaults.panelColor;
      fence.panelMaterial ||= fence.panelColor;
      fence.panelColor = materialPreviewColor(fence.panelMaterial, fence.panelColor || defaults.panelColor);

      fence.locked = !!fence.locked;
      fence.tilt = Number(fence.tilt || 0);
      fence.yOffset = Number(fence.yOffset || 0);
    });

    normalized.fenceGates.forEach((gate) => {
      gate.id ||= `gate_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      gate.floorId ||= normalized.currentFloorId || DEFAULT_FLOOR_ID;
      gate.width = Math.max(0.2, Number(gate.width || 1.0));
      gate.height = Math.max(0.2, Number(gate.height || 1.1));
      gate.thickness = Math.max(0.04, Number(gate.thickness || 0.08));
      gate.yOffset = Number(gate.yOffset || 0);
      gate.from ||= [0, 0];
      gate.to ||= [gate.from[0] + gate.width, gate.from[1]];
      gate.fenceId ||= null;
      gate.t = gate.t !== undefined ? Number(gate.t) : 0.5;
      gate.subtype ||= 'picket_wood';
      gate.isOpen = !!gate.isOpen;
      gate.doubleDoor = !!gate.doubleDoor;
      gate.isFlippedLR = !!gate.isFlippedLR;
      gate.isFlippedIO = !!gate.isFlippedIO;
      gate.panelHidden = !!gate.panelHidden;
      gate.locked = !!gate.locked;
      gate.frameMaterial ||= gate.frameColor || '#8d6e63';
      gate.panelMaterial ||= gate.panelColor || '#8d6e63';
    });

    // 单位重构：英寸转米
    const needsConversion = normalized.unit === 'in';
    if (needsConversion) {
      normalized.unit = 'm';
    }

    normalized.items.forEach((item) => {
      const room = normalized.floor.rooms.find((candidate) => candidate.id === item.roomId);
      item.floorId ||= room?.floorId || DEFAULT_FLOOR_ID;
      const definition = getFurnitureDefinition(item.type);
      item.name ||= definition.name;

      const isMeterDef = definition.unit === 'm';

      if (item.width === undefined || item.width === null) {
        item.width = isMeterDef ? Number(definition.defaultSize.width.toFixed(4)) : Number((definition.defaultSize.width / INCHES_PER_UNIT).toFixed(4));
      } else if (needsConversion) {
        item.width = Number((item.width / INCHES_PER_UNIT).toFixed(4));
      }

      if (item.depth === undefined || item.depth === null) {
        item.depth = isMeterDef ? Number(definition.defaultSize.depth.toFixed(4)) : Number((definition.defaultSize.depth / INCHES_PER_UNIT).toFixed(4));
      } else if (needsConversion) {
        item.depth = Number((item.depth / INCHES_PER_UNIT).toFixed(4));
      }

      if (item.height === undefined || item.height === null) {
        item.height = isMeterDef ? Number(definition.defaultSize.height.toFixed(4)) : Number((definition.defaultSize.height / INCHES_PER_UNIT).toFixed(4));
      } else if (needsConversion) {
        item.height = Number((item.height / INCHES_PER_UNIT).toFixed(4));
      }

      if (needsConversion) {
        item.elevation = Number(((item.elevation || 0) / INCHES_PER_UNIT).toFixed(4));
      } else {
        item.elevation = Number(item.elevation || 0);
      }

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

  // --- 楼层与状态查询方法 ---
  getFloor(floorId) {
    return this.floorplan.floors.find((floor) => floor.id === floorId);
  }

  getFloorLevel(floorId) {
    return Number(this.getFloor(floorId)?.level || 0);
  }

  getFloorElevation(floorId) {
    const targetFloor = this.getFloor(floorId);
    if (!targetFloor) return 0;
    const targetLevel = Number(targetFloor.level || 0);

    let elevation = 0;
    this.floorplan.floors.forEach((floor) => {
      const level = Number(floor.level || 0);
      if (level < targetLevel) {
        const wh = Number(floor.wallHeight ?? this.floorplan.wallHeight ?? 3.0);
        const fh = Number(floor.floorHeight ?? this.floorplan.floorHeight ?? 0.06);
        elevation += wh + fh;
      }
    });
    return elevation;
  }

  getFloorHeight(floorId) {
    const floor = this.getFloor(floorId);
    return floor ? (floor.floorHeight ?? this.floorplan.floorHeight ?? 0.06) : (this.floorplan.floorHeight ?? 0.06);
  }

  getWallElevationOffset(wallId) {
    let maxElevation = 0;
    this.floorplan.floor.rooms.forEach((room) => {
      if (Object.values(room.wallIds || {}).includes(wallId)) {
        maxElevation = Math.max(maxElevation, Number(room.elevation || 0));
      }
    });
    return maxElevation;
  }

  getFenceElevationOffset(fence) {
    if (!fence || !fence.from || !fence.to) return 0;
    const cx = (fence.from[0] + fence.to[0]) / 2;
    const cz = (fence.from[1] + fence.to[1]) / 2;
    const room = this.floorplan.floor.rooms.find(r => r.floorId === fence.floorId && pointInRoom(r, cx, cz));
    return room ? (room.elevation || 0) : 0;
  }

  getStairsElevationOffset(stairs) {
    const room = this.floorplan.floor.rooms.find(r => r.floorId === stairs.floorId && pointInRoom(r, stairs.x || 0, stairs.z || 0));
    return room ? (room.elevation || 0) : 0;
  }

  getNextFloorId(floorId) {
    const floors = this.floorplan.floors || [];
    const currentLevel = this.getFloorLevel(floorId);
    const nextFloor = floors[currentLevel + 1];
    return nextFloor ? nextFloor.id : null;
  }

  getStairsTargetElevation(stairs) {
    const nextFloorId = this.getNextFloorId(stairs.floorId);
    if (!nextFloorId) {
      const currentFloor = this.floorplan.floors.find(f => f.id === stairs.floorId);
      const wh = currentFloor ? Number(currentFloor.wallHeight ?? this.floorplan.wallHeight ?? 3.0) : 3.0;
      const floorY = this.getFloorElevation(stairs.floorId);
      const baseOffset = this.getStairsElevationOffset(stairs);
      return floorY + baseOffset + wh;
    }

    const nextFloorElevation = this.getFloorElevation(nextFloorId);
    const nextFloorRooms = this.floorplan.floor.rooms.filter(r => r.floorId === nextFloorId) || [];
    const room = nextFloorRooms.find(r => pointInRoom(r, stairs.x || 0, stairs.z || 0));
    const nextRoomElevation = room ? (room.elevation || 0) : 0;
    return nextFloorElevation + nextRoomElevation;
  }

  getStairsAutoHeight(stairs) {
    const floorY = this.getFloorElevation(stairs.floorId);
    const stairsOffset = this.getStairsElevationOffset(stairs);
    const startY = floorY + stairsOffset;
    const endY = this.getStairsTargetElevation(stairs);
    return Math.max(0.2, endY - startY);
  }

  getItemRoomElevationOffset(item) {
    const definition = getFurnitureDefinition(item.type);
    if (definition?.placeType === 'ceiling') return 0;
    const room = this.floorplan.floor.rooms.find(r => r.id === item.roomId) || 
                 this.floorplan.floor.rooms.find(r => r.floorId === item.floorId && pointInRoom(r, item.x, item.z));
    return room ? (room.elevation || 0) : 0;
  }

  getOpeningElevationOffset(opening) {
    const wallId = opening.wallId;
    if (!wallId) return 0;

    let maxElev = 0;
    this.floorplan.floor.rooms.forEach((room) => {
      if (room.floorId === (opening.floorId || room.floorId)) {
        const hasWall = Object.values(room.wallIds || {}).includes(wallId);
        if (hasWall && room.elevation > maxElev) {
          maxElev = room.elevation;
        }
      }
    });
    return maxElev;
  }

  isFloorVisible(floorId, currentFloorId) {
    return this.getFloorLevel(floorId) <= this.getFloorLevel(currentFloorId || this.floorplan.currentFloorId);
  }

  isOnCurrentFloor(entity, currentFloorId) {
    const targetFloorId = currentFloorId || this.floorplan.currentFloorId;
    return (entity?.floorId || DEFAULT_FLOOR_ID) === targetFloorId;
  }

  getCurrentFloorRooms(currentFloorId) {
    return this.floorplan.floor.rooms.filter((room) => this.isOnCurrentFloor(room, currentFloorId));
  }

  getCurrentFloorWalls(currentFloorId) {
    return this.floorplan.walls.filter((wall) => this.isOnCurrentFloor(wall, currentFloorId));
  }

  getCurrentFloorOpenings(currentFloorId) {
    return this.floorplan.openings.filter((opening) => this.isOnCurrentFloor(opening, currentFloorId));
  }

  getCurrentFloorItems(currentFloorId) {
    return this.floorplan.items.filter((item) => this.isOnCurrentFloor(item, currentFloorId));
  }

  getCurrentFloorRoofs(currentFloorId) {
    return this.floorplan.roofs.filter((roof) => {
      if (!this.isOnCurrentFloor(roof, currentFloorId)) return false;
      const floor = this.getFloor(roof.floorId);
      if (floor && floor.hideRoof) return false;
      return true;
    });
  }

  getCurrentFloorStairs(currentFloorId) {
    return this.floorplan.stairs.filter((stairs) => this.isOnCurrentFloor(stairs, currentFloorId));
  }

  // --- CRUD 实体管理与查询 ---
  getRoom(roomId) {
    return this.floorplan.floor.rooms.find((room) => room.id === roomId);
  }

  getRoomAt(x, z, currentFloorId) {
    return this.getCurrentFloorRooms(currentFloorId).find((room) => pointInRoom(room, x, z));
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

  getRoof(roofId) {
    return this.floorplan.roofs.find((roof) => roof.id === roofId);
  }

  getStairs(stairsId) {
    return this.floorplan.stairs.find((stairs) => stairs.id === stairsId);
  }

  getFence(fenceId) {
    return this.floorplan.fences.find((fence) => fence.id === fenceId);
  }

  getFenceGate(gateId) {
    this.floorplan.fenceGates ||= [];
    return this.floorplan.fenceGates.find((gate) => gate.id === gateId);
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
      item.roomId = room ? room.id : null;
    });
  }

  addItem(partialItem) {
    const definition = getFurnitureDefinition(partialItem.type || 'table');
    const isMeterDef = definition.unit === 'm';
    const item = {
      id: partialItem.id || `${definition.type}_${Date.now()}`,
      type: definition.type,
      name: partialItem.name || definition.name,
      x: partialItem.x ?? 0,
      z: partialItem.z ?? 0,
      elevation: partialItem.elevation ?? 0,
      width: partialItem.width || (isMeterDef ? Number(definition.defaultSize.width.toFixed(4)) : Number((definition.defaultSize.width / INCHES_PER_UNIT).toFixed(4))),
      depth: partialItem.depth || (isMeterDef ? Number(definition.defaultSize.depth.toFixed(4)) : Number((definition.defaultSize.depth / INCHES_PER_UNIT).toFixed(4))),
      height: partialItem.height || (isMeterDef ? Number(definition.defaultSize.height.toFixed(4)) : Number((definition.defaultSize.height / INCHES_PER_UNIT).toFixed(4))),
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
    return item;
  }

  updateItem(itemId, patch) {
    const item = this.getItem(itemId);
    if (!item || item.locked) return item;
    Object.assign(item, patch);
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
    return true;
  }

  addWall(from, to) {
    const wall = normalizeWallDecorSettings({
      id: `wall_${Date.now()}`,
      from,
      to,
      color: DEFAULT_WALL_COLOR,
      floorId: this.floorplan.currentFloorId
    });
    this.floorplan.walls.push(wall);
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
    return wall;
  }

  updateWall(wallId, patch) {
    const wall = this.getWall(wallId);
    if (!wall) return null;
    Object.assign(wall, patch);
    normalizeWallDecorSettings(wall);
    return wall;
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
  }

  syncRoomWalls(room, createMissing = false) {
    const vertices = getRoomVertices(room);
    const keys = getRoomWallKeys(room);
    const previousWallIds = room.wallIds || {};
    const nextWallIds = {};
    keys.forEach((key, index) => {
      const wallId = previousWallIds[key] || `${room.id}_${key}`;
      let wall = this.getWall(wallId);
      if (!wall && createMissing) {
        wall = {
          id: wallId,
          from: [0, 0],
          to: [0, 0],
          color: DEFAULT_WALL_COLOR,
          floorId: room.floorId,
          roomId: room.id
        };
        normalizeWallDecorSettings(wall);
        this.floorplan.walls.push(wall);
      }
      if (wall) {
        normalizeWallDecorSettings(wall);
        const from = vertices[index];
        const to = vertices[(index + 1) % vertices.length];
        setWallEndpoints(wall, [from.x, from.z], [to.x, to.z]);
        wall.floorId = room.floorId;
        wall.roomId = room.id;
        nextWallIds[key] = wallId;
      }
    });

    const activeIds = new Set(Object.values(nextWallIds));
    const staleIds = new Set(Object.values(previousWallIds).filter((id) => !activeIds.has(id)));
    if (staleIds.size) {
      this.floorplan.openings = this.floorplan.openings.filter((opening) => !staleIds.has(opening.wallId));
      this.floorplan.walls = this.floorplan.walls.filter((wall) => !staleIds.has(wall.id));
    }
    room.wallIds = nextWallIds;
    return room;
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
      shape: normalizeRoomShape(partialRoom.shape),
      floorId: partialRoom.floorId || this.floorplan.currentFloorId,
      locked: !!partialRoom.locked,
      wallIds: {}
    };
    this.floorplan.floor.rooms.push(room);
    this.syncRoomWalls(room, true);
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
    const previous = { 
      x: room.x, 
      z: room.z, 
      width: room.width, 
      depth: room.depth, 
      shape: room.shape, 
      floorId: room.floorId,
      rotation: room.rotation || 0
    };
    Object.assign(room, patch);
    room.width = Math.max(1.2, Number(room.width));
    room.depth = Math.max(1.2, Number(room.depth));
    room.shape = normalizeRoomShape(room.shape);

    const dx = room.x - previous.x;
    const dz = room.z - previous.z;
    const prevRot = previous.rotation || 0;
    const currRot = room.rotation || 0;
    const dRot = currRot - prevRot;

    const shouldMoveItems = options.moveItems ?? (!('width' in patch) && !('depth' in patch));
    if ((dx || dz || dRot) && shouldMoveItems) {
      const cos = Math.cos(dRot);
      const sin = Math.sin(dRot);
      this.floorplan.items.forEach((item) => {
        if (item.floorId !== room.floorId) return;
        const belongedToRoom = options.isDragging
          ? item.roomId === room.id
          : (item.roomId === room.id || pointInRoom(previous, item.x, item.z));
        if (!belongedToRoom) return;

        const lx = item.x - previous.x;
        const lz = item.z - previous.z;
        const rx = lx * cos - lz * sin;
        const rz = lx * sin + lz * cos;

        item.x = Number((room.x + rx).toFixed(3));
        item.z = Number((room.z + rz).toFixed(3));
        item.rotation = Number(((item.rotation || 0) + dRot).toFixed(4));
        item.roomId = room.id;
      });
    }

    const topologyChanged = room.shape !== previous.shape || room.floorId !== previous.floorId;
    this.syncRoomWalls(room, topologyChanged);
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
      sideColor: partialRoof.sideColor || '#f9fbff',
      sideMaterial: partialRoof.sideMaterial || partialRoof.sideColor || '#f9fbff',
      bottomColor: partialRoof.bottomColor || '#f9fbff',
      bottomMaterial: partialRoof.bottomMaterial || partialRoof.bottomColor || '#f9fbff',
      sideHidden: !!partialRoof.sideHidden,
      bottomHidden: !!partialRoof.bottomHidden,
      locked: !!partialRoof.locked,
      curve: Number(partialRoof.curve || 0),
      elevation: partialRoof.elevation !== undefined ? Number(partialRoof.elevation) : undefined
    };
    this.floorplan.roofs.push(roof);
    return roof;
  }

  updateRoof(roofId, patch) {
    const roof = this.getRoof(roofId);
    if (!roof) return null;
    if (roof.locked && !('locked' in patch)) return roof;
    Object.assign(roof, patch);
    if ('elevation' in patch) roof.elevation = patch.elevation !== undefined ? Number(patch.elevation) : undefined;
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
    if (patch.sideColor && !patch.sideMaterial) roof.sideMaterial = patch.sideColor;
    roof.sideColor ||= '#f9fbff';
    roof.sideMaterial ||= roof.sideColor;
    if (patch.bottomColor && !patch.bottomMaterial) roof.bottomMaterial = patch.bottomColor;
    roof.bottomColor ||= '#f9fbff';
    roof.bottomMaterial ||= roof.bottomColor;
    roof.sideHidden = !!roof.sideHidden;
    roof.bottomHidden = !!roof.bottomHidden;
    return roof;
  }

  deleteRoof(roofId) {
    const roof = this.getRoof(roofId);
    if (!roof || roof.locked) return false;
    const before = this.floorplan.roofs.length;
    this.floorplan.roofs = this.floorplan.roofs.filter((roof) => roof.id !== roofId);
    return before !== this.floorplan.roofs.length;
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
      sideColor: partialStairs.sideColor || partialStairs.color || '#d8c0a0',
      sideMaterial: partialStairs.sideMaterial || partialStairs.sideColor || partialStairs.color || '#d8c0a0',
      sideHidden: !!partialStairs.sideHidden,
      locked: !!partialStairs.locked
    };
    this.floorplan.stairs.push(stairs);
    return stairs;
  }

  updateStairs(stairsId, patch) {
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
    if (patch.sideColor && !patch.sideMaterial) stairs.sideMaterial = patch.sideColor;
    stairs.sideColor ||= stairs.color || '#d8c0a0';
    stairs.sideMaterial ||= stairs.sideColor;
    stairs.sideHidden = !!stairs.sideHidden;
    return stairs;
  }

  deleteStairs(stairsId) {
    const stairs = this.getStairs(stairsId);
    if (!stairs || stairs.locked) return false;
    const before = this.floorplan.stairs.length;
    this.floorplan.stairs = this.floorplan.stairs.filter((stairs) => stairs.id !== stairsId);
    return before !== this.floorplan.stairs.length;
  }

  addFence(partialFence = {}) {
    const subtype = partialFence.subtype || 'picket_wood';
    const defaults = FENCE_SUBTYPE_DEFAULTS[subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
    const defaultColor = defaults.color;
    const fence = {
      id: partialFence.id || `fence_${Date.now()}`,
      floorId: partialFence.floorId || this.floorplan.currentFloorId,
      from: partialFence.from ? [...partialFence.from] : [0, 0],
      to: partialFence.to ? [...partialFence.to] : [2, 0],
      subtype,
      height: Math.max(0.2, Number(partialFence.height || 1.1)),
      thickness: Math.max(0.04, Number(partialFence.thickness || 0.1)),
      color: partialFence.color || defaultColor,
      material: partialFence.material || partialFence.color || defaultColor,
      frameColor: partialFence.frameColor || partialFence.color || defaults.frameColor,
      frameMaterial: partialFence.frameMaterial || partialFence.material || partialFence.color || defaults.frameColor,
      panelColor: partialFence.panelColor || partialFence.color || defaults.panelColor,
      panelMaterial: partialFence.panelMaterial || partialFence.material || partialFence.color || defaults.panelColor,
      locked: !!partialFence.locked,
      tilt: Number(partialFence.tilt || 0),
      yOffset: Number(partialFence.yOffset || 0)
    };
    this.floorplan.fences.push(fence);
    return fence;
  }

  updateFence(fenceId, patch) {
    const fence = this.getFence(fenceId);
    if (!fence) return null;
    if (fence.locked && !('locked' in patch)) return fence;

    if (patch.subtype && patch.subtype !== fence.subtype) {
      const oldDefaults = FENCE_SUBTYPE_DEFAULTS[fence.subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
      const newDefaults = FENCE_SUBTYPE_DEFAULTS[patch.subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;

      if (fence.color === oldDefaults.color || fence.material === oldDefaults.color) {
        fence.color = newDefaults.color;
        fence.material = newDefaults.color;
      }
      if (fence.frameColor === oldDefaults.frameColor || fence.frameMaterial === oldDefaults.frameColor) {
        fence.frameColor = newDefaults.frameColor;
        fence.frameMaterial = newDefaults.frameColor;
      }
      if (fence.panelColor === oldDefaults.panelColor || fence.panelMaterial === oldDefaults.panelColor) {
        fence.panelColor = newDefaults.panelColor;
        fence.panelMaterial = newDefaults.panelColor;
      }
    }

    Object.assign(fence, patch);
    if (patch.from) fence.from = [...patch.from];
    if (patch.to) fence.to = [...patch.to];
    fence.height = Math.max(0.2, Number(fence.height || 0.2));
    fence.thickness = Math.max(0.04, Number(fence.thickness || 0.04));
    if (patch.color && !patch.material) fence.material = patch.color;
    if (patch.frameColor && !patch.frameMaterial) fence.frameMaterial = patch.frameColor;
    if (patch.panelColor && !patch.panelMaterial) fence.panelMaterial = patch.panelColor;
    
    const defaults = FENCE_SUBTYPE_DEFAULTS[fence.subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
    const defaultColor = defaults.color;
    fence.color ||= defaultColor;
    fence.material ||= fence.color;
    fence.color = materialPreviewColor(fence.material, fence.color || defaultColor);

    fence.frameColor ||= defaults.frameColor;
    fence.frameMaterial ||= fence.frameColor;
    fence.frameColor = materialPreviewColor(fence.frameMaterial, fence.frameColor || defaults.frameColor);

    fence.panelColor ||= defaults.panelColor;
    fence.panelMaterial ||= fence.panelColor;
    fence.panelColor = materialPreviewColor(fence.panelMaterial, fence.panelColor || defaults.panelColor);

    return fence;
  }

  deleteFence(fenceId) {
    const fence = this.getFence(fenceId);
    if (!fence || fence.locked) return false;
    const before = this.floorplan.fences.length;
    this.floorplan.fences = this.floorplan.fences.filter((f) => f.id !== fenceId);
    this.floorplan.fenceGates = (this.floorplan.fenceGates || []).filter((gate) => gate.fenceId !== fenceId);
    return before !== this.floorplan.fences.length;
  }

  addFenceGate(partialFenceGate = {}) {
    const subtype = partialFenceGate.subtype || 'picket_wood';
    const defaultColor = subtype === 'concrete' ? DEFAULT_WALL_COLOR : '#8d6e63';
    const gate = {
      id: partialFenceGate.id || `gate_${Date.now()}`,
      floorId: partialFenceGate.floorId || this.floorplan.currentFloorId,
      width: Math.max(0.2, Number(partialFenceGate.width || 1.0)),
      height: Math.max(0.2, Number(partialFenceGate.height || 1.1)),
      thickness: Math.max(0.04, Number(partialFenceGate.thickness || 0.08)),
      yOffset: Number(partialFenceGate.yOffset || 0),
      from: partialFenceGate.from ? [...partialFenceGate.from] : [0, 0],
      to: partialFenceGate.to ? [...partialFenceGate.to] : [1, 0],
      fenceId: partialFenceGate.fenceId || null,
      t: partialFenceGate.t !== undefined ? Number(partialFenceGate.t) : 0.5,
      subtype,
      isOpen: !!partialFenceGate.isOpen,
      doubleDoor: !!partialFenceGate.doubleDoor,
      isFlippedLR: !!partialFenceGate.isFlippedLR,
      isFlippedIO: !!partialFenceGate.isFlippedIO,
      panelHidden: !!partialFenceGate.panelHidden,
      locked: !!partialFenceGate.locked,
      frameMaterial: partialFenceGate.frameMaterial || defaultColor,
      panelMaterial: partialFenceGate.panelMaterial || defaultColor
    };
    if (gate.fenceId) {
      const fence = this.getFence(gate.fenceId);
      if (fence) {
        const [x1, z1] = fence.from;
        const [x2, z2] = fence.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const fenceLen = Math.sqrt(dx * dx + dz * dz) || 1;
        const halfT = (gate.width) / fenceLen / 2;
        const t1 = Math.max(0, gate.t - halfT);
        const t2 = Math.min(1, gate.t + halfT);
        gate.from = [x1 + dx * t1, z1 + dz * t1];
        gate.to = [x1 + dx * t2, z1 + dz * t2];
      }
    }
    this.floorplan.fenceGates ||= [];
    this.floorplan.fenceGates.push(gate);
    return gate;
  }

  updateFenceGate(gateId, patch) {
    const gate = this.getFenceGate(gateId);
    if (!gate) return null;
    if (gate.locked && !('locked' in patch)) return gate;

    if (patch.subtype === 'concrete' && (gate.frameMaterial === '#8d6e63' || !gate.frameMaterial || gate.frameMaterial === '')) {
      patch.frameMaterial = DEFAULT_WALL_COLOR;
      patch.panelMaterial = DEFAULT_WALL_COLOR;
    } else if (patch.subtype && patch.subtype !== 'concrete' && gate.frameMaterial === DEFAULT_WALL_COLOR) {
      patch.frameMaterial = '#8d6e63';
      patch.panelMaterial = '#8d6e63';
    }

    Object.assign(gate, patch);
    if (patch.from) gate.from = [...patch.from];
    if (patch.to) gate.to = [...patch.to];

    if (gate.fenceId) {
      const fence = this.getFence(gate.fenceId);
      if (fence) {
        const [x1, z1] = fence.from;
        const [x2, z2] = fence.to;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const fenceLen = Math.sqrt(dx * dx + dz * dz) || 1;
        const halfT = (gate.width) / fenceLen / 2;
        const t1 = Math.max(0, gate.t - halfT);
        const t2 = Math.min(1, gate.t + halfT);
        gate.from = [x1 + dx * t1, z1 + dz * t1];
        gate.to = [x1 + dx * t2, z1 + dz * t2];
      }
    } else {
      if (patch.width && !patch.from && !patch.to) {
        const cx = (gate.from[0] + gate.to[0]) / 2;
        const cz = (gate.from[1] + gate.to[1]) / 2;
        const dx = gate.to[0] - gate.from[0];
        const dz = gate.to[1] - gate.from[1];
        const angle = Math.atan2(dz, dx);
        const halfW = gate.width / 2;
        gate.from = [cx - Math.cos(angle) * halfW, cz - Math.sin(angle) * halfW];
        gate.to = [cx + Math.cos(angle) * halfW, cz + Math.sin(angle) * halfW];
      }
    }

    return gate;
  }

  deleteFenceGate(gateId) {
    const gate = this.getFenceGate(gateId);
    if (!gate || gate.locked) return false;
    const before = this.floorplan.fenceGates.length;
    this.floorplan.fenceGates = this.floorplan.fenceGates.filter((gate) => gate.id !== gateId);
    return before !== this.floorplan.fenceGates.length;
  }

  addOpening(wallId, type = 'door', t = 0.5, shape = 'square') {
    const wall = this.getWall(wallId);
    if (!wall) return null;
    const opening = {
      id: `${type}_${Date.now()}`,
      type,
      shape: normalizeOpeningShape(shape),
      wallId,
      t: clamp(t, 0.08, 0.92),
      width: type === 'door' ? 0.9 : 1.25,
      floorId: wall.floorId || this.floorplan.currentFloorId,
      locked: false
    };
    if (type === 'window') opening.height = 0.85;
    this.floorplan.openings.push(opening);
    return opening;
  }

  updateOpening(openingId, patch) {
    const opening = this.getOpening(openingId);
    if (!opening) return null;
    if (opening.locked && !('locked' in patch)) return opening;
    Object.assign(opening, patch);
    opening.shape = normalizeOpeningShape(opening.shape);
    opening.panelHidden = !!opening.panelHidden;
    opening.glassHidden = !!opening.glassHidden;
    opening.t = clamp(opening.t ?? 0.5, 0.08, 0.92);
    opening.width = Math.max(0.25, Number(opening.width || (opening.type === 'door' ? 0.9 : 1.25)));
    opening.height = Math.max(0.3, Number(opening.height || (opening.type === 'door' ? 2.05 : 0.85)));
    return opening;
  }

  updateOpeningMaterial(openingId, componentKey, materialDescriptor) {
    const opening = this.getOpening(openingId);
    if (!opening || opening.locked) return opening;
    const normalized = normalizeMaterialDescriptor(materialDescriptor, '#ffffff');
    const fieldMap = { frame: 'frameMaterial', panel: 'panelMaterial', glass: 'glassMaterial' };
    const field = fieldMap[componentKey];
    if (!field) return opening;
    opening[field] = normalized;
    return opening;
  }

  resetOpeningMaterial(openingId) {
    const opening = this.getOpening(openingId);
    if (!opening) return;
    delete opening.frameMaterial;
    delete opening.panelMaterial;
    delete opening.glassMaterial;
  }

  deleteOpening(openingId) {
    const opening = this.getOpening(openingId);
    if (!opening || opening.locked) return false;
    this.floorplan.openings = this.floorplan.openings.filter((opening) => opening.id !== openingId);
    return true;
  }

  setFloorColor(color) {
    this.floorplan.floor.color = color;
    this.floorplan.floor.material = color;
    this.floorplan.floor.rooms.forEach((room) => {
      room.color = color;
      room.material = color;
    });
  }

  setRoomFloorMaterial(roomId, materialDescriptor) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const normalized = normalizeMaterialDescriptor(materialDescriptor, room.color || this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    room.material = normalized;
    room.color = materialPreviewColor(normalized, room.color || this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    return room;
  }

  setFloorMaterial(materialDescriptor) {
    const normalized = normalizeMaterialDescriptor(materialDescriptor, this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
    this.floorplan.floor.material = normalized;
    this.floorplan.floor.color = materialPreviewColor(normalized, this.floorplan.floor.color || DEFAULT_FLOOR_COLOR);
  }

  setCurrentFloor(floorId) {
    if (!this.floorplan.floors.some((floor) => floor.id === floorId)) return this.getFloor(this.floorplan.currentFloorId);
    this.floorplan.currentFloorId = floorId;
    return this.getFloor(floorId);
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
    return true;
  }

  renameFloor(floorId, name) {
    const floor = this.floorplan.floors.find((candidate) => candidate.id === floorId);
    if (!floor) return false;
    floor.name = name;
    return true;
  }

  changeFloorHideSettings(floorId, hideRoof, hideWall) {
    const floor = this.floorplan.floors.find((candidate) => candidate.id === floorId);
    if (!floor) return false;
    floor.hideRoof = !!hideRoof;
    floor.hideWall = !!hideWall;
    return true;
  }

  changeFloorHeight(floorId, height) {
    const floor = this.floorplan.floors.find((candidate) => candidate.id === floorId);
    if (!floor) return false;
    const newHeight = Number(height);
    floor.wallHeight = newHeight;

    if (floor.floorHeight > newHeight) {
      floor.floorHeight = newHeight;
    }
    this.floorplan.floor.rooms.forEach((room) => {
      if (room.floorId === floorId && room.elevation > newHeight) {
        room.elevation = newHeight;
      }
    });

    return true;
  }

  changeFloorDefaultFloorHeight(floorId, floorHeight) {
    const floor = this.floorplan.floors.find((candidate) => candidate.id === floorId);
    if (!floor) return false;
    const newFloorHeight = Number(floorHeight);
    
    const wh = Number(floor.wallHeight ?? this.floorplan.wallHeight ?? 3.0);
    floor.floorHeight = Math.min(newFloorHeight, wh);

    return true;
  }

  // --- 验证、导出与序列化方法 ---
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

  create3MFPackage(options = {}) {
    return create3MFPackage(this.floorplan, options);
  }

  loadBuildingFile(fileData) {
    this.loadJSON(parseBuildingFile(fileData));
  }

  loadJSON(floorplan) {
    this.floorplan = this.normalizeFloorplan(floorplan);
  }
}
