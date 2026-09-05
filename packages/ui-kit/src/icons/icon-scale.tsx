import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconScale = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <rect x="4" y="10" width="10" height="10" rx="1" />
    <path d="M10 4h10v10M14 4 20 10" />
  </IconBase>
);
