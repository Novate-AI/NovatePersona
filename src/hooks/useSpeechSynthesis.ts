import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hybrid speech synthesis: Piper TTS (natural, multilingual) with Web Speech API fallback.
 * Piper runs in-browser via ONNX; no backend required.
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

/** Piper voice IDs by language. Use medium for faster synthesis; ja/ko use Web Speech fallback. */
const PIPER_VOICES: Record<string, string> = {
  "en-GB": "en_GB-cori-medium",
  "en-US": "en_US-hfc_female-medium",
  en: "en_US-hfc_female-medium",
  "es-ES": "es_ES-sharvard-medium",
  "es-MX": "es_MX-claude-high",
  es: "es_ES-sharvard-medium",
  "fr-FR": "fr_FR-siwis-medium",
  fr: "fr_FR-siwis-medium",
  "de-DE": "de_DE-thorsten-medium",
  de: "de_DE-thorsten-medium",
  "it-IT": "it_IT-paola-medium",
  it: "it_IT-paola-medium",
  "pt-BR": "pt_BR-faber-medium",
  "pt-PT": "pt_PT-tugão-medium",
  pt: "pt_BR-faber-medium",
  "zh-CN": "zh_CN-huayan-medium",
  zh: "zh_CN-huayan-medium",
  "ar-JO": "ar_JO-kareem-medium",
  ar: "ar_JO-kareem-medium",
};

/** Piper WASM: served from public/piper-wasm/ (copied from node_modules by postinstall). */
const PIPER_WASM_BASE = "/piper-wasm/piper_phonemize";
const PIPER_WASM_PATHS = {
  onnxWasm: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/",
  piperData: `${PIPER_WASM_BASE}.data`,
  piperWasm: `${PIPER_WASM_BASE}.wasm`,
};

function getPiperVoiceId(langCode: string): string | null {
  const normalized = langCode.replace("_", "-");
  return (
    PIPER_VOICES[normalized] ??
    PIPER_VOICES[normalized.split("-")[0]] ??
    null
  );
}

export function useSpeechSynthesis(lang = "en-GB") {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const piperReadyRef = useRef(false);
  const piperErrorRef = useRef(false);

  const piperVoiceId = getPiperVoiceId(lang);
  const usePiper = piperVoiceId && !piperErrorRef.current;

  const isSupported =
    typeof window !== "undefined" &&
    ("speechSynthesis" in window || usePiper);

  // Web Speech API voices (fallback)
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

  const playWithPiper = useCallback(
    async (text: string): Promise<void> => {
      if (!piperVoiceId || typeof window === "undefined") return;
      try {
        const tts = await import("@mintplex-labs/piper-tts-web");
        const session = await tts.TtsSession.create({
          voiceId: piperVoiceId,
          wasmPaths: PIPER_WASM_PATHS,
        });
        const wav = await session.predict(
          text
            .replace(/\s*\([^)]*\)/g, "")
            .replace(/\s{2,}/g, " ")
            .trim()
        );
        if (!wav || wav.size === 0) throw new Error("Empty audio");
        piperReadyRef.current = true;
        return new Promise((resolve, reject) => {
          const audio = new Audio(URL.createObjectURL(wav));
          audio.onended = () => {
            URL.revokeObjectURL(audio.src);
            resolve();
          };
          audio.onerror = (e) => {
            URL.revokeObjectURL(audio.src);
            reject(e);
          };
          unlockAudio();
          audio.play().catch(reject);
        });
      } catch (e) {
        console.warn("Piper TTS failed, falling back to Web Speech:", e);
        piperErrorRef.current = true;
        throw e;
      }
    },
    [piperVoiceId]
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
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const text = queueRef.current.shift()!;

    if (!text.trim()) {
      setTimeout(() => playNext(), 80);
      return;
    }

    try {
      if (usePiper && piperVoiceId && !piperErrorRef.current) {
        console.log("[TTS] Using Piper (natural voice)", { voiceId: piperVoiceId });
        await playWithPiper(text);
      } else {
        throw new Error("Use Web Speech");
      }
    } catch {
      console.log("[TTS] Using browser Web Speech API (fallback)", { lang });
      await playWithWebSpeech(text);
    }

    setTimeout(() => playNext(), 80);
  }, [usePiper, piperVoiceId, playWithPiper, playWithWebSpeech]);

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

  /** Pre-warm Piper session so first sentence plays faster. Call on "Start practice". */
  const prewarmPiper = useCallback(async () => {
    if (!piperVoiceId || piperErrorRef.current || typeof window === "undefined") return;
    if (piperReadyRef.current) return;
    try {
      const tts = await import("@mintplex-labs/piper-tts-web");
      const session = await tts.TtsSession.create({
        voiceId: piperVoiceId,
        wasmPaths: PIPER_WASM_PATHS,
      });
      await session.predict("Hi");
      piperReadyRef.current = true;
    } catch {
      /* ignore; will fall back to Web Speech on first speak */
    }
  }, [piperVoiceId]);

  return {
    isSpeaking,
    speak,
    speakQueued,
    stop,
    isSupported,
    unlockAudio,
    resumeFromUserGesture,
    prewarmPiper,
  };
}
