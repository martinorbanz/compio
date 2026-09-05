import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, initI18n } from "../i18n";

describe("initI18n", () => {
  it("initializes with English as the default locale and resolves known keys", () => {
    const instance = initI18n();
    expect(instance.language).toBe(DEFAULT_LOCALE);
    expect(instance.t("app.name")).toBe("Compio");
    expect(instance.t("tools.Move")).toBe("Move");
  });
});
