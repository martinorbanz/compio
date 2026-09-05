export interface Vector2 {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export const vector2 = (x: number, y: number): Vector2 => ({ x, y });
export const size2D = (width: number, height: number): Size2D => ({ width, height });
