import type { Composition } from "@compio/domain-composition";
import { RenderCompleteEvent, RenderRequestedEvent, renderEventHive } from "@compio/domain-events";
import { type CanvasFactory, createDomCanvas } from "./canvas/canvas-like";
import { renderComposition } from "./render-composition";

export interface RenderScheduler {
  requestRender: (composition: Composition) => void;
  dispose: () => void;
}

/**
 * Coalesces bursts of requestRender calls (e.g. every pointermove during a
 * drag) into one actual composite per animation frame, so interaction-time
 * updates don't re-render faster than the display can show them.
 */
export const createRenderScheduler = (
  onRendered: (surface: ReturnType<CanvasFactory>) => void,
  canvasFactory: CanvasFactory = createDomCanvas,
): RenderScheduler => {
  let rafHandle: number | null = null;
  let pendingComposition: Composition | null = null;

  const flush = (): void => {
    rafHandle = null;
    if (!pendingComposition) return;

    const startedAt = performance.now();
    const surface = renderComposition(pendingComposition, canvasFactory);
    onRendered(surface);

    renderEventHive.dispatchEvent(
      new RenderCompleteEvent({ durationMs: performance.now() - startedAt }),
    );
  };

  const requestRender = (composition: Composition): void => {
    pendingComposition = composition;
    renderEventHive.dispatchEvent(new RenderRequestedEvent({ composition }));

    if (rafHandle !== null) return;
    rafHandle = requestAnimationFrame(flush);
  };

  const dispose = (): void => {
    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
    rafHandle = null;
    pendingComposition = null;
  };

  return { requestRender, dispose };
};
