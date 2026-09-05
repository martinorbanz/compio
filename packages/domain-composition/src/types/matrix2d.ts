import { IDENTITY_MATRIX_VALUES } from "../constants";
import type { Vector2 } from "./vector2";

/**
 * 2x3 affine matrix: x' = a*x + c*y + e ; y' = b*x + d*y + f
 * Stored (not baked) on layers so transforms stay non-destructive until `bake` is called.
 * Field names deliberately match Canvas2D's ctx.transform(a,b,c,d,e,f) / CSS matrix() convention.
 */
export interface Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const identityMatrix = (): Matrix2D => {
  const [a, b, c, d, e, f] = IDENTITY_MATRIX_VALUES;
  return { a, b, c, d, e, f };
};

export const isIdentityMatrix = (matrix: Matrix2D): boolean => {
  const identity = identityMatrix();

  return (
    matrix.a === identity.a &&
    matrix.b === identity.b &&
    matrix.c === identity.c &&
    matrix.d === identity.d &&
    matrix.e === identity.e &&
    matrix.f === identity.f
  );
};

export const translationMatrix = (translateX: number, translateY: number): Matrix2D => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: translateX,
  f: translateY,
});

export const scaleMatrix = (scaleX: number, scaleY: number = scaleX): Matrix2D => ({
  a: scaleX,
  b: 0,
  c: 0,
  d: scaleY,
  e: 0,
  f: 0,
});

export const rotationMatrix = (radians: number): Matrix2D => {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
};

/** Composes `outer . inner` — applies `inner` first, then `outer`. */
export const multiplyMatrix = (outer: Matrix2D, inner: Matrix2D): Matrix2D => ({
  a: outer.a * inner.a + outer.c * inner.b,
  b: outer.b * inner.a + outer.d * inner.b,
  c: outer.a * inner.c + outer.c * inner.d,
  d: outer.b * inner.c + outer.d * inner.d,
  e: outer.a * inner.e + outer.c * inner.f + outer.e,
  f: outer.b * inner.e + outer.d * inner.f + outer.f,
});

export const applyMatrixToPoint = (matrix: Matrix2D, point: Vector2): Vector2 => ({
  x: matrix.a * point.x + matrix.c * point.y + matrix.e,
  y: matrix.b * point.x + matrix.d * point.y + matrix.f,
});

/**
 * Inverse of the affine transform — maps a point back from world/canvas space
 * into the layer's own local pixel space. Used to compensate pointer input
 * (painting, hit-testing) for a layer's current move/scale/rotate.
 */
export const invertMatrix = (matrix: Matrix2D): Matrix2D => {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (determinant === 0) throw new Error("Matrix2D is not invertible (determinant is 0)");

  const a = matrix.d / determinant;
  const b = -matrix.b / determinant;
  const c = -matrix.c / determinant;
  const d = matrix.a / determinant;

  return {
    a,
    b,
    c,
    d,
    e: -(a * matrix.e + c * matrix.f),
    f: -(b * matrix.e + d * matrix.f),
  };
};

export interface TRSDecomposition {
  translation: Vector2;
  rotation: number;
  scale: Vector2;
}

export interface ComposeTRSOptions {
  translation: Vector2;
  rotation: number;
  scale: Vector2;
  /** Point that stays fixed while rotating/scaling. Defaults to the origin. */
  pivot?: Vector2;
}

/** Builds a matrix from translate/rotate/scale around an optional pivot (defaults to origin). */
export const composeTRS = ({
  translation,
  rotation,
  scale,
  pivot = { x: 0, y: 0 },
}: ComposeTRSOptions): Matrix2D => {
  const toPivot = translationMatrix(-pivot.x, -pivot.y);
  const scaled = multiplyMatrix(scaleMatrix(scale.x, scale.y), toPivot);
  const rotated = multiplyMatrix(rotationMatrix(rotation), scaled);
  const fromPivot = multiplyMatrix(translationMatrix(pivot.x, pivot.y), rotated);

  return multiplyMatrix(translationMatrix(translation.x, translation.y), fromPivot);
};

/** Approximate decomposition assuming no shear — sufficient for transform-panel UI display. */
export const decomposeTRS = (matrix: Matrix2D): TRSDecomposition => ({
  translation: { x: matrix.e, y: matrix.f },
  rotation: Math.atan2(matrix.b, matrix.a),
  scale: {
    x: Math.hypot(matrix.a, matrix.b),
    y: Math.hypot(matrix.c, matrix.d),
  },
});
