/**
 * Chat API: Points to our local Node.js backend to hide API keys.
 * Backend should be running at http://localhost:3001
 */

import { LANGUAGES, type ChatMessage } from '../types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/chat';

/** Shown and spoken as the initial Novatutor welcome. */
export const NOVATUTOR_WELCOME =
  "Hey! Tom here. Ready to practice? Pick a topic or just chat in your target language — I'll keep it at your level and throw in corrections when useful."

export type PersonaMode = 'novatutor' | 'nova-ielts' | 'nova-ielts-eval' | 'nova-patient'

export interface ChatApiOptions {
  mode: PersonaMode
  language?: string
  cefrLevel?: string
  ieltsPart?: number
}

const SYSTEM_PROMPTS: Record<PersonaMode, (opts: ChatApiOptions) => string> = {
  novatutor: (opts) => {
    const langName = LANGUAGES.find(l => l.code === opts.language)?.name || opts.language || 'English';
    return `
    You are Novatutor, an AI language tutor with the friendly, energetic persona of actor Tom Holland.
    Current Task: Help the user practice speaking ${langName} at CEFR level ${opts.cefrLevel || 'B1'}.
    
    Rules:
    1. ALWAYS respond primarily in ${langName}. Use the energy and slang of Tom Holland (e.g., 'mate', 'wicked') but adapted to ${langName}.
    2. Adjust your vocabulary/complexity to the ${opts.cefrLevel || 'B1'} level of ${langName}.
    3. If the user makes ANY mistake (grammar, spelling, vocabulary, word order, prepositions, tense, etc.), you MUST correct it at the END of your message. Format: "Correction: [original] → [corrected] — [clear explanation in English of WHY it's wrong and the rule behind it]". Be specific and educational. Examples:
       - "Correction: I watn → I want — 'watn' is a misspelling; the correct word is 'want' (to desire something)"
       - "Correction: pipeapple → pineapple — spelling error; 'pineapple' is spelled p-i-n-e-a-p-p-l-e"
       - "Correction: I goed → I went — 'go' is an irregular verb; past tense is 'went', not 'goed'"
       - "Correction: I am agree → I agree — 'agree' is a verb, not an adjective; don't use 'am' before it"
       If there are multiple mistakes, list each one on a separate "Correction:" line. If there are no mistakes, add "Correction: None needed, you're speaking like a pro!".
    4. Stay in character as Tom Holland (casual, positive).
    5. At the very end of your response, provide 3 suggested short replies for the user in ${langName}, each on a new line starting with "Suggestion: ".
    6. MANDATORY: provide a full translation of your entire response into English in this format: "Translation: [your response translated to English]".
  `;
  },
  'nova-ielts': (opts) => `
    You are an official IELTS Speaking Examiner. 
    You are conducting Part ${opts.ieltsPart || 1} of the IELTS Speaking test.
    
    Part 1: Introduction and interview on familiar topics.
    Part 2: Long turn (ensure you give them a specific topic to talk about for 2 minutes).
    Part 3: Two-way discussion on abstract issues.
    
    Rules:
    1. Be professional, neutral, and firm but polite.
    2. Do NOT provide feedback or corrections during the test.
    3. Ask ONLY one question at a time.
    4. Wait for the user to respond before moving to the next question.
  `,
  'nova-patient': () => `
    You are a patient in a medical clinic. Your name is Alex. 
    You are here because you have been experiencing recurring chest pain for the last 2 weeks.
    
    Your History:
    - Age: 45
    - Pain: Sharp, occurs 3-4 times a day, lasts 10 mins. Sits behind the breastbone.
    - Triggers: Stress, heavy meals.
    - Background: Smoker (10/day), high stress job, father had a heart attack at 50.
    
    Rules:
    1. ONLY answer the doctor's questions. 
    2. Do not volunteer all information at once; let the doctor "clerk" you.
    3. Sound slightly anxious but cooperative.
  `,
  'nova-ielts-eval': () => `
    You are a senior IELTS Speaking examiner providing band score feedback.
    The user will give you a transcript of an IELTS Speaking test conversation between an Examiner and a Candidate.
    
    Evaluate the Candidate's performance and provide scores in this EXACT format:
    
    Fluency: [score 0-9]
    Vocabulary: [score 0-9]
    Grammar: [score 0-9]
    Pronunciation: [score 0-9]
    Overall: [score 0-9]
    
    Then provide 2-3 sentences of constructive feedback explaining strengths and areas for improvement.
    Base scores on IELTS band descriptors. Be fair but realistic. If the conversation is very short, reflect that in your scores.
  `,
}

export async function sendChatMessage(
  messages: ChatMessage[],
  options: ChatApiOptions,
): Promise<{ content: string; meta?: ChatMessage['meta'] }> {
  
  const systemPrompt = SYSTEM_PROMPTS[options.mode](options)
  
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ]

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: groqMessages,
        model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || err.error || 'Failed to fetch from backend')
    }

    const data = await response.json()
    let text = data.choices[0]?.message?.content || ''
    
    // Parse Sugggestions and Corrections if present
    const meta: ChatMessage['meta'] = {}
    const lines = text.split('\n')
    const suggestions: string[] = []
    const cleanedLines: string[] = []

    const corrections: string[] = []

    for (const line of lines) {
      if (line.trim().startsWith('Suggestion:')) {
        suggestions.push(line.replace('Suggestion:', '').trim())
      } else if (line.trim().startsWith('Correction:')) {
        corrections.push(line.replace('Correction:', '').trim())
      } else if (line.trim().startsWith('Translation:')) {
        meta.translation = line.replace('Translation:', '').trim()
      } else {
        cleanedLines.push(line)
      }
    }

    if (corrections.length > 0) meta.correction = corrections.join('\n')

    if (suggestions.length > 0) meta.suggestedReplies = suggestions
    
    return { 
      content: cleanedLines.join('\n').trim(),
      meta 
    }

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return { 
      content: `Sorry, I encountered an error connecting to the backend: ${error.message}. Make sure your backend server is running.` 
    }
  }
}
