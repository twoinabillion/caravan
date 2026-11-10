const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
function fixture(){const h=setup();h.run(fs.readFileSync('src/07g-ui-home.js','utf8'));
  h.run("S.party=['minji','jaeyi','parkss'];S.up={bench:true};S.recruitQ=null;S.min=1110;S.ended=false;");return h;}
test('real HOME exposes current places and owned objects with a free sleeping preview',()=>{
  const h=fixture(),before=h.run('JSON.stringify(S)'),html=h.run('HOME.html(HOME.state(S,D,G.campParticipants()))');
  assert.match(html,/data-home-mode="day"/);assert.match(html,/data-home-mode="sleep"/);
  assert.match(html,/data-home-resident="parkss"/);assert.match(html,/동료 자리 3\/3/);
  assert.match(html,/좌석 아래/);assert.match(html,/고정 침상은 아직 없다/);
  assert.match(html,/data-home-placement="companion:jaeyi"/);
  assert.equal(h.run('JSON.stringify(S)'),before);
  h.run('S.up.bunk=true');assert.doesNotMatch(h.run('HOME.html(HOME.state(S,D,G.campParticipants()))'),/고정 침상은 아직 없다/);
});
test('only camp-provided meal eligibility renders a payment control; ending stays read-only',()=>{
  const h=fixture();h.run("globalThis.hs=HOME.state(S,D,G.campParticipants());hs.mealControl={enabled:false,done:false,reason:'식량 1 · 물 1 필요'}");
  const html=h.run('HOME.html(hs)');assert.match(html,/data-camp-prep="meal"[^>]*disabled/);
  assert.match(html,/식량 1 · 물 1 필요/);
  assert.doesNotMatch(h.run('HOME.html(HOME.state(S,D,G.campParticipants()))'),/data-camp-prep="meal"/);
});
test('free room mode switching and return keep state intact and clean up replaced handlers',()=>{
  const h=fixture();h.run(`globalThis.hs=HOME.state(S,D,G.campParticipants());
    globalThis.mk=dataset=>({dataset,hidden:false,onclick:null,attrs:{},setAttribute(k,v){this.attrs[k]=v}});
    globalThis.modes=['day','sleep'].map(homeMode=>mk({homeMode}));
    globalThis.views=['day','sleep'].map(homeLayoutView=>mk({homeLayoutView}));
    globalThis.host={querySelectorAll:s=>s==='[data-home-mode]'?modes:s==='[data-home-layout-view]'?views:[],querySelector:()=>null};
    globalThis.oldCleanup=HOME.wire(host,hs);globalThis.cleanup=HOME.wire(host,hs);oldCleanup();`);
  const before=h.run('JSON.stringify(S)');h.run('modes[1].onclick()');
  assert.equal(h.run('views[0].hidden'),true);assert.equal(h.run('views[1].hidden'),false);
  assert.equal(h.run('modes[1].attrs["aria-pressed"]'),'true');assert.equal(h.run('JSON.stringify(S)'),before);
  h.run('modes[0].onclick();cleanup()');assert.equal(h.run('modes.every(b=>b.onclick===null)'),true);
});
test('the meal recap selects the same HOME destination in the main navigation',()=>{
  const h=fixture(),ui=fs.readFileSync('src/07-ui.js','utf8');
  const start=ui.indexOf('    viewButtons.forEach(button=>button.onclick=()=>{',ui.indexOf('  function showCampHub(){'));
  const end=ui.indexOf("    $('#camp-mini')",start);
  assert(start>=0&&end>start);
  h.run(`globalThis.viewButtons=['prepare','home','home'].map((campView,index)=>({dataset:{campView},attrs:{},
    setAttribute(k,v){this.attrs[k]=v},hasAttribute(){return index===2}}));
    globalThis.viewPanels=['prepare','home'].map(campPanel=>({dataset:{campPanel},hidden:false}));
    globalThis.body={dataset:{campView:'prepare'},querySelector:()=>null};globalThis.viewScroll={prepare:0,home:0};
    globalThis.scroller={scrollTop:15};`);
  h.run(ui.slice(start,end)+';viewButtons[2].onclick()');
  assert.equal(h.run('body.dataset.campView'),'home');
  assert.deepEqual(h.json('viewButtons.map(button=>button.attrs["aria-pressed"])'),['false','true','true']);
});
