import type { Vector2 } from "@compio/domain-composition";

export interface InterpolatePointsOptions {
  from: Vector2;
  destination: Vector2;
  spacing: number;
}

/** Interpolates evenly-spaced points between two points, inclusive of `destination`. */
export const interpolatePoints = ({
  from,
  destination,
  spacing,
}: InterpolatePointsOptions): Vector2[] => {
  const distance = Math.hypot(destination.x - from.x, destination.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(spacing, 1)));

  return Array.from({ length: steps }, (_placeholder, stepIndex) => {
    const progress = (stepIndex + 1) / steps;
    return {
      x: from.x + (destination.x - from.x) * progress,
      y: from.y + (destination.y - from.y) * progress,
    };
  });
};
