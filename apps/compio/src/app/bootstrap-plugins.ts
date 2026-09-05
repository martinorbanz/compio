import { bootstrapCorePlugins, getAllPlugins } from "@compio/plugin-registry";
import { coreEffectPlugins } from "@compio/plugins-effects-core";
import { coreToolPlugins } from "@compio/plugins-tools-core";

let bootstrapped = false;

/** Composes the built-in tool/effect sets and registers them once at app startup. */
export const ensurePluginsBootstrapped = (): void => {
  if (bootstrapped) return;
  bootstrapped = true;
  if (getAllPlugins().length > 0) return;
  bootstrapCorePlugins([...coreToolPlugins, ...coreEffectPlugins]);
};
