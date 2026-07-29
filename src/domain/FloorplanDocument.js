import { getFurnitureDefinition, hasFurnitureDefinition, FURNITURE_DEFINITIONS } from './FurnitureCatalog.js';

import { normalizeRoomShape, pointInRoom, getRoomVertices, getRoomWallKeys } from '../rooms/roomShapes.js';
import { normalizeOpeningShape } from '../openings/openingShapes.js';
import { MaterialResolver } from './MaterialResolver.js';
import { getStairsRailingSegments } from '../editor/Topology.js';

const { materialPreviewColor, normalizeMaterialDescriptor } = MaterialResolver;

const INCHES_PER_UNIT = 39.37;
const DEFAULT_WALL_COLOR = '#f9fbff';
const DEFAULT_FLOOR_COLOR = '#d2b48c';
const DEFAULT_FLOOR_ID = 'floor_1';
const DEFAULT_WALL_BASEBOARD_HEIGHT = 0.1;
const DEFAULT_WALL_WAINSCOT_HEIGHT = 1.0;

const WALL_SURFACE_FIELD_MAP = MaterialResolver.WALL_SURFACE_FIELD_MAP;

export const STAIR_SUBTYPE_DEFAULTS = {
  straight: {
    width: 1,
    depth: 3,
    height: 3,
    steps: 12,
    color: '#f5b984',
    material: { id: 'paint-f5b984', name: '吸取颜色 (#f5b984)', category: 'paint', kind: 'paint', color: '#f5b984' },
    sideColor: '#f9fbff',
    sideMaterial: { id: 'paint-soft-white', name: '柔白涂料', category: 'paint', color: '#f9fbff' }
  },
  lshape: {
    width: 1,
    depth: 3,
    height: 3,
    steps: 12,
    cornerStep: 6,
    runBeforeCorner: 2,
    runAfterCorner: 2,
    color: '#f5b984',
    material: { id: 'paint-f5b984', name: '吸取颜色 (#f5b984)', category: 'paint', kind: 'paint', color: '#f5b984' },
    sideColor: '#f9fbff',
    sideMaterial: { id: 'paint-soft-white', name: '柔白涂料', category: 'paint', color: '#f9fbff' }
  },
  ushape: {
    width: 2,
    depth: 3,
    height: 3,
    steps: 12,
    cornerStep: 4,
    runBeforeCorner: 2,
    runAfterCorner: 2,
    uSlotWidth: 0,
    uVoidLength: 2,
    color: '#f5b984',
    material: { id: 'paint-f5b984', name: '吸取颜色 (#f5b984)', category: 'paint', kind: 'paint', color: '#f5b984' },
    sideColor: '#f9fbff',
    sideMaterial: { id: 'paint-soft-white', name: '柔白涂料', category: 'paint', color: '#f9fbff' }
  },
  spiral: {
    width: 3,
    depth: 3,
    height: 3,
    steps: 12,
    spiralDegrees: 360,
    color: '#f5b984',
    material: { id: 'paint-f5b984', name: '吸取颜色 (#f5b984)', category: 'paint', kind: 'paint', color: '#f5b984' },
    sideColor: '#d8c0a0',
    sideMaterial: { id: 'paint-d8c0a0', name: '吸取颜色 (#d8c0a0)', category: 'paint', kind: 'paint', color: '#d8c0a0' }
  },
  curved: {
    width: 1,
    depth: 3,
    height: 3,
    steps: 12,
    spiralDegrees: 90,
    color: '#f5b984',
    material: '#f5b984',
    sideColor: '#f9fbff',
    sideMaterial: { id: 'paint-soft-white', name: '柔白涂料', category: 'paint', color: '#f9fbff' }
  },
  floating: {
    width: 1,
    depth: 3,
    height: 3,
    steps: 12,
    beamCount: 1,
    color: '#f5b984',
    material: { id: 'paint-f5b984', name: '吸取颜色 (#f5b984)', category: 'paint', kind: 'paint', color: '#f5b984' },
    sideColor: '#d8c0a0',
    sideMaterial: '#d8c0a0'
  },
  ladder: {
    width: 0.6,
    depth: 0.2,
    height: 3,
    steps: 10,
    color: '#cfd8dc',
    material: { id: 'metal-silver', name: '银白金属', category: 'metal', kind: 'metal', color: '#cfd8dc' },
    sideColor: '#90a4ae',
    sideMaterial: { id: 'metal-steel', name: '钢灰金属', category: 'metal', kind: 'metal', color: '#90a4ae' }
  },
  slide: {
    width: 0.9,
    depth: 3,
    height: 1.8,
    steps: 1,
    color: '#ffb74d',
    material: { id: 'paint-orange', name: '亮橙滑道', category: 'paint', kind: 'paint', color: '#ffb74d' },
    sideColor: '#ef5350',
    sideMaterial: { id: 'paint-red', name: '艳红护栏', category: 'paint', kind: 'paint', color: '#ef5350' }
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

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toFinitePositive(value, fallback, min = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
}

function normalizeFloorId(value, validFloorIds, fallbackFloorId) {
  return validFloorIds.has(value) ? value : fallbackFloorId;
}

function normalizePointPair(value, fallback = [0, 0]) {
  const base = Array.isArray(value) ? value : fallback;
  return [
    toFiniteNumber(base[0], fallback[0] ?? 0),
    toFiniteNumber(base[1], fallback[1] ?? 0)
  ];
}

function inchesToUnits(value) {
  return Number((Number(value || 0) / INCHES_PER_UNIT).toFixed(4));
}

function normalizeWallDecorSettings(wall) {
  return MaterialResolver.normalizeWallDecorSettings(wall);
}

function setWallEndpoints(wall, from, to) {
  if (!wall) return;
  wall.from = [Number(from[0].toFixed(3)), Number(from[1].toFixed(3))];
  wall.to = [Number(to[0].toFixed(3)), Number(to[1].toFixed(3))];
}

function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.z - a.z);
  let t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}

function isWallOnEdge(wall, edgeFrom, edgeTo) {
  if (!wall || !wall.from || !wall.to) return false;
  const dx = edgeTo.x - edgeFrom.x;
  const dz = edgeTo.z - edgeFrom.z;
  const edgeLen = Math.hypot(dx, dz);
  if (edgeLen < 0.001) return false;

  const ux = dx / edgeLen;
  const uz = dz / edgeLen;
  const nx = -uz;
  const nz = ux;

  const w1x = wall.from[0], w1z = wall.from[1];
  const w2x = wall.to[0], w2z = wall.to[1];

  const dist1 = Math.abs((w1x - edgeFrom.x) * nx + (w1z - edgeFrom.z) * nz);
  const dist2 = Math.abs((w2x - edgeFrom.x) * nx + (w2z - edgeFrom.z) * nz);

  if (dist1 > 0.25 || dist2 > 0.25) return false;

  const p1 = edgeFrom.x * ux + edgeFrom.z * uz;
  const p2 = edgeTo.x * ux + edgeTo.z * uz;
  const minP = Math.min(p1, p2);
  const maxP = Math.max(p1, p2);

  const t1 = w1x * ux + w1z * uz;
  const t2 = w2x * ux + w2z * uz;
  const minW = Math.min(t1, t2);
  const maxW = Math.max(t1, t2);

  const overlap = Math.max(0, Math.min(maxP, maxW) - Math.max(minP, minW));
  return overlap > 0.05;
}

export class FloorplanDocument {
  constructor(floorplanData = {}) {
    this.floorplan = this.normalizeFloorplan(floorplanData);
  }

  get floorplan() {
    return this._floorplan;
  }

  set floorplan(val) {
    this._floorplan = val;
  }

  createSnapshot() {
    return cloneFloorplan(this._floorplan);
  }

  restoreSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new TypeError('A valid floorplan snapshot is required.');
    }
    this._floorplan = cloneFloorplan(snapshot);
    return this._floorplan;
  }

  normalizeFloorplan(floorplan) {
    const normalized = cloneFloorplan(floorplan);
    const defaultFloorMaterial = {
      id: 'wood-plank-oak-light',
      name: '浅木长板',
      category: 'wood',
      kind: 'texture',
      scale: 2,
      color: '#ffffff'
    };

    normalized.floor ||= {};
    normalized.floor.rooms ||= (normalized.rooms || []);
    normalized.environment ||= {};
    normalized.environment.skyMaterial = normalized.environment.skyMaterial
      ? normalizeMaterialDescriptor(normalized.environment.skyMaterial, '#d9ecff')
      : { id: 'sky_texture', kind: 'texture', category: 'custom', name: '晴天', url: 'textures/sky.png', color: '#ffffff' };
    normalized.environment.groundMaterial = normalized.environment.groundMaterial
      ? normalizeMaterialDescriptor(normalized.environment.groundMaterial, '#8ca66b')
      : { id: 'stone-grass', kind: 'texture', category: 'stone', name: '草地', color: '#ffffff' };
    normalized.floor.color ||= DEFAULT_FLOOR_COLOR;
    if (!normalized.floor.material || normalized.floor.material === DEFAULT_FLOOR_COLOR) {
      normalized.floor.material = defaultFloorMaterial;
    }

    normalized.floors ||= [{ id: DEFAULT_FLOOR_ID, name: '1F', level: 0 }];
    normalized.floors.forEach((floor, index) => {
      floor.id ||= `floor_${index + 1}`;
      floor.name ||= `${index + 1}F`;
      floor.level = Number.isFinite(Number(floor.level)) ? Number(floor.level) : index;
      floor.wallHeight = Number.isFinite(Number(floor.wallHeight)) ? Number(floor.wallHeight) : (normalized.wallHeight || 2.8);
      floor.floorHeight = Number.isFinite(Number(floor.floorHeight)) ? Number(floor.floorHeight) : (normalized.floorHeight || 0.2);
      floor.skyboxEnabled = floor.skyboxEnabled === true;
    });

    if (!normalized.floors.length) {
      normalized.floors.push({
        id: DEFAULT_FLOOR_ID,
        name: '1F',
        level: 0,
        wallHeight: normalized.wallHeight || 2.8,
        floorHeight: normalized.floorHeight || 0.2
      });
    }

    normalized.currentFloorId ||= normalized.floors[0].id;
    if (!normalized.floors.some((floor) => floor.id === normalized.currentFloorId)) {
      normalized.currentFloorId = normalized.floors[0].id;
    }
    const validFloorIds = new Set(normalized.floors.map((floor) => floor.id));
    const fallbackFloorId = normalized.currentFloorId || normalized.floors[0].id || DEFAULT_FLOOR_ID;

    const alignedStoryHeight = (normalized.wallHeight || 2.8) + (normalized.floorHeight || 0.2);
    const legacyStoryHeight = (normalized.wallHeight || 2.8) + 0.35;
    const suppliedStoryHeight = Number(normalized.storyHeight);
    normalized.storyHeight = (!Number.isFinite(suppliedStoryHeight) || Math.abs(suppliedStoryHeight - legacyStoryHeight) < 0.001)
      ? alignedStoryHeight
      : Math.max(alignedStoryHeight, suppliedStoryHeight);

    normalized.floor.rooms ||= [];
    normalized.floor.rooms.forEach((room) => {
      room.floorId = normalizeFloorId(room.floorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      room.x = toFiniteNumber(room.x, 0);
      room.z = toFiniteNumber(room.z, 0);
      room.width = toFinitePositive(room.width, 4, 0.2);
      room.depth = toFinitePositive(room.depth, 4, 0.2);
      room.rotation = toFiniteNumber(room.rotation, 0);
      room.shape = normalizeRoomShape(room.shape);
      room.color ||= normalized.floor.color || DEFAULT_FLOOR_COLOR;
      if (!room.material || room.material === room.color || room.material === DEFAULT_FLOOR_COLOR) {
        room.material = normalized.floor.material;
      }
      room.locked = !!room.locked;
      room.edgeWidth = Math.max(0.2, Math.min(room.width - 0.2, Number(room.edgeWidth ?? (room.width / 2))));
      room.edgeDepth = Math.max(0.2, Math.min(room.depth - 0.2, Number(room.edgeDepth ?? (room.depth / 2))));
    });

    normalized.walls ||= [];
    normalized.openings ||= [];
    normalized.items ||= [];
    normalized.roofs ||= [];
    normalized.stairs ||= [];
    normalized.fences ||= [];
    normalized.fenceGates ||= [];

    normalized.walls.forEach((wall) => {
      wall.floorId = normalizeFloorId(wall.floorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      wall.from = normalizePointPair(wall.from, [0, 0]);
      wall.to = normalizePointPair(wall.to, [1, 0]);
      normalizeWallDecorSettings(wall);
    });

    normalized.openings.forEach((opening) => {
      const wall = normalized.walls.find((candidate) => candidate.id === opening.wallId);
      opening.floorId = normalizeFloorId(opening.floorId || wall?.floorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      opening.t = clamp(toFiniteNumber(opening.t ?? 0.5, 0.5), 0.08, 0.92);
      opening.width = toFinitePositive(opening.width, opening.type === 'door' ? 0.9 : 1.25, 0.1);
      opening.shape = normalizeOpeningShape(opening.shape);
      opening.panelHidden = !!opening.panelHidden;
      opening.glassHidden = !!opening.glassHidden;
      opening.locked = !!opening.locked;
      if (opening.type === 'window') {
        opening.height = toFinitePositive(opening.height, 0.85, 0.1);
        opening.sillHeight = Math.max(0, toFiniteNumber(opening.sillHeight ?? 1.05, 1.05));
      }
      opening.horizontalBars = Math.max(0, Math.floor(toFiniteNumber(opening.horizontalBars ?? 0, 0)));
      opening.verticalBars = Math.max(0, Math.floor(toFiniteNumber(opening.verticalBars ?? 0, 0)));
      opening.concentricBars = Math.max(0, Math.floor(toFiniteNumber(opening.concentricBars ?? 0, 0)));
      opening.radialBars = Math.max(0, Math.floor(toFiniteNumber(opening.radialBars ?? 0, 0)));
    });

    normalized.roofs.forEach((roof) => {
      roof.id ||= `roof_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      roof.floorId = normalizeFloorId(roof.floorId || normalized.currentFloorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      roof.x = toFiniteNumber(roof.x, 0);
      roof.z = toFiniteNumber(roof.z, 0);
      roof.width = toFinitePositive(roof.width, 6, 1);
      roof.depth = toFinitePositive(roof.depth, 6, 1);
      roof.height = toFinitePositive(roof.height, 1.1, 0.2);
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
      roof.hideFrame = roof.hideFrame !== undefined ? !!roof.hideFrame : roof.showFrame === false;
      roof.locked = !!roof.locked;
      roof.curve = toFiniteNumber(roof.curve, 0);
      roof.elevation = roof.elevation !== undefined ? toFiniteNumber(roof.elevation, 0) : undefined;
    });

    normalized.stairs.forEach((stairs) => {
      stairs.id ||= `stairs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      stairs.floorId = normalizeFloorId(stairs.floorId || normalized.currentFloorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      stairs.subtype ||= 'straight';
      const subDef = STAIR_SUBTYPE_DEFAULTS[stairs.subtype] || STAIR_SUBTYPE_DEFAULTS.straight;

      stairs.x = toFiniteNumber(stairs.x, 0);
      stairs.z = toFiniteNumber(stairs.z, 0);
      stairs.width = toFinitePositive(stairs.width, subDef.width, 0.1);
      stairs.depth = toFinitePositive(stairs.depth, subDef.depth, 0.1);
      stairs.height = toFinitePositive(stairs.height, normalized.storyHeight || subDef.height, 1);
      stairs.rotation = toFiniteNumber(stairs.rotation, 0);
      stairs.color ||= subDef.color;
      stairs.material ||= subDef.material || stairs.color;
      stairs.sideColor ||= subDef.sideColor || stairs.color;
      stairs.sideMaterial ||= subDef.sideMaterial || stairs.sideColor;
      stairs.sideHidden = !!stairs.sideHidden;
      stairs.locked = !!stairs.locked;
      stairs.steps = Math.max(3, Math.min(32, toFiniteNumber(stairs.steps, subDef.steps)));
      stairs.mirrored = !!stairs.mirrored;
      stairs.spiralDegrees = toFiniteNumber(stairs.spiralDegrees ?? subDef.spiralDegrees ?? (stairs.subtype === 'curved' ? 90 : 360), stairs.subtype === 'curved' ? 90 : 360);
      stairs.cornerStep = Math.max(1, Math.min(stairs.steps - 2, toFiniteNumber(stairs.cornerStep ?? subDef.cornerStep ?? Math.floor(stairs.steps / 2), Math.floor(stairs.steps / 2))));
      stairs.runBeforeCorner = toFinitePositive(stairs.runBeforeCorner, subDef.runBeforeCorner ?? Math.max(0.2, stairs.depth - stairs.width), 0.2);
      stairs.runAfterCorner = toFinitePositive(stairs.runAfterCorner, subDef.runAfterCorner ?? Math.max(0.2, stairs.depth - stairs.width), 0.2);
      stairs.uSlotWidth = toFiniteNumber(stairs.uSlotWidth ?? subDef.uSlotWidth ?? 0, 0);
      stairs.uVoidLength = toFiniteNumber(stairs.uVoidLength ?? subDef.uVoidLength ?? (stairs.depth - 1), 0.1);
      stairs.beamCount = Math.max(0, Math.min(4, Math.round(toFiniteNumber(stairs.beamCount ?? subDef.beamCount ?? 1, 1))));
    });

    normalized.fences.forEach((fence) => {
      fence.id ||= `fence_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      fence.floorId = normalizeFloorId(fence.floorId || normalized.currentFloorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      fence.from = normalizePointPair(fence.from, [0, 0]);
      fence.to = normalizePointPair(fence.to, [2, 0]);
      fence.subtype ||= 'picket_wood';
      fence.height = toFinitePositive(fence.height, 1.1, 0.2);
      fence.thickness = toFinitePositive(fence.thickness, 0.1, 0.04);

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
      fence.tilt = toFiniteNumber(fence.tilt, 0);
      fence.yOffset = toFiniteNumber(fence.yOffset, 0);
    });

    normalized.fenceGates.forEach((gate) => {
      gate.id ||= `gate_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      gate.floorId = normalizeFloorId(gate.floorId || normalized.currentFloorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      gate.width = toFinitePositive(gate.width, 1.0, 0.2);
      gate.height = toFinitePositive(gate.height, 1.1, 0.2);
      gate.thickness = toFinitePositive(gate.thickness, 0.08, 0.04);
      gate.yOffset = toFiniteNumber(gate.yOffset, 0);
      gate.from = normalizePointPair(gate.from, [0, 0]);
      gate.to = normalizePointPair(gate.to, [gate.from[0] + gate.width, gate.from[1]]);
      gate.fenceId ||= null;
      gate.t = clamp(toFiniteNumber(gate.t ?? 0.5, 0.5), 0, 1);
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
      item.floorId = normalizeFloorId(item.floorId || room?.floorId || DEFAULT_FLOOR_ID, validFloorIds, fallbackFloorId);
      const definition = getFurnitureDefinition(item.type);
      if (hasFurnitureDefinition(item.type)) {
        item.name = definition.name;
      } else {
        item.name ||= definition.name;
      }
      item.x = toFiniteNumber(item.x, 0);
      item.z = toFiniteNumber(item.z, 0);
      item.rotation = toFiniteNumber(item.rotation, 0);

      const isMeterDef = definition.unit === 'm';

      if (item.width === undefined || item.width === null || !Number.isFinite(Number(item.width))) {
        item.width = isMeterDef ? Number(definition.defaultSize.width.toFixed(4)) : Number((definition.defaultSize.width / INCHES_PER_UNIT).toFixed(4));
      } else if (needsConversion) {
        item.width = Number((item.width / INCHES_PER_UNIT).toFixed(4));
      } else {
        item.width = toFinitePositive(item.width, isMeterDef ? Number(definition.defaultSize.width.toFixed(4)) : Number((definition.defaultSize.width / INCHES_PER_UNIT).toFixed(4)), 0.05);
      }

      if (item.depth === undefined || item.depth === null || !Number.isFinite(Number(item.depth))) {
        item.depth = isMeterDef ? Number(definition.defaultSize.depth.toFixed(4)) : Number((definition.defaultSize.depth / INCHES_PER_UNIT).toFixed(4));
      } else if (needsConversion) {
        item.depth = Number((item.depth / INCHES_PER_UNIT).toFixed(4));
      } else {
        item.depth = toFinitePositive(item.depth, isMeterDef ? Number(definition.defaultSize.depth.toFixed(4)) : Number((definition.defaultSize.depth / INCHES_PER_UNIT).toFixed(4)), 0.05);
      }

      if (item.height === undefined || item.height === null || !Number.isFinite(Number(item.height))) {
        item.height = isMeterDef ? Number(definition.defaultSize.height.toFixed(4)) : Number((definition.defaultSize.height / INCHES_PER_UNIT).toFixed(4));
      } else if (needsConversion) {
        item.height = Number((item.height / INCHES_PER_UNIT).toFixed(4));
      } else {
        item.height = toFinitePositive(item.height, isMeterDef ? Number(definition.defaultSize.height.toFixed(4)) : Number((definition.defaultSize.height / INCHES_PER_UNIT).toFixed(4)), 0.05);
      }

      if (needsConversion) {
        item.elevation = Number(((item.elevation || 0) / INCHES_PER_UNIT).toFixed(4));
      } else {
        item.elevation = Number(item.elevation || 0);
      }

      // Older saves can retain a room assignment (and tabletop elevation) after
      // an item has been dragged outdoors. Rebuild the spatial link from its
      // actual position and ground ordinary floor furniture when no room owns it.
      const containingRoom = normalized.floor.rooms.find((candidate) => (
        candidate.floorId === item.floorId && pointInRoom(candidate, item.x, item.z)
      ));
      item.roomId = containingRoom?.id ?? null;
      if (!containingRoom && definition.placeType !== 'wall' && definition.placeType !== 'ceiling') {
        item.elevation = 0;
      }

      delete item.localX;
      delete item.localZ;
      item.colors ||= {};
      item.materials ||= {};
      definition.components.forEach((component) => {
        item.colors[component.id] ||= component.defaultColor;
        item.materials[component.id] ||= component.defaultMaterial || item.colors[component.id];
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
        const wh = Number(floor.wallHeight ?? this.floorplan.wallHeight ?? 2.8);
        const fh = Number(floor.floorHeight ?? this.floorplan.floorHeight ?? 0.2);
        elevation += wh + fh;
      }
    });
    // 加上当前楼层的地板厚度，返回地板表面（行走面）高度
    const currentFH = Number(targetFloor.floorHeight ?? this.floorplan.floorHeight ?? 0.2);
    return elevation + currentFH;
  }

  getFloorWallRenderHeight(floorId) {
    const floor = this.getFloor(floorId);
    if (!floor) return this.floorplan.wallHeight ?? 2.8;
    const baseHeight = Number(floor.wallHeight ?? this.floorplan.wallHeight ?? 2.8);
    const sortedFloors = [...this.floorplan.floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
    const index = sortedFloors.findIndex((f) => f.id === floorId);
    if (index >= 0 && index < sortedFloors.length - 1) {
      const nextFloor = sortedFloors[index + 1];
      const nextFH = Number(nextFloor.floorHeight ?? this.floorplan.floorHeight ?? 0.2);
      return baseHeight + nextFH;
    }
    return baseHeight;
  }

  getFloorHeight(floorId) {
    const floor = this.getFloor(floorId);
    return floor ? (floor.floorHeight ?? this.floorplan.floorHeight ?? 0.2) : (this.floorplan.floorHeight ?? 0.2);
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
      const wh = currentFloor ? Number(currentFloor.wallHeight ?? this.floorplan.wallHeight ?? 2.8) : 2.8;
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
    if (room) {
      return room.elevation || 0;
    }
    const floorHeight = Number(this.getFloorHeight(item.floorId));
    return -floorHeight;
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
    const globalObj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
    if (globalObj && globalObj.showAllFloors) {
      return true;
    }
    if (typeof window !== 'undefined' && window.firstPersonActive) {
      const activeFloorId = window.activeFirstPersonFloorId || currentFloorId || this.floorplan.currentFloorId;
      const targetLevel = this.getFloorLevel(floorId);
      const activeLevel = this.getFloorLevel(activeFloorId);
      return Math.abs(targetLevel - activeLevel) <= 5;
      // 第一人称默认显示上下5层楼
    }
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
      let room = this.floorplan.floor.rooms.find((candidate) => candidate.floorId === item.floorId && pointInRoom(candidate, item.x, item.z));
      
      if (!room) {
        const floorRooms = this.floorplan.floor.rooms.filter(candidate => candidate.floorId === item.floorId);
        let minEdgeDist = Infinity;
        let closestRoom = null;
        for (const candidate of floorRooms) {
          const vertices = getRoomVertices(candidate);
          for (let i = 0; i < vertices.length; i++) {
            const a = vertices[i];
            const b = vertices[(i + 1) % vertices.length];
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const l2 = dx * dx + dz * dz;
            let dist;
            if (l2 === 0) {
              dist = Math.hypot(item.x - a.x, item.z - a.z);
            } else {
              let t = ((item.x - a.x) * dx + (item.z - a.z) * dz) / l2;
              t = Math.max(0, Math.min(1, t));
              dist = Math.hypot(item.x - (a.x + t * dx), item.z - (a.z + t * dz));
            }
            if (dist < minEdgeDist) {
              minEdgeDist = dist;
              closestRoom = candidate;
            }
          }
        }
        if (closestRoom && minEdgeDist <= 0.35) {
          room = closestRoom;
        }
      }
      
      item.roomId = room ? room.id : null;
    });
  }

  addItem(partialItem = {}) {
    const definition = getFurnitureDefinition(partialItem.type || 'table');
    const isMeterDef = definition.unit === 'm';
    const item = {
      ...partialItem,
      id: partialItem.id || `${definition.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: definition.type,
      name: partialItem.name || definition.name,
      x: partialItem.x ?? 0,
      z: partialItem.z ?? 0,
      elevation: partialItem.elevation ?? 0,
      width: partialItem.width || (isMeterDef ? Number(definition.defaultSize.width.toFixed(4)) : Number((definition.defaultSize.width / INCHES_PER_UNIT).toFixed(4))),
      depth: partialItem.depth || (isMeterDef ? Number(definition.defaultSize.depth.toFixed(4)) : Number((definition.defaultSize.depth / INCHES_PER_UNIT).toFixed(4))),
      height: partialItem.height || (isMeterDef ? Number(definition.defaultSize.height.toFixed(4)) : Number((definition.defaultSize.height / INCHES_PER_UNIT).toFixed(4))),
      rotation: partialItem.rotation || 0,
      locked: !!partialItem.locked,
      scale: partialItem.scale || 1,
      roomId: partialItem.roomId,
      floorId: partialItem.floorId || this.floorplan.currentFloorId,
      colors: { ...(partialItem.colors || {}) },
      materials: { ...(partialItem.materials || {}) }
    };
    definition.components.forEach((component) => {
      item.colors[component.id] = partialItem.colors?.[component.id] || component.defaultColor;
      item.materials[component.id] = partialItem.materials?.[component.id] || component.defaultMaterial || item.colors[component.id];
    });
    this.floorplan.items.push(item);
    return item;
  }

  updateItem(itemId, patch) {
    const item = this.getItem(itemId);
    if (!item || item.locked) return item;
    const wasOn = item.isOn === true;
    Object.assign(item, patch);
    const nowOn = item.isOn === true;
    if (!wasOn && nowOn && item.type === 'vending_machine') {
      const spawnedFood = this.spawnVendingMachineFood(item);
      if (spawnedFood) {
        item._spawnedFood = spawnedFood;
      }
    }
    return item;
  }

  spawnVendingMachineFood(vendingMachineItem) {
    let foodDefs = Object.values(FURNITURE_DEFINITIONS).filter((def) => def && def.category === 'food');
    if (!foodDefs.length) {
      const fallbackTypes = ['hamburger', 'french_fries', 'steamed_bun', 'sushi', 'ice_cream', 'apple', 'banana', 'pizza', 'can_soda'];
      foodDefs = fallbackTypes.map((t) => getFurnitureDefinition(t));
    }
    const randomFood = foodDefs[Math.floor(Math.random() * foodDefs.length)];
    const distance = 1.0;
    const rot = vendingMachineItem.rotation || 0;
    const foodX = vendingMachineItem.x + Math.sin(rot) * distance;
    const foodZ = vendingMachineItem.z + Math.cos(rot) * distance;
    const foodElevation = vendingMachineItem.elevation || 0;

    return this.addItem({
      type: randomFood.type,
      x: Number(foodX.toFixed(4)),
      z: Number(foodZ.toFixed(4)),
      elevation: foodElevation,
      rotation: rot,
      floorId: vendingMachineItem.floorId || this.floorplan.currentFloorId
    });
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
    const previousWallIds = { ...(room.wallIds || {}) };
    const nextWallIds = {};

    keys.forEach((key, index) => {
      const from = vertices[index];
      const to = vertices[(index + 1) % vertices.length];
      const edgeFrom = { x: from.x, z: from.z };
      const edgeTo = { x: to.x, z: to.z };

      // 1. 优先尝试当前关联的墙
      let wallId = previousWallIds[key];
      let wall = wallId ? this.getWall(wallId) : null;
      let isCurrentMatched = wall && isWallOnEdge(wall, edgeFrom, edgeTo);
      const isCurrentSharedWithOthers = wall && (this.floorplan.floor.rooms || []).some(
        (otherRoom) => otherRoom.id !== room.id && Object.values(otherRoom.wallIds || {}).includes(wall.id)
      );

      // 房间自己创建并独占的墙必须逐帧严格跟随房间。isWallOnEdge 带有手画墙识别所需的
      // 容差，不能用来决定自有墙是否需要更新，否则小步拖动或沿墙方向移动会跳过端点更新。
      if (wall?.roomId === room.id && !isCurrentSharedWithOthers) {
        normalizeWallDecorSettings(wall);
        setWallEndpoints(wall, [from.x, from.z], [to.x, to.z]);
        wall.floorId = room.floorId;
        nextWallIds[key] = wall.id;
        return;
      }

      // 2. 如果当前关联的墙不匹配，自动识别场景中在房间边缘上的已有墙（手画墙或共享墙）
      if (!isCurrentMatched) {
        const candidates = (this.floorplan.walls || []).filter((candidate) => {
          if (candidate.floorId && candidate.floorId !== room.floorId) return false;
          return isWallOnEdge(candidate, edgeFrom, edgeTo);
        });
        if (candidates.length > 0) {
          const preferred = candidates.find((c) => c.id.includes(key))
            || candidates.find((c) => !c.roomId || c.roomId === room.id)
            || candidates[0];
          wall = preferred;
          wallId = preferred.id;
          isCurrentMatched = true;
        } else if (isCurrentSharedWithOthers) {
          // The room moved away from a shared wall. Keep the wall in place for
          // the other room and only remove this room's stale association.
          wall = null;
          wallId = null;
        }
      }

      // 3. 检查当前墙是否被其他房间共享
      const isSharedWithOthers = wall && (this.floorplan.floor.rooms || []).some(
        (otherRoom) => otherRoom.id !== room.id && Object.values(otherRoom.wallIds || {}).includes(wall.id)
      );

      if (wall) {
        // 如果是匹配到的手画墙或共享墙，绑定关联关系，但绝不篡改该墙本身的几何坐标
        if (isSharedWithOthers || isCurrentMatched) {
          normalizeWallDecorSettings(wall);
          nextWallIds[key] = wall.id;
        } else {
          // 当前房间专有的孤立墙：随着房间边缘更新端点
          normalizeWallDecorSettings(wall);
          setWallEndpoints(wall, [from.x, from.z], [to.x, to.z]);
          wall.floorId = room.floorId;
          wall.roomId = room.id;
          nextWallIds[key] = wall.id;
        }
      } else if (createMissing) {
        // 只有当没有任何墙匹配且允许补全时，才为缺失边创建基础墙段
        const newWallId = `${room.id}_${key}`;
        const newWall = {
          id: newWallId,
          from: [Number(from.x.toFixed(3)), Number(from.z.toFixed(3))],
          to: [Number(to.x.toFixed(3)), Number(to.z.toFixed(3))],
          color: DEFAULT_WALL_COLOR,
          floorId: room.floorId,
          roomId: room.id
        };
        normalizeWallDecorSettings(newWall);
        this.floorplan.walls.push(newWall);
        nextWallIds[key] = newWallId;
      }
    });

    // 清理清理毫无引用的垃圾孤立墙
    const activeIds = new Set(Object.values(nextWallIds));
    const staleIds = new Set(Object.values(previousWallIds).filter((id) => id && !activeIds.has(id)));
    if (staleIds.size) {
      const idsToRemove = Array.from(staleIds).filter((id) =>
        !(this.floorplan.floor.rooms || []).some((r) => Object.values(r.wallIds || {}).includes(id))
      );
      if (idsToRemove.length > 0) {
        const removeSet = new Set(idsToRemove);
        this.floorplan.openings = this.floorplan.openings.filter((opening) => !removeSet.has(opening.wallId));
        this.floorplan.walls = this.floorplan.walls.filter((w) => !removeSet.has(w.id));
      }
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
      ...partialRoom,
      id,
      name: partialRoom.name || '新房间',
      x,
      z,
      width,
      depth,
      shape: normalizeRoomShape(partialRoom.shape),
      floorId: partialRoom.floorId || this.floorplan.currentFloorId,
      locked: !!partialRoom.locked,
      wallIds: {},
      edgeWidth: Math.max(0.2, Math.min(width - 0.2, Number(partialRoom.edgeWidth ?? (width / 2)))),
      edgeDepth: Math.max(0.2, Math.min(depth - 0.2, Number(partialRoom.edgeDepth ?? (depth / 2))))
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
    room.width = Math.max(1.0, Number(room.width));
    room.depth = Math.max(1.0, Number(room.depth));
    room.shape = normalizeRoomShape(room.shape);
    room.edgeWidth = Math.max(0.2, Math.min(room.width - 0.2, Number(room.edgeWidth ?? (room.width / 2))));
    room.edgeDepth = Math.max(0.2, Math.min(room.depth - 0.2, Number(room.edgeDepth ?? (room.depth / 2))));

    const dx = room.x - previous.x;
    const dz = room.z - previous.z;
    const prevRot = previous.rotation || 0;
    const currRot = room.rotation || 0;
    const dRot = currRot - prevRot;

    // 房间移动/变动时：原来属于本房间的家具（item.roomId === room.id）正常跟随移动；
    // 新家具或未绑定本房间的家具（item.roomId !== room.id）绝对不误带走！
    const shouldMoveItems = options.moveItems !== false;
    if ((dx || dz || dRot) && shouldMoveItems) {
      const cos = Math.cos(dRot);
      const sin = Math.sin(dRot);
      this.floorplan.items.forEach((item) => {
        if (item.floorId !== room.floorId) return;
        
        // 核心条件：只有原来显式绑定了该房间 ID 的家具才可以被带走；新家具/未绑定家具不带走
        const belongedToRoom = item.roomId === room.id;
        if (!belongedToRoom) return;

        const lx = item.x - previous.x;
        const lz = item.z - previous.z;
        const rx = lx * cos - lz * sin;
        const rz = lx * sin + lz * cos;

        item.x = Number((room.x + rx).toFixed(3));
        item.z = Number((room.z + rz).toFixed(3));
        item.rotation = Number(((item.rotation || 0) + dRot).toFixed(4));
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
    const remainingRooms = this.floorplan.floor.rooms.filter((candidate) => candidate.id !== room.id);
    const preservedWallOwners = new Map();
    remainingRooms.forEach((candidate) => {
      Object.values(candidate.wallIds || {}).forEach((wallId) => {
        if (wallIds.has(wallId) && !preservedWallOwners.has(wallId)) {
          preservedWallOwners.set(wallId, candidate);
        }
      });
    });
    const removableWallIds = new Set(
      Array.from(wallIds).filter((wallId) => !preservedWallOwners.has(wallId))
    );

    this.floorplan.items = this.floorplan.items.filter((item) => item.floorId !== room.floorId || (item.roomId !== room.id && !pointInRoom(room, item.x, item.z)));
    this.floorplan.openings = this.floorplan.openings.filter((opening) => !removableWallIds.has(opening.wallId));
    this.floorplan.walls = this.floorplan.walls.filter((wall) => {
      if (removableWallIds.has(wall.id)) return false;
      const nextOwner = preservedWallOwners.get(wall.id);
      if (nextOwner && wall.roomId === room.id) wall.roomId = nextOwner.id;
      return true;
    });
    this.floorplan.floor.rooms = remainingRooms;
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
      hideFrame: partialRoof.hideFrame !== undefined ? !!partialRoof.hideFrame : partialRoof.showFrame === false,
      locked: !!partialRoof.locked,
      curve: Number(partialRoof.curve || 0),
      topWidth: partialRoof.topWidth !== undefined ? Math.max(0.1, Number(partialRoof.topWidth)) : undefined,
      topDepth: partialRoof.topDepth !== undefined ? Math.max(0.1, Number(partialRoof.topDepth)) : undefined,
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
    if ('topWidth' in patch) roof.topWidth = patch.topWidth !== undefined ? Math.max(0.1, Number(patch.topWidth)) : undefined;
    if ('topDepth' in patch) roof.topDepth = patch.topDepth !== undefined ? Math.max(0.1, Number(patch.topDepth)) : undefined;
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
    roof.hideFrame = patch.hideFrame !== undefined ? !!patch.hideFrame : (patch.showFrame !== undefined ? !patch.showFrame : !!roof.hideFrame);
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
    const subtype = partialStairs.subtype || 'straight';
    const subDef = STAIR_SUBTYPE_DEFAULTS[subtype] || STAIR_SUBTYPE_DEFAULTS.straight;

    const width = partialStairs.width || subDef.width;
    const depth = partialStairs.depth || subDef.depth;
    const height = partialStairs.height || subDef.height || this.floorplan.storyHeight;
    const steps = partialStairs.steps || subDef.steps;

    const stairs = {
      id: partialStairs.id || `stairs_${Date.now()}`,
      floorId: partialStairs.floorId || this.floorplan.currentFloorId,
      x: partialStairs.x ?? 0,
      z: partialStairs.z ?? 0,
      width,
      depth,
      height,
      steps,
      subtype,
      rotation: partialStairs.rotation || 0,
      color: partialStairs.color || subDef.color,
      material: partialStairs.material || subDef.material || partialStairs.color || subDef.color,
      sideColor: partialStairs.sideColor || subDef.sideColor,
      sideMaterial: partialStairs.sideMaterial || subDef.sideMaterial || partialStairs.sideColor || subDef.sideColor,
      sideHidden: partialStairs.sideHidden !== undefined ? !!partialStairs.sideHidden : !!subDef.sideHidden,
      cornerStep: partialStairs.cornerStep !== undefined ? partialStairs.cornerStep : subDef.cornerStep,
      runBeforeCorner: partialStairs.runBeforeCorner !== undefined ? partialStairs.runBeforeCorner : (subDef.runBeforeCorner ?? Math.max(0.2, depth - width)),
      runAfterCorner: partialStairs.runAfterCorner !== undefined ? partialStairs.runAfterCorner : (subDef.runAfterCorner ?? Math.max(0.2, depth - width)),
      uSlotWidth: partialStairs.uSlotWidth !== undefined ? partialStairs.uSlotWidth : subDef.uSlotWidth,
      uVoidLength: partialStairs.uVoidLength !== undefined ? partialStairs.uVoidLength : subDef.uVoidLength,
      spiralDegrees: partialStairs.spiralDegrees !== undefined ? partialStairs.spiralDegrees : subDef.spiralDegrees,
      mirrored: !!partialStairs.mirrored,
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
    stairs.width = Math.max(0.1, Number(stairs.width || 0.1));
    stairs.depth = Math.max(0.1, Number(stairs.depth || 0.1));
    stairs.height = Math.max(1, Number(stairs.height || 1));
    stairs.steps = Math.max(3, Math.round(Number(stairs.steps || 9)));
    stairs.cornerStep = Math.max(1, Math.min(stairs.steps - 2, Math.round(Number(stairs.cornerStep ?? Math.floor(stairs.steps / 2)))));
    stairs.runBeforeCorner = Math.max(0.2, Number(stairs.runBeforeCorner ?? Math.max(0.2, stairs.depth - stairs.width)));
    stairs.runAfterCorner = Math.max(0.2, Number(stairs.runAfterCorner ?? Math.max(0.2, stairs.depth - stairs.width)));
    stairs.rotation = Number(stairs.rotation || 0);
    if (patch.color && !patch.material) stairs.material = patch.color;
    stairs.color ||= '#d8c0a0';
    stairs.material ||= stairs.color;
    stairs.color = materialPreviewColor(stairs.material, stairs.color || '#d8c0a0');
    if (patch.sideColor && !patch.sideMaterial) stairs.sideMaterial = patch.sideColor;
    stairs.sideColor ||= stairs.color || '#d8c0a0';
    stairs.sideMaterial ||= stairs.sideColor;
    stairs.sideHidden = !!stairs.sideHidden;
    this.syncStairsRailing(stairsId);
    return stairs;
  }

  syncStairsRailing(stairsId) {
    const stairs = this.getStairs(stairsId);
    if (!stairs) return;

    const boundFences = (this.floorplan.fences || []).filter(f => f.stairsId === stairsId);
    if (boundFences.length === 0) return;

    // 获取当前仍然存在的 segment 的 sectionId 集合
    const existingSections = new Map();
    boundFences.forEach(f => {
      if (f.sectionId) existingSections.set(f.sectionId, f);
    });

    const fenceSubtype = boundFences[0].subtype || 'picket_wood';
    const stairsOffset = this.getStairsElevationOffset(stairs);
    const segments = getStairsRailingSegments(stairs, this);

    this.floorplan.fences = (this.floorplan.fences || []).filter(f => f.stairsId !== stairsId);

    segments.forEach(seg => {
      if (existingSections.has(seg.sectionId)) {
        const oldFence = existingSections.get(seg.sectionId);
        this.addFence({
          id: oldFence.id,
          floorId: stairs.floorId,
          stairsId: stairs.id,
          sectionId: seg.sectionId,
          from: seg.from,
          to: seg.to,
          subtype: oldFence.subtype || fenceSubtype,
          material: oldFence.material,
          color: oldFence.color,
          frameColor: oldFence.frameColor,
          panelColor: oldFence.panelColor,
          tilt: seg.tilt,
          yOffset: (seg.yOffset || 0) + stairsOffset,
          skipStartPost: !!seg.skipStartPost,
          skipEndPost: !!seg.skipEndPost
        });
      }
    });
  }

  deleteStairs(stairsId) {
    const stairs = this.getStairs(stairsId);
    if (!stairs || stairs.locked) return false;
    const before = this.floorplan.stairs.length;
    this.floorplan.stairs = this.floorplan.stairs.filter((stairs) => stairs.id !== stairsId);
    this.floorplan.fences = (this.floorplan.fences || []).filter((f) => f.stairsId !== stairsId);
    return before !== this.floorplan.stairs.length;
  }

  addFence(partialFence = {}) {
    const subtype = partialFence.subtype || 'picket_wood';
    const defaults = FENCE_SUBTYPE_DEFAULTS[subtype] || FENCE_SUBTYPE_DEFAULTS.picket_wood;
    const defaultColor = defaults.color;
    const fence = {
      id: partialFence.id || `fence_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      floorId: partialFence.floorId || this.floorplan.currentFloorId,
      stairsId: partialFence.stairsId || null,
      sectionId: partialFence.sectionId || null,
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
      yOffset: Number(partialFence.yOffset || 0),
      skipStartPost: !!partialFence.skipStartPost,
      skipEndPost: !!partialFence.skipEndPost
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

    if (fence.sectionId) {
      const secId = fence.sectionId;
      const boundFenceIds = new Set(this.floorplan.fences.filter(f => f.sectionId === secId).map(f => f.id));
      this.floorplan.fences = this.floorplan.fences.filter((f) => f.sectionId !== secId);
      this.floorplan.fenceGates = (this.floorplan.fenceGates || []).filter((gate) => !boundFenceIds.has(gate.fenceId));
    } else if (fence.stairsId) {
      const stairsId = fence.stairsId;
      const boundFenceIds = new Set(this.floorplan.fences.filter(f => f.stairsId === stairsId).map(f => f.id));
      this.floorplan.fences = this.floorplan.fences.filter((f) => f.stairsId !== stairsId);
      this.floorplan.fenceGates = (this.floorplan.fenceGates || []).filter((gate) => !boundFenceIds.has(gate.fenceId));
    } else {
      this.floorplan.fences = this.floorplan.fences.filter((f) => f.id !== fenceId);
      this.floorplan.fenceGates = (this.floorplan.fenceGates || []).filter((gate) => gate.fenceId !== fenceId);
    }
    return true;
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

  addOpening(wallIdOrData, type = 'door', t = 0.5, shape = 'square') {
    let wallId = wallIdOrData;
    let openingData = {};
    if (typeof wallIdOrData === 'object' && wallIdOrData !== null) {
      openingData = wallIdOrData;
      wallId = openingData.wallId;
      type = openingData.type || type;
      t = openingData.t ?? t;
      shape = openingData.shape || shape;
    }
    const wall = this.getWall(wallId);
    if (!wall) return null;
    const opening = {
      ...openingData,
      id: openingData.id || `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      shape: normalizeOpeningShape(shape),
      wallId,
      t: clamp(t, 0.08, 0.92),
      width: openingData.width || (type === 'door' ? 0.9 : 1.25),
      floorId: wall.floorId || this.floorplan.currentFloorId,
      locked: !!openingData.locked
    };
    if (type === 'window' && openingData.height === undefined) opening.height = 0.85;
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
    if (opening.horizontalBars !== undefined) {
      opening.horizontalBars = Math.max(0, Math.floor(toFiniteNumber(opening.horizontalBars, 0)));
    }
    if (opening.verticalBars !== undefined) {
      opening.verticalBars = Math.max(0, Math.floor(toFiniteNumber(opening.verticalBars, 0)));
    }
    if (opening.concentricBars !== undefined) {
      opening.concentricBars = Math.max(0, Math.floor(toFiniteNumber(opening.concentricBars, 0)));
    }
    if (opening.radialBars !== undefined) {
      opening.radialBars = Math.max(0, Math.floor(toFiniteNumber(opening.radialBars, 0)));
    }
    return opening;
  }

  updateOpeningMaterial(openingId, componentKey, materialDescriptor) {
    const opening = this.getOpening(openingId);
    if (!opening || opening.locked) return opening;
    const normalized = normalizeMaterialDescriptor(materialDescriptor, '#ffffff');
    const fieldMap = { frame: 'frameMaterial', panel: 'panelMaterial', glass: 'glassMaterial', mullion: 'mullionMaterial', bars: 'mullionMaterial' };
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
    const activeFloor = this.floorplan.floors[0];
    const skyboxEnabled = activeFloor ? (activeFloor.skyboxEnabled === true) : false;
    const floor = {
      id: partialFloor.id || `floor_${Date.now()}`,
      name: partialFloor.name || `${nextLevel + 1}F`,
      level: nextLevel,
      skyboxEnabled: skyboxEnabled
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

  changeFloorHideSettings(floorId, hideRoof, hideWall, skyboxEnabled) {
    const currentFloor = this.floorplan.floors.find((candidate) => candidate.id === floorId);
    if (!currentFloor) return false;
    currentFloor.hideRoof = !!hideRoof;
    currentFloor.hideWall = !!hideWall;

    // 不同楼层的天空盒开启状态保持一致：遍历所有楼层并广播更新 skyboxEnabled
    const enabled = skyboxEnabled === true;
    this.floorplan.floors.forEach((f) => {
      f.skyboxEnabled = enabled;
    });
    return true;
  }

  setEnvironmentMaterial(component, materialDescriptor) {
    if (component !== 'sky' && component !== 'ground') return null;
    this.floorplan.environment ||= {};
    const key = component === 'sky' ? 'skyMaterial' : 'groundMaterial';
    const fallback = component === 'sky' ? '#d9ecff' : '#8ca66b';
    this.floorplan.environment[key] = materialDescriptor == null
      ? null
      : normalizeMaterialDescriptor(materialDescriptor, fallback);
    return cloneFloorplan(this.floorplan.environment);
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
    
    const wh = Number(floor.wallHeight ?? this.floorplan.wallHeight ?? 2.8);
    floor.floorHeight = Math.min(newFloorHeight, wh);

    return true;
  }

  /**
   * 将所有家具的名称同步为对应的最新家具定义名称
   * @param {boolean} [force=false] 是否强制覆盖。若为 true，即使是自定义的名称也会被覆盖；若为 false，则仅更新未定义名称或在 legacyNames 中的旧名称
   */
  syncItemNamesWithDefinitions(force = false) {
    this.floorplan.items.forEach((item) => {
      const definition = getFurnitureDefinition(item.type);
      if (!definition) return;
      if (force) {
        item.name = definition.name;
      } else {
        const legacyNames = definition.legacyNames || [];
        if (!item.name || legacyNames.includes(item.name)) {
          item.name = definition.name;
        }
      }
    });
  }

}
