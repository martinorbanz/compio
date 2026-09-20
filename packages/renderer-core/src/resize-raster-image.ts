import type { RasterImageSource, Size2D } from "@compio/domain-composition";
import { type CanvasFactory, createDomCanvas } from "./canvas/canvas-like";

const asImageSource = (surface: ReturnType<CanvasFactory>): CanvasImageSource =>
  surface as HTMLCanvasElement;

export interface ResizeRasterImageOptions {
  targetSize: Size2D;
  canvasFactory?: CanvasFactory;
}

/**
 * Scales a RasterImageSource to `targetSize` via a Canvas2D drawImage
 * stretch-blit — GPU-accelerated resampling, orders of magnitude cheaper
 * than a JS per-pixel loop. Used to shrink a layer's image to a cheap
 * interactive-preview proxy, and to scale a plugin's proxy-resolution output
 * back up to real canvas resolution for compositing. Not a substitute for
 * running a plugin at full resolution when exact output matters (Apply,
 * interaction-end).
 */
export const resizeRasterImage = (
  image: RasterImageSource,
  { targetSize, canvasFactory = createDomCanvas }: ResizeRasterImageOptions,
): RasterImageSource => {
  const source = canvasFactory(image.width, image.height);
  const sourceContext = source.getContext("2d");
  if (!sourceContext) throw new Error("2D context unavailable for raster resize");
  sourceContext.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);

  const target = canvasFactory(targetSize.width, targetSize.height);
  const targetContext = target.getContext("2d");
  if (!targetContext) throw new Error("2D context unavailable for raster resize");
  targetContext.drawImage(asImageSource(source), 0, 0, targetSize.width, targetSize.height);

  const { data } = targetContext.getImageData(0, 0, targetSize.width, targetSize.height);
  return { width: targetSize.width, height: targetSize.height, data };
};
