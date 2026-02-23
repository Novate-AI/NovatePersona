/**
 * TTS service — Web Speech API (browser-native, no API key needed).
 * Picks the best available voice for the given language.
 */

let isSpeakingFlag = false
let onStateChange: ((speaking: boolean) => void) | null = null

function setIsSpeaking(value: boolean) {
  isSpeakingFlag = value
  onStateChange?.(value)
}

const PREFERRED_VOICES = [
  'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Aria', 'Microsoft Sonia',
  'Google US English', 'Google UK English Female', 'Google UK English Male',
  'Samantha', 'Daniel', 'Karen', 'Moira',
]

function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const langVoices = voices.filter(
    v => v.lang === lang || v.lang.startsWith(lang.split('-')[0])
  )
  for (const name of PREFERRED_VOICES) {
    const match = langVoices.find(v => v.name.includes(name))
    if (match) return match
  }
  return langVoices[0] ?? voices[0] ?? null
}

export function speak(text: string, lang = 'en'): void {
  stop()
  if (!text.trim() || !('speechSynthesis' in window)) return

  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.95
  u.pitch = 1

  const voice = getBestVoice(lang)
  if (voice) u.voice = voice

  u.onstart = () => setIsSpeaking(true)
  u.onend = () => setIsSpeaking(false)
  u.onerror = () => setIsSpeaking(false)

  window.speechSynthesis.speak(u)
}

export function stop(): void {
  window.speechSynthesis?.cancel()
  setIsSpeaking(false)
}

export function getIsSpeaking(): boolean {
  return isSpeakingFlag
}

export function onSpeakingChange(cb: (speaking: boolean) => void): () => void {
  onStateChange = cb
  return () => { if (onStateChange === cb) onStateChange = null }
}
