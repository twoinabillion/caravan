'use strict';
// Read the real reader's turns in isolation. No game, save or audio is changed.
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
function voicePlan(){
  const context=vm.createContext({console,introPreview:false,
    S:{party:[],flags:{},comps:{}},G:{myName:()=> '검수 이름'}});
  const fingerprint=createHash('sha256');
  for(const file of STATIC_CONTENT_FILES){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    fingerprint.update(file+'\0'+source+'\0');vm.runInContext(source,context);
  }
  const ui=fs.readFileSync(path.join(root,'src/07-ui.js'),'utf8');
  fingerprint.update('src/07-ui.js\0'+ui);
  vm.runInContext(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')),context);
  const data=vm.runInContext('D',context), clips=new Map();
  for(const id of ['exp_glasshouse','ai_census','ai_manifest']){
    const event=data.events.find(e=>e.id===id);
    for(const dog of [false,true])for(const postman_met of [false,true]){
      context.S={party:['eunsu'],flags:{postman_met},comps:{},dog};
      const sections=[{phase:'entry',value:event.text,speakers:event.turnSpeakers}];
      event.choices.forEach((c,choice)=>c.out.forEach((out,outcome)=>
        sections.push({phase:'result',choice,outcome,value:out.text,speakers:out.turnSpeakers})));
      for(const section of sections){
        const value=typeof section.value==='function'?section.value(context.S):section.value;
        const turns=context.buildStoryTurns(value,event,{turnSpeakers:section.speakers});
        turns.forEach((turn,index)=>{
          if(turn.kind!=='radio'||!(turn.who==='cheollian'||
            (id==='exp_glasshouse'&&turn.name==='온실 안내음')))return;
          const text=turn.text;
          if(!clips.has(text))clips.set(text,{id:'cheollian_event_'+String(clips.size+1).padStart(2,'0'),text,routes:[]});
          clips.get(text).routes.push({event:id,phase:section.phase,choice:section.choice,
            outcome:section.outcome,turn:index,who:turn.who,kind:turn.kind,when:{dog,postman_met}});
        });
      }
    }
  }
  return {provider:'ElevenLabs',source_sha256:fingerprint.digest('hex'),game_wired:false,
    sample_id:[...clips.values()].find(c=>c.routes.some(r=>r.event==='ai_census'&&r.phase==='entry'))?.id,
    settings:{model_id:'eleven_multilingual_v2',output_format:'mp3_44100_128',
      voice_settings:{speed:0.9,stability:0.5,similarity_boost:0.75,style:0,use_speaker_boost:true},
      provenance:'Legacy source filenames sp90_s50_sb75_se0_b_m2; voice identity still requires audition.'},
    excluded:[{event:'ai_vending',reason:'Screen writing, not an authored spoken turn.'},
      {event:'ai_gasstation',reason:'Screen writing, not an authored spoken turn.'},
      {event:'seoul_gate',reason:'Dynamic electronic sign; do not invent a spoken announcement or use the retired line.'}],
    clips:[...clips.values()]};
}
module.exports={voicePlan};
if(require.main===module)process.stdout.write(JSON.stringify(voicePlan(),null,2)+'\n');
