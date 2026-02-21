export type Msg = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace('/api/chat', '') || 'http://localhost:5000';

interface StreamChatOpts {
  messages: Msg[];
  scenario: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

async function streamFromGroq(opts: StreamChatOpts): Promise<boolean> {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: opts.messages, scenario: opts.scenario }),
    });

    if (!resp.ok || !resp.body) return false;
    await readSSE(resp.body, opts);
    return true;
  } catch {
    return false;
  }
}

async function streamFromSupabase(opts: StreamChatOpts): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ messages: opts.messages, scenario: opts.scenario }),
    });

    if (resp.status === 429) { opts.onError("Too many requests. Please wait a moment."); return true; }
    if (resp.status === 402) { opts.onError("AI usage limit reached. Try again later."); return true; }
    if (!resp.ok || !resp.body) return false;
    await readSSE(resp.body, opts);
    return true;
  } catch {
    return false;
  }
}

async function readSSE(body: ReadableStream<Uint8Array>, opts: StreamChatOpts) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { opts.onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) opts.onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  opts.onDone();
}

export async function streamChat(opts: StreamChatOpts) {
  const groqOk = await streamFromGroq(opts);
  if (groqOk) return;

  const supabaseOk = await streamFromSupabase(opts);
  if (supabaseOk) return;

  opts.onError("Could not connect to any backend. Make sure your server is running (cd server && npm run dev).");
}
