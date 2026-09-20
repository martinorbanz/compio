import { DEFAULT_OPACITY } from "../constants";
import { BlendMode } from "./blend-mode";
import type { RGBAColor } from "./color";
import type { Matrix2D } from "./matrix2d";
import type { MaskChannel } from "./mask-channel";
import type { RasterImageSource } from "./raster-image-source";

export enum LayerKind {
  RASTER = "raster",
  TEXT = "text",
  GROUP = "group",
}

export const TextAlign = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
} as const;
export type TextAlign = (typeof TextAlign)[keyof typeof TextAlign];

export interface FontStyle {
  family: string;
  size: number;
  weight: number;
  italic: boolean;
}

/** A plugin (by name) applied non-destructively to a layer, with its last-used params. */
export interface AppliedEffect {
  pluginName: string;
  params: Record<string, unknown>;
  enabled: boolean;
}

interface BaseLayer {
  id: string;
  name: string;
  /** Relative to canvas origin (top-left). Non-destructive: pixels are never pre-transformed. */
  transform: Matrix2D;
  blendMode: BlendMode;
  opacity: number;
  effects: AppliedEffect[];
  zIndex: number;
  visible: boolean;
  locked: boolean;
  mask?: MaskChannel;
}

export interface RasterLayer extends BaseLayer {
  kind: LayerKind.RASTER;
  image: RasterImageSource;
}

export interface TextLayer extends BaseLayer {
  kind: LayerKind.TEXT;
  text: string;
  font: FontStyle;
  color: RGBAColor;
  align: TextAlign;
}

export interface GroupLayer extends BaseLayer {
  kind: LayerKind.GROUP;
  /** Child layer ids; group's transform composes over each child's own transform at render time. */
  childIds: string[];
}

export type Layer = RasterLayer | TextLayer | GroupLayer;

export const baseLayerDefaults = (): Omit<BaseLayer, "id" | "name" | "transform" | "zIndex"> => ({
  blendMode: BlendMode.NORMAL,
  opacity: DEFAULT_OPACITY,
  effects: [],
  visible: true,
  locked: false,
});
