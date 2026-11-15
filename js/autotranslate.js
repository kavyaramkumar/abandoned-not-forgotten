/*
 * AUTO-TRANSLATE (browser built-in, free, on-device)
 * ------------------------------------------------------------
 * Chrome and Edge ship a translator that runs on the player's device: no
 * API key, no cost, nothing sent to a server. When a player picks a
 * language, this file uses it to translate whatever is still in English:
 *
 *   1. Any part of the page marked lang="en" (machine stories, fact files,
 *      glossary, Learn more, quizzes...). Each translated block gets the
 *      new language in its lang attribute, so Read to Me uses a voice for
 *      that language.
 *   2. Interface labels that a language file doesn't have yet.
 *
 * Hand translations (js/i18n/*.js and js/story-i18n*.js) always win; this
 * only fills gaps. In browsers without the translator (Safari, Firefox,
 * some embedded browsers) nothing changes: English stays, with its note.
 * Results are cached in localStorage so each sentence is translated once.
 */
window.AutoTr = (function () {
  const CACHE_KEY = "autotr-cache-v1";
  const LEAF = "p, li, blockquote, dd, dt, h1, h2, h3, h4, figcaption, summary, button, label, td, th";
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch (e) { cache = {}; }
  let saveTimer = null;
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* full or blocked */ } }, 800);
  };

  const supported = () => typeof self !== "undefined" && "Translator" in self;
  const translators = {};
  const base = (code) => String(code || "en").toLowerCase();

  // Get (or create) the en -> lang translator. Creating one may download a
  // language pack, which the browser only allows right after a click, so the
  // language picker calls prepare() from its change handler.
  function get(lang, activate) {
    lang = base(lang);
    if (!supported() || lang === "en") return Promise.resolve(null);
    if (translators[lang]) return translators[lang];
    const p = (async () => {
      try {
        const av = await Translator.availability({ sourceLanguage: "en", targetLanguage: lang });
        if (av === "unavailable") return null;
        if (av !== "available" && !activate) return null;
        return await Translator.create({ sourceLanguage: "en", targetLanguage: lang });
      } catch (e) { return null; }
    })();
    translators[lang] = p;
    p.then((tr) => { if (!tr) delete translators[lang]; });
    return p;
  }

  async function translate(text, lang) {
    const src = String(text || "").trim();
    if (!src) return text;
    const key = base(lang) + "\u0001" + src;
    if (cache[key]) return cache[key];
    const tr = await get(lang, false);
    if (!tr) return null;
    try {
      const out = await tr.translate(src);
      if (out) { cache[key] = out; persist(); }
      return out || null;
    } catch (e) { return null; }
  }

  // Translate every English block on the page that hasn't been done yet.
  let running = false, again = false;
  async function translatePage() {
    const lang = window.I18N ? I18N.lang : "en";
    if (lang === "en" || !supported()) return;
    if (running) { again = true; return; }
    running = true;
    try {
      const tr = await get(lang, false);
      if (!tr) return;
      const blocks = [...document.querySelectorAll('[lang="en"]:not([data-autotr])')];
      for (const el of blocks) {
        if (!document.contains(el)) continue;
        // glossary words (button.term) are part of the sentence, not separate blocks
        const isBlock = (x) => x.matches(LEAF) && !x.matches(".term");
        const hasBlockInside = (x) => [...x.querySelectorAll(LEAF)].some(isBlock);
        let leaves = [...el.querySelectorAll(LEAF)].filter((x) => isBlock(x) && !hasBlockInside(x));
        if ((isBlock(el) && !hasBlockInside(el)) || !leaves.length) leaves = [el];
        let ok = true;
        for (const leaf of leaves) {
          const src = leaf.textContent.replace(/\s+/g, " ").trim();
          if (!src) continue;
          const out = await translate(src, lang);
          if (out == null) { ok = false; break; }
          if (I18N.lang !== lang) return; // language changed mid-way
          leaf.textContent = out;
        }
        if (!ok) continue;
        el.setAttribute("lang", lang);
        el.removeAttribute("dir");
        el.dataset.autotr = "1";
        // the "this part is in English" note no longer applies
        const box = el.closest("dialog, .ex-body, .story-body, section") || document;
        box.querySelectorAll(".en-note:not([data-autotr])").forEach((n) => {
          n.textContent = I18N.t("autotr.note");
          n.dataset.autotr = "1";
        });
      }
    } finally {
      running = false;
      if (again) { again = false; translatePage(); }
    }
  }

  // Fill interface labels the language file is missing, protecting {placeholders}.
  async function fillLabels(lang) {
    if (!window.I18N || !I18N.missing) return false;
    const keys = I18N.missing(lang).filter((k) => !/[<>]/.test(I18N.raw("en", k)));
    if (!keys.length) return false;
    const tr = await get(lang, false);
    if (!tr) return false;
    const add = {};
    for (const k of keys) {
      const en = I18N.raw("en", k);
      const slots = en.match(/\{[a-zA-Z]+\}/g) || [];
      let src = en;
      slots.forEach((s, i) => { src = src.replace(s, "[" + (i + 1) + "]"); });
      const out = await translate(src, lang);
      if (out == null) continue;
      let back = out;
      let fine = true;
      slots.forEach((s, i) => { if (back.includes("[" + (i + 1) + "]")) back = back.replace("[" + (i + 1) + "]", s); else fine = false; });
      if (fine) add[k] = back;
    }
    if (!Object.keys(add).length) return false;
    I18N.add(lang, add);
    return true;
  }

  // Called when the player picks a language (inside the click, so a language
  // pack is allowed to download), and once at startup.
  async function prepare(lang, activate) {
    lang = base(lang);
    if (lang === "en" || !supported()) return;
    const tr = await get(lang, activate);
    if (!tr || (window.I18N && I18N.lang !== lang)) return;
    const changed = await fillLabels(lang);
    if (changed && window.I18N && I18N.lang === lang) I18N.set(lang);
    translatePage();
  }

  // Translate new English content as it appears (dialogs, cards, chat...).
  let pending = null;
  const watch = new MutationObserver(() => {
    if (!window.I18N || I18N.lang === "en" || !supported()) return;
    clearTimeout(pending);
    pending = setTimeout(translatePage, 60);
  });
  if (document.body) watch.observe(document.body, { childList: true, subtree: true });
  else addEventListener("DOMContentLoaded", () => watch.observe(document.body, { childList: true, subtree: true }));

  return { supported, prepare, translate, translatePage };
})();
