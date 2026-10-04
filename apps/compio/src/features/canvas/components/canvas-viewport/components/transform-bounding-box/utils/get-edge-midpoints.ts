import type { Vector2 } from "@compio/domain-composition";

export const EDGE_KIND = {
  TOP: "top",
  RIGHT: "right",
  BOTTOM: "bottom",
  LEFT: "left",
} as const;
export type EdgeKind = (typeof EDGE_KIND)[keyof typeof EDGE_KIND];
export const EDGE_KINDS = Object.values(EDGE_KIND);

export const EDGE_OPPOSITE: Record<EdgeKind, EdgeKind> = {
  [EDGE_KIND.TOP]: EDGE_KIND.BOTTOM,
  [EDGE_KIND.RIGHT]: EDGE_KIND.LEFT,
  [EDGE_KIND.BOTTOM]: EDGE_KIND.TOP,
  [EDGE_KIND.LEFT]: EDGE_KIND.RIGHT,
};

export const EDGE_SCALE_AXIS: Record<EdgeKind, "x" | "y"> = {
  [EDGE_KIND.TOP]: "y",
  [EDGE_KIND.BOTTOM]: "y",
  [EDGE_KIND.LEFT]: "x",
  [EDGE_KIND.RIGHT]: "x",
};

const EDGE_CORNER_INDICES: Record<EdgeKind, readonly [number, number]> = {
  [EDGE_KIND.TOP]: [0, 1],
  [EDGE_KIND.RIGHT]: [1, 2],
  [EDGE_KIND.BOTTOM]: [2, 3],
  [EDGE_KIND.LEFT]: [3, 0],
};

/** Midpoint of each bounding-box edge, from its 4 corners in TL/TR/BR/BL order. */
export const getEdgeMidpoints = (corners: readonly Vector2[]): Record<EdgeKind, Vector2> =>
  Object.fromEntries(
    EDGE_KINDS.map((edgeKind) => {
      const [startIndex, endIndex] = EDGE_CORNER_INDICES[edgeKind];
      const start = corners[startIndex]!;
      const end = corners[endIndex]!;
      return [edgeKind, { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }];
    }),
  ) as Record<EdgeKind, Vector2>;
