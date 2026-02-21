import { useState } from "react";
import { markOnboarded } from "../../lib/progress";

interface OnboardingModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to NovaPatient",
    body: "Practice OSCE-style consultations with realistic patients. Take a focused history in 8 minutes — just like the real exam.",
    icon: <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
  },
  {
    title: "Live checklist tracking",
    body: "As you ask questions, the sidebar checklist updates in real-time. Aim for 80%+ coverage across all history categories.",
    icon: <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  },
  {
    title: "Instant scored feedback",
    body: "When time's up, you receive scores across 4 OSCE domains: history-taking, communication, reasoning, and patient-centred care.",
    icon: <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
  },
];

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const done = () => { markOnboarded(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative glass-card max-w-sm w-full p-6 space-y-5 animate-slide-up text-center">
        <div className="flex justify-center">{current.icon}</div>
        <h2 className="text-lg font-bold text-primary">{current.title}</h2>
        <p className="text-sm text-secondary leading-relaxed">{current.body}</p>

        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-5 bg-emerald-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button onClick={done} className="text-sm font-medium text-secondary hover:text-primary transition-colors">Skip</button>
          <button onClick={isLast ? done : () => setStep(step + 1)} className="btn-primary px-5 py-2">{isLast ? "Start Practicing" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
