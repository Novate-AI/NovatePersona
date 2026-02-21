import type { OsceEvaluation } from "../../lib/osce";
import { generateScoreReport } from "../../lib/pdfReport";

interface FeedbackCardProps {
  evaluation: OsceEvaluation;
  onRetry: () => void;
  onNewScenario: () => void;
  weakAreaTip?: string;
  scenarioName?: string;
  patientName?: string;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const color = score >= 8 ? "text-emerald-500" : score >= 6 ? "text-amber-500" : score >= 4 ? "text-orange-500" : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="3" className="stroke-current text-zinc-200 dark:text-zinc-800" />
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className={`stroke-current ${color} transition-all duration-1000`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${color} tabular-nums`}>{score}/10</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-secondary text-center leading-tight">{label}</span>
    </div>
  );
}

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const styles: Record<string, string> = {
    Distinction: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Pass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Borderline: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Fail: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 ${styles[grade] || styles.Fail}`}>
      <span className="text-xl font-bold tabular-nums">{score}/40</span>
      <span className="text-xs font-bold uppercase tracking-wider">{grade}</span>
    </div>
  );
}

export default function FeedbackCard({ evaluation, onRetry, onNewScenario, weakAreaTip, scenarioName, patientName }: FeedbackCardProps) {
  const e = evaluation;

  const weakDomain = [
    { label: 'History Taking', score: e.history_taking.score },
    { label: 'Communication', score: e.communication.score },
    { label: 'Clinical Reasoning', score: e.clinical_reasoning.score },
    { label: 'Patient-Centred Care', score: e.patient_centered.score },
  ].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-bold text-primary">Consultation Feedback</h2>
        <GradeBadge grade={e.grade} score={e.overall_score} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 glass-card p-5!">
        <ScoreRing score={e.history_taking.score} label="History" />
        <ScoreRing score={e.communication.score} label="Communication" />
        <ScoreRing score={e.clinical_reasoning.score} label="Reasoning" />
        <ScoreRing score={e.patient_centered.score} label="Patient-Centred" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { label: "History Taking", data: e.history_taking },
          { label: "Communication", data: e.communication },
          { label: "Clinical Reasoning", data: e.clinical_reasoning },
          { label: "Patient-Centred Care", data: e.patient_centered },
        ].map((item) => (
          <div key={item.label} className="glass-card p-4!">
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-1.5">{item.label}</h4>
            <p className="text-sm text-primary leading-relaxed">{item.data.feedback}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-4!">
        <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Summary</h4>
        <p className="text-sm text-primary leading-relaxed">{e.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {e.strengths.length > 0 && (
          <div className="glass-card p-4!">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">Strengths</h4>
            <ul className="space-y-1.5">
              {e.strengths.map((s, i) => (
                <li key={i} className="text-sm text-primary flex gap-2">
                  <span className="text-emerald-500 shrink-0">+</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {e.missed_areas.length > 0 && (
          <div className="glass-card p-4!">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Areas to Improve</h4>
            <ul className="space-y-1.5">
              {e.missed_areas.map((s, i) => (
                <li key={i} className="text-sm text-primary flex gap-2">
                  <span className="text-amber-500 shrink-0">&minus;</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Smart next-step nudge */}
      {weakDomain && weakDomain.score < 8 && (
        <div className="glass-card p-4! border-l-2 border-l-amber-500">
          <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Focus area</h4>
          <p className="text-sm text-primary">
            Your weakest domain was <strong>{weakDomain.label}</strong> ({weakDomain.score}/10).{' '}
            {weakAreaTip || 'Try another scenario to drill this skill.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 flex-wrap pb-8">
        <button onClick={onRetry} className="btn-secondary px-5 py-2.5">Retry Case</button>
        <button
          onClick={() => generateScoreReport(
            evaluation,
            scenarioName || 'OSCE Scenario',
            patientName || 'Patient',
            new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          )}
          className="btn-secondary px-5 py-2.5 inline-flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Report
        </button>
        <button onClick={onNewScenario} className="btn-primary px-5 py-2.5">New Scenario</button>
      </div>
    </div>
  );
}
