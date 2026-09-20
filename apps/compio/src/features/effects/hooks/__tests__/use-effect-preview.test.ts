import {
  baseLayerDefaults,
  createEmptyRaster,
  identityMatrix,
  LayerKind,
  type MaskChannel,
  type RasterImageSource,
  type RasterLayer,
} from "@compio/domain-composition";
import {
  InputType,
  OutputType,
  PluginCategory,
  PluginTriggerType,
  PluginUiInteractiveType,
  type Plugin,
  type PluginExecutionContext,
} from "@compio/domain-plugin-api";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorState } from "../../../../app/hooks";
import { EFFECT_PREVIEW_PROXY_MAX_DIMENSION } from "../../constants";
import { useEffectPreview } from "../use-effect-preview";

const { resizeRasterImageMock } = vi.hoisted(() => ({
  resizeRasterImageMock: vi.fn(
    (_image: RasterImageSource, options: { targetSize: { width: number; height: number } }) => ({
      width: options.targetSize.width,
      height: options.targetSize.height,
      data: new Uint8ClampedArray(options.targetSize.width * options.targetSize.height * 4),
    }),
  ),
}));

vi.mock("@compio/renderer-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@compio/renderer-core")>();
  return { ...actual, resizeRasterImage: resizeRasterImageMock };
});

interface FakeParams {
  amount: number;
}

const FAKE_CONTEXT: PluginExecutionContext = {
  canvasSize: { width: 4, height: 4 },
  imageSize: { width: 4, height: 4 },
};

const fakeLayer = (width = 4, height = 4): RasterLayer => ({
  ...baseLayerDefaults(),
  id: "layer-1",
  name: "Raster",
  kind: LayerKind.RASTER,
  transform: identityMatrix(),
  image: createEmptyRaster({ width, height }),
  zIndex: 0,
});

const fakeResult: RasterImageSource = createEmptyRaster({ width: 4, height: 4 });

const createFakePlugin = (): {
  plugin: Plugin<RasterImageSource, FakeParams, RasterImageSource>;
  execute: ReturnType<typeof vi.fn>;
} => {
  const execute = vi.fn(() => fakeResult);
  const plugin: Plugin<RasterImageSource, FakeParams, RasterImageSource> = {
    manifest: {
      name: "fake-effect",
      category: PluginCategory.EFFECTS,
      inputType: InputType.IMAGE_DATA,
      outputType: OutputType.IMAGE_DATA,
      uiComponents: [
        {
          title: "Fake effect",
          trigger: { type: PluginTriggerType.MENU },
          interactive: { type: PluginUiInteractiveType.DIALOG },
        },
      ],
    },
    execute,
  };
  return { plugin, execute };
};

const createFakeEditor = (): {
  editor: EditorState;
  setEffectPreview: ReturnType<typeof vi.fn>;
  clearEffectPreview: ReturnType<typeof vi.fn>;
  beginHistoryTransaction: ReturnType<typeof vi.fn>;
  updateLayerImage: ReturnType<typeof vi.fn>;
} => {
  const setEffectPreview = vi.fn();
  const clearEffectPreview = vi.fn();
  const beginHistoryTransaction = vi.fn();
  const updateLayerImage = vi.fn();
  const editor = {
    setEffectPreview,
    clearEffectPreview,
    beginHistoryTransaction,
    updateLayerImage,
  } as unknown as EditorState;
  return {
    editor,
    setEffectPreview,
    clearEffectPreview,
    beginHistoryTransaction,
    updateLayerImage,
  };
};

describe("useEffectPreview", () => {
  let pendingCallbacksByHandle: Map<number, FrameRequestCallback>;
  let nextHandle: number;

  beforeEach(() => {
    resizeRasterImageMock.mockClear();
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

  it("onLiveChange coalesces a burst into one execute() + one setEffectPreview call, using the latest params", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor, setEffectPreview } = createFakeEditor();
    const layer = fakeLayer();
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => {
      result.current.onLiveChange({ amount: 1 });
      result.current.onLiveChange({ amount: 2 });
      result.current.onLiveChange({ amount: 3 });
    });
    expect(execute).not.toHaveBeenCalled();

    act(() => flushFrame());

    // Below the proxy threshold, so the "cheap" path runs exactly on layer.image.
    expect(execute).toHaveBeenCalledExactlyOnceWith({
      input: layer.image,
      params: { amount: 3 },
      context: FAKE_CONTEXT,
    });
    expect(setEffectPreview).toHaveBeenCalledExactlyOnceWith({
      layerId: layer.id,
      image: fakeResult,
    });
  });

  it("onLiveChange runs the plugin on a downscaled proxy when the image exceeds the preview threshold, with no active selection, and pushes the small result as-is (the renderer stretches it)", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor, setEffectPreview } = createFakeEditor();
    const largeSide = EFFECT_PREVIEW_PROXY_MAX_DIMENSION * 2;
    const layer = fakeLayer(largeSide, largeSide);
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 7 }));
    act(() => flushFrame());

    const executedInput = execute.mock.calls[0]?.[0]?.input as RasterImageSource;
    expect(executedInput).not.toBe(layer.image);
    expect(Math.max(executedInput.width, executedInput.height)).toBeLessThanOrEqual(
      EFFECT_PREVIEW_PROXY_MAX_DIMENSION,
    );
    // Downscaled once, to build the proxy source — never upscaled back up
    // (that would mean a full-resolution getImageData every frame, exactly
    // what the proxy exists to avoid; the renderer stretches it at draw time).
    expect(resizeRasterImageMock).toHaveBeenCalledTimes(1);
    const preview = setEffectPreview.mock.calls[0]?.[0] as { image: RasterImageSource };
    expect(preview.image.width).toBeLessThanOrEqual(EFFECT_PREVIEW_PROXY_MAX_DIMENSION);
    expect(preview.image.height).toBeLessThanOrEqual(EFFECT_PREVIEW_PROXY_MAX_DIMENSION);
  });

  it("onLiveChange skips the proxy and runs at full resolution when a selection is active, even for a large image", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor } = createFakeEditor();
    const largeSide = EFFECT_PREVIEW_PROXY_MAX_DIMENSION * 2;
    const layer = fakeLayer(largeSide, largeSide);
    const contextWithSelection: PluginExecutionContext = {
      ...FAKE_CONTEXT,
      selection: {} as MaskChannel,
    };
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: contextWithSelection }),
    );

    act(() => result.current.onLiveChange({ amount: 7 }));
    act(() => flushFrame());

    expect(execute).toHaveBeenCalledExactlyOnceWith({
      input: layer.image,
      params: { amount: 7 },
      context: contextWithSelection,
    });
    expect(resizeRasterImageMock).not.toHaveBeenCalled();
  });

  it("onLiveChange skips the proxy and runs at full resolution when the layer has a persistent mask, even for a large image", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor } = createFakeEditor();
    const largeSide = EFFECT_PREVIEW_PROXY_MAX_DIMENSION * 2;
    const layer: RasterLayer = { ...fakeLayer(largeSide, largeSide), mask: {} as MaskChannel };
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 7 }));
    act(() => flushFrame());

    expect(execute).toHaveBeenCalledExactlyOnceWith({
      input: layer.image,
      params: { amount: 7 },
      context: FAKE_CONTEXT,
    });
    expect(resizeRasterImageMock).not.toHaveBeenCalled();
  });

  it("onInteractionEnd cancels a pending onLiveChange frame and pushes one exact, full-resolution preview", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor, setEffectPreview, updateLayerImage, beginHistoryTransaction } =
      createFakeEditor();
    const layer = fakeLayer();
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 1 })); // left pending, should be canceled
    act(() => result.current.onInteractionEnd({ amount: 9 }));
    act(() => flushFrame()); // proves the pending onLiveChange frame was actually canceled

    expect(execute).toHaveBeenCalledExactlyOnceWith({
      input: layer.image,
      params: { amount: 9 },
      context: FAKE_CONTEXT,
    });
    expect(setEffectPreview).toHaveBeenCalledExactlyOnceWith({
      layerId: layer.id,
      image: fakeResult,
    });
    expect(updateLayerImage).not.toHaveBeenCalled();
    expect(beginHistoryTransaction).not.toHaveBeenCalled();
  });

  it("applyEffect cancels any pending frame, then bakes: beginHistoryTransaction -> updateLayerImage -> clearEffectPreview, never calling setEffectPreview", () => {
    const { plugin, execute } = createFakePlugin();
    const {
      editor,
      setEffectPreview,
      clearEffectPreview,
      beginHistoryTransaction,
      updateLayerImage,
    } = createFakeEditor();
    const layer = fakeLayer();
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 1 })); // left pending, should be canceled
    act(() => result.current.applyEffect({ amount: 5 }));
    act(() => flushFrame()); // proves the pending onLiveChange frame was actually canceled

    expect(execute).toHaveBeenCalledExactlyOnceWith({
      input: layer.image,
      params: { amount: 5 },
      context: FAKE_CONTEXT,
    });
    expect(beginHistoryTransaction).toHaveBeenCalledOnce();
    expect(updateLayerImage).toHaveBeenCalledExactlyOnceWith(layer.id, fakeResult);
    expect(clearEffectPreview).toHaveBeenCalledOnce();
    expect(setEffectPreview).not.toHaveBeenCalled();
    expect(beginHistoryTransaction.mock.invocationCallOrder[0]).toBeLessThan(
      updateLayerImage.mock.invocationCallOrder[0]!,
    );
    expect(updateLayerImage.mock.invocationCallOrder[0]).toBeLessThan(
      clearEffectPreview.mock.invocationCallOrder[0]!,
    );
  });

  it("discardPreview only clears the preview and cancels any pending frame, never touching layer.image", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor, clearEffectPreview, updateLayerImage, beginHistoryTransaction } =
      createFakeEditor();
    const layer = fakeLayer();
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 1 }));
    act(() => result.current.discardPreview());
    act(() => flushFrame());

    expect(clearEffectPreview).toHaveBeenCalledOnce();
    expect(execute).not.toHaveBeenCalled();
    expect(updateLayerImage).not.toHaveBeenCalled();
    expect(beginHistoryTransaction).not.toHaveBeenCalled();
  });

  it("discardPreview drops the cached proxy — a later onLiveChange rebuilds it rather than reusing a stale one", () => {
    const { plugin } = createFakePlugin();
    const { editor } = createFakeEditor();
    const largeSide = EFFECT_PREVIEW_PROXY_MAX_DIMENSION * 2;
    const layer = fakeLayer(largeSide, largeSide);
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 1 }));
    act(() => flushFrame());
    expect(resizeRasterImageMock).toHaveBeenCalledTimes(1);

    act(() => result.current.discardPreview());
    act(() => result.current.onLiveChange({ amount: 2 }));
    act(() => flushFrame());

    expect(resizeRasterImageMock).toHaveBeenCalledTimes(2);
  });

  it("applyEffect drops the cached proxy — a later onLiveChange rebuilds it rather than reusing a stale one", () => {
    const { plugin } = createFakePlugin();
    const { editor } = createFakeEditor();
    const largeSide = EFFECT_PREVIEW_PROXY_MAX_DIMENSION * 2;
    const layer = fakeLayer(largeSide, largeSide);
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer, plugin, context: FAKE_CONTEXT }),
    );

    act(() => result.current.onLiveChange({ amount: 1 }));
    act(() => flushFrame());
    expect(resizeRasterImageMock).toHaveBeenCalledTimes(1);

    act(() => result.current.applyEffect({ amount: 2 }));
    act(() => result.current.onLiveChange({ amount: 3 }));
    act(() => flushFrame());

    expect(resizeRasterImageMock).toHaveBeenCalledTimes(2);
  });

  it("is a safe no-op when layer is null", () => {
    const { plugin, execute } = createFakePlugin();
    const { editor, setEffectPreview, updateLayerImage } = createFakeEditor();
    const { result } = renderHook(() =>
      useEffectPreview({ editor, layer: null, plugin, context: FAKE_CONTEXT }),
    );

    act(() => {
      result.current.onLiveChange({ amount: 1 });
      result.current.onInteractionEnd({ amount: 1 });
      result.current.applyEffect({ amount: 1 });
      result.current.discardPreview();
    });
    act(() => flushFrame());

    expect(execute).not.toHaveBeenCalled();
    expect(setEffectPreview).not.toHaveBeenCalled();
    expect(updateLayerImage).not.toHaveBeenCalled();
  });
});
