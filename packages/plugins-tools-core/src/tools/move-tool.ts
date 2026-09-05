import {
  multiplyMatrix,
  translationMatrix,
  type Matrix2D,
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
import { TOOL_ICON_IDS, TOOL_NAMES } from "../constants";

export interface MoveToolInput {
  transform: Matrix2D;
}

export interface MoveToolParams {
  delta: Vector2;
}

/** Pure: the drag-interaction state (start point, running delta) lives in the UI tool controller, not here. */
export const moveTool: Plugin<MoveToolInput, MoveToolParams, Matrix2D> = {
  manifest: {
    name: TOOL_NAMES.MOVE,
    category: PluginCategory.TOOLS,
    inputType: InputType.NONE,
    outputType: OutputType.TRANSFORM,
    uiComponents: [
      {
        title: TOOL_NAMES.MOVE,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.MOVE },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input, params }) =>
    multiplyMatrix(translationMatrix(params.delta.x, params.delta.y), input.transform),
};
