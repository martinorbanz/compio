import {
  multiplyMatrix,
  scaleMatrix,
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

export interface ScaleToolInput {
  transform: Matrix2D;
}

export interface ScaleToolParams {
  /** Scale factors relative to the layer's current size. */
  scale: Vector2;
  /** Point that stays fixed while scaling (typically a bounding-box handle). */
  pivot: Vector2;
  /**
   * Space `pivot` is defined in. "world" (default) is canvas space — the scale
   * composes outside the layer's existing transform, correct for uniform scale
   * where composition order doesn't change the result. "local" is the layer's
   * own pre-transform space — the scale composes inside the existing transform,
   * so it stretches along the layer's own (possibly rotated) axes instead of the
   * canvas's. Required for non-uniform scale on a rotated layer.
   */
  pivotSpace?: "world" | "local";
}

export const scaleTool: Plugin<ScaleToolInput, ScaleToolParams, Matrix2D> = {
  manifest: {
    name: TOOL_NAMES.SCALE,
    category: PluginCategory.TOOLS,
    inputType: InputType.NONE,
    outputType: OutputType.TRANSFORM,
    uiComponents: [
      {
        title: TOOL_NAMES.SCALE,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.SCALE },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input, params }) => {
    const toPivot = translationMatrix(-params.pivot.x, -params.pivot.y);
    const scaled = multiplyMatrix(scaleMatrix(params.scale.x, params.scale.y), toPivot);
    const aboutPivot = multiplyMatrix(translationMatrix(params.pivot.x, params.pivot.y), scaled);

    return params.pivotSpace === "local"
      ? multiplyMatrix(input.transform, aboutPivot)
      : multiplyMatrix(aboutPivot, input.transform);
  },
};
