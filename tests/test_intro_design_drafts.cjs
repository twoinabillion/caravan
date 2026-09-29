const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const draftDir=path.join(root,'tools/design-drafts');
const files=['intro-recollection.html','intro-flow.html'];
const read=name=>fs.readFileSync(path.join(draftDir,name),'utf8');
const scene=read(files[0]), flow=read(files[1]);
const source=fs.readFileSync(path.join(root,'src/03-data.js'),'utf8');
const authored=id=>JSON.parse(JSON.stringify(require('node:vm').runInNewContext(
  '('+source.match(new RegExp("'"+id+"': (\\[[\\s\\S]*?\\n  \\]),"))[1]+')',Object.create(null),{timeout:1000}
)));
const beats=authored('intro-resistance-begins');
const nextBeats=authored('intro-parents-discovery').slice(0,2);
const strip=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const chunks=(html,attr='data-beat')=>[
  ...[...html.matchAll(new RegExp('<p class="narration" '+attr+'="(\\d+)">([\\s\\S]*?)</p>','g'))]
    .map(m=>({index:m.index,id:+m[1],text:strip(m[2]),kind:'narration'})),
  ...[...html.matchAll(new RegExp('<div class="exchange" '+attr+'="(\\d+)">[\\s\\S]*?</div><p>([\\s\\S]*?)</p></div>','g'))]
    .map(m=>({index:m.index,id:+m[1],text:strip(m[2]),kind:'dialogue'}))
].sort((a,b)=>a.index-b.index);
const sections=[...scene.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)];
const pageMap=new Map(sections.map(([,attrs,html])=>[attrs.match(/id="([^"]+)"/)[1],{attrs,html}]));
const visible=(layout,mode)=>layout==='shared'||layout===mode;
function copyFor(html,mode) {
  return [...html.matchAll(/<article class="page-copy" data-layout="([^"]+)">([\s\S]*?)<\/article>/g)]
    .filter(m=>visible(m[1],mode)).map(m=>m[2]).join('\n');
}
function actionFor(html,kind,mode) {
  return [...html.matchAll(new RegExp('<a class="'+kind+'-action" data-layout="([^"]+)" href="#([^"]+)"','g'))]
    .filter(m=>visible(m[1],mode)).map(m=>m[2]);
}
function journey(mode) {
  const pages=[]; let id='opening';
  do {
    assert(!pages.some(p=>p.id===id),'navigation cycle before returning home');
    const page=pageMap.get(id); assert(page,id);
    const actions=actionFor(page.html,'next',mode); assert.equal(actions.length,1);
    pages.push({id,...page}); id=actions[0];
  }while(id!=='opening');
  return pages;
}

test('v3 is recommended and earlier drafts are retained',()=>{
  const {drafts}=JSON.parse(read('manifest.json'));
  assert.equal(new Set(drafts.map(d=>d.id)).size,drafts.length);
  assert.equal(drafts[0].file,files[0]);
  assert.equal(drafts[0].revision,'3');
  assert.equal(drafts[0].recommended,true);
  for(const file of [...files,'situated-talk.html','situated-record.html','situated-cabin.html']) {
    assert(drafts.some(d=>d.file===file));
  }
});

test('both responsive reading paths reconstruct authored text without loss or duplication',()=>{
  assert.equal(beats.length,11);
  const paths=['roomy','compact'].map(mode=>journey(mode).map(p=>copyFor(p.html,mode)).join('\n'));
  for(const [html,attr,original] of [[paths[0],'data-beat',beats],[paths[1],'data-beat',beats],[flow,'data-beat',beats],[paths[0],'data-next-beat',nextBeats],[paths[1],'data-next-beat',nextBeats]]) {
    const parts=chunks(html,attr);
    assert.deepEqual([...new Set(parts.map(p=>p.id))],original.map((_,i)=>i));
    assert.deepEqual(parts.map(p=>p.id),parts.map(p=>p.id).sort((a,b)=>a-b));
    original.forEach((b,i)=>assert.equal(parts.filter(p=>p.id===i).map(p=>p.text).join(' '),strip(b.text)));
    parts.forEach(p=>assert.match(p.text,/[.!?]$/));
  }
});

test('eight story units expand to twelve only when space or large type needs it',()=>{
  assert.equal(sections.length,12);
  assert.deepEqual(journey('roomy').map(p=>p.id),['opening','question','dispersal','arrests','places','disagreement','seoul','parents']);
  assert.equal(journey('compact').length,12);
  for(const mode of ['roomy','compact']) {
    const path=journey(mode);
    path.forEach((p,i)=>{
      assert.equal(actionFor(p.html,'back',mode).length,i?1:0);
      if(i) assert.equal(actionFor(p.html,'back',mode)[0],path[i-1].id);
      const copy=copyFor(p.html,mode);
      assert(chunks(copy).length+chunks(copy,'data-next-beat').length>0);
    });
    assert.equal(chunks(copyFor(pageMap.get('opening').html,mode))[0].text,strip(beats[0].text));
  }
  sections.forEach(([,attrs,content])=>{
    assert.match(attrs,/tabindex="-1"/);
    assert.match(content,/class="reading-actions"/);
    for(const mode of ['roomy','compact']) {
      assert.equal(actionFor(content,'next',mode).length,1);
      // Continuation hashes remain readable even if type/viewport changes on that page.
      assert(copyFor(content,mode).trim());
    }
    assert.doesNotMatch(content,/<h[1-6]\b|<details\b|class="chapter-place"|class="history"/);
  });
});

test('every image, stylesheet and navigation target resolves locally',()=>{
  for(const file of files) {
    const html=read(file), ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size);
    for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      assert(!/^(?:https?:|data:|javascript:)/.test(url));
      const [base,fragment]=url.split('#');
      const pathname=base.split('?')[0];
      const target=pathname?path.resolve(draftDir,pathname):path.join(draftDir,file);
      assert(fs.existsSync(target),url);
      if(fragment) assert(fs.readFileSync(target,'utf8').includes('id="'+fragment+'"'),url);
    }
  }
});

test('prototypes cannot execute scripts, touch saves, or run gameplay',()=>{
  for(const html of [scene,flow]) {
    assert.match(html,/default-src 'none'/);
    assert.match(html,/form-action 'none'/);
    assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:|<iframe\b|<form\b/i);
    assert.match(html,/게임에 미적용/);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root,'tools/build-html.mjs'),'utf8'),/intro-recollection|intro-flow/);
});

test('the text never shrinks or clips; the artwork yields space to content and controls',()=>{
  const css=read('intro-recollection.css');
  const ast=require('postcss').parse(css);
  assert.doesNotMatch(css,/!important|animation:|transition:|line-clamp|text-overflow/);
  ast.walkRules(rule=>{
    if(['html','body','.draft-stage','.reading-scene','.reading-body'].includes(rule.selector)) {
      rule.walkDecls(decl=>assert(!/^overflow(?:-[xy])?$/.test(decl.prop),rule.selector));
    }
  });
  assert.match(css,/\.flow-body\s*\{[^}]*overflow-y: auto/);
  assert.match(css,/\.reading-body\s*\{[^}]*flex: 1 0 auto/);
  assert.match(css,/\.scene-art\s*\{[^}]*flex: 0 1 var\(--scene-height\)/);
  assert.match(css,/--scene-height: min\(40dvh, 82vw, 320px\)/);
  assert.match(css,/\(max-width: 349px\), \(max-height: 650px\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/#large-text:checked/);
  assert.match(css,/object-fit: contain/);
  assert.match(css,/object-fit: cover/);
  assert.match(scene,/id="full-art" type="checkbox"/);
  assert.match(css,/--reading-size: 18px/);
  assert.match(css,/--reading-size: 21px/);
  for(const html of [scene,flow]) assert.match(html,/id="large-text" type="checkbox"/);
});

test('conservative height estimate leaves visible art and all text (not browser or visual QA)',()=>{
  // Counts even spaces/punctuation as one full em. This does NOT measure a browser,
  // fallback font metrics, user zoom, toolbar wrapping or focus/fragment behavior.
  function rows(text,columns) {
    let count=1,used=0;
    for(const word of text.split(' ')) {
      let length=Array.from(word).length;
      if(used && used+1+length<=columns) { used+=1+length; continue; }
      if(used) { count++; used=0; }
      while(length>columns) { count++; length-=columns; }
      used=length;
    }
    return count;
  }
  for(const width of [320,349,350,360,390,480]) for(const height of [568,640,650,651,728,844]) {
    for(const font of [18,21]) {
      const mode=font===21||width<350||height<=650?'compact':'roomy';
      for(const {id,html} of journey(mode)) {
        const content=copyFor(html,mode);
        const parts=[...chunks(content),...chunks(content,'data-next-beat')];
        const columns=Math.floor((width-36)/font);
        const estimated=parts.reduce((sum,p)=>sum+rows(p.text,columns)*font*1.6+(p.kind==='dialogue'?32:0),0)+(parts.length-1)*16;
        const remainingArt=height-50-69-32-estimated;
        assert(remainingArt>=100,id+': '+width+'x'+height+', '+font+'px leaves only '+remainingArt+'px of image');
        if(id==='opening'&&width===360&&height===728&&font===18) {
          assert(remainingArt>=height*.4,'the requested paragraph and 40% artwork must coexist');
        }
      }
    }
  }
});
