import {
  addLayer,
  baseLayerDefaults,
  createEmptyComposition,
  createEmptyRaster,
  createId,
  identityMatrix,
  LayerKind,
  type RasterLayer,
} from "@compio/domain-composition";
import { describe, expect, it } from "vitest";
import { compositionToJSON } from "@compio/domain-composition";
import { importCompositionFromJsonFile } from "../compio-json";

describe("importCompositionFromJsonFile", () => {
  it("round-trips a composition through a File", async () => {
    let composition = createEmptyComposition({ width: 3, height: 3 });
    const layer: Omit<RasterLayer, "zIndex"> = {
      ...baseLayerDefaults(),
      id: createId(),
      name: "Layer",
      kind: LayerKind.RASTER,
      transform: identityMatrix(),
      image: createEmptyRaster({ width: 3, height: 3 }),
    };
    composition = addLayer(composition, layer);

    const json = compositionToJSON(composition);
    const file = new File([JSON.stringify(json)], "test.compio.json", { type: "application/json" });

    const restored = await importCompositionFromJsonFile(file);
    expect(restored.layers).toHaveLength(1);
    expect(restored.canvasSize).toEqual({ width: 3, height: 3 });
  });
});
