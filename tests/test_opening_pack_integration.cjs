/* Isolated real engine/helpers, not the user's browser, layout or storage. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const read=file=>fs.readFileSync(file,'utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function engine(){
 const store=new Map(),ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
  setTimeout:()=>0,clearTimeout(){},UI:{},localStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,String(v)),removeItem:key=>store.delete(key)}});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(read(file),ctx,{filename:file});
 for(const file of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(read('src/'+file),ctx,{filename:file});
 return {ctx,store,run:code=>vm.runInContext(code,ctx)};
}
test('new bundles use approved base plus exactly one pack for every entry mode',()=>{
 const {run}=engine();
 for(const mode of ['interactive','full','summary','skip'])for(const id of ['fuel','repair','provisions']){
  const row=plain(run(`G.newGame('onroad','다온','${mode}','keeper','${id}');({state:S,expected:D.departureSupplies('${id}'),next:G.openingPending()})`));
  for(const key of ['fuel','scrap','water','food','van'])assert.equal(row.state[key],row.expected[key]);
  assert.equal(row.state.items['부품'],row.expected.parts);assert.equal(row.state.startPack,id);
  assert.equal(row.state.items['의약품'],1);assert.equal(row.state.items['탄약'],0);
  assert.equal(Boolean(row.next),mode==='interactive');
  assert.equal(row.state.at,'busan');assert.equal(row.state.driving,null);
 }
});
test('legacy starts and modified saved supplies survive load without regranting the bundle',()=>{
 const {run}=engine();
 for(const [id,fuel,scrap] of [['keeper',42,24],['runner',16,44],['hauler',52,6]]){
  const row=plain(run(`G.newGame('onroad','기존','full','${id}');G.save();S=null;({loaded:G.load(),state:S})`));
  assert(row.loaded);assert.equal(row.state.fuel,fuel);assert.equal(row.state.scrap,scrap);assert.equal(row.state.startPack,undefined);
 }
 const row=plain(run(`G.newGame('onroad','새짐','interactive','keeper','repair');S.fuel=21;S.items['부품']=2;S.opening.step=1;G.save();S=null;({loaded:G.load(),state:S})`));
 assert(row.loaded);assert.equal(row.state.startPack,'repair');assert.equal(row.state.fuel,21);assert.equal(row.state.items['부품'],2);assert.equal(row.state.opening.step,1);
 assert.equal(run(`D.departureSupplies('toString')`),null);
});
test('all three packs survive every opening branch and paid-result reload before the first real departure',()=>{
 for(const pack of ['fuel','repair','provisions']){
  const {ctx,run}=engine();let departures=0;
  ctx.UI.onDepart=()=>departures++;
  const stock=()=>plain(run(`({pack:S.startPack,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,van:S.van,items:S.items,day:S.day,min:S.min,opening:S.opening})`));
  for(let branch=0;branch<48;branch++){
   run(`G.seedOverride=719;G.newGame('onroad','짐검수','interactive','keeper','${pack}')`);
   assert.equal(run(`G.openingPending().id`),'opening_workshop');
   assert.equal(run(`G.canTravelTo('yangsan').ok`),false,'cannot leave before the opening');
   let cursor=branch;const visited=[];
   while(run('Boolean(G.openingPending())')){
    const event=plain(run('G.openingPending()'));
    const index=cursor%event.choices.length;cursor=Math.floor(cursor/event.choices.length);
    const choice=event.choices[index];visited.push(event.id);
    assert(run(`G.resolveOpeningChoice('${event.id}','${choice.id}').applied`));
    const paid=stock();
    assert(run('G.save();S=null;G.load()'));assert.deepEqual(stock(),paid);
    assert.equal(run(`G.resolveOpeningChoice('${event.id}','${choice.id}').applied`),false);
    assert.deepEqual(stock(),paid,'replaying a paid result must not spend or grant again');
    run(`G.continueOpening('${event.id}')`);
    assert.equal(run(`G.continueOpening('${event.id}')`),false,'stale Continue cannot skip a step');
    assert(visited.length<=6);
   }
   assert.deepEqual(visited,['opening_workshop','opening_bus_repair','opening_failed_appeal','opening_parents_module','opening_departure','opening_farewell']);
   assert.equal(run(`S._storyQueue.filter(id=>id==='onboarding_first_road').length`),1);
   const ready=stock();assert.equal(ready.pack,pack);
   assert(run(`G.canTravelTo('yangsan').ok`));assert(run(`G.startTravel('yangsan')`));
   const drive=plain(run('S.driving'));
   assert.equal(drive.from,'busan');assert.equal(drive.to,'yangsan');assert.equal(drive.gone,0);
   assert(run('G.save();S=null;G.load()'));assert.deepEqual(plain(run('S.driving')),drive);
   assert.deepEqual(stock(),ready,'departure and reload do not regrant the selected pack');
  }
  assert.equal(departures,48);
 }
});
test('repair result guidance does not require the module discovered only after the appeal',()=>{
 for(const repair of ['new_part','scrap_collar','hose_bypass']){
  const {run}=engine();
  run(`G.newGame('onroad','다온','interactive','keeper','repair');G.resolveOpeningChoice('opening_workshop','answer_call');G.continueOpening('opening_workshop');G.resolveOpeningChoice('opening_bus_repair','${repair}')`);
  assert.equal(run('Boolean(S.flags.intro_module_seen)'),false);
  let next=run('G.mainQuestEntry().next');
  assert.match(next,/부두 민원 단말/);assert.doesNotMatch(next,/엄마|장치|검증키|계기판/);
  run('G.save();S=null;G.load()');assert.equal(run('G.mainQuestEntry().next'),next);
  run(`G.continueOpening('opening_bus_repair')`);
  assert.equal(run('G.openingPending().id'),'opening_failed_appeal');
 }
});
function picker(){
 const {ctx,run,store}=engine(),els={};
 const buttons=['fuel','repair','provisions'].map(id=>({dataset:{pack:id},attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;},scrollIntoView(options){this.scrolled=options;}}));
 els['#profile-pick']={children:[],querySelectorAll:()=>buttons,querySelector:q=>buttons.find(b=>q.includes('"'+b.dataset.pack+'"'))};
 Object.defineProperty(els['#profile-pick'],'innerHTML',{set(value){this.markup=value;this.children=buttons;},get(){return this.markup;}});
 for(const id of ['profile-detail','inp-name'])els['#'+id]={value:'다온',textContent:'',innerHTML:''};
 els['#departure-inventory']={open:false};
 els['#scr-name .departure-scroll']={scrollTop:15};
 Object.assign(ctx,{$:id=>els[id],screen:'name',pendingPack:'fuel',pendingName:'',preparationKey:'isolated-preparation',sessionStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v),removeItem:key=>store.delete(key)},esc:String});
 const ui=read('src/07-ui.js');
 run(ui.slice(ui.indexOf('  function rememberPreparation('),ui.indexOf('  let navChoiceAt')));
 run(ui.slice(ui.indexOf('  function renderProfilePick(){'),ui.indexOf('  let introAuto=')));
 return {ctx,run,store,els,buttons};
}
test('three illustrated choices remain present while selection and total change without a game save',()=>{
 const {run,store,els,buttons}=picker();run('renderProfilePick()');
 assert.equal((els['#profile-pick'].innerHTML.match(/<img /g)||[]).length,3);
 for(const id of ['fuel','repair','provisions']){
  assert(els['#profile-pick'].innerHTML.includes(run(`D.scenes[D.departurePacks['${id}'].scene]`)));
  assert(els['#profile-pick'].innerHTML.includes(run(`D.departurePacks['${id}'].addition`)));
 }
 const choices=els['#profile-pick'].innerHTML;
 const before=store.get('seoul400_save_v1');
 for(const [id,index,parts] of [['repair',1,3],['provisions',2,1],['fuel',0,1],['repair',1,3]]){
  buttons[index].onclick();
  assert.equal(els['#profile-pick'].innerHTML,choices,'selection does not replace focused controls or pictures');
  assert.equal(buttons.filter(b=>b.attrs['aria-checked']==='true').length,1);
  assert.equal(buttons[index].tabIndex,0);assert(els['#profile-detail'].innerHTML.includes('>'+parts+'</dd>'));
  assert.equal(store.get('seoul400_save_v1'),before);
 }
 buttons[1].onkeydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(buttons[2].attrs['aria-checked'],'true');assert(buttons[2].focused);
 assert.equal(buttons[2].scrolled.block,'nearest');
 assert.equal(JSON.parse(store.get('isolated-preparation')).pack,'provisions');
});
test('preparation remembers input/selection for reload, back and cancel, independently of saves',()=>{
 const {run,store}=picker();run(`pendingPack='repair';rememberPreparation(false)`);
 assert.deepEqual(plain(run('readPreparation()')),{active:false,name:'다온',pack:'repair',scroll:15,inventoryOpen:false});
 run('rememberPreparation(true)');assert.equal(run('readPreparation().active'),true);
 run('clearPreparation()');assert.equal(run('readPreparation()'),null);
 store.set('isolated-preparation','{"name":"나","pack":"toString","active":true}');assert.equal(run('readPreparation()'),null);
 const ui=read('src/07-ui.js');
 assert(ui.includes("$('#bt-name-back').onclick=()=>{rememberPreparation(false);refreshTitle();show('scr-title')"));
 assert(ui.includes("}else if(readPreparation()?.active){"));
 assert(ui.includes("function enterGame(){\n    clearPreparation();"));
});
test('inventory disclosure commits before queued native toggle and restores with the same preparation',()=>{
 const {ctx,run,store,els}=picker();let prevented=0;
 ctx.disclosureClick={preventDefault(){prevented++;}};
 run('togglePreparationInventory(disclosureClick)');
 assert.equal(prevented,1);assert.equal(els['#departure-inventory'].open,true);
 assert.equal(JSON.parse(store.get('isolated-preparation')).inventoryOpen,true);
 run(`pendingPack='provisions';rememberPreparation(false)`);
 const ui=read('src/07-ui.js');ctx.show=()=>{ctx.screen='name';};
 run(ui.slice(ui.indexOf('  function startNew(mode){'),ui.indexOf('  function introName()')));
 els['#departure-inventory'].open=false;els['#scr-name .departure-scroll'].scrollTop=0;
 run(`startNew('onroad')`);
 assert.equal(els['#departure-inventory'].open,true);
 assert.equal(els['#scr-name .departure-scroll'].scrollTop,15);
 assert.equal(run('pendingPack'),'provisions');assert.equal(els['#inp-name'].value,'다온');
 assert.equal(run('readPreparation().active'),true);
 run(`screen='title';togglePreparationInventory(disclosureClick)`);
 assert.equal(els['#departure-inventory'].open,true,'stale disclosure cannot mutate preparation');
 // An old preparation has no disclosure field. It still restores its pack/name.
 store.set('isolated-preparation',JSON.stringify({active:true,name:'이전',pack:'repair',scroll:9}));
 run(`startNew('onroad')`);
 assert.equal(els['#departure-inventory'].open,false);assert.equal(run('pendingPack'),'repair');
 assert.equal(els['#inp-name'].value,'이전');
});
test('departure ignores composing/held Enter and stale activation, but accepts a fresh submit',()=>{
 const ui=read('src/07-ui.js'),els={},calls=[];
 const ctx=vm.createContext({screen:'name',pendingName:'',pendingMode:'onroad',pendingProfile:'keeper',pendingPack:'repair',
  $:id=>els[id]||(els[id]={value:' 다온 ',addEventListener(type,fn){this[type]=fn;}}),
  SND:{enable(){calls.push('sound');}},G:{newGame(...args){calls.push(args);}},
  enterGame(){ctx.screen='game';},rememberPreparation(){ctx.pendingName=(els['#inp-name'].value||'').trim().slice(0,8);}});
 vm.runInContext(ui.slice(ui.indexOf('  function togglePreparationInventory('),ui.indexOf('  let navChoiceAt')),ctx);
 vm.runInContext(ui.slice(ui.indexOf('    const nameGo=()=>{'),ui.indexOf('    const openingHistory=')),ctx);
 const key=extra=>{const event={key:'Enter',preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};els['#inp-name'].keydown(event);return event;};
 for(const extra of [{isComposing:true},{keyCode:229},{repeat:true},{key:'a'}]){
  assert.equal(key(extra).prevented,undefined);assert.equal(calls.length,0);assert.equal(ctx.screen,'name');
 }
 const submitted=key({});assert(submitted.prevented&&submitted.stopped);
 assert.deepEqual(calls,['sound',['onroad','다온','interactive','keeper','repair']]);
 els['#bt-name'].onclick();key({});assert.equal(calls.length,2,'old controls must not overwrite the new journey');
 ctx.screen='title';els['#bt-name'].onclick();assert.equal(calls.length,2,'back path cannot start through stale controls');
 ctx.screen='name';els['#inp-name'].value='';els['#bt-name'].onclick();assert.equal(calls.length,4,'reopening preparation permits a deliberate new start');
 assert.equal(calls[3][1],'');
});
test('game gates, offline assets and delivery geometry are explicit',async()=>{
 const dom=read('src/02-dom.html'),style=read('src/01-style.html');
 assert.match(dom,/data-title-layout="wharf"/);assert.match(dom,/data-prep-layout="packing"/);
 assert.doesNotMatch(dom,/id="departure-pack-img"|id="bt-name-profile"/);
 assert.match(dom,/<details id="departure-inventory">/);
 assert.doesNotMatch(dom,/id="inp-name"|기록할 이름/,'approved name introduction moves input into the bus conversation');
 assert.doesNotMatch(dom,/기본 짐은 실어뒀어요|name-child|pack-note|미적용 초안/);
 assert.match(style,/\[data-prep-layout="pack"\] \.departure-scroll\{flex:1;min-height:0;overflow-y:auto/);
 assert.match(style,/\[data-prep-layout="pack"\] \.departure-actions\{flex:none/);
 assert.match(style,/\[data-prep-layout="packing"\] \.departure-scroll\{flex:1;min-height:0;overflow-y:auto/);
 assert.match(style,/\[data-prep-layout="packing"\] \.departure-actions\{flex:none/);
 assert.match(style,/html\.ui-large-text #scr-name\[data-prep-layout="packing"\]/);
 const contract=JSON.parse(read('assets/visual-contract.json'));
 for(const id of ['opening-wharf','opening-pack-fuel','opening-pack-repair','opening-pack-provisions']){
  const meta=await require('sharp')('assets/scenes/'+id+'-v1.webp').metadata();
  assert(contract.assets.cinematicScene.allowedDelivery.some(([w,h])=>meta.width===w&&meta.height===h));
 }
 const built=read('서울까지400km.html');assert(built.includes('data-title-layout="wharf"'));assert(built.includes('data-prep-layout="packing"'));
 assert(!/__SCENE_OPENING_/.test(built));assert(!/tools\/design-drafts\/opening/.test(built));
 assert(Buffer.byteLength(built)<=require('../tools/build-budget.json').maxBytes);
});
test('full-bundle opening QA remains opaque with private storage and no gameplay patch',()=>{
 const harness=read('tools/qa-opening-runtime.html');
 assert.match(harness,/sandbox="allow-scripts allow-modals allow-downloads"/);
 assert.doesNotMatch(harness,/allow-same-origin|window\.localStorage|document\.cookie|contentWindow\.(?:G|UI|S)\b/);
 assert.match(harness,/const localStorage=qaMemory\('local'\),sessionStorage=qaMemory\('session'\)/);
 assert.match(harness,/new Blob\(\[prefix,bundle\]/);
 assert.match(harness,/event\.source!==frame\.contentWindow/);
 assert.doesNotMatch(harness,/G\.(?:newGame|load|save|applyFx|startTravel)\s*\(/);
 assert.doesNotMatch(read('tools/build-html.mjs'),/qa-opening-runtime/);
});
