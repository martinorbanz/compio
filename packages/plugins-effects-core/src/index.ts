import type { AnyPlugin } from "@compio/domain-plugin-api";
import { brightnessContrastEffect } from "./effects/brightness-contrast-effect";

export * from "./constants";
export * from "./effects/brightness-contrast-effect";

export const coreEffectPlugins: AnyPlugin[] = [brightnessContrastEffect];
