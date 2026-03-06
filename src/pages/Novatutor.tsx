import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { parseAssistantMessage, getSpeakableText } from '../lib/chatHelpers'
import { generatePlainTextReport, generateTranscriptReport } from '../lib/pdfReport'
import type { CEFRLevel } from '../types'
import { LANGUAGES } from '../types'
import ProductNav from '../components/ProductNav'
import UpgradeWall from '../components/UpgradeWall'
import { useSessionGate } from '../hooks/useSessionGate'
import { t, getStarters, setUILocale, detectUILocale, type UILocale } from '../lib/i18n'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/api\/chat\/?$/, '')
const CHAT_URL = `${BACKEND_URL}/api/chat/novatutor/stream`
const FEEDBACK_URL = `${BACKEND_URL}/api/feedback`

const CEFR_LEVELS: { value: CEFRLevel; label: string }[] = [
  { value: 'A1', label: 'A1' }, { value: 'A2', label: 'A2' }, { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' }, { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' },
]

type Msg = { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }

export default function Novatutor() {
  const { blocked, sessionsUsed, dismissWall, tryStartSession } = useSessionGate()
  const sessionConsumedRef = useRef(false)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState('en')
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1')
  const [uiLocale, setUiLocale] = useState<UILocale>(detectUILocale)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null)
  const [autoIntroSent, setAutoIntroSent] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const spokenUpToRef = useRef(0)
  const isLoadingRef = useRef(false)

  useEffect(() => { isLoadingRef.current = isLoading }, [isLoading])
  useEffect(() => { setUILocale(uiLocale) }, [uiLocale])

  // Auto-set native language based on UI locale (unless it matches practice language)
  useEffect(() => {
    if (nativeLanguage != null) return
    if (uiLocale && uiLocale !== language) setNativeLanguage(uiLocale)
  }, [uiLocale, language, nativeLanguage])

  // Get language speech code
  const getLangSpeechCode = useCallback(() => {
    const lang = LANGUAGES.find(l => l.code === language)
    if (lang && 'speechCode' in lang) return (lang as { speechCode: string }).speechCode
    if (language === 'en') return 'en-GB'
    return `${language}-${language.toUpperCase()}`
  }, [language])

  const { isSpeaking, speak, speakQueued, stop: stopSpeaking, unlockAudio, resumeFromUserGesture } = useSpeechSynthesis(getLangSpeechCode())
  const introTriggeredRef = useRef(false)
  const resumeOnGestureRef = useRef(false)

  const onVoiceResult = useCallback((transcript: string) => {
    sendMessage(transcript)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getLangRecognitionCode = useCallback(() => {
    const lang = LANGUAGES.find(l => l.code === language)
    if (lang && 'recognitionCode' in lang) return (lang as { recognitionCode: string }).recognitionCode
    if (language === 'en') return 'en-GB'
    return `${language}-${language.toUpperCase()}`
  }, [language])

  const { isListening, isSupported: micSupported, start: startListening, stop: stopListening } =
    useSpeechRecognition({ lang: getLangRecognitionCode(), onResult: onVoiceResult })

  // Stop mic when TTS is playing to prevent feedback loop (mic hearing the speaker and sending as user input)
  useEffect(() => {
    if (isSpeaking && isListening) stopListening()
  }, [isSpeaking, isListening, stopListening])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])

  // Reset when language / level changes
  useEffect(() => {
    setMessages([])
    setNativeLanguage(null)
    setAutoIntroSent(false)
    sessionConsumedRef.current = false
    introTriggeredRef.current = false
  }, [language, cefrLevel])

  // Speak each sentence as soon as it's complete for more immediate response
  const SENTENCES_PER_CHUNK = 1
  const checkAndQueueSentences = useCallback((fullText: string) => {
    const speakable = getSpeakableText(fullText)
    const remaining = speakable.slice(spokenUpToRef.current)
    const parts = remaining.split(/(?<=[.!?])\s+/)
    if (parts.length === 0) return
    if (parts.length === 1) {
      const s = parts[0].trim()
      // Only queue when we have a complete sentence (ends with . ! ?) — avoid word-by-word TTS
      if (s && /[.!?]$/.test(s)) {
        console.log('[Novatutor] Queuing sentence:', s.slice(0, 60) + (s.length > 60 ? '...' : ''))
        speakQueued(s)
        spokenUpToRef.current += remaining.length
      }
      return
    }
    let consumedLength = 0
    const batch: string[] = []
    for (let i = 0; i < parts.length - 1; i++) {
      const sentence = parts[i].trim()
      if (sentence) batch.push(sentence)
      const nextPartStart = remaining.indexOf(parts[i + 1], consumedLength)
      if (nextPartStart >= 0) consumedLength = nextPartStart
      else consumedLength += parts[i].length + 1
      if (batch.length >= SENTENCES_PER_CHUNK) {
        const batchText = batch.join(' ')
        console.log('[Novatutor] Queuing batch:', batchText.slice(0, 60) + (batchText.length > 60 ? '...' : ''))
        speakQueued(batchText)
        batch.length = 0
      }
    }
    if (batch.length > 0) {
      const batchText = batch.join(' ')
      console.log('[Novatutor] Queuing final batch:', batchText.slice(0, 60) + (batchText.length > 60 ? '...' : ''))
      speakQueued(batchText)
    }
    spokenUpToRef.current += consumedLength
  }, [speakQueued])

  const flushRemainingSpeech = useCallback((fullText: string) => {
    const speakable = getSpeakableText(fullText)
    const remaining = speakable.slice(spokenUpToRef.current).trim()
    if (remaining) {
      console.log('[Novatutor] Flush remaining speech:', remaining.slice(0, 60) + (remaining.length > 60 ? '...' : ''))
      speakQueued(remaining)
      spokenUpToRef.current = speakable.length
    }
  }, [speakQueued])

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
            // Ensure Novate Abby persona (backend may still return old name)
            const snapshot = assistantSoFar.replace(/\bTom Holland\b/gi, 'Novate Abby')
            console.log('[Novatutor] Stream chunk, snapshot length:', snapshot.length, 'ends:', snapshot.slice(-30))
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m)
              }
              return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: snapshot, timestamp: Date.now() }]
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

  // Only request translation when practicing a language other than English. When practicing English, don't show translation (avoids e.g. German translation when browser is German but user chose English).
  const effectiveNativeLanguage =
    language === 'en'
      ? null
      : (nativeLanguage ?? (uiLocale !== language ? uiLocale : null))

  const triggerIntro = useCallback(async () => {
    console.log('[Novatutor] triggerIntro started')
    setIsLoading(true)
    stopSpeaking()
    spokenUpToRef.current = 0
    let assistantSoFar = ''
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], language, nativeLanguage: effectiveNativeLanguage, showSuggestions: false, cefrLevel }),
      })
      if (!resp.ok || !resp.body) throw new Error('Failed to connect')
      assistantSoFar = await processStream(resp.body, assistantSoFar)
      assistantSoFar = assistantSoFar.replace(/\bTom Holland\b/gi, 'Novate Abby')
      console.log('[Novatutor] Stream done, total length:', assistantSoFar.length)
      flushRemainingSpeech(assistantSoFar)
    } catch (e) {
      console.error('[Novatutor] triggerIntro failed:', e)
      setMessages([{ id: 'welcome', role: 'assistant', content: "Hey! Novate Abby here. Ready to practice? Pick a topic or just start chatting.", timestamp: Date.now() }])
    } finally {
      setIsLoading(false)
    }
  }, [language, cefrLevel, effectiveNativeLanguage, stopSpeaking, processStream, flushRemainingSpeech])

  // Do NOT auto-trigger intro: browsers block speech until user gesture. User must click "Start practice" so the greeting is voiced.

  // Resume any queued speech after first user gesture (if autoplay was blocked)
  useEffect(() => {
    if (resumeOnGestureRef.current || typeof window === 'undefined') return
    const onGesture = () => {
      if (resumeOnGestureRef.current) return
      resumeOnGestureRef.current = true
      unlockAudio?.()
      resumeFromUserGesture?.()
      window.removeEventListener('click', onGesture, true)
      window.removeEventListener('touchstart', onGesture, true)
    }
    window.addEventListener('click', onGesture, true)
    window.addEventListener('touchstart', onGesture, true)
    return () => {
      window.removeEventListener('click', onGesture, true)
      window.removeEventListener('touchstart', onGesture, true)
    }
  }, [unlockAudio, resumeFromUserGesture])

  const handleStartPractice = useCallback(() => {
    console.log('[Novatutor] Start practice clicked')
    unlockAudio?.()
    resumeFromUserGesture?.()
    setAutoIntroSent(true)
    triggerIntro()
  }, [triggerIntro, unlockAudio, resumeFromUserGesture])

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim()
    if (!text || isLoadingRef.current) return
    unlockAudio?.()
    if (!sessionConsumedRef.current) {
      if (!(await tryStartSession())) return
      sessionConsumedRef.current = true
    }
    if (isListening) stopListening()

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    stopSpeaking()
    spokenUpToRef.current = 0
    let assistantSoFar = ''

    const currentMessages = messages.concat(userMsg)

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages.map(m => ({ role: m.role, content: m.content })), language, nativeLanguage: effectiveNativeLanguage, showSuggestions, cefrLevel }),
      })
      if (resp.status === 429) { console.warn('Rate limited'); setIsLoading(false); return }
      if (resp.status === 402) { console.warn('Credits needed'); setIsLoading(false); return }
      if (!resp.ok || !resp.body) throw new Error('Failed to connect')
      assistantSoFar = await processStream(resp.body, assistantSoFar)
      assistantSoFar = assistantSoFar.replace(/\bTom Holland\b/gi, 'Novate Abby')
      flushRemainingSpeech(assistantSoFar)

      // If user typed their native language explicitly, capture it once
      if (!nativeLanguage) {
        const lowerMsg = text.toLowerCase()
        const match = LANGUAGES.find(l => lowerMsg.includes(l.name.toLowerCase()) || lowerMsg.includes(l.code))
        if (match && match.code !== language) setNativeLanguage(match.code)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [messages, language, cefrLevel, nativeLanguage, effectiveNativeLanguage, showSuggestions, isListening, stopListening, stopSpeaking, tryStartSession, processStream, flushRemainingSpeech, unlockAudio])

  const handleSend = useCallback(() => { sendMessage(input) }, [input, sendMessage])
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const toggleMic = () => {
    if (isListening) stopListening()
    else if (!isSpeaking) startListening()
  }

  const getFeedback = async () => {
    if (feedbackLoading || messages.length < 2) return
    setFeedbackLoading(true)
    setShowFeedback(true)
    setFeedbackText('')
    try {
      const langName = LANGUAGES.find(l => l.code === language)?.name || 'English'
      const resp = await fetch(FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })), language: langName }),
      })
      const data = await resp.json()
      setFeedbackText(data.feedback || 'Could not generate feedback.')
    } catch {
      setFeedbackText('Error generating feedback. Please try again.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const corrections = messages.filter(m => m.role === 'assistant' && /(CORRECTIONS:|Correction:)/i.test(m.content)).length
  const turns = messages.filter(m => m.role === 'user').length
  const langName = LANGUAGES.find(l => l.code === language)?.name || 'English'
  const starters = getStarters()
  const hasEnoughMessages = messages.length >= 2

  const downloadTranscriptPdf = () => {
    generateTranscriptReport(`${langName} Lesson Transcript`, messages.map(m => ({ role: m.role, content: m.content })))
  }

  const downloadFeedbackPdf = () => {
    generatePlainTextReport('Performance Feedback', feedbackText)
  }

  return (
    <div className="h-screen flex flex-col">
      {blocked && <UpgradeWall onClose={dismissWall} sessionsUsed={sessionsUsed} />}

      {/* Feedback Modal — portaled so it always appears on top (like NovateExaminer) */}
      {showFeedback && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }}
          onClick={() => setShowFeedback(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Performance feedback"
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] rounded-2xl border overflow-hidden flex flex-col"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--card-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <h2 className="text-base font-bold text-primary">Performance Feedback</h2>
              <div className="flex items-center gap-2">
                <button onClick={downloadFeedbackPdf} disabled={!feedbackText || feedbackLoading} className="btn-secondary text-xs px-3 py-1.5 rounded-lg">
                  Download PDF
                </button>
                <button onClick={() => setShowFeedback(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:opacity-90" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }} aria-label="Close">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {feedbackLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                  <p className="text-sm text-secondary animate-pulse">Generating your report...</p>
                </div>
              ) : (
                <pre className="text-sm text-primary whitespace-pre-wrap font-sans leading-relaxed">{feedbackText}</pre>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Transcript Modal — portaled so it always appears on top (like NovateExaminer) */}
      {showTranscript && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }}
          onClick={() => setShowTranscript(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Conversation transcript"
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] rounded-2xl border overflow-hidden flex flex-col"
            style={{ background: 'var(--bg-main)', borderColor: 'var(--card-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <h2 className="text-base font-bold text-primary">Conversation Transcript</h2>
              <div className="flex items-center gap-2">
                <button onClick={downloadTranscriptPdf} disabled={messages.length === 0} className="btn-secondary text-xs px-3 py-1.5 rounded-lg">
                  Download PDF
                </button>
                <button onClick={() => setShowTranscript(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:opacity-90" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }} aria-label="Close">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map(m => (
                <div key={m.id} className="flex gap-2">
                  <span className={`text-xs font-bold shrink-0 pt-0.5 w-20 ${m.role === 'user' ? 'text-brand-500' : 'text-secondary'}`}>{m.role === 'user' ? 'You' : 'Abby'}</span>
                  <p className="text-sm text-primary leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Top bar */}
      <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
        <div className="flex items-center gap-3">
          <ProductNav current="Novatutor" />
          {turns > 0 && (
            <>
              <div className="h-4 w-px bg-(--card-border)" />
              <div className="hidden sm:flex items-center gap-3 text-xs text-secondary">
                <span><strong className="text-primary tabular-nums">{turns}</strong> {t('tutor.messages')}</span>
                {corrections > 0 && <span><strong className="text-amber-500 tabular-nums">{corrections}</strong> {t('tutor.corrections')}</span>}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Suggestions toggle */}
          <button
            onClick={() => setShowSuggestions(v => !v)}
            className="btn-ghost h-8 w-8 p-0"
            title={showSuggestions ? 'Disable suggestions' : 'Enable suggestions'}
          >
            <svg className={`h-3.5 w-3.5 ${showSuggestions ? 'text-brand-500' : 'text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" /></svg>
          </button>
          {/* Transcript — icon + label on md+ (opens portaled modal) */}
          <button
            type="button"
            onClick={() => { if (hasEnoughMessages) setShowTranscript(true) }}
            disabled={!hasEnoughMessages}
            className={`h-8 px-2 md:px-2.5 rounded-lg flex items-center gap-1.5 transition-opacity shrink-0 text-secondary ${hasEnoughMessages ? 'hover:text-primary hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-40 cursor-not-allowed'}`}
            title={hasEnoughMessages ? 'View transcript' : 'View transcript (available after at least one exchange)'}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>
            <span className="hidden md:inline text-xs font-medium">Transcript</span>
          </button>
          {/* Feedback — icon + label on md+ (opens portaled modal, then fetches) */}
          <button
            type="button"
            onClick={() => { if (hasEnoughMessages && !feedbackLoading) { setShowFeedback(true); getFeedback() } }}
            disabled={!hasEnoughMessages || feedbackLoading}
            className={`h-8 px-2 md:px-2.5 rounded-lg flex items-center gap-1.5 transition-opacity shrink-0 text-secondary ${hasEnoughMessages && !feedbackLoading ? 'hover:text-primary hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-40 cursor-not-allowed'}`}
            title={hasEnoughMessages ? 'Get feedback' : 'Get feedback (available after at least one exchange)'}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            <span className="hidden md:inline text-xs font-medium">Get feedback</span>
          </button>
          {/* UI language */}
          <div className="flex items-center gap-1 h-8 rounded-md border px-2 cursor-pointer" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
            <svg className="h-3 w-3 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.73-3.558" /></svg>
            <select
              value={uiLocale}
              onChange={e => setUiLocale(e.target.value as UILocale)}
              className="text-[11px] font-semibold text-secondary uppercase bg-transparent border-none appearance-none cursor-pointer focus:outline-none pr-0"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}
            </select>
          </div>
          {/* Practice language */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="h-8 rounded-md border text-xs font-medium px-2.5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--heading-main)' }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <div className="hidden sm:flex rounded-md border overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
            {CEFR_LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setCefrLevel(l.value)}
                className={`h-8 px-2.5 text-xs font-bold transition-colors ${cefrLevel === l.value ? 'bg-brand-500 text-white' : 'text-secondary hover:text-primary'}`}
                style={cefrLevel !== l.value ? { background: 'var(--card-bg)' } : undefined}
              >
                {l.label}
              </button>
            ))}
          </div>
          <select
            value={cefrLevel}
            onChange={e => setCefrLevel(e.target.value as CEFRLevel)}
            className="sm:hidden h-8 rounded-md border text-xs font-bold px-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--heading-main)' }}
          >
            {CEFR_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 && !autoIntroSent && (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <p className="text-sm text-secondary text-center">Click below to hear Abby greet you. (Browsers require a click before playing voice.)</p>
                <button
                  type="button"
                  onClick={handleStartPractice}
                  className="btn-primary px-6 py-3 text-base font-semibold"
                >
                  {t('tutor.start') || 'Start practice'}
                </button>
              </div>
            )}
            {messages.length === 0 && autoIntroSent && isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                <p className="text-sm text-secondary animate-pulse">Connecting to Novate Abby...</p>
              </div>
            )}
            {messages.map(m => {
              const parsed = parseAssistantMessage(m.content)
              return (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-xs font-bold text-brand-500 mt-0.5">T</div>
                  )}
                  <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'rounded-tl-none text-primary'
                  }`} style={m.role === 'assistant' ? { background: 'var(--subtle-bg)' } : undefined}>
                    <p className="whitespace-pre-wrap">{m.role === 'assistant' ? parsed.mainContent : m.content}</p>
                    {m.role === 'assistant' && (() => {
                      const realCorrections = parsed.corrections.filter(c => !/^\s*[-•]?\s*none\s*needed\.?\s*$/i.test(c.trim()))
                      if (realCorrections.length === 0) return null
                      return (
                        <div className="mt-2 border-t pt-2 space-y-1" style={{ borderColor: 'var(--card-border)' }}>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Corrections</p>
                          {realCorrections.map((c, i) => (
                            <p key={i} className="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
                              {c}
                            </p>
                          ))}
                        </div>
                      )
                    })()}
                    {m.role === 'assistant' && parsed.translation && (
                      <p className="mt-1.5 text-xs italic text-secondary border-l-2 pl-2" style={{ borderColor: 'var(--card-border)' }}>{parsed.translation}</p>
                    )}
                    {m.role === 'assistant' && parsed.transliteration && (
                      <p className="mt-1 text-xs text-secondary">({parsed.transliteration})</p>
                    )}
                    {m.role === 'assistant' && parsed.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {parsed.suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            disabled={isLoading}
                            className="text-xs rounded-full border px-3 py-1 text-brand-500 hover:bg-brand-500/10 transition-colors"
                            style={{ borderColor: 'var(--card-border)' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speak(getSpeakableText(m.content))}
                      className="btn-ghost h-8 w-8 p-0 shrink-0 mt-0.5"
                      title={isSpeaking ? 'Stop' : t('tutor.listen')}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                    </button>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-xs font-bold text-brand-500 mt-0.5">T</div>
                <div className="rounded-xl rounded-tl-none px-4 py-3" style={{ background: 'var(--subtle-bg)' }}>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Starters */}
        {turns === 0 && !isLoading && messages.length > 0 && (
          <div className="shrink-0 px-4 pb-2">
            <div className="max-w-2xl mx-auto">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">{t('tutor.tryScenario')}</p>
              <div className="flex flex-wrap gap-2">
                {starters.map(s => (
                  <button key={s} onClick={() => sendMessage(s)} className="btn-secondary text-xs py-1.5 px-4 rounded-full">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t p-3 safe-bottom" style={{ borderColor: 'var(--card-border)' }}>
          {/* Only show "Speaker active" bar after the user has sent at least one message; keeps intro view clean */}
          {isSpeaking && turns > 0 && (
            <div className="max-w-2xl mx-auto mb-2 flex items-center gap-2 text-xs text-secondary">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('tutor.speakerActive')}
              <button onClick={stopSpeaking} className="ml-auto text-xs text-red-400 hover:text-red-500">Stop</button>
            </div>
          )}
          <div className="flex gap-2 items-end max-w-2xl mx-auto">
            <button
              onClick={micSupported ? toggleMic : undefined}
              disabled={!micSupported || isSpeaking}
              className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-all relative ${
                !micSupported ? 'opacity-50 cursor-not-allowed btn-secondary p-0!'
                : isListening ? 'bg-red-600 text-white animate-pulse'
                : isSpeaking ? 'opacity-30 cursor-not-allowed btn-secondary p-0!'
                : 'btn-secondary p-0!'
              }`}
              title={!micSupported ? 'Voice input requires Chrome or Edge (and microphone permission)' : isListening ? t('tutor.stopSend') : isSpeaking ? t('tutor.speakerActive') : t('tutor.record')}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
              {!micSupported && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-4 w-4 text-red-400 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </span>
              )}
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('tutor.placeholder', { lang: langName })}
              rows={1}
              className="flex-1 min-h-[40px] max-h-28 resize-none rounded-lg border px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-white transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 0 20px -8px rgba(14, 165, 233, 0.4)' }}
              title={t('tutor.send')}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
