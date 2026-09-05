import { TextAlign, type Vector2 } from "@compio/domain-composition";
import { Button, Dialog } from "@compio/ui-kit";
import { useState, type ReactElement } from "react";
import type { EditorState } from "../../../../app/hooks";

const DEFAULT_TEXT_FONT = { family: "sans-serif", size: 32, weight: 400, italic: false };

export interface TextEntryDialogProps {
  editor: EditorState;
  position: Vector2 | null;
  onClose: () => void;
}

export const TextEntryDialog = ({
  editor,
  position,
  onClose,
}: TextEntryDialogProps): ReactElement => {
  const [text, setText] = useState("");

  const handleAdd = (): void => {
    if (!position || !text.trim()) return;
    editor.addTextLayer({
      text,
      font: DEFAULT_TEXT_FONT,
      color: editor.textColor,
      align: TextAlign.LEFT,
      position,
    });
    setText("");
    onClose();
  };

  return (
    <Dialog
      open={position !== null}
      onOpenChange={(next) => !next && onClose()}
      title="Add Text"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add
          </Button>
        </>
      }
    >
      <input
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleAdd()}
        placeholder="Type your text…"
        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
      />
    </Dialog>
  );
};
