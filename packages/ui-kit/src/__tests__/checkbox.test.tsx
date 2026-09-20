import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../components/checkbox";

describe("Checkbox", () => {
  it("renders checked state per the checked prop", () => {
    render(<Checkbox label="Live preview" checked onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Live preview" })).toBeChecked();
  });

  it("renders unchecked state per the checked prop", () => {
    render(<Checkbox label="Live preview" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Live preview" })).not.toBeChecked();
  });

  it("calls onChange with the toggled boolean when clicked", async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Live preview" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Live preview" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
