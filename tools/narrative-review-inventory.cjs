/* Review queue, not a reachability proof or a substitute for reading/visual QA. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
const root=path.resolve(__dirname,'..');
const serialize=value=>JSON.stringify(value,(key,item)=>typeof item==='function'?{$function:item.toString()}:item);
function inventory(){
 const ctx=vm.createContext({console});
 const sources=STATIC_CONTENT_FILES.map(file=>[file,fs.readFileSync(path.join(root,file),'utf8')]);
 for(const [file,text] of sources)vm.runInContext(text,ctx,{filename:file});
 const D=vm.runInContext('D',ctx),rows=[];
 const add=(key,kind,content)=>{
  const authored=serialize(content),dynamic=[];
  const walk=(value,at)=>{
   if(typeof value==='function'){dynamic.push(at);return;}
   if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,`${at}.${k}`);
  };
  walk(content,'content');
  rows.push({key,kind,title:content.title||content.id||key,
   fingerprint:crypto.createHash('sha256').update(authored).digest('hex'),
   status:{contextReading:'unreviewed',branchExecution:'unreviewed',imageContent:'unreviewed',inGameCrop:'unreviewed'},
   dynamicFields:dynamic,content:JSON.parse(authored)});
 };
 for(const event of permanentEvents(D))add(`event:${event.id}`,'event',{
  ...event,registeredEntryScenes:D.eventScenes?.[event.id]||null,
  registeredChoiceScenes:D.eventChoiceScenes?.[event.id]||null,
  registeredTurnScript:D.eventTurnScripts?.[event.id]||null
 });
 (D.intro||[]).forEach((page,i)=>add(`intro:${i}`,'intro',page));
 (D.chats||[]).forEach((chat,i)=>add(`chat:${chat.id||i}`,'chat',chat));
 for(const [cid,chapter] of Object.entries(D.campConversations||{}))add(`camp:${cid}`,'camp',chapter);
 const keys=rows.map(row=>row.key);
 if(new Set(keys).size!==keys.length)throw new Error('Duplicate review keys');
 return {schemaVersion:1,
  limits:['Static authored inventory only; dynamic functions are preserved, not evaluated.',
   'Runtime-generated conversations, engine-resolved gates, saved receipts and image pixels require separate review.',
   'All statuses start unreviewed. Keep evidence separately, keyed by key and fingerprint; a changed fingerprint requires re-review.'],
  sources:sources.map(([file,text])=>({file,sha256:crypto.createHash('sha256').update(text).digest('hex')})),
  counts:rows.reduce((counts,row)=>(counts[row.kind]=(counts[row.kind]||0)+1,counts),{}),rows};
}
module.exports={inventory};
if(require.main===module)console.log(JSON.stringify(inventory(),null,2));
