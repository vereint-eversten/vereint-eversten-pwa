// --------------------------------------------
// App.js – Dynamische Modulnavigation für PWA
// --------------------------------------------

// Lädt ein Modul (HTML-Datei) dynamisch in den Hauptbereich
async function loadModule(path) {
  const main =
    document.getElementById('main-content') ||
    document.getElementById('contentBody');
  if (!main) {
    console.error('Kein Element mit id="main-content" oder "contentBody" gefunden!');
    return;
  }

  main.innerHTML = '<p>Lädt...</p>';

  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Modul nicht gefunden: ${path}`);
    const html = await response.text();

    // HTML einsetzen
    main.innerHTML = html;

    // 👉 WICHTIG: Skripte im eingefügten HTML werden von innerHTML NICHT ausgeführt.
    // Daher extrahieren und neu anhängen (inline & externe Skripte).
    const scripts = main.querySelectorAll('script');
    scripts.forEach((old) => {
      const s = document.createElement('script');

      // Attribute übernehmen (z. B. type="module", defer, src)
      for (const attr of old.attributes) s.setAttribute(attr.name, attr.value);

      if (old.src) {
        // Externes Skript neu laden (relative Pfade bleiben relativ zur Seite)
        s.src = old.getAttribute('src');
      } else {
        // Inline-Skript ausführen
        s.textContent = old.textContent;
      }

      // Anhängen löst die Ausführung aus
      document.body.appendChild(s);

      // Aufräumen (optional):
      old.remove();
      // s.remove(); // falls du keine Script-Tags im DOM behalten möchtest
    });
  } catch (err) {
    console.error('Fehler beim Laden des Moduls:', err);
    main.innerHTML = `
      <div class="panel" style="color:red;">
        <h3>❌ Modul konnte nicht geladen werden</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// --------------------------------------------
// Hauptnavigation
// --------------------------------------------
(() => {
  const NAV = [
    {
      label: 'Konzept',
      action: () => loadModule('modules/konzept.html'),
    },
    {
      label: 'News',
      action: () => loadModule('modules/news.html'),
    },
    {
      label: 'Netzwerk',
      items: [
        { label: 'TuS Eversten', action: () => loadModule('modules/eversten.html') },
        { label: 'Partnervereine', action: () => loadModule('modules/vereine.html') },
        { label: 'Partnerschulen', action: () => loadModule('modules/schulen.html') },
        { label: 'Förderer / Paten', action: () => loadModule('modules/paten.html') },
      ],
    },
    {
      label: 'Termine',
      action: () => loadModule('modules/kalender.html'),
    },
    {
      label: 'Messenger',
      action: () => loadModule('modules/messenger.html'),
    },
    {
      label: 'SchulVereinsliga',
      items: [
        { label: 'U9 Mixed', action: () => loadModule('modules/U9.html') },
        { label: 'U11 Mixed', action: () => loadModule('modules/U11m.html') },
        { label: 'U11 Mädchen', action: () => loadModule('modules/U11w.html') },
        { label: 'U13 Mixed', action: () => loadModule('modules/U13m.html') },
        { label: 'U13 Mädchen', action: () => loadModule('modules/U13w.html') },
      ],
    },
    {
      label: '3x3-Serie',
      action: () => loadModule('modules/3x3.html'),
    },
    {
      label: 'Camps',
      items: [
        { label: '5-Tages-Camp', action: () => loadModule('modules/camp-5tage.html') },
        { label: '3-Tages-Camp', action: () => loadModule('modules/camp-3tage.html') },
        { label: '2-Tages-Camp', action: () => loadModule('modules/camp-2tage.html') },
        { label: 'Wochenendcamp', action: () => loadModule('modules/camp-wochenende.html') },
        { label: 'Übernachtungscamp', action: () => loadModule('modules/camp-uebernachtung.html') },
        { label: 'Schnuppercamp', action: () => loadModule('modules/camp-schnupper.html') },
      ],
    },
    {
      label: 'Shop',
      action: () => loadModule('modules/shop.html'),
    },
    {
      label: 'Kontakt',
      action: () => loadModule('modules/kontakt.html'),
      ],
    },
  ];

  const navEl = document.getElementById('nav');
  const contentTitle = document.getElementById('contentTitle');
  const contentBody = document.getElementById('contentBody');

  if (!navEl) {
    console.error('⚠ Kein Navigationselement mit id="nav" gefunden!');
    return;
  }

  NAV.forEach((group) => {
    const item = document.createElement('div');
    item.className = 'nav-item';

    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.type = 'button';
    btn.textContent = group.label;
    btn.setAttribute('aria-expanded', 'false');

    if (group.action) {
      btn.addEventListener('click', () => {
        closeAllDropdowns();
        group.action();
      });
    } else {
      btn.innerHTML = `${group.label} <span class="chev">▾</span>`;
      btn.addEventListener('click', () => {
        [...navEl.children].forEach((c) => {
          if (c !== item) c.classList.remove('open');
          c.querySelector('.nav-btn')?.setAttribute('aria-expanded', 'false');
        });
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });

      const dd = document.createElement('div');
      dd.className = 'dropdown';
      group.items.forEach((link) => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = link.label;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          closeAllDropdowns();
          link.action();
        });
        dd.appendChild(a);
      });
      item.appendChild(dd);
    }

    item.appendChild(btn);
    navEl.appendChild(item);
  });

  function closeAllDropdowns() {
    [...navEl.children].forEach((c) => {
      c.classList.remove('open');
      c.querySelector('.nav-btn')?.setAttribute('aria-expanded', 'false');
    });
  }

  if (contentTitle) contentTitle.textContent = 'Willkommen';
  if (contentBody)
    contentBody.innerHTML = `
      <div class="panel">
        <p>Wähle oben ein Modul, um zu starten.</p>
      </div>`;
})();
