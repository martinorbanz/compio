import type { Composition } from "@compio/domain-composition";
import { RenderCompleteEvent, RenderRequestedEvent, renderEventHive } from "@compio/domain-events";
import { type CanvasFactory, createDomCanvas } from "./canvas/canvas-like";
import { renderComposition, type RenderPreviewOverride } from "./render-composition";

export interface RenderScheduler {
  requestRender: (composition: Composition, previewOverride?: RenderPreviewOverride) => void;
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
  let pendingPreviewOverride: RenderPreviewOverride | undefined;

  const flush = (): void => {
    rafHandle = null;
    if (!pendingComposition) return;

    const startedAt = performance.now();
    const surface = renderComposition(pendingComposition, {
      canvasFactory,
      previewOverride: pendingPreviewOverride,
    });
    onRendered(surface);

    renderEventHive.dispatchEvent(
      new RenderCompleteEvent({ durationMs: performance.now() - startedAt }),
    );
  };

  const requestRender = (
    composition: Composition,
    previewOverride?: RenderPreviewOverride,
  ): void => {
    pendingComposition = composition;
    // Always overwritten, never merged — matches pendingComposition's own
    // last-write-wins semantics, so a call with no override correctly clears
    // a previously pending one instead of reusing it.
    pendingPreviewOverride = previewOverride;
    renderEventHive.dispatchEvent(new RenderRequestedEvent({ composition }));

    if (rafHandle !== null) return;
    rafHandle = requestAnimationFrame(flush);
  };

  const dispose = (): void => {
    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
    rafHandle = null;
    pendingComposition = null;
    pendingPreviewOverride = undefined;
  };

  return { requestRender, dispose };
};
