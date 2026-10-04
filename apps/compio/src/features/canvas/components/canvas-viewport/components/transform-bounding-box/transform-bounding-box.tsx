import {
  applyMatrixToPoint,
  type Composition,
  type Layer,
  type Matrix2D,
  type Vector2,
} from "@compio/domain-composition";
import { moveTool, rotateTool, scaleTool } from "@compio/plugins-tools-core";
import { getLayerLocalBounds } from "@compio/renderer-core";
import { useRef, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import { getCanvasPoint } from "../../utils";
import { useCoalescedCallback } from "./hooks";
import {
  EDGE_KIND,
  EDGE_KINDS,
  EDGE_OPPOSITE,
  EDGE_SCALE_AXIS,
  getEdgeMidpoints,
  getTransformIcon,
  type EdgeKind,
} from "./utils";

export interface TransformBoundingBoxProps {
  layer: Layer;
  composition: Composition;
  /**
   * Fires continuously while dragging — this is both the live preview and
   * the committed state, since transforms only ever update layer.transform
   * (the matrix), never layer.image. Non-destructive by construction.
   */
  onTransformChange: (transform: Matrix2D) => void;
  /** Fires once, before the first onTransformChange of a drag — the undo boundary. */
  onDragStart: () => void;
}

const HANDLE_RADIUS = 5;
const ROTATE_HANDLE_OFFSET = 28;
const STROKE_WIDTH = 1.5;

type DragKind = "body" | "rotate" | 0 | 1 | 2 | 3 | EdgeKind;

const isEdgeKind = (kind: DragKind): kind is EdgeKind =>
  kind === EDGE_KIND.TOP ||
  kind === EDGE_KIND.RIGHT ||
  kind === EDGE_KIND.BOTTOM ||
  kind === EDGE_KIND.LEFT;

interface DragState {
  kind: DragKind;
  startPoint: Vector2;
  startTransform: Matrix2D;
  pivot: Vector2;
  startDistance: number;
  startAngle: number;
  /** Edge handles only: opposite-edge midpoint in the layer's own pre-transform space. */
  localPivot?: Vector2;
  /** Edge handles only: unit vector from `pivot` toward the dragged edge, in world space. */
  axisDirection?: Vector2;
}

export const TransformBoundingBox = ({
  layer,
  composition,
  onTransformChange,
  onDragStart,
}: TransformBoundingBoxProps): ReactElement => {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const { width, height } = getLayerLocalBounds(layer);
  const localCorners: Vector2[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const worldCorners = localCorners.map((corner) => applyMatrixToPoint(layer.transform, corner));
  const center = applyMatrixToPoint(layer.transform, { x: width / 2, y: height / 2 });
  const worldEdgeMidpoints = getEdgeMidpoints(worldCorners);
  const localEdgeMidpoints = getEdgeMidpoints(localCorners);
  const topMid = worldEdgeMidpoints[EDGE_KIND.TOP];
  const upDirection = { x: topMid.x - center.x, y: topMid.y - center.y };
  const upLength = Math.hypot(upDirection.x, upDirection.y) || 1;
  const rotateHandle = {
    x: topMid.x + (upDirection.x / upLength) * ROTATE_HANDLE_OFFSET,
    y: topMid.y + (upDirection.y / upLength) * ROTATE_HANDLE_OFFSET,
  };

  const executionContext = { canvasSize: composition.canvasSize, imageSize: composition.imageSize };

  const beginDrag = (kind: DragKind, point: Vector2): void => {
    onDragStart();

    if (kind === "body") {
      dragRef.current = {
        kind,
        startPoint: point,
        startTransform: layer.transform,
        pivot: point,
        startDistance: 0,
        startAngle: 0,
      };
      return;
    }

    if (kind === "rotate") {
      dragRef.current = {
        kind,
        startPoint: point,
        startTransform: layer.transform,
        pivot: center,
        startDistance: 0,
        startAngle: Math.atan2(point.y - center.y, point.x - center.x),
      };
      return;
    }

    if (isEdgeKind(kind)) {
      const oppositeEdge = EDGE_OPPOSITE[kind];
      const pivot = worldEdgeMidpoints[oppositeEdge];
      const rawAxisDirection = {
        x: worldEdgeMidpoints[kind].x - pivot.x,
        y: worldEdgeMidpoints[kind].y - pivot.y,
      };
      const axisLength = Math.hypot(rawAxisDirection.x, rawAxisDirection.y) || 1;
      const axisDirection = {
        x: rawAxisDirection.x / axisLength,
        y: rawAxisDirection.y / axisLength,
      };
      const startProjection =
        (point.x - pivot.x) * axisDirection.x + (point.y - pivot.y) * axisDirection.y;
      dragRef.current = {
        kind,
        startPoint: point,
        startTransform: layer.transform,
        pivot,
        localPivot: localEdgeMidpoints[oppositeEdge],
        axisDirection,
        startDistance: Math.abs(startProjection) || 1,
        startAngle: 0,
      };
      return;
    }

    const pivot = worldCorners[(kind + 2) % 4]!;
    dragRef.current = {
      kind,
      startPoint: point,
      startTransform: layer.transform,
      pivot,
      startDistance: Math.hypot(point.x - pivot.x, point.y - pivot.y) || 1,
      startAngle: 0,
    };
  };

  const handlePointerDown =
    (kind: DragKind) =>
    (event: ReactPointerEvent): void => {
      event.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;

      (event.target as Element).setPointerCapture(event.pointerId);
      beginDrag(kind, getCanvasPoint({ event, element: svg, logicalSize: composition.canvasSize }));
    };

  // The matrix math below doesn't need to run faster than the display can
  // show it — coalescing to one call per frame keeps a high-poll-rate
  // pointer from redundantly recomputing transforms that get superseded
  // before the next paint anyway. Point is extracted synchronously in
  // handlePointerMove below, not read from the (possibly deferred) event.
  const applyPointerMove = useCoalescedCallback((point: Vector2): void => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === "body") {
      const delta = { x: point.x - drag.startPoint.x, y: point.y - drag.startPoint.y };
      onTransformChange(
        moveTool.execute({
          input: { transform: drag.startTransform },
          params: { delta },
          context: executionContext,
        }),
      );
      return;
    }

    if (drag.kind === "rotate") {
      const currentAngle = Math.atan2(point.y - drag.pivot.y, point.x - drag.pivot.x);
      const angleDeltaRadians = currentAngle - drag.startAngle;
      onTransformChange(
        rotateTool.execute({
          input: { transform: drag.startTransform },
          params: { angleDeltaRadians, pivot: drag.pivot },
          context: executionContext,
        }),
      );
      return;
    }

    if (isEdgeKind(drag.kind)) {
      const axisDirection = drag.axisDirection!;
      const projection =
        (point.x - drag.pivot.x) * axisDirection.x + (point.y - drag.pivot.y) * axisDirection.y;
      const factor = Math.abs(projection) / drag.startDistance;
      const scaleAxis = EDGE_SCALE_AXIS[drag.kind];
      const scale = scaleAxis === "x" ? { x: factor, y: 1 } : { x: 1, y: factor };
      onTransformChange(
        scaleTool.execute({
          input: { transform: drag.startTransform },
          params: { scale, pivot: drag.localPivot!, pivotSpace: "local" },
          context: executionContext,
        }),
      );
      return;
    }

    // Corner handle: proportional scale anchored at the opposite corner.
    const currentDistance = Math.hypot(point.x - drag.pivot.x, point.y - drag.pivot.y);
    const factor = currentDistance / drag.startDistance;
    onTransformChange(
      scaleTool.execute({
        input: { transform: drag.startTransform },
        params: { scale: { x: factor, y: factor }, pivot: drag.pivot },
        context: executionContext,
      }),
    );
  });

  const handlePointerMove = (event: ReactPointerEvent): void => {
    const svg = svgRef.current;
    if (!dragRef.current || !svg) return;

    applyPointerMove(getCanvasPoint({ event, element: svg, logicalSize: composition.canvasSize }));
  };

  const endDrag = (): void => {
    dragRef.current = null;
  };

  const polygonPoints = worldCorners.map((corner) => `${corner.x},${corner.y}`).join(" ");

  return (
    <svg
      ref={svgRef}
      className="absolute left-0 top-0"
      width={composition.canvasSize.width}
      height={composition.canvasSize.height}
      // SVG roots clip to their own width/height by default — visible lets
      // handles render past the canvas edge when a layer is transformed near it.
      style={{ pointerEvents: "none", overflow: "visible" }}
    >
      <polygon
        points={polygonPoints}
        fill="transparent"
        stroke="#3b82f6"
        strokeWidth={STROKE_WIDTH}
        style={{ pointerEvents: "all", cursor: "move" }}
        onPointerDown={handlePointerDown("body")}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      />
      <line
        x1={topMid.x}
        y1={topMid.y}
        x2={rotateHandle.x}
        y2={rotateHandle.y}
        stroke="#3b82f6"
        strokeWidth={STROKE_WIDTH}
      />
      <circle
        cx={rotateHandle.x}
        cy={rotateHandle.y}
        r={HANDLE_RADIUS}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={STROKE_WIDTH}
        style={{ pointerEvents: "all", cursor: "grab" }}
        onPointerDown={handlePointerDown("rotate")}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      />
      {worldCorners.map((corner, cornerIndex) => (
        <rect
          key={cornerIndex}
          x={corner.x - HANDLE_RADIUS}
          y={corner.y - HANDLE_RADIUS}
          width={HANDLE_RADIUS * 2}
          height={HANDLE_RADIUS * 2}
          fill="white"
          stroke="#3b82f6"
          strokeWidth={STROKE_WIDTH}
          style={{ pointerEvents: "all", cursor: getTransformIcon({ from: center, to: corner }) }}
          onPointerDown={handlePointerDown(cornerIndex as 0 | 1 | 2 | 3)}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
        />
      ))}
      {EDGE_KINDS.map((edgeKind) => {
        const midpoint = worldEdgeMidpoints[edgeKind];
        return (
          <rect
            key={edgeKind}
            x={midpoint.x - HANDLE_RADIUS}
            y={midpoint.y - HANDLE_RADIUS}
            width={HANDLE_RADIUS * 2}
            height={HANDLE_RADIUS * 2}
            fill="white"
            stroke="#3b82f6"
            strokeWidth={STROKE_WIDTH}
            style={{
              pointerEvents: "all",
              cursor: getTransformIcon({ from: center, to: midpoint }),
            }}
            onPointerDown={handlePointerDown(edgeKind)}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
          />
        );
      })}
    </svg>
  );
};
