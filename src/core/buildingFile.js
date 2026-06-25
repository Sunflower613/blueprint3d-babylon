export const BUILDING_FILE_FORMAT = 'blueprint3d-babylon.building.v1';
export const BUILDING_FILE_EXTENSION = 'b3dbuilding.json';

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createBuildingFile(floorplan, options = {}) {
  const now = new Date().toISOString();
  return {
    format: BUILDING_FILE_FORMAT,
    version: 1,
    name: options.name || floorplan?.name || 'blueprint-building',
    createdAt: options.createdAt || now,
    updatedAt: now,
    generator: 'blueprint3d-babylon',
    babylon: {
      engine: 'Babylon.js',
      renderer: options.renderer || 'Blueprint3DTestMap',
      coordinateSystem: 'Y_UP_XZ_FLOOR',
      units: floorplan?.unit || 'in',
      entry: 'Blueprint3DTestMap.loadBuildingFile'
    },
    floorplan: cloneData(floorplan)
  };
}

export function parseBuildingFile(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : cloneData(input);

  if (data?.format === BUILDING_FILE_FORMAT && data?.floorplan) {
    return cloneData(data.floorplan);
  }

  if (data?.floor?.rooms && Array.isArray(data?.walls)) {
    return cloneData(data);
  }

  throw new Error('Unsupported blueprint3d-babylon building file.');
}

export function stringifyBuildingFile(floorplan, options = {}) {
  return JSON.stringify(createBuildingFile(floorplan, options), null, 2);
}

export function createBuildingFileName(name = 'blueprint-building') {
  const safeName = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blueprint-building';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeName}-${stamp}.${BUILDING_FILE_EXTENSION}`;
}
