const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const GENERATE_TALK_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/generate-talk` : null;

export async function generateTalk(text: string, imageUrl: string): Promise<string | null> {
  if (!GENERATE_TALK_URL) return null;

  try {
    const resp = await fetch(GENERATE_TALK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ text, imageUrl }),
    });

    if (!resp.ok) {
      console.error("generate-talk failed:", resp.status);
      return null;
    }

    const data = await resp.json();
    return data.videoUrl || null;
  } catch (err) {
    console.error("generate-talk error:", err);
    return null;
  }
}
