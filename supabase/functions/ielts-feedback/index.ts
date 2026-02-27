import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const transcript = messages.map((m: { role: string; content: string }) =>
      `${m.role === "user" ? "Candidate" : "Examiner"}: ${m.content}`
    ).join("\n\n");

    const systemPrompt = `You are an expert IELTS Speaking examiner and assessor. Analyze the following IELTS Speaking test transcript and produce a detailed band score report. Do NOT use emojis. Use plain text only.

Format the report EXACTLY as follows:

IELTS SPEAKING TEST REPORT
============================

Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

OVERALL BAND SCORE: [X.0 or X.5, from 1-9]

CRITERION SCORES
------------------

Fluency and Coherence: [Band 1-9]
[2-3 sentences explaining the score.]

Lexical Resource: [Band 1-9]
[2-3 sentences explaining the score.]

Grammatical Range and Accuracy: [Band 1-9]
[2-3 sentences explaining the score.]

Pronunciation: [Band 1-9]
[2-3 sentences explaining the score.]

PERFORMANCE SUMMARY
---------------------
[3-4 sentences summarizing overall performance.]

STRENGTHS
----------
[List 3-4 specific things the candidate did well.]

AREAS FOR IMPROVEMENT
-----------------------
[List 3-4 specific areas to improve.]

RECOMMENDATIONS
-----------------
[Provide 4-5 actionable recommendations for improving the IELTS Speaking score.]

Note: Base your assessment strictly on the IELTS Speaking Band Descriptors. Be fair but honest.`;

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
          { role: "user", content: `Here is the IELTS Speaking test transcript:\n\n${transcript}` },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate feedback" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Could not generate feedback.";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ielts-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
