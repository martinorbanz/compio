/**
 * Max side length (px) for the downscaled proxy image used while a
 * pointer-driven effect control (e.g. a Slider) is actively dragging — the
 * plugin's per-pixel math runs on this much smaller copy so a single
 * animation-frame tick stays cheap even on multi-megapixel layers. Only
 * applies with no active selection (see useEffectPreview) and is never used
 * for the exact, full-resolution compute on interaction-end/Apply.
 */
export const EFFECT_PREVIEW_PROXY_MAX_DIMENSION = 512;
