import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getScenario } from "../lib/scenarios";
import { streamChat, type Msg } from "../lib/streamChat";
import { createChecklist, updateChecklist, getCompletionPercentage, evaluateConsultation, type OsceEvaluation, type ChecklistCategory } from "../lib/osce";
import { saveResult, saveSession, loadSession, clearSession } from "../lib/progress";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useIsMobile } from "../hooks/useIsMobile";
import TalkingAvatar from "../components/novapatient/TalkingAvatar";
import ConsultationTimer from "../components/novapatient/ConsultationTimer";
import HistoryChecklist from "../components/novapatient/HistoryChecklist";
import FeedbackCard from "../components/novapatient/FeedbackCard";
import PatientBrief from "../components/novapatient/PatientBrief";
import ConfirmDialog from "../components/novapatient/ConfirmDialog";
import ProductNav from "../components/ProductNav";
import ReactMarkdown from "react-markdown";

const CONSULTATION_DURATION = 8 * 60;

type Phase = "active" | "evaluating" | "feedback";

export default function NovaPatientChat() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const scenarioCode = params.get("scenario") || "";
  const scenario = getScenario(scenarioCode);
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [phase, setPhase] = useState<Phase>("active");
  const [evaluation, setEvaluation] = useState<OsceEvaluation | null>(null);
  const [checklist, setChecklist] = useState<ChecklistCategory[]>(createChecklist());
  const [showChecklist, setShowChecklist] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [initialDuration, setInitialDuration] = useState(CONSULTATION_DURATION);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, start: startListening, stop: stopListening, setTranscript } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  const [sessionChecked, setSessionChecked] = useState(false);
  useEffect(() => {
    if (!scenario) return;
    const saved = loadSession();
    if (saved && saved.scenarioCode === scenarioCode) {
      setMessages(saved.messages as Msg[]);
      const savedCovered = new Set(
        (saved.checklist as ChecklistCategory[]).filter(c => c.covered).map(c => c.id)
      );
      setChecklist(createChecklist().map(c => savedCovered.has(c.id) ? { ...c, covered: true } : c));
      setInitialDuration(saved.remainingSeconds);
    }
    setSessionChecked(true);
  }, [scenario, scenarioCode]);

  useEffect(() => {
    if (phase !== "active" || !scenarioCode || messages.length === 0) return;
    const timer = setInterval(() => {
      const timerEl = document.querySelector("[data-remaining]");
      const remaining = timerEl ? parseInt(timerEl.getAttribute("data-remaining") || "0", 10) : CONSULTATION_DURATION;
      saveSession({ scenarioCode, messages, checklist, remainingSeconds: remaining, savedAt: new Date().toISOString() });
    }, 10000);
    return () => clearInterval(timer);
  }, [phase, scenarioCode, messages, checklist]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  // Stop mic when TTS/avatar is playing to prevent feedback loop
  useEffect(() => {
    if (isSpeaking && isListening) stopListening();
  }, [isSpeaking, isListening, stopListening]);

  // First-time open: fetch and speak the patient's initial greeting so there is voice immediately
  const initialGreetingSent = useRef(false);
  useEffect(() => {
    if (!sessionChecked || phase !== "active" || !scenarioCode || !scenario || messages.length > 0 || initialGreetingSent.current) return;
    initialGreetingSent.current = true;
    let assistantSoFar = "";
    setIsLoading(true);
    streamChat({
      messages: [],
      scenario: scenarioCode,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        if (assistantSoFar.trim()) speak(assistantSoFar);
      },
      onError: () => { setIsLoading(false); initialGreetingSent.current = false; },
    }).catch(() => { setIsLoading(false); initialGreetingSent.current = false; });
  }, [sessionChecked, phase, scenarioCode, scenario, messages.length, speak]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !scenario || phase !== "active") return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTranscript("");
    setIsLoading(true);
    setError(null);
    setChecklist(prev => updateChecklist(prev, text));

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      await streamChat({
        messages: allMessages,
        scenario: scenarioCode,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => {
          setIsLoading(false);
          if (assistantSoFar) speak(assistantSoFar);
        },
        onError: (err) => { setIsLoading(false); setError(err); },
      });
    } catch { setIsLoading(false); setError("Connection error. Please try again."); }
  }, [isLoading, messages, scenario, scenarioCode, setTranscript, speak, phase]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } };

  const toggleMic = () => {
    if (isListening) { stopListening(); if (transcript.trim()) send(transcript); }
    else if (!isSpeaking) { setTranscript(""); startListening(); }
  };

  const endConsultation = useCallback(async () => {
    setTimerRunning(false);
    stopSpeaking();
    if (isListening) stopListening();
    setPhase("evaluating");
    clearSession();

    if (messages.length < 2) {
      const fallback: OsceEvaluation = { history_taking: { score: 0, feedback: "No consultation took place." }, communication: { score: 0, feedback: "" }, clinical_reasoning: { score: 0, feedback: "" }, patient_centered: { score: 0, feedback: "" }, overall_score: 0, grade: "Fail", summary: "The consultation was too short to evaluate.", missed_areas: ["No history taken"], strengths: [] };
      setEvaluation(fallback);
      await saveResult({ scenarioCode, score: 0, grade: "Fail", completedAt: new Date().toISOString() });
      setPhase("feedback");
      return;
    }

    const result = await evaluateConsultation(messages, scenarioCode);
    if (result) {
      setEvaluation(result);
      await saveResult({
        scenarioCode,
        score: result.overall_score,
        grade: result.grade,
        completedAt: new Date().toISOString(),
        metadata: {
          history_taking: result.history_taking.score,
          communication: result.communication.score,
          clinical_reasoning: result.clinical_reasoning.score,
          patient_centered: result.patient_centered.score,
        },
      });
    } else {
      const pct = getCompletionPercentage(checklist);
      const approxScore = Math.round((pct / 100) * 40);
      const grade = approxScore >= 33 ? "Distinction" : approxScore >= 25 ? "Pass" : approxScore >= 16 ? "Borderline" : "Fail";
      const fallback: OsceEvaluation = { history_taking: { score: Math.round((pct / 100) * 10), feedback: `Covered ${pct}% of checklist.` }, communication: { score: 5, feedback: "Estimated." }, clinical_reasoning: { score: 5, feedback: "Estimated." }, patient_centered: { score: 5, feedback: "Estimated." }, overall_score: approxScore, grade, summary: `Full evaluation unavailable. Estimated ${approxScore}/40 from ${pct}% checklist coverage.`, missed_areas: checklist.filter(c => !c.covered).map(c => c.label), strengths: checklist.filter(c => c.covered).map(c => c.label) };
      setEvaluation(fallback);
      await saveResult({ scenarioCode, score: approxScore, grade, completedAt: new Date().toISOString() });
    }
    setPhase("feedback");
  }, [messages, scenarioCode, checklist, isListening, stopListening, stopSpeaking]);

  const handleTimeUp = useCallback(() => { endConsultation(); }, [endConsultation]);

  const retryCase = () => {
    setMessages([]); setChecklist(createChecklist()); setEvaluation(null);
    setTimerRunning(true); setInitialDuration(CONSULTATION_DURATION); setPhase("active"); setError(null); clearSession();
  };

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-5">
        <p className="text-secondary mb-4">Scenario not found</p>
        <Link to="/nova-patient" className="btn-primary">Back to Scenarios</Link>
      </div>
    );
  }

  if (phase === "evaluating") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in px-5">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5">
          <svg className="h-5 w-5 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
        <h2 className="text-lg font-bold text-primary mb-1">Evaluating consultation</h2>
        <p className="text-sm text-secondary">Scoring your consultation across 4 domains...</p>
      </div>
    );
  }

  if (phase === "feedback" && evaluation) {
    return (
      <div className="max-w-3xl mx-auto py-8 animate-in px-5">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/nova-patient")} className="btn-ghost h-8 w-8 p-0 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h1 className="text-sm font-bold text-primary">OSCE Results</h1>
            <p className="text-xs text-secondary">{scenario.patient.name} &middot; {scenario.name}</p>
          </div>
        </div>
        <FeedbackCard evaluation={evaluation} onRetry={retryCase} onNewScenario={() => navigate("/nova-patient")} scenarioName={scenario.name} patientName={scenario.patient.name} />
      </div>
    );
  }

  const completionPct = getCompletionPercentage(checklist);

  return (
    <div className="h-screen flex flex-col">
      <ConfirmDialog
        open={showEndConfirm}
        title="End consultation?"
        message="Your conversation will be evaluated. You'll receive OSCE-style scores across 4 domains."
        confirmLabel="End & Evaluate"
        cancelLabel="Continue"
        danger
        onConfirm={() => { setShowEndConfirm(false); endConsultation(); }}
        onCancel={() => setShowEndConfirm(false)}
      />

      {/* Top bar */}
      <div className="shrink-0 border-b flex items-center justify-between h-14 px-5" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
        <div className="flex items-center gap-3">
          <ProductNav current="NovaPatient" />
          <div className="h-4 w-px bg-(--card-border)" />
          <div>
            <span className="text-xs font-semibold text-primary">{scenario.patient.name}</span>
            <span className="text-xs text-secondary ml-2">{scenario.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && <HistoryChecklist checklist={checklist} compact />}
          <button
            onClick={() => messages.length > 0 ? setShowEndConfirm(true) : endConsultation()}
            disabled={messages.length === 0}
            className="h-8 rounded-md border border-red-500/20 bg-red-500/5 px-3.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30"
          >
            End
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar (desktop) */}
        {!isMobile && (
          <div className="w-72 shrink-0 border-r overflow-y-auto p-4 space-y-4" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
            <TalkingAvatar
              isSpeaking={isSpeaking} isListening={isListening}
              scenarioName={scenario.name}
              patientGender={scenario.patient.gender} patientName={scenario.patient.name}
            />

            <div className="border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
              <PatientBrief patient={scenario.patient} />
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
              <ConsultationTimer durationSeconds={initialDuration} running={timerRunning} onTimeUp={handleTimeUp} />
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
              <HistoryChecklist checklist={checklist} />
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile header strip */}
          {isMobile && (
            <div className="shrink-0 border-b p-3 space-y-3" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
              <TalkingAvatar
                isSpeaking={isSpeaking} isListening={isListening}
                scenarioName={scenario.name}
                patientGender={scenario.patient.gender} patientName={scenario.patient.name}
                compact
              />
              <div className="flex items-center justify-between">
                <ConsultationTimer durationSeconds={initialDuration} running={timerRunning} onTimeUp={handleTimeUp} />
                <button onClick={() => setShowChecklist(!showChecklist)} className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  Checklist ({completionPct}%)
                  <svg className={`w-3 h-3 transition-transform ${showChecklist ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
              </div>
              {showChecklist && <div className="animate-in"><HistoryChecklist checklist={checklist} /></div>}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {/* Welcome */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-500 mt-0.5">P</div>
              <div className="rounded-xl rounded-tl-none px-4 py-3 max-w-[80%] text-sm" style={{ background: 'var(--subtle-bg)' }}>
                <p className="text-primary text-sm">Hello doctor. I&apos;ve come in because I&apos;m not feeling well. What would you like to know?</p>
              </div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-500 mt-0.5">P</div>
                )}
                <div className={`rounded-xl px-4 py-2.5 max-w-[80%] text-sm ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "rounded-tl-none text-primary"
                }`} style={m.role === "assistant" ? { background: 'var(--subtle-bg)' } : undefined}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0 text-sm">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : <p>{m.content}</p>}
                </div>
                {m.role === "assistant" && (
                  <button onClick={() => speak(m.content)} className="btn-ghost h-7 w-7 p-0 shrink-0 mt-0.5" title="Speak">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                  </button>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-500 mt-0.5">P</div>
                <div className="rounded-xl rounded-tl-none px-4 py-3" style={{ background: 'var(--subtle-bg)' }}>
                  <div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: "0ms" }} /><span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: "150ms" }} /><span className="h-1.5 w-1.5 rounded-full bg-zinc-400/50 animate-bounce" style={{ animationDelay: "300ms" }} /></div>
                </div>
              </div>
            )}

            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-500">{error}</div>}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t p-3 safe-bottom" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex gap-2 items-end max-w-3xl mx-auto">
              <button
                onClick={toggleMic}
                disabled={isSpeaking && !isListening}
                className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  isListening ? "bg-red-600 text-white animate-pulse"
                  : isSpeaking ? "opacity-30 cursor-not-allowed btn-secondary p-0!"
                  : "btn-secondary p-0!"
                }`}
                title={isListening ? "Stop & send" : isSpeaking ? "Speaker active" : "Record"}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the patient a question..."
                rows={1}
                className="flex-1 min-h-[40px] max-h-28 resize-none rounded-lg border px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading}
                className="btn-primary shrink-0 h-9 w-9 p-0! disabled:opacity-40"
                title="Send"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
