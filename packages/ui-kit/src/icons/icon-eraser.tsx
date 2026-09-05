import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconEraser = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="m19 5-9.5 9.5a2 2 0 0 0 0 2.83L11.5 19H17l5-5-6-6Z" />
    <path d="M9 19H5" />
  </IconBase>
);
