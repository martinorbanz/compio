import type { ReactElement, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const ICON_SIZE = 18;

export const IconBase = ({ children, ...props }: IconProps): ReactElement => (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);
