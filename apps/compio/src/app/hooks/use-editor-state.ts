import {
  addLayer,
  baseLayerDefaults,
  createEmptyComposition,
  createId,
  identityMatrix,
  LayerKind,
  removeLayer,
  setSelection,
  updateLayerTransform as updateLayerTransformOp,
  updateRasterLayerImage,
  type BlendMode,
  type Composition,
  type MaskChannel,
  type Matrix2D,
  type RasterImageSource,
  type RGBAColor,
} from "@compio/domain-composition";
import {
  CompositionLoadedEvent,
  compositionEventHive,
  LayerAddedEvent,
  LayerRemovedEvent,
  LayerTransformedEvent,
  SelectionChangedEvent,
} from "@compio/domain-events";
import {
  TOOL_NAMES,
  textTool,
  type ShapeRect,
  type TextToolParams,
} from "@compio/plugins-tools-core";
import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_HARDNESS,
  DEFAULT_BRUSH_OPACITY,
  DEFAULT_BRUSH_RADIUS,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_TEXT_COLOR,
} from "../constants";
import { useUndoHistory } from "./use-undo-history";

export interface BrushSettingsState {
  radius: number;
  hardness: number;
  opacity: number;
  color: RGBAColor;
}

export interface PixelSelectionState {
  mask: MaskChannel | null;
  /** Bounding rect for the persistent "marching ants" overlay — see CanvasViewport. */
  bounds: ShapeRect | null;
}

const EMPTY_SELECTION: PixelSelectionState = { mask: null, bounds: null };

export const useEditorState = () => {
  const history = useUndoHistory<Composition>(() => createEmptyComposition(DEFAULT_CANVAS_SIZE));
  const composition = history.present;
  const [activeToolName, setActiveToolName] = useState<string>(TOOL_NAMES.MOVE);
  const [selection, setSelectionState] = useState<PixelSelectionState>(EMPTY_SELECTION);
  const [brushSettings, setBrushSettings] = useState<BrushSettingsState>({
    radius: DEFAULT_BRUSH_RADIUS,
    hardness: DEFAULT_BRUSH_HARDNESS,
    opacity: DEFAULT_BRUSH_OPACITY,
    color: DEFAULT_BRUSH_COLOR,
  });
  const [textColor, setTextColor] = useState<RGBAColor>(DEFAULT_TEXT_COLOR);

  const loadComposition = useCallback(
    (next: Composition) => {
      history.reset(next);
      compositionEventHive.dispatchEvent(new CompositionLoadedEvent({ composition: next }));
    },
    [history],
  );

  const addRasterLayer = useCallback(
    (image: RasterImageSource, name = "Layer") => {
      history.commit((prev) => {
        const layer = {
          ...baseLayerDefaults(),
          id: createId(),
          name,
          kind: LayerKind.RASTER as const,
          transform: identityMatrix(),
          image,
        };
        const next = addLayer(prev, layer);
        compositionEventHive.dispatchEvent(
          new LayerAddedEvent({ layer: next.layers[next.layers.length - 1]! }),
        );
        return next;
      });
    },
    [history],
  );

  const addTextLayer = useCallback(
    (params: TextToolParams) => {
      history.commit((prev) => {
        const layer = textTool.execute({
          input: undefined,
          params,
          context: { canvasSize: prev.canvasSize, imageSize: prev.imageSize },
        });
        const next = addLayer(prev, layer);
        compositionEventHive.dispatchEvent(
          new LayerAddedEvent({ layer: next.layers[next.layers.length - 1]! }),
        );
        return next;
      });
    },
    [history],
  );

  const removeSelectedLayers = useCallback(() => {
    history.commit((prev) =>
      prev.selectedLayerIds.reduce((compositionSoFar, layerId) => {
        compositionEventHive.dispatchEvent(new LayerRemovedEvent({ layerId }));
        return removeLayer(compositionSoFar, layerId);
      }, prev),
    );
  }, [history]);

  const selectLayer = useCallback(
    (layerId: string | null) => {
      history.setPresent((prev) => {
        const layerIds = layerId ? [layerId] : [];
        const next = setSelection(prev, layerIds);
        compositionEventHive.dispatchEvent(new SelectionChangedEvent({ layerIds }));
        return next;
      });
    },
    [history],
  );

  const setPixelSelection = useCallback((mask: MaskChannel, bounds: ShapeRect) => {
    setSelectionState({ mask, bounds });
  }, []);

  const clearSelection = useCallback(() => setSelectionState(EMPTY_SELECTION), []);

  /** Starts a new undo step — call once at the beginning of a drag/stroke, before any live updates. */
  const beginHistoryTransaction = useCallback(() => history.beginTransaction(), [history]);

  // Live update: fires continuously during a transform drag. The drag's
  // starting state is snapshotted separately via beginHistoryTransaction.
  const updateLayerTransform = useCallback(
    (layerId: string, transform: Matrix2D) => {
      history.setPresent((prev) => {
        const next = updateLayerTransformOp({ composition: prev, layerId, transform });
        compositionEventHive.dispatchEvent(new LayerTransformedEvent({ layerId, transform }));
        return next;
      });
    },
    [history],
  );

  // Live update: fires continuously during a paint stroke and once for a
  // single-shot effect apply — either way, the caller owns the undo boundary.
  const updateLayerImage = useCallback(
    (layerId: string, image: RasterImageSource) => {
      history.setPresent((prev) => updateRasterLayerImage({ composition: prev, layerId, image }));
    },
    [history],
  );

  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      history.setPresent((prev) => ({
        ...prev,
        layers: prev.layers.map((layer) => (layer.id === layerId ? { ...layer, opacity } : layer)),
        updatedAt: new Date().toISOString(),
      }));
    },
    [history],
  );

  const setLayerBlendMode = useCallback(
    (layerId: string, blendMode: BlendMode) => {
      history.commit((prev) => ({
        ...prev,
        layers: prev.layers.map((layer) =>
          layer.id === layerId ? { ...layer, blendMode } : layer,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [history],
  );

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      history.commit((prev) => ({
        ...prev,
        layers: prev.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [history],
  );

  const toggleLayerLocked = useCallback(
    (layerId: string) => {
      history.commit((prev) => ({
        ...prev,
        layers: prev.layers.map((layer) =>
          layer.id === layerId ? { ...layer, locked: !layer.locked } : layer,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [history],
  );

  const selectedLayer = useMemo(
    () => composition.layers.find((layer) => layer.id === composition.selectedLayerIds[0]) ?? null,
    [composition],
  );

  return {
    composition,
    loadComposition,
    activeToolName,
    setActiveToolName,
    selection,
    setPixelSelection,
    clearSelection,
    brushSettings,
    setBrushSettings,
    textColor,
    setTextColor,
    selectedLayer,
    addRasterLayer,
    addTextLayer,
    removeSelectedLayers,
    selectLayer,
    beginHistoryTransaction,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    updateLayerTransform,
    updateLayerImage,
    setLayerOpacity,
    setLayerBlendMode,
    toggleLayerVisibility,
    toggleLayerLocked,
  };
};

export type EditorState = ReturnType<typeof useEditorState>;
