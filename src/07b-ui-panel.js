/* ═══ UI 2/5 — 패널·화자·대화 렌더·주행 훅·버블·토스트 (UI IIFE 내부) ═══ */
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
      driver:'운전수', sys:'길 위', record:'기록', unknown:'???', 나:'나'
    };
    const comp=D.comps&&D.comps[key], npc=D.npcs&&D.npcs[key];
    const playerName=key==='me'&&typeof S!=='undefined'&&S&&G.myName?G.myName():'나';
    const resolvedManual=(typeof manual[key]==='string'&&manual[key])?manual[key]:normalizeUnknown(key);
    return {
      id:key,
      name:label||(key==='me'?playerName:(comp&&comp.name)||(npc&&npc.name)||resolvedManual),
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
  function dialogueSide(turn,lanes){
    const person=speakerInfo(turn.who,turn.name);
    const key=speakerLaneKey(turn);
    return (lanes&&lanes.get(key))||(playerSpeaker(person.id)?'right':'left');
  }
  function chatMessageHtml(turn, newest=false, side='left'){
    const person=speakerInfo(turn.who,turn.name);
    const mine=playerSpeaker(person.id);
    const hidden=person.name==='???';
    const faceAlt=hidden?'이름을 모르는 사람':person.name;
    const face=person.portrait
      ? `<img class="chat-avatar" src="${person.portrait}" alt="${esc(faceAlt)} 초상" decoding="async">`
      : '';
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
  function storyReaderHtml(turns,index,opt={}){
    const safe=Math.min(Math.max(0,index),Math.max(0,turns.length-1));
    const shown=(turns.length?turns:[{kind:'narration',text:'잠시 말이 끊겼다.'}]).slice(0,safe+1);
    const lanes=opt.lanes instanceof Map?opt.lanes:dialogueLaneMap(turns);
    return `<section class="story-chat story-transcript${opt.intro?' intro-chat':''}" role="group" aria-label="대화 기록">
      ${shown.map((turn,i)=>{
        const newest=i===shown.length-1;
        if(turn.kind==='dialogue') return chatMessageHtml(turn,newest,dialogueSide(turn,lanes));
        if(turn.kind==='narration') return narrationMessageHtml(turn,newest,opt);
        return storyTurnHtml(turn,opt);
      }).join('')}</section>`;
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
      <b>${esc(guide.title)}</b><p>${esc(guide.body)}</p>
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
      const memory=S.driving.recruitMemory;
      const choiceMemory=G.pendingChoiceMemory();
      const route=G.routeStatus();
      const routeCard=route&&!route.complete?`<section class="road-guest-card road-memory-card" aria-label="선택한 노선">
        <div class="road-guest-head"><span class="rg-ico">${route.def.mark}</span><span>
          <small>김천에서 고른 길 · 청주까지 고정</small><b>${esc(route.def.name)}</b></span></div>
        <div class="road-guest-help">${esc(route.def.promise)}</div>
        <div class="road-guest-memory"><b>노선 진행 ${route.done}/${route.total}</b> · 청주에서 두 길이 다시 합쳐진다.</div>
      </section>`:'';
      const guest=def?`<section class="road-guest-card" aria-label="${def.name} 임시 동행">
        <div class="road-guest-head"><span class="rg-ico">${def.guest.ic}</span><span>
          <small>임시 동행 · 아직 손님</small><b>${def.name} — ${def.guest.title}</b></span></div>
        <div class="road-guest-help">${def.guest.desc}</div>
        ${approach?`<div class="road-guest-memory"><b>${approach.label}</b> · ${approach.memory}</div>`:''}
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
      </section>`:'<div class="road-note">차는 계속 달린다. 남은 거리와 탑승 상태는 위 요약에서 바로 확인할 수 있다.</div>';
      p.innerHTML = `
        ${contextRail(to,true)}
        ${journeyGuideHtml()}
        <section class="travel-progress-card" aria-label="현재 주행 진행">
          <div class="journey-section-head"><span><small>ACTIVE ROUTE</small><b>${esc(D.nodes[S.driving.from].name)}에서 ${esc(to.name)}까지</b></span><em>주행 중</em></div>
          <div id="travelbar"></div>
        </section>
        ${routeCard}
        ${guest}`;
      renderTravelbar();
      wireContext(p);
      wireJourneyGuide(p);
      return;
    }
    const n=D.nodes[S.at];
    let localActions='', utilityActions='';
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
      localActions+=`<button class="act primary" data-a="recruitstep" ${!enabled?'disabled':''}>
        <span class="ic">${icon}</span><span><b>${label}</b><small>${small}</small></span></button>`;
    }
    if(n.stl) localActions+=`<button class="act primary" data-a="stl"><span class="ic">🏘</span><span><b>정착지에 들어간다</b><small>거래 · 대화 · 소문</small></span></button>`;
    if(!n.stl && n.type!=='goal'){
      const es=G.exploreStatus();
      const ef=G.exploreForecast(es);
      const label=es.ok?(es.repeat?'남은 곳을 샅샅이 뒤진다':'주변을 탐색한다'):'주변 탐색';
      const small=es.ok
        ?(es.repeat?`최소 4시간 · 피로 약 +15 · 탐색 위험 ${ef.danger} · 오늘의 마지막 탐색`
          :`최소 2시간 · 피로 약 +5 이상 · ${ef.guaranteed} · 탐색 위험 ${ef.danger}`)
        :es.reason;
      localActions+=`<button class="act" data-a="explore" ${es.ok?'':'disabled'}><span class="ic">🔦</span><span><b>${label}</b><small>${small}${es.ok?`<em class="act-forecast">찾을 것 · ${ef.focus}</em>`:''}</small></span></button>`;
    }
    const nbs=G.neighbors(S.at).filter(nb=>S.known.includes(nb.id));
    const routeModels=nbs.map(nb=>({nb,forecast:G.travelForecast(nb.id),fuel:G.fuelFor(nb.km,nb.road)}));
    const viable=routeModels.filter(model=>model.forecast.ok&&!model.forecast.shortage);
    const forward=viable.filter(model=>model.forecast.progressKm>0);
    const recommendationPool=forward.length?forward:viable;
    const safest=[...recommendationPool].sort((a,b)=>b.forecast.safetyScore-a.forecast.safetyScore||b.forecast.progressScore-a.forecast.progressScore)[0]||null;
    const fastest=[...recommendationPool].sort((a,b)=>b.forecast.progressScore-a.forecast.progressScore||b.forecast.safetyScore-a.forecast.safetyScore)[0]||null;
    const supplied=[...recommendationPool].sort((a,b)=>b.forecast.supplyScore-a.forecast.supplyScore||b.forecast.progressScore-a.forecast.progressScore)[0]||null;
    const routeActions=routeModels.map((model,index)=>{
      const {nb,forecast,fuel}=model;
      const t2=D.nodes[nb.id];
      const lack = forecast.shortage;
      const chk=forecast, blocked=!chk.ok;
      const recommendations=[];
      if(model===safest) recommendations.push(['safe','안전']);
      if(model===fastest) recommendations.push(['fast','진행']);
      if(model===supplied&&forecast.supplyScore>=70) recommendations.push(['supply','보급']);
      const isRecommended=recommendations.length>0;
      const note=blocked&&chk.why?esc(chk.why):lack?'연료 부족 주의'
        :forecast.risk&&forecast.risk!=='보통 도로'?esc(forecast.risk):'다음 목적지로 이어지는 길';
      const buttonHint=esc(`${t2.name}로 이동: ${forecast.readinessLabel} ${forecast.readinessScore}점. ${forecast.readinessReason}`);
      return `<button class="act route-option route-${forecast.readinessClass}${lack?' route-low-fuel':''}${isRecommended?' route-recommended':''}${forecast.progressKm<0?' route-backtrack':''}" data-go="${nb.id}" ${blocked?'disabled':''} aria-label="${buttonHint}">
        <span class="route-index"><i>${String(index+1).padStart(2,'0')}</i>${t2.type==='goal'?'⚡':'↗'}</span>
        <span class="route-copy"><span class="route-name"><b>${t2.name}</b><em>${note}</em></span>
        <span class="route-decision"><i class="route-readiness ${forecast.readinessClass}">${forecast.readinessLabel} ${forecast.readinessScore}</i>${recommendations.map(([cls,label])=>`<i class="route-recommend ${cls}">${label} 추천</i>`).join('')}${forecast.gear.length?`<i class="route-gear-count">장비 ${forecast.gear.length}</i>`:''}</span>
        <small class="route-stats"><span>${nb.km}km</span><i>·</i><span>주행 약 ${G.durationLabel(forecast.minutes)}</span><i>·</i><span>연료 약 ${fuel}L</span></small>
        <small class="route-advice"><b>${esc(forecast.directionLabel)}</b> · ${esc(forecast.readinessReason)}</small></span></button>`;
    }).join('');
    if(S.flags.armed_age){
      utilityActions+=`<button class="act" data-a="craft"><span class="ic">🔨</span><span><b>작업대를 편다</b><small>무기·탄 제작 · 약 40분</small></span></button>`;
    }
    if(S.van<S.vanMax-5){
      const hasP=(S.items['부품']||0)>0;
      utilityActions+=`<button class="act" data-a="repair" ${hasP?'':'disabled'}><span class="ic">🔧</span><span><b>달구지를 정비한다</b><small>${hasP?'부품 1 소모 · 내구 +35 · 약 1.5시간':'부품이 없다 — 탐색이나 정비소에서 구하자'}</small></span></button>`;
    }
    if(!S.flags.radio_fixed){ const hasT=(S.items['라디오 진공관']||0)>0;
      utilityActions+=`<button class="act" data-a="radio" ${hasT?'':'disabled'}><span class="ic">📻</span><span><b>라디오를 고친다</b><small>${hasT?'진공관 1 소모 · 주행 중 방송 수신':'라디오 진공관이 필요하다 — 어딘가의 방송국에'}</small></span></button>`; }
    if(S.fuel<5) utilityActions+=`<button class="act" data-a="walkfuel"><span class="ic">🛢</span><span><b>걸어서 연료를 구해온다</b><small>시간과 체력을 크게 소모한다</small></span></button>`;
    const localSection=localActions?`<section class="journey-section local-section">
      <div class="journey-section-head"><span><small>AT THIS STOP</small><b>이곳에서 할 일</b></span><em>${n.stl?'정착지':'현지 행동'}</em></div>
      <div class="acts local-actions">${localActions}</div></section>`:'';
    const routeSection=`<section class="journey-section route-section">
      <div class="journey-section-head"><span><small>CHOOSE THE ROAD</small><b>다음 길을 고른다</b></span><em>${nbs.length}개 경로</em></div>
      <div class="acts route-options">${routeActions||'<div class="route-empty">지금 이어지는 길이 없다.</div>'}</div></section>`;
    const routeRumors=!S.routePlan&&S.stats.km>=70?`<section class="journey-section route-rumor-section">
      <div class="journey-section-head"><span><small>AHEAD AT GIMCHEON</small><b>앞에서 갈라질 두 노선</b></span><em>미리 준비</em></div>
      <p>김천에서 한 길을 고르면 청주까지 바꿀 수 없다. 지금은 필요한 연료와 장비를 준비할 수 있다.</p>
      <div class="route-rumor-grid">${Object.values(D.routePlans||{}).map(def=>{ const forecast=G.routeForecast(def.id); return `<article>
        <span>${def.mark}</span><div><b>${esc(def.name)}</b><p>${esc(def.promise)}</p>
        <small>${forecast.km}km · ${G.durationLabel(forecast.minutes)} · 연료 약 ${forecast.fuel}L · ${forecast.rough?`험로 ${forecast.rough}구간`:`정착지 ${forecast.stops}곳`}</small>
        <small class="route-rumor-reward">도착 계약: ${esc(def.reward||'도착 후 반영')}</small>
        <em class="${forecast.short?'warn':''}">${esc(forecast.readiness)}</em></div></article>`; }).join('')}</div>
    </section>`:'';
    const buildProfile=G.vanBuildProfile();
    const utilitySection=`<section class="journey-section utility-section">
      <div class="journey-section-head"><span><small>VAN & GEAR</small><b>차량과 장비</b></span><em>${esc(buildProfile.name)}</em></div>
      <div class="van-build-summary build-${buildProfile.id}">
        <span class="van-build-rank">${buildProfile.installed}<small>장착</small></span>
        <span><b>${esc(buildProfile.name)} <i class="van-build-tier tier-${buildProfile.tier}">${esc(buildProfile.tierLabel)}</i>${buildProfile.secondary?` · ${esc(buildProfile.secondary)}`:''}</b><small>${esc(buildProfile.summary)}</small>${buildProfile.signature.length?`<em>${buildProfile.signature.map(esc).join(' · ')}</em>`:''}</span>
      </div>
      ${utilityActions?`<div class="acts utility-actions">${utilityActions}</div>`:''}</section>`;
    const h=`${contextRail(n,false)}${journeyGuideHtml()}${localSection}${routeRumors}${routeSection}${utilitySection}`;
    p.innerHTML=h;
    const wf=p.querySelector('[data-a="walkfuel"]'); if(wf) wf.onclick=()=>G.openRescue('nofuel','crisis_nofuel');
    const rp=p.querySelector('[data-a="repair"]'); if(rp) rp.onclick=()=>G.fieldRepair();
    const rd=p.querySelector('[data-a="radio"]'); if(rd) rd.onclick=()=>{ if(G.fixRadio()) renderAll(); };
    const cf=p.querySelector('[data-a="craft"]'); if(cf) cf.onclick=()=>showCraft();
    const rq=p.querySelector('[data-a="recruitstep"]'); if(rq) rq.onclick=()=>G.openRecruitStep();
    wireContext(p);
    wireJourneyGuide(p);
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
    SND.setDriving(true);
    AMBI.depart(S.driving&&S.driving.road); }
  function onArrive(){
    renderAll(); SND.setDriving(false);
    AMBI.arrive(S.at);
    const id=S.at, n=D.nodes[id], key=D.nodeScenes&&D.nodeScenes[id];
    const src=key&&D.scenes&&D.scenes[key];
    const recap=S.lastJourneyRecap;
    toast(`<span class="ic">📍</span>${n.name} 도착`);
    const a=$('#arrival-scene');
    const recapChanges=recap&&recap.changes&&recap.changes.length
      ?recap.changes.slice(0,5).map(change=>`<i class="${change.good?'gain':'cost'}">${esc(change.label)} ${change.value>0?'+':''}${change.value}${esc(change.unit)}</i>`).join('')
      :'<i>자원 변화 없음</i>';
    const contract=recap&&recap.routeContract?`<div class="arrival-contract">
      <small>${esc(recap.routeContract.mark)} ${esc(recap.routeContract.name)} · ${esc(recap.routeProgress)} 구간</small>
      <strong>계약: ${esc(recap.routeContract.promise)}</strong>
      <span>예상 반영: ${recap.routeContract.complete?'청주 합류 보상: ':'계속 진행 보상: '}${esc(recap.routeContract.reward||'다음 정착지와 정착 보급으로 반영')}</span>
    </div>`:'';
    a.innerHTML=`${src?`<img src="${src}" alt="">`:'<div class="arrival-fallback" aria-hidden="true"></div>'}<div class="arrival-copy"><small>ARRIVAL · DAY ${S.day}</small><b>${n.name}</b><span>${n.desc}</span>
      ${recap?`<div class="arrival-ledger" aria-label="방금 주행 정산">
        <div><strong>${esc(D.nodes[recap.from].name)} → ${esc(n.name)}</strong><em>${recap.km}km · ${G.durationLabel(recap.minutes)} · 사건 ${recap.events}건</em></div>
        <div class="arrival-deltas">${recapChanges}</div>
        ${contract}
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
  function toast(html, cls){
    const host=$('#toasts');
    while(host.children.length>=2) host.firstElementChild.remove();
    const t=el('div','toast '+(cls||''), html);
    host.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); }, 3400);
  }

