// Authoring/release gate. This module is not an image-quality judge: a signed
// per-road visual review is required in addition to geometry and byte checks.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHash}=require('node:crypto');
const hash=b=>createHash('sha256').update(b).digest('hex');
function dimensions(b){
 if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return [b.readUInt32BE(16),b.readUInt32BE(20)];
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){
  for(let p=12;p+8<=b.length;){const tag=b.toString('ascii',p,p+4),n=b.readUInt32LE(p+4),d=p+8;
   if(tag==='VP8X')return [b.readUIntLE(d+4,3)+1,b.readUIntLE(d+7,3)+1];
   if(tag==='VP8L'){const bits=b.readUInt32LE(d+1);return [(bits&16383)+1,((bits>>>14)&16383)+1];}
   if(tag==='VP8 ')return [b.readUInt16LE(d+6)&16383,b.readUInt16LE(d+8)&16383];
   p=d+n+(n%2);
  }
 }
 throw Error('unsupported continuous image format');
}
function validate(root,m,{requireComplete=false,resolve=p=>path.join(root,p)}={}){
 const fail=s=>{throw Error(s);};
 const edges=vm.runInNewContext(fs.readFileSync(path.join(root,'src/03-data.js'),'utf8')+';D.edges');
 const connected=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-environment/connected-v1.json')));
 const ids=new Set(edges.flatMap(([a,b])=>[a,b]));
 if(m.version!==3||m.viewport!==1024||m.height!==576)fail('continuous manifest geometry');
 if(Object.keys(m.nodes||{}).length!==ids.size||[...ids].some(id=>!m.nodes[id]))fail('node coverage');
 const nodes={};
 for(const id of ids){const n=m.nodes[id],bytes=fs.readFileSync(resolve(n.file));
  if(hash(bytes)!==n.sha256)fail('node hash mismatch: '+id);
  const [w,h]=dimensions(bytes);if(h!==576||w<1024||!Number.isInteger(n.x)||n.x<0||n.x+1024>w)fail('node geometry: '+id);
  nodes[id]={...n,width:w,height:h};
 }
 if(m.routes?.length!==edges.length||new Set(m.routes.map(r=>r.id)).size!==edges.length)fail('graph coverage');
 let accepted=0;const pending=[];
 for(const [from,to,km] of edges){const id=[from,to].sort().join('--'),r=m.routes.find(r=>r.id===id);
  if(!r)fail('graph coverage: '+id);
  if(r.from!==from||r.to!==to||r.km!==km)fail('route orientation/distance: '+id);
  if(r.status==='shared'){
   if(!connected.routes.some(([a,b,d])=>a===from&&b===to&&d===km))fail('unknown shared route: '+id);
   if(hash(fs.readFileSync(resolve(connected.file)))!==connected.sha256)fail('shared hash mismatch');
   accepted++;continue;
  }
  if(r.status==='pending'){pending.push(id);continue;}
  if(r.status!=='accepted'||!r.review?.file||!r.review.accepted||!r.review.reviewedAt)fail('review evidence required: '+id);
  const review=JSON.parse(fs.readFileSync(resolve(r.review.file)));
  const checks=['geometry','style','joins','crop320','crop360','crop480','forward','reverse'];
  if(review.route!==id||review.accepted!==true||checks.some(k=>review.checks?.[k]!==true))fail('review evidence required: '+id);
  if(review.fromSha256!==nodes[from].sha256||review.toSha256!==nodes[to].sha256||review.joinSha256!==hash(fs.readFileSync(path.join(root,'tools/continuous-route-join.cjs'))))fail('stale route review: '+id);
  const c=r.connector;if(!c||c.width!==2048||c.height!==576)fail('connector geometry: '+id);
  const bytes=fs.readFileSync(resolve(c.file));
  if(hash(bytes)!==c.sha256||review.sha256!==c.sha256)fail('connector hash: '+id);
  const [w,h]=dimensions(bytes);if(w!==2048||h!==576)fail('connector geometry: '+id);
  accepted++;
 }
 if((requireComplete||m.enabled===true)&&pending.length)fail('unaccepted road art: '+pending.join(', '));
 return {nodes,routes:m.routes,accepted,pending,ready:pending.length===0};
}
module.exports={validate,dimensions};
