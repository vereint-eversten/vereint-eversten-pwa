
function renderBottomNav(active) {
  const items = [
    {id:'home', label:'Home', href:'home/'},
    {id:'project', label:'Projekt', href:'project/'},
    {id:'network', label:'Netzwerk', href:'network/'},
    {id:'calendar', label:'Kalender', href:'calendar/'},
    {id:'messenger', label:'Messenger', href:'messenger/'},
    {id:'shop', label:'Shop', href:'shop/'}
  ];
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.innerHTML = items.map(it => `
    <a class="nav-item ${active===it.id?'active':''}" href="${it.href}">
      <img src="assets/icons/${it.id}.svg" alt="${it.label} icon" class="nav-icon"/>
      <span class="nav-label">${it.label}</span>
    </a>`).join('');
  document.body.appendChild(nav);
}
