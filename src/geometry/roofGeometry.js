/**
 * 根据屋顶类型及长宽高，计算并返回其 3D 几何体的顶点 (positions) 和索引 (indices)
 * @param {string} subtype 屋顶子类型 ('gable' | 'shed' | 'arch' | 'dome' | 'trapezoid' | 'hip' | 'flat')
 * @param {number} width 宽度
 * @param {number} depth 深度
 * @param {number} height 高度
 * @returns {{positions: number[], topIndices: number[], sideIndices: number[]}}
 */
export function getRoofGeometryData(subtype, width, depth, height, curve = 0, options = {}) {
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
    // 3. 拱形顶 (基于有效拱高 effectiveHeight = max(0.05, height + curve) 的标准半圆/半椭圆弧)
    const effectiveHeight = Math.max(0.05, height + curve);
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = effectiveHeight * Math.cos(alpha);
      positions.push(x, y, -depth / 2);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = (width / 2) * Math.sin(alpha);
      const y = effectiveHeight * Math.cos(alpha);
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
    // 5. 梯形顶 (细分网格，根据 topWidth / topDepth 与 curve 产生平滑弯曲)
    const tw = (options.topWidth !== undefined ? Math.min(width - 0.1, Math.max(0.1, options.topWidth)) : width * 0.5) / 2;
    const td = (options.topDepth !== undefined ? Math.min(depth - 0.1, Math.max(0.1, options.topDepth)) : depth * 0.5) / 2;
    const layers = 16;
    
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height;
      const w = (width / 2) * (1 - t) + tw * t + curve * 4 * t * (1 - t);
      const d = (depth / 2) * (1 - t) + td * t + curve * 4 * t * (1 - t);
      
      positions.push(-w, y, -d);
      positions.push(w, y, -d);
      positions.push(w, y, d);
      positions.push(-w, y, d);
    }
    
    for (let j = 0; j < layers; j++) {
      const p0 = 4 * j, p1 = p0 + 1, p2 = p0 + 2, p3 = p0 + 3;
      const q0 = p0 + 4, q1 = p0 + 5, q2 = p0 + 6, q3 = p0 + 7;
      
      topIndices.push(p0, p1, q1, p0, q1, q0);
      topIndices.push(p1, p2, q2, p1, q2, q1);
      topIndices.push(p2, p3, q3, p2, q3, q2);
      topIndices.push(p3, p0, q0, p3, q0, q3);
    }
    
    const topOffset = 4 * layers;
    sideIndices.push(topOffset, topOffset + 1, topOffset + 2, topOffset, topOffset + 2, topOffset + 3);
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

/**
 * 根据屋顶类型及长宽高，按 targetGridSize (默认 1.0m) 自动划分并计算屋顶骨架线条路径数组 (Polyline paths)
 * @param {string} subtype 屋顶子类型 ('gable' | 'shed' | 'arch' | 'dome' | 'trapezoid' | 'hip' | 'flat')
 * @param {number} width 宽度
 * @param {number} depth 深度
 * @param {number} height 高度
 * @param {number} [curve=0] 弯曲偏置
 * @param {number} [targetGridSize=1.0] 目标网格粒度（单位：米）
 * @returns {Array<Array<{x: number, y: number, z: number}>>} 骨架线条路径数组
 */
export function getRoofFramePaths(subtype, width, depth, height, curve = 0, targetGridSize = 1.0, includeSide = true, options = {}) {
  const step = Math.max(0.2, targetGridSize);
  const paths = [];

  if (subtype === 'arch') {
    // 1. 拱形顶 (Arch): 有效拱高 effectiveHeight 防溢出标准弧型
    const effectiveHeight = Math.max(0.05, height + curve);
    const rx = width / 2;
    const arcLen = Math.PI * Math.sqrt((rx * rx + effectiveHeight * effectiveHeight) / 2);
    const arcSegments = Math.max(2, Math.round(arcLen / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    // A. 沿着 Z 轴分布的弧线主肋梁 (Ribs)
    for (let j = 0; j <= depthSegments; j++) {
      const tz = j / depthSegments;
      const z = -depth / 2 + tz * depth;
      const ribPath = [];
      for (let i = 0; i <= arcSegments * 2; i++) {
        const t = i / (arcSegments * 2);
        const alpha = -Math.PI / 2 + t * Math.PI;
        const x = rx * Math.sin(alpha);
        const y = effectiveHeight * Math.cos(alpha);
        ribPath.push({ x, y, z });
      }
      paths.push(ribPath);
    }

    // B. 沿着弧线分布的纵向连梁 (Purlins)
    for (let i = 0; i <= arcSegments; i++) {
      const t = i / arcSegments;
      const alpha = -Math.PI / 2 + t * Math.PI;
      const x = rx * Math.sin(alpha);
      const y = effectiveHeight * Math.cos(alpha);
      paths.push([
        { x, y, z: -depth / 2 },
        { x, y, z: depth / 2 }
      ]);
    }

    // C. 侧山墙骨架 (1m 步长多层同心内拱 + 100% 几何共线的太阳光芒射线梁)
    if (includeSide) {
      const zPositions = [-depth / 2, depth / 2];
      const minRadius = Math.min(rx, effectiveHeight);
      const numInnerRings = Math.max(2, Math.round(minRadius / step));
      const ratios = [];
      for (let r = 1; r < numInnerRings; r++) {
        ratios.push(r / numInnerRings);
      }

      // 太阳光芒辐射角度 ( -60°, -30°, 0°, 30°, 60° )
      const spokeAngles = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];

      zPositions.forEach((z) => {
        // 1. 山墙底梁
        paths.push([
          { x: -rx, y: 0, z },
          { x: rx, y: 0, z }
        ]);

        // 2. 1m 步长多层同心半圆拱框
        const innerSegments = 16;
        ratios.forEach((ratio) => {
          const archPath = [];
          for (let i = 0; i <= innerSegments; i++) {
            const tInner = i / innerSegments;
            const theta = -Math.PI / 2 + tInner * Math.PI;
            const xi = rx * ratio * Math.sin(theta);
            const yi = effectiveHeight * ratio * Math.cos(theta);
            archPath.push({ x: xi, y: yi, z });
          }
          paths.push(archPath);
        });

        // 3. 太阳光芒辐射连梁 (Sunburst Spokes)：仅在内同心拱与外主拱之间延伸 (最内圈留空采光/通畅)
        const ringRatios = [...ratios, 1];
        spokeAngles.forEach((alpha) => {
          const outerX = rx * Math.sin(alpha);
          const outerY = effectiveHeight * Math.cos(alpha);

          for (let r = 0; r < ringRatios.length - 1; r++) {
            const rCurrent = ringRatios[r];
            const rNext = ringRatios[r + 1];

            const x1 = outerX * rCurrent;
            const y1 = outerY * rCurrent;
            const x2 = outerX * rNext;
            const y2 = outerY * rNext;

            paths.push([
              { x: x1, y: y1, z },
              { x: x2, y: y2, z }
            ]);
          }
        });
      });
    }
  } else if (subtype === 'dome') {
    // 2. 穹顶 (Dome): 经线辐射梁 + 纬线同心圆环梁 (包含 lat = 0 底边封口圈梁)
    const rx = width / 2;
    const rz = depth / 2;
    const approxEquator = Math.PI * (rx + rz);
    const lonSegments = Math.max(4, Math.round(approxEquator / step));
    const approxMeridian = (Math.PI / 2) * Math.sqrt((((rx + rz) / 2) ** 2 + height ** 2) / 2);
    const latSegments = Math.max(2, Math.round(approxMeridian / step));

    // A. 纬线圈环 (Latitudes，包含 lat = 0 底边封口)
    for (let lat = 0; lat <= latSegments; lat++) {
      const tLat = lat / latSegments;
      const theta = tLat * (Math.PI / 2);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const y = height * sinTheta + curve * 4 * tLat * (1 - tLat);

      const ringPath = [];
      const numPoints = lonSegments * 2;
      for (let i = 0; i <= numPoints; i++) {
        const phi = (i / numPoints) * 2 * Math.PI;
        const x = rx * cosTheta * Math.cos(phi);
        const z = rz * cosTheta * Math.sin(phi);
        ringPath.push({ x, y, z });
      }
      paths.push(ringPath);
    }

    // B. 经线弧梁 (Longitudes)
    for (let lon = 0; lon < lonSegments; lon++) {
      const phi = (lon / lonSegments) * 2 * Math.PI;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const meridianPath = [];
      const numPts = latSegments * 2;
      for (let lat = 0; lat <= numPts; lat++) {
        const tLat = lat / numPts;
        const theta = tLat * (Math.PI / 2);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const x = rx * cosTheta * cosPhi;
        const y = height * sinTheta + curve * 4 * tLat * (1 - tLat);
        const z = rz * cosTheta * sinPhi;
        meridianPath.push({ x, y, z });
      }
      paths.push(meridianPath);
    }
  } else if (subtype === 'gable') {
    // 3. 双斜顶 (Gable): 椽梁、檩条与山墙梁完全遵循 curve 弧度弯曲
    const slopeLen = Math.sqrt((width / 2) ** 2 + height ** 2);
    const slopeSegments = Math.max(1, Math.round(slopeLen / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    // A. 椽梁 (Rafters)
    for (let j = 0; j <= depthSegments; j++) {
      const z = -depth / 2 + (j / depthSegments) * depth;
      const rafterPath = [];
      for (let i = 0; i <= slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = (t - 1) * (width / 2);
        const y = t * height + curve * 4 * t * (1 - t);
        rafterPath.push({ x, y, z });
      }
      for (let i = 1; i <= slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = t * (width / 2);
        const y = (1 - t) * height + curve * 4 * t * (1 - t);
        rafterPath.push({ x, y, z });
      }
      paths.push(rafterPath);
    }

    // B. 檩条 (Purlins)
    for (let i = 0; i <= slopeSegments; i++) {
      const t = i / slopeSegments;
      const xLeft = (t - 1) * (width / 2);
      const yLeft = t * height + curve * 4 * t * (1 - t);
      paths.push([
        { x: xLeft, y: yLeft, z: -depth / 2 },
        { x: xLeft, y: yLeft, z: depth / 2 }
      ]);
      if (i > 0) {
        const xRight = t * (width / 2);
        const yRight = (1 - t) * height + curve * 4 * t * (1 - t);
        paths.push([
          { x: xRight, y: yRight, z: -depth / 2 },
          { x: xRight, y: yRight, z: depth / 2 }
        ]);
      }
    }

    // C. 侧面山墙骨架 (跟从 sideHidden 联动)
    if (includeSide) {
      // 1. 山墙底梁
      paths.push([
        { x: -width / 2, y: 0, z: -depth / 2 },
        { x: width / 2, y: 0, z: -depth / 2 }
      ]);
      paths.push([
        { x: -width / 2, y: 0, z: depth / 2 },
        { x: width / 2, y: 0, z: depth / 2 }
      ]);
      // 2. 1m 步长山墙竖向立柱 (顶点同样带 curve)
      const xSegs = Math.max(1, Math.round(width / step));
      for (let i = 1; i < xSegs; i++) {
        const tx = i / xSegs;
        const x = -width / 2 + tx * width;
        let y = 0;
        if (x <= 0) {
          const t = 1 + x / (width / 2);
          y = t * height + curve * 4 * t * (1 - t);
        } else {
          const t = x / (width / 2);
          y = (1 - t) * height + curve * 4 * t * (1 - t);
        }
        paths.push([{ x, y: 0, z: -depth / 2 }, { x, y, z: -depth / 2 }]);
        paths.push([{ x, y: 0, z: depth / 2 }, { x, y, z: depth / 2 }]);
      }
    }
  } else if (subtype === 'shed') {
    // 4. 单斜顶 (Shed)
    const slopeLen = Math.sqrt(width ** 2 + height ** 2);
    const slopeSegments = Math.max(1, Math.round(slopeLen / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    // A. 斜面椽梁与檩条
    for (let j = 0; j <= depthSegments; j++) {
      const z = -depth / 2 + (j / depthSegments) * depth;
      const rafterPath = [];
      for (let i = 0; i <= slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = -width / 2 + t * width;
        const y = t * height + curve * 4 * t * (1 - t);
        rafterPath.push({ x, y, z });
      }
      paths.push(rafterPath);
    }

    for (let i = 0; i <= slopeSegments; i++) {
      const t = i / slopeSegments;
      const x = -width / 2 + t * width;
      const y = t * height + curve * 4 * t * (1 - t);
      paths.push([
        { x, y, z: -depth / 2 },
        { x, y, z: depth / 2 }
      ]);
    }

    // 高侧与低侧屋顶顶梁/底梁边框线 (始终绘制)
    paths.push([
      { x: -width / 2, y: 0, z: -depth / 2 },
      { x: -width / 2, y: 0, z: depth / 2 }
    ]);
    paths.push([
      { x: width / 2, y: height, z: -depth / 2 },
      { x: width / 2, y: height, z: depth / 2 }
    ]);

    // B. 侧面山墙及高侧/低侧方形墙面骨架
    if (includeSide) {
      // 1. 高侧底梁 (x = width / 2, y = 0)
      paths.push([
        { x: width / 2, y: 0, z: -depth / 2 },
        { x: width / 2, y: 0, z: depth / 2 }
      ]);
      // 2. 高侧方形墙面 1m 步长竖向立柱
      for (let j = 0; j <= depthSegments; j++) {
        const z = -depth / 2 + (j / depthSegments) * depth;
        paths.push([
          { x: width / 2, y: 0, z },
          { x: width / 2, y: height, z }
        ]);
      }
      // 4. 前后山墙底梁与立柱
      paths.push([
        { x: -width / 2, y: 0, z: -depth / 2 },
        { x: width / 2, y: 0, z: -depth / 2 }
      ]);
      paths.push([
        { x: -width / 2, y: 0, z: depth / 2 },
        { x: width / 2, y: 0, z: depth / 2 }
      ]);

      for (let i = 1; i < slopeSegments; i++) {
        const t = i / slopeSegments;
        const x = -width / 2 + t * width;
        const y = t * height + curve * 4 * t * (1 - t);
        paths.push([{ x, y: 0, z: -depth / 2 }, { x, y, z: -depth / 2 }]);
        paths.push([{ x, y: 0, z: depth / 2 }, { x, y, z: depth / 2 }]);
      }
    }
  } else if (subtype === 'trapezoid') {
    // 5. 梯形顶 (Trapezoid): 平行椽梁与同心梁，包含 curve 弧度曲线弯曲对齐
    const tw = (options.topWidth !== undefined ? Math.min(width - 0.1, Math.max(0.1, options.topWidth)) : width * 0.5) / 2;
    const td = (options.topDepth !== undefined ? Math.min(depth - 0.1, Math.max(0.1, options.topDepth)) : depth * 0.5) / 2;

    const layers = Math.max(4, Math.round(height / step) * 2);
    const cornerPaths = [[], [], [], []];

    // A. 每一层收缩的同心矩形梁 (包含 curve 弧度对齐)
    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height + curve * 4 * t * (1 - t);
      const w = (width / 2) * (1 - t) + tw * t;
      const d = (depth / 2) * (1 - t) + td * t;

      const p0 = { x: -w, y, z: -d };
      const p1 = { x: w, y, z: -d };
      const p2 = { x: w, y, z: d };
      const p3 = { x: -w, y, z: d };

      // 仅按 step 层步长添加水平同心梁
      if (j % Math.max(1, Math.round(layers / Math.max(1, Math.round(height / step)))) === 0 || j === layers) {
        paths.push([p0, p1, p2, p3, p0]);
      }

      cornerPaths[0].push(p0);
      cornerPaths[1].push(p1);
      cornerPaths[2].push(p2);
      cornerPaths[3].push(p3);
    }

    // B. 四角斜脊梁
    cornerPaths.forEach((cornerPath) => paths.push(cornerPath));

    // C. 前坡与后坡平行椽梁 (沿 X 轴 1m 步长)
    const xSegs = Math.max(1, Math.round(width / step));
    for (let i = 1; i < xSegs; i++) {
      const xVal = -width / 2 + (i / xSegs) * width;
      const frontRafter = [];
      const backRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const w = (width / 2) * (1 - t) + tw * t;
        const d = (depth / 2) * (1 - t) + td * t;
        const y = t * height + curve * 4 * t * (1 - t);
        if (Math.abs(xVal) <= w + 1e-4) {
          frontRafter.push({ x: xVal, y, z: -d });
          backRafter.push({ x: xVal, y, z: d });
        }
      }
      if (frontRafter.length >= 2) paths.push(frontRafter);
      if (backRafter.length >= 2) paths.push(backRafter);
    }

    // D. 左坡与右坡平行椽梁 (沿 Z 轴 1m 步长)
    const zSegs = Math.max(1, Math.round(depth / step));
    for (let k = 1; k < zSegs; k++) {
      const zVal = -depth / 2 + (k / zSegs) * depth;
      const leftRafter = [];
      const rightRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const w = (width / 2) * (1 - t) + tw * t;
        const d = (depth / 2) * (1 - t) + td * t;
        const y = t * height + curve * 4 * t * (1 - t);
        if (Math.abs(zVal) <= d + 1e-4) {
          leftRafter.push({ x: -w, y, z: zVal });
          rightRafter.push({ x: w, y, z: zVal });
        }
      }
      if (leftRafter.length >= 2) paths.push(leftRafter);
      if (rightRafter.length >= 2) paths.push(rightRafter);
    }

    // E. 顶平面网格
    const topXSegs = Math.max(1, Math.round((tw * 2) / step));
    const topDSegs = Math.max(1, Math.round((td * 2) / step));
    const topY = height;

    for (let i = 1; i < topXSegs; i++) {
      const tx = i / topXSegs;
      const x = -tw + tx * tw * 2;
      paths.push([
        { x, y: topY, z: -td },
        { x, y: topY, z: td }
      ]);
    }
    for (let j = 1; j < topDSegs; j++) {
      const tz = j / topDSegs;
      const z = -td + tz * td * 2;
      paths.push([
        { x: -tw, y: topY, z },
        { x: tw, y: topY, z }
      ]);
    }
  } else if (subtype === 'hip') {
    // 6. 四角顶 (Hip): 平行椽梁与同心梁，包含 curve 弧度曲线弯曲对齐
    const layers = Math.max(4, Math.round(height / step) * 2);
    const cornerPaths = [[], [], [], []];

    for (let j = 0; j <= layers; j++) {
      const t = j / layers;
      const y = t * height + curve * 4 * t * (1 - t);

      let p0, p1, p2, p3;
      if (width >= depth) {
        const d = (depth / 2) * (1 - t);
        const xLeft = -width / 2 + t * (depth / 2);
        const xRight = width / 2 - t * (depth / 2);
        p0 = { x: xLeft, y, z: -d };
        p1 = { x: xRight, y, z: -d };
        p2 = { x: xRight, y, z: d };
        p3 = { x: xLeft, y, z: d };
      } else {
        const w = (width / 2) * (1 - t);
        const zFront = -depth / 2 + t * (width / 2);
        const zBack = depth / 2 - t * (width / 2);
        p0 = { x: -w, y, z: zFront };
        p1 = { x: w, y, z: zFront };
        p2 = { x: w, y, z: zBack };
        p3 = { x: -w, y, z: zBack };
      }

      if (j % Math.max(1, Math.round(layers / Math.max(1, Math.round(height / step)))) === 0 || j === layers) {
        paths.push([p0, p1, p2, p3, p0]);
      }

      cornerPaths[0].push(p0);
      cornerPaths[1].push(p1);
      cornerPaths[2].push(p2);
      cornerPaths[3].push(p3);
    }

    // 四角斜脊梁
    cornerPaths.forEach((cornerPath) => paths.push(cornerPath));

    // 前后坡平行椽梁 (沿 X 轴 1m 步长)
    const xSegs = Math.max(1, Math.round(width / step));
    for (let i = 1; i < xSegs; i++) {
      const xVal = -width / 2 + (i / xSegs) * width;
      const frontRafter = [];
      const backRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const y = t * height + curve * 4 * t * (1 - t);
        if (width >= depth) {
          const d = (depth / 2) * (1 - t);
          const xLeft = -width / 2 + t * (depth / 2);
          const xRight = width / 2 - t * (depth / 2);
          if (xVal >= xLeft - 1e-4 && xVal <= xRight + 1e-4) {
            frontRafter.push({ x: xVal, y, z: -d });
            backRafter.push({ x: xVal, y, z: d });
          }
        } else {
          const w = (width / 2) * (1 - t);
          const zFront = -depth / 2 + t * (width / 2);
          const zBack = depth / 2 - t * (width / 2);
          if (Math.abs(xVal) <= w + 1e-4) {
            frontRafter.push({ x: xVal, y, z: zFront });
            backRafter.push({ x: xVal, y, z: zBack });
          }
        }
      }
      if (frontRafter.length >= 2) paths.push(frontRafter);
      if (backRafter.length >= 2) paths.push(backRafter);
    }

    // 左右坡平行椽梁 (沿 Z 轴 1m 步长)
    const zSegs = Math.max(1, Math.round(depth / step));
    for (let k = 1; k < zSegs; k++) {
      const zVal = -depth / 2 + (k / zSegs) * depth;
      const leftRafter = [];
      const rightRafter = [];
      for (let j = 0; j <= layers; j++) {
        const t = j / layers;
        const y = t * height + curve * 4 * t * (1 - t);
        if (width >= depth) {
          const d = (depth / 2) * (1 - t);
          const xLeft = -width / 2 + t * (depth / 2);
          const xRight = width / 2 - t * (depth / 2);
          if (Math.abs(zVal) <= d + 1e-4) {
            leftRafter.push({ x: xLeft, y, z: zVal });
            rightRafter.push({ x: xRight, y, z: zVal });
          }
        } else {
          const w = (width / 2) * (1 - t);
          const zFront = -depth / 2 + t * (width / 2);
          const zBack = depth / 2 - t * (width / 2);
          if (zVal >= zFront - 1e-4 && zVal <= zBack + 1e-4) {
            leftRafter.push({ x: -w, y, z: zVal });
            rightRafter.push({ x: w, y, z: zVal });
          }
        }
      }
      if (leftRafter.length >= 2) paths.push(leftRafter);
      if (rightRafter.length >= 2) paths.push(rightRafter);
    }
  } else {
    // 7. 平顶 (Flat)
    const xSegments = Math.max(1, Math.round(width / step));
    const depthSegments = Math.max(1, Math.round(depth / step));

    for (let i = 0; i <= xSegments; i++) {
      const t = i / xSegments;
      const x = -width / 2 + t * width;
      const y = height + curve * 4 * t * (1 - t);
      paths.push([
        { x, y, z: -depth / 2 },
        { x, y, z: depth / 2 }
      ]);
    }
    for (let j = 0; j <= depthSegments; j++) {
      const tz = j / depthSegments;
      const z = -depth / 2 + tz * depth;
      const pathLine = [];
      for (let i = 0; i <= xSegments; i++) {
        const t = i / xSegments;
        const x = -width / 2 + t * width;
        const y = height + curve * 4 * t * (1 - t);
        pathLine.push({ x, y, z });
      }
      paths.push(pathLine);
    }
  }

  return paths;
}

