/*
 * "ASK THE EXHIBIT" GUIDE
 * ------------------------------------------------------------
 * Two modes:
 *  1. LIVE AI: set CONFIG.askEndpoint to the URL of server/ask-server.mjs
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
  function offlineAnswer(exhibit, question) {
    const q = question.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const item of exhibit.faq || []) {
      const score = item.keys.reduce((s, k) => (q.includes(k) ? s + k.length : s), 0);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
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
      return `${exhibit.name} launched or landed in ${exhibit.year}. ${exhibit.discovery}`;
    if (/(where|location)/.test(q)) return `${exhibit.name} is at: ${exhibit.place}.`;
    if (/(left|still there|behind)/.test(q))
      return "Still out there: " + exhibit.leftBehind.join("; ") + ".";
    if (/(learn|discover|find|why)/.test(q)) return exhibit.discovery;

    return `Great question! My offline notes don't cover that one yet. Here's my favorite fact: ${exhibit.discovery} (Ask a grown-up or a museum guide to help you look it up on nasa.gov!)`;
  }

  async function ask(exhibit, question, history) {
    if (!window.CONFIG.askEndpoint) {
      return { text: offlineAnswer(exhibit, question), mode: "offline" };
    }
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
      return { text: offlineAnswer(exhibit, question), mode: "offline" };
    }
  }

  return { ask };
})();
