import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {connectedJourney as plan, cameraPosition, frame, sampleTimeline} from './connected-journey-plan.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('tools/design-drafts/connected-journey.html');
const css=read('tools/design-drafts/connected-journey.css');
test('both legs use one unmirrored Yangsan frame for arrival, stop, onward departure and reverse',()=>{
  for(const width of [320,360,480]){
    const reference=frame({at:'yangsan'},width);
    for(const state of [
      {from:'busan',to:'yangsan',gone:20},{from:'yangsan',to:'miryang',gone:0},
      {from:'miryang',to:'yangsan',gone:34},{from:'yangsan',to:'busan',gone:0},
    ])assert.deepEqual(frame(state,width),reference);
    assert.deepEqual(frame(JSON.parse(JSON.stringify({at:'yangsan'})),width),reference);
    assert.equal(reference.sourceX,540);assert.equal(reference.sourceWidth,1080);
  }
  assert.equal(plan.productionApproved,false);
});
test('full route and reverse cover continuous source pixels without stretching or gaps',()=>{
  for(const leg of plan.legs)for(const width of [320,360,480])for(let i=0;i<=100;i++){
    const p=i/100;
    const f=frame({...leg,gone:leg.km*p},width);
    const r=frame({from:leg.to,to:leg.from,gone:leg.km*(1-p)},width);
    assert(Math.abs(f.sourceX-r.sourceX)<1e-9);
    assert(f.sourceX>=0 && f.sourceX+f.sourceWidth<=2160);
    assert.equal(f.width/f.height,3);assert.equal(f.mirrored,false);
    assert(f.sourceWidth>=width*2);
  }
  assert.throws(()=>cameraPosition({at:'other'}));assert.throws(()=>cameraPosition({from:'busan',to:'miryang'}));
  assert.throws(()=>frame({at:'busan'},0));assert.throws(()=>sampleTimeline(NaN));
});
test('continuous zero-speed stop and restart, not a boolean scenery switch',()=>{
  for(const reverse of [false,true]){
    for(const t of [40,41,45,49,50])assert.deepEqual(sampleTimeline(t,reverse).camera,.5);
    for(const t of [0,40,45,50,90,100])assert.equal(sampleTimeline(t,reverse).speed,0);
    for(const t of [39.999,50.001,89.999])assert(sampleTimeline(t,reverse).speed<0.000002);
    let previous=sampleTimeline(0,reverse).camera;
    for(let t=.1;t<=100;t+=.1){const next=sampleTimeline(t,reverse).camera;assert(reverse?next<=previous:next>=previous);assert(Math.abs(next-previous)<.002);previous=next;}
  }
  assert.match(css,/40%,50%\{--camera:\.5\}/);assert.match(css,/90%,100%\{--camera:1\}/);
  assert.match(css,/cubic-bezier\(\.3333333333,0,\.6666666667,1\)/);
  assert.match(css,/animation-play-state:paused/);assert.match(css,/prefers-reduced-motion:reduce/);
});
test('isolated native controls, shared geometry and local links',()=>{
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:/i);
  assert.equal([...html.matchAll(/name="position"/g)].length,6);
  for(const key of ['arrival','stop','departure'])assert.match(html,new RegExp(`value="${key}"`));
  // None of the three Yangsan states supplies its own terrain or camera.
  for(const key of ['arrival','stop','departure'])assert.doesNotMatch(css,new RegExp(`\\[value="${key}"\\][^{]+\\.world`));
  assert.match(css,/width:200%/);assert.match(css,/translateX\(calc\(var\(--view\) \* -50%\)\)/);
  assert.doesNotMatch(css,/scaleY|blur\(|\.terrain[^}]*scaleX/);
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g))if(!url.startsWith('https:'))assert(fs.existsSync(path.resolve(root,'tools/design-drafts',url)));
  const manifest=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert(manifest.drafts.some(d=>d.id==='connected-journey-v1'&&d.file==='connected-journey.html'));
  // The study stays isolated even after its separately approved runtime integration.
  assert.doesNotMatch(html,/05e-road-continuity|서울까지400km\.html|\/game\?/);
  assert.doesNotMatch(read('tools/connected-journey-plan.mjs'),/localStorage|sessionStorage/);
});
test('candidate geometry and required references exist, not falsely marked opaque or approved',()=>{
  const size=execFileSync('magick',[path.join(root,plan.asset),'-format','%w %h %[channels]','info:'],{encoding:'utf8'});
  assert.match(size,/^2160 720 srgba/);assert(fs.statSync(path.join(root,plan.asset)).size<850000);
  const prompt=JSON.parse(read('tools/design-drafts/connected-journey-prompt.json'));
  assert.equal(prompt.references.length,5);for(const ref of prompt.references)assert(fs.existsSync(path.join(root,ref)));
  assert.match(prompt.revision2.change,/collapsed overpass/);
});
