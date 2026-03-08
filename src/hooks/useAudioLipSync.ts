import { useState, useEffect, useRef } from "react";
import type { SpeakingAudioRef } from "./useSpeechSynthesis";

/**
 * Analyzes audio from the speaking ref and returns mouth openness (0-1) for lip-sync.
 * Uses Web Audio API AnalyserNode to drive avatar mouth movement from Piper TTS.
 */
export function useAudioLipSync(
  speakingAudioRef: SpeakingAudioRef | undefined,
  isSpeaking: boolean
): number {
  const [mouthOpen, setMouthOpen] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;

  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const pollForAudio = () => {
      const audio = speakingAudioRef?.current;
      if (!audio) {
        rafRef.current = requestAnimationFrame(pollForAudio);
        return;
      }

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      analyser.minDecibels = -60;
      analyser.maxDecibels = -10;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      ctxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!isSpeakingRef.current) return;
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(1, (avg / 128) * 2.5);
        setMouthOpen(normalized);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(pollForAudio);

    return () => {
      cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      ctxRef.current?.close();
      ctxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setMouthOpen(0);
    };
  }, [isSpeaking, speakingAudioRef]);

  return mouthOpen;
}
