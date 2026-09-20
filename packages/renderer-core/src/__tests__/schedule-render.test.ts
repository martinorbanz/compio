import type { Composition } from "@compio/domain-composition";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RenderPreviewOverride } from "../render-composition";
import { createRenderScheduler } from "../schedule-render";

const { renderCompositionMock } = vi.hoisted(() => ({
  renderCompositionMock: vi.fn(),
}));

vi.mock("../render-composition", () => ({
  renderComposition: (...args: unknown[]) => renderCompositionMock(...args),
}));

describe("createRenderScheduler", () => {
  let pendingCallbacksByHandle: Map<number, FrameRequestCallback>;
  let nextHandle: number;

  beforeEach(() => {
    renderCompositionMock.mockClear();
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

  const composition = {} as Composition;

  it("coalesces a burst of requestRender calls into one render, using the last-passed override", () => {
    const onRendered = vi.fn();
    const scheduler = createRenderScheduler(onRendered);
    const overrideA: RenderPreviewOverride = {
      layerId: "layer-a",
      image: { width: 1, height: 1, data: new Uint8ClampedArray() },
    };
    const overrideB: RenderPreviewOverride = {
      layerId: "layer-b",
      image: { width: 1, height: 1, data: new Uint8ClampedArray() },
    };

    scheduler.requestRender(composition, overrideA);
    scheduler.requestRender(composition, overrideB);
    expect(renderCompositionMock).not.toHaveBeenCalled();

    flushFrame();

    expect(renderCompositionMock).toHaveBeenCalledTimes(1);
    expect(renderCompositionMock).toHaveBeenCalledWith(
      composition,
      expect.objectContaining({ previewOverride: overrideB }),
    );
    expect(onRendered).toHaveBeenCalledTimes(1);
  });

  it("clears a previously pending override when a later call passes none", () => {
    const onRendered = vi.fn();
    const scheduler = createRenderScheduler(onRendered);
    const override: RenderPreviewOverride = {
      layerId: "layer-a",
      image: { width: 1, height: 1, data: new Uint8ClampedArray() },
    };

    scheduler.requestRender(composition, override);
    scheduler.requestRender(composition);
    flushFrame();

    expect(renderCompositionMock).toHaveBeenCalledTimes(1);
    expect(renderCompositionMock).toHaveBeenCalledWith(
      composition,
      expect.objectContaining({ previewOverride: undefined }),
    );
  });
});
