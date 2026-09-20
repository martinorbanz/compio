import type { RasterImageSource } from "@compio/domain-composition";
import { describe, expect, it, vi } from "vitest";
import type { CanvasFactory, CanvasLike } from "../canvas/canvas-like";
import { resizeRasterImage } from "../resize-raster-image";

const OUTPUT_FILL_VALUE = 77;

const createFakeCanvasFactory = (): {
  factory: CanvasFactory;
  drawImageCalls: unknown[][];
  putImageDataCalls: unknown[][];
} => {
  const drawImageCalls: unknown[][] = [];
  const putImageDataCalls: unknown[][] = [];
  const factory: CanvasFactory = (width, height) => {
    const ctx = {
      drawImage: vi.fn((...args: unknown[]) => drawImageCalls.push(args)),
      putImageData: vi.fn((...args: unknown[]) => putImageDataCalls.push(args)),
      // Must mirror the native getImageData(sx, sy, sw, sh) signature exactly.
      // eslint-disable-next-line max-params
      getImageData: vi.fn(
        (sourceX: number, sourceY: number, requestedWidth: number, requestedHeight: number) => ({
          data: new Uint8ClampedArray(requestedWidth * requestedHeight * 4).fill(OUTPUT_FILL_VALUE),
          width: requestedWidth,
          height: requestedHeight,
        }),
      ),
    };
    const canvas: CanvasLike = {
      width,
      height,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext: () => ctx as any,
    };
    return canvas;
  };
  return { factory, drawImageCalls, putImageDataCalls };
};

describe("resizeRasterImage", () => {
  it("draws the source onto a target-sized surface and reads back its pixels", () => {
    const { factory, drawImageCalls, putImageDataCalls } = createFakeCanvasFactory();
    const image: RasterImageSource = {
      width: 8,
      height: 8,
      data: new Uint8ClampedArray(8 * 8 * 4),
    };

    const result = resizeRasterImage(image, {
      targetSize: { width: 2, height: 2 },
      canvasFactory: factory,
    });

    expect(putImageDataCalls).toHaveLength(1);
    expect(drawImageCalls).toHaveLength(1);
    expect(drawImageCalls[0]?.slice(1)).toEqual([0, 0, 2, 2]);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.data[0]).toBe(OUTPUT_FILL_VALUE);
  });

  it("never mutates the input image", () => {
    const { factory } = createFakeCanvasFactory();
    const image: RasterImageSource = {
      width: 4,
      height: 4,
      data: new Uint8ClampedArray(4 * 4 * 4),
    };
    const originalData = image.data;

    resizeRasterImage(image, { targetSize: { width: 2, height: 2 }, canvasFactory: factory });

    expect(image.data).toBe(originalData);
  });
});
