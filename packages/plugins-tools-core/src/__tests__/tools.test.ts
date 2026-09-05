import {
  applyMatrixToPoint,
  identityMatrix,
  MASK_OPAQUE,
  MASK_TRANSPARENT,
} from "@compio/domain-composition";
import { describe, expect, it } from "vitest";
import { geometricSelectionTool } from "../tools/geometric-selection-tool";
import { moveTool } from "../tools/move-tool";

describe("moveTool", () => {
  it("translates the input transform by the given delta", () => {
    const result = moveTool.execute({
      input: { transform: identityMatrix() },
      params: { delta: { x: 5, y: -3 } },
      context: {
        canvasSize: { width: 100, height: 100 },
        imageSize: { width: 100, height: 100 },
      },
    });
    expect(applyMatrixToPoint(result, { x: 0, y: 0 })).toEqual({ x: 5, y: -3 });
  });
});

describe("geometricSelectionTool", () => {
  const executionContext = {
    canvasSize: { width: 4, height: 4 },
    imageSize: { width: 4, height: 4 },
  };

  it("rasterizes a rectangle into an opaque mask region", () => {
    const mask = geometricSelectionTool.execute({
      input: { canvasSize: executionContext.canvasSize },
      params: {
        shape: "rectangle",
        rect: { x: 0, y: 0, width: 2, height: 2 },
        operation: "replace",
      },
      context: executionContext,
    });
    expect(mask.data[0]).toBe(MASK_OPAQUE);
    expect(mask.data[3 * 4 + 3]).toBe(MASK_TRANSPARENT);
  });

  it("combines with an existing selection using the given operation", () => {
    const first = geometricSelectionTool.execute({
      input: { canvasSize: executionContext.canvasSize },
      params: {
        shape: "rectangle",
        rect: { x: 0, y: 0, width: 4, height: 4 },
        operation: "replace",
      },
      context: executionContext,
    });
    const subtracted = geometricSelectionTool.execute({
      input: { canvasSize: executionContext.canvasSize, existingSelection: first },
      params: {
        shape: "rectangle",
        rect: { x: 0, y: 0, width: 2, height: 2 },
        operation: "subtract",
      },
      context: executionContext,
    });
    expect(subtracted.data[0]).toBe(MASK_TRANSPARENT);
    expect(subtracted.data[3 * 4 + 3]).toBe(MASK_OPAQUE);
  });
});
