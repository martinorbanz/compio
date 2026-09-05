import {
  MASK_OPAQUE,
  MASK_TRANSPARENT,
  translationMatrix,
  type MaskChannel,
} from "@compio/domain-composition";
import { describe, expect, it } from "vitest";
import { paintStroke } from "../utils/paint-brush";

const IMAGE_WIDTH = 4;
const IMAGE_HEIGHT = 4;
const CANVAS_WIDTH = 8;
const CANVAS_HEIGHT = 4;
const OPAQUE_COLOR = { r: 255, g: 0, b: 0, a: 1 };
const FULL_OPACITY_SETTINGS = { radius: 10, hardness: 1, opacity: 1 };

describe("paintStroke selection clipping", () => {
  it("samples the mask by (x, y) when it's a different width than the image being painted", () => {
    // Regression test: the selection is rasterized at canvas size, which is
    // often wider than an imported layer's own image — a flat-index lookup
    // into selection.data using the image's own stride would silently clip
    // against the wrong row past the first.
    const emptyImage = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray(IMAGE_WIDTH * IMAGE_HEIGHT * 4),
    };
    const maskData = new Uint8ClampedArray(CANVAS_WIDTH * CANVAS_HEIGHT).fill(MASK_TRANSPARENT);
    const selectedCanvasX = 2;
    const selectedCanvasY = 2;
    maskData[selectedCanvasY * CANVAS_WIDTH + selectedCanvasX] = MASK_OPAQUE;
    const selection: MaskChannel = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, data: maskData };

    const result = paintStroke({
      image: emptyImage,
      points: [{ x: IMAGE_WIDTH / 2, y: IMAGE_HEIGHT / 2 }],
      color: OPAQUE_COLOR,
      settings: FULL_OPACITY_SETTINGS,
      selection,
    });

    const alphaAt = (x: number, y: number): number =>
      result.data[(y * IMAGE_WIDTH + x) * 4 + 3] ?? 0;
    expect(alphaAt(selectedCanvasX, selectedCanvasY)).toBeGreaterThan(0);
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(1, 1)).toBe(0);
    expect(alphaAt(3, 3)).toBe(0);
  });

  it("forward-transforms local stamp pixels through layerTransform before sampling the selection", () => {
    const TRANSLATE_X = 4;
    const emptyImage = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray(IMAGE_WIDTH * IMAGE_HEIGHT * 4),
    };
    // Layer translated by (4, 0): local pixel (2, 2)'s center (2.5, 2.5)
    // lands at canvas (6.5, 2.5) — select only canvas pixel (6, 2).
    const maskData = new Uint8ClampedArray(CANVAS_WIDTH * CANVAS_HEIGHT).fill(MASK_TRANSPARENT);
    const selectedCanvasX = 6;
    const selectedCanvasY = 2;
    maskData[selectedCanvasY * CANVAS_WIDTH + selectedCanvasX] = MASK_OPAQUE;
    const selection: MaskChannel = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, data: maskData };

    const result = paintStroke({
      image: emptyImage,
      points: [{ x: 2.5, y: 2.5 }],
      color: OPAQUE_COLOR,
      settings: { radius: 1, hardness: 1, opacity: 1 },
      selection,
      layerTransform: translationMatrix(TRANSLATE_X, 0),
    });

    const alphaAt = (x: number, y: number): number =>
      result.data[(y * IMAGE_WIDTH + x) * 4 + 3] ?? 0;
    // Local (2, 2) maps to the selected canvas pixel — painted.
    expect(alphaAt(2, 2)).toBeGreaterThan(0);
    // Local (1, 2) is within the brush's falloff radius but maps to an unselected canvas pixel.
    expect(alphaAt(1, 2)).toBe(0);
  });
});
