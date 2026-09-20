import { describe, expect, it } from "vitest";
import { blendBySelection } from "../operations/blend-by-selection";
import { MASK_OPAQUE, MASK_TRANSPARENT } from "../constants";
import { scaleMatrix } from "../types/matrix2d";
import type { RasterImageSource } from "../types/raster-image-source";
import type { MaskChannel } from "../types/mask-channel";

const IMAGE_WIDTH = 2;
const IMAGE_HEIGHT = 1;
const OPAQUE_ALPHA = 255;
const BLACK = 0;
const WHITE = 255;
const DARK_VALUE = 10;
const LIGHT_VALUE = 200;

const solidImage = (value: number): RasterImageSource => ({
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  data: new Uint8ClampedArray([
    value,
    value,
    value,
    OPAQUE_ALPHA,
    value,
    value,
    value,
    OPAQUE_ALPHA,
  ]),
});

describe("blendBySelection", () => {
  it("returns modified unchanged when there's no selection", () => {
    const original = solidImage(BLACK);
    const modified = solidImage(WHITE);

    expect(blendBySelection({ original, modified, selection: undefined })).toBe(modified);
  });

  it("keeps the original where the mask is fully transparent", () => {
    const original = solidImage(DARK_VALUE);
    const modified = solidImage(LIGHT_VALUE);
    const selection: MaskChannel = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray([MASK_TRANSPARENT, MASK_TRANSPARENT]),
    };

    const result = blendBySelection({ original, modified, selection });

    expect(Array.from(result.data)).toEqual(Array.from(original.data));
  });

  it("takes the modified value where the mask is fully opaque", () => {
    const original = solidImage(DARK_VALUE);
    const modified = solidImage(LIGHT_VALUE);
    const selection: MaskChannel = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray([MASK_OPAQUE, MASK_OPAQUE]),
    };

    const result = blendBySelection({ original, modified, selection });

    expect(Array.from(result.data)).toEqual(Array.from(modified.data));
  });

  it("blends partial selection values, and applies per-pixel independently", () => {
    const original = solidImage(BLACK);
    const modified = solidImage(LIGHT_VALUE);
    const selection: MaskChannel = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray([MASK_OPAQUE, MASK_TRANSPARENT]),
    };

    const result = blendBySelection({ original, modified, selection });

    expect(result.data[0]).toBe(LIGHT_VALUE);
    expect(result.data[4]).toBe(BLACK);
  });

  it("samples the mask by (x, y), not raw byte offset, when it's a different width than the image", () => {
    // Regression test: the selection is rasterized at canvas size, which is
    // often wider than an imported layer's own image — a flat-index lookup
    // would silently read the wrong row for every row after the first.
    const SQUARE_WIDTH = 2;
    const SQUARE_HEIGHT = 2;
    const CANVAS_WIDTH = 4;
    const CANVAS_HEIGHT = 2;
    const original: RasterImageSource = {
      width: SQUARE_WIDTH,
      height: SQUARE_HEIGHT,
      data: new Uint8ClampedArray(SQUARE_WIDTH * SQUARE_HEIGHT * 4)
        .fill(BLACK)
        .map((value, index) => ((index + 1) % 4 === 0 ? OPAQUE_ALPHA : value)),
    };
    const modified: RasterImageSource = {
      width: SQUARE_WIDTH,
      height: SQUARE_HEIGHT,
      data: new Uint8ClampedArray(original.data.length)
        .fill(LIGHT_VALUE)
        .map((value, index) => ((index + 1) % 4 === 0 ? OPAQUE_ALPHA : value)),
    };
    // Canvas-space mask, wider than the image: only local (1, 1) — canvas
    // index (1, 1) in a 4-wide buffer — is selected.
    const maskData = new Uint8ClampedArray(CANVAS_WIDTH * CANVAS_HEIGHT).fill(MASK_TRANSPARENT);
    const selectedCanvasX = 1;
    const selectedCanvasY = 1;
    maskData[selectedCanvasY * CANVAS_WIDTH + selectedCanvasX] = MASK_OPAQUE;
    const selection: MaskChannel = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, data: maskData };

    const result = blendBySelection({ original, modified, selection });

    const localPixelByteIndex = (x: number, y: number): number => (y * SQUARE_WIDTH + x) * 4;
    expect(result.data[localPixelByteIndex(1, 1)]).toBe(LIGHT_VALUE);
    expect(result.data[localPixelByteIndex(0, 0)]).toBe(BLACK);
    expect(result.data[localPixelByteIndex(1, 0)]).toBe(BLACK);
    expect(result.data[localPixelByteIndex(0, 1)]).toBe(BLACK);
  });

  it("forward-transforms local pixels through layerTransform before sampling a canvas-space selection", () => {
    const SQUARE_SIZE = 2;
    const SCALE_FACTOR = 2;
    const CANVAS_SIZE = 4;
    const original: RasterImageSource = {
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      data: new Uint8ClampedArray(SQUARE_SIZE * SQUARE_SIZE * 4)
        .fill(BLACK)
        .map((value, index) => ((index + 1) % 4 === 0 ? OPAQUE_ALPHA : value)),
    };
    const modified: RasterImageSource = {
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      data: new Uint8ClampedArray(original.data.length)
        .fill(LIGHT_VALUE)
        .map((value, index) => ((index + 1) % 4 === 0 ? OPAQUE_ALPHA : value)),
    };
    // Layer is scaled 2x, so local pixel (1, 1)'s footprint [1, 2) x [1, 2)
    // maps to canvas footprint [2, 4) x [2, 4) — a 2x2 block. Supersampling
    // averages several sub-pixel samples across that whole footprint, so it
    // must be uniformly opaque, not just its (3, 3) corner, for the sampler
    // to return an exact MASK_OPAQUE here.
    const maskData = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE).fill(MASK_TRANSPARENT);
    maskData[2 * CANVAS_SIZE + 2] = MASK_OPAQUE;
    maskData[2 * CANVAS_SIZE + 3] = MASK_OPAQUE;
    maskData[3 * CANVAS_SIZE + 2] = MASK_OPAQUE;
    maskData[3 * CANVAS_SIZE + 3] = MASK_OPAQUE;
    const selection: MaskChannel = { width: CANVAS_SIZE, height: CANVAS_SIZE, data: maskData };

    const result = blendBySelection({
      original,
      modified,
      selection,
      layerTransform: scaleMatrix(SCALE_FACTOR),
    });

    const localPixelByteIndex = (x: number, y: number): number => (y * SQUARE_SIZE + x) * 4;
    expect(result.data[localPixelByteIndex(1, 1)]).toBe(LIGHT_VALUE);
    expect(result.data[localPixelByteIndex(0, 0)]).toBe(BLACK);
    expect(result.data[localPixelByteIndex(1, 0)]).toBe(BLACK);
    expect(result.data[localPixelByteIndex(0, 1)]).toBe(BLACK);
  });
});
