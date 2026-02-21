import { useState, useCallback, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { sendChatMessage, NOVATUTOR_WELCOME, type PersonaMode } from '../services/chatApi'
import type { ChatMessage, CEFRLevel } from '../types'
import { LANGUAGES } from '../types'
import ProductNav from '../components/ProductNav'
import UpgradeWall from '../components/UpgradeWall'
import { useSessionGate } from '../hooks/useSessionGate'
import { speak as ttsSpeak, onSpeakingChange } from '../lib/tts'
import { t, getStarters, setUILocale, detectUILocale, type UILocale } from '../lib/i18n'

const CEFR_LEVELS: { value: CEFRLevel; label: string }[] = [
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
  { value: 'C2', label: 'C2' },
]

function speakText(text: string, lang: string) {
  if (!text.trim()) return
  ttsSpeak(text.trim(), lang)
}

export default function Novatutor() {
  const { blocked, sessionsUsed, dismissWall, tryStartSession } = useSessionGate()
  const sessionConsumedRef = useRef(false)

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: NOVATUTOR_WELCOME, timestamp: Date.now(), meta: {} },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('en')
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1')
  const [uiLocale, setUiLocale] = useState<UILocale>(detectUILocale)
  const [ttsSpeaking, setTtsSpeaking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSpokenRef = useRef<string | null>(null)

  const corrections = messages.filter(m => m.role === 'assistant' && m.meta?.correction).length
  const turns = messages.filter(m => m.role === 'user').length

  useEffect(() => { setUILocale(uiLocale) }, [uiLocale])

  useEffect(() => {
    setMessages([{ id: 'welcome', role: 'assistant', content: NOVATUTOR_WELCOME, timestamp: Date.now(), meta: {} }])
  }, [language, cefrLevel])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => { return onSpeakingChange(setTtsSpeaking) }, [])

  const { transcript, supported, start, stop, isListening, setTranscript } = useSpeechRecognition({
    language: language === 'en' ? 'en-GB' : `${language}-${language.toUpperCase()}`,
    onResult: (text, isFinal) => { if (isFinal) setTranscript(text) },
  })

  // Stop mic when TTS starts playing to prevent it picking up the audio
  useEffect(() => {
    if (ttsSpeaking && isListening) stop()
  }, [ttsSpeaking, isListening, stop])

  // Auto-speak new assistant messages (only after mic is off)
  useEffect(() => {
    const last = messages.filter(m => m.role === 'assistant').pop()
    if (!last || last.id === lastSpokenRef.current) return
    lastSpokenRef.current = last.id
    if (isListening) stop()
    if (last.content.trim()) speakText(last.content, language)
  }, [messages, language, isListening, stop])

  useEffect(() => { if (transcript) setInput(transcript) }, [transcript])

  const handleSend = useCallback(async (content: string) => {
    const text = content.trim()
    if (!text || loading) return
    if (!sessionConsumedRef.current) {
      if (!(await tryStartSession())) return
      sessionConsumedRef.current = true
    }
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await sendChatMessage([...messages, userMsg], { mode: 'novatutor' as PersonaMode, language, cefrLevel })
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: res.content, timestamp: Date.now(), meta: res.meta }])
    } finally { setLoading(false) }
  }, [messages, language, cefrLevel, loading, tryStartSession])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input) } }

  const toggleMic = () => {
    if (isListening) { stop(); if (transcript.trim()) handleSend(transcript) }
    else if (!ttsSpeaking) { setTranscript(''); start() }
  }

  const langName = LANGUAGES.find(l => l.code === language)?.name || 'English'
  const starters = getStarters()

  return (
    <div className="h-screen flex flex-col">
      {blocked && <UpgradeWall onClose={dismissWall} sessionsUsed={sessionsUsed} />}
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
          {/* UI language — small globe + code */}
          <div className="flex items-center gap-1 h-8 rounded-md border px-2 cursor-pointer" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
            <svg className="h-3 w-3 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.73-3.558" /></svg>
            <select
              value={uiLocale}
              onChange={(e) => setUiLocale(e.target.value as UILocale)}
              className="text-[11px] font-semibold text-secondary uppercase bg-transparent border-none appearance-none cursor-pointer focus:outline-none pr-0"
            >
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}
            </select>
          </div>
          {/* Practice language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-8 rounded-md border text-xs font-medium px-2.5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--heading-main)' }}
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <div className="hidden sm:flex rounded-md border overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
            {CEFR_LEVELS.map((l) => (
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
            onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
            className="sm:hidden h-8 rounded-md border text-xs font-bold px-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--heading-main)' }}
          >
            {CEFR_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-xs font-bold text-brand-500 mt-0.5">T</div>
                )}
                <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'rounded-tl-none text-primary'
                }`} style={m.role === 'assistant' ? { background: 'var(--subtle-bg)' } : undefined}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.meta?.translation && (
                    <p className="mt-1.5 text-xs italic text-secondary border-l-2 pl-2" style={{ borderColor: 'var(--card-border)' }}>{m.meta.translation}</p>
                  )}
                  {m.meta?.correction && (
                    <div className="mt-2 border-t pt-2 space-y-1" style={{ borderColor: 'var(--card-border)' }}>
                      {m.meta.correction.split('\n').map((c, i) => (
                        <p key={i} className="text-xs font-medium text-amber-500">
                          {c.startsWith('None needed') ? `✓ ${c}` : `✏️ ${c}`}
                        </p>
                      ))}
                    </div>
                  )}
                  {m.meta?.transliteration && (
                    <p className="mt-1 text-xs text-secondary">({m.meta.transliteration})</p>
                  )}
                </div>
                {m.role === 'assistant' && (
                  <button onClick={() => speakText(m.content, language)} className="btn-ghost h-8 w-8 p-0 shrink-0 mt-0.5" title={t('tutor.listen')}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-xs font-bold text-brand-500 mt-0.5">T</div>
                <div className="rounded-xl rounded-tl-none px-4 py-3" style={{ background: 'var(--subtle-bg)' }}>
                  <div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: '0ms' }} /><span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: '150ms' }} /><span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Starters (only when no user messages yet) */}
        {turns === 0 && (
          <div className="shrink-0 px-4 pb-2">
            <div className="max-w-2xl mx-auto">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">{t('tutor.tryScenario')}</p>
              <div className="flex flex-wrap gap-2">
                {starters.map((s) => (
                  <button key={s} onClick={() => handleSend(s)} className="btn-secondary text-xs py-1.5 px-4 rounded-full">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t p-3 safe-bottom" style={{ borderColor: 'var(--card-border)' }}>
          {ttsSpeaking && (
            <div className="max-w-2xl mx-auto mb-2 flex items-center gap-2 text-xs text-secondary">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('tutor.speakerActive')}
            </div>
          )}
          <div className="flex gap-2 items-end max-w-2xl mx-auto">
            {supported && (
              <button
                onClick={toggleMic}
                disabled={ttsSpeaking}
                className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  isListening ? 'bg-red-600 text-white animate-pulse'
                  : ttsSpeaking ? 'opacity-30 cursor-not-allowed btn-secondary p-0!'
                  : 'btn-secondary p-0!'
                }`}
                title={isListening ? t('tutor.stopSend') : ttsSpeaking ? t('tutor.speakerActive') : t('tutor.record')}
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('tutor.placeholder', { lang: langName })}
              rows={1}
              className="flex-1 min-h-[40px] max-h-28 resize-none rounded-lg border px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
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
  )
}
