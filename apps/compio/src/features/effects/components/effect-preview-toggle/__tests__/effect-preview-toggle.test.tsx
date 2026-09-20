import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EffectPreviewToggle } from "../effect-preview-toggle";

describe("EffectPreviewToggle", () => {
  it("renders a Live preview checkbox reflecting the checked prop", () => {
    render(<EffectPreviewToggle checked onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Live preview" })).toBeChecked();
  });

  it("forwards onChange unchanged when toggled", () => {
    const onChange = vi.fn();
    render(<EffectPreviewToggle checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Live preview" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
