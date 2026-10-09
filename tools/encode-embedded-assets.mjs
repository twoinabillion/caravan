// Lossless delivery encoding only. Every decoded image/audio URI is byte-identical.
import {parseSync} from 'vite';
const alphabet=Array.from({length:95},(_,i)=>String.fromCharCode(i+32)).filter(c=>!['"',"'",'\\','<','>','`',' '].includes(c)).slice(0,85).join('');
export function packBytes(buffer){
 let result='';
 for(let i=0;i<buffer.length;i+=4){let n=0;for(let j=0;j<4;j++)n=n*256+(buffer[i+j]||0);let s='';for(let j=0;j<5;j++){s=alphabet[n%85]+s;n=Math.floor(n/85);}result+=s;}
 return result;
}
export function unpackBytes(encoded,length){
 const bytes=new Uint8Array(length);let at=0;
 for(let i=0;i<encoded.length;i+=5){let n=0;for(let j=0;j<5;j++)n=n*85+alphabet.indexOf(encoded[i+j]);for(let j=3;j>=0;j--){if(at+j<length)bytes[at+j]=n%256;n=Math.floor(n/256);}at+=4;}
 return bytes;
}
export function encodeEmbeddedAssets(html){
 const start=html.indexOf('<script>')+8,end=html.indexOf('</script>',start),script=html.slice(start,end);
 const parsed=parseSync('game.js',script,{sourceType:'script'});if(parsed.errors.length)throw Error('Asset encoding parse failed');
 const entries=[];const visit=node=>{if(!node||typeof node!=='object')return;
  if(node.type==='Literal'&&typeof node.value==='string'&&/^data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+$/.test(node.value)&&node.value.length>1024)entries.push(node);
  for(const child of Object.values(node))if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);
 };visit(parsed.program);
 const parts=[];let cursor=0;
 for(const entry of entries.sort((a,b)=>a.start-b.start)){
  const comma=entry.value.indexOf(','),prefix=entry.value.slice(0,comma+1),bytes=Buffer.from(entry.value.slice(comma+1),'base64'),encoded=packBytes(bytes);
  if(!Buffer.from(unpackBytes(encoded,bytes.length)).equals(bytes))throw Error('Lossless asset check failed');
  parts.push(script.slice(cursor,entry.start),`CARAVAN_URI(${JSON.stringify(prefix)},${JSON.stringify(encoded)},${bytes.length})`);cursor=entry.end;
 }
 parts.push(script.slice(cursor));let body=parts.join('');
 const decoder=`const CARAVAN_ALPHABET=${JSON.stringify(alphabet)},CARAVAN_LOOKUP=new Uint8Array(128);for(let i=0;i<85;i++)CARAVAN_LOOKUP[CARAVAN_ALPHABET.charCodeAt(i)]=i;function CARAVAN_URI(prefix,encoded,length){const bytes=new Uint8Array(length);let at=0;for(let i=0;i<encoded.length;i+=5){const n=((((CARAVAN_LOOKUP[encoded.charCodeAt(i)]*85+CARAVAN_LOOKUP[encoded.charCodeAt(i+1)])*85+CARAVAN_LOOKUP[encoded.charCodeAt(i+2)])*85+CARAVAN_LOOKUP[encoded.charCodeAt(i+3)])*85+CARAVAN_LOOKUP[encoded.charCodeAt(i+4)]);bytes[at++]=n>>>24;if(at<length)bytes[at++]=n>>>16;if(at<length)bytes[at++]=n>>>8;if(at<length)bytes[at++]=n;}let binary='';for(let i=0;i<length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return prefix+btoa(binary);}\n`;
 const directive=/^\s*(['"])use strict\1;/.exec(body),at=directive?directive[0].length:0;
 body=body.slice(0,at)+decoder+body.slice(at);
 const result=html.slice(0,start)+body+html.slice(end);
 return {html:result,assets:entries.length,savedBytes:Buffer.byteLength(html)-Buffer.byteLength(result)};
}
