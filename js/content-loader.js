
async function loadContent(pageKey){
  try{
    const res = await fetch(`/content/${pageKey}.json?v=`+Date.now());
    if(!res.ok){return;}
    const data = await res.json();
    const h1 = document.querySelector('[data-hero-title]');
    const h1sub = document.querySelector('[data-hero-sub]');
    if(h1 && data.title) h1.textContent = data.title;
    if(h1sub && data.subtitle) h1sub.textContent = data.subtitle;
    const main = document.querySelector('main[data-dynamic]');
    if(main && Array.isArray(data.blocks)){
      main.innerHTML = '';
      data.blocks.forEach(b=>{
        const el = document.createElement('section');
        el.className = 'card';
        el.innerHTML = `<h3>${b.heading??''}</h3><p>${(b.text??'').replace(/\n/g,'<br>')}</p>`;
        main.appendChild(el);
      });
    }
  }catch(e){
    console.warn('Content load error', e);
  }
}
