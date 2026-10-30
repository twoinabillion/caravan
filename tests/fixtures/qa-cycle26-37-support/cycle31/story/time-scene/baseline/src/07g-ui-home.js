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
  function objects(state={}){
    const present=new Set(state.party||[]),memory=state.memories||{},keepsakes=state.keepsakes||{},rows=[];
    for(const [id,[zone,shape]] of Object.entries(companions)){
      const prop=keepsakes[id],saved=memory[id],home=saved&&typeof saved.home==='string'?saved.home.trim():'';
      if(!prop||!prop.name)continue;
      if(present.has(id))rows.push({key:'companion:'+id,zone,shape,name:prop.name,desc:prop.desc||'',memory:home,kind:'companion',status:'지금 함께 쓰는 물건'});
      else if(home)rows.push({key:'memory:'+id,zone:'table',shape:'record',name:prop.name+'에 남긴 기억',desc:'',memory:home,kind:'memory',status:'떠난 동료가 남긴 기억'});
    }
    for(const definition of state.upgrades||[]){
      const place=upgrades[definition.id];
      if(!place||!state.up||!state.up[definition.id])continue;
      rows.push({key:'upgrade:'+definition.id,zone:place[0],shape:place[1],name:definition.nm,desc:definition.d||'',memory:'',kind:'upgrade',status:'장착한 생활 부품'});
    }
    return rows;
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
          ${state.scene?`<img class="home-shell" src="${escape(state.scene)}" alt="" width="1024" height="576">`:'<div class="home-shell home-shell-empty" aria-hidden="true"></div>'}
          ${placed.map(item=>`<span class="home-prop home-prop-${item.kind==='companion'?item.shape:art[item.key.split(':')[1]]}" data-home-prop="${escape(item.key)}" aria-hidden="true"></span>`).join('')}
        </div>
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
    const buttons=Array.from(container.querySelectorAll('[data-home-object]'));
    const detail=container.querySelector('.home-inspection');
    const zoneButtons=Array.from(container.querySelectorAll('[data-home-zone]'));
    const panels=Array.from(container.querySelectorAll('[data-home-panel]'));
    const bindings=[];
    let returnBinding=null;
    const releaseReturn=()=>{
      if(returnBinding&&returnBinding[0].onclick===returnBinding[1])returnBinding[0].onclick=null;
      returnBinding=null;
    };
    for(const button of zoneButtons){
      const handler=()=>{
        zoneButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
        panels.forEach(panel=>{panel.hidden=panel.dataset.homePanel!==button.dataset.homeZone;});
        buttons.forEach(other=>other.setAttribute('aria-pressed','false'));
        releaseReturn();
        if(detail){detail.hidden=true;detail.innerHTML='';}
      };
      button.onclick=handler;bindings.push([button,handler]);
    }
    for(const button of buttons){
      const handler=()=>{
        const item=items.get(button.dataset.homeObject);if(!item||!detail)return;
        releaseReturn();
        detail.hidden=false;
        buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
        detail.innerHTML=`<small>${escape(item.status)}</small><strong>${escape(item.name)}</strong>${item.desc?`<p>${escape(item.desc)}</p>`:''}${item.memory?`<blockquote>${escape(item.memory)}</blockquote>`:''}<button type="button" class="home-inspection-return" data-home-return>물건으로 돌아가기</button>`;
        const back=detail.querySelector?.('[data-home-return]');
        if(back){
          const returnToObject=()=>{detail.hidden=true;button.setAttribute('aria-pressed','false');button.focus?.({preventScroll:true});button.scrollIntoView?.({block:'nearest'});};
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
  return {html,wire};
})();
