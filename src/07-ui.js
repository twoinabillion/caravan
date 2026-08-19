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
  let navChoiceAt=null, navChoiceId=null, journeyConsoleMode='route';
  /* 풍경 위에는 결정을 전부 복제하지 않고 지금 할 만한 핵심 행동 두 개만 둔다.
     원본 버튼이 상태와 조건의 단일 소스이며, 빠른 버튼은 원본 클릭을 위임한다. */
  function syncStageActions(){
    const host=$('#stage-actions'), panel=$('#panel');
    if(!host||!panel||!S||S.driving){ if(host) host.replaceChildren(); return; }
    const selectors='button.act.primary:not(:disabled),.stop-action-card.primary .stop-action-trigger:not(:disabled),button[data-nav-depart]:not(:disabled),button[data-a="recruitstep"]:not(:disabled)';
    const originals=[...panel.querySelectorAll(selectors)].filter(button=>button.offsetParent!==null).slice(0,2);
    const buttons=originals.map(original=>{
      const button=document.createElement('button');
      button.type='button'; button.className='stage-action';
      const strong=original.querySelector('b,h3');
      button.textContent=(strong?strong.textContent:original.textContent).trim().replace(/\s+/g,' ');
      button.setAttribute('aria-label',button.textContent);
      button.onclick=()=>original.click();
      return button;
    });
    host.replaceChildren(...buttons);
  }
  queueMicrotask(()=>{
    const panel=$('#panel');
    if(panel) new MutationObserver(syncStageActions).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class']});
  });
  function renderProfilePick(){
    const box=$('#profile-pick'); if(!box) return;
    box.innerHTML=Object.entries(D.startProfiles||{}).map(([id,p])=>
      `<button type="button" ${id==='keeper'?'id="mode-on" ':''}class="profile-card${id===pendingProfile?' on':''}" role="radio"
         aria-checked="${id===pendingProfile}" data-profile="${id}" aria-label="${esc(p.nm)}. ${esc(p.preview||'')}">
         <span class="profile-ic">${ICO(p.icon||'van')}</span>
         <span class="profile-copy"><span class="profile-title"><b>${esc(p.nm)}</b><em>${esc(p.tag||'')}</em></span>
         <small>${esc(p.d)}</small><span class="profile-stats">${esc(p.preview||'')}</span></span>
         <span class="profile-check" aria-hidden="true">${id===pendingProfile?'선택됨':'선택'}</span>
       </button>`).join('');
    box.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{
      pendingProfile=b.dataset.profile;
      renderProfilePick();
    });
    const selected=(D.startProfiles||{})[pendingProfile];
    const detail=$('#profile-detail');
    if(detail&&selected) detail.innerHTML=
      `<span>선택한 출발</span><b>${esc(selected.nm)}</b><small>${esc(selected.preview||'')}</small>`;
    const cta=$('#bt-name-profile');
    if(cta&&selected) cta.textContent=`${selected.nm} · ${selected.tag}`;
  }
  let introAuto=localStorage.getItem('caravan_intro_auto')!=='0', introAutoTimer=0;
  let arrivalTimer=0;
  const toastQueue=[];
  let toastActive=false, toastTimer=0;
  let roadNotice=null;
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
  let deferredInstallPrompt=null, appShellRegistration=null;
  const isInstalledApp=()=>Boolean(
    tossRuntime || navigator.standalone===true ||
    (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches) ||
    (window.matchMedia&&window.matchMedia('(display-mode: fullscreen)').matches)
  );
  const isApplePhone=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  function syncInstallUI(){
    const button=$('#bt-install'); if(!button) return;
    const eligible=location.protocol!=='file:'&&!isInstalledApp()&&!tossRuntime;
    button.hidden=!eligible;
    if(!eligible) return;
    const label=button.querySelector('b'), hint=button.querySelector('small');
    if(label) label.textContent=deferredInstallPrompt?'앱 설치':'설치 안내';
    if(hint) hint.textContent=isApplePhone()?'iPhone 홈 화면':'휴대폰 홈 화면';
  }
  function renderInstallGuide(){
    const steps=$('#install-steps'), copy=$('#install-copy'), action=$('#install-action');
    if(!steps||!copy||!action) return;
    if(deferredInstallPrompt){
      copy.textContent='설치 버튼을 누르면 홈 화면에 게임 아이콘이 생깁니다.';
      steps.innerHTML='<li>아래의 앱 설치하기를 누른다.</li><li>브라우저 설치 창에서 설치를 확인한다.</li><li>홈 화면의 서울까지 400km 아이콘으로 실행한다.</li>';
      action.textContent='앱 설치하기'; action.dataset.installReady='1';
    }else if(isApplePhone()){
      copy.textContent='iPhone과 iPad에서는 Safari의 공유 메뉴로 설치합니다.';
      steps.innerHTML='<li>이 주소를 Safari에서 연다.</li><li>Safari 아래쪽의 공유 버튼을 누른다.</li><li>홈 화면에 추가를 고르고 추가를 누른다.</li>';
      action.textContent='설치 순서 확인'; delete action.dataset.installReady;
    }else{
      copy.textContent='Chrome 또는 기본 브라우저 메뉴에서 홈 화면에 설치할 수 있습니다.';
      steps.innerHTML='<li>브라우저의 더보기 메뉴를 연다.</li><li>앱 설치 또는 홈 화면에 추가를 누른다.</li><li>생긴 게임 아이콘으로 다시 실행한다.</li>';
      action.textContent='설치 순서 확인'; delete action.dataset.installReady;
    }
  }
  async function requestAppInstall(){
    if(isInstalledApp()){ toast('이미 앱으로 실행 중입니다'); return; }
    if(deferredInstallPrompt){
      const prompt=deferredInstallPrompt;
      deferredInstallPrompt=null;
      closeModal('#install-guide',false);
      try{
        await prompt.prompt();
        const choice=await prompt.userChoice;
        if(choice&&choice.outcome==='accepted') toast('홈 화면에 게임을 설치합니다');
      }catch(e){}
      syncInstallUI();
      return;
    }
    renderInstallGuide();
    openModal('#install-guide','#install-x');
  }
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    syncInstallUI();
  });
  window.addEventListener('appinstalled',()=>{
    deferredInstallPrompt=null;
    closeModal('#install-guide',false);
    syncInstallUI();
    toast('설치 완료 · 이제 홈 화면 아이콘으로 실행할 수 있습니다');
  });
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
    return ['#install-guide','#intro-summary','#ev-wrap','#ovl-seoul','#ovl-stl','#ovl-map','#ovl-journal','#ovl-status','#ovl-menu','#ovl-camp','#ovl-local-actions']
      .map($).find(node=>node&&node.classList.contains('on'))||null;
  }
  const modalOpen = ()=> screen!=='game' || $('#ev-wrap').classList.contains('on')
    || $('#ovl-stl').classList.contains('on') || $('#ovl-map').classList.contains('on')
    || $('#ovl-journal').classList.contains('on') || $('#ovl-status').classList.contains('on') || $('#ovl-menu').classList.contains('on')
    || $('#ovl-seoul').classList.contains('on') || $('#ovl-camp').classList.contains('on')
    || $('#ovl-local-actions').classList.contains('on');

  /* ── screens ── */
  function show(id){
    document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
    $('#scr-game').classList.remove('on');
    screen=id.replace('scr-','');
    if(screen!=='game'){
      resetStoppedStageFit();
      document.documentElement.classList.remove('game-viewport-locked');
    }
    $('#app').dataset.screen=screen;
    const earlySound=$('#early-sound');
    if(earlySound) earlySound.hidden=!['title','preview','mode','name','intro'].includes(screen);
    $('#'+id).classList.add('on');
  }

  /* ── boot ── */
  function boot(){
    /* 설치형 웹앱에서도 첫 화면과 저장된 여정을 끊김 없이 연다. file:// 미리보기는
       서비스 워커를 지원하지 않으므로 등록을 건너뛴다. */
    if('serviceWorker' in navigator && location.protocol!=='file:'){
      window.addEventListener('load',async()=>{
        const localPreview=location.hostname==='127.0.0.1'||location.hostname==='localhost';
        const testLocalPwa=new URLSearchParams(location.search).has('pwa');
        if(localPreview&&!testLocalPwa){
          navigator.serviceWorker.getRegistrations().then(registrations=>
            Promise.all(registrations.map(registration=>registration.unregister()))).catch(()=>{});
          if('caches' in window) caches.keys().then(keys=>Promise.all(keys
            .filter(key=>key.startsWith('seoul-400km-')).map(key=>caches.delete(key)))).catch(()=>{});
          return;
        }
        const hadController=Boolean(navigator.serviceWorker.controller);
        try{
          appShellRegistration=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
          await appShellRegistration.update();
          const refresh=()=>appShellRegistration&&appShellRegistration.update().catch(()=>{});
          window.addEventListener('online',refresh);
          document.addEventListener('visibilitychange',()=>{ if(!document.hidden) refresh(); });
          navigator.serviceWorker.addEventListener('controllerchange',()=>{
            if(!hadController) return;
            if(screen==='title'&&!sessionStorage.getItem('caravan_app_reloaded')){
              sessionStorage.setItem('caravan_app_reloaded','1');
              location.reload();
            }else if(screen==='game') toast('새 버전을 받았습니다 · 다음 실행부터 적용됩니다');
          },{once:true});
        }catch(e){}
      },{once:true});
    }
    document.documentElement.classList.toggle('installed-app',isInstalledApp());
    applyUiPrefs();
    SCENE.init($('#cv'));
    SCENE.initTitle($('#titlecv'));
    MAPR.init($('#mapcv'));
    MAPR.initMini($('#minimap'));
    $('#minimap').onclick=()=>{ toggleOvl('#ovl-map'); refreshMapSurface(); };
    GRAPH.init($('#graphcv'));
    wire();
    applyIcons();
    refreshTitle();
    syncInstallUI();
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
        if($('#ovl-stl').classList.contains('on')) SCENE.drawSettlement(dt);
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
    const saveForLifecycle=()=>{ if(S) G.save(); };
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveForLifecycle(); });
    window.addEventListener('pagehide',saveForLifecycle);
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
      if(modal&&modal.getAttribute('aria-modal')!=='false'&&e.key==='Tab'){
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
    $('#bt-new').onclick=()=>startNew('onroad');
    $('#bt-install').onclick=()=>requestAppInstall();
    $('#install-x').onclick=()=>closeModal('#install-guide');
    $('#install-action').onclick=()=>{
      if($('#install-action').dataset.installReady) requestAppInstall();
      else closeModal('#install-guide');
    };
    const bs=$('#bt-song');
    if(bs){
      if(!(D.bgm&&D.bgm.song)) bs.style.display='none';
      else bs.onclick=()=>{ SND.enable(true); BGM.toggleSong(); };
    }
    $('#bt-continue').onclick=()=>{ SND.enable(); if(G.load()){ enterGame(); } };
    $('#bt-preview').onclick=()=>{ renderPreview(); show('scr-preview'); $('#preview-scroll').scrollTop=0; };
    $('#bt-previewback').onclick=()=>show('scr-title');
    $('#bt-previewnew').onclick=()=>startNew('onroad');
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
    document.querySelectorAll('[data-nav-icon],[data-menu-icon]').forEach(button=>{
      const key=button.dataset.navIcon||button.dataset.menuIcon;
      const slot=button.querySelector('.dic,.menu-ico');
      if(slot&&D.icons[key]) slot.innerHTML=`<img src="${D.icons[key]}" alt="">`;
    });
    $('#dk-road').onclick=()=>{
      document.querySelectorAll('.ovl.on').forEach(o=>closeModal(o,false));
      setDockTab('dk-road');
      $('#panel').scrollTo({top:0,behavior:uiPrefs.reduceMotion?'auto':'smooth'});
    };
    $('#dk-objectives').onclick=()=>openStatusTab('journey','dk-objectives');
    $('#dk-map').onclick=()=>{
      setDockTab('dk-map'); toggleOvl('#ovl-map'); wireRoadTool($('#ovl-map'));
      refreshMapSurface();
      const choices=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id)&&G.canTravelTo(nb.id).ok);
      if(!choices.some(nb=>nb.id===mapKbFocus)) mapKbFocus=choices[0]?.id||null;
      if(mapKbFocus) showNodeCard(mapKbFocus);
    };
    $('#dk-menu').onclick=()=>{ setDockTab('dk-menu'); toggleOvl('#ovl-menu'); };
    $('#menu-x').onclick=()=>closeOvl('#ovl-menu');
    $('#local-actions-x').onclick=()=>closeOvl('#ovl-local-actions');
    $('#menu-crew').onclick=()=>openStatusFromMenu('crew');
    $('#menu-settings').onclick=()=>openStatusFromMenu('settings',true);
    $('#dk-journal').onclick=()=>{ openFromMenu('#ovl-journal'); renderJournal(); };
    $('#dk-camp').onclick=()=>{
      closeModal('#ovl-menu',false);
      if(S&&!S.driving) AMBI.play('sfx_camp_loop',.32);
      showCampHub();
    };
    $('#dk-sound').onclick=()=>SND.toggle();
    $('#early-sound').onclick=()=>SND.toggle();
    $('#dk-status').onclick=()=>openStatusTab('now','dk-status');
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
  function startNew(mode){
    pendingMode='onroad'; pendingName=''; pendingProfile='keeper'; introIdx=0; introTurnIdx=0;
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
    const introText=$('#intro-txt');
    const transcript=!newPage&&introText&&introText.querySelector('.story-transcript');
    if(transcript&&transcript.children.length===introTurnIdx){
      transcript.querySelectorAll('.chat-newest,.narration-newest').forEach(entry=>{
        entry.classList.remove('chat-newest','narration-newest');
      });
      transcript.insertAdjacentHTML('beforeend',storyEntryHtml(
        introBeats[introTurnIdx],true,dialogueLaneMap(introBeats),{intro:true}
      ));
    }else if(introText){
      introText.innerHTML=storyReaderHtml(introBeats,introTurnIdx,{intro:true});
    }
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
    if(S.mode==='offroad') S.mode='onroad';
    G.qualitySessionStart();
    G.qualitySettlementEnter(S.at);
    show('scr-game'); screen='game';
    applyIcons();
    renderAll();
    if(S.flags&&S.flags.seoul_open&&!S.ended) setTimeout(showSeoul, 400);   // 서울 안에서 이어하기
  }

  /* ── overlays ── */
  function setDockTab(id){
    document.querySelectorAll('#dock button').forEach(button=>{
      const active=button.id===id;
      button.classList.toggle('here',active);
      if(active) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }
  function openStatusTab(tab,triggerId){
    stTab=tab;
    setDockTab(triggerId||'dk-status');
    if(!$('#ovl-status').classList.contains('on')) toggleOvl('#ovl-status');
    renderStatus();
  }
  function openFromMenu(sel){
    closeModal('#ovl-menu',false);
    $('#dk-menu').focus({preventScroll:true});
    toggleOvl(sel);
  }
  function openStatusFromMenu(tab,scrollSettings=false){
    closeModal('#ovl-menu',false);
    $('#dk-menu').focus({preventScroll:true});
    stTab=tab;
    toggleOvl('#ovl-status');
    renderStatus();
    if(scrollSettings) requestAnimationFrame(()=>{
      const target=$('#st-body').querySelector('.settings-console');
      if(target) target.scrollIntoView({block:'start'});
    });
  }
  function toggleOvl(sel){ const o=$(sel);
    const opening=!o.classList.contains('on');
    document.querySelectorAll('.ovl').forEach(x=>{ if(x!==o) closeModal(x,false); });
    if(opening) openModal(o,'.x, button');
    else closeModal(o);
    if(!opening&&sel==='#ovl-map') $('#nodecard').classList.remove('on');
  }
  function closeOvl(sel){
    closeModal(sel);
    if(['#ovl-map','#ovl-status','#ovl-menu','#ovl-journal','#ovl-camp'].includes(sel)) setDockTab('dk-road');
    if(sel==='#ovl-map') $('#nodecard').classList.remove('on');
    if(sel==='#ovl-stl'&&typeof AMBI!=='undefined') AMBI.restore();
  }

  /* ── HUD ── */
  function gauge(id, val, max, warn){
    const g=$(id);
    if(!g) return;
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
    const clock=G.fmtClock();
    const clockbox=$('#clockbox');
    if(clockbox) clockbox.textContent = clock;
    const wxNow=D.wx[S.wx]||D.wx.clear, wxN=D.wx[S.wxNext]||D.wx.clear;
    const wxbox=$('#wxbox');
    if(wxbox) wxbox.innerHTML = `${ICO('wx_'+S.wx, wxNow.ic+' ')}${wxNow.nm} <span style="opacity:.5">· 내일 ${ICO('wx_'+S.wxNext, wxN.ic)}</span>`;
    const stageFuel=$('#stage-fuel'), stageVan=$('#stage-van'), stageDay=$('#stage-day');
    const stageClock=$('#stage-clock'), stageWeather=$('#stage-weather');
    if(stageFuel) stageFuel.textContent=`${Math.floor(S.fuel)}L`;
    if(stageVan) stageVan.textContent=`${Math.floor(S.van)}%`;
    if(stageDay) stageDay.textContent=`DAY ${S.day}`;
    if(stageClock) stageClock.textContent=clock.replace(/^DAY\s+\d+\s*·\s*/,'');
    if(stageWeather) stageWeather.textContent=wxNow.nm;
    const f=$('#ftgbox'), stg=G.fatigueStage();
    if(f){
      f.style.display='inline';
      f.style.color = stg==='bad'?'var(--danger)': stg==='mid'?'var(--amber)':'var(--faded)';
      f.innerHTML = `${ICO('fatigue_'+stg, G.fatigueFace())} ${Math.floor(S.fatigue)}%`;
    }
    const eye=$('#eyebox');
    if(eye){
      eye.style.display = S.pursuit>0? 'inline':'none';
      eye.innerHTML = `${ICO('pursuit','◉'.repeat(Math.min(S.pursuit,5)))} 관측 ${S.pursuit}`;
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
      const visibleSecondary=secondaryMissions.slice(-2);
      secondary=`<div class="ms-secondary-wrap"><span class="ms-sec-title">보조 목표 · 최대 2개</span>${visibleSecondary.join('')}</div>`;
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
  const portraitIsPresentationReady=(id)=>!(D.legacyIllustratedPortraits||[]).includes(id);
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
      portrait:portraitIsPresentationReady(key)&&(D.portraits&&D.portraits[key]||null)
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
  function dialogueSide(turn,lanes,opt={}){
    const person=speakerInfo(turn.who,turn.name);
    if(opt.intro) return playerSpeaker(person.id)?'right':'left';
    const key=speakerLaneKey(turn);
    return (lanes&&lanes.get(key))||(playerSpeaker(person.id)?'right':'left');
  }
  function chatMessageHtml(turn, newest=false, side='left', opt={}){
    const person=speakerInfo(turn.who,turn.name);
    const mine=playerSpeaker(person.id);
    const hidden=person.name==='???';
    const faceAlt=hidden?'이름을 모르는 사람':person.name;
    const portrait=person.portrait
      ? `<img class="chat-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상" decoding="async">`
      : '';
    const face=portrait&&opt.intro
      ? `<span class="intro-portrait-photo">${portrait}<span class="intro-portrait-pin" aria-hidden="true"></span></span>`
      : portrait;
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
  function storyEntryHtml(turn,newest,lanes,opt={}){
    if(turn.kind==='dialogue') return chatMessageHtml(turn,newest,dialogueSide(turn,lanes,opt),opt);
    if(turn.kind==='narration') return narrationMessageHtml(turn,newest,opt);
    return storyTurnHtml(turn,opt);
  }
  function storyReaderHtml(turns,index,opt={}){
    const safe=Math.min(Math.max(0,index),Math.max(0,turns.length-1));
    const shown=(turns.length?turns:[{kind:'narration',text:'잠시 말이 끊겼다.'}]).slice(0,safe+1);
    const lanes=opt.lanes instanceof Map?opt.lanes:dialogueLaneMap(turns);
    return `<section class="story-chat story-transcript${opt.intro?' intro-chat':''}" role="group" aria-label="대화 기록">
      ${shown.map((turn,i)=>storyEntryHtml(turn,i===shown.length-1,lanes,opt)).join('')}</section>`;
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
  function roadNoticeModel(html,cls=''){
    const raw=stripTags(html);
    const body=raw.replace(/^[^\p{L}\p{N}]+/u,'');
    const driverLevel=body.match(/「([^」]+)」/);
    if(/운전 숙련|연비|운전자/.test(body)) return {
      kicker:'DRIVER LOG',title:driverLevel?`운전 숙련 · ${driverLevel[1]}`:'운전 감각이 쌓였다',icon:'perk',tone:'skill',
      body:/연비·피로|연비와 피로/.test(body)?'연비와 피로 효율이 개선됐다.':'주행 경험이 다음 운전에 반영된다.'
    };
    const cases=[
      {match:/퍼크|습득|상승/,kicker:'SKILL LOG',title:'새로운 감각을 익혔다',icon:'perk',tone:'skill'},
      {match:/발견|지도에 표시|신호|안테나|도청|좌표/,kicker:'ROUTE LOG',title:'길에서 찾은 것',icon:'quest',tone:'discover'},
      {match:/유대|동료|동행|탑승|함께|이야기/,kicker:'CREW LOG',title:'동행 기록',icon:'bond',tone:'crew'},
      {match:/물|식량|연료|고철|부품|의약품|보급/,kicker:'SUPPLY LOG',title:'보급 변화',icon:'parts',tone:'supply'}
    ];
    const found=cases.find(item=>item.match.test(body))||{
      kicker:'ROAD LOG',title:'길 위의 변화',icon:'van',tone:cls==='discover'?'discover':'road'
    };
    return {...found,body};
  }
  function journeyNoticeHtml(){
    const notice=roadNotice||{
      kicker:'ROAD LOG',title:'주행 기록 대기',icon:'van',tone:'quiet',
      body:'새 변화가 생기면 이 기록판에 남는다.'
    };
    const remaining=S&&S.driving?`${Math.max(0,Math.ceil(S.driving.dist-S.driving.gone))}km 남음`:'이동 중';
    return `<section id="road-notice-slot" class="road-notice-slot ${roadNotice?'has-update':'is-quiet'} tone-${notice.tone}" aria-live="polite" aria-label="여정 기록">
      <span class="road-notice-medallion" aria-hidden="true">${ICO(notice.icon,'•')}</span>
      <span class="road-notice-copy"><small>${esc(notice.kicker)}</small><b>${esc(notice.title)}</b><p>${esc(notice.body)}</p></span>
      <em>${esc(remaining)}</em>
    </section>`;
  }
  function setRoadNotice(html,cls){
    roadNotice=roadNoticeModel(html,cls);
    const current=$('#road-notice-slot');
    if(!current) return;
    current.outerHTML=journeyNoticeHtml();
    const updated=$('#road-notice-slot');
    if(updated){
      updated.scrollIntoView({block:'nearest',behavior:'auto'});
      const panel=$('#panel'),dock=$('#dock');
      if(panel&&dock){
        const slotBox=updated.getBoundingClientRect(),dockBox=dock.getBoundingClientRect();
        if(slotBox.bottom>dockBox.top-8) panel.scrollTop+=slotBox.bottom-dockBox.top+8;
      }
      if(!uiPrefs.reduceMotion) requestAnimationFrame(()=>updated.classList.add('is-new'));
    }
  }
  function routeDurationRange(minutes){
    const low=Math.max(5,Math.floor(minutes*.85/5)*5);
    const high=Math.max(low+5,Math.ceil(minutes*1.2/5)*5);
    return `${G.durationLabel(low)}–${G.durationLabel(high)}`;
  }
  function routeFuelRange(fuel){
    const low=Math.max(1,Math.floor(fuel*.85));
    const high=Math.max(low+1,Math.ceil(fuel*1.2));
    return `${low}–${high}L`;
  }
  function routePlaceDescription(node){
    const source=String(node&&node.desc||'').trim();
    const speculative=/소문|누군가|무엇|뭐가|누구|기다리|이유 모를|불안|시험|같았다|마주|위험/;
    const known=source.split(/(?<=[.!?])\s+/).filter(sentence=>sentence&&!speculative.test(sentence)).slice(0,2).join(' ');
    if(known) return known;
    if(node&&node.type==='town') return '작은 마을과 주변 도로가 지도에 기록되어 있다.';
    if(node&&node.type==='hidden') return '직접 확인해 지도에 표시한 장소다.';
    if(node&&node.type==='goal') return '이번 여정의 최종 목적지다.';
    return '남아 있는 길과 구조물이 지도에 기록되어 있다.';
  }
  function routeConsoleModel(routeModels){
    if(navChoiceAt!==S.at||!routeModels.some(model=>model.nb.id===navChoiceId)){
      navChoiceAt=S.at;
      navChoiceId=(routeModels[0]||{}).nb?.id||null;
    }
    return routeModels.find(model=>model.nb.id===navChoiceId)||routeModels[0]||null;
  }
  function routeThumbnail(nodeId){
    const direct=D.nodeScenes&&D.nodeScenes[nodeId];
    if(direct&&D.scenes&&D.scenes[direct]) return D.scenes[direct];
    const scenery=D.nodeScenery&&D.nodeScenery[nodeId];
    const sceneByScenery={
      port:'busan-departure','old-port':'busan-departure',ferry:'busan-departure','fishing-port':'busan-departure','night-port':'busan-departure',
      overpass:'roadcrew-bridge',airfield:'roadcrew-line',refinery:'roadcrew-line',steelworks:'roadcrew-line',factory:'roadcrew-line',
      'mountain-town':'route-ridge-rescue',windfarm:'route-ridge-rescue',limestone:'route-ridge-rescue',tunnel:'muju-tunnel',
      market:'settlement-road-echo',hanok:'jeonju-market',dome:'daegu-dome',fortress:'suwon-fortress'
    };
    return D.scenes&&D.scenes[sceneByScenery[scenery]||'generic-discovery']||'';
  }
  /* The route console is a close-up navigator, not the nationwide journey map.
     Crop the existing relief around the active leg so a 20 km hop reads as a
     local road instead of a line drawn across all of Korea. */
  function routeTerrainStyle(model){
    const from=D.nodes[S.at]||{}, to=D.nodes[model.nb.id]||{};
    const bounds=D.geoBounds||{west:125.7,east:129.7,south:34.65,north:38.55};
    const lon=((Number(from.lon)||bounds.west)+(Number(to.lon)||bounds.east))/2;
    const lat=((Number(from.lat)||bounds.south)+(Number(to.lat)||bounds.north))/2;
    const geoX=Math.max(0,Math.min(1,(lon-bounds.west)/(bounds.east-bounds.west)));
    const geoY=Math.max(0,Math.min(1,(bounds.north-lat)/(bounds.north-bounds.south)));
    /* The land occupies roughly 21–83% × 7–89% of the painted source. */
    const imageX=(21+geoX*62).toFixed(1);
    const imageY=(7+geoY*82).toFixed(1);
    const zoom=Math.round(Math.max(340,Math.min(470,520-Number(model.nb.km||0)*3)));
    return `--route-map-x:${imageX}%;--route-map-y:${imageY}%;--route-map-zoom:${zoom}%`;
  }
  function routeConsoleHtml(routeModels){
    const selected=routeConsoleModel(routeModels);
    if(!selected) return '<div class="route-empty">지금 이어지는 길이 없다.</div>';
    const node=D.nodes[selected.nb.id], forecast=selected.forecast;
    const selectedIndex=routeModels.indexOf(selected);
    const canDepart=forecast.ok&&!forecast.shortage;
    const carouselModels=routeModels.length===2
      ?[routeModels[1-selectedIndex],selected,routeModels[1-selectedIndex]]
      :routeModels;
    const destinationCards=carouselModels.map((model,displayIndex)=>{
      const index=routeModels.indexOf(model);
      const active=model.nb.id===selected.nb.id;
      const cardNode=D.nodes[model.nb.id], src=routeThumbnail(model.nb.id);
      return `<button type="button" class="nav-destination-card${active?' is-selected':''}"
        data-route-select="${model.nb.id}" ${active&&canDepart?`data-nav-depart="${model.nb.id}"`:''} aria-pressed="${active}" ${!active&&routeModels.length===2?'tabindex="-1" aria-hidden="true"':''}
        aria-label="${active&&canDepart?`${esc(cardNode.name)}으로 출발`:`목적지 ${index+1}, ${esc(cardNode.name)} 선택`}">
        ${src?`<img src="${src}" alt="" loading="eager" decoding="async">`:''}
        <span><b>${esc(cardNode.name)}</b><em>${model.nb.km}km</em></span>
      </button>`;
    }).join('');
    const dots=routeModels.map((model,index)=>`<button type="button" data-route-select="${model.nb.id}"
      aria-label="${esc(D.nodes[model.nb.id].name)} 보기" aria-pressed="${index===selectedIndex}"></button>`).join('');
    return `<div class="route-console route-console-v3${routeModels.length===2?' has-two-routes':''}" data-route-console="${selected.nb.id}">
      <div class="route-console-screen">
        <section class="nav-route-map" style="${routeTerrainStyle(selected)}" aria-labelledby="nav-map-title">
          <h3 class="sr-only" id="nav-map-title">${esc(D.nodes[S.at].name)}에서 ${esc(node.name)}까지의 현재 구간 확대도</h3>
          <canvas data-nav-map aria-label="현재 구간 확대: ${esc(D.nodes[S.at].name)}에서 ${esc(node.name)}까지 ${selected.nb.km}km"></canvas>
          <div class="nav-map-scale"><small>LOCAL ROUTE</small><b>현재 구간 확대</b></div>
          <div class="nav-map-destination-badge"><b>${esc(node.name)}</b><small>${selected.nb.km}km</small></div>
        </section>
        <section class="nav-route-summary" aria-live="polite" aria-label="선택한 목적지 정보">
          <p class="nav-place-description">${esc(routePlaceDescription(node))}</p>
          <div class="nav-route-facts" aria-label="지도와 현재 계기판으로 확인한 경로 정보">
            <span><i class="nav-route-fact-icon" aria-hidden="true"></i><span><small>연료 소모</small><b>${Math.ceil(selected.fuel)}L</b></span></span>
            <span><i class="nav-route-fact-icon" aria-hidden="true"></i><span><small>이동 시간</small><b>${Math.max(1,Math.round(forecast.minutes))}분</b></span></span>
            <span><i class="nav-route-fact-icon" aria-hidden="true"></i><span><small>총 거리</small><b>${selected.nb.km}km</b></span></span>
          </div>
        </section>
        <section class="nav-destination-carousel" aria-label="목적지 선택">
          <button type="button" class="nav-carousel-arrow" data-nav-prev aria-label="이전 목적지" ${routeModels.length<2?'disabled':''}>‹</button>
          <div class="nav-destination-viewport" tabindex="0"><div class="nav-destination-track">${destinationCards}</div></div>
          <button type="button" class="nav-carousel-arrow" data-nav-next aria-label="다음 목적지" ${routeModels.length<2?'disabled':''}>›</button>
          <div class="nav-carousel-dots" aria-label="목적지 위치">${dots}</div>
        </section>
        ${canDepart?'':`<small class="nav-depart-blocked">${forecast.shortage?'현재 연료로 출발할 수 없다.':'아직 이 경로를 이용할 수 없다.'}</small>`}
      </div>
    </div>`;
  }
  function drawRouteConsoleMap(canvas,routeModels,selectedId){
    if(!canvas||!routeModels.length) return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<20||rect.height<20) return;
    const ratio=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(rect.width*ratio); canvas.height=Math.round(rect.height*ratio);
    const ctx=canvas.getContext('2d');
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const width=rect.width,height=rect.height;
    ctx.clearRect(0,0,width,height);
    /* This is deliberately a schematic of one leg, drawn over a close-cropped
       regional relief. It never claims that its line is the nationwide scale. */
    const selectedIndex=Math.max(0,routeModels.findIndex(model=>model.nb.id===selectedId));
    const current={x:width*.18,y:height*.76};
    const selected={x:width*(selectedIndex%2?.74:.78),y:height*(selectedIndex%2?.28:.22)};
    const bends=[current,{x:width*.30,y:height*.66},{x:width*.45,y:height*.58},{x:width*.56,y:height*.43},selected];
    ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([5,6]);
    ctx.strokeStyle='rgba(222,226,223,.68)';ctx.lineWidth=2;
    ctx.beginPath();bends.forEach((point,index)=>{index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y);});ctx.stroke();ctx.setLineDash([]);
    bends.slice(1,-1).forEach(point=>{ctx.fillStyle='#c1c5c3';ctx.beginPath();ctx.arc(point.x,point.y,2.6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(237,239,235,.58)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(point.x,point.y,4.7,0,Math.PI*2);ctx.stroke();});
    ctx.fillStyle='#55e0c8';ctx.beginPath();ctx.arc(current.x,current.y,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(85,224,200,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(current.x,current.y,9,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffb454';ctx.beginPath();ctx.arc(selected.x,selected.y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,180,84,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(selected.x,selected.y,10,0,Math.PI*2);ctx.stroke();
    const bracket=13,arm=5;ctx.strokeStyle='#ffb454';ctx.lineWidth=2;
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.moveTo(selected.x+sx*bracket,selected.y+sy*(bracket-arm));ctx.lineTo(selected.x+sx*bracket,selected.y+sy*bracket);ctx.lineTo(selected.x+sx*(bracket-arm),selected.y+sy*bracket);ctx.stroke();});
    ctx.font=`700 ${width<300?9:10}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono')||'monospace'}`;
    ctx.fillStyle='#79e9d6';ctx.textAlign='left';ctx.fillText(D.nodes[S.at].name,current.x+10,current.y+17);
    ctx.textAlign='left';
  }
  function wireRouteConsole(panel,routeModels){
    panel.querySelectorAll('[data-route-select]').forEach(button=>button.onclick=event=>{
      if(event.defaultPrevented) return;
      const id=button.dataset.routeSelect;
      if(button.classList.contains('nav-destination-card')&&id===navChoiceId&&button.dataset.navDepart){
        G.startTravel(button.dataset.navDepart);return;
      }
      navChoiceAt=S.at;navChoiceId=id;renderPanel();
    });
    const chooseOffset=offset=>{
      if(routeModels.length<2) return;
      const index=Math.max(0,routeModels.findIndex(model=>model.nb.id===navChoiceId));
      navChoiceAt=S.at;
      navChoiceId=routeModels[(index+offset+routeModels.length)%routeModels.length].nb.id;
      renderPanel();
    };
    const prev=panel.querySelector('[data-nav-prev]'),next=panel.querySelector('[data-nav-next]');
    if(prev) prev.onclick=()=>chooseOffset(-1);
    if(next) next.onclick=()=>chooseOffset(1);
    const canvas=panel.querySelector('[data-nav-map]');
    if(canvas) requestAnimationFrame(()=>drawRouteConsoleMap(canvas,routeModels,navChoiceId));
    const viewport=panel.querySelector('.nav-destination-viewport');
    const activeCard=viewport&&viewport.querySelector('.nav-destination-card.is-selected');
    if(viewport&&activeCard){
      const fixedPair=!!panel.querySelector('.route-console-v3.has-two-routes');
      const centerActive=()=>viewport.scrollTo({left:fixedPair?0:Math.max(0,activeCard.offsetLeft-(viewport.clientWidth-activeCard.clientWidth)/2),behavior:'auto'});
      /* 큰 글자 모드처럼 renderAll 직후 바로 기하를 검사해도 선택 카드가 먼저
         프레임 밖에 남지 않도록, 강제 레이아웃 뒤 즉시 한 번과 다음 프레임에 한 번 맞춘다. */
      void viewport.offsetWidth;centerActive();requestAnimationFrame(centerActive);
    }
    if(viewport){
      let pointerX=null,dragged=false;
      viewport.addEventListener('click',event=>{if(!dragged)return;event.preventDefault();event.stopPropagation();dragged=false;},true);
      viewport.onpointerdown=event=>{ pointerX=event.clientX;dragged=false; };
      viewport.onpointerup=event=>{
        if(pointerX===null) return;
        const delta=event.clientX-pointerX;pointerX=null;
        if(Math.abs(delta)>36){dragged=true;chooseOffset(delta<0?1:-1);}
      };
      viewport.onkeydown=event=>{
        if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return;
        event.preventDefault();chooseOffset(event.key==='ArrowRight'?1:-1);
      };
    }
  }
  function applyIcons(){
    [['#g-fuel','fuel'],['#g-water','water'],['#g-food','food'],['#g-van','van'],['#g-scrap','scrap']]
      .forEach(([sel,key])=>{ if(!D.icons[key]) return;
        const lab=$(sel+' .lab span'); if(lab&&!lab.querySelector('.ico'))
          lab.innerHTML=`<img class="ico" src="${D.icons[key]}" alt="">`+lab.textContent; });
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
      <b>${esc(guide.title)}</b><p>${esc(guide.body)}</p>${guide.points&&guide.points.length?`<ul class="journey-guide-list">${guide.points.map(point=>`<li>${esc(point)}</li>`).join('')}</ul>`:''}
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
      refreshMapSurface();
    };
    const crew=p.querySelector('[data-a="crew"]');
    if(crew) crew.onclick=()=>{
      stTab='crew';
      if(!$('#ovl-status').classList.contains('on')) toggleOvl('#ovl-status');
      renderStatus();
    };
  }
  function stopActionHtml({action,kicker,icon,title,description,chips=[],primary=false,disabled=false,cta=''}){
    const chipHtml=chips.filter(Boolean).map(chip=>{
      const item=typeof chip==='string'?{label:chip}:chip;
      return `<i class="${item.tone?` tone-${esc(item.tone)}`:''}">${esc(item.label)}</i>`;
    }).join('');
    const iconKey=icon||({explore:'explore',camp:'camp',repair:'repair',radio:'radio',walkfuel:'fuel',craft:'parts'}[action]||'quest');
    const iconHtml=['explore','camp','repair','radio'].includes(iconKey)
      ? `<span class="stop-action-icon stay-action-icon icon-${iconKey}" aria-hidden="true"></span>`
      : `<span class="stop-action-icon" aria-hidden="true">${ICO(iconKey)}</span>`;
    const shortCta={explore:'탐색',camp:'준비',repair:'정비',radio:'수리'}[action]||(cta||title);
    return `<article class="stop-action-card${primary?' primary':''}${disabled?' is-disabled':''}">
      <button type="button" class="stop-action-trigger" data-a="${esc(action)}" ${disabled?'disabled':''}>
        ${iconHtml}<span class="stop-action-copy"><small class="stop-action-kicker">${esc(kicker)}</small><b>${esc(title)}</b>
          <span class="stop-action-description">${esc(description)}</span>
          ${chipHtml?`<span class="stop-action-chips">${chipHtml}</span>`:''}</span>
        <span class="stop-action-cta"><small>실행</small><span>${esc(shortCta)} <i aria-hidden="true">→</i></span></span>
      </button></article>`;
  }
  function journeyModeTabsHtml(mode){
    const modes=[['route','목적지'],['local','머물기']];
    return `<div class="journey-mode-tabs journey-rocker" role="tablist" aria-label="정차 콘솔 모드">${modes.map(([id,label])=>{
      const active=id===mode;
      return `<button type="button" role="tab" data-journey-mode="${id}" aria-selected="${active}" aria-controls="journey-mode-${id}" tabindex="${active?'0':'-1'}">${label}</button>`;
    }).join('')}</div>`;
  }
  let stoppedStageFitFrame=0;
  let stoppedStageBase=0;
  let stoppedStageResizeTimer=0;
  function resetStoppedStageFit(){
    if(stoppedStageFitFrame) cancelAnimationFrame(stoppedStageFitFrame);
    stoppedStageFitFrame=0;
    stoppedStageBase=0;
    const stage=$('#stage');
    if(stage) stage.style.removeProperty('flex-basis');
  }
  function scheduleStoppedStageFit(pass=0){
    if(stoppedStageFitFrame) cancelAnimationFrame(stoppedStageFitFrame);
    if(screen!=='game'||!S||S.driving) return;
    /* 남는 세로 공간은 빈 패널로 두지 않고 풍경에 돌려준다. 고정 높이를 더하는
       대신 실제 콘텐츠 끝과 하단 메뉴 사이를 재므로 짧은 화면은 기존 배치를 지킨다.
       game-viewport-locked는 런타임 폭을 고정할 뿐, 이 세로 보정까지 막으면 안 된다. */
    stoppedStageFitFrame=requestAnimationFrame(()=>{
      stoppedStageFitFrame=requestAnimationFrame(()=>{
        stoppedStageFitFrame=0;
        const stage=$('#stage'), panel=$('#panel'), dock=$('#dock');
        const contentEnd=panel&&[...panel.children].reverse().find(node=>node.getClientRects().length);
        if(!stage||!panel||!dock||!contentEnd||!stage.offsetParent||panel.scrollTop>1) return;
        const stageHeight=stage.getBoundingClientRect().height;
        if(!stoppedStageBase) stoppedStageBase=stageHeight;
        /* 2번 기록철처럼 장치와 하단 키덱을 한 몸으로 붙인다. 모드마다
           서로 다른 빈 띠가 생기면 스위치를 넘길 때 화면 전체가 바뀐 듯 보인다. */
        const targetGap=3;
        const gap=dock.getBoundingClientRect().top-contentEnd.getBoundingClientRect().bottom;
        let nextHeight=stageHeight;
        if(gap>targetGap+1){
          nextHeight=Math.max(stoppedStageBase,Math.round(stageHeight+gap-targetGap));
        }else if(gap<targetGap-1){
          /* 너비가 큰 짧은 화면에서는 정사각 콘솔이 먼저 커진다. 이때만 풍경을
             최대 32px 줄여 하단 도크와 실제 조작이 겹치지 않게 한다. */
          nextHeight=Math.max(stoppedStageBase-32,Math.round(stageHeight+gap-targetGap));
        }
        if(Math.abs(nextHeight-stageHeight)>1){
          stage.style.flexBasis=`${nextHeight}px`;
          /* flex 레이아웃이 새 높이를 반영한 뒤 남은 틈을 다시 잰다. 한 번만
             맞추면 짧은 화면에서 기록철 아래에 30~40px가 남는다. */
          if(pass<3) stoppedStageFitFrame=requestAnimationFrame(()=>{
            stoppedStageFitFrame=0;
            scheduleStoppedStageFit(pass+1);
          });
        }
      });
    });
  }
  window.addEventListener('resize',()=>{
    clearTimeout(stoppedStageResizeTimer);
    stoppedStageResizeTimer=setTimeout(()=>{
      resetStoppedStageFit();
      scheduleStoppedStageFit();
    },80);
  },{passive:true});
  function wireJourneyMode(panel,routeModels){
    const buttons=[...panel.querySelectorAll('[data-journey-mode]')];
    const select=(button)=>{
      if(!button||button.dataset.journeyMode===journeyConsoleMode) return;
      journeyConsoleMode=button.dataset.journeyMode;
      document.documentElement.dataset.journeyMode=journeyConsoleMode;
      buttons.forEach(tab=>{
        const active=tab.dataset.journeyMode===journeyConsoleMode;
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex=active?0:-1;
      });
      panel.querySelectorAll('.journey-mode-panel').forEach(modePanel=>{
        const active=modePanel.id===`journey-mode-${journeyConsoleMode}`;
        modePanel.hidden=!active;
        modePanel.setAttribute('aria-hidden',String(!active));
      });
      /* 목적지와 머물기는 같은 장치 안의 물리 스위치다. 화면 전체를 다시
         만들거나 풍경 높이를 재계산하지 않고 내부 화면만 켜고 끈다. */
      if(journeyConsoleMode==='route') wireRouteConsole(panel,routeModels||[]);
      button.focus({preventScroll:true});
    };
    buttons.forEach((button,index)=>{
      button.onclick=()=>select(button);
      button.onkeydown=event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const direction=(event.key==='ArrowRight'||event.key==='ArrowDown')?1:-1;
        select(buttons[(index+direction+buttons.length)%buttons.length]);
      };
    });
  }
  function wireStopActionButtons(root,node,overlay=''){
    const run=action=>{
      if(overlay) closeModal(overlay,false);
      action();
    };
    const wf=root.querySelector('[data-a="walkfuel"]'); if(wf) wf.onclick=()=>run(()=>G.openRescue('nofuel','crisis_nofuel'));
    const rp=root.querySelector('[data-a="repair"]'); if(rp) rp.onclick=()=>run(()=>G.fieldRepair());
    const rd=root.querySelector('[data-a="radio"]'); if(rd) rd.onclick=()=>run(()=>{ if(G.fixRadio()) renderAll(); });
    const cf=root.querySelector('[data-a="craft"]'); if(cf) cf.onclick=()=>run(()=>showCraft());
    const rq=root.querySelector('[data-a="recruitstep"]'); if(rq) rq.onclick=()=>run(()=>G.openRecruitStep());
    const ex=root.querySelector('[data-a="explore"]'); if(ex) ex.onclick=()=>run(()=>G.explore());
    const st=root.querySelector('[data-a="stl"]'); if(st) st.onclick=()=>run(()=>showStl(node.stl));
    const camp=root.querySelector('[data-a="camp"]'); if(camp) camp.onclick=()=>run(()=>showCampHub());
  }
  function renderPanel(){
    const p=$('#panel');
    if(!S){ resetStoppedStageFit(); p.innerHTML=''; return; }
    document.documentElement.classList.add('game-viewport-locked');
    /* 온보딩은 설명을 더 붙이는 대신 아직 필요 없는 정보를 접는다. */
    const journeyStage=(S.stats&&S.stats.km<35)||(S.stats&&S.stats.events<4)?'first'
      :(S.stats&&S.stats.km<110?'learning':'open');
    document.documentElement.dataset.journeyStage=journeyStage;
    document.documentElement.dataset.travelState='stopped';
    if(S.driving){
      resetStoppedStageFit();
      const to=D.nodes[S.driving.to];
      const rq=S.recruitQ&&(S.recruitQ.stage==='road'
        ||(S.recruitQ.stage==='task'&&S.driving.recruitEscort===S.recruitQ.id))?S.recruitQ:null;
      const def=rq&&D.recruitQuests[rq.id];
      const approach=rq&&G.recruitApproach();
      const taskEscort=!!(rq&&rq.stage==='task');
      const memory=S.driving.recruitMemory;
      const choiceMemory=G.pendingChoiceMemory();
      const route=G.routeStatus();
      const routeCard=route&&!route.complete?`<section class="road-guest-card road-memory-card" aria-label="선택한 노선">
        <div class="road-guest-head"><span class="rg-ico">${route.def.mark}</span><span>
          <small>김천에서 고른 길 · 청주까지 고정</small><b>${esc(route.def.name)}</b></span></div>
        <div class="road-guest-help">${esc(route.def.promise)}</div>
        <div class="road-guest-memory"><b>노선 진행 ${route.done}/${route.total}</b> · 청주에서 두 길이 다시 합쳐진다.</div>
      </section>`:'';
      const guest=def?`<section class="road-guest-card" aria-label="${def.name} ${taskEscort?'현장 동행':'임시 동행'}">
        <div class="road-guest-head"><span class="rg-ico">${def.guest.ic}</span><span>
          <small>${taskEscort?'같은 방향의 현장 동행':'임시 동행 · 아직 손님'}</small><b>${def.name} — ${taskEscort?`${esc(D.nodes[rq.target].name)}까지`:def.guest.title}</b></span></div>
        <div class="road-guest-help">${taskEscort?'길에서 만난 뒤 목적지가 같은 사람이다. 되돌아가지 않고 지금 가는 정차지에서 부탁을 이어 간다.':def.guest.desc}</div>
        ${!taskEscort&&approach?`<div class="road-guest-memory"><b>${approach.label}</b> · ${approach.memory}</div>`:''}
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
      </section>`:'';
      const checkMoment=S.driving.checkInMoment;
      const roadCheckIn=S.party.length?`<section class="road-checkin ${checkMoment?'has-moment':''}" aria-label="주행 중 동료와 이야기">
        <div><small>ROAD MOMENT · 이 구간 한 번</small><b>${checkMoment?esc(checkMoment.title):S.driving.checkIn?`${esc(D.comps[S.driving.checkIn].name)}와 나눈 짧은 이야기`:'누구와 이 길을 보낼까?'}</b>${checkMoment?`<p>${esc(checkMoment.text)}</p>`:''}</div>
        <div class="road-checkin-list">${S.party.map(id=>`<button data-road-checkin="${id}" ${S.driving.checkIn?'disabled':''}>${faceOf(id,D.comps[id].face)} <span>${esc(D.comps[id].name)}</span></button>`).join('')}</div>
      </section>`:'';
      p.innerHTML = `
        ${contextRail(to,true)}
        ${journeyGuideHtml()}
        <section class="travel-progress-card" aria-label="현재 주행 진행">
          <div class="journey-section-head"><span><small>ACTIVE ROUTE</small><b>${esc(D.nodes[S.driving.from].name)}에서 ${esc(to.name)}까지</b></span><em>주행 중</em></div>
          <div id="travelbar"></div>
        </section>
        ${routeCard}
        <div class="road-note">차는 계속 달린다. 남은 거리와 탑승 상태는 위 요약에서 바로 확인할 수 있다.</div>
        ${journeyNoticeHtml()}
        ${guest}
        ${roadCheckIn}`;
      renderTravelbar();
      wireContext(p);
      p.querySelectorAll('[data-road-checkin]').forEach(b=>b.onclick=()=>{
        const r=G.roadCheckIn(b.dataset.roadCheckin); if(!r.ok) UI.toast(r.why); renderPanel(); renderHud();
      });
      wireJourneyGuide(p);
      return;
    }
    const n=D.nodes[S.at];
    document.documentElement.dataset.journeyMode=journeyConsoleMode;
    let localActions=[];
    if(S.recruitQ){
      const rq=S.recruitQ, def=D.recruitQuests[rq.id];
      const atTask=rq.stage==='task'&&S.at===rq.target;
      const atFollow=rq.stage==='follow'&&S.at===rq.target;
      const ready=rq.stage==='ready', road=rq.stage==='road';
      const waitNight=atFollow&&Number.isFinite(rq.roadDay)&&S.day<=rq.roadDay;
      const enabled=ready||atTask||(atFollow&&!waitNight);
      const label=ready?`합류를 이야기한다 — ${def.name}`
        :atFollow?`길에서 생긴 일을 마주한다 — ${def.name}`
        :road?`다음 길을 함께 간다 — ${def.name}`
        :atTask?`${def.name}의 부탁을 진행한다`
        :`${D.nodes[rq.target].name}까지 임시 동행 · ${def.name}`;
      const small=ready?'서로를 겪은 뒤, 본인이 자리를 고른다'
        :atFollow?def.followHint:road?def.roadHint:def.hint;
      /* 밤을 보내야만 이어지는 합류 단계는 행동처럼 보이면 어색하다.
         야영 화면과 목표 기록이 대기 상태를 이미 설명하므로 머물기 목록에서는 숨긴다. */
      if(!waitNight) localActions.push(stopActionHtml({
        action:'recruitstep',kicker:ready?'합류 결정':atFollow?'동행 후속':road?'임시 동행':'동료의 부탁',
        icon:'quest',title:label,description:small,primary:true,disabled:!enabled,
        chips:[enabled?{label:'지금 가능',tone:'ready'}:{label:road?'다음 주행에서 진행':'다른 시간·장소 필요',tone:'muted'}],cta:'진행하기'
      }));
    }
    if(n.stl) localActions.push(stopActionHtml({
      action:'stl',kicker:'주요 정착지',icon:'quest',title:`${n.name} 안으로`,
      description:'사람과 거래하고, 이곳의 부탁과 소문을 직접 확인한다.',primary:true,
      chips:['거래','대화','지역 활동'],cta:'정착지 안으로'
    }));
    if(n.type!=='goal'){
      const es=G.exploreStatus();
      const exploreFatigue=es.ok?Math.max(1,Math.round(
        es.mins*.045*(1-G.driverLv()*.06)*(G.isInjured('driver')?1.2:1)+es.fatigue
      )):0;
      localActions.push(stopActionHtml({
        action:'explore',kicker:es.repeat?'오늘의 마지막 수색':'주변에서',title:'주변 탐색',
        description:es.ok?'직접 둘러본다. 결과는 끝난 뒤 알 수 있다.':es.reason,disabled:!es.ok,
        chips:es.ok?[`시간 +${G.durationLabel(es.mins)}`,{label:`피로 약 +${exploreFatigue}`,tone:'cost'},{label:'발견물 미확인',tone:'muted'}]:[],cta:'탐색하기'
      }));
    }
    let campVanFix=4;
    if(G.hasPerk('mj_camp')) campVanFix+=8;
    if(S.up&&S.up.solar) campVanFix+=3;
    const campVanGain=Math.max(0,Math.min(campVanFix,S.vanMax-S.van));
    localActions.push(stopActionHtml({
      action:'camp',kicker:'차 안에서',title:'야영 준비',
      description:'식사·정비·대화를 고른 뒤 다음 아침까지 쉰다.',
      chips:[{label:'다음 06:30',tone:'muted'},{label:'피로 → 0%',tone:'gain'},{label:campVanGain?`차체 +${campVanGain}`:'차체 유지',tone:'gain'}],cta:'준비하기'
    }));
    const nbs=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id));
    const routeModels=nbs.map(nb=>({nb,forecast:G.travelForecast(nb.id),fuel:G.fuelFor(nb.km,nb.road)}));
    if(S.fuel<5) localActions.push(stopActionHtml({
      action:'walkfuel',kicker:'연료 비상',title:'걸어서 연료를 구해온다',
      description:'시간과 체력을 크게 소모한다.',chips:[{label:'연료 부족',tone:'danger'}],cta:'연료 구하기'
    }));
    if(S.van<S.vanMax-5){
      const hasP=(S.items['부품']||0)>0;
      const repairGain=S.up&&S.up.sidebox?45:35;
      localActions.push(stopActionHtml({
        action:'repair',kicker:'정차 정비',title:'달구지를 정비한다',
        description:hasP?'부품으로 차체를 현장에서 복구한다.':'부품이 없어 지금은 현장 정비를 할 수 없다.',disabled:!hasP,
        chips:hasP?[{label:S.up&&S.up.sidebox?'부품 최대 -1':'부품 -1',tone:'cost'},{label:'시간 +1:40',tone:'cost'},{label:`차체 +${repairGain}`,tone:'gain'}]
          :[{label:'부품 필요',tone:'cost'}],cta:'정비하기'
      }));
    }
    if(!S.flags.radio_fixed){ const hasT=(S.items['라디오 진공관']||0)>0;
      localActions.push(stopActionHtml({
        action:'radio',kicker:'차 안에서',title:'라디오를 고친다',
        description:hasT?'진공관을 교체해 주행 중 방송 수신을 되살린다.':'라디오 진공관이 없어 지금은 수리할 수 없다.',disabled:!hasT,
        chips:hasT?[{label:'진공관 -1',tone:'cost'},{label:'시간 +0:40',tone:'cost'},{label:'주행 방송 해금',tone:'gain'}]
          :[{label:'진공관 필요',tone:'cost'}],cta:'수리하기'
      })); }
    if(S.flags.armed_age) localActions.push(stopActionHtml({
      action:'craft',kicker:'차 뒤 칸에서',title:'작업대를 편다',
      description:'무기와 탄을 직접 만든다.',chips:['약 40분'],cta:'작업하기'
    }));
    /* 같은 콘솔에서 세로 스크롤이 생기면 목적지↔머물기 전환이 다른 화면처럼 느껴진다.
       즉시 해야 할 순서대로 네 가지만 남기고, 정비는 가방·야영에서도 계속 접근할 수 있다. */
    localActions=localActions.slice(0,4);
    const localActive=journeyConsoleMode==='local';
    const routeActive=journeyConsoleMode==='route';
    const localSection=localActions.length?`<div class="route-console journey-mode-panel journey-local-panel" id="journey-mode-local" role="tabpanel" aria-label="머물기" aria-hidden="${!localActive}" ${localActive?'':'hidden'}>
      <section class="route-console-screen journey-local-screen stop-action-console local-action-count-${Math.min(localActions.length,5)}">
        <div class="stop-action-grid local-actions">${localActions.join('')}</div>
      </section></div>`:`<div class="route-console journey-mode-panel journey-local-panel" id="journey-mode-local" role="tabpanel" aria-label="머물기" aria-hidden="${!localActive}" ${localActive?'':'hidden'}><div class="route-empty">지금 이곳에서 할 수 있는 일이 없다.</div></div>`;
    const routeSection=`<div class="journey-mode-panel" id="journey-mode-route" role="tabpanel" aria-label="목적지 네비게이션" aria-hidden="${!routeActive}" ${routeActive?'':'hidden'}>${routeConsoleHtml(routeModels)}</div>`;
    const journeyConsole=`<section class="journey-mode-console" aria-label="정차 통합 콘솔">${journeyModeTabsHtml(journeyConsoleMode)}${routeSection}${localSection}</section>`;
    const h=`${contextRail(n,false)}${journeyGuideHtml()}${journeyConsole}`;
    p.innerHTML=h;
    wireStopActionButtons(p,n);
    wireContext(p);
    wireJourneyGuide(p);
    wireJourneyMode(p,routeModels);
    wireRouteConsole(p,routeModels);
    p.querySelectorAll('[data-go]:not([data-route-select])').forEach(b=>b.onclick=()=>{ G.startTravel(b.dataset.go); });
    scheduleStoppedStageFit();
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
  function onDepart(){ roadNotice=null; closeOvl('#ovl-map'); closeOvl('#ovl-stl'); closeOvl('#ovl-local-actions'); renderAll();
    SND.setDriving(true);
    AMBI.depart(S.driving&&S.driving.road); }
  function onArrive(){
    journeyConsoleMode='local';
    roadNotice=null;
    renderAll(); SND.setDriving(false);
    AMBI.arrive(S.at);
    const id=S.at, n=D.nodes[id], portraitKey=D.arrivalScenes&&D.arrivalScenes[id];
    const key=portraitKey||D.nodeScenes&&D.nodeScenes[id];
    const src=key&&D.scenes&&D.scenes[key];
    const recap=S.lastJourneyRecap;
    const a=$('#arrival-scene');
    const recapChanges=recap&&recap.changes&&recap.changes.length
      ?recap.changes.slice(0,5).map(change=>`<i class="${change.good?'gain':'cost'}">${esc(change.label)} ${change.value>0?'+':''}${change.value}${esc(change.unit)}</i>`).join('')
      :'<i>자원 변화 없음</i>';
    const contract=recap&&recap.routeContract?`<div class="arrival-contract">
      <small>${esc(recap.routeContract.mark)} ${esc(recap.routeContract.name)} · ${esc(recap.routeProgress)} 구간</small>
      <strong>계약: ${esc(recap.routeContract.promise)}</strong>
      <span>${recap.routeContract.complete?'계약 구간 완료':'계약 진행 중'}</span>
    </div>`:'';
    const people=recap&&recap.checkIn?`<div class="arrival-people"><small>이 길에서 함께한 시간</small><strong>${esc(recap.checkIn.moment&&recap.checkIn.moment.title||`${recap.checkIn.name}와 나눈 짧은 이야기`)}</strong>${recap.checkIn.moment?`<span>${esc(recap.checkIn.moment.text)}</span>`:''}</div>`:'';
    const chapter=recap&&recap.chapter?`<div class="arrival-chapter"><small>CHAPTER COMPLETE</small><strong>${esc(recap.chapter.title)}</strong><span>${esc(recap.chapter.text)}</span></div>`:'';
    a.classList.toggle('arrival-portrait',!!(src&&portraitKey));
    a.classList.toggle('arrival-landscape',!!(src&&!portraitKey));
    if(src) a.style.setProperty('--arrival-image',`url("${src}")`);
    else a.style.removeProperty('--arrival-image');
    a.innerHTML=`${src?`<img class="arrival-art" src="${src}" alt="${esc(n.name)} 도착 풍경">`:'<div class="arrival-fallback" aria-hidden="true"></div>'}<div class="arrival-copy"><small>ARRIVAL · DAY ${S.day}</small><b>${n.name}</b><span>${n.desc}</span>
      ${recap?`<div class="arrival-ledger" aria-label="방금 주행 정산">
        <div><strong>${esc(D.nodes[recap.from].name)} → ${esc(n.name)}</strong><em>${recap.km}km · ${G.durationLabel(recap.minutes)} · 사건 ${recap.events}건</em></div>
        <div class="arrival-deltas">${recapChanges}</div>
        ${contract}
        ${people}
        ${chapter}
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
  function showNextToast(){
    const host=$('#toasts');
    if(!host||toastActive||!toastQueue.length) return;
    toastActive=true;
    const item=toastQueue.shift();
    const t=el('div','toast '+(item.cls||''),item.html);
    host.replaceChildren(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    const hold=Math.min(4200,2600+String(t.textContent||'').length*18);
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{
      t.classList.remove('show');
      toastTimer=setTimeout(()=>{
        if(t.isConnected) t.remove();
        toastActive=false;
        showNextToast();
      },uiPrefs.reduceMotion?10:260);
    },hold);
  }
  function toast(html, cls){
    const normalized=String(html||'').trim();
    if(!normalized) return;
    const severity=String(cls||'').split(/\s+/);
    const roadBound=screen==='game'&&S&&S.driving&&!modalOpen()
      &&!severity.some(level=>level==='warn'||level==='danger');
    if(roadBound){ setRoadNotice(normalized,cls); return; }
    const last=toastQueue[toastQueue.length-1];
    if(last&&last.html===normalized&&last.cls===(cls||'')) return;
    toastQueue.push({html:normalized,cls:cls||''});
    if(toastQueue.length>6) toastQueue.splice(0,toastQueue.length-6);
    showNextToast();
  }
  function clearToasts(){
    clearTimeout(toastTimer);
    toastQueue.length=0;
    toastActive=false;
    const host=$('#toasts');
    if(host) host.replaceChildren();
  }

  /* ── EVENT SHEET ── */
  let curEv=null, curStory=null;
  let curCombatChoices=[];
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
    const pressure=state?state.pressure||0:c.pressure||0;
    const kind=(state&&state.kind)||c.kind||'교전';
    const report=opt.ended&&S.lastCombatReport;
    const reportCost=report&&report.costs&&report.costs.length?report.costs.join(' · '):'추가 손실 없음';
    const resultClass=report?` combat-result-${report.resultCode}`:'';
    const reportGain=report&&report.gains&&report.gains.length?report.gains.join(' · '):'추가 획득 없음';
    const screenText = `${esc(kind)} 상황 / 단계 ${c.phase}/${c.total} / 진행 ${grade}${report?` / 결과 ${report.result}`:''}`;
    return `<section class="combat-hud${resultClass}" role="status" aria-live="polite" aria-atomic="true" aria-label="${screenText}">
      <div class="combat-hud-head"><span class="combat-phase">${opt.result?'결과':esc(kind)} ${c.phase}/${c.total}</span>
        <b class="combat-step">${c.step}</b><span class="combat-threat">${c.threat}</span></div>
      <div class="combat-objective"><b>${opt.result?(opt.ended?'마침':'결과'):'목표'}</b><span>${opt.result?(opt.ended?'선택의 결과를 확인하고 현장을 마무리한다':'이 선택이 다음 단계의 진행을 바꾼다'):c.objective}</span></div>
      ${!opt.result&&terrain?`<div class="combat-context"><span><b>현재 지형</b>${esc(terrain)}</span></div>`:''}
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
      </div>`:''}
      <div class="combat-track" aria-hidden="true">${track}</div>
      <div class="combat-state"><span class="${grade==='우세'?'good':grade==='불리'?'bad':''}">진행 ${grade}</span>
        <span class="${pressure>=2?'bad':pressure===0?'good':''}">압박 ${pressure}/3</span>
        ${S.van<35?`<span class="bad">차체 ${Math.ceil(S.van)}%</span>`:''}
        ${S.pursuit>=3?`<span class="bad">관측 ${S.pursuit}/5</span>`:''}
        ${injuries?`<span class="bad">부상 ${injuries}명</span>`:''}</div></section>`;
  }
  function choiceIntentTag(choice){
    const text=stripTags(choice&&choice.label||'');
    if(/사과|위로|괜찮|도와|함께|가르쳐|듣는다|말을 건다/.test(text)) return '공감';
    if(/지나간|떠난|작별|거절|물러|이탈|외면/.test(text)) return '거리두기';
    if(/적는다|기록|베껴|써 둔다|남긴다/.test(text)) return '기록';
    if(/읽는다|읽어|대조|확인/.test(text)) return '확인';
    if(/부품|연료|수리|정비|거래|찾아|확인|계산|살핀/.test(text)) return '실용';
    if(/공격|돌입|밀어|쏜|맞선|끝낸|위험을/.test(text)) return '결단';
    if(/묻|왜|어디|누구|무엇|소리로/.test(text)) return '탐색';
    return '대응';
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
      const routeId=(c.out||[]).map(o=>o.fx&&o.fx.routeChoice).find(Boolean);
      const route=routeId&&G.routeForecast(routeId);
      count++;
      const intentTag=!inCombat?choiceIntentTag(c):'';
      const title = c.tactic ? `<span class="combat-tactic">${esc(c.tactic)}</span><span>${safeHtml(c.label)}</span>` : `<span>${safeHtml(c.label)}</span>`;
      const liveBits=[
        `${count}번째 선택`,
        stripTags(c.label || ''),
        rq.ok ? '요구사항 충족' : `요구 조건: ${rq.t}`,
        cost||''
      ].filter(Boolean);
      const indexLabel=inCombat?String(count):`<small>선택</small><b>${count}</b>`;
      html+=`<button class="choice" data-i="${i}" ${rq.ok?'':'disabled'} aria-label="${esc(liveBits.join(' · '))}">
          <div class="choice-head"><span class="choice-index">${indexLabel}</span><span class="choice-title">${intentTag?`<i class="choice-intent">${intentTag}</i>`:''}${title}</span></div>
          ${route?`<span class="route-forecast"><b>${route.km}km · ${routeDurationRange(route.minutes)} · 연료 ${routeFuelRange(route.fuel)}</b><small>현장 상황은 출발 뒤 확인</small></span>`:''}
          ${cost?`<span class="req">${rq.ok?'✓':'✗'} ${cost}</span>`:''}
        </button>`;
    });
    return {html,count,combatChoices,difficulty:null};
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
    const familyText=`${evd&&evd.id||''} ${stripTags(evd&&evd.title||'')} ${fallbackType||''}`;
    const familyRule=(D.eventSceneFamilyRules||[]).find(rule=>
      (!rule.types||rule.types.includes(fallbackType))&&(!rule.match||rule.match.test(familyText)));
    add(familyRule&&familyRule.scene);
    if(keys.length) return keys;
    /* 인물이 명시된 스토리에 최종 동료 단체사진을 임의로 붙이지 않는다.
       전용 컷이 없으면 먼저 실제 현재 장소를 보여 주고, 그것도 없을 때만
       타입 공용 컷을 쓴다. 조우·위기·탐색은 기존 공용 행동 컷을 유지한다. */
    if(fallbackType==='스토리'||fallbackType==='대화'){
      add(typeof S!=='undefined'&&S&&D.nodeScenes&&D.nodeScenes[S.at]);
      if(keys.length) return keys;
    }
    add(fallbackType&&D.eventSceneTypes&&D.eventSceneTypes[fallbackType]);
    if(keys.length) return keys;
    add(typeof S!=='undefined'&&S&&D.nodeScenes&&D.nodeScenes[S.at]);
    if(keys.length) return keys;
    add('generic-story');
    return keys;
  }
  function sceneFormat(key){
    const declared=D.sceneAssetMeta&&D.sceneAssetMeta[key]&&D.sceneAssetMeta[key].format;
    if(declared) return declared;
    if(/^(recruit-|minji-toolbox|parkss-clinic|leo-rooftop-song|jaeyi-ledger|eunsu-last-shift|library-bus)$/.test(key||'')) return 'character';
    if(/^(trace-|frequency-tape|postman-letter|grandfather-envelope|family-verification-key|story-generation-form|story-generation-speech)$/.test(key||'')) return 'detail';
    if(/^(combat-|roadcrew-|route-)/.test(key||'')) return 'action';
    if(/^event-(meet|ai|crisis)-/.test(key||'')) return 'action';
    if(/^event-companion-/.test(key||'')) return 'character';
    if(/^event-find-/.test(key||'')) return 'detail';
    return 'place';
  }
  function sceneFrameHtml(sceneKeys, sceneAlt){
    const key=sceneKeys&&sceneKeys[0], src=key&&D.scenes&&D.scenes[key];
    if(!src) return '';
    const description=D.sceneDescriptions&&D.sceneDescriptions[key]||sceneAlt;
    return `<div class="event-scene-frame" role="button" tabindex="0"
      data-scene-key="${esc(key)}" data-scene-format="${sceneFormat(key)}" data-cut-token="initial"
      aria-label="${esc(description)} 크게 보기">
      <img class="event-scene" src="${src}" alt="${esc(description)}" decoding="async" loading="eager" fetchpriority="high">
      <span class="scene-zoom" aria-hidden="true">↗</span></div>`;
  }
  function storySceneShot(state,turn,index,format='place'){
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
    if(!turn||turn.kind==='narration'){
      if(format==='character') shot={x:50,y:46,scale:1.1};
      else if(format==='detail') shot={x:50,y:52,scale:1.04};
      else if(format==='action') shot={x:50,y:48,scale:1.07};
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
    if(changed&&frame.dataset.shotLock)delete frame.dataset.shotLock;
    // 선택→결과로 이어받은(carry) 장면은 같은 키가 보이는 동안 크롭을 고정한다
    const refreshShot=turn&&turn.kind==='dialogue' && !changed && index%2===0
      && frame.dataset.shotLock!==key;
    frame.dataset.sceneKey=key;
    frame.dataset.sceneFormat=sceneFormat(key);
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
      frame.dataset.shotLock=key;
      frame.dataset.tone=carry.tone||state.phase;
      frame.style.setProperty('--scene-x',carry.x||'50%');
      frame.style.setProperty('--scene-y',carry.y||'50%');
      frame.style.setProperty('--scene-scale',carry.scale||'1');
      if(priorKey!==key) img.src=src;
      state.sceneCarry=null;
    }else if(firstRender||changed||refreshShot){
      const shot=storySceneShot(state,turn,index,sceneFormat(key));
      frame.dataset.cutToken=`${state.phase}-${index}-${key}`;
      frame.dataset.tone=shot.tone;
      frame.style.setProperty('--scene-x',`${shot.x}%`);
      frame.style.setProperty('--scene-y',`${shot.y}%`);
      frame.style.setProperty('--scene-scale',String(shot.scale));
      if(changed) img.src=src;
    }
    const description=D.sceneDescriptions&&D.sceneDescriptions[key]||state.sceneAlt;
    img.alt=`${description} · ${index+1}번째 장면`;
    frame.setAttribute('aria-label',`${description} 크게 보기`);
    img.classList.remove('scene-recut');
    if(changed||refreshShot){
      void img.offsetWidth;
      img.classList.add('scene-recut');
    }
  }
  function wireSceneZoom(sheet){
    const sceneFrame=sheet.querySelector('.event-scene-frame');
    if(!sceneFrame) return;
    const image=sceneFrame.querySelector('.event-scene');
    const syncRatio=()=>{
      if(!image||!image.naturalWidth||!image.naturalHeight) return;
      const ratio=image.naturalWidth/image.naturalHeight;
      sceneFrame.style.setProperty('--scene-ratio',String(ratio));
      sceneFrame.dataset.sceneOrientation=ratio<.9?'portrait':'landscape';
    };
    if(image){
      image.onload=syncRatio;
      if(image.complete) syncRatio();
    }
    sceneFrame.onclick=()=>sceneFrame.classList.toggle('zoomed');
  }
  function clearStoryAuto(){
    if(storyAutoTimer){ clearTimeout(storyAutoTimer); storyAutoTimer=0; }
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
    if(reader&&latest&&reader.scrollHeight>reader.clientHeight+1){
      reader.scrollTo({top:reader.scrollHeight,behavior:'auto'});
    }else if(scroll&&reader&&latest){
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
    const scroll=$('#ev-sheet .event-scroll');
    if(!scroll) return;
    const reviewPosition=()=>{
      const gap=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight;
      state.reviewing=gap>72;
    };
    scroll.onpointerdown=()=>{
      state.userHoldingStory=true;
      clearStoryAuto();
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
  }
  function wireEventChoicePages(dock){
    const pager=dock&&dock.querySelector('[data-choice-pages]');
    const buttons=dock?[...dock.querySelectorAll('.choices>.choice[data-i]')]:[];
    if(!pager) return;
    const sheet=$('#ev-sheet');
    const pageSize=(sheet&&((sheet.clientWidth||innerWidth)<350||(sheet.clientHeight||innerHeight)<650))?2:3;
    const total=Math.ceil(buttons.length/pageSize);
    if(total<=1){ pager.hidden=true; return; }
    pager.hidden=false;
    let page=0;
    const label=pager.querySelector('[data-choice-page]');
    const totalLabel=pager.querySelector('[data-choice-total]');
    const prev=pager.querySelector('[data-choice-prev]');
    const next=pager.querySelector('[data-choice-next]');
    const sync=(focus=false)=>{
      buttons.forEach((button,index)=>{ button.hidden=Math.floor(index/pageSize)!==page; });
      if(label) label.textContent=String(page+1);
      if(totalLabel) totalLabel.textContent=String(total);
      prev.disabled=page===0;
      next.disabled=page>=total-1;
      pager.setAttribute('aria-label',`선택지 ${page+1} / ${total} 페이지`);
      if(focus) buttons.find(button=>!button.hidden&&!button.disabled)?.focus({preventScroll:true});
    };
    prev.onclick=()=>{ if(page>0){ page--;sync(true); } };
    next.onclick=()=>{ if(page<total-1){ page++;sync(true); } };
    sync();
  }
  function renderStoryState(){
    const state=curStory, sheet=$('#ev-sheet');
    if(!state||!sheet) return;
    clearStoryAuto();
    const reader=sheet.querySelector('.story-reader');
    const dock=sheet.querySelector('.event-choice-dock');
    const turn=state.turns[Math.min(state.index,state.turns.length-1)];
    const transcript=reader.querySelector('.story-transcript');
    if(transcript&&transcript.children.length===state.index){
      transcript.querySelectorAll('.chat-newest,.narration-newest').forEach(entry=>{
        entry.classList.remove('chat-newest','narration-newest');
      });
      transcript.insertAdjacentHTML('beforeend',storyEntryHtml(turn,true,state.lanes));
    }else{
      reader.innerHTML=storyReaderHtml(state.turns,state.index,{lanes:state.lanes});
    }
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
    const dockHeight=dock ? Math.min(224,Math.max(170,dock.offsetHeight||194)) : 194;
    const compact=state.turns.length<=16 && (reader.scrollHeight + dockHeight) < (sheet.clientHeight||420);
    sheet.classList.toggle('story-compact',compact);
    const entering=reader.querySelector('[data-story-entry]:last-child');
    if(entering){
      entering.classList.add('turn-enter');
      requestAnimationFrame(()=>entering.classList.remove('turn-enter'));
    }
    const last=state.index>=state.turns.length-1;
    sheet.dataset.storyPhase=state.phase;
    sheet.dataset.storyStep=state.phase==='outcome'?'result':last?'decision':'beat';
    sheet.dataset.storyTurn=turn&&turn.kind||'narration';
    const portraitSpeaker=turn&&speakerInfo(turn.who,turn.name);
    sheet.dataset.storyPortrait=portraitSpeaker&&portraitSpeaker.portrait&&!['narration','ai','radio'].includes(turn.kind)?'1':'0';
    const progress=sheet.querySelector('[data-event-progress]');
    if(progress) progress.textContent=state.phase==='outcome'
      ? `결과 · ${state.index+1} / ${state.turns.length}`
      : `${state.index+1} / ${state.turns.length}`;
    if(!last){
      const next=state.turns[state.index+1];
      dock.classList.add('story-progress-dock');
      dock.innerHTML=`<button class="choice story-next" type="button"><strong>계속</strong></button>`;
      dock.querySelector('.story-next').onclick=()=>advanceStory(state);
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
    sheet.classList.remove('combat-details-open');
    sheet.dataset.eventKind=evd.combat?'combat':'story';
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
    const presentId=evd.needsComp||(Array.isArray(evd.needBond)?evd.needBond[0]:null);
    if(presentId&&G.hasComp(presentId)&&G.crewLocation){
      const companion=D.comps[presentId];
      context='<div class="story-context crew-presence"><b>'+esc(companion.name)+' · '+esc(G.crewLocation(presentId))+'</b>이 장면에서 동료가 어디에 있는지 기록됩니다.</div>'+context;
    }
    /* 긴 사건도 모바일에서는 현재 문맥에 집중한다. 이전 턴은 DOM에 남겨
       진행 상태와 접근성을 보존하되 compact 스타일로 화면에서는 접는다. */
    sheet.classList.toggle('story-compact',turns.length>2);
    const choicePages=Math.ceil(choices.count/3);
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="${esc(sceneAlt)} 사건 내용">${scene}<section class="event-field-report"><div class="event-head"><div>
      <span class="sr-only" data-event-progress>1 / ${turns.length}</span><h2>${esc(evd.title)}</h2></div></div>${context}${combatHudHtml(evd,{combatChoices:choices.combatChoices})}<div class="story-reader"></div></section></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    const lanes=dialogueLaneMap(turns);
    curStory={
      phase:'event',eventId:evd.id,label:evd.type==='대화'?'대화':'이야기',turns,index:0,
      knownSpeaker:!!turns.knownSpeaker,
      lanes,
      sceneKeys,sceneAlt,sceneStart:0,
      finalDock:`<div class="choices" role="group" aria-label="선택지 목록">${choices.html}</div>
        ${choices.count>2?`<div class="event-choice-pages" data-choice-pages role="group" aria-label="선택지 1 / ${choicePages} 페이지"><button type="button" data-choice-prev>이전</button><span><b data-choice-page>1</b> / <b data-choice-total>${choicePages}</b></span><button type="button" data-choice-next>다음</button></div>`:''}
        ${evd.combat?`<button class="event-detail-toggle" type="button" data-event-detail aria-expanded="false">상세 정보</button>`:''}`,
      wireFinal:(dock)=>{
        dock.querySelectorAll('.choice[data-i]').forEach(b=>b.onclick=()=>{
          if(b.hasAttribute('disabled')) return;
          const choice=evd.choices[+b.dataset.i];
          SND.combat(choice.sfx||'select');
          resolveChoice(choice);
        });
        wireEventChoicePages(dock);
        const detail=dock.querySelector('[data-event-detail]');
        if(detail) detail.onclick=()=>{
          const open=sheet.classList.toggle('combat-details-open');
          detail.setAttribute('aria-expanded',String(open));
          detail.textContent=open?'상세 닫기':'상세 정보';
        };
      }
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
    sheet.classList.remove('combat-details-open');
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
      ? '<span class="event-result-kicker">확인된 결과</span><div class="fx-line">'+chips.map(c=>`<span class="fx ${c.c}">${c.t}</span>`).join('')+'</div>'
      : '';
    const selectedTitle=stripTags(choice.label||curEv.title||'선택의 결과').trim()||'선택의 결과';
    const reportTitle=stripTags(curEv.title||'선택의 결과').trim()||'선택의 결과';
    const visibleReportTitle=curEv&&curEv.combat?selectedTitle:reportTitle;
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
      <section class="event-field-report" aria-label="${esc(reportTitle)} · 선택 ${esc(selectedTitle)}"><div class="event-head"><div><span class="sr-only" data-event-progress>결과 · ${turns.length} / ${turns.length}</span><h2>${esc(visibleReportTitle)}</h2></div></div>
      ${combatHud}<div class="story-reader"></div></section><div class="story-result event-result-receipt" role="status" aria-live="polite" aria-atomic="true"></div></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    const lanes=dialogueLaneMap(turns,curStory&&curStory.lanes);
    curStory={
      phase:'outcome',eventId:curEv.id,label:'결과',turns,index:Math.max(0,turns.length-1),
      knownSpeaker:!!turns.knownSpeaker,
      lanes,
      sceneKeys:outcomeSceneKeys,sceneAlt,sceneStart,sceneCarry,
      finalDock:`<div class="choices" role="group" aria-label="다음 행동">${actions}</div>`,
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
    $('#ev-sheet').classList.remove('combat-details-open');
    delete $('#ev-sheet').dataset.storyPhase;
    delete $('#ev-sheet').dataset.storyStep;
    delete $('#ev-sheet').dataset.eventKind;
    $('#cheollian-tint').classList.remove('on');
    curEv=null;
    curStory=null;
    if(S.driving) SND.setDriving(true);
    AMBI.restore();
    if(S&&S.stopover&&!S._chain) S.stopover=null;
    renderAll(); G.save();
    /* 연쇄 이벤트 (시네마틱 시퀀스) */
    if(S && S._chain){ const cid=S._chain; S._chain=null; setTimeout(()=>G.openEventById(cid), 450); return; }
    /* storyQueue는 다음 도로 사건 기회에 fireDriveEvent2가 소비한다.
       모달을 닫자마자 다음 모달을 여는 연쇄는 명시적 _chain만 허용한다. */
    /* 서울 진입 후엔 오르막 맵으로 복귀 */
    if(S && S.flags && S.flags.seoul_open && !S.ended){ setTimeout(showSeoul, 300); }
  }
  function showSeoul(){
    const stops=D.seoulMap.stops, stage=G.seoulStage();
    const transfer=G.transferStatus();
    const done=stage>=stops.length;
    const route=S.routePlan&&D.routePlans&&D.routePlans[S.routePlan.id];
    const build=G.vanBuildProfile();
    const companionStories=(S.party||[]).filter(id=>D.comps[id]&&(S.comps[id]||{}).lvl>=3).length;
    const settlementChanges=Object.keys(D.stls||{}).reduce((count,id)=>count+(G.stlImpact(id).count||0),0);
    const rememberedChoices=(S.memories&&S.memories.history||[]).length;
    const journeyLoad=stage===0?`<section class="seoul-journey-load" aria-label="서울에 가져온 여정">
      <small>WHAT YOU BROUGHT</small><b>서울에 가져온 것</b>
      <div><span>길</span><strong>${esc(route?route.name:'스스로 고른 길')}</strong></div>
      <div><span>달구지</span><strong>${esc(build.name)} · 개조 ${build.installed}개</strong></div>
      <div><span>사람</span><strong>동료 서사 ${companionStories}개 · 현장 변화 ${settlementChanges}곳</strong></div>
      <div><span>기억</span><strong>되돌아올 선택 ${rememberedChoices}개</strong></div>
    </section>`:'';
    let h='<div id="seoul-tower">▲ 남산 코어</div><div class="seoul-asc"><div class="seoul-road"></div>';
    stops.forEach((st,i)=>{
      const cls = G.seoulStopDone(i)?'done' : i===stage?'here' : i>stage?'locked':'';
      h+=`<div class="seoul-stop ${cls}"><div class="dot"></div><div class="txt"><b>${st.name}${G.seoulStopDone(i)?' ✓':''}</b><small>${i<=stage||G.seoulStopDone(i)?st.desc:'???'}</small></div></div>`;
    });
    h+=`</div><div class="sub" style="text-align:center;margin:8px 0;color:${transfer.onTime?'var(--amber)':'var(--danger)'}"><b>${esc(transfer.mission)}</b><br><small>서울 도착이 아니라 남산의 이송 중단까지가 1화의 시한</small></div>${journeyLoad}<div class="seoul-cta">`;
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
    stlMode='hub', stlFocus='market', stlFieldFocus='', marketSelection=null,
    garageSelection='', peopleSelection='';
  function settlementScene(stlId,mode='section'){
    const sid=stlId==='miryang'&&mode==='hub'?'miryang-market-hub':D.nodeScenes&&D.nodeScenes[stlId];
    return sid&&D.scenes&&D.scenes[sid]?D.scenes[sid]:'';
  }
  function settlementLayout(stlId){
    const layout=D.settlementLayouts&&D.settlementLayouts[stlId];
    return layout||{eyebrow:'SETTLEMENT WALK',entry:{x:50,y:88},facilities:{
      market:{x:24,y:35},garage:{x:76,y:40},people:{x:72,y:72},alley:{x:28,y:70}}};
  }
  function settlementSpots(stlId){
    const base={
      market:{label:stlId==='muju'?'교환소':stlId==='daejeon'?'보급소':'장터',
        sub:'의뢰와 물자를 살핀다',icon:'food'},
      garage:{label:'정비소',sub:'달구지를 고치고 넓힌다',icon:'parts'},
      people:{label:stlId==='daejeon'?'사람들':'모닥불',
        sub:'얼굴을 보고 이야기를 나눈다',icon:'bond'}
    };
    const field=D.stls[stlId]&&D.stls[stlId].field;
    if(field) base.alley={label:field.spotLabel||'현장 안쪽',sub:field.spotSub||'동료와 직접 둘러본다',icon:'quest'};
    const authored=settlementLayout(stlId).facilities||{};
    return Object.fromEntries(Object.entries(base).map(([id,spot])=>{
      const local=authored[id]||{};
      return [id,{...spot,...local,label:local.label||spot.label,sub:local.short||local.sub||spot.sub}];
    }));
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
    const title=hub.querySelector('[data-stl-walk-title]');
    const line=hub.querySelector('[data-stl-walk-line]');
    if(title) title.textContent=copy.title;
    if(line) line.textContent=copy.line;
    const place=hub.querySelector('[data-stl-focus-place]');
    if(place) place.textContent=focus.label;
    const detail=hub.querySelector('[data-stl-focus-detail]');
    if(detail) detail.textContent=focus.sub;
    const enter=hub.querySelector('#stl-enter');
    if(enter){ enter.disabled=true; enter.innerHTML=`<span>${focus.label}(으)로 걷는 중</span><small>도착하면 들어갈 수 있다</small>`; }
    SCENE.walkSettlement(next,false);
  }
  function leaveSettlement(){
    SCENE.closeSettlement();
    closeOvl('#ovl-stl');
    renderAll();
  }
  function settlementHeader(section){
    const stl=D.stls[curStl];
    $('#ovl-stl').classList.toggle('section-mode',!!section);
    $('#stl-name').innerHTML=`${section?`<button class="stl-back" id="stl-back" aria-label="${esc(stl.name)} 공간으로 돌아가기">‹</button>`:''}
      <span>${esc(stl.name)}</span>
      <button class="x" id="stl-leave" aria-label="${esc(stl.name)} 닫기">✕</button>`;
    $('#stl-desc').textContent=section||stl.desc;
    $('#stl-leave').onclick=leaveSettlement;
    const back=$('#stl-back');
    if(back) back.onclick=()=>showStl(curStl,'hub');
  }
  function renderSettlementHub(){
    const stl=D.stls[curStl],body=$('#stl-body'),layout=settlementLayout(curStl),spots=settlementSpots(curStl),night=G.isNight();
    const impact=settlementImpactCopy(curStl).impact;
    AMBI.settlement(night?'people':'hub',curStl);
    if(!spots[stlFocus]) stlFocus='market';
    if(night&&stlFocus!=='people') stlFocus='people';
    const focus=spots[stlFocus],walkCopy=settlementWalkCopy(stlFocus);
    settlementHeader('');$('#ovl-stl').classList.add('hub-mode');
    const recruitId=stl.recruit,recruitDef=recruitId&&D.recruitQuests&&D.recruitQuests[recruitId];
    const recruitEvent=recruitDef&&D.events.find(event=>event.id===recruitDef.meet);
    const recruitOpen=!!(recruitId&&!G.hasComp(recruitId)&&!S.recruitQ&&recruitEvent&&!S.used.includes(recruitEvent.id));
    const recruitPos=layout.recruit||{x:50,y:52,label:'할 말이 있는 사람'};
    body.innerHTML=`<div class="stl-hub stl-hub-v2 stl-hub-${curStl}" data-focus="${stlFocus}" data-impact-stage="${impact.stage}">
      <section class="stl-town-stage" aria-label="${esc(stl.name)}에서 걸어갈 곳">
        <canvas id="stl-town-canvas" tabindex="0" aria-label="${esc(stl.name)} 내부. 화면을 눌러 걷고 사람을 눌러 대화한다"></canvas>
        <header class="stl-town-stage-head"><span><small>${esc(layout.eyebrow||'SETTLEMENT WALK')}</small><b>${esc(stl.name)}</b></span>
          <em>CODE WORLD · ${impact.count?`변화 ${impact.count}/${impact.total}`:'첫 방문'}</em></header>
        <p class="stl-town-stage-desc">${night?'불 꺼진 시설 사이로 모닥불과 사람의 움직임만 남아 있다.':'화면을 눌러 직접 걷고, 사람을 누르면 다가가 말을 건다.'}</p>
        <div class="stl-town-focus-plate"><small>현재 목적지</small><b data-stl-focus-place>${esc(focus.label)}</b><span data-stl-focus-detail>${esc(focus.sub)}</span></div>
      </section>
      <div class="stl-hub-dock">
        <div class="stl-resource-strip" aria-label="현재 자원">
          <span>${ICO('fuel')}<b>${Math.floor(S.fuel)}</b><small>연료</small></span><span>${ICO('water')}<b>${Math.floor(S.water)}</b><small>물</small></span>
          <span>${ICO('food')}<b>${Math.floor(S.food)}</b><small>식량</small></span><span>${ICO('scrap')}<b>${S.scrap}</b><small>고철</small></span>
          <span>${ICO('parts')}<b>${S.items['부품']||0}</b><small>부품</small></span>
        </div>
        <nav class="stl-world-nav" aria-label="장소 빠른 이동">
          ${Object.entries(spots).map(([id,spot],index)=>{const closed=night&&id!=='people';return `<button class="stl-hotspot ${stlFocus===id?'selected':''}" data-stlfocus="${id}" aria-pressed="${stlFocus===id}" ${closed?'disabled':''}>
            <span class="stl-nav-slot">${String(index+1).padStart(2,'0')}</span>
            <span class="stl-nav-icon" aria-hidden="true">${ICO(spot.icon)}</span>
            <span class="stl-nav-copy"><b>${esc(spot.label)}</b><small>${closed?'오늘은 닫힘':esc(spot.sub)}</small></span>
            <i class="stl-nav-led" aria-hidden="true"></i>
          </button>`;}).join('')}
        </nav>
        <div class="stl-focus-copy"><span><b data-stl-walk-title>${esc(walkCopy.title)}</b><small data-stl-walk-line>${esc(night?'오늘은 쉬고 아침에 움직이자.':walkCopy.line)}</small></span></div>
        <button class="stl-enter" id="stl-enter" disabled><span>${esc(focus.label)}(으)로 걷는 중</span><small>도착하면 들어갈 수 있다</small></button>
        <button class="stl-return" id="stl-out">${ICO('van')}<span>달구지로 돌아간다</span></button>
      </div></div>`;
    body.querySelectorAll('[data-stlfocus]').forEach(button=>button.onclick=()=>updateSettlementFocus(button.dataset.stlfocus));
    $('#stl-enter').onclick=()=>showStl(curStl,stlFocus);$('#stl-out').onclick=leaveSettlement;
    const arrive=id=>{if(id!==stlFocus)return;const place=spots[id],enter=$('#stl-enter');if(!enter)return;enter.disabled=false;enter.innerHTML=`<span>${place.label}${place.label==='사람들'?'을':'로'} 들어간다</span><small>${place.sub}</small>`;};
    SCENE.initSettlement($('#stl-town-canvas'),{
      id:curStl,layout,spots,focus:stlFocus,impact,playerName:G.myName(),
      npcs:(stl.npcs||[]).map(id=>({id,...D.npcs[id]})),
      recruit:recruitOpen?{id:recruitId,name:recruitDef.name,label:recruitPos.label}:null,
      party:(S.party||[]).filter(id=>D.comps[id]).map(id=>({id,...D.comps[id]})),
      onFocus:updateSettlementFocus,onArrive:arrive,
      onSelectPerson:person=>{const place=$('[data-stl-focus-place]'),detail=$('[data-stl-focus-detail]');if(place)place.textContent=person.label;if(detail)detail.textContent=person.role||'말을 걸러 다가가는 중';},
      onNpc:id=>{showStl(curStl,'people');requestAnimationFrame(()=>talk(id));},onRecruit:id=>recruitStl(id),onComp:id=>showComp(id),
      onGround:()=>{const place=$('[data-stl-focus-place]'),detail=$('[data-stl-focus-detail]');if(place)place.textContent='도시 안쪽';if(detail)detail.textContent='바닥을 눌러 자유롭게 걷는 중';}
    });
    if(!$('#ovl-stl').classList.contains('on'))openModal('#ovl-stl','[data-stlfocus], #stl-town-canvas');else $('#ovl-stl').setAttribute('aria-hidden','false');
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
  /* ── SETTLEMENT FIELD BOARD ─────────────────────────────────────────
     시설 안에서 도착 사진과 카드 더미를 반복하지 않는다. 한 장의 현장 판에서
     행은 선택만 하고, 실제 거래·의뢰 수락은 아래 실행 바 한 곳에서 한다.
     장터·정비소·사람들·현장 통로가 같은 셸과 도시 팔레트를 공유한다. */
  /* 판 머리 앞머리표. 내부 모드명을 그대로 노출하지 않는다(영문 개발 라벨 금지). */
  const FIELD_BOARD_LABEL={market:'장터',garage:'정비소',people:'사람들',alley:'현장 통로'};
  function settlementFieldPalette(stlId){
    const p=D.settlementWorlds&&D.settlementWorlds[stlId]&&D.settlementWorlds[stlId].palette||{};
    return {
      wall:p.wall||'#4d5557',trim:p.accent||'#a94e41',win:p.light||'#e9b24e',dark:p.roof||'#12161a',
      roof:p.roof||'#34383a',light:p.light||'#e5a54c',accent:p.accent||'#b94c3e'
    };
  }
  function fieldBoardShell({mode,title,sub,status,body,selectedLabel,actionMeta,actionLabel,actionAttrs='',disabled=false}){
    const palette=settlementFieldPalette(curStl), stl=D.stls[curStl];
    return `<section class="field-board field-board-${mode} field-board-visual-finish" data-field-board="${mode}" data-field-board-city="${curStl}" style="--fb-wall:${palette.wall};--fb-trim:${palette.trim};--fb-win:${palette.win};--fb-dark:${palette.dark};--roof:${palette.roof};--light:${palette.light};--accent:${palette.accent}">
      <header class="field-board-head">
        <span class="field-board-mark">${esc((stl&&stl.name)||'')} · ${esc(FIELD_BOARD_LABEL[mode]||'')}</span>
        <div><span><i aria-hidden="true"></i><h3>${esc(title)}</h3></span><em>${esc(status)}</em></div>
        <p>${esc(sub)}</p>
      </header>
      <div class="field-board-body">${body}</div>
      <footer class="field-board-action">
        <span><small>선택</small><b>${esc(selectedLabel||'선택 없음')}</b><em>${esc(actionMeta||'고를 수 있는 항목이 없다')}</em></span>
        <button id="${mode}-action" ${actionAttrs} ${disabled?'disabled':''}>${esc(actionLabel||'선택')}</button>
      </footer>
    </section>
    <button class="stl-section-back field-board-back" id="stl-hub-back">← ${esc(stl.name)}으로 돌아간다</button>`;
  }
  function marketFieldRows(){
    const stl=D.stls[curStl], localImpact=G.stlImpact(curStl), disc=G.tradeDiscount(curStl);
    const questRows=[];
    if(S.quest){
      const q=S.quest,K=G.QKIND[q.kind]||G.QKIND.deliver,ready=G.questReady();
      const detail=q.kind==='procure'
        ? `${q.need.name} ${(S.items[q.need.name]||0)}/${q.need.qty} · ${D.nodes[q.to].name}으로 돌아온다`
        : `${G.questLabel(q)} · ${D.nodes[q.to].name}까지`;
      questRows.push({key:'quest-active',kind:ready?'quest-turnin':'quest-active',label:`${K.nm} · ${G.questLabel(q)}`,
        sub:ready?'요청한 물건과 기록을 넘길 준비가 됐다':detail,
        meta:`D-${Math.max(0,q.due-S.day)} · 고철 ${q.reward}`,action:ready?'전달한다':'진행 중',enabled:ready});
    } else {
      stlQuests=G.rollQuests();
      stlQuests.forEach((q,index)=>{const K=G.QKIND[q.kind],dd=q.due-S.day;
        questRows.push({key:`quest-${index}`,kind:'quest',index,label:`${K.nm} · ${G.questLabel(q)}`,
          sub:G.questDesc(q).replace(/^\"|\"$/g,''),meta:`D-${dd} · 고철 ${q.reward}`,action:'맡는다',enabled:true});
      });
    }
    const supplyRows=[];
    const waterRow=stl.trade.find(row=>row[1]==='water'), foodRow=stl.trade.find(row=>row[1]==='food');
    if(waterRow&&foodRow){
      const price=Math.max(1,Math.round((waterRow[3]*G.marketMul(curStl,'water')+foodRow[3]*2*G.marketMul(curStl,'food'))*disc));
      supplyRows.push({key:'bundle',kind:'bundle',label:'길 위 기본 보급',
        sub:`물 ${waterRow[2]}통 + 식량 ${foodRow[2]*2}일치`,meta:`고철 ${price} · 40분`,cost:price,
        action:'한 번에 싣기',enabled:S.scrap>=price,icon:'parts'});
    }
    stl.trade.forEach((row,index)=>{
      const [label,key,qty,price0]=row, trusted=localImpact.discount<1;
      const shown=trusted&&key==='barter_wf'?'물 1통 ⇄ 식량 1':
        trusted&&key==='barter_fp'?'식량 1 ⇄ 부품 1':trusted&&key==='barter_mf'?'의약품 1 ⇄ 식량 4':label;
      const group=key.startsWith('barter')?'물물교환':key.startsWith('item')?'도구와 부품':'주행과 보급';
      if(key.startsWith('barter')){
        const enough=key==='barter_wf'?S.water>=(trusted?1:2):key==='barter_fp'?S.food>=(trusted?1:2):(S.items['의약품']||0)>=1;
        supplyRows.push({key:`trade-${index}`,kind:'trade',index,group,label:shown,sub:'물자를 맞바꾼다',meta:'교환 · 25분',
          action:'교환한다',enabled:enough,icon:key==='barter_wf'?'water':key==='barter_fp'?'food':'med'});
      } else {
        const price=Math.max(1,Math.round(price0*G.marketMul(curStl,key)*disc)),mul=G.marketMul(curStl,key);
        const priceNote=mul<=.9?' · 이 동네가 싸다':mul>=1.2?' · 여긴 귀하다':'';
        supplyRows.push({key:`trade-${index}`,kind:'trade',index,group,label,sub:`${qty}${key==='fuel'?'L':key==='water'?'통':key==='food'?'일치':'개'}를 싣는다${priceNote}`,
          meta:`고철 ${price} · 25분`,cost:price,action:'산다',enabled:S.scrap>=price,
          icon:key==='fuel'?'fuel':key==='water'?'water':key==='food'?'food':ITEM_ICO[key.slice(4)]||'parts'});
      }
    });
    const demand=G.stlDemand(curStl);
    if(demand){
      const have=demand.item==='식량'?S.food:(S.items[demand.item]||0),need=demand.item==='식량'?2:1;
      supplyRows.push({key:'sell',kind:'sell',group:'매입',label:`${demand.item} 1${demand.item==='식량'?'일치':''}`,
        sub:demand.why,meta:`고철 +${demand.price} · 20분`,action:'판다',enabled:have>=need,icon:ITEM_ICO[demand.item]||'food'});
    }
    const neighbor=(G.neighbors(S.at)||[]).map(n=>D.nodes[n.id]&&D.nodes[n.id].stl).filter(Boolean)
      .concat(Object.keys(D.stls).filter(id=>id!==curStl)).find(id=>id&&id!==curStl&&D.market[id]);
    let rumor='';
    if(neighbor){
      const market=D.market[neighbor], dear=Object.entries(market.mul||{}).find(([,value])=>value>=1.2), next=market.demand;
      if(dear||next) rumor=`장사꾼들 말로는 ${D.stls[neighbor].name}은 ${dear?dear[0]+'이 귀하고 ':''}${next?next.item+'을 웃돈 주고 산다':''}`;
    }
    return {questRows,supplyRows,rumor,localImpact};
  }
  function fieldBoardRow(row){
    const selected=marketSelection&&marketSelection.key===row.key;
    return `<button class="field-board-row ${selected?'selected':''}" data-market-key="${row.key}" aria-pressed="${selected}" ${row.enabled?'':'data-unavailable="true"'}>
      <span class="field-board-row-icon" aria-hidden="true">${ICO(row.icon||'parts')}</span>
      <span class="field-board-row-copy"><b>${esc(row.label)}</b><small>${esc(row.sub)}</small></span>
      <span class="field-board-row-meta">${esc(row.meta)}</span>
    </button>`;
  }
  function fieldBoardNote(row){
    const selected=marketSelection&&marketSelection.key===row.key;
    return `<button class="field-board-note ${selected?'selected':''}" data-market-key="${row.key}" aria-pressed="${selected}" ${row.enabled?'':'data-unavailable="true"'}>
      <div><b>${esc(row.label)}</b><span class="field-board-row-meta">${esc(row.meta)}</span></div>
      <small>${esc(row.sub)}</small>
    </button>`;
  }
  function renderMarketFieldBoard(){
    const body=$('#stl-body'), stl=D.stls[curStl], spot=settlementSpots(curStl).market;
    if(!body||!stl) return;
    const data=marketFieldRows(), rows=[...data.questRows,...data.supplyRows];
    let selected=rows.find(row=>marketSelection&&row.key===marketSelection.key);
    if(!selected) selected=data.supplyRows.find(row=>row.enabled)||data.questRows.find(row=>row.enabled)||rows[0];
    marketSelection=selected||null;
    const questCount=data.questRows.length, barterOnly=stl.trade.every(row=>row[1].startsWith('barter'));
    const trust=data.localImpact.discount<1
      ? ` · 품앗이 ${barterOnly?'교환 우대':'10% 할인'}`:'';
    const selectedAfter=selected&&selected.cost!=null?Math.max(0,S.scrap-selected.cost):S.scrap;
    const actionMeta=selected
      ? selected.kind==='sell'?`${selected.meta} · 보유 고철 ${S.scrap}`:
        selected.cost!=null?`${selected.meta} · 보유 ${S.scrap} → ${selectedAfter}`:selected.meta
      :'고를 수 있는 항목이 없다';
    const actionData=selected?(selected.kind==='trade'?` data-t="${selected.index}"`:selected.kind==='bundle'?' data-bundle="1"':selected.kind==='sell'?' data-sell="1"':selected.kind==='quest' ? ` data-quest="${selected.index}"`:selected.kind==='quest-turnin'?' id="q-turnin"':''):'';
    let lastGroup='';
    const supplyHtml=data.supplyRows.map(row=>{
      const group=row.group||'추천 보급', heading=group!==lastGroup?`<div class="field-board-subgroup">${esc(group)}</div>`:'';
      lastGroup=group; return heading+fieldBoardRow(row);
    }).join('');
    const boardBody=`
        <section class="field-board-group" aria-labelledby="market-quest-head">
          <header id="market-quest-head"><span>의뢰</span><b>${questCount}건</b></header>
          <div class="field-board-list">${data.questRows.length?data.questRows.map(fieldBoardNote).join(''):'<p class="field-board-empty">오늘 붙은 의뢰는 없다.</p>'}</div>
        </section>
        <section class="field-board-group" id="trade" aria-labelledby="market-supply-head">
          <header id="market-supply-head"><span>물자</span><b>보유 고철 <i id="tr-scrap">${S.scrap}</i></b></header>
          ${data.localImpact.discount<1?`<div class="trade-local-trust"><span>품앗이</span><b>현장 ${data.localImpact.count}곳을 거든 사람 · ${barterOnly?'교환품을 한 단계 후하게 쳐준다':'10% 덜 받는다'}</b></div>`:''}
          <div class="field-board-list">${supplyHtml}</div>
          ${data.rumor?`<p class="trade-rumor field-board-rumor">${esc(data.rumor)}</p>`:''}
        </section>`;
    body.innerHTML=fieldBoardShell({mode:'market',title:spot.label,sub:spot.sub,
      status:`● 영업 중 · 의뢰 ${questCount}${trust}`,body:boardBody,
      selectedLabel:selected&&selected.label,actionMeta,actionLabel:selected&&selected.action,
      actionAttrs:actionData,disabled:!(selected&&selected.enabled)});
    body.querySelectorAll('[data-market-key]').forEach(button=>button.onclick=()=>{
      const scrollTop=body.querySelector('.field-board-body')?.scrollTop||0;
      marketSelection=rows.find(row=>row.key===button.dataset.marketKey)||null;
      renderMarketFieldBoard();
      const nextBody=body.querySelector('.field-board-body'); if(nextBody) nextBody.scrollTop=scrollTop;
      requestAnimationFrame(()=>$('#market-action')?.focus({preventScroll:true}));
    });
    const action=$('#market-action');
    if(action) action.onclick=()=>{
      const row=rows.find(item=>marketSelection&&item.key===marketSelection.key); if(!row||!row.enabled) return;
      if(row.kind==='quest'){ G.acceptQuest(stlQuests[row.index]); marketSelection=null; showStl(curStl,'market'); return; }
      if(row.kind==='quest-turnin'){ G.checkQuest(); marketSelection=null; showStl(curStl,'market'); return; }
      let result;
      if(row.kind==='trade') result=G.trade(curStl,row.index);
      else if(row.kind==='bundle') result=G.tradeBundle(curStl);
      else if(row.kind==='sell') result=G.sellToDemand(curStl);
      if(!result||!result.ok){ toast(result&&result.why||'지금은 할 수 없다'); return; }
      if(row.kind==='bundle') toast(`📦 기본 보급을 실었다 · 물 +${result.water} · 식량 +${result.food}`);
      else if(row.kind==='sell') toast(`${ICO('scrap')} 고철 +${result.price} — 팔았다`);
      else toast(`${row.label} · 거래를 마쳤다`);
      renderHud(); showStl(curStl,'market');
    };
    $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
  }
  function renderPeopleFieldBoard(){
    const body=$('#stl-body'),stl=D.stls[curStl],spot=settlementSpots(curStl).people;
    if(!body||!stl) return;
    const rows=(stl.npcs||[]).map(id=>{const npc=D.npcs[id],state=S.npcs[id];
      return {key:`npc-${id}`,kind:'npc',id,label:npc.name,sub:npc.role,
        meta:state.att>10?'우호적':state.att<-10?'냉랭함':state.met?'아는 사이':'초면',action:'말을 건다',enabled:true};
    });
    const recruitDef=stl.recruit&&D.recruitQuests&&D.recruitQuests[stl.recruit];
    const recruitOpen=!!(stl.recruit&&recruitDef&&recruitDef.meet&&!G.hasComp(stl.recruit)&&!S.recruitQ&&!S.used.includes(recruitDef.meet));
    if(recruitOpen){const comp=D.comps[stl.recruit];rows.push({key:`recruit-${stl.recruit}`,kind:'recruit',id:stl.recruit,
      label:comp.name,sub:comp.bio,meta:'처음 보는 사람',action:'다가가 말을 건다',enabled:true});}
    rows.push({key:'rest',kind:'rest',label:'이곳에서 하룻밤 묵는다',sub:'아침까지 쉬며 피로와 사기를 회복하고 차를 살핀다',
      meta:'아침까지 · 하루 1회',action:'밤을 보낸다',enabled:true});
    let selected=rows.find(row=>row.key===peopleSelection)||rows[0]; peopleSelection=selected&&selected.key||'';
    const residentRows=rows.filter(row=>row.kind!=='rest').map(row=>{
      const face=row.kind==='npc'?npcFace(row.id,D.npcs[row.id].face):npcFace(row.id,D.comps[row.id].face);
      return `<button class="field-board-row npc-row ${row.key===peopleSelection?'selected':''}" data-person-key="${row.key}" data-person-id="${row.id}" aria-pressed="${row.key===peopleSelection}">
        <span class="field-board-row-icon npc-face">${face}</span>
        <span class="field-board-row-copy"><b>${esc(row.label)}</b><small>${esc(row.sub)}</small></span>
        <span class="field-board-row-meta npc-att">${esc(row.meta)}</span>
      </button>`;
    }).join('');
    const rest=rows.find(row=>row.kind==='rest');
    const restRow=`<button class="field-board-row ${peopleSelection==='rest'?'selected':''}" data-person-key="rest" aria-pressed="${peopleSelection==='rest'}">
      <span class="field-board-row-icon">${ICO('bond')}</span><span class="field-board-row-copy"><b>${esc(rest.label)}</b><small>${esc(rest.sub)}</small></span>
      <span class="field-board-row-meta">${esc(rest.meta)}</span></button>`;
    const boardBody=`<div class="stl-talk-slot field-board-talk-slot" id="stl-talk-slot" aria-live="polite"></div>
      <section class="field-board-group"><header><span>대화 상대</span><b>${rows.filter(row=>row.kind!=='rest').length}명 · 한 사람을 고른다</b></header>
        <div class="field-board-list stl-resident-list">${residentRows}</div></section>
      <section class="field-board-group"><header><span>머물기</span><b>오늘 밤</b></header><div class="field-board-list">${restRow}</div></section>`;
    const actionAttrs=selected?(selected.kind==='npc'?`data-npc="${selected.id}"`:selected.kind==='recruit'?`data-recruit="${selected.id}"`:'data-rest="1"'):'';
    body.innerHTML=fieldBoardShell({mode:'people',title:spot.label,sub:spot.sub,
      status:`● 사람 ${rows.filter(row=>row.kind!=='rest').length} · ${G.isNight()?'밤 교대':'낮 장사'}`,body:boardBody,
      selectedLabel:selected&&selected.label,actionMeta:selected&&selected.meta,actionLabel:selected&&selected.action,
      actionAttrs,disabled:!selected});
    body.querySelectorAll('[data-person-key]').forEach(button=>button.onclick=()=>{
      const scrollTop=body.querySelector('.field-board-body')?.scrollTop||0;
      peopleSelection=button.dataset.personKey; renderPeopleFieldBoard();
      const scroller=body.querySelector('.field-board-body'); if(scroller) scroller.scrollTop=scrollTop;
      requestAnimationFrame(()=>$('#people-action')?.focus({preventScroll:true}));
    });
    const action=$('#people-action');
    if(action) action.onclick=()=>{
      const row=rows.find(item=>item.key===peopleSelection); if(!row) return;
      if(row.kind==='npc'){ talk(row.id); const scroller=body.querySelector('.field-board-body'); if(scroller) scroller.scrollTop=0; }
      else if(row.kind==='recruit') recruitStl(row.id);
      else { AMBI.play('sfx_camp_loop',.32); closeOvl('#ovl-stl'); G.camp('🏘 정착지에서 하룻밤을 묵었다'); }
    };
    $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
  }
  function renderAlleyFieldBoard(){
    const body=$('#stl-body'),stl=D.stls[curStl],field=stl&&stl.field,spot=settlementSpots(curStl).alley;
    if(!body||!field||!spot) return;
    const actions=field.actions.filter(action=>!G.stlFieldStatus(curStl,action).hiddenLocked);
    const done=actions.filter(action=>G.stlFieldStatus(curStl,action).done).length;
    if(!actions.some(action=>action.id===stlFieldFocus)) stlFieldFocus=actions[0]&&actions[0].id||'';
    const selected=actions.find(action=>action.id===stlFieldFocus)||actions[0],selectedStatus=selected&&G.stlFieldStatus(curStl,selected);
    const result=stlFieldResult&&stlFieldResult.stl===curStl?stlFieldResult:null;
    const impact=settlementImpactCopy(curStl).impact,comp=settlementCompanion();
    const resultHtml=result?(()=>{const person=speakerInfo(result.action.npc);
      return `<section class="field-board-result" data-field-result><header><span>방금 확인한 것</span><b>${esc(person.name)} · ${esc(result.action.label)}</b></header>
        <div>${settlementPortrait(person.id,'stl-field-face',`${person.name} 초상`)}<span><p>${esc(result.action.result)}</p>
        ${result.chips&&result.chips.length?`<span class="stl-field-chips">${result.chips.map(chip=>`<i class="${chip.c||''}">${esc(chip.t)}</i>`).join('')}</span>`:''}</span></div>
        ${result.firstImpact&&result.action.change?`<p class="field-board-before-after"><span>작업 전 · ${esc(result.action.desc)}</span><b>→</b><span>지금 · ${esc(result.action.change.after)}</span></p>`:''}</section>`;
    })():'';
    const actionRows=actions.map(action=>{const status=G.stlFieldStatus(curStl,action),person=speakerInfo(action.npc),cost=G.reqCostText(action.req),cadence=action.once?'여행 중 1회':'하루 1회';
      return `<button class="field-board-row stl-field-action ${action.id===stlFieldFocus?'selected focused':''} ${status.changed?'changed':''}" data-fieldspot="${action.id}" data-fieldcard="${action.id}" aria-pressed="${action.id===stlFieldFocus}" ${status.ok?'':'data-unavailable="true"'}>
        <span class="field-board-row-icon">${settlementPortrait(person.id,'stl-field-face',`${person.name} 초상`)||ICO('quest')}</span>
        <span class="field-board-row-copy"><b>${esc(action.label)}</b><small>${esc(status.changed&&action.change?action.change.after:action.desc)}</small></span>
        <span class="field-board-row-meta">${action.time}분 · ${cadence}${cost?' · '+esc(cost):''}</span>
      </button>`;
    }).join('');
    const boardBody=`${resultHtml}<section class="field-board-group"><header><span>현장 동선</span><b>${done}/${actions.length}곳 확인${comp?' · '+esc(comp.name)+' 동행':''}</b></header>
      <div class="field-board-list stl-field-switcher">${actionRows}</div></section>`;
    body.innerHTML=fieldBoardShell({mode:'alley',title:field.title||spot.label,sub:field.desc||spot.sub,
      status:`${done===actions.length?'●':'○'} 동선 ${done}/${actions.length} 확인 · 변화 ${impact.count}/${impact.total}`,body:boardBody,
      selectedLabel:selected&&selected.label,
      /* selected.action은 "경비와 한 교대 동안 …" 같은 서술문이라 좁은 버튼에서 3줄로 접힌다.
         서술은 넓은 메타 줄에 두고 버튼에는 짧은 동사만 남긴다. */
      actionMeta:selectedStatus?(selectedStatus.ok?`${esc(selected.action||'')}${selected.time?' · '+selected.time+'분':''}${G.reqCostText(selected.req)?' · '+G.reqCostText(selected.req):''}`:selectedStatus.reason):'',
      actionLabel:selectedStatus?(selectedStatus.ok?'일을 맡는다':selectedStatus.reason):'선택',
      actionAttrs:selected?`data-stlfield="${selected.id}"`:'',disabled:!(selected&&selectedStatus&&selectedStatus.ok)});
    body.querySelectorAll('[data-fieldspot]').forEach(button=>button.onclick=()=>{
      const scrollTop=body.querySelector('.field-board-body')?.scrollTop||0;
      stlFieldFocus=button.dataset.fieldspot; renderAlleyFieldBoard();
      const scroller=body.querySelector('.field-board-body'); if(scroller) scroller.scrollTop=scrollTop;
      requestAnimationFrame(()=>$('#alley-action')?.focus({preventScroll:true}));
    });
    const action=$('#alley-action');
    if(action) action.onclick=()=>{
      const result=G.doStlFieldAction(curStl,stlFieldFocus);
      if(!result.ok){ toast(result.reason||'지금은 할 수 없다'); return; }
      stlFieldResult={stl:curStl,action:result.action,chips:result.chips,
        firstImpact:result.firstImpact,impactBefore:result.impactBefore,impactAfter:result.impactAfter};
      if(result.hiddenOpen) toast(`👣 ${field.revealToast||'도움을 마치자 전에는 보이지 않던 곳이 열렸다'}`,'discover');
      renderAlleyFieldBoard(); const scroller=body.querySelector('.field-board-body'); if(scroller) scroller.scrollTop=0;
    };
    $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
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
    if(curStl!==stlId){ marketSelection=null; garageSelection=''; peopleSelection=''; stlFieldFocus=''; }
    curStl=stlId;
    stlMode=mode||'hub';
    const fieldBoardMode=['market','garage','people','alley'].includes(stlMode);
    const fieldBoardMarket=fieldBoardMode&&stlMode==='market';
    const stl=D.stls[stlId];
    G.qualityMilestone('first_settlement_visit',{settlementId:stlId,mode:stlMode});
    AMBI.settlement(stlMode,stlId);
    if(!G.isNight()) G.checkQuest();   // 배달은 사람이 깨어 있을 때만
    $('#ovl-stl').classList.toggle('field-board-mode',fieldBoardMode);
    if(stlMode==='hub'){ renderSettlementHub(); return; }
    if(G.isNight()&&stlMode!=='people'){ stlFocus='people'; renderSettlementHub(); return; }
    SCENE.closeSettlement();
    $('#ovl-stl').classList.remove('hub-mode');
    const body=$('#stl-body'), scene=settlementScene(curStl,stlMode==='alley'?'hub':'section'), spots=settlementSpots(curStl);
    settlementHeader(spots[stlMode]?spots[stlMode].label:'');
    if(fieldBoardMode){
      body.innerHTML='';
      if(stlMode==='market') renderMarketFieldBoard();
      else if(stlMode==='garage') renderGarage();
      else if(stlMode==='people') renderPeopleFieldBoard();
      else renderAlleyFieldBoard();
      if(!$('#ovl-stl').classList.contains('on')) openModal('#ovl-stl','#stl-leave, button');
      else $('#ovl-stl').setAttribute('aria-hidden','false');
      return;
    }
    const walkCopy=settlementWalkCopy(stlMode), impactCopy=settlementImpactCopy(curStl);
    const directField=curStl==='miryang'&&stlMode==='alley';
    let h=directField||fieldBoardMarket?'':`<div class="stl-section-hero stl-section-hero-${stlMode}" data-impact-stage="${impactCopy.impact.stage}" ${scene?`style="background-image:url('${scene}')"`:''}>
      ${settlementImpactLayerHtml(impactCopy)}
      <span>${ICO((spots[stlMode]||spots.market).icon)}${(spots[stlMode]||spots.market).label}</span>
      <small>${esc(walkCopy.local)}</small>
    </div>`;
    if(stlMode==='market'){
      if(fieldBoardMarket) h='';
      else {
        h+=questBoardHtml();
        h+=`<div class="dlg"><div class="say stl-kicker"><span class="spk">오늘의 거래</span>
          <small>보유 고철 <span id="tr-scrap">${S.scrap}</span></small></div><div id="trade"></div></div>`;
      }
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
      h+=`<section class="stl-people-panel"><div class="stl-talk-slot" id="stl-talk-slot" aria-live="polite"></div>
        <div class="stl-resident-head"><b>대화 상대</b><small>${stl.npcs.length}명 · 한 사람을 골라 말을 건다</small></div>
        <div class="stl-resident-list">`;
      /* .npc-row 계약: [얼굴] [이름+한 줄] [상태 라벨] 3칸 flex.
         상태 라벨은 nowrap이라 줄어들지 않으므로, 가운데 칸이 대신 줄어들어야 한다
         (.npc-row>span:not(.npc-att)의 min-width:0). 이 규칙이 빠지면 긴 소개문에서
         라벨이 본문 위로 겹쳐 글자가 깨진다 — 주민 행은 짧은 role이라 안 드러나고
         아래 합류 인물 행(bio)에서만 터진다. 새 행을 추가할 때도 이 구조를 지킬 것. */
      for(const nid of stl.npcs){
        const npc=D.npcs[nid], ns=S.npcs[nid];
        h+=`<button class="npc-row" data-npc="${nid}">
          <div class="npc-face">${npcFace(nid,npc.face)}</div>
          <span><b>${npc.name}</b><small>${npc.role}</small></span>
          <span class="npc-att">${ns.att>10?'우호적':ns.att<-10?'냉랭함':ns.met?'아는 사이':'초면'}</span></button>`;
      }
      /* 합류 과제 중인 인물은 달구지에 임시 동행 중이다. 출발지 NPC 목록에
         동시에 남겨 두면 같은 사람이 두 장소에 있는 것처럼 보인다. */
      const localRecruit=stl.recruit&&D.recruitQuests&&D.recruitQuests[stl.recruit];
      const localRecruitEvent=localRecruit&&localRecruit.meet;
      if(stl.recruit && localRecruitEvent && !G.hasComp(stl.recruit) && !S.recruitQ
        && !S.used.includes(localRecruitEvent)){
        const c=D.comps[stl.recruit];
        /* 이 목록에서 유일하게 긴 문장(c.bio)을 쓰는 행이다. 위 .npc-row 계약이
           깨지면 여기서 먼저 겹침이 보인다 — 320px에서 확인할 것. */
        h+=`<button class="npc-row" data-recruit="${stl.recruit}">
          <div class="npc-face">${npcFace(stl.recruit,c.face)}</div>
          <span><b>${c.name}</b><small>${c.bio}</small></span>
          <span class="npc-att">처음 보는 사람</span></button>`;
      }
      h+=`</div></section>`;
      h+=`<div class="acts stl-rest-actions">
        <button class="act primary" id="stl-rest"><span>${ICO('bond')}</span><span><b>이곳에서 하룻밤 묵는다</b><small>아침까지 · 피로와 사기 회복 · 차 정비</small></span></button></div>`;
    }
    if(!fieldBoardMarket) h+=`<button class="stl-section-back" id="stl-hub-back">← ${esc(stl.name)}으로 돌아간다</button>`;
    body.innerHTML=h;
    if(stlMode==='market'){
      if(fieldBoardMarket) renderMarketFieldBoard();
      else {
        renderTrade();
        body.querySelectorAll('[data-quest]').forEach(b=>b.onclick=()=>{ G.acceptQuest(stlQuests[+b.dataset.quest]); showStl(curStl,'market'); });
        const qt=body.querySelector('#q-turnin');
        if(qt) qt.onclick=()=>{ G.checkQuest(); showStl(curStl,'market'); };
      }
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
    if($('#stl-hub-back')) $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
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
      const bundlePrice=Math.max(1,Math.round((waterRow[3]*G.marketMul(curStl,'water')+foodRow[3]*2*G.marketMul(curStl,'food'))*disc));
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
        const mul=G.marketMul(curStl,key);
        const price=Math.max(1,Math.round(price0*mul*disc));
        const tag=mul<=0.9?'<em class="mk-cheap">이 동네가 싸다</em>':mul>=1.2?'<em class="mk-dear">여긴 귀하다</em>':'';
        h+=`<div class="trade-row"><span class="tn">${tico}${label}${tag}</span><span class="tp">${ICO('scrap')}고철 ${price}</span>
          <button class="tbtn" data-t="${i}" ${S.scrap<price?'disabled':''}>산다</button></div>`;
      }
    });
    /* 매입 — 이 마을이 웃돈 주고 사는 것. 싣고 온 물건이 장사가 된다 */
    const dm=G.stlDemand(curStl);
    if(dm){
      const have=dm.item==='식량'?S.food:(S.items[dm.item]||0);
      h+=`<div class="trade-group-label">매입</div>
        <div class="trade-row trade-demand"><span class="tn">${ICO(ITEM_ICO[dm.item]||'food')}${dm.item} 1 ${dm.item==='식량'?'(일치)':''}<em>${esc(dm.why)}</em></span>
        <span class="tp">${ICO('scrap')}고철 +${dm.price}</span>
        <button class="tbtn" data-sell="1" ${have<(dm.item==='식량'?2:1)?'disabled':''}>판다</button></div>`;
    }
    /* 다음 마을의 시세 소문 — 정보가 동선이 되도록, 갈 수 있는 이웃 정착지 하나만 */
    const nbStl=(G.neighbors(S.at)||[]).map(n=>D.nodes[n.id]&&D.nodes[n.id].stl).filter(Boolean)
      .concat(Object.keys(D.stls).filter(id=>id!==curStl)).find(id=>id&&id!==curStl&&D.market[id]);
    if(nbStl){
      const nm=D.market[nbStl], picks=[];
      for(const [k,v] of Object.entries(nm.mul||{})) if(v>=1.2) picks.push(k+'이 귀하고');
      const dm2=nm.demand;
      if(picks.length||dm2) h+=`<div class="trade-rumor">🧾 장사꾼들 말로는, ${D.stls[nbStl].name}은 ${picks[0]||''} ${dm2?dm2.item+'을 웃돈 주고 산다더라':''}</div>`;
    }
    tr.innerHTML=h;
    tr.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>buy(+b.dataset.t));
    const sellBtn=tr.querySelector('[data-sell]');
    if(sellBtn) sellBtn.onclick=()=>{
      const r=G.sellToDemand(curStl);
      if(!r.ok){ toast(r.why); return; }
      $('#tr-scrap').textContent=S.scrap;
      toast(`${ICO('scrap')} 고철 +${r.price} — 팔았다`);
      renderTrade(); renderHud();
    };
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
  function showCampHub(){
    if(!S||S.driving||(UI.modalOpen()&&!$('#ovl-camp').classList.contains('on'))) return;
    const plan=S._campPlan||{};
    const body=$('#camp-body'), ovl=$('#ovl-camp');
    const party=S.party||[];
    const resource=`식량 ${S.food} · 물 ${S.water} · 부품 ${S.items['부품']||0} · 고철 ${S.scrap}`;
    const planned=plan.meal||plan.repair||plan.talk;
    const keepsakes=party.map(id=>({id,...(D.companionKeepsakes&&D.companionKeepsakes[id])})).filter(row=>row.name);
    const interior=(D.upgrades||[]).filter(up=>S.up&&S.up[up.id]);
    const recent=(S.journeyRecaps||[]).slice(-3).reverse();
    body.innerHTML=`<section class="camp-home">
      <div class="camp-home-hero"><small>VAN HOME · ${G.isNight()?'밤':'해 지기 전'}</small><h3>${esc(G.vanName())} · ${S.at&&D.nodes[S.at]?D.nodes[S.at].name:'길가'}</h3><p>문을 닫고, 물건을 정리하고, 오늘을 끝낼 준비를 한다. 준비한 것은 이번 취침에만 반영된다.</p>
        <div class="camp-storage">${resource}</div></div>
      ${keepsakes.length||interior.length?`<div class="camp-home-section camp-lived-in"><b>살아온 차 안</b><small>합류한 사람과 장착한 부품이 공간에 흔적을 남긴다.</small>
        <div class="camp-keepsakes">${keepsakes.map(row=>`<article><span>${row.icon}</span><div><strong>${esc(row.name)}</strong><small>${esc(row.desc)}</small></div></article>`).join('')}</div>
        <div class="camp-interior"><span>장착된 생활 흔적</span>${interior.length?interior.map(up=>`<i>${up.ic} ${esc(up.nm)}</i>`).join(''):'<i class="empty">아직 장착한 생활 부품 없음</i>'}</div>
      </div>`:`<div class="camp-home-section camp-home-teaser"><b>아직 작은 집</b><small>첫 동료가 타거나 생활 부품을 장착하면 이곳에 그 흔적이 남는다.</small><span>빈 선반과 고정 볼트가 다음 자리를 기다린다.</span></div>`}
      ${recent.length?`<div class="camp-home-section camp-roadbook"><b>최근 주행 기록</b><small>차가 기억하는 마지막 세 구간.</small>${recent.map(row=>`<article><strong>${esc(D.nodes[row.from].name)} → ${esc(D.nodes[row.to].name)}</strong><span>DAY ${row.day} · ${row.km}km · 사건 ${row.events}건${row.checkIn?` · ${esc(row.checkIn.name)}`:''}</span></article>`).join('')}</div>`:''}
      <div class="camp-home-section"><b>오늘 밤 준비</b><small>각 준비는 밤에 한 번만 할 수 있다.</small>
        <button class="camp-prep ${plan.meal?'done':''}" data-camp-prep="meal" ${plan.meal?'disabled':''}><span>${ICO('food')} <strong>공동 식사</strong><small>식량 1 · 물 1 소비 · 취침 사기 +3</small></span><em>${plan.meal?'준비됨':'준비'}</em></button>
        <button class="camp-prep ${plan.repair?'done':''}" data-camp-prep="repair" ${plan.repair?'disabled':''}><span>${ICO('parts')} <strong>간이 정비</strong><small>부품 1 소비 · 취침 내구 +8</small></span><em>${plan.repair?'준비됨':'준비'}</em></button>
      </div>
      <div class="camp-home-section"><b>불빛 아래 한 사람</b><small>선택한 동료는 취침 후 유대 +2를 더 얻는다.</small>
        <div class="camp-talk-list">${party.length?party.map(id=>`<button class="camp-talk ${plan.talk===id?'done':''}" data-camp-talk="${id}" ${plan.talk?'disabled':''}><span>${D.comps[id].face} <strong>${esc(D.comps[id].name)}</strong></span><em>${plan.talk===id?'약속됨':'이야기'}</em></button>`).join(''):'<p class="camp-empty">오늘 밤은 혼자다. 차 안의 소리만 들린다.</p>'}</div>
      </div>
      <div class="camp-rest"><span>${planned?'준비를 마쳤다.':'준비 없이 쉬어도 된다.'}</span><button class="act" id="camp-rest">${ICO('van')}<span>이곳에서 밤 보내기</span></button></div>
    </section>`;
    ovl.classList.add('on'); ovl.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>$('#camp-x').focus({preventScroll:true}));
    $('#camp-x').onclick=()=>closeOvl('#ovl-camp');
    body.querySelectorAll('[data-camp-prep]').forEach(b=>b.onclick=()=>{
      const r=G.prepareCamp(b.dataset.campPrep); if(!r.ok) UI.toast(r.why); showCampHub();
    });
    body.querySelectorAll('[data-camp-talk]').forEach(b=>b.onclick=()=>{
      const r=G.prepareCamp('talk',b.dataset.campTalk); if(!r.ok) UI.toast(r.why); showCampHub();
    });
    $('#camp-rest').onclick=()=>{ closeOvl('#ovl-camp'); G.camp(); };
  }
  function renderGarage(){
    const body=$('#stl-body'); if(!body) return;
    const repCost=G.hasComp('minji')?6:8;
    const canRep=S.van<S.vanMax-5&&S.scrap>=repCost;
    const groups=D.upgradeGroups||[];
    let group=groups.find(x=>x.id===garageGroup)||groups[0];
    garageGroup=group.id;
    const groupIcon={fuel:'fuel',seating:'bond',chassis:'van',utility:'parts',power:'perk',camp:'food',living:'water'}[group.id]||'parts';
    const ownedN=group.ids.filter(id=>S.up[id]).length;
    const upgrades=group.ids.map(id=>G.upDef(id)).filter(Boolean);
    const vanStage=G.vanStage();
    const quote=G.settlementRepairQuote();
    const rows=[{key:'repair',kind:'repair',label:'차체 정비',sub:`내구 +${quote.amount}${G.hasComp('minji')?' · 민지 할인':''} · 현재 ${Math.floor(S.van)}/${S.vanMax}`,
      meta:`고철 ${repCost} · ${G.durationLabel(quote.mins)}`,action:S.van>=S.vanMax-5?'차체 양호':'수리한다',enabled:canRep,icon:'parts'}]
      .concat(upgrades.map(u=>{const owned=!!S.up[u.id],chk=G.canBuyUp(u.id);
        return {key:`upgrade-${u.id}`,kind:'upgrade',id:u.id,label:u.nm,sub:u.d,icon:groupIcon,
          meta:owned?'장착 완료':`고철 ${u.cost.scrap}${u.cost.parts?' + 부품 '+u.cost.parts:''} · ${G.durationLabel(G.upgradeMinutes(u))}`,
          action:owned?'장착 완료':chk.ok?'장착한다':'잠김',enabled:!owned&&chk.ok,reason:chk.why||''};
      }));
    let selected=rows.find(row=>row.key===garageSelection);
    if(!selected) selected=(canRep&&rows[0])||rows.find(row=>row.kind==='upgrade'&&row.enabled)||rows[1]||rows[0];
    garageSelection=selected&&selected.key||'';
    const categories=`<nav class="field-board-categories" aria-label="개조 분야">${groups.map(item=>{
      const n=item.ids.filter(id=>S.up[id]).length;
      return `<button class="${item.id===garageGroup?'selected':''}" data-ug="${item.id}" aria-pressed="${item.id===garageGroup}"><span>${esc(item.nm)}</span><small>${n}/${item.ids.length}</small></button>`;
    }).join('')}</nav>`;
    const list=rows.map(row=>`<button class="field-board-row garage-board-row ${row.kind==='upgrade'?'upgrade-card':''} ${row.key===garageSelection?'selected':''} ${row.kind==='upgrade'&&S.up[row.id]?'owned':''}"
      data-garage-key="${row.key}" aria-pressed="${row.key===garageSelection}" ${row.enabled?'':'data-unavailable="true"'}>
      <span class="field-board-row-icon" aria-hidden="true">${ICO(row.icon||'parts')}</span>
      <span class="field-board-row-copy"><b>${esc(row.label)}</b><small>${esc(row.sub)}</small></span>
      <span class="field-board-row-meta">${esc(row.meta)}</span>
    </button>`).join('');
    const boardBody=`<div id="garage"><div class="field-board-van-overview">
        <canvas id="garage-van-cv" aria-label="현재 달구지 차체"></canvas>
        <div><b>${esc(vanStage.nm)}</b><small>차체 ${Math.floor(S.van)}/${S.vanMax} · 증축 +${vanStage.cm}cm · 정원 ${G.seatCapacity()+1}명</small></div>
      </div>${categories}<section class="field-board-group"><header><span>${esc(group.nm)}</span><b>${ownedN}/${group.ids.length} 장착 · ${esc(group.sub)}</b></header>
        <div class="field-board-list">${list}</div></section></div>`;
    const actionAttrs=selected?(selected.kind==='repair'?'data-rep="1"':`data-up="${selected.id}"`):'';
    body.innerHTML=fieldBoardShell({mode:'garage',title:settlementSpots(curStl).garage.label,
      sub:settlementSpots(curStl).garage.sub,status:`● 작업대 가동 · 차체 ${Math.round(S.van/S.vanMax*100)}% · 부품 ${S.items['부품']||0}`,
      body:boardBody,selectedLabel:selected&&selected.label,
      actionMeta:selected?(selected.reason||selected.meta):'',actionLabel:selected&&selected.action,
      actionAttrs,disabled:!(selected&&selected.enabled)});
    requestAnimationFrame(()=>{ if(SCENE.drawSettlementVan) SCENE.drawSettlementVan($('#garage-van-cv')); });
    body.querySelectorAll('[data-ug]').forEach(button=>button.onclick=()=>{
      garageGroup=button.dataset.ug; garageSelection=''; renderGarage();
    });
    body.querySelectorAll('[data-garage-key]').forEach(button=>button.onclick=()=>{
      const scrollTop=body.querySelector('.field-board-body')?.scrollTop||0;
      garageSelection=button.dataset.garageKey; renderGarage();
      const scroller=body.querySelector('.field-board-body'); if(scroller) scroller.scrollTop=scrollTop;
      requestAnimationFrame(()=>$('#garage-action')?.focus({preventScroll:true}));
    });
    const action=$('#garage-action');
    if(action) action.onclick=()=>{
      const row=rows.find(item=>item.key===garageSelection); if(!row||!row.enabled) return;
      if(row.kind==='repair'){
        const result=G.settlementRepair();
        if(!result.ok){ if(result.why) UI.toast(result.why); return; }
        UI.toast(`🔧 정비소 수리 완료 — 내구 +${result.amount}`); renderHud(); renderGarage(); return;
      }
      const u=G.upDef(row.id);
      const before={up:{...S.up},stage:{...G.vanStage()},capacity:G.seatCapacity(),
        fuelMax:S.fuelMax,vanMax:S.vanMax};
      if(G.buyUpgrade(row.id)){ renderGarage(); renderHud();
        playUpgradeInstall(u,before);
        const ts=$('#tr-scrap'); if(ts) ts.textContent=S.scrap; }
    };
    $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
  }
  function recruitStl(id){
    if(S.recruitQ){
      if(S.recruitQ.id!==id){ UI.toast('먼저 지금 맡은 합류 부탁을 끝내야 한다'); return; }
      closeOvl('#ovl-stl'); G.openRecruitStep(); return;
    }
    const def=D.recruitQuests&&D.recruitQuests[id], eventId=def&&def.meet;
    if(eventId && D.events.find(e=>e.id===eventId) && !S.used.includes(eventId)){
      closeOvl('#ovl-stl');
      G.openEventById(eventId);
      return;
    }
    UI.toast('이 사람과 나눌 첫 이야기는 이미 끝났다');
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
    const slot=body.querySelector('#stl-talk-slot');
    const old=body.querySelector('.dlg.talk'); if(old) old.remove();
    const rumorDone = S.flags['rumor_'+nid];
    const dlg=el('div','dlg talk',`<div class="npc-talk-head"><div class="npc-face">${npcFace(nid,npc.face)}</div><div class="say"><span class="spk">${npc.name}</span> "${greet}"</div></div>
      <div class="dialogue-choice-label">내 대답</div><div class="choices">
        ${!rumorDone?`<button class="choice" data-r="rumor">요즘 소문 들은 거 없어요?</button>`:''}
        <button class="choice" data-r="chat">이런저런 얘기를 나눈다</button>
        <button class="choice" data-r="x">그만 일어난다</button></div>`);
    if(slot) slot.replaceChildren(dlg); else body.prepend(dlg);
    body.querySelectorAll('.npc-row').forEach(row=>row.classList.toggle('talking',
      row.dataset.personId===nid||row.dataset.npc===nid));
    dlg.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
      const r=b.dataset.r;
      if(r==='rumor'){
        S.flags['rumor_'+nid]=true; st.att+=5;
        const ru=npc.rumor;
        dlg.querySelector('.say').innerHTML=`<span class="spk">${npc.name}</span> "${ru.text}"`;
        dlg.querySelector('.choices').innerHTML=`<button class="choice" data-r="x2">고맙습니다</button>`;
        if(ru.reveal) G.applyFx({reveal:ru.reveal, note:{type:'소문',title:npc.name+'의 소문',body:ru.text,links:[D.nodes[ru.reveal].name, npc.name]}});
        else G.applyFx({note:{type:'소문',title:npc.name+'의 소문',body:ru.text,links:[npc.name]}});
        dlg.querySelector('[data-r="x2"]').onclick=()=>{ dlg.remove(); showStl(curStl,'people'); };
      }
      else if(r==='chat'){
        st.att+=3;
        /* 인물 전용 잡담이 있으면 그걸 쓴다 — 공용 풀 5줄을 전원이 돌려 쓰던
           문제(금자도 문지기도 같은 말)의 해소. 2026-08-07 */
        const lines=npc.chats||[
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
      else { dlg.remove(); body.querySelectorAll('.npc-row.talking').forEach(row=>row.classList.remove('talking')); }
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
    const compact=!!card.closest('.map-navigator');
    let h=`<h4>${n.name} ${S.visited.includes(id)?'':'<small style="color:var(--faded)">(미방문)</small>'}</h4>
      <div class="d">${S.visited.includes(id)||n.type!=='hidden'? n.desc:'가보기 전엔 알 수 없다.'}</div>`;
    if(S.at===id) h+=`<div class="d" style="color:var(--amber)">현재 위치</div>`;
    else if(chk.ok) h+=`<button class="go" data-go="${id}">이곳으로 출발<small>${chk.km}km · 연료 약 ${chk.fuel}L</small></button>`;
    else if(S.driving) h+=`<div class="d">이동 중에는 목적지를 바꿀 수 없다</div>`;
    else h+=`<div class="d">${esc(chk.why||'여기서 바로 가는 길이 없다 — 경유해야 한다')}</div>`;
    if(plan&&plan.segments>1) h+=`<div class="map-route-preview"><b>이어지는 길 · ${plan.segments}구간 · 약 ${plan.km}km</b><span>${esc(routeText)}</span></div>`;
    if(compact){
      h=`<div class="map-compact-place"><small>선택한 길</small><h4>${esc(n.name)}</h4></div>`;
      if(S.at===id) h+=`<div class="d">현재 위치</div>`;
      else if(chk.ok) h+=`<button class="go" data-go="${id}"><span>이 길 선택</span><small>${chk.km}km · 연료 약 ${chk.fuel}L</small></button>`;
      else h+=`<div class="d">${esc(S.driving?'이동 중에는 바꿀 수 없다':chk.why||'여기서 이어진 길이 없다')}</div>`;
    }
    card.innerHTML=h;
    const btn=card.querySelector('[data-go]');
    if(btn) btn.onclick=()=>{ closeOvl('#ovl-map'); G.startTravel(id); };
    card.classList.add('on');
  }
  function renderMapMini(){ $('#map-mini').textContent=`발견 ${S.known.length}/${Object.keys(D.nodes).length} · 서울까지 약 ${G.remainKm()}km`; }
  function refreshMapSurface(){
    renderMapMini(); renderMission();
    /* 닫힌 오버레이에서 부팅한 canvas는 폭·높이가 0이다. Chrome이 새 레이아웃을
       확정한 두 프레임 뒤 다시 맞추고 한 장을 즉시 그려 빈 CRT가 남지 않게 한다. */
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ MAPR.resize(); MAPR.draw(0); }));
  }

  /* ── STATUS ── */
  let stTab='now';
  let inventorySelection='부품';
  let mapKbFocus=null;
  function wireRoadTool(root){
    root.querySelectorAll('[data-road-tool]').forEach(button=>button.onclick=()=>{
      const tool=button.dataset.roadTool;
      if(tool==='road') $('#dk-road').click();
    });
  }
  function renderInteractiveRoadTool(){
    if(stTab!=='now'&&stTab!=='journey') return false;
    const prop=$('#status-prop'), b=$('#st-body');
    const clock=G.fmtClock();
    const surface=stTab==='journey'?'goal':'bag';
    /* 목표와 가방은 같은 오버레이를 공유하지만 렌더 상태는 섞지 않는다.
       이전 화면 DOM을 먼저 비우고 root 계약을 바꿔 stale 레이어가 남지 않게 한다. */
    b.replaceChildren();
    prop.dataset.toolSurface=surface;
    $('#status-title').textContent=stTab==='journey'?'현재 목표':'가방과 보급';
    $('#st-mini').textContent=clock;
    prop.className=`road-tool-prop ${stTab==='journey'?'goal-folio':'bag-supply-roll'}`;
    const statusTabs=$('#st-tabs');
    statusTabs.style.cssText='display:none';
    statusTabs.setAttribute('aria-hidden','true');
    document.querySelectorAll('#st-tabs button').forEach(button=>{
      const selected=button.dataset.st===stTab;
      button.classList.toggle('here',selected);
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=-1;
    });
    if(stTab==='journey'){
      const steps=G.departureSteps();
      const done=steps.filter(step=>step.done).length;
      const nextStep=steps.find(step=>!step.done);
      const focusStart=Math.max(0,Math.min(steps.length-3,done-1));
      const focusSteps=steps.slice(focusStart,focusStart+3);
      const transfer=G.transferStatus();
      const witnessed=G.pillars?G.pillars().관계.have:0;
      const knowledge=G.knowledgeSummary().filter(item=>item.level>=2);
      const clue=knowledge[knowledge.length-1];
      const nextActions={
        family:{label:'도윤 가족의 버스 난방을 고친다',detail:'이송 현장을 직접 확인하고 기록을 남긴다.',condition:'이송 현장 직접 확인'},
        appeal:{label:'부산에서 이의 제기 절차를 확인한다',detail:'원격 절차가 막힌 이유와 결과를 기록한다.',condition:'이의 제기 결과 기록'},
        module:{label:'계기판 배선을 회로도와 대조한다',detail:'검증 모듈이 실제 달구지에 연결됐는지 확인한다.',condition:'회로도·배선 대조'},
        key:{label:'분리 절차 4–5쪽을 먼저 찾는다',detail:'절차를 확보하기 전에는 검증키를 뽑지 않는다.',condition:'분리 절차 4–5쪽 확보'},
        witness:{label:'당사자 증언과 발신 기록을 맞춘다',detail:'같은 명령을 겪은 사람들의 기록을 직접 대조한다.',condition:`증언 ${witnessed}/${D.seoulPillars.관계}`},
        seoul:{label:'남산 관문에서 이송을 중단한다',detail:'서울 도착 뒤 남은 중단 절차를 끝낸다.',condition:`DAY ${D.transferDeadlineDay} 안에 완료`}
      };
      const nextAction=nextActions[nextStep?.id]||{label:'이송 중단 기록을 보관한다',detail:'완료한 기록을 달구지 안에 안전하게 보관한다.',condition:'목표 완료'};
      b.innerHTML=`<div class="folio-live-content">
        <div class="folio-title-row"><span>현재 목표</span><small>${esc(clock)}</small></div>
        <h3>${transfer.onTime?'서울 이송 중단':'남은 이송 중단'}</h3>
        <div class="folio-location">${esc(D.nodes[S.at].name)}</div>
        <section class="folio-progress" aria-label="목표 진행 ${done}/${steps.length}">
          <div class="folio-section-title"><b>진행 단계</b><span>${done}/${steps.length}</span></div>
          ${focusSteps.map((step,index)=>`<div class="folio-step ${step.done?'done':''}"><i>${step.done?'✓':focusStart+index+1}</i><span><b>${esc(step.label)}</b><small>${esc(step.detail)}</small></span></div>`).join('')}
        </section>
        <section class="folio-clue"><span>확인된 단서</span><b>${esc(clue?clue.label:'남산 진입 경로 도면')}</b><p>${esc(clue?clue.text:'엄마가 남긴 도면과 현재 길의 기록을 대조한다.')}</p></section>
        <div class="folio-support"><span>다음 행동</span><b>${esc(nextAction.label)}</b><p>${esc(nextAction.detail)}</p><dl class="folio-support-meta"><div><dt>현재 위치</dt><dd>${esc(D.nodes[S.at].name)}</dd></div><div><dt>완료 기준</dt><dd>${esc(nextAction.condition)}</dd></div></dl></div>
        <button class="folio-road-button" data-road-tool="road">길로 돌아가기</button>
      </div>`;
    }else{
      const perDay=Math.max(1,G.partySize()-(G.hasPerk('kw_ration')&&G.partySize()>1?1:0));
      const supplyDays=Math.min(Math.floor(S.water/perDay),Math.floor(S.food/perDay));
      const parts=S.items['부품']||0;
      const repairGain=S.up&&S.up.sidebox?45:35;
      const canRepair=parts>0&&S.van<S.vanMax-2;
      const entries=[
        {id:'부품',label:'부품',value:parts,unit:'개',icon:'parts',desc:'달구지의 손상된 차체를 현장에서 복구한다.',action:canRepair?`부품 1개로 정비 · 차체 +${repairGain}`:parts<1?'정비할 부품이 없다':'차체가 충분히 튼튼하다',primary:true},
        {id:'의약품',label:'의약품',value:S.items['의약품']||0,unit:'개',icon:'meds',desc:'부상자를 돌볼 때 사용하는 약품이다.'},
        {id:'탄약',label:'소총탄',value:S.items['탄약']||0,unit:'발',icon:'ammo',desc:'총기를 사용할 때 필요한 탄약이다.'},
        {id:'고철',label:'고철',value:S.scrap,unit:'개',icon:'scrap',desc:'거래와 달구지 개조에 사용하는 재료다.'},
        {id:'기타',label:'기타',value:Object.entries(S.items).filter(([key])=>!['부품','의약품','탄약'].includes(key)).reduce((sum,[,value])=>sum+(Number(value)||0),0),unit:'개',icon:'quest',desc:'의뢰와 여정에서 얻은 특별한 물건이다.'}
      ];
      if(!entries.some(entry=>entry.id===inventorySelection)) inventorySelection='부품';
      const selected=entries.find(entry=>entry.id===inventorySelection)||entries[0];
      b.innerHTML=`<div class="bag-live-content">
        <div class="bag-title-row"><h3>가방과 보급</h3><small>${esc(clock)}</small></div>
        <section class="bag-critical">
          <div>${ICO('water')}<span>물<b>${S.water}</b></span></div>
          <div>${ICO('food')}<span>식량<b>${S.food}</b></span></div>
          <div>${ICO('fuel')}<span>연료<b>${Math.floor(S.fuel)}L</b></span></div>
        </section>
        <section class="bag-vehicle" aria-label="달구지와 보급 상태"><small class="bag-vehicle-title">여정 상태</small><div><span>차체</span><b>${Math.floor(S.van)}%</b><i><em style="width:${clamp(S.van/S.vanMax*100,0,100)}%"></em></i></div><div><span>남은 보급</span><b>${supplyDays}일</b><i><em style="width:${clamp(supplyDays/5*100,0,100)}%"></em></i></div></section>
        <section class="bag-pockets" aria-label="가방 수납칸">${entries.map(entry=>`<button class="bag-pocket ${entry.id===selected.id?'selected':''}" data-bag-item="${entry.id}" aria-pressed="${entry.id===selected.id}" aria-label="${esc(entry.label)} ${entry.value??0}${entry.unit}${entry.id===selected.id?', 선택됨':''}">${ICO(entry.icon)}<span class="bag-pocket-name">${esc(entry.label)}</span><span class="bag-pocket-count"><small>보유</small><span class="bag-pocket-amount"><b>${entry.value??0}</b><small>${entry.unit}</small></span></span></button>`).join('')}</section>
        <section class="bag-detail ${selected.primary?'has-action':'count-only'}">${ICO(selected.icon)}<div class="bag-detail-copy"><small class="bag-detail-kicker">선택한 수납칸</small><div class="bag-detail-heading"><span>${esc(selected.label)}</span>${selected.primary?`<b>${selected.value??0}${selected.unit}</b>`:''}</div><p>${esc(selected.desc)}</p>${selected.primary?`<button class="is-primary" data-bag-action="${selected.id}" ${(selected.id==='부품'&&!canRepair)?'disabled':''}>${esc(selected.action)}</button>`:`<div class="bag-detail-quantity" aria-label="${esc(selected.label)} 수량 ${selected.value??0}${selected.unit}"><small>수량</small><b>${selected.value??0}${selected.unit}</b></div>`}</div></section>
      </div>`;
      b.querySelectorAll('[data-bag-item]').forEach(button=>button.onclick=()=>{
        inventorySelection=button.dataset.bagItem;
        renderStatus();
        requestAnimationFrame(()=>b.querySelector(`[data-bag-item="${inventorySelection}"]`)?.focus({preventScroll:true}));
      });
      const action=b.querySelector('[data-bag-action]');
      if(action) action.onclick=()=>{
        if(action.dataset.bagAction==='부품'){
          if(!G.fieldRepair()) toast('지금은 부품으로 정비할 필요가 없다');
          renderStatus();
        }
      };
    }
    wireRoadTool(b);
    return true;
  }
  function renderStatus(){
    if(renderInteractiveRoadTool()) return;
    const prop=$('#status-prop');
    delete prop.dataset.toolSurface;
    $('#st-tabs').style.cssText='';
    $('#st-tabs').removeAttribute('aria-hidden');
    prop.className=`road-tool-prop utility-sheet${stTab==='settings'?' settings-sheet':''}`;
    $('#status-title').textContent=stTab==='settings'?'화면·소리·백업 설정':stTab==='crew'?'동료':'가방과 달구지';
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
    const injuryIds=Object.keys(S.injuries||{});
    const route=G.routeStatus();
    const audioChannels=[['music','음악'],['ambience','환경음'],['effects','효과음'],['voice','목소리']];
    const injuryPanel=injuryIds.length?`<div class="st-sec"><h4>부상 · 전문 능력 일시 중지</h4>`+
      injuryIds.map(id=>{const x=S.injuries[id];return `<div class="st-row"><span class="k">${G.injuryName(id)}</span>
        <span class="v" style="flex:1;color:var(--danger)">${x.label} · ${x.days}일</span></div>`;}).join('')+
      `<div class="csub">아침마다 회복한다. 운전사 부상은 피로를 더 쌓고, 동료 부상은 해당 퍼크를 잠시 멈춘다.</div></div>`:'';
    const supplies=`<div class="st-sec inventory-primary"><h4>가방과 보급 <small>${supplyDays}일치</small></h4>
      <div class="st-row"><span class="k">${ICO('water')}물</span><span class="v" style="flex:1">${S.water} <small style="color:var(--faded)">≈ ${Math.floor(S.water/perDay)}일치</small></span></div>
      <div class="st-row"><span class="k">${ICO('food')}식량</span><span class="v" style="flex:1">${S.food} <small style="color:var(--faded)">≈ ${Math.floor(S.food/perDay)}일치</small></span></div>
      <div class="st-row"><span class="k">${ICO('scrap')}고철</span><span class="v" style="flex:1">${S.scrap}</span></div>
      <div class="st-row"><span class="k">아이템</span><span class="v" style="flex:1">${['부품','의약품','탄약'].map(k=>`${ICO(ITEM_ICO[k])}${k==='탄약'?'소총탄':k} ${S.items[k]||0}`).join(' · ')}</span></div>
      ${S.flags.armed_age?`<div class="st-row"><span class="k">무기</span><span class="v" style="flex:1">${['쇠파이프','석궁','볼트','화염병'].map(k=>`${k} ${S.items[k]||0}`).join(' · ')}</span></div>`:''}</div>`;

    let now=`<div class="st-summary">
      <div class="st-metric ${S.fuel<10?'warn':''}"><span class="mk">연료</span><span class="mv">${Math.floor(S.fuel)}L</span></div>
      <div class="st-metric ${S.fatigue>=75?'warn':''}"><span class="mk">피로</span><span class="mv">${Math.floor(S.fatigue)}%</span></div>
      <div class="st-metric ${supplyDays<=1?'warn':''}"><span class="mk">보급</span><span class="mv">${supplyDays}일</span></div>
    </div>
    ${supplies}
    ${injuryPanel}
    <div class="st-sec"><h4>운전사</h4>
      <div class="st-row"><span class="k">나</span><span class="v" style="flex:1">Lv.${dlv} 「${G.driverTitle()}」 <small style="color:var(--faded)">연비 -${dlv*2}% · 피로 -${dlv*7}%</small>${G.isInjured('driver')?` <small style="color:var(--danger)">· ${S.injuries.driver.label}</small>`:''}</span></div>
      ${dNext?`<div class="st-row"><span class="k">다음 숙련</span>${bar(S.stats.km-D.driverLv[dlv].km, dNext.km-D.driverLv[dlv].km)}<span class="v">${Math.round(S.stats.km)}/${dNext.km}km</span></div>`:''}
      <div class="st-row"><span class="k">피로 ${ICO('fatigue_'+G.fatigueStage(), G.fatigueFace())}</span>${bar(S.fatigue,100,S.fatigue>=75)}<span class="v">${Math.floor(S.fatigue)}%</span></div>
      <div class="csub">85%부터 졸음 위험. 야영이나 숙박으로 회복한다.</div></div>
    <div class="st-sec"><h4>${esc(G.vanName())}</h4>
      <div class="van-name-edit"><label for="van-name-input">차 이름</label><input id="van-name-input" maxlength="12" value="${esc(G.vanName())}" aria-label="달구지 이름"><button data-save-van-name="1">바꾸기</button></div>
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
    <div class="st-sec ui-comfort"><h4>화면 편의 <small>이 기기에 저장</small></h4>
      <div class="ui-comfort-grid">
        <button data-ui-pref="text" aria-pressed="${uiPrefs.largeText}"><span>글자 크기</span><b>${uiPrefs.largeText?'크게':'보통'}</b></button>
        <button data-ui-pref="motion" aria-pressed="${uiPrefs.reduceMotion}"><span>화면 움직임</span><b>${uiPrefs.reduceMotion?'줄임':'기본'}</b></button>
      </div><div class="csub">움직임 줄임은 장면 전환과 달구지 애니메이션을 낮추고, 캔버스 갱신 부담도 줄인다.</div></div>
    <div class="st-sec audio-mixer"><h4>소리 믹서 <small>채널별 · 이 기기에 저장</small></h4>
      <div class="audio-mixer-list">${audioChannels.map(([key,label])=>{ const value=Math.round(SND.level(key)*100); return `
        <label><span>${label}</span><input type="range" min="0" max="100" step="5" value="${value}" data-audio-level="${key}" aria-label="${label} 음량"><output>${value}%</output></label>`; }).join('')}</div>
      <div class="csub">하단의 소리 버튼은 전체 음소거이며, 이 값은 음악·현장음·효과·음성을 따로 조절한다.</div></div>
    <div class="st-sec save-backup"><h4>여정 백업 <small>내 기기에만 저장</small></h4>
      <p>현재 여정을 파일로 보관하거나, 이전 백업으로 되돌릴 수 있다. 복원은 현재 저장을 바꾼다.</p>
      <div class="save-backup-actions"><button data-save-export="1">💾 백업 파일 만들기</button><label>↥ 백업 파일 복원<input type="file" accept="application/json,.json" data-save-import="1"></label></div></div>`;

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
      const nextPayoff=st.lvl>=3
        ? `완주 서사 해금 · ${p3.d}`
        : st.lvl===2
          ? `다음 유대 · ${p3.nm}: ${p3.d}`
          : `다음 유대 · ${(c.perks[st.lvl+1]||[]).map(perk=>perk.nm).join(' / ')}`;
      return {id,c,st,p3,state,joinedBy:G.recruitApproach(id),best:G.bestRelation(id),
        injury:S.injuries&&S.injuries[id],nextPayoff,bondPct:st.lvl>=3?100:Math.min(100,st.bond/next*100)};
    });
    let crew=`<div class="st-summary">
      <div class="st-metric"><span class="mk">동료</span><span class="mv">${S.party.length}/${G.maxParty()}</span></div>
      <div class="st-metric"><span class="mk">완주 서사</span><span class="mv">${stories.filter(s=>s.state==='done').length}</span></div>
      <div class="st-metric"><span class="mk">보리</span><span class="mv">${S.dog?'동행 중':'—'}</span></div>
    </div><div class="st-sec crew-manifest"><h4>동행 명단 <small>이름을 눌러 자세히 보기</small></h4>`+
      (stories.length?`<div class="crew-status-list">`+stories.map(s=>`<div class="crew-status-card" data-comp2="${s.id}" role="button" tabindex="0">
        <span class="crew-status-face">${faceOf(s.id,s.c.face)}</span>
        <span class="crew-status-main"><b>${s.c.name}</b><small>${s.c.role}${s.joinedBy?` · ${esc(s.joinedBy.label)}로 합류`:''}${s.best?`<br>${esc(D.comps[s.best.id].name)}와 ${G.relationLabel(s.best.score)}`:''}</small><em class="crew-status-next">${esc(s.nextPayoff)}</em></span>
        <span class="crew-status-state">${s.injury?`🩹 ${s.injury.label}<br>${s.injury.days}일`:(s.state==='done'?`★ ${s.p3.nm}`:`Lv.${s.st.lvl} · 유대 ${s.st.bond}${s.st.pending?'<br>✦ 퍼크 대기':''}`)}</span>
        <span class="crew-status-bond"><i style="width:${s.bondPct}%"></i></span></div>`).join('')+`</div>`
        :`<div class="status-empty"><b>아직 혼자다.</b><span>누구를 만나게 될지는 길이 정한다.</span></div>`)+
      `<div class="csub" style="margin-top:9px">${stories.length?'각자의 유대와 다음 능력은 함께 겪은 일에 따라 달라진다.':'지도와 명단에는 만나지 않은 사람을 미리 표시하지 않는다.'}</div></div>`;

    const settings=`<div class="settings-console">
      <div class="st-sec ui-comfort"><h4>화면 편의 <small>이 기기에 저장</small></h4>
        <div class="ui-comfort-grid">
          <button data-ui-pref="text" aria-pressed="${uiPrefs.largeText}"><span>글자 크기</span><b>${uiPrefs.largeText?'크게':'보통'}</b></button>
          <button data-ui-pref="motion" aria-pressed="${uiPrefs.reduceMotion}"><span>화면 움직임</span><b>${uiPrefs.reduceMotion?'줄임':'기본'}</b></button>
        </div><div class="csub">움직임 줄임은 장면 전환과 달구지 애니메이션을 낮춘다.</div></div>
      <div class="st-sec audio-mixer"><h4>소리 믹서 <small>채널별 · 이 기기에 저장</small></h4>
        <div class="audio-mixer-list">${audioChannels.map(([key,label])=>{ const value=Math.round(SND.level(key)*100); return `
          <label><span>${label}</span><input type="range" min="0" max="100" step="5" value="${value}" data-audio-level="${key}" aria-label="${label} 음량"><output>${value}%</output></label>`; }).join('')}</div></div>
      <div class="st-sec save-backup"><h4>여정 백업 <small>내 기기에만 저장</small></h4>
        <p>현재 여정을 파일로 보관하거나 이전 백업으로 되돌릴 수 있다.</p>
        <div class="save-backup-actions"><button data-save-export="1">백업 파일 만들기</button><label>백업 파일 복원<input type="file" accept="application/json,.json" data-save-import="1"></label></div></div>
    </div>`;

    b.innerHTML=`<div class="st-pane ${stTab==='now'?'on':''}" data-stpane="now">${now}</div>
      <div class="st-pane ${stTab==='journey'?'on':''}" data-stpane="journey">${journey}</div>
      <div class="st-pane ${stTab==='crew'?'on':''}" data-stpane="crew">${crew}</div>
      <div class="st-pane ${stTab==='settings'?'on':''}" data-stpane="settings">${settings}</div>`;
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
    const saveVanName=b.querySelector('[data-save-van-name]');
    if(saveVanName) saveVanName.onclick=()=>{
      const input=b.querySelector('#van-name-input');
      const next=(input&&input.value||'').trim().slice(0,12)||'달구지';
      S.vanName=next; G.save(); UI.toast(`🚐 차 이름을 ${next}(으)로 바꿨다`); renderStatus();
    };
    const saveExport=b.querySelector('[data-save-export]');
    if(saveExport) saveExport.onclick=()=>{
      const blob=new Blob([G.exportSave()],{type:'application/json'});
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=`seoul-400km-day-${S.day}-backup.json`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      UI.toast('💾 현재 여정을 백업 파일로 만들었다');
    };
    const saveImport=b.querySelector('[data-save-import]');
    if(saveImport) saveImport.onchange=()=>{
      const file=saveImport.files&&saveImport.files[0]; if(!file) return;
      if(!window.confirm('이 백업으로 현재 여정을 교체할까요? 현재 저장은 사라집니다.')){ saveImport.value=''; return; }
      file.text().then(raw=>{
        const result=G.importSave(raw);
        if(!result.ok){ UI.toast(`⚠ ${result.why}`); return; }
        UI.toast('💾 백업을 복원했다'); renderAll(); renderStatus();
      }).catch(()=>UI.toast('⚠ 백업 파일을 읽지 못했다'));
    };
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
      body=`남산에 닿았을 때 제7 잔류구역의 명부는 0이었다.\n\n멈출 이송이 없었다. 코어는 우리를 들여보냈고, 요구를 받았고, 집행을 중지했다. 절차는 전부 정상이었다.\n\n"다음 구역에는 이 규칙이 적용됩니다."\n\n내려오는 길에 구역을 지났다. 6,412개의 문패가 그대로였다. 어느 마당의 빨랫줄에는 집게가 줄지어 남아서, 바람이 불 때마다 널 것을 기다렸다.\n\n수첩의 사유란은 끝내 비어 있다. 이제 그 빈칸을 물어볼 사람이, 그 구역에는 없다.`;
    } else if(kind==='too_late'){
      kicker='ENDING · 늦은 도착'; kcolor='var(--amber)';
      title='먼저 떠난 버스들';
      body=`남산에서 남은 이송을 멈췄다. 이미 내려간 사람들에게는 돌아올 길이 열렸다는 방송이 나갔다.\n\n첫 귀환 버스가 북쪽으로 올라온 날, 구역 정류장에서 명단 읽는 소리를 들었다. 호명은 길었고, 대답은 드문드문했다.\n\n돌아오는 것과 떠나지 않는 것은 같은 일이 아니다.\n\n그 차이가, 우리가 늦은 날수만큼이었다.`;
    } else if(kind==='stranded'){
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='길 위에 남았다';
      body=`달구지가 더는 움직이지 않는다.\n\n마지막 사흘은 걸어서 닿는 모든 방향을 걸어 봤다. 연료는 없고, 견인 값은 못 치르고, 걸어서 닿는 곳에는 아무도 없다.\n\n짐칸의 고철은 그대로 실려 있다. 여기서는 그냥 무거운 돌이다.\n\n언젠가 이 길을 지나는 차가 있다면 — 언젠가는 있을 것이다 — 조수석의 일지가 우리보다 멀리 가 주기를.\n\n일지 마지막 장에는 지도를 그려 두었다. 여기까지 오는 동안 물이 나오던 자리, 전부.`;
    } else if(kind==='shunned'){
      kicker='GAME OVER'; kcolor='var(--danger)';
      title='어느 마을도 열어 주지 않았다';
      body=`관측 표시가 붙은 차는 마을에 들이지 않는다.\n\n광주에서는 미안해했고, 대구에서는 소리부터 질렀고, 수원에서는 말없이 성문이 닫혔다. 닫히는 방식만 달랐다.\n\n물도, 부품도, 하룻밤도 살 수 없게 되자 길만 남았다. 길은 잠자리로 쓰기엔 너무 길고, 집으로 삼기엔 너무 좁았다.\n\n천리안은 끝내 우리를 잡으러 오지 않았다.\n\n문을 닫는 것은 언제나 사람의 손이었다.`;
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
    storyTurns:buildStoryTurns, finishStory, skipIntro, clearSpeech, clearToasts};
})();
