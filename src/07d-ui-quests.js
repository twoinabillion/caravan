/* Journal presentation only: never rewrite saved quest snapshots or receipts. */
const QuestJournal={
  chapters:{'prologue-family':'family','prologue-appeal':'appeal','prologue-module':'module','first-trace':'trace','first-trace-fallback':'trace','parents-diversion':'parents_split','parents-separated-work':'parents_work','verification-key':'key',witnesses:'witness','father-last-log':'father','mother-reunion':'mother'},
  // Title / unfinished thought / witnessed record. Records are gated by done.
  main:{
    family:['도윤이네 이송표','도윤이네도 이송표를 받았다는데. 우리 부모님이 받은 표랑 같은 걸까? 그 집 표도 한번 봐야겠다.','도윤이네를 돕다가 이송표를 봤다. 아직도 이런 표로 가족을 갈라놓고 있구나.'],
    appeal:['부산에서 물어볼 것','여기서 이송 명령을 취소할 수는 없나? 민원 창구에 이송표랑 엄마의 장치를 가져가 봐야겠다.','부산에선 명령을 취소할 수 없단다. 남산에서 직접 확인하라고.'],
    module:['엄마가 남긴 장치','엄마 회로도랑 계기판 안쪽 배선. 둘을 맞춰 보면 이 장치가 뭘 하는지 알 수 있으려나.','엄마 회로도랑 계기판 안쪽 배선이 맞는다. 장치가 이미 달구지에 연결돼 있었네. 대체 언제부터?'],
    trace:['이송표의 발신 번호','누가 이 명령을 보낸 걸까. 표에 찍힌 발신 번호부터 따라가 봐야지.','부모님 이송표랑 지금 나오는 표를 맞춰 보니, 둘 다 같은 곳에서 보낸 거였다.'],
    parents_split:['부모님이 탄 다음 차','아빠랑 엄마는 다음에 어느 차를 탔을까. 환승소 운행표에 이름이 남아 있으면 좋겠는데.','운행표에서 찾은 부모님 이름. 아빠는 남산 유지선으로, 엄마는 중부 기록 정리소로 보내졌다고.'],
    parents_work:['아빠와 엄마가 남긴 기록','아빠랑 엄마가 뭘 하려던 건지는 아직 모르겠다. 둘이 남긴 기록을 같이 봐야 좀 알 것 같다.','아빠 정비 기록이랑 엄마 증언 묶음에서 같은 번호를 찾았다. 떨어져서도 서로 기록을 보내고 있었구나.'],
    key:['계기판에서 꺼낼 검증키','함부로 떼면 배선까지 망가진다니. 빠진 설명서부터 찾아야지.','빠진 설명서를 찾아 맞춰 보고, 검증키를 계기판에서 꺼냈다. 다행히 망가뜨리진 않았네.'],
    witness:['같은 표를 받은 사람들','서류만으론 모르겠는 게 있다. 같은 이송표를 받은 사람들을 만나면 그쪽 이야기도 들어 봐야지.','같은 이송표를 받은 사람들에게 직접 들은 얘기들. 본인에게 확인도 받았고, 증언도 챙겨 뒀다.'],
    command:['명령 원본과 증언','명령 원본을 펴 놓고, 사람들한테 들은 얘기랑 맞춰 보자. 어느 대목부터 어긋났을까.','발신 번호랑 증언을 원본에 대조해 보니 구분이 된다. 사람의 확인이 빠진 부분, 그리고 위에서 내려온 명령.'],
    father:['아빠의 남산 기록','아빠의 정비 번호는 어디서 끊겼을까. 남산에 남은 기록을 읽어 보면 알 수 있겠지.','아빠의 마지막 기록을 읽었다. 남산에서 돌아가셨다. 의료와 급수 회선을 지키다가.'],
    mother:['엄마의 무전','엄마가 남긴 무전 표식을 따라가면 어디가 나올까. 신호를 보낸 곳까지 가서 직접 확인하자.','엄마를 다시 만났다. 내가 남산에 들어가면 밖에서 송출을 도와주겠다고.'],
    relay:['남산으로 들어갈 길','남산까지 어떻게 들어가지? 중계소 사람들에게 길을 묻고, 연락할 방법도 맞춰 둘 것.','남산으로 들어갈 길과 연락 순서는 확인 끝. 어느 거점에서 응답하는지도 적어 놨고.'],
    records:['남산에 가져갈 기록','남산에 가져갈 기록을 챙기는 중. 길에서 맡은 게 빠지진 않았나, 한 번 더 보자.','남산에 가져갈 실물 기록은 챙겨 뒀다. 필요할 때 바로 꺼낼 수 있게, 한데 모아서.'],
  },
  companionRecords:{
    minji:['같이 일할 방식은 민지랑 맞춰 놨다.','민지랑 같이 따라간 민규의 신호.','민지가 왜 혼자 남았는지, 이제 끝까지 들었다.'],
    parkss:['서로 몸 상태부터 살펴봤다.','명단의 이름들. 그 사람들이 어떻게 살았는지 같이 되짚어 봤지.','남겨진 이름들은 증언으로 정리해 뒀다. 잊지 않으려고.'],
    kangwoo:['차 안에서 서로 지킬 선은 정해 놨고.','후임이 고친 경계선은 같이 따라가 봤다.','수비대에서 무슨 일이 있었는지 끝까지 들었다. 그랬던 거구나.'],
    leo:['농담을 하다가도 레오가 말을 멈출 때가 있네.','레오가 끝내지 못한 노래. 이번엔 같이 이어 가 봤다.','길에서 만난 사람들 목소리로 노래를 완성했다. 끝까지.'],
    jaeyi:['재이 아버지의 상자에 뭘 남길지 같이 골랐다.','열쇠가 가리키는 곳까지 같이 가 봤지.','재이가 떠나왔던 곳에 다시 갔다. 이번엔 함께.'],
    eunsu:['녹음기를 끄고 나눈 얘기. 차 안에서 은수랑.','관제실에서 놓친 신호는 다시 열어 봤고.','은수가 남긴 접속 코드와 그 책임. 같이 얘기해 봤다.']
  },
  recruitNotes:{
    minji:'민규의 진단기를 꺼내는 건 돕기로 했다. 폐차장에 가면 민지랑 같이 살펴봐야지.',
    parkss:'버스의 냉장 약품을 길가 진료소로 옮기는 일. 박 선생과 같이 가기로 했으니 잊지 말자.',
    leo:'보리가 들어간 침수 지하차도. 레오랑 같이 찾아보자고 약속했다.',
    jaeyi:'재이 가족의 상자가 무너진 창고에 남아 있단다. 같이 꺼내기로 했는데, 현장부터 봐야겠지.',
    eunsu:'추방 좌표를 보내는 중계기부터 끊기로 했다. 어떻게 끊을지는 은수랑 현장에서 찾아보자.',
    kangwoo:'강우가 초소를 떠나기 전에 도울 일. 후임과 함께 돔 시장의 감시 표식을 멈추기로 했다.'
  },
  place(id){return D.nodes?.[id]?.name||'목적지';},
  withName(name){const last=name.charCodeAt(name.length-1)-0xac00;return name+(last>=0&&last<11172&&last%28?'과':'와');},
  key(row){
    const chapter=row.chapterId||String(row.id).match(/^main_history_(.+)_\d+_[^_]+$/)?.[1];
    return this.chapters[chapter]||chapter||Object.keys(this.main).find(id=>String(row.id).startsWith(`main_history_${id}_`));
  },
  steps(row){
    return (row.steps||[]).map((step,index)=>{
      const copy=row.kind==='main'&&this.main[step.id];
      const companion=row.companion&&this.companionRecords[row.companion]?.[index];
      return copy?{...step,label:copy[0],detail:copy[2]}:companion?{...step,label:companion,detail:''}:step;
    }).filter(step=>step.state==='done');
  },
  entry(row){
    const completed=row.status==='completed'||row.kind==='completed';
    const result={...row,why:'',recovery:'',steps:this.steps(row),guide:'',receipt:'',aside:null,pencil:'',doodle:false};
    const key=this.key(row),copy=this.main[key];
    if(row.kind==='main'||String(row.id).startsWith('main_history_')){
      if(copy){
        result.title=copy[0];
        // A legacy chapter receipt can be saved after a stage was skipped.
        // Never treat its old "expected" field as a witnessed outcome.
        const done=completed&&(G.departureSteps?.()||[]).some(step=>step.id===key&&step.done);
        result.next=completed?(done?copy[2]:'다음 단서로 넘어갈 때 따라갔던 기록.'):copy[1];
        result.phase=completed?row.phase:'';
      }else if(completed&&row.chapterId!=='ending'){
        result.title='지나온 단서';result.next='다음 단서로 넘어갈 때 따라갔던 기록.';
      }else if(row.chapterId==='ending'){
        result.title='남산에서 내린 결정';result.next='남산 코어에서 마지막 결정까지 내렸다. 여기까지 뭘 골랐는지, 잊기 전에 적어 두자.';result.phase='여정을 마치고';
      }else if(String(row.chapterId).startsWith('seoul-')){
        const stops=D.seoulMap?.stops||[],stage=Number(row.chapterId.slice(6)),stop=stops[stage];
        result.title=stop?(stop.name||stop.label):'남산 코어 앞에서';
        result.next=stop?'여긴 길이 막혔네. 길을 열고, 가져온 기록은 코어까지 직접 들고 가야지.':'이제 코어에 검증키와 증언을 연결할 차례. 여기서 어떻게 할지는 내가 정해야 한다.';
        result.guide='서울 진입로 · 현재 지점 확인';
      }else if(row.chapterId==='road-to-seoul'){
        result.title='이제 서울로';result.next='기록도 모았고, 도와줄 사람들과도 연락이 닿았다. 이제 서울로 가 볼까.';result.guide='전체 지도 · 서울 방면';
      }else{
        const pillar=String(row.chapterId||'').replace('prepare-','');
        const fallback={관계:'witness',세계:'relay',진실:'command',유산:'records'}[pillar];
        result.title=this.main[fallback]?.[0]||'다음에 확인할 것';result.next=this.main[fallback]?.[1]||'빠뜨린 단서가 없나? 다시 살펴봐야지.';result.guide=row.next||'';
      }
      if(!completed){
        const evidence=G.mainEvidenceOpportunity?.();
        if(evidence) result.guide=`${this.place(evidence.target)} · 주변 탐색 · ${evidence.cost}`;
        else if(!result.guide) result.guide=row.next||'';
        if(key==='mother'&&S.flags?.mother_reunited) result.next='엄마랑 다시 만났다. 남산에 들어가기 전에, 밖에서 연락을 어떻게 주고받을지 맞춰 놔야겠네.';
        if(key==='key'&&S.flags?.parent_principle_found) result.next='설명서를 찾았으니 원래 수첩이랑 맞춰 볼 것. 순서를 확인하기 전엔 검증키에 손대지 말자.';
        // Authored marks belong to this thought, not to every quest template.
        // Do not call the journey lonely after a companion has joined.
        if(key==='parents_work'){
          if(!(S.party||[]).length&&!S.recruitQ) result.aside={erased:'혼자서는 무리일 것 같다',added:'해 보기 전엔 모르지.'};
          if(evidence?.target) result.pencil=`${this.place(evidence.target)}에 가면 주변부터 둘러보자.`;
          result.doodle=true;
        }
      }
    }else if(row.kind==='companion'){
      const name=D.comps?.[row.companion]?.name||row.title,state=S.comps?.[row.companion]||{};
      const rq=S.recruitQ?.id===row.companion?S.recruitQ:null;
      result.title=`${this.withName(name)} 나눈 이야기`;
      if(completed) result.next=this.companionRecords[row.companion]?.[2]||`${name}의 이야기도 끝까지 들었네.`;
      else if(rq){
        result.title=`${this.withName(name)} 함께 가는 길`;
        result.next=rq.stage==='task'?(this.recruitNotes[row.companion]||`${name}의 부탁은 돕기로 했으니, 가서 살펴보자.`)
          :rq.stage==='road'?`${this.withName(name)} 다음 정차까지는 같이 가기로. 한 구간 더 달려 보자.`
          :rq.stage==='follow'&&Number.isFinite(rq.roadDay)&&S.day<=rq.roadDay?'오늘은 같이 야영하며 쉬고, 계속 같이 갈지는 내일 물어볼까.'
          :`${this.withName(name)} 함께 일을 겪어 봤으니, 앞으로도 같이 갈 생각인지 물어봐야겠다.`;
        result.guide=rq.stage==='ready'?'머물기 · 합류 이야기':rq.stage==='road'?'다음 구간 주행':rq.stage==='follow'&&Number.isFinite(rq.roadDay)&&S.day<=rq.roadDay?'야영 준비 · 다음 날 대화':`${this.place(rq.target)} · 머물기 · 동료의 부탁`;
      }else if(state.pending){result.next=`${name}도 손에 익은 일이 늘었네. 앞으로 뭘 맡을지 같이 정해 보자.`;result.guide=`동료 · Lv.${state.pending} 특기 선택`;}
      else {result.next=`${name}에 대해선 아직 모르는 게 많네. 쉴 때 이야기를 더 나눠 보면 어떨까.`;result.guide=row.next;}
    }else if(row.kind==='local'){
      const q=S.quest?.ledgerId===row.id?S.quest:S.questFollowup?.ledgerId===row.id?S.questFollowup:null;
      if(!q) return {...result,next:'무슨 부탁이었더라. 맡았던 일을 다시 확인해 보자.',guide:row.next};
      const from=this.place(q.from),to=this.place(q.to),arrived=S.at===q.to&&!S.driving;
      const overdue=!q.noExpiry&&S.day>q.due;
      result.eyebrow=`사이드 미션 · ${q.story?'지역':({deliver:'배달',express:'특송',procure:'조달',letter:'편지'}[q.kind]||'지역')}`;
      if(row.status==='available'){result.next='다음 부탁도 있다는데. 무슨 일인지 듣고, 계속 맡을지는 그때 정하자.';result.guide=`${from} · 게시판`;}
      else if(q.kind==='procure'){
        const have=Math.min(Number(S.items?.[q.need.name])||0,q.need.qty),left=q.need.qty-have;
        result.title=`부탁받은 ${q.need.name} ${q.need.qty}개`;
        result.next=left?(have?`${have}개는 챙겼고, ${left}개 남았네. 마저 구해서 돌아가자.`:`아직 챙긴 건 없다. ${left}개를 구해서 돌아가면 되겠지.`):'부탁받은 물건은 다 모았다. 이제 돌아가서 건네주기만 하면 되겠네.';
        result.guide=`${left?'물품 구입 · ':''}${from} 게시판에서 전달`;
      }else{
        result.next=q.kind==='letter'?`${D.npcs?.[q.npc]?.name||'받는 사람'}에게 전할 편지. ${to}에 ${arrived?'도착했으니 이제 찾아가면 되겠네.':'가면 잊지 말고 찾아갈 것.'}`
          :`${to}까지 맡아 온 짐, ${q.item||'부탁받은 물건'}. ${arrived?'도착했으니 이제 받을 사람을 찾아보자.':'받을 사람한테 잘 건네주자.'}`;
        if(q.kind==='express'&&!overdue) result.next+=' 급한 짐이니 너무 늦지는 말아야지.';
        result.guide=`${to} · 게시판에서 전달`;
      }
      if(overdue) result.next+=' 약속한 날을 넘겨 버렸네. 늦었어도 전달은 마저 하자.';
    }else if(completed){
      const kind=String(row.id).match(/^completed_local_(deliver|delivery|express|procure|letter)_/)?.[1];
      result.next=kind==='procure'?'부탁받은 물건은 다 구해서 건넸다. 이 일은 여기까지.'
        :kind==='letter'?'맡았던 편지도 전달 끝. 잊기 전에 적어 두자.'
        :kind==='express'?'급하게 맡은 짐은 전달 끝.'
        :kind==='deliver'||kind==='delivery'?'맡아 온 짐은 받을 사람에게 건넸고. 이 부탁도 마무리.'
        :'맡았던 일은 끝. 여기 적어 두면 잊진 않겠지.';
      result.receipt=row.expected||'';
    }
    if(completed){result.expected=result.next;result.guide='';}
    return result;
  }
};

/* ═══ QUEST LEDGER UI ═══ */
const QuestLedgerUI={
  tab:'main', root:null, rendering:false,
  esc(value){ return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); },
  init(){
    if(this.root||!document.body) return;
    const root=document.createElement('div');
    root.id='quest-ledger-layer';
    root.innerHTML=`
      <button id="quest-ledger-fallback" type="button" aria-label="여정 기록 열기"><span>목표</span><b>메인 스토리</b></button>
      <span id="quest-update-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></span>
      <section id="quest-ledger" role="dialog" aria-modal="true" aria-labelledby="quest-ledger-title" aria-hidden="true">
        <header class="quest-ledger-head">
          <button class="quest-ledger-back" type="button" aria-label="여정 기록 닫기">‹</button>
          <h2 id="quest-ledger-title">여정 기록</h2><small>상혁의 공책</small>
        </header>
        <nav class="quest-ledger-tabs" aria-label="기록 분류">
          <button type="button" data-quest-tab="main">메인 스토리</button>
          <button type="button" data-quest-tab="side">사이드 미션</button>
          <button type="button" data-quest-tab="completed">완료 기록</button>
        </nav>
        <div class="quest-ledger-summary" aria-live="polite"></div>
        <div class="quest-notebook-cover"><div class="quest-notebook-sheet">
          <div class="quest-notebook-binding" aria-hidden="true"></div>
          <div class="quest-ledger-list" tabindex="0" aria-label="공책 본문 · 스크롤해서 읽기"></div>
        </div></div>
        <footer class="quest-ledger-tools" hidden></footer>
      </section>`;
    document.body.appendChild(root); this.root=root;
    root.querySelector('#quest-ledger-fallback').addEventListener('click',()=>this.open());
    root.querySelector('.quest-ledger-back').addEventListener('click',()=>this.close());
    root.querySelector('.quest-ledger-tabs').addEventListener('click',event=>{
      const button=event.target.closest('[data-quest-tab]'); if(!button) return;
      this.tab=button.dataset.questTab; this.render();
    });
    root.addEventListener('click',event=>{
      if(event.target.closest('.quest-return-road')){this.close();return;}
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
      [...root.querySelectorAll('[data-quest-track]')].find(control=>control.dataset.questTrack===button.dataset.questTrack)?.focus();
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
  marks(row){
    const aside=row.aside;
    return aside?`<div class="quest-margin-aside" role="note" aria-label="고쳐 쓴 혼잣말">
      <p class="quest-crossed-thought"><span class="sr-only">지운 말: </span><del>${this.esc(aside.erased)}<svg class="quest-pen-crossout" viewBox="0 0 210 28" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M3 16 Q55 11 110 14 T206 11 M7 10 Q75 17 133 11 T208 16 M14 21 Q95 7 200 18"/></svg></del></p>
      <p class="quest-added-thought"><svg class="quest-pen-arrow" viewBox="0 0 30 28" aria-hidden="true" focusable="false"><path d="M5 2 Q0 22 24 20 M18 15 L25 20 L19 25"/></svg><span class="sr-only">덧쓴 말: </span>${this.esc(aside.added)}</p>
    </div>`:'';
  },
  doodle(){
    return `<svg class="quest-dalguji-doodle" viewBox="0 0 104 51" role="img" aria-label="공책 구석의 작은 달구지 낙서">
      <path d="M12 34 L11 9 Q32 6 59 8 L60 18 L76 17 L87 28 L89 36 L80 37 M64 37 L35 38 M21 38 L12 37 M60 19 L60 35 M63 22 L74 21 L80 28 L64 29 Z M18 13 L35 12 L36 22 L18 23 Z M40 12 L52 12 L53 22 L41 22 Z M15 30 L54 29 M21 36 C20 27 34 29 34 37 C34 46 20 45 21 36 M65 36 C66 28 80 29 80 38 C77 46 64 45 65 36 M24 37 Q27 33 30 37 Q28 41 24 37 M69 37 Q74 34 76 38 M7 45 Q46 43 93 44"/>
      <path class="quest-pen-retrace" d="M9 33 L10 8 L58 6 M13 39 L19 39 M35 40 L64 39 M80 39 L92 38 L90 29 M19 46 Q37 48 45 46"/>
    </svg>`;
  },
  controls(row){
    const completed=row.status==='completed'||row.kind==='completed';
    const action=completed?null:G.questActionPlan(row.id);
    return `${row.guide?`<p class="quest-guide" aria-label="장소와 행동 안내">${this.esc(row.guide)}</p>`:''}
      ${action?`<button class="quest-action-button" type="button" data-quest-action="${this.esc(row.id)}" aria-label="${this.esc(action.label)}">${this.esc(action.label)}</button>`:''}
      ${row.kind!=='main'&&!completed?`<button class="quest-track-button" type="button" data-quest-track="${this.esc(row.id)}">${row.tracked?'추적 해제':'이 미션 추적하기'}</button>`:''}`;
  },
  card(row,{separateTools=false}={}){
    row=QuestJournal.entry(row);
    const progress=row.progress||{have:0,need:1,label:''};
    const ratio=Math.max(0,Math.min(100,Math.round((progress.have/Math.max(1,progress.need))*100)));
    const completed=row.status==='completed'||row.kind==='completed';
    // The journal records what the player has learned, never unreached plot steps.
    const knownSteps=Array.isArray(row.steps)?row.steps.filter(step=>step.state==='done'):[];
    const steps=knownSteps.length?`<details class="quest-evidence"><summary>확인한 것 <span>${knownSteps.length}</span></summary><ol class="quest-main-steps" aria-label="확인한 것">${knownSteps.map(step=>
      `<li class="is-done"><b>${this.esc(step.label)}</b>${step.detail?`<p>${this.esc(step.detail)}</p>`:''}</li>`
    ).join('')}</ol></details>`:'';
    const hour=Math.floor((S.min||0)/60)%24;
    const date=row.kind==='main'&&!completed?`${S.day===1?'첫날':`${S.day||1}일째`} ${hour<6?'새벽':hour<12?'아침':hour<18?'낮':'밤'}, ${QuestJournal.place(S.at||S.driving?.from)}`:row.eyebrow;
    return `<article class="quest-ledger-card quest-kind-${this.esc(row.kind)} ${row.tracked?'is-tracked':''}">
      <div class="quest-card-top"><span>${this.esc(date)}</span>${row.tracked&&row.kind!=='main'?'<b>추적 중</b>':''}</div>
      <h3>${this.esc(row.title)}</h3>
      <p class="quest-next">${this.esc(completed&&row.expected?row.expected:row.next)}</p>
      ${this.marks(row)}${row.pencil?`<p class="quest-pencil-note">${this.esc(row.pencil)}</p>`:''}
      ${steps}${row.doodle?this.doodle():''}
      ${row.receipt?`<details class="quest-receipt"><summary>받은 것과 남은 기록</summary><p>${this.esc(row.receipt)}</p></details>`:''}
      ${row.phase?`<p class="quest-card-phase">${this.esc(row.phase)}</p>`:''}
      ${row.kind!=='main'&&!completed?`<div class="quest-progress" aria-hidden="true"><i style="width:${ratio}%"></i></div><p class="quest-progress-label">${this.esc(progress.label)}</p>`:''}
      ${!completed&&!separateTools?`<div class="quest-card-tools">${this.controls(row)}</div>`:''}
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
    const sideCount=entries.filter(row=>(row.kind==='companion'||row.kind==='local')&&row.status!=='completed').length;
    const summary=this.root.querySelector('.quest-ledger-summary');
    summary.hidden=this.tab!=='side'||sideCount===0;
    summary.innerHTML=`
      <span>길에서 맡은 부탁 ${sideCount}개</span>
      <em>${tracked}/2 추적</em>`;
    this.root.querySelectorAll('[data-quest-tab]').forEach(button=>{
      const active=button.dataset.questTab===this.tab;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    const visible=entries.filter(row=>{
      const completed=row.status==='completed'||row.kind==='completed';
      if(this.tab==='main') return row.kind==='main'&&!completed;
      if(this.tab==='side') return (row.kind==='companion'||row.kind==='local')&&!completed;
      return this.tab==='completed'&&completed;
    }).sort((a,b)=>Number(b.tracked)-Number(a.tracked));
    const mainHistory=this.tab==='main'?(G.ensureQuestLedger().mainHistory||[]).slice(-3).reverse().map(row=>QuestJournal.entry({...row,kind:'completed',status:'completed'})):[];
    const history=mainHistory.length?`<details class="quest-main-history"><summary>지나온 기록</summary>${mainHistory.map(row=>`<article><h3>${this.esc(row.title)}</h3><p>${this.esc(row.next)}</p>${row.phase?`<small>${this.esc(row.phase)}</small>`:''}</article>`).join('')}</details>`:'';
    const list=this.root.querySelector('.quest-ledger-list');
    const separateTools=this.tab==='main'&&visible.length===1;
    const content=visible.length
      ?visible.map(row=>this.card(row,{separateTools})).join('')+history
      :`<div class="quest-ledger-empty"><h3>${this.tab==='side'?'아직 맡은 부탁은 없다':this.tab==='main'?'지나온 길':'끝낸 일'}</h3><p>${this.tab==='side'?'정착지에 들르면 사람들 얘기부터 들어 볼까.':this.tab==='main'?'지나온 일들은 완료 기록 쪽에. 잊지 않게 남겨 놨다.':'부탁을 끝내면 까먹기 전에 여기 적어 두자.'}</p></div>${history}`;
    // Road HUD mutations can request the same render repeatedly. Preserve the
    // active controls and keyboard focus until the actual quest content changes.
    if(this.listContent!==content){
      const opened=[...list.querySelectorAll?.('details[open]')||[]].map(detail=>[detail.closest('article')?.querySelector('h3')?.textContent,detail.className]);
      list.innerHTML=content; this.listContent=content;
      if(this.renderedTab===this.tab){
        for(const detail of list.querySelectorAll?.('details')||[]){
          if(opened.some(([title,kind])=>kind===detail.className&&title===detail.closest('article')?.querySelector('h3')?.textContent)) detail.open=true;
        }
      }else list.scrollTop=0;
      this.renderedTab=this.tab;
    }
    const tools=this.root.querySelector('.quest-ledger-tools');
    const toolContent=separateTools?this.controls(QuestJournal.entry(visible[0])):!visible.length?'<button type="button" class="quest-return-road">길로 돌아가기</button>':'';
    tools.hidden=!toolContent;
    if(this.toolContent!==toolContent){tools.innerHTML=toolContent;this.toolContent=toolContent;}
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
