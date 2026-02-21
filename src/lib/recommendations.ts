import { scenarios } from './scenarios'
import type { ScenarioResult } from './progress'

interface Recommendation {
  scenarioCode: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

const DOMAIN_SCENARIO_MAP: Record<string, string[]> = {
  history_taking: ['chest_pain', 'abdominal_pain', 'headache'],
  communication: ['fatigue', 'joint_pain', 'shortness_of_breath'],
  clinical_reasoning: ['chest_pain', 'shortness_of_breath', 'abdominal_pain'],
  patient_centered: ['fatigue', 'headache', 'joint_pain'],
}

export function getRecommendations(progress: ScenarioResult[]): Recommendation[] {
  const recommendations: Recommendation[] = []
  const allCodes = scenarios.map(s => s.code)
  const completedCodes = new Set(progress.map(p => p.scenarioCode))

  // 1. Not yet attempted scenarios
  const unattempted = allCodes.filter(c => !completedCodes.has(c))
  if (unattempted.length > 0) {
    const beginner = scenarios.filter(s => unattempted.includes(s.code) && s.patient.difficulty === 'Beginner')
    const target = beginner.length > 0 ? beginner[0] : scenarios.find(s => unattempted.includes(s.code))
    if (target) {
      recommendations.push({
        scenarioCode: target.code,
        reason: `You haven't tried "${target.name}" yet`,
        priority: 'medium',
      })
    }
  }

  // 2. Failed or borderline scenarios — retry them
  const weak = progress
    .filter(p => p.grade === 'Fail' || p.grade === 'Borderline')
    .sort((a, b) => a.score - b.score)

  for (const w of weak.slice(0, 2)) {
    const scenario = scenarios.find(s => s.code === w.scenarioCode)
    if (scenario) {
      recommendations.push({
        scenarioCode: w.scenarioCode,
        reason: `You scored ${w.score}/40 on "${scenario.name}" — retry to improve`,
        priority: 'high',
      })
    }
  }

  // 3. Weak domain analysis from metadata
  const domainScores: Record<string, number[]> = {
    history_taking: [],
    communication: [],
    clinical_reasoning: [],
    patient_centered: [],
  }

  for (const p of progress) {
    const meta = p.metadata as Record<string, unknown> | undefined
    if (!meta) continue
    for (const domain of Object.keys(domainScores)) {
      const val = meta[domain]
      if (typeof val === 'number') {
        domainScores[domain].push(val)
      }
    }
  }

  const weakDomains = Object.entries(domainScores)
    .map(([domain, scores]) => ({
      domain,
      avg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : -1,
    }))
    .filter(d => d.avg >= 0 && d.avg < 6)
    .sort((a, b) => a.avg - b.avg)

  for (const wd of weakDomains.slice(0, 1)) {
    const domainLabel = wd.domain.replace(/_/g, ' ')
    const targetCodes = DOMAIN_SCENARIO_MAP[wd.domain] || []
    const targetCode = targetCodes.find(c => {
      const existing = progress.find(p => p.scenarioCode === c)
      return !existing || existing.score < 30
    })

    if (targetCode) {
      const scenario = scenarios.find(s => s.code === targetCode)
      if (scenario && !recommendations.some(r => r.scenarioCode === targetCode)) {
        recommendations.push({
          scenarioCode: targetCode,
          reason: `Your ${domainLabel} average is ${wd.avg.toFixed(1)}/10 — "${scenario.name}" drills this`,
          priority: 'high',
        })
      }
    }
  }

  // Deduplicate by scenario code, keep highest priority
  const seen = new Set<string>()
  const unique: Recommendation[] = []
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  for (const r of recommendations) {
    if (!seen.has(r.scenarioCode)) {
      seen.add(r.scenarioCode)
      unique.push(r)
    }
  }

  return unique.slice(0, 3)
}
