import { useState, useCallback, useEffect, useRef } from 'react'
import ProductNav from '../components/ProductNav'
import UpgradeWall from '../components/UpgradeWall'
import { useSessionGate } from '../hooks/useSessionGate'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { sendChatMessage, type PersonaMode } from '../services/chatApi'
import type { ChatMessage, IELTSPart, IELTSBandFeedback } from '../types'
import { speak as ttsSpeak } from '../lib/tts'

const PARTS: IELTSPart[] = [
  {
    part: 1,
    title: 'Part 1: Introduction & Interview',
    instruction: 'Answer briefly (1–2 sentences). Topics: work, studies, hometown, hobbies.',
    durationSeconds: 240,
  },
  {
    part: 2,
    title: 'Part 2: Long Turn',
    instruction: 'You have 1 minute to prepare and 1–2 minutes to speak. The examiner will give you a topic card.',
    durationSeconds: 180,
  },
  {
    part: 3,
    title: 'Part 3: Discussion',
    instruction: 'Discuss abstract ideas related to Part 2. Give extended, well-structured answers.',
    durationSeconds: 300,
  },
]

const PART_ICONS = ['💬', '🎤', '🧠']

async function generateAIBandFeedback(messages: ChatMessage[]): Promise<IELTSBandFeedback> {
  const conversation = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Examiner'}: ${m.content}`).join('\n')

  try {
    const res = await sendChatMessage(
      [{ id: 'eval', role: 'user', content: conversation, timestamp: Date.now() }],
      { mode: 'nova-ielts-eval' as PersonaMode, ieltsPart: 1 },
    )

    const text = res.content
    const fluencyMatch = text.match(/fluency[:\s]*(\d\.?\d?)/i)
    const vocabMatch = text.match(/vocabulary[:\s]*(\d\.?\d?)/i)
    const grammarMatch = text.match(/grammar[:\s]*(\d\.?\d?)/i)
    const pronMatch = text.match(/pronunciation[:\s]*(\d\.?\d?)/i)
    const overallMatch = text.match(/overall[:\s]*(\d\.?\d?)/i)

    return {
      fluency: fluencyMatch ? parseFloat(fluencyMatch[1]) : 6,
      vocabulary: vocabMatch ? parseFloat(vocabMatch[1]) : 6,
      grammar: grammarMatch ? parseFloat(grammarMatch[1]) : 6,
      pronunciation: pronMatch ? parseFloat(pronMatch[1]) : 6,
      overall: overallMatch ? parseFloat(overallMatch[1]) : 6,
      comments: text.replace(/[\d.]+/g, (m) => m).trim() || 'Good attempt. Keep practicing to improve your fluency and range of vocabulary.',
    }
  } catch {
    return {
      fluency: 6, vocabulary: 6, grammar: 6, pronunciation: 6, overall: 6,
      comments: 'Unable to generate detailed feedback at this time. Please try again.',
    }
  }
}

function speakText(text: string) {
  if (!text.trim()) return
  ttsSpeak(text.trim(), 'en-GB')
}

export default function NovaIELTS() {
  const { blocked, sessionsUsed, dismissWall, tryStartSession } = useSessionGate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPart, setCurrentPart] = useState<1 | 2 | 3>(1)
  const [phase, setPhase] = useState<'intro' | 'speaking' | 'feedback'>('intro')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<IELTSBandFeedback | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { transcript, supported, start, stop, isListening, setTranscript } = useSpeechRecognition({
    language: 'en-GB',
  })

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft((prev) => (prev != null && prev > 0 ? prev - 1 : prev)), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const startPart = useCallback(async (part: 1 | 2 | 3) => {
    if (!(await tryStartSession())) return
    setCurrentPart(part)
    setPhase('speaking')
    setMessages([])
    setInput('')
    const p = PARTS.find((x) => x.part === part)
    setTimeLeft(p?.durationSeconds ?? 180)
    setTranscript('')

    const greeting: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: part === 1
        ? "Good morning. My name is Sarah, and I'll be your examiner today. Let's begin with some questions about yourself. Can you tell me about where you live?"
        : part === 2
        ? "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Here's your topic card. You have one minute to prepare."
        : "Let's move on to Part 3 where we'll discuss some deeper questions related to the topic. Are you ready?",
      timestamp: Date.now(),
    }
    setMessages([greeting])
  }, [setTranscript, tryStartSession])

  const finishPart = useCallback(async () => {
    setTimeLeft(null)
    stop()

    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length > 0) {
      setEvaluating(true)
      const aiFeedback = await generateAIBandFeedback(messages)
      setFeedback(aiFeedback)
      setEvaluating(false)
    } else {
      setFeedback({
        fluency: 0, vocabulary: 0, grammar: 0, pronunciation: 0, overall: 0,
        comments: 'You didn\'t respond to any questions. Start the part again and answer the examiner to get scored.',
      })
    }
    setPhase('feedback')
  }, [stop, messages])

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim()) return
      setInput('')
      setTranscript('')
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)
      try {
        const res = await sendChatMessage([...messages, userMsg], {
          mode: 'nova-ielts' as PersonaMode,
          ieltsPart: currentPart,
        })
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.content,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } finally {
        setLoading(false)
      }
    },
    [messages, currentPart, setTranscript],
  )

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const partInfo = PARTS.find((p) => p.part === currentPart)
  const turns = messages.filter(m => m.role === 'user').length
  const timePct = timeLeft != null && partInfo?.durationSeconds ? (timeLeft / partInfo.durationSeconds) * 100 : 100
  const isCritical = timeLeft != null && timeLeft < 30

  /* ─── INTRO: Part selection ─── */
  if (phase === 'intro') {
    return (
      <div className="h-screen flex flex-col">
        {blocked && <UpgradeWall onClose={dismissWall} sessionsUsed={sessionsUsed} />}
        {/* Top bar */}
        <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
          <div className="flex items-center gap-3">
            <ProductNav current="Nova IELTS" />
            <span className="badge bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 inline-block animate-pulse" />
              Speaking Mock
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-16 px-5">
            <div className="text-center mb-12">
              <p className="text-sm text-secondary italic mb-4">&ldquo;Your IELTS speaking test is in 2 weeks.&rdquo;</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Practise until you&apos;re <span className="gradient-text">exam-ready.</span>
              </h1>
              <p className="text-secondary text-base max-w-md mx-auto">
                3-part mock exams scored on the same criteria your real examiner uses. Fluency, vocabulary, grammar, pronunciation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PARTS.map((p, i) => (
                <button
                  key={p.part}
                  onClick={() => startPart(p.part)}
                  className="glass-card group flex flex-col items-start p-5 text-left transition-all hover:border-(--card-hover-border) active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{PART_ICONS[i]}</span>
                    <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
                      {Math.floor((p.durationSeconds ?? 180) / 60)} min
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-primary mb-1.5">{p.title}</h3>
                  <p className="text-xs text-secondary leading-relaxed flex-1">{p.instruction}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 group-hover:gap-2.5 transition-all">
                    Start
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-12 glass-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">How it works</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { n: '1', t: 'Pick a part', d: 'Choose which section of the speaking test to practise.' },
                  { n: '2', t: 'Speak naturally', d: 'Type or use your mic. The examiner responds in real time.' },
                  { n: '3', t: 'Get your band', d: 'Receive scores for fluency, vocabulary, grammar and pronunciation.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-xs font-bold text-violet-500">{s.n}</span>
                    <div>
                      <p className="text-sm font-semibold text-primary">{s.t}</p>
                      <p className="text-xs text-secondary mt-0.5">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── FEEDBACK: Evaluation report ─── */
  if (phase === 'feedback') {
    if (evaluating) {
      return (
        <div className="h-screen flex flex-col">
          <div className="shrink-0 border-b flex items-center h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
            <ProductNav current="Nova IELTS" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-600" />
              <p className="text-base font-medium text-secondary animate-pulse">Scoring your performance&hellip;</p>
            </div>
          </div>
        </div>
      )
    }

    if (!feedback) return null

    const CRITERIA = [
      { label: 'Fluency & Coherence', score: feedback.fluency },
      { label: 'Lexical Resource', score: feedback.vocabulary },
      { label: 'Grammar Range', score: feedback.grammar },
      { label: 'Pronunciation', score: feedback.pronunciation },
    ]

    const bandColor = feedback.overall >= 7 ? 'text-emerald-500' : feedback.overall >= 5.5 ? 'text-amber-500' : 'text-red-500'

    return (
      <div className="h-screen flex flex-col">
        <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
          <div className="flex items-center gap-3">
            <ProductNav current="Nova IELTS" />
            <span className="badge bg-violet-500/10 text-violet-500">Part {currentPart} Report</span>
          </div>
          <span className="text-xs text-secondary">IELTS Official Scoring Criteria</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-10 px-5 space-y-8">
            {/* Overall band */}
            <div className="text-center space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Overall Band Score</p>
              <p className={`text-6xl font-bold tabular-nums ${bandColor}`}>{feedback.overall}</p>
              <p className="text-sm text-secondary">
                {feedback.overall >= 7 ? 'Strong performance — keep refining edge cases.' : feedback.overall >= 5.5 ? 'Solid foundation — focus on range and fluency.' : 'Keep practising — consistency will come with reps.'}
              </p>
            </div>

            {/* Criteria breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {CRITERIA.map(c => {
                const pct = (c.score / 9) * 100
                const color = c.score >= 7 ? 'bg-emerald-500' : c.score >= 5.5 ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={c.label} className="glass-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-secondary">{c.label}</span>
                      <span className="text-sm font-bold text-primary tabular-nums">{c.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--subtle-bg)' }}>
                      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comments */}
            <div className="glass-card p-5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-secondary">Examiner Comments</h4>
              <p className="text-sm text-primary leading-relaxed italic">&ldquo;{feedback.comments}&rdquo;</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setPhase('intro'); setFeedback(null) }}
                className="btn-primary flex-1 py-3"
              >
                Try Another Part
              </button>
              <button
                onClick={() => startPart(currentPart)}
                className="btn-secondary flex-1 py-3"
              >
                Retry Part {currentPart}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── SPEAKING: Live exam session ─── */
  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
        <div className="flex items-center gap-3">
          <ProductNav current="Nova IELTS" />
          <div className="hidden sm:block h-4 w-px bg-(--card-border)" />
          <span className="hidden sm:inline text-xs text-secondary">{partInfo?.title}</span>
        </div>

        <div className="flex items-center gap-4">
          {turns > 0 && (
            <span className="hidden sm:inline text-xs text-secondary">
              <strong className="text-primary tabular-nums">{turns}</strong> responses
            </span>
          )}

          {/* Timer */}
          {timeLeft != null && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--subtle-bg)' }}>
                <div className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-violet-500'}`} style={{ width: `${timePct}%` }} />
              </div>
              <span className={`text-sm font-bold tabular-nums ${isCritical ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          <button
            onClick={finishPart}
            className="h-8 rounded-md border border-red-500/20 bg-red-500/5 px-3.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all"
          >
            End Exam
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar — guidelines (desktop) */}
        <div className="hidden lg:flex w-72 shrink-0 border-r overflow-y-auto p-5 flex-col gap-5" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Exam Tips</h3>
            <ul className="space-y-3">
              {[
                'Speak at a natural pace — don\'t rush.',
                'Extend answers with reasons and examples.',
                'Use a range of vocabulary and grammar.',
                'Self-correct if you notice a mistake.',
                'Don\'t memorise scripted answers.',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-secondary leading-relaxed">
                  <span className="text-violet-500 shrink-0 mt-0.5">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Part Info</h3>
            <p className="text-xs text-secondary leading-relaxed">{partInfo?.instruction}</p>
          </div>

          <div className="border-t pt-4 space-y-2 mt-auto" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Band Criteria</h3>
            {['Fluency & Coherence', 'Lexical Resource', 'Grammar Range', 'Pronunciation'].map(c => (
              <div key={c} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span className="text-xs text-secondary">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-xs font-bold text-violet-500 mt-0.5">E</div>
                )}
                <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-none'
                    : 'rounded-tl-none'
                }`} style={m.role === 'assistant' ? { background: 'var(--subtle-bg)' } : undefined}>
                  <p className={m.role === 'user' ? '' : 'text-primary'}>{m.content}</p>
                </div>
                {m.role === 'assistant' && (
                  <button onClick={() => speakText(m.content)} className="btn-ghost h-8 w-8 p-0 shrink-0 mt-0.5" title="Listen">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2l4-4v14l-4-4z" /></svg>
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-xs font-bold text-violet-500 mt-0.5">E</div>
                <div className="rounded-xl rounded-tl-none px-4 py-3 text-sm" style={{ background: 'var(--subtle-bg)' }}>
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t p-3 sm:p-4 flex items-end gap-2 sm:gap-3 safe-bottom" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
            {supported && (
              <button
                onClick={() => isListening ? stop() : start()}
                className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'btn-ghost'}`}
                title={isListening ? 'Stop recording' : 'Start recording'}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 0V3m0 8v0m-4 4h8m-4 0v4" />
                </svg>
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Respond to the examiner..."
              rows={1}
              className="flex-1 min-h-[40px] max-h-28 resize-none rounded-lg border px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-white transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 0 20px -8px rgba(139, 92, 246, 0.4)' }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
