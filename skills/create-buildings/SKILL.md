---
name: create-buildings
description: Create, revise, or validate Blueprint3D Babylon `.b3dbuilding.json` building archives for this repository. Use for generating complete floorplans, multi-floor buildings, rooms, walls, openings, stairs, fences, roofs, environment materials, furniture layouts, or repairing an existing `blueprint3d-babylon.building.v1` archive.
---

# Create Blueprint3D buildings

Generate a loadable building archive against the repository's current public API and catalogs. Treat source code as authoritative; do not copy stale IDs from old examples.

## Workflow

1. Inspect the current schema and catalogs before authoring:

   ```powershell
   rg -n "normalizeFloorplan|addRoom|addWall|addOpening|addStairs" src/domain/FloorplanDocument.js
   rg -n "type: '" src/furniture src/rooms src/openings -g "*.js"
   ```

2. Read [references/building-schema.md](references/building-schema.md). Inspect only the source modules relevant to requested entities.
3. Resolve ambiguous architectural requirements before generating when they materially change topology: footprint, floor count, open edges, stair direction, or door/window placement.
4. Build the `floorplan` with stable, descriptive, unique IDs. Create referenced entities before assigning their IDs.
5. Wrap the floorplan with `createBuildingFile` or match its current output exactly. Prefer importing public exports from `src/index.js`; do not import private modules from example code.
6. Save as `<project-name>-YYYYMMDD-HHmm.b3dbuilding.json` when the user requests a downloadable archive.
7. Run the bundled validator:

   ```powershell
   node skills/create-buildings/scripts/validate-building.mjs <path-to-file>
   ```

8. If repository code changed, also run relevant tests and `npm run build`. Visually inspect complex topology in the editor when practical.

## Authoring rules

- Use metres in normalized floorplan data and radians for rotations.
- Use X/Z for the horizontal plane and Y only through `elevation`/floor level handling.
- Keep room floor elevation relative to its floor. Do not manually add cumulative story height to upper-floor entities.
- Use exact supported identifiers. Notably, room shape is `l-shape`, while stair subtype is `lshape`.
- Bind every opening to an existing wall using `wallId`; keep `t` between 0 and 1.
- Keep each entity's `floorId` valid. Keep `roomId` and `wallIds` consistent when supplied.
- Use current furniture `type` values from `src/furniture/index.js`. Never invent a built-in type.
- Use material descriptors supported by `MaterialResolver`; retain `id`, `kind`, `category`, `color`, `src`, and scale controls when applicable.
- Store sky and ground materials in `floorplan.environment.skyMaterial` and `groundMaterial`. They are used only when the current floor enables `skyboxEnabled`.
- For L stairs, use `cornerStep`, `runBeforeCorner`, and `runAfterCorner`. For U stairs, use `uSlotWidth` and `uVoidLength`.
- Preserve user data not explicitly requested for change when revising an archive.

## Quality checks

- Ensure IDs are unique across each entity collection and all references resolve.
- Ensure dimensions are finite and positive; ensure room and wall geometry does not accidentally overlap or leave unintended gaps.
- Ensure furniture bottoms sit at elevation 0 unless wall-mounted or placed on another surface.
- Ensure upper-floor openings and furniture use the correct `floorId`, not manually offset coordinates.
- Prefer multiple simple rooms/walls over one invalid self-intersecting polygon.
- Return the created file path and summarize assumptions and validation results.
