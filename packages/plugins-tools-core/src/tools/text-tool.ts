import {
  LayerKind,
  baseLayerDefaults,
  createId,
  translationMatrix,
  type FontStyle,
  type RGBAColor,
  type TextAlign,
  type TextLayer,
  type Vector2,
} from "@compio/domain-composition";
import {
  InputType,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
  type Plugin,
} from "@compio/domain-plugin-api";
import { TEXT_LAYER_NAME_MAX_LENGTH, TOOL_ICON_IDS, TOOL_NAMES } from "../constants";

export interface TextToolParams {
  text: string;
  font: FontStyle;
  color: RGBAColor;
  align: TextAlign;
  position: Vector2;
}

/** Creates a new text layer descriptor; the UI layer is responsible for adding it to the composition. */
export const textTool: Plugin<void, TextToolParams, Omit<TextLayer, "zIndex">> = {
  manifest: {
    name: TOOL_NAMES.TEXT,
    category: PluginCategory.TOOLS,
    inputType: InputType.NONE,
    outputType: OutputType.LAYER,
    uiComponents: [
      {
        title: TOOL_NAMES.TEXT,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.TEXT },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ params }) => ({
    ...baseLayerDefaults(),
    id: createId(),
    name: params.text.slice(0, TEXT_LAYER_NAME_MAX_LENGTH) || TOOL_NAMES.TEXT,
    kind: LayerKind.TEXT,
    transform: translationMatrix(params.position.x, params.position.y),
    text: params.text,
    font: params.font,
    color: params.color,
    align: params.align,
  }),
};
