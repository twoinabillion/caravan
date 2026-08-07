/* ═══════════════════ UI ═══════════════════
   하나의 IIFE다. 2026-08-06에 파일 넷으로 '분할'했지만 IIFE가 파일 경계를
   가로질러 07a·07d는 단독 파싱조차 되지 않았다 — 나눈 것이 아니라 자른 것이었다.
   진짜 모듈화(공유 상태를 객체로 올리고 파일별 IIFE로 분리)는 별도 작업으로 남기고,
   지금은 스스로 완결되는 한 파일로 되돌린다. 소리(07e)는 이미 독립 모듈이다. */
/* ═══════════════════ UI ═══════════════════ */
const $ = (s)=>document.querySelector(s);
const el = (tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };

const UI = (()=>{
  let screen='title';          // title|mode|name|intro|game|end
  let bgmEvKey=null;           // 현재 이벤트의 BGM 힌트 (tension/story)
  let introIdx=0, introTurnIdx=0, pendingMode='onroad', pendingName='', pendingProfile='keeper';
  function renderProfilePick(){
    const box=$('#profile-pick'); if(!box) return;
    box.innerHTML=Object.entries(D.startProfiles||{}).map(([id,p])=>
      `<button type="button" class="profile-card${id===pendingProfile?' on':''}" role="radio"
         aria-checked="${id===pendingProfile}" data-profile="${id}">
         <span class="profile-ic">${p.ic}</span><b>${p.nm}</b><small>${p.d}</small></button>`).join('');
    box.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{ pendingProfile=b.dataset.profile; renderProfilePick(); });
  }
  let introAuto=localStorage.getItem('caravan_intro_auto')!=='0', introAutoTimer=0;
  let arrivalTimer=0;
  const savedMotion=localStorage.getItem('caravan_ui_motion');
  const uiPrefs={
    largeText:localStorage.getItem('caravan_ui_text')==='large',
    reduceMotion:savedMotion?savedMotion==='reduced':Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  };
  function applyUiPrefs(){
    const root=document.documentElement;
    root.classList.toggle('ui-large-text',uiPrefs.largeText);
    root.classList.toggle('ui-reduce-motion',uiPrefs.reduceMotion);
    root.dataset.uiText=uiPrefs.largeText?'large':'normal';
    root.dataset.uiMotion=uiPrefs.reduceMotion?'reduced':'full';
  }
  const tossRuntime=Boolean(window.ReactNativeWebView||/\.tossmini\.com$/i.test(location.hostname)||/Toss/i.test(navigator.userAgent));
  const localOffroad=location.protocol==='file:'&&!tossRuntime;
  const previewEpisodes=[
    {scene:'intro-camper-conversion',kind:'PROLOGUE · 달구지',title:'비를 피하는 집',
      text:'용달 트럭의 적재함을 늘리고, 침상과 수납장을 달아 길 위의 집으로 바꾼다.'},
    {scene:'recruit-minji-task',kind:'COMPANION · 의뢰',title:'고철 산의 불꽃',
      text:'사람을 태우기 전에 먼저 그 사람이 끝내지 못한 일을 함께 해결해야 한다.'},
    {scene:'gwangju-market',kind:'SETTLEMENT · 광주',title:'폐허에도 장은 선다',
      text:'도시마다 다른 시장과 주민, 소문과 부탁이 달구지를 기다린다.'},
    {scene:'trace-cortis-relic',kind:'DISCOVERY · 2026년의 흔적',title:'이게 대체 뭐였을까',
      text:'143년 전의 유행과 물건은 뜻을 잃은 채 보물처럼 다시 발견된다.'},
    {scene:'library-bus',kind:'SIDE STORY · 이동 도서관',title:'책을 싣고 다니는 사람',
      text:'서울로 가는 일과 무관해 보여도, 누군가에겐 오늘 꼭 필요한 여정이 있다.'},
    {scene:'combat-drone-swarm',kind:'COMBAT · 추격',title:'빗속의 탐색등',
      text:'정면 돌파, 우회, 동료의 기술. 같은 위기도 준비와 선택에 따라 달라진다.'},
    {scene:'ridge-memorial',kind:'REGION · 대관령',title:'바람이 기억하는 이름',
      text:'항구와 시장, 터널과 고개까지 지나온 지역이 각자의 풍경과 기억을 남긴다.'},
    {scene:'full-house-meal',kind:'VAN LIFE · 동행',title:'빈자리 없는 저녁',
      text:'확장한 달구지 안에서 함께 먹고, 다투고, 화해하며 진짜 동료가 되어 간다.'}
  ];

  /* ── modal state ── */
  const focusableSel='button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function openModal(sel,preferred){
    const node=typeof sel==='string'?$(sel):sel;
    if(!node) return;
    if(!node.classList.contains('on')) node._returnFocus=document.activeElement;
    node.classList.add('on');
    node.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>{
      const target=(preferred&&node.querySelector(preferred))||node.querySelector(focusableSel);
      if(target) target.focus({preventScroll:true});
    });
  }
  function closeModal(sel,restore=true){
    const node=typeof sel==='string'?$(sel):sel;
    if(!node) return;
    node.classList.remove('on');
    node.setAttribute('aria-hidden','true');
    const back=node._returnFocus;
    node._returnFocus=null;
    if(restore&&back&&back.isConnected) requestAnimationFrame(()=>back.focus({preventScroll:true}));
  }
  function activeModal(){
    return ['#intro-summary','#ev-wrap','#ovl-seoul','#ovl-stl','#ovl-map','#ovl-journal','#ovl-status']
      .map($).find(node=>node&&node.classList.contains('on'))||null;
  }
  const modalOpen = ()=> screen!=='game' || $('#ev-wrap').classList.contains('on')
    || $('#ovl-stl').classList.contains('on') || $('#ovl-map').classList.contains('on')
    || $('#ovl-journal').classList.contains('on') || $('#ovl-status').classList.contains('on')
    || $('#ovl-seoul').classList.contains('on');

  /* ── screens ── */
  function show(id){
    document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
    $('#scr-game').classList.remove('on');
    screen=id.replace('scr-','');
    $('#app').dataset.screen=screen;
    const earlySound=$('#early-sound');
    if(earlySound) earlySound.hidden=!['title','preview','mode','name','intro'].includes(screen);
    $('#'+id).classList.add('on');
  }

  /* ── boot ── */
  function boot(){
    applyUiPrefs();
    SCENE.init($('#cv'));
    SCENE.initTitle($('#titlecv'));
    MAPR.init($('#mapcv'));
    MAPR.initMini($('#minimap'));
    $('#minimap').onclick=()=>{ toggleOvl('#ovl-map'); MAPR.resize(); renderMapMini(); renderMission(); };
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
    const lastBox=$('#last-journey');
    const last=G.qualityArchive().slice(-1)[0];
    if(lastBox){
      lastBox.hidden=!last;
      if(last) lastBox.innerHTML=previousJourneyHtml(last,true);
    }
  }
  function previousJourneyHtml(last,compact=false){
    const route=D.routePlans&&D.routePlans[last.route];
    const other=Object.values(D.routePlans||{}).find(def=>!route||def.id!==route.id);
    const party=(last.party||[]).map(id=>D.comps[id]&&D.comps[id].name).filter(Boolean);
    const build=last.vanBuild&&last.vanBuild.name||'기록되지 않은 달구지';
    const routeRow=last.summary&&last.summary.routes&&last.route&&last.summary.routes[last.route]?
      last.summary.routes[last.route]:{};
    const routeResult=routeRow&&routeRow.completed? '완주':'미완주';
    const routeState=route?`${routeResult} · 선택 ${routeRow.chosen||0}회`:'';
    const lastChoices=Array.isArray(last.choices)?last.choices:[];
    const choiceCount=lastChoices.length;
    if(compact) return `<span>PREVIOUS JOURNEY</span><b>${route?esc(route.name):'지난 길'} · ${esc(build)}</b><small>DAY ${last.day||'?'} · ${last.km||0}km · ${party.length?party.map(esc).join(' · '):'혼자 달린 기록'} · ${routeState||'노선 미기록'}</small>`;
    return `<div class="previous-journey-head"><span>YOUR LAST ROAD</span><b>${route?esc(route.name):'지난 여정의 길'} · ${esc(build)}</b></div>
      <div class="previous-journey-facts"><span>DAY ${last.day||'?'}</span><span>${last.km||0}km</span><span>동료 ${party.length}명</span><span>기억된 선택 ${choiceCount}개</span></div>
      <p>${party.length?`${party.map(esc).join(' · ')}와 함께 달렸다.`:'혼자 시작한 달구지의 기록이 남아 있다.'}</p>
      <div class="next-road-rumor"><small>노선 기록</small><b>${route?esc(route.name):'기록된 노선 없음'}</b><span>${routeState||'방향/결과 기록 없음'}</span></div>
      ${choiceCount>3?`<div class="next-road-rumor"><small>회상 포인트</small><b>최근 선택</b><span>${esc(lastChoices[0]?.summary||'기억에서 사라졌습니다.')}</span><span>${esc(lastChoices[1]?.summary||'추가 기록이 적습니다.')}</span></div>`:''}
      ${other?`<div class="next-road-rumor"><small>이번에는 다른 소문</small><b>${esc(other.name)}</b><span>${esc(other.promise)}</span></div>`:''}`;
  }

  /* ── main loop ── */
  let last=0, lastVisual=0, hudCd=0, bgmCd=0;
  function bgmKey(){
    if(screen==='title'||screen==='mode'||screen==='intro') return 'title';
    if(screen==='end') return 'story';
    if(!S) return 'title';
    if(bgmEvKey && $('#ev-wrap').classList.contains('on')) return bgmEvKey;
    if($('#ovl-stl').classList.contains('on')) return 'settlement';
    const night=G.isNight();
    if(!S.driving && night) return 'camp';
    return night? 'drive_night':'drive_day';
  }
  function loop(ts){
    const dt=Math.min(0.05,(ts-last)/1000||0.016); last=ts;
    const drawFrame=!uiPrefs.reduceMotion||ts-lastVisual>=80;
    if(drawFrame) lastVisual=ts;
    bgmCd-=dt; if(bgmCd<=0){ bgmCd=0.4; BGM.tick(bgmKey()); }
    if(screen==='title'&&drawFrame) SCENE.drawTitle(dt);
    else if(screen==='game'||screen==='end'){
      if(screen==='game'&&!S?.ended) G.tick(dt);
      if(screen==='game'&&drawFrame){
        SCENE.draw(dt);
        MAPR.drawMini(dt);
        hudCd-=dt; if(hudCd<=0){ hudCd=0.25; renderHud(); renderMission(); if(S&&S.driving) renderTravelbar(); }
        if($('#ovl-map').classList.contains('on')) MAPR.draw(dt);
        if($('#jgraphwrap').classList.contains('on')) GRAPH.draw(dt);
      }
    }
    requestAnimationFrame(loop);
  }

  /* ── wiring ── */
  function wire(){
    /* div/canvas로 만든 조작 카드도 Enter·Space로 실제 버튼처럼 작동한다. */
    document.addEventListener('keydown',e=>{
      const modal=activeModal();
      /* 지도 키보드 여행 — [/]로 갈 수 있는 이웃을 순회하고 Enter로 출발한다.
         지도가 캔버스라 이 배선이 없으면 여행은 마우스 전용이다(2026-08-07). */
      const mapOvl=document.querySelector('#ovl-map');
      if(mapOvl&&mapOvl.classList.contains('on')&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){
        if(e.key==='['||e.key===']'){
          e.preventDefault();
          const nbs=(G.neighbors(S.at)||[]).filter(n=>{ try{ return G.canTravelTo(n.id).ok; }catch(err){ return false; } });
          if(nbs.length){
            const ids=nbs.map(n=>n.id);
            let idx=ids.indexOf(mapKbFocus);
            idx=e.key===']'?(idx+1)%ids.length:(idx-1+ids.length)%ids.length;
            mapKbFocus=ids[idx];
            showNodeCard(mapKbFocus);
          }
          return;
        }
        if(e.key==='Enter'&&mapKbFocus){
          const btn=document.querySelector('#nodecard [data-go]');
          if(btn){ e.preventDefault(); btn.click(); mapKbFocus=null; return; }
        }
      }
      /* 선택지 숫자키 — 카드에 이미 번호가 그려져 있다(choice-index). 게임의 대부분이
         선택이므로 이것이 키보드 완주의 중심 배선이다. */
      if(modal&&/^[1-9]$/.test(e.key)&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){
        const cards=[...modal.querySelectorAll('button.choice:not([disabled])')].filter(x=>x.offsetParent!==null);
        const card=cards[Number(e.key)-1];
        if(card){ e.preventDefault(); card.click(); return; }
      }
      if(modal&&e.key==='Tab'){
        const items=[...modal.querySelectorAll(focusableSel)].filter(x=>x.offsetParent!==null);
        if(items.length){
          const first=items[0], last=items[items.length-1];
          if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
          else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
        }
      }
      if(modal&&e.key==='Escape'&&modal.id!=='ev-wrap'&&modal.id!=='ovl-seoul'){
        e.preventDefault();
        if(modal.id==='intro-summary') closeModal(modal);
        else closeOvl('#'+modal.id);
        return;
      }
      if(screen==='intro'&&!modal&&!e.target.closest('button, input, select, textarea, [role="dialog"]')&&(e.key==='Enter'||e.key===' ')){
        e.preventDefault();
        nextIntro();
        return;
      }
      const b=e.target.closest&&e.target.closest('[role="button"]');
      if(!b||b.tagName==='BUTTON'||(e.key!=='Enter'&&e.key!==' ')) return;
      e.preventDefault(); b.click();
    });
    $('#bt-new').onclick=()=>{
      if(localOffroad){ show('scr-mode'); envCheckUI(); }
      else startNew('onroad');
    };
    const bs=$('#bt-song');
    if(bs){
      if(!(D.bgm&&D.bgm.song)) bs.style.display='none';
      else bs.onclick=()=>{ SND.enable(true); BGM.toggleSong(); };
    }
    $('#bt-continue').onclick=()=>{ SND.enable(); if(G.load()){ enterGame(); } };
    $('#bt-preview').onclick=()=>{ renderPreview(); show('scr-preview'); $('#preview-scroll').scrollTop=0; };
    $('#bt-previewback').onclick=()=>show('scr-title');
    $('#bt-previewnew').onclick=()=>{
      if(localOffroad){ show('scr-mode'); envCheckUI(); }
      else startNew('onroad');
    };
    const nameGo=()=>{
      pendingName=($('#inp-name').value||'').trim().slice(0,8);
      introIdx=0; introTurnIdx=0;
      /* 이름 확인은 모바일 브라우저가 허용하는 명시적 사용자 제스처다.
         여기서 오디오를 열어 프롤로그 환경음도 실제로 들리게 한다. */
      SND.enable();
      renderIntro(true);
      show('scr-intro');
    };
    $('#bt-name').onclick=nameGo;
    $('#inp-name').addEventListener('keydown',e=>{
      if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); nameGo(); }
    });
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
    let introPointer=null;
    $('#scr-intro').addEventListener('pointerdown',e=>{
      if(e.target.closest('#intro-skip,#intro-auto,#intro-summary')) return;
      introPointer={x:e.clientX,y:e.clientY};
    });
    $('#scr-intro').addEventListener('pointerup',e=>{
      if(!introPointer||e.target.closest('#intro-skip,#intro-auto,#intro-summary')) return;
      const moved=Math.hypot(e.clientX-introPointer.x,e.clientY-introPointer.y);
      introPointer=null;
      if(moved<12) nextIntro();
    });
    $('#intro-auto').onclick=e=>{
      e.stopPropagation();
      introAuto=!introAuto;
      localStorage.setItem('caravan_intro_auto',introAuto?'1':'0');
      renderIntro(false);
    };
    $('#intro-skip').onclick=e=>{
      e.stopPropagation();
      clearIntroAuto();
      openModal('#intro-summary','#intro-summary-start');
    };
    $('#intro-summary-continue').onclick=e=>{
      e.stopPropagation();
      closeModal('#intro-summary');
      scheduleIntroAuto();
    };
    $('#intro-summary-start').onclick=e=>{ e.stopPropagation(); skipIntro(); };
    $('#dk-map').onclick=()=>{ toggleOvl('#ovl-map'); MAPR.resize(); renderMapMini(); renderMission(); };
    $('#dk-journal').onclick=()=>{ toggleOvl('#ovl-journal'); renderJournal(); };
    $('#dk-camp').onclick=()=>{
      if(S&&!S.driving&&!UI.modalOpen()) AMBI.play('sfx_camp_loop',.32);
      G.camp();
    };
    $('#dk-sound').onclick=()=>SND.toggle();
    $('#early-sound').onclick=()=>SND.toggle();
    $('#dk-status').onclick=()=>{ toggleOvl('#ovl-status'); renderStatus(); };
    $('#mission-strip').onclick=()=>{ toggleOvl('#ovl-status'); stTab='journey'; renderStatus(); };
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
    document.querySelectorAll('#st-tabs button').forEach(b=>b.onclick=()=>{
      stTab=b.dataset.st;
      renderStatus();
    });
    $('#st-tabs').addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key)) return;
      const tabs=[...document.querySelectorAll('#st-tabs button')];
      const current=tabs.indexOf(document.activeElement);
      const next=(current+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      e.preventDefault(); tabs[next].click(); tabs[next].focus();
    });
  }

  function renderPreview(){
    const grid=$('#preview-grid');
    const previous=$('#previous-journey');
    const last=G.qualityArchive().slice(-1)[0];
    if(previous){
      previous.hidden=!last;
      previous.innerHTML=last?previousJourneyHtml(last,false):'';
    }
    if(grid.childElementCount) return;
    previewEpisodes.forEach((episode,index)=>{
      const card=el('article','preview-card');
      const img=el('img');
      img.src=(D.scenes&&D.scenes[episode.scene])||'';
      img.alt=`${episode.title} 게임 장면`;
      img.loading=index<2?'eager':'lazy';
      img.decoding='async';
      const copy=el('div','preview-copy');
      const no=el('span','preview-no',`${String(index+1).padStart(2,'0')} / ${String(previewEpisodes.length).padStart(2,'0')}`);
      const kind=el('span','preview-kind',episode.kind);
      const title=el('h3',null,episode.title);
      const text=el('p',null,episode.text);
      copy.append(no,kind,title,text);
      card.append(img,copy);
      grid.append(card);
    });
  }
  async function envCheckUI(){
    const lock=$('#offlock'), key=$('#offkey'), msg=$('#offmsg');
    if(!localOffroad){
      lock.textContent='공개 앱에서는 온로드 이야기만 제공됩니다.';
      key.classList.remove('on');
      return;
    }
    if(OFF.ready()){ lock.textContent='🔓 연결됨 — '+OFF.model; key.classList.remove('on'); return; }
    lock.textContent='환경 확인 중…';
    const ok = await OFF.checkReachable();
    if(ok){ lock.innerHTML='🔑 Anthropic API 키가 필요합니다 (카드를 누르면 입력창이 열립니다)<br>키는 이 로컬 브라우저에만 저장됩니다.'; }
    else { lock.innerHTML='🔒 현재 브라우저가 외부 API 연결을 허용하지 않습니다.<br>오프로드는 내려받은 게임 HTML을 로컬에서 열었을 때만 사용할 수 있습니다.'; }
  }
  function startNew(mode){
    pendingMode=mode; pendingName=''; introIdx=0; introTurnIdx=0;
    show('scr-name'); renderProfilePick();
    const skip=$('#intro-skip');
    if(skip){
      skip.hidden=false;
      skip.textContent=localStorage.getItem('caravan_intro_seen')?'이미 본 프롤로그 요약':'프롤로그 핵심 요약';
    }
    const portrait=$('#name-child');
    if(portrait) portrait.src=D.portraits.player_child||'';
    setTimeout(()=>{ const i=$('#inp-name'); if(i){ i.value=''; i.focus(); } },80);
  }
  function introName(){ return pendingName||'나'; }
  function personalizedIntroBeat(raw){
    const beat={...raw};
    if(beat.who==='player_child') beat.name=`${introName()} · 8살`;
    else if(beat.who==='me') beat.name=introName();
    return beat;
  }
  function clearIntroAuto(){
    if(introAutoTimer){ clearTimeout(introAutoTimer); introAutoTimer=0; }
  }
  function updateIntroAuto(){
    const b=$('#intro-auto'); if(!b) return;
    b.textContent=introAuto?'자동 ON':'자동 OFF';
    b.setAttribute('aria-pressed',String(introAuto));
    b.setAttribute('aria-label',introAuto?'프롤로그 자동 진행 켜짐. 누르면 멈춥니다':'프롤로그 자동 진행 꺼짐. 누르면 켭니다');
  }
  function scheduleIntroAuto(){
    clearIntroAuto(); updateIntroAuto();
    if(!introAuto||introIdx>=D.intro.length) return;
    const page=D.intro[introIdx], beats=page&&page.beats||[];
    const beat=beats[Math.min(introTurnIdx,Math.max(0,beats.length-1))];
    const chars=stripTags(beat&&beat.text||'').length;
    const delay=Math.max(1900,Math.min(5200,800+chars*55));
    introAutoTimer=setTimeout(()=>{ introAutoTimer=0; if(screen==='intro'&&!document.hidden) nextIntro(); },delay);
  }
  function renderIntro(newPage){
    const page=D.intro[introIdx], scene=D.scenes&&D.scenes[page.scene];
    if(newPage){
      VO.stop();
      AMBI.intro(page.scene);
      /* 인트로는 화자별 턴이다. 현재 장면과 정확히 맞는 음성이
         명시된 경우에만 재생하고, 구형 intro1~5 장문 음성은 쓰지 않는다. */
      if(page.voice) VO.play(page.voice);
    }
    const beats=page.beats&&page.beats.length?page.beats:[{kind:'narration',text:page.text||''}];
    const introBeats=beats.map(personalizedIntroBeat);
    $('#intro-img').src=scene||'';
    $('#intro-img').alt=`${page.title} 장면`;
    $('#intro-era').textContent=page.era||'';
    $('#intro-count').textContent=`${introIdx+1} / ${D.intro.length} · ${introTurnIdx+1} / ${beats.length}`;
    $('#intro-title').textContent=page.title||'';
    $('#intro-txt').innerHTML=storyReaderHtml(introBeats,introTurnIdx,{intro:true});
    const live=$('#story-live'), current=introBeats[Math.min(introTurnIdx,introBeats.length-1)];
    if(live&&current) live.textContent=`${current.kind==='dialogue'?(current.name||speakerInfo(current.who).name)+'의 말: ':'장면 설명: '}${stripTags(current.text)}`;
    const nextBeat=introBeats[introTurnIdx+1];
    const manualHint=nextBeat
      ? nextBeat.kind==='dialogue'?'탭하면 다음 말풍선':'탭하면 다음 장면'
      : '탭하면 다음 장';
    $('#intro-hint').textContent=introAuto?`자동으로 이어집니다 · ${manualHint}`:manualHint;
    const book=$('#intro-book');
    if(newPage){
      book.style.opacity=0;
      $('#intro-page').scrollTop=0;
      requestAnimationFrame(()=>{ book.style.transition='opacity .45s'; book.style.opacity=1; });
    } else {
      const turn=$('#intro-txt [data-story-entry]:last-child');
      if(turn){
        turn.classList.add('turn-enter');
        requestAnimationFrame(()=>{
          turn.classList.remove('turn-enter');
          const pageBody=$('#intro-page');
          if(pageBody) pageBody.scrollTo({top:pageBody.scrollHeight,behavior:'auto'});
        });
      }
    }
    scheduleIntroAuto();
  }
  function nextIntro(){
    clearIntroAuto();
    const page=D.intro[introIdx];
    const beats=page&&page.beats&&page.beats.length?page.beats:[{kind:'narration',text:page?.text||''}];
    if(introTurnIdx<beats.length-1){
      introTurnIdx++;
      renderIntro(false);
      return;
    }
    introIdx++;
    introTurnIdx=0;
    if(introIdx>=D.intro.length){
      localStorage.setItem('caravan_intro_seen','1');
      AMBI.setLoop(null);
      G.newGame(pendingMode,pendingName,'full',pendingProfile); enterGame();
    }
    else renderIntro(true);
  }
  function skipIntro(){
    clearIntroAuto();
    const entryMode=$('#intro-summary').classList.contains('on')?'summary':'skip';
    closeModal('#intro-summary',false);
    introIdx=D.intro.length;
    introTurnIdx=0;
    if(screen==='name') pendingName=($('#inp-name').value||'').trim().slice(0,8);
    localStorage.setItem('caravan_intro_seen','1');
    AMBI.setLoop(null);
    G.newGame(pendingMode,pendingName,entryMode,pendingProfile);
    enterGame();
  }
  function enterGame(){
    if(!localOffroad&&S.mode==='offroad') S.mode='onroad';
    G.qualitySessionStart();
    G.qualitySettlementEnter(S.at);
    show('scr-game'); screen='game';
    applyIcons();
    renderAll();
    if(localOffroad&&S.mode==='offroad'&&!OFF.ready()) toast('📡 오프로드 연결 없음 — 온로드 이벤트로 대체됩니다');
    if(S.flags&&S.flags.seoul_open&&!S.ended) setTimeout(showSeoul, 400);   // 서울 안에서 이어하기
  }

  /* ── overlays ── */
  function toggleOvl(sel){ const o=$(sel);
    const opening=!o.classList.contains('on');
    document.querySelectorAll('.ovl').forEach(x=>{ if(x!==o) closeModal(x,false); });
    if(opening) openModal(o,'.x, button');
    else closeModal(o);
    if(!opening&&sel==='#ovl-map') $('#nodecard').classList.remove('on');
  }
  function closeOvl(sel){
    closeModal(sel);
    if(sel==='#ovl-map') $('#nodecard').classList.remove('on');
    if(sel==='#ovl-stl'&&typeof AMBI!=='undefined') AMBI.restore();
  }

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
    const roadKicker=$('#road-status-kicker'), roadPlace=$('#road-status-place'), roadMeta=$('#road-status-meta');
    if(roadKicker&&roadPlace&&roadMeta){
      if(S.driving){
        const d=S.driving, left=Math.max(0,Math.round(d.dist-d.gone));
        roadKicker.textContent='ON THE ROAD';
        roadPlace.textContent=`${D.nodes[d.from].name} → ${D.nodes[d.to].name}`;
        roadMeta.textContent=`${left}km 남음 · ${d.road||'북쪽으로 이어지는 길'}`;
      } else {
        roadKicker.textContent='CURRENT STOP';
        roadPlace.textContent=D.nodes[S.at].name;
        roadMeta.textContent=D.nodes[S.at].type==='goal'?'목적지 도착':'정차 중 · 다음 길을 고른다';
      }
    }
    renderDeskRail();
  }

  /* 넓은 화면의 죽은 여백을 여정 요약으로 바꾼다. 새 시스템이 아니라
     이미 있는 정보(시한·노선·동행·장부)의 재배치다. */
  function renderDeskRail(){
    const rail=$('#desk-rail');
    if(!rail) return;
    if(!S||screen!=='game'||window.innerWidth<1200){ rail.hidden=true; return; }
    rail.hidden=false;
    const t=G.transferStatus();
    const route=G.routeStatus();
    const party=S.party.map(id=>D.comps[id].name);
    rail.innerHTML=`
      <div class="rail-sec"><h4>이송 시계</h4>
        <b>${esc(t.short)}</b><small>${esc(t.mission)}</small></div>
      <div class="rail-sec"><h4>여정</h4>
        <b>DAY ${S.day} · ${Math.round(S.stats.km)}km</b>
        <small>서울까지 약 ${G.remainKm()}km · 사건 ${S.stats.events}건</small></div>
      ${route?`<div class="rail-sec"><h4>노선</h4><b>${esc(route.def.mark)} ${esc(route.def.name)}</b>
        <small>${route.done}/${route.total} 구간 · ${route.complete?'완주':'진행 중'}</small></div>`:''}
      <div class="rail-sec"><h4>달구지</h4>
        <b>${esc(G.vanStage().nm)}</b>
        <small>탑승 ${S.party.length+1}/${G.maxParty()+1}${S.dog?' + 보리':''} · 탑재 ${G.upWeight()}pt</small>
        ${party.length?`<p>${party.map(esc).join(' · ')}</p>`:'<p>아직 혼자 달린다.</p>'}</div>`;
  }

  function missionHtml(){
    const q=S.quest, rq=S.recruitQ;
    const transfer=G.transferStatus();
    const danger=S.fuel<10||S.fatigue>=75||(q&&q.due-S.day<=1)||!transfer.onTime;
    let kicker='', title='', state='', meta='', pct=0, secondary='';
    const secondaryMissions=[];
    if(rq){
      const def=D.recruitQuests[rq.id];
      kicker=`인연 · ${def.name}`;
      title=def.title;
      if(rq.stage==='ready'){
        state='두 과제 완료 · 본인이 자리를 고를 차례';
        meta='합류 대기';
        pct=100;
      } else if(rq.stage==='road'){
        state='첫 과제 완료 · 한 구간 임시 동행';
        meta=S.driving?'한 구간 이동 중':'다음 길을 고른다';
        pct=S.driving?Math.min(78,58+S.driving.gone/S.driving.dist*20):58;
      } else if(rq.stage==='follow'){
        const target=D.nodes[rq.target];
        const needsNight=Number.isFinite(rq.roadDay)&&S.day<=rq.roadDay;
        state=needsNight
          ? `${def.name}와 임시 동행 · 서로를 지켜볼 하룻밤`
          : `두 번째 과제 · ${target.name}`;
        meta=needsNight?'야영 필요':S.at===rq.target&&!S.driving?'마주할 일 있음':'이동 필요';
        pct=needsNight?70:S.at===rq.target?86:76;
      } else {
        const target=D.nodes[rq.target];
        state=`첫 번째 과제 · ${target.name}`;
        meta=S.at===rq.target&&!S.driving?'진행 가능':'이동 필요';
        pct=S.at===rq.target?55:S.driving&&S.driving.to===rq.target
          ?Math.min(50,S.driving.gone/S.driving.dist*50):18;
      }
    } else if(q){
      const K=G.QKIND[q.kind]||G.QKIND.deliver;
      kicker=`${K.nm} · 진행 중`;
      title=G.questLabel(q);
      if(q.kind==='procure'){
        const have=S.items[q.need.name]||0;
        state=`${q.need.name} ${have}/${q.need.qty} · ${D.nodes[q.to].name}에서 전달`;
        pct=Math.min(100,have/q.need.qty*100);
      } else {
        state=`목적지 ${D.nodes[q.to].name} · 사례 고철 ${q.reward}`;
        pct=S.at===q.to?100:S.driving&&S.driving.to===q.to?Math.min(95,S.driving.gone/S.driving.dist*100):24;
      }
      meta=G.questReady()?'전달 가능':`D-${Math.max(0,q.due-S.day)}`;
    } else {
      kicker='본편 · 북쪽으로';
      title=S.driving?`${D.nodes[S.driving.to].name}(으)로 이동 중`:`서울까지 약 ${G.remainKm()}km`;
      state=S.flags.es_truth
        ? `${transfer.mission} · 부모의 수정안을 남산 코어에 적용한다`
        : S.flags.parent_key_found
        ? `${transfer.mission} · 검증키와 증언을 남산까지 가져간다`
        : `제7 잔류구역 · ${transfer.mission}`;
      meta=`DAY ${S.day}`;
      pct=Math.max(0,Math.min(100,(411-G.remainKm())/411*100));
    }

    // 동시 임무가 사라지지 않도록 본편/동행/게시판을 칩으로 남긴다.
    if(rq){
      const def=D.recruitQuests[rq.id];
      secondaryMissions.push(`<span class="ms-chip chip-recruit">🤝 ${esc(def.name)} 과제 ${rq.stage==='ready'?'완료':rq.stage==='road'?'임시동행':'대기중'}</span>`);
    }
    if(q){
      const K=G.QKIND[q.kind]||G.QKIND.deliver;
      const target=D.nodes[q.to];
      secondaryMissions.push(`<span class="ms-chip chip-quest">${K.ic} 게시판 ${G.questLabel(q)} → ${esc(target.name)} · D-${Math.max(0,q.due-S.day)}</span>`);
    }
    if(!rq&&!q){
      secondaryMissions.push(`<span class="ms-chip chip-core">🚗 ${transfer.onTime?`이송 마감 ${transfer.remaining}일`:'1화 종료 전 조치 미완'}</span>`);
    }

    const clock=`⌛ 본편 · ${esc(transfer.mission)} · 서울 도착이 아니라 코어 조치가 마감`;
    secondaryMissions.push(`<span class="ms-chip chip-core">${clock}</span>`);
    if(secondaryMissions.length){
      secondary=`<div class="ms-secondary-wrap"><span class="ms-sec-title">함께 진행 중</span>${secondaryMissions.map(x=>x).join('')}</div>`;
    }
    const alerts=[
      S.fuel<10?'연료 부족':null,
      S.fatigue>=75?'졸음 위험':null,
      q&&q.due-S.day<=1?'마감 임박':null,
      !q&&transfer.onTime&&transfer.remaining<=3?`이송 임박 ${transfer.remaining}일 남음`:null,
      !q&&!transfer.onTime?'본편 조치 임박':null,
    ].filter(Boolean);
    alerts.length= alerts.length>0? Math.min(alerts.length,3):0;
    return {danger,secondary:!!secondary, html:`<span class="ms-k">${kicker}</span><span class="ms-title">${title}</span>
      <span class="ms-meta">${meta}${alerts.length?`<br><small class="ms-alert">${alerts.join(' · ')}</small>`:''}</span>
      <span class="ms-state">${state}</span><span class="ms-progress"><i style="width:${pct}%"></i></span>${secondary}`};
  }
  function renderMission(){
    if(!S) return;
    const m=missionHtml();
    ['#mission-strip','#map-mission'].forEach(sel=>{
      const node=$(sel); if(!node) return;
      node.innerHTML=m.html;
      node.classList.toggle('danger',m.danger);
      node.classList.toggle('has-secondary',m.secondary);
    });
  }

  /* ── panel ── */
  function faceOf(id, fallback){
    const name=(D.comps&&D.comps[id]&&D.comps[id].name)||(D.npcs&&D.npcs[id]&&D.npcs[id].name)||(id==='me'?'나':id);
    return D.portraits[id]? `<img class="pimg" src="${D.portraits[id]}" alt="${esc(name)} 초상" decoding="async">` : fallback;
  }
  function npcFace(id, fallback){
    const name=(D.comps&&D.comps[id]&&D.comps[id].name)||(D.npcs&&D.npcs[id]&&D.npcs[id].name)||id;
    return D.portraits[id]? `<img class="npc-pimg" src="${D.portraits[id]}" alt="${esc(name)} 초상" decoding="async">` : fallback;
  }
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const stripTags=(v)=>String(v||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
  function speakerInfo(who, label){
    const key=who==='나'?'me':who;
    const normalizeUnknown=(id)=>{
      if(!id||typeof id!=='string') return '이름을 모르는 사람';
      if(id.startsWith('passer_')) return '길 위의 사람';
      if(id==='me' || id==='player_child' || id==='intro_child') return '나';
      if(id.startsWith('npc_')) return '동행자';
      if(id.startsWith('comp_')) return '동행';
      return '누군가';
    };
    const manual={
      me:'나', grandfather:'할아버지', mother:'엄마', father:'아빠',
      intro_child:'서울에서 온 아이', player_child:'8살의 나', cheollian:'천리안', radio:'라디오',
      passer_man:'낯선 남자', passer_woman:'낯선 여자', passer_elder:'노인',
      passer_child:'아이', passer_merchant:'상인', passer_guard:'경비',
      passer_refugee:'피난민', passer_worker:'일꾼', passer_medic:'의료인',
      seoyeon:'서연', mingyu:'민규',
      driver:'운전수', sys:'길 위', record:'기록', unknown:'???', 나:'나'
    };
    const comp=D.comps&&D.comps[key], npc=D.npcs&&D.npcs[key];
    const playerName=key==='me'&&typeof S!=='undefined'&&S&&G.myName?G.myName():'나';
    const resolvedManual=(typeof manual[key]==='string'&&manual[key])?manual[key]:normalizeUnknown(key);
    return {
      id:key,
      name:label||(key==='me'?playerName:(comp&&comp.name)||(npc&&npc.name)||resolvedManual),
      portrait:D.portraits&&D.portraits[key]||null
    };
  }
  function storyTurnHtml(turn, opt={}){
    const kind=turn.kind||'narration';
    const person=speakerInfo(turn.who,turn.name);
    const hasPortrait=!!person.portrait&&!['narration','ai','radio'].includes(kind);
    const source={
      narration:'장면', dialogue:'대화', thought:'생각', ai:'AI 방송',
      radio:'라디오', letter:'편지', record:'기록'
    }[kind]||'장면';
    const faceAlt=person.name==='???'?'이름을 모르는 사람':person.name;
    const face=hasPortrait
      ? `<img class="turn-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상" decoding="async">`
      : '';
    const speaker=['dialogue','thought','letter'].includes(kind)||(kind==='record'&&hasPortrait)
      ? `<div class="turn-speaker">${face}<span><small>${source}</small><b>${esc(person.name)}</b></span></div>`
      : `<div class="turn-source">${source}${turn.name?` · ${esc(turn.name)}`:''}</div>`;
    return `<article class="story-turn story-entry ${kind}${person.name==='???'?' identity-hidden':''}${opt.intro?' intro-turn':''}"
      data-kind="${kind}" data-story-entry>
      ${speaker}<div class="turn-text">${fmt(turn.text||'')}</div></article>`;
  }
  const playerSpeaker=(id)=>['me','player_child','나'].includes(id);
  /* 이름은 ???→실명으로 바뀐 수 있지만, 화자의 좌우 자리는 인물 ID를 따른다.
     화면에 보이는 이름을 키로 쓰면 자기소개 순간에 같은 인물이 반대쪽으로 튀어 간다. */
  function speakerLaneKey(turn){
    const person=speakerInfo(turn&&turn.who,turn&&turn.name);
    if(person.id&&person.id!=='unknown') return `speaker:${person.id}`;
    return `anonymous:${turn&&turn.speakerKey||person.name||'unknown'}`;
  }
  function dialogueLaneMap(turns,seed){
    const lanes=new Map(seed instanceof Map?seed:[]), speakers=[];
    (turns||[]).forEach(turn=>{
      if(turn.kind!=='dialogue') return;
      const person=speakerInfo(turn.who,turn.name);
      const key=speakerLaneKey(turn);
      if(!speakers.some(item=>item.key===key)) speakers.push({key,id:person.id});
    });
    speakers.filter(item=>playerSpeaker(item.id)&&!lanes.has(item.key))
      .forEach(item=>lanes.set(item.key,'right'));

    const npcSpeakers=speakers.filter(item=>!playerSpeaker(item.id));
    if(npcSpeakers.length<=2){
      let npcIndex=[...lanes.keys()].filter(key=>
        !['speaker:me','speaker:player_child','speaker:나'].includes(key)).length;
      npcSpeakers.forEach(item=>{
        if(lanes.has(item.key)) return;
        lanes.set(item.key,npcIndex%2===0?'left':'right');
        npcIndex++;
      });
    }else{
      npcSpeakers.forEach(item=>{
        if(!lanes.has(item.key)) lanes.set(item.key,'left');
      });
    }
    return lanes;
  }
  function dialogueSide(turn,lanes){
    const person=speakerInfo(turn.who,turn.name);
    const key=speakerLaneKey(turn);
    return (lanes&&lanes.get(key))||(playerSpeaker(person.id)?'right':'left');
  }
  function chatMessageHtml(turn, newest=false, side='left'){
    const person=speakerInfo(turn.who,turn.name);
    const mine=playerSpeaker(person.id);
    const hidden=person.name==='???';
    const faceAlt=hidden?'이름을 모르는 사람':person.name;
    const face=person.portrait
      ? `<img class="chat-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상" decoding="async">`
      : '';
    return `<div class="chat-msg story-entry side-${side} ${mine?'mine':'other'}${hidden?' identity-hidden':''}${newest?' chat-newest':''}"
      data-kind="dialogue" data-speaker="${esc(person.id||person.name)}" data-side="${side}" data-story-entry>
      ${face}<div class="chat-copy"><b class="chat-name">${esc(person.name)}</b>
      <div class="chat-bubble">${fmt(turn.text||'')}</div></div></div>`;
  }
  function narrationMessageHtml(turn,newest=false,opt={}){
    return `<div class="story-narration story-entry${newest?' narration-newest':''}${opt.intro?' intro-narration':''}"
      data-kind="narration" data-story-entry role="note">
      <span class="story-narration-label">장면</span>
      <div class="story-narration-text">${fmt(turn.text||'')}</div>
    </div>`;
  }
  function storyReaderHtml(turns,index,opt={}){
    const safe=Math.min(Math.max(0,index),Math.max(0,turns.length-1));
    const shown=(turns.length?turns:[{kind:'narration',text:'잠시 말이 끊겼다.'}]).slice(0,safe+1);
    const lanes=opt.lanes instanceof Map?opt.lanes:dialogueLaneMap(turns);
    return `<section class="story-chat story-transcript${opt.intro?' intro-chat':''}" role="group" aria-label="대화 기록">
      ${shown.map((turn,i)=>{
        const newest=i===shown.length-1;
        if(turn.kind==='dialogue') return chatMessageHtml(turn,newest,dialogueSide(turn,lanes));
        if(turn.kind==='narration') return narrationMessageHtml(turn,newest,opt);
        return storyTurnHtml(turn,opt);
      }).join('')}</section>`;
  }
  function eventSpeakerCandidates(evd, extra=[]){
    const ids=[];
    const add=(id)=>{ if(id&&id!=='unknown'&&!ids.includes(id)) ids.push(id); };
    add(evd&&evd.needsComp);
    add(evd&&evd.needsComp2);
    add(evd&&evd.recruitStart);
    (evd&&evd.speakers||[]).forEach(add);
    (extra||[]).forEach(add);
    add(evd&&D.eventPortraits&&D.eventPortraits[evd.id]);
    const title=stripTags(evd&&evd.title);
    for(const [id,c] of Object.entries(D.comps||{})){ if(title.includes(c.name)) add(id); }
    for(const [id,n] of Object.entries(D.npcs||{})){ if(title.includes(n.name)) add(id); }
    if(evd&&(evd.type==='대화'||evd.needsComp||evd.needsComp2)) add('me');
    return ids;
  }
  function speakerRegistry(state){
    const out=[
      {id:'intro_child',names:['서울에서 온 아이']},
      {id:'player_child',names:['8살의 나','여덟 살의 나','어린 나']},
      {id:'me',names:['내가','나는','내 쪽','나도']}
    ];
    const family=[
      {id:'grandfather',names:['할아버지']},{id:'mother',names:['엄마','어머니']},
      {id:'father',names:['아빠','아버지']}
    ];
    family.forEach(item=>{ if(state.candidates.includes(item.id)) out.push(item); });
    for(const [id,c] of Object.entries(D.comps||{})){
      if(state.candidates.includes(id)||(typeof S!=='undefined'&&S&&S.party&&S.party.includes(id)))
        out.push({id,names:[c.name]});
    }
    for(const [id,n] of Object.entries(D.npcs||{})){
      if(state.candidates.includes(id)||(typeof S!=='undefined'&&S&&S.npcs&&S.npcs[id]&&S.npcs[id].met))
        out.push({id,names:[n.name]});
    }
    return out.sort((a,b)=>Math.max(...b.names.map(x=>x.length))-Math.max(...a.names.map(x=>x.length)));
  }
  const anonymousRoles=[
    {id:'passer_child',names:['아이','소년','소녀','큰애','막내','학생']},
    {id:'passer_elder',names:['노인','할머니','할아버지','영감','노파']},
    {id:'passer_merchant',names:['상인','행상','장사꾼','노점상','가게 주인']},
    {id:'passer_guard',names:['군인','병사','경비병','경비','문지기','수비대원']},
    {id:'passer_medic',names:['의사','간호사','약사','의무병','의료인']},
    {id:'passer_worker',names:['직원','점원','관리인','기사','정비사','작업자','역무원','일꾼']},
    {id:'passer_refugee',names:['피난민','이송자','추방자']},
    {id:'passer_woman',names:['여자','여성','아주머니','아줌마']},
    {id:'passer_man',names:['남자','남성','아저씨']}
  ];
  function anonymousFallback(evd){
    const pool=['passer_man','passer_woman','passer_refugee','passer_worker'];
    const key=String(evd&&evd.id||evd&&evd.title||'길 위');
    let hash=0;
    for(let i=0;i<key.length;i++) hash=(hash*31+key.charCodeAt(i))|0;
    return pool[Math.abs(hash)%pool.length];
  }
  function inferQuoteSpeaker(before, after, evd, state, preferRecord=false){
    const rawBefore=stripTags(before), b=rawBefore.slice(-220), a=stripTags(after).slice(0,120);
    const aiOpen=Math.max(
      String(before||'').lastIndexOf('<span class="ai">'),
      String(before||'').lastIndexOf("<span class='ai'>")
    );
    if(aiOpen>String(before||'').lastIndexOf('</span>')){
      state.last='cheollian';
      return {kind:'dialogue',who:'cheollian'};
    }
    const written=/(글씨|수첩|편지|메모|원고|기록|각인|적혀|적었|썼|써 둔|남긴 문장)/.test(rawBefore);
    const verbs='말|묻|물었|대답|답했|외치|중얼|소리쳤|받았|선언|덧붙|불쑥';
    for(const item of speakerRegistry(state)){
      for(const name of item.names){
        const safe=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        if(new RegExp(`^\\s*${safe}(?:이|가|은|는)?[^.。!?]{0,28}(?:${verbs})`).test(a)
          ||new RegExp(`${safe}(?:이|가|은|는)?[^.。!?]{0,28}(?:${verbs})[^.。!?]{0,10}[.。!?]?\\s*$`).test(b)){
          state.last=item.id;
          return {kind:written?'record':'dialogue',who:item.id};
        }
      }
    }
    if(/^(?:\s*)(간판|팻말|표지판|화면|단말|종이|문구|기록)/.test(a)
      ||/(간판|팻말|표지판|화면|단말|종이|문구|기록)[^.。!?]{0,24}$/.test(b)){
      state.last='record';
      return {kind:'record',who:'record',name:'기록'};
    }
    for(const role of anonymousRoles){
      for(const name of role.names){
        if(new RegExp(`^\\s*${name}(?:이|가|은|는)?[^.。!?]{0,24}(?:${verbs})`).test(a)
          ||new RegExp(`${name}(?:이|가|은|는)?[^.。!?]{0,24}(?:${verbs})[^.。!?]{0,8}[.。!?]?\\s*$`).test(b)){
          state.last=role.id;
          return {kind:'dialogue',who:role.id,name};
        }
      }
    }
    if((written||preferRecord)&&state.last&&state.last!=='record')
      return {kind:'record',who:state.last};
    if(!preferRecord&&state.contextSpeaker){
      const who=state.contextSpeaker;
      state.contextSpeaker=null;
      state.last=who;
      return {kind:'dialogue',who};
    }
    const candidates=state.candidates;
    if(candidates.length){
      const next=candidates.find(id=>id!==state.last)||candidates[0];
      state.last=next;
      return {kind:'dialogue',who:next};
    }
    state.last=state.fallbackSpeaker;
    return {kind:'dialogue',who:state.fallbackSpeaker,name:'???'};
  }
  function revealsIdentity(value,id){
    const comp=D.comps&&D.comps[id];
    return !!(comp&&stripTags(value).includes(comp.name));
  }
  function isInlineQuotedPhrase(spoken,before,after){
    const text=stripTags(spoken), b=stripTags(before), a=stripTags(after);
    if(!text||text.length>48||/[.!?…]$/.test(text)) return false;
    if(/^(?:라고|이라며)\s*(?:말|대답|외치|중얼|물었|덧붙)/.test(a)) return false;
    const particle=/^(?:(?:이|가|은|는|을|를|의|도|만|과|와|로|으로)(?:\s|[,.!?]|$)|(?:이라고|이라|이라는|이란|이라며|라고|라는|라며|였다|이었다)(?:\s|[,.!?]|$))/;
    const labelAfter=/^(?:상자|문구|표시|버튼|항목|코드|신호|상태|표지|규정|기록|목록|단어|표현)(?:은|는|이|가|을|를|\s)/;
    const labelBefore=/(?:이름은|제목은|적힌|쓰인|표시된|불리는|뜻하는)\s*$/;
    return particle.test(a)||labelAfter.test(a)||labelBefore.test(b);
  }
  function buildStoryTurns(value, evd={}, opt={}){
    let source=String(value||'').trim();
    if(!source) return [{kind:'narration',text:'잠시 말이 끊겼다.'}];
    const ai=[];
    source=source.replace(/<span\s+class=["'][^"']*(?:ai|ai-voice)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
      (_,text)=>`\n\n@@AI${ai.push(text)-1}@@\n\n`);
    const tags=[];
    source=source.replace(/<[^>]+>/g,tag=>`@@TAG${tags.push(tag)-1}@@`);
    const restore=(text)=>String(text||'').replace(/@@TAG(\d+)@@/g,(_,i)=>tags[+i]||'').trim();
    const hiddenSpeaker=evd&&evd.recruitStart;
    const turns=[];
    const state={
      candidates:eventSpeakerCandidates(evd,opt.speakers),last:null,contextSpeaker:null,hiddenSpeaker,
      knownSpeaker:!!opt.knownSpeaker,fallbackSpeaker:anonymousFallback(evd),
      turnSpeakers:Array.isArray(opt.turnSpeakers)
        ? opt.turnSpeakers
        : (Array.isArray(evd&&evd.turnSpeakers)?evd.turnSpeakers:[]),
      scriptIndex:0
    };
    const pushNarration=(raw)=>{
      const restored=restore(raw).trim();
      if(!stripTags(restored)) return;
      const nearby=stripTags(restored).slice(-160);
      const mentioned=[...new Set(speakerRegistry(state)
        .filter(item=>!['me','player_child','intro_child'].includes(item.id))
        .filter(item=>item.names.some(name=>nearby.includes(name)))
        .map(item=>item.id))];
      if(mentioned.length===1) state.contextSpeaker=mentioned[0];
      if(evd&&evd.parseRecords){
        const plain=stripTags(restored);
        const cues=[
          ['mother',/(?:엄마|어머니)[^.。!?]{0,40}(?:글씨|수첩|메모|편지|적|썼|남긴)/],
          ['father',/(?:아빠|아버지)[^.。!?]{0,40}(?:글씨|수첩|메모|편지|적|썼|남긴)/],
          ['grandfather',/할아버지[^.。!?]{0,40}(?:글씨|수첩|메모|편지|적|썼|남긴)/]
        ];
        for(const [id,re] of cues){
          if(state.candidates.includes(id)&&re.test(plain)){ state.last=id; break; }
        }
      }
      if(hiddenSpeaker&&revealsIdentity(restored,hiddenSpeaker)) state.knownSpeaker=true;
      const parts=restored.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      for(const part of parts){
        const thought=/^\([\s\S]+\)$/.test(stripTags(part));
        turns.push({
          kind:thought?'thought':'narration',
          who:thought?'me':undefined,
          text:thought?part.replace(/^\(/,'').replace(/\)$/,''):part
        });
      }
    };
    for(const paragraph of source.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)){
      const aiOnly=paragraph.match(/^@@AI(\d+)@@$/);
      if(aiOnly){
        turns.push({kind:'ai',who:'cheollian',name:'천리안 방송',text:ai[+aiOnly[1]]||''});
        continue;
      }
      let cursor=0, match;
      const re=evd&&evd.parseRecords
        ? /(?:[“"]([\s\S]*?)[”"]|「([\s\S]*?)」)/g
        : /[“"]([\s\S]*?)[”"]/g;
      while((match=re.exec(paragraph))){
        const before=restore(paragraph.slice(0,match.index));
        const after=restore(paragraph.slice(re.lastIndex));
        const isRecord=match[2]!==undefined;
        const spoken=restore(match[1]!==undefined?match[1]:match[2]);
        if(!isRecord&&!state.turnSpeakers.length&&isInlineQuotedPhrase(spoken,before,after)) continue;
        pushNarration(paragraph.slice(cursor,match.index));
        const scripted=state.turnSpeakers[state.scriptIndex++];
        let speaker;
        if(scripted!==undefined){
          speaker=typeof scripted==='string'
            ? {kind:isRecord?'record':'dialogue',who:scripted}
            : {kind:isRecord?'record':'dialogue',...scripted};
          state.last=speaker.who;
        }else{
          speaker=inferQuoteSpeaker(before,after,evd,state,isRecord);
        }
        if(isRecord&&speaker.kind==='dialogue') speaker.kind='record';
        const hidden=speaker.who===hiddenSpeaker&&!state.knownSpeaker;
        const revealsNow=hidden&&revealsIdentity(spoken,hiddenSpeaker);
        /* 자기소개를 한 바로 그 문장부터 실명으로 보여 준다. */
        turns.push({...speaker,name:hidden&&!revealsNow?'???':speaker.name,text:spoken});
        if(revealsNow) state.knownSpeaker=true;
        cursor=re.lastIndex;
      }
      pushNarration(paragraph.slice(cursor));
    }
    const result=turns.length?turns:[{kind:'narration',text:restore(source)}];
    result.knownSpeaker=state.knownSpeaker;
    return result;
  }
  function prepareEventAudio(turns,evd){
    if(!Array.isArray(turns)||!evd) return turns;
    if(evd.id==='seoul_core'){
      let voiceNo=0;
      for(const turn of turns){
        if(turn.kind==='ai'&&voiceNo<15){
          voiceNo++;
          turn.voice=`cheollian_core_${String(voiceNo).padStart(2,'0')}`;
        }
        if(/검증키를 단자에 넣|오래된 칩이/.test(stripTags(turn.text||'')))
          turn.sfx='sfx_core_key_insert';
      }
    }
    return turns;
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
    return h+'</div>';
  }
  function wireParty(p){
    p.querySelectorAll('[data-comp]').forEach(b=>b.onclick=()=>showComp(b.dataset.comp));
  }
  function contextRail(node, driving){
    const ids=['me',...S.party], shown=ids.slice(0,4);
    const faces=shown.map(id=>{
      const c=id==='me'?null:D.comps[id];
      return `<span class="crew-mini">${faceOf(id,c?c.face:'🧑‍✈️')}</span>`;
    }).join('');
    const extra=ids.length-shown.length;
    const dog=S.dog?' + 보리':'';
    const locTitle=driving?D.nodes[S.driving.to].name:node.name;
    const locMeta=driving
      ?`${Math.max(0,Math.round(S.driving.dist-S.driving.gone))}km 남음`
      :(node.stl?'정차 중 · 정착지':'정차 중');
    return `<section class="journey-context ${driving?'is-driving':'is-stopped'}">
      <div class="journey-context-head"><span>${driving?'JOURNEY IN MOTION':'JOURNEY CONTROL'}</span><small>${driving?'주행 중':'출발 준비'}</small></div>
      <button class="context-location" data-a="where" type="button" aria-label="지도에서 현재 위치 보기">
        <span class="loc-mark">${driving?'ROUTE':'HERE'}</span><b>${locTitle}</b><small>${locMeta}</small>
      </button>
      <button class="context-crew" data-a="crew" type="button" aria-label="탑승 인원과 동료 상태 보기">
        <span class="crew-faces">${faces}${extra?`<span class="crew-mini">+${extra}</span>`:''}</span>
        <span class="crew-count">${ids.length}명${dog}</span>
      </button></section>`;
  }
  function journeyGuideHtml(){
    const guide=G.journeyGuide&&G.journeyGuide();
    if(!guide) return '';
    return `<section class="journey-guide guide-${guide.focus}" role="status" aria-label="첫 여정 안내 ${guide.step}/${guide.total}">
      <div class="journey-guide-head"><span>${esc(guide.kicker)} · ${guide.step}/${guide.total}</span>
        <button type="button" data-guide-dismiss aria-label="첫 여정 안내 숨기기">숨기기</button></div>
      <b>${esc(guide.title)}</b><p>${esc(guide.body)}</p>
      <div class="journey-guide-track" aria-hidden="true"><i style="width:${guide.step/guide.total*100}%"></i></div>
    </section>`;
  }
  function wireJourneyGuide(p){
    const dismiss=p.querySelector('[data-guide-dismiss]');
    if(!dismiss) return;
    dismiss.onclick=()=>{
      S.guideDismissed=true;
      G.save();
      renderPanel();
      toast('첫 여정 설명을 접었다 · 여정 탭에서 목표를 다시 볼 수 있다');
    };
  }
  function wireContext(p){
    const where=p.querySelector('[data-a="where"]');
    if(where) where.onclick=()=>{
      if(!$('#ovl-map').classList.contains('on')) toggleOvl('#ovl-map');
      MAPR.resize(); renderMapMini(); renderMission();
    };
    const crew=p.querySelector('[data-a="crew"]');
    if(crew) crew.onclick=()=>{
      stTab='crew';
      if(!$('#ovl-status').classList.contains('on')) toggleOvl('#ovl-status');
      renderStatus();
    };
  }
  function renderPanel(){
    const p=$('#panel');
    if(!S){ p.innerHTML=''; return; }
    if(S.driving){
      const to=D.nodes[S.driving.to];
      const rq=S.recruitQ&&S.recruitQ.stage==='road'?S.recruitQ:null;
      const def=rq&&D.recruitQuests[rq.id];
      const approach=rq&&G.recruitApproach();
      const memory=S.driving.recruitMemory;
      const choiceMemory=G.pendingChoiceMemory();
      const route=G.routeStatus();
      const routeCard=route&&!route.complete?`<section class="road-guest-card road-memory-card" aria-label="선택한 노선">
        <div class="road-guest-head"><span class="rg-ico">${route.def.mark}</span><span>
          <small>김천에서 고른 길 · 청주까지 고정</small><b>${esc(route.def.name)}</b></span></div>
        <div class="road-guest-help">${esc(route.def.promise)}</div>
        <div class="road-guest-memory"><b>노선 진행 ${route.done}/${route.total}</b> · 청주에서 두 길이 다시 합쳐진다.</div>
      </section>`:'';
      const guest=def?`<section class="road-guest-card" aria-label="${def.name} 임시 동행">
        <div class="road-guest-head"><span class="rg-ico">${def.guest.ic}</span><span>
          <small>임시 동행 · 아직 손님</small><b>${def.name} — ${def.guest.title}</b></span></div>
        <div class="road-guest-help">${def.guest.desc}</div>
        ${approach?`<div class="road-guest-memory"><b>${approach.label}</b> · ${approach.memory}</div>`:''}
      </section>`:memory?`<section class="road-guest-card road-memory-card" aria-label="${esc(D.comps[memory.id].name)}의 선택 후속 행동">
        <div class="road-guest-head"><span class="rg-ico">${D.comps[memory.id].face}</span><span>
          <small>함께 고른 방식 · 첫 후속</small><b>${esc(D.comps[memory.id].name)} — ${esc(memory.title)}</b></span></div>
        <div class="road-guest-help">${esc(memory.desc)}</div>
        <div class="road-guest-memory"><b>${esc(memory.effect)}</b> · 이번 주행에서 확인할 수 있다.</div>
      </section>`:choiceMemory?`<section class="road-guest-card road-memory-card" aria-label="길에서 되돌아올 선택">
        <div class="road-guest-head"><span class="rg-ico">◇</span><span>
          <small>길이 기억하는 선택</small><b>${esc(choiceMemory.eventTitle)}</b></span></div>
        <div class="road-guest-help">${esc(choiceMemory.summary)}</div>
        <div class="road-guest-memory">조금 더 달리면 이 선택이 사람들의 말과 풍경으로 돌아온다.</div>
      </section>`:'<div class="road-note">차는 계속 달린다. 남은 거리와 탑승 상태는 위 요약에서 바로 확인할 수 있다.</div>';
      p.innerHTML = `
        ${contextRail(to,true)}
        ${journeyGuideHtml()}
        <section class="travel-progress-card" aria-label="현재 주행 진행">
          <div class="journey-section-head"><span><small>ACTIVE ROUTE</small><b>${esc(D.nodes[S.driving.from].name)}에서 ${esc(to.name)}까지</b></span><em>주행 중</em></div>
          <div id="travelbar"></div>
        </section>
        ${routeCard}
        ${guest}`;
      renderTravelbar();
      wireContext(p);
      wireJourneyGuide(p);
      return;
    }
    const n=D.nodes[S.at];
    let localActions='', utilityActions='';
    if(S.recruitQ){
      const rq=S.recruitQ, def=D.recruitQuests[rq.id];
      const atTask=rq.stage==='task'&&S.at===rq.target;
      const atFollow=rq.stage==='follow'&&S.at===rq.target;
      const ready=rq.stage==='ready', road=rq.stage==='road';
      const waitNight=atFollow&&Number.isFinite(rq.roadDay)&&S.day<=rq.roadDay;
      const enabled=ready||atTask||(atFollow&&!waitNight);
      const icon=ready?'🤝':atFollow?'💬':road?'🚚':'🧰';
      const label=ready?`합류를 이야기한다 — ${def.name}`
        :waitNight?`${def.name}와 하룻밤을 보낸다`
        :atFollow?`길에서 생긴 일을 마주한다 — ${def.name}`
        :road?`다음 길을 함께 간다 — ${def.name}`
        :atTask?`${def.name}의 부탁을 진행한다`
        :`${D.nodes[rq.target].name} · 만나기로 한 사람: ${def.name}`;
      const small=ready?'서로를 겪은 뒤, 본인이 자리를 고른다'
        :waitNight?'야영을 하면 내일 다시 이야기할 수 있다'
        :atFollow?def.followHint:road?def.roadHint:def.hint;
      localActions+=`<button class="act primary" data-a="recruitstep" ${!enabled?'disabled':''}>
        <span class="ic">${icon}</span><span><b>${label}</b><small>${small}</small></span></button>`;
    }
    if(n.stl) localActions+=`<button class="act primary" data-a="stl"><span class="ic">🏘</span><span><b>정착지에 들어간다</b><small>거래 · 대화 · 소문</small></span></button>`;
    if(!n.stl && n.type!=='goal'){
      const es=G.exploreStatus();
      const ef=G.exploreForecast(es);
      const label=es.ok?(es.repeat?'남은 곳을 샅샅이 뒤진다':'주변을 탐색한다'):'주변 탐색';
      const small=es.ok
        ?(es.repeat?`최소 4시간 · 피로 약 +15 · 탐색 위험 ${ef.danger} · 오늘의 마지막 탐색`
          :`최소 2시간 · 피로 약 +5 이상 · ${ef.guaranteed} · 탐색 위험 ${ef.danger}`)
        :es.reason;
      localActions+=`<button class="act" data-a="explore" ${es.ok?'':'disabled'}><span class="ic">🔦</span><span><b>${label}</b><small>${small}${es.ok?`<em class="act-forecast">찾을 것 · ${ef.focus}</em>`:''}</small></span></button>`;
    }
    const nbs=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id));
    const routeModels=nbs.map(nb=>({nb,forecast:G.travelForecast(nb.id),fuel:G.fuelFor(nb.km,nb.road)}));
    const viable=routeModels.filter(model=>model.forecast.ok&&!model.forecast.shortage);
    const forward=viable.filter(model=>model.forecast.progressKm>0);
    const recommendationPool=forward.length?forward:viable;
    const safest=[...recommendationPool].sort((a,b)=>b.forecast.safetyScore-a.forecast.safetyScore||b.forecast.progressScore-a.forecast.progressScore)[0]||null;
    const fastest=[...recommendationPool].sort((a,b)=>b.forecast.progressScore-a.forecast.progressScore||b.forecast.safetyScore-a.forecast.safetyScore)[0]||null;
    const supplied=[...recommendationPool].sort((a,b)=>b.forecast.supplyScore-a.forecast.supplyScore||b.forecast.progressScore-a.forecast.progressScore)[0]||null;
    const routeActions=routeModels.map((model,index)=>{
      const {nb,forecast,fuel}=model;
      const t2=D.nodes[nb.id];
      const lack = forecast.shortage;
      const chk=forecast, blocked=!chk.ok;
      const recommendations=[];
      if(model===safest) recommendations.push(['safe','안전']);
      if(model===fastest) recommendations.push(['fast','진행']);
      if(model===supplied&&forecast.supplyScore>=70) recommendations.push(['supply','보급']);
      const isRecommended=recommendations.length>0;
      const note=blocked&&chk.why?esc(chk.why):lack?'연료 부족 주의'
        :forecast.risk&&forecast.risk!=='보통 도로'?esc(forecast.risk):'다음 목적지로 이어지는 길';
      const buttonHint=esc(`${t2.name}로 이동: ${forecast.readinessLabel} ${forecast.readinessScore}점. ${forecast.readinessReason}`);
      return `<button class="act route-option route-${forecast.readinessClass}${lack?' route-low-fuel':''}${isRecommended?' route-recommended':''}${forecast.progressKm<0?' route-backtrack':''}" data-go="${nb.id}" ${blocked?'disabled':''} aria-label="${buttonHint}">
        <span class="route-index"><i>${String(index+1).padStart(2,'0')}</i>${t2.type==='goal'?'⚡':'↗'}</span>
        <span class="route-copy"><span class="route-name"><b>${t2.name}</b><em>${note}</em></span>
        <span class="route-decision"><i class="route-readiness ${forecast.readinessClass}">${forecast.readinessLabel} ${forecast.readinessScore}</i>${recommendations.map(([cls,label])=>`<i class="route-recommend ${cls}">${label} 추천</i>`).join('')}${forecast.gear.length?`<i class="route-gear-count">장비 ${forecast.gear.length}</i>`:''}</span>
        <small class="route-stats"><span>${nb.km}km</span><i>·</i><span>주행 약 ${G.durationLabel(forecast.minutes)}</span><i>·</i><span>연료 약 ${fuel}L</span></small>
        <small class="route-advice"><b>${esc(forecast.directionLabel)}</b> · ${esc(forecast.readinessReason)}</small></span></button>`;
    }).join('');
    if(S.flags.armed_age){
      utilityActions+=`<button class="act" data-a="craft"><span class="ic">🔨</span><span><b>작업대를 편다</b><small>무기·탄 제작 · 약 40분</small></span></button>`;
    }
    if(S.van<S.vanMax-5){
      const hasP=(S.items['부품']||0)>0;
      utilityActions+=`<button class="act" data-a="repair" ${hasP?'':'disabled'}><span class="ic">🔧</span><span><b>달구지를 정비한다</b><small>${hasP?'부품 1 소모 · 내구 +35 · 약 1.5시간':'부품이 없다 — 탐색이나 정비소에서 구하자'}</small></span></button>`;
    }
    if(!S.flags.radio_fixed){ const hasT=(S.items['라디오 진공관']||0)>0;
      utilityActions+=`<button class="act" data-a="radio" ${hasT?'':'disabled'}><span class="ic">📻</span><span><b>라디오를 고친다</b><small>${hasT?'진공관 1 소모 · 주행 중 방송 수신':'라디오 진공관이 필요하다 — 어딘가의 방송국에'}</small></span></button>`; }
    if(S.fuel<5) utilityActions+=`<button class="act" data-a="walkfuel"><span class="ic">🛢</span><span><b>걸어서 연료를 구해온다</b><small>시간과 체력을 크게 소모한다</small></span></button>`;
    const localSection=localActions?`<section class="journey-section local-section">
      <div class="journey-section-head"><span><small>AT THIS STOP</small><b>이곳에서 할 일</b></span><em>${n.stl?'정착지':'현지 행동'}</em></div>
      <div class="acts local-actions">${localActions}</div></section>`:'';
    const routeSection=`<section class="journey-section route-section">
      <div class="journey-section-head"><span><small>CHOOSE THE ROAD</small><b>다음 길을 고른다</b></span><em>${nbs.length}개 경로</em></div>
      <div class="acts route-options">${routeActions||'<div class="route-empty">지금 이어지는 길이 없다.</div>'}</div></section>`;
    const routeRumors=!S.routePlan&&S.stats.km>=70?`<section class="journey-section route-rumor-section">
      <div class="journey-section-head"><span><small>AHEAD AT GIMCHEON</small><b>앞에서 갈라질 두 노선</b></span><em>미리 준비</em></div>
      <p>김천에서 한 길을 고르면 청주까지 바꿀 수 없다. 지금은 필요한 연료와 장비를 준비할 수 있다.</p>
      <div class="route-rumor-grid">${Object.values(D.routePlans||{}).map(def=>{ const forecast=G.routeForecast(def.id); return `<article>
        <span>${def.mark}</span><div><b>${esc(def.name)}</b><p>${esc(def.promise)}</p>
        <small>${forecast.km}km · ${G.durationLabel(forecast.minutes)} · 연료 약 ${forecast.fuel}L · ${forecast.rough?`험로 ${forecast.rough}구간`:`정착지 ${forecast.stops}곳`}</small>
        <small class="route-rumor-reward">도착 계약: ${esc(def.reward||'도착 후 반영')}</small>
        <em class="${forecast.short?'warn':''}">${esc(forecast.readiness)}</em></div></article>`; }).join('')}</div>
    </section>`:'';
    const buildProfile=G.vanBuildProfile();
    const utilitySection=`<section class="journey-section utility-section">
      <div class="journey-section-head"><span><small>VAN & GEAR</small><b>차량과 장비</b></span><em>${esc(buildProfile.name)}</em></div>
      <div class="van-build-summary build-${buildProfile.id}">
        <span class="van-build-rank">${buildProfile.installed}<small>장착</small></span>
        <span><b>${esc(buildProfile.name)} <i class="van-build-tier tier-${buildProfile.tier}">${esc(buildProfile.tierLabel)}</i>${buildProfile.secondary?` · ${esc(buildProfile.secondary)}`:''}</b><small>${esc(buildProfile.summary)}</small>${buildProfile.signature.length?`<em>${buildProfile.signature.map(esc).join(' · ')}</em>`:''}</span>
      </div>
      ${utilityActions?`<div class="acts utility-actions">${utilityActions}</div>`:''}</section>`;
    const h=`${contextRail(n,false)}${journeyGuideHtml()}${localSection}${routeRumors}${routeSection}${utilitySection}`;
    p.innerHTML=h;
    const wf=p.querySelector('[data-a="walkfuel"]'); if(wf) wf.onclick=()=>G.openRescue('nofuel','crisis_nofuel');
    const rp=p.querySelector('[data-a="repair"]'); if(rp) rp.onclick=()=>G.fieldRepair();
    const rd=p.querySelector('[data-a="radio"]'); if(rd) rd.onclick=()=>{ if(G.fixRadio()) renderAll(); };
    const cf=p.querySelector('[data-a="craft"]'); if(cf) cf.onclick=()=>showCraft();
    const rq=p.querySelector('[data-a="recruitstep"]'); if(rq) rq.onclick=()=>G.openRecruitStep();
    wireContext(p);
    wireJourneyGuide(p);
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
  function renderAll(){ renderHud(); renderMission(); renderPanel(); }

  /* ── travel hooks ── */
  function onDepart(){ closeOvl('#ovl-map'); closeOvl('#ovl-stl'); renderAll();
    SND.setDriving(true);
    AMBI.depart(S.driving&&S.driving.road); }
  function onArrive(){
    renderAll(); SND.setDriving(false);
    AMBI.arrive(S.at);
    const id=S.at, n=D.nodes[id], key=D.nodeScenes&&D.nodeScenes[id];
    const src=key&&D.scenes&&D.scenes[key];
    const recap=S.lastJourneyRecap;
    toast(`<span class="ic">📍</span>${n.name} 도착`);
    const a=$('#arrival-scene');
    const recapChanges=recap&&recap.changes&&recap.changes.length
      ?recap.changes.slice(0,5).map(change=>`<i class="${change.good?'gain':'cost'}">${esc(change.label)} ${change.value>0?'+':''}${change.value}${esc(change.unit)}</i>`).join('')
      :'<i>자원 변화 없음</i>';
    const contract=recap&&recap.routeContract?`<div class="arrival-contract">
      <small>${esc(recap.routeContract.mark)} ${esc(recap.routeContract.name)} · ${esc(recap.routeProgress)} 구간</small>
      <strong>계약: ${esc(recap.routeContract.promise)}</strong>
      <span>예상 반영: ${recap.routeContract.complete?'청주 합류 보상: ':'계속 진행 보상: '}${esc(recap.routeContract.reward||'다음 정착지와 정착 보급으로 반영')}</span>
    </div>`:'';
    a.innerHTML=`${src?`<img src="${src}" alt="">`:'<div class="arrival-fallback" aria-hidden="true"></div>'}<div class="arrival-copy"><small>ARRIVAL · DAY ${S.day}</small><b>${n.name}</b><span>${n.desc}</span>
      ${recap?`<div class="arrival-ledger" aria-label="방금 주행 정산">
        <div><strong>${esc(D.nodes[recap.from].name)} → ${esc(n.name)}</strong><em>${recap.km}km · ${G.durationLabel(recap.minutes)} · 사건 ${recap.events}건</em></div>
        <div class="arrival-deltas">${recapChanges}</div>
        ${contract}
        <p>${esc(recap.build)}으로 달렸다${recap.routeCompleted&&recap.routeName?` · ${esc(recap.routeName)} 완주`:''}</p>
      </div>`:''}</div>`;
    clearTimeout(arrivalTimer);
    a.onclick=()=>{ a.classList.remove('on'); };
    requestAnimationFrame(()=>a.classList.add('on'));
    const hold=uiPrefs.reduceMotion?3200:4300;
    arrivalTimer=setTimeout(()=>a.classList.remove('on'),hold);
    return hold+200;
  }

  /* ── bubbles ── */
  const speechQueue=[];
  let speechBusy=false, speechTimer=0;
  function playChat(lines){
    lines.forEach(ln=>speak({who:ln[0],t:ln[1],drivingOnly:true}));
  }
  function playRadio(){
    const r=G.pickRadio(); if(!r) return;
    speak({who:r.narration?'sys':'radio', t:r.t});
    AMBI.play(r.key==='radio_400_after'?'sfx_radio_400_after':'sfx_radio_static',.28);
    VO.play(r.key);
  }
  function speak(b){
    if(!b||!b.t) return;
    speechQueue.push(b);
    if(!speechBusy) showNextSpeech();
  }
  function showNextSpeech(){
    const wrap=$('#bubbles');
    clearTimeout(speechTimer);
    wrap.innerHTML='';
    const b=speechQueue.shift();
    if(!b){ speechBusy=false; return; }
    if(b.drivingOnly&&(!S||!S.driving)){ showNextSpeech(); return; }
    speechBusy=true;
    const isAi = b.who==='cheollian';
    const isNarration = b.who==='sys';
    const isThought = b.who==='나' && /^\s*\([\s\S]*\)\s*$/.test(b.t);
    if(!isAi && !isNarration && !isThought && b.who!=='radio' && typeof SCENE!=='undefined' && SCENE.talkPulse){
      let ri=-1;
      if(b.who==='나') ri=0;
      else if(S&&S.party){ const k=S.party.indexOf(b.who); if(k>=0) ri=k+1; }
      if(ri>=0) SCENE.talkPulse(ri, 3.5);
    }
    const isRadio=b.who==='radio';
    const kind=isAi?' ai':isNarration?' narration':isThought?' thought':isRadio?' radio':' dialogue';
    const text=isThought?b.t.trim().slice(1,-1):b.t;
    const profile=speakerInfo(isNarration?'sys':isAi?'cheollian':isRadio?'radio':b.who);
    const face=profile.portrait&&!isAi&&!isNarration&&!isRadio
      ? `<img class="bubble-face" src="${profile.portrait}" alt="${esc(profile.name)} 초상">`:'';
    const label=isNarration?'길 위':isThought?'생각':isAi?'천리안 방송':isRadio?'라디오':profile.name;
    const bb=el('div','bubble'+kind,`${face}<span class="bubble-copy"><span class="who">${esc(label)}</span><span>${safeHtml(text)}</span></span>`);
    wrap.appendChild(bb);
    requestAnimationFrame(()=>bb.classList.add('show'));
    const hold=isRadio?7000:isNarration?3800:isThought?4200:Math.min(6800,4200+Math.max(0,text.length-32)*38);
    speechTimer=setTimeout(()=>{
      bb.classList.remove('show');
      speechTimer=setTimeout(()=>{ bb.remove(); speechBusy=false; showNextSpeech(); },350);
    },hold);
  }
  function clearSpeech(){
    clearTimeout(speechTimer);
    speechQueue.length=0;
    speechBusy=false;
    const wrap=$('#bubbles');
    if(wrap) wrap.replaceChildren();
  }

  /* ── toast ── */
  function toast(html, cls){
    const host=$('#toasts');
    while(host.children.length>=2) host.firstElementChild.remove();
    const t=el('div','toast '+(cls||''), html);
    host.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); }, 3400);
  }

  /* ── EVENT SHEET ── */
  let curEv=null, curStory=null;
  let curCombatChoices=[];
  let storyAuto=localStorage.getItem('caravan_story_auto')!=='0', storyAutoTimer=0;
  let combatShowDetail=localStorage.getItem('caravan_combat_detail')==='1';
  let combatPhaseDifficultyProfiles=Object.create(null);
  function combatProfileKey(evd, state){
    const stateRunId=state&&Number.isFinite(state.runId)?`run:${state.runId}`:null;
    if(stateRunId) return stateRunId;
    const stateId=state&&state.id ? String(state.id) : null;
    if(stateId) return stateId;
    const combatId=evd&&evd.combat&&evd.combat.id;
    if(combatId) return String(combatId);
    return evd&&evd.id ? String(evd.id) : null;
  }
  function rememberCombatPhaseDifficulty(evd, state, summary){
    if(!summary) return;
    const c=evd&&evd.combat;
    const key=combatProfileKey(evd,state);
    if(!key||!c||!Number.isFinite(c.phase)) return;
    const phase=Math.floor(c.phase);
    const profile=combatPhaseDifficultyProfiles[key]
      || (combatPhaseDifficultyProfiles[key]={phases:{},updatedAt:Date.now(),total:0});
    const total=Number.isFinite(c.total)?Math.max(1,Math.floor(c.total)):profile.total||0;
    profile.phases[phase]={
      step:c.step||'',
      phase,
      total,
      avgPercent:summary.avgPercent,
      avgLabel:summary.avgLabel,
      avgClass:summary.avgClass,
      avgScore10:summary.avgScore10,
      updatedAt:Date.now()
    };
    profile.total=Math.max(profile.total,total);
    profile.updatedAt=Date.now();
  }
  function combatPhaseSummaryHtml(evd,state){
    const key=combatProfileKey(evd,state);
    if(!key) return '';
    const profile=combatPhaseDifficultyProfiles[key];
    if(!profile||!profile.phases) return '';
    const c=evd&&evd.combat;
    const current=Number.isFinite(c&&c.phase)?Math.floor(c.phase):null;
    const phases=Object.keys(profile.phases)
      .map(v=>Number(v))
      .filter(n=>Number.isFinite(n))
      .sort((a,b)=>a-b);
    if(!phases.length) return '';
    const chips=phases.map((phase,index)=>{
      const row=profile.phases[phase];
      const label=`P${phase}${row.total?`/${row.total}`:''}`;
      const cls=row.avgClass||'neutral';
      const active=phase===current ? ' on' : '';
      /* 정확한 %는 결과 뒤 리포트의 몫 — 선택 전에는 등급만 보여 준다 */
      const title=row.step?`${row.step} · ${row.avgLabel}`:row.avgLabel;
      const previous=phases[index-1];
      const prevRow=previous!==undefined ? profile.phases[previous] : null;
      const delta = prevRow ? row.avgPercent - prevRow.avgPercent : 0;
      const jump = prevRow && Math.abs(delta)>=15 ? ' jump' : '';
      const trendText = prevRow ? ` ${delta>=0?'↗':'↘'}` : '';
      return `<span class="combat-phase-chip ${cls}${active}${jump}" title="${esc(title)}">${esc(label)} ${esc(row.avgLabel)}${esc(trendText)}</span>`;
    }).join('');
    return `<div class="combat-phase-summary"><b>단계 난이도</b>${chips}</div>`;
  }
  function combatHudHtml(evd,opt={}){
    const c=evd&&evd.combat;
    if(!c) return '';
    const state=opt.state===undefined?S.combat:opt.state;
    const edge=state?state.edge||0:0;
    const grade=edge>=2?'우세':edge<0?'불리':'팽팽';
    const injuries=Object.keys(S.injuries||{}).length;
    const track=Array.from({length:c.total},(_,i)=>`<i class="${i<c.phase?'on':''}"></i>`).join('');
    const history=state&&Array.isArray(state.history)?state.history:[];
    const last=history[history.length-1];
    const terrain=c.terrain||(state&&state.terrain)||'';
    const stakes=c.stakes||(state&&state.stakes)||'';
    let intent=c.intent||'';
    const adapted=G.threatAdaptedTactic&&G.threatAdaptedTactic(evd);
    if(adapted&&c.counters&&c.counters[adapted])
      intent+=` — 저쪽도 배웠다. ${adapted} 대응이 더는 통하지 않는다`;
    const read=state&&state.read;
    const pressure=state?state.pressure||0:c.pressure||0;
    const kind=(state&&state.kind)||c.kind||'교전';
    const report=opt.ended&&S.lastCombatReport;
    const reportCost=report&&report.costs&&report.costs.length?report.costs.join(' · '):'추가 손실 없음';
    const adaptivePercent = report&&report.adaptive&&Number.isFinite(report.adaptive.end)
      ? report.adaptive.end
      : Number.isFinite(state&&state.adaptivePercent) ? state.adaptivePercent
      : Number.isFinite(state&&state.adaptive) ? Math.round(state.adaptive*100) : 0;
    const adaptiveLabel = `${adaptivePercent>=0?'+':''}${adaptivePercent}%`;
    const adaptiveClass = adaptivePercent>1 ? 'good' : adaptivePercent<-1 ? 'bad' : 'neutral';
    const adaptiveTrendPercent = Number.isFinite(G.combatAdaptiveTrendPercent&&G.combatAdaptiveTrendPercent())
      ? G.combatAdaptiveTrendPercent() : 0;
    const adaptiveTrendLabel = `${adaptiveTrendPercent>=0?'+':''}${adaptiveTrendPercent}%`;
    const adaptiveTrendClass = adaptiveTrendPercent>0 ? 'good' : adaptiveTrendPercent<0 ? 'bad' : 'neutral';
    const difficulty=combatChoiceSummary(opt.combatChoices);
    const risk = combatChoiceRiskTag(difficulty);
    const riskTag = risk.label;
    const riskTagClass = risk.className;
    const phaseSummary=combatShowDetail?combatPhaseSummaryHtml(evd,state):'';
    const resultClass=report?` combat-result-${report.resultCode}`:'';
    const reportGain=report&&report.gains&&report.gains.length?report.gains.join(' · '):'추가 획득 없음';
    const adaptiveChange=report&&report.adaptive&&report.adaptive.delta||0;
    const adaptiveCopy=adaptiveChange>0
      ? `다음 교전 회복 보정 +${adaptiveChange}%`
      : adaptiveChange<0 ? `다음 교전 보정 ${adaptiveChange}%` : '다음 교전 보정 유지';
    /* 선택 전 예보는 등급으로만 — 정확한 %는 결과 뒤 디브리프에서 공개한다 */
    const compactForecast=difficulty
      ? `<div class="combat-forecast"><span class="combat-tier ${riskTagClass}">${riskTag}</span><span>가장 나은 수</span><strong>${esc(difficulty.bestLabel)}</strong></div>`
      : '';
    const detailForecast=difficulty
      ? `<div class="combat-difficulty">
          <span class="combat-tier ${difficulty.avgClass}">전망 ${esc(difficulty.avgLabel)}</span>
          <span class="combat-tier ${riskTagClass}">선택 위험도 ${riskTag}</span>
          <span class="combat-tier ${adaptiveClass}">적응 보정 ${adaptiveLabel}</span>
          <span class="combat-tier ${adaptiveTrendClass}">최근 추세 ${adaptiveTrendLabel}</span>
          <span class="combat-tier ${difficulty.bestClass}">가장 확실한 수 · ${esc(difficulty.bestLabel)}</span>
          <span class="combat-tier ${difficulty.worstClass}">가장 위험한 수 · ${esc(difficulty.worstLabel)}</span>
          ${phaseSummary||''}
        </div>`
      : phaseSummary;
    const screenText = `${esc(kind)} 상황 / 단계 ${c.phase}/${c.total} / 진행 ${grade}${report?` / 결과 ${report.result}`:''} / 적응형 난이도 ${adaptiveLabel} / 추세 ${adaptiveTrendLabel} / ${riskTag}`;
    return `<section class="combat-hud${resultClass}" role="status" aria-live="polite" aria-atomic="true" aria-label="${screenText}">
      <div class="combat-hud-head"><span class="combat-phase">${opt.result?'결과':esc(kind)} ${c.phase}/${c.total}</span>
        <b class="combat-step">${c.step}</b><span class="combat-threat">${c.threat}</span></div>
      <div class="combat-objective"><b>${opt.result?(opt.ended?'마침':'결과'):'목표'}</b><span>${opt.result?(opt.ended?'선택의 결과를 확인하고 현장을 마무리한다':'이 선택이 다음 단계의 진행을 바꾼다'):c.objective}</span></div>
      ${!opt.result&&intent?`<div class="combat-intent"><b>다음 움직임</b><span>${esc(intent)}</span></div>`:''}
      ${!opt.result&&terrain?`<div class="combat-context"><span><b>지형</b>${esc(terrain)}</span>${stakes?`<span><b>실패하면</b>${esc(stakes)}</span>`:''}</div>`:''}
      ${read?`<div class="combat-read"><b>읽어낸 틈</b><span>${esc(read.label)}</span></div>`:''}
      ${combatShowDetail?detailForecast:compactForecast}
      ${last?`<div class="combat-last ${opt.result?'result':''}"><b>${opt.result?'방금 선택':'직전 선택'}</b><span><strong>${esc(last.tactic)}</strong>${esc(last.label)}${last.response?`<small>${esc(last.response)}</small>`:''}</span></div>`:''}
      ${report?`<div class="combat-debrief">
        <div class="combat-debrief-head"><strong>${esc(report.result)}</strong><span>${esc(report.objective||report.threat)}</span></div>
        <div class="combat-debrief-grid">
          <span><b>전술</b>${esc(report.tactics.join(' → ')||'행동 기록 없음')}</span>
          <span><b>결정적 행동</b>${esc(report.keyMoment||'현장에서 이탈')}</span>
          <span class="combat-cause"><b>결과 요인</b>${esc(report.causeSummary||'요인 기록 없음')}</span>
          <span class="gain"><b>얻은 것</b>${esc(reportGain)}</span>
          <span class="cost"><b>치른 대가</b>${esc(reportCost)}</span>
        </div>
        <div class="combat-recovery"><span>${esc(adaptiveCopy)}</span><span>다음 두 사건은 조용한 호흡을 우선합니다</span></div>
      </div>`:''}
      <div class="combat-track" aria-hidden="true">${track}</div>
      <div class="sr-only">적응형 난이도는 최근 전투 결과로 조정됩니다. 현재 보정은 ${adaptiveLabel}, 최근 추세는 ${adaptiveTrendLabel}, 선택 위험도는 ${riskTag}입니다.</div>
      <div class="combat-state"><span class="${grade==='우세'?'good':grade==='불리'?'bad':''}">진행 ${grade}</span>
        <span class="${pressure>=2?'bad':pressure===0?'good':''}">압박 ${pressure}/3</span>
        ${combatShowDetail?`<span class="${adaptiveClass}">적응 ${adaptiveLabel}</span><span class="${adaptiveTrendClass}">추세 ${adaptiveTrendLabel}</span>`:''}
        ${combatShowDetail||S.van<35?`<span class="${S.van<35?'bad':''}">차체 ${Math.ceil(S.van)}%</span>`:''}
        ${combatShowDetail||S.pursuit>=3?`<span class="${S.pursuit>=3?'bad':''}">관측 ${S.pursuit}/5</span>`:''}
        ${injuries?`<span class="bad">부상 ${injuries}명</span>`:''}</div></section>`;
  }
  function combatChoiceSummary(pool){
    if(!Array.isArray(pool)||!pool.length) return null;
    const adaptivePercent = S&&S.combat&&Number.isFinite(S.combat.adaptivePercent)
      ? S.combat.adaptivePercent : 0;
    const rows=pool
      .map(entry=>{
        const odds = Number.isFinite(entry.odds) ? entry.odds : (Number.isFinite(entry.pct) ? entry.pct/100 : NaN);
        if(!Number.isFinite(odds)) return null;
        const meta=G.combatDifficultyMeta(odds);
        const base=Number.isFinite(entry.base)?entry.base:odds;
        const label=stripTags(entry.label||'전술 선택').trim()||'전술 선택';
        return {
          pct:meta.pct,
          base:Math.round(base*100),
          delta:Math.round((meta.pct - Math.round(base*100))),
          label,
          className:entry.className||meta.className,
          score10:meta.score10
        };
      })
      .filter(Boolean);
    if(!rows.length) return null;
    rows.sort((a,b)=>b.pct-a.pct);
    const avgPercent=Math.round(rows.reduce((sum,r)=>sum+r.pct,0)/rows.length);
    const avgBase=Math.round(rows.reduce((sum,r)=>sum+r.base,0)/rows.length);
    const avgDelta=Math.round(rows.reduce((sum,r)=>sum+r.delta,0)/rows.length);
    const avgMeta=G.combatDifficultyMeta(avgPercent/100);
    const avgBaseMeta=G.combatDifficultyMeta(avgBase/100);
    const best=rows[0];
    const worst=rows[rows.length-1];
    const safeCount = rows.filter(r=>r.pct>=45).length;
    const warningCount = rows.filter(r=>r.pct>=26&&r.pct<=35).length;
    const criticalCount = rows.filter(r=>r.pct<=25).length;
    return {
      avgPercent,
      avgLabel:avgMeta.label,
      avgClass:avgMeta.className,
      avgScore10:avgMeta.score10,
      avgDelta,
      bestPercent:best.pct,
      bestLabel:best.label,
      bestBase:best.base,
      bestScore10:best.score10,
      bestDelta:best.delta,
      worstPercent:worst.pct,
      worstLabel:worst.label,
      worstBase:worst.base,
      worstScore10:worst.score10,
      worstDelta:worst.delta,
      avgBase,
      avgBaseLabel:avgBaseMeta.label,
      avgBaseScore10:avgBaseMeta.score10,
      bestClass:rows[0].className,
      worstClass:rows[rows.length-1].className,
      adaptivePercent,
      safeCount,
      warningCount,
      criticalCount,
      riskCount:warningCount+criticalCount
    };
  }
  function combatChoiceRiskTag(difficulty){
    if(!difficulty) return {label:'불균형',className:'hard'};
    if(difficulty.criticalCount>0) return {label:'⚠ 고위험',className:'bad'};
    if(difficulty.warningCount>0) return {label:'주의',className:'hard'};
    if(difficulty.safeCount>0) return {label:'안전권',className:'good'};
    return {label:'불균형',className:'hard'};
  }
  function combatChoiceRiskMeta(basePercent){
    if(!Number.isFinite(basePercent)) return {label:'안정',cls:'combat-risk-combat-safe'};
    if(basePercent<=25) return {label:'위험',cls:'combat-risk-combat-critical'};
    if(basePercent<=35) return {label:'주의',cls:'combat-risk-combat-warning'};
    if(basePercent<=45) return {label:'보통',cls:'combat-risk-combat-hint'};
    return {label:'안정',cls:'combat-risk-combat-safe'};
  }
  function eventChoiceData(evd){
    let html='', count=0;
    const combatChoices=[];
    const inCombat=!!(evd&&evd.combat);
    evd.choices.forEach((c,i)=>{
      const req=G.choiceReq(c);
      if(!G.reqVisible(req)) return;
      const rq=G.reqOk(req);
      const cost=G.reqCostText(req);
      const intentNote=G.combatIntentNote(evd,c);
      const readNote=G.combatReadNote(c);
      const routeId=(c.out||[]).map(o=>o.fx&&o.fx.routeChoice).find(Boolean);
      const route=routeId&&G.routeForecast(routeId);
      const adaptivePercent = S&&S.combat&&Number.isFinite(S.combat.adaptivePercent)
        ? S.combat.adaptivePercent : G.combatAdaptivePercent();
      const adaptiveText = adaptivePercent===0 ? '' : ` · 적응 보정 ${adaptivePercent>=0?'+':''}${adaptivePercent}%`;
      count++;
      const title = c.tactic ? `<span class="combat-tactic">${esc(c.tactic)}</span><span>${safeHtml(c.label)}</span>` : `<span>${safeHtml(c.label)}</span>`;
      /* 판정이 없는 선택(단일 결과)에 전망을 붙이면 확정 결과에 난이도를 매기는 셈이다.
         실제로 굴리는 선택에만 전망을 보여 준다. */
      const rolls=c.combatRoll!==undefined && Array.isArray(c.out) && c.out.length>1;
      const profile=(inCombat&&rolls) ? G.combatOddsBreakdown(c,evd) : null;
      const oddsMeta=G.combatDifficultyMeta(profile&&profile.odds);
      const vehicleText=profile&&profile.vehicleSources&&profile.vehicleSources.length
        ? ` · 차량 대응 ${profile.vehicleSources.join(' + ')}`:'';
      /* 척도는 하나만 — 등급(우세/팽팽/불리)이 유일한 서열이고,
         위험 칩은 경고일 때만 나온다(모든 카드에 같은 칩이 붙으면 정보가 0이다). */
      const riskMeta = profile ? combatChoiceRiskMeta(oddsMeta.pct) : null;
      const riskWarn = riskMeta && ['위험','주의'].includes(riskMeta.label);
      const riskChip = riskWarn ? `<span class="combat-risk ${riskMeta.cls}">⚠ ${riskMeta.label}</span>` : '';
      /* 선택 전에는 %가 아니라 등급과 "실패하면 무엇을 잃는가"를 보여 준다.
         정확한 수치 분해는 결과 뒤 리포트(combatMeta)가 담당한다. */
      const failCost = profile ? G.combatFailurePreview(c) : '';
      const failNote = failCost ? `실패하면 ${failCost}` : '';
      const compactOddsNote=[readNote,G.combatContextNote(c),failNote].filter(Boolean).join(' · ');
      const oddsLabel = profile
        ? combatShowDetail
          ? `판정 전망 · ${G.combatGrade(c,evd)} · ${oddsMeta.label} · ${G.combatTacticNote(c)}${readNote?` · ${readNote}`:''}${G.combatContextNote(c)?` · ${G.combatContextNote(c)}`:''}${vehicleText}${failNote?` · ${failNote}`:''}`
          : compactOddsNote
        : '';
      if(profile){
        combatChoices.push({
          odds:oddsMeta.odds,pct:oddsMeta.pct,label:G.combatChoiceChoiceText(c),className:oddsMeta.className,score10:oddsMeta.score10,
          base:Number.isFinite(profile&&profile.base)?profile.base:oddsMeta.odds,baseSource:profile&&profile.baseSource
          ,adaptivePercent:profile.adaptivePercent||adaptivePercent
        });
      }
      const liveBits=[
        `${count}번째 선택`,
        stripTags(c.label || ''),
        profile ? `${oddsLabel} (${G.combatGrade(c,evd)})` : '',
        riskMeta ? `위험도 ${riskMeta.label}` : '',
        rq.ok ? '요구사항 충족' : `요구 조건: ${rq.t}`,
        intentNote || '',
        G.combatContextNote(c) || '',
        vehicleText ? vehicleText.replace(/^ · /,'') : ''
      ].filter(Boolean);
      html+=`<button class="choice" data-i="${i}" ${rq.ok?'':'disabled'} aria-label="${esc(liveBits.join(' · '))}">
          <div class="choice-head"><span class="choice-index">${count}</span><span class="choice-title">${title}</span></div>
          ${intentNote?`<span class="combat-response">↳ ${esc(intentNote)}</span>`:''}
          ${c.risk?`<span class="risk">⚠ ${c.risk}</span>`:''}
          ${riskChip}
          ${profile?`<span class="combat-odds"><span class="combat-tier ${oddsMeta.className}">${esc(G.combatGrade(c,evd))}</span>${oddsLabel?` · ${esc(oddsLabel)}`:''}</span>`:''}
          ${route?`<span class="route-forecast"><b>${route.km}km · 순수 주행 ${G.durationLabel(route.minutes)} · 연료 약 ${route.fuel}L</b><small>${route.rough?`험로 ${route.rough}구간 · `:''}보급 거점 ${route.stops}곳 · ${esc(route.readiness)}</small></span>`:''}
          ${cost?`<span class="req">${rq.ok?'✓':'✗'} ${cost}</span>`:''}
        </button>`;
    });
    const difficulty=combatChoiceSummary(combatChoices);
    if(inCombat&&difficulty){
      const tips=[];
      const trend=G.combatAdaptiveTrendPercent();
      /* 선택 전에는 숫자를 감춘다는 계약을 여기서도 지킨다 —
         "25% 이하가 하나 있다"는 어느 것인지 안 알려주면서 수치만 흘리는 최악의 조합이었다. */
      if(difficulty.criticalCount>0) tips.push(`무리한 수가 ${difficulty.criticalCount}개 섞여 있다`);
      else if(difficulty.warningCount>0) tips.push(`위태로운 수가 ${difficulty.warningCount}개 있다`);
      else if(difficulty.safeCount===0) tips.push(`확실한 수는 없다`);
      if(trend>2) tips.push(`적응 추세 강화 중`);
      if(tips.length) html=`<div class="combat-choice-hint">${tips.map(t=>`<span>${esc(t)}</span>`).join(' · ')}</div>${html}`;
    }
    if(inCombat) rememberCombatPhaseDifficulty(evd,S.combat,difficulty);
    return {html,count,combatChoices,difficulty};
  }
  function eventSceneKeys(evd, leading=[]){
    const keys=[];
    const add=(value)=>{
      if(Array.isArray(value)){ value.forEach(add); return; }
      if(value&&D.scenes&&D.scenes[value]&&!keys.includes(value)) keys.push(value);
    };
    /* 장면 후보는 우선순위다. 전용 컷과 지역·공용 컷을 한 배열에 섞으면
       대사마다 서로 관계없는 사진이 순환하므로, 먼저 찾은 계층만 쓴다. */
    add(leading);
    if(keys.length) return keys;
    const turnCuts=evd&&D.eventTurnScenes&&D.eventTurnScenes[evd.id];
    add(turnCuts);
    if(keys.length) return keys;
    add(evd&&evd.scenes);
    add(evd&&evd.scene);
    add(evd&&D.eventScenes&&D.eventScenes[evd.id]);
    if(keys.length) return keys;
    add(evd&&evd.locEvent&&D.nodeScenes&&D.nodeScenes[evd.locEvent]);
    if(keys.length) return keys;
    const fallbackType=evd&&((evd.ai||evd.type==='추적')?'추적':evd.type);
    add(fallbackType&&D.eventSceneTypes&&D.eventSceneTypes[fallbackType]);
    if(keys.length) return keys;
    add(typeof S!=='undefined'&&S&&D.nodeScenes&&D.nodeScenes[S.at]);
    if(keys.length) return keys;
    add('generic-story');
    return keys;
  }
  function sceneFrameHtml(sceneKeys, sceneAlt){
    const key=sceneKeys&&sceneKeys[0], src=key&&D.scenes&&D.scenes[key];
    if(!src) return '';
    return `<div class="event-scene-frame" role="button" tabindex="0"
      data-scene-key="${esc(key)}" data-cut-token="initial"
      aria-label="${esc(sceneAlt)} 장면 크게 보기">
      <img class="event-scene" src="${src}" alt="${esc(sceneAlt)} 장면" decoding="async" loading="eager" fetchpriority="high">
      <span class="scene-cut-mark" aria-hidden="true">컷 1 / 1</span>
      <span class="scene-zoom" aria-hidden="true">↗</span></div>`;
  }
  function storySceneShot(state,turn,index){
    const lanes=dialogueLaneMap(state.turns);
    const side=turn&&turn.kind==='dialogue'?dialogueSide(turn,lanes):'center';
    const cadence=Math.floor(index/2);
    const shotCycle=[
      {x:50,y:50,scale:1.00},{x:42,y:48,scale:1.08},
      {x:58,y:53,scale:1.12},{x:50,y:60,scale:1.16}
    ];
    let shot=shotCycle[cadence%shotCycle.length], tone=state.phase==='outcome'?'outcome':'story';
    if(turn&&turn.kind==='dialogue'){
      const swing=cadence%2?6:0;
      shot=side==='right'
        ? {x:68+swing,y:48+(cadence%3)*3,scale:1.11+(cadence%3)*.025}
        : {x:32-swing,y:48+(cadence%3)*3,scale:1.11+(cadence%3)*.025};
    }else if(turn&&['record','letter','thought'].includes(turn.kind)){
      shot={x:cadence%2?58:42,y:61,scale:1.18+(cadence%2)*.025};
      tone='memory';
    }else if(turn&&['ai','radio'].includes(turn.kind)){
      shot={x:50+(cadence%2?8:-8),y:45,scale:1.14+(cadence%3)*.02};
      tone='ai';
    }
    return {side,tone,...shot};
  }
  function renderStoryScene(state,turn,index){
    const sheet=$('#ev-sheet'), frame=sheet&&sheet.querySelector('.event-scene-frame');
    const keys=state&&state.sceneKeys||[];
    if(!frame||!keys.length) return;
    const stages=D.eventTurnSceneStages&&D.eventTurnSceneStages[state.eventId];
    let key;
    if(Array.isArray(stages)&&stages.length){
      const stage=[...stages].reverse().find(item=>index>=item.at);
      if(stage&&keys.includes(stage.key)) key=stage.key;
    }
    if(!key){
      const total=Math.max(1,state.turns.length);
      const section=Math.min(keys.length-1,Math.floor(index*keys.length/total));
      key=keys[Math.min(keys.length-1,(state.sceneStart||0)+section)];
    }
    const src=D.scenes&&D.scenes[key], img=frame.querySelector('.event-scene');
    if(!src||!img) return;
    const priorKey=frame.dataset.sceneKey;
    const firstRender=frame.dataset.cutToken==='initial';
    const changed=priorKey!==key;
    const refreshShot=turn&&turn.kind==='dialogue' && !changed && index%2===0;
    frame.dataset.sceneKey=key;
    frame.dataset.speaker=turn&&turn.kind==='dialogue'
      ? speakerInfo(turn.who,turn.name).id||'unknown'
      : turn&&turn.kind||'narration';
    const carry=firstRender&&state.sceneCarry&&state.sceneCarry.key===key
      ? state.sceneCarry:null;
    const cutCount=Math.max(1, state.sceneKeys ? state.sceneKeys.length : 1);
    if(firstRender) state.sceneCut=1;
    if(changed){
      state.sceneCut=(state.sceneCut||1)+1;
      if(cutCount>1) state.sceneCut=Math.min(state.sceneCut,cutCount);
    }
    if(carry){
      frame.dataset.cutToken=`carry-${state.phase}-${key}`;
      frame.dataset.tone=carry.tone||state.phase;
      frame.style.setProperty('--scene-x',carry.x||'50%');
      frame.style.setProperty('--scene-y',carry.y||'50%');
      frame.style.setProperty('--scene-scale',carry.scale||'1');
      if(priorKey!==key) img.src=src;
      state.sceneCarry=null;
    }else if(firstRender||changed||refreshShot){
      const shot=storySceneShot(state,turn,index);
      frame.dataset.cutToken=`${state.phase}-${index}-${key}`;
      frame.dataset.tone=shot.tone;
      frame.style.setProperty('--scene-x',`${shot.x}%`);
      frame.style.setProperty('--scene-y',`${shot.y}%`);
      frame.style.setProperty('--scene-scale',String(shot.scale));
      if(changed) img.src=src;
    }
    img.alt=`${state.sceneAlt} · ${index+1}번째 장면`;
    const mark=frame.querySelector('.scene-cut-mark');
    if(mark){
      const hasCuts=cutCount>1;
      const cut=Math.min(state.sceneCut||1,cutCount);
      mark.textContent= hasCuts
        ? `컷 ${cut} / ${cutCount}`
        : `${state.label||'대화'} ${index+1} / ${state.turns.length}`;
    }
    img.classList.remove('scene-recut');
    if(changed||refreshShot){
      void img.offsetWidth;
      img.classList.add('scene-recut');
    }
  }
  function wireSceneZoom(sheet){
    const sceneFrame=sheet.querySelector('.event-scene-frame');
    if(sceneFrame) sceneFrame.onclick=()=>sceneFrame.classList.toggle('zoomed');
  }
  function clearStoryAuto(){
    if(storyAutoTimer){ clearTimeout(storyAutoTimer); storyAutoTimer=0; }
  }
  function setStoryAuto(value){
    storyAuto=!!value;
    localStorage.setItem('caravan_story_auto',storyAuto?'1':'0');
  }
  function setCombatShowDetail(value){
    combatShowDetail=!!value;
    localStorage.setItem('caravan_combat_detail',combatShowDetail?'1':'0');
  }
  function storyAutoDelay(turn){
    const test=Number(window.__CARAVAN_TEST_AUTO_MS);
    if(Number.isFinite(test)&&test>0) return test;
    const chars=stripTags(turn&&turn.text||'').replace(/\s/g,'').length;
    const base=1400+chars*88+(turn&&turn.sfx?700:0);
    return Math.max(2600,Math.min(8200,turn&&turn.voice?Math.max(base,5200):base));
  }
  function advanceStory(state){
    if(!state||curStory!==state||state.index>=state.turns.length-1) return;
    clearStoryAuto();
    state.reviewing=false;
    state.userHoldingStory=false;
    state.index++;
    renderStoryState();
    const sheet=$('#ev-sheet'), scroll=sheet&&sheet.querySelector('.event-scroll');
    const reader=sheet&&sheet.querySelector('.story-reader');
    const latest=reader&&reader.querySelector('[data-story-entry]:last-child');
    if(scroll&&reader&&latest){
      const bottom=reader.offsetTop+latest.offsetTop+latest.offsetHeight;
      scroll.scrollTo({top:Math.max(0,bottom-scroll.clientHeight+28),behavior:'auto'});
    }
  }
  function scheduleStoryAuto(state,turn){
    clearStoryAuto();
    if(!storyAuto||!state||state.index>=state.turns.length-1||state.reviewing||state.userHoldingStory) return;
    const expectedIndex=state.index, delay=storyAutoDelay(turn);
    storyAutoTimer=setTimeout(()=>{
      storyAutoTimer=0;
      if(document.hidden||state.reviewing||state.userHoldingStory||$('#ev-sheet .event-scene-frame.zoomed')){
        if(curStory===state&&state.index===expectedIndex) scheduleStoryAuto(state,turn);
        return;
      }
      if(curStory===state&&state.index===expectedIndex&&$('#ev-wrap').classList.contains('on'))
        advanceStory(state);
    },delay);
  }
  function wireStoryReviewPause(state,turn){
    const scroll=$('#ev-sheet .event-scroll'), toggle=$('#ev-sheet .story-auto-toggle');
    if(!scroll||!toggle) return;
    const sync=()=>{
      const waiting=storyAuto&&(state.reviewing||state.userHoldingStory);
      toggle.classList.toggle('waiting',waiting);
      toggle.textContent=!storyAuto?'자동 OFF':waiting?'자동 대기':'자동 ON';
      toggle.setAttribute('aria-label',!storyAuto?'자동 진행 꺼짐'
        :waiting?'지난 대화를 보는 동안 자동 진행 대기':'자동 진행 켜짐');
    };
    const reviewPosition=()=>{
      const gap=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight;
      state.reviewing=gap>72;
      sync();
    };
    scroll.onpointerdown=()=>{
      state.userHoldingStory=true;
      clearStoryAuto();
      sync();
    };
    const release=()=>{
      state.userHoldingStory=false;
      reviewPosition();
      if(!state.reviewing) scheduleStoryAuto(state,turn);
    };
    scroll.onpointerup=release;
    scroll.onpointercancel=release;
    scroll.onscroll=()=>{
      if(!state.userHoldingStory) return;
      reviewPosition();
    };
    scroll.onwheel=()=>{
      state.userHoldingStory=true;
      clearStoryAuto();
      requestAnimationFrame(()=>{
        state.userHoldingStory=false;
        reviewPosition();
        if(!state.reviewing) scheduleStoryAuto(state,turn);
      });
    };
    sync();
  }
  function renderStoryState(){
    const state=curStory, sheet=$('#ev-sheet');
    if(!state||!sheet) return;
    clearStoryAuto();
    const reader=sheet.querySelector('.story-reader');
    const dock=sheet.querySelector('.event-choice-dock');
    const turn=state.turns[Math.min(state.index,state.turns.length-1)];
    reader.innerHTML=storyReaderHtml(state.turns,state.index,{lanes:state.lanes});
    renderStoryScene(state,turn,state.index);
    if(turn&&state.audioIndex!==state.index){
      state.audioIndex=state.index;
      if(turn.voice) VO.play(turn.voice);
      if(turn.sfx) AMBI.play(turn.sfx,.42);
    }
    const live=$('#story-live');
    if(live&&turn){
      const speaker=turn.kind==='dialogue'?(turn.name||speakerInfo(turn.who).name)+'의 말: '
        :turn.kind==='narration'?'장면 설명: ':`${state.label}: `;
      const combatSummary = state.phase==='event' ? combatChoiceSummary(curCombatChoices) : null;
      const adaptiveTrend = combatSummary ? G.combatAdaptiveTrendPercent() : 0;
      const adaptiveTrendText = adaptiveTrend===0 ? '' : ` / 추세 ${adaptiveTrend>=0?'+':''}${adaptiveTrend}%`;
      const riskText = combatSummary && (combatSummary.criticalCount || combatSummary.warningCount)
        ? combatSummary.criticalCount>0
          ? ` / 위험 ${combatSummary.criticalCount}개`
          : ` / 주의 ${combatSummary.warningCount}개`
        : '';
      const adaptiveSummary = combatSummary&&combatSummary.adaptivePercent!==undefined
        ? ` · 적응형 ${combatSummary.adaptivePercent>=0?'+':''}${combatSummary.adaptivePercent}%`
        : '';
      const suffix = combatSummary
        ? combatShowDetail
          ? ` / 전투 난이도 ${combatSummary.avgLabel} ${combatSummary.avgPercent}% (${combatSummary.avgScore10}/10), 기본 ${combatSummary.avgBase}%(${combatSummary.avgBaseLabel} · ${combatSummary.avgBaseScore10}/10), 보정 ${combatSummary.avgDelta>=0?'+':''}${combatSummary.avgDelta}%, 최저 ${combatSummary.worstPercent}%(${combatSummary.worstScore10}/10, 기본 ${combatSummary.worstBase}% / ${combatSummary.worstDelta>=0?'+':''}${combatSummary.worstDelta}%) / 최고 ${combatSummary.bestPercent}%(${combatSummary.bestScore10}/10, 기본 ${combatSummary.bestBase}% / ${combatSummary.bestDelta>=0?'+':''}${combatSummary.bestDelta}%) ${adaptiveSummary}${riskText}${adaptiveTrendText}`
          : ` / 전투 난이도 ${combatSummary.avgLabel} ${combatSummary.avgPercent}% (${combatSummary.avgScore10}/10), 최저 ${combatSummary.worstPercent}% / 최고 ${combatSummary.bestPercent}% ${adaptiveSummary}${riskText}${adaptiveTrendText}`
        : '';
      live.textContent=speaker+stripTags(turn.text)+suffix;
    }
    const dockHeight=dock ? Math.min(224,Math.max(170,dock.offsetHeight||194)) : 194;
    const compact=state.turns.length<=16 && (reader.scrollHeight + dockHeight) < (sheet.clientHeight||420);
    sheet.classList.toggle('story-compact',compact);
    const entering=reader.querySelector('[data-story-entry]:last-child');
    if(entering){
      entering.classList.add('turn-enter');
      requestAnimationFrame(()=>entering.classList.remove('turn-enter'));
    }
    const last=state.index>=state.turns.length-1;
    if(!last){
      const next=state.turns[state.index+1];
      const nextLabel=next.kind==='dialogue'||next.kind==='letter'?'다음 대화'
        :next.kind==='ai'||next.kind==='radio'?'다음 방송':'다음 장면';
      const autoCopy=next.kind==='dialogue'||next.kind==='letter'?'자동으로 다음 대화가 이어집니다'
        :next.kind==='ai'||next.kind==='radio'?'자동으로 다음 방송이 이어집니다':'자동으로 다음 장면이 이어집니다';
      const combatToggle=state.phase==='event' && curEv&&curEv.combat
        ? `<button class="story-combat-toggle${combatShowDetail?' on':''}" type="button" aria-pressed="${combatShowDetail}" aria-label="${combatShowDetail?'전투 상세 정보 켜짐':'전투 요약 모드 켜짐'}">${combatShowDetail?'🧠 상세':'🧾 요약'}</button>`
        : '';
      dock.classList.add('story-progress-dock');
      dock.innerHTML=`<div class="choice-dock-head"><span>${state.label} · ${state.index+1}/${state.turns.length}</span>
        <button class="story-auto-toggle${storyAuto?' on':''}" type="button" aria-pressed="${storyAuto}">${storyAuto?'자동 ON':'자동 OFF'}</button>
        ${combatToggle}</div>
        <button class="choice story-next" type="button">계속<span class="req">${nextLabel} · ${state.index+2}/${state.turns.length} · ${storyAuto?autoCopy:'직접 넘기기'}</span></button>`;
      dock.querySelector('.story-next').onclick=()=>advanceStory(state);
      dock.querySelector('.story-auto-toggle').onclick=()=>{
        setStoryAuto(!storyAuto);
        state.reviewing=false;
        state.userHoldingStory=false;
        renderStoryState();
      };
      const combatToggleButton=dock.querySelector('.story-combat-toggle');
      if(combatToggleButton){
        combatToggleButton.onclick=()=>{
          setCombatShowDetail(!combatShowDetail);
          renderStoryState();
        };
      }
      wireStoryReviewPause(state,turn);
      scheduleStoryAuto(state,turn);
      return;
    }
    dock.classList.remove('story-progress-dock');
    dock.innerHTML=state.finalDock;
    if(state.reveal&&!state.revealed){ state.revealed=true; state.reveal(); }
    if(state.wireFinal) state.wireFinal(dock);
  }
  function finishStory(){
    if(!curStory) return false;
    curStory.index=Math.max(0,curStory.turns.length-1);
    renderStoryState();
    return true;
  }
  function showEvent(evd){
    clearStoryAuto();
    curEv=evd;
    curStory=null;
    bgmEvKey = (evd.type==='추적'||evd.type==='위기'||evd.ai)?'tension': evd.type==='스토리'?'story':null;
    if(evd.id==='leo_broadcast') BGM.playSongOnce();   // 400km 송출 — 노래가 울려 퍼지는 그 장면
    const CVO={ai_vending:'cheollian_01', exp_glasshouse:'cheollian_02', ai_census:'cheollian_03',
      ai_gasstation:'cheollian_05', ai_manifest:'cheollian_09', seoul_gate:'cheollian_13'};
    if(CVO[evd.id]) VO.play(CVO[evd.id]);
    SND.setDriving(false);
    AMBI.event(evd);
    const sheet=$('#ev-sheet');
    sheet.classList.add('event-mode');
    const aiEvent = evd.type==='추적'||!!evd.ai;
    $('#cheollian-tint').classList.toggle('on', aiEvent);
    const text = typeof evd.text==='function'? evd.text(S):evd.text;
    const sceneAlt=stripTags(evd.title||'길 위의 사건');
    const sceneKeys=eventSceneKeys(evd);
    const scene=sceneFrameHtml(sceneKeys,sceneAlt);
    let context=D.storyContext&&D.storyContext[evd.id]
      ? `<div class="story-context"><b>앞 이야기</b>${D.storyContext[evd.id]}</div>` : '';
    const recruitQ=S.recruitQ, recruitDef=recruitQ&&D.recruitQuests[recruitQ.id];
    const approach=recruitQ&&G.recruitApproach();
    if(recruitDef&&approach&&(evd.id===recruitDef.follow||evd.id===recruitDef.join)){
      context=`<div class="story-context"><b>우리가 앞에서 한 일 · ${approach.label}</b>${approach.memory}</div>`+context;
    }
    const choices=eventChoiceData(evd);
    curCombatChoices=choices.combatChoices;
    const turns=prepareEventAudio(buildStoryTurns(text,evd,{turnSpeakers:evd.turnSpeakers}),evd);
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="${esc(sceneAlt)} 사건 내용">${scene}<div class="event-head"><div>
      <div class="tag ${aiEvent?'ai-tag':''}">${esc(evd.type)}${evd.gen?' · 오프로드 생성':''}</div>
      <h2>${esc(evd.title)}</h2></div></div>${context}${combatHudHtml(evd,{combatChoices:choices.combatChoices})}<div class="story-reader"></div></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    const lanes=dialogueLaneMap(turns);
    curStory={
      phase:'event',eventId:evd.id,label:evd.type==='대화'?'대화':'이야기',turns,index:0,
      knownSpeaker:!!turns.knownSpeaker,
      lanes,
      sceneKeys,sceneAlt,sceneStart:0,
      finalDock:`<div class="choice-dock-head"><span>${evd.id==='seoul_core'?'마지막 증언':'어떻게 할까?'} · ${choices.count}</span>
        <small>${choices.count>3?'위아래로 밀어 모두 보기':evd.id==='seoul_core'?'자동 진행이 멈췄습니다 · 실행안을 선택':'자동 진행이 멈췄습니다 · 직접 선택'}</small></div>
        <div class="choices" role="group" aria-label="선택지 목록">${choices.html}</div>`,
      wireFinal:(dock)=>dock.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
        if(b.hasAttribute('disabled')) return;
        const choice=evd.choices[+b.dataset.i];
        SND.combat(choice.sfx||'select');
        resolveChoice(choice);
      })
    };
    renderStoryState();
    wireSceneZoom(sheet);
    openModal('#ev-wrap','.story-next, .choice');
    if(evd.sfx) SND.combat(evd.sfx);
  }
  /* 본문 렌더 계약: 문자열은 전부 이스케이프하고, authored 데이터가 쓰는
     승인 태그 3종만 되살린다. 숫자는 clamp, 문자열은 escape — LLM/외부 문자열이
     이 경로에서 마크업으로 실행될 수 없다. */
  function safeHtml(t){
    return esc(t||'')
      .replace(/&lt;span class=&quot;(ai|em)&quot;&gt;/g,'<span class="$1">')
      .replace(/&lt;span style=&quot;color:var\(--faded\)&quot;&gt;/g,'<span style="color:var(--faded)">')
      .replace(/&lt;\/span&gt;/g,'</span>');
  }
  function fmt(t){ return safeHtml(t).replace(/\n/g,'<br>'); }

  /* ── 동료 시트 (유대·퍼크) ── */
  function showComp(id){
    const c=D.comps[id], st=S.comps[id];
    SND.setDriving(false);
    const next = st.lvl<3 ? D.bondTh[st.lvl] : null;
    const pct = next ? Math.min(100, st.bond/next*100) : 100;
    const joinedBy=G.recruitApproach(id);
    let h=`<div class="tag">동료 — ${c.cls}</div>
      <div class="comp-head"><div class="comp-face">${faceOf(id,c.face)}</div>
        <div><h2 style="margin:0">${c.name} <span class="clvl">Lv.${st.lvl}${st.lvl>=3?' MAX':''}</span></h2>
        <div class="csub">${c.role} · 기본: ${c.perk}</div></div></div>
      <div class="body" style="margin:10px 0 0;font-size:13px">${c.bio}</div>
      ${joinedBy?`<div class="story-context"><b>함께 타게 된 날 · ${esc(joinedBy.label)}</b>${esc(joinedBy.memory)}</div>`:''}
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
    h+=`<div class="choices" style="margin-top:12px">${!S.driving?`<button class="choice" data-talk="${id}">💬 말을 건다 <span class="req">하루 한 번 · 이야기가 유대를 만든다</span></button>`:''}<button class="choice" data-x="1">닫는다</button></div>`;
    const sheet=$('#ev-sheet');
    sheet.classList.remove('event-mode','story-compact');
    sheet.innerHTML=h;
    sheet.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{ G.choosePerk(id, +b.dataset.pk); showComp(id); });
    const tk=sheet.querySelector('[data-talk]');
    if(tk) tk.onclick=()=>{ if(G.talkTo(tk.dataset.talk)){} };
    sheet.querySelector('[data-x]').onclick=()=>{ closeEvent(); };
    openModal('#ev-wrap','[data-pk], [data-talk], [data-x]');
  }

  /* ── 작업대 (무기 제작) ── */
  function showCraft(){
    SND.setDriving(false);
    const sheet=$('#ev-sheet');
    sheet.classList.remove('event-mode','story-compact');
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
    openModal('#ev-wrap','[data-cr], [data-x]');
  }

  function resolveChoice(choice){
    clearStoryAuto();
    const qualityVisible=curEv.choices.filter(c=>G.reqVisible(G.choiceReq(c))).length;
    const qualityAvailable=curEv.choices.filter(c=>{
      const req=G.choiceReq(c);
      return G.reqVisible(req)&&G.reqOk(req).ok;
    }).length;
    G.qualityChoice(curEv,choice,Math.max(0,curEv.choices.indexOf(choice)),qualityVisible,qualityAvailable);
    const oldCombat=$('#ev-sheet').querySelector('.combat-hud');
    const combatBefore=S.combat?{...S.combat,edge:S.combat.edge||0,history:[...(S.combat.history||[])]}:{edge:0,pressure:0,history:[]};
    if(S.combat) SND.combat('confirm');
    const out=G.pickOutcome(curEv, choice);
    /* 마지막 선택은 combatEnd가 상태를 비우기 전에 먼저 기록한다.
       시작·중간 단계는 applyFx가 교전 상태를 만든 뒤 기록한다. */
    const combatMeta = out&&out.combatMeta&&typeof out.combatMeta==='object' ? out.combatMeta : null;
    let combatEntry=out.fx&&out.fx.combatEnd?G.rememberCombatChoice(curEv,choice,combatMeta):null;
    const chips=G.applyFx(out.fx);
    if(!combatEntry) combatEntry=G.rememberCombatChoice(curEv,choice,combatMeta);
    let combatHud='';
    if(oldCombat){
      let resultState=S.combat;
      if(!resultState){
        let edge=out.fx&&out.fx.combatStart?0:combatBefore.edge;
        if(out.fx&&out.fx.combatEdge) edge=clamp(edge+out.fx.combatEdge,-2,3);
        resultState={...combatBefore,edge,history:[...combatBefore.history,...(combatEntry?[combatEntry]:[])]};
      }
      combatHud=combatHudHtml(curEv,{state:resultState,result:true,ended:!!(out.fx&&out.fx.combatEnd),combatChoices:curCombatChoices});
    }
    if(out.sfx) SND.combat(out.sfx);
    if(out.fx&&out.fx.combatEnd){
      const resultCue=['success','partial','failure'].includes(out.fx.combatResult)?out.fx.combatResult:'failure';
      setTimeout(()=>SND.combat(resultCue),140);
    }
    chips.push(...G.afterChoice(curEv, choice, out));
    if(S.ended) return;
    const sheet=$('#ev-sheet');
    sheet.classList.add('event-mode');
    const outcomeText=typeof out.text==='function'?out.text(S):out.text;
    const knownSpeaker=!!(curStory&&curStory.knownSpeaker);
    const turns=buildStoryTurns(outcomeText,curEv,{
      knownSpeaker,
      speakers:out.speakers,
      turnSpeakers:out.turnSpeakers
    });
    const sceneAlt=stripTags(curEv.title||'선택의 결과');
    const choiceIndex=Math.max(0,curEv.choices.indexOf(choice));
    const choiceCuts=D.eventChoiceScenes&&D.eventChoiceScenes[curEv.id]
      &&D.eventChoiceScenes[curEv.id][choiceIndex];
    const explicitCuts=[out.scenes,out.scene,choice.scenes,choice.scene,choiceCuts];
    const priorFrame=sheet.querySelector('.event-scene-frame');
    const priorScene=priorFrame&&priorFrame.dataset.sceneKey;
    const priorShot=priorFrame?{
      key:priorScene,
      x:priorFrame.style.getPropertyValue('--scene-x'),
      y:priorFrame.style.getPropertyValue('--scene-y'),
      scale:priorFrame.style.getPropertyValue('--scene-scale'),
      tone:priorFrame.dataset.tone
    }:null;
    const sceneKeys=eventSceneKeys(curEv,explicitCuts);
    const hasExplicit=sceneKeys.length&&explicitCuts.some(value=>
      Array.isArray(value)?value.some(Boolean):Boolean(value));
    const outcomeSceneKeys=hasExplicit
      ? sceneKeys
      : eventSceneKeys(curEv,priorScene?[priorScene]:[]);
    const sceneCarry=priorShot&&outcomeSceneKeys[0]===priorShot.key?priorShot:null;
    const sceneStart=0;
    const scene=sceneFrameHtml(outcomeSceneKeys,sceneAlt);
    const fxHtml=chips.length
      ? '<div class="fx-line">'+chips.map(c=>`<span class="fx ${c.c}">${c.t}</span>`).join('')+'</div>'
      : '';
    let actions='';
    const chained=out.fx&&out.fx.chain;
    const chainEvent=chained&&D.events.find(e=>e.id===chained);
    if(out.fx&&out.fx.offerComp){
      const id=out.fx.offerComp, mp=G.maxParty(), full=S.party.length>=mp, c=D.comps[id], next=G.nextSeatUpgrade();
      actions+=`<button class="choice" data-r="yes" ${full?'disabled':''}>${c.face} ${c.name}를 태운다
          <span class="req">${full? '✗ 동료석 만석 '+S.party.length+'/'+mp+(next?' · '+next.nm+' 필요':'') : '✓ 동료 자리 '+S.party.length+'/'+mp+' · '+c.perk}</span></button>
        <button class="choice" data-r="no">작별 인사를 한다</button>`;
    } else {
      actions+=`<button class="choice" data-r="ok">${chained
        ?`다음 단계${chainEvent&&chainEvent.combat?' — '+esc(chainEvent.combat.step):''}`
        :'길로 돌아가기'}</button>`;
    }
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="선택 결과">${scene}
      <div class="event-head"><div><div class="tag">선택의 결과</div><h2>${esc(curEv.title)}</h2></div></div>
      ${combatHud}<div class="story-reader"></div><div class="story-result" role="status" aria-live="polite" aria-atomic="true"></div></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    const lanes=dialogueLaneMap(turns,curStory&&curStory.lanes);
    curStory={
      phase:'outcome',eventId:curEv.id,label:'결과',turns,index:0,
      knownSpeaker:!!turns.knownSpeaker,
      lanes,
      sceneKeys:outcomeSceneKeys,sceneAlt,sceneStart,sceneCarry,
      finalDock:`<div class="choice-dock-head"><span>${chained?'이야기 계속':'사건 마침'}</span><small>${chained?'다음 장면은 직접 넘어갑니다':'자동 진행이 끝났습니다'}</small></div>
        <div class="choices" role="group" aria-label="다음 행동">${actions}</div>`,
      reveal:()=>{ const result=sheet.querySelector('.story-result'); if(result) result.innerHTML=fxHtml; },
      wireFinal:(dock)=>dock.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
        if(b.hasAttribute('disabled')) return;
        if(b.dataset.r==='yes'&&out.fx.offerComp) G.doRecruit(out.fx.offerComp);
        closeEvent();
      })
    };
    renderStoryState();
    wireSceneZoom(sheet);
    renderHud();
  }
  function closeEvent(){
    clearStoryAuto();
    closeModal('#ev-wrap');
    curCombatChoices=[];
    $('#ev-sheet').classList.remove('event-mode','story-compact');
    $('#cheollian-tint').classList.remove('on');
    curEv=null;
    curStory=null;
    if(S.driving) SND.setDriving(true);
    AMBI.restore();
    renderAll(); G.save();
    /* 연쇄 이벤트 (시네마틱 시퀀스) */
    if(S && S._chain){ const cid=S._chain; S._chain=null; setTimeout(()=>G.openEventById(cid), 450); return; }
    const queued=G.popStory();
    if(queued){ setTimeout(()=>G.openEventById(queued), 450); return; }
    /* 서울 진입 후엔 오르막 맵으로 복귀 */
    if(S && S.flags && S.flags.seoul_open && !S.ended){ setTimeout(showSeoul, 300); }
  }
  function showSeoul(){
    const stops=D.seoulMap.stops, stage=G.seoulStage();
    const transfer=G.transferStatus();
    const done=stage>=stops.length;
    let h='<div id="seoul-tower">▲ 남산 코어</div><div class="seoul-asc"><div class="seoul-road"></div>';
    stops.forEach((st,i)=>{
      const cls = G.seoulStopDone(i)?'done' : i===stage?'here' : i>stage?'locked':'';
      h+=`<div class="seoul-stop ${cls}"><div class="dot"></div><div class="txt"><b>${st.name}${G.seoulStopDone(i)?' ✓':''}</b><small>${i<=stage||G.seoulStopDone(i)?st.desc:'???'}</small></div></div>`;
    });
    h+=`</div><div class="sub" style="text-align:center;margin:8px 0;color:${transfer.onTime?'var(--amber)':'var(--danger)'}"><b>${esc(transfer.mission)}</b><br><small>서울 도착이 아니라 남산의 이송 중단까지가 1화의 시한</small></div><div class="seoul-cta">`;
    if(!done){
      h+=`<button class="act primary" id="seoul-go"><span class="ic">▲</span><span><b>${stops[stage].name}(으)로 오른다</b><small>${stage===0?'서울 안으로':'다음 정거장'}</small></span></button>`;
    } else {
      const cn=S.notes?S.notes.length:0, pn=S.party.length, dg=S.dog?' + 보리':'';
      const recalled=(S.memories&&S.memories.history||[]).map(id=>S.memories.choices[id]).filter(Boolean).slice(-4);
      const finishLine=transfer.onTime
        ? '첫 이송이 시작되기 전에 6,412명의 명령을 취소했다.'
        : `첫 이송 뒤 ${transfer.lateDays}일째에 남은 이송을 멈추고, 먼저 떠난 차량의 귀환로를 열었다.`;
      h+=`<div class="sub" style="text-align:center;padding:14px 0">〔 서울까지 400km 완주 〕<br>
        <small style="color:var(--faded)">DAY ${S.day} · ${Math.round(S.stats.km)}km · 동료 ${pn}명${dg} · 기록 ${cn}개</small><br>
        <small style="color:${transfer.onTime?'var(--ok)':'var(--amber)'}">${esc(finishLine)}</small><br>
        <small style="color:var(--faded)">부산의 폐차장에서 남산의 밤까지, 여기 적힌 전부가 우리가 실어온 것이다.</small><br>
        <small style="color:var(--faded)">가족의 추방 이유는 되찾았고, 143년의 최초 목적은 꾸며 쓰지 않은 채 같은 정리를 끝냈다.</small></div>
        ${recalled.length?`<div class="seoul-memory-recap"><b>남산까지 돌아온 선택</b>${recalled.map(memory=>`<span>DAY ${memory.day} · ${esc(memory.summary)}</span>`).join('')}</div>`:''}
        <button class="act" id="seoul-journal"><span class="ic">✎</span><span><b>여행 일지를 연다</b><small>411km의 기록을 처음부터</small></span></button>`;
    }
    h+='</div>';
    $('#seoul-body').innerHTML=h;
    document.querySelectorAll('.ovl').forEach(o=>{ if(o.id!=='ovl-seoul') closeModal(o,false); });
    openModal('#ovl-seoul','#seoul-go, #seoul-journal');
    const go=$('#seoul-go'); if(go) go.onclick=()=>{ closeModal('#ovl-seoul',false); G.seoulEnter(stage); };
    const jn=$('#seoul-journal'); if(jn) jn.onclick=()=>{ closeModal('#ovl-seoul',false); toggleOvl('#ovl-journal'); renderJournal(); };
  }

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
    if(S&&S.at&&D.nodes[S.at]&&D.nodes[S.at].stl) S.roadGarage=false;   // 진짜 정착지는 제값
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
        <span class="tp">${ICO('scrap')}고철 ${bundlePrice} · 40분</span>
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
        <span class="uc-cost">고철 ${repCost} · ${G.durationLabel(G.settlementRepairQuote().mins)}</span>
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
      /* 시간도 값이다 — 미리 보이지 않으면 선택이 아니라 사후 통보가 된다 */
      const cost=`고철 ${u.cost.scrap}${u.cost.parts?' + 부품 '+u.cost.parts:''} · ${G.durationLabel(G.upgradeMinutes(u))}`;
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
  let mapKbFocus=null;
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
      <div class="note"><div class="nh"><span class="nt ${esc(n.type)}">${esc(n.type)}</span><b>${esc(n.title)}</b><span class="nd">DAY ${n.day}</span></div>
      <p>${fmt(n.body)}</p>
      ${n.links.length?`<div class="links">${n.links.map(l=>`<span class="lk">[[${esc(l)}]]</span>`).join('')}</div>`:''}</div>`).join('')
      : '<div class="sub">이 종류의 기록은 아직 없다.</div>');
    log.querySelectorAll('[data-jf]').forEach(b=>b.onclick=()=>{ jFilter=b.dataset.jf; renderJournal(); });
  }
  function showGraphNote(note){
    const g=$('#gnote');
    if(!note){ g.classList.remove('on'); return; }
    g.innerHTML=`<div class="note" style="margin:0;border:none;padding:0">
      <div class="nh"><span class="nt ${esc(note.type)}">${esc(note.type)}</span><b>${esc(note.title)}</b><span class="nd">DAY ${note.day}</span></div>
      <p>${fmt(note.body)}</p>
      ${note.links.length?`<div class="links">${note.links.map(l=>`<span class="lk">[[${esc(l)}]]</span>`).join('')}</div>`:''}</div>`;
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
    } else if(kind==='empty_district'){
      /* 늦음의 끝 — 이건 승리 텍스트의 변주가 아니라 이름 있는 결말이다 */
      kicker='ENDING · 빈 구역'; kcolor='var(--danger)';
      title='아무도 남지 않은 뒤에';
      body=`남산에 닿았을 때 제7 잔류구역의 명부는 0이었다.\n\n멈출 이송이 없었다. 코어는 우리를 들여보냈고, 요구를 받았고, 집행을 중지했다. 절차는 전부 정상이었다.\n\n"다음 구역에는 이 규칙이 적용됩니다."\n\n그 말이 위로가 되지 않는 밤이 있다. 오늘이 그런 밤이었다.\n\n수첩에는 여전히 사유란이 비어 있다. 이제 그 빈칸을 볼 사람이 그 구역에는 없다.`;
    } else if(kind==='too_late'){
      kicker='ENDING · 늦은 도착'; kcolor='var(--amber)';
      title='먼저 떠난 버스들';
      body=`남산에서 남은 이송을 멈췄다. 이미 내려간 사람들에게는 돌아올 길이 열렸다는 방송이 나갔다.\n\n돌아오는 것과 떠나지 않는 것은 같은 일이 아니다.\n\n그 차이만큼이 우리가 늦은 값이었다.`;
    } else if(kind==='stranded'){
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='길 위에 남았다';
      body=`달구지가 더는 움직이지 않는다.\n\n연료도, 부품도, 걸어서 닿을 마을도 없다. 우리는 이 길이 어디로 가는지 알고 있었고, 거기까지 갈 수 없다는 것도 이제 안다.\n\n북쪽으로 가는 다른 차가 이 자리를 지나가면, 조수석의 일지만이라도 실어 가 주기를.`;
    } else if(kind==='shunned'){
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='어느 마을도 열어 주지 않았다';
      body=`관측 표시가 붙은 차는 마을에 들이지 않는다.\n\n문이 하나씩 닫히는 데는 오래 걸리지 않았다. 물도, 부품도, 하룻밤도 살 수 없게 되자 길 위에서 버티는 일만 남았다.\n\n천리안이 우리를 잡은 게 아니다. 우리를 아무도 재우지 못하게 만들었을 뿐이다.`;
    } else if(kind==='story_done'){
      kicker='ENDING · 제때'; kcolor='var(--good)';
      title='첫 버스가 서던 날';
      body=`제7 잔류구역 6,412명. 명부의 숫자가 그대로 남은 채로 이송이 멈췄다.\n\n집행 중지는 방송으로 나갔다. 남산의 스피커는 감정이 없고, 그래서 그 문장은 이상하게 오래 남는다.\n\n"제7 잔류구역 이송을 중지합니다."\n\n143년 동안 아무도 듣지 못한 문장이었다.\n\n수첩의 사유란은 여전히 비어 있다. 우리는 그 빈칸을 채우러 온 게 아니라, 그 빈칸 때문에 사람을 싣지 않기로 하러 온 것이었다.\n\n북쪽 길은 아직 열려 있다.`;
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
