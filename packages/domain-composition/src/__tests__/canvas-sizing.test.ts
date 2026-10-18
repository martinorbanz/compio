import { describe, expect, it } from "vitest";
import { CANVAS_ANCHOR, crop, resizeCanvas, resizeImage } from "../operations/canvas-sizing";
import { createEmptyComposition } from "../operations/create-empty-composition";
import { addLayer } from "../operations/layer-operations";
import { baseLayerDefaults, LayerKind, type GroupLayer, type RasterLayer } from "../types/layer";
import { applyMatrixToPoint, identityMatrix, translationMatrix } from "../types/matrix2d";
import { createEmptyRaster } from "../types/raster-image-source";
import { createId } from "../utils/id";

const makeRasterLayer = (transform = identityMatrix()): Omit<RasterLayer, "zIndex"> => ({
  ...baseLayerDefaults(),
  id: createId(),
  name: "Raster",
  kind: LayerKind.RASTER,
  transform,
  image: createEmptyRaster({ width: 2, height: 2 }),
});

const makeGroupLayer = (childIds: string[]): Omit<GroupLayer, "zIndex"> => ({
  ...baseLayerDefaults(),
  id: createId(),
  name: "Group",
  kind: LayerKind.GROUP,
  transform: identityMatrix(),
  childIds,
});

describe("resizeImage", () => {
  it("scales canvasSize and every top-level layer's transform, leaving group children untouched", () => {
    let composition = createEmptyComposition({ width: 100, height: 50 });
    const child = makeRasterLayer();
    composition = addLayer(composition, child);
    const group = makeGroupLayer([child.id]);
    composition = addLayer(composition, group);

    const resized = resizeImage({ composition, size: { width: 200, height: 100 } });

    expect(resized.canvasSize).toEqual({ width: 200, height: 100 });
    const resizedGroup = resized.layers.find((layer) => layer.id === group.id);
    expect(applyMatrixToPoint(resizedGroup!.transform, { x: 10, y: 10 })).toEqual({
      x: 20,
      y: 20,
    });
    const resizedChild = resized.layers.find((layer) => layer.id === child.id);
    expect(resizedChild!.transform).toBe(child.transform);
  });
});

describe("resizeCanvas", () => {
  it("defaults to top-left anchor: canvas grows, content doesn't move", () => {
    let composition = createEmptyComposition({ width: 100, height: 100 });
    const layer = makeRasterLayer(translationMatrix(10, 10));
    composition = addLayer(composition, layer);

    const resized = resizeCanvas({ composition, size: { width: 150, height: 120 } });

    expect(resized.canvasSize).toEqual({ width: 150, height: 120 });
    const resizedLayer = resized.layers.find((candidate) => candidate.id === layer.id);
    expect(applyMatrixToPoint(resizedLayer!.transform, { x: 0, y: 0 })).toEqual({ x: 10, y: 10 });
  });

  it("center anchor shifts content by half the size delta", () => {
    let composition = createEmptyComposition({ width: 100, height: 100 });
    const layer = makeRasterLayer();
    composition = addLayer(composition, layer);

    const resized = resizeCanvas({
      composition,
      size: { width: 200, height: 160 },
      anchor: CANVAS_ANCHOR.CENTER,
    });

    const resizedLayer = resized.layers.find((candidate) => candidate.id === layer.id);
    expect(applyMatrixToPoint(resizedLayer!.transform, { x: 0, y: 0 })).toEqual({ x: 50, y: 30 });
  });
});

describe("crop", () => {
  it("shrinks the canvas to the rect and offsets content so the rect's top-left becomes the origin", () => {
    let composition = createEmptyComposition({ width: 100, height: 100 });
    const layer = makeRasterLayer();
    composition = addLayer(composition, layer);

    const cropped = crop({ composition, rect: { x: 10, y: 20, width: 30, height: 40 } });

    expect(cropped.canvasSize).toEqual({ width: 30, height: 40 });
    const croppedLayer = cropped.layers.find((candidate) => candidate.id === layer.id);
    expect(applyMatrixToPoint(croppedLayer!.transform, { x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
  });

  it("clamps a rect that extends past the canvas bounds", () => {
    const composition = createEmptyComposition({ width: 50, height: 50 });

    const cropped = crop({ composition, rect: { x: 40, y: 40, width: 30, height: 30 } });

    expect(cropped.canvasSize).toEqual({ width: 10, height: 10 });
  });
});
