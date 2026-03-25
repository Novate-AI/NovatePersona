/** OpenAI first, Groq fallback — matches NovatepersonaBackend/llm.py */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Chat completions: tries OPENAI_API_KEY + OPENAI_MODEL, then GROQ_API_KEY + llama-3.3-70b-versatile.
 * Set secrets in Supabase: OPENAI_API_KEY, OPENAI_MODEL (optional), GROQ_API_KEY (fallback).
 */
export async function fetchOpenAiThenGroq(
  payload: Record<string, unknown>,
): Promise<Response> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

  if (openaiKey && openaiKey !== "your_openai_key_here") {
    const r = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, model: openaiModel }),
    });
    if (r.ok) return r;
    const errText = await r.text();
    console.error("OpenAI failed, falling back to Groq:", r.status, errText.slice(0, 800));
  }

  if (!groqKey || groqKey === "your_groq_key_here") {
    return new Response(
      JSON.stringify({
        error:
          "No LLM configured. Set OPENAI_API_KEY (primary) or GROQ_API_KEY (fallback) in Edge Function secrets.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  return await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, model: DEFAULT_GROQ_MODEL }),
  });
}
