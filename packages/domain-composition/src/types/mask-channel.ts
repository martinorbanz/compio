import { MASK_OPAQUE, MASK_TRANSPARENT } from "../constants";
import { applyMatrixToPoint, isIdentityMatrix, type Matrix2D } from "./matrix2d";
import type { Size2D, Vector2 } from "./vector2";

/** Single-channel grayscale mask: 0 = excluded, 255 = fully included. */
export interface MaskChannel {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export const createEmptyMask = (
  { width, height }: Size2D,
  fill = MASK_TRANSPARENT,
): MaskChannel => {
  const data = new Uint8ClampedArray(width * height);
  data.fill(fill);

  return { width, height, data };
};

export const createFullMask = (size: Size2D): MaskChannel => createEmptyMask(size, MASK_OPAQUE);

export interface SampleMaskChannelOptions {
  mask: MaskChannel;
  x: number;
  y: number;
}

/**
 * Reads by (x, y) rather than a flat index — a mask is often a different
 * size than the raster it's applied to (e.g. rasterized at canvas size,
 * applied to an imported layer with its own native dimensions), so indexing
 * by the raster's own byte offset silently reads the wrong row past the
 * first once the two widths diverge. Out-of-bounds reads as unselected.
 */
export const sampleMaskChannel = ({ mask, x, y }: SampleMaskChannelOptions): number => {
  const isWithinBounds = x >= 0 && x < mask.width && y >= 0 && y < mask.height;
  if (!isWithinBounds) return MASK_TRANSPARENT;

  return mask.data[y * mask.width + x] ?? MASK_TRANSPARENT;
};

/** Local-space pixel (x, y) sampled at its own center, not its corner — see createMaskSampler. */
const PIXEL_CENTER_OFFSET = 0.5;

/** Non-identity createMaskSampler only. 16 samples/pixel; cost multiplier on two hot per-pixel call sites (blendBySelection, brush stamps), so not denser than needed for a soft selection edge. */
const SUPERSAMPLE_GRID_SIZE = 4;

/** Cell centers of a SUPERSAMPLE_GRID_SIZE x SUPERSAMPLE_GRID_SIZE grid over the unit pixel, as (x, y) offsets in [0, 1). Module-level: computed once, not per sampler/sample. */
const SUPERSAMPLE_OFFSETS: readonly Vector2[] = Array.from(
  { length: SUPERSAMPLE_GRID_SIZE * SUPERSAMPLE_GRID_SIZE },
  (_placeholder, sampleIndex) => {
    const column = sampleIndex % SUPERSAMPLE_GRID_SIZE;
    const row = Math.floor(sampleIndex / SUPERSAMPLE_GRID_SIZE);

    return {
      x: (column + PIXEL_CENTER_OFFSET) / SUPERSAMPLE_GRID_SIZE,
      y: (row + PIXEL_CENTER_OFFSET) / SUPERSAMPLE_GRID_SIZE,
    };
  },
);

export interface CreateMaskSamplerOptions {
  mask: MaskChannel;
  /** `mask` lives in canvas space; this maps local-space sample points into it. */
  layerTransform: Matrix2D;
}

export interface MaskSampler {
  (localPoint: Vector2): number;
}

/**
 * Local-space point -> canvas-space mask lookup (mirrors the canvas->local
 * inverse used for stroke points). Identity check happens once here, not
 * per sample — call once per operation, reuse the returned sampler per pixel.
 * Non-identity branch: a transformed pixel's footprint can span several
 * mask pixels, so it averages SUPERSAMPLE_OFFSETS sub-samples instead of
 * one point — fixes stair-stepping on rotated/scaled selection edges.
 * Identity branch stays a single point sample; rasterizeShape's own binary
 * fill (no transform involved) is a separate, out-of-scope limitation.
 */
export const createMaskSampler = ({
  mask,
  layerTransform,
}: CreateMaskSamplerOptions): MaskSampler => {
  if (isIdentityMatrix(layerTransform)) {
    return ({ x, y }) => sampleMaskChannel({ mask, x: Math.floor(x), y: Math.floor(y) });
  }

  return ({ x, y }) => {
    const sampleTotal = SUPERSAMPLE_OFFSETS.reduce((total, offset) => {
      const canvasPoint = applyMatrixToPoint(layerTransform, {
        x: x + offset.x,
        y: y + offset.y,
      });

      return (
        total +
        sampleMaskChannel({ mask, x: Math.floor(canvasPoint.x), y: Math.floor(canvasPoint.y) })
      );
    }, 0);

    return sampleTotal / SUPERSAMPLE_OFFSETS.length;
  };
};

export type SelectionOp = "add" | "subtract" | "intersect" | "replace";

const assertSameSize = (base: MaskChannel, overlay: MaskChannel): void => {
  if (base.width !== overlay.width || base.height !== overlay.height) {
    throw new Error("MaskChannel operands must share the same dimensions");
  }
};

export interface CombineMasksOptions {
  base: MaskChannel;
  overlay: MaskChannel;
  operation: SelectionOp;
}

const combinePixel = (baseValue: number, overlayValue: number, operation: SelectionOp): number => {
  switch (operation) {
    case "add":
      return Math.max(baseValue, overlayValue);
    case "subtract":
      return Math.max(MASK_TRANSPARENT, baseValue - overlayValue);
    case "intersect":
      return Math.min(baseValue, overlayValue);
    case "replace":
      return overlayValue;
  }
};

/** Pure combine of two masks; used to accumulate multi-shape/tool selections. */
export const combineMasks = ({ base, overlay, operation }: CombineMasksOptions): MaskChannel => {
  assertSameSize(base, overlay);

  const data = Uint8ClampedArray.from(base.data, (baseValue, pixelIndex) =>
    combinePixel(baseValue, overlay.data[pixelIndex] ?? MASK_TRANSPARENT, operation),
  );

  return { width: base.width, height: base.height, data };
};
