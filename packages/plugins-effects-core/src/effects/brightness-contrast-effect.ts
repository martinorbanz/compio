import {
  blendBySelection,
  RGBA_CHANNELS,
  type RasterImageSource,
} from "@compio/domain-composition";
import {
  InputType,
  MenuName,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
  type Plugin,
} from "@compio/domain-plugin-api";
import { EFFECT_NAMES, MID_GRAY, RGB_MAX } from "../constants";

const ALPHA_CHANNEL_OFFSET = RGBA_CHANNELS - 1;

export interface BrightnessContrastParams {
  /** -100..100 */
  brightness: number;
  /** -100..100 */
  contrast: number;
}

/**
 * Classic brightness/contrast pixel transform. Uint8ClampedArray auto-clamps
 * writes to 0..255, so no manual clamping is needed after the math.
 */
const applyBrightnessContrast = (
  image: RasterImageSource,
  params: BrightnessContrastParams,
): RasterImageSource => {
  const contrastScaled = (params.contrast / 100) * RGB_MAX;
  const contrastFactor = (259 * (contrastScaled + RGB_MAX)) / (RGB_MAX * (259 - contrastScaled));
  const brightnessOffset = (params.brightness / 100) * RGB_MAX;

  const data = Uint8ClampedArray.from(image.data, (value, byteIndex) => {
    const isAlphaChannel = byteIndex % RGBA_CHANNELS === ALPHA_CHANNEL_OFFSET;
    if (isAlphaChannel) return value;

    return contrastFactor * (value - MID_GRAY) + MID_GRAY + brightnessOffset;
  });

  return { width: image.width, height: image.height, data };
};

/** Matches the spec's own worked example: MENU trigger under Image Settings, opening a DIALOG. */
export const brightnessContrastEffect: Plugin<
  RasterImageSource,
  BrightnessContrastParams,
  RasterImageSource
> = {
  manifest: {
    name: EFFECT_NAMES.BRIGHTNESS_CONTRAST,
    category: PluginCategory.EFFECTS,
    inputType: InputType.IMAGE_DATA,
    outputType: OutputType.IMAGE_DATA,
    uiComponents: [
      {
        title: EFFECT_NAMES.BRIGHTNESS_CONTRAST,
        trigger: { type: PluginTriggerType.MENU, menu: MenuName.IMAGE_SETTINGS },
        interactive: { type: PluginUiInteractiveType.DIALOG },
      },
    ],
  },
  execute: ({ input, params, context }) =>
    blendBySelection({
      original: input,
      modified: applyBrightnessContrast(input, params),
      selection: context.selection,
      layerTransform: context.layerTransform,
    }),
};
