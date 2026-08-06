/* ═══ UI 1/5 — 코어: 화면·모달·HUD (07a~07d가 하나의 UI IIFE를 이룬다) ═══ */
/* ═══════════════════ UI ═══════════════════ */
const $ = (s)=>document.querySelector(s);
const el = (tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };

const UI = (()=>{
  let screen='title';          // title|mode|name|intro|game|end
  let bgmEvKey=null;           // 현재 이벤트의 BGM 힌트 (tension/story)
  let introIdx=0, introTurnIdx=0, pendingMode='onroad', pendingName='';
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
    show('scr-name');
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
      G.newGame(pendingMode,pendingName,'full'); enterGame();
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
    G.newGame(pendingMode,pendingName,entryMode);
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

