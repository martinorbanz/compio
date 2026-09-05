import { describe, expect, it } from "vitest";
import { createEmptyComposition } from "../operations/create-empty-composition";
import { addLayer, removeLayer } from "../operations/layer-operations";
import { compositionFromJSON } from "../serialization/composition-from-json";
import { compositionToJSON } from "../serialization/composition-to-json";
import { identityMatrix } from "../types/matrix2d";
import { baseLayerDefaults, LayerKind, type RasterLayer } from "../types/layer";
import { createEmptyRaster } from "../types/raster-image-source";
import { createId } from "../utils/id";

const makeRasterLayer = (): Omit<RasterLayer, "zIndex"> => ({
  ...baseLayerDefaults(),
  id: createId(),
  name: "Layer 1",
  kind: LayerKind.RASTER,
  transform: identityMatrix(),
  image: createEmptyRaster({ width: 2, height: 2 }),
});

describe("composition operations", () => {
  it("adds and removes layers, keeping zIndex contiguous", () => {
    let composition = createEmptyComposition({ width: 100, height: 100 });
    composition = addLayer(composition, makeRasterLayer());
    composition = addLayer(composition, makeRasterLayer());
    expect(composition.layers.map((layer) => layer.zIndex)).toEqual([0, 1]);

    const firstId = composition.layers[0]?.id;
    expect(firstId).toBeDefined();
    composition = removeLayer(composition, firstId as string);
    expect(composition.layers).toHaveLength(1);
    expect(composition.layers[0]?.zIndex).toBe(0);
  });

  it("round-trips through JSON with the raw raster codec", async () => {
    let composition = createEmptyComposition({ width: 4, height: 4 });
    const layer = makeRasterLayer();
    layer.image.data.set([255, 0, 0, 255]);
    composition = addLayer(composition, layer);

    const json = compositionToJSON(composition);
    const restored = await compositionFromJSON(json);

    expect(restored.canvasSize).toEqual(composition.canvasSize);
    expect(restored.layers).toHaveLength(1);
    const restoredLayer = restored.layers[0] as RasterLayer;
    expect(Array.from(restoredLayer.image.data.slice(0, 4))).toEqual([255, 0, 0, 255]);
  });
});
