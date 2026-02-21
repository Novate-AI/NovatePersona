import { useState, useEffect } from 'react'
import { useDuix } from '../contexts/DuixContext'
import {
  getDuixConfigFromStorage,
  saveDuixConfigToStorage,
  type DuixConfig,
} from '../services/duixAvatar'

interface DuixSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function DuixSettings({ isOpen, onClose }: DuixSettingsProps) {
  const { refreshDuixStatus } = useDuix()
  const [speakerUuid, setSpeakerUuid] = useState('default')
  const [referenceAudioUrl, setReferenceAudioUrl] = useState('')
  const [referenceText, setReferenceText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const c = getDuixConfigFromStorage()
      setSpeakerUuid(c?.speakerUuid ?? 'default')
      setReferenceAudioUrl(c?.referenceAudioUrl ?? '')
      setReferenceText(c?.referenceText ?? '')
      setSaved(false)
    }
  }, [isOpen])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const config: DuixConfig = {
      speakerUuid: speakerUuid.trim() || 'default',
      referenceAudioUrl: referenceAudioUrl.trim(),
      referenceText: referenceText.trim(),
    }
    saveDuixConfigToStorage(config)
    refreshDuixStatus()
    setSaved(true)
    setTimeout(() => onClose(), 800)
  }

  const canSpeak = referenceAudioUrl.trim() && referenceText.trim()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h2 className="font-display text-lg font-semibold text-white">Duix-Avatar voice</h2>
        <p className="mt-1 text-sm text-slate-400">
          Paste the values from Duix model training so the app can speak replies.
        </p>
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Why isn’t the avatar speaking?</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5">
            <li>Start Duix-Avatar Docker (TTS on port 18180).</li>
            <li>Train a voice in Duix and copy <em>reference_audio</em> and <em>reference_text</em>.</li>
            <li>Paste them below and click Save.</li>
            <li>Status should show “✓ Connected”; then assistant replies will use the avatar voice.</li>
          </ol>
        </div>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-400">Speaker UUID</span>
            <input
              type="text"
              value={speakerUuid}
              onChange={(e) => setSpeakerUuid(e.target.value)}
              placeholder="default"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Reference audio URL</span>
            <input
              type="text"
              value={referenceAudioUrl}
              onChange={(e) => setReferenceAudioUrl(e.target.value)}
              placeholder="From Duix model training (asr_format_audio_url)"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Reference text</span>
            <textarea
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="From Duix model training (reference_audio_text)"
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <a
              href="https://github.com/duixcom/Duix-Avatar#open-apis"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand-400 hover:underline"
            >
              Duix API docs →
            </a>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
              >
                {saved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          </div>
        </form>
        {canSpeak && (
          <p className="mt-3 text-xs text-emerald-400">
            Voice configured. Assistant replies will be spoken when Duix is connected.
          </p>
        )}
      </div>
    </div>
  )
}
