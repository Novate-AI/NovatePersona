import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  language?: string
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition
      webkitSpeechRecognition?: typeof SpeechRecognition
    }
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition))
  }, [])

  const checkSupport = useCallback(() => {
    const w = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition
      webkitSpeechRecognition?: typeof SpeechRecognition
    }
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition
    setSupported(!!R)
    return !!R
  }, [])

  const start = useCallback(
    (lang?: string) => {
      const w = window as Window & {
        SpeechRecognition?: new () => SpeechRecognition
        webkitSpeechRecognition?: new () => SpeechRecognition
      }
      const R = w.SpeechRecognition ?? w.webkitSpeechRecognition
      if (!R) {
        options.onError?.('Speech recognition not supported in this browser.')
        return
      }
      const recognition = new R()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = lang ?? options.language ?? 'en-US'
      recognition.onresult = (e: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          const t = r[0].transcript
          if (r.isFinal) finalTranscript += t
          else interimTranscript += t
        }
        const full = (finalTranscript || transcript) + interimTranscript
        setTranscript(full)
        options.onResult?.(full, !!finalTranscript)
      }
      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        options.onError?.(e.error)
      }
      recognition.onend = () => {
        setIsListening(false)
      }
      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    },
    [options, transcript],
  )

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  return { isListening, transcript, supported, checkSupport, start, stop, setTranscript }
}
