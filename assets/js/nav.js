// Globale Bottom-Navigation (6 Buttons) mit Auto-Active-Status
// Pfade sind ABSOLUT ab Domain-Root. Icons müssen unter /assets/icons/ liegen.
(function () {
  const items = [
    { id: 'home',      label: 'Home',      href: '/' },
    { id: 'project',   label: 'Projekt',   href: '/project/' },
    { id: 'network',   label: 'Netzwerk',  href: '/network/' },
    { id: 'calendar',  label: 'Kalender',  href: '/calendar/' },
    { id: 'messenger', label: 'Messenger', href: '/messenger/' },
    { id: 'donate',      label: 'Spenden',      href: '/donate/' }
  ];

  function renderBottomNav() {
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    // aktueller Pfad ohne trailing slash (außer Root)
    const path = (location.pathname.replace(/\/+$/, '') || '/');

    nav.innerHTML = items.map(it => {
      const href = (it.href.replace(/\/+$/, '') || '/');
      const isActive =
        (href === '/' && path === '/') ||
        (href !== '/' && path.startsWith(href));

      return `
        <a class="nav-item ${isActive ? 'active' : ''}" href="${it.href}" aria-label="${it.label}">
          <img class="nav-icon" src="/assets/icons/${it.id}.svg" alt="${it.label} Icon">
          <span class="nav-label">${it.label}</span>
        </a>
      `;
    }).join('');

    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBottomNav);
  } else {
    renderBottomNav();
  }
})();
