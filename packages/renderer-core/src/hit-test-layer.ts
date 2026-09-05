import {
  applyMatrixToPoint,
  invertMatrix,
  LayerKind,
  RGBA_CHANNELS,
  type Composition,
  type Layer,
  type RasterLayer,
  type Size2D,
  type Vector2,
} from "@compio/domain-composition";
import { getLayerLocalBounds } from "./layer-bounds";
import { topLevelLayers } from "./render-composition";

const OPAQUE_ALPHA_THRESHOLD = 0;

const isWithinLocalBounds = (localPoint: Vector2, bounds: Size2D): boolean =>
  localPoint.x >= 0 &&
  localPoint.x < bounds.width &&
  localPoint.y >= 0 &&
  localPoint.y < bounds.height;

/** A fully transparent pixel lets the click pass through to whatever's beneath — matches Photoshop/Affinity. */
const isRasterPixelOpaque = (layer: RasterLayer, localPoint: Vector2): boolean => {
  const pixelX = Math.floor(localPoint.x);
  const pixelY = Math.floor(localPoint.y);
  const byteIndex = (pixelY * layer.image.width + pixelX) * RGBA_CHANNELS;
  const alpha = layer.image.data[byteIndex + 3] ?? 0;

  return alpha > OPAQUE_ALPHA_THRESHOLD;
};

export interface HitTestSingleLayerOptions {
  layer: Layer;
  layersById: Map<string, Layer>;
  point: Vector2;
}

const hitTestSingleLayer = ({
  layer,
  layersById,
  point,
}: HitTestSingleLayerOptions): Layer | null => {
  if (!layer.visible) return null;

  const localPoint = applyMatrixToPoint(invertMatrix(layer.transform), point);
  if (!isWithinLocalBounds(localPoint, getLayerLocalBounds(layer))) return null;

  if (layer.kind === LayerKind.RASTER) {
    return isRasterPixelOpaque(layer, localPoint) ? layer : null;
  }

  if (layer.kind === LayerKind.GROUP) {
    const children = layer.childIds
      .map((childId) => layersById.get(childId))
      .filter((child): child is Layer => Boolean(child))
      .sort((first, second) => second.zIndex - first.zIndex);

    // Group transform already applied above; recurse using the point in the
    // group's own local space, matching how rendering nests child transforms.
    return children.reduce<Layer | null>(
      (found, child) =>
        found ?? hitTestSingleLayer({ layer: child, layersById, point: localPoint }),
      null,
    );
  }

  // Text layers have no rasterized pixel data yet to test against — the bounds
  // check above is the whole test for now (documented gap, see README Roadmap).
  return layer;
};

/**
 * Topmost non-transparent layer under `point` (canvas space), or null.
 * Bounding-box-only hit-testing may become a selectable alternative mode
 * later (see README Roadmap) — pixel-opacity is the only mode for now.
 */
export const hitTestLayer = (composition: Composition, point: Vector2): Layer | null => {
  const layersById = new Map(composition.layers.map((layer) => [layer.id, layer]));
  const topmostFirst = [...topLevelLayers(composition)].reverse();

  return topmostFirst.reduce<Layer | null>(
    (found, layer) => found ?? hitTestSingleLayer({ layer, layersById, point }),
    null,
  );
};
