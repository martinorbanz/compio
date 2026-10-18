import { DEFAULT_RESOLUTION } from "../constants";
import type { Composition } from "../types/composition";
import type { Size2D } from "../types/vector2";
import { createId } from "../utils/id";

export const createEmptyComposition = (canvasSize: Size2D): Composition => {
  const now = new Date().toISOString();
  return {
    id: createId(),
    canvasSize,
    resolution: DEFAULT_RESOLUTION,
    layers: [],
    selectedLayerIds: [],
    createdAt: now,
    updatedAt: now,
  };
};
