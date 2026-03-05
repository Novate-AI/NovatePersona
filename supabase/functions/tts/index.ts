import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const POCKET_SPEECH_PATH = "/v1/audio/speech";
const POCKET_VOICES_PATH = "/v1/audio/voices";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serverUrl = Deno.env.get("POCKET_TTS_SERVER_URL");
  if (!serverUrl) {
    return new Response(
      JSON.stringify({ error: "POCKET_TTS_SERVER_URL is not set in Supabase secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const base = serverUrl.replace(/\/$/, "");

  try {
    const body = await req.json().catch(() => ({}));
    const text = (body.text ?? body.input ?? "").trim();
    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text or input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voiceGender = body.voiceGender === "female" ? "female" : body.voiceGender === "male" ? "male" : null;
    let voice =
      voiceGender === "male"
        ? Deno.env.get("POCKET_TTS_VOICE_MALE")
        : voiceGender === "female"
          ? Deno.env.get("POCKET_TTS_VOICE_FEMALE")
          : null;
    voice ??= Deno.env.get("POCKET_TTS_VOICE");
    if (!voice) {
      const voicesRes = await fetch(`${base}${POCKET_VOICES_PATH}`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (voicesRes.ok) {
        const data = await voicesRes.json();
        const list = data.voices ?? data;
        const voices = Array.isArray(list) ? list : [];
        const byGender = (g: string) =>
          voices.find(
            (v: { name?: string }) =>
              String(v?.name ?? "").toLowerCase().includes(g)
          );
        const preferred =
          voiceGender === "female"
            ? byGender("female") ?? byGender("woman")
            : voiceGender === "male"
              ? byGender("male") ?? byGender("man")
              : null;
        const first = preferred ?? voices[0];
        voice = first?.voice_id ?? first?.id ?? "default";
      } else {
        voice = "default";
      }
    }

    const speechRes = await fetch(`${base}${POCKET_SPEECH_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice,
        speed: 1,
      }),
    });

    if (!speechRes.ok) {
      const errText = await speechRes.text();
      return new Response(
        JSON.stringify({ error: "TTS failed", detail: errText }),
        {
          status: speechRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contentType = speechRes.headers.get("content-type") || "audio/wav";
    const audio = await speechRes.arrayBuffer();
    return new Response(audio, {
      headers: { ...corsHeaders, "Content-Type": contentType },
    });
  } catch (e) {
    console.error("tts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "TTS error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
