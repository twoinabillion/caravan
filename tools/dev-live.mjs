#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const GAME=path.join(ROOT,'서울까지400km.html');
const ASSETS=path.join(ROOT,'assets');
const HOST=process.env.CARAVAN_LIVE_HOST||'127.0.0.1';
const portArg=process.argv.find(arg=>arg.startsWith('--port='));
const PORT=Number(portArg?.split('=')[1]||process.env.CARAVAN_LIVE_PORT||4173);
const IMAGE_EXTENSIONS=new Set(['.png','.jpg','.jpeg','.webp','.gif','.avif']);
const MIME={
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.gif':'image/gif','.avif':'image/avif','.html':'text/html; charset=utf-8',
  '.json':'application/json; charset=utf-8'
};

const clients=new Set();
const watchers=[];
const pendingReasons=new Set();
let buildTimer=null;
let building=false;
let queued=false;
let buildRevision=Date.now();
let activeBuild=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[char]);

function broadcast(event,payload={}){
  const body=`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for(const response of clients){
    try{ response.write(body); }catch{ clients.delete(response); }
  }
}

function shellBuild(reason){
  if(reason) pendingReasons.add(reason);
  if(building){ queued=true; return; }
  const reasons=[...pendingReasons];
  pendingReasons.clear();
  const buildLabel=reasons.join(' · ')||'변경 사항';
  building=true;
  queued=false;
  broadcast('build',{reason:buildLabel,reasons});
  process.stdout.write(`\n[dev:live] HTML 반영 중 · ${buildLabel}\n`);
  activeBuild=spawn('bash',['build.sh','--html-only'],{
    cwd:ROOT,
    env:{...process.env,CARAVAN_DEV_LIVE:'1'},
    stdio:'inherit'
  });
  activeBuild.once('exit',code=>{
    activeBuild=null;
    building=false;
    if(code===0){
      buildRevision=Date.now();
      const mode=reasons.length&&reasons.every(item=>item==='src/01-style.html')?'styles':'refresh';
      broadcast('reload',{revision:buildRevision,reason:buildLabel,reasons,mode});
      process.stdout.write(`[dev:live] Chrome 반영 완료 · ${new Date().toLocaleTimeString('ko-KR')}\n`);
    }else{
      broadcast('build-error',{reason:buildLabel,reasons,code});
      process.stderr.write(`[dev:live] 빌드 실패 (${code}) · 이전 화면 유지\n`);
    }
    if(queued||pendingReasons.size){ queued=false; scheduleBuild(null,80); }
  });
}

function scheduleBuild(reason,delay=350){
  if(reason) pendingReasons.add(reason);
  clearTimeout(buildTimer);
  buildTimer=setTimeout(()=>shellBuild(),delay);
}

function watchDirectory(directory,label){
  if(!fs.existsSync(directory)) return;
  const watcher=fs.watch(directory,{recursive:true},(event,filename)=>{
    if(!filename||String(filename).includes('.DS_Store')) return;
    const relative=path.join(label,String(filename));
    if(label==='assets') broadcast('asset',{path:relative,event,at:Date.now()});
    scheduleBuild(relative,label==='assets'?900:300);
  });
  watcher.on('error',error=>process.stderr.write(`[dev:live] ${label} 감시 오류: ${error.message}\n`));
  watchers.push(watcher);
}

function watchFile(filename){
  const absolute=path.join(ROOT,filename);
  if(!fs.existsSync(absolute)) return;
  const watcher=fs.watch(absolute,()=>scheduleBuild(filename,300));
  watcher.on('error',error=>process.stderr.write(`[dev:live] ${filename} 감시 오류: ${error.message}\n`));
  watchers.push(watcher);
}

function gameShell(){
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>서울까지 400km · LIVE</title><style>
  html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#070b13}
  iframe{display:block;width:100%;height:100%;border:0;background:#070b13}
  #live{appearance:none;position:fixed;right:10px;bottom:10px;z-index:20;min-height:36px;padding:7px 10px;border:1px solid #66583e;
    border-radius:6px;background:rgba(7,13,20,.94);color:#efe6d5;font:700 11px/1.2 sans-serif;
    box-shadow:0 5px 18px rgba(0,0,0,.35);opacity:1;transform:none;transition:.18s ease;pointer-events:auto;cursor:pointer}
  #live.show{opacity:1;transform:none}#live.idle{border-color:#66583e;color:#d8c9ab}
  #live:disabled{cursor:wait;opacity:.76}#live.error{border-color:#a94442;color:#f2b8b5}
  #live.pending{pointer-events:auto;cursor:pointer;border-color:#e0a343;color:#ffd38a;box-shadow:0 5px 18px rgba(0,0,0,.35),0 0 0 1px rgba(224,163,67,.18)}
  </style></head><body><iframe id="game" src="/game?caravan-live=1&rev=${buildRevision}" allow="autoplay; fullscreen"></iframe>
  <button id="live" class="show idle" type="button" aria-live="polite" title="저장 상태를 유지하고 최신 빌드를 다시 불러옵니다">최신 코드 적용</button><script>
  const game=document.querySelector('#game'),badge=document.querySelector('#live');
  let hideTimer,pendingRevision=null,applying=false,applyWhenReady=false,studioFrozen=false,studioMedia=[];
  const idle=()=>{clearTimeout(hideTimer);badge.disabled=false;badge.textContent='최신 코드 적용';badge.className='show idle'};
  const show=(text,error=false,pending=false,busy=false)=>{clearTimeout(hideTimer);badge.disabled=busy;badge.textContent=text;badge.className='show'+(error?' error':'')+(pending?' pending':'');};
  const hide=()=>{hideTimer=setTimeout(idle,1400)};
  const viewKey='caravan-live-view-v1';
  const captureView=()=>{
    try{
      const doc=game.contentDocument;
      if(!doc)return;
      const ids=['ovl-status','ovl-map','ovl-journal','ovl-menu','ovl-camp','ovl-local-actions','ovl-stl','ev-wrap'];
      const open=ids.filter(id=>doc.getElementById(id)?.classList.contains('on'));
      const view={
        open,
        surface:doc.querySelector('#status-prop')?.dataset.toolSurface||'',
        scroll:{
          status:doc.querySelector('#st-body')?.scrollTop||0,
          bag:doc.querySelector('.bag-live-content')?.scrollTop||0
        }
      };
      sessionStorage.setItem(viewKey,JSON.stringify(view));
    }catch(error){ console.warn('[caravan live] view capture failed',error); }
  };
  const restoreView=()=>{
    try{
      const saved=sessionStorage.getItem(viewKey);
      if(!saved)return;
      const view=JSON.parse(saved),doc=game.contentDocument;
      if(!doc)return;
      let label='';
      if(view.open?.includes('ovl-status'))label=view.surface==='goal'?'목표':'가방';
      else if(view.open?.includes('ovl-map'))label='지도';
      else if(view.open?.includes('ovl-menu'))label='메뉴';
      const button=label?[...doc.querySelectorAll('button')].find(node=>node.textContent.replace(/\s+/g,'').includes(label)):null;
      if(button)button.click();
      setTimeout(()=>{
        const status=doc.querySelector('#st-body'),bag=doc.querySelector('.bag-live-content');
        if(status)status.scrollTop=view.scroll?.status||0;
        if(bag)bag.scrollTop=view.scroll?.bag||0;
      },120);
    }catch(error){ console.warn('[caravan live] view restore failed',error); }
  };
  const studioVisible=(node,doc)=>{
    if(!node||!node.getClientRects().length)return false;
    const style=doc.defaultView.getComputedStyle(node),rect=node.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)>0&&rect.width>1&&rect.height>1&&
      rect.bottom>0&&rect.right>0&&rect.top<doc.defaultView.innerHeight&&rect.left<doc.defaultView.innerWidth;
  };
  const compactStudioContext=()=>{
    const doc=game.contentDocument,win=game.contentWindow;
    if(!doc||!win)return {screen:'unknown',why:'game document unavailable'};
    const app=doc.querySelector('#app'),eventSheet=doc.querySelector('#ev-sheet');
    let gameState=null;
    try{
      const raw=win.eval('JSON.stringify((typeof S!=="undefined"&&S)?{day:S.day,min:S.min,at:S.at,atName:S.at&&typeof D!=="undefined"&&D.nodes[S.at]?D.nodes[S.at].name:null,driving:S.driving,weather:S.wx,weatherNext:S.wxNext,fuel:S.fuel,fuelMax:S.fuelMax,water:S.water,waterMax:S.waterMax,food:S.food,foodMax:S.foodMax,scrap:S.scrap,van:S.van,vanMax:S.vanMax,party:S.party.map(function(id){return {id:id,name:typeof D!=="undefined"&&D.comps[id]?D.comps[id].name:id}}),dog:S.dog,quest:S.quest,recruitQuest:S.recruitQ,routePlan:S.routePlan,ended:S.ended}:null)');
      gameState=raw?JSON.parse(raw):null;
    }catch(error){ console.warn('[caravan live] state context failed',error); }
    const surfaceIds=['scr-title','scr-mode','scr-name','scr-intro','scr-game','scr-end','ev-wrap','ovl-status','ovl-map','ovl-journal','ovl-menu','ovl-camp','ovl-local-actions','ovl-stl','quest-ledger','arrival-scene'];
    const surfaces=surfaceIds.map(id=>doc.getElementById(id)).filter(node=>studioVisible(node,doc)||node.classList.contains('on')).map(node=>({
      id:node.id,className:node.className,ariaHidden:node.getAttribute('aria-hidden'),dataset:{...node.dataset},
      scroll:{left:node.scrollLeft||0,top:node.scrollTop||0}
    }));
    const visibleText=[];const seenText=new Set();
    const textNodes=doc.querySelectorAll('h1,h2,h3,p,small,label,button,[role="heading"],[role="button"],[aria-live]');
    for(const node of textNodes){
      if(visibleText.length>=90||!studioVisible(node,doc))continue;
      const text=(node.innerText||node.textContent||'').replace(/\\s+/g,' ').trim();
      if(!text||text.length>280||seenText.has(text))continue;
      seenText.add(text);visibleText.push(text);
    }
    const controls=[...doc.querySelectorAll('button,[role="button"],a[href],input,select,textarea')].filter(node=>studioVisible(node,doc)).slice(0,80).map(node=>({
      tag:node.tagName.toLowerCase(),id:node.id||'',className:node.className||'',text:(node.innerText||node.getAttribute('aria-label')||node.value||'').replace(/\\s+/g,' ').trim().slice(0,180),
      disabled:Boolean(node.disabled||node.getAttribute('aria-disabled')==='true'),pressed:node.getAttribute('aria-pressed'),dataset:{...node.dataset}
    }));
    const assets=[];
    for(const node of [...doc.querySelectorAll('img,canvas,video')].filter(node=>studioVisible(node,doc)).slice(0,50)){
      const rect=node.getBoundingClientRect(),source=node.currentSrc||node.src||'';
      assets.push({tag:node.tagName.toLowerCase(),id:node.id||'',className:node.className||'',alt:node.alt||'',source:source.startsWith('data:')?'embedded-image':source,
        rect:{x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)}});
    }
    for(const node of [...doc.querySelectorAll('div,section,article,figure')]){
      if(assets.length>=90||!studioVisible(node,doc))continue;
      const background=win.getComputedStyle(node).backgroundImage;
      if(!background||background==='none')continue;
      const match=background.match(/url\\(["']?([^"')]+)["']?\\)/),rect=node.getBoundingClientRect();
      assets.push({tag:'background',id:node.id||'',className:node.className||'',source:match?(match[1].startsWith('data:')?'embedded-image':match[1]):background.slice(0,180),dataset:{...node.dataset},
        rect:{x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)}});
    }
    return {
      kind:'live_game_studio_frozen_scene',capturedAt:new Date().toISOString(),href:win.location.href,title:doc.title,
      viewport:{width:win.innerWidth,height:win.innerHeight,dpr:win.devicePixelRatio||1},screen:app?.dataset.screen||'unknown',
      eventId:eventSheet?.dataset.eventId||null,story:{phase:eventSheet?.dataset.storyPhase||null,step:eventSheet?.dataset.storyStep||null},
      focus:doc.activeElement?{tag:doc.activeElement.tagName.toLowerCase(),id:doc.activeElement.id||'',text:(doc.activeElement.innerText||doc.activeElement.getAttribute('aria-label')||'').trim().slice(0,180)}:null,
      game:gameState,surfaces,visibleText,controls,assets
    };
  };
  const setStudioFrozen=frozen=>{
    const doc=game.contentDocument;
    if(!doc)return;
    studioFrozen=frozen;
    doc.documentElement.classList.toggle('qa-exact-replay',frozen);
    if(frozen){
      studioMedia=[...doc.querySelectorAll('audio,video')].map(node=>({node,playing:!node.paused}));
      studioMedia.forEach(item=>{try{item.node.pause()}catch(error){}});
    }else{
      studioMedia.forEach(item=>{if(item.playing)try{item.node.play().catch(()=>{})}catch(error){}});
      studioMedia=[];
    }
  };
  window.addEventListener('message',event=>{
    if(event.source!==parent||!event.data||typeof event.data!=='object')return;
    if(event.data.type==='live-game-studio:freeze'){
      setStudioFrozen(true);
      setTimeout(()=>{
        let context;
        try{context=compactStudioContext()}catch(error){context={kind:'live_game_studio_frozen_scene',capturedAt:new Date().toISOString(),screen:'unknown',error:error.message}}
        parent.postMessage({type:'live-game-studio:frozen',requestId:event.data.requestId,context},event.origin||'*');
      },80);
    }else if(event.data.type==='live-game-studio:resume'){
      setStudioFrozen(false);
      parent.postMessage({type:'live-game-studio:resumed',requestId:event.data.requestId},event.origin||'*');
    }
  });
  window.addEventListener('beforeunload',captureView);
  const stageRefresh=data=>{
    pendingRevision=data.revision;
    if(applyWhenReady){applyWhenReady=false;applyRefresh();return}
    show('새 코드 준비됨 · 적용',false,true)
  };
  const applyRefresh=async()=>{
    if(applying)return;
    let revision=pendingRevision;
    if(!revision){
      show('최신 코드 확인 중',false,false,true);
      try{
        const response=await fetch('/__live/status',{cache:'no-store'});
        if(!response.ok)throw new Error('status '+response.status);
        const status=await response.json();
        if(status.building||status.queued){applyWhenReady=true;show('코드 빌드 중 · 완료 후 적용',false,false,true);return}
        revision=status.revision||Date.now();
      }catch(error){console.warn('[caravan live] latest revision failed',error);show('개발 서버 연결 확인',true);hide();return}
    }
    captureView();
    applying=true;
    pendingRevision=null;
    show('최신 코드 적용 중',false,false,true);
    game.src='/game?caravan-live=1&rev='+revision;
  };
  const applyStyles=async data=>{
    try{
      show('현재 화면에 스타일 반영 중');
      const response=await fetch('/__live/styles?rev='+data.revision,{cache:'no-store'});
      if(!response.ok)throw new Error('style '+response.status);
      const markup=await response.text();
      const parsed=new DOMParser().parseFromString('<!doctype html><html><head>'+markup+'</head><body></body></html>','text/html');
      const source=[...parsed.querySelectorAll('style')];
      const target=game.contentDocument;
      if(!target||!source.length)throw new Error('style document unavailable');
      const previous=[...target.querySelectorAll('style')];
      const fragment=target.createDocumentFragment();
      source.forEach(style=>{
        const replacement=target.createElement('style');
        [...style.attributes].forEach(attribute=>replacement.setAttribute(attribute.name,attribute.value));
        replacement.textContent=style.textContent;
        fragment.appendChild(replacement);
      });
      target.head.appendChild(fragment);
      previous.forEach(style=>style.remove());
      show('현재 화면 유지 · 스타일 반영됨');
      hide();
    }catch(error){
      console.warn('[caravan live] style patch failed',error);
      stageRefresh(data);
    }
  };
  badge.addEventListener('click',applyRefresh);
  game.addEventListener('load',()=>{
    setTimeout(restoreView,260);
    if(studioFrozen)setTimeout(()=>setStudioFrozen(true),280);
    try{parent.postMessage({type:'live-game-studio:ready'},'*')}catch(error){}
    if(applying){applying=false;show('최신 코드 반영됨');hide()}
  });
  const events=new EventSource('/__live/events');
  events.addEventListener('build',()=>show('변경 반영 중'));
  events.addEventListener('reload',event=>{const data=JSON.parse(event.data);if(data.mode==='styles')applyStyles(data);else stageRefresh(data)});
  events.addEventListener('build-error',()=>show('빌드 실패 · 이전 화면 유지',true));
  events.onerror=()=>show('개발 서버 연결 확인 중',true);
  </script></body></html>`;
}

async function imageFiles(directory=ASSETS,base=ASSETS,result=[]){
  const entries=await fsp.readdir(directory,{withFileTypes:true});
  for(const entry of entries){
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory()) await imageFiles(absolute,base,result);
    else if(IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())){
      const stat=await fsp.stat(absolute);
      result.push({absolute,relative:path.relative(base,absolute),mtime:stat.mtimeMs,size:stat.size});
    }
  }
  return result;
}

async function assetGallery(){
  const images=(await imageFiles()).sort((a,b)=>b.mtime-a.mtime);
  const cards=images.map(image=>{
    const source='/__live/asset/'+encodeURIComponent(image.relative)+'?v='+Math.round(image.mtime);
    const date=new Date(image.mtime).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    const size=(image.size/1024).toFixed(0)+' KB';
    return `<figure data-path="${esc(image.relative.toLowerCase())}"><img src="${source}" alt="${esc(image.relative)}" loading="lazy"><figcaption><b>${esc(image.relative)}</b><small>${date} · ${size}</small></figcaption></figure>`;
  }).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Caravan AI 이미지 · LIVE</title><style>
  :root{color-scheme:dark;--bg:#0b1017;--panel:#131b22;--line:#34434a;--ink:#ece5d8;--muted:#8e9b9d;--amber:#d79d43;--cyan:#52d2ca}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Apple SD Gothic Neo,Noto Sans KR,sans-serif}
  header{position:sticky;top:0;z-index:3;display:grid;grid-template-columns:1fr minmax(180px,360px);gap:18px;align-items:center;padding:16px 22px;background:rgba(11,16,23,.96);border-bottom:1px solid #503a1f}
  h1{margin:0;font-size:20px}h1 span{color:var(--amber)}header small{display:block;margin-top:4px;color:var(--muted)}
  input{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:6px;background:#080d12;color:var(--ink);font:inherit}
  main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;padding:18px 22px 40px}
  figure{min-width:0;margin:0;overflow:hidden;border:1px solid var(--line);border-radius:8px;background:var(--panel);box-shadow:0 8px 20px rgba(0,0,0,.2)}
  figure[hidden]{display:none}img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#070b10}
  figcaption{display:grid;gap:5px;padding:10px 11px}figcaption b{overflow:hidden;font-size:12px;white-space:nowrap;text-overflow:ellipsis}figcaption small{color:var(--muted);font-size:10px}
  #pulse{color:var(--cyan)}@media(max-width:620px){header{grid-template-columns:1fr;padding:14px}main{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px}h1{font-size:17px}}
  </style></head><body><header><div><h1>AI 이미지 <span>LIVE</span></h1><small><span id="pulse">●</span> assets/ 전체 ${images.length}개 · 최근 생성순 · 저장 즉시 갱신</small></div><input id="search" type="search" placeholder="파일명으로 찾기"></header><main>${cards}</main><script>
  const search=document.querySelector('#search'),figures=[...document.querySelectorAll('figure')];
  search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();figures.forEach(card=>card.hidden=q&&!card.dataset.path.includes(q));});
  const events=new EventSource('/__live/events');let timer;
  events.addEventListener('asset',()=>{clearTimeout(timer);timer=setTimeout(()=>location.reload(),700)});
  events.addEventListener('reload',()=>{clearTimeout(timer);timer=setTimeout(()=>location.reload(),250)});
  events.onerror=()=>document.querySelector('#pulse').style.color='#a94442';
  </script></body></html>`;
}

async function compiledStyles(){
  const html=await fsp.readFile(GAME,'utf8');
  return [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(match=>match[0]).join('\n');
}

function sendText(response,status,body,type='text/plain; charset=utf-8'){
  response.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});
  response.end(body);
}

function safeAssetPath(encoded){
  const relative=decodeURIComponent(encoded);
  const absolute=path.resolve(ASSETS,relative);
  return absolute.startsWith(ASSETS+path.sep)?absolute:null;
}

const server=http.createServer(async(request,response)=>{
  const url=new URL(request.url,`http://${request.headers.host||HOST}`);
  if(url.pathname==='/__live/events'){
    response.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
    response.write(`event: ready\ndata: ${JSON.stringify({revision:buildRevision})}\n\n`);
    clients.add(response);
    request.on('close',()=>clients.delete(response));
    return;
  }
  if(url.pathname==='/__live/assets'){
    try{ sendText(response,200,await assetGallery(),'text/html; charset=utf-8'); }
    catch(error){ sendText(response,500,error.stack||error.message); }
    return;
  }
  if(url.pathname==='/__live/styles'){
    try{ sendText(response,200,await compiledStyles(),'text/html; charset=utf-8'); }
    catch(error){ sendText(response,500,error.stack||error.message); }
    return;
  }
  if(url.pathname.startsWith('/__live/asset/')){
    const absolute=safeAssetPath(url.pathname.slice('/__live/asset/'.length));
    if(!absolute||!fs.existsSync(absolute)){ sendText(response,404,'Asset not found'); return; }
    response.writeHead(200,{'Content-Type':MIME[path.extname(absolute).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(absolute).pipe(response);
    return;
  }
  if(url.pathname==='/game'){
    if(!fs.existsSync(GAME)){ sendText(response,503,'첫 HTML 빌드를 기다리는 중입니다.'); return; }
    const stat=await fsp.stat(GAME);
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':stat.size,'Cache-Control':'no-store, max-age=0'});
    fs.createReadStream(GAME).pipe(response);
    return;
  }
  if(url.pathname==='/__live/status'){
    sendText(response,200,JSON.stringify({building,queued,revision:buildRevision,clients:clients.size},null,2),'application/json; charset=utf-8');
    return;
  }
  if(url.pathname==='/'||url.pathname==='/index.html'){
    sendText(response,200,gameShell(),'text/html; charset=utf-8');
    return;
  }
  sendText(response,404,'Not found');
});

function shutdown(signal){
  process.stdout.write(`\n[dev:live] ${signal} · 개발 서버 종료\n`);
  clearTimeout(buildTimer);
  for(const watcher of watchers) watcher.close();
  for(const response of clients){ try{ response.end(); }catch{} }
  if(activeBuild) activeBuild.kill('SIGTERM');
  server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(0),1000).unref();
}

process.on('SIGINT',()=>shutdown('SIGINT'));
process.on('SIGTERM',()=>shutdown('SIGTERM'));

server.listen(PORT,HOST,()=>{
  watchDirectory(path.join(ROOT,'src'),'src');
  watchDirectory(ASSETS,'assets');
  watchFile('build.sh');
  watchFile('tools/build-html.mjs');
  process.stdout.write(`\n서울까지 400km LIVE\n`);
  process.stdout.write(`게임       http://localhost:${PORT}/\n`);
  process.stdout.write(`AI 이미지  http://localhost:${PORT}/__live/assets\n`);
  process.stdout.write(`감시       src/ · assets/ · build.sh · tools/build-html.mjs\n`);
  process.stdout.write(`종료       Ctrl+C\n\n`);
  scheduleBuild('개발 서버 시작',100);
});

setInterval(()=>broadcast('ping',{at:Date.now()}),15000).unref();
