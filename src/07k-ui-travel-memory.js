/* Approved story-entry-v1. A nonmodal invitation stays outside the road canvas;
   deliberate opening reuses the ordinary reader and its pause/save lifecycle. */
(()=>{
  const host=document.getElementById('travel-memory-notice');
  if(!host)return;
  const cue=host.querySelector('[data-memory-cue]');
  const title=host.querySelector('[data-memory-title]');
  const open=host.querySelector('[data-memory-open]');
  const later=host.querySelector('[data-memory-later]');
  let currentId=null;
  const sync=()=>{
    const rows=G.pendingTravelMemories();
    const available=rows.length&&S&&!S.ended&&!document.hidden&&!UI.modalOpen()
      &&!S.driving?.approach&&!S._crisis&&!S.combat
      &&document.documentElement.dataset.routeMap!=='open';
    host.hidden=!available;
    if(!available){currentId=null;return;}
    const first=rows[0],quiet=S.travelMemoryInbox?.quiet===true;
    currentId=first.id;host.dataset.quiet=String(quiet);host.dataset.count=String(rows.length);
    cue.textContent=first.travelMemory.cue;
    title.textContent=quiet?`떠오른 기억 ${rows.length}`:first.travelMemory.title;
    open.textContent=quiet?'펼쳐 보기':'기억 들여다보기';
    open.setAttribute('aria-label',`${first.travelMemory.title} · ${open.textContent}`);
    later.hidden=quiet;
  };
  open.addEventListener('click',()=>{const id=currentId;if(id)G.openTravelMemory(id);sync();});
  later.addEventListener('click',()=>{G.deferTravelMemoryNotice();open.focus({preventScroll:true});});
  UI.syncTravelMemoryNotice=sync;
  window.addEventListener('caravanscreenchange',sync);
  document.addEventListener('visibilitychange',sync);
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-route-map','data-road-approach']});
  for(const id of ['ev-wrap','arrival-scene','ovl-stl','ovl-map','ovl-journal','ovl-status','ovl-menu','ovl-seoul','ovl-camp','ovl-local-actions','trip-destination-dialog','journey-detail-dialog','save-transfer-dialog']){
    const node=document.getElementById(id);
    if(node)observer.observe(node,{attributes:true,attributeFilter:['class','open']});
  }
  sync();
})();
