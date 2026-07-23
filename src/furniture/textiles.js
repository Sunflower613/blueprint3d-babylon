import { Mesh, VertexData } from '../core/babylon.js';
import {
  boxComponent,
  cylinderComponent,
  getComponentMaterial,
  markComponent
} from './_helpers.js';

function createIrregularRugMesh(registry, item, definition, node, size, height) {
  const segmentCount = 32;
  const rawOutline = [];

  for (let index = 0; index < segmentCount; index += 1) {
    const angle = (index / segmentCount) * Math.PI * 2;
    const radialVariation = 1
      + 0.105 * Math.sin(angle * 3 + 0.45)
      + 0.055 * Math.cos(angle * 5 - 0.7);
    rawOutline.push({
      x: Math.cos(angle) * radialVariation,
      z: Math.sin(angle) * radialVariation
    });
  }

  const minX = Math.min(...rawOutline.map((point) => point.x));
  const maxX = Math.max(...rawOutline.map((point) => point.x));
  const minZ = Math.min(...rawOutline.map((point) => point.z));
  const maxZ = Math.max(...rawOutline.map((point) => point.z));
  const outline = rawOutline.map((point) => ({
    x: ((point.x - minX) / (maxX - minX) - 0.5) * size.width,
    z: ((point.z - minZ) / (maxZ - minZ) - 0.5) * size.depth
  }));

  const positions = [];
  const indices = [];
  const uvs = [];
  const topY = height + 0.002;
  const bottomY = 0.002;

  const pushVertex = (x, y, z, u, v) => {
    positions.push(x, y, z);
    uvs.push(u, v);
    return positions.length / 3 - 1;
  };

  const topCenter = pushVertex(0, topY, 0, 0.5, 0.5);
  const topRing = outline.map((point) => pushVertex(
    point.x,
    topY,
    point.z,
    point.x / size.width + 0.5,
    point.z / size.depth + 0.5
  ));
  const bottomCenter = pushVertex(0, bottomY, 0, 0.5, 0.5);
  const bottomRing = outline.map((point) => pushVertex(
    point.x,
    bottomY,
    point.z,
    point.x / size.width + 0.5,
    point.z / size.depth + 0.5
  ));

  for (let index = 0; index < segmentCount; index += 1) {
    const next = (index + 1) % segmentCount;
    indices.push(topCenter, topRing[next], topRing[index]);
    indices.push(bottomCenter, bottomRing[index], bottomRing[next]);
  }

  const edgeLengths = outline.map((point, index) => {
    const next = outline[(index + 1) % segmentCount];
    return Math.hypot(next.x - point.x, next.z - point.z);
  });
  const perimeter = edgeLengths.reduce((total, length) => total + length, 0);
  const sideBottom = [];
  const sideTop = [];
  let traversed = 0;

  for (let index = 0; index <= segmentCount; index += 1) {
    const point = outline[index % segmentCount];
    const u = traversed / perimeter;
    sideBottom.push(pushVertex(point.x, bottomY, point.z, u, 0));
    sideTop.push(pushVertex(point.x, topY, point.z, u, 1));
    if (index < segmentCount) traversed += edgeLengths[index];
  }

  for (let index = 0; index < segmentCount; index += 1) {
    indices.push(sideBottom[index], sideTop[index], sideBottom[index + 1]);
    indices.push(sideTop[index], sideTop[index + 1], sideBottom[index + 1]);
  }

  const normals = [];
  VertexData.ComputeNormals(positions, indices, normals);
  const mesh = new Mesh(`${item.id}_fabric`, registry.scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(mesh);

  registry.add(mesh, {
    parent: node,
    material: getComponentMaterial(registry, item, definition, 'fabric')
  });
  return markComponent(mesh, item, 'fabric');
}

function createPuzzleRugOutline(size) {
  // One EVA floor tile. Broad dovetail tabs alternate with matching recesses;
  // the base inset leaves room for the tabs inside the requested footprint.
  const profile = [
    [-0.44, 0.44],
    [-0.39, 0.44],
    [-0.36, 0.50],
    [-0.28, 0.50],
    [-0.25, 0.44],
    [-0.17, 0.44],
    [-0.14, 0.38],
    [-0.06, 0.38],
    [-0.03, 0.44],
    [0.04, 0.44],
    [0.07, 0.50],
    [0.15, 0.50],
    [0.18, 0.44],
    [0.26, 0.44],
    [0.29, 0.38],
    [0.37, 0.38],
    [0.40, 0.44],
    [0.44, 0.44]
  ];
  const outline = [];
  const appendEdge = (transform) => {
    for (let index = 0; index < profile.length - 1; index += 1) {
      const [tangent, outward] = profile[index];
      const point = transform(tangent, outward);
      outline.push({
        x: point.x * size.width,
        z: point.z * size.depth
      });
    }
  };

  // Counter-clockwise in the x/z plane: bottom, right, top, left.
  appendEdge((tangent, outward) => ({ x: tangent, z: -outward }));
  appendEdge((tangent, outward) => ({ x: outward, z: tangent }));
  appendEdge((tangent, outward) => ({ x: -tangent, z: outward }));
  appendEdge((tangent, outward) => ({ x: -outward, z: -tangent }));
  return outline;
}

function createPuzzleRugMesh(registry, item, definition, node, size, height) {
  const outline = createPuzzleRugOutline(size);
  const segmentCount = outline.length;
  const positions = [];
  const indices = [];
  const uvs = [];
  const topY = height + 0.002;
  const bottomY = 0.002;

  const pushVertex = (x, y, z, u, v) => {
    positions.push(x, y, z);
    uvs.push(u, v);
    return positions.length / 3 - 1;
  };

  const topCenter = pushVertex(0, topY, 0, 0.5, 0.5);
  const topRing = outline.map((point) => pushVertex(
    point.x,
    topY,
    point.z,
    point.x / size.width + 0.5,
    point.z / size.depth + 0.5
  ));
  const bottomCenter = pushVertex(0, bottomY, 0, 0.5, 0.5);
  const bottomRing = outline.map((point) => pushVertex(
    point.x,
    bottomY,
    point.z,
    point.x / size.width + 0.5,
    point.z / size.depth + 0.5
  ));

  for (let index = 0; index < segmentCount; index += 1) {
    const next = (index + 1) % segmentCount;
    indices.push(topCenter, topRing[next], topRing[index]);
    indices.push(bottomCenter, bottomRing[index], bottomRing[next]);
  }

  const edgeLengths = outline.map((point, index) => {
    const next = outline[(index + 1) % segmentCount];
    return Math.hypot(next.x - point.x, next.z - point.z);
  });
  const perimeter = edgeLengths.reduce((total, length) => total + length, 0);
  const sideBottom = [];
  const sideTop = [];
  let traversed = 0;

  for (let index = 0; index <= segmentCount; index += 1) {
    const point = outline[index % segmentCount];
    const u = traversed / perimeter;
    sideBottom.push(pushVertex(point.x, bottomY, point.z, u, 0));
    sideTop.push(pushVertex(point.x, topY, point.z, u, 1));
    if (index < segmentCount) traversed += edgeLengths[index];
  }

  for (let index = 0; index < segmentCount; index += 1) {
    indices.push(sideBottom[index], sideTop[index], sideBottom[index + 1]);
    indices.push(sideTop[index], sideTop[index + 1], sideBottom[index + 1]);
  }

  const normals = [];
  VertexData.ComputeNormals(positions, indices, normals);
  const mesh = new Mesh(`${item.id}_fabric`, registry.scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(mesh);

  registry.add(mesh, {
    parent: node,
    material: getComponentMaterial(registry, item, definition, 'fabric')
  });
  return markComponent(mesh, item, 'fabric');
}

export const rugFurniture = {
  type: 'rug',
  name: '方形地毯',
  defaultSize: { width: 60, depth: 84, height: 0.4 },
  components: [
    {
      id: 'fabric',
      label: '地毯织面',
      defaultColor: '#ffffff',
      defaultMaterial: {
        id: 'fabric-square',
        name: '边框毯',
        category: 'fabric',
        kind: 'texture',
        scale: 2,
        color: '#ffffff'
      }
    }
  ],
  build(registry, item, node, size) {
    const rugThickness = 0.008;
    boxComponent(registry, item, rugFurniture, 'fabric', {
      width: size.width, height: rugThickness, depth: size.depth
    }, { position: { x: 0, y: rugThickness / 2 + 0.002, z: 0 } }, { parent: node });
  }
};

export const ovalRugFurniture = {
  type: 'oval_rug',
  name: '圆形地毯',
  defaultSize: { width: 60, depth: 84, height: 0.4 },
  components: [
    {
      id: 'fabric',
      label: '地毯织面',
      defaultColor: '#ffffff',
      defaultMaterial: {
        id: 'fabric-circle',
        name: '圆花毯',
        category: 'fabric',
        kind: 'texture',
        scale: 2,
        color: '#ffffff'
      }
    }
  ],
  build(registry, item, node, size) {
    const rugThickness = 0.008;
    const mesh = cylinderComponent(registry, item, ovalRugFurniture, 'fabric', {
      diameterTop: 1, diameterBottom: 1, height: rugThickness, tessellation: 32
    }, { position: { x: 0, y: rugThickness / 2 + 0.002, z: 0 } }, { parent: node });
    mesh.scaling.x = size.width;
    mesh.scaling.z = size.depth;
  }
};

export const roundedRugFurniture = {
  type: 'rounded_rug',
  name: '圆角地毯',
  defaultSize: { width: 60, depth: 84, height: 0.4 },
  components: [
    { id: 'fabric', label: '地毯织面', defaultColor: '#cc8fa6' }
  ],
  build(registry, item, node, size) {
    const rugThickness = 0.008;
    const r = Math.min(size.width, size.depth) * 0.15;
    const w = size.width;
    const d = size.depth;
    const h = rugThickness;

    // 1. 横向主盒子
    boxComponent(registry, item, roundedRugFurniture, 'fabric', {
      width: w - 2 * r, height: h, depth: d
    }, { position: { x: 0, y: h / 2 + 0.002, z: 0 } }, { parent: node });

    // 2. 纵向横跨剩余的中间区域盒子
    boxComponent(registry, item, roundedRugFurniture, 'fabric', {
      width: w, height: h, depth: d - 2 * r
    }, { position: { x: 0, y: h / 2 + 0.002, z: 0 } }, { parent: node });

    // 3. 四个角的圆柱
    const corners = [
      { x: w / 2 - r, z: d / 2 - r },
      { x: -w / 2 + r, z: d / 2 - r },
      { x: w / 2 - r, z: -d / 2 + r },
      { x: -w / 2 + r, z: -d / 2 + r }
    ];
    corners.forEach(pos => {
      cylinderComponent(registry, item, roundedRugFurniture, 'fabric', {
        diameterTop: 2 * r, diameterBottom: 2 * r, height: h, tessellation: 16
      }, { position: { x: pos.x, y: h / 2 + 0.002, z: pos.z } }, { parent: node });
    });
  }
};

export const irregularRugFurniture = {
  type: 'irregular_rug',
  name: '异形地毯',
  unit: 'm',
  defaultSize: { width: 1.6, depth: 1.2, height: 0.01 },
  components: [
    { id: 'fabric', label: '地毯织面', defaultColor: '#cbbd9e' }
  ],
  build(registry, item, node, size) {
    const h = Math.min(0.012, Math.max(0.006, size.height));
    createIrregularRugMesh(registry, item, irregularRugFurniture, node, size, h);
  }
};

export const biscuitRugFurniture = {
  type: 'biscuit_rug',
  name: '饼干地毯',
  unit: 'm',
  defaultSize: { width: 1, depth: 1, height: 0.01 },
  components: [
    {
      id: 'fabric',
      label: '地垫表面',
      defaultColor: '#fffaf0',
      defaultMaterial: {
        id: 'fabric-foam-panel',
        name: '泡沫板',
        category: 'fabric',
        kind: 'texture',
        scale: 2,
        color: '#ffffff'
      }
    }
  ],
  build(registry, item, node, size) {
    const h = Math.min(0.012, Math.max(0.006, size.height));
    createPuzzleRugMesh(registry, item, biscuitRugFurniture, node, size, h);
  }
};

export const curtainFurniture = {
  type: 'curtain',
  name: '窗帘',
  defaultSize: { width: 48, depth: 2, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'fabric', label: '窗帘垂帘', defaultColor: '#ded8cc' },
    { id: 'rod', label: '罗马金属杆', defaultColor: '#3b3a39' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.03;
    cylinderComponent(registry, item, curtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const fabricH = size.height - rodH;

    // 始终生成不可见但作为点击代理和包围盒计算支柱的最大遮光面积盒子
    const proxy = boxComponent(registry, item, curtainFurniture, 'fabric', {
      width: size.width * 0.94, height: fabricH, depth: 0.012
    }, { position: { x: 0, y: fabricH / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001; // 透明，作为碰撞和选中范围支架
      // 两侧窄帘布
      boxComponent(registry, item, curtainFurniture, 'fabric', {
        width: size.width * 0.18, height: fabricH, depth: size.depth * 0.6
      }, { position: { x: -size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });

      boxComponent(registry, item, curtainFurniture, 'fabric', {
        width: size.width * 0.18, height: fabricH, depth: size.depth * 0.6
      }, { position: { x: size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });
    } else {
      proxy.visibility = 1.0; // 满宽可见
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const cushionFurniture = {
  type: 'cushion',
  name: '靠枕',
  defaultSize: { width: 16, depth: 16, height: 6 },
  components: [
    { id: 'fabric', label: '棉麻枕套', defaultColor: '#ffbe73' }
  ],
  build(registry, item, node, size) {
    // 羽绒软枕头
    boxComponent(registry, item, cushionFurniture, 'fabric', {
      width: size.width, height: size.height, depth: size.depth
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });
  }
};

export const singleBlackoutCurtainFurniture = {
  type: 'single_blackout_curtain',
  name: '单开帘',
  defaultSize: { width: 48, depth: 3, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '木质窗轨', defaultColor: '#4b342b' },
    { id: 'fabric', label: '单开帘布', defaultColor: '#59616f' }
  ],
  build(registry, item, node, size) {
    const railH = Math.min(0.055, size.height * 0.035);
    const railDepth = Math.max(0.035, size.depth * 0.72);
    const railWidth = size.width * 1.06;
    boxComponent(registry, item, singleBlackoutCurtainFurniture, 'rod', {
      width: railWidth, height: railH, depth: railDepth
    }, { position: { x: 0, y: size.height - railH / 2, z: 0 } }, { parent: node });
    boxComponent(registry, item, singleBlackoutCurtainFurniture, 'rod', {
      width: size.width, height: railH * 0.22, depth: railDepth * 0.46
    }, { position: { x: 0, y: size.height - railH * 1.12, z: railDepth * 0.22 } }, { parent: node });

    const open = item.isOn !== false;
    const fabricH = size.height - railH * 1.25;
    const visibleWidth = size.width * (open ? 0.62 : 0.96);
    const startX = open ? -size.width * 0.48 : -visibleWidth / 2;
    const pleatCount = Math.max(9, Math.round(visibleWidth / 0.075));
    const pleatStep = visibleWidth / pleatCount;
    const pleatWidth = pleatStep * 1.18;
    const foldDepth = Math.max(0.012, size.depth * 0.2);

    const proxy = boxComponent(registry, item, singleBlackoutCurtainFurniture, 'fabric', {
      width: size.width * 0.96, height: fabricH, depth: 0.004
    }, { position: { x: 0, y: fabricH / 2, z: 0 } }, { parent: node });
    proxy.visibility = 0.001;

    for (let index = 0; index < pleatCount; index += 1) {
      const x = startX + (index + 0.5) * pleatStep;
      const z = foldDepth * (index % 2 === 0 ? 0.52 : -0.52);
      boxComponent(registry, item, singleBlackoutCurtainFurniture, 'fabric', {
        width: pleatWidth, height: fabricH, depth: 0.009
      }, {
        position: { x, y: fabricH / 2, z },
        rotation: { x: 0, y: index % 2 === 0 ? 0.055 : -0.055, z: 0 }
      }, { parent: node });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const doubleSheerCurtainFurniture = {
  type: 'double_sheer_curtain',
  name: '双开帘',
  defaultSize: { width: 48, depth: 2, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '金属吊轨', defaultColor: '#bcaaa4' },
    { id: 'sheer', label: '白色半透纱帘', defaultColor: '#f5f5f5' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.024;
    cylinderComponent(registry, item, doubleSheerCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const fabricH = size.height - rodH;

    const proxy = boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
      width: size.width * 0.92, height: fabricH, depth: 0.008
    }, { position: { x: 0, y: fabricH / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.15, height: fabricH, depth: 0.008
      }, { position: { x: -size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });

      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.15, height: fabricH, depth: 0.008
      }, { position: { x: size.width * 0.38, y: fabricH / 2, z: 0.012 } }, { parent: node });
    } else {
      proxy.visibility = 0.001; // 透明代理
      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.46, height: fabricH, depth: 0.008
      }, { position: { x: -size.width * 0.24, y: fabricH / 2, z: 0.012 } }, { parent: node });

      boxComponent(registry, item, doubleSheerCurtainFurniture, 'sheer', {
        width: size.width * 0.46, height: fabricH, depth: 0.008
      }, { position: { x: size.width * 0.24, y: fabricH / 2, z: 0.012 } }, { parent: node });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const venetianBlindFurniture = {
  type: 'venetian_blind',
  name: '百叶帘',
  defaultSize: { width: 36, depth: 2, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'box', label: '百叶卷盒', defaultColor: '#cfd8dc' },
    { id: 'slats', label: '铝合金叶片', defaultColor: '#eceff1' },
    { id: 'string', label: '控制拉绳', defaultColor: '#78909c' }
  ],
  build(registry, item, node, size) {
    const boxH = size.height * 0.08;
    boxComponent(registry, item, venetianBlindFurniture, 'box', {
      width: size.width, height: boxH, depth: size.depth
    }, { position: { x: 0, y: size.height - boxH / 2, z: 0 } }, { parent: node });

    const open = item.isOn !== false;
    const availH = size.height - boxH;

    // 始终生成一个不可见但起支撑作用的百叶窗帘满尺寸代理盒，锁定 BoundingBox 选中范围
    const proxy = boxComponent(registry, item, venetianBlindFurniture, 'slats', {
      width: size.width, height: availH, depth: size.depth
    }, { position: { x: 0, y: availH / 2, z: 0 } }, { parent: node });
    proxy.visibility = 0.001;

    if (open) {
      for (let i = 0; i < 2; i++) {
        boxComponent(registry, item, venetianBlindFurniture, 'slats', {
          width: size.width * 0.98, height: 0.012, depth: size.depth * 0.8
        }, { position: { x: 0, y: size.height - boxH - i * 0.02, z: 0.005 } }, { parent: node });
      }
    } else {
      for (let i = 0; i < 5; i++) {
        boxComponent(registry, item, venetianBlindFurniture, 'slats', {
          width: size.width * 0.98, height: 0.012, depth: size.depth * 0.8
        }, { position: { x: 0, y: availH - i * (availH / 4) + 0.01, z: 0.005 } }, { parent: node });
      }
    }

    cylinderComponent(registry, item, venetianBlindFurniture, 'string', {
      diameterTop: 0.006, diameterBottom: 0.006, height: size.height * (open ? 0.3 : 0.65)
    }, { position: { x: size.width * 0.44, y: size.height - boxH - (size.height * (open ? 0.3 : 0.65)) / 2, z: size.depth * 0.2 } }, { parent: node });

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const rollerBlindFurniture = {
  type: 'roller_blind',
  name: '卷帘',
  defaultSize: { width: 36, depth: 2, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '顶卷轴', defaultColor: '#37474f' },
    { id: 'shade', label: '卷缩遮阳布', defaultColor: '#b0bec5' }
  ],
  build(registry, item, node, size) {
    const rodD = 0.04;
    cylinderComponent(registry, item, rollerBlindFurniture, 'rod', {
      diameterTop: rodD, diameterBottom: rodD, height: size.width, tessellation: 8
    }, { position: { x: 0, y: size.height - rodD / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, rollerBlindFurniture, 'shade', {
      width: size.width * 0.96, height: size.height - rodD, depth: 0.006
    }, { position: { x: 0, y: (size.height - rodD) / 2, z: 0.01 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      const shadeH = size.height * 0.12;
      boxComponent(registry, item, rollerBlindFurniture, 'shade', {
        width: size.width * 0.96, height: shadeH, depth: 0.006
      }, { position: { x: 0, y: size.height - rodD - shadeH / 2, z: 0.012 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const romanShadeFurniture = {
  type: 'roman_shade',
  name: '罗马帘',
  defaultSize: { width: 36, depth: 2, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'fabric', label: '亚麻折叠帘布', defaultColor: '#d7ccc8' }
  ],
  build(registry, item, node, size) {
    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, romanShadeFurniture, 'fabric', {
      width: size.width, height: size.height, depth: size.depth * 0.3
    }, { position: { x: 0, y: size.height / 2, z: 0 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, romanShadeFurniture, 'fabric', {
        width: size.width, height: size.height * 0.25, depth: size.depth * 0.5
      }, { position: { x: 0, y: size.height - (size.height * 0.25) / 2, z: 0.005 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const verticalBlindFurniture = {
  type: 'vertical_blind',
  name: '竖百叶帘',
  defaultSize: { width: 48, depth: 2, height: 60 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rail', label: '顶部挂轨', defaultColor: '#78909c' },
    { id: 'slats', label: '垂直挂叶', defaultColor: '#ffffff' }
  ],
  build(registry, item, node, size) {
    const railH = size.height * 0.05;
    boxComponent(registry, item, verticalBlindFurniture, 'rail', {
      width: size.width, height: railH, depth: size.depth
    }, { position: { x: 0, y: size.height - railH / 2, z: 0 } }, { parent: node });

    const open = item.isOn !== false;
    const slatW = size.width * 0.14;
    const slatH = size.height - railH;
    const angle = open ? Math.PI * 0.5 : Math.PI * 0.08;

    for (let i = 0; i < 6; i++) {
      const xPos = -size.width * 0.42 + i * (size.width * 0.168);
      const slat = boxComponent(registry, item, verticalBlindFurniture, 'slats', {
        width: slatW, height: slatH, depth: 0.006
      }, { position: { x: xPos, y: slatH / 2, z: 0.01 } }, { parent: node });
      slat.rotation.y = angle;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const chineseBambooBlindFurniture = {
  type: 'chinese_bamboo_blind',
  name: '竹帘',
  defaultSize: { width: 36, depth: 1.5, height: 48 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '竹挂架', defaultColor: '#5d4037' },
    { id: 'bamboo', label: '细竹帘身', defaultColor: '#a1887f' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.035;
    boxComponent(registry, item, chineseBambooBlindFurniture, 'rod', {
      width: size.width * 1.02, height: rodH, depth: size.depth
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });

    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, chineseBambooBlindFurniture, 'bamboo', {
      width: size.width, height: size.height - rodH, depth: size.depth
    }, { position: { x: 0, y: (size.height - rodH) / 2, z: 0 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      cylinderComponent(registry, item, chineseBambooBlindFurniture, 'bamboo', {
        diameterTop: size.depth * 1.2, diameterBottom: size.depth * 1.2, height: size.width
      }, { position: { x: 0, y: size.height - rodH - (size.depth * 1.2) / 2, z: 0.01 } }, { parent: node });
      const rollMesh = node.getChildren().find(child => child.name.includes('bamboo'));
      if (rollMesh) {
        rollMesh.rotation.z = Math.PI * 0.5;
      }
    } else {
      proxy.visibility = 1.0;
      [-1, 1].forEach(dx => {
        boxComponent(registry, item, chineseBambooBlindFurniture, 'rod', {
          width: 0.015, height: size.height - rodH, depth: 0.015
        }, { position: { x: dx * size.width * 0.28, y: (size.height - rodH) / 2, z: 0.008 } }, { parent: node });
      });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const luxuryValanceCurtainFurniture = {
  type: 'luxury_valance_curtain',
  name: '欧式帘',
  defaultSize: { width: 54, depth: 4, height: 80 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'valance', label: '奢华波浪帘头', defaultColor: '#f57f17' },
    { id: 'fabric', label: '绒面垂地帘', defaultColor: '#b71c1c' }
  ],
  build(registry, item, node, size) {
    const topH = size.height * 0.14;
    boxComponent(registry, item, luxuryValanceCurtainFurniture, 'valance', {
      width: size.width * 1.04, height: topH, depth: size.depth
    }, { position: { x: 0, y: size.height - topH / 2, z: size.depth * 0.3 } }, { parent: node });

    const open = item.isOn !== false;
    const curH = size.height - topH;

    // 始终生成一个不可见但起稳定高亮包围盒作用的满幅点击代理盒
    const proxy = boxComponent(registry, item, luxuryValanceCurtainFurniture, 'fabric', {
      width: size.width * 0.96, height: curH, depth: size.depth * 0.6
    }, { position: { x: 0, y: curH / 2, z: size.depth * 0.1 } }, { parent: node });
    proxy.visibility = 0.001;

    const curW = open ? size.width * 0.22 : size.width * 0.46;
    const offsetFactor = open ? 0.38 : 0.24;

    boxComponent(registry, item, luxuryValanceCurtainFurniture, 'fabric', {
      width: curW, height: curH, depth: size.depth * 0.6
    }, { position: { x: -size.width * offsetFactor, y: curH / 2, z: size.depth * 0.1 } }, { parent: node });

    boxComponent(registry, item, luxuryValanceCurtainFurniture, 'fabric', {
      width: curW, height: curH, depth: size.depth * 0.6
    }, { position: { x: size.width * offsetFactor, y: curH / 2, z: size.depth * 0.1 } }, { parent: node });

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const cafeShortCurtainFurniture = {
  type: 'cafe_short_curtain',
  name: '咖啡帘',
  defaultSize: { width: 36, depth: 1.5, height: 24 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '挂杆', defaultColor: '#ffd54f' },
    { id: 'fabric', label: '挂褶半帘布', defaultColor: '#e0f2f1' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.016;
    cylinderComponent(registry, item, cafeShortCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width * 1.02, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const proxy = boxComponent(registry, item, cafeShortCurtainFurniture, 'fabric', {
      width: size.width, height: size.height - rodH, depth: 0.006
    }, { position: { x: 0, y: (size.height - rodH) / 2, z: 0.005 } }, { parent: node });

    if (open) {
      proxy.visibility = 0.001;
      boxComponent(registry, item, cafeShortCurtainFurniture, 'fabric', {
        width: size.width * 0.25, height: size.height - rodH, depth: 0.006
      }, { position: { x: -size.width * 0.35, y: (size.height - rodH) / 2, z: 0.008 } }, { parent: node });
    } else {
      proxy.visibility = 1.0;
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};

export const japaneseNorenCurtainFurniture = {
  type: 'japanese_noren_curtain',
  name: '日式暖帘',
  defaultSize: { width: 32, depth: 1.5, height: 40 },
  placeType: 'wall',
  isSwitchable: true,
  components: [
    { id: 'rod', label: '木挂轴', defaultColor: '#8d6e63' },
    { id: 'fabric', label: '棉麻开叉帘布', defaultColor: '#263238' }
  ],
  build(registry, item, node, size) {
    const rodH = 0.024;
    cylinderComponent(registry, item, japaneseNorenCurtainFurniture, 'rod', {
      diameterTop: rodH, diameterBottom: rodH, height: size.width * 1.04, tessellation: 8
    }, { position: { x: 0, y: size.height - rodH / 2, z: 0 } }, { parent: node });
    const rodMesh = node.getChildren().find(child => child.name.includes('rod'));
    if (rodMesh) {
      rodMesh.rotation.z = Math.PI * 0.5;
    }

    const open = item.isOn !== false;
    const flapH = size.height - rodH;

    const proxy = boxComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
      width: size.width, height: flapH, depth: 0.008
    }, { position: { x: 0, y: flapH / 2, z: 0.004 } }, { parent: node });
    proxy.visibility = 0.001;

    if (open) {
      cylinderComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        diameterTop: 0.04, diameterBottom: 0.04, height: flapH
      }, { position: { x: -size.width * 0.38, y: flapH / 2, z: 0.015 } }, { parent: node });

      cylinderComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        diameterTop: 0.04, diameterBottom: 0.04, height: flapH
      }, { position: { x: size.width * 0.38, y: flapH / 2, z: 0.015 } }, { parent: node });
    } else {
      const flapW = size.width * 0.48;
      boxComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        width: flapW, height: flapH, depth: 0.005
      }, { position: { x: -size.width * 0.25, y: flapH / 2, z: 0.004 } }, { parent: node });

      boxComponent(registry, item, japaneseNorenCurtainFurniture, 'fabric', {
        width: flapW, height: flapH, depth: 0.005
      }, { position: { x: size.width * 0.25, y: flapH / 2, z: 0.004 } }, { parent: node });
    }

    if (item.mirrored) {
      node.scaling.x = -1;
    }
  }
};
