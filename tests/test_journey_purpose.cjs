const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
function setup(){
 const store=new Map(),c=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},UI:{toast(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
 for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),c);
 for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+f,'utf8'),c);
 const run=s=>vm.runInContext(s,c);run("G.newGame('onroad','다온','full','keeper')");return run;
}
test('every place has its own concise factual preview without rewards or mutations',()=>{
 const run=setup();assert.equal(run('Object.keys(D.destinationPreviews||{}).length'),run('Object.keys(D.nodes).length'));
 assert.equal(run('new Set(Object.values(D.destinationPreviews)).size'),run('Object.keys(D.nodes).length'));
 assert.equal(run('Object.values(D.destinationPreviews).every(s=>s.length<=30&&!/보상|획득|확정|안전|반드시/.test(s))'),true);
});
test('opening purpose expires on actual evidence and only the recommended edge inherits route purpose',()=>{
 const run=setup();assert.match(run("G.destinationPurpose('yangsan')"),/발신 흔적/);
 assert.equal(run("G.destinationPurpose('gimhae')"),'');
 run('S.flags.first_order_trace=true');assert.doesNotMatch(run("G.destinationPurpose('yangsan')"),/발신 흔적/);
});
for(const id of ['minji','parkss','kangwoo','leo','jaeyi','eunsu'])test(`${id} guidance follows real recruitment stages across reload`,()=>{
 const run=setup();run(`S.at='ulsan';S.day=3;S.recruitQ={id:'${id}',stage:'task',target:'ulsan'};G.ensureQuestLedger().tracked=['companion_${id}']`);
 assert.match(run('G.companionQuestEntries().find(e=>e.status===\'active\').next'),/부탁/);
 run("S.recruitQ.stage='road';G.save();G.load()");
 assert.match(run('G.questObjectivePlan().action'),/한 구간/);
 assert.doesNotMatch(run('G.companionQuestEntries().find(e=>e.status===\'active\').next'),/부탁한 일을/);
 run("S.recruitQ.stage='follow';S.recruitQ.roadDay=3");assert.match(run('G.questObjectivePlan().action'),/하룻밤/);
 run('S.day=4');assert.match(run('G.questObjectivePlan().action'),/합류/);
 run("S.recruitQ.stage='ready'");assert.match(run('G.questObjectivePlan().action'),/합류/);
});
test('all known graph edges stay concise; hidden destinations reveal no objective and rendering spends nothing',()=>{
 const run=setup();
 const rows=run(`(()=>{const out=[];for(const at of Object.keys(D.nodes)){
  S.at=at;S.driving=null;const before=JSON.stringify([S.fuel,S.water,S.food,S.van,S.scrap,S.min,S.day,S.flags]);
  for(const nb of G.neighbors(at)){const t=G.destinationPurpose(nb.id);out.push({at,to:nb.id,t,known:S.known.includes(nb.id)});}
  if(before!==JSON.stringify([S.fuel,S.water,S.food,S.van,S.scrap,S.min,S.day,S.flags]))throw Error('mutation');
 }return out})()`);
 assert.equal(rows.length,156);
 for(const r of rows){assert(r.t.length<=30,JSON.stringify(r));if(!r.known)assert.equal(r.t,'');}
});
test('corridor guidance names the release waypoint rather than promising the final task at the next stop',()=>{
 for(const corridor of ['ridge','market']){
  const run=setup();run(`S.at='gimcheon';S.recruitQ={id:'parkss',stage:'task',target:'gumi'};G.ensureQuestLedger().tracked=['companion_parkss'];G.chooseRoute('${corridor}')`);
  const text=run('G.destinationPurpose(G.questPreferredNeighbor(G.neighbors(S.at).map(nb=>({nb}))).nb.id)');
  assert.match(text,/청주/);assert.doesNotMatch(text,/부탁한 일을 함께할 곳/);
 }
});
test('road-stage guest never advertises joining at the upcoming stop',()=>{
 const run=setup();run("S.at=null;S.driving={from:'ulsan',to:'gyeongju'};S.recruitQ={id:'minji',stage:'road',target:'ulsan'};G.ensureQuestLedger().tracked=['companion_minji']");
 assert.match(run("G.destinationPurpose('gyeongju')"),/한 구간/);assert.doesNotMatch(run("G.destinationPurpose('gyeongju')"),/합류/);
});
test('a follow-up guest driving away from the meeting does not promise joining at the next wrong stop',()=>{
 const run=setup();run("S.at=null;S.day=4;S.driving={from:'gyeongju',to:'daegu'};S.recruitQ={id:'minji',stage:'follow',target:'gyeongju',roadDay:3}");
 assert.match(run('G.recruitNextAction()'),/경주/);assert.doesNotMatch(run('G.recruitNextAction()'),/정차한 뒤.*합류/);
 run("S.driving={from:'daegu',to:'gyeongju'}");assert.match(run('G.recruitNextAction()'),/정차한 뒤.*합류/);
});
test('a deferred ready guest can discuss joining here without being routed back to an old task',()=>{
 const run=setup();run("S.at='daegu';S.recruitQ={id:'minji',stage:'ready',target:'gyeongju'};G.ensureQuestLedger().tracked=['companion_minji'];G.openEventById=id=>{globalThis.opened=id}");
 assert.equal(run('G.questObjectivePlan().target'),'daegu');assert.equal(run('G.openRecruitStep()'),true);assert.equal(run('opened'),'rq_minji_join');
 assert.equal(run('G.questPreferredNeighbor(G.neighbors(S.at).map(nb=>({nb})))'),null);
});
test('arrival at the corridor release waypoint never claims that the distant task happens there',()=>{
 for(const corridor of ['ridge','market']){
  const run=setup();run(`S.at='gimcheon';S.recruitQ={id:'parkss',stage:'task',target:'gumi'};G.ensureQuestLedger().tracked=['companion_parkss'];G.chooseRoute('${corridor}');S.at=D.routePlans['${corridor}'].corridor.at(-2)`);
  const text=run("G.destinationPurpose('cheongju')");assert.match(text,/구미/);assert.doesNotMatch(text,/부탁한 일을 함께할 곳/);
 }
});
