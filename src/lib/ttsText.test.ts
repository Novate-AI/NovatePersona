import { describe, it, expect } from "vitest";
import { cleanTextForTts, wordsForLipsync } from "./ttsText";

describe("ttsText", () => {
  it("cleanTextForTts strips parenthetical stage directions like fetchTTSBlob", () => {
    expect(cleanTextForTts("Hello (wave) world")).toBe("Hello world");
  });

  it("wordsForLipsync strips punctuation from tokens", () => {
    expect(wordsForLipsync('Hello, world!')).toEqual(["Hello", "world"]);
  });
});
