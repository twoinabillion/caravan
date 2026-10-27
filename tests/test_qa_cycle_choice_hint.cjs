// Actual authored choices + production HTML renderer; not browser/visual QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const source=fs.readFileSync('src/07-ui.js','utf8');
function fixture(){const h=setup();h.run(source.slice(source.indexOf('  const esc='),source.indexOf('  const stripTags=')));
 for(const name of ['safeHtml','choiceActionLabel','storyResourceIcon','storyExpenseText','storyExpenseHtml','eventChoiceData']){const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);assert(start>=0&&end>start);h.run(source.slice(start,end));}return h;}
function row(h,index){const html=h.run('eventChoiceData(e).html');const match=html.match(new RegExp('<button[^>]*data-i="'+index+'"[^>]*aria-label="([^"]*)"[^>]*>([\\s\\S]*?)</button>'));assert(match,'authored choice '+index+' rendered');return {aria:match[1],visible:match[2].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim(),html:match[0]};}
test('underground generic risk appears once in both visible and accessible choice forecasts',()=>{
 for(const combat of [false,true]){const h=fixture();h.run("globalThis.e={...event('exp_underground')}"+(combat?';e.combat={}':''));const before=h.run('JSON.stringify([S,e])'),r=row(h,0);assert.equal((r.visible.match(/위험/g)||[]).length,1);assert.equal((r.aria.match(/위험/g)||[]).length,1);assert.doesNotMatch(r.visible,/위험\s*·\s*위험/);assert.equal(h.run('JSON.stringify([S,e])'),before);assert.equal(h.run('e.choices[0].risk'),'위험');}
});
test('specific risk explanations remain intact and resource requirements stay actionable',()=>{
 const h=fixture();h.run("S.fuel=2;globalThis.e=event('exp_reservoir')");const before=h.run('JSON.stringify(S)'),risk=row(h,1),boil=row(h,0);assert.match(risk.visible,/위험 · 배탈 위험/);assert.match(risk.aria,/위험 · 배탈 위험/);assert.match(boil.visible,/연료 2L/);assert.doesNotMatch(boil.html,/disabled/);assert.equal(h.run('JSON.stringify(S)'),before);
 h.run('S.fuel=1');assert.match(row(h,0).html,/disabled aria-disabled="true"/);assert.equal(h.run('S.fuel'),1);
});
test('finale dissent and its real bond cost are preserved in visible and accessible forecasts',()=>{
 const h=fixture();h.run("S.party=['jaeyi'];globalThis.e=event('seoul_decision')");const before=h.run('JSON.stringify(S)'),r=row(h,0);assert.match(r.visible,/재이의 반대를 누르는 결정 · 유대 -6/);assert.match(r.aria,/재이의 반대를 누르는 결정 · 유대 -6/);assert.equal(h.run('JSON.stringify(S)'),before);
});
