import type { PatientMeta } from "../../lib/scenarios";

interface PatientBriefProps {
  patient: PatientMeta;
}

export default function PatientBrief({ patient }: PatientBriefProps) {
  const rows = [
    { label: "Name", value: patient.name },
    { label: "Age", value: `${patient.age}` },
    { label: "Gender", value: patient.gender },
    { label: "Job", value: patient.occupation },
  ];

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Patient Brief</h3>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{r.label}</span>
            <span className="text-sm font-medium text-primary text-right">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Complaint</span>
        <p className="text-sm font-medium text-primary mt-0.5 leading-relaxed">&ldquo;{patient.chiefComplaint}&rdquo;</p>
      </div>
    </div>
  );
}
