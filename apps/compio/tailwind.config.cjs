const uiKitPreset = require("@compio/ui-kit/tailwind-preset.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [uiKitPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui-kit/src/**/*.{ts,tsx}"],
};
