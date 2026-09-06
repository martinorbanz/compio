import type { AnyPlugin } from "@compio/domain-plugin-api";
import {
  brushTool,
  eraserTool,
  geometricSelectionTool,
  moveTool,
  rotateTool,
  scaleTool,
  textTool,
} from "./tools";

export * from "./constants";
export * from "./tools";
export * from "./utils";

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
