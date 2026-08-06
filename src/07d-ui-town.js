/* ═══ UI 4/5 — 정착지·거래·차고·NPC·상태·일지·엔딩 + UI 공개 표면 ═══ */
  /* ── SETTLEMENT ── */
  let curStl=null, chatNpc=null, stlQuests=null, garageGroup='fuel', stlFieldResult=null,
    stlMode='hub', stlFocus='market', stlFieldFocus='';
  function settlementScene(stlId,mode='section'){
    const sid=stlId==='miryang'&&mode==='hub'?'miryang-market-hub':D.nodeScenes&&D.nodeScenes[stlId];
    return sid&&D.scenes&&D.scenes[sid]?D.scenes[sid]:'';
  }
  function settlementSpots(stlId){
    const spots={
      market:{label:stlId==='muju'?'교환소':stlId==='daejeon'?'보급소':'장터',
        sub:'의뢰와 물자를 살핀다',icon:'food'},
      garage:{label:'정비소',sub:'달구지를 고치고 넓힌다',icon:'parts'},
      people:{label:stlId==='daejeon'?'사람들':'모닥불',
        sub:'얼굴을 보고 이야기를 나눈다',icon:'bond'}
    };
    const field=D.stls[stlId]&&D.stls[stlId].field;
    if(field) spots.alley={label:field.spotLabel||'현장 안쪽',sub:field.spotSub||'동료와 직접 둘러본다',icon:'quest'};
    return spots;
  }
  function settlementCompanion(){
    const id=(S.party||[]).find(pid=>D.comps&&D.comps[pid]);
    return id?{id,...D.comps[id]}:null;
  }
  function settlementPortrait(id,cls,alt){
    const src=D.portraits&&D.portraits[id];
    return src?`<img class="${cls}" src="${src}" alt="${esc(alt)}" decoding="async">`:'';
  }
  function settlementWalkCopy(focus){
    const stl=D.stls[curStl], spot=settlementSpots(curStl)[focus], comp=settlementCompanion();
    const local=stl.walk&&stl.walk[focus]||spot.sub;
    const line=comp&&D.settlementCompanionLines&&D.settlementCompanionLines[comp.id]
      ?D.settlementCompanionLines[comp.id][focus]:local;
    return {
      title:comp?`${comp.name}와 ${spot.label}${spot.label==='사람들'?'을':'로'} 걷는 중`:`${spot.label}${spot.label==='사람들'?'을':'로'} 걷는 중`,
      line:line||local,
      local
    };
  }
  function settlementPartyMarkerHtml(comp){
    if(curStl==='miryang'){
      const names=[G.myName(),comp&&comp.name].filter(Boolean).join(' · ');
      const hiddenFaces=[settlementPortrait('me','stl-walker-face me',`${G.myName()} 초상`)];
      if(comp) hiddenFaces.push(settlementPortrait(comp.id,'stl-walker-face companion',`${comp.name} 초상`));
      return `<div class="stl-walk-party stl-party-placard" role="img" aria-label="${esc(names)}이 밀양 장터를 함께 걷는다">
        <span class="stl-marker-a11y" aria-hidden="true">${hiddenFaces.filter(Boolean).join('')}</span>
        <i aria-hidden="true"></i><span><b>우리 일행</b><small>${esc(names)}</small></span>
      </div>`;
    }
    const faces=[settlementPortrait('me','stl-walker-face me',`${G.myName()} 초상`)];
    if(comp) faces.push(settlementPortrait(comp.id,'stl-walker-face companion',`${comp.name} 초상`));
    return `<div class="stl-walk-party" role="img" aria-label="${esc(comp?`${G.myName()}와 ${comp.name}이 정착지를 함께 걷는다`:`${G.myName()}이 정착지를 걷는다`)}">
      ${faces.filter(Boolean).join('')}
    </div>`;
  }
  function settlementCrowdHtml(stl){
    if(curStl==='miryang') return '';
    const ids=[...(stl.npcs||[]).slice(0,1),'passer_merchant','passer_worker','passer_child'];
    return `<div class="stl-crowd" aria-hidden="true">${ids.map((id,i)=>
      settlementPortrait(id,`stl-crowd-face crowd-${i+1}`,'')).filter(Boolean).join('')}</div>`;
  }
  function settlementImpactCopy(stlId){
    const stl=D.stls[stlId], impact=G.stlImpact(stlId), last=impact.last;
    if(!impact.count) return {impact,title:'아직 낯선 곳',line:'안쪽 일을 거들면 풍경과 사람들의 반응이 달라진다.'};
    const complete=impact.stage===3;
    return {
      impact,
      title:complete?'우리 손을 기억하는 곳':`우리 손길 ${impact.count}/${impact.total}`,
      line:last&&last.change?last.change.after:`${stl.name}에 우리가 거든 일이 남아 있다.`
    };
  }
  function settlementImpactLayerHtml(copy){
    const visual=copy.impact.last&&copy.impact.last.change&&copy.impact.last.change.visual||'work';
    return `<div class="stl-impact-layer stage-${copy.impact.stage} visual-${esc(visual)}" aria-hidden="true">
      <i class="stl-impact-mark mark-1"></i><i class="stl-impact-mark mark-2"></i><i class="stl-impact-mark mark-3"></i>
      <i class="stl-impact-motion motion-1"></i><i class="stl-impact-motion motion-2"></i>
    </div>`;
  }
  function settlementSectionPartyHtml(focus){
    const comp=settlementCompanion(), copy=settlementWalkCopy(focus);
    return `<div class="stl-section-party">
      <span class="stl-section-faces">
        ${settlementPortrait('me','stl-section-face me',`${G.myName()} 초상`)}
        ${comp?settlementPortrait(comp.id,'stl-section-face companion',`${comp.name} 초상`):''}
      </span>
      <span><b>${esc(copy.title.replace('걷는 중','도착'))}</b><small>${esc(copy.local)}</small></span>
    </div>`;
  }
  function updateSettlementFocus(next){
    const spots=settlementSpots(curStl), night=G.isNight();
    if(!spots[next]||(night&&next!=='people')) return;
    stlFocus=next;
    const hub=$('#stl-body .stl-hub');
    if(!hub) return;
    const focus=spots[next], copy=settlementWalkCopy(next);
    hub.dataset.focus=next;
    hub.querySelectorAll('[data-stlfocus]').forEach(b=>{
      const selected=b.dataset.stlfocus===next;
      b.classList.toggle('selected',selected);
      b.setAttribute('aria-pressed',String(selected));
    });
    const route=hub.querySelector('.stl-route');
    if(route) route.className=`stl-route ${next}`;
    const title=hub.querySelector('[data-stl-walk-title]');
    const line=hub.querySelector('[data-stl-walk-line]');
    if(title) title.textContent=copy.title;
    if(line) line.textContent=copy.line;
    const enter=hub.querySelector('#stl-enter');
    if(enter) enter.innerHTML=`${ICO(focus.icon)}<span>${focus.label}${focus.label==='사람들'?'을':'로'} 들어간다</span>`;
    hub.classList.remove('is-walking');
    requestAnimationFrame(()=>{
      hub.classList.add('is-walking');
      setTimeout(()=>hub.classList.remove('is-walking'),420);
    });
  }
  function leaveSettlement(){
    closeOvl('#ovl-stl');
    renderAll();
  }
  function settlementHeader(section){
    const stl=D.stls[curStl];
    $('#stl-name').innerHTML=`${section?`<button class="stl-back" id="stl-back" aria-label="${esc(stl.name)} 공간으로 돌아가기">‹</button>`:''}
      <span>${esc(stl.name)}</span>
      <button class="x" id="stl-leave" aria-label="${esc(stl.name)} 닫기">✕</button>`;
    $('#stl-desc').textContent=section||stl.desc;
    $('#stl-leave').onclick=leaveSettlement;
    const back=$('#stl-back');
    if(back) back.onclick=()=>showStl(curStl,'hub');
  }
  function renderSettlementHub(){
    const stl=D.stls[curStl], body=$('#stl-body'), scene=settlementScene(curStl,'hub');
    const spots=settlementSpots(curStl), night=G.isNight(), comp=settlementCompanion();
    const impactCopy=settlementImpactCopy(curStl), impact=impactCopy.impact;
    AMBI.settlement(night?'people':'hub',curStl);
    if(!spots[stlFocus]) stlFocus='market';
    if(night&&stlFocus!=='people') stlFocus='people';
    const focus=spots[stlFocus]||spots.market;
    const walkCopy=settlementWalkCopy(stlFocus);
    settlementHeader('');
    $('#ovl-stl').classList.add('hub-mode');
    body.innerHTML=`<div class="stl-hub stl-hub-${curStl}" data-focus="${stlFocus}" data-impact-stage="${impact.stage}" ${scene?`style="--stl-scene:url('${scene}')"`:''}>
      <div class="stl-hub-art" role="img" aria-label="${esc(stl.name)} 풍경"></div>
      ${settlementImpactLayerHtml(impactCopy)}
      <div class="stl-hub-place"><b>${esc(stl.name)}</b><small>${night?'장은 잠들었지만 모닥불은 아직 켜져 있다.':esc(stl.desc)}</small>
        <span class="stl-place-impact ${impact.count?'changed':''}"><i>${impact.count?'현장 변화':'첫 방문'}</i>${esc(impactCopy.title)} · ${esc(impactCopy.line)}</span></div>
      ${settlementCrowdHtml(stl)}
      <div class="stl-hotspots" aria-label="${esc(stl.name)}에서 갈 곳">
        ${Object.entries(spots).map(([id,spot],index)=>{
          const closed=night&&id!=='people';
          return `<button class="stl-hotspot ${id} ${stlFocus===id?'selected':''}" data-stlfocus="${id}"
            aria-pressed="${stlFocus===id}" ${closed?'disabled':''}>
            ${curStl==='miryang'?`<span class="stl-hotspot-index">${String(index+1).padStart(2,'0')}</span>`:`<span class="stl-hotspot-icon">${ICO(spot.icon)}</span>`}
            <span><b>${spot.label}</b><small>${closed?'아침 06:00에 연다':id==='alley'&&impact.count?`현장 변화 ${impact.count}/${impact.total}`:spot.sub}</small></span>
          </button>`;
        }).join('')}
      </div>
      ${settlementPartyMarkerHtml(comp)}
      <div class="stl-van-wrap"><canvas id="stl-van" aria-label="현재 개조 상태의 달구지"></canvas><span>우리 달구지</span></div>
      <div class="stl-route ${stlFocus}" aria-hidden="true"></div>
      <div class="stl-hub-dock">
        <div class="stl-resource-strip" aria-label="현재 자원">
          <span>${ICO('fuel')}<b>${Math.floor(S.fuel)}</b><small>연료</small></span>
          <span>${ICO('water')}<b>${Math.floor(S.water)}</b><small>물</small></span>
          <span>${ICO('food')}<b>${Math.floor(S.food)}</b><small>식량</small></span>
          <span>${ICO('scrap')}<b>${S.scrap}</b><small>고철</small></span>
          <span>${ICO('parts')}<b>${S.items['부품']||0}</b><small>부품</small></span>
        </div>
        <div class="stl-focus-copy">
          ${settlementPortrait(comp?comp.id:'me','stl-focus-face',`${comp?comp.name:G.myName()} 초상`)}
          <span><b data-stl-walk-title>${esc(walkCopy.title)}</b><small data-stl-walk-line>${esc(night?'오늘은 쉬고 아침에 움직이자.':walkCopy.line)}</small></span>
        </div>
        <button class="stl-enter" id="stl-enter">${ICO(focus.icon)}<span>${focus.label}${focus.label==='사람들'?'을':'로'} 들어간다</span></button>
        <button class="stl-return" id="stl-out">${ICO('van')} 달구지로 돌아간다</button>
      </div>
    </div>`;
    body.querySelectorAll('[data-stlfocus]').forEach(b=>b.onclick=()=>updateSettlementFocus(b.dataset.stlfocus));
    $('#stl-enter').onclick=()=>showStl(curStl,stlFocus);
    $('#stl-out').onclick=leaveSettlement;
    if(!$('#ovl-stl').classList.contains('on')) openModal('#ovl-stl','[data-stlfocus], #stl-enter');
    else $('#ovl-stl').setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>{ if(SCENE.drawSettlementVan) SCENE.drawSettlementVan($('#stl-van')); });
  }
  function questBoardHtml(){
    let h='';
    if(S.quest){
      const q=S.quest, K=G.QKIND[q.kind]||G.QKIND.deliver;
      if(G.questReady()){
        h+=`<div class="dlg"><div class="say"><span class="spk">${K.ic} ${K.nm} 의뢰</span> ${G.questLabel(q)} — 준비됐다.</div>
          <div class="choices"><button class="choice" id="q-turnin">전달한다 <span class="req">고철 +${q.reward}</span></button></div></div>`;
      } else {
        const detail = q.kind==='procure'
          ? `${q.need.name} ${(S.items[q.need.name]||0)}/${q.need.qty} 모음 · <b>${D.nodes[q.to].name}</b>으로`
          : `${G.questLabel(q)} → <b>${D.nodes[q.to].name}</b>`;
        h+=`<div class="dlg"><div class="say"><span class="spk">${K.ic} ${K.nm} 진행 중</span> ${detail} <small style="color:var(--faded)">(사례 고철 ${q.reward} · D-${Math.max(0,q.due-S.day)})</small></div></div>`;
      }
    } else {
      const qs=G.rollQuests();
      if(qs.length){ stlQuests=qs;
        h+=`<div class="dlg"><div class="say stl-kicker"><span class="spk">게시판</span> <small>의뢰는 한 번에 하나만 맡는다</small></div><div class="choices">`;
        qs.forEach((q,i)=>{ const K=G.QKIND[q.kind], dd=q.due-S.day;
          h+=`<button class="choice" data-quest="${i}">${K.ic} <b>${K.nm}</b> — ${G.questDesc(q)} <span class="req"><span style="color:${dd<=2?'var(--amber)':'inherit'}">D-${dd}</span> · 고철 ${q.reward}</span></button>`; });
        h+=`</div></div>`;
      }
    }
    return h;
  }
  function settlementFieldHtml(stl){
    const field=stl.field;
    if(!field) return '';
    const actions=field.actions.filter(a=>!G.stlFieldStatus(curStl,a).hiddenLocked);
    const result=stlFieldResult&&stlFieldResult.stl===curStl?stlFieldResult:null;
    if(result&&actions.some(a=>a.id===result.action.id)) stlFieldFocus=result.action.id;
    if(!actions.some(a=>a.id===stlFieldFocus)) stlFieldFocus=actions[0]&&actions[0].id||'';
    const focusIndex=Math.max(0,actions.findIndex(a=>a.id===stlFieldFocus));
    const focusAction=actions[focusIndex], done=actions.filter(a=>G.stlFieldStatus(curStl,a).done).length;
    const comp=settlementCompanion(), impactCopy=settlementImpactCopy(curStl), impact=impactCopy.impact;
    const illustrated=curStl==='miryang', illustratedScene=illustrated?settlementScene(curStl,'hub'):'';
    let h=`<div class="stl-field-intro ${illustrated?'miryang-field-intro':''} ${impact.count?'changed':''}"><span>${illustrated?'<i>FIELD</i>':ICO('quest')}</span><span><b>${esc(field.title)}</b><small>${esc(field.desc)}</small>
      <em>${impact.count?`현장 변화 ${impact.count}/${impact.total} · ${esc(impactCopy.line)}`:'아직 우리가 바꾼 것은 없다'}</em></span></div>`;
    if(actions.length){
      const pos=actions.length===1?50:Math.round(focusIndex/(actions.length-1)*100);
      if(illustrated){
        h+=`<section class="stl-field-map stl-field-illustrated" data-focus="${stlFieldFocus}" style="--field-pos:${pos}%;--field-scene:url('${illustratedScene}')" aria-label="${esc(field.title)} 실제 장터 배치">
          <div class="stl-field-map-head"><b>밀양 닷새장 · 현장 동선</b><span>${done}/${actions.length}곳 완료</span></div>
          <div class="stl-field-scene" role="img" aria-label="국수 좌판, 부품 천막, 공동 펌프와 모닥불이 있는 밀양 장터">
            ${actions.map((action,index)=>{ const status=G.stlFieldStatus(curStl,action);
              return `<button class="stl-field-scene-spot spot-${action.id} ${status.done?'done':''} ${action.id===stlFieldFocus?'selected':''}"
                data-fieldspot="${action.id}" aria-pressed="${action.id===stlFieldFocus}">
                <i>${status.done?'✓':String(index+1).padStart(2,'0')}</i><span>${esc(action.label)}</span></button>`;
            }).join('')}
            <div class="stl-field-map-party stl-field-scene-party" aria-hidden="true">
              <span class="stl-marker-a11y">${settlementPortrait('me','stl-field-map-face me','')}${comp?settlementPortrait(comp.id,'stl-field-map-face companion',''):''}</span>
              <i></i><span>${esc(comp?`${G.myName()} · ${comp.name}`:G.myName())}</span>
            </div>
          </div>
          <div class="stl-field-switcher" role="group" aria-label="현장 행동 선택">
            ${actions.map((action,index)=>{ const status=G.stlFieldStatus(curStl,action);
              return `<button data-fieldspot="${action.id}" class="${action.id===stlFieldFocus?'selected':''}" aria-pressed="${action.id===stlFieldFocus}">
                <i>${status.done?'✓':String(index+1).padStart(2,'0')}</i><span>${esc(action.label)}</span></button>`;
            }).join('')}
          </div>
          <div class="stl-field-focus-copy" data-field-focus-copy><b>${esc(focusAction.label)}</b><span>${esc(G.stlFieldStatus(curStl,focusAction).changed&&focusAction.change?focusAction.change.after:focusAction.desc)}</span></div>
        </section>`;
      } else h+=`<section class="stl-field-map" style="--field-pos:${pos}%" aria-label="${esc(field.title)} 현장 동선">
        <div class="stl-field-map-head"><b>현장 동선</b><span>${done}/${actions.length}곳 확인</span></div>
        <div class="stl-field-path"><i class="stl-field-rail" aria-hidden="true"></i>
          <div class="stl-field-map-party" aria-hidden="true">
            ${settlementPortrait('me','stl-field-map-face me','')}${comp?settlementPortrait(comp.id,'stl-field-map-face companion',''):''}
          </div>
          ${actions.map((action,index)=>{ const status=G.stlFieldStatus(curStl,action);
            return `<button class="stl-field-spot ${status.done?'done':''} ${action.id===stlFieldFocus?'selected':''}"
              style="--spot-pos:${actions.length===1?50:Math.round(index/(actions.length-1)*100)}%"
              data-fieldspot="${action.id}" aria-pressed="${action.id===stlFieldFocus}">
              <i>${status.done?'✓':index+1}</i><span>${esc(action.label)}</span></button>`;
          }).join('')}
        </div>
        <div class="stl-field-focus-copy" data-field-focus-copy><b>${esc(focusAction.label)}</b><span>${esc(G.stlFieldStatus(curStl,focusAction).changed&&focusAction.change?focusAction.change.after:focusAction.desc)}</span></div>
      </section>`;
    }
    if(result){
      const person=speakerInfo(result.action.npc);
      h+=`<div class="stl-field-result" data-field-result>
        ${settlementPortrait(person.id,'stl-field-face',`${person.name} 초상`)}
        <span><small>${esc(person.name)} · ${esc(result.action.label)}</small><p>${esc(result.action.result)}</p>
        ${result.chips&&result.chips.length?`<span class="stl-field-chips">${result.chips.map(c=>`<i class="${c.c||''}">${esc(c.t)}</i>`).join('')}</span>`:''}</span>
      </div>`;
      if(result.firstImpact&&result.action.change){
        h+=`<div class="stl-change-reveal" aria-live="polite">
          <span><small>작업 전</small><b>${esc(result.action.desc)}</b></span><i aria-hidden="true">→</i>
          <span><small>지금</small><b>${esc(result.action.change.after)}</b></span>
        </div>`;
      }
    }
    h+=`<div class="stl-field-list ${illustrated?'miryang-field-list':''}">${actions.map((action,index)=>{
      const status=G.stlFieldStatus(curStl,action), person=speakerInfo(action.npc);
      const cost=G.reqCostText(action.req), cadence=action.once?'여행 중 1회':'하루 1회';
      return `<button class="stl-field-action ${action.id===stlFieldFocus?'focused':''} ${status.changed?'changed':''}" data-stlfield="${action.id}" data-fieldcard="${action.id}" ${status.ok?'':'disabled'}>
        ${illustrated?`<span class="stl-field-card-index">${status.done?'✓':String(index+1).padStart(2,'0')}</span>`:settlementPortrait(person.id,'stl-field-face',`${person.name} 초상`)}
        <span><b>${esc(action.label)}</b><small>${esc(action.desc)}</small>
          <span class="stl-field-meta"><i>${action.time}분</i><i>${cadence}</i>${cost?`<i>${esc(cost)}</i>`:''}</span></span>
        <em>${status.ok?esc(action.action):esc(status.reason)}</em>
      </button>`;
    }).join('')}</div>`;
    return h;
  }
  function updateSettlementFieldFocus(actionId,scroll=true){
    const field=D.stls[curStl]&&D.stls[curStl].field;
    const visible=field&&field.actions.filter(a=>!G.stlFieldStatus(curStl,a).hiddenLocked)||[];
    const index=visible.findIndex(a=>a.id===actionId);
    if(index<0) return;
    stlFieldFocus=actionId;
    const map=$('#stl-body .stl-field-map'), action=visible[index];
    if(map){
      map.style.setProperty('--field-pos',`${visible.length===1?50:Math.round(index/(visible.length-1)*100)}%`);
      map.dataset.focus=actionId;
      map.querySelectorAll('[data-fieldspot]').forEach(node=>{
        const selected=node.dataset.fieldspot===actionId;
        node.classList.toggle('selected',selected);
        node.setAttribute('aria-pressed',String(selected));
      });
      const copy=map.querySelector('[data-field-focus-copy]');
      const status=G.stlFieldStatus(curStl,action);
      if(copy) copy.innerHTML=`<b>${esc(action.label)}</b><span>${esc(status.changed&&action.change?action.change.after:action.desc)}</span>`;
    }
    document.querySelectorAll('#stl-body .stl-field-switcher [data-fieldspot]').forEach(node=>{
      const selected=node.dataset.fieldspot===actionId;
      node.classList.toggle('selected',selected);
      node.setAttribute('aria-pressed',String(selected));
    });
    const cards=[...document.querySelectorAll('#stl-body [data-fieldcard]')];
    cards.forEach(card=>card.classList.toggle('focused',card.dataset.fieldcard===actionId));
    const card=cards.find(node=>node.dataset.fieldcard===actionId);
    if(scroll&&card) card.scrollIntoView({behavior:document.documentElement.classList.contains('ui-reduce-motion')?'auto':'smooth',block:'nearest'});
  }
  function showStl(stlId,mode='hub'){
    curStl=stlId;
    stlMode=mode||'hub';
    const stl=D.stls[stlId];
    G.qualityMilestone('first_settlement_visit',{settlementId:stlId,mode:stlMode});
    AMBI.settlement(stlMode,stlId);
    if(!G.isNight()) G.checkQuest();   // 배달은 사람이 깨어 있을 때만
    if(stlMode==='hub'){ renderSettlementHub(); return; }
    if(G.isNight()&&stlMode!=='people'){ stlFocus='people'; renderSettlementHub(); return; }
    $('#ovl-stl').classList.remove('hub-mode');
    const body=$('#stl-body'), scene=settlementScene(curStl,stlMode==='alley'?'hub':'section'), spots=settlementSpots(curStl);
    settlementHeader(spots[stlMode]?spots[stlMode].label:'');
    const walkCopy=settlementWalkCopy(stlMode), impactCopy=settlementImpactCopy(curStl);
    const directField=curStl==='miryang'&&stlMode==='alley';
    let h=directField?'':`<div class="stl-section-hero" data-impact-stage="${impactCopy.impact.stage}" ${scene?`style="background-image:url('${scene}')"`:''}>
      ${settlementImpactLayerHtml(impactCopy)}
      ${settlementSectionPartyHtml(stlMode)}
      <span>${ICO((spots[stlMode]||spots.market).icon)}${(spots[stlMode]||spots.market).label}</span>
      <small>${esc(walkCopy.local)}</small>
    </div>`;
    if(stlMode==='market'){
      h+=questBoardHtml();
      h+=`<div class="dlg"><div class="say stl-kicker"><span class="spk">오늘의 거래</span>
        <small>보유 고철 <span id="tr-scrap">${S.scrap}</span></small></div><div id="trade"></div></div>`;
    } else if(stlMode==='garage'){
      h+=`<div class="dlg garage-shell"><div class="say stl-kicker"><span class="spk">달구지 작업대</span>
        <small>부품 ${S.items['부품']||0} · 실제 차체 상태를 보며 개조한다</small></div><div id="garage"></div></div>`;
    } else if(stlMode==='alley'){
      h+=settlementFieldHtml(stl);
    } else {
      if(G.isNight()){
        h+=`<div class="dlg night-talk"><div class="say"><span class="spk">늦은 밤</span>
          장터 셔터가 내려갔다. 모닥불 곁에는 잠들기 전 몇 사람의 낮은 목소리만 남았다.</div></div>`;
      }
      for(const nid of stl.npcs){
        const npc=D.npcs[nid], ns=S.npcs[nid];
        h+=`<button class="npc-row" data-npc="${nid}">
          <div class="npc-face">${npcFace(nid,npc.face)}</div>
          <span><b>${npc.name}</b><small>${npc.role}</small></span>
          <span class="npc-att">${ns.att>10?'우호적':ns.att<-10?'냉랭함':ns.met?'아는 사이':'초면'}</span></button>`;
      }
      if(stl.recruit && !G.hasComp(stl.recruit) && (!S.recruitQ||S.recruitQ.id===stl.recruit)
        && (!S.used.includes('kw_recruit')||(S.recruitQ&&S.recruitQ.id===stl.recruit))){
        const c=D.comps[stl.recruit];
        const rq=S.recruitQ&&S.recruitQ.id===stl.recruit?S.recruitQ:null;
        h+=`<button class="npc-row" data-recruit="${stl.recruit}">
          <div class="npc-face">${c.face}</div>
          <span><b>${c.name}</b><small>${c.bio}</small></span>
          <span class="npc-att">${rq?(rq.stage==='ready'?'합류 대화':rq.stage==='follow'?'마주할 일':rq.stage==='road'?'임시 동행':'부탁 진행 중'):'할 말 있음'}</span></button>`;
      }
      h+=`<div class="acts stl-rest-actions">
        <button class="act primary" id="stl-rest"><span>${ICO('bond')}</span><span><b>이곳에서 하룻밤 묵는다</b><small>아침까지 · 피로와 사기 회복 · 차 정비</small></span></button></div>`;
    }
    h+=`<button class="stl-section-back" id="stl-hub-back">이 장소를 나와 ${esc(stl.name)}을 다시 둘러본다</button>`;
    body.innerHTML=h;
    if(stlMode==='market'){
      renderTrade();
      body.querySelectorAll('[data-quest]').forEach(b=>b.onclick=()=>{ G.acceptQuest(stlQuests[+b.dataset.quest]); showStl(curStl,'market'); });
      const qt=body.querySelector('#q-turnin');
      if(qt) qt.onclick=()=>{ G.checkQuest(); showStl(curStl,'market'); };
    } else if(stlMode==='garage'){
      renderGarage();
    } else if(stlMode==='alley'){
      body.querySelectorAll('[data-fieldspot]').forEach(b=>b.onclick=()=>updateSettlementFieldFocus(b.dataset.fieldspot));
      body.querySelectorAll('[data-stlfield]').forEach(b=>b.onclick=()=>{
        const result=G.doStlFieldAction(curStl,b.dataset.stlfield);
        if(!result.ok){ toast(result.reason||'지금은 할 수 없다'); return; }
        stlFieldResult={stl:curStl,action:result.action,chips:result.chips,
          firstImpact:result.firstImpact,impactBefore:result.impactBefore,impactAfter:result.impactAfter};
        if(result.hiddenOpen) toast(`👣 ${D.stls[curStl].field.revealToast||'도움을 마치자 전에는 보이지 않던 곳이 열렸다'}`,'discover');
        showStl(curStl,'alley');
        requestAnimationFrame(()=>body.querySelector('[data-field-result]')?.scrollIntoView({block:'nearest'}));
      });
    } else {
      body.querySelectorAll('[data-npc]').forEach(b=>b.onclick=()=>talk(b.dataset.npc));
      const rec=body.querySelector('[data-recruit]');
      if(rec) rec.onclick=()=>recruitStl(stl.recruit);
      $('#stl-rest').onclick=()=>{
        AMBI.play('sfx_camp_loop',.32);
        closeOvl('#ovl-stl');
        G.camp('🏘 정착지에서 하룻밤을 묵었다');
      };
    }
    $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
    if(!$('#ovl-stl').classList.contains('on')) openModal('#ovl-stl','#stl-leave, button');
    else $('#ovl-stl').setAttribute('aria-hidden','false');
  }
  function renderTrade(){
    const stl=D.stls[curStl], tr=$('#trade');
    if(!tr) return;
    const localImpact=G.stlImpact(curStl), localDisc=localImpact.discount;
    const disc=G.tradeDiscount(curStl);
    const barterOnly=stl.trade.every(row=>row[1].startsWith('barter'));
    let h=localDisc<1?`<div class="trade-local-trust"><span>품앗이 ${barterOnly?'교환':'가격'}</span><b>현장 ${localImpact.count}곳을 거든 사람 · ${barterOnly?'교환품을 한 단계 후하게 쳐준다':'10% 덜 받는다'}</b></div>`:'';
    const waterRow=stl.trade.find(row=>row[1]==='water');
    const foodRow=stl.trade.find(row=>row[1]==='food');
    if(waterRow&&foodRow){
      const bundlePrice=Math.max(1,Math.round((waterRow[3]+foodRow[3]*2)*disc));
      h+=`<div class="trade-bundle"><span><b>길 위 기본 보급</b><small>물 ${waterRow[2]}통 + 식량 ${foodRow[2]*2}일치</small></span>
        <span class="tp">${ICO('scrap')}고철 ${bundlePrice}</span>
        <button class="tbtn" data-bundle="1" ${S.scrap<bundlePrice?'disabled':''}>한 번에 싣기</button></div>`;
    }
    let lastGroup='';
    stl.trade.forEach((row,i)=>{
      const [label,key,qty,price0]=row;
      const trustedLabel=localDisc<1&&key==='barter_wf'?'물 1통 ⇄ 식량 1':
        localDisc<1&&key==='barter_fp'?'식량 1 ⇄ 부품 1':
        localDisc<1&&key==='barter_mf'?'의약품 1 ⇄ 식량 4':label;
      const group=key.startsWith('barter')?'물물교환':key.startsWith('item')?'도구와 부품':'주행과 보급';
      if(group!==lastGroup){ h+=`<div class="trade-group-label">${group}</div>`; lastGroup=group; }
      const tico = key==='fuel'?ICO('fuel'): key==='water'?ICO('water'): key==='food'?ICO('food'):
        key.startsWith('item')?ICO(ITEM_ICO[key.slice(4)]||''):'';
      if(key.startsWith('barter')){
        h+=`<div class="trade-row"><span class="tn">${trustedLabel}</span><button class="tbtn" data-t="${i}">교환</button></div>`;
      } else {
        const price=Math.max(1,Math.round(price0*disc));
        h+=`<div class="trade-row"><span class="tn">${tico}${label}</span><span class="tp">${ICO('scrap')}고철 ${price}</span>
          <button class="tbtn" data-t="${i}" ${S.scrap<price?'disabled':''}>산다</button></div>`;
      }
    });
    tr.innerHTML=h;
    tr.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>buy(+b.dataset.t));
    const bundle=tr.querySelector('[data-bundle]');
    if(bundle) bundle.onclick=()=>{
      const r=G.tradeBundle(curStl);
      if(!r.ok){ if(r.why) toast(r.why); return; }
      $('#tr-scrap').textContent=S.scrap;
      toast(`📦 기본 보급을 실었다 · 물 +${r.water} · 식량 +${r.food}`);
      renderTrade(); renderHud();
    };
  }
  function buy(i){
    const r=G.trade(curStl,i);
    if(!r.ok){ if(r.why) toast(r.why); return; }
    $('#tr-scrap').textContent=S.scrap;
    renderTrade(); renderHud();
  }
  function playUpgradeInstall(u,before){
    const ovl=$('#ovl-stl');
    const group=(D.upgradeGroups||[]).find(x=>x.ids.includes(u.id))||D.upgradeGroups[0];
    const art=D.upgradeArt&&D.upgradeArt[group.id];
    const afterStage=G.vanStage(), afterCapacity=G.seatCapacity();
    const work=D.upgradeWork&&D.upgradeWork[group.id]||{
      phases:['분해','체결','시동 확인'],actions:['고정 볼트를 직접 푼다','새 부품을 체결한다','운전석에서 작동을 확인한다']};
    const adviserDef=D.upgradeAdvisers&&D.upgradeAdvisers[group.id];
    const adviser=adviserDef&&G.hasComp(adviserDef.id)&&!G.isInjured(adviserDef.id)
      ?{...adviserDef,...D.comps[adviserDef.id]}:null;
    AMBI.play('sfx_van_extension',u.seat ? 0.44 : 0.28);
    const physical=u.seat
      ? `<b>후미 증축 +${before.stage.cm}cm → +${afterStage.cm}cm</b><small>${before.stage.nm}에서 ${afterStage.nm} 단계로. 탑승 정원 ${before.capacity+1} → ${afterCapacity+1}명</small>`
      : u.id==='tank1'||u.id==='tank2'
        ? `<b>연료 용량 ${before.fuelMax}L → ${S.fuelMax}L</b><small>차체 옆 고정대와 연료 배관을 함께 증설했다.</small>`
        : u.id==='armor'
          ? `<b>최대 내구 ${before.vanMax} → ${S.vanMax}</b><small>하중이 몰리는 프레임부터 장갑판을 체결했다.</small>`
          : `<b>${esc(u.nm)} 장착</b><small>${esc(u.d)} · 작업 뒤 주행 점검까지 마쳤다.</small>`;
    const layer=el('div','upgrade-install',`<div class="upgrade-install-art" ${art?`style="background-image:url('${art}')"`:''}></div>
      <div class="upgrade-install-panel" role="dialog" aria-modal="true" aria-labelledby="upgrade-install-title">
        <div class="upgrade-install-head"><small>${esc(group.nm)} 작업</small><h3 id="upgrade-install-title">${esc(u.nm)}</h3></div>
        <div class="upgrade-compare">
          <figure><canvas id="up-before-van" aria-label="개조 전 달구지"></canvas><figcaption>개조 전</figcaption></figure>
          <span class="upgrade-arrow" aria-hidden="true">→</span>
          <figure><canvas id="up-after-van" aria-label="개조 후 달구지"></canvas><figcaption>개조 후</figcaption></figure>
        </div>
        <div class="upgrade-change">${physical}</div>
        ${adviser?`<div class="upgrade-adviser">${settlementPortrait(adviser.id,'upgrade-adviser-face',`${adviser.name} 초상`)}
          <span><b>${esc(adviser.name)}가 작업을 거든다</b><small>“${esc(adviser.line)}” · 유대 +1</small></span></div>`:''}
        <div class="upgrade-phases" aria-label="개조 작업 순서">
          ${work.phases.map((phase,i)=>`<span class="${i===0?'current':''}">${i+1} · ${esc(phase)}</span>`).join('')}
        </div>
        <button class="upgrade-step-action" id="upgrade-step-action">${esc(work.actions[0])}</button>
        <button class="upgrade-install-done" id="upgrade-install-done">달구지를 확인한다</button>
        <span class="sr-only" id="upgrade-step-live" aria-live="polite"></span>
      </div>`);
    layer._returnFocus=document.activeElement;
    ovl.appendChild(layer);
    requestAnimationFrame(()=>{
      if(SCENE.drawSettlementVan){
        SCENE.drawSettlementVan($('#up-before-van'),before.up);
        SCENE.drawSettlementVan($('#up-after-van'),S.up);
      }
    });
    const phases=[...layer.querySelectorAll('.upgrade-phases span')];
    const stepButton=layer.querySelector('#upgrade-step-action');
    const live=layer.querySelector('#upgrade-step-live');
    const stepCopy=work.phases.map((phase,i)=>[
      `${phase} 완료. ${i===work.phases.length-1?'달구지가 새 부품에 맞춰 낮게 떨린다.':'표시선과 체결 상태를 다시 확인했다.'}`,
      work.actions[i+1]||''
    ]);
    let step=0;
    const finish=()=>{
      if(!layer.isConnected) return;
      phases.forEach(x=>x.classList.add('active'));
      phases.forEach(x=>x.classList.remove('current'));
      layer.classList.add('ready');
      stepButton.hidden=true;
      const done=layer.querySelector('#upgrade-install-done');
      if(done) done.focus();
    };
    stepButton.onclick=()=>{
      if(step>=stepCopy.length) return;
      phases[step].classList.remove('current');
      phases[step].classList.add('active');
      if(typeof SND!=='undefined') SND.combat(step===2?'engine':'tool');
      if(live) live.textContent=stepCopy[step][0];
      step++;
      if(step>=stepCopy.length){ finish(); return; }
      phases[step].classList.add('current');
      stepButton.textContent=stepCopy[step-1][1];
    };
    stepButton.focus({preventScroll:true});
    layer.querySelector('#upgrade-install-done').onclick=()=>{
      const back=layer._returnFocus;
      layer.remove();
      renderGarage();
      if(back&&back.isConnected) requestAnimationFrame(()=>back.focus({preventScroll:true}));
    };
  }
  function renderGarage(){
    const g=$('#garage'); if(!g) return;
    const repCost=G.hasComp('minji')?6:8;
    const canRep=S.van<S.vanMax-5&&S.scrap>=repCost;
    const groups=D.upgradeGroups||[];
    let group=groups.find(x=>x.id===garageGroup)||groups[0];
    garageGroup=group.id;
    const ownedN=group.ids.filter(id=>S.up[id]).length;
    const art=D.upgradeArt&&D.upgradeArt[group.id];
    const upgrades=group.ids.map(id=>G.upDef(id)).filter(Boolean);
    const vanStage=G.vanStage();
    const stageLine=group.id==='seating'
      ? `<br>현재 ${vanStage.nm} · 기본 대비 +${vanStage.cm}cm · 정원 ${G.seatCapacity()+1}명`
      : '';
    g.innerHTML = `<div class="garage-van-preview">
        <canvas id="garage-van-cv" aria-label="현재 달구지 차체"></canvas>
        <div><b>${vanStage.nm}</b><small>차체 증축 +${vanStage.cm}cm · 탑승 정원 ${G.seatCapacity()+1}명</small></div>
      </div>
      <div class="garage-repair">
        <span><b>차체 정비</b><small>내구 +30${G.hasComp('minji')?' · 민지 할인':''} · 현재 ${Math.floor(S.van)}/${S.vanMax}</small></span>
        <span class="uc-cost">고철 ${repCost}</span>
        <button class="tbtn" data-rep="1" ${canRep?'':'disabled'}>${S.van>=S.vanMax-5?'양호':'수리'}</button>
      </div>
      <div class="garage-tabs">${groups.map(x=>{
        const n=x.ids.filter(id=>S.up[id]).length;
        return `<button class="${x.id===garageGroup?'here':''}" data-ug="${x.id}">${x.nm} ${n}/${x.ids.length}</button>`;
      }).join('')}</div>
      <div class="upgrade-group">
        <div class="upgrade-group-hero">${art?`<img src="${art}" alt="${group.nm} 부품 작업대">`:''}
          <div class="upgrade-group-copy"><b>${group.nm}</b><small>${group.sub}${stageLine}<br>${ownedN}/${group.ids.length} 장착</small></div>
        </div>
        <div class="upgrade-list">${upgrades.map(u=>{
      const owned=S.up[u.id];
      const chk=G.canBuyUp(u.id);
      const cost=`고철 ${u.cost.scrap}${u.cost.parts?' + 부품 '+u.cost.parts:''}`;
      return `<div class="upgrade-card ${owned?'owned':''}">
        <span><span class="uc-title">${u.ic} ${u.nm}</span><small class="uc-desc">${u.d}</small></span>
        <span class="uc-cost">${owned?'장착 완료':cost}</span>
        <button class="tbtn" data-up="${u.id}" title="${chk.why||''}" ${owned||!chk.ok?'disabled':''}>${owned?'완료':chk.ok?'장착':'잠김'}</button>
      </div>`;
    }).join('')}</div></div>`;
    requestAnimationFrame(()=>{ if(SCENE.drawSettlementVan) SCENE.drawSettlementVan($('#garage-van-cv')); });
    g.querySelectorAll('[data-ug]').forEach(b=>b.onclick=()=>{ garageGroup=b.dataset.ug; renderGarage(); });
    g.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{
      const u=G.upDef(b.dataset.up);
      const before={up:{...S.up},stage:{...G.vanStage()},capacity:G.seatCapacity(),
        fuelMax:S.fuelMax,vanMax:S.vanMax};
      if(G.buyUpgrade(b.dataset.up)){ renderGarage(); renderTrade(); renderHud();
        playUpgradeInstall(u,before);
        const ts=$('#tr-scrap'); if(ts) ts.textContent=S.scrap; }
    });
    const rb=g.querySelector('[data-rep]');
    if(rb) rb.onclick=()=>{
      const r=G.settlementRepair();
      if(!r.ok){ if(r.why) UI.toast(r.why); return; }
      UI.toast(`🔧 정비소 수리 완료 — 내구 +${r.amount}`);
      renderGarage(); renderHud();
      const ts=$('#tr-scrap'); if(ts) ts.textContent=S.scrap;
    };
  }
  function recruitStl(id){
    if(S.recruitQ){
      if(S.recruitQ.id!==id){ UI.toast('먼저 지금 맡은 합류 부탁을 끝내야 한다'); return; }
      closeOvl('#ovl-stl'); G.openRecruitStep(); return;
    }
    if(id==='kangwoo' && D.events.find(e=>e.id==='kw_recruit') && !S.used.includes('kw_recruit')){
      closeOvl('#ovl-stl'); G.openEventById('kw_recruit'); return; }
  }
  /* ── NPC 대화 ── */
  function talk(nid){
    const npc=D.npcs[nid], st=S.npcs[nid];
    if(!st.met && G.hasPerk('leo_fame')) st.att+=15;   // 길 위의 명성
    const tries=S.flags.seoulTries||0;
    const greet = (nid==='deokgu'&&tries>0)
      ? (tries===1? '…돌아왔냐. 남산이 "아직"이래? 흥, 그럴 줄 알았다. 성문은 안 좁아지니까 천천히 해라. 못 실은 게 뭔지는— 네 차가 제일 잘 알 거다.'
        : `…${tries}번째다, 이 미친놈들. 근데 이상하지. 올 때마다 차가 무거워 보여. 짐이 아니라 뭐가 다른 게 실리는 모양이야. …밥은 먹었냐. 국밥 시켜놨다.`)
      : !st.met? (st.att>10? npc.greetGood : npc.greet0)
      : st.att>10? npc.greetGood : st.att<-10? npc.greetBad : npc.greet0;
    st.met=true;
    if(S.mode==='offroad'&&OFF.ready()){ return talkOff(nid, greet); }
    const body=$('#stl-body');
    const old=body.querySelector('.dlg.talk'); if(old) old.remove();
    const rumorDone = S.flags['rumor_'+nid];
    const dlg=el('div','dlg talk',`<div class="npc-talk-head"><div class="npc-face">${npcFace(nid,npc.face)}</div><div class="say"><span class="spk">${npc.name}</span> "${greet}"</div></div>
      <div class="dialogue-choice-label">내 대답</div><div class="choices">
        ${!rumorDone?`<button class="choice" data-r="rumor">요즘 소문 들은 거 없어요?</button>`:''}
        <button class="choice" data-r="chat">이런저런 얘기를 나눈다</button>
        <button class="choice" data-r="x">그만 일어난다</button></div>`);
    body.prepend(dlg);
    dlg.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
      const r=b.dataset.r;
      if(r==='rumor'){
        S.flags['rumor_'+nid]=true; st.att+=5;
        const ru=npc.rumor;
        dlg.querySelector('.say').innerHTML=`<span class="spk">${npc.name}</span> "${ru.text}"`;
        dlg.querySelector('.choices').innerHTML=`<button class="choice" data-r="x2">고맙습니다</button>`;
        G.applyFx({reveal:ru.reveal, note:{type:'소문',title:npc.name+'의 소문',body:ru.text,links:[D.nodes[ru.reveal].name, npc.name]}});
        dlg.querySelector('[data-r="x2"]').onclick=()=>{ dlg.remove(); showStl(curStl,'people'); };
      }
      else if(r==='chat'){
        st.att+=3;
        const lines=[
          '"요즘 북쪽 하늘에 뭐가 자주 떠. 새는 아니야. 새는 저렇게 안 날지."',
          '"장사꾼 만수? 걔는 안 죽어. 멸망이 두 번 와도 뽕짝 틀고 다닐 걸."',
          '"정리자들 조심해. 나쁜 사람들은 아닌데… 사람이 아닌 것 같을 때가 있어."',
          '"차 관리 잘해. 요즘 부품 구하기가 하늘의 별 따기야."',
          '"서울? …거기 얘기는 밥 먹고 하자. 체해."',
        ];
        dlg.querySelector('.say').innerHTML=`<span class="spk">${npc.name}</span> ${pick(lines)}`;
        G.addNote({type:'인물',title:npc.name,body:`${npc.role}. ${D.stls[curStl].name}의 사람.`,links:[D.nodes[npc.node].name]});
        renderHud(); G.save();
      }
      else { dlg.remove(); }
    });
  }
  /* 오프로드 자유 대화 */
  function talkOff(nid, greet){
    chatNpc=nid;
    const npc=D.npcs[nid];
    const body=$('#stl-body');
    const old=body.querySelector('.dlg.talk'); if(old) old.remove();
    const dlg=el('div','dlg talk',`
      <div class="npc-talk-head"><div class="npc-face">${npcFace(nid,npc.face)}</div><div class="say"><span class="spk">${npc.name}</span></div></div>
      <div id="chatlog"></div>
      <div id="chatin"><input id="chat-txt" placeholder="하고 싶은 말… (자유 입력)" maxlength="120">
        <button id="chat-send">말한다</button></div>
      <div class="choices" style="margin-top:8px"><button class="choice" id="chat-x">그만 일어난다</button></div>`);
    body.prepend(dlg);
    addChat('npc', greet);
    $('#chat-send').onclick=sendChat;
    $('#chat-txt').onkeydown=(e)=>{ if(e.key==='Enter') sendChat(); };
    $('#chat-x').onclick=()=>{ dlg.remove(); };
  }
  function addChat(cls, txt){
    const log=$('#chatlog'); if(!log) return;
    if(cls==='sys'){
      log.appendChild(el('div','cmsg sys',txt));
    } else {
      const id=cls==='me'?'me':chatNpc;
      const profile=speakerInfo(id);
      const face=profile.portrait?`<img src="${profile.portrait}" alt="${esc(profile.name)} 초상">`:'';
      log.appendChild(el('div','cmsg '+cls,`${face}<span><b>${esc(profile.name)}</b><span>${esc(txt)}</span></span>`));
    }
    log.scrollTop=log.scrollHeight;
  }
  async function sendChat(){
    const inp=$('#chat-txt'); const txt=inp.value.trim();
    if(!txt) return;
    inp.value=''; addChat('me', txt);
    $('#chat-send').disabled=true; addChat('sys','…');
    const r=await OFF.npcChat(chatNpc, txt);
    const sys=document.querySelector('#chatlog .cmsg.sys:last-child'); if(sys) sys.remove();
    $('#chat-send').disabled=false;
    if(!r){ addChat('sys','(대답이 없다 — 연결 문제)'); return; }
    addChat('npc', r.reply);
    if(r.chips&&r.chips.length) addChat('sys', r.chips.map(c=>c.t).join(' · '));
    renderHud(); G.save();
  }

  /* ── MAP node card ── */
  function showNodeCard(id){
    const card=$('#nodecard');
    if(!id){ card.classList.remove('on'); return; }
    const n=D.nodes[id];
    const chk=G.canTravelTo(id);
    const plan=MAPR.pathTo&&MAPR.pathTo(id);
    const routeStops=plan&&plan.names?plan.names.slice(1):[];
    const routeText=routeStops.length>6
      ? [...routeStops.slice(0,4),'…',routeStops[routeStops.length-1]].join(' → ')
      : routeStops.join(' → ');
    let h=`<h4>${n.name} ${S.visited.includes(id)?'':'<small style="color:var(--faded)">(미방문)</small>'}</h4>
      <div class="d">${S.visited.includes(id)||n.type!=='hidden'? n.desc:'가보기 전엔 알 수 없다.'}</div>`;
    if(S.at===id) h+=`<div class="d" style="color:var(--amber)">현재 위치</div>`;
    else if(chk.ok) h+=`<button class="go" data-go="${id}">이곳으로 출발<small>${chk.km}km · 연료 약 ${chk.fuel}L</small></button>`;
    else if(S.driving) h+=`<div class="d">이동 중에는 목적지를 바꿀 수 없다</div>`;
    else h+=`<div class="d">${esc(chk.why||'여기서 바로 가는 길이 없다 — 경유해야 한다')}</div>`;
    if(plan&&plan.segments>1) h+=`<div class="map-route-preview"><b>이어지는 길 · ${plan.segments}구간 · 약 ${plan.km}km</b><span>${esc(routeText)}</span></div>`;
    card.innerHTML=h;
    const btn=card.querySelector('[data-go]');
    if(btn) btn.onclick=()=>{ closeOvl('#ovl-map'); G.startTravel(id); };
    card.classList.add('on');
  }
  function renderMapMini(){ $('#map-mini').textContent=`발견 ${S.known.length}/${Object.keys(D.nodes).length} · 서울까지 약 ${G.remainKm()}km`; }

  /* ── STATUS ── */
  let stTab='now';
  function renderStatus(){
    $('#st-mini').textContent=`DAY ${S.day} · ${Math.round(S.stats.km)}km`;
    document.querySelectorAll('#st-tabs button').forEach(x=>{
      const selected=x.dataset.st===stTab;
      x.classList.toggle('here',selected);
      x.setAttribute('aria-selected',String(selected));
      x.tabIndex=selected?0:-1;
    });
    const b=$('#st-body');
    const bar=(v,m,warn)=>`<div class="bar"><i style="width:${clamp(v/m*100,0,100)}%${warn?';background:var(--danger)':''}"></i></div>`;
    const kmPerL=(100/G.fuelFor(100,'normal')).toFixed(1);
    const perDay=Math.max(1,G.partySize()-(G.hasPerk('kw_ration')&&G.partySize()>1?1:0));
    const knownN=S.known.filter(id=>!D.nodes[id].secret).length;
    const totalN=Object.keys(D.nodes).filter(id=>!D.nodes[id].secret).length;
    const stlVisited=Object.keys(D.stls).filter(sid=>S.visited.some(v=>D.nodes[v].stl===sid)).length;
    const dlv=G.driverLv(), dNext=D.driverLv[dlv+1];
    const installed=D.upgrades.filter(u=>S.up[u.id]);
    const vanStage=G.vanStage();
    const supplyDays=Math.min(Math.floor(S.water/perDay),Math.floor(S.food/perDay));
    const m=missionHtml();
    const injuryIds=Object.keys(S.injuries||{});
    const route=G.routeStatus();
    const audioChannels=[['music','음악'],['ambience','환경음'],['effects','효과음'],['voice','목소리']];
    const injuryPanel=injuryIds.length?`<div class="st-sec"><h4>부상 · 전문 능력 일시 중지</h4>`+
      injuryIds.map(id=>{const x=S.injuries[id];return `<div class="st-row"><span class="k">${G.injuryName(id)}</span>
        <span class="v" style="flex:1;color:var(--danger)">${x.label} · ${x.days}일</span></div>`;}).join('')+
      `<div class="csub">아침마다 회복한다. 운전사 부상은 피로를 더 쌓고, 동료 부상은 해당 퍼크를 잠시 멈춘다.</div></div>`:'';

    let now=`<div class="st-summary">
      <div class="st-metric ${S.fuel<10?'warn':''}"><span class="mk">연료</span><span class="mv">${Math.floor(S.fuel)}L</span></div>
      <div class="st-metric ${S.fatigue>=75?'warn':''}"><span class="mk">피로</span><span class="mv">${Math.floor(S.fatigue)}%</span></div>
      <div class="st-metric ${supplyDays<=1?'warn':''}"><span class="mk">보급</span><span class="mv">${supplyDays}일</span></div>
    </div>
    <div class="mission-strip ${m.danger?'danger':''} ${m.secondary?'has-secondary':''}" style="border:1px solid var(--line);border-radius:10px;margin-bottom:7px">${m.html}</div>
    <div class="st-more">아래로 밀어 차량·보급 상세 보기 <span aria-hidden="true">↓</span></div>
    ${injuryPanel}
    <div class="st-sec"><h4>운전사</h4>
      <div class="st-row"><span class="k">나</span><span class="v" style="flex:1">Lv.${dlv} 「${G.driverTitle()}」 <small style="color:var(--faded)">연비 -${dlv*2}% · 피로 -${dlv*7}%</small>${G.isInjured('driver')?` <small style="color:var(--danger)">· ${S.injuries.driver.label}</small>`:''}</span></div>
      ${dNext?`<div class="st-row"><span class="k">다음 숙련</span>${bar(S.stats.km-D.driverLv[dlv].km, dNext.km-D.driverLv[dlv].km)}<span class="v">${Math.round(S.stats.km)}/${dNext.km}km</span></div>`:''}
      <div class="st-row"><span class="k">피로 ${ICO('fatigue_'+G.fatigueStage(), G.fatigueFace())}</span>${bar(S.fatigue,100,S.fatigue>=75)}<span class="v">${Math.floor(S.fatigue)}%</span></div>
      <div class="csub">85%부터 졸음 위험. 야영이나 숙박으로 회복한다.</div></div>
    <div class="st-sec"><h4>달구지 1호</h4>
      <div class="st-row"><span class="k">내구도</span>${bar(S.van,S.vanMax,S.van<25)}<span class="v">${Math.floor(S.van)}/${S.vanMax}</span></div>
      <div class="st-row"><span class="k">연료</span>${bar(S.fuel,S.fuelMax,S.fuel<10)}<span class="v">${Math.floor(S.fuel)}/${S.fuelMax}L</span></div>
      <div class="st-row"><span class="k">연비</span><span class="v" style="flex:1">${kmPerL} km/L ${S.wx!=='clear'?`<small style="color:var(--faded)">(${D.wx[S.wx].nm} 반영)</small>`:''}</span></div>
      <div class="st-row"><span class="k">탑승 인원</span><span class="v" style="flex:1">${S.party.length+1} / ${G.maxParty()+1} <small style="color:var(--faded)">운전사 포함</small>${S.dog?' + 보리':''}</span></div>
      <div class="st-row"><span class="k">거주구</span><span class="v" style="flex:1">${vanStage.nm} <small style="color:var(--faded)">기본 대비 +${vanStage.cm}cm</small></span></div>
      <div class="st-row"><span class="k">탑재 중량</span><span class="v" style="flex:1">${G.upWeight()}pt ${G.upWeight()>8?`<small style="color:var(--amber)">무거움 — 연비 +${Math.round((G.weightFuelFactor()-1)*100)}%</small>`:'<small style="color:var(--faded)">가벼움</small>'}</span></div>
      <div class="st-row"><span class="k">탑재 자리</span><span class="v" style="flex:1">${Object.entries(D.upSlots||{}).map(([sid,rule])=>`${rule.nm} ${G.slotUsage(sid).length}/${rule.cap}`).join(' · ')}</span></div>
      <div class="csub" style="margin-top:7px">장착 ${installed.length}/${D.upgrades.length}</div>
      <div style="margin-top:7px" class="upchips">${installed.length?installed.map(u=>
        `<span class="upchip">${u.ic} ${u.nm}</span>`).join(''):'<span class="upchip off">아직 장착한 부품 없음</span>'}</div></div>
    <div class="st-sec"><h4>보급</h4>
      <div class="st-row"><span class="k">${ICO('water')}물</span><span class="v" style="flex:1">${S.water} <small style="color:var(--faded)">≈ ${Math.floor(S.water/perDay)}일치</small></span></div>
      <div class="st-row"><span class="k">${ICO('food')}식량</span><span class="v" style="flex:1">${S.food} <small style="color:var(--faded)">≈ ${Math.floor(S.food/perDay)}일치</small></span></div>
      <div class="st-row"><span class="k">${ICO('scrap')}고철</span><span class="v" style="flex:1">${S.scrap}</span></div>
      <div class="st-row"><span class="k">아이템</span><span class="v" style="flex:1">${['부품','의약품','탄약'].map(k=>`${ICO(ITEM_ICO[k])}${k==='탄약'?'소총탄':k} ${S.items[k]||0}`).join(' · ')}</span></div>
      ${S.flags.armed_age?`<div class="st-row"><span class="k">무기</span><span class="v" style="flex:1">${['쇠파이프','석궁','볼트','화염병'].map(k=>`${k} ${S.items[k]||0}`).join(' · ')}</span></div>`:''}</div>
    <div class="st-sec ui-comfort"><h4>화면 편의 <small>이 기기에 저장</small></h4>
      <div class="ui-comfort-grid">
        <button data-ui-pref="text" aria-pressed="${uiPrefs.largeText}"><span>글자 크기</span><b>${uiPrefs.largeText?'크게':'보통'}</b></button>
        <button data-ui-pref="motion" aria-pressed="${uiPrefs.reduceMotion}"><span>화면 움직임</span><b>${uiPrefs.reduceMotion?'줄임':'기본'}</b></button>
      </div><div class="csub">움직임 줄임은 장면 전환과 달구지 애니메이션을 낮추고, 캔버스 갱신 부담도 줄인다.</div></div>
    <div class="st-sec audio-mixer"><h4>소리 믹서 <small>채널별 · 이 기기에 저장</small></h4>
      <div class="audio-mixer-list">${audioChannels.map(([key,label])=>{ const value=Math.round(SND.level(key)*100); return `
        <label><span>${label}</span><input type="range" min="0" max="100" step="5" value="${value}" data-audio-level="${key}" aria-label="${label} 음량"><output>${value}%</output></label>`; }).join('')}</div>
      <div class="csub">하단의 소리 버튼은 전체 음소거이며, 이 값은 음악·현장음·효과·음성을 따로 조절한다.</div></div>`;

    let journey=`<div class="st-sec"><h4>여정</h4>
      <div class="st-row"><span class="k">날짜 / 주행</span><span class="v" style="flex:1">DAY ${S.day} · ${Math.round(S.stats.km)}km · 서울까지 약 ${G.remainKm()}km</span></div>
      <div class="st-row"><span class="k">이벤트</span><span class="v" style="flex:1">${S.stats.events}건</span></div>
      <div class="st-row"><span class="k">비살상 임무</span><span class="v" style="flex:1">${S.stats.nonlethal||0}건 완료</span></div>
      <div class="st-row"><span class="k">발견</span>${bar(knownN,totalN)}<span class="v">${knownN}/${totalN}</span></div>
      <div class="st-row"><span class="k">정착지</span><span class="v" style="flex:1">${stlVisited}/${Object.keys(D.stls).length} 방문</span></div>
      <div class="st-row"><span class="k">${ICO('pursuit')}천리안 관측</span><span class="v" style="flex:1;color:${S.pursuit>2?'var(--danger)':'inherit'}">${'◉'.repeat(S.pursuit)||'—'} (${S.pursuit}/5)</span></div>
      ${S.flags.seoulTries?`<div class="st-row"><span class="k">남산 시도</span><span class="v" style="flex:1;color:var(--cheollian)">${S.flags.seoulTries}회 · 아직 입장 조건 미달</span></div>`:''}</div>`;
    if(route) journey+=`<div class="st-sec route-brief"><h4>${route.def.mark} 김천에서 고른 길 <small>${route.complete?'완주':'진행 중'}</small></h4>
      <div class="st-row"><span class="k">${esc(route.def.name)}</span><span class="v" style="flex:1">${esc(route.def.promise)}</span></div>
      <div class="st-row"><span class="k">경유</span><span class="v" style="flex:1">${route.def.corridor.map(id=>`${(route.state.visited||[]).includes(id)?'✓':'○'} ${D.nodes[id].name}`).join(' · ')}</span></div>
      <div class="csub">${route.complete?esc(route.def.reward):'청주에서 두 길이 다시 합쳐질 때까지 다른 노선으로 갈아탈 수 없다.'}</div></div>`;
    const departureSteps=G.departureSteps(), departureDone=departureSteps.filter(x=>x.done).length;
    const transfer=G.transferStatus();
    journey+=`<div class="st-sec departure-brief"><h4>왜 지금 서울로 가는가 <small>${departureDone}/${departureSteps.length}</small></h4>
      <p><b>${esc(transfer.mission)}</b> · 도윤 가족의 이의 제기는 부산에서 막혔다. 엄마의 남산 도면과 계기판 속 검증 모듈, 길에서 모은 기록으로 이번 명령을 끝낸다.</p>
      <div class="departure-steps">${departureSteps.map(step=>`<div class="departure-step ${step.done?'done':''}">
        <i>${step.done?'✓':'○'}</i><span><b>${esc(step.label)}</b><small>${esc(step.detail)}</small></span></div>`).join('')}</div>
      <div class="csub">서울 도착은 마지막 막의 시작이다. 남산에서 이송 중단까지 완료해야 첫 이송을 막는다. 동료는 자기 일을 끝내고, 자기 이유로 합류한다.</div></div>`;
    const knowledge=G.knowledgeSummary(), verified=knowledge.filter(k=>k.level>=2), heard=knowledge.filter(k=>k.level===1);
    journey+=`<div class="st-sec knowledge-status"><h4>아는 것과 모르는 것 <small>${verified.length}/${knowledge.length} 확인</small></h4>
      ${verified.slice(-4).map(k=>`<div class="st-row"><span class="k">✓ ${esc(k.label)}</span><span class="v">${esc(k.text)}</span></div>`).join('')}
      ${heard.slice(-3).map(k=>`<div class="st-row pending"><span class="k">? ${esc(k.label)}</span><span class="v">${esc(k.text)}</span></div>`).join('')}
      ${knowledge.some(k=>k.level===0)?`<div class="csub">확인하지 못한 항목 ${knowledge.filter(k=>k.level===0).length}개 · 소문은 사실처럼 말하지 않는다.</div>`:''}</div>`;
    const ready=G.seoulReady();
    journey+=`<div class="st-sec"><h4>여정 장부 <small style="color:${ready?'var(--ok)':'var(--faded)'};font-weight:400">${ready?'· 남산 입장 준비 완료':'· 네 기둥을 채우는 중'}</small></h4>`;
    const P=G.pillars(), pIco={관계:'♦',세계:'🕯',진실:'◈',유산:'✉'};
    journey+=`<div class="st-row" style="flex-wrap:wrap;gap:6px;margin-bottom:4px">`;
    ['관계','세계','진실','유산'].forEach(k=>{ const x=P[k], ok=x.have>=x.need;
      journey+=`<span style="font-family:var(--mono);font-size:10.5px;padding:2px 8px;border-radius:12px;border:1px solid ${ok?'var(--ok)':'var(--line)'};color:${ok?'var(--ok)':'var(--faded)'}">${ok?'✓':pIco[k]} ${k} ${x.have}/${x.need}</span>`;
    });
    journey+=`</div>`;
    const allStories=G.fullCrewStories();
    journey+=`<div class="csub" style="margin:7px 0 3px;color:${allStories?'var(--ok)':'var(--faded)'}">
      ${allStories?'여섯 사람의 증언 완성 · 남산 추가 장면 해금':'동료 서사 4명으로 진입 · 6명은 추가 증언과 에필로그'}
    </div>`;
    D.deeds.filter(d=>d.cat==='회수').forEach(d=>{ const ok=G.deedDone(d);
      journey+=`<div class="st-row"><span class="k">${ok?'✓':'○'} ${d.title}</span><span class="v" style="flex:1;font-size:11.5px;color:${ok?'var(--ok)':'var(--faded)'}">${ok?'실었다':d.hint}</span></div>`;
    });
    journey+=`</div>`;
    const traceN=G.traceCount();
    if(traceN){
      journey+=`<div class="st-sec"><h4>세대의 흔적 <small style="color:var(--faded);font-weight:400">${traceN}/${D.eraTraces.length} · 선택 기록</small></h4>`;
      D.eraTraces.filter(t=>S.flags[t.flag]).forEach(t=>{
        journey+=`<div class="st-row"><span class="k">✓ ${t.name}</span><span class="v" style="flex:1;font-size:11.5px;color:var(--faded)">${t.era} · ${t.desc}</span></div>`;
      });
      journey+=`<div class="csub" style="margin-top:7px">${traceN>=5?'코어 앞에서 이 흔적들을 증언할 수 있다.':'다섯 흔적을 모으면 별도의 증언이 열린다.'}</div></div>`;
    }
    if(S.flags.resist_revealed){
      const linked=G.cellsLinked().length, total=D.resistance.length;
      journey+=`<div class="st-sec"><h4>저항 연대 <small style="color:var(--faded);font-weight:400">${linked}/${total} 이음</small></h4>`;
      D.resistance.forEach(c=>{ const on=!!S.flags[c.flag];
        journey+=`<div class="st-row" style="${on?'':'opacity:.5'}"><span class="k">${on?'✓':'○'} ${c.name}</span><span class="v" style="flex:1;font-size:11.5px;color:${on?'var(--paper)':'var(--faded)'}">${c.region} · ${on?c.lead:'미접선'}</span></div>`;
      });
      journey+=`</div>`;
    }

    const quality=G.qualitySummary();
    const qualityResources=Object.values(quality.resources).reduce((sum,value)=>sum+value,0);
    const qualityRouteRows=Object.values(quality.routes);
    const qualityRoutesChosen=qualityRouteRows.reduce((sum,row)=>sum+(row.chosen||0),0);
    const qualityRoutesCompleted=qualityRouteRows.reduce((sum,row)=>sum+(row.completed||0),0);
    const qualitySettlementRows=Object.values(quality.settlements);
    const qualitySettlementVisits=qualitySettlementRows.reduce((sum,row)=>sum+(row.visits||0),0);
    const qualitySettlementActions=qualitySettlementRows.reduce((sum,row)=>sum+(row.actions||0),0);
    journey+=`<details class="st-sec quality-panel">
      <summary><span>플레이 품질 기록</span><small>이 기기에만 저장 · 외부 전송 없음</small></summary>
      <div class="quality-metrics">
        <span><b>${quality.repeatRate}%</b><small>10사건 내 반복</small></span>
        <span><b>${quality.lockedRate}%</b><small>잠긴 선택 노출</small></span>
        <span><b>${quality.successRate}%</b><small>전투 완전 성공</small></span>
        <span><b>${qualityResources}</b><small>자원 위험 진입</small></span>
      </div>
      <div class="st-row"><span class="k">실제 플레이</span><span class="v" style="flex:1">${quality.playMinutes}분 · ${quality.sessions}세션</span></div>
      <div class="st-row"><span class="k">사건 다양성</span><span class="v" style="flex:1">고유 ${quality.uniqueEvents}/${quality.events} · 같은 유형 최대 ${quality.maxTypeStreak}연속</span></div>
      <div class="st-row"><span class="k">첫 45분</span><span class="v" style="flex:1">사건 ${quality.first45.events} · 선택 ${quality.first45.choices} · 전투 ${quality.first45.combats}</span></div>
      <div class="st-row"><span class="k">호흡·변화</span><span class="v" style="flex:1">무거운 장면 최대 ${quality.maxHeavyStreak}연속 · 의미 있는 변화 공백 최대 ${quality.meaningful.maxGapMinutes}분</span></div>
      <div class="st-row"><span class="k">노선·정착지</span><span class="v" style="flex:1">노선 ${qualityRoutesCompleted}/${qualityRoutesChosen} 완주 · 정착지 ${qualitySettlementVisits}회 · 현장 행동 ${qualitySettlementActions}회</span></div>
      <div class="st-row"><span class="k">성장·회수</span><span class="v" style="flex:1">개조 ${quality.upgrades}회 · 선택 기록 ${quality.choiceCallbacks.remembered} · 가까운 회수 ${quality.choiceCallbacks.near} · 먼 회수 ${quality.choiceCallbacks.late}</span></div>
      ${quality.lastStop?`<div class="st-row"><span class="k">최근 중단</span><span class="v" style="flex:1">${esc(quality.lastStop.context||'게임')} · ${esc(quality.lastStop.stop)}</span></div>`:''}
      <div class="quality-actions"><button data-quality-export="md">개발 기록 .md</button><button data-quality-export="json">원본 .json</button></div>
    </details>`;

    const stories=Object.keys(D.comps).filter(id=>G.hasComp(id)).map(id=>{
      const c=D.comps[id], st=S.comps[id], p3=c.perks[3];
      const state=st.perks.includes(p3.id)?'done':'lv'+st.lvl;
      const next=st.lvl<3?D.bondTh[st.lvl]:Math.max(1,st.bond);
      return {id,c,st,p3,state,joinedBy:G.recruitApproach(id),best:G.bestRelation(id),
        injury:S.injuries&&S.injuries[id],bondPct:st.lvl>=3?100:Math.min(100,st.bond/next*100)};
    });
    let crew=`<div class="st-summary">
      <div class="st-metric"><span class="mk">동료</span><span class="mv">${S.party.length}/${G.maxParty()}</span></div>
      <div class="st-metric"><span class="mk">완주 서사</span><span class="mv">${stories.filter(s=>s.state==='done').length}</span></div>
      <div class="st-metric"><span class="mk">보리</span><span class="mv">${S.dog?'동행 중':'—'}</span></div>
    </div><div class="st-sec"><h4>차에 실린 이야기</h4>`+
      (stories.length?`<div class="crew-status-list">`+stories.map(s=>`<div class="crew-status-card" data-comp2="${s.id}" role="button" tabindex="0">
        <span class="crew-status-face">${faceOf(s.id,s.c.face)}</span>
        <span class="crew-status-main"><b>${s.c.name}</b><small>${s.c.role}${s.joinedBy?` · ${esc(s.joinedBy.label)}로 합류`:''}${s.best?`<br>${esc(D.comps[s.best.id].name)}와 ${G.relationLabel(s.best.score)}`:''}</small></span>
        <span class="crew-status-state">${s.injury?`🩹 ${s.injury.label}<br>${s.injury.days}일`:(s.state==='done'?`★ ${s.p3.nm}`:`Lv.${s.st.lvl} · 유대 ${s.st.bond}${s.st.pending?'<br>✦ 퍼크 대기':''}`)}</span>
        <span class="crew-status-bond"><i style="width:${s.bondPct}%"></i></span></div>`).join('')+`</div>`
        :`<div class="status-empty"><b>아직 혼자다.</b><span>누구를 만나게 될지는 길이 정한다.</span></div>`)+
      `<div class="csub" style="margin-top:7px">${stories.length?'이름을 누르면 유대와 해금된 능력을 확인한다.':'지도와 명단에는 만나지 않은 사람을 미리 표시하지 않는다.'}</div></div>`;

    b.innerHTML=`<div class="st-pane ${stTab==='now'?'on':''}" data-stpane="now">${now}</div>
      <div class="st-pane ${stTab==='journey'?'on':''}" data-stpane="journey">${journey}</div>
      <div class="st-pane ${stTab==='crew'?'on':''}" data-stpane="crew">${crew}</div>`;
    b.querySelectorAll('[data-ui-pref]').forEach(button=>button.onclick=()=>{
      if(button.dataset.uiPref==='text'){
        uiPrefs.largeText=!uiPrefs.largeText;
        localStorage.setItem('caravan_ui_text',uiPrefs.largeText?'large':'normal');
      }else{
        uiPrefs.reduceMotion=!uiPrefs.reduceMotion;
        localStorage.setItem('caravan_ui_motion',uiPrefs.reduceMotion?'reduced':'full');
      }
      applyUiPrefs();
      renderStatus();
    });
    b.querySelectorAll('[data-audio-level]').forEach(input=>input.oninput=()=>{
      SND.setLevel(input.dataset.audioLevel,Number(input.value)/100);
      const output=input.parentElement&&input.parentElement.querySelector('output');
      if(output) output.textContent=`${input.value}%`;
    });
    b.querySelectorAll('[data-quality-export]').forEach(button=>button.onclick=()=>exportQuality(button.dataset.qualityExport));
    b.querySelectorAll('[data-comp2]').forEach(r=>{
      r.onclick=()=>{ const id=r.dataset.comp2; if(G.hasComp(id)) showComp(id); };
      r.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); r.click(); } };
    });
  }

  /* ── JOURNAL ── */
  let jFilter='전체';
  function renderJournal(){
    $('#j-mini').textContent=`${S.notes.length}개의 기록`;
    const log=$('#jp-log');
    if(!S.notes.length){ log.innerHTML='<div class="sub">아직 기록이 없다.</div>'; return; }
    const types=['전체','인물','장소','사건','소문'];
    const cnt=(t)=> t==='전체'? S.notes.length : S.notes.filter(n=>n.type===t).length;
    const chips=`<div class="jchips">${types.map(t=>
      `<button class="jchip${jFilter===t?' here':''}" data-jf="${t}">${t} <small>${cnt(t)}</small></button>`).join('')}</div>`;
    const shown=[...S.notes].reverse().filter(n=>jFilter==='전체'||n.type===jFilter);
    log.innerHTML=chips+(shown.length? shown.map(n=>`
      <div class="note"><div class="nh"><span class="nt ${n.type}">${n.type}</span><b>${n.title}</b><span class="nd">DAY ${n.day}</span></div>
      <p>${fmt(n.body)}</p>
      ${n.links.length?`<div class="links">${n.links.map(l=>`<span class="lk">[[${l}]]</span>`).join('')}</div>`:''}</div>`).join('')
      : '<div class="sub">이 종류의 기록은 아직 없다.</div>');
    log.querySelectorAll('[data-jf]').forEach(b=>b.onclick=()=>{ jFilter=b.dataset.jf; renderJournal(); });
  }
  function showGraphNote(note){
    const g=$('#gnote');
    if(!note){ g.classList.remove('on'); return; }
    g.innerHTML=`<div class="note" style="margin:0;border:none;padding:0">
      <div class="nh"><span class="nt ${note.type}">${note.type}</span><b>${note.title}</b><span class="nd">DAY ${note.day}</span></div>
      <p>${fmt(note.body)}</p>
      ${note.links.length?`<div class="links">${note.links.map(l=>`<span class="lk">[[${l}]]</span>`).join('')}</div>`:''}</div>`;
    g.classList.add('on');
  }
  async function exportJournal(){
    const md=G.exportMd();
    const fn=`서울까지400km-일지-DAY${S.day}.md`;
    if(window.claude&&window.claude.downloads){
      try{ await window.claude.downloads.save({filename:fn, data:md});
        toast('✓ 일지를 저장했다'); }
      catch(e){ if(e&&e.code==='declined') toast('저장을 취소했다');
        else toast('저장 실패 — '+(e.message||e.code||'')); }
    } else {
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));
      a.download=fn; a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),2000);
      toast('✓ 일지 .md 다운로드');
    }
  }
  async function exportQuality(format){
    const data=G.exportQuality(format);
    const ext=format==='json'?'json':'md';
    const fn=`서울까지400km-품질기록-DAY${S.day}.${ext}`;
    if(window.claude&&window.claude.downloads){
      try{ await window.claude.downloads.save({filename:fn,data}); toast('품질 기록을 저장했다'); return; }
      catch(e){ if(e&&e.code==='declined'){ toast('저장을 취소했다'); return; } }
    }
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([data],{type:format==='json'?'application/json':'text/markdown'}));
    a.download=fn; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    toast(`품질 기록 .${ext} 다운로드`);
  }

  /* ── ENDING ── */
  function showEnding(kind){
    SND.setDriving(false);
    const e=$('#scr-end');
    let kicker,title,body,kcolor='var(--amber)';
    if(kind==='thirst'){
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='물이 먼저 끝났다';
      body=`사흘째 되는 날, 더는 운전대를 잡을 힘이 없었다.\n\n달구지는 길가에 얌전히 서 있다. 언젠가 다른 여행자가 이 차를 발견하고, 조수석의 일지를 읽게 될지도 모른다.\n\n일지의 마지막 장에는 이렇게 적혀 있다.\n\n"물을 아껴라. 사람은 아끼지 말고."`;
    } else {
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='여행이 끝났다'; body='달구지는 더 이상 달리지 못한다.';
    }
    const st=S? S.stats:{km:0,events:0};
    e.innerHTML=`<div class="kicker" style="color:${kcolor}">${kicker}</div>
      <h1>${title}</h1><div class="body">${fmt(body)}</div>
      <div id="endstats">
        <div class="st"><div class="k">DAYS</div><div class="v">${S?S.day:0}</div></div>
        <div class="st"><div class="k">DISTANCE</div><div class="v">${Math.round(st.km)}km</div></div>
        <div class="st"><div class="k">EVENTS</div><div class="v">${st.events}</div></div>
        <div class="st"><div class="k">동료</div><div class="v" style="font-size:13px">${S&&S.party.length?S.party.map(id=>D.comps[id].name).join(' '):'없음'}${S&&S.dog?' 🐕':''}</div></div>
      </div>
      <div class="acts">
        <button class="act" id="end-journal"><span class="ic">✎</span><span><b>여행 일지를 본다</b><small>${S?S.notes.length:0}개의 기록 · .md 내보내기</small></span></button>
        <button class="act primary" id="end-new"><span class="ic">▶</span><span><b>새 여행을 시작한다</b></span></button>
      </div>`;
    show('scr-end'); screen='end';
    $('#end-journal').onclick=()=>{ openModal('#ovl-journal','#j-x'); renderJournal(); };
    $('#end-new').onclick=()=>{ closeOvl('#ovl-journal'); show('scr-title'); refreshTitle(); };
  }

  return {boot, modalOpen, renderAll, renderHud, speak, toast, showEvent, showEnding,
    showNodeCard, showGraphNote, onDepart, onArrive, showStl, playRadio, playChat, showSeoul,
    storyTurns:buildStoryTurns, finishStory, skipIntro, clearSpeech};
})();
