import {
  MASK_OPAQUE,
  MASK_TRANSPARENT,
  type MaskChannel,
  type RasterImageSource,
} from "@compio/domain-composition";
import { describe, expect, it } from "vitest";
import { brightnessContrastEffect } from "../effects/brightness-contrast-effect";

const executionContext = {
  canvasSize: { width: 1, height: 1 },
  imageSize: { width: 1, height: 1 },
};

interface SolidPixelOptions {
  r: number;
  g: number;
  b: number;
  a?: number;
}

const solidPixel = ({ r, g, b, a = 255 }: SolidPixelOptions): RasterImageSource => ({
  width: 1,
  height: 1,
  data: new Uint8ClampedArray([r, g, b, a]),
});

describe("brightnessContrastEffect", () => {
  it("is a no-op at brightness=0, contrast=0", () => {
    const result = brightnessContrastEffect.execute({
      input: solidPixel({ r: 100, g: 150, b: 200 }),
      params: { brightness: 0, contrast: 0 },
      context: executionContext,
    });
    expect(Array.from(result.data)).toEqual([100, 150, 200, 255]);
  });

  it("increases channel values with positive brightness", () => {
    const result = brightnessContrastEffect.execute({
      input: solidPixel({ r: 100, g: 100, b: 100 }),
      params: { brightness: 50, contrast: 0 },
      context: executionContext,
    });
    expect(result.data[0]).toBeGreaterThan(100);
  });

  it("pushes mid-gray away from itself with increased contrast, leaving 128 unchanged", () => {
    const result = brightnessContrastEffect.execute({
      input: solidPixel({ r: 128, g: 200, b: 50 }),
      params: { brightness: 0, contrast: 80 },
      context: executionContext,
    });
    expect(result.data[0]).toBe(128);
    expect(result.data[1]).toBeGreaterThan(200);
    expect(result.data[2]).toBeLessThan(50);
  });

  it("preserves the alpha channel", () => {
    const result = brightnessContrastEffect.execute({
      input: solidPixel({ r: 10, g: 10, b: 10, a: 128 }),
      params: { brightness: 20, contrast: 20 },
      context: executionContext,
    });
    expect(result.data[3]).toBe(128);
  });

  it("only changes pixels covered by an active selection", () => {
    const MAX_BRIGHTNESS = 100;
    const NO_CONTRAST = 0;
    const GRAY_VALUE = 100;
    const OPAQUE_ALPHA = 255;
    const IMAGE_WIDTH = 2;
    const IMAGE_HEIGHT = 1;
    const selectedPixelByteIndex = 0;
    const unselectedPixelByteIndex = 4;

    const image: RasterImageSource = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray([
        GRAY_VALUE,
        GRAY_VALUE,
        GRAY_VALUE,
        OPAQUE_ALPHA,
        GRAY_VALUE,
        GRAY_VALUE,
        GRAY_VALUE,
        OPAQUE_ALPHA,
      ]),
    };
    const selection: MaskChannel = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      data: new Uint8ClampedArray([MASK_OPAQUE, MASK_TRANSPARENT]),
    };

    const result = brightnessContrastEffect.execute({
      input: image,
      params: { brightness: MAX_BRIGHTNESS, contrast: NO_CONTRAST },
      context: { ...executionContext, selection },
    });

    expect(result.data[selectedPixelByteIndex]).toBeGreaterThan(GRAY_VALUE);
    expect(result.data[unselectedPixelByteIndex]).toBe(GRAY_VALUE);
  });
});
