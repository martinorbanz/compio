import type { RasterImageSource } from "../types/raster-image-source";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";

/**
 * Port for encoding/decoding raster pixels to/from a JSON-safe string.
 * Kept swappable (DDD "solution agnostic" boundary): this package ships a
 * zero-dependency raw codec so it never touches the DOM; apps/export-core
 * supplies a canvas-based PNG codec for smaller files in the browser.
 */
export interface DecodeRasterOptions {
  encoded: string;
  width: number;
  height: number;
}

export interface RasterCodec {
  encode(image: RasterImageSource): string;
  decode(options: DecodeRasterOptions): RasterImageSource | Promise<RasterImageSource>;
}

const RAW_CODEC_PREFIX = "raw-rgba-base64:";

export const rawRasterCodec: RasterCodec = {
  encode: (image) => `${RAW_CODEC_PREFIX}${bytesToBase64(image.data)}`,
  decode: ({ encoded, width, height }) => {
    const base64 = encoded.startsWith(RAW_CODEC_PREFIX)
      ? encoded.slice(RAW_CODEC_PREFIX.length)
      : encoded;

    return { width, height, data: base64ToBytes(base64) };
  },
};
