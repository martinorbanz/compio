import type { AnyPlugin } from "@compio/domain-plugin-api";
import { brightnessContrastEffect } from "./effects";

export * from "./constants";
export * from "./effects";

export const coreEffectPlugins: AnyPlugin[] = [brightnessContrastEffect];
