import { describe, expect, it } from "vitest";
import {
  InputType,
  MenuName,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
} from "../enums";
import type { Plugin } from "../plugin";

describe("Plugin contract", () => {
  it("shapes a manifest matching the spec's Brightness/Contrast example", () => {
    const plugin: Plugin<number, void, number> = {
      manifest: {
        name: "Brightness/Contrast",
        category: PluginCategory.EFFECTS,
        inputType: InputType.IMAGE_DATA,
        outputType: OutputType.IMAGE_DATA,
        uiComponents: [
          {
            title: "Brightness/Contrast",
            trigger: { type: PluginTriggerType.MENU, menu: MenuName.IMAGE_SETTINGS },
            interactive: { type: PluginUiInteractiveType.DIALOG },
          },
        ],
      },
      execute: ({ input }) => input,
    };

    expect(plugin.manifest.category).toBe(PluginCategory.EFFECTS);
    expect(plugin.manifest.uiComponents[0]?.trigger.menu).toBe(MenuName.IMAGE_SETTINGS);
    expect(
      plugin.execute({
        input: 42,
        params: undefined,
        context: { canvasSize: { width: 1, height: 1 }, imageSize: { width: 1, height: 1 } },
      }),
    ).toBe(42);
  });
});
