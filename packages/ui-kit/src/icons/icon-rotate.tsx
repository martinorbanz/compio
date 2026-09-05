import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconRotate = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M4 12a8 8 0 1 1 2.6 5.9" />
    <path d="M4 17v-4h4" />
  </IconBase>
);
