// /assets/js/nav.js
// Bottom-Navigation mit i18n, Login-Redirect (Messenger), Admin-Rolle, robustem Re-Render

(function () {
  var items = [
    { id: 'home',      key: 'nav.home',      href: '/home/' },
    { id: 'project',   key: 'nav.project',   href: '/project/' },
    { id: 'network',   key: 'nav.network',   href: '/network/' },
    { id: 'calendar',  key: 'nav.calendar',  href: '/calendar/' },
    // Messenger immer zeigen, aber ggf. zum Login umleiten:
    { id: 'messenger', key: 'nav.messenger', href: '/messenger/', requireAuth: true },
    // Admin nur anzeigen, wenn role === 'admin':
    { id: 'admin',     key: 'nav.admin',     href: '/administration/', requireRole: 'admin' },
    { id: 'donate',    key: 'nav.donate',    href: '/donate/' }
  ];

  // Schnell verfügbarer Auth-Status: via <body data-auth="in|out"> (von auth.js gesetzt)
  function bodyAuth() {
    try { return (document.body.dataset.auth === 'in'); } catch (_) { return false; }
  }

  // Fallback: Supabase-Session prüfen (optional, wenn eingebunden)
  async function supabaseAuth() {
    try {
      if (!window.supabase || !supabase.auth) return null; // unbekannt
      var res = await supabase.auth.getSession();
      return !!(res && res.data && res.data.session);
    } catch (_) { return null; }
  }

  // Rolle holen (nur wenn eingeloggt + Supabase verfügbar)
  async function getRole() {
    try {
      if (!window.supabase) return 'public';
      var s = await supabase.auth.getSession();
      var session = s && s.data && s.data.session;
      if (!session) return 'public';
      var q = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
      return (q && q.data && q.data.role) ? q.data.role : 'user';
    } catch (_) {
      return 'public';
    }
  }

  async function isAuthed() {
    // 1) sofortiges Flag
    var b = bodyAuth();
    if (b === true) return true;
    if (b === false && document.body.dataset.auth) return false; // explizit "out"
    // 2) Fallback zu Supabase (kann null liefern, wenn nicht da)
    var s = await supabaseAuth();
    return !!s;
  }

  async function renderBottomNav() {
    var old = document.querySelector('.bottom-nav');
    if (old) old.remove();

    var nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    var path = (location.pathname.replace(/\/+$/, '') || '/');
    var authed = await isAuthed();
    var role = authed ? (await getRole()) : 'public';

    // Sichtbarkeit filtern:
    var list = items.filter(function (it) {
      if (it.requireRole === 'admin') return (role === 'admin'); // nur Admins
      return true; // alle anderen immer zeigen (Messenger inkl.)
    });

    // HTML aufbauen (ohne Backticks)
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var baseHref = (it.href.replace(/\/+$/, '') || '/');
      var isActive = (baseHref === '/' && path === '/') || (baseHref !== '/' && path.indexOf(baseHref) === 0);

      // Label aus i18n, sonst letzter Key-Teil
      var label = (window.i18n && typeof i18n.t === 'function')
        ? i18n.t(it.key)
        : it.key.split('.').pop();

      // Login-Redirect nur, wenn Auth nötig und (noch) nicht eingeloggt
      var href = (it.requireAuth && !authed)
        ? '/auth/login.html?next=' + encodeURIComponent(it.href)
        : it.href;

      // Optionales Lock-Flag für Styling
      var lockedClass = (it.requireAuth && !authed) ? ' locked' : '';
      var activeClass = isActive ? ' active' : '';

      html += ''
        + '<a class="nav-item' + lockedClass + activeClass + '" href="' + href + '" aria-label="' + label + '">'
        +   '<img class="nav-icon" src="/assets/icons/' + it.id + '.svg" alt="' + label + '">'
        +   '<span class="nav-label">' + label + '</span>'
        + '</a>';
    }

    nav.innerHTML = html;
    document.body.appendChild(nav);
  }

  // Re-render bei Sprachwechsel
  if (window.i18n && typeof i18n.onChange === 'function') {
    i18n.onChange(renderBottomNav);
  }

  // Re-render bei Auth-Wechsel (von auth.js gesetzt)
  window.addEventListener('storage', function (e) {
    if (e && e.key === 'vereint.auth.changed') renderBottomNav();
  });

  // Initial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBottomNav);
  } else {
    renderBottomNav();
  }
})();
