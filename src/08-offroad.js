/* ═══════════════════ OFF-ROAD (LLM) ═══════════════════ */
const OFF = (()=>{
  const KEY_LS='seoul400_apikey';
  const API='https://api.anthropic.com/v1/messages';
  const model='claude-opus-4-8';
  const tossRuntime=Boolean(window.ReactNativeWebView||/\.tossmini\.com$/i.test(location.hostname)||/Toss/i.test(navigator.userAgent));
  const localOnly=location.protocol==='file:'&&!tossRuntime;
  let key = null; if(localOnly) try{ key = localStorage.getItem(KEY_LS); }catch(e){}
  let reachable=null, verified=false;
  const evQ=[], banterQ=[];
  let genBusy=false, banterBusy=false;

  const ready = ()=> !!(localOnly && key && verified && reachable);

  /* 모델 출력은 신뢰 경계 밖 — 수치를 clamp하듯 문자열도 여기서 무해화한다.
     태그를 벗기고 남은 꺾쇠까지 지워야 렌더러의 authored HTML 경로에 섞여도 마크업이 될 수 없다. */
  const sanit=(v,max)=>String(v??'').replace(/<[^>]*>/g,'').replace(/[<>]/g,'').slice(0,max||400);

  async function checkReachable(){
    if(!localOnly){ reachable=false; return false; }
    if(reachable!==null) return reachable;
    try{
      await fetch('https://api.anthropic.com/v1/models',{mode:'no-cors',signal:AbortSignal.timeout(6000)});
      reachable=true;
    }catch(e){ reachable=false; }
    if(reachable&&key){ // stored key → verify silently
      const r=await testKey(key); if(!r.ok){ verified=false; }
    }
    return reachable;
  }

  async function testKey(k){
    if(!localOnly) return {ok:false,msg:'공개 앱에서는 오프로드 API 키를 받지 않습니다.'};
    try{
      const res=await fetch(API,{method:'POST',
        headers:hdr(k),
        body:JSON.stringify({model, max_tokens:1, messages:[{role:'user',content:'ping'}]}),
        signal:AbortSignal.timeout(20000)});
      if(res.ok){ key=k; verified=true; reachable=true;
        try{ localStorage.setItem(KEY_LS,k); }catch(e){}
        return {ok:true, msg:'✓ 연결 성공 — '+model+' · 오프로드 모드 준비 완료'};
      }
      if(res.status===401) return {ok:false, msg:'✗ 키가 유효하지 않습니다 (401)'};
      const j=await res.json().catch(()=>({}));
      return {ok:false, msg:'✗ 오류 '+res.status+' — '+(j.error?.message||'')};
    }catch(e){
      reachable=false;
      return {ok:false, msg:'✗ 연결 실패 — 이 환경에선 외부 API가 차단되어 있을 수 있습니다'};
    }
  }
  const hdr=(k)=>({'x-api-key':k||key,'anthropic-version':'2023-06-01','content-type':'application/json',
    'anthropic-dangerous-direct-browser-access':'true'});

  async function call(system, user, schema, maxTok, effort){
    if(!ready()) return null;
    try{
      const body={model, max_tokens:maxTok||1200, system,
        messages:[{role:'user',content:user}],
        output_config:{effort:effort||'low', format:{type:'json_schema', schema}}};
      const res=await fetch(API,{method:'POST',headers:hdr(),body:JSON.stringify(body),
        signal:AbortSignal.timeout(50000)});
      if(!res.ok) return null;
      const j=await res.json();
      if(j.stop_reason==='refusal') return null;
      const txt=(j.content||[]).find(b=>b.type==='text');
      return txt? JSON.parse(txt.text):null;
    }catch(e){ return null; }
  }

  /* ── 컨텍스트 요약 ── */
  function ctx(){
    const notes=S.notes.slice(-4).map(n=>`[${n.type}] ${n.title}: ${n.body.slice(0,80)}`).join('\n');
    const party=S.party.map(id=>`${D.comps[id].name}(${D.comps[id].role}, 기분${S.comps[id].mood})`).join(', ')||'혼자';
    const loc = S.driving? `${D.nodes[S.driving.from].name}→${D.nodes[S.driving.to].name} 이동 중`:`${D.nodes[S.at].name}`;
    return `[현재 상태]
DAY ${S.day}, ${G.fmtClock().split('·')[1]}, ${G.isNight()?'밤':'낮'}, 날씨 ${G.wxName(S.wx)}(내일 ${G.wxName(S.wxNext)})
위치: ${loc} (권역: ${G.regionOf()==='south'?'남부(안전)':G.regionOf()==='mid'?'중부':'북부(천리안 영향권)'})
자원: 연료${Math.round(S.fuel)}L 물${S.water} 식량${S.food} 고철${S.scrap} 차체\${Math.round(S.van)}%
동행: ${party}${S.dog?' + 개 보리':''}
천리안 관측 수준: ${S.pursuit}/5
[최근 일지]
${notes}`;
  }

  /* ── 이벤트 생성 ── */
  const EV_SCHEMA={type:'object',additionalProperties:false,
    required:['title','etype','text','choices'],
    properties:{
      title:{type:'string'}, etype:{type:'string',enum:['조우','탐색','발견','추적','동행']},
      text:{type:'string'},
      choices:{type:'array',items:{type:'object',additionalProperties:false,
        required:['label','resultText','effects'],
        properties:{label:{type:'string'}, resultText:{type:'string'},
          effects:{type:'object',additionalProperties:false,
            required:['fuel','water','food','scrap','van','moodAll','pursuit','revealHidden','noteTitle','noteBody'],
            properties:{fuel:{type:'integer'},water:{type:'integer'},food:{type:'integer'},
              scrap:{type:'integer'},van:{type:'integer'},moodAll:{type:'integer'},
              pursuit:{type:'integer'},revealHidden:{type:'boolean'},
              noteTitle:{type:'string'},noteBody:{type:'string'}}}}}}}};

  const EV_SYS = ()=> D.worldBible + `
[임무] 지금 이 순간 길 위에서 벌어지는 이벤트 하나를 창작하라.
[규칙]
- text는 3~6문장, 한국어. 선택지는 2~3개, label은 간결하게.
- effects 수치 가이드: 자원 ±1~10, van ±3~12, moodAll ±2~8, pursuit는 천리안 관련시에만 0~1.
- 해당 없는 효과는 0, noteTitle/noteBody는 일지에 남길 가치가 있을 때만 채우고 아니면 빈 문자열.
- revealHidden은 새 장소 단서를 줄 때만 true (드물게).
- 동행 이벤트면 실제 동행 중인 인물만 등장시켜라. 천리안 대사는 정중한 존댓말.`;

  async function genEvent(){
    const j=await call(EV_SYS(), ctx()+'\n\n이벤트를 생성하라.', EV_SCHEMA, 1400, 'medium');
    if(!j||!j.choices||!j.choices.length) return null;
    const cl=(v,l)=>clamp(Math.round(v||0),-l,l);
    /* etype은 스키마 enum이지만 스키마는 서버 쪽 약속일 뿐이다 — 받는 쪽에서 다시 검증한다 */
    const TYPES=['조우','탐색','발견','추적','동행'];
    return {gen:true, type:TYPES.includes(j.etype)?j.etype:'조우', title:sanit(j.title,40)||'길 위에서', text:sanit(j.text,900),
      choices:j.choices.slice(0,3).map(c=>{
        const e=c.effects||{};
        const fx={fuel:cl(e.fuel,10)||undefined, water:cl(e.water,8)||undefined, food:cl(e.food,8)||undefined,
          scrap:cl(e.scrap,10)||undefined, van:cl(e.van,12)||undefined, moodAll:cl(e.moodAll,8)||undefined,
          pursuit: e.pursuit>0?1:undefined,
          reveal: e.revealHidden? 'any':undefined,
          note: (e.noteTitle&&e.noteBody)? {type:'사건',title:sanit(e.noteTitle,30),body:sanit(e.noteBody,200),links:[]}:undefined};
        Object.keys(fx).forEach(k=>fx[k]===undefined&&delete fx[k]);
        return {label:sanit(c.label,60), out:[{p:1, text:sanit(c.resultText,600), fx}]};
      })};
  }
  function prefetch(){
    if(!ready()||genBusy||evQ.length>=1) return;
    genBusy=true;
    genEvent().then(ev=>{ if(ev) evQ.push(ev); }).finally(()=>{ genBusy=false; });
    prefetchBanter();
  }
  function playGenerated(fallback){
    if(evQ.length){ G.openEvent(evQ.shift()); prefetch(); return; }
    if(!ready()){ fallback(); return; }
    UI.toast('📡 …');
    genBusy=true;
    genEvent().then(ev=>{
      genBusy=false;
      if(ev&&S&&S.driving&&!UI.modalOpen()) G.openEvent(ev);
      else if(!ev) fallback();
    }).catch(()=>{ genBusy=false; fallback(); });
  }

  /* ── 잡담 생성 ── */
  const BT_SCHEMA={type:'object',additionalProperties:false,required:['lines'],
    properties:{lines:{type:'array',items:{type:'object',additionalProperties:false,
      required:['who','text'],properties:{who:{type:'string'},text:{type:'string'}}}}}};
  async function prefetchBanter(){
    if(!ready()||banterBusy||banterQ.length>=3||!S.party.length) return;
    banterBusy=true;
    const sys=D.worldBible+`\n[임무] 이동 중인 달구지 안의 짧은 잡담/정경 3개를 생성. who는 ${['나','sys',...S.party].join('/')} 중 하나 (sys=정경묘사). text는 1문장, 캐릭터 말투 유지. 최근 일지의 사건을 자연스럽게 언급해도 좋다.`;
    const j=await call(sys, ctx()+'\n\n잡담 3개.', BT_SCHEMA, 500, 'low');
    banterBusy=false;
    if(j&&j.lines) j.lines.slice(0,3).forEach(l=>{
      const who=(l.who==='나'||l.who==='sys'||S.party.includes(l.who))? l.who:'sys';
      banterQ.push({who, t:sanit(l.text,90)}); });
  }
  /* 온로드 잡담 픽커에 끼어들기 */
  const origPick=G.pickBanter;
  G.pickBanter=()=>{
    if(S&&S.mode==='offroad'&&ready()){
      if(banterQ.length<2) prefetchBanter();
      /* 게임 rng를 쓴다 — 결정성(같은 시드 → 같은 여정)이 깨지지 않도록 */
      if(banterQ.length&&rng()<0.55) return banterQ.shift();
    }
    return origPick();
  };

  /* ── NPC 자유 대화 ── */
  const NPC_SCHEMA={type:'object',additionalProperties:false,
    required:['reply','attitudeDelta','action','amount'],
    properties:{reply:{type:'string'}, attitudeDelta:{type:'integer'},
      action:{type:'string',enum:['none','give_water','give_food','give_fuel','give_scrap','reveal_place']},
      amount:{type:'integer'}}};
  async function npcChat(nid, text){
    const npc=D.npcs[nid], st=S.npcs[nid];
    st.chat.push({r:'me',t:text});
    const hist=st.chat.slice(-8).map(m=>(m.r==='me'?'여행자':npc.name)+': '+m.t).join('\n');
    const sys=D.worldBible+`
[임무] 정착지 NPC를 연기하라.
[인물] ${npc.name} — ${npc.role}, ${D.stls[D.nodes[npc.node].stl].name}. 성격은 인사말에서 유추: "${npc.greet0}"
[관계] 호감도 ${st.att} (-100~100). attitudeDelta로 대화에 따라 -5~+5 조정.
[규칙] reply는 1~3문장, 이 인물의 말투로. 세계관 무너뜨리는 질문은 인물로서 자연스럽게 받아쳐라.
여행자에게 실제로 뭔가 줄 때만 action 사용(호감도가 높거나 서사적으로 타당할 때, 드물게). amount는 1~5. 줄 게 없으면 action=none, amount=0.
reveal_place는 아직 모르는 장소의 소문을 들려줄 때.`;
    const j=await call(sys, `[대화 기록]\n${hist}\n\n[상태]\n${ctx()}\n\n${npc.name}의 응답을 생성.`, NPC_SCHEMA, 600, 'low');
    if(!j) return null;
    j.reply=sanit(j.reply,400);
    st.att=clamp(st.att+clamp(j.attitudeDelta||0,-5,5),-100,100);
    st.chat.push({r:'npc',t:j.reply});
    if(st.chat.length>16) st.chat=st.chat.slice(-12);
    const chips=[];
    const amt=clamp(j.amount||0,0,5);
    if(j.action==='give_water'&&amt){ S.water+=amt; chips.push({t:`물 +${amt}`}); }
    else if(j.action==='give_food'&&amt){ S.food+=amt; chips.push({t:`식량 +${amt}`}); }
    else if(j.action==='give_fuel'&&amt){ S.fuel=clamp(S.fuel+amt,0,S.fuelMax); chips.push({t:`연료 +${amt}L`}); }
    else if(j.action==='give_scrap'&&amt){ S.scrap+=amt; chips.push({t:`고철 +${amt}`}); }
    else if(j.action==='reveal_place'){ const id=G.nearestHidden();
      if(id){ S.known.push(id); chips.push({t:`🗺 ${D.nodes[id].name} 발견`});
        G.addNote({type:'소문',title:npc.name+'의 귀띔',body:j.reply.slice(0,120),links:[D.nodes[id].name]}); } }
    G.addNote({type:'인물',title:npc.name,body:`DAY ${S.day} 대화. ${text.slice(0,40)}${text.length>40?'…':''} → "${j.reply.slice(0,60)}${j.reply.length>60?'…':''}"`,links:[D.nodes[npc.node].name]});
    return {reply:j.reply, chips};
  }

  return {ready, checkReachable, testKey, prefetch, playGenerated, npcChat,
    get reachable(){return reachable}, model};
})();

/* ═══ BOOT ═══ */
UI.boot();
