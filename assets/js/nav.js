// Globale Bottom-Navigation (6 Buttons) mit i18n-Support
// Pfade sind ABSOLUT ab Domain-Root. Icons müssen unter /assets/icons/ liegen.
(function () {
  const items = [
    { id: 'home',      key: 'nav.home',      href: '/' },
    { id: 'project',   key: 'nav.project',   href: '/project/' },
    { id: 'network',   key: 'nav.network',   href: '/network/' },
    { id: 'calendar',  key: 'nav.calendar',  href: '/calendar/' },
    { id: 'messenger', key: 'nav.messenger', href: '/messenger/' },
    { id: 'donate',    key: 'nav.donate',    href: '/donate/' }
  ];

  function renderBottomNav() {
    // Alte Nav löschen, falls Sprache geändert wurde
    document.querySelector('.bottom-nav')?.remove();

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    const path = (location.pathname.replace(/\/+$/, '') || '/');

    nav.innerHTML = items.map(it => {
      const href = (it.href.replace(/\/+$/, '') || '/');
      const isActive =
        (href === '/' && path === '/') ||
        (href !== '/' && path.startsWith(href));

      // Text aus i18n (wenn vorhanden)
      const label = (window.i18n ? i18n.t(it.key) : it.key.split('.').pop());

      return `
        <a class="nav-item ${isActive ? 'active' : ''}" href="${it.href}" aria-label="${label}">
          <img class="nav-icon" src="/assets/icons/${it.id}.svg" alt="${label} Icon">
          <span class="nav-label">${label}</span>
        </a>
      `;
    }).join('');

    document.body.appendChild(nav);
  }

  // beim Sprachwechsel neu rendern
  if (window.i18n && typeof i18n.onChange === 'function') {
    i18n.onChange(renderBottomNav);
  }

  // initial rendern
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBottomNav);
  } else {
    renderBottomNav();
  }
})();
