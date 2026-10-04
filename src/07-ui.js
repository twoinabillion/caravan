/* UI: keep this IIFE complete. Audio (07e) is independent. */
/* ═══════════════════ UI ═══════════════════ */
const $ = (s)=>document.querySelector(s);
const el = (tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };
const directionParticle=(word)=>{
  const text=String(word||'');
  const code=text.charCodeAt(text.length-1)-0xAC00;
  const tail=code>=0&&code<=11171?code%28:0;
  return tail!==0&&tail!==8?'으로':'로';
};

function syncJournalCards(){
  document.querySelectorAll('#jp-log .note').forEach(note=>{
    if(!note.hasAttribute('tabindex')) note.tabIndex=0;
    note.setAttribute('role','button');
    note.setAttribute('aria-expanded',String(note.classList.contains('expanded')));
  });
}
document.addEventListener('click',event=>{
  const note=event.target.closest&&event.target.closest('#jp-log .note');
  if(!note||event.target.closest('.lk')) return;
  note.classList.toggle('expanded');
  note.setAttribute('aria-expanded',String(note.classList.contains('expanded')));
});
document.addEventListener('keydown',event=>{
  const note=event.target.closest&&event.target.closest('#jp-log .note');
  if(!note||!['Enter',' '].includes(event.key)) return;
  event.preventDefault(); note.click();
});
queueMicrotask(()=>{
  const log=$('#jp-log'); if(!log) return;
  new MutationObserver(syncJournalCards).observe(log,{childList:true,subtree:true});
  syncJournalCards();
});

const UI = (()=>{
  let screen='title';          // title|mode|name|intro|game|end
  const heldStoryAdvanceKeys=new Set();
  let bgmEvKey=null;           // 현재 이벤트의 BGM 힌트 (tension/story)
  let introIdx=0, introTurnIdx=0, pendingMode='onroad', pendingName='', pendingProfile='keeper', introRestart=false;
  let navChoiceAt=null, navChoiceId=null, navChoiceGuide='', journeyConsoleMode='route';
  let routeMapOpen=false, journeyRouteModels=[],journeyViewRestored=false;
  let stayActionAt=null,stayActionId=null;
  const journeyViewKey='caravan-journey-view-v1';
  function rememberJourneyView(){
    if(!S)return;
    try{sessionStorage.setItem(journeyViewKey,JSON.stringify({at:S.at,mode:journeyConsoleMode,destination:navChoiceId,guide:navChoiceGuide,mapOpen:routeMapOpen&&!S.driving,stayAction:stayActionId}));}catch(error){}
  }
  function restoreJourneyView(){
    if(journeyViewRestored||!S)return;
    journeyViewRestored=true;
    try{
      const view=JSON.parse(sessionStorage.getItem(journeyViewKey)||'null');
      if(!view||view.at!==S.at)return;
      journeyConsoleMode=view.mode==='local'?'local':'route';
      stayActionAt=S.at;stayActionId=view.stayAction||null;
      navChoiceAt=S.at;navChoiceId=view.destination;navChoiceGuide=view.guide||'';
      routeMapOpen=!!view.mapOpen&&journeyConsoleMode==='route'&&!S.driving;
    }catch(error){}
  }
  let questRouteFocus=null, questRouteState=null;
  /* Stage shortcuts delegate to at most two original action buttons. */
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
  const savedBrightness=Number(localStorage.getItem('caravan_ui_brightness'));
  const uiPrefs={
    largeText:localStorage.getItem('caravan_ui_text')==='large',
    reduceMotion:savedMotion?savedMotion==='reduced':Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    brightness:Number.isFinite(savedBrightness)&&savedBrightness>=60&&savedBrightness<=120?savedBrightness:100
  };
  function applyUiPrefs(){
    const root=document.documentElement;
    root.classList.toggle('ui-large-text',uiPrefs.largeText);
    root.classList.toggle('ui-reduce-motion',uiPrefs.reduceMotion);
    root.dataset.uiText=uiPrefs.largeText?'large':'normal';
    root.dataset.uiMotion=uiPrefs.reduceMotion?'reduced':'full';
    root.style.setProperty('--ui-brightness',String(uiPrefs.brightness/100));
  }
  function toggleUiPref(kind){
    if(kind==='text'){
      uiPrefs.largeText=!uiPrefs.largeText;
      localStorage.setItem('caravan_ui_text',uiPrefs.largeText?'large':'normal');
    }else if(kind==='motion'){
      uiPrefs.reduceMotion=!uiPrefs.reduceMotion;
      localStorage.setItem('caravan_ui_motion',uiPrefs.reduceMotion?'reduced':'full');
    }
    applyUiPrefs();
    if(curStory&&$('#ev-sheet')?.dataset.readerLayout==='pages')renderStoryState();
  }
  function renderSimpleMenu(){
    $('#ovl-menu').querySelectorAll('[data-ui-pref]').forEach(button=>{
      const enabled=button.dataset.uiPref==='text'?uiPrefs.largeText:uiPrefs.reduceMotion;
      button.setAttribute('aria-pressed',String(enabled));
      button.querySelector('b').textContent=enabled?'켜짐':'꺼짐';
    });
    const brightness=$('#menu-brightness'), brightnessValue=$('#menu-brightness-value');
    if(brightness) brightness.value=String(uiPrefs.brightness);
    if(brightnessValue) brightnessValue.textContent=`${uiPrefs.brightness}%`;
    const soundOn=SND.isEnabled();
    const soundState=$('#menu-sound-state'), soundToggle=$('#menu-sound-toggle');
    if(soundState) soundState.textContent=soundOn?'켜짐':'꺼짐';
    if(soundToggle){
      soundToggle.textContent=soundOn?'소리 끄기':'소리 켜기';
      soundToggle.setAttribute('aria-pressed',String(soundOn));
    }
    const volume=$('#menu-volume');
    if(volume){
      const keys=['music','ambience','effects','voice'];
      volume.value=String(Math.round(keys.reduce((sum,key)=>sum+SND.level(key),0)/keys.length*100));
    }
    const saveState=$('#menu-save-state');
    if(saveState) saveState.textContent=G.hasSave()?'저장됨':'저장 전';
  }
  function exportCurrentSave(){
    if(!S) return;
    G.save();
    const blob=new Blob([G.exportSave()],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=`seoul-400km-day-${S.day}-backup.json`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('현재 여정을 백업 파일로 만들었다');
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
    closePursuitHelp();
    const node=typeof sel==='string'?$(sel):sel;
    if(!node) return;
    if(!node.classList.contains('on')) node._returnFocus=document.activeElement;
    if(!node._focusTrap){
      node.addEventListener('keydown',event=>{
        if(event.key!=='Tab'||!node.classList.contains('on')) return;
        const focusables=[...node.querySelectorAll(focusableSel)].filter(element=>{
          const rect=element.getBoundingClientRect();
          return element.offsetParent!==null&&!element.hidden&&element.getAttribute('aria-hidden')!=='true'&&
            rect.width>0&&rect.height>0;
        });
        if(!focusables.length) return;
        const first=focusables[0],last=focusables[focusables.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
      });
      node._focusTrap=true;
    }
    node.classList.add('on');
    node.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>{
      const candidates=[...node.querySelectorAll(focusableSel)].filter(element=>{
        const rect=element.getBoundingClientRect();
        return element.offsetParent!==null&&!element.hidden&&element.getAttribute('aria-hidden')!=='true'&&
          rect.width>0&&rect.height>0;
      });
      const requested=preferred&&node.querySelector(preferred);
      const target=requested&&candidates.includes(requested)?requested:candidates[0];
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
    return ['#install-guide','#intro-summary','#arrival-scene','#ev-wrap','#ovl-seoul','#ovl-stl','#ovl-map','#ovl-journal','#ovl-status','#ovl-menu','#ovl-camp','#ovl-local-actions']
      .map($).find(node=>node&&node.classList.contains('on'))||null;
  }
  const modalOpen = ()=> screen!=='game' || $('#ev-wrap').classList.contains('on')
    || $('#arrival-scene').classList.contains('on')
    || $('#ovl-stl').classList.contains('on') || $('#ovl-map').classList.contains('on')
    || $('#ovl-journal').classList.contains('on') || $('#ovl-status').classList.contains('on') || $('#ovl-menu').classList.contains('on')
    || $('#ovl-seoul').classList.contains('on') || $('#ovl-camp').classList.contains('on')
    || $('#ovl-local-actions').classList.contains('on') || !!$('#trip-destination-dialog')?.open
    || !!$('#journey-detail-dialog')?.open;

  /* ── screens ── */
  function show(id){
    closePursuitHelp();
    if(pursuitUi) pursuitUi.level=null; // Loading/restarting a run is not a risk increase.
    document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
    $('#scr-game').classList.remove('on');
    screen=id.replace('scr-','');
    if(screen!=='game'){
      resetStoppedStageFit();
      document.documentElement.classList.remove('game-viewport-locked');
    }
    $('#app').dataset.screen=screen;
    const earlySound=$('#early-sound');
    if(earlySound) earlySound.hidden=!['title','preview','mode','name'].includes(screen);
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
    $('#minimap').onclick=()=>openJourneyMap();
    GRAPH.init($('#graphcv'));
    wire();
    applyIcons();
    refreshTitle();
    syncInstallUI();
    const bootParams=new URLSearchParams(location.search);
    const localPreview=location.hostname==='127.0.0.1'||location.hostname==='localhost';
    const devEventId=localPreview?bootParams.get('dev-event'):null;
    const devEvent=devEventId&&D.events.find(event=>event.id===devEventId);
    if(devEvent){
      requestAnimationFrame(()=>{
        const savedBefore=localStorage.getItem(SAVE_KEY);
        if(!G.load()) G.newGame('onroad','다온','full','keeper');
        /* 테스트 진입에서 고른 결과는 실제 여정 저장에 덮어쓰지 않는다. */
        G.save=()=>{};
        if(savedBefore!==null) localStorage.setItem(SAVE_KEY,savedBefore);
        S.flags=S.flags||{};
        S.flags.main_mission_started=true;
        S.flags.onboarding_event_guide=true;
        S.flags.armed_age=true;
        S.driving=null;
        if(!S.at) S.at='busan';
        S.combat=null;
        S.injuries={};
        S.party=[...new Set([...(S.party||[]),'minji','kangwoo'])];
        S.items=S.items||{};
        Object.assign(S.items,{'석궁':1,'볼트':3,'화염병':2,'쇠파이프':1,'탄약':3});
        enterGame();
        showEvent(devEvent);
        finishStory();
      });
    }else if(bootParams.has('caravan-live')&&G.hasSave()){
      requestAnimationFrame(()=>{ if(screen==='title'&&G.load()) enterGame(); });
    }
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
    if(document.documentElement.classList.contains('qa-exact-replay')){
      requestAnimationFrame(loop);
      return;
    }
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
      }
      if(drawFrame&&$('#ovl-journal').classList.contains('on')&&$('#jgraphwrap').classList.contains('on')) GRAPH.draw(dt);
    }
    requestAnimationFrame(loop);
  }

  /* ── wiring ── */
  function wire(){
    const saveForLifecycle=()=>{ if(S) G.save(); };
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveForLifecycle(); });
    window.addEventListener('pagehide',saveForLifecycle);
    document.addEventListener('keyup',e=>heldStoryAdvanceKeys.delete(e.code));
    window.addEventListener('blur',()=>heldStoryAdvanceKeys.clear());
    /* div/canvas로 만든 조작 카드도 Enter·Space로 실제 버튼처럼 작동한다. */
    document.addEventListener('keydown',e=>{
      if(heldStoryAdvanceKeys.has(e.code)){
        e.preventDefault();
        return;
      }
      const modal=activeModal();
      /* 지도 키보드 탐색 — [/]로 발견한 지역을 순회한다. 출발 결정은 길 화면만
         소유하고, 지도는 현재 위치와 지역 정보를 살피는 읽기 화면으로 남긴다. */
      const mapOvl=document.querySelector('#ovl-map');
      if(mapOvl&&mapOvl.classList.contains('on')&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){
        if(e.key==='['||e.key===']'){
          e.preventDefault();
          const ids=[...(S.known||[])].filter(id=>D.nodes[id]).sort((a,b)=>D.nodes[a].y-D.nodes[b].y||D.nodes[a].x-D.nodes[b].x);
          if(ids.length){
            let idx=ids.indexOf(mapKbFocus);
            idx=e.key===']'?(idx+1)%ids.length:(idx-1+ids.length)%ids.length;
            mapKbFocus=ids[idx];
            MAPR.selectNode(mapKbFocus);
            showNodeCard(mapKbFocus);
          }
          return;
        }
      }
      /* 선택지는 화면에 번호를 붙이지 않지만 숫자키의 논리 순서는 유지한다.
         키보드만으로도 같은 행동을 고를 수 있게 하는 중심 배선이다. */
      const eventModal=document.querySelector('#ev-wrap.on');
      const choiceModal=eventModal||modal;
      if(choiceModal&&/^[1-9]$/.test(e.key)&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){
        if(e.repeat){e.preventDefault();return;}
        const cards=[...choiceModal.querySelectorAll('button.choice:not([disabled])')].filter(x=>x.offsetParent!==null);
        const card=cards[Number(e.key)-1];
        if(card){ e.preventDefault(); heldStoryAdvanceKeys.add(e.code); card.click(); return; }
        /* 사건 본문을 읽는 동안에는 아직 선택 카드가 없다. 숫자 1을 첫 선택의
           단축키로만 두면 같은 키로 읽기를 이어 갈 수 없으므로, 결정 단계 전에는
           다음 문장 키로 사용하고 카드가 나타난 뒤부터 선택 번호로 전환한다. */
        if(e.key==='1'&&eventModal&&curStory&&curStory.readerMode!=='review'&&curStory.readerMode!=='inspection'&&(curStory.readingPage?curStory.readingPage.mode==='read':curStory.index<curStory.turns.length-1)){
          e.preventDefault();
          heldStoryAdvanceKeys.add(e.code);
          advanceStory(curStory); return;
        }
      }
      if(modal&&modal.getAttribute('aria-modal')!=='false'&&e.key==='Tab'){
        const items=[...modal.querySelectorAll(focusableSel)].filter(x=>x.offsetParent!==null);
        if(items.length){
          const first=items[0], last=items[items.length-1];
          if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
          else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
        }
      }
      if(modal?.id==='ev-wrap'&&e.key==='Escape'&&curStory&&['review','inspection'].includes(curStory.readerMode)){e.preventDefault();setStoryReaderMode(curStory,'current');return;}
      if(modal?.id==='ev-wrap'&&e.key==='Escape'&&curEv?.localConversation){e.preventDefault();closeEvent();return;}
      if(modal&&e.key==='Escape'&&modal.id!=='ev-wrap'&&modal.id!=='ovl-seoul'){
        e.preventDefault();
        if(modal.id==='arrival-scene') modal.querySelector('[data-arrival-continue]')?.click();
        else if(modal.id==='intro-summary') closeModal(modal);
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
      /* 이름 확인은 모바일 브라우저가 허용하는 명시적 사용자 제스처다. */
      SND.enable();
      G.newGame(pendingMode,pendingName,'interactive',pendingProfile);
      enterGame();
    };
    $('#bt-name').onclick=nameGo;
    $('#inp-name').addEventListener('keydown',e=>{
      if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); nameGo(); }
    });
    const openingHistory=$('#opening-history');
    if(openingHistory) openingHistory.onclick=()=>{
      pendingName=($('#inp-name').value||'').trim().slice(0,8);
      introIdx=0; introTurnIdx=0;
      SND.enable();
      renderIntro(true);
      show('scr-intro');
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
    $('#dk-crew').onclick=()=>openStatusTab('crew','dk-crew');
    $('#dk-menu').onclick=()=>{ setDockTab('dk-menu'); toggleOvl('#ovl-menu'); renderSimpleMenu(); };
    $('#menu-x').onclick=()=>closeOvl('#ovl-menu');
    $('#ovl-menu').querySelectorAll('[data-ui-pref]').forEach(button=>button.onclick=()=>{
      toggleUiPref(button.dataset.uiPref);
      renderSimpleMenu();
    });
    $('#local-actions-x').onclick=()=>closeOvl('#ovl-local-actions');
    const brightness=$('#menu-brightness');
    if(brightness) brightness.oninput=()=>{
      uiPrefs.brightness=Math.max(60,Math.min(120,Number(brightness.value)||100));
      localStorage.setItem('caravan_ui_brightness',String(uiPrefs.brightness));
      applyUiPrefs();
      const output=$('#menu-brightness-value');
      if(output) output.textContent=`${uiPrefs.brightness}%`;
    };
    const soundToggle=$('#menu-sound-toggle');
    if(soundToggle) soundToggle.onclick=()=>{ SND.toggle(); renderSimpleMenu(); };
    const volume=$('#menu-volume');
    if(volume) volume.oninput=()=>{
      const value=Number(volume.value)/100;
      ['music','ambience','effects','voice'].forEach(key=>SND.setLevel(key,value));
    };
    const saveNow=$('#menu-save-now');
    if(saveNow) saveNow.onclick=()=>{
      G.save();
      const state=$('#menu-save-state');
      if(state) state.textContent='방금 저장됨';
      toast('현재 여정을 저장했다');
    };
    const saveExport=$('#menu-save-export');
    if(saveExport) saveExport.onclick=exportCurrentSave;
    if(new URLSearchParams(location.search).has('caravan-live')) window.caravanLiveControls={
      ready:()=>!!S,
      restart:()=>startIntroRestart(),
      save:()=>{if(S)G.save()},
      infinite:()=>G.isInfiniteResourceMode()
    };
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
    introRestart=false; pendingMode='onroad'; pendingName=''; pendingProfile='keeper'; introIdx=0; introTurnIdx=0;
    const nameInput=$('#inp-name');
    if(nameInput) nameInput.value='';
    show('scr-name'); renderProfilePick();
    const skip=$('#intro-skip');
    if(skip){
      skip.hidden=false;
      skip.textContent=localStorage.getItem('caravan_intro_seen')?'이미 본 프롤로그 요약':'프롤로그 핵심 요약';
    }
    const portrait=$('#name-child');
    if(portrait) portrait.src=D.portraits.me||'';
    setTimeout(()=>{ const i=$('#inp-name'); if(i) i.focus(); },80);
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
    const page=D.intro[introIdx];
    if(newPage){
      VO.stop();
      AMBI.intro(page.scene);
      /* 인트로는 화자별 턴이다. 현재 장면과 정확히 맞는 음성이
         명시된 경우에만 재생하고, 구형 intro1~5 장문 음성은 쓰지 않는다. */
      if(page.voice) VO.play(page.voice);
    }
    const beats=page.beats&&page.beats.length?page.beats:[{kind:'narration',text:page.text||''}];
    const introBeats=beats.map(personalizedIntroBeat);
    const introRenderOpt=storyPresentationOptions(introBeats,{intro:true});
    const activeSceneKey=beats.slice(0,introTurnIdx+1).reverse().find(beat=>beat.scene)?.scene||page.scene;
    const scene=D.scenes&&D.scenes[activeSceneKey];
    const introImage=$('#intro-img');
    if(introImage.dataset.scene!==activeSceneKey){
      introImage.dataset.scene=activeSceneKey;
      introImage.src=scene||'';
      introImage.classList.remove('intro-scene-cut');
      void introImage.offsetWidth;
      introImage.classList.add('intro-scene-cut');
    }
    introImage.alt=D.sceneDescriptions&&D.sceneDescriptions[activeSceneKey]||`${page.title} 장면`;
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
        introBeats[introTurnIdx],true,dialogueLaneMap(introBeats),introRenderOpt,introBeats[introTurnIdx-1]
      ));
    }else if(introText){
      introText.innerHTML=storyReaderHtml(introBeats,introTurnIdx,introRenderOpt);
    }
    if(page.readingRecord&&introTurnIdx>=introBeats.length-1&&!introText.querySelector('.story-reading-record')){
      introText.insertAdjacentHTML('beforeend',storyRecordHtml(typeof page.readingRecord==='function'?page.readingRecord(S):page.readingRecord));
      const record=introText.querySelector('.story-reading-record');
      record.onclick=e=>e.stopPropagation();
      record.onkeydown=e=>e.stopPropagation();
      record.ontoggle=()=>{if(record.open)clearIntroAuto();};
    }
    const live=$('#story-live'), current=introBeats[Math.min(introTurnIdx,introBeats.length-1)];
    if(live&&current) live.textContent=`${current.kind==='dialogue'?(current.name||speakerInfo(current.who).name)+'의 말: ':'장면 설명: '}${stripTags(current.text)}`;
    $('#intro-hint').textContent='탭하면 다음 말풍선';
    const book=$('#intro-book');
    if(newPage){
      book.style.opacity=0;
      $('#intro-page').scrollTop=0;
      if(introText) introText.scrollTop=0;
      requestAnimationFrame(()=>{ book.style.transition='opacity .45s'; book.style.opacity=1; });
    } else {
      const turn=$('#intro-txt [data-story-entry]:last-child');
      if(turn){
        turn.classList.add('turn-enter');
        requestAnimationFrame(()=>{
          turn.classList.remove('turn-enter');
          if(introText) introText.scrollTo({top:introText.scrollHeight,behavior:'auto'});
        });
      }
    }
    scheduleIntroAuto();
  }
  function startIntroRestart(){
    if(!S) return;
    closeModal('#ovl-menu',false);
    pendingMode='onroad';
    pendingName=G.myName();
    pendingProfile=S.profile||'keeper';
    G.newGame(pendingMode,pendingName,'full',pendingProfile);
    G.save();
    introRestart=true;
    introIdx=0;
    introTurnIdx=0;
    const skip=$('#intro-skip');
    if(skip){ skip.hidden=false; skip.textContent='프롤로그 핵심 요약'; }
    SND.setDriving(false);
    show('scr-intro');
    renderIntro(true);
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
      if(introRestart){
        introRestart=false;
        G.save();
        enterGame();
        return;
      }
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
    if(introRestart){
      introRestart=false;
      S.entryMode=entryMode;
      G.save();
      enterGame();
      return;
    }
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
    const opening=G.openingPending&&G.openingPending();
    if(!S.ended&&opening) showEvent(opening);
    else if(!S.ended&&G.currentCampConversation()&&G.currentCampConversation().active&&G.campConversationEvent()) showEvent(G.campConversationEvent());
    else if(!S.ended&&G.resumePresentation()) return;
    else if(!S.ended&&S.pendingArrival===S.at&&D.nodes[S.at]) onArrive();
    else if(S.at==='seoul'&&S.flags&&S.flags.seoul_open&&!S.ended) setTimeout(showSeoul, 400);   // 서울 안에서 이어하기
    else if(!S.ended&&D.onboardingMission){
      S.flags=S.flags||{};
      if(!S.flags.main_mission_started){
        S.flags.onboarding_mission_seen=true;
        G.save();
        showEvent(D.onboardingMission);
      }
    }
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
    openModal('#ovl-status','#st-x');
  }
  function openFromMenu(sel){
    closeModal('#ovl-menu',false);
    $('#dk-menu').focus({preventScroll:true});
    toggleOvl(sel);
  }
  function openJourneyMap(){
    setDockTab('dk-road');
    if(!$('#ovl-map').classList.contains('on')) toggleOvl('#ovl-map');
    wireRoadTool($('#ovl-map'));
    refreshMapSurface();
    const origin=S.at||(S.driving&&S.driving.from);
    mapKbFocus=origin||null;
    MAPR.selectNode(origin);
    showNodeCard(origin);
  }
  // A quest shortcut opens the existing decision surface; only its own controls act.
  function openQuestAction(action){
    if(!S||S.ended||screen!=='game'||$('#ev-wrap').classList.contains('on')) return {ok:false};
    if(!action||!['route','local','market','crew','seoul'].includes(action.surface)) return {ok:false};
    if(['local','market','seoul'].includes(action.surface)&&S.driving) return {ok:false};
    if(action.surface==='market'&&!D.nodes[S.at]?.stl) return {ok:false};
    if(action.surface==='seoul'&&(S.at!=='seoul'||!S.flags.seoul_open)) return {ok:false};
    for(const selector of ['#ovl-status','#ovl-map','#ovl-menu','#ovl-stl','#ovl-local-actions','#ovl-camp','#ovl-journal','#ovl-seoul'])
      if($(selector)?.classList.contains('on')) closeModal(selector,false);
    setDockTab('dk-road');
    if(action.surface==='crew'){ openStatusTab('crew','dk-crew'); return {ok:true}; }
    if(action.surface==='market'){ showStl(D.nodes[S.at].stl,'market',{previewOnly:true,questId:action.questId}); return {ok:true}; }
    if(action.surface==='seoul'){ showSeoul({previewOnly:true}); return {ok:true}; }
    if(action.surface==='route'&&S.driving){
      openJourneyMap();
      if(D.nodes[action.target]){ MAPR.selectNode(action.target); showNodeCard(action.target); }
      return {ok:true};
    }
    questRouteFocus=action.surface==='route'?action.questId:null;
    questRouteState=S;
    navChoiceGuide='';
    journeyConsoleMode=action.surface==='route'?'route':'local';
    if(action.surface==='local'){restoreJourneyView();journeyConsoleMode='local';stayActionAt=S.at;stayActionId=action.focus||null;}
    $('#stage').style.removeProperty('height');
    renderAll();
    const current=S;
    requestAnimationFrame(()=>{
      if(S!==current) return;
      const target=action.surface==='route'?$('#panel [data-nav-depart]')
        :[...document.querySelectorAll('#panel #journey-mode-local [data-a]')].find(button=>button.dataset.a===action.focus);
      if(target){ target.focus({preventScroll:true}); target.scrollIntoView({block:'nearest'}); }
      scheduleStoppedStageFit();
    });
    return {ok:true};
  }
  function wireMapOpeners(root){
    root.querySelectorAll('[data-open-map]').forEach(control=>{
      control.onclick=event=>{
        event.preventDefault();
        event.stopPropagation();
        openJourneyMap();
      };
      if(control.tagName!=='BUTTON') control.onkeydown=event=>{
        if(event.key!=='Enter'&&event.key!==' ') return;
        event.preventDefault();
        openJourneyMap();
      };
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
  function gauge(id, val, max, warn,resourceKey=''){
    const g=$(id);
    if(!g) return;
    const infinite=resourceKey&&G.isInfiniteResourceMode()&&G.isInfiniteResourceKey(resourceKey);
    g.querySelector('.val').textContent = infinite?'∞':typeof val==='number'? (Math.round(val*10)/10) : val;
    g.querySelector('.bar i').style.width = infinite?'100%':clamp(val/max*100,0,100)+'%';
    g.classList.toggle('warn', !infinite&&warn);
  }
  let pursuitUi=null;
  function pursuitLevel(value){return Math.max(0,Math.min(5,Math.floor(Number(value)||0)));}
  function clearPursuitNotice(){
    if(!pursuitUi) return;
    clearTimeout(pursuitUi.timer);pursuitUi.timer=0;
    if(pursuitUi.notice) pursuitUi.notice.hidden=true;
  }
  function closePursuitHelp(restore=false){
    clearPursuitNotice();
    if(!pursuitUi||pursuitUi.help.hidden) return;
    pursuitUi.help.hidden=true;
    pursuitUi.button.setAttribute('aria-expanded','false');
    if(restore) pursuitUi.button.focus({preventScroll:true});
  }
  function positionPursuitHelp(){
    if(!pursuitUi) return;
    const ui=pursuitUi,root=$('#scr-game').getBoundingClientRect();
    const anchor=ui.button.getBoundingClientRect().top-root.top;
    // Siblings of the clipped scenery, anchored to the actual strip in both travel modes.
    if(!ui.help.hidden){
      ui.help.style.maxHeight=Math.max(72,anchor-16)+'px';
      ui.help.style.top=Math.max(8,anchor-8-ui.help.offsetHeight)+'px';
    }
    if(ui.notice&&!ui.notice.hidden) ui.notice.style.top=Math.max(8,anchor-8-ui.notice.offsetHeight)+'px';
  }
  function renderPursuitIndicator(){
    if(!pursuitUi){
      const button=$('#pursuit-indicator'),help=$('#pursuit-help');
      if(!button||!help) return;
      pursuitUi={button,help,value:$('#pursuit-value'),description:$('#pursuit-description'),pips:[...help.querySelectorAll('.pursuit-pips i')],notice:$('#pursuit-notice'),change:$('#pursuit-change'),level:null,state:S,timer:0};
      button.onclick=()=>{
        if(!help.hidden){closePursuitHelp();return;}
        clearPursuitNotice();
        help.hidden=false;help.scrollTop=0;button.setAttribute('aria-expanded','true');positionPursuitHelp();
      };
      $('#pursuit-help-close').onclick=()=>closePursuitHelp(true);
      document.addEventListener('pointerdown',event=>{
        if(!button.contains(event.target)&&!help.contains(event.target)) closePursuitHelp();
      });
      document.addEventListener('keydown',event=>{
        if(event.key==='Escape'&&!help.hidden){
          event.preventDefault();event.stopImmediatePropagation();closePursuitHelp(true);
        }
      },true);
      window.addEventListener('resize',positionPursuitHelp);
      document.addEventListener('visibilitychange',()=>{if(document.hidden) closePursuitHelp();});
      if(typeof ResizeObserver!=='undefined'){
        const observer=new ResizeObserver(positionPursuitHelp);
        observer.observe($('#stage'));observer.observe($('#journey-vehicle'));
      }
    }
    const ui=pursuitUi,level=pursuitLevel(S.pursuit);
    if(ui.state!==S){closePursuitHelp();ui.state=S;ui.level=null;}
    if(ui.level===level) return;
    const previous=ui.level;
    clearPursuitNotice();
    ui.level=level;ui.button.dataset.level=String(level);ui.help.dataset.level=String(level);ui.value.textContent=String(level);
    ui.button.setAttribute('aria-label',`추적 위험 ${level}/5 · 설명 열기 또는 닫기`);
    ui.pips.forEach((pip,index)=>pip.classList.toggle('on',index<level));
    ui.description.textContent=level===0?'현재 쌓인 관측 표식은 없어요. 이후 행동에 따라 위험이 오를 수 있어요.':level<3?'달구지의 관측 표식이 남아 있어요. 수치가 높을수록 추적 사건을 만날 가능성이 커져요.':level<5?'추적 사건을 만날 가능성이 커지고, 길 위에서 검문을 받을 위험도 생겨요.':'검문 위험이 높아요. 관측 표식 때문에 마을에서 하룻밤 쉬는 것도 거절당해요.';
    if(previous!==null&&level>previous&&ui.notice&&ui.help.hidden&&!document.hidden&&!modalOpen()&&document.documentElement.dataset.routeMap!=='open'){
      ui.change.textContent=`추적 위험 ${previous} → ${level}`;
      ui.notice.dataset.level=String(level);
      void ui.notice.offsetWidth; // Finish the hidden state so a second rise restarts its one-shot fade.
      ui.notice.hidden=false;
      ui.timer=setTimeout(clearPursuitNotice,5000);
    }
    positionPursuitHelp();
  }
  function renderHud(){
    if(!S) return;
    renderPursuitIndicator();
    gauge('#g-fuel', Math.floor(S.fuel), S.fuelMax, S.fuel<10,'fuel');
    gauge('#g-water', S.water, S.waterMax, S.water<=G.partySize(),'water');
    const ration=G.dailyRationInfo();
    gauge('#g-food', S.food, S.foodMax, S.food<G.nextMealInfo().food,'food');
    gauge('#g-van', Math.floor(S.van), S.vanMax, S.van<25);
    gauge('#g-scrap', S.scrap, 40, false,'scrap');
    const clock=G.fmtClock();
    const clockbox=$('#clockbox');
    if(clockbox) clockbox.textContent = clock;
    const wxNow=D.wx[S.wx]||D.wx.clear, wxN=D.wx[S.wxNext]||D.wx.clear;
    const wxbox=$('#wxbox');
    if(wxbox) wxbox.innerHTML = `${ICO('wx_'+S.wx, wxNow.ic+' ')}${wxNow.nm} <span style="opacity:.5">· 내일 ${ICO('wx_'+S.wxNext, wxN.ic)}</span>`;
    const stageFuel=$('#stage-fuel'), stageVan=$('#stage-van'), stageDay=$('#stage-day');
    const stageClock=$('#stage-clock'), stageWeather=$('#stage-weather');
    if(stageFuel) stageFuel.textContent=G.resourceDisplay('fuel',Math.floor(S.fuel),'L');
    if(stageVan) stageVan.textContent=`${Math.floor(S.van)}%`;
    if(stageDay) stageDay.textContent=`DAY ${S.day}`;
    if(stageClock) stageClock.textContent=clock.replace(/^DAY\s+\d+\s*·\s*/,'');
    if(stageWeather) stageWeather.textContent=wxNow.nm;
    const place=$('#journey-place'),date=$('#journey-date'),status=$('#journey-resources');
    if(place) place.textContent=S.driving?[S.driving.from,S.driving.to].map(id=>D.nodes[id]?.name.split(' ')[0]||'').join(' → '):D.nodes[S.at]?.name||'';
    if(date) date.textContent=clock;
    if(status) status.innerHTML=`<span class="${!G.isInfiniteResourceMode()&&S.fuel<10?'is-warning':''}"><i class="trip-symbol trip-fuel" aria-hidden="true"></i>연료 ${G.resourceDisplay('fuel',Math.floor(S.fuel),'L')}</span><span class="${S.van<25?'is-warning':''}"><i class="trip-symbol trip-wrench" aria-hidden="true"></i>차체 ${Math.floor(S.van)}%</span><span>${S.wx==='clear'?'<i class="trip-symbol trip-weather" aria-hidden="true"></i>':ICO('wx_'+S.wx,wxNow.ic)}${esc(wxNow.nm)}</span>`;
    const f=$('#ftgbox'), stg=G.fatigueStage();
    if(f){
      f.style.display='inline';
      f.style.color = stg==='bad'?'var(--danger)': stg==='mid'?'var(--amber)':'var(--faded)';
      f.innerHTML = `${ICO('fatigue_'+stg, G.fatigueFace())} ${Math.floor(S.fatigue)}%`;
    }
    renderDeskRail();
  }

  /* Desktop rail repeats existing journey state, without new mechanics. */
  function renderDeskRail(){
    const rail=$('#desk-rail');
    if(!rail) return;
    if(!S||screen!=='game'||window.innerWidth<1200){ rail.hidden=true; return; }
    rail.hidden=false;
    const t=G.transferStatus();
    const route=G.routeStatus();
    const party=S.party.map(id=>D.comps[id].name);
    rail.innerHTML=`
      <div class="rail-sec"><h4>본편 목표</h4>
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
    const danger=(!G.isInfiniteResourceMode()&&S.fuel<10)||S.fatigue>=75||(q&&!q.noExpiry&&q.due-S.day<=1);
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
      kicker=q.story?`연속 의뢰 · ${q.story.stage}/${q.story.total}`:`${K.nm} · 진행 중`;
      title=G.questLabel(q);
      if(q.kind==='procure'){
        const have=S.items[q.need.name]||0;
        state=`${q.need.name} ${have}/${q.need.qty} · ${D.nodes[q.to].name}에서 전달`;
        pct=Math.min(100,have/q.need.qty*100);
      } else {
        state=`목적지 ${D.nodes[q.to].name} · 사례 고철 ${q.reward}`;
        pct=S.at===q.to?100:S.driving&&S.driving.to===q.to?Math.min(95,S.driving.gone/S.driving.dist*100):24;
      }
      meta=G.questReady()?'전달 가능':q.noExpiry?'기한 없음':`D-${Math.max(0,q.due-S.day)}`;
    } else {
      kicker='본편 · 북쪽으로';
      title=S.driving?`${D.nodes[S.driving.to].name}방면으로 이동 중`:`서울까지 약 ${G.remainKm()}km`;
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
      secondaryMissions.push(`<span class="ms-chip chip-quest">${K.ic} ${q.story?'연속':'게시판'} ${G.questLabel(q)} → ${esc(target.name)} · ${q.noExpiry?'기한 없음':`D-${Math.max(0,q.due-S.day)}`}</span>`);
    }
    if(!rq&&!q){
      const nextMain=G.departureSteps().find(step=>!step.done);
      secondaryMissions.push(`<span class="ms-chip chip-core">🚗 다음 · ${esc(nextMain?nextMain.label:'남산에서 이송 중단')}</span>`);
    }

    const clock=`◎ 본편 · ${esc(transfer.mission)} · 날짜 제한 없음`;
    secondaryMissions.push(`<span class="ms-chip chip-core">${clock}</span>`);
    if(secondaryMissions.length){
      const visibleSecondary=secondaryMissions.slice(-2);
      secondary=`<div class="ms-secondary-wrap"><span class="ms-sec-title">보조 목표 · 최대 2개</span>${visibleSecondary.join('')}</div>`;
    }
    const alerts=[
      !G.isInfiniteResourceMode()&&S.fuel<10?'연료 부족':null,
      S.fatigue>=75?'졸음 위험':null,
      q&&!q.noExpiry&&q.due-S.day<=1?'마감 임박':null,

    ].filter(Boolean);
    alerts.length= alerts.length>0? Math.min(alerts.length,3):0;
    return {danger,secondary:!!secondary, html:`<span class="ms-k">${kicker}</span><span class="ms-title">${title}</span>
      <span class="ms-meta">${meta}${alerts.length?`<br><small class="ms-alert">${alerts.join(' · ')}</small>`:''}</span>
      <span class="ms-state">${state}</span><span class="ms-progress"><i style="width:${pct}%"></i></span>${secondary}`};
  }
  function renderMission(){
    if(!S) return;
    const m=missionHtml();
    ['#mission-strip'].forEach(sel=>{
      const node=$(sel); if(!node) return;
      node.innerHTML=m.html;
      node.classList.toggle('danger',m.danger);
      node.classList.toggle('has-secondary',m.secondary);
    });
    syncRoadJourneyContext();
  }
  function syncRoadJourneyContext(source=$('#mission-strip')){
    const summary=$('#journey-mode-route .nav-route-summary');
    const tracker=$('#road-quest-tracker');
    if(!source||!S) return;
    summary?.querySelector('.nav-journey-context')?.remove();
    const clean=(value,pattern)=>String(value||'').replace(pattern,'').replace(/\s+/g,' ').trim();
    const main=clean(source.querySelector('.chip-core')?.textContent,/^[◎\s]*본편\s*·\s*/)
      .replace(/\s*·\s*날짜 제한 없음$/,'');
    const mainEntry=typeof G.mainQuestEntry==='function'?G.mainQuestEntry():null;
    const mainTitle=mainEntry&&mainEntry.title||main||'남산에서 강제 이송을 멈출 단서를 모은다';
    const mainProgress=mainEntry&&mainEntry.progress&&mainEntry.progress.label||'';
    const mainChapter=mainEntry&&mainEntry.act||'본편';
    if(tracker){
      tracker.hidden=false;
      tracker.innerHTML='<span class="rqt-kicker"><small>메인 스토리 · '+esc(mainChapter)+'</small>'+
        (mainProgress?'<i>'+esc(mainProgress)+'</i>':'')+'</span>'+
        '<b class="rqt-main">'+esc(mainTitle)+'</b>';
      let collapsed=false;
      try{ collapsed=sessionStorage.getItem('caravan-main-story-collapsed')==='1'; }catch(e){}
      const setCollapsed=value=>{
        collapsed=!!value;
        tracker.classList.toggle('is-collapsed',collapsed);
        tracker.setAttribute('aria-expanded',collapsed?'false':'true');
        tracker.setAttribute('aria-label',collapsed?'메인 스토리 열기':'메인 스토리 접기');
        tracker.title=collapsed?'메인 스토리 열기':'메인 스토리 접기';
        try{ sessionStorage.setItem('caravan-main-story-collapsed',collapsed?'1':'0'); }catch(e){}
      };
      tracker.setAttribute('role','button');tracker.tabIndex=0;setCollapsed(collapsed);
      tracker.onclick=()=>setCollapsed(!collapsed);
      tracker.onkeydown=event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();setCollapsed(!collapsed);
      };
    }
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
      postman:'자전거 우편부',
      driver:'운전수', sys:'길 위', record:'기록', unknown:'???', 나:'나'
    };
    const comp=D.comps&&D.comps[key], npc=D.npcs&&D.npcs[key];
    const playerName=key==='me'&&typeof S!=='undefined'&&S&&G.myName?G.myName():'나';
    const registered=D.speakerNames&&D.speakerNames[key];
    const resolvedManual=registered||((typeof manual[key]==='string'&&manual[key])?manual[key]:normalizeUnknown(key));
    return {
      id:key,
      name:label||(key==='me'?playerName:(comp&&comp.name)||(npc&&npc.name)||resolvedManual),
      portrait:D.portraits&&D.portraits[key]||null
    };
  }
  function storyTurnHtml(turn, opt={}){
    const kind=turn.kind||'narration';
    const person=speakerInfo(turn.who,turn.name);
    const isPlayerThought=kind==='thought'&&playerSpeaker(person.id);
    const hasPortrait=!!person.portrait&&!['narration','ai','radio'].includes(kind)&&!isPlayerThought;
    const source={
      narration:'장면', dialogue:'대화', thought:'생각', ai:'AI 방송',
      radio:'라디오', letter:'편지', record:'기록'
    }[kind]||'장면';
    const faceAlt=person.name==='???'?'이름을 모르는 사람':person.name;
    const face=hasPortrait
      ? `<img class="turn-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상" decoding="async">`
      : '';
    const speaker=isPlayerThought
      ? `<div class="turn-source thought-source">생각</div>`
      : ['dialogue','thought','letter'].includes(kind)||(kind==='record'&&hasPortrait)
      ? `<div class="turn-speaker">${face}<span><small>${source}</small><b>${esc(person.name)}</b></span></div>`
      : `<div class="turn-source">${source}${turn.name?` · ${esc(turn.name)}`:''}</div>`;
    return `<article class="story-turn story-entry ${kind}${isPlayerThought?' player-thought':''}${person.name==='???'?' identity-hidden':''}${opt.intro?' intro-turn':''}"
      data-kind="${kind}" data-story-entry>
      ${speaker}<div class="turn-text">${fmt(turn.text||'')}</div></article>`;
  }
  const playerSpeaker=(id)=>['me','player_child','나'].includes(id);
  function storyPresentationOptions(turns,opt={}){
    const speakers=(turns||[]).filter(turn=>turn&&turn.kind==='dialogue')
      .map(turn=>speakerInfo(turn.who,turn.name).id);
    const hasPlayer=speakers.some(playerSpeaker);
    const hasExternal=speakers.some(id=>!playerSpeaker(id));
    return {...opt,playerSolo:hasPlayer&&!hasExternal};
  }
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
    const hasPlayer=speakers.some(item=>playerSpeaker(item.id));
    if(hasPlayer){
      npcSpeakers.forEach(item=>{
        if(!lanes.has(item.key)) lanes.set(item.key,'left');
      });
    }else if(npcSpeakers.length<=2){
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
  if(opt.intro&&person.id==='mother') return 'left';
  if(opt.intro&&person.id==='father') return 'right';
  const key=speakerLaneKey(turn);
  return (lanes&&lanes.get(key))||(playerSpeaker(person.id)?'right':'left');
}
  function chatMessageHtml(turn, newest=false, side='left', opt={}, previous=null){
    const person=speakerInfo(turn.who,turn.name);
    const mine=playerSpeaker(person.id);
    const hidden=person.name==='???';
    /* 화자를 확인할 단서가 없는 인용문은 같은 익명 초상이라는 이유만으로
       직전 NPC의 연속 발화로 합치지 않는다. */
    const continuation=previous&&previous.kind==='dialogue'
      &&!previous.speakerUncertain&&!turn.speakerUncertain
      &&speakerLaneKey(previous)===speakerLaneKey(turn);
    const displayName=hidden&&person.id==='minji'&&opt.surface==='talk'?'소녀':person.name;
    const faceAlt=hidden?'이름을 모르는 사람':displayName;
    const showPortrait=!!person.portrait;
    const portrait=showPortrait
      ? `<img class="chat-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상" decoding="async">`
      : '';
    const face=portrait&&opt.intro
      ? `<span class="intro-portrait-photo">${portrait}<span class="intro-portrait-pin" aria-hidden="true"></span></span>`
      : portrait;
    return `<div class="chat-msg story-entry side-${side} ${mine?'mine':'other'}${hidden?' identity-hidden':''}${continuation?' speaker-continuation':''}${newest?' chat-newest':''}"
      data-kind="dialogue" data-speaker="${esc(person.id||person.name)}" data-side="${side}" data-story-entry>
      ${face}<div class="chat-copy"><b class="chat-name">${esc(displayName)}</b>
      <div class="chat-bubble">${fmt(turn.text||'')}</div></div></div>`;
  }
  function narrationMessageHtml(turn,newest=false,opt={}){
    return `<div class="story-narration story-entry${newest?' narration-newest':''}${opt.intro?' intro-narration':''}"
      data-kind="narration" data-story-entry role="note">
      <span class="story-narration-label">장면</span>
      <div class="story-narration-text">${fmt(turn.text||'')}</div>
    </div>`;
  }
  function storyEntryHtml(turn,newest,lanes,opt={},previous=null){
    if(turn.kind==='action') return `<article class="story-entry story-selected-action" data-story-entry data-kind="action"><small>내가 고른 행동</small><p>${fmt(turn.text)}</p></article>`;
    if(turn.kind==='archive') return storyRecordHtml(turn.text,turn.open,true);
    if(turn.kind==='dialogue') return chatMessageHtml(turn,newest,dialogueSide(turn,lanes,opt),opt,previous);
    if(turn.kind==='narration') return narrationMessageHtml(turn,newest,opt);
    return storyTurnHtml(turn,opt);
  }
  function storyReaderHtml(turns,index,opt={}){
    const safe=Math.min(Math.max(0,index),Math.max(0,turns.length-1));
    const shown=(turns.length?turns:[{kind:'narration',text:'잠시 말이 끊겼다.'}]).slice(0,safe+1);
    const renderOpt=storyPresentationOptions(turns,opt);
    const lanes=renderOpt.lanes instanceof Map?renderOpt.lanes:dialogueLaneMap(turns);
    return `<section class="story-chat story-transcript${renderOpt.intro?' intro-chat':''}" role="group" aria-label="대화 기록">
      ${shown.map((turn,i)=>storyEntryHtml(turn,i===shown.length-1,lanes,renderOpt,shown[i-1])).join('')}</section>`;
  }
  function storyRecordHtml(text,open=false,history=false){
    return text?`<details class="story-reading-record" data-record-history="${history}" ${open?'open':''}><summary>기록 더 읽기</summary><div>${fmt(text)}</div></details>`:'';
  }
  function storyDisplayTurns(state){
    const read=view=>view?.readingPage?StoryPages.readThrough(view.turns,view.readingPage.end):(view?.turns||[]).slice(0,Math.max(0,(view?.index||0)+1));
    if(state.localHistory)return [...state.localHistory,...read(state)];
    if(state.phase!=='outcome') return read(state);
    const history=state.history;
    return [...read(history),
      ...(history?.readingRecord&&(history.readingPage?history.readingPage.end.turn>=history.turns.length:history.index>=history.turns.length-1)?[{kind:'archive',text:history.readingRecord,open:history.recordOpen}]:[]),
      ...(state.selection?[{kind:'action',text:state.selection}]:[]),...read(state)];
  }
  function storyReadingSlice(state){
    return state.readerMode==='review'?storyDisplayTurns(state)
      :state.turns.slice(state.index,state.index+1);
  }
  function setStoryReaderMode(state,mode){
    if(curStory!==state) return;
    state.readerMode=['review','inspection'].includes(mode)?mode:'current';
    state.reviewing=state.readerMode!=='current';
    renderStoryState();
    requestAnimationFrame(()=>$('#ev-sheet .story-reader')?.focus({preventScroll:true}));
  }
  function storyInspectionHtml(state){
    const evidence=state.inspection;
    if(!evidence?.items?.length) return '';
    const chosen=evidence.items.find(item=>item.id===state.inspectionId);
    return `<section class="story-evidence"><h3>${esc(evidence.title)}</h3><p>${esc(evidence.prompt||'')}</p>
      <div class="story-evidence-sources" role="group" aria-label="살펴볼 자료">${evidence.items.map(item=>
        `<button type="button" data-inspect="${esc(item.id)}" aria-pressed="${item.id===chosen?.id}"><span aria-hidden="true">▱</span><b>${esc(item.label)}</b><small>${state.inspectedIds?.includes(item.id)?'살펴봄':'펼쳐 보기'}</small></button>`).join('')}</div>
      <div class="story-evidence-detail" role="status" aria-live="polite">${chosen?`<h4>${esc(chosen.label)}</h4><p>${fmt(chosen.text)}</p>`:'<p>자료를 하나 골라 펼쳐 본다. 언제든 이야기로 돌아갈 수 있다.</p>'}</div></section>`;
  }
  function toggleStoryAuto(state){
    if(curStory!==state)return;
    storyAuto=!storyAuto;
    localStorage.setItem('caravan_story_auto',storyAuto?'1':'0');
    clearStoryAuto();
    wireStoryTools($('#ev-sheet'),state);
    if(storyAuto)scheduleStoryAuto(state,state.turns[state.index]);
    $('#ev-sheet [data-story-auto]')?.focus({preventScroll:true});
  }
  function wireStoryTools(sheet,state){
    // The title stays above the picture; the reading panel owns only the current
    // speech and actions. Keep this outside the scrolling transcript on restore.
    if(sheet.classList.contains('passenger-reader')){
      const heading=sheet.querySelector('.event-head');
      if(heading&&heading.parentElement!==sheet) sheet.prepend(heading);
    }
    let tools=sheet.querySelector('.story-reader-tools');
    if(!tools){tools=document.createElement('nav');tools.className='story-reader-tools';tools.setAttribute('aria-label','이야기 읽기');sheet.querySelector('.event-head')?.appendChild(tools);}
    tools.innerHTML=`<button type="button" data-story-auto aria-pressed="${storyAuto}" aria-label="자동 읽기 ${storyAuto?'끄기':'켜기'}">자동 읽기</button><button type="button" data-reader-mode="review" aria-pressed="${state.readerMode==='review'}">기록</button>${state.inspection?.items?.length?`<button type="button" data-reader-mode="inspection" aria-pressed="${state.readerMode==='inspection'}">자료 살펴보기</button>`:''}`;
    tools.querySelector('[data-story-auto]').onclick=event=>{event.stopPropagation();toggleStoryAuto(state);};
    tools.querySelectorAll('[data-reader-mode]').forEach(button=>button.onclick=event=>{
      event.stopPropagation();setStoryReaderMode(state,button.dataset.readerMode);
    });
    sheet.querySelectorAll('[data-inspect]').forEach(button=>button.onclick=event=>{
      event.stopPropagation();if(curStory!==state)return;
      state.inspectionId=button.dataset.inspect;
      state.inspectedIds=[...new Set([...(state.inspectedIds||[]),state.inspectionId])];
      renderStoryState();
      sheet.querySelector(`[data-inspect="${state.inspectionId}"]`)?.focus({preventScroll:true});
    });
  }
  function placeStoryDock(sheet,state){
    const dock=sheet.querySelector('.event-choice-dock');
    const parent=sheet.dataset.eventKind==='story'?sheet.querySelector('.event-field-report'):sheet;
    if(dock&&parent&&dock.parentElement!==parent) parent.appendChild(dock);
    sheet.classList.remove('choices-embedded');
    sheet.querySelectorAll('.story-reading-record').forEach(record=>{
      const capture=()=>{
        if(curStory!==state||!record.isConnected) return;
        const target=record.dataset.recordHistory==='true'?state.history:state;
        if(target){target.recordOpen=record.open;G.capturePresentationView(state);}
      };
      record.ontoggle=capture;
      record.querySelector('summary').onclick=e=>{
        e.preventDefault();e.stopPropagation();record.open=!record.open;capture();
      };
    });
    sheet.querySelectorAll('[data-result-disclosure]').forEach(record=>{
      const key=record.dataset.resultDisclosure;
      if(!['resultRecordOpen','restoredLineOpen'].includes(key)) return;
      const capture=()=>{
        if(curStory!==state||!record.isConnected) return;
        state[key]=record.open;G.capturePresentationView(state);
      };
      record.ontoggle=capture;
      record.querySelector('summary').onclick=e=>{
        e.preventDefault();e.stopPropagation();record.open=!record.open;capture();
      };
    });
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
    for(const [id,name] of Object.entries(D.speakerNames||{})){
      if(state.candidates.includes(id)) out.push({id,names:[name]});
    }
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
  const speechAttributionVerbs='말|묻|물었|대답|답했|외치|중얼|소리쳤|받았|선언|덧붙|불쑥';
  const recordObjectWords='간판|팻말|표지판|안내판|전광판|계기판|칠판|화면|단말|종이|문구|기록|일지|수첩|메모|원고|장부|명찰|라벨|쪽지|서류|방명록|낙서|글씨|표시';
  const mediaObjectWords='라디오|무전기|수신기|스피커|확성기|방송|녹음|주파수|채널|송신';
  function inferQuoteSpeaker(before, after, evd, state, preferRecord=false, spoken=''){
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
    const verbs=speechAttributionVerbs;
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
    for(const role of anonymousRoles){
      for(const name of role.names){
        if(new RegExp(`^\\s*${name}(?:이|가|은|는)?[^.。!?]{0,24}(?:${verbs})`).test(a)
          ||new RegExp(`${name}(?:이|가|은|는)?[^.。!?]{0,24}(?:${verbs})[^.。!?]{0,8}[.。!?]?\\s*$`).test(b)){
          state.last=role.id;
          return {kind:'dialogue',who:role.id,name};
        }
      }
    }
    const directMedia=new RegExp(`^(?:\\s*)(?:${mediaObjectWords})`).test(a)
      ||new RegExp(`(?:${mediaObjectWords})[^.。!?]{0,36}$`).test(b);
    const directRecord=new RegExp(`^(?:\\s*)(?:${recordObjectWords})`).test(a)
      ||new RegExp(`(?:${recordObjectWords})[^.。!?]{0,36}$`).test(b);
    if(directMedia&&!directRecord){
      state.last='radio';
      state.contextMedium=null;
      return {kind:'radio',who:'radio',name:'라디오'};
    }
    if(directRecord){
      state.last='record';
      return {kind:'record',who:'record',name:'기록'};
    }
    if(state.contextMedium){
      const medium=state.contextMedium;
      state.contextMedium=null;
      state.last=medium;
      return medium==='radio'
        ? {kind:'radio',who:'radio',name:'라디오'}
        : {kind:'record',who:'record',name:'기록'};
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
    /* 단서 없는 문장은 익명 NPC로 시작하되, 질문과 응답이 맞닿은 경우에만
       플레이어/NPC 교환으로 보수적으로 해석한다. 독백을 무조건 교대로
       배치하지 않으며, 이 추론은 continuation에도 사용하지 않는다. */
    const text=stripTags(spoken).trim();
    const previous=state.unresolvedQuote;
    const asksQuestion=value=>/[?？]\s*$/.test(String(value||''));
    let who=state.fallbackSpeaker, name='???';
    if(previous&&playerSpeaker(previous.who)){
      who=state.fallbackSpeaker;
    }else if(previous&&previous.who===state.fallbackSpeaker
      &&(asksQuestion(previous.text)||asksQuestion(text))){
      who='me';
      name='';
    }
    state.last=who;
    state.unresolvedQuote={who,text};
    return {kind:'dialogue',who,...(name?{name}:{}),speakerUncertain:true};
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
      scriptIndex:0,unresolvedQuote:null,contextMedium:null
    };
    const pushNarration=(raw)=>{
      const restored=restore(raw).trim();
      const plainText=stripTags(restored);
      /* 따옴표 사이의 쉼표·대시는 별도 장면 문장도, 화자 전환도 아니다. */
      if(!/[\p{L}\p{N}]/u.test(plainText)) return;
      const nearby=stripTags(restored).slice(-160);
      const mentioned=[...new Set(speakerRegistry(state)
        .filter(item=>!['me','player_child','intro_child'].includes(item.id))
        .filter(item=>item.names.some(name=>nearby.includes(name)))
        .map(item=>item.id))];
      if(mentioned.length===1) state.contextSpeaker=mentioned[0];
      const recordContext=new RegExp(`(?:${recordObjectWords})[^.。!?]{0,52}(?:있|적|쓰|남|붙|표시|멈|마지막|마다|위|아래|끝|:)?[^.。!?]*$`).test(nearby);
      const mediaContext=new RegExp(`(?:${mediaObjectWords})[^.。!?]{0,52}(?:켜|나오|들리|반복|흘러|재생|울리|잡히|말|목소리)[^.。!?]*$`).test(nearby);
      state.contextMedium=recordContext?'record':mediaContext?'radio':null;
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
        /* 명시 화자표가 있는 사건에서는 목적격 조사 뒤의 실제 발화(예: 구령)를
           문구로 오인하지 않는다. 인라인 표기는 데이터에서 「」로 구분한다. */
        if(!isRecord&&!state.turnSpeakers.length&&isInlineQuotedPhrase(spoken,before,after)) continue;
        pushNarration(paragraph.slice(cursor,match.index));
        const scripted=state.turnSpeakers[state.scriptIndex++];
        let speaker;
        if(scripted!==undefined){
          const partySpeaker=(typeof S!=='undefined'&&S&&S.party&&S.party[0])||'me';
          speaker=typeof scripted==='string'
            ? {kind:isRecord?'record':'dialogue',who:scripted==='party_first'?partySpeaker:scripted}
            : {kind:isRecord?'record':'dialogue',...scripted,
              who:scripted.who==='party_first'?partySpeaker:scripted.who};
          state.last=speaker.who;
          state.unresolvedQuote=null;
        }else{
          speaker=inferQuoteSpeaker(before,after,evd,state,isRecord,spoken);
          if(!speaker.speakerUncertain) state.unresolvedQuote=null;
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
    const classes=String(cls||'').split(/\s+/);
    const weatherEntry=Object.entries(D.wx||{}).find(([,weather])=>
      body===weather.nm||body.startsWith(`${weather.nm} —`));
    if(weatherEntry){
      const weather=weatherEntry[1];
      return {kicker:'주행 조건',title:weather.nm,icon:'van',tone:'condition',kind:'condition',body:weather.hint||'현재 도로에 반영된다.'};
    }
    const driverLevel=body.match(/「([^」]+)」/);
    if(classes.includes('skill')||/운전 숙련|연비|운전자/.test(body)) return {
        kicker:'운전 기록',title:driverLevel?`운전 숙련 · ${driverLevel[1]}`:'운전 감각이 쌓였다',icon:'driver',tone:'skill',
      kind:'skill',body:/연비·피로|연비와 피로/.test(body)?'연비와 피로 효율이 개선됐다.':'주행 경험이 다음 운전에 반영된다.'
    };
    const supplyIcons=[
      {match:/점심|아침|저녁|식량|끼니|도시락|먹었|허기/,icon:'food',title:'식량 변화'},
      {match:/식수|수분|마실 물|물을 (마시|채우)|물[ +\-]/,icon:'water',title:'물 변화'},
      {match:/주유|연료|기름/,icon:'fuel',title:'연료 변화'},
      {match:/고철/,icon:'scrap',title:'고철 변화'},
      {match:/부품|정비/,icon:'parts',title:'부품 변화'},
      {match:/의약품|붕대|약품|치료/,icon:'meds',title:'의약품 변화'}
    ];
    const supply=supplyIcons.find(item=>item.match.test(body));
    if(supply) return {kicker:'보급 기록',title:supply.title,icon:supply.icon,tone:'supply',body};
    const cases=[
      {match:/퍼크|습득|상승/,kicker:'SKILL LOG',title:'새로운 감각을 익혔다',icon:'perk',tone:'skill'},
      {match:/발견|지도에 표시|신호|안테나|도청|좌표/,kicker:'ROUTE LOG',title:'길에서 찾은 것',icon:'quest',tone:'discover'},
      {match:/유대|동료|동행|탑승|함께|이야기/,kicker:'CREW LOG',title:'동행 기록',icon:'bond',tone:'crew'},
      {match:/물|식량|연료|고철|부품|의약품|보급/,kicker:'SUPPLY LOG',title:'보급 변화',icon:'parts',tone:'supply'}
    ];
    const found=cases.find(item=>item.match.test(body))||{
      kicker:'주행 기록',title:'길 위의 변화',icon:'van',tone:cls==='discover'?'discover':'road'
    };
    return {...found,kind:'record',body};
  }
  function journeyNoticeHtml(){
    const notice=roadNotice,meal=notice&&notice.body.match(/^(아침 식사|점심 식사|저녁 식사)/);
    const label=meal?`${meal[1]} · ${G.isInfiniteResourceMode()?'소모 없음':'보급 기록'}`:notice?notice.title:'주행 기록';
    return `<button type="button" id="road-notice-slot" class="journey-record-link${notice?' has-update':''}" data-journey-detail="record" aria-haspopup="dialog" aria-controls="journey-detail-dialog" aria-expanded="false"><span aria-live="polite">${esc(label)}</span><span aria-hidden="true">›</span></button>`;
  }
  function setRoadNotice(html,cls,model){
    roadNotice=model||roadNoticeModel(html,cls);
    const current=$('#road-notice-slot');
    if(!current) return;
    current.outerHTML=journeyNoticeHtml();
    const updated=$('#road-notice-slot');
    if(updated) updated.onclick=()=>openJourneyDetail('record',updated);
    rememberRoadNotice();
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
    const plan=typeof G.questNavigationPlan==='function'?G.questNavigationPlan(questRouteFocus):null;
    const guideKey=plan&&plan.key||'main';
    const preferred=typeof G.questPreferredNeighbor==='function'?G.questPreferredNeighbor(routeModels,questRouteFocus):null;
    if(navChoiceAt!==S.at||navChoiceGuide!==guideKey||!routeModels.some(model=>model.nb.id===navChoiceId)){
      navChoiceAt=S.at;
      navChoiceGuide=guideKey;
      navChoiceId=(preferred||routeModels[0]||{}).nb?.id||null;
    }
    return routeModels.find(model=>model.nb.id===navChoiceId)||routeModels[0]||null;
  }
  function routeThumbnail(nodeId){
    const preview=D.nodePreviewScenes&&D.nodePreviewScenes[nodeId];
    if(preview) return preview;
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
  function compactDestinationFact(value,limit=170){
    const text=stripTags(value||'').replace(/\s+/g,' ').trim();
    if(text.length<=limit) return text;
    const head=text.slice(0,limit);
    const sentence=Math.max(head.lastIndexOf('.'),head.lastIndexOf('다.'),head.lastIndexOf('요.'));
    const space=head.lastIndexOf(' ');
    const cut=sentence>limit*.55?sentence+1:(space>limit*.7?space:limit);
    return `${head.slice(0,cut).trim()}…`;
  }
  function destinationKnowledge(nodeId,node){
    const name=String(node&&node.name||'');
    const related=[...(S.notes||[])].reverse().find(note=>{
      const links=Array.isArray(note.links)?note.links.map(String):[];
      const linked=links.some(link=>link&&(name.includes(link)||link.includes(name)));
      return linked||`${note.title||''} ${note.body||''}`.includes(name);
    });
    if(related&&related.body) return compactDestinationFact(related.body);
    const introduction=compactDestinationFact(node&&node.desc||routePlaceDescription(node),150);
    if((S.visited||[]).includes(nodeId)) return `${introduction} 전에 확인한 진입로로 다시 들어간다.`;
    return introduction||'지도에 장소와 진입로가 표시되어 있다.';
  }
  function destinationAction(nodeId,node){
    const routeCue=typeof G.routeQuestCue==='function'?G.routeQuestCue(nodeId,questRouteFocus):null;
    const plan=typeof G.questNavigationPlan==='function'?G.questNavigationPlan():null;
    const cue=routeCue||(plan&&plan.target===nodeId?plan:null);
    if(cue) return {
      kicker:cue.kind==='main'?'메인 스토리':'사이드 미션',
      title:cue.action,
      detail:node.stl?'도착하면 지역 활동과 함께 이어갈 수 있다.':'도착하면 이 장소에서 이어갈 수 있다.'
    };
    if(node.stl) return {
      kicker:'도착하면',title:'사람을 만나고 거래할 수 있다',
      detail:'이곳의 부탁과 소문, 지역 활동도 직접 확인할 수 있다.'
    };
    if(node.type!=='goal') return {
      kicker:'도착하면',title:'주변을 직접 탐색할 수 있다',
      detail:'차를 세운 뒤 남은 구조물과 쓸 만한 물자를 살펴본다.'
    };
    return {
      kicker:'도착하면',title:'이 장소의 다음 행동이 열린다',
      detail:'현재까지 모은 기록을 들고 안으로 들어간다.'
    };
  }
  function destinationPreview(nodeId){
    const node=D.nodes[nodeId]||{};
    if(nodeId==='yangsan')return '무너진 고가 아래를 탐색할 수 있다.';
    if(node.stl)return '사람을 만나고 거래할 수 있다.';
    return node.type==='goal'?'모은 기록을 들고 안으로 향한다.':'남은 구조물과 주변을 탐색할 수 있다.';
  }
  function journeyDetailHtml(){
    return `<dialog id="journey-detail-dialog" class="trip-picker journey-detail" aria-modal="true" aria-hidden="true" aria-labelledby="journey-detail-title">
      <div class="trip-picker-head"><h2 id="journey-detail-title"></h2><button type="button" data-journey-detail-close aria-label="정보 닫기">×</button></div>
      <div class="journey-detail-body"></div></dialog>`;
  }
  function journeyDetailContext(){
    return S.driving?JSON.stringify([S.driving.from,S.driving.to,S.driving.snapshot?.gameMinute]):`at:${S.at}`;
  }
  function rememberRoadNotice(){
    if(!S?.driving)return;
    try{sessionStorage.setItem('caravan-road-notice-v1',JSON.stringify({context:journeyDetailContext(),notice:roadNotice}));}catch(error){}
  }
  function restoreRoadNotice(){
    if(roadNotice||!S?.driving)return;
    try{
      const saved=JSON.parse(sessionStorage.getItem('caravan-road-notice-v1')||'null');
      if(saved?.context===journeyDetailContext()&&typeof saved.notice?.body==='string')roadNotice=saved.notice;
    }catch(error){}
  }
  function rememberJourneyDetail(kind='',nodeId='',scroll=0){
    try{sessionStorage.setItem('caravan-journey-detail-v1',JSON.stringify({context:journeyDetailContext(),kind,nodeId,scroll}));}catch(error){}
  }
  function openJourneyDetail(kind,trigger){
    const dialog=$('#journey-detail-dialog');
    if(!dialog||!S||dialog.open)return;
    const nodeId=trigger?.dataset.placeInfo||S.driving?.to||S.at;
    const node=D.nodes[nodeId];
    if(kind==='place'&&!node)return;
    const body=dialog.querySelector('.journey-detail-body');
    dialog.querySelector('#journey-detail-title').textContent=kind==='place'?node.name:kind==='crew'?'이동 중 동행':'주행 기록';
    if(kind==='place'){
      const src=routeThumbnail(nodeId),action=destinationAction(nodeId,node);
      body.innerHTML=`${src?`<figure><img src="${src}" alt="${esc(node.name)}의 풍경" decoding="async"></figure>`:''}
        <p>${esc(destinationKnowledge(nodeId,node))}</p><h3>${esc(action.kicker)}</h3><p>${esc(action.title)}</p><p>${esc(action.detail)}</p>`;
    }else if(kind==='crew'){
      body.innerHTML=$('#journey-crew-content')?.innerHTML||'<p>지금은 혼자 이동하고 있다.</p>';
      body.querySelectorAll('[data-road-checkin]').forEach(button=>button.onclick=()=>{
        const id=button.dataset.roadCheckin;
        rememberJourneyDetail();dialog.close();
        const result=G.roadCheckIn(id);
        if(!result.ok)toast(result.why);
        renderPanel();renderHud();
        if(!result.ok)$('[data-journey-detail="crew"]')?.focus({preventScroll:true});
      });
    }else{
      body.innerHTML=roadNotice?`<h3>${esc(roadNotice.kicker)} · ${esc(roadNotice.title)}</h3><p>${esc(roadNotice.body)}</p>`:'<p>아직 이 구간의 새 기록이 없다.</p>';
    }
    dialog._returnFocus=trigger;
    dialog.dataset.detailKind=kind;dialog.dataset.placeInfo=nodeId;
    dialog.showModal();dialog.setAttribute('aria-hidden','false');
    trigger?.setAttribute('aria-expanded','true');
    body.scrollTop=0;rememberJourneyDetail(kind,nodeId);
    dialog.querySelector('[data-journey-detail-close]').focus({preventScroll:true});
  }
  function wireJourneyDetails(panel){
    const dialog=panel.querySelector('#journey-detail-dialog');
    if(!dialog)return;
    panel.querySelectorAll('[data-journey-detail]').forEach(button=>button.onclick=()=>openJourneyDetail(button.dataset.journeyDetail,button));
    const body=dialog.querySelector('.journey-detail-body');
    body.onscroll=()=>{if(dialog.open)rememberJourneyDetail(dialog.dataset.detailKind,dialog.dataset.placeInfo,body.scrollTop);};
    dialog.onclose=()=>{
      if(!dialog.isConnected||dialog.open)return;
      dialog.setAttribute('aria-hidden','true');rememberJourneyDetail();
      const back=dialog._returnFocus;dialog._returnFocus=null;
      back?.setAttribute('aria-expanded','false');
      if(back?.isConnected)back.focus({preventScroll:true});
    };
    const dismiss=()=>{rememberJourneyDetail();dialog.close();};
    dialog.querySelector('[data-journey-detail-close]').onclick=dismiss;
    dialog.oncancel=event=>{event.preventDefault();dismiss();};
    dialog.onkeydown=event=>event.stopPropagation();
    dialog.onclick=event=>{
      if(event.target!==dialog)return;
      const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dismiss();
    };
    try{
      if(S.pendingPresentation){rememberJourneyDetail();return;}
      const saved=JSON.parse(sessionStorage.getItem('caravan-journey-detail-v1')||'null');
      if(saved?.context!==journeyDetailContext()||!saved.kind)return;
      const trigger=[...panel.querySelectorAll('[data-journey-detail]')].find(button=>
        button.dataset.journeyDetail===saved.kind&&(saved.kind!=='place'||(button.dataset.placeInfo||S.driving?.to||S.at)===saved.nodeId));
      if(trigger){openJourneyDetail(saved.kind,trigger);body.scrollTop=Number(saved.scroll)||0;}
      else rememberJourneyDetail();
    }catch(error){}
  }
  function journeyDrivingWarning(){
    return [!G.isInfiniteResourceMode()&&S.fuel<5?'연료 부족':'',S.van<30?'차체 위험':'',S.fatigue>=75?'피로 높음':'',S.food<=0||S.water<=0?'보급 부족':'',S.wx==='storm'?'폭풍 주의':''].filter(Boolean).join(' · ');
  }
  function travelDestinationHtml(nodeId,crewContent='',canTalk=false){
    const node=D.nodes[nodeId]||{};
    const remaining=Math.max(0,Math.ceil(S.driving.dist-S.driving.gone));
    return `<section class="journey-deck" data-deck-layout="calm" aria-label="이동 중인 목적지 ${esc(node.name)}">
      <div class="journey-drive-heading"><b>이동 중</b><span id="journey-driving-warning" role="status">${esc(journeyDrivingWarning())}</span></div>
      <div class="journey-driving">
        <div class="journey-place-row"><div class="journey-place-heading"><b>${esc(node.name)}</b><span data-destination-remain>${remaining}km 남음</span></div><p class="journey-place-preview">${esc(destinationPreview(nodeId))}</p></div>
        <div id="travelbar" class="journey-progress" aria-label="현재 주행 진행"></div>
        <div class="journey-travel-actions"><button type="button" id="road-map-open" data-open-map>지도 보기 <span aria-hidden="true">↗</span></button><button type="button" data-journey-detail="place" data-place-info="${esc(nodeId)}" aria-haspopup="dialog" aria-controls="journey-detail-dialog" aria-expanded="false">목적지 정보 <span aria-hidden="true">›</span></button></div>
        <div class="journey-quiet-row">${journeyNoticeHtml()}${crewContent?`<button type="button" class="journey-record-link journey-crew-link" data-journey-detail="crew" aria-haspopup="dialog" aria-controls="journey-detail-dialog" aria-expanded="false">${canTalk?'동료와 대화':'동행 기록'} <span aria-hidden="true">›</span></button>`:''}</div>
      </div>${journeyDetailHtml()}<template id="journey-crew-content">${crewContent}</template></section>`;
  }
  /* Show enough regional relief to recognize the coast. Route pins and names
     remain readable in the canvas; a short hop must not magnify the texture. */
  function routeTerrainStyle(model){
    const from=D.nodes[S.at]||{}, to=D.nodes[model.nb.id]||{};
    const bounds=D.geoBounds||{west:125.7,east:129.7,south:34.65,north:38.55};
    const lon=((Number(from.lon)||bounds.west)+(Number(to.lon)||bounds.east))/2;
    const lat=((Number(from.lat)||bounds.south)+(Number(to.lat)||bounds.north))/2;
    const geoX=Math.max(0,Math.min(1,(lon-bounds.west)/(bounds.east-bounds.west)));
    const geoY=Math.max(0,Math.min(1,(bounds.north-lat)/(bounds.north-bounds.south)));
    /* The narrow viewport needs its crop biased toward the southern edge:
       using the source latitude directly as background-position hides the coast. */
    const imageX=(21+geoX*62).toFixed(1);
    const imageY=Math.min(100,7+geoY*104).toFixed(1);
    const zoom=Math.round(Math.max(120,Math.min(150,160-Number(model.nb.km||0)*.75)));
    return `--route-map-x:${imageX}%;--route-map-y:${imageY}%;--route-map-zoom:${zoom}%`;
  }
  function routeRegionMeta(model){
    const from=D.nodes[S.at]||{}, to=D.nodes[model.nb.id]||{};
    const lat=((Number(from.lat)||35.18)+(Number(to.lat)||35.18))/2;
    const label=lat<35.4?'남해안'
      :lat<36?'영남 내륙'
        :lat<36.45?'중부 내륙'
          :lat<36.85?'충청권'
            :lat<37.2?'경기 남부':'수도권';
    return {label,route:`${from.name||'현재 위치'} → ${to.name||'다음 목적지'}`};
  }
  function tripDestinationPickerHtml(routeModels,selectedId){
    const options=routeModels.map(model=>{
      const {nb,forecast}=model;
      const selected=nb.id===selectedId;
      const blocked=!forecast.ok;
      const status=blocked?'이동 불가':forecast.shortage?'연료 부족':'이동 가능';
      const detail=blocked?(forecast.why||'지금은 이 경로를 이용할 수 없다.')
        :`${Math.round(forecast.minutes)}분 · ${G.isInfiniteResourceMode()?'연료 소모 없음':`연료 ${Math.ceil(model.fuel)}L 필요`}`;
      return `<button type="button" class="trip-route-option" data-trip-route="${esc(nb.id)}" data-availability="${blocked||forecast.shortage?'blocked':'ready'}" aria-pressed="${selected}">
        <span class="trip-option-heading"><b>${esc(D.nodes[nb.id].name)}</b><span>${nb.km}km</span></span>
        <span class="trip-option-detail">${esc(detail)}</span>
        <span class="trip-option-status">${status}${selected?' · 선택됨':''}</span>
      </button>`;
    }).join('');
    return `<dialog id="trip-destination-dialog" class="trip-picker" role="dialog" aria-modal="true" aria-labelledby="trip-picker-title" aria-describedby="trip-picker-hint" aria-hidden="true">
      <div class="trip-picker-head"><div><small>${esc(D.nodes[S.at].name)}에서</small><h2 id="trip-picker-title">다음 목적지</h2></div><button type="button" data-trip-picker-close aria-label="목적지 목록 닫기">×</button></div>
      <div class="trip-picker-list">${options}</div>
      <p id="trip-picker-hint">목적지를 고른 뒤, 출발 버튼으로 이동하세요.</p>
    </dialog>`;
  }
  function routeConsoleHtml(routeModels){
    const selected=routeConsoleModel(routeModels);
    if(!selected) return '<div class="route-empty">지금 이어지는 길이 없다.</div>';
    const node=D.nodes[selected.nb.id], forecast=selected.forecast;
    const canDepart=forecast.ok&&!forecast.shortage;
    const infinite=G.isInfiniteResourceMode();
    const urgent=canDepart?[S.van<30?'차체 수리 권장':'',S.fatigue>=75?'휴식 필요':'',S.wx==='storm'?'폭풍 · 주행 주의':'',(forecast.supplyMargin??0)<0?'식량·물 보급 필요':''].filter(Boolean).join(' · '):'';
    const main=typeof G.mainQuestEntry==='function'?G.mainQuestEntry():null;
    return `<div class="journey-route" data-route-console="${esc(selected.nb.id)}">
      <div class="trip-destination-row">
        <button type="button" class="trip-choice journey-place-choice" data-trip-destination aria-label="다음 목적지 변경, ${esc(node.name)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="trip-destination-dialog"><span class="journey-place-heading"><b>${esc(node.name)}</b><small>변경 <span aria-hidden="true">›</span></small></span><span class="journey-place-preview">${esc(destinationPreview(selected.nb.id))}</span></button>
      </div>
      <div class="trip-forecast" aria-label="선택한 경로의 예상 소모">
        <div class="trip-estimate"><b>${selected.nb.km}km · ${forecast.minutes>0?`${Math.round(forecast.minutes)}분`:'이동 불가'}</b><small>${infinite?'연료 소모 없음':`연료 −${Math.ceil(selected.fuel)}L`}</small></div>
        <button type="button" class="trip-map-toggle" data-route-map-toggle aria-expanded="${routeMapOpen}" aria-controls="journey-route-map">${routeMapOpen?'지도 접기':'지도 보기'} <span aria-hidden="true">↗</span></button>
      </div>
      <button type="button" class="trip-depart" data-nav-depart="${esc(selected.nb.id)}" ${canDepart?'':'disabled aria-describedby="trip-depart-reason"'}>${esc(node.name)}${directionParticle(node.name)} 출발 <span aria-hidden="true">→</span></button>
      <div class="journey-quiet-row">
      <button type="button" class="trip-objective" data-trip-objective><i class="trip-symbol trip-note" aria-hidden="true"></i><span>${!canDepart||urgent?'목표 확인':esc(main&&(typeof QuestJournal!=='undefined'?QuestJournal.entry(main).title:main.title)||'현재 목표 확인하기')}</span><span aria-hidden="true">›</span></button>
      <button type="button" class="journey-place-link" data-journey-detail="place" data-place-info="${esc(selected.nb.id)}" aria-haspopup="dialog" aria-controls="journey-detail-dialog" aria-expanded="false">장소 정보</button>
      ${canDepart&&!urgent?'':`<details class="stay-info journey-warning" name="journey-help"><summary>${!canDepart?(forecast.shortage?'연료 부족':'이동 불가'):esc(urgent.split(' · ')[0])} <span aria-hidden="true">⌄</span></summary><p class="trip-warning" id="trip-depart-reason">${!canDepart?(forecast.shortage?'연료 부족 · 머물기에서 보급하기':esc(forecast.why||'아직 이 경로를 이용할 수 없다.')):esc(urgent)}</p></details>`}
      </div>
      ${tripDestinationPickerHtml(routeModels,selected.nb.id)}
    </div>`;
  }
  function syncRouteMap(routeModels){
    const host=$('#journey-route-map');
    if(!host) return;
    const selected=S?routeConsoleModel(routeModels||[]):null;
    const visible=!!(routeMapOpen&&S&&!S.driving&&journeyConsoleMode==='route'&&selected);
    host.hidden=!visible;
    document.documentElement.dataset.routeMap=visible?'open':'closed';
    rememberJourneyView();
    document.querySelectorAll('[data-route-map-toggle]').forEach(button=>{
      button.setAttribute('aria-expanded',String(visible));
      button.innerHTML=(visible?'지도 접기':'지도 보기')+' <span aria-hidden="true">↗</span>';
    });
    if(!visible) return;
    closePursuitHelp();
    $('#journey-map-context').textContent=`${D.nodes[S.at].name} → ${D.nodes[selected.nb.id].name}`;
    const surface=$('#journey-map-surface');
    surface.style.cssText=routeTerrainStyle(selected);
    $('#journey-map-close').onclick=()=>{routeMapOpen=false;syncRouteMap(routeModels);$('[data-route-map-toggle]')?.focus({preventScroll:true});};
    $('#journey-map-world').onclick=()=>openJourneyMap();
    requestAnimationFrame(()=>drawRouteConsoleMap($('#journey-map-canvas'),routeModels,selected.nb.id));
  }
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&routeMapOpen&&!document.querySelector('.ovl.on,.sheet-wrap.on,[role="dialog"][aria-hidden="false"]')){
      event.preventDefault();routeMapOpen=false;syncRouteMap(journeyRouteModels);
      $('[data-route-map-toggle]')?.focus({preventScroll:true});
    }
  });
  function drawRouteConsoleMap(canvas,routeModels,selectedId){
    if(!canvas||!routeModels.length) return;
    if(typeof MAPR!=='undefined'&&typeof MAPR.drawRegionalRoute==='function'&&MAPR.drawRegionalRoute(canvas,routeModels,selectedId)) return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<20||rect.height<20) return;
    const ratio=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(rect.width*ratio); canvas.height=Math.round(rect.height*ratio);
    const ctx=canvas.getContext('2d');
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const width=rect.width,height=rect.height;
    ctx.clearRect(0,0,width,height);
    /* One active leg over the regional relief: a dark road bed, a readable
       navigation line, and a heading marker. The terrain supplies place while
       the canvas owns live route state. */
    const selectedIndex=Math.max(0,routeModels.findIndex(model=>model.nb.id===selectedId));
    const current={x:width*.18,y:height*.76};
    const selected={x:width*(selectedIndex%2?.74:.78),y:height*(selectedIndex%2?.28:.22)};
    const bends=[current,{x:width*.30,y:height*.66},{x:width*.45,y:height*.58},{x:width*.56,y:height*.43},selected];
    const drawRoute=()=>{ctx.beginPath();bends.forEach((point,index)=>{index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y);});ctx.stroke();};
    ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([]);
    ctx.strokeStyle='rgba(2,7,10,.9)';ctx.lineWidth=7;drawRoute();
    ctx.strokeStyle='rgba(238,177,83,.94)';ctx.lineWidth=3;drawRoute();
    bends.slice(1,-1).forEach(point=>{ctx.fillStyle='#f1c06c';ctx.beginPath();ctx.arc(point.x,point.y,2.2,0,Math.PI*2);ctx.fill();});
    ctx.save();ctx.translate(current.x,current.y);ctx.rotate(-.55);
    ctx.shadowColor='rgba(66,230,210,.8)';ctx.shadowBlur=8;ctx.fillStyle='#55e0c8';ctx.strokeStyle='#d8fffa';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,-6);ctx.lineTo(-2,0);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.strokeStyle='rgba(85,224,200,.74)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(current.x,current.y,12,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffb454';ctx.beginPath();ctx.arc(selected.x,selected.y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,180,84,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(selected.x,selected.y,10,0,Math.PI*2);ctx.stroke();
    const bracket=13,arm=5;ctx.strokeStyle='#ffb454';ctx.lineWidth=2;
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sy])=>{ctx.beginPath();ctx.moveTo(selected.x+sx*bracket,selected.y+sy*(bracket-arm));ctx.lineTo(selected.x+sx*bracket,selected.y+sy*bracket);ctx.lineTo(selected.x+sx*(bracket-arm),selected.y+sy*bracket);ctx.stroke();});
    ctx.font=`700 ${width<300?9:10}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono')||'monospace'}`;
    ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(2,7,10,.9)';ctx.fillStyle='#79e9d6';ctx.textAlign='left';
    ctx.strokeText(D.nodes[S.at].name,current.x+13,current.y+17);ctx.fillText(D.nodes[S.at].name,current.x+13,current.y+17);
    ctx.fillStyle='#ffd08a';ctx.textAlign='right';ctx.strokeText(D.nodes[selectedId].name,selected.x-13,selected.y-15);ctx.fillText(D.nodes[selectedId].name,selected.x-13,selected.y-15);
  }
  function wireRouteConsole(panel,routeModels){
    journeyRouteModels=routeModels;
    const choice=panel.querySelector('[data-trip-destination]');
    const picker=panel.querySelector('#trip-destination-dialog');
    if(choice&&picker){
      choice.onclick=()=>{
        picker.showModal();picker.setAttribute('aria-hidden','false');choice.setAttribute('aria-expanded','true');
        picker.querySelector('[data-trip-route][aria-pressed="true"]')?.focus({preventScroll:true});
      };
      picker.onclose=()=>{picker.setAttribute('aria-hidden','true');choice.setAttribute('aria-expanded','false');};
      picker.querySelector('[data-trip-picker-close]').onclick=()=>picker.close();
      // Native dialog owns focus containment/Escape; don't let the same key
      // also close a regional map underneath it. Neither dismissal selects.
      picker.onkeydown=event=>event.stopPropagation();
      picker.onclick=event=>{
        if(event.target!==picker) return;
        const r=picker.getBoundingClientRect();
        if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) picker.close();
      };
      picker.querySelectorAll('[data-trip-route]').forEach(button=>button.onclick=()=>{
        const id=button.dataset.tripRoute;
        if(!routeModels.some(model=>model.nb.id===id)) return;
        picker.close();navChoiceAt=S.at;navChoiceId=id;renderPanel();
        $('[data-trip-destination]')?.focus({preventScroll:true});
      });
    }
    const toggle=panel.querySelector('[data-route-map-toggle]');
    if(toggle) toggle.onclick=()=>{routeMapOpen=!routeMapOpen;syncRouteMap(routeModels);if(routeMapOpen)$('#journey-map-close').focus({preventScroll:true});};
    const objective=panel.querySelector('[data-trip-objective]');
    if(objective) objective.onclick=()=>$('#dk-objectives').click();
    const depart=panel.querySelector('[data-nav-depart]');
    if(depart) depart.onclick=event=>{
      event.preventDefault();event.stopPropagation();
      const id=depart.dataset.navDepart;depart.disabled=true;
      if(G.startTravel(id)) return;
      depart.disabled=false;
      const check=G.canTravelTo(id);
      toast(check.why||'지금은 이 길로 출발할 수 없다.');renderPanel();
    };
    syncRouteMap(routeModels);
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
    wireMapOpeners(p);
    const where=p.querySelector('[data-a="where"]');
    if(where) where.onclick=()=>openJourneyMap();
    const crew=p.querySelector('[data-a="crew"]');
    if(crew) crew.onclick=()=>{
      stTab='crew';
      if(!$('#ovl-status').classList.contains('on')) toggleOvl('#ovl-status');
      renderStatus();
    };
  }
  function stayActionModel(model){return model;}
  function stayGainLabel(gain){
    if(gain<=0)return '유지';
    return gain<0.1?'+0.1 미만':`+${Number(gain.toFixed(1))}`;
  }
  function stayLabel(action){
    return {explore:'주변 탐색',camp:'야영 준비',repair:'차체 정비',radio:'라디오 수리',stl:'정착지 안으로',walkfuel:'연료 구하기',craft:'작업대',recruitstep:'동료 미션'}[action]||action;
  }
  function stayDetailHtml(model,status=''){
    if(!model)return '<p class="stay-reason">지금 이곳에서 할 수 있는 일이 없다.</p>';
    const facts=(model.chips||[]).filter(Boolean).slice(0,3).map(chip=>typeof chip==='string'?{label:chip}:chip);
    return `${model.disabled?`<p class="stay-reason" id="stay-reason">${esc(model.disabledCta||'지금은 이용 불가')} · 행동 설명에서 확인</p>`:`<div class="stay-facts">${facts.map(f=>`<span><small>${esc(f.label)}</small>${f.value!=null?`<b>${esc(f.value)}</b>`:''}</span>`).join('')}</div>`}
      <div class="stay-execution"><button type="button" class="stay-execute" data-a="${esc(model.action)}" ${model.disabled?'disabled aria-describedby="stay-reason"':''}>${esc(model.disabled?(model.disabledCta||'이용 불가'):stayLabel(model.action))}<span aria-hidden="true">→</span></button>
      </div><div class="journey-quiet-row"><details class="stay-info" name="journey-help"><summary aria-label="선택한 행동 설명">행동 설명 <span aria-hidden="true">⌄</span></summary><p><b>${esc(model.title)}</b><br>${esc(model.description)}</p></details>
      <button type="button" class="journey-place-link" data-journey-detail="place" data-place-info="${esc(S.at)}" aria-haspopup="dialog" aria-controls="journey-detail-dialog" aria-expanded="false">장소 정보</button>
      ${status?`<details class="stay-guest" name="journey-help"><summary>임시 동행 상황</summary>${status}</details>`:''}</div>`;
  }
  function stayChoiceHtml(action,count){
    return `<span>${esc(stayLabel(action))}</span><small>행동 변경 · ${count}가지 <span aria-hidden="true">›</span></small>`;
  }
  function stayConsoleHtml(actions,status){
    if(stayActionAt!==S.at){stayActionAt=S.at;stayActionId=null;}
    if(!actions.some(a=>a.action===stayActionId))stayActionId=actions[0]?.action||null;
    const count=actions.length;
    return `<section class="stay-console" data-stay-count="${count}" aria-label="머물기 행동 선택">
      <div class="trip-destination-row"><button type="button" class="trip-choice" data-stay-choice aria-haspopup="dialog" aria-expanded="false" aria-controls="stay-action-dialog" ${count?'':'disabled'}>${stayChoiceHtml(stayActionId||'지금 가능한 행동 없음',count)}</button></div>
      <div id="stay-detail" class="stay-detail" aria-live="polite">${stayDetailHtml(actions.find(a=>a.action===stayActionId),status)}</div>
      <dialog id="stay-action-dialog" class="trip-picker" aria-modal="true" role="dialog" aria-hidden="true" aria-labelledby="stay-picker-title" aria-describedby="stay-picker-hint">
        <div class="trip-picker-head"><div><small>${esc(D.nodes[S.at].name)}에서</small><h2 id="stay-picker-title">머물며 할 일</h2></div><button type="button" data-stay-picker-close aria-label="행동 목록 닫기">×</button></div>
        <div class="trip-picker-list">${actions.map(a=>`<button type="button" class="trip-route-option" data-stay-select="${esc(a.action)}" aria-pressed="${a.action===stayActionId}" data-availability="${a.disabled?'blocked':'ready'}"><span class="trip-option-heading"><b>${esc(stayLabel(a.action))}</b></span><span class="trip-option-detail">${esc(a.description)}</span><span class="trip-option-status">${esc(a.disabled?(a.disabledCta||'이용 불가'):'선택 후 비용 확인')}</span></button>`).join('')}</div>
        <p id="stay-picker-hint">목록에서는 행동만 고릅니다. 실행 버튼을 눌러 진행하세요.</p>
      </dialog></section>`;
  }
  function wireStayConsole(panel,actions,node,status=''){
    const choices=[...panel.querySelectorAll('[data-stay-select]')],detail=panel.querySelector('#stay-detail');
    const trigger=panel.querySelector('[data-stay-choice]'),picker=panel.querySelector('#stay-action-dialog');
    if(!detail||!trigger||!picker)return;
    trigger.onclick=()=>{
      if(!actions.length)return;
      picker.showModal();picker.setAttribute('aria-hidden','false');trigger.setAttribute('aria-expanded','true');
      choices.find(b=>b.dataset.staySelect===stayActionId)?.focus({preventScroll:true});
    };
    picker.onclose=()=>{
      picker.setAttribute('aria-hidden','true');trigger.setAttribute('aria-expanded','false');
      if(trigger.isConnected)trigger.focus({preventScroll:true});
    };
    picker.querySelector('[data-stay-picker-close]').onclick=()=>picker.close();
    picker.onkeydown=event=>event.stopPropagation();
    picker.onclick=event=>{
      if(event.target!==picker)return;
      const r=picker.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)picker.close();
    };
    const select=button=>{
      if(!actions.some(a=>a.action===button.dataset.staySelect))return;
      stayActionId=button.dataset.staySelect;
      choices.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      detail.innerHTML=stayDetailHtml(actions.find(a=>a.action===stayActionId),status);
      trigger.innerHTML=stayChoiceHtml(stayActionId,actions.length);
      wireStopActionButtons(detail,node);wireJourneyDetails(panel);rememberJourneyView();
      picker.close();
    };
    choices.forEach((b,i)=>{
      b.onclick=()=>select(b);
      b.onkeydown=e=>{
        const delta={ArrowUp:-1,ArrowDown:1}[e.key];
        if(!delta)return;e.preventDefault();
        choices[(i+delta+choices.length)%choices.length].focus({preventScroll:true});
      };
    });
    panel.onkeydown=e=>{
      if(e.key!=='Escape')return;
      const open=panel.querySelector('.journey-mode-panel:not([hidden]) .stay-info[open],.journey-mode-panel:not([hidden]) .stay-guest[open]');
      if(open){e.preventDefault();e.stopPropagation();open.open=false;open.querySelector('summary').focus();}
    };
    wireStopActionButtons(detail,node);
  }
  function journeyModeTabsHtml(mode){
    const modes=[['route','목적지'],['local','머물기']];
    return `<div class="journey-tabs" role="tablist" aria-label="정차 콘솔 모드">${modes.map(([id,label])=>{
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
      /* Give measured spare deck height to scenery. Viewport width lock must not block this. */
    stoppedStageFitFrame=requestAnimationFrame(()=>{
      stoppedStageFitFrame=requestAnimationFrame(()=>{
        stoppedStageFitFrame=0;
        const stage=$('#stage'), panel=$('#panel'), dock=$('#dock');
        const contentEnd=panel&&[...panel.children].reverse().find(node=>node.getClientRects().length);
        if(!stage||!panel||!dock||!contentEnd||!stage.offsetParent||panel.scrollTop>1) return;
        // Both modes fill one reserved console viewport. Their margins and
        // inner scrolling are not spare space that the scenery can reclaim.
        if(contentEnd.classList.contains('journey-mode-console')||contentEnd.classList.contains('journey-deck')) return;
        /* A height-filling console shrinks as the scenery grows. Its negative
           top margin is not spare room: taking it repeatedly collapses the
           scroll viewport on short screens. Keep space needed by its content. */
        const needsScroll=[...contentEnd.querySelectorAll('.route-console-screen,.journey-local-screen')]
          .some(node=>node.getClientRects().length&&node.scrollHeight>node.clientHeight+1);
        if(needsScroll) return;
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
  window.addEventListener('questtrackingchange',()=>{
    questRouteFocus=null;
    navChoiceAt=null; navChoiceGuide='';
    if(S&&!S.driving) renderPanel();
  });
  let bagCompactViewport=innerHeight<=650;
  window.addEventListener('resize',()=>{
    const compact=innerHeight<=650;
    if(compact&&!bagCompactViewport){
      /* Keep the selected item's description visible when a tall bag becomes short.
         Change only the optional disclosure; retain selection, focus and scroll. */
      const meal=$('#status-prop .bag-meal-disclosure');
      if(meal) meal.open=false;
    }
    bagCompactViewport=compact;
    clearTimeout(stoppedStageResizeTimer);
    stoppedStageResizeTimer=setTimeout(()=>{
      resetStoppedStageFit();
      scheduleStoppedStageFit();
      if(routeMapOpen)syncRouteMap(journeyRouteModels);
    },80);
  },{passive:true});
  function wireJourneyMode(panel,routeModels){
    const buttons=[...panel.querySelectorAll('[data-journey-mode]')];
    const select=(button)=>{
      if(!button||button.dataset.journeyMode===journeyConsoleMode) return;
      journeyConsoleMode=button.dataset.journeyMode;
      if(journeyConsoleMode!=='route') routeMapOpen=false;
      document.documentElement.dataset.journeyMode=journeyConsoleMode;
      buttons.forEach(tab=>{
        const active=tab.dataset.journeyMode===journeyConsoleMode;
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex=active?0:-1;
      });
      panel.querySelectorAll('.journey-mode-panel').forEach(modePanel=>{
        modePanel.querySelectorAll('details[open]').forEach(info=>info.open=false);
        const active=modePanel.id===`journey-mode-${journeyConsoleMode}`;
        modePanel.hidden=!active;
        modePanel.setAttribute('aria-hidden',String(!active));
        if(active&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          modePanel.getAnimations().forEach(animation=>animation.cancel());
          modePanel.animate([{opacity:.35},{opacity:1}],{duration:150,easing:'ease-out'});
        }
      });
      // Clear legacy inline geometry; both modes now reserve the same scene height.
      resetStoppedStageFit();
      scheduleStoppedStageFit();
      wireRouteConsole(panel,routeModels||[]);
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
    // Discarding a rerendered picker must also remove it from the native top layer.
    p.querySelectorAll('dialog[open]').forEach(dialog=>{dialog.onclose=null;dialog.close();});
    if(!S){ resetStoppedStageFit(); p.innerHTML=''; return; }
    document.documentElement.classList.add('game-viewport-locked');
    /* 온보딩은 설명을 더 붙이는 대신 아직 필요 없는 정보를 접는다. */
    const journeyStage=(S.stats&&S.stats.km<35)||(S.stats&&S.stats.events<4)?'first'
      :(S.stats&&S.stats.km<110?'learning':'open');
    document.documentElement.dataset.journeyStage=journeyStage;
    document.documentElement.dataset.travelState='stopped';
    document.documentElement.dataset.journeyLayout=S.driving?'driving':'scene';
    document.documentElement.dataset.journeyUi='unified';
    document.documentElement.dataset.journeyDeck='calm';
    document.documentElement.dataset.journeyContinuity='v2';
    if(S.driving){routeMapOpen=false;syncRouteMap([]);}
    if(S.driving){
      resetStoppedStageFit();
      restoreRoadNotice();
      const rq=S.recruitQ&&(S.recruitQ.stage==='road'||(S.recruitQ.id==='minji'&&['follow','ready'].includes(S.recruitQ.stage))
        ||(S.recruitQ.stage==='task'&&S.driving.recruitEscort===S.recruitQ.id))?S.recruitQ:null;
      const def=rq&&D.recruitQuests[rq.id];
      const approach=rq&&G.recruitApproach();
      const taskEscort=!!(rq&&rq.stage==='task');
      const memory=S.driving.recruitMemory;
      const campEchoes=G.campDriveEchoes();
      const choiceMemory=G.pendingChoiceMemory();
      const route=G.routeStatus();
      const routeCard=route&&!route.complete?`<section class="road-guest-card road-memory-card" aria-label="선택한 노선">
        <div class="road-guest-head"><span class="rg-ico">${route.def.mark}</span><span>
          <small>김천에서 고른 길 · 청주까지 고정</small><b>${esc(route.def.name)}</b></span></div>
        <div class="road-guest-help">${esc(route.def.promise)}</div>
        <div class="road-guest-memory"><b>노선 진행 ${route.done}/${route.total}</b> · 청주에서 두 길이 다시 합쳐진다.</div>
      </section>`:'';
      const guest=def?`<section class="road-guest-card" aria-label="${def.name} 달구지 탑승 중, 임시 동행">
        <div class="road-guest-head"><span class="rg-ico">${faceOf(rq.id,D.comps[rq.id]&&D.comps[rq.id].face||def.guest.ic)}</span><span>
          <small>달구지 탑승 중 · 임시 동행</small><b>${esc(def.name)} — ${taskEscort?`${esc(D.nodes[rq.target].name)}까지`:'다음 정차까지'}</b></span></div>
        <div class="road-guest-help">${taskEscort?`같이 타고 이동 중이다. ${esc(D.nodes[rq.target].name)}에 도착하면 ${esc(def.hint)}`:esc(def.guest.desc)}</div>
        ${!taskEscort&&approach?`<div class="road-guest-memory">${memory?.id===rq.id?`${memory.line?`<p>“${esc(memory.line)}”</p>`:''}${esc(memory.desc)}<br><b>${esc(memory.effect)}</b>`:`<b>${esc(approach.label)}</b> · ${esc(approach.memory)}`}</div>`:''}
      </section>`:memory?`<section class="road-guest-card road-memory-card" aria-label="${esc(D.comps[memory.id].name)}의 선택 후속 행동">
        <div class="road-guest-head"><span class="rg-ico">${D.comps[memory.id].face}</span><span>
          <small>함께 고른 방식 · 첫 후속</small><b>${esc(D.comps[memory.id].name)} — ${esc(memory.title)}</b></span></div>
        <div class="road-guest-help">${esc(memory.desc)}</div>
        <div class="road-guest-memory"><b>${esc(memory.effect)}</b> · 이번 주행에 적용된다.</div>
      </section>`:choiceMemory?`<section class="road-guest-card road-memory-card" aria-label="앞서 내린 선택">
        <div class="road-guest-head"><span class="rg-ico">◇</span><span>
          <small>앞서 내린 선택</small><b>${esc(choiceMemory.eventTitle)}</b></span></div>
        <div class="road-guest-help">${esc(choiceMemory.summary)}</div>
      </section>`:'';
      const checkMoment=S.driving.checkInMoment;
      const checkInId=S.driving.checkIn, checkInComp=checkInId&&D.comps[checkInId];
      const roadCheckIn=S.party.length?(checkInComp
        ?`<section class="road-checkin is-complete ${checkMoment?'has-moment':''}" aria-label="${esc(checkInComp.name)}와 이동 중 대화 완료">
          <div class="road-checkin-selected"><span class="road-checkin-face">${faceOf(checkInId,checkInComp.face)}</span><span class="road-checkin-copy">
            <small>이동 중 대화 · 이번 구간 완료</small><b>${esc(checkInComp.name)}와 이야기했다</b>
            <p>${esc(S.driving.checkInSummary||checkMoment?.text||'이번 길에서 잠깐 이야기를 나눴다.')}</p></span></div>
        </section>`
        :`<section class="road-checkin" aria-label="이동 중 동료와 이야기">
          <div class="road-checkin-head"><span><small>이동 중 대화 · 구간당 1회</small><b>누구와 이야기할까?</b></span><em>한 명 선택</em></div>
          <p class="road-checkin-help">잠깐 말을 걸어 보자.</p>
          <div class="road-checkin-list">${S.party.map(id=>`<button type="button" data-road-checkin="${id}" aria-label="${esc(D.comps[id].name)}와 이야기한다"><span class="road-checkin-face">${faceOf(id,D.comps[id].face)}</span><span><b>${esc(D.comps[id].name)}</b><small>이야기</small></span></button>`).join('')}</div>
        </section>`):'';
      const crewContent=`${routeCard}${guest}
        ${campEchoes.length?`<section class="road-guest-card road-memory-card" aria-label="야영에서 이어진 약속"><div class="road-guest-head"><span><small>야영에서 이어진 약속 · 이번 구간</small><b>함께 정한 방식</b></span></div>${campEchoes.map(echo=>`<div class="road-guest-help" data-camp-echo="${esc(echo.cid)}"><b>${esc(D.comps[echo.cid].name)}</b> · ${esc(echo.text)}</div>`).join('')}</section>`:''}
        ${roadCheckIn}`;
      p.innerHTML=travelDestinationHtml(S.driving.to,crewContent.trim(),!!(S.party.length&&!checkInComp));
      renderTravelbar();
      wireContext(p);
      wireJourneyDetails(p);
      return;
    }
    restoreJourneyView();
    const n=D.nodes[S.at];
    document.documentElement.dataset.journeyMode=journeyConsoleMode;
    let localActions=[];
    let recruitStatus='';
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
      /* 아직 실행할 수 없는 임시 동행은 비활성 행동 버튼이 아니라 현재 탑승
         상태로 보여 준다. 플레이어가 "누가 차에 있는지"와 다음 목적지를
         한눈에 읽고, 머물기 행동 네 칸은 실제 행동에만 쓸 수 있게 한다. */
      if(!enabled){
        const target=D.nodes[rq.target];
        const statusTitle=waitNight?`${def.name} · 오늘 함께 머무는 중`
          :road?`${def.name} · 다음 정차까지`
          :`${def.name} · ${target?target.name:'다음 목적지'}까지`;
        const statusHelp=waitNight?`오늘 함께 이동했다. 야영을 마친 뒤 ${def.followHint}`
          :road?def.roadHint:`같이 타고 이동 중이다. 도착하면 ${def.hint}`;
        recruitStatus=`<section class="road-guest-card stop-guest-status" aria-label="${esc(def.name)} 달구지 탑승 중, 임시 동행">
          <div class="road-guest-head"><span class="rg-ico">${faceOf(rq.id,D.comps[rq.id]&&D.comps[rq.id].face||def.guest.ic)}</span><span>
            <small>${waitNight?'같이 머무는 중':'달구지 탑승 중 · 임시 동행'}</small><b>${esc(statusTitle)}</b></span></div>
          <div class="road-guest-help">${esc(statusHelp)}</div>
          <div class="road-guest-memory">정식 합류 전 · 현재 여정에는 함께 있다.</div>
        </section>`;
      } else if(!waitNight){
        localActions.push(stayActionModel({
        action:'recruitstep',kicker:ready?'합류 결정':atFollow?'동행 후속':road?'임시 동행':'동료의 부탁',
        icon:'quest',title:label,description:small,primary:true,disabled:!enabled,
        chips:[enabled?{label:'지금 가능',tone:'ready',icon:'ready'}:{label:road?'다음 주행에서 진행':'다른 시간·장소 필요',tone:'muted',icon:'region'}],
        cta:'진행하기',disabledCta:road?'주행 대기':'진행 대기'
        }));
      }
    }
    if(n.stl) localActions.push(stayActionModel({
      action:'stl',kicker:'주요 정착지',icon:'quest',title:`${n.name} 안으로`,
      description:'사람과 거래하고, 이곳의 부탁과 소문을 직접 확인한다.',primary:true,
      chips:[{label:'거래',icon:'trade'},{label:'대화',icon:'talk'},{label:'지역 활동',icon:'region'}],cta:'정착지 안으로'
    }));
    if(n.type!=='goal'){
      const es=G.exploreStatus();
      const exploreDisabledCta=es.tries>=2?'오늘 탐색 완료'
        :G.isNight()?'야간 탐색 불가'
        :S.fatigue>=80?'휴식 필요':'탐색 불가';
      const exploreFatigue=es.ok?Math.max(1,Math.round(
        es.mins*.045*(1-G.driverLv()*.06)*(G.isInjured('driver')?1.2:1)+es.fatigue
      )):0;
      localActions.push(stayActionModel({
        action:'explore',kicker:es.repeat?'오늘의 마지막 수색':'주변에서',title:'주변 탐색',
        description:es.ok?'직접 둘러본다. 결과는 끝난 뒤 알 수 있다.':es.reason,disabled:!es.ok,
        chips:es.ok?[{label:'시간',value:`+${G.durationLabel(es.mins)}`,tone:'cost',icon:'time'},{label:'피로',value:`약 +${exploreFatigue}`,tone:'cost',icon:'fatigue'},{label:'발견물',value:'미확인',tone:'muted',icon:'discover'}]:[],
        cta:'탐색하기',disabledCta:exploreDisabledCta
      }));
    }
    let campVanFix=4;
    if(G.hasPerk('mj_camp')) campVanFix+=8;
    if(S.up&&S.up.solar) campVanFix+=3;
    const campVanGain=Math.max(0,Math.min(campVanFix,S.vanMax-S.van));
    localActions.push(stayActionModel({
      action:'camp',kicker:'차 안에서',title:'야영 준비',
      description:`저녁·정비·대화를 고른 뒤 쉰다. 다음 날 아침에는 식량 ${G.mealNeed('breakfast')} · 물 ${G.mealNeed('breakfast')}이 필요하다.`,
      chips:[{label:'다음',value:'06:30',tone:'muted',icon:'time'},{label:'피로',value:'→ 0%',tone:'gain',icon:'fatigue'},{label:'차체',value:stayGainLabel(campVanGain),tone:'gain',icon:'van'}],cta:'준비하기'
    }));
    const nbs=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id));
    const routeModels=nbs.map(nb=>({nb,forecast:G.travelForecast(nb.id),fuel:G.fuelFor(nb.km,nb.road)}));
    const preferred=typeof G.questPreferredNeighbor==='function'?G.questPreferredNeighbor(routeModels,questRouteFocus):null;
    if(preferred) routeModels.sort((a,b)=>Number(b.nb.id===preferred.nb.id)-Number(a.nb.id===preferred.nb.id));
    if(!G.isInfiniteResourceMode()&&S.fuel<5) localActions.push(stayActionModel({
      action:'walkfuel',kicker:'연료 비상',title:'걸어서 연료를 구해온다',
      description:'시간과 체력을 크게 소모한다.',chips:[{label:'연료',value:'부족',tone:'danger',icon:'fuel'}],cta:'연료 구하기'
    }));
    if(S.van<S.vanMax-5){
      const hasP=G.hasResource('부품',1);
      const repairGain=S.up&&S.up.sidebox?45:35;
      localActions.push(stayActionModel({
        action:'repair',kicker:'정차 정비',title:'달구지를 정비한다',
        description:hasP?'부품으로 차체를 현장에서 복구한다.':'부품이 없어 지금은 현장 정비를 할 수 없다.',disabled:!hasP,
        chips:hasP?[{label:'부품',value:G.isInfiniteResourceMode()?'∞':S.up&&S.up.sidebox?'최대 -1':'-1',tone:G.isInfiniteResourceMode()?'gain':'cost',icon:'parts'},{label:'시간',value:'+1:40',tone:'cost',icon:'time'},{label:'차체',value:`+${repairGain}`,tone:'gain',icon:'van'}]
          :[{label:'부품',value:'필요',tone:'cost',icon:'parts'}],cta:'정비하기',disabledCta:'부품 필요'
      }));
    }
    if(!S.flags.radio_fixed){ const hasT=G.hasResource('라디오 진공관',1);
      localActions.push(stayActionModel({
        action:'radio',kicker:'차 안에서',title:'라디오를 고친다',
        description:hasT?'진공관을 교체해 주행 중 방송 수신을 되살린다.':'라디오 진공관이 없어 지금은 수리할 수 없다.',disabled:!hasT,
        chips:hasT?[{label:'진공관',value:G.isInfiniteResourceMode()?'∞':'-1',tone:G.isInfiniteResourceMode()?'gain':'cost',icon:'radio'},{label:'시간',value:'+0:40',tone:'cost',icon:'time'},{label:'주행 방송',value:'해금',tone:'gain',icon:'radio'}]
          :[{label:'진공관',value:'필요',tone:'cost',icon:'radio'}],cta:'수리하기',disabledCta:'진공관 필요'
      })); }
    if(S.flags.armed_age) localActions.push(stayActionModel({
      action:'craft',kicker:'차 뒤 칸에서',title:'작업대를 편다',
      description:'무기와 탄을 직접 만든다.',chips:[{label:'시간',value:'약 40분',tone:'cost',icon:'time'},{label:'제작',icon:'craft'}],cta:'작업하기'
    }));
    // All eligible actions live in the picker, never in the scenery's height budget.
    const localActive=journeyConsoleMode==='local';
    const routeActive=journeyConsoleMode==='route';
    const localSection=`<div class="journey-mode-panel" id="journey-mode-local" role="tabpanel" aria-label="머물기" aria-hidden="${!localActive}" ${localActive?'':'hidden'}>${stayConsoleHtml(localActions,recruitStatus)}</div>`;
    const routeSection=`<div class="journey-mode-panel" id="journey-mode-route" role="tabpanel" aria-label="목적지 네비게이션" aria-hidden="${!routeActive}" ${routeActive?'':'hidden'}>${routeConsoleHtml(routeModels)}</div>`;
    const journeyConsole=`<section class="journey-deck" data-deck-layout="calm" aria-label="정차 통합 콘솔">${journeyModeTabsHtml(journeyConsoleMode)}${routeSection}${localSection}${journeyDetailHtml()}</section>`;
    const h=journeyConsole;
    p.innerHTML=h;
    syncRoadJourneyContext();
    wireStayConsole(p,localActions,n,recruitStatus);
    wireContext(p);
    wireJourneyGuide(p);
    wireJourneyMode(p,routeModels);
    wireRouteConsole(p,routeModels);
    wireJourneyDetails(p);
    p.querySelectorAll('[data-go]:not([data-route-select])').forEach(b=>b.onclick=()=>{ G.startTravel(b.dataset.go); });
    scheduleStoppedStageFit();
  }
  function renderTravelbar(){
    const tb=$('#travelbar'); if(!tb||!S.driving) return;
    const d=S.driving, f=Math.max(0,Math.min(1,d.dist>0?d.gone/d.dist:0));
    tb.innerHTML=`<div class="journey-progress-track" role="progressbar" aria-label="이동한 거리" aria-valuemin="0" aria-valuemax="${d.dist}" aria-valuenow="${Math.min(d.dist,Math.max(0,d.gone))}"><i style="width:${f*100}%"></i></div>
      <div class="journey-route-ends"><span>${esc(D.nodes[d.from].name.split(' ')[0])}</span><span>${esc(D.nodes[d.to].name.split(' ')[0])}</span></div>`;
    const destinationRemain=$('[data-destination-remain]');
    if(destinationRemain) destinationRemain.textContent=`${Math.max(0,Math.ceil(d.dist-d.gone))}km 남음`;
    const warning=$('#journey-driving-warning');
    if(warning)warning.textContent=journeyDrivingWarning();
  }
  function renderAll(){
    if(questRouteState!==S){ questRouteFocus=null; questRouteState=S; }
    renderHud(); renderMission(); renderPanel();
  }

  /* ── travel hooks ── */
  function onDepart(){ questRouteFocus=null; roadNotice=null; rememberRoadNotice();rememberJourneyDetail();closeOvl('#ovl-map'); closeOvl('#ovl-stl'); closeOvl('#ovl-local-actions'); renderAll();
    SND.setDriving(true);
    AMBI.depart(S.driving&&S.driving.road); }
  function onArrive(){
    questRouteFocus=null;
    journeyConsoleMode='local';
    roadNotice=null;
    renderAll(); SND.setDriving(false);
    AMBI.arrive(S.at);
    const id=S.at, n=D.nodes[id], portraitKey=D.arrivalScenes&&D.arrivalScenes[id];
    const key=portraitKey||D.nodeScenes&&D.nodeScenes[id];
    const src=key&&D.scenes&&D.scenes[key];
    const recap=S.lastJourneyRecap&&S.lastJourneyRecap.to===id?S.lastJourneyRecap:null;
    const settlement=n.stl&&D.stls[n.stl];
    const major=!!settlement||id==='seoul';
    const places=settlement&&settlement.field&&settlement.field.actions
      .filter(action=>!action.hidden).slice(0,2).map(action=>action.label);
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
    const chapter=recap&&recap.chapter?`<div class="arrival-chapter"><small>여정의 한 장을 마쳤다</small><strong>${esc(recap.chapter.title)}</strong><span>${esc(recap.chapter.text)}</span></div>`:'';
    a.classList.toggle('arrival-major',major);
    a.classList.toggle('arrival-portrait',!!(src&&portraitKey));
    a.classList.toggle('arrival-landscape',!!(src&&!portraitKey));
    if(src) a.style.setProperty('--arrival-image',`url("${src}")`);
    else a.style.removeProperty('--arrival-image');
    a.innerHTML=`${src?`<img class="arrival-art" src="${src}" alt="${esc(n.name)} 도착 풍경">`:'<div class="arrival-fallback" aria-hidden="true"></div>'}<div class="arrival-copy"><div class="arrival-body" tabindex="0" role="region" aria-label="도착 기록"><small>여정 ${S.day}일째 · ${major?'도시 도착':'잠시 정차'}</small><h2 id="arrival-title">${esc(n.name)}</h2><p class="arrival-description">${esc(n.desc)}</p>
      ${places&&places.length?`<div class="arrival-places"><small>둘러볼 곳</small><span>${places.map(esc).join(' · ')}</span></div>`:''}
      ${recap?`<div class="arrival-ledger" aria-label="방금 주행 정산">
        <div><strong>${esc(D.nodes[recap.from]?.name||'이전 정차지')}에서 달려온 길</strong><em>${recap.km}km · ${G.durationLabel(recap.minutes)}</em></div>
        <div class="arrival-deltas">${recapChanges}</div>
        <details class="arrival-details"><summary>이 구간의 기록 펼치기</summary>
        ${contract}
        ${people}
        ${chapter}
        <p>${esc(recap.build)}으로 달렸다${recap.routeCompleted&&recap.routeName?` · ${esc(recap.routeName)} 완주`:''}</p>
        </details>
      </div>`:''}</div><div class="arrival-actions"><button type="button" data-arrival-continue>${settlement?'도시로 들어가기':id==='seoul'?'서울 진입 확인':'정차 지점 살펴보기'}</button>${major?'<small>준비되면 계속하세요</small>':''}</div></div>`;
    clearTimeout(arrivalTimer);
    let dismissed=false;
    const continueArrival=()=>{
      if(dismissed) return;
      dismissed=true; clearTimeout(arrivalTimer);
      closeModal(a,false);
      if(S&&S.pendingArrival===id) G.finishArrival(id);
      requestAnimationFrame(()=>{
        if(!activeModal()) $('#dk-road')?.focus({preventScroll:true});
      });
    };
    a.onclick=null;
    a.querySelector('[data-arrival-continue]').onclick=continueArrival;
    a.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();continueArrival();}};
    openModal(a,'[data-arrival-continue]');
    const hold=uiPrefs.reduceMotion?3200:4300;
    if(!major) arrivalTimer=setTimeout(continueArrival,hold);
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
    wrap.classList.remove('thought-active');
    const b=speechQueue.shift();
    if(!b){ speechBusy=false; return; }
    if(b.drivingOnly&&(!S||!S.driving)){ showNextSpeech(); return; }
    speechBusy=true;
    const isAi = b.who==='cheollian';
    const isNarration = b.who==='sys';
    const isThought = b.who==='나' && /^\s*\([\s\S]*\)\s*$/.test(b.t);
    wrap.classList.toggle('thought-active',isThought);
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
    const face=profile.portrait&&!isAi&&!isNarration&&!isThought&&!isRadio
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
    const noticeModel=roadNoticeModel(normalized,cls);
    if(storyOutcomeIsQuiet(curEv)&&(noticeModel.kind==='skill'||noticeModel.tone==='skill'||/퍼크|특기|레벨|미션 갱신/.test(stripTags(normalized))))return;
    const transientNotice=noticeModel.kind==='condition'||noticeModel.kind==='skill';
    const roadBound=screen==='game'&&S&&S.driving&&!modalOpen()
      &&!severity.some(level=>level==='warn'||level==='danger')&&!transientNotice;
    if(roadBound){ setRoadNotice(normalized,cls,noticeModel); return; }
    const effectiveCls=[cls||'',transientNotice&&!severity.includes(noticeModel.tone)?noticeModel.tone:'']
      .filter(Boolean).join(' ').trim();
    const last=toastQueue[toastQueue.length-1];
    if(last&&last.html===normalized&&last.cls===effectiveCls) return;
    toastQueue.push({html:normalized,cls:effectiveCls});
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
  let storyAuto=localStorage.getItem('caravan_story_auto')==='1', storyAutoTimer=0;
  function combatHudHtml(evd,opt={}){
    const c=evd&&evd.combat;
    if(!c) return '';
    const state=opt.state===undefined?S.combat:opt.state;
    const edge=state?state.edge||0:0;
    const grade=edge>=2?'우세':edge<0?'불리':'팽팽';
    const injuries=Object.keys(S.injuries||{}).length;
    const track=Array.from({length:c.total},(_,i)=>{
      const stateClass=i<c.phase-1?'done':i===c.phase-1?'current':'';
      return `<i class="${stateClass}"></i>`;
    }).join('');
    const history=state&&Array.isArray(state.history)?state.history:[];
    const last=history[history.length-1];
    const terrain=c.terrain||(state&&state.terrain)||'';
    const pressure=state?state.pressure||0:c.pressure||0;
    const authoredKind=(state&&state.kind)||c.kind||'교전';
    const kind=/구조|rescue/.test(`${evd.id} ${c.objective}`)?'구조':/호송|convoy/.test(`${evd.id} ${c.objective}`)?'호송':authoredKind;
    const adapted=!opt.result&&state&&state.adaptedFor===c.threat&&state.adapted;
    const report=opt.ended&&S.lastCombatReport;
    const reportCost=report&&report.costs&&report.costs.length?report.costs.join(' · '):'추가 손실 없음';
    const resultClass=report?` combat-result-${report.resultCode}`:'';
    const reportGain=report&&report.gains&&report.gains.length?report.gains.join(' · '):'추가 획득 없음';
    const screenText = `${esc(kind)} 상황 / 단계 ${c.phase}/${c.total} / 진행 ${grade}${report?` / 결과 ${report.result}`:''}`;
    return `<section class="combat-hud${resultClass}" role="status" aria-live="polite" aria-atomic="true" aria-label="${screenText}">
      <div class="combat-hud-head"><span class="combat-phase"><strong>${c.phase}/${c.total}</strong><small>${opt.result?'선택 결과':esc(kind)}</small></span>
        <b class="combat-step">${c.step}</b><span class="combat-threat">${c.threat}</span></div>
      <div class="combat-objective"><b>${opt.result?(opt.ended?'마침':'결과'):'목표'}</b><span>${opt.result?(opt.ended?'선택의 결과를 확인하고 현장을 마무리한다':'이 선택이 다음 단계의 진행을 바꾼다'):c.objective}</span></div>
      ${!opt.result&&c.intent?`<div class="combat-intent"><b>다음 움직임</b><span>${esc(c.intent)}${adapted?`<small>패턴 변화 · 지난번의 ${esc(adapted)} 타이밍이 달라졌다.</small>`:''}</span></div>`:''}
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
  function choiceActionLabel(choice){
    return String(choice&&choice.label||'')
      .replace(/\s*\([^)]*\)\s*$/,'')
      .trim();
  }
  function eventChoiceData(evd){
    let html='', count=0;
    const combatChoices=[];
    evd.choices.forEach((c,i)=>{
      const req=G.choiceReq(c);
      const requirementVisible=G.reqVisible(req);
      const storyGateKeys=['flag','flags','notFlag','needFlag','story','event','quest','chapter','chain'];
      const spoilerLocked=c.spoiler===true||c.hideLocked===true||c.secret===true
        ||(!requirementVisible&&storyGateKeys.some(key=>req&&req[key]!==undefined));
      if(!requirementVisible&&spoilerLocked) return;
      const rq=G.reqOk(req);
      const cost=G.reqCostText(req);
      const foreseeable=(G.choiceForeseeable?G.choiceForeseeable(c):[]).map(row=>({
        ...row,label:evd.combat?row.label:row.kind==='expense'?'소모':row.kind==='lasting'?'흔적':row.label
      }));
      const forecast=foreseeable.map(row=>`${row.label} · ${row.text}`).join(' / ');
      const listedCost=foreseeable.some(row=>row.kind==='expense')?'':cost;
      const actionLabel=choiceActionLabel(c);
      const routeId=evd.id==='route_mid_fork'
        ?(c.out||[]).map(result=>result.fx&&result.fx.routeChoice).find(Boolean)||null
        :null;
      const route=routeId&&G.routeForecast(routeId);
      const routeBrief=route?`${route.km}km · ${G.durationLabel(route.minutes)} · 연료 약 ${route.fuel}L · ${route.readiness}`:'';
      count++;
      const title=`<span>${safeHtml(actionLabel)}</span>`;
      const liveBits=[
        `${count}번째 선택`,
        stripTags(c.label || ''),
        rq.ok ? '요구사항 충족' : `요구 조건: ${rq.t}`,
        listedCost||'', forecast, routeBrief, evd.campConversation?c.hint||'':''
      ].filter(Boolean);
      html+=`<button class="choice${rq.ok?'':' choice-locked'}" data-i="${i}" ${rq.ok?'':'disabled aria-disabled="true"'} aria-label="${esc(liveBits.join(' · '))}">
          <div class="choice-head"><span class="choice-title">${title}</span></div>
          ${evd.campConversation&&c.hint?`<span class="req">${esc(c.hint)}</span>`:''}
          ${!rq.ok?`<span class="req choice-lock-reason">${esc(rq.t||'요구 조건 미충족')}</span>`:listedCost?`<span class="req choice-requirement">필요 · ${esc(listedCost)}</span>`:''}
          ${evd.combat
            ?(forecast?`<span class="req choice-requirement choice-forecast">${esc(forecast)}</span>`:'')
            :foreseeable.map(row=>`<span class="req choice-requirement choice-forecast"><span class="choice-forecast-label">${esc(row.label)}</span><span>${esc(row.text)}</span></span>`).join('')}
          ${routeBrief?`<span class="req choice-requirement choice-route-forecast">${esc(routeBrief)}</span>`:''}
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
      add(typeof S!=='undefined'&&S&&D.nodeScenes&&D.nodeScenes[S.driving&&S.driving.to||S.at]);
      if(keys.length) return keys;
    }
    add(fallbackType&&D.eventSceneTypes&&D.eventSceneTypes[fallbackType]);
    if(keys.length) return keys;
    add(typeof S!=='undefined'&&S&&D.nodeScenes&&D.nodeScenes[S.driving&&S.driving.to||S.at]);
    if(keys.length) return keys;
    add('generic-story');
    return keys;
  }
  function sceneFormat(key){
    const declared=D.sceneAssetMeta&&D.sceneAssetMeta[key]&&D.sceneAssetMeta[key].format;
    if(declared) return declared;
    if(/^(recruit-|minji-toolbox|parkss-clinic|leo-rooftop-song|jaeyi-ledger|eunsu-last-shift|library-bus)$/.test(key||'')) return 'character';
    if(/^(parents-.*-record|history-parents-network-record|trace-|frequency-tape|postman-letter|grandfather-envelope|family-verification-key|story-generation-form|story-generation-speech)$/.test(key||'')) return 'detail';
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
  function storyOriginHtml(evd){
    const origin=evd&&evd.storyOrigin;
    if(!origin) return '';
    const kind=['memory','record','video','audio','testimony','present'].includes(origin.kind)
      ? origin.kind : 'record';
    const label=String(origin.label||'장면 출처').trim();
    const title=origin.kind==='video'?'':String(origin.title||'').trim();
    return `<div class="story-origin" data-origin-kind="${kind}" aria-label="${esc(label)}${title?' · '+esc(title):''}">
      <span class="story-origin-kind">${esc(label)}</span>${title?`<span class="story-origin-source">${esc(title)}</span>`:''}</div>`;
  }
  function storySceneShot(state,turn,index,format='place'){
    const tone=state.originKind==='memory'?'memory':state.phase==='outcome'?'outcome':'story';
    return {side:'center',tone,x:50,y:50,scale:1};
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
    img.style.objectPosition=D.sceneAssetMeta?.[key]?.objectPosition||'50% 50%';
    const priorKey=frame.dataset.sceneKey;
    const firstRender=frame.dataset.cutToken==='initial';
    const changed=priorKey!==key;
    if(changed&&frame.dataset.shotLock)delete frame.dataset.shotLock;
    // 선택→결과로 이어받은(carry) 장면은 같은 키가 보이는 동안 크롭을 고정한다
    const refreshShot=false;
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
    img.alt=description;
    frame.setAttribute('aria-label',`${description} 크게 보기`);
    img.classList.remove('scene-recut');
    if(changed||refreshShot){
      requestAnimationFrame(()=>{
        if(img.isConnected) img.classList.add('scene-recut');
      });
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
    if(!sheet.classList.contains('passenger-reader')){
      sceneFrame.onclick=()=>sceneFrame.classList.toggle('zoomed');
      return;
    }
    sceneFrame.onclick=null;
    sceneFrame.removeAttribute('role');
    sceneFrame.removeAttribute('tabindex');
    let zoom=sceneFrame.querySelector('button.scene-zoom');
    if(!zoom){
      sceneFrame.querySelector('.scene-zoom')?.remove();
      zoom=document.createElement('button');
      zoom.type='button';zoom.className='scene-zoom';
      sceneFrame.appendChild(zoom);
    }
    const setZoom=expanded=>{
      sceneFrame.classList.toggle('zoomed',expanded);
      zoom.setAttribute('aria-expanded',String(expanded));
      zoom.setAttribute('aria-label',expanded?'그림 닫기':'그림 크게 보기');
      zoom.textContent=expanded?'×':'↗';
      if(expanded) clearStoryAuto();
      else if(curStory) scheduleStoryAuto(curStory,curStory.turns[curStory.index]);
    };
    setZoom(sceneFrame.classList.contains('zoomed'));
    zoom.onclick=event=>{event.preventDefault();event.stopPropagation();setZoom(!sceneFrame.classList.contains('zoomed'));};
    sceneFrame.onkeydown=event=>{
      if(event.key==='Escape'&&sceneFrame.classList.contains('zoomed')){
        event.preventDefault();event.stopPropagation();setZoom(false);zoom.focus({preventScroll:true});
      }
    };
    let next=sceneFrame.querySelector('[data-story-scene-next]');
    if(!next){
      next=document.createElement('button');next.type='button';
      next.className='scene-advance';next.dataset.storySceneNext='';
      next.setAttribute('aria-label','그림을 눌러 다음 대사');
      sceneFrame.insertBefore(next,zoom);
    }
    const state=curStory;
    next.disabled=!state||state.readerMode==='review'||state.readerMode==='inspection'||(state.readingPage?state.readingPage.mode==='actions':state.index>=state.turns.length-1);
    let pointer=null,dragged=false;
    next.onpointerdown=event=>{
      pointer={x:event.clientX,y:event.clientY};dragged=false;
      if(Number.isInteger(event.pointerId)) next.setPointerCapture(event.pointerId);
      if(curStory===state){state.userHoldingStory=true;clearStoryAuto();}
    };
    next.onpointerup=event=>{
      dragged=!!pointer&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>12;pointer=null;
      if(curStory===state){state.userHoldingStory=false;if(dragged)scheduleStoryAuto(state,state.turns[state.index]);}
    };
    next.onpointercancel=()=>{
      pointer=null;dragged=true;
      if(curStory===state){state.userHoldingStory=false;scheduleStoryAuto(state,state.turns[state.index]);}
    };
    next.onlostpointercapture=()=>{if(pointer)next.onpointercancel();};
    next.onclick=event=>{
      event.preventDefault();event.stopPropagation();
      if(dragged){dragged=false;return;}
      if(sceneFrame.classList.contains('zoomed')){setZoom(false);return;}
      if(curStory===state) advanceStory(state);
    };
    next.onkeydown=event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();event.stopPropagation();
      if(event.repeat||heldStoryAdvanceKeys.has(event.code))return;
      heldStoryAdvanceKeys.add(event.code);
      if(sceneFrame.classList.contains('zoomed'))setZoom(false);
      else if(curStory===state)advanceStory(state);
    };
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
    if(state?.readingPage){
      if(curStory!==state||state.readerMode==='review'||state.readerMode==='inspection'||state.readingPage.mode!=='read'||!state._page)return;
      clearStoryAuto();state.reviewing=false;state.userHoldingStory=false;
      if(state._page.done)state.readingPage.mode='actions';
      else{state.readingPage.trail.push({...state.readingPage.cursor});state.readingPage.cursor={...state._page.end};}
      renderStoryState();
      requestAnimationFrame(()=>$('#ev-sheet .story-next,#ev-sheet .choice:not([hidden]):not([disabled])')?.focus({preventScroll:true}));
      return;
    }
    if(!state||curStory!==state||state.readerMode==='review'||state.readerMode==='inspection'||state.index>=state.turns.length-1) return;
    clearStoryAuto();
    const reader=$('#ev-sheet .story-reader');
    // A long speech stays intact. Tapping first reveals its unread lower part;
    // it must never skip the rest just because the picture was tapped.
    if(reader?.closest?.('.passenger-reader')&&reader.scrollHeight-reader.scrollTop-reader.clientHeight>24){
      reader.scrollBy({top:Math.max(80,reader.clientHeight*.75),behavior:'auto'});
      return;
    }
    state.reviewing=false;
    state.userHoldingStory=false;
    state.index++;
    renderStoryState();
    const sheet=$('#ev-sheet');
    /* dataset과 초상 유무에 따라 본문 폭·높이가 다시 계산된 다음 최신 턴을
       보여 줘야 한다. 즉시 스크롤하면 320px 화면에서 이전 높이를 기준으로
       멈춰 새 대사가 종이 아래에 잘린다. */
    requestAnimationFrame(()=>{
      alignStoryLatest(sheet);
      sheet.querySelector('.story-next,.choice:not([disabled])')?.focus({preventScroll:true});
    });
  }
  function scheduleStoryAuto(state,turn){
    clearStoryAuto();
    if(!storyAuto||!state||(state.readingPage?state.readingPage.mode==='actions':state.index>=state.turns.length-1)||state.readerMode==='review'||state.readerMode==='inspection'||state.reviewing||state.userHoldingStory) return;
    const reader=$('#ev-sheet .story-reader');
    if(reader&&reader.scrollHeight-reader.scrollTop-reader.clientHeight>24)return;
    const expectedIndex=state.index, expectedOffset=state.readingPage?.cursor.offset, delay=storyAutoDelay(state._page?{text:state._page.rows.map(row=>row.text).join(' ')}:turn);
    storyAutoTimer=setTimeout(()=>{
      storyAutoTimer=0;
      if(document.hidden||state.reviewing||state.userHoldingStory||$('#ev-sheet .event-scene-frame.zoomed')){
        if(curStory===state&&state.index===expectedIndex) scheduleStoryAuto(state,turn);
        return;
      }
      if(curStory===state&&state.index===expectedIndex&&state.readingPage?.cursor.offset===expectedOffset&&$('#ev-wrap').classList.contains('on'))
        advanceStory(state);
    },delay);
  }
  function wireStoryReviewPause(state,turn){
    const scroll=$('#ev-sheet .story-reader');
    if(!scroll) return;
    let pointerStart=null;
    const reviewPosition=()=>{
      const gap=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight;
      state.reviewing=state.readerMode==='review'||state.readerMode==='inspection'||gap>72;
    };
    const blockedTarget=target=>target instanceof Element&&!!target.closest(
      '.event-scene-frame,button,a,input,textarea,select,details,summary,[role="button"]');
    scroll.onpointerdown=e=>{
      state.userHoldingStory=true;
      clearStoryAuto();
      pointerStart=blockedTarget(e.target)?null:{
        x:e.clientX,y:e.clientY,scrollTop:scroll.scrollTop,index:state.index
      };
    };
    const release=e=>{
      const start=pointerStart;
      pointerStart=null;
      state.userHoldingStory=false;
      reviewPosition();
      const moved=start&&(
        Math.hypot((e?.clientX??start.x)-start.x,(e?.clientY??start.y)-start.y)>12 ||
        Math.abs(scroll.scrollTop-start.scrollTop)>4);
      if(start&&!moved&&(!state.reviewing||scroll.closest?.('.passenger-reader'))
        &&!['review','inspection'].includes(state.readerMode)&&curStory===state&&state.index===start.index){
        if(e){ e.preventDefault(); e.stopPropagation(); }
        state.consumeStoryPointerClick=true;
        setTimeout(()=>{
          if(curStory===state) state.consumeStoryPointerClick=false;
        },0);
        advanceStory(state);
        return;
      }
      if(!state.reviewing) scheduleStoryAuto(state,turn);
    };
    scroll.onpointerup=release;
    scroll.onpointercancel=e=>{ pointerStart=null; release(e); };
    scroll.onscroll=()=>{reviewPosition();if(!state.userHoldingStory&&!state.reviewing)scheduleStoryAuto(state,turn);};
    scroll.onwheel=()=>{
      state.userHoldingStory=true;
      clearStoryAuto();
      requestAnimationFrame(()=>{
        state.userHoldingStory=false;
        reviewPosition();
        if(!state.reviewing) scheduleStoryAuto(state,turn);
      });
    };
    scroll.onkeydown=e=>{
      if((e.key!=='Enter'&&e.key!==' ')||e.repeat||blockedTarget(e.target)) return;
      reviewPosition();
      if(['review','inspection'].includes(state.readerMode)) return;
      if(state.reviewing&&!scroll.closest?.('.passenger-reader')) return;
      e.preventDefault();
      heldStoryAdvanceKeys.add(e.code);
      advanceStory(state);
    };
  }
  function syncEventDockReserve(sheet=$('#ev-sheet')){
    if(!sheet) return 0;
    const dock=sheet.querySelector('.event-choice-dock');
    const visibleDock=dock&&dock.getClientRects().length?dock:null;
    const inline=dock?.closest('.story-transcript');
    const height=visibleDock&&!inline?Math.max(0,Math.ceil(visibleDock.getBoundingClientRect().height)):0;
    const reserve=height+'px';
    sheet.style.setProperty('--event-dock-h',reserve);
    const scroll=sheet.querySelector('.event-scroll');
    const reader=sheet.querySelector('.story-reader');
    const transcript=sheet.querySelector('.story-transcript');
    [scroll,reader,transcript].forEach(node=>{
      if(node) node.style.setProperty('--event-dock-h',reserve);
    });
    if(dock&&sheet.__eventDockObserved!==dock&&window.ResizeObserver){
      if(sheet.__eventDockObserver) sheet.__eventDockObserver.disconnect();
      sheet.__eventDockObserved=dock;
      sheet.__eventDockObserver=new ResizeObserver(()=>syncEventDockReserve(sheet));
      sheet.__eventDockObserver.observe(dock);
    }
    if(visibleDock){
      const settle=()=>{
        if(!sheet.isConnected) return;
        if(!curStory||(!curStory.reviewing&&!curStory.userHoldingStory)) alignStoryLatest(sheet);
      };
      requestAnimationFrame(()=>requestAnimationFrame(settle));
      if(sheet.__storyDockAlignTimer) clearTimeout(sheet.__storyDockAlignTimer);
      sheet.__storyDockAlignTimer=setTimeout(settle,90);
    }
    return height;
  }
  function alignStoryLatest(sheet=$('#ev-sheet')){
    if(!sheet) return false;
    if(sheet.dataset.eventKind!=='combat'){
      syncStoryChoiceDiscovery(sheet);
      return true;
    }
    if(sheet.dataset.eventKind==='combat'&&sheet.dataset.storyStep==='decision'){
      const report=sheet.querySelector('.event-field-report');
      if(report) report.scrollTop=0;
      return true;
    }
    const latest=[...sheet.querySelectorAll('[data-story-entry]')]
      .filter(node=>node.getClientRects().length).at(-1);
    const dock=sheet.querySelector('.event-choice-dock');
    if(!latest||!dock||!dock.getClientRects().length) return false;
    const outer=sheet.querySelector('.event-scroll');
    const reader=latest.closest('.story-reader')||sheet.querySelector('.story-reader');
    const report=sheet.dataset.eventKind==='combat'?sheet.querySelector('.event-field-report'):null;
    const candidates=[report,outer,reader].filter((node,index,list)=>
      node&&list.indexOf(node)===index&&node.scrollHeight>node.clientHeight+1
    ).sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight));
    if(!candidates.length) return false;
    const aligned=()=>{
      const entryRect=latest.getBoundingClientRect();
      const dockRect=dock.getBoundingClientRect();
      return entryRect.bottom<=Math.min(dockRect.top-12,window.innerHeight-6)+.5&&entryRect.top>=6;
    };
    let moved=false;
    for(let pass=0;pass<3&&!aligned();pass++){
      for(const node of candidates){
        const entryRect=latest.getBoundingClientRect();
        const dockRect=dock.getBoundingClientRect();
        const nodeRect=node.getBoundingClientRect();
        const safeBottom=Math.min(dockRect.top-12,nodeRect.bottom-6,window.innerHeight-6);
        const safeTop=Math.max(nodeRect.top+6,6);
        const delta=entryRect.bottom>safeBottom?entryRect.bottom-safeBottom:
          entryRect.top<safeTop?entryRect.top-safeTop:0;
        if(Math.abs(delta)<.5) continue;
        const before=node.scrollTop;
        const max=Math.max(0,node.scrollHeight-node.clientHeight);
        node.scrollTop=Math.max(0,Math.min(max,before+delta));
        if(Math.abs(node.scrollTop-before)>.5) moved=true;
        if(aligned()) break;
      }
    }
    return moved||aligned();
  }
  function syncStoryChoiceDiscovery(sheet=$('#ev-sheet')){
    if(!sheet||sheet.dataset.eventKind!=='story') return;
    const dock=sheet.querySelector('.event-choice-dock');
    const scroll=sheet.classList.contains('passenger-reader')
      ?sheet.querySelector('.event-field-report'):dock;
    const cue=dock&&dock.querySelector('.story-choice-more');
    const choices=dock&&dock.querySelectorAll('.choice[data-i]');
    if(!scroll||!cue||!choices?.length) return;
    const area=scroll.getBoundingClientRect();
    const last=choices[choices.length-1].getBoundingClientRect();
    cue.hidden=last.bottom<=area.bottom+1;
    if(!scroll.__storyChoiceDiscoveryBound){
      scroll.__storyChoiceDiscoveryBound=true;
      scroll.addEventListener('scroll',()=>syncStoryChoiceDiscovery(sheet),{passive:true});
    }
  }
  function wireEventChoicePages(dock){
    if(dock?.closest('[data-reader-layout="pages"]'))return;
    const pager=dock&&dock.querySelector('[data-choice-pages]');
    const buttons=dock?[...dock.querySelectorAll('.choices>.choice[data-i]')]:[];
    /* 선택지는 같은 사건 안에서 한 번에 훑고 스크롤해 고른다.
       이전/다음 페이지 버튼은 흐름만 끊으므로 런타임에서 제거한다. */
    if(pager) pager.remove();
    buttons.forEach(button=>{ button.hidden=false; });
    const continuousList=dock&&dock.querySelector(':scope>.choices');
    if(continuousList) continuousList.scrollTop=0;
    return;
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
    const list=dock.querySelector(':scope>.choices');
    const sync=(focus=false)=>{
      buttons.forEach((button,index)=>{ button.hidden=Math.floor(index/pageSize)!==page; });
      if(list) list.scrollTop=0;
      if(label) label.textContent=String(page+1);
      if(totalLabel) totalLabel.textContent=String(total);
      prev.disabled=page===0;
      next.disabled=page>=total-1;
      pager.setAttribute('aria-label',`선택지 ${page+1} / ${total} 페이지`);
      syncEventDockReserve(sheet);
      if(focus) buttons.find(button=>!button.hidden&&!button.disabled)?.focus({preventScroll:true});
    };
    prev.onclick=()=>{ if(page>0){ page--;sync(true); } };
    next.onclick=()=>{ if(page<total-1){ page++;sync(true); } };
    sync();
  }
  function departureBriefHtml(mission){
    return `<section class="departure-copy" aria-labelledby="mission-purpose">
      <h3 id="mission-purpose">${esc(mission.objective)}</h3>
      <p>${esc(mission.intent)}</p>
      <dl aria-label="북쪽으로 가며 찾아야 할 세 가지">${mission.leads.map(lead=>
        `<div><dt>${esc(lead.name)}</dt><dd>${esc(lead.detail)}</dd></div>`).join('')}</dl>
    </section>`;
  }
  function renderDepartureBrief(sheet,state){
    // A briefing has no transcript/review state, including saves from the old reader.
    state.readerMode='current';state.reviewing=false;state.index=0;
    G.capturePresentationView(state);
    Object.assign(sheet.dataset,{readerMode:'current',storyPhase:'event',storyStep:'decision',storyFinished:'1'});
    sheet.querySelector('.story-reader').innerHTML=state.brief;
    const dock=sheet.querySelector('.event-choice-dock');
    dock.innerHTML=state.finalDock;
    placeStoryDock(sheet,state);
    state.wireFinal(dock);
    const live=$('#story-live');if(live)live.textContent='';
  }
  function pagedStoryHtml(turns){
    let previous=null;
    return `<section class="page-transcript" aria-label="이야기">${turns.map(turn=>{
      if(turn.kind==='archive')return storyRecordHtml(turn.text,turn.open,true);
      const spoken=turn.kind==='dialogue',person=speakerInfo(turn.who,turn.name);
      const same=spoken&&previous&&!turn.speakerUncertain&&!previous.speakerUncertain
        &&speakerLaneKey(previous)===speakerLaneKey(turn)&&previous.name===turn.name;
      const label=spoken?person.name:({thought:'생각',ai:'천리안 방송',radio:'라디오',letter:'편지',record:'기록',action:'내가 고른 행동'}[turn.kind]||'');
      const head=spoken&&!same?`<header class="page-speaker">${person.portrait?`<img src="${person.portrait}" width="48" height="48" alt="" decoding="async">`:''}<b>${esc(label)}</b></header>`
        :!spoken&&label?`<div class="page-source">${esc(label)}</div>`:'';
      if(spoken)previous=turn;
      return `<article class="page-turn" data-story-entry data-kind="${esc(turn.kind)}"${spoken?` data-speaker="${esc(person.id)}"`:''}>${head}<div class="page-text">${fmt(turn.text||'')}</div></article>`;
    }).join('')}</section>`;
  }
  function storyResultPageTurns(state){
    const at=state.readingPage.cursor;
    const rows=state.turns.slice(at.turn).map((row,i)=>({...row,text:i?row.text:StoryPages.slice(row.text,at.offset)}));
    const records=[],changes=[];
    (state.resultChips||[]).forEach(chip=>(/^(?:새 기록|새 소문|본편 단서|기억됨|◈)/.test(stripTags(chip.t||'').trim())?records:changes).push(chip));
    rows.push(...changes.map(chip=>({kind:'summary',text:chip.t})));
    const seen=new Set();(state.quietOutcome?[]:state.questUpdates||[]).forEach(row=>{
      const key=JSON.stringify([row.kind,row.title,row.next]);if(seen.has(key))return;seen.add(key);
      rows.push({kind:'summary',text:row.title+(row.next?'\n'+row.next:'')});
    });
    if(records.length)rows.push({kind:'summary',text:`남겨 둔 기록 ${records.length}개 · ‘기록’에서 다시 볼 수 있다.`});
    return rows;
  }
  function renderPagedStory(state,sheet){
    const reader=sheet.querySelector('.story-reader'),dock=sheet.querySelector('.event-choice-dock');
    const page=state.readingPage||(state.readingPage={cursor:{turn:state.index||0,offset:0},end:{turn:0,offset:0},trail:[],mode:'read',choicePage:0,resultPage:0});
    page.cursor=StoryPages.cursor(state.turns,page.cursor);
    state.index=Math.max(0,Math.min(page.cursor.turn,state.turns.length-1));
    const reviewing=['review','inspection'].includes(state.readerMode);
    state.reviewing=reviewing;sheet.dataset.readerMode=state.readerMode||'current';
    sheet.dataset.storyPhase=state.phase;
    sheet.dataset.storyStep=page.mode==='actions'?(state.phase==='outcome'?'result':'decision'):'beat';
    sheet.dataset.storyFinished=page.mode==='actions'?'1':'0';
    sheet.dataset.pageFallback='';
    reader.tabIndex=0;reader.scrollTop=0;
    reader.onpointerdown=reader.onpointerup=reader.onpointercancel=reader.onscroll=reader.onwheel=reader.onkeydown=null;
    dock.classList.remove('story-progress-dock');
    // The dock belongs to the fixed lower row in this reader, never its transcript.
    const report=sheet.querySelector('.event-field-report');if(dock.parentElement!==report)report.appendChild(dock);
    wireStoryTools(sheet,state);
    const turn=state.turns[state.index];renderStoryScene(state,turn,state.index);
    const fit=rows=>{
      reader.innerHTML=pagedStoryHtml(rows);
      return reader.scrollHeight<=Math.max(80,reader.clientHeight)+1;
    };
    const back=()=>{
      if(page.mode==='actions'){page.mode='read';state.reviewLastPage=true;}
      else if(page.trail.length)page.cursor=page.trail.pop();
      renderStoryState();reader.focus({preventScroll:true});
    };
    if(reviewing){
      reader.innerHTML=state.readerMode==='inspection'?storyInspectionHtml(state):
        (state.brief||'')+pagedStoryHtml(storyDisplayTurns(state))+
        (page.end.turn>=state.turns.length?storyRecordHtml(state.readingRecord,state.recordOpen):'')+
        (state.phase==='outcome'&&page.mode==='actions'?storyCompletedRecordHtml({...state,index:state.turns.length-1})+`<div class="story-result">${storyOutcomeSummaryHtml(state.resultChips||[],state.questUpdates||[],state)}</div>`:'');
      dock.innerHTML='<button class="story-next" type="button" data-reader-close>이야기로 돌아가기</button>';
      dock.querySelector('[data-reader-close]').onclick=e=>{e.stopPropagation();setStoryReaderMode(state,'current');};
      wireStoryTools(sheet,state);placeStoryDock(sheet,state);
    }else if(page.mode==='read'){
      dock.innerHTML=`<nav class="page-navigation">${page.trail.length?'<button type="button" data-page-back>이전</button>':''}<button class="story-next" type="button">계속 읽기</button></nav>`;
      dock.querySelector('[data-page-back]')?.addEventListener('click',back);
      state._page=StoryPages.take(state.turns,page.cursor,fit);
      reader.innerHTML=pagedStoryHtml(state._page.rows);
      const end=state._page.end;
      if(end.turn>page.end.turn||end.turn===page.end.turn&&end.offset>page.end.offset)page.end={...end};
      // A short reaction, result and exit belong together. Only long outcomes
      // need a separate result page; never add an empty acknowledgement step.
      if(state.phase==='outcome'&&state._page.done&&!state.reviewLastPage){
        const readingDock=dock.innerHTML;
        dock.innerHTML=state.finalDock+'<nav class="page-navigation"><button type="button">앞 대사</button></nav>';
        if(fit(storyResultPageTurns(state))){page.mode='actions';page.resultPage=0;renderPagedStory(state,sheet);return;}
        dock.innerHTML=readingDock;reader.innerHTML=pagedStoryHtml(state._page.rows);
        dock.querySelector('[data-page-back]')?.addEventListener('click',back);
      }
      const next=dock.querySelector('.story-next');
      next.textContent=state._page.done?(state.phase==='outcome'?'결과 확인':'선택하기'):'계속 읽기';
      next.onclick=e=>{e.stopPropagation();advanceStory(state);};
      next.onkeydown=e=>{
        if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();e.stopPropagation();
        if(e.repeat||heldStoryAdvanceKeys.has(e.code))return;
        heldStoryAdvanceKeys.add(e.code);advanceStory(state);
      };
      wireStoryReviewPause(state,turn);scheduleStoryAuto(state,turn);
      if(turn&&state.audioIndex!==state.index){state.audioIndex=state.index;if(turn.voice)VO.play(turn.voice);if(turn.sfx)AMBI.play(turn.sfx,.42);}
    }else{
      reader.onpointerdown=reader.onpointerup=reader.onpointercancel=reader.onscroll=reader.onwheel=reader.onkeydown=null;
      dock.innerHTML=state.finalDock;
      normalizeRecruitDecisionDock(dock,state.offerComp);
      state.wireFinal?.(dock);
      dock.querySelector('[data-choice-pages]')?.remove();dock.querySelector('.story-choice-more')?.remove();
      const buttons=[...dock.querySelectorAll('.choices>.choice')];
      const nav=document.createElement('nav');nav.className='page-navigation';
      nav.innerHTML='<button type="button" data-page-back>앞 대사</button><button type="button" data-page-prev>이전 선택지</button><span data-page-count></span><button type="button" data-page-next>다음 선택지</button>';
      dock.appendChild(nav);nav.querySelector('[data-page-back]').onclick=back;
      if(state.phase!=='outcome'){
        // A reminder only; the entire speech has already been read. It yields
        // room to all choice text, never conceals a cost or disabled reason.
        const last=state.turns.at(-1);reader.innerHTML=pagedStoryHtml(last?[last]:[]);
      }
      const groups=[];let group=[];
      buttons.forEach(button=>button.hidden=true);
      for(const button of buttons){
        button.hidden=false;
        if(state.phase==='event'&&group.length&&(dock.getBoundingClientRect().height>report.clientHeight-100||group.length>=3)){
          group.forEach(b=>b.hidden=true);groups.push(group);group=[];
        }
        group.push(button);
      }
      if(group.length)groups.push(group);
      const sync=()=>{
        page.choicePage=Math.min(page.choicePage,Math.max(0,groups.length-1));
        buttons.forEach(b=>b.hidden=!groups[page.choicePage]?.includes(b));
        nav.querySelector('[data-page-prev]').hidden=groups.length<2;
        nav.querySelector('[data-page-next]').hidden=groups.length<2;
        nav.querySelector('[data-page-prev]').disabled=page.choicePage===0;
        nav.querySelector('[data-page-next]').disabled=page.choicePage===groups.length-1;
        nav.querySelector('[data-page-count]').textContent=groups.length>1?`${page.choicePage+1} / ${groups.length}`:'';
        if(state.phase==='event'){
          // Reserve the continuation note while fitting, rather than append a
          // new line after using all the available space.
          const note='<span class="page-reminder-more">앞 대사에서 전체 보기</span>';
          const last=state.turns.at(-1),reminder=StoryPages.take(last?[last]:[],{turn:0,offset:0},rows=>{
            reader.innerHTML=pagedStoryHtml(rows)+note;return reader.scrollHeight<=reader.clientHeight+1;
          });
          reader.innerHTML=pagedStoryHtml(reminder.rows)+(reminder.done?'':note);
        }else{
          // The receipt is read-only. Long result summaries get pages too;
          // expandable records remain available from the explicit 기록 view.
          const rows=storyResultPageTurns(state);
          const pages=[];let at={turn:0,offset:0};
          do{const part=StoryPages.take(rows,at,fit);pages.push(part);at=part.end;if(part.done)break;}while(at.turn<rows.length);
          page.resultPage=Math.min(page.resultPage||0,pages.length-1);
          reader.innerHTML=pagedStoryHtml(pages[page.resultPage].rows);
          nav.querySelector('[data-page-prev]').hidden=pages.length<2;
          nav.querySelector('[data-page-next]').hidden=pages.length<2;
          nav.querySelector('[data-page-prev]').textContent='이전 결과';
          nav.querySelector('[data-page-next]').textContent='다음 결과';
          nav.querySelector('[data-page-prev]').disabled=page.resultPage===0;
          nav.querySelector('[data-page-next]').disabled=page.resultPage===pages.length-1;
          nav.querySelector('[data-page-count]').textContent=pages.length>1?`${page.resultPage+1} / ${pages.length}`:'';
        }
        G.capturePresentationView(state);
      };
      nav.querySelector('[data-page-prev]').onclick=()=>{if(state.phase==='outcome')page.resultPage--;else page.choicePage--;sync();};
      nav.querySelector('[data-page-next]').onclick=()=>{if(state.phase==='outcome')page.resultPage++;else page.choicePage++;sync();};sync();
      placeStoryDock(sheet,state);
      if(!buttons.length&&!dock.querySelector('.onboarding-route-start')){
        const exit=document.createElement('button');exit.className='story-next';exit.textContent='길로 돌아가기';exit.onclick=()=>closeEvent();dock.appendChild(exit);
      }
    }
    wireSceneZoom(sheet);
    const live=$('#story-live');if(live)live.textContent=reviewing?'':stripTags(reader.textContent);
    G.capturePresentationView(state);
    // No clipping at exceptional zoom or a single oversized action. Ordinary
    // reading is measured into pages; only this explicit fallback may scroll.
    if(!reviewing&&reader.scrollHeight>reader.clientHeight+2)sheet.dataset.pageFallback='reader';
    if(!reviewing&&dock.getBoundingClientRect().height>report.clientHeight-44)sheet.dataset.pageFallback='actions';
    if(!sheet.__pageObserver&&window.ResizeObserver){
      let last='';sheet.__pageObserver=new ResizeObserver(()=>{
        const signature=[sheet.clientWidth,sheet.clientHeight,getComputedStyle(sheet).getPropertyValue('--reading-body-size')].join(':');
        if(signature===last)return;last=signature;
        requestAnimationFrame(()=>{if(curStory&&sheet.dataset.readerLayout==='pages'&&sheet.classList.contains('passenger-reader'))renderStoryState();});
      });sheet.__pageObserver.observe(sheet);
      document.fonts?.ready.then(()=>{if(curStory&&sheet.dataset.readerLayout==='pages'&&sheet.classList.contains('passenger-reader'))renderStoryState();});
    }
  }
  function renderStoryState(){
    const state=curStory, sheet=$('#ev-sheet');
    if(!state||!sheet) return;
    clearStoryAuto();
    if(sheet.dataset.missionLayout==='departure'){renderDepartureBrief(sheet,state);return;}
    if(sheet.dataset.readerLayout==='pages'){renderPagedStory(state,sheet);return;}
    G.capturePresentationView(state);
    const reader=sheet.querySelector('.story-reader');
    const dock=sheet.querySelector('.event-choice-dock');
    const turn=state.turns[Math.min(state.index,state.turns.length-1)];
    const reviewing=state.readerMode==='review'||state.readerMode==='inspection';
    state.reviewing=reviewing;
    sheet.dataset.readerMode=state.readerMode||'current';
    const displayed=sheet.dataset.eventKind==='combat'?storyDisplayTurns(state):storyReadingSlice(state);
    const storyRenderOpt=storyPresentationOptions(displayed,{lanes:state.lanes,surface:sheet.dataset.storySurface});
    reader.tabIndex=0;
    if(dock.closest('.story-transcript')) sheet.appendChild(dock);
    reader.innerHTML=state.readerMode==='inspection'?storyInspectionHtml(state)
      :(!reviewing&&storyCompletedRecordHtml(state))||storyReaderHtml(displayed,displayed.length-1,storyRenderOpt);
    if(!reviewing&&state.brief)reader.insertAdjacentHTML('afterbegin',state.brief);
    if(!reviewing&&state.phase==='outcome'&&state.selection&&!sheet.dataset.storySurface)reader.insertAdjacentHTML('afterbegin',`<p class="story-current-selection">내 선택 · ${esc(state.selection)}</p>`);
    reader.scrollTop=0;
    wireStoryTools(sheet,state);
    renderStoryScene(state,turn,state.index);
    const last=state.index>=state.turns.length-1;
    sheet.dataset.storyPhase=state.phase;
    sheet.dataset.storyStep=state.phase==='outcome'?'result':last?'decision':'beat';
    sheet.dataset.storyFinished=last?'1':'0';
    const report=sheet.querySelector('.event-field-report');
    if(sheet.dataset.eventKind==='story'&&report) report.scrollTop=0;
    sheet.dataset.storyTurn=turn&&turn.kind||'narration';
    const portraitSpeaker=turn&&speakerInfo(turn.who,turn.name);
    sheet.dataset.storyPortrait=portraitSpeaker&&portraitSpeaker.portrait&&!['narration','ai','radio'].includes(turn.kind)?'1':'0';
    const sceneNext=sheet.querySelector('[data-story-scene-next]');
    if(sceneNext) sceneNext.disabled=reviewing||last;
    const progress=sheet.querySelector('[data-event-progress]');
    if(progress) progress.textContent=state.phase==='outcome'
      ? `결과 · ${state.index+1} / ${state.turns.length}`
      : `${state.index+1} / ${state.turns.length}`;
    const live=$('#story-live');
    if(live&&turn){
      const speaker=turn.kind==='dialogue'?(turn.name||speakerInfo(turn.who).name)+'의 말: '
        :turn.kind==='narration'?'장면 설명: ':`${state.label}: `;
      live.textContent=speaker+stripTags(turn.text);
    }
    if(reviewing){
      if(state.readerMode==='review'&&state.readingRecord&&state.index>=state.turns.length-1)
        reader.querySelector('.story-transcript').insertAdjacentHTML('beforeend',storyRecordHtml(state.readingRecord,state.recordOpen));
      dock.innerHTML='<button class="story-next" type="button" data-reader-close><strong>이야기로 돌아가기</strong></button>';
      dock.querySelector('[data-reader-close]').onclick=event=>{event.stopPropagation();setStoryReaderMode(state,'current');};
      placeStoryDock(sheet,state);
      reader.onpointerdown=reader.onpointerup=reader.onpointercancel=reader.onscroll=reader.onwheel=reader.onkeydown=null;
      return;
    }
    if(turn&&state.audioIndex!==state.index){
      state.audioIndex=state.index;
      if(turn.voice) VO.play(turn.voice);
      if(turn.sfx) AMBI.play(turn.sfx,.42);
    }
    const compact=false;
    sheet.classList.toggle('story-compact',compact);
    const entering=reader.querySelector('[data-story-entry]:last-child');
    if(entering){
      entering.classList.add('turn-enter');
      requestAnimationFrame(()=>entering.classList.remove('turn-enter'));
    }
    /* 새 말이 추가되면 마지막 말풍선 전체가 보이도록 사건 내부만 움직인다.
       사용자가 앞 대사를 다시 읽는 중에는 위치를 빼앗지 않는다. */
    requestAnimationFrame(()=>{
      if(!state.reviewing&&!state.userHoldingStory) alignStoryLatest(sheet);
    });
    if(!last){
      dock.classList.add('story-progress-dock');
      dock.innerHTML=`<button class="story-next" type="button" aria-label="다음 문장. 화면을 탭하거나 Enter 또는 Space 키를 누르세요"><strong>${sheet.dataset.eventKind==='story'?'화면을 눌러 계속':'다음'}</strong><span class="req">${state.index+1}/${state.turns.length} · 화면 탭도 가능</span></button>`;
      const nextButton=dock.querySelector('.story-next');
      nextButton.onclick=event=>{event.stopPropagation();advanceStory(state);};
      nextButton.onkeydown=event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();event.stopPropagation();
        if(event.repeat||heldStoryAdvanceKeys.has(event.code))return;
        heldStoryAdvanceKeys.add(event.code);advanceStory(state);
      };
      placeStoryDock(sheet,state);
      syncEventDockReserve(sheet);
      wireStoryReviewPause(state,turn);
      scheduleStoryAuto(state,turn);
      return;
    }
    const storyScroll=sheet.querySelector('.story-reader');
    if(storyScroll){
      storyScroll.onpointerdown=null;
      storyScroll.onpointerup=null;
      storyScroll.onpointercancel=null;
      storyScroll.onscroll=null;
      storyScroll.onwheel=null;
      storyScroll.onkeydown=null;
    }
    dock.classList.remove('story-progress-dock');
    const log=reader.querySelector('.story-transcript');

    if(state.phase==='outcome') log.insertAdjacentHTML('beforeend',`<div class="story-result event-result-inline${sheet.dataset.eventKind==='story'?' story-result-quiet':''}" role="status" aria-live="polite" aria-atomic="true"></div>`);
    dock.innerHTML=state.finalDock;
    normalizeRecruitDecisionDock(dock,state.offerComp);
    if(state.offerComp) state.finalDock=dock.innerHTML;
    if(state.phase==='event'&&!dock.querySelector('.choice[data-i],.onboarding-route-start')){
      dock.innerHTML=`<div class="choices" role="group" aria-label="다음 행동"><button class="choice story-safe-exit" type="button"><div class="choice-head"><span class="choice-title"><span>지금은 대응할 수 없다. 길로 돌아간다</span></span></div></button></div>`;
      dock.querySelector('.story-safe-exit').onclick=()=>closeEvent();
    }
    syncEventDockReserve(sheet);
    if(state.phase==='outcome') requestAnimationFrame(()=>alignStoryLatest(sheet));
    if(state.reveal){ state.revealed=true; state.reveal(); }
    if(state.wireFinal) state.wireFinal(dock);
    placeStoryDock(sheet,state);
    syncEventDockReserve(sheet);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      syncEventDockReserve(sheet);
      if(!state.reviewing&&!state.userHoldingStory) alignStoryLatest(sheet);
    }));
  }
  function finishStory(){
    if(!curStory) return false;
    if(curStory.readingPage){curStory.readingPage.mode='actions';curStory.readingPage.end={turn:curStory.turns.length,offset:0};}
    curStory.index=Math.max(0,curStory.turns.length-1);
    renderStoryState();
    return true;
  }
  function showEvent(evd){
    clearStoryAuto();
    curEv=evd;
    curStory=null;
    const pending=G.beginPresentation(evd);
    bgmEvKey = (evd.type==='추적'||evd.type==='위기'||evd.ai)?'tension': evd.type==='스토리'?'story':null;
    if(evd.id==='leo_broadcast') BGM.playSongOnce();   // 400km 송출 — 노래가 울려 퍼지는 그 장면
    const CVO={ai_vending:'cheollian_01', exp_glasshouse:'cheollian_02', ai_census:'cheollian_03',
      ai_gasstation:'cheollian_05', ai_manifest:'cheollian_09', seoul_gate:'cheollian_13'};
    if(CVO[evd.id]) VO.play(CVO[evd.id]);
    SND.setDriving(false);
    AMBI.event(evd);
    const sheet=$('#ev-sheet');
    sheet.classList.remove('companion-profile-mode','comp-perk-reveal-mode','craft-workbench-mode');
    sheet.classList.add('event-mode');
    sheet.classList.remove('combat-details-open');
    sheet.dataset.eventKind=evd.combat?'combat':'story';
    sheet.classList.toggle('passenger-reader',!evd.combat);
    sheet.dataset.storySurface=storySurface(evd);
    sheet.dataset.eventId=evd.id||'';
    sheet.dataset.storyOrigin=evd.storyOrigin&&evd.storyOrigin.kind||'';
    const missionOnly=evd.id==='onboarding_main_mission';
    sheet.dataset.readerLayout=!evd.combat&&!missionOnly?'pages':'';
    sheet.dataset.missionLayout=missionOnly?'departure':'';
    const text = pending?.phase==='event'?pending.text:typeof evd.text==='function'?evd.text(S):evd.text;
    const sceneAlt=stripTags(evd.title||'길 위의 사건');
    const sceneKeys=eventSceneKeys(evd);
    const scene=missionOnly
      ?`<figure class="mission-art"><img src="${esc(D.scenes[sceneKeys[0]]||'')}" width="1280" height="720" decoding="async" alt="${esc(D.sceneDescriptions?.[sceneKeys[0]]||sceneAlt)}"></figure>`
      :sceneFrameHtml(sceneKeys,sceneAlt);
    const storyOrigin=storyOriginHtml(evd);
    let context=D.storyContext&&D.storyContext[evd.id]
      ? `<div class="story-context"><b>앞 이야기</b>${D.storyContext[evd.id]}</div>` : '';
    const recruitQ=S.recruitQ, recruitDef=recruitQ&&D.recruitQuests[recruitQ.id];
    const approach=recruitQ&&G.recruitApproach();
    if(recruitDef&&approach&&(evd.id===recruitDef.follow||evd.id===recruitDef.join)){
      context=`<div class="story-context"><b>우리가 앞에서 한 일 · ${approach.label}</b>${approach.memory}</div>`+context;
    }
    const choices=eventChoiceData(evd);
    curCombatChoices=choices.combatChoices;
    const authored=typeof evd.turns==='function'?evd.turns(S):evd.turns;
    const authoredTurns=Array.isArray(authored)&&authored.length
      ?authored.map(turn=>({...turn,...(turn.who==='me'&&!turn.name?{name:G.myName()}:{} )}))
      :null;
    const turns=missionOnly
      ? [{kind:'narration',text:''}]
      : authoredTurns
        ? evd.readingRecord?authoredTurns:prepareEventAudio(authoredTurns,evd)
        : prepareEventAudio(buildStoryTurns(text,evd,{turnSpeakers:D.finaleSpeakers(evd.id,-1,S)||evd.turnSpeakers}),evd);
    const presentId=evd.needsComp||(Array.isArray(evd.needBond)?evd.needBond[0]:null);
    if(presentId&&G.hasComp(presentId)&&G.crewLocation){
      const companion=D.comps[presentId];
      context='<div class="story-context crew-presence"><b>'+esc(companion.name)+' · '+esc(G.crewLocation(presentId))+'</b>이 장면에서 동료가 어디에 있는지 기록됩니다.</div>'+context;
    }
    /* 전투만 현재 판단에 집중한다. 이야기 사건은 인트로처럼 앞선 대화와
       장면을 계속 쌓아 맥락과 대화 방향을 한눈에 읽게 한다. */
    sheet.classList.remove('story-compact');
    const mission=evd.missionBrief;
    const missionBrief=mission?departureBriefHtml(mission):'';
    let eventGuide='';
    S.flags=S.flags||{};
    if(evd.id!=='onboarding_main_mission'&&!S.flags.onboarding_event_guide){
      S.flags.onboarding_event_guide=true;
      G.save();
      eventGuide='<aside class="event-tutorial-note"><b>길 위 사건</b><span>화면을 짧게 탭하면 다음 문장으로 넘어갑니다. 마지막에 행동을 고르면 결과가 자원과 기록에 남습니다.</span></aside>';
    }
    const choicePageSize=((sheet.clientWidth||innerWidth)<350||(sheet.clientHeight||innerHeight)<650)?2:3;
    const choicePages=Math.ceil(choices.count/choicePageSize);
    const directRoadChoice=evd.choices.length===1&&evd.choices[0].continueToRoad===true?evd.choices[0]:null;
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="${esc(sceneAlt)} 사건 내용">${scene}<section class="event-field-report">${missionOnly?'':`<div class="event-head"><div>
      <span class="sr-only" data-event-progress>1 / ${turns.length}</span>${storyOrigin}<h2>${esc(storyHeading(evd))}</h2>${evd.roadCheckIn?'<button type="button" class="event-detail-toggle" data-road-later>다음에 이야기하기</button>':''}</div></div>`}${evd.combat?missionBrief+eventGuide+context:''}${combatHudHtml(evd,{combatChoices:choices.combatChoices})}<div class="story-reader"></div></section></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    const roadLater=sheet.querySelector('[data-road-later]');
    if(roadLater) roadLater.onclick=()=>closeEvent();
    const lanes=dialogueLaneMap(turns);
    curStory={
      inspection:evd.inspection,readerMode:'current',inspectedIds:[],
      brief:evd.combat?'':missionBrief+(context?`<details class="story-context-fold"><summary>앞 이야기</summary>${context}</details>`:''),
      phase:'event',eventId:evd.id,label:evd.type==='대화'?'대화':'이야기',turns,index:0,
      readingRecord:typeof evd.readingRecord==='function'?evd.readingRecord(S):evd.readingRecord,
      lastAdvanceAt:0,
      knownSpeaker:!!turns.knownSpeaker,
      lanes,
      sceneKeys,sceneAlt,sceneStart:0,originKind:evd.storyOrigin&&evd.storyOrigin.kind||'',
      finalDock:directRoadChoice
        ?`${missionOnly?`<p class="mission-optional">${esc(mission.optional)}</p>`:''}<button class="story-next onboarding-route-start" type="button"><strong>길로 나가기</strong></button>`
        :`<div class="choice-dock-head">어떻게 할까</div>
        <div class="story-choice-more" hidden aria-live="polite">아래로 더 보기 · 선택지가 이어집니다</div>
        <div class="choices" role="group" aria-label="선택지 ${choices.count}개">${choices.html}</div>
        ${evd.id==='seoul_decision'?'<button class="event-detail-toggle" type="button" data-finale-prepare>수원으로 내려가 준비한다 · 60분</button>':''}
        ${evd.campConversation?'<button class="event-detail-toggle" type="button" data-camp-later>대답은 나중에 · 야영지로</button>':''}
        ${choices.count>2?`<div class="event-choice-pages" data-choice-pages role="group" aria-label="선택지 1 / ${choicePages} 페이지"><button type="button" data-choice-prev>이전</button><span><b data-choice-page>1</b> / <b data-choice-total>${choicePages}</b></span><button type="button" data-choice-next>다음</button></div>`:''}
        ${evd.combat?`<button class="event-detail-toggle" type="button" data-event-detail aria-expanded="false">상세 정보</button>`:''}`,
      wireFinal:(dock)=>{
        const prepare=dock.querySelector('[data-finale-prepare]');
        if(prepare) prepare.onclick=()=>{ if(G.prepareFinale()) closeEvent(); };
        const later=dock.querySelector('[data-camp-later]');
        if(later) later.onclick=()=>closeEvent();
        const direct=dock.querySelector('.onboarding-route-start');
        if(direct) direct.onclick=()=>resolveChoice(directRoadChoice);
        dock.querySelectorAll('.choice[data-i]').forEach(b=>b.onclick=e=>{
          if(b.hasAttribute('disabled')) return;
          /* Consume only the click synthesized by the pointer gesture that
             advanced the last beat. A new pointerdown is a fresh choice and
             must work immediately. */
          if(curStory?.consumeStoryPointerClick){
            curStory.consumeStoryPointerClick=false;
            e.preventDefault(); e.stopPropagation(); return;
          }
          const choice=evd.choices[+b.dataset.i];
          SND.combat(choice.sfx||'select');
          resolveChoice(choice);
        });
        dock.querySelectorAll('.choice[data-i]').forEach(b=>b.onpointerdown=()=>{
          if(curStory) curStory.consumeStoryPointerClick=false;
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
    G.restorePresentationView(curStory);
    renderStoryState();
    wireSceneZoom(sheet);
    openModal('#ev-wrap','.story-tap-hint, .story-next, .choice');
    if(sheet.dataset.readerLayout==='pages')requestAnimationFrame(()=>{if(curEv===evd)renderStoryState();});
    if(evd.sfx&&pending?.phase!=='result') SND.combat(evd.sfx);
    if(pending?.phase==='result'){
      resolveChoice(evd.choices[pending.choiceIndex]); return;
    }
    const restored=evd.campConversation?G.currentCampConversation():evd.openingStep&&S.opening&&S.opening.pendingResult;
    if(restored&&restored.choiceId&&(restored.stepId===evd.id||restored.id===evd.id)){
      const restoredChoice=evd.choices.find(choice=>choice.id===restored.choiceId);
      if(restoredChoice) requestAnimationFrame(()=>{
        if(curEv===evd&&curStory&&curStory.phase==='event') resolveChoice(restoredChoice);
      });
    }
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
  function showPerkLearned(id,perk,level){
    const c=D.comps[id], st=S.comps[id], sheet=$('#ev-sheet');
    const sceneKey=D.companionGrowthScenes&&D.companionGrowthScenes[id];
    const scene=sceneKey&&D.scenes&&D.scenes[sceneKey]||'';
    const sceneAlt=sceneKey&&D.sceneDescriptions&&D.sceneDescriptions[sceneKey]
      ||`${c.name}가 ${perk.nm} 능력을 익히는 장면`;
    const next=st.pending
      ?`Lv.${st.pending} 능력을 바로 선택할 수 있다.`
      :st.lvl<3
        ?`유대 ${st.bond}/${D.bondTh[st.lvl]} · 다음은 Lv.${st.lvl+1}`
        :'고유 능력까지 모두 익혔다.';
    sheet.classList.remove('event-mode','passenger-reader','story-compact','craft-workbench-mode','companion-profile-mode');
    sheet.classList.add('comp-perk-reveal-mode');
    sheet.innerHTML=`<section class="comp-perk-reveal" aria-labelledby="comp-perk-reveal-title">
      <figure class="comp-perk-scene">
        ${scene?`<img src="${scene}" alt="${esc(sceneAlt)}" decoding="async">`:''}
        <figcaption><span>${faceOf(id,c.face)}</span><div><small>${esc(c.name)} · ${esc(c.cls)}</small><b>Lv.${level} 능력 습득</b></div></figcaption>
      </figure>
      <div class="comp-perk-result">

        <div class="comp-perk-result-title"><i aria-hidden="true">${perk.ic||'✦'}</i><div><small>새 능력</small><h2 id="comp-perk-reveal-title">${esc(perk.nm)}</h2></div></div>
        <p>${esc(perk.learn||`${c.name}가 새로운 능력을 익혔다.`)}</p>
        <section class="comp-perk-effect"><small>여정에 적용되는 효과</small><b>${esc(perk.d)}</b></section>
        <div class="comp-perk-next"><small>다음 성장</small><span>${esc(next)}</span></div>
        <div class="comp-perk-result-actions"><button type="button" class="comp-perk-return" data-perk-return="${id}">동료 성장으로 돌아가기</button><button type="button" class="comp-perk-finish" data-x="1">닫기</button></div>
      </div>
    </section>`;
    sheet.querySelector('[data-perk-return]').onclick=()=>showComp(id);
    sheet.querySelector('[data-x]').onclick=()=>closeEvent();
    openModal('#ev-wrap','[data-perk-return], [data-x]');
  }

  function showComp(id){
    const c=D.comps[id], st=S.comps[id];
    SND.setDriving(false);
    /* 퍼크 선택을 기다리는 순간은 이미 해당 레벨의 유대 문턱을 넘은 상태다.
       카드가 Lv.0, 유대 5/4처럼 보이지 않도록 획득한 레벨로 표시한다. */
    const shownLevel=st.pending||st.lvl;
    const next = shownLevel<3 ? D.bondTh[shownLevel] : null;
    const pct = next ? Math.min(100, st.bond/next*100) : 100;
    const joinedBy=G.recruitApproach(id);
    const talkedToday=!!(S._talked&&S._talked[id]===S.day);
    const signature=c.perks[3], signatureLearned=st.perks.includes(signature.id);
    const levelRail=[1,2,3].map(level=>{
      const options=level<3?c.perks[level]:[signature];
      const chosen=options.find(perk=>st.perks.includes(perk.id));
      const current=st.pending===level||(level===3&&st.storyReady);
      const state=chosen?'is-done':current?'is-current':'is-locked';
      const detail=chosen?chosen.nm:current?(level===3?'동료 이야기 필요':'선택 가능'):(level===3?'고유 능력':'아직 잠김');
      return `<span class="comp-level-step ${state}"><i>${chosen?'✓':level}</i><b>Lv.${level}</b><small>${esc(detail)}</small></span>`;
    }).join('');
    const skillTiers=[1,2].map(level=>{
      const options=c.perks[level];
      const chosen=options.find(perk=>st.perks.includes(perk.id));
      const current=st.pending===level;
      const tierState=chosen?'is-done':current?'is-current':'';
      if(!chosen&&!current){
        return `<section class="comp-skill-tier is-locked"><span class="comp-skill-level"><i>${level}</i><b>Lv.${level}</b><small>잠김</small></span><div class="comp-skill-locked-summary"><b>${options.map(perk=>esc(perk.nm)).join(' · ')}</b><small>Lv.${level}에서 두 능력 중 하나를 고른다.</small></div></section>`;
      }
      const optionHtml=options.map((perk,index)=>{
        const state=chosen?(chosen.id===perk.id?'is-chosen':'is-passed'):current?'is-available':'';
        const copy=`<span class="comp-perk-glyph" aria-hidden="true">${perk.ic||'✦'}</span><span class="comp-perk-copy"><b>${esc(perk.nm)}</b><small>${esc(perk.d)}</small></span>`;
        const option=current
          ?`<button type="button" class="comp-skill-option comp-perk-choice ${state}" data-pk="${index}" aria-label="${esc(perk.nm)} 선택. ${esc(perk.d)}">${copy}<em><small>배울 능력</small><strong>선택</strong></em></button>`
          :`<span class="comp-skill-option ${state}">${copy}</span>`;
        return `${index?'<span class="comp-skill-or">또는</span>':''}${option}`;
      }).join('');
      return `<section class="comp-skill-tier ${tierState}"><span class="comp-skill-level"><i>${chosen?'✓':level}</i><b>Lv.${level}</b><small>${chosen?'습득 완료':current?'하나 선택':'잠김'}</small></span><div class="comp-skill-options">${optionHtml}</div></section>`;
    }).join('');
    const signatureTier=`<section class="comp-skill-tier is-signature ${signatureLearned?'is-done':st.storyReady?'is-current':''}"><span class="comp-skill-level"><i>${signatureLearned?'★':'3'}</i><b>Lv.3</b><small>${signatureLearned?'습득 완료':'동료 이야기'}</small></span><div class="comp-skill-options"><span class="comp-skill-option ${signatureLearned?'is-chosen':''}"><span class="comp-perk-glyph" aria-hidden="true">★</span><span class="comp-perk-copy"><b>${esc(signature.nm)}</b><small>${esc(signature.d)}</small></span></span></div></section>`;
    let h=`<section class="companion-profile">
      <header class="comp-profile-hero"><span class="comp-profile-portrait">${faceOf(id,c.face)}</span><span class="comp-profile-identity"><small>동료 · ${esc(c.cls)}</small><h2>${esc(c.name)}</h2><span>${esc(c.role)}</span></span><strong class="comp-profile-level">Lv.${shownLevel}${shownLevel>=3?' MAX':''}</strong>
        <div class="comp-profile-bond"><span><b>유대</b><em>${st.bond}${next?' / '+next:' · 완성'}</em></span><div><i style="width:${pct}%"></i></div></div></header>
      <div class="comp-profile-intro"><p>${esc(c.bio)}</p><span><small>동행 효과</small><b>${esc(c.perk)}</b></span></div>
      ${joinedBy?`<div class="story-context"><b>함께 타게 된 날 · ${esc(joinedBy.label)}</b>${esc(joinedBy.memory)}</div>`:''}
      <nav class="comp-level-rail" aria-label="${esc(c.name)} 성장 단계">${levelRail}</nav>
      <div class="comp-skill-path"><header><span><small>SKILL PATH</small><b>능력 경로</b></span><em>${st.pending?`Lv.${st.pending} 능력 하나 선택`:'Lv.1·2 선택 · Lv.3 고유'}</em></header>${st.pending?'<p class="comp-choice-note">고른 능력은 바로 적용되며 나중에 바꿀 수 없다.</p>':''}${skillTiers}${signatureTier}</div>
      ${!st.pending&&st.lvl<3?`<p class="comp-growth-help">유대는 ${esc(c.name)}의 능력을 활용하거나, 함께 이동하고 야영하며 쌓인다.</p>`:''}
      <section class="comp-profile-actions">
        ${!S.driving?`<button type="button" class="comp-talk-action ${talkedToday?'is-done':''}" data-talk="${id}" ${talkedToday?'disabled':''}>
          <span class="comp-action-icon" aria-hidden="true">${talkedToday?'✓':'말'}</span><span class="comp-action-copy"><small>${talkedToday?'오늘 대화 완료':'오늘의 대화'}</small>
          <b>${talkedToday?`${esc(c.name)}와 오늘 이야기를 나눴다`:`${esc(c.name)}에게 말을 건다`}</b><em>${talkedToday?'다음 날 다시 이야기할 수 있다':'하루 한 번 · 대화가 유대를 만든다'}</em></span>
          <span class="comp-action-cta">${talkedToday?'완료':'대화'}</span></button>`:`<div class="comp-talk-state"><small>주행 중</small><b>길 화면에서 동료와 이야기할 수 있다</b></div>`}
        <button type="button" class="comp-profile-close" data-x="1">닫기</button>
      </section></section>`;
    const sheet=$('#ev-sheet');
    sheet.classList.remove('event-mode','passenger-reader','story-compact','craft-workbench-mode','comp-perk-reveal-mode');
    sheet.classList.add('companion-profile-mode');
    sheet.innerHTML=h;
    sheet.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{
      const level=st.pending, perk=G.choosePerk(id,+b.dataset.pk);
      if(perk) showPerkLearned(id,perk,level);
    });
    const tk=sheet.querySelector('[data-talk]');
    if(tk) tk.onclick=()=>{ if(G.talkTo(tk.dataset.talk)){} };
    sheet.querySelector('[data-x]').onclick=()=>{ closeEvent(); };
    openModal('#ev-wrap','[data-pk], [data-talk], [data-x]');
  }

  /* ── 작업대 (무기 제작) ── */
  let craftSelectedId='pipe';
  let craftVisualState='preview';
  function showCraft(options={}){
    SND.setDriving(false);
    const sheet=$('#ev-sheet');
    sheet.classList.remove('event-mode','passenger-reader','story-compact','comp-perk-reveal-mode','companion-profile-mode');
    sheet.classList.add('craft-workbench-mode');
    if(options.selected&&D.crafts.some(c=>c.id===options.selected)) craftSelectedId=options.selected;
    if(options.phase) craftVisualState=options.phase;
    const c=D.crafts.find(row=>row.id===craftSelectedId)||D.crafts[0];
    craftSelectedId=c.id;
    const chk=G.canCraft(c.id);
    const making=craftVisualState==='making';
    const sceneKey=c.art&&(making?c.art.making:c.art.preview);
    const scene=sceneKey&&D.scenes&&D.scenes[sceneKey]||'';
    const own=Object.keys(c.out).map(nm=>`${nm} ${S.items[nm]||0}`).join(' · ');
    const mins=S.up&&S.up.armory?20:40;
    const costs=[
      c.need.scrap&&{icon:'▦',label:'고철',amount:c.need.scrap,have:S.scrap},
      c.need.parts&&{icon:'⌁',label:'부품',amount:c.need.parts,have:S.items['부품']||0},
      c.need.fuel&&{icon:'◒',label:'연료',amount:`${c.need.fuel}L`,have:`${Math.floor(S.fuel)}L`}
    ].filter(Boolean);
    const tabs=D.crafts.map(row=>{
      const rowOwn=Object.keys(row.out).reduce((sum,nm)=>sum+(S.items[nm]||0),0);
      const active=row.id===c.id;
      return `<button type="button" class="craft-recipe ${active?'is-active':''}" data-craft-pick="${row.id}" role="tab" aria-selected="${active}">
        <span aria-hidden="true">${row.ic}</span><b>${esc(row.short||row.nm)}</b><small>보유 ${rowOwn}</small></button>`;
    }).join('');
    const costHtml=costs.map(cost=>`<span class="craft-cost"><i aria-hidden="true">${cost.icon}</i><small>${cost.label}</small><b>${cost.amount}</b><em>보유 ${cost.have}</em></span>`).join('');
    const h=`<section class="craft-workbench" aria-label="달구지 작업대">
      <header class="craft-workbench-head"><div><span>달구지 뒤 작업대</span><h2>무기 제작</h2></div>
        <div class="craft-stock" aria-label="보유 자원"><span><small>고철</small><b>${S.scrap}</b></span><span><small>부품</small><b>${S.items['부품']||0}</b></span><span><small>연료</small><b>${Math.floor(S.fuel)}L</b></span></div></header>
      <figure class="craft-visual ${making?'is-making':'is-preview'}" aria-live="polite">
        <img src="${scene}" alt="달구지 뒤 작업대의 ${esc(c.nm)} ${making?'제작 장면':'준비 장면'}">
        <figcaption><small>${making?'제작 완료':'재료 확인'}</small><strong>${esc(c.nm)}</strong><span>${esc(making?c.work:c.work||'재료를 챙겨 작업대에 놓는다.')}</span></figcaption>
        ${making?'<i class="craft-done-mark" aria-hidden="true">✓</i>':''}</figure>
      <nav class="craft-recipes" role="tablist" aria-label="제작품 선택">${tabs}</nav>
      <section class="craft-detail"><header><div><small>${making?'방금 만든 물건':'선택한 제작품'}</small><h3>${c.ic} ${esc(c.nm)}</h3></div><b>${esc(own)}</b></header>
        <p>${esc(c.d)}</p><div class="craft-costs" aria-label="필요 재료">${costHtml}</div>
        <button type="button" class="craft-primary" data-cr="${c.id}" ${chk.ok?'':'disabled'}>
          <span><small>${chk.ok?(making?'같은 물건을 다시':'작업 준비 완료'):'지금은 제작할 수 없음'}</small><b>${chk.ok?`${esc(c.nm)} 제작`:esc(chk.why||'재료 부족')}</b></span><em>${mins}분</em></button></section>
      <button type="button" class="craft-close" data-x="1">작업대 접기</button>
    </section>`;
    sheet.innerHTML=h;
    sheet.querySelectorAll('[data-craft-pick]').forEach(b=>b.onclick=()=>showCraft({selected:b.dataset.craftPick,phase:'preview'}));
    const make=sheet.querySelector('[data-cr]');
    if(make) make.onclick=()=>{ if(G.craft(make.dataset.cr)) showCraft({selected:make.dataset.cr,phase:'making'}); };
    sheet.querySelector('[data-x]').onclick=()=>{ craftVisualState='preview'; closeEvent(); };
    openModal('#ev-wrap','[data-craft-pick].is-active, [data-cr], [data-x]');
  }

  // This is a passenger's unfinished place, not an unlocked companion card.
  function minjiGuestNoteHtml(){
    const q=S.recruitQ;
    if(q?.id!=='minji'||S.party.includes('minji')) return '';
    const memory=S.campMemories?.minji, approach=G.recruitApproach('minji');
    const note=memory?.home||(q.stage==='task'
      ?'손님 짐이라며 끈은 묶지 않았다. 울산에서 찾을 물건이 있다고 했다.'
      :approach?.memory||'진단기는 꺼냈다. 민지는 다음 정차까지 같이 가기로 했다.');
    return `<article class="crew-person" aria-label="민지 · 임시 동행">
      <div class="crew-guest-heading"><span class="crew-person-face"><img class="pimg" src="${D.portraits.minji}" alt="민지" decoding="async"></span><div class="crew-person-heading"><b>민지</b><small>${q.stage==='task'?'울산까지 함께 타는 손님':'함께 타고 있는 손님'}</small></div></div>
      <p class="crew-person-concern">${esc(note)}</p>
      <div class="crew-keepsake"><b>무릎 위 공구함</b><span>손잡이를 놓았다가도 차가 흔들리면 다시 잡는다.</span></div>
      <button type="button" class="journey-text-action" data-guest-notebook>민지와 약속한 일 보기 →</button>
    </article>`;
  }

  function recruitDecisionHtml(id){
    const c=id&&D.comps[id];
    if(!c) return '';
    const mp=G.maxParty(), full=S.party.length>=mp, next=G.nextSeatUpgrade();
    const seatText=full
      ?`동료석 ${S.party.length}/${mp}${next?` · ${next.nm} 개조 후 합류 가능`:''}`
      :`합류 후 동료석 ${S.party.length+1}/${mp} · ${c.perk}`;
    return `<button class="choice recruit-decision recruit-accept" data-r="yes" ${full?'disabled':''} aria-label="${esc(c.name)}와 함께 간다. ${esc(seatText)}">
        <span class="recruit-decision-copy"><small>${full?'지금은 합류할 수 없음':'정식 동료 합류'}</small><strong>${esc(c.name)}와 함께 간다</strong><span class="req">${esc(seatText)}</span></span>
        <i class="recruit-decision-arrow" aria-hidden="true">→</i></button>
      <button class="choice recruit-decision recruit-decline" data-r="no"><span>${id==='minji'&&S.recruitQ?.id===id?'아직 결정하지 않고 돌아간다':'여기서 작별한다'}</span></button>`;
  }

  function normalizeRecruitDecisionDock(dock,id){
    if(!dock||!id||dock.querySelector('.recruit-decision')) return;
    const choices=dock.querySelector(':scope > .choices');
    if(choices&&choices.querySelector('button[data-r="yes"]')) choices.innerHTML=recruitDecisionHtml(id);
  }

  function storyOutcomeIsQuiet(event){
    return !!event&&!event.combat&&(/^(parents_|main_|seoul_)/.test(event.id||'')
      ||['loc_mingyu','pss_forgive','kw_base','leo_broadcast','loc_jaeyi_cache','es_backdoor'].includes(event.id));
  }
  function storyOutcomeChips(chips,quiet){
    return quiet?chips.filter(chip=>!/퍼크|특기|레벨|Lv\.?|성장|미션|임무/.test(stripTags(chip.t||''))):chips;
  }
  // Presentation only: use the saved result/ledger receipt, never re-run an effect.
  function storySurface(event){
    if(!event||event.combat||event.openingStep) return '';
    if(event.campConversation) return 'camp';
    if(event.storyOrigin?.kind==='video') return 'record';
    if(event.recruitStart||event.type==='대화'||/^rq_/.test(event.id||'')||event.id==='meet_scrapyard') return 'talk';
    return '';
  }
  function storyHeading(event){
    return event.storyOrigin?.kind==='video'&&event.storyOrigin.title||event.title;
  }
  function storyCompletedRecordHtml(state){
    if(state.phase!=='outcome'||state.eventId!=='story_family_principle'||state.choiceIndex!==0
      ||state.index<state.turns.length-1) return '';
    const restored=stripTags(state.resultText||'').match(/"(우리가 제안하는 것은 종료 장치가 아닙니다\.[\s\S]*?)"/);
    // Old receipts with different prose remain readable as originally saved.
    if(!restored) return '';
    return `<section class="story-chat story-transcript" role="group" aria-label="복원한 영상">
      <div class="story-record-finished"><p>마지막 문장까지 복원했다.</p>
        <details class="story-result-record" data-result-disclosure="restoredLineOpen" ${state.restoredLineOpen?'open':''}>
          <summary>복원된 마지막 부분 다시 읽기</summary><blockquote>${esc(restored[1])}</blockquote>
        </details></div></section>`;
  }
  function storyNextStepHtml(row){
    const next=String(row.next||''),title=String(row.title||'').replace(/^(?:메인 스토리|사이드 미션) (?:진행|갱신)\s*·\s*/,'');
    const place=next.match(/^(.*?)에서 ‘([^’]+)’(?:을|를) 눌러 「([^」]+)」 기록을 확인한다 \(열람 준비 (\d+)분\)$/);
    return `<aside class="story-next-place" aria-label="${row.kind==='main'?'메인 스토리':'사이드 미션'} 다음 행동">
      ${place?`<b>${esc(place[3])}</b><p>${esc(place[1])} · ${esc(place[2])} · 준비 ${esc(place[4])}분</p>`
        :`<b>${esc(title)}</b>${next&&next!==title?`<p>${esc(next)}</p>`:''}`}</aside>`;
  }
  function storyOutcomeSummaryHtml(chips,updates,state){
    const records=[],changes=[];
    chips.forEach(chip=>(/^(?:새 기록|새 소문|본편 단서|기억됨|◈)/.test(stripTags(chip.t||'').trim())?records:changes).push(chip));
    const seen=new Set(),next=updates.filter(row=>{
      const key=JSON.stringify([row.kind,row.title,row.next]);if(seen.has(key)) return false;seen.add(key);return true;
    }).map(storyNextStepHtml).join('');
    return `${changes.length?`<ul class="story-changes" aria-label="이번 선택으로 달라진 것">${changes.map(chip=>`<li class="${chip.c==='minus'?'is-loss':'is-change'}">${esc(chip.t)}</li>`).join('')}</ul>`:''}
      ${next}${records.length?`<details class="story-result-record" data-result-disclosure="resultRecordOpen" ${state.resultRecordOpen?'open':''}>
        <summary>남겨 둔 기록</summary><ul>${records.map(chip=>`<li>${esc(chip.t)}</li>`).join('')}</ul></details>`:''}`;
  }
  function resolveChoice(choice){
    clearStoryAuto();
    const priorStory=curStory;
    const quiet=storyOutcomeIsQuiet(curEv);
    const savedResolution=G.resolvePresentedChoice(curEv,choice,priorStory,{deferQuestRead:quiet});
    if(!savedResolution.ok){
      if(savedResolution.why) toast(savedResolution.why,'warn');
      return;
    }
    const out=savedResolution.out, chips=storyOutcomeChips(savedResolution.chips,quiet);
    const combatHud=curEv.combat?combatHudHtml(curEv,{state:savedResolution.combatState,
      result:true,ended:!!out.fx?.combatEnd,combatChoices:curCombatChoices}):'';
    if(savedResolution.applied&&curEv.combat) SND.combat('confirm');
    if(savedResolution.applied&&out.sfx) SND.combat(out.sfx);
    if(savedResolution.applied&&out.fx?.combatEnd){
      const resultCue=['success','partial','failure'].includes(out.fx.combatResult)
        ?out.fx.combatResult:'failure';
      setTimeout(()=>SND.combat(resultCue),140);
    }
    if(S.ended) return;
    if(choice.continueToRoad===true){ closeEvent(); return; }
    const sheet=$('#ev-sheet');
    sheet.classList.remove('companion-profile-mode','comp-perk-reveal-mode','craft-workbench-mode');
    sheet.classList.add('event-mode');
    sheet.classList.remove('combat-details-open');
    const outcomeText=typeof out.text==='function'?out.text(S):out.text;
    const knownSpeaker=!!(curStory&&curStory.knownSpeaker);
    const authored=typeof out.turns==='function'?out.turns(S):out.turns;
    const turns=Array.isArray(authored)&&authored.length?authored:buildStoryTurns(outcomeText,curEv,{
      knownSpeaker,
      speakers:out.speakers,
      turnSpeakers:D.finaleSpeakers(curEv.id,curEv.choices.indexOf(choice),S)||out.turnSpeakers
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
    const rewardMeta=(chip)=>{
      const text=stripTags(chip&&chip.t||'');
      if(/경과/.test(text)) return {kind:'time',icon:'◷'};
      if(/본편 단서|새 소문|새 기록|기억됨/.test(text)) return {kind:'record',icon:'◆'};
      if(/연료/.test(text)) return {kind:'fuel',icon:'⛽'};
      if(/식량/.test(text)) return {kind:'food',icon:'▣'};
      if(/물\s/.test(text)) return {kind:'water',icon:'◆'};
      if(/고철|부품/.test(text)) return {kind:'scrap',icon:'⚙'};
      if(/차체|수리/.test(text)) return {kind:'van',icon:'◆'};
      if(/관측|추적/.test(text)) return {kind:'pursuit',icon:'◉'};
      if(/피로/.test(text)) return {kind:'fatigue',icon:'◷'};
      return {kind:chip.c==='minus'?'loss':'gain',icon:chip.c==='minus'?'−':'+'};
    };
    const fxHtml=chips.length
      ? `<section class="reward-section" aria-label="이번 선택의 결과"><span class="event-result-kicker">결과</span><div class="fx-line">${chips.map(c=>{const meta=rewardMeta(c);return `<span class="fx reward-pill ${c.c} reward-${meta.kind}"><i aria-hidden="true">${meta.icon}</i><b>${esc(c.t)}</b></span>`}).join('')}</div></section>`
      : '';
    const selectedTitle=stripTags(choice.label||curEv.title||'선택의 결과').trim()||'선택의 결과';
    const reportTitle=stripTags(storyHeading(curEv)||'선택의 결과').trim()||'선택의 결과';
    const visibleReportTitle=curEv&&curEv.combat?selectedTitle:reportTitle;
    let actions='';
    const chained=out.fx&&out.fx.chain;
    const chainEvent=chained&&D.events.find(e=>e.id===chained);
    if(out.fx&&out.fx.offerComp){
      actions+=recruitDecisionHtml(out.fx.offerComp);
    } else {
      const actionLabel=curEv&&curEv.campConversation?'야영지로 돌아가기':curEv&&curEv.openingFinal
        ?'길로 나가기'
        :curEv&&curEv.openingStep
        ?'다음 장면'
        :chained
        ?chained==='rq_minji_request'?'부탁을 듣는다':`다음 단계${chainEvent&&chainEvent.combat?' · '+esc(chainEvent.combat.step):''}`
        :curEv.storyOrigin?.kind==='video'?'영상을 닫고 길로'
        :'길로 돌아가기';
      actions+=`<button class="choice primary-exit-btn" data-r="ok"><span>${actionLabel}</span></button>`;
    }
    // Keep the event shell, scene and conversation mounted across the choice.
    // Only the outcome scene/briefing and subsequent entries change.
    const head=sheet.querySelector('.event-head h2');
    sheet.querySelector('[data-road-later]')?.remove();
    if(head) head.textContent=visibleReportTitle;
    if(priorFrame&&outcomeSceneKeys[0]!==priorScene) priorFrame.outerHTML=scene;
    else if(priorFrame) priorFrame.dataset.cutToken='initial';
    if(combatHud){
      sheet.querySelector('.combat-hud')?.remove();
      sheet.querySelector('.story-reader').insertAdjacentHTML('beforebegin',combatHud);
    }
    const lanes=dialogueLaneMap(turns,curStory&&curStory.lanes);
    curStory={
      inspection:curEv.inspection,readerMode:'current',inspectedIds:priorStory?.inspectedIds||[],
      phase:'outcome',eventId:curEv.id,label:'결과',turns,index:0,
      choiceIndex,resultText:outcomeText,resultChips:chips,quietOutcome:quiet,
      history:savedResolution.applied?G.presentationView(priorStory):null,selection:selectedTitle,questUpdates:[],
      readingRecord:typeof out.readingRecord==='function'?out.readingRecord(S):out.readingRecord,
      knownSpeaker:!!turns.knownSpeaker,
      lanes,
      sceneKeys:outcomeSceneKeys,sceneAlt,sceneStart,sceneCarry,
      originKind:curEv.storyOrigin&&curEv.storyOrigin.kind||'',
      offerComp:out.fx&&out.fx.offerComp||null,
      finalDock:`<div class="choices" role="group" aria-label="다음 행동">${actions}</div>`,
      reveal:()=>{ const result=sheet.querySelector('.story-result');
        if(result) result.innerHTML=!curEv.combat?storyOutcomeSummaryHtml(chips,quiet?[]:curStory.questUpdates||[],curStory):fxHtml+(quiet?[]:curStory.questUpdates||[]).map(row=>
          `<aside class="story-quest-update"><small>${row.kind==='main'?'메인 스토리 갱신':'사이드 미션 갱신'}</small><b>${esc(row.title)}</b><p>${esc(row.next)}</p></aside>`).join(''); },
      wireFinal:(dock)=>dock.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
        if(b.hasAttribute('disabled')) return;
        if(b.dataset.r==='yes'&&out.fx.offerComp) G.doRecruit(out.fx.offerComp);
        closeEvent();
      })
    };
    G.restorePresentationView(curStory);
    renderStoryState();
    wireSceneZoom(sheet);
    renderHud();
  }
  function closeEvent(){
    const localConversation=curEv?.localConversation;
    const campEvent=curEv&&curEv.campConversation;
    if(campEvent&&S.campConversation) S.campConversation.active=false;
    const openingStep=curEv&&curEv.openingStep?curEv.id:null;
    if(openingStep&&(!curStory||curStory.phase!=='outcome')) return false;
    const nextOpening=openingStep&&G.continueOpening?G.continueOpening(openingStep):null;
    clearStoryAuto();
    closeModal('#ev-wrap');
    curCombatChoices=[];
    $('#ev-sheet').classList.remove('event-mode','passenger-reader','story-compact','craft-workbench-mode','comp-perk-reveal-mode','companion-profile-mode');
    $('#ev-sheet').classList.remove('combat-details-open');
    if($('#ev-sheet').__eventDockObserver) $('#ev-sheet').__eventDockObserver.disconnect();
    delete $('#ev-sheet').__eventDockObserver;
    delete $('#ev-sheet').__eventDockObserved;
    $('#ev-sheet').style.removeProperty('--event-dock-h');
    delete $('#ev-sheet').dataset.storyPhase;
    delete $('#ev-sheet').dataset.storyStep;
    delete $('#ev-sheet').dataset.eventKind;
    delete $('#ev-sheet').dataset.eventId;
    delete $('#ev-sheet').dataset.storyOrigin;
    delete $('#ev-sheet').dataset.missionLayout;
    delete $('#ev-sheet').dataset.readerLayout;
    if($('#ev-sheet').__pageObserver)$('#ev-sheet').__pageObserver.disconnect();
    delete $('#ev-sheet').__pageObserver;
    curEv=null;
    curStory=null;
    if(S.driving) SND.setDriving(true);
    AMBI.restore();
    // Settlement small-talk has no event receipt or queued road handoff. Its
    // original relationship/rumour effects are saved by the chosen action.
    if(localConversation){renderHud();G.save();return;}
    const chain=S&&!campEvent&&!nextOpening?G.queuePresentation(S._chain):null;
    if(S&&S.stopover&&!chain&&!S._chain) S.stopover=null;
    renderAll(); G.save();
    if(campEvent){ showCampHub(); return; }
    if(nextOpening){ setTimeout(()=>showEvent(nextOpening),300); return; }
    if(chain){ const current=S; setTimeout(()=>{ if(S===current) G.presentTransition(); },450); return; }
    /* storyQueue는 다음 도로 사건 기회에 fireDriveEvent2가 소비한다.
       모달을 닫자마자 다음 모달을 여는 연쇄는 명시적 _chain만 허용한다. */
    /* 서울 진입 후엔 오르막 맵으로 복귀 */
    if(S && S.at==='seoul' && S.flags && S.flags.seoul_open && !S.ended){ setTimeout(showSeoul, 300); }
  }
  function showSeoul(options={}){
    const stops=D.seoulMap.stops, stage=G.seoulStage();
    const transfer=G.transferStatus();
    const done=stage>=stops.length;
    const route=S.routePlan&&D.routePlans&&D.routePlans[S.routePlan.id];
    const build=G.vanBuildProfile();
    const companionStories=(S.party||[]).filter(id=>D.comps[id]&&(S.comps[id]||{}).lvl>=3).length;
    const settlementChanges=Object.keys(D.stls||{}).reduce((count,id)=>count+(G.stlImpact(id).count||0),0);
    const rememberedChoices=(S.memories&&S.memories.history||[]).length;
    const journeyLoad=stage===0?`<section class="seoul-journey-load" aria-label="서울에 가져온 여정">
      <b>서울에 가져온 것</b>
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
    h+=`</div><div class="sub" style="text-align:center;margin:8px 0;color:${transfer.onTime?'var(--amber)':'var(--danger)'}"><b>${esc(transfer.mission)}</b><br><small>날짜 제한은 없다. 남산에서 강제 이송을 멈춰야 한다.</small></div>${journeyLoad}<div class="seoul-cta">`;
    if(!done){
      h+=`<button class="act primary" id="seoul-go"><span class="ic">▲</span><span><b>${esc(stops[stage].name)}${directionParticle(stops[stage].name)} 오른다</b><small>${stage===0?'서울 안으로':'다음 정거장'}</small></span></button>`;
    } else {
      const cn=S.notes?S.notes.length:0, pn=S.party.length, dg=S.dog?' + 보리':'';
      const recalled=(S.memories&&S.memories.history||[]).map(id=>S.memories.choices[id]).filter(Boolean).slice(-4);
      const finishLine='제7 잔류구역 6,412명의 강제 이송 명령을 취소했다.';
      h+=`<div class="sub" style="text-align:center;padding:14px 0">〔 서울까지 400km 완주 〕<br>
        <small style="color:var(--faded)">DAY ${S.day} · ${Math.round(S.stats.km)}km · 동료 ${pn}명${dg} · 기록 ${cn}개</small><br>
        <small style="color:${transfer.onTime?'var(--ok)':'var(--amber)'}">${esc(finishLine)}</small><br>
        <small style="color:var(--faded)">부산의 폐차장에서 남산의 밤까지, 여기 적힌 전부가 우리가 실어온 것이다.</small><br>
        <small style="color:var(--faded)">가족의 추방 이유는 되찾았고, 143년의 최초 목적은 꾸며 쓰지 않은 채 같은 정리를 끝냈다.</small></div>
        ${recalled.length?`<div class="seoul-memory-recap"><b>남산까지 돌아온 선택</b>${recalled.map(memory=>`<span>DAY ${memory.day} · ${esc(memory.summary)}</span>`).join('')}</div>`:''}
        <button class="act" id="seoul-journal"><span class="ic">✎</span><span><b>여행 일지를 연다</b><small>${Math.round(S.stats.km)}km의 기록을 처음부터</small></span></button>`;
    }
    h+='</div>';
    $('#seoul-body').innerHTML=h;
    const header=$('#seoul-title').parentElement;
    header.querySelector('[data-quest-return]')?.remove();
    if(options.previewOnly){
      const back=el('button','x','✕');
      back.type='button'; back.dataset.questReturn='1';
      back.setAttribute('aria-label','서울 진입로 닫기');
      back.onclick=()=>closeModal('#ovl-seoul');
      header.appendChild(back);
    }
    document.querySelectorAll('.ovl').forEach(o=>{ if(o.id!=='ovl-seoul') closeModal(o,false); });
    openModal('#ovl-seoul','[data-quest-return], #seoul-go, #seoul-journal');
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
      title:complete?'우리 손을 기억하는 곳':'함께 거든 일이 남은 곳',
      line:last&&last.change?last.change.after:`${stl.name}에 우리가 거든 일이 남아 있다.`
    };
  }
  function settlementConcern(stlId){
    const stl=D.stls[stlId], impact=G.stlImpact(stlId);
    const action=impact.last||stl.field.actions.find(action=>!action.hidden&&stl.npcs.includes(action.npc));
    const person=D.npcs[action.npc]||D.npcs[stl.npcs[0]];
    return {action,title:`${person.name} · ${action.label}`,
      line:impact.count?action.change.after:action.desc,changed:!!impact.count};
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
    rememberSettlementFocus();
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
    if(detail) detail.textContent=hub.classList.contains('stl-cinematic-hub')?copy.local:focus.sub;
    const enter=hub.querySelector('#stl-enter');
    if(enter){ enter.disabled=true; enter.innerHTML=`<span>이동 중…</span><small>${esc(focus.compact||focus.label)}</small>`; }
    SCENE.walkSettlement(next,false);
  }
  function leaveSettlement(){
    const concern=settlementConcern(curStl);
    if(concern.changed) toast(concern.line);
    SCENE.closeSettlement();
    closeOvl('#ovl-stl');
    renderAll();
  }
  function rememberSettlementFocus(){
    try{sessionStorage.setItem('caravan-settlement-focus-v1',JSON.stringify({at:S.at,id:curStl,focus:stlFocus}));}catch(error){}
  }
  function restoreSettlementFocus(id){
    try{
      const saved=JSON.parse(sessionStorage.getItem('caravan-settlement-focus-v1')||'null');
      stlFocus=saved&&saved.at===S.at&&saved.id===id&&settlementSpots(id)[saved.focus]?saved.focus:'market';
    }catch(error){stlFocus='market';}
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
  function settlementResourceStripHtml(){
    const resources=[
      {key:'fuel',icon:'fuel',label:'연료',value:Math.floor(S.fuel),limit:`${Math.floor(S.fuelMax)}L`},
      {key:'water',icon:'water',label:'물',value:Math.floor(S.water),limit:Math.floor(S.waterMax)},
      {key:'food',icon:'food',label:'식량',value:Math.floor(S.food),limit:Math.floor(S.foodMax)},
      {key:'scrap',icon:'scrap',label:'고철',value:Math.floor(S.scrap)},
      {key:'부품',icon:'parts',label:'부품',value:Math.floor(S.items['부품']||0)}
    ];
    return `<div class="stl-resource-strip" aria-label="현재 자원과 소지 한도">
      ${resources.map(resource=>{const infinite=G.isInfiniteResourceMode()&&G.isInfiniteResourceKey(resource.key),limited=!infinite&&resource.limit!==undefined,limitLabel=limited?`${resource.limit} 한도`:'';return `<span${limited?` title="${esc(resource.label)} ${limitLabel}"`:''} aria-label="${esc(resource.label)} ${infinite?'무한':resource.value}${limited?`, ${limitLabel}`:''}">${ICO(resource.icon)}<b><strong>${infinite?'∞':resource.value}</strong>${limited?`<em>/${resource.limit}</em>`:''}</b><small>${esc(resource.label)}</small></span>`;}).join('')}
    </div>`;
  }
  function cinematicSettlementHtml({stl,spots,focus,walkCopy,concern,recruitOpen,recruitId,recruitDef}){
    const people=[...(stl.npcs||[]).map(id=>({type:'npc',id,name:D.npcs[id].name})),
      ...(recruitOpen?[{type:'recruit',id:recruitId,name:recruitDef.name}]:[]),
      ...(S.party||[]).filter(id=>D.comps[id]).map(id=>({type:'companion',id,name:D.comps[id].name}))];
    return `<div class="stl-hub stl-cinematic-hub" data-focus="${stlFocus}">
      <section class="stl-cinematic-scene" aria-label="밀양 시장 골목">
        <canvas id="stl-town-canvas" aria-label="시장 골목의 장소 표시. 아래 장소 버튼으로도 이동할 수 있다."></canvas>
        <span class="stl-cinematic-hint" data-stl-walk-title>${esc(walkCopy.title)}</span>
      </section>
      <div class="stl-cinematic-dock">
        ${settlementResourceStripHtml()}
        <nav class="stl-place-tabs" aria-label="장소 선택">${Object.entries(spots).map(([id,spot])=>`<button data-stlfocus="${id}" aria-pressed="${stlFocus===id}" class="${stlFocus===id?'selected':''}">${esc(spot.compact||spot.label)}</button>`).join('')}</nav>
        <div class="stl-cinematic-copy"><b class="sr-only" data-stl-focus-place>${esc(focus.label)}</b><p data-stl-focus-detail>${esc(walkCopy.local)}</p><span class="sr-only" data-stl-walk-line>${esc(walkCopy.line)}</span></div>
        <button class="stl-enter" id="stl-enter" disabled><span>이동 중…</span><small>${esc(focus.compact||focus.label)}</small></button>
        <div class="stl-cinematic-footer"><details class="stl-people"><summary>사람 만나기</summary><div>
          ${people.map(p=>`<button data-stl-person="${p.id}" data-person-type="${p.type}">${settlementPortrait(p.id,'stl-person-face','')}<span>${esc(p.name)}<small>다가가서 말 걸기</small></span></button>`).join('')}
          <button data-stl-concern><span>${esc(concern.title)}<small>${esc(concern.changed?'거든 일 다시 보기':'현장 둘러보기')}</small></span></button>
        </div></details><button class="stl-return" id="stl-out">달구지로 돌아간다</button></div>
      </div></div>`;
  }
  function renderSettlementHub(){
    const stl=D.stls[curStl],body=$('#stl-body'),layout=settlementLayout(curStl),spots=settlementSpots(curStl),night=G.isNight();
    const impact=settlementImpactCopy(curStl).impact,concern=settlementConcern(curStl);
    AMBI.settlement(night?'people':'hub',curStl);
    if(!spots[stlFocus]) stlFocus='market';
    if(night&&stlFocus!=='people') stlFocus='people';
    rememberSettlementFocus();
    const focus=spots[stlFocus],walkCopy=settlementWalkCopy(stlFocus);
    settlementHeader('');$('#ovl-stl').classList.add('hub-mode');
    const recruitId=stl.recruit,recruitDef=recruitId&&D.recruitQuests&&D.recruitQuests[recruitId];
    const recruitEvent=recruitDef&&D.events.find(event=>event.id===recruitDef.meet);
    // A first encounter is remembered even when it is declined or closed.
    // Keep the person reachable under the same rules as G.openRecruitMeet.
    const recruitOpen=!!(recruitId&&!G.hasComp(recruitId)&&!S.recruitQ&&recruitEvent);
    const recruitPos=layout.recruit||{x:50,y:52,label:'할 말이 있는 사람'};
    // This approved plate is clear late afternoon. Keep the authored night and
    // wet-weather world until matching art is reviewed, rather than fake sunlight.
    const cinematic=curStl==='miryang'&&!night&&S.wx==='clear'&&S.min%1440>=900&&S.min%1440<1140&&!!settlementScene(curStl,'hub');
    $('#ovl-stl').dataset.settlementView=cinematic?'cinematic':'world';
    body.innerHTML=cinematic?cinematicSettlementHtml({stl,spots,focus,walkCopy,concern,recruitOpen,recruitId,recruitDef}):`<div class="stl-hub stl-hub-v2 stl-hub-${curStl}" data-focus="${stlFocus}" data-impact-stage="${impact.stage}">
      <section class="stl-town-stage" aria-label="${esc(stl.name)}에서 걸어갈 곳">
        <canvas id="stl-town-canvas" tabindex="0" aria-label="${esc(stl.name)} 내부. 화면을 눌러 걷고 사람을 눌러 대화한다"></canvas>
        <header class="stl-town-stage-head"><span><small>${esc(layout.eyebrow||'SETTLEMENT WALK')}</small><b>${esc(stl.name)}</b></span>
          <em>${impact.count?'함께 거든 일이 남은 곳':'마을 안을 걸어본다'}</em></header>
        <p class="stl-town-stage-desc">${night?'불 꺼진 시설 사이로 모닥불과 사람의 움직임만 남아 있다.':'화면을 눌러 직접 걷고, 사람을 누르면 다가가 말을 건다.'}</p>
      </section>
      <button class="stl-local-concern" data-stl-concern>
        <b>${esc(concern.title)} <span>${night?'사람들 →':concern.changed?'다시 둘러보기 →':'현장으로 →'}</span></b>
        <small>${esc(concern.line)}${night?' · 현장 일은 아침에':''}</small>
      </button>
      <div class="stl-hub-dock">
        ${settlementResourceStripHtml()}
        <nav class="stl-world-nav" aria-label="장소 빠른 이동">
          ${Object.entries(spots).map(([id,spot],index)=>{const closed=night&&id!=='people';return `<button class="stl-hotspot ${stlFocus===id?'selected':''}" data-stlfocus="${id}" aria-pressed="${stlFocus===id}" aria-label="${esc(spot.label)} · ${closed?'오늘은 닫힘':esc(spot.sub)}" ${closed?'disabled':''}>
            <span class="stl-nav-slot">${String(index+1).padStart(2,'0')}</span>
            <span class="stl-nav-icon" aria-hidden="true">${ICO(spot.icon)}</span>
            <span class="stl-nav-copy"><b>${esc(spot.compact||spot.label)}</b><small>${closed?'오늘은 닫힘':esc(spot.sub)}</small></span>
            <i class="stl-nav-led" aria-hidden="true"></i>
          </button>`;}).join('')}
        </nav>
        <div class="stl-focus-copy"><span><b data-stl-walk-title>${esc(walkCopy.title)}</b><small data-stl-walk-line>${esc(night?'오늘은 쉬고 아침에 움직이자.':walkCopy.line)}</small></span></div>
        <div class="stl-hub-dossier">
          <div class="stl-town-focus-plate"><small>선택한 장소</small><b data-stl-focus-place>${esc(focus.label)}</b><span data-stl-focus-detail>${esc(focus.sub)}</span></div>
          <button class="stl-enter" id="stl-enter" disabled><span>이동 중…</span><small>${esc(focus.compact||focus.label)}</small></button>
        </div>
        <button class="stl-return" id="stl-out">${ICO('van')}<span>달구지로 돌아간다</span></button>
      </div></div>`;
    body.querySelectorAll('[data-stlfocus]').forEach(button=>button.onclick=()=>updateSettlementFocus(button.dataset.stlfocus));
    body.querySelectorAll('[data-stl-person]').forEach(button=>button.onclick=()=>{
      const details=button.closest('details');if(details)details.open=false;
      SCENE.approachSettlement(button.dataset.personType,button.dataset.stlPerson);
    });
    $('#stl-enter').onclick=()=>showStl(curStl,stlFocus);$('#stl-out').onclick=leaveSettlement;
    $('[data-stl-concern]').onclick=()=>{
      stlFieldFocus=concern.action.id;
      showStl(curStl,night?'people':'alley');
    };
    const arrive=id=>{if(id!==stlFocus)return;const place=spots[id],enter=$('#stl-enter');if(!enter)return;enter.disabled=false;enter.innerHTML=`<span>${cinematic?esc(place.label)+'에 들어간다':'들어간다'} <i aria-hidden="true">→</i></span>${cinematic?'':`<small>${esc(place.compact||place.label)}</small>`}`;const title=$('[data-stl-walk-title]');if(title)title.textContent=cinematic?'갈 곳을 골라 주세요':place.label;};
    SCENE.initSettlement($('#stl-town-canvas'),{
      id:curStl,layout,spots,focus:stlFocus,impact,playerName:G.myName(),cinematic,scene:cinematic?settlementScene(curStl,'hub'):'',
      npcs:(stl.npcs||[]).map(id=>({id,...D.npcs[id]})),
      recruit:recruitOpen?{id:recruitId,name:recruitDef.name,label:recruitPos.label}:null,
      party:(S.party||[]).filter(id=>D.comps[id]).map(id=>({id,...D.comps[id]})),
      onFocus:updateSettlementFocus,onArrive:arrive,
      onSelectPerson:person=>{const place=$('[data-stl-focus-place]'),detail=$('[data-stl-focus-detail]'),enter=$('#stl-enter');if(enter)enter.disabled=true;if(place)place.textContent=person.label;if(detail)detail.textContent=person.label+'에게 다가가는 중';},
      onNpc:id=>{showStl(curStl,'people');requestAnimationFrame(()=>talk(id));},onRecruit:id=>recruitStl(id),onComp:id=>showComp(id),
      onGround:()=>{const place=$('[data-stl-focus-place]'),detail=$('[data-stl-focus-detail]'),enter=$('#stl-enter');if(enter)enter.disabled=true;if(place)place.textContent='도시 안쪽';if(detail)detail.textContent=cinematic?'아래에서 들어갈 장소를 골라 주세요.':'바닥을 눌러 자유롭게 걷는 중';}
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
        h+=`<div class="dlg"><div class="say"><span class="spk">${K.ic} ${q.story?'연속 의뢰':K.nm+' 진행 중'}</span> ${detail} <small style="color:var(--faded)">(사례 고철 ${q.reward} · ${q.noExpiry?'기한 없음':`D-${Math.max(0,q.due-S.day)}`})</small></div></div>`;
      }
    } else {
      const qs=G.rollQuests();
      if(qs.length){ stlQuests=qs;
        h+=`<div class="dlg"><div class="say stl-kicker"><span class="spk">게시판</span> <small>의뢰는 한 번에 하나만 맡는다</small></div><div class="choices">`;
        qs.forEach((q,i)=>{ const K=G.QKIND[q.kind], dd=q.due-S.day;
          h+=`<button class="choice" data-quest="${i}">${K.ic} <b>${q.story?`연속 의뢰 ${q.story.stage}/${q.story.total}`:K.nm}</b> — ${G.questDesc(q)} <span class="req"><span style="color:${!q.noExpiry&&dd<=2?'var(--amber)':'inherit'}">${q.noExpiry?'기한 없음':`D-${dd}`}</span> · 고철 ${q.reward}</span></button>`; });
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
  function fieldBoardBudgetHtml(budget){
    const resources=(budget&&Array.isArray(budget.resources)?budget.resources:[])
      .filter(resource=>resource&&resource.label&&Number.isFinite(Number(resource.current))&&Number.isFinite(Number(resource.amount)));
    if(!resources.length) return '';
    const kind=budget.kind==='gain'?'gain':budget.kind==='barter'?'barter':'spend';
    const labels=kind==='gain'?['보유','받음','판매 후']:kind==='barter'?['보유','교환','교환 후']:['보유','결제','결제 후'];
    const values=resources.map(resource=>{
      const current=Math.floor(Number(resource.current)),amount=Math.floor(Math.abs(Number(resource.amount)));
      const infinite=kind!=='gain'&&G.isInfiniteResourceMode()&&G.isInfiniteResourceKey(resource.key||resource.label);
      return {...resource,current,amount,infinite,after:infinite?current:kind==='gain'?current+amount:current-amount};
    });
    const stageValue=(resource,stage)=>{
      if(stage===0) return `<i>${esc(resource.label)}</i><b>${resource.infinite?'∞':resource.current}</b>`;
      if(stage===1) return `<i>${esc(resource.label)}</i><b>${resource.infinite?'소모 없음':`${kind==='gain'?'+':'−'}${resource.amount}`}</b>`;
      if(resource.infinite) return `<i>${esc(resource.label)}</i><b>∞</b><strong>유지</strong>`;
      if(resource.after<0) return `<i>${esc(resource.label)}</i><b class="is-short">${Math.abs(resource.after)}</b><strong>부족</strong>`;
      return `<i>${esc(resource.label)}</i><b>${resource.after}</b>${kind==='gain'?'':'<strong>남음</strong>'}`;
    };
    const aria=labels.map((label,index)=>`${label} ${values.map(resource=>{
      if(index===0) return `${resource.label} ${resource.infinite?'무한':resource.current}`;
      if(index===1) return `${resource.label} ${resource.infinite?'소모 없음':resource.amount}`;
      if(resource.infinite) return `${resource.label} 무한 유지`;
      return resource.after<0?`${resource.label} ${Math.abs(resource.after)} 부족`:`${resource.label} ${resource.after}${kind==='gain'?'':' 남음'}`;
    }).join(', ')}`).join('. ');
    return `<div class="field-board-budget field-board-budget-${kind}" role="group" aria-label="${esc(aria)}">
      ${labels.map((label,index)=>`<div class="field-board-budget-stage" data-budget-stage="${['current','change','after'][index]}"><small>${label}</small>${values.map(resource=>`<span data-budget-resource="${esc(resource.label)}">${stageValue(resource,index)}</span>`).join('')}</div>`).join('')}
    </div>`;
  }
  function fieldBoardShell({mode,title,sub,status,body,selectedLabel,actionMeta,actionBudget,actionLabel,actionAttrs='',disabled=false}){
    const palette=settlementFieldPalette(curStl), stl=D.stls[curStl];
    const budgetHtml=fieldBoardBudgetHtml(actionBudget);
    return `<section class="field-board field-board-${mode} field-board-visual-finish" data-field-board="${mode}" data-field-board-city="${curStl}" style="--fb-wall:${palette.wall};--fb-trim:${palette.trim};--fb-win:${palette.win};--fb-dark:${palette.dark};--roof:${palette.roof};--light:${palette.light};--accent:${palette.accent}">
      <header class="field-board-head">
        <span class="field-board-mark">${esc((stl&&stl.name)||'')} · ${esc(FIELD_BOARD_LABEL[mode]||'')}</span>
        <div><span><i aria-hidden="true"></i><h3>${esc(title)}</h3></span><em>${esc(status)}</em></div>
        <p>${esc(sub)}</p>
      </header>
      <div class="field-board-body">${body}</div>
      <footer class="field-board-action ${budgetHtml?'has-budget':''}">
        <div class="field-board-action-copy"><small>선택</small><b>${esc(selectedLabel||'선택 없음')}</b><em>${esc(actionMeta||(!budgetHtml?'고를 수 있는 항목이 없다':''))}</em>${budgetHtml}</div>
        <button id="${mode}-action" ${actionAttrs} ${disabled?'disabled':''}>${esc(actionLabel||'선택')}</button>
      </footer>
    </section>
    <button class="stl-section-back field-board-back" id="stl-hub-back">← ${esc(stl.name)}${directionParticle(stl.name)} 돌아간다</button>`;
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
        meta:`${q.noExpiry?'기한 없음':`D-${Math.max(0,q.due-S.day)}`} · 고철 ${q.reward}`,action:ready?'전달한다':'진행 중',enabled:ready});
    } else {
      stlQuests=G.rollQuests();
      stlQuests.forEach((q,index)=>{const K=G.QKIND[q.kind],dd=q.due-S.day;
        questRows.push({key:`quest-${index}`,kind:'quest',index,label:`${q.story?'연속 의뢰':K.nm} · ${G.questLabel(q)}`,
          sub:G.questDesc(q).replace(/^\"|\"$/g,''),meta:`${q.noExpiry?'기한 없음':`D-${dd}`} · 고철 ${q.reward}`,action:'맡는다',enabled:true});
      });
    }
    const supplyRows=[];
    const waterRow=stl.trade.find(row=>row[1]==='water'), foodRow=stl.trade.find(row=>row[1]==='food');
    if(waterRow&&foodRow){
      const price=Math.max(1,Math.round((waterRow[3]*G.marketMul(curStl,'water')+foodRow[3]*2*G.marketMul(curStl,'food'))*disc));
      const fits=G.canStoreSupply('water',waterRow[2])&&G.canStoreSupply('food',foodRow[2]*2);
      supplyRows.push({key:'bundle',kind:'bundle',label:'길 위 기본 보급',
        sub:`물 ${waterRow[2]}통 + 식량 ${foodRow[2]*2}일치 · 물 ${S.water}/${S.waterMax} · 식량 ${S.food}/${S.foodMax}`,
        meta:fits?`고철 ${price} · 40분`:'보관 공간 부족',cost:price,reason:fits?'':'보관 공간 부족',
        duration:'40분',action:'한 번에 싣기',enabled:G.hasResource('scrap',price)&&fits,icon:'parts'});
    }
    stl.trade.forEach((row,index)=>{
      const [label,key,qty,price0]=row, trusted=localImpact.discount<1;
      const shown=trusted&&key==='barter_wf'?'물 1통 ⇄ 식량 1':
        trusted&&key==='barter_fp'?'식량 1 ⇄ 부품 1':trusted&&key==='barter_mf'?'의약품 1 ⇄ 식량 4':label;
      const group=key.startsWith('barter')?'물물교환':key.startsWith('item')?'도구와 부품':'주행과 보급';
      if(key.startsWith('barter')){
        const barterCost=key==='barter_wf'?{label:'물',current:S.water,amount:trusted?1:2}:
          key==='barter_fp'?{label:'식량',current:S.food,amount:trusted?1:2}:{label:'의약품',current:S.items['의약품']||0,amount:1};
        const foodGain=key==='barter_wf'?1:key==='barter_mf'?(trusted?4:3):0;
        const barterKey=key==='barter_wf'?'water':key==='barter_fp'?'food':'의약품';
        const fits=!foodGain||G.canStoreSupply('food',foodGain), enough=G.hasResource(barterKey,barterCost.amount);
        supplyRows.push({key:`trade-${index}`,kind:'trade',index,group,label:shown,
          sub:`물자를 맞바꾼다${foodGain?` · 식량 ${S.food}/${S.foodMax}`:''}`,meta:fits?'교환 · 25분':'식량 보관 공간 부족',
          reason:fits?'':'식량 보관 공간 부족',duration:'25분',barterCost,action:'교환한다',enabled:enough&&fits,icon:key==='barter_wf'?'water':key==='barter_fp'?'food':'med'});
      } else {
        const price=Math.max(1,Math.round(price0*G.marketMul(curStl,key)*disc)),mul=G.marketMul(curStl,key);
        const priceNote=mul<=.9?' · 이 동네가 싸다':mul>=1.2?' · 여긴 귀하다':'';
        const finite=key==='water'||key==='food',fits=!finite||G.canStoreSupply(key,qty);
        supplyRows.push({key:`trade-${index}`,kind:'trade',index,group,label,
          sub:`${qty}${key==='fuel'?'L를':key==='water'?'통을':key==='food'?'일치를':'개를'} 싣는다${priceNote}${finite?` · ${S[key]}/${G.supplyMax(key)} 보관`:''}`,
          meta:fits?`고철 ${price} · 25분`:'보관 공간 부족',cost:price,reason:fits?'':'보관 공간 부족',duration:'25분',action:'산다',enabled:G.hasResource('scrap',price)&&fits,
          icon:key==='fuel'?'fuel':key==='water'?'water':key==='food'?'food':ITEM_ICO[key.slice(4)]||'parts'});
      }
    });
    const demand=G.stlDemand(curStl);
    if(demand){
      const have=demand.item==='식량'?S.food:(S.items[demand.item]||0),need=demand.item==='식량'?2:1;
      const demandKey=demand.item==='식량'?'food':demand.item;
      supplyRows.push({key:'sell',kind:'sell',group:'매입',label:`${demand.item} 1${demand.item==='식량'?'일치':''}`,
        sub:demand.why,meta:`고철 +${demand.price} · 20분`,gain:demand.price,duration:'20분',action:'판다',enabled:G.hasResource(demandKey,need),icon:ITEM_ICO[demand.item]||'food'});
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
    const actionMeta=selected
      ? selected.reason|| (selected.duration?`${selected.duration} 소요`:selected.meta)
      :'고를 수 있는 항목이 없다';
    const actionBudget=selected&&selected.cost!=null
      ? {kind:'spend',resources:[{label:'고철',current:S.scrap,amount:selected.cost}]}
      : selected&&selected.barterCost
        ? {kind:'barter',resources:[selected.barterCost]}
        : selected&&selected.kind==='sell'
          ? {kind:'gain',resources:[{label:'고철',current:S.scrap,amount:selected.gain||0}]}
          : null;
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
      selectedLabel:selected&&selected.label,actionMeta,actionBudget,actionLabel:selected&&selected.action,
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
    const recruitOpen=!!(stl.recruit&&recruitDef&&recruitDef.meet&&!G.hasComp(stl.recruit)&&!S.recruitQ);
    if(recruitOpen){const comp=D.comps[stl.recruit],met=S.used.includes(recruitDef.meet);rows.push({key:`recruit-${stl.recruit}`,kind:'recruit',id:stl.recruit,
      label:comp.name,sub:comp.bio,meta:met?'다시 이야기':'처음 보는 사람',action:met?'다시 말을 건다':'다가가 말을 건다',enabled:true});}
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
    const boardBody=`${resultHtml}<section class="field-board-group"><header><span>현장 동선</span><b>${comp?' · '+esc(comp.name)+' 동행':'주민과 작업을 고른다'}</b></header>
      <div class="field-board-list stl-field-switcher">${actionRows}</div></section>`;
    body.innerHTML=fieldBoardShell({mode:'alley',title:field.title||spot.label,sub:field.desc||spot.sub,
      status:impact.count?'이곳에서 함께한 일이 남아 있다':'주민과 이야기를 나누거나 일을 맡을 수 있다',body:boardBody,
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
      <em>${impact.count?esc(impactCopy.line):'아직 우리가 바꾼 것은 없다'}</em></span></div>`;
    if(actions.length){
      const pos=actions.length===1?50:Math.round(focusIndex/(actions.length-1)*100);
      if(illustrated){
        h+=`<section class="stl-field-map stl-field-illustrated" data-focus="${stlFieldFocus}" style="--field-pos:${pos}%;--field-scene:url('${illustratedScene}')" aria-label="${esc(field.title)} 실제 장터 배치">
          <div class="stl-field-map-head"><b>밀양 닷새장 · 현장 동선</b><span>주민과 작업을 고른다</span></div>
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
        <div class="stl-field-map-head"><b>현장 동선</b><span>주민과 작업을 고른다</span></div>
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
  function showStl(stlId,mode='hub',options={}){
    if(S&&S.at&&D.nodes[S.at]&&D.nodes[S.at].stl) S.roadGarage=false;   // 진짜 정착지는 제값
    if(curStl!==stlId){ marketSelection=null; garageSelection=''; peopleSelection=''; stlFieldFocus=''; restoreSettlementFocus(stlId); }
    if(options.previewOnly&&options.questId){
      if(S.quest?.ledgerId===options.questId&&G.questReady()) marketSelection={key:'quest-active'};
      else if(S.questFollowup?.ledgerId===options.questId&&!S.quest) marketSelection={key:'quest-0'};
    }
    curStl=stlId;
    stlMode=mode||'hub';
    const fieldBoardMode=['market','garage','people','alley'].includes(stlMode);
    const fieldBoardMarket=fieldBoardMode&&stlMode==='market';
    const stl=D.stls[stlId];
    if(!options.previewOnly) G.qualityMilestone('first_settlement_visit',{settlementId:stlId,mode:stlMode});
    AMBI.settlement(stlMode,stlId);
    if(!options.previewOnly&&!G.isNight()) G.checkQuest();   // 목표에서는 게시판의 전달 버튼으로 결정한다.
    $('#ovl-stl').classList.toggle('field-board-mode',fieldBoardMode);
    if(stlMode==='hub'){ renderSettlementHub(); return; }
    if(G.isNight()&&stlMode!=='people'){ stlFocus='people'; renderSettlementHub(); return; }
    SCENE.closeSettlement();
    $('#ovl-stl').classList.remove('hub-mode');
    delete $('#ovl-stl').dataset.settlementView;
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
    if(!fieldBoardMarket) h+=`<button class="stl-section-back" id="stl-hub-back">← ${esc(stl.name)}${directionParticle(stl.name)} 돌아간다</button>`;
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
        <button class="tbtn" data-bundle="1" ${!G.hasResource('scrap',bundlePrice)?'disabled':''}>한 번에 싣기</button></div>`;
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
          <button class="tbtn" data-t="${i}" ${!G.hasResource('scrap',price)?'disabled':''}>산다</button></div>`;
      }
    });
    /* 매입 — 이 마을이 웃돈 주고 사는 것. 싣고 온 물건이 장사가 된다 */
    const dm=G.stlDemand(curStl);
    if(dm){
      const have=dm.item==='식량'?S.food:(S.items[dm.item]||0);
      h+=`<div class="trade-group-label">매입</div>
        <div class="trade-row trade-demand"><span class="tn">${ICO(ITEM_ICO[dm.item]||'food')}${dm.item} 1 ${dm.item==='식량'?'(일치)':''}<em>${esc(dm.why)}</em></span>
        <span class="tp">${ICO('scrap')}고철 +${dm.price}</span>
        <button class="tbtn" data-sell="1" ${!G.hasResource(dm.item==='식량'?'food':dm.item,dm.item==='식량'?2:1)?'disabled':''}>판다</button></div>`;
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
    const knownUpgrade=(D.upgrades||[]).some(row=>row.id===u.id);
    const art=(D.upgradeItemArt&&D.upgradeItemArt[u.id])
      ||(!knownUpgrade&&D.upgradeArt&&D.upgradeArt[group.id])||'';
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
    const opening=!ovl.classList.contains('on');
    const activeView=opening?'prepare':body.dataset.campView||'prepare';
    const previousScroll=opening?0:body.querySelector('.camp-scroll')?.scrollTop||0;
    const party=G.campParticipants();
    const conversation=G.currentCampConversation();
    const resolved=!!(conversation&&conversation.choiceId);
    const pending=!!(conversation&&!conversation.choiceId);
    const location=S.at&&D.nodes[S.at]?D.nodes[S.at].name:'길가';
    const timeLabel=G.campTimeLabel();
    const wakeNeed=G.mealNeed('breakfast');
    const hungerLevel=S.hunger||0;
    const hungerText=hungerLevel===1?'허기 1/3':hungerLevel>1?`${G.hungerLabel(hungerLevel)} ${hungerLevel}/3`:'허기 0/3';
    const planned=plan.meal||plan.repair||plan.talk;
    const homeState={party:S.party,up:S.up,memories:S.campMemories,keepsakes:D.companionKeepsakes,upgrades:D.upgrades,scene:D.scenes?.['dalguji-home-interior-v1']};
    const activity={
      minji:'민지가 엔진과 차체를 점검하고 있다.',parkss:'박 선생이 약 가방과 구급품을 정리하고 있다.',kangwoo:'강우가 주차 위치와 주변을 확인하고 있다.',
      leo:'레오가 기타를 정리하고 보리의 자리를 마련하고 있다.',jaeyi:'재이가 오늘 모은 물건과 짐을 분류하고 있다.',eunsu:'은수가 야간 수신 주파수를 확인하고 있다.'
    };
    const campSceneByComp={
      minji:'comp-talk-minji-camp-v1',parkss:'comp-talk-parkss-camp-v1',kangwoo:'comp-talk-kangwoo-camp-v1',
      leo:'comp-talk-leo-camp-v1',jaeyi:'comp-talk-jaeyi-camp-v1',eunsu:'comp-talk-eunsu-camp-v1'
    };
    const seed=`${S.day}:${S.at||'road'}:${party.join('|')}`;
    const campHash=[...seed].reduce((sum,ch)=>((sum*31)+ch.charCodeAt(0))>>>0,2166136261);
    const lastPlan=plan.last||(plan.talk?'talk':plan.repair?'repair':plan.meal?'meal':'');
    const crewSceneId=lastPlan==='talk'&&plan.talk?plan.talk
      :lastPlan==='repair'&&party.includes('minji')?'minji'
      :party.length?party[campHash%party.length]:null;
    const crewSceneKey=lastPlan==='repair'&&crewSceneId==='minji'
      ?'comp-talk-minji-road-v1'
      :crewSceneId?campSceneByComp[crewSceneId]:'';
    const visuals=[
      {key:'camp-home-stage-v1',label:'야영지 확인',detail:'차를 세웠다. 식사나 점검, 대화를 고르거나 바로 쉴 수 있다.'},
      {key:'camp-life-meal-v1',label:'한 끼 준비',detail:plan.meal?'식량과 물을 나눠 따뜻한 한 끼를 먹었다.':'식사할 공간이 있다. 식량과 물은 아직 꺼내지 않았다.'},
      {key:'camp-life-organize-v1',label:'짐 정리',detail:'침구, 지도, 물통과 공구를 놓을 공간을 살핀다.'},
      crewSceneId
        ?{key:crewSceneKey,
          label:lastPlan==='repair'&&crewSceneId==='minji'?'민지와 차량 점검':lastPlan==='talk'?`${D.comps[crewSceneId].name}와 이야기`:`${D.comps[crewSceneId].name}의 야영 작업`,
          detail:lastPlan==='repair'&&crewSceneId==='minji'?'민지가 엔진과 구동부를 확인하고, 나는 작업등과 공구를 준비했다.'
            :lastPlan==='talk'?(S.campMemories&&S.campMemories[crewSceneId]?S.campMemories[crewSceneId].home:'아직 나눈 대화가 없다.')
              :activity[crewSceneId]||'동료가 맡은 야영 작업을 진행하고 있다.'}
        :{key:'camp-life-sleep-v1',label:'잠자리 준비',detail:'잠자리에 들기 전이다. 준비 없이도 아침까지 쉴 수 있다.'},
      {key:'camp-life-watch-v1',label:'차량·주변 점검',detail:plan.repair?'차량을 점검했다. 취침하는 동안 마무리할 정비가 남았다.':'차량 문과 바퀴를 살필 수 있다. 아직 추가 점검은 하지 않았다.'}
    ];
    let visualIndex=0;
    if(lastPlan==='meal') visualIndex=1;
    else if(lastPlan==='talk') visualIndex=3;
    else if(lastPlan==='repair') visualIndex=party.includes('minji')?3:4;
    const visual=visuals[visualIndex];
    // Existing home/meal plates depict night. Daytime uses only a present
    // companion's daylight plate; solo daytime keeps the compact status strip.
    const daylight=S.min>=360&&S.min<1020;
    const sceneKey=daylight?(crewSceneId?`comp-talk-${crewSceneId}-road-v1`:''):visual.key;
    const campScene=D.scenes&&D.scenes[sceneKey]||'';
    const portraitHtml=id=>{
      const comp=D.comps[id], portrait=D.portraits&&D.portraits[id];
      return portrait?`<img src="${portrait}" alt="">`:`<span aria-hidden="true">${comp.face}</span>`;
    };
    const resource=`<div class="camp-storage" role="list" aria-label="현재 야영 물자">
      <span role="listitem"><small>식량</small><b>${G.resourceDisplay('food',S.food)}</b></span>
      <span role="listitem"><small>물</small><b>${G.resourceDisplay('water',S.water)}</b></span>
      <span role="listitem" aria-label="${esc(hungerText)}"><small>허기</small><b>${esc(G.hungerLabel(hungerLevel))}</b></span>
      <span role="listitem"><small>부품</small><b>${G.resourceDisplay('부품',S.items['부품']||0)}</b></span>
      <span role="listitem"><small>고철</small><b>${G.resourceDisplay('scrap',S.scrap)}</b></span>
    </div>`;
    body.innerHTML=`<section class="camp-home ${opening?'camp-opening':''}">
      <nav class="camp-view-nav" aria-label="야영 공간">
        <button type="button" data-camp-view="prepare" aria-pressed="${activeView==='prepare'}">야영 준비</button>
        <button type="button" data-camp-view="home" aria-pressed="${activeView==='home'}">차 안 둘러보기</button>
      </nav>
      <div class="camp-scroll">
      <section data-camp-panel="prepare" aria-label="야영 준비하기" ${activeView==='prepare'?'':'hidden'}>
      <div class="camp-live-stage ${plan.meal?'meal-ready':''} ${plan.repair?'repair-ready':''} ${plan.talk?'talk-ready':''}">
        ${campScene?`<div class="camp-live-image" data-camp-scene="${esc(sceneKey)}" data-camp-scene-index="${visualIndex+1}" role="img" aria-label="${esc(D.sceneDescriptions&&D.sceneDescriptions[sceneKey]||visual.detail)}" style="--camp-scene:url('${campScene}')">
          <div class="camp-live-caption"><b>${esc(visual.label)}</b><span>${esc(location)} · ${party.length?`함께 ${party.length}명`:'혼자 야영'}</span></div>
        </div>`:''}
      </div>
      ${resource}
      <div class="camp-home-section camp-prep-section"><div class="camp-section-head"><b>잠들기 전에</b><small>필요한 준비만 골라도 됩니다.</small></div>
        <button class="camp-prep ${plan.meal?'done':''}" data-camp-prep="meal" ${plan.meal?'disabled':''}><span>${ICO('food')} <strong>한 끼 준비</strong><small>식량 1 · 물 1 사용 / 사기 +3 · 피로 -6 · 허기 -1</small></span><em>${plan.meal?'완료':'선택'}</em></button>
        <button class="camp-prep ${plan.repair?'done':''}" data-camp-prep="repair" ${plan.repair?'disabled':''}><span>${ICO('parts')} <strong>차량 점검</strong><small>부품 1 사용 / 취침 후 차체 +8</small></span><em>${plan.repair?'완료':'선택'}</em></button>
      </div>
      <div class="camp-home-section"><div class="camp-section-head"><b>함께 이야기할 사람</b><small>쉬기 전 한 사람과 이야기할 수 있습니다. 대답하기 전에는 시간이 흐르지 않습니다.</small></div>
        <div class="camp-talk-list">${party.length?party.map(id=>`<button class="camp-talk ${resolved&&conversation.cid===id?'done':''}" data-camp-talk="${id}" ${resolved&&conversation.cid!==id?'disabled':''}><span>${portraitHtml(id)} <strong>${esc(D.comps[id].name)}${S.party.includes(id)?'':'<small>임시 동행</small>'}</strong></span><em>${resolved&&conversation.cid===id?'다시 읽기':pending&&conversation.cid===id?'이어서':'이야기'}</em></button>`).join(''):'<p class="camp-empty">함께 머무는 사람이 없어 오늘은 혼자 쉽니다.</p>'}</div>
      </div>
      </section>
      <section data-camp-panel="home" aria-label="차 안 둘러보기" ${activeView==='home'?'':'hidden'}>${HOME.html(homeState)}</section>
      </div>
      <div class="camp-rest"><span>${S.min<390?'오늘':'다음 날'} 아침 식량 ${wakeNeed} · 물 ${wakeNeed} 필요</span><button class="act" id="camp-rest"><span>${planned?'준비를 마치고 아침까지 쉬기':'바로 아침까지 쉬기'}</span></button></div>
    </section>`;
    HOME.wire(body,homeState);
    body.dataset.campView=activeView;
    const viewButtons=Array.from(body.querySelectorAll('[data-camp-view]'));
    const viewPanels=Array.from(body.querySelectorAll('[data-camp-panel]'));
    const viewScroll={prepare:0,home:0,[activeView]:previousScroll};
    const scroller=body.querySelector('.camp-scroll');
    scroller.scrollTop=previousScroll;
    viewButtons.forEach(button=>button.onclick=()=>{
      viewScroll[body.dataset.campView]=scroller.scrollTop;
      body.dataset.campView=button.dataset.campView;
      viewButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
      viewPanels.forEach(panel=>{panel.hidden=panel.dataset.campPanel!==button.dataset.campView;});
      scroller.scrollTop=viewScroll[button.dataset.campView];
    });
    $('#camp-mini').textContent=`${location} · ${timeLabel}`;
    ovl.classList.add('on'); ovl.setAttribute('aria-hidden','false');
    if(opening) requestAnimationFrame(()=>{
      ovl.scrollTop=0;
      $('#camp-x').focus({preventScroll:true});
    });
    $('#camp-x').onclick=()=>closeOvl('#ovl-camp');
    body.querySelectorAll('[data-camp-prep]').forEach(b=>b.onclick=()=>{
      const r=G.prepareCamp(b.dataset.campPrep); if(!r.ok) UI.toast(r.why); showCampHub();
    });
    body.querySelectorAll('[data-camp-talk]').forEach(b=>b.onclick=()=>{
      const current=G.currentCampConversation();
      const reading=current&&current.choiceId&&current.cid===b.dataset.campTalk;
      const r=reading?{ok:true}:G.prepareCamp('talk',b.dataset.campTalk);
      if(!r.ok){ UI.toast(r.why); return; }
      S.campConversation.active=true; G.save();
      closeOvl('#ovl-camp'); showEvent(G.campConversationEvent());
    });
    $('#camp-rest').onclick=()=>{ closeOvl('#ovl-camp'); G.camp(); };
  }
  function renderGarage(){
    const body=$('#stl-body'); if(!body) return;
    const quote=G.settlementRepairQuote(),repCost=quote.cost,repairNeeded=S.van<S.vanMax-5;
    const canRep=repairNeeded&&G.hasResource('scrap',repCost);
    const groups=D.upgradeGroups||[];
    let group=groups.find(x=>x.id===garageGroup)||groups[0];
    garageGroup=group.id;
    const groupIcon={fuel:'fuel',seating:'bond',chassis:'van',utility:'parts',power:'perk',camp:'food',living:'water'}[group.id]||'parts';
    const ownedN=group.ids.filter(id=>S.up[id]).length;
    const upgrades=group.ids.map(id=>G.upDef(id)).filter(Boolean);
    const vanStage=G.vanStage();
    const rows=[{key:'repair',kind:'repair',label:'차체 정비',sub:`내구 +${quote.amount}${G.hasComp('minji')?' · 민지 할인':''} · 현재 ${Math.floor(S.van)}/${S.vanMax}`,
      meta:`고철 ${repCost} · ${G.durationLabel(quote.mins)}`,duration:G.durationLabel(quote.mins),
      budget:repairNeeded?{kind:'spend',resources:[{label:'고철',current:S.scrap,amount:repCost}]}:null,
      reason:!repairNeeded?'차체가 충분히 튼튼하다':!G.hasResource('scrap',repCost)?'고철 부족':'',
      action:repairNeeded?'수리한다':'차체 양호',enabled:canRep,icon:'parts'}]
      .concat(upgrades.map(u=>{const owned=!!S.up[u.id],chk=G.canBuyUp(u.id);
        const scrapCost=G.upScrapCost(u),duration=G.durationLabel(G.upgradeMinutes(u));
        return {key:`upgrade-${u.id}`,kind:'upgrade',id:u.id,label:u.nm,sub:u.d,installation:G.upInstallationInfo(u.id),icon:groupIcon,
          meta:owned?'장착 완료':`고철 ${scrapCost}${u.cost.parts?' + 부품 '+u.cost.parts:''} · ${duration}`,duration,
          budget:owned?null:{kind:'spend',resources:[{label:'고철',current:S.scrap,amount:scrapCost}]
            .concat(u.cost.parts?[{label:'부품',current:S.items['부품']||0,amount:u.cost.parts}]:[])},
          action:owned?'장착 완료':chk.ok?'장착한다':'잠김',enabled:!owned&&chk.ok,reason:owned?'이미 장착했다':chk.why||''};
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
      <span class="field-board-row-copy"><b>${esc(row.label)}</b><small>${esc(row.sub)}</small>${row.key===garageSelection&&row.installation?`<small>${esc(row.installation)}</small>`:''}</span>
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
      actionMeta:selected?[selected.reason,selected.duration&&`${selected.duration} 소요`].filter(Boolean).join(' · '):'',
      actionBudget:selected&&selected.budget,actionLabel:selected&&selected.action,
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
      if(S.recruitQ.id!==id){
        const active=D.recruitQuests&&D.recruitQuests[S.recruitQ.id];
        const target=S.recruitQ.target&&D.nodes[S.recruitQ.target];
        UI.toast(active
          ? `${active.name}의 부탁을 먼저 끝내야 한다${target?` — 목적지: ${target.name}`:''}`
          : '먼저 지금 맡은 합류 부탁을 끝내야 한다');
        return;
      }
      closeOvl('#ovl-stl'); G.openRecruitStep(); return;
    }
    const def=D.recruitQuests&&D.recruitQuests[id];
    if(def&&!G.hasComp(id)){
      closeOvl('#ovl-stl');
      if(G.openRecruitMeet(id)) return;
    }
    UI.toast(G.hasComp(id)?'이미 달구지에 함께 타고 있다':'이 사람과 나눌 이야기를 찾지 못했다');
  }
  /* ── NPC 대화 ── */
  function talk(nid){
    const npc=D.npcs[nid], st=S.npcs[nid];
    if(!st.met && G.hasPerk('leo_fame')) st.att+=15;   // 길 위의 명성
    const tries=S.flags.seoulTries||0;
    const greet = (nid==='deokgu'&&tries>0)
      ? (tries===1? '…돌아왔냐. 남산이 "아직"이래? 흥, 그럴 줄 알았다. 성문은 안 좁아지니까 천천히 해라. 못 실은 게 뭔지는— 네 차가 제일 잘 알 거다.'
        : `…${tries}번째다, 이 미친놈들. 근데 이상하지. 올 때마다 차가 무거워 보여. 짐이 아니라 뭐가 다른 게 실리는 모양이야. …밥은 먹었냐. 국밥 시켜놨다.`)
      : D.npcGreeting(nid,st);
    st.met=true;
    G.save(); // Keep first-meeting/fame state even on cancel.
    if(S.mode==='offroad'&&OFF.ready()){ return talkOff(nid, greet); }
    let history=[];
    const present=(text,actions)=>{
      if(curEv?.localConversation&&curStory?.eventId===`local_chat_${nid}`)history=storyDisplayTurns(curStory);
      showNpcDialogue(nid,[{kind:'dialogue',who:nid,name:npc.name,text}],actions||options(),{history});
    };
    const options=()=>[
      ...(!S.flags['rumor_'+nid]?[{label:'요즘 소문 들은 거 없어요?',run:()=>{
        S.flags['rumor_'+nid]=true; st.att+=5;
        const ru=npc.rumor;
        if(ru.reveal) G.applyFx({reveal:ru.reveal, note:{type:'소문',title:npc.name+'의 소문',body:ru.text,links:[D.nodes[ru.reveal].name, npc.name]}});
        else G.applyFx({note:{type:'소문',title:npc.name+'의 소문',body:ru.text,links:[npc.name]}});
        G.save();present(ru.text,[{label:'고맙습니다',run:()=>{closeEvent();showStl(curStl,'people');}}]);
      }}]:[]),
      {label:'이런저런 얘기를 나눈다',run:()=>{
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
        const line=pick(lines);
        G.addNote({type:'인물',title:npc.name,body:`${npc.role}. ${D.stls[curStl].name}의 사람.`,links:[D.nodes[npc.node].name]});
        renderHud(); G.save();present(line);
      }},
      {label:'그만 일어난다',run:()=>closeEvent()}
    ];
    present(greet);
  }
  // Small-talk uses the same measured reader, but never pretends to be a
  // persisted authored event. Closing returns to the still-mounted settlement.
  function showNpcDialogue(nid,turns,actions,opt={}){
    clearStoryAuto();const sheet=$('#ev-sheet'),npc=D.npcs[nid];
    curEv={id:`local_chat_${nid}`,type:'대화',title:npc.name,localConversation:true};
    const sceneKeys=eventSceneKeys({...curEv,locEvent:S.at});
    sheet.classList.remove('companion-profile-mode','comp-perk-reveal-mode','craft-workbench-mode','combat-details-open','story-compact');
    sheet.classList.add('event-mode','passenger-reader');
    Object.assign(sheet.dataset,{eventKind:'story',storySurface:'talk',eventId:curEv.id,storyOrigin:'',missionLayout:'',readerLayout:'pages'});
    sheet.innerHTML=`<div class="event-scroll"><section class="event-field-report"><div class="event-head"><h2>${esc(npc.name)}</h2><button class="event-detail-toggle" type="button" data-local-close aria-label="대화를 마치고 정착지로 돌아가기">닫기</button></div><div class="story-reader"></div></section></div><div class="event-choice-dock"></div>`;
    sheet.querySelector('.event-scroll').insertAdjacentHTML('afterbegin',sceneFrameHtml(sceneKeys,npc.name+'와 대화'));
    const state=curStory={phase:'event',eventId:curEv.id,turns,index:0,readerMode:'current',localHistory:opt.history||[],
      sceneKeys,sceneAlt:npc.name+'와 대화',sceneStart:0,knownSpeaker:true,offroad:opt.offroad,draft:'',
      finalDock:`<div class="choice-dock-head">내 대답</div><div class="choices">${actions.map((a,i)=>`<button type="button" class="choice" data-local-choice="${i}">${esc(a.label)}</button>`).join('')}</div>`,
      wireFinal:dock=>{
        dock.querySelectorAll('[data-local-choice]').forEach(button=>button.onpointerdown=()=>{state.consumeStoryPointerClick=false;});
        dock.querySelectorAll('[data-local-choice]').forEach(button=>button.onclick=e=>{
          if(curStory!==state)return;
          if(state.consumeStoryPointerClick){state.consumeStoryPointerClick=false;e.preventDefault();return;}
          state.localHistory=storyDisplayTurns(state);state.localHistory.push({kind:'action',text:actions[+button.dataset.localChoice].label});
          // Include a selection exactly once when the next speech is mounted.
          state.turns=[];state.readingPage.end={turn:0,offset:0};actions[+button.dataset.localChoice].run();
        });
        if(opt.offroad){
          const form=el('form','page-composer',`<label for="chat-txt">하고 싶은 말</label><div><input id="chat-txt" maxlength="120" autocomplete="off" placeholder="자유롭게 이야기하기"><button type="submit">말한다</button></div>`);
          dock.prepend(form);const input=form.querySelector('input');input.value=state.draft;
          input.oninput=()=>{state.draft=input.value;};form.onsubmit=e=>{e.preventDefault();sendChat();};
        }
      }};
    sheet.querySelector('[data-local-close]').onclick=()=>closeEvent();
    renderStoryState();openModal('#ev-wrap','.story-next, .choice');
    requestAnimationFrame(()=>{if(curStory===state)renderStoryState();});return state;
  }
  /* 오프로드 자유 대화 */
  function talkOff(nid, greet){
    chatNpc=nid;
    showNpcDialogue(nid,[{kind:'dialogue',who:nid,name:D.npcs[nid].name,text:greet}],
      [{label:'그만 일어난다',run:()=>closeEvent()}],{offroad:true});
  }
  async function sendChat(){
    const state=curStory,txt=$('#chat-txt')?.value.trim(),nid=chatNpc;
    if(!txt||!state?.offroad||state.pendingReply)return;
    state.pendingReply=true;
    const history=[...storyDisplayTurns(state),{kind:'dialogue',who:'me',name:G.myName(),text:txt}];
    const exit=[{label:'그만 일어난다',run:()=>closeEvent()}];
    const waiting=showNpcDialogue(nid,[{kind:'narration',text:'대답을 기다린다.'}],exit,{history});
    let reply=null;try{reply=await OFF.npcChat(nid,txt);}catch(_){/* Connection failure remains a retryable conversation. */}
    renderHud();G.save();if(curStory!==waiting)return;
    const turns=reply?[{kind:'dialogue',who:nid,name:D.npcs[nid].name,text:reply.reply},
      ...(reply.chips?.length?[{kind:'narration',text:reply.chips.map(c=>c.t).join(' · ')}]:[])]
      :[{kind:'narration',text:'대답이 도착하지 않았다. 연결을 확인하고 다시 이야기할 수 있다.'}];
    showNpcDialogue(nid,turns,exit,{history,offroad:true});
  }

  /* ── MAP node card ── */
  function showNodeCard(id){
    const card=$('#nodecard');
    if(!id){ card.classList.remove('on'); return; }
    const n=D.nodes[id];
    if(!n) { card.classList.remove('on'); return; }
    mapKbFocus=id;
    const compact=!!card.closest('.map-navigator');
    const visited=S.visited.includes(id);
    const here=S.at===id;
    const quest=S.quest&&S.quest.to===id;
    const status=here?'현재 위치':quest?'사이드 미션 위치':visited?'방문한 지역':'발견한 지역';
    const desc=visited||n.type!=='hidden'?(n.desc||'지도에 기록된 지역이다.'):'직접 가 보기 전에는 자세한 상황을 알 수 없다.';
    let h=`<h4>${esc(n.name)}</h4><div class="d">${esc(status)} · ${esc(desc)}</div>`;
    if(compact){
      h=`<div class="map-compact-place"><small>${esc(status)}</small><h4>${esc(n.name)}</h4></div>
        <div class="map-compact-summary"><span>${esc(desc)}</span></div>`;
    }
    card.innerHTML=h;
    card.classList.add('on');
  }
  function renderMapMini(){
    const place=S.driving?`${D.nodes[S.driving.from].name} → ${D.nodes[S.driving.to].name}`:(D.nodes[S.at]&&D.nodes[S.at].name||'위치 미상');
    $('#map-mini').textContent=`${place} · 발견 ${S.known.length}/${Object.keys(D.nodes).length}`;
  }
  function refreshMapSurface(){
    renderMapMini();
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
        appeal:{label:'부산에서 이의를 제기해 본다',detail:'원격 이의 제기가 왜 막혔는지 기록한다.',condition:'이의 제기 결과 기록'},
        module:{label:'계기판 배선을 엄마의 회로도와 비교한다',detail:'엄마가 남긴 장치가 실제로 달구지에 연결돼 있는지 확인한다.',condition:'계기판 배선 확인'},
        trace:{label:'첫 구간에서 이송표의 발신 기록을 찾는다',detail:'부모님의 이송표와 지금 나오는 표가 같은 곳에서 왔는지 확인한다.',condition:'발신 번호가 남은 기록 찾기'},
        key:{label:'엄마의 검증키를 꺼내는 방법을 찾는다',detail:'계기판에서 검증키를 떼려면 빠진 설명서 두 장이 필요하다.',condition:'빠진 설명서 2장 찾기'},
        witness:{label:'같은 이송표를 받은 사람들의 이야기를 모은다',detail:'사람들에게 들은 이야기를 발신 기록과 맞춰 본다.',condition:`이야기 ${witnessed}/${D.seoulPillars.관계}`},
        seoul:{label:'남산에서 강제 이송을 멈춘다',detail:'서울에 도착한 뒤 마지막 중단 절차를 밟는다.',condition:'기록과 증언을 모두 모으면 진행'}
      };
      const evidence=G.mainEvidenceOpportunity();
      const nextAction=evidence?{label:nextStep?.label||'빠진 기록을 확인한다',detail:evidence.hint,condition:'현장에서 기록과 응답 확인'}:nextActions[nextStep?.id]||{label:nextStep?.label||'이송 중단 기록을 보관한다',detail:nextStep?.detail||'완료한 기록을 달구지 안에 안전하게 보관한다.',condition:'목표 확인'};
      b.innerHTML=`<div class="folio-live-content">
        <div class="folio-title-row"><span>현재 목표</span><small>${esc(clock)}</small></div>
        <h3>남산 코어로 가서 강제 이송 명령을 멈춘다</h3>
        <div class="folio-location">${esc(D.nodes[S.at].name)}</div>
        <section class="folio-stakes" aria-label="메인 스토리의 이유와 남산에서 할 일"><div><span>왜 가야 하지?</span><p>엄마와 아빠를 갈라놓은 명령은 아직 끝나지 않았다. 지금도 다른 가족에게 같은 이송표가 나오고 있다.</p></div><div><span>남산에서 할 일</span><p>세 가지 근거로 자동 명령을 멈추고, 사람이 직접 확인해야만 이송할 수 있도록 바꾼다.</p></div></section>
        <section class="folio-progress" aria-label="목표 진행 ${done}/${steps.length}">
          <div class="folio-section-title"><b>진행 단계</b><span>${done}/${steps.length}</span></div>
          ${focusSteps.map((step,index)=>`<div class="folio-step ${step.done?'done':''}"><i>${step.done?'✓':focusStart+index+1}</i><span><b>${esc(step.label)}</b><small>${esc(step.detail)}</small></span></div>`).join('')}
        </section>
        <section class="folio-clue"><span>확인된 단서</span><b>${esc(clue?clue.label:'남산 진입 경로 도면')}</b><p>${esc(clue?clue.text:'엄마가 남긴 도면과 현재 길의 기록을 대조한다.')}</p></section>
        <div class="folio-support"><span>다음 행동</span><b>${esc(nextAction.label)}</b><p>${esc(nextAction.detail)}</p><dl class="folio-support-meta"><div><dt>현재 위치</dt><dd>${esc(D.nodes[S.at].name)}</dd></div><div><dt>완료 기준</dt><dd>${esc(nextAction.condition)}</dd></div></dl></div>
        <button class="folio-road-button" data-road-tool="road">길로 돌아가기</button>
      </div>`;
    }else{
      const ration=G.dailyRationInfo(), nextMeal=G.nextMealInfo();
      const supplyDays=ration.supplyDays;
      const parts=S.items['부품']||0;
      const entries=[
        {id:'부품',label:'부품',value:G.resourceDisplay('부품',parts),unit:'개',icon:'parts',desc:'오래됐지만 아직 쓸 만하다. 달구지 정비와 수리에 쓴다.'},
        {id:'의약품',label:'의약품',value:G.resourceDisplay('의약품',S.items['의약품']||0),unit:'개',icon:'meds',desc:'상처를 소독하고 응급처치를 할 때 쓰는 약품이다.'},
        {id:'탄약',label:'소총탄',value:G.resourceDisplay('탄약',S.items['탄약']||0),unit:'발',icon:'ammo',desc:'위험한 상황에서 총기를 사용해야 할 때 필요한 탄약이다.'},
        {id:'고철',label:'고철',value:G.resourceDisplay('scrap',S.scrap),unit:'개',icon:'scrap',desc:'상인과 거래하거나 달구지를 개조할 때 쓰는 재료다.'}
      ];
      if(!entries.some(entry=>entry.id===inventorySelection)) inventorySelection='부품';
      const selected=entries.find(entry=>entry.id===inventorySelection)||entries[0];
      const supplyLabel=G.isInfiniteResourceMode()?'무한 보급':Number.isFinite(supplyDays)?`${supplyDays}일치`:'충분';
      const hungerLevel=S.hunger||0;
      const hungerLabel=G.hungerLabel(S.hunger);
      b.innerHTML=`<div class="bag-live-content">
        <div class="bag-title-row"><h3>가방과 보급</h3><span class="bag-title-actions"><small>${esc(clock)}</small></span></div>
        <section class="bag-critical">
          <div>${ICO('water')}<span>물<b>${G.resourceDisplay('water',S.water)}${G.isInfiniteResourceMode()?'':`<em>/${S.waterMax}</em>`}</b></span></div>
          <div>${ICO('food')}<span>식량<b>${G.resourceDisplay('food',S.food)}${G.isInfiniteResourceMode()?'':`<em>/${S.foodMax}</em>`}</b></span></div>
          <div>${ICO('fuel')}<span>연료<b>${G.resourceDisplay('fuel',Math.floor(S.fuel))}${G.isInfiniteResourceMode()?'':`<em>/${S.fuelMax}L</em>`}</b></span></div>
        </section>
        <section class="bag-journey-overview${supplyDays<=1?' is-supply-low':''}" aria-label="보급 ${esc(supplyLabel)}, 차체 ${Math.floor(S.van)}퍼센트, 다음 ${esc(nextMeal.label)} ${esc(nextMeal.clock)}">
          <header class="bag-supply-head"><span><small>보급 계획</small><b>${esc(supplyLabel)}</b></span><span class="bag-hunger-state${hungerLevel>=2?' is-warn':''}"><small>허기</small><b>${esc(hungerLabel)} · ${hungerLevel}/3</b></span></header>
          <div class="bag-vehicle-state${S.van<35?' is-warn':''}"><span><small>차량 상태</small><b>차체 ${Math.floor(S.van)}%</b></span><i aria-hidden="true"><em style="width:${clamp(S.van/S.vanMax*100,0,100)}%"></em></i></div>
          <details class="bag-meal-disclosure"${innerHeight>650?' open':''}>
            <summary><span>다음 식사</span><b>${esc(nextMeal.label)} · ${esc(nextMeal.clock)}</b><small class="sr-only">필요 식량 ${nextMeal.food}${nextMeal.water?` · 물 ${nextMeal.water}`:''}, 하루 소비 식량 ${ration.foodPerDay} · 물 ${ration.waterPerDay}</small></summary>
            <div class="bag-meal-plan">
              <span><small>필요</small><b>식량 ${nextMeal.food}${nextMeal.water?` · 물 ${nextMeal.water}`:''}</b></span>
              <span><small>하루 소비</small><b>식량 ${ration.foodPerDay} · 물 ${ration.waterPerDay}</b></span>
            </div>
          </details>
        </section>
        <section class="bag-pockets" aria-label="가방 수납칸">${entries.map(entry=>`<button class="bag-pocket ${entry.id===selected.id?'selected':''}" data-bag-item="${entry.id}" aria-pressed="${entry.id===selected.id}" aria-label="${esc(entry.label)} ${entry.value??0}${entry.unit}${entry.id===selected.id?', 선택됨':''}">${ICO(entry.icon)}<span class="bag-pocket-name">${esc(entry.label)}</span><span class="bag-pocket-count"><small>보유</small><span class="bag-pocket-amount"><b>${entry.value??0}</b><small>${entry.unit}</small></span></span></button>`).join('')}</section>
        <section class="bag-detail compact-info"><div class="bag-detail-copy"><div class="bag-detail-heading"><span>${esc(selected.label)}</span><b>${selected.value??0}${selected.unit}</b></div><p>${esc(selected.desc)}</p></div></section>
      </div>`;
      b.querySelectorAll('[data-bag-item]').forEach(button=>button.onclick=()=>{
        inventorySelection=button.dataset.bagItem;
        renderStatus();
        requestAnimationFrame(()=>b.querySelector(`[data-bag-item="${inventorySelection}"]`)?.focus({preventScroll:true}));
      });
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
    prop.className=`road-tool-prop utility-sheet${stTab==='settings'?' settings-sheet':' journey-sheet'}${stTab==='growth'?' growth-sheet':''}${stTab==='self'?' self-sheet':''}${stTab==='crew'?' cabin-sheet':''}`;
    $('#status-title').textContent=stTab==='settings'?'화면·소리·백업 설정':stTab==='growth'?'능력과 성장':stTab==='crew'?'동료':'내 상태';
    $('#st-mini').textContent=`${S.day}일째 · ${Math.round(S.stats.km)}km`;
    document.querySelectorAll('#st-tabs button').forEach(x=>{
      const selected=x.dataset.st===stTab;
      x.classList.toggle('here',selected);
      x.setAttribute('aria-selected',String(selected));
      x.tabIndex=selected?0:-1;
    });
    const b=$('#st-body');
    const bar=(v,m,warn)=>`<div class="bar"><i style="width:${clamp(v/m*100,0,100)}%${warn?';background:var(--danger)':''}"></i></div>`;
    const kmPerL=(100/G.fuelFor(100,'normal')).toFixed(1);
    const ration=G.dailyRationInfo(), nextMeal=G.nextMealInfo();
    const knownN=S.known.filter(id=>!D.nodes[id].secret).length;
    const totalN=Object.keys(D.nodes).filter(id=>!D.nodes[id].secret).length;
    const stlVisited=Object.keys(D.stls).filter(sid=>S.visited.some(v=>D.nodes[v].stl===sid)).length;
    const dlv=G.driverLv(), dNext=D.driverLv[dlv+1];
    const installed=D.upgrades.filter(u=>S.up[u.id]);
    const vanStage=G.vanStage();
    const supplyDays=ration.supplyDays;
    const injuryIds=Object.keys(S.injuries||{});
    const route=G.routeStatus();
    const audioChannels=[['music','음악'],['ambience','환경음'],['effects','효과음'],['voice','목소리']];
    const injuryPanel=injuryIds.length?`<div class="st-sec"><h4>부상 · 전문 능력 일시 중지</h4>`+
      injuryIds.map(id=>{const x=S.injuries[id];return `<div class="st-row"><span class="k">${G.injuryName(id)}</span>
        <span class="v" style="flex:1;color:var(--danger)">${x.label} · ${x.days}일</span></div>`;}).join('')+
      `<div class="csub">아침마다 회복한다. 운전사 부상은 피로를 더 쌓고, 동료 부상은 해당 퍼크를 잠시 멈춘다.</div></div>`:'';
    const supplies=`<div class="st-sec inventory-primary"><h4>가방과 보급 <small>${G.isInfiniteResourceMode()?'테스트 자원 ∞':`${supplyDays}일치 · 하루 식량 ${ration.foodPerDay}`}</small></h4>
      <div class="st-row"><span class="k">${ICO('water')}물</span><span class="v" style="flex:1">${G.isInfiniteResourceMode()?'∞':`${S.water}/${S.waterMax}`} <small style="color:var(--faded)">${G.isInfiniteResourceMode()?'소모 없음':`≈ ${ration.waterDays}일치 · 하루 ${ration.waterPerDay}`}</small></span></div>
      <div class="st-row"><span class="k">${ICO('food')}식량</span><span class="v" style="flex:1">${G.isInfiniteResourceMode()?'∞':`${S.food}/${S.foodMax}`} <small style="color:var(--faded)">${G.isInfiniteResourceMode()?'소모 없음':`≈ ${ration.foodDays}일치 · 하루 ${ration.foodPerDay}`}</small></span></div>
      <div class="st-row"><span class="k">다음 ${esc(nextMeal.label)}</span><span class="v" style="flex:1">${esc(nextMeal.clock)} · 식량 ${nextMeal.food}${nextMeal.water?` · 물 ${nextMeal.water}`:''}</span></div>
      <div class="st-row"><span class="k">허기</span><span class="v" style="flex:1">${G.hungerLabel(S.hunger)} · ${S.hunger||0}/3</span></div>
      <div class="st-row"><span class="k">${ICO('scrap')}고철</span><span class="v" style="flex:1">${G.resourceDisplay('scrap',S.scrap)}</span></div>
      <div class="st-row"><span class="k">아이템</span><span class="v" style="flex:1">${['부품','의약품','탄약'].map(k=>`${ICO(ITEM_ICO[k])}${k==='탄약'?'소총탄':k} ${G.resourceDisplay(k,S.items[k]||0)}`).join(' · ')}</span></div>
      ${S.flags.armed_age?`<div class="st-row"><span class="k">무기</span><span class="v" style="flex:1">${['쇠파이프','석궁','볼트','화염병'].map(k=>`${k} ${S.items[k]||0}`).join(' · ')}</span></div>`:''}</div>`;

    let now=`<div class="st-summary">
      <div class="st-metric ${!G.isInfiniteResourceMode()&&S.fuel<10?'warn':''}"><span class="mk">연료</span><span class="mv">${G.resourceDisplay('fuel',Math.floor(S.fuel),'L')}</span></div>
      <div class="st-metric ${S.fatigue>=75?'warn':''}"><span class="mk">피로</span><span class="mv">${Math.floor(S.fatigue)}%</span></div>
      <div class="st-metric ${supplyDays<=1?'warn':''}"><span class="mk">보급</span><span class="mv">${G.isInfiniteResourceMode()?'∞':`${supplyDays}일`}</span></div>
    </div>
    ${supplies}
    ${injuryPanel}
    <div class="st-sec"><h4>운전사</h4>
      <div class="st-row"><span class="k">나</span><span class="v" style="flex:1">Lv.${dlv} 「${G.driverTitle()}」 <small style="color:var(--faded)">${dlv?`연비 -${dlv*2}% · 피로 -${dlv*6}%`:'주행거리로 숙련 상승'}</small>${G.isInjured('driver')?` <small style="color:var(--danger)">· ${S.injuries.driver.label}</small>`:''}</span></div>
      ${dNext?`<div class="st-row"><span class="k">다음 숙련</span>${bar(S.stats.km-D.driverLv[dlv].km, dNext.km-D.driverLv[dlv].km)}<span class="v">${Math.round(S.stats.km)}/${dNext.km}km</span></div>`:''}
      <div class="st-row"><span class="k">피로 ${ICO('fatigue_'+G.fatigueStage(), G.fatigueFace())}</span>${bar(S.fatigue,100,S.fatigue>=75)}<span class="v">${Math.floor(S.fatigue)}%</span></div>
      <div class="csub">85%부터 졸음 위험. 야영이나 숙박으로 회복한다.</div></div>
    <div class="st-sec"><h4>${esc(G.vanName())}</h4>
      <div class="van-name-edit"><label for="van-name-input">차 이름</label><input id="van-name-input" maxlength="12" value="${esc(G.vanName())}" aria-label="달구지 이름"><button data-save-van-name="1">바꾸기</button></div>
      <div class="st-row"><span class="k">내구도</span>${bar(S.van,S.vanMax,S.van<25)}<span class="v">${Math.floor(S.van)}/${S.vanMax}</span></div>
      <div class="st-row"><span class="k">연료</span>${bar(G.isInfiniteResourceMode()?S.fuelMax:S.fuel,S.fuelMax,!G.isInfiniteResourceMode()&&S.fuel<10)}<span class="v">${G.isInfiniteResourceMode()?'∞':`${Math.floor(S.fuel)}/${S.fuelMax}L`}</span></div>
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
      ${allStories?'여섯 사람의 증언 완성 · 남산 추가 장면 해금':'메인 기록으로 진입 준비 · 동료 미션은 각자의 후일담으로 이어짐'}
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
    const vacantSeats=Math.max(0,G.maxParty()-S.party.length);
    const companionTasks=G.companionQuestEntries();
    const crewPeople=stories.map(story=>{
      const keepsake=D.companionKeepsakes&&D.companionKeepsakes[story.id];
      const memory=S.campMemories&&S.campMemories[story.id];
      const task=companionTasks.find(row=>row.companion===story.id);
      const concern=story.injury?`${story.injury.label}. ${story.injury.days}일 동안 회복이 필요하다.`
        :memory&&memory.home?memory.home
        :story.joinedBy?story.joinedBy.memory:story.c.bio;
      return `<article class="crew-person">
        <button type="button" class="crew-person-open" data-comp2="${story.id}" aria-label="${esc(story.c.name)} 이야기와 능력 보기">
          <span class="crew-person-face">${faceOf(story.id,story.c.face)}</span>
          <span class="crew-person-heading"><b>${esc(story.c.name)}</b><small>${esc(story.c.role||story.c.cls)}</small><em>${story.st.pending?'특기 고르기':'이야기와 능력 보기'}</em></span>
        </button>
        <p class="crew-person-concern">${esc(concern)}</p>
        ${keepsake?`<div class="crew-keepsake"><b>${esc(keepsake.name)}</b><span>${esc(keepsake.desc)}</span></div>`:''}
        ${task&&task.status!=='completed'?`<details class="journey-disclosure"><summary>다음에 함께 할 일</summary><p>${esc(task.next)}</p></details>`:''}
      </article>`;
    }).join('');
    const guestNote=minjiGuestNoteHtml();
    const crew=`<div class="crew-cabin">
      ${!stories.length&&!guestNote?`<figure class="crew-seat-scene"><img src="${D.upgradeArt.passenger}" alt="기워 쓴 천과 접힌 담요가 놓인 달구지의 빈 조수석" decoding="async"></figure>`:''}
      ${guestNote&&!stories.length?'':`<header class="crew-cabin-title"><h3>${stories.length?'함께 타는 사람들':S.dog?'보리와 둘이서':'아직은 혼자 타는 길'}</h3>${!stories.length?'<p>길에서 만난 사람의 이야기를 듣고, 함께 갈지 정한다.</p>':''}</header>`}
      ${guestNote}
      ${crewPeople}
      ${S.dog?`<div class="crew-dog"><span>${faceOf('bori','🐕')}</span><p><b>보리</b><small>달구지에 함께 타고 있다.</small></p></div>`:''}
      <div class="crew-capacity"><span>${vacantSeats?`함께 탈 자리 ${vacantSeats}개가 남아 있다.`:'지금은 모든 자리에 동료가 타고 있다.'}</span><small>동료 ${S.party.length}명 / ${G.maxParty()}명</small></div>
      <button type="button" class="journey-action" data-crew-close>닫고 돌아가기</button>
    </div>`;

    const driverDef=D.driverLv[dlv];
    const driverKm=Math.round(S.stats.km);
    const driverPct=dNext?clamp((driverKm-driverDef.km)/(dNext.km-driverDef.km)*100,0,100):100;
    const driverEffect=dlv?`연료 소모 -${dlv*2}% · 주행 피로 -${dlv*6}%`:'길을 달릴수록 운전이 익숙해진다';
    const driverInjury=S.injuries&&S.injuries.driver;
    const currentActivity=S.driving
      ? `${esc(D.nodes[S.driving.from].name)}에서 ${esc(D.nodes[S.driving.to].name)}로 운전 중`
      : S.at&&D.nodes[S.at]
        ? `${esc(D.nodes[S.at].name)}에 머무는 중`
        : '다음 이동을 준비하는 중';
    const selfStatus=`<div class="self-status-console">
      <section class="self-status-hero">
        <span class="self-status-icon" aria-hidden="true">${ICO('driver','◉')}</span>
        <span class="self-status-copy"><b>운전석에서</b><span>${currentActivity}</span></span>
      </section>
      <section class="self-condition" aria-labelledby="self-condition-title">
        <header><b id="self-condition-title">${driverInjury?'몸을 돌볼 시간':S.fatigue>=75?'잠시 쉬어 갈 시간':'오늘의 몸 상태'}</b><em>${driverInjury?'치료 필요':'이동 가능'}</em></header>
        <div class="self-condition-grid">
          <article class="${S.fatigue>=75?'warn':''}"><small>피로</small><b>${Math.floor(S.fatigue)}%</b><span>${S.fatigue>=85?'졸음 위험':S.fatigue>=60?'휴식 권장':'아직 운전할 만하다'}</span><div class="self-meter"><i style="width:${clamp(S.fatigue,0,100)}%"></i></div></article>
          <article class="${(S.hunger||0)>=2?'warn':''}"><small>허기</small><b>${esc(G.hungerLabel(S.hunger))}</b><span>${S.hunger||0}/3 · 다음 식사 ${esc(nextMeal.clock)}</span></article>
          <article class="${driverInjury?'warn':''}"><small>부상</small><b>${driverInjury?esc(driverInjury.label):'없음'}</b><span>${driverInjury?`${driverInjury.days}일 뒤 회복`:'아픈 곳 없이 달리는 중'}</span></article>
        </div>
        <p class="journey-help">피로가 85%에 이르면 졸음이 온다. 야영이나 숙박으로 쉰다.</p>
      </section>
      <section class="self-mastery" aria-labelledby="self-mastery-title">
        <header><b id="self-mastery-title">${esc(driverDef.nm)}</b><em>${driverKm}km를 달렸다</em></header>
        <div class="self-mastery-meter"><i style="width:${driverPct}%"></i></div>
        <p>${dNext?`${Math.max(0,dNext.km-driverKm)}km 더 달리면 ${esc(dNext.nm)}.`:'운전 숙련을 모두 익혔다.'}</p>
        <button class="journey-text-action" type="button" data-status-jump="growth">운전과 달구지의 능력 보기</button>
      </section>
    </div>`;
    const learnedPerks=stories.reduce((sum,story)=>sum+story.st.perks.length,0);
    const pendingPerks=stories.filter(story=>story.st.pending).length;
    const rankRail=D.driverLv.map((rank,index)=>`<span class="growth-rank ${index<dlv?'done':index===dlv?'current':'locked'}">
      <i>${index<dlv?'✓':index}</i><b>${esc(rank.nm)}</b><small>${rank.km}km</small></span>`).join('');
    const growthCrew=stories.length?stories.map(story=>{
      const nextBond=story.st.lvl<3?D.bondTh[story.st.lvl]:story.st.bond;
      const perkNames=story.st.perks.map(pid=>G.perkDef(pid)?.nm).filter(Boolean);
      const storyLocked=story.st.lvl===2&&story.st.bond>=nextBond&&G.companionStoryStage(story.id)<3;
      const nextLevel=story.st.pending||Math.min(2,story.st.lvl+1);
      const nextOptions=nextLevel<=2?(story.c.perks[nextLevel]||[]).map(perk=>perk.nm):[];
      const skillSummary=storyLocked?'야영이나 정차 중 말을 걸어 남은 이야기를 듣는다'
        :story.st.pending?`지금 선택: ${nextOptions.join(' / ')}`
          :nextOptions.length?`${perkNames.length?`습득 ${perkNames.join(' · ')} · `:''}다음 선택 ${nextOptions.join(' / ')}`
            :perkNames.length?`습득 ${perkNames.join(' · ')}`:'아직 배운 퍼크 없음';
      return `<button class="growth-crew-card" data-comp2="${story.id}">
        <span class="growth-crew-face">${faceOf(story.id,story.c.face)}</span>
        <span class="growth-crew-copy"><b>${esc(story.c.name)} · Lv.${story.st.lvl}</b><small>${esc(skillSummary)}</small></span>
        <span class="growth-crew-state">${story.st.pending?'퍼크 선택':story.st.lvl>=3?'완성':storyLocked?'동료 이야기':`유대 ${story.st.bond}/${nextBond}`}</span>
      </button>`;
    }).join(''):`<div class="growth-empty"><b>함께 익힐 일은 앞으로 생긴다.</b><span>동료와 대화하고 길 위의 일을 함께 겪으면, 서로에게 도움이 되는 특기를 배운다.</span></div>`;
    const installedNames=installed.map(upgrade=>upgrade.nm);
    const growth=`<div class="growth-console">
      <section class="growth-hero" aria-labelledby="growth-driver-title">
        <div class="growth-odometer"><span>지금까지 달린 길</span><strong>${String(driverKm).padStart(3,'0')}<small>km</small></strong></div>
        <div class="growth-driver-copy"><b id="growth-driver-title">${esc(driverDef.nm)}</b><span>${esc(driverEffect)}</span></div>
        <div class="growth-progress"><i style="width:${driverPct}%"></i></div>
        <p>${dNext?`${Math.max(0,dNext.km-driverKm)}km 더 달리면 ${esc(dNext.nm)}`:'운전 숙련을 모두 익혔다'}</p>
      </section>
      <details class="journey-disclosure growth-driver-track"><summary>운전 숙련 단계 보기</summary><div class="growth-rank-rail">${rankRail}</div></details>
      <section class="growth-section"><header><b>함께 익힌 특기</b>${pendingPerks?`<em>${pendingPerks}명 선택 가능</em>`:''}</header>
        <div class="growth-crew-list">${growthCrew}</div></section>
      <section class="growth-section"><header><b>고쳐 쓰는 ${esc(G.vanName())}</b><em>${installed.length}개 장착</em></header>
        <p class="growth-help">정착지 정비소에서 고철과 부품으로 차를 고친다. 자리를 늘리고, 연료를 아끼고, 하루를 조금 편하게 만든다.</p>
        <div class="growth-upgrade-list">${installedNames.length?installedNames.map(name=>`<span>${esc(name)}</span>`).join(''):'<span class="empty">아직 손본 곳은 없다.</span>'}</div></section>
    </div>`;

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
      <div class="st-sec exact-state-qa"><h4>같은 화면 QA <small>${esc(GAME_BUILD)}</small></h4>
        <p>실행 버튼으로 연 게임은 QA와 같은 브라우저 탭을 사용한다. 아래 파일은 연결이 끊겼을 때만 쓰는 예비 기록이다.</p>
        <div class="save-backup-actions"><button data-qa-export="1">예비 QA 파일 만들기</button></div></div>
    </div>`;

    b.innerHTML=`<div class="st-pane ${stTab==='self'?'on':''}" data-stpane="self">${selfStatus}</div>
      <div class="st-pane ${stTab==='crew'?'on':''}" data-stpane="crew">${crew}</div>
      <div class="st-pane ${stTab==='growth'?'on':''}" data-stpane="growth">${growth}</div>
      <div class="st-pane ${stTab==='settings'?'on':''}" data-stpane="settings">${settings}</div>`;
    b.querySelectorAll('[data-crew-close]').forEach(button=>button.onclick=()=>closeOvl('#ovl-status'));
    b.querySelectorAll('[data-guest-notebook]').forEach(button=>button.onclick=()=>{
      QuestLedgerUI.pendingUpdateKind='side'; QuestLedgerUI.open(button);
    });
    b.querySelectorAll('[data-status-jump]').forEach(button=>button.onclick=()=>{ stTab=button.dataset.statusJump; renderStatus(); $('#st-body').scrollTop=0; $('#st-tabs button.here')?.focus(); });
    b.querySelectorAll('[data-ui-pref]').forEach(button=>button.onclick=()=>{
      toggleUiPref(button.dataset.uiPref);
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
    const qaExport=b.querySelector('[data-qa-export]');
    if(qaExport) qaExport.onclick=async()=>{
      G.save();
      const raw=G.exportQaSnapshot();
      const stamp=new Date().toISOString().replace(/[:.]/g,'-');
      const fn=`서울까지400km-QA-${GAME_BUILD}-DAY${S.day}-${stamp}.json`;
      if(window.claude&&window.claude.downloads){
        try{
          await window.claude.downloads.save({filename:fn,data:raw});
          UI.toast('현재 화면의 QA 파일을 만들었다');
          return;
        }catch(e){ if(e&&e.code==='declined'){ UI.toast('저장을 취소했다'); return; } }
      }
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
      a.download=fn; a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),2000);
      UI.toast('현재 화면의 QA 파일을 만들었다');
    };
    b.querySelectorAll('[data-quality-export]').forEach(button=>button.onclick=()=>exportQuality(button.dataset.qualityExport));
    b.querySelectorAll('[data-comp2]').forEach(r=>{
      r.onclick=()=>{ const id=r.dataset.comp2; if(G.hasComp(id)) showComp(id); };
      r.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); r.click(); } };
    });
  }

  /* ── JOURNAL ── */
  let jFilter='전체';
  function journalLinkHtml(label){
    const title=String(label||'').split('|')[0].trim(),shown=String(label||'').split('|').pop().trim();
    const note=S.notes.find(row=>row.title===title)||S.notes.find(row=>row.links?.includes(title));
    return note?`<button type="button" class="lk" data-note-title="${esc(note.title)}">${esc(shown)}</button>`:`<span class="lk">${esc(shown)}</span>`;
  }
  function journalBodyHtml(text){
    return String(text||'').split(/(\[\[[^\]]+\]\])/g).map(part=>part.startsWith('[[')&&part.endsWith(']]')?journalLinkHtml(part.slice(2,-2)):fmt(part)).join('');
  }
  function wireJournalLinks(root){
    root.querySelectorAll('[data-note-title]').forEach(button=>button.onclick=()=>{
      const note=S.notes.find(row=>row.title===button.dataset.noteTitle);if(!note)return;
      document.querySelectorAll('#jtabs button').forEach(b=>b.classList.toggle('here',b.dataset.jt==='graph'));
      $('#jp-log').classList.remove('on');$('#jgraphwrap').classList.add('on');GRAPH.build();showGraphNote(note);
    });
  }
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
      <p>${journalBodyHtml(n.body)}</p>
      ${n.links.length?`<div class="links">${n.links.map(journalLinkHtml).join('')}</div>`:''}</div>`).join('')
      : '<div class="sub">이 종류의 기록은 아직 없다.</div>');
    wireJournalLinks(log);
    log.querySelectorAll('[data-jf]').forEach(b=>b.onclick=()=>{ jFilter=b.dataset.jf; renderJournal(); });
  }
  function showGraphNote(note){
    const g=$('#gnote');
    if(!note){ g.classList.remove('on'); return; }
    g.innerHTML=`<div class="note" style="margin:0;border:none;padding:0">
      <div class="nh"><span class="nt ${esc(note.type)}">${esc(note.type)}</span><b>${esc(note.title)}</b><span class="nd">DAY ${note.day}</span></div>
      <p>${journalBodyHtml(note.body)}</p>
      ${note.links.length?`<div class="links">${note.links.map(journalLinkHtml).join('')}</div>`:''}</div>`;
    g.classList.add('on');wireJournalLinks(g);
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
  function endingJourneyModel(state,kind){
    if(!state)return {party:[],location:'길 위의 달구지',decision:'',memory:''};
    const methods={core_transfer:'거점에 권한을 나누었다. 결정에는 느린 합의가 필요하다.',core_sleep:'자동 집행을 잠재웠다. 원본 기록의 검색창도 함께 잠겼다.',core_quarantine:'서울을 격리했다. 매일 밤 감시조가 확인을 이어 간다.'};
    const selectedMethods=Object.keys(methods).filter(key=>state.flags?.[key]);
    const method=selectedMethods.length===1?selectedMethods[0]:null;
    const opening=Object.entries(state.opening?.decisions||{}).map(([id,row])=>D.openingDecisionCallbacks?.[id]?.[row.choiceId]?.summary).filter(Boolean).at(-1);
    const memories=Object.values(state.campMemories||{}).map(row=>row?.home).filter(text=>typeof text==='string'&&text.trim());
    return {party:(state.party||[]).filter(id=>D.comps[id]),
      location:`${D.nodes[state.at]?.name||'길가'}에 세운 ${state.vanName||'달구지'}`,
      decision:kind==='story_done'&&method?methods[method]:opening||'',memory:memories.at(-1)||''};
  }
  function showEnding(kind){
  $('#scr-end').dataset.endingKind=kind||'';
    SND.setDriving(false);
    /* Endings can be triggered from an event choice. Remove that modal before
       switching screens so the finished story sheet cannot cover the ending. */
    clearStoryAuto();
    closeModal('#ev-wrap');
    curCombatChoices=[];
    const eventSheet=$('#ev-sheet');
    eventSheet.classList.remove('event-mode','passenger-reader','story-compact','combat-details-open');
    delete eventSheet.dataset.storyPhase;
    delete eventSheet.dataset.storyStep;
    delete eventSheet.dataset.eventKind;
    delete eventSheet.dataset.eventId;
    /* applyFX opens this screen before resolveChoice finishes reading curEv.
       Release the event references only after the current click stack. */
    setTimeout(()=>{ curEv=null; curStory=null; },0);
    const e=$('#scr-end');
    let kicker,title,body;
    if(kind==='thirst'){
      kicker='길에 남긴 기록';
      title='물이 먼저 끝났다';
      body=`더는 운전대를 잡을 힘이 없었다.\n\n달구지는 길가에 얌전히 서 있다. 언젠가 다른 여행자가 이 차를 발견하고, 조수석의 일지를 읽게 될지도 모른다.\n\n일지의 마지막 장에는 이렇게 적혀 있다.\n\n"물을 아껴라. 사람은 아끼지 말고."`;
    } else if(kind==='stranded'){
      kicker='길에 남긴 기록';
      title='길 위에 남았다';
      body='달구지가 더는 움직이지 않는다. 걸어서 닿는 곳까지 살폈지만 다시 출발할 방법을 찾지 못했다.\n\n조수석의 일지와 차 안에 남은 물건들이 여기까지 온 길을 기억한다.';
    } else if(kind==='shunned'){
      kicker='길에 남긴 기록';
      title='어느 마을도 열어 주지 않았다';
      body='관측 표시가 붙은 달구지는 마을의 문턱을 넘지 못했다. 물과 부품, 하룻밤을 구할 수 없게 되자 다시 길로 나설 힘도 남지 않았다.\n\n차 안에는 함께 지나온 곳의 기록이 남았다.';
    } else if(kind==='story_done'){
      kicker='서울에서의 여정';
      title='이송 명령이 멈춘 밤';
      body='제7 잔류구역 6,412명. 명부의 숫자가 그대로 남은 채 강제 이송이 멈췄다. 사람의 확인 없이는 같은 명령을 다시 내릴 수 없다.';
      if(S.flags.father_fate_known)body+='\n\n아빠의 마지막 기록을 들고 여기까지 왔다.';
      if(S.flags.mother_broadcast_ready)body+=' 엄마의 목소리도 방송으로 닿았다.';
      body+='\n\n서울에서 되찾은 결정은 우리 손에 남았다. 천리안 너머의 응답, TIANYAN은 아직 끝나지 않은 길로 남는다.';
    } else {
      kicker='길에 남긴 기록';
      title='여행이 끝났다'; body='달구지는 더 이상 달리지 못한다.';
    }
    const st=S? S.stats:{km:0,events:0};
    const closing=endingJourneyModel(S,kind);
    const homeState={party:S?.party,up:S?.up,memories:S?.campMemories,keepsakes:D.companionKeepsakes,upgrades:D.upgrades,scene:D.scenes?.['dalguji-home-interior-v1']};
    const sceneKey=kind==='story_done'?'seoul-home-dawn-v2':'dalguji-home-interior-v1';
    const scene=D.scenes?.[sceneKey];
    const journey=`<section class="ending-journey"><p>${esc(closing.location)}</p>
      <div class="ending-cast" aria-label="마지막에 함께한 동료">${closing.party.map(id=>`<span>${faceOf(id,D.comps[id].face)}<b>${esc(D.comps[id].name)}</b></span>`).join('')}${S?.dog?`<span>${faceOf('bori','')}<b>보리</b></span>`:''}</div>
      ${closing.decision?`<blockquote><small>내가 고른 길</small><p>${esc(closing.decision)}</p></blockquote>`:''}
      ${closing.memory?`<blockquote><small>차 안에 남은 말</small><p>${esc(closing.memory)}</p></blockquote>`:''}
      <details class="ending-home"><summary>차 안에 남은 물건을 돌아본다</summary>${HOME.html(homeState)}</details></section>`;
    e.innerHTML=`<div class="ending-scroll">
      ${scene?`<figure class="ending-scene"><img src="${scene}" alt="${esc(D.sceneDescriptions?.[sceneKey]||'달구지에서 돌아보는 여정')}" width="1280" height="720"></figure>`:''}
      <div class="ending-content"><div class="kicker">${kicker}</div>
      <h1>${title}</h1><p class="ending-mileage"><span>DAY ${S?S.day:0}</span><span>${Math.round(st.km)}km를 달려온 기록</span></p>
      <div class="body">${fmt(body)}</div>${journey}
      <details class="ending-stats"><summary>여정의 수치</summary><div id="endstats">
        <div class="st"><div class="k">일수</div><div class="v">${S?S.day:0}</div></div>
        <div class="st"><div class="k">거리</div><div class="v">${Math.round(st.km)}km</div></div>
        <div class="st"><div class="k">사건</div><div class="v">${st.events}</div></div>
        <div class="st"><div class="k">동료</div><div class="v">${closing.party.length}명</div></div>
      </div></details></div></div>
      <div class="ending-actions" aria-label="여정 마무리">
        <button type="button" id="end-journal">여행 일지 펼치기</button>
        <button type="button" id="end-new">처음 화면으로</button>
      </div>`;
    HOME.wire(e,homeState);
    show('scr-end'); screen='end';
    e.scrollTop=0;
    window.scrollTo(0,0);
    requestAnimationFrame(()=>{ e.scrollTop=0; window.scrollTo(0,0); });
    $('#end-journal').onclick=()=>{ openModal('#ovl-journal','#j-x'); renderJournal(); };
    $('#end-new').onclick=()=>{ closeOvl('#ovl-journal'); show('scr-title'); refreshTitle(); };
  }

  function qaViewState(){
    const visible=node=>!!(node&&node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden');
    const base=document.querySelector('.scr.on,.screen.on');
    const selectors=['#ev-wrap','#ovl-status','#ovl-map','#ovl-journal','#ovl-stl','#quest-ledger','#arrival-scene'];
    if(base&&base.id) selectors.unshift(`#${base.id}`);
    const surfaces=[...new Set(selectors)].map(selector=>{
      const node=document.querySelector(selector);
      if(!node||(!visible(node)&&!node.classList.contains('on')&&node.getAttribute('aria-hidden')!=='false')) return null;
      return {selector,className:node.className,ariaHidden:node.getAttribute('aria-hidden'),
        dataset:{...node.dataset},html:node.innerHTML};
    }).filter(Boolean);
    const scrollSelectors=['#st-body','#ev-sheet .event-scroll','#jp-log','#ovl-map','#ovl-stl'];
    const scrolls=Object.fromEntries(scrollSelectors.map(selector=>{
      const node=document.querySelector(selector);
      return [selector,node?{left:node.scrollLeft,top:node.scrollTop}:null];
    }).filter(([,value])=>value));
    const canvases=[...document.querySelectorAll('canvas[id]')].filter(visible).map(canvas=>{
      try{return {id:canvas.id,width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/png')};}
      catch(e){return null;}
    }).filter(Boolean);
    const story=curStory?{
      phase:curStory.phase,eventId:curStory.eventId,label:curStory.label,
      turns:curStory.turns,index:curStory.index,knownSpeaker:curStory.knownSpeaker,
      lanes:curStory.lanes,sceneKeys:curStory.sceneKeys,sceneAlt:curStory.sceneAlt,
      sceneStart:curStory.sceneStart,sceneCarry:curStory.sceneCarry,
      finalDock:curStory.finalDock,revealed:curStory.revealed,offerComp:curStory.offerComp||null
    }:null;
    return {
      screen,journey:{mode:journeyConsoleMode,mapOpen:routeMapOpen,destination:navChoiceId,guide:navChoiceGuide,stayAction:stayActionId},
      eventId:curEv&&curEv.id||null,
      story,
      surfaces,scrolls,canvases,windowScroll:{x:window.scrollX,y:window.scrollY}
    };
  }
  async function restoreQaView(view){
    if(!view||typeof view!=='object') return {ok:false,why:'QA 화면 정보가 없다'};
    document.documentElement.classList.add('qa-exact-replay');
    clearStoryAuto();
    if((view.screen==='game'||view.screen==='end')&&!S&&G.hasSave()) G.load();
    const screenIds={title:'scr-title',preview:'scr-preview',mode:'scr-mode',name:'scr-name',intro:'scr-intro',game:'scr-game',end:'scr-end'};
    const screenId=screenIds[view.screen]||'scr-game';
    if(document.getElementById(screenId)) show(screenId);
    if(S&&view.journey){journeyViewRestored=true;journeyConsoleMode=view.journey.mode==='local'?'local':'route';routeMapOpen=!!view.journey.mapOpen;navChoiceAt=S.at;navChoiceId=view.journey.destination;navChoiceGuide=view.journey.guide||'';stayActionAt=S.at;stayActionId=view.journey.stayAction||null;}
    if(S&&(view.screen==='game'||view.screen==='end')) renderAll();
    for(const surface of view.surfaces||[]){
      if(!surface||!/^#[A-Za-z0-9_-]+$/.test(surface.selector||'')) continue;
      const node=document.querySelector(surface.selector); if(!node) continue;
      node.className=surface.className||'';
      if(surface.ariaHidden===null||surface.ariaHidden===undefined) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden',surface.ariaHidden);
      for(const [key,value] of Object.entries(surface.dataset||{})) node.dataset[key]=value;
      node.innerHTML=surface.html||'';
    }
    if(view.eventId&&view.story){
      const camp=G.campConversationEvent();
      curEv=camp&&camp.id===view.eventId?camp:D.events.find(event=>event.id===view.eventId)||null;
      if(curEv){
        const restored=view.story;
        const wireFinal=dock=>{
          if(restored.phase==='event'){
            dock.querySelectorAll('.choice[data-i]').forEach(button=>button.onclick=()=>{
              if(button.hasAttribute('disabled')) return;
              const choice=curEv.choices[+button.dataset.i];
              if(choice) resolveChoice(choice);
            });
            wireEventChoicePages(dock);
          }else{
            dock.querySelectorAll('.choice[data-r]').forEach(button=>button.onclick=()=>{
              if(button.hasAttribute('disabled')) return;
              if(button.dataset.r==='yes'&&restored.offerComp) G.doRecruit(restored.offerComp);
              closeEvent();
            });
          }
        };
        curStory={...restored,reveal:()=>{},wireFinal};
        const sheet=document.querySelector('#ev-sheet');
        const next=sheet&&sheet.querySelector('.story-next');
        if(next) next.onclick=event=>{ event.preventDefault(); advanceStory(curStory); };
        const dock=sheet&&sheet.querySelector('.event-choice-dock');
        normalizeRecruitDecisionDock(dock,restored.offerComp);
        if(restored.offerComp&&dock) curStory.finalDock=dock.innerHTML;
        if(dock) wireFinal(dock);
        if(sheet) wireSceneZoom(sheet);
      }
    }
    await Promise.all((view.canvases||[]).map(item=>new Promise(resolve=>{
      const canvas=item&&document.getElementById(item.id);
      if(!canvas||!item.data){ resolve(); return; }
      canvas.width=item.width||canvas.width; canvas.height=item.height||canvas.height;
      const image=new Image();
      image.onload=()=>{ try{canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);}catch(e){} resolve(); };
      image.onerror=resolve; image.src=item.data;
    })));
    for(const [selector,pos] of Object.entries(view.scrolls||{})){
      const node=document.querySelector(selector);
      if(node&&pos){ node.scrollLeft=pos.left||0; node.scrollTop=pos.top||0; }
    }
    if($('#arrival-scene').classList.contains('on')&&S&&D.nodes[S.at]) onArrive();
    if(view.windowScroll) window.scrollTo(view.windowScroll.x||0,view.windowScroll.y||0);
    return {ok:true,screen:view.screen,eventId:view.eventId||null,story:view.story||null};
  }

  return {boot, modalOpen, renderAll, renderHud, speak, toast, showEvent, showEnding,
    showNodeCard, showGraphNote, onDepart, onArrive, showStl, showCraft, playRadio, playChat, showSeoul,
    storyTurns:buildStoryTurns, finishStory, skipIntro, clearSpeech, clearToasts,
    qaViewState,restoreQaView,openQuestAction};
})();
/* Quest journal: separates the main journey, companion stories and local requests
   without changing the existing save format or the folio renderer. */
;(()=>{
  let activeCategory='main';
  const categoryOrder=['main','companion','side','archive'];
  const categoryLabels={main:'메인 스토리',companion:'사이드 미션 · 동료',side:'사이드 미션 · 지역',archive:'완료 기록'};
  const qEsc=(value)=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function recruitModel(){
    const quest=S&&S.recruitQ;
    if(!quest||!D.recruitQuests||!D.recruitQuests[quest.id]) return null;
    const def=D.recruitQuests[quest.id];
    const target=D.nodes&&D.nodes[quest.target]&&D.nodes[quest.target].name;
    const stages={
      task:{status:'부탁 수행 중',action:def.hint},
      road:{status:'임시 동행',action:def.roadHint},
      follow:{status:'임시 동행',action:def.followHint},
      ready:{status:'합류 가능',action:`${def.name}에게 정식 합류를 제안한다`}
    };
    const stage=stages[quest.stage]||stages.task;
    return {
      kind:'동료 미션', title:def.title||def.name, name:def.name,
      status:stage.status, action:stage.action,
      meta:target?`${target} · ${stage.status}`:stage.status
    };
  }

  function sideModel(){
    const activeQuest=S&&S.quest;
    const quest=activeQuest||(S&&S.questFollowup);
    if(!quest) return null;
    const to=D.nodes&&D.nodes[quest.to]&&D.nodes[quest.to].name||'목적지';
    const label=G.questLabel?G.questLabel(quest):quest.item||'받은 부탁';
    let action=quest.kind==='letter'
      ?`${to}에서 편지를 전한다`
      :`${label} · ${to}까지 가져간다`;
    if(quest.kind==='procure') action=`${quest.need.name} ${quest.need.qty}개를 구해 ${to}(으)로 돌아간다`;
    const waiting=!activeQuest&&!!quest.story;
    if(waiting) action=`${D.nodes[quest.from].name} 게시판에서 다음 부탁을 확인한다`;
    const late=!quest.noExpiry&&Number.isFinite(quest.due)&&S.day>quest.due;
    return {
      kind:quest.story?'연속 의뢰':'사이드 미션',title:label,status:waiting?'후속 의뢰 대기':late?'기한 지남':'진행 중',action,
      meta:`${waiting?D.nodes[quest.from].name:to}${quest.noExpiry?' · 기한 없음':Number.isFinite(quest.due)?` · DAY ${quest.due}까지`:''}`
    };
  }

  function companionItems(){
    const items=[];
    const active=recruitModel();
    if(active) items.push({...active,active:true});
    (S.party||[]).forEach(id=>{
      const comp=D.comps&&D.comps[id];
      if(!comp) return;
      items.push({
        kind:'동료 미션',title:comp.name,status:'정식 동료',
        action:comp.bio||'달구지에 자리를 잡고 함께 북쪽으로 간다.',
        meta:`유대 ${S.comps&&S.comps[id]?S.comps[id].bond||0:0}`
      });
    });
    return items;
  }

  function archiveItems(){
    const items=[];
    if(S.flags&&S.flags.run_archived) items.push({title:'서울 강제 이송을 멈췄다',meta:'메인 스토리 완료'});
    (S.party||[]).forEach(id=>{
      const comp=D.comps&&D.comps[id];
      if(comp) items.push({title:`${comp.name} 합류`,meta:'동료 이야기 완료'});
    });
    (S.notes||[]).filter(note=>note.type==='사건'&&/완료[:：]/.test(note.title||''))
      .slice(-6).reverse().forEach(note=>items.push({title:note.title,meta:`DAY ${note.day||S.day} · 길 위의 부탁 완료`}));
    return items;
  }

  function questItem(item,track){
    return `<article class="quest-entry ${item.active?'is-active':''}">
      <div class="quest-entry-head"><span>${qEsc(item.status||item.kind)}</span><small>${qEsc(item.meta||'')}</small></div>
      <h4>${qEsc(item.title)}</h4>
      ${item.name?`<b class="quest-person">${qEsc(item.name)}</b>`:''}
      <p>${qEsc(item.action||'')}</p>
      ${track?`<button type="button" class="quest-track-button" data-quest-track="${track}">이 이야기 추적</button>`:''}
    </article>`;
  }

  function panelHtml(category,models){
    if(models.length) return models.map(item=>questItem(item,item.active?category:null)).join('');
    const empty={
      companion:['아직 이어지는 동료 미션이 없다','정착지에서 중요한 인물을 만나고 함께 일을 겪으면 이곳에 기록된다.'],
      side:['맡은 사이드 미션이 없다','정착지의 사람들 사이에서 배달과 조달 의뢰를 받을 수 있다. 본편 진행에는 필수가 아니다.'],
      archive:['아직 완료 기록이 없다','끝낸 이야기와 정식으로 합류한 동료가 여기에 차곡차곡 남는다.']
    }[category];
    return `<div class="quest-empty"><b>${qEsc(empty[0])}</b><p>${qEsc(empty[1])}</p></div>`;
  }

  function trackingModel(main,companion,side){
    let track=S.questTrack||'main';
    if(track==='companion'&&!companion) track='main';
    if(track==='side'&&!side) track='main';
    if(!categoryOrder.includes(track)) track='main';
    if(track!==S.questTrack) S.questTrack=track;
    return track==='companion'?companion:track==='side'?side:main;
  }

  function updateTracking(live){
    const model=live.__questModel;
    if(!model) return;
    const tracked=trackingModel(model.main,model.companion,model.side);
    const now=live.querySelector('.quest-now-card');
    if(now) now.innerHTML=`<div><span>다음에 할 일</span><small>${qEsc(tracked.kind)}</small></div>
      <b>${qEsc(tracked.title)}</b><p>${qEsc(tracked.action)}</p><em>${qEsc(tracked.meta||'')}</em>`;
    live.querySelectorAll('[data-quest-track]').forEach(button=>{
      const selected=button.dataset.questTrack===(S.questTrack||'main');
      button.classList.toggle('is-tracked',selected);
      button.textContent=selected?'추적 중':'이 이야기 추적';
    });
  }

  function selectCategory(live,category){
    if(!categoryOrder.includes(category)) category='main';
    activeCategory=category;
    live.querySelectorAll('[data-quest-category]').forEach(button=>{
      const selected=button.dataset.questCategory===category;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-selected',selected?'true':'false');
    });
    live.querySelectorAll('[data-quest-panel]').forEach(panel=>{
      panel.hidden=panel.dataset.questPanel!==category;
    });
  }

  function enhanceJournal(){
    const body=document.querySelector('#st-body');
    const live=body&&body.querySelector('.folio-live-content:not([data-quest-journal-v2])');
    if(!live) return;
    live.dataset.questJournalV2='';

    const roadButton=live.querySelector('.folio-road-button');
    if(roadButton) roadButton.remove();
    const oldTitle=live.querySelector('.folio-title-row');
    if(oldTitle) oldTitle.remove();
    const title=live.querySelector('h3')&&live.querySelector('h3').textContent.trim()||'서울 강제 이송을 멈췄다';
    const action=live.querySelector('.folio-support > b')&&live.querySelector('.folio-support > b').textContent.trim()||'북쪽으로 이어지는 다음 단서를 찾는다';
    const location=live.querySelector('.folio-location')&&live.querySelector('.folio-location').textContent.trim()||'';
    const criteria=[...live.querySelectorAll('.folio-support-meta dd')].pop();
    const completion=criteria&&criteria.textContent.trim()||'';
    const mainMeta=[location,completion&&`완료: ${completion}`].filter(Boolean).join(' · ');
    const main={kind:'주 여정',title,action,meta:mainMeta};
    const companion=recruitModel();
    const side=sideModel();
    const companions=companionItems();
    const archive=archiveItems();

    const supportBlock=live.querySelector('.folio-support');
    if(supportBlock) supportBlock.remove();
    const mainPanel=document.createElement('section');
    mainPanel.className='quest-panel quest-main-detail';
    mainPanel.dataset.questPanel='main';
    mainPanel.setAttribute('aria-label','주 여정');
    while(live.firstChild) mainPanel.appendChild(live.firstChild);
    const mainTrack=document.createElement('button');
    mainTrack.type='button';
    mainTrack.className='quest-track-button quest-main-track';
    mainTrack.dataset.questTrack='main';
    mainTrack.textContent='주 여정 추적';
    mainPanel.appendChild(mainTrack);

    const counts={main:1,companion:companions.length,side:(side?1:0)+((S._qoffer&&S._qoffer.offers)||[]).length,archive:archive.length};
    const shell=document.createElement('div');
    shell.className='quest-journal-shell';
    shell.innerHTML=`<section class="quest-now-card" aria-live="polite"></section>
      <nav class="quest-category-tabs" role="tablist" aria-label="이야기 분류">
        ${categoryOrder.map(category=>`<button type="button" role="tab" data-quest-category="${category}" aria-selected="false"><span>${categoryLabels[category]}</span><small>${counts[category]}</small></button>`).join('')}
      </nav>`;
    shell.appendChild(mainPanel);

    const companionPanel=document.createElement('section');
    companionPanel.className='quest-panel quest-list-panel';
    companionPanel.dataset.questPanel='companion';
    companionPanel.innerHTML=panelHtml('companion',companions);
    shell.appendChild(companionPanel);

    const sideModels=[];
    if(side) sideModels.push({...side,active:true});
    const offers=S._qoffer&&S._qoffer.at===S.at?(S._qoffer.offers||[]):[];
    offers.forEach(offer=>sideModels.push({
      status:'받을 수 있음',title:G.questLabel?G.questLabel(offer):offer.item||'정착지의 부탁',
      action:G.questDesc?G.questDesc(offer):'정착지에서 자세한 내용을 확인한다.',
      meta:D.nodes&&D.nodes[offer.to]?D.nodes[offer.to].name:''
    }));
    const sidePanel=document.createElement('section');
    sidePanel.className='quest-panel quest-list-panel';
    sidePanel.dataset.questPanel='side';
    sidePanel.innerHTML=panelHtml('side',sideModels);
    shell.appendChild(sidePanel);

    const archivePanel=document.createElement('section');
    archivePanel.className='quest-panel quest-list-panel quest-archive-panel';
    archivePanel.dataset.questPanel='archive';
    archivePanel.innerHTML=archive.length
      ?archive.map(item=>`<article class="quest-archive-entry"><span>${qEsc(item.meta)}</span><b>${qEsc(item.title)}</b></article>`).join('')
      :panelHtml('archive',[]);
    shell.appendChild(archivePanel);
    if(roadButton) shell.appendChild(roadButton);
    live.appendChild(shell);
    live.__questModel={main,companion,side};

    if(!body.dataset.questJournalBound){
      body.dataset.questJournalBound='';
      body.addEventListener('click',event=>{
        const current=body.querySelector('.folio-live-content[data-quest-journal-v2]');
        if(!current) return;
        const categoryButton=event.target.closest('[data-quest-category]');
        if(categoryButton){ selectCategory(current,categoryButton.dataset.questCategory); return; }
        const trackButton=event.target.closest('[data-quest-track]');
        if(trackButton){
          S.questTrack=trackButton.dataset.questTrack;
          if(G.save) G.save();
          updateTracking(current);
        }
      });
    }
    selectCategory(live,activeCategory);
    updateTracking(live);
  }

  const install=()=>{
    const body=document.querySelector('#st-body');
    if(!body) return;
    new MutationObserver(()=>queueMicrotask(enhanceJournal)).observe(body,{childList:true,subtree:false});
    enhanceJournal();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else queueMicrotask(install);
})();

/* Keep each generated scene's intended subject inside the live event crop. */
(()=>{
  const directSceneBySrc=new Map(Object.entries(D.scenes||{}).map(([id,src])=>[String(src),id]));
  const absoluteSceneBySrc=new Map(Object.entries(D.scenes||{}).map(([id,src])=>{
    try{return [new URL(String(src),document.baseURI).href,id]}catch(_){return [String(src),id]}
  }));
  const applySceneFocus=()=>{
    document.querySelectorAll('#ev-wrap img.event-scene').forEach(img=>{
      const id=directSceneBySrc.get(img.getAttribute('src')||'')||absoluteSceneBySrc.get(img.src||'');
      const objectPosition=id&&D.sceneAssetMeta?.[id]?.objectPosition;
      img.dataset.sceneId=id||'';
      img.style.objectPosition=objectPosition||'50% 50%';
    });
  };
  const root=document.getElementById('ev-wrap');
  if(!root) return;
  new MutationObserver(applySceneFocus).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  applySceneFocus();
})();

/* 카드 전체 터치와 사건 선택지의 시각 규격을 렌더 방식과 무관하게 정규화한다. */
(()=>{
  const duplicate=/^(?:실행\s*)?(?:정착지 안으로|탐색|준비|정비|수리)\s*[→›>]?$/;
  const actionCard=/정착지 안으로|주변 탐색|야영 준비|달구지를 정비|라디오를 고친/;
  const choiceTag=/^(?:대응|기록|질문|설득|탐색|거리두기|선택|교섭|전투)$/;
  const normalize=()=>{
    document.querySelectorAll('button,[role="button"]').forEach(button=>{
      if(button.closest('#ovl-camp,.journey-deck'))return; // Maintained components own their controls.
      const text=(button.textContent||'').replace(/\s+/g,' ').trim();
      if(actionCard.test(text)){
        button.classList.add('ui-whole-action-card');
        button.dataset.uiCols=button.children.length>=3?'3':'2';
        button.querySelectorAll('*').forEach(node=>{
          const label=(node.textContent||'').replace(/\s+/g,' ').trim();
          if(duplicate.test(label)&&![...node.children].some(child=>duplicate.test((child.textContent||'').replace(/\s+/g,' ').trim())))
            node.classList.add('ui-action-duplicate');
        });
      }
    });
    const event=document.querySelector('#ev-sheet.event-mode');
    if(!event)return;
    /* 사건의 선택지만 정규화한다. 동료 프로필의 퍼크 카드도 안쪽에
       '선택'과 레벨 숫자가 있어 예전 전역 검색에서는 사건 버튼으로 오인됐다. */
    event.querySelectorAll('.event-choice-dock button,.event-choice-dock [role="button"],[data-choice]').forEach(choice=>{
      const text=(choice.textContent||'').replace(/\s+/g,' ').trim();
      if(text.length<4||/^(?:계속|길로 돌아가기|닫기)$/.test(text))return;
      const tagged=[...choice.querySelectorAll('*')].some(node=>choiceTag.test((node.textContent||'').trim()));
      const indexed=[...choice.querySelectorAll('*')].some(node=>/^[123]$/.test((node.textContent||'').trim()));
      if(!tagged&&!indexed&&!choice.hasAttribute('data-choice'))return;
      choice.classList.add('ui-compact-choice');
      choice.querySelectorAll('*').forEach(node=>{
        const label=(node.textContent||'').trim();
        if(choiceTag.test(label))node.classList.add('ui-choice-tag');
        if(/^[123]$/.test(label))node.classList.add('ui-choice-index');
      });
    });
  };
  const start=()=>{normalize();new MutationObserver(normalize).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* 가방 UI를 아이템 기능과 분리된 정사각 타일/상세 서랍 구조로 정규화한다. */
(()=>{
  const clean=node=>(node&&node.textContent||'').replace(/\s+/g,' ').trim();
  const leafs=(root)=>[...root.querySelectorAll('*')].filter(node=>!node.children.length);
  const commonParent=(nodes,limit)=>{
    if(!nodes.length)return null;
    let parent=nodes[0].parentElement;
    while(parent&&parent!==limit&&!nodes.every(node=>parent.contains(node)))parent=parent.parentElement;
    return parent&&parent!==limit?parent:null;
  };
  const normalizeInventory=()=>{
    const title=[...document.querySelectorAll('h1,h2,h3,[class*="title"]')]
      .find(node=>clean(node)==='가방과 보급');
    if(!title)return;
    const root=title.closest('#ovl-bag,#ovl-inventory,[id*="inventory"],[class*="inventory"],[role="dialog"],.overlay,.modal')
      ||title.parentElement;
    if(!root)return;
    /* 현행 가방은 bag-code-panel-final이 유일한 레이아웃 정본이다.
       구형 DOM 추론기가 클래스를 덧붙이면 ID 기반 최종 규칙과 충돌한다. */
    if(root.id==='ovl-status')return;
    root.classList.add('ui-inventory-root');
    title.classList.add('ui-inventory-title');

    leafs(root).forEach(node=>{
      if(/^DAY\s*\d+\s*·\s*\d{1,2}:\d{2}$/i.test(clean(node)))node.classList.add('ui-inventory-time');
    });

    const resourceLabels=leafs(root).filter(node=>/^(?:물|식량|연료)$/.test(clean(node)));
    const gauges=commonParent(resourceLabels,root);
    if(gauges&&resourceLabels.length>=3)gauges.classList.add('ui-inventory-gauges');

    const candidates=[...root.querySelectorAll('[data-item],button,[role="button"],li,[class*="inv-item"],[class*="supply-item"]')]
      .filter(node=>/보유\s*\d+\s*(?:개|발|L)?/.test(clean(node)));
    const cards=candidates.filter(node=>!candidates.some(other=>other!==node&&node.contains(other)));
    if(cards.length){
      const grid=commonParent(cards,root)||cards[0].parentElement;
      if(grid&&grid!==root)grid.classList.add('ui-inventory-grid');
    }
    cards.forEach(card=>{
      if(card.dataset.uiInventoryReady)return;
      card.dataset.uiInventoryReady='1';
      card.classList.add('ui-inventory-tile');
      card.setAttribute('aria-label',clean(card));
      const nodes=leafs(card);
      const quantity=nodes.find(node=>/보유\s*\d+\s*(?:개|발|L)?/.test(clean(node)));
      if(quantity){
        const match=clean(quantity).match(/(\d+)/);
        quantity.dataset.fullLabel=clean(quantity);
        quantity.textContent=match?match[1]:clean(quantity);
        quantity.classList.add('ui-inventory-quantity');
      }
      nodes.forEach(node=>{
        const label=clean(node);
        if(node===quantity)return;
        if(/[가-힣]/.test(label)&&label.length<=16)node.classList.add('ui-inventory-label');
      });
      const icon=card.querySelector('img,[class*="icon"],[class*="ico"]');
      if(icon)icon.classList.add('ui-inventory-icon');
    });

    root.querySelectorAll('[id*="detail"],[class*="detail"],[id*="drawer"],[class*="drawer"]').forEach(drawer=>{
      if(drawer.closest('.ui-inventory-tile'))return;
      const text=clean(drawer);
      if(text&&text!=='가방과 보급')drawer.classList.add('ui-inventory-drawer');
    });
  };
  const start=()=>{
    normalizeInventory();
    new MutationObserver(normalizeInventory).observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
