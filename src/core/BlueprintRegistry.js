import * as BABYLON from '@babylonjs/core';

export function normalizeVector3(value, fallback = BABYLON.Vector3.Zero()) {
  if (value instanceof BABYLON.Vector3) return value;
  if (Array.isArray(value)) {
    return new BABYLON.Vector3(value[0] || 0, value[1] || 0, value[2] || 0);
  }
  if (value && typeof value === 'object') {
    return new BABYLON.Vector3(value.x || 0, value.y || 0, value.z || 0);
  }
  return fallback.clone ? fallback.clone() : fallback;
}

export function setTransform(node, transform = {}) {
  if (transform.position) node.position.copyFrom(normalizeVector3(transform.position));
  if (transform.rotation) node.rotation.copyFrom(normalizeVector3(transform.rotation));
  if (transform.scaling) node.scaling.copyFrom(normalizeVector3(transform.scaling, new BABYLON.Vector3(1, 1, 1)));
  return node;
}

export class BlueprintRegistry {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.name = options.name || 'blueprint';
    this.root = options.root || new BABYLON.TransformNode(`${this.name}Root`, scene);
    this.colliders = [];
    this.interactables = [];
    this.shadowCasters = [];
    this.updaters = [];
    this.metadata = {};
  }

  add(node, options = {}) {
    if (!node) return node;
    node.parent = options.parent || this.root;

    if (options.material) node.material = options.material;
    if (options.receiveShadows) node.receiveShadows = true;
    if (options.shadowCaster !== false && node.getClassName && node.getClassName() !== 'TransformNode') {
      this.shadowCasters.push(node);
    }
    if (options.collider) this.colliders.push(options.collider);
    if (options.interactable) this.interactables.push(options.interactable);

    return node;
  }

  addCollider(collider) {
    this.colliders.push(collider);
    return collider;
  }

  addInteractable(interactable) {
    this.interactables.push(interactable);
    return interactable;
  }

  addUpdater(updater) {
    this.updaters.push(updater);
    return updater;
  }

  update(dt, time, context = {}) {
    this.updaters.forEach((updater) => updater(dt, time, context));
  }

  getShadowCasters() {
    return this.shadowCasters;
  }

  dispose() {
    this.root.dispose(false, true);
    this.colliders.length = 0;
    this.interactables.length = 0;
    this.shadowCasters.length = 0;
    this.updaters.length = 0;
  }
}
