import {
  LayerKind,
  MASK_OPAQUE,
  type Composition,
  type GroupLayer,
  type Layer,
  type MaskChannel,
  type RasterImageSource,
  type RasterLayer,
  type Size2D,
  type TextLayer,
} from "@compio/domain-composition";
import { type Canvas2DContext, type CanvasFactory, createDomCanvas } from "./canvas/canvas-like";

type CanvasLikeResult = ReturnType<CanvasFactory>;

/**
 * Raw (pre-mask) raster surfaces keyed by `layer.image` object identity.
 * Every paint/effect op replaces `image` with a new object rather than
 * mutating it in place, so identity is a valid cache key — a drag that only
 * changes `layer.transform` reuses the surface instead of re-decoding pixels
 * every frame. WeakMap-keyed, so entries drop once an image is no longer
 * referenced by any layer; safe as module scope for that reason.
 */
const rawRasterSurfaceCache = new WeakMap<RasterImageSource, CanvasLikeResult>();
/** Bridges our minimal CanvasLike port to the DOM's CanvasImageSource union for drawImage(). */
const asImageSource = (surface: CanvasLikeResult): CanvasImageSource =>
  surface as unknown as CanvasImageSource;

export interface ApplyMaskOptions {
  context: Canvas2DContext;
  mask: MaskChannel;
  canvasFactory: CanvasFactory;
}

/** Applies a grayscale mask to already-drawn content via destination-in compositing. */
const applyMask = ({ context, mask, canvasFactory }: ApplyMaskOptions): void => {
  const maskSurface = canvasFactory(mask.width, mask.height);
  const maskContext = maskSurface.getContext("2d");
  if (!maskContext) return;

  const alphaData = new Uint8ClampedArray(mask.width * mask.height * 4);
  mask.data.forEach((maskValue, pixelIndex) => {
    const byteOffset = pixelIndex * 4;
    alphaData[byteOffset] = MASK_OPAQUE;
    alphaData[byteOffset + 1] = MASK_OPAQUE;
    alphaData[byteOffset + 2] = MASK_OPAQUE;
    alphaData[byteOffset + 3] = maskValue;
  });

  maskContext.putImageData(new ImageData(alphaData, mask.width, mask.height), 0, 0);

  context.globalCompositeOperation = "destination-in";
  context.drawImage(asImageSource(maskSurface), 0, 0);
  context.globalCompositeOperation = "source-over";
};

const getRawRasterSurface = (
  image: RasterImageSource,
  canvasFactory: CanvasFactory,
): CanvasLikeResult => {
  const cached = rawRasterSurfaceCache.get(image);
  if (cached) return cached;

  const surface = canvasFactory(image.width, image.height);
  const context = surface.getContext("2d");
  if (!context) throw new Error("2D context unavailable for raster layer");

  context.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  rawRasterSurfaceCache.set(image, surface);
  return surface;
};

const drawRasterLayer = (layer: RasterLayer, canvasFactory: CanvasFactory): CanvasLikeResult => {
  const rawSurface = getRawRasterSurface(layer.image, canvasFactory);
  if (!layer.mask) return rawSurface;

  // Masking composites destination-in onto the surface in place — copy onto
  // a working surface first so the cached raw surface stays reusable.
  const maskedSurface = canvasFactory(layer.image.width, layer.image.height);
  const maskedContext = maskedSurface.getContext("2d");
  if (!maskedContext) throw new Error("2D context unavailable for raster layer");

  maskedContext.drawImage(asImageSource(rawSurface), 0, 0);
  applyMask({ context: maskedContext, mask: layer.mask, canvasFactory });
  return maskedSurface;
};

export interface DrawTextLayerOptions {
  layer: TextLayer;
  canvasSize: Size2D;
  canvasFactory: CanvasFactory;
}

const drawTextLayer = ({
  layer,
  canvasSize,
  canvasFactory,
}: DrawTextLayerOptions): CanvasLikeResult => {
  const surface = canvasFactory(canvasSize.width, canvasSize.height);
  const context = surface.getContext("2d");
  if (!context) throw new Error("2D context unavailable for text layer");

  const { r, g, b, a } = layer.color;
  context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
  context.font = `${layer.font.italic ? "italic " : ""}${layer.font.weight} ${layer.font.size}px ${layer.font.family}`;
  context.textAlign = layer.align as unknown as CanvasTextAlign;
  context.textBaseline = "top";
  context.fillText(layer.text, 0, 0);

  return surface;
};

export interface DrawLayerOptions {
  context: Canvas2DContext;
  layer: Layer;
  layersById: Map<string, Layer>;
  canvasSize: Size2D;
  canvasFactory: CanvasFactory;
}

const drawLayer = ({
  context,
  layer,
  layersById,
  canvasSize,
  canvasFactory,
}: DrawLayerOptions): void => {
  if (!layer.visible) return;

  context.save();
  context.globalAlpha = layer.opacity;
  context.globalCompositeOperation = layer.blendMode as unknown as GlobalCompositeOperation;
  context.transform(
    layer.transform.a,
    layer.transform.b,
    layer.transform.c,
    layer.transform.d,
    layer.transform.e,
    layer.transform.f,
  );

  switch (layer.kind) {
    case LayerKind.RASTER: {
      const surface = drawRasterLayer(layer, canvasFactory);
      context.drawImage(asImageSource(surface), 0, 0);
      break;
    }
    case LayerKind.TEXT: {
      const surface = drawTextLayer({ layer, canvasSize, canvasFactory });
      context.drawImage(asImageSource(surface), 0, 0);
      break;
    }
    case LayerKind.GROUP:
      drawGroupChildren({ context, group: layer, layersById, canvasSize, canvasFactory });
      break;
  }

  context.restore();
};

export interface DrawGroupChildrenOptions {
  context: Canvas2DContext;
  group: GroupLayer;
  layersById: Map<string, Layer>;
  canvasSize: Size2D;
  canvasFactory: CanvasFactory;
}

const drawGroupChildren = ({
  context,
  group,
  layersById,
  canvasSize,
  canvasFactory,
}: DrawGroupChildrenOptions): void => {
  const children = group.childIds
    .map((childId) => layersById.get(childId))
    .filter((child): child is Layer => Boolean(child))
    .sort((first, second) => first.zIndex - second.zIndex);

  children.forEach((child) =>
    drawLayer({ context, layer: child, layersById, canvasSize, canvasFactory }),
  );
};

/** Layers referenced as a group's child are rendered only via that group, never as siblings at top level. */
export const topLevelLayers = (composition: Composition): Layer[] => {
  const childIds = new Set(
    composition.layers
      .filter((layer): layer is GroupLayer => layer.kind === LayerKind.GROUP)
      .flatMap((group) => group.childIds),
  );

  return composition.layers
    .filter((layer) => !childIds.has(layer.id))
    .sort((first, second) => first.zIndex - second.zIndex);
};

/**
 * Composites a Composition to a fresh CanvasLike surface via Canvas2D
 * globalCompositeOperation/globalAlpha/setTransform — no WebGL/3rd-party
 * rendering lib. Justification: v1 layer counts and canvas sizes are well
 * within what Canvas2D handles at interactive framerates; revisit only if
 * profiling on real compositions shows it's the bottleneck.
 */
export const renderComposition = (
  composition: Composition,
  canvasFactory: CanvasFactory = createDomCanvas,
): CanvasLikeResult => {
  const output = canvasFactory(composition.canvasSize.width, composition.canvasSize.height);
  const context = output.getContext("2d");
  if (!context) throw new Error("2D context unavailable");

  const layersById = new Map(composition.layers.map((layer) => [layer.id, layer]));
  topLevelLayers(composition).forEach((layer) =>
    drawLayer({ context, layer, layersById, canvasSize: composition.canvasSize, canvasFactory }),
  );

  return output;
};
