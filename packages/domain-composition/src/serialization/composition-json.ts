import type { BlendMode } from "../types/blend-mode";
import type { RGBAColor } from "../types/color";
import type { AppliedEffect, FontStyle, LayerKind, TextAlign } from "../types/layer";
import type { Matrix2D } from "../types/matrix2d";
import type { Size2D } from "../types/vector2";

export interface MaskChannelJSON {
  width: number;
  height: number;
  data: string;
}

interface BaseLayerJSON {
  id: string;
  name: string;
  transform: Matrix2D;
  blendMode: BlendMode;
  opacity: number;
  effects: AppliedEffect[];
  zIndex: number;
  visible: boolean;
  locked: boolean;
  mask?: MaskChannelJSON;
}

export interface RasterLayerJSON extends BaseLayerJSON {
  kind: LayerKind.RASTER;
  image: { width: number; height: number; data: string };
}

export interface TextLayerJSON extends BaseLayerJSON {
  kind: LayerKind.TEXT;
  text: string;
  font: FontStyle;
  color: RGBAColor;
  align: TextAlign;
}

export interface GroupLayerJSON extends BaseLayerJSON {
  kind: LayerKind.GROUP;
  childIds: string[];
}

export type LayerJSON = RasterLayerJSON | TextLayerJSON | GroupLayerJSON;

/** The `.compio.json` file format — self-contained, no backend required. */
export interface CompositionJSON {
  formatVersion: 1;
  id: string;
  canvasSize: Size2D;
  imageSize: Size2D;
  layers: LayerJSON[];
  selectedLayerIds: string[];
  createdAt: string;
  updatedAt: string;
}
