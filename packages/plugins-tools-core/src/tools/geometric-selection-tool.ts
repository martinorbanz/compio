import {
  combineMasks,
  type MaskChannel,
  type SelectionOp,
  type Size2D,
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
import { rasterizeEllipse, rasterizeRectangle, type ShapeRect } from "../utils/rasterize-shape";

export type GeometricShape = "rectangle" | "ellipse";

export interface GeometricSelectionInput {
  canvasSize: Size2D;
  existingSelection?: MaskChannel;
}

export interface GeometricSelectionParams {
  shape: GeometricShape;
  rect: ShapeRect;
  operation: SelectionOp;
}

export const geometricSelectionTool: Plugin<
  GeometricSelectionInput,
  GeometricSelectionParams,
  MaskChannel
> = {
  manifest: {
    name: TOOL_NAMES.GEOMETRIC_SELECTION,
    category: PluginCategory.TOOLS,
    inputType: InputType.NONE,
    outputType: OutputType.MASK,
    uiComponents: [
      {
        title: TOOL_NAMES.GEOMETRIC_SELECTION,
        trigger: { type: PluginTriggerType.TOOLBAR, icon: TOOL_ICON_IDS.GEOMETRIC_SELECTION },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input, params }) => {
    const shapeMask =
      params.shape === "rectangle"
        ? rasterizeRectangle(input.canvasSize, params.rect)
        : rasterizeEllipse(input.canvasSize, params.rect);

    if (!input.existingSelection) return shapeMask;

    return combineMasks({
      base: input.existingSelection,
      overlay: shapeMask,
      operation: params.operation,
    });
  },
};
