
(function(){
  function mount(active){
    var items=[
      {id:'home',label:'Home',href:'#'},
      {id:'project',label:'Projekt',href:'#'},
      {id:'network',label:'Netzwerk',href:'#'},
      {id:'calendar',label:'Kalender',href:'#'},
      {id:'messenger',label:'Messenger',href:'#'},
      {id:'shop',label:'Shop',href:'#'}
    ];
    var nav=document.createElement('nav');
    nav.className='bottom-nav';
    nav.innerHTML=items.map(function(it){
      return '<a class="nav-item '+(active===it.id?'active':'')+'" href="'+it.href+'" data-id="'+it.id+'">'+
              '<img class="nav-icon" alt="'+it.label+' Icon" src="assets/icons/'+it.id+'.svg">'+
              '<span class="nav-label">'+it.label+'</span>'+
             '</a>';
    }).join('');
    document.body.appendChild(nav);
  }
  // auto-mount on DOM ready; default active 'home'
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ mount('home'); });
  } else { mount('home'); }
})();
