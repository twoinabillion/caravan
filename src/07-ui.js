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
    return ['#ev-wrap','#ovl-seoul','#ovl-stl','#ovl-map','#ovl-journal','#ovl-status']
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
        closeOvl('#'+modal.id);
        return;
      }
      if(screen==='intro'&&(e.key==='Enter'||e.key===' ')){
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
      if(e.target.closest('#intro-skip,#intro-auto')) return;
      introPointer={x:e.clientX,y:e.clientY};
    });
    $('#scr-intro').addEventListener('pointerup',e=>{
      if(!introPointer||e.target.closest('#intro-skip,#intro-auto')) return;
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
    $('#intro-skip').onclick=e=>{ e.stopPropagation(); skipIntro(); };
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
    if(skip) skip.hidden=!localStorage.getItem('caravan_intro_seen');
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
      G.newGame(pendingMode,pendingName); enterGame();
    }
    else renderIntro(true);
  }
  function skipIntro(){
    clearIntroAuto();
    introIdx=D.intro.length;
    introTurnIdx=0;
    if(screen==='name') pendingName=($('#inp-name').value||'').trim().slice(0,8);
    localStorage.setItem('caravan_intro_seen','1');
    AMBI.setLoop(null);
    G.newGame(pendingMode,pendingName);
    enterGame();
  }
  function enterGame(){
    if(!localOffroad&&S.mode==='offroad') S.mode='onroad';
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
  }

  function missionHtml(){
    const q=S.quest, rq=S.recruitQ;
    const danger=S.fuel<10||S.fatigue>=75||(q&&q.due-S.day<=1);
    let kicker, title, state, meta, pct, secondary='';
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
      if(q){
        const K=G.QKIND[q.kind]||G.QKIND.deliver;
        const target=D.nodes[q.to];
        secondary=`<span class="ms-secondary">${K.ic} 함께 진행 중 · ${esc(G.questLabel(q))} → ${esc(target.name)} · D-${Math.max(0,q.due-S.day)}</span>`;
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
      const cleanup=S.day<=30
        ? `첫 이송까지 ${31-S.day}일`
        : '제7 구역의 순차 이송이 시작됐다';
      state=S.flags.es_truth
        ? '부모의 수정안을 남산 코어에 적용해 서울의 결정권을 되찾는다'
        : S.flags.parent_key_found
        ? '부모님의 검증키를 남산까지 가져가 추방 명령의 발신자를 확인한다'
        : `서울 외곽 제7 잔류구역 · ${cleanup} — 남산에서 집행을 멈춘다`;
      meta=`DAY ${S.day}`;
      pct=Math.max(0,Math.min(100,(411-G.remainKm())/411*100));
    }
    const alerts=[
      S.fuel<10?'연료 부족':null,
      S.fatigue>=75?'졸음 위험':null,
      q&&q.due-S.day<=1?'마감 임박':null,
    ].filter(Boolean);
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
    const manual={
      me:'나', grandfather:'할아버지', mother:'엄마', father:'아빠',
      intro_child:'서울에서 온 아이', player_child:'8살의 나', cheollian:'천리안', radio:'라디오',
      passer_man:'낯선 남자', passer_woman:'낯선 여자', passer_elder:'노인',
      passer_child:'아이', passer_merchant:'상인', passer_guard:'경비',
      passer_refugee:'피난민', passer_worker:'일꾼', passer_medic:'의료인',
      seoyeon:'서연', mingyu:'민규',
      sys:'길 위', record:'기록', unknown:'???'
    };
    const comp=D.comps&&D.comps[key], npc=D.npcs&&D.npcs[key];
    const playerName=key==='me'&&typeof S!=='undefined'&&S&&G.myName?G.myName():'나';
    return {
      id:key,
      name:label||(key==='me'?playerName:(comp&&comp.name)||(npc&&npc.name)||manual[key]||who||'누군가'),
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
    let npcIndex=[...lanes.keys()].filter(key=>
      !['speaker:me','speaker:player_child','speaker:나'].includes(key)).length;
    speakers.filter(item=>!playerSpeaker(item.id)).forEach(item=>{
      if(lanes.has(item.key)) return;
      lanes.set(item.key,npcIndex%2===0?'left':'right');
      npcIndex++;
    });
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
    return `<div class="journey-context">
      <button class="context-location" data-a="where" type="button" aria-label="지도에서 현재 위치 보기">
        <span class="loc-mark">${driving?'ROUTE':'HERE'}</span><b>${locTitle}</b><small>${locMeta}</small>
      </button>
      <button class="context-crew" data-a="crew" type="button" aria-label="탑승 인원과 동료 상태 보기">
        <span class="crew-faces">${faces}${extra?`<span class="crew-mini">+${extra}</span>`:''}</span>
        <span class="crew-count">${ids.length}명${dog}</span>
      </button></div>`;
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
        <div id="travelbar"></div>
        ${guest}`;
      renderTravelbar();
      wireContext(p);
      return;
    }
    const n=D.nodes[S.at];
    let h=`${contextRail(n,false)}<div class="acts">`;
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
      h+=`<button class="act primary" data-a="recruitstep" ${!enabled?'disabled':''}>
        <span class="ic">${icon}</span><span><b>${label}</b><small>${small}</small></span></button>`;
    }
    if(n.stl) h+=`<button class="act primary" data-a="stl"><span class="ic">🏘</span><span><b>정착지에 들어간다</b><small>거래 · 대화 · 소문</small></span></button>`;
    if(!n.stl && n.type!=='goal'){
      const es=G.exploreStatus();
      const label=es.ok?(es.repeat?'남은 곳을 샅샅이 뒤진다':'주변을 탐색한다'):'주변 탐색';
      const small=es.ok
        ?(es.repeat?'최소 4시간 · 피로 약 +15 · 실패율 45% · 오늘의 마지막 탐색'
          :`최소 2시간 · 피로 약 +5 이상${es.fresh?' · 새 지역 고철 +4':''}`)
        :es.reason;
      h+=`<button class="act" data-a="explore" ${es.ok?'':'disabled'}><span class="ic">🔦</span><span><b>${label}</b><small>${small}</small></span></button>`;
    }
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
    if(!S.flags.radio_fixed){ const hasT=(S.items['라디오 진공관']||0)>0;
      h+=`<button class="act" data-a="radio" ${hasT?'':'disabled'}><span class="ic">📻</span><span><b>라디오를 고친다</b><small>${hasT?'진공관 1 소모 · 주행 중 방송 수신':'라디오 진공관이 필요하다 — 어딘가의 방송국에'}</small></span></button>`; }
    }
    if(S.fuel<5) h+=`<button class="act" data-a="walkfuel"><span class="ic">🛢</span><span><b>걸어서 연료를 구해온다</b><small>시간과 체력을 크게 소모한다</small></span></button>`;
    h+='</div>';
    p.innerHTML=h;
    const wf=p.querySelector('[data-a="walkfuel"]'); if(wf) wf.onclick=()=>G.openEventById('crisis_nofuel');
    const rp=p.querySelector('[data-a="repair"]'); if(rp) rp.onclick=()=>G.fieldRepair();
    const rd=p.querySelector('[data-a="radio"]'); if(rd) rd.onclick=()=>{ if(G.fixRadio()) renderAll(); };
    const cf=p.querySelector('[data-a="craft"]'); if(cf) cf.onclick=()=>showCraft();
    const rq=p.querySelector('[data-a="recruitstep"]'); if(rq) rq.onclick=()=>G.openRecruitStep();
    wireContext(p);
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
    AMBI.arrive();
    const id=S.at, n=D.nodes[id], key=D.nodeScenes&&D.nodeScenes[id];
    const src=key&&D.scenes&&D.scenes[key];
    toast(`<span class="ic">📍</span>${n.name} 도착`);
    if(!src) return 450;
    const a=$('#arrival-scene');
    a.innerHTML=`<img src="${src}" alt=""><div class="arrival-copy"><small>ARRIVAL · DAY ${S.day}</small><b>${n.name}</b><span>${n.desc}</span></div>`;
    clearTimeout(arrivalTimer);
    a.onclick=()=>{ a.classList.remove('on'); };
    requestAnimationFrame(()=>a.classList.add('on'));
    arrivalTimer=setTimeout(()=>a.classList.remove('on'),2800);
    return 3000;
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
    const bb=el('div','bubble'+kind,`${face}<span class="bubble-copy"><span class="who">${esc(label)}</span><span>${text}</span></span>`);
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
  let storyAuto=localStorage.getItem('caravan_story_auto')!=='0', storyAutoTimer=0;
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
    const pressure=state?state.pressure||0:c.pressure||0;
    return `<section class="combat-hud" aria-label="교전 상황">
      <div class="combat-hud-head"><span class="combat-phase">${opt.result?'RESULT':'ENCOUNTER'} ${c.phase}/${c.total}</span>
        <b class="combat-step">${c.step}</b><span class="combat-threat">${c.threat}</span></div>
      <div class="combat-objective"><b>${opt.result?(opt.ended?'마침':'결과'):'목표'}</b><span>${opt.result?(opt.ended?'선택의 대가를 확인하고 이탈한다':'이 선택이 다음 단계의 전세가 된다'):c.objective}</span></div>
      ${!opt.result&&terrain?`<div class="combat-context"><span><b>지형</b>${esc(terrain)}</span>${stakes?`<span><b>실패하면</b>${esc(stakes)}</span>`:''}</div>`:''}
      ${last?`<div class="combat-last ${opt.result?'result':''}"><b>${opt.result?'방금 선택':'직전 선택'}</b><span><strong>${esc(last.tactic)}</strong>${esc(last.label)}</span></div>`:''}
      <div class="combat-track" aria-hidden="true">${track}</div>
      <div class="combat-state"><span class="${grade==='우세'?'good':grade==='불리'?'bad':''}">전세 ${grade}</span>
        <span class="${pressure>=2?'bad':pressure===0?'good':''}">압박 ${pressure}/3</span>
        <span class="${S.van<35?'bad':''}">차체 ${Math.ceil(S.van)}%</span>
        <span class="${S.pursuit>=3?'bad':''}">관측 ${S.pursuit}/5</span>
        ${injuries?`<span class="bad">부상 ${injuries}명</span>`:''}</div></section>`;
  }
  function eventChoiceData(evd){
    let html='', count=0;
    evd.choices.forEach((c,i)=>{
      const req=G.choiceReq(c);
      if(!G.reqVisible(req)) return;
      const rq=G.reqOk(req);
      const cost=G.reqCostText(req);
      count++;
      html+=`<button class="choice" data-i="${i}" ${rq.ok?'':'disabled'}>${c.tactic?`<span class="combat-tactic">${c.tactic}</span>`:''}${c.label}
        ${c.risk?`<span class="risk">⚠ ${c.risk}</span>`:''}
        ${c.combatRoll!==undefined?`<span class="combat-odds">현재 전세 · ${G.combatGrade(c)} · ${G.combatTacticNote(c)}${G.combatContextNote(c)?` · ${G.combatContextNote(c)}`:''}</span>`:''}
        ${cost?`<span class="req">${rq.ok?'✓':'✗'} ${cost}</span>`:''}</button>`;
    });
    return {html,count};
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
      <img class="event-scene" src="${src}" alt="${esc(sceneAlt)} 장면" decoding="async">
      <span class="scene-cut-mark" aria-hidden="true">장면 1</span>
      <span class="scene-zoom" aria-hidden="true">↗</span></div>`;
  }
  function storySceneShot(state,turn,index){
    const lanes=dialogueLaneMap(state.turns);
    const side=turn&&turn.kind==='dialogue'?dialogueSide(turn,lanes):'center';
    const shotCycle=[
      {x:50,y:50,scale:1.00},{x:42,y:48,scale:1.08},
      {x:58,y:53,scale:1.12},{x:50,y:60,scale:1.16}
    ];
    let shot=shotCycle[index%shotCycle.length], tone=state.phase==='outcome'?'outcome':'story';
    if(turn&&turn.kind==='dialogue'){
      const swing=index%2?6:0;
      shot=side==='right'
        ? {x:68+swing,y:48+(index%3)*3,scale:1.11+(index%3)*.025}
        : {x:32-swing,y:48+(index%3)*3,scale:1.11+(index%3)*.025};
    }else if(turn&&['record','letter','thought'].includes(turn.kind)){
      shot={x:index%2?58:42,y:61,scale:1.18+(index%2)*.025};
      tone='memory';
    }else if(turn&&['ai','radio'].includes(turn.kind)){
      shot={x:50+(index%2?8:-8),y:45,scale:1.14+(index%3)*.02};
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
    frame.dataset.sceneKey=key;
    frame.dataset.speaker=turn&&turn.kind==='dialogue'
      ? speakerInfo(turn.who,turn.name).id||'unknown'
      : turn&&turn.kind||'narration';
    const carry=firstRender&&state.sceneCarry&&state.sceneCarry.key===key
      ? state.sceneCarry:null;
    if(carry){
      frame.dataset.cutToken=`carry-${state.phase}-${key}`;
      frame.dataset.tone=carry.tone||state.phase;
      frame.style.setProperty('--scene-x',carry.x||'50%');
      frame.style.setProperty('--scene-y',carry.y||'50%');
      frame.style.setProperty('--scene-scale',carry.scale||'1');
      if(img.src!==src) img.src=src;
      state.sceneCarry=null;
    }else if(firstRender||changed){
      const shot=storySceneShot(state,turn,index);
      frame.dataset.cutToken=`${state.phase}-${index}-${key}`;
      frame.dataset.tone=shot.tone;
      frame.style.setProperty('--scene-x',`${shot.x}%`);
      frame.style.setProperty('--scene-y',`${shot.y}%`);
      frame.style.setProperty('--scene-scale',String(shot.scale));
      if(img.src!==src) img.src=src;
    }
    img.alt=`${state.sceneAlt} · ${index+1}번째 장면`;
    const mark=frame.querySelector('.scene-cut-mark');
    if(mark) mark.textContent=`${state.label||'이야기'} ${index+1} / ${state.turns.length}`;
    img.classList.remove('scene-recut');
    if(changed){
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
      live.textContent=speaker+stripTags(turn.text);
    }
    const compact=state.turns.length<=10&&state.index<3&&reader.scrollHeight<210;
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
      dock.classList.add('story-progress-dock');
      dock.innerHTML=`<div class="choice-dock-head"><span>${state.label} · ${state.index+1}/${state.turns.length}</span>
        <button class="story-auto-toggle${storyAuto?' on':''}" type="button" aria-pressed="${storyAuto}">${storyAuto?'자동 ON':'자동 OFF'}</button></div>
        <button class="choice story-next" type="button">계속<span class="req">${storyAuto?autoCopy:`${nextLabel} · 직접 넘기기`} · ${state.index+2}/${state.turns.length}</span></button>`;
      dock.querySelector('.story-next').onclick=()=>advanceStory(state);
      dock.querySelector('.story-auto-toggle').onclick=()=>{
        setStoryAuto(!storyAuto);
        state.reviewing=false;
        state.userHoldingStory=false;
        renderStoryState();
      };
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
    const turns=prepareEventAudio(buildStoryTurns(text,evd,{turnSpeakers:evd.turnSpeakers}),evd);
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="${esc(sceneAlt)} 사건 내용">${scene}<div class="event-head"><div>
      <div class="tag ${aiEvent?'ai-tag':''}">${evd.type}${evd.gen?' · 오프로드 생성':''}</div>
      <h2>${evd.title}</h2></div></div>${context}${combatHudHtml(evd)}<div class="story-reader"></div></div>
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
  function fmt(t){ return (t||'').replace(/\n/g,'<br>'); }

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
    const oldCombat=$('#ev-sheet').querySelector('.combat-hud');
    const combatBefore=S.combat?{...S.combat,edge:S.combat.edge||0,history:[...(S.combat.history||[])]}:{edge:0,pressure:0,history:[]};
    const out=G.pickOutcome(curEv, choice);
    /* 마지막 선택은 combatEnd가 상태를 비우기 전에 먼저 기록한다.
       시작·중간 단계는 applyFx가 교전 상태를 만든 뒤 기록한다. */
    let combatEntry=out.fx&&out.fx.combatEnd?G.rememberCombatChoice(curEv,choice):null;
    const chips=G.applyFx(out.fx);
    if(!combatEntry) combatEntry=G.rememberCombatChoice(curEv,choice);
    let combatHud='';
    if(oldCombat){
      let resultState=S.combat;
      if(!resultState){
        let edge=out.fx&&out.fx.combatStart?0:combatBefore.edge;
        if(out.fx&&out.fx.combatEdge) edge=clamp(edge+out.fx.combatEdge,-2,3);
        resultState={...combatBefore,edge,history:[...combatBefore.history,...(combatEntry?[combatEntry]:[])]};
      }
      combatHud=combatHudHtml(curEv,{state:resultState,result:true,ended:!!(out.fx&&out.fx.combatEnd)});
    }
    if(out.sfx) SND.combat(out.sfx);
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
      <div class="event-head"><div><div class="tag">선택의 결과</div><h2>${curEv.title}</h2></div></div>
      ${combatHud}<div class="story-reader"></div><div class="story-result" aria-live="polite"></div></div>
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
    const done=stage>=stops.length;
    let h='<div id="seoul-tower">▲ 남산 코어</div><div class="seoul-asc"><div class="seoul-road"></div>';
    stops.forEach((st,i)=>{
      const cls = G.seoulStopDone(i)?'done' : i===stage?'here' : i>stage?'locked':'';
      h+=`<div class="seoul-stop ${cls}"><div class="dot"></div><div class="txt"><b>${st.name}${G.seoulStopDone(i)?' ✓':''}</b><small>${i<=stage||G.seoulStopDone(i)?st.desc:'???'}</small></div></div>`;
    });
    h+='</div><div class="seoul-cta">';
    if(!done){
      h+=`<button class="act primary" id="seoul-go"><span class="ic">▲</span><span><b>${stops[stage].name}(으)로 오른다</b><small>${stage===0?'서울 안으로':'다음 정거장'}</small></span></button>`;
    } else {
      const cn=S.notes?S.notes.length:0, pn=S.party.length, dg=S.dog?' + 보리':'';
      h+=`<div class="sub" style="text-align:center;padding:14px 0">〔 서울까지 400km 완주 〕<br>
        <small style="color:var(--faded)">DAY ${S.day} · ${Math.round(S.stats.km)}km · 동료 ${pn}명${dg} · 기록 ${cn}개</small><br>
        <small style="color:var(--faded)">부산의 폐차장에서 남산의 밤까지, 여기 적힌 전부가 우리가 실어온 것이다.</small><br>
        <small style="color:var(--faded)">가족의 추방 이유는 되찾았고, 143년의 최초 목적은 꾸며 쓰지 않은 채 같은 정리를 끝냈다.</small></div>
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
  function settlementScene(stlId){
    const sid=D.nodeScenes&&D.nodeScenes[stlId];
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
    const faces=[settlementPortrait('me','stl-walker-face me',`${G.myName()} 초상`)];
    if(comp) faces.push(settlementPortrait(comp.id,'stl-walker-face companion',`${comp.name} 초상`));
    return `<div class="stl-walk-party" role="img" aria-label="${esc(comp?`${G.myName()}와 ${comp.name}이 정착지를 함께 걷는다`:`${G.myName()}이 정착지를 걷는다`)}">
      ${faces.filter(Boolean).join('')}
    </div>`;
  }
  function settlementCrowdHtml(stl){
    const ids=[...(stl.npcs||[]).slice(0,1),'passer_merchant','passer_worker','passer_child'];
    return `<div class="stl-crowd" aria-hidden="true">${ids.map((id,i)=>
      settlementPortrait(id,`stl-crowd-face crowd-${i+1}`,'')).filter(Boolean).join('')}</div>`;
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
    const stl=D.stls[curStl], body=$('#stl-body'), scene=settlementScene(curStl);
    const spots=settlementSpots(curStl), night=G.isNight(), comp=settlementCompanion();
    AMBI.settlement(night?'people':'hub');
    if(!spots[stlFocus]) stlFocus='market';
    if(night&&stlFocus!=='people') stlFocus='people';
    const focus=spots[stlFocus]||spots.market;
    const walkCopy=settlementWalkCopy(stlFocus);
    settlementHeader('');
    $('#ovl-stl').classList.add('hub-mode');
    body.innerHTML=`<div class="stl-hub" data-focus="${stlFocus}" ${scene?`style="--stl-scene:url('${scene}')"`:''}>
      <div class="stl-hub-art" role="img" aria-label="${esc(stl.name)} 풍경"></div>
      <div class="stl-hub-place"><b>${esc(stl.name)}</b><small>${night?'장은 잠들었지만 모닥불은 아직 켜져 있다.':esc(stl.desc)}</small></div>
      ${settlementCrowdHtml(stl)}
      <div class="stl-hotspots" aria-label="${esc(stl.name)}에서 갈 곳">
        ${Object.entries(spots).map(([id,spot])=>{
          const closed=night&&id!=='people';
          return `<button class="stl-hotspot ${id} ${stlFocus===id?'selected':''}" data-stlfocus="${id}"
            aria-pressed="${stlFocus===id}" ${closed?'disabled':''}>
            <span class="stl-hotspot-icon">${ICO(spot.icon)}</span>
            <span><b>${spot.label}</b><small>${closed?'아침 06:00에 연다':spot.sub}</small></span>
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
    const comp=settlementCompanion();
    let h=`<div class="stl-field-intro"><span>${ICO('quest')}</span><span><b>${esc(field.title)}</b><small>${esc(field.desc)}</small></span></div>`;
    if(actions.length){
      const pos=actions.length===1?50:Math.round(focusIndex/(actions.length-1)*100);
      h+=`<section class="stl-field-map" style="--field-pos:${pos}%" aria-label="${esc(field.title)} 현장 동선">
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
        <div class="stl-field-focus-copy" data-field-focus-copy><b>${esc(focusAction.label)}</b><span>${esc(focusAction.desc)}</span></div>
      </section>`;
    }
    if(result){
      const person=speakerInfo(result.action.npc);
      h+=`<div class="stl-field-result" data-field-result>
        ${settlementPortrait(person.id,'stl-field-face',`${person.name} 초상`)}
        <span><small>${esc(person.name)} · ${esc(result.action.label)}</small><p>${esc(result.action.result)}</p>
        ${result.chips&&result.chips.length?`<span class="stl-field-chips">${result.chips.map(c=>`<i class="${c.c||''}">${esc(c.t)}</i>`).join('')}</span>`:''}</span>
      </div>`;
    }
    h+=`<div class="stl-field-list">${actions.map(action=>{
      const status=G.stlFieldStatus(curStl,action), person=speakerInfo(action.npc);
      const cost=G.reqCostText(action.req), cadence=action.once?'여행 중 1회':'하루 1회';
      return `<button class="stl-field-action ${action.id===stlFieldFocus?'focused':''}" data-stlfield="${action.id}" data-fieldcard="${action.id}" ${status.ok?'':'disabled'}>
        ${settlementPortrait(person.id,'stl-field-face',`${person.name} 초상`)}
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
      map.querySelectorAll('[data-fieldspot]').forEach(node=>{
        const selected=node.dataset.fieldspot===actionId;
        node.classList.toggle('selected',selected);
        node.setAttribute('aria-pressed',String(selected));
      });
      const copy=map.querySelector('[data-field-focus-copy]');
      if(copy) copy.innerHTML=`<b>${esc(action.label)}</b><span>${esc(action.desc)}</span>`;
    }
    const cards=[...document.querySelectorAll('#stl-body [data-fieldcard]')];
    cards.forEach(card=>card.classList.toggle('focused',card.dataset.fieldcard===actionId));
    const card=cards.find(node=>node.dataset.fieldcard===actionId);
    if(scroll&&card) card.scrollIntoView({behavior:document.documentElement.classList.contains('ui-reduce-motion')?'auto':'smooth',block:'nearest'});
  }
  function showStl(stlId,mode='hub'){
    curStl=stlId;
    stlMode=mode||'hub';
    const stl=D.stls[stlId];
    AMBI.settlement(stlMode);
    if(!G.isNight()) G.checkQuest();   // 배달은 사람이 깨어 있을 때만
    if(stlMode==='hub'){ renderSettlementHub(); return; }
    if(G.isNight()&&stlMode!=='people'){ stlFocus='people'; renderSettlementHub(); return; }
    $('#ovl-stl').classList.remove('hub-mode');
    const body=$('#stl-body'), scene=settlementScene(curStl), spots=settlementSpots(curStl);
    settlementHeader(spots[stlMode]?spots[stlMode].label:'');
    const walkCopy=settlementWalkCopy(stlMode);
    let h=`<div class="stl-section-hero" ${scene?`style="background-image:url('${scene}')"`:''}>
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
        stlFieldResult={stl:curStl,action:result.action,chips:result.chips};
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
    const disc=G.hasPerk('leo_vip')?0.8:G.hasComp('leo')?0.9:1;
    let h='';
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
      const group=key.startsWith('barter')?'물물교환':key.startsWith('item')?'도구와 부품':'주행과 보급';
      if(group!==lastGroup){ h+=`<div class="trade-group-label">${group}</div>`; lastGroup=group; }
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
    const bundle=tr.querySelector('[data-bundle]');
    if(bundle) bundle.onclick=()=>{
      const w=stl.trade.find(row=>row[1]==='water');
      const f=stl.trade.find(row=>row[1]==='food');
      if(!w||!f) return;
      const price=Math.max(1,Math.round((w[3]+f[3]*2)*disc));
      if(S.scrap<price) return;
      S.scrap-=price; S.water+=w[2]; S.food+=f[2]*2;
      $('#tr-scrap').textContent=S.scrap;
      toast(`📦 기본 보급을 실었다 · 물 +${w[2]} · 식량 +${f[2]*2}`);
      renderTrade(); renderHud(); G.save();
    };
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
      const cost=G.hasComp('minji')?6:8;
      if(S.scrap<cost||S.van>=S.vanMax-5) return;
      S.scrap-=cost; S.van=clamp(S.van+30,0,S.vanMax);
      UI.toast('🔧 정비소 수리 완료 — 내구 +30');
      G.save(); renderGarage(); renderHud();
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
      </div><div class="csub">움직임 줄임은 장면 전환과 달구지 애니메이션을 낮추고, 캔버스 갱신 부담도 줄인다.</div></div>`;

    let journey=`<div class="st-sec"><h4>여정</h4>
      <div class="st-row"><span class="k">날짜 / 주행</span><span class="v" style="flex:1">DAY ${S.day} · ${Math.round(S.stats.km)}km · 서울까지 약 ${G.remainKm()}km</span></div>
      <div class="st-row"><span class="k">이벤트</span><span class="v" style="flex:1">${S.stats.events}건</span></div>
      <div class="st-row"><span class="k">발견</span>${bar(knownN,totalN)}<span class="v">${knownN}/${totalN}</span></div>
      <div class="st-row"><span class="k">정착지</span><span class="v" style="flex:1">${stlVisited}/${Object.keys(D.stls).length} 방문</span></div>
      <div class="st-row"><span class="k">${ICO('pursuit')}천리안 관측</span><span class="v" style="flex:1;color:${S.pursuit>2?'var(--danger)':'inherit'}">${'◉'.repeat(S.pursuit)||'—'} (${S.pursuit}/5)</span></div>
      ${S.flags.seoulTries?`<div class="st-row"><span class="k">남산 시도</span><span class="v" style="flex:1;color:var(--cheollian)">${S.flags.seoulTries}회 · 아직 입장 조건 미달</span></div>`:''}</div>`;
    const departureSteps=G.departureSteps(), departureDone=departureSteps.filter(x=>x.done).length;
    const deadline=S.day<=30?`첫 이송까지 ${31-S.day}일`:'순차 이송 진행 중';
    journey+=`<div class="st-sec departure-brief"><h4>왜 지금 서울로 가는가 <small>${departureDone}/${departureSteps.length}</small></h4>
      <p><b>${esc(deadline)}</b> · 엄마의 유품에서 현재 이송 규격과 맞는 남산 도면을 찾았다. 계기판 속 검증 모듈을 사람들의 기록과 함께 가져가 이번 명령을 멈춘다.</p>
      <div class="departure-steps">${departureSteps.map(step=>`<div class="departure-step ${step.done?'done':''}">
        <i>${step.done?'✓':'○'}</i><span><b>${esc(step.label)}</b><small>${esc(step.detail)}</small></span></div>`).join('')}</div>
      <div class="csub">동료는 데려오는 대상이 아니다. 서로의 일을 끝낸 뒤 같은 목적지를 고른 사람이 자기 이유로 합류한다.</div></div>`;
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

/* ═══════════════════ SOUND (미니멀 신스) ═══════════════════ */
const SND = (()=>{
  let ac=null, on=false, userChoice=false, suspended=false, engineGain=null, noiseSrc=null, sfxBuf=null, pulseTimer=null;
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
    sfxBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
    const white=sfxBuf.getChannelData(0);
    for(let i=0;i<white.length;i++) white[i]=Math.random()*2-1;
  }
  function syncUi(){
    const dock=$('#dk-sound'), early=$('#early-sound');
    if(dock){
      dock.querySelector('.dic').textContent=on?'🔊':'🔇';
      dock.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');
      dock.setAttribute('aria-pressed',String(on));
    }
    if(early){
      early.classList.toggle('on',on);
      early.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');
      early.setAttribute('aria-pressed',String(on));
      early.querySelector('.sound-icon').textContent=on?'🔊':'🔇';
      early.querySelector('.sound-label').textContent=on?'소리 끄기':'소리 켜기';
    }
  }
  function setEnabled(value,remember=true){
    if(remember) userChoice=true;
    if(value&&!ac){ try{ build(); }catch(e){ return false; } }
    on=!!value;
    if(on&&ac&&ac.state==='suspended') ac.resume().catch(()=>{});
    if(!on&&ac&&ac.state==='running') ac.suspend().catch(()=>{});
    syncUi();
    BGM.setOn(on);
    AMBI.setOn(on);
    VO.setOn(on);
    setDriving(S&&S.driving&&!UI.modalOpen());
    return true;
  }
  function toggle(){ setEnabled(!on,true); }
  function enable(force=false){
    if(on) return true;
    if(userChoice&&!force) return false;
    return setEnabled(true,force);
  }
  function isEnabled(){ return on; }
  function setDriving(driving){
    if(!ac||!engineGain) return;
    const hasRecorded=!!(D.sfx&&D.sfx.sfx_drive_asphalt_loop);
    const target= on&&!suspended? (driving?(hasRecorded?0.055:0.16):(hasRecorded?0.018:0.05)):0;
    engineGain.gain.linearRampToValueAtTime(target, ac.currentTime+0.8);
  }
  function suspend(){
    suspended=true;
    if(!ac) return;
    if(engineGain){
      engineGain.gain.cancelScheduledValues(ac.currentTime);
      engineGain.gain.setValueAtTime(0,ac.currentTime);
    }
    ac.suspend().catch(()=>{});
  }
  function resume(){
    suspended=false;
    if(!on||!ac) return;
    ac.resume().then(()=>setDriving(S&&S.driving&&!UI.modalOpen())).catch(()=>{});
  }
  function pulse(kind){
    const app=$('#app'); if(!app) return;
    const cls=['hit','impact','metal','alarm','rifle','fire'].includes(kind)?'combat-hit':'combat-alert';
    app.classList.remove('combat-hit','combat-alert');
    void app.offsetWidth;
    app.classList.add(cls);
    clearTimeout(pulseTimer); pulseTimer=setTimeout(()=>app.classList.remove(cls),500);
  }
  function tone(type,f0,f1,dur,vol,delay=0){
    const t=ac.currentTime+delay, o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.setValueAtTime(Math.max(20,f0),t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(Math.max(.0001,vol),t);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+.02);
  }
  function burst(freq,dur,vol,delay=0,q=.7){
    const t=ac.currentTime+delay, s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
    s.buffer=sfxBuf; f.type='bandpass'; f.frequency.value=freq; f.Q.value=q;
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t); s.stop(t+dur+.02);
  }
  /* 외부 음원 없이 만드는 짧은 전투 효과음. 사운드 토글과 함께 완전히 꺼진다. */
  function combat(kind='select'){
    pulse(kind);
    if(!on||suspended) return;
    if(!ac){ try{ build(); }catch(e){ return; } }
    if(ac.state==='suspended') ac.resume();
    switch(kind){
      case 'warning': tone('square',620,480,.11,.045); tone('square',620,480,.11,.045,.18); break;
      case 'scan': tone('sine',980,1320,.16,.025); tone('sine',720,980,.12,.018,.12); break;
      case 'drone': tone('sawtooth',92,118,.42,.018); tone('sawtooth',141,126,.36,.012,.03); break;
      case 'walker': tone('sine',62,38,.22,.08); burst(180,.12,.035,.03); tone('sine',58,34,.2,.07,.24); break;
      case 'heartbeat': tone('sine',68,42,.13,.065); tone('sine',64,40,.12,.055,.19); break;
      case 'rifle': burst(1250,.075,.12); tone('sine',105,42,.24,.1); burst(260,.18,.05,.025); break;
      case 'crossbow': case 'bolt':
        tone('triangle',760,180,.12,.05); burst(2300,.07,.035,.02,1.4); break;
      case 'metal': case 'tool':
        tone('triangle',520,150,.3,.065); tone('sine',1180,760,.16,.022,.015); break;
      case 'fire':
        burst(720,.48,.055); burst(180,.24,.08,.08); break;
      case 'hit': case 'impact':
        burst(190,.2,.11); tone('sine',82,34,.27,.1); break;
      case 'alarm':
        tone('square',740,740,.13,.035); tone('square',540,540,.13,.035,.14);
        tone('square',740,740,.13,.035,.28); break;
      case 'hack':
        tone('sine',420,680,.09,.025); tone('sine',680,920,.1,.025,.1); tone('sine',920,540,.14,.018,.22); break;
      case 'engine': case 'escape':
        tone('sawtooth',54,135,.48,.035); burst(110,.35,.025,.05); break;
      case 'cover': case 'silence':
        burst(420,.08,.018); tone('sine',120,82,.13,.018); break;
      default: tone('sine',360,430,.06,.018);
    }
  }
  return {toggle, enable, isEnabled, setDriving, combat, suspend, resume};
})();
/* ═══════════════════ BGM (외부 생성 트랙 — D.bgm 슬롯) ═══════════════════
   D.bgm[key]에 data URI를 넣으면 상황에 맞춰 자동 재생·크로스페이드.
   슬롯이 비어 있으면 완전 무음(현재 동작 유지). 사운드 토글(🔊)에 종속. */
const BGM = (()=>{
  const players={};
  let cur=null, on=false, suspended=false, resumeSong=false, manualPauseKey=null;
  const VOL=0.5, FADE=1100;
  function ensure(key){
    if(players[key]!==undefined) return players[key];
    if(!D.bgm||!D.bgm[key]){ players[key]=null; return null; }
    const a=new Audio(D.bgm[key]); a.loop=D.bgm[`${key}Loop`]!==false; a.volume=0; a.preload='auto';
    players[key]=a; return a;
  }
  function fadeTo(a, target, then){
    if(!a) return;
    if(a._fi) clearInterval(a._fi);
    if(Math.abs(target-a.volume)<.001){
      a.volume=target;
      if(then) then();
      return;
    }
    const step=(target-a.volume)/(FADE/50);
    a._fi=setInterval(()=>{
      const v=a.volume+step;
      if((step>0&&v>=target)||(step<0&&v<=target)){ a.volume=target; clearInterval(a._fi); a._fi=null; if(then)then(); }
      else a.volume=Math.max(0,Math.min(1,v));
    },50);
  }
  function set(key){
    if(cur===key) return;
    const prev=ensure(cur); cur=key;
    if(prev) fadeTo(prev,0,()=>prev.pause());
    if(!on||suspended) return;
    const nx=ensure(key);
    if(nx){ nx.play().catch(()=>{}); fadeTo(nx,VOL); }
  }
  function setOn(v){
    on=v;
    if(!on){
      if(song&&!song.paused){ song.pause(); song.currentTime=0; songUi(false); }
      for(const k in players){ const a=players[k]; if(a){ fadeTo(a,0,()=>a.pause()); } }
    }
    else if(!suspended){ manualPauseKey=null; const k=cur; cur=null; set(k||'title'); }
  }
  function tick(desired){
    if(suspended||(song&&!song.paused)) return;
    if(manualPauseKey){
      if(desired===manualPauseKey) return;
      manualPauseKey=null;
    }
    if(desired) set(desired);
  }
  /* ── 노래 (부서진 고속도로) — BGM과 별개, 명시 재생 ── */
  let song=null;
  function ensureSong(){
    if(song!==undefined&&song) return song;
    if(!D.bgm||!D.bgm.song) return null;
    song=new Audio(D.bgm.song); song.volume=0.6;
    song.onended=()=>{ songUi(false); const k=cur; cur=null; if(on) set(k); };
    return song;
  }
  function songUi(playing){
    const b=$('#bt-song'); if(!b) return;
    b.classList.toggle('playing',playing);
    b.setAttribute('aria-pressed',String(playing));
    b.setAttribute('title',playing?'노래 끄기':'부서진 고속도로 재생');
    b.textContent=playing?'■ 노래 끄기':'♪ 부서진 고속도로';
  }
  function toggleSong(){
    const s=ensureSong(); if(!s) return;
    if(!s.paused){
      s.pause(); s.currentTime=0; songUi(false);
      manualPauseKey=cur||'title';
      for(const k in players){ const a=players[k]; if(a) fadeTo(a,0,()=>a.pause()); }
      return;
    }
    /* 배경 BGM 잠시 내림 */
    manualPauseKey=null;
    const bg=players[cur]; if(bg) fadeTo(bg,0,()=>bg.pause());
    s.currentTime=0; s.play().catch(()=>{}); songUi(true);
  }
  function playSongOnce(){ const s=ensureSong(); if(s&&s.paused) toggleSong(); }
  function suspend(){
    suspended=true;
    resumeSong=Boolean(song&&!song.paused);
    if(song) song.pause();
    for(const key in players){
      const a=players[key];
      if(!a) continue;
      if(a._fi){ clearInterval(a._fi); a._fi=null; }
      a.pause();
    }
  }
  function resume(){
    if(!suspended) return;
    suspended=false;
    if(!on) return;
    if(resumeSong&&song){
      resumeSong=false;
      song.play().then(()=>songUi(true)).catch(()=>songUi(false));
      return;
    }
    resumeSong=false;
    const a=ensure(cur||'title');
    if(a){ a.play().catch(()=>{}); fadeTo(a,VOL); }
  }
  function isSongPlaying(){ return Boolean(song&&!song.paused); }
  function isMusicPaused(){ return Boolean(manualPauseKey); }
  return {tick, setOn, toggleSong, playSongOnce, isSongPlaying, isMusicPaused, suspend, resume};
})();
/* ═══════════════════ AMBIENCE / RECORDED SFX ═══════════════════
   생성한 네 테이크를 전부 싣지 않고 대표 한 개만 사용한다.
   긴 환경음은 한 겹만 유지하고, 짧은 동작음만 그 위에 포개 모바일에서도
   소리가 뭉개지거나 앱 용량이 폭증하지 않게 한다. */
const AMBI = (()=>{
  const cache={}, shots=new Set();
  let on=false, suspended=false, current=null, currentKey=null, departTimer=null;
  const FADE=480;
  function source(key){ return D.sfx&&D.sfx[key]; }
  function make(key,loop=false){
    if(!source(key)) return null;
    if(loop&&cache[key]) return cache[key];
    const audio=new Audio(source(key));
    audio.loop=loop;
    audio.preload='auto';
    if(loop) cache[key]=audio;
    return audio;
  }
  function fade(audio,target,done){
    if(!audio) return;
    const start=audio.volume, begun=performance.now();
    if(audio._fade) clearInterval(audio._fade);
    audio._fade=setInterval(()=>{
      const p=Math.min(1,(performance.now()-begun)/FADE);
      audio.volume=Math.max(0,Math.min(1,start+(target-start)*p));
      if(p>=1){
        clearInterval(audio._fade); audio._fade=null;
        if(done) done();
      }
    },40);
  }
  function setLoop(key,volume=.18){
    clearTimeout(departTimer);
    if(currentKey===key&&current){
      current._target=volume;
      if(on&&!suspended&&current.paused) current.play().catch(()=>{});
      if(on&&!suspended) fade(current,volume);
      return;
    }
    const prev=current;
    currentKey=key||null;
    current=key?make(key,true):null;
    if(prev&&prev!==current) fade(prev,0,()=>{ prev.pause(); prev.currentTime=0; });
    if(!current||!on||suspended) return;
    current._target=volume;
    current.volume=0;
    current.play().catch(()=>{});
    fade(current,volume);
  }
  function play(key,volume=.34){
    if(!on||suspended||!source(key)) return null;
    const audio=make(key,false);
    if(!audio) return null;
    audio.volume=volume;
    shots.add(audio);
    const clear=()=>shots.delete(audio);
    audio.onended=clear;
    audio.onerror=clear;
    audio.play().catch(clear);
    return audio;
  }
  function setOn(value){
    on=!!value;
    if(!on){
      if(current){ current.pause(); current.currentTime=0; }
      for(const audio of shots) audio.pause();
      shots.clear();
      return;
    }
    if(!suspended&&current){
      current.volume=0;
      current.play().catch(()=>{});
      fade(current,current._target||.18);
    }
  }
  function intro(scene){
    switch(scene){
      case 'intro-passenger-seat':
        setLoop('sfx_rain_wiper_loop',.20); break;
      case 'intro-first-expulsion':
        setLoop(null); play('sfx_door_printer',.38); break;
      case 'intro-parents-discovery':
        setLoop('sfx_lab_room_loop',.15); break;
      case 'intro-silenced-presentation':
        setLoop('sfx_lab_room_loop',.10); play('sfx_presentation_cut',.38); break;
      case 'intro-camper-conversion':
        setLoop('sfx_garage_loop',.15); play('sfx_van_extension',.34); break;
      case 'intro-current-expulsion':
        setLoop('sfx_port_arrival_loop',.17); break;
      case 'intro-mother-keepsakes':
        setLoop('sfx_garage_loop',.11); break;
      case 'intro-dashboard-module':
        setLoop('sfx_garage_loop',.13); play('sfx_van_extension',.18); break;
      case 'intro-departure-choice':
        setLoop(null); play('sfx_cargo_depart',.38); break;
      default:
        if(!['intro-cheollian-2026','intro-143-years'].includes(scene)) setLoop(null);
    }
  }
  function depart(road){
    play('sfx_van_start',.38);
    const key=road==='rough'?'sfx_drive_gravel_loop':'sfx_drive_asphalt_loop';
    departTimer=setTimeout(()=>setLoop(key,.17),1100);
  }
  function arrive(){
    setLoop(null);
    play('sfx_stop_brake',.38);
  }
  function settlement(mode){
    if(mode==='garage') setLoop('sfx_garage_loop',.17);
    else if(mode==='people') setLoop('sfx_camp_loop',.15);
    else setLoop('sfx_market_loop',.14);
  }
  function event(evd){
    const id=String(evd&&evd.id||''), cue=String(evd&&evd.sfx||'');
    if(id==='seoul_core') setLoop('sfx_core_loop',.17);
    else if(/drone|swarm/.test(id)||cue==='drone') setLoop('sfx_drone_real',.14);
    else setLoop(null);
    if(id==='ai_gasstation') play('sfx_fuel_pump',.38);
    if(/checkpoint|toll/.test(id)||cue==='scan') play('sfx_checkpoint',.28);
    if(/walker/.test(id)||cue==='walker') play('sfx_walker_real',.36);
    if(/^(?:freq_|radio_|dj_)/.test(id)) play('sfx_radio_static',.26);
  }
  function restore(){
    if(typeof S==='undefined'||!S){ setLoop(null); return; }
    if($('#ovl-stl')&&$('#ovl-stl').classList.contains('on')){
      settlement(G.isNight()?'people':'hub');
      return;
    }
    if(S.driving){
      setLoop(S.driving.road==='rough'?'sfx_drive_gravel_loop':'sfx_drive_asphalt_loop',.17);
      return;
    }
    if(G.isNight()) setLoop('sfx_camp_loop',.12);
    else setLoop(null);
  }
  function suspend(){
    suspended=true;
    clearTimeout(departTimer);
    if(current) current.pause();
    for(const audio of shots) audio.pause();
    shots.clear();
  }
  function resume(){
    suspended=false;
    if(!on||!current) return;
    current.play().catch(()=>{});
    fade(current,current._target||.18);
  }
  return {setOn,setLoop,play,intro,depart,arrive,settlement,event,restore,suspend,resume};
})();
/* ═══════════════════ VO (보이스 — D.vo 슬롯) ═══════════════════
   슬롯이 비어 있으면 조용히 무시 (자막만). 파일 오면 드롭인. */
const VO = (()=>{
  let cur=null, on=false;
  function play(key){
    if(!on||!D.vo||!D.vo[key]) return;
    stop();
    cur=new Audio(D.vo[key]); cur.volume=0.8;
    cur.play().catch(()=>{});
  }
  function stop(){ if(cur){ cur.pause(); cur=null; } }
  function setOn(value){ on=!!value; if(!on) stop(); }
  return {play, stop, setOn};
})();

/* 토스 WebView가 백그라운드로 내려갈 때 소리와 진행을 명시적으로 멈춘다.
   사용자가 고른 음소거 상태는 바꾸지 않고, 다시 보일 때만 정상 재개한다. */
let lifecycleHidden=false;
function saveForLifecycle(){
  try{ if(typeof S!=='undefined'&&S) G.save(); }catch(e){}
}
function suspendForLifecycle(){
  lifecycleHidden=true;
  saveForLifecycle();
  SND.suspend();
  BGM.suspend();
  AMBI.suspend();
  VO.stop();
}
function resumeForLifecycle(){
  if(!lifecycleHidden||document.hidden) return;
  lifecycleHidden=false;
  SND.resume();
  BGM.resume();
  AMBI.resume();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) suspendForLifecycle();
  else resumeForLifecycle();
});
window.addEventListener('pagehide',suspendForLifecycle);
window.addEventListener('pageshow',resumeForLifecycle);
