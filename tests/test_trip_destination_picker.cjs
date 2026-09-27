/* Source-level interaction regression, not a browser/visual QA substitute. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const css=fs.readFileSync('src/01-style.html','utf8');
function section(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert(a>=0&&b>a);return source.slice(a,b);
}
const models=[
  {nb:{id:'muju',km:44},fuel:7,forecast:{ok:true,minutes:210,shortage:false}},
  {nb:{id:'gumi',km:26},fuel:4,forecast:{ok:false,minutes:0,why:'서쪽 장터길을 골랐다 — 청주까지 이 노선을 마쳐야 한다'}},
  {nb:{id:'yeongdong',km:30},fuel:6,forecast:{ok:true,minutes:140,shortage:true}},
];
const elements=new Map();
function element(dataset={}){
  return {dataset,attributes:{},open:false,focuses:0,disabled:false,
    setAttribute(k,v){this.attributes[k]=v;},focus(){this.focuses++;},
    showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},
    getBoundingClientRect(){return {left:12,right:348,top:70,bottom:640};}};
}
let picker,choice,buttons,close,depart,travelCalls=0,renderCalls=0;
const memory=new Map();
const context=vm.createContext({console,Math,JSON,Number,String,
  S:{at:'gimcheon',driving:null,van:82,fatigue:50,wx:'clear',fuel:42},
  D:{nodes:{gimcheon:{name:'김천 갈림길'},muju:{name:'무주 터널'},gumi:{name:'구미 공단 폐허'},yeongdong:{name:'영동 <포도밭>'}}},
  G:{isInfiniteResourceMode:()=>true,mainQuestEntry:()=>({title:'부모님 기록을 찾는다'}),
    startTravel:id=>{travelCalls++;return id==='muju';},canTravelTo:id=>models.find(m=>m.nb.id===id).forecast},
  navChoiceAt:'gimcheon',navChoiceId:'gumi',navChoiceGuide:'main',questRouteFocus:null,
  journeyConsoleMode:'route',journeyViewRestored:false,routeMapOpen:true,journeyRouteModels:[],journeyViewKey:'test-view',
  sessionStorage:{setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)},
  esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
  directionParticle:()=> '로',toast:()=>{},$:s=>elements.get(s),
  syncRouteMap:()=>vm.runInContext('rememberJourneyView()',context),
  renderPanel:()=>{renderCalls++;setup();vm.runInContext('routeConsoleHtml(models);wireRouteConsole(panel,models)',context);},
  models
});
vm.runInContext([
  section('  function rememberJourneyView(){','  let questRouteFocus='),
  section('  function routeConsoleModel(','  function routeThumbnail('),
  section('  function tripDestinationPickerHtml(','  function syncRouteMap('),
  section('  function wireRouteConsole(','  function applyIcons(')
].join('\n'),context);
function setup(){
  choice=element();picker=element();close=element();depart=element({navDepart:context.navChoiceId});
  buttons=models.map(m=>element({tripRoute:m.nb.id}));
  picker.querySelector=s=>s==='[data-trip-picker-close]'?close:buttons.find(b=>b.dataset.tripRoute===context.navChoiceId);
  picker.querySelectorAll=()=>buttons;
  elements.set('[data-trip-destination]',choice);
  context.panel={querySelector:s=>({'[data-trip-destination]':choice,'#trip-destination-dialog':picker,'[data-nav-depart]':depart}[s])||null};
  vm.runInContext('wireRouteConsole(panel,models)',context);
}
setup();
const before=JSON.stringify(context.S);
const html=vm.runInContext('routeConsoleHtml(models)',context);
assert(!html.includes('<select'),'no browser-native destination dropdown');
assert(html.includes('aria-haspopup="dialog"'));
assert(html.includes('구미 공단 폐허'));
assert(html.includes('26km'));
assert(html.includes('이동 불가'));
assert(html.includes('청주까지 이 노선을 마쳐야 한다'));
assert(html.includes('연료 부족'));
assert(html.includes('영동 &lt;포도밭>'),'escape destination names');
assert(html.includes('disabled aria-describedby="trip-depart-reason"'),'blocked preview must not enable departure');
assert.equal((html.match(/data-trip-route=/g)||[]).length,3);
choice.onclick();assert(picker.open);assert.equal(choice.attributes['aria-expanded'],'true');
assert.equal(buttons[1].focuses,1,'initial keyboard focus follows the selected destination');
let stopped=false;picker.onkeydown({key:'Escape',stopPropagation(){stopped=true;}});assert(stopped);
close.onclick();assert(!picker.open);assert.equal(choice.attributes['aria-expanded'],'false');
assert.equal(context.navChoiceId,'gumi','cancel must not silently change a blocked selection');
assert(context.routeMapOpen,'closing picker must preserve underlying regional map');
choice.onclick();picker.onclick({target:picker,clientX:20,clientY:100});assert(picker.open,'inside padding is not dismissal');
picker.onclick({target:picker,clientX:0,clientY:0});assert(!picker.open,'outside click dismisses');
choice.onclick();buttons[0].onclick();
assert.equal(context.navChoiceId,'muju');assert.equal(renderCalls,1);assert.equal(travelCalls,0,'selection previews only');
assert.equal(choice.focuses,1,'return focus to the newly rendered trigger');
assert.equal(JSON.stringify(context.S),before,'opening, cancelling and selecting preserve game state');
assert.equal(JSON.parse(memory.get('test-view')).destination,'muju','selection is persisted through the shared journey view');
context.navChoiceId=null;context.routeMapOpen=false;vm.runInContext('restoreJourneyView()',context);
assert.equal(context.navChoiceId,'muju');assert(context.routeMapOpen,'map and selection survive restoration together');
context.S.at='gumi';context.navChoiceId='gumi';context.journeyViewRestored=false;vm.runInContext('restoreJourneyView()',context);
assert.equal(context.navChoiceId,'gumi','another location must not reuse this journey view');context.S.at='gimcheon';
context.navChoiceId='muju';setup();
depart.onclick({preventDefault(){},stopPropagation(){}});assert.equal(travelCalls,1,'separate departure still starts travel');
assert(css.includes('.trip-picker[open]{display:flex;flex-direction:column}'));
assert(css.includes('.trip-picker-list{min-height:0;overflow-y:auto;'));
assert(css.includes('.trip-choice>span{font:750 19px/1.25'));
console.log('PASS destination content/status, open/select/cancel/outside click, Escape isolation, focus restoration, preview-only selection, persistence and explicit departure. Native dialog layout/focus containment still require browser QA.');
