import type { Vector2 } from "@compio/domain-composition";
import type { ShapeRect } from "@compio/plugins-tools-core";

export const rectFromPoints = (a: Vector2, b: Vector2): ShapeRect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
});
