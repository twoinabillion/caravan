/* ═══ UI 3/5 — 이벤트 시트·전투 HUD·스토리 리더·선택 해석 (UI IIFE 내부) ═══ */
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
    const intent=c.intent||'';
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
      ? `<div class="combat-forecast"><span class="combat-tier ${riskTagClass}">${riskTag}</span><span>선택 전망 ${esc(difficulty.worstLabel)}~${esc(difficulty.bestLabel)}</span><strong>${esc(difficulty.bestLabel)}</strong></div>`
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
      const profile=inCombat ? G.combatOddsBreakdown(c,evd) : null;
      const oddsMeta=G.combatDifficultyMeta(profile&&profile.odds);
      const vehicleText=profile&&profile.vehicleSources&&profile.vehicleSources.length
        ? ` · 차량 대응 ${profile.vehicleSources.join(' + ')}`:'';
      const riskMeta = profile ? combatChoiceRiskMeta(oddsMeta.pct) : null;
      const riskMark=riskMeta&&['위험','주의'].includes(riskMeta.label)?'⚠ ':'';
      const riskChip = riskMeta ? `<span class="combat-risk ${riskMeta.cls}">${riskMark}${riskMeta.label}</span>` : '';
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
          ${profile?`<span class="combat-odds"><span class="combat-tier ${oddsMeta.className}">${esc(G.combatGrade(c,evd))} · 난이도 ${esc(oddsMeta.label)}</span>${oddsLabel?` · ${esc(oddsLabel)}`:''}</span>`:''}
          ${route?`<span class="route-forecast"><b>${route.km}km · 순수 주행 ${G.durationLabel(route.minutes)} · 연료 약 ${route.fuel}L</b><small>${route.rough?`험로 ${route.rough}구간 · `:''}보급 거점 ${route.stops}곳 · ${esc(route.readiness)}</small></span>`:''}
          ${cost?`<span class="req">${rq.ok?'✓':'✗'} ${cost}</span>`:''}
        </button>`;
    });
    const difficulty=combatChoiceSummary(combatChoices);
    if(inCombat&&difficulty){
      const tips=[];
      const trend=G.combatAdaptiveTrendPercent();
      if(difficulty.criticalCount>0) tips.push(`25% 이하 선택이 ${difficulty.criticalCount}개입니다`);
      else if(difficulty.warningCount>0) tips.push(`주의 구간(26~35%)이 ${difficulty.warningCount}개입니다`);
      else if(difficulty.safeCount===0) tips.push(`안전 구간(45%+)이 없습니다`);
      if(trend>2) tips.push(`적응 추세 ${trend>=0?'+':''}${trend}% (강화 중)`);
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
      <div class="tag ${aiEvent?'ai-tag':''}">${evd.type}${evd.gen?' · 오프로드 생성':''}</div>
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

