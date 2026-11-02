// Production forecast renderer, all choice buttons; controlled VM, not a human playtest.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const source=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){const h=setup();h.run(source.slice(source.indexOf('  const esc='),source.indexOf('  const stripTags=')));
 for(const name of ['safeHtml','choiceActionLabel','storyResourceIcon','storyExpenseText','storyExpenseHtml','eventChoiceData']){const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);assert(start>=0&&end>start);h.run(source.slice(start,end));}return h;}
function rows(h,id){h.run(`globalThis.e=event('${id}')`);const before=h.run('JSON.stringify([S,e])'),html=h.run('eventChoiceData(e).html');assert.equal(h.run('JSON.stringify([S,e])'),before);return [...html.matchAll(/<button[^>]*data-i="(\d+)"[^>]*aria-label="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g)].map(m=>({i:+m[1],aria:m[2],visible:m[3].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')}));}
test('first-road fastest copy exposes guaranteed vehicle observation on its own choice page',()=>{
 const h=fixture(),r=rows(h,'onboarding_first_road');assert.equal(r.length,3);assert.equal(r[2].i,2);
 for(const text of [r[2].aria,r[2].visible])assert.match(text,/달구지가 관측망에 등록된다/);
 for(const safe of r.slice(0,2))assert.doesNotMatch(safe.visible,/관측망에 등록/);
 assert.equal(h.run('e.choices[2].out[0].fx.pursuit'),1);
});
test('each fork button discloses corridor commitment alongside existing live route forecast',()=>{
 const h=fixture();h.run("S.at='gimcheon'");const r=rows(h,'route_mid_fork');assert.equal(r.length,2);
 for(const row of r){for(const text of [row.visible,row.aria])assert.match(text,/청주까지 노선 변경 불가/);assert.match(row.visible,/km/);assert.match(row.visible,/연료/);}
 assert.equal(h.run('e.choices[0].out[0].fx.routeChoice'),'ridge');assert.equal(h.run('e.choices[1].out[0].fx.routeChoice'),'market');
});
test('first Minji task makes both vehicle-spending approaches explicit without revealing rewards',()=>{
 const h=fixture(),r=rows(h,'rq_minji_task');assert.equal(r.length,3);
 for(const text of [r[1].aria,r[1].visible]){assert.match(text,/고철 4/);assert.match(text,/차체 최대 3%/);}
 for(const text of [r[2].aria,r[2].visible])assert.match(text,/차체 최대 12%/);
 assert.doesNotMatch(r.map(x=>x.visible).join(' '),/차체 \+2|연료 소모 -5|고철 \+2/);
 assert.equal(h.run('e.choices[1].out[0].fx.van'),-3);assert.equal(h.run('e.choices[2].out[0].fx.van'),-12);
});
test('historic contract projection strips only exact reviewed forecast values, including recovery clone',()=>{
 const project=require('../tools/choice-experience-contract.cjs'),h=fixture();
 for(const id of ['onboarding_first_road','main_recovery_onboarding_first_road','route_mid_fork','rq_minji_task']){
  const e=h.json(`event('${id}')`),before=JSON.parse(JSON.stringify(e));project(e);
  for(let i=0;i<e.choices.length;i++){const old={...before.choices[i]};delete old.foreseeable;const now={...e.choices[i]};delete now.foreseeable;assert.deepEqual(now,old);}
  const wrong=h.json(`event('${id}')`);wrong.choices[id==='route_mid_fork'?0:id==='rq_minji_task'?1:2].foreseeable={expense:'unreviewed'};assert.throws(()=>project(wrong),/exact reviewed forecast/);
 }
 const unrelated={id:'unrelated',choices:[{foreseeable:{expense:'retain'}}]};assert.deepEqual(project(unrelated),{id:'unrelated',choices:[{foreseeable:{expense:'retain'}}]});
});
