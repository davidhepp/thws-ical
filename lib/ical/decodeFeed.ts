export function decodeFeed(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    // Fallback for iCal feeds using legacy encodings
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
}
