#!/usr/bin/env node
/*
 * Read-only dialogue inventory and candidate finder.
 * It is deliberately conservative: a hit means "read this in context", not
 * "this was written by AI".
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = __dirname;
const source = fs.readFileSync(path.join(ROOT, 'src/03-data.js'), 'utf8');
const D = new Function(source + '\nreturn D;')();

const companionIds = Object.keys(D.comps || {});
const allFlags = Object.fromEntries([
  'mansu', 'mingyu_reunion', 'deserter_saved', 'core_transfer',
  'core_sleep', 'traces_presented', 'full_crew_testimony',
  ...(D.resistance || []).map(item => item.flag),
  ...(D.eraTraces || []).map(item => item.flag),
].map(flag => [flag, true]));
const states = [
  {day:3, hour:9, party:[], flags:{mansu:0}, wxNext:'clear', comps:{}},
  {day:18, hour:15, party:companionIds.slice(0,3), flags:{...allFlags,mansu:1,core_transfer:false}, wxNext:'rain', comps:{}},
  {day:31, hour:23, party:companionIds, flags:{...allFlags,mansu:3,core_transfer:false,core_sleep:true}, wxNext:'storm', comps:{}},
];

const strip = value => String(value ?? '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const items = [];
const seen = new Set();
function add(scope, id, pathName, kind, speaker, value, variant=''){
  const text = strip(value);
  if(!text) return;
  const key = [scope,id,pathName,kind,speaker,text].join('\u241f');
  if(seen.has(key)) return;
  seen.add(key);
  items.push({scope,id,path:pathName,kind,speaker:speaker||'',variant,text,length:[...text].length});
}
function values(value, label){
  if(typeof value !== 'function') return [{text:value,variant:''}];
  const out = [];
  for(const [index,state] of states.entries()){
    try{
      global.S = state;
      const text = value(state);
      if(typeof text === 'string') out.push({text,variant:`state${index+1}`});
    }catch(error){
      out.push({text:`[동적 평가 실패: ${error.message}]`,variant:`${label}:error`});
    }
  }
  delete global.S;
  return out;
}
function splitVisible(scope,id,pathName,value,variant=''){
  const raw = String(value ?? '');
  const withoutAi = raw.replace(
    /<span\s+class=["'][^"']*(?:ai|ai-voice)[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
    ''
  );
  const quoteRe = /(?:["“]([\s\S]*?)["”]|「([\s\S]*?)」)/g;
  let cursor = 0;
  let match;
  let quoteIndex = 0;
  while((match=quoteRe.exec(withoutAi))){
    const before = withoutAi.slice(cursor,match.index);
    for(const [index,part] of before.split(/\n\s*\n/).entries()){
      add(scope,id,`${pathName}.n${quoteIndex}-${index}`,'narration','',part,variant);
    }
    add(scope,id,`${pathName}.q${quoteIndex}`,'dialogue','event',match[1] ?? match[2],variant);
    quoteIndex++;
    cursor = quoteRe.lastIndex;
  }
  for(const [index,part] of withoutAi.slice(cursor).split(/\n\s*\n/).entries()){
    add(scope,id,`${pathName}.n${quoteIndex}-${index}`,'narration','',part,variant);
  }
}

for(const [pageIndex,page] of (D.intro || []).entries()){
  for(const [turnIndex,turn] of (page.beats || []).entries()){
    add('intro',page.scene,`intro[${pageIndex}].beats[${turnIndex}]`,turn.kind,turn.name||turn.who,turn.text);
  }
}
for(const [chatIndex,chat] of (D.chats || []).entries()){
  for(const [lineIndex,[speaker,text]] of (chat.lines || []).entries()){
    add('chat',`chat-${chatIndex}`,`chats[${chatIndex}].lines[${lineIndex}]`,'dialogue',speaker,text);
  }
}
for(const [index,item] of (D.banter || []).entries()){
  add('banter',`banter-${index}`,`banter[${index}]`,item.who==='sys'?'narration':'dialogue',item.who,item.t);
}
for(const [index,text] of (D.mealBanter || []).entries()){
  add('meal',`meal-${index}`,`mealBanter[${index}]`,'narration','',text);
}
for(const [id,npc] of Object.entries(D.npcs || {})){
  for(const field of ['greet0','greetGood','greetBad']){
    add('npc',id,`npcs.${id}.${field}`,'dialogue',id,npc[field]);
  }
  add('npc',id,`npcs.${id}.rumor.text`,'dialogue',id,npc.rumor&&npc.rumor.text);
}
for(const [index,item] of (D.radioTexts || []).entries()){
  add('radio',`radio-${index}`,`radioTexts[${index}]`,'dialogue','radio',typeof item==='string'?item:item.t);
}

const allEvents = [
  ...(D.events || []),
  ...(D.seoulStops || []),
  ...[D.bridgeEvent,D.gateEvent,D.seoulOpenEvent].filter(Boolean),
];
for(const event of allEvents){
  for(const value of values(event.text,`${event.id}.text`)){
    splitVisible('event',event.id,`${event.id}.text`,value.text,value.variant);
  }
  for(const [choiceIndex,choice] of (event.choices || []).entries()){
    for(const value of values(choice.label,`${event.id}.choices[${choiceIndex}].label`)){
      add('choice',event.id,`${event.id}.choices[${choiceIndex}].label`,'choice','player',value.text,value.variant);
    }
    for(const [outIndex,outcome] of (choice.out || []).entries()){
      for(const value of values(outcome.text,`${event.id}.choices[${choiceIndex}].out[${outIndex}]`)){
        splitVisible('outcome',event.id,`${event.id}.choices[${choiceIndex}].out[${outIndex}]`,value.text,value.variant);
      }
    }
  }
}

const rules = [
  ['S1','stale-setting',/(?<!\d)3\s*년|(?<![가-힣])삼\s*년|정\s*박사|형\(주인공\)/,'폐기된 설정·임시 표기'],
  ['S1','chatbot-scaffold',/(물론입니다|좋은 질문입니다|아래와 같이 정리|도움이 되었으면|필요하시면.{0,20}도와|정확히 보셨습니다)/,'챗봇 답변 흔적'],
  ['S2','translation-connector',/(또한|더 나아가|이를 통해|나아가|결과적으로|전반적으로|궁극적으로|이러한 점에서|이를 바탕으로|이에 따라)/,'번역투 연결어'],
  ['S2','fake-candid',/(솔직히 말하면|사실은|핵심은|정리하면|한마디로 말하면)/,'연극적인 도입어'],
  ['S2','stacked-hedging',/(할 수 있을 것으로 보입니다|영향을 줄 수 있을 것으로 보입니다|구체적인 정보는 제한적이지만|알려진 바는 많지 않지만|확인된 바는 없지만)/,'겹친 완곡·회피'],
  ['S2','business-english',/(인사이트|임팩트|니즈|밸류|퍼포먼스|딜리버리|온보딩|서드 파티|어프로치|커뮤니케이션)/,'맥락 없는 비즈니스 영어'],
  ['S2','passive-formal',/(제공됩니다|진행됩니다|확인됩니다|가능합니다|기대됩니다|구성됩니다|저장됩니다|처리됩니다|개선되었습니다|변경되었습니다|추가되었습니다)/,'수동·가능 표현'],
  ['S3','abstract-nominal',/(효율성|생산성|가능성|안정성|확장성|편의성|중요성|필요성|방향성|전문성|기반으로|중심으로|것입니다|있도록)/,'추상 명사·명사화'],
  ['S3','internal-term',/(KOR-LOCAL|TIANYAN|UPLINK|인과 노드|연산망 연속성|승인 경로|실행 전 인간 확인층)/,'사람 대사 안의 내부·설정 용어'],
  ['S3','decorative-dash',/[—–]/,'대시 중심의 문장 리듬'],
];
const findings = [];
const humanKinds = new Set(['dialogue','choice','letter','record']);
for(const item of items){
  const human = humanKinds.has(item.kind);
  if(human && item.kind==='dialogue' && item.speaker!=='cheollian' && /^\s*\(/.test(item.text)){
    findings.push({...item,severity:'S1',code:'stage-direction-as-speech',match:item.text.slice(0,60),reason:'행동 지문이 인물 대사로 지정됨'});
  }
  for(const [severity,code,re,reason] of rules){
    if(code==='internal-term' && !human) continue;
    if(!human && ['chatbot-scaffold','fake-candid','stacked-hedging','business-english','passive-formal'].includes(code)) continue;
    const match = item.text.match(re);
    if(match) findings.push({...item,severity,code,match:match[0],reason});
  }
  const sentenceCount = item.text.split(/[.!?。]\s*/).filter(Boolean).length;
  if(human && item.length > 135){
    findings.push({...item,severity:'S1',code:'very-long-turn',match:`${item.length}자`,reason:'한 번에 읽기 어려운 인물 발화'});
  }else if(human && item.length > 95){
    findings.push({...item,severity:'S2',code:'long-turn',match:`${item.length}자`,reason:'말풍선 한 호흡이 김'});
  }
  if(human && sentenceCount >= 4){
    findings.push({...item,severity:'S2',code:'many-sentences',match:`${sentenceCount}문장`,reason:'한 턴에 문장이 과도하게 몰림'});
  }
  if(human && /습니다[.!?]?\s*.*(?:해요|돼요|예요|이에요)[.!?]?|(?:해요|돼요|예요|이에요)[.!?]?\s*.*습니다/.test(item.text)){
    findings.push({...item,severity:'S2',code:'register-drift-inline',match:'합니다체↔해요체',reason:'한 발화 안에서 높임말 종결이 흔들림'});
  }
  const commas = (item.text.match(/[,，]/g)||[]).length;
  if(human && item.length > 80 && commas >= 4){
    findings.push({...item,severity:'S3',code:'dense-list-rhythm',match:`쉼표 ${commas}개`,reason:'설명용 나열처럼 들릴 위험'});
  }
}

const exact = new Map();
for(const item of items){
  if(!humanKinds.has(item.kind) || item.length < 12) continue;
  const normalized = item.text.replace(/[“”"'‘’…·,.!?~\s]/g,'');
  if(!exact.has(normalized)) exact.set(normalized,[]);
  exact.get(normalized).push(item);
}
for(const group of exact.values()){
  const ids = new Set(group.map(item=>`${item.scope}/${item.id}`));
  if(ids.size < 2) continue;
  for(const item of group){
    findings.push({...item,severity:'S2',code:'exact-repeat',match:`${ids.size}곳`,reason:'서로 다른 장면에서 같은 대사가 반복됨'});
  }
}

const scopeCounts = items.reduce((out,item)=>{
  out[item.scope]=(out[item.scope]||0)+1;
  return out;
},{});
const speakerStats = {};
for(const item of items){
  if(!humanKinds.has(item.kind) || !item.speaker) continue;
  const stat=speakerStats[item.speaker] ||= {lines:0,chars:0,formal:0,polite:0,casual:0};
  stat.lines++; stat.chars+=item.length;
  if(/(?:습니다|ㅂ니다|입니다|습니까|십시오)[.!?]?$/.test(item.text)) stat.formal++;
  else if(/(?:요|예요|이에요|죠|네요|까요|군요)[.!?]?$/.test(item.text)) stat.polite++;
  else stat.casual++;
}
for(const stat of Object.values(speakerStats)) stat.averageLength=Math.round(stat.chars/stat.lines*10)/10;

const severityCounts = findings.reduce((out,item)=>{
  out[item.severity]=(out[item.severity]||0)+1;
  return out;
},{S1:0,S2:0,S3:0});
const codeCounts = findings.reduce((out,item)=>{
  out[item.code]=(out[item.code]||0)+1;
  return out;
},{});
const summary = {
  generatedAt:new Date().toISOString(),
  inventoryCount:items.length,
  scopeCounts,
  severityCounts,
  codeCounts,
  speakerStats,
};
fs.writeFileSync(path.join(OUT,'inventory.json'),JSON.stringify(items,null,2));
fs.writeFileSync(path.join(OUT,'findings.json'),JSON.stringify(findings,null,2));
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
