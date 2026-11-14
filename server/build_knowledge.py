"""
Build server/knowledge.json from the museum's own content
------------------------------------------------------------
The museum's facts live in browser JavaScript files (js/data.js, js/facts.js,
js/nasa-data.js, ...). This script loads them with macOS JavaScriptCore (jsc),
the same way the browser does, and turns everything into short "notes" the
AI server can search.

knowledge.json is committed to the repo, so the server itself never needs jsc
and runs anywhere (Linux hosting included). Re-run this after editing content:

    server/.venv/bin/python server/build_knowledge.py

Set JSC=/path/to/jsc if JavaScriptCore lives somewhere else.
"""

import datetime
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
JS_DIR = ROOT / "js"
OUT = HERE / "knowledge.json"
DEFAULT_JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"

# content files, in the order index.html loads them (the order matters: data-extra.js extends MUSEUM and FACTS)
CONTENT_FILES = ["data.js", "facts.js", "data-extra.js", "nasa-data.js", "orbit.js", "sounds.js", "learn.js"]
GLOBALS = ["MUSEUM", "FACTS", "NASA_DATA", "GLOSSARY", "LEARN", "ORBIT", "SOUNDS"]


def script_order():
    """Content files in index.html's <script> order (falls back to CONTENT_FILES)."""
    index = ROOT / "index.html"
    if not index.exists():
        return CONTENT_FILES
    found = re.findall(r'<script[^>]+src="js/([\w.-]+\.js)', index.read_text())
    ordered = [f for f in found if f in CONTENT_FILES]
    missing = [f for f in CONTENT_FILES if f not in ordered]
    if missing:
        sys.exit(f"index.html doesn't load {missing}; update CONTENT_FILES in build_knowledge.py")
    return ordered


def dump_with_jsc():
    jsc = os.environ.get("JSC", DEFAULT_JSC)
    if not Path(jsc).exists():
        sys.exit(f"JavaScriptCore not found at {jsc}. Set JSC=/path/to/jsc (macOS ships it).")
    lines = ["var window = {};", "var navigator = {language: 'en'};"]
    lines += [f"load({json.dumps(str(JS_DIR / f))});" for f in script_order()]
    # print one JSON document; escape non-ASCII so jsc's output encoding can't garble it
    lines.append(
        "var out = {}; [%s].forEach(function (k) { out[k] = window[k] || null; });"
        % ",".join(json.dumps(g) for g in GLOBALS)
    )
    lines.append(
        "print(JSON.stringify(out).replace(/[\\u007f-\\uffff]/g, function (c) {"
        " return '\\\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); }));"
    )
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
        f.write("\n".join(lines))
        script = f.name
    try:
        proc = subprocess.run([jsc, script], capture_output=True, text=True, timeout=60)
    finally:
        os.unlink(script)
    if proc.returncode != 0:
        sys.exit("jsc failed:\n" + proc.stderr + proc.stdout)
    return json.loads(proc.stdout.strip().splitlines()[-1])


# ---------------------------------------------------------------- notes

TAG = re.compile(r"<[^>]+>")
SPACE = re.compile(r"\s+")


def plain(text):
    return SPACE.sub(" ", TAG.sub("", str(text or ""))).strip()


def is_nasa(url):
    host = (urlparse(url or "").hostname or "").lower()
    return host == "nasa.gov" or host.endswith(".nasa.gov")


def words(text):
    return set(re.findall(r"[a-z0-9]+", text.lower())) - {"the", "a", "of", "and", "in", "on", "to", "nasa", "for"}


def best_source(heading, sources):
    """The Learn source whose title best matches a section heading (NASA pages win ties)."""
    if not sources:
        return None, None
    hw = words(heading)
    scored = sorted(
        sources,
        key=lambda s: (len(hw & words(s.get("title", ""))), is_nasa(s.get("url"))),
        reverse=True,
    )
    s = scored[0]
    if not hw & words(s.get("title", "")):
        nasa = [x for x in sources if is_nasa(x.get("url"))]
        s = nasa[0] if nasa else s
    return s.get("url"), s.get("title")


def build_notes(data):
    M = data["MUSEUM"] or {}
    F = data["FACTS"] or {}
    N = data["NASA_DATA"] or {}
    G = data["GLOSSARY"] or {}
    L = data["LEARN"] or []
    O = data["ORBIT"] or {}
    S = data["SOUNDS"] or {}

    notes, machines = [], []

    def add(text, kind, m=None, url=None, title=None):
        text = plain(text)
        if not text:
            return
        notes.append({
            "id": f"n{len(notes) + 1}",
            "machine_id": m["id"] if m else None,
            "machine_name": m["name"] if m else None,
            "kind": kind,
            "text": text,
            "source_url": url,
            "source_title": title,
        })

    entries = [(e, w) for w in M.get("wings", []) for e in w.get("exhibits", [])]
    entries += [(t, None) for t in M.get("treasures", [])]
    for e, wing in entries:
        n = N.get(e["id"]) or {}
        srcs = [u for u in e.get("sources") or [] if isinstance(u, str)]
        mission_url = n.get("missionUrl") or next((u for u in srcs if "nssdc" not in u), None) or (srcs[0] if srcs else None)
        nssdc_url = n.get("nssdcUrl") or next((u for u in srcs if "nssdc" in u), None)
        name = e["name"]
        mission_title = f"NASA: {name}"
        nssdc_title = f"NASA NSSDCA catalog: {name}"
        machines.append({
            "id": e["id"],
            "name": name,
            "kind": e.get("kind"),
            "place": e.get("place"),
            "year": e.get("year"),
            "status": e.get("status"),
            "wing": wing["name"] if wing else "Hidden treasures",
            "treasure": bool(e.get("treasure")),
            "url": mission_url,
        })
        u, t = mission_url, mission_title
        kind = (e.get("kind") or "machine").lower()
        article = "an" if kind[:1] in "aeiou" else "a"
        add(f"{name} is {article} {kind} from {e.get('year')}. It is at {e.get('place')}. "
            f"Status in the museum: {e.get('status')}.", "overview", e, u, t)
        for i, page in enumerate(e.get("story") or []):
            add(page, "story", e, u, t)
        for x in e.get("leftBehind") or []:
            add(f"Still out there today: {plain(x)}.", "left_behind", e, u, t)
        add(e.get("discovery"), "discovery", e, u, t)
        add(e.get("next"), "next", e, u, t)
        q = e.get("quiz")
        if q and q.get("options"):
            explain = re.sub(r"^(Right|Correct|Yes|Exactly|That's right)[!.,]\s*", "", q.get("explain") or "", flags=re.I)
            add(f"{q['q']} Answer: {q['options'][q['answer']]}. {explain}", "quiz", e, u, t)
        for f in e.get("faq") or []:
            add(f.get("a"), "faq", e, u, t)
        for key, val in (F.get(e["id"]) or {}).items():
            add(val, "fact", e, u, t)
        if n:
            nu, nt = nssdc_url, nssdc_title
            if n.get("restingPlace"):
                add(f"{name} rests at: {n['restingPlace']}.", "nasa_catalog", e, nu, nt)
            if n.get("status"):
                add(f"{name} status (NASA catalog): {n['status']}.", "nasa_catalog", e, nu, nt)
            dates = []
            if n.get("launch"):
                dates.append(f"launched on {n['launch']}")
            if n.get("arrival"):
                dates.append(f"arrived on {n['arrival']}")
            if n.get("lastContact"):
                dates.append(f"last contact with Earth was on {n['lastContact']}")
            if dates:
                add(f"{name} " + ", ".join(dates[:-1]) + (" and " if len(dates) > 1 else "") + dates[-1] + ".", "nasa_catalog", e, nu, nt)
            if n.get("mass"):
                add(f"{name}'s mass (NASA catalog): {n['mass']}.", "nasa_catalog", e, nu, nt)
            if n.get("nssdcId"):
                add(f"{name}'s NASA NSSDCA catalog ID is {n['nssdcId']}; its catalog page is {nssdc_url}.", "nasa_catalog", e, nu, nt)
        o = O.get(e["id"])
        if o and o.get("caption"):
            add(f"Orbit view of {name}: {o['caption']} Photo by {o.get('camera', 'NASA')} ({o.get('taken', '')}), credit {o.get('credit', 'NASA')}.",
                "orbit_view", e, o.get("source") or u, f"NASA: orbit view of {name}")
        s = S.get(e["id"])
        if s and s.get("caption"):
            add(f"Sound from {name}: {s.get('title', '')}. {s['caption']}", "sound", e, s.get("source") or u, f"NASA: {s.get('title') or name}")

    for w in M.get("wings", []):
        if w.get("intro"):
            add(f"{w['name']}: {w['intro']}", "wing")
        if w.get("question"):
            add(f"{w['name']} ({w.get('subtitle', '')}) asks: {w['question']}", "wing")
    for h in M.get("halls", []):
        if h.get("fact"):
            add(f"{h.get('name', 'Museum hall')}: {h['fact']}", "hall")
    for g in G.values():
        add(f"{g['term']} (space word): {g['def']}", "glossary")
    for sec in L:
        srcs = sec.get("sources") or []
        if sec.get("lead"):
            u, t = best_source(sec["title"], srcs)
            add(f"{sec['title']}: {sec['lead']}", "learn", None, u, t)
        for part in sec.get("sections") or []:
            head = f"{sec['title']}, {plain(part.get('h', ''))}"
            u, t = best_source(part.get("h", "") + " " + sec["title"], srcs)
            for p in part.get("p") or []:
                add(f"{head}: {p}", "learn", None, u, t)
            for li in part.get("list") or []:
                add(f"{head}: {li}", "learn", None, u, t)
    return machines, notes


def main():
    data = dump_with_jsc()
    machines, notes = build_notes(data)
    exhibits = [m for m in machines if not m["treasure"]]
    covered = {n["machine_id"] for n in notes if n["machine_id"]}
    missing = [m["id"] for m in machines if m["id"] not in covered]
    if missing:
        sys.exit(f"No notes for: {missing}")
    OUT.write_text(json.dumps({
        "generated": datetime.date.today().isoformat(),
        "source_files": script_order(),
        "machines": machines,
        "notes": notes,
    }, ensure_ascii=False, indent=1) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(notes)} notes, {len(exhibits)} machines + "
          f"{len(machines) - len(exhibits)} hidden treasures, all with notes.")


if __name__ == "__main__":
    main()
