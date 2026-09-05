import type { Composition } from "../types/composition";
import { LayerKind, type Layer } from "../types/layer";
import type { Matrix2D } from "../types/matrix2d";
import type { RasterImageSource } from "../types/raster-image-source";

const touch = (): Pick<Composition, "updatedAt"> => ({
  updatedAt: new Date().toISOString(),
});

export const addLayer = (composition: Composition, layer: Omit<Layer, "zIndex">): Composition => {
  const zIndex = composition.layers.length;

  return {
    ...composition,
    layers: [...composition.layers, { ...layer, zIndex } as Layer],
    ...touch(),
  };
};

export const removeLayer = (composition: Composition, layerId: string): Composition => ({
  ...composition,
  layers: composition.layers
    .filter((layer) => layer.id !== layerId)
    .map((layer, zIndex) => ({ ...layer, zIndex })),
  selectedLayerIds: composition.selectedLayerIds.filter((id) => id !== layerId),
  ...touch(),
});

export interface UpdateLayerTransformOptions {
  composition: Composition;
  layerId: string;
  transform: Matrix2D;
}

export const updateLayerTransform = ({
  composition,
  layerId,
  transform,
}: UpdateLayerTransformOptions): Composition => ({
  ...composition,
  layers: composition.layers.map((layer) =>
    layer.id === layerId ? { ...layer, transform } : layer,
  ),
  ...touch(),
});

export interface UpdateRasterLayerImageOptions {
  composition: Composition;
  layerId: string;
  image: RasterImageSource;
}

export const updateRasterLayerImage = ({
  composition,
  layerId,
  image,
}: UpdateRasterLayerImageOptions): Composition => ({
  ...composition,
  layers: composition.layers.map((layer) =>
    layer.id === layerId && layer.kind === LayerKind.RASTER ? { ...layer, image } : layer,
  ),
  ...touch(),
});

export interface ReorderLayerOptions {
  composition: Composition;
  layerId: string;
  newZIndex: number;
}

export const reorderLayer = ({
  composition,
  layerId,
  newZIndex,
}: ReorderLayerOptions): Composition => {
  const layers = [...composition.layers].sort((a, b) => a.zIndex - b.zIndex);
  const fromIndex = layers.findIndex((layer) => layer.id === layerId);
  if (fromIndex === -1) return composition;

  const [moved] = layers.splice(fromIndex, 1);
  if (!moved) return composition;

  const clampedIndex = Math.max(0, Math.min(newZIndex, layers.length));
  layers.splice(clampedIndex, 0, moved);

  return {
    ...composition,
    layers: layers.map((layer, zIndex) => ({ ...layer, zIndex })),
    ...touch(),
  };
};

export const setSelection = (composition: Composition, layerIds: string[]): Composition => ({
  ...composition,
  selectedLayerIds: layerIds,
  ...touch(),
});
