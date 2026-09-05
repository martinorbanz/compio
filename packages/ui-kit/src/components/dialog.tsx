import * as RadixDialog from "@radix-ui/react-dialog";
import type { PropsWithChildren, ReactNode } from "react";

export interface DialogProps extends PropsWithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  footer?: ReactNode;
}

/**
 * Wraps @radix-ui/react-dialog behind a plain {open, onOpenChange, title,
 * footer, children} surface — consumers never import Radix directly, so
 * swapping the underlying primitive later doesn't touch call sites.
 */
export const Dialog = ({ open, onOpenChange, title, footer, children }: DialogProps): ReactNode => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-black/60" />
      <RadixDialog.Content
        className={
          "fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg border " +
          "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-xl focus:outline-none"
        }
      >
        <RadixDialog.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </RadixDialog.Title>
        <div className="mt-3">{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>
);
