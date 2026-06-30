import { pointInRoom } from '../rooms/index.js';

export const INCHES_PER_UNIT = 39.37;
export const DEFAULT_FLOOR_ID = 'floor_1';
export const DEFAULT_WALL_THICKNESS = 0.18;

export function escXml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]));
}

export function itemSize(item) {
  const scale = Number(item.scale || 1);
  return {
    width: Number(item.width || 0) / INCHES_PER_UNIT * scale,
    depth: Number(item.depth || 0) / INCHES_PER_UNIT * scale,
    height: Number(item.height || 24) / INCHES_PER_UNIT * scale
  };
}

export function rotatePoint(x, z, angle) {
  const c = Math.cos(angle || 0);
  const s = Math.sin(angle || 0);
  return { x: x * c - z * s, z: x * s + z * c };
}

export function itemCorners(item) {
  const size = itemSize(item);
  const hw = size.width / 2;
  const hd = size.depth / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => {
    const rotated = rotatePoint(x, z, item.rotation || 0);
    return { x: Number(item.x || 0) + rotated.x, z: Number(item.z || 0) + rotated.z };
  });
}

export function safeName(name = 'blueprint-building') {
  return String(name).trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'blueprint-building';
}

export function orderedFloors(floorplan) {
  const floors = floorplan.floors?.length
    ? floorplan.floors
    : [{ id: floorplan.currentFloorId || DEFAULT_FLOOR_ID, name: '1F', level: 0 }];
  return [...floors].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
}

export function firstFloorId(floorplan) {
  return orderedFloors(floorplan)[0]?.id || DEFAULT_FLOOR_ID;
}

export function entityFloorId(floorplan, entity) {
  return entity?.floorId || firstFloorId(floorplan);
}

export function floorEntities(floorplan, collectionName, floorId) {
  const collection = collectionName === 'rooms' ? floorplan.floor?.rooms : floorplan[collectionName];
  return (collection || []).filter((entity) => entityFloorId(floorplan, entity) === floorId);
}

export function floorPrefix(index) {
  return `F${String(index + 1).padStart(2, '0')}`;
}

export function wallBasis(wall) {
  const x1 = Number(wall.from?.[0] || 0);
  const z1 = Number(wall.from?.[1] || 0);
  const x2 = Number(wall.to?.[0] || 0);
  const z2 = Number(wall.to?.[1] || 0);
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length <= 0.00001) return null;
  const ux = (x2 - x1) / length;
  const uz = (z2 - z1) / length;
  return { x1, z1, x2, z2, length, ux, uz, nx: -uz, nz: ux };
}

export function wallOpeningSpans(floorplan, wall, basis) {
  return (floorplan.openings || [])
    .filter((opening) => opening.wallId === wall.id)
    .map((opening) => {
      const center = Math.max(0, Math.min(basis.length, Number(opening.t ?? 0.5) * basis.length));
      const half = Math.max(0.05, Number(opening.width || (opening.type === 'door' ? 0.9 : 1.25))) / 2;
      return { opening, start: Math.max(0, center - half), end: Math.min(basis.length, center + half) };
    })
    .filter((span) => span.end - span.start > 0.001)
    .sort((a, b) => a.start - b.start);
}

export function pointAlongWall(basis, distance, normalOffset = 0) {
  return {
    x: basis.x1 + basis.ux * distance + basis.nx * normalOffset,
    z: basis.z1 + basis.uz * distance + basis.nz * normalOffset
  };
}

export function getFloor(floorplan, floorId) {
  const floors = orderedFloors(floorplan);
  return floors.find((floor) => floor.id === floorId) || floors[0];
}

export function getFloorElevation(floorplan, floorId) {
  const targetFloor = getFloor(floorplan, floorId);
  if (!targetFloor) return 0;
  const targetLevel = Number(targetFloor.level || 0);
  let elevation = 0;
  for (const floor of orderedFloors(floorplan)) {
    if (Number(floor.level || 0) >= targetLevel) continue;
    elevation += Number(floor.wallHeight ?? floorplan.wallHeight ?? 3.0) + Number(floor.floorHeight ?? floorplan.floorHeight ?? 0.06);
  }
  return elevation;
}

export function getItemRoomElevationOffset(floorplan, item) {
  const rooms = floorplan.floor?.rooms || [];
  const room = rooms.find((candidate) => candidate.id === item.roomId)
    || rooms.find((candidate) => entityFloorId(floorplan, candidate) === entityFloorId(floorplan, item) && pointInRoom(candidate, item.x, item.z));
  return room ? Number(room.elevation || 0) : 0;
}
