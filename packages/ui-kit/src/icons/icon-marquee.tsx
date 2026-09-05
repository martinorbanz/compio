import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconMarquee = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="3 3" />
  </IconBase>
);
