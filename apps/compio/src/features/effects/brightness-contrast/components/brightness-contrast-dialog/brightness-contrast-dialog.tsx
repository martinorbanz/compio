import { LayerKind } from "@compio/domain-composition";
import { brightnessContrastEffect } from "@compio/plugins-effects-core";
import { Button, Dialog, Slider } from "@compio/ui-kit";
import { useState, type ReactElement } from "react";
import type { EditorState } from "../../../../../app/hooks";

export interface BrightnessContrastDialogProps {
  editor: EditorState;
  open: boolean;
  onClose: () => void;
}

export const BrightnessContrastDialog = ({
  editor,
  open,
  onClose,
}: BrightnessContrastDialogProps): ReactElement => {
  const { selectedLayer, composition, selection, beginHistoryTransaction, updateLayerImage } =
    editor;
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);

  const canApply = selectedLayer?.kind === LayerKind.RASTER;

  const handleApply = (): void => {
    if (!selectedLayer || selectedLayer.kind !== LayerKind.RASTER) return;

    const result = brightnessContrastEffect.execute({
      input: selectedLayer.image,
      params: { brightness, contrast },
      context: {
        canvasSize: composition.canvasSize,
        imageSize: composition.imageSize,
        selection: selection.mask ?? undefined,
        layerTransform: selectedLayer.transform,
      },
    });
    beginHistoryTransaction();
    updateLayerImage(selectedLayer.id, result);
    setBrightness(0);
    setContrast(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Brightness/Contrast"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={!canApply}>
            Apply
          </Button>
        </>
      }
    >
      {!canApply && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Select a raster layer to apply this effect.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Slider
          label="Brightness"
          value={brightness}
          min={-100}
          max={100}
          onChange={setBrightness}
        />
        <Slider label="Contrast" value={contrast} min={-100} max={100} onChange={setContrast} />
      </div>
    </Dialog>
  );
};
