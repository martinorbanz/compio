import { Checkbox } from "@compio/ui-kit";
import type { ReactElement } from "react";

const LIVE_PREVIEW_LABEL = "Live preview";

export interface EffectPreviewToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const EffectPreviewToggle = ({
  checked,
  onChange,
}: EffectPreviewToggleProps): ReactElement => (
  <Checkbox label={LIVE_PREVIEW_LABEL} checked={checked} onChange={onChange} />
);
