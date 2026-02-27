import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scenarios } from "../lib/scenarios";
import { getProgress, getStreak, isOnboarded, type ScenarioResult, type UserStreak } from "../lib/progress";
import { getRecommendations } from "../lib/recommendations";
import { useSessionGate } from "../hooks/useSessionGate";
import OnboardingModal from "../components/novapatient/OnboardingModal";
import PatientAvatar from "../components/novapatient/PatientAvatar";
import ProductNav from "../components/ProductNav";
import UpgradeWall from "../components/UpgradeWall";

const DIFF_STYLE: Record<string, { color: string; dot: string }> = {
  Beginner: { color: "text-emerald-500", dot: "bg-emerald-500" },
  Intermediate: { color: "text-amber-500", dot: "bg-amber-500" },
  Advanced: { color: "text-red-500", dot: "bg-red-500" },
};

const GRADE_STYLE: Record<string, string> = {
  Distinction: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Borderline: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Fail: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function NovaPatientScenarios() {
  const { blocked, sessionsUsed, remaining, dismissWall, tryStartSession } = useSessionGate();
  const [selected, setSelected] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScenarioResult[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ currentStreak: 0, longestStreak: 0, lastPracticeDate: null, totalSessions: 0 });
  const [recs, setRecs] = useState<ReturnType<typeof getRecommendations>>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getProgress('nova-patient').then(p => {
      setProgress(p);
      setRecs(getRecommendations(p));
    });
    getStreak().then(setStreak);
    if (!isOnboarded()) setShowOnboarding(true);
  }, []);

  const completedCount = progress.length;

  return (
    <div className="h-screen flex flex-col">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      {blocked && <UpgradeWall onClose={dismissWall} sessionsUsed={sessionsUsed} />}

      {/* Top bar */}
      <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
        <div className="flex items-center gap-3">
          <ProductNav current="NovaPatient" />
          <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            OSCE Station
          </span>
        </div>
      </div>

      {/* Fixed Begin bar at bottom of screen when a card is selected — no scroll needed */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t flex items-center justify-center py-3 px-4 safe-bottom" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
          <button
            onClick={async () => { if (!(await tryStartSession())) return; navigate(`/nova-patient/chat?scenario=${selected}`); }}
            className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Begin Station
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${selected ? 'pb-20' : ''}`}>
      <div className="max-w-5xl mx-auto py-8 px-5 animate-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">NovaPatient</h1>
          <p className="mt-2 text-secondary text-sm sm:text-base max-w-lg">
            Timed history-taking under exam conditions. Scored on the same 4 domains your OSCE examiner uses.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 shrink-0 overflow-x-auto">
          {streak.currentStreak > 0 && (
            <div className="glass-card py-2! px-3! sm:px-4! text-center shrink-0">
              <span className="text-base sm:text-lg font-bold text-amber-500 tabular-nums">{streak.currentStreak}🔥</span>
              <p className="text-[10px] sm:text-xs text-secondary uppercase tracking-wider font-semibold">Streak</p>
            </div>
          )}
          <div className="glass-card py-2! px-3! sm:px-4! text-center shrink-0">
            <span className="text-base sm:text-lg font-bold text-primary tabular-nums">{completedCount}/{scenarios.length}</span>
            <p className="text-[10px] sm:text-xs text-secondary uppercase tracking-wider font-semibold">Done</p>
          </div>
          <div className="glass-card py-2! px-3! sm:px-4! text-center shrink-0">
            <span className="text-base sm:text-lg font-bold text-primary tabular-nums">{streak.totalSessions}</span>
            <p className="text-[10px] sm:text-xs text-secondary uppercase tracking-wider font-semibold">Sessions</p>
          </div>
          {remaining !== Infinity && (
            <div className={`glass-card py-2! px-3! sm:px-4! text-center shrink-0 ${remaining === 0 ? 'border-red-500/30! bg-red-500/5!' : ''}`}>
              <span className={`text-base sm:text-lg font-bold tabular-nums ${remaining === 0 ? 'text-red-500' : 'text-brand-500'}`}>{remaining}/3</span>
              <p className="text-[10px] sm:text-xs text-secondary uppercase tracking-wider font-semibold">Today</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Recommended for you</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            {recs.map(r => {
              const scenario = scenarios.find(s => s.code === r.scenarioCode);
              if (!scenario) return null;
              return (
                <button
                  key={r.scenarioCode}
                  onClick={async () => { if (!(await tryStartSession())) return; setSelected(r.scenarioCode); navigate(`/nova-patient/chat?scenario=${r.scenarioCode}`); }}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all hover:border-(--card-hover-border) flex-1 min-w-0 ${
                    r.priority === 'high' ? 'border-amber-500/30 bg-amber-500/5' : ''
                  }`}
                  style={r.priority !== 'high' ? { borderColor: 'var(--card-border)', background: 'var(--card-bg)' } : undefined}
                >
                  <PatientAvatar gender={scenario.patient.gender} size={32} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary truncate">{scenario.name}</p>
                    <p className="text-xs text-secondary truncate">{r.reason}</p>
                  </div>
                  <svg className="h-4 w-4 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {scenarios.map((s) => {
          const diff = DIFF_STYLE[s.patient.difficulty] || DIFF_STYLE.Beginner;
          const best = progress.find((p) => p.scenarioCode === s.code);
          const gradeStyle = best ? (GRADE_STYLE[best.grade] || GRADE_STYLE.Fail) : "";
          const isSelected = selected === s.code;

          return (
            <button
              key={s.code}
              onClick={() => setSelected(s.code)}
              className={`glass-card text-left cursor-pointer transition-all duration-150 p-4! ${
                isSelected
                  ? "ring-2 ring-emerald-500/40 border-emerald-500/30!"
                  : "hover:border-(--card-hover-border)"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <PatientAvatar gender={s.patient.gender} size={40} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-primary truncate">{s.name}</h3>
                    {best && (
                      <span className={`badge text-xs border ${gradeStyle}`}>{best.score}/40</span>
                    )}
                  </div>
                  <p className="text-xs text-secondary truncate">
                    {s.patient.name} &middot; {s.patient.age}{s.patient.gender === "Female" ? "F" : "M"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-3">
                &ldquo;{s.patient.chiefComplaint}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                  <span className={`text-xs font-semibold ${diff.color}`}>{s.patient.difficulty}</span>
                </div>
                <span className="text-xs text-secondary font-medium">8 min</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Begin Station — right below grid so no scroll needed */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <button
          disabled={!selected}
          onClick={async () => { if (!selected) return; if (!(await tryStartSession())) return; navigate(`/nova-patient/chat?scenario=${selected}`); }}
          className="btn-primary px-8 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
          Begin Station
        </button>
        {!selected && <p className="text-xs text-secondary">Select a scenario to begin</p>}
      </div>

      {/* How it works */}
      <div className="glass-card p-5!">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">How it works</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { n: "1", t: "Select", d: "Pick a clinical case" },
            { n: "2", t: "Consult", d: "8-min timed history" },
            { n: "3", t: "Score", d: "Graded on 4 domains" },
            { n: "4", t: "Improve", d: "Review & retry" },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-500 mb-2">{s.n}</div>
              <h4 className="text-xs font-bold text-primary">{s.t}</h4>
              <p className="text-xs text-secondary mt-0.5">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
