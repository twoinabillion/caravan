/* ═══ UI 5/5 — 소리: SND·BGM·AMBI·VO (UI IIFE 밖의 독립 모듈) ═══ */

/* ═══════════════════ SOUND (미니멀 신스) ═══════════════════ */
const SND = (()=>{
  let ac=null, on=false, userChoice=false, suspended=false, engineGain=null, noiseSrc=null, sfxBuf=null, pulseTimer=null;
  const buses={};
  let master=null, speechActive=false;
  const dbGain=db=>Math.pow(10,db/20);
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
    master=ac.createGain(); master.gain.value=dbGain(-3); master.connect(ac.destination);
    for(const key of mixKeys){
      buses[key]=ac.createGain(); buses[key].gain.value=1; buses[key].connect(master);
    }
    const buf=ac.createBuffer(1, ac.sampleRate*2, ac.sampleRate);
    const d=buf.getChannelData(0);
    let last=0;
    for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; }
    noiseSrc=ac.createBufferSource(); noiseSrc.buffer=buf; noiseSrc.loop=true;
    const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=120;
    engineGain=ac.createGain(); engineGain.gain.value=0;
    noiseSrc.connect(lp); lp.connect(engineGain); engineGain.connect(buses.ambience);
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
    for(const button of [early,$('#bt-title-sound'),$('#bt-prep-sound')]){
      if(!button) continue;
      button.classList.toggle('on',on);
      button.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');
      button.setAttribute('aria-pressed',String(on));
      button.querySelector('.sound-icon').textContent=on?'🔊':'🔇';
      button.querySelector('.sound-label').textContent=on?'소리 끄기':'소리 켜기';
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
    // The recorded road already contains its motor. Do not add a low rumble
    // underneath a parked cab, indoor conversation or clear rain droplets.
    const target= on&&!suspended&&!hasRecorded? (driving?.16:.05)*level('ambience'):0;
    engineGain.gain.cancelScheduledValues(ac.currentTime);
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
    o.connect(g); g.connect(buses.effects); o.start(t); o.stop(t+dur+.02);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function burst(freq,dur,vol,delay=0,q=.7){
    vol*=level('effects');
    if(vol<=0) return;
    const t=ac.currentTime+delay, s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
    s.buffer=sfxBuf; f.type='bandpass'; f.frequency.value=freq; f.Q.value=q;
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f); f.connect(g); g.connect(buses.effects); s.start(t); s.stop(t+dur+.02);
    s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
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
    const bus=mixKeys.includes(opt?.bus)?opt.bus:'effects';
    node.connect(gain); gain.connect(buses[bus]);
    audioEl.volume=1;                  // 조절은 게인이 한다
    const handle={gain, ctx:ac, bus, busGain:buses[bus], master};
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
  function setSpeech(active){
    speechActive=!!active;
    if(!ac) return;
    const t=ac.currentTime;
    for(const key of ['music','ambience']){
      const gain=buses[key].gain;
      gain.cancelScheduledValues(t); gain.setValueAtTime(gain.value,t);
      // Gain automation is bus-owned: fade tails and scene changes also duck.
      gain.linearRampToValueAtTime(dbGain(speechActive?(key==='music'?-9:-6):0),t+(speechActive?.12:.65));
    }
  }
  return {toggle, enable, isEnabled, setDriving, combat, suspend, resume, level, setLevel,
    route, setMediaVolume, mediaVolume, setSpeech};
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
    SND.setMediaVolume(a,0,{bus:'music'});
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
      resumeSong=false;
      if(song&&!song.paused){ song.pause(); song.currentTime=0; songUi(false); }
      for(const a of Object.values(players)) if(a){
        clearInterval(a._fi); a._fi=null; SND.setMediaVolume(a,0); a.pause();
      }
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
    song=new Audio(D.bgm.song); SND.setMediaVolume(song, 0.6*SND.level('music'),{bus:'music'});
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
   장소 + 날씨 + 와이퍼 + 자연음은 각 한 소유자. 짧은 동작음은 제한된 풀.
   Free 생성물은 로컬 Studio에서만 스트리밍하며 배포 HTML에는 넣지 않는다. */
const AMBI = (()=>{
  const cache={}, shots=new Set(), shotPool={}, lastShot={}, lastVariant={}, layers={};
  let on=false, suspended=false, current=null, currentKey=null, departTimer=null;
  let worldContext='outdoor', worldSignature='', introToken='', introScene='', nextThunder=0;
  const FADE=480;
  function source(key){
    if(D.sfx&&D.sfx[key]) return D.sfx[key];
    const relative=D.detailSfx&&D.detailSfx[key];
    if(relative&&['127.0.0.1','localhost'].includes(location.hostname)&&
      new URLSearchParams(location.search).has('caravan-live'))
      return '/__live/asset/'+encodeURIComponent(relative);
    return null;
  }
  function make(key,loop=false){
    if(!source(key)) return null;
    if(loop&&cache[key]) return cache[key];
    const audio=new Audio(source(key));
    audio.loop=loop;
    audio.preload='auto';
    SND.setMediaVolume(audio,0,{bus:loop?'ambience':'effects'});
    if(loop) cache[key]=audio;
    return audio;
  }
  function stop(audio,reset=false){
    if(!audio) return;
    clearInterval(audio._fade); audio._fade=null;
    audio.pause(); if(reset) audio.currentTime=0;
    shots.delete(audio);
  }
  function pauseAll(){
    clearTimeout(departTimer); departTimer=null;
    for(const audio of Object.values(cache)) stop(audio);
    for(const audio of shots) stop(audio,true);
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
      if(current._baseTarget===volume&&!current.paused) return;
      current._baseTarget=volume;
      if(on&&!suspended&&current.paused) current.play().catch(()=>{});
      if(on&&!suspended) fade(current,volume*SND.level('ambience'));
      return;
    }
    const prev=current;
    currentKey=key||null;
    current=key?make(key,true):null;
    if(prev&&prev!==current){
      if(on&&!suspended) fade(prev,0,()=>stop(prev,true)); else stop(prev,true);
    }
    if(current) current._baseTarget=volume;
    if(!current||!on||suspended) return;
    SND.setMediaVolume(current,0);
    current.play().catch(()=>{});
    fade(current,volume*SND.level('ambience'));
  }
  function play(key,volume=.34){
    if(!on||suspended) return null;
    const now=performance.now();
    if(lastShot[key]!=null&&now-lastShot[key]<180) return null;
    const family=key;
    const variants=(D.detailSfxVariants?.[key]||[key]).filter(id=>source(id));
    if(!variants.length) return null;
    lastShot[key]=now;
    const choices=variants.length>1?variants.filter(id=>id!==lastVariant[family]):variants;
    key=choices[Math.floor(Math.random()*choices.length)]; lastVariant[family]=key;
    const pool=shotPool[key]||(shotPool[key]=[]);
    let audio=pool.find(a=>!shots.has(a));
    if(!audio&&pool.length<2){ audio=make(key,false); if(audio) pool.push(audio); }
    if(!audio){ audio=pool[0]; stop(audio,true); }
    if(!audio) return null;
    if(shots.size>=6) stop(shots.values().next().value,true);
    audio.currentTime=0;
    const varied=variants.length>1;
    audio.playbackRate=varied?.97+Math.random()*.06:1;
    audio.preservesPitch=!varied;
    audio._baseVolume=volume*(varied?Math.pow(10,(Math.random()*1.6-.8)/20):1);
    /* Bounded reusable media nodes allow true WebAudio gain on iOS too. */
    SND.setMediaVolume(audio, audio._baseVolume*SND.level('effects'));
    shots.add(audio);
    const clear=()=>shots.delete(audio);
    audio.onended=clear;
    audio.onerror=clear;
    audio.play().catch(clear);
    return audio;
  }
  function layer(slot,key,volume){
    const old=layers[slot];
    if(old&&old.key===key&&old.baseGain===volume){
      if(on&&!suspended&&old.audio&&old.audio.paused){
        old.audio.play().catch(()=>{}); fade(old.audio,volume*SND.level('ambience'));
      }
      return;
    }
    const audio=key?make(key,true):null;
    layers[slot]={key,baseGain:volume,audio};
    if(old&&old.audio&&old.audio!==audio){
      if(on&&!suspended) fade(old.audio,0,()=>stop(old.audio,true)); else stop(old.audio,true);
    }
    if(!audio||!on||suspended) return;
    audio._baseTarget=volume; SND.setMediaVolume(audio,0);
    audio.play().catch(()=>{}); fade(audio,volume*SND.level('ambience'));
  }
  function clearLayers(){
    for(const slot of ['weather','wipers','nature']) layer(slot,null,0);
    nextThunder=0;
  }
  const terrain={
    river:new Set(['jinju','maehwa','gongju','lake','spring']),
    forest:new Set(['hapcheon','yeongdong','damyang','sunflower']),
    tunnel:new Set(['muju','tunnelbook'])
  };
  function visible(id){ return !!document.getElementById(id)?.classList.contains('on'); }
  function syncWorld(screen){
    if(screen!=='game'||typeof S==='undefined'||!S||S.ended){
      clearLayers(); worldSignature='';
      if(screen!=='intro'){
        setLoop(null);
        for(const audio of shots) stop(audio,true);
      }
      return;
    }
    const eventOpen=visible('ev-wrap');
    const camp=visible('ovl-camp'), town=visible('ovl-stl');
    const context=eventOpen?worldContext:S.driving?'cab':camp?'camp':town?worldContext:'cab';
    const wet=S.wx==='rain'||S.wx==='storm', storm=S.wx==='storm';
    const outside=context==='outdoor'||context==='camp';
    const rainKey=wet&&context!=='indoors'
      ?'detail_rain_'+(context==='cab'?'cab_'+(storm?'heavy':'light'):context==='shelter'?'shelter':'outdoor_'+(storm?'heavy':'light')):null;
    // Clear/dust/fog are not rain. Wipers require actual wet driving, not forecast.
    layer('weather',rainKey||(outside?'detail_'+(storm||S.wx==='dust'?'wind_storm':'wind_gentle'):null),wet?.16:.07);
    layer('wipers',wet&&S.driving&&!eventOpen&&!town&&!camp?'detail_wipers':null,.09);
    let nature=null;
    if((outside||context==='cab'&&!S.driving)&&!wet){
      if(G.isNight()) nature='detail_night_insects';
      else if(terrain.river.has(S.at)) nature='detail_river';
      else if(terrain.forest.has(S.at)) nature='detail_forest_day';
    }
    if(context==='indoors'&&terrain.tunnel.has(S.at)) nature='detail_tunnel';
    layer('nature',nature,.07);
    const signature=[context,S.wx,S.at,!!S.driving,eventOpen].join('|');
    if(signature!==worldSignature){
      worldSignature=signature; nextThunder=performance.now()+30000+Math.random()*30000;
    }
    if(on&&!suspended&&storm&&context!=='indoors'&&performance.now()>=nextThunder){
      play('detail_thunder_distant',context==='cab'?.10:.17);
      nextThunder=performance.now()+30000+Math.random()*30000;
    }
  }
  function action(kind){
    const cues={repair:'detail_repair_ratchet',craft:'detail_tool_sorting',trade:'detail_bag_packing',
      meal:'detail_meal',rest:'detail_cloth',explore:'detail_steps_gravel',radio:'detail_radio_tuning',
      bag:'detail_bag_packing',journal:'detail_notebook',map:'detail_paper_fold',menu:'detail_switch'};
    if(cues[kind]) play(cues[kind],['map','menu','journal'].includes(kind)?.14:.24);
  }
  function fieldAction(action){
    const cue={water:'detail_water_pour',order:'detail_tool_sorting',record:'detail_paper_fold',
      light:'detail_switch',gate:'detail_door_latch',shelter:'detail_cloth'}[action?.change?.visual];
    if(cue) play(cue,.24);
  }
  function introTurn(scene,index,beat,activeScene=scene){
    if(activeScene!==introScene) intro(activeScene);
    const token=scene+'|'+index;
    if(token===introToken) return; introToken=token;
    const cue=beat&&beat.sfx||D.introSoundCues?.[scene]?.[index];
    if(cue) play(cue,.24);
  }
  function setOn(value){
    on=!!value;
    if(!on){
      pauseAll();
      return;
    }
    if(!suspended&&current){
      SND.setMediaVolume(current,0);
      current.play().catch(()=>{});
      fade(current,(current._baseTarget||.18)*SND.level('ambience'));
    }
    applyMix();
  }
  function intro(scene){
    introScene=scene;
    for(const audio of shots) stop(audio,true);
    clearLayers(); worldSignature=''; introToken='';
    switch(scene){
      case 'intro-busan-room-morning-v1':
      case 'intro-cup-habit-v1':
      case 'intro-busan-workday-v1':
      case 'intro-workday-return-v1':
      case 'intro-workday-repair-v1':
      case 'intro-busan-water-line-v1':
        setLoop(source('detail_rain_shelter')?'detail_rain_shelter':null,.10); break;
      case 'intro-busan-cold-storage-v1':
        setLoop('sfx_lab_room_loop',.07); break;
      case 'intro-busan-generator-night-v1':
        setLoop('sfx_camp_loop',.08); break;
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
    worldContext='cab'; clearTimeout(departTimer);
    play('sfx_van_start',.38);
    const key=road==='rough'?'sfx_drive_gravel_loop':'sfx_drive_asphalt_loop';
    departTimer=setTimeout(()=>{ departTimer=null; setLoop(key,.17); },1100);
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
    worldContext=mode==='garage'||['daejeon','suwon','muju','seoul'].includes(placeId)?'indoors':mode==='market'?'shelter':'outdoor';
    const profile=placeLoop(placeId,mode);
    setLoop(profile[0],profile[1]);
  }
  function event(evd){
    // Authored location only: remembered rain in dialogue is not current weather.
    worldContext=evd&&evd.audioContext||D.audioSceneContexts?.[evd&&evd.scene]
      ||(evd?.campConversation||evd?.needsComp?'cab':'outdoor');
    const id=String(evd&&evd.id||''), cue=String(evd&&evd.sfx||'');
    if(id==='seoul_core') worldContext='indoors';
    if(id==='seoul_core') setLoop('sfx_core_loop',.17);
    else if(/drone|swarm/.test(id)||cue==='drone') setLoop('sfx_drone_real',.14);
    else setLoop(null);
    if(id==='ai_gasstation') play('sfx_fuel_pump',.38);
    if(/checkpoint|toll/.test(id)||cue==='scan') play('sfx_checkpoint',.28);
    if(/walker/.test(id)||cue==='walker') play('sfx_walker_real',.36);
    if(/^(?:freq_|radio_|dj_)/.test(id)) play('sfx_radio_static',.26);
  }
  function restore(){
    worldContext='cab';
    if(typeof S==='undefined'||!S){ setLoop(null); return; }
    if($('#ovl-stl')&&$('#ovl-stl').classList.contains('on')){
      settlement(G.isNight()?'people':'hub',S.at&&D.nodes[S.at]&&D.nodes[S.at].stl);
      return;
    }
    if(S.driving){
      setLoop(S.driving.road==='rough'?'sfx_drive_gravel_loop':'sfx_drive_asphalt_loop',.17);
      return;
    }
    {
      const placeId=S.at&&D.nodes[S.at]&&D.nodes[S.at].stl||S.at;
      const profile=placeProfiles[placeId];
      if(profile) setLoop(profile[0],profile[1]); else setLoop(null);
    }
  }
  function suspend(){
    suspended=true;
    pauseAll();
  }
  function resume(){
    suspended=false;
    if(!on) return;
    if(typeof S!=='undefined'&&S?.driving&&!visible('ev-wrap'))
      setLoop(S.driving.road==='rough'?'sfx_drive_gravel_loop':'sfx_drive_asphalt_loop',.17);
    if(current){ current.play().catch(()=>{}); fade(current,(current._baseTarget||.18)*SND.level('ambience')); }
    applyMix();
  }
  function applyMix(){
    if(current&&on&&!suspended) fade(current,(current._baseTarget||.18)*SND.level('ambience'));
    for(const row of Object.values(layers)) if(row.audio&&on&&!suspended){
      if(row.audio.paused) row.audio.play().catch(()=>{});
      fade(row.audio,row.baseGain*SND.level('ambience'));
    }
    for(const audio of shots) SND.setMediaVolume(audio, (audio._baseVolume||.34)*SND.level('effects'));
  }
  return {setOn,setLoop,play,intro,introTurn,action,fieldAction,syncWorld,depart,arrive,settlement,event,restore,suspend,resume,applyMix};
})();
/* ═══════════════════ VO (보이스 — D.vo 슬롯) ═══════════════════
   슬롯이 비어 있으면 조용히 무시 (자막만). 파일 오면 드롭인. */
const VO = (()=>{
  const players={};
  let cur=null, on=false, suspended=false, generation=0;
  function play(key){
    if(!on||suspended||!D.vo||!D.vo[key]) return;
    stop();
    const token=++generation;
    const audio=players[key]||(players[key]=new Audio(D.vo[key]));
    cur=audio; audio.currentTime=0;
    SND.setMediaVolume(audio, 0.8*SND.level('voice'),{bus:'voice'});
    const clear=()=>{if(cur===audio&&generation===token){cur=null;SND.setSpeech(false);}};
    audio.onended=clear; audio.onerror=clear;
    audio.onplaying=()=>{if(cur===audio&&generation===token)SND.setSpeech(SND.level('voice')>0);};
    audio.play().catch(clear);
  }
  function stop(){ generation++; if(cur){cur.pause();cur.currentTime=0;cur=null;} SND.setSpeech(false); }
  function setOn(value){ on=!!value; if(!on) stop(); }
  function suspend(){suspended=true;stop();}
  function resume(){suspended=false;} // A finished/hidden utterance is never replayed.
  function applyMix(){ if(cur){
    SND.setMediaVolume(cur, 0.8*SND.level('voice'));
    SND.setSpeech(!cur.paused&&SND.level('voice')>0);
  } }
  return {play, stop, setOn, applyMix, suspend, resume};
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
  VO.suspend();
}
function resumeForLifecycle(){
  if(!lifecycleHidden||document.hidden) return;
  lifecycleHidden=false;
  try{ if(typeof S!=='undefined'&&S&&!S.ended) G.qualitySessionStart(); }catch(e){}
  SND.resume();
  BGM.resume();
  AMBI.resume();
  VO.resume();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) suspendForLifecycle();
  else resumeForLifecycle();
});
window.addEventListener('pagehide',suspendForLifecycle);
window.addEventListener('pageshow',resumeForLifecycle);
