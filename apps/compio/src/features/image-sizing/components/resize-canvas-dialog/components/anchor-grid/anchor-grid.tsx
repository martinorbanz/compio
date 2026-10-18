import { CANVAS_ANCHORS, type CanvasAnchor } from "@compio/domain-composition";
import { Button } from "@compio/ui-kit";
import type { ReactElement } from "react";

export interface AnchorGridProps {
  value: CanvasAnchor;
  onChange: (anchor: CanvasAnchor) => void;
}

/** 3x3 grid, one cell per CanvasAnchor — CANVAS_ANCHORS is declared in row-major (top-left to bottom-right) order, so it maps directly onto the grid without reordering. */
export const AnchorGrid = ({ value, onChange }: AnchorGridProps): ReactElement => (
  <div className="grid w-24 grid-cols-3 gap-1">
    {CANVAS_ANCHORS.map((anchor) => (
      <Button
        key={anchor}
        type="button"
        variant="ghost"
        active={anchor === value}
        aria-label={anchor}
        onClick={() => onChange(anchor)}
        className="h-6 w-6 border border-gray-300 p-0 dark:border-gray-600"
      />
    ))}
  </div>
);
