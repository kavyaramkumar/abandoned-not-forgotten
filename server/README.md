# Ask Echo: the museum's AI server

A small Python server that answers students' questions with Claude (`claude-opus-5-5`), using only NASA information:

- **Museum notes** (`knowledge.json`): about 600 short passages built from the museum's own content in `js/` (stories, quick facts, NASA NSSDCA catalog data, quizzes, space words, Learn more sections, orbit views, and sounds). They are ranked with BM25 for each question, and the best 8 are handed to Claude up front, so most questions need no tool call.
- **Tools**: `search_museum` (searches those notes again with better keywords) and web search limited to `nasa.gov` and its subdomains.

Every answer comes back as `{answer, sources: [{title, url}]}`, and sources are only ever NASA pages.

## Run it on your computer

```sh
cd server
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env          # paste your Anthropic API key into .env (it is git-ignored)
.venv/bin/python ask_server.py
```

Open the museum from `localhost` and the chat uses `http://localhost:8787/ask` automatically. Check it with `curl localhost:8787/health`:

```json
{"ok": true, "model": "claude-opus-5-5", "sources": ["nasa.gov"], "notes": 607, "machines": 23, "api_key_configured": true}
```

`ok` is only true when the notes are loaded and an API key is set; otherwise the museum stays in its offline mode.

Settings (environment variables or `.env`):

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | (none) | Your key. Never commit it. |
| `PORT` | `8787` | Port to listen on (Render sets this for you). |
| `HOST` | `127.0.0.1` | `0.0.0.0` in Docker so the container is reachable. |
| `ALLOWED_ORIGIN` | `*` | The site allowed to call the server (CORS). |
| `RATE_LIMIT` / `RATE_WINDOW` | `20` / `600` | Questions per address per window (seconds). A friendly 429 after that. |
| `TRUST_PROXY` | `0` | Set to `1` behind a proxy (Render, Docker image default) so each student's address comes from `X-Forwarded-For`. |

Repeated questions (same machine, same question, no chat history) are answered from an in-memory cache and don't count toward the rate limit. A whole class shares one school address, so raise `RATE_LIMIT` if you expect a classroom at once.

Logs are one JSON line per request on stdout: status, machine, question length, time, tool calls, and a short hash of the address. The question text and the API key are never logged.

## Tests

```sh
cd server
.venv/bin/python -m unittest -v
```

They use a fake Claude client, so they need no key and no network.

## Rebuild the notes after editing museum content

`knowledge.json` is committed, so the server never needs JavaScript. After you change anything in `js/data.js`, `js/data-extra.js`, `js/facts.js`, `js/nasa-data.js`, `js/learn.js`, `js/orbit.js`, or `js/sounds.js`, rebuild it on a Mac (it uses the JavaScriptCore that ships with macOS):

```sh
server/.venv/bin/python server/build_knowledge.py
```

Then commit the new `knowledge.json`. Set `JSC=/path/to/jsc` if JavaScriptCore is somewhere else.

## Deploy (Render)

1. Push the repo to GitHub.
2. In Render: **New > Blueprint**, choose this repo, and set the Blueprint file path to `server/render.yaml`.
3. Paste your Anthropic API key when Render asks for `ANTHROPIC_API_KEY`. `ALLOWED_ORIGIN` is already set to `https://kavyaramkumar.github.io`.
4. When the deploy finishes, open `https://<your-service>.onrender.com/health` and check that `ok` is `true`.

Any Docker host works too: `docker build -t ask-echo server && docker run -p 8787:8787 -e ANTHROPIC_API_KEY=... -e ALLOWED_ORIGIN=https://kavyaramkumar.github.io ask-echo`.

Free Render services sleep when idle, so the first question after a while can take up to a minute. If the health check times out, the museum simply stays in offline mode for that visit.

## Point the live site at the server

In `js/ai.js`, set `CONFIG.askEndpoint` so the live site uses the hosted server (and `localhost` keeps using the local one):

```js
window.CONFIG = window.CONFIG || {
  askEndpoint: /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:8787/ask"
    : "https://<your-service>.onrender.com/ask",
};
```

The request and response format didn't change, so nothing else in `js/ai.js` needs editing. The page checks `/health` first and uses offline answers whenever the server isn't ready.
