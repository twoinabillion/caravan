
const $=selector=>document.querySelector(selector);
const speaker='<div class="speaker">카페 주인</div>';
const intro='<p>개조한 트럭 옆구리를 열어 만든 이동식 카페.</p><p>손수 볶은 원두 냄새가 도로까지 퍼진다.</p><p class="thought">진짜 커피 냄새다. 오랜만이다.</p>';
const conversation=speaker+'<p class="dialogue">커피 한 잔에 고철 넷.<br>원두는 아끼지 않습니다.<br>세상이 망해도 카페인은 못 끊죠.</p><p class="direction">주인장이 능청스레 웃는다.</p>';
const branches=[
 {label:'커피를 산다',cost:'고철 4',pages:[
  '<p class="selected">내 선택 · <strong>커피를 산다</strong></p><p class="direction">“진하게 부탁해요.”</p>'+speaker+'<p class="dialogue">“이 원두에 물 타면 벌받죠. 리필은 한 번까지입니다.”</p><p>주인장이 원두를 넉넉히 갈아 잔을 채웠다.</p>',
  '<p>뜨거운 커피를 손에 쥐었다. 첫 모금에 온몸이 깨어난다. 이게 얼마 만인지.</p><p>빈 잔을 한 번 더 내밀자 주인장이 말없이 웃으며 채워 줬다.</p><div class="effects"><span class="loss">고철 −4</span><span>피로 −5</span><span>동료 사기 +5</span></div>'
 ]},
 {label:'원두 파는 곳을 묻는다',pages:[
  '<p class="selected">내 선택 · <strong>원두 파는 곳을 묻는다</strong></p>'+speaker+'<p class="dialogue">“북쪽 어느 옥상에서 커피나무 키우는 별종이 있어요. 미쳤죠, 이 세상에 커피나무라니.”</p><p class="direction">“어디요?”</p><p class="dialogue">“북쪽이요.”</p>',
  '<p class="direction">“…북쪽 어디.”</p>'+speaker+'<p class="dialogue">“그건 나도 몰라요. 원두가 오는 거지 내가 가는 게 아니라.”</p><p class="direction">주인장이 손을 저었다.</p><p class="dialogue">“옥상인 건 확실해요. 포대에 사진이 붙어 온 적 있어서.”</p><div class="effects"><span>소문 기록 · 옥상 커피나무</span></div>'
 ]},
 {label:'냄새만 맡고 지난다',pages:[
  '<p class="selected">내 선택 · <strong>냄새만 맡고 지난다</strong></p><p>고철이 아까워 냄새만 실컷 맡고 떠났다.</p><p>향이 룸미러 뒤로 오래 따라왔다.</p><div class="effects"><span>동료 사기 +1</span></div>'
 ]}
];
let phase='choice',choice=null,page=0,visited=[];
function btn(text,action,primary=false,extra=''){const b=document.createElement('button');b.type='button';b.className=primary?'primary':'';b.innerHTML='<span>'+text+'</span>'+extra;b.addEventListener('click',action);return b;}
function scrollHint(){const el=$('#copy');$('.scroll-hint').hidden=el.scrollHeight-el.clientHeight-el.scrollTop<14;}
function render(){
 let html,label,stage;
 const actions=$('#actions');actions.replaceChildren();
 if(phase==='intro'){html=intro;label='길 위에서';stage=0;actions.append(btn('이야기 이어가기',()=>{phase='choice';render();},true));}
 else if(phase==='choice'){html=conversation;label='어떻게 할까';stage=1;branches.forEach((b,i)=>actions.append(btn(b.label,()=>{choice=i;page=0;phase='outcome';render();},false,b.cost?'<span class="cost">'+b.cost+'</span>':'')));}
 else if(phase==='outcome'){const b=branches[choice];html=b.pages[page];label=page<b.pages.length-1?'이야기가 이어집니다':'잠깐의 만남';stage=2;actions.append(btn(page<b.pages.length-1?'다음':'길로 돌아가기',()=>{if(page<b.pages.length-1){page++;}else phase='end';render();},true));}
 else{html='<p>커피차의 불빛이 멀어진다.</p><p class="direction">여기까지가 대화 화면 시안입니다.<br>다른 선택의 반응도 살펴볼 수 있습니다.</p>';label='미리보기 완료 · 게임 저장에 영향 없음';stage=2;actions.append(btn('다른 선택 해보기',()=>{visited=visited.filter(x=>x.key==='intro'||x.key==='choice');phase='choice';choice=null;page=0;render();},true));}
 const key=phase==='outcome'?'outcome-'+choice+'-'+page:phase;
 if(phase!=='end'&&!visited.some(x=>x.key===key))visited.push({key,html,label:phase==='intro'?'길 위에서':phase==='choice'?'커피차 주인':page===0?'선택과 반응':'이어지는 이야기'});
 const copy=$('#copy');copy.innerHTML=html;copy.scrollTop=0;copy.classList.remove('enter');requestAnimationFrame(()=>{copy.classList.add('enter');scrollHint();});
 $('#beat').textContent=label;
 $('#announcement').textContent=phase==='choice'?'선택지 세 개. 커피를 사거나, 원두 파는 곳을 묻거나, 지나갈 수 있습니다.':label;
}
$('#restart').onclick=()=>{phase='intro';choice=null;page=0;visited=[];if($('#record').open)$('#record').close();render();$('#history').focus();};
$('#size').onclick=()=>{const large=document.body.classList.toggle('large');$('#size').setAttribute('aria-pressed',String(large));requestAnimationFrame(scrollHint);};
$('#history').onclick=()=>{$('.history-scroll').innerHTML=visited.map(v=>'<section class="history-entry"><p class="history-label">'+v.label+'</p>'+v.html+'</section>').join('');$('#record').showModal();$('.history-scroll').scrollTop=0;};
function closeRecord(){$('#record').close();$('#history').focus();}
$('#close-record').onclick=closeRecord;$('#return-record').onclick=closeRecord;
$('#copy').addEventListener('scroll',scrollHint,{passive:true});new ResizeObserver(scrollHint).observe($('#copy'));
document.addEventListener('keydown',e=>{if($('#record').open||e.repeat)return;if((e.key==='Enter'||e.key===' ')&&phase!=='choice'&&document.activeElement===$('#copy')){e.preventDefault();$('#actions button').click();}});
render();
