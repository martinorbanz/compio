import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "ghost" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent-600 hover:bg-accent-500 text-white px-3 py-1.5",
  ghost: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-1.5",
  icon: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 p-2",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors " +
  "disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", active = false, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={[
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        active ? "bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
);
Button.displayName = "Button";
