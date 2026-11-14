"""
Museum note search (BM25)
------------------------------------------------------------
Ranks the notes in knowledge.json against a student's question with Okapi BM25,
plus a light stemmer, a few everyday-word synonyms ("killed" -> storm, silent,
lost...), and a boost for notes about a machine the question names (or the
machine the student is chatting with). Standard library only.
"""

import json
import math
import re
from collections import Counter
from pathlib import Path

STOP = set("""
a an the is are was were be been am do does did of to in on at for from by with and or but if it its it's this that
these those what which who whom whose when where why how there here i you me my your we our they them their he she his
her can could would should will about into than then so as up out not no yes just also very much many more most some
any all tell know go goes going went get got has have had please really thing things one ever like
""".split())

# everyday words students use -> words the museum's notes use (all stemmed at load time)
RELATED = {
    "kill": "storm dust silent lost power end stop last",
    "die": "storm dust silent lost power end stop last",
    "dead": "silent lost power end stop last",
    "death": "silent lost power end stop last",
    "end": "silent stop last lost",
    "stop": "silent last lost end",
    "broke": "damage stuck fail",
    "broken": "damage stuck fail",
    "legal": "law treaty ownership belong agreement",
    "law": "treaty ownership belong agreement",
    "own": "ownership belong treaty",
    "owner": "ownership belong treaty",
    "belong": "ownership treaty",
    "invent": "patent spinoff invention",
    "medicine": "health medical",
    "find": "discover found learn",
    "discover": "found learn",
    "big": "size meter long tall",
    "heavy": "kilogram weigh mass",
    "weigh": "kilogram mass",
    "fast": "speed kilometer",
    "far": "kilometer distance away",
    "build": "built made",
    "photo": "picture image camera",
    "picture": "photo image camera",
    "alien": "life",
    "now": "today rest still status",
    "power": "solar battery nuclear plutonium",
}

TOKEN = re.compile(r"[a-z0-9]+")


def stem(w):
    """A deliberately light stemmer: plural -s, then up to two of -ship/-ing/-ed/-ly/-er, then a final -e."""
    if len(w) <= 3 or w.isdigit():
        return w
    if w.endswith("ies") and len(w) > 4:
        w = w[:-3] + "y"
    elif w.endswith("s") and not w.endswith(("ss", "us", "is")):
        w = w[:-1]
    for _ in range(2):
        for suf in ("ship", "ing", "ed", "ly", "er"):
            if w.endswith(suf) and len(w) - len(suf) >= 3:
                w = w[: -len(suf)]
                break
        else:
            break
    if len(w) > 4 and w.endswith("e"):
        w = w[:-1]
    if len(w) > 3 and w[-1] == w[-2] and w[-1] not in "aeiou":  # "stopp" -> "stop"
        w = w[:-1]
    return w


def tokens(text):
    text = str(text or "").lower().replace("’", "'")
    text = re.sub(r"'s\b", "", text)
    return [stem(w) for w in TOKEN.findall(text) if w not in STOP and len(w) > 1]


QUESTION_HINTS = [
    (r"\bwhere\b", [stem(w) for w in "rest located site landed orbit heading".split()]),
    (r"\bwho\b", [stem(w) for w in "built made led managed designed".split()]),
    (r"\bwhen\b", [stem(w) for w in "launched landed arrived contact".split()]),
]

RELATED_STEM = {stem(k): [stem(x) for x in v.split()] for k, v in RELATED.items()}


EXTRA_KIND_ALIASES = {"moon buggy"}


def machine_aliases(m):
    """Ways a student might name a machine: 'Voyager 1', 'voyager-1', 'ALSEP', 'Lunar Roving Vehicle'."""
    name = m["name"]
    out = {name.lower(), m["id"].replace("-", " ")}
    base = re.sub(r"\s*\(.*?\)", "", name).strip()
    out.add(base.lower())
    for inner in re.findall(r"\((.*?)\)", name):
        out.add(inner.lower())
    # "Moon buggy (rover)" -> "moon buggy"
    kind = re.sub(r"\s*\(.*?\)", "", m.get("kind") or "").strip().lower()
    if kind in EXTRA_KIND_ALIASES:
        out.add(kind)
    return {a for a in out if len(a) >= 3}


class MuseumIndex:
    def __init__(self, notes, machines=(), k1=1.4, b=0.6):
        self.notes = list(notes)
        self.machines = list(machines)
        self.by_id = {n["id"]: n for n in self.notes}
        self.k1, self.b = k1, b
        self.doc_tf, self.doc_len = [], []
        df = Counter()
        for n in self.notes:
            # the machine's name is part of every note about it
            toks = tokens(n["text"]) + tokens(n.get("machine_name") or "")
            tf = Counter(toks)
            self.doc_tf.append(tf)
            self.doc_len.append(len(toks))
            df.update(tf.keys())
        self.avg_len = (sum(self.doc_len) / len(self.doc_len)) if self.doc_len else 1.0
        N = len(self.notes)
        self.idf = {t: math.log(1 + (N - d + 0.5) / (d + 0.5)) for t, d in df.items()}
        self.alias_patterns = []
        for m in self.machines:
            for a in machine_aliases(m):
                self.alias_patterns.append((re.compile(r"\b" + re.escape(a) + r"\b"), m["id"], a))

    @classmethod
    def load(cls, path):
        data = json.loads(Path(path).read_text())
        return cls(data["notes"], data.get("machines", []))

    def named_machines(self, text):
        """{machine id: the alias the text used} for every machine the text names."""
        t = " " + re.sub(r"[^a-z0-9()]+", " ", str(text or "").lower()) + " "
        hits = {}
        for pat, mid, alias in self.alias_patterns:
            if pat.search(t):
                if len(alias) > len(hits.get(mid, "")):
                    hits[mid] = alias
        return hits

    def machine_id_for_name(self, name):
        name = str(name or "").strip().lower()
        for m in self.machines:
            if name and (m["name"].lower() == name or m["id"] == name):
                return m["id"]
        return None

    def search(self, query, k=8, prefer=None):
        """Top-k notes as [(score, note)]. prefer: the machine id the student is chatting with."""
        q = tokens(query)
        if not q:
            return []
        named = self.named_machines(query)
        name_toks = set()
        for alias in named.values():
            name_toks |= set(tokens(alias))
        for mid in set(named) | ({prefer} if prefer else set()):
            m = next((x for x in self.machines if x["id"] == mid), None)
            if m:
                name_toks |= set(tokens(m["name"] + " " + m["id"].replace("-", " ")))
        # the machine's name says WHICH machine; the rest says WHAT about it
        rest = [t for t in q if t not in name_toks] or q
        weights = Counter()
        for t in rest:
            weights[t] += 1.0
            for r in RELATED_STEM.get(t, []):
                weights[r] = max(weights[r], 0.5)
        ql = str(query).lower()
        # question words point at a kind of answer (they're stopwords, so add their targets by hand)
        for pattern, extra in QUESTION_HINTS:
            if re.search(pattern, ql):
                for t in extra:
                    weights[t] = max(weights[t], 0.5)
        wants_definition = bool(re.search(r"\bwhat(\s+is|\s+are|'s|s)\b|\bmean(s|ing)?\b|\bdefin", ql))
        scored = []
        for i, n in enumerate(self.notes):
            tf, dl = self.doc_tf[i], self.doc_len[i]
            s = 0.0
            for t, w in weights.items():
                f = tf.get(t)
                if f:
                    s += w * self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / self.avg_len))
            if s <= 0:
                continue
            mid = n.get("machine_id")
            if named:
                s *= 2.0 if mid in named else (0.5 if mid else 0.7)
            elif prefer:
                s *= 1.8 if mid == prefer else (0.6 if mid else 0.85)
            if wants_definition and n["kind"] == "glossary":
                s *= 1.6
            if re.search(r"\b(when|year|date|how (many|much|far|fast|big|heavy|long))\b", ql) and re.search(r"\d", n["text"]):
                s *= 1.15
            scored.append((s, n))
        scored.sort(key=lambda x: -x[0])
        return scored[:k]


def format_notes(hits):
    """Notes as compact text lines for the model: [id] (machine, kind) text  <source>."""
    lines = []
    for _, n in hits:
        who = n.get("machine_name") or "Museum"
        src = f"  <{n['source_url']}>" if n.get("source_url") else ""
        lines.append(f"[{n['id']}] ({who}, {n['kind']}) {n['text']}{src}")
    return "\n".join(lines)
