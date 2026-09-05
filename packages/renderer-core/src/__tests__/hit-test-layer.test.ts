import {
  addLayer,
  baseLayerDefaults,
  createEmptyComposition,
  createEmptyRaster,
  identityMatrix,
  LayerKind,
  translationMatrix,
  type Composition,
  type RasterLayer,
} from "@compio/domain-composition";
import { describe, expect, it } from "vitest";
import { hitTestLayer } from "../hit-test-layer";

const opaqueRasterLayer = (overrides: Partial<RasterLayer> = {}): Omit<RasterLayer, "zIndex"> => {
  const image = createEmptyRaster({ width: 4, height: 4 });
  image.data.fill(255);

  return {
    ...baseLayerDefaults(),
    id: overrides.id ?? "layer-1",
    name: "Raster",
    kind: LayerKind.RASTER,
    transform: identityMatrix(),
    image,
    ...overrides,
  };
};

describe("hitTestLayer", () => {
  it("returns null when the point is outside every layer's bounds", () => {
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = addLayer(composition, opaqueRasterLayer());

    expect(hitTestLayer(composition, { x: 20, y: 20 })).toBeNull();
  });

  it("returns null on a fully transparent pixel, letting the click pass through", () => {
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    const transparentLayer = opaqueRasterLayer();
    transparentLayer.image.data.fill(0);
    composition = addLayer(composition, transparentLayer);

    expect(hitTestLayer(composition, { x: 1, y: 1 })).toBeNull();
  });

  it("returns the layer when the point lands on an opaque pixel", () => {
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = addLayer(composition, opaqueRasterLayer());

    expect(hitTestLayer(composition, { x: 1, y: 1 })?.id).toBe("layer-1");
  });

  it("prefers the topmost of two overlapping opaque layers", () => {
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = addLayer(composition, opaqueRasterLayer({ id: "bottom" }));
    composition = addLayer(composition, opaqueRasterLayer({ id: "top" }));

    expect(hitTestLayer(composition, { x: 1, y: 1 })?.id).toBe("top");
  });

  it("skips invisible layers", () => {
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = addLayer(composition, opaqueRasterLayer({ id: "hidden", visible: false }));

    expect(hitTestLayer(composition, { x: 1, y: 1 })).toBeNull();
  });

  it("accounts for the layer's own transform", () => {
    let composition: Composition = createEmptyComposition({ width: 10, height: 10 });
    composition = addLayer(composition, opaqueRasterLayer({ transform: translationMatrix(5, 5) }));

    expect(hitTestLayer(composition, { x: 1, y: 1 })).toBeNull();
    expect(hitTestLayer(composition, { x: 6, y: 6 })?.id).toBe("layer-1");
  });
});
