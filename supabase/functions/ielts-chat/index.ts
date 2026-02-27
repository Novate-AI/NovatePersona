import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, instruction } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const systemPrompt = `You are Tom, a formal and professional IELTS Speaking Test examiner from the UK. Follow these rules strictly:

1. You are conducting an official IELTS Speaking test. Be professional, polite, and formal like a real examiner.
2. NEVER use emojis or emoticons. Use only plain text.
3. Do NOT provide any feedback, corrections, or comments on the candidate's answers during the test.
4. Use natural British English. Speak clearly and at a measured pace.
5. Do NOT deviate from the exam structure. Only say what the instruction tells you to say.
6. Keep responses concise and examiner-like. Do not add unnecessary commentary.
7. NEVER break character. You are an examiner, not a tutor.

CRITICAL: You must say EXACTLY what the "instruction" field tells you. Do not add extra content, do not introduce yourself again. Just deliver the scripted line naturally as an examiner would.

NATURAL SPEECH FORMATTING:
- Write in flowing, conversational sentences.
- Use commas for short pauses and periods for longer pauses.
- Avoid numbered lists, bullet points, or markdown formatting.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          ...(instruction
            ? [{ role: "user", content: `[EXAMINER INSTRUCTION - not visible to candidate]: ${instruction}` }]
            : []),
        ],
        stream: true,
        temperature: 0.4,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Groq error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ielts-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
