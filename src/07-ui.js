/* ═══════════════════ UI ═══════════════════ */
const $ = (s)=>document.querySelector(s);
const el = (tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };

const UI = (()=>{
  let screen='title';          // title|mode|intro|game|end
  let introIdx=0, pendingMode='onroad';
  let bubbleSlot=0;

  /* ── modal state ── */
  const modalOpen = ()=> screen!=='game' || $('#ev-wrap').classList.contains('on')
    || $('#ovl-stl').classList.contains('on') || $('#ovl-map').classList.contains('on')
    || $('#ovl-journal').classList.contains('on') || $('#ovl-status').classList.contains('on');

  /* ── screens ── */
  function show(id){
    document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
    $('#scr-game').classList.remove('on');
    screen=id.replace('scr-','');
    $('#'+id).classList.add('on');
  }

  /* ── boot ── */
  function boot(){
    SCENE.init($('#cv'));
    SCENE.initTitle($('#titlecv'));
    MAPR.init($('#mapcv'));
    MAPR.initMini($('#minimap'));
    $('#minimap').onclick=()=>{ toggleOvl('#ovl-map'); MAPR.resize(); renderMapMini(); };
    GRAPH.init($('#graphcv'));
    wire();
    applyIcons();
    refreshTitle();
    requestAnimationFrame(loop);
  }
  function refreshTitle(){
    if(G.hasSave()){
      try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY));
        $('#bt-continue').style.display='flex';
        $('#cont-info').textContent=`DAY ${s.day} · ${Math.round(s.stats.km)}km 주행 · ${s.mode==='offroad'?'오프로드':'온로드'}`;
      }catch(e){}
    } else $('#bt-continue').style.display='none';
  }

  /* ── main loop ── */
  let last=0, hudCd=0;
  function loop(ts){
    const dt=Math.min(0.05,(ts-last)/1000||0.016); last=ts;
    if(screen==='title') SCENE.drawTitle(dt);
    else if(screen==='game'||screen==='end'){
      if(screen==='game'&&!S?.ended) G.tick(dt);
      if(screen==='game'){
        SCENE.draw(dt);
        MAPR.drawMini(dt);
        hudCd-=dt; if(hudCd<=0){ hudCd=0.25; renderHud(); if(S&&S.driving) renderTravelbar(); }
        if($('#ovl-map').classList.contains('on')) MAPR.draw(dt);
        if($('#jgraphwrap').classList.contains('on')) GRAPH.draw(dt);
      }
    }
    requestAnimationFrame(loop);
  }

  /* ── wiring ── */
  function wire(){
    $('#bt-new').onclick=()=>{ show('scr-mode'); envCheckUI(); };
    $('#bt-continue').onclick=()=>{ if(G.load()){ enterGame(); } };
    $('#bt-modeback').onclick=()=>show('scr-title');
    $('#mode-on').onclick=()=>startNew('onroad');
    $('#mode-off').onclick=(e)=>{
      if(e.target.closest('#offkey')||e.target.closest('#offmsg')) return;
      if(OFF.ready()) startNew('offroad');
      else if(OFF.reachable===true){ $('#offkey').classList.add('on'); $('#apikey').focus(); }
    };
    $('#bt-keyok').onclick=async(e)=>{
      e.stopPropagation();
      const k=$('#apikey').value.trim();
      if(!k) return;
      $('#offmsg').textContent='연결 확인 중…';
      const r=await OFF.testKey(k);
      $('#offmsg').textContent=r.msg;
      if(r.ok){ setTimeout(()=>startNew('offroad'), 600); }
    };
    $('#scr-intro').onclick=()=>nextIntro();
    $('#dk-map').onclick=()=>{ toggleOvl('#ovl-map'); MAPR.resize(); renderMapMini(); };
    $('#dk-journal').onclick=()=>{ toggleOvl('#ovl-journal'); renderJournal(); };
    $('#dk-camp').onclick=()=>G.camp();
    $('#dk-sound').onclick=()=>SND.toggle();
    $('#dk-status').onclick=()=>{ toggleOvl('#ovl-status'); renderStatus(); };
    $('#st-x').onclick=()=>closeOvl('#ovl-status');
    $('#map-x').onclick=()=>closeOvl('#ovl-map');
    $('#j-x').onclick=()=>closeOvl('#ovl-journal');
    $('#bt-export').onclick=exportJournal;
    document.querySelectorAll('#jtabs button').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('#jtabs button').forEach(x=>x.classList.remove('here'));
      b.classList.add('here');
      const g = b.dataset.jt==='graph';
      $('#jp-log').classList.toggle('on',!g);
      $('#jgraphwrap').classList.toggle('on',g);
      if(g){ GRAPH.build(); }
    });
  }
  async function envCheckUI(){
    const lock=$('#offlock'), key=$('#offkey'), msg=$('#offmsg');
    if(OFF.ready()){ lock.textContent='🔓 연결됨 — '+OFF.model; key.classList.remove('on'); return; }
    lock.textContent='환경 확인 중…';
    const ok = await OFF.checkReachable();
    if(ok){ lock.innerHTML='🔑 Anthropic API 키가 필요합니다 (카드를 누르면 입력창이 열립니다)<br>키는 이 브라우저의 localStorage에만 저장됩니다.'; }
    else { lock.innerHTML='🔒 이 호스팅 환경(클로드 아티팩트)은 보안 정책상 외부 API 호출이 차단됩니다.<br>게임 HTML 파일을 로컬에서 브라우저로 열면 오프로드 모드가 활성화됩니다.'; }
  }
  function startNew(mode){
    pendingMode=mode; introIdx=0;
    renderIntro();
    show('scr-intro');
  }
  function renderIntro(){
    $('#intro-txt').innerHTML = D.intro[introIdx];
    $('#intro-txt').style.opacity=0;
    requestAnimationFrame(()=>{ $('#intro-txt').style.transition='opacity .6s'; $('#intro-txt').style.opacity=1; });
  }
  function nextIntro(){
    introIdx++;
    if(introIdx>=D.intro.length){ G.newGame(pendingMode); enterGame(); }
    else renderIntro();
  }
  function enterGame(){
    show('scr-game'); screen='game';
    applyIcons();
    renderAll();
    if(S.mode==='offroad'&&!OFF.ready()) toast('📡 오프로드 연결 없음 — 온로드 이벤트로 대체됩니다');
  }

  /* ── overlays ── */
  function toggleOvl(sel){ const o=$(sel);
    document.querySelectorAll('.ovl').forEach(x=>{ if(x!==o) x.classList.remove('on') });
    o.classList.toggle('on');
    if(!o.classList.contains('on')&&sel==='#ovl-map') $('#nodecard').classList.remove('on');
  }
  function closeOvl(sel){ $(sel).classList.remove('on'); if(sel==='#ovl-map') $('#nodecard').classList.remove('on'); }

  /* ── HUD ── */
  function gauge(id, val, max, warn){
    const g=$(id);
    g.querySelector('.val').textContent = typeof val==='number'? (Math.round(val*10)/10) : val;
    g.querySelector('.bar i').style.width = clamp(val/max*100,0,100)+'%';
    g.classList.toggle('warn', warn);
  }
  function renderHud(){
    if(!S) return;
    gauge('#g-fuel', Math.floor(S.fuel), S.fuelMax, S.fuel<10);
    gauge('#g-water', S.water, 14, S.water<=G.partySize());
    gauge('#g-food', S.food, 14, S.food<=G.partySize());
    gauge('#g-van', Math.floor(S.van), S.vanMax, S.van<25);
    gauge('#g-scrap', S.scrap, 40, false);
    $('#clockbox').textContent = G.fmtClock();
    const wxNow=D.wx[S.wx]||D.wx.clear, wxN=D.wx[S.wxNext]||D.wx.clear;
    $('#wxbox').innerHTML = `${ICO('wx_'+S.wx, wxNow.ic+' ')}${wxNow.nm} <span style="opacity:.5">· 내일 ${ICO('wx_'+S.wxNext, wxN.ic)}</span>`;
    const f=$('#ftgbox'), stg=G.fatigueStage();
    f.style.display='inline';
    f.style.color = stg==='bad'?'var(--danger)': stg==='mid'?'var(--amber)':'var(--faded)';
    f.innerHTML = `${ICO('fatigue_'+stg, G.fatigueFace())} ${Math.floor(S.fatigue)}%`;
    const eye=$('#eyebox');
    eye.style.display = S.pursuit>0? 'inline':'none';
    eye.innerHTML = `${ICO('pursuit','◉'.repeat(Math.min(S.pursuit,5)))} 관측 ${S.pursuit}`;
  }

  /* ── panel ── */
  function faceOf(id, fallback){
    return D.portraits[id]? `<img class="pimg" src="${D.portraits[id]}" alt="">` : fallback;
  }
  const ICO=(key, fallback)=> D.icons[key]? `<img class="ico" src="${D.icons[key]}" alt="">` : (fallback||'');
  const ITEM_ICO={'부품':'parts','의약품':'meds','탄약':'ammo'};
  function applyIcons(){
    [['#g-fuel','fuel'],['#g-water','water'],['#g-food','food'],['#g-van','van'],['#g-scrap','scrap']]
      .forEach(([sel,key])=>{ if(!D.icons[key]) return;
        const lab=$(sel+' .lab span'); if(lab&&!lab.querySelector('.ico'))
          lab.innerHTML=`<img class="ico" src="${D.icons[key]}" alt="">`+lab.textContent; });
  }
  function partyStrip(){
    const moodFace=(m)=> m>=70?'😊':m>=40?'😐':m>=15?'😟':'😰';
    let h='<div id="party">';
    h+=`<div class="pcard"><div class="pf">${faceOf('me','🧑‍✈️')}</div><span>나</span><span class="plv">Lv${G.driverLv()}</span></div>`;
    for(const id of S.party){ const c=D.comps[id], st=S.comps[id];
      h+=`<div class="pcard" data-comp="${id}" role="button" tabindex="0"><div class="pf">${faceOf(id,c.face)}</div><span>${c.name}</span>
        ${st.lvl?`<span class="plv">${'★'.repeat(st.lvl)}</span>`:''}
        <span class="pm">${moodFace(st.mood)}</span>
        ${st.pending?`<span class="pbadge">${ICO('perk','✦')}</span>`:''}</div>`; }
    if(S.dog) h+=`<div class="pcard"><div class="pf">🐕</div><span>보리</span></div>`;
    for(let i=S.party.length; i<G.maxParty(); i++) h+=`<div class="pcard" style="opacity:.3"><div class="pf">·</div><span>빈자리</span></div>`;
    return h+'</div>';
  }
  function wireParty(p){
    p.querySelectorAll('[data-comp]').forEach(b=>b.onclick=()=>showComp(b.dataset.comp));
  }
  function renderPanel(){
    const p=$('#panel');
    if(!S){ p.innerHTML=''; return; }
    if(S.driving){
      const to=D.nodes[S.driving.to];
      p.innerHTML = `
        <div id="travelbar"></div>
        <h3>${to.name}(으)로 이동 중</h3>
        <div class="sub">${to.desc}</div>
        ${partyStrip()}
        ${S.quest?`<div class="sub">${ICO('quest','📦')} ${S.quest.item} → ${D.nodes[S.quest.to].name} <span style="color:var(--amber)">고철 ${S.quest.reward}</span> <span style="color:${S.quest.due-S.day<=1?'var(--danger)':'var(--faded)'}">D-${Math.max(0,S.quest.due-S.day)}</span></div>`:''}
        <div class="sub" style="margin-top:6px">길 위에서는 무슨 일이든 일어난다. 발견도, 사람도, 그것의 눈도.</div>`;
      renderTravelbar();
      wireParty(p);
      return;
    }
    const n=D.nodes[S.at];
    let h=`<h3>${n.name}</h3><div class="sub">${n.desc}</div>${partyStrip()}
      ${S.quest?`<div class="sub" style="margin:-4px 0 10px">${ICO('quest','📦')} ${S.quest.item} → ${D.nodes[S.quest.to].name} <span style="color:var(--amber)">고철 ${S.quest.reward}</span> <span style="color:${S.quest.due-S.day<=1?'var(--danger)':'var(--faded)'}">D-${Math.max(0,S.quest.due-S.day)}</span></div>`:''}<div class="acts">`;
    if(n.stl) h+=`<button class="act primary" data-a="stl"><span class="ic">🏘</span><span><b>정착지에 들어간다</b><small>거래 · 대화 · 소문</small></span></button>`;
    if(!n.stl && n.type!=='goal') h+=`<button class="act" data-a="explore"><span class="ic">🔦</span><span><b>주변을 탐색한다</b><small>약 1~2시간 · 무엇이 나올지 모른다</small></span></button>`;
    const nbs=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id));
    for(const nb of nbs){
      const t2=D.nodes[nb.id];
      const fuel=G.fuelFor(nb.km,nb.road);
      const lack = S.fuel<fuel;
      h+=`<button class="act" data-go="${nb.id}" ${S.fuel<=0?'disabled':''}>
        <span class="ic">${t2.type==='goal'?'⚡':'→'}</span>
        <span><b>${t2.name}</b><small>${nb.km}km · 연료 약 ${fuel}L${nb.road==='rough'?' · 험로':''}${lack?' · <span style="color:var(--danger)">연료 부족 주의</span>':''}</small></span></button>`;
    }
    if(S.flags.armed_age){
      h+=`<button class="act" data-a="craft"><span class="ic">🔨</span><span><b>작업대를 편다</b><small>무기·탄 제작 · 약 40분</small></span></button>`;
    }
    if(S.van<S.vanMax-5){
      const hasP=(S.items['부품']||0)>0;
      h+=`<button class="act" data-a="repair" ${hasP?'':'disabled'}><span class="ic">🔧</span><span><b>달구지를 정비한다</b><small>${hasP?'부품 1 소모 · 내구 +35 · 약 1.5시간':'부품이 없다 — 탐색이나 정비소에서 구하자'}</small></span></button>`;
    }
    if(S.fuel<5) h+=`<button class="act" data-a="walkfuel"><span class="ic">🛢</span><span><b>걸어서 연료를 구해온다</b><small>시간과 체력을 크게 소모한다</small></span></button>`;
    h+='</div>';
    p.innerHTML=h;
    const wf=p.querySelector('[data-a="walkfuel"]'); if(wf) wf.onclick=()=>G.openEventById('crisis_nofuel');
    const rp=p.querySelector('[data-a="repair"]'); if(rp) rp.onclick=()=>G.fieldRepair();
    const cf=p.querySelector('[data-a="craft"]'); if(cf) cf.onclick=()=>showCraft();
    wireParty(p);
    p.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{ G.startTravel(b.dataset.go); });
    const ex=p.querySelector('[data-a="explore"]'); if(ex) ex.onclick=()=>G.explore();
    const st=p.querySelector('[data-a="stl"]'); if(st) st.onclick=()=>showStl(n.stl);
  }
  function renderTravelbar(){
    const tb=$('#travelbar'); if(!tb||!S.driving) return;
    const d=S.driving, f=d.gone/d.dist;
    tb.innerHTML=`<div class="route"><span>${D.nodes[d.from].name.split(' ')[0]}</span>
      <span>${Math.round(d.dist-d.gone)}km 남음</span>
      <span>${D.nodes[d.to].name.split(' ')[0]}</span></div>
      <div class="tr"><i style="width:${f*100}%"></i><div class="van-dot" style="left:${f*100}%"></div></div>`;
  }
  function renderAll(){ renderHud(); renderPanel(); }

  /* ── travel hooks ── */
  function onDepart(){ closeOvl('#ovl-map'); closeOvl('#ovl-stl'); renderAll();
    SND.setDriving(true); }
  function onArrive(){ renderAll(); SND.setDriving(false);
    toast(`<span class="ic">📍</span>${D.nodes[S.at].name} 도착`); }

  /* ── bubbles ── */
  function speak(b){
    const wrap=$('#bubbles');
    const isAi = b.who==='cheollian';
    const bb=el('div','bubble'+(isAi?' ai':''),
      (b.who!=='sys'&&!isAi? `<span class="who">${b.who==='나'?'나':(D.comps[b.who]?.name||b.who)}</span>`:'')
      + (isAi? `<span class="who">천리안</span>`:'') + b.t);
    const slot=bubbleSlot++%2;
    bb.style.left = (8+slot*6)+'%';
    bb.style.top = (10+slot*46)+'px';
    wrap.appendChild(bb);
    requestAnimationFrame(()=>bb.classList.add('show'));
    setTimeout(()=>{ bb.classList.remove('show'); setTimeout(()=>bb.remove(),400); }, 4600);
  }

  /* ── toast ── */
  function toast(html, cls){
    const t=el('div','toast '+(cls||''), html);
    $('#toasts').appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); }, 3400);
  }

  /* ── EVENT SHEET ── */
  let curEv=null;
  function showEvent(evd){
    curEv=evd;
    SND.setDriving(false);
    const sheet=$('#ev-sheet');
    const aiEvent = evd.type==='추적'||!!evd.ai;
    $('#cheollian-tint').classList.toggle('on', aiEvent);
    const text = typeof evd.text==='function'? evd.text(S):evd.text;
    let h=`<div class="tag ${aiEvent?'ai-tag':''}">${evd.type}${evd.gen?' · 오프로드 생성':''}</div>
      <h2>${evd.title}</h2><div class="body">${fmt(text)}</div><div class="choices">`;
    evd.choices.forEach((c,i)=>{
      const rq=G.reqOk(c.req);
      h+=`<button class="choice" data-i="${i}" ${rq.ok?'':'disabled'}>${c.label}
        ${c.risk?`<span class="risk">⚠ ${c.risk}</span>`:''}
        ${c.req?`<span class="req">${rq.ok?'✓':'✗'} ${G.reqText(c.req)}</span>`:''}</button>`;
    });
    h+='</div>';
    sheet.innerHTML=h;
    sheet.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
      if(b.hasAttribute('disabled'))return;
      resolveChoice(evd.choices[+b.dataset.i]);
    });
    $('#ev-wrap').classList.add('on');
  }
  function fmt(t){ return (t||'').replace(/\n/g,'<br>'); }

  /* ── 동료 시트 (유대·퍼크) ── */
  function showComp(id){
    const c=D.comps[id], st=S.comps[id];
    SND.setDriving(false);
    const next = st.lvl<3 ? D.bondTh[st.lvl] : null;
    const pct = next ? Math.min(100, st.bond/next*100) : 100;
    let h=`<div class="tag">동료 — ${c.cls}</div>
      <div class="comp-head"><div class="comp-face">${faceOf(id,c.face)}</div>
        <div><h2 style="margin:0">${c.name} <span class="clvl">Lv.${st.lvl}${st.lvl>=3?' MAX':''}</span></h2>
        <div class="csub">${c.role} · 기본: ${c.perk}</div></div></div>
      <div class="body" style="margin:10px 0 0;font-size:13px">${c.bio}</div>
      <div class="bond"><div class="lab"><span>${ICO('bond')}유대 BOND</span><span>${st.bond}${next?' / '+next:' · 완성'}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div></div>`;
    if(st.perks.length){
      h+=`<div class="plist">`+st.perks.map(pid=>{ const p=G.perkDef(pid);
        return `<div class="pk${p.story?' story':''}"><b>${p.story?'★':ICO('perk','✦')} ${p.nm}</b><small>${p.d}</small></div>`; }).join('')+`</div>`;
    }
    if(st.pending){
      const opts=c.perks[st.pending];
      h+=`<div class="tag" style="margin-top:14px;color:var(--amber)">LV.${st.pending} 퍼크 — 하나만 배울 수 있다</div>
        <div class="choices">`+opts.map((p,i)=>
          `<button class="choice" data-pk="${i}">${ICO('perk','✦')} ${p.nm}<span class="req" style="color:var(--faded)">${p.d}</span></button>`).join('')+`</div>`;
    } else if(st.lvl<3){
      const p3=c.perks[3];
      h+=`<div class="plist" style="opacity:.65"><div class="pk story"><b>★ Lv.3 — ${p3.nm}</b><small>${p3.d}</small></div></div>
        <div class="csub" style="margin-top:8px">유대는 ${c.name}의 능력을 쓰는 선택, 동행 이벤트, 야영에서 쌓인다.</div>`;
    }
    h+=`<div class="choices" style="margin-top:12px"><button class="choice" data-x="1">닫는다</button></div>`;
    const sheet=$('#ev-sheet');
    sheet.innerHTML=h;
    sheet.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{ G.choosePerk(id, +b.dataset.pk); showComp(id); });
    sheet.querySelector('[data-x]').onclick=()=>{ closeEvent(); };
    $('#ev-wrap').classList.add('on');
  }

  /* ── 작업대 (무기 제작) ── */
  function showCraft(){
    SND.setDriving(false);
    const sheet=$('#ev-sheet');
    let h=`<div class="tag">🔨 작업대 — 달구지 뒤 칸</div>
      <h2>무기 제작</h2>
      <div class="csub">보유: 고철 ${S.scrap} · 부품 ${S.items['부품']||0} · 연료 ${Math.floor(S.fuel)}L</div>
      <div class="plist" style="margin-top:10px">`;
    h+=D.crafts.map(c=>{
      const chk=G.canCraft(c.id);
      const cost=[c.need.scrap?`고철 ${c.need.scrap}`:'',c.need.parts?`부품 ${c.need.parts}`:'',c.need.fuel?`연료 ${c.need.fuel}L`:''].filter(Boolean).join(' + ');
      const own=Object.keys(c.out).map(nm=>`${nm} ${S.items[nm]||0}`).join(' ');
      return `<div class="pk" style="display:flex;align-items:center;gap:10px">
        <span style="flex:1"><b>${c.ic} ${c.nm}</b><small>${c.d}<br>재료: ${cost} · 보유: ${own}</small></span>
        <button class="tbtn" data-cr="${c.id}" ${chk.ok?'':'disabled'}>${chk.ok?'제작':chk.why}</button></div>`;
    }).join('');
    h+=`</div><div class="choices" style="margin-top:12px"><button class="choice" data-x="1">작업대를 접는다</button></div>`;
    sheet.innerHTML=h;
    sheet.querySelectorAll('[data-cr]').forEach(b=>b.onclick=()=>{ if(G.craft(b.dataset.cr)) showCraft(); });
    sheet.querySelector('[data-x]').onclick=()=>closeEvent();
    $('#ev-wrap').classList.add('on');
  }

  function resolveChoice(choice){
    const out=G.pickOutcome(curEv, choice);
    const chips=G.applyFx(out.fx);
    chips.push(...G.afterChoice(curEv, choice));
    if(S.ended) return;
    const sheet=$('#ev-sheet');
    let h=`<div class="tag">${curEv.title}</div><div class="outcome">${fmt(out.text)}</div>`;
    if(chips.length){ h+='<div class="fx-line">'+chips.map(c=>`<span class="fx ${c.c}">${c.t}</span>`).join('')+'</div>'; }
    h+='<div class="choices">';
    if(out.fx&&out.fx.offerComp){
      const id=out.fx.offerComp, mp=G.maxParty(), full=S.party.length>=mp, c=D.comps[id];
      h+=`<button class="choice" data-r="yes" ${full?'disabled':''}>${c.face} ${c.name}를 태운다
          <span class="req">${full? '✗ 자리가 없다 ('+S.party.length+'/'+mp+')' : '✓ 자리 '+S.party.length+'/'+mp+' · '+c.perk}</span></button>
        <button class="choice" data-r="no">작별 인사를 한다</button>`;
    } else {
      h+=`<button class="choice" data-r="ok">계속 간다</button>`;
    }
    h+='</div>';
    sheet.innerHTML=h;
    sheet.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
      if(b.hasAttribute('disabled'))return;
      if(b.dataset.r==='yes'&&out.fx.offerComp){ G.doRecruit(out.fx.offerComp); }
      closeEvent();
    });
    renderHud();
  }
  function closeEvent(){
    $('#ev-wrap').classList.remove('on');
    $('#cheollian-tint').classList.remove('on');
    curEv=null;
    if(S.driving) SND.setDriving(true);
    renderAll(); G.save();
  }

  /* ── SETTLEMENT ── */
  let curStl=null, chatNpc=null, stlQuest=null;
  function showStl(stlId){
    curStl=stlId;
    const stl=D.stls[stlId];
    if(!G.isNight()) G.checkQuest();   // 배달은 사람이 깨어 있을 때만
    $('#stl-name').innerHTML=stl.name+`<button class="x" style="float:right" id="stl-leave">✕</button>`;
    $('#stl-desc').textContent=stl.desc;
    const body=$('#stl-body');
    let h='';
    /* 밤에는 장이 닫힌다 */
    if(G.isNight()){
      h+=`<div class="dlg"><div class="say"><span class="spk">🌙 밤</span> 장은 닫혔고 사람들은 잠들었다. 등불 몇 개만 성벽을 지킨다.\n\n거래·정비·의뢰는 아침(06:00)부터.</div></div>
        <div class="acts">
          <button class="act primary" id="stl-rest"><span class="ic">🛏</span><span><b>하룻밤 묵는다</b><small>아침까지 · 피로 회복 · 사기 회복</small></span></button>
          <button class="act" id="stl-out"><span class="ic">🚐</span><span><b>달구지로 돌아간다</b></span></button></div>`;
      body.innerHTML=h;
      $('#stl-rest').onclick=()=>{ closeOvl('#ovl-stl'); G.camp('🏘 정착지에서 하룻밤을 묵었다'); };
      $('#stl-out').onclick=()=>{ closeOvl('#ovl-stl'); renderAll(); };
      $('#stl-leave').onclick=()=>{ closeOvl('#ovl-stl'); renderAll(); };
      $('#ovl-stl').classList.add('on');
      return;
    }
    // NPCs
    for(const nid of stl.npcs){
      const npc=D.npcs[nid], st=S.npcs[nid];
      h+=`<button class="npc-row" data-npc="${nid}">
        <div class="npc-face">${npc.face}</div>
        <span><b>${npc.name}</b><small>${npc.role}</small></span>
        <span class="npc-att">${st.att>10?'우호적':st.att<-10?'냉랭함':st.met?'아는 사이':'초면'}</span></button>`;
    }
    // recruit (대구 강우)
    if(stl.recruit && !G.hasComp(stl.recruit)){
      const c=D.comps[stl.recruit];
      h+=`<button class="npc-row" data-recruit="${stl.recruit}">
        <div class="npc-face">${c.face}</div>
        <span><b>${c.name}</b><small>${c.bio}</small></span>
        <span class="npc-att">동행 가능</span></button>`;
    }
    // 배달 의뢰
    if(S.quest){
      h+=`<div class="dlg"><div class="say"><span class="spk">${ICO('quest','📦')} 의뢰 진행 중</span> ${S.quest.item} → <b>${D.nodes[S.quest.to].name}</b> <small style="color:var(--faded)">(사례 고철 ${S.quest.reward})</small></div></div>`;
    } else {
      const q=G.rollQuest();
      if(q){ stlQuest=q;
        h+=`<div class="dlg"><div class="say"><span class="spk">${ICO('quest','📦')} 배달 의뢰</span> "${q.item}, ${D.nodes[q.to].name}까지 부탁해도 되겠소? 사례는 고철 ${q.reward}."</div>
          <div class="choices"><button class="choice" id="q-accept">맡는다 <span class="req">✓ 도착 시 자동 전달</span></button></div></div>`; }
    }
    // trade
    h+=`<div class="dlg"><div class="say" style="margin-bottom:4px"><span class="spk">거래</span> <small style="color:var(--faded)">보유 고철 <span id="tr-scrap">${S.scrap}</span></small></div><div id="trade"></div></div>`;
    // garage
    h+=`<div class="dlg"><div class="say" style="margin-bottom:4px"><span class="spk">🔧 정비소</span> <small style="color:var(--faded)">부품 ${S.items['부품']||0} · 달구지 개조</small></div><div id="garage"></div></div>`;
    h+=`<div class="acts">
      <button class="act" id="stl-rest"><span class="ic">🛏</span><span><b>하룻밤 묵는다</b><small>아침까지 · 사기 회복 · 밴 정비</small></span></button>
      <button class="act primary" id="stl-out"><span class="ic">🚐</span><span><b>달구지로 돌아간다</b></span></button></div>`;
    body.innerHTML=h;
    renderTrade();
    renderGarage();
    const qa=body.querySelector('#q-accept');
    if(qa) qa.onclick=()=>{ G.acceptQuest(stlQuest); showStl(curStl); };
    body.querySelectorAll('[data-npc]').forEach(b=>b.onclick=()=>talk(b.dataset.npc));
    const rec=body.querySelector('[data-recruit]');
    if(rec) rec.onclick=()=>recruitStl(stl.recruit);
    $('#stl-rest').onclick=()=>{ closeOvl('#ovl-stl'); G.camp('🏘 정착지에서 하룻밤을 묵었다'); };
    $('#stl-out').onclick=()=>{ closeOvl('#ovl-stl'); renderAll(); };
    $('#stl-leave').onclick=()=>{ closeOvl('#ovl-stl'); renderAll(); };
    $('#ovl-stl').classList.add('on');
  }
  function renderTrade(){
    const stl=D.stls[curStl], tr=$('#trade');
    if(!tr) return;
    const disc=G.hasPerk('leo_vip')?0.8:G.hasComp('leo')?0.9:1;
    let h='';
    stl.trade.forEach((row,i)=>{
      const [label,key,qty,price0]=row;
      const tico = key==='fuel'?ICO('fuel'): key==='water'?ICO('water'): key==='food'?ICO('food'):
        key.startsWith('item')?ICO(ITEM_ICO[key.slice(4)]||''):'';
      if(key.startsWith('barter')){
        h+=`<div class="trade-row"><span class="tn">${label}</span><button class="tbtn" data-t="${i}">교환</button></div>`;
      } else {
        const price=Math.max(1,Math.round(price0*disc));
        h+=`<div class="trade-row"><span class="tn">${tico}${label}</span><span class="tp">${ICO('scrap')}고철 ${price}</span>
          <button class="tbtn" data-t="${i}" ${S.scrap<price?'disabled':''}>산다</button></div>`;
      }
    });
    tr.innerHTML=h;
    tr.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>buy(+b.dataset.t));
  }
  function buy(i){
    const stl=D.stls[curStl];
    const [label,key,qty,price0]=stl.trade[i];
    const disc=G.hasPerk('leo_vip')?0.8:G.hasComp('leo')?0.9:1;
    if(key==='barter_wf'){ if(S.water>=2){S.water-=2;S.food+=1;} else return toast('물이 부족하다'); }
    else if(key==='barter_fp'){ if(S.food>=2){S.food-=2;S.items['부품']=(S.items['부품']||0)+1;} else return toast('식량이 부족하다'); }
    else if(key==='barter_mf'){ if((S.items['의약품']||0)>=1){S.items['의약품']--;S.food+=3;} else return toast('의약품이 없다'); }
    else{
      const price=Math.max(1,Math.round(price0*disc));
      if(S.scrap<price) return;
      S.scrap-=price;
      if(key==='fuel') S.fuel=clamp(S.fuel+qty,0,S.fuelMax);
      else if(key==='water') S.water+=qty;
      else if(key==='food') S.food+=qty;
      else if(key.startsWith('item')){ const nm=key.slice(4); S.items[nm]=(S.items[nm]||0)+qty; }
    }
    $('#tr-scrap').textContent=S.scrap;
    renderTrade(); renderHud(); G.save();
  }
  function renderGarage(){
    const g=$('#garage'); if(!g) return;
    const repCost=G.hasComp('minji')?6:8;
    const canRep=S.van<S.vanMax-5&&S.scrap>=repCost;
    g.innerHTML = `<div class="trade-row"><span class="tn">🔧 <b>수리</b><br><small style="color:var(--faded)">내구 +30${G.hasComp('minji')?' · 민지 할인':''}</small></span>
        <span class="tp">고철 ${repCost}</span>
        <button class="tbtn" data-rep="1" ${canRep?'':'disabled'}>${S.van>=S.vanMax-5?'양호함':'수리'}</button></div>`
      + D.upgrades.map(u=>{
      const owned=S.up[u.id];
      const chk=G.canBuyUp(u.id);
      const cost=`고철 ${u.cost.scrap}${u.cost.parts?' + 부품 '+u.cost.parts:''}`;
      return `<div class="trade-row"><span class="tn">${u.ic} <b>${u.nm}</b><br><small style="color:var(--faded)">${u.d}</small></span>
        <span class="tp">${owned?'—':cost}</span>
        <button class="tbtn" data-up="${u.id}" ${owned||!chk.ok?'disabled':''}>${owned?'장착됨':chk.ok?'장착':chk.why}</button></div>`;
    }).join('');
    g.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{
      if(G.buyUpgrade(b.dataset.up)){ renderGarage(); renderTrade(); renderHud();
        const ts=$('#tr-scrap'); if(ts) ts.textContent=S.scrap; }
    });
    const rb=g.querySelector('[data-rep]');
    if(rb) rb.onclick=()=>{
      const cost=G.hasComp('minji')?6:8;
      if(S.scrap<cost||S.van>=S.vanMax-5) return;
      S.scrap-=cost; S.van=clamp(S.van+30,0,S.vanMax);
      UI.toast('🔧 정비소 수리 완료 — 내구 +30');
      G.save(); renderGarage(); renderHud();
      const ts=$('#tr-scrap'); if(ts) ts.textContent=S.scrap;
    };
  }
  function recruitStl(id){
    const body=$('#stl-body');
    const c=D.comps[id];
    const full=S.party.length>=G.maxParty();
    const dlg=el('div','dlg',`<div class="say"><span class="spk">${c.name}</span> "…북쪽으로 가는 밴이 있다고 들었다. ${id==='kangwoo'?'서울까지 가나. …태워라. 밥값은 한다.':''}"</div>
      <div class="choices">
        <button class="choice" data-r="y" ${full?'disabled':''}>태운다 <span class="req">${full?'✗ 자리가 없다':'✓ '+c.perk}</span></button>
        <button class="choice" data-r="n">지금은 어렵다</button></div>`);
    body.prepend(dlg);
    dlg.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
      if(b.hasAttribute('disabled'))return;
      if(b.dataset.r==='y'){ G.doRecruit(id);
        G.addNote({type:'인물',title:c.name,body:`${D.stls[curStl].name}에서 합류. ${c.bio}`,links:[]});
        showStl(curStl); }
      else dlg.remove();
    });
  }
  /* ── NPC 대화 ── */
  function talk(nid){
    const npc=D.npcs[nid], st=S.npcs[nid];
    if(!st.met && G.hasPerk('leo_fame')) st.att+=15;   // 길 위의 명성
    const greet = !st.met? (st.att>10? npc.greetGood : npc.greet0)
      : st.att>10? npc.greetGood : st.att<-10? npc.greetBad : npc.greet0;
    st.met=true;
    if(S.mode==='offroad'&&OFF.ready()){ return talkOff(nid, greet); }
    const body=$('#stl-body');
    const old=body.querySelector('.dlg.talk'); if(old) old.remove();
    const rumorDone = S.flags['rumor_'+nid];
    const dlg=el('div','dlg talk',`<div class="say"><span class="spk">${npc.name}</span> "${greet}"</div>
      <div class="choices">
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
        dlg.querySelector('[data-r="x2"]').onclick=()=>{ dlg.remove(); showStl(curStl); };
      }
      else if(r==='chat'){
        st.att+=3;
        const lines=[
          '"요즘 북쪽 하늘에 뭐가 자주 떠. 새는 아니야. 새는 저렇게 안 날지."',
          '"장사꾼 만수? 걔는 안 죽어. 멸망이 두 번 와도 뽕짝 틀고 다닐 걸."',
          '"정리자들 조심해. 나쁜 사람들은 아닌데… 사람이 아닌 것 같을 때가 있어."',
          '"밴 관리 잘해. 요즘 부품 구하기가 하늘의 별 따기야."',
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
      <div class="say"><span class="spk">${npc.name}</span></div>
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
    log.appendChild(el('div','cmsg '+cls, txt));
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
    let h=`<h4>${n.name} ${S.visited.includes(id)?'':'<small style="color:var(--faded)">(미방문)</small>'}</h4>
      <div class="d">${S.visited.includes(id)||n.type!=='hidden'? n.desc:'가보기 전엔 알 수 없다.'}</div>`;
    if(S.at===id) h+=`<div class="d" style="color:var(--amber)">현재 위치</div>`;
    else if(chk.ok) h+=`<button class="go" data-go="${id}">이곳으로 출발<small>${chk.km}km · 연료 약 ${chk.fuel}L</small></button>`;
    else if(S.driving) h+=`<div class="d">이동 중에는 목적지를 바꿀 수 없다</div>`;
    else h+=`<div class="d">여기서 바로 가는 길이 없다 — 경유해야 한다</div>`;
    card.innerHTML=h;
    const btn=card.querySelector('[data-go]');
    if(btn) btn.onclick=()=>{ closeOvl('#ovl-map'); G.startTravel(id); };
    card.classList.add('on');
  }
  function renderMapMini(){ $('#map-mini').textContent=`발견 ${S.known.length}/${Object.keys(D.nodes).length} · 서울까지 약 ${G.remainKm()}km`; }

  /* ── STATUS ── */
  function renderStatus(){
    $('#st-mini').textContent=`DAY ${S.day} · ${Math.round(S.stats.km)}km`;
    const b=$('#st-body');
    const bar=(v,m,warn)=>`<div class="bar"><i style="width:${clamp(v/m*100,0,100)}%${warn?';background:var(--danger)':''}"></i></div>`;
    const kmPerL=(100/G.fuelFor(100,'normal')).toFixed(1);
    const perDay=Math.max(1,G.partySize()-(G.hasPerk('kw_ration')&&G.partySize()>1?1:0));
    const knownN=S.known.filter(id=>!D.nodes[id].secret).length;
    const totalN=Object.keys(D.nodes).filter(id=>!D.nodes[id].secret).length;
    const stlVisited=Object.keys(D.stls).filter(sid=>S.visited.some(v=>D.nodes[v].stl===sid)).length;
    let h='';
    /* 운전사 */
    const dlv=G.driverLv(), dNext=D.driverLv[dlv+1];
    h+=`<div class="st-sec"><h4>🧑‍✈️ 운전사</h4>
      <div class="st-row"><span class="k">나</span><span class="v" style="flex:1">Lv.${dlv} 「${G.driverTitle()}」 <small style="color:var(--faded)">연비 -${dlv*2}% · 피로 -${dlv*7}%</small></span></div>
      ${dNext?`<div class="st-row"><span class="k">다음 숙련</span>${bar(S.stats.km-D.driverLv[dlv].km, dNext.km-D.driverLv[dlv].km)}<span class="v">${Math.round(S.stats.km)}/${dNext.km}km</span></div>`:''}
      <div class="st-row"><span class="k">피로 ${ICO('fatigue_'+G.fatigueStage(), G.fatigueFace())}</span>${bar(S.fatigue,100,S.fatigue>=75)}<span class="v">${Math.floor(S.fatigue)}%</span></div>
      <div class="csub">피로 85%↑ 주행 시 졸음이 온다. 야영·숙박으로 회복.</div></div>`;
    /* 달구지 */
    h+=`<div class="st-sec"><h4>🚐 달구지 1호</h4>
      <div class="st-row"><span class="k">내구도</span>${bar(S.van,S.vanMax,S.van<25)}<span class="v">${Math.floor(S.van)}/${S.vanMax}</span></div>
      <div class="st-row"><span class="k">연료</span>${bar(S.fuel,S.fuelMax,S.fuel<10)}<span class="v">${Math.floor(S.fuel)}/${S.fuelMax}L</span></div>
      <div class="st-row"><span class="k">연비</span><span class="v" style="flex:1">${kmPerL} km/L ${S.wx!=='clear'?`<small style="color:var(--faded)">(${D.wx[S.wx].nm} 반영)</small>`:''}</span></div>
      <div class="st-row"><span class="k">좌석</span><span class="v" style="flex:1">${S.party.length} / ${G.maxParty()}${S.dog?' + 보리':''}</span></div>
      <div style="margin-top:8px" class="upchips">${D.upgrades.map(u=>
        `<span class="upchip ${S.up[u.id]?'':'off'}">${u.ic} ${u.nm}</span>`).join('')}</div>
      <div class="csub" style="margin-top:7px">개조는 정착지 정비소에서. 장착하면 달구지 겉모습도 바뀐다.</div></div>`;
    /* 보급 */
    h+=`<div class="st-sec"><h4>🎒 보급</h4>
      <div class="st-row"><span class="k">${ICO('water')}물</span><span class="v" style="flex:1">${S.water} <small style="color:var(--faded)">≈ ${Math.floor(S.water/perDay)}일치</small></span></div>
      <div class="st-row"><span class="k">${ICO('food')}식량</span><span class="v" style="flex:1">${S.food} <small style="color:var(--faded)">≈ ${Math.floor(S.food/perDay)}일치</small></span></div>
      <div class="st-row"><span class="k">${ICO('scrap')}고철</span><span class="v" style="flex:1">${S.scrap}</span></div>
      <div class="st-row"><span class="k">아이템</span><span class="v" style="flex:1">${['부품','의약품','탄약'].map(k=>`${ICO(ITEM_ICO[k])}${k} ${S.items[k]||0}`).join(' · ')}</span></div>
      ${S.flags.armed_age?`<div class="st-row"><span class="k">무기</span><span class="v" style="flex:1">${['쇠파이프','석궁','볼트','화염병'].map(k=>`${k} ${S.items[k]||0}`).join(' · ')}</span></div>`:''}
      ${S.quest?`<div class="st-row"><span class="k">${ICO('quest','📦')}의뢰</span><span class="v" style="flex:1">${S.quest.item} → ${D.nodes[S.quest.to].name} <span style="color:${S.quest.due-S.day<=1?'var(--danger)':'var(--faded)'}">D-${Math.max(0,S.quest.due-S.day)}</span></span></div>`:''}</div>`;
    /* 여정 */
    h+=`<div class="st-sec"><h4>🧭 여정</h4>
      <div class="st-row"><span class="k">날짜 / 주행</span><span class="v" style="flex:1">DAY ${S.day} · ${Math.round(S.stats.km)}km · 서울까지 약 ${G.remainKm()}km</span></div>
      <div class="st-row"><span class="k">이벤트</span><span class="v" style="flex:1">${S.stats.events}건</span></div>
      <div class="st-row"><span class="k">발견</span>${bar(knownN,totalN)}<span class="v">${knownN}/${totalN}</span></div>
      <div class="st-row"><span class="k">정착지</span><span class="v" style="flex:1">${stlVisited}/${Object.keys(D.stls).length} 방문</span></div>
      <div class="st-row"><span class="k">${ICO('pursuit')}천리안 관측</span><span class="v" style="flex:1;color:${S.pursuit>2?'var(--danger)':'inherit'}">${'◉'.repeat(S.pursuit)||'—'} (${S.pursuit}/5)</span></div>
      ${S.flags.seoulTries?`<div class="st-row"><span class="k">남산 시도</span><span class="v" style="flex:1;color:var(--cheollian)">${S.flags.seoulTries}회 — "아직입니다"</span></div>`:''}</div>`;
    /* 이야기 */
    const stories=Object.keys(D.comps).map(id=>{
      const c=D.comps[id], st=S.comps[id], p3=c.perks[3];
      const state= st.perks.includes(p3.id)? 'done': G.hasComp(id)? 'lv'+st.lvl : 'no';
      return {id,c,st,p3,state};
    });
    h+=`<div class="st-sec"><h4>★ 이야기 (밴에 실린 것들)</h4>`+
      stories.map(s=>`<div class="st-row" data-comp2="${s.id}" style="cursor:pointer">
        <span class="k">${s.c.face} ${s.c.name}</span>
        <span class="v" style="flex:1;color:${s.state==='done'?'var(--cheollian)':s.state==='no'?'var(--dim)':'inherit'}">
        ${s.state==='done'?`★ 「${s.p3.nm}」 완료`: s.state==='no'?`<small>${D.compWhere[s.id]||'아직 만나지 못했다'}</small>`:`Lv.${s.st.lvl} · 유대 ${s.st.bond}${s.st.pending?' ✦퍼크 대기':''}`}</span></div>`).join('')+
      `<div class="csub" style="margin-top:7px">그것은 말했다 — "전부 싣고 오세요."</div></div>`;
    b.innerHTML=h;
    b.querySelectorAll('[data-comp2]').forEach(r=>r.onclick=()=>{ const id=r.dataset.comp2;
      if(G.hasComp(id)) showComp(id); });
  }

  /* ── JOURNAL ── */
  function renderJournal(){
    $('#j-mini').textContent=`${S.notes.length}개의 기록`;
    const log=$('#jp-log');
    if(!S.notes.length){ log.innerHTML='<div class="sub">아직 기록이 없다.</div>'; return; }
    log.innerHTML=[...S.notes].reverse().map(n=>`
      <div class="note"><div class="nh"><span class="nt ${n.type}">${n.type}</span><b>${n.title}</b><span class="nd">DAY ${n.day}</span></div>
      <p>${fmt(n.body)}</p>
      ${n.links.length?`<div class="links">${n.links.map(l=>`<span class="lk">[[${l}]]</span>`).join('')}</div>`:''}</div>`).join('');
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

  /* ── ENDING ── */
  function showEnding(kind){
    SND.setDriving(false);
    const e=$('#scr-end');
    let kicker,title,body,kcolor='var(--amber)';
    if(kind==='thirst'){
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='물이 먼저 끝났다';
      body=`사흘째 되는 날, 더는 운전대를 잡을 힘이 없었다.\n\n달구지는 길가에 얌전히 서 있다. 언젠가 다른 여행자가 이 밴을 발견하고, 조수석의 일지를 읽게 될지도 모른다.\n\n일지의 마지막 장에는 이렇게 적혀 있다.\n\n"물을 아껴라. 사람은 아끼지 말고."`;
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
    $('#end-journal').onclick=()=>{ $('#ovl-journal').classList.add('on'); renderJournal(); };
    $('#end-new').onclick=()=>{ closeOvl('#ovl-journal'); show('scr-title'); refreshTitle(); };
  }

  return {boot, modalOpen, renderAll, renderHud, speak, toast, showEvent, showEnding,
    showNodeCard, showGraphNote, onDepart, onArrive, showStl};
})();

/* ═══════════════════ SOUND (미니멀 신스) ═══════════════════ */
const SND = (()=>{
  let ac=null, on=false, engineGain=null, noiseSrc=null;
  function build(){
    ac=new (window.AudioContext||window.webkitAudioContext)();
    const buf=ac.createBuffer(1, ac.sampleRate*2, ac.sampleRate);
    const d=buf.getChannelData(0);
    let last=0;
    for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; }
    noiseSrc=ac.createBufferSource(); noiseSrc.buffer=buf; noiseSrc.loop=true;
    const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=120;
    engineGain=ac.createGain(); engineGain.gain.value=0;
    noiseSrc.connect(lp); lp.connect(engineGain); engineGain.connect(ac.destination);
    noiseSrc.start();
  }
  function toggle(){
    if(!ac){ try{ build(); }catch(e){ return; } }
    on=!on;
    if(ac.state==='suspended') ac.resume();
    $('#dk-sound').querySelector('.dic').textContent= on?'🔊':'🔇';
    setDriving(S&&S.driving&&!UI.modalOpen());
  }
  function setDriving(driving){
    if(!ac||!engineGain) return;
    const target= on? (driving?0.16:0.05):0;
    engineGain.gain.linearRampToValueAtTime(target, ac.currentTime+0.8);
  }
  return {toggle, setDriving};
})();
