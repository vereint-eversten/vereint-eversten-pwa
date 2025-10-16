/* i18n.js — minimal, robust, scalable
 * erwartet: /assets/js/languages.js (liefert window.AppLangs)
 * Sprachdateien: /assets/i18n/<code>.json
 */
(function () {
  if (!window.AppLangs) {
    console.error("i18n.js: languages.js fehlt. Bitte vor i18n.js einbinden.");
    return;
  }

  // --------- State ----------
  var storeKey = "app.lang";
  var qsLang   = new URLSearchParams(location.search).get("lang");
  var saved    = localStorage.getItem(storeKey);
  var browser  = navigator.language || "de";
  var lang     = AppLangs.normalize(qsLang || saved || browser);
  var dict     = {};
  var listeners = [];

  // --------- Public API ----------
  function t(key, def) {
    if (def === void 0) def = "";
    if (!key) return def || "";
    var parts = key.split(".");
    var val = dict;
    for (var i = 0; i < parts.length; i++) {
      if (val && val[parts[i]] !== undefined && val[parts[i]] !== null) {
        val = val[parts[i]];
      } else {
        val = undefined;
        break;
      }
    }
    return (val == null) ? (def || key) : val;
  }

  function setLang(newLang) {
    var normalized = AppLangs.normalize(newLang);
    if (normalized === lang) return;
    lang = normalized;
    load(lang).catch(function (err) { console.error("i18n: load failed", err); });
  }

  function onChange(cb) { if (typeof cb === "function") listeners.push(cb); }

  // Ersetzt Texte im DOM
  function applyTranslations(root) {
    if (!root) root = document;

    // data-i18n: Inhalt
    var els = root.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var el  = els[i];
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key, el.textContent);
    }

    // data-i18n-attr="placeholder:forms.email|title:nav.home"
    var attrEls = root.querySelectorAll("[data-i18n-attr]");
    for (var j = 0; j < attrEls.length; j++) {
      var el2 = attrEls[j];
      var pairs = el2.getAttribute("data-i18n-attr").split("|");
      for (var k = 0; k < pairs.length; k++) {
        var p = pairs[k];
        var idx = p.indexOf(":");
        if (idx === -1) continue;
        var attr = p.slice(0, idx).trim();
        var key2 = p.slice(idx + 1).trim();
        if (!attr || !key2) continue;
        var current = el2.getAttribute(attr) || "";
        el2.setAttribute(attr, t(key2, current));
      }
    }

    // <title data-i18n="...">
    var titleEl = document.querySelector("head > title[data-i18n]");
    if (titleEl) {
      titleEl.textContent = t(titleEl.getAttribute("data-i18n"), titleEl.textContent);
    }
  }

  // --------- Loader ----------
  async function load(langCode) {
    document.documentElement.lang = langCode;
    document.documentElement.dir  = AppLangs.RTL.has(langCode) ? "rtl" : "ltr";
    localStorage.setItem(storeKey, langCode);

    var url = "/assets/i18n/" + langCode + ".json?v=" + encodeURIComponent(__buildVersion());
    var res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.warn("i18n: " + url + " (" + res.status + ") – fallback to de");
      var fb = await fetch("/assets/i18n/de.json?v=" + encodeURIComponent(__buildVersion()), { cache: "no-store" });
      if (!fb.ok) throw new Error("missing i18n file: " + url + " and de.json");
      dict = await fb.json();
    } else {
      dict = await res.json();
    }

    applyTranslations(document);
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](langCode); } catch (e) { console.warn(e); }
    }
  }

  // Build/Cache-Bust (meta[name=app-build] oder Datum)
  function __buildVersion() {
    var m = document.querySelector('meta[name="app-build"]');
    return (m && m.getAttribute("content")) || (new Date()).toISOString().slice(0,10);
  }

  // --------- Init ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { load(lang).catch(console.error); });
  } else {
    load(lang).catch(console.error);
  }

  // Global export
  window.i18n = {
    get lang(){ return lang; },
    t: t, setLang: setLang, onChange: onChange, applyTranslations: applyTranslations,
    SUPPORTED: AppLangs.SUPPORTED
  };
})();
