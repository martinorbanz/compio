import type { ReactElement } from "react";
import { IconBase, type IconProps } from "./icon-base";

export const IconText = (props: IconProps): ReactElement => (
  <IconBase {...props}>
    <path d="M5 5h14M12 5v14" />
  </IconBase>
);
