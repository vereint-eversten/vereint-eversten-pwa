// modules/kalender.js

(() => {
  // Verhindert doppelte Ausführung, falls das Script versehentlich zweimal geladen wird
  if (window._calendarLoaded_) return;
  window._calendarLoaded_ = true;

  // --- privater Modulzustand (keine Globals) ---
  let currentDate = new Date();
  const monthNames = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  // DOM-Refs
  let $grid, $monthTitle, $dialog, $evTitle, $evDate, $evDesc, $evSignup;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // DOM holen (einmal)
    $grid      = document.getElementById("calendarGrid");
    $monthTitle= document.getElementById("monthTitle");
    $dialog    = document.getElementById("eventDialog");
    $evTitle   = document.getElementById("eventTitle");
    $evDate    = document.getElementById("eventDate");
    $evDesc    = document.getElementById("eventDescription");
    $evSignup  = document.getElementById("eventSignupLink");

    if (!$grid) {
      console.warn("⚠ Kalendercontainer nicht gefunden – falsches Timing?");
      return;
    }

    const prev = document.getElementById("prevBtn");
    const next = document.getElementById("nextBtn");
    prev && (prev.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); render(currentDate); });
    next && (next.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); render(currentDate); });

    render(currentDate);
  }

  async function render(date = new Date()) {
    const year  = date.getFullYear();
    const month = date.getMonth();

    if ($monthTitle) $monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDay    = new Date(year, month, 1);
    const startDay    = (firstDay.getDay() + 6) % 7; // Mo=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Events laden
    let events = [];
    try {
      const res = await fetch("../data/events.json", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const raw = Array.isArray(json) ? json : (json.events || []);
        events = raw.map(ev => ({
          ...ev,
          date: ev.date ? ev.date : (ev.start ? ev.start.substring(0, 10) : null)
        })).filter(ev => !!ev.date);
      } else {
        console.warn("events.json nicht gefunden (Status:", res.status, ")");
      }
    } catch (e) {
      console.warn("⚠ Konnte events.json nicht laden:", e);
    }

    // Kalenderzellen
    const WDS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
    let html = WDS.map(wd => (
      <div class="cell" style="min-height:auto;background:transparent;border:0;"><strong>${wd}</strong></div>
    )).join("");

    for (let i = 0; i < startDay; i++) html += <div class="cell empty"></div>;

    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = ${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")};
      const dayEvents = events.filter(ev => ev.date === thisDate);

      const eventsHTML = dayEvents.map(ev => {
        const safeTitle = ev.title ?? "Termin";
        const safeDesc  = ev.description ?? "";
        return `
          <div class="event"
               data-title="${escapeHtml(safeTitle)}"
               data-date="${thisDate}"
               data-description="${escapeHtml(safeDesc)}">
            ${escapeHtml(safeTitle)}
          </div>`;
      }).join("");

      html += `
        <div class="cell" data-day="${d}">
          <div class="date">${d}.</div>
          ${eventsHTML}
        </div>`;
    }

    $grid.innerHTML = html;

    // Klick-Handler für Events
    $grid.querySelectorAll(".event").forEach(el => {
      el.addEventListener("click", () => {
        showEventPopup({
          title: el.dataset.title,
          date: el.dataset.date,
          description: el.dataset.description
        });
      });
    });
  }

  function showEventPopup({ title, date, description }) {
    if (!$dialog) return;
    $evTitle.textContent = title || "Termin";
    $evDate.textContent  = date  || "";
    $evDesc.textContent  = description || "";
    if ($evSignup) $evSignup.href = "../modules/anmeldung.html";
    $dialog.classList.add("open");
  }

  // Public Close (wenn du es im HTML onclick="closeCalendarDialog()" nutzt)
  window.closeCalendarDialog = function () {
    if ($dialog) $dialog.classList.remove("open");
  };

  // kleine Hilfsfunktion gegen XSS in data-Attributen
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])
    );
  }
})();
