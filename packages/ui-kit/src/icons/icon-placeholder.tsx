import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

/** Fallback for any icon id with no dedicated glyph yet — visible on purpose, not silently blank. */
export const IconPlaceholder = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
    <path d="M12 16h.01M12 8a2 2 0 0 1 2 2c0 1.5-2 1.5-2 3" />
  </IconBase>
);
