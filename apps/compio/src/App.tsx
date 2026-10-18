import { useEffect, useState, type ReactElement } from "react";
import { DialogHost, DialogProvider } from "./app/dialogs";
import { useEditorState, useViewportZoomState } from "./app/hooks";
import { HOTKEYS } from "./app/utils";
import { CanvasViewport } from "./features/canvas";
import { LayersPanel } from "./features/layers-panel";
import { AppMenuBar } from "./features/menu-bar";
import { AppToolbar, ToolOptionsPanel } from "./features/tools";

export const App = (): ReactElement => {
  const editor = useEditorState();
  const { undo, redo } = editor;
  const viewportZoom = useViewportZoomState();
  const { zoomIn, zoomOut, resetZoom } = viewportZoom;
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
    <DialogProvider>
      <div className="flex h-full flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <AppMenuBar
          editor={editor}
          viewportZoom={viewportZoom}
          onFitToWindow={() => setFitToWindowRequestId((id) => id + 1)}
        />
        <div className="flex flex-1 overflow-hidden">
          <AppToolbar editor={editor} />
          <CanvasViewport
            editor={editor}
            viewportZoom={viewportZoom}
            fitToWindowRequestId={fitToWindowRequestId}
          />
          <div className="flex flex-col gap-2 border-l border-gray-200 dark:border-gray-800 p-2 overflow-auto">
            <ToolOptionsPanel editor={editor} />
            <LayersPanel editor={editor} />
          </div>
        </div>

        <DialogHost editor={editor} />
      </div>
    </DialogProvider>
  );
};
