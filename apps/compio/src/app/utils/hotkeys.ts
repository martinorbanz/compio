/** `event.key` values for the app's keyboard shortcuts — grows as more are added. */
export const HOTKEYS = {
  UNDO_REDO: "z",
  /** "=" is the unshifted key that produces "+"; both fire zoom in. */
  ZOOM_IN: ["=", "+"],
  ZOOM_OUT: "-",
  ZOOM_RESET: "0",
} as const;
