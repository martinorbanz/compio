import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconMove = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M12 2v20M2 12h20" />
    <path d="M12 2 9 5M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" />
  </IconBase>
);
