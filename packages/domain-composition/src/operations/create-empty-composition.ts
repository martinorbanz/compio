import type { Composition } from "../types/composition";
import type { Size2D } from "../types/vector2";
import { createId } from "../utils/id";

export const createEmptyComposition = (
  canvasSize: Size2D,
  imageSize: Size2D = canvasSize,
): Composition => {
  const now = new Date().toISOString();
  return {
    id: createId(),
    canvasSize,
    imageSize,
    layers: [],
    selectedLayerIds: [],
    createdAt: now,
    updatedAt: now,
  };
};
