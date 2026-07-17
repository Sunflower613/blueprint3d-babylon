export function getShadowCasterContext(mesh) {
  let current = mesh;
  let floorId = null;
  let isFurniture = false;
  let crossFloorOnly = false;

  while (current) {
    const metadata = current.metadata;
    if (!floorId && metadata?.floorId) floorId = metadata.floorId;
    if (metadata?.blueprintItemId) isFurniture = true;
    if (metadata?.crossFloorShadowOnly) crossFloorOnly = true;
    current = current.parent;
  }

  return { floorId, isFurniture, crossFloorOnly };
}

export function shouldIncludeShadowCaster(mesh, currentFloorId) {
  const { floorId, isFurniture, crossFloorOnly } = getShadowCasterContext(mesh);
  if (crossFloorOnly && floorId === currentFloorId) return false;
  return !floorId || floorId === currentFloorId || !isFurniture;
}
