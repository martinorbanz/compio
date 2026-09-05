import {
  multiplyMatrix,
  rotationMatrix,
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

export interface RotateToolInput {
  transform: Matrix2D;
}

export interface RotateToolParams {
  angleDeltaRadians: number;
  pivot: Vector2;
}

export const rotateTool: Plugin<RotateToolInput, RotateToolParams, Matrix2D> = {
  manifest: {
    name: TOOL_NAMES.ROTATE,
    category: PluginCategory.TOOLS,
    inputType: InputType.NONE,
    outputType: OutputType.TRANSFORM,
    uiComponents: [
      {
        title: TOOL_NAMES.ROTATE,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.ROTATE },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input, params }) => {
    const toPivot = translationMatrix(-params.pivot.x, -params.pivot.y);
    const rotated = multiplyMatrix(rotationMatrix(params.angleDeltaRadians), toPivot);
    const aboutPivot = multiplyMatrix(translationMatrix(params.pivot.x, params.pivot.y), rotated);

    return multiplyMatrix(aboutPivot, input.transform);
  },
};
