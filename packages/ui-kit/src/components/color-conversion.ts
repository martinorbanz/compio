export interface RgbChannels {
  red: number;
  green: number;
  blue: number;
}

export interface HsvColor {
  hue: number;
  saturation: number;
  value: number;
}

const RGB_CHANNEL_MAX = 255;
const HUE_MAX_DEGREES = 360;
const HUE_SEXTANT_DEGREES = 60;
const UNIT_MAX = 1;

/** hue in [0, 360); saturation/value in [0, 1]. */
export const rgbToHsv = ({ red, green, blue }: RgbChannels): HsvColor => {
  const normalizedRed = red / RGB_CHANNEL_MAX;
  const normalizedGreen = green / RGB_CHANNEL_MAX;
  const normalizedBlue = blue / RGB_CHANNEL_MAX;

  const channelMax = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const channelMin = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const chroma = channelMax - channelMin;

  const hue = (() => {
    if (chroma === 0) return 0;
    if (channelMax === normalizedRed) {
      return HUE_SEXTANT_DEGREES * (((normalizedGreen - normalizedBlue) / chroma) % 6);
    }
    if (channelMax === normalizedGreen) {
      return HUE_SEXTANT_DEGREES * ((normalizedBlue - normalizedRed) / chroma + 2);
    }
    return HUE_SEXTANT_DEGREES * ((normalizedRed - normalizedGreen) / chroma + 4);
  })();

  return {
    hue: hue < 0 ? hue + HUE_MAX_DEGREES : hue,
    saturation: channelMax === 0 ? 0 : chroma / channelMax,
    value: channelMax,
  };
};

export const hsvToRgb = ({ hue, saturation, value }: HsvColor): RgbChannels => {
  const chroma = value * saturation;
  const hueSextant = hue / HUE_SEXTANT_DEGREES;
  const secondLargest = chroma * (1 - Math.abs((hueSextant % 2) - 1));
  const lightnessMatch = value - chroma;

  const [red, green, blue] = (() => {
    if (hueSextant < 1) return [chroma, secondLargest, 0];
    if (hueSextant < 2) return [secondLargest, chroma, 0];
    if (hueSextant < 3) return [0, chroma, secondLargest];
    if (hueSextant < 4) return [0, secondLargest, chroma];
    if (hueSextant < 5) return [secondLargest, 0, chroma];
    return [chroma, 0, secondLargest];
  })();

  return {
    red: Math.round((red + lightnessMatch) * RGB_CHANNEL_MAX),
    green: Math.round((green + lightnessMatch) * RGB_CHANNEL_MAX),
    blue: Math.round((blue + lightnessMatch) * RGB_CHANNEL_MAX),
  };
};

export const clampUnit = (value: number): number => Math.min(UNIT_MAX, Math.max(0, value));
