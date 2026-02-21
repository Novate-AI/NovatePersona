import { useState, useEffect } from "react";

interface ConsultationTimerProps {
  durationSeconds: number;
  running: boolean;
  onTimeUp: () => void;
}

export default function ConsultationTimer({ durationSeconds, running, onTimeUp }: ConsultationTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => { setRemaining(durationSeconds); }, [durationSeconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); onTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, remaining, onTimeUp]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / durationSeconds) * 100;
  const isWarning = remaining <= 120 && remaining > 0;
  const isCritical = remaining <= 30 && remaining > 0;

  const color = isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500";
  const barColor = isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-2" data-remaining={remaining}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Time</h3>
        <span className={`text-sm font-bold tabular-nums ${color} ${isCritical ? "animate-pulse" : ""}`}>
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--subtle-bg)' }}>
        <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {remaining === 0 && <p className="text-xs font-semibold text-red-500">Time&apos;s up</p>}
    </div>
  );
}
