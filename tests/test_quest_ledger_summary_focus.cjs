const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07d-ui-quests.js','utf8');
function fixture(){
 const handlers=[],nodes=[];let active;
 const make=(tag,id,{tabindex=null,hidden=false}={})=>{const node={tagName:tag.toUpperCase(),id,tabindex,
  focus(){active=node;},getClientRects:()=>hidden?[]:[{}],closest:()=>null};nodes.push(node);return node;};
 const first=make('button','back'),tab=make('button','completed'),list=make('div','list',{tabindex:0}),summary=make('summary','evidence'),last=make('summary','receipt'),hidden=make('summary','hidden',{hidden:true});
 const nativeOrder=[first,tab,list,summary,last],outside={id:'background-departure',focus(){active=outside;}};
 const ledger={contains:node=>nodes.includes(node),querySelectorAll:selector=>nodes.filter(node=>
  node.tagName==='BUTTON'&&selector.includes('button')||node.tabindex!==null&&selector.includes('[tabindex]')||node.tagName==='SUMMARY'&&selector.split(',').includes('summary'))};
 const document={get activeElement(){return active;},addEventListener:(type,handler)=>handlers.push(handler)};
 const q={isOpen:()=>true,root:{querySelector:()=>ledger},close(){throw Error('Unexpected Escape');}};
 const start=source.indexOf("    document.addEventListener('keydown',event=>{");
 const end=source.indexOf("    window.addEventListener('questledgerchange'",start);
 assert(start>=0&&end>start);
 vm.runInNewContext('(function(){'+source.slice(start,end)+'}).call(q)',{q,document});
 const press=(node,shiftKey=false)=>{active=node;let prevented=false;handlers[0]({key:'Tab',shiftKey,preventDefault(){prevented=true;}});
  if(!prevented){const index=nativeOrder.indexOf(node),next=nativeOrder[index+(shiftKey?-1:1)]||outside;next.focus();}
  return {prevented,active};};
 return {first,list,summary,last,hidden,press};
}
test('Tab from the scrollable notebook list reaches native evidence disclosure instead of wrapping',()=>{
 const f=fixture(),result=f.press(f.list);assert.equal(result.prevented,false);assert.equal(result.active,f.summary);
});
test('Tab from the final visible disclosure wraps to close; hidden disclosures do not extend the trap',()=>{
 const f=fixture(),result=f.press(f.last);assert.equal(result.prevented,true);assert.equal(result.active,f.first);
});
test('reverse Tab from first control reaches the final native disclosure; disclosure can return to list',()=>{
 const f=fixture();assert.equal(f.press(f.first,true).active,f.last);assert.equal(f.press(f.summary,true).active,f.list);
});
