import { TOOL_NAMES } from "@compio/plugins-tools-core";
import { ColorPicker, Panel, Slider } from "@compio/ui-kit";
import type { ReactElement } from "react";
import type { EditorState } from "../../../../app/hooks";

export interface ToolOptionsPanelProps {
  editor: EditorState;
}

const TRANSFORM_TOOLS: readonly string[] = [TOOL_NAMES.MOVE, TOOL_NAMES.SCALE, TOOL_NAMES.ROTATE];

export const ToolOptionsPanel = ({ editor }: ToolOptionsPanelProps): ReactElement => {
  const { activeToolName, brushSettings, setBrushSettings, selectedLayer } = editor;

  return (
    <Panel title="Tool Options" className="w-56">
      {(activeToolName === TOOL_NAMES.BRUSH || activeToolName === TOOL_NAMES.ERASER) && (
        <div className="flex flex-col gap-3">
          <Slider
            label="Radius"
            value={brushSettings.radius}
            min={1}
            max={100}
            onChange={(radius) => setBrushSettings((prev) => ({ ...prev, radius }))}
          />
          <Slider
            label="Hardness"
            value={Math.round(brushSettings.hardness * 100)}
            min={0}
            max={100}
            onChange={(value) => setBrushSettings((prev) => ({ ...prev, hardness: value / 100 }))}
          />
          <Slider
            label="Opacity"
            value={Math.round(brushSettings.opacity * 100)}
            min={0}
            max={100}
            onChange={(value) => setBrushSettings((prev) => ({ ...prev, opacity: value / 100 }))}
          />
          {activeToolName === TOOL_NAMES.BRUSH && (
            <ColorPicker
              label="Color"
              value={brushSettings.color}
              onChange={(color) => setBrushSettings((prev) => ({ ...prev, color }))}
            />
          )}
        </div>
      )}

      {TRANSFORM_TOOLS.includes(activeToolName) && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedLayer
            ? "Drag inside the box to move, drag a corner to scale, or drag the top handle to rotate. Transforms only ever change position/scale/rotation — pixels are never modified."
            : "Select a layer to show its transform handles."}
        </p>
      )}

      {activeToolName === TOOL_NAMES.TEXT && (
        <ColorPicker label="Text color" value={editor.textColor} onChange={editor.setTextColor} />
      )}

      {activeToolName === TOOL_NAMES.GEOMETRIC_SELECTION && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Drag on the canvas to make a rectangular selection. Paint and erase are then clipped to it
          until you Select &gt; Deselect.
        </p>
      )}
    </Panel>
  );
};
