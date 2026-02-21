import { useCallback, useState, useEffect } from "react";
import { speak as ttsSpeak, stop as ttsStop, onSpeakingChange } from "../lib/tts";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return onSpeakingChange(setIsSpeaking);
  }, []);

  const speak = useCallback((text: string, lang = "en") => {
    ttsSpeak(text, lang);
  }, []);

  const stop = useCallback(() => {
    ttsStop();
  }, []);

  return { speak, stop, isSpeaking };
}
