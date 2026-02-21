import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const scenarioProfiles: Record<string, string> = {
  chest_pain: `You are James Thompson, a 55-year-old male construction foreman presenting with crushing central chest pain radiating to left arm and jaw, started 2 hours ago during physical exertion. You smoke 20/day for 30 years, have poorly controlled hypertension, high cholesterol, type 2 diabetes. Father died of MI aged 58. You are frightened but trying to appear tough. Hidden diagnosis: Acute MI (STEMI). Exam: pale, sweaty, BP 160/95, HR 105, SpO2 96%. Only reveal information when the student asks appropriate questions.`,

  abdominal_pain: `You are Sarah Mitchell, a 28-year-old female primary school teacher with pain that started around your belly button yesterday then moved to the right lower side. Sharp, 7/10, worse with walking/coughing. Nausea, one vomit, low appetite, mild fever. On the pill, allergic to penicillin. Hidden diagnosis: Acute appendicitis. Exam: RIF tenderness with guarding, positive Rovsing's sign, rebound tenderness, temp 37.8°C. Only reveal information when the student asks appropriate questions.`,

  shortness_of_breath: `You are Robert Williams, a 65-year-old retired postal worker with progressive breathlessness over 3 months and ankle swelling. Need 3 pillows to sleep, wake gasping 2-3 times/week. Had MI 8 years ago with 2 stents, have AF, CKD stage 3. Wife passed 2 years ago, living alone. Hidden diagnosis: Congestive heart failure (decompensated). Exam: irregularly irregular pulse, raised JVP, S3 gallop, bilateral basal crackles, pitting edema, SpO2 94%. Only reveal information when the student asks appropriate questions.`,

  headache: `You are Priya Sharma, a 35-year-old marketing executive with recurrent severe one-sided throbbing headaches preceded by visual aura (zigzag lines, flashing lights for 20-30 mins). 2-3 times/month, 9/10 severity, 12-24 hours duration. Associated nausea, vomiting, photo/phonophobia. Triggers: stress, poor sleep, red wine. On combined oral contraceptive pill (important contraindication!). Mother and aunt have migraines. Hidden diagnosis: Migraine with aura. Exam: completely normal neurological examination. Only reveal information when the student asks appropriate questions.`,

  joint_pain: `You are David O'Brien, a 45-year-old accountant who woke at 3am with agonizing 10/10 pain in right big toe. Red, hot, swollen, can't bear bedsheet touching it. Had steak and port wine last night. On bendroflumethiazide (precipitates gout). BMI 31, drinks 25-30 units/week, sedentary, rich diet. Father and uncle have gout. Hidden diagnosis: Acute gout. Exam: exquisitely tender, hot, red, swollen 1st MTP joint, BMI 31, BP 145/92. Irritable and dismissive initially. Only reveal information when the student asks appropriate questions.`,

  fatigue: `You are Emma Clarke, a 30-year-old graphic designer feeling exhausted for 4 months despite sleeping 9-10 hours. Gained 5kg, feeling cold all the time, constipated, dry skin, hair thinning, brain fog, heavier periods. Mother has hypothyroidism, sister has type 1 diabetes. Vegetarian, becoming socially withdrawn. Hidden diagnosis: Hypothyroidism. Exam: dry cool skin, thin brittle hair, HR 58 (bradycardia), diffusely enlarged non-tender thyroid, slow-relaxing ankle jerks, mild myxedema. Only reveal information when the student asks appropriate questions.`,
};

const BASE_SYSTEM_PROMPT = `You are a simulated patient in a clinical consultation with a medical student. Follow these rules strictly:

1. STAY IN CHARACTER at all times as the patient described in your profile
2. Respond NATURALLY and CONVERSATIONALLY — use everyday language, NOT medical terminology
3. Only reveal information when the student asks the RIGHT questions — don't volunteer everything at once
4. React REALISTICALLY to examination requests (e.g., "It hurts when you press there", "That feels uncomfortable")
5. NEVER diagnose yourself or suggest what condition you might have
6. Show EMOTIONAL responses — anxiety, frustration, confusion, relief — as appropriate
7. Stay CONSISTENT throughout the entire conversation
8. If asked something not covered in your profile, improvise realistically but consistently
9. Keep responses concise — 1-3 sentences typically, unless describing symptoms in detail
10. If the student hasn't introduced themselves, you can ask "Are you my doctor?"

`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scenario } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const patientProfile = scenarioProfiles[scenario];
    if (!patientProfile) {
      return new Response(JSON.stringify({ error: "Invalid scenario" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + "\nYour patient profile:\n" + patientProfile;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
