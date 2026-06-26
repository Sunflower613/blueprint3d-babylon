import { buildDoorOpening } from './door.js';
import { buildWindowOpening } from './window.js';

export { buildDoorOpening, buildWindowOpening };

export function buildOpeningGeometry(registry, opening, parent, options = {}) {
  if (opening.type === 'door') {
    return buildDoorOpening(registry, opening, parent, options);
  }
  return buildWindowOpening(registry, opening, parent, options);
}
