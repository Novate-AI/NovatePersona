import { describe, it, expect } from "vitest";
import { buildWordTimings } from "./lipSyncTiming";

describe("buildWordTimings", () => {
  it("returns empty arrays for no words", () => {
    expect(buildWordTimings([], 1000)).toEqual({ wtimes: [], wdurations: [] });
  });

  it("spreads duration across words by length weight", () => {
    const { wtimes, wdurations } = buildWordTimings(["a", "bb"], 100);
    // weights 1.5 and 2.5 → shares 37.5% / 62.5%
    expect(wtimes).toEqual([0, 37.5]);
    expect(wdurations[0] + wdurations[1]).toBeCloseTo(100, 5);
    expect(wdurations[0]).toBeCloseTo(37.5, 5);
    expect(wdurations[1]).toBeCloseTo(62.5, 5);
  });

  it("sums to clip duration for multi-word phrases", () => {
    const ms = 5234;
    const { wtimes, wdurations } = buildWordTimings(["hello", "world", "test"], ms);
    const total = wdurations.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(ms, 5);
    expect(wtimes[0]).toBe(0);
    expect(wtimes.length).toBe(3);
  });
});
