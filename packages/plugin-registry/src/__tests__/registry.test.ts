import {
  InputType,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
  type AnyPlugin,
} from "@compio/domain-plugin-api";
import { beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapCorePlugins,
  getAllPlugins,
  getPlugin,
  getPluginsByCategory,
  registerPlugin,
  resetRegistry,
} from "../registry";

const makePlugin = (name: string, category: PluginCategory): AnyPlugin => ({
  manifest: {
    name,
    category,
    inputType: InputType.IMAGE_DATA,
    outputType: OutputType.IMAGE_DATA,
    uiComponents: [
      {
        title: name,
        trigger: { type: PluginTriggerType.TOOLBAR },
        interactive: { type: PluginUiInteractiveType.INLINE },
      },
    ],
  },
  execute: ({ input }) => input,
});

describe("plugin registry", () => {
  beforeEach(() => resetRegistry());

  it("registers and looks up plugins by name", () => {
    const plugin = makePlugin("Move", PluginCategory.TOOLS);
    registerPlugin(plugin);
    expect(getPlugin("Move")).toBe(plugin);
  });

  it("throws on duplicate registration", () => {
    registerPlugin(makePlugin("Move", PluginCategory.TOOLS));
    expect(() => registerPlugin(makePlugin("Move", PluginCategory.TOOLS))).toThrow();
  });

  it("filters plugins by category", () => {
    registerPlugin(makePlugin("Move", PluginCategory.TOOLS));
    registerPlugin(makePlugin("Brightness/Contrast", PluginCategory.EFFECTS));
    expect(getPluginsByCategory(PluginCategory.TOOLS)).toHaveLength(1);
    expect(getPluginsByCategory(PluginCategory.EFFECTS)).toHaveLength(1);
  });

  it("bootstraps a batch of core plugins", () => {
    bootstrapCorePlugins([
      makePlugin("Move", PluginCategory.TOOLS),
      makePlugin("Scale", PluginCategory.TOOLS),
    ]);
    expect(getAllPlugins()).toHaveLength(2);
  });
});
