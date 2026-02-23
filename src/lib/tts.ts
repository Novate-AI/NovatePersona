/**
 * Unified TTS service.
 * 1. Tries server-side HuggingFace MMS-TTS (natural voice)
 * 2. Falls back to Web Speech API with best available voice
 */

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/chat').replace('/api/chat', '')

let currentAudio: HTMLAudioElement | null = null
let isSpeakingFlag = false
let onStateChange: ((speaking: boolean) => void) | null = null

const audioCache = new Map<string, string>()
const MAX_CACHE = 50

const preferredVoiceNames = [
  'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Aria',
  'Google US English', 'Google UK English Female', 'Google UK English Male',
  'Samantha', 'Daniel', 'Karen', 'Moira',
]

function getBestWebSpeechVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis?.getVoices() || []
  const langVoices = voices.filter(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]))
  for (const name of preferredVoiceNames) {
    const match = langVoices.find(v => v.name.includes(name))
    if (match) return match
  }
  return langVoices[0] || voices[0] || null
}

function setIsSpeaking(value: boolean) {
  isSpeakingFlag = value
  onStateChange?.(value)
}

async function speakWithServer(text: string, lang: string): Promise<boolean> {
  const cacheKey = `${lang}:${text.slice(0, 200)}`
  let audioUrl = audioCache.get(cacheKey)

  if (!audioUrl) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2000), lang }),
      })

      if (!res.ok) return false

      const blob = await res.blob()
      if (blob.size < 100) return false

      audioUrl = URL.createObjectURL(blob)

      if (audioCache.size >= MAX_CACHE) {
        const firstKey = audioCache.keys().next().value
        if (firstKey) {
          URL.revokeObjectURL(audioCache.get(firstKey)!)
          audioCache.delete(firstKey)
        }
      }
      audioCache.set(cacheKey, audioUrl)
    } catch {
      return false
    }
  }

  return new Promise<boolean>((resolve) => {
    const audio = new Audio(audioUrl)
    audio.playbackRate = 1.1
    currentAudio = audio

    audio.onplay = () => setIsSpeaking(true)
    audio.onended = () => { setIsSpeaking(false); currentAudio = null; resolve(true) }
    audio.onerror = () => { setIsSpeaking(false); currentAudio = null; resolve(false) }

    audio.play().catch(() => { setIsSpeaking(false); resolve(false) })
  })
}

function speakWithWebSpeech(text: string, lang: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(false); return }

    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.95
    u.pitch = 1

    const voice = getBestWebSpeechVoice(lang)
    if (voice) u.voice = voice

    u.onstart = () => setIsSpeaking(true)
    u.onend = () => { setIsSpeaking(false); resolve(true) }
    u.onerror = () => { setIsSpeaking(false); resolve(false) }

    speechSynthesis.speak(u)
  })
}

const LANG_MAP: Record<string, string> = {
  'en': 'en', 'en-US': 'en', 'en-GB': 'en',
  'es': 'es', 'fr': 'fr', 'de': 'de', 'it': 'it', 'pt': 'pt',
  'ja': 'ja', 'ko': 'ko', 'zh': 'zh', 'ar': 'ar',
  'hi': 'hi', 'tr': 'tr', 'ru': 'ru', 'pl': 'pl', 'nl': 'nl',
}

function normalizeLang(lang: string): string {
  return LANG_MAP[lang] || LANG_MAP[lang.split('-')[0]] || 'en'
}

export async function speak(text: string, lang = 'en'): Promise<void> {
  stop()
  if (!text.trim()) return

  const normalizedLang = normalizeLang(lang)
  const serverOk = await speakWithServer(text, normalizedLang)
  if (!serverOk) {
    await speakWithWebSpeech(text, lang)
  }
}

export function stop(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  speechSynthesis?.cancel()
  setIsSpeaking(false)
}

export function getIsSpeaking(): boolean {
  return isSpeakingFlag
}

export function onSpeakingChange(cb: (speaking: boolean) => void): () => void {
  onStateChange = cb
  return () => { if (onStateChange === cb) onStateChange = null }
}
