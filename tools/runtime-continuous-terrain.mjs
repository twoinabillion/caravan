import fs from'node:fs';
import path from'node:path';
import contract from'./continuous-route-contract.cjs';

export function runtimeContinuous(root,manifest,embed){
 const base={enabled:false,nodes:{},corridors:{},routes:[]};
 if(manifest.enabled!==true)return base;
 const checked=contract.validate(root,manifest,{requireComplete:true}),nodes={},corridors={};
 for(const [id,n]of Object.entries(checked.nodes)){
  if(n.width!==2048||n.height!==576||n.x!==512||n.identityReference||!n.review?.file)throw Error('unaccepted city art: '+id);
  const review=JSON.parse(fs.readFileSync(path.join(root,n.review.file)));
  if(review.node!==id||review.sha256!==n.sha256||review.accepted!==true||['identity','style','outskirts','crop320','crop360','crop480'].some(k=>review.checks?.[k]!==true))throw Error('unaccepted city art: '+id);
 }
 for(const r of checked.routes){
  if(r.status!=='accepted'||!r.kind||r.connector?.width!==2048)throw Error('unaccepted continuous road: '+r.id);
  if(corridors[r.kind]&&(corridors[r.kind].file!==r.connector.file||corridors[r.kind].sha256!==r.connector.sha256))throw Error('conflicting continuous corridor: '+r.kind);
  corridors[r.kind]={file:r.connector.file,sha256:r.connector.sha256};
 }
 // No image is embedded until every node and road has passed the gate above.
 for(const [id,n]of Object.entries(checked.nodes))nodes[id]={source:embed(n.file)};
 for(const [kind,c]of Object.entries(corridors))corridors[kind]={source:embed(c.file)};
 return {enabled:true,viewport:1024,width:2048,height:576,overlap:512,nodes,corridors,routes:checked.routes.map(({id,from,to,km,kind})=>({id,from,to,km,kind}))};
}
