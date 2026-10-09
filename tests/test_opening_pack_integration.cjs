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
function picker(){
 const {ctx,run,store}=engine(),els={};
 const buttons=['fuel','repair','provisions'].map(id=>({dataset:{pack:id},attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;}}));
 els['#profile-pick']={children:[],querySelectorAll:()=>buttons,querySelector:q=>buttons.find(b=>q.includes('"'+b.dataset.pack+'"'))};
 Object.defineProperty(els['#profile-pick'],'innerHTML',{set(value){this.markup=value;this.children=buttons;},get(){return this.markup;}});
 for(const id of ['departure-pack-img','departure-pack-name','departure-pack-addition','profile-detail','bt-name-profile','inp-name'])els['#'+id]={value:'다온',textContent:'',innerHTML:''};
 els['#scr-name .departure-scroll']={scrollTop:15};
 Object.assign(ctx,{$:id=>els[id],pendingPack:'fuel',pendingName:'',preparationKey:'isolated-preparation',sessionStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v),removeItem:key=>store.delete(key)},esc:String});
 const ui=read('src/07-ui.js');
 run(ui.slice(ui.indexOf('  function rememberPreparation('),ui.indexOf('  let navChoiceAt')));
 run(ui.slice(ui.indexOf('  function renderProfilePick(){'),ui.indexOf('  let introAuto=')));
 return {ctx,run,store,els,buttons};
}
test('radio switching replaces one image and total, keeps focus, and never writes a game save',()=>{
 const {run,store,els,buttons}=picker();run('renderProfilePick()');
 const before=store.get('seoul400_save_v1');
 for(const [id,index,parts] of [['repair',1,3],['provisions',2,1],['fuel',0,1],['repair',1,3]]){
  buttons[index].onclick();
  assert(els['#departure-pack-img'].src.includes(id.toUpperCase()));
  assert.equal(buttons.filter(b=>b.attrs['aria-checked']==='true').length,1);
  assert.equal(buttons[index].tabIndex,0);assert(els['#profile-detail'].innerHTML.includes('>'+parts+'</dd>'));
  assert.equal(store.get('seoul400_save_v1'),before);
 }
 buttons[1].onkeydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(buttons[2].attrs['aria-checked'],'true');assert(buttons[2].focused);
 assert.equal(JSON.parse(store.get('isolated-preparation')).pack,'provisions');
});
test('preparation remembers input/selection for reload, back and cancel, independently of saves',()=>{
 const {run,store}=picker();run(`pendingPack='repair';rememberPreparation(false)`);
 assert.deepEqual(plain(run('readPreparation()')),{active:false,name:'다온',pack:'repair',scroll:15});
 run('rememberPreparation(true)');assert.equal(run('readPreparation().active'),true);
 run('clearPreparation()');assert.equal(run('readPreparation()'),null);
 store.set('isolated-preparation','{"name":"나","pack":"toString","active":true}');assert.equal(run('readPreparation()'),null);
 const ui=read('src/07-ui.js');
 assert(ui.includes("$('#bt-name-back').onclick=()=>{rememberPreparation(false);refreshTitle();show('scr-title')"));
 assert(ui.includes("}else if(readPreparation()?.active){"));
 assert(ui.includes("function enterGame(){\n    clearPreparation();"));
});
test('game gates, offline assets and delivery geometry are explicit',async()=>{
 const dom=read('src/02-dom.html'),style=read('src/01-style.html');
 assert.match(dom,/data-title-layout="wharf"/);assert.match(dom,/data-prep-layout="pack"/);
 assert.equal((dom.match(/id="departure-pack-img"/g)||[]).length,1);
 assert.doesNotMatch(dom,/기본 짐은 실어뒀어요|name-child|pack-note|미적용 초안/);
 assert.match(style,/\[data-prep-layout="pack"\] \.departure-scroll\{flex:1;min-height:0;overflow-y:auto/);
 assert.match(style,/\[data-prep-layout="pack"\] \.departure-actions\{flex:none/);
 const contract=JSON.parse(read('assets/visual-contract.json'));
 for(const id of ['opening-wharf','opening-pack-fuel','opening-pack-repair','opening-pack-provisions']){
  const meta=await require('sharp')('assets/scenes/'+id+'-v1.webp').metadata();
  assert(contract.assets.cinematicScene.allowedDelivery.some(([w,h])=>meta.width===w&&meta.height===h));
 }
 const built=read('서울까지400km.html');assert(built.includes('data-title-layout="wharf"'));assert(built.includes('data-prep-layout="pack"'));
 assert(!/__SCENE_OPENING_/.test(built));assert(!/tools\/design-drafts\/opening/.test(built));
 assert(Buffer.byteLength(built)<80_000_000);
});
