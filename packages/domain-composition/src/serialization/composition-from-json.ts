import type { Composition } from "../types/composition";
import { LayerKind, type Layer } from "../types/layer";
import type { MaskChannel } from "../types/mask-channel";
import { base64ToBytes } from "../utils/base64";
import type { CompositionJSON, LayerJSON, MaskChannelJSON } from "./composition-json";
import { rawRasterCodec, type RasterCodec } from "./raster-codec";

const decodeMask = (mask: MaskChannelJSON): MaskChannel => ({
  width: mask.width,
  height: mask.height,
  data: base64ToBytes(mask.data),
});

const decodeLayer = async (layerJSON: LayerJSON, codec: RasterCodec): Promise<Layer> => {
  const mask = layerJSON.mask ? decodeMask(layerJSON.mask) : undefined;

  switch (layerJSON.kind) {
    case LayerKind.RASTER: {
      const { width, height, data: encoded } = layerJSON.image;
      const image = await codec.decode({ encoded, width, height });

      return { ...layerJSON, mask, image };
    }
    case LayerKind.TEXT:
      return { ...layerJSON, mask };
    case LayerKind.GROUP:
      return { ...layerJSON, mask };
  }
};

export const compositionFromJSON = async (
  json: CompositionJSON,
  codec: RasterCodec = rawRasterCodec,
): Promise<Composition> => ({
  id: json.id,
  canvasSize: json.canvasSize,
  imageSize: json.imageSize,
  layers: await Promise.all(json.layers.map((layer) => decodeLayer(layer, codec))),
  selectedLayerIds: json.selectedLayerIds,
  createdAt: json.createdAt,
  updatedAt: json.updatedAt,
});
