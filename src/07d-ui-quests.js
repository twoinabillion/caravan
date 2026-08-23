/* ═══ QUEST LEDGER UI — 기존 목표 버튼을 통합 임무 장부로 연결한다 ═══ */
const QuestLedgerUI={
  tab:'main', root:null, rendering:false,
  esc(value){ return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); },
  init(){
    if(this.root||!document.body) return;
    const root=document.createElement('div');
    root.id='quest-ledger-layer';
    root.innerHTML=`
      <button id="quest-ledger-fallback" type="button" aria-label="임무 장부 열기"><span>목표</span><b>주 임무</b></button>
      <section id="quest-ledger" role="dialog" aria-modal="true" aria-labelledby="quest-ledger-title" aria-hidden="true">
        <header class="quest-ledger-head">
          <button class="quest-ledger-back" type="button" aria-label="임무 장부 닫기">‹</button>
          <div><small>여정 기록</small><h2 id="quest-ledger-title">임무 장부</h2></div>
        </header>
        <nav class="quest-ledger-tabs" aria-label="임무 분류">
          <button type="button" data-quest-tab="main">본편</button>
          <button type="button" data-quest-tab="companion">동료</button>
          <button type="button" data-quest-tab="local">지역 의뢰</button>
          <button type="button" data-quest-tab="completed">완료</button>
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
  close(restore=true){
    if(!this.root) return;
    this.root.querySelector('#quest-ledger').setAttribute('aria-hidden','true');
    document.body.classList.remove('quest-ledger-open');
    this.setDock('dk-road');
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
    this.root.hidden=eventOpen;
    this.root.inert=eventOpen;
    return eventOpen;
  },
  card(row){
    const progress=row.progress||{have:0,need:1,label:''};
    const ratio=Math.max(0,Math.min(100,Math.round((progress.have/Math.max(1,progress.need))*100)));
    const canTrack=row.kind!=='main'&&row.status!=='completed';
    const steps=Array.isArray(row.steps)&&row.steps.length?`<ol class="quest-main-steps" aria-label="본편 진행 단계">${row.steps.map(step=>`<li class="is-${this.esc(step.state||'upcoming')}"><i aria-hidden="true"></i><span><b>${this.esc(step.label)}</b>${step.detail?`<small>${this.esc(step.detail)}</small>`:''}</span></li>`).join('')}</ol>`:'';
    return `<article class="quest-ledger-card quest-kind-${this.esc(row.kind)} ${row.tracked?'is-tracked':''}">
      <div class="quest-card-top"><span>${this.esc(row.eyebrow)}</span>${row.tracked&&row.kind!=='main'?'<b>선택 임무 고정됨</b>':''}</div>
      <h3>${this.esc(row.title)}</h3>
      <p class="quest-card-phase">${this.esc(row.phase)}</p>
      <div class="quest-progress"><i style="width:${ratio}%"></i></div>
      <div class="quest-progress-label"><span>진행</span><strong>${this.esc(progress.label)}</strong></div>
      ${row.why?`<dl><div><dt>왜 이 일을 하나</dt><dd>${this.esc(row.why)}</dd></div></dl>`:''}
      <dl>
        <div class="quest-next"><dt>지금 할 일</dt><dd>${this.esc(row.next)}</dd></div>
        <div><dt>끝내면</dt><dd>${this.esc(row.expected)}</dd></div>
        ${row.recovery?`<div class="quest-recovery"><dt>길을 놓쳤다면</dt><dd>${this.esc(row.recovery)}</dd></div>`:''}
      </dl>
      ${steps}
      ${canTrack?`<button class="quest-track-button" type="button" data-quest-track="${this.esc(row.id)}">${row.tracked?'목록 고정 해제':'목록 위에 고정'}</button>`:''}
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
    const main=entries.find(row=>row.kind==='main');
    const trackedOrder=G.ensureQuestLedger().tracked;
    const focusedSide=entries.find(row=>row.id===trackedOrder[trackedOrder.length-1]&&row.kind!=='main'&&row.status!=='completed');
    this.root.querySelector('.quest-ledger-summary').innerHTML=`
      <span><b>주 임무${main&&main.act?` · ${this.esc(main.act)}`:''}</b><strong>${this.esc(main&&main.next||'여정을 시작한다.')}</strong>${focusedSide?`<small>선택 고정 · ${this.esc(focusedSide.next)}</small>`:''}</span>
      <em>선택 임무 ${tracked}/2</em>`;
    this.root.querySelectorAll('[data-quest-tab]').forEach(button=>{
      const active=button.dataset.questTab===this.tab;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    const visible=entries.filter(row=>row.kind===this.tab).sort((a,b)=>Number(b.tracked)-Number(a.tracked));
    const mainHistory=this.tab==='main'?(G.ensureQuestLedger().mainHistory||[]).slice(-3).reverse():[];
    const history=mainHistory.length?`<section class="quest-main-history"><h3>지금까지 지나온 본편</h3>${mainHistory.map(row=>`<article><small>${this.esc(row.eyebrow)}</small><b>${this.esc(row.title)}</b><span>${this.esc(row.phase)}</span></article>`).join('')}</section>`:'';
    this.root.querySelector('.quest-ledger-list').innerHTML=visible.length
      ?visible.map(row=>this.card(row)).join('')+history
      :`<div class="quest-ledger-empty"><b>기록된 임무가 없다</b><p>${this.tab==='companion'?'길에서 만난 사람과 동행하면 이곳에 이야기가 기록된다.':this.tab==='local'?'정착지 게시판이나 주민에게 의뢰를 받으면 이곳에 기록된다.':'완료한 임무가 생기면 결과를 다시 볼 수 있다.'}</p></div>`;
  },
  showUpdate(){
    if(!S||this.isOpen()) return;
    const rows=G.questLedgerUpdates(); if(!rows.length) return;
    const row=rows[rows.length-1];
    let ribbon=document.querySelector('#quest-update-ribbon');
    if(!ribbon){ ribbon=document.createElement('button'); ribbon.id='quest-update-ribbon'; ribbon.type='button'; document.body.appendChild(ribbon); }
    ribbon.innerHTML=`<small>${row.kind==='main'?'주 임무 갱신':'선택 임무 갱신'}</small><b>${this.esc(row.title)}</b><span>${this.esc(row.next)}</span>`;
    ribbon.onclick=()=>{ G.clearQuestLedgerUpdates(); ribbon.remove(); if(row.kind==='main') this.tab='main'; this.open(); };
    clearTimeout(this.updateTimer);
    this.updateTimer=setTimeout(()=>{ if(ribbon.isConnected) ribbon.remove(); G.clearQuestLedgerUpdates(); },5200);
  }
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>QuestLedgerUI.init());
else QuestLedgerUI.init();
