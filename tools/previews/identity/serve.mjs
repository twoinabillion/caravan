// Isolated visual fixtures. This server never reads or writes the LIVE save.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'artifacts/director-pass-2026-09-11/crew-preliminary.save.json'),'utf8'));
http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost:4180');
  if(!['/crew','/full'].includes(url.pathname)){res.writeHead(404);res.end('Use /crew or /full');return;}
  const fixture=structuredClone(baseline);
  fixture.pendingPresentation=null;fixture._chain=null;fixture._storyQueue=[];fixture.ended=false;fixture.driving=null;
  if(url.pathname==='/full'){
    fixture.party=Object.keys(fixture.comps);fixture.dog=true;
    fixture.injuries={parkss:{label:'발목 염좌',days:2}};
    fixture.up={...fixture.up,cabin:true,bunk:true,jumpseat:true,curtain:true};
  }
  const setup=`UI.boot();\nG.importSave(${JSON.stringify(JSON.stringify(fixture))});\nUI.restoreQaView({screen:'game'}).then(()=>{document.documentElement.classList.remove('qa-exact-replay');document.querySelector('#dk-crew').click();});`;
  const html=fs.readFileSync(path.join(root,'서울까지400km.html'),'utf8').replace('UI.boot();',setup);
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4180,'127.0.0.1',()=>process.stdout.write('Identity QA: http://localhost:4180/crew and /full\n'));
