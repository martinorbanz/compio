import { describe, expect, it } from "vitest";
import { MASK_OPAQUE, MASK_TRANSPARENT } from "../constants";
import { identityMatrix, scaleMatrix, translationMatrix } from "../types/matrix2d";
import { createMaskSampler, type MaskChannel } from "../types/mask-channel";

describe("createMaskSampler", () => {
  describe("identity transform", () => {
    it("point-samples by flooring local coordinates, unaffected by supersampling", () => {
      const mask: MaskChannel = {
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([MASK_TRANSPARENT, MASK_OPAQUE, MASK_OPAQUE, MASK_TRANSPARENT]),
      };
      const sampleAt = createMaskSampler({ mask, layerTransform: identityMatrix() });

      expect(sampleAt({ x: 0, y: 0 })).toBe(MASK_TRANSPARENT);
      expect(sampleAt({ x: 1, y: 0 })).toBe(MASK_OPAQUE);
      expect(sampleAt({ x: 0, y: 1 })).toBe(MASK_OPAQUE);
      expect(sampleAt({ x: 1, y: 1 })).toBe(MASK_TRANSPARENT);
      // Fractional input floors to its containing pixel — no center offset
      // or averaging on the identity fast path.
      expect(sampleAt({ x: 0.9, y: 0.9 })).toBe(MASK_TRANSPARENT);
    });
  });

  describe("non-identity transform, footprint fully inside a uniform region", () => {
    it("still returns an exact MASK_OPAQUE/MASK_TRANSPARENT (regression safety)", () => {
      const SCALE_FACTOR = 2;
      const CANVAS_SIZE = 4;
      const data = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE).fill(MASK_TRANSPARENT);
      // Local pixel (1, 1)'s footprint [1, 2) x [1, 2) scales to canvas
      // footprint [2, 4) x [2, 4) — fill that whole 2x2 block, not just its
      // center pixel, so every sub-sample within it agrees.
      data[2 * CANVAS_SIZE + 2] = MASK_OPAQUE;
      data[2 * CANVAS_SIZE + 3] = MASK_OPAQUE;
      data[3 * CANVAS_SIZE + 2] = MASK_OPAQUE;
      data[3 * CANVAS_SIZE + 3] = MASK_OPAQUE;
      const mask: MaskChannel = { width: CANVAS_SIZE, height: CANVAS_SIZE, data };
      const sampleAt = createMaskSampler({ mask, layerTransform: scaleMatrix(SCALE_FACTOR) });

      expect(sampleAt({ x: 1, y: 1 })).toBe(MASK_OPAQUE);
      expect(sampleAt({ x: 0, y: 0 })).toBe(MASK_TRANSPARENT);
    });
  });

  describe("non-identity transform, footprint straddling a mask edge", () => {
    it("averages a fractional weight — the actual anti-aliasing behavior", () => {
      const TRANSLATE_X = 0.5;
      // Vertical hard edge in canvas space: column 0 transparent, column 1 opaque.
      const mask: MaskChannel = {
        width: 2,
        height: 1,
        data: new Uint8ClampedArray([MASK_TRANSPARENT, MASK_OPAQUE]),
      };
      const sampleAt = createMaskSampler({
        mask,
        layerTransform: translationMatrix(TRANSLATE_X, 0),
      });

      // Local pixel (0, 0)'s footprint [0, 1) x [0, 1) shifts by +0.5 to
      // canvas [0.5, 1.5) x [0, 1). The 4x4 grid's column offsets are
      // 0.125/0.375/0.625/0.875; +0.5 gives canvas x = 0.625/0.875/1.125/1.375.
      // The first two columns floor into canvas column 0 (transparent), the
      // last two into column 1 (opaque) — 8 of 16 samples read MASK_OPAQUE,
      // 8 read MASK_TRANSPARENT: (8 * 0 + 8 * 255) / 16 = 127.5.
      expect(sampleAt({ x: 0, y: 0 })).toBe(127.5);
    });
  });
});
