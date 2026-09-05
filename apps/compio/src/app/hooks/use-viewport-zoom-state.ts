import { useCallback, useState } from "react";

export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;
const ZOOM_STEP_FACTOR = 1.25;

const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/**
 * Zoom is a viewport concern, not part of the document — it never touches
 * Composition/useEditorState or gets saved to .compio.json.
 */
export const useViewportZoomState = () => {
  const [zoom, setZoomState] = useState(DEFAULT_ZOOM);

  const setZoom = useCallback((next: number) => setZoomState(clampZoom(next)), []);
  const zoomIn = useCallback(
    () => setZoomState((previous) => clampZoom(previous * ZOOM_STEP_FACTOR)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomState((previous) => clampZoom(previous / ZOOM_STEP_FACTOR)),
    [],
  );
  const resetZoom = useCallback(() => setZoomState(DEFAULT_ZOOM), []);

  return { zoom, setZoom, zoomIn, zoomOut, resetZoom };
};

export type ViewportZoomState = ReturnType<typeof useViewportZoomState>;
