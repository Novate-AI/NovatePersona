/** Word timing for TalkingHead `speakAudio` — spread clip duration by word weight. */

export function buildWordTimings(words: string[], durationMs: number) {
  if (words.length === 0) return { wtimes: [] as number[], wdurations: [] as number[] };
  const weights = words.map((w) => w.length + 0.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  const wtimes: number[] = [];
  const wdurations: number[] = [];
  for (let i = 0; i < words.length; i++) {
    const share = (weights[i] / total) * durationMs;
    wtimes.push(t);
    wdurations.push(share);
    t += share;
  }
  return { wtimes, wdurations };
}
