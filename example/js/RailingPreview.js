import { buildFenceGeometry, Color3, MeshBuilder, StandardMaterial, TransformNode, Topology } from '../../src/index.js';
const BABYLON = { Color3, MeshBuilder, StandardMaterial, TransformNode };
import { createSvgElement, worldToSvg } from './Render2D.js';

let Context = null;

export function initRailingPreview(appState) {
  Context = appState;
}

export function getFreeFloorEdges() {
  return Topology.getFreeFloorEdges(Context.currentRooms(), Context.currentWalls());
}

export function clear2DFloorEdgeRailingPreview() {
  if (Context.floorEdgeRailingPreview2DGroup) {
    Context.floorEdgeRailingPreview2DGroup.innerHTML = '';
    Context.floorEdgeRailingPreview2DGroup.remove();
    Context.floorEdgeRailingPreview2DGroup = null;
  }
}

export function clear3DFloorEdgeRailingPreview() {
  if (Context.floorEdgeRailingPreview3DGroup) {
    Context.floorEdgeRailingPreview3DGroup.dispose(false, true);
    Context.floorEdgeRailingPreview3DGroup = null;
  }
  Context.currentPreviewFloorEdgeIndex = null;
}

export function update2DFloorEdgeRailingPreview(fromX, fromZ, toX, toZ, index) {
  clear2DFloorEdgeRailingPreview();
  Context.floorEdgeRailingPreview2DGroup = createSvgElement('g', { id: 'floor-edge-railing-preview-group' });
  
  const a = worldToSvg(fromX, fromZ);
  const b = worldToSvg(toX, toZ);
  const line = createSvgElement('line', {
    x1: a.x, y1: a.y,
    x2: b.x, y2: b.y,
    stroke: 'rgba(141, 110, 99, 0.65)',
    'stroke-width': 3,
    'stroke-dasharray': '5,5'
  });
  Context.floorEdgeRailingPreview2DGroup.appendChild(line);
  Context.svg.appendChild(Context.floorEdgeRailingPreview2DGroup);
}

export function update3DFloorEdgeRailingPreview(edgeIndex, edge, fenceSubtype) {
  if (Context.currentPreviewFloorEdgeIndex === edgeIndex && Context.floorEdgeRailingPreview3DGroup) {
    return;
  }
  clear3DFloorEdgeRailingPreview();
  Context.currentPreviewFloorEdgeIndex = edgeIndex;
  Context.floorEdgeRailingPreview3DGroup = new BABYLON.TransformNode("floor_edge_railing_preview_group", Context.scene);

  const floorY = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(Context.testMap.getCurrentFloorId()) : 0;
  const p1 = edge.p1;
  const p2 = edge.p2;
  
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len <= 0.01) return;

  const angle = Math.atan2(dz, dx);
  const fenceNode = new BABYLON.TransformNode("floor_edge_rail_preview", Context.scene);
  fenceNode.parent = Context.floorEdgeRailingPreview3DGroup;
  
  fenceNode.position.set((p1.x + p2.x) / 2, floorY, (p1.z + p2.z) / 2);
  fenceNode.rotation.y = -angle;

  const previewMaterial = new BABYLON.StandardMaterial("floor_edge_preview_mat", Context.scene);
  previewMaterial.diffuseColor = BABYLON.Color3.FromHexString('#8d6e63');
  previewMaterial.alpha = 0.55;
  previewMaterial.backFaceCulling = false;

  buildFenceGeometry(
    Context.testMap,
    fenceNode,
    {
      id: `preview_floor_edge_fence_${edgeIndex}`,
      subtype: fenceSubtype,
      tilt: 0
    },
    previewMaterial,
    len,
    1.1,
    0.1
  );
}

export function clear2DStairsRailingPreview() {
  if (Context.stairsRailingPreview2DGroup) {
    Context.stairsRailingPreview2DGroup.innerHTML = '';
    Context.stairsRailingPreview2DGroup.remove();
    Context.stairsRailingPreview2DGroup = null;
  }
}

export function clear3DStairsRailingPreview() {
  if (Context.stairsRailingPreview3DGroup) {
    Context.stairsRailingPreview3DGroup.dispose(false, true);
    Context.stairsRailingPreview3DGroup = null;
  }
  Context.currentPreviewStairsId = null;
}

export function update2DStairsRailingPreview(stairs, fenceSubtype) {
  if (!Context.stairsRailingPreview2DGroup) {
    Context.stairsRailingPreview2DGroup = createSvgElement('g', { id: 'stairs-railing-preview' });
    Context.svg.appendChild(Context.stairsRailingPreview2DGroup);
  } else {
    Context.stairsRailingPreview2DGroup.innerHTML = '';
  }

  const segments = Topology.getStairsRailingSegments(stairs, Context.testMap);

  segments.forEach(seg => {
    const a = worldToSvg(seg.from[0], seg.from[1]);
    const b = worldToSvg(seg.to[0], seg.to[1]);
    const line = createSvgElement('line', {
      x1: a.x, y1: a.y,
      x2: b.x, y2: b.y,
      stroke: 'rgba(141, 110, 99, 0.65)',
      'stroke-width': 3,
      'stroke-dasharray': '5,5'
    });
    Context.stairsRailingPreview2DGroup.appendChild(line);
  });
}

export function update3DStairsRailingPreview(stairsId, fenceSubtype) {
  if (Context.currentPreviewStairsId === stairsId && Context.stairsRailingPreview3DGroup) {
    return;
  }
  clear3DStairsRailingPreview();

  const stairs = Context.testMap.getEntity('stairs', stairsId);
  if (!stairs) return;

  Context.currentPreviewStairsId = stairsId;
  Context.stairsRailingPreview3DGroup = new BABYLON.TransformNode("stairs_railing_preview_group", Context.scene);

  const floorId = stairs.floorId;
  const floorY = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(floorId) : 0;
  const stairsOffset = Context.testMap.getEntityElevationOffset('stairs', stairs);

  const railsData = Topology.getStairsRailingSegments(stairs, Context.testMap);

  const previewMaterial = new BABYLON.StandardMaterial("stairs_railing_preview_mat", Context.scene);
  previewMaterial.diffuseColor = BABYLON.Color3.FromHexString('#8d6e63');
  previewMaterial.alpha = 0.55;
  previewMaterial.backFaceCulling = false;

  railsData.forEach((data, index) => {
    const [x1, z1] = data.from;
    const [x2, z2] = data.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len <= 0.01) return;

    const angle = Math.atan2(dz, dx);
    const fenceNode = new BABYLON.TransformNode(`stairs_rail_preview_${index}`, Context.scene);
    
    let renderLength = len;
    if (data.tilt) {
      renderLength = len / Math.cos(data.tilt);
    }

    const tempFence = {
      id: `preview_temp_${index}`,
      subtype: fenceSubtype,
      height: 1.1,
      thickness: 0.1
    };

    buildFenceGeometry(Context.testMap, fenceNode, tempFence, previewMaterial, renderLength, 1.1, 0.1);

    const fenceOffset = stairsOffset + (data.yOffset || 0);
    fenceNode.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
    fenceNode.rotation.y = -angle;
    if (data.tilt) {
      fenceNode.rotation.z = data.tilt;
    }

    fenceNode.parent = Context.stairsRailingPreview3DGroup;
    fenceNode.getChildMeshes().forEach(mesh => {
      mesh.isPickable = false;
      mesh.material = previewMaterial;
    });
  });

  Context.testMap.attachRuntimeOverlay(Context.stairsRailingPreview3DGroup);
}

export function addRailingToStairs(stairsId, fenceSubtype) {
  const stairs = Context.testMap.getEntity('stairs', stairsId);
  if (!stairs) return;

  const segments = Topology.getStairsRailingSegments(stairs, Context.testMap);
  segments.forEach(seg => {
    Context.testMap.addFence({
      floorId: stairs.floorId,
      from: seg.from,
      to: seg.to,
      subtype: fenceSubtype,
      tilt: seg.tilt,
      yOffset: seg.yOffset
    });
  });
}

export function clearDrawWallPreview() {
  clear2DStairsRailingPreview();
  clear3DStairsRailingPreview();
  clear2DFloorEdgeRailingPreview();
  clear3DFloorEdgeRailingPreview();
  if (Context.drawWallPreviewCylinder) {
    Context.drawWallPreviewCylinder.dispose();
    Context.drawWallPreviewCylinder = null;
  }
  if (Context.drawWallPreviewStartCylinder) {
    Context.drawWallPreviewStartCylinder.dispose();
    Context.drawWallPreviewStartCylinder = null;
  }
  if (Context.drawWallPreviewWall) {
    Context.drawWallPreviewWall.dispose();
    Context.drawWallPreviewWall = null;
  }
}

export function updateDrawWallPreview(snappedPoint) {
  const floorY = Context.testMap.getFloorElevation ? Context.testMap.getFloorElevation(Context.testMap.getCurrentFloorId()) : 0;
  const isFence = Context.mode.startsWith('draw-fence');
  const H = isFence ? 1.1 : (Context.testMap.getSnapshot().wallHeight || 2.8);
  const T = isFence ? 0.1 : (Context.testMap.getSnapshot().wallThickness || 0.18);

  if (Context.drawWallPreviewCylinder && Context.drawWallPreviewCylinder.metadata?.isFence !== isFence) {
    clearDrawWallPreview();
  }

  if (!Context.drawWallPreviewCylinder) {
    Context.drawWallPreviewCylinder = BABYLON.MeshBuilder.CreateCylinder("draw_wall_preview_cyl", {
      height: H,
      diameter: T
    }, Context.scene);
    Context.drawWallPreviewCylinder.metadata = { isFence };
    const mat = new BABYLON.StandardMaterial("draw_wall_cyl_mat", Context.scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString("#ff4081");
    mat.emissiveColor = BABYLON.Color3.FromHexString("#ff4081").scale(0.35);
    mat.alpha = 0.55;
    mat.disableDepthWrite = true;
    Context.drawWallPreviewCylinder.material = mat;
    Context.drawWallPreviewCylinder.isPickable = false;
  }
  Context.drawWallPreviewCylinder.position.set(snappedPoint.x, floorY + H / 2, snappedPoint.z);

  if (Context.drawStart) {
    if (!Context.drawWallPreviewStartCylinder) {
      Context.drawWallPreviewStartCylinder = BABYLON.MeshBuilder.CreateCylinder("draw_wall_preview_start_cyl", {
        height: H,
        diameter: T
      }, Context.scene);
      Context.drawWallPreviewStartCylinder.metadata = { isFence };
      const mat = new BABYLON.StandardMaterial("draw_wall_start_cyl_mat", Context.scene);
      mat.diffuseColor = BABYLON.Color3.FromHexString("#4caf50");
      mat.emissiveColor = BABYLON.Color3.FromHexString("#4caf50").scale(0.35);
      mat.alpha = 0.55;
      mat.disableDepthWrite = true;
      Context.drawWallPreviewStartCylinder.material = mat;
      Context.drawWallPreviewStartCylinder.isPickable = false;
    }
    Context.drawWallPreviewStartCylinder.position.set(Context.drawStart[0], floorY + H / 2, Context.drawStart[1]);

    const dx = snappedPoint.x - Context.drawStart[0];
    const dz = snappedPoint.z - Context.drawStart[1];
    const distance = Math.hypot(dx, dz);

    if (distance > 0.01) {
      if (!Context.drawWallPreviewWall) {
        Context.drawWallPreviewWall = BABYLON.MeshBuilder.CreateBox("draw_wall_preview_wall", {
          width: 1,
          height: H,
          depth: T
        }, Context.scene);
        Context.drawWallPreviewWall.metadata = { isFence };
        const mat = new BABYLON.StandardMaterial("draw_wall_preview_wall_mat", Context.scene);
        mat.diffuseColor = BABYLON.Color3.FromHexString("#1f8fff");
        mat.emissiveColor = BABYLON.Color3.FromHexString("#1f8fff").scale(0.35);
        mat.alpha = 0.35;
        mat.disableDepthWrite = true;
        Context.drawWallPreviewWall.material = mat;
        Context.drawWallPreviewWall.isPickable = false;
      }
      Context.drawWallPreviewWall.visibility = 1.0;
      Context.drawWallPreviewWall.scaling.x = distance;
      Context.drawWallPreviewWall.position.set(
        Context.drawStart[0] + dx / 2,
        floorY + H / 2,
        Context.drawStart[1] + dz / 2
      );
      Context.drawWallPreviewWall.rotation.y = -Math.atan2(dz, dx);
    } else {
      if (Context.drawWallPreviewWall) {
        Context.drawWallPreviewWall.visibility = 0;
      }
    }
  } else {
    if (Context.drawWallPreviewStartCylinder) {
      Context.drawWallPreviewStartCylinder.dispose();
      Context.drawWallPreviewStartCylinder = null;
    }
    if (Context.drawWallPreviewWall) {
      Context.drawWallPreviewWall.dispose();
      Context.drawWallPreviewWall = null;
    }
  }
}
