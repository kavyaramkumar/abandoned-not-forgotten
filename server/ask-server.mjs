/*
 * "Ask the Exhibit" AI backend (optional)
 * ------------------------------------------------------------
 * A tiny Node server that keeps the Anthropic API key off the website.
 * The museum works without it (offline guide mode).
 *
 *   cd server
 *   npm install
 *   export ANTHROPIC_API_KEY=...        (never commit this)
 *   npm start                           -> http://localhost:8787/ask
 *
 * Then in js/ai.js set: CONFIG.askEndpoint = "http://localhost:8787/ask"
 */
import http from "node:http";
import Anthropic from "@anthropic-ai/sdk";

const PORT = process.env.PORT || 8787;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*"; // set to your GitHub Pages URL when deployed
const client = new Anthropic();

const SYSTEM = `You are a friendly museum placard in "The Reach for the Stars Museum", an interactive exhibit for kids aged about 8 to 14 about NASA hardware left on the Moon, Mars and in deep space.

How to answer:
- Answer in 2 to 4 short sentences a 10-year-old can understand. No jargon; if you must use a technical word, explain it.
- Be accurate. Base answers on the exhibit facts provided and well-established NASA history. If you are not sure, say so and suggest checking nasa.gov with a grown-up. Never make up numbers or dates.
- Be warm and curious; you can speak as the exhibit itself ("I landed in...") when it fits.
- If a question is off-topic, unsafe, or personal, gently steer back to space and this exhibit. Never ask for personal information.`;

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST" || req.url !== "/ask") return send(res, 404, { error: "not found" });

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20000) return send(res, 413, { error: "too large" });
  }

  try {
    const { exhibit, question, history = [] } = JSON.parse(raw);
    if (!question || typeof question !== "string") return send(res, 400, { error: "missing question" });

    const messages = [
      ...history
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6),
      { role: "user", content: question.slice(0, 300) },
    ];

    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" }, // short kid-friendly answers; raise if quality needs it
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: "Exhibit facts (JSON):\n" + JSON.stringify(exhibit).slice(0, 6000) },
      ],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return send(res, 200, { answer: "Let's keep our questions about space and this exhibit! What else would you like to know about it?" });
    }
    const answer = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    send(res, 200, { answer: answer || "Hmm, I'm not sure. Try asking another way!" });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: "AI guide error" });
  }
});

server.listen(PORT, () => console.log(`Ask-the-Exhibit server on http://localhost:${PORT}/ask`));
