import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, userName } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const transcript = messages.map((m: { role: string; content: string }) =>
      `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`
    ).join("\n\n");

    const systemPrompt = `You are an expert language education assessor. Analyze the following ${language} tutoring conversation and produce a professional assessment report. Do NOT use emojis. Use plain text only.

Format the report EXACTLY as follows:

STUDENT PERFORMANCE REPORT
==========================

Student Name: ${userName || "Student"}
Language: ${language}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
Duration: Approximately ${Math.ceil(messages.length / 2)} exchanges

CONVERSATION SUMMARY
---------------------
[Write a 2-3 sentence summary of what was covered in the conversation]

VOCABULARY LEARNED
-------------------
[List each new word or phrase taught, with its meaning. Format: "word/phrase - meaning".]

MISTAKES AND CORRECTIONS
--------------------------
[List each mistake the student made and how it was corrected. Format: "Mistake: X -> Correction: Y".]

STRENGTHS
----------
[List 2-3 things the student did well]

AREAS FOR IMPROVEMENT
----------------------
[List 2-3 specific areas the student should work on]

RECOMMENDATIONS
----------------
[Provide 3-4 actionable recommendations for how the student can improve]

OVERALL ASSESSMENT
-------------------
[Give an overall assessment of the student's current level and progress potential in 2-3 sentences]`;

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
          { role: "user", content: `Here is the conversation transcript:\n\n${transcript}` },
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
    console.error("feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
