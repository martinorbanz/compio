import * as RadixSlider from "@radix-ui/react-slider";
import type { ReactNode } from "react";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Fires once when the drag/keyboard interaction ends, with the final value — a natural undo-transaction boundary. */
  onCommit?: (value: number) => void;
}

const DEFAULT_STEP = 1;

export const Slider = ({
  label,
  value,
  min,
  max,
  step = DEFAULT_STEP,
  onChange,
  onCommit,
}: SliderProps): ReactNode => (
  <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-gray-300">
    <span className="flex justify-between">
      <span>{label}</span>
      <span className="tabular-nums text-gray-500 dark:text-gray-400">{value}</span>
    </span>
    <RadixSlider.Root
      className="relative flex h-4 w-full touch-none items-center"
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([next]) => next !== undefined && onChange(next)}
      onValueCommit={([next]) => next !== undefined && onCommit?.(next)}
    >
      <RadixSlider.Track className="relative h-1 grow rounded-full bg-gray-200 dark:bg-gray-700">
        <RadixSlider.Range className="absolute h-full rounded-full bg-accent-500" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="block h-3.5 w-3.5 rounded-full bg-white border border-accent-600 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        aria-label={label}
      />
    </RadixSlider.Root>
  </label>
);
