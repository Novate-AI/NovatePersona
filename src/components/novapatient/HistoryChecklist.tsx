import type { ChecklistCategory } from "../../lib/osce";

interface HistoryChecklistProps {
  checklist: ChecklistCategory[];
  compact?: boolean;
}

export default function HistoryChecklist({ checklist, compact }: HistoryChecklistProps) {
  const covered = checklist.filter((c) => c.covered).length;
  const total = checklist.length;
  const pct = Math.round((covered / total) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: 'var(--subtle-bg)' }}>
        <div className="flex gap-[2px]">
          {checklist.map((c) => (
            <div key={c.id} title={c.label} className={`w-[4px] h-3 rounded-sm transition-colors ${c.covered ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
          ))}
        </div>
        <span className="text-xs font-semibold text-secondary tabular-nums">{pct}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Checklist</h3>
        <span className={`text-xs font-bold tabular-nums ${pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-secondary"}`}>
          {covered}/{total}
        </span>
      </div>

      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--subtle-bg)' }}>
        <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-zinc-400"}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-0.5">
        {checklist.map((c) => (
          <div key={c.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all ${c.covered ? "text-emerald-600 dark:text-emerald-400" : "text-secondary"}`}>
            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${c.covered ? "bg-emerald-500 text-white" : ""}`} style={!c.covered ? { border: '1px solid var(--card-border)' } : undefined}>
              {c.covered && <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </div>
            <span className={c.covered ? "font-medium" : ""}>{c.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
