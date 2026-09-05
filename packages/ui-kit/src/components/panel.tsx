import type { PropsWithChildren, ReactNode } from "react";

export interface PanelProps extends PropsWithChildren {
  title: string;
  actions?: ReactNode;
  className?: string;
}

export const Panel = ({ title, actions, className = "", children }: PanelProps): ReactNode => (
  <section
    className={[
      "flex flex-col bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden",
      className,
    ].join(" ")}
  >
    <header className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      {actions}
    </header>
    <div className="flex-1 overflow-auto p-2">{children}</div>
  </section>
);
