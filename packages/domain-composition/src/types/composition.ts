import type { Layer } from "./layer";
import type { Size2D } from "./vector2";

export interface Composition {
  id: string;
  canvasSize: Size2D;
  /** Print metadata (pixels/inch) only — doesn't affect canvasSize or rendering. */
  resolution: number;
  layers: Layer[];
  selectedLayerIds: string[];
  createdAt: string;
  updatedAt: string;
}
