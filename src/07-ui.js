/* ═══════════════════ UI ═══════════════════ */
const $ = (s)=>document.querySelector(s);
const el = (tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };

const UI = (()=>{
  let screen='title';          // title|mode|name|intro|game|end
  let bgmEvKey=null;           // 현재 이벤트의 BGM 힌트 (tension/story)
  let introIdx=0, introTurnIdx=0, pendingMode='onroad', pendingName='';
  let arrivalTimer=0;
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
  let last=0, hudCd=0, bgmCd=0;
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
    bgmCd-=dt; if(bgmCd<=0){ bgmCd=0.4; BGM.tick(bgmKey()); }
    if(screen==='title') SCENE.drawTitle(dt);
    else if(screen==='game'||screen==='end'){
      if(screen==='game'&&!S?.ended) G.tick(dt);
      if(screen==='game'){
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
    if(bs){ if(!(D.bgm&&D.bgm.song)) bs.style.display='none'; else bs.onclick=()=>BGM.toggleSong(); }
    $('#bt-continue').onclick=()=>{ if(G.load()){ enterGame(); } };
    $('#bt-preview').onclick=()=>{ renderPreview(); show('scr-preview'); $('#preview-scroll').scrollTop=0; };
    $('#bt-previewback').onclick=()=>show('scr-title');
    $('#bt-previewnew').onclick=()=>{
      if(localOffroad){ show('scr-mode'); envCheckUI(); }
      else startNew('onroad');
    };
    const nameGo=()=>{
      pendingName=($('#inp-name').value||'').trim().slice(0,8);
      introIdx=0; introTurnIdx=0;
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
    $('#scr-intro').onclick=()=>nextIntro();
    $('#dk-map').onclick=()=>{ toggleOvl('#ovl-map'); MAPR.resize(); renderMapMini(); renderMission(); };
    $('#dk-journal').onclick=()=>{ toggleOvl('#ovl-journal'); renderJournal(); };
    $('#dk-camp').onclick=()=>G.camp();
    $('#dk-sound').onclick=()=>SND.toggle();
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
  function renderIntro(newPage){
    const page=D.intro[introIdx], scene=D.scenes&&D.scenes[page.scene];
    if(newPage){
      VO.stop();
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
    const nextBeat=introBeats[introTurnIdx+1];
    $('#intro-hint').textContent=nextBeat
      ? nextBeat.kind==='dialogue'?'눌러서 다음 말풍선':'눌러서 다음 장면'
      : '눌러서 다음 장';
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
  }
  function nextIntro(){
    const page=D.intro[introIdx];
    const beats=page&&page.beats&&page.beats.length?page.beats:[{kind:'narration',text:page?.text||''}];
    if(introTurnIdx<beats.length-1){
      introTurnIdx++;
      renderIntro(false);
      return;
    }
    introIdx++;
    introTurnIdx=0;
    if(introIdx>=D.intro.length){ G.newGame(pendingMode,pendingName); enterGame(); }
    else renderIntro(true);
  }
  function skipIntro(){
    introIdx=D.intro.length;
    introTurnIdx=0;
    if(screen==='name') pendingName=($('#inp-name').value||'').trim().slice(0,8);
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

  function missionHtml(){
    const q=S.quest, rq=S.recruitQ;
    const danger=S.fuel<10||S.fatigue>=75||(q&&q.due-S.day<=1);
    let kicker, title, state, meta, pct;
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
    return {danger, html:`<span class="ms-k">${kicker}</span><span class="ms-title">${title}</span>
      <span class="ms-meta">${meta}${alerts.length?`<br><small class="ms-alert">${alerts.join(' · ')}</small>`:''}</span>
      <span class="ms-state">${state}</span><span class="ms-progress"><i style="width:${pct}%"></i></span>`};
  }
  function renderMission(){
    if(!S) return;
    const m=missionHtml();
    ['#mission-strip','#map-mission'].forEach(sel=>{
      const node=$(sel); if(!node) return;
      node.innerHTML=m.html;
      node.classList.toggle('danger',m.danger);
    });
  }

  /* ── panel ── */
  function faceOf(id, fallback){
    const name=(D.comps&&D.comps[id]&&D.comps[id].name)||(D.npcs&&D.npcs[id]&&D.npcs[id].name)||(id==='me'?'나':id);
    return D.portraits[id]? `<img class="pimg" src="${D.portraits[id]}" alt="${esc(name)} 초상">` : fallback;
  }
  function npcFace(id, fallback){
    const name=(D.comps&&D.comps[id]&&D.comps[id].name)||(D.npcs&&D.npcs[id]&&D.npcs[id].name)||id;
    return D.portraits[id]? `<img class="npc-pimg" src="${D.portraits[id]}" alt="${esc(name)} 초상">` : fallback;
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
      ? `<img class="turn-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상">`
      : '';
    const speaker=['dialogue','thought','letter'].includes(kind)||(kind==='record'&&hasPortrait)
      ? `<div class="turn-speaker">${face}<span><small>${source}</small><b>${esc(person.name)}</b></span></div>`
      : `<div class="turn-source">${source}${turn.name?` · ${esc(turn.name)}`:''}</div>`;
    return `<article class="story-turn story-entry ${kind}${person.name==='???'?' identity-hidden':''}${opt.intro?' intro-turn':''}"
      data-kind="${kind}" data-story-entry aria-live="polite">
      ${speaker}<div class="turn-text">${fmt(turn.text||'')}</div></article>`;
  }
  function chatMessageHtml(turn, newest=false){
    const person=speakerInfo(turn.who,turn.name);
    const mine=['me','player_child','나'].includes(person.id);
    const hidden=person.name==='???';
    const faceAlt=hidden?'이름을 모르는 사람':person.name;
    const face=person.portrait
      ? `<img class="chat-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상">`
      : '';
    return `<div class="chat-msg story-entry ${mine?'mine':'other'}${hidden?' identity-hidden':''}${newest?' chat-newest':''}"
      data-kind="dialogue" data-story-entry>
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
    return `<section class="story-chat story-transcript${opt.intro?' intro-chat':''}" role="log"
      aria-live="polite" aria-atomic="false" aria-relevant="additions text">
      ${shown.map((turn,i)=>{
        const newest=i===shown.length-1;
        if(turn.kind==='dialogue') return chatMessageHtml(turn,newest);
        if(turn.kind==='narration') return narrationMessageHtml(turn,newest,opt);
        return storyTurnHtml(turn,opt);
      }).join('')}</section>`;
  }
  function eventSpeakerCandidates(evd){
    const ids=[];
    const add=(id)=>{ if(id&&id!=='unknown'&&!ids.includes(id)) ids.push(id); };
    add(evd&&evd.needsComp);
    add(evd&&evd.needsComp2);
    add(evd&&evd.recruitStart);
    (evd&&evd.speakers||[]).forEach(add);
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
    for(const [id,c] of Object.entries(D.comps||{})) out.push({id,names:[c.name]});
    for(const [id,n] of Object.entries(D.npcs||{})) out.push({id,names:[n.name]});
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
    const written=/(글씨|수첩|편지|메모|원고|기록|각인|적혀|적었|썼|써 둔|남긴 문장)/.test(rawBefore);
    const verbs='말|묻|물었|대답|답했|외치|중얼|소리|웃|받았|선언|덧붙|불쑥|고개|글씨|쓰|적|남기';
    for(const item of speakerRegistry(state)){
      for(const name of item.names){
        const safe=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        if(new RegExp(`^\\s*${safe}(?:이|가|은|는)?[^.。!?]{0,28}(?:${verbs})`).test(a)
          ||new RegExp(`${safe}(?:이|가|은|는)?[^.。!?]{0,28}(?:${verbs})[^.。!?]{0,10}$`).test(b)){
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
          ||new RegExp(`${name}(?:이|가|은|는)?[^.。!?]{0,24}(?:${verbs})[^.。!?]{0,8}$`).test(b)){
          state.last=role.id;
          return {kind:'dialogue',who:role.id,name};
        }
      }
    }
    if((written||preferRecord)&&state.last&&state.last!=='record')
      return {kind:'record',who:state.last};
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
      candidates:eventSpeakerCandidates(evd),last:null,hiddenSpeaker,
      knownSpeaker:!!opt.knownSpeaker,fallbackSpeaker:anonymousFallback(evd)
    };
    const pushNarration=(raw)=>{
      const restored=restore(raw).trim();
      if(!stripTags(restored)) return;
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
        pushNarration(paragraph.slice(cursor,match.index));
        const before=restore(paragraph.slice(0,match.index));
        const after=restore(paragraph.slice(re.lastIndex));
        const isRecord=match[2]!==undefined;
        const speaker=inferQuoteSpeaker(before,after,evd,state,isRecord);
        if(isRecord&&speaker.kind==='dialogue') speaker.kind='record';
        const spoken=restore(match[1]!==undefined?match[1]:match[2]);
        const hidden=speaker.who===hiddenSpeaker&&!state.knownSpeaker;
        turns.push({...speaker,name:hidden?'???':speaker.name,text:spoken});
        if(hidden&&revealsIdentity(spoken,hiddenSpeaker)) state.knownSpeaker=true;
        cursor=re.lastIndex;
      }
      pushNarration(paragraph.slice(cursor));
    }
    const result=turns.length?turns:[{kind:'narration',text:restore(source)}];
    result.knownSpeaker=state.knownSpeaker;
    return result;
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
      const guest=def?`<section class="road-guest-card" aria-label="${def.name} 임시 동행">
        <div class="road-guest-head"><span class="rg-ico">${def.guest.ic}</span><span>
          <small>임시 동행 · 아직 손님</small><b>${def.name} — ${def.guest.title}</b></span></div>
        <div class="road-guest-help">${def.guest.desc}</div>
        ${approach?`<div class="road-guest-memory"><b>${approach.label}</b> · ${approach.memory}</div>`:''}
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
    SND.setDriving(true); }
  function onArrive(){
    renderAll(); SND.setDriving(false);
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
    speak({who:'radio', t:r.t});
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
  function combatHudHtml(evd){
    const c=evd&&evd.combat;
    if(!c) return '';
    const edge=S.combat?S.combat.edge||0:0;
    const grade=edge>=2?'우세':edge<0?'불리':'팽팽';
    const injuries=Object.keys(S.injuries||{}).length;
    const track=Array.from({length:c.total},(_,i)=>`<i class="${i<c.phase?'on':''}"></i>`).join('');
    return `<section class="combat-hud" aria-label="교전 상황">
      <div class="combat-hud-head"><span class="combat-phase">ENCOUNTER ${c.phase}/${c.total}</span>
        <b class="combat-step">${c.step}</b><span class="combat-threat">${c.threat}</span></div>
      <div class="combat-objective"><b>목표</b><span>${c.objective}</span></div>
      <div class="combat-track" aria-hidden="true">${track}</div>
      <div class="combat-state"><span class="${grade==='우세'?'good':grade==='불리'?'bad':''}">전세 ${grade}</span>
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
        ${c.combatRoll!==undefined?`<span class="combat-odds">현재 전세 · ${G.combatGrade(c)}</span>`:''}
        ${cost?`<span class="req">${rq.ok?'✓':'✗'} ${cost}</span>`:''}</button>`;
    });
    return {html,count};
  }
  function wireSceneZoom(sheet){
    const sceneFrame=sheet.querySelector('.event-scene-frame');
    if(sceneFrame) sceneFrame.onclick=()=>sceneFrame.classList.toggle('zoomed');
  }
  function renderStoryState(){
    const state=curStory, sheet=$('#ev-sheet');
    if(!state||!sheet) return;
    const reader=sheet.querySelector('.story-reader');
    const dock=sheet.querySelector('.event-choice-dock');
    const turn=state.turns[Math.min(state.index,state.turns.length-1)];
    reader.innerHTML=storyReaderHtml(state.turns,state.index);
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
      dock.innerHTML=`<div class="choice-dock-head"><span>${state.label} · ${state.index+1}/${state.turns.length}</span>
        <small>한 줄씩 이어진다</small></div>
        <button class="choice story-next" type="button">${nextLabel}<span class="req">${state.index+2} / ${state.turns.length}</span></button>`;
      dock.querySelector('.story-next').onclick=()=>{
        state.index++;
        renderStoryState();
        const scroll=sheet.querySelector('.event-scroll');
        const latest=reader&&reader.querySelector('[data-story-entry]:last-child');
        if(scroll&&reader&&latest){
          const bottom=reader.offsetTop+latest.offsetTop+latest.offsetHeight;
          scroll.scrollTo({top:Math.max(0,bottom-scroll.clientHeight+28),behavior:'auto'});
        }
      };
      return;
    }
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
    curEv=evd;
    curStory=null;
    bgmEvKey = (evd.type==='추적'||evd.type==='위기'||evd.ai)?'tension': evd.type==='스토리'?'story':null;
    if(evd.id==='leo_broadcast') BGM.playSongOnce();   // 400km 송출 — 노래가 울려 퍼지는 그 장면
    const CVO={ai_vending:'cheollian_01', exp_glasshouse:'cheollian_02', ai_census:'cheollian_03',
      ai_gasstation:'cheollian_05', ai_manifest:'cheollian_09', seoul_gate:'cheollian_13'};
    if(CVO[evd.id]) VO.play(CVO[evd.id]);
    SND.setDriving(false);
    const sheet=$('#ev-sheet');
    sheet.classList.add('event-mode');
    const aiEvent = evd.type==='추적'||!!evd.ai;
    $('#cheollian-tint').classList.toggle('on', aiEvent);
    const text = typeof evd.text==='function'? evd.text(S):evd.text;
    const locScene=evd.locEvent&&D.nodeScenes&&D.nodeScenes[evd.locEvent];
    const fallbackType=(evd.ai||evd.type==='추적')?'추적':evd.type;
    const sceneKey=evd.scene||(D.eventScenes&&D.eventScenes[evd.id])||locScene
      ||(D.eventSceneTypes&&D.eventSceneTypes[fallbackType])||'generic-story';
    const sceneSrc=sceneKey&&D.scenes&&D.scenes[sceneKey];
    const sceneAlt=(evd.title||'길 위의 사건').replace(/"/g,'&quot;');
    const scene=sceneSrc?`<div class="event-scene-frame" role="button" tabindex="0" aria-label="${sceneAlt} 장면 크게 보기"><img class="event-scene" src="${sceneSrc}" alt="${sceneAlt} 장면"><span class="scene-zoom" aria-hidden="true">↗</span></div>`:'';
    let context=D.storyContext&&D.storyContext[evd.id]
      ? `<div class="story-context"><b>앞 이야기</b>${D.storyContext[evd.id]}</div>` : '';
    const recruitQ=S.recruitQ, recruitDef=recruitQ&&D.recruitQuests[recruitQ.id];
    const approach=recruitQ&&G.recruitApproach();
    if(recruitDef&&approach&&(evd.id===recruitDef.follow||evd.id===recruitDef.join)){
      context=`<div class="story-context"><b>우리가 앞에서 한 일 · ${approach.label}</b>${approach.memory}</div>`+context;
    }
    const choices=eventChoiceData(evd);
    const turns=buildStoryTurns(text,evd);
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="${sceneAlt} 사건 내용">${scene}<div class="event-head"><div>
      <div class="tag ${aiEvent?'ai-tag':''}">${evd.type}${evd.gen?' · 오프로드 생성':''}</div>
      <h2>${evd.title}</h2></div></div>${context}${combatHudHtml(evd)}<div class="story-reader"></div></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    curStory={
      phase:'event',label:evd.type==='대화'?'대화':'이야기',turns,index:0,
      knownSpeaker:!!turns.knownSpeaker,
      finalDock:`<div class="choice-dock-head"><span>선택 · ${choices.count}</span>
        <small>${choices.count>3?'위아래로 밀어 모두 보기':'내가 할 일을 고른다'}</small></div>
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
    $('#ev-wrap').classList.add('on');
    if(evd.sfx) SND.combat(evd.sfx);
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
    h+=`<div class="choices" style="margin-top:12px">${!S.driving?`<button class="choice" data-talk="${id}">💬 말을 건다 <span class="req">하루 한 번 · 이야기가 유대를 만든다</span></button>`:''}<button class="choice" data-x="1">닫는다</button></div>`;
    const sheet=$('#ev-sheet');
    sheet.classList.remove('event-mode');
    sheet.innerHTML=h;
    sheet.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{ G.choosePerk(id, +b.dataset.pk); showComp(id); });
    const tk=sheet.querySelector('[data-talk]');
    if(tk) tk.onclick=()=>{ if(G.talkTo(tk.dataset.talk)){} };
    sheet.querySelector('[data-x]').onclick=()=>{ closeEvent(); };
    $('#ev-wrap').classList.add('on');
  }

  /* ── 작업대 (무기 제작) ── */
  function showCraft(){
    SND.setDriving(false);
    const sheet=$('#ev-sheet');
    sheet.classList.remove('event-mode');
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
    const oldCombat=$('#ev-sheet').querySelector('.combat-hud');
    const combatHud=oldCombat?oldCombat.outerHTML:'';
    const out=G.pickOutcome(curEv, choice);
    const chips=G.applyFx(out.fx);
    if(out.sfx) SND.combat(out.sfx);
    chips.push(...G.afterChoice(curEv, choice));
    if(S.ended) return;
    const sheet=$('#ev-sheet');
    sheet.classList.add('event-mode');
    const outcomeText=typeof out.text==='function'?out.text(S):out.text;
    const knownSpeaker=!!(curStory&&curStory.knownSpeaker);
    const turns=buildStoryTurns(outcomeText,curEv,{knownSpeaker});
    const oldScene=sheet.querySelector('.event-scene-frame');
    const scene=oldScene?oldScene.outerHTML:'';
    const fxHtml=chips.length
      ? '<div class="fx-line">'+chips.map(c=>`<span class="fx ${c.c}">${c.t}</span>`).join('')+'</div>'
      : '';
    let actions='';
    if(out.fx&&out.fx.offerComp){
      const id=out.fx.offerComp, mp=G.maxParty(), full=S.party.length>=mp, c=D.comps[id], next=G.nextSeatUpgrade();
      actions+=`<button class="choice" data-r="yes" ${full?'disabled':''}>${c.face} ${c.name}를 태운다
          <span class="req">${full? '✗ 동료석 만석 '+S.party.length+'/'+mp+(next?' · '+next.nm+' 필요':'') : '✓ 동료 자리 '+S.party.length+'/'+mp+' · '+c.perk}</span></button>
        <button class="choice" data-r="no">작별 인사를 한다</button>`;
    } else {
      actions+=`<button class="choice" data-r="ok">계속 간다</button>`;
    }
    const h=`<div class="event-scroll" tabindex="0" role="region" aria-label="선택 결과">${scene}
      <div class="event-head"><div><div class="tag">선택의 결과</div><h2>${curEv.title}</h2></div></div>
      ${combatHud}<div class="story-reader"></div><div class="story-result" aria-live="polite"></div></div>
      <div class="event-choice-dock"></div>`;
    sheet.innerHTML=h;
    curStory={
      phase:'outcome',label:'결과',turns,index:0,
      knownSpeaker:!!turns.knownSpeaker,
      finalDock:`<div class="choice-dock-head"><span>다음</span><small>결과를 확인했다</small></div>
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
    $('#ev-wrap').classList.remove('on');
    $('#ev-sheet').classList.remove('event-mode');
    $('#cheollian-tint').classList.remove('on');
    curEv=null;
    curStory=null;
    if(S.driving) SND.setDriving(true);
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
    document.querySelectorAll('.ovl').forEach(o=>o.classList.remove('on'));
    $('#ovl-seoul').classList.add('on');
    const go=$('#seoul-go'); if(go) go.onclick=()=>{ $('#ovl-seoul').classList.remove('on'); G.seoulEnter(stage); };
    const jn=$('#seoul-journal'); if(jn) jn.onclick=()=>{ $('#ovl-seoul').classList.remove('on'); toggleOvl('#ovl-journal'); renderJournal(); };
  }

  /* ── SETTLEMENT ── */
  let curStl=null, chatNpc=null, stlQuests=null, garageGroup='fuel',
    stlMode='hub', stlFocus='market';
  function settlementScene(stlId){
    const sid=D.nodeScenes&&D.nodeScenes[stlId];
    return sid&&D.scenes&&D.scenes[sid]?D.scenes[sid]:'';
  }
  function settlementSpots(stlId){
    return {
      market:{label:stlId==='muju'?'교환소':stlId==='daejeon'?'보급소':'장터',
        sub:'의뢰와 물자를 살핀다',icon:'food'},
      garage:{label:'정비소',sub:'달구지를 고치고 넓힌다',icon:'parts'},
      people:{label:stlId==='daejeon'?'사람들':'모닥불',
        sub:'얼굴을 보고 이야기를 나눈다',icon:'bond'}
    };
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
    const spots=settlementSpots(curStl), night=G.isNight();
    if(night&&(stlFocus==='market'||stlFocus==='garage')) stlFocus='people';
    const focus=spots[stlFocus]||spots.market;
    settlementHeader('');
    $('#ovl-stl').classList.add('hub-mode');
    body.innerHTML=`<div class="stl-hub" ${scene?`style="--stl-scene:url('${scene}')"`:''}>
      <div class="stl-hub-art" role="img" aria-label="${esc(stl.name)} 풍경"></div>
      <div class="stl-hub-place"><b>${esc(stl.name)}</b><small>${night?'장은 잠들었지만 모닥불은 아직 켜져 있다.':esc(stl.desc)}</small></div>
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
        <div class="stl-focus-copy"><span>${focus.label}</span><small>${night?'오늘은 쉬고 아침에 움직이자.':focus.sub}</small></div>
        <button class="stl-enter" id="stl-enter">${ICO(focus.icon)}<span>${focus.label}${focus.label==='사람들'?'을':'로'} 간다</span></button>
        <button class="stl-return" id="stl-out">${ICO('van')} 달구지로 돌아간다</button>
      </div>
    </div>`;
    body.querySelectorAll('[data-stlfocus]').forEach(b=>b.onclick=()=>{
      stlFocus=b.dataset.stlfocus;
      renderSettlementHub();
    });
    $('#stl-enter').onclick=()=>showStl(curStl,stlFocus);
    $('#stl-out').onclick=leaveSettlement;
    $('#ovl-stl').classList.add('on');
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
  function showStl(stlId,mode='hub'){
    curStl=stlId;
    stlMode=mode||'hub';
    const stl=D.stls[stlId];
    if(!G.isNight()) G.checkQuest();   // 배달은 사람이 깨어 있을 때만
    if(stlMode==='hub'){ renderSettlementHub(); return; }
    if(G.isNight()&&stlMode!=='people'){ stlFocus='people'; renderSettlementHub(); return; }
    $('#ovl-stl').classList.remove('hub-mode');
    const body=$('#stl-body'), scene=settlementScene(curStl), spots=settlementSpots(curStl);
    settlementHeader(spots[stlMode]?spots[stlMode].label:'');
    let h=`<div class="stl-section-hero" ${scene?`style="background-image:url('${scene}')"`:''}>
      <span>${ICO((spots[stlMode]||spots.market).icon)}${(spots[stlMode]||spots.market).label}</span>
      <small>${(spots[stlMode]||spots.market).sub}</small>
    </div>`;
    if(stlMode==='market'){
      h+=questBoardHtml();
      h+=`<div class="dlg"><div class="say stl-kicker"><span class="spk">오늘의 거래</span>
        <small>보유 고철 <span id="tr-scrap">${S.scrap}</span></small></div><div id="trade"></div></div>`;
    } else if(stlMode==='garage'){
      h+=`<div class="dlg garage-shell"><div class="say stl-kicker"><span class="spk">달구지 작업대</span>
        <small>부품 ${S.items['부품']||0} · 실제 차체 상태를 보며 개조한다</small></div><div id="garage"></div></div>`;
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
      if(stl.recruit && !G.hasComp(stl.recruit)
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
    } else {
      body.querySelectorAll('[data-npc]').forEach(b=>b.onclick=()=>talk(b.dataset.npc));
      const rec=body.querySelector('[data-recruit]');
      if(rec) rec.onclick=()=>recruitStl(stl.recruit);
      $('#stl-rest').onclick=()=>{ closeOvl('#ovl-stl'); G.camp('🏘 정착지에서 하룻밤을 묵었다'); };
    }
    $('#stl-hub-back').onclick=()=>showStl(curStl,'hub');
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
  function playUpgradeInstall(u,before){
    const ovl=$('#ovl-stl');
    const group=(D.upgradeGroups||[]).find(x=>x.ids.includes(u.id))||D.upgradeGroups[0];
    const art=D.upgradeArt&&D.upgradeArt[group.id];
    const afterStage=G.vanStage(), afterCapacity=G.seatCapacity();
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
        <div class="upgrade-phases" aria-live="polite">
          <span class="active">1 · 분해</span><span>2 · 체결</span><span>3 · 시동 확인</span>
        </div>
        <button class="upgrade-install-done" id="upgrade-install-done">달구지를 확인한다</button>
      </div>`);
    ovl.appendChild(layer);
    requestAnimationFrame(()=>{
      if(SCENE.drawSettlementVan){
        SCENE.drawSettlementVan($('#up-before-van'),before.up);
        SCENE.drawSettlementVan($('#up-after-van'),S.up);
      }
      if(typeof SND!=='undefined') SND.combat('tool');
    });
    const phases=[...layer.querySelectorAll('.upgrade-phases span')];
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish=()=>{
      if(!layer.isConnected) return;
      phases.forEach(x=>x.classList.add('active'));
      layer.classList.add('ready');
      const done=layer.querySelector('#upgrade-install-done');
      if(done) done.focus();
    };
    if(reduced) finish();
    else {
      setTimeout(()=>{ if(!layer.isConnected) return; phases[1].classList.add('active'); if(typeof SND!=='undefined') SND.combat('tool'); },450);
      setTimeout(()=>{ if(layer.isConnected) phases[2].classList.add('active'); },900);
      setTimeout(finish,1250);
    }
    $('#upgrade-install-done').onclick=()=>{
      layer.remove();
      renderGarage();
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
    document.querySelectorAll('#st-tabs button').forEach(x=>x.classList.toggle('here',x.dataset.st===stTab));
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
    <div class="mission-strip ${m.danger?'danger':''}" style="border:1px solid var(--line);border-radius:10px;margin-bottom:11px">${m.html}</div>
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
      ${S.flags.armed_age?`<div class="st-row"><span class="k">무기</span><span class="v" style="flex:1">${['쇠파이프','석궁','볼트','화염병'].map(k=>`${k} ${S.items[k]||0}`).join(' · ')}</span></div>`:''}</div>`;

    let journey=`<div class="st-sec"><h4>여정</h4>
      <div class="st-row"><span class="k">날짜 / 주행</span><span class="v" style="flex:1">DAY ${S.day} · ${Math.round(S.stats.km)}km · 서울까지 약 ${G.remainKm()}km</span></div>
      <div class="st-row"><span class="k">이벤트</span><span class="v" style="flex:1">${S.stats.events}건</span></div>
      <div class="st-row"><span class="k">발견</span>${bar(knownN,totalN)}<span class="v">${knownN}/${totalN}</span></div>
      <div class="st-row"><span class="k">정착지</span><span class="v" style="flex:1">${stlVisited}/${Object.keys(D.stls).length} 방문</span></div>
      <div class="st-row"><span class="k">${ICO('pursuit')}천리안 관측</span><span class="v" style="flex:1;color:${S.pursuit>2?'var(--danger)':'inherit'}">${'◉'.repeat(S.pursuit)||'—'} (${S.pursuit}/5)</span></div>
      ${S.flags.seoulTries?`<div class="st-row"><span class="k">남산 시도</span><span class="v" style="flex:1;color:var(--cheollian)">${S.flags.seoulTries}회 · 아직 입장 조건 미달</span></div>`:''}</div>`;
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
      return {id,c,st,p3,state,injury:S.injuries&&S.injuries[id],bondPct:st.lvl>=3?100:Math.min(100,st.bond/next*100)};
    });
    let crew=`<div class="st-summary">
      <div class="st-metric"><span class="mk">동료</span><span class="mv">${S.party.length}/${G.maxParty()}</span></div>
      <div class="st-metric"><span class="mk">완주 서사</span><span class="mv">${stories.filter(s=>s.state==='done').length}</span></div>
      <div class="st-metric"><span class="mk">보리</span><span class="mv">${S.dog?'동행 중':'—'}</span></div>
    </div><div class="st-sec"><h4>차에 실린 이야기</h4>`+
      (stories.length?`<div class="crew-status-list">`+stories.map(s=>`<div class="crew-status-card" data-comp2="${s.id}" role="button" tabindex="0">
        <span class="crew-status-face">${faceOf(s.id,s.c.face)}</span>
        <span class="crew-status-main"><b>${s.c.name}</b><small>${s.c.role}</small></span>
        <span class="crew-status-state">${s.injury?`🩹 ${s.injury.label}<br>${s.injury.days}일`:(s.state==='done'?`★ ${s.p3.nm}`:`Lv.${s.st.lvl} · 유대 ${s.st.bond}${s.st.pending?'<br>✦ 퍼크 대기':''}`)}</span>
        <span class="crew-status-bond"><i style="width:${s.bondPct}%"></i></span></div>`).join('')+`</div>`
        :`<div class="status-empty"><b>아직 혼자다.</b><span>누구를 만나게 될지는 길이 정한다.</span></div>`)+
      `<div class="csub" style="margin-top:7px">${stories.length?'이름을 누르면 유대와 해금된 능력을 확인한다.':'지도와 명단에는 만나지 않은 사람을 미리 표시하지 않는다.'}</div></div>`;

    b.innerHTML=`<div class="st-pane ${stTab==='now'?'on':''}" data-stpane="now">${now}</div>
      <div class="st-pane ${stTab==='journey'?'on':''}" data-stpane="journey">${journey}</div>
      <div class="st-pane ${stTab==='crew'?'on':''}" data-stpane="crew">${crew}</div>`;
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
    $('#end-journal').onclick=()=>{ $('#ovl-journal').classList.add('on'); renderJournal(); };
    $('#end-new').onclick=()=>{ closeOvl('#ovl-journal'); show('scr-title'); refreshTitle(); };
  }

  return {boot, modalOpen, renderAll, renderHud, speak, toast, showEvent, showEnding,
    showNodeCard, showGraphNote, onDepart, onArrive, showStl, playRadio, playChat, showSeoul,
    storyTurns:buildStoryTurns, finishStory, skipIntro, clearSpeech};
})();

/* ═══════════════════ SOUND (미니멀 신스) ═══════════════════ */
const SND = (()=>{
  let ac=null, on=false, suspended=false, engineGain=null, noiseSrc=null, sfxBuf=null, pulseTimer=null;
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
  function toggle(){
    if(!ac){ try{ build(); }catch(e){ return; } }
    on=!on;
    if(ac.state==='suspended') ac.resume();
    $('#dk-sound').querySelector('.dic').textContent= on?'🔊':'🔇';
    BGM.setOn(on);
    setDriving(S&&S.driving&&!UI.modalOpen());
  }
  function setDriving(driving){
    if(!ac||!engineGain) return;
    const target= on&&!suspended? (driving?0.16:0.05):0;
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
  return {toggle, setDriving, combat, suspend, resume};
})();
/* ═══════════════════ BGM (외부 생성 트랙 — D.bgm 슬롯) ═══════════════════
   D.bgm[key]에 data URI를 넣으면 상황에 맞춰 자동 재생·크로스페이드.
   슬롯이 비어 있으면 완전 무음(현재 동작 유지). 사운드 토글(🔊)에 종속. */
const BGM = (()=>{
  const players={};
  let cur=null, on=false, suspended=false, resumeSong=false;
  const VOL=0.5, FADE=1100;
  function ensure(key){
    if(players[key]!==undefined) return players[key];
    if(!D.bgm||!D.bgm[key]){ players[key]=null; return null; }
    const a=new Audio(D.bgm[key]); a.loop=true; a.volume=0; a.preload='auto';
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
    if(!on){ for(const k in players){ const a=players[k]; if(a){ fadeTo(a,0,()=>a.pause()); } } }
    else if(!suspended){ const k=cur; cur=null; set(k||'title'); }
  }
  function tick(desired){ if(suspended||(song&&!song.paused)) return; if(desired) set(desired); }
  /* ── 노래 (부서진 고속도로) — BGM과 별개, 명시 재생 ── */
  let song=null;
  function ensureSong(){
    if(song!==undefined&&song) return song;
    if(!D.bgm||!D.bgm.song) return null;
    song=new Audio(D.bgm.song); song.volume=0.6;
    song.onended=()=>{ songUi(false); const k=cur; cur=null; if(on) set(k); };
    return song;
  }
  function songUi(playing){ const b=$('#bt-song'); if(b) b.classList.toggle('playing',playing); }
  function toggleSong(){
    const s=ensureSong(); if(!s) return;
    if(!s.paused){ s.pause(); s.currentTime=0; songUi(false); const k=cur; cur=null; if(on) set(k); return; }
    /* 배경 BGM 잠시 내림 */
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
  return {tick, setOn, toggleSong, playSongOnce, suspend, resume};
})();
/* ═══════════════════ VO (보이스 — D.vo 슬롯) ═══════════════════
   슬롯이 비어 있으면 조용히 무시 (자막만). 파일 오면 드롭인. */
const VO = (()=>{
  let cur=null;
  function play(key){
    if(!D.vo||!D.vo[key]) return;
    stop();
    cur=new Audio(D.vo[key]); cur.volume=0.8;
    cur.play().catch(()=>{});
  }
  function stop(){ if(cur){ cur.pause(); cur=null; } }
  return {play, stop};
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
  VO.stop();
}
function resumeForLifecycle(){
  if(!lifecycleHidden||document.hidden) return;
  lifecycleHidden=false;
  SND.resume();
  BGM.resume();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) suspendForLifecycle();
  else resumeForLifecycle();
});
window.addEventListener('pagehide',suspendForLifecycle);
window.addEventListener('pageshow',resumeForLifecycle);
