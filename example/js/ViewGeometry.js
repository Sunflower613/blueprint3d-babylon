/**
 * Expand world bounds so one world unit occupies the same number of SVG units
 * on both axes. Keeping the center fixed avoids shifting the fitted plan.
 */
export function fitBoundsToViewport(bounds, view) {
  const innerWidth = view.width - view.pad * 2;
  const innerHeight = view.height - view.pad * 2;
  const spanX = bounds.maxX - bounds.minX;
  const spanZ = bounds.maxZ - bounds.minZ;

  if (innerWidth <= 0 || innerHeight <= 0 || spanX <= 0 || spanZ <= 0) {
    return { ...bounds };
  }

  const viewportAspect = innerWidth / innerHeight;
  const boundsAspect = spanX / spanZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  if (boundsAspect > viewportAspect) {
    const fittedSpanZ = spanX / viewportAspect;
    return {
      ...bounds,
      minZ: centerZ - fittedSpanZ / 2,
      maxZ: centerZ + fittedSpanZ / 2
    };
  }

  const fittedSpanX = spanZ * viewportAspect;
  return {
    ...bounds,
    minX: centerX - fittedSpanX / 2,
    maxX: centerX + fittedSpanX / 2
  };
}
