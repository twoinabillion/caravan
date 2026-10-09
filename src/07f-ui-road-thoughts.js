/* Approved road-whisper v1: ephemeral authored observations, never a deck card.
   No queue/replay or gameplay writes; guarded again while visible. */
(()=>{
  const root=document.documentElement;
  const caption=document.getElementById('road-whisper');
  const stage=document.getElementById('stage');
  if(!caption||!stage) return;
  root.dataset.roadThoughtUi='whisper';
  let expires=0,guard=0,lastShown=-Infinity;
  const hide=()=>{
    clearTimeout(expires);clearInterval(guard);expires=guard=0;
    caption.hidden=true;caption.textContent='';
  };
  const allowed=()=>root.dataset.uiRoadThought!=='off'&&!document.hidden
    &&typeof S!=='undefined'&&S&&S.driving&&!S.ended&&!S.driving.approach
    &&!UI.modalOpen()&&root.dataset.routeMap!=='open'&&!root.dataset.roadApproach
    &&!document.getElementById('toasts')?.childElementCount
    &&!document.getElementById('bubbles')?.childElementCount
    &&document.getElementById('pursuit-help')?.hidden!==false
    &&document.getElementById('pursuit-notice')?.hidden!==false
    &&!document.getElementById('journey-driving-warning')?.textContent.trim();
  const fits=()=>{
    /* Renderer keeps wheels at ~.84H +13 logical pixels (236-wide canvas).
       Use only the free road below, never move/scale the actual Dalguji.
       Short/large-text views omit the optional caption rather than clipping it. */
    const freeRoad=stage.clientHeight*.16-stage.clientWidth/236*13-7;
    return caption.offsetHeight<=freeRoad;
  };
  const sync=()=>{if(!caption.hidden&&(!allowed()||!fits()))hide();};
  const show=text=>{
    const value=String(text||'').trim(),now=performance.now();
    if(!value||!allowed()||now-lastShown<35000)return false;
    caption.textContent=value;caption.hidden=false;
    if(!fits()){hide();return false;}
    lastShown=now;
    expires=setTimeout(hide,8000);
    guard=setInterval(sync,250);
    return true;
  };
  UI.roadThought={show,hide,sync};
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',sync);
  const observer=new MutationObserver(sync);
  observer.observe(root,{attributes:true,attributeFilter:['data-ui-road-thought','data-route-map','data-road-approach','class']});
  for(const id of ['ev-wrap','arrival-scene','ovl-stl','ovl-map','ovl-journal','ovl-status','ovl-menu','ovl-seoul','ovl-camp','ovl-local-actions','bubbles','toasts','panel','pursuit-help','pursuit-notice']){
    const host=document.getElementById(id);
    if(host)observer.observe(host,{attributes:true,attributeFilter:['class','open','hidden'],childList:true,subtree:true,characterData:true});
  }
  hide();
})();

/* ── 전방 발견 큐(road approach cue) ──
   04d-engine-director가 사건을 열기 전에 부르는 진입 연출.
   const UI 선언(07-ui.js)이 선행해야 하므로 반드시 이 파일보다
   앞쪽 모듈(04d 등)에 두지 않는다. */
(()=>{
  let roadApproachTimers = [];
  const clearRoadApproachTimers=()=>{
    roadApproachTimers.forEach(clearTimeout);
    roadApproachTimers=[];
  };
  UI.roadApproach = (profile, onComplete)=>{
    clearRoadApproachTimers();
    const old = document.getElementById('road-approach-cue');
    if(old) old.remove();
    delete document.documentElement.dataset.roadApproach;
    if(!profile) return;
    const stage = document.getElementById('stage');
    if(!stage) { if(onComplete) onComplete(); return; }
    const cue = document.createElement('div');
    cue.id = 'road-approach-cue';
    cue.className = `road-approach-cue road-approach-${profile.kind}`;
    cue.style.setProperty('--road-cue-duration', `${profile.duration}ms`);
    const roadCueImages = {
      animal: '__ROAD_CUE_ANIMAL__',
      bridge: '__ROAD_CUE_BRIDGE__',
      cache: '__ROAD_CUE_CACHE__',
      checkpoint: '__ROAD_CUE_CHECKPOINT__',
      'temporary-checkpoint': '__ROAD_CUE_TEMPORARYCHECKPOINT__',
      cyclist: '__ROAD_CUE_CYCLIST__',
      debris: '__ROAD_CUE_DEBRIS__',
      flood: '__ROAD_CUE_FLOOD__',
      landmark: '__ROAD_CUE_LANDMARK__',
      market: '__ROAD_CUE_MARKET__',
      medical: '__ROAD_CUE_MEDICAL__',
      people: '__ROAD_CUE_PEOPLE__',
      shelter: '__ROAD_CUE_SHELTER__',
      signal: '__ROAD_CUE_SIGNAL__',
      smoke: '__ROAD_CUE_SMOKE__',
      surveillance: '__ROAD_CUE_SURVEILLANCE__',
      vehicle: '__ROAD_CUE_VEHICLE__',
      'cow-walker': '__ROAD_CUE_COWWALKER__',
      'gas-station': '__ROAD_CUE_GASSTATION__',
      'coffee-van': '__ROAD_CUE_COFFEEVAN__',
      'food-truck': '__ROAD_CUE_FOODTRUCK__',
      'clinic-bus': '__ROAD_CUE_CLINICBUS__',
      'broken-vehicle': '__ROAD_CUE_BROKENVEHICLE__',
      'film-vehicle': '__ROAD_CUE_FILMVEHICLE__'
    };
    /* 빌드가 단일 HTML 안에 넣어 준 픽셀 자산을 주행 캔버스에서도 쓴다.
       라이브 서버의 /game 경로는 assets/를 직접 노출하지 않으므로 원본
       파일 경로 대신 이 data URL 지도를 사용해야 새 조우가 빈칸이 되지 않는다. */
    G.roadCueImages=roadCueImages;
    const status = document.createElement('div');
    status.className = 'road-approach-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    const eyebrow = document.createElement('span');
    eyebrow.textContent = '전방 발견';
    const label = document.createElement('b');
    label.textContent = profile.label;
    const action = document.createElement('small');
    action.textContent = '접근 중';
    const progress = document.createElement('i');
    progress.className='road-approach-progress';
    const progressFill=document.createElement('i');
    progress.append(progressFill);
    status.append(eyebrow,label,action,progress);
    cue.append(status);
    stage.append(cue);
    document.documentElement.dataset.roadApproach = profile.kind;
    const total=Math.max(900,Number(profile.duration)||1450);
    roadApproachTimers.push(setTimeout(()=>{
      cue.classList.add('is-braking');
      action.textContent='제동 중';
      if(S&&S.driving&&S.driving.approach)S.driving.approach.phase='braking';
    },total*.24));
    roadApproachTimers.push(setTimeout(()=>{
      cue.classList.add('is-stopped');
      action.textContent='정차 완료';
      if(S&&S.driving&&S.driving.approach)S.driving.approach.phase='stopped';
    },total*.84));
    roadApproachTimers.push(setTimeout(()=>{
      cue.classList.add('is-handoff');
      action.textContent='상황 확인';
      roadApproachTimers.push(setTimeout(()=>{ if(onComplete) onComplete(); },100));
    },total));
  };
})();
