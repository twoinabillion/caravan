/* Approved title integration regression. Isolated VM; never reads a live save. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('src/07-ui.js','utf8');
const dom=fs.readFileSync('src/02-dom.html','utf8');
const styles=fs.readFileSync('src/01-style.html','utf8');
const between=(text,start,end)=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));
function element(){
  const classes=new Set();
  return {dataset:{},style:{},hidden:false,open:false,textContent:'',innerHTML:'',
    classList:{toggle(k,on){on?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)},
    attrs:{},setAttribute(k,v){this.attrs[k]=v;},children:{},querySelector(k){return this.children[k];}};
}
function title(save,archive=[],layout='departure'){
  const elements=Object.fromEntries(['scr-title','bt-new','bt-continue','cont-info','last-journey','title-last-record'].map(k=>[k,element()]));
  elements['scr-title'].dataset.titleLayout=layout;
  elements['bt-new'].classList.toggle('primary',true);
  const c={SAVE_KEY:'test',G:{hasSave:()=>save!==null,qualityArchive:()=>archive},
    localStorage:{getItem:()=>save,setItem(){throw Error('title must not write saves');}},
    $:s=>elements[s.slice(1)],previousJourneyHtml:last=>`record:${last.id}`};
  vm.runInNewContext(between(ui,'  function refreshTitle(){','  function previousJourneyHtml(')+';refreshTitle();',c);
  return {elements,c,refresh:()=>vm.runInNewContext('refreshTitle()',c)};
}
test('fresh title has one primary action and does not expose sample save data',()=>{
  const {elements:e}=title(null);
  assert.equal(e['bt-continue'].style.display,'none');
  assert(e['bt-new'].classList.contains('primary'));
  assert.equal(e['scr-title'].dataset.hasSave,'false');
  assert(e['title-last-record'].hidden);
  assert.doesNotMatch(dom,/saved-example|draft-controls/);
});
test('real continuation gets priority, round-trip refresh restores it without changing storage',()=>{
  const save=JSON.stringify({day:4,stats:{km:42.7},mode:'onroad'});
  for(let i=0;i<2;i++){
    const {elements:e}=title(save);
    assert.equal(e['bt-continue'].style.display,'flex');
    assert.equal(e['cont-info'].textContent,'DAY 4 · 43km 주행 · 온로드');
    assert(!e['bt-new'].classList.contains('primary'));
  }
  assert.equal(title(JSON.stringify({day:2,stats:{km:10},mode:'offroad'})).elements['cont-info'].textContent,'DAY 2 · 10km 주행 · 오프로드');
});
test('invalid/absent save cannot leave a stale continue action',()=>{
  for(const save of ['bad JSON','null','{}']){
    const {elements:e}=title(save);
    assert.equal(e['bt-continue'].style.display,'none');
    assert(e['bt-new'].classList.contains('primary'));
  }
  const t=title(JSON.stringify({day:1,stats:{km:3}}));
  t.c.G.hasSave=()=>false;t.refresh();
  assert.equal(t.elements['bt-continue'].style.display,'none');
});
test('archive disclosure contains real history only and closes when history disappears',()=>{
  const t=title(null,[{id:'actual'}]),e=t.elements;
  assert.equal(e['last-journey'].innerHTML,'record:actual');
  assert.equal(e['title-last-record'].hidden,false);
  e['title-last-record'].open=true;t.c.G.qualityArchive=()=>[];t.refresh();
  assert(e['title-last-record'].hidden);assert.equal(e['title-last-record'].open,false);
});
test('legacy title presentation is not switched by refresh or gated stylesheet',()=>{
  const e=title(JSON.stringify({day:1,stats:{km:1}}),[],'').elements;
  assert(e['bt-new'].classList.contains('primary'));
  assert.equal(e['scr-title'].dataset.hasSave,undefined);
  const gate=between(styles,'/* Structural gate:','/* ── installable phone app');
  for(const rule of gate.split('\n').filter(r=>r.includes('{')&&!r.startsWith('@')))
    assert.match(rule,/\[data-title-layout="(?:departure|wharf)"\]/);
  assert.match(gate,/overflow-y:auto/);assert.match(gate,/object-fit:contain/);
  assert.match(gate,/@media \(max-height:690px\)/);assert.match(gate,/:focus-visible/);
});
test('title hero reuses existing offline asset sources and never initializes old animation',()=>{
  const scene=fs.readFileSync('src/05-scene.js','utf8');
  const els={'scr-title':{dataset:{titleLayout:'departure'}},'title-harbor':{},'title-dalguji':{}};
  const calls=[];
  vm.runInNewContext(between(scene,'  function initTitle(canvas){','  function drawTitle(dt){')+';initTitle(null);',{
    document:{getElementById:id=>els[id]},ROAD_ENVIRONMENT:{source:id=>{calls.push(id);return 'data:image/webp;base64,harbor';}},
    vanBodyArt:{src:'data:image/webp;base64,vehicle'}});
  assert.deepEqual(calls,['busan']);
  assert.equal(els['title-harbor'].src,'data:image/webp;base64,harbor');
  assert.equal(els['title-dalguji'].src,'data:image/webp;base64,vehicle');
  assert.doesNotMatch(between(dom,'<!-- ══ TITLE ══ -->','<div class="sheet-wrap"'),/src="https?:|data:image/);
});
test('existing entry and return actions are preserved; title sound toggles actual SND',()=>{
  const actions=[];const els=Object.fromEntries(['bt-new','bt-continue','bt-preview','bt-previewback','early-sound','bt-title-sound'].map(k=>[k,{}]));
  const c={$:s=>els[s.slice(1)],startNew:mode=>actions.push('name:'+mode),show:s=>actions.push(s),
    renderPreview:()=>actions.push('preview'),SND:{enable:()=>actions.push('enable'),toggle:()=>actions.push('toggle')},
    G:{load:()=>true},enterGame:()=>actions.push('game')};
  const lines=ui.split('\n').filter(l=>/^\s*\$\('#bt-(new|continue|previewback)'\)\.onclick=/.test(l));
  vm.runInNewContext(lines.join('\n')+"\nconst titleSound=$('#bt-title-sound');if(titleSound)titleSound.onclick=()=>SND.toggle();",c);
  els['bt-new'].onclick();els['bt-continue'].onclick();els['bt-previewback'].onclick();els['bt-title-sound'].onclick();
  assert.deepEqual(actions,['name:onroad','enable','game','scr-title','toggle']);
  assert.match(ui,/\$\('#bt-preview'\)\.onclick=\(\)=>\{ renderPreview\(\); show\('scr-preview'\)/);
  assert.doesNotMatch(between(ui,'  function startNew(mode){','  function introName()'),/G\.newGame|localStorage\.setItem/);
});
test('both sound controls reflect persisted audio choice and meaningful pressed state',()=>{
  const audio=fs.readFileSync('src/07e-ui-audio.js','utf8');
  const els={'early-sound':element(),'bt-title-sound':element()};
  for(const e of Object.values(els))e.children={'.sound-icon':element(),'.sound-label':element()};
  const c={on:true,$:s=>els[s.slice(1)]};
  vm.runInNewContext(between(audio,'  function syncUi(){','  function setEnabled(')+';syncUi();',c);
  for(const e of Object.values(els)){assert.equal(e.attrs['aria-pressed'],'true');assert.equal(e.children['.sound-label'].textContent,'소리 끄기');}
  c.on=false;vm.runInNewContext('syncUi()',c);
  for(const e of Object.values(els))assert.equal(e.attrs['aria-pressed'],'false');
});
test('build contains the approved title without duplicate asset embedding or placeholders',()=>{
  const built=fs.readFileSync('서울까지400km.html','utf8');
  assert.match(built,/id="scr-title" data-title-layout="wharf"/);
  assert(/ROAD_ENVIRONMENT\.source\(['"`]busan['"`]\)/.test(built));
  assert.doesNotMatch(built,/__UI_JOURNEY_DALGUJI_BASE__|\/\*__ROAD_ENVIRONMENTS__\*\//);
  assert(fs.statSync('서울까지400km.html').size<80_000_000);
  for(const id of ['title-harbor','bt-new','bt-continue','bt-preview','bt-title-sound','bt-song','bt-install'])
    assert.equal((dom.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
});
