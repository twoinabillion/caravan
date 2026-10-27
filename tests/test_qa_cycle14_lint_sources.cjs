'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const {hasInformalSentence,inspectAdultPlayerRegister}=require('../tools/dialogue-register.cjs');
const root=path.resolve(__dirname,'..');
function lint(mutation=''){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'caravan-dialogue-sources-'));
 try{
  for(const file of [...STATIC_CONTENT_FILES,'tools/content-registry.cjs','tools/dialogue-register.cjs','tools/dialogue-lint.cjs']){
   fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(dir,file));
  }
  if(mutation)fs.appendFileSync(path.join(dir,STATIC_CONTENT_FILES.at(-1)),'\n'+mutation+'\n');
  const r=spawnSync(process.execPath,['tools/dialogue-lint.cjs'],{cwd:dir,encoding:'utf8'});assert.equal(r.error,undefined);return {status:r.status,text:r.stdout+r.stderr};
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('actual notebook multiline sources and named-actor dialogue descriptors pass the dialogue gate',()=>{const r=lint();assert.equal(r.status,0,r.text);});
test('anonymous actor descriptors still require an explicit role label',()=>{const r=lint("D.eventTurnScripts.lc_suwon_galbi.text[0].name='';D.eventTurnScripts.lc_suwon_galbi.text[0].kind='dialogue';");assert.equal(r.status,1);assert.match(r.text,/익명 대화 화자 이름 누락: lc_suwon_galbi.text.0/);});
test('multiline source count still rejects missing notebook speaker routes',()=>{const r=lint("D.eventTurnScripts.gp_note2.text.pop();");assert.equal(r.status,1);assert.match(r.text,/본문 화자 수와 발화 수 불일치: gp_note2 \/ 화자 1 · 발화 2/);});
test('a quote split across blank paragraphs is not counted as one runtime source',()=>{
 const r=lint("D.events.find(e=>e.id==='gp_note1').text='\"첫 문단\\n\\n둘째 문단\"';");
 assert.equal(r.status,1);assert.match(r.text,/본문 화자 수와 발화 수 불일치: gp_note1 \/ 화자 1 · 발화 0/);
});
test('the exact polite request and object supplement are exempt without weakening sentence detection',()=>{
 const text='우리 얘기도 적어 줘요. 이 달구지가 뭘 봤는지.';
 const content=text=>({events:[{id:'ev_jaeyi_law',needsComp:'jaeyi',choices:[{}, {out:[{text:JSON.stringify(text),turnSpeakers:['me']}]}]}]});
 assert.deepEqual(inspectAdultPlayerRegister(content(text)),[]);
 assert.equal(inspectAdultPlayerRegister(content('우리 얘기도 적어 줘. 이 달구지가 뭘 봤는지.')).length,1);
 assert.equal(hasInformalSentence('우리 얘기도 적어 줘.'),true);
 assert.equal(hasInformalSentence('그건 그렇지.'),true);
 assert.equal(hasInformalSentence('네가 그걸 봤는지?'),true);
});
