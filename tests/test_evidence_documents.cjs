'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const source=fs.readFileSync('src/07-ui.js','utf8');
function data(){const env=vm.createContext({console,setTimeout:()=>0,clearTimeout(){},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),env);return vm.runInContext('D',env);}
function load(name,env){const at=source.indexOf('  function '+name+'(');assert(at>=0,name+' exists');const end=source.indexOf('\n  function ',at+4);vm.runInContext(source.slice(at,end),env);return env[name];}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('quoted bus record exposes exact existing times and empty confirmer without a premature completion stamp',()=>{
 const D=data(),ev=D.events.find(e=>e.id==='story_bridge_trace_gap'),doc=ev.inspection?.items?.[0]?.document;assert(doc,'authored physical record exists');
 assert.deepEqual(JSON.parse(JSON.stringify(doc.rows.map(r=>r.value))),['03:12','03:16','03:23','']);assert.equal(doc.rows[3].blank,true);
 assert(!JSON.stringify(doc).includes('완료'),'completion stamp is only mentioned in a later choice outcome');
 for(const time of ['03:12','03:16','03:23'])assert(ev.text.includes(time));
 assert.equal(ev.choices[0].out[0].fx.time,25);assert.equal(ev.choices[1].out[0].fx.time,15);
});
test('all seven documents retain requested corrections and never fabricate identifiers, dates or paid signatures',()=>{
 const D=data(),docs=['story_bridge_trace_gap','main_transfer_testimony','main_command_ledger'].flatMap(id=>D.events.find(e=>e.id===id).inspection?.items?.map(item=>item.document)||[]);assert.equal(docs.length,7);assert(docs.every(Boolean));
 for(const doc of docs){assert(doc.title&&doc.source&&doc.rows.length);for(const row of doc.rows){assert(row.label);assert(row.value||row.blank);}}
 const witness=docs.slice(1,4);assert(witness.every(d=>JSON.stringify(d).includes('요청')));assert(witness.every(d=>!/(서명 완료|정정 완료|수정 완료)/.test(JSON.stringify(d))));
 assert(!JSON.stringify(docs.slice(1)).match(/\d{2}:\d{2}|\d{4}-\d{2}-\d{2}/),'unknown dates and command numbers stay unknown');
});
test('document renderer is semantic, blank readable, escaped and does not mutate its source',()=>{
 const env=vm.createContext({esc:escape}),draw=load('storyDocumentHtml',env),doc={kind:'printout',title:'운행 <원본>',source:'요금소',rows:[{label:'명령',value:'03:12'},{label:'확인자',value:'',blank:true},{label:'인용',value:'<img onerror="bad">'}]},before=JSON.stringify(doc);
 const html=draw(doc);assert.match(html,/data-document-kind="printout"/);assert.match(html,/<dl[\s>]/);assert.match(html,/기재 없음/);assert.match(html,/03:12/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.equal(JSON.stringify(doc),before);
});
test('inspection uses real structured document and retains original reading text',()=>{
 const env=vm.createContext({esc:escape,fmt:escape});load('storyDocumentHtml',env);const draw=load('storyInspectionHtml',env);
 const state={inspectionId:'a',inspection:{title:'자료',items:[{id:'a',label:'원본',text:'원래 설명',document:{kind:'terminal',title:'확인 원본',source:'보관함',rows:[{label:'사람 확인',value:'',blank:true}]}}]},inspectedIds:[]},before=JSON.stringify(state);
 const html=draw(state);assert.match(html,/data-document-kind="terminal"/);assert.match(html,/원래 설명/);assert.doesNotMatch(html,/data-inspect=/,'a sole already-open document needs no duplicate chooser');assert.equal(JSON.stringify(state),before);
 const multi=draw({...state,inspection:{...state.inspection,items:[...state.inspection.items,{id:'b',label:'다른 원본',text:'다른 설명'}]}});assert.match(multi,/펼쳐 보는 중/);assert.match(multi,/data-inspect=/);
 const legacy=draw({inspectionId:'b',inspection:{title:'옛 자료',items:[{id:'b',label:'옛 원본',text:'보존한 설명'}]}});assert.match(legacy,/보존한 설명/);assert.doesNotMatch(legacy,/story-document/);
});
test('inspection return cannot steal a later keyboard focus and advance reading through a queued autofocus',()=>{
 const state={inspection:{items:[{id:'a'}]}},queue=[],doc={activeElement:null},reader={focus(){doc.activeElement=reader;}},trigger={};
 const env=vm.createContext({curStory:state,document:doc,requestAnimationFrame:fn=>queue.push(fn),$:()=>reader,renderStoryState(){}}),set=load('setStoryReaderMode',env);
 set(state,'inspection');assert.equal(state.inspectionId,'a');doc.activeElement=trigger;while(queue.length)queue.shift()();assert.equal(doc.activeElement,trigger,'a later explicit keyboard target must keep focus');
 const oldMode=state.readerMode;env.curStory={};set(state,'current');assert.equal(state.readerMode,oldMode,'stale inspection controls cannot change the new reader');
});
