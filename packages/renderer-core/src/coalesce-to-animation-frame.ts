export interface AnimationFrameCoalescer<TArgs extends unknown[]> {
  (...args: TArgs): void;
  cancel: () => void;
}

/**
 * Wraps `callback` so a burst of calls within one animation frame (e.g.
 * every pointermove) collapses to a single call with the most recent
 * arguments, fired just before the next paint — the same coalescing
 * `createRenderScheduler` already does for renders, generalized for any
 * per-event work (matrix math, state dispatch) that doesn't need to run
 * faster than the display can show it.
 */
export const coalesceToAnimationFrame = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
): AnimationFrameCoalescer<TArgs> => {
  let rafHandle: number | null = null;
  let pendingArgs: TArgs | null = null;

  const flush = (): void => {
    rafHandle = null;
    if (!pendingArgs) return;

    const args = pendingArgs;
    pendingArgs = null;
    callback(...args);
  };

  const coalesced = ((...args: TArgs): void => {
    pendingArgs = args;
    if (rafHandle !== null) return;
    rafHandle = requestAnimationFrame(flush);
  }) as AnimationFrameCoalescer<TArgs>;

  coalesced.cancel = (): void => {
    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
    rafHandle = null;
    pendingArgs = null;
  };

  return coalesced;
};
