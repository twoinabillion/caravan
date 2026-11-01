// Reviewed prose projection only; immutable natural blobs/baseline are never rewritten.
const assert=require('node:assert/strict');
const before=require('./baseline.json').definition;
const prefix='"아빠는 고물상이었는데, 창고 하나는 절대 안 팔았어요. \'이건 파는 게 아니라 모으는 창고\'라고. 어릴 땐 몰랐죠. 그날— …그날 이후에 알았어요."\n\n"창고엔… 제 것들이 있어요. 첫 신발, 그림, 상장. 아빠는 저를 수집하고 있던 거예요. 6살부터, 쭉."\n\n';
const entry='재이가 목에 건 열쇠를 만지작거리다가 말을 꺼냈다.\n\n"창고 말인데요. 아빠 창고."';
const completedEntry='재이가 목에 건 열쇠를 만지작거리다가 말을 꺼냈다.\n\n"같이 열었던 창고 말인데요. 아빠 창고."';
const tails={
 unrevealed:'재이가 열쇠를 꼭 쥐었다. "김천 가면… 아니에요. 가게 되면 그때 말할게요." 창고의 좌표가 마음속에서 아직 정리 중인 모양이었다.',
 known:'재이가 열쇠를 꼭 쥐었다. "김천 인근이에요. 그 창고로 가는 길, 지도에서 짚어 드릴게요." 재이가 지도를 펴고 창고로 가는 길을 짚었다.',
 opened:'재이가 열쇠를 꼭 쥐었다. "같이 문을 열었죠. 아빠 글씨도 봤고요." 재이는 손을 펴서 열쇠를 내려다봤다.'
};
const samples=[
 {state:{flags:{},known:[],notes:[]},branch:'unrevealed'},
 {state:{flags:{},known:['jaeyi_cache'],notes:[]},branch:'known'},
 {state:{flags:{jaeyi_cache_opened:true},known:[],notes:[]},branch:'opened'},
 {state:{flags:{},known:['jaeyi_cache'],notes:[{title:'고물상의 법',body:'"나눠 써라." 창고는 이제 지나가는 모두의 것이다.'}]},branch:'opened'},
 {state:{flags:{jy_law:true},used:['loc_jaeyi_cache'],known:['jaeyi_cache'],notes:[{title:'고물상의 법',body:'아직 창고에 가지 않았다.'}]},branch:'known'}
];
const quotes=t=>[...t.matchAll(/"([^"\n]+)"/g)].map(x=>x[1]);
function assertReviewed(e){
 assert.equal(typeof e.text,'function');assert.equal(typeof e.choices[0].out[0].text,'function');
 assert.equal(before.choices[0].out[0].text,prefix+tails.unrevealed);
 for(const {state,branch}of samples){
  const a=e.text(state),b=e.choices[0].out[0].text(state);
  assert.equal(a,branch==='opened'?completedEntry:entry);assert.equal(b,prefix+tails[branch]);
  assert.equal(quotes(a).length,1);assert.equal(quotes(b).length,3);
 }
 return before;
}
module.exports={assertReviewed,entry,completedEntry,prefix,tails,samples,quotes};
