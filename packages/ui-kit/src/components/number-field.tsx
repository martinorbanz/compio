import type { ChangeEvent, ReactNode } from "react";

export interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const NumberField = ({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: NumberFieldProps): ReactNode => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.valueAsNumber;
    if (!Number.isNaN(next)) onChange(next);
  };

  return (
    <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={handleChange}
        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 disabled:opacity-40"
      />
    </label>
  );
};
