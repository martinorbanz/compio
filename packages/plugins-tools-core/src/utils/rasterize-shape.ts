import {
  createEmptyMask,
  MASK_OPAQUE,
  type MaskChannel,
  type Size2D,
} from "@compio/domain-composition";

export interface ShapeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clampBounds = (rect: ShapeRect, size: Size2D) => ({
  minX: Math.max(0, Math.floor(rect.x)),
  minY: Math.max(0, Math.floor(rect.y)),
  maxX: Math.min(size.width, Math.ceil(rect.x + rect.width)),
  maxY: Math.min(size.height, Math.ceil(rect.y + rect.height)),
});

const rowIndices = (minRow: number, maxRow: number): number[] =>
  Array.from(
    { length: Math.max(maxRow - minRow, 0) },
    (_placeholder, rowOffset) => minRow + rowOffset,
  );

export const rasterizeRectangle = (size: Size2D, rect: ShapeRect): MaskChannel => {
  const mask = createEmptyMask(size);
  const { minX, minY, maxX, maxY } = clampBounds(rect, size);

  rowIndices(minY, maxY).forEach((pixelY) => {
    const rowStart = pixelY * size.width;
    mask.data.fill(MASK_OPAQUE, rowStart + minX, rowStart + maxX);
  });

  return mask;
};

export const rasterizeEllipse = (size: Size2D, rect: ShapeRect): MaskChannel => {
  const mask = createEmptyMask(size);
  const { minY, maxY } = clampBounds(rect, size);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radiusX = rect.width / 2 || 1;
  const radiusY = rect.height / 2 || 1;

  // Per-row span fill: solve the ellipse equation for x at each y, instead of
  // testing every pixel in the bounding box individually.
  rowIndices(minY, maxY).forEach((pixelY) => {
    const normalizedY = (pixelY + 0.5 - centerY) / radiusY;
    if (Math.abs(normalizedY) > 1) return;

    const halfSpan = Math.sqrt(1 - normalizedY * normalizedY) * radiusX;
    const rowStart = Math.max(0, Math.round(centerX - halfSpan));
    const rowEnd = Math.min(size.width, Math.round(centerX + halfSpan));
    mask.data.fill(MASK_OPAQUE, pixelY * size.width + rowStart, pixelY * size.width + rowEnd);
  });

  return mask;
};
