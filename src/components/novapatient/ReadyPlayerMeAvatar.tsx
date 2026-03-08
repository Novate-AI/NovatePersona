import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "@readyplayerme/visage";
import type { SpeakingAudioRef } from "../../hooks/useSpeechSynthesis";
import { useAudioLipSync } from "../../hooks/useAudioLipSync";

/** Default Ready Player Me avatar URL (half-body, with morph targets for lip-sync). */
const DEFAULT_AVATAR_URL = "https://readyplayerme.github.io/visage/male.glb";

interface ReadyPlayerMeAvatarProps {
  /** Ref to the currently playing Audio (from useSpeechSynthesis). */
  speakingAudioRef?: SpeakingAudioRef;
  /** Whether TTS is playing. */
  isSpeaking: boolean;
  /** Whether user is listening (mic active). */
  isListening?: boolean;
  /** Custom avatar GLB URL. */
  avatarUrl?: string;
  /** Compact layout (smaller). */
  compact?: boolean;
  /** Scenario/patient display name. */
  displayName?: string;
}

export default function ReadyPlayerMeAvatar({
  speakingAudioRef,
  isSpeaking,
  isListening = false,
  avatarUrl,
  compact = false,
  displayName = "Patient",
}: ReadyPlayerMeAvatarProps) {
  const mouthOpen = useAudioLipSync(speakingAudioRef, isSpeaking);

  const modelSrc = avatarUrl || DEFAULT_AVATAR_URL;
  const emotion = mouthOpen > 0.05 ? { mouthOpen } : undefined;

  const status = isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready";
  const statusDot = isSpeaking ? "bg-emerald-500" : isListening ? "bg-red-500" : "bg-zinc-400";

  const containerClass = compact
    ? "w-full h-32 rounded-lg overflow-hidden"
    : "w-full h-64 rounded-2xl overflow-hidden";
  const containerStyle = { background: "var(--subtle-bg)" };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${containerClass}`} style={containerStyle}>
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 35 }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <Avatar
              modelSrc={modelSrc}
              emotion={emotion}
              halfBody
              scale={1.2}
              cameraTarget={0.5}
              cameraInitialDistance={2.5}
            />
          </Suspense>
        </Canvas>
        {isSpeaking && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none border border-emerald-500/20 animate-pulse"
            style={{ borderRadius: compact ? "0.5rem" : "1rem" }}
          />
        )}
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-primary">{displayName}</p>
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status !== "Ready" ? "animate-pulse" : ""}`}
          />
          <span className="text-xs text-secondary font-medium">{status}</span>
        </div>
      </div>
    </div>
  );
}

