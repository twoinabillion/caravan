'use strict';
// Builds only the isolated design draft. Never runs build.sh or touches gameplay.
const fs=require('node:fs');
const path=require('node:path');
const {audit}=require('./audit-people-catalog.cjs');
const dir=path.join(__dirname,'design-drafts');
const book=path.join(dir,'people-catalog');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
  const data=JSON.parse(fs.readFileSync(path.join(book,'catalog.json'),'utf8'));
  const checked=audit();
  const seen=new Set(data.people.map(p=>p.id));
  const people=[...data.people,...checked.canonical.filter(p=>!seen.has(p.id)).map(p=>({...p,status:'pending'}))];
  function card(p){
    if(p.status==='pending'||p.status==='blocked')return `<li class="pending-person"><span>${esc(p.name)}</span><small>${p.status==='blocked'?'생성 도구에서 중단 · 원형 미완료':'전신 제작 대기'}</small></li>`;
    const version=p.version||'v1';
    const master=`people-catalog/masters/${p.id}-${version}.png`;
    const preview=`people-catalog/previews/${p.id}-${version}.webp`;
    if(!fs.existsSync(path.join(dir,master)))throw new Error('Missing master: '+master);
    if(!fs.existsSync(path.join(dir,preview)))throw new Error('Missing preview: '+preview);
    return `<article class="person" id="person-${esc(p.id)}">
<header><h3>${esc(p.name)}</h3><p>${esc(p.role||(p.portrait?'기존 얼굴 유지':'새 얼굴 제안'))}</p></header>
<div class="comparison"><figure class="master"><a href="${master}"><img loading="lazy" src="${preview}" width="512" height="768" alt="${esc(p.name)}의 새 전신 원형"></a><figcaption>전신 원형 · 눌러 원본</figcaption></figure>
<aside>${p.portrait?`<figure class="canonical"><img loading="lazy" src="../../${esc(p.portrait)}" width="256" height="256" alt="${esc(p.name)} 기존 정본 초상"><figcaption>기존 정본</figcaption></figure>`:'<p class="new-identity">새 얼굴<br>기존 주연 얼굴을 재사용하지 않음</p>'}
<details class="face-detail"><summary>얼굴 확대</summary><svg viewBox="250 0 520 510" role="img" aria-label="같은 전신 원본의 얼굴 확대"><image href="${preview}" width="1024" height="1536"/></svg></details></aside></div>
<p class="identity-note">${esc(p.brief||'정본의 얼굴·머리·대표 의상을 기준으로 만든 전신 초안.')}</p>
${p.reviewNote?`<p class="review-note">검토: ${esc(p.reviewNote)}</p>`:''}
<details class="provenance"><summary>제작 정보</summary><p>built-in imagegen 생성 / 1024×1536 RGBA 마스터 / 게임 미적용</p><p>${esc(p.sourceScope||(p.portrait?'기존 인물 정본 + 필수 세계관 참조 4장':'필수 세계관 참조 4장 + 앞서 검토한 행인 전신 참조. 얼굴은 새로 설계.'))}</p><a href="people-catalog/prompts/${esc(p.id)}-${version}.txt">생성 지시문</a></details>
</article>`;
  }
  const groups=[['lead','주연과 동료'],['named','이름 있는 사람들'],['anonymous','길에서 만나는 사람들']];
  const isReady=p=>p.status==='draft';
  const ready=people.filter(isReady).length;
  function faceIndex(rows){
    return `<details class="face-index"><summary>얼굴만 나란히 보기</summary><div class="face-grid">${rows.map(p=>`<a href="#person-${esc(p.id)}"><svg viewBox="250 0 520 510" role="img" aria-label="${esc(p.name)} 얼굴 비교"><image href="people-catalog/previews/${esc(p.id)}-${esc(p.version||'v1')}.webp" width="1024" height="1536"/></svg><span>${esc(p.name)}</span></a>`).join('')}</div></details>`;
  }
  const sections=groups.map(([id,title])=>{
    const rows=people.filter(p=>p.group===id),done=rows.filter(isReady),pending=rows.filter(p=>!isReady(p));
    return `<section id="${id}" class="cast-section"><h2>${title}</h2><p class="section-note">원형 ${done.length}종${pending.length?` / 미완료 ${pending.length}종`:''}</p>${done.length?faceIndex(done):''}<div class="people">${done.map(card).join('\n')}</div>${pending.length?`<details class="pending"><summary>남은 인물 ${pending.length}종</summary><ul>${pending.map(card).join('')}</ul></details>`:''}${!rows.length?'<p>사건별 인물 구분을 확인하고 있어. 아직 제작된 원형은 없어.</p>':''}</section>`;
  }).join('\n');
  const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'"><title>서울까지 400km · 사람 원형 비교판</title><link rel="stylesheet" href="people-catalog.css"></head>
<body><main><header class="book-heading"><h1>사람마다 다른 얼굴</h1><p>기존 얼굴과 새 전신을 나란히 보는 인물 비교판</p><p class="scope">제작 목록 ${people.length}항목 중 원형 ${ready}종 · 미완료 ${people.length-ready}종.<br>어린 시절과 성인 모습이 함께 있어, 고유 인원 수와는 달라. 아직 게임에는 적용하지 않았어.</p></header>
<nav aria-label="인물 분류"><a href="#lead">주연·동료</a><a href="#named">이름 있는 인물</a><a href="#anonymous">이름 없는 인물</a></nav>
${sections}
<section class="rules"><h2>게임에 들어갈 때 지킬 것</h2><p>인물 ID마다 얼굴을 고정하고, 다시 만나도 바꾸지 않아. 서로 다른 사람에게 같은 얼굴을 돌려 쓰지 않아.</p><p>전신 원형은 도로 스프라이트가 아니야. 움직이는 도로에서는 달구지와 같은 캔버스/픽셀 렌더러로 다시 만들고, 초상은 같은 인물의 얼굴로 연결해야 해.</p><p>공용 화자 ${checked.genericLabels.length}개 표기를 확인했지만, 이것이 전체 인원 수는 아니야. 같은 ‘남자’도 사건이 다르면 다른 사람일 수 있어. 일반 서술에서 추론되는 인물은 별도 확인이 필요해.</p></section>
<footer><p>실제 게임과 저장에는 미적용.</p><p>원본 이미지 검토와 파일 검사를 진행했어. Studio 창 내 배치는 접근 제한으로 미검수.</p><a href="#top">맨 위로</a></footer></main></body></html>`;
  fs.writeFileSync(path.join(dir,'people-catalog.html'),html.replace('<body>','<body id="top">'));
  fs.writeFileSync(path.join(book,'content-audit.json'),JSON.stringify(checked,null,2)+'\n');
  return {ready,pending:people.length-ready,canonical:checked.canonical.length,explicitGenericLabels:checked.genericLabels.length};
}
if(require.main===module)console.log(JSON.stringify(render()));
module.exports={render};
