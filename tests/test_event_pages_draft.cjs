const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tools/design-drafts');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const html=read('event-pages.html'),css=read('event-pages.css');
const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs');
const ctx=vm.createContext({console,setTimeout:()=>0,clearTimeout(){}});
for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const events=permanentEvents(vm.runInContext('D',ctx));
const event=events.find(e=>e.id==='rq_minji_request');
const exchange=events.find(e=>e.id==='npc_sundeok_2');
const sections=new Map([...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map(([,attrs,body])=>[attrs.match(/id="([^"]+)"/)[1],{attrs,body}]));
const strip=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const source=(name)=>{
 const parts=name.split('.');let value=event;
 for(let i=0;i<parts.length;i++){
  if(parts[i]==='text'&&i===parts.length-2)return value.text.split('\n\n')[+parts[i+1]];
  value=value[parts[i]];
 }
 return value;
};
function copy(body,mode){
 return body.replace(/<article class="page-copy" data-layout="roomy">[\s\S]*?<\/article>/g,s=>mode==='compact'?'':s);
}
function journey(mode,branch){
 const ids=[];let id='reading';
 while(id!=='demo-end'){
  assert(!ids.includes(id),'cycle');ids.push(id);const {body}=sections.get(id);
  if(id==='choice')id=[...body.matchAll(/<a href="#([^"]+)" data-choice="(\d)"/g)].find(m=>+m[2]===branch)[1];
  else{
   const links=[...body.matchAll(/<a class="advance"(?: data-layout="([^"]+)")? href="#([^"]+)"/g)].filter(m=>!m[1]||m[1]==='shared'||m[1]===mode);
   assert.equal(links.length,1,id);id=links[0][2];
  }
 }
 return ids;
}
test('registered in Studio and isolated from scripts, saves and gameplay build',()=>{
 const {drafts}=JSON.parse(read('manifest.json'));
 assert.equal(new Set(drafts.map(d=>d.id)).size,drafts.length);
 const draft=drafts.find(d=>d.id==='event-pages-v1');assert.equal(draft.file,'event-pages.html');assert.equal(draft.revision,'2');
 assert(drafts.some(d=>d.id==='departure-brief-v1'));
 assert.match(html,/default-src 'none'; style-src 'self'; img-src 'self'; form-action 'none'; base-uri 'none'/);
 assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|<iframe\b|<form\b|javascript:/i);
 assert.match(html,/게임에 미적용/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'tools/build-html.mjs'),'utf8'),/event-pages/);
});
test('all resources and navigation targets resolve; existing place art and canonical portraits only',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  assert(!/^(https?:|data:|javascript:)/.test(url));
  if(url.startsWith('#'))assert(ids.includes(url.slice(1)),url);
  else assert(fs.existsSync(path.resolve(dir,url.split('?')[0])),url);
 }
 for(const [,url]of html.matchAll(/<a\b[^>]*href="([^"]+)"/g))assert(url.startsWith('#'));
 const art=[...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual([...new Set(art)],['../../assets/scenes/miryang-market.jpg','../../assets/portraits/minji.png','../../assets/portraits/me.png','../../assets/portraits/sundeok.png']);
});
test('48px portraits identify speakers without repeated faces or narrowed dialogue',()=>{
 for(const {body}of sections.values())for(const [,who,src,name]of body.matchAll(/<p class="speaker" data-speaker="([^"]+)"><img src="([^"]+)" width="48" height="48" alt=""><span>([^<]+)<\/span><\/p>/g)){
  assert.equal(src,`../../assets/portraits/${who}.png`);
  assert.equal(name,{minji:'민지',me:'상혁',sundeok:'순덕'}[who]);
  const file=fs.readFileSync(path.resolve(dir,src));
  assert.equal(file.readUInt32BE(16),file.readUInt32BE(20),'canonical square portrait');
 }
 for(const id of ['reading','reading-more','choice','accepted','declined'])assert.equal([...sections.get(id).body.matchAll(/data-speaker="minji"/g)].length,1,id);
 for(const id of ['accepted-more','exchange-after'])assert.doesNotMatch(sections.get(id).body,/data-speaker=/,'narration has no portrait');
 assert.match(css,/\.speaker img \{[^}]*width: 48px; height: 48px; object-fit: contain/);
 assert.doesNotMatch(css,/float\s*:|\.dialogue\s*\{[^}]*(?:width|margin-left|padding-left)/);
});
test('two-person sample preserves the real short exchange and following action',()=>{
 const last=exchange.choices[0].out[0].text.split('\n\n').at(-1);
 assert.equal(exchange.choices[0].out[0].turnSpeakers[2],'me');
 assert.equal(exchange.choices[0].out[0].turnSpeakers[3].who,'sundeok');
 assert.deepEqual([...sections.get('exchange').body.matchAll(/data-speaker="([^"]+)"/g)].map(m=>m[1]),['me','sundeok']);
 for(const mode of ['roomy','compact']){
  const ids=mode==='roomy'?['exchange']:['exchange','exchange-after'];
  const paragraphs=ids.flatMap(id=>[...copy(sections.get(id).body,mode).matchAll(/<p\b[^>]*data-excerpt="(\d)"[^>]*>([\s\S]*?)<\/p>/g)]);
  assert.deepEqual(paragraphs.map(m=>m[1]),['0','1','2']);
  assert.equal(paragraphs.map(m=>strip(m[2])).join(' '),last);
 }
 assert.match(html,/마지막 문답 발췌/);
 assert.match(html,/<a href="#exchange">순덕·상혁<\/a>/);
});
test('both size modes and both choices preserve every authored paragraph in sequence',()=>{
 for(const mode of ['roomy','compact'])for(const branch of [0,1]){
  const ids=journey(mode,branch);
  const parts=ids.flatMap(id=>[...copy(sections.get(id).body,mode).matchAll(/<p\b[^>]*data-source="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)]);
  const expected=[...event.text.split('\n\n').map((_,i)=>'text.'+i),...event.choices[branch].out[0].text.split('\n\n').map((_,i)=>`choices.${branch}.out.0.text.${i}`)];
  assert.deepEqual(parts.map(m=>m[1]),expected);
  for(const [,key,text]of parts)assert.equal(strip(text),source(key),key);
  assert.equal(ids.length,mode==='roomy'?3:branch===0?5:4);
 }
 assert.equal(event.choices[0].out[0].fx.startRecruit,'minji');
 assert.equal(event.choices[1].out[0].p,1);
});
test('choice wording is unchanged and outcomes stay out of the decision page',()=>{
 const decision=sections.get('choice').body;
 const choices=[...decision.matchAll(/<a href="#[^"]+" data-choice="(\d)">([^<]+)<\/a>/g)];
 assert.deepEqual(choices.map(m=>m[2]),Array.from(event.choices,c=>c.label));
 assert.match(decision,/앞 대사 다시 읽기/);
 assert.doesNotMatch(decision,/startRecruit|동료 영입|울산까지 동행|보상|부품 \+|고철 \+/);
 for(const id of ['accepted','accepted-more']){
  const history=sections.get(id).body.match(/<div class="history-copy">([\s\S]*?)<\/div>/)[1];
  const paragraphs=[...history.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>strip(m[1]));
  assert.deepEqual(paragraphs,[...event.text.split('\n\n'),'내 선택 · '+event.choices[0].label,...event.choices[0].out[0].text.split('\n\n')]);
 }
});
test('CSS leaves text intact, makes optional history scrollable and preserves focusable endpoints',()=>{
 const ast=require('postcss').parse(css);
 assert.doesNotMatch(css,/!important|line-clamp|text-overflow|overflow(?:-[xy])?\s*:\s*(hidden|clip)|animation\s*:/);
 assert.doesNotMatch(css,/#ev-sheet|#app|#frame/);
 assert.match(css,/--reading-size: 18px/);assert.match(css,/--reading-size: 21px/);
 assert.match(css,/max-width: 349px/);assert.match(css,/max-height: 650px/);
 assert.match(css,/:focus-visible/);assert.match(css,/:has\(> \.event-page:target\)/);
 const owners=[];ast.walkRules(r=>r.walkDecls(/^overflow(?:-[xy])?$/,d=>owners.push(r.selector)));
 assert.deepEqual(owners.sort(),['.help-content','.history-copy']);
 for(const {attrs} of sections.values())assert.match(attrs,/tabindex="-1"/);
 // Responsive continuation targets must remain non-empty after changing type size.
 for(const id of ['reading-more','accepted-more','exchange-after'])for(const mode of ['roomy','compact'])assert.match(copy(sections.get(id).body,mode),/data-(source|excerpt)=/);
});
test('specified text/button contrast meets 4.5:1 (palette check, not visual QA)',()=>{
 const lum=h=>{const v=h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
 const color=n=>css.match(new RegExp('--'+n+': (#[a-f0-9]{6});'))[1];
 for(const [fg,bg]of [['ink','surface'],['muted','surface'],['lamp','surface'],['muted','outside'],['outside','lamp']]){
  const [a,b]=[lum(color(fg)),lum(color(bg))].sort((a,b)=>b-a);assert((a+.05)/(b+.05)>=4.5,fg+' on '+bg);
 }
});

test('conservative text budget leaves art and actions at target sizes (not browser QA)',()=>{
 // Every character, including spaces/punctuation, is budgeted as a full em.
 // This is not evidence of browser shaping, focus behavior, crop or actual overflow.
 function rows(text,columns){
  let count=1,used=0;
  for(const word of text.split(' ')){
   let length=Array.from(word).length;
   if(used&&used+1+length<=columns){used+=1+length;continue;}
   if(used){count++;used=0;}
   while(length>columns){count++;length-=columns;}
   used=length;
  }
  return count;
 }
 for(const [width,height,size]of [[360,728,18],[360,728,21],[320,568,18],[320,568,21],[480,800,18]]){
  const compact=width<=349||height<=650||size===21,small=width<=349||height<=650;
  const mode=compact?'compact':'roomy',pad=small?40:48,footer=small?70:78;
  for(const id of new Set([...journey(mode,0),...journey(mode,1),'exchange','exchange-after'])){
   const body=copy(sections.get(id).body,mode);
   let textHeight=0;
   if(id==='choice'){
    const context=body.match(/<div class="choice-context">([\s\S]*?)<\/div>/)[1];
    const dialogue=strip(context.match(/<p class="dialogue">([\s\S]*?)<\/p>/)[1]);
    textHeight=(small?28:44)+56+rows(dialogue,Math.floor((width-pad)/size))*size*1.55;
    const choiceLabels=Array.from(event.choices,c=>c.label);
    textHeight+=choiceLabels.reduce((sum,label)=>sum+Math.max(58,rows(label,Math.floor((width-pad-34)/size))*size*1.4+(small?22:30)),0)+10;
   }else{
    const reading=body.match(/<div class="reading-copy">([\s\S]*?)<\/div>/)[1];
    const groups=[...reading.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
    if(!groups.length)groups.push(reading);
    textHeight=small?24:32;
    groups.forEach((group,i)=>{
     if(i)textHeight+=14;
     const paragraphs=[...group.matchAll(/<p class="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)];
     paragraphs.forEach(([,kind,text],j)=>{
      textHeight+=kind==='speaker'?48:rows(strip(text),Math.floor((width-pad)/size))*size*1.55;
      if(j<paragraphs.length-1)textHeight+=kind==='speaker'?8:12;
     });
    });
    if(id==='accepted-more'||id==='accepted'&&!compact)textHeight+=16+rows('울산까지 동행 · 다음은 울산 공단',Math.floor((width-pad)/15))*22.5+44;
   }
   const remaining=height-44-footer-textHeight;
   assert(remaining>=(id==='choice'?96:120),`${width}×${height}, ${size}px, ${id}: estimated art ${remaining.toFixed(1)}px`);
  }
 }
});
