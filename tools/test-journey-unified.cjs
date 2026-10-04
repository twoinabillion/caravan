const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const css=fs.readFileSync('src/01-style.html','utf8');
function section(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert(start>=0&&end>start);return source.slice(start,end);}
const controller=section('  function stayActionModel(', '  function journeyModeTabsHtml(');
const dispatch=section('  function wireStopActionButtons(', '  function renderPanel(');
const models=['explore','camp','repair','radio'].map(action=>({action,title:action,description:'행동 설명',chips:[{label:'시간',value:'+2시간'}]}));
function fixture(){
  const calls=[],memory=new Map(),handlers={};
  const ctx=vm.createContext({console,Math,JSON,Number,String,S:{at:'sejong',day:3,min:532.352,driving:null},D:{nodes:{sejong:{name:'세종'},gongju:{name:'공주'}}},
    stayActionAt:null,stayActionId:null,journeyViewKey:'test',journeyViewRestored:false,journeyConsoleMode:'local',navChoiceId:'gongju',navChoiceGuide:'',routeMapOpen:false,
    sessionStorage:{setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)},
    esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
    G:{explore:()=>calls.push('explore'),fieldRepair:()=>calls.push('repair'),fixRadio:()=>{calls.push('radio');return true;},openRescue:()=>calls.push('walkfuel'),openRecruitStep:()=>calls.push('recruitstep')},
    showCampHub:()=>calls.push('camp'),showStl:()=>calls.push('stl'),showCraft:()=>calls.push('craft'),renderAll:()=>{},closeModal:()=>{},wireJourneyDetails:()=>{},models});
  vm.runInContext(controller+dispatch+section('  function rememberJourneyView(){','  let questRouteFocus='),ctx);
  const choices=models.map(m=>({dataset:{staySelect:m.action},attrs:{},focus(){this.focused=true;},setAttribute(k,v){this.attrs[k]=v;}}));
  const trigger={isConnected:true,attrs:{},focus(){this.focused=true;},setAttribute(k,v){this.attrs[k]=v;}},close={};
  const picker={open:false,attrs:{},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},setAttribute(k,v){this.attrs[k]=v;},querySelector:()=>close,getBoundingClientRect:()=>({left:12,top:100,right:348,bottom:600})};
  const detail={html:'',button:null,set innerHTML(v){this.html=v;this.button={disabled:v.includes('disabled aria-describedby')};},querySelector(s){return s===`[data-a="${ctx.stayActionId}"]`?this.button:null;}};
  const panel={querySelectorAll:()=>choices,querySelector:s=>({'#stay-detail':detail,'[data-stay-choice]':trigger,'#stay-action-dialog':picker})[s]||null,set onkeydown(fn){handlers.keydown=fn;}};
  ctx.panel=panel;vm.runInContext('stayConsoleHtml(models,"");',ctx);detail.innerHTML=vm.runInContext('stayDetailHtml(models[0])',ctx);vm.runInContext('wireStayConsole(panel,models,{stl:"jeonju"})',ctx);
  return {ctx,calls,memory,choices,detail,handlers,panel,trigger,picker,close};
}
test('selection previews only; explicit execution uses existing engine actions',()=>{
  const f=fixture(),before=JSON.stringify(f.ctx.S);
  for(let i=0;i<4;i++){
    f.choices[i].onclick();assert.equal(f.calls.length,i);assert.equal(f.ctx.stayActionId,models[i].action);
    assert.equal(f.choices[i].attrs['aria-pressed'],'true');
    f.detail.button.onclick();assert.equal(f.calls[i],models[i].action);
  }
  assert.equal(JSON.stringify(f.ctx.S),before);
});
test('camp hull forecast formats fractional capacity without changing recovery or save',()=>{
  const campModel=section('    let campVanFix=4;', '    const nbs=G.neighbors(S.at)');
  for(const [van,perk,solar,expected] of [
    [96.53807377039571,false,false,'+3.5'],
    [96,false,false,'+4'],
    [99.96,false,false,'+0.1 미만'],
    [100,false,false,'유지'],
    [101,false,false,'유지'],
    [60,true,true,'+15']
  ]){
    const f=fixture();Object.assign(f.ctx.S,{van,vanMax:100,up:{solar}});
    Object.assign(f.ctx.G,{hasPerk:()=>perk,mealNeed:()=>1});
    f.ctx.localActions=[];const before=JSON.stringify(f.ctx.S);
    const gain=vm.runInContext(campModel+'\ncampVanGain;',f.ctx);
    const model=f.ctx.localActions[0];
    assert.equal(model.chips.find(c=>c.label==='차체').value,expected);
    assert.equal(gain,Math.max(0,Math.min(4+(perk?8:0)+(solar?3:0),100-van)));
    const html=vm.runInContext('stayDetailHtml(localActions[0])',f.ctx);
    assert(html.includes(`<b>${expected}</b>`));
    assert(!/\d+\.\d{2,}/.test(html),'internal floating-point precision must not reach the forecast');
    assert.match(html,/data-a="camp"/);
    assert.equal(JSON.stringify(f.ctx.S),before);
  }
});
test('keyboard browses without selection; explicit choice persists through reload and invalidation',()=>{
  const f=fixture();let prevented=false;
  f.trigger.onclick();assert(f.picker.open&&f.choices[0].focused);
  f.choices[0].onkeydown({key:'ArrowDown',preventDefault(){prevented=true;}});
  assert(prevented&&f.choices[1].focused);assert.equal(f.calls.length,0);
  assert.equal(f.ctx.stayActionId,'explore','arrow navigation must be cancellable');
  f.choices[1].onclick();assert(!f.picker.open&&f.trigger.focused);
  assert.equal(JSON.parse(f.memory.get('test')).stayAction,'camp');
  f.ctx.stayActionId=null;vm.runInContext('restoreJourneyView()',f.ctx);assert.equal(f.ctx.stayActionId,'camp');
  f.ctx.S.at='gongju';vm.runInContext('stayConsoleHtml(models,"")',f.ctx);assert.equal(f.ctx.stayActionId,'explore');
  f.ctx.stayActionId='radio';vm.runInContext('stayConsoleHtml(models.slice(0,3),"")',f.ctx);assert.equal(f.ctx.stayActionId,'explore','removed action cannot execute stale radio');
});
test('picker cancel, native Escape isolation and backdrop dismiss without effects',()=>{
  const f=fixture(),before=JSON.stringify(f.ctx.S);
  f.trigger.onclick();assert.equal(f.trigger.attrs['aria-expanded'],'true');
  f.close.onclick();assert(!f.picker.open&&f.trigger.focused);
  assert.equal(f.trigger.attrs['aria-expanded'],'false');
  f.trigger.onclick();let stopped=false;
  f.picker.onkeydown({key:'Escape',stopPropagation(){stopped=true;}});assert(stopped);
  f.picker.close();assert.equal(f.ctx.stayActionId,'explore');
  f.trigger.onclick();f.picker.onclick({target:f.picker,clientX:20,clientY:110});assert(f.picker.open);
  f.picker.onclick({target:f.picker,clientX:0,clientY:0});assert(!f.picker.open);
  assert.equal(f.calls.length,0);assert.equal(JSON.stringify(f.ctx.S),before);
});
test('temporary companion status survives every selection without adding a console row',()=>{
  const f=fixture(),status='<section class="road-guest-card">밤이 되면 다시 이야기</section>';
  f.ctx.status=status;vm.runInContext('wireStayConsole(panel,models,{},status)',f.ctx);
  f.choices[2].onclick();assert(f.detail.html.includes(status));
  assert(f.detail.html.includes('임시 동행 상황'));
});
test('empty actions have no active trigger and remain a readable terminal local state',()=>{
  const f=fixture();const html=vm.runInContext('stayConsoleHtml([],"")',f.ctx);
  assert(html.includes('지금 가능한 행동 없음'));assert(html.includes('지금 이곳에서 할 수 있는 일이 없다'));
  assert.match(html,/aria-controls="stay-action-dialog" disabled/);
  vm.runInContext('wireStayConsole(panel,[],{})',f.ctx);f.trigger.onclick();assert(!f.picker.open);
});
test('blocked actions stay inspectable, reasons and next-step information survive',()=>{
  const f=fixture();f.ctx.blocked={...models[0],disabled:true,description:'밤에는 <탐색>할 수 없다',disabledCta:'야간 탐색 불가'};
  const html=vm.runInContext('stayConsoleHtml([blocked],"")',f.ctx);
  assert.match(html,/data-stay-select="explore" aria-pressed="true"/);
  assert.match(html,/disabled aria-describedby="stay-reason"/);
  assert.match(html,/밤에는 &lt;탐색>/);assert.match(html,/야간 탐색 불가/);
  assert.match(html,/선택한 행동 설명/);
});
test('Escape closes only current disclosure and returns focus; no action on cancellation',()=>{
  const f=fixture(),summary={focus(){this.focused=true;}},open={open:true,querySelector:()=>summary};
  f.panel.querySelector=()=>open;let stopped=false;
  f.handlers.keydown({key:'Escape',preventDefault(){},stopPropagation(){stopped=true;}});
  assert(!open.open&&summary.focused&&stopped);assert.equal(f.calls.length,0);
});
test('all eligible actions remain reachable and roster-only actions stay gated',()=>{
  const f=fixture();f.ctx.actions=[...models,...['stl','recruitstep','walkfuel','craft'].map(action=>({action,title:action,description:action}))];
  const html=vm.runInContext('stayConsoleHtml(actions,"")',f.ctx);
  assert.equal((html.match(/data-stay-select=/g)||[]).length,8);
  assert(!source.includes('localActions=localActions.slice'));
  assert.match(source,/if\(S\.recruitQ\)/);assert.match(source,/else if\(!waitNight\)/);
  assert.match(source,/if\(n\.stl\) localActions.push/);assert.match(source,/if\(!S\.flags.radio_fixed\)/);
});
test('unified header owns stopped and driving; normalizer and old card layout excluded',()=>{
  assert.match(source,/if\(place\) place.textContent=S.driving\?/);
  assert.match(css,/html\[data-journey-ui="unified"\] #app .journey-location/);
  assert.match(css,/html\[data-journey-ui="unified"\] #app #stage :is\(#road-status,#stage-time\)/);
  assert.match(source,/#ovl-camp,.journey-deck/);
  assert(!source.includes('class="route-console journey-mode-panel journey-local-panel"'));
  assert(!css.includes('Final precedence lock: four stay actions'));
});
