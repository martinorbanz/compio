import * as RadixMenubar from "@radix-ui/react-menubar";
import type { ReactNode } from "react";

export interface MenuBarItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface MenuBarMenu {
  id: string;
  label: string;
  items: MenuBarItem[];
}

export interface MenuBarProps {
  menus: MenuBarMenu[];
}

const ITEM_CLASSES =
  "flex items-center rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-100 " +
  "data-[highlighted]:bg-accent-600 data-[highlighted]:text-white outline-none " +
  "data-[disabled]:opacity-40 data-[disabled]:pointer-events-none";

const TRIGGER_CLASSES =
  "rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 outline-none " +
  "data-[state=open]:bg-gray-200 dark:data-[state=open]:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800";

/** Docked top command menu, populated by plugin MENU triggers — never a hardcoded per-tool list. */
export const MenuBar = ({ menus }: MenuBarProps): ReactNode => (
  <RadixMenubar.Root className="flex items-center gap-0.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-1 py-0.5">
    {menus.map((menu) => (
      <RadixMenubar.Menu key={menu.id}>
        <RadixMenubar.Trigger className={TRIGGER_CLASSES}>{menu.label}</RadixMenubar.Trigger>
        <RadixMenubar.Portal>
          <RadixMenubar.Content
            align="start"
            sideOffset={4}
            className="min-w-40 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-lg"
          >
            {menu.items.map((item) => (
              <RadixMenubar.Item
                key={item.id}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={ITEM_CLASSES}
              >
                {item.label}
              </RadixMenubar.Item>
            ))}
          </RadixMenubar.Content>
        </RadixMenubar.Portal>
      </RadixMenubar.Menu>
    ))}
  </RadixMenubar.Root>
);
