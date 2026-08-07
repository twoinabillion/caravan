#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const dataSource=fs.readFileSync(path.join(root,'src/03-data.js'),'utf8');
const engineSource=['04a-engine-core.js','04b-engine-crew.js','04c-engine-travel.js','04d-engine-director.js','04e-engine-world.js']
  .map(n=>fs.readFileSync(path.join(root,'src',n),'utf8')).join('\n');
const uiSource=['07-ui.js','07e-ui-audio.js']
  .map(name=>fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n');
const styleSource=fs.readFileSync(path.join(root,'src/01-style.html'),'utf8');
const D=new Function(dataSource+'\nreturn D;')();
const failures=[];
const pass=(label,ok,detail='')=>{
  console.log(`${ok?'✅':'❌'} ${label}${detail?` — ${detail}`:''}`);
  if(!ok) failures.push(label);
};

const memories=Object.values(D.choiceMemories||{}).flat().filter(Boolean);
pass('17 key choices have immediate memory and near callback data',
  memories.length===17&&memories.every(memory=>memory.summary&&memory.afterKm>0&&memory.lines?.length),
  `${memories.length}/17`);
pass('all remembered choices receive a late completion callback',
  /for\(const memory of memories\)/.test(engineSource)&&/qualityChoiceLate\(memory\.id/.test(engineSource));

const companions=Object.keys(D.comps||{});
pass('all six companions have complete voice sheets',companions.length===6&&companions.every(id=>{
  const voice=D.companionVoices&&D.companionVoices[id];
  return voice&&['vocabulary','rhythm','humor','avoidance','silence'].every(field=>voice[field])&&voice.forbidden?.length>=3;
}),`${Object.keys(D.companionVoices||{}).length}/6`);

const recruitRows=Object.entries(D.recruitQuests||{});
pass('every recruitment approach has an in-journey and ending callback',recruitRows.length===6&&recruitRows.every(([,quest])=>{
  const approaches=Object.values(quest.approaches||{});
  return approaches.length>=2&&approaches.every(approach=>approach.memory&&approach.drive?.title&&approach.drive?.effect);
})&&engineSource.includes('G.recruitApproachEchoes()')&&engineSource.includes('_approach_ending'),`${recruitRows.length}/6 companions`);

const events=D.events||[];
const upgrades=D.upgrades||[];
const externallyUsed=upgrades.filter(up=>{
  const inEngine=new RegExp(`\\b${up.id}\\b`).test(engineSource);
  const inEvent=events.some(event=>event.needUp===up.id||(event.choices||[]).some(choice=>choice.req&&choice.req.up===up.id));
  const inDialogue=(D.banter||[]).some(line=>line.need&&line.need.up===up.id);
  return inEngine||inEvent||inDialogue||Boolean(up.seat);
});
const upgradeCoverage=Math.round(externallyUsed.length/Math.max(1,upgrades.length)*100);
pass('at least 80% of upgrades affect play beyond a status number',upgradeCoverage>=80,
  `${externallyUsed.length}/${upgrades.length} · ${upgradeCoverage}%`);

const combats=events.filter(event=>event.combat);
pass('combat/rescue/escort stages declare intent and at least two counters',
  combats.length>=15&&combats.every(event=>event.combat.intent&&Object.keys(event.combat.counters||{}).length>=2),
  `${combats.length} stages`);
pass('combat uses distinct confirmation/success/partial/failure cue language',
  ['confirm','success','partial','failure'].every(cue=>uiSource.includes(`case '${cue}'`)));

const settlements=Object.entries(D.stls||{});
pass('every major settlement has a distinct persistent field interaction',
  settlements.length===7&&settlements.every(([,stl])=>stl.field&&stl.field.actions?.length>=3),
  `${settlements.filter(([,stl])=>stl.field).length}/${settlements.length}`);
pass('seven named regional ambience identities plus Busan and Seoul are mapped',
  ['busan','gwangju','miryang','daegu','muju','jeonju','daejeon','suwon','seoul']
    .every(id=>new RegExp(`\\b${id}:\\[`).test(uiSource)));

const plans=Object.values(D.routePlans||{});
pass('major route contracts expose distance, risk, supply/story promise, and payoff',
  plans.length===2&&plans.every(plan=>plan.corridor?.length>=5&&plan.promise&&plan.reward));
pass('arrival recap records forecast payoff dimensions',
  ['minutes','events','build','changes','routeCompleted'].every(field=>engineSource.includes(field))&&uiSource.includes('arrival-ledger'));
pass('second-play onboarding collapses while previous-run identity remains visible',
  engineSource.includes('G.qualityArchive().length')&&uiSource.includes('previousJourneyHtml'));

let simulation=null;
try{ simulation=JSON.parse(fs.readFileSync(path.join(root,'reports/journey-simulation.json'),'utf8')); }catch{}
const policies=simulation&&simulation.byPolicy;
const explorer=policies&&policies.explorer&&policies.explorer.completionRate;
const policyRates=policies&&Object.values(policies).map(row=>row.completionRate);
const spread=policyRates&&Math.max(...policyRates)-Math.min(...policyRates);
pass('1,000-run completion remains within release guardrails',
  simulation?.runs===1000&&simulation.overall.completionRate>=94&&simulation.overall.completionRate<=99,
  simulation?`${simulation.overall.completionRate}%`:'report missing');
pass('explorer policy is viable and within 7 points of the best policy',
  explorer>=93&&explorer<=97&&spread<=7,policies?`${explorer}% · spread ${spread.toFixed(1)}`:'report missing');
pass('crisis experience remains in the authored target band',
  simulation?.overall.crisisRunRate>=12&&simulation.overall.crisisRunRate<=30,
  simulation?`${simulation.overall.crisisRunRate}%`:'report missing');

pass('large-text, reduced-motion, and 44px control rules remain in the stylesheet',
  styleSource.includes('.ui-large-text')&&styleSource.includes('.ui-reduce-motion')&&/min-height:44px/.test(styleSource));

if(failures.length){
  console.error(`\nQuality 9 implementation audit failed: ${failures.length}`);
  process.exit(1);
}
console.log('\n✅ Quality 9 implementation audit passed');
