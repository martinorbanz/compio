import { PluginCategory } from "@compio/domain-plugin-api";
import { PluginRegisteredEvent, pluginEventHive } from "@compio/domain-events";
import { activatePlugin, getPluginsByCategory } from "@compio/plugin-registry";
import { getIcon, Toolbar, type ToolbarItem } from "@compio/ui-kit";
import { useEffect, useState, type ReactElement } from "react";
import type { EditorState } from "../../../../app/hooks";

export interface AppToolbarProps {
  editor: EditorState;
}

/** Rebuilds itself from PluginRegisteredEvent instead of a hardcoded tool list. */
export const AppToolbar = ({ editor }: AppToolbarProps): ReactElement => {
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const subscription = pluginEventHive.addListener<PluginRegisteredEvent>(
      PluginRegisteredEvent.type,
      () => forceRefresh((previousCount) => previousCount + 1),
    );
    return () => subscription.unsubscribe();
  }, []);

  const items: ToolbarItem[] = getPluginsByCategory(PluginCategory.TOOLS).map((plugin) => {
    const trigger = plugin.manifest.uiComponents[0]?.trigger;
    const Icon = getIcon(trigger?.icon);
    return {
      id: plugin.manifest.name,
      label: plugin.manifest.name,
      icon: <Icon />,
      active: editor.activeToolName === plugin.manifest.name,
      onSelect: () => {
        editor.setActiveToolName(plugin.manifest.name);
        activatePlugin(plugin.manifest.name);
      },
    };
  });

  return <Toolbar items={items} />;
};
