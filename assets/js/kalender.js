// /assets/js/kalender.js (ASCII-safe, ohne Backticks)
// - Absolute Pfade
// - Klasse "open" wie im HTML/CSS
// - i18n für Monate/Wochentage/Filterlabels (Fallback DE)
// - Popup zeigt Start/Ende/Ort/Alter/Kapazität
// - CTA NUR wenn Typ camp/3x3 UND signup_url vorhanden
(function () {
  if (window.calendarLoaded) return;
  window.calendarLoaded = true;

  var currentDate = new Date();

  // i18n-Helfer (mit Fallbacks)
  function tt(key, def) {
    try { return (window.i18n && typeof i18n.t === "function") ? i18n.t(key, def || "") : (def || ""); }
    catch (e) { return def || ""; }
  }

  function getMonthNames() {
    var m = (window.i18n && i18n.t("calendar.monthNames")) || null;
    if (m && typeof m === "object" && m.length === 12) return m;
    return ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  }
  function getWeekdays() {
    var w = (window.i18n && i18n.t("calendar.weekdays")) || null;
    if (w && typeof w === "object" && w.length === 7) return w;
    return ["Mo","Di","Mi","Do","Fr","Sa","So"];
  }

  // DOM
  var $grid, $monthTitle, $dialog, $evTitle, $evDate, $evDesc, $evSignup;
  var $gradeFilter, $typeFilter, $ageFilter;
  var lastEventsCache = [];

  // Init
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
      console.warn("Kalendercontainer nicht gefunden.");
      return;
    }

    var prev = document.getElementById("prevBtn");
    var next = document.getElementById("nextBtn");
    if (prev) prev.onclick = function () { currentDate.setMonth(currentDate.getMonth() - 1); render(currentDate); };
    if (next) next.onclick = function () { currentDate.setMonth(currentDate.getMonth() + 1); render(currentDate); };

    var onFilterChange = function () { render(currentDate); };
    if ($gradeFilter) $gradeFilter.addEventListener("change", onFilterChange);
    if ($typeFilter)  $typeFilter.addEventListener("change", onFilterChange);
    if ($ageFilter)   $ageFilter.addEventListener("change", onFilterChange);

    render(currentDate);
  }

  // Utils
  function pad2(n) { return String(n).padStart(2, "0"); }

  function parseDate(s) {
    if (!s) return null;
    var dt = new Date(s);
    return isNaN(dt) ? null : dt;
  }

  function dayKeyLocal(d) { return d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate()); }

  function extractDayFromISO(iso) {
    var dt = parseDate(iso);
    return dt ? dayKeyLocal(dt) : "";
  }

  function formatDateTime(iso) {
    var d = parseDate(iso);
    if (!d) return "–";
    try {
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      }).format(d);
    } catch (_e) {
      var y = d.getFullYear();
      var m = pad2(d.getMonth()+1);
      var dd = pad2(d.getDate());
      var hh = pad2(d.getHours());
      var mm = pad2(d.getMinutes());
      return dd + "." + m + "." + y + " " + hh + ":" + mm + " Uhr";
    }
  }

  // "5", "5.", "5. Klasse", "class_5" -> "5"
  function normGrade(v) {
    var s = (v == null ? "" : String(v)).trim().toLowerCase();
    var m = s.match(/^class_(\d{1,2})$/);
    if (m) return m[1];
    s = s.replace(/\s*klasse$/, "").replace(/\.$/, "");
    var n = s.match(/^\d{1,2}$/);
    return n ? n[0] : "";
  }

  function eventGrades(ev) {
    if (ev && Array.isArray(ev.teams) && ev.teams.length) {
      var out = [];
      for (var i = 0; i < ev.teams.length; i++) {
        var g = normGrade(ev.teams[i]);
        if (g) out.push(g);
      }
      return out;
    }
    var g2 = normGrade(ev && ev.grade);
    return g2 ? [g2] : [];
  }

  function normType(v) { return (v == null ? "" : String(v)).trim().toLowerCase(); }

  function labelType(v) {
    var t = normType(v);
    if (t === "3x3")        return "3x3";
    if (t === "tournament" || t === "turnier") return tt("calendar.types.tournament", "Turnier");
    if (t === "camp")       return tt("calendar.types.camp", "Camp");
    if (t === "spiel")      return tt("calendar.types.match", "Spiel");
    if (t === "sonstiges")  return tt("calendar.types.other", "Sonstiges");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  function parseAgeRange(ev) {
    if (ev && (Number.isFinite(ev.age_min) || Number.isFinite(ev.age_max))) {
      return {min: (ev.age_min != null ? ev.age_min : 0), max: (ev.age_max != null ? ev.age_max : 99)};
    }
    if (ev && Number.isFinite(ev.age)) return {min: ev.age, max: ev.age};
    var s = (ev && ev.age != null ? String(ev.age) : "").trim();
    var m = s.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
    if (m) return {min: Number(m[1]), max: Number(m[2])};
    var n = Number(s);
    if (!Number.isNaN(n)) return {min: n, max: n};
    return null;
  }

  function ageMatches(ev, selectedAge) {
    if (!selectedAge) return true;
    var want = Number(selectedAge);
    if (Number.isNaN(want)) return true;
    var r = parseAgeRange(ev);
    if (!r) return true;
    return want >= (r.min != null ? r.min : 0) && want <= (r.max != null ? r.max : 99);
  }

  function iterateDaysInclusive(dStart, dEnd) {
    var arr = [];
    var d = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate());
    var last = new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate());
    while (d <= last) {
      arr.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return arr;
  }

  function getEventSpanDays(ev) {
    var s = parseDate(ev && (ev.start || ev.date));
    var e = parseDate(ev && (ev.end || ev.start || ev.date));
    if (!s || !e) return [];
    var days = [];
    var iter = iterateDaysInclusive(s, e);
    for (var i = 0; i < iter.length; i++) days.push(dayKeyLocal(iter[i]));
    return days;
  }

  async function render(date) {
    if (!date) date = new Date();

    var months = getMonthNames();
    var year  = date.getFullYear();
    var month = date.getMonth();

    if ($monthTitle) $monthTitle.textContent = months[month] + " " + year;

    var firstDay    = new Date(year, month, 1);
    var startDay    = (firstDay.getDay() + 6) % 7; // Mo=0
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    // Events laden – absoluter Pfad
    var events = [];
    try {
      var res = await fetch("/assets/data/events.json", { cache: "no-store" });
      if (res.ok) {
        var data = await res.json();
        events = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
      } else {
        console.warn("events.json nicht gefunden (Status:", res.status, ")");
      }
    } catch (e) {
      console.warn("Konnte events.json nicht laden:", e);
    }

    // Filteroptionen refreshen wenn Daten sich ändern
    var stringify = JSON.stringify;
    if (stringify(lastEventsCache) !== stringify(events)) {
      lastEventsCache = events.slice();

      // Klassen
      var allGrades = [];
      for (var eg = 0; eg < events.length; eg++) {
        var gArr = eventGrades(events[eg]);
        for (var ga = 0; ga < gArr.length; ga++) allGrades.push(gArr[ga]);
      }
      var uniqueGrades = Array.from(new Set(allGrades)).filter(Boolean).sort(function(a,b){ return Number(a)-Number(b); });

      // Typen
      var typeSet = new Set();
      for (var et = 0; et < events.length; et++) {
        var t = normType(events[et].event_type || events[et].type);
        if (t) typeSet.add(t);
      }
      var uniqueTypes = Array.from(typeSet).sort();

      // Alter
      var ageSet = new Set();
      for (var ea = 0; ea < events.length; ea++) {
        var r = parseAgeRange(events[ea]);
        if (!r) continue;
        var lo = Math.max(1, Number(r.min != null ? r.min : 0));
        var hi = Math.max(lo, Number(r.max != null ? r.max : lo));
        for (var x = lo; x <= hi; x++) ageSet.add(String(x));
      }
      var uniqueAges = Array.from(ageSet).sort(function(a,b){ return Number(a)-Number(b); });

      var suffixGrade = tt("calendar.gradeSuffix", "Klasse");
      var yearsLabel  = tt("calendar.yearsSuffix", "Jahre");

      function fillSelect($sel, values, allLabel, mode) {
        if (!$sel) return;
        var prev = $sel.value;
        $sel.innerHTML = "";

        var optAll = document.createElement("option");
        optAll.value = "";
        optAll.textContent = allLabel;
        $sel.appendChild(optAll);

        for (var i = 0; i < values.length; i++) {
          var v = values[i];
          var opt = document.createElement("option");
          opt.value = v;
          if (mode === "grade") opt.textContent = v + ". " + suffixGrade;
          else if (mode === "age") opt.textContent = v + " " + yearsLabel;
          else if (mode === "type") opt.textContent = labelType(v);
          else opt.textContent = String(v);
          $sel.appendChild(opt);
        }

        if (prev !== "" && Array.prototype.some.call($sel.options, function(o){ return o.value === prev; })) {
          $sel.value = prev;
        } else {
          $sel.value = "";
        }
      }

      fillSelect($gradeFilter, uniqueGrades, tt("calendar.filters.allGrades", "Alle Klassen"), "grade");
      fillSelect($typeFilter,  uniqueTypes,  tt("calendar.filters.allTypes",  "Alle Arten"),   "type");
      fillSelect($ageFilter,   uniqueAges,   tt("calendar.filters.allAges",   "Alle Altersgruppen"), "age");
    }

    var selectedGrade = normGrade($gradeFilter && $gradeFilter.value || "");
    var selectedType  = normType($typeFilter  && $typeFilter.value  || "");
    var selectedAge   = ($ageFilter && $ageFilter.value) || "";

    // Map: Tag -> Events
    var dayMap = new Map();
    for (var iEv = 0; iEv < events.length; iEv++) {
      var ev = events[iEv];
      var span = getEventSpanDays(ev);
      for (var s = 0; s < span.length; s++) {
        var key = span[s];
        if (!dayMap.has(key)) dayMap.set(key, []);
        dayMap.get(key).push(ev);
      }
    }

    // Kopfzeile Wochentage
    var wd = getWeekdays();
    var html = "";
    for (var w = 0; w < wd.length; w++) {
      html += '<div class="cell" style="min-height:auto;background:transparent;border:0;"><strong>' + wd[w] + '</strong></div>';
    }

    for (var i = 0; i < startDay; i++) html += '<div class="cell empty"></div>';

    for (var d = 1; d <= daysInMonth; d++) {
      var thisDate = year + "-" + pad2(month + 1) + "-" + pad2(d);

      var list = dayMap.get(thisDate) || [];
      var dayEvents = [];
      for (var j = 0; j < list.length; j++) {
        var ev2 = list[j];

        var grades = eventGrades(ev2);
        var gradeOk = !selectedGrade || grades.indexOf(selectedGrade) !== -1;

        var evType = normType(ev2.event_type || ev2.type);
        var typeOk = !selectedType || evType === selectedType;

        var ageOk = ageMatches(ev2, selectedAge);

        if (gradeOk && typeOk && ageOk) dayEvents.push(ev2);
      }

      var eventsHTML = "";
      for (var k = 0; k < dayEvents.length; k++) {
        var evi = dayEvents[k];
        var spanDays = getEventSpanDays(evi);
        var tagInfo = "";
        var idx = spanDays.indexOf(thisDate);
        if (spanDays.length > 1 && idx !== -1) {
          tagInfo = ' <span class="muted">(Tag ' + (idx + 1) + '/' + spanDays.length + ')</span>';
        }

        var startISO = evi && (evi.start || evi.date) ? String(evi.start || evi.date) : "";
        var endISO   = evi && (evi.end   || evi.start || evi.date) ? String(evi.end || evi.start || evi.date) : "";
        var typeLower= normType(evi && (evi.event_type || evi.type));
        var signup   = evi && evi.signup_url ? String(evi.signup_url) : "";
        // CTA nur, wenn camp/3x3 UND signup_url vorhanden
        var signupForPopup = (typeLower === "camp" || typeLower === "3x3") && signup ? signup : "";

        var ageMin   = (evi && evi.age_min != null) ? String(evi.age_min) : "";
        var ageMax   = (evi && evi.age_max != null) ? String(evi.age_max) : "";
        var ageSingle= (evi && evi.age != null)     ? String(evi.age)     : "";
        var capacity = (evi && evi.capacity != null)? String(evi.capacity): "";

        eventsHTML += ''
          + '<div class="event"'
          + ' data-title="' + escapeHtml(evi.title || "") + '"'
          + ' data-type="' + escapeHtml(typeLower) + '"'
          + ' data-start="' + escapeHtml(startISO) + '"'
          + ' data-end="' + escapeHtml(endISO) + '"'
          + ' data-location="' + escapeHtml(evi.location || "") + '"'
          + ' data-address="' + escapeHtml(evi.address || "") + '"'
          + ' data-age-min="' + escapeHtml(ageMin) + '"'
          + ' data-age-max="' + escapeHtml(ageMax) + '"'
          + ' data-age="' + escapeHtml(ageSingle) + '"'
          + ' data-capacity="' + escapeHtml(capacity) + '"'
          + ' data-signup="' + escapeHtml(signupForPopup) + '"'
          + ' data-description="' + escapeHtml(evi.description || "") + '">'
          + escapeHtml(evi.title || "Event")
          + tagInfo
          + '</div>';
      }

      html += ''
        + '<div class="cell">'
        +   '<div class="date">' + d + '.</div>'
        +    eventsHTML
        + '</div>';
    }

    $grid.innerHTML = html;

    // Klick-Handler
    var evEls = $grid.querySelectorAll(".event");
    for (var h = 0; h < evEls.length; h++) {
      evEls[h].addEventListener("click", function () {
        showEventPopup({
          title: this.dataset.title,
          type: this.dataset.type,
          start: this.dataset.start,
          end: this.dataset.end,
          location: this.dataset.location,
          address: this.dataset.address,
          ageMin: this.dataset.ageMin,
          ageMax: this.dataset.ageMax,
          age: this.dataset.age,
          capacity: this.dataset.capacity,
          description: this.dataset.description,
          signup: this.dataset.signup
        });
      });
    }
  }

  function showEventPopup(obj) {
    if (!$dialog) return;

    // Neue Felder (falls im HTML vorhanden)
    var $start = document.getElementById("eventStart");
    var $end   = document.getElementById("eventEnd");
    var $loc   = document.getElementById("eventLocation");
    var $age   = document.getElementById("eventAge");
    var $cap   = document.getElementById("eventCapacity");

    // Titel, Beschreibung
    $evTitle && ($evTitle.textContent = obj.title || "Termin");
    $evDesc  && ($evDesc.textContent  = obj.description || "");

    // Start/Ende
    var startTxt = formatDateTime(obj.start || "");
    var endTxt   = formatDateTime(obj.end   || obj.start || "");
    if ($start && $end) {
      $start.textContent = startTxt;
      $end.textContent   = endTxt;
      // Falls dein altes Feld eventDate noch drin ist, füllen wir es zusätzlich
      if ($evDate) $evDate.textContent = startTxt;
    } else if ($evDate) {
      // Fallback: nur ein Feld vorhanden
      $evDate.textContent = startTxt;
    }

    // Ort
    var locParts = [];
    if (obj.location) locParts.push(obj.location);
    if (obj.address)  locParts.push(obj.address);
    if ($loc) $loc.textContent = locParts.join(", ") || "–";

    // Alter
    if ($age) {
      var ageText = "–";
      var hasMin = obj.ageMin !== "" && obj.ageMin != null;
      var hasMax = obj.ageMax !== "" && obj.ageMax != null;
      if (hasMin || hasMax) {
        var lo = hasMin ? Number(obj.ageMin) : 0;
        var hi = hasMax ? Number(obj.ageMax) : lo;
        ageText = (lo && hi && lo !== hi) ? (lo + "–" + hi + " Jahre")
                 : (hi ? (hi + " Jahre") : "–");
      } else if (obj.age !== "" && obj.age != null) {
        ageText = Number(obj.age) + " Jahre";
      }
      $age.textContent = ageText;
    }

    // Kapazität
    if ($cap) {
      var capText = "unbegrenzt";
      if (obj.capacity !== "" && obj.capacity != null) {
        var n = Number(obj.capacity);
        if (Number.isFinite(n)) capText = "max. " + n;
      }
      $cap.textContent = capText;
    }

    // CTA-Regel: nur bei (camp|3x3) UND vorhandener signup_url
    if ($evSignup) {
      var t = (obj.type || "").toLowerCase();
      var showCta = (t === "camp" || t === "3x3") && !!obj.signup;
      if (showCta) {
        $evSignup.setAttribute("href", obj.signup);
        $evSignup.style.display = "inline-block";
      } else {
        $evSignup.removeAttribute("href");
        $evSignup.style.display = "none";
      }
    }

    $dialog.classList.add("active");
  }

  window.closeCalendarDialog = function () {
    if ($dialog) $dialog.classList.remove("active");
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>\"']/g, function (m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
    });
  }
})();
