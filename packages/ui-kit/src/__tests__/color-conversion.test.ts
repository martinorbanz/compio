import { describe, expect, it } from "vitest";
import { hsvToRgb, rgbToHsv } from "../components/color-conversion";

describe("rgbToHsv / hsvToRgb", () => {
  it("round-trips pure red", () => {
    const hsv = rgbToHsv({ red: 255, green: 0, blue: 0 });
    expect(hsv).toEqual({ hue: 0, saturation: 1, value: 1 });
    expect(hsvToRgb(hsv)).toEqual({ red: 255, green: 0, blue: 0 });
  });

  it("round-trips pure green", () => {
    const hsv = rgbToHsv({ red: 0, green: 255, blue: 0 });
    expect(hsv.hue).toBeCloseTo(120);
    expect(hsvToRgb(hsv)).toEqual({ red: 0, green: 255, blue: 0 });
  });

  it("round-trips pure blue", () => {
    const hsv = rgbToHsv({ red: 0, green: 0, blue: 255 });
    expect(hsv.hue).toBeCloseTo(240);
    expect(hsvToRgb(hsv)).toEqual({ red: 0, green: 0, blue: 255 });
  });

  it("round-trips a color in the 240-360 degree hue segment", () => {
    const magenta = { red: 200, green: 20, blue: 180 };
    const hsv = rgbToHsv(magenta);
    expect(hsv.hue).toBeGreaterThan(240);
    expect(hsvToRgb(hsv)).toEqual(magenta);
  });

  it("maps black to zero saturation and value", () => {
    expect(rgbToHsv({ red: 0, green: 0, blue: 0 })).toEqual({ hue: 0, saturation: 0, value: 0 });
  });

  it("maps gray to zero saturation with the mid value preserved", () => {
    const gray = rgbToHsv({ red: 128, green: 128, blue: 128 });
    expect(gray.saturation).toBe(0);
    expect(gray.value).toBeCloseTo(128 / 255);
  });
});
