import type { AnyPlugin, PluginCategory } from "@compio/domain-plugin-api";
import {
  PluginActivatedEvent,
  PluginRegisteredEvent,
  pluginEventHive,
} from "@compio/domain-events";

const pluginsByName = new Map<string, AnyPlugin>();

export const registerPlugin = (plugin: AnyPlugin): void => {
  if (pluginsByName.has(plugin.manifest.name)) {
    throw new Error(`Plugin "${plugin.manifest.name}" is already registered`);
  }
  pluginsByName.set(plugin.manifest.name, plugin);
  pluginEventHive.dispatchEvent(new PluginRegisteredEvent({ manifest: plugin.manifest }));
};

export const getPlugin = (name: string): AnyPlugin | undefined => pluginsByName.get(name);

export const getPluginsByCategory = (category: PluginCategory): AnyPlugin[] =>
  Array.from(pluginsByName.values()).filter((plugin) => plugin.manifest.category === category);

export const getAllPlugins = (): AnyPlugin[] => Array.from(pluginsByName.values());

/** Signals a tool became the active tool; toolbar UI listens for this to highlight state. */
export const activatePlugin = (name: string): void => {
  pluginEventHive.dispatchEvent(new PluginActivatedEvent({ pluginName: name }));
};

/** Test-only: clears the registry between test cases. */
export const resetRegistry = (): void => {
  pluginsByName.clear();
};

/** Registers a batch of built-in plugins at app startup (see apps/compio's bootstrap). */
export const bootstrapCorePlugins = (plugins: AnyPlugin[]): void => {
  for (const plugin of plugins) registerPlugin(plugin);
};
