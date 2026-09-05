import type {
  InputType,
  MenuName,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
} from "./enums";

export interface PluginUiTrigger {
  type: PluginTriggerType;
  /** Required when type === MENU */
  menu?: MenuName;
  /** Toolbar/menu icon id, resolved against ui-kit's icon set. */
  icon?: string;
}

export interface PluginUiInteractive {
  type: PluginUiInteractiveType;
}

export interface PluginUiComponent {
  title: string;
  trigger: PluginUiTrigger;
  interactive: PluginUiInteractive;
}

/** JSON-serializable plugin identity/UI declaration — matches the spec's <plugin> example 1:1. */
export interface PluginManifest {
  name: string;
  category: PluginCategory;
  inputType: InputType;
  outputType: OutputType;
  uiComponents: PluginUiComponent[];
}
