import type { Vector2 } from "@compio/domain-composition";

export const DIALOG_ID = {
  EFFECT: "effect",
  RESIZE_IMAGE: "resize-image",
  RESIZE_CANVAS: "resize-canvas",
  TEXT_ENTRY: "text-entry",
} as const;
export type DialogId = (typeof DIALOG_ID)[keyof typeof DIALOG_ID];

/**
 * One arm per openable dialog. The discriminated union ties each id to its
 * payload, so openDialog() call sites are type-checked and the host narrows
 * payload by id. A new dialog = one arm here + one case in DialogHost — never
 * a new piece of state in App.tsx.
 */
export type DialogRequest =
  | { id: typeof DIALOG_ID.EFFECT; payload: { pluginName: string } }
  | { id: typeof DIALOG_ID.RESIZE_IMAGE }
  | { id: typeof DIALOG_ID.RESIZE_CANVAS }
  | { id: typeof DIALOG_ID.TEXT_ENTRY; payload: { position: Vector2 } };
