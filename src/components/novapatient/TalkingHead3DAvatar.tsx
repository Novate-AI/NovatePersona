import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";
import { TalkingHead } from "@met4citizen/talkinghead";
import { LipsyncEn } from "@met4citizen/talkinghead/modules/lipsync-en.mjs";
import type { TtsPlaybackHandle } from "../../hooks/useSpeechSynthesis";
import { attachHeadAudioToTalkingHead, detachHeadAudioFromTalkingHead } from "../../lib/headAudioLipsync";
import { getGlbSnapshotDataUrl } from "../../lib/glbSnapshot";
import { cleanTextForTts } from "../../lib/ttsText";
import { buildWordTimings } from "../../lib/lipSyncTiming";

const AVATAR_URLS: Record<"F" | "M", string> = {
  F: "https://cdn.jsdelivr.net/gh/met4citizen/HeadAudio@main/avatars/julia.glb",
  M: "https://cdn.jsdelivr.net/gh/met4citizen/HeadAudio@main/avatars/david.glb",
};

interface TalkingHead3DAvatarProps {
  isSpeaking: boolean;
  isListening?: boolean;
  displayName?: string;
  compact?: boolean;
  body?: "F" | "M";
}

const VISEME_KEYS = [
  "aa", "E", "I", "O", "U", "PP", "SS", "TH", "DD", "FF", "kk", "nn", "RR", "CH", "sil",
] as const;

function waitForSpeechIdle(head: InstanceType<typeof TalkingHead>, durationMs: number): Promise<void> {
  const maxWait = durationMs + 2500;
  const deadline = performance.now() + maxWait;
  return new Promise((resolve) => {
    const tick = () => {
      const h = head as InstanceType<typeof TalkingHead> & {
        isSpeaking: boolean;
        isAudioPlaying: boolean;
        speechQueue: { length: number };
        audioPlaylist: { length: number };
      };
      const idle =
        !h.isSpeaking &&
        !h.isAudioPlaying &&
        (!h.speechQueue?.length || h.speechQueue.length === 0) &&
        (!h.audioPlaylist?.length || h.audioPlaylist.length === 0);
      if (idle || performance.now() >= deadline) {
        resolve();
        return;
      }
      window.setTimeout(tick, 32);
    };
    window.setTimeout(tick, Math.min(80, durationMs * 0.05));
  });
}

function scaleVisemeIntensity(head: InstanceType<typeof TalkingHead>) {
  const h = head as InstanceType<typeof TalkingHead> & {
    animQueue: Array<{ vs: Record<string, number[]> }>;
  };
  if (h.animQueue) {
    h.animQueue.forEach(anim => {
      if (anim.vs) {
        Object.keys(anim.vs).forEach(key => {
          if (key.startsWith('viseme_')) {
            const values = anim.vs[key];
            if (values && values.length > 1 && typeof values[1] === 'number') {
              values[1] = values[1] * 0.45;
            }
          }
        });
      }
    });
  }
}


const TalkingHead3DAvatar = memo(forwardRef<TtsPlaybackHandle | null, TalkingHead3DAvatarProps>(
  function TalkingHead3DAvatar(
    { isSpeaking, isListening = false, displayName = "Novate Abby", compact = false, body = "F" },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const headRef = useRef<InstanceType<typeof TalkingHead> | null>(null);
    const headAudioRef = useRef<Awaited<ReturnType<typeof attachHeadAudioToTalkingHead>> | null>(null);
    const lipDriverRef = useRef<"headaudio" | "text">("text");
    const headAudioTriedRef = useRef(false);
    const initPromiseRef = useRef<Promise<void> | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [glbPreview, setGlbPreview] = useState<string | null>(null);

    // Generate GLB snapshot in background (low priority)
    useEffect(() => {
      let cancelled = false;
      setGlbPreview(null);
      
      // Use requestIdleCallback or setTimeout to avoid blocking the main thread
      const scheduleSnapshot = () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            if (!cancelled) {
              void getGlbSnapshotDataUrl(AVATAR_URLS[body]).then((url) => {
                if (!cancelled && url) setGlbPreview(url);
              });
            }
          });
        } else {
          setTimeout(() => {
            if (!cancelled) {
              void getGlbSnapshotDataUrl(AVATAR_URLS[body]).then((url) => {
                if (!cancelled && url) setGlbPreview(url);
              });
            }
          }, 100);
        }
      };
      
      scheduleSnapshot();
      
      return () => {
        cancelled = true;
      };
    }, [body]);

    /**
     * Create TalkingHead only after a user gesture so the AudioContext
     * starts in "running" state. Returns a cached promise so concurrent
     * calls (warmup + playBlob) don't double-init.
     */
    const ensureHeadInitialized = () => {
      if (initPromiseRef.current) return initPromiseRef.current;

      initPromiseRef.current = (async () => {
        if (!containerRef.current) return;

        const head = new TalkingHead(containerRef.current, {
          ttsEndpoint: "N/A",
          lipsyncModules: [],
          lipsyncLang: "en",
          cameraView: "head",
          mixerGainSpeech: 1.2,
          modelFPS: 45,
          cameraRotateEnable: false,
          cameraDistance: 0.6,
        });
        headRef.current = head;

        await head.showAvatar({
          url: AVATAR_URLS[body],
          body,
          avatarMood: "neutral",
        });

        head.start();
        head.lipsync["en"] = new LipsyncEn();
        setReady(true);

        try {
          headAudioRef.current = await attachHeadAudioToTalkingHead(head);
          lipDriverRef.current = "headaudio";
        } catch {
          lipDriverRef.current = "text";
        }
        headAudioTriedRef.current = true;
      })().catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load 3D avatar");
        initPromiseRef.current = null;
      });

      return initPromiseRef.current;
    };

    // Preload the .glb model into browser cache
    useEffect(() => {
      fetch(AVATAR_URLS[body]).catch(() => {});

      return () => {
        const head = headRef.current;
        if (head) {
          detachHeadAudioFromTalkingHead(head, headAudioRef.current);
          headAudioRef.current = null;
        }
        headAudioTriedRef.current = false;
        initPromiseRef.current = null;
        head?.stopSpeaking?.();
        head?.stop?.();
        headRef.current = null;
        setReady(false);
        setError(null);
      };
    }, [body]);

    useImperativeHandle(
      ref,
      () => ({
        warmup: () => {
          // Start TalkingHead init immediately, don't wait for it
          void ensureHeadInitialized();
        },

        playBlob: async (blob: Blob, text: string) => {
          // Start initialization if not started, but don't block on it
          void ensureHeadInitialized();
          
          // If head is already ready, use it for lip sync
          const head = headRef.current;
          if (head?.audioCtx) {
            const th = head as InstanceType<typeof TalkingHead> & { isRunning?: boolean };
            if (th.isRunning === false) th.start();

            head.stopSpeaking();
            const ab = await blob.arrayBuffer();
            const buffer = await head.audioCtx.decodeAudioData(ab.slice(0));
            const cleaned = cleanTextForTts(text);
            const durationMs = buffer.duration * 1000;

            if (!head.lipsync["en"]) head.lipsync["en"] = new LipsyncEn();
            const preprocessed = cleaned.trim()
              ? head.lipsyncPreProcessText(cleaned, "en").replace(/\s+/g, " ").trim()
              : "";
            const words = preprocessed.split(/\s+/).filter(Boolean);

            if (words.length) {
              const { wtimes, wdurations } = buildWordTimings(words, durationMs);
              head.speakAudio(
                { audio: buffer, words, wtimes, wdurations },
                { lipsyncLang: "en" }
              );
            } else {
              head.speakAudio({ audio: buffer }, { lipsyncLang: "en" });
            }

            scaleVisemeIntensity(head);
            await waitForSpeechIdle(head, durationMs);
          } else {
            // Head not ready yet, play audio immediately without lip sync
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play().catch(() => {});
          }
        },

        stop: () => {
          headRef.current?.stopSpeaking?.();
        },

        getDebugLipSummary: () => {
          const head = headRef.current;
          if (!head?.mtAvatar) return null;
          let maxValue = 0;
          let maxViseme = "";
          for (const n of VISEME_KEYS) {
            const key = `viseme_${n}`;
            const o = head.mtAvatar[key] as { value?: number; applied?: number } | undefined;
            const v = typeof o?.value === "number" ? o.value : typeof o?.applied === "number" ? o.applied : 0;
            if (v > maxValue) {
              maxValue = v;
              maxViseme = key;
            }
          }
          return { maxViseme, maxValue };
        },
      }),
      []
    );

    const status = isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready";
    const statusDot = isSpeaking ? "bg-emerald-500" : isListening ? "bg-red-500" : "bg-zinc-400";
    const h = compact ? "h-32" : "h-64";

    if (error) {
      return (
        <div
          className={`${h} rounded-2xl flex items-center justify-center`}
          style={{ background: "transparent", backdropFilter: "none" }}
        >
          <p className="text-xs text-amber-500">{error}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className={`relative w-full ${h} rounded-2xl overflow-hidden border`}
          style={{
            background: "transparent",
            borderColor: "var(--card-border)",
          }}
        >
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          {!ready && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4"
              style={{ background: "linear-gradient(135deg, #faf9f6, #f0ece4)" }}
            >
              <div
                className={`relative shrink-0 rounded-full overflow-hidden shadow-md ${
                  compact ? "h-24 w-24 border-[3px]" : "h-44 w-44 border-4"
                }`}
                style={{
                  borderColor: "var(--card-border, rgba(15, 23, 42, 0.12))",
                  background: "#f5f3ef",
                }}
              >
                {glbPreview ? (
                  <img
                    src={glbPreview}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "center 35%" }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-500 text-center max-w-56 leading-snug">
                Click Begin lesson to start
              </p>
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
), (prev, next) => (
  prev.isSpeaking === next.isSpeaking &&
  prev.isListening === next.isListening &&
  prev.displayName === next.displayName &&
  prev.compact === next.compact &&
  prev.body === next.body
));

export default TalkingHead3DAvatar;
