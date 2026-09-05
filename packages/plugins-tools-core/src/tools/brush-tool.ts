import type { RasterImageSource, RGBAColor, Vector2 } from "@compio/domain-composition";
import {
  InputType,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
  type Plugin,
} from "@compio/domain-plugin-api";
import { TOOL_ICON_IDS, TOOL_NAMES } from "../constants";
import { paintStroke, type BrushSettings } from "../utils/paint-brush";

export interface BrushToolInput {
  image: RasterImageSource;
  strokePoints: Vector2[];
}

export interface BrushToolParams extends BrushSettings {
  color: RGBAColor;
}

export const brushTool: Plugin<BrushToolInput, BrushToolParams, RasterImageSource> = {
  manifest: {
    name: TOOL_NAMES.BRUSH,
    category: PluginCategory.TOOLS,
    inputType: InputType.IMAGE_DATA,
    outputType: OutputType.IMAGE_DATA,
    uiComponents: [
      {
        title: TOOL_NAMES.BRUSH,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.BRUSH },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input, params, context }) =>
    paintStroke({
      image: input.image,
      points: input.strokePoints,
      color: params.color,
      settings: params,
      selection: context.selection,
      layerTransform: context.layerTransform,
    }),
};
