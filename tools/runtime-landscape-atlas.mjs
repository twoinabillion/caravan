import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {places,routeFlows,newRoutes,sources} from './landscape-atlas-data.mjs';

// Production mapping of reviewed full panoramas. Files remain preserved;
// ROAD_CONTINUITY owns each shared arrival/stop/departure crop.
export function runtimeAtlas(root){
 const graph=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-routes/manifest.json'))).routes;
 const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 const routes=graph.map(r=>({id:r.id,from:r.from,to:r.to,km:r.km,
  file:`assets/ui/road-studies/atlas-v1/${r.id}.webp`,
  flow:routeFlows[r.id],landform:[places[r.from].terrain,places[r.to].terrain],
  references:[...new Set([...places[r.from].sources,...places[r.to].sources])],
  origin:newRoutes.includes(r.id)?'landform-corrected-master':'existing-full-panorama-reviewed',
  width:2160,height:720,viewport:1080}));
 for(const r of routes){if(!r.flow||r.landform.some(x=>!x))throw Error('Missing terrain brief: '+r.id);r.sha256=hash(r.file);}
 const cities={};
 // Fixed ownership, independent of arrival history. Corrected geography wins;
 // the approved Busan/Yangsan/Miryang strip continues to own its three crops.
 for(const r of [...routes.filter(r=>newRoutes.includes(r.id)),...routes]){
  cities[r.from]??={route:r.id,x:0};cities[r.to]??={route:r.id,x:1080};
 }
 if(routes.length!==78||Object.keys(cities).length!==58)throw Error('Incomplete runtime landscape atlas');
 return {version:2,enabled:true,styleId:'caravan-grounded-cinematic-v1',width:2160,height:720,viewport:1080,
  sourceBudget:'1080 source pixels per viewport; uniform scale, top sky crop only',
  geography:'Regional terrain interpretation; fictional stops/game distances retained, not surveyed road views.',
  sources,cities,routes};
}
