import type { Vector2 } from "@compio/domain-composition";

const RESIZE_CURSORS = ["ew-resize", "nwse-resize", "ns-resize", "nesw-resize"] as const;
const DEGREES_PER_SECTOR = 45;

/**
 * CSS resize cursor for a transform handle, given the direction from a pivot
 * (typically the bounding box center) to the handle. The direction vector is
 * taken in world space, so it already carries the box's on-screen rotation —
 * works for corners today and generalizes to edge or other transform handles
 * (future selections, crop, etc.) without change.
 */
export const getTransformIcon = ({ from, to }: { from: Vector2; to: Vector2 }): string => {
  const angleRadians = Math.atan2(to.y - from.y, to.x - from.x);
  const angleDegrees = ((angleRadians * 180) / Math.PI + 360) % 360;
  const sectorIndex = Math.round(angleDegrees / DEGREES_PER_SECTOR) % RESIZE_CURSORS.length;
  return RESIZE_CURSORS[sectorIndex]!;
};
