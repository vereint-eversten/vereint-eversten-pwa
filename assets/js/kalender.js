// js/kalender.js (final release)
// Features:
// - Robust init (runs even if DOMContentLoaded already fired)
// - Filters: Klassenstufe, Art (case-insensitive, pretty labels), Alter (age_min/age_max preferred)
// - No "0 Jahre" option; age options only from events that specify age
// - Multiday events expand across all days (incl. across months) with "(Tag x/y)"
// - Safe template strings / backticks

(() => {
  if (window._calendarLoaded_) return;
  window._calendarLoaded_ = true;

  let currentDate = new Date();
  const monthNames = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  // DOM-Refs
  let $grid, $monthTitle, $dialog, $evTitle, $evDate, $evDesc, $evSignup;
  let $gradeFilter, $typeFilter, $ageFilter;
  let lastEventsCache = [];

  // ---- Init (robust) ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    $grid       = document.getElementById("calendarGrid");
    $monthTitle = document.getElementById("monthTitle");
    $dialog     = document.getElementById("eventDialog");
    $evTitle    = document.getElementById("eventTitle");
    $evDate     = document.getElementById("eventDate");
    $evDesc     = document.getElementById("eventDescription");
    $evSignup   = document.getElementById("eventSignupLink");

    $gradeFilter = document.getElementById("gradeFilter");
    $typeFilter  = document.getElementById("typeFilter");
    $ageFilter   = document.getElementById("ageFilter");

    if (!$grid) {
      console.warn("⚠ Kalendercontainer nicht gefunden – falsches Timing?");
      return;
    }

    const prev = document.getElementById("prevBtn");
    const next = document.getElementById("nextBtn");
    prev && (prev.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); render(currentDate); });
    next && (next.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); render(currentDate); });

    const onFilterChange = () => render(currentDate);
    $gradeFilter && $gradeFilter.addEventListener("change", onFilterChange);
    $typeFilter  && $typeFilter.addEventListener("change", onFilterChange);
    $ageFilter   && $ageFilter.addEventListener("change", onFilterChange);

    render(currentDate);
  }

  // ---------- Utils ----------
  const pad2 = (n) => String(n).padStart(2, "0");

  const parseDate = (s) => {
    if (!s) return null;
    const dt = new Date(s);
    return isNaN(dt) ? null : dt; // akzeptiert ISO mit/ohne TZ
  };

  const dayKeyLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  const extractDayFromISO = (iso) => {
    const dt = parseDate(iso);
    return dt ? dayKeyLocal(dt) : "";
  };

  const normGrade = (v) =>
    (v ?? "").toString().trim().replace(/\s*klasse$/i, "").replace(/\.$/, "");

  const eventGrades = (ev) => {
    if (Array.isArray(ev?.teams) && ev.teams.length) {
      return ev.teams.map(normGrade).filter(Boolean);
    }
    const g = normGrade(ev?.grade);
    return g ? [g] : [];
  };

  const normType = (v) => (v ?? "").toString().trim().toLowerCase();
  const labelType = (v) => {
    const t = normType(v);
    if (t === "3x3") return "3x3";
    if (t === "turnier") return "Turnier";
    if (t === "camp") return "Camp";
    if (t === "spiel") return "Spiel";
    if (t === "sonstiges") return "Sonstiges";
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  };

  const parseAgeRange = (ev) => {
    if (Number.isFinite(ev?.age_min) || Number.isFinite(ev?.age_max)) {
      return {min: ev.age_min ?? 0, max: ev.age_max ?? 99};
    }
    if (Number.isFinite(ev?.age)) return {min: ev.age, max: ev.age};
    const s = (ev?.age ?? "").toString().trim();
    const m = s.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
    if (m) return {min: Number(m[1]), max: Number(m[2])};
    const n = Number(s);
    if (!Number.isNaN(n)) return {min: n, max: n};
    return null;
  };

  const ageMatches = (ev, selectedAge) => {
    if (!selectedAge) return true;
    const want = Number(selectedAge);
    if (Number.isNaN(want)) return true;
    const r = parseAgeRange(ev);
    if (!r) return true; // kein Altersfeld -> nicht ausschließen
    return want >= (r.min ?? 0) && want <= (r.max ?? 99);
  };

  function* iterateDaysInclusive(dStart, dEnd) {
    const d = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate());
    const last = new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate());
    while (d <= last) {
      yield new Date(d);
      d.setDate(d.getDate() + 1);
    }
  }

  function getEventSpanDays(ev) {
    const s = parseDate(ev.start ?? ev.date);
    const e = parseDate(ev.end ?? ev.start ?? ev.date);
    if (!s || !e) return [];
    const days = [];
    for (const d of iterateDaysInclusive(s, e)) days.push(dayKeyLocal(d));
    return days;
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
      const res = await fetch("../assets/data/events.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        events = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
      } else {
        console.warn("events.json nicht gefunden (Status:", res.status, ")");
      }
    } catch (e) {
      console.warn("⚠ Konnte events.json nicht laden:", e);
    }

    // ---- Filter-Optionen aktualisieren ----
    const stringify = JSON.stringify;
    if (stringify(lastEventsCache) !== stringify(events)) {
      lastEventsCache = events;

      // Klassen
      const allGrades = events.flatMap(eventGrades);
      const uniqueGrades = Array.from(new Set(allGrades)).filter(Boolean).sort((a,b)=>Number(a)-Number(b));

      // Typen (normalisiert)
      const uniqueTypes = Array.from(new Set(
        events.map(ev => normType(ev.event_type ?? ev.type)).filter(Boolean)
      )).sort();

      // Alter (nur aus Events mit Altersinfos; exclude 0)
      const ageSet = new Set();
      events.forEach(ev => {
        const r = parseAgeRange(ev);
        if (!r) return;
        const lo = Math.max(1, Number(r.min ?? 0));
        const hi = Math.max(lo, Number(r.max ?? lo));
        for (let x = lo; x <= hi; x++) ageSet.add(String(x));
      });
      const uniqueAges = Array.from(ageSet).sort((a,b)=>Number(a)-Number(b));

      const fillSelect = ($sel, values, allLabel) => {
        if (!$sel) return;
        const prev = $sel.value; // vorherige Auswahl
        $sel.innerHTML = "";
        const optAll = document.createElement("option");
        optAll.value = "";
        optAll.textContent = allLabel;
        $sel.appendChild(optAll);
        values.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v;
          if ($sel.id === "gradeFilter") opt.textContent = `${v}. Klasse`;
          else if ($sel.id === "ageFilter") opt.textContent = `${v} Jahre`;
          else if ($sel.id === "typeFilter") opt.textContent = labelType(v);
          else opt.textContent = v;
          $sel.appendChild(opt);
        });
        // Nur wiederherstellen, wenn prev nicht leer ist und existiert
        if (prev !== "" && [...$sel.options].some(o => o.value === prev)) {
          $sel.value = prev;
        } else {
          $sel.value = ""; // "Alle …" / "Jedes Alter"
        }
      };

      fillSelect($gradeFilter, uniqueGrades, "Alle Klassen");
      fillSelect($typeFilter, uniqueTypes, "Alle Arten");
      fillSelect($ageFilter, uniqueAges, "Jedes Alter");
    }

    const selectedGrade = $gradeFilter?.value || "";
    const selectedType  = $typeFilter?.value  || "";
    const selectedAge   = $ageFilter?.value   || "";

    // ---- Precompute: Map day -> events (inkl. Multiday) ----
    const dayMap = new Map();
    events.forEach(ev => {
      const span = getEventSpanDays(ev);
      span.forEach(key => {
        if (!dayMap.has(key)) dayMap.set(key, []);
        dayMap.get(key).push(ev);
      });
    });

    // ---- Kalenderzellen ----
    let html = ["Mo","Di","Mi","Do","Fr","Sa","So"].map(wd =>
      `<div class="cell" style="min-height:auto;background:transparent;border:0;"><strong>${wd}</strong></div>`
    ).join("");

    for (let i = 0; i < startDay; i++) html += `<div class="cell empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = `${year}-${pad2(month + 1)}-${pad2(d)}`;

      const dayEvents = (dayMap.get(thisDate) || []).filter(ev => {
        // Klassen
        const grades = eventGrades(ev);
        const gradeOk = !selectedGrade || grades.includes(normGrade(selectedGrade));

        // Typ (case-insensitive)
        const evType = normType(ev.event_type ?? ev.type);
        const typeOk = !selectedType || evType === normType(selectedType);

        // Alter
        const ageOk = ageMatches(ev, selectedAge);

        return gradeOk && typeOk && ageOk;
      });

      const eventsHTML = dayEvents.map(ev => {
        const span = getEventSpanDays(ev);
        let tagInfo = "";
        const idx = span.indexOf(thisDate);
        if (span.length > 1 && idx !== -1) {
          tagInfo = ` <span class="muted">(Tag ${idx+1}/${span.length})</span>`;
        }
        return `
        <div class="event"
             data-title="${escapeHtml(ev.title || '')}"
             data-date="${escapeHtml(extractDayFromISO(ev.start) || '')}"
             data-description="${escapeHtml(ev.description || '')}">
          ${escapeHtml(ev.title || 'Event')}${tagInfo}
        </div>`;
      }).join("");

      html += `
        <div class="cell">
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
    $evSignup?.setAttribute("href", "../camp/anmeldung.html");
    $dialog.classList.add("active");
  }

  window.closeCalendarDialog = function () {
    if ($dialog) $dialog.classList.remove("active");
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>\"']/g, m =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])
    );
  }
})();
