import { describe, it, expect } from "vitest";
import { LipsyncEn } from "@met4citizen/talkinghead/modules/lipsync-en.mjs";

describe("LipsyncEn (talkinghead rules)", () => {
  it("produces visemes for a simple word", () => {
    const lip = new LipsyncEn();
    const o = lip.wordsToVisemes("HELLO");
    expect(o.visemes.length).toBeGreaterThan(0);
    expect(o.durations.length).toBe(o.visemes.length);
    expect(o.times.length).toBe(o.visemes.length);
  });

  it("preProcessText strips noise and keeps speakable content", () => {
    const lip = new LipsyncEn();
    const out = lip.preProcessText("Hello, world!");
    expect(out.toUpperCase()).toContain("HELLO");
    expect(out.toUpperCase()).toContain("WORLD");
  });
});
