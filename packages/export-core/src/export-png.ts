import type { Composition } from "@compio/domain-composition";
import { renderComposition, type CanvasFactory } from "@compio/renderer-core";
import { downloadBlob } from "./download";

const PNG_MIME_TYPE = "image/png";

const canvasToPngBlob = (canvas: ReturnType<CanvasFactory>): Promise<Blob> => {
  if ("convertToBlob" in canvas && typeof canvas.convertToBlob === "function") {
    return (canvas as OffscreenCanvas).convertToBlob({ type: PNG_MIME_TYPE });
  }
  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise((resolve, reject) => {
    htmlCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas failed to produce a PNG blob"));
    }, PNG_MIME_TYPE);
  });
};

export interface ExportCompositionAsPngOptions {
  composition: Composition;
  filename?: string;
  canvasFactory?: CanvasFactory;
}

export const exportCompositionAsPng = async ({
  composition,
  filename = "compio-export.png",
  canvasFactory,
}: ExportCompositionAsPngOptions): Promise<void> => {
  const surface = renderComposition(composition, canvasFactory);
  const blob = await canvasToPngBlob(surface);
  downloadBlob(blob, filename);
};
