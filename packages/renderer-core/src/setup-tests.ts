// jsdom doesn't implement ImageData (no native canvas backend). renderComposition
// constructs real ImageData instances regardless of whether the CanvasFactory is
// faked, so tests need at least a structural stand-in.
if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    // Must mirror the native ImageData(data, width, height) constructor shape exactly.
    // eslint-disable-next-line max-params
    constructor(data: Uint8ClampedArray, width: number, height?: number) {
      this.data = data;
      this.width = width;
      this.height = height ?? data.length / (width * 4);
    }
  }
  // @ts-expect-error minimal test-only polyfill, not spec-complete
  globalThis.ImageData = ImageDataPolyfill;
}
