import { describe, expect, it } from "vitest";
import {
  applyMatrixToPoint,
  composeTRS,
  decomposeTRS,
  identityMatrix,
  invertMatrix,
  multiplyMatrix,
  rotationMatrix,
  scaleMatrix,
  translationMatrix,
} from "../types/matrix2d";

describe("Matrix2D", () => {
  it("identity leaves points unchanged", () => {
    expect(applyMatrixToPoint(identityMatrix(), { x: 5, y: 7 })).toEqual({ x: 5, y: 7 });
  });

  it("translates points", () => {
    const matrix = translationMatrix(10, -5);
    expect(applyMatrixToPoint(matrix, { x: 0, y: 0 })).toEqual({ x: 10, y: -5 });
  });

  it("scales points", () => {
    const matrix = scaleMatrix(2, 3);
    expect(applyMatrixToPoint(matrix, { x: 4, y: 4 })).toEqual({ x: 8, y: 12 });
  });

  it("rotates points 90 degrees", () => {
    const matrix = rotationMatrix(Math.PI / 2);
    const { x, y } = applyMatrixToPoint(matrix, { x: 1, y: 0 });
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
  });

  it("composes translate/rotate/scale and round-trips through decompose", () => {
    const matrix = composeTRS({
      translation: { x: 10, y: 20 },
      rotation: Math.PI / 4,
      scale: { x: 2, y: 2 },
    });
    const decomposed = decomposeTRS(matrix);
    expect(decomposed.translation).toEqual({ x: 10, y: 20 });
    expect(decomposed.rotation).toBeCloseTo(Math.PI / 4);
    expect(decomposed.scale.x).toBeCloseTo(2);
    expect(decomposed.scale.y).toBeCloseTo(2);
  });

  it("multiply applies the right-hand matrix first", () => {
    const translateThenScale = multiplyMatrix(scaleMatrix(2), translationMatrix(1, 0));
    expect(applyMatrixToPoint(translateThenScale, { x: 0, y: 0 })).toEqual({ x: 2, y: 0 });
  });

  it("invertMatrix maps a transformed point back to its original", () => {
    const matrix = composeTRS({
      translation: { x: 15, y: -8 },
      rotation: Math.PI / 6,
      scale: { x: 2, y: 0.5 },
    });
    const original = { x: 7, y: 3 };
    const transformed = applyMatrixToPoint(matrix, original);
    const roundTripped = applyMatrixToPoint(invertMatrix(matrix), transformed);

    expect(roundTripped.x).toBeCloseTo(original.x);
    expect(roundTripped.y).toBeCloseTo(original.y);
  });

  it("invertMatrix throws on a non-invertible (zero-determinant) matrix", () => {
    expect(() => invertMatrix(scaleMatrix(0))).toThrow();
  });
});
