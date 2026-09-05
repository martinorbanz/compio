import type { ComponentType } from "react";
import { IconBrush } from "./icon-brush";
import { IconEraser } from "./icon-eraser";
import { IconMarquee } from "./icon-marquee";
import { IconMove } from "./icon-move";
import { IconPlaceholder } from "./icon-placeholder";
import type { IconProps } from "./icon-base";
import { IconRotate } from "./icon-rotate";
import { IconScale } from "./icon-scale";
import { IconText } from "./icon-text";

/**
 * Keyed by the icon ids plugins declare in their manifest's trigger.icon
 * (see @compio/plugins-tools-core's TOOL_ICON_IDS) — ui-kit stays ignorant of
 * which plugin package defines those ids, matching the plugins/ui-kit
 * boundary in .dependency-cruiser.cjs.
 */
export const iconRegistry: Record<string, ComponentType<IconProps>> = {
  "tool-move": IconMove,
  "tool-scale": IconScale,
  "tool-rotate": IconRotate,
  "tool-marquee": IconMarquee,
  "tool-brush": IconBrush,
  "tool-eraser": IconEraser,
  "tool-text": IconText,
};

export const getIcon = (iconId: string | undefined): ComponentType<IconProps> => {
  if (!iconId) return IconPlaceholder;
  const icon = iconRegistry[iconId];
  if (!icon) {
    console.warn(`[ui-kit] No icon registered for id "${iconId}" — using placeholder.`);
    return IconPlaceholder;
  }
  return icon;
};
