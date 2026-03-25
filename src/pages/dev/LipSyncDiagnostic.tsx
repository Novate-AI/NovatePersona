import { useCallback, useEffect, useRef, useState } from "react";
import { LipsyncEn } from "@met4citizen/talkinghead/modules/lipsync-en.mjs";
import TalkingHead3DAvatar from "../../components/novapatient/TalkingHead3DAvatar";
import type { TtsPlaybackHandle } from "../../hooks/useSpeechSynthesis";
import { buildWordTimings } from "../../lib/lipSyncTiming";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(
  /\/api\/chat\/?$/,
  ""
);
const TTS_URL = `${BACKEND_URL}/api/tts`;
const VOICE_EN_GB = import.meta.env.VITE_TTS_VOICE_EN_GB || "en_GB-cori";

export default function LipSyncDiagnostic() {
  const ttsRef = useRef<TtsPlaybackHandle | null>(null);
  const [ruleText, setRuleText] = useState("Hello world");
  const [ruleJson, setRuleJson] = useState<string>("");
  const [ttsText, setTtsText] = useState("The lip sync test uses backend TTS and word timings.");
  const [playing, setPlaying] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lipDebug, setLipDebug] = useState<{ maxViseme: string; maxValue: number } | null>(null);

  const runRules = useCallback(() => {
    const lip = new LipsyncEn();
    const cleaned = lip.preProcessText(ruleText);
    const words = cleaned.split(/\s+/).filter(Boolean);
    const perWord = words.map((w) => ({
      word: w,
      ...lip.wordsToVisemes(w.toUpperCase()),
    }));
    const durationMs = 2000;
    const { wtimes, wdurations } = buildWordTimings(words, durationMs);
    setRuleJson(
      JSON.stringify(
        { preprocessed: cleaned, perWord, buildWordTimings: { wtimes, wdurations, durationMs } },
        null,
        2
      )
    );
  }, [ruleText]);

  useEffect(() => {
    runRules();
  }, [runRules]);

  useEffect(() => {
    if (!playing) {
      setLipDebug(null);
      return;
    }
    const id = window.setInterval(() => {
      const s = ttsRef.current?.getDebugLipSummary?.() ?? null;
      setLipDebug(s);
    }, 80);
    return () => window.clearInterval(id);
  }, [playing]);

  const playBackendTts = async () => {
    setLastError(null);
    const cleaned = ttsText.replace(/\s{2,}/g, " ").trim();
    if (!cleaned) {
      setLastError("Empty text");
      return;
    }
    setPlaying(true);
    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleaned,
          input: cleaned,
          lang: "en-GB",
          voice: VOICE_EN_GB,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`TTS ${res.status}: ${t || res.statusText}`);
      }
      const blob = await res.blob();
      await ttsRef.current?.playBlob(blob, cleaned);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      setPlaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Lip sync diagnostic</h1>
        <p className="mt-2 text-secondary text-sm">
          Dev-only page. Run <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">npm run test</code> for
          unit checks. Here: English viseme rules + backend TTS + max viseme while playing (should
          spike above ~0.01 when the mouth is driven).
        </p>
        <p className="mt-1 text-xs text-secondary">
          Backend: <code className="break-all">{TTS_URL}</code> — set{" "}
          <code className="text-xs">VITE_BACKEND_URL</code> if needed (default port in this repo is
          often 5001).
        </p>
      </div>

      <section className="space-y-2 rounded-2xl border p-4" style={{ borderColor: "var(--card-border)" }}>
        <h2 className="font-semibold text-primary">1. LipsyncEn rules + word timings</h2>
        <textarea
          className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm"
          style={{ borderColor: "var(--card-border)" }}
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
        />
        <button type="button" className="btn-primary text-sm" onClick={runRules}>
          Refresh JSON
        </button>
        <pre className="max-h-64 overflow-auto rounded-lg bg-zinc-100/80 dark:bg-zinc-900/50 p-3 text-xs text-secondary">
          {ruleJson || "—"}
        </pre>
      </section>

      <section className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--card-border)" }}>
        <h2 className="font-semibold text-primary">2. Avatar + backend TTS</h2>
        <textarea
          className="w-full min-h-[72px] rounded-lg border bg-background px-3 py-2 text-sm"
          style={{ borderColor: "var(--card-border)" }}
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={playing}
            onClick={() => void playBackendTts()}
          >
            {playing ? "Playing…" : "Play TTS + lip sync"}
          </button>
          <span className="text-sm text-secondary">
            Max viseme:{" "}
            <strong className="text-primary">
              {lipDebug ? `${lipDebug.maxViseme} (${lipDebug.maxValue.toFixed(3)})` : "—"}
            </strong>
          </span>
        </div>
        {lastError && <p className="text-sm text-amber-600">{lastError}</p>}
        <div className="flex justify-center max-w-md mx-auto">
          <TalkingHead3DAvatar
            ref={ttsRef}
            isSpeaking={playing}
            displayName="Diagnostic"
            body="F"
          />
        </div>
      </section>
    </div>
  );
}
