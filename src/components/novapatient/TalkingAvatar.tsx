import { useRef, useEffect, useState } from "react";
import PatientAvatar from "./PatientAvatar";

interface TalkingAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  scenarioName: string;
  patientGender?: "Male" | "Female";
  patientName?: string;
  compact?: boolean;
  videoUrl?: string | null;
  isGeneratingVideo?: boolean;
  onVideoEnd?: () => void;
}

function EqBars() {
  return (
    <div className="flex items-end gap-[3px] h-3.5 justify-center">
      {[0, 120, 60, 180, 40].map((delay, i) => (
        <span key={i} className="w-[3px] rounded-full bg-emerald-500 np-eq-bar" style={{ animationDelay: `${delay}ms`, height: "20%" }} />
      ))}
    </div>
  );
}

export default function TalkingAvatar({
  isSpeaking, isListening, scenarioName,
  patientGender = "Male", patientName, compact,
  videoUrl, isGeneratingVideo, onVideoEnd,
}: TalkingAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.play().catch(() => onVideoEnd?.());
    }
  }, [videoUrl, onVideoEnd]);

  const showCssAnimation = isSpeaking && !isVideoPlaying && !videoUrl;

  const status = isGeneratingVideo ? "Generating" : isVideoPlaying || isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready";
  const statusDot = isGeneratingVideo ? "bg-amber-500" : isVideoPlaying || isSpeaking ? "bg-emerald-500" : isListening ? "bg-red-500" : "bg-zinc-400";
  const displayName = patientName || `${scenarioName} Patient`;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${showCssAnimation ? "np-jaw-move" : "np-breathe"}`} style={{ background: 'var(--subtle-bg)' }}>
          <PatientAvatar gender={patientGender} size={48} className={isVideoPlaying ? "hidden" : ""} />
          <video ref={videoRef} className={`w-full h-full object-cover absolute inset-0 ${isVideoPlaying ? "" : "hidden"}`} playsInline
            onPlay={() => setIsVideoPlaying(true)} onEnded={() => { setIsVideoPlaying(false); onVideoEnd?.(); }} onError={() => { setIsVideoPlaying(false); onVideoEnd?.(); }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status !== "Ready" ? "animate-pulse" : ""}`} />
            <span className="text-xs text-secondary font-medium">{status}</span>
            {(isVideoPlaying || showCssAnimation) && <EqBars />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center ${showCssAnimation ? "np-jaw-move" : "np-breathe"}`} style={{ background: 'var(--subtle-bg)' }}>
        <PatientAvatar gender={patientGender} size={112} className={isVideoPlaying ? "hidden" : ""} />
        <video ref={videoRef} className={`w-full h-full object-cover absolute inset-0 ${isVideoPlaying ? "" : "hidden"}`} playsInline
          onPlay={() => setIsVideoPlaying(true)} onEnded={() => { setIsVideoPlaying(false); onVideoEnd?.(); }} onError={() => { setIsVideoPlaying(false); onVideoEnd?.(); }} />
        {isGeneratingVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
            <svg className="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
        )}
        {(showCssAnimation || isVideoPlaying) && (
          <div className="absolute -inset-0.5 rounded-2xl np-glow-pulse border border-emerald-500/20 pointer-events-none" />
        )}
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-primary">{displayName}</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status !== "Ready" ? "animate-pulse" : ""}`} />
          <span className="text-xs text-secondary font-medium">{status}</span>
          {(isVideoPlaying || showCssAnimation) && <EqBars />}
        </div>
      </div>
    </div>
  );
}
