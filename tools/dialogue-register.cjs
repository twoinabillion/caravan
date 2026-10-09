'use strict';

/* 하오체만 검출한다. 노인의 -게/-나, 지역 사투리, 군인의 보고체와
   천리안의 -십시오는 각자 목소리이므로 일괄 현대화하지 않는다. */
const archaicHumanRegister = /[가-힣]*(?:하오만|하오|이오|아니오|했소|겠소|됐소|있소|없소|않소|받소만|받소|맞소|봤소|왔소|갔소|났소|었소|았소|였소|좋소|알잖소|하시오|주시오|보시오|가시오|오시오|으시오|(?<!십)시오|주리다|그럽디다|습디다|옵디다|봅디다|답디다|줌세)(?=[\s.!?…,”"」]|$)/u;

const {permanentEvents} = require('./content-registry.cjs');
const adultCompanions = new Set(['parkss','kangwoo','leo','jaeyi','eunsu']);
const speakerKey = value => typeof value === 'string' ? value : value && value.who;
const humanQuotes = value => typeof value !== 'string' ? [] : [...value
  .replace(/<span class=["']ai["']>[\s\S]*?<\/span>/g, '')
  .replace(/<[^>]*>/g, '')
  .matchAll(/["“]([^"”\n]+)["”]/g)].map(match => match[1]);

// A narrow regression gate, not a naturalness score. Only a known adult
// addressee and explicit player speech qualify; fragments/reports are allowed.
function hasInformalSentence(text) {
  return String(text).split(/[.!?]+\s*|\n+/).some(sentence => {
    const tail=sentence.trim().replace(/[…”"」]+$/g,'');
    return /(?:[가-힣]*(?:써|줘|봐|해|돼)|[가-힣]+(?:야|어|네|지|자|게|다|데|냐|래|까|나))$/u.test(tail)
      && !/(?:요|죠|니다|시다|십시오|니까)$/u.test(tail);
  });
}

function inspectAdultPlayerRegister(D) {
  const issues=[];
  const check=(scope,text)=>{
    if(hasInformalSentence(text)) issues.push({scope,text});
  };
  for(const event of permanentEvents(D)) {
    if(!adultCompanions.has(event.needsComp)||event.needsComp2) continue;
    const addSpeech=(scope,text,speakers)=>{
      for(const [index,quote] of humanQuotes(text).entries())
        if(speakerKey(speakers?.[index])==='me') {
          if(scope==='es_backdoor.out.0.0'&&index===0) continue;
          check(`${scope}.${index}`,quote);
        }
    };
    addSpeech(`${event.id}.text`,event.text,event.turnSpeakers);
    for(const [ci,choice] of (event.choices||[]).entries()) {
      // These two questions address the AI terminal, not nearby Eunsu.
      const aiQuestion=event.id==='es_backdoor'&&(ci===0||ci===1);
      if(!aiQuestion) for(const quote of humanQuotes(choice.label))
        check(`${event.id}.choice.${ci}`,quote);
      for(const [oi,out] of (choice.out||[]).entries()) {
        addSpeech(`${event.id}.out.${ci}.${oi}`,out.text,out.turnSpeakers);
      }
    }
  }
  for(const chat of D.chats||[]) {
    if(!adultCompanions.has(chat.need?.comp)||chat.need?.comp2) continue;
    for(const [index,[who,text]] of (chat.lines||[]).entries())
      if(who==='me') check(`${chat.id}.${index}`,text);
  }
  // The scene itself need not require a companion: inspect a conditional
  // branch only when its confirmed human speakers are player + that adult.
  for(const event of permanentEvents(D)) {
    if(adultCompanions.has(event.needsComp)||event.needsComp2) continue;
    for(const [ci,choice] of (event.choices||[]).entries()) {
      const adult=choice.req?.comp;
      if(!adultCompanions.has(adult)) continue;
      for(const [oi,out] of (choice.out||[]).entries()) {
        const speakers=(out.turnSpeakers||[]).map(speakerKey);
        if(!speakers.includes('me')||!speakers.includes(adult)
          ||!speakers.every(who=>who==='me'||who===adult)) continue;
        for(const [index,quote] of humanQuotes(out.text).entries())
          if(speakers[index]==='me') check(`${event.id}.out.${ci}.${oi}.${index}`,quote);
      }
    }
  }
  return issues;
}

module.exports = {archaicHumanRegister,hasInformalSentence,inspectAdultPlayerRegister};
