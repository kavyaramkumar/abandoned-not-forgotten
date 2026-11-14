"""
"Ask Echo" AI server for the Reach for the Stars Museum
------------------------------------------------------------
Answers students' questions with Claude, using ONLY NASA information:
  - the museum's own notes (server/knowledge.json, built from the js/ content
    files, which were written from NASA sources), searched with BM25, and
  - NASA's websites (web search limited to nasa.gov and its subdomains).
Every answer comes back with the NASA pages it used, so students can check them.

The API key stays on this server and never reaches the website.

Setup (once):
    cd server
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    cp .env.example .env        # then paste your key into .env (never commit it)

Run:
    .venv/bin/python ask_server.py      -> http://localhost:8787/ask

Environment: PORT (8787), HOST (127.0.0.1; 0.0.0.0 in Docker), ALLOWED_ORIGIN
("*"), RATE_LIMIT (20) per RATE_WINDOW seconds (600), TRUST_PROXY (0; set 1
behind a proxy like Render so X-Forwarded-For gives the student's address).
See server/README.md.
"""

import hashlib
import json
import os
import re
import sys
import threading
import time
from collections import OrderedDict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import anthropic

from retrieval import MuseumIndex, format_notes

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
HOST = os.environ.get("HOST", "127.0.0.1")
# The page's address. "*" is fine on your own computer; set it to your site's
# URL (for example https://yourname.github.io) when the server is hosted.
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
RATE_LIMIT = int(os.environ.get("RATE_LIMIT", "20"))
RATE_WINDOW = int(os.environ.get("RATE_WINDOW", "600"))
TRUST_PROXY = os.environ.get("TRUST_PROXY", "0") == "1"
MAX_BODY = 20000
MODEL = "claude-opus-5-5"
NASA_DOMAINS = ["nasa.gov"]  # subdomains (jpl.nasa.gov, science.nasa.gov, ...) are included
MAX_ITERATIONS = 6
SEED_NOTES = 8

KNOWLEDGE_PATH = Path(os.environ.get("KNOWLEDGE_PATH", HERE / "knowledge.json"))
try:
    INDEX = MuseumIndex.load(KNOWLEDGE_PATH)
except (OSError, ValueError, KeyError) as e:
    print(json.dumps({"event": "knowledge_missing", "path": str(KNOWLEDGE_PATH), "error": repr(e)}), flush=True)
    INDEX = MuseumIndex([], [])


# ---------------------------------------------------------------- logging

def log(event, **fields):
    """One JSON line per event on stdout. Never the question text or the API key."""
    rec = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()), "event": event}
    rec.update(fields)
    print(json.dumps(rec), flush=True)


# ---------------------------------------------------------------- client

_client = None


def get_client():
    """Create the client once a key exists; re-reads server/.env so a key added later works without a restart."""
    global _client
    if _client is None:
        load_env(HERE / ".env")
        if not os.environ.get("ANTHROPIC_API_KEY"):
            return None
        _client = anthropic.Anthropic(timeout=90.0, max_retries=2)
    return _client


def set_client(client):
    """Swap in a client (tests use a fake one)."""
    global _client
    _client = client


# ---------------------------------------------------------------- prompt

def machine_index_text():
    lines = []
    for m in INDEX.machines:
        lines.append(f"- {m['name']} [{m['id']}]: {m.get('kind')}, {m.get('year')}, {m.get('place')} ({m.get('status')}; {m.get('wing')})")
    return "\n".join(lines)


INSTRUCTIONS = """You are Echo, the friendly robot guide in "The Reach for the Stars Museum", an interactive museum for middle and high school students about NASA hardware left on the Moon, on Mars, and in deep space.

Sources (the most important rule):
- Use ONLY information from NASA. You have two tools:
  1. search_museum: searches the museum's own notes, which were written from NASA sources (NASA's NSSDCA catalog, nasa.gov, science.nasa.gov, jpl.nasa.gov). It works best with short English keywords, even when the student writes in another language.
  2. web_search: searches NASA's websites only (nasa.gov and its subdomains).
- Each question comes with museum notes that already match it. If they answer the question, answer right away without calling a tool. If they don't, call search_museum with better keywords, and use web_search for anything the museum notes don't cover (recent news, details, numbers).
- Never use outside knowledge you can't support with a museum note or a NASA page. Never make up numbers, dates, or names.
- If neither the notes nor NASA's websites answer it, say you couldn't find it, and suggest where on nasa.gov to look (for example science.nasa.gov/mission/<mission name> or the NSSDCA catalog at nssdc.gsfc.nasa.gov).

How to answer:
- 2 to 4 short sentences that a middle schooler can follow. Explain any technical word in a few words.
- Answer in the same language the student's question is written in.
- Be warm and curious. You may speak as the machine itself ("I landed in...") when the student is chatting with one machine.
- Plain text only: no headings, bullet lists, or links (the museum shows the NASA pages you used under your answer). Don't use em dashes.
- Don't describe your searching; just answer.
- If a question is off-topic, unsafe, or personal, gently steer back to space and NASA's missions. Never ask for personal information.

Citing museum notes:
- Every museum note has an id like [n42]. After your answer, on its own last line, write USED: followed by the ids of the museum notes you relied on, for example "USED: n42, n57". Write "USED: none" if you used no museum note. The museum removes this line before students see it.

The machines in the museum (name [id]: kind, year, place):
"""

SEARCH_TOOL = {
    "name": "search_museum",
    "description": (
        "Search the museum's notes about its 20 NASA machines (and 3 hidden treasures), space words, "
        "space law, health, and inventions. The notes come from NASA sources. Returns the best matching "
        "notes, each with an id like [n42] and its NASA source page. Use short English keywords, and "
        "include the machine's name when the question is about one machine."
    ),
    "input_schema": {
        "type": "object",
        "properties": {"query": {"type": "string", "description": "Keywords to search for, e.g. 'Opportunity dust storm'"}},
        "required": ["query"],
        "additionalProperties": False,
    },
    "strict": True,
}

WEB_SEARCH_TOOL = {
    "type": "web_search_20260209",
    "name": "web_search",
    "max_uses": 3,
    "allowed_domains": NASA_DOMAINS,
}

TOOLS = [WEB_SEARCH_TOOL, SEARCH_TOOL]


def stable_system():
    """The cacheable part of the system prompt: instructions + machine index (same for every request)."""
    return [{"type": "text", "text": INSTRUCTIONS + machine_index_text(), "cache_control": {"type": "ephemeral"}}]


REFUSAL_ANSWER = "Let's keep our questions about space and NASA's missions! What else would you like to know?"
EMPTY_ANSWER = "Hmm, I couldn't find that in NASA's information. Try asking another way, or look it up on science.nasa.gov!"


# ---------------------------------------------------------------- helpers

def is_nasa(url):
    try:
        u = urlparse(url or "")
    except ValueError:
        return False
    host = (u.hostname or "").lower()
    return u.scheme in ("http", "https") and (host == "nasa.gov" or host.endswith(".nasa.gov"))


def web_sources(content):
    """NASA pages the answer cited (or, if none were cited, the ones it found)."""
    cited, found = [], []
    for block in content:
        btype = getattr(block, "type", None)
        if btype == "text":
            for c in getattr(block, "citations", None) or []:
                url = getattr(c, "url", None)
                if url:
                    cited.append({"title": getattr(c, "title", None) or url, "url": url})
        elif btype == "web_search_tool_result":
            results = getattr(block, "content", None)
            if isinstance(results, list):  # an error comes back as a single object
                for r in results:
                    if getattr(r, "url", None):
                        found.append({"title": getattr(r, "title", None) or r.url, "url": r.url})
    return [s for s in (cited or found[:3]) if is_nasa(s["url"])]


USED_LINE = re.compile(r"^\s*USED\s*:\s*(.*)$", re.I | re.M)
NOTE_REF = re.compile(r"\[?\b(n\d{1,5})\b\]?")


def split_used(text):
    """Pull the 'USED: n1, n2' line out of the answer; returns (clean text, [note ids] or None if there was no line)."""
    ids = None
    for m in USED_LINE.finditer(text):
        ids = (ids or []) + NOTE_REF.findall(m.group(1))
    text = USED_LINE.sub("", text)
    text = re.sub(r"\s*\[n\d{1,5}(?:\s*,\s*n\d{1,5})*\]", "", text)  # stray inline [n12] markers
    text = text.replace("—", ", ").replace(" ,", ",")
    return re.sub(r"\n{3,}", "\n\n", text).strip(), ids


def note_sources(ids):
    out = []
    for nid in ids:
        n = INDEX.by_id.get(nid)
        if n and n.get("source_url") and is_nasa(n["source_url"]):
            out.append({"title": n.get("source_title") or n["source_url"], "url": n["source_url"]})
    return out


def dedupe_sources(sources, limit=5):
    seen, out = set(), []
    for s in sources:
        key = s["url"].rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return out[:limit]


def clean_history(history):
    msgs = []
    for m in history if isinstance(history, list) else []:
        if isinstance(m, dict) and m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str) and m["content"].strip():
            msgs.append({"role": m["role"], "content": m["content"][:1500]})
    msgs = msgs[-6:]
    while msgs and msgs[0]["role"] != "user":  # a conversation must start with the student
        msgs.pop(0)
    return msgs


def run_search_tool(tool_input, prefer):
    query = tool_input.get("query") if isinstance(tool_input, dict) else None
    if not isinstance(query, str) or not query.strip():
        return "Please give a search query.", True
    hits = INDEX.search(query[:300], k=6, prefer=prefer)
    if not hits:
        return "No museum notes matched. Try other keywords, or search NASA's websites.", False
    return format_notes(hits), False


# ---------------------------------------------------------------- the agent

def ask(exhibit, question, history, notes=None):
    """Answer one question. Returns {"answer", "sources"} plus "_meta" (stripped before sending)."""
    exhibit = exhibit if isinstance(exhibit, dict) else {}
    question = question.strip()[:400]
    prefer = INDEX.machine_id_for_name(exhibit.get("name"))

    hits = INDEX.search(question, k=SEED_NOTES, prefer=prefer)
    context = []
    if exhibit:
        context.append("The student is chatting with this exhibit (JSON):\n" + json.dumps(exhibit, ensure_ascii=False)[:6000])
    context.append("Museum notes that match this question (from NASA sources):\n" + (format_notes(hits) or "(none matched)"))
    if isinstance(notes, list):
        seeded = " ".join(n["text"] for _, n in hits)
        extra = []
        for x in notes[:8]:
            if isinstance(x, str) and x.strip():
                x = x.strip()[:400]
                if re.sub(r"^\[[^\]]*\]\s*", "", x) not in seeded:
                    extra.append(x)
        if extra:
            context.append("More notes the museum page matched:\n- " + "\n- ".join(extra))

    system = stable_system() + [{"type": "text", "text": "\n\n".join(context)}]
    messages = clean_history(history) + [{"role": "user", "content": question}]

    client = get_client()
    all_content, segment_text = [], []
    tool_calls = web_calls = 0
    response = None
    for iteration in range(1, MAX_ITERATIONS + 1):
        response = client.beta.messages.create(
            model=MODEL,
            max_tokens=8000,
            output_config={"effort": "low"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            system=system,
            tools=TOOLS,
            messages=messages,
        )
        content = list(response.content)
        all_content += content
        segment_text += [b.text for b in content if getattr(b, "type", None) == "text"]
        web_calls += sum(1 for b in content if getattr(b, "type", None) == "server_tool_use")
        stop = response.stop_reason

        if stop == "refusal":
            log("refusal", iterations=iteration)
            return {"answer": REFUSAL_ANSWER, "sources": [], "_meta": {"iterations": iteration, "stop": stop}}
        if stop == "pause_turn":
            # the server-side web search loop paused; send the turn back unchanged and it resumes
            messages = messages + [{"role": "assistant", "content": content}]
            continue
        if stop == "tool_use":
            results = []
            for b in content:
                if getattr(b, "type", None) != "tool_use":
                    continue
                tool_calls += 1
                if b.name == "search_museum":
                    text, is_error = run_search_tool(b.input, prefer)
                else:
                    text, is_error = f"Unknown tool: {b.name}", True
                result = {"type": "tool_result", "tool_use_id": b.id, "content": text}
                if is_error:
                    result["is_error"] = True
                results.append(result)
            if not results:  # nothing for us to run; treat like a finished turn
                break
            messages = messages + [{"role": "assistant", "content": content}, {"role": "user", "content": results}]
            segment_text = []  # text before a tool call is a preamble, not the answer
            continue
        break  # end_turn, max_tokens, stop_sequence
    else:
        log("iteration_cap", iterations=MAX_ITERATIONS)

    answer, used = split_used("".join(segment_text))
    if used is None:  # the model forgot the USED line: credit the two best matching notes
        used = [n["id"] for _, n in hits[:2]]
    sources = note_sources(used)
    sources = dedupe_sources(sources + web_sources(all_content))
    meta = {"iterations": iteration, "stop": response.stop_reason if response else None,
            "tool_calls": tool_calls, "web_searches": web_calls}
    return {"answer": answer or EMPTY_ANSWER, "sources": sources, "_meta": meta}


# ---------------------------------------------------------------- rate limit + cache

class RateLimiter:
    def __init__(self, limit, window):
        self.limit, self.window = limit, window
        self.hits = {}
        self.lock = threading.Lock()

    def allow(self, key, now=None):
        now = time.monotonic() if now is None else now
        with self.lock:
            q = self.hits.setdefault(key, deque())
            while q and now - q[0] >= self.window:
                q.popleft()
            if len(q) >= self.limit:
                return False, int(self.window - (now - q[0])) + 1
            q.append(now)
            if len(self.hits) > 10000:  # forget idle addresses
                for k in [k for k, v in self.hits.items() if not v or now - v[-1] >= self.window]:
                    del self.hits[k]
            return True, 0


class AnswerCache:
    """LRU cache of answers to identical (machine, question) pairs asked with no history."""

    def __init__(self, size=500, ttl=24 * 3600):
        self.size, self.ttl = size, ttl
        self.data = OrderedDict()
        self.lock = threading.Lock()

    @staticmethod
    def key(exhibit, question):
        name = (exhibit.get("name") if isinstance(exhibit, dict) else "") or ""
        q = re.sub(r"\s+", " ", question.strip().lower()).rstrip("?!. ")
        return (str(name).strip().lower(), q)

    def get(self, key):
        with self.lock:
            item = self.data.get(key)
            if not item or time.time() - item[0] > self.ttl:
                self.data.pop(key, None)
                return None
            self.data.move_to_end(key)
            return item[1]

    def put(self, key, value):
        with self.lock:
            self.data[key] = (time.time(), value)
            self.data.move_to_end(key)
            while len(self.data) > self.size:
                self.data.popitem(last=False)


LIMITER = RateLimiter(RATE_LIMIT, RATE_WINDOW)
CACHE = AnswerCache()


# ---------------------------------------------------------------- HTTP

def health():
    key = bool(os.environ.get("ANTHROPIC_API_KEY")) or _client is not None
    return {
        "ok": bool(INDEX.notes) and key,  # the museum only switches to "AI guide" when it can really answer
        "model": MODEL,
        "sources": NASA_DOMAINS,
        "notes": len(INDEX.notes),
        "machines": len(INDEX.machines),
        "api_key_configured": key,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "AskEcho/2"

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        if ALLOWED_ORIGIN != "*":
            self.send_header("Vary", "Origin")

    def _send(self, status, body, headers=None):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors()
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def client_ip(self):
        if TRUST_PROXY:
            fwd = self.headers.get("X-Forwarded-For", "")
            if fwd.strip():
                return fwd.split(",")[0].strip()
        return self.client_address[0]

    def do_OPTIONS(self):
        # CORS preflight: 204 means no body
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            return self._send(200, health())
        self._send(404, {"error": "not found"})

    def do_POST(self):
        started = time.monotonic()
        if urlparse(self.path).path != "/ask":
            return self._send(404, {"error": "not found"})
        ip = self.client_ip()
        who = hashlib.sha256(ip.encode()).hexdigest()[:10]  # a short hash, not the address itself

        def done(status, body, **fields):
            headers = fields.pop("headers", None)
            log("ask", status=status, client=who, ms=int((time.monotonic() - started) * 1000), **fields)
            self._send(status, body, headers)

        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return done(400, {"error": "bad length"})
        if length < 0:
            return done(400, {"error": "bad length"})
        if length > MAX_BODY:
            return done(413, {"error": "too large"})
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return done(400, {"error": "bad json"})
        if not isinstance(body, dict):
            return done(400, {"error": "expected a JSON object"})
        question = body.get("question")
        if not isinstance(question, str) or not question.strip():
            return done(400, {"error": "missing question"})
        exhibit = body.get("exhibit") if isinstance(body.get("exhibit"), dict) else {}
        history = clean_history(body.get("history"))
        machine = str(exhibit.get("name") or "")[:60]
        fields = {"machine": machine, "q_len": len(question)}

        cache_key = AnswerCache.key(exhibit, question) if not history else None
        if cache_key:
            cached = CACHE.get(cache_key)
            if cached:
                return done(200, cached, cache="hit", **fields)

        allowed, retry = LIMITER.allow(ip)
        if not allowed:
            return done(429, {"error": "Echo needs a short break! You've asked a lot of questions. Try again in a few minutes.",
                              "retry_after": retry}, headers={"Retry-After": str(retry)}, **fields)

        if get_client() is None:
            log("no_api_key", hint="add ANTHROPIC_API_KEY to server/.env; the museum uses its offline notes until then")
            return done(503, {"error": "AI guide not set up"}, **fields)
        try:
            result = ask(exhibit, question, history, body.get("notes"))
            meta = result.pop("_meta", {})
            if cache_key and result["answer"] not in (REFUSAL_ANSWER, EMPTY_ANSWER):
                CACHE.put(cache_key, result)
            done(200, result, cache="miss", sources=len(result["sources"]), **meta, **fields)
        except anthropic.AuthenticationError:
            done(500, {"error": "AI guide not set up"}, error="auth", hint="the Anthropic API key is missing or wrong; check server/.env", **fields)
        except anthropic.RateLimitError:
            done(429, {"error": "busy, try again in a moment"}, error="anthropic_rate_limit", **fields)
        except anthropic.APIStatusError as e:
            done(502, {"error": "AI guide error"}, error="api_status", api_status=e.status_code, **fields)
        except anthropic.APIConnectionError:
            done(502, {"error": "AI guide offline"}, error="connection", **fields)
        except Exception as e:  # never leave the page hanging
            done(500, {"error": "AI guide error"}, error="unexpected", detail=type(e).__name__, **fields)

    def log_message(self, fmt, *args):  # structured logs only (see log())
        pass


def main():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        log("startup_warning", hint="ANTHROPIC_API_KEY isn't set. Put it in server/.env (see .env.example).")
    log("startup", host=HOST, port=PORT, model=MODEL, notes=len(INDEX.notes), machines=len(INDEX.machines),
        allowed_origin=ALLOWED_ORIGIN, rate_limit=f"{RATE_LIMIT}/{RATE_WINDOW}s", trust_proxy=TRUST_PROXY)
    print(f"Ask Echo server on http://{'localhost' if HOST == '127.0.0.1' else HOST}:{PORT}/ask", file=sys.stderr, flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
