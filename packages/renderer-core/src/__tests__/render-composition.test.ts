import {
  LayerKind,
  baseLayerDefaults,
  createEmptyComposition,
  createEmptyRaster,
  identityMatrix,
  type Composition,
  type RasterLayer,
} from "@compio/domain-composition";
import { describe, expect, it, vi } from "vitest";
import type { CanvasFactory, CanvasLike } from "../canvas/canvas-like";
import { renderComposition } from "../render-composition";

const createFakeCanvasFactory = (): {
  factory: CanvasFactory;
  drawImageCalls: unknown[][];
  putImageDataCalls: unknown[][];
} => {
  const drawImageCalls: unknown[][] = [];
  const putImageDataCalls: unknown[][] = [];
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

    renderComposition(composition, factory);

    expect(drawImageCalls).toHaveLength(1);
  });

  it("skips invisible layers", () => {
    const { factory, drawImageCalls } = createFakeCanvasFactory();
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ visible: false }), zIndex: 0 }] };

    renderComposition(composition, factory);

    expect(drawImageCalls).toHaveLength(0);
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

    renderComposition(composition, factory);

    // Only the child raster layer issues a drawImage call; the group itself has no image content.
    expect(drawImageCalls).toHaveLength(1);
  });

  it("reuses the raster surface across renders when layer.image is unchanged", () => {
    const { factory, putImageDataCalls } = createFakeCanvasFactory();
    const image = createEmptyRaster({ width: 2, height: 2 });
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = { ...composition, layers: [{ ...rasterLayer({ image }), zIndex: 0 }] };

    renderComposition(composition, factory);
    renderComposition(composition, factory);

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

    renderComposition(composition, factory);
    composition = {
      ...composition,
      layers: [
        { ...rasterLayer({ image: createEmptyRaster({ width: 2, height: 2 }) }), zIndex: 0 },
      ],
    };
    renderComposition(composition, factory);

    expect(putImageDataCalls).toHaveLength(2);
  });
});
