import {
  applyMatrixToPoint,
  invertMatrix,
  LayerKind,
  type Matrix2D,
  type Vector2,
} from "@compio/domain-composition";
import { createRenderScheduler, hitTestLayer, type RenderScheduler } from "@compio/renderer-core";
import {
  brushTool,
  eraserTool,
  geometricSelectionTool,
  TOOL_NAMES,
  type ShapeRect,
} from "@compio/plugins-tools-core";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { EditorState, ViewportZoomState } from "../../../../app/hooks";
import { TransformBoundingBox } from "./components/transform-bounding-box";
import { getCanvasPoint, interpolatePoints, rectFromPoints } from "./utils";

const TRANSFORM_TOOLS: readonly string[] = [TOOL_NAMES.MOVE, TOOL_NAMES.SCALE, TOOL_NAMES.ROTATE];
/** Below this pointer travel, a pointerdown+pointerup pair counts as a click, not a drag. */
const CLICK_MOVEMENT_THRESHOLD = 3;
const VIEWPORT_PADDING = 32;

/** repeating-conic-gradient checkerboard, matching the app's grayscale palette. */
const CHECKERBOARD_STYLE = {
  backgroundImage:
    "conic-gradient(#e5e7eb 90deg, #f9fafb 90deg 180deg, #e5e7eb 180deg 270deg, #f9fafb 270deg)",
  backgroundSize: "20px 20px",
};

interface PaintDragState {
  tool: typeof TOOL_NAMES.BRUSH | typeof TOOL_NAMES.ERASER;
  lastPoint: Vector2;
}

interface SelectionDragState {
  startPoint: Vector2;
}

export interface CanvasViewportProps {
  editor: EditorState;
  viewportZoom: ViewportZoomState;
  /** Incremented each time the user picks View > Fit to Window. */
  fitToWindowRequestId: number;
  onTextToolClick: (point: Vector2) => void;
}

export const CanvasViewport = ({
  editor,
  viewportZoom,
  fitToWindowRequestId,
  onTextToolClick,
}: CanvasViewportProps): ReactElement => {
  const {
    composition,
    activeToolName,
    selectedLayer,
    selectLayer,
    selection,
    setPixelSelection,
    brushSettings,
    beginHistoryTransaction,
    updateLayerTransform,
    updateLayerImage,
    effectPreview,
  } = editor;
  const { zoom, setZoom } = viewportZoom;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const schedulerRef = useRef<RenderScheduler | null>(null);
  const paintDragRef = useRef<PaintDragState | null>(null);
  const selectionDragRef = useRef<SelectionDragState | null>(null);
  const pointerDownPointRef = useRef<Vector2 | null>(null);
  const [liveMarqueeRect, setLiveMarqueeRect] = useState<ShapeRect | null>(null);

  useEffect(() => {
    schedulerRef.current = createRenderScheduler((surface) => {
      const visible = canvasRef.current;
      if (!visible) return;
      if (visible.width !== surface.width) visible.width = surface.width;
      if (visible.height !== surface.height) visible.height = surface.height;
      const context = visible.getContext("2d");
      if (!context) return;

      // The offscreen surface is only opaque where layers actually paint;
      // without clearing first, stale pixels from a previous frame (a layer
      // that moved or was deleted) keep showing through underneath.
      context.clearRect(0, 0, visible.width, visible.height);
      context.drawImage(surface as unknown as CanvasImageSource, 0, 0);
    });
    return () => schedulerRef.current?.dispose();
  }, []);

  useEffect(() => {
    schedulerRef.current?.requestRender(composition, effectPreview ?? undefined);
  }, [composition, effectPreview]);

  useEffect(() => {
    if (fitToWindowRequestId === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const availableWidth = container.clientWidth - VIEWPORT_PADDING * 2;
    const availableHeight = container.clientHeight - VIEWPORT_PADDING * 2;
    const scaleToFit = Math.min(
      availableWidth / composition.canvasSize.width,
      availableHeight / composition.canvasSize.height,
    );
    setZoom(scaleToFit);
    // Only re-fit when the user explicitly asks — not on every canvas-size/zoom change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToWindowRequestId]);

  const executionContext = {
    canvasSize: composition.canvasSize,
    imageSize: composition.imageSize,
    selection: selection.mask ?? undefined,
    layerTransform: selectedLayer?.transform,
  };

  const applyStroke = (points: Vector2[]): void => {
    if (!selectedLayer || selectedLayer.kind !== LayerKind.RASTER) return;

    // Stroke points arrive in canvas space; the raster buffer is in the
    // layer's own local space, so a moved/scaled/rotated layer needs the
    // inverse of its transform applied before painting lands in the right place.
    const toLocalSpace = invertMatrix(selectedLayer.transform);
    const localPoints = points.map((point) => applyMatrixToPoint(toLocalSpace, point));

    const tool = paintDragRef.current?.tool === TOOL_NAMES.ERASER ? eraserTool : brushTool;
    const result = tool.execute({
      input: { image: selectedLayer.image, strokePoints: localPoints },
      params: brushSettings,
      context: executionContext,
    });
    updateLayerImage(selectedLayer.id, result);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    const point = getCanvasPoint({
      event,
      element: event.currentTarget,
      logicalSize: composition.canvasSize,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDownPointRef.current = point;

    if (activeToolName === TOOL_NAMES.TEXT) {
      onTextToolClick(point);
      return;
    }
    if (activeToolName === TOOL_NAMES.GEOMETRIC_SELECTION) {
      selectionDragRef.current = { startPoint: point };
      setLiveMarqueeRect({ x: point.x, y: point.y, width: 0, height: 0 });
      return;
    }
    if (
      (activeToolName === TOOL_NAMES.BRUSH || activeToolName === TOOL_NAMES.ERASER) &&
      selectedLayer?.kind === LayerKind.RASTER
    ) {
      beginHistoryTransaction();
      paintDragRef.current = { tool: activeToolName, lastPoint: point };
      applyStroke([point]);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    const point = getCanvasPoint({
      event,
      element: event.currentTarget,
      logicalSize: composition.canvasSize,
    });

    if (paintDragRef.current) {
      const points = interpolatePoints({
        from: paintDragRef.current.lastPoint,
        destination: point,
        spacing: brushSettings.radius / 4,
      });
      applyStroke(points);
      paintDragRef.current.lastPoint = point;
      return;
    }
    if (selectionDragRef.current) {
      setLiveMarqueeRect(rectFromPoints(selectionDragRef.current.startPoint, point));
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (selectionDragRef.current && liveMarqueeRect) {
      const mask = geometricSelectionTool.execute({
        input: {
          canvasSize: composition.canvasSize,
          existingSelection: selection.mask ?? undefined,
        },
        params: { shape: "rectangle", rect: liveMarqueeRect, operation: "replace" },
        context: executionContext,
      });
      setPixelSelection(mask, liveMarqueeRect);
      setLiveMarqueeRect(null);
    } else if (TRANSFORM_TOOLS.includes(activeToolName)) {
      // Note: this handler only ever fires when the click missed the
      // TransformBoundingBox Clicking anywhere inside a selection always means "grab it",
      // even over that layer's own transparent pixels.
      const upPoint = getCanvasPoint({
        event,
        element: event.currentTarget,
        logicalSize: composition.canvasSize,
      });
      const downPoint = pointerDownPointRef.current;
      const travelDistance = downPoint
        ? Math.hypot(upPoint.x - downPoint.x, upPoint.y - downPoint.y)
        : 0;

      // A real drag already moved the layer via the bounding box; only a
      // near-stationary pointerdown+pointerup counts as a layer-picking click.
      if (travelDistance < CLICK_MOVEMENT_THRESHOLD) {
        const hit = hitTestLayer(composition, upPoint);
        selectLayer(hit?.id ?? null);
      }
    }

    paintDragRef.current = null;
    selectionDragRef.current = null;
    pointerDownPointRef.current = null;
  };

  const handleLayerTransformChange = (transform: Matrix2D): void => {
    if (!selectedLayer) return;
    updateLayerTransform(selectedLayer.id, transform);
  };

  const selectionOverlayRect = liveMarqueeRect ?? selection.bounds;
  const showTransformBox = selectedLayer && TRANSFORM_TOOLS.includes(activeToolName);

  return (
    <div
      ref={scrollContainerRef}
      className="relative flex-1 overflow-auto bg-gray-200 dark:bg-gray-950 p-8"
    >
      <div
        className="relative inline-block shadow-lg origin-top-left"
        style={{ width: composition.canvasSize.width, transform: `scale(${zoom})` }}
      >
        <canvas
          ref={canvasRef}
          width={composition.canvasSize.width}
          height={composition.canvasSize.height}
          className="touch-none"
          style={CHECKERBOARD_STYLE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        {showTransformBox && (
          <TransformBoundingBox
            layer={selectedLayer}
            composition={composition}
            onTransformChange={handleLayerTransformChange}
            onDragStart={beginHistoryTransaction}
          />
        )}
        {selectionOverlayRect && (
          <div
            className="pointer-events-none absolute border border-dashed border-accent-500"
            style={{
              left: selectionOverlayRect.x,
              top: selectionOverlayRect.y,
              width: selectionOverlayRect.width,
              height: selectionOverlayRect.height,
            }}
          />
        )}
      </div>
      <div className="absolute bottom-3 right-3 rounded bg-white/90 dark:bg-gray-900/90 px-2 py-1 text-xs tabular-nums text-gray-600 dark:text-gray-300 shadow">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
