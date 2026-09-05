import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconBrush = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M4 20c0-3 1.5-5 4-5s3 2 3 3.5S9.5 21 8 21s-2-1-2-1" />
    <path d="M9 15 18 6a2.1 2.1 0 0 1 3 3l-9 9" />
  </IconBase>
);
