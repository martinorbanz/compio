import { Button, Checkbox, Dialog, NumberField } from "@compio/ui-kit";
import { useState, type ReactElement } from "react";
import type { EditorState } from "../../../../app/hooks";

const MIN_DIMENSION = 1;
const MIN_RESOLUTION = 1;

export interface ResizeImageDialogProps {
  editor: EditorState;
  onClose: () => void;
}

// Seeded once from the composition via useState initializers — the dialog
// mounts fresh on each open (DialogHost unmounts it on close), so there's no
// stale snapshot to re-sync and no effect needed.
export const ResizeImageDialog = ({ editor, onClose }: ResizeImageDialogProps): ReactElement => {
  const { composition } = editor;
  const [width, setWidth] = useState(composition.canvasSize.width);
  const [height, setHeight] = useState(composition.canvasSize.height);
  const [resolution, setResolution] = useState(composition.resolution);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio] = useState(composition.canvasSize.width / composition.canvasSize.height);

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
    editor.resizeImage({ size: { width, height }, resolution });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && onClose()}
      title="Resize Image"
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
        <NumberField
          label="Resolution (ppi)"
          value={resolution}
          min={MIN_RESOLUTION}
          onChange={setResolution}
        />
      </div>
    </Dialog>
  );
};
