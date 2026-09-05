import { coalesceToAnimationFrame, type AnimationFrameCoalescer } from "@compio/renderer-core";
import { useEffect, useRef } from "react";

/**
 * React wrapper around `coalesceToAnimationFrame`: returns a stable function
 * (safe to pass as a prop/event handler without re-subscribing) that always
 * invokes the latest `callback` from the most recent render — the ref
 * indirection avoids the stale-closure trap plain memoization would hit once
 * a call lands after the component that created it has re-rendered.
 */
export const useCoalescedCallback = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
): ((...args: TArgs) => void) => {
  const latestCallbackRef = useRef(callback);
  latestCallbackRef.current = callback;

  const coalescedRef = useRef<AnimationFrameCoalescer<TArgs> | null>(null);
  if (!coalescedRef.current) {
    coalescedRef.current = coalesceToAnimationFrame((...args: TArgs) =>
      latestCallbackRef.current(...args),
    );
  }

  useEffect(() => {
    const coalesced = coalescedRef.current;
    return () => coalesced?.cancel();
  }, []);

  return coalescedRef.current;
};
