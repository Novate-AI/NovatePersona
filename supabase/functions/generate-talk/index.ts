import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DID_API = "https://api.d-id.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DID_API_KEY = Deno.env.get("DID_API_KEY");
    if (!DID_API_KEY) {
      throw new Error("DID_API_KEY is not configured");
    }

    const { text, imageUrl } = await req.json();
    if (!text || !imageUrl) {
      return new Response(JSON.stringify({ error: "text and imageUrl are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedText = text.slice(0, 500);

    const createResp = await fetch(`${DID_API}/talks`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: "text",
          input: truncatedText,
          provider: {
            type: "microsoft",
            voice_id: "en-US-GuyNeural",
          },
        },
        config: {
          fluent: true,
          stitch: true,
        },
      }),
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      console.error("D-ID create error:", createResp.status, errText);
      return new Response(JSON.stringify({ error: `D-ID API error: ${createResp.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { id } = await createResp.json();

    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollResp = await fetch(`${DID_API}/talks/${id}`, {
        headers: { Authorization: `Basic ${DID_API_KEY}` },
      });

      if (!pollResp.ok) {
        console.error("D-ID poll error:", pollResp.status);
        continue;
      }

      const pollData = await pollResp.json();

      if (pollData.status === "done") {
        return new Response(JSON.stringify({ videoUrl: pollData.result_url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (pollData.status === "error" || pollData.status === "rejected") {
        console.error("D-ID talk failed:", pollData);
        return new Response(JSON.stringify({ error: "D-ID video generation failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "D-ID video generation timed out" }), {
      status: 504,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-talk error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
