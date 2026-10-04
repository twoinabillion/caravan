/* VM/source contracts. These do not claim Studio visual or native-dialog QA. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('src/07-ui.js','utf8'),css=fs.readFileSync('src/01-style.html','utf8');
function fn(name){const a=ui.indexOf('  function '+name+'('),b=ui.indexOf('\n  function ',a+4);assert(a>=0&&b>a,name);return ui.slice(a,b);}
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function fixture(){
 const memory=new Map(),nodes=new Map(),buttons=[];
 const element=(dataset={})=>({dataset,isConnected:true,attrs:{},focuses:0,setAttribute(k,v){this.attrs[k]=v;},focus(){this.focuses++;}});
 const body={innerHTML:'',scrollTop:0,querySelectorAll:()=>buttons},heading={textContent:''},close=element();
 const dialog={...element(),open:false,querySelector:s=>({'#journey-detail-title':heading,'.journey-detail-body':body,'[data-journey-detail-close]':close})[s],
  showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},getBoundingClientRect:()=>({left:12,top:100,right:348,bottom:600})};
 const place=element({journeyDetail:'place',placeInfo:'yangsan'}),record=element({journeyDetail:'record'}),crew=element({journeyDetail:'crew'});
 nodes.set('#journey-detail-dialog',dialog);nodes.set('#journey-crew-content',{innerHTML:'<button data-road-checkin="minji">민지와 대화</button>'});
 const panel={querySelector:()=>dialog,querySelectorAll:()=>[place,record,crew]};
 const ctx=vm.createContext({S:{at:null,driving:{from:'miryang',to:'yangsan',dist:34,gone:23.727890333333146,snapshot:{gameMinute:2158.57}},van:82,fatigue:20,food:14,water:16,wx:'clear',party:[]},
  D:{nodes:{miryang:{name:'밀양 장터',stl:'miryang'},yangsan:{name:'양산 고가차도',type:'ruin'},seoul:{name:'서울',type:'goal'}}},G:{isInfiniteResourceMode:()=>true},questRouteFocus:null,
  roadNotice:null,sessionStorage:{setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)},
  esc,stripTags:s=>s.replace(/<[^>]*>/g,''),routeThumbnail:()=> 'wide.webp',destinationKnowledge:()=> '확인한 진입로',
  $:s=>nodes.get(s),panel,toast:()=>{},renderPanel:()=>{},renderHud:()=>{},console});
 for(const name of ['destinationAction','destinationPreview','journeyDetailHtml','journeyDetailContext','rememberRoadNotice','restoreRoadNotice','rememberJourneyDetail','openJourneyDetail','wireJourneyDetails','journeyDrivingWarning','journeyNoticeHtml','travelDestinationHtml','renderTravelbar'])vm.runInContext(fn(name),ctx);
 return {ctx,memory,nodes,panel,dialog,body,heading,close,place,record,crew,buttons};
}
test('driving uses the shared deck: one distance, short preview, photo only behind a dialog',()=>{
 const f=fixture(),before=JSON.stringify(f.ctx.S),html=f.ctx.travelDestinationHtml('yangsan');
 assert.match(html,/data-deck-layout="calm"/);assert.match(html,/무너진 고가 아래를 탐색할 수 있다/);
 assert.equal((html.match(/11km 남음/g)||[]).length,1);
 assert.match(html,/data-open-map/);assert.match(html,/data-journey-detail="place"/);
 assert.doesNotMatch(html,/<img|travel-destination-card|data-journey-detail="crew"/);
 assert.equal(JSON.stringify(f.ctx.S),before);
 const withCrew=f.ctx.travelDestinationHtml('yangsan','<p>동행 기록</p>',true);
 assert.match(withCrew,/동료와 대화/);assert.match(withCrew,/<template id="journey-crew-content"><p>동행 기록/);
});
test('opening information has no gameplay effects; close, Escape and backdrop restore the trigger',()=>{
 const f=fixture(),before=JSON.stringify(f.ctx.S);f.ctx.wireJourneyDetails(f.panel);
 for(const method of ['button','escape','backdrop']){
  f.place.onclick();assert(f.dialog.open);assert.equal(f.heading.textContent,'양산 고가차도');
  assert.match(f.body.innerHTML,/<img src="wide.webp"/);assert.match(f.body.innerHTML,/확인한 진입로/);
  assert.equal(f.place.attrs['aria-expanded'],'true');assert(f.close.focuses>0);
  if(method==='button')f.close.onclick();
  if(method==='escape'){let prevented=false;f.dialog.oncancel({preventDefault(){prevented=true;}});assert(prevented);}
  if(method==='backdrop'){
   f.dialog.onclick({target:f.dialog,clientX:30,clientY:120});assert(f.dialog.open);
   f.dialog.onclick({target:f.dialog,clientX:0,clientY:0});
  }
  assert(!f.dialog.open);assert.equal(f.place.attrs['aria-expanded'],'false');assert(f.place.focuses>0);
  assert.equal(JSON.parse(f.memory.get('caravan-journey-detail-v1')).kind,'');
 }
 assert.equal(JSON.stringify(f.ctx.S),before);
 assert.match(ui,/\|\| !!\$\('#journey-detail-dialog'\)\?\.open/,'detail pauses the existing driving loop');
});
test('same-leg refresh restores disclosure and scroll, never reopens at another place or over a pending story',()=>{
 const f=fixture();f.ctx.wireJourneyDetails(f.panel);f.place.onclick();f.body.scrollTop=120;f.body.onscroll();
 f.dialog.open=false;f.ctx.wireJourneyDetails(f.panel);assert(f.dialog.open);assert.equal(f.body.scrollTop,120);
 f.dialog.open=false;f.ctx.S.driving.to='seoul';f.ctx.wireJourneyDetails(f.panel);assert(!f.dialog.open);
 f.ctx.S.driving.to='yangsan';f.ctx.S.pendingPresentation={eventId:'pending'};f.ctx.wireJourneyDetails(f.panel);assert(!f.dialog.open);
 f.ctx.S.pendingPresentation=null;f.ctx.wireJourneyDetails(f.panel);assert(!f.dialog.open,'invalidated story overlap stays closed');
 f.ctx.S={at:'yangsan',driving:null};f.place.onclick();assert(f.dialog.open);f.dialog.open=false;
 f.ctx.wireJourneyDetails(f.panel);assert(f.dialog.open,'stopped disclosure restores at the same place');
});
test('notice is saved only for its leg and its full text is available without scrolling the deck',()=>{
 const f=fixture();f.ctx.roadNotice={kicker:'보급 기록',title:'식량 변화',body:'점심 식사 · 식량 ∞ · 테스트 소모 없음'};
 f.ctx.rememberRoadNotice();f.ctx.roadNotice=null;f.ctx.restoreRoadNotice();assert.match(f.ctx.roadNotice.body,/점심 식사/);
 assert.match(f.ctx.journeyNoticeHtml(),/점심 식사 · 소모 없음/);
 f.ctx.wireJourneyDetails(f.panel);f.record.onclick();assert.match(f.body.innerHTML,/테스트 소모 없음/);
 f.close.onclick();f.ctx.roadNotice=null;f.ctx.S.driving.snapshot.gameMinute++;f.ctx.restoreRoadNotice();assert.equal(f.ctx.roadNotice,null);
 assert.doesNotMatch(fn('setRoadNotice'),/scrollIntoView|scrollTop/);
});
test('urgent conditions remain visible and progress clamps without changing fractional save state',()=>{
 const f=fixture(),tb={innerHTML:''},remaining={textContent:''},warning={textContent:''};
 f.nodes.set('#travelbar',tb);f.nodes.set('[data-destination-remain]',remaining);f.nodes.set('#journey-driving-warning',warning);
 f.ctx.G.isInfiniteResourceMode=()=>false;Object.assign(f.ctx.S,{fuel:1,van:12,fatigue:80,water:0,wx:'storm'});
 const before=JSON.stringify(f.ctx.S);f.ctx.renderTravelbar();
 assert.equal(remaining.textContent,'11km 남음');assert.doesNotMatch(tb.innerHTML,/km 남음/);
 for(const text of ['연료 부족','차체 위험','피로 높음','보급 부족','폭풍 주의'])assert(warning.textContent.includes(text));
 assert.equal(JSON.stringify(f.ctx.S),before);
 f.ctx.S.driving.gone=40;f.ctx.renderTravelbar();assert.equal(remaining.textContent,'0km 남음');assert.match(tb.innerHTML,/width:100%/);
});
test('conversation dismisses its dialog synchronously before the existing engine action',()=>{
 const f=fixture();let calls=0;
 f.buttons.push({dataset:{roadCheckin:'minji'}});f.ctx.G.roadCheckIn=id=>{
  assert.equal(id,'minji');assert(!f.dialog.open);assert.equal(JSON.parse(f.memory.get('caravan-journey-detail-v1')).kind,'');calls++;return {ok:true};
 };
 f.ctx.wireJourneyDetails(f.panel);f.crew.onclick();assert.equal(calls,0);
 f.buttons[0].onclick();assert.equal(calls,1);assert(!f.dialog.open);
});
test('late native close event from a removed dialog cannot erase a new disclosure',()=>{
 const f=fixture();f.ctx.wireJourneyDetails(f.panel);f.place.onclick();
 f.dialog.isConnected=false;f.dialog.onclose();
 assert.equal(JSON.parse(f.memory.get('caravan-journey-detail-v1')).kind,'place');
});
test('every place gets a short non-reward preview; full landscape is never cover-cropped in detail',()=>{
 const f=fixture();const data=vm.createContext({});vm.runInContext(fs.readFileSync('src/03-data.js','utf8')+';globalThis.data=D;',data);
 f.ctx.D.nodes=data.data.nodes;
 for(const id of Object.keys(f.ctx.D.nodes)){
  const text=f.ctx.destinationPreview(id);assert(text.length<=30,id);assert.doesNotMatch(text,/보상|고철\s*\+|획득|확정|\d+개/);
 }
 assert.match(css,/.journey-detail-body figure>img\{display:block;width:100%;height:auto;object-fit:contain/);
 assert.match(css,/.journey-detail-body\{min-height:0;overflow-y:auto;/);
 assert.doesNotMatch(fn('travelDestinationHtml'),/routeThumbnail|<img/);
});
