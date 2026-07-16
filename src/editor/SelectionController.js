import { CSG, Color3, MaterialPluginBase, Mesh, MeshBuilder, MirrorTexture, Plane, PointLight, ReflectionProbe, RenderTargetTexture, ShaderLanguage, SpotLight, Texture, TransformNode, Vector3, VertexBuffer, VertexData } from '../core/babylon.js';
const BABYLON = { CSG, Color3, MaterialPluginBase, Mesh, MeshBuilder, MirrorTexture, Plane, PointLight, ReflectionProbe, RenderTargetTexture, ShaderLanguage, SpotLight, Texture, TransformNode, Vector3, VertexBuffer, VertexData };
import { buildFenceGeometry } from '../geometry/fenceGeometry.js';
import { createOpeningProfileMesh } from '../openings/geometry.js';
import { triangulateRoom } from '../rooms/index.js';
import { OpeningHolePreviewPlugin, FenceGateGapPreviewPlugin } from '../runtime/BabylonSceneRenderer.js';

function wallPoint(wall, t) {
  return {
    x: wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    z: wall.from[1] + (wall.to[1] - wall.from[1]) * t
  };
}

export class SelectionController {
  constructor(scene, document, renderer) {
    this.scene = scene;
    this.document = document;
    this.renderer = renderer;

    this.selectedItemId = null;
    this.selectedWallId = null;
    this.selectedFenceId = null;
    this.selectedFenceGateId = null;
    this.selectedRoomId = null;
    this.selectedRoofId = null;
    this.selectedStairsId = null;
    this.roomSelectionOutlineMesh = null;
  }

  // 辅助方法，用于适配那些接受 registry 的几何生成逻辑
  add(node, options = {}) {
    return this.renderer.add(node, options);
  }

  get root() {
    return this.renderer.root;
  }

  get materials() {
    return this.renderer.materials;
  }

  get shadowCasters() {
    return this.renderer.shadowCasters;
  }

  get colliders() {
    return this.renderer.colliders;
  }

  setSelectedItem(itemId) {
    this.selectedItemId = itemId;
    this.renderer.itemNodes.forEach((node, id) => {
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = (id === itemId);
        mesh.outlineWidth = 0.035;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  setSelectedWall(wallId) {
    this.selectedWallId = wallId;
    this.renderer.wallNodes.forEach((node, id) => {
      const isSelected = (id === wallId);
      if (node.getChildMeshes) {
        node.getChildMeshes().forEach((mesh) => {
          mesh.renderOutline = isSelected;
          mesh.outlineWidth = 0.04;
          mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
        });
      } else {
        node.renderOutline = isSelected;
        node.outlineWidth = 0.04;
        node.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      }
    });
  }

  setSelectedRoom(roomId) {
    this.selectedRoomId = roomId;

    if (this.roomSelectionOutlineMesh) {
      this.roomSelectionOutlineMesh.dispose(false, true);
      this.roomSelectionOutlineMesh = null;
    }

    this.renderer.floorNodes.forEach((node) => {
      if (node.getChildMeshes) {
        node.getChildMeshes().forEach((mesh) => {
          mesh.renderOutline = false;
        });
      }
    });

    if (!roomId) return;

    const room = this.document.getRoom(roomId);
    if (!room) return;

    const group = this.renderer.floorNodes.get(room.id);
    if (!group) return;

    const floorY = this.document.getFloorElevation(room.floorId);
    const floorObj = this.document.getFloor(room.floorId);
    const floorplan = this.document.floorplan;
    const currentFloorHeight = floorObj ? (floorObj.floorHeight ?? floorplan.floorHeight ?? 0.2) : (floorplan.floorHeight ?? 0.2);
    const wallHeight = floorObj ? (floorObj.wallHeight ?? floorplan.wallHeight ?? 2.8) : (floorplan.wallHeight ?? 2.8);

    const yBottom = (room.elevation || 0) + currentFloorHeight / 2;
    const yTop = yBottom + wallHeight;

    const { vertices } = triangulateRoom(room);
    if (!vertices || vertices.length < 3) return;
    const n = vertices.length;

    const lines = [];

    // A. 底部多边形闭环
    for (let i = 0; i < n; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % n];
      lines.push([
        new BABYLON.Vector3(p1.x, yBottom, p1.z),
        new BABYLON.Vector3(p2.x, yBottom, p2.z)
      ]);
    }

    // B. 顶部多边形闭环
    for (let i = 0; i < n; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % n];
      lines.push([
        new BABYLON.Vector3(p1.x, yTop, p1.z),
        new BABYLON.Vector3(p2.x, yTop, p2.z)
      ]);
    }

    // C. 垂直立柱
    for (let i = 0; i < n; i++) {
      const p = vertices[i];
      lines.push([
        new BABYLON.Vector3(p.x, yBottom, p.z),
        new BABYLON.Vector3(p.x, yTop, p.z)
      ]);
    }

    const outlineMesh = BABYLON.MeshBuilder.CreateLineSystem(
      `room_outline_${room.id}`,
      { lines: lines, updatable: false },
      this.scene
    );

    outlineMesh.color = BABYLON.Color3.FromHexString('#36c2ff');
    outlineMesh.isPickable = false;
    outlineMesh.parent = group;

    this.roomSelectionOutlineMesh = outlineMesh;
  }

  setSelectedFence(fenceId) {
    this.selectedFenceId = fenceId;
    this.renderer.fenceNodes.forEach((node, id) => {
      const isSelected = (id === fenceId);
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = isSelected;
        mesh.outlineWidth = 0.04;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  setSelectedFenceGate(gateId) {
    this.selectedFenceGateId = gateId;
    this.renderer.fenceGateNodes.forEach((node, id) => {
      const isSelected = (id === gateId);
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = isSelected;
        mesh.outlineWidth = 0.04;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  setSelectedRoof(roofId) {
    this.selectedRoofId = roofId;
    this.renderer.roofNodes.forEach((node, id) => {
      const isSelected = (id === roofId);
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = isSelected;
        mesh.outlineWidth = 0.04;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  setSelectedStairs(stairsId) {
    this.selectedStairsId = stairsId;
    this.renderer.stairNodes.forEach((node, id) => {
      const isSelected = (id === stairsId);
      node.getChildMeshes().forEach((mesh) => {
        mesh.renderOutline = isSelected;
        mesh.outlineWidth = 0.04;
        mesh.outlineColor = BABYLON.Color3.FromHexString('#36c2ff');
      });
    });
  }

  // --- Opening / Door / Window Drag Preview ---
  beginOpeningDragPreview(openingId) {
    if (this.renderer.isDisposed) return false;
    if (this.renderer.openingDragPreviews.has(openingId)) return true;
    const opening = this.document.getOpening(openingId);
    const wall = opening ? this.document.getWall(opening.wallId) : null;
    const wallNode = wall ? this.renderer.wallNodes.get(wall.id) : null;
    const openingNode = this.renderer.openingNodes.get(openingId);
    if (!opening || !wall || !wallNode || !openingNode) return false;

    const wallMeshes = wallNode.getChildMeshes();
    const frontMaterial = wallMeshes.find((mesh) => mesh.metadata?.side === 'front')?.material
      || wallMeshes[0]?.material;
    const backMaterial = wallMeshes.find((mesh) => mesh.metadata?.side === 'back')?.material
      || frontMaterial;
    const wallMaterials = [...new Set(wallMeshes.map((mesh) => mesh.material).filter(Boolean))];
    if (!frontMaterial || wallMaterials.length === 0) return false;

    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const t = opening.t ?? 0.5;
    const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const floorY = this.document.getFloorElevation(opening.floorId || wall.floorId);
    const centerY = floorY + this.document.getOpeningElevationOffset(opening) + sillHeight + height / 2;
    const root = new BABYLON.TransformNode(`opening_drag_fill_${opening.id}`, this.scene);
    root.parent = this.root;
    root.position.set(x1 + dx * t, centerY, z1 + dz * t);
    root.rotation.y = -Math.atan2(dz, dx);

    const wallT = this.document.floorplan.wallThickness;
    const createFillFace = (side, material, z) => {
      if (!material) return;
      const mesh = createOpeningProfileMesh(this, `opening_drag_fill_${opening.id}_${side}`, opening, root, {
        width,
        height,
        depth: 0,
        flat: true,
        faceDirection: side,
        material,
        shadowCaster: false
      });
      mesh.position.z = z;
      mesh.isPickable = false;
      mesh.receiveShadows = false;
      mesh.metadata = { openingDragFill: true, blueprintOpeningId: opening.id, side };
    };
    createFillFace('front', frontMaterial, wallT / 2 + 0.0002);
    createFillFace('back', backMaterial, -wallT / 2 - 0.0002);

    const plugins = wallMaterials.map((material) => new OpeningHolePreviewPlugin(material, this.renderer, openingId));
    this.renderer.openingDragPreviews.set(openingId, {
      root,
      plugins,
      wallId: wall.id,
      wallNode,
      openingNode,
      wallMaterials
    });
    return true;
  }

  finishOpeningDragPreview(openingId) {
    const preview = this.renderer.openingDragPreviews.get(openingId);
    const opening = this.document.getOpening(openingId);
    if (!preview || !opening) return Promise.resolve(false);

    this.renderer.openingDragPreviews.delete(openingId);
    const oldWallNode = preview.wallNode;
    const oldOpeningNode = preview.openingNode;
    const oldMeshes = new Set([
      ...oldWallNode.getChildMeshes(),
      ...oldOpeningNode.getChildMeshes()
    ]);
    const sharedMaterials = new Set(Object.values(this.renderer.materials));
    const oldOpeningMaterials = [...new Set(oldOpeningNode.getChildMeshes().map((mesh) => mesh.material).filter(Boolean))]
      .filter((material) => !sharedMaterials.has(material) && !preview.wallMaterials.includes(material));

    this.renderer.buildWalls(new Set([preview.wallId, opening.wallId]));
    this.renderer.buildOpenings(new Set([openingId]));

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        preview.root.dispose(false, false);
        oldWallNode.dispose(false, false);
        oldOpeningNode.dispose(false, false);
        preview.wallMaterials.forEach((material) => material.dispose(false, true));
        oldOpeningMaterials.forEach((material) => material.dispose(false, true));

        if (!this.renderer.isDisposed) {
          const activeShadowCasters = this.renderer.shadowCasters.filter((mesh) => !oldMeshes.has(mesh) && !mesh.isDisposed());
          this.renderer.shadowCasters.length = 0;
          this.renderer.shadowCasters.push(...activeShadowCasters);
        }
      } finally {
        preview.plugins.length = 0;
      }
    };
    return this.renderer.executeWhenReady(cleanup, { onCancel: cleanup, previewResource: true });
  }

  updateOpeningNodePose(openingId) {
    const opening = this.document.getOpening(openingId);
    const node = this.renderer.openingNodes.get(openingId);
    if (!opening || !node) return;
    const wall = this.document.getWall(opening.wallId);
    if (!wall) return;
    const [x1, z1] = wall.from;
    const [x2, z2] = wall.to;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const angle = -Math.atan2(dz, dx);
    const pos = wallPoint(wall, opening.t ?? 0.5);
    const width = opening.width || (opening.type === 'door' ? 0.9 : 1.25);
    const height = opening.height ?? (opening.type === 'door' ? 2.05 : 0.85);
    const sillHeight = opening.sillHeight ?? (opening.type === 'door' ? 0 : 1.05);
    const localY = sillHeight + height / 2;
    const floorY = this.document.getFloorElevation(opening.floorId || wall.floorId);
    const openingOffset = this.document.getOpeningElevationOffset(opening);

    node.position.set(pos.x, floorY + localY + openingOffset, pos.z);
    node.rotation.y = angle;
  }

  // --- Fence Gate Drag Preview ---
  beginFenceGateDragPreview(gateId) {
    if (this.renderer.isDisposed) return false;
    if (this.renderer.fenceGateDragPreviews.has(gateId)) return true;
    const gate = this.document.getFenceGate(gateId);
    const gateNode = this.renderer.fenceGateNodes.get(gateId);
    if (!gate || !gateNode) return false;

    const root = new BABYLON.TransformNode(`fence_gate_drag_fill_${gate.id}`, this.scene);
    root.parent = this.root;
    const preview = {
      root,
      gateNode,
      sourceFenceId: gate.fenceId,
      fenceNodes: new Map(),
      affectedFenceIds: new Set(),
      plugins: [],
      pluginMaterials: new Set(),
      previewMeshes: new Set()
    };
    this.renderer.fenceGateDragPreviews.set(gateId, preview);

    const sourceFence = gate.fenceId ? this.document.getFence(gate.fenceId) : null;
    const sourceFenceNode = sourceFence ? this.renderer.fenceNodes.get(sourceFence.id) : null;
    if (sourceFence && sourceFenceNode) {
      const sourceMaterials = [...new Set(sourceFenceNode.getChildMeshes().map((mesh) => mesh.material).filter(Boolean))];
      const baseMaterial = sourceMaterials.find((material) => material.name === `fence_${sourceFence.id}_mat`)
        || sourceMaterials[0];
      const [x1, z1] = gate.from;
      const [x2, z2] = gate.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const sourceLength = Math.max(0.02, Math.hypot(dx, dz) || gate.width || 1);
      const floorY = this.document.getFloorElevation(sourceFence.floorId);
      const fenceOffset = this.document.getFenceElevationOffset(sourceFence) + (sourceFence.yOffset || 0);
      root.position.set((x1 + x2) / 2, floorY + fenceOffset, (z1 + z2) / 2);
      root.rotation.y = -Math.atan2(sourceFence.to[1] - sourceFence.from[1], sourceFence.to[0] - sourceFence.from[0]);
      root.rotation.z = sourceFence.tilt || 0;

      let renderLength = sourceLength;
      if (sourceFence.tilt) renderLength /= Math.cos(sourceFence.tilt);
      renderLength += 0.02;
      buildFenceGeometry(
        this,
        root,
        {
          ...sourceFence,
          skipStartPost: true,
          skipEndPost: true
        },
        baseMaterial,
        renderLength,
        sourceFence.height || 1.1,
        sourceFence.thickness || 0.1
      );
      root.getChildMeshes().forEach((mesh) => {
        mesh.isPickable = false;
        mesh.metadata = { ...(mesh.metadata || {}), fenceGateDragFill: true, blueprintFenceGateId: gate.id };
        preview.previewMeshes.add(mesh);
      });
      const activeShadowCasters = this.renderer.shadowCasters.filter((mesh) => !preview.previewMeshes.has(mesh));
      this.renderer.shadowCasters.length = 0;
      this.renderer.shadowCasters.push(...activeShadowCasters);
    }

    this.syncFenceGateDragPreview(gateId);
    return true;
  }

  syncFenceGateDragPreview(gateId) {
    return this.renderer.syncFenceGateDragPreview(gateId);
  }

  finishFenceGateDragPreview(gateId) {
    const preview = this.renderer.fenceGateDragPreviews.get(gateId);
    const gate = this.document.getFenceGate(gateId);
    if (!preview || !gate) return Promise.resolve(false);

    this.renderer.fenceGateDragPreviews.delete(gateId);
    const oldFenceNodes = [...preview.fenceNodes.values()];
    const oldGateNode = preview.gateNode;
    const oldMeshes = new Set([
      ...preview.root.getChildMeshes(),
      ...oldFenceNodes.flatMap((node) => node.getChildMeshes()),
      ...oldGateNode.getChildMeshes()
    ]);
    const sharedMaterials = new Set(Object.values(this.renderer.materials));
    const oldMaterials = [...new Set([...oldMeshes].map((mesh) => mesh.material).filter(Boolean))]
      .filter((material) => !sharedMaterials.has(material));

    if (preview.affectedFenceIds.size > 0) this.renderer.buildFences(preview.affectedFenceIds);
    this.renderer.buildFenceGates(new Set([gateId]));

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        preview.root.dispose(false, false);
        oldFenceNodes.forEach((node) => node.dispose(false, false));
        oldGateNode.dispose(false, false);
        oldMaterials.forEach((material) => material.dispose(false, true));

        if (!this.renderer.isDisposed) {
          const activeShadowCasters = this.renderer.shadowCasters.filter((mesh) => !oldMeshes.has(mesh) && !mesh.isDisposed());
          this.renderer.shadowCasters.length = 0;
          this.renderer.shadowCasters.push(...activeShadowCasters);
        }
      } finally {
        preview.plugins.length = 0;
        preview.pluginMaterials.clear();
        preview.previewMeshes.clear();
      }
    };
    return this.renderer.executeWhenReady(cleanup, { onCancel: cleanup, previewResource: true });
  }

  updateFenceGateNodeTransform(gateId) {
    return this.renderer.syncEntityPreview('fenceGate', gateId);
  }
}
