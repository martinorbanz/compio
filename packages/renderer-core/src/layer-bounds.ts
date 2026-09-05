import { LayerKind, type Layer, type Size2D } from "@compio/domain-composition";

const LINE_HEIGHT_FACTOR = 1.2;
const FALLBACK_GROUP_SIZE = 100;
let measureCanvas: HTMLCanvasElement | null = null;

/**
 * Local (untransformed) content bounds — the box a layer's transform matrix
 * is applied to. Lives in renderer-core (not the app) because it already
 * needs the DOM (canvas text measurement) — the same deliberate exception
 * documented for the rest of this package.
 */
export const getLayerLocalBounds = (layer: Layer): Size2D => {
  switch (layer.kind) {
    case LayerKind.RASTER:
      return { width: layer.image.width, height: layer.image.height };
    case LayerKind.TEXT: {
      measureCanvas ??= document.createElement("canvas");
      const context = measureCanvas.getContext("2d");
      if (!context) return { width: layer.font.size, height: layer.font.size * LINE_HEIGHT_FACTOR };

      context.font = `${layer.font.italic ? "italic " : ""}${layer.font.weight} ${layer.font.size}px ${layer.font.family}`;
      const width = Math.max(context.measureText(layer.text).width, 1);

      return { width, height: layer.font.size * LINE_HEIGHT_FACTOR };
    }
    case LayerKind.GROUP:
      // Groups aren't exposed in the UI yet (see README Roadmap); a fixed
      // fallback keeps bounds well-defined if one is ever loaded.
      return { width: FALLBACK_GROUP_SIZE, height: FALLBACK_GROUP_SIZE };
  }
};
