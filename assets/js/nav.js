<script>
// /assets/js/nav.js — 4-Button Bottom-Nav + Top-Bar (Donate/Contact oben links)
// - i18n-Unterstützung (fallback auf Klartextkeys)
// - Messenger: gesperrt wenn nicht eingeloggt (führt zu /auth/login.html)
// - Einstellungen & Admin: nur auf Home ("/") rechts
// - Netzwerk ist nicht in der Bottom-Nav, gehört unter Projekt

(function () {
  // -------- Config --------
  const BOTTOM_ITEMS = [
    { id: 'home',      key: 'nav.home',      href: '/' },
    { id: 'project',   key: 'nav.project',   href: '/project/' },
    { id: 'calendar',  key: 'nav.calendar',  href: '/calendar/' },
    // messenger: sichtbar; wenn public => "locked" + Link zu Login
    { id: 'messenger', key: 'nav.messenger', href: '/messenger/', role: 'user' }
  ];

  // i18n helper
  const tt = (key, def) => {
    try { return (window.i18n && typeof i18n.t === 'function') ? i18n.t(key, def || '') : (def || key); }
    catch (_) { return def || key; }
  };

  // Role detection (optional Supabase)
  async function getAuthInfo() {
    let role = 'public';
    let email = null;
    try {
      if (!window.supabase) return { role, email };
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { role, email };

      email = session.user.email || null;
      role = 'user';
      // optional: admin aus user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('rolle')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!error && data?.rolle === 'admin') role = 'admin';
    } catch (e) {
      console.warn('getAuthInfo failed:', e);
    }
    return { role, email };
  }

  function currentPath() {
    return (location.pathname.replace(/\/+$/, '') || '/');
  }

  function icon(id, label) {
    // SVG/IMG: Wenn du SVGs hast, kannst du hier direkt <svg> inline setzen.
    return '<img class="nav-icon" src="/assets/icons/'+id+'.svg" alt="'+escapeHtml(label)+'">';
  }

  function escapeHtml(s){return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

  async function renderTopBar() {
    document.querySelector('.topbar')?.remove();

    const { role } = await getAuthInfo();
    const path = currentPath();

    const bar = document.createElement('header');
    bar.className = 'topbar';

    // Left: Donate/Contact immer sichtbar
    const left = document.createElement('div');
    left.className = 'left';
    const donateLabel = tt('top.donateContact', 'Spenden/Kontakt');
    const donateBtn = document.createElement('a');
    donateBtn.href = '/donate/';
    donateBtn.className = 'icon-btn';
    donateBtn.setAttribute('aria-label', donateLabel);
    donateBtn.innerHTML = '❤ ' + escapeHtml(donateLabel);
    left.appendChild(donateBtn);

    // Middle title (optional)
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = ''; // leer lassen oder tt('app.title','Verein[t]')

    // Right: nur auf Home ("/") → Settings (+ Admin wenn role=admin)
    const right = document.createElement('div');
    right.className = 'right';
    if (path === '/') {
      const settingsLabel = tt('top.settings', 'Einstellungen');
      const settingsBtn = document.createElement('a');
      settingsBtn.href = '/settings/';
      settingsBtn.className = 'icon-btn';
      settingsBtn.setAttribute('aria-label', settingsLabel);
      settingsBtn.innerHTML = '⚙ ' + escapeHtml(settingsLabel);
      right.appendChild(settingsBtn);

      if (role === 'admin') {
        const adminLabel = tt('top.admin', 'Admin');
        const adminBtn = document.createElement('a');
        adminBtn.href = '/administration/';
        adminBtn.className = 'icon-btn';
        adminBtn.setAttribute('aria-label', adminLabel);
        adminBtn.innerHTML = '🛡 ' + escapeHtml(adminLabel);
        right.appendChild(adminBtn);
      }
    }

    bar.appendChild(left);
    bar.appendChild(title);
    bar.appendChild(right);
    document.body.appendChild(bar);
  }

  async function renderBottomNav() {
    document.querySelector('.bottom-nav')?.remove();

    const { role } = await getAuthInfo();
    const path = currentPath();

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    const html = BOTTOM_ITEMS.map(it => {
      const href = (it.href.replace(/\/+$/, '') || '/');
      const isActive =
        (href === '/' && path === '/') ||
        (href !== '/' && path.startsWith(href));

      let label = tt(it.key, it.key.split('.').pop());
      // role handling: messenger "locked" für public
      let locked = false;
      let finalHref = it.href;

      if (it.role === 'user' && role === 'public') {
        locked = true;
        finalHref = '/auth/login.html';
        label = tt('nav.messengerLocked', 'Messenger (Login)');
      }

      return (
        '<a class="nav-item '+(isActive ? 'active ' : '')+(locked ? 'locked' : '')+'" href="'+finalHref+'" aria-label="'+escapeHtml(label)+'">'
        + icon(it.id, label)
        + '<span class="nav-label">'+escapeHtml(label)+'</span>'
        + '</a>'
      );
    }).join('');

    nav.innerHTML = html;
    document.body.appendChild(nav);
  }

  async function renderAll() {
    await renderTopBar();
    await renderBottomNav();
  }

  // Re-render bei Sprachwechsel
  if (window.i18n && typeof i18n.onChange === 'function') {
    i18n.onChange(renderAll);
  }

  // Re-render bei Auth-Änderung (falls Supabase vorhanden)
  if (window.supabase && supabase.auth?.onAuthStateChange) {
    supabase.auth.onAuthStateChange(() => renderAll());
  }

  // Initial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }
})();
</script>
