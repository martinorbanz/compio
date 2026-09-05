import { BlendMode, type Layer } from "@compio/domain-composition";
import { Button, Slider } from "@compio/ui-kit";
import type { ChangeEvent, MouseEvent, ReactElement } from "react";

export interface LayerRowProps {
  layer: Layer;
  selected: boolean;
  onSelect: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLocked: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onOpacityCommit: () => void;
  onBlendModeChange: (layerId: string, blendMode: BlendMode) => void;
}

const BLEND_MODES = Object.values(BlendMode);

export const LayerRow = ({
  layer,
  selected,
  onSelect,
  onToggleVisibility,
  onToggleLocked,
  onOpacityChange,
  onOpacityCommit,
  onBlendModeChange,
}: LayerRowProps): ReactElement => {
  const handleSelect = (): void => onSelect(layer.id);

  const handleToggleVisibility = (event: MouseEvent): void => {
    event.stopPropagation();
    onToggleVisibility(layer.id);
  };

  const handleToggleLocked = (event: MouseEvent): void => {
    event.stopPropagation();
    onToggleLocked(layer.id);
  };

  const handleOpacitySliderChange = (value: number): void => {
    onOpacityChange(layer.id, value / 100);
  };

  const handleBlendModeChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onBlendModeChange(layer.id, event.target.value as BlendMode);
  };

  return (
    <div
      onClick={handleSelect}
      className={[
        "flex flex-col gap-1 rounded-md border p-2 cursor-pointer",
        selected
          ? "border-accent-500 bg-accent-50 dark:bg-accent-900/30"
          : "border-gray-200 dark:border-gray-700",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-gray-800 dark:text-gray-100">{layer.name}</span>
        <div className="flex gap-1">
          <Button
            variant="icon"
            onClick={handleToggleVisibility}
            aria-label={layer.visible ? "Hide layer" : "Show layer"}
            className="p-1 text-xs"
          >
            {layer.visible ? "👁" : "🚫"}
          </Button>
          <Button
            variant="icon"
            onClick={handleToggleLocked}
            aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
            className="p-1 text-xs"
          >
            {layer.locked ? "🔒" : "🔓"}
          </Button>
        </div>
      </div>
      <Slider
        label="Opacity"
        value={Math.round(layer.opacity * 100)}
        min={0}
        max={100}
        onChange={handleOpacitySliderChange}
        onCommit={onOpacityCommit}
      />
      <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>Blend</span>
        <select
          value={layer.blendMode}
          onChange={handleBlendModeChange}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs px-1 py-0.5"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
