/* ═══ QUEST LEDGER UI — 기존 목표 버튼을 통합 임무 장부로 연결한다 ═══ */
const QuestLedgerUI={
  tab:'main', root:null, rendering:false,
  esc(value){ return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); },
  init(){
    if(this.root||!document.body) return;
    const root=document.createElement('div');
    root.id='quest-ledger-layer';
    root.innerHTML=`
      <button id="quest-ledger-fallback" type="button" aria-label="임무 장부 열기"><span>목표</span><b>메인 스토리</b></button>
      <span id="quest-update-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></span>
      <section id="quest-ledger" role="dialog" aria-modal="true" aria-labelledby="quest-ledger-title" aria-hidden="true">
        <header class="quest-ledger-head">
          <button class="quest-ledger-back" type="button" aria-label="임무 장부 닫기">‹</button>
          <div><h2 id="quest-ledger-title">임무 장부</h2></div>
        </header>
        <nav class="quest-ledger-tabs" aria-label="임무 분류">
          <button type="button" data-quest-tab="main">메인 스토리</button>
          <button type="button" data-quest-tab="side">사이드 미션</button>
          <button type="button" data-quest-tab="completed">완료 기록</button>
        </nav>
        <div class="quest-ledger-summary" aria-live="polite"></div>
        <div class="quest-ledger-list"></div>
      </section>`;
    document.body.appendChild(root); this.root=root;
    root.querySelector('#quest-ledger-fallback').addEventListener('click',()=>this.open());
    root.querySelector('.quest-ledger-back').addEventListener('click',()=>this.close());
    root.querySelector('.quest-ledger-tabs').addEventListener('click',event=>{
      const button=event.target.closest('[data-quest-tab]'); if(!button) return;
      this.tab=button.dataset.questTab; this.render();
    });
    root.querySelector('.quest-ledger-list').addEventListener('click',event=>{
      const actionButton=event.target.closest('[data-quest-action]');
      if(actionButton){
        const action=G.questActionPlan(actionButton.dataset.questAction);
        const result=action&&typeof UI.openQuestAction==='function'?UI.openQuestAction(action):null;
        if(result&&result.ok) this.close(false,action.surface==='crew'?'dk-crew':'dk-road');
        else { if(result&&result.why&&UI.toast) UI.toast(result.why); this.render(); }
        return;
      }
      const button=event.target.closest('[data-quest-track]'); if(!button) return;
      const result=G.toggleQuestTracking(button.dataset.questTrack);
      if(!result.ok&&typeof UI!=='undefined'&&UI.toast) UI.toast(result.why);
      this.render();
    });
    document.addEventListener('click',event=>{
      if(this.root.contains(event.target)) return;
      const button=event.target.closest('button,[role="button"]'); if(!button) return;
      const label=(button.getAttribute('aria-label')||button.textContent||'').replace(/\s/g,'');
      if(label==='목표'||label==='목표보기'){
        event.preventDefault(); event.stopImmediatePropagation(); this.open(button);
      }else if(this.isOpen()&&(button.id.startsWith('dk-')||button.closest('#dock,.dock'))){
        this.close(false);
      }
    },true);
    document.addEventListener('keydown',event=>{ if(event.key==='Escape'&&this.isOpen()) this.close(); });
    window.addEventListener('questledgerchange',()=>{ this.render(); this.showUpdate(); });
    const observer=new MutationObserver(records=>{
      if(records.every(record=>this.root.contains(record.target))) return;
      this.scheduleRender();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
    this.render();
  },
  scheduleRender(){
    if(this.rendering) return; this.rendering=true;
    requestAnimationFrame(()=>{ this.rendering=false; this.render(); });
  },
  isOpen(){ return this.root&&this.root.querySelector('#quest-ledger').getAttribute('aria-hidden')==='false'; },
  setDock(id){
    document.querySelectorAll('#dock button').forEach(button=>{
      const active=button.id===id;
      button.classList.toggle('here',active);
      if(active) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  },
  open(trigger){
    if(!S) return;
    this.returnFocus=trigger||document.activeElement;
    if(this.pendingUpdateKind) this.tab=this.pendingUpdateKind==='main'?'main':'side';
    this.clearUpdateNotice();
    G.clearQuestLedgerUpdates();
    G.save();
    const statusOverlay=document.querySelector('#ovl-status');
    if(statusOverlay){
      statusOverlay.classList.remove('on');
      statusOverlay.setAttribute('aria-hidden','true');
    }
    this.render();
    this.root.querySelector('#quest-ledger').setAttribute('aria-hidden','false');
    document.body.classList.add('quest-ledger-open');
    this.setDock('dk-objectives');
    requestAnimationFrame(()=>this.root.querySelector('.quest-ledger-back').focus());
  },
  close(restore=true,dock='dk-road'){
    if(!this.root) return;
    this.root.querySelector('#quest-ledger').setAttribute('aria-hidden','true');
    document.body.classList.remove('quest-ledger-open');
    this.setDock(dock);
    if(restore&&this.returnFocus&&this.returnFocus.isConnected) this.returnFocus.focus();
  },
  nativeGoalButton(){
    return [...document.querySelectorAll('button,[role="button"]')].find(button=>{
      if(this.root.contains(button)) return false;
      const label=(button.getAttribute('aria-label')||button.textContent||'').replace(/\s/g,'');
      return label==='목표'||label==='목표보기';
    });
  },
  eventIsOpen(){
    const sheet=document.querySelector('#ev-sheet');
    if(!sheet) return false;
    const wrap=sheet.closest('#ev-wrap');
    if(wrap) return wrap.classList.contains('on')&&wrap.getAttribute('aria-hidden')!=='true';
    const style=getComputedStyle(sheet);
    return style.display!=='none'&&style.visibility!=='hidden'&&sheet.getAttribute('aria-hidden')!=='true';
  },
  syncAvailability(){
    if(!this.root) return false;
    const eventOpen=this.eventIsOpen();
    if(eventOpen&&this.isOpen()) this.close(false);
    if(eventOpen){
      this.clearUpdateNotice();
    }
    this.root.hidden=eventOpen;
    this.root.inert=eventOpen;
    return eventOpen;
  },
  card(row){
    const progress=row.progress||{have:0,need:1,label:''};
    const ratio=Math.max(0,Math.min(100,Math.round((progress.have/Math.max(1,progress.need))*100)));
    const canTrack=row.kind!=='main'&&row.status!=='completed';
    const completed=row.status==='completed'||row.kind==='completed';
    const action=completed?null:G.questActionPlan(row.id);
    const guidanceKey=value=>String(value||'').replace(/^길을\s*놓쳤다면\s*/,'').replace(/[\s‘’“”'".,·]/g,'');
    const showRecovery=row.recovery&&guidanceKey(row.recovery)!==guidanceKey(row.next);
    // The journal records what the player has learned, never unreached plot steps.
    const knownSteps=Array.isArray(row.steps)?row.steps.filter(step=>step.state==='done'):[];
    const steps=knownSteps.length?`<details class="quest-evidence"><summary>확인한 기록 <span>${knownSteps.length}</span></summary><ol class="quest-main-steps" aria-label="확인한 임무 기록">${knownSteps.map(step=>
      `<li class="is-done"><i aria-hidden="true"></i><span><b>${this.esc(step.label)}</b>${step.detail?`<small>${this.esc(step.detail)}</small>`:''}</span></li>`
    ).join('')}</ol></details>`:'';
    const context=row.why||showRecovery?`<details class="quest-context"><summary>단서의 배경과 길 안내</summary>${row.why?`<p>${this.esc(row.why)}</p>`:''}${showRecovery?`<p class="quest-recovery">${this.esc(row.recovery)}</p>`:''}</details>`:'';
    return `<article class="quest-ledger-card quest-kind-${this.esc(row.kind)} ${row.tracked?'is-tracked':''}">
      <div class="quest-card-top"><span>${this.esc(row.eyebrow)}</span>${row.tracked&&row.kind!=='main'?'<b>추적 중</b>':''}</div>
      <h3>${this.esc(row.title)}</h3>
      <p class="quest-card-phase">${this.esc(row.phase)}</p>
      ${row.kind!=='main'&&!completed?`<div class="quest-progress"><i style="width:${ratio}%"></i></div><div class="quest-progress-label"><span>진행</span><strong>${this.esc(progress.label)}</strong></div>`:''}
      <div class="quest-clue-note"><span class="quest-clue-label">${completed?'남겨진 기록':row.kind==='main'?'지금 따라갈 단서':'다음에 할 일'}</span><p class="quest-next">${this.esc(completed&&row.expected?row.expected:row.next)}</p></div>
      ${action?`<button class="quest-action-button" type="button" data-quest-action="${this.esc(row.id)}">${this.esc(action.label)}</button>`:''}
      ${context}${steps}
      ${canTrack?`<button class="quest-track-button" type="button" data-quest-track="${this.esc(row.id)}">${row.tracked?'추적 해제':'이 미션 추적하기'}</button>`:''}
    </article>`;
  },

  render(){
    if(!this.root) return;
    const eventOpen=this.syncAvailability();
    const fallback=this.root.querySelector('#quest-ledger-fallback');
    fallback.hidden=!S||!!this.nativeGoalButton()||eventOpen||this.isOpen();
    if(!S) return;
    const entries=G.questLedgerEntries();
    const tracked=entries.filter(row=>row.tracked&&row.kind!=='main'&&row.status!=='completed').length;
    const trackedOrder=G.ensureQuestLedger().tracked;
    const focusedSide=entries.find(row=>row.id===trackedOrder[trackedOrder.length-1]&&row.kind!=='main'&&row.status!=='completed');
    const sideCount=entries.filter(row=>(row.kind==='companion'||row.kind==='local')&&row.status!=='completed').length;
    const summary=this.root.querySelector('.quest-ledger-summary');
    summary.hidden=this.tab!=='side'||sideCount===0;
    summary.innerHTML=`
      <span><strong>길에서 맡은 부탁 ${sideCount}개</strong>${focusedSide?`<small>현재 추적 중 · ${this.esc(focusedSide.title)}</small>`:''}</span>
      <em>${tracked}/2 추적</em>`;
    this.root.querySelectorAll('[data-quest-tab]').forEach(button=>{
      const active=button.dataset.questTab===this.tab;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    const visible=entries.filter(row=>{
      const completed=row.status==='completed'||row.kind==='completed';
      if(this.tab==='main') return row.kind==='main'&&!completed;
      if(this.tab==='side') return (row.kind==='companion'||row.kind==='local')&&!completed;
      return this.tab==='completed'&&completed;
    }).sort((a,b)=>Number(b.tracked)-Number(a.tracked));
    const mainHistory=this.tab==='main'?(G.ensureQuestLedger().mainHistory||[]).slice(-3).reverse():[];
    const history=mainHistory.length?`<section class="quest-main-history"><h3>지나온 단서</h3>${mainHistory.map(row=>`<article><small>${this.esc(row.eyebrow)}</small><b>${this.esc(row.title)}</b><span>${this.esc(row.phase)}</span></article>`).join('')}</section>`:'';
    const list=this.root.querySelector('.quest-ledger-list');
    const content=visible.length
      ?visible.map(row=>this.card(row)).join('')+history
      :`<div class="quest-ledger-empty"><div class="quest-empty-mark" aria-hidden="true"></div><h3>${this.tab==='side'?'아직 맡은 부탁은 없다':'길 위의 기록은 계속된다'}</h3><p>${this.tab==='side'?'정착지에서 사람들에게 말을 걸어 보자. 함께 하기로 한 일은 이 장부에 남긴다.':'끝낸 미션과 그 결과를 이곳에 모아 둔다.'}</p><button type="button" class="quest-return-road">길로 돌아가기</button></div>`;
    // Road HUD mutations can request the same render repeatedly. Preserve the
    // active controls and keyboard focus until the actual quest content changes.
    if(this.listContent!==content){ list.innerHTML=content; this.listContent=content; }
    const returnRoad=list.querySelector('.quest-return-road');
    if(returnRoad) returnRoad.onclick=()=>this.close();
    this.showUpdate();
  },
  clearUpdateNotice(){
    const button=this.noticeButton;
    if(button){
      button.classList.remove('has-quest-update');
      button.removeAttribute('aria-describedby');
    }
    const status=this.root?.querySelector('#quest-update-status');
    if(status&&status.textContent) status.textContent='';
    this.noticeButton=null;
    this.pendingUpdateKind=null;
    this.noticeKey=null;
  },
  showUpdate(){
    // An event publishes its own saved update at the end of the conversation.
    if(G.presentationApplying||document.querySelector('#ev-wrap.on .event-mode')){
      this.clearUpdateNotice();
      return;
    }
    if(!S||this.isOpen()) return;
    const rows=G.questLedgerUpdates();
    if(!rows.length){ this.clearUpdateNotice(); return; }
    const row=rows[rows.length-1];
    const button=this.nativeGoalButton()||this.root?.querySelector('#quest-ledger-fallback');
    if(!button) return;
    const key=JSON.stringify([row.id,row.kind,row.title,row.next]);
    if(this.noticeButton===button&&this.noticeKey===key) return;
    this.clearUpdateNotice();
    this.noticeButton=button;
    this.noticeKey=key;
    this.pendingUpdateKind=row.kind;
    button.classList.add('has-quest-update');
    button.setAttribute('aria-describedby','quest-update-status');
    this.root.querySelector('#quest-update-status').textContent=`${row.kind==='main'?'메인 스토리':'사이드 미션'} 갱신. ${row.title}. 목표에서 새 기록을 확인할 수 있다.`;
  }
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>QuestLedgerUI.init());
else QuestLedgerUI.init();
