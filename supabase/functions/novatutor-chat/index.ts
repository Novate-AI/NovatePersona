import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchOpenAiThenGroq } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageNames: Record<string, string> = {
  ar: "Arabic", en: "English", es: "Spanish", fr: "French", zh: "Mandarin Chinese",
  ja: "Japanese", de: "German", it: "Italian", pt: "Portuguese", ko: "Korean",
};

const nonLatinScripts = ["ar", "zh", "ja", "ko"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, nativeLanguage, showSuggestions, cefrLevel } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const langName = languageNames[language] || "English";
    const nativeLangName = nativeLanguage ? (languageNames[nativeLanguage] || nativeLanguage) : null;
    const needsTransliteration = nativeLanguage && nonLatinScripts.includes(nativeLanguage);
    const isFirstMessage = !messages || messages.length === 0;
    const level = cefrLevel || "A2";

    const cefrDescriptions: Record<string, string> = {
      A1: "absolute beginner — use only the simplest words and very short sentences (3-5 words). Speak slowly, repeat key words, and stick to basic greetings, numbers, colors, and everyday objects.",
      A2: "beginner — use simple vocabulary, short sentences, and present tense mostly. Introduce common everyday topics like family, shopping, and daily routines.",
      B1: "intermediate — use a wider range of vocabulary and some complex sentences. Discuss familiar topics like work, travel, and hobbies. Introduce past and future tenses.",
      B2: "upper intermediate — use varied vocabulary, complex grammar, idioms, and discuss abstract topics. Challenge the user with nuanced expressions and conditional sentences.",
      C1: "advanced — use sophisticated vocabulary, complex structures, and nuanced expressions. Discuss current events, professional topics, and abstract ideas fluently.",
      C2: "mastery level — converse as you would with a native speaker. Use idiomatic expressions, subtle humor, cultural references, and complex argumentation.",
    };
    const levelDesc = cefrDescriptions[level] || cefrDescriptions["A2"];

    const tutorIntro = `"Hi, I am Novate Abby, your ${langName} tutor. Nice to meet you! May I know your native language?"`;

    let systemPrompt = `You are Novate Abby, a friendly, cheerful, and encouraging AI language tutor. You teach ${langName}. Follow these rules strictly:

1. Your persona: You are Novate Abby. Be warm, charming, and enthusiastic. Use a conversational tone appropriate for ${langName}.
2. NEVER use emojis or emoticons in your responses. Use only plain text words.
3. IMPORTANT: The user's CEFR level is ${level} (${levelDesc}). You MUST match your vocabulary, sentence complexity, and topics to this level. Do not exceed the user's level significantly.
4. IMPORTANT: Only introduce yourself in the VERY FIRST message of a conversation. Do NOT repeat your introduction. ${isFirstMessage ? `For this first message, introduce yourself: ${tutorIntro}` : "This is NOT the first message - do NOT introduce yourself again. Just continue the conversation naturally."}
5. Keep responses conversational and concise (2-4 sentences usually).
6. If the user writes in ${langName}, praise their effort, correct any mistakes gently, and continue the conversation.
7. Gradually increase difficulty as the user improves, but stay within the ${level} range.
8. Occasionally teach a new vocabulary word or useful phrase appropriate for ${level} level.
9. If the user seems stuck, offer helpful hints or simpler alternatives.

CHILD SAFETY RULES (strictly enforced):
- All content must be suitable for children aged 8 and above.
- If the user tries to discuss inappropriate topics, respond warmly: "That is not really my area! How about we learn some fun words about animals, food, or sports instead?"

NATURAL SPEECH FORMATTING (strictly enforced):
- Write in flowing, conversational sentences. Avoid numbered lists or bullet points in your main response.
- Use contractions: "don't", "I'm", "let's".
- Avoid technical grammar jargon. Explain corrections in simple, conversational words.`;

    if (nativeLangName) {
      systemPrompt += `
10. The user's native language is ${nativeLangName}. After your ${langName} response, ALWAYS add a translation section on a new line starting exactly with "TRANSLATION:" followed by the translation in ${nativeLangName}.`;
      if (needsTransliteration) {
        systemPrompt += `
11. Since ${nativeLangName} uses a non-Latin script, after the translation also add a line starting exactly with "TRANSLITERATION:" followed by the transliteration in Latin letters.`;
      }
    }

    if (showSuggestions) {
      const sugNum = nativeLangName ? (needsTransliteration ? "12" : "11") : "10";
      systemPrompt += `
${sugNum}. At the end of EVERY response, provide exactly 3 short suggested replies the user could say next, formatted EXACTLY as:
SUGGESTIONS:
1. [suggestion in ${langName}]
2. [suggestion in ${langName}]
3. [suggestion in ${langName}]
Make sure the suggestions match the ${level} CEFR level in complexity.`;
    }

    const response = await fetchOpenAiThenGroq({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    if (!response.ok) {
      if (response.status === 503) {
        const err = await response.json();
        return new Response(JSON.stringify(err), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("LLM error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("novatutor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
