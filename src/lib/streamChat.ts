export type Msg = { role: "user" | "assistant"; content: string };

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
  const ok = await streamFromGroq(opts);
  if (ok) return;

  opts.onError("Could not connect to the server. Make sure your backend is running.");
}
