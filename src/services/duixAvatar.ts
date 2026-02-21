/**
 * Duix-Avatar integration: send text to local Duix-Avatar for TTS/video synthesis.
 * Requires Duix-Avatar Docker services running (see https://github.com/duixcom/Duix-Avatar).
 * Uses relative /api/duix-* URLs so Vite dev proxy (or production reverse proxy) can
 * forward to 127.0.0.1 without CORS issues.
 */
const DUIX_AUDIO_BASE = '/api/duix-audio'
const DUIX_VIDEO_BASE = '/api/duix-video'
const AUDIO_INVOKE_URL = `${DUIX_AUDIO_BASE}/v1/invoke`
const VIDEO_SUBMIT_URL = `${DUIX_VIDEO_BASE}/easy/submit`
const VIDEO_QUERY_URL = `${DUIX_VIDEO_BASE}/easy/query`

const DUIX_STORAGE_KEY = 'novate-persona-duix-config'

export interface DuixConfig {
  speakerUuid?: string
  referenceAudioUrl?: string
  referenceText?: string
}

let duixConfig: DuixConfig | null = null

export function setDuixConfig(config: DuixConfig | null) {
  duixConfig = config
}

export function getDuixConfigFromStorage(): DuixConfig | null {
  try {
    const raw = localStorage.getItem(DUIX_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DuixConfig
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveDuixConfigToStorage(config: DuixConfig) {
  try {
    localStorage.setItem(DUIX_STORAGE_KEY, JSON.stringify(config))
    setDuixConfig(config)
  } catch {
    // ignore
  }
}

/** Apply saved Duix voice config so TTS can run. Call on app init. */
export function loadAndApplyDuixConfig(): void {
  const saved = getDuixConfigFromStorage()
  if (saved?.referenceAudioUrl && saved?.referenceText) setDuixConfig(saved)
}

/** Check if Duix-Avatar TTS service (port 18180) is reachable. */
export async function checkDuixAvatarAvailable(): Promise<boolean> {
  try {
    // POST to TTS invoke; 400/422 = service up but bad request, which is fine
    await fetch(AUDIO_INVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    return true // any response (including 400) means the service is running
  } catch {
    return false
  }
}

/**
 * Synthesize speech from text using Duix-Avatar Fish-Speech TTS.
 * Returns blob URL of WAV if successful.
 */
export async function synthesizeSpeech(text: string): Promise<string | null> {
  if (!duixConfig?.speakerUuid || !duixConfig.referenceAudioUrl || !duixConfig.referenceText) {
    return null
  }
  try {
    const res = await fetch(AUDIO_INVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        speaker: duixConfig.speakerUuid,
        text,
        format: 'wav',
        topP: 0.7,
        max_new_tokens: 1024,
        chunk_length: 100,
        repetition_penalty: 1.2,
        temperature: 0.7,
        need_asr: false,
        streaming: false,
        is_fixed_seed: 0,
        is_norm: 0,
        reference_audio: duixConfig.referenceAudioUrl,
        reference_text: duixConfig.referenceText,
      }),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/**
 * Submit video synthesis job (avatar + audio).
 * code: unique task id; audio_url, video_url: paths agreed with Docker volumes.
 */
export async function submitVideoSynthesis(params: {
  code: string
  audio_url: string
  video_url: string
}): Promise<boolean> {
  try {
    const res = await fetch(VIDEO_SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        chaofen: 0,
        watermark_switch: 0,
        pn: 1,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function queryVideoProgress(code: string): Promise<unknown> {
  try {
    const res = await fetch(`${VIDEO_QUERY_URL}?code=${encodeURIComponent(code)}`)
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}
