/* Road narration belongs with the journey log, not over the moving vehicle. */
(()=>{
  const bubbleRoot=document.getElementById('bubbles');
  if(!bubbleRoot) return;

  let dismissTimer=0;
  const escapeText=value=>String(value||'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  const showRoadThought=bubble=>{
    if(!bubble.classList.contains('narration')||typeof S==='undefined'||!S.driving) return;
    const log=document.getElementById('road-notice-slot');
    const copy=[...bubble.querySelectorAll('.bubble-copy > span')]
      .find(node=>!node.classList.contains('who'));
    const thought=copy&&copy.textContent.trim();
    if(!log||!thought) return;

    let card=document.getElementById('road-thought-card');
    if(!card){
      card=document.createElement('aside');
      card.id='road-thought-card';
      card.className='road-thought-card';
      card.setAttribute('aria-live','polite');
      log.insertAdjacentElement('afterend',card);
    }

    const art=typeof D!=='undefined'&&D.scenes&&D.scenes['event-crisis-exhaustion'];
    card.innerHTML=`${art?`<img src="${art}" alt="" aria-hidden="true">`:''}
      <div class="road-thought-copy"><span>운전 중 생각</span><p>${escapeText(thought)}</p></div>`;
    card.classList.remove('is-leaving');
    void card.offsetWidth;
    card.classList.add('is-visible');
    bubble.remove();

    clearTimeout(dismissTimer);
    dismissTimer=setTimeout(()=>{
      card.classList.add('is-leaving');
      card.classList.remove('is-visible');
    },9000);
  };

  new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(!(node instanceof HTMLElement)) return;
      if(node.matches('.bubble.narration')) showRoadThought(node);
      node.querySelectorAll&&node.querySelectorAll('.bubble.narration').forEach(showRoadThought);
    }));
  }).observe(bubbleRoot,{childList:true,subtree:true});
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
/* Keep event decisions in the same manuscript flow as the conversation. */
(() => {
  function initEmbeddedEventChoices() {
    const sheet = document.getElementById('ev-sheet');
    if (!sheet) return;

    let scheduled = false;
    let enteredDecision = false;

    const sync = () => {
      scheduled = false;

      const scroll = sheet.querySelector('.event-scroll');
      const report = sheet.querySelector('.event-field-report');
      const dock = sheet.querySelector('.event-choice-dock');
      if (!scroll || !report || !dock) return;

      const isDecision = sheet.dataset.storyStep === 'decision' || !!dock.querySelector('.choice[data-r]');

      if (!isDecision) {
        if (dock.parentElement !== sheet) sheet.appendChild(dock);
        sheet.classList.remove('choices-embedded');
        enteredDecision = false;
        return;
      }

      if (dock.parentElement !== report) report.appendChild(dock);
      sheet.classList.add('choices-embedded');

      const choices = dock.querySelector('.choices');
      if (choices) choices.setAttribute('aria-label', '선택');

      dock.querySelectorAll('.choice *').forEach((node) => {
        const text = node.textContent.trim();
        if (node.children.length === 0 && text === '대응') {
          node.classList.add('choice-redundant-label');
        }
        if (node.children.length === 0 && /^[1-9]$/.test(text)) {
          node.classList.add('choice-index-compact');
        }
      });

      if (!enteredDecision) {
        enteredDecision = true;
        requestAnimationFrame(() => {
          const scrollRect = scroll.getBoundingClientRect();
          const dockRect = dock.getBoundingClientRect();
          const dockTop = dockRect.top - scrollRect.top + scroll.scrollTop;
          const visibleChoiceHeight = Math.min(dock.offsetHeight, scroll.clientHeight * 0.42);
          const target = Math.max(0, dockTop + visibleChoiceHeight - scroll.clientHeight + 20);
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          scroll.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
      }
    };

    const scheduleSync = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(sync);
    };

    new MutationObserver(scheduleSync).observe(sheet, {
      attributes: true,
      attributeFilter: ['data-story-step', 'data-story-phase'],
      childList: true,
      subtree: true
    });

    scheduleSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmbeddedEventChoices, { once: true });
  } else {
    initEmbeddedEventChoices();
  }
})();
