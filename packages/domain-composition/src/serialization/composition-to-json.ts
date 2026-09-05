import { LayerKind, type Layer } from "../types/layer";
import type { Composition } from "../types/composition";
import type { MaskChannel } from "../types/mask-channel";
import { bytesToBase64 } from "../utils/base64";
import type { CompositionJSON, LayerJSON, MaskChannelJSON } from "./composition-json";
import { rawRasterCodec, type RasterCodec } from "./raster-codec";

const encodeMask = (mask: MaskChannel): MaskChannelJSON => ({
  width: mask.width,
  height: mask.height,
  data: bytesToBase64(mask.data),
});

const encodeLayer = (layer: Layer, codec: RasterCodec): LayerJSON => {
  const mask = layer.mask ? encodeMask(layer.mask) : undefined;
  switch (layer.kind) {
    case LayerKind.RASTER:
      return {
        ...layer,
        mask,
        image: {
          width: layer.image.width,
          height: layer.image.height,
          data: codec.encode(layer.image),
        },
      };
    case LayerKind.TEXT:
      return { ...layer, mask };
    case LayerKind.GROUP:
      return { ...layer, mask };
  }
};

export const compositionToJSON = (
  composition: Composition,
  codec: RasterCodec = rawRasterCodec,
): CompositionJSON => ({
  formatVersion: 1,
  id: composition.id,
  canvasSize: composition.canvasSize,
  imageSize: composition.imageSize,
  layers: composition.layers.map((layer) => encodeLayer(layer, codec)),
  selectedLayerIds: composition.selectedLayerIds,
  createdAt: composition.createdAt,
  updatedAt: composition.updatedAt,
});
