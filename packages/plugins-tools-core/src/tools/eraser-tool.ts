import type { RasterImageSource, Vector2 } from "@compio/domain-composition";
import {
  InputType,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
  type Plugin,
} from "@compio/domain-plugin-api";
import { TOOL_ICON_IDS, TOOL_NAMES } from "../constants";
import { eraseStroke, type BrushSettings } from "../utils/paint-brush";

export interface EraserToolInput {
  image: RasterImageSource;
  strokePoints: Vector2[];
}

export type EraserToolParams = BrushSettings;

export const eraserTool: Plugin<EraserToolInput, EraserToolParams, RasterImageSource> = {
  manifest: {
    name: TOOL_NAMES.ERASER,
    category: PluginCategory.TOOLS,
    inputType: InputType.IMAGE_DATA,
    outputType: OutputType.IMAGE_DATA,
    uiComponents: [
      {
        title: TOOL_NAMES.ERASER,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.ERASER },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input, params, context }) =>
    eraseStroke({
      image: input.image,
      points: input.strokePoints,
      settings: params,
      selection: context.selection,
      layerTransform: context.layerTransform,
    }),
};
