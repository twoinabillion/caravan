/* Presentation-only pagination. Cursor offsets count visible Unicode atoms, not
   bytes or HTML tags. Authored turns and gameplay receipts stay unchanged. */
const StoryPages=(()=>{
  // Match only safeHtml's authored markup. Unknown tags and entities are
  // displayed literally by fmt, so their characters must not disappear.
  const tokens=text=>String(text||'').match(/<span (?:class="(?:ai|em)"|style="color:var\(--faded\)")>|<\/span>|[^]/gu)||[];
  const tag=t=>/^<\/?([a-z][\w-]*)\b/i.exec(t);
  const visible=t=>!tag(t)||/^<br\b/i.test(t);
  const length=text=>tokens(text).filter(visible).length;
  function slice(text,start=0,end=Infinity){
    const parts=tokens(text),stack=[];let pos=0,out='',begun=false;
    for(const part of parts){
      if(pos>=end)break;
      const match=tag(part);
      if(!begun&&pos>=start){out=stack.map(x=>x.raw).join('');begun=true;}
      if(match&&!/^<br\b/i.test(part)){
        const name=match[1].toLowerCase(),closing=part.startsWith('</');
        if(closing){const i=stack.map(x=>x.name).lastIndexOf(name);if(i>=0)stack.splice(i);}
        else if(!/\/>$/.test(part)&&!['img','hr','input','wbr'].includes(name))stack.push({name,raw:part});
        if(begun)out+=part;
      }else{if(begun)out+=part;pos++;}
    }
    if(begun)out+=stack.slice().reverse().map(x=>`</${x.name}>`).join('');
    return out;
  }
  function cursor(turns,value){
    let turn=Math.max(0,Math.min(turns.length,Math.floor(Number(value?.turn)||0)));
    let offset=Math.max(0,Math.floor(Number(value?.offset)||0));
    while(turn<turns.length&&offset>=length(turns[turn].text)) {turn++;offset=0;}
    return {turn,offset:turn===turns.length?0:offset};
  }
  function take(turns,start,fits){
    let at=cursor(turns,start);const rows=[];
    while(at.turn<turns.length){
      const original=turns[at.turn],count=length(original.text);
      const row={...original,text:slice(original.text,at.offset),sourceIndex:at.turn};
      // Never collapse a voiced beat into another beat: audio and authored cuts
      // must still have an explicit entry point.
      if(rows.length&&(original.scene||original.voice||original.sfx||rows.some(r=>r.voice||r.sfx)))break;
      if(fits([...rows,row])){rows.push(row);at={turn:at.turn+1,offset:0};continue;}
      if(rows.length){
        // Move a short question together with its reply when the pair fits a
        // fresh page. Do not leave the question alone below a long narration.
        const last=rows.at(-1);
        if(rows.length>1&&last.kind==='dialogue'&&row.kind==='dialogue'
          &&last.who!==row.who&&length(last.text)<90&&/[?？]["”’']?\s*$/.test(last.text)
          &&fits([last,row])){rows.pop();at={turn:last.sourceIndex,offset:0};}
        break;
      }
      // Keep a resource's object, name and signed amount together. Oversized
      // individual rows use the reader's existing explicit scroll fallback.
      if(original.atomic){rows.push(row);at={turn:at.turn+1,offset:0};break;}
      let lo=at.offset+1,hi=count,best=lo;
      while(lo<=hi){const mid=Math.floor((lo+hi)/2);
        if(fits([{...row,text:slice(original.text,at.offset,mid)}])){best=mid;lo=mid+1;}else hi=mid-1;
      }
      const atoms=tokens(original.text).filter(visible);
      // Prefer a sentence/word boundary near the fit, without dropping spaces.
      for(let p=best;p>at.offset+(best-at.offset)*.65;p--){
        if(/[\s.!?。…]$/.test(atoms[p-1]||'')){best=p;break;}
      }
      rows.push({...row,text:slice(original.text,at.offset,best)});
      at=cursor(turns,{turn:at.turn,offset:best});break;
    }
    return {rows,end:at,done:at.turn>=turns.length};
  }
  function readThrough(turns,end){
    const at=cursor(turns,end),rows=turns.slice(0,at.turn).map(row=>({...row}));
    if(at.turn<turns.length&&at.offset)rows.push({...turns[at.turn],text:slice(turns[at.turn].text,0,at.offset)});
    return rows;
  }
  return {length,slice,cursor,take,readThrough};
})();
