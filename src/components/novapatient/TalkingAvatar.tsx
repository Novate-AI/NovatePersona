import PatientAvatar from "./PatientAvatar";

interface TalkingAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  scenarioName: string;
  patientGender?: "Male" | "Female";
  patientName?: string;
  compact?: boolean;
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
}: TalkingAvatarProps) {
  const status = isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready";
  const statusDot = isSpeaking ? "bg-emerald-500" : isListening ? "bg-red-500" : "bg-zinc-400";
  const displayName = patientName || `${scenarioName} Patient`;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${isSpeaking ? "np-jaw-move" : "np-breathe"}`} style={{ background: 'var(--subtle-bg)' }}>
          <PatientAvatar gender={patientGender} size={48} seed={scenarioName && patientName ? `${scenarioName}-${patientName}` : undefined} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status !== "Ready" ? "animate-pulse" : ""}`} />
            <span className="text-xs text-secondary font-medium">{status}</span>
            {isSpeaking && <EqBars />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center ${isSpeaking ? "np-jaw-move" : "np-breathe"}`} style={{ background: 'var(--subtle-bg)' }}>
        <PatientAvatar gender={patientGender} size={112} seed={scenarioName && patientName ? `${scenarioName}-${patientName}` : undefined} />
        {isSpeaking && (
          <div className="absolute -inset-0.5 rounded-2xl np-glow-pulse border border-emerald-500/20 pointer-events-none" />
        )}
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-primary">{displayName}</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot} ${status !== "Ready" ? "animate-pulse" : ""}`} />
          <span className="text-xs text-secondary font-medium">{status}</span>
          {isSpeaking && <EqBars />}
        </div>
      </div>
    </div>
  );
}
