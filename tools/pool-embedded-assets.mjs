// Delivery-only interning of whole quoted base64 literals in the game script.
// CSS/HTML are untouched; images/audio keep exactly the same encoded bytes.
import {parseSync} from 'vite';
export function poolEmbeddedAssets(html) {
  const start=html.indexOf('<script>'), end=html.indexOf('</script>',start);
  if(start<0||end<start)throw Error('Missing game script');
  const offset=start+'<script>'.length, script=html.slice(offset,end);
  const parsed=parseSync('embedded-game.js',script,{sourceType:'script'});
  if(parsed.errors.length)throw Error('Cannot parse embedded game for asset interning');
  const literals=[];
  const visit=node=>{
    if(!node||typeof node!=='object')return;
    const value=node.type==='Literal'?node.value:
      node.type==='TemplateLiteral'&&!node.expressions.length?node.quasis[0].value.cooked:null;
    if(typeof value==='string'){
      const assets=[...value.matchAll(/data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g)].map(m=>m[0]);
      if(assets.length)literals.push({value,assets,start:node.start,end:node.end});
    }
    for(const child of Object.values(node))if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);
  };
  visit(parsed.program);
  const counts=new Map();
  for(const {assets} of literals)for(const value of assets)counts.set(value,(counts.get(value)||0)+1);
  const values=[...counts].filter(([value,count])=>count>1&&value.length>256).map(([value])=>value);
  if(!values.length)return {html,pooled:0,savedBytes:0};
  const indexes=new Map(values.map((v,i)=>[v,i]));
  const parts=[];let cursor=0;
  for(const entry of literals.filter(e=>e.assets.some(v=>indexes.has(v))).sort((a,b)=>a.start-b.start)){
    const terms=[];let at=0;
    for(const match of entry.value.matchAll(/data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g)){
      if(!indexes.has(match[0]))continue;
      if(match.index>at)terms.push(JSON.stringify(entry.value.slice(at,match.index)));
      terms.push(`CARAVAN_EMBEDDED[${indexes.get(match[0])}]`);at=match.index+match[0].length;
    }
    if(at<entry.value.length)terms.push(JSON.stringify(entry.value.slice(at)));
    parts.push(script.slice(cursor,entry.start),'('+terms.join('+')+')');cursor=entry.end;
  }
  parts.push(script.slice(cursor));const body=parts.join('');
  // Preserve any leading strict-mode directive. The table is immutable strings,
  // not saved gameplay state and not an asynchronous fetch.
  const directive=/^\s*(['"])use strict\1;/.exec(body);
  const at=directive?directive[0].length:0;
  const code=body.slice(0,at)+`\nconst CARAVAN_EMBEDDED=${JSON.stringify(values)};\n`+body.slice(at);
  const result=html.slice(0,offset)+code+html.slice(end);
  return {html:result,pooled:values.length,savedBytes:Buffer.byteLength(html)-Buffer.byteLength(result)};
}
