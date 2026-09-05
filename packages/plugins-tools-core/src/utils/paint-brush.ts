import {
  createMaskSampler,
  identityMatrix,
  MASK_OPAQUE,
  RGBA_CHANNELS,
  type MaskChannel,
  type MaskSampler,
  type Matrix2D,
  type RasterImageSource,
  type RGBAColor,
  type Vector2,
} from "@compio/domain-composition";

export interface BrushSettings {
  radius: number;
  /** 0..1 — fraction of radius that's fully opaque before the soft edge falloff begins. */
  hardness: number;
  opacity: number;
}

export interface BrushFalloffOptions {
  distance: number;
  radius: number;
  hardness: number;
}

const brushFalloff = ({ distance, radius, hardness }: BrushFalloffOptions): number => {
  const solidRadius = radius * hardness;
  if (distance <= solidRadius) return 1;
  if (distance > radius) return 0;

  const softWidth = Math.max(radius - solidRadius, 1);

  return 1 - (distance - solidRadius) / softWidth;
};

const cloneImage = (image: RasterImageSource): RasterImageSource => ({
  width: image.width,
  height: image.height,
  data: new Uint8ClampedArray(image.data),
});

/** No selection means "fully selected everywhere" — a sampler that always reads as opaque. */
const resolveSelectionSampler = (
  selection: MaskChannel | undefined,
  layerTransform: Matrix2D,
): MaskSampler =>
  selection ? createMaskSampler({ mask: selection, layerTransform }) : () => MASK_OPAQUE;

export interface StampVisitor {
  (byteIndex: number, alpha: number): void;
}

export interface ForEachPixelInStampOptions {
  image: RasterImageSource;
  point: Vector2;
  radius: number;
  hardness: number;
  sampleSelectionAt: MaskSampler;
  visit: StampVisitor;
}

const forEachPixelInStamp = ({
  image,
  point,
  radius,
  hardness,
  sampleSelectionAt,
  visit,
}: ForEachPixelInStampOptions): void => {
  const minX = Math.max(0, Math.floor(point.x - radius));
  const maxX = Math.min(image.width - 1, Math.ceil(point.x + radius));
  const minY = Math.max(0, Math.floor(point.y - radius));
  const maxY = Math.min(image.height - 1, Math.ceil(point.y + radius));

  // Computed pixel range, no backing array, called for every point in a
  // stroke (i.e. per pointermove burst) — genuinely hot, and each pixel's
  // alpha varies with its distance from the stamp center, so this can't be
  // reduced to a uniform TypedArray.fill() the way shape rasterization is.
  // eslint-disable-next-line no-restricted-syntax
  for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
    // eslint-disable-next-line no-restricted-syntax
    for (let pixelX = minX; pixelX <= maxX; pixelX += 1) {
      const distance = Math.hypot(pixelX - point.x, pixelY - point.y);
      const pixelIndex = pixelY * image.width + pixelX;
      const alpha =
        brushFalloff({ distance, radius, hardness }) *
        (sampleSelectionAt({ x: pixelX, y: pixelY }) / MASK_OPAQUE);

      if (alpha > 0) visit(pixelIndex * RGBA_CHANNELS, alpha);
    }
  }
};

export interface PaintStrokeOptions {
  image: RasterImageSource;
  points: Vector2[];
  color: RGBAColor;
  settings: BrushSettings;
  selection?: MaskChannel;
  layerTransform?: Matrix2D;
}

/** Alpha-composites `color` along the stroke path onto a copy of `image` ("over" blending per stamp). */
export const paintStroke = ({
  image,
  points,
  color,
  settings,
  selection,
  layerTransform = identityMatrix(),
}: PaintStrokeOptions): RasterImageSource => {
  const result = cloneImage(image);
  const sampleSelectionAt = resolveSelectionSampler(selection, layerTransform);

  const paintPixel = (byteIndex: number, falloff: number): void => {
    const sourceAlpha = falloff * settings.opacity * color.a;
    const destinationAlpha = (result.data[byteIndex + 3] ?? 0) / 255;
    const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
    if (outputAlpha <= 0) return;

    const getBlendChannel = (sourceValue: number, destinationValue: number): number =>
      (sourceValue * sourceAlpha + destinationValue * destinationAlpha * (1 - sourceAlpha)) /
      outputAlpha;

    // Always exactly R, G, B — unrolled rather than looped over 3 fixed channels.
    result.data[byteIndex] = getBlendChannel(color.r, result.data[byteIndex] ?? 0);
    result.data[byteIndex + 1] = getBlendChannel(color.g, result.data[byteIndex + 1] ?? 0);
    result.data[byteIndex + 2] = getBlendChannel(color.b, result.data[byteIndex + 2] ?? 0);
    result.data[byteIndex + 3] = outputAlpha * 255;
  };

  points.forEach((point) =>
    forEachPixelInStamp({
      image: result,
      point,
      radius: settings.radius,
      hardness: settings.hardness,
      sampleSelectionAt,
      visit: paintPixel,
    }),
  );

  return result;
};

export interface EraseStrokeOptions {
  image: RasterImageSource;
  points: Vector2[];
  settings: BrushSettings;
  selection?: MaskChannel;
  layerTransform?: Matrix2D;
}

/** Reduces alpha along the stroke path, revealing transparency instead of painting color. */
export const eraseStroke = ({
  image,
  points,
  settings,
  selection,
  layerTransform = identityMatrix(),
}: EraseStrokeOptions): RasterImageSource => {
  const result = cloneImage(image);
  const sampleSelectionAt = resolveSelectionSampler(selection, layerTransform);

  const erasePixel = (byteIndex: number, falloff: number): void => {
    const currentAlpha = result.data[byteIndex + 3] ?? 0;
    result.data[byteIndex + 3] = currentAlpha * (1 - falloff * settings.opacity);
  };

  points.forEach((point) =>
    forEachPixelInStamp({
      image: result,
      point,
      radius: settings.radius,
      hardness: settings.hardness,
      sampleSelectionAt,
      visit: erasePixel,
    }),
  );

  return result;
};
