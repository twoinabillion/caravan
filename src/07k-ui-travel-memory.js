/* The existing notice owns entry. Multiple unread memories share one quiet
   invitation and a native list; the ordinary reader still owns each payment. */
(()=>{
  const host=document.getElementById('travel-memory-notice');
  if(!host)return;
  const cue=host.querySelector('[data-memory-cue]');
  const title=host.querySelector('[data-memory-title]');
  const open=host.querySelector('[data-memory-open]');
  const later=host.querySelector('[data-memory-later]');
  const dialog=document.getElementById('travel-memory-dialog');
  const list=dialog?.querySelector('[data-memory-list]');
  const count=dialog?.querySelector('[data-memory-list-count]');
  const app=document.getElementById('app');
  let currentId=null,handoff=false;
  const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  const available=()=>S&&!S.ended&&!document.hidden&&!UI.modalOpen()
    &&!S.pendingPresentation&&!G.openingPending()&&!S.driving?.approach&&!S._crisis&&!S.combat
    &&document.documentElement.dataset.routeMap!=='open';
  const dismiss=(forHandoff=false)=>{
    if(!dialog?.open)return;
    handoff=forHandoff;dialog.close();
  };
  const sync=()=>{
    // A base screen or a mandatory present event takes precedence over a list.
    if(dialog?.open&&(S?.ended||S?.pendingPresentation||S?._crisis||S?.combat
      ||app&&app.dataset.screen!=='game'))dismiss(true);
    const rows=G.pendingTravelMemories();
    const canShow=rows.length&&available();
    if(!canShow){
      const wasVisible=!host.hidden;
      host.hidden=true;currentId=null;
      // Do not expand the same invitation again after an interruption/return.
      if(wasVisible&&rows.length&&S&&!S.ended&&!S.travelMemoryInbox?.quiet)G.deferTravelMemoryNotice();
      return;
    }
    host.hidden=false;
    const first=rows[0],quiet=S.travelMemoryInbox?.quiet===true,multiple=rows.length>1;
    currentId=first.id;host.dataset.quiet=String(quiet);host.dataset.count=String(rows.length);
    text(cue,multiple?'원할 때 한 편씩 펼쳐볼 수 있어요.':first.travelMemory.cue);
    text(title,quiet||multiple?`떠오른 기억 ${rows.length}`:first.travelMemory.title);
    text(open,quiet?'펼쳐 보기':multiple?'목록 보기':'기억 들여다보기');
    open.setAttribute('aria-label',multiple?`떠오른 기억 ${rows.length}편 목록 보기`:`${first.travelMemory.title} · ${open.textContent}`);
    later.hidden=quiet;
  };
  const showList=()=>{
    if(!dialog||!list||!available())return false;
    const rows=G.pendingTravelMemories();
    if(!rows.length)return false;
    G.deferTravelMemoryNotice();
    list.replaceChildren();
    text(count,`${rows.length}편 · 떠오른 순서대로`);
    for(const event of rows){
      const button=document.createElement('button');button.type='button';button.dataset.memoryId=event.id;
      const name=document.createElement('strong');name.textContent=event.travelMemory.title;
      const source=document.createElement('span');source.textContent=event.storyOrigin?.timeLabel||event.storyOrigin?.title||'내 기억';
      button.append(name,source);
      button.addEventListener('click',()=>{
        // Closing this native dialog releases its pause before the real reader
        // validates and takes ownership; stale choices never replace a scene.
        dismiss(true);G.openTravelMemory(event.id);sync();
      });
      list.append(button);
    }
    handoff=false;dialog.showModal();dialog.setAttribute('aria-hidden','false');
    open.setAttribute('aria-expanded','true');list.scrollTop=0;
    dialog.querySelector('[data-memory-list-close]').focus({preventScroll:true});
    sync();return true;
  };
  open.addEventListener('click',()=>{
    const rows=G.pendingTravelMemories(),id=currentId;
    if(rows.length>1&&dialog)showList();else if(id)G.openTravelMemory(id);
    sync();
  });
  later.addEventListener('click',()=>{G.deferTravelMemoryNotice();open.focus({preventScroll:true});});
  if(dialog){
    dialog.querySelectorAll('[data-memory-list-close]').forEach(button=>button.addEventListener('click',()=>dismiss()));
    dialog.addEventListener('close',()=>{
      dialog.setAttribute('aria-hidden','true');open.setAttribute('aria-expanded','false');
      sync();
      if(!handoff&&(!app||app.dataset.screen==='game')&&!UI.modalOpen()&&!host.hidden&&open.isConnected)open.focus({preventScroll:true});
    });
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const bounds=dialog.getBoundingClientRect();
      if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dismiss();
    });
  }
  UI.syncTravelMemoryNotice=sync;UI.openTravelMemoryList=showList;
  window.addEventListener('caravanscreenchange',sync);
  document.addEventListener('visibilitychange',sync);
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-route-map','data-road-approach']});
  for(const id of ['ev-wrap','arrival-scene','ovl-stl','ovl-map','ovl-journal','ovl-status','ovl-menu','ovl-seoul','ovl-camp','ovl-local-actions','trip-destination-dialog','journey-detail-dialog','save-transfer-dialog','travel-memory-dialog']){
    const node=document.getElementById(id);
    if(node)observer.observe(node,{attributes:true,attributeFilter:['class','open']});
  }
  sync();
})();
