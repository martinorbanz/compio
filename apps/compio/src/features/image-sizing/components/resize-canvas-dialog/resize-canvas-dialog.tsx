import { CANVAS_ANCHOR, type CanvasAnchor } from "@compio/domain-composition";
import { Button, Checkbox, Dialog, NumberField } from "@compio/ui-kit";
import { useState, type ReactElement } from "react";
import type { EditorState } from "../../../../app/hooks";
import { AnchorGrid } from "./components/anchor-grid";

const MIN_DIMENSION = 1;

export interface ResizeCanvasDialogProps {
  editor: EditorState;
  onClose: () => void;
}

// Seeded once on mount — see ResizeImageDialog for why no re-sync effect.
export const ResizeCanvasDialog = ({ editor, onClose }: ResizeCanvasDialogProps): ReactElement => {
  const { composition } = editor;
  const [width, setWidth] = useState(composition.canvasSize.width);
  const [height, setHeight] = useState(composition.canvasSize.height);
  // Uniform resize is off by default for canvas but on for Resize Image.
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
  const [aspectRatio] = useState(composition.canvasSize.width / composition.canvasSize.height);
  const [anchor, setAnchor] = useState<CanvasAnchor>(CANVAS_ANCHOR.TOP_LEFT);

  const handleWidthChange = (next: number): void => {
    const clampedWidth = Math.max(MIN_DIMENSION, Math.round(next));
    setWidth(clampedWidth);
    if (maintainAspectRatio) {
      setHeight(Math.max(MIN_DIMENSION, Math.round(clampedWidth / aspectRatio)));
    }
  };

  const handleHeightChange = (next: number): void => {
    const clampedHeight = Math.max(MIN_DIMENSION, Math.round(next));
    setHeight(clampedHeight);
    if (maintainAspectRatio) {
      setWidth(Math.max(MIN_DIMENSION, Math.round(clampedHeight * aspectRatio)));
    }
  };

  const handleApply = (): void => {
    editor.resizeCanvas({ size: { width, height }, anchor });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && onClose()}
      title="Resize Canvas"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <NumberField
          label="Width (px)"
          value={width}
          min={MIN_DIMENSION}
          onChange={handleWidthChange}
        />
        <NumberField
          label="Height (px)"
          value={height}
          min={MIN_DIMENSION}
          onChange={handleHeightChange}
        />
        <Checkbox
          label="Maintain aspect ratio"
          checked={maintainAspectRatio}
          onChange={setMaintainAspectRatio}
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-700 dark:text-gray-300">Anchor</span>
          <AnchorGrid value={anchor} onChange={setAnchor} />
        </div>
      </div>
    </Dialog>
  );
};
