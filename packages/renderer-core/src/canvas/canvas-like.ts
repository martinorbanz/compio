/**
 * Structural port over the 2D drawing surface. Kept minimal (not the full
 * HTMLCanvasElement/OffscreenCanvas surface) so the compositor stays testable
 * with a hand-rolled fake, and swappable for an OffscreenCanvas in a worker later.
 */
export type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface CanvasLike {
  width: number;
  height: number;
  getContext(kind: "2d"): Canvas2DContext | null;
}

export type CanvasFactory = (width: number, height: number) => CanvasLike;

/** Default factory for browser use. Not exercised by unit tests (see vitest.config.ts). */
export const createDomCanvas: CanvasFactory = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};
