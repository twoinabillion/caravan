const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('tools/design-drafts/scenery-routes.html'),css=read('tools/design-drafts/scenery-routes.css');
test('all actual corridors are covered in a script-free, save-isolated Studio review',()=>{
 const d=vm.runInNewContext(read('src/03-data.js')+';D');
 assert.equal((html.match(/class="route-review"/g)||[]).length,d.edges.length);
 for(const [a,b] of d.edges){assert(html.includes(d.nodes[a].name.replace(/&/g,'&amp;')));assert(html.includes(d.nodes[b].name.replace(/&/g,'&amp;')));}
 assert(!/<script|localStorage|sessionStorage|postMessage|\son[a-z]+\s*=/.test(html));
 assert(html.includes("default-src 'none'"));
 const registration=JSON.parse(read('tools/design-drafts/manifest.json')).drafts.find(x=>x.id==='scenery-routes-v1');
 assert.equal(registration.file,'scenery-routes.html');
});
test('candidate assets resolve and progress controls are labelled',()=>{
 for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(path.resolve(root,'tools/design-drafts',m[1])),m[1]);
 for(const m of html.matchAll(/<input[^>]*>/g))assert(m[0].includes('type="checkbox"')||m[0].includes('type="radio"'));
 assert(html.includes('반대 방향'));assert(html.includes('연속 출발 검수 미완료'));
});
test('travel, pause, reverse and reduced motion do not invent a seam-cover effect',()=>{
 assert(css.includes('animation-play-state:paused'));assert(css.includes('scaleX(-1)'));assert(css.includes('prefers-reduced-motion'));
 assert(!/clip-path|opacity:|filter:|mask:|background-image/.test(css));
 assert(css.includes('translateX(-66.666667%)'));assert(css.includes('linear both'));
});
