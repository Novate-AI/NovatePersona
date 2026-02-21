import { useState, useRef, useEffect } from 'react'
import type { ChatMessage as ChatMessageType } from '../types'
import { speak as ttsSpeak } from '../lib/tts'

function speakWithBrowser(text: string, lang: string = 'en'): void {
  if (!text.trim()) return
  ttsSpeak(text.trim(), lang)
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}

/** Animated typing indicator with bouncing dots */
function TypingIndicator() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3 shadow-sm transition-colors">
        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

interface ChatBoxProps {
  messages: ChatMessageType[]
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
  /** When true, assistant messages are spoken using browser speech. */
  suggestedReplies?: string[]
  /** Mic: show button and sync transcript into input */
  micSupported?: boolean
  isListening?: boolean
  onMicToggle?: () => void
  transcript?: string
  /** Show typing indicator when true */
  loading?: boolean
  /** The current language code (e.g. 'en', 'fr') for TTS accent */
  language?: string
}

export default function ChatBox({
  messages,
  onSend,
  disabled = false,
  placeholder = 'Type or speak...',
  suggestedReplies = [],
  micSupported = false,
  isListening = false,
  onMicToggle,
  transcript = '',
  loading = false,
  language = 'en',
}: ChatBoxProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const lastSpokenIdRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* Sync mic transcript into input so user can see and send what was heard */
  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  /* Speak every new assistant message: use browser voice */
  useEffect(() => {
    const last = messages.filter((m) => m.role === 'assistant').pop()
    if (!last || last.id === lastSpokenIdRef.current) return
    lastSpokenIdRef.current = last.id

    const text = last.content
    if (!text.trim()) return

    speakWithBrowser(text, language)
  }, [messages, language])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || disabled) return
    onSend(text)
    setInput('')
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-300">
      <div className="flex max-h-[420px] flex-col overflow-y-auto p-4">
        {messages.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-slate-500">{placeholder}</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.role === 'user'
                ? 'bg-brand-600 text-white shadow-brand-500/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200'
                }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.meta?.translation && (
                <p className="mt-1.5 text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-700 pl-2">
                  {m.meta.translation}
                </p>
              )}
              {m.meta?.correction && (
                <p className="mt-2 border-t border-slate-200 dark:border-slate-600 pt-2 text-xs text-amber-600 dark:text-amber-300 font-medium">
                  Correction: {m.meta.correction}
                </p>
              )}
              {m.meta?.transliteration && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Transliteration: {m.meta.transliteration}</p>
              )}
            </div>
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs transition-colors"
          />
          {micSupported && onMicToggle && (
            <button
              type="button"
              onClick={onMicToggle}
              title={isListening ? 'Stop microphone' : 'Use microphone'}
              className={`flex shrink-0 items-center justify-center rounded-xl px-3 py-2.5 transition-all ${isListening
                ? 'bg-red-600 text-white hover:bg-red-500 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              aria-label={isListening ? 'Stop microphone' : 'Use microphone'}
            >
              <MicIcon className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-500 disabled:opacity-50 active:scale-95"
          >
            Send
          </button>
        </div>
        {suggestedReplies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedReplies.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onSend(s)
                  setInput('')
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-all active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
