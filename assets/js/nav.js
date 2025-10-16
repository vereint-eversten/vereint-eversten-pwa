// /assets/js/nav.js
// Globale Bottom-Navigation mit i18n + Login-/Rollenprüfung (Supabase-kompatibel)

(function () {
  const items = [
    { id: 'home',      key: 'nav.home',      href: '/',               role: 'public' },
    { id: 'project',   key: 'nav.project',   href: '/project/',       role: 'public' },
    { id: 'network',   key: 'nav.network',   href: '/network/',       role: 'public' },
    { id: 'calendar',  key: 'nav.calendar',  href: '/calendar/',      role: 'public' },
    { id: 'messenger', key: 'nav.messenger', href: '/messenger/',     role: 'user'   },
    { id: 'admin',     key: 'nav.admin',     href: '/administration/',role: 'admin'  },
    { id: 'donate',    key: 'nav.donate',    href: '/donate/',        role: 'public' }
  ];

  async function getUserRole() {
    try {
      if (!window.supabase) return 'public';
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 'public';
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      return data?.role || 'user';
    } catch (err) {
      console.warn('Rollenprüfung fehlgeschlagen:', err);
      return 'public';
    }
  }

  async function renderBottomNav() {
    document.querySelector('.bottom-nav')?.remove();

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    const path = location.pathname.replace(/\/+$/, '') || '/';
    const role = await getUserRole();

    const visibleItems = items.filter(it => {
      if (it.role === 'public') return true;
      if (it.role === 'user' && (role === 'user' || role === 'admin')) return true;
      if (it.role === 'admin' && role === 'admin') return true;
      return false;
    });

    nav.innerHTML = visibleItems.map(it => {
      const href = it.href.replace(/\/+$/, '') || '/';
      const isActive =
        (href === '/' && path === '/') ||
        (href !== '/' && path.startsWith(href));
      const label = (window.i18n ? i18n.t(it.key) : it.key.split('.').pop());
      return `
        <a class="nav-item ${isActive ? 'active' : ''}" href="${it.href}" aria-label="${label}">
          <img class="nav-icon" src="/assets/icons/${it.id}.svg" alt="${label}">
          <span class="nav-label">${label}</span>
        </a>
      `;
    }).join('');

    document.body.appendChild(nav);
  }

  if (window.i18n && typeof i18n.onChange === 'function') {
    i18n.onChange(renderBottomNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBottomNav);
  } else {
    renderBottomNav();
  }
})();
