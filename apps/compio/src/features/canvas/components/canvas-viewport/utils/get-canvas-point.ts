import type { Size2D, Vector2 } from "@compio/domain-composition";

export interface GetCanvasPointOptions {
  event: { clientX: number; clientY: number };
  element: Element;
  /** The element's logical (unzoomed) size — canvas/svg are always sized to composition.canvasSize. */
  logicalSize: Size2D;
}

/**
 * Converts a pointer event to canvas-space coordinates, correcting for
 * whatever the element's current on-screen size is versus its logical size —
 * this covers our zoom control (CSS transform: scale) without needing a zoom
 * parameter threaded through every caller.
 */
export const getCanvasPoint = ({ event, element, logicalSize }: GetCanvasPointOptions): Vector2 => {
  const rect = element.getBoundingClientRect();
  const scaleX = logicalSize.width / rect.width;
  const scaleY = logicalSize.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};
