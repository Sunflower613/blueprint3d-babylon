const INCHES_PER_UNIT = 24;

function escXml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]));
}

function itemSize(item) {
  const scale = Number(item.scale || 1);
  return {
    width: Number(item.width || 0) / INCHES_PER_UNIT * scale,
    depth: Number(item.depth || 0) / INCHES_PER_UNIT * scale,
    height: Number(item.height || 24) / INCHES_PER_UNIT * scale
  };
}

function rotatePoint(x, z, angle) {
  const c = Math.cos(angle || 0);
  const s = Math.sin(angle || 0);
  return { x: x * c - z * s, z: x * s + z * c };
}

function itemCorners(item) {
  const size = itemSize(item);
  const hw = size.width / 2;
  const hd = size.depth / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => {
    const rotated = rotatePoint(x, z, item.rotation || 0);
    return { x: item.x + rotated.x, z: item.z + rotated.z };
  });
}

function safeName(name = 'blueprint-building') {
  return String(name).trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'blueprint-building';
}

function dxfPair(code, value) {
  return `${code}\n${value}\n`;
}

function dxfTextValue(value) {
  return String(value || '').replace(/[\u0080-\uFFFF]/g, (char) => {
    const hex = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
    return `\\U+${hex}`;
  });
}

function dxfLine(x1, z1, x2, z2, layer) {
  return [
    dxfPair(0, 'LINE'), dxfPair(8, layer),
    dxfPair(10, Number(x1.toFixed(4))), dxfPair(20, Number(z1.toFixed(4))), dxfPair(30, 0),
    dxfPair(11, Number(x2.toFixed(4))), dxfPair(21, Number(z2.toFixed(4))), dxfPair(31, 0)
  ].join('');
}

function dxfText(x, z, text, layer) {
  return [
    dxfPair(0, 'TEXT'), dxfPair(8, layer), dxfPair(10, Number(x.toFixed(4))), dxfPair(20, Number(z.toFixed(4))), dxfPair(30, 0),
    dxfPair(40, 0.25), dxfPair(1, dxfTextValue(text))
  ].join('');
}

export function stringifyDXF(floorplan) {
  let body = '';
  for (const room of floorplan.floor?.rooms || []) {
    const left = room.x - room.width / 2;
    const right = room.x + room.width / 2;
    const top = room.z - room.depth / 2;
    const bottom = room.z + room.depth / 2;
    body += dxfLine(left, top, right, top, 'ROOMS');
    body += dxfLine(right, top, right, bottom, 'ROOMS');
    body += dxfLine(right, bottom, left, bottom, 'ROOMS');
    body += dxfLine(left, bottom, left, top, 'ROOMS');
    body += dxfText(room.x, room.z, room.name || room.id, 'ROOM_LABELS');
  }
  for (const wall of floorplan.walls || []) body += dxfLine(wall.from[0], wall.from[1], wall.to[0], wall.to[1], 'WALLS');
  for (const opening of floorplan.openings || []) {
    const wall = (floorplan.walls || []).find((candidate) => candidate.id === opening.wallId);
    if (!wall) continue;
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const length = Math.hypot(dx, dz) || 1;
    const halfT = (opening.width || 1) / length / 2;
    const t1 = Math.max(0, (opening.t ?? 0.5) - halfT);
    const t2 = Math.min(1, (opening.t ?? 0.5) + halfT);
    body += dxfLine(wall.from[0] + dx * t1, wall.from[1] + dz * t1, wall.from[0] + dx * t2, wall.from[1] + dz * t2, opening.type === 'door' ? 'DOORS' : 'WINDOWS');
  }
  for (const item of floorplan.items || []) {
    const corners = itemCorners(item);
    for (let i = 0; i < corners.length; i += 1) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      body += dxfLine(a.x, a.z, b.x, b.z, 'FURNITURE');
    }
    body += dxfText(item.x, item.z, item.name || item.type, 'FURNITURE_LABELS');
  }
  return [
    dxfPair(0, 'SECTION'), dxfPair(2, 'HEADER'),
    dxfPair(9, '$ACADVER'), dxfPair(1, 'AC1021'),
    dxfPair(9, '$INSUNITS'), dxfPair(70, 6),
    dxfPair(9, '$DWGCODEPAGE'), dxfPair(3, 'UTF-8'),
    dxfPair(0, 'ENDSEC'),
    dxfPair(0, 'SECTION'), dxfPair(2, 'ENTITIES'), body, dxfPair(0, 'ENDSEC'), dxfPair(0, 'EOF')
  ].join('');
}

function boxMesh(cx, cy, cz, width, height, depth) {
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const y0 = cy - height / 2;
  const y1 = cy + height / 2;
  const z0 = cz - depth / 2;
  const z1 = cz + depth / 2;
  const vertices = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  const triangles = [[0, 1, 2], [0, 2, 3], [1, 5, 6], [1, 6, 2], [5, 4, 7], [5, 7, 6], [4, 0, 3], [4, 3, 7], [3, 2, 6], [3, 6, 7], [4, 5, 1], [4, 1, 0]];
  return { vertices, triangles };
}

function appendMesh(target, mesh) {
  const offset = target.vertices.length;
  target.vertices.push(...mesh.vertices);
  target.triangles.push(...mesh.triangles.map((tri) => tri.map((index) => index + offset)));
}

function addRotatedBox(target, cx, cy, cz, width, height, depth, rotation = 0) {
  const mesh = boxMesh(0, cy, 0, width, height, depth);
  mesh.vertices = mesh.vertices.map(([x, y, z]) => {
    const rotated = rotatePoint(x, z, rotation);
    return [cx + rotated.x, y, cz + rotated.z];
  });
  appendMesh(target, mesh);
}

export function create3MFModelXml(floorplan) {
  const mesh = { vertices: [], triangles: [] };
  const floorHeight = floorplan.floorHeight || 0.06;
  const wallHeight = floorplan.wallHeight || 2.8;
  const wallThickness = floorplan.wallThickness || 0.18;
  for (const room of floorplan.floor?.rooms || []) addRotatedBox(mesh, room.x, -floorHeight / 2, room.z, room.width, floorHeight, room.depth, 0);
  for (const wall of floorplan.walls || []) {
    const x1 = wall.from[0];
    const z1 = wall.from[1];
    const x2 = wall.to[0];
    const z2 = wall.to[1];
    const length = Math.hypot(x2 - x1, z2 - z1);
    if (length <= 0.001) continue;
    addRotatedBox(mesh, (x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2, length, wallHeight, wallThickness, -Math.atan2(z2 - z1, x2 - x1));
  }
  for (const opening of floorplan.openings || []) {
    const wall = (floorplan.walls || []).find((candidate) => candidate.id === opening.wallId);
    if (!wall) continue;
    const x = wall.from[0] + (wall.to[0] - wall.from[0]) * (opening.t ?? 0.5);
    const z = wall.from[1] + (wall.to[1] - wall.from[1]) * (opening.t ?? 0.5);
    const angle = -Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]);
    const height = opening.type === 'door' ? 2.05 : (opening.height || 0.85);
    const y = opening.type === 'door' ? height / 2 : (opening.sillHeight ?? 1.05) + height / 2;
    addRotatedBox(mesh, x, y, z, opening.width || 1, height, wallThickness + 0.04, angle);
  }
  for (const item of floorplan.items || []) {
    const size = itemSize(item);
    addRotatedBox(mesh, item.x, size.height / 2, item.z, size.width, size.height, size.depth, item.rotation || 0);
  }
  const vertices = mesh.vertices.map(([x, y, z]) => `<vertex x="${x.toFixed(5)}" y="${y.toFixed(5)}" z="${z.toFixed(5)}"/>`).join('');
  const triangles = mesh.triangles.map(([v1, v2, v3]) => `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><model unit="meter" xml:lang="zh-CN" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${escXml(floorplan.name || 'blueprint-building')}</metadata><resources><object id="1" type="model"><mesh><vertices>${vertices}</vertices><triangles>${triangles}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`;
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

function writeU16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeU32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function textBytes(text) {
  return new TextEncoder().encode(text);
}

export function createZipStore(entries) {
  const output = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = textBytes(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : textBytes(entry.data);
    const crc = crc32(data);
    const localOffset = offset;
    writeU32(output, 0x04034b50); writeU16(output, 20); writeU16(output, 0); writeU16(output, 0); writeU16(output, 0); writeU16(output, 0);
    writeU32(output, crc); writeU32(output, data.length); writeU32(output, data.length); writeU16(output, name.length); writeU16(output, 0);
    output.push(...name, ...data);
    offset = output.length;
    writeU32(central, 0x02014b50); writeU16(central, 20); writeU16(central, 20); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0);
    writeU32(central, crc); writeU32(central, data.length); writeU32(central, data.length); writeU16(central, name.length); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU32(central, 0); writeU32(central, localOffset);
    central.push(...name);
  }
  const centralOffset = output.length;
  output.push(...central);
  writeU32(output, 0x06054b50); writeU16(output, 0); writeU16(output, 0); writeU16(output, entries.length); writeU16(output, entries.length); writeU32(output, central.length); writeU32(output, centralOffset); writeU16(output, 0);
  return new Uint8Array(output);
}

export function create3MFPackage(floorplan) {
  return createZipStore([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
    { name: '3D/3dmodel.model', data: create3MFModelXml(floorplan) }
  ]);
}

export function createDXFFileName(name = 'blueprint-building') {
  return `${safeName(name)}-${new Date().toISOString().replace(/[:.]/g, '-')}.dxf`;
}

export function create3MFFileName(name = 'blueprint-building') {
  return `${safeName(name)}-${new Date().toISOString().replace(/[:.]/g, '-')}.3mf`;
}