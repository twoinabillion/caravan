import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const files={
 '/':['index.html','text/html; charset=utf-8'],
 '/dialogue.js':['dialogue.js','text/javascript; charset=utf-8'],
 '/passenger.css':['passenger.css','text/css; charset=utf-8'],
 '/legacy':['legacy-parchment.html','text/html; charset=utf-8'],
 '/assets/passenger-scene.png':['assets/passenger-scene.png','image/png'],
 '/assets/passenger-panel.png':['assets/passenger-panel.png','image/png'],
 '/assets/passenger-choice.png':['assets/passenger-choice.png','image/png'],
 '/assets/passenger-wordmark.png':['assets/passenger-wordmark.png','image/png'],
 '/assets/NotoSansKR.ttf':['assets/NotoSansKR.ttf','font/ttf'],
 '/assets/BlackHanSans-Regular.ttf':['assets/BlackHanSans-Regular.ttf','font/ttf'],
 '/scene.webp':['../../../assets/scenes/event-road-coffee-van-v2.webp','image/webp'],
 '/portrait.png':['../../../assets/portraits/passer_merchant.png','image/png'],
 '/paper.png':['../../../assets/ui/event-manuscript-panel-tall-v1.png','image/png']
};
const port=Number(process.env.CARAVAN_DIALOGUE_PREVIEW_PORT||4177);
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const entry=files[pathname];
 if(!entry){res.writeHead(404);res.end('Not found');return;}
 const file=path.resolve(here,entry[0]);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'Content-Type':entry[1],'Cache-Control':'no-store'});
 fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Dialogue preview: http://localhost:${port}/`));
