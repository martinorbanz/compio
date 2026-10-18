import type { ReactElement } from "react";
import { BrightnessContrastDialog } from "../../features/effects";
import { ResizeCanvasDialog, ResizeImageDialog } from "../../features/image-sizing";
import { TextEntryDialog } from "../../features/tools";
import type { EditorState } from "../hooks";
import { useDialog } from "./dialog-context";
import { DIALOG_ID } from "./types";

export interface DialogHostProps {
  editor: EditorState;
}

/**
 * The one place that maps a DialogRequest to its component. Renders the active
 * dialog fresh each render (never a stored node), so dialogs always see the
 * live `editor` — no frozen props. Mounted means open; closing unmounts.
 */
export const DialogHost = ({ editor }: DialogHostProps): ReactElement | null => {
  const { current, closeDialog } = useDialog();
  if (!current) return null;

  switch (current.id) {
    case DIALOG_ID.EFFECT:
      // Only Brightness/Contrast exists today; route on current.payload.pluginName once more effect dialogs land.
      return <BrightnessContrastDialog editor={editor} onClose={closeDialog} />;

    case DIALOG_ID.RESIZE_IMAGE:
      return <ResizeImageDialog editor={editor} onClose={closeDialog} />;

    case DIALOG_ID.RESIZE_CANVAS:
      return <ResizeCanvasDialog editor={editor} onClose={closeDialog} />;

    case DIALOG_ID.TEXT_ENTRY:
      return (
        <TextEntryDialog
          editor={editor}
          position={current.payload.position}
          onClose={closeDialog}
        />
      );

    default: {
      // Compile error here means a DialogRequest arm has no case above.
      const unexpected: never = current;
      return unexpected;
    }
  }
};
