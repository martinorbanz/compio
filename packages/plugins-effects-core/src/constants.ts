export const EFFECT_NAMES = {
  BRIGHTNESS_CONTRAST: "Brightness/Contrast",
} as const;

export const BRIGHTNESS_RANGE = { min: -100, max: 100 } as const;
export const CONTRAST_RANGE = { min: -100, max: 100 } as const;
export const MID_GRAY = 128;
export const RGB_MAX = 255;
