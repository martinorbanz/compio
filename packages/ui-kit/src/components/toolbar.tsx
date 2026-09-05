import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { Button } from "./button";

export interface ToolbarItem {
  id: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onSelect: () => void;
}

export interface ToolbarProps {
  items: ToolbarItem[];
}

/** Left-docked vertical tool palette, one icon button per registered `tools` plugin. */
export const Toolbar = ({ items }: ToolbarProps): ReactNode => (
  <RadixTooltip.Provider delayDuration={400}>
    <div className="flex flex-col gap-0.5 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-1">
      {items.map((item) => (
        <RadixTooltip.Root key={item.id}>
          <RadixTooltip.Trigger asChild>
            <Button
              variant="icon"
              active={item.active}
              onClick={item.onSelect}
              aria-label={item.label}
            >
              {item.icon}
            </Button>
          </RadixTooltip.Trigger>
          <RadixTooltip.Portal>
            <RadixTooltip.Content
              side="right"
              sideOffset={6}
              className="rounded bg-gray-900 dark:bg-gray-100 px-2 py-1 text-xs text-white dark:text-gray-900 shadow"
            >
              {item.label}
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        </RadixTooltip.Root>
      ))}
    </div>
  </RadixTooltip.Provider>
);
