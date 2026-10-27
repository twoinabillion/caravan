/* Real page-renderer markup; browser evidence is saved separately. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const env=vm.createContext({console,esc:String,fmt:String,
  speakerInfo:(who,name)=>({id:who,name:name||who,portrait:who+'.png'}),speakerLaneKey:t=>t.who});
for(const name of ['storyDocumentTitle','pagedStoryHtml']){
  const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);
  assert(start>=0);vm.runInContext(source.slice(start,end),env);
}
vm.runInContext(fs.readFileSync('src/03-data.js','utf8'),env);
test('Leo is identified again after the written final verse in the actual ending',()=>{
  const turns=vm.runInContext("D.leoFinalVerseTurns({party:['leo'],flags:{},notes:[]})",env);
  const before=JSON.stringify(turns),html=env.pagedStoryHtml(turns);
  assert.equal((html.match(/class="page-speaker"/g)||[]).length,2);
  assert.match(html,/data-source-layout="document"/);
  assert.match(html,/data-speaker="leo"><header class="page-speaker">[^]*첫 줄부터 제 얘기네요/);
  assert.equal(JSON.stringify(turns),before,'rendering does not rewrite the saved receipt');
});
test('named records, letters and broadcasts end the preceding speech group',()=>{
  for(const sourceTurn of [{kind:'record',name:'일지'},{kind:'letter',name:'편지'},{kind:'radio'},{kind:'ai'}]){
    const html=env.pagedStoryHtml([{kind:'dialogue',who:'leo',text:'앞 대사'},
      {...sourceTurn,text:'다른 출처'}, {kind:'dialogue',who:'leo',text:'돌아온 대사'}]);
    assert.equal((html.match(/class="page-speaker"/g)||[]).length,2,sourceTurn.kind);
  }
});
test('consecutive speech and a neutral narrative pause keep the compact same-speaker group',()=>{
  for(const between of [[],[{kind:'narration',text:'기타를 고쳐 잡았다.'}]]){
    const html=env.pagedStoryHtml([{kind:'dialogue',who:'leo',text:'앞 대사'},...between,
      {kind:'dialogue',who:'leo',text:'이어지는 대사'}]);
    assert.equal((html.match(/class="page-speaker"/g)||[]).length,1);
  }
});
