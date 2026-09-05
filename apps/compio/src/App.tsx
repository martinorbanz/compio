import type { Vector2 } from "@compio/domain-composition";
import { useEffect, useState, type ReactElement } from "react";
import { useEditorState, useViewportZoomState } from "./app/hooks";
import { HOTKEYS } from "./app/utils";
import { CanvasViewport } from "./features/canvas";
import { BrightnessContrastDialog } from "./features/effects";
import { LayersPanel } from "./features/layers-panel";
import { AppMenuBar } from "./features/menu-bar";
import { AppToolbar, TextEntryDialog, ToolOptionsPanel } from "./features/tools";

export const App = (): ReactElement => {
  const editor = useEditorState();
  const { undo, redo } = editor;
  const viewportZoom = useViewportZoomState();
  const { zoomIn, zoomOut, resetZoom } = viewportZoom;
  const [openEffectDialog, setOpenEffectDialog] = useState<string | null>(null);
  const [textEntryPosition, setTextEntryPosition] = useState<Vector2 | null>(null);
  const [fitToWindowRequestId, setFitToWindowRequestId] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isEditableTarget) return;
      if (!event.metaKey && !event.ctrlKey) return;

      const key = event.key.toLowerCase();

      if (key === HOTKEYS.UNDO_REDO) {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Cmd/Ctrl +/-/0 also drive the browser's own page zoom — preventDefault
      // so only the canvas zoom responds, not both at once.
      if ((HOTKEYS.ZOOM_IN as readonly string[]).includes(event.key)) {
        event.preventDefault();
        zoomIn();
        return;
      }
      if (event.key === HOTKEYS.ZOOM_OUT) {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (event.key === HOTKEYS.ZOOM_RESET) {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, zoomIn, zoomOut, resetZoom]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <AppMenuBar
        editor={editor}
        viewportZoom={viewportZoom}
        onOpenEffectDialog={setOpenEffectDialog}
        onFitToWindow={() => setFitToWindowRequestId((id) => id + 1)}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppToolbar editor={editor} />
        <CanvasViewport
          editor={editor}
          viewportZoom={viewportZoom}
          fitToWindowRequestId={fitToWindowRequestId}
          onTextToolClick={setTextEntryPosition}
        />
        <div className="flex flex-col gap-2 border-l border-gray-200 dark:border-gray-800 p-2 overflow-auto">
          <ToolOptionsPanel editor={editor} />
          <LayersPanel editor={editor} />
        </div>
      </div>

      <BrightnessContrastDialog
        editor={editor}
        open={openEffectDialog !== null}
        onClose={() => setOpenEffectDialog(null)}
      />
      <TextEntryDialog
        editor={editor}
        position={textEntryPosition}
        onClose={() => setTextEntryPosition(null)}
      />
    </div>
  );
};
