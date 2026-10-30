const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {runImageMagick}=require('./imagemagick.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const atlas=JSON.parse(read('tools/design-drafts/landscape-atlas/manifest.json'));
const graph=JSON.parse(read('assets/ui/road-routes/manifest.json'));
const index=read('tools/design-drafts/landscape-atlas.html');
const css=read('tools/design-drafts/landscape-atlas.css');
test('exact graph coverage, authored terrain and explicit evidence limits',()=>{
  assert.equal(atlas.routes.length,78);assert.equal(Object.keys(atlas.places).length,58);
  assert.deepEqual(atlas.routes.map(r=>[r.id,r.from,r.to,r.km]),graph.routes.map(r=>[r.id,r.from,r.to,r.km]));
  assert.equal(atlas.routes.filter(r=>r.status==='reused').length,72);
  assert.equal(atlas.routes.filter(r=>r.status==='seed').length,1);
  assert.equal(new Set(atlas.routes.map(r=>r.flow)).size,78);
  for(const r of atlas.routes){
    assert(r.flow.length>25);assert(r.geographySources.length);
    for(const id of r.geographySources)assert(atlas.sources[id]);
    assert.equal(r.checks.productionEndpointContinuity,false);assert.equal(r.checks.gameplayCrop,false);
  }
  assert.match(atlas.geography,/not exact/);assert.match(index,/기존 큰 원본 72개/);
});
test('all route pages have functioning local navigation, isolated native controls and no game mutation',()=>{
  for(const file of ['tools/design-drafts/landscape-atlas.html',...atlas.routes.map(r=>`tools/design-drafts/landscape-atlas/${r.id}.html`)]){
    const html=read(file);
    assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:/i);
    assert.match(html,/default-src 'none'/);assert.match(html,/게임 미적용|게임 반영/);
    for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(url.startsWith('https:'))continue;
      assert(fs.existsSync(path.resolve(root,path.dirname(file),url.split('#')[0])),`${file}: ${url}`);
    }
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
    if(file.includes('/landscape-atlas/')){
      assert.equal([...html.matchAll(/name="position"/g)].length,4);
      assert.match(html,/id="reverse"/);assert.match(html,/id="pause"/);assert.match(html,/다음 길 보기/);
    }
  }
  const drafts=JSON.parse(read('tools/design-drafts/manifest.json')).drafts;
  assert(drafts.some(d=>d.id==='landscape-atlas-v1' && d.file==='landscape-atlas.html'));
  // The study stays isolated after the separately authorized production import.
  // Production embeds reviewed images/metadata, never the draft HTML or controls.
  for(const file of ['tools/build-html.mjs','src/05a-road-environment.js','src/05e-road-continuity.js'])
    assert.doesNotMatch(read(file),/tools\/design-drafts\/landscape-atlas/);
});
test('single panorama, reverse camera not mirrored terrain, pause/static/reduced-motion retained',()=>{
  require('postcss').parse(css);
  const base=read('tools/design-drafts/busan-yangsan-landscape.css');
  assert.match(css,/@import url\("busan-yangsan-landscape.css"\)/);
  assert.match(css,/@keyframes atlas-reverse\{from\{transform:translateX\(-50%\)\}to\{transform:translateX\(0\)\}\}/);
  assert.doesNotMatch(css,/terrain\{[^}]*scaleX/);assert.doesNotMatch(css,/infinite|scaleY|blur\(/);
  assert.match(base,/animation-play-state:paused/);assert.match(base,/prefers-reduced-motion:reduce/);
});
test('all masters and deliveries preserve hashes, native resolution and alpha; new prompts have canon references',()=>{
  const jobs=JSON.parse(read('tools/landscape-atlas-prompts.json')).jobs;
  assert.equal(jobs.length,5);
  for(const job of jobs){assert.equal(job.references.length,5);assert.match(job.prompt,/3:1/);for(const ref of job.references)assert(fs.existsSync(path.join(root,ref)));}
  for(const r of atlas.routes){
    for(const [file,hash] of [[r.master,r.masterSha256],[r.delivery,r.sha256]])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash);
    assert(r.masterSize[0]>=2160);assert(r.masterSize[1]>=720);
    const values=runImageMagick([path.join(root,r.delivery),'-format','%w %h %[channels]','info:'],{encoding:'utf8'}).split(' ');
    assert.deepEqual(values.slice(0,2),['2160','720']);assert.match(values[2],/a/);
    assert(fs.statSync(path.join(root,r.delivery)).size<850000);
  }
});
