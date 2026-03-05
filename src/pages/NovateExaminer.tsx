import { useState, useCallback, useEffect, useRef } from 'react'
import ProductNav from '../components/ProductNav'
import UpgradeWall from '../components/UpgradeWall'
import { useSessionGate } from '../hooks/useSessionGate'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { getSpeakableText } from '../lib/chatHelpers'
import { pickPart1Questions, pickPart2Question, pickPart3Questions } from '../lib/ieltsQuestions'
import type { IELTSPart2Question } from '../lib/ieltsQuestions'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/api\/chat\/?$/, '')
const CHAT_URL = `${BACKEND_URL}/api/chat/ielts/stream`
const FEEDBACK_URL = `${BACKEND_URL}/api/ielts-feedback`

type Msg = { role: 'user' | 'assistant'; content: string }

type Phase =
  | 'intro'
  | 'ask-name'
  | 'ask-origin'
  | 'id-check'
  | 'id-thanks'
  | 'part1'
  | 'part2-intro'
  | 'part2-prep'
  | 'part2-speak'
  | 'part3-intro'
  | 'part3'
  | 'conclusion'

export default function NovateExaminer() {
  const { blocked, sessionsUsed, dismissWall, tryStartSession } = useSessionGate()

  const [messages, setMessages] = useState<Msg[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [testFinished, setTestFinished] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Phase
  const phaseRef = useRef<Phase>('intro')
  const [phaseDisplay, setPhaseDisplay] = useState<Phase>('intro')
  const questionIndexRef = useRef(0)

  // Test data — picked once per test
  const part1DataRef = useRef(pickPart1Questions())
  const part2DataRef = useRef<IELTSPart2Question>(pickPart2Question())
  const part3QuestionsRef = useRef<string[]>([])

  // Timers
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerLabel, setTimerLabel] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const testStartTimeRef = useRef<number | null>(null)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pending transcript accumulated during response windows
  const pendingTranscriptRef = useRef('')
  const inTimedWindowRef = useRef(false)

  // TTS
  const { isSpeaking, speak, speakQueued, stop: stopSpeaking, unlockAudio } = useSpeechSynthesis('en-GB')
  const spokenUpToRef = useRef(0)
  const isSpeakingRef = useRef(false)
  const isLoadingRef = useRef(false)
  useEffect(() => { isSpeakingRef.current = isSpeaking }, [isSpeaking])
  useEffect(() => { isLoadingRef.current = isLoading }, [isLoading])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserResponseRef = useRef<(input: string) => void>(null as any)

  const onVoiceResult = useCallback((transcript: string) => {
    if (inTimedWindowRef.current) {
      pendingTranscriptRef.current += (pendingTranscriptRef.current ? ' ' : '') + transcript
    } else {
      handleUserResponseRef.current?.(transcript)
    }
  }, [])

  const { isListening, isSupported: micSupported, start: startListening, stop: stopListening } =
    useSpeechRecognition({ lang: 'en-US', onResult: onVoiceResult })

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (totalTimerRef.current) clearInterval(totalTimerRef.current)
    }
  }, [])

  // Sentence chunking: advance by exact consumed length so delimiter (space/newline) doesn't cause skip or repeat
  const checkAndQueueSentences = useCallback((fullText: string) => {
    const speakable = getSpeakableText(fullText)
    const remaining = speakable.slice(spokenUpToRef.current)
    const parts = remaining.split(/(?<=[.!?])\s+/)
    if (parts.length <= 1) return
    let consumedLength = 0
    for (let i = 0; i < parts.length - 1; i++) {
      const sentence = parts[i].trim()
      if (sentence) speakQueued(sentence)
      const nextPartStart = remaining.indexOf(parts[i + 1], consumedLength)
      if (nextPartStart >= 0) {
        consumedLength = nextPartStart
      } else {
        consumedLength += parts[i].length + 1
      }
    }
    spokenUpToRef.current += consumedLength
  }, [speakQueued])

  const flushRemainingSpeech = useCallback((fullText: string) => {
    const speakable = getSpeakableText(fullText)
    const remaining = speakable.slice(spokenUpToRef.current).trim()
    if (remaining) {
      speakQueued(remaining)
      spokenUpToRef.current = speakable.length
    }
  }, [speakQueued])

  const setPhase = (p: Phase) => {
    phaseRef.current = p
    setPhaseDisplay(p)
  }

  const startTotalTimer = () => {
    if (testStartTimeRef.current) return
    testStartTimeRef.current = Date.now()
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed(Math.floor((Date.now() - testStartTimeRef.current!) / 1000))
    }, 1000)
  }

  const startCountdown = (seconds: number, label: string, onComplete: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(seconds)
    setTimerLabel(label)
    let remaining = seconds
    timerRef.current = setInterval(() => {
      remaining--
      setTimerSeconds(remaining)
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        setTimerLabel('')
        onComplete()
      }
    }, 1000)
  }

  const stopAllTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setTimerLabel('')
    setTimerSeconds(0)
  }

  const processStream = useCallback(async (body: ReadableStream<Uint8Array>, assistantSoFar: string): Promise<string> => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let textBuffer = ''
    let streamDone = false

    while (!streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      textBuffer += decoder.decode(value, { stream: true })

      let newlineIndex: number
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex)
        textBuffer = textBuffer.slice(newlineIndex + 1)
        if (line.endsWith('\r')) line = line.slice(0, -1)
        if (line.startsWith(':') || line.trim() === '') continue
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6).trim()
        if (jsonStr === '[DONE]') { streamDone = true; break }
        try {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content as string | undefined
          if (content) {
            assistantSoFar += content
            const snapshot = assistantSoFar
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m)
              }
              return [...prev, { role: 'assistant', content: snapshot }]
            })
            checkAndQueueSentences(snapshot)
          }
        } catch {
          textBuffer = line + '\n' + textBuffer
          break
        }
      }
    }
    return assistantSoFar
  }, [checkAndQueueSentences])

  // Send a scripted instruction to the AI examiner
  const sendExaminerMessage = useCallback(async (instruction: string) => {
    setIsLoading(true)
    stopSpeaking()
    spokenUpToRef.current = 0
    let assistantSoFar = ''

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, instruction }),
      })
      if (resp.status === 429 || resp.status === 402 || !resp.ok || !resp.body) {
        console.error('Examiner request failed', resp.status)
        setIsLoading(false)
        return
      }
      assistantSoFar = await processStream(resp.body, assistantSoFar)
      flushRemainingSpeech(assistantSoFar)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [messages, stopSpeaking, processStream, flushRemainingSpeech])

  // Wait until AI finishes speaking, then run callback
  const waitForSpeechThen = (cb: () => void) => {
    const check = () => {
      setTimeout(() => {
        if (isLoadingRef.current || isSpeakingRef.current) check()
        else cb()
      }, 500)
    }
    check()
  }

  const startUserResponseWindow = (seconds: number, label = 'Time remaining') => {
    inTimedWindowRef.current = true
    pendingTranscriptRef.current = ''
    if (micSupported) startListening()

    startCountdown(seconds, label, () => {
      stopListening()
      setTimeout(() => {
        const transcript = pendingTranscriptRef.current.trim() || '(no response)'
        pendingTranscriptRef.current = ''
        inTimedWindowRef.current = false
        advanceAfterUserResponse(transcript)
      }, 100)
    })
  }

  const advanceAfterUserResponse = useCallback((userInput: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'user' && last.content === userInput) return prev
      return [...prev, { role: 'user', content: userInput }]
    })

    const phase = phaseRef.current

    switch (phase) {
      case 'intro': {
        startTotalTimer()
        setPhase('ask-name')
        sendExaminerMessage('Say exactly: Hello, my name is Tom. Can you tell me your full name please?')
        break
      }
      case 'ask-name': {
        setPhase('ask-origin')
        sendExaminerMessage('The candidate said their name. Now say: What shall I call you, and can you tell me where you are from?')
        break
      }
      case 'ask-origin': {
        setPhase('id-check')
        sendExaminerMessage('Say exactly: May I see your identification please?')
        break
      }
      case 'id-check': {
        setPhase('id-thanks')
        setTimeout(() => {
          const p1 = part1DataRef.current
          sendExaminerMessage(
            `Say exactly: Thank you, that is fine. Now, we will start with Part 1 of the IELTS speaking test. In this part of the test, I am going to ask you some questions on day-to-day topics. The topic is ${p1.topic}. Here is the first question. ${p1.questions[0]}`
          )
          setPhase('part1')
          questionIndexRef.current = 0
          waitForSpeechThen(() => startUserResponseWindow(20))
        }, 2500)
        break
      }
      case 'part1': {
        const nextIdx = questionIndexRef.current + 1
        if (nextIdx >= 12) {
          setPhase('part2-intro')
          const p2 = part2DataRef.current
          part3QuestionsRef.current = pickPart3Questions(p2.topic)
          sendExaminerMessage(
            `Say: That concludes Part 1. Now we will move on to Part 2. I am going to give you a topic and I would like you to talk about it for one to two minutes. Before you start, you will have one minute to think about what you want to say. Here is your topic. ${p2.prompt}. You should say: ${p2.bullets.join(', ')}. ${p2.followUp}. You now have one minute to prepare.`
          )
          waitForSpeechThen(() => {
            setPhase('part2-prep')
            startCountdown(60, 'Preparation time', () => {
              setPhase('part2-speak')
              sendExaminerMessage('Say exactly: Your preparation time is over. Please begin speaking now. You have two minutes.')
              waitForSpeechThen(() => {
                inTimedWindowRef.current = true
                pendingTranscriptRef.current = ''
                if (micSupported) startListening()
                startCountdown(120, 'Speaking time', () => {
                  stopListening()
                  setTimeout(() => {
                    const t = pendingTranscriptRef.current.trim() || '(speaking time ended)'
                    pendingTranscriptRef.current = ''
                    inTimedWindowRef.current = false
                    advanceAfterUserResponse(t)
                  }, 100)
                })
              })
            })
          })
        } else {
          questionIndexRef.current = nextIdx
          sendExaminerMessage(`Say exactly: ${part1DataRef.current.questions[nextIdx]}`)
          waitForSpeechThen(() => startUserResponseWindow(20))
        }
        break
      }
      case 'part2-speak': {
        setPhase('part3-intro')
        questionIndexRef.current = 0
        sendExaminerMessage(
          `Say exactly: Thank you. Now we will move on to Part 3. In this part, I would like to discuss some more general questions related to the topic we talked about in Part 2. ${part3QuestionsRef.current[0]}`
        )
        setPhase('part3')
        waitForSpeechThen(() => startUserResponseWindow(25))
        break
      }
      case 'part3': {
        const nextIdx = questionIndexRef.current + 1
        if (nextIdx >= 6) {
          setPhase('conclusion')
          setTestFinished(true)
          if (totalTimerRef.current) { clearInterval(totalTimerRef.current); totalTimerRef.current = null }
          sendExaminerMessage('Say exactly: That is the end of the speaking test. Thank you very much for your time. I hope you did well. Goodbye.')
        } else {
          questionIndexRef.current = nextIdx
          sendExaminerMessage(`Say exactly: ${part3QuestionsRef.current[nextIdx]}`)
          waitForSpeechThen(() => startUserResponseWindow(25))
        }
        break
      }
      default:
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendExaminerMessage, micSupported, startListening, stopListening])

  handleUserResponseRef.current = advanceAfterUserResponse

  // Handle typed/manual user response
  const handleManualResponse = useCallback((input: string) => {
    if (!input.trim() || isLoading || testFinished) return
    inTimedWindowRef.current = false
    stopAllTimers()
    stopListening()
    const accumulated = pendingTranscriptRef.current.trim()
    pendingTranscriptRef.current = ''
    const finalInput = accumulated ? `${accumulated} ${input}`.trim() : input
    setMessages(prev => [...prev, { role: 'user', content: finalInput }])
    advanceAfterUserResponse(finalInput)
  }, [isLoading, testFinished, stopListening, advanceAfterUserResponse])

  const startTest = async () => {
    if (!(await tryStartSession())) return
    setTestStarted(true)
    part1DataRef.current = pickPart1Questions()
    part2DataRef.current = pickPart2Question()
    part3QuestionsRef.current = []
    setMessages([])
    setTestFinished(false)
    setPhase('intro')
    questionIndexRef.current = 0
    testStartTimeRef.current = null
    setTotalElapsed(0)

    sendExaminerMessage('Say exactly: We are going to start the IELTS speaking test. Are you ready?')
    waitForSpeechThen(() => {
      // Non-timed phase — mic stays off; user confirms readiness
    })
  }

  const getIELTSFeedback = async () => {
    if (feedbackLoading || messages.length < 2) return
    setFeedbackLoading(true)
    setShowFeedback(true)
    setFeedbackText('')
    try {
      const resp = await fetch(FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      const data = await resp.json()
      setFeedbackText(data.feedback || 'Could not generate feedback.')
    } catch {
      setFeedbackText('Error generating IELTS feedback. Please try again.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getPhaseLabel = () => {
    switch (phaseDisplay) {
      case 'intro': return 'Introduction'
      case 'ask-name': case 'ask-origin': case 'id-check': case 'id-thanks': return 'Identity Check'
      case 'part1': return 'Part 1 — Interview'
      case 'part2-intro': case 'part2-prep': return 'Part 2 — Preparation'
      case 'part2-speak': return 'Part 2 — Long Turn'
      case 'part3-intro': case 'part3': return 'Part 3 — Discussion'
      case 'conclusion': return 'Test Complete'
      default: return 'IELTS Speaking'
    }
  }

  const [typedInput, setTypedInput] = useState('')
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleManualResponse(typedInput); setTypedInput('') }
  }

  // ─── INTRO: Start screen ───
  if (!testStarted) {
    return (
      <div className="h-screen flex flex-col">
        {blocked && <UpgradeWall onClose={dismissWall} sessionsUsed={sessionsUsed} />}
        <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
          <div className="flex items-center gap-3">
            <ProductNav current="NovateExaminer" />
            <span className="badge bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 inline-block animate-pulse" />
              Speaking Mock
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-16 px-5">
            <div className="text-center mb-12">
              <p className="text-sm text-secondary italic mb-4">&ldquo;Your IELTS speaking test is in 2 weeks.&rdquo;</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Practise until you&apos;re <span className="gradient-text">exam-ready.</span>
              </h1>
              <p className="text-secondary text-base max-w-lg mx-auto">
                Full 3-part mock exam with AI examiner Tom. Real questions, timed responses, and an official band score report at the end.
              </p>
            </div>

            <div className="glass-card p-6 mb-6">
              <h3 className="text-sm font-bold text-primary mb-4">What to expect</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: '💬', title: 'Part 1 — Interview', desc: '12 questions on everyday topics. ~20 seconds per answer.', color: 'text-violet-500' },
                  { icon: '🎤', title: 'Part 2 — Long Turn', desc: '1 min prep + 2 min speaking on a cue card topic.', color: 'text-indigo-500' },
                  { icon: '🧠', title: 'Part 3 — Discussion', desc: '6 abstract questions linked to Part 2. ~25 seconds each.', color: 'text-blue-500' },
                ].map(s => (
                  <div key={s.title} className="flex gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${s.color}`}>{s.title}</p>
                      <p className="text-xs text-secondary mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 mb-8 flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <p className="text-xs text-secondary leading-relaxed">
                For the best experience, use a modern browser (Chrome or Edge) and allow microphone access. Your voice responses will be transcribed automatically.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => { unlockAudio?.(); startTest(); }}
                className="btn-primary inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold rounded-xl"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653z" /></svg>
                Begin Full Mock Test
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── ACTIVE TEST ───
  return (
    <div className="h-screen flex flex-col">
      {blocked && <UpgradeWall onClose={dismissWall} sessionsUsed={sessionsUsed} />}

      {/* IELTS Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border overflow-hidden flex flex-col" style={{ background: 'var(--bg-main)', borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <h2 className="text-base font-bold text-primary">IELTS Speaking Test Report</h2>
              <button onClick={() => setShowFeedback(false)} className="btn-ghost h-8 w-8 p-0 rounded-full">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {feedbackLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                  <p className="text-sm text-secondary animate-pulse">Scoring your performance...</p>
                </div>
              ) : (
                <pre className="text-sm text-primary whitespace-pre-wrap font-sans leading-relaxed">{feedbackText}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {showTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl border overflow-hidden flex flex-col" style={{ background: 'var(--bg-main)', borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <h2 className="text-base font-bold text-primary">Test Transcript</h2>
              <button onClick={() => setShowTranscript(false)} className="btn-ghost h-8 w-8 p-0 rounded-full">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <span className={`text-xs font-bold shrink-0 pt-0.5 w-20 ${m.role === 'user' ? 'text-violet-500' : 'text-secondary'}`}>{m.role === 'user' ? 'You' : 'Examiner'}</span>
                  <p className="text-sm text-primary leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
        <div className="flex items-center gap-3">
          <ProductNav current="NovateExaminer" />
          <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--card-border)' }} />
          <span className="hidden sm:inline text-xs text-secondary">{getPhaseLabel()}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Total elapsed */}
          {testStartTimeRef.current && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span className="tabular-nums font-medium">{formatTime(totalElapsed)}</span>
            </div>
          )}
          {/* Response countdown */}
          {timerLabel && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${timerSeconds <= 5 ? 'text-red-500' : 'text-violet-500'}`}>
              <span className="tabular-nums">{formatTime(timerSeconds)}</span>
              <span className="text-secondary font-normal hidden sm:inline">{timerLabel}</span>
            </div>
          )}
          {/* Transcript & Feedback (shown after test ends) */}
          {testFinished && (
            <>
              <button onClick={() => setShowTranscript(true)} className="btn-ghost h-8 w-8 p-0" title="View transcript">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>
              </button>
              <button onClick={getIELTSFeedback} className="btn-ghost h-8 w-8 p-0" title="Get band score">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
              </button>
            </>
          )}
          {!testFinished && (
            <button
              onClick={() => { stopAllTimers(); stopSpeaking(); stopListening(); setTestStarted(false) }}
              className="h-8 rounded-md border border-red-500/20 bg-red-500/5 px-3.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all"
            >
              End Test
            </button>
          )}
          {testFinished && (
            <button
              onClick={() => { stopAllTimers(); stopSpeaking(); stopListening(); setTestStarted(false) }}
              className="btn-secondary h-8 px-3.5 text-xs font-semibold"
            >
              New Test
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar — exam tips (desktop) */}
        <div className="hidden lg:flex w-64 shrink-0 border-r overflow-y-auto p-4 flex-col gap-5" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Exam Tips</h3>
            <ul className="space-y-2.5">
              {[
                "Speak at a natural pace — don't rush.",
                "Extend answers with reasons and examples.",
                "Use a range of vocabulary and grammar.",
                "Self-correct if you notice a mistake.",
                "Don't memorise scripted answers.",
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-secondary leading-relaxed">
                  <span className="text-violet-500 shrink-0 mt-0.5">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Phase</h3>
            <p className="text-xs text-violet-500 font-semibold">{getPhaseLabel()}</p>
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

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                <p className="text-sm text-secondary animate-pulse">Setting up your test...</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak(getSpeakableText(m.content))}
                    className="btn-ghost h-8 w-8 p-0 shrink-0 mt-0.5"
                    title="Listen"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2l4-4v14l-4-4z" /></svg>
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-xs font-bold text-violet-500 mt-0.5">E</div>
                <div className="rounded-xl rounded-tl-none px-4 py-3" style={{ background: 'var(--subtle-bg)' }}>
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            {/* Test complete CTA */}
            {testFinished && (
              <div className="glass-card p-5 text-center space-y-3">
                <p className="text-sm font-semibold text-primary">Test complete!</p>
                <p className="text-xs text-secondary">Your test lasted {formatTime(totalElapsed)}. Click the report icon above to get your IELTS band score.</p>
                <button onClick={getIELTSFeedback} className="btn-primary text-xs px-5 py-2.5">Get Band Score Report</button>
              </div>
            )}
          </div>

          {/* Input — hidden when test complete and no timer */}
          {!testFinished && (
            <div className="shrink-0 border-t p-3 sm:p-4 flex items-end gap-2 sm:gap-3 safe-bottom" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
              {/* Mic status indicator */}
              {inTimedWindowRef.current && isListening && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  Recording your response
                </div>
              )}
              {micSupported && (
                <button
                  onClick={() => isListening ? stopListening() : startListening()}
                  className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'btn-ghost'}`}
                  title={isListening ? 'Stop recording' : 'Start recording'}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
                    <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <textarea
                value={typedInput}
                onChange={e => setTypedInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response or use the mic..."
                rows={1}
                className="flex-1 min-h-[40px] max-h-28 resize-none rounded-lg border px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
              />
              <button
                onClick={() => { handleManualResponse(typedInput); setTypedInput('') }}
                disabled={!typedInput.trim() || isLoading}
                className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-white transition-all active:scale-[0.97] disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 0 20px -8px rgba(139, 92, 246, 0.4)' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
