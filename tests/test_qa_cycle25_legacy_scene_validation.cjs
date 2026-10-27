'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const root=path.resolve(__dirname,'..');
function validate(mutation=''){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'caravan-legacy-scene-validator-'));
  try{
    for(const file of [...STATIC_CONTENT_FILES,'tools/content-registry.cjs','tools/validate-content.cjs']){
      fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});
      fs.copyFileSync(path.join(root,file),path.join(dir,file));
    }
    fs.appendFileSync(path.join(dir,STATIC_CONTENT_FILES.at(-1)),'\n'+mutation+'\n');
    const r=spawnSync(process.execPath,['tools/validate-content.cjs'],{cwd:dir,encoding:'utf8'});
    assert.equal(r.error,undefined);
    return {status:r.status,output:r.stdout+r.stderr};
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('the current market-only Leo cut retains the exact old saved Namwon stage',()=>{
  const r=validate();assert.equal(r.status,0,r.output);
});
for(const [name,mutation,pattern] of [
  ['unrelated existing scene',"D.eventTurnSceneStages.meet_hitchhiker[1].key='seoul-han';",/연속 컷에 없는 장면 seoul-han/],
  ['moved legacy stage',"D.eventTurnSceneStages.meet_hitchhiker[1].at=3;",/연속 컷에 없는 장면 recruit-leo-meet-action/],
  ['missing legacy asset',"delete D.scenes['recruit-leo-meet-action'];",/없는 장면 recruit-leo-meet-action/],
  ['another event borrowing the legacy stage',"D.eventTurnSceneStages.meet_bus.push({at:3,key:'recruit-leo-meet-action'});",/turnSceneStages:meet_bus: 연속 컷에 없는 장면/],
  ['different active cut configuration',"D.eventTurnScenes.meet_hitchhiker.push('seoul-han');",/연속 컷에 없는 장면 recruit-leo-meet-action/]
])test('legacy compatibility still rejects '+name,()=>{
  const r=validate(mutation);assert.equal(r.status,1,r.output);assert.match(r.output,pattern);
});
