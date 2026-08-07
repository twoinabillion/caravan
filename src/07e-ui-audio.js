/* ═══ UI 5/5 — 소리: SND·BGM·AMBI·VO (UI IIFE 밖의 독립 모듈) ═══ */

/* ═══════════════════ SOUND (미니멀 신스) ═══════════════════ */
const SND = (()=>{
  let ac=null, on=false, userChoice=false, suspended=false, engineGain=null, noiseSrc=null, sfxBuf=null, pulseTimer=null;
  const mixKeys=['music','ambience','effects','voice'];
  const mix=Object.fromEntries(mixKeys.map(key=>{
    const raw=localStorage.getItem(`caravan_audio_${key}`);
    const saved=raw===null?NaN:Number(raw);
    return [key,Number.isFinite(saved)&&saved>=0&&saved<=1?saved:1];
  }));
  function level(key){ return Number.isFinite(mix[key])?mix[key]:1; }
  function setLevel(key,value){
    if(!mixKeys.includes(key)) return;
    mix[key]=Math.max(0,Math.min(1,Number(value)||0));
    localStorage.setItem(`caravan_audio_${key}`,String(mix[key]));
    if(key==='music'&&typeof BGM!=='undefined') BGM.applyMix();
    if((key==='ambience'||key==='effects')&&typeof AMBI!=='undefined') AMBI.applyMix();
    if(key==='ambience') setDriving(typeof S!=='undefined'&&S&&S.driving&&!UI.modalOpen());
    if(key==='voice'&&typeof VO!=='undefined') VO.applyMix();
  }
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
    const target= on&&!suspended? (driving?(hasRecorded?0.055:0.16):(hasRecorded?0.018:0.05))*level('ambience'):0;
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
    vol*=level('effects');
    if(vol<=0) return;
    const t=ac.currentTime+delay, o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.setValueAtTime(Math.max(20,f0),t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(Math.max(.0001,vol),t);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+.02);
  }
  function burst(freq,dur,vol,delay=0,q=.7){
    vol*=level('effects');
    if(vol<=0) return;
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
      case 'confirm':
        tone('sine',420,520,.055,.022); tone('sine',560,680,.065,.018,.07); break;
      case 'success':
        tone('triangle',360,520,.13,.04); tone('triangle',520,760,.19,.045,.12); break;
      case 'partial':
        tone('triangle',430,520,.11,.035); tone('sine',390,310,.22,.026,.14); break;
      case 'failure':
        tone('sawtooth',310,190,.18,.04); burst(170,.2,.045,.09); tone('sine',145,70,.3,.04,.18); break;
      case 'exit':
        tone('sine',330,250,.12,.022); tone('sine',250,220,.18,.016,.13); break;
      default: tone('sine',360,430,.06,.018);
    }
  }
  /* ── 미디어 라우팅 ──
     iOS Safari는 HTMLMediaElement.volume 쓰기를 무시한다. 음악·환경음·목소리를
     element.volume으로만 조절하면 아이폰에서 4채널 믹서·크로스페이드가 통째로
     동작하지 않는다(2026-08-06 적대적 재검증 지적). 요소를 AudioContext의
     게인 노드에 물려 게인으로 조절하면 어느 플랫폼에서나 실제로 먹는다. */
  const routed=new WeakMap();
  function route(audioEl, opt){
    if(!audioEl) return null;
    /* 일회성 재생은 라우팅하지 않는다. MediaElementSource는 요소당 한 번만 만들 수 있고
       회수되지 않아, 한 방짜리 효과음까지 물리면 세션 내내 노드가 쌓인다. */
    if(opt&&opt.oneShot) return null;
    if(routed.has(audioEl)) return routed.get(audioEl);
    if(!ac){ try{ build(); }catch(e){ return null; } }
    if(!ac) return null;
    let node;
    try{ node=ac.createMediaElementSource(audioEl); }
    catch(e){ return null; }          // 이미 물렸거나 지원 안 되면 원래 경로로
    const gain=ac.createGain();
    gain.gain.value=1;
    node.connect(gain); gain.connect(ac.destination);
    audioEl.volume=1;                  // 조절은 게인이 한다
    const handle={gain, ctx:ac};
    routed.set(audioEl, handle);
    return handle;
  }
  /* 요소 볼륨 대신 게인을 쓴다. 라우팅이 불가능한 환경에서는 원래 방식으로 되돌아간다. */
  function setMediaVolume(audioEl, v, opt){
    if(!audioEl) return;
    const level=Math.max(0,Math.min(1,v));
    const h=route(audioEl, opt);
    if(h){
      const t=h.ctx.currentTime;
      h.gain.gain.cancelScheduledValues(t);
      h.gain.gain.setValueAtTime(h.gain.gain.value, t);
      h.gain.gain.linearRampToValueAtTime(level, t+0.05);
      audioEl._mixLevel=level;
    } else {
      audioEl.volume=level; audioEl._mixLevel=level;
    }
  }
  const mediaVolume=(audioEl)=> audioEl ? (audioEl._mixLevel!==undefined?audioEl._mixLevel:audioEl.volume) : 0;
  return {toggle, enable, isEnabled, setDriving, combat, suspend, resume, level, setLevel,
    route, setMediaVolume, mediaVolume};
})();
/* ═══════════════════ BGM (외부 생성 트랙 — D.bgm 슬롯) ═══════════════════
   D.bgm[key]에 data URI를 넣으면 상황에 맞춰 자동 재생·크로스페이드.
   슬롯이 비어 있으면 완전 무음(현재 동작 유지). 사운드 토글(🔊)에 종속. */
const BGM = (()=>{
  const players={};
  let cur=null, on=false, suspended=false, resumeSong=false, manualPauseKey=null;
  const VOL=0.5, FADE=1100;
  const mixedVolume=()=>VOL*SND.level('music');
  function ensure(key){
    if(players[key]!==undefined) return players[key];
    if(!D.bgm||!D.bgm[key]){ players[key]=null; return null; }
    const a=new Audio(D.bgm[key]); a.loop=D.bgm[`${key}Loop`]!==false; a.preload='auto';
    SND.setMediaVolume(a,0);
    players[key]=a; return a;
  }
  function fadeTo(a, target, then){
    if(!a) return;
    if(a._fi) clearInterval(a._fi);
    const from=SND.mediaVolume(a);
    if(Math.abs(target-from)<.001){
      SND.setMediaVolume(a,target);
      if(then) then();
      return;
    }
    const step=(target-from)/(FADE/50);
    a._fi=setInterval(()=>{
      const v=SND.mediaVolume(a)+step;
      if((step>0&&v>=target)||(step<0&&v<=target)){ SND.setMediaVolume(a,target); clearInterval(a._fi); a._fi=null; if(then)then(); }
      else SND.setMediaVolume(a,Math.max(0,Math.min(1,v)));
    },50);
  }
  function set(key){
    if(cur===key) return;
    const prev=ensure(cur); cur=key;
    if(prev) fadeTo(prev,0,()=>prev.pause());
    if(!on||suspended) return;
    const nx=ensure(key);
    if(nx){ nx.play().catch(()=>{}); fadeTo(nx,mixedVolume()); }
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
    song=new Audio(D.bgm.song); SND.setMediaVolume(song, 0.6*SND.level('music'));
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
    SND.setMediaVolume(s, 0.6*SND.level('music'));
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
    if(a){ a.play().catch(()=>{}); fadeTo(a,mixedVolume()); }
  }
  function applyMix(){
    if(song) SND.setMediaVolume(song, 0.6*SND.level('music'));
    const active=cur?ensure(cur):null;
    if(active&&on&&!suspended&&(!song||song.paused)) fadeTo(active,mixedVolume());
  }
  function isSongPlaying(){ return Boolean(song&&!song.paused); }
  function isMusicPaused(){ return Boolean(manualPauseKey); }
  return {tick, setOn, toggleSong, playSongOnce, isSongPlaying, isMusicPaused, suspend, resume, applyMix};
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
    /* 라우팅된 요소의 .volume은 1로 고정돼 있다 — 여기서 읽으면 모든 전환이
       최대 음량에서 시작한다(2026-08-07 실측 회귀). 믹스 값을 읽어야 한다. */
    const start=SND.mediaVolume(audio), begun=performance.now();
    if(audio._fade) clearInterval(audio._fade);
    audio._fade=setInterval(()=>{
      const p=Math.min(1,(performance.now()-begun)/FADE);
      SND.setMediaVolume(audio, Math.max(0,Math.min(1,start+(target-start)*p)));
      if(p>=1){
        clearInterval(audio._fade); audio._fade=null;
        if(done) done();
      }
    },40);
  }
  function setLoop(key,volume=.18){
    clearTimeout(departTimer);
    if(currentKey===key&&current){
      current._baseTarget=volume;
      if(on&&!suspended&&current.paused) current.play().catch(()=>{});
      if(on&&!suspended) fade(current,volume*SND.level('ambience'));
      return;
    }
    const prev=current;
    currentKey=key||null;
    current=key?make(key,true):null;
    if(prev&&prev!==current) fade(prev,0,()=>{ prev.pause(); prev.currentTime=0; });
    if(current) current._baseTarget=volume;
    if(!current||!on||suspended) return;
    SND.setMediaVolume(current,0);
    current.play().catch(()=>{});
    fade(current,volume*SND.level('ambience'));
  }
  function play(key,volume=.34){
    if(!on||suspended||!source(key)) return null;
    const audio=make(key,false);
    if(!audio) return null;
    audio._baseVolume=volume;
    SND.setMediaVolume(audio, volume*SND.level('effects'), {oneShot:true});
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
      SND.setMediaVolume(current,0);
      current.play().catch(()=>{});
      fade(current,(current._baseTarget||.18)*SND.level('ambience'));
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
  const placeProfiles={
    busan:['sfx_port_arrival_loop',.16],gwangju:['sfx_market_loop',.13],miryang:['sfx_market_loop',.15],
    daegu:['sfx_garage_loop',.13],muju:['sfx_camp_loop',.12],jeonju:['sfx_market_loop',.12],
    daejeon:['sfx_lab_room_loop',.14],suwon:['sfx_garage_loop',.11],seoul:['sfx_core_loop',.14]
  };
  function placeLoop(placeId,mode='hub'){
    if(mode==='garage') return ['sfx_garage_loop',.17];
    if(mode==='people'&&placeId!=='daejeon'&&placeId!=='suwon') return ['sfx_camp_loop',.13];
    return placeProfiles[placeId]||['sfx_market_loop',.14];
  }
  function arrive(nodeId){
    setLoop(null);
    play('sfx_stop_brake',.38);
    const placeId=D.nodes&&D.nodes[nodeId]&&D.nodes[nodeId].stl||nodeId;
    const profile=placeProfiles[placeId];
    if(profile) departTimer=setTimeout(()=>setLoop(profile[0],profile[1]),650);
  }
  function settlement(mode,placeId){
    const profile=placeLoop(placeId,mode);
    setLoop(profile[0],profile[1]);
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
      settlement(G.isNight()?'people':'hub',S.at&&D.nodes[S.at]&&D.nodes[S.at].stl);
      return;
    }
    if(S.driving){
      setLoop(S.driving.road==='rough'?'sfx_drive_gravel_loop':'sfx_drive_asphalt_loop',.17);
      return;
    }
    if(G.isNight()) setLoop('sfx_camp_loop',.12);
    else {
      const placeId=S.at&&D.nodes[S.at]&&D.nodes[S.at].stl||S.at;
      const profile=placeProfiles[placeId];
      if(profile) setLoop(profile[0],profile[1]); else setLoop(null);
    }
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
    fade(current,(current._baseTarget||.18)*SND.level('ambience'));
  }
  function applyMix(){
    if(current&&on&&!suspended) fade(current,(current._baseTarget||.18)*SND.level('ambience'));
    for(const audio of shots) SND.setMediaVolume(audio, (audio._baseVolume||.34)*SND.level('effects'), {oneShot:true});
  }
  return {setOn,setLoop,play,intro,depart,arrive,settlement,event,restore,suspend,resume,applyMix};
})();
/* ═══════════════════ VO (보이스 — D.vo 슬롯) ═══════════════════
   슬롯이 비어 있으면 조용히 무시 (자막만). 파일 오면 드롭인. */
const VO = (()=>{
  let cur=null, on=false;
  function play(key){
    if(!on||!D.vo||!D.vo[key]) return;
    stop();
    cur=new Audio(D.vo[key]); SND.setMediaVolume(cur, 0.8*SND.level('voice'));
    cur.play().catch(()=>{});
  }
  function stop(){ if(cur){ cur.pause(); cur=null; } }
  function setOn(value){ on=!!value; if(!on) stop(); }
  function applyMix(){ if(cur) SND.setMediaVolume(cur, 0.8*SND.level('voice')); }
  return {play, stop, setOn, applyMix};
})();

/* 토스 WebView가 백그라운드로 내려갈 때 소리와 진행을 명시적으로 멈춘다.
   사용자가 고른 음소거 상태는 바꾸지 않고, 다시 보일 때만 정상 재개한다. */
let lifecycleHidden=false;
function saveForLifecycle(){
  try{ if(typeof S!=='undefined'&&S) G.save(); }catch(e){}
}
function suspendForLifecycle(){
  lifecycleHidden=true;
  try{
    const visibleScreen=document.querySelector('.screen.on');
    if(typeof S!=='undefined'&&S) G.qualitySessionEnd(visibleScreen?visibleScreen.id:'game');
  }catch(e){}
  saveForLifecycle();
  SND.suspend();
  BGM.suspend();
  AMBI.suspend();
  VO.stop();
}
function resumeForLifecycle(){
  if(!lifecycleHidden||document.hidden) return;
  lifecycleHidden=false;
  try{ if(typeof S!=='undefined'&&S&&!S.ended) G.qualitySessionStart(); }catch(e){}
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
