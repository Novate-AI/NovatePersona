import { useState, useCallback, useRef } from "react";

/** Speech synthesis using the browser's built-in Web Speech API. */

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
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

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
      queueMicrotask(() => playNext());
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    unlockAudio();

    const scheduleNext = () => queueMicrotask(() => playNext());

    const u = new SpeechSynthesisUtterance(cleaned);
    u.lang = lang || "en-GB";
    u.onend = scheduleNext;
    u.onerror = scheduleNext;
    window.speechSynthesis.speak(u);
  }, [lang]);

  const speakQueued = useCallback(
    (text: string) => {
      queueRef.current.push(text);
      if (!isPlayingRef.current) playNext();
    },
    [playNext]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
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
