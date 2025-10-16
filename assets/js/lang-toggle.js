// /assets/js/lang-toggle.js
// Sprachumschalter (Floating-Button + Auswahl-Sheet) für i18n.js + languages.js
(function () {
  if (!window.i18n || !window.AppLangs) {
    console.warn("lang-toggle: i18n.js oder languages.js fehlt.");
    return;
  }

  const IDS = {
    fab: "langToggleFab",
    sheet: "langToggleSheet",
    list: "langToggleList",
    search: "langToggleSearch"
  };

  function buildUI() {
    // Bereits vorhandene Instanzen entfernen (z.B. nach Hot-Reload / Sprachwechsel)
    document.getElementById(IDS.fab)?.remove();
    document.getElementById(IDS.sheet)?.remove();

    // Floating Action Button
    const fab = document.createElement("button");
    fab.id = IDS.fab;
    fab.type = "button";
    fab.className = "lang-fab";
    fab.setAttribute("aria-label", "Sprache wechseln");
    fab.innerHTML = `
      <span class="lang-fab-icon" aria-hidden="true">🌐</span>
      <span class="lang-fab-label">${i18n.lang.toUpperCase()}</span>
    `;

    // Auswahl-Sheet
    const sheet = document.createElement("div");
    sheet.id = IDS.sheet;
    sheet.className = "lang-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML = `
      <div class="lang-sheet-card">
        <div class="lang-sheet-header">
          <strong id="langTitle">Language / Sprache</strong>
          <button class="lang-close" aria-label="Schließen">×</button>
        </div>
        <div class="lang-sheet-controls">
          <input id="${IDS.search}" class="lang-search" type="search" placeholder="Search / Suche…" autocomplete="off">
        </div>
        <div id="${IDS.list}" class="lang-sheet-body" role="listbox" aria-labelledby="langTitle"></div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(sheet);

    // Liste rendern
    renderList();

    // Events
    fab.addEventListener("click", () => sheet.classList.add("open"));

    sheet.addEventListener("click", (e) => {
      if (e.target === sheet || e.target.classList.contains("lang-close")) {
        sheet.classList.remove("open");
      }
      const btn = e.target.closest("[data-lang]");
      if (btn) {
        const lang = btn.getAttribute("data-lang");
        if (lang && lang !== i18n.lang) {
          i18n.setLang(lang);
        }
        sheet.classList.remove("open");
      }
    });

    // Suche
    const input = sheet.querySelector("#" + IDS.search);
    if (input) {
      const debounced = debounce(() => renderList(input.value.trim()), 120);
      input.addEventListener("input", debounced);
    }

    // Bei Sprachwechsel Label aktualisieren + Liste neu markieren
    i18n.onChange((newLang) => {
      const label = fab.querySelector(".lang-fab-label");
      if (label) label.textContent = (newLang || "").toUpperCase();
      renderList(input?.value?.trim() || "");
    });
  }

  function renderList(filter = "") {
    const list = document.getElementById(IDS.list);
    if (!list) return;

    const q = (filter || "").toLowerCase();
    const items = AppLangs.LANGS.filter(l => {
      if (!q) return true;
      return (
        l.code.toLowerCase().includes(q) ||
        (l.native || "").toLowerCase().includes(q) ||
        (l.english || "").toLowerCase().includes(q)
      );
    });

    const rows = items.map(l => {
      const active = (l.code === i18n.lang);
      return `
        <button
          type="button"
          role="option"
          aria-selected="${active ? "true" : "false"}"
          class="lang-option ${active ? "active" : ""}"
          data-lang="${l.code}">
          <span class="lang-left">
            <span class="lang-native">${escapeHtml(l.native || l.code)}</span>
            <span class="lang-english">${escapeHtml(l.english || "")}</span>
          </span>
          <span class="lang-right">
            <span class="lang-code">${l.code.toUpperCase()}</span>
            ${active ? '<span class="lang-check" aria-hidden="true">✓</span>' : ""}
          </span>
        </button>
      `;
    }).join("");

    list.innerHTML = rows || <div class="muted" style="padding:8px 6px;">Keine Treffer</div>;
  }

  // Hilfsfunktionen
  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
