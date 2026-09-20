import { LayerKind } from "@compio/domain-composition";
import type { PluginExecutionContext } from "@compio/domain-plugin-api";
import {
  brightnessContrastEffect,
  type BrightnessContrastParams,
} from "@compio/plugins-effects-core";
import { Button, Dialog, Slider } from "@compio/ui-kit";
import { useState, type ReactElement } from "react";
import type { EditorState } from "../../../../../app/hooks";
import { EffectPreviewToggle } from "../../../components/effect-preview-toggle";
import { useEffectPreview } from "../../../hooks";

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
  const { selectedLayer, composition, selection } = editor;
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const canApply = selectedLayer?.kind === LayerKind.RASTER;
  const layer = canApply ? selectedLayer : null;
  const params: BrightnessContrastParams = { brightness, contrast };

  const context: PluginExecutionContext = {
    canvasSize: composition.canvasSize,
    imageSize: composition.imageSize,
    selection: selection.mask ?? undefined,
    layerTransform: selectedLayer?.transform,
  };

  const { onLiveChange, onInteractionEnd, applyEffect, discardPreview } = useEffectPreview({
    editor,
    layer,
    plugin: brightnessContrastEffect,
    context,
  });

  const handleBrightnessChange = (value: number): void => {
    setBrightness(value);
    if (previewEnabled) onLiveChange({ brightness: value, contrast });
  };

  const handleBrightnessCommit = (value: number): void => {
    if (previewEnabled) onInteractionEnd({ brightness: value, contrast });
  };

  const handleContrastChange = (value: number): void => {
    setContrast(value);
    if (previewEnabled) onLiveChange({ brightness, contrast: value });
  };

  const handleContrastCommit = (value: number): void => {
    if (previewEnabled) onInteractionEnd({ brightness, contrast: value });
  };

  const handlePreviewEnabledChange = (checked: boolean): void => {
    setPreviewEnabled(checked);
    if (checked) onInteractionEnd(params);
    else discardPreview();
  };

  const resetAndClose = (): void => {
    discardPreview();
    setBrightness(0);
    setContrast(0);
    onClose();
  };

  const handleApply = (): void => {
    if (!canApply) return;
    applyEffect(params);
    setBrightness(0);
    setContrast(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && resetAndClose()}
      title="Brightness/Contrast"
      footer={
        <>
          <Button variant="ghost" onClick={resetAndClose}>
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
        <EffectPreviewToggle checked={previewEnabled} onChange={handlePreviewEnabledChange} />
        <Slider
          label="Brightness"
          value={brightness}
          min={-100}
          max={100}
          onChange={handleBrightnessChange}
          onCommit={handleBrightnessCommit}
        />
        <Slider
          label="Contrast"
          value={contrast}
          min={-100}
          max={100}
          onChange={handleContrastChange}
          onCommit={handleContrastCommit}
        />
      </div>
    </Dialog>
  );
};
