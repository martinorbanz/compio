import {
  BlendMode,
  LayerKind,
  baseLayerDefaults,
  createEmptyComposition,
  createEmptyRaster,
  identityMatrix,
  type Composition,
  type RasterImageSource,
  type RasterLayer,
} from "@compio/domain-composition";
import { describe, expect, it, vi } from "vitest";
import type { CanvasFactory, CanvasLike } from "../canvas/canvas-like";
import { renderComposition, type RenderPreviewOverride } from "../render-composition";

const FILLED_PIXEL_VALUE = 200;

const filledRaster = (width: number, height: number): RasterImageSource => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4).fill(FILLED_PIXEL_VALUE),
});

const createFakeCanvasFactory = (): {
  factory: CanvasFactory;
  drawImageCalls: unknown[][];
  putImageDataCalls: unknown[][];
  contexts: { globalCompositeOperation: string }[];
} => {
  const drawImageCalls: unknown[][] = [];
  const putImageDataCalls: unknown[][] = [];
  const contexts: { globalCompositeOperation: string }[] = [];
  const factory: CanvasFactory = (width, height) => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      transform: vi.fn(),
      drawImage: vi.fn((...args: unknown[]) => drawImageCalls.push(args)),
      putImageData: vi.fn((...args: unknown[]) => putImageDataCalls.push(args)),
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      fillStyle: "",
      font: "",
      textAlign: "left",
      textBaseline: "top",
      fillText: vi.fn(),
    };
    contexts.push(ctx);
    const canvas: CanvasLike = {
      width,
      height,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext: () => ctx as any,
    };
    return canvas;
  };
  return { factory, drawImageCalls, putImageDataCalls, contexts };
};

const rasterLayer = (overrides: Partial<RasterLayer> = {}): Omit<RasterLayer, "zIndex"> => ({
  ...baseLayerDefaults(),
  id: overrides.id ?? "layer-1",
  name: "Raster",
  kind: LayerKind.RASTER,
  transform: identityMatrix(),
  image: createEmptyRaster({ width: 2, height: 2 }),
  ...overrides,
});

describe("renderComposition", () => {
  it("draws each visible top-level layer once", () => {
    const { factory, drawImageCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer(), zIndex: 0 }] };

    renderComposition(composition, { canvasFactory: factory });

    expect(drawImageCalls).toHaveLength(1);
  });

  it("skips invisible layers", () => {
    const { factory, drawImageCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ visible: false }), zIndex: 0 }] };

    renderComposition(composition, { canvasFactory: factory });

    expect(drawImageCalls).toHaveLength(0);
  });

  it("maps BlendMode.NORMAL to Canvas2D's source-over — Canvas2D has no 'normal' composite operation", () => {
    const { factory, contexts } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = {
      ...composition,
      layers: [{ ...rasterLayer({ blendMode: BlendMode.NORMAL }), zIndex: 0 }],
    };

    renderComposition(composition, { canvasFactory: factory });

    expect(contexts[0]?.globalCompositeOperation).toBe("source-over");
  });

  it("passes non-normal blend modes straight through to globalCompositeOperation", () => {
    const { factory, contexts } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = {
      ...composition,
      layers: [{ ...rasterLayer({ blendMode: BlendMode.MULTIPLY }), zIndex: 0 }],
    };

    renderComposition(composition, { canvasFactory: factory });

    expect(contexts[0]?.globalCompositeOperation).toBe("multiply");
  });

  it("renders group children but not the group itself as a separate draw", () => {
    const { factory, drawImageCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    const child = { ...rasterLayer({ id: "child-1" }), zIndex: 1 };
    const group = {
      ...baseLayerDefaults(),
      id: "group-1",
      name: "Group",
      kind: LayerKind.GROUP as const,
      transform: identityMatrix(),
      childIds: ["child-1"],
      zIndex: 0,
    };
    composition = { ...composition, layers: [child, group] };

    renderComposition(composition, { canvasFactory: factory });

    // Only the child raster layer issues a drawImage call; the group itself has no image content.
    expect(drawImageCalls).toHaveLength(1);
  });

  it("reuses the raster surface across renders when layer.image is unchanged", () => {
    const { factory, putImageDataCalls } = createFakeCanvasFactory();
    const image = createEmptyRaster({ width: 2, height: 2 });
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ image }), zIndex: 0 }] };

    renderComposition(composition, { canvasFactory: factory });
    renderComposition(composition, { canvasFactory: factory });

    // A pure transform drag re-renders without ever touching layer.image —
    // putImageData (the expensive pixel decode) should only happen once.
    expect(putImageDataCalls).toHaveLength(1);
  });

  it("re-decodes when layer.image is replaced with a new object", () => {
    const { factory, putImageDataCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = {
      ...composition,
      layers: [
        { ...rasterLayer({ image: createEmptyRaster({ width: 2, height: 2 }) }), zIndex: 0 },
      ],
    };

    renderComposition(composition, { canvasFactory: factory });
    composition = {
      ...composition,
      layers: [
        { ...rasterLayer({ image: createEmptyRaster({ width: 2, height: 2 }) }), zIndex: 0 },
      ],
    };
    renderComposition(composition, { canvasFactory: factory });

    expect(putImageDataCalls).toHaveLength(2);
  });

  it("draws a previewOverride's image instead of the matching layer's own image", () => {
    const { factory, putImageDataCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ id: "layer-1" }), zIndex: 0 }] };
    const previewOverride: RenderPreviewOverride = {
      layerId: "layer-1",
      image: filledRaster(2, 2),
    };

    renderComposition(composition, { canvasFactory: factory, previewOverride });

    expect(putImageDataCalls).toHaveLength(1);
    const drawnImageData = putImageDataCalls[0]?.[0] as { data: Uint8ClampedArray };
    expect(drawnImageData.data[0]).toBe(FILLED_PIXEL_VALUE);
  });

  it("uses the plain drawImage call, not the stretch form, when the previewOverride is already the layer's real size", () => {
    const { factory, drawImageCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ id: "layer-1" }), zIndex: 0 }] };
    const previewOverride: RenderPreviewOverride = {
      layerId: "layer-1",
      image: filledRaster(2, 2), // same 2x2 size as rasterLayer()'s default image
    };

    renderComposition(composition, { canvasFactory: factory, previewOverride });

    expect(drawImageCalls[0]?.slice(1)).toEqual([0, 0]);
  });

  it("stretches a smaller previewOverride image up to the real layer's size via drawImage, without any extra pixel read-back", () => {
    const { factory, drawImageCalls, putImageDataCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = {
      ...composition,
      layers: [
        {
          ...rasterLayer({ id: "layer-1", image: createEmptyRaster({ width: 8, height: 8 }) }),
          zIndex: 0,
        },
      ],
    };
    const previewOverride: RenderPreviewOverride = {
      layerId: "layer-1",
      image: filledRaster(2, 2),
    };

    renderComposition(composition, { canvasFactory: factory, previewOverride });

    // Exactly one putImageData (decoding the small 2x2 override) — no separate upscale/read-back pass.
    expect(putImageDataCalls).toHaveLength(1);
    expect(drawImageCalls).toHaveLength(1);
    expect(drawImageCalls[0]?.slice(1)).toEqual([0, 0, 2, 2, 0, 0, 8, 8]);
  });

  it("ignores a previewOverride whose layerId matches nothing", () => {
    const { factory, drawImageCalls, putImageDataCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ id: "layer-1" }), zIndex: 0 }] };
    const previewOverride: RenderPreviewOverride = {
      layerId: "no-such-layer",
      image: filledRaster(2, 2),
    };

    expect(() =>
      renderComposition(composition, { canvasFactory: factory, previewOverride }),
    ).not.toThrow();
    expect(drawImageCalls).toHaveLength(1);
    const drawnImageData = putImageDataCalls[0]?.[0] as { data: Uint8ClampedArray };
    expect(drawnImageData.data[0]).toBe(0);
  });

  it("ignores a previewOverride targeting a non-RASTER layer", () => {
    const { factory, drawImageCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    const group = {
      ...baseLayerDefaults(),
      id: "group-1",
      name: "Group",
      kind: LayerKind.GROUP as const,
      transform: identityMatrix(),
      childIds: [] as string[],
      zIndex: 0,
    };
    composition = { ...composition, layers: [group] };
    const previewOverride: RenderPreviewOverride = {
      layerId: "group-1",
      image: filledRaster(2, 2),
    };

    expect(() =>
      renderComposition(composition, { canvasFactory: factory, previewOverride }),
    ).not.toThrow();
    expect(drawImageCalls).toHaveLength(0);
  });

  it("never mutates composition/layer.image — rendering without an override afterward shows the real image again", () => {
    const { factory, putImageDataCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ id: "layer-1" }), zIndex: 0 }] };
    const previewOverride: RenderPreviewOverride = {
      layerId: "layer-1",
      image: filledRaster(2, 2),
    };

    renderComposition(composition, { canvasFactory: factory, previewOverride });
    renderComposition(composition, { canvasFactory: factory });

    expect(putImageDataCalls).toHaveLength(2);
    const previewImageData = putImageDataCalls[0]?.[0] as { data: Uint8ClampedArray };
    const realImageData = putImageDataCalls[1]?.[0] as { data: Uint8ClampedArray };
    expect(previewImageData.data[0]).toBe(FILLED_PIXEL_VALUE);
    expect(realImageData.data[0]).toBe(0);
  });

  it("substitutes a previewOverride for a raster layer nested inside a group", () => {
    const { factory, putImageDataCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    const child = { ...rasterLayer({ id: "child-1" }), zIndex: 1 };
    const group = {
      ...baseLayerDefaults(),
      id: "group-1",
      name: "Group",
      kind: LayerKind.GROUP as const,
      transform: identityMatrix(),
      childIds: ["child-1"],
      zIndex: 0,
    };
    composition = { ...composition, layers: [child, group] };
    const previewOverride: RenderPreviewOverride = {
      layerId: "child-1",
      image: filledRaster(2, 2),
    };

    renderComposition(composition, { canvasFactory: factory, previewOverride });

    const drawnImageData = putImageDataCalls[0]?.[0] as { data: Uint8ClampedArray };
    expect(drawnImageData.data[0]).toBe(FILLED_PIXEL_VALUE);
  });
});
