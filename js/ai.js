/*
 * "ASK THE EXHIBIT" GUIDE
 * ------------------------------------------------------------
 * Two modes:
 *  1. LIVE AI: set CONFIG.askEndpoint to the URL of server/ask_server.py (Python)
 *     (or a deployed copy). The browser never sees the API key.
 *  2. OFFLINE GUIDE (default): answers from the exhibit's `faq` list in
 *     data.js, so the prototype works with no server at all.
 */

window.CONFIG = window.CONFIG || {
  // The AI server (server/ask_server.py) answers from NASA websites only.
  // When the museum is opened from this computer, use the local server.
  // For the live site, set this to wherever the server is hosted.
  askEndpoint: /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8787/ask" : null,
};

window.ExhibitGuide = (function () {
  // is the AI server actually running? If not, stay in offline mode (so the chat doesn't say "AI guide")
  if (window.CONFIG.askEndpoint) {
    const health = window.CONFIG.askEndpoint.replace(/\/ask$/, "/health");
    fetch(health).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!d || !d.ok) window.CONFIG.askEndpoint = null; })
      .catch(() => { window.CONFIG.askEndpoint = null; });
  }
  // the questions students ask most, matched to the quick facts in js/facts.js
  const INTENTS = [
    ["builtBy", /\b(who|which company|built|build|made|make|maker|designed|design|engineers?|created?|invent)/],
    ["lasted", /\b(how long|last(ed|s)?|work(ed)? for|still work|lifetime|how many (years|days)|stop(ped)? working|die|died|end(ed)?)\b/],
    ["launched", /\b(when|launch(ed)?|land(ed)?|year|date|arriv(e|ed))\b/],
    ["mass", /\b(heavy|weigh(s|t)?|mass|kilo(gram)?s?|pounds?)\b/],
    ["size", /\b(how big|big|size|tall|how long is|wide|large|small|tiny)\b/],
    ["power", /\b(powers?|powered|energy|batter(y|ies)|solar|nuclear|electric(ity)?|fuel|charge)\b/],
    ["speed", /\b(fast|speed|quick|drive|drove|how far|distance|travel)\b/],
  ];
  function factAnswer(exhibit, q) {
    const f = (window.FACTS || {})[exhibit.id];
    if (!f) return null;
    for (const [key, re] of INTENTS) {
      if (!re.test(q)) continue;
      if (f[key]) return f[key] + (key === "builtBy" && f.special ? " " + f.special : "");
      if (key === "size" && f.mass) return f.mass;
      if (key === "mass" && f.size) return f.size;
    }
    return null;
  }

  /* ---------------------------------------------------------------
   * MUSEUM KNOWLEDGE BASE (offline search)
   * Every story, fact file, NASA catalog entry, space word, Learn more
   * section, and hall fact becomes a short note. A question is matched to
   * the notes that share the most meaningful words with it.
   * --------------------------------------------------------------- */
  const STOP = new Set("a an the is are was were be been am do does did of to in on at for from by with and or but if it its it's this that these those what which who whom whose when where why how there here i you me my your we our they them their he she his her can could would should will about into than then so as up out not no yes just also very much many more most some any all tell know go goes going went get got".split(" "));
  const stem = (w) => w.replace(/'s$/, "").replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/(.)\1$/, "$1");
  const words = (text) => String(text).toLowerCase().replace(/<[^>]+>/g, " ").match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
  const keyWords = (text) => words(text).filter((w) => !STOP.has(w) && w.length > 1).map(stem);
  const plain = (h) => String(h).replace(/<[^>]+>/g, "");
  // everyday words students use, mapped to the words the museum's notes use
  const RELATED = {
    kill: "quiet silent stop last lost power storm end", die: "quiet silent stop last lost power storm end", dead: "quiet silent stop last lost power end",
    end: "quiet silent stop last lost", stop: "quiet silent last lost", broke: "damag stuck fail", broken: "damag stuck fail",
    legal: "law treaty own belong agreement act", legally: "law treaty own belong agreement act", law: "treaty own belong agreement act", own: "belong treaty", owner: "belong treaty own",
    invent: "invent patent spinoff develop", invention: "patent spinoff develop", patent: "invent licens", medicine: "health medical doctor patient", medical: "health medicine doctor patient", doctor: "health medical",
    fly: "flight flew helicopter aircraft rotor", flying: "flight flew helicopter aircraft rotor", flew: "flight helicopter aircraft",
    old: "oldest first earliest 1964", oldest: "first earliest 1964", newest: "latest recent", alive: "talking still working", working: "still talking working",
    find: "discover found learn measur show", found: "discover learn measur show", discover: "found learn measur", inside: "crust mantle core interior",
    big: "size meter long tall", heavy: "kilogram weigh mass", weight: "kilogram mass", fast: "speed kilometer per", far: "kilometer distance away",
    first: "first", build: "built", built: "built made led managed", photo: "picture image camera", picture: "photo image camera", water: "ice water", alien: "life",
  };
  // look related words up by their simplified form ("killed" and "kill" both become "kil")
  const RELATED_STEM = {};
  Object.entries(RELATED).forEach(([k, v]) => (RELATED_STEM[stem(k)] = v.split(" ").map(stem)));
  const expand = (keys) => keys.concat(...keys.map((k) => RELATED_STEM[k] || []));
  let KB = null, IDF = null;
  function buildKB() {
    const M = window.MUSEUM || {}, F = window.FACTS || {}, N = window.NASA_DATA || {}, G = window.GLOSSARY || {}, L = window.LEARN || [];
    const docs = [];
    const add = (text, ex, kind, about) => { if (text) docs.push({ text: plain(text).trim(), ex: ex ? ex.id : null, name: ex ? ex.name : null, kind, about: about || "" }); };
    const sentences = (t) => plain(t).match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g) || [];
    const machines = (M.wings || []).flatMap((w) => (w.exhibits || []).map((e) => ({ ...e, wingName: w.name }))).concat(M.treasures || []);
    machines.forEach((e) => {
      (e.story || []).forEach((page) => sentences(page).forEach((x) => add(x, e, "story")));
      (e.leftBehind || []).forEach((x) => add(`Still out there today: ${x}.`, e, "left"));
      sentences(e.discovery || "").forEach((x) => add(x, e, "learned"));
      sentences(e.next || "").forEach((x) => add(x, e, "next"));
      (e.faq || []).forEach((f) => add(f.a, e, "faq"));
      if (e.quiz) add(`${e.quiz.q} ${e.quiz.options[e.quiz.answer]}. ${(e.quiz.explain || "").replace(/^(Right|Correct|Yes|Exactly|That's right)[!.,]\s*/i, "")}`, e, "quiz");
      if (e.place) add(`${e.name} is at ${e.place}.`, e, "place");
      if (e.wingName) add(`${e.name} is in the ${e.wingName}.`, e, "wing");
      Object.values(F[e.id] || {}).forEach((x) => add(x, e, "fact"));
      const n = N[e.id];
      if (n) {
        if (n.restingPlace) add(`${e.name} rests at: ${n.restingPlace}.`, e, "nasa");
        if (n.launch) add(`${e.name} launched on ${n.launch}.`, e, "nasa");
        if (n.arrival) add(`${e.name} arrived on ${n.arrival}.`, e, "nasa");
        if (n.lastContact) add(`${e.name}'s last contact with Earth was on ${n.lastContact}.`, e, "nasa");
        if (n.mass) add(`${e.name}'s mass was ${n.mass}.`, e, "nasa");
        if (n.status) add(`${e.name} status: ${n.status}.`, e, "nasa");
        if (n.nssdcId) add(`${e.name}'s NASA catalog (NSSDCA) ID is ${n.nssdcId}.`, e, "nasa");
      }
    });
    (M.wings || []).forEach((w) => { if (w.intro) add(`${w.name}: ${w.intro}`, null, "wing"); if (w.subtitle) add(`${w.name}: ${w.subtitle}.`, null, "wing"); });
    (M.halls || []).forEach((h) => add(h.fact, null, "hall"));
    Object.values(G).forEach((g) => add(`${g.term}: ${g.def}`, null, "word"));
    // Learn more notes also match their section's title ("The Outer Space Treaty", "Space technology in medicine")
    L.forEach((sec) => (sec.sections || []).forEach((x) => {
      const about = `${sec.title} ${x.h}`;
      (x.p || []).forEach((p) => sentences(p).forEach((y) => add(y, null, "learn", about)));
      (x.list || []).forEach((li) => add(li, null, "learn", about));
    }));
    docs.forEach((d) => { d.keys = new Set(keyWords(d.text + " " + (d.name || "") + " " + d.about)); });
    const df = {};
    docs.forEach((d) => d.keys.forEach((k) => (df[k] = (df[k] || 0) + 1)));
    IDF = {};
    Object.keys(df).forEach((k) => (IDF[k] = Math.log(1 + docs.length / df[k])));
    KB = { docs, machines };
  }
  /* best notes for a question; preferId favors the machine you're chatting with */
  function search(question, preferId, limit) {
    if (!KB) buildKB();
    let q = keyWords(question);
    if (!q.length) return [];
    const ql = question.toLowerCase();
    // a machine named in the question gets priority
    const named = KB.machines.find((m) => ql.includes(m.name.toLowerCase()) || ql.includes(m.id.replace(/-/g, " ")));
    const target = named ? named.id : preferId;
    // the machine's own name says which machine, not what the question is about
    const tm = target && KB.machines.find((m) => m.id === target);
    if (tm) {
      const nameKeys = new Set(keyWords(tm.name + " " + tm.id.replace(/-/g, " ")));
      const rest = q.filter((k) => !nameKeys.has(k));
      if (rest.length) q = rest;
    }
    q = expand(q);
    // question words that point at a kind of answer
    if (/\bwhere\b/.test(ql)) q = q.concat(["rest", "locat", "head", "toward", "now", "land", "orbit"]);
    if (/\bwho\b/.test(ql)) q = q.concat(["built", "led", "managed"]);
    const wantsWho = /\bwho\b/.test(ql), wantsWhen = /\bwhen|year|date\b/.test(ql), wantsNum = /how (many|much|far|fast|big|heavy|long)/.test(ql);
    const scored = KB.docs.map((d) => {
      let sc = 0;
      q.forEach((k) => { if (d.keys.has(k)) sc += IDF[k] || 1; });
      if (!sc) return { d, sc };
      if (target && d.ex === target) sc *= named ? 2.2 : 1.8;
      else if (named) sc *= d.ex ? 0.5 : 0.4; // the question names a machine: other notes count less
      else if (target && !named) sc *= 0.6; // chatting with one machine: its own notes come first
      if (wantsWho && /built|made|led|managed|designed/i.test(d.text)) sc *= 1.3;
      if ((wantsWhen || wantsNum) && /\d/.test(d.text)) sc *= 1.25;
      return { d, sc };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
    return scored.slice(0, limit || 3);
  }
  function kbAnswer(question, preferId) {
    const hits = search(question, preferId, 6);
    if (!hits.length || hits[0].sc < 2.2) return null;
    const best = hits[0].d;
    let text = best.text;
    // add a second note about the same thing when it's nearly as good
    const same = (d) => (best.ex ? d.ex === best.ex : best.about && d.about === best.about);
    const short = best.text.length < 70; // a very short note needs the next one to make sense
    const second = hits.find((h, i) => i > 0 && same(h.d) && h.sc > hits[0].sc * (short ? 0.4 : 0.75) && h.d.text !== best.text);
    if (second) text += " " + second.d.text;
    const about = best.ex && best.ex !== preferId && best.name && !text.startsWith(best.name) ? `${best.name}: ` : "";
    return about + text;
  }
  /* notes to hand the AI server along with a question */
  function notesFor(question, preferId) {
    return search(question, preferId, 8).map((h) => (h.d.name ? `[${h.d.name}] ` : "") + h.d.text);
  }

  /* ---------------------------------------------------------------
   * SMART SEARCH: a small AI language model in the browser
   * all-MiniLM-L6-v2 (via transformers.js) turns every note and each question
   * into a "meaning vector", so questions match notes by meaning, not just by
   * shared words. Runs on the student's device: no key, no server, and the
   * question never leaves the computer. Notes' vectors are cached in IndexedDB.
   * If the model can't load, the keyword search above keeps working.
   * --------------------------------------------------------------- */
  const SEM = { state: "idle", extractor: null, vecs: null, dim: 384, listeners: [] };
  const TF_URL = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
  const idb = (mode, fn) => new Promise((res) => {
    try {
      const open = indexedDB.open("rfs-smart-search", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("v");
      open.onsuccess = () => { const tx = open.result.transaction("v", mode); const req = fn(tx.objectStore("v")); req.onsuccess = () => res(req.result); req.onerror = () => res(null); };
      open.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  const hashText = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
  const docText = (d) => (d.name ? d.name + ": " : "") + d.text;
  async function warmup() {
    if (SEM.state !== "idle") return;
    SEM.state = "loading";
    try {
      if (!KB) buildKB();
      const tf = await import(TF_URL);
      tf.env.allowLocalModels = false;
      SEM.extractor = await tf.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
      const key = "v1-" + KB.docs.length + "-" + hashText(KB.docs.map(docText).join("|"));
      let vecs = await idb("readonly", (st) => st.get(key));
      if (!vecs || vecs.length !== KB.docs.length * SEM.dim) {
        vecs = new Float32Array(KB.docs.length * SEM.dim);
        for (let i = 0; i < KB.docs.length; i += 16) {
          const out = await SEM.extractor(KB.docs.slice(i, i + 16).map(docText), { pooling: "mean", normalize: true });
          vecs.set(out.data, i * SEM.dim);
          await new Promise((r) => setTimeout(r, 0)); // let the game keep running smoothly
        }
        idb("readwrite", (st) => st.put(vecs, key));
      }
      SEM.vecs = vecs;
      SEM.state = "ready";
    } catch (e) {
      console.warn("Smart search unavailable, using keyword search:", e);
      SEM.state = "failed";
    }
    SEM.listeners.forEach((f) => f(SEM.state));
  }
  /* hybrid ranking: meaning similarity + keyword score + the machine you're talking to */
  async function smartHits(question, preferId, limit) {
    if (SEM.state !== "ready") return null;
    if (!KB) buildKB();
    const qv = (await SEM.extractor([question], { pooling: "mean", normalize: true })).data;
    const kw = new Map(search(question, preferId, 60).map((h) => [h.d, h.sc]));
    const kwMax = Math.max(1, ...kw.values());
    const ql = question.toLowerCase();
    const named = KB.machines.find((m) => ql.includes(m.name.toLowerCase()) || ql.includes(m.id.replace(/-/g, " ")));
    const target = named ? named.id : preferId;
    const out = [];
    for (let i = 0; i < KB.docs.length; i++) {
      const d = KB.docs[i];
      let sim = 0;
      for (let j = 0, o = i * SEM.dim; j < SEM.dim; j++) sim += qv[j] * SEM.vecs[o + j];
      let sc = sim * 0.75 + ((kw.get(d) || 0) / kwMax) * 0.25;
      if (d.kind === "wing" || d.kind === "place" || d.text.length < 60) sc -= 0.06; // short slogans match everything a little
      if (d.kind === "word" && !/\b(what (is|are|does)|mean|define)\b/.test(ql)) sc -= 0.05; // definitions only win definition questions
      if (target && d.ex === target) sc += named ? 0.12 : 0.08;
      else if (named && d.ex) sc -= 0.08;
      out.push({ d, sc, sim });
    }
    return out.sort((a, b) => b.sc - a.sc).slice(0, limit || 4);
  }
  async function smartAnswer(question, preferId) {
    const hits = await smartHits(question, preferId, 6);
    if (!hits || !hits.length || hits[0].sim < 0.3) return null;
    const best = hits[0].d;
    let text = best.text;
    const same = (d) => (best.ex ? d.ex === best.ex : best.about && d.about === best.about);
    const second = hits.find((h, i) => i > 0 && same(h.d) && h.sc > hits[0].sc * 0.85 && h.d.text !== best.text);
    if (second) text += " " + second.d.text;
    const about = best.ex && best.ex !== preferId && best.name && !text.startsWith(best.name) ? `${best.name}: ` : "";
    return about + text;
  }

  function offlineAnswer(exhibit, question) {
    const q = question.toLowerCase();
    // treasures have no "discovery"; use their first story page instead
    const fav = exhibit.discovery || (exhibit.story && exhibit.story[0]) || "";
    const fact = factAnswer(exhibit, q);
    if (fact) return fact;
    let best = null;
    let bestScore = 0;
    for (const item of exhibit.faq || []) {
      const score = item.keys.reduce((s, k) => (q.includes(k) ? s + k.length : s), 0);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    if (best && bestScore >= 4) return best.a;
    const kb = kbAnswer(question, exhibit.id);
    if (kb) return kb;
    if (best) return best.a;

    if (/(now|today|doing|status|alive|working)/.test(q)) {
      const now = {
        silent: "It's silent now: it no longer sends messages to Earth.",
        parked: "It's parked for good now and no longer moves.",
        "still talking": "It's still sending messages back to Earth!",
      }[exhibit.status];
      return `${now} Still out there: ${exhibit.leftBehind.join("; ")}.`;
    }
    if (/(when|year)/.test(q))
      return `${exhibit.name} launched or landed in ${exhibit.year}. ${fav}`;
    if (/(where|location)/.test(q)) return `${exhibit.name} is at: ${exhibit.place}.`;
    if (/(left|still there|behind)/.test(q))
      return "Still out there: " + exhibit.leftBehind.join("; ") + ".";
    if (/(learn|discover|find|why)/.test(q)) return exhibit.discovery;

    const f = (window.FACTS || {})[exhibit.id];
    const can = f ? "who built it, when it launched, how long it worked, how big it was, or what powered it" : "what it found or what it left behind";
    return `I don't have that one in my notes yet. You can ask me ${can}. Here's my favorite fact: ${fav}`;
  }

  async function offline(exhibit, question) {
    const fact = factAnswer(exhibit, question.toLowerCase());
    if (fact) return { text: fact, mode: "offline" };
    const smart = await smartAnswer(question, exhibit.id);
    if (smart) return { text: smart, mode: "smart" };
    return { text: offlineAnswer(exhibit, question), mode: "offline" };
  }

  async function ask(exhibit, question, history) {
    if (!window.CONFIG.askEndpoint) return offline(exhibit, question);
    try {
      const res = await fetch(window.CONFIG.askEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exhibit: {
            name: exhibit.name,
            kind: exhibit.kind,
            place: exhibit.place,
            year: exhibit.year,
            status: exhibit.status,
            story: exhibit.story,
            leftBehind: exhibit.leftBehind,
            discovery: exhibit.discovery,
          },
          question,
          notes: notesFor(question, exhibit.id),
          history: history.slice(-6),
        }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      // only ever show links to NASA's own websites
      const sources = (data.sources || []).filter((s) => /^https:\/\/([a-z0-9-]+\.)*nasa\.gov(\/|$)/i.test(s.url));
      return { text: data.answer, mode: "ai", sources };
    } catch (err) {
      console.warn("AI guide unavailable, using offline notes:", err);
      return offline(exhibit, question);
    }
  }

  return {
    ask, search, kbAnswer, notesFor, smartAnswer, warmup,
    get smartState() { return SEM.state; },
    onSmart: (f) => SEM.listeners.push(f),
    rebuild: () => { KB = null; SEM.state = "idle"; SEM.vecs = null; },
  };
})();
