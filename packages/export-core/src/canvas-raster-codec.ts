import type {
  DecodeRasterOptions,
  RasterCodec,
  RasterImageSource,
} from "@compio/domain-composition";

const PNG_DATA_URI_PREFIX = "data:image/png";

const loadImage = (dataUri: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to decode raster PNG data URI"));
    image.src = dataUri;
  });

/**
 * Browser-only PNG codec — swapped in by apps/compio in place of
 * domain-composition's zero-dependency raw codec to shrink `.compio.json`
 * files. Kept out of domain-composition itself so that package stays usable
 * without a DOM (see RasterCodec's port/adapter split).
 */
export const canvasRasterCodec: RasterCodec = {
  encode: (image) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D context unavailable for raster encode");

    context.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);

    return canvas.toDataURL("image/png");
  },
  decode: async ({ encoded, width, height }: DecodeRasterOptions): Promise<RasterImageSource> => {
    if (!encoded.startsWith(PNG_DATA_URI_PREFIX)) {
      throw new Error("canvasRasterCodec.decode received a non-PNG-data-URI payload");
    }

    const image = await loadImage(encoded);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D context unavailable for raster decode");

    context.drawImage(image, 0, 0);

    return { width, height, data: context.getImageData(0, 0, width, height).data };
  },
};
