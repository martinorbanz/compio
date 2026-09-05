import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { App } from "./App";
import { ensurePluginsBootstrapped } from "./app/bootstrap-plugins";

describe("App", () => {
  beforeAll(() => {
    ensurePluginsBootstrapped();
  });

  it("renders the menu bar, toolbar, and canvas without crashing", () => {
    render(<App />);

    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("Layers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument();
  });
});
