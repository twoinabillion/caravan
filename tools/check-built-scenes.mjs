#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {unpackBytes} from './encode-embedded-assets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function arrayEnd(s,start){let quote=null,escaped=false,depth=0;for(let i=start;i<s.length;i++){const c=s[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='[')depth++;else if(c===']'&&!--depth)return i+1}throw Error('Unterminated asset pool');}
// Evaluate the built scene module and the scene assignments from the built expansion,
// not source text patterns. Stubs only cover data unrelated to scene registration.
export async function inspectBuiltScenes(html,{sceneDir=path.join(root,'assets/scenes'),includeAssets=false}={}){
 const scriptStart=html.indexOf('<script>'),scriptEnd=html.indexOf('</script>',scriptStart);if(scriptStart<0||scriptEnd<0)throw Error('Missing game script');
 const script=html.slice(scriptStart+8,scriptEnd),poolMarker='const CARAVAN_EMBEDDED=',poolAt=script.indexOf(poolMarker),D={dalgujiVisual:{refs:[]},eventScenes:{},eventTurnScenes:{},nodeScenes:{},eventSceneTypes:{},nodePreviewScenes:{},upgradeArt:{},upgradeItemArt:{}};
 const context=vm.createContext({D,CARAVAN_URI:(prefix,encoded,length)=>prefix+Buffer.from(unpackBytes(encoded,length)).toString('base64')});
 if(poolAt>=0){const start=poolAt+poolMarker.length,end=arrayEnd(script,start);vm.runInContext(script.slice(poolAt,end)+';globalThis.CARAVAN_EMBEDDED=CARAVAN_EMBEDDED;',context,{timeout:120000})}
 const start=script.indexOf('D.scenes = {'),end=script.indexOf('\nD.offlineFoley=',start);if(start<0||end<0)throw Error('Built scene module boundaries missing');vm.runInContext(script.slice(start,end),context,{timeout:120000});
 const expansion=script.indexOf('(()=>{if(typeof D===`undefined`)return;const sceneAssets=',end),desc=script.indexOf('Object.assign(D.sceneDescriptions,',expansion);if(expansion<0||desc<0)throw Error('Built scene expansion boundaries missing');vm.runInContext(script.slice(expansion,desc)+'})();',context,{timeout:120000});
 const files=new Map();for(const dir of [sceneDir,path.join(root,'assets/intro')])for(const name of fs.readdirSync(dir)){if(!/\.(webp|jpe?g|png)$/i.test(name))continue;const bytes=fs.readFileSync(path.join(dir,name));{const id=hash(bytes),file=path.relative(root,path.join(dir,name)).split(path.sep).join('/');const matches=files.get(id)||[];matches.push(file);files.set(id,matches)}}
 const errors=[],cache=new Map(),sceneAssets=[];for(const [key,value] of Object.entries(D.scenes)){
  if(typeof value!=='string'||!/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)){errors.push(`${key}: non-embedded scene ${String(value).slice(0,160)}`);continue}
  if(!cache.has(value)){const [header,encoded]=value.split(',');const bytes=Buffer.from(encoded,'base64');let issue='';if(bytes.toString('base64')!==encoded)issue='invalid base64';else if(!files.has(hash(bytes)))issue='embedded bytes do not match any local scene asset';else try{const meta=await sharp(bytes).metadata();const wanted=header.slice('data:image/'.length,header.indexOf(';'));if(meta.format!==wanted||!meta.width||!meta.height)issue='invalid image format or dimensions';}catch{issue='invalid image bytes'}cache.set(value,{issue,sha256:hash(bytes)})}
  const entry=cache.get(value);if(entry.issue)errors.push(`${key}: ${entry.issue}`);else if(includeAssets){const matches=files.get(entry.sha256);sceneAssets.push({key,file:matches.length===1?matches[0]:null,sha256:entry.sha256,...(matches.length>1?{candidates:matches}:{})});}
 }
 const result={keys:Object.keys(D.scenes).length,uniqueImages:cache.size,errors};if(includeAssets)result.sceneAssets=sceneAssets;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const file=path.join(root,'서울까지400km.html');if(!fs.existsSync(file))throw Error('서울까지400km.html 없음: 먼저 npm run build:html 실행');const r=await inspectBuiltScenes(fs.readFileSync(file,'utf8'));if(r.errors.length){console.error(r.errors.join('\n'));console.error(`${r.errors.length} scene entries failed`);process.exitCode=1}else console.log(`✅ 빌드 장면 ${r.keys}개, 고유 이미지 ${r.uniqueImages}개: 내장 이미지·원본 바이트 확인`)}
