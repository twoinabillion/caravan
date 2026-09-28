'use strict';
// Read-only content audit. Does not load UI, saves, servers or the live runtime.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
const root=path.resolve(__dirname,'..');
function audit(){
  const context=vm.createContext({console,clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),setTimeout:()=>0,clearTimeout:()=>{},G:{},rng:()=>0});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const D=vm.runInContext('D',context);
  const overrides={me:'상혁',father:'아빠',mother:'엄마',grandfather:'할아버지',mingyu:'민규',hanbyeol:'한별',seoyeon:'서연',postman:'우편부',mapmaker:'지도장이',intro_child:'도윤 · 8살',player_child:'상혁 · 8살',kimcaptain:'김 선장',hayeosa:'하 여사',sanjigi:'산지기',seojin:'서진',taesik:'태식'};
  const canon=fs.readdirSync(path.join(root,'assets/portraits')).filter(f=>f.endsWith('.png')&&!f.startsWith('passer_')&&!['bori.png','postman-legacy.png'].includes(f)).map(f=>{
    const id=f.slice(0,-4),entry=(D.comps||{})[id]||(D.npcs||{})[id]||{};
    return {id,name:overrides[id]||entry.name||id,group:id==='me'||D.comps[id]?'lead':'named',portrait:'assets/portraits/'+f,role:entry.role||entry.cls||'',identityPolicy:'preserve-canonical'};
  });
  const speakers=[];
  function walk(value,trail,stack=new Set()){
    if(!value||typeof value!=='object'||stack.has(value))return;
    stack.add(value);
    if(typeof value.who==='string'&&value.who.startsWith('passer_'))speakers.push({portrait:value.who,name:value.name||'',path:trail,text:value.text||''});
    for(const [key,child]of Object.entries(value))walk(child,trail+'.'+key,stack);
    stack.delete(value);
  }
  // Audit actual entry containers separately, so shared turn arrays keep their event context.
  for(const ev of permanentEvents(D))walk(ev,'event:'+ev.id);
  for(const key of ['intro','settlements','stls','settlementActivities','campConversations'])if(D[key])walk(D[key],key);
  // Preserve the raw authoring table for lines outside permanent events as well.
  if(D.eventTurnScripts)walk(D.eventTurnScripts,'eventTurnScripts');
  const unique=new Map();
  for(const s of speakers){const key=s.path+'|'+s.portrait+'|'+s.name;if(!unique.has(key))unique.set(key,s);}
  return {schemaVersion:1,scope:'Human reference drafts only; runtime portrait inference and multi-person implicit narration need a separate casting pass.',canonical:canon,explicitGenericSpeakers:[...unique.values()],genericLabels:[...new Set(speakers.map(s=>s.portrait+':'+s.name))].sort(),excluded:[{id:'bori',reason:'개: 사람 원형 범위 밖'},{id:'postman-legacy',reason:'현 정본이 아닌 이전 초상'}]};
}
if(require.main===module)process.stdout.write(JSON.stringify(audit(),null,2)+'\n');
module.exports={audit};
