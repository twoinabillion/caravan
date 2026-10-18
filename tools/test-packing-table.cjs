const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'tools/design-drafts');
const html=fs.readFileSync(path.join(folder,'packing-table.html'),'utf8');
const css=fs.readFileSync(path.join(folder,'packing-table.css'),'utf8');

test('packing draft is discoverable, local and independent of the game',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
  assert.equal(new Set(manifest.drafts.map(d=>d.id)).size,manifest.drafts.length);
  assert(manifest.drafts.slice(0,40).some(d=>d.id==='packing-table-v1'&&d.file==='packing-table.html'));
  assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:/i);
  assert.match(html,/default-src 'none'/);assert.match(html,/form-action 'none'/);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'tools/build-html.mjs'),'utf8'),/packing-table/);
  for(const [,file] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){
    assert(!/^https?:|^\/\//.test(file));assert(fs.existsSync(path.resolve(folder,file)),file);
  }
});

test('all three choices use existing plates and expose the exact current additions',()=>{
  const data=fs.readFileSync(path.join(root,'src/03-data.js'),'utf8');
  const {packs,supplies}=vm.runInNewContext(data.slice(0,data.indexOf('D.transferDeadlineDay'))+';({packs:D.departurePacks,supplies:D.departureSupplies})');
  const fields=['fuel','scrap','water','food','parts','van'];
  assert.equal((html.match(/name="cargo"/g)||[]).length,3);
  assert.equal((html.match(/name="cargo"[^>]*\bchecked\b/g)||[]).length,1);
  assert.match(html,/<input id="cargo-provisions"[^>]*checked/);
  for(const [id,pack] of Object.entries(packs)){
    const choice=html.match(new RegExp(`<input id="cargo-${id}"[\\s\\S]*?</label>`))[0];
    assert(choice.includes(pack.nm));assert(choice.includes(pack.addition));
    assert(choice.includes(`../../assets/scenes/opening-pack-${id}-v1.webp`));
    const block=html.match(new RegExp(`<dl class="inventory-${id}"[\\s\\S]*?</dl>`))[0];
    const shown=[...block.matchAll(/<dd[^>]*>(.*?)<\/dd>/g)].map(m=>m[1]);
    assert.deepEqual(shown,fields.map(k=>String(supplies(id)[k])+(k==='fuel'?'L':k==='van'?'%':'')));
    assert(css.includes(`#cargo-${id}:checked) .inventory-${id}`));
  }
});

test('native choice, disclosure and back paths have accessible labels and valid targets',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,target] of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(target),target);
  for(const [,target] of html.matchAll(/for="([^"]+)"/g))assert(ids.includes(target),target);
  for(const [,names] of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)){
    for(const name of names.split(/\s+/))assert(ids.includes(name),name);
  }
  assert.match(html,/id="packing-name"[^>]*maxlength="8"/);
  assert.match(html,/<details class="packing-inventory">/);
  assert.match(html,/id="large-type" type="checkbox"/);
  assert.match(html,/다음은 감천 작업장/);assert.match(html,/게임을 시작하거나 저장을 바꾸지 않는다/);
  assert.match(css,/packing-shell:has\(\.packing-note:target\)[^{]*\{visibility:hidden\}/);
});

test('packing layout has one stylesheet, explicit scrolling and visible focus',()=>{
  require('postcss').parse(css);
  assert.doesNotMatch(css,/!important|line-clamp|text-overflow|animation:/);
  assert.match(css,/\.packing-scroll\{[^}]*min-height:0[^}]*overflow-y:auto/);
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(css,/input:focus-visible/);
  assert.match(css,/@media\(max-width:340px\)/);
  assert.match(css,/body:has\(#large-type:checked\)/);
  assert.doesNotMatch(css,/#scr-name|#ev-wrap|#quest-ledger|src\/01-style/);
});
