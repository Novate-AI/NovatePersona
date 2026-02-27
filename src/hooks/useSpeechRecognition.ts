import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language code for recognition (e.g. "en-US", "en-GB") */
  lang?: string
  /** Alias for lang — kept for backward compatibility */
  language?: string
  /** Called with the final recognised transcript */
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition
      webkitSpeechRecognition?: typeof SpeechRecognition
    }
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition))
  }, [])

  const start = useCallback(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition
      webkitSpeechRecognition?: new () => SpeechRecognition
    }
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!R) {
      optionsRef.current.onError?.('Speech recognition not supported in this browser.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    const recognition = new R()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = optionsRef.current.lang ?? optionsRef.current.language ?? 'en-US'

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0].transcript
        if (r.isFinal) finalTranscript += t
        else interimTranscript += t
      }
      const combined = finalTranscript + interimTranscript
      setTranscript(combined)
      if (finalTranscript) {
        optionsRef.current.onResult?.(finalTranscript.trim())
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        optionsRef.current.onError?.(e.error)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  return {
    isListening,
    transcript,
    /** Whether speech recognition is supported in this browser */
    supported,
    /** Alias for supported — used by newer components */
    isSupported: supported,
    start,
    stop,
    setTranscript,
  }
}
