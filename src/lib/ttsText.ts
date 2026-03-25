/**
 * Same string normalization as backend TTS (`fetchTTSBlob`) so Piper audio length
 * matches the word list used for viseme timing.
 */
export function cleanTextForTts(text: string): string {
  return text
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Strip outer punctuation so LipsyncEn rules see letters (e.g. "Hello," → "Hello"). */
export function wordsForLipsync(cleaned: string): string[] {
  return cleaned
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ""))
    .filter((w) => w.length > 0);
}
