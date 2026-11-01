'use strict';
// Read-only QA projection of the actual public map's known-node route planner.
// No game state is changed, and no service inventory or future outcome is exposed.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function installSource(){
 const src=fs.readFileSync(path.join(root,'src/06-mapgraph.js'),'utf8');
 const start=src.indexOf('  function shortestPath(start,target){'),end=src.indexOf('  const pathEdges=',start);
 if(start<0||end<0)throw Error('Public map source contract changed');
 return `(()=>{${src.slice(start,end)}
  const visible=id=>typeof id==='string'&&Array.isArray(S?.known)&&S.known.includes(id);
  globalThis.qaPublicMap={from:(from,to)=>visible(from)&&visible(to)?shortestPath(from,to):null,
    to:to=>visible(S?.driving?.to||S?.at)&&visible(to)?pathTo(to):null};
 })()`;
}
function apply(source){
 const replace=(old,next)=>{if(!source.includes(old))throw Error('Public map observer anchor changed: '+old);source=source.replace(old,next)};
 replace('  const G=ctx.g,D=ctx.d,S=()=>ctx.s;',`  const G=ctx.g,D=ctx.d,S=()=>ctx.s;
  vm.runInContext(${JSON.stringify(installSource())},ctx);
  const publicDistance=(from,to)=>ctx.qaPublicMap.from(from,to)?.km??null;`);
 for(const expr of ['G.questGraphDistance(n.id,plan.waypoint||plan.target,true)','G.questGraphDistance(n.id,s.recruitQ.target,true)','G.questGraphDistance(n.id,s.quest.to,true)','G.questGraphDistance(n.id,id,true)','G.questGraphDistance(a.id,target,true)','G.questGraphDistance(b.id,target,true)'])replace(expr,expr.replace('G.questGraphDistance','publicDistance').replace(',true)',')'));
 replace('return {...snap(),',`return {...snap(),publicMapRoutes:Object.fromEntries(s.known.map(id=>[id,copy(ctx.qaPublicMap.to(id))])),`);
 if(source.includes('G.questGraphDistance('))throw Error('Unfiltered graph distance remains in observer');
 return source;
}
module.exports={installSource,apply};
