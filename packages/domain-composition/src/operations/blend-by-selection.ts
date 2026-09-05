import { MASK_OPAQUE } from "../constants";
import { identityMatrix, type Matrix2D } from "../types/matrix2d";
import { createMaskSampler, type MaskChannel } from "../types/mask-channel";
import type { RasterImageSource } from "../types/raster-image-source";

const CHANNELS_PER_PIXEL = 4;

export interface BlendBySelectionOptions {
  original: RasterImageSource;
  modified: RasterImageSource;
  /** No selection means "whole layer" — modified is returned untouched. */
  selection: MaskChannel | undefined;
  /** `selection` lives in canvas space; this maps `original`'s local pixels into it. Defaults to identity. */
  layerTransform?: Matrix2D;
}

/**
 * Confines an effect's result to the active selection by blending it back
 * toward the original per pixel, weighted by the mask. Lives here (not in a
 * plugin package) because it only touches domain types and every current and
 * future effect plugin needs the same behavior — see CLAUDE.md on plugins
 * staying pure and not duplicating cross-cutting logic.
 */
export const blendBySelection = ({
  original,
  modified,
  selection,
  layerTransform = identityMatrix(),
}: BlendBySelectionOptions): RasterImageSource => {
  if (!selection) return modified;

  const sampleSelectionAt = createMaskSampler({ mask: selection, layerTransform });

  const data = Uint8ClampedArray.from(original.data, (originalValue, byteOffset) => {
    const pixelIndex = Math.floor(byteOffset / CHANNELS_PER_PIXEL);
    const pixelX = pixelIndex % original.width;
    const pixelY = Math.floor(pixelIndex / original.width);
    const selectionWeight = sampleSelectionAt({ x: pixelX, y: pixelY }) / MASK_OPAQUE;
    const modifiedValue = modified.data[byteOffset] ?? 0;

    return originalValue + (modifiedValue - originalValue) * selectionWeight;
  });

  return { width: original.width, height: original.height, data };
};
