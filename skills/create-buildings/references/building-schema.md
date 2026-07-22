# Blueprint3D building schema

## Archive wrapper

Use the current `createBuildingFile` output:

```json
{
  "format": "blueprint3d-babylon.building.v1",
  "version": 1,
  "name": "Project name",
  "createdAt": "2026-07-22T12:00:00.000Z",
  "updatedAt": "2026-07-22T12:00:00.000Z",
  "generator": "blueprint3d-babylon",
  "babylon": {
    "engine": "Babylon.js",
    "renderer": "Blueprint3DTestMap",
    "coordinateSystem": "Y_UP_XZ_FLOOR",
    "units": "m",
    "entry": "Blueprint3DTestMap.loadBuildingFile"
  },
  "floorplan": {}
}
```

The loader also accepts a bare legacy floorplan, but generated files should use the wrapper.

## Floorplan core

Required or commonly used fields:

```json
{
  "name": "Project name",
  "unit": "m",
  "wallHeight": 2.8,
  "wallThickness": 0.15,
  "floorHeight": 0.2,
  "storyHeight": 3,
  "currentFloorId": "floor_1",
  "floors": [],
  "floor": { "rooms": [] },
  "walls": [],
  "openings": [],
  "items": [],
  "roofs": [],
  "stairs": [],
  "fences": [],
  "fenceGates": [],
  "environment": { "skyMaterial": null, "groundMaterial": null }
}
```

Collections omitted by input are normalized to empty arrays, but emit them for readable complete archives.

## Floors and rooms

- Floor: `id`, `name`, `level`, `wallHeight`, `floorHeight`, `skyboxEnabled`, optionally `hideRoof`/`hideWall`.
- Room: `id`, `name`, `floorId`, `shape`, `x`, `z`, `width`, `depth`, `rotation`, `elevation`, `material`, optionally `wallIds`.
- Supported room shapes are defined in `src/rooms/roomShapes.js`; current common values include `square`, `l-shape`, `circle`, `octagon`, `diamond`, `sector`, `semicircle`, and `right-triangle`.
- L rooms use `edgeWidth` and `edgeDepth`.

## Walls and openings

- Wall: `id`, `floorId`, `from: [x,z]`, `to: [x,z]`, optional `roomId`, thickness/height overrides, front/back material fields, baseboard, and wainscot settings.
- Opening: `id`, `type` (`door` or `window`), `floorId`, `wallId`, `t`, `width`, `height`, `sillHeight`, `shape`, panel/frame/glass materials, and flip/open flags.
- Query current opening shapes from `src/openings/openingShapes.js` before using uncommon shapes.

## Structures

- Roof: `id`, `floorId`, `x`, `z`, `width`, `depth`, `height`, `subtype`/`type`, `rotation`, top/side/bottom materials and visibility flags.
- Stairs: `id`, `floorId`, `x`, `z`, `width`, `depth`, `height`, `steps`, `subtype`, `rotation`, `mirrored`, materials and side visibility.
- Stair subtype values include `straight`, `lshape`, `ushape`, `spiral`, `curved`, and `floating` where supported by current geometry.
- L stairs: `cornerStep`, `runBeforeCorner`, `runAfterCorner`.
- U stairs: `uSlotWidth`, `uVoidLength`.
- Spiral/curved stairs: `spiralDegrees`.
- Fence: `id`, `floorId`, `from`, `to`, `subtype`, `height`, `thickness`, and frame/panel materials.
- Fence gate: bind to the relevant fence using the current domain fields; verify them in `FloorplanDocument.js` before authoring.

## Furniture

Use registered furniture definitions only. A normalized item commonly contains:

```json
{
  "id": "item_sofa_1",
  "type": "sofa",
  "name": "沙发",
  "floorId": "floor_1",
  "roomId": "room_living",
  "x": 0,
  "z": 0,
  "elevation": 0,
  "width": 2.1,
  "depth": 0.9,
  "height": 0.85,
  "rotation": 0,
  "scale": 1,
  "colors": {},
  "materials": {}
}
```

List current types through the public catalog:

```powershell
node --input-type=module -e "import { FURNITURE_LIST } from './src/furniture/index.js'; console.log(FURNITURE_LIST.map(x => x.type).sort().join('\n'))"
```

## Materials and environment

Plain hex strings are accepted. Structured textures generally use:

```json
{
  "id": "wood-oak-natural-light",
  "name": "浅色原木直纹",
  "category": "wood",
  "kind": "texture",
  "src": "wood_oak_natural_light.jpg",
  "scale": 2,
  "color": "#ffffff"
}
```

Prefer catalog IDs and portable asset filenames over machine-local absolute paths. Uploaded custom textures may be data URLs when the archive must be self-contained.
