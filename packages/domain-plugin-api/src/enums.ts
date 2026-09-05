export enum PluginCategory {
  TOOLS = "tools",
  EFFECTS = "effects",
  FILTERS = "filters",
  EXPORT = "export",
}

export enum InputType {
  IMAGE_DATA = "image_data",
  PARAMETERS = "parameters",
  MASK = "mask",
  NONE = "none",
}

/**
 * TRANSFORM/LAYER extend the spec's IMAGE_DATA/PARAMETERS pair: the tools
 * module concept says "all tools output grayscale image data to define the
 * area of effect", but that reading doesn't fit Move/Scale/Rotate (which
 * mutate a layer's transform matrix, not a mask) or Text (which creates a
 * whole new layer). These two extra variants keep one honest enum instead of
 * forcing every tool through a mask-shaped hole.
 */
export enum OutputType {
  IMAGE_DATA = "image_data",
  PARAMETERS = "parameters",
  MASK = "mask",
  TRANSFORM = "transform",
  LAYER = "layer",
  NONE = "none",
}

export enum PluginTriggerType {
  MENU = "menu",
  TOOLBAR = "toolbar",
  PANEL = "panel",
}

export enum PluginUiInteractiveType {
  DIALOG = "dialog",
  INLINE = "inline",
  OVERLAY = "overlay",
}

export enum MenuName {
  FILE = "file",
  EDIT = "edit",
  IMAGE_SETTINGS = "image_settings",
  LAYER = "layer",
  SELECT = "select",
  VIEW = "view",
}
