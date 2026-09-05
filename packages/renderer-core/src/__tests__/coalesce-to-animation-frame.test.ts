import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coalesceToAnimationFrame } from "../coalesce-to-animation-frame";

describe("coalesceToAnimationFrame", () => {
  let pendingCallbacksByHandle: Map<number, FrameRequestCallback>;
  let nextHandle: number;

  beforeEach(() => {
    pendingCallbacksByHandle = new Map();
    nextHandle = 1;

    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback): number => {
      const handle = nextHandle;
      nextHandle += 1;
      pendingCallbacksByHandle.set(handle, callback);
      return handle;
    });
    vi.stubGlobal("cancelAnimationFrame", (handle: number): void => {
      pendingCallbacksByHandle.delete(handle);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const flushFrame = (): void => {
    const callbacks = [...pendingCallbacksByHandle.entries()];
    pendingCallbacksByHandle.clear();
    callbacks.forEach(([handle, callback]) => callback(handle));
  };

  it("collapses a burst of calls into one, using the most recent arguments", () => {
    const callback = vi.fn();
    const coalesced = coalesceToAnimationFrame(callback);

    coalesced("first");
    coalesced("second");
    coalesced("third");
    expect(callback).not.toHaveBeenCalled();

    flushFrame();
    expect(callback).toHaveBeenCalledExactlyOnceWith("third");
  });

  it("fires again on the next frame for calls made after the previous flush", () => {
    const callback = vi.fn();
    const coalesced = coalesceToAnimationFrame(callback);

    coalesced("first");
    flushFrame();
    coalesced("second");
    flushFrame();

    expect(callback).toHaveBeenNthCalledWith(1, "first");
    expect(callback).toHaveBeenNthCalledWith(2, "second");
  });

  it("cancel() drops a pending call before it flushes", () => {
    const callback = vi.fn();
    const coalesced = coalesceToAnimationFrame(callback);

    coalesced("first");
    coalesced.cancel();
    flushFrame();

    expect(callback).not.toHaveBeenCalled();
  });
});
