/**
 * 根据屋顶类型及长宽高，计算并返回其 3D 几何体的顶点 (positions) 和索引 (indices)
 * @param {string} subtype 屋顶子类型 ('gable' | 'shed' | 'arch' | 'dome' | 'trapezoid' | 'hip' | 'flat')
 * @param {number} width 宽度
 * @param {number} depth 深度
 * @param {number} height 高度
 * @returns {{positions: number[], topIndices: number[], sideIndices: number[]}}
 */
export function getRoofGeometryData(subtype, width, depth, height) {
  let positions = [];
  let topIndices = [];
  let sideIndices = [];
  let bottomIndices = [];

  if (subtype === 'gable') {
    // 1. 双斜坡
    positions = [
      -width / 2, 0, -depth / 2,
      width / 2, 0, -depth / 2,
      0, height, -depth / 2,
      -width / 2, 0, depth / 2,
      width / 2, 0, depth / 2,
      0, height, depth / 2
    ];
    topIndices = [
      1, 4, 5, 1, 5, 2, // 右斜坡 (从右侧斜上方看 CCW)
      3, 0, 2, 3, 2, 5  // 左斜坡 (从左侧斜上方看 CCW)
    ];
    sideIndices = [
      0, 1, 2,          // 前山墙 (从前看 CCW)
      4, 3, 5           // 后山墙 (从后看 CCW)
    ];
    bottomIndices = [
      1, 0, 3, 1, 3, 4  // 底面 (从下看 CCW)
    ];
  } else if (subtype === 'shed') {
    // 2. 单斜坡 (左侧高 0，右侧高 height)
    positions = [
      -width / 2, 0, -depth / 2,       // 0: 左前底
      width / 2, 0, -depth / 2,        // 1: 右前底
      width / 2, height, -depth / 2,   // 2: 右前顶
      -width / 2, 0, depth / 2,        // 3: 左后底
      width / 2, 0, depth / 2,         // 4: 右后底
      width / 2, height, depth / 2     // 5: 右后顶
    ];
    topIndices = [
      3, 0, 2, 3, 2, 5  // 斜面 (从左斜上方看 CCW)
    ];
    sideIndices = [
      0, 1, 2,          // 前面 (从前看 CCW)
      4, 3, 5,          // 后面 (从后看 CCW)
      1, 2, 5, 1, 5, 4  // 右面 (从右看 CCW)
    ];
    bottomIndices = [
      1, 0, 3, 1, 3, 4  // 底面 (从下看 CCW)
    ];
  } else if (subtype === 'arch') {
    // 3. 拱形顶 (基于 16 个分段，截面在 X 轴上是半圆弧)
    const segments = 16;
    // 生成前圆弧顶点 (z = -depth/2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = height * Math.cos(alpha);
      positions.push(x, y, -depth / 2);
    }
    // 生成后圆弧顶点 (z = depth/2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = height * Math.cos(alpha);
      positions.push(x, y, depth / 2);
    }
    
    // 缝合圆弧顶部的多边形面 (从上往下看 CCW)
    for (let i = 0; i < segments; i++) {
      topIndices.push(i, i + 1, i + 18);
      topIndices.push(i, i + 18, i + 17);
    }
    
    // 封闭底面 (从下往上看 CCW)
    bottomIndices = [16, 0, 17, 16, 17, 33];
    
    // 封闭端面
    positions.push(0, 0, -depth / 2); // 34
    for (let i = 0; i < segments; i++) {
      sideIndices.push(34, i + 1, i); // 前端面 (从前看 CCW)
    }
    positions.push(0, 0, depth / 2); // 35
    for (let i = 0; i < segments; i++) {
      sideIndices.push(35, i + 17, i + 18); // 后端面 (从后看 CCW)
    }
  } else if (subtype === 'dome') {
    // 4. 穹型顶 (半球网格，8 纬度段，16 经度段)
    const latSegments = 8;
    const lonSegments = 16;
    
    for (let lat = 0; lat <= latSegments; lat++) {
      const theta = (lat / latSegments) * (Math.PI / 2);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let lon = 0; lon <= lonSegments; lon++) {
        const phi = (lon / lonSegments) * 2 * Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        const x = (width / 2) * cosTheta * cosPhi;
        const y = height * sinTheta;
        const z = (depth / 2) * cosTheta * sinPhi;
        positions.push(x, y, z);
      }
    }
    
    const stride = lonSegments + 1;
    for (let lat = 0; lat < latSegments; lat++) {
      for (let lon = 0; lon < lonSegments; lon++) {
        const first = lat * stride + lon;
        const second = first + stride;
        
        topIndices.push(first, first + 1, second + 1);
        topIndices.push(first, second + 1, second);
      }
    }
    
    const centerIndex = positions.length / 3;
    positions.push(0, 0, 0);
    
    for (let lon = 0; lon < lonSegments; lon++) {
      bottomIndices.push(centerIndex, lon, lon + 1); // 底面 (从下看 CCW)
    }
    sideIndices = [];
  } else if (subtype === 'trapezoid') {
    // 5. 梯形顶 (四棱台)
    positions = [
      -width / 2, 0, -depth / 2,
      width / 2, 0, -depth / 2,
      width / 2, 0, depth / 2,
      -width / 2, 0, depth / 2,
      -width / 4, height, -depth / 4,
      width / 4, height, -depth / 4,
      width / 4, height, depth / 4,
      -width / 4, height, depth / 4
    ];
    topIndices = [
      4, 5, 6, 4, 6, 7   // 顶面 (从上看 CCW)
    ];
    sideIndices = [
      0, 1, 5, 0, 5, 4,   // 前面 (从前看 CCW)
      1, 2, 6, 1, 6, 5,   // 右面 (从右看 CCW)
      2, 3, 7, 2, 7, 6,   // 后面 (从后看 CCW)
      3, 0, 4, 3, 4, 7    // 左面 (从左看 CCW)
    ];
    bottomIndices = [
      1, 0, 3, 1, 3, 2   // 底面 (从下看 CCW)
    ];
  } else if (subtype === 'hip') {
    // 6. 四角顶 (脊线沿长边分布)
    positions = [
      -width / 2, 0, -depth / 2,
      width / 2, 0, -depth / 2,
      width / 2, 0, depth / 2,
      -width / 2, 0, depth / 2
    ];
    
    if (width >= depth) {
      const rw = (width - depth) / 2;
      positions.push(-rw, height, 0);
      positions.push(rw, height, 0);
      topIndices = [
        0, 1, 5, 0, 5, 4,   // 前斜面 (从前看 CCW)
        2, 3, 4, 2, 4, 5,   // 后斜面 (从后看 CCW)
        3, 0, 4,            // 左斜面 (从左看 CCW)
        1, 2, 5             // 右斜面 (从右看 CCW)
      ];
      bottomIndices = [
        1, 0, 3, 1, 3, 2    // 底面 (从下看 CCW)
      ];
      sideIndices = [];
    } else {
      const rh = (depth - width) / 2;
      positions.push(0, height, -rh);
      positions.push(0, height, rh);
      topIndices = [
        0, 1, 4,            // 前斜面 (从前看 CCW)
        2, 3, 5,            // 后斜面 (从后看 CCW)
        3, 0, 4, 3, 4, 5,   // 左斜面 (从左看 CCW)
        1, 2, 5, 1, 5, 4    // 右斜面 (从右看 CCW)
      ];
      bottomIndices = [
        1, 0, 3, 1, 3, 2    // 底面 (从下看 CCW)
      ];
      sideIndices = [];
    }
  } else if (subtype === 'flat') {
    // 7. 平屋顶 (扁长方体)
    positions = [
      -width / 2, 0, -depth / 2,
      width / 2, 0, -depth / 2,
      width / 2, 0, depth / 2,
      -width / 2, 0, depth / 2,
      -width / 2, height, -depth / 2,
      width / 2, height, -depth / 2,
      width / 2, height, depth / 2,
      -width / 2, height, depth / 2
    ];
    topIndices = [
      4, 5, 6, 4, 6, 7  // 顶面 (从上看 CCW)
    ];
    sideIndices = [
      0, 1, 5, 0, 5, 4,  // 前面 (从前看 CCW)
      1, 2, 6, 1, 6, 5,  // 右面 (从右看 CCW)
      2, 3, 7, 2, 7, 6,  // 后面 (从后看 CCW)
      3, 0, 4, 3, 4, 7   // 左面 (从左看 CCW)
    ];
    bottomIndices = [
      1, 0, 3, 1, 3, 2   // 底面 (从下看 CCW)
    ];
  }

  return { positions, topIndices, sideIndices, bottomIndices };
}
