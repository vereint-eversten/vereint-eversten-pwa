/* i18n.js — minimal, robust, scalable
 * erwartet: /assets/js/languages.js (liefert window.AppLangs)
 * Sprachdateien: /assets/i18n/<code>.json
 */
(() => {
  if (!window.AppLangs) {
    console.error("i18n.js: languages.js fehlt. Bitte vor i18n.js einbinden.");
    return;
  }

  // --------- State ----------
  const storeKey = "app.lang";
  const qsLang   = new URLSearchParams(location.search).get("lang");
  const saved    = localStorage.getItem(storeKey);
  const browser  = navigator.language || "de";
  let lang       = AppLangs.normalize(qsLang || saved || browser);
  let dict       = {};
  const listeners = [];

  // --------- Public API ----------
  function t(key, def = "") {
    if (!key) return def || "";
    const val = key.split(".").reduce((o, k) => (o && o[k] != null) ? o[k] : undefined, dict);
    return (val == null) ? (def || key) : val;
  }

  function setLang(newLang) {
    const normalized = AppLangs.normalize(newLang);
    if (normalized === lang) return;
    lang = normalized;
    load(lang).catch(err => console.error("i18n: load failed", err));
  }

  function onChange(cb) { if (typeof cb === "function") listeners.push(cb); }

  // Ersetzt Texte im DOM
  function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key, el.textContent);
    });

    // data-i18n-attr="placeholder:forms.email|title:nav.home"
    root.querySelectorAll("[data-i18n-attr]").forEach(el => {
      const pairs = el.getAttribute("data-i18n-attr").split("|");
      pairs.forEach(p => {
        const [attr, key] = p.split(":");
        if (!attr || !key) return;
        const current = el.getAttribute(attr.trim()) || "";
        el.setAttribute(attr.trim(), t(key.trim(), current));
      });
    });

    // <title data-i18n="...">
    const titleEl = document.querySelector("head > title[data-i18n]");
    if (titleEl) titleEl.textContent = t(titleEl.getAttribute("data-i18n"), titleEl.textContent);
  }

  // --------- Loader ----------
  async function load(langCode) {
    document.documentElement.lang = langCode;
    document.documentElement.dir  = AppLangs.RTL.has(langCode) ? "rtl" : "ltr";
    localStorage.setItem(storeKey, langCode);

    const url = /assets/i18n/${langCode}.json?v=${encodeURIComponent(__buildVersion())};
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      // Fallback auf Deutsch, damit die App nicht „leer“ bleibt
      console.warn(i18n: ${url} (${res.status}) – fallback to de);
      const fallback = await fetch(/assets/i18n/de.json?v=${encodeURIComponent(__buildVersion())}, { cache: "no-store" });
      if (!fallback.ok) throw new Error(missing i18n file: ${url} and de.json);
      dict = await fallback.json();
    } else {
      dict = await res.json();
    }

    applyTranslations(document);
    listeners.forEach(fn => { try { fn(langCode); } catch (e) { console.warn(e); } });
  }

  // kleine Hilfsfunktion: Build/Cache-Bust aus meta[name=app-build] oder Datum
  function __buildVersion() {
    const m = document.querySelector('meta[name="app-build"]');
    return m?.getAttribute("content") || (new Date()).toISOString().slice(0,10);
  }

  // --------- Init ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => load(lang).catch(console.error));
  } else {
    load(lang).catch(console.error);
  }

  // Global export
  window.i18n = {
    get lang(){ return lang; },
    t, setLang, onChange, applyTranslations,
    SUPPORTED: AppLangs.SUPPORTED
  };
})();
