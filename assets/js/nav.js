// nav.js – kombiniert: Top-Bar + Bottom-Nav + i18n + PWA + Auth (Supabase)
(function () {
  // ===== CONFIG =====
  const LOGIN_URL = "/auth/login.html";
  const HOME_PATH = "/";
  const BOTTOM_ITEMS = [
    { id: "home",      key: "nav.home",      href: "/" },
    { id: "project",   key: "nav.project",   href: "/project/" },
    { id: "calendar",  key: "nav.calendar",  href: "/calendar/" },
    { id: "messenger", key: "nav.messenger", href: "/messenger/", gated: true }
  ];

  // ===== HELPERS =====
  const norm = (p) => (p || "/").replace(/\/+$/, "") || "/";
  const path = norm(location.pathname);

  function t(key, fallback) {
    try {
      return (window.i18n && typeof i18n.t === "function") ? i18n.t(key, fallback || "") : (fallback || key);
    } catch { return fallback || key; }
  }

  async function isAuthenticated() {
    try {
      if (!window.supabase || !supabase?.auth) return false;
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch { return false; }
  }

  // ===== TOP BAR =====
  async function renderTopBar() {
    document.querySelector(".topbar")?.remove();
    const bar = document.createElement("header");
    bar.className = "topbar";

    const left = document.createElement("div");
    left.className = "left";
    const showDonate = (path === HOME_PATH);
    if (showDonate) {
      left.innerHTML = `
        <a class="icon-btn" href="/donate/" aria-label="${t("nav.donateContact","Donate / Contact")}">
          <span aria-hidden="true">🎁</span><span>${t("nav.donateContact","Donate / Contact")}</span>
        </a>
      `;
    }

    const center = document.createElement("div");
    center.className = "title";
    center.setAttribute("data-i18n","home.appName");
    center.textContent = t("home.appName","Verein[t]");

    const right = document.createElement("div");
    right.className = "right";
    right.innerHTML = `
      <a class="icon-btn" href="/settings/" aria-label="${t("nav.settings","Einstellungen")}">
        <span aria-hidden="true">⚙</span><span>${t("nav.settings","Einstellungen")}</span>
      </a>
    `;

    bar.appendChild(left);
    bar.appendChild(center);
    bar.appendChild(right);
    document.body.prepend(bar);
  }

  // ===== BOTTOM NAV =====
  async function renderBottomNav() {
    document.querySelector(".bottom-nav")?.remove();
    const authed = await isAuthenticated();
    const nav = document.createElement("nav");
    nav.className = "bottom-nav";

    nav.innerHTML = BOTTOM_ITEMS.map(item => {
      const href = norm(item.href);
      const isActive = (href === "/" && path === "/") || (href !== "/" && path.startsWith(href));
      const locked = item.gated && !authed;
      const label = t(item.key, item.id);
      const aria = locked ? ${label} – ${t("common.locked","gesperrt")} : label;
      const icon = iconFor(item.id, locked);
      return `
        <a class="nav-item ${isActive ? "active" : ""} ${locked ? "locked" : ""}"
           href="${item.href}" data-id="${item.id}" aria-label="${aria}">
          ${icon}
          <span class="nav-label" data-i18n="${item.key}">${label}</span>
        </a>`;
    }).join("");

    // Auth-Gate
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a.nav-item");
      if (!a) return;
      const id = a.getAttribute("data-id");
      const def = BOTTOM_ITEMS.find(x => x.id === id);
      if (def?.gated && a.classList.contains("locked")) {
        e.preventDefault();
        location.href = LOGIN_URL;
      }
    });

    document.body.appendChild(nav);
  }

  // ===== ICONS =====
  function iconFor(id, locked) {
    const badge = locked ? <circle cx="19" cy="6.5" r="4.5" fill="currentColor" opacity=".25"/> : "";
    switch (id) {
      case "home":
        return <svg class="nav-icon" viewBox="0 0 24 24"><path d="M4 10.5l8-6 8 6V19a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2z" fill="currentColor"/>${badge}</svg>;
      case "project":
        return <svg class="nav-icon" viewBox="0 0 24 24"><path d="M4 4h16v4H4zM4 10h16v10H4z" fill="currentColor"/>${badge}</svg>;
      case "calendar":
        return <svg class="nav-icon" viewBox="0 0 24 24"><path d="M7 2v3M17 2v3M3 9h18M5 12h4M11 12h4M17 12h2M5 16h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>${badge}</svg>;
      case "messenger":
        return <svg class="nav-icon" viewBox="0 0 24 24"><path d="M4 19l2-5 6-3 6 3-2 5-4 2zM6 6h12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>${badge}</svg>;
      default:
        return <svg class="nav-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>;
    }
  }

  // ===== PWA INIT =====
  function initPWA() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
  }

  // ===== INIT =====
  async function init() {
    await renderTopBar();
    await renderBottomNav();
    initPWA();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ===== i18n Hot-Reload =====
  if (window.i18n && typeof i18n.onChange === "function") {
    i18n.onChange(() => { renderTopBar(); renderBottomNav(); });
  }
})();
