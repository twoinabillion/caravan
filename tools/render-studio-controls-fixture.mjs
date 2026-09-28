// Isolated production-component QA. Never loads a game or reads/writes its save.
import fs from 'node:fs';
import path from 'node:path';
const studio = process.env.STUDIO_SOURCE || '/Users/sang/live-game-studio';
const read = name => fs.readFileSync(path.join(studio,'public',name),'utf8');
const index = read('index.html');
const markup = index.slice(index.indexOf('      <section class="play-controls"'), index.indexOf('      <div class="preview-stage"'));
const css = read('styles.css').replace(/^@import[^\n]+\n/,'');
const controller = read('play-controls.js').replace('export function','function');
const child = `<!doctype html><html lang="ko"><meta charset="utf-8"><style>body{background:#252b30;color:#eee;font:14px sans-serif;padding:20px;line-height:2}</style><h2>분리된 검수 화면</h2><p>실제 게임·저장에 접근하지 않습니다.</p><p id="counts">코드 적용 0 / 새 테스트 0</p><script>
let session='',applies=0,restarts=0,state={canRestart:true,infinite:true,pendingRevision:123,message:'새 코드 준비됨'};
function publish(){parent.postMessage({type:'live-game-studio:play-state',session,state},new URL(document.referrer).origin)}
addEventListener('message',event=>{const d=event.data;if(d.type==='live-game-studio:play-connect'){session=d.session;publish()}
if(d.type==='live-game-studio:play-command'&&d.session===session){if(d.action==='apply'){applies++;state.pendingRevision=null;state.message='최신 코드 사용 중'}else{restarts++;state.message='처음부터 테스트 시작됨'}document.querySelector('#counts').textContent='코드 적용 '+applies+' / 새 테스트 '+restarts;publish()}
if(d.type==='fixture-pending'){state.pendingRevision=456;state.message='새 코드 준비됨';publish()}});<\/script>`;
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>플레이 테스트 도구 · 실제 컴포넌트 검수</title><style>${css}</style>
<style>body{overflow:auto;padding:16px}.qa-controls{display:flex;gap:12px;flex-wrap:wrap;font:14px sans-serif;margin-bottom:20px}.qa-controls button,.qa-controls select{padding:8px}#qa-preview{width:360px;max-width:100%;border:1px solid #555}#gameFrame{width:100%;height:260px;border:0}#qa-device{margin:18px;border:1px solid #66707a;border-radius:15px;overflow:hidden}.qa-device-title{padding:12px;color:#aab3bd;font-size:12px}</style>
<div class="qa-controls"><strong>실제 컴포넌트 분리 검수 · 사용자 저장과 무관</strong><label>패널 너비 <select id="qa-width"><option>320</option><option selected>360</option><option>480</option></select></label><button id="qa-pending">새 코드 상태 만들기</button><button id="qa-freeze">STOP 전환</button></div>
<div id="qa-preview"><div class="device-controls">기기 설정 영역 · 검수용</div>${markup}<div id="qa-device"><div class="qa-device-title">기기 화면 · 두 개발 버튼이 없어야 함</div><iframe id="gameFrame" title="저장 없는 검수 화면"></iframe></div></div>
<script type="module">${controller}
const frame=document.querySelector('#gameFrame');let locked=false;
frame.src=location.href+'#fixture-child';
const controls=createPlayControls({frame});controls.update({enabled:true,running:true,locked:false});
frame.srcdoc=${JSON.stringify(child).replace(/</g,'\\u003c')};
document.querySelector('#qa-width').onchange=e=>document.querySelector('#qa-preview').style.width=e.target.value+'px';
document.querySelector('#qa-pending').onclick=()=>frame.contentWindow.postMessage({type:'fixture-pending'},location.origin);
document.querySelector('#qa-freeze').onclick=()=>{locked=!locked;controls.update({enabled:true,running:true,locked})};
</script></html>`;
fs.mkdirSync('artifacts/studio-controls',{recursive:true});
fs.writeFileSync('artifacts/studio-controls/component.html',html);
console.log('artifacts/studio-controls/component.html (isolated; production markup/styles/controller)');
