// -----------------------------------------------------------
// Kalendermodul – Start
// -----------------------------------------------------------

// Warten, bis das DOM vollständig geladen ist
document.addEventListener("DOMContentLoaded", () => {
  initCalendar();
});

let currentDate = new Date();
const monthNames = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember"
];

// -----------------------------------------------------------
// Kalender initialisieren
// -----------------------------------------------------------
function initCalendar() {
  const calendarGrid     = document.getElementById("calendarGrid");
  const monthTitle       = document.getElementById("monthTitle");
  const dialog           = document.getElementById("eventDialog");
  const eventTitle       = document.getElementById("eventTitle");
  const eventDate        = document.getElementById("eventDate");
  const eventDescription = document.getElementById("eventDescription");
  const eventSignupLink  = document.getElementById("eventSignupLink");

  // Falls das HTML noch nicht fertig ist (sollte jetzt nicht mehr vorkommen)
  if (!calendarGrid) {
    console.warn("⚠ Kalendercontainer nicht gefunden – falsches Timing?");
    return;
  }

  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");

  if (prev) prev.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  };
  if (next) next.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  };

  renderCalendar(currentDate);
}
// -----------------------------------------------------------
// Kalendermodul mit Eventdaten aus /data/events.json
// -----------------------------------------------------------

const monthNames = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember"
];

// DOM-Elemente finden (nachdem kalender.html geladen ist)
function initCalendar() {
  window.calendarGrid       = document.getElementById("calendarGrid");
  window.monthTitle         = document.getElementById("monthTitle");
  window.dialog             = document.getElementById("eventDialog");
  window.eventTitle         = document.getElementById("eventTitle");
  window.eventDate          = document.getElementById("eventDate");
  window.eventDescription   = document.getElementById("eventDescription");
  window.eventSignupLink    = document.getElementById("eventSignupLink");

  if (!calendarGrid) {
    console.warn("⚠ Kalendercontainer nicht gefunden – falsches Timing?");
    return;
  }

  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");

  if (prev) prev.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  };
  if (next) next.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  };

  renderCalendar(currentDate);
}

// -----------------------------------------------------------
// Kalender rendern + Events laden
// -----------------------------------------------------------
async function renderCalendar(date = new Date()) {
  const year  = date.getFullYear();
  const month = date.getMonth();

  if (window.monthTitle) {
    window.monthTitle.textContent = `${monthNames[month]} ${year}`;
  }

  const firstDay    = new Date(year, month, 1);
  const startDay    = (firstDay.getDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Events laden
  let events = [];
  try {
    const res = await fetch("../data/events.json", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      // Unterstütze sowohl { events: [...] } als auch direkt ein Array
      const raw = Array.isArray(json) ? json : (json.events || []);
      events = raw.map(ev => ({
        ...ev,
        // Normalisiere Datum als YYYY-MM-DD
        date: ev.date ? ev.date : (ev.start ? ev.start.substring(0, 10) : null)
      })).filter(ev => !!ev.date);
    } else {
      console.warn("events.json nicht gefunden (Status:", res.status, ")");
    }
  } catch (e) {
    console.warn("⚠ Konnte events.json nicht laden:", e);
  }

  // Kalenderzellen erzeugen
  let html = "";

  // Kopfzeile mit Wochentagen
  const WDS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
  for (const wd of WDS) {
    html += `<div class="cell" style="min-height:auto;background:transparent;border:0;"><strong>${wd}</strong></div>`;
  }

  // Leere Felder vor Monatsanfang
  for (let i = 0; i < startDay; i++) html += `<div class="cell empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter(ev => ev.date === thisDate);

    let eventsHTML = "";
    dayEvents.forEach(ev => {
      const safeTitle = ev.title ?? "Termin";
      const safeDesc  = ev.description ?? "";
      // Für das Popup über data-* bereitstellen
      eventsHTML += `
        <div class="event"
             data-title="${safeTitle}"
             data-date="${thisDate}"
             data-description="${safeDesc}">
          ${safeTitle}
        </div>`;
    });

    html += `
      <div class="cell" data-day="${d}">
        <div class="date">${d}.</div>
        ${eventsHTML}
      </div>`;
  }

  calendarGrid.innerHTML = html;

  // Klick-Events für Termine
  calendarGrid.querySelectorAll(".event").forEach(el => {
    el.addEventListener("click", () => {
      showEventPopup(el.dataset);
    });
  });
}

// -----------------------------------------------------------
// Popup anzeigen
// -----------------------------------------------------------
function showEventPopup({ title, date, description }) {
  if (!dialog) return;

  eventTitle.textContent = title || "Termin";
  eventDate.textContent  = date || "";
  eventDescription.textContent = description || "";

  // Optional: Link zur Anmeldung – hier ggf. dynamisch setzen
  if (eventSignupLink) {
    eventSignupLink.href = "../modules/anmeldung.html";
  }

  dialog.classList.add("open");
}

// -----------------------------------------------------------
// Popup schließen
// -----------------------------------------------------------
function closeDialog() {
  if (dialog) dialog.classList.remove("open");
}
window.closeDialog = closeDialog;

