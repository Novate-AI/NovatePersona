import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Browser-only speech synthesis. Uses the best available voice for the language.
 * No backend TTS; uses window.speechSynthesis with a preferred voice when possible.
 */

/** Minimal silent WAV to unlock audio in browsers that require a user gesture before play(). */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

let audioUnlocked = false;
/** Call from a user gesture (e.g. Start button click) so the first TTS play() is not blocked by autoplay. */
function unlockAudio() {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  const a = new Audio(SILENT_WAV);
  a.volume = 0;
  a.play().catch(() => {});
}

export function useSpeechSynthesis(lang = "en-GB") {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Preload voices on mount (Chrome loads them async; getVoices() triggers loading)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const getBestVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    let voices = window.speechSynthesis.getVoices();
    // Chrome loads voices async; getVoices() returns [] until voiceschanged fires
    if (!voices.length) {
      voices = window.speechSynthesis.getVoices();
    }
    if (!voices.length) return null;
    const langPrefix = langCode.split("-")[0];
    const preferred = voices.find(
      (v) => v.lang.replace("_", "-").startsWith(langCode) && v.localService
    );
    if (preferred) return preferred;
    const langMatch = voices.find((v) =>
      v.lang.replace("_", "-").toLowerCase().startsWith(langPrefix)
    );
    if (langMatch) return langMatch;
    const defaultVoice = voices.find((v) => v.default);
    return defaultVoice || voices[0];
  }, []);

  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const text = queueRef.current.shift()!;

    const cleaned = text
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!cleaned) {
      setTimeout(() => playNext(), 80);
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
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

    utterance.onend = () => {
      setTimeout(() => playNext(), 80);
    };
    utterance.onerror = () => {
      setTimeout(() => playNext(), 80);
    };

    window.speechSynthesis.speak(utterance);
  }, [lang, getBestVoice]);

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

export { unlockAudio };
