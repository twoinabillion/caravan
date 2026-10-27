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
globalThis.qaNamed=turns=>turns.map(t=>({...t,displayName:['dialogue','radio','ai','thought'].includes(t.kind)?speakerInfo(t.who,t.name).name:null}));globalThis.qaEntry=evd=>{const authored=typeof evd.turns==='function'?evd.turns(S):evd.turns;const text=S.pendingPresentation?.eventId===evd.id&&S.pendingPresentation.phase==='event'?S.pendingPresentation.text:typeof evd.text==='function'?evd.text(S):evd.text;return Array.isArray(authored)&&authored.length?authored.map(t=>({...t,...(t.who==='me'&&!t.name?{name:G.myName()}:{} )})):prepareEventAudio(buildStoryTurns(text,evd,{turnSpeakers:D.finaleSpeakers(evd.id,-1,S)||evd.turnSpeakers}),evd);};globalThis.qaResult=(evd,choice,out,opt={})=>{const authored=out.frozenTextOnly?null:typeof out.turns==='function'?out.turns(S):out.turns;return Array.isArray(authored)&&authored.length?authored:buildStoryTurns(typeof out.text==='function'?out.text(S):out.text,evd,{knownSpeaker:!!opt.knownSpeaker,speakers:out.speakers,frozenTextOnly:!!out.frozenTextOnly,turnSpeakers:out.frozenTextOnly?[]:D.finaleSpeakers(evd.id,evd.choices.indexOf(choice),S)||out.turnSpeakers});};