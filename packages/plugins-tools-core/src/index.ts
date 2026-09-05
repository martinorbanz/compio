import type { AnyPlugin } from "@compio/domain-plugin-api";
import { brushTool } from "./tools/brush-tool";
import { eraserTool } from "./tools/eraser-tool";
import { geometricSelectionTool } from "./tools/geometric-selection-tool";
import { moveTool } from "./tools/move-tool";
import { rotateTool } from "./tools/rotate-tool";
import { scaleTool } from "./tools/scale-tool";
import { textTool } from "./tools/text-tool";

export * from "./constants";
export * from "./tools/move-tool";
export * from "./tools/scale-tool";
export * from "./tools/rotate-tool";
export * from "./tools/geometric-selection-tool";
export * from "./tools/brush-tool";
export * from "./tools/eraser-tool";
export * from "./tools/text-tool";
export * from "./utils/paint-brush";
export * from "./utils/rasterize-shape";

/** Every built-in tool plugin, ready for plugin-registry's bootstrapCorePlugins(). */
export const coreToolPlugins: AnyPlugin[] = [
  moveTool,
  scaleTool,
  rotateTool,
  geometricSelectionTool,
  brushTool,
  eraserTool,
  textTool,
];
