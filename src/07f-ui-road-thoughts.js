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
  let roadApproachTimer = 0;
  UI.roadApproach = (profile, onComplete)=>{
    clearTimeout(roadApproachTimer);
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
    const image = document.createElement('img');
    image.src = `assets/road-cues/cue-${profile.kind}.png`;
    image.alt = '';
    image.setAttribute('aria-hidden','true');
    image.onerror = ()=>{ if(!image.dataset.fallback){ image.dataset.fallback='1'; image.src='assets/road-cues/cue-landmark.png'; } };
    const status = document.createElement('div');
    status.className = 'road-approach-status';
    const eyebrow = document.createElement('span');
    eyebrow.textContent = '전방 발견';
    const label = document.createElement('b');
    label.textContent = profile.label;
    const action = document.createElement('small');
    action.textContent = '속도를 줄이는 중';
    status.append(eyebrow,label,action);
    cue.append(image,status);
    stage.append(cue);
    document.documentElement.dataset.roadApproach = profile.kind;
    roadApproachTimer = setTimeout(()=>{
      cue.classList.add('is-stopped');
      roadApproachTimer = setTimeout(()=>{ if(onComplete) onComplete(); }, 170);
    }, profile.duration);
  };
})();
