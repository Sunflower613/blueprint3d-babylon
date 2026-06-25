import { PinkCastleBlueprint } from '../presets/pinkCastle.js';

export class PinkCastleGenerator {
  constructor(scene, themeConfig = {}, options = {}) {
    this.scene = scene;
    this.themeConfig = themeConfig;
    this.blueprint = new PinkCastleBlueprint(scene, options);

    this.group = this.blueprint.root;
    this.colliders = this.blueprint.colliders;
    this.interactables = this.blueprint.interactables;
    this.shadowCasters = this.blueprint.shadowCasters;
  }

  update(dt, time, player) {
    this.blueprint.update(dt, time, { player });
  }

  getShadowCasters() {
    return this.blueprint.getShadowCasters();
  }

  dispose() {
    this.blueprint.dispose();
  }
}
