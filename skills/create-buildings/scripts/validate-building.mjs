import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { FloorplanDocument, parseBuildingFile } from '../../../src/index.js';

const strict = process.argv.includes('--strict');
const inputPath = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!inputPath) {
  console.error('Usage: node skills/create-buildings/scripts/validate-building.mjs <building-file> [--strict]');
  process.exit(2);
}

const resolvedPath = path.resolve(inputPath);
const raw = fs.readFileSync(resolvedPath, 'utf8');
let source;
try {
  source = JSON.parse(raw);
} catch (error) {
  console.error(`ERROR: invalid JSON: ${error.message}`);
  process.exit(1);
}

const errors = [];
if (strict) {
  if (source.format !== 'blueprint3d-babylon.building.v1') errors.push('strict mode requires format blueprint3d-babylon.building.v1');
  if (source.version !== 1) errors.push('strict mode requires version 1');
  if (!source.floorplan || typeof source.floorplan !== 'object') errors.push('strict mode requires a floorplan object');
}

let floorplan;
try {
  floorplan = parseBuildingFile(source);
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
const normalized = new FloorplanDocument(floorplan).createSnapshot();

function checkUnique(collection, label) {
  const seen = new Set();
  for (const entity of collection) {
    if (!entity.id) errors.push(`${label} contains an entity without id`);
    else if (seen.has(entity.id)) errors.push(`${label} contains duplicate id: ${entity.id}`);
    seen.add(entity.id);
  }
  return seen;
}

function checkFinite(value, label) {
  if (value !== undefined && !Number.isFinite(Number(value))) errors.push(`${label} must be a finite number`);
}

function checkPositive(value, label) {
  checkFinite(value, label);
  if (Number(value) <= 0) errors.push(`${label} must be greater than 0`);
}

const floorIds = checkUnique(normalized.floors, 'floors');
const roomIds = checkUnique(normalized.floor.rooms, 'rooms');
const wallIds = checkUnique(normalized.walls, 'walls');
checkUnique(normalized.openings, 'openings');
checkUnique(normalized.items, 'items');
checkUnique(normalized.roofs, 'roofs');
checkUnique(normalized.stairs, 'stairs');
checkUnique(normalized.fences, 'fences');
checkUnique(normalized.fenceGates, 'fenceGates');

for (const [label, collection] of [
  ['room', normalized.floor.rooms], ['wall', normalized.walls], ['opening', normalized.openings],
  ['item', normalized.items], ['roof', normalized.roofs], ['stairs', normalized.stairs],
  ['fence', normalized.fences], ['fenceGate', normalized.fenceGates]
]) {
  for (const entity of collection) {
    if (!floorIds.has(entity.floorId)) errors.push(`${label} ${entity.id} references missing floor ${entity.floorId}`);
  }
}

for (const opening of normalized.openings) {
  if (!wallIds.has(opening.wallId)) errors.push(`opening ${opening.id} references missing wall ${opening.wallId}`);
}
for (const item of normalized.items) {
  if (item.roomId && !roomIds.has(item.roomId)) errors.push(`item ${item.id} references missing room ${item.roomId}`);
}

if (strict) {
  for (const floor of normalized.floors) {
    checkFinite(floor.level, `floor ${floor.id}.level`);
    checkPositive(floor.wallHeight, `floor ${floor.id}.wallHeight`);
    checkPositive(floor.floorHeight, `floor ${floor.id}.floorHeight`);
    if (typeof floor.skyboxEnabled !== 'boolean') errors.push(`floor ${floor.id}.skyboxEnabled must be boolean`);
  }
  for (const room of normalized.floor.rooms) {
    checkFinite(room.x, `room ${room.id}.x`);
    checkFinite(room.z, `room ${room.id}.z`);
    checkPositive(room.width, `room ${room.id}.width`);
    checkPositive(room.depth, `room ${room.id}.depth`);
    checkFinite(room.elevation, `room ${room.id}.elevation`);
  }
  for (const wall of normalized.walls) {
    if (!Array.isArray(wall.from) || wall.from.length !== 2 || !Array.isArray(wall.to) || wall.to.length !== 2) {
      errors.push(`wall ${wall.id} must have from/to coordinate pairs`);
    } else {
      [...wall.from, ...wall.to].forEach((value, index) => checkFinite(value, `wall ${wall.id}.coordinate[${index}]`));
    }
  }
  for (const opening of normalized.openings) {
    checkPositive(opening.width, `opening ${opening.id}.width`);
    checkPositive(opening.height, `opening ${opening.id}.height`);
    checkFinite(opening.t, `opening ${opening.id}.t`);
    if (opening.t !== undefined && (Number(opening.t) < 0 || Number(opening.t) > 1)) errors.push(`opening ${opening.id}.t must be between 0 and 1`);
  }
  for (const item of normalized.items) {
    checkFinite(item.x, `item ${item.id}.x`);
    checkFinite(item.z, `item ${item.id}.z`);
    checkFinite(item.elevation, `item ${item.id}.elevation`);
    if (item.width !== undefined) checkPositive(item.width, `item ${item.id}.width`);
    if (item.depth !== undefined) checkPositive(item.depth, `item ${item.id}.depth`);
    if (item.height !== undefined) checkPositive(item.height, `item ${item.id}.height`);
  }
  for (const stair of normalized.stairs) {
    checkFinite(stair.x, `stairs ${stair.id}.x`);
    checkFinite(stair.z, `stairs ${stair.id}.z`);
    checkPositive(stair.width, `stairs ${stair.id}.width`);
    checkPositive(stair.depth, `stairs ${stair.id}.depth`);
    checkPositive(stair.height, `stairs ${stair.id}.height`);
  }
  const environment = source.floorplan?.environment;
  if (!environment?.skyMaterial || !environment?.groundMaterial) {
    errors.push('strict mode requires non-null floorplan.environment.skyMaterial and groundMaterial');
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  valid: true,
  file: resolvedPath,
  floors: normalized.floors.length,
  rooms: normalized.floor.rooms.length,
  walls: normalized.walls.length,
  openings: normalized.openings.length,
  items: normalized.items.length,
  roofs: normalized.roofs.length,
  stairs: normalized.stairs.length,
  fences: normalized.fences.length,
  fenceGates: normalized.fenceGates.length
}, null, 2));
