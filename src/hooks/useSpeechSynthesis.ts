import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Speech synthesis: backend TTS (Piper/Edge) when available, else Web Speech API.
 */

/** Minimal silent WAV to unlock audio in browsers that require a user gesture before play(). */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

let audioUnlocked = false;
export function unlockAudio() {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  const a = new Audio(SILENT_WAV);
  a.volume = 0;
  a.play().catch(() => {});
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(
  /\/api\/chat\/?$/,
  ""
);
const TTS_URL = `${BACKEND_URL}/api/tts`;

/** Piper voice for en-GB: English (England) female. Override via VITE_TTS_VOICE_EN_GB. */
const VOICE_EN_GB = import.meta.env.VITE_TTS_VOICE_EN_GB || "en_GB-cori";

/** Ref to the currently playing Audio element (backend TTS only). Used for lip-sync analysis. */
export type SpeakingAudioRef = import("react").MutableRefObject<HTMLAudioElement | null>;

export function useSpeechSynthesis(lang = "en-GB", speakingAudioRef?: SpeakingAudioRef) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const ttsErrorRef = useRef(false);
  const prefetchedRef = useRef<{ text: string; blob: Blob; url: string } | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("speechSynthesis" in window || !!import.meta.env.VITE_BACKEND_URL);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getBestVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;
    if (!voices.length) return null;
    const langPrefix = langCode.split("-")[0].toLowerCase();
    const norm = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
    const matchesLang = (v: SpeechSynthesisVoice) =>
      norm(v).startsWith(langCode) || norm(v).startsWith(langPrefix);
    const exclude = (v: SpeechSynthesisVoice) =>
      /espeak|eloquence|effects/i.test(v.name) || v.name.includes("(eSpeak)");
    const langVoices = voices.filter((v) => matchesLang(v) && !exclude(v));
    if (!langVoices.length) {
      const fallback = voices.find((v) => matchesLang(v));
      return fallback || voices.find((v) => v.default) || voices[0];
    }
    const remote = langVoices.filter((v) => !v.localService);
    const neural = (remote.length ? remote : langVoices).filter(
      (v) =>
        /microsoft.*online|natural|wavenet|neural|google.*(natural|wavenet)/i.test(v.name) ||
        v.name.includes("Online")
    );
    const pool = neural.length ? neural : remote.length ? remote : langVoices;
    return pool[0] || langVoices[0];
  }, []);

  const fetchTTSBlob = useCallback(
    async (text: string): Promise<Blob> => {
      const cleaned = text
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (!cleaned) throw new Error("Empty text");
      const body: Record<string, string> = { text: cleaned, input: cleaned, lang };
      if (lang.toLowerCase().startsWith("en-gb")) body.voice = VOICE_EN_GB;
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("TTS failed");
      return res.blob();
    },
    [lang]
  );

  const playWithBackendTTS = useCallback(
    async (text: string, blobOrNull?: Blob | null): Promise<void> => {
      const cleaned = text
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (!cleaned) return;

      let blob: Blob;
      if (blobOrNull) {
        blob = blobOrNull;
      } else {
        blob = await fetchTTSBlob(cleaned);
      }
      const url = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        if (speakingAudioRef) speakingAudioRef.current = audio;
        audio.onended = () => {
          if (speakingAudioRef) speakingAudioRef.current = null;
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = (e) => {
          if (speakingAudioRef) speakingAudioRef.current = null;
          URL.revokeObjectURL(url);
          reject(e);
        };
        unlockAudio();
        audio.play().catch(reject);
      });
    },
    [fetchTTSBlob, speakingAudioRef]
  );

  const playWithWebSpeech = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          resolve();
          return;
        }
        const cleaned = text
          .replace(/\s*\([^)]*\)/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
        if (!cleaned) {
          resolve();
          return;
        }
        unlockAudio();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        const voice = getBestVoice(lang);
        if (voice) utterance.voice = voice;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    },
    [lang, getBestVoice]
  );

  const playNext = useCallback(async () => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      prefetchedRef.current = null;
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const text = queueRef.current.shift()!;

    if (!text.trim()) {
      queueMicrotask(playNext);
      return;
    }

    // Use prefetched blob if it matches (reduces lag: play immediately, no wait for fetch)
    const prefetched = prefetchedRef.current;
    prefetchedRef.current = null;
    const trimmed = text.trim();
    const usePrefetched = prefetched && prefetched.text === trimmed;
    if (usePrefetched && prefetched!.url) {
      URL.revokeObjectURL(prefetched!.url);
    }

    // Prefetch next sentence in parallel while current plays
    const nextText = queueRef.current[0]?.trim();
    if (nextText && !ttsErrorRef.current) {
      fetchTTSBlob(nextText)
        .then((blob) => {
          prefetchedRef.current = { text: nextText, blob, url: URL.createObjectURL(blob) };
        })
        .catch(() => {});
    }

    try {
      if (!ttsErrorRef.current) {
        await playWithBackendTTS(text, usePrefetched ? prefetched!.blob : null);
      } else {
        throw new Error("Use Web Speech");
      }
    } catch {
      ttsErrorRef.current = true;
      await playWithWebSpeech(text);
    }
    queueMicrotask(playNext);
  }, [playWithBackendTTS, playWithWebSpeech, fetchTTSBlob]);

  const speakQueued = useCallback(
    (text: string) => {
      queueRef.current.push(text);
      if (!isPlayingRef.current) {
        playNext();
      }
    },
    [playNext]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    prefetchedRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      stop();
      speakQueued(text);
    },
    [stop, speakQueued]
  );

  const resumeFromUserGesture = useCallback(() => {
    unlockAudio();
    if (queueRef.current.length > 0 && !isPlayingRef.current) playNext();
  }, [playNext]);

  return {
    isSpeaking,
    speak,
    speakQueued,
    stop,
    isSupported,
    unlockAudio,
    resumeFromUserGesture,
  };
}
