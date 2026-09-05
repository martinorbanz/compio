import { RGBA_CHANNELS } from "../constants";
import type { Size2D } from "./vector2";

/** DOM-agnostic stand-in for ImageData so this package has no lib.dom dependency. */
export interface RasterImageSource {
  width: number;
  height: number;
  /** RGBA, row-major, length === width * height * 4. Pinned to ArrayBuffer (not SharedArrayBuffer) to match DOM ImageData. */
  data: Uint8ClampedArray<ArrayBuffer>;
}

export const createEmptyRaster = ({ width, height }: Size2D): RasterImageSource => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * RGBA_CHANNELS),
});
