import { useState, useCallback } from 'react'
import ChatBox from '../components/ChatBox'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { sendChatMessage, type PersonaMode } from '../services/chatApi'
import type { ChatMessage } from '../types'

const DEFAULT_CASE = {
  chiefComplaint: 'Chest pain and shortness of breath',
  age: 52,
  gender: 'Male',
  hints: ['Cardiac', 'Anxiety', 'GERD'],
}

export default function NovaMedica() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [caseBrief, setCaseBrief] = useState(DEFAULT_CASE)

  const { transcript, supported, start, stop, isListening } = useSpeechRecognition({
    language: 'en-GB',
  })

  const handleSend = useCallback(
    async (content: string) => {
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
          mode: 'nova-medica' as PersonaMode,
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
    [messages],
  )

  const startNewCase = useCallback(() => {
    setMessages([])
    setCaseBrief(DEFAULT_CASE)
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in">
      {/* Clinical Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600/10 to-teal-600/10 border border-white/10 p-8 sm:p-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Clinical Simulator Active
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-slate-900 dark:text-white">NovaMedica</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Practice high-fidelity medical history taking with realistic patients showing specific symptoms.
              Refine your clinical reasoning in a safe environment.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass-card !p-6 flex flex-col items-center justify-center min-w-[140px] text-center">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">#001</span>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-widest mt-1">Patient ID</span>
            </div>
          </div>
        </div>

        {/* Abstract background element */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Interaction Area */}
        <div className="lg:col-span-8 space-y-6">
          <ChatBox
            messages={messages}
            onSend={handleSend}
            disabled={loading}
            loading={loading}
            placeholder="Ask the patient about their symptoms..."
            micSupported={supported}
            isListening={isListening}
            onMicToggle={() => (isListening ? stop() : start())}
            transcript={transcript}
          />
        </div>

        {/* Clinical Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card !p-6 border-emerald-500/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Case Brief
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presenting Complaint</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 underline decoration-emerald-500/30 underline-offset-4">
                  {caseBrief.chiefComplaint}
                </p>
              </div>

              <div className="flex gap-8">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{caseBrief.age}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{caseBrief.gender}</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Vitals</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {caseBrief.hints?.map(hint => (
                    <span key={hint} className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startNewCase}
              className="mt-8 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-3 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95"
            >
              Rotate Patient (New Case)
            </button>
          </div>

          <div className="glass-card !p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Guidelines</h3>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>Use open-ended questions first (SOCRATES).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>Screen for red flags related to chest pain.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>Consider systemic and lifestyle factors.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
