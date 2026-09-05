import { Panel } from "@compio/ui-kit";
import { useRef, type ReactElement } from "react";
import type { EditorState } from "../../../../app/hooks";
import { LayerRow } from "./components/layer-row";

export interface LayersPanelProps {
  editor: EditorState;
}

export const LayersPanel = ({ editor }: LayersPanelProps): ReactElement => {
  const layers = [...editor.composition.layers].sort((a, b) => b.zIndex - a.zIndex);

  // Opacity dragging fires setLayerOpacity continuously (cheap — no raster
  // clone), so only the first change of a drag session should open a new
  // undo step; onCommit (drag release) closes the session.
  const isDraggingOpacityRef = useRef(false);

  const handleOpacityChange = (layerId: string, opacity: number): void => {
    if (!isDraggingOpacityRef.current) {
      isDraggingOpacityRef.current = true;
      editor.beginHistoryTransaction();
    }
    editor.setLayerOpacity(layerId, opacity);
  };

  const handleOpacityCommit = (): void => {
    isDraggingOpacityRef.current = false;
  };

  return (
    <Panel title="Layers" className="w-64">
      <div className="flex flex-col gap-2">
        {layers.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">No layers yet.</p>
        )}
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            selected={editor.composition.selectedLayerIds.includes(layer.id)}
            onSelect={editor.selectLayer}
            onToggleVisibility={editor.toggleLayerVisibility}
            onToggleLocked={editor.toggleLayerLocked}
            onOpacityChange={handleOpacityChange}
            onOpacityCommit={handleOpacityCommit}
            onBlendModeChange={editor.setLayerBlendMode}
          />
        ))}
      </div>
    </Panel>
  );
};
