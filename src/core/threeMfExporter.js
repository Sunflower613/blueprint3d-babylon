import { Color3, Vector3, VertexBuffer } from './babylon.js';
const BABYLON = { Color3, Vector3, VertexBuffer };
import { triangulateRoom } from '../rooms/index.js';
import {
  DEFAULT_WALL_THICKNESS,
  INCHES_PER_UNIT,
  entityFloorId,
  escXml,
  floorEntities,
  floorPrefix,
  getFloor,
  getFloorElevation,
  getItemRoomElevationOffset,
  itemSize,
  orderedFloors,
  pointAlongWall,
  rotatePoint,
  safeName,
  wallBasis,
  wallOpeningSpans
} from './exporterUtils.js';

function createMesh() {
  return { vertices: [], triangles: [], triangleColors: [] };
}

function boxMesh(cx, cy, cz, width, height, depth) {
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const y0 = cy - height / 2;
  const y1 = cy + height / 2;
  const z0 = cz - depth / 2;
  const z1 = cz + depth / 2;
  return {
    vertices: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    triangles: [[0, 1, 2], [0, 2, 3], [1, 5, 6], [1, 6, 2], [5, 4, 7], [5, 7, 6], [4, 0, 3], [4, 3, 7], [3, 2, 6], [3, 6, 7], [4, 5, 1], [4, 1, 0]],
    triangleColors: []
  };
}

function appendMesh(target, source, colorHex = null) {
  const offset = target.vertices.length;
  target.vertices.push(...source.vertices);
  
  target.triangles.push(...source.triangles.map((triangle) => triangle.map((index) => index + offset)));

  if (target.triangleColors) {
    if (source.triangleColors && source.triangleColors.length) {
      target.triangleColors.push(...source.triangleColors);
    } else {
      const count = source.triangles.length;
      for (let i = 0; i < count; i++) {
        target.triangleColors.push(colorHex);
      }
    }
  }
}

function addRotatedBox(target, cx, cy, cz, width, height, depth, rotation = 0) {
  if (width <= 0.00001 || height <= 0.00001 || depth <= 0.00001) return;
  const mesh = boxMesh(0, cy, 0, width, height, depth);
  mesh.vertices = mesh.vertices.map(([x, y, z]) => {
    const rotated = rotatePoint(x, z, rotation);
    return [cx + rotated.x, y, cz + rotated.z];
  });
  appendMesh(target, mesh);
}

function appendRoomSlab(mesh, floorplan, room) {
  const floorId = entityFloorId(floorplan, room);
  const floor = getFloor(floorplan, floorId);
  const floorHeight = Number(floor?.floorHeight ?? floorplan.floorHeight ?? 0.06);
  const topY = getFloorElevation(floorplan, floorId) + Number(room.elevation || 0);
  const bottomY = topY - floorHeight;
  const triangulated = triangulateRoom(room);
  const slab = createMesh();
  triangulated.vertices.forEach((point) => slab.vertices.push([Number(room.x || 0) + point.x, topY, Number(room.z || 0) + point.z]));
  triangulated.vertices.forEach((point) => slab.vertices.push([Number(room.x || 0) + point.x, bottomY, Number(room.z || 0) + point.z]));
  const bottomOffset = triangulated.vertices.length;
  triangulated.triangles.forEach(([a, b, c]) => slab.triangles.push([a, c, b], [bottomOffset + a, bottomOffset + b, bottomOffset + c]));
  triangulated.vertices.forEach((_, index) => {
    const next = (index + 1) % triangulated.vertices.length;
    slab.triangles.push([index, next, bottomOffset + next], [index, bottomOffset + next, bottomOffset + index]);
  });
  appendMesh(mesh, slab);
}

function appendWallWithOpenings(mesh, floorplan, wall, extraSpans = []) {
  const basis = wallBasis(wall);
  if (!basis) return;
  const floorId = entityFloorId(floorplan, wall);
  const floor = getFloor(floorplan, floorId);
  const wallHeight = Number(floor?.wallHeight ?? floorplan.wallHeight ?? 3.0);
  const thickness = Math.max(0.02, Number(wall.thickness ?? floorplan.wallThickness ?? DEFAULT_WALL_THICKNESS));
  const floorY = getFloorElevation(floorplan, floorId);
  const rotation = Math.atan2(basis.uz, basis.ux);
  const spans = wallOpeningSpans(floorplan, wall, basis);

  if (extraSpans && extraSpans.length > 0) {
    extraSpans.forEach(span => {
      spans.push({
        start: span.start,
        end: span.end,
        opening: {
          type: 'door',
          sillHeight: 0,
          height: span.height
        }
      });
    });
    spans.sort((a, b) => a.start - b.start);
  }

  const addSegment = (start, end, bottom, top) => {
    if (end - start <= 0.00001 || top - bottom <= 0.00001) return;
    const center = pointAlongWall(basis, (start + end) / 2);
    addRotatedBox(mesh, center.x, floorY + (bottom + top) / 2, center.z, end - start, top - bottom, thickness, rotation);
  };

  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) addSegment(cursor, span.start, 0, wallHeight);
    const opening = span.opening;
    const openingBottom = opening.type === 'door' ? 0 : Math.max(0, Number(opening.sillHeight ?? 1.05));
    const openingHeight = Math.max(0.1, Number(opening.height ?? (opening.type === 'door' ? 2.05 : 0.85)));
    const openingTop = Math.min(wallHeight, openingBottom + openingHeight);
    if (openingBottom > 0) addSegment(span.start, span.end, 0, openingBottom);
    if (openingTop < wallHeight) addSegment(span.start, span.end, openingTop, wallHeight);
    cursor = Math.max(cursor, span.end);
  }
  if (cursor < basis.length) addSegment(cursor, basis.length, 0, wallHeight);
}

function appendSimpleStructures(mesh, floorplan, floorId, options = {}) {
  const floorY = getFloorElevation(floorplan, floorId);
  for (const stairs of floorEntities(floorplan, 'stairs', floorId)) {
    const width = Number(stairs.width || 1.2);
    const depth = Number(stairs.depth || 3.2);
    const height = Number(stairs.height || floorplan.storyHeight || 3.06);

    let hasRealMesh = false;
    if (options.testMap && options.testMap.scene) {
      const stairsNode = options.testMap.scene.getNodeByName(`stairs_${stairs.id}`);
      if (stairsNode) {
        const childMeshes = stairsNode.getChildMeshes();
        if (childMeshes && childMeshes.length > 0) {
          hasRealMesh = true;
          for (const child of childMeshes) {
            const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = child.getIndices();
            if (positions && indices) {
              const subMesh = createMesh();
              const worldMatrix = child.getWorldMatrix();
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
              }
              for (let i = 0; i < indices.length; i += 3) {
                subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
              }
              const colorHex = getColorHex(child.material);
              appendMesh(mesh, subMesh, colorHex);
            }
          }
        }
      }
    }

    if (!hasRealMesh) {
      const steps = Math.max(3, Number(stairs.steps || 9));
      for (let step = 0; step < steps; step += 1) {
        const stepDepth = depth / steps;
        const stepHeight = height * (step + 1) / steps;
        const localZ = -depth / 2 + stepDepth * (step + 0.5);
        const position = rotatePoint(0, localZ, Number(stairs.rotation || 0));
        addRotatedBox(
          mesh,
          Number(stairs.x || 0) + position.x,
          floorY + stepHeight / 2,
          Number(stairs.z || 0) + position.z,
          width,
          stepHeight,
          stepDepth,
          Number(stairs.rotation || 0)
        );
      }
    }
  }

  for (const fence of floorEntities(floorplan, 'fences', floorId)) {
    let hasRealMesh = false;
    if (options.testMap && options.testMap.scene) {
      const fenceNode = options.testMap.scene.getNodeByName(`fence_${fence.id}`);
      if (fenceNode) {
        const childMeshes = fenceNode.getChildMeshes();
        if (childMeshes && childMeshes.length > 0) {
          hasRealMesh = true;
          for (const child of childMeshes) {
            const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const indices = child.getIndices();
            if (positions && indices) {
              const subMesh = createMesh();
              const worldMatrix = child.getWorldMatrix();
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
              }
              for (let i = 0; i < indices.length; i += 3) {
                subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
              }
              const colorHex = getColorHex(child.material);
              appendMesh(mesh, subMesh, colorHex);
            }
          }
        }
      }
    }

    if (!hasRealMesh) {
      const basis = wallBasis(fence);
      if (!basis) continue;
      const center = pointAlongWall(basis, basis.length / 2);
      const height = Number(fence.height || 1.1);
      addRotatedBox(
        mesh,
        center.x,
        floorY + Number(fence.yOffset || 0) + height / 2,
        center.z,
        basis.length,
        height,
        Math.max(0.04, Number(fence.thickness || 0.1)),
        Math.atan2(basis.uz, basis.ux)
      );
    }
  }
}

function getColorHex(material) {
  if (!material) return '#E0E0E0FF';
  let color = material.diffuseColor || material.albedoColor;
  if (!color && material.color) {
    color = material.color;
  }
  if (!color) {
    color = new BABYLON.Color3(0.8, 0.8, 0.8);
  }
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  const alphaVal = material.alpha !== undefined ? material.alpha : 1.0;
  const a = Math.round(alphaVal * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}${a}`.toUpperCase();
}

function projectPointToLine(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.00001) return 0;
  const t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  return t * Math.sqrt(lenSq);
}

function distanceToLine(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.00001) return Math.sqrt((px - ax) ** 2 + (pz - az) ** 2);
  const cross = Math.abs((px - ax) * dz - (pz - az) * dx);
  return cross / len;
}

function getOverlappingSpan(wall, cand) {
  if (!wall.from || !wall.to || !cand.from || !cand.to) return null;
  const [ax, az] = wall.from;
  const [bx, bz] = wall.to;
  const [cx, cz] = cand.from;
  const [dx, dz] = cand.to;

  const dxAB = bx - ax;
  const dzAB = bz - az;
  const lenAB = Math.sqrt(dxAB * dxAB + dzAB * dzAB);

  const dxCD = dx - cx;
  const dzCD = dz - cz;
  const lenCD = Math.sqrt(dxCD * dxCD + dzCD * dzCD);

  if (lenAB < 0.1 || lenCD < 0.1) return null;

  const dot = (dxAB * dxCD + dzAB * dzCD) / (lenAB * lenCD);
  if (Math.abs(dot) < 0.98) return null;

  const distC = distanceToLine(cx, cz, ax, az, bx, bz);
  const distD = distanceToLine(dx, dz, ax, az, bx, bz);
  if (distC > 0.08 || distD > 0.08) return null;

  const tC = projectPointToLine(cx, cz, ax, az, bx, bz);
  const tD = projectPointToLine(dx, dz, ax, az, bx, bz);
  
  const minCD = Math.min(tC, tD);
  const maxCD = Math.max(tC, tD);

  const start = Math.max(0, minCD);
  const end = Math.min(lenAB, maxCD);

  if (end - start > 1.2) {
    return { start, end, center: (start + end) / 2 };
  }
  return null;
}

function createObjects(floorplan, options = {}) {
  const objects = [];
  const exportBuilding = options.category !== 'furniture';
  const exportFurniture = options.category !== 'building';

  const floors = orderedFloors(floorplan);
  const pegHeight = 0.08;
  const pegLength = 0.15;
  const socketHeight = 0.10;
  const socketLength = 0.17;
  
  const pegsCache = {};
  const socketsCache = {};
  
  floors.forEach((floor) => {
    pegsCache[floor.id] = [];
    socketsCache[floor.id] = {};
  });

  if (options.enableTenon !== false && floors.length > 1) {
    for (let i = 0; i < floors.length - 1; i++) {
      const currentFloor = floors[i];
      const nextFloor = floors[i + 1];
      
      const currentWalls = floorEntities(floorplan, 'walls', currentFloor.id);
      const nextWalls = floorEntities(floorplan, 'walls', nextFloor.id);
      
      currentWalls.forEach(wallA => {
        const basisA = wallBasis(wallA);
        if (!basisA) return;
        const spansA = wallOpeningSpans(floorplan, wallA, basisA);
        if (spansA && spansA.length > 0) return;
        
        for (const wallB of nextWalls) {
          const basisB = wallBasis(wallB);
          if (!basisB) continue;
          const spansB = wallOpeningSpans(floorplan, wallB, basisB);
          if (spansB && spansB.length > 0) continue;
          
          const overlap = getOverlappingSpan(wallA, wallB);
          if (overlap) {
            const t_center = overlap.center;
            const centerPos = pointAlongWall(basisA, t_center);
            const floorY = getFloorElevation(floorplan, currentFloor.id);
            const wallHeight = Number(currentFloor.wallHeight ?? floorplan.wallHeight ?? 3.0);
            const thickness = Math.max(0.02, Number(wallA.thickness ?? floorplan.wallThickness ?? DEFAULT_WALL_THICKNESS));
            const rotation = Math.atan2(basisA.uz, basisA.ux);
            
            pegsCache[currentFloor.id].push({
              cx: centerPos.x,
              cz: centerPos.z,
              centerY: floorY + wallHeight + pegHeight / 2,
              pegLength,
              pegHeight,
              thickness: thickness * 0.6,
              rotation
            });
            
            const [cx_B, cz_B] = wallB.from;
            const [dx_B, dz_B] = wallB.to;
            const tB = projectPointToLine(centerPos.x, centerPos.z, cx_B, cz_B, dx_B, dz_B);
            
            if (!socketsCache[nextFloor.id][wallB.id]) {
              socketsCache[nextFloor.id][wallB.id] = [];
            }
            socketsCache[nextFloor.id][wallB.id].push({
              start: tB - socketLength / 2,
              end: tB + socketLength / 2,
              height: socketHeight
            });
            
            break;
          }
        }
      });
    }
  }

  if (exportBuilding) {
    floors.forEach((floor, index) => {
      const mesh = createMesh();
      for (const room of floorEntities(floorplan, 'rooms', floor.id)) appendRoomSlab(mesh, floorplan, room);
      
      for (const wall of floorEntities(floorplan, 'walls', floor.id)) {
        const extraSpans = socketsCache[floor.id]?.[wall.id] || [];
        appendWallWithOpenings(mesh, floorplan, wall, extraSpans);
      }
      
      appendSimpleStructures(mesh, floorplan, floor.id, options);
      
      if (pegsCache[floor.id] && pegsCache[floor.id].length > 0) {
        pegsCache[floor.id].forEach(peg => {
          addRotatedBox(mesh, peg.cx, peg.centerY, peg.cz, peg.pegLength, peg.pegHeight, peg.thickness, peg.rotation);
        });
      }

      if (mesh.triangles.length) {
        objects.push({
          name: `Building - ${floor.name || floorPrefix(index)}`,
          partNumber: `${floorPrefix(index)}-BUILDING`,
          category: 'building',
          mesh
        });
      }
    });
  }

  if (exportFurniture) {
    for (const item of floorplan.items || []) {
      const mesh = createMesh();
      
      let hasRealMesh = false;
      if (options.testMap && options.testMap.scene) {
        const itemNode = options.testMap.scene.getNodeByName(`item_${item.id}`);
        if (itemNode) {
          const childMeshes = itemNode.getChildMeshes();
          if (childMeshes && childMeshes.length > 0) {
            hasRealMesh = true;
            for (const child of childMeshes) {
              const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
              const indices = child.getIndices();
              if (positions && indices) {
                const subMesh = createMesh();
                const worldMatrix = child.getWorldMatrix();
                
                for (let i = 0; i < positions.length; i += 3) {
                  const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                  const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                  subMesh.vertices.push([worldPos.x, worldPos.y, worldPos.z]);
                }
                
                for (let i = 0; i < indices.length; i += 3) {
                  subMesh.triangles.push([indices[i], indices[i + 1], indices[i + 2]]);
                }
                
                const colorHex = getColorHex(child.material);
                appendMesh(mesh, subMesh, colorHex);
              }
            }
          }
        }
      }

      if (!hasRealMesh) {
        const size = itemSize(item);
        const floorY = getFloorElevation(floorplan, entityFloorId(floorplan, item));
        const roomOffset = getItemRoomElevationOffset(floorplan, item);
        const centerY = floorY + roomOffset + Number(item.elevation || 0) / INCHES_PER_UNIT + size.height / 2;
        addRotatedBox(mesh, Number(item.x || 0), centerY, Number(item.z || 0), size.width, size.height, size.depth, Number(item.rotation || 0));
      }

      if (mesh.triangles.length) {
        objects.push({
          name: `Furniture - ${item.name || item.type || item.id}`,
          partNumber: `FURNITURE-${item.id || objects.length + 1}`,
          category: 'furniture',
          mesh
        });
      }
    }
  }
  return objects;
}

function objectXml(object, id, baseMaterialsList) {
  const vertices = object.mesh.vertices.map(([x, y, z]) => `<vertex x="${x.toFixed(5)}" y="${y.toFixed(5)}" z="${z.toFixed(5)}"/>`).join('');
  
  const colorsUsed = [];
  if (object.mesh.triangleColors && object.mesh.triangleColors.length) {
    object.mesh.triangleColors.forEach(color => {
      if (color && !colorsUsed.includes(color)) {
        colorsUsed.push(color);
      }
    });
  }
  
  let baseMatId = 0;
  if (colorsUsed.length > 0) {
    baseMatId = id + 10000;
    const baseItems = colorsUsed.map((color, idx) => `<base name="mat_${idx}" displaycolor="${color}"/>`).join('');
    baseMaterialsList.push(`<basematerials id="${baseMatId}">${baseItems}</basematerials>`);
  }

  const triangles = object.mesh.triangles.map((triangle, triIdx) => {
    const [v1, v2, v3] = triangle;
    const color = object.mesh.triangleColors?.[triIdx];
    if (color && baseMatId > 0) {
      const p1 = colorsUsed.indexOf(color);
      return `<triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="${baseMatId}" p1="${p1}"/>`;
    }
    return `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
  }).join('');
  
  return `<object id="${id}" type="model" name="${escXml(object.name)}" partnumber="${escXml(object.partNumber)}"><mesh><vertices>${vertices}</vertices><triangles>${triangles}</triangles></mesh></object>`;
}

export function create3MFModelXml(floorplan, options = {}) {
  const objects = createObjects(floorplan, options);
  const baseMaterialsList = [];
  const resources = objects.map((object, index) => objectXml(object, index + 1, baseMaterialsList)).join('');
  const baseMaterialsXml = baseMaterialsList.join('');
  const build = objects.map((_, index) => `<item objectid="${index + 1}"/>`).join('');
  const buildingCount = objects.filter((object) => object.category === 'building').length;
  const furnitureCount = objects.filter((object) => object.category === 'furniture').length;
  return `<?xml version="1.0" encoding="UTF-8"?><model unit="meter" xml:lang="zh-CN" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${escXml(floorplan.name || 'blueprint-building')}</metadata><metadata name="Application">blueprint3d-babylon</metadata><metadata name="Description">Layered architectural export: ${buildingCount} building object(s), ${furnitureCount} furniture object(s). Walls include physical thickness and door/window voids.</metadata><resources>${baseMaterialsXml}${resources}</resources><build>${build}</build></model>`;
}

function crcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function textBytes(value) {
  return new TextEncoder().encode(value);
}

export function createZipStore(entries) {
  const prepared = entries.map((entry) => {
    const name = textBytes(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : textBytes(entry.data);
    return { name, data, crc: crc32(data), localOffset: 0 };
  });
  const localSize = prepared.reduce((sum, entry) => sum + 30 + entry.name.length + entry.data.length, 0);
  const centralSize = prepared.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
  const output = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(output.buffer);
  let offset = 0;
  const u16 = (value) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };
  const u32 = (value) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };
  const bytes = (value) => {
    output.set(value, offset);
    offset += value.length;
  };

  for (const entry of prepared) {
    entry.localOffset = offset;
    u32(0x04034b50); u16(20); u16(0); u16(0); u16(0); u16(0);
    u32(entry.crc); u32(entry.data.length); u32(entry.data.length); u16(entry.name.length); u16(0);
    bytes(entry.name); bytes(entry.data);
  }

  const centralOffset = offset;
  for (const entry of prepared) {
    u32(0x02014b50); u16(20); u16(20); u16(0); u16(0); u16(0); u16(0);
    u32(entry.crc); u32(entry.data.length); u32(entry.data.length); u16(entry.name.length);
    u16(0); u16(0); u16(0); u16(0); u32(0); u32(entry.localOffset);
    bytes(entry.name);
  }

  u32(0x06054b50); u16(0); u16(0); u16(prepared.length); u16(prepared.length);
  u32(centralSize); u32(centralOffset); u16(0);
  return output;
}

export function create3MFPackage(floorplan, options = {}) {
  return createZipStore([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
    { name: '3D/3dmodel.model', data: create3MFModelXml(floorplan, options) }
  ]);
}

export function create3MFFileName(name = 'blueprint-building') {
  return `${safeName(name)}-${new Date().toISOString().replace(/[:.]/g, '-')}.3mf`;
}
