/**
 * 根据屋顶类型及长宽高，计算并返回其 3D 几何体的顶点 (positions) 和索引 (indices)
 * @param {string} subtype 屋顶子类型 ('gable' | 'shed' | 'arch' | 'dome' | 'trapezoid' | 'hip' | 'flat')
 * @param {number} width 宽度
 * @param {number} depth 深度
 * @param {number} height 高度
 * @returns {{positions: number[], topIndices: number[], sideIndices: number[]}}
 */
export function getRoofGeometryData(subtype, width, depth, height, curve = 0) {
  let positions = [];
  let topIndices = [];
  let sideIndices = [];
  let bottomIndices = [];

  if (subtype === 'gable') {
    // 1. 双斜坡 (细分网格，以便根据 curve 产生平滑弯曲)
    const segments = 16;
    const n = 2 * segments + 1;
    
    // 生成前沿顶点 (z = -depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 1) * width / 2;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = t * width / 2;
      const y = (1 - t) * height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    
    // 生成后沿顶点 (z = depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 1) * width / 2;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = t * width / 2;
      const y = (1 - t) * height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    
    // 顶面缝合 (从上往下看 CCW)
    for (let i = 0; i < n - 1; i++) {
      topIndices.push(i, i + 1, i + n);
      topIndices.push(i + 1, i + n + 1, i + n);
    }
    
    // 辅助闭合顶点
    positions.push(0, 0, -depth / 2); // 索引为 2 * n
    positions.push(0, 0, depth / 2);  // 索引为 2 * n + 1
    
    // 侧山墙缝合
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(2 * n, i + 1, i);          // 前山墙 (从前看 CCW)
      sideIndices.push(2 * n + 1, i + n, i + n + 1); // 后山墙 (从后看 CCW)
    }
    
    // 底面缝合
    bottomIndices = [n - 1, 0, n, n - 1, n, 2 * n - 1];
  } else if (subtype === 'shed') {
    // 2. 单斜坡 (细分网格，以便根据 curve 产生平滑弯曲)
    const segments = 16;
    const n = segments + 1;
    
    // 生成前沿顶点 (z = -depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    
    // 生成后沿顶点 (z = depth / 2)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = t * height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    
    // 顶面缝合
    for (let i = 0; i < n - 1; i++) {
      topIndices.push(i, i + 1, i + n);
      topIndices.push(i + 1, i + n + 1, i + n);
    }
    
    // 辅助闭合顶点 (右前底和右后底)
    positions.push(width / 2, 0, -depth / 2); // 索引为 2 * n
    positions.push(width / 2, 0, depth / 2);  // 索引为 2 * n + 1
    
    const A = 2 * n;
    const B = 2 * n + 1;
    
    // 前山墙缝合 (以 A 为中心)
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(A, i + 1, i);
    }
    
    // 后山墙缝合 (以 B 为中心)
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(B, i + n, i + n + 1);
    }
    
    // 右侧面缝合
    sideIndices.push(A, n - 1, 2 * n - 1);
    sideIndices.push(A, 2 * n - 1, B);
    
    // 底面缝合
    bottomIndices = [A, 0, n, A, n, B];
  } else if (subtype === 'arch') {
    // 3. 拱形顶 (基于 16 个分段，叠加 curve 偏置)
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = height * Math.cos(alpha) + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = height * Math.cos(alpha) + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    
    for (let i = 0; i < segments; i++) {
      topIndices.push(i, i + 1, i + 18);
      topIndices.push(i, i + 18, i + 17);
    }
    
    bottomIndices = [16, 0, 17, 16, 17, 33];
    
    positions.push(0, 0, -depth / 2); // 34
    for (let i = 0; i < segments; i++) {
      sideIndices.push(34, i + 1, i);
    }
    positions.push(0, 0, depth / 2); // 35
    for (let i = 0; i < segments; i++) {
      sideIndices.push(35, i + 17, i + 18);
    }
  } else if (subtype === 'dome') {
    // 4. 穹型顶 (半球网格，叠加 curve 偏置)
    const latSegments = 8;
    const lonSegments = 16;
    
    for (let lat = 0; lat <= latSegments; lat++) {
      const theta = (lat / latSegments) * (Math.PI / 2);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const t = lat / latSegments;
      
      for (let lon = 0; lon <= lonSegments; lon++) {
        const phi = (lon / lonSegments) * 2 * Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        const x = (width / 2) * cosTheta * cosPhi;
        const y = height * sinTheta + curve * 4 * t * (1 - t);
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
      bottomIndices.push(centerIndex, lon, lon + 1);
    }
    sideIndices = [];
  } else if (subtype === 'trapezoid') {
    // 5. 梯形顶 (细分网格，以便根据 curve 产生平滑弯曲)
    const layers = 16;
    
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height;
      const w = (width / 2) * (1 - t / 2) + curve * 4 * t * (1 - t);
      const d = (depth / 2) * (1 - t / 2) + curve * 4 * t * (1 - t);
      
      positions.push(-w, y, -d);
      positions.push(w, y, -d);
      positions.push(w, y, d);
      positions.push(-w, y, d);
    }
    
    for (let j = 0; j < layers; j++) {
      const p0 = 4 * j, p1 = p0 + 1, p2 = p0 + 2, p3 = p0 + 3;
      const q0 = p0 + 4, q1 = p0 + 5, q2 = p0 + 6, q3 = p0 + 7;
      
      sideIndices.push(p0, p1, q1, p0, q1, q0);
      sideIndices.push(p1, p2, q2, p1, q2, q1);
      sideIndices.push(p2, p3, q3, p2, q3, q2);
      sideIndices.push(p3, p0, q0, p3, q0, q3);
    }
    
    const topOffset = 4 * layers;
    topIndices.push(topOffset, topOffset + 1, topOffset + 2, topOffset, topOffset + 2, topOffset + 3);
    bottomIndices = [1, 0, 3, 1, 3, 2];
  } else if (subtype === 'hip') {
    // 6. 四角顶 (沿高度细分并加入 curve 偏置)
    const layers = 16;
    
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height + curve * 4 * t * (1 - t);
      
      if (width >= depth) {
        const d = (depth / 2) * (1 - t);
        const xLeft = -width / 2 + t * (depth / 2);
        const xRight = width / 2 - t * (depth / 2);
        positions.push(xLeft, y, -d);
        positions.push(xRight, y, -d);
        positions.push(xRight, y, d);
        positions.push(xLeft, y, d);
      } else {
        const w = (width / 2) * (1 - t);
        const zFront = -depth / 2 + t * (width / 2);
        const zBack = depth / 2 - t * (width / 2);
        positions.push(-w, y, zFront);
        positions.push(w, y, zFront);
        positions.push(w, y, zBack);
        positions.push(-w, y, zBack);
      }
    }
    
    for (let j = 0; j < layers; j++) {
      const p0 = 4 * j, p1 = p0 + 1, p2 = p0 + 2, p3 = p0 + 3;
      const q0 = p0 + 4, q1 = p0 + 5, q2 = p0 + 6, q3 = p0 + 7;
      
      topIndices.push(p0, p1, q1, p0, q1, q0);
      topIndices.push(p1, p2, q2, p1, q2, q1);
      topIndices.push(p2, p3, q3, p2, q3, q2);
      topIndices.push(p3, p0, q0, p3, q0, q3);
    }
    
    bottomIndices = [1, 0, 3, 1, 3, 2];
    sideIndices = [];
  } else if (subtype === 'flat') {
    // 7. 平屋顶 (通过网格细分在顶部产生 X 轴方向的弯曲)
    const segments = 16;
    const n = segments + 1;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = height + curve * 4 * t * (1 - t);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const y = height + curve * 4 * t * (1 - t);
      positions.push(x, y, depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      positions.push(x, 0, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      positions.push(x, 0, depth / 2);
    }
    
    for (let i = 0; i < n - 1; i++) {
      topIndices.push(i, i + 1, i + n);
      topIndices.push(i + 1, i + n + 1, i + n);
    }
    
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(i, i + 2 * n + 1, i + 1);
      sideIndices.push(i, i + 2 * n, i + 2 * n + 1);
    }
    for (let i = 0; i < n - 1; i++) {
      sideIndices.push(i + n, i + 1 + n, i + 3 * n + 1);
      sideIndices.push(i + n, i + 3 * n + 1, i + 3 * n);
    }
    sideIndices.push(0, n, 3 * n);
    sideIndices.push(0, 3 * n, 2 * n);
    sideIndices.push(n - 1, 3 * n - 1, 4 * n - 1);
    sideIndices.push(n - 1, 4 * n - 1, 2 * n - 1);
    
    for (let i = 0; i < n - 1; i++) {
      bottomIndices.push(i + 2 * n + 1, i + 2 * n, i + 3 * n);
      bottomIndices.push(i + 2 * n + 1, i + 3 * n, i + 3 * n + 1);
    }
  }

  return { positions, topIndices, sideIndices, bottomIndices };
}
