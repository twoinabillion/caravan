'use strict';
// Current 07-ui reader expressions, extracted without loading a game or touching user storage.
const fs=require('node:fs'),path=require('node:path');
const uiPath=path.resolve(__dirname,'../../../../src/07-ui.js');
const entryExpression=`const turns=missionOnly
      ? [{kind:'narration',text:''}]
      : authoredTurns
        ? evd.readingRecord?authoredTurns:prepareEventAudio(authoredTurns,evd)
        : prepareEventAudio(buildStoryTurns(text,evd,{turnSpeakers:D.finaleSpeakers(evd.id,-1,S)||evd.turnSpeakers}),evd);`;
const authoredExpression=`const authoredTurns=Array.isArray(authored)&&authored.length
      ?authored.map(turn=>({...turn,...(turn.who==='me'&&!turn.name?{name:G.myName()}:{} )}))
      :null;`;
const resultExpression=`const turns=Array.isArray(authored)&&authored.length?authored:buildStoryTurns(outcomeText,curEv,{
      knownSpeaker,
      speakers:out.speakers,
      frozenTextOnly:!!out.frozenTextOnly,
      turnSpeakers:out.frozenTextOnly?[]:D.finaleSpeakers(curEv.id,curEv.choices.indexOf(choice),S)||out.turnSpeakers
    });`;
function verify(){const ui=fs.readFileSync(uiPath,'utf8');for(const fragment of [entryExpression,authoredExpression,resultExpression])if(!ui.includes(fragment))throw Error('Current UI reader expression changed');return {entry:true,authored:true,outcome:true};}
exports.verify=verify;
exports.code=()=>{verify();const ui=fs.readFileSync(uiPath,'utf8');
 const readerCode=ui.match(/  const playerSpeaker=.*;/)[0]+ui.slice(ui.indexOf('  function speakerInfo('),ui.indexOf('  function storyDocumentTitle('))+ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  const ICO='));
 const sceneCode=ui.match(/  const stripTags=.*;/)[0]+ui.slice(ui.indexOf('  function eventSceneKeys('),ui.indexOf('  function sceneFormat('))+';globalThis.qaSceneKeys=eventSceneKeys;';
 return readerCode+sceneCode+`globalThis.qaNamed=turns=>turns.map(t=>({...t,displayName:['dialogue','radio','ai','thought'].includes(t.kind)?speakerInfo(t.who,t.name).name:null}));
 globalThis.qaAuthorEntry=evd=>{const missionOnly=evd.id==='onboarding_main_mission';const authored=typeof evd.turns==='function'?evd.turns(S):evd.turns;const text=S.pendingPresentation?.eventId===evd.id&&S.pendingPresentation.phase==='event'?S.pendingPresentation.text:typeof evd.text==='function'?evd.text(S):evd.text;${authoredExpression}${entryExpression}return turns;};globalThis.qaEntry=qaAuthorEntry;
 globalThis.qaResult=(evd,choice,out,opt={})=>{const curEv=evd,outcomeText=typeof out.text==='function'?out.text(S):out.text,knownSpeaker=!!opt.knownSpeaker;const authored=out.frozenTextOnly?null:typeof out.turns==='function'?out.turns(S):out.turns;${resultExpression}return turns;};`;
};
