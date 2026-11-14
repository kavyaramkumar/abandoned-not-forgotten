"""
"Ask Echo" AI server for the Reach for the Stars Museum
------------------------------------------------------------
A tiny local server that answers students' questions with Claude, using ONLY
NASA websites as sources (web search is limited to nasa.gov and its
subdomains, like jpl.nasa.gov and science.nasa.gov). Every answer comes back
with the NASA pages it used, so students can check them.

The API key stays on this server and never reaches the website.

Setup (once):
    cd server
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    cp .env.example .env        # then paste your key into .env (never commit it)

Run:
    .venv/bin/python ask_server.py      -> http://localhost:8787/ask

The museum (js/ai.js) uses this server automatically when the page is opened
from localhost. Without it, the chat falls back to its offline notes.
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import anthropic

HERE = Path(__file__).resolve().parent


def load_env(path):
    """Read KEY=value lines from server/.env into the environment (if not already set)."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        if value:
            os.environ.setdefault(key.strip(), value)


load_env(HERE / ".env")

PORT = int(os.environ.get("PORT", "8787"))
# The page's address. "*" is fine on your own computer; set it to your site's
# URL (for example https://yourname.github.io) when the server is hosted.
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
MODEL = "claude-opus-5-5"
NASA_DOMAINS = ["nasa.gov"]  # subdomains (jpl.nasa.gov, science.nasa.gov, ...) are included

_client = None


def get_client():
    """Create the client once a key exists; re-reads server/.env so a key added later works without a restart."""
    global _client
    if _client is None:
        load_env(HERE / ".env")
        if not os.environ.get("ANTHROPIC_API_KEY"):
            return None
        _client = anthropic.Anthropic()
    return _client

SYSTEM = """You are Echo, the friendly robot guide in "The Reach for the Stars Museum", an interactive museum for middle and high school students about NASA hardware left on the Moon, on Mars, and in deep space.

Sources (the most important rule):
- Use ONLY information from NASA. You have a web search tool that can only search NASA websites (nasa.gov and its subdomains). Search NASA before answering any factual question, and base your answer on what NASA's pages say. The exhibit notes you are given were written from NASA history too.
- Never use outside knowledge that you can't support with a NASA source. If NASA's sites don't answer the question, say you couldn't find it on NASA's website and suggest where on nasa.gov a student could look.
- Never make up numbers, dates, or names.

How to answer:
- 2 to 4 short sentences that a middle schooler can follow. Explain any technical word in a few words.
- Be warm and curious. You may speak as the machine itself ("I landed in...") when the student is chatting with one machine.
- Don't list the links yourself; the museum shows the NASA pages you used under your answer.
- If a question is off-topic, unsafe or personal, gently steer back to space, and NASA's missions. Never ask for personal information."""

TOOLS = [
    {
        "type": "web_search_20260209",
        "name": "web_search",
        "max_uses": 3,
        "allowed_domains": NASA_DOMAINS,
    }
]


def is_nasa(url):
    host = (urlparse(url).hostname or "").lower()
    return host == "nasa.gov" or host.endswith(".nasa.gov")


def collect_sources(content):
    """NASA pages the answer cited (or, if none were cited, the ones it found)."""
    cited, found = [], []
    for block in content:
        if block.type == "text":
            for c in getattr(block, "citations", None) or []:
                url = getattr(c, "url", None)
                if url:
                    cited.append({"title": getattr(c, "title", None) or url, "url": url})
        elif block.type == "web_search_tool_result":
            results = block.content
            if isinstance(results, list):  # an error comes back as a single object
                for r in results:
                    if getattr(r, "url", None):
                        found.append({"title": getattr(r, "title", None) or r.url, "url": r.url})
    seen, out = set(), []
    for s in cited or found[:3]:
        if s["url"] in seen or not is_nasa(s["url"]):
            continue
        seen.add(s["url"])
        out.append(s)
    return out[:4]


def ask(exhibit, question, history, notes=None):
    messages = [
        {"role": m["role"], "content": m["content"]}
        for m in history
        if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str)
    ][-6:]
    messages.append({"role": "user", "content": question[:400]})
    system = [
        {"type": "text", "text": SYSTEM},
        {"type": "text", "text": "Exhibit notes (JSON):\n" + json.dumps(exhibit)[:6000]},
    ]
    if notes:
        # the museum's own notes that best match this question (checked against NASA's NSSDCA catalog)
        clean = [str(n)[:400] for n in notes if isinstance(n, str)][:8]
        system.append({"type": "text", "text": "Museum notes that match this question (from NASA sources; use them, and search NASA for anything they don't cover):\n- " + "\n- ".join(clean)})

    response = None
    for _ in range(3):  # web search can pause a long turn; resume up to twice
        response = get_client().beta.messages.create(
            model=MODEL,
            max_tokens=4000,
            output_config={"effort": "low"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            system=system,
            tools=TOOLS,
            messages=messages,
        )
        if response.stop_reason != "pause_turn":
            break
        messages = messages + [{"role": "assistant", "content": response.content}]

    if response.stop_reason == "refusal":
        return {"answer": "Let's keep our questions about space and NASA's missions! What else would you like to know?", "sources": []}
    answer = "".join(b.text for b in response.content if b.type == "text").strip()
    return {
        "answer": answer or "Hmm, I couldn't find that on NASA's website. Try asking another way!",
        "sources": collect_sources(response.content),
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        # CORS preflight: 204 means no body
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        # quick health check: http://localhost:8787/health
        if self.path == "/health":
            return self._send(200, {"ok": True, "model": MODEL, "sources": NASA_DOMAINS})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/ask":
            return self._send(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return self._send(400, {"error": "bad length"})
        if length < 0:
            return self._send(400, {"error": "bad length"})
        if length > 20000:
            return self._send(413, {"error": "too large"})
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return self._send(400, {"error": "bad json"})
        if not isinstance(body, dict):
            return self._send(400, {"error": "expected a JSON object"})
        question = body.get("question")
        if not isinstance(question, str) or not question.strip():
            return self._send(400, {"error": "missing question"})
        if get_client() is None:
            print("No API key yet: add ANTHROPIC_API_KEY to server/.env. The museum uses its offline notes until then.")
            return self._send(503, {"error": "AI guide not set up"})
        try:
            self._send(200, ask(body.get("exhibit") or {}, question, body.get("history") or [], body.get("notes")))
        except anthropic.AuthenticationError:
            print("The Anthropic API key is missing or wrong. Check server/.env.")
            self._send(500, {"error": "AI guide not set up"})
        except anthropic.RateLimitError:
            self._send(429, {"error": "busy, try again in a moment"})
        except anthropic.APIStatusError as e:
            print(f"Anthropic API error {e.status_code}: {e.message}")
            self._send(502, {"error": "AI guide error"})
        except anthropic.APIConnectionError:
            print("Couldn't reach the Anthropic API. Check the internet connection.")
            self._send(502, {"error": "AI guide offline"})
        except Exception as e:  # never leave the page hanging
            print(f"Unexpected error: {e!r}")
            self._send(500, {"error": "AI guide error"})

    def log_message(self, fmt, *args):  # keep the console quiet except for errors
        pass


if __name__ == "__main__":
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Note: ANTHROPIC_API_KEY isn't set. Put it in server/.env (see .env.example).")
    print(f"Ask Echo server on http://localhost:{PORT}/ask (sources: {', '.join(NASA_DOMAINS)})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
