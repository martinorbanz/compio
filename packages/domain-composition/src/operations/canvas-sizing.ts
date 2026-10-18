import type { Composition } from "../types/composition";
import { LayerKind, type GroupLayer, type Layer } from "../types/layer";
import { multiplyMatrix, scaleMatrix, translationMatrix, type Matrix2D } from "../types/matrix2d";
import type { Rect2D, Size2D, Vector2 } from "../types/vector2";

const touch = (): Pick<Composition, "updatedAt"> => ({
  updatedAt: new Date().toISOString(),
});

/**
 * A group's own transform already cascades onto its children multiplicatively
 * at render time (Canvas2D's context.transform stacks — see renderer-core's
 * drawLayer/drawGroupChildren), so remapping a child's transform here too
 * would double-apply the change. Mirrors renderer-core's own topLevelLayers
 * filter; duplicated rather than imported because renderer-core depends on
 * domain-composition, never the reverse.
 */
const mapTopLevelLayerTransforms = (
  composition: Composition,
  mapTransform: (transform: Matrix2D) => Matrix2D,
): Layer[] => {
  const childIds = new Set(
    composition.layers
      .filter((layer): layer is GroupLayer => layer.kind === LayerKind.GROUP)
      .flatMap((group) => group.childIds),
  );

  return composition.layers.map((layer) =>
    childIds.has(layer.id) ? layer : { ...layer, transform: mapTransform(layer.transform) },
  );
};

export interface ResizeImageOptions {
  composition: Composition;
  size: Size2D;
}

/** Scales canvas + every top-level layer's transform to fit `size`. Non-destructive: only matrices change, pixel data is never touched. */
export const resizeImage = ({ composition, size }: ResizeImageOptions): Composition => {
  const scale: Vector2 = {
    x: size.width / composition.canvasSize.width,
    y: size.height / composition.canvasSize.height,
  };
  const scaleFromOrigin = scaleMatrix(scale.x, scale.y);

  return {
    ...composition,
    canvasSize: size,
    layers: mapTopLevelLayerTransforms(composition, (transform) =>
      multiplyMatrix(scaleFromOrigin, transform),
    ),
    ...touch(),
  };
};

interface ResizeCanvasCoreOptions {
  composition: Composition;
  size: Size2D;
  offset: Vector2;
}

const resizeCanvasCore = ({ composition, size, offset }: ResizeCanvasCoreOptions): Composition => ({
  ...composition,
  canvasSize: size,
  layers: mapTopLevelLayerTransforms(composition, (transform) =>
    multiplyMatrix(translationMatrix(offset.x, offset.y), transform),
  ),
  ...touch(),
});

export const CANVAS_ANCHOR = {
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  TOP_RIGHT: "top-right",
  MIDDLE_LEFT: "middle-left",
  CENTER: "center",
  MIDDLE_RIGHT: "middle-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center",
  BOTTOM_RIGHT: "bottom-right",
} as const;
export type CanvasAnchor = (typeof CANVAS_ANCHOR)[keyof typeof CANVAS_ANCHOR];
export const CANVAS_ANCHORS = Object.values(CANVAS_ANCHOR);

/** Fractional position (0/0.5/1 per axis) of each anchor within the resized canvas — how much of the size delta shifts existing content. */
const ANCHOR_FACTOR: Record<CanvasAnchor, Vector2> = {
  [CANVAS_ANCHOR.TOP_LEFT]: { x: 0, y: 0 },
  [CANVAS_ANCHOR.TOP_CENTER]: { x: 0.5, y: 0 },
  [CANVAS_ANCHOR.TOP_RIGHT]: { x: 1, y: 0 },
  [CANVAS_ANCHOR.MIDDLE_LEFT]: { x: 0, y: 0.5 },
  [CANVAS_ANCHOR.CENTER]: { x: 0.5, y: 0.5 },
  [CANVAS_ANCHOR.MIDDLE_RIGHT]: { x: 1, y: 0.5 },
  [CANVAS_ANCHOR.BOTTOM_LEFT]: { x: 0, y: 1 },
  [CANVAS_ANCHOR.BOTTOM_CENTER]: { x: 0.5, y: 1 },
  [CANVAS_ANCHOR.BOTTOM_RIGHT]: { x: 1, y: 1 },
};

export interface ResizeCanvasOptions {
  composition: Composition;
  size: Size2D;
  /** Which side(s) absorb the size delta. Defaults to top-left (a no-op offset), matching the canvas's own top-left-origin convention. */
  anchor?: CanvasAnchor;
}

/** Resizes the canvas while keeping existing content's pixels untouched — only top-level layer transforms shift to stay anchored per `anchor`. */
export const resizeCanvas = ({
  composition,
  size,
  anchor = CANVAS_ANCHOR.TOP_LEFT,
}: ResizeCanvasOptions): Composition => {
  const factor = ANCHOR_FACTOR[anchor];
  const offset: Vector2 = {
    x: (size.width - composition.canvasSize.width) * factor.x,
    y: (size.height - composition.canvasSize.height) * factor.y,
  };

  return resizeCanvasCore({ composition, size, offset });
};

/** Pixel-aligned clamp of an arbitrary rect to the current canvas bounds — mirrors plugins-tools-core/utils/rasterize-shape.ts#clampBounds (not imported: wrong dependency direction). */
const clampRectToCanvas = (rect: Rect2D, canvasSize: Size2D): Rect2D => {
  const minX = Math.max(0, Math.floor(rect.x));
  const minY = Math.max(0, Math.floor(rect.y));
  const maxX = Math.min(canvasSize.width, Math.ceil(rect.x + rect.width));
  const maxY = Math.min(canvasSize.height, Math.ceil(rect.y + rect.height));

  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
};

export interface CropOptions {
  composition: Composition;
  /** Canvas-space rect to crop to. The caller is responsible for producing it — today that's the active selection's bounds, later it could be a dedicated crop tool. */
  rect: Rect2D;
}

/** Crops the canvas to `rect` — shares resizeCanvasCore's mechanism with a top-left-of-rect offset instead of a named anchor. */
export const crop = ({ composition, rect }: CropOptions): Composition => {
  const clamped = clampRectToCanvas(rect, composition.canvasSize);

  return resizeCanvasCore({
    composition,
    size: { width: clamped.width, height: clamped.height },
    offset: { x: -clamped.x, y: -clamped.y },
  });
};
