const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
const folder=path.resolve(__dirname,'design-drafts');
const html=fs.readFileSync(path.join(folder,'opening-presence.html'),'utf8');
const css=fs.readFileSync(path.join(folder,'opening-presence.css'),'utf8');
const ctx=vm.createContext({console});
for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const D=vm.runInContext('D',ctx);
const sections=Object.fromEntries([...html.matchAll(/<section id="([^"]+)"[\s\S]*?<\/section>/g)].map(m=>[m[1],m[0]]));
const plain=s=>s.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();

test('opening presence is visible in Studio but isolated from game, save, scripts and audio',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
  const entry=manifest.drafts.slice(0,40).find(d=>d.id==='opening-presence-v1');
  assert.equal(entry.file,'opening-presence.html');
  assert.match(entry.description,/自動|자동 적용하지 않습니다/);
  assert.match(entry.description,/발췌/);
  assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|<audio\b|<video\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html,/default-src 'none'/);
  assert.match(html,/form-action 'none'/);
  assert.doesNotMatch(fs.readFileSync('tools/build-html.mjs','utf8'),/opening-presence/);
  for(const [,file]of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){
    assert(!/^(?:https?:)?\/\//.test(file),file);
    assert(fs.existsSync(path.resolve(folder,file)),file);
  }
});

test('all native next/back routes and labels resolve; both key branches meet the same farewell',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const [,id]of html.matchAll(/(?:href="#|for=")([^"]+)"/g))assert(ids.includes(id),id);
  for(const [,names]of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g))
    for(const name of names.split(/\s+/))assert(ids.includes(name),name);
  for(const key of ['key-given','key-kept'])assert.match(sections[key],/href="#farewell"/);
  for(const [from,to]of [['present','memory'],['memory','appeal'],['appeal','module'],['module','departure'],['farewell','promise'],['promise','ignition'],['ignition','first-road'],['first-road','present']])
    assert(sections[from].includes(`href="#${to}"`),from+' → '+to);
  assert(sections.appeal.includes('href="#history"'));
  assert(sections.history.includes('href="#appeal"'));
});

test('present, first-hand memory and reported history have explicit non-colour time/source cues',()=>{
  assert.match(sections.present,/class="time-kind">지금/);
  assert.match(sections.memory,/내 기억/);
  assert.match(sections.memory,/여덟 살 · 서울을 떠나던 밤/);
  assert.match(sections.appeal,/다시 지금/);
  assert.match(sections.history,/출처 · 할아버지의 이야기/);
  assert.match(sections.history,/내가 본 일이 아니다/);
  for(const id of ['memory','history'])assert.doesNotMatch(sections[id],/DAY|07:55|08:45|부품 [−+]\d|시간 \d+분/);
});

test('dialogue excerpts come from actual authored turns and retain named farewell speakers',()=>{
  const snippets=[...html.matchAll(/<p[^>]*data-source="([^":]+):(\d+)"[^>]*>([\s\S]*?)<\/p>/g)];
  assert(snippets.length>=20);
  for(const [,id,index,text]of snippets){
    const source=D.openingDeparture.find(e=>e.id===id)?.turns||D.intro.find(p=>p.scene===id)?.beats;
    assert(source&&source[index],id+':'+index);
    assert(plain(source[index].text).includes(plain(text)),id+':'+index+' '+plain(text));
  }
  assert.match(sections.farewell,/도윤/);
  assert.match(sections.farewell,/남산에 가면 우리도 집에 돌아갈 수 있어요/);
  assert.match(sections.farewell,/하지만 아직은 몰라/);
  assert.match(sections.promise,/하진/);
  assert.match(sections.promise,/먼저 떠난 사람들도 찾아보겠습니다/);
  assert.match(sections.ignition,/할아버지, 다녀올게/);
  assert.match(sections.departure,/class="thought"/);
});

test('both key outcomes preserve their authored material; ignition happens only in the handoff',()=>{
  const choices=D.openingDeparture.find(e=>e.id==='opening_departure').choices;
  const given=sections['key-given'].match(/data-result="leave_key"[^>]*>([\s\S]*?)<\/p>/)[1];
  const kept=sections['key-kept'].match(/data-result="keep_key"[^>]*>([\s\S]*?)<\/p>/)[1];
  assert.equal(plain(given),choices[0].out[0].text);
  assert(choices[1].out[0].text.startsWith(plain(kept)));
  assert.match(sections['key-kept'],/ignition-moved-to-handoff/);
  for(const id of ['key-given','key-kept','farewell','promise'])assert.doesNotMatch(sections[id],/시동 모터가/);
  assert.equal((html.match(/시동 모터가 한 번 헛돌았고/g)||[]).length,1);
  assert.match(sections['first-road'],/주행을 재현하지 않습니다/);
  assert.match(sections['first-road'],/초안은 무음입니다/);
});

test('one draft owner keeps art and reading geometry stable with accessible overflow and large type',()=>{
  require('postcss').parse(css);
  assert.match(css,/\.story-page\{grid-template-rows:64px var\(--art\) minmax\(0,1fr\) auto/);
  assert.match(css,/\.scene-art\{[^}]*height:var\(--art\)/);
  assert.match(css,/\.reading-scroll\{min-height:0;overflow-y:auto/);
  assert.match(css,/body:has\(#large-type:checked\)\{--copy:21px\}/);
  assert.match(css,/focus-visible/);
  assert.match(css,/@media\(max-width:340px\)/);
  assert.match(css,/@media\(max-height:540px\)/);
  assert.doesNotMatch(css,/!important|line-clamp|text-overflow|#scr-|#ev-wrap|animation:|filter:/);
  assert(!css.match(/(?:memory-page|reported-page)[^}]*--art:/));
});
