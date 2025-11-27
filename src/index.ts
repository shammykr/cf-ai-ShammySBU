export interface Env {
  AI: any;
  CHAT_HISTORY: KVNamespace;
}

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return serveHtml();
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      return handleChat(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

function serveHtml(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Cloudflare AI Chat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>Cloudflare AI Chat</h2>
  <div id="chat"></div>
  <input id="message" placeholder="Type a message..." />
  <button onclick="send()">Send</button>

  <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('message');

    const USER_ID_KEY = 'cf-ai-chat-user-id';
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).slice(2);
      localStorage.setItem(USER_ID_KEY, userId);
    }

    function addMessage(role, text) {
      const div = document.createElement('div');
      div.textContent = role + ": " + text;
      chat.appendChild(div);
    }

    async function send() {
      const text = input.value.trim();
      if (!text) return;
      addMessage('You', text);
      input.value = '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text })
      });

      const data = await res.json();
      addMessage('AI', data.reply);
    }
  </script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    const { userId, message } = await request.json();

    const kvKey = `session:${userId}`;
    const historyJson = await env.CHAT_HISTORY.get(kvKey);
    let history = historyJson ? JSON.parse(historyJson) : [];

    history.push({ role: "user", content: message });
    if (history.length > 20) history = history.slice(-20);

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      ...history
    ];

    const aiResult = await env.AI.run(MODEL_ID, { messages });
    let reply =
      aiResult?.response ??
      aiResult?.result ??
      aiResult?.choices?.[0]?.message?.content ??
      "[No response]";

    history.push({ role: "assistant", content: reply });
    await env.CHAT_HISTORY.put(kvKey, JSON.stringify(history));

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response("Error: " + err, { status: 500 });
  }
}
