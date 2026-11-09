const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
function helper(c,name){const a=source.indexOf('  function '+name+'('),b=source.indexOf('\n  function ',a+4);assert(a>=0,name+' exists');vm.runInContext(source.slice(a,b),c);return c[name];}
test('completed stay action gives free navigation rather than an inert execution button',()=>{
 const c=vm.createContext({esc:s=>String(s),S:{at:'yangsan'},stayLabel:s=>s});const render=helper(c,'stayDetailHtml');
 const model={action:'explore',disabled:true,disabledCta:'오늘 탐색 완료',title:'주변 탐색',description:'이미 끝낸 탐색',chips:[]};const before=JSON.stringify(model),html=render(model);
 assert.match(html,/오늘 탐색 완료/);assert.match(html,/data-stay-alternatives/);assert.doesNotMatch(html,/data-a="explore"/);assert.equal(JSON.stringify(model),before);
 const ready=render({...model,disabled:false});assert.match(ready,/data-a="explore"/);assert.doesNotMatch(ready,/data-stay-alternatives/);
});
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.open=false;}
 appendChild(e){this.children.push(e);e.parentElement=this;return e;}
 remove(){this.parentElement.children=this.parentElement.children.filter(e=>e!==this);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 focus(){this.focused=true;}
 querySelector(selector){const cls=selector.slice(1);for(const e of this.children){if(e.className===cls)return e;const found=e.querySelector(selector);if(found)return found;}return null;}
}
test('art viewer has one reusable native modal with separate whole-picture and detail controls',()=>{
 const c=vm.createContext({document:{createElement:tag=>new Element(tag)}}),create=helper(c,'storyArtLightbox'),sheet=new Element('section');
 const modal=create(sheet);assert.equal(modal.tagName,'dialog');assert.equal(sheet.children.length,1);assert.equal(create(sheet),modal);
 for(const cls of ['story-art-close','story-art-detail','story-art-viewport','story-art-image'])assert(modal.querySelector('.'+cls),cls);
 assert.equal(modal.querySelector('.story-art-close').tagName,'button');assert.equal(modal.querySelector('.story-art-detail').tagName,'button');
 assert.equal(modal.attributes['aria-label'],'그림 크게 보기');
});
test('replaying a captured page rebuilds modal handles instead of reusing inert serialized HTML',()=>{
 const c=vm.createContext({document:{createElement:tag=>new Element(tag)}}),create=helper(c,'storyArtLightbox'),sheet=new Element('section');
 const old=create(sheet);delete old.__art;old.open=true;
 const restored=create(sheet);assert(restored.__art?.picture);assert.notEqual(restored,old);assert.equal(sheet.children.length,1);assert.equal(restored.open,false);
});
test('art modal wraps both Tab directions and recovers focus outside its controls',()=>{
 const doc={createElement:tag=>new Element(tag),activeElement:null},c=vm.createContext({document:doc}),create=helper(c,'storyArtLightbox'),modal=create(new Element('section')),a=modal.__art;
 function key(shift=false){return {key:'Tab',shiftKey:shift,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};}
 doc.activeElement=a.viewport;let e=key();modal.onkeydown(e);assert(e.prevented&&e.stopped);assert(a.detail.focused);
 doc.activeElement=a.detail;e=key(true);modal.onkeydown(e);assert(e.prevented);assert(a.viewport.focused);
 doc.activeElement=null;e=key();modal.onkeydown(e);assert(e.prevented);assert(a.detail.focused);
});
