/*
 * I18N: every word the game shows, in many languages
 * ------------------------------------------------------------
 * Strings live in js/i18n/<code>.js, one file per language. English (en.js) is
 * the master list: any key missing from another language falls back to English.
 *
 *   I18N.t("key", { n: 3 })     -> translated text, {n} filled in
 *   I18N.set("es")              -> loads js/i18n/es.js (once) and re-labels the page
 *   <b data-i18n="key">         -> textContent is translated
 *   <p data-i18n-html="key">    -> innerHTML is translated (strings may hold <b>, <em>, <kbd>)
 *   <input data-i18n-ph="key">  -> placeholder is translated
 *
 * Machine stories in js/data.js are English for now. Translated content can be
 * added later without touching game code.
 */
window.I18N = (function () {
  // Most spoken languages in the world (total speakers), one written standard each.
  const LANGS = [
    { code: "en", name: "English" },
    { code: "zh", name: "中文" },
    { code: "hi", name: "हिन्दी" },
    { code: "es", name: "Español" },
    { code: "ar", name: "العربية", rtl: true },
    { code: "fr", name: "Français" },
    { code: "bn", name: "বাংলা" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "ur", name: "اردو", rtl: true },
    { code: "id", name: "Bahasa Indonesia" },
    { code: "de", name: "Deutsch" },
    { code: "ja", name: "日本語" },
    { code: "sw", name: "Kiswahili" },
    { code: "mr", name: "मराठी" },
    { code: "te", name: "తెలుగు" },
    { code: "tr", name: "Türkçe" },
    { code: "ta", name: "தமிழ்" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "ko", name: "한국어" },
  ];
  const VER = 38;
  const dict = {};
  const listeners = [];
  let lang = "en";

  function add(code, strings) { dict[code] = Object.assign(dict[code] || {}, strings); }
  function has(key) { return !!((dict[lang] && key in dict[lang]) || (dict.en && key in dict.en)); }
  function t(key, vars) {
    let s = dict[lang] && dict[lang][key] != null ? dict[lang][key] : dict.en && dict.en[key] != null ? dict.en[key] : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }
  function load(code) {
    return new Promise((res) => {
      if (dict[code]) return res();
      const s = document.createElement("script");
      s.src = `js/i18n/${code}.js?v=${VER}`;
      s.onload = res;
      s.onerror = res;
      document.head.appendChild(s);
    });
  }
  async function set(code) {
    if (!LANGS.some((l) => l.code === code)) code = "en";
    await load(code);
    lang = dict[code] ? code : "en";
    const info = LANGS.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = info.rtl ? "rtl" : "ltr";
    apply();
    listeners.forEach((f) => f(lang));
  }
  function apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    root.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    root.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    root.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
    // one-line explanations: shown as a tooltip on hover/focus, and read by screen readers
    root.querySelectorAll("[data-i18n-tip]").forEach((el) => {
      el.dataset.tip = t(el.dataset.i18nTip);
      el.setAttribute("aria-description", el.dataset.tip);
    });
  }
  return {
    LANGS, add, t, has, set, apply, load,
    onChange: (f) => listeners.push(f),
    get lang() { return lang; },
    get rtl() { return !!(LANGS.find((l) => l.code === lang) || {}).rtl; },
  };
})();
window.t = window.I18N.t;
