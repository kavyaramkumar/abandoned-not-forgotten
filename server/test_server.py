"""
Tests for the Ask Echo server. No network and no API key: Claude is replaced by
a fake client that plays back scripted responses.

    cd server && .venv/bin/python -m unittest -v
"""

import http.client
import json
import os
import threading
import unittest
from types import SimpleNamespace as NS

import ask_server as srv
from retrieval import MuseumIndex, stem, tokens


LOGS = []


def setUpModule():
    # keep test output quiet; capture the structured log records instead
    srv.log = lambda event, **fields: LOGS.append({"event": event, **fields})


# ---------------------------------------------------------------- fakes

def text(t, citations=None):
    return NS(type="text", text=t, citations=citations)


def tool_use(id_, query, name="search_museum"):
    return NS(type="tool_use", id=id_, name=name, input={"query": query})


def response(stop, *blocks):
    return NS(stop_reason=stop, content=list(blocks), stop_details=None)


class FakeClient:
    """Stands in for anthropic.Anthropic(); records every request."""

    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []
        self.beta = NS(messages=NS(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        if not self.responses:
            raise AssertionError("unexpected extra API call")
        r = self.responses.pop(0)
        if isinstance(r, Exception):
            raise r
        return r


def first_note(machine_id, contains):
    return next(n for n in srv.INDEX.notes if n["machine_id"] == machine_id and contains in n["text"])


# ---------------------------------------------------------------- knowledge + retrieval

class KnowledgeTest(unittest.TestCase):
    def test_every_machine_has_notes(self):
        exhibits = [m for m in srv.INDEX.machines if not m["treasure"]]
        self.assertEqual(len(exhibits), 20)
        covered = {n["machine_id"] for n in srv.INDEX.notes}
        for m in srv.INDEX.machines:
            self.assertIn(m["id"], covered, m["id"])
        kinds = {n["kind"] for n in srv.INDEX.notes}
        for k in ("story", "fact", "nasa_catalog", "left_behind", "discovery", "next", "quiz", "faq",
                  "glossary", "learn", "hall", "orbit_view", "sound"):
            self.assertIn(k, kinds)

    def test_note_shape(self):
        for n in srv.INDEX.notes:
            self.assertTrue({"id", "machine_id", "machine_name", "kind", "text", "source_url"} <= set(n))
            self.assertTrue(n["text"])


class RetrievalTest(unittest.TestCase):
    def top(self, q, k=3, prefer=None):
        return [n for _, n in srv.INDEX.search(q, k=k, prefer=prefer)]

    def test_stemmer(self):
        self.assertEqual(stem("landers"), stem("lander"))
        self.assertEqual(stem("ownership"), "own")
        self.assertEqual(tokens("Opportunity's storms"), ["opportunity", "storm"])

    def test_what_killed_opportunity(self):
        best = self.top("what killed Opportunity")[0]
        self.assertEqual(best["machine_id"], "opportunity")
        self.assertIn("dust storm", best["text"])

    def test_who_owns_landers_on_moon(self):
        hits = self.top("who owns the landers on the moon")
        self.assertIn("Outer Space Treaty", hits[0]["text"])
        self.assertIn("ownership", hits[0]["text"])

    def test_named_machine_wins(self):
        best = self.top("how heavy was Voyager 1")[0]
        self.assertEqual(best["machine_id"], "voyager-1")
        self.assertRegex(best["text"], r"kilogram|kg")

    def test_alias_and_who(self):
        best = self.top("who built the moon buggy")[0]
        self.assertEqual(best["machine_id"], "lrv")
        self.assertIn("built", best["text"])

    def test_prefer_machine_being_chatted_with(self):
        self.assertEqual(self.top("what did you find", prefer="insight")[0]["machine_id"], "insight")

    def test_glossary(self):
        ids = [n["kind"] for n in self.top("what is the Kuiper Belt", k=3)]
        self.assertIn("glossary", ids)

    def test_empty_query(self):
        self.assertEqual(srv.INDEX.search("the of and ?"), [])

    def test_small_index(self):
        ix = MuseumIndex([{"id": "a", "machine_id": None, "machine_name": None, "kind": "x", "text": "red rover", "source_url": None},
                          {"id": "b", "machine_id": None, "machine_name": None, "kind": "x", "text": "blue sky", "source_url": None}])
        self.assertEqual(ix.search("rovers")[0][1]["id"], "a")


# ---------------------------------------------------------------- the agent loop

OPPORTUNITY = {"name": "Opportunity", "kind": "Rover", "place": "Meridiani Planum, Mars", "year": 2004}


class AgentTest(unittest.TestCase):
    def tearDown(self):
        srv.set_client(None)

    def test_answers_from_seeded_notes_without_tools(self):
        note = first_note("opportunity", "dust storm")
        fake = FakeClient(response("end_turn", text(f"A giant dust storm in 2018 covered my solar panels.\nUSED: {note['id']}")))
        srv.set_client(fake)
        out = srv.ask(OPPORTUNITY, "What killed you?", [], ["[Opportunity] Silent since a 2018 dust storm."])
        self.assertEqual(out["answer"], "A giant dust storm in 2018 covered my solar panels.")
        self.assertEqual(out["sources"][0]["url"], note["source_url"])
        call = fake.calls[0]
        # request shape: current API usage
        self.assertEqual(call["model"], "claude-opus-5-5")
        self.assertEqual(call["betas"], ["server-side-fallback-2026-07-01"])
        self.assertEqual(call["fallbacks"], "default")
        self.assertEqual(call["output_config"], {"effort": "low"})
        for banned in ("thinking", "temperature", "top_p", "tool_choice"):
            self.assertNotIn(banned, call)
        web = next(t for t in call["tools"] if t.get("type") == "web_search_20260209")
        self.assertEqual(web["allowed_domains"], ["nasa.gov"])
        self.assertEqual(web["max_uses"], 3)
        self.assertTrue(any(t.get("name") == "search_museum" for t in call["tools"]))
        # caching: breakpoint on the stable block; per-question notes come after it
        sys_blocks = call["system"]
        self.assertEqual(sys_blocks[0]["cache_control"], {"type": "ephemeral"})
        self.assertIn("Voyager 1 [voyager-1]", sys_blocks[0]["text"])
        self.assertNotIn("cache_control", sys_blocks[-1])
        self.assertIn("dust storm", sys_blocks[-1]["text"])
        self.assertEqual(call["messages"], [{"role": "user", "content": "What killed you?"}])

    def test_tool_use_then_end_turn(self):
        first = response("tool_use", text("Let me check."), tool_use("tu_1", "Opportunity dust storm"), tool_use("tu_2", "solar panels"))
        fake = FakeClient(first, response("end_turn", text("A dust storm blocked the Sun.\nUSED: none")))
        srv.set_client(fake)
        out = srv.ask(OPPORTUNITY, "Why did you stop?", [])
        self.assertEqual(out["answer"], "A dust storm blocked the Sun.")
        self.assertEqual(out["sources"], [])
        self.assertEqual(out["_meta"]["tool_calls"], 2)
        second = fake.calls[1]["messages"]
        self.assertEqual(second[-2], {"role": "assistant", "content": first.content})  # full content, not just text
        results = second[-1]
        self.assertEqual(results["role"], "user")
        self.assertEqual([r["tool_use_id"] for r in results["content"]], ["tu_1", "tu_2"])
        self.assertTrue(all(r["type"] == "tool_result" for r in results["content"]))
        self.assertIn("dust storm", results["content"][0]["content"])
        self.assertRegex(results["content"][0]["content"], r"\[n\d+\]")

    def test_bad_tool_input_is_an_error_result(self):
        bad = NS(type="tool_use", id="tu_x", name="search_museum", input={"query": ""})
        fake = FakeClient(response("tool_use", bad), response("end_turn", text("Okay.\nUSED: none")))
        srv.set_client(fake)
        srv.ask({}, "hi", [])
        self.assertTrue(fake.calls[1]["messages"][-1]["content"][0]["is_error"])

    def test_pause_turn_continues_without_user_message(self):
        server_use = NS(type="server_tool_use", id="srv_1", name="web_search", input={"query": "Voyager 1 distance"})
        results = NS(type="web_search_tool_result", tool_use_id="srv_1",
                     content=[NS(url="https://science.nasa.gov/mission/voyager/", title="Voyager"),
                              NS(url="https://example.com/not-nasa", title="Nope")])
        paused = response("pause_turn", server_use, results)
        cite = NS(url="https://science.nasa.gov/mission/voyager/", title="Voyager - NASA Science")
        final = response("end_turn", text("I'm the farthest spacecraft from Earth.", [cite]), text("\nUSED: none"))
        fake = FakeClient(paused, final)
        srv.set_client(fake)
        out = srv.ask({"name": "Voyager 1"}, "How far away are you?", [])
        self.assertEqual(len(fake.calls), 2)
        msgs = fake.calls[1]["messages"]
        self.assertEqual(msgs[-1], {"role": "assistant", "content": paused.content})
        self.assertEqual(msgs[-2]["role"], "user")
        self.assertEqual(out["answer"], "I'm the farthest spacecraft from Earth.")
        self.assertEqual([s["url"] for s in out["sources"]], ["https://science.nasa.gov/mission/voyager/"])

    def test_refusal(self):
        srv.set_client(FakeClient(response("refusal")))
        out = srv.ask({}, "something off topic", [])
        self.assertEqual(out["answer"], srv.REFUSAL_ANSWER)
        self.assertEqual(out["sources"], [])

    def test_iteration_cap(self):
        loops = [response("tool_use", tool_use(f"t{i}", "moon")) for i in range(srv.MAX_ITERATIONS)]
        fake = FakeClient(*loops)
        srv.set_client(fake)
        out = srv.ask({}, "moon?", [])
        self.assertEqual(len(fake.calls), srv.MAX_ITERATIONS)
        self.assertEqual(out["answer"], srv.EMPTY_ANSWER)

    def test_missing_used_line_credits_top_notes_and_strips_markers(self):
        srv.set_client(FakeClient(response("end_turn", text("A dust storm — a big one [n180]."))))
        out = srv.ask(OPPORTUNITY, "what killed you", [])
        self.assertNotIn("[n180]", out["answer"])
        self.assertNotIn("—", out["answer"])
        self.assertTrue(out["sources"])
        self.assertTrue(all(srv.is_nasa(s["url"]) for s in out["sources"]))

    def test_history_is_cleaned(self):
        fake = FakeClient(response("end_turn", text("Sure.\nUSED: none")))
        srv.set_client(fake)
        history = [{"role": "assistant", "content": "Hi! I'm Opportunity."}, {"role": "system", "content": "x"},
                   {"role": "user", "content": "hello"}, {"role": "assistant", "content": "Hello!"}, {"role": "user", "content": 5}]
        srv.ask(OPPORTUNITY, "next?", history)
        self.assertEqual([m["role"] for m in fake.calls[0]["messages"]], ["user", "assistant", "user"])


# ---------------------------------------------------------------- HTTP

class HTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = srv.ThreadingHTTPServer(("127.0.0.1", 0), srv.Handler)
        cls.port = cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def setUp(self):
        srv.LIMITER = srv.RateLimiter(3, 600)
        srv.CACHE = srv.AnswerCache()
        self._key = os.environ.pop("ANTHROPIC_API_KEY", None)

    def tearDown(self):
        srv.set_client(None)
        if self._key is not None:
            os.environ["ANTHROPIC_API_KEY"] = self._key

    def request(self, method, path, body=None, headers=None, raw=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        h = {"Content-Type": "application/json"}
        h.update(headers or {})
        conn.request(method, path, body=data, headers=h)
        r = conn.getresponse()
        payload = r.read()
        conn.close()
        return r.status, (json.loads(payload) if payload else None), r

    def test_health(self):
        srv.set_client(FakeClient())
        status, body, r = self.request("GET", "/health")
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(body["model"], "claude-opus-5-5")
        self.assertGreater(body["notes"], 400)
        self.assertTrue(body["api_key_configured"])
        self.assertEqual(r.getheader("Access-Control-Allow-Origin"), srv.ALLOWED_ORIGIN)
        self.assertNotIn("sk-", json.dumps(body))

    def test_health_without_key(self):
        srv.set_client(None)
        os.environ.pop("ANTHROPIC_API_KEY", None)
        orig = srv.load_env
        srv.load_env = lambda path: None  # ignore a real server/.env
        try:
            status, body, _ = self.request("GET", "/health")
            self.assertEqual(status, 200)
            self.assertFalse(body["api_key_configured"])
            self.assertFalse(body["ok"])
            status, body, _ = self.request("POST", "/ask", {"question": "hi"})
            self.assertEqual(status, 503)
        finally:
            srv.load_env = orig

    def test_ask_and_cache_hit(self):
        fake = FakeClient(response("end_turn", text("I landed in 2004.\nUSED: none")))
        srv.set_client(fake)
        req = {"exhibit": OPPORTUNITY, "question": "When did you land?", "notes": [], "history": []}
        status, body, _ = self.request("POST", "/ask", req)
        self.assertEqual(status, 200)
        self.assertEqual(body, {"answer": "I landed in 2004.", "sources": []})
        req["question"] = "  when did you LAND  "
        status, body2, _ = self.request("POST", "/ask", req)
        self.assertEqual(status, 200)
        self.assertEqual(body2, body)
        self.assertEqual(len(fake.calls), 1)  # served from the cache

    def test_history_skips_cache(self):
        fake = FakeClient(response("end_turn", text("A.\nUSED: none")), response("end_turn", text("B.\nUSED: none")))
        srv.set_client(fake)
        hist = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
        for _ in range(2):
            self.assertEqual(self.request("POST", "/ask", {"question": "why?", "history": hist})[0], 200)
        self.assertEqual(len(fake.calls), 2)

    def test_rate_limit(self):
        fake = FakeClient(*[response("end_turn", text(f"Answer {i}.\nUSED: none")) for i in range(3)])
        srv.set_client(fake)
        for i in range(3):
            self.assertEqual(self.request("POST", "/ask", {"question": f"question {i}"})[0], 200)
        status, body, r = self.request("POST", "/ask", {"question": "one more"})
        self.assertEqual(status, 429)
        self.assertIn("error", body)
        self.assertTrue(int(r.getheader("Retry-After")) > 0)
        # a cached answer is still served
        self.assertEqual(self.request("POST", "/ask", {"question": "question 0"})[0], 200)

    def test_rate_limiter_window(self):
        rl = srv.RateLimiter(2, 10)
        self.assertTrue(rl.allow("a", 0)[0])
        self.assertTrue(rl.allow("a", 1)[0])
        self.assertFalse(rl.allow("a", 2)[0])
        self.assertTrue(rl.allow("b", 2)[0])
        self.assertTrue(rl.allow("a", 10.5)[0])

    def test_lru_eviction(self):
        c = srv.AnswerCache(size=2)
        c.put("a", 1)
        c.put("b", 2)
        c.get("a")
        c.put("c", 3)
        self.assertIsNone(c.get("b"))
        self.assertEqual(c.get("a"), 1)

    def test_bad_requests(self):
        srv.set_client(FakeClient())
        self.assertEqual(self.request("POST", "/ask", ["not", "an", "object"])[0], 400)
        self.assertEqual(self.request("POST", "/ask", "a string")[0], 400)
        self.assertEqual(self.request("POST", "/ask", raw=b"{nope")[0], 400)
        self.assertEqual(self.request("POST", "/ask", {"question": "   "})[0], 400)
        self.assertEqual(self.request("POST", "/ask", {"question": 7})[0], 400)
        self.assertEqual(self.request("POST", "/ask", raw=b"{}", headers={"Content-Length": "abc"})[0], 400)
        self.assertEqual(self.request("POST", "/ask", raw=b"{}", headers={"Content-Length": "-5"})[0], 400)
        self.assertEqual(self.request("POST", "/ask", raw=b"x" * (srv.MAX_BODY + 1))[0], 413)
        self.assertEqual(self.request("POST", "/nope", {"question": "hi"})[0], 404)
        self.assertEqual(self.request("GET", "/nope")[0], 404)

    def test_options_preflight(self):
        status, body, r = self.request("OPTIONS", "/ask")
        self.assertEqual(status, 204)
        self.assertIn("POST", r.getheader("Access-Control-Allow-Methods"))

    def test_logs_have_no_question_text(self):
        srv.set_client(FakeClient(response("end_turn", text("Hi.\nUSED: none"))))
        self.request("POST", "/ask", {"exhibit": {"name": "Spirit"}, "question": "my secret question"})
        rec = [r for r in LOGS if r.get("event") == "ask"][-1]
        self.assertEqual(rec["machine"], "Spirit")
        self.assertEqual(rec["q_len"], len("my secret question"))
        self.assertNotIn("secret", json.dumps(LOGS))

    def test_api_errors_map_to_friendly_status(self):
        srv.LIMITER = srv.RateLimiter(100, 600)
        import anthropic
        import httpx2 as httpx
        req = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
        cases = [
            (anthropic.AuthenticationError("bad key", response=httpx.Response(401, request=req), body=None), 500),
            (anthropic.RateLimitError("slow down", response=httpx.Response(429, request=req), body=None), 429),
            (anthropic.InternalServerError("oops", response=httpx.Response(500, request=req), body=None), 502),
            (anthropic.APIConnectionError(request=req), 502),
            (ValueError("boom"), 500),
        ]
        for i, (err, expected) in enumerate(cases):
            srv.set_client(FakeClient(err))
            status, body, _ = self.request("POST", "/ask", {"question": f"err {i}"},
                                           headers={"X-Forwarded-For": f"10.0.0.{i}"})
            self.assertEqual(status, expected, type(err).__name__)
            self.assertIn("error", body)


if __name__ == "__main__":
    unittest.main()
