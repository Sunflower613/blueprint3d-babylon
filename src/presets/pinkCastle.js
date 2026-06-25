import * as BABYLON from '@babylonjs/core';
import { BlueprintRegistry } from '../core/BlueprintRegistry.js';
import { createMaterialPalette, createFlatMaterial } from '../core/materials.js';
import { createBox, createCylinder, createSphere, createDisc, createFenceLine } from '../core/primitives.js';

export const PINK_CASTLE_PALETTE = {
  wall: '#ff85a1',
  trim: '#ffffff',
  roof: '#b71c1c',
  grass: '#81c784',
  road: '#d7ccc8',
  poolBase: '#ff4d6d',
  dirt: '#9c27b0',
  gold: { color: '#ffd700', specularColor: new BABYLON.Color3(0.5, 0.5, 0.5) },
  tilePink: '#ffb3c6',
  wood: '#5d4037',
  leaf: '#2e7d32',
  glass: { color: '#80deea', alpha: 0.7 },
  water: { color: '#80deea', alpha: 0.65, emissive: true, backFaceCulling: false },
  heart: { color: '#ff4081', emissive: true },
  sakura: { color: '#ffb7c5', alpha: 0.85, emissive: true }
};

export const PINK_CASTLE_BLUEPRINT = {
  name: 'pinkCastle',
  base: { width: 33, depth: 33, groundY: 0.6 },
  pool: { x: -11, y: 0.608, z: 2, radius: 3 },
  playerWaterY: 0.52,
  sakuraCount: 25,
  interactables: [
    { id: 'exit_castle', name: '城堡大门（传送回小岛）', x: 0, y: 0.6, z: 16.2, triggerRadius: 2.2 },
    { id: 'lie_bed', name: '小憩一下（公主床）', x: -12.5, y: 5.45, z: -3.7, triggerRadius: 1.6 }
  ]
};

export class PinkCastleBlueprint extends BlueprintRegistry {
  constructor(scene, options = {}) {
    super(scene, { name: options.name || PINK_CASTLE_BLUEPRINT.name });
    this.blueprint = { ...PINK_CASTLE_BLUEPRINT, ...(options.blueprint || {}) };
    this.materials = createMaterialPalette(scene, {
      ...PINK_CASTLE_PALETTE,
      ...(options.palette || {})
    }, this.blueprint.name);
    this.sakuraList = [];
    this.ripples = [];
    this.lastWaterStepTime = 0;
    this.build();
  }

  build() {
    const b = this.blueprint;
    const m = this.materials;
    const baseWidth = b.base.width;
    const baseDepth = b.base.depth;
    const halfW = baseWidth / 2 - 0.3;
    const halfD = baseDepth / 2 - 0.3;

    this.addCollider({ type: 'floor', worldX: 0, worldZ: 0, worldY: b.base.groundY, radius: 24 });

    createBox(this, 'castleLawn', {
      width: baseWidth,
      height: 1.2,
      depth: baseDepth
    }, {
      position: { x: 0, y: 0, z: 0 }
    }, {
      material: m.grass,
      receiveShadows: true
    });

    createBox(this, 'castlePurpleDirt', {
      width: baseWidth - 0.2,
      height: 2.2,
      depth: baseDepth - 0.2
    }, {
      position: { x: 0, y: -1.7, z: 0 }
    }, {
      material: m.dirt,
      shadowCaster: false
    });

    const skipGate = (x, z) => Math.abs(z - halfD) < 0.5 && Math.abs(x) < 4;
    const fenceOptions = {
      y: b.base.groundY,
      step: 2.2,
      height: 0.8,
      postMaterial: m.trim,
      railMaterial: m.tilePink,
      skip: skipGate
    };
    createFenceLine(this, [{ x: -halfW, z: -halfD }, { x: halfW, z: -halfD }], fenceOptions);
    createFenceLine(this, [{ x: -halfW, z: -halfD }, { x: -halfW, z: halfD }], fenceOptions);
    createFenceLine(this, [{ x: halfW, z: -halfD }, { x: halfW, z: halfD }], fenceOptions);
    createFenceLine(this, [{ x: -halfW, z: halfD }, { x: halfW, z: halfD }], fenceOptions);

    this.buildGate(halfD);
    this.buildFountainAndRoad();
    this.buildCastleBody();
    this.buildPool();
    this.buildInterior();
    this.buildSakura();

    b.interactables.forEach((interactable) => this.addInteractable({ ...interactable }));
  }

  buildGate(halfD) {
    const gate = new BABYLON.TransformNode('castleGateGroup', this.scene);
    gate.position.set(0, 0.6, halfD);
    this.add(gate, { shadowCaster: false });

    [-2, 2].forEach((x) => {
      createBox(this, 'gatePost', { width: 0.45, height: 2.2, depth: 0.45 }, {
        position: { x, y: 1.1, z: 0 }
      }, { parent: gate, material: this.materials.trim });
      createSphere(this, 'gatePostCap', { diameter: 0.35, segments: 8 }, {
        position: { x, y: 2.38, z: 0 }
      }, { parent: gate, material: this.materials.gold });
    });

    [-0.8, 0.8].forEach((x) => {
      createBox(this, 'gateDoorPanel', { width: 1.35, height: 1.55, depth: 0.06 }, {
        position: { x, y: 0.78, z: 0 }
      }, { parent: gate, material: this.materials.tilePink });
    });
  }

  buildFountainAndRoad() {
    const m = this.materials;
    const fountain = new BABYLON.TransformNode('fountain', this.scene);
    fountain.position.set(0, 0.6, 4.5);
    this.add(fountain, { shadowCaster: false });

    const roadRing = BABYLON.MeshBuilder.CreateTorus('castleRoadRing', {
      diameter: 12.6,
      thickness: 3,
      tessellation: 32
    }, this.scene);
    roadRing.scaling.y = 0.003;
    roadRing.position.set(0, 0.605, 4.5);
    this.add(roadRing, { material: m.road, receiveShadows: true });

    createBox(this, 'castleRoadStraight', { width: 4, height: 0.01, depth: 9 }, {
      position: { x: 0, y: 0.605, z: 10.8 }
    }, { material: m.road, receiveShadows: true });

    createCylinder(this, 'fountainBasin', {
      diameterTop: 4.4,
      diameterBottom: 4.8,
      height: 0.35,
      tessellation: 16
    }, { position: { x: 0, y: 0.175, z: 0 } }, { parent: fountain, material: m.trim });

    createCylinder(this, 'fountainWater', {
      diameterTop: 4,
      diameterBottom: 4,
      height: 0.05,
      tessellation: 16
    }, { position: { x: 0, y: 0.28, z: 0 } }, { parent: fountain, material: m.water, shadowCaster: false });

    createCylinder(this, 'fountainColumn', {
      diameterTop: 0.7,
      diameterBottom: 0.9,
      height: 1.2,
      tessellation: 8
    }, { position: { x: 0, y: 0.7, z: 0 } }, { parent: fountain, material: m.trim });
  }

  buildCastleBody() {
    const m = this.materials;
    const z = -2.5;
    const firstFloorY = 0.72;
    const secondFloorY = 5.3;

    createBox(this, 'castleFirstFloor', { width: 19, height: 4.2, depth: 10 }, {
      position: { x: -5.5, y: firstFloorY + 2.1, z }
    }, { material: m.wall });
    createBox(this, 'castleSecondFloor', { width: 16, height: 3.3, depth: 8.2 }, {
      position: { x: -7.5, y: secondFloorY + 1.65, z }
    }, { material: m.wall });
    createBox(this, 'castlePorch', { width: 6.2, height: 0.25, depth: 2.4 }, {
      position: { x: -5.5, y: firstFloorY + 0.15, z: z + 5.6 }
    }, { material: m.trim, receiveShadows: true });
    createCylinder(this, 'castleTower', {
      diameterTop: 4.2,
      diameterBottom: 4.8,
      height: 9,
      tessellation: 16
    }, { position: { x: 5.3, y: firstFloorY + 4.5, z: z - 1.2 } }, { material: m.wall });
    createCylinder(this, 'castleMainRoof', {
      diameterTop: 0,
      diameterBottom: 20.5,
      height: 3.4,
      tessellation: 4
    }, {
      position: { x: -5.5, y: secondFloorY + 5.2, z },
      rotation: { x: 0, y: Math.PI / 4, z: 0 }
    }, { material: m.roof });
    createCylinder(this, 'castleTowerRoof', {
      diameterTop: 0,
      diameterBottom: 5.5,
      height: 4.5,
      tessellation: 16
    }, { position: { x: 5.3, y: 12.0, z: z - 1.2 } }, { material: m.roof });

    this.addCollider({ type: 'floor', worldX: -5.5, worldZ: z, worldY: firstFloorY, radius: 9.8 });
    this.addCollider({ type: 'floor', worldX: -7.5, worldZ: z, worldY: secondFloorY, radius: 8.4 });

    [-11.5, -5.5, 0.5].forEach((x) => this.createArchWindow(x, firstFloorY + 2.7, z + 5.05));
    [-11, -4].forEach((x) => this.createArchWindow(x, secondFloorY + 2.1, z + 4.15));
  }

  createArchWindow(x, y, z) {
    createBox(this, 'castleWindowGlass', { width: 0.85, height: 1.35, depth: 0.05 }, {
      position: { x, y, z }
    }, { material: this.materials.glass, shadowCaster: false });
    createCylinder(this, 'castleWindowArch', {
      diameterTop: 0.95,
      diameterBottom: 0.95,
      height: 0.08,
      tessellation: 16
    }, {
      position: { x, y: y + 0.7, z: z + 0.01 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 }
    }, { material: this.materials.trim });
  }

  buildPool() {
    const p = this.blueprint.pool;
    createBox(this, 'castlePoolFrame', { width: 6.8, height: 0.1, depth: 6.8 }, {
      position: { x: p.x, y: 0.605, z: p.z }
    }, { material: this.materials.trim });
    createBox(this, 'castlePoolBottom', { width: 6, height: 0.02, depth: 6 }, {
      position: { x: p.x, y: 0.601, z: p.z }
    }, { material: this.materials.poolBase, shadowCaster: false });
    createBox(this, 'castlePoolWater', { width: 6, height: 0.02, depth: 6 }, {
      position: { x: p.x, y: p.y, z: p.z }
    }, { material: this.materials.water, shadowCaster: false });
  }

  buildInterior() {
    const sofa = new BABYLON.TransformNode('castleSofa', this.scene);
    sofa.position.set(-6.5, 0.72, -3.7);
    this.add(sofa, { shadowCaster: false });
    createBox(this, 'sofaBase', { width: 1.8, height: 0.18, depth: 0.75 }, {
      position: { x: 0, y: 0.09, z: 0 }
    }, { parent: sofa, material: this.materials.tilePink });
    createBox(this, 'sofaBack', { width: 1.8, height: 0.55, depth: 0.18 }, {
      position: { x: 0, y: 0.455, z: -0.285 }
    }, { parent: sofa, material: this.materials.tilePink });

    const bed = new BABYLON.TransformNode('princessBed', this.scene);
    bed.position.set(-12.5, 5.45, -3.7);
    this.add(bed, { shadowCaster: false });
    createBox(this, 'bedBase', { width: 2.2, height: 0.32, depth: 2.4 }, {
      position: { x: 0, y: 0.16, z: 0 }
    }, { parent: bed, material: this.materials.trim });
    createBox(this, 'bedSheet', { width: 2, height: 0.12, depth: 2.2 }, {
      position: { x: 0, y: 0.38, z: 0.1 }
    }, { parent: bed, material: this.materials.tilePink });
  }

  buildSakura() {
    for (let i = 0; i < this.blueprint.sakuraCount; i += 1) {
      const petal = createBox(this, `sakuraPetal_${i}`, {
        width: 0.18,
        height: 0.02,
        depth: 0.18
      }, {
        position: {
          x: (Math.random() - 0.5) * 26,
          y: 1 + Math.random() * 11,
          z: (Math.random() - 0.5) * 26 - 2
        },
        rotation: {
          x: Math.random() * Math.PI,
          y: Math.random() * Math.PI,
          z: 0
        }
      }, {
        material: this.materials.sakura,
        shadowCaster: false
      });

      this.sakuraList.push({
        mesh: petal,
        velocity: new BABYLON.Vector3((Math.random() - 0.5) * 0.4, -0.5 - Math.random() * 0.5, (Math.random() - 0.5) * 0.4),
        rotSpeed: new BABYLON.Vector3(Math.random() * 1.2, Math.random() * 1.2, 0),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  createRipple(x, y, z) {
    const material = createFlatMaterial(this.scene, `castleRippleMat_${Date.now()}`, '#ff85a1', {
      alpha: 0.6,
      emissive: true,
      backFaceCulling: false
    });
    const ripple = createDisc(this, `castleRipple_${Date.now()}`, {
      radius: 0.01,
      tessellation: 12
    }, {
      position: { x, y, z },
      rotation: { x: Math.PI / 2, y: 0, z: 0 }
    }, {
      material,
      shadowCaster: false
    });
    this.ripples.push({ mesh: ripple, material, size: 0.01, maxSize: 0.65, speed: 1.4, maxOpacity: 0.6 });
  }

  update(dt, time, context = {}) {
    const player = context.player || context;

    this.sakuraList.forEach((petal) => {
      petal.mesh.position.addInPlace(petal.velocity.scale(dt));
      petal.mesh.rotation.x += petal.rotSpeed.x * dt;
      petal.mesh.rotation.y += petal.rotSpeed.y * dt;
      petal.mesh.position.x += Math.sin(time * 1.5 + petal.phase) * 0.005;

      if (petal.mesh.position.y <= 0.6) {
        petal.mesh.position.y = 11 + Math.random() * 3;
        petal.mesh.position.x = (Math.random() - 0.5) * 22;
        petal.mesh.position.z = (Math.random() - 0.5) * 22 - 2;
      }
    });

    this.updatePoolContact(dt, time, player);
    this.updateRipples(dt);
    super.update(dt, time, context);
  }

  updatePoolContact(dt, time, player) {
    if (!player || !player.position || !player.velocity) return;

    const p = this.blueprint.pool;
    const dx = player.position.x - p.x;
    const dz = player.position.z - p.z;
    const distToPool = Math.sqrt(dx * dx + dz * dz);
    if (distToPool >= p.radius) return;

    if (player.position.y >= 0.58) {
      player.position.y = this.blueprint.playerWaterY;
      player.velocity.y = 0;
      player.isGrounded = true;
    }

    const speed = Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z);
    if (speed > 0.05 && time - this.lastWaterStepTime > 0.32) {
      this.lastWaterStepTime = time;
      this.createRipple(player.position.x, p.y + 0.004, player.position.z);
    }
  }

  updateRipples(dt) {
    for (let i = this.ripples.length - 1; i >= 0; i -= 1) {
      const ripple = this.ripples[i];
      ripple.size += ripple.speed * dt;
      ripple.mesh.scaling.set(ripple.size * 5, ripple.size * 5, 1);
      ripple.material.alpha = ripple.maxOpacity * (1 - ripple.size / ripple.maxSize);

      if (ripple.size >= ripple.maxSize) {
        ripple.mesh.dispose();
        ripple.material.dispose();
        this.ripples.splice(i, 1);
      }
    }
  }
}

export function buildPinkCastle(scene, options = {}) {
  return new PinkCastleBlueprint(scene, options);
}
