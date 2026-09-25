import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/07d-ui-quests.js',import.meta.url),'utf8');
const context=vm.createContext({document:{readyState:'loading',addEventListener(){}},G:{questActionPlan:id=>({label:'경로 보기',id})}});
vm.runInContext(source,context);
const card=row=>vm.runInContext('QuestLedgerUI.card',context).call(vm.runInContext('QuestLedgerUI',context),row);
const main={id:'main_namsan',kind:'main',title:'다음 단서',eyebrow:'메인 스토리',phase:'길 위',next:'지도에서 다음 장소를 고른다',why:'부모님의 흔적을 찾는다',expected:'아직 모르는 결과',status:'active',steps:[{label:'읽은 편지',detail:'확인한 발신 번호',state:'done'},{label:'다음 행방',state:'current'},{label:'미공개 재회',detail:'미래의 반전',state:'upcoming'}]};
test('main ledger retains completed evidence and its action without revealing future steps or outcomes',()=>{
 const before=JSON.stringify(main),html=card(main);
 assert.match(html,/확인한 발신 번호/);assert.match(html,/data-quest-action="main_namsan"/);
 for(const secret of ['미공개 재회','미래의 반전','아직 모르는 결과']) assert.ok(!html.includes(secret));
 assert.ok(!html.includes('quest-progress'));assert.equal(JSON.stringify(main),before);
});
test('completed missions show results and have no action or tracking mutation',()=>{
 const html=card({...main,kind:'completed',status:'completed',expected:'찾은 사람의 답장'});
 assert.match(html,/찾은 사람의 답장/);assert.ok(!html.includes('data-quest-action'));assert.ok(!html.includes('data-quest-track'));
});
test('active side missions retain progress and tracking and keep outcomes hidden',()=>{
 const html=card({...main,id:'local_delivery',kind:'local',progress:{have:1,need:2,label:'1/2'}});
 assert.match(html,/quest-progress/);assert.match(html,/data-quest-track="local_delivery"/);assert.ok(!html.includes('아직 모르는 결과'));
});
test('player-facing evidence and custom text are escaped',()=>{
 const html=card({...main,title:'<img onerror=x>',next:'<script>x</script>',steps:[{label:'<b>name</b>',detail:'A & B',state:'done'}]});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));assert.match(html,/&lt;b&gt;name/);assert.match(html,/A &amp; B/);
});
