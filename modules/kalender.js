// /modules/kalender.js
(function () {
  // Init-Funktion dem Hook zuweisen (wird von app.js nach Laden aufgerufen)
  window.__initModule = function initCalendarModule() {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("monthTitle");
    const prev  = document.getElementById("prevBtn");
    const next  = document.getElementById("nextBtn");
    const dialog = document.getElementById("eventDialog");
    const evTitle = document.getElementById("eventTitle");
    const evDate  = document.getElementById("eventDate");
    const evDesc  = document.getElementById("eventDescription");

    if (!grid || !title || !prev || !next) {
      console.error("Kalender-Elemente fehlen.");
      return;
    }

    const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    let cur = new Date();

    function render() {
      const y = cur.getFullYear();
      const m = cur.getMonth();

      title.textContent = ${MONTHS[m]} ${y};

      const first = new Date(y, m, 1);
      const offset = (first.getDay() + 6) % 7;   // Montag=0
      const days = new Date(y, m + 1, 0).getDate();

      let html = "";

      // Kopfzeile (optional auskommentieren)
      const WDS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
      for (const wd of WDS) {
        html += <div class="cell" style="min-height:auto;background:transparent;border:0;"><strong>${wd}</strong></div>;
      }

      // Leere Zellen vor dem 1.
      for (let i = 0; i < offset; i++) html += <div class="cell empty"></div>;

      // Tage
      for (let d = 1; d <= days; d++) {
        html += `
          <div class="cell" data-day="${d}">
            <div class="date">${d}.</div>
          </div>`;
      }

      grid.innerHTML = html;
    }

    // Klick -> Popup-Demo
    grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".cell");
      if (!cell || cell.classList.contains("empty")) return;
      const d = cell.dataset.day;
      evTitle.textContent = Beispieltermin am ${d}.;
      evDate.textContent  = ${d}. ${title.textContent};
      evDesc.textContent  = "Dies ist eine Vorschau auf einen Beispieltermin.";
      dialog.classList.add("open");
    });

    prev.addEventListener("click", () => { cur.setMonth(cur.getMonth() - 1); render(); });
    next.addEventListener("click", () => { cur.setMonth(cur.getMonth() + 1); render(); });

    render();
  };
})();
