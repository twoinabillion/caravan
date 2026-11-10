/* A read-only interior of the Dalguji. All objects come from current ownership or
   saved camp memories. This renderer never adds inventory, effects or memories. */
const HOME=(()=>{
  const escape=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const zones=[['shelf','선반'],['table','작업대'],['bed','잠자리'],['roof','지붕'],['rear','뒷문']];
  const companions={minji:['shelf','dish'],parkss:['shelf','tin'],kangwoo:['table','map'],leo:['bed','strings'],jaeyi:['shelf','box'],eunsu:['table','record']};
  const upgrades={
    bench:['bed','bench'],cabin:['bed','cabin'],bunk:['bed','bunk'],jumpseat:['rear','seat'],curtain:['bed','curtain'],
    garden:['roof','garden'],collector:['roof','collector'],solar:['roof','solar'],antenna:['roof','antenna'],
    awning:['rear','awning'],stove:['table','stove'],sidebox:['shelf','toolbox'],beehive:['roof','beehive'],
    garden2:['roof','greenhouse'],kitchen:['table','kitchen'],fridge:['table','fridge'],armory:['shelf','rack'],scope:['roof','scope']
  };
  function state(saved={},data={},participants=[]){
    const source=saved||{},party=source.party||[];
    return {party,visitors:[...new Set(participants)].filter(id=>!party.includes(id)&&data.comps?.[id])
      .map(id=>({id,name:data.comps[id].name})),up:source.up||{},memories:source.campMemories||{},
      sharedMemoryTitles:Object.fromEntries(Object.entries(data.comps||{}).map(([id,person])=>
        [id,(data.withParticle?.(person.name,'과','와')||'함께')+' 나눈 시간'])),
      life:source.homeLife,
      household:{day:source.day,min:source.min,night:source.campNight||0,meal:!!source._campPlan?.meal,ended:!!source.ended,driver:source.name||'운전사',dog:!!source.dog,
        people:Object.fromEntries(Object.entries(data.comps||{}).map(([id,person])=>
          [id,{name:person.name,portrait:data.portraits?.[id]||''}])),
        stages:data.vanStages||[],baseCapacity:data.baseParty||2,maxCapacity:data.maxParty||6},
      keepsakes:data.companionKeepsakes||{},upgrades:data.upgrades||[],scene:data.scenes?.['dalguji-home-interior-v1']};
  }
  function layout(state={}){
    const home=state.household;if(!home)return null;
    const installed=state.up||{},people=home.people||{},party=[...new Set(state.party||[])].filter(id=>people[id]);
    const visitors=(state.visitors||[]).filter(person=>people[person.id]&&!party.includes(person.id));
    const capacity=Math.min(home.maxCapacity,home.baseCapacity+(state.upgrades||[])
      .reduce((n,u)=>n+(u.seat&&installed[u.id]?u.seat:0),0));
    let stage={id:'base',nm:'기본 생활칸',cm:0};
    for(const candidate of home.stages)if(!candidate.up||installed[candidate.up])stage=candidate;
    const residents=[...party.map(id=>({id,...people[id],kind:'companion'})),
      ...visitors.map(person=>({id:person.id,...people[person.id],kind:'guest'}))];
    const seats=residents.map((person,index)=>({...person,place:index>=capacity?'함께 쓰는 자리'
      :index<2?'기존 좌석 '+(index+1):'늘어난 자리 '+(index-1)}));
    for(let index=residents.length;index<capacity;index++)seats.push({id:'empty-'+index,kind:'empty',place:index<2?'기존 좌석 '+(index+1):'늘어난 자리 '+(index-1)});
    const shared=residents.length>=3,overflow=Math.max(0,residents.length-capacity);
    const placements={
      minji:'선반 왼쪽. 공구를 꺼낼 자리는 비워 둔다.',parkss:'선반 오른쪽. 식사를 마치면 깡통을 여기로 돌려놓는다.',
      jaeyi:shared?'재이 좌석 아래. 뚜껑을 열 때는 옆사람이 다리를 비켜 줘야 한다.':'자기 자리 곁. 상자가 통로로 조금 나와 있다.',
      kangwoo:'작업대 한쪽. 지도를 접으면 함께 쓸 자리가 난다.',leo:'잠자리 옆. 침구를 펴기 전에 악기를 안쪽으로 옮긴다.',
      eunsu:'작업대 안쪽. 기록을 덮으면 식사 그릇을 놓을 수 있다.'};
    return {stage,capacity,seats,fixedBunk:!!installed.bunk,overflow,
      objects:objects(state).filter(item=>item.kind==='companion')
        .map(item=>({...item,placement:placements[item.key.split(':')[1]]||''})),
      aisle:overflow?'새 좌석이 생긴 것은 아니다. 지금 탄 사람들은 기존 자리를 함께 나눠 쓰고 있다.'
        :party.includes('jaeyi')?(shared?'상자를 좌석 아래로 옮겨 통로를 비웠다. 꺼낼 때는 옆사람에게 자리를 부탁한다.'
          :'통로에 조금 나온 상자를 지날 때 몸을 돌린다.'):'접어 둔 침구와 짐을 안쪽에 두고 뒷문으로 나가는 길을 비워 둔다.'};
  }
  function moment(state={}){
    const home=state.household,record=state.life;
    if(!home||home.ended||record?.revision!=='home-life-v1'||!Number.isFinite(record.day)||!Number.isFinite(record.night))return null;
    const same=(a,b)=>Array.isArray(a)&&JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
    const current=[...(state.party||[]),...(state.visitors||[]).map(person=>person.id)];
    if(!same(record.party,state.party||[])||!same(record.participants,current))return null;
    const elapsed=home.day-record.day;
    const phase=elapsed>=0&&elapsed<=1&&home.meal&&home.night===record.night?'after'
      :elapsed>=0&&elapsed<=1&&home.night===record.night+1&&home.min>=390&&home.min<=720?'morning':null;
    const turns=phase&&record[phase];
    if(!Array.isArray(turns)||!turns.length||turns.some(turn=>!turn||typeof turn.text!=='string'||
      (turn.who&&turn.who!=='me'&&!current.includes(turn.who))))return null;
    return {phase,turns};
  }
  function objects(state={}){
    const present=new Set(state.party||[]),memory=state.memories||{},keepsakes=state.keepsakes||{},rows=[];
    for(const [id,[zone,shape]] of Object.entries(companions)){
      const prop=keepsakes[id],saved=memory[id],home=saved&&typeof saved.home==='string'?saved.home.trim():'';
      if(!prop||!prop.name)continue;
      if(present.has(id))rows.push({key:'companion:'+id,zone,shape,name:prop.name,desc:prop.desc||'',memory:home,kind:'companion',status:'지금 함께 쓰는 물건'});
      else if(home){
        const visitor=state.visitors?.find(person=>person.id===id);
        // A visitor has not earned the permanent keepsake. Their saved words
        // are a shared memory, and a current visitor has not left the caravan.
        const guestMemory=!!visitor||Number(saved.pendingBond)>0||
          (id==='minji'&&saved.voice==='minji-guest-v1'&&saved.pendingBond==null);
        rows.push({key:'memory:'+id,zone:'table',shape:'record',
          name:guestMemory?(state.sharedMemoryTitles?.[id]||'함께 나눈 시간'):prop.name+'에 남긴 기억',desc:'',memory:home,kind:'memory',
          status:visitor?'지금 함께 머무는 사람과의 기억':guestMemory?'잠시 함께했던 시간':'떠난 동료가 남긴 기억'});
      }
    }
    for(const definition of state.upgrades||[]){
      const place=upgrades[definition.id];
      if(!place||!state.up||!state.up[definition.id])continue;
      rows.push({key:'upgrade:'+definition.id,zone:place[0],shape:place[1],name:definition.nm,desc:definition.d||'',memory:'',kind:'upgrade',status:'장착한 생활 부품'});
    }
    return rows;
  }
  function livingHtml(state={}){
    const model=layout(state);if(!model)return '';
    const home=state.household,night=home.min<360||home.min>=1020,occupied=model.seats.filter(seat=>seat.kind!=='empty').length;
    const seatHtml=mode=>model.seats.map(seat=>`<article class="home-seat${seat.kind==='empty'?' is-empty':''}${seat.kind==='guest'?' is-guest':''}"${seat.kind==='empty'?'':` data-home-resident="${escape(seat.id)}"`}>
      ${seat.portrait?`<img src="${escape(seat.portrait)}" alt="" width="36" height="36">`:''}
      <div><small>${escape(mode==='sleep'?'함께 쉬는 자리':seat.place)}</small><strong>${seat.kind==='empty'?'아직 비어 있는 자리':escape(seat.name)}</strong>
      <span>${seat.kind==='guest'?'임시 동행':seat.kind==='empty'?'아직 함께 탈 사람이 없다':mode==='sleep'?'침구를 펴 함께 쉬는 자리':'함께 타는 동료'}</span></div></article>`).join('');
    const memory=moment(state),control=state.mealControl;
    return `<section class="home-household" aria-label="함께 쓰는 자리">
      <div class="home-household-head"><b>${escape(model.stage.nm)}${model.stage.cm?` · +${model.stage.cm}cm`:''}</b><span>동료 자리 ${occupied}/${model.capacity}</span></div>
      <div class="home-use-modes" role="group" aria-label="같은 공간의 낮과 밤"><button type="button" data-home-mode="day" aria-pressed="${!night}">이동할 때</button><button type="button" data-home-mode="sleep" aria-pressed="${night}">잠자리를 펴면</button></div>
      <div data-home-layout-view="day" ${night?'hidden':''}><p class="home-driver">${escape(home.driver)} · 앞 운전석</p><div class="home-seat-grid">${seatHtml('day')}</div></div>
      <div data-home-layout-view="sleep" ${night?'':'hidden'}><p class="home-driver">${escape(home.driver)} · 앞좌석에서 쉰다</p><div class="home-seat-grid is-sleeping">${seatHtml('sleep')}</div>
        <p class="home-place-note">${model.fixedBunk?'고정식 2층 침상과 접어 쓰는 자리를 나눠 쓴다.':'고정 침상은 아직 없다. 기존 접이식 자리와 침구를 나눠 쓴다.'} 침구를 펴면 통로가 좁아져, 뒷문으로 나가기 전에 치워야 한다.</p></div>
      <p class="home-aisle">${escape(model.aisle)}${home.dog?' 보리의 자리도 밟지 않게 비워 둔다.':''}</p>
      ${model.objects.length?`<details class="home-shared-objects"><summary>물건과 자리를 함께 쓰는 법</summary>${model.objects.map(item=>`<button type="button" data-home-placement="${escape(item.key)}" aria-pressed="false"><strong>${escape(item.name)}</strong><span>${escape(item.placement)}</span></button>`).join('')}</details>`:''}
      ${memory?`<section class="home-meal-memory" data-home-moment="${memory.phase}" tabindex="-1" aria-label="${memory.phase==='morning'?'아침에도 남은 자리':'한 끼를 먹고'}"><h3>${memory.phase==='morning'?'아침에도 남은 자리':'한 끼를 먹고'}</h3>${memory.turns.map(turn=>turn.who?`<p class="home-living-line"><b>${escape(turn.who==='me'?home.driver:home.people[turn.who]?.name||'')}</b><span>${escape(turn.text)}</span></p>`:`<p>${escape(turn.text)}</p>`).join('')}</section>`:''}
      ${control&&!home.ended?`<button type="button" class="home-meal-action" data-camp-prep="meal" ${control.enabled?'':'disabled'}><strong>${control.done?'따뜻한 한 끼 · 준비 완료':'함께 한 끼 준비'}</strong><span>${escape(control.reason||'식량 1 · 물 1 사용')}</span></button>`:''}
    </section>`;
  }
  function html(state={}){
    const items=objects(state),active=zones.find(([id])=>items.some(item=>item.zone===id))?.[0]||'shelf';
    const owned=new Set(items.map(item=>item.key));
    const art={bench:'bench',cabin:'bench',bunk:'bunk',stove:'stove',kitchen:'kitchen',curtain:'curtain',fridge:'fridge'};
    const placed=state.scene?items.filter(item=>item.kind==='companion'||(item.kind==='upgrade'&&art[item.key.split(':')[1]]))
      .filter(item=>!(['upgrade:bench','upgrade:cabin'].includes(item.key)&&owned.has('upgrade:bunk')))
      .filter(item=>!(item.key==='upgrade:bench'&&owned.has('upgrade:cabin'))):[];
    const description='등이 켜진 달구지 안'+(placed.length?' · '+placed.map(item=>item.name).join(', '):' · 아직 놓인 물건이 없다');
    return `<section class="camp-home-section home-room" aria-label="달구지 생활 공간">
      <div class="camp-section-head"><b>살아온 차 안</b><small>함께 쓰는 물건, 함께 남긴 기억.</small></div>
      <div class="home-space${items.length?'':' is-empty'}">
        <div class="home-room-view" role="img" aria-label="${escape(description)}">
          ${state.scene?`<img class="home-shell" src="${escape(state.scene)}" alt="" width="1024" height="576"><span class="home-lantern-glow" aria-hidden="true"></span>`:'<div class="home-shell home-shell-empty" aria-hidden="true"></div>'}
          ${placed.map(item=>`<span class="home-prop home-prop-${item.kind==='companion'?item.shape:art[item.key.split(':')[1]]}" data-home-prop="${escape(item.key)}" aria-hidden="true"></span>`).join('')}
        </div>
        ${livingHtml(state)}
        <div class="home-zone-nav" role="group" aria-label="차 안 구역">${zones.map(([id,label])=>`<button type="button" data-home-zone="${id}" aria-pressed="${id===active}" aria-label="${label} · ${items.filter(item=>item.zone===id).length}개 물건">${label}${items.some(item=>item.zone===id)?'<i aria-hidden="true"></i>':''}</button>`).join('')}</div>
        ${zones.map(([id,label])=>{
          const placed=items.filter(item=>item.zone===id);
          return `<section class="home-zone" data-home-panel="${id}" aria-label="${label}" ${id===active?'':'hidden'}>
            <div class="home-zone-objects">${placed.map(item=>`<button type="button" class="home-object home-object-${item.shape}${item.kind==='memory'?' is-memory':''}" data-home-object="${escape(item.key)}" aria-label="${escape(item.name)} · ${escape(item.status)}" aria-pressed="false"><span>${escape(item.name)}</span><small>${item.kind==='memory'?'남긴 기억':item.kind==='upgrade'?'장착한 부품':'함께 쓰는 물건'}</small></button>`).join('')}</div>
            ${placed.length?`<p class="home-zone-hint">물건을 눌러 살펴보기${placed.length>2?' · 옆으로 넘길 수 있어요':''}</p>`:`<p class="home-empty">${items.length?'아직 이곳에 놓아 둔 물건이 없다.':'아직 함께 놓아 둔 물건이 없다.'}</p>`}
          </section>`;
        }).join('')}
      </div>
      <div class="home-inspection" role="status" aria-live="polite" aria-atomic="true" hidden></div>
    </section>`;
  }
  function wire(container,state={}){
    if(!container)return ()=>{};
    const items=new Map(objects(state).map(item=>[item.key,item]));
    const buttons=[...container.querySelectorAll('[data-home-object]'),...container.querySelectorAll('[data-home-placement]')];
    const detail=container.querySelector('.home-inspection');
    const zoneButtons=Array.from(container.querySelectorAll('[data-home-zone]'));
    const panels=Array.from(container.querySelectorAll('[data-home-panel]'));
    const modes=Array.from(container.querySelectorAll('[data-home-mode]'));
    const layouts=Array.from(container.querySelectorAll('[data-home-layout-view]'));
    const bindings=[];
    let returnBinding=null;
    const releaseReturn=()=>{
      if(returnBinding&&returnBinding[0].onclick===returnBinding[1])returnBinding[0].onclick=null;
      returnBinding=null;
    };
    for(const button of modes){
      const handler=()=>{
        modes.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
        layouts.forEach(panel=>{panel.hidden=panel.dataset.homeLayoutView!==button.dataset.homeMode;});
        buttons.forEach(other=>other.setAttribute('aria-pressed','false'));
        container.querySelectorAll?.('[data-home-prop]').forEach(prop=>prop.classList.remove('is-inspected'));
        releaseReturn();if(detail){detail.hidden=true;detail.innerHTML='';}
      };
      button.onclick=handler;bindings.push([button,handler]);
    }
    for(const button of zoneButtons){
      const handler=()=>{
        zoneButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
        panels.forEach(panel=>{panel.hidden=panel.dataset.homePanel!==button.dataset.homeZone;});
        buttons.forEach(other=>other.setAttribute('aria-pressed','false'));
        container.querySelectorAll?.('[data-home-prop]').forEach(prop=>prop.classList.remove('is-inspected'));
        releaseReturn();
        if(detail){detail.hidden=true;detail.innerHTML='';}
      };
      button.onclick=handler;bindings.push([button,handler]);
    }
    for(const button of buttons){
      const handler=()=>{
        const item=items.get(button.dataset.homeObject||button.dataset.homePlacement);if(!item||!detail)return;
        releaseReturn();
        detail.hidden=false;
        buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
        container.querySelectorAll?.('[data-home-prop]').forEach(prop=>prop.classList.toggle('is-inspected',prop.dataset.homeProp===item.key));
        if(item.key==='companion:minji'&&typeof SND!=='undefined')SND.sceneCue('tools');
        const placement=layout(state)?.objects.find(object=>object.key===item.key)?.placement;
        detail.innerHTML=`<small>${escape(item.status)}</small><strong>${escape(item.name)}</strong>${item.desc?`<p>${escape(item.desc)}</p>`:''}${placement?`<p>${escape(placement)}</p>`:''}${item.memory?`<blockquote>${escape(item.memory)}</blockquote>`:''}<button type="button" class="home-inspection-return" data-home-return>물건으로 돌아가기</button>`;
        const back=detail.querySelector?.('[data-home-return]');
        if(back){
          const returnToObject=()=>{detail.hidden=true;button.setAttribute('aria-pressed','false');container.querySelectorAll?.('[data-home-prop]').forEach(prop=>prop.classList.remove('is-inspected'));button.focus?.({preventScroll:true});button.scrollIntoView?.({block:'nearest'});};
          back.onclick=returnToObject;returnBinding=[back,returnToObject];
        }
        detail.setAttribute?.('tabindex','-1');
        detail.focus?.({preventScroll:true});
        detail.scrollIntoView?.({block:'nearest'});
      };
      button.onclick=handler;bindings.push([button,handler]);
    }
    // Re-wiring a surviving container replaces its handlers. An older cleanup
    // cannot remove handlers belonging to a newer snapshot of the camp state.
    return ()=>{
      [...bindings,...(returnBinding?[returnBinding]:[])].forEach(([button,handler])=>{if(button.onclick===handler)button.onclick=null;});
    };
  }
  return {html,wire,state,layout,moment};
})();
