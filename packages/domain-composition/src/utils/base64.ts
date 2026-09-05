import { BASE64_CHUNK_SIZE } from "../constants";

/**
 * Chunked byte<->base64 conversion using the global atob/btoa (stable in both
 * browsers and Node >=18), avoiding a Buffer dependency so this stays portable.
 * Chunking avoids String.fromCharCode(...bytes) blowing the call stack on large buffers.
 */
export const bytesToBase64 = (bytes: Uint8ClampedArray | Uint8Array): string => {
  const chunkCount = Math.ceil(bytes.length / BASE64_CHUNK_SIZE);
  const binary = Array.from({ length: chunkCount }, (_placeholder, chunkIndex) => {
    const byteOffset = chunkIndex * BASE64_CHUNK_SIZE;
    return String.fromCharCode(...bytes.subarray(byteOffset, byteOffset + BASE64_CHUNK_SIZE));
  }).join("");

  return btoa(binary);
};

export const base64ToBytes = (base64: string): Uint8ClampedArray<ArrayBuffer> => {
  const binary = atob(base64);

  return Uint8ClampedArray.from(binary, (character) => character.charCodeAt(0));
};
