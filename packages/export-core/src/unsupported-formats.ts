/**
 * Layered-file export formats called out in the spec but out of scope for
 * this pass — see README Roadmap. Kept as named stubs (rather than silently
 * absent) so the File > Export menu can list them as visibly disabled.
 */
export const UNSUPPORTED_EXPORT_FORMATS = ["psd", "tiff"] as const;
export type UnsupportedExportFormat = (typeof UNSUPPORTED_EXPORT_FORMATS)[number];

export const exportUnsupportedFormat = (format: UnsupportedExportFormat): never => {
  throw new Error(`Export to .${format} is not implemented yet — see README Roadmap`);
};
