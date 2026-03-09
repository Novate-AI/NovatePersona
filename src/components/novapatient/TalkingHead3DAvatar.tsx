import { useEffect, useRef, useState } from "react";
import { TalkingHead } from "@met4citizen/talkinghead";
import type { SpeakingAudioRef } from "../../hooks/useSpeechSynthesis";

/** Free 3D avatars with Oculus visemes (from HeadAudio demo, CC-licensed) */
const AVATAR_URLS: Record<"F" | "M", string> = {
  F: "https://cdn.jsdelivr.net/gh/met4citizen/HeadAudio@main/avatars/julia.glb",
  M: "https://cdn.jsdelivr.net/gh/met4citizen/HeadAudio@main/avatars/david.glb",
};
const HEADAUDIO_WORKLET = "https://cdn.jsdelivr.net/npm/@met4citizen/headaudio@0.1.0/modules/headworklet.mjs";
const HEADAUDIO_MODEL = "https://cdn.jsdelivr.net/gh/met4citizen/HeadAudio@main/dist/model-en-mixed.bin";

interface TalkingHead3DAvatarProps {
  speakingAudioRef?: SpeakingAudioRef;
  isSpeaking: boolean;
  isListening?: boolean;
  displayName?: string;
  compact?: boolean;
  /** "F" for female (Julia), "M" for male (David) */
  body?: "F" | "M";
}

export default function TalkingHead3DAvatar({
  speakingAudioRef,
  isSpeaking,
  isListening = false,
  displayName = "Novate Abby",
  compact = false,
  body = "F",
}: TalkingHead3DAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<InstanceType<typeof TalkingHead> | null>(null);
  const headaudioRef = useRef<unknown>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    const onInteraction = () => setUserInteracted(true);
    window.addEventListener("click", onInteraction, { once: true, capture: true });
    window.addEventListener("touchstart", onInteraction, { once: true, capture: true });
    return () => {
      window.removeEventListener("click", onInteraction, true);
      window.removeEventListener("touchstart", onInteraction, true);
    };
  }, []);

  useEffect(() => {
    if (!userInteracted) return;
    const el = containerRef.current;
    if (!el) return;

    let head: InstanceType<typeof TalkingHead> | null = null;
    let headaudio: InstanceType<typeof import("@met4citizen/headaudio/modules/headaudio.mjs").HeadAudio> | null = null;

    const init = async () => {
      try {
        const { HeadAudio } = await import("@met4citizen/headaudio/modules/headaudio.mjs");
        head = new TalkingHead(el, {
          ttsEndpoint: "N/A",
          lipsyncModules: [],
          cameraView: "head",
          mixerGainSpeech: 3,
          modelFPS: 60,
          cameraRotateEnable: false,
          cameraDistance: 0.6,
        });
        headRef.current = head;

        await head.audioCtx.audioWorklet.addModule(HEADAUDIO_WORKLET);
        headaudio = new HeadAudio(head.audioCtx, {
          parameterData: { vadGateActiveDb: -40, vadGateInactiveDb: -60 },
        });
        headaudioRef.current = headaudio;

        await headaudio.loadModel(HEADAUDIO_MODEL);
        head.audioSpeechGainNode.connect(headaudio);
        const delayNode = new DelayNode(head.audioCtx, { delayTime: 0.1 });
        head.audioSpeechGainNode.disconnect(head.audioReverbNode);
        head.audioSpeechGainNode.connect(delayNode);
        delayNode.connect(head.audioReverbNode);

        headaudio.onvalue = (key: string, value: number) => {
          if (head?.mtAvatar?.[key]) {
            Object.assign(head.mtAvatar[key], { newvalue: value, needsUpdate: true });
          }
        };
        head.opt.update = headaudio.update.bind(headaudio);

        await head.showAvatar({
          url: AVATAR_URLS[body],
          body,
          avatarMood: "neutral",
        });
        if (head.audioCtx.state === "suspended") {
          head.audioCtx.resume().catch(() => {});
        }
        head.start();
        headaudio.start();
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load 3D avatar");
      }
    };

    init();
    return () => {
      head?.stop?.();
      headaudio?.stop?.();
      headRef.current = null;
      headaudioRef.current = null;
    };
  }, [userInteracted, body]);

  const connectedAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7632/ingest/043fd331-b15f-44f5-a401-e8f532291b9c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'80c508'},body:JSON.stringify({sessionId:'80c508',location:'TalkingHead3DAvatar.tsx:effect',message:'Connect effect run',data:{ready,hasRef:!!speakingAudioRef,isSpeaking},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!ready || !speakingAudioRef) return;
    const head = headRef.current;
    if (!head?.audioCtx) return;

    const connect = async (audio: HTMLAudioElement) => {
      if (connectedAudioRef.current === audio) return;
      try {
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (head.audioCtx.state === "suspended") {
          await head.audioCtx.resume();
        }
        const src = head.audioCtx.createMediaElementSource(audio);
        src.connect(head.audioSpeechGainNode);
        sourceRef.current = src;
        connectedAudioRef.current = audio;
        const onEnd = () => {
          sourceRef.current?.disconnect();
          sourceRef.current = null;
          connectedAudioRef.current = null;
        };
        audio.addEventListener("ended", onEnd);
        return () => audio.removeEventListener("ended", onEnd);
      } catch {}
    };
    const disconnect = () => {
      sourceRef.current?.disconnect();
      sourceRef.current = null;
      connectedAudioRef.current = null;
    };

    if (!isSpeaking) {
      disconnect();
      return;
    }

    const poll = () => {
      const audio = speakingAudioRef.current;
      if (audio && connectedAudioRef.current !== audio) {
        void connect(audio);
      }
    };
    poll();
    const id = setInterval(poll, 20);
    return () => {
      clearInterval(id);
      disconnect();
    };
  }, [ready, isSpeaking, speakingAudioRef]);

  const status = isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready";
  const statusDot = isSpeaking ? "bg-emerald-500" : isListening ? "bg-red-500" : "bg-zinc-400";
  const h = compact ? "h-32" : "h-64";

  if (error) {
    return (
      <div className={`${h} rounded-2xl flex items-center justify-center`} style={{ background: "var(--subtle-bg)" }}>
        <p className="text-xs text-amber-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-full ${h} rounded-2xl overflow-hidden`} style={{ background: "var(--subtle-bg)" }}>
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        {!userInteracted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: "var(--subtle-bg)" }}>
            <span className="text-xs text-secondary">Click to enable avatar</span>
          </div>
        )}
        {userInteracted && !ready && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--subtle-bg)" }}>
            <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-primary">{displayName}</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status !== "Ready" ? "animate-pulse" : ""}`} />
          <span className="text-xs text-secondary font-medium">{status}</span>
        </div>
      </div>
    </div>
  );
}
