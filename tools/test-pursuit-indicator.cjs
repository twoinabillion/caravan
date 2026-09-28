const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const css=fs.readFileSync('src/01-style.html','utf8');
const dom=fs.readFileSync('src/02-dom.html','utf8');
const scene=fs.readFileSync('src/05-scene.js','utf8');
const start=source.indexOf('  let pursuitUi=null;'),end=source.indexOf('  function renderHud(){',start);
assert(start>=0&&end>start);
const controller=source.slice(start,end);
function fixture(){
  const handlers={},windowHandlers={},els=new Map(),timers=new Map();let writes=0,focus=0,nextTimer=0,blocked=false;
  const node=(id)=>{const n={id,dataset:{},attrs:{},hidden:false,style:{},offsetHeight:180,
    setAttribute(k,v){this.attrs[k]=v;writes++;},focus(){focus++;},contains(t){return t===this;},
    classList:{toggle(k,v){this[k]=v;writes++;}},set textContent(v){this.text=v;writes++;}};els.set('#'+id,n);return n;};
  const button=node('pursuit-indicator'),help=node('pursuit-help');help.hidden=true;
  const pips=Array.from({length:5},(_,i)=>node('pip'+i));help.querySelectorAll=()=>pips;
  ['pursuit-value','pursuit-description','pursuit-help-close','stage','journey-vehicle','scr-game','pursuit-notice','pursuit-change'].forEach(node);
  els.get('#pursuit-notice').hidden=true;
  els.get('#stage').offsetHeight=304;
  els.get('#scr-game').getBoundingClientRect=()=>({top:100});
  button.getBoundingClientRect=()=>({top:100+els.get('#stage').offsetHeight});
  const ctx=vm.createContext({S:{pursuit:2,fuel:42,party:[],at:'jeonju',day:2},$:(s)=>els.get(s),
    setTimeout:(fn,ms)=>{timers.set(++nextTimer,{fn,ms});return nextTimer;},clearTimeout:id=>timers.delete(id),modalOpen:()=>blocked,
    document:{hidden:false,documentElement:{dataset:{routeMap:'closed'}},addEventListener(k,fn,capture){handlers[k]={fn,capture};}},
    window:{addEventListener(k,fn){windowHandlers[k]=fn;}}});
  vm.runInContext(controller,ctx);
  const render=()=>vm.runInContext('renderPursuitIndicator()',ctx);
  return {ctx,button,help,pips,els,handlers,windowHandlers,render,timers,block:v=>blocked=v,writes:()=>writes,focus:()=>focus};
}
test('all six levels and invalid inputs use the real pursuit only; no game mutations',()=>{
  const f=fixture();
  for(const [input,expected] of [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[-1,0],[99,5],[NaN,0],[2.8,2]]){
    f.ctx.S.pursuit=input;const before=JSON.stringify(f.ctx.S);f.render();
    assert.equal(f.button.dataset.level,String(expected));
    assert.equal(f.pips.filter(p=>p.classList.on).length,expected);
    assert(f.button.attrs['aria-label'].includes(`${expected}/5`));
    assert.equal(JSON.stringify(f.ctx.S),before);
  }
  f.ctx.S.at='seoul';f.ctx.S.flags={seoul_open:true};f.ctx.S.pursuit=1;f.render();
  assert.equal(f.button.dataset.level,'1','Seoul must not invent level 5');
});
test('unchanged HUD refreshes preserve focus/disclosure and do not rewrite DOM',()=>{
  const f=fixture();f.render();f.button.onclick();const writes=f.writes();
  for(let i=0;i<100;i++) f.render();
  assert.equal(f.writes(),writes);assert(!f.help.hidden);assert.equal(f.focus(),0);
  f.ctx.S.pursuit=5;f.render();assert(!f.help.hidden);
  assert(f.els.get('#pursuit-description').text.includes('거절'));
});
test('open, toggle, close, outside click and Escape preserve gameplay and next action',()=>{
  const f=fixture();f.render();const before=JSON.stringify(f.ctx.S);
  f.button.onclick();assert(!f.help.hidden);assert.equal(f.button.attrs['aria-expanded'],'true');
  f.handlers.pointerdown.fn({target:f.button});assert(!f.help.hidden);
  f.handlers.pointerdown.fn({target:f.help});assert(!f.help.hidden);
  f.handlers.pointerdown.fn({target:{}});assert(f.help.hidden,'outside interaction is not intercepted');
  f.button.onclick();f.button.onclick();assert(f.help.hidden);
  f.button.onclick();f.els.get('#pursuit-help-close').onclick();assert(f.help.hidden);assert.equal(f.focus(),1);
  f.button.onclick();let prevented=false,stopped=false;
  f.handlers.keydown.fn({key:'Escape',preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
  assert(f.help.hidden&&prevented&&stopped);assert(f.handlers.keydown.capture);assert.equal(f.focus(),2);
  assert.equal(JSON.stringify(f.ctx.S),before);
  assert(fixture().help.hidden,'reload starts disclosure closed without save changes');
});
test('short-stage positioning, resize and overlay/map/screen dismissal',()=>{
  const f=fixture();f.render();f.button.onclick();assert.equal(f.help.style.top,'116px');assert.equal(f.help.style.maxHeight,'288px');
  f.els.get('#stage').offsetHeight=125;f.windowHandlers.resize();assert.equal(f.help.style.top,'8px');
  assert.match(source,/function openModal\(sel,preferred\)\{\s*closePursuitHelp\(\)/);
  assert.match(source,/function show\(id\)\{\s*closePursuitHelp\(\)/);
  assert.match(source,/if\(!visible\) return;\s*closePursuitHelp\(\);/);
  assert.match(css,/html\[data-route-map="open"\] #pursuit-indicator,html\[data-route-map="open"\] #pursuit-notice\{display:none\}/);
});
test('one owned CSS block, help outside clipped scenery, no surveillance painting or gameplay rules changed',()=>{
  assert.equal((css.match(/#pursuit-indicator\{/g)||[]).length,2); // legacy running build + strip owner
  assert(!/cheollian-tint|cheollianFx/.test(source+css+dom+scene));
  assert(!/S\.pursuit\s*=|G\.|Storage|setInterval|requestAnimationFrame/.test(controller));
  assert(dom.indexOf('id="pursuit-help"')>dom.indexOf('id="minimap"'));
  assert.match(css,/#journey-vehicle #pursuit-indicator\{[^}]*min-height:44px/);
  assert.match(css,/#pursuit-help\{[^}]*max-height:calc\(100% - 70px\);overflow:auto/);
  assert(dom.indexOf('id="pursuit-indicator"')>dom.indexOf('id="journey-resources"'));
  assert.match(source,/status=\$\('#journey-resources'\)/,'HUD must not replace the focused disclosure button');
});
test('risk rise appears once, expires, and does not replay on unchanged HUD, load or decrease',()=>{
  const f=fixture(),notice=f.els.get('#pursuit-notice');f.render();assert(notice.hidden);assert.equal(f.timers.size,0);
  f.ctx.S.pursuit=3;f.render();assert(!notice.hidden);assert.equal(f.els.get('#pursuit-change').text,'추적 위험 2 → 3');
  const timer=[...f.timers.values()][0];assert.equal(timer.ms,5000);
  f.render();assert.equal(f.timers.size,1);timer.fn();assert(notice.hidden);f.render();assert(notice.hidden);
  f.ctx.S.pursuit=4;f.render();f.ctx.S.pursuit=5;f.render();assert.equal(f.timers.size,1);assert.equal(f.els.get('#pursuit-change').text,'추적 위험 4 → 5');
  [...f.timers.values()][0].fn();assert(notice.hidden);
  f.ctx.S.pursuit=1;f.render();assert(notice.hidden);
  f.ctx.S={...f.ctx.S,pursuit:5};f.render();assert(notice.hidden,'new save baseline is silent');
  const fresh=fixture();fresh.ctx.S.pursuit=5;fresh.render();assert(fresh.els.get('#pursuit-notice').hidden,'page reload is silent');
  assert.match(source,/if\(pursuitUi\) pursuitUi.level=null/,'screen entry resets feedback baseline');
});
test('rise cannot obscure open help or interrupt modal/map/hidden state; next action cancels it',()=>{
  const f=fixture(),notice=f.els.get('#pursuit-notice');f.render();
  f.button.onclick();f.ctx.S.pursuit=3;f.render();assert(notice.hidden);assert(!f.help.hidden);
  f.button.onclick();f.block(true);f.ctx.S.pursuit=4;f.render();assert(notice.hidden);
  f.block(false);f.render();assert(notice.hidden,'no stale replay when leaving a modal');
  f.ctx.document.documentElement.dataset.routeMap='open';f.ctx.S.pursuit=5;f.render();assert(notice.hidden);
  f.ctx.document.documentElement.dataset.routeMap='closed';f.ctx.S.pursuit=1;f.render();f.ctx.S.pursuit=2;f.render();assert(!notice.hidden);
  f.button.onclick();assert(notice.hidden);assert.equal(f.timers.size,0);
  f.ctx.document.hidden=true;f.handlers.visibilitychange.fn();assert(f.help.hidden&&notice.hidden);
});
