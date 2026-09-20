import type { ChangeEvent, ReactNode } from "react";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox = ({ label, checked, onChange }: CheckboxProps): ReactNode => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void =>
    onChange(event.target.checked);

  return (
    <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
      />
      <span>{label}</span>
    </label>
  );
};
