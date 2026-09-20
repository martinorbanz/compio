import type { RasterImageSource, RasterLayer, Size2D } from "@compio/domain-composition";
import type { Plugin, PluginExecutionContext } from "@compio/domain-plugin-api";
import {
  coalesceToAnimationFrame,
  resizeRasterImage,
  type AnimationFrameCoalescer,
} from "@compio/renderer-core";
import { useCallback, useEffect, useRef } from "react";
import type { EditorState } from "../../../app/hooks";
import { EFFECT_PREVIEW_PROXY_MAX_DIMENSION } from "../constants";

export interface UseEffectPreviewOptions<TParams> {
  editor: EditorState;
  layer: RasterLayer | null;
  plugin: Plugin<RasterImageSource, TParams, RasterImageSource>;
  context: PluginExecutionContext;
}

export interface EffectPreviewControls<TParams> {
  /**
   * Call on every parameter change while the Live-preview checkbox is on and
   * a pointer-driven control is actively dragging (e.g. Slider onChange).
   * Coalesced to one execute()+push per animation frame. The first call of a
   * drag lazily creates the downscaled proxy (see proxyCacheRef); later calls
   * in the same drag reuse it. Skipped when there's an active selection or
   * the layer has a persistent mask — runs at full resolution instead.
   */
  onLiveChange: (params: TParams) => void;
  /** Call once an interaction settles (e.g. Slider onCommit) or for a one-off change (e.g. toggling preview on) — cancels any pending frame and computes the exact, full-resolution result. Does not touch the proxy. */
  onInteractionEnd: (params: TParams) => void;
  /** The one explicit, user-triggered pixel bake — full-fidelity execute() + undo boundary, clears the preview, and drops the now-stale proxy (the baked image is a new object). */
  applyEffect: (params: TParams) => void;
  /** Cancel / dialog-close: drop the preview and the proxy. Nothing was ever baked, so there is nothing to restore. */
  discardPreview: () => void;
}

const fitWithinMaxDimension = (size: Size2D, maxDimension: number): Size2D => {
  const largestSide = Math.max(size.width, size.height);
  if (largestSide <= maxDimension) return size;

  const scale = maxDimension / largestSide;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
};

/**
 * Generalizes live preview across every EFFECTS plugin: a dialog calls
 * onLiveChange while a pointer-driven control drags, onInteractionEnd once it
 * settles, applyEffect once on "Apply". The preview never touches
 * layer.image/undo history (see RenderPreviewOverride in renderer-core) —
 * only applyEffect performs the one explicit pixel bake CLAUDE.md's
 * non-destructive rule requires.
 */
export const useEffectPreview = <TParams>({
  editor,
  layer,
  plugin,
  context,
}: UseEffectPreviewOptions<TParams>): EffectPreviewControls<TParams> => {
  const { setEffectPreview, clearEffectPreview, beginHistoryTransaction, updateLayerImage } =
    editor;

  // Latest-ref indirection so the stable coalesced callback below (created
  // once) never closes over a stale layer/context/plugin from the render
  // that created it — same stale-closure guard as use-coalesced-callback.ts.
  const layerRef = useRef(layer);
  layerRef.current = layer;
  const contextRef = useRef(context);
  contextRef.current = context;
  const pluginRef = useRef(plugin);
  pluginRef.current = plugin;

  // Downscaled proxy of the current layer's image. Created lazily by
  // getProxySource on the first onLiveChange call of a drag (never
  // preemptively), and explicitly torn down by discardPreview/applyEffect
  // below — a canceled or applied edit should never leave a stale proxy of
  // the pre-edit image sitting in memory. Never used when a selection is
  // active: the mask sampler maps a pixel's LOCAL coordinates through
  // layerTransform into canvas space (see blendBySelection), which only
  // lines up at the image's true resolution. Same reasoning for a layer that
  // already carries a persistent mask (renderer-core's masking composites at
  // the substituted image's own resolution, which must match the mask's).
  const proxyCacheRef = useRef<{ source: RasterImageSource; proxy: RasterImageSource } | null>(
    null,
  );

  const getProxySource = (sourceImage: RasterImageSource): RasterImageSource => {
    const cached = proxyCacheRef.current;
    if (cached && cached.source === sourceImage) return cached.proxy;

    const proxySize = fitWithinMaxDimension(sourceImage, EFFECT_PREVIEW_PROXY_MAX_DIMENSION);
    const isAlreadySmallEnough =
      proxySize.width === sourceImage.width && proxySize.height === sourceImage.height;
    const proxy = isAlreadySmallEnough
      ? sourceImage
      : resizeRasterImage(sourceImage, { targetSize: proxySize });
    proxyCacheRef.current = { source: sourceImage, proxy };
    return proxy;
  };

  // Stable identities (read only refs) so it's safe to list either as a
  // dependency below without ever going stale.
  const runEffectExact = useCallback((params: TParams): RasterImageSource | null => {
    const currentLayer = layerRef.current;
    if (!currentLayer) return null;
    return pluginRef.current.execute({
      input: currentLayer.image,
      params,
      context: contextRef.current,
    });
  }, []);

  // Returns the plugin's output at whatever resolution it ran at — the
  // renderer stretches a smaller-than-native result back up to the layer's
  // true size at draw time (see RenderPreviewOverride/previewDisplaySize in
  // renderer-core), so this deliberately never upscales the result itself:
  // that would mean a full-resolution getImageData read-back on every frame,
  // exactly the cost the proxy exists to avoid.
  const runEffectCheap = useCallback(
    (params: TParams): RasterImageSource | null => {
      const currentLayer = layerRef.current;
      if (!currentLayer) return null;
      if (contextRef.current.selection || currentLayer.mask) return runEffectExact(params);

      const proxySource = getProxySource(currentLayer.image);
      if (proxySource === currentLayer.image) return runEffectExact(params);

      return pluginRef.current.execute({ input: proxySource, params, context: contextRef.current });
    },
    [runEffectExact],
  );

  const coalescerRef = useRef<AnimationFrameCoalescer<[TParams]> | null>(null);

  coalescerRef.current ??= coalesceToAnimationFrame((params: TParams) => {
    const currentLayer = layerRef.current;
    const result = runEffectCheap(params);

    if (!currentLayer || !result) return;

    setEffectPreview({ layerId: currentLayer.id, image: result });
  });

  useEffect(() => {
    const coalescer = coalescerRef.current;

    return () => coalescer?.cancel();
  }, []);

  const onLiveChange = useCallback((params: TParams) => {
    coalescerRef.current?.(params);
  }, []);

  const onInteractionEnd = useCallback(
    (params: TParams) => {
      coalescerRef.current?.cancel();

      const currentLayer = layerRef.current;
      const result = runEffectExact(params);

      if (!currentLayer || !result) return;

      setEffectPreview({ layerId: currentLayer.id, image: result });
    },
    [runEffectExact, setEffectPreview],
  );

  const applyEffect = useCallback(
    (params: TParams) => {
      coalescerRef.current?.cancel();

      const currentLayer = layerRef.current;
      const result = runEffectExact(params);

      if (!currentLayer || !result) return;

      beginHistoryTransaction();
      updateLayerImage(currentLayer.id, result);
      clearEffectPreview();
      // The baked image is a new object identity, so the proxy — built from
      // the pre-edit image — is stale the instant this returns; drop it now
      // instead of waiting for the next edit session to overwrite it.
      proxyCacheRef.current = null;
    },
    [runEffectExact, beginHistoryTransaction, updateLayerImage, clearEffectPreview],
  );

  const discardPreview = useCallback(() => {
    coalescerRef.current?.cancel();
    clearEffectPreview();
    proxyCacheRef.current = null;
  }, [clearEffectPreview]);

  return { onLiveChange, onInteractionEnd, applyEffect, discardPreview };
};
