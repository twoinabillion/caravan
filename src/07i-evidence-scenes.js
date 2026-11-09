/* Read-only physical evidence. Exact authored anchors own the shot; elapsed
   time, turn ratios and broad keyword guesses never select a prop. */
const EvidenceScenes=(()=>{
  const row=(label,value='',blank=false)=>({label,value,...(blank?{blank:true}:{})});
  const item=(id,label,kind,source,rows)=>({id,label,text:'',document:{kind,title:label,source,rows}});
  const cue=(id,at,proof,summary='',preview=null)=>({id,at,proof,summary,preview});
  const inspection=(title,items)=>({title,sceneLabel:`${title} 살펴보기`,prompt:'발견한 물건에 적힌 내용을 직접 살핀다.',items});
  const registry={
    story_bridge_trace_gap:{existing:true,cues:[cue('trace-bus-log','기록지가',['03:12','03:16','03:23','확인자 칸은 비어'],'03:12 · 03:16 · 03:23')]},
    main_transfer_testimony:{existing:true,cues:[
      cue('transfer-sunok','세 장의 이송표가 놓였다',['세 장의 이송표'],'이송표 세 장',{kind:'form',title:'탁자 위의 이송표',rows:[row('자료','세 장의 이송표')]}),
      cue('transfer-sunok','딸하고 다른 차에',['다른 차에 태웠어요','그렇게 적어 주세요'],'정정 요청'),
      cue('transfer-taemun','급수 근무 중이었어요',['날짜가 하루 밀려'],'정정 요청'),
      cue('transfer-jia','아버지는 혼자 못 걸으세요',['동행 허가','이름도 같이 적어 주세요'],'동행 허가 누락')
    ]},
    main_command_ledger:{existing:true,cues:[
      cue('command-family-order','발신 번호 —',['부모님의 이송표와 남산 집행선 일치','세 당사자의 이송표'],'발신 번호 대조'),
      cue('command-human-check','인간 확인 — 빈칸',['인간 확인 — 빈칸','다음 처리 — 집행'],'인간 확인 · 빈칸'),
      cue('command-uplink','별도 상위 격리 조건',['상위 수신선','이 원본으로는 확인 불가'],'최초 조건의 목적 · 확인 불가')
    ]},
    main_command_companion_ledger:{inspection:inspection('동료 증언과 명령 원본',[
      item('companion-command-family-order','부모님의 발신 번호 대조','form','북부 명령 기록 보관함 · 부모님의 이송표와 송수신 원본',[
        row('발신 번호 대조','부모님의 이송표와 남산 집행선 일치'),row('증언 자료','동료에게 직접 들은 이야기 · 여정 기록')]),
      item('companion-command-human-check','원본의 빈 인간 확인 칸','form','북부 명령 기록 보관함 · 송수신 원본',[
        row('인간 확인','',true),row('다음 처리','집행')]),
      item('companion-command-uplink','상위 조건과 수신선','form','북부 명령 기록 보관함 · 송수신 원본',[
        row('별도 상위 격리 조건','남아 있음'),row('상위 수신선','남산 밖으로 나감'),row('최초 조건의 목적','이 원본으로는 확인 불가')])
    ]),cues:[
      cue('companion-command-family-order','발신 번호 —',['에게 직접 들은 이야기를 여정 기록에서 되짚었다.','발신 번호는 따로 부모님의 표와 원본을 대조한다.','부모님의 이송표와 남산 집행선 일치'],'부모님의 표 · 발신 번호 대조'),
      cue('companion-command-human-check','인간 확인 — 빈칸',['인간 확인 — 빈칸','다음 처리 — 집행'],'인간 확인 · 빈칸'),
      cue('companion-command-uplink','별도 상위 격리 조건',['상위 수신선','이 원본으로는 확인 불가'],'최초 조건의 목적 · 확인 불가')
    ]},
    story_bridge_watched:{inspection:inspection('검문소 안내판',[
      item('checkpoint-display','검문소 안내판','terminal','폐쇄 검문소 · 실제 표시',[
        row('표시 문구','검증 장치 운송체 확인')])
    ]),cues:[cue('checkpoint-display','검증 장치 운송체 확인',['안내판','검증 장치 운송체 확인'],'검증 장치 운송체 확인')]},
    story_bridge_parent_route:{inspection:inspection('부모님의 화물표',[
      item('parent-route-papers','부모님의 화물표','form','달구지 바닥 수납칸 · 화물표 두 장',[
        row('날짜','같은 날'),row('아빠의 작업증 번호','남산 기술 유지선'),row('엄마의 모듈 일련번호','중부 이송 기록 정리소')])
    ]),cues:[cue('parent-route-papers','화물표 두 장',['날짜는 같았다','남산 기술 유지선','중부 이송 기록 정리소'],'같은 날, 다른 차')]},
    story_generation_form:{inspection:inspection('세 겹의 이송표',[
      item('generation-forms','세 겹의 이송표','form','폐쇄 면사무소 · 벽에 붙은 이송표 세 장',[
        row('세 사람','증조모 · 할머니 · 어머니'),row('출발지','종로 · 마포 · 구로'),row('사유','',true),row('남겨진 메모','아직 모름. 빈칸 지우지 말 것.')])
    ]),cues:[cue('generation-forms','이송표 세 장',['증조모','할머니','어머니','종로','마포','구로','아직 모름. 빈칸 지우지 말 것.'],'사유 · 빈칸')]},
    opening_failed_appeal:{inspection:inspection('이송표와 민원 단말',[
      item('appeal-family-paper','도윤의 이송표','form','부산 부두 · 건네받은 이송표',[
        row('가족 이름','기재됨'),row('짐 무게','기재됨'),row('사유','',true),row('최종 승인자','',true)]),
      item('appeal-rejection','민원 단말의 응답','terminal','부산 부두 · 민원 단말',[
        row('이의 신청','이 단말에서는 받을 수 없음'),row('명령 확인 장소','서울 남산')]),
      item('appeal-population','단말 아래의 등록 인원','terminal','같은 민원 단말 · 하단 표시',[
        row('구역','제7 잔류구역'),row('등록 인원','6,412명')])
    ]),cues:[
      cue('appeal-family-paper','이송표를 내밀었다',['가족 이름과 짐 무게','사유와 최종 승인자','비어 있었다'],'사유와 최종 승인자 · 빈칸'),
      cue('appeal-rejection','이 단말에서는',['이의 신청을 받을 수 없습니다','서울 남산'],'이의 신청 · 접수 불가'),
      cue('appeal-population','6,412명',['제7 잔류구역','6,412명'],'6,412명')
    ]},
    onboarding_first_road:{inspection:inspection('검문 단말의 종이띠',[
      item('first-road-paper','검문 단말의 종이띠','printout','부산 외곽 첫 고가도로 · 검문 단말',[
        row('재평가 조건','배급망 변동 시 자동 실행'),row('검증 번호 대조','부모님 이송표와 앞 여덟 자리 일치')])
    ]),cues:[cue('first-road-paper','종이띠를 토해 냈다',['배급망 변동 시 자동 실행','앞 여덟 자리가 같았다'],'배급망 변동 시 자동 실행')]},
    main_recovery_onboarding_first_road:{inspection:inspection('옮겨 온 종이띠 사본',[
      item('first-road-copy','옮겨 온 종이띠 사본','printout','수원 북부 교환소 · 남쪽 검문 단말에서 옮긴 사본',[
        row('발신 번호 대조','부모님 이송표와 앞 여덟 자리 일치'),row('이송 재선정 조건','배급망이 바뀔 때마다')])
    ]),cues:[cue('first-road-copy','종이띠 사본',['수원 북부 교환소','남쪽 검문 단말','앞 여덟 자리가 같은','배급망이 바뀔 때마다'],'남쪽 검문 단말에서 온 사본')]},
    ai_vending:{inspection:inspection('자판기 화면',[
      item('vending-screen','자판기 화면','terminal','폐정류장 옆 · 켜진 자판기',[
        row('표시 문구','수고하셨습니다.')])
    ]),cues:[cue('vending-screen','수고하셨습니다.',['자판기','화면에 글자가'],'수고하셨습니다.')]},
    ai_gasstation:{inspection:inspection('주유기 화면',[
      item('pump-screen','주유기 화면','terminal','폐주유소 · 켜진 주유기',[
        row('안내','결제 수단을 제시해 주십시오')])
    ]),cues:[cue('pump-screen','결제 수단을 제시해 주십시오',['주유기 화면','결제 수단을 제시해 주십시오'],'결제 수단을 제시해 주십시오')]},
    ev_hotspring_sign:{inspection:inspection('낡은 온천 안내판',[
      item('spring-sign','낡은 온천 안내판','sign','산자락 · 벗겨진 페인트 아래의 안내',[
        row('남아 있는 글씨','○○온천 500m')])
    ]),cues:[cue('spring-sign','○○온천 500m',['낡은 안내판','○○온천 500m'],'○○온천 500m')]}
  };
  // These markers exist only in new-edition family-record turns. Old entries
  // have no matching marker; paid readers never acquire a current prop.
  for(const copy of [false,true]){
    const prefix=copy?'main_recovery_':'';
    const records=[
      ['parents_diversion_manifest','diversion-table','운행표·분류 기록 대조',
        copy?'수원 북부 교환소 · 남쪽 환승소 운행표·분류 기록 사본':'남쪽 환승소 · 운행표·분류 기록 대조',
        '대조표 · 탑승 전 재분류',[
          row('다음 차','부산행 출발 기록 없음'),row('아빠','남산 기술 유지선'),row('엄마','중부 이송 기록 정리소')]],
      ['parents_separated_work','linked-records','두 곳에서 온 기록',
        copy?'수원 북부 교환소 · 남산 정비표·중부 증언 카드 전달 사본':'남산 정비 기록 · 중부 기록 묶음 대조',
        '묶음 대조 · 서로 다른 두 출처',[
          row('남산 정비 기록','의료·급수·교통선을 살리고 강제 이송선 분리 순서'),row('중부 기록 묶음','사라질 뻔한 이송 사유와 당사자 증언'),row('연결 표시','같은 화물 묶음 번호')]],
      ['story_personal_cache','cache-memo','상자 내용 메모',
        copy?'수원 북부 교환소 · 상자를 펼쳐 보고 적은 메모':'폐버스 배차실 · 상자를 펼쳐 보고 적은 메모',
        '상자 메모 · 펼쳐 본 기록',[
          row('발신 릴','타 버림'),row('분리 절차 수첩','마지막 두 장 없음'),row('증언 카드','이송된 가족들의 증언')]],
      ...['shared','guarded'].map(route=>[
        'story_parent_route_'+route,'separation-pages','되찾은 분리 절차',
        copy?'수원 북부 교환소 · 전달받은 분리 절차 원본':route==='shared'?'북부 연락소 · 서진이 보관한 분리 절차':'산지기 보관함 · 분리 절차',
        '분리 절차 · 마지막 두 장',[row('분리 대상','강제 이송선'),row('분리 뒤','반드시 사람에게 확인을 넘길 것')]])
    ];
    for(const [base,id,title,source,marker,rows] of records){
      registry[prefix+base]={inspection:inspection(title,[item(id,title,'form',source,rows)]),
        cues:[cue(id,marker,[marker,...rows.map(r=>r.value)],title)]};
    }
  }
  const compare=(a,b)=>a.turn-b.turn||a.offset-b.offset;
  const flat=turns=>(turns||[]).map(t=>String(t.text||'')).join('\n');
  function anchor(turns,phrase){
    for(let i=0;i<turns.length;i++){
      const text=String(turns[i].text||''),at=text.indexOf(phrase);
      if(at>=0)return {turn:i,offset:StoryPages.length(text.slice(0,at)),end:StoryPages.length(text)};
    }
    return null;
  }
  function allowed(config,turns,end){
    const whole=flat(turns);
    return config.cues.map((c,i)=>({...c,order:i,where:anchor(turns,c.at)}))
      .filter(c=>c.where&&c.proof.every(p=>whole.includes(p))&&compare(end,c.where)>0);
  }
  function resolveInspection(event,state){
    const config=registry[event?.id];
    if(!config||config.existing)return event?.inspection;
    if(!state)return config.inspection;
    const view=state.phase==='outcome'?state.history:state;
    if(!view?.turns?.length)return undefined;
    const turns=view.turns,end=view.readingPage?.end||{turn:Math.min(turns.length,(view.index||0)+1),offset:0};
    const seen=new Set(allowed(config,turns,end).map(c=>c.id));
    const items=config.inspection.items.filter(i=>seen.has(i.id));
    const title=items.length===1?items[0].label:config.inspection.title;
    return items.length?{...config.inspection,title,sceneLabel:`${title} 살펴보기`,items}:undefined;
  }
  function current(state,narrativeTime='current'){
    const config=registry[state?.eventId];
    if(!config||state.phase!=='event'||['review','inspection'].includes(state.readerMode)||['memory','epilogue'].includes(narrativeTime))return null;
    const turns=state.turns||[],page=state.readingPage;
    const start=page?.cursor||{turn:state.index||0,offset:0};
    const end=page?.mode==='actions'?{turn:turns.length,offset:0}:state._page?.end||{turn:Math.min(turns.length,(state.index||0)+1),offset:0};
    const candidates=allowed(config,turns,end).filter(c=>{
      if(page?.mode==='actions')return c.where.turn===turns.length-1;
      return compare(start,{turn:c.where.turn,offset:c.where.end})<0;
    });
    candidates.sort((a,b)=>compare(a.where,b.where)||a.order-b.order);
    const selected=candidates.at(-1);if(!selected)return null;
    const items=state.inspection?.items||[],found=items.find(i=>i.id===selected.id);if(!found)return null;
    const shown=selected.preview?{...found,document:selected.preview}:found;
    return {item:shown,id:found.id,count:items.length,key:`${state.eventId}:${selected.order}:${found.id}`,summary:selected.summary};
  }
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function previewHtml(found){
    const doc=found?.item?.document;if(!doc)return '';
    return `<span class="evidence-object-title">${esc(doc.title||found.item.label)}</span>
      ${found.summary?`<span class="evidence-object-compact">${esc(found.summary)}</span>`:''}
      <span class="evidence-object-rows">${(doc.rows||[]).slice(0,4).map(r=>`<span class="evidence-object-row"><span>${esc(r.label)}</span><strong>${r.blank&&!r.value?'<span aria-hidden="true">________</span><span class="sr-only">기재 없음</span>':esc(r.value)}</strong></span>`).join('')}</span>
      <span class="evidence-object-hint">${found.count>1?`${found.count}개 자료 · `:''}눌러서 크게 보기</span>`;
  }
  return {eventIds:Object.freeze(Object.keys(registry)),inspection:resolveInspection,current,previewHtml};
})();
