// modules/kalender.js (age_min/max + multi-day support)
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

  function ready(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(init);

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

    if (!$grid) { console.warn("⚠ Kalendercontainer nicht gefunden – falsches Timing?"); return; }

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
  const toISODate = (d) => d.toISOString().slice(0,10); // YYYY-MM-DD (UTC)
  const pad2 = (n) => String(n).padStart(2, "0");

  // parse ISO-like string into local Date object
  const parseDate = (s) => {
    // If no timezone, treat as local
    const dt = new Date(s);
    if (isNaN(dt)) return null;
    return dt;
  };

  const dayKeyLocal = (d) => {
    // yyyy-mm-dd using local time
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  };

  const extractDayFromISO = (iso) => {
    const dt = parseDate(iso);
    return dt ? dayKeyLocal(dt) : "";
  };

  const normGrade = v => (v ?? "").toString().trim().replace(/\s*klasse$/i, "").replace(/\.$/, "");

  const eventGrades = ev => {
    if (Array.isArray(ev?.teams) && ev.teams.length) return ev.teams.map(normGrade).filter(Boolean);
    const g = normGrade(ev?.grade);
    return g ? [g] : [];
  };

  const parseAgeRange = (ev) => {
    // Prefer age_min/age_max, but support age or "7-9"
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
      const res = await fetch("../data/events.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        events = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
      } else {
        console.warn("events.json nicht gefunden (Status:", res.status, ")");
      }
    } catch (e) {
      console.warn("⚠ Konnte events.json nicht laden:", e);
    }

    // Filter-Optionen aktualisieren
    const stringify = JSON.stringify;
    if (stringify(lastEventsCache) !== stringify(events)) {
      lastEventsCache = events;

      const allGrades = events.flatMap(eventGrades);
      const uniqueGrades = Array.from(new Set(allGrades)).filter(Boolean).sort((a,b)=>Number(a)-Number(b));

      const uniqueTypes = Array.from(new Set(
        events.map(ev => (ev.event_type ?? ev.type ?? "").toString().trim()).filter(Boolean)
      )).sort((a,b)=>a.localeCompare(b));

      // Alterswerte aus min..max-Bereichen aggregieren
      const ageSet = new Set();
      events.forEach(ev => {
        const r = parseAgeRange(ev);
        if (r) {
          const lo = Math.max(0, r.min ?? 0), hi = Math.min(99, r.max ?? 99);
          for (let x = lo; x <= hi; x++) ageSet.add(String(x));
        }
      });
      const uniqueAges = Array.from(ageSet).sort((a,b)=>Number(a)-Number(b));

      const fillSelect = ($sel, values, allLabel) => {
        if (!$sel) return;
        const prev = $sel.value;
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
          else opt.textContent = v;
          $sel.appendChild(opt);
        });
        if ([...$sel.options].some(o => o.value === prev)) $sel.value = prev;
      };

      fillSelect($gradeFilter, uniqueGrades, "Alle Klassen");
      fillSelect($typeFilter, uniqueTypes, "Alle Arten");
      fillSelect($ageFilter, uniqueAges, "Alle Altersgruppen");
    }

    const selectedGrade = $gradeFilter?.value || "";
    const selectedType  = $typeFilter?.value  || "";
    const selectedAge   = $ageFilter?.value   || "";

    // Precompute: Map day -> events for faster render (multi-day expand)
    const dayMap = new Map(); // key: yyyy-mm-dd, val: array of events
    events.forEach(ev => {
      const span = getEventSpanDays(ev);
      span.forEach(key => {
        if (!dayMap.has(key)) dayMap.set(key, []);
        dayMap.get(key).push(ev);
      });
    });

    // Kalenderzellen
    let html = ["Mo","Di","Mi","Do","Fr","Sa","So"].map(wd =>
      `<div class="cell" style="min-height:auto;background:transparent;border:0;"><strong>${wd}</strong></div>`
    ).join("");

    for (let i = 0; i < startDay; i++) html += `<div class="cell empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = `${year}-${pad2(month + 1)}-${pad2(d)}`;

      const dayEvents = (dayMap.get(thisDate) || []).filter(ev => {
        // Klassen-Filter
        const grades = eventGrades(ev);
        const gradeOk = !selectedGrade || grades.includes(normGrade(selectedGrade));

        // Typ-Filter (exakt; du kannst hier ein Mapping einfügen, falls nötig)
        const evType = (ev.event_type ?? ev.type ?? "").toString().trim();
        const typeOk = !selectedType || evType === selectedType;

        // Alters-Filter
        const ageOk = ageMatches(ev, selectedAge);

        return gradeOk && typeOk && ageOk;
      });

      const eventsHTML = dayEvents.map(ev => {
        // Zusatz: Tag x/y für mehrtägige Events anzeigen
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
    $evSignup?.setAttribute("href", "../modules/anmeldung.html");
    $dialog.classList.add("open");
  }

  window.closeCalendarDialog = function () {
    if ($dialog) $dialog.classList.remove("open");
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>\"']/g, m =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])
    );
  }
})();
