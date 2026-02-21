import type { OsceEvaluation } from './osce'

function scoreBarHtml(label: string, score: number): string {
  const pct = (score / 10) * 100
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : score >= 4 ? '#f97316' : '#ef4444'
  return `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-weight:600;font-size:13px">${label}</span>
        <span style="font-weight:700;font-size:13px">${score}/10</span>
      </div>
      <div style="background:#e5e7eb;border-radius:6px;height:10px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:6px;transition:width .3s"></div>
      </div>
    </div>`
}

function listHtml(items: string[], symbol: string, color: string): string {
  if (!items.length) return ''
  return items
    .map(s => `<li style="margin-bottom:6px;font-size:13px;line-height:1.5"><span style="color:${color};font-weight:700;margin-right:6px">${symbol}</span>${s}</li>`)
    .join('')
}

export function generateScoreReport(
  evaluation: OsceEvaluation,
  scenarioName: string,
  patientName: string,
  date: string
): void {
  const e = evaluation
  const gradeColor = e.grade === 'Distinction' ? '#10b981' : e.grade === 'Pass' ? '#3b82f6' : e.grade === 'Borderline' ? '#f59e0b' : '#ef4444'

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>OSCE Score Report – ${scenarioName}</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
  h2 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
  .meta { display: flex; gap: 24px; margin-top: 8px; font-size: 13px; color: #6b7280; }
  .grade-box { display: inline-flex; align-items: center; gap: 10px; border: 2px solid ${gradeColor}; border-radius: 8px; padding: 8px 16px; margin-top: 12px; }
  .grade-score { font-size: 24px; font-weight: 800; }
  .grade-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${gradeColor}; }
  .section { margin-bottom: 24px; }
  .domains { margin-bottom: 24px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .feedback-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
  .feedback-card h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
  .feedback-card p { font-size: 13px; line-height: 1.6; }
  ul { list-style: none; padding: 0; }
  .summary { font-size: 14px; line-height: 1.7; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  .print-btn { display: block; margin: 0 auto 32px; padding: 10px 32px; font-size: 14px; font-weight: 600; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  .print-btn:hover { background: #333; }
</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <h1>OSCE Score Report</h1>
    <div class="meta">
      <span><strong>Scenario:</strong> ${scenarioName}</span>
      <span><strong>Patient:</strong> ${patientName}</span>
      <span><strong>Date:</strong> ${date}</span>
    </div>
    <div class="grade-box">
      <span class="grade-score">${e.overall_score}/40</span>
      <span class="grade-label">${e.grade}</span>
    </div>
  </div>

  <div class="section domains">
    <h2>Domain Scores</h2>
    ${scoreBarHtml('History Taking', e.history_taking.score)}
    ${scoreBarHtml('Communication', e.communication.score)}
    ${scoreBarHtml('Clinical Reasoning', e.clinical_reasoning.score)}
    ${scoreBarHtml('Patient-Centred Care', e.patient_centered.score)}
  </div>

  <div class="section">
    <h2>Domain Feedback</h2>
    <div class="two-col">
      <div class="feedback-card"><h3>History Taking</h3><p>${e.history_taking.feedback}</p></div>
      <div class="feedback-card"><h3>Communication</h3><p>${e.communication.feedback}</p></div>
      <div class="feedback-card"><h3>Clinical Reasoning</h3><p>${e.clinical_reasoning.feedback}</p></div>
      <div class="feedback-card"><h3>Patient-Centred Care</h3><p>${e.patient_centered.feedback}</p></div>
    </div>
  </div>

  ${e.strengths.length > 0 || e.missed_areas.length > 0 ? `
  <div class="section">
    <div class="two-col">
      ${e.strengths.length > 0 ? `
      <div>
        <h2>Strengths</h2>
        <ul>${listHtml(e.strengths, '+', '#10b981')}</ul>
      </div>` : ''}
      ${e.missed_areas.length > 0 ? `
      <div>
        <h2>Areas to Improve</h2>
        <ul>${listHtml(e.missed_areas, '−', '#f59e0b')}</ul>
      </div>` : ''}
    </div>
  </div>` : ''}

  <div class="section">
    <h2>Summary</h2>
    <p class="summary">${e.summary}</p>
  </div>

  <div class="footer">
    Generated by NovatePersona &middot; novatepersona.com
  </div>

  <script>
    window.onafterprint = function() { /* keep window open for re-print */ };
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
