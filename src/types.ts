export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
] as const

export type MessageRole = 'user' | 'assistant' | 'system'

export interface IELTSPart {
  part: 1 | 2 | 3
  title: string
  instruction: string
  durationSeconds?: number
  prompt?: string
}

export interface IELTSBandFeedback {
  fluency: number
  vocabulary: number
  grammar: number
  pronunciation: number
  overall: number
  comments: string
}
