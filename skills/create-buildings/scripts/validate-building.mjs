import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { FloorplanDocument, parseBuildingFile } from '../../../src/index.js';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node skills/create-buildings/scripts/validate-building.mjs <building-file>');
  process.exit(2);
}

const resolvedPath = path.resolve(inputPath);
const raw = fs.readFileSync(resolvedPath, 'utf8');
const floorplan = parseBuildingFile(raw);
const normalized = new FloorplanDocument(floorplan).createSnapshot();
const errors = [];

function checkUnique(collection, label) {
  const seen = new Set();
  for (const entity of collection) {
    if (!entity.id) errors.push(`${label} contains an entity without id`);
    else if (seen.has(entity.id)) errors.push(`${label} contains duplicate id: ${entity.id}`);
    seen.add(entity.id);
  }
  return seen;
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
