import {
  compositionFromJSON,
  compositionToJSON,
  rawRasterCodec,
  type Composition,
  type CompositionJSON,
  type RasterCodec,
} from "@compio/domain-composition";
import { downloadBlob } from "./download";

const JSON_MIME_TYPE = "application/json";
export const COMPIO_FILE_EXTENSION = ".compio.json";

export interface ExportCompositionAsJsonOptions {
  composition: Composition;
  filename?: string;
  codec?: RasterCodec;
}

export const exportCompositionAsJson = ({
  composition,
  filename = `compio-export${COMPIO_FILE_EXTENSION}`,
  codec = rawRasterCodec,
}: ExportCompositionAsJsonOptions): void => {
  const json = compositionToJSON(composition, codec);
  const blob = new Blob([JSON.stringify(json)], { type: JSON_MIME_TYPE });
  downloadBlob(blob, filename);
};

export const importCompositionFromJsonFile = async (
  file: File,
  codec: RasterCodec = rawRasterCodec,
): Promise<Composition> => {
  const text = await file.text();
  const json = JSON.parse(text) as CompositionJSON;
  return compositionFromJSON(json, codec);
};
