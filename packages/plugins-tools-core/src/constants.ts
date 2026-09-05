export const TOOL_NAMES = {
  MOVE: "Move",
  SCALE: "Scale",
  ROTATE: "Rotate",
  GEOMETRIC_SELECTION: "Geometric Selection",
  BRUSH: "Brush",
  ERASER: "Eraser",
  TEXT: "Text",
} as const;

/** Resolved against ui-kit's icon set; ui-kit points out any id with no matching icon yet. */
export const TOOL_ICON_IDS = {
  MOVE: "tool-move",
  SCALE: "tool-scale",
  ROTATE: "tool-rotate",
  GEOMETRIC_SELECTION: "tool-marquee",
  BRUSH: "tool-brush",
  ERASER: "tool-eraser",
  TEXT: "tool-text",
} as const;

export const DEFAULT_BRUSH_HARDNESS = 0.8;
export const DEFAULT_BRUSH_RADIUS = 16;
export const DEFAULT_TEXT_FONT_SIZE = 24;
export const TEXT_LAYER_NAME_MAX_LENGTH = 24;
