const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle24/story/repair25');
const {setup,open,choose,state,frozen}=require(dir+'/setup.cjs');
const before=require(dir+'/before.json'),legacy=require(dir+'/legacy.json');
const matrix=require(dir+'/../copy-proposal25/comparison.json').road.matrix;
const neutral=s=>s.replace(/^(맑음|비|폭풍|안개|황사) 뒤 /,'');
const namedEntry=turns=>turns.map(t=>t.kind==='dialogue'&&t.name==='???'?(({speakerUncertain,...rest})=>({...rest,name:'정착지에서 온 사람'}))(t):t);
const newLine='민지 양, 밥 제대로 안 먹었지.';
test('exactly the approved meal line and road-echo prefix change; owned definitions retain all other content and mechanics',()=>{
 const h=setup(),chat=h.json("D.chats.find(c=>c.id==='daily-minji-parkss-meal')");assert.equal(chat.lines[0][1],newLine);chat.lines[0][1]=before.chat.lines[0][1];assert.deepEqual(chat,before.chat);
 const expected=before.echoFunction.replace("  const wx=D.wx&&D.wx[echo.wx]&&D.wx[echo.wx].nm;\n",'').replace("${wx?wx+' 뒤 ':''}갓길에서",'갓길에서');
 assert.notEqual(expected,before.echoFunction);assert.equal(h.run('D.roadEchoCopy.toString()'),expected);
 const actual=h.json("JSON.parse(JSON.stringify(event('settlement_road_echo'),(k,v)=>typeof v==='function'?v.toString():v))");assert.deepEqual(actual.turnSpeakers,[{who:'passer_refugee',name:'정착지에서 온 사람'}]);delete actual.turnSpeakers;assert.deepEqual(actual,before.event);
});
for(const min of [534.3,720,1245.7])test(`meal at ${min}: current meal wording, unchanged role/relation/stamp, reload and next-day policy`,()=>{
 const values=[];
 for(const source of [frozen,undefined]){
  const h=setup(source);h.run(`S.party=['minji','parkss'];S.day=9;S.min=${min};S._crewChatSeen={};D.chats=[D.chats.find(c=>c.id==='daily-minji-parkss-meal')];globalThis.chat=G.pickChat();`);
  assert.equal(h.run('chat.id'),before.chat.id);const selected=h.json('chat'),paid=state(h);
  assert(h.run('G.load()'));assert.deepEqual(state(h),paid);assert.equal(h.run('G.pickChat()'),null);
  h.run('S.day++;globalThis.nextDay=G.pickChat()');assert.equal(h.run('nextDay.id'),before.chat.id);
  values.push({selected,paid,nextDayState:state(h)});
 }
 assert.equal(values[1].selected.lines[0][1],newLine);values[1].selected.lines[0][1]=before.chat.lines[0][1];assert.deepEqual(values[1],values[0]);
});
test('all 22 weather/legacy states retain title, outcome and state while the new entry has no unsupported weather transition',()=>{
 const h=setup(),old=setup(frozen);
 for(const row of matrix){
  for(const env of [h,old])env.run(`S._impactEcho=${JSON.stringify(row.echo)};S.weather='storm';`);
  const initial=state(h);
  for(const phase of ['title','text','outcome']){
   const value=h.run(`D.roadEchoCopy(S,'${phase}')`),previous=old.run(`D.roadEchoCopy(S,'${phase}')`);
   assert.equal(value,phase==='text'?neutral(previous):previous,`${row.identity}/${row.weather}/${phase}`);
  }
  assert.deepEqual(state(h),initial);
 }
});
for(let ci=0;ci<3;ci++)test(`choice ${ci}, all 22 states: new actual entry reader, unchanged result/notes/effects and entry/paid reload`,()=>{
 for(const row of matrix){
  const h=open(setup(),row.echo),old=open(setup(frozen),row.echo),entry=h.json('et');
  assert.deepEqual(entry,namedEntry(old.json('et').map(t=>({...t,text:neutral(t.text)}))),`${row.identity}/${row.weather}`);
  const entryState=state(h);assert(h.run('G.load()'));assert.deepEqual(h.json('entryTurns(e)'),entry);assert.deepEqual(state(h),entryState);
  const result=choose(h,ci),previous=choose(old,ci);assert(result.ok&&result.applied);assert.deepEqual(result,previous);assert.deepEqual(state(h),state(old));
  const paid=state(h);assert(h.run('G.load()'));const replay=choose(h,ci);assert.equal(replay.applied,false);assert.deepEqual(replay.turns,result.turns);assert.equal(replay.text,result.text);assert.deepEqual(state(h),paid);
 }
});
test('normal frozen24 unpaid entry retains its saved words through load and all three next choices',()=>{
 const raw=fs.readFileSync(path.join(dir,'../agent03/attempt01/normal-unpaid-487-settlement_road_echo.json'),'utf8');
 for(let ci=0;ci<3;ci++){
  const values=[];
  for(const source of [frozen,undefined]){const h=setup(source);assert(h.run(`G.load(${JSON.stringify(raw)})`));h.run("G.save();globalThis.e=event('settlement_road_echo'),et=entryTurns(e)");const entry=h.json('et'),initial=state(h);assert(h.run('G.load()'));assert.deepEqual(state(h),initial);values.push({entry,result:choose(h,ci),state:state(h)});}
  values[0].entry=namedEntry(values[0].entry);assert.deepEqual(values[1],values[0]);assert.match(values[1].entry[0].text,/맑음 뒤/);
 }
});
for(const textOnly of [false,true])test(`frozen24 all paid ${textOnly?'text-only':'saved-reader'} records retain old text and never repay`,()=>{
 for(const row of legacy){
  const raw=JSON.parse(fs.readFileSync(path.join(dir,row.file)));if(textOnly){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;}
  const values=[];
  for(const source of [frozen,undefined]){
   const h=setup(source);assert(h.run(`G.load(${JSON.stringify(JSON.stringify(raw))})`));h.run("globalThis.e=event('settlement_road_echo'),et={knownSpeaker:false}");const initial=state(h),result=choose(h,row.i);assert.equal(result.applied,false);assert.equal(result.text,row.result.text);assert.deepEqual(state(h),initial);if(textOnly)assert(result.frozenTextOnly);values.push(result);
  }
  assert.deepEqual(values[1],values[0]);
 }
});
