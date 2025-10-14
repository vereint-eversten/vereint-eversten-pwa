(() => {
  // Build desktop nav
  const NAV = [
    { label:'Idee & Konzept', items:[
      { label:'Konzept', action:()=>setStatic('Idee & Konzept – Ziele','Kurzbeschreibung eurer Leitidee…') },
      { label:'Bausteine', action:()=>setStatic('Idee & Konzept – Bausteine','Module, PWA, Teilhabe…') },
      { label:'Öffentlichkeitsarbeit', action:()=>setStatic('Idee & Konzept – Datenschutz','Eure Datenschutz-Prinzipien…') }
    ]},
    { label:'Netzwerk (Schule & Verein)', items:[
      { label:'Partnerschulen', action:()=>setStatic('Netzwerk – Partnerschulen','Liste & Logos…') },
      { label:'Vereine', action:()=>setStatic('Netzwerk – Vereine','Kooperationspartner…') }
    ]},
    { label:'Paten', items:[
      { label:'Modul-Paten', action:()=>setStatic('Paten – Unterstützer','Patenliste…') },
      { label:'Team-Paten', action:()=>setStatic('Paten – Mitmachen','So wirst du Pate…') }
    ]},
    { label:'Termine', items:[
      { label:'Kalender', action:()=>renderCalendar() },
      { label:'Hinweise', action:()=>setStatic('Termine – Hinweise','z. B. Treffzeiten, Hallenregeln…') }
    ]},
    { label:'SchulVereinsliga', items:[
      { label:'Letzter Spieltag', action:()=>setStatic('SchulVereinsliga – Überblick','Modus, Spieltage…') },
      { label:'Nächster Spieltag', action:()=>setStatic('SchulVereinsliga – Überblick','Modus, Spieltage…') },
      { label:'Tabellenstand', action:()=>setStatic('SchulVereinsliga – Überblick','Modus, Spieltage…') },
      { label:'Regeln', action:()=>setStatic('SchulVereinsliga – Tabellen','…') }
    ]},
    { label:'3x3-Serie', items:[
      { label:'Events', action:()=>setStatic('3x3-Serie – Events','Turniere & Termine…') },
      { label:'Regeln', action:()=>setStatic('3x3-Serie – Regeln','FIBA 3x3 Basics…') }
    ]},
    { label:'Camps', items:[
      { label:'5-Tages-Camp', action:()=>setStatic('Camps – Sommercamp','Infos, Packing-List…') },
      { label:'3-Tages-Camp', action:()=>setStatic('Camps – Sommercamp','Infos, Packing-List…') },
      { label:'2-Tages-Camp', action:()=>setStatic('Camps – Sommercamp','Infos, Packing-List…') },
      { label:'Wochenendcamp', action:()=>setStatic('Camps – Sommercamp','Infos, Packing-List…') },
      { label:'Übernachtungscamp', action:()=>setStatic('Camps – Sommercamp','Infos, Packing-List…') },
      { label:'Schnuppercamp', action:()=>setStatic('Camps – Herbstcamp','…') }
    ]},
    { label:'Kontakt', items:[
      { label:'Ansprechpersonen', action:()=>setStatic('Kontakt – Team','Namen, Mail…') }
    ]},
  ];

  // Desktop nav build
  const navEl = document.getElementById('nav');
  NAV.forEach(group => {
    const item = document.createElement('div');
    item.className = 'nav-item';
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.type = 'button';
    btn.innerHTML = `${group.label} <span class="chev">▾</span>`;
    btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', () => {
      // close others
      [...navEl.children].forEach(c => { if(c!==item) c.classList.remove('open'); c.querySelector('.nav-btn')?.setAttribute('aria-expanded','false'); });
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); btn.click(); } });
    const dd = document.createElement('div');
    dd.className = 'dropdown';
    group.items.forEach(link => {
      const a = document.createElement('a'); a.href = '#'; a.textContent = link.label;
      a.addEventListener('click', (e)=>{ e.preventDefault(); closeAllDropdowns(); link.action(); });
      dd.appendChild(a);
    });
    item.appendChild(btn); item.appendChild(dd);
    navEl.appendChild(item);
  });
  function closeAllDropdowns(){ [...navEl.children].forEach(c => { c.classList.remove('open'); c.querySelector('.nav-btn')?.setAttribute('aria-expanded','false'); }); }

  // Content helpers
  const contentTitle = document.getElementById('contentTitle');
  const contentBody  = document.getElementById('contentBody');
  function setStatic(title, html){
    contentTitle.textContent = title;
    contentBody.innerHTML = `<div class="panel">${html}</div>`;
  }
  window.setStatic = setStatic; // for dropdown actions

  // Calendar (read-only, loads /data/events.json)
  async function renderCalendar(){
    contentTitle.textContent = 'Termine – Kalender';
    contentBody.innerHTML = `
      <section class="calendar">
        <div class="top">
          <button id="prevBtn" aria-label="Vorheriger Monat">‹</button>
          <h2 id="monthTitle" style="margin:0;font-size:18px;"></h2>
          <button id="nextBtn" aria-label="Nächster Monat">›</button>
          <div style="margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <select id="teamFilter" aria-label="Teamfilter"><option value="">Alle Teams</option></select>
            <select id="typeFilter" aria-label="Typfilter">
              <option value="">Alle Arten</option>
              <option value="training">Turnier</option>
              <option value="turnier">Camp</option>
              <option value="camp">3x3</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>
        <div class="grid" id="calendarGrid" aria-live="polite"></div>
      </section>
    `;
    initCalendar();
  }
  window.renderCalendar = renderCalendar; // used by nav action

  function initCalendar(){
    const DE='de-DE';
    const state={ current:new Date(), events:[], teamsIndex:new Set() };
    const grid=document.getElementById('calendarGrid');
    const title=document.getElementById('monthTitle');
    const teamFilter=document.getElementById('teamFilter');
    const typeFilter=document.getElementById('typeFilter');

    document.getElementById('prevBtn').onclick=()=>{ shiftMonth(-1); };
    document.getElementById('nextBtn').onclick=()=>{ shiftMonth(1); };
    teamFilter.onchange=renderGrid;
    typeFilter.onchange=renderGrid;

    const vDialog=document.getElementById('viewerDialog');
    const vTitle=document.getElementById('vTitle');
    const vTime=document.getElementById('vTime');
    const vLocation=document.getElementById('vLocation');
    const vDesc=document.getElementById('vDesc');
    const vTeams=document.getElementById('vTeams');
    document.getElementById('vClose').onclick=()=> vDialog.style.display='none';

    loadEvents();

    async function loadEvents(){
      try{
        const res=await fetch('data/events.json',{cache:'no-store'});
        const json=await res.json();
        state.events=(json.events||[]).map(e=>({...e, start:new Date(e.start), end:new Date(e.end), teams:Array.isArray(e.teams)?e.teams:[]}))
                                     .sort((a,b)=>a.start-b.start);
        state.teamsIndex=new Set();
        state.events.forEach(e=>e.teams.forEach(t=>state.teamsIndex.add(t)));
        fillTeamFilter(); renderGrid();
      }catch(err){ console.error('Events laden fehlgeschlagen:',err); contentBody.innerHTML='<div class="panel">Kalender konnte nicht geladen werden.</div>'; }
    }

    function fillTeamFilter(){
      teamFilter.innerHTML='<option value="">Alle Teams</option>'+Array.from(state.teamsIndex).sort().map(t=>`<option>${t}</option>`).join('');
    }
    function shiftMonth(n){ state.current.setMonth(state.current.getMonth()+n); renderGrid(); }
    function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
    function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59); }

    function renderGrid(){
      grid.innerHTML='';
      const y=state.current.getFullYear(), m=state.current.getMonth();
      title.textContent=state.current.toLocaleString(DE,{month:'long',year:'numeric'});
      const first=new Date(y,m,1);
      const startW=(first.getDay()+6)%7; // Mo=0
      const days=new Date(y,m+1,0).getDate();

      ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(wd=>{
        const h=document.createElement('div'); h.className='cell';
        h.style.background='transparent'; h.style.border='0'; h.style.minHeight='auto';
        h.innerHTML=`<strong>${wd}</strong>`; grid.appendChild(h);
      });
      for(let i=0;i<startW;i++){ const c=document.createElement('div'); c.className='cell'; c.style.visibility='hidden'; grid.appendChild(c); }

      const tf=teamFilter.value, ty=typeFilter.value, from=startOfMonth(state.current), to=endOfMonth(state.current);

      for(let d=1; d<=days; d++){
        const c=document.createElement('div'); c.className='cell';
        c.innerHTML=`<div class="date">${String(d).padStart(2,'0')}.${m+1}.</div>`;
        // --- Mehrtages-Event-Logik ---
const cellStart = new Date(y, m, d, 0, 0, 0, 0);
const cellEnd   = new Date(y, m, d, 23, 59, 59, 999);

const todays = state.events.filter(e =>
  // Event überlappt diesen Kalendertag?
  e.start <= cellEnd && e.end >= cellStart &&
  // und liegt im sichtbaren Monatszeitraum
  e.end   >= from && e.start <= to &&
  (!tf || e.teams.includes(tf)) && (!ty || e.event_type === ty)
);
        todays.forEach(e=>{
          const el=document.createElement('div'); el.className='event';
          const time=e.start.toLocaleTimeString(DE,{hour:'2-digit',minute:'2-digit'});
          el.textContent=`${time} ${labelForType(e.event_type)} — ${e.title}`;
          el.onclick=()=>openViewer(e);
          c.appendChild(el);
        });
        grid.appendChild(c);
      }
    }
    function labelForType(t){ return ({training:'Training',turnier:'Turnier',heimspiel:'Heim',auswaertsspiel:'Auswärts',camp:'Camp',sonstiges:'—'})[t]||t; }
    function openViewer(e){
      vTitle.textContent=e.title;
      const s=e.start.toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});
      const en=e.end.toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});
      vTime.textContent=`${s} – ${en}`;
      vLocation.textContent=[e.location,e.address].filter(Boolean).join(' · ');
      vDesc.textContent=e.description||'';
      vTeams.textContent=e.teams?.length?`Teams: ${e.teams.join(', ')}`:'';
      vDialog.style.display='flex';
    }
  }

  // default landing
  setStatic('Willkommen', 'Wähle oben ein Modul. „Termine → Kalender“ zeigt den Kalender.');
})();
