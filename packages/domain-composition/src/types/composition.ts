import type { Layer } from "./layer";
import type { Size2D } from "./vector2";

export interface Composition {
  id: string;
  canvasSize: Size2D;
  /** Output image size; independent of canvasSize so users can crop/resize the export target. */
  imageSize: Size2D;
  layers: Layer[];
  selectedLayerIds: string[];
  createdAt: string;
  updatedAt: string;
}
